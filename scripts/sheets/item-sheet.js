/**
 * @fileoverview Item Sheet for Avant Native System
 * @version 2.0.0 - FoundryVTT v13+ Only
 * @author Avant Development Team
 * @description Item sheet handling with form validation for v13-only implementation
 */

import { ValidationUtils } from '../utils/validation.js';
import { executeRoll, processFormData } from '../logic/item-sheet.js';
import { prepareTemplateData, extractItemFormData } from '../logic/item-sheet-utils.js';
import { logger } from '../utils/logger.js';

/**
 * Item Sheet for Avant Native System - FoundryVTT v13+
 * @class AvantItemSheet
 * @extends {foundry.appv1.sheets.ItemSheet}
 * @description Handles item sheet functionality with validation and roll handling
 */
export class AvantItemSheet extends foundry.appv1.sheets.ItemSheet {
    /**
     * Define default options for the item sheet
     * @static
     * @returns {Object} Sheet configuration options
     * @override
     */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["avant", "sheet", "item"],
            width: 520,
            height: 480,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    /**
     * Get the template path for this item type
     * @returns {string} The template path
     * @override
     */
    get template() {
        const path = "systems/avant/templates/item";
        return `${path}/item-${this.item.type}-sheet.html`;
    }

    /**
     * Prepare data for rendering the item sheet
     * @returns {Object} The context data for template rendering
     * @override
     */
    getData() {
        const context = super.getData();
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
        
        return context;
    }

    /**
     * Handle core listener activation for v13 compatibility
     * @param {jQuery} html - The rendered HTML
     * @override
     */
    _activateCoreListeners(html) {
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
     * Activate event listeners for the item sheet
     * @param {jQuery} html - The rendered HTML
     * @override
     */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.isEditable) return;

        // Rollable abilities
        html.find('.rollable').click(this._onRoll.bind(this));
    }

    /**
     * Handle rolls from the item sheet
     * @param {Event} event - The triggering event
     * @returns {Promise<Roll|void>} The executed roll or void
     * @private
     */
    async _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        // Use pure function to prepare roll configuration
        const rollMode = game?.settings?.get?.('core', 'rollMode') || 'publicroll';
        const rollConfig = executeRoll(
            dataset,
            { name: this.item.name },
            rollMode
        );

        if (rollConfig) {
            try {
                const roll = new Roll(rollConfig.rollExpression, this.item.getRollData());
                await roll.evaluate();
                
                const speaker = ChatMessage.getSpeaker({ actor: this.item.actor });
                
                await roll.toMessage({
                    speaker: speaker,
                    flavor: rollConfig.message.flavor,
                    rollMode: rollConfig.message.rollMode,
                });
                
                return roll;
            } catch (error) {
                logger.error('Avant | Error in item sheet roll:', error);
                if (ui?.notifications?.error) {
                    ui.notifications.error(`Roll failed: ${error.message}`);
                }
                return null;
            }
        }
        
        return undefined;
    }

    /**
     * Override the default update object method to ensure proper data type conversion
     * @param {Event} event - The form submission event
     * @param {Object} formData - The form data to process
     * @returns {Promise<Object>} The processed update data
     * @override
     */
    async _updateObject(event, formData) {
        // Use pure function to extract and process the form data
        const processedData = extractItemFormData(formData);
        
        // Convert back to flat object for FoundryVTT
        const flatData = foundry.utils.flattenObject(processedData);
        
        // Call parent method with processed data
        return super._updateObject(event, flatData);
    }
} 