/**
 * @fileoverview Avant Native System - Main System File
 * @version 2.0.0
 * @author Avant Development Team
 * @description Main entry point for the Avant Native FoundryVTT system with v12/v13 compatibility
 */

// Core imports - Component-based architecture
import { CompatibilityUtils } from './utils/compatibility.js';
import { ValidationUtils } from './utils/validation.js';

// Logic utilities
import { registerSheets, setupConfigDebug, setupDataModels } from './logic/avant-init-utils.js';

// Data models
import { AvantActorData } from './data/actor-data.js';
import { AvantActionData, AvantFeatureData, AvantTalentData, AvantAugmentData, AvantWeaponData, AvantArmorData, AvantGearData } from './data/item-data.js';

// Sheet classes
import { AvantActorSheet } from './sheets/actor-sheet.js';
import { AvantItemSheet } from './sheets/item-sheet.js';

// Dialog classes
import { AvantRerollDialog } from './dialogs/reroll-dialog.js';

// Chat functionality
import { AvantChatContextMenu } from './chat/context-menu.js';

// Theme manager
import { AvantThemeManager } from './themes/theme-manager.js';

console.log("Avant | Loading Avant Native System...");
CompatibilityUtils.log("System initialization started");

/**
 * Initialize the Avant Native system
 * This is the main entry point for system setup
 */
Hooks.once('init', async function() {
    console.log('Avant | Initializing Avant Native system');
    
    try {
        // Initialize theme manager - register settings first
        AvantThemeManager.registerSettings();
        CompatibilityUtils.log("Theme manager settings registered");
        
        // Configure data models for the system
        const actors = CompatibilityUtils.getActorsCollection();
        const items = CompatibilityUtils.getItemsCollection();
        
        // Setup data models using extracted utility
        const dataModelResult = setupDataModels(
            CONFIG,
            AvantActor,
            AvantItem,
            {
                character: AvantActorData,
                npc: AvantActorData,
                vehicle: AvantActorData
            },
            {
                action: AvantActionData,
                feature: AvantFeatureData,
                talent: AvantTalentData,
                augment: AvantAugmentData,
                weapon: AvantWeaponData,
                armor: AvantArmorData,
                gear: AvantGearData
            }
        );
        
        if (!dataModelResult.success) {
            throw new Error(`Data model setup failed: ${dataModelResult.error}`);
        }
        
        // Register sheet application classes using extracted utility
        const sheetResult = registerSheets(actors, items, AvantActorSheet, AvantItemSheet);
        
        if (!sheetResult.success) {
            throw new Error(`Sheet registration failed: ${sheetResult.error}`);
        }
        
        CompatibilityUtils.log("Data models and sheets registered");
        
        // Preload Handlebars templates
        const loadTemplates = CompatibilityUtils.getLoadTemplatesFunction();
        await loadTemplates([
            "systems/avant/templates/actor-sheet.html",
            "systems/avant/templates/item-sheet.html",
            "systems/avant/templates/reroll-dialog.html",
            "systems/avant/templates/item/item-action-sheet.html",
            "systems/avant/templates/item/item-feature-sheet.html",
            "systems/avant/templates/item/item-talent-sheet.html",
            "systems/avant/templates/item/item-augment-sheet.html",
            "systems/avant/templates/item/item-weapon-sheet.html",
            "systems/avant/templates/item/item-armor-sheet.html",
            "systems/avant/templates/item/item-gear-sheet.html"
        ]);
        
        CompatibilityUtils.log("Templates preloaded");
        
        console.log('Avant | System initialization complete');
        
    } catch (error) {
        console.error('Avant | Error during system initialization:', error);
        CompatibilityUtils.log(`System initialization failed: ${error.message}`, 'error');
    }
});

/**
 * Once the entire VTT framework is initialized, set up additional features
 */
