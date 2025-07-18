/**
 * @fileoverview Compendium Validation Script for Trait Drag-and-Drop
 * @description Validates that the avant-traits compendium exists and contains trait items
 * @author Avant VTT Team
 * @version 1.0.0
 */

/**
 * Validates that the trait compendium is properly configured for drag-and-drop functionality
 * This script is run during the build process to ensure the compendium is ready
 * 
 * @returns Promise that resolves if validation passes, rejects if validation fails
 */
export async function assertTraitCompendiumReady(): Promise<void> {
    console.log('🏷️ Avant | Validating trait compendium for drag-and-drop...');

    // Check if FoundryVTT game object is available
    const game = (globalThis as any).game;
    if (!game) {
        throw new Error('FoundryVTT game object not available - run this script in a running Foundry instance');
    }

    // Check if compendium packs are available
    if (!game.packs) {
        throw new Error('FoundryVTT compendium packs not available');
    }

    // Look for the traits compendium
    const traitPack = game.packs.get('avant.avant-traits');
    if (!traitPack) {
        throw new Error('Avant Traits compendium (avant.avant-traits) not found - check system.json configuration');
    }

    console.log('✅ Avant | Trait compendium found:', traitPack.title);

    // Validate compendium metadata
    const metadata = traitPack.metadata;
    if (metadata.type !== 'Item') {
        throw new Error(`Trait compendium has wrong type: ${metadata.type} (expected: Item)`);
    }

    if (metadata.system !== 'avant') {
        throw new Error(`Trait compendium has wrong system: ${metadata.system} (expected: avant)`);
    }

    console.log('✅ Avant | Trait compendium metadata is valid');

    // Check if compendium contains any items
    const index = traitPack.index;
    if (index.size === 0) {
        console.warn('⚠️  Avant | Trait compendium is empty - no traits available for drag-and-drop');
        return;
    }

    console.log(`✅ Avant | Trait compendium contains ${index.size} items`);

    // Sample a few items to validate they are trait items
    const sampleIds = Array.from(index.keys()).slice(0, 3);
    for (const itemId of sampleIds) {
        try {
            const item = await traitPack.getDocument(itemId);
            if (!item) {
                throw new Error(`Could not load item ${itemId} from trait compendium`);
            }

            if (item.type !== 'trait') {
                throw new Error(`Item ${item.name} has wrong type: ${item.type} (expected: trait)`);
            }

            // Check if item has expected trait properties
            const system = item.system;
            if (!system) {
                throw new Error(`Item ${item.name} has no system data`);
            }

            // These are the minimum required properties for drag-and-drop
            const requiredProperties = ['color', 'icon'];
            for (const prop of requiredProperties) {
                if (!(prop in system)) {
                    console.warn(`⚠️  Avant | Item ${item.name} is missing property: ${prop}`);
                }
            }

            console.log(`✅ Avant | Sample trait item "${item.name}" is valid`);
        } catch (error) {
            console.error(`❌ Avant | Error validating trait item ${itemId}:`, error);
            throw error;
        }
    }

    console.log('✅ Avant | Trait compendium validation complete - ready for drag-and-drop');
}

/**
 * Validates that the world-level custom traits compendium exists and is properly configured
 * This is optional - if it doesn't exist, it will be created automatically
 * 
 * @returns Promise that resolves if validation passes or pack doesn't exist
 */
export async function assertCustomTraitsCompendiumReady(): Promise<void> {
    console.log('🏷️ Avant | Validating custom traits compendium...');

    const game = (globalThis as any).game;
    if (!game?.packs) {
        throw new Error('FoundryVTT game object not available');
    }

    // Look for the custom traits compendium
    const customTraitPack = game.packs.get('world.custom-traits');
    if (!customTraitPack) {
        console.log('ℹ️  Avant | Custom traits compendium not found - will be created automatically when needed');
        return;
    }

    console.log('✅ Avant | Custom traits compendium found:', customTraitPack.title);

    // Validate metadata
    const metadata = customTraitPack.metadata;
    if (metadata.type !== 'Item') {
        throw new Error(`Custom traits compendium has wrong type: ${metadata.type} (expected: Item)`);
    }

    console.log('✅ Avant | Custom traits compendium is valid');
}

/**
 * Run all compendium validations
 * This is the main entry point for the validation script
 */
export async function validateAllCompendiums(): Promise<void> {
    try {
        await assertTraitCompendiumReady();
        await assertCustomTraitsCompendiumReady();
        console.log('🎉 Avant | All compendium validations passed - drag-and-drop ready!');
    } catch (error) {
        console.error('❌ Avant | Compendium validation failed:', error);
        throw error;
    }
}

// Export for console access
(globalThis as any).validateAvantCompendiums = validateAllCompendiums;

// Auto-run validation if this script is loaded in a Foundry environment
if (typeof (globalThis as any).game !== 'undefined') {
    // Wait for ready hook to ensure everything is loaded
    const Hooks = (globalThis as any).Hooks;
    if (Hooks) {
        Hooks.once('ready', async () => {
            try {
                await validateAllCompendiums();
            } catch (error) {
                console.error('❌ Avant | Auto-validation failed:', error);
            }
        });
    }
} 