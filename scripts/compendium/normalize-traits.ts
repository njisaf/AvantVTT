#!/usr/bin/env node

/**
 * Normalize Talent Traits: Replace human-readable trait names in talents with trait document IDs.
 *
 * Behavior:
 * - Scans packs/avant-traits/*.json to build a name → id index (case/trim insensitive)
 * - Applies synonyms: area → AOE, force → Magical
 * - Reads packs/avant-talents/talents.json and replaces each system.traits[] entry with the matching trait _id
 * - When a trait name isn't found, falls back to mechanics-traits → Unknown (created separately)
 * - Writes normalized output to _export/packs/avant-talents/talents.json (sources remain human-readable)
 * - Emits a report JSON in reports/trait-normalization-YYYYMMDD.json
 *
 * @example
 * tsx scripts/compendium/normalize-traits.ts
 *
 * @spec 04.compendium-integration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

type AnyDoc = Record<string, any>;

interface TraitIndexEntry {
  id: string;
  name: string;
  pack: string;
  systemCategory?: string;
}

interface NormalizationReport {
  timestamp: string;
  sourceFile: string;
  outputFile: string;
  traitsDirectory: string;
  totals: {
    talentsProcessed: number;
    traitsProcessed: number;
    traitsConverted: number;
    synonymsApplied: number;
    fallbacksUsed: number;
    distinctUnknowns: number;
    duplicatesDetected: number;
  };
  duplicates: Array<{ name: string; packs: string[] }>;
  fallbacks: Array<{ talent: string; originalTrait: string }>;
  synonyms: Array<{ original: string; mapped: string; talent?: string }>;
  notes: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const TRAITS_DIR = path.join(PROJECT_ROOT, 'packs', 'avant-traits');
const TALENTS_FILE = path.join(PROJECT_ROOT, 'packs', 'avant-talents', 'talents.json');
const OUTPUT_TALENTS_FILE = path.join(PROJECT_ROOT, '_export', 'packs', 'avant-talents', 'talents.json');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports');

const SYNONYMS: Record<string, string> = {
  'area': 'aoe',
  'force': 'magical'
};

/** Generate a Foundry-like 16-character ID */
function generateFoundryId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function normalizeName(s: string): string {
  return (s ?? '').toString().trim().toLowerCase();
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJsonFile(filePath: string): AnyDoc {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function writeJsonFile(filePath: string, data: unknown) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function listJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.json') && !e.name.startsWith('_'))
    .map((e) => path.join(dir, e.name))
    .sort();
}

function buildTraitIndex(): {
  byName: Map<string, TraitIndexEntry>;
  duplicates: Map<string, Set<string>>;
} {
  const byName = new Map<string, TraitIndexEntry>();
  const duplicates = new Map<string, Set<string>>();

  const jsonFiles = listJsonFiles(TRAITS_DIR);
  for (const file of jsonFiles) {
    const packName = path.basename(file);
    const data = readJsonFile(file);
    const docs: AnyDoc[] = Array.isArray(data) ? data : [data];

    for (const doc of docs) {
      if (!doc || typeof doc !== 'object') continue;
      const id = doc._id as string | undefined;
      const name = doc.name as string | undefined;
      const systemCategory = doc.system?.category as string | undefined;

      if (!id || !name) continue;

      const key = normalizeName(name);
      if (!byName.has(key)) {
        byName.set(key, { id, name, pack: packName, systemCategory });
      } else {
        // Track duplicates (same normalized name across multiple files)
        const set = duplicates.get(key) ?? new Set<string>();
        set.add(byName.get(key)!.pack);
        set.add(packName);
        duplicates.set(key, set);
      }
    }
  }

  return { byName, duplicates };
}

function findFallbackTraitId(index: Map<string, TraitIndexEntry>): string {
  const unk = index.get('unknown');
  if (!unk) {
    throw new Error(
      'Fallback trait "Unknown" not found in mechanics-traits. Ensure it exists before running normalization.'
    );
  }
  return unk.id;
}

function synonymize(name: string): { mapped: string; changed: boolean } {
  const n = normalizeName(name);
  const mapped = SYNONYMS[n];
  if (mapped) return { mapped, changed: true };
  return { mapped: n, changed: false };
}

function formatDateStamp(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

async function main() {
  console.log('🔧 Normalizing talent traits → ids');

  if (!fs.existsSync(TALENTS_FILE)) {
    console.error(`❌ Talents source not found: ${TALENTS_FILE}`);
    process.exit(1);
  }

  const { byName: traitIndex, duplicates } = buildTraitIndex();
  console.log(`📦 Indexed traits from ${TRAITS_DIR}: ${traitIndex.size} names`);

  const fallbackId = findFallbackTraitId(traitIndex);
  console.log(`🛟 Fallback trait id: ${fallbackId} (Unknown)`);

  const talentsData = readJsonFile(TALENTS_FILE);
  const talents: AnyDoc[] = Array.isArray(talentsData) ? talentsData : [talentsData];

  // Phase 1: Ensure _id fields are present in source talents.json and write back if needed
  const seenIds = new Set<string>();
  let createdIds = 0;
  let fixedDupes = 0;

  const talentsWithIds = talents.map((t) => {
    const clone = { ...t };
    let id: string | undefined = clone._id;

    // Validate id format
    if (!id || typeof id !== 'string' || id.length !== 16) {
      id = generateFoundryId();
      createdIds += 1;
    }
    // Ensure uniqueness within this file
    while (seenIds.has(id)) {
      id = generateFoundryId();
      fixedDupes += 1;
    }
    seenIds.add(id);
    clone._id = id;
    return clone;
  });

  if (createdIds > 0 || fixedDupes > 0) {
    writeJsonFile(TALENTS_FILE, talentsWithIds);
    console.log(
      `✍️  Wrote back _id fields to source: created=${createdIds}, de-duplicated=${fixedDupes} → ${TALENTS_FILE}`
    );
  } else {
    console.log('✅ All talents already had valid and unique _id fields in source.');
  }

  const report: NormalizationReport = {
    timestamp: new Date().toISOString(),
    sourceFile: path.relative(PROJECT_ROOT, TALENTS_FILE),
    outputFile: path.relative(PROJECT_ROOT, OUTPUT_TALENTS_FILE),
    traitsDirectory: path.relative(PROJECT_ROOT, TRAITS_DIR),
    totals: {
      talentsProcessed: 0,
      traitsProcessed: 0,
      traitsConverted: 0,
      synonymsApplied: 0,
      fallbacksUsed: 0,
      distinctUnknowns: 0,
      duplicatesDetected: 0
    },
    duplicates: [],
    fallbacks: [],
    synonyms: [],
    notes: []
  };

  // Record duplicates if any were detected while indexing
  if (duplicates.size > 0) {
    for (const [dupName, packs] of duplicates.entries()) {
      report.duplicates.push({ name: dupName, packs: Array.from(packs) });
    }
    report.totals.duplicatesDetected = report.duplicates.length;
  }

  // Normalize
  const unknownKeySet = new Set<string>();
  let convertedCount = 0;
  let totalTraitsEncountered = 0;
  let synonymsApplied = 0;
  let fallbacks = 0;

  const normalizedTalents: AnyDoc[] = talentsWithIds.map((talent: AnyDoc) => {
    report.totals.talentsProcessed += 1;

    const traitsArr: unknown = talent?.system?.traits;
    if (!Array.isArray(traitsArr)) return talent;

    const newTraits: string[] = [];

    for (const raw of traitsArr) {
      totalTraitsEncountered += 1;
      const original = String(raw ?? '').trim();

      // synonym mapping
      const { mapped, changed } = synonymize(original);
      if (changed) {
        synonymsApplied += 1;
        report.synonyms.push({ original, mapped, talent: String(talent?.name ?? '') });
      }

      const entry = traitIndex.get(mapped);
      if (entry) {
        newTraits.push(entry.id);
        convertedCount += 1;
      } else {
        // Fallback to Unknown
        newTraits.push(fallbackId);
        fallbacks += 1;
        unknownKeySet.add(mapped);
        report.fallbacks.push({ talent: String(talent?.name ?? ''), originalTrait: original });
      }
    }

    // Do not mutate other fields; replace only system.traits
    const clone = { ...talent, system: { ...talent.system, traits: newTraits } };
    return clone;
  });

  report.totals.traitsProcessed = totalTraitsEncountered;
  report.totals.traitsConverted = convertedCount;
  report.totals.synonymsApplied = synonymsApplied;
  report.totals.fallbacksUsed = fallbacks;
  report.totals.distinctUnknowns = unknownKeySet.size;

  // Write normalized output
  writeJsonFile(OUTPUT_TALENTS_FILE, normalizedTalents);
  console.log(`✅ Wrote normalized talents → ${OUTPUT_TALENTS_FILE}`);

  // Write report
  ensureDir(REPORTS_DIR);
  const reportFile = path.join(REPORTS_DIR, `trait-normalization-${formatDateStamp()}.json`);
  writeJsonFile(reportFile, report);
  console.log(`🧾 Report written → ${reportFile}`);

  // Console summary
  console.log('📊 Summary');
  console.log(`  Talents processed: ${report.totals.talentsProcessed}`);
  console.log(`  Traits processed:  ${report.totals.traitsProcessed}`);
  console.log(`  Converted:         ${report.totals.traitsConverted}`);
  console.log(`  Synonyms applied:  ${report.totals.synonymsApplied}`);
  console.log(`  Fallbacks used:    ${report.totals.fallbacksUsed}`);
  if (report.totals.duplicatesDetected > 0) {
    console.log(`  Duplicates:        ${report.totals.duplicatesDetected} names`);
  }

  // Exit non-zero only if fallback used AND policy says to fail; current policy allows fallback
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}

export default main;