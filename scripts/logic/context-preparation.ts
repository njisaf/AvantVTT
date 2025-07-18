/**
 * @fileoverview Context Preparation Logic Module
 * @version 1.0.0
 * @description Pure functions for preparing ApplicationV2 context data
 * 
 * This module extracts the complex context preparation logic from the item sheet
 * into pure functions that can be tested and maintained independently.
 * 
 * DESIGN PRINCIPLES:
 * - Pure functions with no side effects
 * - Type-safe interfaces for all context data
 * - Comprehensive error handling with Result types
 * - Separation of data preparation from DOM concerns
 * - Comprehensive logging for debugging ApplicationV2 issues
 */

import { logger } from '../utils/logger.js';
import { prepareTemplateData, prepareItemHeaderMetaFields, prepareItemBodyFields } from './item-sheet-utils.js';
import type { Result } from '../types/core/result.js';

/**
 * Item Sheet Context Structure
 * 
 * Defines the complete context structure for item sheet rendering.
 */
export interface ItemSheetContext {
    /** The item document data */
    item: any;
    /** The system-specific data */
    system: any;
    /** Document flags */
    flags: any;
    /** Whether the sheet is editable */
    editable: boolean;
    /** Whether the user owns the document */
    owner: boolean;
    /** Enriched description HTML */
    enrichedDescription: string;
    /** Enhanced trait display data */
    displayTraits: any[];
    /** Meta fields for header layout */
    metaFields: any[];
    /** Body fields for universal architecture */
    bodyFields: any[];
    /** Rarity options for augments */
    rarityOptions?: any[];
    /** Augment type options */
    augmentTypeOptions?: any[];
    /** Original trait IDs for form submission */
    originalTraits?: any[];
    /** Tags string for trait items */
    tagsString?: string;
}

/**
 * Context Preparation Configuration
 * 
 * Configuration options for context preparation behavior.
 */
export interface ContextPreparationConfig {
    /** Whether to enable field preparation */
    enableFields: boolean;
    /** Whether to enable trait display data preparation */
    enableTraitDisplay: boolean;
    /** Whether to enable description enrichment */
    enableDescriptionEnrichment: boolean;
    /** Whether to enable extensive logging */
    enableDebugLogging: boolean;
    /** Maximum number of traits to process */
    maxTraits: number;
    /** Timeout for async operations (ms) */
    asyncTimeout: number;
}

/**
 * Default context preparation configuration
 */
export const DEFAULT_CONTEXT_CONFIG: ContextPreparationConfig = {
    enableFields: true,
    enableTraitDisplay: true,
    enableDescriptionEnrichment: true,
    enableDebugLogging: true,
    maxTraits: 50,
    asyncTimeout: 5000
};

/**
 * Context Preparation Result
 * 
 * Result of preparing context data for item sheet rendering.
 */
export interface ContextPreparationResult {
    /** Whether preparation was successful */
    success: boolean;
    /** The prepared context data */
    context?: ItemSheetContext;
    /** Any error that occurred */
    error?: string;
    /** Metadata about the preparation process */
    metadata: {
        processingTimeMs: number;
        traitsProcessed: number;
        fieldsGenerated: number;
        enrichmentEnabled: boolean;
        fallbacksUsed: string[];
    };
}

/**
 * Item Data for Context Preparation
 * 
 * Simplified item data structure for context preparation.
 */
export interface ItemDataForContext {
    /** Item ID */
    id: string;
    /** Item type */
    type: string;
    /** Item name */
    name: string;
    /** System-specific data */
    system: any;
    /** Document flags */
    flags: any;
    /** Whether this is editable */
    isEditable?: boolean;
    /** Whether user owns this */
    isOwner?: boolean;
}

/**
 * PHASE 4 PURE FUNCTION
 * 
 * Prepare base context data from item data
 * 
 * Creates the foundation context structure with basic item information
 * and system data. This is the first step in context preparation.
 * 
 * @param itemData - The item data to prepare context from
 * @param baseContext - Base context from ApplicationV2 super class
 * @param config - Configuration for context preparation
 * @returns Base context preparation result
 */
