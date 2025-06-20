/**
 * @fileoverview Unit Tests for Avant Initialization Utilities
 * @version 2.0.0
 * @author Avant Development Team  
 * @description Tests for pure functions in avant-init-utils.js
 */

import { describe, test, expect, beforeEach, beforeAll, jest } from '@jest/globals';

// Import functions to test
import { registerSheets, setupConfigDebug, setupDataModels } from '../../../scripts/logic/avant-init-utils.js';
import { CompatibilityUtils } from '../../../scripts/utils/compatibility.js';

describe('Avant Initialization Utils', () => {
    
    beforeEach(() => {
        // Patch CompatibilityUtils methods to return strings instead of functions
        jest.spyOn(CompatibilityUtils, 'getActorSheetClass').mockReturnValue('MockActorSheet');
        jest.spyOn(CompatibilityUtils, 'getItemSheetClass').mockReturnValue('MockItemSheet');
    });
    
    describe('registerSheets', () => {
        let mockActorCollection, mockItemCollection;
        let mockActorSheetClass, mockItemSheetClass;
        
        beforeEach(() => {
            // Create mock collections with spy methods
            mockActorCollection = {
                unregisterSheet: jest.fn(),
                registerSheet: jest.fn()
            };
            
            mockItemCollection = {
                unregisterSheet: jest.fn(),
                registerSheet: jest.fn()
            };
            
            // Mock sheet classes
            mockActorSheetClass = class MockActorSheet {};
            mockItemSheetClass = class MockItemSheet {};
        });
        
        test('successfully registers both actor and item sheets', () => {
            // ACT: Register sheets
            const result = registerSheets(
                mockActorCollection, 
                mockItemCollection,
                mockActorSheetClass,
                mockItemSheetClass
            );
            
            // ASSERT: Registration succeeded
            expect(result.success).toBe(true);
            expect(result.registeredSheets).toBe(2);
            expect(result.message).toBe('Successfully registered 2 sheet types');
            
            // Verify actor sheet registration (CompatibilityUtils returns string)
            expect(mockActorCollection.unregisterSheet).toHaveBeenCalledWith('core', 'MockActorSheet');
            expect(mockActorCollection.registerSheet).toHaveBeenCalledWith(
                'avant', mockActorSheetClass, { makeDefault: true }
            );
            
            // Verify item sheet registration (CompatibilityUtils returns string)
            expect(mockItemCollection.unregisterSheet).toHaveBeenCalledWith('core', 'MockItemSheet');
            expect(mockItemCollection.registerSheet).toHaveBeenCalledWith(
                'avant', mockItemSheetClass, { makeDefault: true }
            );
        });
        
        test('throws error when actor collection is missing', () => {
            // ACT & ASSERT: Should throw error
            expect(() => {
                registerSheets(null, mockItemCollection, mockActorSheetClass, mockItemSheetClass);
            }).toThrow('Actor and item collections are required for sheet registration');
        });
        
        test('throws error when item collection is missing', () => {
            // ACT & ASSERT: Should throw error
            expect(() => {
                registerSheets(mockActorCollection, null, mockActorSheetClass, mockItemSheetClass);
            }).toThrow('Actor and item collections are required for sheet registration');
        });
        
        test('throws error when actor sheet class is missing', () => {
            // ACT & ASSERT: Should throw error
            expect(() => {
                registerSheets(mockActorCollection, mockItemCollection, null, mockItemSheetClass);
            }).toThrow('Actor and item sheet classes are required for registration');
        });
        
        test('throws error when item sheet class is missing', () => {
            // ACT & ASSERT: Should throw error
            expect(() => {
                registerSheets(mockActorCollection, mockItemCollection, mockActorSheetClass, null);
            }).toThrow('Actor and item sheet classes are required for registration');
        });
        
        test('handles registration failure gracefully', () => {
            // ARRANGE: Make actor registration throw error
            mockActorCollection.registerSheet.mockImplementation(() => {
                throw new Error('Registration failed');
            });
            
            // ACT: Attempt registration
            const result = registerSheets(
                mockActorCollection,
                mockItemCollection, 
                mockActorSheetClass,
                mockItemSheetClass
            );
            
            // ASSERT: Should return error result
            expect(result.success).toBe(false);
            expect(result.error).toBe('Registration failed');
            expect(result.message).toBe('Failed to register sheets: Registration failed');
            expect(result.registeredSheets).toBe(0); // No sheets registered when error occurs
        });
    });
    
    describe('setupConfigDebug', () => {
        let mockConfig;
        
        beforeEach(() => {
            mockConfig = {
                Actor: {},
                Item: {},
                AVANT: {}
            };
        });
        
        test('applies default debug configuration', () => {
            // ACT: Setup debug with defaults
            const result = setupConfigDebug(mockConfig);
            
            // ASSERT: Default settings applied
            expect(result.success).toBe(true);
            expect(result.appliedSettings.debug).toBe(false);
            expect(result.appliedSettings.logLevel).toBe('info');
            expect(result.appliedSettings.timing).toBe(false);
            expect(result.appliedSettings.avantDebug).toBe(false);
            
            // Verify CONFIG object updated
            expect(mockConfig.debug).toBe(false);
            expect(mockConfig.logLevel).toBe('info');
            expect(mockConfig.time).toBe(false);
            expect(mockConfig.AVANT.debug).toBe(false);
            expect(mockConfig.AVANT.logLevel).toBe('info');
        });
        
        test('applies custom debug configuration', () => {
            // ARRANGE: Custom options
            const options = {
                enableDebug: true,
                logLevel: 'debug',
                enableTiming: true
            };
            
            // ACT: Setup debug with custom options
            const result = setupConfigDebug(mockConfig, options);
            
            // ASSERT: Custom settings applied
            expect(result.success).toBe(true);
            expect(result.appliedSettings.debug).toBe(true);
            expect(result.appliedSettings.logLevel).toBe('debug');
            expect(result.appliedSettings.timing).toBe(true);
            expect(result.appliedSettings.avantDebug).toBe(true);
            
            // Verify CONFIG object updated
            expect(mockConfig.debug).toBe(true);
            expect(mockConfig.logLevel).toBe('debug');
            expect(mockConfig.time).toBe(true);
            expect(mockConfig.AVANT.debug).toBe(true);
            expect(mockConfig.AVANT.logLevel).toBe('debug');
        });
        
        test('ignores invalid log level', () => {
            // ARRANGE: Invalid log level
            const options = { logLevel: 'invalid' };
            
            // ACT: Setup debug with invalid log level
            const result = setupConfigDebug(mockConfig, options);
            
            // ASSERT: Invalid log level ignored
            expect(result.success).toBe(true);
            expect(result.appliedSettings.logLevel).toBeUndefined();
            expect(mockConfig.logLevel).toBeUndefined();
        });
        
        test('handles missing CONFIG object', () => {
            // ACT & ASSERT: Should throw error
            expect(() => {
                setupConfigDebug(null);
            }).toThrow('CONFIG object is required for debug setup');
        });
        
        test('handles setup failure gracefully', () => {
            // ARRANGE: Mock config that throws on property access
            const badConfig = {};
            Object.defineProperty(badConfig, 'debug', {
                set: () => { throw new Error('Property access failed'); }
            });
            
            // ACT: Attempt setup
            const result = setupConfigDebug(badConfig);
            
            // ASSERT: Should return error result
            expect(result.success).toBe(false);
            expect(result.error).toBe('Property access failed');
            expect(result.message).toBe('Failed to setup debug configuration: Property access failed');
        });
        
        test('preserves existing AVANT config section', () => {
            // ARRANGE: Config with existing AVANT section
            mockConfig.AVANT = { existing: 'value' };
            
            // ACT: Setup debug
            const result = setupConfigDebug(mockConfig, { enableDebug: true });
            
            // ASSERT: Existing config preserved and new values added
            expect(result.success).toBe(true);
            expect(mockConfig.AVANT.existing).toBe('value');
            expect(mockConfig.AVANT.debug).toBe(true);
            expect(mockConfig.AVANT.logLevel).toBe('info');
        });
    });
    
    describe('setupDataModels', () => {
        let mockConfig;
        let mockActorClass, mockItemClass;
        let mockActorModels, mockItemModels;
        
        beforeEach(() => {
            mockConfig = {
                Actor: {},
                Item: {},
                AVANT: {}
            };
            
            mockActorClass = class MockActor {};
            mockItemClass = class MockItem {};
            
            mockActorModels = {
                character: 'CharacterData',
                npc: 'NPCData'
            };
            
            mockItemModels = {
                weapon: 'WeaponData',
                armor: 'ArmorData',
                gear: 'GearData'
            };
        });
        
        test('configures complete data model setup', () => {
            // ACT: Setup all data models
            const result = setupDataModels(
                mockConfig,
                mockActorClass,
                mockItemClass,
                mockActorModels,
                mockItemModels
            );
            
            // ASSERT: All models configured
            expect(result.success).toBe(true);
            expect(result.configuredModels).toBe(7); // 2 classes + 2 actor + 3 item models
            expect(result.actorTypes).toEqual(['character', 'npc']);
            expect(result.itemTypes).toEqual(['weapon', 'armor', 'gear']);
            expect(result.message).toBe('Successfully configured 7 data models');
            
            // Verify CONFIG updated
            expect(mockConfig.Actor.documentClass).toBe(mockActorClass);
            expect(mockConfig.Item.documentClass).toBe(mockItemClass);
            expect(mockConfig.Actor.dataModels).toEqual(mockActorModels);
            expect(mockConfig.Item.dataModels).toEqual(mockItemModels);
        });
        
        test('configures only actor class without models', () => {
            // ACT: Setup only actor class
            const result = setupDataModels(mockConfig, mockActorClass, null, {}, {});
            
            // ASSERT: Only actor class configured
            expect(result.success).toBe(true);
            expect(result.configuredModels).toBe(1);
            expect(result.actorTypes).toEqual([]);
            expect(result.itemTypes).toEqual([]);
            
            // Verify CONFIG updated
            expect(mockConfig.Actor.documentClass).toBe(mockActorClass);
            expect(mockConfig.Item.documentClass).toBeUndefined();
        });
        
        test('configures only data models without classes', () => {
            // ACT: Setup only data models
            const result = setupDataModels(mockConfig, null, null, mockActorModels, mockItemModels);
            
            // ASSERT: Only data models configured
            expect(result.success).toBe(true);
            expect(result.configuredModels).toBe(5); // 2 actor + 3 item models
            expect(result.actorTypes).toEqual(['character', 'npc']);
            expect(result.itemTypes).toEqual(['weapon', 'armor', 'gear']);
            
            // Verify CONFIG updated
            expect(mockConfig.Actor.documentClass).toBeUndefined();
            expect(mockConfig.Item.documentClass).toBeUndefined();
            expect(mockConfig.Actor.dataModels).toEqual(mockActorModels);
            expect(mockConfig.Item.dataModels).toEqual(mockItemModels);
        });
        
        test('handles missing CONFIG object', () => {
            // ACT & ASSERT: Should throw error
            expect(() => {
                setupDataModels(null, mockActorClass, mockItemClass);
            }).toThrow('CONFIG object is required for data model setup');
        });
        
        test('handles setup failure gracefully', () => {
            // ARRANGE: Mock config that throws on property access
            const badConfig = {
                Actor: {},
                Item: {}
            };
            Object.defineProperty(badConfig.Actor, 'documentClass', {
                set: () => { throw new Error('Document class assignment failed'); }
            });
            
            // ACT: Attempt setup
            const result = setupDataModels(badConfig, mockActorClass, mockItemClass);
            
            // ASSERT: Should return error result
            expect(result.success).toBe(false);
            expect(result.error).toBe('Document class assignment failed');
            expect(result.message).toBe('Failed to setup data models: Document class assignment failed');
        });
        
        test('handles empty model objects correctly', () => {
            // ARRANGE: Empty model objects
            const mockActorClass = class MockActor {};
            const mockItemClass = class MockItem {};
            
            // ACT: Setup with empty models
            const result = setupDataModels(mockConfig, mockActorClass, mockItemClass, {}, {});
            
            // ASSERT: Setup succeeded with empty models
            expect(result.success).toBe(true);
            expect(result.configuredModels).toBe(2); // Just the 2 document classes
            expect(result.actorTypes).toEqual([]);
            expect(result.itemTypes).toEqual([]);
            
            // Verify CONFIG object structure
            expect(mockConfig.Actor.documentClass).toBe(mockActorClass);
            expect(mockConfig.Item.documentClass).toBe(mockItemClass);
            // dataModels should not be set when empty objects are passed
            expect(mockConfig.Actor.dataModels).toBeUndefined();
            expect(mockConfig.Item.dataModels).toBeUndefined();
        });
    });
}); 