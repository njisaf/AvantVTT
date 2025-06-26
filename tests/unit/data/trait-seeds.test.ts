/**
 * @fileoverview Trait Seed Utilities Unit Tests
 * @version 1.0.0 - Stage 1: Foundation
 * @description Unit tests for trait seed data and utilities
 * @author Avant VTT Team
 */

import { describe, test, expect } from '@jest/globals';
import { 
  DEFAULT_TRAIT_SEEDS, 
  TraitSeedUtils, 
  type TraitSeedData 
} from '../../../scripts/data/trait-seeds.ts';

describe('Trait Seed Data', () => {
  describe('DEFAULT_TRAIT_SEEDS', () => {
    test('should contain 8 seed traits', () => {
      expect(DEFAULT_TRAIT_SEEDS).toHaveLength(8);
    });
    
    test('should have all required properties', () => {
      DEFAULT_TRAIT_SEEDS.forEach((seed, index) => {
        expect(seed.name).toBeDefined();
        expect(seed.type).toBe('feature');
        expect(seed.system).toBeDefined();
        expect(seed.system.color).toBeDefined();
        expect(seed.system.icon).toBeDefined();
        expect(seed.system.localKey).toBeDefined();
        expect(seed.sort).toBeDefined();
        
        // Color should be valid hex
        expect(seed.system.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        
        // LocalKey should follow pattern
        expect(seed.system.localKey).toMatch(/^AVANT\.Trait\.[A-Za-z]+$/);
        
        // Should have trait metadata
        expect(seed.system.traitMetadata).toBeDefined();
        expect(seed.system.traitMetadata?.categories).toBeDefined();
        expect(seed.system.traitMetadata?.tags).toBeDefined();
      });
    });
    
    test('should have unique names', () => {
      const names = DEFAULT_TRAIT_SEEDS.map(seed => seed.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
    
    test('should have unique localization keys', () => {
      const localKeys = DEFAULT_TRAIT_SEEDS.map(seed => seed.system.localKey);
      const uniqueKeys = new Set(localKeys);
      expect(uniqueKeys.size).toBe(localKeys.length);
    });
    
    test('should include expected traits', () => {
      const traitNames = DEFAULT_TRAIT_SEEDS.map(seed => seed.name);
      
      expect(traitNames).toContain('Fire');
      expect(traitNames).toContain('Ice');
      expect(traitNames).toContain('Lightning');
      expect(traitNames).toContain('Stealth');
      expect(traitNames).toContain('Healing');
      expect(traitNames).toContain('Tech');
      expect(traitNames).toContain('Psychic');
      expect(traitNames).toContain('Legendary');
    });
  });
});

describe('TraitSeedUtils', () => {
  describe('getAllSeeds', () => {
    test('should return all seed data', () => {
      const seeds = TraitSeedUtils.getAllSeeds();
      
      expect(seeds).toHaveLength(DEFAULT_TRAIT_SEEDS.length);
      expect(seeds).toEqual(DEFAULT_TRAIT_SEEDS);
    });
    
    test('should return a copy, not the original array', () => {
      const seeds = TraitSeedUtils.getAllSeeds();
      
      // Modifying returned array should not affect original
      seeds.push({} as TraitSeedData);
      expect(DEFAULT_TRAIT_SEEDS).toHaveLength(8);
    });
  });
  
  describe('getSeedByName', () => {
    test('should find existing traits by name', () => {
      const fireSeed = TraitSeedUtils.getSeedByName('Fire');
      
      expect(fireSeed).toBeDefined();
      expect(fireSeed?.name).toBe('Fire');
      expect(fireSeed?.system.color).toBe('#FF6B6B');
      expect(fireSeed?.system.localKey).toBe('AVANT.Trait.Fire');
    });
    
    test('should return undefined for non-existent traits', () => {
      const nonExistentSeed = TraitSeedUtils.getSeedByName('NonExistent');
      
      expect(nonExistentSeed).toBeUndefined();
    });
    
    test('should be case-sensitive', () => {
      const lowerCaseSeed = TraitSeedUtils.getSeedByName('fire');
      
      expect(lowerCaseSeed).toBeUndefined();
    });
  });
  
  describe('getSeedsByCategory', () => {
    test('should filter traits by elemental category', () => {
      const elementalSeeds = TraitSeedUtils.getSeedsByCategory('elemental');
      
      expect(elementalSeeds.length).toBeGreaterThan(0);
      elementalSeeds.forEach(seed => {
        expect(seed.system.traitMetadata?.categories).toContain('elemental');
      });
      
      // Should include Fire, Ice, Lightning
      const names = elementalSeeds.map(seed => seed.name);
      expect(names).toContain('Fire');
      expect(names).toContain('Ice');
      expect(names).toContain('Lightning');
    });
    
    test('should filter traits by damage category', () => {
      const damageSeeds = TraitSeedUtils.getSeedsByCategory('damage');
      
      expect(damageSeeds.length).toBeGreaterThan(0);
      damageSeeds.forEach(seed => {
        expect(seed.system.traitMetadata?.categories).toContain('damage');
      });
    });
    
    test('should return empty array for non-existent category', () => {
      const nonExistentSeeds = TraitSeedUtils.getSeedsByCategory('nonexistent');
      
      expect(nonExistentSeeds).toHaveLength(0);
    });
  });
  
  describe('getSeedsByTag', () => {
    test('should filter traits by fire tag', () => {
      const fireSeeds = TraitSeedUtils.getSeedsByTag('fire');
      
      expect(fireSeeds.length).toBe(1);
      expect(fireSeeds[0].name).toBe('Fire');
    });
    
    test('should filter traits by elemental tag', () => {
      const elementalSeeds = TraitSeedUtils.getSeedsByTag('elemental');
      
      expect(elementalSeeds.length).toBeGreaterThan(1);
      elementalSeeds.forEach(seed => {
        expect(seed.system.traitMetadata?.tags).toContain('elemental');
      });
    });
    
    test('should return empty array for non-existent tag', () => {
      const nonExistentSeeds = TraitSeedUtils.getSeedsByTag('nonexistent');
      
      expect(nonExistentSeeds).toHaveLength(0);
    });
  });
  
  describe('validateSeed', () => {
    test('should validate correct seed data', () => {
      const validSeed: TraitSeedData = {
        name: 'Test Trait',
        type: 'trait',
        system: {
          color: '#123456',
          icon: 'fas fa-test',
          localKey: 'AVANT.Trait.Test',
          description: 'Test trait'
        }
      };
      
      expect(TraitSeedUtils.validateSeed(validSeed)).toBe(true);
    });
    
    test('should invalidate seed with missing name', () => {
      const invalidSeed = {
        type: 'trait',
        system: {
          color: '#123456',
          icon: 'fas fa-test',
          localKey: 'AVANT.Trait.Test'
        }
      } as TraitSeedData;
      
      expect(TraitSeedUtils.validateSeed(invalidSeed)).toBe(false);
    });
    
    test('should invalidate seed with missing system properties', () => {
      const invalidSeed: TraitSeedData = {
        name: 'Test',
        type: 'trait',
        system: {
          color: '#123456',
          icon: 'fas fa-test',
          localKey: ''  // Empty localKey
        }
      };
      
      expect(TraitSeedUtils.validateSeed(invalidSeed)).toBe(false);
    });
    
    test('should invalidate seed with invalid color format', () => {
      const invalidSeed: TraitSeedData = {
        name: 'Test',
        type: 'trait',
        system: {
          color: 'red', // Not hex format
          icon: 'fas fa-test',
          localKey: 'AVANT.Trait.Test'
        }
      };
      
      expect(TraitSeedUtils.validateSeed(invalidSeed)).toBe(false);
    });
    
    test('should invalidate seed with invalid localKey format', () => {
      const invalidSeed: TraitSeedData = {
        name: 'Test',
        type: 'trait',
        system: {
          color: '#123456',
          icon: 'fas fa-test',
          localKey: 'invalid.key' // Wrong format
        }
      };
      
      expect(TraitSeedUtils.validateSeed(invalidSeed)).toBe(false);
    });
    
    test('should validate all default seeds', () => {
      DEFAULT_TRAIT_SEEDS.forEach(seed => {
        expect(TraitSeedUtils.validateSeed(seed)).toBe(true);
      });
    });
  });
  
  describe('seedToItemData', () => {
    test('should convert seed to FoundryVTT item data', () => {
      const seed = DEFAULT_TRAIT_SEEDS[0]; // Fire trait
      const itemData = TraitSeedUtils.seedToItemData(seed);
      
      expect(itemData.name).toBe(seed.name);
      expect(itemData.type).toBe(seed.type);
      expect(itemData.system).toBe(seed.system);
      expect(itemData.img).toBe(seed.img);
      expect(itemData.sort).toBe(seed.sort);
    });
    
    test('should include folder ID when provided', () => {
      const seed = DEFAULT_TRAIT_SEEDS[0];
      const folderId = 'test-folder-123';
      const itemData = TraitSeedUtils.seedToItemData(seed, folderId);
      
      expect(itemData.folder).toBe(folderId);
    });
    
    test('should default sort to 0 when not provided', () => {
      const seed: TraitSeedData = {
        name: 'Test',
        type: 'trait',
        system: {
          color: '#123456',
          icon: 'fas fa-test',
          localKey: 'AVANT.Trait.Test'
        }
        // No sort property
      };
      
      const itemData = TraitSeedUtils.seedToItemData(seed);
      expect(itemData.sort).toBe(0);
    });
  });
}); 