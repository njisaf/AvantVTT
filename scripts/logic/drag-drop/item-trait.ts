/**
 * @fileoverview Item-Trait Drag & Drop Module
 * @version 1.0.0
 * @description Pure functions and thin services for drag-drop trait operations
 * 
 * This module handles the drag-drop functionality for adding traits to items.
 * It provides pure functions for validation and processing, plus thin service
 * wrappers for DOM and FoundryVTT integration.
 * 
 * DESIGN PRINCIPLES:
 * - Pure functions for core logic (validation, processing)
 * - Thin service wrappers for side effects (DOM, FoundryVTT)
 * - Type-safe interfaces for all drag-drop operations
 * - Comprehensive error handling with Result types
 * - Support for both FoundryVTT v13+ and legacy methods
 */

import { logger } from '../../utils/logger.js';
import type { Result } from '../../types/core/result.js';

/**
 * Drag Data Source Types
 * 
 * The different sources from which drag data can be extracted.
 */
export enum DragDataSource {
    FOUNDRY_V13_MODERN = 'foundry-v13-modern',
    FOUNDRY_V13_LEGACY = 'foundry-v13-legacy',
    TEXT_EDITOR_LEGACY = 'text-editor-legacy',
    UNKNOWN = 'unknown'
}

/**
 * Drag Event Data
 * 
 * Standardized drag event data extracted from various sources.
 */
export interface DragEventData {
    /** The type of dragged item */
    type: string;
    /** The UUID of the dragged item */
    uuid: string;
    /** Additional data from the drag event */
    additionalData?: Record<string, any>;
    /** The source of this drag data */
    source: DragDataSource;
}

/**
 * Drop Zone Visual State
 * 
 * Visual states for drop zones during drag operations.
 */
export enum DropZoneState {
    IDLE = 'idle',
    DRAG_OVER = 'drag-over',
    DRAG_HOVER = 'drag-hover',
    DRAG_ACTIVE = 'drag-active',
    DROP_SUCCESS = 'drop-success',
    DROP_ERROR = 'drop-error'
}

/**
 * Drop Zone Configuration
 * 
 * Configuration for drop zone behavior and appearance.
 */
export interface DropZoneConfig {
    /** CSS classes to apply for each state */
    stateClasses: Record<DropZoneState, string>;
    /** Whether to show visual feedback */
    showVisualFeedback: boolean;
    /** Duration for success/error feedback (ms) */
    feedbackDuration: number;
    /** Allowed drag types */
    allowedTypes: string[];
    /** Custom validation function */
    customValidator?: (data: DragEventData) => boolean;
}

/**
 * Default drop zone configuration
 */
export const DEFAULT_DROP_ZONE_CONFIG: DropZoneConfig = {
    stateClasses: {
        [DropZoneState.IDLE]: '',
        [DropZoneState.DRAG_OVER]: 'drag-over',
        [DropZoneState.DRAG_HOVER]: 'drag-hover',
        [DropZoneState.DRAG_ACTIVE]: 'drag-active',
        [DropZoneState.DROP_SUCCESS]: 'drop-success',
        [DropZoneState.DROP_ERROR]: 'drop-error'
    },
    showVisualFeedback: true,
    feedbackDuration: 2000,
    allowedTypes: ['Item']
};

/**
 * Trait Drop Validation Result
 * 
 * Result of validating a trait drop operation.
 */
export interface TraitDropValidation {
    /** Whether the drop is valid */
    isValid: boolean;
    /** Validation error message if invalid */
    error?: string;
    /** The resolved trait item */
    traitItem?: any;
    /** The target item receiving the trait */
    targetItem?: any;
    /** Whether this would create a duplicate */
    isDuplicate: boolean;
    /** Additional metadata */
    metadata?: Record<string, any>;
}

/**
 * Trait Drop Processing Result
 * 
 * Result of processing a trait drop operation.
 */
export interface TraitDropResult {
    /** Whether the drop was successful */
    success: boolean;
    /** The updated traits array */
    traits?: any[];
    /** Success or error message */
    message: string;
    /** Any error that occurred */
    error?: string;
    /** Metadata about the operation */
    metadata?: {
        addedTraitId: string;
        addedTraitName: string;
        totalTraits: number;
        processingTimeMs: number;
    };
}

/**
 * Drop Zone Visual Feedback
 * 
 * Configuration for visual feedback during drop operations.
 */
export interface DropZoneFeedback {
    /** The feedback message to display */
    message: string;
    /** The type of feedback */
    type: 'success' | 'error' | 'info';
    /** Duration to show feedback (ms) */
    duration: number;
    /** CSS classes to apply */
    classes: string[];
}

