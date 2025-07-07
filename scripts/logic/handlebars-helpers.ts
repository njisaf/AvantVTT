/**
 * @fileoverview Handlebars Helper Functions
 * @description Custom Handlebars helpers for templates, including AP selector and form utilities
 * @version 2.0.0
 * @author Avant Development Team
 */

import { getApIconsHtml, validateApCost } from './ap-selector-utils';

/**
 * Generates HTML for an AP (Action Point) selector component.
 * 
 * This helper creates a visual selector showing circles that represent
 * action point costs. Users can click circles to set the AP cost.
 * 
 * @param {number} currentApCost - The current AP cost to display
 * @returns {string} HTML string for the AP selector
 * 
 * @example
 * {{apSelector system.apCost}}
 * // Generates clickable AP selector with current value
 */
export function apSelector(currentApCost: number): string {
    return getApIconsHtml(currentApCost);
}

/**
 * Validates and displays a PP (Power Point) cost field.
 * 
 * This helper ensures PP cost values are valid (>= 0) and provides
 * a properly styled input field.
 * 
 * @param {number} ppCost - The current PP cost
 * @param {string} fieldName - The form field name (e.g., "system.ppCost")
 * @returns {string} HTML string for PP cost input
 * 
 * @example
 * {{ppCostInput system.ppCost "system.ppCost"}}
 * // Generates validated PP cost input field
 */
export function ppCostInput(ppCost: number, fieldName: string): string {
    const validCost = Math.max(0, Number(ppCost) || 0);
    
    return `
        <div class="pp-cost-input">
            <label for="${fieldName}">Power Points</label>
            <input type="number" 
                   name="${fieldName}" 
                   value="${validCost}" 
                   min="0" 
                   data-dtype="Number"
                   class="pp-cost-field"
                   aria-label="Power Point cost">
        </div>
    `;
}

/**
 * Generates HTML for a level requirement input field.
 * 
 * This helper ensures level requirements are valid (>= 1) and provides
 * proper styling and validation.
 * 
 * @param {number} levelReq - The current level requirement
 * @param {string} fieldName - The form field name (e.g., "system.levelRequirement")
 * @returns {string} HTML string for level requirement input
 * 
 * @example
 * {{levelRequirementInput system.levelRequirement "system.levelRequirement"}}
 * // Generates validated level requirement input
 */
export function levelRequirementInput(levelReq: number, fieldName: string): string {
    const validLevel = Math.max(1, Number(levelReq) || 1);
    
    return `
        <div class="level-requirement-input">
            <label for="${fieldName}">Level Required</label>
            <input type="number" 
                   name="${fieldName}" 
                   value="${validLevel}" 
                   min="1" 
                   data-dtype="Number"
                   class="level-requirement-field"
                   aria-label="Minimum level required">
        </div>
    `;
}

/**
 * Generates HTML for a requirements textarea field.
 * 
 * This helper provides a properly sized textarea for free-text
 * requirements with appropriate styling.
 * 
 * @param {string} requirements - Current requirements text
 * @param {string} fieldName - The form field name (e.g., "system.requirements")
 * @returns {string} HTML string for requirements textarea
 * 
 * @example
 * {{requirementsTextarea system.requirements "system.requirements"}}
 * // Generates requirements textarea field
 */
export function requirementsTextarea(requirements: string, fieldName: string): string {
    const safeRequirements = String(requirements || '').replace(/"/g, '&quot;');
    
    return `
        <div class="requirements-input">
            <label for="${fieldName}">Requirements</label>
            <textarea name="${fieldName}" 
                      rows="3" 
                      class="requirements-field"
                      placeholder="Enter any requirements or prerequisites..."
                      aria-label="Requirements or prerequisites">${safeRequirements}</textarea>
        </div>
    `;
}

/**
 * Checks if a value represents a "filled" AP icon for display purposes.
 * 
 * This helper is used in templates to determine whether an AP icon
 * should be displayed as filled or empty.
 * 
 * @param {number} iconIndex - The icon position (0-3)
 * @param {number} currentApCost - The current AP cost
 * @returns {boolean} True if this icon should be filled
 * 
 * @example
 * {{#if (apIconFilled @index ../system.apCost)}}filled{{else}}empty{{/if}}
 * // Conditional class based on whether icon is filled
 */
export function apIconFilled(iconIndex: number, currentApCost: number): boolean {
    const validCost = validateApCost(currentApCost);
    return iconIndex > 0 && iconIndex <= validCost;
}

/**
 * Object containing all helper functions for registration with Handlebars.
 * Import this to register all helpers at once.
 */
export const handlebarHelpers = {
    apSelector,
    ppCostInput, 
    levelRequirementInput,
    requirementsTextarea,
    apIconFilled
}; 