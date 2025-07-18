/**
 * @fileoverview Action Item Layout Definition
 * @description Declarative layout for action item sheets
 * @version 1.0.0
 * @author Avant Development Team
 */

import { field, when, fullWidth, sideBy, filterFields, commonFields } from '../../shared/helpers';
import type { Field } from '../../shared/types';
import type { LayoutItemData, ActionSystemData } from '../../shared/types';

/**
 * Header layout for action items
 * Image and name side-by-side, then ability and difficulty
 */
export function header(item: LayoutItemData): Field[] {
    const system = item.system as ActionSystemData;

    return filterFields([
        // Image and name side-by-side (standard pattern)
        sideBy(
            commonFields.image(item.img, 'action'),
            commonFields.name(item.name, 'action')
        ),

        // // Ability and difficulty side-by-side
        // when(system.ability !== undefined && system.difficulty !== undefined, () => {
        //     const abilityField = commonFields.ability(system.ability, 'action');
        //     const difficultyField = field({
        //         type: 'number',
        //         name: 'system.difficulty',
        //         value: system.difficulty,
        //         label: 'Difficulty',
        //         min: 1,
        //         max: 10,
        //         placeholder: '3',
        //         hint: 'Difficulty rating for this action',
        //         class: 'action-difficulty'
        //     });
        //     return sideBy(abilityField, difficultyField);
        // }),

        // // Fallback individual fields
        // when(system.ability !== undefined && system.difficulty === undefined, () => 
        //     commonFields.ability(system.ability, 'action')
        // ),

        // when(system.difficulty !== undefined && system.ability === undefined, () => field({
        //     type: 'number',
        //     name: 'system.difficulty',
        //     value: system.difficulty,
        //     label: 'Difficulty',
        //     min: 1,
        //     max: 10,
        //     placeholder: '3',
        //     hint: 'Difficulty rating for this action',
        //     class: 'action-difficulty'
        // }))
    ]);
}

/**
 * Body layout for action items
 * Simple layout: description, traits
 */
export function body(item: LayoutItemData): Field[] {
    const system = item.system as ActionSystemData;

    return filterFields([
        // 1. Description (full width)
        commonFields.description(system.description, 'action'),

        // 2. Traits last (full width)
        commonFields.traits(system.traits, 'action')
    ]);
}