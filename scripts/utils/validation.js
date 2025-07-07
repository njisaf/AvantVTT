/**
 * @fileoverview Validation Utilities for Avant Native System
 * @version 2.0.0
 * @author Avant Development Team
 * @description Provides validation and normalization utilities for actor and item data
 */

/**
 * Validation utilities for data normalization and type safety
 * @class ValidationUtils
 * @description Provides static methods for validating and normalizing game data
 */
export class ValidationUtils {
    /**
     * Validate and normalize actor data for creation
     * @static
     * @param {Object} data - The actor data to validate
     * @returns {Object} Validated and normalized actor data
     */
    static validateActorData(data) {
        console.log('ValidationUtils | validateActorData called with:', JSON.stringify(data));
        
        // Ensure type is set to a valid value
        if (!data.type || typeof data.type !== 'string' || data.type.trim() === '') {
            console.log('ValidationUtils | Setting default actor type to character');
            data.type = 'character';
        }
        
        // Validate type is supported
        const supportedTypes = ['character', 'npc', 'vehicle'];
        if (!supportedTypes.includes(data.type)) {
            console.log(`ValidationUtils | Invalid actor type '${data.type}', defaulting to character`);
            data.type = 'character';
        }
        
        // Ensure system data exists
        if (!data.system) {
            console.log('ValidationUtils | Creating empty system data object');
            data.system = {};
        }
        
        // Validate numeric fields
        if (data.system.level !== undefined) {
            data.system.level = this.validateNumber(data.system.level, 1);
        }
        
        if (data.system.tier !== undefined) {
            data.system.tier = this.validateNumber(data.system.tier, 1);
        }
        
        if (data.system.effort !== undefined) {
            data.system.effort = this.validateNumber(data.system.effort, 1);
        }
        
        if (data.system.fortunePoints !== undefined) {
            data.system.fortunePoints = this.validateNumber(data.system.fortunePoints, 3);
        }
        
        // Validate abilities
        if (data.system.abilities) {
            for (const [abilityName, abilityData] of Object.entries(data.system.abilities)) {
                if (abilityData && typeof abilityData === 'object') {
                    if (abilityData.value !== undefined) {
                        abilityData.value = this.validateNumber(abilityData.value, 10);
                    }
                    if (abilityData.mod !== undefined) {
                        abilityData.mod = this.validateNumber(abilityData.mod, 0);
                    }
                }
            }
        }
        
        // Validate skills
        if (data.system.skills) {
            for (const [skillName, skillValue] of Object.entries(data.system.skills)) {
                if (skillValue !== undefined) {
                    data.system.skills[skillName] = this.validateNumber(skillValue, 0);
                }
            }
        }
        
        // Validate health
        if (data.system.health) {
            if (data.system.health.value !== undefined) {
                data.system.health.value = this.validateNumber(data.system.health.value, 20);
            }
            if (data.system.health.max !== undefined) {
                data.system.health.max = this.validateNumber(data.system.health.max, 20);
            }
            if (data.system.health.temp !== undefined) {
                data.system.health.temp = this.validateNumber(data.system.health.temp, 0);
            }
        }
        
        // Validate power points
        if (data.system.powerPoints) {
            if (data.system.powerPoints.value !== undefined) {
                data.system.powerPoints.value = this.validateNumber(data.system.powerPoints.value, 10);
            }
            if (data.system.powerPoints.max !== undefined) {
                data.system.powerPoints.max = this.validateNumber(data.system.powerPoints.max, 10);
            }
        }
        
        console.log(`ValidationUtils | Actor validation complete - type: ${data.type}`);
        return data;
    }

