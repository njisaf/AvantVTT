/**
 * @fileoverview Trait Import/Export CLI Utilities
 * @version 1.0.0 - Stage 5: Advanced Features
 * @description CLI commands for importing and exporting trait data
 * @author Avant VTT Team
 */

import { promises as fs } from 'fs';
import { join, dirname, resolve } from 'path';
import { TraitProvider } from '../services/trait-provider.ts';
// Legacy remote trait sync service was removed in Phase 3 – see deprecation docs for details
import type { Trait, TraitItemSystemData } from '../types/domain/trait.ts';
import { Command } from 'commander';

/**
 * Export format for trait data
 */
export interface TraitExportData {
  /** Export metadata */
  metadata: {
    /** Export timestamp */
    timestamp: string;
    /** System version */
    systemVersion: string;
    /** Number of traits exported */
    traitCount: number;
    /** Export format version */
    formatVersion: string;
    /** Source of the export */
    exportSource: 'system' | 'world' | 'both';
  };
  
  /** Exported trait data */
  traits: ExportedTrait[];
}

/**
 * Individual trait in export format
 */
export interface ExportedTrait {
  /** Trait ID */
  id: string;
  
  /** Trait name */
  name: string;
  
  /** Trait color */
  color: string;
  
  /** Trait icon */
  icon: string;
  
  /** Localization key */
  localKey: string;
  
  /** Optional description */
  description?: string;
  
  /** Source of the trait */
  source: 'system' | 'world';
  
  /** System-specific data */
  systemData: TraitItemSystemData;
  
  /** Export timestamp for this trait */
  exportedAt: string;
}

/**
 * Options for trait export
 */
export interface TraitExportOptions {
  /** Include system traits */
  includeSystem?: boolean;
  
  /** Include world traits */
  includeWorld?: boolean;
  
  /** Filter by categories */
  categories?: string[];
  
  /** Filter by tags */
  tags?: string[];
  
  /** Include full metadata */
  includeMetadata?: boolean;
  
  /** Pretty print JSON output */
  prettyPrint?: boolean;
}

/**
 * Options for trait import
 */
export interface TraitImportOptions {
  /** Skip traits that already exist */
  skipExisting?: boolean;
  
  /** Overwrite existing traits */
  overwriteExisting?: boolean;
  
  /** Validate trait data before import */
  validateData?: boolean;
  
  /** Dry run - don't actually import */
  dryRun?: boolean;
  
  /** Import only specific trait IDs */
  traitIds?: string[];
}

/**
 * Result of import/export operations
 */
export interface TraitImpExpResult {
  /** Whether the operation succeeded */
  success: boolean;
  
  /** Number of traits processed */
  processed: number;
  
  /** Number of traits that failed */
  failed: number;
  
  /** Error message if operation failed */
  error?: string;
  
  /** Detailed results for each trait */
  details: TraitImpExpDetail[];
  
  /** Output file path (for exports) */
  outputPath?: string;
  
  /** Import source file (for imports) */
  sourceFile?: string;
}

/**
 * Detail for individual trait import/export operations
 */
export interface TraitImpExpDetail {
  /** Trait ID */
  traitId: string;
  
  /** Trait name */
  traitName: string;
  
  /** Action performed */
  action: 'exported' | 'imported' | 'skipped' | 'failed';
  
  /** Reason for skip or failure */
  reason?: string;
  
  /** Error message if failed */
  error?: string;
}

/**
 * CLI utility class for trait import/export operations.
 */
export class TraitCLI {
  private traitProvider: TraitProvider;
  
  constructor(traitProvider: TraitProvider) {
    this.traitProvider = traitProvider;
  }
  
