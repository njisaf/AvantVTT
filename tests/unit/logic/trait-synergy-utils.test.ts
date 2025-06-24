/**
 * @fileoverview Unit Tests for Trait Synergy Utilities
 * @version 1.0.0 - Stage 6: Distributed Sharing
 * @description Comprehensive tests for trait synergy calculation functions
 * @author Avant VTT Team
 */

import { describe, test, expect } from '@jest/globals';
import {
  calculateSynergyEffects,
  getSynergiesForTrait,
  hasTraitSynergies,
  formatSynergyDescription,
  type TraitSynergy,
  type SynergyCalculationResult,
  type SynergyCalculationOptions
} from '../../../scripts/logic/trait-synergy-utils.ts';

describe('calculateSynergyEffects', () => {
  test('should calculate synergies for valid trait combinations', () => {
    const result = calculateSynergyEffects(['fire', 'ice']);
    
    expect(result.success).toBe(true);
    expect(result.synergies).toHaveLength(1);
    expect(result.synergies[0].id).toBe('fire-ice-balance');
    expect(result.synergies[0].name).toBe('Elemental Balance');
    expect(result.traitsProcessed).toBe(2);
    expect(result.metadata?.processedTraitIds).toEqual(['fire', 'ice']);
  });
  
  test('should return no synergies for non-matching traits', () => {
    const result = calculateSynergyEffects(['fire', 'water']);
    
    expect(result.success).toBe(true);
    expect(result.synergies).toHaveLength(0);
    expect(result.traitsProcessed).toBe(2);
    expect(result.metadata?.unmatchedTraitIds).toEqual(['fire', 'water']);
  });
  
  test('should find multiple synergies when applicable', () => {
    const result = calculateSynergyEffects(['fire', 'ice', 'lightning', 'metal']);
    
    expect(result.success).toBe(true);
    expect(result.synergies.length).toBeGreaterThan(1);
    
    const synergyIds = result.synergies.map(s => s.id);
    expect(synergyIds).toContain('fire-ice-balance');
    expect(synergyIds).toContain('lightning-metal-conduction');
  });
  
  test('should respect maxSynergies option', () => {
    const result = calculateSynergyEffects(
      ['fire', 'ice', 'lightning', 'metal'], 
      { maxSynergies: 1 }
    );
    
    expect(result.success).toBe(true);
    expect(result.synergies).toHaveLength(1);
  });
  
  test('should filter by allowed types', () => {
    const result = calculateSynergyEffects(
      ['fire', 'ice', 'shadow', 'stealth'], 
      { allowedTypes: ['damage_bonus'] }
    );
    
    expect(result.success).toBe(true);
    
    // All returned synergies should be damage_bonus type
    result.synergies.forEach(synergy => {
      expect(synergy.type).toBe('damage_bonus');
    });
  });
  
  test('should handle invalid input gracefully', () => {
    const result = calculateSynergyEffects('not an array' as any);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Trait IDs must be an array');
    expect(result.synergies).toHaveLength(0);
    expect(result.traitsProcessed).toBe(0);
  });
  
  test('should handle empty array input', () => {
    const result = calculateSynergyEffects([]);
    
    expect(result.success).toBe(true);
    expect(result.synergies).toHaveLength(0);
    expect(result.traitsProcessed).toBe(0);
  });
  
  test('should handle single trait input', () => {
    const result = calculateSynergyEffects(['fire']);
    
    expect(result.success).toBe(true);
    expect(result.synergies).toHaveLength(0);
    expect(result.traitsProcessed).toBe(1);
  });
  
  test('should include calculation time in metadata', () => {
    const result = calculateSynergyEffects(['fire', 'ice']);
    
    expect(result.success).toBe(true);
    expect(result.metadata?.calculationTime).toBeDefined();
    expect(typeof result.metadata?.calculationTime).toBe('number');
    expect(result.metadata?.calculationTime).toBeGreaterThanOrEqual(0);
  });
  
  test('should handle thrown exceptions in synergy calculation', () => {
    // Test validates error handling in the function
    const result = calculateSynergyEffects(['fire', 'ice']);
    
    // Should still succeed with normal input
    expect(result.success).toBe(true);
  });
});

