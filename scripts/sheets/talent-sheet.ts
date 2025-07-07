/**
 * Talent Sheet for Avant VTT System - Phase 3 Component Library Implementation
 * 
 * This class provides a specialized item sheet for Talent items using the unified
 * component library architecture. It extends BaseItemSheet and provides talent-specific
 * configuration and data preparation.
 * 
 * Features:
 * - Single-content layout without tabs
 * - AP selector with 1-3 cost options
 * - Level requirement validation
 * - Trait management integration
 * - Component library validation
 * - Enhanced accessibility support
 * 
 * @extends {BaseItemSheet}
 * @author Avant VTT Team
 * @version 1.0.0
 * @since Phase 3 - Sheet Symphony Part I
 */

import { createBaseItemSheet } from './base-item-sheet.js';
import { validateItemByType } from '../logic/item-validation.js';
import { logger } from '../utils/logger.js';

/**
 * Factory function to create the TalentSheet class when Foundry is ready
 * 
 * This pattern ensures that BaseItemSheet is available before trying to extend it.
 * The factory approach prevents class definition errors during system initialization.
 * 
 * @returns The TalentSheet class
 */
export function createTalentSheet() {
    // Get the base sheet class when it's available
    const BaseItemSheet = createBaseItemSheet();
    
    /**
     * Talent Item Sheet Class
     * 
     * Provides specialized functionality for Talent items including:
     * - Component library template integration
     * - Talent-specific validation rules
     * - Optimized data preparation for single-content layout
     * - AP cost selector configuration
     */
    class TalentSheet extends BaseItemSheet {
        
                 /**
          * ApplicationV2 default options configuration for talent sheets
          */
         static DEFAULT_OPTIONS = {
             ...BaseItemSheet.DEFAULT_OPTIONS,
             classes: ["avant", "item-sheet", "talent-sheet"],
             window: {
                 icon: "fas fa-star",
                 title: "Talent Sheet",
                 controls: []
             },
             position: {
                 width: 520,
                 height: 500
             }
         };
        
        /**
         * ApplicationV2 parts configuration for talent templates
         */
        static PARTS = {
            form: {
                template: "systems/avant/templates/item/item-talent-new.html"
            }
        };
        
        /**
         * Get the CSS class for talent sheets
         * Combines base classes with talent-specific styling
         */
        getCssClass(): string {
            return "avant item-sheet talent-sheet";
        }
        
        /**
         * Get tab configuration for talent sheets
         * Talents use single-content layout, so no tabs needed
         */
        getTabConfiguration() {
            return []; // No tabs for single-content layout
        }
        
        /**
         * Get widget configurations for talent sheets
         * Defines which components are needed for talents
         */
        getWidgetConfigurations() {
            return {
                apSelector: true,          // AP cost selector (1-3)
                ppCostInput: false,        // No PP cost for talents
                traitChips: true,          // Trait management
                imageUpload: true,         // Image upload
                usesCounter: false,        // No uses counter for basic talents
                levelRequirement: true,    // Level requirement field
                requirements: true         // Requirements text field
            };
        }
        
        /**
         * Prepare context data for rendering the talent sheet
         * 
         * This method prepares talent-specific data including validation
         * of AP costs, level requirements, and trait management.
         */
        async _prepareContext(options: any): Promise<any> {
            const context = await super._prepareContext(options);
            
            // Validate talent data using comprehensive validation
            const validation = validateItemByType(context.item, 'talent');
            if (!validation.isValid) {
                logger.warn('TalentSheet | Validation issues found:', validation.errors);
                // Show validation errors to user
                const ui = (globalThis as any).ui;
                if (ui?.notifications) {
                    validation.errors.forEach(error => {
                        ui.notifications.warn(`Talent Validation: ${error}`);
                    });
                }
            }
            
            // Ensure system fields have proper defaults
            context.system = {
                apCost: 1,
                levelRequirement: 1,
                description: '',
                requirements: '',
                traits: [],
                ...context.system
            };
            
            // Prepare trait display data
            context.displayTraits = this._prepareTraitDisplay(context.system.traits || []);
            
            logger.debug('TalentSheet | Context prepared:', {
                itemName: context.item.name,
                apCost: context.system.apCost,
                levelRequirement: context.system.levelRequirement,
                traitCount: context.displayTraits.length
            });
            
            return context;
        }
        
        /**
         * Prepare trait display data for the template
         * 
         * This method processes trait data to provide the display format
         * needed by the trait-chip component.
         * 
         * @param traits - Array of trait IDs or trait objects
         * @returns Processed trait display data
         * @private
         */
        private _prepareTraitDisplay(traits: any[]): any[] {
            if (!Array.isArray(traits)) {
                return [];
            }
            
            // For now, return simple trait objects
            // This will be enhanced when trait service integration is available
            return traits.map((trait, index) => {
                if (typeof trait === 'string') {
                    return {
                        id: trait,
                        name: trait,
                        description: `Trait: ${trait}`,
                        color: '#6c757d',
                        icon: 'fas fa-tag'
                    };
                }
                return {
                    id: trait.id || `trait-${index}`,
                    name: trait.name || 'Unknown Trait',
                    description: trait.description || '',
                    color: trait.color || '#6c757d',
                    icon: trait.icon || 'fas fa-tag'
                };
            });
        }
    }
    
    return TalentSheet;
}

/**
 * Export factory function for external use
 */
export { createTalentSheet as default }; 