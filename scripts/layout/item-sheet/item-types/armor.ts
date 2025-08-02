/**
 * @fileoverview Armor Item Layout Definition
 * @description Declarative layout for armor item sheets
 * @version 1.0.0
 * @author Avant Development Team
 */

import { field, when, fullWidth, sideBy, filterFields, commonFields } from '../../shared/helpers';
import type { Field } from '../../shared/types';
import type { LayoutItemData, ArmorSystemData } from '../../shared/types';

/**
 * Header layout for armor items
 * Image and name side-by-side, then AC and threshold
 */
export function header(item: LayoutItemData): Field[] {
    const system = item.system as ArmorSystemData;

    return filterFields([
        // Image and name side-by-side (standard pattern)
        sideBy(
            commonFields.image(item.img, 'armor'),
            commonFields.name(item.name, 'armor')
        ),

        // // AC and threshold side-by-side
        // when((system.armorClass !== undefined || system.threshold !== undefined) && system.threshold !== undefined, () => {
        //     const acField = field({
        //         type: 'number',
        //         name: 'system.armorClass',
        //         value: system.armorClass || system.threshold,
        //         label: 'AC',
        //         min: 10,
        //         max: 25,
        //         placeholder: '10',
        //         hint: 'Armor Class defense value',
        //         class: 'armor-ac'
        //     });
        //     const thresholdField = field({
        //         type: 'number',
        //         name: 'system.threshold',
        //         value: system.threshold,
        //         label: 'Threshold',
        //         min: 0,
        //         max: 20,
        //         placeholder: '0',
        //         hint: 'Damage threshold before penetration',
        //         class: 'armor-threshold'
        //     });
        //     return sideBy(acField, thresholdField);
        // }),

        // // Fallback individual fields
        // when((system.armorClass !== undefined || system.threshold !== undefined) && system.threshold === undefined, () => field({
        //     type: 'number',
        //     name: 'system.armorClass',
        //     value: system.armorClass || system.threshold,
        //     label: 'AC',
        //     min: 10,
        //     max: 25,
        //     placeholder: '10',
        //     hint: 'Armor Class defense value',
        //     class: 'armor-ac'
        // })),

        // when(system.threshold !== undefined && (system.armorClass === undefined), () => field({
        //     type: 'number',
        //     name: 'system.threshold',
        //     value: system.threshold,
        //     label: 'Threshold',
        //     min: 0,
        //     max: 20,
        //     placeholder: '0',
        //     hint: 'Damage threshold before penetration',
        //     class: 'armor-threshold'
        // }))
    ]);
}

/**
 * Body layout for armor items
 * Order: AC, threshold, description, ability, modifier, weight, cost, traits
 */
export function body(item: LayoutItemData): Field[] {
    const system = item.system as ArmorSystemData;

    return filterFields([
        // 1. Defense stats first
        // when(system.armorClass !== undefined || system.threshold !== undefined, () => field({
        //     type: 'number',
        //     name: 'system.armorClass',
        //     value: system.armorClass || system.threshold,
        //     label: 'AC',
        //     min: 10,
        //     max: 25,
        //     placeholder: '10',
        //     hint: 'Armor Class defense value',
        //     class: 'armor-ac'
        // })),

        // when(system.threshold !== undefined, () => field({
        //     type: 'number',
        //     name: 'system.threshold',
        //     value: system.threshold,
        //     label: 'Threshold',
        //     min: 0,
        //     max: 20,
        //     placeholder: '0',
        //     hint: 'Damage threshold before penetration',
        //     class: 'armor-threshold'
        // })),

        // 2. Description (full width)
        commonFields.description(system.description, 'armor'),

        commonFields.expertise(system.expertise, 'armor'),

        // 3. Ability and modifier
        commonFields.ability(system.ability, 'armor'),

        // when(system.modifier !== undefined, () => field({
        //     type: 'number',
        //     name: 'system.modifier',
        //     value: system.modifier || 0,
        //     label: 'Modifier',
        //     min: -10,
        //     max: 20,
        //     placeholder: '0',
        //     hint: 'Armor modifier bonus/penalty',
        //     class: 'armor-modifier'
        // })),

        // // 4. Physical properties
        // commonFields.weight(system.weight, 'armor'),
        // commonFields.cost(system.cost, 'armor'),

        // 5. Traits last (full width)
        commonFields.traits(system.traits, 'armor')
    ]);
}