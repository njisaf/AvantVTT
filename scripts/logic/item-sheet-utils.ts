/**
 * @fileoverview Item Sheet Utils - Pure Functions
 * @description Additional pure functions for item sheet operations without FoundryVTT dependencies
 * @version 2.0.0
 * @author Avant Development Team
 */

import type { ItemType, ItemData } from '../types/domain/item';

/**
 * Template data for item sheet rendering.
 * Contains all data needed to render an item sheet in the UI.
 */
export interface ItemTemplateData {
  /** The item data object */
  item: unknown;
  /** The system data for the item */
  system: Record<string, unknown>;
  /** The flags data for the item */
  flags: Record<string, unknown>;
  /** CSS classes for the sheet */
  cssClass: string;
  /** Whether this is a weapon item */
  isWeapon: boolean;
  /** Whether this is an armor item */
  isArmor: boolean;
  /** Whether this is a feature item */
  isFeature: boolean;
  /** Whether this is an action item */
  isAction: boolean;
}

/**
 * Display information for an item.
 * Contains formatted text and type-specific information for UI display.
 */
export interface ItemDisplayInfo {
  /** The item name */
  name: string;
  /** The item type */
  type: string;
  /** Formatted display text with details */
  displayText: string;
  /** Damage information for weapons */
  damageInfo?: string;
  /** Ability information */
  abilityInfo?: string;
  /** Armor class information for armor */
  acInfo?: string;
  /** Category information for features */
  categoryInfo?: string;
}

/**
 * Configuration for item sheet initialization.
 * Defines appearance and behavior settings for different item types.
 */
export interface ItemSheetConfig {
  /** CSS classes to apply to the sheet */
  classes: string[];
  /** Template path for the sheet */
  template: string;
  /** Sheet width in pixels */
  width: number;
  /** Sheet height in pixels */
  height: number;
  /** Tab configuration */
  tabs: Array<{
    navSelector: string;
    contentSelector: string;
    initial: string;
  }>;
  /** Title for the sheet window */
  title: string;
  /** The item type */
  itemType: string;
}

/**
 * Prepares template data for item sheet rendering
 * 
 * This function takes an item object and prepares all the data needed for
 * template rendering, including type-specific flags and CSS classes.
 * It determines what type of item this is and sets appropriate display flags.
 * 
 * @param item - The item data object
 * @returns Template data object or null if invalid item
 * 
 * @example
 * ```typescript
 * // Weapon item
 * const templateData = prepareTemplateData({
 *     name: 'Iron Sword',
 *     type: 'weapon',
 *     system: { damage: '1d8' }
 * });
 * // Result: { item: {...}, isWeapon: true, cssClass: 'item-sheet weapon-sheet', ... }
 * ```
 */
export function prepareTemplateData(item: unknown): ItemTemplateData | null {
    if (!item || typeof item !== 'object' || item === null) {
        return null;
    }
    
    const itemObj = item as any;
    const system = itemObj.system || {};
    const flags = itemObj.flags || {};
    const itemType = itemObj.type || 'unknown';
    
    return {
        item: item,
        system: system,
        flags: flags,
        cssClass: `item-sheet ${itemType}-sheet`,
        isWeapon: itemType === 'weapon',
        isArmor: itemType === 'armor',
        isFeature: itemType === 'feature',
        isAction: itemType === 'action'
    };
}

/**
 * Validates if an item type is supported by the system
 * 
 * This function checks if the provided item type is one of the known
 * item types supported by the Avant system. Used for validation
 * before processing item operations.
 * 
 * @param itemType - The item type to validate
 * @returns True if the item type is valid, false otherwise
 * 
 * @example
 * ```typescript
 * // Valid types
 * const isValid = validateItemType('weapon'); // true
 * const isAlsoValid = validateItemType('armor'); // true
 * 
 * // Invalid types
 * const isInvalid = validateItemType('unknown'); // false
 * const isNull = validateItemType(null); // false
 * ```
 */
export function validateItemType(itemType: unknown): boolean {
    if (typeof itemType !== 'string') {
        return false;
    }
    
    const validTypes = ['weapon', 'armor', 'feature', 'action', 'talent', 'augment'];
    return validTypes.includes(itemType);
}

