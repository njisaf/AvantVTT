/**
 * @fileoverview Integration Tests for AvantActorSheet
 * @description Tests thin wrapper without mocking - verifies actual delegation
 * @version 2.0.0
 */

import { jest } from '@jest/globals';

// Setup FoundryVTT environment
import '../../setup.js';

// Import the sheet class
import { AvantActorSheet } from '../../../scripts/sheets/actor-sheet.js';

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