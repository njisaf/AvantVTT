#!/usr/bin/env node

/**
 * @fileoverview Compendium CLI Tool
 * @description Command-line interface for compendium operations (diff, copy, list)
 * @version 2.0.0
 * @author Avant Development Team
 */

import { Command } from 'commander';
import { CompendiumLocalService } from '../services/compendium-local-service.ts';

/**
 * Mock FoundryVTT environment for CLI operations
 * 
 * Since CLI operations run outside of FoundryVTT, we need to set up a minimal
 * environment that the CompendiumLocalService can work with.
 */
function setupMockFoundryEnvironment() {
  // For now, this CLI is designed to work within FoundryVTT context
  // In the future, this could be extended to work with exported pack data
  if (!(globalThis as any).game) {
    console.error('❌ Error: This CLI tool must be run within a FoundryVTT context');
    console.error('💡 Use the ChatOps interface or run from FoundryVTT console instead');
    process.exit(1);
  }
}

/**
 * Format and display diff results in a human-readable format
 * 
 * @param diff - The diff result from pack comparison
 * @param srcId - Source pack identifier
 * @param destId - Destination pack identifier
 * @param options - Output options
 */
function displayDiffResults(diff: any, srcId: string, destId: string, options: any) {
  if (options.json) {
    console.log(JSON.stringify({
      srcId,
      destId,
      added: diff.added.length,
      removed: diff.removed.length,
      changed: diff.changed.length,
      details: diff
    }, null, 2));
    return;
  }

  console.log(`\n📊 Compendium Comparison: ${srcId} → ${destId}`);
  console.log(`===============================================`);
  console.log(`✅ Added documents: ${diff.added.length}`);
  console.log(`❌ Removed documents: ${diff.removed.length}`);
  console.log(`🔄 Changed documents: ${diff.changed.length}`);

  if (diff.added.length > 0) {
    console.log(`\n📈 Added Documents:`);
    diff.added.forEach((doc: any) => {
      console.log(`  + ${doc.name} (${doc._id})`);
    });
  }

  if (diff.removed.length > 0) {
    console.log(`\n📉 Removed Documents:`);
    diff.removed.forEach((doc: any) => {
      console.log(`  - ${doc.name} (${doc._id})`);
    });
  }

  if (diff.changed.length > 0) {
    console.log(`\n🔄 Changed Documents:`);
    diff.changed.forEach((change: any) => {
      console.log(`  ~ ${change.local.name} (content differs)`);
    });
  }

  const totalChanges = diff.added.length + diff.removed.length + diff.changed.length;
  console.log(`\n📊 Total differences: ${totalChanges}`);
}

/**
 * Create a filter function from command line filter string
 * 
 * @param filterString - Filter pattern (e.g., "name:/Legendary/i", "system.rarity:rare")
 * @returns Filter function for document filtering
 */
function createFilterFromString(filterString: string): (doc: any) => boolean {
  if (!filterString) {
    return () => true; // No filter = include all
  }

  // Parse filter string format: property:value or property:/regex/flags
  const [property, value] = filterString.split(':');
  
  if (!property || !value) {
    throw new Error(`Invalid filter format: ${filterString}. Use format "property:value" or "property:/regex/flags"`);
  }

  // Check if value is a regex pattern
  const regexMatch = value.match(/^\/(.+)\/([gimuy]*)$/);
  
  if (regexMatch) {
    // Create regex filter
    const pattern = regexMatch[1];
    const flags = regexMatch[2];
    const regex = new RegExp(pattern, flags);
    
    return (doc: any) => {
      const propValue = getNestedProperty(doc, property);
      return regex.test(String(propValue));
    };
  } else {
    // Create simple string match filter
    return (doc: any) => {
      const propValue = getNestedProperty(doc, property);
      return String(propValue).toLowerCase().includes(value.toLowerCase());
    };
  }
}

/**
 * Get nested property value from an object using dot notation
 * 
 * @param obj - Object to get property from
 * @param path - Property path (e.g., "system.rarity")
 * @returns Property value or undefined
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Diff command: Compare two compendium packs
 */
