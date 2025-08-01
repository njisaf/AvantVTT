/**
 * @fileoverview Weapon Item Layout Definition
 * @description Declarative layout for weapon item sheets
 * @version 1.0.0
 * @author Avant Development Team
 */

import { field, when, fullWidth, sideBy, filterFields, commonFields } from '../../shared/helpers';
import type { Field } from '../../shared/types';
import type { LayoutItemData, WeaponSystemData } from '../../shared/types';

/**
 * Header layout for weapon items
 * Image and name side-by-side, then damage and modifier
 */
export function header(item: LayoutItemData): Field[] {
    const system = item.system as WeaponSystemData;

    return filterFields([
        // Image and name side-by-side (standard pattern)
        sideBy(
            commonFields.image(item.img, 'weapon'),
            commonFields.name(item.name, 'weapon')
        ),

        // // Damage and modifier side-by-side
        // when((system.damage !== undefined || system.damageDie !== undefined) && system.modifier !== undefined, () => {
        //     const damageField = field({
        //         type: 'text',
        //         name: 'system.damage',
        //         value: system.damage || system.damageDie,
        //         label: 'Damage',
        //         placeholder: '1d8',
        //         hint: 'Weapon damage dice (e.g., 1d8, 2d6)',
        //         class: 'weapon-damage'
        //     });
        //     const modifierField = field({
        //         type: 'number',
        //         name: 'system.modifier',
        //         value: system.modifier,
        //         label: 'Modifier',
        //         min: -10,
        //         max: 20,
        //         placeholder: '0',
        //         hint: 'Attack modifier bonus/penalty',
        //         class: 'weapon-modifier'
        //     });
        //     return sideBy(damageField, modifierField);
        // }),

        // // Fallback individual fields
        // when((system.damage !== undefined || system.damageDie !== undefined) && system.modifier === undefined, () => field({
        //     type: 'text',
        //     name: 'system.damage',
        //     value: system.damage || system.damageDie,
        //     label: 'Damage',
        //     placeholder: '1d8',
        //     hint: 'Weapon damage dice (e.g., 1d8, 2d6)',
        //     class: 'weapon-damage'
        // })),

        // when(system.modifier !== undefined && (system.damage === undefined && system.damageDie === undefined), () => field({
        //     type: 'number',
        //     name: 'system.modifier',
        //     value: system.modifier,
        //     label: 'Modifier',
        //     min: -10,
        //     max: 20,
        //     placeholder: '0',
        //     hint: 'Attack modifier bonus/penalty',
        //     class: 'weapon-modifier'
        // }))
    ]);
}

/**
 * Body layout for weapon items
 * Order: damage/modifier side-by-side, description, ability/weight side-by-side, cost, traits
 */
export function body(item: LayoutItemData): Field[] {
    const system = item.system as WeaponSystemData;

    return filterFields([
        // 1. Combat stats side-by-side
        when(system.damageDie !== undefined && system.modifier !== undefined, () => {
            const damageField = field({
                type: 'text',
                name: 'system.damageDie',
                value: system.damageDie,
                label: 'Damage',
                placeholder: '1d8',
                hint: 'Weapon damage dice (e.g., 1d8, 2d6)',
                class: 'weapon-damage'
            });
            const modifierField = field({
                type: 'number',
                name: 'system.modifier',
                value: system.modifier,
                label: 'Modifier',
                min: -10,
                max: 20,
                placeholder: '0',
                hint: 'Attack modifier bonus/penalty',
                class: 'weapon-modifier'
            });

            return sideBy(damageField, modifierField);
        }),

        commonFields.expertise(system.expertise, 'weapon'),

        commonFields.ability(system.ability, 'weapon'),

        // // Fallback: individual fields if one is missing
        // when(system.damageDie !== undefined && system.modifier === undefined, () => field({
        //     type: 'text',
        //     name: 'system.damageDie',
        //     value: system.damageDie,
        //     label: 'Damage',
        //     placeholder: '1d8',
        //     hint: 'Weapon damage dice (e.g., 1d8, 2d6)',
        //     class: 'weapon-damage'
        // })),

        // when(system.modifier !== undefined && system.damageDie === undefined, () => field({
        //     type: 'number',
        //     name: 'system.modifier',
        //     value: system.modifier,
        //     label: 'Modifier',
        //     min: -10,
        //     max: 20,
        //     placeholder: '0',
        //     hint: 'Attack modifier bonus/penalty',
        //     class: 'weapon-modifier'
        // })),

        // 2. Description (full width)
        commonFields.description(system.description, 'weapon'),

        // // 3. Ability and weight side-by-side
        // sideBy(
        //     commonFields.ability(system.ability, 'weapon'),
        //     commonFields.weight(system.weight, 'weapon')
        // ),

        // // 4. Cost (individual field)
        // commonFields.cost(system.cost, 'weapon'),

        // 5. Traits last (full width)
        commonFields.traits(system.traits, 'weapon')
    ]);
}