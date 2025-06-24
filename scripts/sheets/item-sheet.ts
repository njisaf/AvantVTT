/**
 * @fileoverview Item Sheet for Avant Native System
 * @version 2.0.0 - FoundryVTT v13+ Only
 * @author Avant Development Team
 * @description Item sheet handling with form validation for v13-only implementation and trait support
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

// Access FoundryVTT ItemSheet class - prioritize v13 namespaced class
const ItemSheetBase = (globalThis as any).foundry?.appv1?.sheets?.ItemSheet || 
                      (globalThis as any).ItemSheet ||
                      class {
                          static get defaultOptions() { return {}; }
                          _renderHTML() { throw new Error('ItemSheet base class not available'); }
                          _replaceHTML() { throw new Error('ItemSheet base class not available'); }
                      };

/**
 * Item Sheet Context interface for template rendering
 */
interface ItemSheetContext {
    item: any;
    system: any;
    flags: any;
    editable: boolean;
}

/**
 * Item Sheet for Avant Native System - FoundryVTT v13+
 * @class AvantItemSheet
 * @extends {ItemSheetBase}
 * @description Handles item sheet functionality with validation, roll handling, and trait management
 */
export class AvantItemSheet extends ItemSheetBase {
    /** The item document associated with this sheet */
    declare item: any;
    
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
     * Define default options for the item sheet
     * @static
     * @returns Sheet configuration options
     * @override
     */
    static get defaultOptions(): any {
        const foundryUtils = (globalThis as any).foundry?.utils;
        const mergeObject = foundryUtils?.mergeObject || Object.assign;
        
        return mergeObject(super.defaultOptions, {
            classes: ["avant", "sheet", "item"],
            width: 520,
            height: 480,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    /**
     * Check if this sheet is editable
     */
    get isEditable(): boolean {
        return (this as any).options?.editable !== false;
    }

    /**
     * Get the template path for this item type
     * @returns The template path
     * @override
     */
    get template(): string {
        const path = "systems/avant/templates/item";
        return `${path}/item-${this.item.type}-sheet.html`;
    }

    /**
     * Prepare data for rendering the item sheet
     * @returns The context data for template rendering
     * @override
     */
    async getData(): Promise<ItemSheetContext> {
        const context = super.getData() as any;
        const itemData = this.item.toObject(false);
        
        // Use pure function to prepare template data
        const templateData = prepareTemplateData(itemData);
        if (templateData) {
            // Merge with existing context
            Object.assign(context, templateData);
        } else {
            // Fallback to basic data structure
            context.system = itemData.system || {};
            context.flags = itemData.flags || {};
        }
        
        // Ensure traits array exists
        if (!context.system.traits) {
            context.system.traits = [];
        }
        
        // For trait items, convert tags array to string for template
        if (this.item.type === 'trait' && context.system.tags) {
            context.system.tagsString = Array.isArray(context.system.tags) 
                ? context.system.tags.join(',')
                : (context.system.tags || '');
        } else if (this.item.type === 'trait') {
            context.system.tagsString = '';
        }
        
        context.editable = this.isEditable;
        
        // Prepare trait display data for template (now async)
        await this._prepareTraitDisplayData(context);
        
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
        console.log('🏷️ TRAIT DEBUG | _prepareTraitDisplayData called with trait IDs:', traitIds);
        console.log('🏷️ TRAIT DEBUG | Item name:', context.item?.name || 'Unknown');
        console.log('🏷️ TRAIT DEBUG | Item type:', context.item?.type || 'Unknown');
        
        if (traitIds.length === 0) {
            console.log('🏷️ TRAIT DEBUG | No traits found on this item, displayTraits will be empty');
            return;
        }

        // Try to get actual trait data from the TraitProvider
        try {
            // Check if we have access to the TraitProvider through the initialization manager
            const game = (globalThis as any).game;
            if (game?.avant?.initializationManager) {
                const traitProvider = game.avant.initializationManager.getService('traitProvider');
                if (traitProvider) {
                    console.log('🏷️ TRAIT DEBUG | TraitProvider available, looking up trait data...');
                    
                    // Get all traits from the provider (properly await the async call)
                    const result = await traitProvider.getAll();
                    console.log('🏷️ TRAIT DEBUG | TraitProvider getAll() result:', result);
                    console.log('🏷️ TRAIT DEBUG | Result success:', result?.success);
                    console.log('🏷️ TRAIT DEBUG | Result data type:', typeof result?.data);
                    console.log('🏷️ TRAIT DEBUG | Result data length:', result?.data?.length);
                    
                    if (result.success && result.data) {
                        const allTraits = result.data;
                        console.log('🏷️ TRAIT DEBUG | Successfully loaded', allTraits.length, 'traits from provider');
                        
                        // Map trait IDs to actual trait data
                        context.displayTraits = traitIds.map((traitId: string) => {
                            const trait = allTraits.find((t: any) => t.id === traitId);
                            if (trait) {
                                console.log('🏷️ TRAIT DEBUG | Found trait data for ID', traitId, ':', trait.name);
                                return {
                                    id: traitId,
                                    name: trait.name,
                                    color: trait.color,
                                    icon: trait.icon,
                                    description: trait.description,
                                    displayId: traitId
                                };
                            } else {
                                console.log('🏷️ TRAIT DEBUG | No trait data found for ID', traitId, ', using fallback name generation');
                                return {
                                    id: traitId,
                                    name: this._generateFallbackTraitName(traitId),
                                    displayId: traitId
                                };
                            }
                        });
                        
                        console.log('🏷️ TRAIT DEBUG | Prepared trait display data with provider lookup for', context.item?.name || 'item', ':', context.displayTraits);
                        return;
                    } else {
                        console.log('🏷️ TRAIT DEBUG | TraitProvider getAll() failed, falling back to name generation. Error:', result?.error);
                    }
                } else {
                    console.log('🏷️ TRAIT DEBUG | TraitProvider service not available, falling back to name generation');
                }
            } else {
                console.log('🏷️ TRAIT DEBUG | InitializationManager not available, falling back to name generation');
            }
        } catch (error) {
            console.warn('🏷️ TRAIT DEBUG | Error accessing TraitProvider, falling back to name generation:', error);
        }

        // Fallback: create basic display data using ID parsing
        console.log('🏷️ TRAIT DEBUG | Using fallback name generation for trait display');
        context.displayTraits = traitIds.map((traitId: string) => ({
            id: traitId,
            name: this._generateFallbackTraitName(traitId),
            displayId: traitId
        }));

        console.log('🏷️ TRAIT DEBUG | Prepared trait display data for', context.item?.name || 'item', ':', context.displayTraits);
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
     * Handle core listener activation for v13 compatibility
     * @param html - The rendered HTML
     * @override
     */
    _activateCoreListeners(html: any): void {
        // FoundryVTT v13 compatibility fix for core listeners
        // Handle various types of HTML input that FoundryVTT might pass
        let element = html;
        
        // Handle jQuery objects by extracting the DOM element
        if (html instanceof jQuery) {
            if (html.length > 0) {
                element = html[0];
            } else {
                console.error('AvantItemSheet._activateCoreListeners: Empty jQuery object received', html);
                return;
            }
        }
        
        // Handle comment nodes or other non-element nodes
        if (element && element.nodeType === Node.COMMENT_NODE) {
            console.warn('AvantItemSheet._activateCoreListeners: Received comment node, looking for next element');
            // Try to find the next element sibling
            element = element.nextElementSibling;
        }
        
        // Handle document fragments or other container types
        if (element && element.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            // Look for the first element child
            element = element.querySelector('form') || element.firstElementChild;
        }
        
        // Final validation - ensure we have a valid DOM element
        if (!element || !element.querySelectorAll || typeof element.querySelectorAll !== 'function') {
            console.error('AvantItemSheet._activateCoreListeners: Could not find valid DOM element', html);
            return;
        }
        
        // FoundryVTT core expects jQuery objects, so wrap the DOM element back into jQuery
        const jQueryElement = $(element);
        
        // Call parent with jQuery-wrapped element
        super._activateCoreListeners(jQueryElement);
    }

    /**
     * Create a new AvantItemSheet instance
     */
    constructor(object: any, options: any = {}) {
        super(object, options);
        
        // Add debug logging to check game.avant availability during construction
        const game = (globalThis as any).game;
        console.log("🏷️ ITEM SHEET DEBUG | Constructor - game.avant exists:", !!game?.avant);
        console.log("🏷️ ITEM SHEET DEBUG | Constructor - initializationManager exists:", !!game?.avant?.initializationManager);
    }

    /**
     * Activate event listeners for the item sheet
     * @param html - The rendered HTML
     * @override
     */
    activateListeners(html: any): void {
        super.activateListeners(html);
        
        // Add debug logging to check game.avant availability when listeners are activated
        const game = (globalThis as any).game;
        console.log("🏷️ ITEM SHEET DEBUG | activateListeners - game.avant exists:", !!game?.avant);
        console.log("🏷️ ITEM SHEET DEBUG | activateListeners - initializationManager exists:", !!game?.avant?.initializationManager);

        if (!this.isEditable) return;

        // Rollable abilities
        html.find('.rollable').click(this._onRoll.bind(this));
        
        // Trait management event listeners
        this._activateTraitListeners(html);
    }

    /**
     * Activate trait-specific event listeners
     * @param html - The rendered HTML
     * @private
     */
    private _activateTraitListeners(html: any): void {
        console.log('🏷️ TRAIT DEBUG | Setting up trait event listeners...');
        
        // Trait chip removal (existing trait chips)
        html.find('.trait-chip__remove').click(this._onRemoveTrait.bind(this));
        
        // Trait input field events
        const traitInput = html.find('.trait-chip-input__input')[0];
        if (traitInput) {
            traitInput.addEventListener('input', this._onTraitInput.bind(this));
            traitInput.addEventListener('keydown', this._onTraitInputKeydown.bind(this));
            traitInput.addEventListener('focus', this._onTraitInputFocus.bind(this));
            traitInput.addEventListener('blur', this._onTraitInputBlur.bind(this));
            console.log('🏷️ TRAIT DEBUG | Input field event listeners attached');
        }
        
        // ✅ FIX: Use event delegation for dynamically created suggestion elements
        // Listen on the dropdown container instead of individual suggestions
        const dropdown = html.find('.trait-chip-input__dropdown')[0];
        if (dropdown) {
            dropdown.addEventListener('click', (event: Event) => {
                const suggestion = (event.target as HTMLElement).closest('.trait-chip-input__suggestion') as HTMLElement;
                if (suggestion) {
                    console.log('🏷️ TRAIT DEBUG | Suggestion clicked via event delegation:', suggestion.dataset.traitId);
                    event.preventDefault();
                    this._onTraitSuggestionClick(event);
                }
            });
            console.log('🏷️ TRAIT DEBUG | Event delegation set up for suggestion clicks');
        } else {
            console.warn('🏷️ TRAIT DEBUG | Dropdown container not found for event delegation');
        }
        
        // Trait input field clicks (for focus)
        html.find('.trait-chip-input__field').click(this._onTraitFieldClick.bind(this));
        
        console.log('🏷️ TRAIT DEBUG | All trait event listeners set up successfully');
    }

    /**
     * Handle removing a trait chip
     * @param event - The click event
     * @private
     */
    private async _onRemoveTrait(event: Event): Promise<void> {
        event.preventDefault();
        event.stopPropagation();
        
        const button = event.currentTarget as HTMLElement;
        const chip = button.closest('.trait-chip') as HTMLElement;
        
        if (!chip) return;
        
        const traitId = chip.dataset.trait;
        if (!traitId) return;
        
        // Get current traits
        const currentTraits = this.item.system.traits || [];
        
        // Use pure function to remove trait
        const { removeTraitFromList } = await import('../logic/trait-utils.ts');
        const result = removeTraitFromList(currentTraits, traitId);
        
        if (result.success && result.changed) {
            // Update the item
            await this.item.update({ 'system.traits': result.traits });
            
            // Update the UI immediately
            chip.remove();
            this._updateTraitHiddenInput(result.traits);
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
        const dropdown = this.element.find('.trait-chip-input__dropdown')[0];
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
                    // Try to add the typed trait as-is
                    await this._addTraitById(this.traitInputState.currentInput.trim());
                }
                break;
                
            case 'Escape':
                event.preventDefault();
                this._hideTraitSuggestions();
                (event.target as HTMLInputElement).blur();
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
        if (input.value.trim().length >= 1) {
            await this._showTraitSuggestions(input.value.trim());
        }
    }

    /**
     * Handle trait input blur (with delay to allow suggestion clicks)
     * @param event - The blur event
     * @private
     */
    private _onTraitInputBlur(event: Event): void {
        // Delay hiding to allow suggestion clicks
        setTimeout(() => {
            this._hideTraitSuggestions();
        }, 150);
    }

    /**
     * Handle clicking on trait field to focus input
     * @param event - The click event
     * @private
     */
    private _onTraitFieldClick(event: Event): void {
        const field = event.currentTarget as HTMLElement;
        const input = field.querySelector('.trait-chip-input__input') as HTMLInputElement;
        if (input) {
            input.focus();
        }
    }

    /**
     * Handle clicking on a trait suggestion
     * @param event - The click event
     * @private
     */
    private async _onTraitSuggestionClick(event: Event): Promise<void> {
        console.log('🏷️ TRAIT DEBUG | _onTraitSuggestionClick called');
        event.preventDefault();
        
        // Find the suggestion element from the event target
        const suggestion = (event.target as HTMLElement).closest('.trait-chip-input__suggestion') as HTMLElement;
        if (!suggestion) {
            console.warn('🏷️ TRAIT DEBUG | Could not find suggestion element from click event');
            return;
        }
        
        console.log('🏷️ TRAIT DEBUG | Found suggestion element:', suggestion.dataset.traitId);
        await this._addTraitFromSuggestion(suggestion);
    }

    /**
     * Show trait suggestions dropdown
     * @param query - The search query
     * @private
     */
    private async _showTraitSuggestions(query: string): Promise<void> {
        console.log('🏷️ TRAIT DEBUG | _showTraitSuggestions called with query:', query);
        
        try {
            // Get available traits from the trait provider
            const game = (globalThis as any).game;
            console.log('🏷️ TRAIT DEBUG | Game object exists:', !!game);
            console.log('🏷️ TRAIT DEBUG | game.avant exists:', !!game?.avant);
            console.log('🏷️ TRAIT DEBUG | game.avant properties:', Object.keys(game?.avant || {}));
            
            const initManager = game?.avant?.initializationManager;
            console.log('🏷️ TRAIT DEBUG | InitializationManager exists:', !!initManager);
            
            if (!initManager) {
                console.warn('🏷️ TRAIT DEBUG | InitializationManager not available for trait suggestions');
                console.log('🏷️ TRAIT DEBUG | Available on game.avant:', game?.avant);
                return;
            }
            
            console.log('🏷️ TRAIT DEBUG | InitializationManager found, waiting for traitProvider service...');
            const traitProvider = await initManager.waitForService('traitProvider');
            console.log('🏷️ TRAIT DEBUG | TraitProvider service result:', !!traitProvider);
            
            if (!traitProvider) {
                console.warn('🏷️ TRAIT DEBUG | TraitProvider not available for trait suggestions');
                console.log('🏷️ TRAIT DEBUG | Service status:', initManager.getStatusReport());
                return;
            }
            
            console.log('🏷️ TRAIT DEBUG | TraitProvider found, calling getAll()...');
            const traitsResult = await traitProvider.getAll();
            console.log('🏷️ TRAIT DEBUG | getAll() result:', traitsResult);
            console.log('🏷️ TRAIT DEBUG | Result success:', traitsResult?.success);
            console.log('🏷️ TRAIT DEBUG | Result data length:', traitsResult?.data?.length);
            
            if (!traitsResult.success || !traitsResult.data) {
                console.warn('🏷️ TRAIT DEBUG | Failed to load traits for suggestions:', traitsResult.error);
                return;
            }
            
            console.log('🏷️ TRAIT DEBUG | Traits loaded successfully, sample:', traitsResult.data.slice(0, 3).map((t: any) => ({ id: t.id, name: t.name })));
            
            // Generate suggestions using pure function
            const { generateTraitSuggestions } = await import('../logic/trait-utils.ts');
            console.log('🏷️ TRAIT DEBUG | Generating suggestions for query:', query);
            const suggestions = generateTraitSuggestions(traitsResult.data, query, 10);
            console.log('🏷️ TRAIT DEBUG | Generated suggestions:', suggestions.length, 'items');
            
            // Render suggestions
            const dropdown = this.element.find('.trait-chip-input__dropdown')[0];
            console.log('🏷️ TRAIT DEBUG | Dropdown element found:', !!dropdown);
            if (!dropdown) return;
            
            if (suggestions.length === 0) {
                console.log('🏷️ TRAIT DEBUG | No suggestions found, showing no results message');
                dropdown.innerHTML = '<div class="trait-chip-input__no-results">No matching traits found</div>';
            } else {
                console.log('🏷️ TRAIT DEBUG | Rendering', suggestions.length, 'suggestions');
                const { renderTraitSuggestion } = await import('../logic/chat/trait-renderer.ts');
                const html = suggestions
                    .map(suggestion => {
                        console.log('🏷️ TRAIT DEBUG | Looking for trait with suggestion ID:', suggestion.id);
                        console.log('🏷️ TRAIT DEBUG | Available trait IDs:', traitsResult.data.map((t: any) => t.id));
                        console.log('🏷️ TRAIT DEBUG | Suggestion object:', { id: suggestion.id, name: suggestion.name });
                        
                        const trait = traitsResult.data.find((t: any) => t.id === suggestion.id);
                        if (!trait) {
                            console.warn('🏷️ TRAIT DEBUG | Could not find trait for suggestion:', suggestion);
                            console.warn('🏷️ TRAIT DEBUG | Trying to find by name instead...');
                            const traitByName = traitsResult.data.find((t: any) => t.name === suggestion.name);
                            if (traitByName) {
                                console.log('🏷️ TRAIT DEBUG | Found trait by name:', traitByName.name);
                                const renderedHtml = renderTraitSuggestion(traitByName, suggestion.matchedText);
                                console.log(`🏷️ TRAIT DEBUG | Rendered suggestion for '${traitByName.name}':`, renderedHtml.length, 'characters');
                                return renderedHtml;
                            }
                            return '';
                        }
                        const renderedHtml = renderTraitSuggestion(trait, suggestion.matchedText);
                        console.log(`🏷️ TRAIT DEBUG | Rendered suggestion for '${trait.name}':`, renderedHtml.length, 'characters');
                        return renderedHtml;
                    })
                    .filter(html => html.length > 0) // Remove empty HTML strings
                    .join('');
                dropdown.innerHTML = html;
                console.log('🏷️ TRAIT DEBUG | Total HTML rendered for suggestions:', html.length, 'characters');
                console.log('🏷️ TRAIT DEBUG | Sample HTML:', html.substring(0, 200));
            }
            
            // Show dropdown
            dropdown.classList.add('trait-chip-input__dropdown--open');
            this.traitInputState.isDropdownOpen = true;
            this.traitInputState.selectedIndex = -1;
            console.log('🏷️ TRAIT DEBUG | Dropdown shown successfully');
            
        } catch (error) {
            console.error('🏷️ TRAIT DEBUG | Error showing trait suggestions:', error);
            console.error('🏷️ TRAIT DEBUG | Error stack:', (error as Error)?.stack || 'No stack trace');
        }
    }

    /**
     * Hide trait suggestions dropdown
     * @private
     */
    private _hideTraitSuggestions(): void {
        const dropdown = this.element.find('.trait-chip-input__dropdown')[0];
        if (dropdown) {
            dropdown.classList.remove('trait-chip-input__dropdown--open');
        }
        this.traitInputState.isDropdownOpen = false;
        this.traitInputState.selectedIndex = -1;
    }

    /**
     * Update suggestion highlighting
     * @private
     */
    private _updateSuggestionHighlight(): void {
        const dropdown = this.element.find('.trait-chip-input__dropdown')[0];
        const suggestions = dropdown?.querySelectorAll('.trait-chip-input__suggestion') || [];
        
        // Remove existing highlights
        suggestions.forEach((s: Element) => s.classList.remove('trait-chip-input__suggestion--highlighted'));
        
        // Add highlight to selected suggestion
        if (this.traitInputState.selectedIndex >= 0 && suggestions[this.traitInputState.selectedIndex]) {
            suggestions[this.traitInputState.selectedIndex].classList.add('trait-chip-input__suggestion--highlighted');
        }
    }

    /**
     * Add a trait from a suggestion element
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
     * Add a trait by ID
     * @param traitId - The trait ID to add
     * @private
     */
    private async _addTraitById(traitId: string): Promise<void> {
        try {
            console.log('🏷️ TRAIT DEBUG | _addTraitById called with:', traitId);
            
            // Get current traits
            const currentTraits = this.item.system.traits || [];
            console.log('🏷️ TRAIT DEBUG | Current traits before adding:', currentTraits);
            
            // Use pure function to add trait
            const { addTraitToList } = await import('../logic/trait-utils.ts');
            const result = addTraitToList(currentTraits, traitId);
            console.log('🏷️ TRAIT DEBUG | addTraitToList result:', result);
            
            if (result.success && result.changed) {
                console.log('🏷️ TRAIT DEBUG | Updating item with new traits:', result.traits);
                
                // Update the item
                await this.item.update({ 'system.traits': result.traits });
                console.log('🏷️ TRAIT DEBUG | Item updated successfully');
                
                // Clear the input
                const input = this.element.find('.trait-chip-input__input')[0] as HTMLInputElement;
                if (input) {
                    input.value = '';
                    this.traitInputState.currentInput = '';
                }
                
                // Hide suggestions
                this._hideTraitSuggestions();
                
                console.log('🏷️ TRAIT DEBUG | Trait addition complete, sheet should re-render');
                
                // Force re-render to show the new trait
                this.render(false);
                
            } else if (!result.success) {
                console.error('🏷️ TRAIT DEBUG | Failed to add trait:', result.error);
                FoundryUI.notify(`Failed to add trait: ${result.error}`, 'error');
            } else {
                console.log('🏷️ TRAIT DEBUG | Trait was not added (possibly duplicate)');
            }
            
        } catch (error) {
            console.error('🏷️ TRAIT DEBUG | Error adding trait:', error);
            FoundryUI.notify('Failed to add trait', 'error');
        }
    }

    /**
     * Update the hidden input field with current trait data
     * @param traits - Array of trait IDs
     * @private
     */
    private _updateTraitHiddenInput(traits: string[]): void {
        const hiddenInput = this.element.find('[data-trait-data="true"]')[0] as HTMLInputElement;
        if (hiddenInput) {
            hiddenInput.value = JSON.stringify(traits);
        }
    }

    /**
     * Handle rolls from the item sheet
     * @param event - The triggering event
     * @returns The executed roll or void
     * @private
     */
    async _onRoll(event: Event): Promise<any | void> {
        event.preventDefault();
        const element = event.currentTarget as HTMLElement;
        const dataset = element.dataset;

        // Use pure function to prepare roll configuration
        const game = (globalThis as any).game;
        const rollMode = game?.settings?.get?.('core', 'rollMode') || 'publicroll';
        const rollConfig = executeRoll(
            dataset as any,  // Cast to any to handle DOMStringMap typing
            { name: this.item.name },
            rollMode
        ) as any;  // Cast result to any to access properties

        if (rollConfig) {
            try {
                const Roll = (globalThis as any).Roll;
                const ChatMessage = (globalThis as any).ChatMessage;
                
                const roll = new Roll(rollConfig.rollExpression, this.item.getRollData());
                await roll.evaluate();
                
                const speaker = ChatMessage.getSpeaker({ actor: this.item.actor });
                
                // Stage 4: Add trait chips to chat message
                let flavor = rollConfig.message.flavor;
                if (itemHasTraits(this.item)) {
                    try {
                        console.log('🏷️ TRAIT DEBUG | Item roll - attempting to add traits for item:', this.item.name);
                        console.log('🏷️ TRAIT DEBUG | Item roll - item traits:', this.item.system.traits);
                        
                        // Get TraitProvider service from initialization manager
                        const { getInitializationManager } = await import('../utils/initialization-manager.js');
                        const manager = getInitializationManager();
                        console.log('🏷️ TRAIT DEBUG | Item roll - manager exists:', !!manager);
                        
                        const traitProvider = manager.getService('traitProvider'); // Fixed: lowercase 't'
                        console.log('🏷️ TRAIT DEBUG | Item roll - traitProvider service exists:', !!traitProvider);
                        
                        if (traitProvider) {
                            const traitHtml = await createTraitHtmlForChat(
                                this.item.system.traits, 
                                traitProvider, 
                                'small'
                            );
                            console.log('🏷️ TRAIT DEBUG | Item roll - generated trait HTML:', traitHtml);
                            if (traitHtml) {
                                flavor += `<br/>${traitHtml}`;
                                console.log('🏷️ TRAIT DEBUG | Item roll - added traits to flavor, final flavor:', flavor);
                            }
                        } else {
                            console.warn('🏷️ TRAIT DEBUG | Item roll - TraitProvider service not available');
                            const statusReport = manager.getStatusReport();
                            console.log('🏷️ TRAIT DEBUG | Item roll - service status:', statusReport);
                        }
                    } catch (traitError) {
                        logger.warn('Avant | Failed to add traits to item roll:', traitError);
                        console.error('🏷️ TRAIT DEBUG | Item roll - trait error details:', traitError);
                        // Continue with roll even if trait display fails
                    }
                }
                
                await roll.toMessage({
                    speaker: speaker,
                    flavor: flavor,
                    rollMode: rollConfig.message.rollMode,
                });
                
                return roll;
            } catch (error) {
                logger.error('Avant | Error in item sheet roll:', error);
                FoundryUI.notify(`Roll failed: ${(error as Error).message}`, 'error');
                return null;
            }
        }
        
        return undefined;
    }

    /**
     * Override the default update object method to ensure proper data type conversion
     * @param event - The form submission event
     * @param formData - The form data to process
     * @returns The processed update data
     * @override
     */
    async _updateObject(event: Event, formData: any): Promise<any> {
        // Use pure function to extract and process the form data
        const processedData = extractItemFormData(formData) as any;
        
        // Handle trait item tags conversion (string to array)
        if (this.item.type === 'trait' && formData['system.tags']) {
            processedData.system = processedData.system || {};
            const tagsString = formData['system.tags'].trim();
            if (tagsString) {
                // Convert comma-separated string to array
                processedData.system.tags = tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
            } else {
                processedData.system.tags = [];
            }
        }
        
        // Handle trait data specially
        if (formData['system.traits']) {
            try {
                const traitsData = JSON.parse(formData['system.traits']);
                if (Array.isArray(traitsData)) {
                    processedData.system = processedData.system || {};
                    processedData.system.traits = traitsData;
                }
            } catch (error) {
                console.warn('Failed to parse trait data:', error);
                // Keep existing traits if parsing fails
                processedData.system = processedData.system || {};
                processedData.system.traits = this.item.system.traits || [];
            }
        }
        
        // Convert back to flat object for FoundryVTT
        const foundryUtils = (globalThis as any).foundry?.utils;
        const flattenObject = foundryUtils?.flattenObject || ((obj: any) => obj);
        const flatData = flattenObject(processedData);
        
        // Call parent method with processed data
        return super._updateObject(event, flatData);
    }
} 