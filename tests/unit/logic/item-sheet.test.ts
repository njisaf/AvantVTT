/**
 * @fileoverview Unit tests for Item Sheet Logic (Pure Functions)
 * @description Tests for pure functions extracted from AvantItemSheet class
 */

import { describe, test, expect } from '@jest/globals';

// Import the functions we're going to test (will fail initially - TDD approach)
import { 
    executeRoll,
    processFormData,
    validateRollData,
    createRollMessage
} from '../../../scripts/logic/item-sheet.ts';

// Type imports for testing
import type { RollData, ItemData, RollMode } from '../../../scripts/logic/item-sheet.ts';

describe('Item Sheet Logic - Pure Functions', () => {
    
    describe('validateRollData', () => {
        test('returns true for valid roll data with dice expression', () => {
            const rollData: RollData = {
                roll: '1d20+5',
                label: 'Attack Roll'
            };
            
            const result = validateRollData(rollData);
            expect(result).toBe(true);
        });

        test('returns false for missing roll expression', () => {
            const rollData = {
                label: 'Attack Roll'
            };
            
            const result = validateRollData(rollData);
            expect(result).toBe(false);
        });

        test('returns false for empty roll expression', () => {
            const rollData: RollData = {
                roll: '',
                label: 'Attack Roll'
            };
            
            const result = validateRollData(rollData);
            expect(result).toBe(false);
        });

        test('returns false for whitespace-only roll expression', () => {
            const rollData: RollData = {
                roll: '   ',
                label: 'Attack Roll'
            };
            
            const result = validateRollData(rollData);
            expect(result).toBe(false);
        });

        test('returns true even without label', () => {
            const rollData: RollData = {
                roll: '2d6'
            };
            
            const result = validateRollData(rollData);
            expect(result).toBe(true);
        });

        test('returns false for null input', () => {
            const result = validateRollData(null);
            expect(result).toBe(false);
        });

        test('returns false for undefined input', () => {
            const result = validateRollData(undefined);
            expect(result).toBe(false);
        });

        test('returns false for non-object input', () => {
            const result = validateRollData('not an object' as unknown);
            expect(result).toBe(false);
        });

        test('returns false for non-string roll property', () => {
            const rollData = {
                roll: 123,
                label: 'Attack Roll'
            };
            
            const result = validateRollData(rollData as unknown);
            expect(result).toBe(false);
        });
    });

    describe('createRollMessage', () => {
        test('creates roll message with label when provided', () => {
            const rollData: RollData = {
                roll: '1d20+5',
                label: 'Attack Roll'
            };
            const itemName = 'Sword';
            
            const result = createRollMessage(rollData, itemName);
            
            expect(result).toEqual({
                flavor: 'Attack Roll',
                rollMode: 'publicroll' // default mode
            });
        });

        test('uses item name as flavor when no label provided', () => {
            const rollData: RollData = {
                roll: '2d6'
            };
            const itemName = 'Magic Sword';
            
            const result = createRollMessage(rollData, itemName);
            
            expect(result).toEqual({
                flavor: 'Magic Sword',
                rollMode: 'publicroll'
            });
        });

        test('handles empty item name gracefully', () => {
            const rollData: RollData = {
                roll: '1d6'
            };
            const itemName = '';
            
            const result = createRollMessage(rollData, itemName);
            
            expect(result).toEqual({
                flavor: '',
                rollMode: 'publicroll'
            });
        });

        test('handles undefined item name gracefully', () => {
            const rollData: RollData = {
                roll: '1d6'
            };
            const itemName = undefined;
            
            const result = createRollMessage(rollData, itemName);
            
            expect(result).toEqual({
                flavor: '',
                rollMode: 'publicroll'
            });
        });

        test('allows custom roll mode', () => {
            const rollData: RollData = {
                roll: '1d20',
                label: 'Secret Roll'
            };
            const itemName = 'Dagger';
            const rollMode: RollMode = 'blindroll';
            
            const result = createRollMessage(rollData, itemName, rollMode);
            
            expect(result).toEqual({
                flavor: 'Secret Roll',
                rollMode: 'blindroll'
            });
        });

        test('supports all roll modes', () => {
            const rollData: RollData = {
                roll: '1d20',
                label: 'Test Roll'
            };
            const itemName = 'Test Item';
            const rollModes: RollMode[] = ['publicroll', 'blindroll', 'gmroll', 'selfroll'];
            
            rollModes.forEach(mode => {
                const result = createRollMessage(rollData, itemName, mode);
                expect(result.rollMode).toBe(mode);
            });
        });
    });

    describe('executeRoll', () => {
        test('returns roll result for valid dice expression', () => {
            const rollData: RollData = {
                roll: '1d6+2',
                label: 'Damage Roll'
            };
            const itemData: ItemData = { name: 'Sword' };
            
            const result = executeRoll(rollData, itemData);
            
            // Should return an object with roll info but no actual FoundryVTT dependencies
            expect(result).toHaveProperty('rollExpression', '1d6+2');
            expect(result).toHaveProperty('message');
            expect(result!.message).toHaveProperty('flavor', 'Damage Roll');
            expect(result!.message).toHaveProperty('rollMode', 'publicroll');
        });

        test('handles missing roll data gracefully', () => {
            const rollData = {};
            const itemData: ItemData = { name: 'Sword' };
            
            const result = executeRoll(rollData, itemData);
            
            expect(result).toBeNull();
        });

        test('uses item name when no label provided', () => {
            const rollData: RollData = {
                roll: '2d8'
            };
            const itemData: ItemData = { name: 'Battle Axe' };
            
            const result = executeRoll(rollData, itemData);
            
            expect(result).toHaveProperty('rollExpression', '2d8');
            expect(result!.message).toHaveProperty('flavor', 'Battle Axe');
        });

        test('handles invalid roll expression', () => {
            const rollData: RollData = {
                roll: 'invalid-roll',
                label: 'Test'
            };
            const itemData: ItemData = { name: 'Item' };
            
            const result = executeRoll(rollData, itemData);
            
            expect(result).toBeNull();
        });

        test('handles malicious roll expression', () => {
            const rollData: RollData = {
                roll: 'alert("xss")',
                label: 'Test'
            };
            const itemData: ItemData = { name: 'Item' };
            
            const result = executeRoll(rollData, itemData);
            
            expect(result).toBeNull();
        });

        test('allows valid complex dice expressions', () => {
            const validExpressions = [
                '1d20+5',
                '2d6-1',
                '1d8*2',
                '1d10/2',
                '(1d6+2)*3',
                '4d6 + 3',
                '1D20 + 5' // case insensitive
            ];

            validExpressions.forEach(roll => {
                const rollData: RollData = { roll };
                const itemData: ItemData = { name: 'Test Item' };
                
                const result = executeRoll(rollData, itemData);
                
                expect(result).not.toBeNull();
                expect(result!.rollExpression).toBe(roll.trim());
            });
        });

        test('rejects invalid dice expressions', () => {
            const invalidExpressions = [
                'eval(malicious)',
                'function() { return 1; }',
                '1d20; alert("xss")',
                '1d20<script>',
                'rm -rf /',
                'SELECT * FROM users',
                '1d20 && true',
                '1d20 || false'
            ];

            invalidExpressions.forEach(roll => {
                const rollData: RollData = { roll };
                const itemData: ItemData = { name: 'Test Item' };
                
                const result = executeRoll(rollData, itemData);
                
                expect(result).toBeNull();
            });
        });

        test('handles undefined item data gracefully', () => {
            const rollData: RollData = {
                roll: '1d6',
                label: 'Test Roll'
            };
            
            const result = executeRoll(rollData, undefined);
            
            expect(result).toHaveProperty('rollExpression', '1d6');
            expect(result!.message).toHaveProperty('flavor', 'Test Roll');
        });

        test('handles item data without name', () => {
            const rollData: RollData = {
                roll: '1d6'
            };
            const itemData = {} as ItemData;
            
            const result = executeRoll(rollData, itemData);
            
            expect(result).toHaveProperty('rollExpression', '1d6');
            expect(result!.message).toHaveProperty('flavor', '');
        });
    });

    describe('processFormData', () => {
        test('converts numeric strings to numbers for system properties', () => {
            const formData = {
                'system.damage': '10',
                'system.weight': '5.5',
                'name': 'Test Item',
                'system.description': 'A test item'
            };
            
            const result = processFormData(formData);
            
            expect(result).toEqual({
                system: {
                    damage: 10,
                    weight: 5.5,
                    description: 'A test item'
                },
                name: 'Test Item'
            });
        });

        test('converts boolean strings to booleans', () => {
            const formData = {
                'system.magical': 'true',
                'system.cursed': 'false',
                'system.identified': 'true'
            };
            
            const result = processFormData(formData);
            
            expect(result).toEqual({
                system: {
                    magical: true,
                    cursed: false,
                    identified: true
                }
            });
        });

        test('preserves string values for non-numeric fields', () => {
            const formData = {
                'system.rarity': 'common',
                'system.type': 'melee',
                'name': 'Iron Sword'
            };
            
            const result = processFormData(formData);
            
            expect(result).toEqual({
                system: {
                    rarity: 'common',
                    type: 'melee'
                },
                name: 'Iron Sword'
            });
        });

        test('handles nested object structure correctly', () => {
            const formData = {
                'system.properties.magical': 'true',
                'system.cost.value': '100',
                'system.cost.currency': 'gp'
            };
            
            const result = processFormData(formData);
            
            expect(result).toEqual({
                system: {
                    properties: {
                        magical: true
                    },
                    cost: {
                        value: 100,
                        currency: 'gp'
                    }
                }
            });
        });

        test('handles empty form data', () => {
            const formData = {};
            
            const result = processFormData(formData);
            
            expect(result).toEqual({});
        });

        test('handles null form data', () => {
            const formData = null;
            
            const result = processFormData(formData);
            
            expect(result).toEqual({});
        });

        test('handles undefined form data', () => {
            const formData = undefined;
            
            const result = processFormData(formData);
            
            expect(result).toEqual({});
        });

        test('handles different item types consistently', () => {
            const formData = {
                'system.level': '3',
                'system.school': 'evocation'
            };
            
            const result = processFormData(formData);
            
            expect(result).toEqual({
                system: {
                    level: 3,
                    school: 'evocation'
                }
            });
        });

        test('handles deeply nested structures', () => {
            const formData = {
                'system.stats.combat.damage.base': '10',
                'system.stats.combat.damage.bonus': '2',
                'system.stats.attributes.strength': '15'
            };
            
            const result = processFormData(formData);
            
            expect(result).toEqual({
                system: {
                    stats: {
                        combat: {
                            damage: {
                                base: 10,
                                bonus: 2
                            }
                        },
                        attributes: {
                            strength: 15
                        }
                    }
                }
            });
        });

        test('handles negative numbers', () => {
            const formData = {
                'system.modifier': '-2',
                'system.temperature': '-10.5'
            };
            
            const result = processFormData(formData);
            
            expect(result).toEqual({
                system: {
                    modifier: -2,
                    temperature: -10.5
                }
            });
        });

        test('preserves non-string values unchanged', () => {
            const formData = {
                'system.existingNumber': 42,
                'system.existingBoolean': true,
                'system.existingObject': { nested: 'value' }
            };
            
            const result = processFormData(formData);
            
            expect(result).toEqual({
                system: {
                    existingNumber: 42,
                    existingBoolean: true,
                    existingObject: { nested: 'value' }
                }
            });
        });

        test('handles edge case numeric strings', () => {
            const formData = {
                'system.zero': '0',
                'system.float': '3.14159',
                'system.leadingZero': '007',
                'system.notNumber': '12abc',
                'system.empty': '',
                'system.justDot': '.'
            };
            
            const result = processFormData(formData);
            
            expect(result).toEqual({
                system: {
                    zero: 0,
                    float: 3.14159,
                    leadingZero: 7,
                    notNumber: '12abc',
                    empty: '',
                    justDot: '.'
                }
            });
        });
    });
});