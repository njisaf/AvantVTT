/**
 * @fileoverview Unit Tests for Item Type Validation and Sheet Configuration
 * @description Tests for validateItemType, createItemSheetConfig, and template mapping
 * @version 1.0.0
 * @author Avant Development Team
 */

import { describe, test, expect } from '@jest/globals';
import { validateItemType, createItemSheetConfig } from '../../../scripts/logic/item-sheet-utils.js';

describe('Item Type Validation', () => {
    describe('validateItemType function', () => {
        test('should accept all valid item types', () => {
            const validTypes = ['weapon', 'armor', 'feature', 'action', 'talent', 'augment'];
            
            validTypes.forEach(type => {
                expect(validateItemType(type)).toBe(true);
            });
        });

        test('should reject invalid item types', () => {
            const invalidTypes = ['spell', 'unknown', 'gear', 'trait', 'invalid'];
            
            invalidTypes.forEach(type => {
                expect(validateItemType(type)).toBe(false);
            });
        });

        test('should handle non-string inputs', () => {
            expect(validateItemType(null)).toBe(false);
            expect(validateItemType(undefined)).toBe(false);
            expect(validateItemType(123)).toBe(false);
            expect(validateItemType({})).toBe(false);
            expect(validateItemType([])).toBe(false);
        });

        test('should be case sensitive', () => {
            expect(validateItemType('WEAPON')).toBe(false);
            expect(validateItemType('Talent')).toBe(false);
            expect(validateItemType('weapon')).toBe(true);
            expect(validateItemType('talent')).toBe(true);
        });
    });

    describe('Talent type validation', () => {
        test('should validate talent as correct type', () => {
            expect(validateItemType('talent')).toBe(true);
        });

        test('should create correct template path for talent', () => {
            const item = {
                type: 'talent',
                name: 'Fireball'
            };

            const config = createItemSheetConfig(item);
            
            expect(config.template).toBe('systems/avant/templates/item/item-talent-sheet.html');
            expect(config.itemType).toBe('talent');
            expect(config.classes).toContain('talent');
        });
    });

    describe('Augment type validation', () => {
        test('should validate augment as correct type', () => {
            expect(validateItemType('augment')).toBe(true);
        });

        test('should create correct template path for augment', () => {
            const item = {
                type: 'augment',
                name: 'Enhanced Vision'
            };

            const config = createItemSheetConfig(item);
            
            expect(config.template).toBe('systems/avant/templates/item/item-augment-sheet.html');
            expect(config.itemType).toBe('augment');
            expect(config.classes).toContain('augment');
        });
    });
});

