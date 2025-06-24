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

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import trait seeds (we'll need to handle the TypeScript import)
const TRAIT_SEEDS = [
  {
    name: "Fire",
    type: "trait",
    system: {
      color: "#FF6B6B",
      icon: "fas fa-fire",
      localKey: "AVANT.Trait.Fire",
      description: "Represents fire-based abilities, damage types, or elemental affinities",
      category: "general",
      isActive: false,
      powerPointCost: 0,
      uses: { value: 0, max: 0 }
    },
    img: "icons/magic/fire/flame-burning-creature-hand.webp",
    sort: 100
  },
  {
    name: "Ice",
    type: "trait", 
    system: {
      color: "#4ECDC4",
      icon: "fas fa-snowflake",
      localKey: "AVANT.Trait.Ice",
      description: "Represents ice and cold-based abilities, damage types, or elemental affinities",
      category: "general",
      isActive: false,
      powerPointCost: 0,
      uses: { value: 0, max: 0 }
    },
    img: "icons/magic/water/ice-crystal-snowflake.webp",
    sort: 200
  },
  {
    name: "Lightning",
    type: "trait",
    system: {
      color: "#FFE66D",
      icon: "fas fa-bolt",
      localKey: "AVANT.Trait.Lightning", 
      description: "Represents electrical and lightning-based abilities, damage types, or elemental affinities",
      category: "general",
      isActive: false,
      powerPointCost: 0,
      uses: { value: 0, max: 0 }
    },
    img: "icons/magic/lightning/bolt-strike-blue.webp",
    sort: 300
  },
  {
    name: "Stealth",
    type: "trait",
    system: {
      color: "#6C5CE7",
      icon: "fas fa-eye-slash",
      localKey: "AVANT.Trait.Stealth",
      description: "Represents stealth, concealment, and sneaking abilities",
      category: "general",
      isActive: false,
      powerPointCost: 0,
      uses: { value: 0, max: 0 }
    },
    img: "icons/magic/perception/eye-slit-purple.webp",
    sort: 400
  },
  {
    name: "Healing",
    type: "trait",
    system: {
      color: "#00B894",
      icon: "fas fa-heart",
      localKey: "AVANT.Trait.Healing",
      description: "Represents healing, restoration, and recovery abilities",
      category: "general",
      isActive: false,
      powerPointCost: 0,
      uses: { value: 0, max: 0 }
    },
    img: "icons/magic/life/heart-glowing-red.webp",
    sort: 500
  },
  {
    name: "Tech",
    type: "trait",
    system: {
      color: "#0984E3",
      icon: "fas fa-microchip",
      localKey: "AVANT.Trait.Tech",
      description: "Represents technological, digital, or cybernetic abilities and enhancements",
      category: "general",
      isActive: false,
      powerPointCost: 0,
      uses: { value: 0, max: 0 }
    },
    img: "icons/magic/symbols/circuit-matrix-blue.webp",
    sort: 600
  },
  {
    name: "Psychic",
    type: "trait",
    system: {
      color: "#E17055",
      icon: "fas fa-brain",
      localKey: "AVANT.Trait.Psychic",
      description: "Represents mental, telepathic, and psionic abilities",
      category: "general",
      isActive: false,
      powerPointCost: 0,
      uses: { value: 0, max: 0 }
    },
    img: "icons/magic/control/hypnosis-mesmerism-eye.webp",
    sort: 700
  },
  {
    name: "Legendary",
    type: "trait",
    system: {
      color: "#FDCB6E",
      icon: "fas fa-star",
      localKey: "AVANT.Trait.Legendary",
      description: "Marks items or abilities as legendary quality or rarity",
      category: "general",
      isActive: false,
      powerPointCost: 0,
      uses: { value: 0, max: 0 }
    },
    img: "icons/magic/symbols/star-inverted-yellow.webp",
    sort: 800
  }
];

/**
 * Create FoundryVTT NeDB compendium pack file (.db format)
 * FoundryVTT will automatically migrate this to LevelDB on first load
 * 
 * @param {string} packPath - Path to the pack file (should end with .db)
 * @param {Array} items - Array of item data to populate
 */
async function createNeDBPack(packPath, items) {
  console.log(`🔨 Creating NeDB pack at: ${packPath}`);
  
  // Ensure parent directory exists
  const parentDir = path.dirname(packPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  
  // Create NeDB data - each document on its own line as JSON
  const nedbData = items.map(item => JSON.stringify(item)).join('\n') + '\n';
  
  // Write the .db file
  fs.writeFileSync(packPath, nedbData, 'utf8');
  
  console.log(`✅ Created NeDB pack with ${items.length} items`);
  console.log(`📦 File size: ${Buffer.byteLength(nedbData, 'utf8')} bytes`);
  console.log(`🔄 FoundryVTT will auto-migrate this to LevelDB on first load`);
}

/**
 * Generate FoundryVTT item data with proper IDs
 * 
 * @param {Array} seeds - Trait seed data
 * @returns {Array} FoundryVTT item documents
 */
function generateItemDocuments(seeds) {
  return seeds.map((seed, index) => {
    // Generate a unique ID using name + timestamp + index
    const id = `trait_${seed.name.toLowerCase()}_${Date.now()}_${index}`;
    console.log(`📝 Generated ID for ${seed.name}: ${id}`);
    
    return {
      _id: id,
      name: seed.name,
      type: seed.type,
      img: seed.img || 'icons/svg/item-bag.svg',
      system: seed.system,
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
        createdTime: Date.now(),
        modifiedTime: Date.now(),
        lastModifiedBy: 'build-script'
      }
    };
  });
}

/**
 * Update system.json to use NeDB format (.db files)
 * 
 * @param {string} systemJsonPath - Path to system.json
 */
function updateSystemJsonForNeDB(systemJsonPath) {
  console.log('🔨 Updating system.json for NeDB format...');
  
  if (!fs.existsSync(systemJsonPath)) {
    console.error('❌ system.json not found!');
    return;
  }
  
  const systemJson = JSON.parse(fs.readFileSync(systemJsonPath, 'utf8'));
  
  // Update pack definition to use .db file instead of directory
  if (systemJson.packs) {
    systemJson.packs.forEach(pack => {
      if (pack.path === './packs/avant-traits') {
        pack.path = './packs/avant-traits.db';
        console.log(`✅ Updated pack path: ${pack.path}`);
      }
    });
  }
  
  // Write updated system.json
  fs.writeFileSync(systemJsonPath, JSON.stringify(systemJson, null, 2));
  console.log('✅ system.json updated for NeDB format');
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
    const systemJsonPath = path.join(distPath, 'system.json');
    
    console.log(`📁 Project root: ${projectRoot}`);
    console.log(`📁 Dist path: ${distPath}`);
    console.log(`📁 Trait pack path: ${traitPackPath}`);
    
    // Ensure dist directory exists
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath, { recursive: true });
    }
    
    // Generate item documents
    const itemDocs = generateItemDocuments(TRAIT_SEEDS);
    console.log(`📝 Generated ${itemDocs.length} trait documents`);
    
    // Create the compendium pack (NeDB format - FoundryVTT will auto-migrate to LevelDB)
    await createNeDBPack(traitPackPath, itemDocs);
    
    // Update system.json if it exists in dist
    if (fs.existsSync(systemJsonPath)) {
      updateSystemJsonForNeDB(systemJsonPath);
    } else {
      console.log('⚠️  system.json not found in dist - will be copied during main build');
    }
    
    console.log('🎉 Compendium pack build complete!');
    console.log('📋 Summary:');
    console.log(`   - Created pack: ${traitPackPath}`);
    console.log(`   - Items: ${itemDocs.length} traits`);
    console.log(`   - Format: NeDB (.db file) - FoundryVTT will auto-migrate to LevelDB`);
    
  } catch (error) {
    console.error('❌ Error building compendium packs:', error);
    process.exit(1);
  }
}

// Run the build if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildPacks();
}

export { buildPacks }; 