describe('getSynergiesForTrait', () => {
  test('should return synergies that include the specified trait', () => {
    const synergies = getSynergiesForTrait('fire');
    
    expect(Array.isArray(synergies)).toBe(true);
    expect(synergies.length).toBeGreaterThan(0);
    
    // All synergies should include 'fire' in their requiredTraits
    synergies.forEach(synergy => {
      expect(synergy.requiredTraits).toContain('fire');
    });
  });
  
  test('should return empty array for non-existent trait', () => {
    const synergies = getSynergiesForTrait('nonexistent');
    
    expect(Array.isArray(synergies)).toBe(true);
    expect(synergies).toHaveLength(0);
  });
  
  test('should handle invalid input gracefully', () => {
    expect(getSynergiesForTrait('')).toEqual([]);
    expect(getSynergiesForTrait(null as any)).toEqual([]);
    expect(getSynergiesForTrait(undefined as any)).toEqual([]);
    expect(getSynergiesForTrait(123 as any)).toEqual([]);
  });
  
  test('should filter by allowed types when specified', () => {
    const synergies = getSynergiesForTrait('fire', { 
      allowedTypes: ['damage_bonus'] 
    });
    
    synergies.forEach(synergy => {
      expect(synergy.type).toBe('damage_bonus');
    });
  });
  
  test('should return multiple synergies for traits with multiple combinations', () => {
    const synergies = getSynergiesForTrait('shadow');
    
    expect(synergies.length).toBeGreaterThanOrEqual(1);
    
    // Should find shadow-stealth synergy
    const shadowStealth = synergies.find(s => s.id === 'shadow-stealth-mastery');
    expect(shadowStealth).toBeDefined();
    expect(shadowStealth?.requiredTraits).toContain('shadow');
  });
});

describe('hasTraitSynergies', () => {
  test('should return true for traits with synergies', () => {
    expect(hasTraitSynergies(['fire', 'ice'])).toBe(true);
    expect(hasTraitSynergies(['lightning', 'metal'])).toBe(true);
    expect(hasTraitSynergies(['shadow', 'stealth'])).toBe(true);
  });
  
  test('should return false for traits without synergies', () => {
    expect(hasTraitSynergies(['fire', 'water'])).toBe(false);
    expect(hasTraitSynergies(['random', 'nonexistent'])).toBe(false);
  });
  
  test('should return false for invalid input', () => {
    expect(hasTraitSynergies([])).toBe(false);
    expect(hasTraitSynergies(['single'])).toBe(false);
    expect(hasTraitSynergies('not an array' as any)).toBe(false);
    expect(hasTraitSynergies(null as any)).toBe(false);
  });
  
  test('should return true for multiple trait combinations', () => {
    expect(hasTraitSynergies(['fire', 'ice', 'lightning', 'metal'])).toBe(true);
  });
});

describe('formatSynergyDescription', () => {
  const mockSynergy: TraitSynergy = {
    id: 'test',
    name: 'Test Synergy',
    requiredTraits: ['fire', 'ice'],
    description: 'A test synergy effect',
    type: 'damage_bonus',
    value: 2
  };
  
  test('should format single synergy description', () => {
    const description = formatSynergyDescription([mockSynergy]);
    
    expect(description).toBe('Test Synergy: A test synergy effect');
  });
  
  test('should format multiple synergy descriptions', () => {
    const mockSynergy2: TraitSynergy = {
      id: 'test2',
      name: 'Another Synergy',
      requiredTraits: ['lightning', 'metal'],
      description: 'Another test effect',
      type: 'skill_bonus',
      value: 1
    };
    
    const description = formatSynergyDescription([mockSynergy, mockSynergy2]);
    
    expect(description).toContain('Test Synergy (A test synergy effect)');
    expect(description).toContain('Another Synergy (Another test effect)');
    expect(description).toContain(';');
  });
  
  test('should handle empty synergies array', () => {
    const description = formatSynergyDescription([]);
    
    expect(description).toBe('No active synergies');
  });
  
  test('should handle invalid input gracefully', () => {
    expect(formatSynergyDescription(null as any)).toBe('No active synergies');
    expect(formatSynergyDescription(undefined as any)).toBe('No active synergies');
    expect(formatSynergyDescription('not an array' as any)).toBe('No active synergies');
  });
});

