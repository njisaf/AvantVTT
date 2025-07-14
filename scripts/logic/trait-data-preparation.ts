/**
 * @fileoverview Trait Data Preparation Logic Module
 * @version 1.0.0
 * @description Pure functions for preparing trait display data with service integration
 * 
 * This module extracts the complex trait data preparation logic from the item sheet
 * into pure functions and service integration utilities that can be tested independently.
 * 
 * DESIGN PRINCIPLES:
 * - Pure functions for data transformation
 * - Service integration with comprehensive error handling
 * - Progressive enhancement with fallback mechanisms
 * - Type-safe interfaces for all trait data
 * - Comprehensive logging for debugging trait issues
 */

import { logger } from '../utils/logger.js';
import { generateFallbackDisplayName, generateFallbackColorScheme } from './trait-display.js';
import type { Result } from '../types/core/result.js';

/**
 * Trait Display Data Structure
 * 
 * Complete display data for a trait including visual and metadata.
 */
export interface TraitDisplayData {
    /** The trait ID */
    id: string;
    /** The display name */
    name: string;
    /** The original trait ID from the item */
    displayId: string;
    /** Background color */
    color: string;
    /** Text color */
    textColor: string;
    /** Icon class or path */
    icon: string;
    /** Description text */
    description: string;
    /** Data source (service, fallback, etc.) */
    source: 'service' | 'fallback' | 'enhanced' | 'cached';
    /** Match type for service lookups */
    matchType?: string;
    /** Whether this is a fallback trait */
    isFallback?: boolean;
}

/**
 * Trait Data Preparation Configuration
 * 
 * Configuration for trait data preparation behavior.
 */
export interface TraitDataPreparationConfig {
    /** Whether to enable service enhancement */
    enableServiceEnhancement: boolean;
    /** Whether to wait for service availability */
    waitForService: boolean;
    /** Timeout for service operations (ms) */
    serviceTimeout: number;
    /** Maximum number of traits to process */
    maxTraits: number;
    /** Whether to enable extensive logging */
    enableDebugLogging: boolean;
    /** Default fallback colors */
    defaultFallbackColor: string;
    /** Default fallback icon */
    defaultFallbackIcon: string;
}

/**
 * Default trait data preparation configuration
 */
export const DEFAULT_TRAIT_DATA_CONFIG: TraitDataPreparationConfig = {
    enableServiceEnhancement: true,
    waitForService: true,
    serviceTimeout: 5000, // Increased from 2000ms to 5000ms for better service availability
    maxTraits: 50,
    enableDebugLogging: true,
    defaultFallbackColor: '#6C757D',
    defaultFallbackIcon: 'fas fa-tag'
};

/**
 * Trait Data Preparation Result
 * 
 * Result of preparing trait display data.
 */
export interface TraitDataPreparationResult {
    /** Whether preparation was successful */
    success: boolean;
    /** The prepared trait display data */
    traits: TraitDisplayData[];
    /** Any error that occurred */
    error?: string;
    /** Metadata about the preparation process */
    metadata: {
        processingTimeMs: number;
        totalTraits: number;
        enhancedTraits: number;
        fallbackTraits: number;
        serviceAvailable: boolean;
        fallbacksUsed: string[];
    };
}

/**
 * Item Context for Trait Preparation
 * 
 * Minimal item context needed for trait preparation.
 */
export interface ItemContextForTraits {
    /** Item ID */
    id?: string;
    /** Item name */
    name?: string;
    /** Item type */
    type?: string;
    /** Trait IDs array */
    traitIds: string[];
}

/**
 * PHASE 4 PURE FUNCTION
 * 
 * Create fallback trait display data
 * 
 * Generates fallback display data for traits when service data is not available.
 * This function never fails and always returns displayable data.
 * 
 * @param traitIds - Array of trait IDs to create fallback data for
 * @param config - Configuration for trait data preparation
 * @returns Array of fallback trait display data
 */
export function createFallbackTraitData(
    traitIds: string[],
    config: TraitDataPreparationConfig = DEFAULT_TRAIT_DATA_CONFIG
): TraitDisplayData[] {
    if (!traitIds || traitIds.length === 0) {
        return [];
    }

    // Limit trait processing to prevent performance issues
    const limitedTraitIds = traitIds.slice(0, config.maxTraits);

    return limitedTraitIds.map((traitId: string) => {
        const traitName = generateFallbackTraitName(traitId);
        const fallbackColor = generateFallbackTraitColor(traitId, traitName, config);

        return {
            id: traitId,
            name: traitName,
            displayId: traitId,
            color: fallbackColor.background,
            textColor: fallbackColor.text,
            icon: fallbackColor.icon,
            description: `Trait: ${traitName}`,
            source: 'fallback',
            isFallback: true
        };
    });
}

