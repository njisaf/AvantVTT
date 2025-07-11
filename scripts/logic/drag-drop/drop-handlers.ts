/**
 * @fileoverview FoundryVTT Generic Drag-and-Drop Handlers
 * @version 1.0.0
 * @author Avant VTT Team
 * 
 * This module provides generic, reusable drag-and-drop handlers that can be
 * used across different item types and scenarios. It combines ID extraction
 * and validation utilities into complete drop handling workflows.
 */

import { extractDocumentId, type IdExtractionResult, type IdExtractionConfig } from './id-extraction';
import { validateDrop, type ValidationResult, type DropValidationConfig } from './drop-validation';

/**
 * Configuration for generic drop handling
 */
export interface DropHandlerConfig {
    /** ID extraction configuration */
    idExtraction?: IdExtractionConfig;
    /** Validation configuration */
    validation?: DropValidationConfig;
    /** Enable comprehensive logging */
    enableLogging?: boolean;
    /** Custom success handler */
    onSuccess?: (item: any, extractedId: string) => void;
    /** Custom error handler */
    onError?: (error: string, metadata?: any) => void;
}

/**
 * Result of a complete drop handling operation
 */
export interface DropHandlerResult {
    /** Whether the operation was successful */
    success: boolean;
    /** Error message if operation failed */
    error?: string;
    /** The extracted/validated ID */
    id?: string;
    /** ID extraction result */
    idExtraction?: IdExtractionResult;
    /** Validation result */
    validation?: ValidationResult;
    /** Additional operation metadata */
    metadata?: {
        operationType?: string;
        itemName?: string;
        itemType?: string;
        extractionStrategy?: string;
        validationType?: string;
    };
}

/**
 * Generic handler for processing dropped items
 * 
 * This function combines ID extraction and validation into a single
 * operation that can be used across different item types.
 * 
 * @param droppedItem - The item being dropped
 * @param currentItems - Current items in the collection
 * @param config - Configuration for the drop operation
 * @returns Complete drop handling result
 * 
 * @example
 * ```typescript
 * const result = await handleDroppedItem(droppedTrait, currentTraits, {
 *     validation: {
 *         maxItems: 10,
 *         allowDuplicates: false
 *     },
 *     idExtraction: {
 *         requireNativeFormat: true
 *     },
 *     enableLogging: true
 * });
 * 
 * if (result.success) {
 *     // Add the item with result.id
 * } else {
 *     console.error(result.error);
 * }
 * ```
 */
export function handleDroppedItem(
    droppedItem: any,
    currentItems: any[],
    config: DropHandlerConfig = {}
): DropHandlerResult {
    const {
        idExtraction = {},
        validation = {},
        enableLogging = false,
        onSuccess,
        onError
    } = config;

    if (enableLogging) {
        console.group('🔄 GENERIC DROP HANDLER');
        console.log('📦 Drop Operation Starting:', {
            droppedItem: droppedItem?.name || 'Unknown',
            droppedItemType: droppedItem?.type,
            currentItemCount: currentItems.length,
            hasIdExtraction: !!idExtraction,
            hasValidation: !!validation
        });
    }

    // Step 1: Extract ID from dropped item
    const idResult = extractDocumentId(droppedItem, {
        ...idExtraction,
        enableLogging: enableLogging
    });

    if (!idResult.id) {
        const error = 'Failed to extract valid ID from dropped item';
        if (enableLogging) {
            console.error('❌ ID extraction failed:', idResult);
            console.groupEnd();
        }
        if (onError) {
            onError(error, idResult);
        }
        return {
            success: false,
            error,
            idExtraction: idResult,
            metadata: {
                operationType: 'id_extraction_failed',
                itemName: droppedItem?.name,
                itemType: droppedItem?.type,
                extractionStrategy: idResult.strategy
            }
        };
    }

    // Step 2: Validate the drop operation
    const itemWithId = { ...droppedItem, id: idResult.id };
    const validationResult = validateDrop(itemWithId, currentItems, {
        ...validation,
        enableLogging: enableLogging
    });

    if (!validationResult.success) {
        const error = validationResult.error || 'Drop validation failed';
        if (enableLogging) {
            console.error('❌ Drop validation failed:', validationResult);
            console.groupEnd();
        }
        if (onError) {
            onError(error, validationResult.metadata);
        }
        return {
            success: false,
            error,
            id: idResult.id,
            idExtraction: idResult,
            validation: validationResult,
            metadata: {
                operationType: 'validation_failed',
                itemName: droppedItem?.name,
                itemType: droppedItem?.type,
                extractionStrategy: idResult.strategy,
                validationType: validationResult.metadata?.validationType
            }
        };
    }

    // Step 3: Success - call custom handler if provided
    if (onSuccess) {
        onSuccess(itemWithId, idResult.id);
    }

    if (enableLogging) {
        console.log('✅ Drop operation completed successfully:', {
            extractedId: idResult.id,
            extractionStrategy: idResult.strategy,
            isNativeFormat: idResult.isNativeFormat,
            confidence: idResult.confidence
        });
        console.groupEnd();
    }

    return {
        success: true,
        id: idResult.id,
        idExtraction: idResult,
        validation: validationResult,
        metadata: {
            operationType: 'drop_success',
            itemName: droppedItem?.name,
            itemType: droppedItem?.type,
            extractionStrategy: idResult.strategy,
            validationType: 'passed'
        }
    };
}

