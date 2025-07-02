q/**
 * @fileoverview Actor Sheet for Avant Native System - ApplicationV2 Implementation
 * 
 * This file implements the actor sheet for the Avant Native system using FoundryVTT v13's
 * ApplicationV2 framework. It was migrated from the v12 Application framework and includes
 * comprehensive ApplicationV2 compatibility.
 * 
 * Key ApplicationV2 Features Implemented:
 * - Proper base class inheritance (ActorSheetV2)
 * - Window frame configuration (resizable, positioned, framed)
 * - Actions-based event handling system
 * - Form submission handling compatible with ApplicationV2
 * - Template parts configuration
 * - Theme system integration
 * 
 * @version 2.0.0 - FoundryVTT v13+ ApplicationV2 (TypeScript)
 * @author Avant Development Team
 * @since 2024-01-17 - ApplicationV2 Migration Completed
 * @license MIT
 */

import { AvantActorData } from '../data/actor-data.ts';
import { logger } from '../utils/logger.js';
import {
    calculateAbilityTotalModifiers,
    calculateSkillTotalModifiers,
    calculatePowerPointLimit,
    organizeSkillsByAbility,
    organizeItemsByType,
    validateAbilityRollData,
    validateSkillRollData,
    validatePowerPointUsage,
    prepareItemData,
    prepareWeaponAttackRoll,
    prepareWeaponDamageRoll,
    prepareArmorRoll,
    extractItemIdFromElement,
    type SkillAbilityMap
} from '../logic/actor-sheet-utils.ts';
import { itemHasTraits, createTraitHtmlForChat } from '../logic/chat/trait-resolver.ts';

// Import local foundry UI adapter for safe notifications
import { FoundryUI } from '../types/adapters/foundry-ui.ts';

/**
 * Actor Sheet Context interface for template rendering
 */
interface ActorSheetContext {
    actor: any;
    system: any;
    flags: any;
    abilityTotalModifiers: Record<string, number>;
    skillTotalModifiers: Record<string, number>;
    skillsByAbility: Record<string, any[]>;
    items: Record<string, any[]>;
    editable: boolean;
    owner: boolean;
    cssClass: string;
}

/**
 * Factory function to create the ApplicationV2-compatible Actor Sheet class
 * 
 * This function is called during system initialization to create the actor sheet class
 * with proper ApplicationV2 inheritance. It ensures all required FoundryVTT v13 classes
 * are available before creating the sheet.
 * 
 * @returns {Class} The AvantActorSheet class extending ApplicationV2 components
 * @throws {Error} If FoundryVTT v13 ApplicationV2 API is not available
 */