/**
 * PHASE 4 PURE FUNCTION
 * 
 * Enhance trait data with service information
 * 
 * Takes fallback trait data and enhances it with information from the trait service.
 * Falls back gracefully if service data is not available.
 * 
 * @param traitIds - Array of trait IDs to enhance
 * @param traitProvider - Trait provider service instance
 * @param fallbackTraits - Fallback trait data to enhance
 * @param config - Configuration for trait data preparation
 * @returns Promise resolving to enhanced trait data
 */
export async function enhanceTraitDataWithService(
    traitIds: string[],
    traitProvider: any,
    fallbackTraits: TraitDisplayData[],
    config: TraitDataPreparationConfig = DEFAULT_TRAIT_DATA_CONFIG
): Promise<TraitDisplayData[]> {
    try {
        if (!traitProvider || !traitIds || traitIds.length === 0) {
            return fallbackTraits;
        }

        // Limit trait processing to prevent performance issues
        const limitedTraitIds = traitIds.slice(0, config.maxTraits);

        const enhancedTraits = await Promise.all(limitedTraitIds.map(async (traitId: string) => {
            try {
                // Use the enhanced findByReference method for flexible trait lookup
                const traitResult = await Promise.race([
                    traitProvider.findByReference(traitId),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Service timeout')), config.serviceTimeout)
                    )
                ]);
                const otherTraitResult = await Promise.race([
                    traitProvider.getTraitById(traitId),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Service timeout')), config.serviceTimeout)
                    )
                ]);
                if (traitResult.success && traitResult.data) {
                    const trait = traitResult.data;
                    const matchType = traitResult.metadata?.matchType || 'unknown';

                    return {
                        id: trait.id,
                        name: trait.name,
                        color: trait.color || '#00E0DC', // Fallback to primary accent
                        textColor: trait.textColor || '#000000', // Explicit text color
                        icon: trait.icon || config.defaultFallbackIcon,
                        description: trait.description || `Trait: ${trait.name}`,
                        displayId: traitId,
                        matchType: matchType,
                        source: 'service' as const,
                        isFallback: false
                    };
                } else {
                    // Only log warning for legitimate trait IDs, not corrupted data
                    if (isLegitimateTraitId(traitId)) {
                        if (config.enableDebugLogging) {
                            logger.warn('TraitDataPreparation | Trait not found in provider:', traitId);
                        }
                    } else {
                        if (config.enableDebugLogging) {
                            logger.debug('TraitDataPreparation | Skipping corrupted trait data:', traitId);
                        }
                    }

                    // Keep fallback for missing traits
                    return fallbackTraits.find((f: any) => f.id === traitId) || createSingleFallbackTrait(traitId, config);
                }
            } catch (error) {
                if (config.enableDebugLogging) {
                    logger.warn('TraitDataPreparation | Error looking up trait:', traitId, error);
                }
                // Return fallback on error
                return fallbackTraits.find((f: any) => f.id === traitId) || createSingleFallbackTrait(traitId, config);
            }
        }));

        return enhancedTraits;

    } catch (error) {
        logger.warn('TraitDataPreparation | Error enhancing trait data with service:', error);
        return fallbackTraits;
    }
}

/**
 * PHASE 4 PURE FUNCTION
 * 
 * Get trait provider service with retry logic
 * 
 * Safely retrieves the trait provider service with error handling, timeouts, and retry logic.
 * 
 * @param config - Configuration for trait data preparation
 * @param maxRetries - Maximum number of retry attempts
 * @returns Promise resolving to trait provider service or null
 */
