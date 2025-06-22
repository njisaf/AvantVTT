/**
 * @fileoverview Avant Native System - Main System File
 * @version 2.0.0 - FoundryVTT v13+ Only
 * @author Avant Development Team
 * @description Main entry point for the Avant Native FoundryVTT system for v13-only implementation
 */

// FoundryVTT Types from our local library
import type { Actor, Item, ActorData, ItemData } from './types/foundry/index';
import type { HooksInterface } from './types/foundry/ui';

// Core imports - Component-based architecture
import { ValidationUtils } from './utils/validation.js';

// Logic utilities
import { registerSheets, setupConfigDebug, setupDataModels } from './logic/avant-init-utils.js';

// Data models
import { AvantActorData } from './data/actor-data.js';
import { AvantActionData, AvantFeatureData, AvantTalentData, AvantAugmentData, AvantWeaponData, AvantArmorData, AvantGearData } from './data/item-data.js';

// Sheet classes
import { AvantActorSheet } from './sheets/actor-sheet.ts';
import { AvantItemSheet } from './sheets/item-sheet.ts';

// Dialog classes
import { AvantRerollDialog } from './dialogs/reroll-dialog.js';

// Chat functionality
import { AvantChatContextMenu } from './chat/context-menu.ts';

// Theme manager
import { AvantThemeManager } from './themes/theme-manager.js';

// Initialization manager
import { InitializationManager, FoundryInitializationHelper } from './utils/initialization-manager.js';

// Extend global types for FoundryVTT (avoiding redeclaration)
declare global {
  interface Window {
    Hooks: HooksInterface;
    game: any; // Will be properly typed as we extend coverage
    ui: any;   // Will be properly typed as we extend coverage
    foundry: any; // Will be properly typed as we extend coverage
    CONFIG: any;  // Will be properly typed as we extend coverage
    ChatMessage: any; // Will be properly typed as we extend coverage
    Roll: any; // Will be properly typed as we extend coverage
    Actor: any; // FoundryVTT Actor class
    Item: any;  // FoundryVTT Item class
  }
}

// Access globals safely
const { Hooks, game, ui, foundry, CONFIG, ChatMessage, Roll } = globalThis as any;

console.log("Avant | Loading Avant Native System...");

/**
 * System initialization options interface
 */
interface AvantSystemInitOptions {
  /** Actor collections reference */
  actors: any;
  /** Items collections reference */  
  items: any;
  /** Actor data model configurations */
  actorDataModels: Record<string, any>;
  /** Item data model configurations */
  itemDataModels: Record<string, any>;
}

/**
 * Result interface for utility functions
 */
interface UtilityResult {
  success: boolean;
  error?: string;
}

/**
 * Initialize the Avant Native system
 * This is the main entry point for system setup using robust initialization manager
 */
