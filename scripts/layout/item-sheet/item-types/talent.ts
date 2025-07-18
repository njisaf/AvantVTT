/**
 * @fileoverview Talent Item Layout Definition
 * @description Declarative layout for talent item sheets
 * @version 1.0.0
 * @author Avant Development Team
 */

import { sideBy, filterFields, commonFields } from '../../shared/helpers';
import type { Field } from '../../shared/types';
import type { LayoutItemData, TalentSystemData } from '../../shared/types';

/**
 * Header layout for talent items
 * Image and name side-by-side, then AP cost
 */
export function header(item: LayoutItemData): Field[] {
    const system = item.system as TalentSystemData;

    return filterFields([
        // Image and name side-by-side (standard pattern)
        sideBy(
            commonFields.image(item.img, 'talent'),
            commonFields.name(item.name, 'talent')
        )
    ]);
}

/**
 * Body layout for talent items
 * Order: AP cost, description, level requirement, requirements, traits
 */
export function body(item: LayoutItemData): Field[] {
    const system = item.system as TalentSystemData;

    return filterFields([
        sideBy(
            commonFields.apCost(system.apCost, 'talent'),
            commonFields.levelRequirement(system.levelRequirement, 'talent'),
        ),
        commonFields.requirements(system.requirements, 'talent'),
        commonFields.description(system.description, 'talent'),
        commonFields.traits(system.traits, 'talent')
    ]);
}