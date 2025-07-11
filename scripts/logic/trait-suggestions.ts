/**
 * @fileoverview Trait Suggestions Logic Module
 * @version 1.0.0
 * @description Pure functions for trait suggestion processing and filtering
 * 
 * This module extracts the trait suggestion logic from the item sheet into
 * pure functions that can be tested and maintained independently.
 * 
 * DESIGN PRINCIPLES:
 * - Pure functions for data processing
 * - Service integration with comprehensive error handling
 * - Flexible filtering and matching strategies
 * - Type-safe interfaces for all suggestion data
 * - Comprehensive logging for debugging suggestion issues
 */

import { logger } from '../utils/logger.js';
import type { Result } from '../types/core/result.js';

/**
 * Trait Suggestion Data Structure
 * 
 * Complete data for a trait suggestion including match metadata.
 */
export interface TraitSuggestionData {
    /** The trait ID */
    id: string;
    /** The trait name */
    name: string;
    /** The trait description */
    description?: string;
    /** Background color */
    color?: string;
    /** Text color */
    textColor?: string;
    /** Icon class or path */
    icon?: string;
    /** Match score (0-1) */
    matchScore: number;
    /** Match type (exact, prefix, contains, fuzzy) */
    matchType: 'exact' | 'prefix' | 'contains' | 'fuzzy';
    /** Whether this trait is available (not already assigned) */
    isAvailable: boolean;
    /** Category for grouping */
    category?: string;
}

/**
 * Trait Suggestion Configuration
 * 
 * Configuration for trait suggestion behavior.
 */
export interface TraitSuggestionConfig {
    /** Whether to enable service integration */
    enableService: boolean;
    /** Whether to wait for service availability */
    waitForService: boolean;
    /** Timeout for service operations (ms) */
    serviceTimeout: number;
    /** Maximum number of suggestions to return */
    maxSuggestions: number;
    /** Minimum query length to trigger suggestions */
    minQueryLength: number;
    /** Minimum match score to include suggestion */
    minMatchScore: number;
    /** Whether to enable case-sensitive matching */
    caseSensitive: boolean;
    /** Whether to enable extensive logging */
    enableDebugLogging: boolean;
}

/**
 * Default trait suggestion configuration
 */
export const DEFAULT_TRAIT_SUGGESTION_CONFIG: TraitSuggestionConfig = {
    enableService: true,
    waitForService: true,
    serviceTimeout: 2000,
    maxSuggestions: 10,
    minQueryLength: 1,
    minMatchScore: 0.1,
    caseSensitive: false,
    enableDebugLogging: true
};

/**
 * Trait Suggestion Result
 * 
 * Result of generating trait suggestions.
 */
export interface TraitSuggestionResult {
    /** Whether suggestion generation was successful */
    success: boolean;
    /** The generated suggestions */
    suggestions: TraitSuggestionData[];
    /** Any error that occurred */
    error?: string;
    /** Metadata about the suggestion process */
    metadata: {
        processingTimeMs: number;
        totalTraitsProcessed: number;
        availableTraits: number;
        filteredTraits: number;
        serviceAvailable: boolean;
        queryLength: number;
        fallbacksUsed: string[];
    };
}

/**
 * Item Context for Suggestions
 * 
 * Context about the item requesting suggestions.
 */
export interface ItemContextForSuggestions {
    /** Item ID */
    id: string;
    /** Item name */
    name: string;
    /** Item type */
    type: string;
    /** Existing trait IDs */
    existingTraitIds: string[];
}

/**
 * PHASE 4 PURE FUNCTION
 * 
 * Calculate match score for trait suggestion
 * 
 * Calculates how well a trait matches the search query using various strategies.
 * 
 * @param query - The search query
 * @param traitName - The trait name to match against
 * @param config - Configuration for matching
 * @returns Match score and type
 */
