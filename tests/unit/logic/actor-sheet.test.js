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
        test('calculates correct defense values', () => {
            const abilities = {
                might: { modifier: 2 },
                intellect: { modifier: -1 },
                personality: { modifier: 1 }
            };
            const tier = 2;
            
            const result = calculateDefenseValues(abilities, tier);
            
            expect(result).toEqual({
                might: 15,       // 11 + 2 + 2 = 15
                intellect: 12,   // 11 + 2 + (-1) = 12
                personality: 14  // 11 + 2 + 1 = 14
            });
        });

        test('handles invalid input data', () => {
            expect(calculateDefenseValues(null, 2)).toEqual({});
            expect(calculateDefenseValues(undefined, 2)).toEqual({});
            expect(calculateDefenseValues({}, 2)).toEqual({});
        });
    });

    describe('calculateDefenseThreshold', () => {
        test('returns highest defense value', () => {
            const defenseValues = {
                might: 15,
                intellect: 12,
                personality: 18,
                agility: 14
            };
            
            const result = calculateDefenseThreshold(defenseValues);
            
            expect(result).toBe(18);
        });

        test('returns default when no valid defenses', () => {
            expect(calculateDefenseThreshold({})).toBe(10);
            expect(calculateDefenseThreshold(null)).toBe(10);
        });
    });

    describe('calculateRemainingExpertisePoints', () => {
        test('calculates positive remaining points', () => {
            const result = calculateRemainingExpertisePoints(15, 10);
            expect(result).toBe(5);
        });

        test('calculates negative remaining points (overspent)', () => {
            const result = calculateRemainingExpertisePoints(10, 15);
            expect(result).toBe(-5);
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
                talent: [],
                other: []
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