export function prepareBaseContext(
    itemData: ItemDataForContext,
    baseContext: any,
    config: ContextPreparationConfig = DEFAULT_CONTEXT_CONFIG
): Result<Partial<ItemSheetContext>, string> {
    try {
        if (config.enableDebugLogging) {
            logger.debug('ContextPreparation | Preparing base context', {
                itemId: itemData.id,
                itemType: itemData.type,
                itemName: itemData.name,
                hasBaseContext: !!baseContext
            });
        }

        // Start with base ApplicationV2 context
        const context: Partial<ItemSheetContext> = {
            ...baseContext,
            item: itemData,
            system: itemData.system || {},
            flags: itemData.flags || {},
            editable: itemData.isEditable ?? true,
            owner: itemData.isOwner ?? true,
            displayTraits: [],
            metaFields: [],
            bodyFields: [],
            enrichedDescription: ''
        };

        // Use pure function to prepare template data
        const templateData = prepareTemplateData(itemData);
        if (templateData) {
            Object.assign(context, templateData);
            if (config.enableDebugLogging) {
                logger.debug('ContextPreparation | Template data merged successfully');
            }
        } else {
            if (config.enableDebugLogging) {
                logger.debug('ContextPreparation | Using fallback basic data structure');
            }
        }

        // Ensure traits array exists
        if (!context.system.traits) {
            context.system.traits = [];
        }

        return { success: true, value: context };

    } catch (error) {
        const errorMessage = `Base context preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error('ContextPreparation | Error preparing base context:', error);
        return { success: false, error: errorMessage };
    }
}

/**
 * PHASE 4 PURE FUNCTION
 * 
 * Prepare type-specific context data
 * 
 * Adds type-specific data like rarity options for augments or tags for traits.
 * 
 * @param context - Base context to enhance
 * @param itemData - Item data for type-specific preparation
 * @param config - Configuration for context preparation
 * @returns Enhanced context with type-specific data
 */
export function prepareTypeSpecificContext(
    context: Partial<ItemSheetContext>,
    itemData: ItemDataForContext,
    config: ContextPreparationConfig = DEFAULT_CONTEXT_CONFIG
): Result<Partial<ItemSheetContext>, string> {
    try {
        const enhancedContext = { ...context };

        // Handle augment-specific data
        if (itemData.type === 'augment') {
            enhancedContext.rarityOptions = generateRarityOptions();
            enhancedContext.augmentTypeOptions = generateAugmentTypeOptions();
        }

        // Handle trait-specific data
        if (itemData.type === 'trait') {
            if (enhancedContext.system.tags) {
                enhancedContext.system.tagsString = Array.isArray(enhancedContext.system.tags)
                    ? enhancedContext.system.tags.join(',')
                    : (enhancedContext.system.tags || '');
            } else {
                enhancedContext.system.tagsString = '';
            }
        }

        if (config.enableDebugLogging) {
            logger.debug('ContextPreparation | Type-specific context prepared', {
                itemType: itemData.type,
                hasRarityOptions: !!enhancedContext.rarityOptions,
                hasAugmentTypeOptions: !!enhancedContext.augmentTypeOptions,
                tagsString: enhancedContext.system.tagsString
            });
        }

        return { success: true, value: enhancedContext };

    } catch (error) {
        const errorMessage = `Type-specific context preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error('ContextPreparation | Error preparing type-specific context:', error);
        return { success: false, error: errorMessage };
    }
}

/**
 * PHASE 4 PURE FUNCTION
 * 
 * Prepare fields for context
 * 
 * Generates meta fields and body fields for the universal architecture.
 * 
 * @param context - Base context to enhance
 * @param itemData - Item data for field preparation
 * @param config - Configuration for context preparation
 * @returns Context with prepared fields
 */