export function calculateTraitMatchScore(
    query: string,
    traitName: string,
    config: TraitSuggestionConfig = DEFAULT_TRAIT_SUGGESTION_CONFIG
): { score: number; type: TraitSuggestionData['matchType'] } {
    if (!query || !traitName) {
        return { score: 0, type: 'fuzzy' };
    }

    const normalizedQuery = config.caseSensitive ? query : query.toLowerCase();
    const normalizedName = config.caseSensitive ? traitName : traitName.toLowerCase();

    // Exact match - highest score
    if (normalizedName === normalizedQuery) {
        return { score: 1.0, type: 'exact' };
    }

    // Prefix match - high score
    if (normalizedName.startsWith(normalizedQuery)) {
        return { score: 0.8, type: 'prefix' };
    }

    // Contains match - medium score
    if (normalizedName.includes(normalizedQuery)) {
        const position = normalizedName.indexOf(normalizedQuery);
        const positionScore = 1 - (position / normalizedName.length);
        return { score: 0.6 * positionScore, type: 'contains' };
    }

    // Fuzzy match - calculate based on common characters
    const commonChars = calculateCommonCharacters(normalizedQuery, normalizedName);
    const fuzzyScore = commonChars / Math.max(normalizedQuery.length, normalizedName.length);
    
    if (fuzzyScore >= config.minMatchScore) {
        return { score: fuzzyScore * 0.4, type: 'fuzzy' };
    }

    return { score: 0, type: 'fuzzy' };
}

/**
 * PHASE 4 PURE FUNCTION
 * 
 * Filter and score traits for suggestions
 * 
 * Filters traits based on query and existing traits, then scores them for relevance.
 * 
 * @param allTraits - Array of all available traits
 * @param query - Search query
 * @param existingTraitIds - IDs of traits already assigned to the item
 * @param config - Configuration for filtering
 * @returns Array of filtered and scored suggestions
 */
export function filterAndScoreTraits(
    allTraits: any[],
    query: string,
    existingTraitIds: string[],
    config: TraitSuggestionConfig = DEFAULT_TRAIT_SUGGESTION_CONFIG
): TraitSuggestionData[] {
    if (!allTraits || allTraits.length === 0) {
        return [];
    }

    if (!query || query.length < config.minQueryLength) {
        return [];
    }

    const suggestions: TraitSuggestionData[] = [];

    for (const trait of allTraits) {
        // Skip traits without names
        if (!trait?.name) {
            continue;
        }

        // Check if trait is already assigned
        const isAvailable = !existingTraitIds.includes(trait.id);

        // Calculate match score
        const matchResult = calculateTraitMatchScore(query, trait.name, config);

        // Skip if score is too low
        if (matchResult.score < config.minMatchScore) {
            continue;
        }

        // Create suggestion data
        const suggestion: TraitSuggestionData = {
            id: trait.id,
            name: trait.name,
            description: trait.description,
            color: trait.color,
            textColor: trait.textColor,
            icon: trait.icon,
            matchScore: matchResult.score,
            matchType: matchResult.type,
            isAvailable,
            category: trait.category
        };

        suggestions.push(suggestion);
    }

    // Sort by match score (descending) and availability (available first)
    suggestions.sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) {
            return a.isAvailable ? -1 : 1;
        }
        return b.matchScore - a.matchScore;
    });

    // Limit number of suggestions
    return suggestions.slice(0, config.maxSuggestions);
}

/**
 * PHASE 4 PURE FUNCTION
 * 
 * Get trait provider service
 * 
 * Safely retrieves the trait provider service for suggestions.
 * 
 * @param config - Configuration for service access
 * @returns Promise resolving to trait provider service or null
 */
export async function getTraitProviderForSuggestions(
    config: TraitSuggestionConfig = DEFAULT_TRAIT_SUGGESTION_CONFIG
): Promise<any | null> {
    try {
        const game = (globalThis as any).game;
        const initManager = game?.avant?.initializationManager;

        if (!initManager) {
            if (config.enableDebugLogging) {
                logger.warn('TraitSuggestions | InitializationManager not available for trait suggestions');
            }
            return null;
        }

        if (config.enableDebugLogging) {
            logger.debug('TraitSuggestions | Attempting to get TraitProvider service...');
        }

        if (config.waitForService) {
            // Wait for service to be ready with timeout
            const traitProvider = await Promise.race([
                initManager.waitForService('traitProvider', config.serviceTimeout),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Service wait timeout')), config.serviceTimeout)
                )
            ]);

            return traitProvider;
        } else {
            // Try to get service immediately
            const traitProvider = initManager.getService('traitProvider');
            return traitProvider;
        }

    } catch (error) {
        if (config.enableDebugLogging) {
            logger.warn('TraitSuggestions | TraitProvider service not ready or failed:', error);
        }
        return null;
    }
}

