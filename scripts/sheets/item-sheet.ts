/**
 * @fileoverview Item Sheet for Avant Native System
 * @version 2.0.0 - FoundryVTT v13+ ApplicationV2
 * @author Avant Development Team
 * @description Item sheet using ApplicationV2 framework for native v13 implementation
 * 
 * ================================================================================================
 * CRITICAL ApplicationV2 FORM HANDLING DOCUMENTATION
 * ================================================================================================
 * 
 * This file contains essential patterns for ApplicationV2 form handling that differ significantly
 * from the legacy Application class. Future developers MUST understand these patterns to avoid
 * the form data extraction issues that have repeatedly caused problems.
 * 
 * KEY APPLICATIONV2 DIFFERENCES:
 * 1. Form Structure: ApplicationV2 creates nested forms (outer frame + inner content)
 * 2. Data Extraction: _prepareSubmitData signature and behavior completely different
 * 3. Action Handlers: New delegation system with specific binding requirements
 * 4. Template Integration: Parts-based rendering with different HTML expectations
 * 
 * COMMON PITFALLS TO AVOID:
 * - Assuming form parameter in _prepareSubmitData is the content form (it's often the frame)
 * - Using arrow functions in action handlers (breaks 'this' binding)
 * - Not handling multiple form data structures (FormData, FormDataExtended, plain objects)
 * - Forgetting to extract data from actual content form when frame form is empty
 * 
 * WHEN ADDING NEW FORM FIELDS:
 * 1. Add the field to the template with proper name attribute
 * 2. Test that _prepareSubmitData captures the field (check debug logs)
 * 3. If field isn't captured, verify it's in the content form, not just the frame
 * 4. Update the data model schema if needed (for persistence)
 * 5. Add validation if the field is critical
 * 
 * See _prepareSubmitData method below for the complete solution to nested form issues.
 * ================================================================================================
 */

import { ValidationUtils } from '../utils/validation.js';
import { executeRoll, processFormData } from '../logic/item-sheet.ts';
import { prepareTemplateData, extractItemFormData, prepareItemHeaderMetaFields, prepareItemBodyFields } from '../logic/item-sheet-utils.js';
import { logger } from '../utils/logger.js';
import { initializeApSelector } from './ap-selector-handler';

// Import new modular functions
import {
    extractFormData,
    shouldBlockSubmission,
    validateCriticalFields,
    DEFAULT_FORM_CONFIG,
    type FormExtractionConfig
} from '../logic/item-form.js';

import {
    extractDragData,
    validateTraitDrop,
    processTraitDrop,
    DEFAULT_DRAG_EXTRACTION_CONFIG
} from '../logic/drag-drop/item-trait.js';

// Import trait utilities
// DEPRECATION NOTICE: Trait input imports moved to deprecated folder
// These imports are stubbed to maintain build compatibility
// See: deprecated/trait-input-system/ for original implementations
import { addTraitToList, removeTraitFromList, validateTraitList } from '../logic/trait-utils.ts';
import { renderTraitSuggestion } from '../logic/chat/trait-renderer.ts';

// Import trait integration utilities for chat messages
import { createTraitHtmlForChat, itemHasTraits } from '../logic/chat/trait-resolver.ts';

// Import local foundry UI adapter for safe notifications
import { FoundryUI } from '../types/adapters/foundry-ui.ts';

// Import new Phase 4 context preparation modules
import {
    prepareCompleteContext,
    type ItemDataForContext,
    type ContextPreparationConfig,
    DEFAULT_CONTEXT_CONFIG
} from '../logic/context-preparation.js';

import {
    prepareTraitDisplayData,
    type ItemContextForTraits,
    type TraitDataPreparationConfig,
    DEFAULT_TRAIT_DATA_CONFIG
} from '../logic/trait-data-preparation.js';

import {
    generateTraitSuggestions as generateTraitSuggestionsModular,
    type ItemContextForSuggestions,
    type TraitSuggestionConfig,
    DEFAULT_TRAIT_SUGGESTION_CONFIG
} from '../logic/trait-suggestions.js';

import {
    logRenderDebugInfo,
    logPostRenderDebugInfo,
    createPerformanceTimer,
    DEFAULT_DEBUG_CONFIG
} from '../utils/debug-utilities.js';

/**
 * Get FoundryVTT v13 ApplicationV2 classes safely
 * 
 * ApplicationV2 classes are only available after FoundryVTT has fully loaded,
 * so we need to access them dynamically rather than importing them.
 * 
 * @returns The required base classes for ApplicationV2
 * @throws {Error} If ApplicationV2 classes are not available
 */
function getFoundryV13Classes() {
    const foundryGlobal = (globalThis as any).foundry;

    if (!foundryGlobal?.applications?.api) {
        throw new Error('FoundryVTT v13 ApplicationV2 classes not available - ensure you are running FoundryVTT v13+ and that Foundry has finished loading');
    }

    const { ApplicationV2, HandlebarsApplicationMixin, DocumentSheetV2 } = foundryGlobal.applications.api;

    if (!ApplicationV2 || !HandlebarsApplicationMixin || !DocumentSheetV2) {
        throw new Error('Required ApplicationV2 classes not found - ensure you are running FoundryVTT v13+');
    }

    return { ApplicationV2, HandlebarsApplicationMixin, DocumentSheetV2 };
}

/**
 * Item Sheet Context interface for template rendering
 * 
 * This interface defines the expected structure of data passed to item sheet templates.
 * When adding new fields to item sheets, ensure they're included in this interface.
 */
interface ItemSheetContext {
    item: any;
    system: any;
    flags: any;
    editable: boolean;
    owner: boolean;
    enrichedDescription: string;
    displayTraits: any[];
    // Add new fields here when extending item sheet functionality
}

/**
 * Factory function to create the AvantItemSheet class when Foundry is ready
 * 
 * This pattern ensures that ApplicationV2 classes are available before trying to extend them.
 * The factory approach prevents class definition errors during system initialization.
 * 
 * @returns The AvantItemSheet class
 */
