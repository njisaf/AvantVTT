/**
 * @fileoverview Gear Item Layout Definition
 * @description Declarative layout for gear item sheets
 * @version 1.0.0
 * @author Avant Development Team
 */

import { field, when, fullWidth, sideBy, filterFields, commonFields } from '../../shared/helpers';
import type { Field } from '../../shared/types';
import type { LayoutItemData, GearSystemData } from '../../shared/types';

/**
 * Header layout for gear items
 * Image and name side-by-side, then weight and cost
 */
export function header(item: LayoutItemData): Field[] {
    const system = item.system as GearSystemData;

    return filterFields([
        // Image and name side-by-side (standard pattern)
        sideBy(
            commonFields.image(item.img, 'gear'),
            commonFields.name(item.name, 'gear')
        ),

        // Weight and cost side-by-side
        sideBy(
            commonFields.weight(system.weight, 'gear'),
            commonFields.cost(system.cost, 'gear')
        )
    ]);
}

/**
 * Body layout for gear items
 * Simple layout: meta fields, description, then traits
 */
export function body(item: LayoutItemData): Field[] {
    const system = item.system as GearSystemData;

    return filterFields([
        // 1. Meta fields first (if not already in header)
        commonFields.weight(system.weight, 'gear'),
        commonFields.cost(system.cost, 'gear'),

        // 2. Description (full width)
        commonFields.description(system.description, 'gear'),

        // 3. Traits last (full width)
        commonFields.traits(system.traits, 'gear')
    ]);
}