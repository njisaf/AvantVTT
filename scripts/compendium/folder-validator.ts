#!/usr/bin/env node

/**
 * @fileoverview Folder Validator - Phase C: Folder Support
 * @version 2.0.0 - Pipeline Implementation
 * @description Validates _folders.json structure and references
 * @author Avant VTT Team
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FolderDocument {
  _id: string;
  name: string;
  type: 'Folder';
  parent: string | null;
  description?: string;
  color?: string;
  sort: number;
  flags?: any;
}

interface FolderValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  folders: FolderDocument[];
  folderCount: number;
}

interface FolderValidationOptions {
  verbose: boolean;
  packsDirectory?: string;
}

export class FolderValidator {
  private packsDirectory: string;
  private validationResults: Map<string, FolderValidationResult> = new Map();
  private globalFolderIds: Set<string> = new Set();

  constructor(packsDirectory?: string) {
    this.packsDirectory = packsDirectory || path.join(__dirname, '../../packs');
  }

  /**
   * Validate all _folders.json files
   */
  async validateAll(options: FolderValidationOptions = { verbose: false }): Promise<boolean> {
    console.log('🔍 Starting Folder Validation (Phase C)...');
    console.log(`📁 Packs directory: ${this.packsDirectory}`);
    
    if (!fs.existsSync(this.packsDirectory)) {
      console.error(`❌ Packs directory not found: ${this.packsDirectory}`);
      return false;
    }

    // Reset state
    this.validationResults.clear();
    this.globalFolderIds.clear();

    // Get all pack directories
    const packDirs = fs.readdirSync(this.packsDirectory, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log(`📦 Found pack types: ${packDirs.join(', ')}`);

    let allValid = true;

    // First pass: validate individual folder files
    for (const packDir of packDirs) {
      const packPath = path.join(this.packsDirectory, packDir);
      const valid = await this.validatePackFolders(packDir, packPath, options);
      
      if (!valid) {
        allValid = false;
      }
    }

    // Second pass: validate cross-references
    this.validateGlobalReferences();

    // Print summary
    this.printValidationSummary(options);

    return allValid;
  }

  /**
   * Validate folders for a single pack
   */
  private async validatePackFolders(packName: string, packPath: string, options: FolderValidationOptions): Promise<boolean> {
    console.log(`\n📋 Validating folders for pack: ${packName}`);
    
    const foldersPath = path.join(packPath, '_folders.json');
    const result: FolderValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      folders: [],
      folderCount: 0
    };

    // Check if _folders.json exists
    if (!fs.existsSync(foldersPath)) {
      result.warnings.push('No _folders.json file found (pack will use flat structure)');
      console.log(`  ℹ️  No _folders.json file found for ${packName}`);
      this.validationResults.set(packName, result);
      return true;
    }

    try {
      // Read and parse _folders.json
      const fileContent = fs.readFileSync(foldersPath, 'utf8');
      const folders: FolderDocument[] = JSON.parse(fileContent);

      if (!Array.isArray(folders)) {
        result.valid = false;
        result.errors.push('_folders.json must contain an array of folder objects');
        console.error(`  ❌ ${packName}: _folders.json must be an array`);
        this.validationResults.set(packName, result);
        return false;
      }

      result.folders = folders;
      result.folderCount = folders.length;

      console.log(`  📄 Found ${folders.length} folder(s) in ${packName}`);

      // Validate each folder
      const folderIds = new Set<string>();
      for (const folder of folders) {
        this.validateSingleFolder(folder, packName, folderIds, result, options);
      }

      // Validate parent references within pack
      this.validateParentReferences(folders, packName, result);

      this.validationResults.set(packName, result);

      if (result.valid) {
        console.log(`  ✅ ${packName}: ${folders.length} folders validated successfully`);
      } else {
        console.log(`  ❌ ${packName}: ${result.errors.length} errors, ${result.warnings.length} warnings`);
      }

      return result.valid;

    } catch (error) {
      result.valid = false;
      if (error instanceof SyntaxError) {
        result.errors.push(`Invalid JSON syntax in _folders.json: ${error.message}`);
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Error reading _folders.json: ${errorMessage}`);
      }
      console.error(`  ❌ ${packName}: ${result.errors[result.errors.length - 1]}`);
      this.validationResults.set(packName, result);
      return false;
    }
  }

  /**
   * Validate a single folder document
   */
  private validateSingleFolder(
    folder: FolderDocument, 
    packName: string, 
    folderIds: Set<string>, 
    result: FolderValidationResult, 
    options: FolderValidationOptions
  ): void {
    const folderLabel = `${packName}/${folder.name}`;

    // Check required fields
    if (!folder._id) {
      result.valid = false;
      result.errors.push(`${folderLabel}: Missing required _id field`);
      return;
    }

    if (folder._id.length !== 16) {
      result.valid = false;
      result.errors.push(`${folderLabel}: _id must be 16 characters, got ${folder._id.length}`);
    }

    if (!folder.name) {
      result.valid = false;
      result.errors.push(`${folderLabel}: Missing required name field`);
    }

    if (folder.type !== 'Folder') {
      result.valid = false;
      result.errors.push(`${folderLabel}: Type must be 'Folder', got '${folder.type}'`);
    }

    if (typeof folder.sort !== 'number') {
      result.valid = false;
      result.errors.push(`${folderLabel}: Sort must be a number, got ${typeof folder.sort}`);
    }

    // Check for duplicate IDs within pack
    if (folderIds.has(folder._id)) {
      result.valid = false;
      result.errors.push(`${folderLabel}: Duplicate _id '${folder._id}' within pack`);
    } else {
      folderIds.add(folder._id);
    }

    // Check for duplicate IDs globally
    if (this.globalFolderIds.has(folder._id)) {
      result.valid = false;
      result.errors.push(`${folderLabel}: Duplicate _id '${folder._id}' across packs`);
    } else {
      this.globalFolderIds.add(folder._id);
    }

    // Validate optional fields
    if (folder.color && !/^#[0-9A-Fa-f]{6}$/.test(folder.color)) {
      result.warnings.push(`${folderLabel}: Invalid color format '${folder.color}' (should be #RRGGBB)`);
    }

    if (folder.description && folder.description.length < 10) {
      result.warnings.push(`${folderLabel}: Very short description`);
    }

    if (options.verbose) {
      console.log(`    ✅ ${folder.name} (${folder._id})`);
    }
  }

  /**
   * Validate parent references within a pack
   */
  private validateParentReferences(folders: FolderDocument[], packName: string, result: FolderValidationResult): void {
    const folderIds = new Set(folders.map(f => f._id));
    
    for (const folder of folders) {
      if (folder.parent) {
        if (!folderIds.has(folder.parent)) {
          result.valid = false;
          result.errors.push(`${packName}/${folder.name}: Parent '${folder.parent}' not found in pack`);
        }
      }
    }
  }

  /**
   * Validate global folder references (for future cross-pack support)
   */
  private validateGlobalReferences(): void {
    console.log('\n🔗 Validating global folder references...');
    
    // Currently no cross-pack references, but this is where they would be validated
    console.log('✅ Global folder references validated');
  }

  /**
   * Print comprehensive validation summary
   */
  private printValidationSummary(options: FolderValidationOptions): void {
    console.log('\n📊 Folder Validation Summary');
    console.log('═'.repeat(50));

    const totalFolders = Array.from(this.validationResults.values())
      .reduce((sum, result) => sum + result.folderCount, 0);
    
    const totalErrors = Array.from(this.validationResults.values())
      .reduce((sum, result) => sum + result.errors.length, 0);
    
    const totalWarnings = Array.from(this.validationResults.values())
      .reduce((sum, result) => sum + result.warnings.length, 0);

    const validPacks = Array.from(this.validationResults.values())
      .filter(result => result.valid).length;

    console.log(`📁 Total folders: ${totalFolders}`);
    console.log(`✅ Valid packs: ${validPacks}/${this.validationResults.size}`);
    console.log(`❌ Total errors: ${totalErrors}`);
    console.log(`⚠️  Total warnings: ${totalWarnings}`);

    // Print pack-by-pack results
    for (const [packName, result] of this.validationResults.entries()) {
      const status = result.valid ? '✅' : '❌';
      console.log(`  ${status} ${packName}: ${result.folderCount} folders, ${result.errors.length} errors, ${result.warnings.length} warnings`);
    }

    // Print error details
    if (totalErrors > 0) {
      console.log('\n❌ Error Details:');
      for (const [packName, result] of this.validationResults.entries()) {
        if (result.errors.length > 0) {
          console.log(`  📦 ${packName}:`);
          result.errors.forEach((error, index) => {
            console.log(`    ${index + 1}. ${error}`);
          });
        }
      }
    }

    // Print warning details
    if (totalWarnings > 0) {
      console.log('\n⚠️ Warning Details:');
      for (const [packName, result] of this.validationResults.entries()) {
        if (result.warnings.length > 0) {
          console.log(`  📦 ${packName}:`);
          result.warnings.forEach((warning, index) => {
            console.log(`    ${index + 1}. ${warning}`);
          });
        }
      }
    }

    // Overall status
    const allValid = totalErrors === 0;
    console.log(`\n🎯 Overall Status: ${allValid ? '✅ PASS' : '❌ FAIL'}`);
  }

  /**
   * Get validation results for programmatic use
   */
  getResults(): {
    valid: boolean;
    totalFolders: number;
    totalErrors: number;
    totalWarnings: number;
    packResults: Record<string, FolderValidationResult>;
  } {
    const totalFolders = Array.from(this.validationResults.values())
      .reduce((sum, result) => sum + result.folderCount, 0);
    
    const totalErrors = Array.from(this.validationResults.values())
      .reduce((sum, result) => sum + result.errors.length, 0);
    
    const totalWarnings = Array.from(this.validationResults.values())
      .reduce((sum, result) => sum + result.warnings.length, 0);

    return {
      valid: totalErrors === 0,
      totalFolders,
      totalErrors,
      totalWarnings,
      packResults: Object.fromEntries(this.validationResults)
    };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options: FolderValidationOptions = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    packsDirectory: args.find(arg => arg.startsWith('--packs='))?.split('=')[1]
  };

  const validator = new FolderValidator(options.packsDirectory);
  
  validator.validateAll(options).then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Folder validation failed:', error);
    process.exit(1);
  });
}

export default FolderValidator;