    /**
     * Validate and normalize item data for creation
     * @static
     * @param {Object} data - The item data to validate
     * @returns {Object} Validated and normalized item data
     */
    static validateItemData(data) {
        console.log('ValidationUtils | validateItemData called with:', JSON.stringify(data));
        
        // Ensure type exists and is supported
        const supportedItemTypes = ["action", "feature", "talent", "augment", "weapon", "armor", "gear"];
        if (!data.type || !supportedItemTypes.includes(data.type)) {
            console.log(`ValidationUtils | Unsupported item type '${data.type}', defaulting to 'gear'`);
            data.type = "gear";
        }
        
        // Ensure system data exists
        if (!data.system) {
            data.system = {};
        }
        
        // Type-specific validation (use data.type which has been corrected)
        switch (data.type) {
            case "action":
                if (!data.system.ability) {
                    data.system.ability = "might";
                }
                if (data.system.difficulty !== undefined) {
                    data.system.difficulty = this.validateNumber(data.system.difficulty, 11);
                }
                if (data.system.powerPointCost !== undefined) {
                    data.system.powerPointCost = this.validateNumber(data.system.powerPointCost, 0);
                }
                break;
                
            case "feature":
                if (!data.system.category) {
                    data.system.category = "general";
                }
                if (data.system.powerPointCost !== undefined) {
                    data.system.powerPointCost = this.validateNumber(data.system.powerPointCost, 0);
                }
                break;
                
            case "talent":
                if (data.system.powerPointCost !== undefined) {
                    data.system.powerPointCost = this.validateNumber(data.system.powerPointCost, 1);
                }
                if (data.system.tier !== undefined) {
                    data.system.tier = this.validateNumber(data.system.tier, 1);
                }
                break;
                
            case "augment":
                if (!data.system.augmentType) {
                    data.system.augmentType = "enhancement";
                }
                if (data.system.powerPointCost !== undefined) {
                    data.system.powerPointCost = this.validateNumber(data.system.powerPointCost, 0);
                }
                break;
                
            case "weapon":
                if (!data.system.ability) {
                    data.system.ability = "might";
                }
                if (data.system.modifier !== undefined) {
                    data.system.modifier = this.validateNumber(data.system.modifier, 0);
                }
                if (!data.system.damageDie) {
                    data.system.damageDie = "1d6";
                }
                if (data.system.threshold !== undefined) {
                    data.system.threshold = this.validateNumber(data.system.threshold, 11);
                }
                if (data.system.weight !== undefined) {
                    data.system.weight = this.validateNumber(data.system.weight, 1, false);
                }
                if (data.system.cost !== undefined) {
                    data.system.cost = this.validateNumber(data.system.cost, 0, false);
                }
                if (data.system.quantity !== undefined) {
                    data.system.quantity = this.validateNumber(data.system.quantity, 1);
                }
                break;
                
            case "armor":
                if (!data.system.ability) {
                    data.system.ability = "grace";
                }
                if (data.system.modifier !== undefined) {
                    data.system.modifier = this.validateNumber(data.system.modifier, 0);
                }
                if (data.system.threshold !== undefined) {
                    data.system.threshold = this.validateNumber(data.system.threshold, 11);
                }
                if (data.system.damageReduction !== undefined) {
                    data.system.damageReduction = this.validateNumber(data.system.damageReduction, 0);
                }
                if (data.system.weight !== undefined) {
                    data.system.weight = this.validateNumber(data.system.weight, 5, false);
                }
                if (data.system.cost !== undefined) {
                    data.system.cost = this.validateNumber(data.system.cost, 0, false);
                }
                if (data.system.quantity !== undefined) {
                    data.system.quantity = this.validateNumber(data.system.quantity, 1);
                }
                break;
                
            case "gear":
                if (data.system.weight !== undefined) {
                    data.system.weight = this.validateNumber(data.system.weight, 1, false);
                }
                if (data.system.cost !== undefined) {
                    data.system.cost = this.validateNumber(data.system.cost, 0, false);
                }
                if (data.system.quantity !== undefined) {
                    data.system.quantity = this.validateNumber(data.system.quantity, 1);
                }
                break;
        }
        
        // Validate uses for all item types that support it
        if (data.system.uses) {
            if (data.system.uses.value !== undefined) {
                data.system.uses.value = this.validateNumber(data.system.uses.value, 0);
            }
            if (data.system.uses.max !== undefined) {
                data.system.uses.max = this.validateNumber(data.system.uses.max, 0);
            }
        }
        
        console.log(`ValidationUtils | Item validation complete - type: ${data.type}`);
        return data;
    }

    /**
     * Validate a number value
     * @static
     * @param {any} value - The value to validate
     * @param {number} defaultValue - The default value if validation fails
     * @param {boolean} isInteger - Whether the value should be an integer
     * @returns {number} The validated number
     */
    static validateNumber(value, defaultValue = 0, isInteger = true) {
        if (value === undefined || value === null || value === '') {
            return defaultValue;
        }
        
        const parsed = isInteger ? parseInt(value) : parseFloat(value);
        
        if (isNaN(parsed)) {
            console.warn(`ValidationUtils | Invalid number value '${value}', using default ${defaultValue}`);
            return defaultValue;
        }
        
        return parsed;
    }

    /**
     * Validate a string value
     * @static
     * @param {any} value - The value to validate
     * @param {string} defaultValue - The default value if validation fails
     * @returns {string} The validated string
     */
    static validateString(value, defaultValue = '') {
        if (value === undefined || value === null) {
            return defaultValue;
        }
        
        return String(value);
    }

