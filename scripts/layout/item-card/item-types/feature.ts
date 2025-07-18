/**
 * @fileoverview Feature Item Card Layout Configuration
 * @description Card layout for Feature items using ICLS - matches new consistent structure
 * @version 0.1.0
 * @author Avant Development Team
 */

import { field, when, filterFields } from '../../shared/helpers';
import type { CardSection } from '../types';
import type { LayoutItemData, FeatureSystemData } from '../../shared/types';

/**
 * Generate card layout for Feature items with consistent structure
 * 
 * Structure: feature-item container with:
 * - Left: Post-to-chat button (chat-roll-btn style with comments icon)
 * - Center: Feature name, source, category, description
 * - Right: Edit, delete buttons
 */
export function getFeatureCardLayout(item: any): CardSection {
    const system = item.system as FeatureSystemData;

    // Left section: Post-to-chat button (same as talent/augment)
    const leftFields = [
        field({
            type: 'feature-chat-button',
            name: 'useFeature',
            itemId: item._id,
            itemName: item.name,
            class: 'chat-roll-btn'
        })
    ];

    // Center section: Feature name, source, category, description
    const centerFields = filterFields([
        // Feature name
        field({
            type: 'feature-name',
            name: 'featureName',
            title: item.name,
            itemId: item._id,
            class: 'feature-name'
        }),

        // Source and category display
        when(!!(system.source || system.category), () => field({
            type: 'feature-source-category',
            name: 'sourceCategory',
            source: system.source,
            category: system.category,
            class: 'feature-source-category'
        })),

        // Description display
        when(!!system.description, () => field({
            type: 'feature-description',
            name: 'description',
            value: system.description,
            class: 'feature-description'
        }))
    ]);

    // Right section: Edit and delete buttons
    const rightFields = [
        field({
            type: 'feature-edit-button',
            name: 'editItem',
            itemId: item._id,
            itemName: item.name,
            class: 'row-edit'
        }),
        field({
            type: 'feature-delete-button',
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
        containerClass: 'feature-item',
        containerData: {
            'data-item-id': item._id,
            'data-item-type': 'feature'
        }
    };
}