/**
 * @fileoverview Import Traits Macro
 * @version 1.0.0
 * @description Import traits from JSON files with file dialog interface
 * @author Avant VTT Team
 */

import type { MacroCommand } from '../base/types';

/**
 * Import Traits macro command
 * Provides a file dialog interface for importing traits from JSON files
 * with comprehensive validation, conflict resolution, and progress feedback
 */
export const importTraitsMacro: MacroCommand = {
    name: 'Import to Avant Traits',
    type: 'script',
    scope: 'global',
    command: `
/**
 * Import Avant Traits - Direct Access Macro
 * Imports traits from JSON files into the Avant Traits system
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

// Create file selection dialog
const dialogContent = \`
  <div style="padding: 15px;">
    <h3>🏷️ Import Avant Traits</h3>
    <p>Select a JSON file containing trait data to import.</p>
    
    <div style="margin: 15px 0;">
      <label for="trait-file"><strong>Select JSON File:</strong></label>
      <input type="file" id="trait-file" accept=".json" style="width: 100%; margin-top: 5px; padding: 5px;">
    </div>
    
    <div style="margin: 15px 0;">
      <label>
        <input type="checkbox" id="overwrite-existing" checked>
        Overwrite existing traits with same name
      </label>
    </div>
    
    <div style="margin-top: 15px; font-size: 12px; color: #666;">
      <strong>Note:</strong> Imported traits will be added to the "Avant Traits" system compendium.
    </div>
  </div>
\`;

// Show import dialog
new Dialog({
  title: "Import Avant Traits",
  content: dialogContent,
  buttons: {
    import: {
      icon: '<i class="fas fa-upload"></i>',
      label: "Import Traits",
      callback: async (html) => {
        const fileInput = html.find('#trait-file')[0];
        const overwriteExisting = html.find('#overwrite-existing').prop('checked');
        
        if (!fileInput.files.length) {
          ui.notifications.error("Please select a JSON file to import.");
          return;
        }
        
        const file = fileInput.files[0];
        console.log(\`📁 Selected file: \${file.name}\`);
        
        try {
          // Read and parse file
          const text = await file.text();
          const data = JSON.parse(text);
          
          if (!data.traits || !Array.isArray(data.traits)) {
            ui.notifications.error("Invalid file format. Expected JSON with 'traits' array.");
            return;
          }
          
          console.log(\`🎯 Importing \${data.traits.length} traits...\`);
          
          let importedCount = 0;
          let updatedCount = 0;
          let skippedCount = 0;
          
          for (const traitData of data.traits) {
            try {
              // Prepare item data with fallback image
              const itemData = {
                name: traitData.name,
                type: "trait",
                img: "icons/svg/item-bag.svg", // Use consistent fallback image
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
              
              // Check if trait already exists
              const existingTrait = avantTraitsPack.index.find(entry => entry.name === traitData.name);
              
              if (existingTrait && overwriteExisting) {
                // Update existing trait
                const existingDoc = await avantTraitsPack.getDocument(existingTrait._id);
                if (existingDoc) {
                  await existingDoc.update(itemData);
                  console.log(\`✅ Updated trait: \${traitData.name}\`);
                  updatedCount++;
                } else {
                  console.log(\`⏭️ Skipped existing trait: \${traitData.name}\`);
                  skippedCount++;
                }
              } else if (!existingTrait) {
                // Create new trait
                await Item.create(itemData, { pack: avantTraitsPack.collection });
                console.log(\`✅ Imported trait: \${traitData.name}\`);
                importedCount++;
              } else {
                console.log(\`⏭️ Skipped existing trait: \${traitData.name}\`);
                skippedCount++;
              }
              
            } catch (error) {
              console.error(\`❌ Error importing trait '\${traitData.name}':\`, error);
              skippedCount++;
            }
          }
          
          // Show summary
          const summary = [
            \`📊 Import Summary:\`,
            \`• \${importedCount} traits imported\`,
            \`• \${updatedCount} traits updated\`,
            \`• \${skippedCount} traits skipped\`
          ].join('\\n');
          
          console.log(summary);
          ui.notifications.info(\`Successfully processed \${data.traits.length} traits! Check console for details.\`);
          
          // Clear trait provider cache
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
      icon: '<i class="fas fa-times"></i>',
      label: "Cancel"
    }
  },
  default: "import"
}).render(true);
    `,
    img: 'icons/svg/upload.svg',
    sort: 200,
    flags: {
        avant: {
            description: 'Import traits from JSON file into the world compendium with file dialog interface',
            version: '1.0.0',
            category: 'trait-management'
        }
    }
};

/**
 * Export the macro for registration
 */
export default importTraitsMacro; 