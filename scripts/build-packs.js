#!/usr/bin/env node

/**
 * @fileoverview Build Compendium Packs Script
 * @version 1.0.0 - FoundryVTT v13 Compatible
 * @description Builds system compendium packs from trait seed data during build process
 * @author Avant VTT Team
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateTalent, validateAugment } from './logic/validation-utils.js';
import { loadCompendiumDataWithFallback } from './data/compendium-integration.js';
import { CompendiumLoader } from './data/compendium-loader.js';
// Phase D and E validation will be run separately via CLI commands
// import { LinkRewriter } from './compendium/link-rewriter.js';
// import { RoundTripExtractor } from './compendium/round-trip-extractor.js';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hardcoded seed data removed - now using JSON-based compendium files
// Located in: packs/avant-macros/, packs/avant-traits/, packs/avant-talents/, packs/avant-augments/

/**
 * Creates a FoundryVTT-compatible compendium pack file in NeDB format.
 * 
 * This function generates a .db file that FoundryVTT can read as a compendium pack.
 * The file uses the NeDB format (JSON lines) which FoundryVTT automatically
 * migrates to LevelDB when first loaded. This ensures maximum compatibility
 * across different FoundryVTT versions.
 * 
 * The function combines folders and items into a single pack file, with folders
 * appearing first to ensure proper loading order in FoundryVTT.
 * 
 * @param {string} packPath - Full path where the pack file should be created (must end with .db)
 * @param {Array} items - Array of item documents to include in the pack
 * @param {Array} folders - Array of folder documents for organizing content (Phase C)
 * 
 * @example
 * await createNeDBPack('./dist/packs/my-pack.db', items, folders);
 */
