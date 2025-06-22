/**
 * @fileoverview Validation Logic - Pure Functions
 * @description Pure functions for data validation without external dependencies
 * @version 2.0.0
 * @author Avant Development Team
 */

import type { 
    ValidationResult, 
    ValidatedActorAbilities, 
    ValidatedActorSkills, 
    ValidatedHealthData, 
    ValidatedPowerPointsData, 
    ValidatedUsesData 
} from '../types/core/validation';
import type { Abilities, Skills } from '../types/domain/actor';

/**
 * Validates and normalizes a number value
 * 
 * This function takes any input value and attempts to convert it to a number.
 * If the value cannot be converted or is invalid, it returns the default value.
 * Supports both integer and floating-point number validation.
 * 
 * @param value - The value to validate and convert
 * @param defaultValue - The default value to return if validation fails
 * @param isInteger - Whether the result should be an integer
 * @returns The validated number
 * 
 * @example
 * ```typescript
 * // Integer validation
 * const level = validateNumber("5", 1, true);
 * // Result: 5
 * 
 * // Float validation
 * const weight = validateNumber("10.5", 1.0, false);
 * // Result: 10.5
 * 
 * // Invalid input uses default
 * const invalid = validateNumber("abc", 0, true);
 * // Result: 0
 * ```
 */
export function validateNumber(value: unknown, defaultValue: number = 0, isInteger: boolean = true): number {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    
    const parsed = isInteger ? parseInt(String(value)) : parseFloat(String(value));
    
    if (isNaN(parsed)) {
        return defaultValue;
    }
    
    return parsed;
}

/**
 * Validates and normalizes a string value
 * 
 * This function ensures the input is converted to a string format.
 * If the input is null or undefined, it returns the default value.
 * All other values are converted using String() constructor.
 * 
 * @param value - The value to validate and convert
 * @param defaultValue - The default value to return if value is null/undefined
 * @returns The validated string
 * 
 * @example
 * ```typescript
 * // String validation
 * const name = validateString("Test", "");
 * // Result: "Test"
 * 
 * // Null/undefined uses default
 * const empty = validateString(null, "default");
 * // Result: "default"
 * 
 * // Number conversion
 * const converted = validateString(123, "");
 * // Result: "123"
 * ```
 */
export function validateString(value: unknown, defaultValue: string = ''): string {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    
    return String(value);
}

/**
 * Validates actor type against supported types
 * 
 * This function ensures the actor type is one of the supported values
 * for the Avant system. If the type is invalid or missing, it returns
 * the default 'character' type.
 * 
 * @param actorType - The actor type to validate
 * @returns Valid actor type
 * 
 * @example
 * ```typescript
 * // Valid type
 * const type1 = validateActorType("character");
 * // Result: "character"
 * 
 * // Invalid type uses default
 * const type2 = validateActorType("invalid");
 * // Result: "character"
 * ```
 */
export function validateActorType(actorType: unknown): 'character' | 'npc' | 'vehicle' {
    const supportedTypes = ['character', 'npc', 'vehicle'] as const;
    
    if (!actorType || typeof actorType !== 'string' || actorType.trim() === '') {
        return 'character';
    }
    
    if (!supportedTypes.includes(actorType as any)) {
        return 'character';
    }
    
    return actorType as 'character' | 'npc' | 'vehicle';
}

/**
 * Validates item type against supported types
 * 
 * This function ensures the item type is one of the supported values
 * for the Avant system. If the type is invalid or missing, it returns
 * the default 'gear' type.
 * 
 * @param itemType - The item type to validate
 * @returns Valid item type
 * 
 * @example
 * ```typescript
 * // Valid type
 * const type1 = validateItemType("weapon");
 * // Result: "weapon"
 * 
 * // Invalid type uses default
 * const type2 = validateItemType("invalid");
 * // Result: "gear"
 * ```
 */
export function validateItemType(itemType: unknown): 'action' | 'feature' | 'talent' | 'augment' | 'weapon' | 'armor' | 'gear' {
    const supportedTypes = ["action", "feature", "talent", "augment", "weapon", "armor", "gear"] as const;
    
    if (!itemType || !supportedTypes.includes(itemType as any)) {
        return "gear";
    }
    
    return itemType as typeof supportedTypes[number];
}

/**
 * Validates ability modifier values with bounds checking
 * 
 * This function validates ability data objects and ensures modifiers
 * are within reasonable bounds (-10 to +10). It creates a complete
 * abilities object with all four core abilities.
 * 
 * @param abilities - The abilities object to validate
 * @returns Validated abilities with all core abilities
 * 
 * @example
 * ```typescript
 * // Valid abilities
 * const abilities = validateAbilities({
 *     might: { modifier: 3 },
 *     grace: { modifier: -1 }
 * });
 * // Result: {
 * //   might: { modifier: 3 },
 * //   grace: { modifier: -1 },
 * //   intellect: { modifier: 0 },
 * //   focus: { modifier: 0 }
 * // }
 * ```
 */