export async function getTraitProviderService(
    config: TraitDataPreparationConfig = DEFAULT_TRAIT_DATA_CONFIG,
    maxRetries = 3
): Promise<any | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const game = (globalThis as any).game;
            const initManager = game?.avant?.initializationManager;

            if (!initManager) {
                if (config.enableDebugLogging) {
                    logger.warn(`TraitDataPreparation | InitializationManager not available (attempt ${attempt}/${maxRetries})`);
                }

                // If InitializationManager is not available, wait and retry
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, attempt * 500));
                    continue;
                }
                return null;
            }

            if (config.enableDebugLogging) {
                logger.debug(`TraitDataPreparation | Attempting to get TraitProvider service (attempt ${attempt}/${maxRetries})...`);
            }

            if (config.waitForService) {
                // Wait for service to be ready with timeout
                const traitProvider = await Promise.race([
                    initManager.waitForService('traitProvider', config.serviceTimeout),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Service wait timeout')), config.serviceTimeout)
                    )
                ]);

                if (traitProvider) {
                    if (config.enableDebugLogging) {
                        logger.debug(`TraitDataPreparation | TraitProvider service obtained successfully on attempt ${attempt}`);
                    }
                    return traitProvider;
                }
            } else {
                // Try to get service immediately
                const traitProvider = initManager.getService('traitProvider');
                if (traitProvider) {
                    if (config.enableDebugLogging) {
                        logger.debug(`TraitDataPreparation | TraitProvider service obtained immediately on attempt ${attempt}`);
                    }
                    return traitProvider;
                }
            }

        } catch (error) {
            if (config.enableDebugLogging) {
                logger.warn(`TraitDataPreparation | TraitProvider service attempt ${attempt}/${maxRetries} failed:`, error);
            }
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
            const backoffMs = attempt * 1000; // 1s, 2s, 3s delays
            if (config.enableDebugLogging) {
                logger.debug(`TraitDataPreparation | Waiting ${backoffMs}ms before retry...`);
            }
            await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
    }

    if (config.enableDebugLogging) {
        logger.warn(`TraitDataPreparation | TraitProvider service unavailable after ${maxRetries} attempts`);
    }
    return null;
}

/**
 * PHASE 4 PURE FUNCTION
 * 
 * Generate fallback trait name
 * 
 * Generates a user-friendly name from a trait ID using various naming conventions.
 * 
 * @param traitId - The trait ID to generate a name from
 * @returns Generated fallback name
 */
export function generateFallbackTraitName(traitId: string): string {
    // Handle empty or invalid IDs
    if (!traitId || typeof traitId !== 'string') {
        return 'Unknown Trait';
    }

    // Handle corrupted data (JSON strings, arrays, etc.)
    if (traitId.startsWith('[') || traitId.startsWith('{') || traitId.includes('"')) {
        return 'Corrupted Trait';
    }

    // Handle very long IDs (probably UUIDs or keys)
    if (traitId.length > 20) {
        return 'Custom Trait';
    }

    // Use the trait display utility for consistent naming
    return generateFallbackDisplayName(traitId);
}

/**
 * PHASE 4 PURE FUNCTION
 * 
 * Generate fallback trait color
 * 
 * Generates a consistent color scheme for a trait based on its ID and name.
 * 
 * @param traitId - The trait ID
 * @param traitName - The trait name
 * @param config - Configuration for trait data preparation
 * @returns Generated color scheme
 */
export function generateFallbackTraitColor(
    traitId: string,
    traitName: string,
    config: TraitDataPreparationConfig = DEFAULT_TRAIT_DATA_CONFIG
): { background: string; text: string; icon: string } {
    try {
        // Use the trait display utility for consistent color generation
        const colorScheme = generateFallbackColorScheme(traitId, traitName);

        return {
            background: colorScheme.background,
            text: colorScheme.text,
            icon: config.defaultFallbackIcon
        };
    } catch (error) {
        logger.warn('TraitDataPreparation | Error generating fallback color:', error);
        return {
            background: config.defaultFallbackColor,
            text: '#FFFFFF',
            icon: config.defaultFallbackIcon
        };
    }
}

/**
 * PHASE 4 UTILITY FUNCTION
 * 
 * Check if a trait ID is legitimate
 * 
 * Determines if a trait ID is worth processing or if it's corrupted data.
 * 
 * @param traitId - The trait ID to check
 * @returns Whether the trait ID is legitimate
 */
export function isLegitimateTraitId(traitId: string): boolean {
    if (!traitId || typeof traitId !== 'string') {
        return false;
    }

    // Check for corrupted data patterns
    if (traitId.startsWith('[') || traitId.startsWith('{') || traitId.includes('"')) {
        return false;
    }

    // Check for reasonable length
    if (traitId.length > 100) {
        return false;
    }

    return true;
}

/**
 * PHASE 4 UTILITY FUNCTION
 * 
 * Create single fallback trait
 * 
 * Creates a single fallback trait display data entry.
 * 
 * @param traitId - The trait ID
 * @param config - Configuration for trait data preparation
 * @returns Single fallback trait display data
 */
export function createSingleFallbackTrait(
    traitId: string,
    config: TraitDataPreparationConfig = DEFAULT_TRAIT_DATA_CONFIG
): TraitDisplayData {
    const traitName = generateFallbackTraitName(traitId);
    const fallbackColor = generateFallbackTraitColor(traitId, traitName, config);

    return {
        id: traitId,
        name: traitName,
        displayId: traitId,
        color: fallbackColor.background,
        textColor: fallbackColor.text,
        icon: fallbackColor.icon,
        description: `Unknown trait: ${traitId}`,
        source: 'fallback',
        isFallback: true
    };
}

