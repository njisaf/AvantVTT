/**
 * @fileoverview Gear Item Card Layout Configuration
 * @description Card layout for Gear items using ICLS - matches new consistent structure
 * @version 0.1.0
 * @author Avant Development Team
 */

import { field, when, filterFields } from '../../shared/helpers';
import type { CardSection } from '../types';
import type { LayoutItemData, GearSystemData } from '../../shared/types';

/**
 * Generate card layout for Gear items with consistent structure
 * 
 * Structure: gear-item container with:
 * - Left: Dice roll button (combat-action-btn style)
 * - Center: Item image + name, weight, category, uses
 * - Right: Edit, delete buttons
 */
export function getGearCardLayout(item: any): CardSection {
    const system = item.system as GearSystemData;

    // Left section: Dice roll button (placeholder)
    const leftFields = [
        field({
            type: 'gear-roll-button',
            name: 'rollGear',
            itemId: item._id,
            itemName: item.name,
            class: 'chat-roll-btn'
        })
    ];

    // Center section: Image + name, weight, category, uses
    const centerFields = filterFields([
        // Image and name together
        field({
            type: 'gear-image-name',
            name: 'imageAndName',
            img: item.img,
            title: item.name,
            itemId: item._id,
            class: 'gear-header'
        }),

        // Weight display
        when(!!system.weight, () => field({
            type: 'gear-weight',
            name: 'weight',
            value: system.weight,
            class: 'gear-weight'
        })),

        // Category and rarity
        when(!!(system.category || system.rarity), () => field({
            type: 'gear-category',
            name: 'category',
            category: system.category,
            rarity: system.rarity,
            class: 'gear-category'
        })),

        // Uses (if consumable)
        when(!!(system.uses && system.uses.max > 0), () => field({
            type: 'gear-uses',
            name: 'uses',
            current: system.uses.value,
            max: system.uses.max,
            class: 'gear-uses'
        })),

        // Quantity
        when(system.quantity > 1, () => field({
            type: 'gear-quantity',
            name: 'quantity',
            value: system.quantity,
            class: 'gear-quantity'
        }))
    ]);

    // Right section: Edit and delete buttons
    const rightFields = [
        field({
            type: 'gear-edit-button',
            name: 'editItem',
            itemId: item._id,
            itemName: item.name,
            class: 'row-edit'
        }),
        field({
            type: 'gear-delete-button',
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
        containerClass: 'gear-item',
        containerData: {
            'data-item-id': item._id,
            'data-item-type': 'gear'
        }
    };
}