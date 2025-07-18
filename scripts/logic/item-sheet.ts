/**
 * @fileoverview Item Sheet Logic - Pure Functions
 * @description Pure functions for item sheet operations without FoundryVTT dependencies
 * @version 2.0.0
 * @author Avant Development Team
 */

/**
 * Roll data interface for dice expressions
 */
export interface RollData {
    /** The dice expression (e.g., "1d20+5") */
    roll: string;
    /** Optional label for the roll */
    label?: string;
}

/**
 * Item data interface for roll context
 */
export interface ItemData {
    /** The name of the item */
    name: string;
}

/**
 * Available roll modes in FoundryVTT
 */
export type RollMode = 'publicroll' | 'blindroll' | 'gmroll' | 'selfroll';

/**
 * Roll message configuration
 */
export interface RollMessage {
    /** Flavor text for the roll */
    flavor: string;
    /** Roll mode to use */
    rollMode: RollMode;
}

/**
 * Roll execution result
 */
export interface RollResult {
    /** The dice expression to roll */
    rollExpression: string;
    /** Message configuration */
    message: RollMessage;
}

/**
 * Form data input type (flat key-value pairs)
 */
export type FormDataInput = Record<string, unknown>;

/**
 * Processed form data output (nested objects)
 */
export type ProcessedFormData = Record<string, unknown>;

/**
 * Validates roll data to ensure it contains necessary information for a roll
 * 
 * This function checks if the roll data has a valid dice expression that can
 * be used to create a dice roll. It doesn't validate the actual dice syntax,
 * just that a non-empty roll expression exists.
 * 
 * @param rollData - The roll data object containing roll information
 * @returns True if roll data is valid, false otherwise
 * 
 * @example
 * ```typescript
 * // Valid roll data
 * const valid = validateRollData({ roll: "1d6+2", label: "Damage" });
 * // Result: true
 * 
 * // Invalid roll data (missing roll)
 * const invalid = validateRollData({ label: "Attack" });
 * // Result: false
 * ```
 */
export function validateRollData(rollData: unknown): rollData is RollData {
    if (!rollData || typeof rollData !== 'object') {
        return false;
    }
    
    const data = rollData as Record<string, unknown>;
    const roll = data.roll;
    return typeof roll === 'string' && roll.trim().length > 0;
}

/**
 * Creates a message object for a dice roll
 * 
 * This function prepares the message configuration that will be used when
 * displaying the roll result. It determines the appropriate flavor text
 * (either from a provided label or the item name) and sets the roll mode.
 * 
 * @param rollData - The roll data object
 * @param itemName - The name of the item being rolled (optional)
 * @param rollMode - The roll mode to use (defaults to 'publicroll')
 * @returns Message configuration object
 * 
 * @example
 * ```typescript
 * // With label
 * const msg1 = createRollMessage({ roll: "1d8", label: "Damage" }, "Sword");
 * // Result: { flavor: "Damage", rollMode: "publicroll" }
 * 
 * // Without label (uses item name)
 * const msg2 = createRollMessage({ roll: "1d6" }, "Dagger");
 * // Result: { flavor: "Dagger", rollMode: "publicroll" }
 * ```
 */
export function createRollMessage(
    rollData: RollData, 
    itemName?: string, 
    rollMode: RollMode = 'publicroll'
): RollMessage {
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
 * @param rollData - The roll data from the UI element
 * @param itemData - The item data object (optional)
 * @param rollMode - The roll mode to use (defaults to 'publicroll')
 * @returns Roll configuration object or null if invalid
 * 
 * @example
 * ```typescript
 * // Valid roll
 * const rollConfig = executeRoll(
 *     { roll: "1d6+2", label: "Damage" },
 *     { name: "Sword" }
 * );
 * // Result: {
 * //   rollExpression: "1d6+2",
 * //   message: { flavor: "Damage", rollMode: "publicroll" }
 * // }
 * ```
 */
export function executeRoll(
    rollData: unknown, 
    itemData?: ItemData, 
    rollMode: RollMode = 'publicroll'
): RollResult | null {
    // Validate the roll data
    if (!validateRollData(rollData)) {
        return null;
    }
    
    // Basic validation of dice expression format
    // Only allow dice notation with basic math operations and parentheses
    const rollExpression = rollData.roll.trim();
    if (!/^[0-9d+\-*/() \s]+$/i.test(rollExpression)) {
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
 * @param formData - Flat form data object from form submission
 * @returns Processed nested object with converted data types
 * 
 * @example
 * ```typescript
 * // Input form data
 * const formData = {
 *     "system.damage": "10",
 *     "system.weight": "5.5",
 *     "name": "Iron Sword"
 * };
 * 
 * // Processed result
 * const result = processFormData(formData);
 * // Result: {
 * //   system: { damage: 10, weight: 5.5 },
 * //   name: "Iron Sword"
 * // }
 * ```
 */
export function processFormData(
    formData: FormDataInput | null | undefined
): ProcessedFormData {
    if (!formData || typeof formData !== 'object') {
        return {};
    }
    
    const result: ProcessedFormData = {};
    
    // Process each form field
    for (const [key, value] of Object.entries(formData)) {
        // Split the key into path segments (e.g., "system.damage" -> ["system", "damage"])
        const segments = key.split('.');
        
        // Navigate/create the nested structure
        let current: Record<string, unknown> = result;
        for (let i = 0; i < segments.length - 1; i++) {
            const segment = segments[i];
            if (!current[segment]) {
                current[segment] = {};
            }
            current = current[segment] as Record<string, unknown>;
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
 * @param value - The value to convert
 * @returns The converted value with appropriate type
 */
function convertValue(value: unknown): unknown {
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