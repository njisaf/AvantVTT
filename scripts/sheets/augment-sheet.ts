/**
 * Augment Sheet for Avant VTT System - Phase 3 Component Library Implementation
 * 
 * This class provides a specialized item sheet for Augment items using the unified
 * component library architecture. It extends BaseItemSheet and provides augment-specific
 * configuration and data preparation.
 * 
 * Features:
 * - Single-content layout without tabs
 * - AP selector with 1-3 cost options
 * - PP cost input for power point management
 * - Rarity and augment type selection
 * - Active status toggle
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
import { validateItemByType, RARITY_VALUES, AUGMENT_TYPE_VALUES } from '../logic/item-validation.js';
import { logger } from '../utils/logger.js';

/**
 * Factory function to create the AugmentSheet class when Foundry is ready
 * 
 * This pattern ensures that BaseItemSheet is available before trying to extend it.
 * The factory approach prevents class definition errors during system initialization.
 * 
 * @returns The AugmentSheet class
 */
export function createAugmentSheet() {
    // Get the base sheet class when it's available
    const BaseItemSheet = createBaseItemSheet();
    
    /**
     * Augment Item Sheet Class
     * 
     * Provides specialized functionality for Augment items including:
     * - Component library template integration
     * - Augment-specific validation rules
     * - PP cost management
     * - Rarity and augment type options
     * - Active status tracking
     * - Optimized data preparation for single-content layout
     */
    class AugmentSheet extends BaseItemSheet {
        
        /**
         * ApplicationV2 default options configuration for augment sheets
         */
        static DEFAULT_OPTIONS = {
            ...BaseItemSheet.DEFAULT_OPTIONS,
            classes: ["avant", "item-sheet", "augment-sheet"],
            window: {
                icon: "fas fa-cogs",
                title: "Augment Sheet",
                controls: []
            },
            position: {
                width: 540,
                height: 550
            }
        };
        
        /**
         * ApplicationV2 parts configuration for augment templates
         */
        static PARTS = {
            form: {
                template: "systems/avant/templates/item/item-augment-new.html"
            }
        };
        
        /**
         * Get the CSS class for augment sheets
         * Combines base classes with augment-specific styling
         */
        getCssClass(): string {
            return "avant item-sheet augment-sheet";
        }
        
        /**
         * Get tab configuration for augment sheets
         * Augments use single-content layout, so no tabs needed
         */
        getTabConfiguration() {
            return []; // No tabs for single-content layout
        }
        
        /**
         * Get widget configurations for augment sheets
         * Defines which components are needed for augments
         */
        getWidgetConfigurations() {
            return {
                apSelector: true,          // AP cost selector (1-3)
                ppCostInput: true,         // PP cost for augments
                traitChips: true,          // Trait management
                imageUpload: true,         // Image upload
                usesCounter: false,        // Uses counter for some augments
                levelRequirement: true,    // Level requirement field
                requirements: true,        // Requirements text field
                raritySelector: true,      // Rarity selection
                augmentTypeSelector: true, // Augment type selection
                activeToggle: true         // Active status toggle
            };
        }
        
        /**
         * Prepare context data for rendering the augment sheet
         * 
         * This method prepares augment-specific data including validation
         * of AP costs, PP costs, level requirements, and trait management.
         * Also provides rarity and augment type option data.
         */
        async _prepareContext(options: any): Promise<any> {
            const context = await super._prepareContext(options);
            
            // Validate augment data using comprehensive validation
            const validation = validateItemByType(context.item, 'augment');
            if (!validation.isValid) {
                logger.warn('AugmentSheet | Validation issues found:', validation.errors);
                // Show validation errors to user
                const ui = (globalThis as any).ui;
                if (ui?.notifications) {
                    validation.errors.forEach(error => {
                        ui.notifications.warn(`Augment Validation: ${error}`);
                    });
                }
            }
            
            // Ensure system fields have proper defaults
            context.system = {
                apCost: 1,
                ppCost: 0,
                levelRequirement: 1,
                rarity: 'common',
                augmentType: 'enhancement',
                isActive: false,
                description: '',
                requirements: '',
                traits: [],
                ...context.system
            };
            
            // Prepare option data for select components
            context.rarityOptions = this._prepareRarityOptions(context.system.rarity);
            context.augmentTypeOptions = this._prepareAugmentTypeOptions(context.system.augmentType);
            
            // Prepare trait display data
            context.displayTraits = this._prepareTraitDisplay(context.system.traits || []);
            
            logger.debug('AugmentSheet | Context prepared:', {
                itemName: context.item.name,
                apCost: context.system.apCost,
                ppCost: context.system.ppCost,
                levelRequirement: context.system.levelRequirement,
                rarity: context.system.rarity,
                augmentType: context.system.augmentType,
                isActive: context.system.isActive,
                traitCount: context.displayTraits.length
            });
            
            return context;
        }
        
        /**
         * Prepare rarity options for the select component
         * 
         * @param currentValue - The current rarity value
         * @returns Array of option objects for the select component
         * @private
         */
        private _prepareRarityOptions(currentValue: string): Array<{value: string, label: string}> {
            return RARITY_VALUES.map(rarity => ({
                value: rarity,
                label: rarity.charAt(0).toUpperCase() + rarity.slice(1)
            }));
        }
        
        /**
         * Prepare augment type options for the select component
         * 
         * @param currentValue - The current augment type value
         * @returns Array of option objects for the select component
         * @private
         */
        private _prepareAugmentTypeOptions(currentValue: string): Array<{value: string, label: string}> {
            return AUGMENT_TYPE_VALUES.map(type => ({
                value: type,
                label: type.charAt(0).toUpperCase() + type.slice(1)
            }));
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
    
    return AugmentSheet;
}

/**
 * Export factory function for external use
 */
export { createAugmentSheet as default }; 