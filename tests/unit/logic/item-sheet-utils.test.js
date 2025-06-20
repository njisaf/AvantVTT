/**
 * @fileoverview Tests for Item Sheet Utils - Pure Functions
 * @description Unit tests for additional pure functions for item sheet operations
 * @version 2.0.0
 * @author Avant Development Team
 */

import {
    prepareTemplateData,
    validateItemType,
    calculateItemWeight,
    formatItemDisplay,
    extractItemFormData,
    createItemSheetConfig
} from '../../../scripts/logic/item-sheet-utils.js';

describe('Item Sheet Utils - Pure Functions', () => {
    describe('prepareTemplateData', () => {
        test('should prepare basic template data structure', () => {
            const item = {
                name: 'Iron Sword',
                type: 'weapon',
                system: { damage: '1d8', weight: 3 },
                flags: { custom: true }
            };

            const result = prepareTemplateData(item);
            
            expect(result).toEqual({
                item: item,
                system: { damage: '1d8', weight: 3 },
                flags: { custom: true },
                cssClass: 'item-sheet weapon-sheet',
                isWeapon: true,
                isArmor: false,
                isFeature: false,
                isAction: false
            });
        });

        test('should handle armor items', () => {
            const item = {
                name: 'Leather Armor',
                type: 'armor',
                system: { ac: 2 },
                flags: {}
            };

            const result = prepareTemplateData(item);
            
            expect(result.isArmor).toBe(true);
            expect(result.isWeapon).toBe(false);
            expect(result.cssClass).toBe('item-sheet armor-sheet');
        });

        test('should handle feature items', () => {
            const item = {
                name: 'Darkvision',
                type: 'feature',
                system: { description: 'See in darkness' },
                flags: {}
            };

            const result = prepareTemplateData(item);
            
            expect(result.isFeature).toBe(true);
            expect(result.cssClass).toBe('item-sheet feature-sheet');
        });

        test('should handle null item input', () => {
            const result = prepareTemplateData(null);
            
            expect(result).toBeNull();
        });

        test('should handle missing properties gracefully', () => {
            const item = {
                name: 'Incomplete Item',
                type: 'weapon'
            };

            const result = prepareTemplateData(item);
            
            expect(result.system).toEqual({});
            expect(result.flags).toEqual({});
        });
    });

    describe('validateItemType', () => {
        test('should validate known item types', () => {
            expect(validateItemType('weapon')).toBe(true);
            expect(validateItemType('armor')).toBe(true);
            expect(validateItemType('feature')).toBe(true);
            expect(validateItemType('action')).toBe(true);
            expect(validateItemType('augment')).toBe(true);
        });

        test('should reject unknown item types', () => {
            expect(validateItemType('unknown')).toBe(false);
            expect(validateItemType('invalid')).toBe(false);
            expect(validateItemType('')).toBe(false);
        });

        test('should handle invalid inputs', () => {
            expect(validateItemType(null)).toBe(false);
            expect(validateItemType(undefined)).toBe(false);
            expect(validateItemType(123)).toBe(false);
            expect(validateItemType({})).toBe(false);
        });
    });

    describe('calculateItemWeight', () => {
        test('should calculate weight for single item', () => {
            const item = {
                system: { weight: 2.5, quantity: 1 }
            };

            const result = calculateItemWeight(item);
            
            expect(result).toBe(2.5);
        });

        test('should calculate weight for multiple quantities', () => {
            const item = {
                system: { weight: 1.5, quantity: 3 }
            };

            const result = calculateItemWeight(item);
            
            expect(result).toBe(4.5);
        });

        test('should handle missing weight', () => {
            const item = {
                system: { quantity: 2 }
            };

            const result = calculateItemWeight(item);
            
            expect(result).toBe(0);
        });

        test('should handle missing quantity', () => {
            const item = {
                system: { weight: 3 }
            };

            const result = calculateItemWeight(item);
            
            expect(result).toBe(3);
        });

        test('should handle invalid inputs', () => {
            expect(calculateItemWeight(null)).toBe(0);
            expect(calculateItemWeight({})).toBe(0);
            expect(calculateItemWeight({ system: {} })).toBe(0);
        });

        test('should handle string numbers', () => {
            const item = {
                system: { weight: '2.5', quantity: '3' }
            };

            const result = calculateItemWeight(item);
            
            expect(result).toBe(7.5);
        });
    });

    describe('formatItemDisplay', () => {
        test('should format weapon display', () => {
            const item = {
                name: 'Iron Sword',
                type: 'weapon',
                system: { 
                    damage: '1d8',
                    ability: 'might',
                    damageType: 'slashing'
                }
            };

            const result = formatItemDisplay(item);
            
            expect(result).toEqual({
                name: 'Iron Sword',
                type: 'weapon',
                displayText: 'Iron Sword (1d8 slashing, might)',
                damageInfo: '1d8 slashing',
                abilityInfo: 'might'
            });
        });

        test('should format armor display', () => {
            const item = {
                name: 'Leather Armor',
                type: 'armor',
                system: { 
                    ac: 2,
                    ability: 'grace'
                }
            };

            const result = formatItemDisplay(item);
            
            expect(result).toEqual({
                name: 'Leather Armor',
                type: 'armor',
                displayText: 'Leather Armor (AC +2, grace)',
                acInfo: 'AC +2',
                abilityInfo: 'grace'
            });
        });

        test('should format feature display', () => {
            const item = {
                name: 'Darkvision',
                type: 'feature',
                system: { 
                    category: 'racial',
                    description: 'See in darkness'
                }
            };

            const result = formatItemDisplay(item);
            
            expect(result).toEqual({
                name: 'Darkvision',
                type: 'feature',
                displayText: 'Darkvision (racial)',
                categoryInfo: 'racial'
            });
        });

        test('should handle missing data gracefully', () => {
            const item = {
                name: 'Simple Item',
                type: 'feature',
                system: {}
            };

            const result = formatItemDisplay(item);
            
            expect(result.displayText).toBe('Simple Item');
        });
    });

    describe('extractItemFormData', () => {
        test('should extract and convert form data', () => {
            const formData = {
                'name': 'Iron Sword',
                'system.damage': '1d8',
                'system.weight': '3.5',
                'system.quantity': '1',
                'system.equipped': 'true'
            };

            const result = extractItemFormData(formData);
            
            expect(result).toEqual({
                name: 'Iron Sword',
                system: {
                    damage: '1d8',
                    weight: 3.5,
                    quantity: 1,
                    equipped: true
                }
            });
        });

        test('should handle nested properties', () => {
            const formData = {
                'system.attributes.durability.value': '10',
                'system.attributes.durability.max': '10'
            };

            const result = extractItemFormData(formData);
            
            expect(result).toEqual({
                system: {
                    attributes: {
                        durability: {
                            value: 10,
                            max: 10
                        }
                    }
                }
            });
        });

        test('should preserve string values when appropriate', () => {
            const formData = {
                'system.description': 'A fine blade',
                'system.rarity': 'common'
            };

            const result = extractItemFormData(formData);
            
            expect(result.system.description).toBe('A fine blade');
            expect(result.system.rarity).toBe('common');
        });

        test('should handle empty form data', () => {
            const result = extractItemFormData({});
            
            expect(result).toEqual({});
        });

        test('should handle null input', () => {
            const result = extractItemFormData(null);
            
            expect(result).toEqual({});
        });
    });

    describe('createItemSheetConfig', () => {
        test('should create weapon sheet config', () => {
            const item = {
                type: 'weapon',
                name: 'Iron Sword'
            };

            const result = createItemSheetConfig(item);
            
            expect(result).toEqual({
                classes: ['avant', 'sheet', 'item', 'weapon'],
                template: 'systems/avant/templates/item/item-weapon-sheet.html',
                width: 520,
                height: 480,
                tabs: [{
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'description'
                }],
                title: 'Iron Sword',
                itemType: 'weapon'
            });
        });

        test('should create armor sheet config', () => {
            const item = {
                type: 'armor',
                name: 'Leather Armor'
            };

            const result = createItemSheetConfig(item);
            
            expect(result.classes).toContain('armor');
            expect(result.template).toBe('systems/avant/templates/item/item-armor-sheet.html');
            expect(result.itemType).toBe('armor');
        });

        test('should handle feature sheet config', () => {
            const item = {
                type: 'feature',
                name: 'Darkvision'
            };

            const result = createItemSheetConfig(item);
            
            expect(result.classes).toContain('feature');
            expect(result.template).toBe('systems/avant/templates/item/item-feature-sheet.html');
        });

        test('should use default template for unknown types', () => {
            const item = {
                type: 'unknown',
                name: 'Mystery Item'
            };

            const result = createItemSheetConfig(item);
            
            expect(result.template).toBe('systems/avant/templates/item/item-sheet.html');
            expect(result.itemType).toBe('unknown');
        });

        test('should handle null item', () => {
            const result = createItemSheetConfig(null);
            
            expect(result).toBeNull();
        });
    });
}); 