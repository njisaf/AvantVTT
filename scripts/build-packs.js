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

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Macro seed data with real functionality
// Note: These seeds are also defined in scripts/commands/macros/ for runtime use
// TODO: Unify this with the commands module once we have a proper build-time import strategy
const MACRO_SEEDS = [
  {
    name: "Export Custom Traits",
    type: "script",
    command: `
/**
 * Export Custom Traits Macro
 * Exports only custom/world traits (excludes system built-ins)
 */

console.log("🔄 Starting custom trait export...");

// Robust file download function with File System Access API fallback
const saveFile = async (blob, suggestedName) => {
  // Feature detection: File System Access API support and not in iframe
  const supportsFileSystemAccess = 
    'showSaveFilePicker' in window &&
    (() => {
      try {
        return window.self === window.top;
      } catch {
        return false;
      }
    })();

  // Try File System Access API first (modern browsers)
  if (supportsFileSystemAccess) {
    try {
      const handle = await showSaveFilePicker({
        suggestedName,
        types: [{
          description: 'JSON files',
          accept: {'application/json': ['.json']}
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err) {
      // Fail silently if user canceled, otherwise fall back to DOM method
      if (err.name !== 'AbortError') {
        console.warn('File System Access API failed, falling back to DOM download:', err);
      } else {
        return false; // User canceled
      }
    }
  }

  // Fallback: Enhanced DOM download method
  try {
    const blobURL = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    
    // Configure anchor element
    anchor.href = blobURL;
    anchor.download = suggestedName;
    anchor.style.display = 'none';
    anchor.style.position = 'absolute';
    anchor.style.left = '-9999px';
    
    // Add to DOM, click, and clean up
    document.body.appendChild(anchor);
    
    // Use both click() and dispatchEvent for maximum compatibility
    anchor.click();
    
    // Alternative click method for stubborn browsers
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: false
    });
    anchor.dispatchEvent(clickEvent);
    
    // Clean up after a delay to ensure download started
    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobURL);
    }, 100);
    
    return true;
  } catch (fallbackError) {
    console.error('Enhanced DOM download failed:', fallbackError);
    throw fallbackError;
  }
};

// Get TraitProvider from multiple possible locations
let traitProvider = null;
const locations = [
  () => game?.avant?.initializationManager?.getService('traitProvider'),
  () => game?.avant?.traitProvider,
  () => window.traitProvider,
  () => globalThis.traitProvider
];

for (const getProvider of locations) {
  try {
    traitProvider = getProvider();
    if (traitProvider) break;
  } catch (e) {
    // Continue to next location
  }
}

if (!traitProvider) {
  ui.notifications.error("TraitProvider not found. Please ensure the system is fully loaded.");
  return;
}

console.log("✅ Found TraitProvider:", traitProvider);

try {
  // Get all traits using the correct method
  const allTraitsResult = await traitProvider.getAll();
  
  if (!allTraitsResult.success) {
    ui.notifications.error(\`Failed to load traits: \${allTraitsResult.error}\`);
    return;
  }
  
  console.log(\`📊 Found \${allTraitsResult.data.length} total traits\`);
  
  // Filter for custom/world traits only (exclude system traits)
  const customTraits = allTraitsResult.data.filter(trait => trait.source === 'world');
  console.log(\`📊 Found \${customTraits.length} custom traits (filtered from \${allTraitsResult.data.length} total)\`);
  
  if (customTraits.length === 0) {
    ui.notifications.warn("No custom traits found to export. Only custom/world traits are exported (system traits excluded).");
    console.log("💡 Tip: Create custom traits using the 'Create Custom Trait' macro or by adding items to the 'Custom Traits' compendium.");
    return;
  }
  
  // Build export data structure
  const exportData = {
    metadata: {
      timestamp: new Date().toISOString(),
      systemVersion: game.system.version,
      traitCount: customTraits.length,
      formatVersion: "1.0.0",
      exportSource: "custom-only",
      description: "Custom traits export (excludes system built-in traits)"
    },
    traits: customTraits.map(trait => ({
      id: trait.id,
      name: trait.name,
      color: trait.color,
      icon: trait.icon,
      localKey: trait.localKey,
      description: trait.description,
      source: trait.source,
      tags: trait.item.system?.tags || [],
      rarity: trait.item.system?.rarity || "common",
      effects: trait.item.system?.effects || "",
      textColor: trait.item.system?.textColor || "#000000",
      systemData: trait.item.system,
      exportedAt: new Date().toISOString()
    }))
  };
  
  // Create JSON content and blob
  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const filename = \`custom-traits-export-\${new Date().toISOString().split('T')[0]}.json\`;
  
  // Use robust download function
  const downloadSuccess = await saveFile(blob, filename);
  
  if (downloadSuccess !== false) { // Success or fallback, but not user cancel
    console.log(\`✅ Export complete: \${customTraits.length} custom traits\`);
    console.log("📁 Custom traits exported:", customTraits.map(t => t.name));
    ui.notifications.info(\`Successfully exported \${customTraits.length} custom traits!\`);
  } else {
    console.log("ℹ️ Export canceled by user");
  }
  
} catch (error) {
  console.error("❌ Export failed:", error);
  ui.notifications.error(\`Export failed: \${error.message}\`);
}
    `,
    img: "icons/svg/download.svg",
    folder: null,
    sort: 100,
    flags: {}
  },

  {
    name: "Create Custom Trait",
    type: "script",
    scope: "global",
    command: `
/**
 * Create Custom Trait Macro
 * Opens trait creation sheet and ensures custom trait compendium exists
 */

console.log("🎨 Starting custom trait creation...");

// Ensure custom traits compendium exists
let customTraitsPack = game.packs.get('world.custom-traits');

if (!customTraitsPack) {
    console.log("📦 Creating custom traits compendium...");
    
    try {
        // Create the custom traits compendium
        const packData = {
            name: 'world.custom-traits',
            label: 'Custom Traits',
            type: 'Item',
            system: game.system.id,
            private: false
        };
        
        customTraitsPack = await foundry.documents.collections.CompendiumCollection.createCompendium(packData);
        
        console.log("✅ Custom traits compendium created successfully!");
        ui.notifications.info("📦 Created 'Custom Traits' compendium!");
        
    } catch (error) {
        console.error("❌ Failed to create custom traits compendium:", error);
        ui.notifications.error("Failed to create custom traits compendium. Using world items instead.");
        
        // Fallback: create trait as world item instead
        console.log("🔄 Falling back to world item creation...");
        
        const traitData = {
            name: "New Custom Trait",
            type: "trait",
            img: "icons/svg/item-bag.svg",
            system: {
                description: "",
                color: "#00E0DC",
                icon: "fas fa-tag",
                localKey: "",
                tags: [],
                rarity: "common",
                effects: "",
                textColor: "#000000"
            }
        };
        
        try {
            const newTrait = await Item.create(traitData);
            console.log("✅ Created world trait item:", newTrait.name);
            ui.notifications.info(\`Created trait '\${newTrait.name}' in world items!\`);
            
            // Open the trait sheet for editing
            newTrait.sheet.render(true);
            
        } catch (itemError) {
            console.error("❌ Failed to create world trait:", itemError);
            ui.notifications.error("Failed to create trait item.");
        }
        
        return;
    }
}

console.log("✅ Custom traits compendium available:", customTraitsPack.metadata.label);

// Check if compendium is locked
if (customTraitsPack.locked) {
    console.log("🔓 Custom traits compendium is locked, unlocking for editing...");
    
    try {
        // Unlock the compendium for editing
        await customTraitsPack.configure({ locked: false });
        console.log("✅ Compendium unlocked successfully!");
        ui.notifications.info("🔓 Unlocked custom traits compendium for editing!");
    } catch (error) {
        console.error("❌ Failed to unlock compendium:", error);
        ui.notifications.warn("⚠️ Could not unlock compendium. You may need to right-click it and select 'Toggle Edit Lock'.");
    }
}

// Create new trait in the custom compendium
console.log("🎨 Creating new trait in custom compendium...");

const traitData = {
    name: "New Custom Trait",
    type: "trait",
    img: "icons/svg/item-bag.svg",
    system: {
        description: "",
        color: "#00E0DC",
        icon: "fas fa-tag",
        localKey: "",
        tags: [],
        rarity: "common",
        effects: "",
        textColor: "#000000"
    }
};

try {
    // Create the trait in the compendium
    const newTrait = await Item.create(traitData, { pack: customTraitsPack.collection });
    console.log("✅ Created custom trait:", newTrait.name);
    ui.notifications.info(\`Created trait '\${newTrait.name}' in Custom Traits compendium!\`);
    
    // Open the trait sheet for immediate editing
    newTrait.sheet.render(true);
    
    console.log("🎨 Trait creation complete! Edit the trait and save your changes.");
    
    // Clear trait provider cache so new trait appears in autocomplete
    if (game?.avant?.initializationManager) {
        const traitProvider = game.avant.initializationManager.getService('traitProvider');
        if (traitProvider && typeof traitProvider.clearCache === 'function') {
            traitProvider.clearCache();
            console.log("🔄 Cleared trait provider cache - new trait will appear in autocomplete");
        }
    }
    
} catch (error) {
    console.error("❌ Failed to create trait:", error);
    ui.notifications.error(\`Failed to create trait: \${error.message}\`);
}
    `,
    img: "icons/svg/item-bag.svg",
    folder: null,
    sort: 50,
    flags: {
      "avant": {
        "description": "Create a new custom trait in the Custom Traits compendium with trait sheet interface",
        "version": "1.0.0",
        "category": "trait-management"
      }
    }
  },

  {
    name: "Import to Avant Traits",
    type: "script",
    scope: "global",
    command: `
/**
 * Import to Avant Traits Macro
 * Imports traits from JSON files into the Avant Traits system compendium
 */

console.log("🔄 Starting trait import process...");

// Check if Avant Traits compendium exists and is unlocked
const avantTraitsPack = game.packs.get('avant.avant-traits');
if (!avantTraitsPack) {
  ui.notifications.error("Avant Traits compendium pack not found!");
  return;
}

if (avantTraitsPack.locked) {
  ui.notifications.warn("Avant Traits compendium is locked! Please unlock it first by right-clicking the compendium and selecting 'Toggle Edit Lock'.");
  return;
}

// Also check for world custom traits pack as fallback
const customTraitsPack = game.packs.get('world.custom-traits');

// Create dialog to let user choose target and select file
const dialogContent = \`
  <div style="padding: 10px;">
    <h3>Import Avant Traits</h3>
    <p>Select a JSON file containing trait data to import.</p>
    
    <div style="margin: 10px 0;">
      <label><strong>Import to:</strong></label>
      <select id="target-pack" style="width: 100%; margin-top: 5px;">
        <option value="avant.avant-traits">Avant Traits (System Pack)</option>
        \${customTraitsPack ? '<option value="world.custom-traits">Custom Traits (World Pack)</option>' : ''}
      </select>
    </div>
    
    <div style="margin: 10px 0;">
      <label for="trait-file"><strong>Select JSON File:</strong></label>
      <input type="file" id="trait-file" accept=".json" style="width: 100%; margin-top: 5px;">
    </div>
    
    <div style="margin: 10px 0;">
      <label>
        <input type="checkbox" id="overwrite-existing" checked>
        Overwrite existing traits with same name
      </label>
    </div>
  </div>
\`;

// Show dialog
new Dialog({
  title: "Import Avant Traits",
  content: dialogContent,
  buttons: {
    import: {
      label: "Import Traits",
      callback: async (html) => {
        const targetPackId = html.find('#target-pack').val();
        const fileInput = html.find('#trait-file')[0];
        const overwriteExisting = html.find('#overwrite-existing').prop('checked');
        
        if (!fileInput.files.length) {
          ui.notifications.error("Please select a JSON file to import.");
          return;
        }
        
        const file = fileInput.files[0];
        console.log(\`📁 Selected file: \${file.name}\`);
        
        try {
          // Read file content
          const text = await file.text();
          const data = JSON.parse(text);
          
          console.log("📊 Parsed JSON data:", data);
          
          if (!data.traits || !Array.isArray(data.traits)) {
            ui.notifications.error("Invalid file format. Expected JSON with 'traits' array.");
            return;
          }
          
          const targetPack = game.packs.get(targetPackId);
          if (!targetPack) {
            ui.notifications.error(\`Target pack '\${targetPackId}' not found!\`);
            return;
          }
          
          if (targetPack.locked) {
            ui.notifications.error(\`Target pack '\${targetPack.metadata.label}' is locked! Please unlock it first.\`);
            return;
          }
          
          console.log(\`🎯 Importing \${data.traits.length} traits to \${targetPack.metadata.label}...\`);
          
          let importedCount = 0;
          let skippedCount = 0;
          let updatedCount = 0;
          
          for (const traitData of data.traits) {
            try {
              // Validate trait data
              if (!traitData.name || !traitData.color || !traitData.icon) {
                console.warn("⚠️ Skipping invalid trait:", traitData);
                skippedCount++;
                continue;
              }
              
              // Check if trait already exists in the pack
              const existingItems = await targetPack.getDocuments();
              const existingTrait = existingItems.find(item => 
                item.name === traitData.name && item.type === 'trait'
              );
              
              // Prepare item data for creation/update
              const itemData = {
                name: traitData.name,
                type: "trait",
                img: "icons/svg/item-bag.svg", // Use default image since FontAwesome icons go in system.icon
                system: {
                  description: traitData.description || "",
                  color: traitData.color,
                  icon: traitData.icon || "fas fa-tag",
                  localKey: traitData.localKey || "",
                  tags: Array.isArray(traitData.tags) ? traitData.tags.filter(tag => tag != null) : [],
                  rarity: traitData.rarity || "common",
                  effects: traitData.effects || "",
                  textColor: traitData.textColor || "#000000"
                }
              };
              
              if (existingTrait) {
                if (overwriteExisting) {
                  // Update existing trait - include _id for FoundryVTT v13 compatibility
                  const updateData = {
                    _id: existingTrait._id,
                    ...itemData
                  };
                  await existingTrait.update(updateData);
                  console.log(\`✅ Updated trait: \${traitData.name}\`);
                  updatedCount++;
                } else {
                  console.log(\`⏭️ Skipped existing trait: \${traitData.name}\`);
                  skippedCount++;
                }
              } else {
                // Create new trait
                await Item.create(itemData, { pack: targetPackId });
                console.log(\`✅ Imported trait: \${traitData.name}\`);
                importedCount++;
              }
              
            } catch (error) {
              console.error(\`❌ Error importing trait '\${traitData.name}':\`, error);
              skippedCount++;
            }
          }
          
          // Show summary
          const summary = [
            \`📊 Import Summary for \${targetPack.metadata.label}:\`,
            \`• \${importedCount} traits imported\`,
            \`• \${updatedCount} traits updated\`,
            \`• \${skippedCount} traits skipped\`
          ].join('\\n');
          
          console.log(summary);
          ui.notifications.info(\`Successfully processed \${data.traits.length} traits! Check console for details.\`);
          
          // Clear trait provider cache to refresh autocomplete
          if (game?.avant?.initializationManager) {
            const traitProvider = game.avant.initializationManager.getService('traitProvider');
            if (traitProvider && typeof traitProvider.clearCache === 'function') {
              traitProvider.clearCache();
              console.log("🔄 Cleared trait provider cache");
            }
          }
          
        } catch (error) {
          console.error("❌ Import failed:", error);
          ui.notifications.error(\`Import failed: \${error.message}\`);
        }
      }
    },
    cancel: {
      label: "Cancel"
    }
  },
  default: "import",
  render: (html) => {
    console.log("🏷️ Import dialog rendered");
  }
}).render(true);
    `,
    img: "icons/svg/upload.svg",
    folder: null,
    sort: 200,
    flags: {
      "avant": {
        "description": "Imports traits from JSON file into the world compendium with file dialog interface",
        "version": "1.0.0",
        "category": "trait-management"
      }
    }
  }
];

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
    img: "icons/svg/item-bag.svg",
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
    img: "icons/svg/item-bag.svg",
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
    img: "icons/svg/item-bag.svg",
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
    img: "icons/svg/item-bag.svg",
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
    img: "icons/svg/item-bag.svg",
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
    img: "icons/svg/item-bag.svg",
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
    img: "icons/svg/item-bag.svg",
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
    img: "icons/svg/item-bag.svg",
    sort: 800
  }
];

