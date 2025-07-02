/**
 * @fileoverview AP Selector Utility Functions
 * @description Pure functions for handling Action Point (AP) icon selection and validation
 * @version 2.0.0
 * @author Avant Development Team
 */

/**
 * Validates and normalizes an AP cost value to ensure it's within valid range (0-3).
 * 
 * This function takes any input and converts it to a valid AP cost.
 * AP costs represent action points spent to use abilities, shown as filled circles.
 * 
 * @param {any} value - The value to validate (can be number, string, or other)
 * @returns {number} A valid AP cost between 0 and 3 (inclusive)
 * 
 * @example
 * // Valid values pass through unchanged
 * validateApCost(2) // Returns: 2
 * 
 * @example
 * // Invalid values get clamped or converted
 * validateApCost(-1) // Returns: 0
 * validateApCost(5) // Returns: 3
 * validateApCost("2") // Returns: 2
 * validateApCost(null) // Returns: 0
 */
export function validateApCost(value: any): number {
    if (value === null || value === undefined) {
        return 0;
    }
    
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    
    // If conversion failed, return 0
    if (isNaN(numValue)) {
        return 0;
    }
    
    // Round down and clamp to valid range (0-3)
    const rounded = Math.floor(numValue);
    return Math.max(0, Math.min(3, rounded));
}

/**
 * Generates HTML for an AP icon selector showing circles that can be clicked.
 * 
 * This creates a visual selector with 4 circles (0-3 AP cost) where filled circles
 * show the current cost and empty circles can be clicked to change it.
 * 
 * @param {number} currentApCost - The current AP cost to display (0-3)
 * @returns {string} HTML string for the AP selector component
 * 
 * @example
 * const html = getApIconsHtml(2);
 * // Returns HTML with 2 filled circles and 2 empty circles
 */
export function getApIconsHtml(currentApCost: number): string {
    const validCost = validateApCost(currentApCost);
    
    const icons = [];
    for (let i = 0; i <= 3; i++) {
        const isFilled = i > 0 && i <= validCost;
        const iconClass = isFilled ? 'ap-icon ap-icon--filled' : 'ap-icon ap-icon--empty';
        
        icons.push(`
            <button type="button" 
                    class="${iconClass}" 
                    data-ap-value="${i}"
                    title="Set AP cost to ${i}"
                    aria-label="Set Action Point cost to ${i}">
                <i class="fas fa-circle" aria-hidden="true"></i>
            </button>
        `);
    }
    
    return `
        <div class="ap-selector" 
             data-ap-cost="${validCost}"
             role="group" 
             aria-label="Action Point cost: ${validCost}">
            <label class="ap-selector__label">Action Points</label>
            <div class="ap-selector__icons">
                ${icons.join('')}
            </div>
            <input type="hidden" name="system.apCost" value="${validCost}" data-dtype="Number">
        </div>
    `;
}

/**
 * Extracts and validates AP cost from form data.
 * 
 * This function looks for the 'system.apCost' field in form data and
 * returns a validated AP cost value.
 * 
 * @param {FormData|null|undefined} formData - The form data to parse
 * @returns {number} The validated AP cost (0-3)
 * 
 * @example
 * const formData = new FormData();
 * formData.append('system.apCost', '2');
 * const apCost = parseApCostFromForm(formData); // Returns: 2
 */
export function parseApCostFromForm(formData: FormData | null | undefined): number {
    if (!formData) {
        return 0;
    }
    
    const apCostValue = formData.get('system.apCost');
    return validateApCost(apCostValue);
} 