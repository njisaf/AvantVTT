/**
 * @fileoverview Trait Input System Utilities - Extracted from trait-utils.ts
 * @deprecated This file contains utility functions for the legacy trait input system
 * that has been deprecated in favor of drag-and-drop functionality.
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since 2025-01-17
 * 
 * DEPRECATION NOTICE:
 * These trait input utilities have been deprecated in favor of native FoundryVTT drag-and-drop.
 * The code is preserved here for potential restoration but should not be used in new development.
 * 
 * RESTORATION INSTRUCTIONS:
 * 1. Copy functions back to trait-utils.ts
 * 2. Update imports in files that use these functions
 * 3. Remove stub functions from trait-utils.ts
 * 4. Update test files to reference original locations
 * 
 * ORIGINAL LOCATION: avantVtt/scripts/logic/trait-utils.ts (lines 50-70, 356-450)
 */

import type { Trait } from '../../../scripts/types/domain/trait.ts';

/**
 * Result of trait operations
 * @deprecated Part of legacy trait input system
 */
export interface TraitOperationResult {
    /** Whether the operation was successful */
    success: boolean;

    /** Updated trait list */
    traits: string[];

    /** Error message if operation failed */
    error?: string;

    /** Whether any changes were made */
    changed: boolean;
}

/**
 * Trait autocomplete suggestion
 * @deprecated Part of legacy trait input system
 */
export interface TraitSuggestion {
    /** Trait ID */
    id: string;

    /** Display name */
    name: string;

    /** Display color */
    color: string;

    /** Display icon */
    icon: string;

    /** Match score (0-1, higher is better) */
    score: number;

    /** Matched text for highlighting */
    matchedText?: string;
}

/**
 * Add a trait to a trait list if it's not already present.
 * @deprecated Part of legacy trait input system - use drag-and-drop instead
 */
export function addTraitToList(currentTraits: string[], traitIdToAdd: string): TraitOperationResult {
    console.warn('addTraitToList is deprecated. Use drag-and-drop instead.');

    try {
        // Validate inputs
        if (!Array.isArray(currentTraits)) {
            return {
                success: false,
                traits: [],
                error: 'Current traits must be an array',
                changed: false
            };
        }

        if (!traitIdToAdd || typeof traitIdToAdd !== 'string') {
            return {
                success: false,
                traits: currentTraits,
                error: 'Trait ID must be a non-empty string',
                changed: false
            };
        }

        // Check if trait is already in the list
        if (currentTraits.includes(traitIdToAdd)) {
            return {
                success: true,
                traits: currentTraits,
                error: undefined,
                changed: false
            };
        }

        // Add the trait to the end of the list
        const updatedTraits = [...currentTraits, traitIdToAdd];

        return {
            success: true,
            traits: updatedTraits,
            error: undefined,
            changed: true
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            traits: currentTraits || [],
            error: `Failed to add trait: ${errorMessage}`,
            changed: false
        };
    }
}

/**
 * Remove a trait from a trait list.
 * @deprecated Part of legacy trait input system - use drag-and-drop instead
 */
export function removeTraitFromList(currentTraits: string[], traitIdToRemove: string): TraitOperationResult {
    console.warn('removeTraitFromList is deprecated. Use drag-and-drop instead.');

    try {
        // Validate inputs
        if (!Array.isArray(currentTraits)) {
            return {
                success: false,
                traits: [],
                error: 'Current traits must be an array',
                changed: false
            };
        }

        if (!traitIdToRemove || typeof traitIdToRemove !== 'string') {
            return {
                success: false,
                traits: currentTraits,
                error: 'Trait ID must be a non-empty string',
                changed: false
            };
        }

        // Check if trait exists in the list
        if (!currentTraits.includes(traitIdToRemove)) {
            return {
                success: true,
                traits: currentTraits,
                error: undefined,
                changed: false
            };
        }

        // Remove the trait from the list
        const updatedTraits = currentTraits.filter(id => id !== traitIdToRemove);

        return {
            success: true,
            traits: updatedTraits,
            error: undefined,
            changed: true
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            traits: currentTraits || [],
            error: `Failed to remove trait: ${errorMessage}`,
            changed: false
        };
    }
}

