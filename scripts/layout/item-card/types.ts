/**
 * @fileoverview Item Card Layout System - Type Definitions
 * @description Types for the card-specific layout system
 * @version 0.1.0
 * @author Avant Development Team
 */

import type { Field } from '../shared/types';

/**
 * Card zone areas for the three-column grid layout
 */
export type CardZone = 'left' | 'center' | 'right';

/**
 * Card layout section containing fields for each zone
 */
export interface CardSection {
    /** Left zone: roll buttons and icons */
    left: Field[];
    /** Center zone: main content from DSL */
    center: Field[];
    /** Right zone: edit/delete/drag controls */
    right: Field[];
    /** CSS class for the container element */
    containerClass?: string;
    /** Data attributes for the container element */
    containerData?: Record<string, string>;
}

/**
 * Configuration for card layout generation
 */
export interface CardLayoutConfig {
    /** Whether this item type has rollable actions */
    rollable?: boolean;
    /** Custom roll button text (defaults to item type) */
    rollLabel?: string;
    /** Custom roll button data-action attribute */
    rollAction?: string;
    /** Whether to show edit button (defaults to true) */
    showEdit?: boolean;
    /** Whether to show delete button (defaults to true) */
    showDelete?: boolean;
    /** Whether to show drag handle (defaults to true) */
    showDrag?: boolean;
}

/**
 * Button field for card controls
 */
export interface ButtonField extends Field {
    type: 'button';
    name: string;
    buttonType: 'roll' | 'edit' | 'delete' | 'drag';
    action: string;
    icon?: string;
    tooltip?: string;
}

/**
 * Icon field for card decorations
 */
export interface IconField extends Field {
    type: 'icon';
    name: string;
    icon: string;
    tooltip?: string;
    color?: string;
}

/**
 * Card-specific field types
 */
export type CardField = Field | ButtonField | IconField;