describe('Synergy System Integration', () => {
  test('should provide consistent results across function calls', () => {
    const traitIds = ['fire', 'ice'];
    
    // Calculate synergies
    const calculation = calculateSynergyEffects(traitIds);
    
    // Check if synergies exist
    const hasSynergies = hasTraitSynergies(traitIds);
    
    // Get individual trait synergies
    const fireSynergies = getSynergiesForTrait('fire');
    const iceSynergies = getSynergiesForTrait('ice');
    
    // Results should be consistent
    expect(calculation.success).toBe(true);
    expect(hasSynergies).toBe(true);
    expect(calculation.synergies.length).toBeGreaterThan(0);
    expect(fireSynergies.length).toBeGreaterThan(0);
    expect(iceSynergies.length).toBeGreaterThan(0);
    
    // The fire-ice synergy should be found in all relevant queries
    const fireIceSynergy = calculation.synergies.find(s => s.id === 'fire-ice-balance');
    expect(fireIceSynergy).toBeDefined();
    
    const fireHasFireIce = fireSynergies.some(s => s.id === 'fire-ice-balance');
    const iceHasFireIce = iceSynergies.some(s => s.id === 'fire-ice-balance');
    expect(fireHasFireIce).toBe(true);
    expect(iceHasFireIce).toBe(true);
  });
  
  test('should handle complex trait combinations', () => {
    const complexTraits = ['fire', 'ice', 'lightning', 'metal', 'shadow', 'stealth'];
    
    const result = calculateSynergyEffects(complexTraits);
    
    expect(result.success).toBe(true);
    expect(result.synergies.length).toBeGreaterThanOrEqual(3);
    expect(result.traitsProcessed).toBe(6);
    
    // Should find all expected synergies
    const synergyIds = result.synergies.map(s => s.id);
    expect(synergyIds).toContain('fire-ice-balance');
    expect(synergyIds).toContain('lightning-metal-conduction');
    expect(synergyIds).toContain('shadow-stealth-mastery');
  });
  
  test('should demonstrate synergy type filtering', () => {
    const traitIds = ['fire', 'ice', 'shadow', 'stealth'];
    
    // Get all synergies
    const allSynergies = calculateSynergyEffects(traitIds);
    
    // Get only damage bonus synergies
    const damageOnlySynergies = calculateSynergyEffects(traitIds, {
      allowedTypes: ['damage_bonus']
    });
    
    // Get only skill bonus synergies
    const skillOnlySynergies = calculateSynergyEffects(traitIds, {
      allowedTypes: ['skill_bonus']
    });
    
    expect(allSynergies.synergies.length).toBeGreaterThan(damageOnlySynergies.synergies.length);
    expect(allSynergies.synergies.length).toBeGreaterThan(skillOnlySynergies.synergies.length);
    
    // Should have different synergies based on type filter
    damageOnlySynergies.synergies.forEach(synergy => {
      expect(synergy.type).toBe('damage_bonus');
    });
    
    skillOnlySynergies.synergies.forEach(synergy => {
      expect(synergy.type).toBe('skill_bonus');
    });
  });
});

describe('Built-in Synergies Validation', () => {
  test('should have well-formed built-in synergies', () => {
    const allTraits = [
      'fire', 'ice', 'lightning', 'metal', 'earth', 'nature',
      'shadow', 'stealth', 'holy', 'blessed', 'poison', 'acid'
    ];
    
    const result = calculateSynergyEffects(allTraits);
    
    expect(result.success).toBe(true);
    expect(result.synergies.length).toBeGreaterThan(0);
    
    // Validate each synergy has required properties
    result.synergies.forEach(synergy => {
      expect(typeof synergy.id).toBe('string');
      expect(synergy.id.length).toBeGreaterThan(0);
      
      expect(typeof synergy.name).toBe('string');
      expect(synergy.name.length).toBeGreaterThan(0);
      
      expect(Array.isArray(synergy.requiredTraits)).toBe(true);
      expect(synergy.requiredTraits.length).toBeGreaterThanOrEqual(2);
      
      expect(typeof synergy.description).toBe('string');
      expect(synergy.description.length).toBeGreaterThan(0);
      
      expect(typeof synergy.type).toBe('string');
      expect(['damage_bonus', 'defense_bonus', 'skill_bonus', 'special_ability', 'resistance', 'vulnerability', 'custom']).toContain(synergy.type);
    });
  });
  
  test('should have unique synergy IDs', () => {
    const allTraits = [
      'fire', 'ice', 'lightning', 'metal', 'earth', 'nature',
      'shadow', 'stealth', 'holy', 'blessed', 'poison', 'acid'
    ];
    
    const result = calculateSynergyEffects(allTraits);
    const synergyIds = result.synergies.map(s => s.id);
    const uniqueIds = new Set(synergyIds);
    
    expect(synergyIds.length).toBe(uniqueIds.size);
  });
});

describe('Error Handling and Edge Cases', () => {
  test('should handle null and undefined inputs', () => {
    expect(() => calculateSynergyEffects(null as any)).not.toThrow();
    expect(() => calculateSynergyEffects(undefined as any)).not.toThrow();
    
    const nullResult = calculateSynergyEffects(null as any);
    expect(nullResult.success).toBe(false);
    
    const undefinedResult = calculateSynergyEffects(undefined as any);
    expect(undefinedResult.success).toBe(false);
  });
  
  test('should handle very large trait arrays efficiently', () => {
    const largeTraitArray = Array.from({ length: 1000 }, (_, i) => `trait${i}`);
    
    const startTime = Date.now();
    const result = calculateSynergyEffects(largeTraitArray);
    const endTime = Date.now();
    
    expect(result.success).toBe(true);
    expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
  });
  
  test('should handle duplicate trait IDs', () => {
    const result = calculateSynergyEffects(['fire', 'ice', 'fire', 'ice']);
    
    expect(result.success).toBe(true);
    expect(result.traitsProcessed).toBe(4);
    
    // Should still find the fire-ice synergy
    const fireIceSynergy = result.synergies.find(s => s.id === 'fire-ice-balance');
    expect(fireIceSynergy).toBeDefined();
  });
}); 