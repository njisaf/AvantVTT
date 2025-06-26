/**
 * @fileoverview Tests for Trait Bulk Operations Utilities
 * @version 1.0.0 - Stage 5: Advanced Features
 */

import { describe, test, expect } from '@jest/globals';
import {
  addTraitsToList,
  removeTraitsFromList,
  groupTraitsByCategory,
  generateBulkOperationSummary,
  validateBulkSelectionConfig
} from '../../../scripts/logic/trait-bulk-utils.ts';

import { parseCategoryPrefix } from '../../../scripts/logic/trait-utils.ts';

import type { Trait } from '../../../scripts/types/domain/trait.ts';
import type {
  BulkTraitOperationResult,
  BulkTraitSelectionConfig
} from '../../../scripts/logic/trait-bulk-utils.ts';

// Test data factory
function createMockTrait(id: string, name: string, categories: string[] = [], tags: string[] = []): Trait {
  return {
    id,
    name,
    color: '#FF0000',
    icon: 'fas fa-fire',
    localKey: `AVANT.Trait.${name}`,
    description: `${name} trait description`,
    source: 'world',
    item: {
      _id: id,
      name,
      type: 'trait',
      system: {
        color: '#FF0000',
        icon: 'fas fa-fire',
        localKey: `AVANT.Trait.${name}`,
        description: `${name} trait description`,
        traitMetadata: {
          categories,
          tags,
          appliesToItems: true,
          appliesToActors: true
        }
      }
    }
  };
}

