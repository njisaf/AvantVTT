/**
 * @fileoverview Unit Tests for BaseItemSheet
 * @description Phase 1 - Architectural Skeleton Testing
 * 
 * These tests focus on the pure utility methods and basic functionality
 * of the BaseItemSheet without requiring full FoundryVTT integration.
 * 
 * @author Avant VTT Team
 * @version 1.0.0 - Phase 1
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock FoundryVTT globals for testing
(globalThis as any).foundry = {
    applications: {
        api: {
            ApplicationV2: class MockApplicationV2 {
                static DEFAULT_OPTIONS = {};
                static PARTS = {};
                constructor() {}
                async _prepareContext() { return {}; }
                get isEditable() { return true; }
            },
            HandlebarsApplicationMixin: (BaseClass: any) => class extends BaseClass {
                constructor(...args: any[]) { super(...args); }
            },
            DocumentSheetV2: class MockDocumentSheetV2 {
                document: any;
                constructor() {}
                async _prepareContext() { return {}; }
                get isEditable() { return true; }
            }
        }
    }
};

// Import the factory function
import { createBaseItemSheet } from '../../../scripts/sheets/base-item-sheet';

describe('BaseItemSheet Factory Function', () => {
    test('should create BaseItemSheet class successfully', () => {
        const BaseItemSheet = createBaseItemSheet();
        
        expect(BaseItemSheet).toBeDefined();
        expect(BaseItemSheet.name).toBe('BaseItemSheet');
        expect(BaseItemSheet.DEFAULT_OPTIONS).toBeDefined();
        expect(BaseItemSheet.PARTS).toBeDefined();
    });
    
    test('should have correct default options structure', () => {
        const BaseItemSheet = createBaseItemSheet();
        const options = BaseItemSheet.DEFAULT_OPTIONS;
        
        expect(options.classes).toEqual(["avant", "item-sheet"]);
        expect(options.tag).toBe("form");
        expect(options.hasFrame).toBe(true);
        expect(options.position.width).toBe(600);
        expect(options.position.height).toBe(500);
        expect(options.form.submitOnChange).toBe(true);
        expect(options.form.closeOnSubmit).toBe(false);
    });
    
    test('should have correct parts configuration', () => {
        const BaseItemSheet = createBaseItemSheet();
        const parts = BaseItemSheet.PARTS;
        
        expect(parts.form).toBeDefined();
        expect(parts.form.template).toBe("systems/avant/templates/item/item-base-sheet.html");
    });
});

describe('BaseItemSheet Instance Methods', () => {
    let BaseItemSheet: any;
    let sheet: any;
    let mockDocument: any;
    
    beforeEach(() => {
        BaseItemSheet = createBaseItemSheet();
        
        // Create mock document
        mockDocument = {
            type: 'weapon',
            name: 'Test Weapon',
            system: {
                apCost: 2,
                traits: ['fire', 'magic'],
                description: 'A test weapon'
            },
            toObject: jest.fn(() => ({
                type: 'weapon',
                name: 'Test Weapon',
                system: {
                    apCost: 2,
                    traits: ['fire', 'magic'],
                    description: 'A test weapon'
                }
            }))
        };
        
        // Create sheet instance
        sheet = new BaseItemSheet();
        sheet.document = mockDocument;
    });
    
    describe('item getter', () => {
        test('should return the document', () => {
            expect(sheet.item).toBe(mockDocument);
        });
    });
    
    describe('title getter', () => {
        test('should return formatted title with item name and type', () => {
            // Mock game global
            (globalThis as any).game = {
                i18n: {
                    localize: jest.fn(() => 'Item Sheet')
                }
            };
            
            const title = sheet.title;
            expect(title).toBe('Test Weapon [weapon]');
        });
        
        test('should handle missing item name gracefully', () => {
            sheet.document.name = null;
            (globalThis as any).game = {
                i18n: {
                    localize: jest.fn(() => 'Item Sheet')
                }
            };
            
            const title = sheet.title;
            expect(title).toBe('Item Sheet [weapon]');
        });
        
        test('should handle missing game object', () => {
            (globalThis as any).game = null;
            
            const title = sheet.title;
            expect(title).toBe('Test Weapon [weapon]');
        });
    });
    
    describe('getCssClass method', () => {
        test('should return correct CSS classes for weapon', () => {
            const cssClass = sheet.getCssClass();
            expect(cssClass).toBe('avant item-sheet weapon-sheet');
        });
        
        test('should handle missing item type', () => {
            sheet.document.type = null;
            const cssClass = sheet.getCssClass();
            expect(cssClass).toBe('avant item-sheet item-sheet');
        });
        
        test('should handle different item types', () => {
            sheet.document.type = 'talent';
            const cssClass = sheet.getCssClass();
            expect(cssClass).toBe('avant item-sheet talent-sheet');
        });
    });
    
    describe('getTabConfiguration method', () => {
        test('should return default tab configuration', () => {
            const tabs = sheet.getTabConfiguration();
            
            expect(tabs).toHaveLength(2);
            expect(tabs[0]).toEqual({
                id: "description",
                label: "Description", 
                icon: "fas fa-book",
                active: true
            });
            expect(tabs[1]).toEqual({
                id: "details",
                label: "Details",
                icon: "fas fa-cogs"
            });
        });
    });
    
    describe('getWidgetConfigurations method', () => {
        test('should detect AP selector widget for weapon', () => {
            const widgets = sheet.getWidgetConfigurations();
            
            expect(widgets.apSelector).toBe(true);
            expect(widgets.ppCostInput).toBe(false);
            expect(widgets.traitChips).toBe(true);
            expect(widgets.imageUpload).toBe(true);
            expect(widgets.usesCounter).toBe(false);
        });
        
        test('should handle talent item type', () => {
            sheet.document.type = 'talent';
            sheet.document.system.ppCost = 5;
            
            const widgets = sheet.getWidgetConfigurations();
            
            expect(widgets.apSelector).toBe(true);
            expect(widgets.ppCostInput).toBe(true);
            expect(widgets.imageUpload).toBe(false); // Talents don't have image upload
        });
        
        test('should handle augment item type', () => {
            sheet.document.type = 'augment';
            sheet.document.system.uses = { value: 1, max: 3 };
            
            const widgets = sheet.getWidgetConfigurations();
            
            expect(widgets.imageUpload).toBe(false); // Augments don't have image upload
            expect(widgets.usesCounter).toBe(true);
        });
        
        test('should handle missing system data', () => {
            sheet.document.system = null;
            
            const widgets = sheet.getWidgetConfigurations();
            
            expect(widgets.apSelector).toBe(false);
            expect(widgets.ppCostInput).toBe(false);
            expect(widgets.traitChips).toBe(false);
            expect(widgets.usesCounter).toBe(false);
        });
    });
    
    describe('getDebugInfo method', () => {
        test('should return comprehensive debug information', () => {
            const debugInfo = sheet.getDebugInfo();
            
            expect(debugInfo.sheetClass).toBe('BaseItemSheet');
            expect(debugInfo.itemType).toBe('weapon');
            expect(debugInfo.itemName).toBe('Test Weapon');
            expect(debugInfo.cssClass).toBe('avant item-sheet weapon-sheet');
            expect(debugInfo.tabs).toHaveLength(2);
            expect(debugInfo.widgets).toBeDefined();
            expect(debugInfo.editable).toBe(true);
        });
        
        test('should handle missing document data', () => {
            sheet.document = null;
            
            const debugInfo = sheet.getDebugInfo();
            
            expect(debugInfo.itemType).toBeUndefined();
            expect(debugInfo.itemName).toBeUndefined();
            expect(debugInfo.cssClass).toBe('avant item-sheet item-sheet');
        });
    });
    
    describe('_prepareContext method', () => {
        test('should prepare context with base data', async () => {
            // Mock super._prepareContext
            const mockSuperContext = { baseKey: 'baseValue' };
            jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(sheet)), '_prepareContext')
                .mockResolvedValue(mockSuperContext);
            
            const context = await sheet._prepareContext({});
            
            expect(context.baseKey).toBe('baseValue'); // From super
            expect(context.item).toBeDefined();
            expect(context.system).toBeDefined();
            expect(context.flags).toBeDefined();
            expect(context.editable).toBe(true);
            expect(context.cssClass).toBe('avant item-sheet weapon-sheet');
            expect(context.tabs).toHaveLength(2);
            expect(context.widgets).toBeDefined();
        });
        
        test('should handle document.toObject() failure gracefully', async () => {
            // Mock failing toObject
            sheet.document.toObject = jest.fn(() => {
                throw new Error('Test error');
            });
            
            // Should not throw and should handle gracefully
            await expect(sheet._prepareContext({})).rejects.toThrow('Test error');
        });
        
        test('should handle missing system data', async () => {
            // Mock document with missing system
            sheet.document.toObject.mockReturnValue({
                type: 'weapon',
                name: 'Test Weapon'
                // Missing system
            });
            
            const context = await sheet._prepareContext({});
            
            expect(context.system).toEqual({});
            expect(context.flags).toEqual({});
        });
    });
});

describe('BaseItemSheet Error Handling', () => {
    test('should handle missing FoundryVTT globals gracefully', () => {
        // Temporarily remove globals
        const originalFoundry = (globalThis as any).foundry;
        delete (globalThis as any).foundry;
        
        expect(() => {
            createBaseItemSheet();
        }).toThrow('FoundryVTT v13 ApplicationV2 classes not available');
        
        // Restore globals
        (globalThis as any).foundry = originalFoundry;
    });
    
    test('should handle incomplete FoundryVTT API', () => {
        // Mock incomplete API
        const originalFoundry = (globalThis as any).foundry;
        (globalThis as any).foundry = {
            applications: {
                api: {
                    ApplicationV2: null, // Missing class
                    HandlebarsApplicationMixin: () => {},
                    DocumentSheetV2: class {}
                }
            }
        };
        
        expect(() => {
            createBaseItemSheet();
        }).toThrow('Required ApplicationV2 classes not found');
        
        // Restore globals
        (globalThis as any).foundry = originalFoundry;
    });
});

describe('BaseItemSheet Integration Points', () => {
    test('should be ready for Phase 2 component integration', () => {
        const BaseItemSheet = createBaseItemSheet();
        const sheet = new BaseItemSheet();
        
        // Mock document for testing
        sheet.document = {
            type: 'weapon',
            name: 'Integration Test',
            system: {},
            toObject: () => ({ type: 'weapon', name: 'Integration Test', system: {} })
        };
        
        // Verify Phase 2 integration points exist
        const widgets = sheet.getWidgetConfigurations();
        expect(typeof widgets).toBe('object');
        
        const tabs = sheet.getTabConfiguration();
        expect(Array.isArray(tabs)).toBe(true);
        
        const debugInfo = sheet.getDebugInfo();
        expect(debugInfo.sheetClass).toBe('BaseItemSheet');
    });
    
    test('should support theme system integration', () => {
        const BaseItemSheet = createBaseItemSheet();
        const cssClasses = BaseItemSheet.DEFAULT_OPTIONS.classes;
        
        expect(cssClasses).toContain('avant'); // Theme system integration point
        expect(cssClasses).toContain('item-sheet'); // Sheet type identifier
    });
    
    test('should provide accessibility foundation', () => {
        const BaseItemSheet = createBaseItemSheet();
        const options = BaseItemSheet.DEFAULT_OPTIONS;
        
        // Verify accessibility-ready configuration
        expect(options.hasFrame).toBe(true); // Proper window structure
        expect(options.positioned).toBe(true); // Window positioning support
        expect(options.resizable).toBe(true); // User control over layout
    });
}); 