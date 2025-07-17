/**
 * @fileoverview Action Item Card Layout Configuration
 * @description Card layout for Action items using ICLS - matches new consistent structure
 * @version 0.1.0
 * @author Avant Development Team
 */

import { field, when, filterFields } from '../../shared/helpers';
import type { CardSection } from '../types';
import type { LayoutItemData, ActionSystemData } from '../../shared/types';

/**
 * Generate card layout for Action items with consistent structure
 * 
 * Structure: action-item container with:
 * - Left: Use button (chat-roll-btn style)
 * - Center: Action name, AP cost, PP cost, description
 * - Right: Edit, delete buttons
 */
export function getActionCardLayout(item: any): CardSection {
    const system = item.system as ActionSystemData;

    // Left section: Use button
    const leftFields = [
        field({
            type: 'action-use-button',
            name: 'useAction',
            itemId: item._id,
            itemName: item.name,
            class: 'chat-roll-btn'
        })
    ];

    // Center section: Action name, costs, description
    const centerFields = filterFields([
        // Action name
        field({
            type: 'action-name',
            name: 'actionName',
            title: item.name,
            itemId: item._id,
            class: 'action-name'
        }),

        // AP and PP cost display
        when(!!(system.apCost || system.ppCost), () => field({
            type: 'action-costs',
            name: 'actionCosts',
            apCost: system.apCost,
            ppCost: system.ppCost,
            class: 'action-costs'
        })),

        // Description display
        when(!!system.description, () => field({
            type: 'action-description',
            name: 'description',
            value: system.description,
            class: 'action-description'
        }))
    ]);

    // Right section: Edit and delete buttons
    const rightFields = [
        field({
            type: 'action-edit-button',
            name: 'editItem',
            itemId: item._id,
            itemName: item.name,
            class: 'row-edit'
        }),
        field({
            type: 'action-delete-button',
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
        containerClass: 'action-item',
        containerData: {
            'data-item-id': item._id,
            'data-item-type': 'action'
        }
    };
}