/**
 * @fileoverview Role Utility Framework Unit Tests
 * @description Comprehensive test suite for the Role Utility Framework using Jest
 * @version 1.0.0
 * @author Avant Development Team
 */

import '../../../tests/env/foundry-shim.js';

describe('Role Utility Framework', () => {
  let mockRoll, mockChatMessage;

  beforeEach(() => {
    // Setup mock Roll and ChatMessage
    mockRoll = {
      evaluate: jest.fn().mockResolvedValue(undefined),
      toMessage: jest.fn().mockResolvedValue(undefined),
      total: 15
    };

    mockChatMessage = {
      getSpeaker: jest.fn().mockReturnValue({ alias: 'Test Actor' })
    };

    // Setup FoundryVTT globals
    global.Roll = jest.fn(() => mockRoll);
    global.ChatMessage = mockChatMessage;
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up globals
    delete global.Roll;
    delete global.ChatMessage;
  });

  describe('Validation Functions', () => {
    let validateDiceExpression, validateModifiers, validateRollConfiguration;

    beforeEach(async () => {
      const module = await import('../../../scripts/logic/rolls-utils.js');
      validateDiceExpression = module.validateDiceExpression;
      validateModifiers = module.validateModifiers;
      validateRollConfiguration = module.validateRollConfiguration;
    });

    describe('validateDiceExpression', () => {
      it('should validate simple dice expressions', () => {
        expect(validateDiceExpression('2d10')).toEqual({ valid: true });
        expect(validateDiceExpression('1d20')).toEqual({ valid: true });
        expect(validateDiceExpression('d6')).toEqual({ valid: true });
        expect(validateDiceExpression('3d8')).toEqual({ valid: true });
      });

      it('should validate complex dice expressions', () => {
        expect(validateDiceExpression('2d10 + 5')).toEqual({ valid: true });
        expect(validateDiceExpression('1d20 - 2')).toEqual({ valid: true });
        expect(validateDiceExpression('2d6 + 1d4')).toEqual({ valid: true });
        expect(validateDiceExpression('3d8 + 2 - 1')).toEqual({ valid: true });
      });

      it('should reject invalid dice expressions', () => {
        expect(validateDiceExpression('').valid).toBe(false);
        expect(validateDiceExpression('   ').valid).toBe(false);
        expect(validateDiceExpression('invalid').valid).toBe(false);
        expect(validateDiceExpression('2x10').valid).toBe(false);
        expect(validateDiceExpression('d').valid).toBe(false);
        expect(validateDiceExpression('2d').valid).toBe(false);
      });

      it('should reject non-string inputs', () => {
        expect(validateDiceExpression(null).valid).toBe(false);
        expect(validateDiceExpression(undefined).valid).toBe(false);
        expect(validateDiceExpression(123).valid).toBe(false);
        expect(validateDiceExpression({}).valid).toBe(false);
      });
    });

    describe('validateModifiers', () => {
      it('should validate valid modifier arrays', () => {
        const modifiers = [
          { label: 'Attribute', value: 3 },
          { label: 'Level', value: 2 }
        ];
        const result = validateModifiers(modifiers);
        expect(result.valid).toBe(true);
        expect(result.warnings).toBeUndefined();
      });

      it('should reject invalid modifier structures', () => {
        expect(validateModifiers([{ label: 'Test' }]).valid).toBe(false);
        expect(validateModifiers([{ value: 5 }]).valid).toBe(false);
        expect(validateModifiers([{ label: 123, value: 5 }]).valid).toBe(false);
        expect(validateModifiers([{ label: 'Test', value: 'invalid' }]).valid).toBe(false);
      });

      it('should warn about unusual values', () => {
        const modifiers = [
          { label: 'Huge Bonus', value: 150 },
          { label: 'Empty', value: 0 }
        ];
        const result = validateModifiers(modifiers);
        expect(result.valid).toBe(true);
        expect(result.warnings).toContain('Modifier at index 0 has unusually large value: 150');
      });

      it('should warn about empty labels', () => {
        const modifiers = [
          { label: '', value: 5 },
          { label: '   ', value: 3 }
        ];
        const result = validateModifiers(modifiers);
        expect(result.valid).toBe(true);
        expect(result.warnings).toContain('Modifier at index 0 has empty label');
        expect(result.warnings).toContain('Modifier at index 1 has empty label');
      });

      it('should reject non-array inputs', () => {
        expect(validateModifiers(null).valid).toBe(false);
        expect(validateModifiers(undefined).valid).toBe(false);
        expect(validateModifiers('invalid').valid).toBe(false);
        expect(validateModifiers({}).valid).toBe(false);
      });
    });

    describe('validateRollConfiguration', () => {
      it('should validate complete roll configurations', () => {
        const modifiers = [
          { label: 'Attribute', value: 3 },
          { label: 'Level', value: 2 }
        ];
        const result = validateRollConfiguration('2d10', modifiers);
        expect(result.valid).toBe(true);
      });

      it('should reject configurations with invalid dice', () => {
        const modifiers = [{ label: 'Attribute', value: 3 }];
        const result = validateRollConfiguration('invalid', modifiers);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid dice expression');
      });

      it('should reject configurations with invalid modifiers', () => {
        const result = validateRollConfiguration('2d10', [{ label: 'Test' }]);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid modifiers');
      });
    });
  });

  describe('Calculation Functions', () => {
    let calculateTotalModifier, formatModifierBreakdown, generateRollFormula, generateTooltip;

    beforeEach(async () => {
      const module = await import('../../../scripts/logic/rolls-utils.js');
      calculateTotalModifier = module.calculateTotalModifier;
      formatModifierBreakdown = module.formatModifierBreakdown;
      generateRollFormula = module.generateRollFormula;
      generateTooltip = module.generateTooltip;
    });

    describe('calculateTotalModifier', () => {
      it('should calculate total from positive modifiers', () => {
        const modifiers = [
          { label: 'Attribute', value: 3 },
          { label: 'Level', value: 2 },
          { label: 'Gear', value: 1 }
        ];
        expect(calculateTotalModifier(modifiers)).toBe(6);
      });

      it('should calculate total from mixed modifiers', () => {
        const modifiers = [
          { label: 'Attribute', value: 3 },
          { label: 'Penalty', value: -2 },
          { label: 'Gear', value: 1 }
        ];
        expect(calculateTotalModifier(modifiers)).toBe(2);
      });

      it('should handle empty modifier arrays', () => {
        expect(calculateTotalModifier([])).toBe(0);
      });

      it('should handle zero values', () => {
        const modifiers = [
          { label: 'Zero', value: 0 },
          { label: 'Positive', value: 5 }
        ];
        expect(calculateTotalModifier(modifiers)).toBe(5);
      });
    });

    describe('formatModifierBreakdown', () => {
      it('should format positive modifiers', () => {
        const modifiers = [
          { label: 'Attribute', value: 3 },
          { label: 'Level', value: 2 }
        ];
        expect(formatModifierBreakdown(modifiers)).toBe('+3 (Attribute) +2 (Level)');
      });

      it('should format negative modifiers', () => {
        const modifiers = [
          { label: 'Attribute', value: 3 },
          { label: 'Penalty', value: -2 }
        ];
        expect(formatModifierBreakdown(modifiers)).toBe('+3 (Attribute) -2 (Penalty)');
      });

      it('should handle empty arrays', () => {
        expect(formatModifierBreakdown([])).toBe('');
      });

      it('should handle zero values', () => {
        const modifiers = [
          { label: 'Zero', value: 0 },
          { label: 'Positive', value: 5 }
        ];
        expect(formatModifierBreakdown(modifiers)).toBe('+0 (Zero) +5 (Positive)');
      });
    });

    describe('generateRollFormula', () => {
      it('should generate formula with positive modifiers', () => {
        const modifiers = [
          { label: 'Attribute', value: 3 },
          { label: 'Level', value: 2 }
        ];
        expect(generateRollFormula('2d10', modifiers)).toBe('2d10 + 5');
      });

      it('should generate formula with negative modifiers', () => {
        const modifiers = [
          { label: 'Attribute', value: 3 },
          { label: 'Penalty', value: -5 }
        ];
        expect(generateRollFormula('2d10', modifiers)).toBe('2d10 - 2');
      });

      it('should handle zero total modifier', () => {
        const modifiers = [
          { label: 'Positive', value: 3 },
          { label: 'Negative', value: -3 }
        ];
        expect(generateRollFormula('2d10', modifiers)).toBe('2d10');
      });

      it('should handle empty modifier arrays', () => {
        expect(generateRollFormula('2d10', [])).toBe('2d10');
      });
    });

    describe('generateTooltip', () => {
      it('should generate tooltip with breakdown', () => {
        const modifiers = [
          { label: 'Attribute', value: 3 },
          { label: 'Level', value: 2 }
        ];
        expect(generateTooltip('2d10', modifiers, true)).toBe('2d10 +3 (Attribute) +2 (Level)');
      });

      it('should generate tooltip without breakdown', () => {
        const modifiers = [
          { label: 'Attribute', value: 3 },
          { label: 'Level', value: 2 }
        ];
        expect(generateTooltip('2d10', modifiers, false)).toBe('2d10 + 5');
      });

      it('should handle empty modifier arrays', () => {
        expect(generateTooltip('2d10', [], true)).toBe('2d10');
        expect(generateTooltip('2d10', [], false)).toBe('2d10');
      });
    });
  });

  describe('Core Roll Payload Function', () => {
    let buildRollPayload;

    beforeEach(async () => {
      const module = await import('../../../scripts/logic/rolls-utils.js');
      buildRollPayload = module.buildRollPayload;
    });

    describe('buildRollPayload', () => {
      it('should build basic roll payload', () => {
        const modifiers = [
          { label: 'Attribute', value: 3 },
          { label: 'Level', value: 2 }
        ];
        
        const payload = buildRollPayload('2d10', modifiers);
        
        expect(payload.formula).toBe('2d10 + 5');
        expect(payload.tooltip).toBe('2d10 +3 (Attribute) +2 (Level)');
        expect(payload.total).toBe(5);
        expect(payload.baseDice).toBe('2d10');
        expect(payload.modifiers).toEqual(modifiers);
        expect(typeof payload.sendToChat).toBe('function');
        expect(typeof payload.createRoll).toBe('function');
      });

      it('should handle empty modifier arrays', () => {
        const payload = buildRollPayload('2d10', []);
        
        expect(payload.formula).toBe('2d10');
        expect(payload.tooltip).toBe('2d10');
        expect(payload.total).toBe(0);
        expect(payload.modifiers).toEqual([]);
      });

      it('should handle options parameter', () => {
        const modifiers = [{ label: 'Attribute', value: 3 }];
        const options = {
          flavor: 'Test Roll',
          showModifierBreakdown: false
        };
        
        const payload = buildRollPayload('2d10', modifiers, options);
        
        expect(payload.tooltip).toBe('2d10 + 3');
      });

      it('should create working Roll objects', () => {
        const payload = buildRollPayload('2d10', []);
        const roll = payload.createRoll();
        
        expect(roll).toBe(mockRoll);
        expect(global.Roll).toHaveBeenCalledWith('2d10', {});
      });

      it('should create working chat handlers', async () => {
        const payload = buildRollPayload('2d10', []);
        
        await payload.sendToChat();
        
        expect(mockRoll.evaluate).toHaveBeenCalled();
        expect(mockRoll.toMessage).toHaveBeenCalledWith({
          flavor: 'Roll'
        });
      });

      it('should throw error for invalid configuration', () => {
        expect(() => buildRollPayload('invalid', [])).toThrow('Invalid roll configuration');
      });

      it('should not mutate input modifiers', () => {
        const modifiers = [{ label: 'Attribute', value: 3 }];
        const originalModifiers = [...modifiers];
        
        const payload = buildRollPayload('2d10', modifiers);
        
        expect(modifiers).toEqual(originalModifiers);
        expect(payload.modifiers).not.toBe(modifiers);
      });
    });
  });

  describe('Specialized Roll Builders', () => {
    let buildSkillRoll, buildWeaponAttackRoll, buildWeaponDamageRoll, buildArmorRoll, buildGenericRoll;

    beforeEach(async () => {
      const module = await import('../../../scripts/logic/rolls-utils.js');
      buildSkillRoll = module.buildSkillRoll;
      buildWeaponAttackRoll = module.buildWeaponAttackRoll;
      buildWeaponDamageRoll = module.buildWeaponDamageRoll;
      buildArmorRoll = module.buildArmorRoll;
      buildGenericRoll = module.buildGenericRoll;
    });

    describe('buildSkillRoll', () => {
      it('should build skill roll from actor data', () => {
        const actorData = {
          system: {
            skills: {
              force: 3  // might-based skill
            },
            attributes: {
              might: { modifier: 2 }
            },
            level: 5
          }
        };
        
        const payload = buildSkillRoll('force', actorData);
        
        expect(payload.formula).toBe('2d10 + 10');
        expect(payload.modifiers).toEqual([
          { label: 'Level', value: 5 },
          { label: 'Attribute', value: 2 },
          { label: 'Skill', value: 3 }
        ]);
      });

      it('should throw error for missing skill', () => {
        const actorData = { system: { skills: {} } };
        
        expect(() => buildSkillRoll('missing', actorData)).toThrow("Skill 'missing' not found");
      });
    });

    describe('buildWeaponAttackRoll', () => {
      it('should build weapon attack roll', () => {
        const weaponItem = {
          name: 'Iron Sword',
          system: {
            attribute: 'might',
            modifier: 2
          }
        };
        
        const actorData = {
          system: {
            attributes: {
              might: { mod: 3 }
            },
            level: 5
          }
        };
        
        const payload = buildWeaponAttackRoll(weaponItem, actorData);
        
        expect(payload.formula).toBe('2d10 + 10');
        expect(payload.modifiers).toEqual([
          { label: 'Level', value: 5 },
          { label: 'Attribute', value: 3 },
          { label: 'Weapon', value: 2 }
        ]);
      });

      it('should use default values for missing data', () => {
        const weaponItem = { name: 'Basic Weapon', system: {} };
        const actorData = { system: {} };
        
        const payload = buildWeaponAttackRoll(weaponItem, actorData);
        
        expect(payload.formula).toBe('2d10 + 1');
        expect(payload.modifiers).toEqual([
          { label: 'Level', value: 1 },
          { label: 'Attribute', value: 0 },
          { label: 'Weapon', value: 0 }
        ]);
      });
    });

    describe('buildWeaponDamageRoll', () => {
      it('should build weapon damage roll', () => {
        const weaponItem = {
          name: 'Iron Sword',
          system: {
            damageDie: '1d8',
            attribute: 'might',
            damageType: 'slashing'
          }
        };
        
        const actorData = {
          system: {
            attributes: {
              might: { mod: 3 }
            }
          }
        };
        
        const payload = buildWeaponDamageRoll(weaponItem, actorData);
        
        expect(payload.formula).toBe('1d8 + 3');
        expect(payload.modifiers).toEqual([
          { label: 'Attribute', value: 3 }
        ]);
      });

      it('should use default damage die', () => {
        const weaponItem = { name: 'Basic Weapon', system: {} };
        const actorData = { system: {} };
        
        const payload = buildWeaponDamageRoll(weaponItem, actorData);
        
        expect(payload.formula).toBe('1d6');
        expect(payload.modifiers).toEqual([
          { label: 'Attribute', value: 0 }
        ]);
      });
    });

    describe('buildArmorRoll', () => {
      it('should build armor roll', () => {
        const armorItem = {
          name: 'Leather Armor',
          system: {
            attribute: 'grace',
            modifier: 1
          }
        };
        
        const actorData = {
          system: {
            attributes: {
              grace: { mod: 2 }
            },
            level: 3
          }
        };
        
        const payload = buildArmorRoll(armorItem, actorData);
        
        expect(payload.formula).toBe('2d10 + 6');
        expect(payload.modifiers).toEqual([
          { label: 'Level', value: 3 },
          { label: 'Attribute', value: 2 },
          { label: 'Armor', value: 1 }
        ]);
      });
    });

    describe('buildGenericRoll', () => {
      it('should build generic roll from dataset', () => {
        const dataset = {
          roll: '1d20 + 5',
          label: 'Saving Throw'
        };
        
        const payload = buildGenericRoll(dataset);
        
        expect(payload.formula).toBe('1d20 + 5');
        expect(payload.modifiers).toEqual([]);
      });

      it('should throw error for missing roll expression', () => {
        const dataset = { label: 'Test' };
        
        expect(() => buildGenericRoll(dataset)).toThrow('No roll expression found');
      });

      it('should handle empty dataset', () => {
        const dataset = {};
        
        expect(() => buildGenericRoll(dataset)).toThrow('No roll expression found');
      });
    });
  });

  describe('Performance Benchmarks', () => {
    let buildRollPayload;

    beforeEach(async () => {
      const module = await import('../../../scripts/logic/rolls-utils.js');
      buildRollPayload = module.buildRollPayload;
    });

    describe('buildRollPayload Performance', () => {
      it('should execute within 1ms on average', () => {
        const modifiers = [
          { label: 'Attribute', value: 3 },
          { label: 'Level', value: 2 },
          { label: 'Gear', value: 1 }
        ];
        
        const iterations = 1000;
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
          buildRollPayload('2d10', modifiers);
        }
        
        const end = performance.now();
        const averageTime = (end - start) / iterations;
        
        expect(averageTime).toBeLessThan(1.0);
      });
    });

    describe('Complex Modifier Arrays', () => {
      it('should handle large modifier arrays efficiently', () => {
        const modifiers = [];
        for (let i = 0; i < 100; i++) {
          modifiers.push({ label: `Modifier ${i}`, value: i % 10 });
        }
        
        const start = performance.now();
        const payload = buildRollPayload('2d10', modifiers);
        const end = performance.now();
        
        expect(end - start).toBeLessThan(1.0);
        expect(payload.modifiers).toHaveLength(100);
      });
    });
  });
});