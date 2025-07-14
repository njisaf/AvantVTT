#!/usr/bin/env node

/**
 * @fileoverview Split Pack Script - Phase B: File Granularity
 * @version 2.0.0 - Pipeline Implementation
 * @description Migrate from monolithic JSON to one file per document
 * @author Avant VTT Team
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CompendiumDocument {
  _id: string;
  name: string;
  type: string;
  category?: string;
  [key: string]: any;
}

interface SplitOptions {
  dryRun: boolean;
  verbose: boolean;
  overwrite: boolean;
  packsDirectory?: string;
}

export class PackSplitter {
  private packsDirectory: string;
  private processedFiles = 0;
  private skippedFiles = 0;
  private errors: string[] = [];

  constructor(packsDirectory?: string) {
    this.packsDirectory = packsDirectory || path.join(__dirname, '../../packs');
  }

  /**
   * Split all monolithic JSON files into individual files
   */
  async splitAll(options: SplitOptions = { dryRun: false, verbose: false, overwrite: false }): Promise<boolean> {
    console.log('🔄 Starting Pack Splitting (Phase B: File Granularity)...');
    console.log(`📁 Packs directory: ${this.packsDirectory}`);
    
    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be modified');
    }

    if (!fs.existsSync(this.packsDirectory)) {
      console.error(`❌ Packs directory not found: ${this.packsDirectory}`);
      return false;
    }

    // Get all pack directories
    const packDirs = fs.readdirSync(this.packsDirectory, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log(`📦 Found pack types: ${packDirs.join(', ')}`);

    // Process each pack directory
    for (const packDir of packDirs) {
      const packPath = path.join(this.packsDirectory, packDir);
      await this.splitPackDirectory(packDir, packPath, options);
    }

    this.printSummary();
    return this.errors.length === 0;
  }

  /**
   * Split a single pack directory
   */
  private async splitPackDirectory(packName: string, packPath: string, options: SplitOptions): Promise<void> {
    console.log(`\n📋 Processing pack: ${packName}`);
    
    // Look for potential monolithic JSON files
    const jsonFiles = fs.readdirSync(packPath)
      .filter(file => file.endsWith('.json'))
      .filter(file => !file.startsWith('_')) // Skip special files like _folders.json
      .sort();

    // Check if we already have individual files (modern structure)
    const hasIndividualFiles = jsonFiles.some(file => {
      const filePath = path.join(packPath, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        // Individual files have a single document with _id
        return data._id && typeof data._id === 'string' && !Array.isArray(data);
      } catch {
        return false;
      }
    });

    if (hasIndividualFiles) {
      console.log(`  ✅ Pack ${packName} already uses individual files (${jsonFiles.length} files)`);
      return;
    }

    // Look for monolithic files (arrays of documents)
    const monolithicFiles = jsonFiles.filter(file => {
      const filePath = path.join(packPath, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        return Array.isArray(data) && data.length > 0;
      } catch {
        return false;
      }
    });

    if (monolithicFiles.length === 0) {
      console.log(`  ℹ️  No monolithic files found in ${packName}`);
      return;
    }

    console.log(`  📄 Found ${monolithicFiles.length} monolithic file(s) to split`);

    // Process each monolithic file
    for (const file of monolithicFiles) {
      await this.splitMonolithicFile(packName, packPath, file, options);
    }
  }

  /**
   * Split a monolithic JSON file into individual files
   */
  private async splitMonolithicFile(packName: string, packPath: string, fileName: string, options: SplitOptions): Promise<void> {
    const filePath = path.join(packPath, fileName);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const documents: CompendiumDocument[] = JSON.parse(content);
      
      if (!Array.isArray(documents)) {
        if (options.verbose) {
          console.log(`    ℹ️  ${fileName} is not an array, skipping`);
        }
        return;
      }

      console.log(`    📄 Splitting ${fileName} into ${documents.length} individual files`);

      // Create backup if not dry run
      if (!options.dryRun) {
        const backupPath = `${filePath}.backup`;
        if (!fs.existsSync(backupPath)) {
          fs.copyFileSync(filePath, backupPath);
          console.log(`    💾 Created backup: ${fileName}.backup`);
        }
      }

      // Process each document
      for (const doc of documents) {
        await this.createIndividualFile(packPath, doc, options);
      }

      // Remove original monolithic file if successful
      if (!options.dryRun) {
        fs.unlinkSync(filePath);
        console.log(`    🗑️  Removed original monolithic file: ${fileName}`);
      }

      this.processedFiles++;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorMessage = `Failed to split ${fileName}: ${errorMsg}`;
      this.errors.push(errorMessage);
      console.error(`    ❌ ${errorMessage}`);
    }
  }

  /**
   * Create an individual file for a document
   */
  private async createIndividualFile(packPath: string, doc: CompendiumDocument, options: SplitOptions): Promise<void> {
    if (!doc._id) {
      throw new Error(`Document "${doc.name}" missing required _id field`);
    }

    // Generate filename from document name
    const filename = this.generateFilename(doc.name);
    const filePath = path.join(packPath, filename);

    // Check if file already exists
    if (fs.existsSync(filePath) && !options.overwrite) {
      console.log(`      ⚠️  Skipping ${filename} (already exists)`);
      this.skippedFiles++;
      return;
    }

    if (options.verbose) {
      console.log(`      📝 Creating ${filename} (ID: ${doc._id})`);
    }

    // Write individual file
    if (!options.dryRun) {
      const content = JSON.stringify(doc, null, 2);
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }

  /**
   * Generate a filename from a document name
   */
  private generateFilename(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      + '.json';
  }

  /**
   * Print processing summary
   */
  private printSummary(): void {
    console.log('\n📊 Split Pack Summary');
    console.log('═'.repeat(50));
    console.log(`📄 Processed files: ${this.processedFiles}`);
    console.log(`⏭️  Skipped files: ${this.skippedFiles}`);
    console.log(`❌ Errors: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Error Details:');
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    const status = this.errors.length === 0 ? '✅ SUCCESS' : '❌ FAILED';
    console.log(`\n🎯 Overall Status: ${status}`);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options: SplitOptions = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    overwrite: args.includes('--overwrite'),
    packsDirectory: args.find(arg => arg.startsWith('--packs='))?.split('=')[1]
  };

  const splitter = new PackSplitter(options.packsDirectory);
  
  splitter.splitAll(options).then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Split operation failed:', error);
    process.exit(1);
  });
}

export default PackSplitter;