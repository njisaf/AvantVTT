/**
 * @fileoverview Armor Item Card Layout Configuration
 * @description Card layout for Armor items using ICLS - matches new consistent structure
 * @version 0.1.0
 * @author Avant Development Team
 */

import { field, when, filterFields } from '../../shared/helpers';
import type { CardSection } from '../types';
import type { LayoutItemData, ArmorSystemData } from '../../shared/types';

/**
 * Generate card layout for Armor items with consistent structure
 * 
 * Structure: armor-item container with:
 * - Left: Dice roll button (combat-action-btn style)
 * - Center: Item image + name, AC/threshold info, properties
 * - Right: Edit, delete buttons
 */
export function getArmorCardLayout(item: any): CardSection {
    const system = item.system as ArmorSystemData;

    // Left section: Use button (same as talent/augment)
    const leftFields = [
        field({
            type: 'armor-chat-button',
            name: 'useArmor',
            itemId: item._id,
            itemName: item.name,
            class: 'chat-roll-btn'
        })
    ];

    // Center section: Image + name, AC/threshold info, properties
    const centerFields = filterFields([
        // Image and name together
        field({
            type: 'armor-image-name',
            name: 'imageAndName',
            img: item.img,
            title: item.name,
            itemId: item._id,
            class: 'item-header armor-header'
        }),

        // AC and threshold display
        when(!!(system.armorClass || system.threshold), () => field({
            type: 'armor-protection',
            name: 'protection',
            armorClass: system.armorClass,
            threshold: system.threshold,
            class: 'armor-protection-info'
        })),

        // // Armor type and properties
        // when(!!(system.armorType || system.properties), () => field({
        //     type: 'armor-properties',
        //     name: 'properties',
        //     armorType: system.armorType,
        //     properties: system.properties,
        //     class: 'armor-properties'
        // })),
        field({
            type: 'armor-description',
            name: 'description',
            value: system.description,
            class: 'armor-description'
        }),
        
        // Traits display
        when(item.displayTraits && item.displayTraits.length > 0, () => field({
            type: 'armor-traits',
            name: 'traits',
            displayTraits: item.displayTraits,
            hasOverflow: item.displayTraits.length > 4,
            class: 'trait-chips'
        })),

        // // Weight and other details
        // when(!!system.weight, () => field({
        //     type: 'armor-details',
        //     name: 'details',
        //     weight: system.weight,
        //     class: 'armor-details'
        // }))
    ]);

    // Right section: Edit and delete buttons
    const rightFields = [
        field({
            type: 'armor-edit-button',
            name: 'editItem',
            itemId: item._id,
            itemName: item.name,
            class: 'row-edit'
        }),
        field({
            type: 'armor-delete-button',
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
        containerClass: 'armor-item',
        containerData: {
            'data-item-id': item._id,
            'data-item-type': 'armor'
        }
    };
}