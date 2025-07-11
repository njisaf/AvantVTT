/**
 * @fileoverview Trait Input System - Extracted from item-sheet.ts
 * @deprecated This file contains the legacy trait input system that has been deprecated
 * in favor of drag-and-drop functionality. This code is preserved for restoration if needed.
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since 2025-01-17
 * 
 * DEPRECATION NOTICE:
 * This trait input system has been deprecated in favor of native FoundryVTT drag-and-drop.
 * The code is preserved here for potential restoration but should not be used in new development.
 * 
 * RESTORATION INSTRUCTIONS:
 * 1. Copy methods back to item-sheet.ts
 * 2. Re-add trait input event listeners in _activateTraitListeners()
 * 3. Restore traitInputState property
 * 4. Re-add trait input action handlers in DEFAULT_OPTIONS.actions
 * 5. Restore trait input imports
 * 
 * ORIGINAL LOCATION: avantVtt/scripts/sheets/item-sheet.ts (lines 140-145, 285-287, 1007-1022, 1607-1922)
 */

import { logger } from '../../../scripts/utils/logger.js';
import { addTraitToList, removeTraitFromList, generateTraitSuggestions, validateTraitList } from './trait-utils.ts';
import { renderTraitSuggestion } from './chat/trait-renderer.ts';

/**
 * Trait input state interface
 * @deprecated Part of legacy trait input system
 */
export interface TraitInputState {
    availableTraits: any[];
    currentInput: string;
    selectedIndex: number;
    isDropdownOpen: boolean;
}

/**
 * Legacy trait input methods extracted from AvantItemSheet
 * @deprecated This class contains deprecated trait input functionality
 */
export class TraitInputMethods {

    /**
     * Default trait input state
     * @deprecated Part of legacy trait input system
     */
    static getDefaultTraitInputState(): TraitInputState {
        return {
            availableTraits: [],
            currentInput: '',
            selectedIndex: -1,
            isDropdownOpen: false
        };
    }

    /**
     * Activate trait input event listeners
     * @deprecated Part of legacy trait input system
     * @param element - Sheet element
     * @param bindingContext - Context for method binding
     */
    static activateTraitListeners(element: HTMLElement, bindingContext: any): void {
        console.warn('Trait input system is deprecated. Use drag-and-drop instead.');

        const traitInput = element.querySelector('.trait-autocomplete') as HTMLInputElement;
        if (traitInput) {
            traitInput.addEventListener('input', bindingContext._onTraitInput.bind(bindingContext));
            traitInput.addEventListener('keydown', bindingContext._onTraitInputKeydown.bind(bindingContext));
            traitInput.addEventListener('focus', bindingContext._onTraitInputFocus.bind(bindingContext));
            traitInput.addEventListener('blur', bindingContext._onTraitInputBlur.bind(bindingContext));
        }

        // Add click listener for trait suggestions
        const dropdown = element.querySelector('.trait-suggestions');
        if (dropdown) {
            dropdown.addEventListener('click', (event: Event) => {
                const suggestion = (event.target as HTMLElement).closest('.trait-suggestion') as HTMLElement;
                if (suggestion) {
                    bindingContext.onTraitSuggestionClick(event, suggestion);
                }
            });
        }
    }

    /**
     * Handle trait input typing
     * @deprecated Part of legacy trait input system
     */
    static async onTraitInput(event: Event, context: any): Promise<void> {
        console.warn('Trait input system is deprecated. Use drag-and-drop instead.');

        const input = event.target as HTMLInputElement;
        const query = input.value.trim();
        context.traitInputState.currentInput = query;

        if (query.length > 0) {
            await TraitInputMethods.showTraitSuggestions(query, context);
        } else {
            TraitInputMethods.hideTraitSuggestions(context);
        }
    }