/**
 * PHASE 4 ORCHESTRATION FUNCTION
 * 
 * Prepare complete trait display data
 * 
 * Orchestrates the complete trait data preparation process with progressive enhancement.
 * 
 * @param itemContext - Item context for trait preparation
 * @param config - Configuration for trait data preparation
 * @returns Promise resolving to complete trait data preparation result
 */
export async function prepareTraitDisplayData(
    itemContext: ItemContextForTraits,
    config: TraitDataPreparationConfig = DEFAULT_TRAIT_DATA_CONFIG
): Promise<TraitDataPreparationResult> {
    const startTime = Date.now();
    const fallbacksUsed: string[] = [];
    try {
        const traitIds = itemContext.traitIds || [];

        if (config.enableDebugLogging) {
            logger.debug('TraitDataPreparation | Preparing trait display data', {
                itemName: itemContext.name || 'Unknown',
                itemType: itemContext.type || 'Unknown',
                traitIds,
                traitCount: traitIds.length,
                traitIdTypes: traitIds.map((id: string) => ({ id, type: typeof id, length: id?.length || 0 }))
            });
        }

        // CRITICAL: Always return displayable data, never empty
        if (traitIds.length === 0) {
            if (config.enableDebugLogging) {
                logger.debug('TraitDataPreparation | No traits to display');
            }
            return {
                success: true,
                traits: [],
                metadata: {
                    processingTimeMs: Date.now() - startTime,
                    totalTraits: 0,
                    enhancedTraits: 0,
                    fallbackTraits: 0,
                    serviceAvailable: false,
                    fallbacksUsed: []
                }
            };
        }

        // STEP 1: Create immediate fallback display data (never fails)
        const fallbackTraits = createFallbackTraitData(traitIds, config);

        // STEP 2: Progressive enhancement with service data (if available)
        let finalTraits = fallbackTraits;
        let serviceAvailable = false;

        if (config.enableServiceEnhancement) {
            try {
                const traitProvider = await getTraitProviderService(config);

                if (traitProvider) {
                    serviceAvailable = true;
                    if (config.enableDebugLogging) {
                        logger.debug('TraitDataPreparation | TraitProvider available, enhancing display data');
                    }

                    const enhancedTraits = await enhanceTraitDataWithService(
                        traitIds,
                        traitProvider,
                        fallbackTraits,
                        config
                    );

                    finalTraits = enhancedTraits;
                } else {
                    fallbacksUsed.push('serviceUnavailable');
                }
            } catch (error) {
                if (config.enableDebugLogging) {
                    logger.warn('TraitDataPreparation | Error enhancing trait display data:', error);
                }
                fallbacksUsed.push('serviceError');
            }
        }

        // STEP 3: Calculate metadata
        const processingTime = Date.now() - startTime;
        const enhancedTraits = finalTraits.filter(t => t.source === 'service').length;
        const fallbackTraitCount = finalTraits.filter(t => t.source === 'fallback').length;

        if (config.enableDebugLogging) {
            logger.debug('TraitDataPreparation | Trait display data preparation complete:', {
                processingTime,
                enhancedCount: enhancedTraits,
                fallbackCount: fallbackTraitCount,
                totalCount: finalTraits.length,
                serviceAvailable,
                fallbacksUsed,
                traitDetails: finalTraits.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    source: t.source,
                    matchType: t.matchType,
                    color: t.color
                }))
            });
        }

        return {
            success: true,
            traits: finalTraits,
            metadata: {
                processingTimeMs: processingTime,
                totalTraits: finalTraits.length,
                enhancedTraits,
                fallbackTraits: fallbackTraitCount,
                serviceAvailable,
                fallbacksUsed
            }
        };

    } catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMessage = `Trait display data preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

        logger.error('TraitDataPreparation | Error in trait display data preparation:', error);

        // Return fallback data even on error
        const fallbackTraits = createFallbackTraitData(itemContext.traitIds || [], config);

        return {
            success: false,
            traits: fallbackTraits,
            error: errorMessage,
            metadata: {
                processingTimeMs: processingTime,
                totalTraits: fallbackTraits.length,
                enhancedTraits: 0,
                fallbackTraits: fallbackTraits.length,
                serviceAvailable: false,
                fallbacksUsed: ['completeFailure']
            }
        };
    }
}