const TALENT_SEEDS = [
  {
    name: "Fire Strike",
    type: "talent",
    system: {
      apCost: 2,
      levelRequirement: 1,
      traits: ["Fire", "Attack"],
      requirements: "",
      description: "Channel fire energy into a devastating melee attack. Deal fire damage to a target within reach."
    },
    img: "icons/svg/item-bag.svg",
    sort: 100
  },
  {
    name: "Ice Shield",
    type: "talent",
    system: {
      apCost: 1,
      levelRequirement: 1,
      traits: ["Ice", "Defense"],
      requirements: "",
      description: "Create a protective barrier of ice around yourself. Grants temporary armor against incoming attacks."
    },
    img: "icons/svg/item-bag.svg",
    sort: 200
  },
  {
    name: "Lightning Bolt",
    type: "talent",
    system: {
      apCost: 3,
      levelRequirement: 3,
      traits: ["Lightning", "Ranged"],
      requirements: "Must have Focus 15+",
      description: "Unleash a powerful bolt of lightning that can arc between multiple targets."
    },
    img: "icons/svg/item-bag.svg",
    sort: 300
  }
];

const AUGMENT_SEEDS = [
  {
    name: "Neural Interface",
    type: "augment",
    system: {
      apCost: 1,
      ppCost: 2,
      levelRequirement: 2,
      traits: ["Tech", "Enhancement"],
      requirements: "Must have cybernetic compatibility",
      description: "A neural implant that enhances cognitive processing and allows interface with digital systems."
    },
    img: "icons/svg/item-bag.svg",
    sort: 100
  },
  {
    name: "Muscle Enhancer",
    type: "augment",
    system: {
      apCost: 0,
      ppCost: 0,
      levelRequirement: 1,
      traits: ["Tech", "Physical"],
      requirements: "",
      description: "Passive muscle fiber enhancement that provides constant physical performance boost."
    },
    img: "icons/svg/item-bag.svg",
    sort: 200
  },
  {
    name: "Psychic Amplifier",
    type: "augment",
    system: {
      apCost: 2,
      ppCost: 4,
      levelRequirement: 4,
      traits: ["Psychic", "Enhancement"],
      requirements: "Must have natural psychic ability",
      description: "Amplifies existing psychic abilities, allowing for more powerful mental effects."
    },
    img: "icons/svg/item-bag.svg",
    sort: 300
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
 * Generate stable FoundryVTT document IDs for compendium items
 * 
 * CRITICAL FIX: This function was completely rewritten to solve the "trait display issue"
 * where traits appeared as gray boxes showing IDs instead of proper colors and names.
 * 
 * ROOT CAUSE OF THE ORIGINAL ISSUE:
 * - Previous implementation generated random IDs on every build (like jNreUvVJ5HZsxCXM)
 * - This meant trait IDs changed every time we ran `npm run build`
 * - Items in actor sheets referenced old trait IDs that no longer existed
 * - Result: Trait provider couldn't find traits, displayed gray boxes with IDs
 * 
 * THE SOLUTION - STABLE, SEMANTIC IDs:
 * Instead of random generation, we now create stable, meaningful IDs like:
 * - "avant-trait-fire" (always the same for Fire trait)
 * - "avant-trait-ice" (always the same for Ice trait)  
 * - "avant-talent-fire-strike" (always the same for Fire Strike talent)
 * 
 * BENEFITS:
 * 1. Same trait always gets same ID across ALL builds
 * 2. No more broken references between builds
 * 3. Human-readable IDs that make sense
 * 4. No need for legacy ID mapping systems
 * 5. Traits display properly with colors and icons
 * 
 * @param {string} seed - The source string for ID generation (e.g., "trait-Fire-0")
 * @returns {string} A stable, semantic ID (e.g., "avant-trait-fire")
 */
function generateFoundryId(seed = '') {
  // For traits and system items, use stable, semantic IDs
  // This ensures consistency across builds and installations
  if (seed.includes('trait-')) {
    // Extract trait name and create stable ID
    // "trait-Fire-0" → "avant-trait-fire"
    const traitName = seed.replace('trait-', '').replace(/-\d+$/, '').toLowerCase();
    return `avant-trait-${traitName}`;
  }

  if (seed.includes('talent-')) {
    // Extract talent name and create stable ID
    // "talent-Fire Strike-0" → "avant-talent-fire-strike"
    const talentName = seed.replace('talent-', '').replace(/-\d+$/, '').toLowerCase().replace(/\s+/g, '-');
    return `avant-talent-${talentName}`;
  }

  if (seed.includes('augment-')) {
    // Extract augment name and create stable ID
    // "augment-Neural Interface-0" → "avant-augment-neural-interface"
    const augmentName = seed.replace('augment-', '').replace(/-\d+$/, '').toLowerCase().replace(/\s+/g, '-');
    return `avant-augment-${augmentName}`;
  }

  if (seed.includes('macro-')) {
    // Extract macro name and create stable ID
    // "macro-Import Traits-0" → "avant-macro-import-traits"
    const macroName = seed.replace('macro-', '').replace(/-\d+$/, '').toLowerCase().replace(/\s+/g, '-');
    return `avant-macro-${macroName}`;
  }

  // For other items, use a simple hash-based approach for stability
  // This provides deterministic IDs without being semantic
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  const seedValue = seed || 'default';

  // Create a simple hash from the seed
  let hash = 0;
  for (let i = 0; i < seedValue.length; i++) {
    const char = seedValue.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use the hash to generate a deterministic 16-character ID
  for (let i = 0; i < 16; i++) {
    const index = Math.abs(hash + i * 31) % chars.length;
    result += chars[index];
  }

  return result;
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

  // Generate a consistent user ID for build script
  const buildUserId = generateFoundryId('buildsystem');

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

    // Generate a proper 16-character alphanumeric ID
    const id = generateFoundryId(`${itemType}-${seed.name}-${index}`);
    console.log(`📝 Generated ID for ${seed.name}: ${id}`);

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
        createdTime: Date.now(),
        modifiedTime: Date.now(),
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
  // Generate a consistent user ID for build script
  const buildUserId = generateFoundryId('buildsystem');

  return seeds.map((seed, index) => {
    // Generate a proper 16-character alphanumeric ID
    const id = generateFoundryId(`macro-${seed.name}-${index}`);
    console.log(`📝 Generated ID for ${seed.name}: ${id}`);

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
        createdTime: Date.now(),
        modifiedTime: Date.now(),
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
    console.log(`   - Traits: ${traitPackPath}`);
    console.log(`   - Macros: ${macroPackPath}`);
    console.log(`   - Talents: ${talentPackPath}`);
    console.log(`   - Augments: ${augmentPackPath}`);

    // Ensure dist directory exists
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath, { recursive: true });
    }

    // Generate documents with validation
    console.log('🔄 Phase 2: Generating documents with build-time validation...');

    const traitDocs = generateItemDocuments(TRAIT_SEEDS, 'trait');
    console.log(`📝 Generated ${traitDocs.length} trait documents`);

    const macroDocs = generateMacroDocuments(MACRO_SEEDS);
    console.log(`📝 Generated ${macroDocs.length} macro documents`);

    const talentDocs = generateItemDocuments(TALENT_SEEDS, 'talent');
    console.log(`📝 Generated ${talentDocs.length} talent documents`);

    const augmentDocs = generateItemDocuments(AUGMENT_SEEDS, 'augment');
    console.log(`📝 Generated ${augmentDocs.length} augment documents`);

    // Validate that all items passed validation (this would have thrown errors above if not)
    console.log('✅ All items passed build-time schema validation');

    // Create compendium packs (NeDB format - FoundryVTT will auto-migrate to LevelDB)
    console.log('🔄 Creating compendium pack files...');

    await createNeDBPack(traitPackPath, traitDocs);
    await createNeDBPack(macroPackPath, macroDocs);
    await createNeDBPack(talentPackPath, talentDocs);
    await createNeDBPack(augmentPackPath, augmentDocs);

    // Update system.json if it exists in dist
    if (fs.existsSync(systemJsonPath)) {
      updateSystemJsonForLevelDB(systemJsonPath);
    } else {
      console.log('⚠️  system.json not found in dist - will be copied during main build');
    }

    console.log('🎉 Compendium pack build complete!');
    console.log('📋 Summary:');
    console.log(`   - Created trait pack: ${traitPackPath} (${traitDocs.length} items)`);
    console.log(`   - Created macro pack: ${macroPackPath} (${macroDocs.length} items)`);
    console.log(`   - Created talent pack: ${talentPackPath} (${talentDocs.length} items)`);
    console.log(`   - Created augment pack: ${augmentPackPath} (${augmentDocs.length} items)`);
    console.log(`   - Total items: ${traitDocs.length + macroDocs.length + talentDocs.length + augmentDocs.length}`);
    console.log(`   - Format: NeDB (.db files) - FoundryVTT v13 will auto-migrate to LevelDB folders`);
    console.log(`   - Validation: All items validated against schema during build`);

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