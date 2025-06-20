/**
 * @fileoverview Avant System Initialization Utilities - Pure Functions
 * @version 2.0.0
 * @author Avant Development Team
 * @description Pure functions for system initialization without FoundryVTT dependencies
 */

import { CompatibilityUtils } from '../utils/compatibility.js';

/**
 * Registers actor and item sheet classes with the FoundryVTT system.
 * This function handles the unregistration of core sheets and registration
 * of custom Avant system sheets as defaults.
 * 
 * @param {Object} actorCollection - The actor collection from FoundryVTT
 * @param {Object} itemCollection - The item collection from FoundryVTT  
 * @param {Class} actorSheetClass - The actor sheet class to register
 * @param {Class} itemSheetClass - The item sheet class to register
 * @returns {Object} Registration result with success status and counts
 */
export function registerSheets(actorCollection, itemCollection, actorSheetClass, itemSheetClass) {
    if (!actorCollection || !itemCollection) {
        throw new Error('Actor and item collections are required for sheet registration');
    }
    
    if (!actorSheetClass || !itemSheetClass) {
        throw new Error('Actor and item sheet classes are required for registration');
    }
    
    let registeredSheets = 0;
    
    try {
        // Unregister core actor sheet and register custom one
        const coreActorSheet = CompatibilityUtils.getActorSheetClass();
        actorCollection.unregisterSheet("core", coreActorSheet);
        actorCollection.registerSheet("avant", actorSheetClass, { makeDefault: true });
        registeredSheets++;
        
        // Unregister core item sheet and register custom one  
        const coreItemSheet = CompatibilityUtils.getItemSheetClass();
        itemCollection.unregisterSheet("core", coreItemSheet);
        itemCollection.registerSheet("avant", itemSheetClass, { makeDefault: true });
        registeredSheets++;
        
        return {
            success: true,
            registeredSheets,
            message: `Successfully registered ${registeredSheets} sheet types`
        };
        
    } catch (error) {
        return {
            success: false,
            registeredSheets,
            error: error.message,
            message: `Failed to register sheets: ${error.message}`
        };
    }
}

/**
 * Sets up CONFIG debug settings for the Avant system.
 * This function configures debugging flags and logging levels
 * based on system requirements and environment settings.
 * 
 * @param {Object} config - The CONFIG object from FoundryVTT
 * @param {Object} options - Debug configuration options
 * @param {boolean} options.enableDebug - Whether to enable debug mode
 * @param {string} options.logLevel - Logging level ('info', 'warn', 'error', 'debug')
 * @param {boolean} options.enableTiming - Whether to enable performance timing
 * @returns {Object} Configuration result with applied settings
 */
export function setupConfigDebug(config, options = {}) {
    if (!config) {
        throw new Error('CONFIG object is required for debug setup');
    }
    
    const {
        enableDebug = false,
        logLevel = 'info',
        enableTiming = false
    } = options;
    
    const appliedSettings = {};
    
    try {
        // Set debug flag if specified
        if (typeof enableDebug === 'boolean') {
            config.debug = enableDebug;
            appliedSettings.debug = enableDebug;
        }
        
        // Configure logging level
        if (['debug', 'info', 'warn', 'error'].includes(logLevel)) {
            config.logLevel = logLevel;
            appliedSettings.logLevel = logLevel;
        }
        
        // Set performance timing flag
        if (typeof enableTiming === 'boolean') {
            config.time = enableTiming;
            appliedSettings.timing = enableTiming;
        }
        
        // Set Avant-specific debug flags
        if (!config.AVANT) config.AVANT = {};
        config.AVANT.debug = enableDebug;
        config.AVANT.logLevel = logLevel;
        appliedSettings.avantDebug = enableDebug;
        
        return {
            success: true,
            appliedSettings,
            message: `Debug configuration applied successfully`
        };
        
    } catch (error) {
        return {
            success: false,
            appliedSettings,
            error: error.message,
            message: `Failed to setup debug configuration: ${error.message}`
        };
    }
}

/**
 * Configures data models for actors and items in the system.
 * This function sets up the document classes and data model mappings
 * required for the Avant system to function properly.
 * 
 * @param {Object} config - The CONFIG object from FoundryVTT
 * @param {Class} actorClass - The custom actor document class
 * @param {Class} itemClass - The custom item document class
 * @param {Object} actorModels - Map of actor type to data model class
 * @param {Object} itemModels - Map of item type to data model class
 * @returns {Object} Configuration result with model counts
 */
export function setupDataModels(config, actorClass, itemClass, actorModels = {}, itemModels = {}) {
    if (!config) {
        throw new Error('CONFIG object is required for data model setup');
    }
    
    let configuredModels = 0;
    
    try {
        // Configure actor document class and data models
        if (actorClass) {
            config.Actor.documentClass = actorClass;
            configuredModels++;
        }
        
        if (Object.keys(actorModels).length > 0) {
            config.Actor.dataModels = { ...actorModels };
            configuredModels += Object.keys(actorModels).length;
        }
        
        // Configure item document class and data models
        if (itemClass) {
            config.Item.documentClass = itemClass;
            configuredModels++;
        }
        
        if (Object.keys(itemModels).length > 0) {
            config.Item.dataModels = { ...itemModels };
            configuredModels += Object.keys(itemModels).length;
        }
        
        return {
            success: true,
            configuredModels,
            actorTypes: Object.keys(actorModels),
            itemTypes: Object.keys(itemModels),
            message: `Successfully configured ${configuredModels} data models`
        };
        
    } catch (error) {
        return {
            success: false,
            configuredModels,
            error: error.message,
            message: `Failed to setup data models: ${error.message}`
        };
    }
} 