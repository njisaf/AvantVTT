/**
 * @fileoverview Actor Sheet Utils - Pure Functions
 * @description Additional pure functions for actor sheet operations without FoundryVTT dependencies
 * @version 2.0.0
 * @author Avant Development Team
 */

/**
 * Prepares item data for creation with proper defaults
 * 
 * This function takes an item type and dataset and creates a properly
 * structured item data object with appropriate defaults based on the type.
 * It removes the 'type' field from system data to avoid conflicts.
 * 
 * @param {string} itemType - The type of item to create
 * @param {Object} dataset - The dataset from the UI element
 * @returns {Object} Complete item data object ready for creation
 * 
 * @example
 * // Creating a basic weapon
 * const itemData = prepareItemData('weapon', { damage: '1d8' });
 * // Result: { name: 'New Weapon', type: 'weapon', system: { damage: '1d8' } }
 */
export function prepareItemData(itemType, dataset) {
    if (!itemType || typeof itemType !== 'string') {
        return null;
    }
    
    const data = dataset ? { ...dataset } : {};
    const name = `New ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
    
    const itemData = {
        name: name,
        type: itemType,
        system: { ...data }
    };
    
    // Remove type from system data to avoid conflicts
    delete itemData.system.type;
    
    // Apply type-specific defaults
    if (itemType === "feature" && data.category) {
        itemData.system.category = data.category;
    }
    
    if (itemType === "action" && !itemData.system.ability) {
        itemData.system.ability = "might";
    }
    
    if (itemType === "augment" && !itemData.system.augmentType) {
        itemData.system.augmentType = "enhancement";
    }
    
    return itemData;
}

/**
 * Validates power point usage against current points
 * 
 * This function checks if a character has enough power points to spend
 * the requested amount and returns validation results including remaining
 * points and appropriate error messages.
 * 
 * @param {number} currentPoints - Current power points available
 * @param {number} costPoints - Power points needed for the action
 * @returns {Object} Validation result with status and details
 * 
 * @example
 * // Sufficient points
 * const result = validatePowerPointUsage(5, 2);
 * // Result: { valid: true, remaining: 3, cost: 2 }
 * 
 * // Insufficient points
 * const result = validatePowerPointUsage(1, 3);
 * // Result: { valid: false, remaining: 1, cost: 3, error: "Not enough..." }
 */
export function validatePowerPointUsage(currentPoints, costPoints) {
    const current = Number(currentPoints);
    const cost = Number(costPoints);
    
    // Validate inputs
    if (isNaN(current) || isNaN(cost) || current < 0 || cost < 0) {
        return {
            valid: false,
            remaining: current || 0,
            cost: cost || 0,
            error: 'Invalid power point values provided'
        };
    }
    
    if (current < cost) {
        return {
            valid: false,
            remaining: current,
            cost: cost,
            error: `Not enough Power Points! Need ${cost}, have ${current}`
        };
    }
    
    return {
        valid: true,
        remaining: current - cost,
        cost: cost
    };
}

/**
 * Prepares weapon attack roll data
 * 
 * This function extracts weapon and actor data to create the roll expression
 * and roll data needed for a weapon attack. Uses the weapon's ability and
 * modifier along with the character's level and relevant ability modifier.
 * 
 * @param {Object} weapon - The weapon item data
 * @param {Object} actor - The actor data
 * @returns {Object} Roll configuration with expression, data, and flavor
 * 
 * @example
 * // Weapon attack preparation
 * const rollConfig = prepareWeaponAttackRoll(weapon, actor);
 * // Result: {
 * //   rollExpression: "2d10 + @level + @abilityMod + @weaponMod",
 * //   rollData: { level: 3, abilityMod: 2, weaponMod: 1 },
 * //   flavor: "Iron Sword Attack"
 * // }
 */
export function prepareWeaponAttackRoll(weapon, actor) {
    if (!weapon || !actor) {
        return null;
    }
    
    const weaponAbility = weapon.system?.ability || 'might';
    const abilityMod = actor.system?.abilities?.[weaponAbility]?.mod || 0;
    const weaponModifier = weapon.system?.modifier || 0;
    const level = actor.system?.level || 1;
    
    return {
        rollExpression: '2d10 + @level + @abilityMod + @weaponMod',
        rollData: {
            level: level,
            abilityMod: abilityMod,
            weaponMod: weaponModifier
        },
        flavor: `${weapon.name} Attack`
    };
}

/**
 * Prepares weapon damage roll data
 * 
 * This function creates the roll configuration for weapon damage using
 * the weapon's damage die and the character's relevant ability modifier.
 * Includes damage type in the flavor text if available.
 * 
 * @param {Object} weapon - The weapon item data
 * @param {Object} actor - The actor data
 * @returns {Object} Roll configuration with expression, data, and flavor
 * 
 * @example
 * // Weapon damage preparation
 * const rollConfig = prepareWeaponDamageRoll(weapon, actor);
 * // Result: {
 * //   rollExpression: "1d8 + @abilityMod",
 * //   rollData: { abilityMod: 2 },
 * //   flavor: "Iron Sword Damage (slashing)"
 * // }
 */
export function prepareWeaponDamageRoll(weapon, actor) {
    if (!weapon || !actor) {
        return null;
    }
    
    const damageRoll = weapon.system?.damageDie || "1d6";
    const weaponAbility = weapon.system?.ability || 'might';
    const abilityMod = actor.system?.abilities?.[weaponAbility]?.mod || 0;
    const damageType = weapon.system?.damageType || "";
    
    const flavorText = damageType ? 
        `${weapon.name} Damage (${damageType})` : 
        `${weapon.name} Damage`;
    
    return {
        rollExpression: `${damageRoll} + @abilityMod`,
        rollData: { abilityMod: abilityMod },
        flavor: flavorText
    };
}

/**
 * Prepares armor roll data
 * 
 * This function creates the roll configuration for armor checks using
 * the armor's ability (usually grace) and modifier along with the
 * character's level and relevant ability modifier.
 * 
 * @param {Object} armor - The armor item data
 * @param {Object} actor - The actor data
 * @returns {Object} Roll configuration with expression, data, and flavor
 * 
 * @example
 * // Armor roll preparation
 * const rollConfig = prepareArmorRoll(armor, actor);
 * // Result: {
 * //   rollExpression: "2d10 + @level + @abilityMod + @armorMod",
 * //   rollData: { level: 2, abilityMod: 3, armorMod: 1 },
 * //   flavor: "Leather Armor Armor Check"
 * // }
 */
export function prepareArmorRoll(armor, actor) {
    if (!armor || !actor) {
        return null;
    }
    
    const armorAbility = armor.system?.ability || 'grace';
    const abilityMod = actor.system?.abilities?.[armorAbility]?.mod || 0;
    const armorModifier = armor.system?.modifier || 0;
    const level = actor.system?.level || 1;
    
    return {
        rollExpression: '2d10 + @level + @abilityMod + @armorMod',
        rollData: {
            level: level,
            abilityMod: abilityMod,
            armorMod: armorModifier
        },
        flavor: `${armor.name} Armor Check`
    };
}

/**
 * Prepares generic roll data from dataset
 * 
 * This function extracts roll information from a UI element's dataset
 * and prepares it for execution. Returns null if no valid roll is found.
 * 
 * @param {Object} dataset - The dataset from the UI element
 * @param {string} dataset.roll - The roll expression
 * @param {string} [dataset.label] - Optional label for the roll
 * @returns {Object|null} Roll configuration or null if invalid
 * 
 * @example
 * // Generic roll preparation
 * const rollConfig = prepareGenericRoll({ roll: "1d20+5", label: "Save" });
 * // Result: { rollExpression: "1d20+5", flavor: "Save" }
 */
export function prepareGenericRoll(dataset) {
    if (!dataset || !dataset.roll) {
        return null;
    }
    
    const rollExpression = dataset.roll.trim();
    if (!rollExpression) {
        return null;
    }
    
    const flavor = dataset.label || '';
    
    return {
        rollExpression: rollExpression,
        flavor: flavor
    };
}

/**
 * Extracts item ID from DOM element
 * 
 * This function safely extracts the item ID from a DOM element by finding
 * the closest .item parent and reading its dataset. Returns null if no
 * valid item ID is found.
 * 
 * @param {Element} element - The DOM element to search from
 * @returns {string|null} The item ID or null if not found
 * 
 * @example
 * // Extract item ID from button element
 * const itemId = extractItemIdFromElement(button);
 * // Result: "item-abc123" or null
 */
export function extractItemIdFromElement(element) {
    if (!element || typeof element.closest !== 'function') {
        return null;
    }
    
    const itemElement = element.closest('.item');
    if (!itemElement || !itemElement.dataset) {
        return null;
    }
    
    return itemElement.dataset.itemId || null;
}

/**
 * Formats flavor text for rolls with proper capitalization
 * 
 * This function creates properly formatted flavor text for rolls by
 * capitalizing the first letter of names and optionally including
 * governing ability information for skills.
 * 
 * @param {string} name - The base name (ability, skill, etc.)
 * @param {string} [action=''] - The action being performed
 * @param {string} [governingAbility] - Optional governing ability for skills
 * @returns {string} Formatted flavor text
 * 
 * @example
 * // Simple ability check
 * const flavor = formatFlavorText('might', 'Check');
 * // Result: "Might Check"
 * 
 * // Skill check with governing ability
 * const flavor = formatFlavorText('athletics', 'Check', 'might');
 * // Result: "Athletics Check (Might)"
 */
export function formatFlavorText(name, action = '', governingAbility = '') {
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    
    if (!action) {
        return capitalizedName;
    }
    
    if (governingAbility) {
        const capitalizedAbility = governingAbility.charAt(0).toUpperCase() + governingAbility.slice(1);
        return `${capitalizedName} ${action} (${capitalizedAbility})`;
    }
    
    return `${capitalizedName} ${action}`;
} 