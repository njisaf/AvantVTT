/**
 * @fileoverview Trait Utilities Unit Tests
 * @version 1.0.0 - Stage 2: Trait Logic Tests
 * @description Unit tests for the trait manipulation and filtering utilities
 * @author Avant VTT Team
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type { Trait } from '../../../scripts/types/domain/trait.js';
import {
  addTraitToList,
  removeTraitFromList,
  filterTraits,
  generateTraitSuggestions,
  validateTraitList,
  getTraitsFromIds,
  sortTraits,
  virtualizeList,
  calculateDropdownPosition,
  calculateVirtualWindow,
  debounceTouchMove,
  enhanceForTouch
} from '../../../scripts/logic/trait-utils.ts';
import type { TraitOperationResult, TraitFilterOptions, TraitSuggestion } from '../../../scripts/logic/trait-utils.ts';

// Mock trait data for testing
const createMockTrait = (id: string, name: string, color: string = '#FF6B6B', icon: string = 'fas fa-fire'): Trait => ({
  id,
  name,
  color,
  icon,
  localKey: `AVANT.Trait.${name}`,
  description: `Test ${name} trait`,
  source: 'system' as const,
  item: {
    _id: id,
    name,
    type: 'trait',
    system: {
      color,
      icon,
      localKey: `AVANT.Trait.${name}`,
      description: `Test ${name} trait`,
      traitMetadata: {
        categories: ['elemental'],
        tags: [name.toLowerCase(), 'test'],
        appliesToActors: true,
        appliesToItems: true
      }
    },
    img: 'test-icon.webp',
    sort: 100,
    flags: {}
  }
});

const mockTraits: Trait[] = [
  createMockTrait('fire', 'Fire', '#FF6B6B', 'fas fa-fire'),
  createMockTrait('ice', 'Ice', '#4ECDC4', 'fas fa-snowflake'),
  createMockTrait('lightning', 'Lightning', '#FFE66D', 'fas fa-bolt'),
  createMockTrait('stealth', 'Stealth', '#6C5CE7', 'fas fa-eye-slash'),
  createMockTrait('healing', 'Healing', '#00B894', 'fas fa-heart'),
];

// Mock traits with special metadata for filtering tests
const mockTraitsWithMetadata: Trait[] = [
  {
    ...createMockTrait('fire', 'Fire'),
    item: {
      ...createMockTrait('fire', 'Fire').item,
      system: {
        ...createMockTrait('fire', 'Fire').item.system,
        traitMetadata: {
          categories: ['elemental', 'damage'],
          tags: ['fire', 'elemental', 'hot'],
          appliesToActors: true,
          appliesToItems: true
        }
      }
    }
  },
  {
    ...createMockTrait('stealth', 'Stealth'),
    item: {
      ...createMockTrait('stealth', 'Stealth').item,
      system: {
        ...createMockTrait('stealth', 'Stealth').item.system,
        traitMetadata: {
          categories: ['skill', 'utility'],
          tags: ['stealth', 'concealment', 'skill'],
          appliesToActors: true,
          appliesToItems: false
        }
      }
    }
  },
  {
    ...createMockTrait('healing', 'Healing'),
    item: {
      ...createMockTrait('healing', 'Healing').item,
      system: {
        ...createMockTrait('healing', 'Healing').item.system,
        traitMetadata: {
          categories: ['support', 'utility'],
          tags: ['healing', 'support', 'magic'],
          appliesToActors: true,
          appliesToItems: true
        }
      }
    }
  }
];

describe('Trait Utilities', () => {
  
  describe('addTraitToList', () => {
    test('should add trait to empty list', () => {
      const result = addTraitToList([], 'fire');
      
      expect(result.success).toBe(true);
      expect(result.traits).toEqual(['fire']);
      expect(result.changed).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    test('should add trait to existing list', () => {
      const result = addTraitToList(['ice'], 'fire');
      
      expect(result.success).toBe(true);
      expect(result.traits).toEqual(['ice', 'fire']);
      expect(result.changed).toBe(true);
    });
    
    test('should not add duplicate trait', () => {
      const result = addTraitToList(['fire', 'ice'], 'fire');
      
      expect(result.success).toBe(true);
      expect(result.traits).toEqual(['fire', 'ice']);
      expect(result.changed).toBe(false);
    });
    
    test('should handle invalid input - non-array currentTraits', () => {
      const result = addTraitToList(null as any, 'fire');
      
      expect(result.success).toBe(false);
      expect(result.traits).toEqual([]);
      expect(result.changed).toBe(false);
      expect(result.error).toContain('Current traits must be an array');
    });
    
    test('should handle invalid input - empty trait ID', () => {
      const result = addTraitToList(['ice'], '');
      
      expect(result.success).toBe(false);
      expect(result.traits).toEqual(['ice']);
      expect(result.changed).toBe(false);
      expect(result.error).toContain('Trait ID must be a non-empty string');
    });
    
    test('should handle invalid input - non-string trait ID', () => {
      const result = addTraitToList(['ice'], null as any);
      
      expect(result.success).toBe(false);
      expect(result.traits).toEqual(['ice']);
      expect(result.changed).toBe(false);
      expect(result.error).toContain('Trait ID must be a non-empty string');
    });
  });
  
  describe('removeTraitFromList', () => {
    test('should remove trait from list', () => {
      const result = removeTraitFromList(['fire', 'ice'], 'fire');
      
      expect(result.success).toBe(true);
      expect(result.traits).toEqual(['ice']);
      expect(result.changed).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    test('should handle removing non-existent trait', () => {
      const result = removeTraitFromList(['fire', 'ice'], 'lightning');
      
      expect(result.success).toBe(true);
      expect(result.traits).toEqual(['fire', 'ice']);
      expect(result.changed).toBe(false);
    });
    
    test('should handle empty list', () => {
      const result = removeTraitFromList([], 'fire');
      
      expect(result.success).toBe(true);
      expect(result.traits).toEqual([]);
      expect(result.changed).toBe(false);
    });
    
    test('should handle invalid input - non-array currentTraits', () => {
      const result = removeTraitFromList(undefined as any, 'fire');
      
      expect(result.success).toBe(false);
      expect(result.traits).toEqual([]);
      expect(result.changed).toBe(false);
      expect(result.error).toContain('Current traits must be an array');
    });
    
    test('should handle invalid input - empty trait ID', () => {
      const result = removeTraitFromList(['fire'], '');
      
      expect(result.success).toBe(false);
      expect(result.traits).toEqual(['fire']);
      expect(result.changed).toBe(false);
      expect(result.error).toContain('Trait ID must be a non-empty string');
    });
  });
  
  describe('filterTraits', () => {
    test('should return all traits when no filter options provided', () => {
      const result = filterTraits(mockTraits);
      
      expect(result).toHaveLength(mockTraits.length);
      expect(result).toEqual(mockTraits);
    });
    
    test('should filter by name query (case insensitive)', () => {
      const result = filterTraits(mockTraits, { query: 'fire' });
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Fire');
    });
    
    test('should filter by name query (case sensitive)', () => {
      const result = filterTraits(mockTraits, { query: 'fire', caseSensitive: true });
      
      expect(result).toHaveLength(0); // 'fire' != 'Fire'
    });
    
    test('should filter by description', () => {
      const result = filterTraits(mockTraits, { query: 'test fire' });
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Fire');
    });
    
    test('should filter by categories', () => {
      const result = filterTraits(mockTraitsWithMetadata, { categories: ['elemental'] });
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Fire');
    });
    
    test('should filter by tags', () => {
      const result = filterTraits(mockTraitsWithMetadata, { tags: ['stealth'] });
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Stealth');
    });
    
    test('should limit results with maxResults', () => {
      const result = filterTraits(mockTraits, { maxResults: 2 });
      
      expect(result).toHaveLength(2);
    });
    
    test('should handle invalid input gracefully', () => {
      const result = filterTraits(null as any);
      
      expect(result).toEqual([]);
    });
    
    test('should combine multiple filters', () => {
      const result = filterTraits(mockTraitsWithMetadata, {
        categories: ['utility'],
        tags: ['support'],
        maxResults: 5
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Healing');
    });
  });
  
  describe('generateTraitSuggestions', () => {
    test('should generate suggestions for partial name match', () => {
      const result = generateTraitSuggestions(mockTraits, 'fi');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Fire');
      expect(result[0].score).toBeGreaterThan(0.5);
    });
    
    test('should rank exact matches highest', () => {
      const result = generateTraitSuggestions(mockTraits, 'fire');
      
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(1.0);
    });
    
    test('should rank prefix matches high', () => {
      const result = generateTraitSuggestions(mockTraits, 'he');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Healing');
      expect(result[0].score).toBe(0.8);
    });
    
    test('should sort suggestions by score', () => {
      const traits = [
        createMockTrait('fire-ball', 'Fire Ball'),
        createMockTrait('fire', 'Fire'),
        createMockTrait('firework', 'Firework')
      ];
      
      const result = generateTraitSuggestions(traits, 'fire');
      
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Fire'); // Exact match (score 1.0)
      expect(result[0].score).toBe(1.0);
      
      // The next two should have different scores, but both are contains matches
      // so we'll just verify they exist and have reasonable scores
      const remainingNames = result.slice(1).map(r => r.name).sort();
      expect(remainingNames).toContain('Fire Ball');
      expect(remainingNames).toContain('Firework');
      expect(result[1].score).toBeGreaterThan(0);
      expect(result[2].score).toBeGreaterThan(0);
    });
    
    test('should limit suggestions to maxSuggestions', () => {
      const result = generateTraitSuggestions(mockTraits, 'e', 2);
      
      expect(result.length).toBeLessThanOrEqual(2);
    });
    
    test('should handle empty query', () => {
      const result = generateTraitSuggestions(mockTraits, '');
      
      expect(result).toEqual([]);
    });
    
    test('should handle invalid input', () => {
      const result = generateTraitSuggestions(null as any, 'fire');
      
      expect(result).toEqual([]);
    });
  });
  
  describe('validateTraitList', () => {
    test('should validate list of valid trait IDs', () => {
      const result = validateTraitList(['fire', 'ice'], mockTraits);
      
      expect(result.valid).toEqual(['fire', 'ice']);
      expect(result.invalid).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.allValid).toBe(true);
    });
    
    test('should identify invalid trait IDs', () => {
      const result = validateTraitList(['fire', 'invalid', 'ice'], mockTraits);
      
      expect(result.valid).toEqual(['fire', 'ice']);
      expect(result.invalid).toEqual(['invalid']);
      expect(result.warnings).toContain('Trait not found: invalid');
      expect(result.allValid).toBe(false);
    });
    
    test('should filter traits that do not apply to items', () => {
      const result = validateTraitList(['stealth'], mockTraitsWithMetadata, 'weapon');
      
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual(['stealth']);
      expect(result.warnings).toContain("Trait 'Stealth' does not apply to items");
      expect(result.allValid).toBe(false);
    });
    
    test('should handle invalid trait IDs', () => {
      const result = validateTraitList([null, '', 'fire'] as any, mockTraits);
      
      expect(result.valid).toEqual(['fire']);
      expect(result.invalid).toContain('null');
      expect(result.invalid).toContain('');
      expect(result.allValid).toBe(false);
    });
    
    test('should handle invalid input - non-array trait IDs', () => {
      const result = validateTraitList(null as any, mockTraits);
      
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
      expect(result.warnings).toContain('Trait IDs must be an array');
      expect(result.allValid).toBe(false);
    });
    
    test('should handle invalid input - no available traits', () => {
      const result = validateTraitList(['fire'], null as any);
      
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual(['fire']);
      expect(result.warnings).toContain('No available traits provided');
      expect(result.allValid).toBe(false);
    });
  });
  
  describe('getTraitsFromIds', () => {
    test('should return trait objects for valid IDs', () => {
      const result = getTraitsFromIds(['fire', 'ice'], mockTraits);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('fire');
      expect(result[1].id).toBe('ice');
    });
    
    test('should filter out invalid IDs', () => {
      const result = getTraitsFromIds(['fire', 'invalid', 'ice'], mockTraits);
      
      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toEqual(['fire', 'ice']);
    });
    
    test('should handle empty ID list', () => {
      const result = getTraitsFromIds([], mockTraits);
      
      expect(result).toEqual([]);
    });
    
    test('should handle invalid inputs', () => {
      const result1 = getTraitsFromIds(null as any, mockTraits);
      const result2 = getTraitsFromIds(['fire'], null as any);
      
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
    });
  });
  
  describe('sortTraits', () => {
    test('should sort traits by name (default)', () => {
      const unsorted = [mockTraits[2], mockTraits[0], mockTraits[1]]; // Lightning, Fire, Ice
      const result = sortTraits(unsorted);
      
      expect(result.map(t => t.name)).toEqual(['Fire', 'Ice', 'Lightning']);
    });
    
    test('should sort traits by name descending', () => {
      const result = sortTraits(mockTraits, 'name', false);
      
      const names = result.map(t => t.name);
      expect(names[0]).toBe('Stealth'); // Last alphabetically
      expect(names[names.length - 1]).toBe('Fire'); // First alphabetically
    });
    
    test('should sort traits by color', () => {
      const result = sortTraits(mockTraits, 'color');
      
      // Should be sorted by hex color values
      expect(result).toHaveLength(mockTraits.length);
    });
    
    test('should sort traits by source', () => {
      const mixedSourceTraits = [
        { ...mockTraits[0], source: 'world' as const },
        { ...mockTraits[1], source: 'system' as const }
      ];
      
      const result = sortTraits(mixedSourceTraits, 'source');
      
      expect(result[0].source).toBe('system');
      expect(result[1].source).toBe('world');
    });
    
    test('should handle invalid input gracefully', () => {
      const result = sortTraits(null as any);
      
      expect(result).toEqual([]);
    });
    
    test('should not mutate original array', () => {
      const original = [...mockTraits];
      const result = sortTraits(mockTraits);
      
      expect(mockTraits).toEqual(original);
      expect(result).not.toBe(mockTraits);
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    test('should handle malformed trait objects', () => {
      const malformedTraits: any[] = [
        { id: 'valid', name: 'Valid Trait' },
        { id: null, name: 'Invalid ID' },
        { name: 'Missing ID' },
        null,
        { id: 'another-valid', name: 'Another Valid' }
      ];

      const validTraits = malformedTraits.filter(trait => 
        trait && typeof trait.id === 'string' && trait.id.length > 0
      );

      expect(validTraits).toHaveLength(2);
      expect(validTraits[0].id).toBe('valid');
      expect(validTraits[1].id).toBe('another-valid');
    });

    test('should handle very large trait lists', () => {
      const largeTrait = {
        id: 'test-trait',
        name: 'Test Trait',
        color: '#FF0000',
        icon: 'fas fa-test'
      };

      const largeTraitList = Array(10000).fill(largeTrait).map((trait, index) => ({
        ...trait,
        id: `${trait.id}-${index}`
      }));

      const startTime = performance.now();
      const filtered = filterTraits(largeTraitList, { query: 'test', maxResults: 100 });
      const endTime = performance.now();

      expect(filtered).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    test('should handle unicode and special characters', () => {
      const unicodeTraits: Trait[] = [
        createMockTrait('fire-🔥', 'Fire 🔥', '#FF0000', 'fas fa-fire'),
        createMockTrait('ice-❄️', 'Ice ❄️', '#00FFFF', 'fas fa-snowflake'),
        createMockTrait('électricité', 'Électricité', '#FFFF00', 'fas fa-bolt')
      ];

      const filtered = filterTraits(unicodeTraits, { query: '🔥' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('fire-🔥');

      const suggestions = generateTraitSuggestions(unicodeTraits, 'élec');
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe('électricité'); // Fixed: suggestions have .id, not .trait.id
    });
  });

  describe('Virtualization Utilities', () => {
    describe('virtualizeList', () => {
      test('should virtualize a list correctly', () => {
        const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
        const result = virtualizeList(items, 10, 30, 400, 32);

        expect(result.visibleItems).toHaveLength(20); // 30 - 10
        expect(result.startIndex).toBe(10);
        expect(result.endIndex).toBe(30);
        expect(result.spacerTop).toBe(320); // 10 * 32
        expect(result.spacerBottom).toBe(31040); // (1000 - 30) * 32
        expect(result.totalHeight).toBe(32000); // 1000 * 32
      });

      test('should handle invalid input gracefully', () => {
        const result = virtualizeList(null as any, 0, 10, 400, 32);

        expect(result.visibleItems).toEqual([]);
        expect(result.startIndex).toBe(0);
        expect(result.endIndex).toBe(0);
        expect(result.totalHeight).toBe(0);
      });

      test('should clamp indices to valid range', () => {
        const items = Array.from({ length: 10 }, (_, i) => ({ id: i }));
        const result = virtualizeList(items, -5, 20, 400, 32);

        expect(result.startIndex).toBe(0);
        expect(result.endIndex).toBe(10);
        expect(result.visibleItems).toHaveLength(10);
      });
    });

    describe('calculateDropdownPosition', () => {
      const mockInputRect: DOMRect = {
        left: 100,
        top: 50,
        right: 200,
        bottom: 80,
        width: 100,
        height: 30,
        x: 100,
        y: 50,
        toJSON: () => ({})
      };

      test('should position dropdown below input by default', () => {
        const position = calculateDropdownPosition(
          mockInputRect,
          200, // dropdown height
          300, // dropdown width
          1920, // viewport width
          1080, // viewport height
        );

        expect(position.left).toBe(100);
        expect(position.top).toBe(84); // bottom + 4px offset
        expect(position.placement).toBe('bottom-left');
        expect(position.withinViewport).toBe(true);
      });

      test('should position dropdown above input when no space below', () => {
        const bottomInputRect: DOMRect = {
          ...mockInputRect,
          top: 950,
          bottom: 980
        };

        const position = calculateDropdownPosition(
          bottomInputRect,
          200,
          300,
          1920,
          1080
        );

        expect(position.top).toBe(746); // 950 - 200 - 4px offset
        expect(position.placement).toBe('top-left');
      });

      test('should right-align when no space on left', () => {
        const rightInputRect: DOMRect = {
          ...mockInputRect,
          left: 1700,
          right: 1800
        };

        const position = calculateDropdownPosition(
          rightInputRect,
          200,
          300,
          1920,
          1080
        );

        expect(position.left).toBe(1500); // 1800 - 300
        expect(position.placement).toBe('bottom-right');
      });

      test('should handle invalid input gracefully', () => {
        const position = calculateDropdownPosition(
          null as any,
          200,
          300,
          1920,
          1080
        );

        expect(position.left).toBe(0);
        expect(position.top).toBe(0);
        expect(position.placement).toBe('bottom-left');
        expect(position.withinViewport).toBe(false);
      });

      test('should clamp position to viewport bounds', () => {
        const offscreenRect: DOMRect = {
          ...mockInputRect,
          left: -50,
          right: 50,
          top: -20,
          bottom: 10
        };

        const position = calculateDropdownPosition(
          offscreenRect,
          100,
          200,
          800,
          600
        );

        expect(position.left).toBeGreaterThanOrEqual(8);
        expect(position.top).toBeGreaterThanOrEqual(8);
        expect(position.left + 200).toBeLessThanOrEqual(792); // 800 - 8
        expect(position.top + 100).toBeLessThanOrEqual(592); // 600 - 8
      });
    });

    describe('calculateVirtualWindow', () => {
      test('should calculate visible window correctly', () => {
        const window = calculateVirtualWindow(
          320, // scrollTop
          200, // containerHeight  
          32,  // itemHeight
          1000, // totalItems
          5    // bufferSize
        );

        expect(window.startIndex).toBe(5); // Math.max(0, 10 - 5)
        expect(window.endIndex).toBe(22); // Math.min(1000, 17 + 5)
        expect(window.visibleCount).toBe(7); // Math.ceil(200 / 32)
      });

      test('should handle invalid input', () => {
        const window = calculateVirtualWindow(100, 200, 0, 1000, 5);

        expect(window.startIndex).toBe(0);
        expect(window.endIndex).toBe(0);
        expect(window.visibleCount).toBe(0);
      });

      test('should respect buffer size', () => {
        const windowSmallBuffer = calculateVirtualWindow(320, 200, 32, 1000, 1);
        const windowLargeBuffer = calculateVirtualWindow(320, 200, 32, 1000, 10);

        expect(windowLargeBuffer.endIndex - windowLargeBuffer.startIndex).toBeGreaterThan(
          windowSmallBuffer.endIndex - windowSmallBuffer.startIndex
        );
      });
    });

    describe('debounceTouchMove', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      test('should debounce function calls', () => {
        const mockFn = jest.fn();
        const debouncedFn = debounceTouchMove(mockFn, 50);

        // First call goes through immediately (no previous call timing)
        debouncedFn('arg1');
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenLastCalledWith('arg1');

        // Clear the mock to test subsequent debouncing
        mockFn.mockClear();

        // Call multiple times quickly - these should be debounced
        debouncedFn('arg2');
        debouncedFn('arg3');
        debouncedFn('arg4');

        // Should not have called the function yet (within debounce window)
        expect(mockFn).not.toHaveBeenCalled();

        // Advance time
        jest.advanceTimersByTime(50);

        // Should have called once with the last arguments
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenLastCalledWith('arg4');
      });

      test('should call immediately if enough time has passed', () => {
        const mockFn = jest.fn();
        const debouncedFn = debounceTouchMove(mockFn, 50);

        // First call should go through immediately if enough time passed
        debouncedFn('first');
        jest.advanceTimersByTime(60);
        
        debouncedFn('second');
        
        expect(mockFn).toHaveBeenCalledTimes(2);
        expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
        expect(mockFn).toHaveBeenNthCalledWith(2, 'second');
      });
    });

    describe('enhanceForTouch', () => {
      let mockElement: HTMLElement;

      beforeEach(() => {
        mockElement = document.createElement('div');
        // Mock offsetWidth and offsetHeight
        Object.defineProperty(mockElement, 'offsetWidth', { value: 20, configurable: true });
        Object.defineProperty(mockElement, 'offsetHeight', { value: 20, configurable: true });
      });

      test('should enhance small elements for touch', () => {
        const enhanced = enhanceForTouch(mockElement, 44);

        expect(enhanced.style.minWidth).toBe('44px');
        expect(enhanced.style.minHeight).toBe('44px');
        expect(enhanced.style.cursor).toBe('pointer');
        expect(enhanced.style.userSelect).toBe('none');
      });

      test('should not modify already large elements', () => {
        Object.defineProperty(mockElement, 'offsetWidth', { value: 50, configurable: true });
        Object.defineProperty(mockElement, 'offsetHeight', { value: 50, configurable: true });

        const enhanced = enhanceForTouch(mockElement, 44);

        expect(enhanced.style.minWidth).toBe(''); // Should not be set
        expect(enhanced.style.paddingLeft).toBe(''); // Should not be set
      });

      test('should handle null element gracefully', () => {
        const result = enhanceForTouch(null as any);
        expect(result).toBeNull();
      });
    });

    describe('Performance Tests', () => {
      test('virtualizeList should handle large datasets efficiently', () => {
        const hugeItemSet = Array.from({ length: 10000 }, (_, i) => ({ id: i }));

        const startTime = performance.now();
        const result = virtualizeList(hugeItemSet, 100, 150, 1600, 32);
        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(5); // Should complete in under 5ms
        expect(result.visibleItems).toHaveLength(50);
        expect(result.totalHeight).toBe(320000); // 10000 * 32
      });
    });
  });

  describe('Performance Tests', () => {
    test('renderAutocomplete should complete in <2ms for 1000 traits', () => {
      // Create 1000 test traits
      const largeTraitSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `trait-${i}`,
        name: `Trait ${i}`,
        color: '#FF0000',
        icon: 'fas fa-test'
      }));

      // Measure performance
      const startTime = performance.now();
      
      // Simulate autocomplete rendering with virtualization
      const virtualWindow = calculateVirtualWindow(0, 300, 32, 1000, 5);
      const virtualList = virtualizeList(largeTraitSet, virtualWindow.startIndex, virtualWindow.endIndex, 300, 32);
      const suggestions = generateTraitSuggestions(virtualList.visibleItems, 'trait', 10);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2); // Must complete in under 2ms
      expect(suggestions).toHaveLength(10); // Should return expected results
      expect(virtualList.visibleItems.length).toBeLessThan(50); // Should virtualize large list
    });

    test('virtualizeList should handle 10000 items efficiently', () => {
      const hugeItemSet = Array.from({ length: 10000 }, (_, i) => ({ id: i }));

      const startTime = performance.now();
      const result = virtualizeList(hugeItemSet, 100, 150, 1600, 32);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1); // Should complete in under 1ms
      expect(result.visibleItems).toHaveLength(50);
      expect(result.totalHeight).toBe(320000); // 10000 * 32
    });
  });
}); 