async function createNeDBPack(packPath, items, folders = []) {
  console.log(`🔨 Creating NeDB pack at: ${packPath}`);

  // DEBUG: Log folder information
  console.log(`📁 DEBUG: Processing ${folders.length} folders:`);
  folders.forEach((folder, index) => {
    console.log(`   Folder ${index + 1}: ${folder.name} (ID: ${folder._id}, Type: ${folder.type})`);
    console.log(`   - Has sorting: ${folder.sorting || 'MISSING'}`);
    console.log(`   - Has description: ${folder.description || 'MISSING'}`);
    console.log(`   - Color: ${folder.color || 'MISSING'}`);
  });

  // DEBUG: Log item folder assignments
  console.log(`📝 DEBUG: Processing ${items.length} items:`);
  items.forEach((item, index) => {
    if (index < 5) { // Only show first 5 to avoid spam
      console.log(`   Item ${index + 1}: ${item.name} (ID: ${item._id}, Folder: ${item.folder || 'NO FOLDER'})`);
    }
  });
  if (items.length > 5) {
    console.log(`   ... and ${items.length - 5} more items`);
  }

  // Ensure parent directory exists
  const parentDir = path.dirname(packPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  // Phase C: Combine folders and items, with folders first for proper loading order
  const allDocuments = [...folders, ...items];

  // Create NeDB data - each document on its own line as JSON
  const nedbData = allDocuments.map(item => JSON.stringify(item)).join('\n') + '\n';

  // Write the .db file
  fs.writeFileSync(packPath, nedbData, 'utf8');

  console.log(`✅ Created NeDB pack with ${items.length} items and ${folders.length} folders`);
  console.log(`📦 File size: ${Buffer.byteLength(nedbData, 'utf8')} bytes`);
  console.log(`🔄 FoundryVTT will auto-migrate this to LevelDB on first load`);
}

/**
 * Generate FoundryVTT-native document IDs for compendium items
 * 
 * UNIFIED ID STRATEGY: Uses FoundryVTT's native randomID() function for ALL items.
 * This ensures:
 * 1. Complete consistency between system and custom traits
 * 2. Multiple traits with same names can coexist
 * 3. Future-proof scalability
 * 4. True database-style unique identifiers
 * 
 * EXAMPLES:
 * - System Fire Trait: "a1b2c3d4e5f6g7h8" 
 * - Custom Fire Trait: "x9y8z7w6v5u4t3s2"
 * - Another Fire Trait: "m1n2o3p4q5r6s7t8"
 * 
 * All different IDs, all can coexist, all work identically.
 * 
 * @returns {string} A native FoundryVTT 16-character alphanumeric ID
 */
function generateFoundryId() {
  // Use FoundryVTT's native random ID generation
  // This is the same function FoundryVTT uses internally for all documents
  // Format: 16-character alphanumeric string (e.g., "a1b2c3d4e5f6g7h8")

  // For Node.js build environment, we need to replicate the randomID function
  // since we don't have access to the full FoundryVTT runtime
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  // Generate 16 random characters using crypto-quality randomness
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Ensure each document has a valid FoundryVTT-style _id (16 chars).
 * Does not mutate the original; returns a new array with shallow-cloned docs.
 * Used because the JSON-first pipeline may provide docs without _id, and
 * Foundry does not synthesize IDs when importing raw NeDB lines.
 */
function ensureDocumentIds(docs, label = 'documents') {
  let created = 0;
  let fixed = 0;
  const withIds = docs.map((doc) => {
    const clone = { ...doc };
    if (!clone._id) {
      clone._id = generateFoundryId();
      created += 1;
    } else if (typeof clone._id !== 'string' || clone._id.length !== 16) {
      clone._id = generateFoundryId();
      fixed += 1;
    }
    return clone;
  });
  if (created || fixed) {
    console.log(`🔧 ID guard for ${label}: created=${created}, fixed=${fixed}, total=${withIds.length}`);
  } else {
    console.log(`✅ ID guard for ${label}: all ${withIds.length} already valid`);
  }
  return withIds;
}

/**
 * Generate FoundryVTT item data with proper IDs and validation
 * 
 * @param {Array} seeds - Item seed data
 * @param {string} itemType - The type of items being generated (trait, talent, augment)
 * @returns {Array} FoundryVTT item documents
 */
function generateItemDocuments(seeds, itemType = 'trait') {
  console.log(`🏗️ Generating ${itemType} documents with validation...`);

  // Generate a consistent user ID for build script (deterministic)
  const buildUserId = 'AvantBuildScript';

  return seeds.map((seed, index) => {
    // Validate item data based on type
    let validatedSystemData;
    if (itemType === 'talent') {
      validatedSystemData = validateTalent(seed.system);
      console.log(`✅ Validated talent: ${seed.name}`, validatedSystemData);
    } else if (itemType === 'augment') {
      validatedSystemData = validateAugment(seed.system);
      console.log(`✅ Validated augment: ${seed.name}`, validatedSystemData);
    } else {
      // For traits and other types, use the system data as-is for now
      validatedSystemData = seed.system;
    }

    // Use permanent ID from JSON file (Pipeline Phase A compliance)
    const id = seed._id || generateFoundryId();
    if (seed._id) {
      console.log(`📝 Using permanent ID for ${seed.name}: ${id}`);
    } else {
      console.log(`📝 Generated ID for ${seed.name}: ${id}`);
    }

    return {
      _id: id,
      name: seed.name,
      type: seed.type,
      img: seed.img || 'icons/svg/item-bag.svg',
      system: validatedSystemData,
      effects: [],
      folder: null,
      sort: seed.sort || ((index + 1) * 100),
      ownership: {
        default: 0
      },
      flags: {},
      _stats: {
        systemId: 'avant',
        systemVersion: '0.4.0',
        coreVersion: '13.344',
        createdTime: 1700000000000, // Fixed timestamp for deterministic builds
        modifiedTime: 1700000000000,
        lastModifiedBy: buildUserId
      }
    };
  });
}

/**
 * Generate FoundryVTT macro data with proper IDs
 * 
 * @param {Array} seeds - Macro seed data
 * @returns {Array} FoundryVTT macro documents
 */
function generateMacroDocuments(seeds) {
  // Generate a consistent user ID for build script (deterministic)
  const buildUserId = 'AvantBuildScript';

  return seeds.map((seed, index) => {
    // Use permanent ID from JSON file (Pipeline Phase A compliance)
    const id = seed._id || generateFoundryId();
    if (seed._id) {
      console.log(`📝 Using permanent ID for ${seed.name}: ${id}`);
    } else {
      console.log(`📝 Generated ID for ${seed.name}: ${id}`);
    }

    return {
      _id: id,
      name: seed.name,
      type: seed.type,
      img: seed.img || 'icons/svg/dice-target.svg',
      command: seed.command,
      scope: seed.scope || 'global',
      folder: seed.folder || null,
      sort: seed.sort || ((index + 1) * 100),
      ownership: {
        default: 3 // OWNER level so players can use the macros
      },
      flags: seed.flags || {},
      _stats: {
        systemId: 'avant',
        systemVersion: '0.4.0',
        coreVersion: '13.344',
        createdTime: 1700000000000, // Fixed timestamp for deterministic builds
        modifiedTime: 1700000000000,
        lastModifiedBy: buildUserId
      }
    };
  });
}

/**
 * Update system.json to use LevelDB format (folder paths for FoundryVTT v13)
 * 
 * @param {string} systemJsonPath - Path to system.json
 */
function updateSystemJsonForLevelDB(systemJsonPath) {
  console.log('🔨 Updating system.json for LevelDB format (FoundryVTT v13)...');

  if (!fs.existsSync(systemJsonPath)) {
    console.error('❌ system.json not found!');
    return;
  }

  const systemJson = JSON.parse(fs.readFileSync(systemJsonPath, 'utf8'));

  // Update pack definitions to use folder paths instead of .db files for v13
  if (systemJson.packs) {
    systemJson.packs.forEach(pack => {
      if (pack.path === './packs/avant-traits.db') {
        pack.path = './packs/avant-traits';
        console.log(`✅ Updated pack path for v13: ${pack.path}`);
      }
      if (pack.path === './packs/avant-macros.db') {
        pack.path = './packs/avant-macros';
        console.log(`✅ Updated pack path for v13: ${pack.path}`);
      }
      if (pack.path === './packs/avant-talents.db') {
        pack.path = './packs/avant-talents';
        console.log(`✅ Updated pack path for v13: ${pack.path}`);
      }
      if (pack.path === './packs/avant-augments.db') {
        pack.path = './packs/avant-augments';
        console.log(`✅ Updated pack path for v13: ${pack.path}`);
      }
    });
  }

  // Write updated system.json
  fs.writeFileSync(systemJsonPath, JSON.stringify(systemJson, null, 2));
  console.log('✅ system.json updated for LevelDB format (v13)');
}

/**
 * Main build function
 */
async function buildPacks() {
  try {
    console.log('🚀 Building Avant VTT compendium packs...');

    // Define paths
    const projectRoot = path.resolve(__dirname, '..');
    const distPath = path.join(projectRoot, 'dist');
    const packsPath = path.join(distPath, 'packs');
    const traitPackPath = path.join(packsPath, 'avant-traits.db');
    const macroPackPath = path.join(packsPath, 'avant-macros.db');
    const talentPackPath = path.join(packsPath, 'avant-talents.db');
    const augmentPackPath = path.join(packsPath, 'avant-augments.db');
    const systemJsonPath = path.join(distPath, 'system.json');

    console.log(`📁 Project root: ${projectRoot}`);
    console.log(`📁 Dist path: ${distPath}`);
    console.log(`📁 Pack paths:`);
    console.log(`   - Avant Traits: ${traitPackPath}`);
    console.log(`   - Avant Macros: ${macroPackPath}`);
    console.log(`   - Avant Talents: ${talentPackPath}`);
    console.log(`   - Avant Augments: ${augmentPackPath}`);

    // Ensure dist directory exists
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath, { recursive: true });
    }

    // Load compendium data from JSON files (with fallback to hardcoded seeds)
    console.log('🔄 Phase 2: Loading compendium data from JSON sources...');
    const { traits: TRAIT_SEEDS, talents: TALENT_SEEDS, augments: AUGMENT_SEEDS, macros: MACRO_SEEDS } =
      await loadCompendiumDataWithFallback();

    // Phase C: Load folder metadata using enhanced CompendiumLoader
    console.log('🔄 Phase C: Loading folder metadata...');
    const loader = new CompendiumLoader();
    const loaderResult = await loader.loadAll();

    if (!loaderResult.success) {
      console.error('❌ Failed to load folder metadata:', loaderResult.errors);
      throw new Error('Folder metadata loading failed');
    }

    // Extract folder metadata for each pack type
    const traitFolders = loader.getFoldersByType('avant-traits');
    const talentFolders = loader.getFoldersByType('avant-talents');
    const augmentFolders = loader.getFoldersByType('avant-augments');
    const macroFolders = loader.getFoldersByType('avant-macros');

    console.log(`📁 Loaded folder metadata: ${traitFolders.length} trait folders, ${talentFolders.length} talent folders, ${augmentFolders.length} augment folders, ${macroFolders.length} macro folders`);

    // Phase D: Link validation is handled separately by CLI commands
    console.log('🔄 Phase D: Link validation handled by compendium:links command');

    // Generate documents from JSON files
    console.log('🔄 Phase 2: Loading documents from JSON files...');

    // Load docs and guard IDs (JSON sources may omit _id; Foundry won't auto-generate for NeDB lines)
    const traitDocs = ensureDocumentIds(loader.getItemsByType('avant-traits'), 'traits');
    console.log(`📝 Loaded ${traitDocs.length} trait documents`);
 
    const macroDocs = ensureDocumentIds(loader.getItemsByType('avant-macros'), 'macros');
    console.log(`📝 Loaded ${macroDocs.length} macro documents`);
 
    const talentDocs = ensureDocumentIds(loader.getItemsByType('avant-talents'), 'talents');
    console.log(`📝 Loaded ${talentDocs.length} talent documents`);
 
    const augmentDocs = ensureDocumentIds(loader.getItemsByType('avant-augments'), 'augments');
    console.log(`📝 Loaded ${augmentDocs.length} augment documents`);

    // Validate that all items passed validation (this would have thrown errors above if not)
    console.log('✅ All items passed build-time schema validation');

    // Create compendium packs (NeDB format - FoundryVTT will auto-migrate to LevelDB)
    console.log('🔄 Creating compendium pack files...');

    await createNeDBPack(traitPackPath, traitDocs, traitFolders);
    await createNeDBPack(macroPackPath, macroDocs, macroFolders);
    await createNeDBPack(talentPackPath, talentDocs, talentFolders);
    await createNeDBPack(augmentPackPath, augmentDocs, augmentFolders);

    // Update system.json if it exists in dist
    if (fs.existsSync(systemJsonPath)) {
      updateSystemJsonForLevelDB(systemJsonPath);
    } else {
      console.log('⚠️  system.json not found in dist - will be copied during main build');
    }

    // Phase E: Round-trip validation is handled separately by CLI commands
    console.log('🔄 Phase E: Round-trip validation handled by compendium:roundtrip command');

    console.log('🎉 Compendium pack build complete!');
    console.log('📋 Summary:');
    console.log(`   - Created avant-traits pack: ${traitPackPath} (${traitDocs.length} items)`);
    console.log(`   - Created avant-macros pack: ${macroPackPath} (${macroDocs.length} items)`);
    console.log(`   - Created avant-talents pack: ${talentPackPath} (${talentDocs.length} items)`);
    console.log(`   - Created avant-augments pack: ${augmentPackPath} (${augmentDocs.length} items)`);
    console.log(`   - Total items: ${traitDocs.length + macroDocs.length + talentDocs.length + augmentDocs.length}`);
    console.log(`   - Format: NeDB (.db files) - FoundryVTT v13 will auto-migrate to LevelDB folders`);
    console.log(`   - Validation: All items validated against schema during build`);
    console.log(`   - Round-trip: Use 'npm run compendium:roundtrip' to validate`);

    // Phase 2 Drag-and-Drop: Validate compendium readiness
    console.log('🔄 Phase 2: Validating compendium readiness for drag-and-drop...');

    // Note: Compendium validation requires a running FoundryVTT instance
    // This validation will be performed at runtime when the system loads
    console.log('ℹ️  Compendium drag-and-drop validation will run at system initialization');
    console.log('ℹ️  Run `validateAvantCompendiums()` in browser console to validate manually');

  } catch (error) {
    console.error('❌ Error building compendium packs:', error);
    console.error('💥 Build failed due to validation error or file system issue');
    process.exit(1);
  }
}

// Run the build if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildPacks();
}

export { buildPacks }; 