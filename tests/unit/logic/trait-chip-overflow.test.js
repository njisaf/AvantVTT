/**
 * @fileoverview Trait Chip Overflow Logic Unit Tests
 * @description Tests for the "+N" overflow indicator functionality in trait chip display
 * @version 1.0.0 - FoundryVTT v13 Compatible
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

describe('Trait Chip Overflow Logic', () => {
  let traitChipUtils;

  beforeEach(() => {
    // Mock trait chip utility functions
    traitChipUtils = {
      /**
       * Calculate trait display information including overflow
       * @param {Array} traits - Array of trait objects
       * @param {number} maxDisplay - Maximum number of traits to display (default: 4)
       * @returns {Object} Display information with visible traits and overflow count
       */
      calculateTraitDisplay: (traits, maxDisplay = 4) => {
        if (!Array.isArray(traits)) {
          return { visibleTraits: [], overflowCount: 0, hasOverflow: false };
        }

        const visibleTraits = traits.slice(0, maxDisplay);
        const overflowCount = Math.max(0, traits.length - maxDisplay);
        const hasOverflow = overflowCount > 0;

        return {
          visibleTraits,
          overflowCount,
          hasOverflow,
          totalTraits: traits.length
        };
      },

      /**
       * Generate trait chip HTML classes
       * @param {Array} traits - Array of trait objects
       * @returns {string} CSS classes for trait container
       */
      getTraitContainerClasses: (traits) => {
        const baseClasses = ['trait-chips'];
        if (traits && traits.length > 4) {
          baseClasses.push('has-overflow');
        }
        return baseClasses.join(' ');
      },

      /**
       * Format overflow text
       * @param {number} overflowCount - Number of hidden traits
       * @returns {string} Formatted overflow text
       */
      formatOverflowText: (overflowCount) => {
        if (overflowCount <= 0) return '';
        return `+${overflowCount}`;
      }
    };
  });

  describe('Trait Display Calculation', () => {
    test('should handle empty trait array', () => {
      // Arrange
      const traits = [];

      // Act
      const result = traitChipUtils.calculateTraitDisplay(traits);

      // Assert
      expect(result.visibleTraits).toEqual([]);
      expect(result.overflowCount).toBe(0);
      expect(result.hasOverflow).toBe(false);
      expect(result.totalTraits).toBe(0);
    });

    test('should handle null/undefined traits', () => {
      // Arrange & Act
      const nullResult = traitChipUtils.calculateTraitDisplay(null);
      const undefinedResult = traitChipUtils.calculateTraitDisplay(undefined);

      // Assert
      expect(nullResult.visibleTraits).toEqual([]);
      expect(nullResult.overflowCount).toBe(0);
      expect(nullResult.hasOverflow).toBe(false);

      expect(undefinedResult.visibleTraits).toEqual([]);
      expect(undefinedResult.overflowCount).toBe(0);
      expect(undefinedResult.hasOverflow).toBe(false);
    });

    test('should display all traits when count is 4 or less', () => {
      // Arrange
      const traits = [
        { id: 'fire', name: 'Fire' },
        { id: 'ice', name: 'Ice' },
        { id: 'lightning', name: 'Lightning' },
        { id: 'earth', name: 'Earth' }
      ];

      // Act
      const result = traitChipUtils.calculateTraitDisplay(traits);

      // Assert
      expect(result.visibleTraits).toHaveLength(4);
      expect(result.overflowCount).toBe(0);
      expect(result.hasOverflow).toBe(false);
      expect(result.totalTraits).toBe(4);
    });

    test('should show overflow when trait count exceeds 4', () => {
      // Arrange
      const traits = [
        { id: 'fire', name: 'Fire' },
        { id: 'ice', name: 'Ice' },
        { id: 'lightning', name: 'Lightning' },
        { id: 'earth', name: 'Earth' },
        { id: 'wind', name: 'Wind' },
        { id: 'water', name: 'Water' }
      ];

      // Act
      const result = traitChipUtils.calculateTraitDisplay(traits);

      // Assert
      expect(result.visibleTraits).toHaveLength(4);
      expect(result.overflowCount).toBe(2);
      expect(result.hasOverflow).toBe(true);
      expect(result.totalTraits).toBe(6);
      expect(result.visibleTraits[0].id).toBe('fire');
      expect(result.visibleTraits[3].id).toBe('earth');
    });

    test('should respect custom maxDisplay parameter', () => {
      // Arrange
      const traits = [
        { id: 'fire', name: 'Fire' },
        { id: 'ice', name: 'Ice' },
        { id: 'lightning', name: 'Lightning' }
      ];

      // Act
      const result = traitChipUtils.calculateTraitDisplay(traits, 2);

      // Assert
      expect(result.visibleTraits).toHaveLength(2);
      expect(result.overflowCount).toBe(1);
      expect(result.hasOverflow).toBe(true);
      expect(result.totalTraits).toBe(3);
    });

    test('should handle single trait correctly', () => {
      // Arrange
      const traits = [{ id: 'fire', name: 'Fire' }];

      // Act
      const result = traitChipUtils.calculateTraitDisplay(traits);

      // Assert
      expect(result.visibleTraits).toHaveLength(1);
      expect(result.overflowCount).toBe(0);
      expect(result.hasOverflow).toBe(false);
      expect(result.totalTraits).toBe(1);
    });
  });

  describe('CSS Classes Generation', () => {
    test('should return base classes for no traits', () => {
      // Arrange
      const traits = [];

      // Act
      const classes = traitChipUtils.getTraitContainerClasses(traits);

      // Assert
      expect(classes).toBe('trait-chips');
    });

    test('should return base classes for 4 or fewer traits', () => {
      // Arrange
      const traits = [
        { id: 'fire', name: 'Fire' },
        { id: 'ice', name: 'Ice' },
        { id: 'lightning', name: 'Lightning' },
        { id: 'earth', name: 'Earth' }
      ];

      // Act
      const classes = traitChipUtils.getTraitContainerClasses(traits);

      // Assert
      expect(classes).toBe('trait-chips');
    });

    test('should add overflow class for more than 4 traits', () => {
      // Arrange
      const traits = [
        { id: 'fire', name: 'Fire' },
        { id: 'ice', name: 'Ice' },
        { id: 'lightning', name: 'Lightning' },
        { id: 'earth', name: 'Earth' },
        { id: 'wind', name: 'Wind' }
      ];

      // Act
      const classes = traitChipUtils.getTraitContainerClasses(traits);

      // Assert
      expect(classes).toBe('trait-chips has-overflow');
    });

    test('should handle null/undefined traits gracefully', () => {
      // Act & Assert
      expect(traitChipUtils.getTraitContainerClasses(null)).toBe('trait-chips');
      expect(traitChipUtils.getTraitContainerClasses(undefined)).toBe('trait-chips');
    });
  });

  describe('Overflow Text Formatting', () => {
    test('should return empty string for zero overflow', () => {
      // Act
      const text = traitChipUtils.formatOverflowText(0);

      // Assert
      expect(text).toBe('');
    });

    test('should return empty string for negative overflow', () => {
      // Act
      const text = traitChipUtils.formatOverflowText(-1);

      // Assert
      expect(text).toBe('');
    });

    test('should format single overflow correctly', () => {
      // Act
      const text = traitChipUtils.formatOverflowText(1);

      // Assert
      expect(text).toBe('+1');
    });

    test('should format multiple overflow correctly', () => {
      // Act
      const text = traitChipUtils.formatOverflowText(5);

      // Assert
      expect(text).toBe('+5');
    });

    test('should handle large overflow numbers', () => {
      // Act
      const text = traitChipUtils.formatOverflowText(99);

      // Assert
      expect(text).toBe('+99');
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle realistic talent with many traits', () => {
      // Arrange - Simulate a talent with many traits
      const talents = [
        {
          name: 'Master Fire Spell',
          traits: [
            { id: 'fire', name: 'Fire', color: '#FF4444' },
            { id: 'damage', name: 'Damage', color: '#AA0000' },
            { id: 'area', name: 'Area Effect', color: '#FFAA00' },
            { id: 'magic', name: 'Magic', color: '#8A2BE2' },
            { id: 'offensive', name: 'Offensive', color: '#DC143C' },
            { id: 'legendary', name: 'Legendary', color: '#FFD700' }
          ]
        }
      ];

      // Act
      const displayInfo = traitChipUtils.calculateTraitDisplay(talents[0].traits);
      const containerClasses = traitChipUtils.getTraitContainerClasses(talents[0].traits);
      const overflowText = traitChipUtils.formatOverflowText(displayInfo.overflowCount);

      // Assert
      expect(displayInfo.visibleTraits).toHaveLength(4);
      expect(displayInfo.overflowCount).toBe(2);
      expect(displayInfo.hasOverflow).toBe(true);
      expect(containerClasses).toBe('trait-chips has-overflow');
      expect(overflowText).toBe('+2');
    });

    test('should handle edge case of exactly 5 traits', () => {
      // Arrange
      const traits = [
        { id: 'trait1', name: 'Trait 1' },
        { id: 'trait2', name: 'Trait 2' },
        { id: 'trait3', name: 'Trait 3' },
        { id: 'trait4', name: 'Trait 4' },
        { id: 'trait5', name: 'Trait 5' }
      ];

      // Act
      const displayInfo = traitChipUtils.calculateTraitDisplay(traits);
      const overflowText = traitChipUtils.formatOverflowText(displayInfo.overflowCount);

      // Assert
      expect(displayInfo.visibleTraits).toHaveLength(4);
      expect(displayInfo.overflowCount).toBe(1);
      expect(displayInfo.hasOverflow).toBe(true);
      expect(overflowText).toBe('+1');
    });

    test('should preserve trait order in visible traits', () => {
      // Arrange
      const traits = [
        { id: 'first', name: 'First', priority: 1 },
        { id: 'second', name: 'Second', priority: 2 },
        { id: 'third', name: 'Third', priority: 3 },
        { id: 'fourth', name: 'Fourth', priority: 4 },
        { id: 'fifth', name: 'Fifth', priority: 5 }
      ];

      // Act
      const displayInfo = traitChipUtils.calculateTraitDisplay(traits);

      // Assert
      expect(displayInfo.visibleTraits[0].id).toBe('first');
      expect(displayInfo.visibleTraits[1].id).toBe('second');
      expect(displayInfo.visibleTraits[2].id).toBe('third');
      expect(displayInfo.visibleTraits[3].id).toBe('fourth');
      expect(displayInfo.overflowCount).toBe(1);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large trait arrays efficiently', () => {
      // Arrange - Create a large array of traits
      const manyTraits = Array.from({ length: 100 }, (_, i) => ({
        id: `trait_${i}`,
        name: `Trait ${i}`,
        color: '#000000'
      }));

      // Act
      const startTime = performance.now();
      const displayInfo = traitChipUtils.calculateTraitDisplay(manyTraits);
      const endTime = performance.now();

      // Assert
      expect(displayInfo.visibleTraits).toHaveLength(4);
      expect(displayInfo.overflowCount).toBe(96);
      expect(displayInfo.hasOverflow).toBe(true);
      expect(displayInfo.totalTraits).toBe(100);
      
      // Performance assertion - should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(10); // Less than 10ms
    });
  });
}); 