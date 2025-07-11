/**
 * @fileoverview Simple Trait Suggestions Tests for Phase 5
 * @description Tests for the trait suggestions module without complex mocking
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
    calculateTraitMatchScore,
    filterAndScoreTraits,
    isLegitimateTraitId,
    generateFallbackTraitName,
    DEFAULT_TRAIT_SUGGESTION_CONFIG,
    type TraitSuggestionConfig,
    type ItemContextForSuggestions
} from '../../../scripts/logic/trait-suggestions.js';

describe('Trait Suggestions Logic - Phase 5 Tests', () => {
    let mockTraits: any[];
    let mockItemContext: ItemContextForSuggestions;
    let mockConfig: TraitSuggestionConfig;

    beforeEach(() => {
        mockTraits = [
            { id: 'fire', name: 'Fire', description: 'Fire element', category: 'elemental' },
            { id: 'water', name: 'Water', description: 'Water element', category: 'elemental' },
            { id: 'healing', name: 'Healing', description: 'Healing ability', category: 'support' },
            { id: 'strength', name: 'Strength', description: 'Physical strength', category: 'physical' }
        ];

        mockItemContext = {
            id: 'test-item',
            name: 'Test Item',
            type: 'talent',
            existingTraitIds: ['water'] // Water is already assigned
        };

        mockConfig = { ...DEFAULT_TRAIT_SUGGESTION_CONFIG };
    });

    describe('calculateTraitMatchScore', () => {
        it('should return perfect score for exact match', () => {
            const result = calculateTraitMatchScore('Fire', 'Fire', mockConfig);
            
            expect(result.score).toBe(1.0);
            expect(result.type).toBe('exact');
        });

        it('should return high score for prefix match', () => {
            const result = calculateTraitMatchScore('Fi', 'Fire', mockConfig);
            
            expect(result.score).toBe(0.8);
            expect(result.type).toBe('prefix');
        });

        it('should return medium score for contains match', () => {
            const result = calculateTraitMatchScore('ea', 'Healing', mockConfig);
            
            expect(result.score).toBeGreaterThan(0.1);
            expect(result.score).toBeLessThan(0.8);
            expect(result.type).toBe('contains');
        });

        it('should return zero score for no match', () => {
            const result = calculateTraitMatchScore('xyz', 'Fire', mockConfig);
            
            expect(result.score).toBe(0);
        });

        it('should handle case insensitive matching', () => {
            const result = calculateTraitMatchScore('fire', 'Fire', mockConfig);
            
            expect(result.score).toBe(1.0);
            expect(result.type).toBe('exact');
        });
    });

    describe('filterAndScoreTraits', () => {
        it('should filter and score traits correctly', () => {
            const result = filterAndScoreTraits(mockTraits, 'fi', mockItemContext.existingTraitIds, mockConfig);
            
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Fire');
            expect(result[0].isAvailable).toBe(true);
        });

        it('should exclude already assigned traits', () => {
            const result = filterAndScoreTraits(mockTraits, 'water', mockItemContext.existingTraitIds, mockConfig);
            
            // Should return water trait marked as unavailable, plus other fuzzy matches
            expect(result.length).toBeGreaterThan(0);
            
            // Find the water trait specifically
            const waterTrait = result.find(trait => trait.id === 'water');
            expect(waterTrait).toBeDefined();
            expect(waterTrait?.isAvailable).toBe(false);
            
            // Available traits should be sorted first
            const availableTraits = result.filter(t => t.isAvailable);
            const unavailableTraits = result.filter(t => !t.isAvailable);
            
            if (availableTraits.length > 0 && unavailableTraits.length > 0) {
                expect(result.indexOf(availableTraits[0])).toBeLessThan(result.indexOf(unavailableTraits[0]));
            }
        });

        it('should return empty array for short queries', () => {
            const shortQueryConfig = { ...mockConfig, minQueryLength: 3 };
            const result = filterAndScoreTraits(mockTraits, 'fi', mockItemContext.existingTraitIds, shortQueryConfig);
            
            expect(result).toHaveLength(0);
        });

        it('should limit results to maxSuggestions', () => {
            const limitedConfig = { ...mockConfig, maxSuggestions: 2 };
            const result = filterAndScoreTraits(mockTraits, 'e', mockItemContext.existingTraitIds, limitedConfig);
            
            expect(result.length).toBeLessThanOrEqual(2);
        });

        it('should sort by availability and score', () => {
            const result = filterAndScoreTraits(mockTraits, 'e', mockItemContext.existingTraitIds, mockConfig);
            
            // Should get some results since multiple traits contain 'e'
            expect(result.length).toBeGreaterThan(0);
            
            // Available traits should come first
            const availableTraits = result.filter(t => t.isAvailable);
            const unavailableTraits = result.filter(t => !t.isAvailable);
            
            if (availableTraits.length > 0 && unavailableTraits.length > 0) {
                expect(result.indexOf(availableTraits[0])).toBeLessThan(result.indexOf(unavailableTraits[0]));
            }
        });
    });

    describe('isLegitimateTraitId', () => {
        it('should accept valid trait IDs', () => {
            expect(isLegitimateTraitId('fire')).toBe(true);
            expect(isLegitimateTraitId('avant-trait-water')).toBe(true);
            expect(isLegitimateTraitId('custom_trait_123')).toBe(true);
        });

        it('should reject invalid trait IDs', () => {
            expect(isLegitimateTraitId('')).toBe(false);
            expect(isLegitimateTraitId(null as any)).toBe(false);
            expect(isLegitimateTraitId(undefined as any)).toBe(false);
            expect(isLegitimateTraitId('[corrupted]')).toBe(false);
            expect(isLegitimateTraitId('{"invalid": "json"}')).toBe(false);
        });

        it('should reject very long trait IDs', () => {
            const longId = 'a'.repeat(101);
            expect(isLegitimateTraitId(longId)).toBe(false);
        });
    });

    describe('generateFallbackTraitName', () => {
        it('should generate names from camelCase', () => {
            const result = generateFallbackTraitName('fireElement');
            expect(result).toBe('Fire Element');
        });

        it('should generate names from kebab-case', () => {
            const result = generateFallbackTraitName('water-element');
            expect(result).toBe('Water Element');
        });

        it('should generate names from snake_case', () => {
            const result = generateFallbackTraitName('earth_element');
            expect(result).toBe('Earth Element');
        });

        it('should handle single words', () => {
            const result = generateFallbackTraitName('fire');
            expect(result).toBe('Fire');
        });

        it('should handle invalid input', () => {
            expect(generateFallbackTraitName('')).toBe('Unknown Trait');
            expect(generateFallbackTraitName(null as any)).toBe('Unknown Trait');
            expect(generateFallbackTraitName(undefined as any)).toBe('Unknown Trait');
        });

        it('should handle corrupted data', () => {
            expect(generateFallbackTraitName('[corrupted]')).toBe('Corrupted Trait');
            expect(generateFallbackTraitName('{"json": "data"}')).toBe('Corrupted Trait');
        });

        it('should handle very long IDs', () => {
            const longId = 'a'.repeat(25);
            expect(generateFallbackTraitName(longId)).toBe('Custom Trait');
        });
    });

    describe('Configuration', () => {
        it('should have valid default configuration', () => {
            expect(DEFAULT_TRAIT_SUGGESTION_CONFIG).toBeDefined();
            expect(DEFAULT_TRAIT_SUGGESTION_CONFIG.enableService).toBe(true);
            expect(DEFAULT_TRAIT_SUGGESTION_CONFIG.maxSuggestions).toBeGreaterThan(0);
            expect(DEFAULT_TRAIT_SUGGESTION_CONFIG.minQueryLength).toBeGreaterThan(0);
        });

        it('should accept custom configuration', () => {
            const customConfig: TraitSuggestionConfig = {
                enableService: false,
                waitForService: false,
                serviceTimeout: 1000,
                maxSuggestions: 5,
                minQueryLength: 2,
                minMatchScore: 0.2,
                caseSensitive: true,
                enableDebugLogging: false
            };

            const result = filterAndScoreTraits(mockTraits, 'fi', mockItemContext.existingTraitIds, customConfig);
            expect(result.length).toBeLessThanOrEqual(customConfig.maxSuggestions);
        });
    });
});