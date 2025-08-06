/**
 * @fileoverview Actor Sheet Utils - Pure Functions (Complete TypeScript Version)
 * @description Complete pure functions for actor sheet operations with user-provided values
 * @version 2.0.0
 * @author Avant Development Team
 */

import type { ItemType, ItemData } from '../types/domain/item';
import type { ActorData, Attribute, Attributes, Skills } from '../types/domain/actor';
import type { ValidationResult } from '../types/core/validation';

/**
 * Interface for skill attribute mapping
 */
export interface SkillAttributeMap {
  [skillName: string]: keyof Attributes;
}

/**
 * Interface for organized skill display
 */
export interface OrganizedSkill {
  name: string;
  label: string;
  value: number;
  totalModifier: number;
}

/**
 * Interface for organized skills by attribute
 */
export interface SkillsByAttribute {
  [attributeName: string]: OrganizedSkill[];
}

/**
 * Interface for organized items by type
 */
export interface ItemsByType {
  action: any[];
  weapon: any[];
  armor: any[];
  gear: any[];
  talent: any[];
  augment: any[];
  feature: any[];
  other: any[];
}

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
 * Validation result for attribute roll data
 */
export interface AttributeRollValidation {
  valid: boolean;
  level?: number;
  attributeMod?: number;
  error?: string;
}

/**
 * Validation result for skill roll data
 */
export interface SkillRollValidation {
  valid: boolean;
  level?: number;
  attributeMod?: number;
  skillMod?: number;
  error?: string;
}

/**
 * Calculates attribute total modifiers for display
 *
 * This function combines character level with attribute modifier to show
 * the total modifier used in attribute checks. In the Avant system,
 * attribute checks use 2d10 + Level + Attribute Modifier.
 *
 * @param attributes - The character's attributes object (using modifier field)
 * @param level - The character's level
 * @returns Object with attribute names as keys and total modifiers as values
 *
 * @example
 * ```typescript
 * // Character with level 3 and +2 might modifier
 * const totals = calculateAttributeTotalModifiers(
 *     { might: { modifier: 2 }, grace: { modifier: 1 } },
 *     3
 * );
 * // Result: { might: 5, grace: 4 } (level + modifier for each)
 * ```
 */
export function calculateAttributeTotalModifiers(
  attributes: Partial<Attributes>,
  level: number
): Record<string, number> {
    if (!attributes || typeof attributes !== 'object') {
        return {};
    }
    
    const result: Record<string, number> = {};
    const characterLevel = Number(level) || 1;
    
    for (const [attributeName, attributeData] of Object.entries(attributes)) {
        const attributeMod = attributeData?.modifier || 0;
        result[attributeName] = characterLevel + attributeMod;
    }
    
    return result;
}

/**
 * Calculates skill total modifiers for display
 * 
 * This function combines character level, relevant attribute modifier, and
 * skill value to show the total modifier for skill checks. In Avant,
 * skill checks use 2d10 + Level + Attribute Modifier + Skill Value.
 *
 * @param skills - The character's skills object
 * @param attributes - The character's attributes object (using modifier field)
 * @param skillAttributeMap - Mapping of skills to their governing attributes
 * @param level - The character's level
 * @returns Object with skill names as keys and total modifiers as values
 *
 * @example
 * ```typescript
 * // Character with level 2, +1 might modifier, and 3 athletics skill
 * const totals = calculateSkillTotalModifiers(
 *     { athletics: 3 },
 *     { might: { modifier: 1 } },
 *     { athletics: 'might' },
 *     2
 * );
 * // Result: { athletics: 6 } (2 level + 1 attribute + 3 skill = 6)
 * ```
 */
