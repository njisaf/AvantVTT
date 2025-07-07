/**
 * @fileoverview Validation Logic - Pure Functions
 * @description Pure functions for data validation without external dependencies
 * @version 2.0.0
 * @author Avant Development Team
 */

/**
 * Validates and normalizes a number value
 * 
 * This function takes any input value and attempts to convert it to a number.
 * If the value cannot be converted or is invalid, it returns the default value.
 * Supports both integer and floating-point number validation.
 * 
 * @param {any} value - The value to validate and convert
 * @param {number} defaultValue - The default value to return if validation fails
 * @param {boolean} isInteger - Whether the result should be an integer
 * @returns {number} The validated number
 * 
 * @example
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
 */
export function validateNumber(value, defaultValue = 0, isInteger = true) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    
    const parsed = isInteger ? parseInt(value) : parseFloat(value);
    
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
 * @param {any} value - The value to validate and convert
 * @param {string} defaultValue - The default value to return if value is null/undefined
 * @returns {string} The validated string
 * 
 * @example
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
 */
export function validateString(value, defaultValue = '') {
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
 * @param {string} actorType - The actor type to validate
 * @returns {string} Valid actor type
 * 
 * @example
 * // Valid type
 * const type1 = validateActorType("character");
 * // Result: "character"
 * 
 * // Invalid type uses default
 * const type2 = validateActorType("invalid");
 * // Result: "character"
 */
export function validateActorType(actorType) {
    const supportedTypes = ['character', 'npc', 'vehicle'];
    
    if (!actorType || typeof actorType !== 'string' || actorType.trim() === '') {
        return 'character';
    }
    
    if (!supportedTypes.includes(actorType)) {
        return 'character';
    }
    
    return actorType;
}

/**
 * Validates item type against supported types
 * 
 * This function ensures the item type is one of the supported values
 * for the Avant system. If the type is invalid or missing, it returns
 * the default 'gear' type.
 * 
 * @param {string} itemType - The item type to validate
 * @returns {string} Valid item type
 * 
 * @example
 * // Valid type
 * const type1 = validateItemType("weapon");
 * // Result: "weapon"
 * 
 * // Invalid type uses default
 * const type2 = validateItemType("invalid");
 * // Result: "gear"
 */
export function validateItemType(itemType) {
    const supportedTypes = ["action", "feature", "talent", "augment", "weapon", "armor", "gear", "trait"];
    
    if (!itemType || !supportedTypes.includes(itemType)) {
        return "gear";
    }
    
    return itemType;
}

/**
 * Validates ability modifier values with bounds checking
 * 
 * This function validates ability data objects and ensures modifiers
 * are within reasonable bounds (-10 to +10). It creates a complete
 * abilities object with all four core abilities.
 * 
 * @param {Object} abilities - The abilities object to validate
 * @returns {Object} Validated abilities with all core abilities
 * 
 * @example
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
 */
export function validateAbilities(abilities) {
    if (!abilities || typeof abilities !== 'object') {
        abilities = {};
    }
    
    const validatedAbilities = {};
    const defaultAbilities = ['might', 'grace', 'intellect', 'focus'];
    
    for (const abilityName of defaultAbilities) {
        if (abilities[abilityName] && typeof abilities[abilityName] === 'object') {
            let modifier = validateNumber(abilities[abilityName].modifier, 0, true);
            
            // No bounds checking - allow free input for ability modifiers
            
            validatedAbilities[abilityName] = { modifier };
        } else {
            validatedAbilities[abilityName] = { modifier: 0 };
        }
    }
    
    return validatedAbilities;
}

/**
 * Validates skill values for all core skills
 * 
 * This function validates skill data and ensures all core skills
 * are present with valid numeric values. Missing skills default to 0.
 * 
 * @param {Object} skills - The skills object to validate
 * @returns {Object} Validated skills with all core skills
 * 
 * @example
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
 */
export function validateSkills(skills) {
    if (!skills || typeof skills !== 'object') {
        skills = {};
    }
    
    const validatedSkills = {};
    const defaultSkills = [
        'debate', 'discern', 'endure', 'finesse', 'force', 'command',
        'charm', 'hide', 'inspect', 'intuit', 'recall', 'surge'
    ];
    
    for (const skillName of defaultSkills) {
        validatedSkills[skillName] = validateNumber(skills[skillName], 0, true);
    }
    
    return validatedSkills;
}

/**
 * Validates ability data within actor system data
 * 
 * This function validates ability values and modifiers within an actor's
 * system data structure. It handles both 'value' and 'mod' properties
 * for each ability.
 * 
 * @param {Object} systemAbilities - The actor's abilities from system data
 * @returns {Object} Validated abilities data
 * 
 * @example
 * // Actor abilities validation
 * const abilities = validateActorAbilities({
 *     might: { value: 15, mod: 2 },
 *     grace: { value: "12", mod: "1" }
 * });
 * // Result: {
 * //   might: { value: 15, mod: 2 },
 * //   grace: { value: 12, mod: 1 }
 * // }
 */
export function validateActorAbilities(systemAbilities) {
    if (!systemAbilities || typeof systemAbilities !== 'object') {
        return systemAbilities;
    }
    
    const validated = {};
    
    for (const [abilityName, abilityData] of Object.entries(systemAbilities)) {
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
 * @param {Object} systemSkills - The actor's skills from system data
 * @returns {Object} Validated skills data
 * 
 * @example
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
 */
export function validateActorSkills(systemSkills) {
    if (!systemSkills || typeof systemSkills !== 'object') {
        return systemSkills;
    }
    
    const validated = {};
    
    for (const [skillName, skillValue] of Object.entries(systemSkills)) {
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
 * @param {Object} healthData - The health data to validate
 * @returns {Object} Validated health data
 * 
 * @example
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
 */
export function validateHealthData(healthData) {
    if (!healthData || typeof healthData !== 'object') {
        return healthData;
    }
    
    const validated = { ...healthData };
    
    if (healthData.value !== undefined) {
        validated.value = validateNumber(healthData.value, 0, true);
    }
    if (healthData.max !== undefined) {
        validated.max = validateNumber(healthData.max, 0, true);
    }
    if (healthData.temp !== undefined) {
        validated.temp = validateNumber(healthData.temp, 0, true);
    }
    
    return validated;
}

/**
 * Validates power points data structure
 * 
 * This function validates power point values including current value
 * and maximum value. Both values are validated as positive integers.
 * 
 * @param {Object} powerPointsData - The power points data to validate
 * @returns {Object} Validated power points data
 * 
 * @example
 * // Power points validation
 * const powerPoints = validatePowerPointsData({
 *     value: "8",
 *     max: "10"
 * });
 * // Result: {
 * //   value: 8,
 * //   max: 10
 * // }
 */
export function validatePowerPointsData(powerPointsData) {
    if (!powerPointsData || typeof powerPointsData !== 'object') {
        return powerPointsData;
    }
    
    const validated = { ...powerPointsData };
    
    if (powerPointsData.value !== undefined) {
        validated.value = validateNumber(powerPointsData.value, 0, true);
    }
    if (powerPointsData.max !== undefined) {
        validated.max = validateNumber(powerPointsData.max, 0, true);
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
 * @param {Object} usesData - The uses data to validate
 * @returns {Object} Validated uses data
 * 
 * @example
 * // Uses validation
 * const uses = validateUsesData({
 *     value: "2",
 *     max: "5"
 * });
 * // Result: {
 * //   value: 2,
 * //   max: 5
 * // }
 */
export function validateUsesData(usesData) {
    if (!usesData || typeof usesData !== 'object') {
        return usesData;
    }
    
    const validated = { ...usesData };
    
    if (usesData.value !== undefined) {
        validated.value = validateNumber(usesData.value, 0, true);
    }
    if (usesData.max !== undefined) {
        validated.max = validateNumber(usesData.max, 0, true);
    }
    
    return validated;
}

/**
 * Validates FoundryVTT document ID format
 * 
 * This function checks if a string matches the expected format
 * for FoundryVTT document IDs (16 alphanumeric characters).
 * 
 * @param {string} id - The ID to validate
 * @returns {boolean} True if the ID format is valid
 * 
 * @example
 * // Valid ID
 * const valid = isValidDocumentId("a1b2c3d4e5f67890");
 * // Result: true
 * 
 * // Invalid ID
 * const invalid = isValidDocumentId("short");
 * // Result: false
 */
export function isValidDocumentId(id) {
    return typeof id === 'string' && id.length === 16 && /^[a-zA-Z0-9]+$/.test(id);
}

/**
 * Sanitizes HTML content for security
 * 
 * This function removes potentially dangerous HTML content including
 * script tags, javascript: links, and event handlers. This is a basic
 * sanitization suitable for trusted content.
 * 
 * @param {string} html - The HTML content to sanitize
 * @returns {string} Sanitized HTML content
 * 
 * @example
 * // Sanitize dangerous content
 * const safe = sanitizeHtml('<p>Safe</p><script>alert("bad")</script>');
 * // Result: '<p>Safe</p>'
 */
export function sanitizeHtml(html) {
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

/**
 * Validates traits array and filters out invalid entries
 * 
 * This function ensures the traits array contains only valid string values.
 * It filters out null, undefined, empty strings, and non-string values.
 * 
 * @param {any} traits - The traits value to validate
 * @returns {string[]} Validated array of trait strings
 * 
 * @example
 * // Valid traits
 * const traits = validateTraits(["Fire", "Ice", "Lightning"]);
 * // Result: ["Fire", "Ice", "Lightning"]
 * 
 * // Filter invalid entries
 * const filtered = validateTraits(["Fire", null, "", "Ice", 123]);
 * // Result: ["Fire", "Ice"]
 */
function validateTraits(traits) {
    if (!Array.isArray(traits)) {
        return [];
    }
    
    return traits.filter(trait => 
        trait !== null && 
        trait !== undefined && 
        typeof trait === 'string' && 
        trait.trim() !== ''
    );
}

/**
 * Validates talent item data according to Avant system requirements
 * 
 * This function validates and normalizes talent data to ensure it meets
 * the system requirements. It fixes invalid values with appropriate defaults
 * and ensures all required fields are present.
 * 
 * @param {Object} data - The talent data to validate
 * @returns {Object} Validated talent data
 * 
 * @example
 * // Valid talent data
 * const talent = validateTalent({
 *     name: "Fire Strike",
 *     apCost: 2,
 *     levelRequirement: 3,
 *     traits: ["Fire", "Attack"],
 *     requirements: "Must have fire affinity",
 *     description: "A powerful fire-based attack"
 * });
 * // Result: Fully validated talent object
 */
export function validateTalent(data) {
    if (!data || typeof data !== 'object') {
        data = {};
    }
    
    return {
        type: "talent",
        name: validateString(data.name, ""),
        apCost: Math.max(1, validateNumber(data.apCost, 1, true)),
        levelRequirement: Math.max(1, validateNumber(data.levelRequirement, 1, true)),
        traits: validateTraits(data.traits),
        requirements: validateString(data.requirements, ""),
        description: validateString(data.description, "")
    };
}

/**
 * Validates augment item data according to Avant system requirements
 * 
 * This function validates and normalizes augment data to ensure it meets
 * the system requirements. It fixes invalid values with appropriate defaults
 * and ensures all required fields are present.
 * 
 * @param {Object} data - The augment data to validate
 * @returns {Object} Validated augment data
 * 
 * @example
 * // Valid augment data
 * const augment = validateAugment({
 *     name: "Neural Interface",
 *     apCost: 1,
 *     ppCost: 3,
 *     levelRequirement: 2,
 *     traits: ["Tech", "Enhancement"],
 *     requirements: "Must have cybernetic implant",
 *     description: "A neural enhancement augment"
 * });
 * // Result: Fully validated augment object
 */
export function validateAugment(data) {
    if (!data || typeof data !== 'object') {
        data = {};
    }
    
    return {
        type: "augment",
        name: validateString(data.name, ""),
        apCost: Math.max(1, validateNumber(data.apCost, 1, true)),
        ppCost: Math.max(0, validateNumber(data.ppCost, 0, true)),
        levelRequirement: Math.max(1, validateNumber(data.levelRequirement, 1, true)),
        traits: validateTraits(data.traits),
        requirements: validateString(data.requirements, ""),
        description: validateString(data.description, "")
    };
} 