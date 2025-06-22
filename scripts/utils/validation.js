/**
 * @fileoverview Validation Utilities for Avant Native System
 * @version 2.0.0
 * @author Avant Development Team
 * @description Provides validation and normalization utilities for actor and item data
 */

import { logger } from './logger.js';
import {
    validateNumber,
    validateString,
    validateActorType,
    validateItemType,
    validateAbilities,
    validateSkills,
    validateActorAbilities,
    validateActorSkills,
    validateHealthData,
    validatePowerPointsData,
    validateUsesData,
    isValidDocumentId,
    sanitizeHtml
} from '../logic/validation-utils.ts';

/**
 * Validation utilities for data normalization and type safety
 * @class ValidationUtils
 * @description Provides static methods for validating and normalizing game data
 * Uses thin wrapper delegation pattern with pure functions for business logic
 */
export class ValidationUtils {
    /**
     * Validate and normalize actor data for creation
     * @static
     * @param {Object} data - The actor data to validate
     * @returns {Object} Validated and normalized actor data
     */
    static validateActorData(data) {
        if (!data || typeof data !== 'object') {
            data = {};
        }
        logger.debug('ValidationUtils | validateActorData called with:', JSON.stringify(data));
        
        // Validate actor type using pure function
        const originalType = data.type;
        data.type = validateActorType(data.type);
        
        if (originalType !== data.type) {
            logger.info(`ValidationUtils | Actor type changed from '${originalType}' to '${data.type}'`);
        }
        
        // Ensure system data exists
        if (!data.system) {
            logger.debug('ValidationUtils | Creating empty system data object');
            data.system = {};
        }
        
        // Validate numeric fields using pure functions
        if (data.system.level !== undefined) {
            data.system.level = validateNumber(data.system.level, 1);
        }
        
        if (data.system.tier !== undefined) {
            data.system.tier = validateNumber(data.system.tier, 1);
        }
        
        if (data.system.effort !== undefined) {
            data.system.effort = validateNumber(data.system.effort, 1);
        }
        
        if (data.system.fortunePoints !== undefined) {
            data.system.fortunePoints = validateNumber(data.system.fortunePoints, 3);
        }
        
        // Validate abilities using pure function
        if (data.system.abilities) {
            data.system.abilities = validateActorAbilities(data.system.abilities);
        }
        
        // Validate skills using pure function
        if (data.system.skills) {
            data.system.skills = validateActorSkills(data.system.skills);
        }
        
        // Validate health using pure function
        if (data.system.health) {
            data.system.health = validateHealthData(data.system.health);
        }
        
        // Validate power points using pure function
        if (data.system.powerPoints) {
            data.system.powerPoints = validatePowerPointsData(data.system.powerPoints);
        }
        
        logger.debug(`ValidationUtils | Actor validation complete - type: ${data.type}`);
        return data;
    }

    /**
     * Validate and normalize item data for creation
     * @static
     * @param {Object} data - The item data to validate
     * @returns {Object} Validated and normalized item data
     */
    static validateItemData(data) {
        if (!data || typeof data !== 'object') {
            data = {};
        }
        logger.debug('ValidationUtils | validateItemData called with:', JSON.stringify(data));
        
        // Validate item type using pure function
        const originalType = data.type;
        data.type = validateItemType(data.type);
        
        if (originalType !== data.type) {
            logger.info(`ValidationUtils | Item type changed from '${originalType}' to '${data.type}'`);
        }
        
        // Ensure system data exists
        if (!data.system) {
            data.system = {};
        }
        
        // Type-specific validation using pure functions
        switch (data.type) {
            case "action":
                if (!data.system.ability) {
                    data.system.ability = "might";
                }
                if (data.system.difficulty !== undefined) {
                    data.system.difficulty = validateNumber(data.system.difficulty, 11);
                }
                if (data.system.powerPointCost !== undefined) {
                    data.system.powerPointCost = validateNumber(data.system.powerPointCost, 0);
                }
                break;
                
            case "feature":
                if (!data.system.category) {
                    data.system.category = "general";
                }
                if (data.system.powerPointCost !== undefined) {
                    data.system.powerPointCost = validateNumber(data.system.powerPointCost, 0);
                }
                break;
                
            case "talent":
                if (data.system.powerPointCost !== undefined) {
                    data.system.powerPointCost = validateNumber(data.system.powerPointCost, 1);
                }
                if (data.system.tier !== undefined) {
                    data.system.tier = validateNumber(data.system.tier, 1);
                }
                break;
                
            case "augment":
                if (!data.system.augmentType) {
                    data.system.augmentType = "enhancement";
                }
                if (data.system.powerPointCost !== undefined) {
                    data.system.powerPointCost = validateNumber(data.system.powerPointCost, 0);
                }
                break;
                
            case "weapon":
                if (!data.system.ability) {
                    data.system.ability = "might";
                }
                if (data.system.modifier !== undefined) {
                    data.system.modifier = validateNumber(data.system.modifier, 0);
                }
                if (!data.system.damageDie) {
                    data.system.damageDie = "1d6";
                }
                if (data.system.threshold !== undefined) {
                    data.system.threshold = validateNumber(data.system.threshold, 11);
                }
                if (data.system.weight !== undefined) {
                    data.system.weight = validateNumber(data.system.weight, 1, false);
                }
                if (data.system.cost !== undefined) {
                    data.system.cost = validateNumber(data.system.cost, 0, false);
                }
                if (data.system.quantity !== undefined) {
                    data.system.quantity = validateNumber(data.system.quantity, 1);
                }
                break;
                
            case "armor":
                if (!data.system.ability) {
                    data.system.ability = "grace";
                }
                if (data.system.modifier !== undefined) {
                    data.system.modifier = validateNumber(data.system.modifier, 0);
                }
                if (data.system.threshold !== undefined) {
                    data.system.threshold = validateNumber(data.system.threshold, 11);
                }
                if (data.system.damageReduction !== undefined) {
                    data.system.damageReduction = validateNumber(data.system.damageReduction, 0);
                }
                if (data.system.weight !== undefined) {
                    data.system.weight = validateNumber(data.system.weight, 5, false);
                }
                if (data.system.cost !== undefined) {
                    data.system.cost = validateNumber(data.system.cost, 0, false);
                }
                if (data.system.quantity !== undefined) {
                    data.system.quantity = validateNumber(data.system.quantity, 1);
                }
                break;
                
            case "gear":
                if (data.system.weight !== undefined) {
                    data.system.weight = validateNumber(data.system.weight, 1, false);
                }
                if (data.system.cost !== undefined) {
                    data.system.cost = validateNumber(data.system.cost, 0, false);
                }
                if (data.system.quantity !== undefined) {
                    data.system.quantity = validateNumber(data.system.quantity, 1);
                }
                break;
        }
        
        // Validate uses using pure function
        if (data.system.uses) {
            data.system.uses = validateUsesData(data.system.uses);
        }
        
        logger.debug(`ValidationUtils | Item validation complete - type: ${data.type}`);
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
        const originalValue = value;
        const result = validateNumber(value, defaultValue, isInteger);
        
        if (originalValue !== result && originalValue !== undefined && originalValue !== null && originalValue !== '') {
            logger.warn(`ValidationUtils | Invalid number value '${originalValue}', using default ${defaultValue}`);
        }
        
        return result;
    }

