#!/usr/bin/env node

/**
 * @fileoverview Avant Compendium Pipeline - Phase A: ID & Category Guard
 * @version 2.0.0 - Pipeline Implementation
 * @description Validates JSON compendium files for required _id and category fields
 * @author Avant VTT Team
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates a unique 16-character ID compatible with FoundryVTT compendium documents.
 * Uses a mix of uppercase letters, lowercase letters, and numbers to create a random identifier.
 * 
 * @returns {string} A 16-character random string (e.g., "Ab3Cd9Ef2Gh5Ij7K")
 * @example
 * const id = generateFoundryId();
 * // Returns something like: "mKpQ8jNxL3vR9wY2"
 */
function generateFoundryId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Represents the result of validating a compendium document or collection of documents.
 * Contains information about validation success, any errors found, warnings issued, and whether fixes were applied.
 */
interface ValidationResult {
  /** Whether the validation passed without critical errors */
  valid: boolean;
  /** Array of error messages for critical validation failures */
  errors: string[];
  /** Array of warning messages for non-critical issues */
  warnings: string[];
  /** Whether automatic fixes were applied to resolve issues */
  fixed: boolean;
}

/**
 * Represents the structure of a FoundryVTT compendium document.
 * This interface defines the required and optional fields for items stored in compendium packs.
 */
interface CompendiumDocument {
  /** Unique 16-character identifier for the document (required for compendium storage) */
  _id?: string;
  /** Display name of the document */
  name: string;
  /** Document type (e.g., "trait", "talent", "augment", "macro") */
  type: string;
  /** Optional category for organizing documents */
  category?: string;
  /** System-specific data structure containing game mechanics */
  system?: any;
  /** Path to the icon image file */
  img?: string;
  /** Additional properties allowed for flexibility */
  [key: string]: any;
}

/**
 * Configuration options for the compendium validation process.
 * Controls how validation is performed and what actions are taken when issues are found.
 */
interface ValidationOptions {
  /** Whether to automatically fix validation errors when possible */
  fix: boolean;
  /** Whether to output detailed information during validation */
  verbose: boolean;
  /** Optional custom path to the packs directory (defaults to relative path) */
  packsDirectory?: string;
}

/**
 * Main validation engine for Avant Compendium Pipeline (Phase A).
 * 
 * This class performs comprehensive validation of compendium JSON files to ensure they meet
 * FoundryVTT requirements and system standards. It checks for required fields, validates
 * data integrity, and can automatically fix common issues.
 * 
 * Key features:
 * - Validates required _id fields (16-character unique identifiers)
 * - Checks document structure and required properties
 * - Detects and reports duplicate IDs across all packs
 * - Can automatically generate missing IDs and fix structural issues
 * - Provides detailed reporting with error counts and fix summaries
 * 
 * @example
 * const validator = new CompendiumValidator();
 * const isValid = await validator.validateAll({ fix: true, verbose: true });
 * if (isValid) {
 *   console.log('All compendium files are valid!');
 * }
 */
export class CompendiumValidator {
  /** Path to the directory containing pack subdirectories */
  private packsDirectory: string;
  /** Map storing validation results for each pack */
  private validationResults: Map<string, ValidationResult> = new Map();
  /** Map tracking duplicate IDs and the files they appear in */
  private duplicateIds: Map<string, string[]> = new Map();
  /** Total number of documents processed across all packs */
  private totalDocuments = 0;
  /** Total number of documents that were automatically fixed */
  private totalFixed = 0;

  /**
   * Creates a new CompendiumValidator instance.
   * 
   * @param {string} [packsDirectory] - Optional custom path to packs directory. 
   *                                   If not provided, uses default relative path.
   */
  constructor(packsDirectory?: string) {
    this.packsDirectory = packsDirectory || path.join(__dirname, '../../packs');
  }

