/**
 * @fileoverview AP Selector Event Handler
 * @description Handles interactions with Action Point (AP) selector components in item sheets
 * @version 2.1.0 - Performance Optimized
 * @author Avant Development Team
 */

import { validateApCost } from '../logic/ap-selector-utils';

// Store debounced update timers per selector to prevent excessive database writes
const updateTimers = new WeakMap<HTMLElement, number>();

/**
 * Initializes AP selector functionality for an item sheet.
 * 
 * This function sets up event listeners for AP selector buttons and ensures
 * the visual state matches the current AP cost value. Now optimized to prevent
 * excessive re-rendering and database updates.
 * 
 * @param {HTMLElement} html - The sheet HTML element
 * @param {Function} updateCallback - Optional callback to update the form when AP cost changes
 * 
 * @example
 * // In an item sheet's activateListeners method:
 * initializeApSelector(html); // No callback needed - uses form change events
 */
export function initializeApSelector(html: HTMLElement, updateCallback?: (apCost: number) => void): void {
    const apSelectors = html.querySelectorAll('.ap-selector');
    
    apSelectors.forEach(selector => {
        const selectorElement = selector as HTMLElement;
        setupApSelector(selectorElement, updateCallback);
    });
}

/**
 * Sets up a single AP selector component with progressive toggle behavior.
 * 
 * This function handles the initialization and event binding for a single
 * AP selector, including visual state updates and click handlers.
 * Progressive toggle: clicking button N toggles between (N-1) and N AP cost.
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
    console.debug('AP Selector Setup:', {
        hiddenInputValue: hiddenInput.value,
        initialApCost: initialApCost,
        apIconsCount: apIcons.length,
        selectorDataApCost: selector.getAttribute('data-ap-cost')
    });
    
    // Update visual state to match initial value
    updateApSelectorVisual(selector, initialApCost);
    
    // Add click handlers to each AP icon with progressive toggle behavior
    apIcons.forEach((icon, index) => {
        icon.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            const clickedApValue = parseInt(icon.dataset.apValue || '1', 10);
            const currentApCost = validateApCost(hiddenInput.value);
            
            console.debug('AP Icon Clicked:', {
                clickedApValue: clickedApValue,
                currentApCost: currentApCost,
                iconIndex: index
            });
            
            // Progressive toggle behavior:
            // - If current AP cost equals the clicked button value, reduce to previous level
            // - Otherwise, set to the clicked button value
            let newApCost: number;
            if (currentApCost === clickedApValue) {
                // Toggle off: reduce to previous level (clicked value - 1)
                newApCost = Math.max(0, clickedApValue - 1);
            } else {
                // Set to clicked value (this will light up all buttons up to this level)
                newApCost = clickedApValue;
            }
            
            const validatedApCost = validateApCost(newApCost);
            
            console.debug('AP Cost Change:', {
                oldValue: currentApCost,
                newValue: validatedApCost,
                action: currentApCost === clickedApValue ? 'toggle-off' : 'set-value'
            });
            
            // Update hidden input immediately for UI responsiveness
            hiddenInput.value = validatedApCost.toString();
            
            // Update visual state immediately for instant feedback
            updateApSelectorVisual(selector, validatedApCost);
            
            // Use debounced update to prevent excessive database writes and re-renders
            debouncedUpdate(selector, validatedApCost, updateCallback);
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
 * Debounced update function to prevent excessive database writes.
 * 
 * This function delays the actual document update until the user stops
 * clicking for a short period, dramatically improving performance.
 * 
 * @param {HTMLElement} selector - The AP selector element
 * @param {number} apCost - The new AP cost value
 * @param {Function} updateCallback - Optional callback for updates
 */
function debouncedUpdate(selector: HTMLElement, apCost: number, updateCallback?: (apCost: number) => void): void {
    // Clear any existing timer for this selector
    const existingTimer = updateTimers.get(selector);
    if (existingTimer) {
        clearTimeout(existingTimer);
    }
    
    // Set a new timer for 300ms delay
    const newTimer = window.setTimeout(() => {
        updateTimers.delete(selector);
        
        // Call updateCallback if provided - this handles the actual document update
        if (updateCallback) {
            updateCallback(apCost);
        }
    }, 300); // 300ms debounce
    
    updateTimers.set(selector, newTimer);
}

/**
 * Updates the visual state of an AP selector to reflect the current AP cost.
 * 
 * This function updates which icons appear filled vs empty based on the
 * current AP cost value. Uses progressive/cumulative filling.
 * Optimized to minimize DOM manipulation.
 * 
 * @param {HTMLElement} selector - The AP selector container
 * @param {number} apCost - The current AP cost (0-3)
 */
function updateApSelectorVisual(selector: HTMLElement, apCost: number): void {
    const validatedCost = validateApCost(apCost);
    const apIcons = selector.querySelectorAll('.ap-icon') as NodeListOf<HTMLElement>;
    
    // Only log in debug mode to reduce console spam
    if (console.debug) {
        console.debug('Updating AP Selector Visual:', {
            inputApCost: apCost,
            validatedCost: validatedCost,
            iconsFound: apIcons.length
        });
    }
    
    // Update selector data attribute
    selector.setAttribute('data-ap-cost', validatedCost.toString());
    
    // Update aria label
    const ariaLabel = `Action Point cost: ${validatedCost}`;
    selector.setAttribute('aria-label', ariaLabel);
    
    // Update each icon's visual state - progressive filling
    // Optimized to minimize class manipulation
    apIcons.forEach((icon, index) => {
        const apValue = parseInt(icon.dataset.apValue || '1', 10);
        const shouldBeFilled = apValue <= validatedCost;
        const isSelected = apValue === validatedCost && validatedCost > 0;
        
        // Get current classes
        const classList = icon.classList;
        const hadFilled = classList.contains('ap-icon--filled');
        const hadEmpty = classList.contains('ap-icon--empty');
        const hadSelected = classList.contains('ap-icon--selected');
        
        // Only update classes if they actually need to change
        if (shouldBeFilled && !hadFilled) {
            classList.remove('ap-icon--empty');
            classList.add('ap-icon--filled');
        } else if (!shouldBeFilled && !hadEmpty) {
            classList.remove('ap-icon--filled', 'ap-icon--selected');
            classList.add('ap-icon--empty');
        }
        
        // Handle selected state
        if (isSelected && !hadSelected) {
            classList.add('ap-icon--selected');
        } else if (!isSelected && hadSelected) {
            classList.remove('ap-icon--selected');
        }
        
        // Update aria state only if changed
        const newPressed = shouldBeFilled.toString();
        const newChecked = isSelected.toString();
        
        if (icon.getAttribute('aria-pressed') !== newPressed) {
            icon.setAttribute('aria-pressed', newPressed);
        }
        if (icon.getAttribute('aria-checked') !== newChecked) {
            icon.setAttribute('aria-checked', newChecked);
        }
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
 * This function resets all AP selectors in a form to their default state (0 AP).
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
        
        // Check if AP cost is within valid range (0-3)
        if (apCost < 0 || apCost > 3) {
            errors.push(`AP selector ${index + 1}: Invalid AP cost ${apCost} (must be 0-3)`);
        }
    });
    
    return errors;
} 