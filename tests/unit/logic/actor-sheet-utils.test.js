/**
 * @fileoverview Actor Sheet Utils Tests - Additional Pure Functions
 * @description Unit tests for additional actor sheet utility functions
 * @version 2.0.0
 * @author Avant Development Team
 */

import { describe, test, expect } from '@jest/globals';
import {
    prepareItemData,
    validatePowerPointUsage,
    prepareWeaponAttackRoll,
    prepareWeaponDamageRoll,
    prepareArmorRoll,
    prepareGenericRoll,
    extractItemIdFromElement,
    formatFlavorText,
    extractCombatItemId
} from '../../../scripts/logic/actor-sheet-utils.js';

describe('Actor Sheet Utils - Pure Functions', () => {
    describe('prepareItemData', () => {
        test('should create basic item data structure', () => {
            const result = prepareItemData('weapon', { type: 'weapon' });
            
            expect(result).toEqual({
                name: 'New Weapon',
                type: 'weapon',
                system: {}
            });
        });

        test('should handle feature category', () => {
            const result = prepareItemData('feature', { category: 'racial' });
            
            expect(result).toEqual({
                name: 'New Feature',
                type: 'feature',
                system: { category: 'racial' }
            });
        });

        test('should set default ability for actions', () => {
            const result = prepareItemData('action', {});
            
            expect(result).toEqual({
                name: 'New Action',
                type: 'action',
                system: { ability: 'might' }
            });
        });

        test('should set default augment type', () => {
            const result = prepareItemData('augment', {});
            
            expect(result).toEqual({
                name: 'New Augment',
                type: 'augment',
                system: { augmentType: 'enhancement' }
            });
        });

        test('should exclude type from system data', () => {
            const result = prepareItemData('weapon', { type: 'weapon', damage: '1d8' });
            
            expect(result.system).toEqual({ damage: '1d8' });
            expect(result.system.type).toBeUndefined();
        });
    });

    describe('validatePowerPointUsage', () => {
        test('should validate sufficient power points', () => {
            const result = validatePowerPointUsage(5, 3);
            
            expect(result).toEqual({
                valid: true,
                remaining: 2,
                cost: 3
            });
        });

        test('should reject insufficient power points', () => {
            const result = validatePowerPointUsage(2, 5);
            
            expect(result).toEqual({
                valid: false,
                remaining: 2,
                cost: 5,
                error: 'Not enough Power Points! Need 5, have 2'
            });
        });

        test('should handle zero current power points', () => {
            const result = validatePowerPointUsage(0, 1);
            
            expect(result).toEqual({
                valid: false,
                remaining: 0,
                cost: 1,
                error: 'Not enough Power Points! Need 1, have 0'
            });
        });

        test('should handle invalid inputs', () => {
            const result = validatePowerPointUsage('invalid', 'also invalid');
            
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid power point values');
        });
    });

    describe('prepareWeaponAttackRoll', () => {
        test('should prepare weapon attack roll data', () => {
            const weapon = {
                name: 'Iron Sword',
                system: { ability: 'might', modifier: 2 }
            };
            const actor = {
                system: { 
                    level: 3,
                    abilities: { might: { mod: 1 } }
                }
            };

            const result = prepareWeaponAttackRoll(weapon, actor);
            
            expect(result).toEqual({
                rollExpression: '2d10 + @level + @abilityMod + @weaponMod',
                rollData: {
                    level: 3,
                    abilityMod: 1,
                    weaponMod: 2
                },
                flavor: 'Iron Sword Attack'
            });
        });

        test('should use default ability if not specified', () => {
            const weapon = {
                name: 'Staff',
                system: {}
            };
            const actor = {
                system: { 
                    level: 2,
                    abilities: { might: { mod: 0 } }
                }
            };

            const result = prepareWeaponAttackRoll(weapon, actor);
            
            expect(result.rollData.abilityMod).toBe(0);
        });

        test('should handle missing ability data', () => {
            const weapon = {
                name: 'Bow',
                system: { ability: 'grace' }
            };
            const actor = {
                system: { 
                    level: 1,
                    abilities: {}
                }
            };

            const result = prepareWeaponAttackRoll(weapon, actor);
            
            expect(result.rollData.abilityMod).toBe(0);
        });
    });

    describe('prepareWeaponDamageRoll', () => {
        test('should prepare weapon damage roll data', () => {
            const weapon = {
                name: 'Iron Sword',
                system: { 
                    damageDie: '1d8',
                    ability: 'might',
                    damageType: 'slashing'
                }
            };
            const actor = {
                system: { 
                    abilities: { might: { mod: 2 } }
                }
            };

            const result = prepareWeaponDamageRoll(weapon, actor);
            
            expect(result).toEqual({
                rollExpression: '1d8 + @abilityMod',
                rollData: { abilityMod: 2 },
                flavor: 'Iron Sword Damage (slashing)'
            });
        });

        test('should handle missing damage type', () => {
            const weapon = {
                name: 'Club',
                system: { damageDie: '1d6' }
            };
            const actor = {
                system: { abilities: { might: { mod: 1 } } }
            };

            const result = prepareWeaponDamageRoll(weapon, actor);
            
            expect(result.flavor).toBe('Club Damage');
        });

        test('should use default damage die', () => {
            const weapon = {
                name: 'Improvised Weapon',
                system: {}
            };
            const actor = {
                system: { abilities: { might: { mod: 0 } } }
            };

            const result = prepareWeaponDamageRoll(weapon, actor);
            
            expect(result.rollExpression).toBe('1d6 + @abilityMod');
        });
    });

    describe('prepareArmorRoll', () => {
        test('should prepare armor roll data', () => {
            const armor = {
                name: 'Leather Armor',
                system: { ability: 'grace', modifier: 1 }
            };
            const actor = {
                system: { 
                    level: 2,
                    abilities: { grace: { mod: 3 } }
                }
            };

            const result = prepareArmorRoll(armor, actor);
            
            expect(result).toEqual({
                rollExpression: '2d10 + @level + @abilityMod + @armorMod',
                rollData: {
                    level: 2,
                    abilityMod: 3,
                    armorMod: 1
                },
                flavor: 'Leather Armor Armor Check'
            });
        });

        test('should use default grace ability', () => {
            const armor = {
                name: 'Shield',
                system: {}
            };
            const actor = {
                system: { 
                    level: 1,
                    abilities: { grace: { mod: 2 } }
                }
            };

            const result = prepareArmorRoll(armor, actor);
            
            expect(result.rollData.abilityMod).toBe(2);
        });
    });

    describe('prepareGenericRoll', () => {
        test('should prepare generic roll from dataset', () => {
            const dataset = {
                roll: '1d20+5',
                label: 'Initiative'
            };

            const result = prepareGenericRoll(dataset);
            
            expect(result).toEqual({
                rollExpression: '1d20+5',
                flavor: 'Initiative'
            });
        });

        test('should handle missing label', () => {
            const dataset = { roll: '1d6' };

            const result = prepareGenericRoll(dataset);
            
            expect(result).toEqual({
                rollExpression: '1d6',
                flavor: ''
            });
        });

        test('should return null for missing roll', () => {
            const dataset = { label: 'Test' };

            const result = prepareGenericRoll(dataset);
            
            expect(result).toBeNull();
        });
    });

    describe('extractItemIdFromElement', () => {
        test('should extract item ID from element with direct data-item-id (combat buttons)', () => {
            const mockElement = {
                dataset: { itemId: 'combat-item-123' },
                closest: jest.fn()
            };

            const result = extractItemIdFromElement(mockElement);
            
            expect(result).toBe('combat-item-123');
            // Should not need to call closest since data-item-id is directly on element
        });

        test('should extract item ID from closest .item element (gear tab)', () => {
            const mockElement = {
                // No direct dataset
                closest: jest.fn().mockImplementation((selector) => {
                    if (selector === '.item') {
                        return { dataset: { itemId: 'gear-item-456' } };
                    }
                    return null;
                })
            };

            const result = extractItemIdFromElement(mockElement);
            
            expect(result).toBe('gear-item-456');
        });

        test('should extract item ID from closest .combat-item element', () => {
            const mockElement = {
                // No direct dataset
                closest: jest.fn().mockImplementation((selector) => {
                    if (selector === '.combat-item') {
                        return { dataset: { itemId: 'combat-item-789' } };
                    }
                    return null;
                })
            };

            const result = extractItemIdFromElement(mockElement);
            
            expect(result).toBe('combat-item-789');
        });

        test('should return null if no .item or .combat-item element found', () => {
            const mockElement = {
                closest: jest.fn().mockReturnValue(null)
            };

            const result = extractItemIdFromElement(mockElement);
            
            expect(result).toBeNull();
        });

        test('should return null if no dataset', () => {
            const mockElement = {
                closest: jest.fn().mockReturnValue({})
            };

            const result = extractItemIdFromElement(mockElement);
            
            expect(result).toBeNull();
        });

        test('should handle null element input', () => {
            const result = extractItemIdFromElement(null);
            
            expect(result).toBeNull();
        });
    });

    describe('extractCombatItemId', () => {
        test('should extract item ID from element with data-item-id', () => {
            const mockElement = {
                dataset: { itemId: 'weapon-123' }
            };

            const result = extractCombatItemId(mockElement);
            
            expect(result).toBe('weapon-123');
        });

        test('should extract item ID using getAttribute fallback', () => {
            const mockElement = {
                getAttribute: jest.fn().mockReturnValue('armor-456')
            };

            const result = extractCombatItemId(mockElement);
            
            expect(result).toBe('armor-456');
        });

        test('should return null if no data-item-id found', () => {
            const mockElement = {
                dataset: {},
                getAttribute: jest.fn().mockReturnValue(null)
            };

            const result = extractCombatItemId(mockElement);
            
            expect(result).toBeNull();
        });

        test('should handle null element input', () => {
            const result = extractCombatItemId(null);
            
            expect(result).toBeNull();
        });

        test('should handle element without dataset or getAttribute', () => {
            const mockElement = {};

            const result = extractCombatItemId(mockElement);
            
            expect(result).toBeNull();
        });
    });

    describe('formatFlavorText', () => {
        test('should capitalize first letter of ability names', () => {
            const result = formatFlavorText('might', 'Check');
            expect(result).toBe('Might Check');
        });

        test('should format skill with ability', () => {
            const result = formatFlavorText('athletics', 'Check', 'might');
            expect(result).toBe('Athletics Check (Might)');
        });

        test('should handle empty inputs', () => {
            const result = formatFlavorText('', 'Check');
            expect(result).toBe(' Check');
        });

        test('should handle missing action', () => {
            const result = formatFlavorText('grace');
            expect(result).toBe('Grace');
        });
    });
}); 