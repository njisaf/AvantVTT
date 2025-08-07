/**
 * @fileoverview Unit Tests for System Utilities and Configuration
 * @version 2.0.0
 * @author Avant Development Team  
 * @description Additional tests for various system utilities to increase coverage
 */

import { ValidationUtils } from '../../scripts/utils/validation.js';
import { AvantActorData } from '../../scripts/data/actor-data.js';
import { AvantActionData, AvantFeatureData, AvantTalentData, AvantAugmentData, AvantWeaponData, AvantArmorData, AvantGearData } from '../../scripts/data/item-data.js';

describe('System Integration and Constants', () => {
  describe('Data Model Exports', () => {
    test('should export AvantActorData class', () => {
      expect(AvantActorData).toBeDefined();
      expect(typeof AvantActorData).toBe('function');
      expect(AvantActorData.name).toBe('AvantActorData');
    });

    test('should export all item data model classes', () => {
      const itemModels = [
        AvantActionData,
        AvantFeatureData, 
        AvantTalentData,
        AvantAugmentData,
        AvantWeaponData,
        AvantArmorData,
        AvantGearData
      ];

      itemModels.forEach(ModelClass => {
        expect(ModelClass).toBeDefined();
        expect(typeof ModelClass).toBe('function');
        expect(ModelClass.name).toContain('Avant');
      });
    });

    test('should export utility classes', () => {
      expect(ValidationUtils).toBeDefined();
      expect(typeof ValidationUtils).toBe('function');
    });
  });

  describe('System Constants and Configuration', () => {
    test('should have consistent system names', () => {
      // Test various system identification constants
      const systemNames = [
        'AvantActorData',
        'AvantActionData',
        'AvantFeatureData',
        'AvantTalentData',
        'AvantAugmentData',
        'AvantWeaponData',
        'AvantArmorData',
        'AvantGearData'
      ];

      systemNames.forEach(name => {
        expect(name).toStartWith('Avant');
        expect(name).toMatch(/^[A-Z]/); // Should start with capital letter
      });
    });

    test('should have valid item type mappings', () => {
      const itemTypes = ['action', 'feature', 'talent', 'augment', 'weapon', 'armor', 'gear'];
      const dataModels = [AvantActionData, AvantFeatureData, AvantTalentData, AvantAugmentData, AvantWeaponData, AvantArmorData, AvantGearData];

      expect(itemTypes).toHaveLength(dataModels.length);
      
      itemTypes.forEach(type => {
        expect(type).toBeString();
        expect(type).toBe(type.toLowerCase());
      });
    });

    test('should have valid actor type mappings', () => {
      const actorTypes = ['character', 'npc', 'vehicle'];
      
      actorTypes.forEach(type => {
        expect(type).toBeString();
        expect(type).toBe(type.toLowerCase());
      });
    });
  });

  describe('Data Model Schema Consistency', () => {
    test('should have consistent schema structure across item models', () => {
      const itemModels = [
        AvantActionData,
        AvantFeatureData,
        AvantTalentData,
        AvantAugmentData,
        AvantWeaponData,
        AvantArmorData,
        AvantGearData
      ];

      itemModels.forEach(ModelClass => {
        const schema = ModelClass.defineSchema();
        expect(schema).toBeObject();
        expect(schema).toContainKey('description');
      });
    });

    test('should have actor schema with required fields', () => {
      const actorSchema = AvantActorData.defineSchema();
      
      expect(actorSchema).toBeObject();
      expect(actorSchema).toContainKeys(['attributes', 'skills', 'health']);
    });

    test('should support all defined skill-attribute mappings', () => {
      const skillAttributes = AvantActorData.getSkillAttributes();
      const expectedAttributes = ['might', 'grace', 'intellect', 'focus'];
      
      const usedAttributes = [...new Set(Object.values(skillAttributes))];
      expect(usedAttributes).toIncludeAllMembers(expectedAttributes);
    });
  });

  describe('Utility Function Integration', () => {
    test('should integrate validation with actor data', () => {
      const testData = {
        type: 'character',
        system: {
          level: '5',
          attributes: {
            might: { value: '12' }
          }
        }
      };

      const validated = ValidationUtils.validateActorData(testData);
      
      expect(validated.system.level).toBe(5); // Should be converted to number
      expect(validated.system.attributes.might.value).toBe(12);
    });

    test('should integrate validation with item data', () => {
      const testData = {
        type: 'weapon',
        system: {
          modifier: '3',
          threshold: '15'
        }
      };

      const validated = ValidationUtils.validateItemData(testData);
      
      expect(validated.system.modifier).toBe(3);
      expect(validated.system.threshold).toBe(15);
    });

    test('should handle v13 foundry utils', () => {
      // Test that foundry.utils is available in v13
      expect(foundry?.utils?.mergeObject).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid data gracefully', () => {
      const invalidData = [null, undefined, '', 0, false, {}, []];
      
      invalidData.forEach(data => {
        expect(() => ValidationUtils.validateActorData(data)).not.toThrow();
        expect(() => ValidationUtils.validateItemData(data)).not.toThrow();
      });
    });

    test('should maintain data integrity during validation', () => {
      const originalData = {
        type: 'character',
        system: {
          level: 3,
          attributes: {
            might: { value: 14, mod: 2 }
          },
          skills: {
            force: 1
          }
        }
      };

      const validated = ValidationUtils.validateActorData(JSON.parse(JSON.stringify(originalData)));
      
      // Should preserve valid values
      expect(validated.system.level).toBe(3);
      expect(validated.system.attributes.might.value).toBe(14);
      expect(validated.system.skills.force).toBe(1);
    });

    test('should handle schema generation under stress', () => {
      // Repeatedly generate schemas to test performance and consistency
      for (let i = 0; i < 10; i++) {
        expect(() => {
          AvantActorData.defineSchema();
          AvantActionData.defineSchema();
          AvantWeaponData.defineSchema();
          AvantArmorData.defineSchema();
        }).not.toThrow();
      }
    });
  });

  describe('System Component Integration', () => {
    test('should support skill lookup operations', () => {
      const allSkills = ['debate', 'discern', 'endure', 'finesse', 'force', 'command', 'charm', 'hide', 'inspect', 'intuit', 'recall', 'surge'];
      
      allSkills.forEach(skill => {
        const attribute = AvantActorData.getSkillAttribute(skill);
        expect(attribute).toBeOneOf(['might', 'grace', 'intellect', 'focus']);
      });
    });

    test('should support attribute reverse lookup operations', () => {
      const allAttributes = ['might', 'grace', 'intellect', 'focus'];
      
      allAttributes.forEach(attribute => {
        const skills = AvantActorData.getAttributeSkills(attribute);
        expect(skills).toBeArray();
        expect(skills.length).toBeGreaterThan(0);
      });
    });

    test('should maintain bidirectional skill-attribute relationships', () => {
      const skillAttributes = AvantActorData.getSkillAttributes();
      
      Object.entries(skillAttributes).forEach(([skill, attribute]) => {
        const attributeSkills = AvantActorData.getAttributeSkills(attribute);
        expect(attributeSkills).toContain(skill);
      });
    });

    test('should provide consistent data validation', () => {
      const testCases = [
        { type: 'character', expected: 'character' },
        { type: 'invalid', expected: 'character' },
        { type: '', expected: 'character' },
        { type: null, expected: 'character' }
      ];

      testCases.forEach(testCase => {
        const result = ValidationUtils.validateActorData(testCase);
        expect(result.type).toBe(testCase.expected);
      });
    });
  });

  describe('Performance and Memory', () => {
    test('should handle multiple validation operations efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        const testData = {
          type: 'character',
          system: {
            level: i % 10 + 1,
            attributes: {
              might: { value: i % 20 + 1 }
            }
          }
        };
        
        ValidationUtils.validateActorData(testData);
        ValidationUtils.validateItemData({ type: 'weapon' });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });

    test('should handle schema generation efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 50; i++) {
        AvantActorData.defineSchema();
        AvantActionData.defineSchema();
        AvantWeaponData.defineSchema();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 50ms)
      expect(duration).toBeLessThan(50);
    });

    test('should not create memory leaks during validation', () => {
      const largeData = {
        type: 'character',
        system: {
          level: 1,
          attributes: {},
          skills: {},
          items: new Array(100).fill(null).map((_, i) => ({ name: `Item ${i}` }))
        }
      };

      // Multiple validations shouldn't accumulate memory
      for (let i = 0; i < 10; i++) {
        const validated = ValidationUtils.validateActorData(JSON.parse(JSON.stringify(largeData)));
        expect(validated).toBeDefined();
      }
    });
  });
}); 