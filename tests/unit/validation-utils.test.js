/**
 * ValidationUtils Test Suite
 * 
 * Comprehensive tests for the ValidationUtils class covering:
 * - Actor data validation and normalization
 * - Item data validation and normalization  
 * - Number, string, and data structure validation
 * - Edge cases and error handling
 * 
 * @author Avant VTT Team
 * @version 2.0.0
 * @since 0.1.2
 */

import { ValidationUtils } from '../../scripts/utils/validation.js';

describe('ValidationUtils', () => {
  describe('Actor Data Validation', () => {
    test('should validate and set default actor type', () => {
      const data = {};
      const result = ValidationUtils.validateActorData(data);
      
      expect(result)
        .toBeObject()
        .toContainKey('type');
      expect(result.type).toBe('character');
    });

    test('should preserve valid actor types', () => {
      const validTypes = ['character', 'npc', 'vehicle'];
      
      validTypes.forEach(type => {
        const data = { type };
        const result = ValidationUtils.validateActorData(data);
        
        expect(result.type).toBe(type);
      });
    });

    test('should normalize invalid actor types to character', () => {
      const invalidData = { type: 'invalid-type' };
      const result = ValidationUtils.validateActorData(invalidData);
      
      expect(result.type).toBe('character');
    });

    test('should create system data if missing', () => {
      const data = { type: 'character' };
      const result = ValidationUtils.validateActorData(data);
      
      expect(result)
        .toContainKey('system')
        .toBeObject();
      expect(result.system).toBeObject();
    });

    test('should validate numeric actor properties', () => {
      const data = {
        type: 'character',
        system: {
          level: '5',
          tier: 'invalid',
          effort: 2.5,
          fortunePoints: 'abc'
        }
      };
      
      const result = ValidationUtils.validateActorData(data);
      
      expect(result.system.level).toBe(5);
      expect(result.system.tier).toBe(1); // default
      expect(result.system.effort).toBe(2); // rounded down
      expect(result.system.fortunePoints).toBe(3); // default
    });

    test('should validate abilities structure', () => {
      const data = {
        type: 'character',
        system: {
          abilities: {
            might: { value: '12', mod: 2.7 },
            grace: { value: 'invalid' },
            intellect: { value: 8, mod: 'bad' }
          }
        }
      };
      
      const result = ValidationUtils.validateActorData(data);
      
      expect(result.system.abilities)
        .toBeObject()
        .toContainKeys(['might', 'grace', 'intellect']);
      
      expect(result.system.abilities.might)
        .toContainEntry(['value', 12])
        .toContainEntry(['mod', 2]);
      
      expect(result.system.abilities.grace.value).toBe(10); // default
      expect(result.system.abilities.intellect.mod).toBe(0); // default
    });

    test('should validate skills structure', () => {
      const data = {
        type: 'character',
        system: {
          skills: {
            athletics: '3',
            stealth: 'specialized',
            investigation: 1.8
          }
        }
      };
      
      const result = ValidationUtils.validateActorData(data);
      
      expect(result.system.skills)
        .toBeObject()
        .toContainKeys(['athletics', 'stealth', 'investigation']);
      
      expect(result.system.skills.athletics).toBe(3);
      expect(result.system.skills.stealth).toBe(0); // invalid -> default
      expect(result.system.skills.investigation).toBe(1); // rounded down
    });

    test('should validate health structure', () => {
      const data = {
        type: 'character',
        system: {
          health: {
            value: '15',
            max: 'high',
            temp: -5
          }
        }
      };
      
      const result = ValidationUtils.validateActorData(data);
      
      expect(result.system.health)
        .toBeObject()
        .toContainKeys(['value', 'max', 'temp']);
      
      expect(result.system.health)
        .toContainEntry(['value', 15])
        .toContainEntry(['max', 0]) // default
        .toContainEntry(['temp', -5]); // preserves negative
    });
  });

  describe('Item Data Validation', () => {
    test('should validate and set default item type', () => {
      const data = {};
      const result = ValidationUtils.validateItemData(data);
      
      expect(result)
        .toBeObject()
        .toContainKey('type');
      expect(result.type).toBe('gear');
    });

    test('should preserve valid item types', () => {
      const validTypes = ["action", "feature", "talent", "augment", "weapon", "armor", "gear"];
      
      validTypes.forEach(type => {
        const data = { type };
        const result = ValidationUtils.validateItemData(data);
        
        expect(result.type).toBe(type);
      });
    });

    test('should validate action items', () => {
      const data = {
        type: 'action',
        system: {
          difficulty: '13',
          powerPointCost: 'low'
        }
      };
      
      const result = ValidationUtils.validateItemData(data);
      
      expect(result.system)
        .toContainKey('ability')
        .toContainEntry(['difficulty', 13])
        .toContainEntry(['powerPointCost', 0]); // invalid -> default
      
      expect(result.system.ability).toBe('might'); // default
    });

    test('should validate weapon items', () => {
      const data = {
        type: 'weapon',
        system: {
          modifier: '2',
          threshold: 'medium',
          weight: '1.5',
          cost: -10,
          quantity: 'several'
        }
      };
      
      const result = ValidationUtils.validateItemData(data);
      
      expect(result.system)
        .toContainKeys(['ability', 'modifier', 'damageDie', 'threshold', 'weight', 'cost', 'quantity']);
      
      expect(result.system)
        .toContainEntry(['ability', 'might'])
        .toContainEntry(['modifier', 2])
        .toContainEntry(['damageDie', '1d6'])
        .toContainEntry(['threshold', 11]) // invalid -> default
        .toContainEntry(['weight', 1.5]) // preserved as float
        .toContainEntry(['cost', -10]) // preserves negative
        .toContainEntry(['quantity', 1]); // invalid -> default
    });

    test('should validate talent items with tier restrictions', () => {
      const data = {
        type: 'talent',
        system: {
          tier: '3',
          powerPointCost: '2'
        }
      };
      
      const result = ValidationUtils.validateItemData(data);
      
      expect(result.system)
        .toContainEntry(['tier', 3])
        .toContainEntry(['powerPointCost', 2]);
    });
  });

  describe('Number Validation', () => {
    test('should validate and convert valid numbers', () => {
      expect(ValidationUtils.validateNumber('42')).toBe(42);
      expect(ValidationUtils.validateNumber(3.14)).toBe(3); // integer by default
      expect(ValidationUtils.validateNumber('0')).toBe(0);
    });

    test('should use defaults for invalid numbers', () => {
      expect(ValidationUtils.validateNumber('abc')).toBe(0);
      expect(ValidationUtils.validateNumber(null)).toBe(0);
      expect(ValidationUtils.validateNumber(undefined)).toBe(0);
      expect(ValidationUtils.validateNumber('abc', 42)).toBe(42);
    });

    test('should handle float vs integer modes', () => {
      expect(ValidationUtils.validateNumber(3.14, 0, true)).toBe(3); // integer
      expect(ValidationUtils.validateNumber(3.14, 0, false)).toBe(3.14); // float
    });

    test('should handle negative numbers appropriately', () => {
      expect(ValidationUtils.validateNumber(-5, 10)).toBe(-5); // preserves valid negative
      expect(ValidationUtils.validateNumber(-5, -1)).toBe(-5); // preserves negative
    });
  });

  describe('String Validation', () => {
    test('should validate and preserve valid strings', () => {
      expect(ValidationUtils.validateString('hello')).toBe('hello');
      expect(ValidationUtils.validateString('  spaced  ')).toBe('  spaced  '); // not trimmed
    });

    test('should use defaults for invalid strings', () => {
      expect(ValidationUtils.validateString(null)).toBe('');
      expect(ValidationUtils.validateString(undefined)).toBe('');
      expect(ValidationUtils.validateString(123)).toBe('123'); // converts to string
      expect(ValidationUtils.validateString('', 'default')).toBe('');
    });

    test('should handle empty and whitespace strings', () => {
      expect(ValidationUtils.validateString('')).toBe('');
      expect(ValidationUtils.validateString('   ')).toBe('   '); // preserves whitespace
      expect(ValidationUtils.validateString(null, 'fallback')).toBe('fallback');
    });
  });

  describe('Complex Data Structure Validation', () => {
    test('should validate abilities structure completely', () => {
      const abilities = {
        might: { modifier: 2 },
        grace: { modifier: 'bad' },
        intellect: { modifier: 'invalid' }
      };
      
      const result = ValidationUtils.validateAbilities(abilities);
      
      expect(result)
        .toBeObject()
        .toContainKeys(['might', 'grace', 'intellect', 'focus']);
      
      // Chain validation assertions
      expect(result.might)
        .toBeObject()
        .toContainEntry(['modifier', 2]);
      
      expect(result.grace.modifier).toBe(0); // invalid -> default
      expect(result.intellect.modifier).toBe(0); // invalid -> default
      expect(result.focus.modifier).toBe(0); // default ability
    });

    test('should validate skills structure completely', () => {
      const skills = {
        debate: 2,
        hide: 'trained',
        inspect: null,
        force: -1
      };
      
      const result = ValidationUtils.validateSkills(skills);
      
      expect(result)
        .toBeObject()
        .toContainKeys(['debate', 'discern', 'endure', 'finesse', 'force', 'command', 'charm', 'hide', 'inspect', 'intuit', 'recall', 'surge']);
      
      expect(result)
        .toContainEntry(['debate', 2])
        .toContainEntry(['hide', 0]) // invalid -> default
        .toContainEntry(['inspect', 0]) // null -> default
        .toContainEntry(['force', -1]); // preserves negative
    });

    test('should process form data by item type', () => {
      const formData = {
        'system.difficulty': '15',
        'system.powerPointCost': '3',
        'system.ability': 'grace'
      };
      
      const result = ValidationUtils.processFormData(formData, 'action');
      
      expect(result)
        .toBeObject()
        .toContainKey('system');
      
      expect(result.system)
        .toBeObject()
        .toContainEntry(['difficulty', 15])
        .toContainEntry(['powerPointCost', 3])
        .toContainEntry(['ability', 'grace']);
    });
  });

  describe('Utility Functions', () => {
    test('should validate document IDs correctly', () => {
      expect(ValidationUtils.isValidDocumentId('1234567890abcdef')).toBeTrue(); // 16 char alphanumeric
      expect(ValidationUtils.isValidDocumentId('AbCdEf1234567890')).toBeTrue(); // 16 char mixed case
      expect(ValidationUtils.isValidDocumentId('abc123')).toBeFalse(); // too short
      expect(ValidationUtils.isValidDocumentId('valid-id_123')).toBeFalse(); // special chars
      expect(ValidationUtils.isValidDocumentId('')).toBeFalse();
      expect(ValidationUtils.isValidDocumentId(null)).toBeFalse();
      expect(ValidationUtils.isValidDocumentId('spaces not allowed')).toBeFalse();
    });

    test('should sanitize HTML safely', () => {
      const dangerous = '<script>alert("xss")</script><p>Safe content</p>';
      const result = ValidationUtils.sanitizeHtml(dangerous);
      
      expect(result)
        .toBeString()
        .not.toInclude('<script>')
        .toInclude('Safe content');
    });

    test('should normalize numbers with advanced options', () => {
      expect(ValidationUtils.normalizeNumber('42.7', 0, true)).toBe(42);
      expect(ValidationUtils.normalizeNumber('42.7', 0, false)).toBe(42.7);
      expect(ValidationUtils.normalizeNumber('invalid', 100)).toBe(100);
    });

    test('should normalize strings without trimming', () => {
      expect(ValidationUtils.normalizeString('  hello world  ')).toBe('  hello world  ');
      expect(ValidationUtils.normalizeString(null, 'fallback')).toBe('fallback');
      expect(ValidationUtils.normalizeString('')).toBe('');
      expect(ValidationUtils.normalizeString(123)).toBe('123'); // converts to string
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle completely empty data structures', () => {
      expect(ValidationUtils.validateActorData({})).toBeObject();
      expect(ValidationUtils.validateItemData({})).toBeObject();
      expect(ValidationUtils.validateAbilities({})).toBeObject();
      expect(ValidationUtils.validateSkills({})).toBeObject();
    });

    test('should handle null and undefined inputs gracefully', () => {
      expect(() => ValidationUtils.validateActorData(null)).not.toThrow();
      expect(() => ValidationUtils.validateItemData(undefined)).not.toThrow();
      expect(() => ValidationUtils.validateNumber(null)).not.toThrow();
      expect(() => ValidationUtils.validateString(undefined)).not.toThrow();
    });

    test('should preserve existing valid data', () => {
      const validActor = {
        type: 'character',
        system: {
          level: 5,
          abilities: { might: { value: 15, mod: 1 } },
          health: { value: 25, max: 30, temp: 5 }
        }
      };
      
      const result = ValidationUtils.validateActorData(validActor);
      
      expect(result)
        .toContainEntry(['type', 'character'])
        .toContainKeys(['system']);
      
      expect(result.system)
        .toContainEntry(['level', 5])
        .toContainKeys(['abilities', 'health']);
      
      expect(result.system.abilities.might)
        .toContainEntry(['value', 15])
        .toContainEntry(['mod', 1]);
      
      expect(result.system.health)
        .toContainEntry(['value', 25])
        .toContainEntry(['max', 30])
        .toContainEntry(['temp', 5]);
    });
  });
}); 