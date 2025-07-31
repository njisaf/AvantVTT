/**
 * @fileoverview Item Card Layout System - Tailwind Integration
 * @description Tailwind CSS class mappings for the card layout system
 * @version 1.0.0
 * @author Avant Development Team
 */

import type { Field, LayoutItemData } from '../shared/types';
import type { CardSection, CardLayoutConfig, ButtonField, IconField } from './types';
import { cardLayout as baseCardLayout } from './helpers';

/**
 * Class mapping from SCSS-based classes to Tailwind equivalents
 */
export const TAILWIND_CLASS_MAP = {
    // Card container classes
    'item-card': 'tw-item-card',
    'item-card__left': 'tw-item-card__left',
    'item-card__center': 'tw-item-card__center',
    'item-card__right': 'tw-item-card__right',
    
    // Button classes
    'card-roll-btn': 'tw-card-roll-btn',
    'card-edit-btn': 'tw-card-edit-btn',
    'card-delete-btn': 'tw-card-delete-btn',
    'card-drag-handle': 'tw-card-drag-handle',
    'btn-primary': 'tw-card-roll-btn',
    'btn-secondary': 'tw-card-edit-btn',
    'btn-danger': 'tw-card-delete-btn',
    'btn-ghost': 'tw-card-drag-handle',
    
    // Icon classes
    'card-item-icon': 'tw-card-icon',
    'card-custom-icon': 'tw-card-icon',
    
    // Content classes
    'field-group': 'tw-field-group',
    'field-label': 'tw-field-label',
    'field-value': 'tw-field-value',
    'title-line': 'tw-title-line',
    'meta-info': 'tw-meta-info',
    
    // Feature-specific classes
    'feature-meta': 'tw-feature-meta',
    'feature-category': 'tw-feature-category',
    'feature-source': 'tw-feature-source',
    
    // Display field classes
    'display-text': 'tw-display-text',
    'display-ap-cost': 'tw-display-ap-cost',
    'display-uses': 'tw-display-uses',
    'display-badge': 'tw-display-badge',
    'display-traits': 'tw-display-traits',
    
    // State classes
    'item-equipped': 'item-equipped',
    'item-disabled': 'item-disabled',
    'item-loading': 'item-loading'
} as const;

/**
 * Convert SCSS class names to Tailwind equivalents
 * 
 * @param scssClass - Original SCSS class name
 * @returns Tailwind equivalent class name
 */
export function toTailwindClass(scssClass: string): string {
    return TAILWIND_CLASS_MAP[scssClass as keyof typeof TAILWIND_CLASS_MAP] || scssClass;
}

/**
 * Convert multiple SCSS class names to Tailwind equivalents
 * 
 * @param scssClasses - Space-separated SCSS class names
 * @returns Space-separated Tailwind class names
 */
export function toTailwindClasses(scssClasses: string): string {
    return scssClasses
        .split(' ')
        .map(cls => toTailwindClass(cls.trim()))
        .filter(Boolean)
        .join(' ');
}

/**
 * Tailwind-enabled card layout helper
 * Same functionality as the base cardLayout but with Tailwind classes
 * 
 * @param centerFields - Fields for the center zone (from DSL)
 * @param config - Configuration for rollable actions and controls
 * @returns Object with left, center, right arrays of Field objects using Tailwind classes
 */
export function tailwindCardLayout(
    centerFields: Field[],
    config: CardLayoutConfig = {}
): CardSection {
    // Get the base layout
    const baseLayout = baseCardLayout(centerFields, config);
    
    // Convert all class names to Tailwind equivalents
    return {
        left: baseLayout.left.map(convertFieldClasses),
        center: baseLayout.center.map(convertFieldClasses),
        right: baseLayout.right.map(convertFieldClasses)
    };
}

/**
 * Convert field class names to Tailwind
 */
function convertFieldClasses<T extends Field>(field: T): T {
    if (!field.class || typeof field.class !== 'string') return field;
    
    return {
        ...field,
        class: toTailwindClasses(field.class)
    };
}

/**
 * Tailwind-enabled card button creator
 * 
 * @param config - Button configuration
 * @returns ButtonField with Tailwind classes
 */