/**
 * PHASE 4 PURE FUNCTION
 * 
 * Load all traits from service
 * 
 * Loads all available traits from the trait provider service.
 * 
 * @param traitProvider - Trait provider service instance
 * @param config - Configuration for trait loading
 * @returns Promise resolving to array of traits or null on failure
 */
export async function loadAllTraitsFromService(
    traitProvider: any,
    config: TraitSuggestionConfig = DEFAULT_TRAIT_SUGGESTION_CONFIG
): Promise<any[] | null> {
    try {
        if (!traitProvider) {
            return null;
        }

        // Load all traits from the service
        const allTraitsResult = await Promise.race([
            traitProvider.getAll(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Service timeout')), config.serviceTimeout)
            )
        ]);

        if (!allTraitsResult.success || !allTraitsResult.data) {
            if (config.enableDebugLogging) {
                logger.warn('TraitSuggestions | Failed to load traits from provider:', allTraitsResult.error);
            }
            return null;
        }

        return allTraitsResult.data;

    } catch (error) {
        if (config.enableDebugLogging) {
            logger.warn('TraitSuggestions | Error loading traits from service:', error);
        }
        return null;
    }
}

/**
 * PHASE 4 UTILITY FUNCTION
 * 
 * Calculate common characters between two strings
 * 
 * Counts the number of common characters between two strings for fuzzy matching.
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Number of common characters
 */
