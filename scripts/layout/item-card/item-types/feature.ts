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

    // Center section: Feature name, meta, description
    const centerFields = filterFields([
        // Feature name
        field({
            type: 'feature-name',
            name: 'featureName',
            title: item.name,
            itemId: item._id,
            class: 'feature-name'
        }),

        // PP cost and active status
        when(!!(system.powerPointCost || system.isActive !== undefined), () => field({
            type: 'feature-meta',
            name: 'meta',
            ppCost: system.powerPointCost,
            isActive: system.isActive,
            class: 'feature-meta'
        })),

        // Category select (display only, sheet changes value)
        when(!!system.category, () => field({
            type: 'feature-category',
            name: 'category',
            value: system.category,
            class: 'feature-category'
        })),

        // Source display (source + category were merged; keep source only)
        when(!!system.source, () => field({
            type: 'feature-source',
            name: 'source',
            value: system.source,
            class: 'feature-source'
        })),

        // Description display
        when(!!system.description, () => field({
            type: 'feature-description',
            name: 'description',
            value: system.description,
            class: 'feature-description'
        })),
        
        // Traits display
        when(item.displayTraits && item.displayTraits.length > 0, () => field({
            type: 'feature-traits',
            name: 'traits',
            displayTraits: item.displayTraits,
            hasOverflow: item.displayTraits.length > 4,
            class: 'trait-chips'
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