export function createTailwindCardButton(config: {
    type: 'roll' | 'edit' | 'delete' | 'drag' | 'custom';
    action: string;
    label: string;
    icon?: string;
    tooltip?: string;
    className?: string;
}): ButtonField {
    const baseClassName = config.className || `card-${config.type}-btn`;
    const tailwindClassName = toTailwindClasses(baseClassName);
    
    return {
        type: 'button',
        name: `${config.type}-button`,
        buttonType: config.type as ButtonField['buttonType'],
        action: config.action,
        label: config.label,
        icon: config.icon || 'fas fa-circle',
        tooltip: config.tooltip || config.label,
        class: tailwindClassName
    };
}

/**
 * Tailwind-enabled card icon creator
 * 
 * @param config - Icon configuration
 * @returns IconField with Tailwind classes
 */
export function createTailwindCardIcon(config: {
    icon: string;
    tooltip?: string;
    color?: string;
    className?: string;
}): IconField {
    const baseClassName = config.className || 'card-custom-icon';
    const tailwindClassName = toTailwindClasses(baseClassName);
    
    return {
        type: 'icon',
        name: 'custom-icon',
        icon: config.icon,
        tooltip: config.tooltip,
        color: config.color,
        class: tailwindClassName
    };
}

/**
 * Integration example: Get card layout with Tailwind classes
 * This is a drop-in replacement for the existing getCardLayout function
 * 
 * @param item - The item to get layout for
 * @returns Promise resolving to CardSection with Tailwind classes
 */
export async function getTailwindCardLayout(item: LayoutItemData): Promise<CardSection> {
    // Import the main layout system to get fields
    const { getHeaderLayout } = await import('../item-sheet/index.js');
    
    // Get header fields for the item (these will go in center)
    const headerFields = getHeaderLayout(item);
    
    // Determine rollability based on item type
    const rollableTypes = ['talent', 'augment', 'weapon', 'action'];
    const isRollable = rollableTypes.includes(item.type);
    
    // Get roll configuration for this item type
    const rollConfig = getTailwindRollConfig(item.type, isRollable);
    
    // Generate the three-zone layout with Tailwind classes
    return tailwindCardLayout(headerFields, rollConfig);
}

/**
 * Get roll configuration with Tailwind classes for specific item types
 */
function getTailwindRollConfig(itemType: string, rollable: boolean): CardLayoutConfig {
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

/**
 * Migration utility: Convert existing card data to use Tailwind classes
 * 
 * @param cardData - Existing card data array with SCSS classes
 * @returns Card data array with Tailwind classes
 */
export function migratCardDataToTailwind<T extends { cardLayout: CardSection }>(
    cardData: T[]
): T[] {
    return cardData.map(card => ({
        ...card,
        cardLayout: {
            left: card.cardLayout.left.map(convertFieldClasses),
            center: card.cardLayout.center.map(convertFieldClasses),
            right: card.cardLayout.right.map(convertFieldClasses)
        }
    }));
}

/**
 * Example usage in ActorSheet:
 * 
 * ```typescript
 * import { getTailwindCardLayout, migratCardDataToTailwind } from './tailwind-integration';
 * 
 * // Option 1: Use Tailwind layout directly
 * const cardLayout = await getTailwindCardLayout(item);
 * 
 * // Option 2: Migrate existing SCSS-based layouts
 * const existingCards = await prepareItemCards(items);
 * const tailwindCards = migratCardDataToTailwind(existingCards);
 * ```
 */

/**
 * Template usage with Tailwind classes:
 * 
 * The existing templates will work without changes. The class names
 * are automatically converted, so:
 * 
 * ```handlebars
 * <div class="{{cardLayout.containerClass}}">
 *   <!-- This will render as class="tw-item-card" -->
 * </div>
 * ```
 */

export default {
    toTailwindClass,
    toTailwindClasses,
    tailwindCardLayout,
    createTailwindCardButton,
    createTailwindCardIcon,
    getTailwindCardLayout,
    migratCardDataToTailwind,
    TAILWIND_CLASS_MAP
};