export function validateAbilities(abilities: unknown): Abilities {
    if (!abilities || typeof abilities !== 'object' || abilities === null) {
        abilities = {};
    }
    
    const abilitiesObj = abilities as Record<string, any>;
    const validatedAbilities: Partial<Abilities> = {};
    const defaultAbilities = ['might', 'grace', 'intellect', 'focus'] as const;
    
    for (const abilityName of defaultAbilities) {
        if (abilitiesObj[abilityName] && typeof abilitiesObj[abilityName] === 'object') {
            let modifier = validateNumber(abilitiesObj[abilityName].modifier, 0, true);
            
            // Ensure ability modifier is within reasonable bounds (-10 to +10)
            if (modifier < -10) {
                modifier = -10;
            }
            if (modifier > 10) {
                modifier = 10;
            }
            
            validatedAbilities[abilityName] = { modifier };
        } else {
            validatedAbilities[abilityName] = { modifier: 0 };
        }
    }
    
    return validatedAbilities as Abilities;
}

/**
 * Validates skill values for all core skills
 * 
 * This function validates skill data and ensures all core skills
 * are present with valid numeric values. Missing skills default to 0.
 * 
 * @param skills - The skills object to validate
 * @returns Validated skills with all core skills
 * 
 * @example
 * ```typescript
 * // Partial skills
 * const skills = validateSkills({
 *     debate: 3,
 *     force: "2"
 * });
 * // Result: {
 * //   debate: 3, discern: 0, endure: 0, finesse: 0,
 * //   force: 2, command: 0, charm: 0, hide: 0,
 * //   inspect: 0, intuit: 0, recall: 0, surge: 0
 * // }
 * ```
 */
export function validateSkills(skills: unknown): Skills {
    if (!skills || typeof skills !== 'object' || skills === null) {
        skills = {};
    }
    
    const skillsObj = skills as Record<string, any>;
    const validatedSkills: Partial<Skills> = {};
    const defaultSkills = [
        'debate', 'discern', 'endure', 'finesse', 'force', 'command',
        'charm', 'hide', 'inspect', 'intuit', 'recall', 'surge'
    ] as const;
    
    for (const skillName of defaultSkills) {
        validatedSkills[skillName] = validateNumber(skillsObj[skillName], 0, true);
    }
    
    return validatedSkills as Skills;
}

/**
 * Validates ability data within actor system data
 * 
 * This function validates ability values and modifiers within an actor's
 * system data structure. It handles both 'value' and 'mod' properties
 * for each ability.
 * 
 * @param systemAbilities - The actor's abilities from system data
 * @returns Validated abilities data
 * 
 * @example
 * ```typescript
 * // Actor abilities validation
 * const abilities = validateActorAbilities({
 *     might: { value: 15, mod: 2 },
 *     grace: { value: "12", mod: "1" }
 * });
 * // Result: {
 * //   might: { value: 15, mod: 2 },
 * //   grace: { value: 12, mod: 1 }
 * // }
 * ```
 */
export function validateActorAbilities(systemAbilities: unknown): ValidatedActorAbilities | null | undefined {
    if (systemAbilities === null) {
        return null;
    }
    if (systemAbilities === undefined) {
        return undefined;
    }
    if (!systemAbilities || typeof systemAbilities !== 'object') {
        return {} as ValidatedActorAbilities;
    }
    
    const abilitiesObj = systemAbilities as Record<string, any>;
    const validated: Record<string, any> = {};
    
    for (const [abilityName, abilityData] of Object.entries(abilitiesObj)) {
        if (abilityData && typeof abilityData === 'object') {
            validated[abilityName] = { ...abilityData };
            
            if (abilityData.value !== undefined) {
                validated[abilityName].value = validateNumber(abilityData.value, 10, true);
            }
            if (abilityData.mod !== undefined) {
                validated[abilityName].mod = validateNumber(abilityData.mod, 0, true);
            }
        } else {
            validated[abilityName] = abilityData;
        }
    }
    
    return validated;
}

/**
 * Validates actor skill values
 * 
 * This function validates skill values within an actor's system data.
 * It ensures all skill values are valid numbers, defaulting to 0 for
 * invalid values.
 * 
 * @param systemSkills - The actor's skills from system data
 * @returns Validated skills data
 * 
 * @example
 * ```typescript
 * // Actor skills validation
 * const skills = validateActorSkills({
 *     debate: "3",
 *     force: 2,
 *     invalidSkill: "abc"
 * });
 * // Result: {
 * //   debate: 3,
 * //   force: 2,
 * //   invalidSkill: 0
 * // }
 * ```
 */
export function validateActorSkills(systemSkills: unknown): ValidatedActorSkills | null | undefined {
    if (systemSkills === null) {
        return null;
    }
    if (systemSkills === undefined) {
        return undefined;
    }
    if (!systemSkills || typeof systemSkills !== 'object') {
        return {} as ValidatedActorSkills;
    }
    
    const skillsObj = systemSkills as Record<string, any>;
    const validated: Record<string, any> = {};
    
    for (const [skillName, skillValue] of Object.entries(skillsObj)) {
        if (skillValue !== undefined) {
            validated[skillName] = validateNumber(skillValue, 0, true);
        }
    }
    
    return validated;
}

