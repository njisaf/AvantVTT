/**
 * @fileoverview Unit Tests for Item Data Models
 * @version 2.0.0
 * @author Avant Development Team  
 * @description Comprehensive tests for all item data model classes
 */

import {
  AvantActionData,
  AvantFeatureData,
  AvantTalentData,
  AvantAugmentData,
  AvantWeaponData,
  AvantArmorData,
  AvantGearData
} from '../../scripts/data/item-data.js';

describe('Item Data Models', () => {
  describe('AvantActionData', () => {
    describe('defineSchema', () => {
      test('should return a valid schema object', () => {
        const schema = AvantActionData.defineSchema();
        
        expect(schema)
          .toBeObject()
          .not.toBeEmpty();
      });

      test('should include required action fields', () => {
        const schema = AvantActionData.defineSchema();
        
        expect(schema).toContainKeys([
          'description', 'ability', 'difficulty', 'powerPointCost', 'uses'
        ]);
      });

      test('should have ability choices constraint', () => {
        const schema = AvantActionData.defineSchema();
        
        expect(schema.ability.choices)
          .toBeArray()
          .toIncludeAllMembers(['might', 'grace', 'intellect', 'focus']);
      });

      test('should have proper numeric constraints', () => {
        const schema = AvantActionData.defineSchema();
        
        // Difficulty should be within game range
        expect(schema.difficulty.min).toBe(5);
        expect(schema.difficulty.max).toBe(30);
        expect(schema.difficulty.initial).toBe(11);
        
        // Power point cost should be non-negative
        expect(schema.powerPointCost.min).toBe(0);
        expect(schema.powerPointCost.initial).toBe(0);
      });

      test('should include uses structure', () => {
        const schema = AvantActionData.defineSchema();
        
        expect(schema.uses.fields).toContainKeys(['value', 'max']);
        expect(schema.uses.fields.value.min).toBe(0);
        expect(schema.uses.fields.max.min).toBe(0);
      });
    });

    test('should be consistent across multiple calls', () => {
      const schema1 = AvantActionData.defineSchema();
      const schema2 = AvantActionData.defineSchema();
      
      expect(Object.keys(schema1).sort()).toEqual(Object.keys(schema2).sort());
    });
  });

  describe('AvantFeatureData', () => {
    describe('defineSchema', () => {
      test('should return a valid schema object', () => {
        const schema = AvantFeatureData.defineSchema();
        
        expect(schema)
          .toBeObject()
          .not.toBeEmpty();
      });

      test('should include required feature fields', () => {
        const schema = AvantFeatureData.defineSchema();
        
        expect(schema).toContainKeys([
          'description', 'category', 'isActive', 'powerPointCost', 'uses'
        ]);
      });

      test('should have category choices constraint', () => {
        const schema = AvantFeatureData.defineSchema();
        
        expect(schema.category.choices)
          .toBeArray()
          .toIncludeAllMembers(['racial', 'class', 'background', 'general', 'special']);
      });

      test('should have boolean isActive field', () => {
        const schema = AvantFeatureData.defineSchema();
        
        expect(schema.isActive.initial).toBe(false);
      });

      test('should include uses structure', () => {
        const schema = AvantFeatureData.defineSchema();
        
        expect(schema.uses.fields).toContainKeys(['value', 'max']);
      });
    });
  });

  describe('AvantTalentData', () => {
    describe('defineSchema', () => {
      test('should return a valid schema object', () => {
        const schema = AvantTalentData.defineSchema();
        
        expect(schema)
          .toBeObject()
          .not.toBeEmpty();
      });

      test('should include required talent fields', () => {
        const schema = AvantTalentData.defineSchema();
        
        expect(schema).toContainKeys([
          'description', 'tier', 'powerPointCost', 'isActive', 'prerequisites', 'uses'
        ]);
      });

      test('should have proper tier constraints', () => {
        const schema = AvantTalentData.defineSchema();
        
        expect(schema.tier.min).toBe(1);
        expect(schema.tier.max).toBe(6);
        expect(schema.tier.initial).toBe(1);
        expect(schema.tier.integer).toBe(true);
      });

      test('should have non-negative power point cost', () => {
        const schema = AvantTalentData.defineSchema();
        
        expect(schema.powerPointCost.min).toBe(0);
        expect(schema.powerPointCost.initial).toBe(1);
      });

      test('should include prerequisites field', () => {
        const schema = AvantTalentData.defineSchema();
        
        expect(schema.prerequisites.initial).toBe('');
        expect(schema.prerequisites.blank).toBe(true);
      });
    });
  });

  describe('AvantAugmentData', () => {
    describe('defineSchema', () => {
      test('should return a valid schema object', () => {
        const schema = AvantAugmentData.defineSchema();
        
        expect(schema)
          .toBeObject()
          .not.toBeEmpty();
      });

      test('should include required augment fields', () => {
        const schema = AvantAugmentData.defineSchema();
        
        expect(schema).toContainKeys(['description', 'augmentType']);
      });

      test('should have augment type choices', () => {
        const schema = AvantAugmentData.defineSchema();
        
        expect(schema.augmentType.choices)
          .toBeArray()
          .toIncludeAllMembers(['enhancement', 'cybernetic', 'biological', 'magical', 'psionic']);
      });

      test('should have default augment type', () => {
        const schema = AvantAugmentData.defineSchema();
        
        expect(schema.augmentType.initial).toBe('enhancement');
      });
    });
  });

  describe('AvantWeaponData', () => {
    describe('defineSchema', () => {
      test('should return a valid schema object', () => {
        const schema = AvantWeaponData.defineSchema();
        
        expect(schema)
          .toBeObject()
          .not.toBeEmpty();
      });

      test('should include required weapon fields', () => {
        const schema = AvantWeaponData.defineSchema();
        
        expect(schema).toContainKeys([
          'description', 'ability', 'damageDie', 'damageType', 'threshold', 'range',
          'weight', 'cost', 'quantity', 'equipped', 'properties'
        ]);
      });

      test('should have ability choices constraint', () => {
        const schema = AvantWeaponData.defineSchema();
        
        expect(schema.ability.choices)
          .toBeArray()
          .toIncludeAllMembers(['might', 'grace', 'intellect', 'focus']);
      });

      test('should have range choices constraint', () => {
        const schema = AvantWeaponData.defineSchema();
        
        expect(schema.range.choices)
          .toBeArray()
          .toIncludeAllMembers(['Melee', 'Short', 'Medium', 'Long', 'Extreme']);
      });

      test('should have proper numeric constraints', () => {
        const schema = AvantWeaponData.defineSchema();
        
        // Threshold should be within game range
        expect(schema.threshold.min).toBe(5);
        expect(schema.threshold.max).toBe(30);
        expect(schema.threshold.initial).toBe(11);
        
        // Weight and cost should be non-negative
        expect(schema.weight.min).toBe(0);
        expect(schema.cost.min).toBe(0);
        expect(schema.quantity.min).toBe(0);
      });

      test('should have boolean equipped field', () => {
        const schema = AvantWeaponData.defineSchema();
        
        expect(schema.equipped.initial).toBe(false);
      });
    });
  });

  describe('AvantArmorData', () => {
    describe('defineSchema', () => {
      test('should return a valid schema object', () => {
        const schema = AvantArmorData.defineSchema();
        
        expect(schema)
          .toBeObject()
          .not.toBeEmpty();
      });

      test('should include required armor fields', () => {
        const schema = AvantArmorData.defineSchema();
        
        expect(schema).toContainKeys([
          'description', 'ability', 'modifier', 'threshold', 'damageReduction',
          'armorType', 'weight', 'cost', 'quantity', 'equipped', 'properties'
        ]);
      });

      test('should have ability choices constraint', () => {
        const schema = AvantArmorData.defineSchema();
        
        expect(schema.ability.choices)
          .toBeArray()
          .toIncludeAllMembers(['might', 'grace', 'intellect', 'focus']);
      });

      test('should have armor type choices', () => {
        const schema = AvantArmorData.defineSchema();
        
        expect(schema.armorType.choices)
          .toBeArray()
          .toIncludeAllMembers(['light', 'medium', 'heavy', 'shield']);
      });

      test('should have proper modifier constraints', () => {
        const schema = AvantArmorData.defineSchema();
        
        expect(schema.modifier.min).toBe(-10);
        expect(schema.modifier.max).toBe(10);
        expect(schema.modifier.initial).toBe(0);
      });

      test('should have proper damage reduction constraints', () => {
        const schema = AvantArmorData.defineSchema();
        
        expect(schema.damageReduction.min).toBe(0);
        expect(schema.damageReduction.max).toBe(10);
        expect(schema.damageReduction.initial).toBe(0);
      });
    });
  });

  describe('AvantGearData', () => {
    describe('defineSchema', () => {
      test('should return a valid schema object', () => {
        const schema = AvantGearData.defineSchema();
        
        expect(schema)
          .toBeObject()
          .not.toBeEmpty();
      });

      test('should include required gear fields', () => {
        const schema = AvantGearData.defineSchema();
        
        expect(schema).toContainKeys([
          'description', 'weight', 'cost', 'quantity', 'rarity',
          'category', 'isConsumable', 'uses'
        ]);
      });

      test('should have rarity choices constraint', () => {
        const schema = AvantGearData.defineSchema();
        
        expect(schema.rarity.choices)
          .toBeArray()
          .toIncludeAllMembers(['common', 'uncommon', 'rare', 'epic', 'legendary', 'artifact']);
      });

      test('should have category choices constraint', () => {
        const schema = AvantGearData.defineSchema();
        
        expect(schema.category.choices)
          .toBeArray()
          .toIncludeAllMembers([
            'miscellaneous', 'tool', 'container', 'consumable',
            'treasure', 'component', 'ammunition', 'trade good'
          ]);
      });

      test('should have boolean isConsumable field', () => {
        const schema = AvantGearData.defineSchema();
        
        expect(schema.isConsumable.initial).toBe(false);
      });

      test('should include uses structure', () => {
        const schema = AvantGearData.defineSchema();
        
        expect(schema.uses.fields).toContainKeys(['value', 'max']);
        expect(schema.uses.fields.value.min).toBe(0);
        expect(schema.uses.fields.max.min).toBe(0);
      });
    });
  });

  describe('Cross-Model Validation', () => {
    test('should have consistent ability choices across models', () => {
      const actionSchema = AvantActionData.defineSchema();
      const weaponSchema = AvantWeaponData.defineSchema();
      const armorSchema = AvantArmorData.defineSchema();
      
      const expectedAbilities = ['might', 'grace', 'intellect', 'focus'];
      
      expect(actionSchema.ability.choices).toEqual(expectedAbilities);
      expect(weaponSchema.ability.choices).toEqual(expectedAbilities);
      expect(armorSchema.ability.choices).toEqual(expectedAbilities);
    });

    test('should have consistent threshold constraints', () => {
      const actionSchema = AvantActionData.defineSchema();
      const weaponSchema = AvantWeaponData.defineSchema();
      const armorSchema = AvantArmorData.defineSchema();
      
      // All threshold fields should have same constraints
      [actionSchema.difficulty, weaponSchema.threshold, armorSchema.threshold].forEach(field => {
        expect(field.min).toBe(5);
        expect(field.max).toBe(30);
        expect(field.initial).toBe(11);
      });
    });

    test('should have consistent uses structure', () => {
      const modelsWithUses = [
        AvantActionData.defineSchema(),
        AvantFeatureData.defineSchema(),
        AvantTalentData.defineSchema(),
        AvantGearData.defineSchema()
      ];
      
      modelsWithUses.forEach(schema => {
        expect(schema.uses.fields).toContainKeys(['value', 'max']);
        expect(schema.uses.fields.value.min).toBe(0);
        expect(schema.uses.fields.max.min).toBe(0);
      });
    });

    test('should have consistent weight and cost constraints', () => {
      const modelsWithWeightCost = [
        AvantWeaponData.defineSchema(),
        AvantArmorData.defineSchema(),
        AvantGearData.defineSchema()
      ];
      
      modelsWithWeightCost.forEach(schema => {
        expect(schema.weight.min).toBe(0);
        expect(schema.cost.min).toBe(0);
        expect(schema.quantity.min).toBe(0);
      });
    });

    test('should have consistent power point cost constraints', () => {
      const modelsWithPowerPoints = [
        AvantActionData.defineSchema(),
        AvantFeatureData.defineSchema(),
        AvantTalentData.defineSchema()
      ];
      
      modelsWithPowerPoints.forEach(schema => {
        expect(schema.powerPointCost.min).toBe(0);
        expect(schema.powerPointCost.integer).toBe(true);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle schema generation without errors', () => {
      const modelClasses = [
        AvantActionData,
        AvantFeatureData,
        AvantTalentData,
        AvantAugmentData,
        AvantWeaponData,
        AvantArmorData,
        AvantGearData
      ];
      
      modelClasses.forEach(ModelClass => {
        expect(() => {
          ModelClass.defineSchema();
        }).not.toThrow();
      });
    });

    test('should maintain performance with repeated schema calls', () => {
      const startTime = Date.now();
      
      // Run schema generation many times
      for (let i = 0; i < 100; i++) {
        AvantActionData.defineSchema();
        AvantFeatureData.defineSchema();
        AvantTalentData.defineSchema();
        AvantAugmentData.defineSchema();
        AvantWeaponData.defineSchema();
        AvantArmorData.defineSchema();
        AvantGearData.defineSchema();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });

    test('should validate all models have required base fields', () => {
      const allSchemas = [
        { name: 'Action', schema: AvantActionData.defineSchema() },
        { name: 'Feature', schema: AvantFeatureData.defineSchema() },
        { name: 'Talent', schema: AvantTalentData.defineSchema() },
        { name: 'Augment', schema: AvantAugmentData.defineSchema() },
        { name: 'Weapon', schema: AvantWeaponData.defineSchema() },
        { name: 'Armor', schema: AvantArmorData.defineSchema() },
        { name: 'Gear', schema: AvantGearData.defineSchema() }
      ];
      
      // All models should have description field
      allSchemas.forEach(({ name, schema }) => {
        expect(schema).toContainKey('description');
      });
    });

    test('should ensure choice arrays are not empty', () => {
      const choiceFields = [
        { model: 'Action', field: AvantActionData.defineSchema().ability },
        { model: 'Feature', field: AvantFeatureData.defineSchema().category },
        { model: 'Augment', field: AvantAugmentData.defineSchema().augmentType },
        { model: 'Weapon', field: AvantWeaponData.defineSchema().range },
        { model: 'Armor', field: AvantArmorData.defineSchema().armorType },
        { model: 'Gear', field: AvantGearData.defineSchema().rarity }
      ];
      
      choiceFields.forEach(({ model, field }) => {
        expect(field.choices)
          .toBeArray()
          .not.toBeEmpty();
      });
    });
  });
}); 