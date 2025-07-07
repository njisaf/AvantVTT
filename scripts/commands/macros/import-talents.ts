/**
 * @fileoverview Import Talents Macro
 * @version 1.0.0 - Phase 2: Macro Utilities
 * @description Import talents from JSON files with file dialog interface
 * @author Avant VTT Team
 */

import type { MacroCommand } from '../base/types';

/**
 * Import Talents macro command
 * Provides a file dialog interface for importing talents from JSON files
 * with comprehensive validation, conflict resolution, and progress feedback
 */
export const importTalentsMacro: MacroCommand = {
    name: 'Import Avant Talents',
    type: 'script',
    scope: 'global',
    command: `
/**
 * Import Avant Talents - Direct Access Macro
 * Imports talents from JSON files into the Avant system
 */

console.log("🔄 Starting talent import process...");

// Check if actor exists with talents
const defaultActor = game.user.character || Array.from(game.actors)[0];
if (!defaultActor) {
    ui.notifications.error("No actor found! Please create a character first.");
    return;
}

console.log("✅ Found default actor:", defaultActor.name);

// Create file selection dialog
const dialogContent = \`
  <div style="padding: 15px;">
    <h3>🎯 Import Avant Talents</h3>
    <p>Select a JSON file containing talent data to import.</p>
    
    <div style="margin: 15px 0;">
      <label for="talent-file"><strong>Select JSON File:</strong></label>
      <input type="file" id="talent-file" accept=".json" style="width: 100%; margin-top: 5px; padding: 5px;">
    </div>
    
    <div style="margin: 15px 0;">
      <label for="target-actor"><strong>Target Actor:</strong></label>
      <select id="target-actor" style="width: 100%; margin-top: 5px; padding: 5px;">
        \${Array.from(game.actors).map(actor => 
          \`<option value="\${actor.id}" \${actor.id === defaultActor.id ? 'selected' : ''}>\${actor.name}</option>\`
        ).join('')}
      </select>
    </div>
    
    <div style="margin: 15px 0;">
      <label>
        <input type="checkbox" id="overwrite-existing" checked>
        Overwrite existing talents with same name
      </label>
    </div>
    
    <div style="margin-top: 15px; font-size: 12px; color: #666;">
      <strong>Note:</strong> Imported talents will be added to the selected actor.
    </div>
  </div>
\`;

new Dialog({
  title: "Import Avant Talents",
  content: dialogContent,
  buttons: {
    import: {
      icon: '<i class="fas fa-upload"></i>',
      label: "Import",
      callback: async (html) => {
        const fileInput = html.find('#talent-file')[0];
        const actorSelect = html.find('#target-actor')[0];
        const overwriteCheckbox = html.find('#overwrite-existing')[0];
        
        if (!fileInput.files || fileInput.files.length === 0) {
          ui.notifications.warn("Please select a file to import.");
          return;
        }
        
        const file = fileInput.files[0];
        const targetActorId = actorSelect.value;
        const overwriteExisting = overwriteCheckbox.checked;
        
        // Get target actor
        const targetActor = game.actors.get(targetActorId);
        if (!targetActor) {
          ui.notifications.error("Target actor not found!");
          return;
        }
        
        try {
          // Read and parse file
          const fileContent = await file.text();
          const talentData = JSON.parse(fileContent);
          
          // Validate data structure
          if (!talentData || typeof talentData !== 'object') {
            ui.notifications.error("Invalid file format: Expected JSON object");
            return;
          }
          
          // Handle both array format and object with talents property
          let talents = [];
          if (Array.isArray(talentData)) {
            talents = talentData;
          } else if (Array.isArray(talentData.talents)) {
            talents = talentData.talents;
          } else if (Array.isArray(talentData.data)) {
            talents = talentData.data;
          } else {
            ui.notifications.error("No talents array found in file");
            return;
          }
          
          if (talents.length === 0) {
            ui.notifications.warn("No talents found in the selected file");
            return;
          }
          
          console.log(\`📊 Found \${talents.length} talents to import\`);
          
          // Progress tracking
          let imported = 0;
          let skipped = 0;
          let errors = 0;
          
          // Show progress notification
          ui.notifications.info(\`Importing \${talents.length} talents...Please wait.\`);
          
          for (const talentData of talents) {
            try {
              // Validate talent data
              if (!talentData.name || typeof talentData.name !== 'string') {
                console.warn('Skipping talent with invalid name:', talentData);
                errors++;
                continue;
              }
              
              // Check for existing talent
              const existingTalent = targetActor.items.find(item => 
                item.type === 'talent' && item.name === talentData.name
              );
              
              if (existingTalent && !overwriteExisting) {
                console.log(\`Skipping existing talent: \${talentData.name}\`);
                skipped++;
                continue;
              }
              
              // Prepare talent item data
              const itemData = {
                name: talentData.name,
                type: 'talent',
                system: {
                  description: talentData.description || talentData.system?.description || '',
                  tier: talentData.tier || talentData.system?.tier || 1,
                  powerPointCost: talentData.powerPointCost || talentData.system?.powerPointCost || 0,
                  isActive: talentData.isActive || talentData.system?.isActive || false,
                  prerequisites: talentData.prerequisites || talentData.system?.prerequisites || '',
                  uses: talentData.uses || talentData.system?.uses || { value: 0, max: 0 },
                  traits: talentData.traits || talentData.system?.traits || []
                }
              };
              
              // Delete existing if overwriting
              if (existingTalent && overwriteExisting) {
                await existingTalent.delete();
              }
              
              // Create the talent
              await targetActor.createEmbeddedDocuments('Item', [itemData]);
              imported++;
              
              console.log(\`✅ Imported talent: \${talentData.name}\`);
              
            } catch (error) {
              console.error(\`❌ Failed to import talent: \${talentData.name}\`, error);
              errors++;
            }
          }
          
          // Show completion message
          const resultMessage = \`Talent Import Complete:
            • Imported: \${imported} talents
            • Skipped: \${skipped} existing talents
            • Errors: \${errors} failures\`;
          
          if (errors > 0) {
            ui.notifications.warn(resultMessage);
          } else {
            ui.notifications.info(resultMessage);
          }
          
          console.log("✅ Talent import process completed");
          console.log("📊 Import results:", { imported, skipped, errors });
          
        } catch (error) {
          console.error("❌ Talent import failed:", error);
          ui.notifications.error(\`Import failed: \${error.message}\`);
        }
      }
    },
    cancel: {
      icon: '<i class="fas fa-times"></i>',
      label: "Cancel"
    }
  },
  default: "import",
  close: () => console.log("Talent import dialog closed")
}).render(true);
    `,
    img: 'icons/svg/upgrade.svg',
    sort: 100,
    flags: {
        avant: {
            description: 'Import talents from JSON file to actor inventory',
            version: '1.0.0',
            category: 'talent-management'
        }
    }
};

/**
 * Export the macro for registration
 */
export default importTalentsMacro; 