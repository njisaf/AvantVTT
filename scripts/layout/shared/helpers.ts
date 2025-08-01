/**
 * @fileoverview Shared Layout System Helpers
 * @description Common DSL functions used by both item-sheet and item-card layout systems
 * @version 1.0.0
 * @author Avant Development Team
 */

import type { Field } from './types';

/**
 * Always returns the field object - syntactic sugar for clarity
 * 
 * @param f - The field object to return
 * @returns The same field object
 * 
 * @example
 * ```typescript
 * const damageField = field({
 *     type: 'text',
 *     name: 'system.damage',
 *     value: '1d8',
 *     label: 'Damage'
 * });
 * ```
 */
export const field = <T extends Field>(f: T): T => f;

/**
 * Declarative conditional wrapper - returns field if predicate is true, null otherwise
 * 
 * @param predicate - Boolean condition to check
 * @param f - Function that returns the field (can be null)
 * @returns The field if predicate is true, null otherwise
 * 
 * @example
 * ```typescript
 * const fields = [
 *     when(system.apCost !== undefined, () => field({
 *         type: 'ap-selector',
 *         name: 'system.apCost',
 *         value: system.apCost,
 *         label: 'AP'
 *     }))
 * ].filter(Boolean);
 * ```
 */
export const when = (predicate: boolean, f: () => Field | null): Field | null =>
    predicate ? f() : null;

/**
 * Marker for full-width rows - adds fullWidth property to field
 * 
 * @param f - The field to mark as full-width
 * @returns The field with fullWidth: true property
 * 
 * @example
 * ```typescript
 * const descriptionField = fullWidth(field({
 *     type: 'description',
 *     name: 'system.description',
 *     value: system.description,
 *     label: 'Description'
 * }));
 * ```
 */
export const fullWidth = <T extends Field>(f: T): T & { fullWidth: true } =>
    ({ ...f, fullWidth: true });

/**
 * Groups two fields to be displayed side by side in a single row
 * 
 * @param fieldA - First field (left side)
 * @param fieldB - Second field (right side)
 * @returns A special field object that contains both fields, or null if either field is null
 * 
 * @example
 * ```typescript
 * const sideBySideFields = sideBy(
 *     field({
 *         type: 'number',
 *         name: 'system.weight',
 *         value: system.weight,
 *         label: 'Weight'
 *     }),
 *     field({
 *         type: 'number',
 *         name: 'system.cost',
 *         value: system.cost,
 *         label: 'Cost'
 *     })
 * );
 * ```
 */
export const sideBy = <T extends Field, U extends Field>(fieldA: T | null, fieldB: U | null): (Field & { sideBy: true; fields: [T, U] }) | null => {
    if (!fieldA || !fieldB) return null;
    return {
        type: 'side-by-side',
        name: 'side-by-side',
        sideBy: true,
        fields: [fieldA, fieldB]
    };
};

/**
 * Utility to filter out null values from when() conditionals
 * 
 * @param fields - Array of fields that may contain null values
 * @returns Array with null values filtered out
 * 
 * @example
 * ```typescript
 * const fields = filterFields([
 *     when(condition1, () => field({...})),
 *     field({...}),
 *     when(condition2, () => field({...}))
 * ]);
 * ```
 */
export const filterFields = (fields: (Field | null)[]): Field[] =>
    fields.filter(Boolean) as Field[];

/**
 * Common field configurations for reuse across layout types
 */
