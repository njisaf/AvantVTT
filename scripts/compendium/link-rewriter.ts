#!/usr/bin/env node

/**
 * @fileoverview Link Rewriter - Phase D: Link Rewriting
 * @version 1.0.0 - Pipeline Implementation
 * @description Converts trait references to UUID format for FoundryVTT compatibility
 * @author Avant VTT Team
 * 
 * This module handles the automatic conversion of plain text trait references
 * into proper FoundryVTT UUID links. For example, a talent that references
 * "Fire" in its traits array will be converted to:
 * "@UUID[Compendium.avant.avant-traits.{id}]{Fire}"
 * 
 * This ensures proper cross-referencing and clickable links in the game interface.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Represents a compendium document that can be processed for link rewriting.
 */
interface CompendiumDocument {
  /** Unique 16-character identifier for the document */
  _id: string;
  /** Display name of the document */
  name: string;
  /** Document type (trait, talent, augment, etc.) */
  type: string;
  /** System-specific data that may contain trait references */
  system?: any;
  /** Additional properties */
  [key: string]: any;
}

/**
 * Defines a pattern-based rule for rewriting specific types of links.
 */
interface LinkRewriteRule {
  /** Regular expression pattern to match */
  pattern: RegExp;
  /** Function to generate replacement text */
  replacement: (match: string, ...args: any[]) => string;
  /** Human-readable description of what this rule does */
  description: string;
}

/**
 * Results of applying link rewriting to a document or text.
 */
interface LinkRewriteResult {
  /** Whether the rewriting process succeeded */
  success: boolean;
  /** Original text before rewriting */
  originalText: string;
  /** Text after rewriting has been applied */
  rewrittenText: string;
  /** Array of all changes made during rewriting */
  changes: LinkChange[];
  /** Array of errors encountered during rewriting */
  errors: string[];
}

/**
 * Represents a single change made during link rewriting.
 */
interface LinkChange {
  /** Type of change made */
  type: 'compendium-link' | 'trait-reference' | 'item-reference';
  /** Original text that was replaced */
  original: string;
  /** New text that replaced the original */
  rewritten: string;
  /** Description of where the change occurred */
  location: string;
}

/**
 * Configuration options for the link rewriting process.
 */
interface LinkRewriteOptions {
  /** Whether to output detailed progress information */
  verbose: boolean;
  /** Whether to perform a dry run without making changes */
  dryRun: boolean;
  /** Optional custom path to the packs directory */
  packsDirectory?: string;
}

/**
 * Main class for converting trait references to UUID format (Phase D).
 * 
 * This class processes all compendium items and converts plain text trait references
 * into proper FoundryVTT UUID links. This enables clickable cross-references in the
 * game interface and ensures proper data relationships.
 * 
 * Key features:
 * - Converts trait names to UUID format: "Fire" → "@UUID[Compendium.avant.avant-traits.{id}]{Fire}"
 * - Validates that referenced traits actually exist
 * - Supports dry-run mode for testing changes
 * - Provides detailed reporting of conversion results
 * - Handles multiple trait references per item
 * 
 * @example
 * const rewriter = new LinkRewriter();
 * const result = await rewriter.rewriteLinks({ dryRun: false });
 * if (result.success) {
 *   console.log(`Converted ${result.totalConverted} trait references`);
 * }
 */
export class LinkRewriter {
  /** Path to the directory containing pack subdirectories */
  private packsDirectory: string;
  /** Map of pack names to their contained documents for quick lookup */
  private compendiumMap: Map<string, Map<string, CompendiumDocument>> = new Map();
  private nameToIdMap: Map<string, string> = new Map();
  private rewriteRules: LinkRewriteRule[] = [];
  private totalChanges: number = 0;
  private processedFiles: number = 0;

  constructor(packsDirectory?: string) {
    this.packsDirectory = packsDirectory || path.join(__dirname, '../../packs');
    this.initializeRewriteRules();
  }

