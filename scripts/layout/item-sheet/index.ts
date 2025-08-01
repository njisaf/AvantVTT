/**
 * @fileoverview Item Sheet Layout Builder
 * @description Registry and builder for item sheet form layouts
 * @version 1.0.0
 * @author Avant Development Team
 */

import type { Field } from '../shared/types';
import type { LayoutItemData, WeaponSystemData, ArmorSystemData, GearSystemData } from '../shared/types';

// Import all item type layout modules
import * as talent from './item-types/talent';
import * as weapon from './item-types/weapon';
import * as armor from './item-types/armor';
import * as gear from './item-types/gear';
import * as augment from './item-types/augment';
import * as feature from './item-types/feature';
import * as trait from './item-types/trait';
import * as action from './item-types/action';

/**
 * Item sheet layout module interface - each item type must implement this
 */
export interface ItemSheetLayoutModule {
    header: (item: LayoutItemData) => Field[];
    body: (item: LayoutItemData) => Field[];
}

/**
 * Registry of all item type layout modules for item sheets
 */
const registry: Record<string, ItemSheetLayoutModule> = {
    talent,
    weapon,
    armor,
    gear,
    augment,
    feature,
    trait,
    action
};

/**
 * Get header layout for an item sheet
 * 
 * @param item - The item data
 * @returns Array of fields for the header
 * 
 * @example
 * ```typescript
 * const headerFields = getHeaderLayout(weaponItem);
 * // Returns: [{ type: 'text', name: 'system.damage', ... }]
 * ```
 */
export function getHeaderLayout(item: LayoutItemData): Field[] {
    if (!item || !item.type) {
        console.warn('Invalid item data provided to getHeaderLayout');
        return [];
    }

    const module = registry[item.type];
    if (!module) {
        console.warn(`No layout module found for item type: ${item.type}`);
        return [];
    }

    try {
        return module.header(item);
    } catch (error) {
        console.error(`Error generating header layout for ${item.type}:`, error);
        return [];
    }
}

/**
 * Get body layout for an item sheet
 * 
 * @param item - The item data
 * @returns Array of fields for the body
 * 
 * @example
 * ```typescript
 * const bodyFields = getBodyLayout(weaponItem);
 * // Returns: [{ type: 'text', name: 'system.damage', ... }, ...]
 * ```
 */
export function getBodyLayout(item: LayoutItemData): Field[] {
    if (!item || !item.type) {
        console.warn('Invalid item data provided to getBodyLayout');
        return [];
    }

    const module = registry[item.type];
    if (!module) {
        console.warn(`No layout module found for item type: ${item.type}`);
        return [];
    }

    try {
        console.log('GetBodyLayout | Item data received:', JSON.parse(JSON.stringify(item)));

        if (item.type === 'weapon' || item.type === 'armor' || item.type === 'gear') {
            const system = item.system as WeaponSystemData | ArmorSystemData | GearSystemData;
            if (typeof system.expertise === 'undefined') {
                const itemCopyWithDefault = {
                    ...item,
                    system: {
                        ...item.system,
                        expertise: 0
                    }
                };
                return module.body(itemCopyWithDefault);
            }
        }
        
        return module.body(item);
    } catch (error) {
        console.error(`Error generating body layout for ${item.type}:`, error);
        return [];
    }
}

/**
 * Get all supported item types
 * 
 * @returns Array of supported item type names
 */
export function getSupportedItemTypes(): string[] {
    return Object.keys(registry);
}

/**
 * Check if an item type is supported by the layout system
 * 
 * @param itemType - The item type to check
 * @returns True if supported, false otherwise
 */
export function isItemTypeSupported(itemType: string): boolean {
    return itemType in registry;
}

/**
 * Register a new item type layout module
 * This allows for dynamic registration of new item types
 * 
 * @param itemType - The item type name
 * @param module - The layout module
 * 
 * @example
 * ```typescript
 * registerItemType('vehicle', {
 *     header: (item) => [...],
 *     body: (item) => [...]
 * });
 * ```
 */
export function registerItemType(itemType: string, module: ItemSheetLayoutModule): void {
    registry[itemType] = module;
}

/**
 * Development utility to validate all registered modules
 * Checks that each module has the required header and body functions
 * 
 * @returns Validation results
 */
export function validateRegistry(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [itemType, module] of Object.entries(registry)) {
        if (typeof module.header !== 'function') {
            errors.push(`${itemType} module missing header function`);
        }
        if (typeof module.body !== 'function') {
            errors.push(`${itemType} module missing body function`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// Export the registry for testing purposes
export { registry as _registry };