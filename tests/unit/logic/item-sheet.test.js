/**
 * @fileoverview Unit tests for Item Sheet Logic (Pure Functions)
 * @description Tests for pure functions extracted from AvantItemSheet class
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// Import the functions we're going to test (will fail initially - TDD approach)
import { 
    executeRoll,
    processFormData,
    validateRollData,
    createRollMessage
} from '../../../scripts/logic/item-sheet.js';

describe('Item Sheet Logic - Pure Functions', () => {
    
    describe('validateRollData', () => {
        test('returns true for valid roll data with dice expression', () => {
            const rollData = {
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
            const rollData = {
                roll: '',
                label: 'Attack Roll'
            };
            
            const result = validateRollData(rollData);
            expect(result).toBe(false);
        });

        test('returns true even without label', () => {
            const rollData = {
                roll: '2d6'
            };
            
            const result = validateRollData(rollData);
            expect(result).toBe(true);
        });
    });

    describe('createRollMessage', () => {
        test('creates roll message with label when provided', () => {
            const rollData = {
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
            const rollData = {
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
            const rollData = {
                roll: '1d6'
            };
            const itemName = '';
            
            const result = createRollMessage(rollData, itemName);
            
            expect(result).toEqual({
                flavor: '',
                rollMode: 'publicroll'
            });
        });

        test('allows custom roll mode', () => {
            const rollData = {
                roll: '1d20',
                label: 'Secret Roll'
            };
            const itemName = 'Dagger';
            const rollMode = 'blindroll';
            
            const result = createRollMessage(rollData, itemName, rollMode);
            
            expect(result).toEqual({
                flavor: 'Secret Roll',
                rollMode: 'blindroll'
            });
        });
    });

    describe('executeRoll', () => {
        test('returns roll result for valid dice expression', () => {
            const rollData = {
                roll: '1d6+2',
                label: 'Damage Roll'
            };
            const itemData = { name: 'Sword' };
            
            const result = executeRoll(rollData, itemData);
            
            // Should return an object with roll info but no actual FoundryVTT dependencies
            expect(result).toHaveProperty('rollExpression', '1d6+2');
            expect(result).toHaveProperty('message');
            expect(result.message).toHaveProperty('flavor', 'Damage Roll');
            expect(result.message).toHaveProperty('rollMode', 'publicroll');
        });

        test('handles missing roll data gracefully', () => {
            const rollData = {};
            const itemData = { name: 'Sword' };
            
            const result = executeRoll(rollData, itemData);
            
            expect(result).toBeNull();
        });

        test('uses item name when no label provided', () => {
            const rollData = {
                roll: '2d8'
            };
            const itemData = { name: 'Battle Axe' };
            
            const result = executeRoll(rollData, itemData);
            
            expect(result).toHaveProperty('rollExpression', '2d8');
            expect(result.message).toHaveProperty('flavor', 'Battle Axe');
        });

        test('handles invalid roll expression', () => {
            const rollData = {
                roll: 'invalid-roll',
                label: 'Test'
            };
            const itemData = { name: 'Item' };
            
            const result = executeRoll(rollData, itemData);
            
            expect(result).toBeNull();
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
            const itemType = 'weapon';
            
            const result = processFormData(formData, itemType);
            
            expect(result).toEqual({
                system: {
                    damage: 10,
                    weight: 5.5,
                    description: 'A test item'
                },
                name: 'Test Item'
            });
        });

        test('preserves string values for non-numeric fields', () => {
            const formData = {
                'system.rarity': 'common',
                'system.type': 'melee',
                'name': 'Iron Sword'
            };
            const itemType = 'weapon';
            
            const result = processFormData(formData, itemType);
            
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
            const itemType = 'weapon';
            
            const result = processFormData(formData, itemType);
            
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
            const itemType = 'weapon';
            
            const result = processFormData(formData, itemType);
            
            expect(result).toEqual({});
        });

        test('handles different item types consistently', () => {
            const formData = {
                'system.level': '3',
                'system.school': 'evocation'
            };
            const itemType = 'spell';
            
            const result = processFormData(formData, itemType);
            
            expect(result).toEqual({
                system: {
                    level: 3,
                    school: 'evocation'
                }
            });
        });
    });
}); 