  /**
   * Initialize rewrite rules for different link patterns
   */
  private initializeRewriteRules(): void {
    // Rule 1: @Compendium[pack.name]{label} → @UUID[Compendium.pack.name.{id}]{label}
    this.rewriteRules.push({
      pattern: /@Compendium\[([^.]+)\.([^.]+)\]\{([^}]+)\}/g,
      replacement: (match, system, pack, label) => {
        const id = this.findItemIdByName(pack, label);
        if (id) {
          return `@UUID[Compendium.${system}.${pack}.${id}]{${label}}`;
        }
        return match; // Return original if no match found
      },
      description: 'Convert @Compendium references to @UUID format'
    });

    // Rule 2: @Compendium[pack.name] → @UUID[Compendium.pack.name.{id}]
    this.rewriteRules.push({
      pattern: /@Compendium\[([^.]+)\.([^.]+)\]/g,
      replacement: (match, system, pack) => {
        // For bare compendium references, we need more context
        return match; // Keep original for now
      },
      description: 'Convert bare @Compendium references (needs context)'
    });

    // Rule 3: Plain trait names in trait arrays → UUID references
    // This will be handled separately in processTraitReferences
  }

  /**
   * Load all compendium data and build name-to-ID mapping
   */
  async loadCompendiumData(): Promise<void> {
    console.log('🔄 Loading compendium data for link rewriting...');

    if (!fs.existsSync(this.packsDirectory)) {
      throw new Error(`Packs directory not found: ${this.packsDirectory}`);
    }

    // Get all pack directories
    const packDirs = fs.readdirSync(this.packsDirectory, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log(`📦 Found pack types: ${packDirs.join(', ')}`);

    // Load each pack
    for (const packDir of packDirs) {
      await this.loadPackData(packDir);
    }

    console.log(`📊 Loaded ${this.nameToIdMap.size} items across ${this.compendiumMap.size} packs`);
  }

  /**
   * Load data from a specific pack directory
   */
  private async loadPackData(packName: string): Promise<void> {
    const packPath = path.join(this.packsDirectory, packName);
    const packMap = new Map<string, CompendiumDocument>();

    try {
      // Get all JSON files (excluding metadata files)
      const files = fs.readdirSync(packPath)
        .filter(file => file.endsWith('.json') && !file.startsWith('_'))
        .sort();

      console.log(`📄 Loading ${packName}: ${files.length} files`);

      for (const file of files) {
        const filePath = path.join(packPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsedData = JSON.parse(fileContent);

        let documents: CompendiumDocument[];

        // Handle both single documents and arrays (hybrid support like CompendiumValidator)
        if (Array.isArray(parsedData)) {
          // Array format: multiple documents per file
          documents = parsedData;
        } else {
          // Single format: one document per file
          documents = [parsedData];
        }

        // Process each document
        for (const item of documents) {
          if (item._id && item.name) {
            packMap.set(item._id, item);

            // Build name-to-ID mapping for easy lookup
            const nameKey = `${packName}.${item.name}`;
            this.nameToIdMap.set(nameKey, item._id);

            // Also add just the name for trait references
            if (item.type === 'trait') {
              this.nameToIdMap.set(item.name, item._id);
            }
          }
        }
      }

      this.compendiumMap.set(packName, packMap);
      console.log(`✅ ${packName}: ${packMap.size} items loaded`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error loading pack ${packName}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Find item ID by name in a specific pack
   */
  private findItemIdByName(packName: string, itemName: string): string | null {
    const nameKey = `${packName}.${itemName}`;
    return this.nameToIdMap.get(nameKey) || this.nameToIdMap.get(itemName) || null;
  }

  /**
   * Process all files in the compendium for link rewriting
   */
  async processAllFiles(options: LinkRewriteOptions = { verbose: false, dryRun: false }): Promise<boolean> {
    console.log('🔄 Starting link rewriting process...');

    if (options.dryRun) {
      console.log('🧪 DRY RUN MODE: No files will be modified');
    }

    let allSuccessful = true;
    this.totalChanges = 0;
    this.processedFiles = 0;

    // Process each pack
    for (const packName of this.compendiumMap.keys()) {
      const packSuccess = await this.processPackFiles(packName, options);
      if (!packSuccess) {
        allSuccessful = false;
      }
    }

    // Summary
    console.log('\n📊 Link Rewriting Summary:');
    console.log(`   📁 Files processed: ${this.processedFiles}`);
    console.log(`   🔄 Total changes: ${this.totalChanges}`);
    console.log(`   🎯 Status: ${allSuccessful ? '✅ SUCCESS' : '❌ ERRORS'}`);

    return allSuccessful;
  }

  /**
   * Process files in a specific pack
   */
  private async processPackFiles(packName: string, options: LinkRewriteOptions): Promise<boolean> {
    const packPath = path.join(this.packsDirectory, packName);
    let packSuccess = true;

    try {
      // Get all JSON files (excluding metadata files)
      const files = fs.readdirSync(packPath)
        .filter(file => file.endsWith('.json') && !file.startsWith('_'))
        .sort();

      console.log(`\n📦 Processing ${packName}: ${files.length} files`);

      for (const file of files) {
        const filePath = path.join(packPath, file);
        const fileSuccess = await this.processFile(filePath, packName, options);

        if (!fileSuccess) {
          packSuccess = false;
        }

        this.processedFiles++;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error processing pack ${packName}: ${errorMessage}`);
      packSuccess = false;
    }

    return packSuccess;
  }

  /**
   * Process a single file for link rewriting
   */
  private async processFile(filePath: string, packName: string, options: LinkRewriteOptions): Promise<boolean> {
    const fileName = path.basename(filePath);

    try {
      // Read the file
      const originalContent = fs.readFileSync(filePath, 'utf8');
      const parsedData = JSON.parse(originalContent);

      let documents: CompendiumDocument[];
      let isArrayFile = false;

      // Handle both single documents and arrays
      if (Array.isArray(parsedData)) {
        // Array format: multiple documents per file
        documents = parsedData;
        isArrayFile = true;
      } else {
        // Single format: one document per file
        documents = [parsedData];
        isArrayFile = false;
      }

      let totalChanges = 0;
      let totalErrors = 0;
      let anyErrors = false;

      // Process each document
      for (let i = 0; i < documents.length; i++) {
        const item = documents[i];
        const docContext = isArrayFile ? ` (document ${i + 1})` : '';

        // Apply link rewriting
        const result = this.rewriteItemLinks(item, fileName + docContext);

        totalChanges += result.changes.length;
        totalErrors += result.errors.length;

        if (result.errors.length > 0) {
          anyErrors = true;
        }
      }

      // Update global counters
      this.totalChanges += totalChanges;

      // Report results
      if (totalChanges > 0) {
        if (options.verbose) {
          console.log(`  🔄 ${fileName}: ${totalChanges} changes across ${documents.length} document(s)`);
        } else {
          console.log(`  🔄 ${fileName}: ${totalChanges} changes`);
        }

        // Write the modified content (unless dry run)
        if (!options.dryRun) {
          const modifiedContent = JSON.stringify(isArrayFile ? documents : documents[0], null, 2);
          fs.writeFileSync(filePath, modifiedContent, 'utf8');
        }
      } else if (options.verbose) {
        console.log(`  ✅ ${fileName}: No changes needed`);
      }

      if (totalErrors > 0) {
        console.error(`  ❌ ${fileName}: ${totalErrors} errors across ${documents.length} document(s)`);
        return false;
      }

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error processing file ${fileName}: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Rewrite links in a single item
   */
  private rewriteItemLinks(item: CompendiumDocument, fileName: string): LinkRewriteResult {
    const result: LinkRewriteResult = {
      success: true,
      originalText: JSON.stringify(item),
      rewrittenText: '',
      changes: [],
      errors: []
    };

    try {
      // Process different types of links
      this.processDescriptionLinks(item, result, fileName);
      this.processTraitReferences(item, result, fileName);
      this.processRequirementLinks(item, result, fileName);
      this.processCommandLinks(item, result, fileName);

      result.rewrittenText = JSON.stringify(item);
      result.success = result.errors.length === 0;

    } catch (error) {
      result.success = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Rewriting failed: ${errorMessage}`);
    }

    return result;
  }

  /**
   * Process links in description fields
   */
  private processDescriptionLinks(item: CompendiumDocument, result: LinkRewriteResult, fileName: string): void {
    if (item.system?.description) {
      const original = item.system.description;
      const rewritten = this.applyRewriteRules(original);

      if (rewritten !== original) {
        item.system.description = rewritten;
        result.changes.push({
          type: 'compendium-link',
          original: original,
          rewritten: rewritten,
          location: `${fileName}.system.description`
        });
      }
    }
  }

  /**
   * Process trait references in trait arrays
   */
  private processTraitReferences(item: CompendiumDocument, result: LinkRewriteResult, fileName: string): void {
    if (item.system?.traits && Array.isArray(item.system.traits)) {
      for (let i = 0; i < item.system.traits.length; i++) {
        const traitName = item.system.traits[i];

        if (typeof traitName === 'string' && !traitName.startsWith('@UUID')) {
          const traitId = this.findItemIdByName('traits', traitName);

          if (traitId) {
            const uuidReference = `@UUID[Compendium.avant.avant-traits.${traitId}]{${traitName}}`;
            item.system.traits[i] = uuidReference;

            result.changes.push({
              type: 'trait-reference',
              original: traitName,
              rewritten: uuidReference,
              location: `${fileName}.system.traits[${i}]`
            });
          } else {
            result.errors.push(`Trait not found: ${traitName} in ${fileName}`);
          }
        }
      }
    }
  }

  /**
   * Process links in requirement fields
   */
  private processRequirementLinks(item: CompendiumDocument, result: LinkRewriteResult, fileName: string): void {
    if (item.system?.requirements) {
      const original = item.system.requirements;
      const rewritten = this.applyRewriteRules(original);

      if (rewritten !== original) {
        item.system.requirements = rewritten;
        result.changes.push({
          type: 'compendium-link',
          original: original,
          rewritten: rewritten,
          location: `${fileName}.system.requirements`
        });
      }
    }
  }

  /**
   * Process links in macro command fields
   */
  private processCommandLinks(item: CompendiumDocument, result: LinkRewriteResult, fileName: string): void {
    if (item.command) {
      const original = item.command;
      const rewritten = this.applyRewriteRules(original);

      if (rewritten !== original) {
        item.command = rewritten;
        result.changes.push({
          type: 'compendium-link',
          original: original,
          rewritten: rewritten,
          location: `${fileName}.command`
        });
      }
    }
  }

  /**
   * Apply all rewrite rules to a text string
   */
  private applyRewriteRules(text: string): string {
    let result = text;

    for (const rule of this.rewriteRules) {
      result = result.replace(rule.pattern, rule.replacement);
    }

    return result;
  }

  /**
   * Validate that all links are properly formatted and point to existing items
   */
  async validateLinks(options: LinkRewriteOptions = { verbose: false, dryRun: false }): Promise<boolean> {
    console.log('🔍 Validating link integrity...');

    let allValid = true;
    let totalLinks = 0;
    let brokenLinks = 0;

    // Process each pack
    for (const packName of this.compendiumMap.keys()) {
      const packValid = await this.validatePackLinks(packName, options);
      if (!packValid) {
        allValid = false;
      }
    }

    console.log('\n📊 Link Validation Summary:');
    console.log(`   🔗 Total links: ${totalLinks}`);
    console.log(`   ❌ Broken links: ${brokenLinks}`);
    console.log(`   🎯 Status: ${allValid ? '✅ ALL VALID' : '❌ BROKEN LINKS FOUND'}`);

    return allValid;
  }

  /**
   * Validate links in a specific pack
   */
  private async validatePackLinks(packName: string, options: LinkRewriteOptions): Promise<boolean> {
    const packPath = path.join(this.packsDirectory, packName);
    let packValid = true;

    try {
      const files = fs.readdirSync(packPath)
        .filter(file => file.endsWith('.json') && !file.startsWith('_'))
        .sort();

      console.log(`\n🔍 Validating ${packName}: ${files.length} files`);

      for (const file of files) {
        const filePath = path.join(packPath, file);
        const fileValid = await this.validateFileLinks(filePath, packName, options);

        if (!fileValid) {
          packValid = false;
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error validating pack ${packName}: ${errorMessage}`);
      packValid = false;
    }

    return packValid;
  }

  /**
   * Validate links in a single file
   */
  private async validateFileLinks(filePath: string, packName: string, options: LinkRewriteOptions): Promise<boolean> {
    const fileName = path.basename(filePath);

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const parsedData = JSON.parse(fileContent);

      let documents: CompendiumDocument[];

      // Handle both single documents and arrays
      if (Array.isArray(parsedData)) {
        // Array format: multiple documents per file
        documents = parsedData;
      } else {
        // Single format: one document per file
        documents = [parsedData];
      }

      // Find all @UUID references in all documents
      const uuidPattern = /@UUID\[([^\]]+)\]/g;
      const content = JSON.stringify(documents);
      const matches = Array.from(content.matchAll(uuidPattern));

      let fileValid = true;

      for (const match of matches) {
        const uuidPath = match[1];
        const isValid = this.validateUuidPath(uuidPath);

        if (!isValid) {
          console.error(`  ❌ ${fileName}: Invalid UUID path: ${uuidPath}`);
          fileValid = false;
        } else if (options.verbose) {
          console.log(`  ✅ ${fileName}: Valid UUID: ${uuidPath}`);
        }
      }

      return fileValid;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error validating file ${fileName}: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Validate a UUID path format
   */
  private validateUuidPath(uuidPath: string): boolean {
    // Check if it's a compendium reference
    if (uuidPath.startsWith('Compendium.')) {
      const parts = uuidPath.split('.');
      if (parts.length >= 4) {
        const [, system, fullPackName, id] = parts;

        // Map full pack names to directory names (now both use avant- prefix)
        const packNameMap: Record<string, string> = {
          'avant-traits': 'avant-traits',
          'avant-talents': 'avant-talents',
          'avant-augments': 'avant-augments',
          'avant-macros': 'avant-macros'
        };

        const packName = packNameMap[fullPackName];
        if (packName) {
          // Check if the item exists in our loaded data
          const packMap = this.compendiumMap.get(packName);
          if (packMap && packMap.has(id)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Get rewriting statistics
   */
  getStats(): {
    totalPacks: number;
    totalItems: number;
    totalChanges: number;
    processedFiles: number;
    rewriteRules: number;
  } {
    return {
      totalPacks: this.compendiumMap.size,
      totalItems: this.nameToIdMap.size,
      totalChanges: this.totalChanges,
      processedFiles: this.processedFiles,
      rewriteRules: this.rewriteRules.length
    };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options: LinkRewriteOptions = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    dryRun: args.includes('--dry-run') || args.includes('-n'),
    packsDirectory: args.find(arg => arg.startsWith('--packs='))?.split('=')[1]
  };

  const rewriter = new LinkRewriter(options.packsDirectory);

  const command = args[0] || 'rewrite';

  async function runCommand() {
    try {
      await rewriter.loadCompendiumData();

      switch (command) {
        case 'rewrite':
          const success = await rewriter.processAllFiles(options);
          process.exit(success ? 0 : 1);
          break;

        case 'validate':
          const valid = await rewriter.validateLinks(options);
          process.exit(valid ? 0 : 1);
          break;

        default:
          console.error(`❌ Unknown command: ${command}`);
          console.log('Available commands: rewrite, validate');
          process.exit(1);
      }

    } catch (error) {
      console.error('❌ Link rewriting failed:', error);
      process.exit(1);
    }
  }

  runCommand();
}

export default LinkRewriter;