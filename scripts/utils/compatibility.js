/**
 * @fileoverview Compatibility Utilities for FoundryVTT v12/v13
 * @version 2.0.0
 * @author Avant Development Team
 * @description Provides version-aware compatibility layer for FoundryVTT API differences between v12 and v13
 */

/**
 * Compatibility utilities for handling FoundryVTT version differences
 * @class CompatibilityUtils
 * @description Provides static methods for version detection and compatibility handling
 */
export class CompatibilityUtils {
    /**
     * Detect the current FoundryVTT version
     * @static
     * @returns {string} The current FoundryVTT version
     */
    static getFoundryVersion() {
        if (!game) return '12.0.0';
        return game.version || game.data?.version || '12.0.0';
    }

    /**
     * Check if current version is FoundryVTT v13 or later
     * @static
     * @returns {boolean} True if v13+
     */
    static isV13OrLater() {
        const version = this.getFoundryVersion();
        if (!foundry?.utils?.isNewerVersion) {
            // Fallback version comparison for testing
            return version.startsWith('13') || parseInt(version.split('.')[0]) >= 13;
        }
        return foundry.utils.isNewerVersion(version, '12.999.999');
    }

    /**
     * Check if current version is FoundryVTT v12
     * @static
     * @returns {boolean} True if v12
     */
    static isV12() {
        const version = this.getFoundryVersion();
        return version.startsWith('12');
    }

    /**
     * Get the appropriate ActorSheet class for the current version
     * @static
     * @returns {Class} ActorSheet class
     */
    static getActorSheetClass() {
        return foundry?.appv1?.sheets?.ActorSheet || global.ActorSheet;
    }

    /**
     * Get the appropriate ItemSheet class for the current version
     * @static
     * @returns {Class} ItemSheet class
     */
    static getItemSheetClass() {
        return foundry?.appv1?.sheets?.ItemSheet || global.ItemSheet;
    }

    /**
     * Get the Actors collection for the current version
     * @static
     * @returns {Collection} Actors collection
     */
    static getActorsCollection() {
        return foundry.documents?.collections?.Actors || Actors;
    }

    /**
     * Get the Items collection for the current version
     * @static
     * @returns {Collection} Items collection
     */
    static getItemsCollection() {
        return foundry.documents?.collections?.Items || Items;
    }

    /**
     * Get the loadTemplates function for the current version
     * @static
     * @returns {Function} loadTemplates function
     */
    static getLoadTemplatesFunction() {
        return foundry.applications?.handlebars?.loadTemplates || loadTemplates;
    }

    /**
     * Normalize HTML element for listener attachment
     * @static
     * @param {jQuery|HTMLElement|DocumentFragment} html - The HTML to normalize
     * @returns {HTMLElement|null} Normalized DOM element
     */
    static normalizeHtmlForListeners(html) {
        let element = html;

        // Handle jQuery objects by extracting the DOM element
        if (html instanceof jQuery) {
            if (html.length > 0) {
                element = html[0];
            } else {
                console.error('CompatibilityUtils | Empty jQuery object received', html);
                return null;
            }
        }

        // Handle comment nodes or other non-element nodes
        if (element && element.nodeType === Node.COMMENT_NODE) {
            console.warn('CompatibilityUtils | Received comment node, looking for next element');
            element = element.nextElementSibling;
        }

        // Handle document fragments or other container types
        if (element && element.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            element = element.querySelector('form') || element.firstElementChild;
        }

        // Final validation - ensure we have a valid DOM element
        if (!element || !element.querySelectorAll || typeof element.querySelectorAll !== 'function') {
            console.error('CompatibilityUtils | Could not find valid DOM element', html);
            return null;
        }

        return element;
    }

    /**
     * Safely activate listeners for both v12/v13
     * @static
     * @param {Object} sheet - The sheet instance
     * @param {jQuery|HTMLElement|DocumentFragment} html - The HTML element
     * @param {Function} superMethod - The parent method to call
     */
    static safeActivateListeners(sheet, html, superMethod) {
        try {
            // Normalize the HTML element
            const element = this.normalizeHtmlForListeners(html);
            if (!element) {
                console.error('CompatibilityUtils | Failed to normalize HTML for listeners');
                return;
            }

            // FoundryVTT core expects jQuery objects, so wrap the DOM element back into jQuery
            const jQueryElement = $(element);

            // Call parent method with jQuery-wrapped element
            if (superMethod) {
                superMethod.call(sheet, jQueryElement);
            }
        } catch (error) {
            console.error('CompatibilityUtils | Error in safeActivateListeners:', error);
        }
    }

    /**
     * Get the appropriate chat context menu approach for the current version
     * @static
     * @returns {string} 'v12' or 'v13'
     */
    static getChatContextMenuApproach() {
        return this.isV13OrLater() ? 'v13' : 'v12';
    }

    /**
     * Version-aware logging
     * @static
     * @param {string} message - The message to log
     * @param {string} level - The log level ('info', 'warn', 'error')
     */
    static log(message, level = 'info') {
        const version = this.getFoundryVersion();
        const prefix = `Avant (v${version})`;
        
        switch (level) {
            case 'warn':
                console.warn(`${prefix} | ${message}`);
                break;
            case 'error':
                console.error(`${prefix} | ${message}`);
                break;
            default:
                console.log(`${prefix} | ${message}`);
                break;
        }
    }

    /**
     * Check if a feature is available in the current version
     * @static
     * @param {string} feature - Feature name to check
     * @returns {boolean} True if feature is available
     */
    static isFeatureAvailable(feature) {
        switch (feature) {
            case 'foundry.appv1':
                return this.isV13OrLater() && !!foundry.appv1;
            case 'applicationV1':
                return this.isV13OrLater();
            case 'documentCollections':
                return this.isV13OrLater() && !!foundry.documents?.collections;
            case 'handlebarsTemplates':
                return this.isV13OrLater() && !!foundry.applications?.handlebars;
            default:
                return false;
        }
    }
} 