export function calculateSkillTotalModifiers(
  skills: Partial<Skills>,
  attributes: Partial<Attributes>,
  skillAttributeMap: SkillAttributeMap,
  level: number
): Record<string, number> {
    if (!skills || !attributes || !skillAttributeMap) {
        return {};
    }
    
    const result: Record<string, number> = {};
    const characterLevel = Number(level) || 1;
    
    for (const [skillName, attributeName] of Object.entries(skillAttributeMap)) {
        const skillValue = (skills as any)[skillName] || 0;
        const attributeMod = attributes[attributeName]?.modifier || 0;
        result[skillName] = characterLevel + attributeMod + skillValue;
    }
    
    return result;
}

/**
 * Calculates power point spending limit
 * 
 * In the Avant system, characters can only spend a limited number of
 * power points at once, calculated as max power points divided by 3
 * (minimum 1 point). This calculation is preserved as it's still needed
 * for game mechanics.
 * 
 * @param maxPowerPoints - Maximum power points the character has
 * @returns Maximum power points that can be spent at once
 * 
 * @example
 * ```typescript
 * // Character with 10 max power points
 * const limit = calculatePowerPointLimit(10);
 * // Result: 3 (10 / 3 = 3.33, floored to 3)
 * 
 * // Character with 2 max power points
 * const limitLow = calculatePowerPointLimit(2);
 * // Result: 1 (minimum is always 1)
 * ```
 */
export function calculatePowerPointLimit(maxPowerPoints: number): number {
    const maxPower = Number(maxPowerPoints) || 10;
    return Math.max(1, Math.floor(maxPower / 3));
}

/**
 * Organizes skills by their governing attributes for display
 *
 * This function takes the raw skills data and organizes it into groups
 * based on which attribute governs each skill. This makes it easier to
 * display skills in organized sections on the character sheet.
 * Now works with simplified attribute structure (modifier field only).
 *
 * @param skills - The character's skills object
 * @param attributes - The character's attributes object (modifier field only)
 * @param skillAttributeMap - Mapping of skills to their governing attributes
 * @param level - The character's level
 * @returns Object with attribute names as keys and arrays of skill objects as values
 *
 * @example
 * ```typescript
 * // Organizing skills by attribute
 * const organized = organizeSkillsByAttribute(
 *     { athletics: 2, stealth: 1 },
 *     { might: { modifier: 1 }, grace: { modifier: 2 } },
 *     { athletics: 'might', stealth: 'grace' },
 *     3
 * );
 * // Result: {
 * //   might: [{ name: 'athletics', label: 'Athletics', value: 2, totalModifier: 6 }],
 * //   grace: [{ name: 'stealth', label: 'Stealth', value: 1, totalModifier: 6 }]
 * // }
 * ```
 */
export function organizeSkillsByAttribute(
  skills: Partial<Skills>,
  attributes: Partial<Attributes>,
  skillAttributeMap: SkillAttributeMap,
  level: number
): SkillsByAttribute {
    if (!skills || !attributes || !skillAttributeMap) {
        return {};
    }
    
    const result: SkillsByAttribute = {};
    const characterLevel = Number(level) || 1;
    
    // Initialize arrays for each attribute
    for (const attributeName of Object.keys(attributes)) {
        result[attributeName] = [];
    }
    
    // Organize skills into attribute groups
    for (const [skillName, attributeName] of Object.entries(skillAttributeMap)) {
        if (!result[attributeName]) {
            result[attributeName] = [];
        }
        
        const skillValue = (skills as any)[skillName] || 0;
        const attributeMod = attributes[attributeName]?.modifier || 0;
        
        result[attributeName].push({
            name: skillName,
            label: skillName.charAt(0).toUpperCase() + skillName.slice(1),
            value: skillValue,
            totalModifier: characterLevel + attributeMod + skillValue
        });
    }
    
    // Sort skills alphabetically within each attribute group
    for (const attributeName of Object.keys(result)) {
        result[attributeName].sort((a, b) => a.label.localeCompare(b.label));
    }
    
    return result;
}

