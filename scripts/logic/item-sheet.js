/**
 * @fileoverview Item Sheet Logic - Pure Functions
 * @description Pure functions for item sheet operations without FoundryVTT dependencies
 * @version 2.0.0
 * @author Avant Development Team
 */

/**
 * Validates roll data to ensure it contains necessary information for a roll
 * 
 * This function checks if the roll data has a valid dice expression that can
 * be used to create a dice roll. It doesn't validate the actual dice syntax,
 * just that a non-empty roll expression exists.
 * 
 * @param {Object} rollData - The roll data object containing roll information
 * @param {string} rollData.roll - The dice expression (e.g., "1d20+5")
 * @param {string} [rollData.label] - Optional label for the roll
 * @returns {boolean} True if roll data is valid, false otherwise
 * 
 * @example
 * // Valid roll data
 * const valid = validateRollData({ roll: "1d6+2", label: "Damage" });
 * // Result: true
 * 
 * // Invalid roll data (missing roll)
 * const invalid = validateRollData({ label: "Attack" });
 * // Result: false
 */
export function validateRollData(rollData) {
    if (!rollData || typeof rollData !== 'object') {
        return false;
    }
    
    const roll = rollData.roll;
    return typeof roll === 'string' && roll.trim().length > 0;
}

/**
 * Creates a message object for a dice roll
 * 
 * This function prepares the message configuration that will be used when
 * displaying the roll result. It determines the appropriate flavor text
 * (either from a provided label or the item name) and sets the roll mode.
 * 
 * @param {Object} rollData - The roll data object
 * @param {string} rollData.roll - The dice expression
 * @param {string} [rollData.label] - Optional label for the roll
 * @param {string} itemName - The name of the item being rolled
 * @param {string} [rollMode='publicroll'] - The roll mode to use
 * @returns {Object} Message configuration object
 * 
 * @example
 * // With label
 * const msg1 = createRollMessage({ roll: "1d8", label: "Damage" }, "Sword");
 * // Result: { flavor: "Damage", rollMode: "publicroll" }
 * 
 * // Without label (uses item name)
 * const msg2 = createRollMessage({ roll: "1d6" }, "Dagger");
 * // Result: { flavor: "Dagger", rollMode: "publicroll" }
 */
export function createRollMessage(rollData, itemName, rollMode = 'publicroll') {
    const flavor = rollData.label || itemName || '';
    
    return {
        flavor: flavor,
        rollMode: rollMode
    };
}

/**
 * Executes a dice roll operation without FoundryVTT dependencies
 * 
 * This function processes roll data and returns information needed to perform
 * a dice roll. It validates the input and prepares the roll configuration
 * but doesn't actually execute the roll (that's handled by the sheet wrapper).
 * 
 * @param {Object} rollData - The roll data from the UI element
 * @param {string} rollData.roll - The dice expression to roll
 * @param {string} [rollData.label] - Optional label for the roll
 * @param {Object} itemData - The item data object
 * @param {string} itemData.name - The name of the item
 * @param {string} [rollMode='publicroll'] - The roll mode to use
 * @returns {Object|null} Roll configuration object or null if invalid
 * 
 * @example
 * // Valid roll
 * const rollConfig = executeRoll(
 *     { roll: "1d6+2", label: "Damage" },
 *     { name: "Sword" }
 * );
 * // Result: {
 * //   rollExpression: "1d6+2",
 * //   message: { flavor: "Damage", rollMode: "publicroll" }
 * // }
 */
export function executeRoll(rollData, itemData, rollMode = 'publicroll') {
    // Validate the roll data
    if (!validateRollData(rollData)) {
        return null;
    }
    
    // Basic validation of dice expression format
    const rollExpression = rollData.roll.trim();
    if (!/^[0-9d+\-*\/\(\)\s]+$/i.test(rollExpression)) {
        return null;
    }
    
    // Create the message configuration
    const message = createRollMessage(rollData, itemData?.name, rollMode);
    
    return {
        rollExpression: rollExpression,
        message: message
    };
}

/**
 * Processes form data from item sheet submissions
 * 
 * This function takes flat form data (like "system.damage": "10") and converts
 * it into nested objects with proper data type conversion. It handles numeric
 * conversion for appropriate fields and maintains the proper structure.
 * 
 * @param {Object} formData - Flat form data object from form submission
 * @param {string} itemType - The type of item being processed
 * @returns {Object} Processed nested object with converted data types
 * 
 * @example
 * // Input form data
 * const formData = {
 *     "system.damage": "10",
 *     "system.weight": "5.5",
 *     "name": "Iron Sword"
 * };
 * 
 * // Processed result
 * const result = processFormData(formData, "weapon");
 * // Result: {
 * //   system: { damage: 10, weight: 5.5 },
 * //   name: "Iron Sword"
 * // }
 */
export function processFormData(formData, itemType) {
    if (!formData || typeof formData !== 'object') {
        return {};
    }
    
    const result = {};
    
    // Process each form field
    for (const [key, value] of Object.entries(formData)) {
        // Split the key into path segments (e.g., "system.damage" -> ["system", "damage"])
        const segments = key.split('.');
        
        // Navigate/create the nested structure
        let current = result;
        for (let i = 0; i < segments.length - 1; i++) {
            const segment = segments[i];
            if (!current[segment]) {
                current[segment] = {};
            }
            current = current[segment];
        }
        
        // Set the final value with appropriate type conversion
        const finalKey = segments[segments.length - 1];
        current[finalKey] = convertValue(value);
    }
    
    return result;
}

/**
 * Converts string values to appropriate types
 * 
 * This helper function determines the appropriate data type for a form value
 * and converts it accordingly. It handles numbers, booleans, and preserves
 * strings when appropriate.
 * 
 * @param {string} value - The string value to convert
 * @returns {number|boolean|string} The converted value
 * @private
 */
function convertValue(value) {
    if (typeof value !== 'string') {
        return value;
    }
    
    // Handle boolean values
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Handle numeric values
    if (/^-?\d+\.?\d*$/.test(value)) {
        const num = Number(value);
        if (!isNaN(num)) {
            return num;
        }
    }
    
    // Return as string if no conversion applies
    return value;
} 