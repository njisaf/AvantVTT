/**
 * @fileoverview AP Selector Event Handler
 * @description Handles interactions with Action Point (AP) selector components in item sheets
 * @version 2.0.0
 * @author Avant Development Team
 */

import { validateApCost } from '../logic/ap-selector-utils';

/**
 * Initializes AP selector functionality for an item sheet.
 * 
 * This function sets up event listeners for AP selector buttons and ensures
 * the visual state matches the current AP cost value.
 * 
 * @param {HTMLElement} html - The sheet HTML element
 * @param {Function} updateCallback - Callback to update the form when AP cost changes
 * 
 * @example
 * // In an item sheet's activateListeners method:
 * initializeApSelector(html, (newApCost) => {
 *     this.item.update({ "system.apCost": newApCost });
 * });
 */
export function initializeApSelector(html: HTMLElement, updateCallback?: (apCost: number) => void): void {
    const apSelectors = html.querySelectorAll('.ap-selector');
    
    apSelectors.forEach(selector => {
        const selectorElement = selector as HTMLElement;
        setupApSelector(selectorElement, updateCallback);
    });
}

/**
 * Sets up a single AP selector component.
 * 
 * This function handles the initialization and event binding for a single
 * AP selector, including visual state updates and click handlers.
 * 
 * @param {HTMLElement} selector - The AP selector container element
 * @param {Function} updateCallback - Optional callback for when AP cost changes
 */
function setupApSelector(selector: HTMLElement, updateCallback?: (apCost: number) => void): void {
    const hiddenInput = selector.querySelector('input[type="hidden"]') as HTMLInputElement;
    const apIcons = selector.querySelectorAll('.ap-icon') as NodeListOf<HTMLButtonElement>;
    
    if (!hiddenInput || !apIcons.length) {
        console.warn('AP selector missing required elements');
        return;
    }
    
    // Get initial AP cost value
    const initialApCost = validateApCost(hiddenInput.value);
    
    // Update visual state to match initial value
    updateApSelectorVisual(selector, initialApCost);
    
    // Add click handlers to each AP icon
    apIcons.forEach((icon, index) => {
        icon.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            const apValue = parseInt(icon.dataset.apValue || '0', 10);
            const validatedApCost = validateApCost(apValue);
            
            // Update hidden input
            hiddenInput.value = validatedApCost.toString();
            
            // Update visual state
            updateApSelectorVisual(selector, validatedApCost);
            
            // Call update callback if provided
            if (updateCallback) {
                updateCallback(validatedApCost);
            }
            
            // Trigger change event for form handling
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        });
        
        // Add keyboard support
        icon.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                icon.click();
            }
        });
    });
}

/**
 * Updates the visual state of an AP selector to reflect the current AP cost.
 * 
 * This function updates which icons appear filled vs empty based on the
 * current AP cost value.
 * 
 * @param {HTMLElement} selector - The AP selector container
 * @param {number} apCost - The current AP cost (0-3)
 */
function updateApSelectorVisual(selector: HTMLElement, apCost: number): void {
    const validatedCost = validateApCost(apCost);
    const apIcons = selector.querySelectorAll('.ap-icon') as NodeListOf<HTMLElement>;
    
    // Update selector data attribute
    selector.setAttribute('data-ap-cost', validatedCost.toString());
    
    // Update aria label
    const ariaLabel = `Action Point cost: ${validatedCost}`;
    selector.setAttribute('aria-label', ariaLabel);
    
    // Update each icon's visual state
    apIcons.forEach((icon, index) => {
        const apValue = parseInt(icon.dataset.apValue || '0', 10);
        const shouldBeFilled = apValue > 0 && apValue <= validatedCost;
        
        // Update CSS classes
        if (shouldBeFilled) {
            icon.classList.remove('ap-icon--empty');
            icon.classList.add('ap-icon--filled');
        } else {
            icon.classList.remove('ap-icon--filled');
            icon.classList.add('ap-icon--empty');
        }
        
        // Update aria state
        icon.setAttribute('aria-pressed', shouldBeFilled.toString());
    });
}

/**
 * Gets the current AP cost from an AP selector.
 * 
 * This function extracts the current AP cost value from a selector component.
 * 
 * @param {HTMLElement} selector - The AP selector container
 * @returns {number} The current AP cost (0-3)
 */
export function getApSelectorValue(selector: HTMLElement): number {
    const hiddenInput = selector.querySelector('input[type="hidden"]') as HTMLInputElement;
    
    if (!hiddenInput) {
        return 0;
    }
    
    return validateApCost(hiddenInput.value);
}

/**
 * Sets the AP cost value for an AP selector.
 * 
 * This function programmatically sets the AP cost and updates the visual state.
 * 
 * @param {HTMLElement} selector - The AP selector container
 * @param {number} apCost - The new AP cost value
 */
export function setApSelectorValue(selector: HTMLElement, apCost: number): void {
    const hiddenInput = selector.querySelector('input[type="hidden"]') as HTMLInputElement;
    
    if (!hiddenInput) {
        console.warn('Cannot set AP selector value: hidden input not found');
        return;
    }
    
    const validatedCost = validateApCost(apCost);
    hiddenInput.value = validatedCost.toString();
    updateApSelectorVisual(selector, validatedCost);
    
    // Trigger change event
    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Handles form reset for AP selectors.
 * 
 * This function resets all AP selectors in a form to their default state.
 * 
 * @param {HTMLElement} form - The form element containing AP selectors
 */
export function resetApSelectors(form: HTMLElement): void {
    const apSelectors = form.querySelectorAll('.ap-selector') as NodeListOf<HTMLElement>;
    
    apSelectors.forEach(selector => {
        setApSelectorValue(selector, 0);
    });
}

/**
 * Validates all AP selectors in a form.
 * 
 * This function checks that all AP selectors have valid values and
 * returns any validation errors.
 * 
 * @param {HTMLElement} form - The form element containing AP selectors
 * @returns {string[]} Array of validation error messages
 */
export function validateApSelectors(form: HTMLElement): string[] {
    const errors: string[] = [];
    const apSelectors = form.querySelectorAll('.ap-selector') as NodeListOf<HTMLElement>;
    
    apSelectors.forEach((selector, index) => {
        const apCost = getApSelectorValue(selector);
        
        // Check if AP cost is within valid range
        if (apCost < 0 || apCost > 3) {
            errors.push(`AP selector ${index + 1}: Invalid AP cost ${apCost} (must be 0-3)`);
        }
    });
    
    return errors;
} 