  /**
   * Export traits to JSON file.
   * 
   * @param outputPath - Path to save the exported JSON file
   * @param options - Export options
   * @returns Promise with export result
   */
  async exportTraits(outputPath: string, options: TraitExportOptions = {}): Promise<TraitImpExpResult> {
    try {
      console.log('🔄 Starting trait export...');
      
      // Set default options
      const opts = {
        includeSystem: true,
        includeWorld: true,
        includeMetadata: true,
        prettyPrint: true,
        ...options
      };
      
      // Get traits from provider
      const traitsResult = await this.traitProvider.getAll({
        includeSystem: opts.includeSystem,
        includeWorld: opts.includeWorld,
        categories: opts.categories,
        tags: opts.tags
      });
      
      if (!traitsResult.success || !traitsResult.data) {
        return {
          success: false,
          processed: 0,
          failed: 0,
          error: `Failed to load traits: ${traitsResult.error}`,
          details: []
        };
      }
      
      const traits = traitsResult.data;
      const details: TraitImpExpDetail[] = [];
      const exportedTraits: ExportedTrait[] = [];
      
      // Convert traits to export format
      for (const trait of traits) {
        try {
          const exportedTrait: ExportedTrait = {
            id: trait.id,
            name: trait.name,
            color: trait.color,
            icon: trait.icon,
            localKey: trait.localKey,
            description: trait.description,
            source: trait.source,
            systemData: trait.item.system,
            exportedAt: new Date().toISOString()
          };
          
          exportedTraits.push(exportedTrait);
          details.push({
            traitId: trait.id,
            traitName: trait.name,
            action: 'exported'
          });
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          details.push({
            traitId: trait.id,
            traitName: trait.name,
            action: 'failed',
            error: errorMessage
          });
        }
      }
      
      // Create export data
      const exportData: TraitExportData = {
        metadata: {
          timestamp: new Date().toISOString(),
          systemVersion: (globalThis as any).game?.system?.version || '0.0.0',
          traitCount: exportedTraits.length,
          formatVersion: '1.0.0',
          exportSource: opts.includeSystem && opts.includeWorld ? 'both' : 
                       opts.includeSystem ? 'system' : 'world'
        },
        traits: exportedTraits
      };
      
      // Write to file
      const jsonContent = opts.prettyPrint ? 
        JSON.stringify(exportData, null, 2) : 
        JSON.stringify(exportData);
      
      // Resolve full output path with _export/ directory
      const exportDir = resolve(process.cwd(), '_export');
      const fullOutputPath = outputPath.startsWith('/') || outputPath.includes(':') ? 
        outputPath : // Use absolute path as-is
        join(exportDir, outputPath); // Relative path goes in _export/
      
      try {
        // Ensure the export directory exists
        await fs.mkdir(dirname(fullOutputPath), { recursive: true });
        
        // Write the JSON content to file
        await fs.writeFile(fullOutputPath, jsonContent, 'utf-8');
        
        console.log(`📄 Export data prepared (${jsonContent.length} characters)`);
        console.log(`💾 File written to: ${fullOutputPath}`);
        console.log(`✅ Exported ${exportedTraits.length} traits successfully`);
        
        return {
          success: true,
          processed: exportedTraits.length,
          failed: details.filter(d => d.action === 'failed').length,
          details,
          outputPath: fullOutputPath
        };
        
      } catch (writeError) {
        const writeErrorMessage = writeError instanceof Error ? writeError.message : String(writeError);
        console.error(`❌ Failed to write file to ${fullOutputPath}:`, writeError);
        return {
          success: false,
          processed: 0,
          failed: exportedTraits.length,
          error: `File write failed: ${writeErrorMessage}`,
          details
        };
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Export failed:', error);
      return {
        success: false,
        processed: 0,
        failed: 0,
        error: `Export failed: ${errorMessage}`,
        details: []
      };
    }
  }
  
  /**
   * Import traits from JSON file.
   * 
   * @param filePath - Path to the JSON file to import
   * @param options - Import options
   * @returns Promise with import result
   */
  async importTraits(filePath: string, options: TraitImportOptions = {}): Promise<TraitImpExpResult> {
    try {
      console.log('🔄 Starting trait import...');
      
      // Set default options
      const opts = {
        skipExisting: true,
        overwriteExisting: false,
        validateData: true,
        dryRun: false,
        ...options
      };
      
      // Read file from file system
      console.log(`📄 Reading trait data from ${filePath}`);
      
      // Resolve full file path (check _export/ directory if relative path)
      const exportDir = resolve(process.cwd(), '_export');
      const fullFilePath = filePath.startsWith('/') || filePath.includes(':') ? 
        filePath : // Use absolute path as-is
        join(exportDir, filePath); // Relative path looks in _export/
      
      let importData: TraitExportData;
      try {
        // Read and parse the JSON file
        const fileContent = await fs.readFile(fullFilePath, 'utf-8');
        importData = JSON.parse(fileContent);
        console.log(`✅ Successfully read ${fileContent.length} characters from ${fullFilePath}`);
        
      } catch (readError) {
        const readErrorMessage = readError instanceof Error ? readError.message : String(readError);
        console.error(`❌ Failed to read file ${fullFilePath}:`, readError);
        return {
          success: false,
          processed: 0,
          failed: 0,
          error: `File read failed: ${readErrorMessage}`,
          details: [],
          sourceFile: fullFilePath
        };
      }
      
      if (opts.validateData) {
        const validationResult = this._validateImportData(importData);
        if (!validationResult.valid) {
          return {
            success: false,
            processed: 0,
            failed: 0,
            error: `Import data validation failed: ${validationResult.errors.join(', ')}`,
            details: []
          };
        }
      }
      
      const details: TraitImpExpDetail[] = [];
      let processed = 0;
      let failed = 0;
      
      // Filter traits if specific IDs requested
      let traitsToImport = importData.traits;
      if (opts.traitIds && opts.traitIds.length > 0) {
        traitsToImport = importData.traits.filter(trait => opts.traitIds!.includes(trait.id));
      }
      
      // Process each trait
      for (const traitData of traitsToImport) {
        try {
          // Check if trait already exists
          const existingTrait = await this.traitProvider.get(traitData.id);
          
          if (existingTrait.success && existingTrait.data) {
            if (opts.skipExisting && !opts.overwriteExisting) {
              details.push({
                traitId: traitData.id,
                traitName: traitData.name,
                action: 'skipped',
                reason: 'Trait already exists'
              });
              continue;
            }
            
            if (opts.overwriteExisting && !opts.dryRun) {
              // Update existing trait
              const updateResult = await this.traitProvider.updateTrait(traitData.id, {
                name: traitData.name,
                system: traitData.systemData
              });
              
              if (updateResult.success) {
                details.push({
                  traitId: traitData.id,
                  traitName: traitData.name,
                  action: 'imported'
                });
                processed++;
              } else {
                details.push({
                  traitId: traitData.id,
                  traitName: traitData.name,
                  action: 'failed',
                  error: updateResult.error
                });
                failed++;
              }
            }
          } else {
            // Create new trait
            if (!opts.dryRun) {
              const createResult = await this.traitProvider.createTrait({
                _id: traitData.id,
                name: traitData.name,
                type: 'feature', // Default type
                system: traitData.systemData
              });
              
              if (createResult.success) {
                details.push({
                  traitId: traitData.id,
                  traitName: traitData.name,
                  action: 'imported'
                });
                processed++;
              } else {
                details.push({
                  traitId: traitData.id,
                  traitName: traitData.name,
                  action: 'failed',
                  error: createResult.error
                });
                failed++;
              }
            } else {
              // Dry run - just log what would happen
              details.push({
                traitId: traitData.id,
                traitName: traitData.name,
                action: 'imported',
                reason: 'Dry run - would create new trait'
              });
              processed++;
            }
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          details.push({
            traitId: traitData.id,
            traitName: traitData.name,
            action: 'failed',
            error: errorMessage
          });
          failed++;
        }
      }
      
      const dryRunNote = opts.dryRun ? ' (dry run)' : '';
      console.log(`✅ Import completed${dryRunNote}: ${processed} processed, ${failed} failed`);
      
      return {
        success: failed === 0,
        processed,
        failed,
        details,
        sourceFile: fullFilePath
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Import failed:', error);
      return {
        success: false,
        processed: 0,
        failed: 0,
        error: `Import failed: ${errorMessage}`,
        details: []
      };
    }
  }
  
  /**
   * Generate a data integrity hash for trait data.
   * 
   * @param traits - Array of traits to hash
   * @returns Hash string
   */
  generateDataIntegrityHash(traits: Trait[]): string {
    try {
      // Create a simple hash based on trait IDs, names, and key properties
      const hashData = traits
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(trait => `${trait.id}:${trait.name}:${trait.color}:${trait.icon}`)
        .join('|');
      
      // Simple hash function (in reality, would use crypto.subtle or similar)
      let hash = 0;
      for (let i = 0; i < hashData.length; i++) {
        const char = hashData.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return Math.abs(hash).toString(16);
      
    } catch (error) {
      console.error('Failed to generate data integrity hash:', error);
      return 'hash-error';
    }
  }
  
  /**
   * Validate imported trait data.
   * 
   * @private
   */
  private _validateImportData(data: TraitExportData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('No import data provided');
      return { valid: false, errors };
    }
    
    if (!data.metadata) {
      errors.push('Missing metadata section');
    } else {
      if (!data.metadata.formatVersion) {
        errors.push('Missing format version in metadata');
      }
      if (data.metadata.formatVersion !== '1.0.0') {
        errors.push(`Unsupported format version: ${data.metadata.formatVersion}`);
      }
    }
    
    if (!Array.isArray(data.traits)) {
      errors.push('Traits must be an array');
    } else {
      for (const [index, trait] of data.traits.entries()) {
        if (!trait.id) {
          errors.push(`Trait at index ${index} missing required 'id' field`);
        }
        if (!trait.name) {
          errors.push(`Trait at index ${index} missing required 'name' field`);
        }
        if (!trait.systemData) {
          errors.push(`Trait at index ${index} missing required 'systemData' field`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Create CLI commands for ChatOps integration.
 */
export function createTraitCommands(traitProvider: TraitProvider) {
  const cli = new TraitCLI(traitProvider);
      // Remote trait commands removed in Phase 3 - see deprecated/remote-trait-service/README.md
  
  return {
    /**
     * Export traits command
     */
    async export(args: string[]): Promise<void> {
      const outputPath = args[0] || 'traits-export.json';
      const options: TraitExportOptions = {
        includeSystem: !args.includes('--world-only'),
        includeWorld: !args.includes('--system-only'),
        prettyPrint: !args.includes('--compact')
      };
      
      const result = await cli.exportTraits(outputPath, options);
      
      if (result.success) {
        console.log(`✅ Successfully exported ${result.processed} traits to ${outputPath}`);
      } else {
        console.error(`❌ Export failed: ${result.error}`);
      }
    },
    
    /**
     * Import traits command
     */
    async import(args: string[]): Promise<void> {
      const filePath = args[0];
      if (!filePath) {
        console.error('❌ Please provide a file path to import from');
        return;
      }
      
      const options: TraitImportOptions = {
        dryRun: args.includes('--dry-run'),
        overwriteExisting: args.includes('--overwrite'),
        skipExisting: !args.includes('--overwrite')
      };
      
      const result = await cli.importTraits(filePath, options);
      
      if (result.success) {
        const dryRunNote = options.dryRun ? ' (dry run)' : '';
        console.log(`✅ Successfully imported ${result.processed} traits${dryRunNote}`);
      } else {
        console.error(`❌ Import failed: ${result.error}`);
      }
    },
    
    /**
     * Sync traits from remote repository (DEPRECATED)
     */
    async sync(args: string[]): Promise<void> {
      console.error('❌ Remote trait sync has been deprecated.');
      console.error('📖 See deprecated/remote-trait-service/README.md for more information.');
      process.exit(1);
    },
    
    /**
     * Get remote trait information (DEPRECATED)
     */
    async remote(args: string[]): Promise<void> {
      console.error('❌ Remote trait functionality has been deprecated.');
      console.error('📖 See deprecated/remote-trait-service/README.md for more information.');
      process.exit(1);
    },
    
    /**
     * Integrity check command
     */
    async integrity(): Promise<void> {
      const traitsResult = await traitProvider.getAll();
      if (traitsResult.success && traitsResult.data) {
        const hash = cli.generateDataIntegrityHash(traitsResult.data);
        console.log(`🔍 Data integrity hash: ${hash}`);
        console.log(`📊 Total traits: ${traitsResult.data.length}`);
      } else {
        console.error('❌ Failed to load traits for integrity check');
      }
    }
  };
}

/**
 * Display help text for the CLI
 */
function showHelp(): void {
  console.log(`
🔮 Avant VTT - Trait CLI Utilities

⚠️  IMPORTANT: This CLI uses mock data when run outside FoundryVTT.
💡 For REAL trait data, use the "Export Custom Traits" macro from the Avant Macros compendium!

USAGE:
  npm run traits:export [output.json] [options]      Export traits to JSON file (mock data)
  npm run traits:import <input.json> [options]       Import traits from JSON file
  npm run traits:sync [options]                      [DEPRECATED] Sync traits from remote repository
  npm run traits:remote [info]                       [DEPRECATED] Get remote trait information
  npm run traits:integrity                           Check data integrity

RECOMMENDED WORKFLOW:
  1. In FoundryVTT, open the Avant Macros compendium
  2. Run the "Export Custom Traits" macro to download real trait data
  3. Use the downloaded JSON with the import command if needed

EXAMPLES:
  # Export traits (mock data when run from command line)
  npm run traits:export my-traits.json
  
  # Import real trait data (after using the macro)
  npm run traits:import downloaded-traits.json -- --dry-run
  npm run traits:import downloaded-traits.json -- --overwrite

OPTIONS:
  Export:
    --world-only        Export only world traits (exclude system)
    --system-only       Export only system traits (exclude world)  
    --compact           Compact JSON output (no pretty printing)
    
  Import:
    --dry-run           Show what would be imported without making changes
    --overwrite         Overwrite existing traits instead of skipping
    
  Global:
    --help              Show this help message

For more information, see: https://github.com/njisaf/AvantVTT/blob/main/README.md#cli-quick-start
`);
}

/**
 * Check if running in FoundryVTT context and get real TraitProvider
 */
function getTraitProvider(): any {
  // Check if we're running in FoundryVTT context
  if (typeof globalThis !== 'undefined' && (globalThis as any).game?.avant?.services?.traitProvider) {
    console.log('🎮 Using real TraitProvider from FoundryVTT context');
    return (globalThis as any).game.avant.services.traitProvider;
  }
  
  // Fallback: Return mock provider with a warning
  console.warn('⚠️  Running outside FoundryVTT context - using mock provider');
  console.warn('💡 For real trait data, run this from a FoundryVTT macro or console');
  
  return {
    async getAll() {
      return { 
        success: true, 
        data: [
          { 
            id: 'fire', 
            name: 'Fire', 
            color: '#FF4444', 
            icon: 'fas fa-fire',
            localKey: 'fire',
            source: 'system' as const,
            item: { system: {} },
            description: 'Mock fire trait - use macro for real data'
          }
        ] 
      };
    },
    async get() {
      return { success: false, data: null };
    },
    async createTrait() {
      return { success: true };
    },
    async updateTrait() {
      return { success: true };
    }
  } as any;
}

/**
 * @param traitProvider - An instance of the TraitProvider service
 * @returns A configured commander program
 */
function setupProgram(traitProvider: TraitProvider) {
    const program = new Command();
    program
        .name('traits')
        .description('CLI tool for managing traits in the Avant VTT system')
        .version('1.0.0');

    const commands = createTraitCommands(traitProvider);

    program
        .command('export')
        .description('Export all traits to a JSON file')
        .option('-o, --output <file>', 'Output file path', 'traits.json')
        .action(commands.export);

    program
        .command('import')
        .description('Import traits from a JSON file')
        .argument('<file>', 'File path to import from')
        .action(commands.import);
        
    program
        .command('integrity')
        .description('Check data integrity of all traits')
        .action(commands.integrity);

    return program;
}

/**
 * Main CLI entry point
 */
async function mainCLI(traitProvider: TraitProvider) {
  try {
    const program = setupProgram(traitProvider);
    
    // Override default help behavior to prevent process.exit
    program.exitOverride();

    program.parse(process.argv);

  } catch (error) {
    if (error instanceof Error && error.message.includes('process.exit')) {
        // Suppress process.exit errors during testing
    } else if (error instanceof Error) {
        console.error(`❌ An unexpected error occurred: ${error.message}`);
        process.exit(1);
    } else {
        console.error('❌ An unknown error occurred');
        process.exit(1);
    }
  }
}

// Self-executing block for running the CLI directly
async function run(): Promise<void> {
    // Get the appropriate TraitProvider (real or mock) when run directly
    const traitProvider = getTraitProvider();
    await mainCLI(traitProvider);
}

// Run main function if this file is executed directly
if (import.meta.url.endsWith(process.argv[1])) {
  run().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}