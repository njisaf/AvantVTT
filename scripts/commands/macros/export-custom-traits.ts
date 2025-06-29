/**
 * @fileoverview Export Custom Traits Macro
 * @version 1.0.0
 * @description Export only custom/world traits (excludes system built-ins)
 * @author Avant VTT Team
 */

import type { MacroCommand } from '../base/types';

/**
 * Export Custom Traits macro command
 * Exports only custom/world traits to a downloadable JSON file,
 * excluding system built-in traits for clean data export
 */
export const exportCustomTraitsMacro: MacroCommand = {
    name: 'Export Custom Traits',
    type: 'script',
    scope: 'global',
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
    img: 'icons/svg/download.svg',
    sort: 100,
    flags: {
        avant: {
            description: 'Export only custom/world traits to JSON file (excludes system traits)',
            version: '1.0.0',
            category: 'trait-management'
        }
    }
};

/**
 * Export the macro for registration
 */
export default exportCustomTraitsMacro; 