/**
 * Drag Data Extraction Configuration
 * 
 * Configuration for extracting drag data from events.
 */
export interface DragDataExtractionConfig {
    /** Whether to try modern v13+ method first */
    preferModern: boolean;
    /** Whether to fall back to legacy methods */
    enableLegacyFallback: boolean;
    /** Maximum time to spend extracting data (ms) */
    maxExtractionTime: number;
    /** Whether to validate extracted data */
    validateExtracted: boolean;
}

/**
 * Default drag data extraction configuration
 */
export const DEFAULT_DRAG_EXTRACTION_CONFIG: DragDataExtractionConfig = {
    preferModern: true,
    enableLegacyFallback: true,
    maxExtractionTime: 1000,
    validateExtracted: true
};

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Extract drag data from a drag event with comprehensive fallback handling
 * 
 * This function handles the various ways FoundryVTT can provide drag data
 * and provides fallback mechanisms for different versions and situations.
 * 
 * @param event - The drag event
 * @param config - Configuration for extraction behavior
 * @returns Extraction result with drag data
 */
export function extractDragData(
    event: DragEvent,
    config: DragDataExtractionConfig = DEFAULT_DRAG_EXTRACTION_CONFIG
): Result<DragEventData, string> {
    const startTime = Date.now();
    
    try {
        let data: any;
        let source: DragDataSource;

        if (config.preferModern) {
            // Try modern v13+ approach first
            try {
                const dragDataText = event.dataTransfer?.getData('text/plain');
                if (dragDataText) {
                    data = JSON.parse(dragDataText);
                    source = DragDataSource.FOUNDRY_V13_MODERN;
                    logger.debug('DragDrop | Extracted drag data using modern v13+ method');
                } else {
                    throw new Error('No v13 drag data available');
                }
            } catch (parseError) {
                if (config.enableLegacyFallback) {
                    // Fallback to legacy method if modern approach fails
                    const TextEditor = (globalThis as any).TextEditor;
                    if (TextEditor?.getDragEventData) {
                        data = TextEditor.getDragEventData(event);
                        source = DragDataSource.TEXT_EDITOR_LEGACY;
                        logger.debug('DragDrop | Extracted drag data using legacy TextEditor method');
                    } else {
                        throw new Error('Unable to extract drag data - no compatible method available');
                    }
                } else {
                    throw new Error('Modern extraction failed and legacy fallback is disabled');
                }
            }
        } else {
            // Try legacy method first
            const TextEditor = (globalThis as any).TextEditor;
            if (TextEditor?.getDragEventData) {
                data = TextEditor.getDragEventData(event);
                source = DragDataSource.TEXT_EDITOR_LEGACY;
                logger.debug('DragDrop | Extracted drag data using legacy TextEditor method');
            } else {
                throw new Error('Legacy extraction failed and no TextEditor available');
            }
        }

        // Validate extraction timeout
        const extractionTime = Date.now() - startTime;
        if (extractionTime > config.maxExtractionTime) {
            logger.warn('DragDrop | Drag data extraction exceeded time limit', {
                extractionTime,
                maxTime: config.maxExtractionTime
            });
        }

        // Validate extracted data if requested
        if (config.validateExtracted) {
            if (!data || typeof data !== 'object') {
                return { success: false, error: 'Invalid drag data format' };
            }
            
            if (!data.type || !data.uuid) {
                return { success: false, error: 'Missing required drag data fields (type, uuid)' };
            }
        }

        const dragEventData: DragEventData = {
            type: data.type,
            uuid: data.uuid,
            additionalData: data,
            source
        };

        logger.debug('DragDrop | Drag data extraction successful', {
            type: data.type,
            uuid: data.uuid,
            source,
            extractionTime
        });

        return { success: true, value: dragEventData };

    } catch (error) {
        const extractionTime = Date.now() - startTime;
        const errorMessage = `Drag data extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        
        logger.error('DragDrop | Error extracting drag data:', error);
        
        return { success: false, error: errorMessage };
    }
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Validate a trait drop operation
 * 
 * Validates whether a trait can be dropped on a target item, checking for
 * duplicates, type compatibility, and other business rules.
 * 
 * @param dragData - The drag data containing trait information
 * @param targetItem - The item that will receive the trait
 * @param existingTraits - The current traits on the target item
 * @returns Validation result
 */
export function validateTraitDrop(
    dragData: DragEventData,
    targetItem: any,
    existingTraits: any[]
): Promise<TraitDropValidation> {
    return new Promise(async (resolve, reject) => {
        try {
            // Check if drag data is valid
            if (!dragData || !dragData.type || !dragData.uuid) {
                resolve({
                    isValid: false,
                    error: 'Invalid drag data - missing type or UUID',
                    targetItem,
                    isDuplicate: false
                });
                return;
            }

            // Check if the dragged item is the correct type
            if (dragData.type !== 'Item') {
                resolve({
                    isValid: false,
                    error: 'Only trait items can be dropped here',
                    targetItem,
                    isDuplicate: false
                });
                return;
            }

            // Resolve the dragged item
            const traitItem = await resolveItemFromUuid(dragData.uuid);
            if (!traitItem) {
                resolve({
                    isValid: false,
                    error: 'Could not find dropped item',
                    targetItem,
                    isDuplicate: false
                });
                return;
            }

            // Check if the item is actually a trait
            if (traitItem.type !== 'trait') {
                resolve({
                    isValid: false,
                    error: 'Only trait items can be dropped here',
                    traitItem,
                    targetItem,
                    isDuplicate: false
                });
                return;
            }

            // Extract trait ID from the trait item
            const traitId = traitItem.system?.traitId || traitItem.id || traitItem.name;
            if (!traitId) {
                resolve({
                    isValid: false,
                    error: 'Trait item has no valid ID',
                    traitItem,
                    targetItem,
                    isDuplicate: false
                });
                return;
            }

            // Check for duplicates
            const isDuplicate = isTraitDuplicate(traitId, existingTraits);
            if (isDuplicate) {
                resolve({
                    isValid: false,
                    error: `Trait '${traitItem.name}' is already present`,
                    traitItem,
                    targetItem,
                    isDuplicate: true
                });
                return;
            }

            // All validations passed
            resolve({
                isValid: true,
                traitItem,
                targetItem,
                isDuplicate: false,
                metadata: {
                    traitId,
                    traitName: traitItem.name,
                    traitType: traitItem.type
                }
            });

        } catch (error) {
            logger.error('DragDrop | Error validating trait drop:', error);
            reject(error);
        }
    });
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Process a trait drop operation
 * 
 * Processes a validated trait drop by adding the trait to the target item's
 * trait list and returning the updated traits array.
 * 
 * @param validation - The validation result from validateTraitDrop
 * @param targetItem - The item receiving the trait
 * @param existingTraits - The current traits on the target item
 * @returns Processing result with updated traits
 */
export function processTraitDrop(
    validation: TraitDropValidation,
    targetItem: any,
    existingTraits: any[]
): Promise<TraitDropResult> {
    return new Promise(async (resolve, reject) => {
        const startTime = Date.now();
        
        try {
            // Check if validation passed
            if (!validation.isValid) {
                resolve({
                    success: false,
                    message: validation.error || 'Validation failed',
                    error: validation.error
                });
                return;
            }

            if (!validation.traitItem) {
                resolve({
                    success: false,
                    message: 'No trait item provided',
                    error: 'Missing trait item in validation'
                });
                return;
            }

            // Use the existing trait addition logic
            const { addTraitToList } = await import('../../logic/trait-utils.js');
            
            // Extract trait ID
            const traitId = validation.traitItem.system?.traitId || validation.traitItem.id || validation.traitItem.name;
            
            // Add the trait to the existing traits list
            const result = await addTraitToList(existingTraits, traitId);
            
            if (result.success && result.traits) {
                const processingTime = Date.now() - startTime;
                
                resolve({
                    success: true,
                    traits: result.traits,
                    message: `Added trait: ${validation.traitItem.name}`,
                    metadata: {
                        addedTraitId: traitId,
                        addedTraitName: validation.traitItem.name,
                        totalTraits: result.traits.length,
                        processingTimeMs: processingTime
                    }
                });
            } else {
                resolve({
                    success: false,
                    message: result.error || 'Failed to add trait',
                    error: result.error
                });
            }

        } catch (error) {
            const processingTime = Date.now() - startTime;
            const errorMessage = `Trait drop processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
            
            logger.error('DragDrop | Error processing trait drop:', error);
            
            resolve({
                success: false,
                message: errorMessage,
                error: errorMessage
            });
        }
    });
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Check if a trait already exists on an item
 * 
 * Checks whether a trait with the given ID already exists in the item's
 * trait list to prevent duplicates.
 * 
 * @param traitId - The ID of the trait to check
 * @param existingTraits - The current traits to check against
 * @returns Whether the trait already exists
 */
