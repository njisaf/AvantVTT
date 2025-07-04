/**
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
         * 🎯 APPLICATIONV2 ACTION REGISTRATION SYSTEM
         * 
         * CRITICAL: Actions MUST be registered in DEFAULT_OPTIONS.actions for ApplicationV2 to recognize them.
         * This was the root cause of a major debugging session where talent/augment buttons were completely 
         * non-functional after the ApplicationV2 migration.
         * 
         * DEBUGGING JOURNEY:
         * 1. Initial problem: Clicking talent/augment chat buttons did nothing - no console logs, no errors
         * 2. Edit buttons worked fine, proving ApplicationV2 action system was functional
         * 3. Templates had correct `type="button"` and `data-action` attributes
         * 4. Root cause: Actions were defined in separate `static ACTIONS` object instead of DEFAULT_OPTIONS.actions
         * 5. Solution: Move all actions to proper location where ApplicationV2 actually looks for them
         * 
         * APPLICATIONV2 REQUIREMENTS:
         * - Actions must be static methods on the class
         * - Actions must be registered in DEFAULT_OPTIONS.actions (not separate objects)
         * - HTML elements need `data-action` attribute matching the action name
         * - Buttons must have `type="button"` to prevent form submission
         * - ApplicationV2 handles event delegation automatically
         * 
         * LESSON LEARNED: Always register actions in DEFAULT_OPTIONS.actions for ApplicationV2 compatibility
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
            
            // 🎯 CRITICAL: All ApplicationV2 actions must be registered here
            // This replaces the legacy activateListeners approach
            actions: {
                // 🔧 Debug/Test Actions (used during debugging process)
                testAction: AvantActorSheet._onTestAction,
                
                // 🎲 Dice Rolling Actions
                rollAbility: AvantActorSheet._onRollAbility,
                rollSkill: AvantActorSheet._onRollSkill,
                rollPowerPoints: AvantActorSheet._onRollPowerPoints,
                rollAttack: AvantActorSheet._onRollAttack,
                rollDamage: AvantActorSheet._onRollDamage,
                rollArmor: AvantActorSheet._onRollArmor,
                
                // 📦 Item Management Actions
                createItem: AvantActorSheet._onCreateItem,
                editItem: AvantActorSheet._onEditItem,
                deleteItem: AvantActorSheet._onDeleteItem,
                
                // 💬 Chat Integration Actions
                postChatCard: AvantActorSheet._onPostChatCard,
                useAction: AvantActorSheet._onUseAction,
                
                // 🎯 FEATURE CARD SYSTEM - The main fix that resolved the debugging issue
                // These actions connect to the complete feature card infrastructure:
                // - feature-card-builder.ts: Generates rich HTML cards with traits and PP integration
                // - power-point-handler.ts: Validates and processes PP spending from chat
                // - chat-integration.ts: Provides clean API for posting to chat
                useTalent: AvantActorSheet._onUseTalent,      // Posts talent feature cards
                useAugment: AvantActorSheet._onUseAugment,     // Posts augment feature cards
                spendAugmentPP: AvantActorSheet._onSpendAugmentPP  // Direct PP spend handler
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
            
            // Add comprehensive display data to items (traits, descriptions, requirements, etc.)
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
         * Add display data to items for actor sheet display
         * @param items - Organized items by type
         * @private
         */
        private async _addTraitDisplayDataToItems(items: any): Promise<void> {
            try {
                // Get TraitProvider service if available
                const game = (globalThis as any).game;
                let allTraits: any[] = [];
                
                if (game?.avant?.initializationManager) {
                    const traitProvider = game.avant.initializationManager.getService('traitProvider');
                    if (traitProvider) {
                        const result = await traitProvider.getAll();
                        if (result.success && result.data) {
                            allTraits = result.data;
                        }
                    }
                }

                // Add comprehensive display data to each item in each category
                for (const [categoryName, itemsList] of Object.entries(items)) {
                    if (Array.isArray(itemsList)) {
                        for (const item of itemsList) {
                            // Ensure system data is available for template access
                            if (!item.system) {
                                item.system = {};
                            }
                            
                            // Ensure all common fields are accessible for display
                            item.system.description = item.system.description || '';
                            item.system.requirements = item.system.requirements || '';
                            item.system.levelRequirement = item.system.levelRequirement || null;
                            item.system.apCost = item.system.apCost || 0;
                            item.system.ppCost = item.system.ppCost || 0;
                            item.system.usable = item.system.usable || false;
                            item.system.isActive = item.system.isActive || false;
                            
                            // Process trait display data
                            if (item.system?.traits && Array.isArray(item.system.traits)) {
                                item.displayTraits = item.system.traits.map((traitId: string) => {
                                    const trait = allTraits.find((t: any) => t.id === traitId);
                                    if (trait) {
                                        // Debug logging for trait data
                                        logger.debug('AvantActorSheet | Found trait data:', {
                                            traitId,
                                            traitName: trait.name,
                                            traitColor: trait.color,
                                            traitIcon: trait.icon
                                        });
                                        
                                        return {
                                            id: traitId,
                                            name: trait.name,
                                            color: trait.color || '#00E0DC', // Fallback to primary accent
                                            textColor: trait.textColor || '#000000', // Explicit text color
                                            icon: trait.icon || 'fas fa-tag',
                                            description: trait.description,
                                            displayId: traitId
                                        };
                                    } else {
                                        // Only log warning for legitimate trait IDs, not corrupted data
                                        if (traitId && typeof traitId === 'string' && !traitId.startsWith('[') && !traitId.startsWith('{')) {
                                            logger.warn('AvantActorSheet | Trait not found in provider:', traitId);
                                        } else {
                                            logger.debug('AvantActorSheet | Skipping corrupted trait data:', traitId);
                                        }
                                        
                                        return {
                                            id: traitId,
                                            name: this._generateFallbackTraitName(traitId),
                                            displayId: traitId,
                                            // Provide default styling for missing traits
                                            color: '#6C757D', // Bootstrap secondary gray
                                            textColor: '#FFFFFF', // White text for gray background
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
                logger.warn('Failed to add display data to items:', error);
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

        /**
         * Activate core listeners for ApplicationV2 compatibility
         * This method is essential for proper HTML element handling in FoundryVTT v13
         * @param html - The rendered HTML content
         */
        _activateCoreListeners(html: HTMLElement | any): void {
            // Convert jQuery to HTMLElement if needed
            const element = html instanceof HTMLElement ? html : (html as any)[0];
            
            if (!element) return;

            // Call parent implementation for core functionality
            if (super._activateCoreListeners) {
                super._activateCoreListeners(html);
            }

            // Additional activation for our specific needs can be added here
            // This ensures ApplicationV2 action delegation works properly
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
            console.log('🎯 Avant | _onEditItem triggered!', { event, target });
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

            console.log('🎯 Avant | Opening item sheet for:', item.name);
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
                // Use the proper feature card system
                const game = (globalThis as any).game;
                const result = await game.avant.chat.postFeatureCard(itemId, sheet.document.id);
                
                if (result.success) {
                    logger.log(`AvantActorSheet | Posted feature card for: ${item.name}`);
                } else {
                    logger.error('AvantActorSheet | Feature card posting failed:', result.error);
                    FoundryUI.notify(result.error || 'Failed to post feature card', 'error');
                }

            } catch (error) {
                logger.error('AvantActorSheet | Failed to post feature card:', error);
                FoundryUI.notify('Failed to post feature card', 'error');
            }
        }

        /**
         * Handle using an action
         * @param event - The originating click event
         * @param target - The target element
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onUseAction(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            
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
                // Use the proper feature card system
                const game = (globalThis as any).game;
                const result = await game.avant.chat.postFeatureCard(itemId, sheet.document.id);
                
                if (result.success) {
                    logger.log(`AvantActorSheet | Posted action usage for: ${item.name}`);
                } else {
                    logger.error('AvantActorSheet | Action usage posting failed:', result.error);
                    FoundryUI.notify(result.error || 'Failed to post action usage', 'error');
                }

            } catch (error) {
                logger.error('AvantActorSheet | Failed to post action usage:', error);
                FoundryUI.notify('Failed to post action usage', 'error');
            }
        }

        /**
         * 🎯 TALENT FEATURE CARD HANDLER - THE BREAKTHROUGH THAT FIXED EVERYTHING
         * 
         * This handler posts rich, interactive talent cards to chat with full feature integration.
         * This was the primary target of the debugging session that revealed the ApplicationV2 action
         * registration issue.
         * 
         * FEATURE CARD SYSTEM INTEGRATION:
         * 1. Uses feature-card-builder.ts to generate rich HTML cards with:
         *    - Talent name, description, and metadata (tier, prerequisites)
         *    - Trait chips with proper colors and icons
         *    - Power Point cost with interactive spending buttons
         *    - Professional styling with accessibility features
         * 
         * 2. Integrates with trait-provider.ts for:
         *    - Trait name resolution (fire, ice, tech, etc.)
         *    - Color and icon mapping
         *    - Support for both system and custom traits
         * 
         * 3. Connects to power-point-handler.ts for:
         *    - PP cost validation (sufficient points available)
         *    - Interactive spending buttons in chat
         *    - Ownership validation (user must own character)
         *    - Real-time PP deduction with notifications
         * 
         * DEBUGGING HISTORY:
         * - Originally this handler existed but was never triggered
         * - Root cause: Not registered in DEFAULT_OPTIONS.actions
         * - ApplicationV2 only looks for actions in DEFAULT_OPTIONS.actions
         * - Fix: Move registration from separate static ACTIONS object to proper location
         * 
         * @param event - The originating click event
         * @param target - The target element (contains data-item-id)
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onUseTalent(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            console.log('🎯 Avant | _onUseTalent triggered!', { event, target });
            event.preventDefault();
            
            const sheet = this;
            if (!sheet?.document) return;

            // Extract item ID from the button's data attributes
            const itemId = extractItemIdFromElement(target);
            if (!itemId) {
                logger.warn('AvantActorSheet | No item ID for talent use');
                return;
            }

            // Get the talent item from the actor
            const item = sheet.document.items.get(itemId);
            if (!item) {
                FoundryUI.notify('Talent not found', 'warn');
                return;
            }

            try {
                console.log('🎯 Avant | Posting talent feature card for:', item.name);
                
                // 🎨 DYNAMIC IMPORT PATTERN - Ensures modules are loaded when needed
                // This prevents circular dependencies and ensures proper initialization order
                const { postFeatureCard } = await import('../logic/chat/feature-card-builder.js');
                const { TraitProvider } = await import('../services/trait-provider.js');
                
                // Initialize trait provider for trait resolution
                const traitProvider = new TraitProvider();
                
                // 💬 POST FEATURE CARD - The core functionality
                // This creates a rich HTML card and posts it to chat with:
                // - Talent details and description
                // - Trait chips with colors/icons
                // - Power point cost and spending buttons
                // - Professional styling and accessibility
                const result = await postFeatureCard(item, sheet.document, traitProvider);
                
                if (result.success) {
                    console.log('🎯 Avant | Posted talent card successfully:', result.messageId);
                    logger.log(`AvantActorSheet | Posted talent card for: ${item.name}`);
                } else {
                    console.error('🎯 Avant | Talent card posting failed:', result.error);
                    logger.error('AvantActorSheet | Talent card posting failed:', result.error);
                    FoundryUI.notify(result.error || 'Failed to post talent card', 'error');
                }

            } catch (error) {
                console.error('🎯 Avant | Failed to post talent card:', error);
                logger.error('AvantActorSheet | Failed to post talent card:', error);
                FoundryUI.notify('Failed to post talent card', 'error');
            }
        }

        /**
         * Test action to verify talent/augment buttons are working
         * @param event - The originating click event
         * @param target - The target element
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onTestTalent(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            console.log('🎯 Avant | _onTestTalent triggered! SUCCESS!', { event, target });
            alert('Test talent action worked!');
        }

        /**
         * Handle rolling a talent (simplified for testing)
         * @param event - The originating click event
         * @param target - The target element
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onRollTalent(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            console.log('🎯 Avant | _onRollTalent triggered!', { event, target });
            alert('Roll Talent Action Triggered!');
            event.preventDefault();
        }

        /**
         * 🔧 AUGMENT FEATURE CARD HANDLER - CYBERNETIC ENHANCEMENT SYSTEM
         * 
         * This handler posts rich, interactive augment cards to chat, parallel to the talent system.
         * Augments represent cybernetic/technological enhancements in the Avant universe.
         * 
         * AUGMENT-SPECIFIC FEATURES:
         * 1. Augment Type Display: Shows augment category (cybernetic, bioware, etc.)
         * 2. Rarity Integration: Displays rarity (common, rare, legendary) with styling
         * 3. Prerequisites: Shows required levels, stats, or other augments
         * 4. Power Point Costs: Many augments require PP to activate
         * 
         * SHARED FEATURE CARD SYSTEM:
         * - Uses the same feature-card-builder.ts as talents for consistency
         * - Trait system integration for augment classifications
         * - Power Point validation and spending functionality
         * - Professional styling with accessibility features
         * 
         * TECHNICAL IMPLEMENTATION:
         * - Identical to _onUseTalent but for augment item type
         * - Same ApplicationV2 action registration requirements
         * - Same dynamic import pattern for dependency management
         * - Same error handling and user feedback patterns
         * 
         * USER EXPERIENCE:
         * - Click the chat button (💬) on any augment in the actor sheet
         * - Rich card appears in chat with full augment details
         * - Interactive PP spending buttons (if applicable)
         * - Trait chips show augment classifications
         * - Professional styling matches talent cards
         * 
         * @param event - The originating click event
         * @param target - The target element (contains data-item-id)
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onUseAugment(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            console.log('🎯 Avant | _onUseAugment triggered!', { event, target });
            event.preventDefault();
            
            const sheet = this;
            if (!sheet?.document) return;

            // Extract augment item ID from the button's data attributes
            const itemId = extractItemIdFromElement(target);
            if (!itemId) {
                logger.warn('AvantActorSheet | No item ID for augment use');
                return;
            }

            // Get the augment item from the actor
            const item = sheet.document.items.get(itemId);
            if (!item) {
                FoundryUI.notify('Augment not found', 'warn');
                return;
            }

            try {
                console.log('🎯 Avant | Posting augment feature card for:', item.name);
                
                // 🔧 DYNAMIC IMPORT PATTERN - Consistent with talent handler
                // Same module loading strategy for maintainability
                const { postFeatureCard } = await import('../logic/chat/feature-card-builder.js');
                const { TraitProvider } = await import('../services/trait-provider.js');
                
                // Initialize trait provider for augment trait resolution
                const traitProvider = new TraitProvider();
                
                // 💬 POST AUGMENT FEATURE CARD - Same core functionality as talents
                // The feature card builder automatically handles augment-specific display:
                // - Augment type and rarity
                // - Prerequisites and requirements
                // - Power point costs and spending
                // - Trait classifications and styling
                const result = await postFeatureCard(item, sheet.document, traitProvider);
                
                if (result.success) {
                    logger.info('Avant | Augment feature card posted successfully:', result.messageId);
                    FoundryUI.notify(`Posted augment card for ${item.name}`, 'info');
                } else {
                    logger.error('Avant | Failed to post augment feature card:', result.error);
                    FoundryUI.notify('Failed to post augment card', 'error');
                }
                
            } catch (error) {
                logger.error('Avant | Error in _onUseAugment:', error);
                FoundryUI.notify('Error posting augment card', 'error');
            }
        }

        /**
         * 🔋 DIRECT PP SPEND HANDLER - INSTANT AUGMENT ACTIVATION
         * 
         * This handler provides direct PP spending from the actor sheet without requiring
         * a separate chat card interaction. It spends the PP immediately and posts an
         * augment card showing "Spent X PP" to confirm the transaction.
         * 
         * DIRECT SPEND WORKFLOW:
         * 1. Validates PP cost and actor's current PP
         * 2. Spends PP directly from the actor
         * 3. Posts augment card with "Spent X PP" confirmation
         * 4. Provides immediate user feedback
         * 
         * UX BENEFITS:
         * - Single-click PP spending from sheet
         * - Immediate feedback and confirmation
         * - No need to open chat cards first
         * - Streamlined gameplay experience
         * 
         * TECHNICAL FEATURES:
         * - Full PP validation and ownership checking
         * - Error handling with user notifications
         * - Integration with existing feature card system
         * - "Already spent" mode for card display
         * 
         * @param event - The originating click event
         * @param target - The PP spend button element (contains data-item-id and data-pp-cost)
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onSpendAugmentPP(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            console.log('🔋 Avant | _onSpendAugmentPP triggered!', { event, target });
            event.preventDefault();
            
            const sheet = this;
            if (!sheet?.document) return;

            // Extract augment data from button attributes
            const itemId = target.dataset.itemId || target.getAttribute('data-item-id');
            const ppCostStr = target.dataset.ppCost || target.getAttribute('data-pp-cost');
            const ppCost = parseInt(ppCostStr || '0');

            if (!itemId) {
                logger.warn('AvantActorSheet | No item ID for PP spend');
                FoundryUI.notify('Augment not found', 'warn');
                return;
            }

            if (ppCost <= 0) {
                logger.warn('AvantActorSheet | Invalid PP cost for spend:', ppCost);
                FoundryUI.notify('Invalid power point cost', 'warn');
                return;
            }

            // Get the augment item
            const item = sheet.document.items.get(itemId);
            if (!item) {
                FoundryUI.notify('Augment not found', 'warn');
                return;
            }

            // Disable the button during processing
            const button = target as HTMLButtonElement;
            const originalText = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            try {
                console.log('🔋 Avant | Processing PP spend for:', item.name, 'Cost:', ppCost);
                
                // Import required modules
                const { handlePowerPointSpend } = await import('../logic/chat/power-point-handler.js');
                const { postFeatureCard } = await import('../logic/chat/feature-card-builder.js');
                const { TraitProvider } = await import('../services/trait-provider.js');
                
                // Spend the power points
                const game = (globalThis as any).game;
                const spendResult = await handlePowerPointSpend(sheet.document, ppCost, game.user);
                
                if (!spendResult.success) {
                    // PP spend failed - show error and re-enable button
                    FoundryUI.notify(spendResult.error || 'Failed to spend power points', 'warn');
                    button.disabled = false;
                    button.innerHTML = originalText;
                    return;
                }

                // PP spent successfully - update button to show spent state
                // 🎓 COORDINATION LESSON: This HTML structure must match feature-card-builder.ts 
                // and power-point-handler.ts EXACTLY. We discovered during development that
                // users expect consistent visual feedback regardless of WHERE they spend PP from.
                button.classList.add('spent');
                button.innerHTML = '<i class="fas fa-check-circle" aria-hidden="true"></i>Spent ' + ppCost + ' PP';
                button.disabled = true;
                
                // Show success notification
                FoundryUI.notify(
                    `${sheet.document.name} spent ${ppCost} PP for ${item.name}. Remaining: ${spendResult.newValue}`,
                    'info'
                );

                // Post augment card with "Spent X PP" message
                const traitProvider = new TraitProvider();
                const cardResult = await postFeatureCard(
                    item, 
                    sheet.document, 
                    traitProvider, 
                    { alreadySpent: ppCost } // Pass spent amount to feature card
                );
                
                if (cardResult.success) {
                    console.log('🔋 Avant | Augment card posted with spent PP confirmation');
                } else {
                    logger.warn('Avant | Failed to post augment card after PP spend:', cardResult.error);
                }

            } catch (error) {
                logger.error('Avant | Error in _onSpendAugmentPP:', error);
                FoundryUI.notify('Error spending power points', 'error');
                
                // Re-enable button on error
                button.disabled = false;
                button.innerHTML = originalText;
            }
        }

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
         * Initialize ApplicationV2 options for the actor sheet
         * @param options - User provided options
         * @returns Initialized options
         */
        static _initializeApplicationOptions(options: Partial<any>): any {
            console.log('🔧 Avant | Actor sheet initializing with DEFAULT_OPTIONS.actions:', this.DEFAULT_OPTIONS.actions);
            const result = super._initializeApplicationOptions(options);
            console.log('🔧 Avant | Actor sheet initialized with final options:', result);
            return result;
        }

        /**
         * Simple test action to verify ApplicationV2 actions work
         * @param event - The originating click event
         * @param target - The target element
         * @this {AvantActorSheet} The ApplicationV2 instance (bound automatically)
         */
        static async _onTestAction(this: AvantActorSheet, event: Event, target: HTMLElement): Promise<void> {
            console.log('🎯 Avant | TEST ACTION TRIGGERED! SUCCESS!', { event, target });
            alert('TEST ACTION WORKED! This proves ApplicationV2 actions are functioning.');
            event.preventDefault();
        }
    }
    
    return AvantActorSheet;
}

// Note: The actual AvantActorSheet class is created by the createAvantActorSheet() factory function
// when called by the initialization system. This ensures Foundry classes are available. 