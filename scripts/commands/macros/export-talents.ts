/**
 * @fileoverview Export Talents Macro
 * @version 1.0.0 - Phase 2: Macro Utilities
 * @description Export talents from actors to JSON files
 * @author Avant VTT Team
 */

import type { MacroCommand } from '../base/types';

/**
 * Export Talents macro command
 * Exports talents from selected actors to a downloadable JSON file
 */
export const exportTalentsMacro: MacroCommand = {
    name: 'Export Avant Talents',
    type: 'script',
    scope: 'global',
    command: `
/**
 * Export Avant Talents Macro
 * Exports talents from actors to JSON file
 */

console.log("🔄 Starting talent export...");

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

// Get all actors that have talents
const actorsWithTalents = Array.from(game.actors).filter(actor => 
  actor.items.some(item => item.type === 'talent')
);

if (actorsWithTalents.length === 0) {
  ui.notifications.warn("No actors with talents found!");
  console.log("💡 Tip: Create some talents on your characters first.");
  return;
}

console.log(\`📊 Found \${actorsWithTalents.length} actors with talents\`);

try {
  // Collect all talents from all actors
  const allTalents = [];
  
  for (const actor of actorsWithTalents) {
    const actorTalents = actor.items.filter(item => item.type === 'talent');
    
    for (const talent of actorTalents) {
      allTalents.push({
        id: talent.id,
        name: talent.name,
        type: talent.type,
        actorName: actor.name,
        actorId: actor.id,
        description: talent.system?.description || '',
        tier: talent.system?.tier || 1,
        powerPointCost: talent.system?.powerPointCost || 0,
        isActive: talent.system?.isActive || false,
        prerequisites: talent.system?.prerequisites || '',
        uses: talent.system?.uses || { value: 0, max: 0 },
        traits: talent.system?.traits || [],
        systemData: talent.system,
        exportedAt: new Date().toISOString()
      });
    }
  }
  
  console.log(\`📊 Found \${allTalents.length} total talents across all actors\`);
  
  if (allTalents.length === 0) {
    ui.notifications.warn("No talents found to export!");
    return;
  }
  
  // Build export data structure
  const exportData = {
    metadata: {
      timestamp: new Date().toISOString(),
      systemVersion: game.system.version,
      talentCount: allTalents.length,
      actorCount: actorsWithTalents.length,
      formatVersion: "1.0.0",
      exportSource: "actors",
      description: "Talents export from actor inventories"
    },
    talents: allTalents,
    actors: actorsWithTalents.map(actor => ({
      id: actor.id,
      name: actor.name,
      talentCount: actor.items.filter(item => item.type === 'talent').length
    }))
  };
  
  // Create JSON content and blob
  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const filename = \`talents-export-\${new Date().toISOString().split('T')[0]}.json\`;
  
  // Use robust download function
  const downloadSuccess = await saveFile(blob, filename);
  
  if (downloadSuccess !== false) { // Success or fallback, but not user cancel
    console.log(\`✅ Export complete: \${allTalents.length} talents from \${actorsWithTalents.length} actors\`);
    console.log("📁 Talents exported from actors:", actorsWithTalents.map(a => a.name));
    ui.notifications.info(\`Successfully exported \${allTalents.length} talents from \${actorsWithTalents.length} actors!\`);
  } else {
    console.log("ℹ️ Export canceled by user");
  }
  
} catch (error) {
  console.error("❌ Export failed:", error);
  ui.notifications.error(\`Export failed: \${error.message}\`);
}
    `,
    img: 'icons/svg/download.svg',
    sort: 101,
    flags: {
        avant: {
            description: 'Export talents from actors to JSON file',
            version: '1.0.0',
            category: 'talent-management'
        }
    }
};

/**
 * Export the macro for registration
 */
export default exportTalentsMacro; 