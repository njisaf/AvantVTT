/**
 * @fileoverview Item Sheet for Avant Native System
 * @version 2.0.0 - FoundryVTT v13+ ApplicationV2
 * @author Avant Development Team
 * @description Item sheet using ApplicationV2 framework for native v13 implementation
 */

import { ValidationUtils } from '../utils/validation.js';
import { executeRoll, processFormData } from '../logic/item-sheet.js';
import { prepareTemplateData, extractItemFormData } from '../logic/item-sheet-utils.js';
import { logger } from '../utils/logger.js';

// Import trait utilities
import { addTraitToList, removeTraitFromList, generateTraitSuggestions, validateTraitList } from '../logic/trait-utils.ts';
import { renderTraitSuggestion } from '../logic/chat/trait-renderer.ts';

// Import trait integration utilities for chat messages
import { createTraitHtmlForChat, itemHasTraits } from '../logic/chat/trait-resolver.ts';

// Import local foundry UI adapter for safe notifications
import { FoundryUI } from '../types/adapters/foundry-ui.ts';

/**
 * Get FoundryVTT v13 ApplicationV2 classes safely
 * @returns The required base classes for ApplicationV2
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
 */
interface ItemSheetContext {
    item: any;
    system: any;
    flags: any;
    editable: boolean;
    owner: boolean;
    enrichedDescription: string;
    displayTraits: any[];
}

/**
 * Factory function to create the AvantItemSheet class when Foundry is ready
 * @returns The AvantItemSheet class
 */