/**
 * Generate autocomplete suggestions for trait search.
 * @deprecated Part of legacy trait input system - use drag-and-drop instead
 */
export function generateTraitSuggestions(
    traits: Trait[],
    query: string,
    maxSuggestions: number = 10
): TraitSuggestion[] {
    console.warn('generateTraitSuggestions is deprecated. Use drag-and-drop instead.');

    try {
        if (!Array.isArray(traits) || !query || query.trim().length === 0) {
            return [];
        }

        const searchQuery = query.trim().toLowerCase();
        const suggestions: TraitSuggestion[] = [];

        for (const trait of traits) {
            const name = trait.name.toLowerCase();
            const description = (trait.description || '').toLowerCase();

            let score = 0;
            let matchedText = '';

            // Exact name match gets highest score
            if (name === searchQuery) {
                score = 1.0;
                matchedText = trait.name;
            }
            // Name starts with query gets high score
            else if (name.startsWith(searchQuery)) {
                score = 0.8;
                matchedText = trait.name.substring(0, searchQuery.length);
            }
            // Name contains query gets medium score
            else if (name.includes(searchQuery)) {
                score = 0.6;
                const index = name.indexOf(searchQuery);
                matchedText = trait.name.substring(index, index + searchQuery.length);
            }
            // Description contains query gets lower score
            else if (description.includes(searchQuery)) {
                score = 0.3;
                const index = description.indexOf(searchQuery);
                matchedText = description.substring(index, index + searchQuery.length);
            }

            // Add suggestion if it has a score
            if (score > 0) {
                suggestions.push({
                    id: trait.id,
                    name: trait.name,
                    color: trait.color,
                    icon: trait.icon,
                    score,
                    matchedText
                });
            }
        }

        // Sort by score (highest first) and limit results
        return suggestions
            .sort((a, b) => b.score - a.score)
            .slice(0, maxSuggestions);

    } catch (error) {
        console.error('Error generating trait suggestions:', error);
        return [];
    }
}

/**
 * Validate a trait list for an item.
 * @deprecated Part of legacy trait input system - use drag-and-drop instead
 */
export function validateTraitList(
    traitIds: string[],
    availableTraits: Trait[],
    itemType: string = 'item'
): {
    valid: string[];
    invalid: string[];
    warnings: string[];
    allValid: boolean;
} {
    console.warn('validateTraitList is deprecated. Use drag-and-drop instead.');

    try {
        if (!Array.isArray(traitIds)) {
            return { valid: [], invalid: [], warnings: ['Trait IDs must be an array'], allValid: false };
        }

        if (!Array.isArray(availableTraits)) {
            return { valid: [], invalid: traitIds, warnings: ['No available traits provided'], allValid: false };
        }

        const valid: string[] = [];
        const invalid: string[] = [];
        const warnings: string[] = [];

        // Create a map for faster lookup
        const traitMap = new Map(availableTraits.map(trait => [trait.id, trait]));

        for (const traitId of traitIds) {
            if (!traitId || typeof traitId !== 'string') {
                invalid.push(String(traitId));
                warnings.push(`Invalid trait ID: ${traitId}`);
                continue;
            }

            const trait = traitMap.get(traitId);
            if (!trait) {
                invalid.push(traitId);
                warnings.push(`Trait not found: ${traitId}`);
                continue;
            }

            // Check if trait applies to items
            if (!trait.item.system.traitMetadata?.appliesToItems) {
                invalid.push(traitId);
                warnings.push(`Trait '${trait.name}' does not apply to items`);
                continue;
            }

            valid.push(traitId);
        }

        return {
            valid,
            invalid,
            warnings,
            allValid: invalid.length === 0 && warnings.length === 0
        };

    } catch (error) {
        console.error('Error validating trait list:', error);
        return {
            valid: [],
            invalid: traitIds || [],
            warnings: [`Validation error: ${error}`],
            allValid: false
        };
    }
}

export default {
    addTraitToList,
    removeTraitFromList,
    generateTraitSuggestions,
    validateTraitList
}; 