export function prepareContextFields(
    context: Partial<ItemSheetContext>,
    itemData: ItemDataForContext,
    config: ContextPreparationConfig = DEFAULT_CONTEXT_CONFIG
): Result<Partial<ItemSheetContext>, string> {
    try {
        const enhancedContext = { ...context };
        const fallbacksUsed: string[] = [];

        if (config.enableFields) {
            // Prepare metaFields for consistent header layout
            try {
                enhancedContext.metaFields = prepareItemHeaderMetaFields(itemData, enhancedContext.system);
                if (config.enableDebugLogging) {
                    logger.debug('ContextPreparation | MetaFields prepared:', {
                        itemType: itemData.type,
                        fieldCount: enhancedContext.metaFields.length
                    });
                }
            } catch (error) {
                logger.warn('ContextPreparation | Failed to prepare meta fields:', error);
                enhancedContext.metaFields = [];
                fallbacksUsed.push('metaFields');
            }

            // Prepare bodyFields for consistent body layout
            try {
                enhancedContext.bodyFields = prepareItemBodyFields(itemData, enhancedContext.system);
                if (config.enableDebugLogging) {
                    logger.debug('ContextPreparation | BodyFields prepared:', {
                        itemType: itemData.type,
                        fieldCount: enhancedContext.bodyFields.length,
                        fieldTypes: enhancedContext.bodyFields.map((field: any) => field.type)
                    });
                }
            } catch (error) {
                logger.warn('ContextPreparation | Failed to prepare body fields:', error);
                enhancedContext.bodyFields = [];
                fallbacksUsed.push('bodyFields');
            }
        } else {
            enhancedContext.metaFields = [];
            enhancedContext.bodyFields = [];
        }

        return {
            success: true,
            value: enhancedContext
        };

    } catch (error) {
        const errorMessage = `Context fields preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error('ContextPreparation | Error preparing context fields:', error);
        return { success: false, error: errorMessage };
    }
}

/**
 * PHASE 4 PURE FUNCTION
 * 
 * Prepare enriched description
 * 
 * Enriches the description content for display using FoundryVTT's TextEditor.
 * 
 * @param context - Base context to enhance
 * @param config - Configuration for context preparation
 * @returns Context with enriched description
 */
export async function prepareEnrichedDescription(
    context: Partial<ItemSheetContext>,
    config: ContextPreparationConfig = DEFAULT_CONTEXT_CONFIG
): Promise<Result<Partial<ItemSheetContext>, string>> {
    try {
        const enhancedContext = { ...context };

        if (config.enableDescriptionEnrichment && enhancedContext.system.description) {
            try {
                const enrichedDescription = await enrichDescription(enhancedContext.system.description);
                enhancedContext.enrichedDescription = enrichedDescription;
            } catch (error) {
                logger.warn('ContextPreparation | Failed to enrich description:', error);
                enhancedContext.enrichedDescription = enhancedContext.system.description;
            }
        } else {
            enhancedContext.enrichedDescription = enhancedContext.system.description || '';
        }

        return { success: true, value: enhancedContext };

    } catch (error) {
        const errorMessage = `Description enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error('ContextPreparation | Error enriching description:', error);
        return { success: false, error: errorMessage };
    }
}

/**
 * PHASE 4 PURE FUNCTION
 * 
 * Prepare trait display data for context
 * 
 * Integrates trait display data into the context, including the workaround
 * for Handlebars context passing issues.
 * 
 * @param context - Base context to enhance
 * @param displayTraits - Enhanced trait display data
 * @param config - Configuration for context preparation
 * @returns Context with trait display data
 */
