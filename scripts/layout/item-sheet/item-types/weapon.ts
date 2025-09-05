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
        )
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


            return sideBy(damageField, commonFields.expertise(system.expertise, 'weapon'),);
        }),

        commonFields.attribute(system.attribute, 'weapon'),

        commonFields.description(system.description, 'weapon'),

        commonFields.traits(system.traits, 'weapon')
    ]);
}