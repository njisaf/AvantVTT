/**
 * @fileoverview Augment Item Card Layout Configuration
 * @description Card layout for Augment items using ICLS
 * @version 0.1.0
 * @author Avant Development Team
 */

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
export function getAugmentCardLayout(item: any): CardSection {
    const system = item.system as AugmentSystemData;

    // Left section: Chat/roll button and PP spend button
    const leftFields = filterFields([
        field({
            type: 'augment-chat-button',
            name: 'useAugment',
            itemId: item._id,
            itemName: item.name,
            class: 'chat-roll-btn'
        }),
        // PP spend button (if has PP cost)
        when(!!system.ppCost, () => field({
            type: 'augment-pp-button',
            name: 'spendPP',
            itemId: item._id,
            itemName: item.name,
            ppCost: system.ppCost,
            class: 'pp-spend-btn'
        }))
    ]);

    // Center section: Title+level, AP+PP costs, requirements, description, traits
    const centerFields = filterFields([
        // Title with level requirement inline
        field({
            type: 'augment-title-line',
            name: 'titleLine',
            title: item.name,
            levelRequirement: system.levelRequirement,
            itemId: item._id,
            class: 'row-title-line'
        }),

        // AP cost display with visual dots + PP cost inline
        when(system.apCost > 0, () => field({
            type: 'augment-ap-cost',
            name: 'apCost',
            value: system.apCost,
            ppCost: system.ppCost,
            class: 'row-ap-cost'
        })),

        // Requirements display
        when(!!system.requirements, () => field({
            type: 'augment-requirements',
            name: 'requirements',
            value: system.requirements,
            class: 'row-requirements'
        })),

        // Description display
        when(!!system.description, () => field({
            type: 'augment-description',
            name: 'description',
            value: system.description,
            class: 'row-description'
        })),

        // Traits display with proper styling and overflow handling
        when(item.displayTraits && item.displayTraits.length > 0, () => field({
            type: 'augment-traits',
            name: 'traits',
            displayTraits: item.displayTraits,
            hasOverflow: item.displayTraits.length > 4,
            class: 'trait-chips'
        }))
    ]);

    // Right section: Edit and delete buttons
    const rightFields = [
        field({
            type: 'augment-edit-button',
            name: 'editItem',
            itemId: item._id,
            itemName: item.name,
            class: 'row-edit'
        }),
        field({
            type: 'augment-delete-button',
            name: 'deleteItem',
            itemId: item._id,
            itemName: item.name,
            class: 'row-delete'
        })
    ];

    return {
        left: leftFields,
        center: centerFields,
        right: rightFields,
        containerClass: 'augment-item',
        containerData: {
            'data-item-id': item._id,
            'data-item-type': 'augment'
        }
    };
}