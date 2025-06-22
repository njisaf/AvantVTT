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
}

/**
 * Item Sheet for Avant Native System - FoundryVTT v13+
 * @class AvantItemSheet
 * @extends {ItemSheetBase}
 * @description Handles item sheet functionality with validation and roll handling
 */
export class AvantItemSheet extends ItemSheetBase {
    /** The item document associated with this sheet */
    declare item: any;
    
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
    getData(): ItemSheetContext {
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
        
        return context;
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
     * Activate event listeners for the item sheet
     * @param html - The rendered HTML
     * @override
     */
    activateListeners(html: any): void {
        super.activateListeners(html);

        if (!this.isEditable) return;

        // Rollable abilities
        html.find('.rollable').click(this._onRoll.bind(this));
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
                
                await roll.toMessage({
                    speaker: speaker,
                    flavor: rollConfig.message.flavor,
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
        const processedData = extractItemFormData(formData);
        
        // Convert back to flat object for FoundryVTT
        const foundryUtils = (globalThis as any).foundry?.utils;
        const flattenObject = foundryUtils?.flattenObject || ((obj: any) => obj);
        const flatData = flattenObject(processedData);
        
        // Call parent method with processed data
        return super._updateObject(event, flatData);
    }
} 