/**
 * Organizes items by type for display
 * 
 * This function takes an array of items and groups them by type,
 * making it easier to display different types of items in separate
 * sections of the character sheet.
 * 
 * @param items - Array of item objects
 * @returns Object with item types as keys and arrays of items as values
 * 
 * @example
 * ```typescript
 * // Organizing mixed items
 * const organized = organizeItemsByType([
 *     { type: 'weapon', name: 'Sword' },
 *     { type: 'armor', name: 'Leather Armor' },
 *     { type: 'gear', name: 'Rope' },
 *     { type: 'talent', name: 'Fireball' },
 *     { type: 'augment', name: 'Enhanced Vision' },
 *     { type: 'feature', name: 'Natural Armor' }
 * ]);
 * ```
 */
export function organizeItemsByType(items: any[]): ItemsByType {
    const result: ItemsByType = {
        action: [],
        weapon: [],
        armor: [],
        gear: [],
        talent: [],
        augment: [],
        feature: [],
        other: []
    };
    
    if (!Array.isArray(items)) {
        return result;
    }
    
    for (const item of items) {
        const itemType = item?.type || 'other';
        if (result[itemType as keyof ItemsByType]) {
            (result[itemType as keyof ItemsByType] as any[]).push(item);
        } else {
            result.other.push(item);
        }
    }
    
    return result;
}

/**
 * Validates attribute roll data
 *
 * This function checks if the provided data is sufficient to perform
 * an attribute roll in the Avant system. Now works with simplified
 * attribute structure (modifier field only).
 *
 * @param attributeName - Name of the attribute to roll
 * @param attributeData - The attribute's data object (with modifier field)
 * @param level - Character level
 * @returns Object with valid boolean and error message, plus roll data if valid
 *
 * @example
 * ```typescript
 * // Valid attribute roll
 * const result = validateAttributeRollData('might', { modifier: 2 }, 3);
 * // Result: { valid: true, level: 3, attributeMod: 2 }
 *
 * // Invalid attribute roll (missing data)
 * const invalid = validateAttributeRollData('missing', null, 3);
 * // Result: { valid: false, error: "Invalid attribute data" }
 * ```
 */
export function validateAttributeRollData(
  attributeName: string,
  attributeData: Attribute | null | undefined,
  level: number
): AttributeRollValidation {
    if (!attributeName || typeof attributeName !== 'string') {
        return { valid: false, error: "No attribute name specified" };
    }
    
    if (!attributeData || typeof attributeData !== 'object') {
        return { valid: false, error: "Invalid attribute data" };
    }
    
    const characterLevel = Number(level);
    if (!characterLevel || characterLevel < 1) {
        return { valid: false, error: "Invalid character level" };
    }
    
    const attributeMod = Number(attributeData.modifier) || 0;
    
    return {
        valid: true,
        level: characterLevel,
        attributeMod: attributeMod
    };
}

/**
 * Validates skill roll data
 * 
 * This function checks if the provided data is sufficient to perform
 * a skill roll in the Avant system. Now works with simplified
 * attribute structure (modifier field only).
 *
 * @param skillName - Name of the skill to roll
 * @param skillValue - The skill's value
 * @param attributeData - The governing attribute's data object (with modifier field)
 * @param level - Character level
 * @returns Object with valid boolean and error message, plus roll data if valid
 *
 * @example
 * ```typescript
 * // Valid skill roll
 * const result = validateSkillRollData('athletics', 3, { modifier: 1 }, 2);
 * // Result: { valid: true, level: 2, attributeMod: 1, skillMod: 3 }
 * ```
 */
