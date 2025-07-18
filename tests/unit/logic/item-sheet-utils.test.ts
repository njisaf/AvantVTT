/**
 * @fileoverview Unit Tests for Item Sheet Utils - Phase 2 Drag-and-Drop
 * @description Tests for the applyTraitDrop function and other pure functions
 * @version 1.0.0
 * @author Avant VTT Team
 */

import { describe, test, expect } from '@jest/globals';
import { applyTraitDrop } from '../../../scripts/logic/item-sheet-utils.ts';

describe('applyTraitDrop - Phase 2 Drag-and-Drop Functionality', () => {
    // Test data
    const mockItem = {
        id: 'item-1',
        name: 'Test Sword',
        type: 'weapon',
        system: {
            traits: ['fire']
        }
    };

    const mockFireTrait = {
        id: 'fire',
        _id: 'fire',
        name: 'Fire',
        type: 'trait',
        system: {
            color: '#FF6B6B',
            icon: 'fas fa-fire'
        }
    };

    const mockIceTrait = {
        id: 'ice',
        _id: 'ice',
        name: 'Ice',
        type: 'trait',
        system: {
            color: '#4ECDC4',
            icon: 'fas fa-snowflake'
        }
    };

    const mockNonTrait = {
        id: 'talent-1',
        _id: 'talent-1',
        name: 'Fireball',
        type: 'talent',
        system: {
            apCost: 2
        }
    };

    describe('Input Validation', () => {
        test('should reject null or undefined item', async () => {
            const result = await applyTraitDrop(null, mockFireTrait);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid item or trait data');
        });

        test('should reject null or undefined trait', async () => {
            const result = await applyTraitDrop(mockItem, null);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid item or trait data');
        });

        test('should reject non-trait items', async () => {
            const result = await applyTraitDrop(mockItem, mockNonTrait);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot add talent items as traits. Only trait items can be dropped here.');
        });

        test('should reject trait without valid ID', async () => {
            const invalidTrait = {
                name: 'Invalid Trait',
                type: 'trait',
                system: {}
            };
            const result = await applyTraitDrop(mockItem, invalidTrait);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Trait has no valid ID');
        });
    });

    describe('Duplicate Prevention', () => {
        test('should reject duplicate traits', async () => {
            const result = await applyTraitDrop(mockItem, mockFireTrait);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Trait "Fire" is already on this item');
            expect(result.duplicate).toBe(true);
        });

        test('should allow different traits', async () => {
            const result = await applyTraitDrop(mockItem, mockIceTrait);
            expect(result.success).toBe(true);
            expect(result.traits).toEqual(['fire', 'ice']);
        });
    });

    describe('Trait Limits', () => {
        test('should respect custom max trait limits', async () => {
            const fullItem = {
                ...mockItem,
                system: {
                    traits: ['fire', 'ice']
                }
            };

            const result = await applyTraitDrop(fullItem, mockFireTrait, { maxTraits: 2 });
            expect(result.success).toBe(false);
            expect(result.error).toBe('Maximum of 2 traits allowed per item');
            expect(result.limitReached).toBe(true);
        });

        test('should use default limit of 10', async () => {
            const itemWithManyTraits = {
                ...mockItem,
                system: {
                    traits: ['trait1', 'trait2', 'trait3', 'trait4', 'trait5', 'trait6', 'trait7', 'trait8', 'trait9', 'trait10']
                }
            };

            const result = await applyTraitDrop(itemWithManyTraits, mockIceTrait);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Maximum of 10 traits allowed per item');
            expect(result.limitReached).toBe(true);
        });

        test('should allow adding traits below limit', async () => {
            const itemWithFewTraits = {
                ...mockItem,
                system: {
                    traits: ['fire', 'ice']
                }
            };

            const newTrait = {
                id: 'lightning',
                name: 'Lightning',
                type: 'trait'
            };

            const result = await applyTraitDrop(itemWithFewTraits, newTrait, { maxTraits: 5 });
            expect(result.success).toBe(true);
            expect(result.traits).toEqual(['fire', 'ice', 'lightning']);
        });
    });

    describe('Success Cases', () => {
        test('should successfully add trait to item with no existing traits', async () => {
            const emptyItem = {
                id: 'item-2',
                name: 'Plain Sword',
                type: 'weapon',
                system: {}
            };

            const result = await applyTraitDrop(emptyItem, mockFireTrait);
            expect(result.success).toBe(true);
            expect(result.traits).toEqual(['fire']);
        });

        test('should successfully add trait to item with empty traits array', async () => {
            const emptyTraitsItem = {
                id: 'item-3',
                name: 'Another Sword',
                type: 'weapon',
                system: {
                    traits: []
                }
            };

            const result = await applyTraitDrop(emptyTraitsItem, mockFireTrait);
            expect(result.success).toBe(true);
            expect(result.traits).toEqual(['fire']);
        });

        test('should preserve existing traits when adding new one', async () => {
            const result = await applyTraitDrop(mockItem, mockIceTrait);
            expect(result.success).toBe(true);
            expect(result.traits).toEqual(['fire', 'ice']);
        });

        test('should handle trait with _id instead of id', async () => {
            const traitWithUnderscore = {
                _id: 'lightning',
                name: 'Lightning',
                type: 'trait'
            };

            const result = await applyTraitDrop(mockItem, traitWithUnderscore);
            expect(result.success).toBe(true);
            expect(result.traits).toEqual(['fire', 'lightning']);
        });
    });

    describe('Edge Cases', () => {
        test('should handle item with undefined system', async () => {
            const itemWithoutSystem = {
                id: 'item-4',
                name: 'Broken Item',
                type: 'weapon'
            };

            const result = await applyTraitDrop(itemWithoutSystem, mockFireTrait);
            expect(result.success).toBe(true);
            expect(result.traits).toEqual(['fire']);
        });

        test('should handle trait with both id and _id preferring id', async () => {
            const traitWithBoth = {
                id: 'primary-id',
                _id: 'secondary-id',
                name: 'Test Trait',
                type: 'trait'
            };

            const result = await applyTraitDrop({ ...mockItem, system: { traits: [] } }, traitWithBoth);
            expect(result.success).toBe(true);
            expect(result.traits).toEqual(['primary-id']);
        });

        test('should work with zero max traits limit', async () => {
            const result = await applyTraitDrop(mockItem, mockIceTrait, { maxTraits: 0 });
            expect(result.success).toBe(false);
            expect(result.limitReached).toBe(true);
        });

        test('should work with very high max traits limit', async () => {
            const result = await applyTraitDrop(mockItem, mockIceTrait, { maxTraits: 1000 });
            expect(result.success).toBe(true);
            expect(result.traits).toEqual(['fire', 'ice']);
        });
    });

    describe('Return Value Structure', () => {
        test('successful result should have correct structure', async () => {
            const result = await applyTraitDrop(mockItem, mockIceTrait);

            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('traits');
            expect(result).not.toHaveProperty('error');
            expect(result).not.toHaveProperty('duplicate');
            expect(result).not.toHaveProperty('limitReached');
        });

        test('duplicate error should have correct structure', async () => {
            const result = await applyTraitDrop(mockItem, mockFireTrait);

            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('error');
            expect(result).toHaveProperty('duplicate');
            expect(result).not.toHaveProperty('traits');
            expect(result).not.toHaveProperty('limitReached');
        });

        test('limit error should have correct structure', async () => {
            const result = await applyTraitDrop(mockItem, mockIceTrait, { maxTraits: 1 });

            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('error');
            expect(result).toHaveProperty('limitReached');
            expect(result).not.toHaveProperty('traits');
            expect(result).not.toHaveProperty('duplicate');
        });

        test('validation error should have correct structure', async () => {
            const result = await applyTraitDrop(null, mockFireTrait);

            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('error');
            expect(result).not.toHaveProperty('traits');
            expect(result).not.toHaveProperty('duplicate');
            expect(result).not.toHaveProperty('limitReached');
        });
    });
});

describe('Branch Coverage Tests', () => {
    test('should ensure all code paths are covered', async () => {
        const mockItem = {
            id: 'coverage-item',
            system: { traits: [] }
        };

        const mockTrait = {
            id: 'coverage-trait',
            name: 'Coverage Trait',
            type: 'trait'
        };

        // Test the happy path one more time for coverage
        const result = await applyTraitDrop(mockItem, mockTrait);
        expect(result.success).toBe(true);
        expect(result.traits).toEqual(['coverage-trait']);
    });
}); 