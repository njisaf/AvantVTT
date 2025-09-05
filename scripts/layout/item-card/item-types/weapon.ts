/**
 * @fileoverview Weapon Item Card Layout Configuration
 * @description Card layout for Weapon items using ICLS - matches new consistent structure
 * @version 0.1.0
 * @author Avant Development Team
 */

import { field, when, filterFields } from '../../shared/helpers';
import type { CardSection } from '../types';
import type { LayoutItemData, WeaponSystemData } from '../../shared/types';

/**
 * Generate card layout for Weapon items with consistent structure
 * 
 * Structure: weapon-item container with:
 * - Left: Dice roll button (combat-action-btn style)
 * - Center: Item image + name, damage/type info, properties
 * - Right: Edit, delete buttons
 */
export function getWeaponCardLayout(item: any): CardSection {
    const system = item.system as WeaponSystemData;

    // Left section: Use button (same as talent/augment)
    const leftFields = [
        field({
            type: 'weapon-chat-button',
            name: 'useWeapon',
            itemId: item._id,
            itemName: item.name,
            class: 'chat-roll-btn'
        })
    ];

    // Center section: Image + name, damage/type info, properties
    const centerFields = filterFields([
        // Image and name together
        field({
            type: 'weapon-image-name',
            name: 'imageAndName',
            img: item.img,
            title: item.name,
            itemId: item._id,
            class: 'item-header weapon-header'
        }),

        // Core stats tiles (Attribute, EP, Damage) — stat-tile pattern to match Actions tab
        when(!!(system.attribute || (system.expertise !== undefined) || system.damageDie), () => field({
            type: 'display-stat-tiles',
            name: 'stats',
            tiles: filterFields([
                when(!!system.attribute, () => ({ type: 'stat-tile', name: 'attribute', value: system.attribute, label: 'Attribute', variant: 'attribute' } as any)),
                when(system.expertise !== undefined, () => ({ type: 'stat-tile', name: 'expertise', value: system.expertise, label: 'EP', variant: 'expertise' } as any)),
                when(!!system.damageDie, () => ({ type: 'stat-tile', name: 'damage', value: system.damageDie, label: 'Damage', variant: 'damage' } as any))
            ]),
            class: 'weapon-stat-tiles'
        })),

        // Attribute moved into stat-tile group above

        // EP moved into stat-tile group above

        field({
            type: 'weapon-description',
            name: 'description',
            value: system.description,
            class: 'weapon-description'
        }),
        
        // Traits display
        when(item.displayTraits && item.displayTraits.length > 0, () => field({
            type: 'weapon-traits',
            name: 'traits',
            displayTraits: item.displayTraits,
            hasOverflow: item.displayTraits.length > 4,
            class: 'trait-chips'
        }))
        
        // Weight and range (if present)
        // when(!!(system.weight || system.range), () => field({
        //     type: 'weapon-details',
        //     name: 'details',
        //     weight: system.weight,
        //     range: system.range,
        //     class: 'weapon-details'
        // }))
    ]);

    // Right section: Edit and delete buttons
    const rightFields = [
        field({
            type: 'weapon-edit-button',
            name: 'editItem',
            itemId: item._id,
            itemName: item.name,
            class: 'row-edit'
        }),
        field({
            type: 'weapon-delete-button',
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
        // Keep containerClass minimal — partial adds the shared avant-item-card wrapper.
        // Use a type-specific class and accent modifier for styling hooks.
        containerClass: 'weapon-item --accent-weapon',
        containerData: {
            'data-item-id': item._id,
            'data-item-type': 'weapon'
        }
    };
}