export function validateSkillRollData(
  skillName: string,
  skillValue: number | undefined,
  attributeData: Attribute | null | undefined,
  level: number
): SkillRollValidation {
    if (!skillName || typeof skillName !== 'string') {
        return { valid: false, error: "No skill name specified" };
    }
    
    const skillMod = Number(skillValue);
    if (skillValue === undefined || isNaN(skillMod)) {
        return { valid: false, error: "Invalid skill value" };
    }
    
    if (!attributeData || typeof attributeData !== 'object') {
        return { valid: false, error: "Invalid attribute data for skill" };
    }
    
    const characterLevel = Number(level);
    if (!characterLevel || characterLevel < 1) {
        return { valid: false, error: "Invalid character level" };
    }
    
    const attributeMod = Number(attributeData.modifier) || 0;
    
    return {
        valid: true,
        level: characterLevel,
        attributeMod: attributeMod,
        skillMod: skillMod
    };
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
    const timestamp = new Date().toISOString();
    
    // PHASE 1 INSTRUMENTATION: Log item data preparation
    console.debug(`🎯 ITEM-UTILS | ${timestamp} | prepareItemData | ENTRY`, {
        itemType,
        hasDataset: !!dataset,
        datasetKeys: dataset ? Object.keys(dataset) : []
    });
    
    if (!itemType || typeof itemType !== 'string') {
        console.warn(`🎯 ITEM-UTILS | ${timestamp} | prepareItemData | Invalid itemType:`, itemType);
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
    
    if (itemType === "action" && !(itemData.system as any).attribute) {
        (itemData.system as any).attribute = "might";
    }
    
    if (itemType === "augment" && !(itemData.system as any).augmentType) {
        (itemData.system as any).augmentType = "enhancement";
    }
    
    console.debug(`🎯 ITEM-UTILS | ${timestamp} | prepareItemData | RESULT`, {
        resultName: itemData.name,
        resultType: itemData.type,
        systemKeys: itemData.system ? Object.keys(itemData.system) : []
    });
    
    return itemData;
}

/**
 * Process dropped item data for actor sheet integration
 * PHASE 1 INSTRUMENTATION: Track dropped item processing with detailed logging
 * 
 * @param sourceItem - The source item from compendium or world
 * @param targetActor - The actor receiving the item
 * @returns Processing result with metadata
 */
export function processDroppedItem(sourceItem: any, targetActor: any): {
    success: boolean;
    cleanData?: any;
    duplicateInfo?: any;
    error?: string;
} {
    const timestamp = new Date().toISOString();
    
    console.debug(`🎯 ITEM-UTILS | ${timestamp} | processDroppedItem | ENTRY`, {
        sourceItemId: sourceItem?.id,
        sourceItemName: sourceItem?.name,
        sourceItemType: sourceItem?.type,
        targetActorId: targetActor?.id,
        targetActorName: targetActor?.name,
        targetActorItemCount: targetActor?.items?.size || 0
    });

    try {
        // Validate inputs
        if (!sourceItem) {
            console.error(`🎯 ITEM-UTILS | ${timestamp} | processDroppedItem | No source item provided`);
            return { success: false, error: 'No source item provided' };
        }

        if (!targetActor) {
            console.error(`🎯 ITEM-UTILS | ${timestamp} | processDroppedItem | No target actor provided`);
            return { success: false, error: 'No target actor provided' };
        }

        // Check for duplicates
        const duplicateCheck = checkForDuplicateItem(sourceItem, targetActor);
        console.debug(`🎯 ITEM-UTILS | ${timestamp} | processDroppedItem | Duplicate check`, duplicateCheck);

        // Prepare clean data
        const itemData = sourceItem.toObject ? sourceItem.toObject() : sourceItem;
        const cleanData = {
            ...itemData,
            _id: undefined, // Force new ID generation
            folder: undefined,
            sort: undefined,
            ownership: undefined
        };

        console.debug(`🎯 ITEM-UTILS | ${timestamp} | processDroppedItem | Clean data prepared`, {
            originalDataKeys: Object.keys(itemData),
            cleanDataKeys: Object.keys(cleanData),
            hasName: !!cleanData.name,
            hasType: !!cleanData.type,
            hasSystem: !!cleanData.system
        });

        return {
            success: true,
            cleanData,
            duplicateInfo: duplicateCheck
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`🎯 ITEM-UTILS | ${timestamp} | processDroppedItem | Error:`, error);
        return { success: false, error: errorMessage };
    }
}

/**
 * Check for duplicate items on an actor
 * PHASE 1 INSTRUMENTATION: Track duplicate detection logic
 * 
 * @param sourceItem - The item being added
 * @param targetActor - The actor to check
 * @returns Duplicate information
 */
export function checkForDuplicateItem(sourceItem: any, targetActor: any): {
    hasDuplicate: boolean;
    duplicateItem?: any;
    duplicateCount: number;
    conflictType: 'none' | 'exact' | 'name' | 'multiple';
} {
    const timestamp = new Date().toISOString();
    
    console.debug(`🎯 ITEM-UTILS | ${timestamp} | checkForDuplicateItem | ENTRY`, {
        sourceItemName: sourceItem?.name,
        sourceItemType: sourceItem?.type,
        actorItemCount: targetActor?.items?.size || 0
    });

    try {
        if (!targetActor?.items) {
            console.debug(`🎯 ITEM-UTILS | ${timestamp} | checkForDuplicateItem | No items collection on actor`);
            return { hasDuplicate: false, duplicateCount: 0, conflictType: 'none' };
        }

        // Find exact matches (name and type)
        const exactMatches = targetActor.items.filter((item: any) => 
            item.name === sourceItem.name && item.type === sourceItem.type
        );

        // Find name-only matches
        const nameMatches = targetActor.items.filter((item: any) => 
            item.name === sourceItem.name
        );

        const result = {
            hasDuplicate: exactMatches.length > 0,
            duplicateItem: exactMatches[0] || nameMatches[0],
            duplicateCount: exactMatches.length,
            conflictType: exactMatches.length > 1 ? 'multiple' : 
                         exactMatches.length === 1 ? 'exact' :
                         nameMatches.length > 0 ? 'name' : 'none'
        } as const;

        console.debug(`🎯 ITEM-UTILS | ${timestamp} | checkForDuplicateItem | RESULT`, {
            hasDuplicate: result.hasDuplicate,
            exactMatches: exactMatches.length,
            nameMatches: nameMatches.length,
            conflictType: result.conflictType
        });

        return result;

    } catch (error) {
        console.error(`🎯 ITEM-UTILS | ${timestamp} | checkForDuplicateItem | Error:`, error);
        return { hasDuplicate: false, duplicateCount: 0, conflictType: 'none' };
    }
}

/**
 * Validate if an actor has enough power points for an action
 * @param powerPoints - The actor's power points data
 * @param cost - The power point cost to validate
 * @returns Validation result with success/error information
 */
export function validatePowerPointUsage(powerPoints: any, cost: number): { valid: boolean; error?: string } {
    if (!powerPoints) {
        return { valid: false, error: 'No power points data available' };
    }
    
    const current = powerPoints.current || 0;
    const max = powerPoints.max || 0;
    
    if (cost < 0) {
        return { valid: false, error: 'Power point cost cannot be negative' };
    }
    
    if (cost === 0) {
        return { valid: true };
    }
    
    if (current < cost) {
        return { valid: false, error: `Insufficient power points (need ${cost}, have ${current})` };
    }
    
    return { valid: true };
}

/**
 * Prepares weapon attack roll data
 * 
 * This function extracts weapon and actor data to create the roll expression
 * and roll data needed for a weapon attack. Uses the weapon's attribute and
 * modifier along with the character's level and relevant attribute modifier.
 * Now works with simplified attribute structure (modifier field only).
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
 * //   rollExpression: "2d10 + @level + @attributeMod + @weaponMod",
 * //   rollData: { level: 3, attributeMod: 2, weaponMod: 1 },
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
    
    const weaponAttribute = weaponObj.system?.attribute || 'might';
    const attributeMod = actorObj.system?.attributes?.[weaponAttribute]?.modifier || 0;
    const weaponModifier = weaponObj.system?.modifier || 0;
    const level = actorObj.system?.level || 1;
    
    return {
        rollExpression: '2d10 + @level + @attributeMod + @weaponMod',
        rollData: {
            level: level,
            attributeMod: attributeMod,
            weaponMod: weaponModifier
        },
        flavor: `${weaponObj.name} Attack`
    };
}

/**
 * Prepares weapon damage roll data
 * 
 * This function creates the roll configuration for weapon damage using
 * the weapon's damage die and the character's relevant attribute modifier.
 * Includes damage type in the flavor text if available.
 * Now works with simplified attribute structure (modifier field only).
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
 * //   rollExpression: "1d8 + @attributeMod",
 * //   rollData: { attributeMod: 2 },
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
    const weaponAttribute = weaponObj.system?.attribute || 'might';
    const attributeMod = actorObj.system?.attributes?.[weaponAttribute]?.modifier || 0;
    const damageType = weaponObj.system?.damageType || "";
    
    const flavorText = damageType ?
        `${weaponObj.name} Damage (${damageType})` :
        `${weaponObj.name} Damage`;
    
    return {
        rollExpression: `${damageRoll} + @attributeMod`,
        rollData: { attributeMod: attributeMod },
        flavor: flavorText
    };
}

/**
 * Prepares armor roll data
 * 
 * This function creates the roll configuration for armor checks using
 * the armor's attribute (usually grace) and modifier along with the
 * character's level and relevant attribute modifier.
 * Now works with simplified attribute structure (modifier field only).
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
 * //   rollExpression: "2d10 + @level + @attributeMod + @armorMod",
 * //   rollData: { level: 2, attributeMod: 3, armorMod: 1 },
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
    
    const armorAttribute = armorObj.system?.attribute || 'grace';
    const attributeMod = actorObj.system?.attributes?.[armorAttribute]?.modifier || 0;
    const armorModifier = armorObj.system?.modifier || 0;
    const level = actorObj.system?.level || 1;
    
    return {
        rollExpression: '2d10 + @level + @attributeMod + @armorMod',
        rollData: {
            level: level,
            attributeMod: attributeMod,
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
 * Extracts item ID from DOM element looking for both .item parent and direct data-item-id
 * 
 * This function safely extracts the item ID from a DOM element by first checking
 * for a direct data-item-id attribute, then falling back to finding the closest 
 * item parent with various class names used in the actor sheet template.
 * Handles all item types: gear, action, feature, talent, augment, and combat items.
 * 
 * @param element - The DOM element to search from
 * @returns The item ID or null if not found
 * 
 * @example
 * ```typescript
 * // Extract item ID from button element with direct data-item-id
 * const itemId = extractItemIdFromElement(button);
 * // Result: "item-abc123" or null
 * ```
 */
export function extractItemIdFromElement(element: unknown): string | null {
    if (!element || typeof element !== 'object' || !('closest' in element)) {
        return null;
    }
    
    const htmlElement = element as HTMLElement;
    
    // First try: Check if the element itself has data-item-id (for combat buttons)
    if (htmlElement.dataset && htmlElement.dataset.itemId) {
        return htmlElement.dataset.itemId;
    }
    
    // Second try: Look for all possible item parent selectors used in the template
    if (typeof htmlElement.closest === 'function') {
        const itemSelectors = [
            '.item',           // Generic items (gear)
            '.gear-item',      // Gear items
            '.action-item',    // Action items
            '.feature-item',   // Feature items  
            '.talent-item',    // Talent items
            '.augment-item',   // Augment items
            '.combat-item'     // Combat items (weapons, armor)
        ];
        
        for (const selector of itemSelectors) {
            const itemElement = htmlElement.closest(selector);
            if (itemElement) {
                const htmlItemElement = itemElement as HTMLElement;
                if (htmlItemElement.dataset && htmlItemElement.dataset.itemId) {
                    return htmlItemElement.dataset.itemId;
                }
            }
        }
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
 * @param element - The DOM element (typically a button) to extract item ID from
 * @returns The item ID or null if not found
 * 
 * @example
 * ```typescript
 * // Extract item ID from combat button
 * const itemId = extractCombatItemId(button);
 * // Result: "item-abc123" or null
 * ```
 */
export function extractCombatItemId(element: unknown): string | null {
    if (!element || typeof element !== 'object') {
        return null;
    }
    
    const htmlElement = element as HTMLElement;
    
    // Combat buttons have data-item-id directly on them
    if (htmlElement.dataset && htmlElement.dataset.itemId) {
        return htmlElement.dataset.itemId;
    }
    
    // Fallback: try getAttribute for maximum compatibility
    if (htmlElement.getAttribute && typeof htmlElement.getAttribute === 'function') {
        return htmlElement.getAttribute('data-item-id');
    }
    
    return null;
}

/**
 * Handles keyboard navigation for talent and augment rows
 * 
 * This function manages up/down arrow navigation through talent and augment rows,
 * with space to activate/roll and proper focus management following WCAG guidelines.
 * 
 * @param event - The keyboard event 
 * @param currentElement - The currently focused element
 * @returns True if the event was handled, false otherwise
 * 
 * @example
 * ```typescript
 * // Handle keyboard navigation in talent rows
 * const handled = handleRowKeyboardNavigation(keyEvent, focusedElement);
 * if (handled) {
 *     keyEvent.preventDefault();
 * }
 * ```
 */
export function handleRowKeyboardNavigation(event: unknown, currentElement: unknown): boolean {
    if (!event || !currentElement || typeof event !== 'object' || typeof currentElement !== 'object') {
        return false;
    }
    
    const keyboardEvent = event as KeyboardEvent;
    const element = currentElement as HTMLElement;
    
    // Only handle specific keys
    if (!['ArrowUp', 'ArrowDown', 'Space', 'Enter'].includes(keyboardEvent.key)) {
        return false;
    }
    
    const currentRow = element.closest('.talent-item, .augment-item');
    if (!currentRow) {
        return false;
    }
    
    const allRows = Array.from(document.querySelectorAll('.talent-item, .augment-item'));
    const currentIndex = allRows.indexOf(currentRow as Element);
    
    if (currentIndex === -1) {
        return false;
    }
    
    switch (keyboardEvent.key) {
        case 'ArrowUp':
            if (currentIndex > 0) {
                const previousRow = allRows[currentIndex - 1] as HTMLElement;
                const focusTarget = previousRow.querySelector('.row-title, .chat-roll-btn, .activate-toggle-btn') as HTMLElement;
                focusTarget?.focus();
                return true;
            }
            break;
            
        case 'ArrowDown':
            if (currentIndex < allRows.length - 1) {
                const nextRow = allRows[currentIndex + 1] as HTMLElement;
                const focusTarget = nextRow.querySelector('.row-title, .chat-roll-btn, .activate-toggle-btn') as HTMLElement;
                focusTarget?.focus();
                return true;
            }
            break;
            
        case 'Space':
        case 'Enter':
            // Activate the primary action (roll or activate)
            const actionButton = currentRow.querySelector('.chat-roll-btn, .activate-toggle-btn') as HTMLElement;
            if (actionButton) {
                actionButton.click();
                return true;
            }
            break;
    }
    
    return false;
}

/**
 * Manages focus for AP selector radiogroup
 * 
 * This function handles keyboard navigation within the AP selector, ensuring
 * proper radiogroup behavior with arrow keys and space/enter activation.
 * 
 * @param event - The keyboard event
 * @param selectorElement - The AP selector container element
 * @returns True if the event was handled, false otherwise
 * 
 * @example
 * ```typescript
 * // Handle AP selector keyboard navigation
 * const handled = handleAPSelectorNavigation(keyEvent, apSelector);
 * if (handled) {
 *     keyEvent.preventDefault();
 * }
 * ```
 */
export function handleAPSelectorNavigation(event: unknown, selectorElement: unknown): boolean {
    if (!event || !selectorElement || typeof event !== 'object' || typeof selectorElement !== 'object') {
        return false;
    }
    
    const keyboardEvent = event as KeyboardEvent;
    const selector = selectorElement as HTMLElement;
    
    // Only handle arrow keys and space/enter within radiogroup
    if (!['ArrowLeft', 'ArrowRight', 'Space', 'Enter'].includes(keyboardEvent.key)) {
        return false;
    }
    
    const apIcons = Array.from(selector.querySelectorAll('.ap-icon')) as HTMLElement[];
    const currentFocused = apIcons.find(icon => icon === document.activeElement);
    const currentIndex = currentFocused ? apIcons.indexOf(currentFocused) : -1;
    
    switch (keyboardEvent.key) {
        case 'ArrowLeft':
            if (currentIndex > 0) {
                apIcons[currentIndex - 1].focus();
                return true;
            }
            break;
            
        case 'ArrowRight':
            if (currentIndex < apIcons.length - 1) {
                apIcons[currentIndex + 1].focus();
                return true;
            }
            break;
            
        case 'Space':
        case 'Enter':
            if (currentFocused) {
                currentFocused.click();
                return true;
            }
            break;
    }
    
    return false;
}

/**
 * Calculates trait overflow count for display
 * 
 * This function determines how many traits are hidden when there are too many
 * to display in the available space (limited to ~2 rows or 4 traits).
 * 
 * @param traits - Array of trait objects
 * @param maxVisible - Maximum number of traits to show (default: 4)
 * @returns Object with visible traits and overflow count
 * 
 * @example
 * ```typescript
 * // Calculate trait overflow
 * const result = calculateTraitOverflow(traits, 4);
 * // Result: { visibleTraits: [...], overflowCount: 2 }
 * ```
 */
export function calculateTraitOverflow(traits: unknown, maxVisible: number = 4): { visibleTraits: any[], overflowCount: number } {
    if (!Array.isArray(traits)) {
        return { visibleTraits: [], overflowCount: 0 };
    }
    
    const maxTraits = Math.max(1, Math.floor(maxVisible));
    
    if (traits.length <= maxTraits) {
        return { visibleTraits: traits, overflowCount: 0 };
    }
    
    return {
        visibleTraits: traits.slice(0, maxTraits),
        overflowCount: traits.length - maxTraits
    };
}

/**
 * Formats flavor text for rolls with proper capitalization
 * 
 * This function creates properly formatted flavor text for rolls by
 * capitalizing the first letter of names and optionally including
 * governing attribute information for skills.
 *
 * @param name - The base name (attribute, skill, etc.)
 * @param action - The action being performed
 * @param governingAttribute - Optional governing attribute for skills
 * @returns Formatted flavor text
 *
 * @example
 * ```typescript
 * // Simple attribute check
 * const flavor = formatFlavorText('might', 'Check');
 * // Result: "Might Check"
 *
 * // Skill check with governing attribute
 * const flavor = formatFlavorText('athletics', 'Check', 'might');
 * // Result: "Athletics Check (Might)"
 * ```
 */
export function formatFlavorText(name: string, action: string = '', governingAttribute: string = ''): string {
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    
    if (!action) {
        return capitalizedName;
    }
    
    if (governingAttribute) {
        const capitalizedAttribute = governingAttribute.charAt(0).toUpperCase() + governingAttribute.slice(1);
        return `${capitalizedName} ${action} (${capitalizedAttribute})`;
    }
    
    return `${capitalizedName} ${action}`;
}