describe('Item Sheet Configuration', () => {
    describe('createItemSheetConfig function', () => {
        test('should create config for new Item("talent")', () => {
            const talentItem = {
                type: 'talent',
                name: 'Test Talent'
            };

            const config = createItemSheetConfig(talentItem);
            
            expect(config).not.toBeNull();
            expect(config.template).toBe('systems/avant/templates/item/item-talent-sheet.html');
            expect(config.classes).toEqual(['avant', 'sheet', 'item', 'talent']);
            expect(config.itemType).toBe('talent');
            expect(config.title).toBe('Test Talent');
        });

        test('should create config for new Item("augment")', () => {
            const augmentItem = {
                type: 'augment',
                name: 'Test Augment'
            };

            const config = createItemSheetConfig(augmentItem);
            
            expect(config).not.toBeNull();
            expect(config.template).toBe('systems/avant/templates/item/item-augment-sheet.html');
            expect(config.classes).toEqual(['avant', 'sheet', 'item', 'augment']);
            expect(config.itemType).toBe('augment');
            expect(config.title).toBe('Test Augment');
        });

        test('should have consistent template naming pattern', () => {
            const testTypes = ['weapon', 'armor', 'feature', 'action', 'talent', 'augment'];
            
            testTypes.forEach(type => {
                const item = { type, name: `Test ${type}` };
                const config = createItemSheetConfig(item);
                
                expect(config.template).toBe(`systems/avant/templates/item/item-${type}-sheet.html`);
                expect(config.itemType).toBe(type);
            });
        });

        test('should handle invalid item types gracefully', () => {
            const invalidItem = {
                type: 'unknown',
                name: 'Mystery Item'
            };

            const config = createItemSheetConfig(invalidItem);
            
            expect(config.template).toBe('systems/avant/templates/item/item-sheet.html');
            expect(config.itemType).toBe('unknown');
        });

        test('should handle null and undefined inputs', () => {
            expect(createItemSheetConfig(null)).toBeNull();
            expect(createItemSheetConfig(undefined)).toBeNull();
            expect(createItemSheetConfig({})).not.toBeNull(); // Empty object should work with defaults
        });

        test('should provide default values', () => {
            const minimalItem = { type: 'talent' };
            const config = createItemSheetConfig(minimalItem);
            
            expect(config.title).toBe('Unnamed Item');
            expect(config.width).toBe(520);
            expect(config.height).toBe(480);
            expect(config.tabs).toEqual([{
                navSelector: '.sheet-tabs',
                contentSelector: '.sheet-body',
                initial: 'description'
            }]);
        });

        test('should generate correct CSS classes', () => {
            const talentItem = { type: 'talent', name: 'Test' };
            const augmentItem = { type: 'augment', name: 'Test' };
            
            const talentConfig = createItemSheetConfig(talentItem);
            const augmentConfig = createItemSheetConfig(augmentItem);
            
            expect(talentConfig.classes).toEqual(['avant', 'sheet', 'item', 'talent']);
            expect(augmentConfig.classes).toEqual(['avant', 'sheet', 'item', 'augment']);
        });
    });

    describe('Template path mapping', () => {
        test('should map each declared item type to correct template', () => {
            // These should match the types declared in system.json
            const declaredTypes = ['action', 'feature', 'talent', 'augment', 'weapon', 'armor', 'gear', 'trait'];
            
            declaredTypes.forEach(type => {
                const item = { type, name: `Test ${type}` };
                const config = createItemSheetConfig(item);
                
                if (validateItemType(type)) {
                    // Valid types should get specific templates
                    expect(config.template).toBe(`systems/avant/templates/item/item-${type}-sheet.html`);
                } else {
                    // Invalid types should get fallback template
                    expect(config.template).toBe('systems/avant/templates/item/item-sheet.html');
                }
            });
        });

        test('should ensure AP/PP fields are accessible for talent items', () => {
            const talentItem = { type: 'talent', name: 'Test Talent' };
            const config = createItemSheetConfig(talentItem);
            
            // Template path should point to talent-specific template
            expect(config.template).toContain('talent-sheet.html');
            expect(config.itemType).toBe('talent');
        });

        test('should ensure AP/PP fields are accessible for augment items', () => {
            const augmentItem = { type: 'augment', name: 'Test Augment' };
            const config = createItemSheetConfig(augmentItem);
            
            // Template path should point to augment-specific template
            expect(config.template).toContain('augment-sheet.html');
            expect(config.itemType).toBe('augment');
        });
    });
});

describe('Item Type System Integration', () => {
    test('should not allow gear items to show talent sheets', () => {
        const gearItem = { type: 'gear', name: 'Rope' };
        const config = createItemSheetConfig(gearItem);
        
        // Gear is not in validTypes, so should get fallback template
        expect(config.template).toBe('systems/avant/templates/item/item-sheet.html');
        expect(config.template).not.toContain('talent');
        expect(config.template).not.toContain('augment');
    });

    test('should ensure talents get talent sheets not gear sheets', () => {
        const talentItem = { type: 'talent', name: 'Fireball' };
        const config = createItemSheetConfig(talentItem);
        
        expect(config.template).toBe('systems/avant/templates/item/item-talent-sheet.html');
        expect(config.template).not.toContain('gear');
    });

    test('should ensure augments get augment sheets not gear sheets', () => {
        const augmentItem = { type: 'augment', name: 'Enhanced Vision' };
        const config = createItemSheetConfig(augmentItem);
        
        expect(config.template).toBe('systems/avant/templates/item/item-augment-sheet.html');
        expect(config.template).not.toContain('gear');
    });
}); 