  /**
   * Validates all compendium files across all pack directories.
   * 
   * This is the main entry point for validation. It scans all pack directories,
   * validates each JSON file, checks for duplicate IDs, and provides a comprehensive
   * summary of the validation results.
   * 
   * @param {ValidationOptions} [options] - Configuration options for validation
   * @param {boolean} [options.fix=false] - Whether to automatically fix issues when possible
   * @param {boolean} [options.verbose=false] - Whether to output detailed information
   * @param {string} [options.packsDirectory] - Custom path to packs directory
   * 
   * @returns {Promise<boolean>} True if all files are valid, false if any issues found
   * 
   * @example
   * // Basic validation (read-only)
   * const isValid = await validator.validateAll();
   * 
   * @example
   * // Validation with automatic fixes
   * const isValid = await validator.validateAll({ fix: true, verbose: true });
   */
  async validateAll(options: ValidationOptions = { fix: false, verbose: false }): Promise<boolean> {
    console.log('🔍 Starting Avant Compendium Pipeline validation...');
    console.log(`📁 Packs directory: ${this.packsDirectory}`);

    if (!fs.existsSync(this.packsDirectory)) {
      console.error(`❌ Packs directory not found: ${this.packsDirectory}`);
      return false;
    }

    // Reset state
    this.validationResults.clear();
    this.duplicateIds.clear();
    this.totalDocuments = 0;
    this.totalFixed = 0;

    // Get all pack directories
    const packDirs = fs.readdirSync(this.packsDirectory, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log(`📦 Found pack types: ${packDirs.join(', ')}`);

    let allValid = true;

    // Validate each pack
    for (const packDir of packDirs) {
      const packPath = path.join(this.packsDirectory, packDir);
      const packValid = await this.validatePack(packDir, packPath, options);

      if (!packValid) {
        allValid = false;
      }
    }

    // Check for duplicate IDs across all packs
    this.checkDuplicateIds();

    // Print summary
    this.printValidationSummary(options);

    const duplicateCount = Array.from(this.duplicateIds.entries())
      .filter(([_, files]) => files.length > 1).length;

    return allValid && duplicateCount === 0;
  }

  /**
   * Validate a single pack directory
   */
  private async validatePack(packName: string, packPath: string, options: ValidationOptions): Promise<boolean> {
    console.log(`\n📋 Validating pack: ${packName}`);

    // Get all JSON files
    const jsonFiles = fs.readdirSync(packPath)
      .filter(file => file.endsWith('.json') && !file.startsWith('_'))
      .sort();

    if (jsonFiles.length === 0) {
      console.log(`  ⚠️  No JSON files found in ${packName}`);
      return true;
    }

    console.log(`  📄 Found ${jsonFiles.length} JSON files`);

    let packValid = true;
    const packResult: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      fixed: false
    };

    // Validate each file
    for (const jsonFile of jsonFiles) {
      const filePath = path.join(packPath, jsonFile);
      const fileResult = await this.validateFile(filePath, packName, options);

      if (!fileResult.valid) {
        packValid = false;
        packResult.valid = false;
      }

      if (fileResult.fixed) {
        this.totalFixed++;
        packResult.fixed = true;
      }

      packResult.errors.push(...fileResult.errors);
      packResult.warnings.push(...fileResult.warnings);

      // Log file result
      if (options.verbose || !fileResult.valid) {
        const status = fileResult.valid ? '✅' : '❌';
        const fixedText = fileResult.fixed ? ' (fixed)' : '';
        console.log(`    ${status} ${jsonFile}${fixedText}`);

        if (fileResult.errors.length > 0) {
          fileResult.errors.forEach(error => console.log(`      ❌ ${error}`));
        }
        if (fileResult.warnings.length > 0) {
          fileResult.warnings.forEach(warning => console.log(`      ⚠️  ${warning}`));
        }
      }
    }

    this.validationResults.set(packName, packResult);

    console.log(`  📊 ${packName}: ${jsonFiles.length} files, ${packResult.errors.length} errors, ${packResult.warnings.length} warnings`);

    return packValid;
  }