Hooks.once('init', async function(): Promise<void> {
    console.log('Avant | Initializing Avant Native system with robust initialization manager');
    
    try {
        // Initialize theme manager settings first (still needs to be done early)
        AvantThemeManager.registerSettings();
        console.log("Avant | Theme manager settings registered");
        
        // Get initialization manager and register all services
        const initManager = InitializationManager.getInstance();
        
        // Register all FoundryVTT services with proper dependencies
        FoundryInitializationHelper.registerFoundryServices(initManager);
        
        // Register additional services specific to our system
        initManager.registerService('dataModelsExecution', async () => {
            const actors = foundry.documents.collections.Actors;
            const items = foundry.documents.collections.Items;
            
            const initOptions: AvantSystemInitOptions = {
                actors,
                items,
                actorDataModels: {
                    character: AvantActorData,
                    npc: AvantActorData,
                    vehicle: AvantActorData
                },
                itemDataModels: {
                    action: AvantActionData,
                    feature: AvantFeatureData,
                    talent: AvantTalentData,
                    augment: AvantAugmentData,
                    weapon: AvantWeaponData,
                    armor: AvantArmorData,
                    gear: AvantGearData
                }
            };
            
            const dataModelResult = setupDataModels(
                CONFIG,
                AvantActor,
                AvantItem,
                initOptions.actorDataModels,
                initOptions.itemDataModels
            ) as UtilityResult;
            
            if (!dataModelResult.success) {
                throw new Error(`Data model setup failed: ${dataModelResult.error}`);
            }
            
            return dataModelResult;
        }, ['dataModels'], { phase: 'init', critical: true });
        
        initManager.registerService('sheetRegistrationExecution', async () => {
            const actors = foundry.documents.collections.Actors;
            const items = foundry.documents.collections.Items;
            
            const sheetResult = registerSheets(actors, items, AvantActorSheet, AvantItemSheet) as UtilityResult;
            
            if (!sheetResult.success) {
                throw new Error(`Sheet registration failed: ${sheetResult.error}`);
            }
            
            return sheetResult;
        }, ['dataModelsExecution'], { phase: 'init', critical: true });
        
        // Execute init phase with proper dependency management
        const initResult = await initManager.initializePhase('init');
        
        if (!initResult.success) {
            throw new Error(`Init phase failed: ${initResult.error}`);
        }
        
        console.log('Avant | System initialization complete - all services initialized successfully');
        
        // Log initialization status
        const statusReport = initManager.getStatusReport();
        console.log('Avant | Initialization Status:', statusReport);
        
    } catch (error) {
        console.error('Avant | Error during system initialization:', error);
        throw error; // Re-throw to ensure FoundryVTT knows initialization failed
    }
});

/**
 * Once the entire VTT framework is initialized, set up additional features
 */
Hooks.once('ready', async function(): Promise<void> {
    console.log('Avant | System ready - setting up additional features with initialization manager');
    
    try {
        // Get initialization manager instance
        const initManager = InitializationManager.getInstance();
        
        // Execute ready phase with proper dependency management
        const readyResult = await initManager.initializePhase('ready');
        
        if (!readyResult.success) {
            throw new Error(`Ready phase failed: ${readyResult.error}`);
        }
        
        console.log('Avant | System ready and fully configured - all ready services initialized');
        
        // Log final initialization status
        const finalStatusReport = initManager.getStatusReport();
        console.log('Avant | Final Initialization Status:', finalStatusReport);
        
        // Verify critical services are ready
        const criticalServices = ['themeManager', 'themeInitialization'];
        for (const serviceName of criticalServices) {
            if (!initManager.isServiceReady(serviceName)) {
                console.error(`Avant | Critical service '${serviceName}' is not ready!`);
            } else {
                console.log(`✅ Avant | Critical service '${serviceName}' is ready`);
            }
        }
        
    } catch (error) {
        console.error('Avant | Error during ready setup:', error);
        throw error; // Re-throw to ensure FoundryVTT knows ready failed
    }
});

/**
 * Extended Actor class for Avant Native
 * @extends {Actor}
 */
class AvantActor extends (globalThis as any).Actor {
    /** Actor system data */
    declare system: any; // Use any for now to avoid validation type conflicts
    
    /**
     * Prepare actor data
     * Calculate derived values and ensure data consistency
     * @override
     */
    prepareData(): void {
        super.prepareData();
        
        // Validate actor data and properly type the result
        const validatedSystem = ValidationUtils.validateActorData(this.system);
        this.system = validatedSystem;
    }
    
    /**
     * Prepare derived data
     * Called after base data preparation
     * @override
     */
    prepareDerivedData(): void {
        super.prepareDerivedData();
        
        // Call the data model's prepare derived data if it exists
        const systemWithPrepare = this.system as any;
        if (systemWithPrepare && typeof systemWithPrepare.prepareDerivedData === 'function') {
            systemWithPrepare.prepareDerivedData();
        }
    }
    