export const commonFields = {
    /**
     * Standard AP cost selector
     */
    apCost: (value: number | undefined, itemType: string) => when(value !== undefined, () => field({
        type: 'ap-selector',
        name: 'system.apCost',
        value: value,
        label: 'AP',
        hint: `Action Point cost to use this ${itemType}`,
        max: 3,
        class: `${itemType}-ap-cost`
    })),

    /**
     * Standard PP cost field
     */
    ppCost: (value: number | undefined, itemType: string) => when(value !== undefined, () => field({
        type: 'number',
        name: 'system.ppCost',
        value: value,
        label: 'PP',
        min: 0,
        max: 20,
        placeholder: '0',
        hint: `Power Point cost to use this ${itemType}`,
        class: `${itemType}-pp-cost`
    })),

    /**
     * Standard description field (always full width)
     */
    description: (value: string | undefined, itemType: string) => fullWidth(field({
        type: 'description',
        name: 'system.description',
        value: value || '',
        label: 'Description',
        placeholder: `Describe this ${itemType}...`,
        rows: 6,
        hint: `Detailed description of the ${itemType}'s appearance and function`,
        class: `${itemType}-description`
    })),

    /**
     * Standard weight field
     */
    weight: (value: number | undefined, itemType: string) => when(value !== undefined, () => field({
        type: 'number',
        name: 'system.weight',
        value: value,
        label: 'Weight',
        min: 0,
        step: 0.1,
        placeholder: '0',
        hint: 'Weight in pounds',
        class: `${itemType}-weight`
    })),

    /**
     * Standard cost field
     */
    cost: (value: number | undefined, itemType: string) => when(value !== undefined, () => field({
        type: 'number',
        name: 'system.cost',
        value: value,
        label: 'Cost',
        min: 0,
        placeholder: '0',
        hint: 'Cost in credits',
        class: `${itemType}-cost`
    })),

    /**
     * Standard ability selector
     */
    ability: (value: string | undefined, itemType: string) => when(value !== undefined, () => field({
        type: 'select',
        name: 'system.ability',
        value: value || 'might',
        label: 'Ability',
        options: [
            { value: 'might', label: 'Might' },
            { value: 'grace', label: 'Grace' },
            { value: 'intellect', label: 'Intellect' },
            { value: 'focus', label: 'Focus' }
        ],
        hint: `Primary ability for ${itemType} calculations`,
        class: `${itemType}-ability`
    })),

    /**
     * Standard expertise field
     */
    expertise: (value: number | undefined, itemType: string) => when(value !== undefined, () => field({
        type: 'number',
        name: 'system.expertise',
        value: value,
        label: 'Expertise',
        min: 0,
        step: 1,
        placeholder: '0',
        hint: 'Expertise bonus for this item',
        class: `${itemType}-expertise`
    })),

    /**
     * Standard level requirement field
     */
    levelRequirement: (value: number | undefined, itemType: string) => when(value !== undefined, () => field({
        type: 'number',
        name: 'system.levelRequirement',
        value: value || 1,
        label: 'Level Required',
        min: 1,
        max: 20,
        placeholder: '1',
        hint: `Minimum character level for this ${itemType}`,
        class: `${itemType}-level-requirement`
    })),

    /**
     * Standard requirements text field
     */
    requirements: (value: string | undefined, itemType: string) => when(value !== undefined, () => field({
        type: 'textarea',
        name: 'system.requirements',
        value: value || '',
        label: 'Requirements',
        placeholder: 'Enter any prerequisites or requirements...',
        rows: 1,
        hint: `List any conditions needed for this ${itemType}`,
        class: `${itemType}-requirements`
    })),

    /**
     * Standard traits field (always full width, not for trait items)
     */
    traits: (value: string[] | undefined, itemType: string) => when(itemType !== 'trait', () => fullWidth(field({
        type: 'traits',
        name: 'system.traits',
        value: value || [],
        label: 'Traits',
        hint: 'Add descriptive traits for this item',
        class: `${itemType}-traits`
    }))),

    /**
     * Standard image upload field
     */
    image: (value: string | undefined, itemType: string) => field({
        type: 'image-upload',
        name: 'img',
        value: value || 'icons/svg/mystery-man.svg',
        label: 'Image',
        size: 48,
        class: `${itemType}-image`
    }),

    /**
     * Standard item name field
     */
    name: (value: string | undefined, itemType: string) => field({
        type: 'text',
        name: 'name',
        value: value || '',
        label: 'Item Name',
        placeholder: `Enter ${itemType} name...`,
        required: true,
        class: `${itemType}-name-field`
    })
}; 