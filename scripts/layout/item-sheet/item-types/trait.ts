/**
 * @fileoverview Trait Item Layout Definition
 * @description Declarative layout for trait item sheets
 * @version 1.0.0
 * @author Avant Development Team
 */

import { field, when, fullWidth, sideBy, filterFields, commonFields } from '../../shared/helpers';
import type { Field } from '../../shared/types';
import type { LayoutItemData, TraitSystemData } from '../../shared/types';

/**
 * Header layout for trait items
 * Image and name side-by-side, then trait preview
 */
export function header(item: LayoutItemData): Field[] {
    const system = item.system as TraitSystemData;

    return filterFields([
        // Image and name side-by-side (standard pattern)
        sideBy(
            commonFields.image(item.img, 'trait'),
            commonFields.name(item.name, 'trait')
        ),

        // Trait preview (if color and name exist)
        when(!!system.color && !!item.name, () => field({
            type: 'trait-preview',
            name: 'system.preview',
            trait: system,
            itemName: item.name,
            label: 'Preview',
            class: 'trait-preview'
        }))
    ]);
}

/**
 * Body layout for trait items
 * Order: trait preview, description, color, icon, rarity
 * NOTE: Traits don't have a traits field (they ARE traits)
 */
export function body(item: LayoutItemData): Field[] {
    const system = item.system as TraitSystemData;

    return filterFields([
        // 1. Trait preview
        when(!!system.color && !!item.name, () => field({
            type: 'trait-preview',
            name: 'system.preview',
            trait: system,
            itemName: item.name,
            label: 'Preview',
            class: 'trait-preview'
        })),

        // 2. Description (full width)
        commonFields.description(system.description, 'trait'),

        // 3. Color field
        when(system.color !== undefined, () => field({
            type: 'text',
            name: 'system.color',
            value: system.color || '#FF5733',
            label: 'Color',
            placeholder: '#FF5733',
            hint: 'Hex color code for the trait chip',
            required: true,
            class: 'trait-color'
        })),

        // 4. Icon field
        when(system.icon !== undefined, () => field({
            type: 'text',
            name: 'system.icon',
            value: system.icon || '',
            label: 'Icon',
            placeholder: 'fas fa-fire',
            hint: 'FontAwesome icon class',
            class: 'trait-icon'
        })),

        // 5. Rarity selection
        when(system.rarity !== undefined, () => field({
            type: 'select',
            name: 'system.rarity',
            value: system.rarity || 'common',
            label: 'Rarity',
            options: [
                { value: 'common', label: 'Common' },
                { value: 'uncommon', label: 'Uncommon' },
                { value: 'rare', label: 'Rare' },
                { value: 'legendary', label: 'Legendary' }
            ],
            hint: 'How rare this trait is',
            class: 'trait-rarity'
        }))

        // NOTE: Traits don't have a traits field - they ARE traits!
    ]);
}