    /**
     * Handle trait input keydown events
     * @deprecated Part of legacy trait input system
     */
    static async onTraitInputKeydown(event: KeyboardEvent, context: any): Promise<void> {
        console.warn('Trait input system is deprecated. Use drag-and-drop instead.');

        const dropdown = context.element.querySelector('.trait-chip-input__dropdown');
        const suggestions = dropdown?.querySelectorAll('.trait-chip-input__suggestion') || [];

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                context.traitInputState.selectedIndex = Math.min(
                    context.traitInputState.selectedIndex + 1,
                    suggestions.length - 1
                );
                TraitInputMethods.updateSuggestionHighlight(context);
                break;

            case 'ArrowUp':
                event.preventDefault();
                context.traitInputState.selectedIndex = Math.max(
                    context.traitInputState.selectedIndex - 1,
                    -1
                );
                TraitInputMethods.updateSuggestionHighlight(context);
                break;

            case 'Enter':
                event.preventDefault();
                if (context.traitInputState.selectedIndex >= 0 && suggestions[context.traitInputState.selectedIndex]) {
                    const suggestion = suggestions[context.traitInputState.selectedIndex] as HTMLElement;
                    await TraitInputMethods.addTraitFromSuggestion(suggestion, context);
                } else if (context.traitInputState.currentInput.trim()) {
                    await TraitInputMethods.addTraitById(context.traitInputState.currentInput.trim(), context);
                }
                break;

            case 'Escape':
                event.preventDefault();
                TraitInputMethods.hideTraitSuggestions(context);
                break;
        }
    }

    /**
     * Handle trait input focus
     * @deprecated Part of legacy trait input system
     */
    static async onTraitInputFocus(event: Event, context: any): Promise<void> {
        console.warn('Trait input system is deprecated. Use drag-and-drop instead.');

        const input = event.target as HTMLInputElement;
        await TraitInputMethods.showTraitSuggestions(input.value.trim(), context);
    }

    /**
     * Handle trait input blur
     * @deprecated Part of legacy trait input system
     */
    static onTraitInputBlur(event: Event, context: any): void {
        console.warn('Trait input system is deprecated. Use drag-and-drop instead.');

        // Delay hiding to allow for click events
        setTimeout(() => {
            TraitInputMethods.hideTraitSuggestions(context);
        }, 200);
    }

    /**
     * Show trait suggestions dropdown
     * @deprecated Part of legacy trait input system
     */
    static async showTraitSuggestions(query: string, context: any): Promise<void> {
        console.warn('Trait input system is deprecated. Use drag-and-drop instead.');

        try {
            const game = (globalThis as any).game;
            const initializationManager = game?.avant?.initializationManager;

            if (!initializationManager) {
                logger.warn('TraitInputMethods | InitializationManager not available for trait suggestions');
                TraitInputMethods.showNoTraitSuggestions(context, 'Service not available');
                return;
            }

            const traitProvider = initializationManager.getService('traitProvider');
            if (!traitProvider) {
                TraitInputMethods.showNoTraitSuggestions(context, 'Trait service unavailable');
                return;
            }

            const result = await traitProvider.getAll();
            if (!result.success || !result.data) {
                TraitInputMethods.showNoTraitSuggestions(context, 'Failed to load traits');
                return;
            }

            const availableTraits = result.data;
            const suggestions = generateTraitSuggestions(availableTraits, query, 8);

            if (suggestions.length === 0) {
                TraitInputMethods.showNoTraitSuggestions(context);
                return;
            }

            await TraitInputMethods.displayTraitSuggestions(suggestions, context);
        } catch (error) {
            logger.error('TraitInputMethods | Error showing trait suggestions:', error);
            TraitInputMethods.showNoTraitSuggestions(context, 'Error loading traits');
        }
    }

    /**
     * Display trait suggestions in dropdown
     * @deprecated Part of legacy trait input system
     */
    static async displayTraitSuggestions(traits: any[], context: any): Promise<void> {
        console.warn('Trait input system is deprecated. Use drag-and-drop instead.');

        try {
            const dropdown = context.element.querySelector('.trait-chip-input__dropdown') as HTMLElement;
            if (!dropdown) {
                logger.warn('TraitInputMethods | Dropdown element not found');
                return;
            }

            const suggestionsHTML = traits.map(trait => renderTraitSuggestion(trait)).join('');
            dropdown.innerHTML = suggestionsHTML;
            dropdown.classList.add('trait-chip-input__dropdown--open');

            // Reset selection
            context.traitInputState.selectedIndex = -1;
        } catch (error) {
            logger.error('TraitInputMethods | Error displaying trait suggestions:', error);
            TraitInputMethods.showNoTraitSuggestions(context, 'Display error');
        }
    }

    /**
     * Hide trait suggestions dropdown
     * @deprecated Part of legacy trait input system
     */
    static hideTraitSuggestions(context: any): void {
        console.warn('Trait input system is deprecated. Use drag-and-drop instead.');

        if (!context.element) {
            logger.debug('TraitInputMethods | Cannot hide trait suggestions - element is null');
            return;
        }

        const dropdown = context.element.querySelector('.trait-chip-input__dropdown') as HTMLElement;
        if (dropdown) {
            dropdown.classList.remove('trait-chip-input__dropdown--open');
            context.traitInputState.selectedIndex = -1;
        }
    }

    /**
     * Show no trait suggestions message
     * @deprecated Part of legacy trait input system
     */
    static showNoTraitSuggestions(context: any, message?: string): void {
        console.warn('Trait input system is deprecated. Use drag-and-drop instead.');

        if (!context.element) {
            logger.debug('TraitInputMethods | Cannot show no trait suggestions - element is null');
            return;
        }

        const dropdown = context.element.querySelector('.trait-chip-input__dropdown') as HTMLElement;
        if (dropdown) {
            const noResultsDiv = dropdown.querySelector('.trait-chip-input__no-results') as HTMLElement;
            if (noResultsDiv) {
                noResultsDiv.textContent = message || 'No traits found';
                dropdown.innerHTML = noResultsDiv.outerHTML;
            }
            dropdown.classList.remove('trait-chip-input__dropdown--open');
        }
    }

    /**
     * Update suggestion highlight
     * @deprecated Part of legacy trait input system
     */
    static updateSuggestionHighlight(context: any): void {
        console.warn('Trait input system is deprecated. Use drag-and-drop instead.');

        const suggestions = context.element.querySelectorAll('.trait-chip-input__suggestion');
        suggestions.forEach((suggestion: HTMLElement, index: number) => {
            suggestion.classList.toggle('highlighted', index === context.traitInputState.selectedIndex);
        });
    }

    /**
     * Add trait from suggestion element
     * @deprecated Part of legacy trait input system
     */
    static async addTraitFromSuggestion(suggestion: HTMLElement, context: any): Promise<void> {
        console.warn('Trait input system is deprecated. Use drag-and-drop instead.');

        const traitId = suggestion.dataset.traitId;
        if (!traitId) {
            logger.warn('TraitInputMethods | No trait ID found in suggestion');
            return;
        }

        await TraitInputMethods.addTraitById(traitId, context);
    }

    /**
     * Add trait by ID
     * @deprecated Part of legacy trait input system
     */
    static async addTraitById(traitId: string, context: any): Promise<void> {
        console.warn('Trait input system is deprecated. Use drag-and-drop instead.');

        try {
            const currentTraits = context.document.system.traits || [];
            const result = addTraitToList(currentTraits, traitId);

            if (result.success) {
                await context.document.update({ 'system.traits': result.data });

                // Clear input and hide suggestions
                const input = context.element.querySelector('.trait-chip-input__input') as HTMLInputElement;
                if (input) {
                    input.value = '';
                    context.traitInputState.currentInput = '';
                }
                TraitInputMethods.hideTraitSuggestions(context);
            } else {
                logger.warn('TraitInputMethods | Failed to add trait:', result.message);
            }
        } catch (error) {
            logger.error('TraitInputMethods | Error adding trait:', error);
        }
    }

    /**
     * Handle trait suggestion click
     * @deprecated Part of legacy trait input system
     */
    static async onTraitSuggestionClick(event: Event, target: HTMLElement, context: any): Promise<void> {
        console.warn('Trait input system is deprecated. Use drag-and-drop instead.');

        event.preventDefault();
        const suggestion = target.closest('.trait-chip-input__suggestion') as HTMLElement;
        if (!suggestion) return;

        const traitId = suggestion.dataset.traitId;
        if (!traitId) {
            logger.warn('TraitInputMethods | No trait ID found in suggestion');
            return;
        }

        await TraitInputMethods.addTraitById(traitId, context);
    }

    /**
     * Handle trait field click
     * @deprecated Part of legacy trait input system
     */
    static async onTraitFieldClick(event: Event, target: HTMLElement, context: any): Promise<void> {
        console.warn('Trait input system is deprecated. Use drag-and-drop instead.');

        event.preventDefault();
        const input = context.element.querySelector('.trait-chip-input__input') as HTMLInputElement;
        if (input) {
            input.focus();
            await TraitInputMethods.showTraitSuggestions(input.value.trim(), context);
        }
    }
}

/**
 * Get trait input action handlers for ApplicationV2
 * @deprecated Part of legacy trait input system
 */
export function getTraitInputActions() {
    console.warn('Trait input system is deprecated. Use drag-and-drop instead.');

    return {
        traitFieldClick: function (this: any, event: Event, target: HTMLElement) {
            return TraitInputMethods.onTraitFieldClick(event, target, this);
        },
        traitSuggestionClick: function (this: any, event: Event, target: HTMLElement) {
            return TraitInputMethods.onTraitSuggestionClick(event, target, this);
        }
    };
}

export default TraitInputMethods; 