/**
 * Validates health data structure
 * 
 * This function validates health values including current value,
 * maximum value, and temporary points. All values are validated
 * as positive integers.
 * 
 * @param healthData - The health data to validate
 * @returns Validated health data
 * 
 * @example
 * ```typescript
 * // Health validation
 * const health = validateHealthData({
 *     value: "15",
 *     max: "20",
 *     temp: 5
 * });
 * // Result: {
 * //   value: 15,
 * //   max: 20,
 * //   temp: 5
 * // }
 * ```
 */
export function validateHealthData(healthData: unknown): ValidatedHealthData | null | undefined {
    if (healthData === null) {
        return null;
    }
    if (healthData === undefined) {
        return undefined;
    }
    if (!healthData || typeof healthData !== 'object') {
        return {} as ValidatedHealthData;
    }
    
    const healthObj = healthData as Record<string, any>;
    const validated = { ...healthObj };
    
    if (healthObj.value !== undefined) {
        validated.value = validateNumber(healthObj.value, 20, true);
    }
    if (healthObj.max !== undefined) {
        validated.max = validateNumber(healthObj.max, 20, true);
    }
    if (healthObj.temp !== undefined) {
        validated.temp = validateNumber(healthObj.temp, 0, true);
    }
    
    return validated;
}

/**
 * Validates power points data structure
 * 
 * This function validates power point values including current value
 * and maximum value. Both values are validated as positive integers.
 * 
 * @param powerPointsData - The power points data to validate
 * @returns Validated power points data
 * 
 * @example
 * ```typescript
 * // Power points validation
 * const powerPoints = validatePowerPointsData({
 *     value: "8",
 *     max: "10"
 * });
 * // Result: {
 * //   value: 8,
 * //   max: 10
 * // }
 * ```
 */
export function validatePowerPointsData(powerPointsData: unknown): ValidatedPowerPointsData | null | undefined {
    if (powerPointsData === null) {
        return null;
    }
    if (powerPointsData === undefined) {
        return undefined;
    }
    if (!powerPointsData || typeof powerPointsData !== 'object') {
        return {} as ValidatedPowerPointsData;
    }
    
    const powerObj = powerPointsData as Record<string, any>;
    const validated = { ...powerObj };
    
    if (powerObj.value !== undefined) {
        validated.value = validateNumber(powerObj.value, 10, true);
    }
    if (powerObj.max !== undefined) {
        validated.max = validateNumber(powerObj.max, 10, true);
    }
    
    return validated;
}

/**
 * Validates uses data structure for items
 * 
 * This function validates usage tracking data for items that have
 * limited uses. Both current and maximum uses are validated as
 * non-negative integers.
 * 
 * @param usesData - The uses data to validate
 * @returns Validated uses data
 * 
 * @example
 * ```typescript
 * // Uses validation
 * const uses = validateUsesData({
 *     value: "2",
 *     max: "5"
 * });
 * // Result: {
 * //   value: 2,
 * //   max: 5
 * // }
 * ```
 */
export function validateUsesData(usesData: unknown): ValidatedUsesData | null | undefined {
    if (usesData === null) {
        return null;
    }
    if (usesData === undefined) {
        return undefined;
    }
    if (!usesData || typeof usesData !== 'object') {
        return {} as ValidatedUsesData;
    }
    
    const usesObj = usesData as Record<string, any>;
    const validated = { ...usesObj };
    
    if (usesObj.value !== undefined) {
        validated.value = validateNumber(usesObj.value, 0, true);
    }
    if (usesObj.max !== undefined) {
        validated.max = validateNumber(usesObj.max, 0, true);
    }
    
    return validated;
}

/**
 * Validates FoundryVTT document ID format
 * 
 * This function checks if a string matches the expected format
 * for FoundryVTT document IDs (16 alphanumeric characters).
 * 
 * @param id - The ID to validate
 * @returns True if the ID format is valid
 * 
 * @example
 * ```typescript
 * // Valid ID
 * const valid = isValidDocumentId("a1b2c3d4e5f67890");
 * // Result: true
 * 
 * // Invalid ID
 * const invalid = isValidDocumentId("short");
 * // Result: false
 * ```
 */
export function isValidDocumentId(id: unknown): boolean {
    return typeof id === 'string' && id.length === 16 && /^[a-zA-Z0-9]+$/.test(id);
}

/**
 * Sanitizes HTML content for security
 * 
 * This function removes potentially dangerous HTML content including
 * script tags, javascript: links, and event handlers. This is a basic
 * sanitization suitable for trusted content.
 * 
 * @param html - The HTML content to sanitize
 * @returns Sanitized HTML content
 * 
 * @example
 * ```typescript
 * // Sanitize dangerous content
 * const safe = sanitizeHtml('<p>Safe</p><script>alert("bad")</script>');
 * // Result: '<p>Safe</p>'
 * ```
 */
export function sanitizeHtml(html: unknown): string {
    if (typeof html !== 'string') {
        return '';
    }
    
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href=""')
        .replace(/href\s*=\s*'javascript:[^']*'/gi, 'href=""')
        .replace(/\s*on\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/\s*on\w+\s*=\s*'[^']*'/gi, '')
        .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
} 