/**
 * @fileoverview FoundryVTT Drag-and-Drop Utilities - Barrel Exports
 * @version 1.0.0
 * @author Avant VTT Team
 * 
 * This module provides a single entry point for all drag-and-drop utilities.
 * It exports all the functions, interfaces, and types needed for implementing
 * drag-and-drop functionality across the AvantVTT system.
 * 
 * USAGE:
 * ```typescript
 * import { handleDroppedItem, extractDocumentId, validateDrop } from './scripts/logic/drag-drop';
 * ```
 */

// Re-export all ID extraction utilities
export {
    extractDocumentId,
    isNativeFoundryId,
    getCompendiumType,
    type IdExtractionResult,
    type IdExtractionConfig
} from './id-extraction';

// Re-export all validation utilities
export {
    validateDrop,
    validateItemLimit,
    validateDuplicateItem,
    validateItemType,
    validateItemId,
    type ValidationResult,
    type DropValidationConfig
} from './drop-validation';

// Re-export all drop handlers
export {
    handleDroppedItem,
    handleTraitDrop,
    createDropHandler,
    convertToLegacyFormat,
    type DropHandlerConfig,
    type DropHandlerResult
} from './drop-handlers';

// Import types for internal use in constants and re-exports
import type { DropHandlerConfig } from './drop-handlers';
import type { IdExtractionResult, IdExtractionConfig } from './id-extraction';
import type { ValidationResult, DropValidationConfig } from './drop-validation';
import type { DropHandlerResult } from './drop-handlers';

// Convenience re-exports for common use cases
export type {
    // Most commonly used types
    IdExtractionResult as ExtractionResult,
    ValidationResult as ValidateResult,
    DropHandlerResult as DropResult,

    // Configuration types
    IdExtractionConfig as ExtractionConfig,
    DropValidationConfig as ValidationConfig,
    DropHandlerConfig as DropConfig
};

/**
 * Version information for the drag-drop module system
 */
export const DRAG_DROP_VERSION = '1.0.0';

/**
 * Default configuration for trait drops
 */
export const DEFAULT_TRAIT_CONFIG: DropHandlerConfig = {
    validation: {
        allowDuplicates: false,
        maxItems: undefined, // No limit by default
        enableLogging: false
    },
    idExtraction: {
        requireNativeFormat: false,
        enableLogging: false
    },
    enableLogging: false
};

/**
 * Default configuration for system compendium items
 */
export const DEFAULT_SYSTEM_CONFIG: DropHandlerConfig = {
    validation: {
        allowDuplicates: false,
        enableLogging: false
    },
    idExtraction: {
        requireNativeFormat: true, // System items should use native IDs
        enableLogging: false
    },
    enableLogging: false
};

/**
 * Default configuration for custom/world items
 */
export const DEFAULT_CUSTOM_CONFIG: DropHandlerConfig = {
    validation: {
        allowDuplicates: false,
        enableLogging: false
    },
    idExtraction: {
        requireNativeFormat: false, // Custom items may use legacy formats
        enableLogging: false
    },
    enableLogging: false
}; 