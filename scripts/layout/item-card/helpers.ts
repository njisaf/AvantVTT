/**
 * @fileoverview Item Card Layout System - Helper Functions
 * @description Core helpers for generating three-zone item cards in Actor Sheets
 * @version 0.1.0
 * @author Avant Development Team
 */

import type { Field, LayoutItemData } from '../shared/types';
import type { CardSection, CardLayoutConfig, ButtonField, IconField } from './types';

/**
 * Core card layout helper that distributes fields into three zones
 * 
 * @param centerFields - Fields for the center zone (from DSL)
 * @param config - Configuration for rollable actions and controls
 * @returns Object with left, center, right arrays of Field objects
 * 
 * @example
 * ```typescript
 * const layout = cardLayout([
 *     field({ type: 'text', name: 'system.damage', value: '1d8', label: 'Damage' })
 * ], { rollable: true, rollLabel: 'Attack', rollAction: 'weapon-attack' });
 * ```
 */
export function cardLayout(
    centerFields: Field[],
    config: CardLayoutConfig = {}
): CardSection {
    const {
        rollable = false,
        rollLabel = 'Use',
        rollAction = 'item-roll',
        showEdit = true,
        showDelete = true,
        showDrag = true
    } = config;

    // Left zone: roll buttons and item icon
    const left: Field[] = [];

    if (rollable) {
        left.push(createRollButton(rollLabel, rollAction));
    }

    // Add item icon to left zone
    left.push(createItemIcon());

    // Center zone: main content from DSL (passed through)
    const center: Field[] = centerFields;

    // Right zone: control buttons
    const right: Field[] = [];

    if (showEdit) {
        right.push(createEditButton());
    }

    if (showDelete) {
        right.push(createDeleteButton());
    }

    if (showDrag) {
        right.push(createDragHandle());
    }

    return { left, center, right };
}

/**
 * Registry resolver that gets card layout for a specific item type
 * 
 * @param item - The item to get layout for
 * @returns Promise resolving to CardSection with distributed fields
 * 
 * @example
 * ```typescript
 * const layout = await getCardLayout(augmentItem);
 * // Returns: { left: [rollBtn, icon], center: [name, apCost], right: [edit, delete, drag] }
 * ```
 */
export async function getCardLayout(item: LayoutItemData): Promise<CardSection> {
    // Import the main layout system to get fields
    const { getHeaderLayout } = await import('../item-sheet/index.js');

    // Get header fields for the item (these will go in center)
    const headerFields = getHeaderLayout(item);

    // Determine rollability based on item type
    const rollableTypes = ['talent', 'augment', 'weapon', 'action'];
    const isRollable = rollableTypes.includes(item.type);

    // Get roll configuration for this item type
    const rollConfig = getRollConfig(item.type, isRollable);

    // Generate the three-zone layout
    return cardLayout(headerFields, rollConfig);
}

/**
 * Get roll configuration for specific item types
 */
function getRollConfig(itemType: string, rollable: boolean): CardLayoutConfig {
    const configs: Record<string, CardLayoutConfig> = {
        'talent': {
            rollable: true,
            rollLabel: 'Use Talent',
            rollAction: 'talent-roll'
        },
        'augment': {
            rollable: true,
            rollLabel: 'Activate',
            rollAction: 'augment-activate'
        },
        'weapon': {
            rollable: true,
            rollLabel: 'Attack',
            rollAction: 'weapon-attack'
        },
        'action': {
            rollable: true,
            rollLabel: 'Roll',
            rollAction: 'action-roll'
        }
    };

    return configs[itemType] || { rollable: false };
}

// Button creation helpers

/**
 * Creates a roll/use button for the left zone
 */
function createRollButton(label: string, action: string): ButtonField {
    return {
        type: 'button',
        name: 'roll-button',
        buttonType: 'roll',
        action,
        label,
        icon: 'fas fa-dice-d20',
        tooltip: `${label} this item`,
        class: 'card-roll-btn btn-primary'
    };
}

/**
 * Creates an item icon for the left zone
 */
function createItemIcon(): IconField {
    return {
        type: 'icon',
        name: 'item-icon',
        icon: 'item-img', // Special placeholder for item image
        tooltip: 'Item image',
        class: 'card-item-icon'
    };
}

/**
 * Creates an edit button for the right zone
 */
function createEditButton(): ButtonField {
    return {
        type: 'button',
        name: 'edit-button',
        buttonType: 'edit',
        action: 'edit-item',
        label: 'Edit',
        icon: 'fas fa-edit',
        tooltip: 'Edit this item',
        class: 'card-edit-btn btn-secondary'
    };
}

/**
 * Creates a delete button for the right zone
 */
function createDeleteButton(): ButtonField {
    return {
        type: 'button',
        name: 'delete-button',
        buttonType: 'delete',
        action: 'delete-item',
        label: 'Delete',
        icon: 'fas fa-trash',
        tooltip: 'Delete this item',
        class: 'card-delete-btn btn-danger'
    };
}

/**
 * Creates a drag handle for the right zone
 */
function createDragHandle(): ButtonField {
    return {
        type: 'button',
        name: 'drag-handle',
        buttonType: 'drag',
        action: 'drag-item',
        label: 'Drag',
        icon: 'fas fa-grip-vertical',
        tooltip: 'Drag to reorder',
        class: 'card-drag-handle btn-ghost'
    };
}

/**
 * Utility to create custom card buttons
 * 
 * @param config - Button configuration
 * @returns ButtonField for use in card zones
 */
export function createCardButton(config: {
    type: 'roll' | 'edit' | 'delete' | 'drag' | 'custom';
    action: string;
    label: string;
    icon?: string;
    tooltip?: string;
    className?: string;
}): ButtonField {
    return {
        type: 'button',
        name: `${config.type}-button`,
        buttonType: config.type as ButtonField['buttonType'],
        action: config.action,
        label: config.label,
        icon: config.icon || 'fas fa-circle',
        tooltip: config.tooltip || config.label,
        class: config.className || `card-${config.type}-btn`
    };
}

/**
 * Utility to create custom card icons
 * 
 * @param config - Icon configuration
 * @returns IconField for use in card zones
 */
export function createCardIcon(config: {
    icon: string;
    tooltip?: string;
    color?: string;
    className?: string;
}): IconField {
    return {
        type: 'icon',
        name: 'custom-icon',
        icon: config.icon,
        tooltip: config.tooltip,
        color: config.color,
        class: config.className || 'card-custom-icon'
    };
}