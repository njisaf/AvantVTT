/**
 * @fileoverview Actor Sheet Utils - Pure Functions
 * @description Additional pure functions for actor sheet operations without FoundryVTT dependencies
 * @version 2.0.0
 * @author Avant Development Team
 */

import type { ItemType, ItemData } from '../types/domain/item';
import type { ActorData } from '../types/domain/actor';
import type { ValidationResult } from '../types/core/validation';

/**
 * Represents the result of validating power point usage.
 * Contains validation status and remaining/cost information.
 */
export interface PowerPointValidationResult {
  /** Whether the usage is valid */
  valid: boolean;
  /** Remaining power points after usage */
  remaining: number;
  /** Cost of the action */
  cost: number;
  /** Error message if invalid */
  error?: string;
}

/**
 * Configuration for dice rolls including expression and data.
 * Used for preparing various types of rolls in the system.
 */
export interface RollConfiguration {
  /** The dice expression to roll (e.g., "2d10+5") */
  rollExpression: string;
  /** Data substitutions for the roll */
  rollData?: Record<string, number>;
  /** Flavor text to display with the roll */
  flavor: string;
}

/**
 * Prepares item data for creation with proper defaults
 * 
 * This function takes an item type and dataset and creates a properly
 * structured item data object with appropriate defaults based on the type.
 * It removes the 'type' field from system data to avoid conflicts.
 * 
 * @param itemType - The type of item to create
 * @param dataset - The dataset from the UI element
 * @returns Complete item data object ready for creation
 * 
 * @example
 * ```typescript
 * // Creating a basic weapon
 * const itemData = prepareItemData('weapon', { damage: '1d8' });
 * // Result: { name: 'New Weapon', type: 'weapon', system: { damage: '1d8' } }
 * ```
 */
