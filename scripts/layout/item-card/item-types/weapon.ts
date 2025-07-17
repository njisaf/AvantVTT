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

    // Left section: Dice roll button (placeholder)
    const leftFields = [
        field({
            type: 'weapon-roll-button',
            name: 'rollWeapon',
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
            class: 'weapon-header'
        }),

        // Damage and type display
        when(!!(system.damageDie || system.damageType), () => field({
            type: 'weapon-damage',
            name: 'damage',
            damageDie: system.damageDie,
            damageType: system.damageType,
            class: 'weapon-damage-info'
        })),

        // Properties and other details
        when(!!system.properties, () => field({
            type: 'weapon-properties',
            name: 'properties',
            value: system.properties,
            class: 'weapon-properties'
        })),

        // Weight and range (if present)
        when(!!(system.weight || system.range), () => field({
            type: 'weapon-details',
            name: 'details',
            weight: system.weight,
            range: system.range,
            class: 'weapon-details'
        }))
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
        containerClass: 'weapon-item',
        containerData: {
            'data-item-id': item._id,
            'data-item-type': 'weapon'
        }
    };
}