export function createAvantItemSheet() {
    // Get the base classes when they're available
    const { HandlebarsApplicationMixin, DocumentSheetV2 } = getFoundryV13Classes();

    /**
     * Item Sheet for Avant Native System - FoundryVTT v13+ ApplicationV2
     * 
     * ============================================================================================
     * APPLICATIONV2 ARCHITECTURE OVERVIEW
     * ============================================================================================
     * 
     * This class extends HandlebarsApplicationMixin(DocumentSheetV2) which provides:
     * - Modern event handling via action delegation
     * - Parts-based template rendering
     * - Improved form handling (but with gotchas - see _prepareSubmitData)
     * - Better lifecycle management
     * 
     * CRITICAL DIFFERENCES FROM v1:
     * 1. NO _onSubmit override - use _prepareSubmitData instead
     * 2. Action handlers defined in static DEFAULT_OPTIONS.actions
     * 3. Template rendering uses parts configuration
     * 4. Form structure is more complex (nested forms)
     * 
     * ADDING NEW FUNCTIONALITY:
     * 1. Form fields: Add to template, ensure proper name attributes
     * 2. Actions: Add to DEFAULT_OPTIONS.actions with proper binding
     * 3. Event handling: Use action delegation when possible
     * 4. Data processing: Extend _prepareSubmitData if needed
     * 
     * @class AvantItemSheet
     * @extends {HandlebarsApplicationMixin(DocumentSheetV2)}
     * @description Modern ApplicationV2 implementation with native v13 support
     */
    class AvantItemSheet extends HandlebarsApplicationMixin(DocumentSheetV2) {
        /** The item document associated with this sheet */
        declare document: any;

        /** 
         * @deprecated Trait input state has been deprecated
         * Original implementation in deprecated/trait-input-system/logic/item-sheet-trait-input.ts
         */
        private traitInputState: {
            availableTraits: any[];
            currentInput: string;
            selectedIndex: number;
            isDropdownOpen: boolean;
        } = {
                availableTraits: [],
                currentInput: '',
                selectedIndex: -1,
                isDropdownOpen: false
            };

        /** Store original submitOnChange setting for restoration */
        private _originalSubmitOnChange: boolean = true;

        /** Flag to temporarily disable automatic form submission */
        private _blockAutoSubmit: boolean = false;

        /**
         * ApplicationV2 default options configuration
         * 
         * ========================================================================================
         * APPLICATIONV2 CONFIGURATION GUIDE
         * ========================================================================================
         * 
         * This static configuration object defines the behavior of the ApplicationV2 sheet.
         * Each section has specific purposes and requirements:
         * 
         * CLASSES: CSS classes applied to the application element
         * - Used for styling and theme integration
         * - Should include system identifier ("avant") for theme compatibility
         * 
         * FORM CONFIGURATION:
         * - submitOnChange: Auto-submit when fields change (useful for real-time updates)
         * - closeOnSubmit: Whether to close sheet after form submission
         * 
         * ACTIONS: Event delegation for DOM interactions
         * - Key pattern: actions map DOM data-action attributes to methods
         * - CRITICAL: Use regular functions, NOT arrow functions (for proper 'this' binding)
         * - Each action receives (event, target) parameters
         * 
         * WINDOW: Application window behavior
         * - Controls title, icon, resizing, positioning
         * - Controls can be customized (close, minimize, etc.)
         * 
         * @static
         */
        static DEFAULT_OPTIONS = {
            classes: ["avant", "sheet", "item"],
            // Essential ApplicationV2 configuration
            tag: "form",
            hasFrame: true,
            resizable: true,
            positioned: true,
            position: {
                width: 520,
                height: 480
            },
            window: {
                icon: "fas fa-cog",
                title: "Item Sheet",
                controls: []
            },
            form: {
                submitOnChange: true,    // Auto-submit when fields change
                closeOnSubmit: false     // Keep sheet open after submission
            },
            actions: {
                // ================================================================================
                // APPLICATIONV2 ACTION HANDLER PATTERNS
                // ================================================================================
                // 
                // Action handlers are the modern way to handle DOM events in ApplicationV2.
                // They replace the old activateListeners pattern with a cleaner delegation system.
                // 
                // CRITICAL RULES FOR ACTION HANDLERS:
                // 1. Use regular function syntax for proper 'this' binding
                // 2. Arrow functions will NOT have correct 'this' context
                // 3. First parameter is always the event
                // 4. Second parameter is the target element
                // 5. Return value can be a Promise for async operations
                // 
                // CONNECTING TO DOM:
                // - Add data-action="actionName" to HTML elements
                // - ApplicationV2 automatically routes clicks to these handlers
                // - Works with any clickable element (buttons, links, etc.)
                // 
                // EXAMPLES:
                // Template: <button data-action="roll" data-roll-type="damage">Roll Damage</button>
                // Handler: roll: function(event, target) { /* 'this' is the sheet instance */ }
                // 
                // ================================================================================

                // Image Upload Handler - connects to data-edit="img" elements
                editImage: function (this: AvantItemSheet, event: Event, target: HTMLElement) {
                    // Direct delegation to instance method - 'this' is automatically bound by ApplicationV2
                    return this.onEditImage(event, target);
                },

                roll: function (this: AvantItemSheet, event: Event, target: HTMLElement) {
                    // Direct delegation to instance method - 'this' is automatically bound by ApplicationV2
                    return this.onRoll(event, target);
                },

                /**
                 * CRITICAL ApplicationV2 Pattern: Trait Removal Action Handler
                 * 
                 * This action handler demonstrates the correct ApplicationV2 pattern for binding
                 * actions to DOM elements. Key points for future developers:
                 * 
                 * 1. MUST use regular function syntax, NOT arrow functions
                 *    - ApplicationV2 automatically binds 'this' to the sheet instance for regular functions
                 *    - Arrow functions do NOT get 'this' binding and will fail
                 * 
                 * 2. TypeScript typing: function(this: AvantItemSheet, ...)
                 *    - Explicitly declares 'this' type for type safety
                 *    - Enables IntelliSense and compile-time checking
                 * 
                 * 3. Connected via data-action="removeTrait" in templates
                 *    - All item sheet templates have <button data-action="removeTrait">
                 *    - ApplicationV2 automatically routes clicks to this handler
                 * 
                 * 4. Works across all item types (weapon, armor, talent, etc.)
                 *    - Single handler serves all templates due to consistent markup
                 * 
                 * HOW TO ADD NEW ACTION HANDLERS:
                 * 1. Add the action to this object with regular function syntax
                 * 2. Add data-action="yourActionName" to template elements
                 * 3. Implement the handler logic in the method body
                 * 4. Test that 'this' refers to the sheet instance
                 * 
                 * @param event - The DOM click event from the remove button
                 * @param target - The button element that was clicked
                 * @returns Result of the onRemoveTrait method call
                 */
                removeTrait: function (this: AvantItemSheet, event: Event, target: HTMLElement) {
                    // Direct delegation to instance method - 'this' is automatically bound by ApplicationV2
                    return this.onRemoveTrait(event, target);
                },

                // DEPRECATED: Trait input action handlers moved to deprecated/trait-input-system/
                // These handlers are stubbed to maintain build compatibility
                traitFieldClick: function (this: AvantItemSheet, event: Event, target: HTMLElement) {
                    console.warn('Trait input system is deprecated. Use drag-and-drop instead.');
                    return Promise.resolve();
                },
                traitSuggestionClick: function (this: AvantItemSheet, event: Event, target: HTMLElement) {
                    console.warn('Trait input system is deprecated. Use drag-and-drop instead.');
                    return Promise.resolve();
                },
                tagExampleClick: function (this: AvantItemSheet, event: Event, target: HTMLElement) {
                    // Direct delegation to instance method - 'this' is automatically bound by ApplicationV2
                    return this.onTagExampleClick(event, target);
                }
            }
        };

        /**
         * ApplicationV2 parts configuration for templates
         * 
         * The PARTS configuration tells ApplicationV2 how to render the application.
         * This is different from v1 where you just specified a single template.
         * 
         * PARTS STRUCTURE:
         * - Each part has a name (key) and configuration (value)
         * - Template property specifies the Handlebars template to use
         * - Parts can be conditionally rendered based on application state
         * 
         * DYNAMIC PARTS:
         * - Override the 'parts' getter for dynamic template selection
         * - Useful for different templates based on item type or state
         * 
         * @static
         */
        static PARTS = {
            form: {
                template: "systems/avant/templates/item-sheet.html"
            }
        };

        /**
         * Dynamic parts configuration based on item type
         * 
         * EMERGENCY FIX: Using specific templates instead of universal aggregator
         * The universal template system has multiple failure points causing blank forms.
         * 
         * TEMPLATE STRATEGY:
         * - Use specific template for each item type (item-{type}-new.html)
         * - These templates contain working form fields with proper system.* names
         * - Fallback to universal template if specific template doesn't exist
         * 
         * @override
         */
        get parts() {
            // Phase 4: Hard Switch - Universal template only
            // All per-item templates have been removed, only universal template remains
            return {
                form: {
                    template: "systems/avant/templates/item-sheet.html"
                }
            };
        }

        /**
         * Tab configuration for the item sheet
         * 
         * ApplicationV2 doesn't automatically handle tab switching like v1,
         * so we need to manage tab state manually.
         */
        tabGroups = {
            sheet: "description"
        };

        /**
         * Current active tab to preserve state across renders
         * @private
         */
        private _currentTab: string = "description";

        /**
         * Flag to track if theme has been applied to prevent repeated applications
         * @private
         */
        private _themeApplied: boolean = false;

        /**
         * Get the item document (compatibility accessor)
         * 
         * Provides backward compatibility for code that expects .item property
         * instead of .document property.
         */
        get item() {
            return this.document;
        }

        /**
         * Get the sheet title
         * 
         * ApplicationV2 uses this for window title display.
         * Include item type in title for better user experience.
         */
        get title() {
            const game = (globalThis as any).game;
            const title = this.document?.name || game?.i18n?.localize("SHEETS.ItemSheet") || "Item Sheet";
            return `${title} [${this.document?.type || "Item"}]`;
        }

        // REMOVED: Conflicting template getter that was causing ApplicationV2 template loading issues
        // The parts configuration above provides the correct template path for each item type

        /**
         * Prepare context data for rendering the item sheet
         * 
         * ================================================================================
         * CONTEXT PREPARATION GUIDE
         * ================================================================================
         * 
         * This method prepares all data needed for template rendering. It's called
         * automatically by ApplicationV2 before rendering and should return an object
         * containing all template variables.
         * 
         * CONTEXT PREPARATION STEPS:
         * 1. Call super._prepareContext() to get base ApplicationV2 context
         * 2. Extract item data using toObject(false) for current state
         * 3. Use pure functions to transform data for template use
         * 4. Add ApplicationV2-specific fields (editable, owner, etc.)
         * 5. Pre-process any complex data (enriched HTML, trait displays, etc.)
         * 
         * WHEN ADDING NEW FIELDS:
         * 1. Add the field to the context object
         * 2. Update the ItemSheetContext interface if needed
         * 3. Ensure the field is available in templates
         * 4. Test that the field renders correctly
         * 
         * @param options - Rendering options
         * @returns The context data for template rendering
         * @override
         */
        /**
         * PHASE 4 THIN WRAPPER
         * 
         * Prepare context for template rendering using modular pure functions
         * 
         * This method is now a thin wrapper that orchestrates pure functions
         * for context preparation, making it more testable and maintainable.
         */
        async _prepareContext(options: any): Promise<ItemSheetContext> {
            logger.debug('AvantItemSheet | _prepareContext called', {
                itemId: this.document?.id,
                itemType: this.document?.type,
                itemName: this.document?.name
            });

            try {
                // Get base ApplicationV2 context
                const baseContext = await super._prepareContext(options) as any;
                const itemData = this.document.toObject(false);

                // Prepare item data for context preparation
                const itemDataForContext: ItemDataForContext = {
                    id: this.document.id,
                    type: this.document.type,
                    name: this.document.name,
                    system: itemData.system || {},
                    flags: itemData.flags || {},
                    isEditable: this.isEditable,
                    isOwner: this.document.isOwner
                };

                // Prepare trait display data using modular functions
                const traitContext: ItemContextForTraits = {
                    id: this.document.id,
                    name: this.document.name,
                    type: this.document.type,
                    traitIds: itemData.system?.traits || []
                };

                const traitDataResult = await prepareTraitDisplayData(traitContext, DEFAULT_TRAIT_DATA_CONFIG);
                const displayTraits = traitDataResult.success ? traitDataResult.traits : [];
                // Use pure function to prepare complete context
                const contextResult = await prepareCompleteContext(
                    itemDataForContext,
                    baseContext,
                    displayTraits,
                    DEFAULT_CONTEXT_CONFIG
                );

                if (contextResult.success) {
                    // Add type-specific options if needed
                    const context = contextResult.context!;
                    if (itemData.type === 'augment') {
                        context.rarityOptions = this._prepareRarityOptions();
                        context.augmentTypeOptions = this._prepareAugmentTypeOptions();
                    }

                    logger.debug('AvantItemSheet | Context preparation complete:', {
                        finalContextKeys: Object.keys(context),
                        systemKeys: Object.keys(context.system || {}),
                        traitsCount: context.displayTraits?.length || 0,
                        hasTraits: !!(context.displayTraits && context.displayTraits.length > 0),
                        processingTimeMs: contextResult.metadata.processingTimeMs
                    });

                    return context;
                } else {
                    logger.error('AvantItemSheet | Context preparation failed:', contextResult.error);
                    // Return minimal fallback context
                    return this._createFallbackContext(baseContext, itemData);
                }

            } catch (error) {
                logger.error('AvantItemSheet | Error in _prepareContext:', error);
                // Return minimal fallback context
                const itemData = this.document.toObject(false);
                const baseContext = { item: itemData };
                return this._createFallbackContext(baseContext, itemData);
            }
        }

        /**
         * PHASE 4 UTILITY METHOD
         * 
         * Create fallback context when preparation fails
         * 
         * @param baseContext - Base context from ApplicationV2
         * @param itemData - Item data object
         * @returns Minimal fallback context
         */
        private _createFallbackContext(baseContext: any, itemData: any): ItemSheetContext {
            return {
                ...baseContext,
                item: itemData,
                system: itemData.system || {},
                flags: itemData.flags || {},
                editable: this.isEditable,
                owner: this.document.isOwner,
                enrichedDescription: itemData.system?.description || '',
                displayTraits: [],
                metaFields: [],
                bodyFields: []
            };
        }

        /**
         * PHASE 4 THIN WRAPPER
         * 
         * Prepare trait display data for template rendering using modular pure functions
         * 
         * This method is now a thin wrapper that delegates to the modular trait data
         * preparation system, making it more testable and maintainable.
         */
        private async _prepareTraitDisplayData(): Promise<any[]> {
            const traitContext: ItemContextForTraits = {
                id: this.document.id,
                name: this.document.name,
                type: this.document.type,
                traitIds: this.document?.system?.traits || []
            };

            const result = await prepareTraitDisplayData(traitContext, DEFAULT_TRAIT_DATA_CONFIG);
            return result.success ? result.traits : [];
        }

        /**
         * Generate a fallback display name from a trait ID
         * 
         * This method handles various trait ID formats and creates user-friendly names:
         * - "fire" → "Fire"
         * - "system_trait_fire" → "Fire"
         * - "avant-trait-fire" → "Fire"
         * - "fROYGUX93Sy3aqgM" → "Custom Trait"
         * - "Fire" → "Fire" (already readable)
         * 
         * @param traitId - The trait ID to generate a name from
         * @private
         */
        private _generateFallbackTraitName(traitId: string): string {
            // Handle empty or invalid IDs
            if (!traitId || typeof traitId !== 'string') {
                return 'Unknown Trait';
            }

            // Handle already readable names (common case)
            if (traitId.match(/^[A-Z][a-z]+$/)) {
                return traitId;
            }

            // Handle system trait prefixes
            if (traitId.startsWith('system_trait_')) {
                return traitId
                    .replace(/^system_trait_/, '')
                    .replace(/_\d+$/, '')
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());
            }

            // Handle avant trait prefixes
            if (traitId.startsWith('avant-trait-')) {
                return traitId
                    .replace(/^avant-trait-/, '')
                    .replace(/-\d+$/, '')
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());
            }

            // Handle common single-word trait names
            if (traitId.match(/^[a-z]+$/)) {
                return traitId.charAt(0).toUpperCase() + traitId.slice(1);
            }

            // Handle kebab-case or underscore-case
            if (traitId.includes('-') || traitId.includes('_')) {
                return traitId
                    .replace(/[-_]/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());
            }

            // Handle long random IDs (likely UUIDs or generated IDs)
            if (traitId.length > 10 && traitId.match(/^[a-zA-Z0-9]+$/)) {
                return 'Custom Trait';
            }

            // Handle camelCase
            if (traitId.match(/^[a-z][a-zA-Z]+$/)) {
                return traitId.replace(/([A-Z])/g, ' $1').replace(/\b\w/g, l => l.toUpperCase());
            }

            // Fallback: return the original ID with first letter capitalized
            return traitId.charAt(0).toUpperCase() + traitId.slice(1);
        }

        /**
         * Generate fallback colors and icon for a trait based on its ID or name
         * 
         * This method provides visually appealing colors instead of generic gray,
         * making traits more identifiable even when the TraitProvider isn't available.
         * 
         * @param traitId - The trait ID
         * @param traitName - The generated trait name
         * @returns Object with background color, text color, and icon
         * @private
         */
        private _generateFallbackTraitColor(traitId: string, traitName: string): { background: string, text: string, icon: string } {
            // Define color palette for fallback traits
            const colorPalette = [
                { background: '#FF6B6B', text: '#FFFFFF', icon: 'fas fa-fire' },      // Red/Fire
                { background: '#4ECDC4', text: '#FFFFFF', icon: 'fas fa-snowflake' }, // Teal/Ice
                { background: '#45B7D1', text: '#FFFFFF', icon: 'fas fa-bolt' },      // Blue/Lightning
                { background: '#96CEB4', text: '#FFFFFF', icon: 'fas fa-leaf' },      // Green/Nature
                { background: '#FECA57', text: '#FFFFFF', icon: 'fas fa-sun' },       // Yellow/Light
                { background: '#8B7EC8', text: '#FFFFFF', icon: 'fas fa-magic' },     // Purple/Arcane
                { background: '#F8B500', text: '#FFFFFF', icon: 'fas fa-cog' },       // Orange/Tech
                { background: '#2C3E50', text: '#FFFFFF', icon: 'fas fa-shield-alt' } // Dark/Defense
            ];

            // Check for specific trait name patterns to assign themed colors
            const lowerName = traitName.toLowerCase();
            const lowerID = traitId.toLowerCase();

            // Fire-themed traits
            if (lowerName.includes('fire') || lowerID.includes('fire') || lowerName.includes('flame') || lowerName.includes('burn')) {
                return colorPalette[0]; // Red/Fire
            }

            // Ice/Cold-themed traits
            if (lowerName.includes('ice') || lowerID.includes('ice') || lowerName.includes('cold') || lowerName.includes('frost')) {
                return colorPalette[1]; // Teal/Ice
            }

            // Lightning/Electric-themed traits
            if (lowerName.includes('lightning') || lowerID.includes('lightning') || lowerName.includes('electric') || lowerName.includes('shock')) {
                return colorPalette[2]; // Blue/Lightning
            }

            // Nature/Earth-themed traits
            if (lowerName.includes('nature') || lowerID.includes('nature') || lowerName.includes('earth') || lowerName.includes('plant')) {
                return colorPalette[3]; // Green/Nature
            }

            // Light/Holy-themed traits
            if (lowerName.includes('light') || lowerID.includes('light') || lowerName.includes('holy') || lowerName.includes('divine')) {
                return colorPalette[4]; // Yellow/Light
            }

            // Magic/Arcane-themed traits
            if (lowerName.includes('magic') || lowerID.includes('magic') || lowerName.includes('arcane') || lowerName.includes('mystical')) {
                return colorPalette[5]; // Purple/Arcane
            }

            // Tech/Mechanical-themed traits
            if (lowerName.includes('tech') || lowerID.includes('tech') || lowerName.includes('cyber') || lowerName.includes('mech')) {
                return colorPalette[6]; // Orange/Tech
            }

            // Defense/Protection-themed traits
            if (lowerName.includes('defense') || lowerID.includes('defense') || lowerName.includes('protect') || lowerName.includes('shield')) {
                return colorPalette[7]; // Dark/Defense
            }

            // For traits that don't match any theme, use a hash-based color selection
            // This ensures consistent colors for the same trait across different contexts
            let hash = 0;
            const str = traitId + traitName;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash = hash & hash; // Convert to 32-bit integer
            }

            const colorIndex = Math.abs(hash) % colorPalette.length;
            return colorPalette[colorIndex];
        }

        /**
         * PHASE 4 THIN WRAPPER
         * 
         * Render HTML content with modular debugging utilities
         * 
         * This method is now a thin wrapper that uses modular debugging utilities
         * for comprehensive template and context investigation.
         */
        async _renderHTML(context: any, options: any): Promise<string> {
            // Create performance timer for render operation
            const renderTimer = createPerformanceTimer('_renderHTML', DEFAULT_DEBUG_CONFIG);
            renderTimer.start();

            try {
                // Use modular debug utilities for comprehensive investigation
                logRenderDebugInfo(this, context, options, DEFAULT_DEBUG_CONFIG);

                // Call parent's _renderHTML
                const html = await super._renderHTML(context, options);

                // Log post-render debug information
                const processingTime = renderTimer.stop();
                logPostRenderDebugInfo(this, context, html, processingTime, DEFAULT_DEBUG_CONFIG);

                return html;
            } catch (error) {
                renderTimer.stop();
                logger.error('AvantItemSheet | Error in _renderHTML:', error);
                throw error;
            }
        }

        /**
         * Override _replaceHTML to properly handle content insertion for ApplicationV2
         * @param result - The rendered HTML result
         * @param content - The content element to insert into  
         * @param options - Rendering options
         * @override
         */
        _replaceHTML(result: any, content: HTMLElement, options: any): void {
            logger.debug('AvantItemSheet | _replaceHTML called', {
                resultKeys: Object.keys(result || {}),
                contentType: content?.tagName,
                contentClass: content?.className,
                contentChildren: content?.children?.length || 0,
                hasFormInResult: !!(result as any)?.form,
                formElementDetails: {
                    tagName: (result as any)?.form?.tagName,
                    className: (result as any)?.form?.className,
                    hasContent: !!((result as any)?.form?.innerHTML),
                    contentLength: (result as any)?.form?.innerHTML?.length || 0
                }
            });

            try {
                // ApplicationV2 expects result.form to be the rendered content
                const formElement = (result as any)?.form;

                if (!formElement) {
                    logger.error('AvantItemSheet | No form element in render result');
                    return;
                }

                // Clear existing content
                content.innerHTML = '';

                // Insert the form content directly
                content.appendChild(formElement);

                logger.debug('AvantItemSheet | After _replaceHTML', {
                    contentChildren: content.children.length,
                    hasForm: !!content.querySelector('div[data-application-part="form"]'),
                    contentHTML: content.innerHTML.substring(0, 200) + '...'
                });

            } catch (error) {
                logger.error('AvantItemSheet | _replaceHTML failed:', error);

                // Fallback: try the super method
                try {
                    super._replaceHTML(result, content, options);
                } catch (fallbackError) {
                    logger.error('AvantItemSheet | Fallback _replaceHTML also failed:', fallbackError);
                }
            }
        }

        /**
         * Handle rendering completion - replaces activateListeners
         * @param context - The prepared context data
         * @param options - Rendering options
         * @override
         */
        _onRender(context: ItemSheetContext, options: any): void {
            super._onRender(context, options);

            // Detailed debugging of actual DOM content
            const windowContent = this.element?.querySelector('.window-content');
            const formElement = this.element?.querySelector('.item-sheet');
            const divForm = this.element?.querySelector('div[data-application-part="form"]');

            logger.debug('AvantItemSheet | _onRender - DETAILED DOM ANALYSIS', {
                itemId: this.document.id,
                itemType: this.document.type,

                // Element structure
                elementExists: !!this.element,
                elementChildren: this.element?.children.length || 0,
                elementTagName: this.element?.tagName,
                elementClasses: this.element?.className,

                // Window content investigation  
                windowContentExists: !!windowContent,
                windowContentChildren: windowContent?.children.length || 0,
                windowContentHTML: windowContent ? windowContent.innerHTML.substring(0, 500) + '...' : 'no window-content',
                windowContentClasses: windowContent?.className || 'no window-content',

                // Form element investigation
                hasItemSheetDiv: !!formElement,
                hasApplicationPartForm: !!divForm,
                formElementClass: formElement?.className || 'not found',
                formElementTag: formElement?.tagName || 'not found',

                // Content validation
                actualContentPresent: windowContent && windowContent.children.length > 0,
                firstChildTag: windowContent?.children[0]?.tagName || 'no first child',
                firstChildClass: windowContent?.children[0]?.className || 'no first child',

                // Visibility check
                windowContentStyle: windowContent ? getComputedStyle(windowContent).display : 'no element',
                formElementStyle: formElement ? getComputedStyle(formElement).display : 'no element'
            });

            // Initialize tab functionality for ApplicationV2
            this._initializeTabs();

            // CRITICAL: Set up trait-specific listeners if editable with validation
            if (this.isEditable) {
                try {
                    this._activateTraitListeners();
                    this._activateDragDropListeners();
                    logger.debug('AvantItemSheet | Trait listeners activated successfully');
                } catch (error) {
                    logger.error('AvantItemSheet | Failed to activate trait listeners:', error);
                }
            }

            // DIAGNOSTIC: Verify trait display after render
            const traitChips = this.element.querySelectorAll('.trait-chip');
            const traitInput = this.element.querySelector('.trait-autocomplete');

            logger.debug('AvantItemSheet | ApplicationV2 render completed', {
                itemId: this.document.id,
                itemType: this.document.type,
                editable: this.isEditable,
                traitChipsFound: traitChips.length,
                traitInputFound: !!traitInput,
                systemTraits: this.document.system?.traits || [],
                systemTraitsCount: (this.document.system?.traits || []).length
            });

            // Initialize AP selector handler with debounced callback to prevent excessive re-rendering
            if (this.isEditable && this.element) {
                initializeApSelector(this.element, (newApCost: number) => {
                    // Update the item's AP cost when changed (debounced by the AP selector)
                    this.document.update({ "system.apCost": newApCost });
                });
            }
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
                logger.debug('AvantItemSheet | No tabs found, skipping tab initialization');
                return;
            }

            logger.debug('AvantItemSheet | Initializing tabs', {
                tabCount: tabs.length,
                contentCount: tabContents.length,
                currentTab: this._currentTab
            });

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
                    logger.debug('AvantItemSheet | Tab clicked:', tabName);
                    if (tabName) {
                        this._activateTab(tabName);
                    }
                });
            });

            // Activate the current tab or default to the first available tab
            const targetTab = this._currentTab || tabs[0]?.getAttribute('data-tab') || 'description';
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

            logger.debug('AvantItemSheet | Activating tab:', tabName);

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

                logger.debug('AvantItemSheet | Tab activated successfully:', {
                    tabName,
                    hasActiveTab: targetTab.classList.contains('active'),
                    hasActiveContent: targetContent.classList.contains('active')
                });
            } else {
                // Log warning for missing tabs in development (will help with debugging)
                logger.warn('AvantItemSheet | Could not find tab elements for tab:', tabName, {
                    hasTab: !!targetTab,
                    hasContent: !!targetContent
                });
            }
        }

        /**
         * @deprecated Trait input listeners have been deprecated
         * Original implementation in deprecated/trait-input-system/logic/item-sheet-trait-input.ts
         */
        private _activateTraitListeners(): void {
            console.warn('Trait input system is deprecated. Use drag-and-drop instead.');

            // Update tag button states for trait sheets (non-deprecated functionality)
            if (this.document.type === 'trait') {
                this._updateTagButtonStates();
            }
        }

        /**
         * Activate drag-and-drop listeners for trait functionality (Phase 2 Feature)
         * 
         * This method sets up drag-and-drop event listeners for the trait drop zone.
         * It checks the feature flag and only enables the functionality when the
         * drag-and-drop feature is enabled in system settings.
         * 
         * @private
         */
        private _activateDragDropListeners(): void {
            try {
                // Check if drag-and-drop feature is enabled
                const game = (globalThis as any).game;
                const featureEnabled = game?.settings?.get('avant', 'enableDragTraitInput') || false;

                const dropZone = this.element.querySelector('.trait-drop-zone') as HTMLElement;
                const traitInputContainer = this.element.querySelector('.trait-input-container') as HTMLElement;

                if (!dropZone) {
                    logger.debug('AvantItemSheet | No drop zone found, skipping drag-drop setup');
                    return;
                }

                if (featureEnabled) {
                    // Show drop zone and hide text input
                    dropZone.style.display = 'block';
                    if (traitInputContainer) {
                        traitInputContainer.style.display = 'none';
                    }

                    // Set up drag-drop event listeners
                    this._setupDropZoneListeners(dropZone);
                    logger.debug('AvantItemSheet | Drag-and-drop trait input enabled');
                } else {
                    // Hide drop zone and show text input
                    dropZone.style.display = 'none';
                    if (traitInputContainer) {
                        traitInputContainer.style.display = 'block';
                    }
                    logger.debug('AvantItemSheet | Drag-and-drop trait input disabled, using text input');
                }
            } catch (error) {
                logger.error('AvantItemSheet | Error setting up drag-drop listeners:', error);
            }
        }

        /**
         * Set up drop zone event listeners for drag-and-drop functionality
         * 
         * @param dropZone - The drop zone element
         * @private
         */
        private _setupDropZoneListeners(dropZone: HTMLElement): void {
            // Prevent default drag behaviors on the drop zone
            dropZone.addEventListener('dragover', this._onDragOver.bind(this));
            dropZone.addEventListener('dragenter', this._onDragEnter.bind(this));
            dropZone.addEventListener('dragleave', this._onDragLeave.bind(this));
            dropZone.addEventListener('drop', this._onDrop.bind(this));

            logger.debug('AvantItemSheet | Drop zone listeners configured');
        }

        /**
         * Handle drag over events on the drop zone
         * @param event - The drag event
         * @private
         */
        private _onDragOver(event: DragEvent): void {
            event.preventDefault();
            event.dataTransfer!.dropEffect = 'copy';

            const dropZone = event.currentTarget as HTMLElement;
            if (!dropZone.classList.contains('drag-hover')) {
                dropZone.classList.add('drag-hover');
            }
        }

        /**
         * Handle drag enter events on the drop zone
         * @param event - The drag event
         * @private
         */
        private _onDragEnter(event: DragEvent): void {
            event.preventDefault();
            const dropZone = event.currentTarget as HTMLElement;
            dropZone.classList.add('drag-hover');
        }

        /**
         * Handle drag leave events on the drop zone
         * @param event - The drag event
         * @private
         */
        private _onDragLeave(event: DragEvent): void {
            const dropZone = event.currentTarget as HTMLElement;

            // Only remove hover state if we're leaving the drop zone entirely
            if (!dropZone.contains(event.relatedTarget as Node)) {
                dropZone.classList.remove('drag-hover');
            }
        }

        /**
         * Handle drop events on the drop zone
         * @param event - The drop event
         * @private
         */
        private async _onDrop(event: DragEvent): Promise<void> {
            event.preventDefault();

            const dropZone = event.currentTarget as HTMLElement;
            dropZone.classList.remove('drag-hover');
            dropZone.classList.add('drag-active');

            try {
                // Use the new modular drag-drop system
                const dragDataResult = extractDragData(event, DEFAULT_DRAG_EXTRACTION_CONFIG);

                if (!dragDataResult.success) {
                    this._showDropError(dropZone, 'Failed to extract drag data');
                    return;
                }

                const dragData = dragDataResult.value;
                logger.debug('AvantItemSheet | Drop data received:', dragData);

                if (dragData.type === 'Item' && dragData.uuid) {
                    await this._handleTraitDropModular(dragData, dropZone);
                } else {
                    this._showDropError(dropZone, 'Only trait items can be dropped here');
                }
            } catch (error) {
                logger.error('AvantItemSheet | Error handling drop:', error);
                this._showDropError(dropZone, 'Failed to process dropped item');
            } finally {
                dropZone.classList.remove('drag-active');
            }
        }

        /**
         * Handle the actual trait drop logic
         * @param data - The drag data containing the item UUID
         * @param dropZone - The drop zone element for visual feedback
         * @private
         */
        private async _handleTraitDrop(data: any, dropZone: HTMLElement): Promise<void> {
            try {
                // Resolve the dropped item from its UUID
                const droppedItem = await (globalThis as any).fromUuid(data.uuid);

                if (!droppedItem) {
                    this._showDropError(dropZone, 'Could not find dropped item');
                    return;
                }

                logger.debug('AvantItemSheet | Resolved dropped item:', {
                    name: droppedItem.name,
                    type: droppedItem.type,
                    id: droppedItem.id
                });

                // Use the pure function to validate and process the drop
                const { applyTraitDrop } = await import('../logic/item-sheet-utils.ts');
                const result = await applyTraitDrop(this.document, droppedItem);

                if (result.success && result.traits) {
                    // Update the document with the new traits
                    await this.document.update({ 'system.traits': result.traits });

                    // Show success feedback
                    this._showDropSuccess(dropZone, `Added trait: ${droppedItem.name}`);

                    // Show notification
                    const ui = (globalThis as any).ui;
                    ui?.notifications?.info(`Added trait: ${droppedItem.name}`);

                    logger.info('AvantItemSheet | Trait drop successful:', {
                        targetItem: this.document.name,
                        addedTrait: droppedItem.name,
                        totalTraits: result.traits.length
                    });
                } else {
                    // Show error feedback
                    this._showDropError(dropZone, result.error || 'Failed to add trait');

                    const ui = (globalThis as any).ui;
                    ui?.notifications?.warn(result.error || 'Failed to add trait');
                }
            } catch (error) {
                logger.error('AvantItemSheet | Error in trait drop handling:', error);
                this._showDropError(dropZone, 'Unexpected error occurred');
            }
        }

        /**
         * Handle trait drop using the new modular system
         * @param dragData - The drag data containing the item UUID
         * @param dropZone - The drop zone element for visual feedback
         * @private
         */
        private async _handleTraitDropModular(dragData: any, dropZone: HTMLElement): Promise<void> {
            try {
                // Get current traits from the document
                const existingTraits = this.document.system?.traits || [];

                // Validate the trait drop using the new modular system
                const validation = await validateTraitDrop(dragData, this.document, existingTraits);

                if (!validation.isValid) {
                    this._showDropError(dropZone, validation.error || 'Invalid trait drop');

                    const ui = (globalThis as any).ui;
                    ui?.notifications?.warn(validation.error || 'Invalid trait drop');
                    return;
                }

                // Process the trait drop using the new modular system
                const result = await processTraitDrop(validation, this.document, existingTraits);

                if (result.success && result.traits) {
                    // Update the document with the new traits
                    await this.document.update({ 'system.traits': result.traits });

                    // Show success feedback
                    this._showDropSuccess(dropZone, result.message);

                    // Show notification
                    const ui = (globalThis as any).ui;
                    ui?.notifications?.info(result.message);

                    logger.info('AvantItemSheet | Trait drop successful (modular):', {
                        targetItem: this.document.name,
                        addedTrait: result.metadata?.addedTraitName,
                        totalTraits: result.traits.length,
                        processingTime: result.metadata?.processingTimeMs
                    });
                } else {
                    // Show error feedback
                    this._showDropError(dropZone, result.error || 'Failed to add trait');

                    const ui = (globalThis as any).ui;
                    ui?.notifications?.warn(result.error || 'Failed to add trait');
                }
            } catch (error) {
                logger.error('AvantItemSheet | Error in modular trait drop handling:', error);
                this._showDropError(dropZone, 'Unexpected error occurred');
            }
        }

        /**
         * Show success feedback on the drop zone
         * @param dropZone - The drop zone element
         * @param message - Success message
         * @private
         */
        private _showDropSuccess(dropZone: HTMLElement, message: string): void {
            dropZone.classList.add('drop-success');

            // Update the drop zone text temporarily
            const textElement = dropZone.querySelector('.drop-zone-text') as HTMLElement;
            const originalText = textElement.textContent;
            textElement.textContent = 'Trait added!';

            // Reset after animation
            setTimeout(() => {
                dropZone.classList.remove('drop-success');
                textElement.textContent = originalText;
            }, 1000);
        }

        /**
         * Show error feedback on the drop zone
         * @param dropZone - The drop zone element
         * @param message - Error message
         * @private
         */
        private _showDropError(dropZone: HTMLElement, message: string): void {
            dropZone.classList.add('drag-error');

            // Update the drop zone text temporarily
            const textElement = dropZone.querySelector('.drop-zone-text') as HTMLElement;
            const originalText = textElement.textContent;
            textElement.textContent = 'Cannot add this item';

            // Reset after animation
            setTimeout(() => {
                dropZone.classList.remove('drag-error');
                textElement.textContent = originalText;
            }, 1000);
        }

        /**
         * Temporarily disable automatic form submission during trait operations
         * @private
         */
        private _disableAutoSubmit(): void {
            try {
                // Store the original setting
                this._originalSubmitOnChange = (this.constructor as any).DEFAULT_OPTIONS?.form?.submitOnChange ?? true;

                // Set the flag to block automatic submission
                this._blockAutoSubmit = true;

                // Temporarily modify the form configuration
                if ((this.constructor as any).DEFAULT_OPTIONS?.form) {
                    (this.constructor as any).DEFAULT_OPTIONS.form.submitOnChange = false;
                }

                logger.debug('AvantItemSheet | Disabled auto-submit for trait operation');
            } catch (error) {
                logger.error('AvantItemSheet | Error disabling auto-submit:', error);
            }
        }

        /**
         * Restore automatic form submission after trait operations
         * @private
         */
        private _restoreAutoSubmit(): void {
            try {
                // Clear the block flag
                this._blockAutoSubmit = false;

                // Restore the original setting
                if ((this.constructor as any).DEFAULT_OPTIONS?.form) {
                    (this.constructor as any).DEFAULT_OPTIONS.form.submitOnChange = this._originalSubmitOnChange;
                }

                logger.debug('AvantItemSheet | Restored auto-submit after trait operation');
            } catch (error) {
                logger.error('AvantItemSheet | Error restoring auto-submit:', error);
            }
        }

        /**
         * Override _prepareSubmitData to block automatic submissions during trait operations
         * @param event - The form submission event
         * @param form - The form element
         * @param formData - Raw form data from ApplicationV2
         * @param updateData - Update data object
         * @returns Processed form data or null to block submission
         */
        _prepareSubmitData(event: any, form: any, formData: any, updateData: any): any {
            // Use the new modular form handling
            if (shouldBlockSubmission(this._blockAutoSubmit, 'trait operation')) {
                return null; // Returning null prevents the submission
            }

            // Continue with normal form processing using the new module
            return this._originalPrepareSubmitData(event, form, formData, updateData);
        }

        /**
         * Original _prepareSubmitData implementation (renamed to avoid conflicts)
         * @param event - The form submission event
         * @param form - The form element
         * @param formData - Raw form data from ApplicationV2
         * @param updateData - Update data object
         * @returns Processed form data
         */
        _originalPrepareSubmitData(event: any, form: any, formData: any, updateData: any): any {
            try {
                // Use the new modular form handling system
                const extractionResult = extractFormData(event, form, formData, this.element, DEFAULT_FORM_CONFIG);

                if (extractionResult.success && extractionResult.value.success) {
                    const processedData = extractionResult.value.data;

                    // Validate critical fields using the new validation system
                    if (processedData && this.document?.type) {
                        const validationResult = validateCriticalFields(processedData, this.document.type);
                        if (!validationResult.isValid) {
                            logger.warn(`AvantItemSheet | Form validation failed for ${this.document.type}:`, validationResult.errors);
                            // For weapons with invalid damage dice, show user notification
                            if (this.document.type === 'weapon' && validationResult.errors.some(e => e.includes('damageDie'))) {
                                const ui = (globalThis as any).ui;
                                if (ui?.notifications) {
                                    ui.notifications.error('Invalid damage dice format. Use dice notation like 1d6, 2d10, etc.');
                                }
                            }
                            // Continue processing but log the issues
                        }
                    }

                    console.log('AvantItemSheet | Final Processed Data:', processedData);
                    return processedData || {};
                } else {
                    const errorMessage = extractionResult.success ? 'Form extraction returned failure' : extractionResult.error;
                    logger.error('AvantItemSheet | Form extraction failed:', errorMessage);
                    // Return safe fallback to prevent complete failure
                    return formData?.object || formData || {};
                }
            } catch (error) {
                logger.error('AvantItemSheet | Error in _prepareSubmitData:', error);
                // Return safe fallback to prevent complete failure
                return formData?.object || formData || {};
            }
        }

        /**
         * Validate critical fields for Talents and Augments
         * 
         * This method ensures that required fields are present and valid.
         * Extend this method when adding new required fields to item types.
         * 
         * ADDING NEW VALIDATIONS:
         * 1. Add field names to requiredFields array
         * 2. Add type-specific validation logic
         * 3. Add meaningful error messages
         * 4. Consider adding UI feedback for validation errors
         * 
         * @param processedData - The processed form data
         * @param itemType - The item type (talent or augment)
         * @private
         */
        private _validateCriticalFields(processedData: any, itemType: string): void {
            if (!processedData.system) {
                logger.warn(`AvantItemSheet | No system data found for ${itemType}`);
                return;
            }

            const system = processedData.system;
            const requiredFields = ['description'];

            // Add item-type specific required fields
            if (itemType === 'talent') {
                requiredFields.push('requirements', 'levelRequirement', 'apCost');
            } else if (itemType === 'augment') {
                requiredFields.push('requirements', 'levelRequirement', 'apCost', 'ppCost');
            }

            const missingFields = requiredFields.filter(field => {
                const value = system[field];
                return value === undefined || value === null;
            });

            if (missingFields.length > 0) {
                logger.warn(`AvantItemSheet | Missing fields in ${itemType}:`, missingFields);
            } else {
                logger.debug(`AvantItemSheet | All required fields present for ${itemType}`, {
                    description: typeof system.description,
                    requirements: typeof system.requirements,
                    ppCost: system.ppCost !== undefined ? typeof system.ppCost : 'not applicable'
                });
            }
        }

        /**
         * Prepare rarity options for the select component
         * 
         * @returns Array of option objects for the select component
         * @private
         */
        private _prepareRarityOptions(): Array<{ value: string, label: string }> {
            const rarityValues = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
            return rarityValues.map(rarity => ({
                value: rarity,
                label: rarity.charAt(0).toUpperCase() + rarity.slice(1)
            }));
        }

        /**
         * Prepare augment type options for the select component
         * 
         * @returns Array of option objects for the select component
         * @private
         */
        private _prepareAugmentTypeOptions(): Array<{ value: string, label: string }> {
            const augmentTypeValues = ['enhancement', 'modification', 'implant', 'symbiotic'];
            return augmentTypeValues.map(type => ({
                value: type,
                label: type.charAt(0).toUpperCase() + type.slice(1)
            }));
        }

        /**
         * Handle roll action - instance method
         * @param event - The triggering event
         * @param target - The target element
         */
        async onRoll(event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            if (!this.document) return;

            const rollType = target.dataset.rollType;
            if (!rollType) {
                logger.warn('AvantItemSheet | No roll type specified');
                return;
            }

            try {
                // Create roll data object from dataset
                const rollData = {
                    rollType,
                    name: this.document.name
                };

                const result = await executeRoll(this.document, rollData as any);
                logger.info('AvantItemSheet | Roll executed successfully:', result);
            } catch (error) {
                logger.error('AvantItemSheet | Roll failed:', error);
                FoundryUI.notify('Roll failed', 'error');
            }
        }

        /**
         * Handle image upload action - instance method
         * @param event - The triggering event
         * @param target - The target element (img element with data-edit="img")
         */
        async onEditImage(event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            if (!this.document) return;

            try {
                // Use FoundryVTT's built-in file picker for images
                const fp = new (globalThis as any).FilePicker({
                    type: "image",
                    current: this.document.img || "",
                    callback: async (path: string) => {
                        // Update the document with the new image path
                        await this.document.update({ img: path });

                        // Update the img element immediately for visual feedback
                        const imgElement = target as HTMLImageElement;
                        if (imgElement && imgElement.tagName === 'IMG') {
                            imgElement.src = path;
                            imgElement.alt = this.document.name || 'Item Image';
                            imgElement.title = this.document.name || 'Item Image';
                        }

                        FoundryUI.notify('Image updated successfully', 'info');
                    }
                });

                // Show the file picker
                fp.browse();
            } catch (error) {
                logger.error('AvantItemSheet | Image upload failed:', error);
                FoundryUI.notify('Failed to upload image', 'error');
            }
        }

        /**
         * Handle trait removal action with optimistic UI updates (no full page refresh)
         * 
         * This method demonstrates proper ApplicationV2 integration with the trait system.
         * It safely removes traits from items and updates the document through FoundryVTT's
         * data model system, but with immediate UI feedback.
         * 
         * Key ApplicationV2 patterns implemented:
         * 1. Called via action delegation from ApplicationV2 action system
         * 2. Uses DOM traversal to find trait chip container  
         * 3. Optimistic UI updates for immediate feedback
         * 4. Background document updates with error handling
         * 5. Rollback mechanism if save fails
         * 
         * @param event - The triggering click event from the remove button (×)
         * @param target - The remove button element that was clicked
         */
        async onRemoveTrait(event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            event.stopPropagation();

            if (!this.document) {
                logger.error('AvantItemSheet | onRemoveTrait: No document found');
                return;
            }

            // FIXED: Find the trait chip container using correct template classes
            const chip = target.closest('.trait-chip') as HTMLElement;
            if (!chip) {
                logger.error('AvantItemSheet | onRemoveTrait: Could not find trait chip element');
                return;
            }

            // FIXED: Extract trait ID from the correct data attribute used in template
            const traitId = chip.getAttribute('data-trait-id');
            if (!traitId) {
                logger.error('AvantItemSheet | onRemoveTrait: No trait ID found in chip data');
                return;
            }

            // Get current traits array from document system data
            const currentTraits = this.document.system.traits || [];

            // Use trait utility function to safely remove the trait
            // This function handles array manipulation and validation
            const { removeTraitFromList } = await import('../logic/trait-utils.ts');
            const result = removeTraitFromList(currentTraits, traitId);

            if (!result.success) {
                logger.error(`AvantItemSheet | Failed to remove trait: ${result.error}`);
                return;
            }

            // Store chip data for potential rollback
            const chipHtml = chip.outerHTML;
            const traitName = chip.querySelector('.trait-name')?.textContent || traitId;

            try {
                // Disable automatic form submission to prevent jarring page refresh
                this._disableAutoSubmit();

                // OPTIMISTIC UPDATE: Remove the chip immediately for instant feedback
                this._removeTraitChipOptimistically(traitId);

                // Update the document in the background (this triggers re-render)
                await this.document.update({
                    'system.traits': result.traits
                });

                // Log successful removal for debugging and audit trail
                logger.info(`AvantItemSheet | Removed trait ${traitId} from ${this.document.name}`);

                // Show success notification
                const ui = (globalThis as any).ui;
                ui?.notifications?.info(`Removed trait: ${traitName}`);

            } catch (error) {
                // ROLLBACK: If save fails, restore the chip
                logger.error('AvantItemSheet | Error updating document after trait removal:', error);
                this._restoreTraitChipOptimistically(chipHtml, traitId);

                const ui = (globalThis as any).ui;
                ui?.notifications?.error('Failed to remove trait');
            } finally {
                // Clear optimistic update flag and restore auto-submit
                this._restoreAutoSubmit();
            }
        }

        /**
         * Restore a trait chip to the DOM for rollback scenarios
         * @param chipHtml - The HTML of the chip to restore
         * @param traitId - The trait ID for positioning
         * @private
         */
        private _restoreTraitChipOptimistically(chipHtml: string, traitId: string): void {
            try {
                const traitContainer = this.element.querySelector('.trait-chip-input__field');
                const traitInput = this.element.querySelector('.trait-chip-input__input');

                if (!traitContainer || !traitInput) {
                    logger.warn('AvantItemSheet | Cannot restore trait chip - container not found');
                    return;
                }

                // Insert the chip before the input field
                traitInput.insertAdjacentHTML('beforebegin', chipHtml);

                // NOTE: Don't restore hidden inputs as they're handled by template re-rendering

                logger.debug('AvantItemSheet | Restored trait chip after rollback:', traitId);

            } catch (error) {
                logger.error('AvantItemSheet | Error restoring trait chip:', error);
            }
        }

        /**
         * Handle trait field click action - instance method
         * @param event - The triggering event
         * @param target - The target element
         */
        async onTraitFieldClick(event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();

            const input = this.element.querySelector('.trait-chip-input__input') as HTMLInputElement;
            if (input) {
                input.focus();
                if (input.value.trim()) {
                    this._showTraitSuggestions(input.value.trim());
                }
            }
        }

        /**
         * Handle trait suggestion click action - instance method
         * @param event - The triggering event
         * @param target - The target element
         */
        async onTraitSuggestionClick(event: Event, target: HTMLElement): Promise<void> {
            event.preventDefault();
            if (!this.document) return;

            const suggestion = target.closest('.trait-chip-input__suggestion') as HTMLElement;
            if (!suggestion) return;

            const traitId = suggestion.dataset.traitId;
            if (!traitId) return;

            try {
                await this._addTraitById(traitId);
            } catch (error) {
                logger.error('AvantItemSheet | Trait selection failed:', error);
                FoundryUI.notify('Failed to add trait', 'error');
            }
        }

        /**
         * Handle tag example click action - instance method
         * @param event - The triggering event
         * @param target - The target element
         */
        onTagExampleClick(event: Event, target: HTMLElement): void {
            event.preventDefault();
            if (!this.document) return;

            const tagValue = target.dataset.tag;
            if (!tagValue) return;

            // Toggle tag in the tags string
            const tagsInput = this.element.querySelector('input[name="system.tags"]') as HTMLInputElement;
            if (tagsInput) {
                const currentTags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
                const tagIndex = currentTags.indexOf(tagValue);

                if (tagIndex >= 0) {
                    // Remove tag
                    currentTags.splice(tagIndex, 1);
                    target.classList.remove('selected');
                } else {
                    // Add tag
                    currentTags.push(tagValue);
                    target.classList.add('selected');
                }

                tagsInput.value = currentTags.join(', ');

                // Trigger change event
                const changeEvent = new Event('change', { bubbles: true });
                tagsInput.dispatchEvent(changeEvent);
            }
        }

        /**
         * Handle trait input typing
         * @param event - The input event
         * @private
         */
        private async _onTraitInput(event: Event): Promise<void> {
            const input = event.target as HTMLInputElement;
            const query = input.value.trim();

            this.traitInputState.currentInput = query;

            if (query.length >= 1) {
                await this._showTraitSuggestions(query);
            } else {
                this._hideTraitSuggestions();
            }
        }

        /**
         * Handle trait input keydown events
         * @param event - The keydown event
         * @private
         */
        private async _onTraitInputKeydown(event: KeyboardEvent): Promise<void> {
            const dropdown = this.element.querySelector('.trait-chip-input__dropdown');
            const suggestions = dropdown?.querySelectorAll('.trait-chip-input__suggestion') || [];

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    this.traitInputState.selectedIndex = Math.min(
                        this.traitInputState.selectedIndex + 1,
                        suggestions.length - 1
                    );
                    this._updateSuggestionHighlight();
                    break;

                case 'ArrowUp':
                    event.preventDefault();
                    this.traitInputState.selectedIndex = Math.max(
                        this.traitInputState.selectedIndex - 1,
                        -1
                    );
                    this._updateSuggestionHighlight();
                    break;

                case 'Enter':
                    event.preventDefault();
                    if (this.traitInputState.selectedIndex >= 0 && suggestions[this.traitInputState.selectedIndex]) {
                        const suggestion = suggestions[this.traitInputState.selectedIndex] as HTMLElement;
                        await this._addTraitFromSuggestion(suggestion);
                    } else if (this.traitInputState.currentInput.trim()) {
                        await this._addTraitById(this.traitInputState.currentInput.trim());
                    }
                    break;

                case 'Escape':
                    event.preventDefault();
                    this._hideTraitSuggestions();
                    (event.target as HTMLElement).blur();
                    break;
            }
        }

        /**
         * Handle trait input focus
         * @param event - The focus event
         * @private
         */
        private async _onTraitInputFocus(event: Event): Promise<void> {
            const input = event.target as HTMLInputElement;
            if (input.value.trim()) {
                await this._showTraitSuggestions(input.value.trim());
            }
        }

        /**
         * Handle trait input blur
         * @param event - The blur event
         * @private
         */
        private _onTraitInputBlur(event: Event): void {
            // Delay hiding to allow for suggestion clicks
            setTimeout(() => {
                this._hideTraitSuggestions();
            }, 200);
        }

        /**
         * Show trait suggestions dropdown with ApplicationV2 compatibility
         * 
         * This method demonstrates the proper integration of the TraitProvider service
         * with ApplicationV2 item sheets. It was part of the critical fix for the broken
         * trait autocomplete system.
         * 
         * Key Implementation Details:
         * 1. Uses TraitProvider service instead of searching existing item traits
         * 2. Handles service unavailability gracefully with error messages
         * 3. Integrates with the theme system for proper color/icon display
         * 4. Uses correct CSS classes for ApplicationV2 dropdown visibility
         * 
         * Trait System Architecture:
         * - TraitProvider: Centralized service for all available traits
         * - Trait rendering: Uses Handlebars helpers for consistent display
         * - CSS integration: Proper visibility classes for dropdown control
         * 
         * @param query - The search string entered by the user
         * @private
         */
        /**
         * PHASE 4 THIN WRAPPER
         * 
         * Show trait suggestions using modular pure functions
         * 
         * This method is now a thin wrapper that delegates to the modular trait
         * suggestions system, making it more testable and maintainable.
         */
        private async _showTraitSuggestions(query: string): Promise<void> {
            try {
                // Prepare context for suggestions
                const itemContext: ItemContextForSuggestions = {
                    id: this.document.id,
                    name: this.document.name,
                    type: this.document.type,
                    existingTraitIds: this.document.system.traits || []
                };

                // Generate suggestions using modular functions
                const result = await generateTraitSuggestionsModular(query, itemContext, DEFAULT_TRAIT_SUGGESTION_CONFIG);

                if (result.success && result.suggestions.length > 0) {
                    // Filter for available traits only
                    const availableTraits = result.suggestions.filter(s => s.isAvailable);

                    if (availableTraits.length > 0) {
                        // Convert suggestions back to legacy format for display
                        const legacyTraits = availableTraits.map(s => ({
                            id: s.id,
                            name: s.name,
                            description: s.description,
                            color: s.color,
                            textColor: s.textColor,
                            icon: s.icon
                        }));

                        await this._displayTraitSuggestions(legacyTraits);
                    } else {
                        this._showNoTraitSuggestions();
                    }
                } else {
                    this._showNoTraitSuggestions(result.error || 'No matching traits found');
                }

            } catch (error) {
                logger.error('AvantItemSheet | Error showing trait suggestions:', error);
                this._showNoTraitSuggestions('Error loading traits');
            }
        }

        /**
         * Display trait suggestions in the dropdown with proper styling
         * 
         * This method handles the actual rendering of trait suggestions using the
         * centralized trait rendering system. It ensures consistent appearance
         * across all item types and integrates with the theme system.
         * 
         * @param traits - Array of available trait objects to display
         * @private
         */
        private async _displayTraitSuggestions(traits: any[]): Promise<void> {
            try {
                const dropdown = this.element.querySelector('.trait-chip-input__dropdown') as HTMLElement;
                if (!dropdown) {
                    logger.error('AvantItemSheet | Trait dropdown element not found');
                    return;
                }

                // Import trait rendering utility for consistent display
                const { renderTraitSuggestion } = await import('../logic/chat/trait-renderer.ts');

                // Generate HTML for each trait suggestion
                const suggestionsHTML = traits.map(trait => renderTraitSuggestion(trait)).join('');

                // Update dropdown content and make it visible
                dropdown.innerHTML = suggestionsHTML;

                // CRITICAL: Use correct CSS class for ApplicationV2 dropdown visibility
                // This was a key fix - must use 'trait-chip-input__dropdown--open' not 'visible'
                dropdown.classList.add('trait-chip-input__dropdown--open');

            } catch (error) {
                logger.error('AvantItemSheet | Error displaying trait suggestions:', error);
                this._showNoTraitSuggestions('Display error');
            }
        }

        /**
         * Hide trait suggestions dropdown
         * @private
         */
        private _hideTraitSuggestions(): void {
            // CRITICAL FIX: Check if element exists before trying to access it
            // This prevents "this.element is null" errors during timing issues
            if (!this.element) {
                logger.debug('AvantItemSheet | Cannot hide trait suggestions - element is null');
                return;
            }

            const dropdown = this.element.querySelector('.trait-chip-input__dropdown') as HTMLElement;
            if (dropdown) {
                // Remove the visibility class to hide dropdown
                dropdown.classList.remove('trait-chip-input__dropdown--open');
                dropdown.innerHTML = '';
            }
        }

        /**
         * Show "no results" message in trait dropdown
         * @param message - Optional custom message to display
         * @private
         */
        private _showNoTraitSuggestions(message?: string): void {
            // CRITICAL FIX: Check if element exists before trying to access it
            if (!this.element) {
                logger.debug('AvantItemSheet | Cannot show no trait suggestions - element is null');
                return;
            }

            const dropdown = this.element.querySelector('.trait-chip-input__dropdown') as HTMLElement;
            if (dropdown) {
                const noResultsDiv = dropdown.querySelector('.trait-chip-input__no-results') as HTMLElement;
                if (noResultsDiv) {
                    noResultsDiv.textContent = message || 'No matching traits found';
                    noResultsDiv.style.display = 'block';
                }
                // Remove visibility class since we're showing "no results"
                dropdown.classList.remove('trait-chip-input__dropdown--open');
            }
        }

        /**
         * Update suggestion highlight
         * @private
         */
        private _updateSuggestionHighlight(): void {
            const suggestions = this.element.querySelectorAll('.trait-chip-input__suggestion');
            suggestions.forEach((suggestion: Element, index: number) => {
                suggestion.classList.toggle('highlighted', index === this.traitInputState.selectedIndex);
            });
        }

        /**
         * Add trait from suggestion element
         * @param suggestion - The suggestion element
         * @private
         */
        private async _addTraitFromSuggestion(suggestion: HTMLElement): Promise<void> {
            const traitId = suggestion.dataset.traitId;
            if (traitId) {
                await this._addTraitById(traitId);
            }
        }

        /**
         * Add trait by ID with optimistic UI updates (no full page refresh)
         * @param traitId - The trait ID to add
         * @private
         */
        private async _addTraitById(traitId: string): Promise<void> {
            try {
                logger.debug('AvantItemSheet | Adding trait by ID:', traitId);

                // Get available traits to validate the ID
                const game = (globalThis as any).game;
                const initManager = game?.avant?.initializationManager;

                if (!initManager) {
                    logger.warn('AvantItemSheet | InitializationManager not available for trait validation');
                    FoundryUI.notify('Trait service not available', 'warn');
                    return;
                }

                // CRITICAL FIX: Use waitForService with timeout instead of getService
                let traitProvider;
                try {
                    traitProvider = await initManager.waitForService('traitProvider', 2000);
                } catch (serviceError) {
                    logger.warn('AvantItemSheet | TraitProvider service not ready or failed:', serviceError);
                    FoundryUI.notify('Trait service not ready', 'warn');
                    return;
                }

                // Validate trait exists
                const traitResult = await traitProvider.get(traitId);
                if (!traitResult.success || !traitResult.data) {
                    logger.warn('AvantItemSheet | Trait not found:', traitId);
                    FoundryUI.notify(`Trait '${traitId}' not found`, 'warn');
                    return;
                }

                // Use pure function to add trait to list
                const { addTraitToList } = await import('../logic/trait-utils.ts');
                const currentTraits = this.document.system.traits || [];
                const result = addTraitToList(currentTraits, traitId);

                if (result.success && result.changed) {
                    // Disable automatic form submission to prevent jarring page refresh
                    this._disableAutoSubmit();

                    // OPTIMISTIC UPDATE: Update the DOM immediately for instant feedback
                    this._addTraitChipOptimistically(traitResult.data);

                    // Clear input and hide dropdown immediately
                    const input = this.element.querySelector('.trait-chip-input__input') as HTMLInputElement;
                    if (input) {
                        input.value = '';
                    }
                    this._hideTraitSuggestions();

                    try {
                        // Update the document in the background (this triggers re-render)
                        await this.document.update({ 'system.traits': result.traits });

                        logger.log(`AvantItemSheet | Added trait ${traitId} to ${this.document.name}`);
                        FoundryUI.notify(`Added trait: ${traitResult.data.name}`, 'info');

                    } catch (error) {
                        // ROLLBACK: If save fails, remove the optimistically added chip
                        logger.error('AvantItemSheet | Failed to save trait to document:', error);
                        this._removeTraitChipOptimistically(traitId);
                        FoundryUI.notify('Failed to save trait', 'error');
                    } finally {
                        // Clear optimistic update flag and restore auto-submit
                        this._restoreAutoSubmit();
                    }

                } else if (!result.success) {
                    FoundryUI.notify(result.error || 'Failed to add trait', 'warn');
                } else {
                    // Already exists
                    FoundryUI.notify(`Trait already exists on this item`, 'info');
                }
            } catch (error) {
                logger.error('AvantItemSheet | Failed to add trait:', error);
                FoundryUI.notify('Failed to add trait', 'error');
            }
        }

        /**
         * Add a trait chip to the DOM immediately for optimistic updates
         * @param trait - The trait data to render
         * @private
         */
        private _addTraitChipOptimistically(trait: any): void {
            try {
                // FIXED: Use correct template container selectors
                const traitContainer = this.element.querySelector('.trait-chips');
                if (!traitContainer) {
                    logger.warn('AvantItemSheet | Cannot add trait chip - container not found');
                    return;
                }

                // FIXED: Create the trait chip HTML using the same structure as the template
                const textColor = trait.color ? (this._isLightColor(trait.color) ? '#000000' : '#FFFFFF') : '#000000';
                const chipHtml = `
                <div class="trait-chip" style="--trait-color: ${trait.color || '#6C757D'}; --trait-text-color: ${textColor};" data-trait-id="${trait.id}">
                    ${trait.icon ? `<i class="${trait.icon}" aria-hidden="true"></i>` : ''}
                    <span class="trait-name">${trait.name}</span>
                    <button type="button" class="trait-remove" data-action="removeTrait" data-trait-id="${trait.id}" aria-label="Remove ${trait.name}">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>
            `;

                // Insert the chip into the trait container
                traitContainer.insertAdjacentHTML('beforeend', chipHtml);
                logger.debug('AvantItemSheet | Optimistically added trait chip:', trait.id);

            } catch (error) {
                logger.error('AvantItemSheet | Error adding trait chip optimistically:', error);
            }
        }

        /**
         * Helper method to determine if a color is light
         * @param color - Hex color string
         * @returns true if light, false if dark
         * @private
         */
        private _isLightColor(color: string): boolean {
            if (!color) return false;

            const hex = color.replace('#', '');
            let r, g, b;

            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else if (hex.length === 6) {
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            } else {
                return false;
            }

            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance > 0.5;
        }

        /**
         * Remove a trait chip from the DOM immediately for rollback
         * @param traitId - The trait ID to remove
         * @private
         */
        private _removeTraitChipOptimistically(traitId: string): void {
            try {
                // FIXED: Use correct data attribute selector
                const chipToRemove = this.element.querySelector(`[data-trait-id="${traitId}"]`);
                if (chipToRemove) {
                    chipToRemove.remove();
                    logger.debug('AvantItemSheet | Optimistically removed trait chip:', traitId);
                }

                // NOTE: Don't remove hidden inputs as they're handled by template re-rendering

            } catch (error) {
                logger.error('AvantItemSheet | Error removing trait chip optimistically:', error);
            }
        }

        /**
         * Update tag button states for trait items
         * @private
         */
        private _updateTagButtonStates(): void {
            const tagsInput = this.element.querySelector('input[name="system.tags"]') as HTMLInputElement;
            if (!tagsInput) return;

            const currentTags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
            const tagButtons = this.element.querySelectorAll('.tag-example');

            tagButtons.forEach((button: Element) => {
                const tagValue = (button as HTMLElement).dataset.tag;
                if (tagValue && currentTags.includes(tagValue)) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        }
    }

    return AvantItemSheet;
}
