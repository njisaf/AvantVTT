/**
 * @fileoverview Actor Sheet Logic - Pure Functions (Simplified)
 * @description Pure functions for actor sheet operations without calculations - user provides all values
 * @version 2.0.0
 * @author Avant Development Team
 */

/**
 * Calculates attribute total modifiers for display
 * 
 * This function combines character level with attribute modifier to show
 * the total modifier used in attribute checks. In the Avant system,
 * attribute checks use 2d10 + Level + Attribute Modifier.
 * 
 * @param {Object} attributes - The character's attributes object (now using modifier field)
 * @param {number} level - The character's level
 * @returns {Object} Object with attribute names as keys and total modifiers as values
 * 
 * @example
 * // Character with level 3 and +2 might modifier
 * const totals = calculateAttributeTotalModifiers(
 *     { might: { modifier: 2 } }, 
 *     3
 * );
 * // Result: { might: 5 } (3 level + 2 modifier = 5)
 */
export function calculateAttributeTotalModifiers(attributes, level) {
    if (!attributes || typeof attributes !== 'object') {
        return {};
    }
    
    const result = {};
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
 * @param {Object} skills - The character's skills object
 * @param {Object} attributes - The character's attributes object (now using modifier field)
 * @param {Object} skillAbilityMap - Mapping of skills to their governing attributes
 * @param {number} level - The character's level
 * @returns {Object} Object with skill names as keys and total modifiers as values
 * 
 * @example
 * // Character with level 2, +1 might modifier, and 3 athletics skill
 * const totals = calculateSkillTotalModifiers(
 *     { athletics: 3 },
 *     { might: { modifier: 1 } },
 *     { athletics: 'might' },
 *     2
 * );
 * // Result: { athletics: 6 } (2 level + 1 attribute + 3 skill = 6)
 */
export function calculateSkillTotalModifiers(skills, attributes, skillAbilityMap, level) {
    if (!skills || !attributes || !skillAbilityMap) {
        return {};
    }
    
    const result = {};
    const characterLevel = Number(level) || 1;
    
    for (const [skillName, attributeName] of Object.entries(skillAbilityMap)) {
        const skillValue = skills[skillName] || 0;
        const attributeMode = attributes[attributeName]?.modifier || 0;
        result[skillName] = characterLevel + attributeMode + skillValue;
    }
    
    return result;
}

/**
 * No longer calculates defense values - returns user-provided values as-is
 * 
 * Defense values are now direct user input. This function is kept for 
 * compatibility but simply returns an empty object since defense threshold
 * is now a direct user input field.
 * 
 * @param {Object} attributes - The character's attributes object (unused)
 * @param {number} tier - The character's tier (unused)
 * @returns {Object} Empty object (no calculations performed)
 * 
 * @deprecated Defense values are now direct user input
 */
export function calculateDefenseValues(attributes, tier) {
    // No longer performs calculations - defense threshold is user input
    return {};
}

/**
 * No longer calculates defense threshold - returns user input
 * 
 * The defense threshold is now a direct user input field rather than
 * a calculated value. This function is kept for compatibility.
 * 
 * @param {Object} defenseValues - Unused parameter (kept for compatibility)
 * @returns {number} Returns 0 (no calculation performed)
 * 
 * @deprecated Defense threshold is now direct user input
 */
export function calculateDefenseThreshold(defenseValues) {
    // No longer performs calculations - defense threshold is user input
    return 0;
}

/**
 * No longer calculates remaining expertise points - returns user input
 * 
 * Remaining expertise points are now a direct user input field rather than
 * a calculated value. This function is kept for compatibility.
 * 
 * @param {number} totalPoints - Unused parameter (kept for compatibility)
 * @param {number} spentPoints - Unused parameter (kept for compatibility)
 * @returns {number} Returns 0 (no calculation performed)
 * 
 * @deprecated Remaining expertise points are now direct user input
 */
export function calculateRemainingExpertisePoints(totalPoints, spentPoints) {
    // No longer performs calculations - remaining points are user input
    return 0;
}

/**
 * Calculates power point spending limit
 * 
 * In the Avant system, characters can only spend a limited number of
 * power points at once, calculated as max power points divided by 3
 * (minimum 1 point). This calculation is preserved as it's still needed
 * for game mechanics.
 * 
 * @param {number} maxPowerPoints - Maximum power points the character has
 * @returns {number} Maximum power points that can be spent at once
 * 
 * @example
 * // Character with 10 max power points
 * const limit = calculatePowerPointLimit(10);
 * // Result: 3 (10 / 3 = 3.33, floored to 3)
 * 
 * // Character with 2 max power points
 * const limitLow = calculatePowerPointLimit(2);
 * // Result: 1 (minimum is always 1)
 */
export function calculatePowerPointLimit(maxPowerPoints) {
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
 * @param {Object} skills - The character's skills object
 * @param {Object} attributes - The character's attributes object (modifier field only)
 * @param {Object} skillAbilityMap - Mapping of skills to their governing attributes
 * @param {number} level - The character's level
 * @returns {Object} Object with attribute names as keys and arrays of skill objects as values
 * 
 * @example
 * // Organizing skills by attribute
 * const organized = organizeSkillsByAbility(
 *     { athletics: 2, stealth: 1 },
 *     { might: { modifier: 1 }, agility: { modifier: 2 } },
 *     { athletics: 'might', stealth: 'agility' },
 *     3
 * );
 * // Result: {
 * //   might: [{ name: 'athletics', label: 'Athletics', value: 2, totalModifier: 6 }],
 * //   agility: [{ name: 'stealth', label: 'Stealth', value: 1, totalModifier: 6 }]
 * // }
 */
export function organizeSkillsByAbility(skills, attributes, skillAbilityMap, level) {
    if (!skills || !attributes || !skillAbilityMap) {
        return {};
    }
    
    const result = {};
    const characterLevel = Number(level) || 1;
    
    // Initialize arrays for each attribute
    for (const attributeName of Object.keys(attributes)) {
        result[attributeName] = [];
    }
    
    // Organize skills into attribute groups
    for (const [skillName, attributeName] of Object.entries(skillAbilityMap)) {
        if (!result[attributeName]) {
            result[attributeName] = [];
        }
        
        const skillValue = skills[skillName] || 0;
        const attributeMode = attributes[attributeName]?.modifier || 0;
        
        result[attributeName].push({
            name: skillName,
            label: skillName.charAt(0).toUpperCase() + skillName.slice(1),
            value: skillValue,
            totalModifier: characterLevel + attributeMode + skillValue
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
 * @param {Array} items - Array of item objects
 * @returns {Object} Object with item types as keys and arrays of items as values
 * 
 * @example
 * // Organizing mixed items
 * const organized = organizeItemsByType([
 *     { type: 'weapon', name: 'Sword' },
 *     { type: 'armor', name: 'Leather Armor' },
 *     { type: 'gear', name: 'Rope' },
 *     { type: 'talent', name: 'Fireball' },
 *     { type: 'augment', name: 'Enhanced Vision' },
 *     { type: 'feature', name: 'Natural Armor' }
 * ]);
 * // Result: {
 * //   weapon: [{ type: 'weapon', name: 'Sword' }],
 * //   armor: [{ type: 'armor', name: 'Leather Armor' }],
 * //   gear: [{ type: 'gear', name: 'Rope' }],
 * //   talent: [{ type: 'talent', name: 'Fireball' }],
 * //   augment: [{ type: 'augment', name: 'Enhanced Vision' }],
 * //   feature: [{ type: 'feature', name: 'Natural Armor' }],
 * //   action: [],
 * //   other: []
 * // }
 */
export function organizeItemsByType(items) {
    const result = {
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
        if (result[itemType]) {
            result[itemType].push(item);
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
 * @param {string} attributeName - Name of the attribute to roll
 * @param {Object} attributeData - The attribute's data object (with modifier field)
 * @param {number} level - Character level
 * @returns {Object} Object with valid boolean and error message, plus roll data if valid
 * 
 * @example
 * // Valid attribute roll
 * const result = validateAbilityRollData('might', { modifier: 2 }, 3);
 * // Result: { valid: true, level: 3, attributeMode: 2 }
 * 
 * // Invalid attribute roll (missing data)
 * const invalid = validateAbilityRollData('missing', null, 3);
 * // Result: { valid: false, error: "Invalid attribute data" }
 */
export function validateAbilityRollData(attributeName, attributeData, level) {
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
    
    const attributeMode = Number(attributeData.modifier) || 0;
    
    return { 
        valid: true, 
        level: characterLevel,
        attributeMode: attributeMode
    };
}

/**
 * Validates skill roll data
 * 
 * This function checks if the provided data is sufficient to perform
 * a skill roll in the Avant system. Now works with simplified
 * attribute structure (modifier field only).
 * 
 * @param {string} skillName - Name of the skill to roll
 * @param {number} skillValue - The skill's value
 * @param {Object} attributeData - The governing attribute's data object (with modifier field)
 * @param {number} level - Character level
 * @returns {Object} Object with valid boolean and error message, plus roll data if valid
 * 
 * @example
 * // Valid skill roll
 * const result = validateSkillRollData('athletics', 3, { modifier: 1 }, 2);
 * // Result: { valid: true, level: 2, attributeMode: 1, skillMod: 3 }
 */
export function validateSkillRollData(skillName, skillValue, attributeData, level) {
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
    
    const attributeMode = Number(attributeData.modifier) || 0;
    
    return { 
        valid: true, 
        level: characterLevel,
        attributeMode: attributeMode,
        skillMod: skillMod
    };
} 