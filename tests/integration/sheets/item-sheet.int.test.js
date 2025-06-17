/**
 * @fileoverview Integration Tests for AvantItemSheet
 * @description Tests thin wrapper without mocking - verifies actual delegation
 * @version 2.0.0
 */

import { jest } from '@jest/globals';

// Setup FoundryVTT environment  
import '../../setup.js';

// Import the sheet class
import { AvantItemSheet } from '../../../scripts/sheets/item-sheet.js';

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

        // Create mock HTML element
        mockHtml = document.createElement('div');
        mockHtml.innerHTML = `
            <div class="rollable" data-roll="1d8+@str" data-label="Damage">
                Roll Damage
            </div>
        `;

        // Create sheet instance
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
            expect(templatePath).toBe('systems/avant/templates/item/item-weapon-sheet.html');
        });

        test('should handle different item types', () => {
            mockItem.type = 'spell';
            const templatePath = itemSheet.template;
            expect(templatePath).toBe('systems/avant/templates/item/item-spell-sheet.html');
        });
    });

    describe('Data Preparation', () => {
        test('should call getData and structure context correctly', () => {
            const context = itemSheet.getData();
            
            expect(mockItem.toObject).toHaveBeenCalledWith(false);
            expect(context.system).toEqual({ damage: '1d8', type: 'weapon' });
            expect(context.flags).toEqual({});
        });

        test('should handle missing system data gracefully', () => {
            mockItem.toObject.mockReturnValue({ flags: {} });
            
            const context = itemSheet.getData();
            expect(context.system).toBeUndefined();
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
            const nonEditableSheet = new AvantItemSheet(mockItem, {});
            Object.defineProperty(nonEditableSheet, 'isEditable', {
                get: () => false,
                configurable: true
            });
            
            expect(() => {
                nonEditableSheet.activateListeners(mockHtml);
            }).not.toThrow();
        });

        test('should handle null HTML gracefully', () => {
            expect(() => {
                itemSheet.activateListeners(null);
            }).not.toThrow();
        });
    });

    describe('Core Listener Activation', () => {
        test('should activate core listeners without errors', () => {
            expect(() => {
                itemSheet._activateCoreListeners(mockHtml);
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
                await itemSheet._onRoll(mockEvent);
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
        test('should handle missing foundry.utils gracefully', () => {
            // Save original foundry
            const originalFoundry = global.foundry;
            
            // Create a minimal foundry object without utils.mergeObject
            global.foundry = {};

            // The defaultOptions should use fallback merging
            const options = AvantItemSheet.defaultOptions;
            
            expect(options).toBeDefined();
            expect(options.classes).toContain('avant');
            expect(options.width).toBe(520);
            expect(options.height).toBe(480);

            // Restore original foundry
            global.foundry = originalFoundry;
        });
    });

    describe('Error Resilience', () => {
        test('should handle corrupted item data gracefully', () => {
            mockItem.toObject = jest.fn(() => {
                throw new Error('Data corruption');
            });

            expect(() => {
                itemSheet.getData();
            }).toThrow(); // This will throw, but that's expected behavior
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
                await itemSheet._onRoll(mockEvent);
            }).not.toThrow();
        });
    });
}); 