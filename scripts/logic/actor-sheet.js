/**
 * @fileoverview Actor Sheet Logic - Pure Functions
 * @description Pure functions for actor sheet operations without FoundryVTT dependencies
 * @version 2.0.0
 * @author Avant Development Team
 */

/**
 * Calculates ability total modifiers for display
 * 
 * This function combines character level with ability modifier to show
 * the total modifier used in ability checks. In the Avant system,
 * ability checks use 2d10 + Level + Ability Modifier.
 * 
 * @param {Object} abilities - The character's abilities object
 * @param {number} level - The character's level
 * @returns {Object} Object with ability names as keys and total modifiers as values
 * 
 * @example
 * // Character with level 3 and +2 might modifier
 * const totals = calculateAbilityTotalModifiers(
 *     { might: { modifier: 2 } }, 
 *     3
 * );
 * // Result: { might: 5 } (3 level + 2 modifier = 5)
 */
export function calculateAbilityTotalModifiers(abilities, level) {
    if (!abilities || typeof abilities !== 'object') {
        return {};
    }
    
    const result = {};
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
 * @param {Object} skills - The character's skills object
 * @param {Object} abilities - The character's abilities object  
 * @param {Object} skillAbilityMap - Mapping of skills to their governing abilities
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
 * // Result: { athletics: 6 } (2 level + 1 ability + 3 skill = 6)
 */
export function calculateSkillTotalModifiers(skills, abilities, skillAbilityMap, level) {
    if (!skills || !abilities || !skillAbilityMap) {
        return {};
    }
    
    const result = {};
    const characterLevel = Number(level) || 1;
    
    for (const [skillName, abilityName] of Object.entries(skillAbilityMap)) {
        const skillValue = skills[skillName] || 0;
        const abilityMod = abilities[abilityName]?.modifier || 0;
        result[skillName] = characterLevel + abilityMod + skillValue;
    }
    
    return result;
}

/**
 * Calculates defense values for all abilities
 * 
 * In the Avant system, each ability has a defense value calculated as
 * Base 11 + Tier + Ability Modifier. This represents how hard it is
 * to affect the character through that particular ability.
 * 
 * @param {Object} abilities - The character's abilities object
 * @param {number} tier - The character's tier (default 1)
 * @returns {Object} Object with ability names as keys and defense values as values
 * 
 * @example
 * // Character with tier 2 and +3 might modifier
 * const defenses = calculateDefenseValues(
 *     { might: { modifier: 3 } },
 *     2
 * );
 * // Result: { might: 16 } (11 base + 2 tier + 3 modifier = 16)
 */
export function calculateDefenseValues(abilities, tier) {
    if (!abilities || typeof abilities !== 'object') {
        return {};
    }
    
    const result = {};
    const characterTier = Number(tier) || 1;
    const baseDefense = 11;
    
    for (const [abilityName, abilityData] of Object.entries(abilities)) {
        const abilityMod = abilityData?.modifier || 0;
        result[abilityName] = baseDefense + characterTier + abilityMod;
    }
    
    return result;
}

/**
 * Finds the highest defense value (defense threshold)
 * 
 * The defense threshold is the highest defense value among all abilities.
 * This is used in some game mechanics where you need to beat the character's
 * best defense.
 * 
 * @param {Object} defenseValues - Object with defense values for each ability
 * @returns {number} The highest defense value, or 10 if no valid defenses
 * 
 * @example
 * // Character with varying defense values
 * const threshold = calculateDefenseThreshold({
 *     might: 15, intellect: 12, personality: 18
 * });
 * // Result: 18 (highest defense)
 */
export function calculateDefenseThreshold(defenseValues) {
    if (!defenseValues || typeof defenseValues !== 'object') {
        return 10;
    }
    
    const validDefenses = Object.values(defenseValues)
        .filter(val => typeof val === 'number' && !isNaN(val));
    
    return validDefenses.length > 0 ? Math.max(...validDefenses) : 10;
}

/**
 * Calculates remaining expertise points
 * 
 * This function determines how many expertise points a character has left
 * to spend. The result can be negative if the character has overspent.
 * 
 * @param {number} totalPoints - Total expertise points available
 * @param {number} spentPoints - Expertise points already spent
 * @returns {number} Remaining expertise points (can be negative)
 * 
 * @example
 * // Character with 15 total points and 12 spent
 * const remaining = calculateRemainingExpertisePoints(15, 12);
 * // Result: 3 (15 - 12 = 3 points left)
 */
export function calculateRemainingExpertisePoints(totalPoints, spentPoints) {
    const total = Number(totalPoints) || 0;
    const spent = Number(spentPoints) || 0;
    return total - spent;
}

/**
 * Calculates power point spending limit
 * 
 * In the Avant system, characters can only spend a limited number of
 * power points at once, calculated as max power points divided by 3
 * (minimum 1 point).
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
 * Organizes skills by their governing abilities for display
 * 
 * This function takes the raw skills data and organizes it into groups
 * based on which ability governs each skill. This makes it easier to
 * display skills in organized sections on the character sheet.
 * 
 * @param {Object} skills - The character's skills object
 * @param {Object} abilities - The character's abilities object
 * @param {Object} skillAbilityMap - Mapping of skills to their governing abilities
 * @param {number} level - The character's level
 * @returns {Object} Object with ability names as keys and arrays of skill objects as values
 * 
 * @example
 * // Organizing skills by ability
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
export function organizeSkillsByAbility(skills, abilities, skillAbilityMap, level) {
    if (!skills || !abilities || !skillAbilityMap) {
        return {};
    }
    
    const result = {};
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
        
        const skillValue = skills[skillName] || 0;
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
 * @param {Array} items - Array of item objects
 * @returns {Object} Object with item types as keys and arrays of items as values
 * 
 * @example
 * // Organizing mixed items
 * const organized = organizeItemsByType([
 *     { type: 'weapon', name: 'Sword' },
 *     { type: 'action', name: 'Fireball' },
 *     { type: 'weapon', name: 'Bow' }
 * ]);
 * // Result: {
 * //   weapon: [{ type: 'weapon', name: 'Sword' }, { type: 'weapon', name: 'Bow' }],
 * //   action: [{ type: 'action', name: 'Fireball' }],
 * //   talent: [],
 * //   other: []
 * // }
 */
export function organizeItemsByType(items) {
    const result = {
        action: [],
        weapon: [],
        talent: [],
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
 * Validates ability roll data
 * 
 * This function checks if the provided data is sufficient to perform
 * an ability roll in the Avant system.
 * 
 * @param {string} abilityName - Name of the ability to roll
 * @param {Object} abilityData - The ability's data object
 * @param {number} level - Character level
 * @returns {boolean} True if roll data is valid, false otherwise
 * 
 * @example
 * // Valid ability roll
 * const valid = validateAbilityRollData('might', { modifier: 2 }, 3);
 * // Result: true
 * 
 * // Invalid ability roll (missing data)
 * const invalid = validateAbilityRollData('missing', null, 3);
 * // Result: false
 */
export function validateAbilityRollData(abilityName, abilityData, level) {
    if (!abilityName || typeof abilityName !== 'string') {
        return false;
    }
    
    if (!abilityData || typeof abilityData !== 'object') {
        return false;
    }
    
    if (!level || typeof level !== 'number' || level < 1) {
        return false;
    }
    
    return true;
}

/**
 * Validates skill roll data
 * 
 * This function checks if the provided data is sufficient to perform
 * a skill roll in the Avant system.
 * 
 * @param {string} skillName - Name of the skill to roll
 * @param {number} skillValue - The skill's value
 * @param {Object} abilityData - The governing ability's data object
 * @param {number} level - Character level
 * @returns {boolean} True if roll data is valid, false otherwise
 * 
 * @example
 * // Valid skill roll
 * const valid = validateSkillRollData('athletics', 3, { modifier: 1 }, 2);
 * // Result: true
 */
export function validateSkillRollData(skillName, skillValue, abilityData, level) {
    if (!skillName || typeof skillName !== 'string') {
        return false;
    }
    
    if (skillValue === undefined || isNaN(Number(skillValue))) {
        return false;
    }
    
    if (!abilityData || typeof abilityData !== 'object') {
        return false;
    }
    
    if (!level || typeof level !== 'number' || level < 1) {
        return false;
    }
    
    return true;
} 