    /**
     * Get roll data for this actor
     * @returns Roll data for use in roll formulas
     * @override
     */
    getRollData(): Record<string, unknown> {
        const data = super.getRollData() as Record<string, unknown>;
        
        // Add commonly used roll data
        const systemData = this.system as any;
        if (systemData.abilities) {
            for (const [abilityName, abilityData] of Object.entries(systemData.abilities)) {
                const ability = abilityData as any;
                data[abilityName] = ability.modifier;
                data[`${abilityName}Mod`] = ability.modifier;
            }
        }
        
        if (systemData.skills) {
            for (const [skillName, skillValue] of Object.entries(systemData.skills)) {
                data[skillName] = skillValue;
            }
        }
        
        data.level = systemData.level || 1;
        data.tier = systemData.tier || 1;
        data.effort = systemData.effort || 1;
        
        return data;
    }
}

/**
 * Extended Item class for Avant Native
 * @extends {Item}
 */
class AvantItem extends (globalThis as any).Item {
    /** Item system data */
    declare system: any; // Use any for now to avoid validation type conflicts
    /** Item type */
    declare type: string;
    /** Owning actor if this item is owned */
    declare actor: AvantActor | null;
    
    /**
     * Prepare item data
     * Validate and normalize item data
     * @override
     */
    prepareData(): void {
        super.prepareData();
        
        // Validate item data - pass the whole item data including type
        const validatedData = ValidationUtils.validateItemData({
            type: this.type,
            system: this.system
        });
        
        // Update system data with validated version, handling the Object type
        const validatedSystem = (validatedData as any).system;
        if (validatedSystem) {
            this.system = validatedSystem;
        }
    }
    
    /**
     * Get roll data for this item
     * @returns Roll data for use in roll formulas
     * @override
     */
    getRollData(): Record<string, unknown> {
        const data = super.getRollData() as Record<string, unknown>;
        
        // Add actor data if this item is owned
        if (this.actor) {
            const actorData = this.actor.getRollData();
            Object.assign(data, actorData);
        }
        
        return data;
    }
    
    /**
     * Handle item rolls
     * @returns The executed roll or void
     */
    async roll(): Promise<any | void> {
        // Default item roll behavior
        const roll = new Roll("1d20", this.getRollData());
        await roll.evaluate();
        
        const speaker = ChatMessage.getSpeaker({ actor: this.actor });
        const rollMode = game.settings.get('core', 'rollMode');
        
        await roll.toMessage({
            speaker,
            flavor: `${this.name} Roll`,
            rollMode,
        });
        
        return roll;
    }
}

// Type-safe global exposure for console access and module compatibility
interface AvantGlobals {
    AvantActorData: typeof AvantActorData;
    AvantActionData: typeof AvantActionData;
    AvantFeatureData: typeof AvantFeatureData;
    AvantTalentData: typeof AvantTalentData;
    AvantAugmentData: typeof AvantAugmentData;
    AvantWeaponData: typeof AvantWeaponData;
    AvantArmorData: typeof AvantArmorData;
    AvantGearData: typeof AvantGearData;
    AvantActorSheet: typeof AvantActorSheet;
    AvantItemSheet: typeof AvantItemSheet;
    AvantRerollDialog: typeof AvantRerollDialog;
    AvantChatContextMenu: typeof AvantChatContextMenu;
    AvantThemeManager: typeof AvantThemeManager;
    ValidationUtils: typeof ValidationUtils;
}

// Expose classes globally for console access and module compatibility
const avantGlobals: AvantGlobals = {
    AvantActorData,
    AvantActionData,
    AvantFeatureData,
    AvantTalentData,
    AvantAugmentData,
    AvantWeaponData,
    AvantArmorData,
    AvantGearData,
    AvantActorSheet,
    AvantItemSheet,
    AvantRerollDialog,
    AvantChatContextMenu,
    AvantThemeManager,
    ValidationUtils
};

// Safely assign to globalThis
Object.assign(globalThis, avantGlobals);

console.log("Avant | System loaded successfully - all components imported and configured");