export function createAvantItemSheet() {
    // Get the base classes when they're available
    const { HandlebarsApplicationMixin, DocumentSheetV2 } = getFoundryV13Classes();
    
    /**
     * Item Sheet for Avant Native System - FoundryVTT v13+ ApplicationV2
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
    } = {
        availableTraits: [],
        currentInput: '',
        selectedIndex: -1,
        isDropdownOpen: false
    };
    
    /**
     * ApplicationV2 default options configuration
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
            handler: (event: Event, form: HTMLFormElement, formData: any) => {
                const sheet = (form.closest('.app') as any)?.app as AvantItemSheet;
                if (sheet) {
                    return sheet._onSubmitForm(event, form, formData);
                }
                return Promise.resolve();
            },
            submitOnChange: true,
            closeOnSubmit: false
        },
        actions: {
            roll: (event: Event, target: HTMLElement) => {
                const sheet = (target.closest('.app') as any)?.app as AvantItemSheet;
                return sheet?.onRoll(event, target);
            },
            removeTrait: (event: Event, target: HTMLElement) => {
                const sheet = (target.closest('.app') as any)?.app as AvantItemSheet;
                return sheet?.onRemoveTrait(event, target);
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
     * Static template will be overridden by get template
     * @static
     */
    static PARTS = {
        form: {
            template: "systems/avant/templates/item/item-gear-sheet.html" // Default fallback
        }
    };
    
    /**
     * Dynamic parts configuration based on item type
     * @override
     */
    get parts() {
        const type = this.document?.type || 'gear';
        const templatePath = `systems/avant/templates/item/item-${type}-sheet.html`;
        
        logger.debug('AvantItemSheet | Parts getter called - Dynamic template path:', {
            itemType: type,
            templatePath: templatePath,
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
     */
    tabGroups = {
        sheet: "description"
    };

    /**
     * Get the item document (compatibility accessor)
     */
    get item() {
        return this.document;
    }

    /**
     * Get the sheet title
     */
    get title() {
        const game = (globalThis as any).game;
        const title = this.document?.name || game?.i18n?.localize("SHEETS.ItemSheet") || "Item Sheet";
        return `${title} [${this.document?.type || "Item"}]`;
    }

    /**
     * Get the template path for this item type - Dynamic template selection
     * @override
     */
    get template(): string {
        const type = this.document?.type || 'gear';
        const templatePath = `systems/avant/templates/item/item-${type}-sheet.html`;
        
        logger.debug('AvantItemSheet | Using template path:', templatePath);
        
        return templatePath;
    }

    /**
     * Prepare context data for rendering the item sheet
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
        
        const context = await super._prepareContext(options) as any;
        const itemData = this.document.toObject(false);
        
        logger.debug('AvantItemSheet | Super context prepared:', {
            contextKeys: Object.keys(context),
            hasForm: !!context.form,
            hasTemplate: !!context.template
        });
        
        // Use pure function to prepare template data
        const templateData = prepareTemplateData(itemData);
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
                const TextEditor = (globalThis as any).TextEditor;
                if (TextEditor && TextEditor.enrichHTML) {
                    context.enrichedDescription = await TextEditor.enrichHTML(context.system.description, {async: true});
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
     * Override HTML rendering to add debug logging
     * @param context - The prepared context data
     * @param options - Rendering options
     * @override
     */
    async _renderHTML(context: any, options: any): Promise<object> {
        const templatePath = this.parts.form.template;
        
        logger.debug('AvantItemSheet | _renderHTML called', {
            itemType: this.document?.type,
            contextKeys: Object.keys(context || {}),
            partsConfig: this.parts,
            templatePath: templatePath
        });
        
        // Let's also test if we can manually render the template

        
        try {
            const result = await super._renderHTML(context, options);
            
            // Detailed investigation of the form content
            const form = (result as any)?.form;
            logger.debug('AvantItemSheet | _renderHTML result investigation:', {
                resultKeys: Object.keys(result || {}),
                hasForm: !!form,
                formType: typeof form,
                formConstructor: form?.constructor?.name || 'unknown',
                formIsElement: form instanceof Element,
                formIsDocumentFragment: form instanceof DocumentFragment,
                formInnerHTML: form?.innerHTML?.substring(0, 200) || 'no innerHTML',
                formTextContent: form?.textContent?.substring(0, 200) || 'no textContent',
                formOuterHTML: form?.outerHTML?.substring(0, 200) || 'no outerHTML'
            });
            
            return result;
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
        
        // Set up trait-specific listeners if editable
        if (this.isEditable) {
            this._activateTraitListeners();
        }
        
        logger.debug('AvantItemSheet | ApplicationV2 render completed', {
            itemId: this.document.id,
            itemType: this.document.type,
            editable: this.isEditable
        });
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
                    this._onTraitSuggestionClick(event);
                }
            });
        }
        
        // Update tag button states for trait sheets
        if (this.document.type === 'trait') {
            this._updateTagButtonStates();
        }
    }

    /**
     * Handle form submission - instance method for ApplicationV2 compatibility
     * @param event - The form submission event
     * @param form - The form element
     * @param formData - The form data
     */
    async _onSubmitForm(event: Event, form: HTMLFormElement, formData: any): Promise<void> {
        if (!this.document) return;

        try {
            // Use pure function to extract and process form data
            const processedData = processFormData(formData.object, this.document.type);
            
            // Expand the form data object for nested field handling
            const foundryUtils = (globalThis as any).foundry?.utils;
            const updateData = foundryUtils?.expandObject ? foundryUtils.expandObject(processedData) : processedData;
            
            // Update the item document
            await this.document.update(updateData);
            
            logger.debug('AvantItemSheet | Form submitted successfully', {
                itemId: this.document.id,
                updateData
            });
        } catch (error) {
            logger.error('AvantItemSheet | Form submission failed:', error);
            FoundryUI.notify(`Failed to update item: ${(error as Error).message}`, 'error');
        }
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
     * Handle trait removal action - instance method
     * @param event - The triggering event
     * @param target - The target element
     */
    async onRemoveTrait(event: Event, target: HTMLElement): Promise<void> {
        event.preventDefault();
        event.stopPropagation();
        
        if (!this.document) return;
        
        const chip = target.closest('.trait-chip') as HTMLElement;
        if (!chip) return;
        
        const traitId = chip.dataset.trait;
        if (!traitId) return;
        
        try {
            // Get current traits
            const currentTraits = this.document.system.traits || [];
            
            // Use pure function to remove trait
            const result = removeTraitFromList(currentTraits, traitId);
            
            if (result.success && result.changed) {
                // Update the item
                await this.document.update({ 'system.traits': result.traits });
                logger.log(`AvantItemSheet | Removed trait ${traitId} from ${this.document.name}`);
            }
        } catch (error) {
            logger.error('AvantItemSheet | Trait removal failed:', error);
            FoundryUI.notify('Failed to remove trait', 'error');
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
     * Show trait suggestions dropdown
     * @param query - The search query
     * @private
     */
    private async _showTraitSuggestions(query: string): Promise<void> {
        try {
            const suggestions = await generateTraitSuggestions(this.document.system.traits || [], query);
            
            const dropdown = this.element.querySelector('.trait-chip-input__dropdown');
            if (!dropdown) return;
            
            if (suggestions.length === 0) {
                dropdown.innerHTML = '<div class="trait-chip-input__no-results">No matching traits found</div>';
            } else {
                dropdown.innerHTML = suggestions.map((trait: any) => 
                    renderTraitSuggestion(trait as any)
                ).join('');
            }
            
            dropdown.classList.add('visible');
            this.traitInputState.isDropdownOpen = true;
            this.traitInputState.selectedIndex = -1;
            
        } catch (error) {
            console.warn('AvantItemSheet | Failed to generate trait suggestions:', error);
        }
    }

    /**
     * Hide trait suggestions dropdown
     * @private
     */
    private _hideTraitSuggestions(): void {
        const dropdown = this.element.querySelector('.trait-chip-input__dropdown');
        if (dropdown) {
            dropdown.classList.remove('visible');
            dropdown.innerHTML = '';
        }
        this.traitInputState.isDropdownOpen = false;
        this.traitInputState.selectedIndex = -1;
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
     * Add trait by ID
     * @param traitId - The trait ID to add
     * @private
     */
    private async _addTraitById(traitId: string): Promise<void> {
        try {
            const currentTraits = this.document.system.traits || [];
            const result = addTraitToList(currentTraits, traitId);
            
            if (result.success && result.changed) {
                await this.document.update({ 'system.traits': result.traits });
                
                // Clear input and hide dropdown
                const input = this.element.querySelector('.trait-chip-input__input') as HTMLInputElement;
                if (input) {
                    input.value = '';
                }
                this._hideTraitSuggestions();
                
                logger.log(`AvantItemSheet | Added trait ${traitId} to ${this.document.name}`);
            } else if (!result.success) {
                FoundryUI.notify(result.error || 'Failed to add trait', 'warn');
            }
        } catch (error) {
            logger.error('AvantItemSheet | Failed to add trait:', error);
            FoundryUI.notify('Failed to add trait', 'error');
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