/**
 * @fileoverview Item Sheet Tailwind Integration
 * @description Tailwind class mapping and integration for item sheet components
 * @version 1.0.0
 * @author Avant Development Team
 */

import type { Field } from '../shared/types';

/**
 * Mapping of SCSS classes to Tailwind component classes for item sheets
 */
export const ITEM_SHEET_TAILWIND_CLASS_MAP: Record<string, string> = {
    // Base container classes
    'item-sheet': 'tw-item-sheet',
    'sheet-header': 'tw-sheet-header',
    'sheet-tabs': 'tw-sheet-tabs',
    'sheet-body': 'tw-sheet-body',
    'tab': 'tw-tab',
    
    // Header layout classes
    'row-container': 'tw-row-container',
    'header-main': 'tw-header-main',
    'item-icon': 'tw-item-icon',
    'item-name-field': 'tw-item-name-field',
    
    // Form element classes
    'form-group': 'tw-form-group',
    'form-label': 'tw-form-label',
    'form-input': 'tw-form-input',
    'form-textarea': 'tw-form-textarea',
    'form-select': 'tw-form-select',
    'form-checkbox': 'tw-form-checkbox',
    
    // Tab navigation classes
    'sheet-tabs .item': 'tw-tab-item',
    'item-sheet__tab': 'tw-tab-item',
    'active': 'tw-tab-active',
    
    // Image upload classes
    'image-upload': 'tw-image-upload',
    'image-upload__img': 'tw-image-upload-img',
    'image-upload__overlay': 'tw-image-upload-overlay',
    
    // Trait system classes
    'trait-chip-input': 'tw-trait-chip-input',
    'trait-chips': 'tw-trait-chips',
    'trait-chip': 'tw-trait-chip',
    'trait-autocomplete': 'tw-trait-autocomplete',
    'trait-suggestions': 'tw-trait-suggestions',
    
    // AP selector classes
    'ap-selector': 'tw-ap-selector',
    'ap-icons': 'tw-ap-icons',
    'ap-icon': 'tw-ap-icon',
    
    // State classes
    'hidden': 'tw-hidden',
    'visible': 'tw-visible',
    'disabled': 'tw-disabled',
    'loading': 'tw-loading'
};

/**
 * Convert SCSS class name to Tailwind equivalent
 */
export function toItemSheetTailwindClass(scssClass: string): string {
    return ITEM_SHEET_TAILWIND_CLASS_MAP[scssClass] || scssClass;
}

/**
 * Apply Tailwind classes to item sheet field
 */
export function applyItemSheetTailwindClasses(field: Field): Field {
    const updatedField = { ...field };
    
    // Apply class mappings
    if (updatedField.class && typeof updatedField.class === 'string') {
        const classes = updatedField.class.split(' ');
        const tailwindClasses = classes.map((cls: string) => toItemSheetTailwindClass(cls));
        updatedField.class = tailwindClasses.join(' ');
    }
    
    // Apply wrapper class mappings
    if (updatedField.wrapperClass && typeof updatedField.wrapperClass === 'string') {
        const classes = updatedField.wrapperClass.split(' ');
        const tailwindClasses = classes.map((cls: string) => toItemSheetTailwindClass(cls));
        updatedField.wrapperClass = tailwindClasses.join(' ');
    }
    
    return updatedField;
}

/**
 * Apply Tailwind classes to all fields in a layout
 */
export function applyItemSheetTailwindLayout(fields: Field[]): Field[] {
    return fields.map(field => applyItemSheetTailwindClasses(field));
}

/**
 * Generate item sheet with Tailwind classes
 */
export function getTailwindItemSheetLayout(item: any): {
    header: Field[];
    body: Field[];
} {
    // Import the regular layout functions
    const { getItemSheetLayout } = require('./index');
    
    // Get the base layout
    const layout = getItemSheetLayout(item);
    
    // Apply Tailwind class mappings
    return {
        header: applyItemSheetTailwindLayout(layout.header),
        body: applyItemSheetTailwindLayout(layout.body)
    };
}

/**
 * Enhanced class mapping with fallbacks
 */
export function mapItemSheetClassToTailwind(originalClass: string): string {
    // Handle multiple classes
    if (originalClass.includes(' ')) {
        return originalClass
            .split(' ')
            .map(cls => mapItemSheetClassToTailwind(cls.trim()))
            .join(' ');
    }
    
    // Direct mapping
    if (ITEM_SHEET_TAILWIND_CLASS_MAP[originalClass]) {
        return ITEM_SHEET_TAILWIND_CLASS_MAP[originalClass];
    }
    
    // Handle component-specific mappings
    if (originalClass.startsWith('form-')) {
        return `tw-${originalClass}`;
    }
    
    if (originalClass.startsWith('sheet-')) {
        return `tw-${originalClass}`;
    }
    
    if (originalClass.startsWith('item-')) {
        return `tw-${originalClass}`;
    }
    
    // Return original if no mapping found
    return originalClass;
}