/**
 * Calculates the total weight of an item including quantity
 * 
 * This function takes an item and calculates its total weight by
 * multiplying the base weight by the quantity. Handles missing
 * values gracefully with sensible defaults.
 * 
 * @param item - The item data object
 * @returns The total weight (weight * quantity)
 * 
 * @example
 * ```typescript
 * // Single item
 * const weight1 = calculateItemWeight({
 *     system: { weight: 2.5, quantity: 1 }
 * }); // 2.5
 * 
 * // Multiple items
 * const weight2 = calculateItemWeight({
 *     system: { weight: 1.5, quantity: 3 }
 * }); // 4.5
 * ```
 */
export function calculateItemWeight(item: unknown): number {
    if (!item || typeof item !== 'object' || item === null) {
        return 0;
    }
    
    const itemObj = item as any;
    if (!itemObj.system) {
        return 0;
    }
    
    const weight = Number(itemObj.system.weight) || 0;
    const quantity = Number(itemObj.system.quantity) || 1;
    
    return weight * quantity;
}

/**
 * Formats item information for display purposes
 * 
 * This function takes an item and creates formatted display information
 * including appropriate details based on the item type. Used for creating
 * consistent item display text across the interface.
 * 
 * @param item - The item data object
 * @returns Formatted display information
 * 
 * @example
 * ```typescript
 * // Weapon formatting
 * const display = formatItemDisplay({
 *     name: 'Iron Sword',
 *     type: 'weapon',
 *     system: { damage: '1d8', damageType: 'slashing', ability: 'might' }
 * });
 * // Result: { displayText: 'Iron Sword (1d8 slashing, might)', ... }
 * ```
 */
export function formatItemDisplay(item: unknown): ItemDisplayInfo {
    if (!item || typeof item !== 'object' || item === null) {
        return { name: '', type: '', displayText: '' };
    }
    
    const itemObj = item as any;
    const name = itemObj.name || 'Unnamed Item';
    const type = itemObj.type || 'unknown';
    const system = itemObj.system || {};
    
    const result: ItemDisplayInfo = {
        name: name,
        type: type,
        displayText: name
    };
    
    // Type-specific formatting
    if (type === 'weapon') {
        const damage = system.damage || '';
        const damageType = system.damageType || '';
        const ability = system.ability || '';
        
        const parts: string[] = [];
        if (damage && damageType) {
            result.damageInfo = `${damage} ${damageType}`;
            parts.push(result.damageInfo);
        } else if (damage) {
            result.damageInfo = damage;
            parts.push(damage);
        }
        
        if (ability) {
            result.abilityInfo = ability;
            parts.push(ability);
        }
        
        if (parts.length > 0) {
            result.displayText = `${name} (${parts.join(', ')})`;
        }
    } else if (type === 'armor') {
        const ac = system.ac;
        const ability = system.ability || '';
        
        const parts: string[] = [];
        if (ac !== undefined && ac !== null) {
            result.acInfo = `AC +${ac}`;
            parts.push(result.acInfo);
        }
        
        if (ability) {
            result.abilityInfo = ability;
            parts.push(ability);
        }
        
        if (parts.length > 0) {
            result.displayText = `${name} (${parts.join(', ')})`;
        }
    } else if (type === 'feature') {
        const category = system.category;
        
        if (category) {
            result.categoryInfo = category;
            result.displayText = `${name} (${category})`;
        }
    }
    
    return result;
}

/**
 * Extracts and processes form data from item sheet submissions
 * 
 * This function takes flat form data (like "system.damage": "10") and converts
 * it into nested objects with proper data type conversion. It handles array fields
 * (those ending with []) by building arrays from multiple values.
 * 
 * @param formData - Flat form data object from form submission
 * @returns Processed nested object with converted data types
 * 
 * @example
 * ```typescript
 * // Input form data with array field
 * const formData = {
 *     'name': 'Iron Sword',
 *     'system.traits[]': ['fire', 'sharp'],  // Array field
 *     'system.weight': '3.5',
 *     'system.equipped': 'true'
 * };
 * 
 * // Processed result
 * const result = extractItemFormData(formData);
 * // Result: {
 * //   name: 'Iron Sword',
 * //   system: { traits: ['fire', 'sharp'], weight: 3.5, equipped: true }
 * // }
 * ```
 */
