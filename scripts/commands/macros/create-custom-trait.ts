/**
 * @fileoverview Create Custom Trait Macro
 * @version 1.0.0
 * @description One-click custom trait creation with automatic compendium setup
 * @author Avant VTT Team
 */

import type { MacroCommand } from '../base/types';

/**
 * Create Custom Trait macro command
 * Automatically creates custom trait compendium, unlocks it, creates a new trait,
 * and opens the trait sheet for immediate editing
 */
export const createCustomTraitMacro: MacroCommand = {
    name: 'Create Custom Trait',
    type: 'script',
    scope: 'global',
    command: `
/**
 * Create Custom Trait - Direct Access Macro
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
    img: 'icons/svg/item-bag.svg',
    sort: 50,
    flags: {
        avant: {
            description: 'Create a new custom trait in the Custom Traits compendium with trait sheet interface',
            version: '1.0.0',
            category: 'trait-management'
        }
    }
};

/**
 * Export the macro for registration
 */
export default createCustomTraitMacro; 