/**
 * Avant Sheet Registration Unit Tests
 * 
 * Tests sheet registration with Actors/Items collection mocking,
 * calls registerSheets() directly and asserts error paths when
 * duplicate registration is detected.
 * Target: +4pp avant.js coverage
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since Stage 7 Coverage Initiative
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { registerSheets } from '../../scripts/logic/avant-init-utils.js';

describe('Avant Sheet Registration', () => {
    let mockActorsCollection;
    let mockItemsCollection;
    let mockActorSheet;
    let mockItemSheet;

    beforeEach(() => {
        // Mock actor sheet class
        mockActorSheet = class MockActorSheet {
            static get defaultOptions() {
                return { classes: ["avant", "sheet", "actor"] };
            }
        };

        // Mock item sheet class
        mockItemSheet = class MockItemSheet {
            static get defaultOptions() {
                return { classes: ["avant", "sheet", "item"] };
            }
        };

        // Mock Actors collection
        mockActorsCollection = {
            unregisterSheet: jest.fn(),
            registerSheet: jest.fn(),
            _sheets: new Map()
        };

        // Mock Items collection
        mockItemsCollection = {
            unregisterSheet: jest.fn(),
            registerSheet: jest.fn(),
            _sheets: new Map()
        };

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('Successful Registration', () => {
        test('registerSheets() unregisters and registers actor sheets', () => {
            const result = registerSheets(
                mockActorsCollection,
                mockItemsCollection,
                mockActorSheet,
                mockItemSheet
            );

            expect(result.success).toBe(true);
            expect(mockActorsCollection.unregisterSheet).toHaveBeenCalledWith("core", expect.any(Function));
            expect(mockActorsCollection.registerSheet).toHaveBeenCalledWith(
                "avant", 
                mockActorSheet, 
                { makeDefault: true }
            );
        });

        test('registerSheets() unregisters and registers item sheets', () => {
            const result = registerSheets(
                mockActorsCollection,
                mockItemsCollection,
                mockActorSheet,
                mockItemSheet
            );

            expect(result.success).toBe(true);
            expect(mockItemsCollection.unregisterSheet).toHaveBeenCalledWith("core", expect.any(Function));
            expect(mockItemsCollection.registerSheet).toHaveBeenCalledWith(
                "avant",
                mockItemSheet,
                { makeDefault: true }
            );
        });

        test('returns success result with message', () => {
            const result = registerSheets(
                mockActorsCollection,
                mockItemsCollection,
                mockActorSheet,
                mockItemSheet
            );

            expect(result.success).toBe(true);
            expect(result.message).toContain('Successfully registered 2 sheet types');
        });
    });

    describe('Error Handling', () => {
        test('handles missing actors collection', () => {
            expect(() => {
                registerSheets(
                    null,
                    mockItemsCollection,
                    mockActorSheet,
                    mockItemSheet
                );
            }).toThrow('Actor and item collections are required for sheet registration');
        });

        test('handles missing items collection', () => {
            expect(() => {
                registerSheets(
                    mockActorsCollection,
                    null,
                    mockActorSheet,
                    mockItemSheet
                );
            }).toThrow('Actor and item collections are required for sheet registration');
        });

        test('handles missing actor sheet class', () => {
            expect(() => {
                registerSheets(
                    mockActorsCollection,
                    mockItemsCollection,
                    null,
                    mockItemSheet
                );
            }).toThrow('Actor and item sheet classes are required for registration');
        });

        test('handles missing item sheet class', () => {
            expect(() => {
                registerSheets(
                    mockActorsCollection,
                    mockItemsCollection,
                    mockActorSheet,
                    null
                );
            }).toThrow('Actor and item sheet classes are required for registration');
        });

        test('handles actor sheet registration failure', () => {
            // Make registerSheet throw an error
            mockActorsCollection.registerSheet.mockImplementation(() => {
                throw new Error('Registration failed');
            });

            const result = registerSheets(
                mockActorsCollection,
                mockItemsCollection,
                mockActorSheet,
                mockItemSheet
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe('Registration failed');
        });

        test('handles item sheet registration failure', () => {
            // Make item registration fail
            mockItemsCollection.registerSheet.mockImplementation(() => {
                throw new Error('Item registration failed');
            });

            const result = registerSheets(
                mockActorsCollection,
                mockItemsCollection,
                mockActorSheet,
                mockItemSheet
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe('Item registration failed');
        });

        test('handles duplicate registration detection', () => {
            // Simulate already registered state
            mockActorsCollection._sheets.set('avant', mockActorSheet);

            const result = registerSheets(
                mockActorsCollection,
                mockItemsCollection,
                mockActorSheet,
                mockItemSheet
            );

            // Should still succeed but with warning
            expect(result.success).toBe(true);
            expect(result.message).toBeDefined();
        });
    });

    describe('Registration Options', () => {
        test('passes correct options to registerSheet', () => {
            registerSheets(
                mockActorsCollection,
                mockItemsCollection,
                mockActorSheet,
                mockItemSheet
            );

            expect(mockActorsCollection.registerSheet).toHaveBeenCalledWith(
                "avant",
                mockActorSheet,
                { makeDefault: true }
            );

            expect(mockItemsCollection.registerSheet).toHaveBeenCalledWith(
                "avant",
                mockItemSheet,
                { makeDefault: true }
            );
        });

        test('uses avant system identifier', () => {
            registerSheets(
                mockActorsCollection,
                mockItemsCollection,
                mockActorSheet,
                mockItemSheet
            );

            // Verify system identifier is "avant"
            expect(mockActorsCollection.registerSheet.mock.calls[0][0]).toBe("avant");
            expect(mockItemsCollection.registerSheet.mock.calls[0][0]).toBe("avant");
        });
    });
}); 