export function extractItemFormData(formData: unknown): Record<string, unknown> {
    if (!formData || typeof formData !== 'object' || formData === null) {
        return {};
    }
    
    const formObj = formData as Record<string, unknown>;
    const result: Record<string, any> = {};
    const arrayFields = new Map<string, unknown[]>(); // Track array fields separately
    
    // First pass: collect all values, identifying array fields
    for (const [key, value] of Object.entries(formObj)) {
        // Check if this is an array field (ends with [])
        const isArrayField = key.endsWith('[]');
        const cleanKey = isArrayField ? key.slice(0, -2) : key; // Remove [] suffix
        
        if (isArrayField) {
            // Handle array field
            if (!arrayFields.has(cleanKey)) {
                arrayFields.set(cleanKey, []);
            }
            // Support both single values and arrays from FormData
            if (Array.isArray(value)) {
                arrayFields.get(cleanKey)!.push(...value);
            } else {
                arrayFields.get(cleanKey)!.push(value);
            }
        } else {
            // Handle regular field - split key into path segments
            const segments = cleanKey.split('.');
            
            // Navigate/create the nested structure
            let current = result;
            for (let i = 0; i < segments.length - 1; i++) {
                const segment = segments[i];
                if (!current[segment]) {
                    current[segment] = {};
                }
                current = current[segment];
            }
            
            // Set the final value with type conversion
            const finalKey = segments[segments.length - 1];
            current[finalKey] = convertFormValue(value);
        }
    }
    
    // Second pass: process array fields
    for (const [key, values] of arrayFields) {
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
        
        // Set the array value with type conversion for each element
        const finalKey = segments[segments.length - 1];
        current[finalKey] = values.map(value => convertFormValue(value));
    }
    
    return result;
}

/**
 * Creates sheet configuration for different item types
 * 
 * This function generates the configuration object used for item sheet
 * initialization, including CSS classes, templates, dimensions, and
 * other sheet-specific settings based on the item type.
 * 
 * @param item - The item data object
 * @returns Sheet configuration object or null if invalid item
 * 
 * @example
 * ```typescript
 * // Weapon sheet config
 * const config = createItemSheetConfig({
 *     type: 'weapon',
 *     name: 'Iron Sword'
 * });
 * // Result: {
 * //   classes: ['avant', 'sheet', 'item', 'weapon'],
 * //   template: 'systems/avant/templates/item/item-weapon-new.html',
 * //   ...
 * // }
 * ```
 */
export function createItemSheetConfig(item: unknown): ItemSheetConfig | null {
    if (!item || typeof item !== 'object' || item === null) {
        return null;
    }
    
    const itemObj = item as any;
    const itemType = itemObj.type || 'unknown';
    const itemName = itemObj.name || 'Unnamed Item';
    
    const baseClasses = ['avant', 'sheet', 'item'];
    const classes = [...baseClasses, itemType];
    
    // Determine template based on type
    let template: string;
    if (validateItemType(itemType)) {
        template = `systems/avant/templates/item/item-${itemType}-new.html`;
    } else {
        template = 'systems/avant/templates/item/item-sheet.html';
    }
    
    return {
        classes: classes,
        template: template,
        width: 520,
        height: 480,
        tabs: [{
            navSelector: '.sheet-tabs',
            contentSelector: '.sheet-body',
            initial: 'description'
        }],
        title: itemName,
        itemType: itemType
    };
}

/**
 * Converts form values to appropriate types
 * 
 * This helper function determines the appropriate data type for a form value
 * and converts it accordingly. Enhanced version with better type detection.
 * 
 * @param value - The string value to convert
 * @returns The converted value
 */
function convertFormValue(value: unknown): number | boolean | string {
    if (typeof value !== 'string') {
        return value as any;
    }
    
    // Handle boolean values
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Handle numeric values (including decimals)
    if (/^-?\d+\.?\d*$/.test(value)) {
        const num = Number(value);
        if (!isNaN(num)) {
            return num;
        }
    }
    
    // Return as string if no conversion applies
    return value;
} 