async function diffCommand(srcId: string, destId: string, options: any) {
  try {
    setupMockFoundryEnvironment();
    
    console.log(`🔍 Comparing packs: ${srcId} vs ${destId}`);
    
    const service = new CompendiumLocalService();
    const diff = await service.diffLocalPacks(srcId, destId);
    
    displayDiffResults(diff, srcId, destId, options);
    
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error comparing packs: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Copy command: Copy documents from source to destination pack
 */
async function copyCommand(srcId: string, destId: string, options: any) {
  try {
    setupMockFoundryEnvironment();
    
    console.log(`📋 Copying documents from ${srcId} to ${destId}`);
    
    if (options.filter) {
      console.log(`🔍 Using filter: ${options.filter}`);
    }
    
    const service = new CompendiumLocalService();
    
    // Create filter function if provided
    const filter = options.filter ? createFilterFromString(options.filter) : undefined;
    
    await service.copyDocs(srcId, destId, { filter });
    
    if (options.json) {
      console.log(JSON.stringify({
        success: true,
        srcId,
        destId,
        filter: options.filter || null,
        message: 'Documents copied successfully'
      }, null, 2));
    } else {
      console.log(`✅ Documents copied successfully from ${srcId} to ${destId}`);
      if (options.filter) {
        console.log(`🔍 Filter applied: ${options.filter}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error copying documents: ${error instanceof Error ? error.message : String(error)}`);
    if (options.json) {
      console.log(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }, null, 2));
    }
    process.exit(1);
  }
}

/**
 * List command: List available compendium packs and their document counts
 */
async function listCommand(options: any) {
  try {
    setupMockFoundryEnvironment();
    
    console.log(`📚 Listing available compendium packs...`);
    
    const game = (globalThis as any).game;
    const packs = Array.from(game.packs.entries()) as Array<[string, any]>;
    
    if (options.json) {
      const packInfo = await Promise.all(
        packs.map(async ([id, pack]) => {
          try {
            const docs = await pack.getDocuments();
            return {
              id,
              name: pack.title || pack.label || id,
              type: pack.documentName,
              documentCount: docs.length,
              visible: pack.visible
            };
          } catch (error) {
            return {
              id,
              name: pack.title || pack.label || id,
              type: pack.documentName,
              documentCount: 0,
              visible: pack.visible,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        })
      );
      
      console.log(JSON.stringify({ packs: packInfo }, null, 2));
    } else {
      console.log(`\n📊 Found ${packs.length} compendium packs:\n`);
      
      for (const [id, pack] of packs) {
        try {
          const docs = await pack.getDocuments();
          const visibility = pack.visible ? '👁️' : '🚫';
          console.log(`${visibility} ${id}`);
          console.log(`   Type: ${pack.documentName}`);
          console.log(`   Documents: ${docs.length}`);
          console.log(`   Name: ${pack.title || pack.label || 'Untitled'}`);
          console.log('');
        } catch (error) {
          console.log(`❌ ${id} (Error loading: ${error instanceof Error ? error.message : String(error)})`);
          console.log('');
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error listing packs: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Set up CLI program with commands and options
 */
function setupProgram() {
  const program = new Command();
  
  program
    .name('compendium')
    .description('CLI tool for FoundryVTT compendium operations')
    .version('2.0.0');

  program
    .command('diff <src> <dest>')
    .description('Compare two compendium packs and show differences')
    .option('--json', 'Output in JSON format for machine parsing')
    .action(diffCommand);

  program
    .command('copy <src> <dest>')
    .description('Copy documents from source pack to destination pack')
    .option('--filter <pattern>', 'Filter documents to copy (e.g., "name:/Legendary/i" or "system.rarity:rare")')
    .option('--json', 'Output in JSON format for machine parsing')
    .action(copyCommand);

  program
    .command('list')
    .description('List available compendium packs and their document counts')
    .option('--json', 'Output in JSON format for machine parsing')
    .action(listCommand);

  return program;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const cliProgram = setupProgram();
  cliProgram.parse(process.argv);
}

export { setupProgram, diffCommand, copyCommand, listCommand }; 