export function calculateCommonCharacters(str1: string, str2: string): number {
    if (!str1 || !str2) {
        return 0;
    }

    const chars1 = str1.split('').reduce((acc, char) => {
        acc[char] = (acc[char] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const chars2 = str2.split('').reduce((acc, char) => {
        acc[char] = (acc[char] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    let commonCount = 0;
    for (const char in chars1) {
        if (chars2[char]) {
            commonCount += Math.min(chars1[char], chars2[char]);
        }
    }

    return commonCount;
}

/**
 * PHASE 4 UTILITY FUNCTION
 * 
 * Group suggestions by category
 * 
 * Groups trait suggestions by their category for organized display.
 * 
 * @param suggestions - Array of trait suggestions
 * @returns Grouped suggestions by category
 */
export function groupSuggestionsByCategory(
    suggestions: TraitSuggestionData[]
): Record<string, TraitSuggestionData[]> {
    const grouped: Record<string, TraitSuggestionData[]> = {};

    for (const suggestion of suggestions) {
        const category = suggestion.category || 'Other';
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(suggestion);
    }

    return grouped;
}

/**
 * PHASE 4 UTILITY FUNCTION
 * 
 * Check if trait ID is legitimate
 * 
 * Validates trait IDs to ensure they are legitimate and not corrupted.
 * 
 * @param traitId - Trait ID to validate
 * @returns True if trait ID is legitimate
 */
export function isLegitimateTraitId(traitId: any): boolean {
    // Check basic type and existence
    if (typeof traitId !== 'string' || !traitId) {
        return false;
    }

    // Check for obvious corruption patterns
    if (traitId.startsWith('[') || traitId.startsWith('{') || traitId.includes('"')) {
        return false;
    }

    // Check reasonable length
    if (traitId.length > 100) {
        return false;
    }

    return true;
}

/**
 * PHASE 4 UTILITY FUNCTION
 * 
 * Generate fallback trait name from ID
 * 
 * Generates a human-readable trait name from a trait ID when the actual name is not available.
 * 
 * @param traitId - Trait ID to generate name from
 * @returns Generated trait name
 */
export function generateFallbackTraitName(traitId: any): string {
    // Handle invalid input
    if (!traitId || typeof traitId !== 'string') {
        return 'Unknown Trait';
    }

    // Handle corrupted data
    if (traitId.startsWith('[') || traitId.startsWith('{') || traitId.includes('"')) {
        return 'Corrupted Trait';
    }

    // Handle very long IDs
    if (traitId.length > 20) {
        return 'Custom Trait';
    }

    // Convert various naming conventions to readable names
    let name = traitId;

    // Handle kebab-case
    if (name.includes('-')) {
        name = name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }
    // Handle snake_case
    else if (name.includes('_')) {
        name = name.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }
    // Handle camelCase
    else if (/[a-z][A-Z]/.test(name)) {
        name = name.replace(/([a-z])([A-Z])/g, '$1 $2');
        name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    // Handle single word
    else {
        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }

    return name;
}

/**
 * PHASE 4 ORCHESTRATION FUNCTION
 * 
 * Generate trait suggestions for query
 * 
 * Orchestrates the complete trait suggestion process including service integration,
 * filtering, scoring, and result preparation.
 * 
 * @param query - Search query
 * @param itemContext - Context about the item requesting suggestions
 * @param config - Configuration for suggestion generation
 * @returns Promise resolving to trait suggestion result
 */
export async function generateTraitSuggestions(
    query: string,
    itemContext: ItemContextForSuggestions,
    config: TraitSuggestionConfig = DEFAULT_TRAIT_SUGGESTION_CONFIG
): Promise<TraitSuggestionResult> {
    const startTime = Date.now();
    const fallbacksUsed: string[] = [];

    try {
        if (config.enableDebugLogging) {
            logger.debug('TraitSuggestions | Generating trait suggestions', {
                query,
                queryLength: query.length,
                itemName: itemContext.name,
                itemType: itemContext.type,
                existingTraitCount: itemContext.existingTraitIds.length
            });
        }

        // Validate query
        if (!query || query.length < config.minQueryLength) {
            return {
                success: true,
                suggestions: [],
                metadata: {
                    processingTimeMs: Date.now() - startTime,
                    totalTraitsProcessed: 0,
                    availableTraits: 0,
                    filteredTraits: 0,
                    serviceAvailable: false,
                    queryLength: query.length,
                    fallbacksUsed: ['queryTooShort']
                }
            };
        }

        let allTraits: any[] = [];
        let serviceAvailable = false;

        // Try to get traits from service
        if (config.enableService) {
            try {
                const traitProvider = await getTraitProviderForSuggestions(config);
                if (traitProvider) {
                    const traitsFromService = await loadAllTraitsFromService(traitProvider, config);
                    if (traitsFromService) {
                        allTraits = traitsFromService;
                        serviceAvailable = true;
                    } else {
                        fallbacksUsed.push('serviceDataFailed');
                    }
                } else {
                    fallbacksUsed.push('serviceUnavailable');
                }
            } catch (error) {
                if (config.enableDebugLogging) {
                    logger.warn('TraitSuggestions | Error accessing trait service:', error);
                }
                fallbacksUsed.push('serviceError');
            }
        }

        // Filter and score traits
        const suggestions = filterAndScoreTraits(
            allTraits,
            query,
            itemContext.existingTraitIds,
            config
        );

        const processingTime = Date.now() - startTime;
        const availableTraits = suggestions.filter(s => s.isAvailable).length;

        if (config.enableDebugLogging) {
            logger.debug('TraitSuggestions | Trait suggestions generated:', {
                processingTime,
                totalTraitsProcessed: allTraits.length,
                availableTraits,
                filteredTraits: suggestions.length,
                serviceAvailable,
                fallbacksUsed,
                topSuggestions: suggestions.slice(0, 3).map(s => ({
                    name: s.name,
                    score: s.matchScore,
                    type: s.matchType,
                    available: s.isAvailable
                }))
            });
        }

        return {
            success: true,
            suggestions,
            metadata: {
                processingTimeMs: processingTime,
                totalTraitsProcessed: allTraits.length,
                availableTraits,
                filteredTraits: suggestions.length,
                serviceAvailable,
                queryLength: query.length,
                fallbacksUsed
            }
        };

    } catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMessage = `Trait suggestions generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

        logger.error('TraitSuggestions | Error generating trait suggestions:', error);

        return {
            success: false,
            suggestions: [],
            error: errorMessage,
            metadata: {
                processingTimeMs: processingTime,
                totalTraitsProcessed: 0,
                availableTraits: 0,
                filteredTraits: 0,
                serviceAvailable: false,
                queryLength: query.length,
                fallbacksUsed: ['completeFailure']
            }
        };
    }
}