    /**
     * Validate a string value
     * @static
     * @param {any} value - The value to validate
     * @param {string} defaultValue - The default value if validation fails
     * @returns {string} The validated string
     */
    static validateString(value, defaultValue = '') {
        return validateString(value, defaultValue);
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
                processedData.system.powerPointCost = validateNumber(processedData.system.powerPointCost, 0);
            }
            
            // Convert uses fields using pure function
            if (processedData.system.uses) {
                processedData.system.uses = validateUsesData(processedData.system.uses);
            }
            
            // Handle weapon/armor specific integer fields using pure functions
            if (processedData.system.modifier !== undefined) {
                processedData.system.modifier = validateNumber(processedData.system.modifier, 0);
            }
            if (processedData.system.threshold !== undefined) {
                processedData.system.threshold = validateNumber(processedData.system.threshold, 11);
            }
            if (processedData.system.damageReduction !== undefined) {
                processedData.system.damageReduction = validateNumber(processedData.system.damageReduction, 0);
            }
            if (processedData.system.tier !== undefined) {
                processedData.system.tier = validateNumber(processedData.system.tier, 1);
            }
            if (processedData.system.difficulty !== undefined) {
                processedData.system.difficulty = validateNumber(processedData.system.difficulty, 11);
            }
            if (processedData.system.quantity !== undefined) {
                processedData.system.quantity = validateNumber(processedData.system.quantity, 1);
            }
            
            // Handle numeric fields that should be numbers (not necessarily integers)
            if (processedData.system.weight !== undefined) {
                processedData.system.weight = validateNumber(processedData.system.weight, 0, false);
            }
            if (processedData.system.cost !== undefined) {
                processedData.system.cost = validateNumber(processedData.system.cost, 0, false);
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
        return validateNumber(value, defaultValue, isInteger);
    }

    /**
     * Normalize string values to ensure they are valid strings
     * @static
     * @param {any} value - The value to normalize
     * @param {string} defaultValue - Default value if conversion fails
     * @returns {string} Normalized string value
     */
    static normalizeString(value, defaultValue = "") {
        return validateString(value, defaultValue);
    }

    /**
     * Validate ability modifier values
     * @static
     * @param {Object} abilities - Abilities object to validate
     * @returns {Object} Validated abilities
     */
    static validateAbilities(abilities) {
        return validateAbilities(abilities);
    }

    /**
     * Validate skill values
     * @static
     * @param {Object} skills - Skills object to validate
     * @returns {Object} Validated skills
     */
    static validateSkills(skills) {
        return validateSkills(skills);
    }

    /**
     * Check if a value is a valid FoundryVTT document ID
     * @static
     * @param {string} id - The ID to validate
     * @returns {boolean} True if valid ID format
     */
    static isValidDocumentId(id) {
        return isValidDocumentId(id);
    }

    /**
     * Sanitize HTML content for safety
     * @static
     * @param {string} html - HTML content to sanitize
     * @returns {string} Sanitized HTML
     */
    static sanitizeHtml(html) {
        return sanitizeHtml(html);
    }
} 