  /**
   * Validate a single JSON file
   */
  private async validateFile(filePath: string, packName: string, options: ValidationOptions): Promise<ValidationResult> {
    const fileName = path.basename(filePath);
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      fixed: false
    };

    try {
      // Read and parse JSON
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const parsedData = JSON.parse(fileContent);

      let documents: CompendiumDocument[];
      let modified = false;

      // Handle both single documents and arrays (hybrid support like CompendiumLoader)
      if (Array.isArray(parsedData)) {
        // Monolithic format: array of documents
        documents = parsedData;
        console.log(`    📋 Validating array file: ${fileName} (${documents.length} documents)`);
      } else {
        // Split format: single document per file
        documents = [parsedData];
        console.log(`    📄 Validating single document: ${fileName}`);
      }

      // Validate each document in the file
      for (let i = 0; i < documents.length; i++) {
        const document = documents[i];
        const docContext = Array.isArray(parsedData) ? `[${i}]` : '';

        // Validate _id field
        if (!document._id) {
          if (options.fix) {
            document._id = generateFoundryId();
            modified = true;
            result.fixed = true;
            result.warnings.push(`Generated missing _id${docContext}: ${document._id}`);
          } else {
            result.valid = false;
            result.errors.push(`Missing required _id field${docContext}`);
          }
        } else {
          // Validate _id format (16 characters)
          if (document._id.length !== 16) {
            if (options.fix) {
              document._id = generateFoundryId();
              modified = true;
              result.fixed = true;
              result.warnings.push(`Fixed invalid _id format${docContext}: ${document._id}`);
            } else {
              result.valid = false;
              result.errors.push(`Invalid _id format${docContext}: must be 16 characters, got ${document._id.length}`);
            }
          }

          // Check for duplicate _id
          const existingFiles = this.duplicateIds.get(document._id) || [];
          existingFiles.push(`${packName}/${fileName}${docContext}`);
          this.duplicateIds.set(document._id, existingFiles);
        }

        // Validate required fields
        if (!document.name) {
          result.valid = false;
          result.errors.push(`Missing required name field${docContext}`);
        }

        if (!document.type) {
          result.valid = false;
          result.errors.push(`Missing required type field${docContext}`);
        }

        // Validate category (required for traits, inferred for others)
        if (!document.category && !document.system?.category) {
          if (options.fix) {
            const inferredCategory = this.inferCategory(packName, document.type);
            if (!document.system) document.system = {};
            document.system.category = inferredCategory;
            modified = true;
            result.fixed = true;
            result.warnings.push(`Inferred system.category${docContext}: ${inferredCategory}`);
          } else {
            if (packName === 'traits') {
              result.valid = false;
              result.errors.push(`Missing required category field for trait${docContext}`);
            } else {
              result.warnings.push(`Missing category field${docContext} (will be inferred from pack type)`);
            }
          }
        }

        // Type-specific validation
        this.validateTypeSpecific(document, result);

        // Update document count
        this.totalDocuments++;
      }

      // Save modifications if any
      if (modified && options.fix) {
        const updatedContent = JSON.stringify(Array.isArray(parsedData) ? documents : documents[0], null, 2);
        fs.writeFileSync(filePath, updatedContent, 'utf8');
      }

    } catch (error) {
      result.valid = false;
      if (error instanceof SyntaxError) {
        result.errors.push(`Invalid JSON syntax: ${error.message}`);
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`File read error: ${errorMessage}`);
      }
    }

    return result;
  }

  /**
   * Infer category from pack name and document type
   */
  private inferCategory(packName: string, docType: string): string {
    // Category mapping based on pack type
    const categoryMap: Record<string, string> = {
      'traits': 'general',
      'talents': 'combat',
      'augments': 'cybernetic',
      'macros': 'utility'
    };

    return categoryMap[packName] || 'general';
  }

  /**
   * Validate type-specific requirements
   */
  private validateTypeSpecific(document: CompendiumDocument, result: ValidationResult): void {
    switch (document.type) {
      case 'trait':
        if (!document.system?.color) {
          result.warnings.push('Missing system.color field for trait');
        }
        if (!document.system?.icon) {
          result.warnings.push('Missing system.icon field for trait');
        }
        break;

      case 'talent':
      case 'augment':
        if (!document.system?.description) {
          result.warnings.push(`Missing system.description field for ${document.type}`);
        }
        break;

      case 'script':
        if (!document.command) {
          result.valid = false;
          result.errors.push('Missing command field for macro');
        }
        break;
    }
  }

  /**
   * Check for duplicate IDs across all documents
   */
  private checkDuplicateIds(): void {
    console.log('\n🔍 Checking for duplicate IDs...');

    const duplicates = Array.from(this.duplicateIds.entries())
      .filter(([_, files]) => files.length > 1);

    if (duplicates.length > 0) {
      console.log(`❌ Found ${duplicates.length} duplicate ID(s):`);
      duplicates.forEach(([id, files]) => {
        console.log(`  ID ${id} appears in:`);
        files.forEach(file => console.log(`    - ${file}`));
      });
    } else {
      console.log('✅ No duplicate IDs found');
    }
  }

  /**
   * Print comprehensive validation summary
   */
  private printValidationSummary(options: ValidationOptions): void {
    console.log('\n📊 Validation Summary');
    console.log('═'.repeat(50));

    const totalErrors = Array.from(this.validationResults.values())
      .reduce((sum, result) => sum + result.errors.length, 0);

    const totalWarnings = Array.from(this.validationResults.values())
      .reduce((sum, result) => sum + result.warnings.length, 0);

    const validPacks = Array.from(this.validationResults.values())
      .filter(result => result.valid).length;

    console.log(`📁 Total documents: ${this.totalDocuments}`);
    console.log(`✅ Valid packs: ${validPacks}/${this.validationResults.size}`);
    console.log(`❌ Total errors: ${totalErrors}`);
    console.log(`⚠️  Total warnings: ${totalWarnings}`);
    console.log(`🔧 Documents fixed: ${this.totalFixed}`);
    console.log(`🔗 Duplicate IDs: ${this.duplicateIds.size > 0 ? Array.from(this.duplicateIds.entries()).filter(([_, files]) => files.length > 1).length : 0}`);

    // Check for duplicate IDs
    const duplicateCount = Array.from(this.duplicateIds.entries())
      .filter(([_, files]) => files.length > 1).length;

    // Overall status
    const allValid = totalErrors === 0 && duplicateCount === 0;
    console.log(`\n🎯 Overall Status: ${allValid ? '✅ PASS' : '❌ FAIL'}`);

    if (options.fix && this.totalFixed > 0) {
      console.log(`\n🔧 Fixed ${this.totalFixed} documents. Run again to verify.`);
    }
  }

  /**
   * Get detailed results for programmatic use
   */
  getResults(): {
    valid: boolean;
    totalDocuments: number;
    totalErrors: number;
    totalWarnings: number;
    totalFixed: number;
    duplicateIds: number;
    packResults: Record<string, ValidationResult>;
  } {
    const totalErrors = Array.from(this.validationResults.values())
      .reduce((sum, result) => sum + result.errors.length, 0);

    const totalWarnings = Array.from(this.validationResults.values())
      .reduce((sum, result) => sum + result.warnings.length, 0);

    const duplicateCount = Array.from(this.duplicateIds.entries())
      .filter(([_, files]) => files.length > 1).length;

    return {
      valid: totalErrors === 0 && duplicateCount === 0,
      totalDocuments: this.totalDocuments,
      totalErrors,
      totalWarnings,
      totalFixed: this.totalFixed,
      duplicateIds: duplicateCount,
      packResults: Object.fromEntries(this.validationResults)
    };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options: ValidationOptions = {
    fix: args.includes('--fix'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    packsDirectory: args.find(arg => arg.startsWith('--packs='))?.split('=')[1]
  };

  const validator = new CompendiumValidator(options.packsDirectory);

  validator.validateAll(options).then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export default CompendiumValidator;