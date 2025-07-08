/**
 * Get FoundryVTT v13 ApplicationV2 classes safely
 * 
 * ApplicationV2 classes are only available after FoundryVTT has fully loaded,
 * so we need to access them dynamically rather than importing them.
 * 
 * @returns The required base classes for ApplicationV2
 * @throws {Error} If ApplicationV2 classes are not available
 */
function getFoundryV13Classes() {
    const foundryGlobal = (globalThis as any).foundry;

    if (!foundryGlobal?.applications?.api) {
        throw new Error('FoundryVTT v13 ApplicationV2 classes not available - ensure you are running FoundryVTT v13+ and that Foundry has finished loading');
    }

    const { ApplicationV2, HandlebarsApplicationMixin, DocumentSheetV2 } = foundryGlobal.applications.api;

    if (!ApplicationV2 || !HandlebarsApplicationMixin || !DocumentSheetV2) {
        throw new Error('Required ApplicationV2 classes not found - ensure you are running FoundryVTT v13+');
    }

    return { ApplicationV2, HandlebarsApplicationMixin, DocumentSheetV2 };
}

/**
 * Factory function to create the BaseItemSheet class when Foundry is ready
 * 
 * This pattern ensures that ApplicationV2 classes are available before trying to extend them.
 * The factory approach prevents class definition errors during system initialization.
 * 
 * @returns The BaseItemSheet class
 */
export function createBaseItemSheet() {
    // Get the base classes when they're available
    const { HandlebarsApplicationMixin, DocumentSheetV2 } = getFoundryV13Classes();

    /**
     * Base Item Sheet for Avant VTT System
     * 
     * Provides a unified foundation for all item sheet types in the Avant system.
     * This class extends FoundryVTT's HandlebarsApplicationMixin(DocumentSheetV2) and 
     * implements the architectural patterns that all item sheets should follow.
     * 
     * @extends {HandlebarsApplicationMixin(DocumentSheetV2)}
     * @author Avant VTT Team
     * @version 1.0.0
     * @since Phase 1 - Item Sheet Unification
     */
    class BaseItemSheet extends HandlebarsApplicationMixin(DocumentSheetV2) {

        /** The item document associated with this sheet */
        declare document: any;

        /**
         * ApplicationV2 default options configuration
         */
        static DEFAULT_OPTIONS = {
            classes: ["avant", "item-sheet"],
            tag: "form",
            hasFrame: true,
            resizable: true,
            positioned: true,
            position: {
                width: 600,
                height: 500
            },
            window: {
                icon: "fas fa-box",
                title: "Item Sheet",
                controls: []
            },
            form: {
                submitOnChange: true,
                closeOnSubmit: false
            },
            actions: {
                // Action handlers will be defined by subclasses
            }
        };

        /**
         * ApplicationV2 parts configuration for templates
         */
        static PARTS = {
            form: {
                template: "systems/avant/templates/item/item-base-sheet.html"
            }
        };

        /**
         * Initialize the sheet with debug logging
         * Emits a debug banner when the sheet is instantiated
         */
        constructor(...args: any[]) {
            super(...args);
            console.debug("🏗 BaseItemSheet loaded", {
                itemType: this.document?.type,
                itemName: this.document?.name,
                sheetClass: this.constructor.name
            });
        }

        /**
         * Get the item document (compatibility accessor)
         * Provides backward compatibility for code that expects .item property
         */
        get item() {
            return this.document;
        }

        /**
         * Get the sheet title
         * ApplicationV2 uses this for window title display
         */
        get title() {
            const game = (globalThis as any).game;
            const title = this.document?.name || game?.i18n?.localize("SHEETS.ItemSheet") || "Item Sheet";
            return `${title} [${this.document?.type || "Item"}]`;
        }

        /**
         * Prepare context data for rendering the item sheet
         * This method prepares all data needed for template rendering
         */
        async _prepareContext(options: any): Promise<any> {
            const context = await super._prepareContext(options);
            const itemData = this.document.toObject(false);

            // Import field preparation functions
            try {
                const { prepareItemHeaderMetaFields, prepareItemBodyFields } = await import('../logic/item-sheet-utils.js');

                // Add basic context data that all item sheets need
                const baseContext = {
                    item: itemData,
                    system: itemData.system || {},
                    flags: itemData.flags || {},
                    editable: this.isEditable,
                    cssClass: this.getCssClass(),
                    tabs: this.getTabConfiguration(),
                    widgets: this.getWidgetConfigurations(),

                    // Prepare structured field data for consistent layout
                    metaFields: prepareItemHeaderMetaFields(itemData, itemData.system || {}),
                    bodyFields: prepareItemBodyFields(itemData, itemData.system || {})
                };

                // Merge contexts safely
                return Object.assign(context, baseContext);

            } catch (error) {
                console.warn('BaseItemSheet | Failed to import field preparation functions:', error);

                // Fallback to basic context without structured fields
                const fallbackContext = {
                    item: itemData,
                    system: itemData.system || {},
                    flags: itemData.flags || {},
                    editable: this.isEditable,
                    cssClass: this.getCssClass(),
                    tabs: this.getTabConfiguration(),
                    widgets: this.getWidgetConfigurations(),
                    metaFields: [],
                    bodyFields: []
                };

                return Object.assign(context, fallbackContext);
            }
        }

        /**
         * Get the CSS class for this sheet
         * Combines base classes with item-type specific classes
         */
        getCssClass(): string {
            const baseClasses = ["avant", "item-sheet"];
            const typeClass = `${this.document?.type || 'item'}-sheet`;
            return [...baseClasses, typeClass].join(" ");
        }

        /**
         * Get the tab configuration for this item type
         * Subclasses can override this to define their specific tabs
         */
        getTabConfiguration(): Array<{ id: string, label: string, icon?: string, active?: boolean }> {
            return [
                { id: "description", label: "Description", icon: "fas fa-book", active: true },
                { id: "details", label: "Details", icon: "fas fa-cogs" }
            ];
        }

        /**
         * Get widget configurations for this item type
         * This allows subclasses to define which widgets they need
         */
        getWidgetConfigurations(): Record<string, any> {
            const system = this.document?.system || {};
            return {
                apSelector: system.apCost !== undefined,
                ppCostInput: system.ppCost !== undefined,
                traitChips: system.traits !== undefined,
                imageUpload: this.document?.type !== "talent" && this.document?.type !== "augment",
                usesCounter: system.uses !== undefined
            };
        }

        /**
         * Get debug information about this sheet
         * Useful for troubleshooting and development
         */
        public getDebugInfo(): Record<string, any> {
            return {
                sheetClass: this.constructor.name,
                itemType: this.document?.type,
                itemName: this.document?.name,
                cssClass: this.getCssClass(),
                tabs: this.getTabConfiguration(),
                widgets: this.getWidgetConfigurations(),
                editable: this.isEditable
            };
        }
    }

    return BaseItemSheet;
} 