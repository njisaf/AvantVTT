/**
 * @fileoverview Actor Sheet Utils - Pure Functions (Complete TypeScript Version)
 * @description Complete pure functions for actor sheet operations with user-provided values
 * @version 2.0.0
 * @author Avant Development Team
 */

import type { ItemType, ItemData } from '../types/domain/item';
import type { ActorData, Ability, Abilities, Skills } from '../types/domain/actor';
import type { ValidationResult } from '../types/core/validation';

/**
 * Interface for skill ability mapping
 */
export interface SkillAbilityMap {
  [skillName: string]: keyof Abilities;
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
 * Interface for organized skills by ability
 */
export interface SkillsByAbility {
  [abilityName: string]: OrganizedSkill[];
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
 * Validation result for ability roll data
 */
export interface AbilityRollValidation {
  valid: boolean;
  level?: number;
  abilityMod?: number;
  error?: string;
}

/**
 * Validation result for skill roll data
 */
export interface SkillRollValidation {
  valid: boolean;
  level?: number;
  abilityMod?: number;
  skillMod?: number;
  error?: string;
}

/**
 * Calculates ability total modifiers for display
 * 
 * This function combines character level with ability modifier to show
 * the total modifier used in ability checks. In the Avant system,
 * ability checks use 2d10 + Level + Ability Modifier.
 * 
 * @param abilities - The character's abilities object (using modifier field)
 * @param level - The character's level
 * @returns Object with ability names as keys and total modifiers as values
 * 
 * @example
 * ```typescript
 * // Character with level 3 and +2 might modifier
 * const totals = calculateAbilityTotalModifiers(
 *     { might: { modifier: 2 }, grace: { modifier: 1 } }, 
 *     3
 * );
 * // Result: { might: 5, grace: 4 } (level + modifier for each)
 * ```
 */
export function calculateAbilityTotalModifiers(
  abilities: Partial<Abilities>, 
  level: number
): Record<string, number> {
    if (!abilities || typeof abilities !== 'object') {
        return {};
    }
    
    const result: Record<string, number> = {};
    const characterLevel = Number(level) || 1;
    
    for (const [abilityName, abilityData] of Object.entries(abilities)) {
        const abilityMod = abilityData?.modifier || 0;
        result[abilityName] = characterLevel + abilityMod;
    }
    
    return result;
}

/**
 * Calculates skill total modifiers for display
 * 
 * This function combines character level, relevant ability modifier, and
 * skill value to show the total modifier for skill checks. In Avant,
 * skill checks use 2d10 + Level + Ability Modifier + Skill Value.
 * 
 * @param skills - The character's skills object
 * @param abilities - The character's abilities object (using modifier field)
 * @param skillAbilityMap - Mapping of skills to their governing abilities
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
 * // Result: { athletics: 6 } (2 level + 1 ability + 3 skill = 6)
 * ```
 */
export function calculateSkillTotalModifiers(
  skills: Partial<Skills>, 
  abilities: Partial<Abilities>, 
  skillAbilityMap: SkillAbilityMap, 
  level: number
): Record<string, number> {
    if (!skills || !abilities || !skillAbilityMap) {
        return {};
    }
    
    const result: Record<string, number> = {};
    const characterLevel = Number(level) || 1;
    
    for (const [skillName, abilityName] of Object.entries(skillAbilityMap)) {
        const skillValue = (skills as any)[skillName] || 0;
        const abilityMod = abilities[abilityName]?.modifier || 0;
        result[skillName] = characterLevel + abilityMod + skillValue;
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
 * Organizes skills by their governing abilities for display
 * 
 * This function takes the raw skills data and organizes it into groups
 * based on which ability governs each skill. This makes it easier to
 * display skills in organized sections on the character sheet.
 * Now works with simplified ability structure (modifier field only).
 * 
 * @param skills - The character's skills object
 * @param abilities - The character's abilities object (modifier field only)
 * @param skillAbilityMap - Mapping of skills to their governing abilities
 * @param level - The character's level
 * @returns Object with ability names as keys and arrays of skill objects as values
 * 
 * @example
 * ```typescript
 * // Organizing skills by ability
 * const organized = organizeSkillsByAbility(
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
export function organizeSkillsByAbility(
  skills: Partial<Skills>, 
  abilities: Partial<Abilities>, 
  skillAbilityMap: SkillAbilityMap, 
  level: number
): SkillsByAbility {
    if (!skills || !abilities || !skillAbilityMap) {
        return {};
    }
    
    const result: SkillsByAbility = {};
    const characterLevel = Number(level) || 1;
    
    // Initialize arrays for each ability
    for (const abilityName of Object.keys(abilities)) {
        result[abilityName] = [];
    }
    
    // Organize skills into ability groups
    for (const [skillName, abilityName] of Object.entries(skillAbilityMap)) {
        if (!result[abilityName]) {
            result[abilityName] = [];
        }
        
        const skillValue = (skills as any)[skillName] || 0;
        const abilityMod = abilities[abilityName]?.modifier || 0;
        
        result[abilityName].push({
            name: skillName,
            label: skillName.charAt(0).toUpperCase() + skillName.slice(1),
            value: skillValue,
            totalModifier: characterLevel + abilityMod + skillValue
        });
    }
    
    // Sort skills alphabetically within each ability group
    for (const abilityName of Object.keys(result)) {
        result[abilityName].sort((a, b) => a.label.localeCompare(b.label));
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
 * Validates ability roll data
 * 
 * This function checks if the provided data is sufficient to perform
 * an ability roll in the Avant system. Now works with simplified 
 * ability structure (modifier field only).
 * 
 * @param abilityName - Name of the ability to roll
 * @param abilityData - The ability's data object (with modifier field)
 * @param level - Character level
 * @returns Object with valid boolean and error message, plus roll data if valid
 * 
 * @example
 * ```typescript
 * // Valid ability roll
 * const result = validateAbilityRollData('might', { modifier: 2 }, 3);
 * // Result: { valid: true, level: 3, abilityMod: 2 }
 * 
 * // Invalid ability roll (missing data)
 * const invalid = validateAbilityRollData('missing', null, 3);
 * // Result: { valid: false, error: "Invalid ability data" }
 * ```
 */
export function validateAbilityRollData(
  abilityName: string, 
  abilityData: Ability | null | undefined, 
  level: number
): AbilityRollValidation {
    if (!abilityName || typeof abilityName !== 'string') {
        return { valid: false, error: "No ability name specified" };
    }
    
    if (!abilityData || typeof abilityData !== 'object') {
        return { valid: false, error: "Invalid ability data" };
    }
    
    const characterLevel = Number(level);
    if (!characterLevel || characterLevel < 1) {
        return { valid: false, error: "Invalid character level" };
    }
    
    const abilityMod = Number(abilityData.modifier) || 0;
    
    return { 
        valid: true, 
        level: characterLevel,
        abilityMod: abilityMod
    };
}

/**
 * Validates skill roll data
 * 
 * This function checks if the provided data is sufficient to perform
 * a skill roll in the Avant system. Now works with simplified
 * ability structure (modifier field only).
 * 
 * @param skillName - Name of the skill to roll
 * @param skillValue - The skill's value
 * @param abilityData - The governing ability's data object (with modifier field)
 * @param level - Character level
 * @returns Object with valid boolean and error message, plus roll data if valid
 * 
 * @example
 * ```typescript
 * // Valid skill roll
 * const result = validateSkillRollData('athletics', 3, { modifier: 1 }, 2);
 * // Result: { valid: true, level: 2, abilityMod: 1, skillMod: 3 }
 * ```
 */
export function validateSkillRollData(
  skillName: string, 
  skillValue: number | undefined, 
  abilityData: Ability | null | undefined, 
  level: number
): SkillRollValidation {
    if (!skillName || typeof skillName !== 'string') {
        return { valid: false, error: "No skill name specified" };
    }
    
    const skillMod = Number(skillValue);
    if (skillValue === undefined || isNaN(skillMod)) {
        return { valid: false, error: "Invalid skill value" };
    }
    
    if (!abilityData || typeof abilityData !== 'object') {
        return { valid: false, error: "Invalid ability data for skill" };
    }
    
    const characterLevel = Number(level);
    if (!characterLevel || characterLevel < 1) {
        return { valid: false, error: "Invalid character level" };
    }
    
    const abilityMod = Number(abilityData.modifier) || 0;
    
    return { 
        valid: true, 
        level: characterLevel,
        abilityMod: abilityMod,
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
 * Now works with simplified ability structure (modifier field only).
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
    const abilityMod = actorObj.system?.abilities?.[weaponAbility]?.modifier || 0;
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
 * Now works with simplified ability structure (modifier field only).
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
    const abilityMod = actorObj.system?.abilities?.[weaponAbility]?.modifier || 0;
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
 * Now works with simplified ability structure (modifier field only).
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
    const abilityMod = actorObj.system?.abilities?.[armorAbility]?.modifier || 0;
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