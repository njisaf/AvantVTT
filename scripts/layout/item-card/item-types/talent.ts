/**
 * @fileoverview Talent Item Card Layout Configuration
 * @description Card layout for Talent items using ICLS - matches original row structure
 * @version 0.2.0
 * @author Avant Development Team
 */

import { cardLayout } from '../helpers';
import { field, when, filterFields } from '../../shared/helpers';
import type { CardSection } from '../types';
import type { LayoutItemData, TalentSystemData } from '../../shared/types';

/**
 * Generate card layout for Talent items matching original row-talent-augment.hbs structure
 * 
 * Structure: talent-item container with:
 * - Left: Chat/roll button (no PP spend button like augments)
 * - Center: Title+level, AP cost, requirements, description, traits
 * - Right: Edit, delete buttons
 */
export function getTalentCardLayout(item: any): CardSection {
    const system = item.system as TalentSystemData;

    // Left section: Chat/roll button only (no PP spend button)
    const leftFields = [
        field({
            type: 'talent-chat-button',
            name: 'useTalent',
            itemId: item._id,
            itemName: item.name,
            class: 'chat-roll-btn'
        })
    ];

    // Center section: Title+level, AP, requirements, description, traits
    const centerFields = filterFields([
        // Title with level requirement inline
        field({
            type: 'talent-title-line',
            name: 'titleLine',
            title: item.name,
            levelRequirement: system.levelRequirement,
            itemId: item._id,
            class: 'row-title-line'
        }),

        // AP cost display with visual dots (no PP cost)
        when(system.apCost > 0, () => field({
            type: 'talent-ap-cost',
            name: 'apCost',
            value: system.apCost,
            class: 'row-ap-cost'
        })),

        // Requirements display
        when(!!system.requirements, () => field({
            type: 'talent-requirements',
            name: 'requirements',
            value: system.requirements,
            class: 'row-requirements'
        })),

        // Description display
        when(!!system.description, () => field({
            type: 'talent-description',
            name: 'description',
            value: system.description,
            class: 'row-description'
        })),

        // Traits display with proper styling and overflow handling
        when(item.displayTraits && item.displayTraits.length > 0, () => field({
            type: 'talent-traits',
            name: 'traits',
            displayTraits: item.displayTraits,
            hasOverflow: item.displayTraits.length > 4,
            class: 'trait-chips'
        }))
    ]);

    // Right section: Edit and delete buttons
    const rightFields = [
        field({
            type: 'talent-edit-button',
            name: 'editItem',
            itemId: item._id,
            itemName: item.name,
            class: 'row-edit'
        }),
        field({
            type: 'talent-delete-button',
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
        containerClass: 'talent-item',
        containerData: {
            'data-item-id': item._id,
            'data-item-type': 'talent'
        }
    };
}