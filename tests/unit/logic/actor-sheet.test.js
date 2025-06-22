/**
 * @fileoverview Unit tests for Actor Sheet Logic (Pure Functions)
 * @description Tests for pure functions extracted from AvantActorSheet class
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// Import the functions we're testing
import { 
    calculateAbilityTotalModifiers,
    calculateSkillTotalModifiers,
    calculateDefenseValues,
    calculateDefenseThreshold,
    calculateRemainingExpertisePoints,
    calculatePowerPointLimit,
    organizeSkillsByAbility,
    organizeItemsByType,
    validateAbilityRollData,
    validateSkillRollData
} from '../../../scripts/logic/actor-sheet.js';

describe('Actor Sheet Logic - Pure Functions', () => {
    
    describe('calculateAbilityTotalModifiers', () => {
        test('calculates correct total modifiers for abilities', () => {
            const abilities = {
                might: { modifier: 2 },
                intellect: { modifier: -1 },
                personality: { modifier: 0 }
            };
            const level = 3;
            
            const result = calculateAbilityTotalModifiers(abilities, level);
            
            expect(result).toEqual({
                might: 5,        // 3 + 2 = 5
                intellect: 2,    // 3 + (-1) = 2
                personality: 3   // 3 + 0 = 3
            });
        });

        test('handles missing ability modifiers', () => {
            const abilities = {
                might: {},  // no modifier property
                intellect: { modifier: 2 }
            };
            const level = 2;
            
            const result = calculateAbilityTotalModifiers(abilities, level);
            
            expect(result).toEqual({
                might: 2,        // 2 + 0 = 2 (default)
                intellect: 4     // 2 + 2 = 4
            });
        });

        test('handles invalid input data', () => {
            expect(calculateAbilityTotalModifiers(null, 3)).toEqual({});
            expect(calculateAbilityTotalModifiers(undefined, 3)).toEqual({});
            expect(calculateAbilityTotalModifiers({}, 3)).toEqual({});
        });

        test('handles invalid level values', () => {
            const abilities = { might: { modifier: 1 } };
            
            expect(calculateAbilityTotalModifiers(abilities, 0)).toEqual({ might: 2 }); // 1 default + 1 modifier
            expect(calculateAbilityTotalModifiers(abilities, null)).toEqual({ might: 2 }); // 1 default + 1 modifier
            expect(calculateAbilityTotalModifiers(abilities, 'invalid')).toEqual({ might: 2 }); // 1 default + 1 modifier
        });
    });

    describe('calculateSkillTotalModifiers', () => {
        test('calculates correct skill modifiers', () => {
            const skills = {
                athletics: 3,
                stealth: 1,
                arcana: 2
            };
            const abilities = {
                might: { modifier: 2 },
                agility: { modifier: 1 },
                intellect: { modifier: 0 }
            };
            const skillAbilityMap = {
                athletics: 'might',
                stealth: 'agility',
                arcana: 'intellect'
            };
            const level = 2;
            
            const result = calculateSkillTotalModifiers(skills, abilities, skillAbilityMap, level);
            
            expect(result).toEqual({
                athletics: 7,  // 2 + 2 + 3 = 7
                stealth: 4,    // 2 + 1 + 1 = 4
                arcana: 4      // 2 + 0 + 2 = 4
            });
        });

        test('handles missing skills with zero values', () => {
            const skills = {
                athletics: 2
                // stealth missing
            };
            const abilities = {
                might: { modifier: 1 },
                agility: { modifier: 1 }
            };
            const skillAbilityMap = {
                athletics: 'might',
                stealth: 'agility'
            };
            const level = 3;
            
            const result = calculateSkillTotalModifiers(skills, abilities, skillAbilityMap, level);
            
            expect(result).toEqual({
                athletics: 6,  // 3 + 1 + 2 = 6
                stealth: 4     // 3 + 1 + 0 = 4 (missing skill defaults to 0)
            });
        });

        test('handles invalid input data', () => {
            expect(calculateSkillTotalModifiers(null, {}, {}, 2)).toEqual({});
            expect(calculateSkillTotalModifiers({}, null, {}, 2)).toEqual({});
            expect(calculateSkillTotalModifiers({}, {}, null, 2)).toEqual({});
        });
    });

    describe('calculateDefenseValues', () => {
        test('no longer calculates defense values - returns empty object', () => {
            const abilities = {
                might: { modifier: 2 },
                intellect: { modifier: -1 },
                personality: { modifier: 1 }
            };
            const tier = 2;
            
            const result = calculateDefenseValues(abilities, tier);
            
            // Function now returns empty object since defense is user input
            expect(result).toEqual({});
        });

        test('handles invalid input data by returning empty object', () => {
            expect(calculateDefenseValues(null, 2)).toEqual({});
            expect(calculateDefenseValues(undefined, 2)).toEqual({});
            expect(calculateDefenseValues({}, 2)).toEqual({});
        });
    });

    describe('calculateDefenseThreshold', () => {
        test('no longer calculates defense threshold - returns 0', () => {
            const defenseValues = {
                might: 15,
                intellect: 12,
                personality: 18,
                agility: 14
            };
            
            const result = calculateDefenseThreshold(defenseValues);
            
            // Function now returns 0 since defense threshold is user input
            expect(result).toBe(0);
        });

        test('returns 0 for any input since defense threshold is now user input', () => {
            expect(calculateDefenseThreshold({})).toBe(0);
            expect(calculateDefenseThreshold(null)).toBe(0);
        });
    });

    describe('calculateRemainingExpertisePoints', () => {
        test('no longer calculates remaining points - returns 0', () => {
            const result = calculateRemainingExpertisePoints(15, 10);
            // Function now returns 0 since remaining points are user input
            expect(result).toBe(0);
        });

        test('returns 0 for any input since remaining points are now user input', () => {
            const result = calculateRemainingExpertisePoints(10, 15);
            expect(result).toBe(0);
        });
    });

    describe('calculatePowerPointLimit', () => {
        test('calculates correct limit for normal values', () => {
            expect(calculatePowerPointLimit(12)).toBe(4); // 12 / 3 = 4
            expect(calculatePowerPointLimit(15)).toBe(5); // 15 / 3 = 5
            expect(calculatePowerPointLimit(10)).toBe(3); // 10 / 3 = 3.33 -> 3
        });

        test('enforces minimum limit of 1', () => {
            expect(calculatePowerPointLimit(1)).toBe(1);
            expect(calculatePowerPointLimit(2)).toBe(1);
            expect(calculatePowerPointLimit(3)).toBe(1);
        });
    });

    describe('organizeSkillsByAbility', () => {
        test('organizes skills correctly by ability', () => {
            const skills = { athletics: 2 };
            const abilities = { might: { modifier: 1 } };
            const skillAbilityMap = { athletics: 'might' };
            const level = 2;
            
            const result = organizeSkillsByAbility(skills, abilities, skillAbilityMap, level);
            
            expect(result.might[0]).toEqual({
                name: 'athletics',
                label: 'Athletics', 
                value: 2,
                totalModifier: 5  // 2 + 1 + 2 = 5
            });
        });

        test('handles invalid input data', () => {
            expect(organizeSkillsByAbility(null, {}, {}, 1)).toEqual({});
            expect(organizeSkillsByAbility({}, null, {}, 1)).toEqual({});
            expect(organizeSkillsByAbility({}, {}, null, 1)).toEqual({});
        });
    });

    describe('organizeItemsByType', () => {
        test('organizes items correctly by type', () => {
            const items = [
                { type: 'weapon', name: 'Sword' },
                { type: 'action', name: 'Fireball' },
                { type: 'unknown', name: 'Mystery' }
            ];
            
            const result = organizeItemsByType(items);
            
            expect(result.weapon).toEqual([{ type: 'weapon', name: 'Sword' }]);
            expect(result.action).toEqual([{ type: 'action', name: 'Fireball' }]);
            expect(result.other).toEqual([{ type: 'unknown', name: 'Mystery' }]);
        });

        test('handles invalid input data', () => {
            const result = organizeItemsByType(null);
            expect(result).toEqual({
                action: [],
                weapon: [],
                armor: [],
                gear: [],
                talent: [],
                augment: [],
                feature: [],
                other: []
            });
        });

        // ===== CONTRACT VERIFICATION TESTS =====
        // These tests ensure the function meets all template requirements
        
        describe('Template Contract Verification', () => {
            test('provides all item categories required by actor sheet template', () => {
                const result = organizeItemsByType([]);
                
                // These categories MUST exist for template compatibility
                const requiredCategories = [
                    'weapon', 'armor', 'gear', 'talent', 
                    'augment', 'feature', 'action', 'other'
                ];
                
                requiredCategories.forEach(category => {
                    expect(result).toHaveProperty(category);
                    expect(Array.isArray(result[category])).toBe(true);
                });
            });
            
            test('organizes all supported item types correctly', () => {
                const allItemTypes = [
                    { type: 'weapon', name: 'Sword', _id: 'w1' },
                    { type: 'armor', name: 'Chain Mail', _id: 'a1' },
                    { type: 'gear', name: 'Rope', _id: 'g1' },
                    { type: 'talent', name: 'Fireball', _id: 't1' },
                    { type: 'augment', name: 'Enhanced Vision', _id: 'au1' },
                    { type: 'feature', name: 'Dark Vision', _id: 'f1' },
                    { type: 'action', name: 'Attack', _id: 'ac1' },
                    { type: 'unknown', name: 'Mystery Item', _id: 'u1' }
                ];
                
                const result = organizeItemsByType(allItemTypes);
                
                // Verify each type goes to correct category
                expect(result.weapon).toHaveLength(1);
                expect(result.weapon[0].name).toBe('Sword');
                
                expect(result.armor).toHaveLength(1);
                expect(result.armor[0].name).toBe('Chain Mail');
                
                expect(result.gear).toHaveLength(1);
                expect(result.gear[0].name).toBe('Rope');
                
                expect(result.talent).toHaveLength(1);
                expect(result.talent[0].name).toBe('Fireball');
                
                expect(result.augment).toHaveLength(1);
                expect(result.augment[0].name).toBe('Enhanced Vision');
                
                expect(result.feature).toHaveLength(1);
                expect(result.feature[0].name).toBe('Dark Vision');
                
                expect(result.action).toHaveLength(1);
                expect(result.action[0].name).toBe('Attack');
                
                // Unknown types should go to 'other'
                expect(result.other).toHaveLength(1);
                expect(result.other[0].name).toBe('Mystery Item');
            });
            
            test('handles mixed item collections without category conflicts', () => {
                const mixedItems = [
                    { type: 'weapon', name: 'Sword' },
                    { type: 'weapon', name: 'Bow' },
                    { type: 'armor', name: 'Leather' },
                    { type: 'armor', name: 'Plate' },
                    { type: 'gear', name: 'Rope' },
                    { type: 'gear', name: 'Torch' },
                    { type: 'talent', name: 'Spell A' },
                    { type: 'augment', name: 'Cyber Eye' },
                    { type: 'feature', name: 'Night Vision' }
                ];
                
                const result = organizeItemsByType(mixedItems);
                
                expect(result.weapon).toHaveLength(2);
                expect(result.armor).toHaveLength(2);
                expect(result.gear).toHaveLength(2);
                expect(result.talent).toHaveLength(1);
                expect(result.augment).toHaveLength(1);
                expect(result.feature).toHaveLength(1);
                expect(result.action).toHaveLength(0);
                expect(result.other).toHaveLength(0);
            });
            
            test('handles edge cases for item categorization', () => {
                const edgeCaseItems = [
                    { type: '', name: 'Empty Type', _id: 'empty' },
                    { type: 'invalid-type', name: 'Invalid Type', _id: 'invalid' },
                    { name: 'No Type', _id: 'notype' }, // Missing type property
                    { type: null, name: 'Null Type', _id: 'null' },
                    { type: undefined, name: 'Undefined Type', _id: 'undef' }
                ];
                
                const result = organizeItemsByType(edgeCaseItems);
                
                // All edge cases should go to 'other' category
                expect(result.other).toHaveLength(5);
                
                // Verify specific edge case handling
                const otherItems = result.other;
                expect(otherItems.find(item => item.name === 'Empty Type')).toBeDefined();
                expect(otherItems.find(item => item.name === 'Invalid Type')).toBeDefined();
                expect(otherItems.find(item => item.name === 'No Type')).toBeDefined();
                expect(otherItems.find(item => item.name === 'Null Type')).toBeDefined();
                expect(otherItems.find(item => item.name === 'Undefined Type')).toBeDefined();
                
                // All other categories should be empty
                expect(result.weapon).toHaveLength(0);
                expect(result.armor).toHaveLength(0);
                expect(result.gear).toHaveLength(0);
                expect(result.talent).toHaveLength(0);
                expect(result.augment).toHaveLength(0);
                expect(result.feature).toHaveLength(0);
                expect(result.action).toHaveLength(0);
            });
            
            test('preserves item object integrity during organization', () => {
                const originalItems = [
                    { type: 'weapon', name: 'Magic Sword', _id: 'w1', system: { damage: '1d8' } },
                    { type: 'armor', name: 'Dragon Scale', _id: 'a1', system: { defense: 5 } }
                ];
                
                const result = organizeItemsByType(originalItems);
                
                // Verify items are not modified during organization
                expect(result.weapon[0]).toEqual(originalItems[0]);
                expect(result.armor[0]).toEqual(originalItems[1]);
                
                // Verify system data is preserved
                expect(result.weapon[0].system.damage).toBe('1d8');
                expect(result.armor[0].system.defense).toBe(5);
            });

            test('would have caught the original bug (missing categories)', () => {
                // This test verifies that incomplete implementations would fail
                const testFunction = (items) => {
                    // Simulate the old buggy implementation
                    const incompleteResult = {
                        action: [],
                        weapon: [],
                        talent: [],
                        other: []
                        // Missing: armor, gear, augment, feature
                    };
                    
                    if (!Array.isArray(items)) {
                        return incompleteResult;
                    }
                    
                    for (const item of items) {
                        const itemType = item?.type || 'other';
                        if (incompleteResult[itemType]) {
                            incompleteResult[itemType].push(item);
                        } else {
                            incompleteResult.other.push(item);
                        }
                    }
                    
                    return incompleteResult;
                };
                
                const testItems = [
                    { type: 'armor', name: 'Chain Mail' },
                    { type: 'gear', name: 'Rope' }
                ];
                
                // The buggy implementation would fail this test
                const buggyResult = testFunction(testItems);
                
                // Verify the bug exists in simulated old implementation
                expect(buggyResult).not.toHaveProperty('armor');
                expect(buggyResult).not.toHaveProperty('gear');
                expect(buggyResult.other).toHaveLength(2); // Items incorrectly categorized
                
                // Verify the current implementation passes
                const correctResult = organizeItemsByType(testItems);
                expect(correctResult.armor).toHaveLength(1);
                expect(correctResult.gear).toHaveLength(1);
                expect(correctResult.other).toHaveLength(0);
            });
        });
    });

    describe('validateAbilityRollData', () => {
        test('validates correct ability roll data', () => {
            const result = validateAbilityRollData('might', { modifier: 2 }, 3);
            expect(result.valid).toBe(true);
            expect(result.level).toBe(3);
            expect(result.abilityMod).toBe(2);
        });

        test('rejects invalid ability name', () => {
            const result1 = validateAbilityRollData('', { modifier: 2 }, 3);
            expect(result1.valid).toBe(false);
            expect(result1.error).toBe("No ability name specified");
            
            const result2 = validateAbilityRollData(null, { modifier: 2 }, 3);
            expect(result2.valid).toBe(false);
            expect(result2.error).toBe("No ability name specified");
        });

        test('rejects invalid ability data', () => {
            const result1 = validateAbilityRollData('might', null, 3);
            expect(result1.valid).toBe(false);
            expect(result1.error).toBe("Invalid ability data");
            
            const result2 = validateAbilityRollData('might', undefined, 3);
            expect(result2.valid).toBe(false);
            expect(result2.error).toBe("Invalid ability data");
        });

        test('rejects invalid level', () => {
            const result1 = validateAbilityRollData('might', { modifier: 2 }, 0);
            expect(result1.valid).toBe(false);
            expect(result1.error).toBe("Invalid character level");
            
            const result2 = validateAbilityRollData('might', { modifier: 2 }, null);
            expect(result2.valid).toBe(false);
            expect(result2.error).toBe("Invalid character level");
        });

        test('handles missing ability modifier', () => {
            const result = validateAbilityRollData('might', {}, 3);
            expect(result.valid).toBe(true);
            expect(result.level).toBe(3);
            expect(result.abilityMod).toBe(0); // defaults to 0
        });
    });

    describe('validateSkillRollData', () => {
        test('validates correct skill roll data', () => {
            const result = validateSkillRollData('athletics', 3, { modifier: 1 }, 2);
            expect(result.valid).toBe(true);
            expect(result.level).toBe(2);
            expect(result.abilityMod).toBe(1);
            expect(result.skillMod).toBe(3);
        });

        test('rejects invalid skill name', () => {
            const result1 = validateSkillRollData('', 3, { modifier: 1 }, 2);
            expect(result1.valid).toBe(false);
            expect(result1.error).toBe("No skill name specified");
            
            const result2 = validateSkillRollData(null, 3, { modifier: 1 }, 2);
            expect(result2.valid).toBe(false);
            expect(result2.error).toBe("No skill name specified");
        });

        test('rejects invalid skill value', () => {
            const result1 = validateSkillRollData('athletics', undefined, { modifier: 1 }, 2);
            expect(result1.valid).toBe(false);
            expect(result1.error).toBe("Invalid skill value");
            
            const result2 = validateSkillRollData('athletics', 'invalid', { modifier: 1 }, 2);
            expect(result2.valid).toBe(false);
            expect(result2.error).toBe("Invalid skill value");
        });

        test('rejects invalid ability data', () => {
            const result = validateSkillRollData('athletics', 3, null, 2);
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Invalid ability data for skill");
        });

        test('rejects invalid level', () => {
            const result = validateSkillRollData('athletics', 3, { modifier: 1 }, 0);
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Invalid character level");
        });

        test('handles missing ability modifier', () => {
            const result = validateSkillRollData('athletics', 3, {}, 2);
            expect(result.valid).toBe(true);
            expect(result.level).toBe(2);
            expect(result.abilityMod).toBe(0); // defaults to 0
            expect(result.skillMod).toBe(3);
        });
    });
}); 