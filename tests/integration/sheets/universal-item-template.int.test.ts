/**
 * @fileoverview Integration tests for universal item template functionality - Phase 4
 * @description Tests that all item types use the single universal template
 *              after per-item template removal (Phase 4 Hard Switch)
 */

import { createAvantItemSheet } from '../../../scripts/sheets/item-sheet.ts';

// Mock FoundryVTT globals for testing
const mockGame = {
    settings: {
        get: jest.fn(),
        register: jest.fn()
    }
};

const mockUI = {
    notifications: {
        info: jest.fn()
    }
};

// Set up global mocks
(global as any).game = mockGame;
(global as any).ui = mockUI;

describe('Universal Item Template Integration - Phase 4', () => {
    let mockItem: any;
    let itemSheet: any;

    beforeEach(() => {
        // Create mock item for different types
        mockItem = {
            id: 'test-item-id',
            name: 'Test Item',
            type: 'talent',
            system: {
                traits: ['Fire', 'Attack']
            },
            img: 'path/to/icon.png'
        };

        // Create item sheet instance
        itemSheet = createAvantItemSheet();
        itemSheet.document = mockItem;
    });

    describe('Universal Template Hard Switch (Phase 4)', () => {
        test('should use universal template for talent items', () => {
            mockItem.type = 'talent';
            const parts = itemSheet.parts;

            expect(parts.form.template).toBe('systems/avant/templates/item-sheet.html');
        });

        test('should use universal template for weapon items', () => {
            mockItem.type = 'weapon';
            const parts = itemSheet.parts;

            expect(parts.form.template).toBe('systems/avant/templates/item-sheet.html');
        });

        test('should use universal template for augment items', () => {
            mockItem.type = 'augment';
            const parts = itemSheet.parts;

            expect(parts.form.template).toBe('systems/avant/templates/item-sheet.html');
        });

        test('should use universal template for armor items', () => {
            mockItem.type = 'armor';
            const parts = itemSheet.parts;

            expect(parts.form.template).toBe('systems/avant/templates/item-sheet.html');
        });

        test('should use universal template for gear items', () => {
            mockItem.type = 'gear';
            const parts = itemSheet.parts;

            expect(parts.form.template).toBe('systems/avant/templates/item-sheet.html');
        });

        test('should use universal template for action items', () => {
            mockItem.type = 'action';
            const parts = itemSheet.parts;

            expect(parts.form.template).toBe('systems/avant/templates/item-sheet.html');
        });

        test('should use universal template for feature items', () => {
            mockItem.type = 'feature';
            const parts = itemSheet.parts;

            expect(parts.form.template).toBe('systems/avant/templates/item-sheet.html');
        });

        test('should use universal template for trait items', () => {
            mockItem.type = 'trait';
            const parts = itemSheet.parts;

            expect(parts.form.template).toBe('systems/avant/templates/item-sheet.html');
        });

        test('should use universal template for unknown item types', () => {
            mockItem.type = 'unknown-type';
            const parts = itemSheet.parts;

            expect(parts.form.template).toBe('systems/avant/templates/item-sheet.html');
        });

        test('should handle missing item type gracefully', () => {
            mockItem.type = undefined;
            const parts = itemSheet.parts;

            expect(parts.form.template).toBe('systems/avant/templates/item-sheet.html');
        });
    });

    describe('Template Path Validation', () => {
        test('should return valid parts configuration structure', () => {
            const parts = itemSheet.parts;
            
            expect(parts).toHaveProperty('form');
            expect(parts.form).toHaveProperty('template');
            expect(typeof parts.form.template).toBe('string');
            expect(parts.form.template.length).toBeGreaterThan(0);
        });

        test('should always return the same universal template path', () => {
            const itemTypes = ['talent', 'augment', 'weapon', 'armor', 'gear', 'action', 'feature', 'trait', 'unknown'];
            const expectedTemplate = 'systems/avant/templates/item-sheet.html';
            
            for (const itemType of itemTypes) {
                mockItem.type = itemType;
                const parts = itemSheet.parts;
                
                expect(parts.form.template).toBe(expectedTemplate);
            }
        });
    });

    describe('All Item Types Coverage', () => {
        const allItemTypes = [
            'talent', 'augment', 'weapon', 'armor', 
            'gear', 'action', 'feature', 'trait'
        ];

        test.each(allItemTypes)('should handle %s item type with universal template', (itemType) => {
            mockItem.type = itemType;
            
            const parts = itemSheet.parts;
            
            expect(parts.form.template).toBe('systems/avant/templates/item-sheet.html');
        });

        test('should use the same template for all known item types', () => {
            const templates = new Set();
            
            for (const itemType of allItemTypes) {
                mockItem.type = itemType;
                const parts = itemSheet.parts;
                templates.add(parts.form.template);
            }
            
            // Should only have one unique template path
            expect(templates.size).toBe(1);
            expect(templates.has('systems/avant/templates/item-sheet.html')).toBe(true);
        });
    });

    describe('Phase 4 Consistency Validation', () => {
        test('should not depend on any feature flags', () => {
            // Phase 4: No feature flag dependency - always universal template
            const parts1 = itemSheet.parts;
            const parts2 = itemSheet.parts;
            
            expect(parts1.form.template).toBe(parts2.form.template);
            expect(parts1.form.template).toBe('systems/avant/templates/item-sheet.html');
        });

        test('should be deterministic regardless of global state', () => {
            // Test with various global states
            (global as any).game = null;
            const partsWithoutGame = itemSheet.parts;
            
            (global as any).game = mockGame;
            const partsWithGame = itemSheet.parts;
            
            // Should always return the same template
            expect(partsWithoutGame.form.template).toBe('systems/avant/templates/item-sheet.html');
            expect(partsWithGame.form.template).toBe('systems/avant/templates/item-sheet.html');
        });
    });
});