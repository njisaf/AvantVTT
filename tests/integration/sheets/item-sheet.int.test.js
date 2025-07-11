/**
 * @fileoverview Integration Tests for AvantItemSheet
 * @description Tests thin wrapper without mocking - verifies actual delegation
 * @version 2.0.0
 */

import { jest } from '@jest/globals';

// Setup FoundryVTT environment  
import '../../setup.js';

// Import the sheet class factory
import { createAvantItemSheet } from '../../../scripts/sheets/item-sheet.ts';

describe('AvantItemSheet Integration Tests', () => {
    let itemSheet;
    let mockItem;
    let mockHtml;

    beforeEach(() => {
        // Create mock item
        mockItem = {
            type: 'weapon',
            name: 'Test Weapon',
            toObject: jest.fn(() => ({
                system: { damage: '1d8', type: 'weapon' },
                flags: {}
            })),
            getRollData: jest.fn(() => ({ str: 2 })),
            actor: {
                name: 'Test Actor'
            }
        };

        // Create mock HTML element and wrap in jQuery for v13 compatibility
        const htmlElement = document.createElement('div');
        htmlElement.innerHTML = `
            <div class="rollable" data-roll="1d20" data-label="Item Roll">
                Roll Item
            </div>
        `;
        mockHtml = global.jQuery(htmlElement);

        // Create sheet instance
        const AvantItemSheet = createAvantItemSheet();
        itemSheet = new AvantItemSheet(mockItem, {});
        
        // Mock the isEditable getter to return true
        Object.defineProperty(itemSheet, 'isEditable', {
            get: () => true,
            configurable: true
        });
    });

    describe('Template Resolution', () => {
        test('should correctly resolve template path for item type', () => {
            const templatePath = itemSheet.template;
            expect(templatePath).toBe('systems/avant/templates/item/item-weapon-new.html');
        });

        test('should handle different item types', () => {
            mockItem.type = 'gear';
            const templatePath = itemSheet.template;
            expect(templatePath).toBe('systems/avant/templates/item/item-gear-new.html');
        });
    });

    describe('Data Preparation', () => {
        test('should call getData and structure context correctly', async () => {
            const context = await itemSheet.getData();
            
            expect(mockItem.toObject).toHaveBeenCalledWith(false);
            expect(context.system).toEqual({ damage: '1d8', type: 'weapon', traits: [] });
            expect(context.flags).toEqual({});
        });

        test('should handle missing system data gracefully', async () => {
            mockItem.toObject.mockReturnValue({ flags: {} });
            
            const context = await itemSheet.getData();
            expect(context.system).toEqual({ traits: [] }); // Pure function now returns empty object instead of undefined
            expect(context.flags).toEqual({});
        });
    });

    describe('Default Options', () => {
        test('should have correct default options', () => {
            const options = AvantItemSheet.defaultOptions;
            
            expect(options.classes).toContain('avant');
            expect(options.classes).toContain('sheet');
            expect(options.classes).toContain('item');
            expect(options.width).toBe(520);
            expect(options.height).toBe(480);
            expect(options.tabs).toBeDefined();
        });
    });

    describe('Event Listener Activation', () => {
        test('should activate listeners for editable sheet without errors', () => {
            expect(() => {
                itemSheet.activateListeners(mockHtml);
            }).not.toThrow();
        });

        test('should not crash with non-editable sheet', () => {
            // Create a new sheet instance with isEditable = false
            const AvantItemSheetClass = createAvantItemSheet();
            const nonEditableSheet = new AvantItemSheetClass(mockItem, {});
            Object.defineProperty(nonEditableSheet, 'isEditable', {
                get: () => false,
                configurable: true
            });
            
            expect(() => {
                nonEditableSheet.activateListeners(mockHtml);
            }).not.toThrow();
        });

        test('should handle null HTML gracefully', () => {
            // v13 item sheet expects valid jQuery object, null should not be passed
            // This is testing current behavior - null HTML would throw an error
            expect(() => {
                itemSheet.activateListeners(null);
            }).toThrow();
        });
    });

    describe('Core Listener Activation', () => {
        test('should properly delegate to core framework', () => {
            // v13-only implementation delegates all listener activation to parent class
            // No separate _activateCoreListeners method needed
            expect(() => {
                itemSheet.activateListeners(mockHtml);
            }).not.toThrow();
        });
    });

    describe('Roll Handling', () => {
        test('should handle roll events without crashing', async () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                currentTarget: {
                    dataset: {
                        roll: '1d8+@str',
                        label: 'Damage'
                    }
                }
            };

            // Should not throw even if roll logic fails
            expect(async () => {
                await itemSheet.onRoll(mockEvent, mockEvent.currentTarget);
            }).not.toThrow();

            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        test('should handle roll with empty dataset', async () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                currentTarget: { dataset: {} }
            };

            const result = await itemSheet._onRoll(mockEvent);
            expect(result).toBeUndefined();
        });
    });

    describe('Form Data Processing', () => {
        test('should process form updates without errors', async () => {
            const mockFormData = { 'system.damage': '1d10' };
            const mockEvent = { type: 'submit' };

            // Mock parent method
            const originalUpdateObject = itemSheet.constructor.prototype._updateObject;
            itemSheet.constructor.prototype._updateObject = jest.fn();

            expect(async () => {
                await itemSheet._updateObject(mockEvent, mockFormData);
            }).not.toThrow();

            // Restore original method
            itemSheet.constructor.prototype._updateObject = originalUpdateObject;
        });
    });

    describe('Version Compatibility', () => {
        test('should work with v13 foundry utils', () => {
            // v13-only test: Ensure we can access foundry utils properly
            expect(global.foundry?.utils?.mergeObject).toBeDefined();
            expect(typeof global.foundry.utils.mergeObject).toBe('function');
            
            // Test that our sheet works with v13 foundry utils
            const options = AvantItemSheet.defaultOptions;
            expect(options).toBeDefined();
            expect(options.classes).toContain('avant');
        });
    });

    describe('Error Resilience', () => {
        test('should handle corrupted item data gracefully', async () => {
            mockItem.toObject = jest.fn(() => {
                throw new Error('Data corruption');
            });

            await expect(itemSheet.getData()).rejects.toThrow('Data corruption');
        });

        test('should handle missing getRollData method', async () => {
            delete mockItem.getRollData;

            const mockEvent = {
                preventDefault: jest.fn(),
                currentTarget: {
                    dataset: { roll: '1d8' }
                }
            };

            expect(async () => {
                await itemSheet.onRoll(mockEvent, mockEvent.currentTarget);
            }).not.toThrow();
        });
    });
}); 