Hooks.once('ready', async function() {
    console.log('Avant | System ready - setting up additional features');
    
    try {
        // Initialize chat context menu for Fortune Point rerolls
        AvantChatContextMenu.addContextMenuListeners();
        CompatibilityUtils.log("Chat context menu initialized");
        
        // Create and initialize theme manager instance
        if (!game.avant) game.avant = {};
        game.avant.themeManager = new AvantThemeManager();
        await game.avant.themeManager.init();
        CompatibilityUtils.log("Theme manager instance created and initialized");
        
        console.log('Avant | System ready and fully configured');
        
    } catch (error) {
        console.error('Avant | Error during ready setup:', error);
        CompatibilityUtils.log(`Ready setup failed: ${error.message}`, 'error');
    }
});

/**
 * Extended Actor class for Avant Native
 * @extends {Actor}
 */
class AvantActor extends Actor {
    /**
     * Prepare actor data
     * Calculate derived values and ensure data consistency
     * @override
     */
    prepareData() {
        super.prepareData();
        
        // Validate actor data
        this.system = ValidationUtils.validateActorData(this.system);
    }
    
    /**
     * Prepare derived data
     * Called after base data preparation
     * @override
     */
    prepareDerivedData() {
        super.prepareDerivedData();
        
        // Call the data model's prepare derived data if it exists
        if (this.system && typeof this.system.prepareDerivedData === 'function') {
            this.system.prepareDerivedData();
        }
    }
    
    /**
     * Get roll data for this actor
     * @returns {Object} Roll data for use in roll formulas
     * @override
     */
    getRollData() {
        const data = super.getRollData();
        
        // Add commonly used roll data
        if (this.system.abilities) {
            for (const [abilityName, abilityData] of Object.entries(this.system.abilities)) {
                data[abilityName] = abilityData.modifier;
                data[`${abilityName}Mod`] = abilityData.modifier;
            }
        }
        
        if (this.system.skills) {
            for (const [skillName, skillValue] of Object.entries(this.system.skills)) {
                data[skillName] = skillValue;
            }
        }
        
        data.level = this.system.level || 1;
        data.tier = this.system.tier || 1;
        data.effort = this.system.effort || 1;
        
        return data;
    }
}

/**
 * Extended Item class for Avant Native
 * @extends {Item}
 */
class AvantItem extends Item {
    /**
     * Prepare item data
     * Validate and normalize item data
     * @override
     */
    prepareData() {
        super.prepareData();
        
        // Validate item data
        this.system = ValidationUtils.validateItemData(this.system);
    }
    
    /**
     * Get roll data for this item
     * @returns {Object} Roll data for use in roll formulas
     * @override
     */
    getRollData() {
        const data = super.getRollData();
        
        // Add actor data if this item is owned
        if (this.actor) {
            const actorData = this.actor.getRollData();
            Object.assign(data, actorData);
        }
        
        return data;
    }
    
    /**
     * Handle item rolls
     * @returns {Promise<Roll|void>} The executed roll or void
     */
    async roll() {
        // Default item roll behavior
        const roll = new Roll("1d20", this.getRollData());
        await roll.evaluate();
        
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: `${this.name} Roll`,
            rollMode: game.settings.get('core', 'rollMode'),
        });
        
        return roll;
    }
}

// Expose classes globally for console access and module compatibility
globalThis.AvantActorData = AvantActorData;
globalThis.AvantActionData = AvantActionData;
globalThis.AvantFeatureData = AvantFeatureData;
globalThis.AvantTalentData = AvantTalentData;
globalThis.AvantAugmentData = AvantAugmentData;
globalThis.AvantWeaponData = AvantWeaponData;
globalThis.AvantArmorData = AvantArmorData;
globalThis.AvantGearData = AvantGearData;
globalThis.AvantActorSheet = AvantActorSheet;
globalThis.AvantItemSheet = AvantItemSheet;
globalThis.AvantRerollDialog = AvantRerollDialog;
globalThis.AvantChatContextMenu = AvantChatContextMenu;
globalThis.AvantThemeManager = AvantThemeManager;
globalThis.CompatibilityUtils = CompatibilityUtils;
globalThis.ValidationUtils = ValidationUtils;

console.log("Avant | System loaded successfully - all components imported and configured");
CompatibilityUtils.log("System load complete - ready for use");