export function isTraitDuplicate(
    traitId: string,
    existingTraits: any[]
): boolean {
    if (!existingTraits || existingTraits.length === 0) {
        return false;
    }

    // Check if a trait with the same ID already exists
    const isDuplicate = existingTraits.some(trait => {
        // Handle different trait data structures
        if (typeof trait === 'string') {
            return trait === traitId;
        } else if (trait && typeof trait === 'object') {
            // Check common trait ID properties
            return trait.id === traitId || 
                   trait.traitId === traitId || 
                   trait.name === traitId;
        }
        return false;
    });

    if (isDuplicate) {
        logger.debug('DragDrop | Trait duplicate detected', {
            traitId,
            existingTraitCount: existingTraits.length
        });
    }

    return isDuplicate;
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Resolve a dragged item from its UUID
 * 
 * Resolves a FoundryVTT item from its UUID, with error handling for
 * items that cannot be found or accessed.
 * 
 * @param uuid - The UUID of the item to resolve
 * @returns The resolved item or null if not found
 */
export function resolveItemFromUuid(uuid: string): Promise<any | null> {
    return new Promise(async (resolve, reject) => {
        try {
            // Use FoundryVTT's fromUuid function
            const item = await (globalThis as any).fromUuid(uuid);
            
            if (!item) {
                logger.warn('DragDrop | Could not resolve item from UUID', { uuid });
                resolve(null);
                return;
            }

            logger.debug('DragDrop | Successfully resolved item from UUID', {
                uuid,
                itemName: item.name,
                itemType: item.type,
                itemId: item.id
            });

            resolve(item);
        } catch (error) {
            logger.error('DragDrop | Error resolving item from UUID:', error);
            reject(error);
        }
    });
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Determine the source of drag data
 * 
 * Analyzes the drag event to determine which method was used to extract
 * the drag data, useful for debugging and compatibility.
 * 
 * @param event - The drag event
 * @param extractedData - The extracted drag data
 * @returns The determined data source
 */
export function determineDragDataSource(
    event: DragEvent,
    extractedData: any
): DragDataSource {
    // Check if we have modern v13+ drag data
    if (event.dataTransfer?.getData('text/plain')) {
        return DragDataSource.FOUNDRY_V13_MODERN;
    }
    
    // Check if we used TextEditor legacy method
    const TextEditor = (globalThis as any).TextEditor;
    if (TextEditor?.getDragEventData) {
        return DragDataSource.TEXT_EDITOR_LEGACY;
    }
    
    // Unknown source
    return DragDataSource.UNKNOWN;
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Create drop zone visual feedback
 * 
 * Creates appropriate visual feedback configuration for drop zone states.
 * 
 * @param state - The drop zone state
 * @param message - The feedback message
 * @param config - Drop zone configuration
 * @returns Feedback configuration
 */
export function createDropZoneFeedback(
    state: DropZoneState,
    message: string,
    config: DropZoneConfig = DEFAULT_DROP_ZONE_CONFIG
): DropZoneFeedback {
    let feedbackType: 'success' | 'error' | 'info' = 'info';
    
    // Determine feedback type based on state
    switch (state) {
        case DropZoneState.DROP_SUCCESS:
            feedbackType = 'success';
            break;
        case DropZoneState.DROP_ERROR:
            feedbackType = 'error';
            break;
        default:
            feedbackType = 'info';
            break;
    }
    
    return {
        message,
        type: feedbackType,
        duration: config.feedbackDuration,
        classes: [config.stateClasses[state]].filter(Boolean)
    };
}

/**
 * DROP ZONE SERVICE CLASS
 * 
 * Thin service wrapper for managing drop zone DOM interactions.
 * This class handles the stateful DOM manipulation while delegating
 * business logic to pure functions.
 */
export class DropZoneService {
    private element: HTMLElement;
    private config: DropZoneConfig;
    private currentState: DropZoneState = DropZoneState.IDLE;
    private feedbackTimeout?: number;

    constructor(element: HTMLElement, config: DropZoneConfig = DEFAULT_DROP_ZONE_CONFIG) {
        this.element = element;
        this.config = config;
        this.setupEventListeners();
    }

    /**
     * PHASE 1 INTERFACE STUB
     * 
     * Set up event listeners for the drop zone
     * 
     * Configures the necessary DOM event listeners for drag and drop operations.
     */
    private setupEventListeners(): void {
        // STUB - Phase 2 Implementation
        throw new Error('Phase 1 stub - implement in Phase 2');
    }

    /**
     * PHASE 1 INTERFACE STUB
     * 
     * Update the visual state of the drop zone
     * 
     * Updates the CSS classes and visual appearance based on the current state.
     * 
     * @param state - The new state to apply
     */
    public setState(state: DropZoneState): void {
        // STUB - Phase 2 Implementation
        throw new Error('Phase 1 stub - implement in Phase 2');
    }

    /**
     * PHASE 1 INTERFACE STUB
     * 
     * Show feedback message on the drop zone
     * 
     * Displays temporary feedback to the user about the drop operation.
     * 
     * @param feedback - The feedback configuration
     */
    public showFeedback(feedback: DropZoneFeedback): void {
        // STUB - Phase 2 Implementation
        throw new Error('Phase 1 stub - implement in Phase 2');
    }

    /**
     * PHASE 1 INTERFACE STUB
     * 
     * Handle drag over events
     * 
     * Processes drag over events and updates the drop zone state accordingly.
     * 
     * @param event - The drag event
     */
    public onDragOver(event: DragEvent): void {
        // STUB - Phase 2 Implementation
        throw new Error('Phase 1 stub - implement in Phase 2');
    }

    /**
     * PHASE 1 INTERFACE STUB
     * 
     * Handle drag enter events
     * 
     * Processes drag enter events and updates the drop zone state accordingly.
     * 
     * @param event - The drag event
     */
    public onDragEnter(event: DragEvent): void {
        // STUB - Phase 2 Implementation
        throw new Error('Phase 1 stub - implement in Phase 2');
    }

    /**
     * PHASE 1 INTERFACE STUB
     * 
     * Handle drag leave events
     * 
     * Processes drag leave events and updates the drop zone state accordingly.
     * 
     * @param event - The drag event
     */
    public onDragLeave(event: DragEvent): void {
        // STUB - Phase 2 Implementation
        throw new Error('Phase 1 stub - implement in Phase 2');
    }

    /**
     * PHASE 1 INTERFACE STUB
     * 
     * Handle drop events
     * 
     * Processes drop events by extracting data, validating, and processing.
     * 
     * @param event - The drop event
     * @param targetItem - The item receiving the drop
     * @param existingTraits - The current traits on the target item
     * @returns Processing result
     */
    public async onDrop(
        event: DragEvent,
        targetItem: any,
        existingTraits: any[]
    ): Promise<TraitDropResult> {
        // STUB - Phase 2 Implementation
        throw new Error('Phase 1 stub - implement in Phase 2');
    }

    /**
     * PHASE 1 INTERFACE STUB
     * 
     * Clean up event listeners and state
     * 
     * Removes event listeners and cleans up any timers or state.
     */
    public destroy(): void {
        // STUB - Phase 2 Implementation
        throw new Error('Phase 1 stub - implement in Phase 2');
    }
}

/**
 * DRAG DATA EXTRACTION SERVICE
 * 
 * Service for extracting drag data from various FoundryVTT sources.
 * This handles the complexity of different FoundryVTT versions and extraction methods.
 */
export class DragDataExtractionService {
    private config: DragDataExtractionConfig;

    constructor(config: DragDataExtractionConfig = DEFAULT_DRAG_EXTRACTION_CONFIG) {
        this.config = config;
    }

    /**
     * PHASE 1 INTERFACE STUB
     * 
     * Extract drag data using modern FoundryVTT v13+ method
     * 
     * Attempts to extract drag data using the modern v13+ approach.
     * 
     * @param event - The drag event
     * @returns Extracted drag data or null if extraction fails
     */
    public extractModernDragData(event: DragEvent): DragEventData | null {
        // STUB - Phase 2 Implementation
        throw new Error('Phase 1 stub - implement in Phase 2');
    }

    /**
     * PHASE 1 INTERFACE STUB
     * 
     * Extract drag data using legacy TextEditor method
     * 
     * Attempts to extract drag data using the legacy TextEditor approach.
     * 
     * @param event - The drag event
     * @returns Extracted drag data or null if extraction fails
     */
    public extractLegacyDragData(event: DragEvent): DragEventData | null {
        // STUB - Phase 2 Implementation
        throw new Error('Phase 1 stub - implement in Phase 2');
    }

    /**
     * PHASE 1 INTERFACE STUB
     * 
     * Extract drag data with comprehensive fallback handling
     * 
     * Main extraction method that tries multiple approaches based on configuration.
     * 
     * @param event - The drag event
     * @returns Extraction result with drag data
     */
    public extractDragData(event: DragEvent): Result<DragEventData, string> {
        // STUB - Phase 2 Implementation
        throw new Error('Phase 1 stub - implement in Phase 2');
    }
}

// Export type-only interfaces for external use
// Note: These are already exported above as part of the interface definitions