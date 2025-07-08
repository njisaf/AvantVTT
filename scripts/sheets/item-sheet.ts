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
import { executeRoll, processFormData } from '../logic/item-sheet.js';
import { prepareTemplateData, extractItemFormData, prepareItemHeaderMetaFields, prepareItemBodyFields } from '../logic/item-sheet-utils.js';
import { logger } from '../utils/logger.js';
import { initializeApSelector } from './ap-selector-handler';

// Import trait utilities
import { addTraitToList, removeTraitFromList, generateTraitSuggestions, validateTraitList } from '../logic/trait-utils.ts';
import { renderTraitSuggestion } from '../logic/chat/trait-renderer.ts';

// Import trait integration utilities for chat messages
import { createTraitHtmlForChat, itemHasTraits } from '../logic/chat/trait-resolver.ts';

// Import local foundry UI adapter for safe notifications
import { FoundryUI } from '../types/adapters/foundry-ui.ts';

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

        /** Current trait input state */
        private traitInputState: {
            availableTraits: any[];
            currentInput: string;
            selectedIndex: number;
            isDropdownOpen: boolean;
            optimisticUpdate: boolean; // Track if we're in the middle of an optimistic update
        } = {
                availableTraits: [],
                currentInput: '',
                selectedIndex: -1,
                isDropdownOpen: false,
                optimisticUpdate: false
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

                roll: (event: Event, target: HTMLElement) => {
                    const sheet = (target.closest('.app') as any)?.app as AvantItemSheet;
                    return sheet?.onRoll(event, target);
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

                traitFieldClick: (event: Event, target: HTMLElement) => {
                    const sheet = (target.closest('.app') as any)?.app as AvantItemSheet;
                    return sheet?.onTraitFieldClick(event, target);
                },
                traitSuggestionClick: (event: Event, target: HTMLElement) => {
                    const sheet = (target.closest('.app') as any)?.app as AvantItemSheet;
                    return sheet?.onTraitSuggestionClick(event, target);
                },
                tagExampleClick: (event: Event, target: HTMLElement) => {
                    const sheet = (target.closest('.app') as any)?.app as AvantItemSheet;
                    return sheet?.onTagExampleClick(event, target);
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
         * This getter overrides the static PARTS configuration to provide dynamic
         * template selection. In our case, we use a single aggregator template
         * that internally includes the correct partial based on item type.
         * 
         * TEMPLATE STRATEGY:
         * - Single aggregator template (item-sheet.html) handles all item types
         * - Template internally includes correct partial based on {{item.type}}
         * - Prevents template path errors and simplifies maintenance
         * 
         * @override
         */
        get parts() {
            // Use the aggregator template for all item types – this template will internally
            // include the correct partial based on `item.type` so we no longer need to build
            // a dynamic path here. This prevents accidental fallback to the gear template.

            const templatePath = "systems/avant/templates/item-sheet.html";

            logger.debug('AvantItemSheet | Parts getter called - Aggregator template path:', {
                templatePath,
                documentId: this.document?.id || 'unknown'
            });

            return {
                form: {
                    template: templatePath
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

        /**
         * Get the template path for this item type - Dynamic template selection
         * 
         * This getter provides the template path for ApplicationV2 rendering.
         * We use the aggregator template pattern for simplicity.
         * 
         * @override
         */
        get template(): string {
            // Always return the aggregator template which handles partial inclusion based on `item.type`.
            const templatePath = "systems/avant/templates/item-sheet.html";
            logger.debug('AvantItemSheet | Using aggregator template path:', templatePath);
            return templatePath;
        }

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
        async _prepareContext(options: any): Promise<ItemSheetContext> {
            logger.debug('AvantItemSheet | _prepareContext called', {
                itemId: this.document?.id,
                itemType: this.document?.type,
                itemName: this.document?.name
            });

            // Get base ApplicationV2 context
            const context = await super._prepareContext(options) as any;
            const itemData = this.document.toObject(false);

            logger.debug('AvantItemSheet | Super context prepared:', {
                contextKeys: Object.keys(context),
                hasForm: !!context.form,
                hasTemplate: !!context.template
            });

            // Use pure function to prepare template data
            const templateData = prepareTemplateData(itemData);

            // Prepare augment-specific option data for Phase 3 component library
            if (itemData.type === 'augment') {
                context.rarityOptions = this._prepareRarityOptions();
                context.augmentTypeOptions = this._prepareAugmentTypeOptions();
            }
            if (templateData) {
                // Merge with existing context
                Object.assign(context, templateData);
                logger.debug('AvantItemSheet | Template data merged successfully');
            } else {
                // Fallback to basic data structure
                context.system = itemData.system || {};
                context.flags = itemData.flags || {};
                logger.debug('AvantItemSheet | Using fallback basic data structure');
            }

            // Prepare metaFields for consistent header layout
            try {
                context.metaFields = prepareItemHeaderMetaFields(itemData, context.system);
                logger.debug('AvantItemSheet | MetaFields prepared:', {
                    itemType: itemData.type,
                    fieldCount: context.metaFields.length
                });

                // Prepare bodyFields for consistent body layout (Stage 2 Universal Architecture)
                context.bodyFields = prepareItemBodyFields(itemData, context.system);
                logger.debug('AvantItemSheet | BodyFields prepared:', {
                    itemType: itemData.type,
                    fieldCount: context.bodyFields.length,
                    fieldTypes: context.bodyFields.map((field: any) => field.type)
                });
            } catch (error) {
                logger.warn('AvantItemSheet | Failed to prepare fields:', error);
                context.metaFields = [];
                context.bodyFields = [];
            }

            // Ensure traits array exists
            if (!context.system.traits) {
                context.system.traits = [];
            }

            // For trait items, convert tags array to string for template
            if (this.document.type === 'trait' && context.system.tags) {
                context.system.tagsString = Array.isArray(context.system.tags)
                    ? context.system.tags.join(',')
                    : (context.system.tags || '');
            } else if (this.document.type === 'trait') {
                context.system.tagsString = '';
            }

            // Add ApplicationV2 required fields
            context.editable = this.isEditable;
            context.owner = this.document.isOwner;

            // Pre-enrich description content for the editor helper (FoundryVTT v13 requirement)
            if (context.system.description) {
                try {
                    // Use the new namespaced TextEditor for v13 compatibility
                    const foundry = (globalThis as any).foundry;
                    const TextEditor = foundry?.applications?.ux?.TextEditor?.implementation || (globalThis as any).TextEditor;

                    if (TextEditor && TextEditor.enrichHTML) {
                        context.enrichedDescription = await TextEditor.enrichHTML(context.system.description, { async: true });
                    } else {
                        context.enrichedDescription = context.system.description;
                    }
                } catch (error) {
                    console.warn('Failed to enrich description content:', error);
                    context.enrichedDescription = context.system.description;
                }
            } else {
                context.enrichedDescription = '';
            }

            // Prepare trait display data for template
            await this._prepareTraitDisplayData(context);

            logger.debug('AvantItemSheet | Context preparation complete:', {
                finalContextKeys: Object.keys(context),
                systemKeys: Object.keys(context.system || {}),
                traitsCount: context.displayTraits?.length || 0
            });

            return context;
        }

        /**
         * Prepare trait display data for template rendering
         * @param context - The template context
         * @private
         */
        private async _prepareTraitDisplayData(context: any): Promise<void> {
            // Initialize display traits array
            context.displayTraits = [];

            const traitIds = context.system?.traits || [];
            logger.debug('AvantItemSheet | Preparing trait display data', {
                itemName: context.item?.name || 'Unknown',
                itemType: context.item?.type || 'Unknown',
                traitIds
            });

            if (traitIds.length === 0) {
                return;
            }

            try {
                // Get trait data from the TraitProvider
                const game = (globalThis as any).game;
                if (game?.avant?.initializationManager) {
                    const traitProvider = game.avant.initializationManager.getService('traitProvider');
                    if (traitProvider) {
                        const result = await traitProvider.getAll();
                        if (result.success && result.data) {
                            const allTraits = result.data;

                            // Map trait IDs to actual trait data
                            context.displayTraits = traitIds.map((traitId: string) => {
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
                                        color: '#6C757D',
                                        icon: 'fas fa-tag'
                                    };
                                }
                            });
                            return;
                        }
                    }
                }
            } catch (error) {
                console.warn('AvantItemSheet | Error accessing TraitProvider:', error);
            }

            // Fallback: create basic display data using ID parsing
            context.displayTraits = traitIds.map((traitId: string) => ({
                id: traitId,
                name: this._generateFallbackTraitName(traitId),
                displayId: traitId,
                color: '#6C757D',
                icon: 'fas fa-tag'
            }));
        }

        /**
         * Generate a fallback display name from a trait ID
         * @param traitId - The trait ID to generate a name from
         * @private
         */
        private _generateFallbackTraitName(traitId: string): string {
            if (traitId.startsWith('system_trait_')) {
                return traitId
                    .replace(/^system_trait_/, '')
                    .replace(/_\d+$/, '')
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());
            }
            return traitId;
        }

        /**
         * Render the inner HTML content
         * @param context - Template context
         * @param options - Render options
         * @returns Rendered HTML content
         */
        async _renderHTML(context: any, options: any): Promise<string> {
            logger.debug('AvantItemSheet | _renderHTML called', {
                itemType: context.item?.type,
                contextKeys: Object.keys(context || {}),
                templatePath: this.options.template
            });

            try {
                // DEBUGGING: Check what partials are available in Handlebars before rendering
                const handlebars = (globalThis as any).Handlebars;
                if (handlebars && handlebars.partials) {
                    console.log('🔧 RENDER DEBUG | Available Handlebars partials:', Object.keys(handlebars.partials));

                    // Check specifically for image-upload partial
                    const imageUploadKeys = Object.keys(handlebars.partials).filter(key =>
                        key.includes('image-upload')
                    );
                    console.log('🔧 RENDER DEBUG | Image-upload partials found:', imageUploadKeys);

                    // Check exactly what we're looking for
                    const expectedKey = 'systems/avant/templates/shared/partials/image-upload';
                    console.log('🔧 RENDER DEBUG | Looking for partial:', expectedKey);
                    console.log('🔧 RENDER DEBUG | Partial exists?', !!handlebars.partials[expectedKey]);

                    if (handlebars.partials[expectedKey]) {
                        console.log('🔧 RENDER DEBUG | Partial content type:', typeof handlebars.partials[expectedKey]);
                    } else {
                        console.log('🔧 RENDER DEBUG | Checking alternative patterns...');
                        const alternatives = Object.keys(handlebars.partials).filter(key =>
                            key.endsWith('image-upload') || key.includes('image-upload')
                        );
                        console.log('🔧 RENDER DEBUG | Alternative matches:', alternatives);
                    }
                } else {
                    console.warn('🔧 RENDER DEBUG | Handlebars partials registry not accessible');
                }

                return await super._renderHTML(context, options);
            } catch (error) {
                logger.error('AvantItemSheet | _renderHTML failed:', error);
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

            // OPTIMIZATION: Skip heavy operations during optimistic trait updates
            if (this.traitInputState.optimisticUpdate) {
                logger.debug('AvantItemSheet | Skipping heavy render operations during optimistic trait update');
                return;
            }

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

            // Set up trait-specific listeners if editable
            if (this.isEditable) {
                this._activateTraitListeners();
            }

            logger.debug('AvantItemSheet | ApplicationV2 render completed', {
                itemId: this.document.id,
                itemType: this.document.type,
                editable: this.isEditable
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
         * Activate trait-specific event listeners
         * @private
         */
        private _activateTraitListeners(): void {
            // Trait input field events
            const traitInput = this.element.querySelector('.trait-chip-input__input') as HTMLInputElement;
            if (traitInput) {
                traitInput.addEventListener('input', this._onTraitInput.bind(this));
                traitInput.addEventListener('keydown', this._onTraitInputKeydown.bind(this));
                traitInput.addEventListener('focus', this._onTraitInputFocus.bind(this));
                traitInput.addEventListener('blur', this._onTraitInputBlur.bind(this));
            }

            // Event delegation for dynamically created suggestion elements
            const dropdown = this.element.querySelector('.trait-chip-input__dropdown');
            if (dropdown) {
                dropdown.addEventListener('click', (event: Event) => {
                    const suggestion = (event.target as HTMLElement).closest('.trait-chip-input__suggestion') as HTMLElement;
                    if (suggestion) {
                        event.preventDefault();
                        this.onTraitSuggestionClick(event, suggestion);
                    }
                });
            }

            // Update tag button states for trait sheets
            if (this.document.type === 'trait') {
                this._updateTagButtonStates();
            }
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
            // Block automatic form submission during trait operations
            if (this._blockAutoSubmit) {
                logger.debug('AvantItemSheet | Blocking automatic form submission during trait operation');
                return null; // Returning null prevents the submission
            }

            // Continue with normal form processing
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
                logger.debug('AvantItemSheet | _prepareSubmitData called', {
                    eventType: event?.type || 'unknown',
                    formElementType: form?.tagName || 'unknown',
                    formDataType: typeof formData,
                    formDataConstructor: formData?.constructor?.name,
                    hasObjectProperty: !!(formData?.object),
                    updateDataType: typeof updateData,
                    itemId: this.document?.id,
                    itemType: this.document?.type
                });

                // ================================================================================
                // STEP 1: DETECT NESTED FORM ISSUE
                // ================================================================================
                // 
                // ApplicationV2 creates nested forms. We need to detect if we're dealing with
                // the outer frame form (header controls only) or the inner content form (inputs).
                // 
                // DETECTION STRATEGY:
                // - Check if form elements are all header control buttons without 'name' attributes
                // - Look for header-control CSS class
                // - If detected, search for the actual content form
                // 
                let actualForm = form;

                // Check if this form only has header control buttons (outer frame form)
                const formElements = Array.from(form.elements) as HTMLFormElement[];
                const hasOnlyHeaderButtons = formElements.length > 0 && formElements.every((el: any) =>
                    el.tagName === 'BUTTON' &&
                    el.className &&
                    el.className.includes('header-control') &&
                    !el.name
                );

                if (hasOnlyHeaderButtons) {
                    logger.debug('AvantItemSheet | Detected outer frame form, searching for content form');

                    // Find the actual content form with input fields
                    const contentForm = this.element.querySelector('div[data-application-part="form"]') as HTMLElement;
                    if (contentForm) {
                        actualForm = contentForm;
                        logger.debug('AvantItemSheet | Found content form', {
                            hasInputs: contentForm.querySelectorAll('input, select, textarea').length,
                            className: contentForm.className
                        });
                    } else {
                        logger.warn('AvantItemSheet | Could not find content form, using original form');
                    }
                }

                // ================================================================================
                // STEP 2: EXTRACT FORM DATA FROM MULTIPLE SOURCES
                // ================================================================================
                // 
                // ApplicationV2 can provide form data in several formats:
                // 1. FormDataExtended with .object property
                // 2. Native FormData requiring conversion
                // 3. Plain object (already converted)
                // 4. Empty/undefined (need to extract manually)
                // 
                // We handle all these cases to ensure compatibility.
                // 
                let rawFormData: any;

                if (formData && typeof formData.object === 'object') {
                    // Standard FormDataExtended pattern with .object property
                    rawFormData = formData.object;
                    logger.debug('AvantItemSheet | Using FormDataExtended.object pattern');
                } else if (formData && typeof formData === 'object' && formData.constructor?.name === 'FormData') {
                    // Native FormData - need to convert to object
                    rawFormData = {};
                    for (const [key, value] of formData.entries()) {
                        rawFormData[key] = value;
                    }
                    logger.debug('AvantItemSheet | Converted FormData to object', {
                        fieldCount: Object.keys(rawFormData).length
                    });
                } else if (formData && typeof formData === 'object') {
                    // Plain object - use directly
                    rawFormData = formData;
                    logger.debug('AvantItemSheet | Using plain object form data');
                } else {
                    // Fallback for unexpected structure
                    logger.warn('AvantItemSheet | Unexpected form data structure, using fallback');
                    rawFormData = formData || {};
                }

                // ================================================================================
                // STEP 3: MANUAL FORM DATA EXTRACTION (CRITICAL FALLBACK)
                // ================================================================================
                // 
                // If we still have no form data after trying all standard methods,
                // we manually extract from the actual DOM form elements.
                // 
                // This is the key fix that resolved our persistent form data issues.
                // 
                if ((!rawFormData || Object.keys(rawFormData).length === 0) && actualForm) {
                    logger.debug('AvantItemSheet | Extracting form data from content form');

                    // Find all form inputs in the content form
                    const inputs = actualForm.querySelectorAll('input, select, textarea') as NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
                    const extractedData: any = {};

                    inputs.forEach((input: any) => {
                        if (input.name && !input.disabled) {
                            extractedData[input.name] = input.value;
                        }
                    });

                    logger.debug('AvantItemSheet | Content form extraction result:', {
                        inputCount: inputs.length,
                        extractedKeys: Object.keys(extractedData),
                        extractedData
                    });

                    if (Object.keys(extractedData).length > 0) {
                        rawFormData = extractedData;
                        logger.debug('AvantItemSheet | Using extracted content form data');
                    }
                }

                // ================================================================================
                // STEP 4: PROCESS FORM DATA FOR FOUNDRYVTT
                // ================================================================================
                // 
                // Convert flat form data (e.g., "system.description") to nested objects
                // (e.g., {system: {description: "value"}}) that FoundryVTT expects.
                // 
                const processedData = extractItemFormData(rawFormData);

                logger.debug('AvantItemSheet | Form data processed', {
                    rawDataKeys: Object.keys(rawFormData),
                    processedDataKeys: Object.keys(processedData),
                    hasSystemData: !!(processedData as any).system,
                    systemKeys: (processedData as any).system ? Object.keys((processedData as any).system) : []
                });

                // ================================================================================
                // STEP 5: VALIDATE CRITICAL FIELDS
                // ================================================================================
                // 
                // Perform validation on processed data to catch issues early.
                // Add validation for new fields as needed.
                // 
                if (this.document?.type === 'talent' || this.document?.type === 'augment') {
                    this._validateCriticalFields(processedData as any, this.document.type);
                }

                return processedData;

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
                // Use pure function to execute the roll
                const rollResult = await executeRoll(this.document, { rollType, name: this.document.name } as any) as any;
                if (rollResult?.success) {
                    logger.log(`AvantItemSheet | ${rollType} roll executed for ${this.document.name}`);
                } else {
                    FoundryUI.notify(rollResult?.error || 'Roll failed', 'error');
                }
            } catch (error) {
                logger.error('AvantItemSheet | Roll execution failed:', error);
                FoundryUI.notify('Roll failed', 'error');
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

            // Find the trait chip container by traversing up from the remove button
            // Template structure: <span class="trait-chip"><button class="trait-chip__remove">
            const chip = target.closest('.trait-chip') as HTMLElement;
            if (!chip) {
                logger.error('AvantItemSheet | onRemoveTrait: Could not find trait chip element');
                return;
            }

            // Extract trait ID from the chip's data attribute
            // This ID corresponds to either system traits or custom world traits
            const traitId = chip.getAttribute('data-trait');
            if (!traitId) {
                logger.error('AvantItemSheet | onRemoveTrait: No trait ID found in chip data');
                return;
            }

            // Get current traits array from document system data
            const currentTraits = this.document.system.traits || [];

            // Use trait utility function to safely remove the trait
            // This function handles array manipulation and validation
            const result = removeTraitFromList(currentTraits, traitId);

            if (!result.success) {
                logger.error(`AvantItemSheet | Failed to remove trait: ${result.error}`);
                return;
            }

            // Store chip data for potential rollback
            const chipHtml = chip.outerHTML;
            const traitName = chip.querySelector('.trait-chip__text')?.textContent || traitId;

            try {
                // Disable automatic form submission to prevent jarring page refresh
                this._disableAutoSubmit();

                // Set optimistic update flag to prevent unnecessary re-renders
                this.traitInputState.optimisticUpdate = true;

                // OPTIMISTIC UPDATE: Remove the chip immediately for instant feedback
                this._removeTraitChipOptimistically(traitId);

                // Update the document in the background (this triggers re-render)
                await this.document.update({
                    'system.traits': result.traits
                });

                // Log successful removal for debugging and audit trail
                logger.info(`AvantItemSheet | Removed trait ${traitId} from ${this.document.name}`);
                FoundryUI.notify(`Removed trait: ${traitName}`, 'info');

            } catch (error) {
                // ROLLBACK: If save fails, restore the chip
                logger.error('AvantItemSheet | Error updating document after trait removal:', error);
                this._restoreTraitChipOptimistically(chipHtml, traitId);
                FoundryUI.notify('Failed to remove trait', 'error');
            } finally {
                // Clear optimistic update flag and restore auto-submit
                this.traitInputState.optimisticUpdate = false;
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
        private async _showTraitSuggestions(query: string): Promise<void> {
            try {
                // Access TraitProvider service through the initialization manager
                // This pattern ensures proper service availability in ApplicationV2
                const game = (globalThis as any).game;
                if (!game?.avant?.initializationManager) {
                    logger.warn('AvantItemSheet | InitializationManager not available for trait suggestions');
                    this._showNoTraitSuggestions('Service not available');
                    return;
                }

                const traitProvider = game.avant.initializationManager.getService('traitProvider');
                if (!traitProvider) {
                    logger.warn('AvantItemSheet | TraitProvider service not available');
                    this._showNoTraitSuggestions('Trait service unavailable');
                    return;
                }

                // CRITICAL FIX: Properly await the getAll() call and handle the result structure
                // TraitProvider.getAll() returns Promise<TraitProviderResult<Trait[]>>, not a direct array
                const allTraitsResult = await traitProvider.getAll();
                if (!allTraitsResult.success || !allTraitsResult.data) {
                    logger.warn('AvantItemSheet | Failed to load traits from provider:', allTraitsResult.error);
                    this._showNoTraitSuggestions('Failed to load traits');
                    return;
                }

                // Extract the actual traits array from the result
                const allTraits = allTraitsResult.data;

                // Filter traits based on user's search query
                // Case-insensitive matching on trait names
                const matchingTraits = allTraits.filter((trait: any) => {
                    if (!trait?.name) return false;
                    return trait.name.toLowerCase().includes(query.toLowerCase());
                });

                // Get traits already assigned to this item to prevent duplicates
                const existingTraitIds = this.document.system.traits || [];

                // Filter out traits already on the item
                const availableTraits = matchingTraits.filter((trait: any) => {
                    return !existingTraitIds.includes(trait.id);
                });

                if (availableTraits.length === 0) {
                    this._showNoTraitSuggestions();
                    return;
                }

                // Generate and display trait suggestions using the renderer service
                await this._displayTraitSuggestions(availableTraits);

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
                if (!game?.avant?.initializationManager) {
                    logger.warn('AvantItemSheet | InitializationManager not available for trait validation');
                    FoundryUI.notify('Trait service not available', 'warn');
                    return;
                }

                const traitProvider = game.avant.initializationManager.getService('traitProvider');
                if (!traitProvider) {
                    logger.warn('AvantItemSheet | TraitProvider service not available for trait validation');
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

                    // Set optimistic update flag to prevent unnecessary re-renders
                    this.traitInputState.optimisticUpdate = true;

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
                        this.traitInputState.optimisticUpdate = false;
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
                const traitContainer = this.element.querySelector('.trait-chip-input__field');
                const traitInput = this.element.querySelector('.trait-chip-input__input');

                if (!traitContainer || !traitInput) {
                    logger.warn('AvantItemSheet | Cannot add trait chip - container not found');
                    return;
                }

                // Create the trait chip HTML using the same pattern as the template
                const chipHtml = `
                <span class="trait-chip trait-chip--removable" data-trait="${trait.id}" 
                      style="--trait-color: ${trait.color || '#00E0DC'}; --trait-text-color: ${trait.textColor || '#000000'}; background-color: var(--trait-color); color: var(--trait-text-color);"
                      title="${trait.description || trait.name}">
                    ${trait.icon ? `<i class="trait-chip__icon ${trait.icon}" aria-hidden="true"></i>` : ''}
                    <span class="trait-chip__text">${trait.name}</span>
                    <button type="button" class="trait-chip__remove" data-action="removeTrait" aria-label="Remove trait">×</button>
                </span>
            `;

                // Insert the chip before the input field
                traitInput.insertAdjacentHTML('beforebegin', chipHtml);

                // NOTE: Don't add hidden inputs during optimistic updates as they trigger 
                // automatic form submission. The document.update() call will handle persistence.

                logger.debug('AvantItemSheet | Optimistically added trait chip:', trait.name);

            } catch (error) {
                logger.error('AvantItemSheet | Error adding trait chip optimistically:', error);
            }
        }

        /**
         * Remove a trait chip from the DOM immediately for rollback
         * @param traitId - The trait ID to remove
         * @private
         */
        private _removeTraitChipOptimistically(traitId: string): void {
            try {
                const chipToRemove = this.element.querySelector(`[data-trait="${traitId}"]`);
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

// Note: The actual AvantItemSheet class is created by the createAvantItemSheet() factory function
// when called by the initialization system. This ensures Foundry classes are available.