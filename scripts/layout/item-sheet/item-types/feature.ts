/**
 * @fileoverview Feature Item Layout Definition
 * @description Declarative layout for feature item sheets
 * @version 1.0.0
 * @author Avant Development Team
 */

import { field, when, fullWidth, sideBy, filterFields, commonFields } from '../../shared/helpers';
import type { Field } from '../../shared/types';
import type { LayoutItemData, FeatureSystemData } from '../../shared/types';

/**
 * Header layout for feature items
 * Image and name side-by-side, then PP cost and active status
 */
export function header(item: LayoutItemData): Field[] {
    const system = item.system as FeatureSystemData;

    return filterFields([
        // Image and name side-by-side (standard pattern)
        sideBy(
            commonFields.image(item.img, 'feature'),
            commonFields.name(item.name, 'feature')
        ),

        // // PP cost and active status side-by-side
        // when(system.powerPointCost !== undefined && system.isActive !== undefined, () => {
        //     const ppCostField = field({
        //         type: 'number',
        //         name: 'system.powerPointCost',
        //         value: system.powerPointCost,
        //         label: 'PP Cost',
        //         min: 0,
        //         max: 20,
        //         placeholder: '0',
        //         hint: 'Power Point cost to use this feature',
        //         class: 'feature-pp-cost'
        //     });
        //     const activeField = field({
        //         type: 'checkbox',
        //         name: 'system.isActive',
        //         checked: system.isActive,
        //         label: 'Active',
        //         hint: 'Is this an active feature?',
        //         class: 'feature-active'
        //     });
        //     return sideBy(ppCostField, activeField);
        // }),

        // // Fallback individual fields
        // when(system.powerPointCost !== undefined && system.isActive === undefined, () => field({
        //     type: 'number',
        //     name: 'system.powerPointCost',
        //     value: system.powerPointCost,
        //     label: 'PP Cost',
        //     min: 0,
        //     max: 20,
        //     placeholder: '0',
        //     hint: 'Power Point cost to use this feature',
        //     class: 'feature-pp-cost'
        // })),

        // when(system.isActive !== undefined && system.powerPointCost === undefined, () => field({
        //     type: 'checkbox',
        //     name: 'system.isActive',
        //     checked: system.isActive,
        //     label: 'Active',
        //     hint: 'Is this an active feature?',
        //     class: 'feature-active'
        // }))
    ]);
}

/**
 * Body layout for feature items
 * Order: PP cost, active status, description, category, uses counter, traits
 */
export function body(item: LayoutItemData): Field[] {
    const system = item.system as FeatureSystemData;

    return filterFields([
        // 1. Meta fields first
        // when(system.powerPointCost !== undefined, () => field({
        //     type: 'number',
        //     name: 'system.powerPointCost',
        //     value: system.powerPointCost,
        //     label: 'PP Cost',
        //     min: 0,
        //     max: 20,
        //     placeholder: '0',
        //     hint: 'Power Point cost to use this feature',
        //     class: 'feature-pp-cost'
        // })),

        // when(system.isActive !== undefined, () => field({
        //     type: 'checkbox',
        //     name: 'system.isActive',
        //     checked: system.isActive,
        //     label: 'Active',
        //     hint: 'Is this an active feature?',
        //     class: 'feature-active'
        // })),

        // 2. Description (full width)
        commonFields.description(system.description, 'feature'),

        // 3. Category selection
        // when(system.category !== undefined, () => field({
        //     type: 'select',
        //     name: 'system.category',
        //     value: system.category || 'general',
        //     label: 'Category',
        //     options: [
        //         { value: 'general', label: 'General' },
        //         { value: 'combat', label: 'Combat' },
        //         { value: 'exploration', label: 'Exploration' },
        //         { value: 'social', label: 'Social' },
        //         { value: 'supernatural', label: 'Supernatural' }
        //     ],
        //     hint: 'Feature category for organization',
        //     class: 'feature-category'
        // })),

        // // 4. Uses counter if applicable
        // when(system.uses !== undefined, () => field({
        //     type: 'uses-counter',
        //     name: 'system.uses',
        //     current: system.uses.value || 0,
        //     max: system.uses.max || 1,
        //     label: 'Uses',
        //     hint: 'Current uses / Maximum uses',
        //     class: 'feature-uses'
        // })),

        // 5. Traits last (full width)
        commonFields.traits(system.traits, 'feature')
    ]);
}