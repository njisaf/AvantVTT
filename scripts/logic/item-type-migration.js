/**
 * @fileoverview Item Type Migration Utilities
 * @description One-time migration functions to correct item types for talents and augments
 * @version 1.0.0
 * @author Avant Development Team
 */

/**
 * Migrates items with incorrect types to their proper types.
 * 
 * This function identifies items that were incorrectly typed as "gear" but
 * should be "talent" or "augment" based on their system data structure.
 * This can happen during system upgrades or data imports.
 * 
 * @param {Actor} actor - The actor to migrate items for
 * @returns {Promise<Object>} Migration result with counts
 * 
 * @example
 * ```javascript
 * // Migrate all items for a specific actor
 * const result = await migrateItemTypes(actor);
 * console.log(`Migrated ${result.migrated} items`);
 * ```
 */
export async function migrateItemTypes(actor) {
    if (!actor || !actor.items) {
        return { checked: 0, migrated: 0, errors: 0 };
    }

    let checked = 0;
    let migrated = 0;
    let errors = 0;

    console.log(`🔄 Starting item type migration for actor: ${actor.name}`);

    for (const item of actor.items) {
        checked++;
        
        try {
            const correctType = determineCorrectItemType(item);
            
            if (correctType && correctType !== item.type) {
                console.log(`📝 Migrating item "${item.name}" from "${item.type}" to "${correctType}"`);
                
                await item.update({ type: correctType });
                migrated++;
            }
        } catch (error) {
            console.error(`❌ Failed to migrate item "${item.name}":`, error);
            errors++;
        }
    }

    const result = { checked, migrated, errors };
    console.log(`✅ Item migration complete:`, result);
    
    return result;
}

/**
 * Determines the correct item type based on system data.
 * 
 * This function examines an item's system data to determine what its
 * type should actually be. It looks for type-specific properties that
 * indicate the item was meant to be a different type.
 * 
 * @param {Object} item - The item to analyze
 * @returns {string|null} The correct item type, or null if no change needed
 * 
 * @example
 * ```javascript
 * // Check if an item needs type correction
 * const correctType = determineCorrectItemType(item);
 * if (correctType) {
 *     console.log(`Item should be type: ${correctType}`);
 * }
 * ```
 */
export function determineCorrectItemType(item) {
    if (!item || !item.system) {
        return null;
    }

    const system = item.system;
    const currentType = item.type;

    // Skip if already correct type
    if (currentType === 'talent' || currentType === 'augment') {
        return null;
    }

    // Check for talent indicators
    if (hasTalentProperties(system)) {
        return 'talent';
    }

    // Check for augment indicators
    if (hasAugmentProperties(system)) {
        return 'augment';
    }

    return null;
}

/**
 * Checks if system data has properties indicating it's a talent.
 * 
 * @param {Object} system - The item's system data
 * @returns {boolean} True if this looks like talent data
 * @private
 */
function hasTalentProperties(system) {
    // Talent-specific properties
    const talentIndicators = [
        'tier',           // Talents have tiers
        'apCost',         // AP cost for talents
        'prerequisites'   // Prerequisites field
    ];

    // Check for multiple talent indicators
    let talentScore = 0;
    for (const prop of talentIndicators) {
        if (system.hasOwnProperty(prop)) {
            talentScore++;
        }
    }

    // Also check for talent-specific values
    if (system.tier && typeof system.tier === 'number' && system.tier >= 1) {
        talentScore++;
    }

    return talentScore >= 2;
}

/**
 * Checks if system data has properties indicating it's an augment.
 * 
 * @param {Object} system - The item's system data
 * @returns {boolean} True if this looks like augment data
 * @private
 */
function hasAugmentProperties(system) {
    // Augment-specific properties
    const augmentIndicators = [
        'augmentType',    // Type of augment (enhancement, cybernetic, etc.)
        'ppCost',         // Power point cost for augments
        'rarity'          // Augments often have rarity
    ];

    // Check for augment-specific values
    if (system.augmentType) {
        const validAugmentTypes = ['enhancement', 'cybernetic', 'biological', 'magical', 'psionic'];
        if (validAugmentTypes.includes(system.augmentType)) {
            return true;
        }
    }

    // Check for multiple augment indicators
    let augmentScore = 0;
    for (const prop of augmentIndicators) {
        if (system.hasOwnProperty(prop)) {
            augmentScore++;
        }
    }

    return augmentScore >= 2;
}

/**
 * Runs item type migration for all actors in the world.
 * 
 * This function performs a world-wide migration, checking all actors
 * and their items for type corrections. Use this for major system
 * upgrades or when fixing widespread data issues.
 * 
 * @returns {Promise<Object>} World migration result with totals
 * 
 * @example
 * ```javascript
 * // Run world-wide migration (admin only)
 * if (game.user.isGM) {
 *     const result = await migrateAllActorItemTypes();
 *     ui.notifications.info(`Migration complete: ${result.totalMigrated} items corrected`);
 * }
 * ```
 */
export async function migrateAllActorItemTypes() {
    if (!game.user.isGM) {
        throw new Error('Only GMs can run world-wide migration');
    }

    let totalChecked = 0;
    let totalMigrated = 0;
    let totalErrors = 0;
    let actorsProcessed = 0;

    console.log('🌍 Starting world-wide item type migration...');

    for (const actor of game.actors) {
        try {
            const result = await migrateItemTypes(actor);
            totalChecked += result.checked;
            totalMigrated += result.migrated;
            totalErrors += result.errors;
            actorsProcessed++;
        } catch (error) {
            console.error(`❌ Failed to migrate actor "${actor.name}":`, error);
            totalErrors++;
        }
    }

    const result = {
        actorsProcessed,
        totalChecked,
        totalMigrated,
        totalErrors
    };

    console.log('✅ World-wide migration complete:', result);
    return result;
} 