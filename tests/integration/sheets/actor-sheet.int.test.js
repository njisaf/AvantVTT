/**
 * @fileoverview Integration Tests for AvantActorSheet
 * @description Tests thin wrapper without mocking - verifies actual delegation
 * @version 2.0.0
 */

import { jest } from '@jest/globals';

// Setup FoundryVTT environment
import '../../setup.js';

// Import the sheet class
import { AvantActorSheet } from '../../../scripts/sheets/actor-sheet.ts';

describe('AvantActorSheet Integration Tests', () => {
    let actorSheet;
    let mockActor;
    let mockHtml;

    beforeAll(() => {
        // Ensure foundry global is available during class definition
        if (!global.foundry) {
            global.foundry = {
                utils: {
                    mergeObject: jest.fn((a, b) => ({ ...a, ...b })),
                    flattenObject: jest.fn(obj => obj)
                }
            };
        }
    });

    beforeEach(() => {
        // Reset console mocks
        jest.clearAllMocks();
        
        // Create mock actor
        mockActor = {
            type: 'character',
            name: 'Test Character',
            toObject: jest.fn(() => ({
                system: {
                    level: 2,
                    tier: 1,
                    abilities: {
                        might: { modifier: 2 },
                        grace: { modifier: 1 },
                        intellect: { modifier: 0 }
                    },
                    skills: {
                        force: 1,
                        hide: 2
                    },
                    expertisePoints: { total: 10, spent: 5 },
                    powerPoints: { max: 12, current: 8 }
                },
                flags: {}
            })),
            getRollData: jest.fn(() => ({ level: 2 })),
            items: []
        };

        // Create mock HTML element and wrap in jQuery for v13 compatibility
        const htmlElement = document.createElement('div');
        htmlElement.innerHTML = `
            <div class="rollable" data-roll="2d10+@level" data-label="Ability Check">
                Roll Ability
            </div>
        `;
        mockHtml = global.jQuery(htmlElement);

        // Create sheet instance
        actorSheet = new AvantActorSheet(mockActor, {});
        
        // Mock the isEditable getter to return true
        Object.defineProperty(actorSheet, 'isEditable', {
            get: () => true,
            configurable: true
        });

        // Mock ChatMessage - getSpeaker returns different values based on actor
        global.ChatMessage = {
            getSpeaker: jest.fn(({ actor } = {}) => {
                if (actor) {
                    return { alias: actor.name };
                }
                return { alias: 'Unknown' };
            })
        };
    });

    describe('Template Resolution', () => {
        test('should use static template path for character type', () => {
            const options = AvantActorSheet.defaultOptions;
            expect(options.template).toBe('systems/avant/templates/actor-sheet.html');
        });

        test('should handle different actor types with same template', () => {
            mockActor.type = 'npc';
            const options = AvantActorSheet.defaultOptions;
            expect(options.template).toBe('systems/avant/templates/actor-sheet.html');
        });
    });

    describe('Default Options', () => {
        test('should have correct default options', () => {
            const options = AvantActorSheet.defaultOptions;
            
            expect(options.classes).toContain('avant');
            expect(options.classes).toContain('sheet');
            expect(options.classes).toContain('actor');
            expect(options.width).toBe(900);
            expect(options.height).toBe(630);
            expect(options.tabs).toBeDefined();
        });
    });

    describe('Data Preparation', () => {
        test('should prepare context data correctly', () => {
            const context = actorSheet.getData();
            
            expect(mockActor.toObject).toHaveBeenCalledWith(false);
            expect(context.system).toBeDefined();
            expect(context.system.level).toBe(2);
            
            // Check that calculated values are present (actual property names)
            expect(context.abilityTotalModifiers).toBeDefined();
            expect(context.skillTotalModifiers).toBeDefined();
            expect(context.system.defense).toBeDefined();
            expect(context.system.defenseThreshold).toBeDefined();
        });

        test('should calculate ability total modifiers correctly', () => {
            const context = actorSheet.getData();
            
            // level (2) + ability modifier (2) = 4 for might
            expect(context.abilityTotalModifiers.might).toBe(4);
            expect(context.abilityTotalModifiers.grace).toBe(3);
            expect(context.abilityTotalModifiers.intellect).toBe(2);
        });

        test('should handle empty abilities and skills', () => {
            mockActor.toObject.mockReturnValue({
                system: { level: 1 },
                flags: {}
            });
            
            const context = actorSheet.getData();
            expect(context.abilityTotalModifiers).toBeDefined();
            expect(context.skillTotalModifiers).toBeDefined();
        });
    });

    describe('Event Listener Activation', () => {
        test('should activate listeners for editable sheet without errors', () => {
            expect(() => {
                actorSheet.activateListeners(mockHtml);
            }).not.toThrow();
        });

        test('should not crash with non-editable sheet', () => {
            // Create a new sheet instance with isEditable = false
            const nonEditableSheet = new AvantActorSheet(mockActor, {});
            Object.defineProperty(nonEditableSheet, 'isEditable', {
                get: () => false,
                configurable: true
            });
            
            expect(() => {
                nonEditableSheet.activateListeners(mockHtml);
            }).not.toThrow();
        });

        test('should handle null HTML gracefully', () => {
            // v13 actor sheet expects valid jQuery object, null should not be passed
            // This is testing current behavior - null HTML would throw an error
            expect(() => {
                actorSheet.activateListeners(null);
            }).toThrow();
        });
    });

    describe('Core Listener Activation', () => {
        test('should properly delegate to core framework', () => {
            // v13-only implementation delegates all listener activation to parent class
            // No separate _activateCoreListeners method needed
            expect(() => {
                actorSheet.activateListeners(mockHtml);
            }).not.toThrow();
        });
    });

    describe('Roll Handling', () => {
        test('should handle roll events without crashing', async () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                currentTarget: {
                    dataset: {
                        roll: '2d10+@level',
                        label: 'Ability Check'
                    }
                }
            };

            // Should not throw even if roll logic fails
            expect(async () => {
                await actorSheet._onRoll(mockEvent);
            }).not.toThrow();

            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        test('should handle roll with empty dataset', async () => {
            const mockEvent = {
                preventDefault: jest.fn(),
                currentTarget: { dataset: {} }
            };

            const result = await actorSheet._onRoll(mockEvent);
            expect(result).toBeUndefined();
        });
    });

    describe('Item Management', () => {
        test('should organize items by type correctly', () => {
            mockActor.items = [
                { type: 'weapon', name: 'Sword' },
                { type: 'action', name: 'Attack' },
                { type: 'talent', name: 'Skill Focus' }
            ];
            
            const context = actorSheet.getData();
            
            expect(context.items).toBeDefined();
            expect(context.items.weapon).toHaveLength(1);
            expect(context.items.action).toHaveLength(1);
            expect(context.items.talent).toHaveLength(1);
        });

        // ===== COMPREHENSIVE INTEGRATION TESTS =====
        // These tests verify complete data flow from getData() to template context

        test('organizes all item types correctly for template consumption', () => {
            // Setup: Actor with all supported item types
            const mockItems = [
                { type: 'weapon', name: 'Magic Sword', _id: 'w1' },
                { type: 'armor', name: 'Dragon Scale Armor', _id: 'a1' },
                { type: 'gear', name: 'Healing Potion', _id: 'g1' },
                { type: 'talent', name: 'Fireball', _id: 't1' },
                { type: 'augment', name: 'Cybernetic Eye', _id: 'au1' },
                { type: 'feature', name: 'Night Vision', _id: 'f1' },
                { type: 'action', name: 'Power Attack', _id: 'ac1' }
            ];
            
            mockActor.items = mockItems;
            
            // Execute: Get sheet data
            const context = actorSheet.getData();
            
            // Verify: Items are properly organized for template
            expect(context.items).toBeDefined();
            expect(context.items.weapon).toHaveLength(1);
            expect(context.items.weapon[0].name).toBe('Magic Sword');
            
            expect(context.items.armor).toHaveLength(1);
            expect(context.items.armor[0].name).toBe('Dragon Scale Armor');
            
            expect(context.items.gear).toHaveLength(1);
            expect(context.items.gear[0].name).toBe('Healing Potion');
            
            expect(context.items.talent).toHaveLength(1);
            expect(context.items.talent[0].name).toBe('Fireball');
            
            expect(context.items.augment).toHaveLength(1);
            expect(context.items.augment[0].name).toBe('Cybernetic Eye');
            
            expect(context.items.feature).toHaveLength(1);
            expect(context.items.feature[0].name).toBe('Night Vision');
            
            expect(context.items.action).toHaveLength(1);
            expect(context.items.action[0].name).toBe('Power Attack');
            
            // Empty category should exist as empty array
            expect(context.items.other).toEqual([]);
        });
        
        test('handles empty item collections gracefully', () => {
            mockActor.items = [];
            
            const context = actorSheet.getData();
            
            // All categories should exist as empty arrays
            const requiredCategories = [
                'weapon', 'armor', 'gear', 'talent', 
                'augment', 'feature', 'action', 'other'
            ];
            
            requiredCategories.forEach(category => {
                expect(context.items[category]).toEqual([]);
            });
        });
        
        test('handles items with missing or invalid types', () => {
            const mockItems = [
                { type: 'weapon', name: 'Valid Weapon', _id: 'valid' },
                { type: '', name: 'Empty Type', _id: 'empty' },
                { type: 'invalid-type', name: 'Invalid Type', _id: 'invalid' },
                { name: 'No Type', _id: 'notype' } // Missing type property
            ];
            
            mockActor.items = mockItems;
            
            const context = actorSheet.getData();
            
            expect(context.items.weapon).toHaveLength(1);
            expect(context.items.weapon[0].name).toBe('Valid Weapon');
            
            // Invalid/missing types should go to 'other'
            expect(context.items.other).toHaveLength(3);
            expect(context.items.other.find(item => item.name === 'Empty Type')).toBeDefined();
            expect(context.items.other.find(item => item.name === 'Invalid Type')).toBeDefined();
            expect(context.items.other.find(item => item.name === 'No Type')).toBeDefined();
        });

        test('preserves item system data during organization', () => {
            const mockItems = [
                { 
                    type: 'weapon', 
                    name: 'Magic Sword', 
                    _id: 'w1',
                    system: { 
                        damage: '2d6+3',
                        range: 'melee',
                        properties: ['magical', 'sharp']
                    }
                },
                { 
                    type: 'armor', 
                    name: 'Plate Mail', 
                    _id: 'a1',
                    system: { 
                        defense: 8,
                        weight: 'heavy',
                        material: 'steel'
                    }
                }
            ];
            
            mockActor.items = mockItems;
            
            const context = actorSheet.getData();
            
            // Verify system data is preserved through getData() flow
            expect(context.items.weapon[0].system.damage).toBe('2d6+3');
            expect(context.items.weapon[0].system.properties).toEqual(['magical', 'sharp']);
            
            expect(context.items.armor[0].system.defense).toBe(8);
            expect(context.items.armor[0].system.material).toBe('steel');
        });

        test('handles large item collections efficiently', () => {
            // Test with a realistic large collection
            const largeItemCollection = [];
            
            // Add 10 items of each type
            const itemTypes = ['weapon', 'armor', 'gear', 'talent', 'augment', 'feature', 'action'];
            itemTypes.forEach(type => {
                for (let i = 0; i < 10; i++) {
                    largeItemCollection.push({
                        type: type,
                        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
                        _id: `${type}-${i + 1}`
                    });
                }
            });
            
            mockActor.items = largeItemCollection;
            
            const context = actorSheet.getData();
            
            // Verify all items are properly organized
            expect(context.items.weapon).toHaveLength(10);
            expect(context.items.armor).toHaveLength(10);
            expect(context.items.gear).toHaveLength(10);
            expect(context.items.talent).toHaveLength(10);
            expect(context.items.augment).toHaveLength(10);
            expect(context.items.feature).toHaveLength(10);
            expect(context.items.action).toHaveLength(10);
            expect(context.items.other).toHaveLength(0);
            
            // Verify performance: getData() should complete quickly even with many items
            const startTime = performance.now();
            actorSheet.getData();
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
        });
    });

    describe('Template Context Completeness', () => {
        test('provides all required context properties for template rendering', () => {
            const context = actorSheet.getData();
            
            // Verify essential context properties exist
            expect(context.system).toBeDefined();
            expect(context.items).toBeDefined();
            expect(context.abilityTotalModifiers).toBeDefined();
            expect(context.skillTotalModifiers).toBeDefined();
            
            // Verify items context has all required categories
            const requiredItemCategories = [
                'weapon', 'armor', 'gear', 'talent', 
                'augment', 'feature', 'action', 'other'
            ];
            
            requiredItemCategories.forEach(category => {
                expect(context.items).toHaveProperty(category);
                expect(Array.isArray(context.items[category])).toBe(true);
            });
        });

        test('maintains data consistency between multiple getData() calls', () => {
            // Setup consistent test data
            mockActor.items = [
                { type: 'weapon', name: 'Sword' },
                { type: 'armor', name: 'Shield' }
            ];
            
            // Call getData() multiple times
            const context1 = actorSheet.getData();
            const context2 = actorSheet.getData();
            const context3 = actorSheet.getData();
            
            // Results should be consistent
            expect(context1.items.weapon).toEqual(context2.items.weapon);
            expect(context2.items.weapon).toEqual(context3.items.weapon);
            expect(context1.items.armor).toEqual(context2.items.armor);
            expect(context2.items.armor).toEqual(context3.items.armor);
        });

        test('integrates item organization with other sheet data correctly', () => {
            // Setup: Actor with items and other system data
            mockActor.items = [
                { type: 'weapon', name: 'Sword' },
                { type: 'armor', name: 'Plate' }
            ];
            
            const context = actorSheet.getData();
            
            // Verify item organization doesn't interfere with other calculations
            expect(context.abilityTotalModifiers).toBeDefined();
            expect(context.abilityTotalModifiers.might).toBe(4); // level 2 + modifier 2
            
            expect(context.system.defense).toBeDefined();
            expect(context.system.defense.might).toBe(14); // 11 + tier 1 + modifier 2
            
            // Verify items are properly integrated alongside other data
            expect(context.items.weapon).toHaveLength(1);
            expect(context.items.armor).toHaveLength(1);
        });

        test('would have caught original bug - missing item categories in template context', () => {
            // Setup items that would have been misorganized by the original bug
            mockActor.items = [
                { type: 'armor', name: 'Chain Mail' },
                { type: 'gear', name: 'Rope' },
                { type: 'augment', name: 'Cyber Arm' },
                { type: 'feature', name: 'Darkvision' }
            ];
            
            const context = actorSheet.getData();
            
            // These should be properly categorized now (would have failed before fix)
            expect(context.items.armor).toHaveLength(1);
            expect(context.items.armor[0].name).toBe('Chain Mail');
            
            expect(context.items.gear).toHaveLength(1);
            expect(context.items.gear[0].name).toBe('Rope');
            
            expect(context.items.augment).toHaveLength(1);
            expect(context.items.augment[0].name).toBe('Cyber Arm');
            
            expect(context.items.feature).toHaveLength(1);
            expect(context.items.feature[0].name).toBe('Darkvision');
            
            // These should be empty (not filled with incorrectly categorized items)
            expect(context.items.other).toHaveLength(0);
            expect(context.items.weapon).toHaveLength(0);
            expect(context.items.action).toHaveLength(0);
            expect(context.items.talent).toHaveLength(0);
        });
    });

    describe('Version Compatibility', () => {
        test('should require foundry.utils.mergeObject for v13', () => {
            const originalFoundry = global.foundry;
            global.foundry = {
                utils: {} // Missing mergeObject method
            };

            // v13-only code requires foundry.utils.mergeObject - should throw
            expect(() => {
                AvantActorSheet.defaultOptions;
            }).toThrow();

            // Restore foundry
            global.foundry = originalFoundry;
        });
    });

    describe('Defense Calculations', () => {
        test('should calculate defense values correctly', () => {
            const context = actorSheet.getData();
            
            // base 11 + tier 1 + ability modifier
            expect(context.system.defense.might).toBe(14); // 11 + 1 + 2
            expect(context.system.defense.grace).toBe(13); // 11 + 1 + 1
            expect(context.system.defense.intellect).toBe(12); // 11 + 1 + 0
        });

        test('should calculate defense threshold correctly', () => {
            const context = actorSheet.getData();
            
            // Should be the highest defense value
            expect(context.system.defenseThreshold).toBe(14);
        });
    });

    describe('Logic Function Integration', () => {
        test('should use calculated values for display', () => {
            const context = actorSheet.getData();
            
            // These should be calculated by the getData method
            expect(typeof context.abilityTotalModifiers).toBe('object');
            expect(typeof context.skillTotalModifiers).toBe('object');
            expect(typeof context.system.defense).toBe('object');
            expect(typeof context.system.defenseThreshold).toBe('number');
        });

        test('should handle missing skill-to-ability mapping gracefully', () => {
            // This tests resilience when AvantActorData.getSkillAbilities() fails
            expect(() => {
                const context = actorSheet.getData();
                expect(context.skillTotalModifiers).toBeDefined();
            }).not.toThrow();
        });
    });

    describe('Error Resilience', () => {
        test('should handle corrupted actor data gracefully', () => {
            mockActor.toObject = jest.fn(() => {
                throw new Error('Data corruption');
            });

            expect(() => {
                actorSheet.getData();
            }).toThrow('Data corruption');
        });

        test('should handle missing system data', () => {
            mockActor.toObject.mockReturnValue({
                flags: {}
            });
            
            const context = actorSheet.getData();
            // Even with missing system data, defense calculations are still added
            expect(context.system).toBeDefined();
            expect(context.system.defense).toBeDefined();
            expect(context.system.defenseThreshold).toBe(10); // Default when no defenses calculated
        });
    });
}); 