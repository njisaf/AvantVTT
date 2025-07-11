/**
 * @fileoverview FoundryVTT Drag-and-Drop Validation Utilities
 * @version 1.0.0
 * @author Avant VTT Team
 * 
 * This module contains validation logic for drag-and-drop operations.
 * It provides reusable validation functions that can be used across
 * different item types and drop scenarios.
 */

/**
 * Result of a validation operation
 */
export interface ValidationResult {
    /** Whether the validation passed */
    success: boolean;
    /** Error message if validation failed */
    error?: string;
    /** Additional validation metadata */
    metadata?: {
        existingCount?: number;
        maxAllowed?: number;
        duplicateId?: string;
        validationType?: string;
        // Additional properties for different validation types
        expectedType?: string;
        actualType?: string;
        hasId?: boolean;
        idType?: string;
        id?: string;
        isNativeFormat?: boolean;
    };
}

/**
 * Configuration for drop validation
 */
export interface DropValidationConfig {
    /** Maximum number of items allowed */
    maxItems?: number;
    /** Allow duplicate items */
    allowDuplicates?: boolean;
    /** Custom validation function */
    customValidator?: (newItem: any, existingItems: any[]) => ValidationResult;
    /** Enable comprehensive logging */
    enableLogging?: boolean;
}

/**
 * Validate that adding an item doesn't exceed maximum limits
 * 
 * @param currentItems - Array of current items
 * @param maxItems - Maximum allowed items
 * @param itemType - Type of item being added (for error messages)
 * @returns Validation result
 */
export function validateItemLimit(
    currentItems: any[],
    maxItems: number,
    itemType: string = 'items'
): ValidationResult {
    if (currentItems.length >= maxItems) {
        return {
            success: false,
            error: `Cannot add ${itemType}. Maximum of ${maxItems} ${itemType} allowed.`,
            metadata: {
                existingCount: currentItems.length,
                maxAllowed: maxItems,
                validationType: 'limit_check'
            }
        };
    }

    return { success: true };
}

/**
 * Validate that an item isn't already in the collection
 * 
 * @param newItemId - ID of the item being added
 * @param currentItems - Array of current item IDs
 * @param itemName - Name of the item (for error messages)
 * @returns Validation result
 */
export function validateDuplicateItem(
    newItemId: string,
    currentItems: string[],
    itemName: string = 'Item'
): ValidationResult {
    if (currentItems.includes(newItemId)) {
        return {
            success: false,
            error: `${itemName} is already added to this item.`,
            metadata: {
                duplicateId: newItemId,
                existingCount: currentItems.length,
                validationType: 'duplicate_check'
            }
        };
    }

    return { success: true };
}

/**
 * Validate that the dropped item is of the expected type
 * 
 * @param droppedItem - The dropped item
 * @param expectedType - Expected item type
 * @returns Validation result
 */
export function validateItemType(
    droppedItem: any,
    expectedType: string
): ValidationResult {
    if (!droppedItem.type || droppedItem.type !== expectedType) {
        return {
            success: false,
            error: `Invalid item type. Expected ${expectedType}, got ${droppedItem.type || 'unknown'}.`,
            metadata: {
                expectedType,
                actualType: droppedItem.type,
                validationType: 'type_check'
            }
        };
    }

    return { success: true };
}

/**
 * Comprehensive validation for drag-and-drop operations
 * 
 * This function runs all standard validations and any custom validation
 * provided in the configuration.
 * 
 * @param droppedItem - The item being dropped
 * @param currentItems - Current items in the collection
 * @param config - Validation configuration
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const result = validateDrop(droppedTrait, currentTraits, {
 *     maxItems: 10,
 *     allowDuplicates: false,
 *     enableLogging: true
 * });
 * 
 * if (!result.success) {
 *     console.error(result.error);
 * }
 * ```
 */
export function validateDrop(
    droppedItem: any,
    currentItems: any[],
    config: DropValidationConfig = {}
): ValidationResult {
    const {
        maxItems,
        allowDuplicates = false,
        customValidator,
        enableLogging = false
    } = config;

    if (enableLogging) {
        console.group('🔍 DROP VALIDATION');
        console.log('📦 Validation Input:', {
            droppedItem: droppedItem?.name || 'Unknown',
            currentItemCount: currentItems.length,
            maxItems,
            allowDuplicates,
            hasCustomValidator: !!customValidator
        });
    }

    // Validate item limits if specified
    if (maxItems !== undefined) {
        const limitResult = validateItemLimit(currentItems, maxItems, 'items');
        if (!limitResult.success) {
            if (enableLogging) {
                console.error('❌ Limit validation failed:', limitResult);
                console.groupEnd();
            }
            return limitResult;
        }
    }

    // Validate duplicates if not allowed
    if (!allowDuplicates && droppedItem.id) {
        const currentIds = currentItems.map(item =>
            typeof item === 'string' ? item : item.id
        ).filter(Boolean);

        const duplicateResult = validateDuplicateItem(
            droppedItem.id,
            currentIds,
            droppedItem.name || 'Item'
        );

        if (!duplicateResult.success) {
            if (enableLogging) {
                console.error('❌ Duplicate validation failed:', duplicateResult);
                console.groupEnd();
            }
            return duplicateResult;
        }
    }

    // Run custom validation if provided
    if (customValidator) {
        const customResult = customValidator(droppedItem, currentItems);
        if (!customResult.success) {
            if (enableLogging) {
                console.error('❌ Custom validation failed:', customResult);
                console.groupEnd();
            }
            return customResult;
        }
    }

    if (enableLogging) {
        console.log('✅ All validations passed');
        console.groupEnd();
    }

    return { success: true };
}

/**
 * Validate that an item has a valid ID
 * 
 * @param item - The item to validate
 * @param requireNativeFormat - Whether to require FoundryVTT native format
 * @returns Validation result
 */
export function validateItemId(
    item: any,
    requireNativeFormat: boolean = false
): ValidationResult {
    if (!item.id || typeof item.id !== 'string') {
        return {
            success: false,
            error: 'Item has no valid ID',
            metadata: {
                validationType: 'id_check',
                hasId: !!item.id,
                idType: typeof item.id
            }
        };
    }

    if (requireNativeFormat) {
        const isNativeFormat = item.id.length === 16 && /^[A-Za-z0-9]{16}$/.test(item.id);
        if (!isNativeFormat) {
            return {
                success: false,
                error: 'Item ID does not match FoundryVTT native format',
                metadata: {
                    validationType: 'native_format_check',
                    id: item.id,
                    isNativeFormat: false
                }
            };
        }
    }

    return { success: true };
} 