export function prepareTraitDisplayContext(
    context: Partial<ItemSheetContext>,
    displayTraits: any[],
    config: ContextPreparationConfig = DEFAULT_CONTEXT_CONFIG
): Result<Partial<ItemSheetContext>, string> {
    try {
        const enhancedContext = { ...context };

        enhancedContext.displayTraits = displayTraits;
        // WORKAROUND: Since Handlebars context passing fails, override system.traits with enhanced data
        if (displayTraits && displayTraits.length > 0) {
            // Store original trait IDs for form submission
            enhancedContext.originalTraits = enhancedContext.system.traits;
            // Replace system.traits with enhanced trait objects for display
            enhancedContext.system.traits = displayTraits;

            if (config.enableDebugLogging) {
                logger.debug('ContextPreparation | Enhanced trait data applied via workaround:', {
                    originalTraits: enhancedContext.originalTraits,
                    enhancedTraits: displayTraits.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        color: t.color,
                        icon: t.icon
                    }))
                });
            }
        }

        return { success: true, value: enhancedContext };

    } catch (error) {
        const errorMessage = `Trait display context preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error('ContextPreparation | Error preparing trait display context:', error);
        return { success: false, error: errorMessage };
    }
}

/**
 * PHASE 4 UTILITY FUNCTION
 * 
 * Generate rarity options for augments
 * 
 * @returns Array of rarity options
 */
export function generateRarityOptions(): any[] {
    return [
        { value: 'common', label: 'Common' },
        { value: 'uncommon', label: 'Uncommon' },
        { value: 'rare', label: 'Rare' },
        { value: 'epic', label: 'Epic' },
        { value: 'legendary', label: 'Legendary' }
    ];
}

/**
 * PHASE 4 UTILITY FUNCTION
 * 
 * Generate augment type options
 * 
 * @returns Array of augment type options
 */
export function generateAugmentTypeOptions(): any[] {
    return [
        { value: 'cybernetic', label: 'Cybernetic' },
        { value: 'bioware', label: 'Bioware' },
        { value: 'nanotech', label: 'Nanotech' },
        { value: 'psionic', label: 'Psionic' }
    ];
}

/**
 * PHASE 4 UTILITY FUNCTION
 * 
 * Enrich description HTML using FoundryVTT's TextEditor
 * 
 * @param description - Raw description text
 * @returns Enriched HTML description
 */
export async function enrichDescription(description: string): Promise<string> {
    try {
        // Use the new namespaced TextEditor for v13 compatibility
        const foundry = (globalThis as any).foundry;
        const TextEditor = foundry?.applications?.ux?.TextEditor?.implementation || (globalThis as any).TextEditor;

        if (TextEditor && TextEditor.enrichHTML) {
            return await TextEditor.enrichHTML(description, { async: true });
        } else {
            return description;
        }
    } catch (error) {
        logger.warn('ContextPreparation | Failed to enrich description:', error);
        return description;
    }
}

/**
 * PHASE 4 ORCHESTRATION FUNCTION
 * 
 * Prepare complete context for item sheet rendering
 * 
 * Orchestrates all context preparation steps into a single operation
 * with comprehensive error handling and fallback mechanisms.
 * 
 * @param itemData - Item data for context preparation
 * @param baseContext - Base context from ApplicationV2
 * @param displayTraits - Enhanced trait display data
 * @param config - Configuration for context preparation
 * @returns Complete context preparation result
 */
export async function prepareCompleteContext(
    itemData: ItemDataForContext,
    baseContext: any,
    displayTraits: any[],
    config: ContextPreparationConfig = DEFAULT_CONTEXT_CONFIG
): Promise<ContextPreparationResult> {
    const startTime = Date.now();
    const fallbacksUsed: string[] = [];

    try {
        // Step 1: Prepare base context
        const baseResult = prepareBaseContext(itemData, baseContext, config);
        if (!baseResult.success) {
            return {
                success: false,
                error: baseResult.error,
                metadata: {
                    processingTimeMs: Date.now() - startTime,
                    traitsProcessed: 0,
                    fieldsGenerated: 0,
                    enrichmentEnabled: config.enableDescriptionEnrichment,
                    fallbacksUsed: ['baseContext']
                }
            };
        }

        let context = baseResult.value!;

        // Step 2: Prepare type-specific context
        const typeResult = prepareTypeSpecificContext(context, itemData, config);
        if (typeResult.success) {
            context = typeResult.value!;
        } else {
            fallbacksUsed.push('typeSpecific');
        }

        // Step 3: Prepare context fields
        const fieldsResult = prepareContextFields(context, itemData, config);
        if (fieldsResult.success) {
            context = fieldsResult.value!;
        } else {
            fallbacksUsed.push('contextFields');
        }

        // Step 4: Prepare enriched description
        const descriptionResult = await prepareEnrichedDescription(context, config);
        if (descriptionResult.success) {
            context = descriptionResult.value!;
        } else {
            fallbacksUsed.push('enrichedDescription');
        }

        // Step 5: Prepare trait display context
        const traitResult = prepareTraitDisplayContext(context, displayTraits, config);
        if (traitResult.success) {
            context = traitResult.value!;
        } else {
            fallbacksUsed.push('traitDisplay');
        }

        const processingTime = Date.now() - startTime;

        if (config.enableDebugLogging) {
            logger.debug('ContextPreparation | Complete context preparation finished:', {
                processingTime,
                traitsProcessed: displayTraits.length,
                fieldsGenerated: (context.metaFields?.length || 0) + (context.bodyFields?.length || 0),
                fallbacksUsed
            });
        }

        return {
            success: true,
            context: context as ItemSheetContext,
            metadata: {
                processingTimeMs: processingTime,
                traitsProcessed: displayTraits.length,
                fieldsGenerated: (context.metaFields?.length || 0) + (context.bodyFields?.length || 0),
                enrichmentEnabled: config.enableDescriptionEnrichment,
                fallbacksUsed
            }
        };

    } catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMessage = `Complete context preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

        logger.error('ContextPreparation | Error in complete context preparation:', error);

        return {
            success: false,
            error: errorMessage,
            metadata: {
                processingTimeMs: processingTime,
                traitsProcessed: 0,
                fieldsGenerated: 0,
                enrichmentEnabled: config.enableDescriptionEnrichment,
                fallbacksUsed: ['completeFailure']
            }
        };
    }
}