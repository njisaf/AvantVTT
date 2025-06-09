/**
 * @fileoverview Item Sheet for Avant Native System
 * @version 2.0.0
 * @author Avant Development Team
 * @description Item sheet handling with form validation and v12/v13 compatibility
 */

import { CompatibilityUtils } from '../utils/compatibility.js';
import { ValidationUtils } from '../utils/validation.js';

/**
 * Item Sheet for Avant Native System - v12/v13 Compatible
 * @class AvantItemSheet
 * @extends {ItemSheet}
 * @description Handles item sheet functionality with validation and roll handling
 */
export class AvantItemSheet extends CompatibilityUtils.getItemSheetClass() {
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
        context.system = itemData.system;
        context.flags = itemData.flags;
        return context;
    }

    /**
     * Activate core listeners with v12/v13 compatibility
     * @param {jQuery|HTMLElement|DocumentFragment} html - The rendered HTML
     * @override
     * @private
     */
    _activateCoreListeners(html) {
        CompatibilityUtils.safeActivateListeners(this, html, super._activateCoreListeners);
    }

    /**
     * Activate event listeners for the item sheet
     * @param {jQuery|HTMLElement|DocumentFragment} html - The rendered HTML
     * @override
     */
    activateListeners(html) {
        CompatibilityUtils.safeActivateListeners(this, html, super.activateListeners);

        if (!this.isEditable) return;

        // Get normalized DOM element for event handling
        const element = CompatibilityUtils.normalizeHtmlForListeners(html);
        if (!element) {
            CompatibilityUtils.log('Failed to normalize HTML for listeners', 'error');
            return;
        }

        // Use pure DOM methods instead of jQuery for v13 compatibility
        // Rollable abilities
        element.querySelectorAll('.rollable').forEach(el => {
            el.addEventListener('click', this._onRoll.bind(this));
        });
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

        if (dataset.roll) {
            try {
                const roll = new Roll(dataset.roll, this.item.getRollData());
                await roll.evaluate();
                
                const label = dataset.label ? `${dataset.label}` : this.item.name;
                await roll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: this.item.actor }),
                    flavor: label,
                    rollMode: game.settings.get('core', 'rollMode'),
                });
                return roll;
            } catch (error) {
                console.error('Avant | Error in item sheet roll:', error);
                ui.notifications.error(`Roll failed: ${error.message}`);
            }
        }
    }

    /**
     * Override the default update object method to ensure proper data type conversion
     * @param {Event} event - The form submission event
     * @param {Object} formData - The form data to process
     * @returns {Promise<Object>} The processed update data
     * @override
     */
    async _updateObject(event, formData) {
        // Use ValidationUtils to process the form data
        const processedData = ValidationUtils.processFormData(formData, this.item.type);
        
        // Convert back to flat object for FoundryVTT
        const flatData = foundry.utils.flattenObject(processedData);
        
        // Call parent method with processed data
        return super._updateObject(event, flatData);
    }
} 