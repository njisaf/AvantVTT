/**
 * @fileoverview Augment Item Card Layout Configuration
 * @description Card layout for Augment items using ICLS
 * @version 0.1.0
 * @author Avant Development Team
 */

import { cardLayout } from '../helpers';
import { field, when, filterFields } from '../../shared/helpers';
import type { CardSection } from '../types';
import type { LayoutItemData, AugmentSystemData } from '../../shared/types';

/**
 * Generate card layout for Augment items
 * 
 * Augments are rollable items that show:
 * - Left: Activate button + item icon
 * - Center: Name, AP/PP costs, uses counter
 * - Right: Edit, delete, drag controls
 */
export function getAugmentCardLayout(item: LayoutItemData): CardSection {
    const system = item.system as AugmentSystemData;

    // Build center fields as DISPLAY fields (not form inputs)
    const centerFields = filterFields([
        // Item name (always first)
        field({
            type: 'display-text',
            name: 'name',
            value: item.name,
            class: 'card-item-name'
        }),

        // AP cost display (visual dots, not input)
        when(!!system.apCost, () => field({
            type: 'display-ap-cost',
            name: 'apCost',
            value: system.apCost,
            label: 'AP',
            class: 'card-ap-cost'
        })),

        // PP cost display (text, not input)
        when(!!system.ppCost, () => field({
            type: 'display-text',
            name: 'ppCost',
            value: `PP: ${system.ppCost}`,
            label: 'Power Points',
            class: 'card-pp-cost'
        })),

        // Uses display (current/max, not counter input)
        when(system.uses && system.uses.max > 0, () => field({
            type: 'display-uses',
            name: 'uses',
            value: `${system.uses.value}/${system.uses.max}`,
            current: system.uses.value,
            max: system.uses.max,
            label: 'Uses',
            class: 'card-uses-display'
        })),

        // Augment type display
        when(!!system.augmentType, () => field({
            type: 'display-badge',
            name: 'augmentType',
            value: system.augmentType,
            label: 'Type',
            class: `augment-type-${system.augmentType}`
        })),

        // Requirements display (if present)
        when(!!system.requirements, () => field({
            type: 'display-text',
            name: 'requirements',
            value: system.requirements,
            label: 'Requirements',
            class: 'card-requirements'
        })),

        // Description display (if present)
        when(!!system.description, () => field({
            type: 'display-text',
            name: 'description',
            value: system.description,
            label: 'Description',
            class: 'card-description'
        })),

        // Traits display (chips, not input)
        when(system.traits && system.traits.length > 0, () => field({
            type: 'display-traits',
            name: 'traits',
            value: system.traits,
            class: 'card-traits'
        }))
    ]);

    // Generate three-zone layout with augment-specific configuration
    return cardLayout(centerFields, {
        rollable: true,
        rollLabel: 'Activate',
        rollAction: 'augment-activate',
        showEdit: true,
        showDelete: true,
        showDrag: true
    });
}