/**
 * Specialized handler for trait drops
 * 
 * This is a convenience wrapper for handleDroppedItem with trait-specific
 * configuration and validation.
 * 
 * @param droppedTrait - The trait being dropped
 * @param currentTraits - Current trait IDs
 * @param maxTraits - Maximum allowed traits
 * @param enableLogging - Enable logging
 * @returns Drop handling result
 */
export function handleTraitDrop(
    droppedTrait: any,
    currentTraits: string[],
    maxTraits?: number,
    enableLogging: boolean = false
): DropHandlerResult {
    return handleDroppedItem(droppedTrait, currentTraits, {
        validation: {
            maxItems: maxTraits,
            allowDuplicates: false,
            customValidator: (item, items) => {
                // Trait-specific validation can be added here
                return { success: true };
            }
        },
        idExtraction: {
            requireNativeFormat: false, // Allow legacy formats for traits
            enableLogging: enableLogging
        },
        enableLogging: enableLogging
    });
}

/**
 * Create a reusable drop handler for a specific item type
 * 
 * This factory function creates a drop handler configured for a specific
 * item type with predefined validation and extraction rules.
 * 
 * @param itemType - The item type this handler is for
 * @param defaultConfig - Default configuration for this item type
 * @returns Configured drop handler function
 * 
 * @example
 * ```typescript
 * const handleSpellDrop = createDropHandler('spell', {
 *     validation: { maxItems: 20, allowDuplicates: false },
 *     idExtraction: { requireNativeFormat: true }
 * });
 * 
 * const result = handleSpellDrop(droppedSpell, currentSpells);
 * ```
 */
export function createDropHandler(
    itemType: string,
    defaultConfig: DropHandlerConfig = {}
): (droppedItem: any, currentItems: any[], config?: DropHandlerConfig) => DropHandlerResult {
    return (droppedItem: any, currentItems: any[], config: DropHandlerConfig = {}) => {
        // Merge default config with provided config
        const mergedConfig: DropHandlerConfig = {
            ...defaultConfig,
            ...config,
            validation: {
                ...defaultConfig.validation,
                ...config.validation
            },
            idExtraction: {
                ...defaultConfig.idExtraction,
                ...config.idExtraction
            }
        };

        return handleDroppedItem(droppedItem, currentItems, mergedConfig);
    };
}

/**
 * Utility function to convert drop handler result to item-sheet-utils format
 * 
 * This provides backward compatibility with the existing item-sheet-utils
 * return format while using the new generic drop handlers.
 * 
 * @param result - Drop handler result
 * @param newItemsList - The updated items list
 * @returns Legacy format result
 */
export function convertToLegacyFormat(
    result: DropHandlerResult,
    newItemsList: any[] = []
): { success: boolean; error?: string; traits?: any[]; duplicate?: boolean } {
    return {
        success: result.success,
        error: result.error,
        traits: result.success ? newItemsList : undefined,
        duplicate: result.validation?.metadata?.validationType === 'duplicate_check'
    };
} 