    /**
     * Process form data for item updates
     * @static
     * @param {Object} formData - The form data to process
     * @param {string} itemType - The type of item being updated
     * @returns {Object} The processed form data
     */
    static processFormData(formData, itemType) {
        const processedData = foundry.utils.expandObject(formData);
        
        if (processedData.system) {
            // Convert powerPointCost to integer if present
            if (processedData.system.powerPointCost !== undefined) {
                processedData.system.powerPointCost = this.validateNumber(processedData.system.powerPointCost, 0);
            }
            
            // Convert uses fields to integers if present
            if (processedData.system.uses) {
                if (processedData.system.uses.value !== undefined) {
                    processedData.system.uses.value = this.validateNumber(processedData.system.uses.value, 0);
                }
                if (processedData.system.uses.max !== undefined) {
                    processedData.system.uses.max = this.validateNumber(processedData.system.uses.max, 0);
                }
            }
            
            // Handle weapon/armor specific integer fields
            if (processedData.system.modifier !== undefined) {
                processedData.system.modifier = this.validateNumber(processedData.system.modifier, 0);
            }
            if (processedData.system.threshold !== undefined) {
                processedData.system.threshold = this.validateNumber(processedData.system.threshold, 11);
            }
            if (processedData.system.damageReduction !== undefined) {
                processedData.system.damageReduction = this.validateNumber(processedData.system.damageReduction, 0);
            }
            if (processedData.system.tier !== undefined) {
                processedData.system.tier = this.validateNumber(processedData.system.tier, 1);
            }
            if (processedData.system.difficulty !== undefined) {
                processedData.system.difficulty = this.validateNumber(processedData.system.difficulty, 11);
            }
            if (processedData.system.quantity !== undefined) {
                processedData.system.quantity = this.validateNumber(processedData.system.quantity, 1);
            }
            
            // Handle numeric fields that should be numbers (not necessarily integers)
            if (processedData.system.weight !== undefined) {
                processedData.system.weight = this.validateNumber(processedData.system.weight, 0, false);
            }
            if (processedData.system.cost !== undefined) {
                processedData.system.cost = this.validateNumber(processedData.system.cost, 0, false);
            }
        }
        
        return processedData;
    }

    /**
     * Normalize numeric values to ensure they are valid numbers
     * @static
     * @param {any} value - The value to normalize
     * @param {number} defaultValue - Default value if conversion fails
     * @param {boolean} isInteger - Whether the value should be an integer
     * @returns {number} Normalized numeric value
     */
    static normalizeNumber(value, defaultValue = 0, isInteger = false) {
        let result;
        
        if (isInteger) {
            result = parseInt(value);
        } else {
            result = parseFloat(value);
        }
        
        if (isNaN(result)) {
            return defaultValue;
        }
        
        return result;
    }

    /**
     * Normalize string values to ensure they are valid strings
     * @static
     * @param {any} value - The value to normalize
     * @param {string} defaultValue - Default value if conversion fails
     * @returns {string} Normalized string value
     */
    static normalizeString(value, defaultValue = "") {
        if (typeof value === 'string') {
            return value;
        }
        
        if (value === null || value === undefined) {
            return defaultValue;
        }
        
        return String(value);
    }

    /**
     * Validate ability modifier values
     * @static
     * @param {Object} abilities - Abilities object to validate
     * @returns {Object} Validated abilities
     */
    static validateAbilities(abilities) {
        const validatedAbilities = {};
        const defaultAbilities = ['might', 'grace', 'intellect', 'focus'];
        
        for (const abilityName of defaultAbilities) {
            if (abilities[abilityName]) {
                validatedAbilities[abilityName] = {
                    modifier: this.normalizeNumber(abilities[abilityName].modifier, 0, true)
                };
                
                // Ensure ability modifier is within reasonable bounds (-10 to +10)
                if (validatedAbilities[abilityName].modifier < -10) {
                    validatedAbilities[abilityName].modifier = -10;
                }
                if (validatedAbilities[abilityName].modifier > 10) {
                    validatedAbilities[abilityName].modifier = 10;
                }
            } else {
                validatedAbilities[abilityName] = {
                    modifier: 0
                };
            }
        }
        
        return validatedAbilities;
    }

    /**
     * Validate skill values
     * @static
     * @param {Object} skills - Skills object to validate
     * @returns {Object} Validated skills
     */
    static validateSkills(skills) {
        const validatedSkills = {};
        const defaultSkills = [
            'debate', 'discern', 'endure', 'finesse', 'force', 'command',
            'charm', 'hide', 'inspect', 'intuit', 'recall', 'surge'
        ];
        
        for (const skillName of defaultSkills) {
            validatedSkills[skillName] = this.normalizeNumber(
                skills[skillName], 0, true
            );
        }
        
        return validatedSkills;
    }

    /**
     * Check if a value is a valid FoundryVTT document ID
     * @static
     * @param {string} id - The ID to validate
     * @returns {boolean} True if valid ID format
     */
    static isValidDocumentId(id) {
        return typeof id === 'string' && id.length === 16 && /^[a-zA-Z0-9]+$/.test(id);
    }

    /**
     * Sanitize HTML content for safety
     * @static
     * @param {string} html - HTML content to sanitize
     * @returns {string} Sanitized HTML
     */
    static sanitizeHtml(html) {
        // Basic HTML sanitization - remove script tags and javascript: links
        if (typeof html !== 'string') {
            return '';
        }
        
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    }
} 