describe('Trait Bulk Operations Utilities', () => {
  describe('addTraitsToList', () => {
    test('should add multiple traits to empty list', () => {
      const result = addTraitsToList([], ['fire', 'ice', 'lightning']);
      
      expect(result.success).toBe(true);
      expect(result.traits).toEqual(['fire', 'ice', 'lightning']);
      expect(result.added).toBe(3);
      expect(result.removed).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.details).toHaveLength(3);
      expect(result.details.every(d => d.result === 'added')).toBe(true);
    });
    
    test('should skip duplicate traits', () => {
      const result = addTraitsToList(['fire'], ['fire', 'ice', 'fire']);
      
      expect(result.success).toBe(true);
      expect(result.traits).toEqual(['fire', 'ice']);
      expect(result.added).toBe(1);
      expect(result.skipped).toBe(2);
      expect(result.details.filter(d => d.result === 'added')).toHaveLength(1);
      expect(result.details.filter(d => d.result === 'skipped')).toHaveLength(2);
    });
    
    test('should handle invalid input arrays', () => {
      const result = addTraitsToList(null as any, ['fire']);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Current traits must be an array');
    });
    
    test('should respect maxTraits limit', () => {
      const manyTraits = Array.from({ length: 1001 }, (_, i) => `trait${i}`);
      const result = addTraitsToList([], manyTraits, { maxTraits: 1000 });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot process more than 1000 traits');
    });
    
    test('should handle individual trait errors with continueOnError', () => {
      const result = addTraitsToList(['existing'], [null, 'valid', undefined] as any, {
        continueOnError: true,
        skipValidation: false
      });
      
      expect(result.success).toBe(true);
      expect(result.added).toBe(1);
      expect(result.details.filter(d => d.result === 'error')).toHaveLength(2);
      expect(result.details.filter(d => d.result === 'added')).toHaveLength(1);
    });
  });
  
  describe('removeTraitsFromList', () => {
    test('should remove multiple traits from list', () => {
      const result = removeTraitsFromList(['fire', 'ice', 'lightning'], ['ice', 'lightning']);
      
      expect(result.success).toBe(true);
      expect(result.traits).toEqual(['fire']);
      expect(result.removed).toBe(2);
      expect(result.added).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.details).toHaveLength(2);
      expect(result.details.every(d => d.result === 'removed')).toBe(true);
    });
    
    test('should skip traits not in list', () => {
      const result = removeTraitsFromList(['fire'], ['ice', 'fire', 'lightning']);
      
      expect(result.success).toBe(true);
      expect(result.traits).toEqual([]);
      expect(result.removed).toBe(1);
      expect(result.skipped).toBe(2);
      expect(result.details.filter(d => d.result === 'removed')).toHaveLength(1);
      expect(result.details.filter(d => d.result === 'skipped')).toHaveLength(2);
    });
    
    test('should handle empty removal list', () => {
      const result = removeTraitsFromList(['fire', 'ice'], []);
      
      expect(result.success).toBe(true);
      expect(result.traits).toEqual(['fire', 'ice']);
      expect(result.removed).toBe(0);
      expect(result.details).toHaveLength(0);
    });
    
    test('should handle invalid input arrays', () => {
      const result = removeTraitsFromList(['fire'], null as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Traits to remove must be an array');
    });
  });
  
  describe('groupTraitsByCategory', () => {
    test('should group traits by categories', () => {
      const traits = [
        createMockTrait('fire', 'Fire', ['elemental', 'damage']),
        createMockTrait('ice', 'Ice', ['elemental']),
        createMockTrait('sharp', 'Sharp', ['damage']),
        createMockTrait('basic', 'Basic', [])
      ];
      
      const grouped = groupTraitsByCategory(traits);
      
      expect(grouped.size).toBe(3);
      expect(grouped.has('elemental')).toBe(true);
      expect(grouped.has('damage')).toBe(true);
      expect(grouped.has('uncategorized')).toBe(true);
      
      expect(grouped.get('elemental')).toHaveLength(2);
      expect(grouped.get('damage')).toHaveLength(2);
      expect(grouped.get('uncategorized')).toHaveLength(1);
    });
    
    test('should handle traits with multiple categories', () => {
      const traits = [
        createMockTrait('fire', 'Fire', ['elemental', 'damage', 'hot'])
      ];
      
      const grouped = groupTraitsByCategory(traits);
      
      expect(grouped.size).toBe(3);
      expect(grouped.get('elemental')).toHaveLength(1);
      expect(grouped.get('damage')).toHaveLength(1);
      expect(grouped.get('hot')).toHaveLength(1);
    });
    
    test('should handle invalid input gracefully', () => {
      const grouped = groupTraitsByCategory(null as any);
      
      expect(grouped.size).toBe(0);
    });
  });
  
  describe('generateBulkOperationSummary', () => {
    test('should generate summary for add operation', () => {
      const result: BulkTraitOperationResult = {
        success: true,
        traits: ['fire', 'ice'],
        added: 2,
        removed: 0,
        skipped: 1,
        details: []
      };
      
      const summary = generateBulkOperationSummary(result);
      
      expect(summary).toContain('Added 2 traits');
      expect(summary).toContain('skipped 1 duplicate');
      expect(summary).toContain('Operation completed successfully');
    });
    
    test('should generate summary for remove operation', () => {
      const result: BulkTraitOperationResult = {
        success: true,
        traits: ['fire'],
        added: 0,
        removed: 2,
        skipped: 1,
        details: []
      };
      
      const summary = generateBulkOperationSummary(result);
      
      expect(summary).toContain('Removed 2 traits');
      expect(summary).toContain('skipped 1 not found');
      expect(summary).toContain('Operation completed successfully');
    });
    
    test('should generate summary for mixed operation', () => {
      const result: BulkTraitOperationResult = {
        success: false,
        traits: ['fire'],
        added: 1,
        removed: 1,
        skipped: 0,
        details: []
      };
      
      const summary = generateBulkOperationSummary(result);
      
      expect(summary).toContain('Added 1 trait and removed 1 trait');
      expect(summary).toContain('Operation completed with errors');
    });
    
    test('should handle no changes', () => {
      const result: BulkTraitOperationResult = {
        success: true,
        traits: ['fire'],
        added: 0,
        removed: 0,
        skipped: 0,
        details: []
      };
      
      const summary = generateBulkOperationSummary(result);
      
      expect(summary).toBe('No changes made.');
    });
    
    test('should handle singular vs plural correctly', () => {
      const result: BulkTraitOperationResult = {
        success: true,
        traits: ['fire'],
        added: 1,
        removed: 1,
        skipped: 1,
        details: []
      };
      
      const summary = generateBulkOperationSummary(result);
      
      expect(summary).toContain('Added 1 trait'); // singular
      expect(summary).toContain('removed 1 trait'); // singular
      expect(summary).toContain('skipped 1 duplicate'); // singular
    });
  });
  
  describe('validateBulkSelectionConfig', () => {
    const validConfig: BulkTraitSelectionConfig = {
      availableTraits: [createMockTrait('fire', 'Fire')],
      currentTraits: ['fire'],
      showCategories: true,
      showSearch: true,
      useVirtualization: true,
      itemHeight: 32,
      maxHeight: 400
    };
    
    test('should validate correct configuration', () => {
      const result = validateBulkSelectionConfig(validConfig);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should reject null configuration', () => {
      const result = validateBulkSelectionConfig(null as any);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Configuration is required');
    });
    
    test('should validate available traits array', () => {
      const invalidConfig = { ...validConfig, availableTraits: null as any };
      const result = validateBulkSelectionConfig(invalidConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Available traits must be an array');
    });
    
    test('should validate current traits array', () => {
      const invalidConfig = { ...validConfig, currentTraits: 'not-array' as any };
      const result = validateBulkSelectionConfig(invalidConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Current traits must be an array');
    });
    
    test('should validate positive item height', () => {
      const invalidConfig = { ...validConfig, itemHeight: -5 };
      const result = validateBulkSelectionConfig(invalidConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Item height must be a positive number');
    });
    
    test('should validate positive max height', () => {
      const invalidConfig = { ...validConfig, maxHeight: 0 };
      const result = validateBulkSelectionConfig(invalidConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Max height must be a positive number');
    });
    
    test('should allow undefined optional properties', () => {
      const minimalConfig = {
        availableTraits: [],
        currentTraits: []
      };
      const result = validateBulkSelectionConfig(minimalConfig);
      
      expect(result.valid).toBe(true);
    });
  });
  
  describe('parseCategoryPrefix', () => {
    test('should parse valid category prefix', () => {
      const result = parseCategoryPrefix('weapon:sharp sword');
      
      expect(result.category).toBe('weapon');
      expect(result.query).toBe('sharp sword');
      expect(result.originalQuery).toBe('weapon:sharp sword');
    });
    
    test('should handle query without prefix', () => {
      const result = parseCategoryPrefix('just a search term');
      
      expect(result.category).toBeUndefined();
      expect(result.query).toBe('just a search term');
      expect(result.originalQuery).toBe('just a search term');
    });
    
    test('should handle empty category', () => {
      const result = parseCategoryPrefix(':search term');
      
      expect(result.category).toBeUndefined();
      expect(result.query).toBe(':search term');
      expect(result.originalQuery).toBe(':search term');
    });
    
    test('should validate category name format', () => {
      const result = parseCategoryPrefix('invalid category:search');
      
      expect(result.category).toBeUndefined();
      expect(result.query).toBe('invalid category:search');
    });
    
    test('should handle special characters in category', () => {
      const validResult = parseCategoryPrefix('weapon_type:search');
      expect(validResult.category).toBe('weapon_type');
      
      const validResult2 = parseCategoryPrefix('weapon-type:search');
      expect(validResult2.category).toBe('weapon-type');
      
      const invalidResult = parseCategoryPrefix('weapon type:search');
      expect(invalidResult.category).toBeUndefined();
    });
    
    test('should handle null or undefined input', () => {
      const result1 = parseCategoryPrefix(null as any);
      expect(result1.query).toBe('');
      expect(result1.originalQuery).toBe('');
      
      const result2 = parseCategoryPrefix(undefined as any);
      expect(result2.query).toBe('');
      expect(result2.originalQuery).toBe('');
    });
    
    test('should trim whitespace correctly', () => {
      const result = parseCategoryPrefix('  elemental  :  fire spell  ');
      
      expect(result.category).toBe('elemental');
      expect(result.query).toBe('fire spell');
      expect(result.originalQuery).toBe('  elemental  :  fire spell  ');
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    test('should handle very large trait lists', () => {
      const largeList = Array.from({ length: 5000 }, (_, i) => `trait${i}`);
      const result = addTraitsToList([], largeList, { maxTraits: 10000 });
      
      expect(result.success).toBe(true);
      expect(result.added).toBe(5000);
    });
    
    test('should handle empty string trait IDs', () => {
      const result = addTraitsToList(['existing'], ['', 'valid'], {
        skipValidation: false,
        continueOnError: true
      });
      
      expect(result.success).toBe(true);
      expect(result.added).toBe(1);
      expect(result.details.filter(d => d.result === 'error')).toHaveLength(1);
    });
    
    test('should fail operation when validation errors occur and continueOnError is false', () => {
      // Test that operation fails when there are validation errors and continueOnError is false
      const result = addTraitsToList(['existing'], [null, undefined, ''] as any, {
        continueOnError: false,
        skipValidation: false
      });
      
      expect(result.success).toBe(false);
      expect(result.details.some(d => d.result === 'error')).toBe(true);
      expect(result.error).toContain('Operation stopped due to errors');
    });
  });
}); 