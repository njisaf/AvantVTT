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
    
    if (itemType === "action" && !itemData.system.attribute) {
        itemData.system.attribute = "might";
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
 * Prepares weapon attack roll data using the Role Utility Framework
 * 
 * This function creates a complete roll payload for weapon attacks using
 * the unified Role Utility Framework. Returns a RollPayload object ready
 * for execution and display.
 * 
 * @param {Object} weapon - The weapon item data
 * @param {Object} actor - The actor data
 * @returns {Object} RollPayload from the Role Utility Framework
 * 
 * @example
 * // Weapon attack preparation
 * const rollPayload = prepareWeaponAttackRoll(weapon, actor);
 * // Result: RollPayload with formula, tooltip, sendToChat, etc.
 * await rollPayload.sendToChat();
 */
export async function prepareWeaponAttackRoll(weapon, actor) {
    if (!weapon || !actor) {
        return null;
    }
    
    try {
        // Use the new role utility framework
        const { buildWeaponAttackRoll } = await import('./rolls-utils.js');
        return buildWeaponAttackRoll(weapon, actor);
    } catch (error) {
        console.error('Error creating weapon attack roll:', error);
        return null;
    }
}

/**
 * Prepares weapon damage roll data using the Role Utility Framework
 * 
 * This function creates a complete roll payload for weapon damage using
 * the unified Role Utility Framework. Returns a RollPayload object ready
 * for execution and display.
 * 
 * @param {Object} weapon - The weapon item data
 * @param {Object} actor - The actor data
 * @returns {Object} RollPayload from the Role Utility Framework
 * 
 * @example
 * // Weapon damage preparation
 * const rollPayload = prepareWeaponDamageRoll(weapon, actor);
 * // Result: RollPayload with formula, tooltip, sendToChat, etc.
 * await rollPayload.sendToChat();
 */
export async function prepareWeaponDamageRoll(weapon, actor) {
    if (!weapon || !actor) {
        return null;
    }
    
    try {
        // Use the new role utility framework
        const { buildWeaponDamageRoll } = await import('./rolls-utils.js');
        return buildWeaponDamageRoll(weapon, actor);
    } catch (error) {
        console.error('Error creating weapon damage roll:', error);
        return null;
    }
}

/**
 * Prepares armor roll data using the Role Utility Framework
 * 
 * This function creates a complete roll payload for armor checks using
 * the unified Role Utility Framework. Returns a RollPayload object ready
 * for execution and display.
 * 
 * @param {Object} armor - The armor item data
 * @param {Object} actor - The actor data
 * @returns {Object} RollPayload from the Role Utility Framework
 * 
 * @example
 * // Armor roll preparation
 * const rollPayload = prepareArmorRoll(armor, actor);
 * // Result: RollPayload with formula, tooltip, sendToChat, etc.
 * await rollPayload.sendToChat();
 */
export async function prepareArmorRoll(armor, actor) {
    if (!armor || !actor) {
        return null;
    }
    
    try {
        // Use the new role utility framework
        const { buildArmorRoll } = await import('./rolls-utils.js');
        return buildArmorRoll(armor, actor);
    } catch (error) {
        console.error('Error creating armor roll:', error);
        return null;
    }
}

/**
 * Prepares generic roll data from dataset using the Role Utility Framework
 * 
 * This function creates a complete roll payload for generic rolls using
 * the unified Role Utility Framework. Returns a RollPayload object ready
 * for execution and display.
 * 
 * @param {Object} dataset - The dataset from the UI element
 * @param {string} dataset.roll - The roll expression
 * @param {string} [dataset.label] - Optional label for the roll
 * @returns {Object|null} RollPayload from the Role Utility Framework or null if invalid
 * 
 * @example
 * // Generic roll preparation
 * const rollPayload = prepareGenericRoll({ roll: "1d20+5", label: "Save" });
 * // Result: RollPayload with formula, tooltip, sendToChat, etc.
 * await rollPayload.sendToChat();
 */
export async function prepareGenericRoll(dataset) {
    if (!dataset || !dataset.roll) {
        return null;
    }
    
    try {
        // Use the new role utility framework
        const { buildGenericRoll } = await import('./rolls-utils.js');
        return buildGenericRoll(dataset);
    } catch (error) {
        console.error('Error creating generic roll:', error);
        return null;
    }
}

/**
 * Extracts item ID from DOM element looking for both .item parent and direct data-item-id
 * 
 * This function safely extracts the item ID from a DOM element by first checking
 * for a direct data-item-id attribute, then falling back to finding the closest 
 * .item or .combat-item parent. This handles both gear tab (.item) and combat 
 * tab (.combat-item) scenarios.
 * 
 * @param {Element} element - The DOM element to search from
 * @returns {string|null} The item ID or null if not found
 * 
 * @example
 * // Extract item ID from button element with direct data-item-id
 * const itemId = extractItemIdFromElement(button);
 * // Result: "item-abc123" or null
 */
export function extractItemIdFromElement(element) {
    if (!element || typeof element.closest !== 'function') {
        return null;
    }
    
    // First try: Check if the element itself has data-item-id (for combat buttons)
    if (element.dataset && element.dataset.itemId) {
        return element.dataset.itemId;
    }
    
    // Second try: Look for closest .item parent (for gear tab)
    const itemElement = element.closest('.item');
    if (itemElement && itemElement.dataset && itemElement.dataset.itemId) {
        return itemElement.dataset.itemId;
    }
    
    // Third try: Look for closest .combat-item parent (for combat tab)
    const combatItemElement = element.closest('.combat-item');
    if (combatItemElement && combatItemElement.dataset && combatItemElement.dataset.itemId) {
        return combatItemElement.dataset.itemId;
    }
    
    return null;
}

/**
 * Extracts item ID from combat button elements specifically
 * 
 * This function is optimized for combat tab buttons that have direct data-item-id
 * attributes and doesn't need to search for parent elements. Used as a more 
 * efficient alternative for combat-specific event handlers.
 * 
 * @param {Element} element - The DOM element (typically a button) to extract item ID from
 * @returns {string|null} The item ID or null if not found
 * 
 * @example
 * // Extract item ID from combat button
 * const itemId = extractCombatItemId(button);
 * // Result: "item-abc123" or null
 */
export function extractCombatItemId(element) {
    if (!element) {
        return null;
    }
    
    // Combat buttons have data-item-id directly on them
    if (element.dataset && element.dataset.itemId) {
        return element.dataset.itemId;
    }
    
    // Fallback: try getAttribute for maximum compatibility
    if (element.getAttribute && typeof element.getAttribute === 'function') {
        return element.getAttribute('data-item-id');
    }
    
    return null;
}

/**
 * Formats flavor text for rolls with proper capitalization
 * 
 * This function creates properly formatted flavor text for rolls by
 * capitalizing the first letter of names and optionally including
 * governing attribute information for skills.
 * 
 * @param {string} name - The base name (attribute, skill, etc.)
 * @param {string} [action=''] - The action being performed
 * @param {string} [governingAbility] - Optional governing attribute for skills
 * @returns {string} Formatted flavor text
 * 
 * @example
 * // Simple attribute check
 * const flavor = formatFlavorText('might', 'Check');
 * // Result: "Might Check"
 * 
 * // Skill check with governing attribute
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