export function prepareItemData(itemType: string, dataset?: Record<string, unknown>): Partial<ItemData> | null {
    if (!itemType || typeof itemType !== 'string') {
        return null;
    }
    
    const data = dataset ? { ...dataset } : {};
    const name = `New ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
    
    const itemData: Partial<ItemData> = {
        name: name,
        type: itemType as ItemType,
        system: { ...data }
    };
    
    // Remove type from system data to avoid conflicts
    delete (itemData.system as any).type;
    
    // Apply type-specific defaults
    if (itemType === "feature" && data.category) {
        (itemData.system as any).category = data.category;
    }
    
    if (itemType === "action" && !(itemData.system as any).ability) {
        (itemData.system as any).ability = "might";
    }
    
    if (itemType === "augment" && !(itemData.system as any).augmentType) {
        (itemData.system as any).augmentType = "enhancement";
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
 * @param currentPoints - Current power points available
 * @param costPoints - Power points needed for the action
 * @returns Validation result with status and details
 * 
 * @example
 * ```typescript
 * // Sufficient points
 * const result = validatePowerPointUsage(5, 2);
 * // Result: { valid: true, remaining: 3, cost: 2 }
 * 
 * // Insufficient points
 * const result = validatePowerPointUsage(1, 3);
 * // Result: { valid: false, remaining: 1, cost: 3, error: "Not enough..." }
 * ```
 */
export function validatePowerPointUsage(currentPoints: unknown, costPoints: unknown): PowerPointValidationResult {
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
 * @param weapon - The weapon item data
 * @param actor - The actor data
 * @returns Roll configuration with expression, data, and flavor
 * 
 * @example
 * ```typescript
 * // Weapon attack preparation
 * const rollConfig = prepareWeaponAttackRoll(weapon, actor);
 * // Result: {
 * //   rollExpression: "2d10 + @level + @abilityMod + @weaponMod",
 * //   rollData: { level: 3, abilityMod: 2, weaponMod: 1 },
 * //   flavor: "Iron Sword Attack"
 * // }
 * ```
 */
export function prepareWeaponAttackRoll(weapon: unknown, actor: unknown): RollConfiguration | null {
    if (!weapon || !actor || typeof weapon !== 'object' || typeof actor !== 'object') {
        return null;
    }
    
    const weaponObj = weapon as any;
    const actorObj = actor as any;
    
    const weaponAbility = weaponObj.system?.ability || 'might';
    const abilityMod = actorObj.system?.abilities?.[weaponAbility]?.mod || 0;
    const weaponModifier = weaponObj.system?.modifier || 0;
    const level = actorObj.system?.level || 1;
    
    return {
        rollExpression: '2d10 + @level + @abilityMod + @weaponMod',
        rollData: {
            level: level,
            abilityMod: abilityMod,
            weaponMod: weaponModifier
        },
        flavor: `${weaponObj.name} Attack`
    };
}

/**
 * Prepares weapon damage roll data
 * 
 * This function creates the roll configuration for weapon damage using
 * the weapon's damage die and the character's relevant ability modifier.
 * Includes damage type in the flavor text if available.
 * 
 * @param weapon - The weapon item data
 * @param actor - The actor data
 * @returns Roll configuration with expression, data, and flavor
 * 
 * @example
 * ```typescript
 * // Weapon damage preparation
 * const rollConfig = prepareWeaponDamageRoll(weapon, actor);
 * // Result: {
 * //   rollExpression: "1d8 + @abilityMod",
 * //   rollData: { abilityMod: 2 },
 * //   flavor: "Iron Sword Damage (slashing)"
 * // }
 * ```
 */
export function prepareWeaponDamageRoll(weapon: unknown, actor: unknown): RollConfiguration | null {
    if (!weapon || !actor || typeof weapon !== 'object' || typeof actor !== 'object') {
        return null;
    }
    
    const weaponObj = weapon as any;
    const actorObj = actor as any;
    
    const damageRoll = weaponObj.system?.damageDie || "1d6";
    const weaponAbility = weaponObj.system?.ability || 'might';
    const abilityMod = actorObj.system?.abilities?.[weaponAbility]?.mod || 0;
    const damageType = weaponObj.system?.damageType || "";
    
    const flavorText = damageType ? 
        `${weaponObj.name} Damage (${damageType})` : 
        `${weaponObj.name} Damage`;
    
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
 * @param armor - The armor item data
 * @param actor - The actor data
 * @returns Roll configuration with expression, data, and flavor
 * 
 * @example
 * ```typescript
 * // Armor roll preparation
 * const rollConfig = prepareArmorRoll(armor, actor);
 * // Result: {
 * //   rollExpression: "2d10 + @level + @abilityMod + @armorMod",
 * //   rollData: { level: 2, abilityMod: 3, armorMod: 1 },
 * //   flavor: "Leather Armor Armor Check"
 * // }
 * ```
 */
export function prepareArmorRoll(armor: unknown, actor: unknown): RollConfiguration | null {
    if (!armor || !actor || typeof armor !== 'object' || typeof actor !== 'object') {
        return null;
    }
    
    const armorObj = armor as any;
    const actorObj = actor as any;
    
    const armorAbility = armorObj.system?.ability || 'grace';
    const abilityMod = actorObj.system?.abilities?.[armorAbility]?.mod || 0;
    const armorModifier = armorObj.system?.modifier || 0;
    const level = actorObj.system?.level || 1;
    
    return {
        rollExpression: '2d10 + @level + @abilityMod + @armorMod',
        rollData: {
            level: level,
            abilityMod: abilityMod,
            armorMod: armorModifier
        },
        flavor: `${armorObj.name} Armor Check`
    };
}

/**
 * Prepares generic roll data from dataset
 * 
 * This function extracts roll information from a UI element's dataset
 * and prepares it for execution. Returns null if no valid roll is found.
 * 
 * @param dataset - The dataset from the UI element
 * @returns Roll configuration or null if invalid
 * 
 * @example
 * ```typescript
 * // Generic roll preparation
 * const rollConfig = prepareGenericRoll({ roll: "1d20+5", label: "Save" });
 * // Result: { rollExpression: "1d20+5", flavor: "Save" }
 * ```
 */
export function prepareGenericRoll(dataset: Record<string, unknown>): RollConfiguration | null {
    if (!dataset || !dataset.roll) {
        return null;
    }
    
    const rollExpression = String(dataset.roll).trim();
    if (!rollExpression) {
        return null;
    }
    
    const flavor = String(dataset.label || '');
    
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
 * @param element - The DOM element to search from
 * @returns The item ID or null if not found
 * 
 * @example
 * ```typescript
 * // Extract item ID from button element
 * const itemId = extractItemIdFromElement(button);
 * // Result: "item-abc123" or null
 * ```
 */
export function extractItemIdFromElement(element: unknown): string | null {
    if (!element || typeof element !== 'object' || !('closest' in element)) {
        return null;
    }
    
    const htmlElement = element as Element;
    if (typeof htmlElement.closest !== 'function') {
        return null;
    }
    
    const itemElement = htmlElement.closest('.item');
    if (!itemElement) {
        return null;
    }
    
    const htmlItemElement = itemElement as HTMLElement;
    if (!htmlItemElement.dataset) {
        return null;
    }
    
    return htmlItemElement.dataset.itemId || null;
}

/**
 * Formats flavor text for rolls with proper capitalization
 * 
 * This function creates properly formatted flavor text for rolls by
 * capitalizing the first letter of names and optionally including
 * governing ability information for skills.
 * 
 * @param name - The base name (ability, skill, etc.)
 * @param action - The action being performed
 * @param governingAbility - Optional governing ability for skills
 * @returns Formatted flavor text
 * 
 * @example
 * ```typescript
 * // Simple ability check
 * const flavor = formatFlavorText('might', 'Check');
 * // Result: "Might Check"
 * 
 * // Skill check with governing ability
 * const flavor = formatFlavorText('athletics', 'Check', 'might');
 * // Result: "Athletics Check (Might)"
 * ```
 */
export function formatFlavorText(name: string, action: string = '', governingAbility: string = ''): string {
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