export function createAvantActorSheet() {
    // Access FoundryVTT v13 ApplicationV2 classes with safety checks
    const foundryGlobal = (globalThis as any).foundry;
    
    if (!foundryGlobal?.applications?.api) {
        throw new Error('FoundryVTT v13 applications API not available - ensure Foundry has fully initialized');
    }
    
    const { ApplicationV2, HandlebarsApplicationMixin } = foundryGlobal.applications.api;
    
    // CRITICAL: Use ActorSheetV2 for proper actor sheet ApplicationV2 behavior
    // ActorSheetV2 provides actor-specific window management, drag-drop, and event handling
    // that is essential for ApplicationV2 compatibility
    const ActorSheetV2 = foundryGlobal.applications?.sheets?.ActorSheetV2;
    const DocumentSheetV2 = foundryGlobal.applications.api.DocumentSheetV2;
    
    // Prefer ActorSheetV2 for actor sheets, fallback to DocumentSheetV2 for safety
    const BaseClass = ActorSheetV2 || DocumentSheetV2;
    
    if (!ApplicationV2 || !HandlebarsApplicationMixin || !BaseClass) {
        throw new Error('Required ApplicationV2 classes not found - ensure you are running FoundryVTT v13+');
    }
    
    // Log the base class being used for troubleshooting (production-safe)
    logger.info('Avant Actor Sheet using ApplicationV2 base class:', BaseClass.name || 'ActorSheetV2/DocumentSheetV2');

    /**
     * Actor Sheet for Avant Native System - FoundryVTT v13+ ApplicationV2
     * 
     * This class extends ApplicationV2 through HandlebarsApplicationMixin and ActorSheetV2
     * to provide a modern, v13-native actor sheet implementation. It replaces the legacy
     * Application-based actor sheet with full ApplicationV2 compatibility.
     * 
     * Key features:
     * - ApplicationV2 actions-based event handling
     * - Proper window frame controls with FontAwesome icons
     * - Resizable and positioned windows
     * - Form handling compatible with v13
     * - Theme system integration
     * 
     * @class AvantActorSheet
     * @extends {HandlebarsApplicationMixin(ActorSheetV2)}
     */
    class AvantActorSheet extends HandlebarsApplicationMixin(BaseClass) {
        /** The actor document associated with this sheet */
        declare document: any;
        
        /**
         * ApplicationV2 default options configuration
         * 
         * This configuration defines the behavior of the actor sheet window,
         * form handling, and action mappings. The window configuration was
         * critical for the ApplicationV2 migration to work properly.
         * 
         * @static
         */
        static DEFAULT_OPTIONS = {
            // CSS classes applied to the application element
            classes: ["avant", "sheet", "actor"],
            
            // Use form tag for proper form handling
            tag: "form",
            
            // CRITICAL: Window configuration for ApplicationV2
            // These settings enable proper window behavior including resizing,
            // positioning, and window controls with FontAwesome icons
            window: {
                frame: true,      // Enable window frame with controls
                positioned: true, // Allow window positioning
                resizable: true,  // Enable resize handles
                icon: "fas fa-user", // FontAwesome icon for window header
                title: "TYPES.Actor.character" // Localized title key
            },
            
            // Default window size
            position: {
                width: 900,
                height: 630
            },
            
            // Form handling configuration
            form: {
                submitOnChange: true,  // Auto-submit on field changes
                closeOnSubmit: false, // Keep sheet open after submission
                handler: AvantActorSheet._handleFormSubmission // Custom form handler
            },
            
            // ApplicationV2 actions system - maps data-action attributes to methods
            // This replaces the legacy activateListeners approach
            actions: {
                rollAbility: AvantActorSheet._onRollAbility,
                rollSkill: AvantActorSheet._onRollSkill,
                rollPowerPoints: AvantActorSheet._onRollPowerPoints,
                rollAttack: AvantActorSheet._onRollAttack,
                rollDamage: AvantActorSheet._onRollDamage,
                rollArmor: AvantActorSheet._onRollArmor,
                createItem: AvantActorSheet._onCreateItem,
                editItem: AvantActorSheet._onEditItem,
                deleteItem: AvantActorSheet._onDeleteItem,
                postChatCard: AvantActorSheet._onPostChatCard,
                useAction: AvantActorSheet._onUseAction,
                useTalent: AvantActorSheet._onUseTalent,
                useAugment: AvantActorSheet._onUseAugment
            }
        };

        /**
         * ApplicationV2 template parts configuration
         * @static
         */
        static PARTS = {
            form: {
                template: "systems/avant/templates/actor-sheet.html"
            }
        };

        /**
         * Tab configuration for the actor sheet
         */
        tabGroups = {
            sheet: "core"
        };

        /**
         * Current active tab to preserve state across renders
         * @private
         */
        private _currentTab: string = "core";

        /**
         * Get the actor document (compatibility accessor)
         */
        get actor() {
            return this.document;
        }

        /**
         * Get the sheet title with proper localization
         */
        get title(): string {
            const game = (globalThis as any).game;
            const actorName = this.document?.name || game?.i18n?.localize("DOCUMENT.Actor") || "Actor";
            const actorType = this.document?.type || "character";
            
            // Get localized type name
            let typeName = actorType;
            if (game?.i18n) {
                // Try FoundryVTT core localization first
                const coreKey = `TYPES.Actor.${actorType}`;
                const coreLocalization = game.i18n.localize(coreKey);
                
                if (coreLocalization !== coreKey) {
                    typeName = coreLocalization;
                } else {
                    // Fallback to simple capitalization
                    typeName = actorType.charAt(0).toUpperCase() + actorType.slice(1);
                }
            }
            
            return `${actorName} [${typeName}]`;
        }

        /**
         * Prepare context data for the actor sheet template
         * 
         * This method prepares all data needed by the Handlebars template for rendering.
         * It extends the base ApplicationV2 context with Avant-specific data including
         * calculated modifiers, organized skills, and item data.
         * 
         * @param {any} options - Render options from ApplicationV2
         * @returns {Promise<ActorSheetContext>} Complete template context data
         * @override
         */
        async _prepareContext(options: any): Promise<any> {
            // Get base ApplicationV2 context
            const context = await super._prepareContext(options);
            
            // Extract actor data for processing
            const actorData = this.document.toObject(false);
            
            // Add core actor data to context
            context.system = actorData.system;
            context.flags = actorData.flags;
            context.actor = this.document; // Template needs direct document reference
            
            // Add ApplicationV2 required fields for template compatibility
            context.editable = this.isEditable;
            context.owner = this.document.isOwner;
            
            // Build CSS classes for ApplicationV2 styling compatibility
            const cssClasses = ["avant", "sheet", "actor"];
            if (this.isEditable) cssClasses.push("editable");
            if (this.document.isOwner) cssClasses.push("owner");
            context.cssClass = cssClasses.join(" ");
            
            // Extract core data for calculations
            const level = actorData.system.level || 1;
            const abilities = actorData.system.abilities || {};
            const skills = actorData.system.skills || {};
            
            // Define skill-ability mapping for the Avant system
            // This mapping determines which ability modifier applies to each skill
            const skillAbilityMap: SkillAbilityMap = {
                'debate': 'intellect' as const,
                'inspect': 'intellect' as const,
                'recall': 'intellect' as const,
                'discern': 'focus' as const,
                'intuit': 'focus' as const,
                'endure': 'focus' as const,
                'finesse': 'grace' as const,
                'charm': 'grace' as const,
                'hide': 'grace' as const,
                'force': 'might' as const,
                'command': 'might' as const,
                'surge': 'might' as const
            };
            
            // Calculate derived values using pure functions from actor-sheet-utils
            // These functions are tested and handle edge cases properly
            context.abilityTotalModifiers = calculateAbilityTotalModifiers(abilities, level);
            context.skillTotalModifiers = calculateSkillTotalModifiers(skills, abilities, skillAbilityMap, level);
            context.powerPointLimit = calculatePowerPointLimit(actorData.system.powerPoints?.max || 10);
            
            // Organize data for template display
            context.skillsByAbility = organizeSkillsByAbility(skills, abilities, skillAbilityMap, level);
            
            // Organize items by type for template sections
            const itemsArray = Array.from(this.document.items.values());
            context.items = organizeItemsByType(itemsArray);
            
            // Add trait display data to items for visual enhancement
            await this._addTraitDisplayDataToItems(context.items);
            
            // Add system configuration data
            context.config = (globalThis as any).CONFIG?.AVANT || {};
            
            return context;
        }

        /**
         * Actions performed after any render of the Application
         * 
         * This method is called after the ApplicationV2 framework has rendered the
         * sheet content. It performs Avant-specific initialization including tab
         * management, theme application, and item styling.
         * 
         * @param {any} context - Prepared context data used for rendering
         * @param {any} options - Render options provided by ApplicationV2
         * @protected
         * @override
         */
        async _onRender(context: any, options: any): Promise<void> {
            // Complete base ApplicationV2 rendering first
            await super._onRender(context, options);
            
            // Initialize custom functionality that ApplicationV2 doesn't handle automatically
            this._initializeTabs();    // Manual tab management for Avant sheets
            this._applyTheme();        // Apply theme system styling
            this._ensureItemStyling(); // Ensure proper item display styling
        }

        /**
         * Initialize tab functionality for ApplicationV2
         * 
         * ApplicationV2 doesn't automatically handle tab switching, so we need to
         * implement it manually. This method sets up click listeners on tab elements
         * and activates the appropriate initial tab.
         * 
         * @private
         */
        private _initializeTabs(): void {
            const tabs = this.element.querySelectorAll('.sheet-tabs .item');
            const tabContents = this.element.querySelectorAll('.tab');
            
            // Skip initialization if no tabs are present
            if (tabs.length === 0 || tabContents.length === 0) {
                return;
            }
            
            // Clean up any existing event listeners by cloning elements
            // This prevents memory leaks and duplicate listeners
            tabs.forEach((tab: Element) => {
                const newTab = tab.cloneNode(true);
                tab.parentNode?.replaceChild(newTab, tab);
            });
            
            // Add click listeners to all tab elements
            this.element.querySelectorAll('.sheet-tabs .item').forEach((tab: Element) => {
                tab.addEventListener('click', (event: Event) => {
                    event.preventDefault();
                    const target = event.currentTarget as HTMLElement;
                    const tabName = target.dataset.tab;
                    if (tabName) {
                        this._activateTab(tabName);
                    }
                });
            });
            
            // Activate the current tab or default to the first available tab
            const targetTab = this._currentTab || tabs[0]?.getAttribute('data-tab') || 'core';
            this._activateTab(targetTab);
        }

        /**
         * Activate a specific tab by name
         * 
         * This method handles the visual switching between tabs by managing the 'active'
         * CSS class on both tab buttons and tab content areas.
         * 
         * @param {string} tabName - Name of the tab to activate (from data-tab attribute)
         * @private
         */
        private _activateTab(tabName: string): void {
            const tabs = this.element.querySelectorAll('.sheet-tabs .item');
            const tabContents = this.element.querySelectorAll('.tab');
            
            // Clear all active states to ensure clean switching
            tabs.forEach((tab: Element) => tab.classList.remove('active'));
            tabContents.forEach((content: Element) => content.classList.remove('active'));
            
            // Find the specific tab button and content area
            const targetTab = this.element.querySelector(`.sheet-tabs .item[data-tab="${tabName}"]`);
            const targetContent = this.element.querySelector(`.tab[data-tab="${tabName}"]`);
            
            // Activate the tab if both elements exist
            if (targetTab && targetContent) {
                targetTab.classList.add('active');
                targetContent.classList.add('active');
                this._currentTab = tabName;
                this.tabGroups.sheet = tabName; // Update ApplicationV2 tab group state
            } else {
                // Log warning for missing tabs in development (will help with debugging)
                logger.warn('Could not find tab elements for tab:', tabName);
            }
        }

        /**
         * Apply theme styling to the sheet
         * 
         * This method integrates with the Avant theme system to apply the current
         * theme to the actor sheet. It includes fallback logic for when the theme
         * manager is not available.
         * 
         * @private
         */
        private _applyTheme(): void {
            try {
                // Access the Avant theme manager through the initialization system
                const game = (globalThis as any).game;
                if (game?.avant?.initializationManager) {
                    const themeManager = game.avant.initializationManager.getService('themeManager');
                    if (themeManager) {
                        // Apply the current theme to this sheet element
                        themeManager.applyThemeToElement(this.element, themeManager.currentTheme);
                        return;
                    }
                }
                
                // Fallback: Apply default dark theme if theme manager not available
                this.element.classList.remove('theme-light', 'theme-dark');
                this.element.classList.add('theme-dark');
            } catch (error) {
                // Emergency fallback for any theme system errors
                logger.warn('Theme application failed, using dark fallback:', error);
                this.element.classList.remove('theme-light', 'theme-dark');
                this.element.classList.add('theme-dark');
            }
        }

        /**
         * Ensure item styling is properly applied
         * 
         * This method ensures that all item elements in the sheet have proper
         * display styling and are not accidentally hidden. It handles various
         * item types used throughout the Avant system.
         * 
         * @private
         */
        private _ensureItemStyling(): void {
            // Define all item selectors used in Avant templates
            const itemSelectors = [
                '.item',           // Generic items (gear)
                '.gear-item',      // Gear items
                '.action-item',    // Action items
                '.feature-item',   // Feature items  
                '.talent-item',    // Talent items
                '.augment-item',   // Augment items
                '.combat-item'     // Combat items (weapons, armor)
            ];
            
            // Process each item type and ensure proper display
            itemSelectors.forEach(selector => {
                const items = this.element.querySelectorAll(selector);
                items.forEach((item: Element) => {
                    const itemElement = item as HTMLElement;
                    // Remove any display:none that might interfere with item visibility
                    if (itemElement.style.display === 'none') {
                        itemElement.style.display = '';
                    }
                });
            });
        }

        /**
         * Add trait display data to items for actor sheet display
         * @param items - Organized items by type
         * @private
         */
        private async _addTraitDisplayDataToItems(items: any): Promise<void> {
            try {
                // Get TraitProvider service if available
                const game = (globalThis as any).game;
                if (!game?.avant?.initializationManager) {
                    return;
                }

                const traitProvider = game.avant.initializationManager.getService('traitProvider');
                if (!traitProvider) {
                    return;
                }

                // Get all available traits
                const result = await traitProvider.getAll();
                if (!result.success || !result.data) {
                    return;
                }

                const allTraits = result.data;

                // Add trait display data to each item in each category
                for (const [categoryName, itemsList] of Object.entries(items)) {
                    if (Array.isArray(itemsList)) {
                        for (const item of itemsList) {
                            if (item.system?.traits && Array.isArray(item.system.traits)) {
                                item.displayTraits = item.system.traits.map((traitId: string) => {
                                    const trait = allTraits.find((t: any) => t.id === traitId);
                                    if (trait) {
                                        return {
                                            id: traitId,
                                            name: trait.name,
                                            color: trait.color,
                                            icon: trait.icon,
                                            description: trait.description,
                                            displayId: traitId
                                        };
                                    } else {
                                        return {
                                            id: traitId,
                                            name: this._generateFallbackTraitName(traitId),
                                            displayId: traitId,
                                            // Provide default styling for missing traits
                                            color: '#6C757D', // Bootstrap secondary gray
                                            icon: 'fas fa-tag'  // Generic tag icon
                                        };
                                    }
                                });
                            } else {
                                item.displayTraits = [];
                            }
                        }
                    }
                }
            } catch (error) {
                logger.warn('Failed to add trait display data to items:', error);
            }
        }

        /**
         * Generate a fallback display name from a trait ID
         * @param traitId - The trait ID to generate a name from
         * @private
         */
        private _generateFallbackTraitName(traitId: string): string {
            // For system traits like "system_trait_fire_1750695472058", extract "fire"
            if (traitId.startsWith('system_trait_')) {
                return traitId
                    .replace(/^system_trait_/, '')
                    .replace(/_\d+$/, '')
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());
            }
            
            // For other IDs, just return as-is (this will show the raw ID for custom traits)
            return traitId;
        }

        /**
         * Constructor for the AvantActorSheet
         * 
         * Initializes the ApplicationV2 actor sheet with the provided options.
         * The majority of configuration is handled through DEFAULT_OPTIONS.
         * 
         * @param {any} options - Configuration options for the sheet
         */
        constructor(options = {}) {
            super(options);
        }

        // =================================================================================
        // STATIC ACTION HANDLERS (ApplicationV2 Actions System)
        // =================================================================================
        // These static methods are mapped to data-action attributes in the template.
        // ApplicationV2 automatically binds 'this' to the sheet instance when called.

        /**
         * Handle ability rolls from sheet buttons
         * 
         * Rolls 2d10 + ability value and sends the result to chat. The ability to roll
         * is determined from the data-ability attribute on the clicked element.
         * 
         * @param {Event} event - The originating click event
         * @param {HTMLElement} target - The clicked element with data-ability attribute
         * @this {AvantActorSheet} The sheet instance (bound automatically by ApplicationV2)
         * @static
         */
        static async _onRollAbility(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            
            // ApplicationV2 automatically binds 'this' to the sheet instance
            const sheet = this;
            if (!sheet?.document) return;

            const abilityName = target.dataset.ability;
            if (!abilityName) {
                logger.warn('AvantActorSheet | No ability specified for roll');
                return;
            }
            
            // Get the ability data from the actor
            const ability = sheet.document.system.abilities?.[abilityName];
            if (!ability) {
                logger.warn('AvantActorSheet | Ability not found:', abilityName);
                return;
            }

            // Execute the 2d10 + ability value roll
            const Roll = (globalThis as any).Roll;
            const roll = new Roll('2d10 + @value', { value: ability.value });
            await roll.evaluate();
            
            // Send the result to chat
            const ChatMessage = (globalThis as any).ChatMessage;
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: sheet.document }),
                flavor: `${ability.label || abilityName} Roll`
            });
        }

        /**
         * Handle skill rolls from sheet buttons
         * 
         * Rolls 2d10 + skill value and sends the result to chat. The skill to roll
         * is determined from the data-skill attribute on the clicked element.
         * 
         * @param {Event} event - The originating click event
         * @param {HTMLElement} target - The clicked element with data-skill attribute
         * @this {AvantActorSheet} The sheet instance (bound automatically by ApplicationV2)
         * @static
         */
        static async _onRollSkill(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            
            // ApplicationV2 automatically binds 'this' to the sheet instance
            const sheet = this;
            if (!sheet?.document) return;

            const skillName = target.dataset.skill;
            if (!skillName) {
                logger.warn('AvantActorSheet | No skill specified for roll');
                return;
            }

            // Get the skill data from the actor
            const skill = sheet.document.system.skills?.[skillName];
            if (!skill) {
                logger.warn('AvantActorSheet | Skill not found:', skillName);
                return;
            }

            // Execute the 2d10 + skill value roll
            const Roll = (globalThis as any).Roll;
            const roll = new Roll('2d10 + @value', { value: skill.value });
            await roll.evaluate();
            
            // Send the result to chat
            const ChatMessage = (globalThis as any).ChatMessage;
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: sheet.document }),
                flavor: `${skill.label || skillName} Skill Roll`
            });
        }

        /**
         * Handle power point rolls
         * @param event - The originating click event
         * @param target - The target element
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onRollPowerPoints(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            
            // FIXED: In ApplicationV2, 'this' is bound to the sheet instance
            const sheet = this;
            if (!sheet?.document) return;

            try {
                const powerPoints = sheet.document.system.powerPoints || { current: 0, max: 10 };
                
                // Use pure function to validate power point usage
                const usageData = validatePowerPointUsage(powerPoints, 1);
                
                if (!usageData.valid) {
                    FoundryUI.notify(usageData.error || 'Invalid power point usage', 'warn');
                    return;
                }

                // Create and execute the roll
                const Roll = (globalThis as any).Roll;
                const roll = new Roll('1d6');
                await roll.evaluate();

                // Send to chat
                const ChatMessage = (globalThis as any).ChatMessage;
                await roll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: sheet.document }),
                    flavor: 'Power Point Roll',
                    rollMode: (globalThis as any).game.settings.get('core', 'rollMode')
                });

                logger.log(`AvantActorSheet | Power point roll executed: ${roll.total}`);
            } catch (error) {
                logger.error('AvantActorSheet | Power point roll failed:', error);
                FoundryUI.notify('Power point roll failed', 'error');
            }
        }

        /**
         * Handle attack rolls
         * @param event - The originating click event
         * @param target - The target element
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onRollAttack(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {

            event.preventDefault();
            
            // FIXED: In ApplicationV2, 'this' is bound to the sheet instance
            const sheet = this;
            if (!sheet?.document) return;

            const itemId = extractItemIdFromElement(target);
            if (!itemId) return;

            const item = sheet.document.items.get(itemId);
            if (!item) return;

            // Roll 2d10 + attack bonus
            const attackValue = item.system.attack || 0;
            const Roll = (globalThis as any).Roll;
            const roll = new Roll('2d10 + @attack', { attack: attackValue });
            await roll.evaluate();
            
            const ChatMessage = (globalThis as any).ChatMessage;
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: sheet.document }),
                flavor: `${item.name} Attack Roll`
            });
            
        }

        /**
         * Handle damage rolls
         * @param event - The originating click event
         * @param target - The target element
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onRollDamage(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            
            // FIXED: In ApplicationV2, 'this' is bound to the sheet instance
            const sheet = this;
            if (!sheet?.document) return;

            const itemId = extractItemIdFromElement(target);
            if (!itemId) return;

            const item = sheet.document.items.get(itemId);
            if (!item) return;

            // Roll damage (use weapon damage formula or default)
            const damageFormula = item.system.damage || '1d6';
            const Roll = (globalThis as any).Roll;
            const roll = new Roll(damageFormula);
            await roll.evaluate();
            
            const ChatMessage = (globalThis as any).ChatMessage;
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: sheet.document }),
                flavor: `${item.name} Damage`
            });
            
        }

        /**
         * Handle armor rolls
         * @param event - The originating click event
         * @param target - The target element
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onRollArmor(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            
            // FIXED: In ApplicationV2, 'this' is bound to the sheet instance
            const sheet = this;
            if (!sheet?.document) return;

            const itemId = extractItemIdFromElement(target);
            if (!itemId) {
                logger.warn('AvantActorSheet | No item ID for armor roll');
                return;
            }


            const item = sheet.document.items.get(itemId);
            if (!item) {
                FoundryUI.notify('Armor not found', 'warn');
                return;
            }

            try {
                // Use pure function to prepare armor roll
                const rollData = prepareArmorRoll(item, sheet.document.system);
                
                if (!rollData) {
                    FoundryUI.notify('Invalid armor roll data', 'warn');
                    return;
                }

                // Create and execute the roll
                const Roll = (globalThis as any).Roll;
                const roll = new Roll(rollData.rollExpression, rollData.rollData);
                await roll.evaluate();

                // Send to chat
                const ChatMessage = (globalThis as any).ChatMessage;
                await roll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: sheet.document }),
                    flavor: `${item.name} Armor`,
                    rollMode: (globalThis as any).game.settings.get('core', 'rollMode')
                });

                logger.log(`AvantActorSheet | Armor roll executed for ${item.name}: ${roll.total}`);
            } catch (error) {
                logger.error('AvantActorSheet | Armor roll failed:', error);
                FoundryUI.notify('Armor roll failed', 'error');
            }
        }

        /**
         * Handle item creation
         * @param event - The originating click event
         * @param target - The target element
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onCreateItem(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            
            // FIXED: In ApplicationV2, 'this' is bound to the sheet instance
            const sheet = this;
            if (!sheet?.document) return;

            const itemType = target.dataset.type || 'gear';

            // Create the item data
            const itemData = {
                name: `New ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`,
                type: itemType,
                system: {}
            };

            // Create the item
            try {
                const created = await sheet.document.createEmbeddedDocuments('Item', [itemData]);
                
                // Open the item sheet for editing
                if (created?.[0]) {
                    created[0].sheet.render(true);
                }
            } catch (error) {
                logger.error('AvantActorSheet | Error creating item:', error);
                const ui = (globalThis as any).ui;
                ui?.notifications?.error(`Failed to create ${itemType}`);
            }
        }

        /**
         * Handle item editing
         * @param event - The originating click event
         * @param target - The target element
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onEditItem(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            
            // FIXED: In ApplicationV2, 'this' is bound to the sheet instance
            const sheet = this;
            if (!sheet?.document) return;

            const itemId = extractItemIdFromElement(target);
            if (!itemId) {
                logger.warn('AvantActorSheet | No item ID for editing');
                return;
            }

            
            // Get the item
            const item = sheet.document.items.get(itemId);
            if (!item) {
                logger.warn('AvantActorSheet | Item not found:', itemId);
                return;
            }

            // Open the item sheet
            item.sheet.render(true);
        }

        /**
         * Handle item deletion
         * @param event - The originating click event
         * @param target - The target element
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onDeleteItem(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            
            // FIXED: In ApplicationV2, 'this' is bound to the sheet instance
            const sheet = this;
            if (!sheet?.document) return;

            const itemId = extractItemIdFromElement(target);
            if (!itemId) {
                logger.warn('AvantActorSheet | No item ID for deletion');
                return;
            }

            
            // Get the item
            const item = sheet.document.items.get(itemId);
            if (!item) {
                logger.warn('AvantActorSheet | Item not found:', itemId);
                return;
            }

            // Confirm deletion
            const Dialog = (globalThis as any).Dialog;
            const confirmed = await Dialog.confirm({
                title: 'Delete Item',
                content: `<p>Are you sure you want to delete <strong>${item.name}</strong>?</p>`,
                yes: () => true,
                no: () => false
            });

            if (confirmed) {
                await item.delete();
                const ui = (globalThis as any).ui;
                ui?.notifications?.info(`Deleted ${item.name}`);
            }
        }

        /**
         * Handle posting chat cards
         * @param event - The originating click event
         * @param target - The target element
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onPostChatCard(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            
            // FIXED: In ApplicationV2, 'this' is bound to the sheet instance
            const sheet = this;
            if (!sheet?.document) return;

            const itemId = extractItemIdFromElement(target);
            if (!itemId) {
                logger.warn('AvantActorSheet | No item ID for chat card');
                return;
            }


            const item = sheet.document.items.get(itemId);
            if (!item) {
                FoundryUI.notify('Item not found', 'warn');
                return;
            }

            try {
                // Create trait-enhanced chat card
                const game = (globalThis as any).game;
                let traitHtml = '';
                
                if (itemHasTraits(item)) {
                    traitHtml = await createTraitHtmlForChat(item, game?.avant?.initializationManager);
                }

                const cardData = {
                    actor: sheet.document,
                    item: item,
                    title: item.name,
                    description: item.system?.description || '',
                    traitHtml: traitHtml
                };

                const template = "systems/avant/templates/chat/item-card.html";
                const foundry = (globalThis as any).foundry;
                const renderTemplate = foundry?.applications?.handlebars?.renderTemplate || (globalThis as any).renderTemplate;
                const content = await renderTemplate(template, cardData);

                const ChatMessage = (globalThis as any).ChatMessage;
                await ChatMessage.create({
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker({ actor: sheet.document }),
                    content: content,
                    type: ChatMessage.TYPES.OTHER
                });

                logger.log(`AvantActorSheet | Posted chat card for: ${item.name}`);
            } catch (error) {
                logger.error('AvantActorSheet | Failed to post chat card:', error);
                FoundryUI.notify('Failed to post chat card', 'error');
            }
        }

        /**
         * Handle using actions
         * @param event - The originating click event
         * @param target - The target element
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onUseAction(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            
            // FIXED: In ApplicationV2, 'this' is bound to the sheet instance
            const sheet = this;
            if (!sheet?.document) return;

            const itemId = extractItemIdFromElement(target);
            if (!itemId) {
                logger.warn('AvantActorSheet | No item ID for action use');
                return;
            }

            const item = sheet.document.items.get(itemId);
            if (!item) {
                FoundryUI.notify('Action not found', 'warn');
                return;
            }

            try {
                // Post action usage to chat
                const game = (globalThis as any).game;
                let traitHtml = '';
                
                if (itemHasTraits(item)) {
                    traitHtml = await createTraitHtmlForChat(item, game?.avant?.initializationManager);
                }

                const cardData = {
                    actor: sheet.document,
                    item: item,
                    title: `${item.name} (Action)`,
                    description: item.system?.description || '',
                    traitHtml: traitHtml
                };

                const template = "systems/avant/templates/chat/action-use.html";
                const foundry = (globalThis as any).foundry;
                const renderTemplate = foundry?.applications?.handlebars?.renderTemplate || (globalThis as any).renderTemplate;
                const content = await renderTemplate(template, cardData);

                const ChatMessage = (globalThis as any).ChatMessage;
                await ChatMessage.create({
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker({ actor: sheet.document }),
                    content: content,
                    type: ChatMessage.TYPES.OTHER
                });

                logger.log(`AvantActorSheet | Posted action usage for: ${item.name}`);
            } catch (error) {
                logger.error('AvantActorSheet | Failed to post action usage:', error);
                FoundryUI.notify('Failed to post action usage', 'error');
            }
        }

        /**
         * Handle using talents
         * @param event - The originating click event
         * @param target - The target element
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onUseTalent(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            
            // FIXED: In ApplicationV2, 'this' is bound to the sheet instance
            const sheet = this;
            if (!sheet?.document) return;

            const itemId = extractItemIdFromElement(target);
            if (!itemId) {
                logger.warn('AvantActorSheet | No item ID for talent use');
                return;
            }

            const item = sheet.document.items.get(itemId);
            if (!item) {
                FoundryUI.notify('Talent not found', 'warn');
                return;
            }

            try {
                // Post talent usage to chat
                const game = (globalThis as any).game;
                let traitHtml = '';
                
                if (itemHasTraits(item)) {
                    traitHtml = await createTraitHtmlForChat(item, game?.avant?.initializationManager);
                }

                const cardData = {
                    actor: sheet.document,
                    item: item,
                    title: `${item.name} (Talent)`,
                    description: item.system?.description || '',
                    traitHtml: traitHtml
                };

                const template = "systems/avant/templates/chat/talent-use.html";
                const foundry = (globalThis as any).foundry;
                const renderTemplate = foundry?.applications?.handlebars?.renderTemplate || (globalThis as any).renderTemplate;
                const content = await renderTemplate(template, cardData);

                const ChatMessage = (globalThis as any).ChatMessage;
                await ChatMessage.create({
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker({ actor: sheet.document }),
                    content: content,
                    type: ChatMessage.TYPES.OTHER
                });

                logger.log(`AvantActorSheet | Posted talent usage for: ${item.name}`);
            } catch (error) {
                logger.error('AvantActorSheet | Failed to post talent usage:', error);
                FoundryUI.notify('Failed to post talent usage', 'error');
            }
        }

        // Custom window control handlers removed - using FoundryVTT default controls

        /**
         * Static form submission handler for ApplicationV2
         * @param event - The form submission event
         * @param form - The form element
         * @param formData - Processed form data
         * @returns Promise<void>
         */
        static async _handleFormSubmission(event: Event, form: HTMLFormElement, formData: any): Promise<void> {
            const sheet = (form.closest('.app') as any)?.app as AvantActorSheet;
            if (sheet) {
                return sheet._onSubmitForm(event, form, formData);
            }
            return Promise.resolve();
        }

        /**
         * Handle form submission for ApplicationV2 compatibility
         * @param event - The form submission event
         * @param form - The form element
         * @param formData - The form data
         */
        async _onSubmitForm(event: Event, form: HTMLFormElement, formData: any): Promise<void> {
            if (!this.document) return;

            try {
                // Process and update the actor with the form data
                await this.document.update(formData.object);
            } catch (error) {
                console.error('AvantActorSheet | Form submission failed:', error);
            }
        }

        /**
         * Handle using augments
         * @param event - The originating click event
         * @param target - The target element
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onUseAugment(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            
            // FIXED: In ApplicationV2, 'this' is bound to the sheet instance
            const sheet = this;
            if (!sheet?.document) return;

            const itemId = extractItemIdFromElement(target);
            if (!itemId) {
                logger.warn('AvantActorSheet | No item ID for augment use');
                return;
            }

            const item = sheet.document.items.get(itemId);
            if (!item) {
                FoundryUI.notify('Augment not found', 'warn');
                return;
            }

            try {
                // Post augment usage to chat
                const game = (globalThis as any).game;
                let traitHtml = '';
                
                if (itemHasTraits(item)) {
                    traitHtml = await createTraitHtmlForChat(item, game?.avant?.initializationManager);
                }

                const cardData = {
                    actor: sheet.document,
                    item: item,
                    title: `${item.name} (Augment)`,
                    description: item.system?.description || '',
                    traitHtml: traitHtml
                };

                const template = "systems/avant/templates/chat/augment-use.html";
                const foundry = (globalThis as any).foundry;
                const renderTemplate = foundry?.applications?.handlebars?.renderTemplate || (globalThis as any).renderTemplate;
                const content = await renderTemplate(template, cardData);

                const ChatMessage = (globalThis as any).ChatMessage;
                await ChatMessage.create({
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker({ actor: sheet.document }),
                    content: content,
                    type: ChatMessage.TYPES.OTHER
                });

                logger.log(`AvantActorSheet | Posted augment usage for: ${item.name}`);
            } catch (error) {
                logger.error('AvantActorSheet | Failed to post augment usage:', error);
                FoundryUI.notify('Failed to post augment usage', 'error');
            }
        }
    }
    
    return AvantActorSheet;
}

// Note: The actual AvantActorSheet class is created by the createAvantActorSheet() factory function
// when called by the initialization system. This ensures Foundry classes are available. 