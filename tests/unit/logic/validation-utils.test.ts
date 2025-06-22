/**
 * @fileoverview Unit Tests for Validation Logic Pure Functions
 * @description Tests for pure validation functions without FoundryVTT dependencies
 * @version 2.0.0
 * @author Avant Development Team
 */

import { describe, test, expect } from '@jest/globals';
import {
    validateNumber,
    validateString,
    validateActorType,
    validateItemType,
    validateAbilities,
    validateSkills,
    validateActorAbilities,
    validateActorSkills,
    validateHealthData,
    validatePowerPointsData,
    validateUsesData,
    isValidDocumentId,
    sanitizeHtml
} from '../../../scripts/logic/validation-utils';

describe('Validation Utils Pure Functions', () => {
    describe('validateNumber', () => {
        test('should convert valid string numbers to integers', () => {
            expect(validateNumber("5", 1, true)).toBe(5);
            expect(validateNumber("123", 0, true)).toBe(123);
            expect(validateNumber("-10", 0, true)).toBe(-10);
        });

        test('should convert valid string numbers to floats', () => {
            expect(validateNumber("5.5", 1.0, false)).toBe(5.5);
            expect(validateNumber("123.456", 0.0, false)).toBe(123.456);
            expect(validateNumber("-10.25", 0.0, false)).toBe(-10.25);
        });

        test('should handle existing numbers', () => {
            expect(validateNumber(42, 1, true)).toBe(42);
            expect(validateNumber(3.14, 1.0, false)).toBe(3.14);
        });

        test('should return default for invalid values', () => {
            expect(validateNumber("abc", 5, true)).toBe(5);
            expect(validateNumber(null, 10, true)).toBe(10);
            expect(validateNumber(undefined, 15, true)).toBe(15);
            expect(validateNumber("", 20, true)).toBe(20);
        });

        test('should truncate floats when integer required', () => {
            expect(validateNumber("5.9", 1, true)).toBe(5);
            expect(validateNumber(7.8, 1, true)).toBe(7);
        });

        test('should preserve floats when float allowed', () => {
            expect(validateNumber("5.9", 1.0, false)).toBe(5.9);
            expect(validateNumber(7.8, 1.0, false)).toBe(7.8);
        });
    });

    describe('validateString', () => {
        test('should preserve valid strings', () => {
            expect(validateString("hello", "")).toBe("hello");
            expect(validateString("test", "default")).toBe("test");
        });

        test('should convert numbers to strings', () => {
            expect(validateString(123, "")).toBe("123");
            expect(validateString(45.67, "")).toBe("45.67");
        });

        test('should convert booleans to strings', () => {
            expect(validateString(true, "")).toBe("true");
            expect(validateString(false, "")).toBe("false");
        });

        test('should return default for null/undefined', () => {
            expect(validateString(null, "default")).toBe("default");
            expect(validateString(undefined, "fallback")).toBe("fallback");
        });

        test('should handle empty string as valid', () => {
            expect(validateString("", "default")).toBe("");
        });
    });

    describe('validateActorType', () => {
        test('should accept valid actor types', () => {
            expect(validateActorType("character")).toBe("character");
            expect(validateActorType("npc")).toBe("npc");
            expect(validateActorType("vehicle")).toBe("vehicle");
        });

        test('should default invalid types to character', () => {
            expect(validateActorType("invalid")).toBe("character");
            expect(validateActorType("monster")).toBe("character");
            expect(validateActorType("")).toBe("character");
        });

        test('should handle null/undefined inputs', () => {
            expect(validateActorType(null)).toBe("character");
            expect(validateActorType(undefined)).toBe("character");
        });

        test('should handle non-string inputs', () => {
            expect(validateActorType(123)).toBe("character");
            expect(validateActorType({})).toBe("character");
        });
    });

    describe('validateItemType', () => {
        test('should accept valid item types', () => {
            expect(validateItemType("action")).toBe("action");
            expect(validateItemType("feature")).toBe("feature");
            expect(validateItemType("talent")).toBe("talent");
            expect(validateItemType("augment")).toBe("augment");
            expect(validateItemType("weapon")).toBe("weapon");
            expect(validateItemType("armor")).toBe("armor");
            expect(validateItemType("gear")).toBe("gear");
        });

        test('should default invalid types to gear', () => {
            expect(validateItemType("invalid")).toBe("gear");
            expect(validateItemType("spell")).toBe("gear");
            expect(validateItemType("")).toBe("gear");
        });

        test('should handle null/undefined inputs', () => {
            expect(validateItemType(null)).toBe("gear");
            expect(validateItemType(undefined)).toBe("gear");
        });
    });

    describe('validateAbilities', () => {
        test('should validate complete abilities object', () => {
            const input = {
                might: { modifier: 3 },
                grace: { modifier: -1 },
                intellect: { modifier: 2 },
                focus: { modifier: 0 }
            };
            
            const result = validateAbilities(input) as any;
            
            expect(result.might.modifier).toBe(3);
            expect(result.grace.modifier).toBe(-1);
            expect(result.intellect.modifier).toBe(2);
            expect(result.focus.modifier).toBe(0);
        });

        test('should fill missing abilities with default values', () => {
            const input = {
                might: { modifier: 2 }
            };
            
            const result = validateAbilities(input) as any;
            
            expect(result.might.modifier).toBe(2);
            expect(result.grace.modifier).toBe(0);
            expect(result.intellect.modifier).toBe(0);
            expect(result.focus.modifier).toBe(0);
        });

        test('should allow free input without bounds checking', () => {
            const input = {
                might: { modifier: 15 },
                grace: { modifier: -15 }
            };
            
            const result = validateAbilities(input) as any;
            
            expect(result.might.modifier).toBe(15);
            expect(result.grace.modifier).toBe(-15);
        });

        test('should handle null/undefined input', () => {
            const result1 = validateAbilities(null) as any;
            const result2 = validateAbilities(undefined) as any;
            
            expect(result1.might.modifier).toBe(0);
            expect(result1.grace.modifier).toBe(0);
            expect(result2.intellect.modifier).toBe(0);
            expect(result2.focus.modifier).toBe(0);
        });

        test('should convert string modifiers to numbers', () => {
            const input = {
                might: { modifier: "3" },
                grace: { modifier: "-1" }
            };
            
            const result = validateAbilities(input) as any;
            
            expect(result.might.modifier).toBe(3);
            expect(result.grace.modifier).toBe(-1);
        });
    });

    describe('validateSkills', () => {
        test('should validate all core skills', () => {
            const input = {
                debate: 3,
                force: 2,
                charm: 1
            };
            
            const result = validateSkills(input);
            
            expect(result.debate).toBe(3);
            expect(result.force).toBe(2);
            expect(result.charm).toBe(1);
            expect(result.discern).toBe(0);
            expect(result.endure).toBe(0);
            expect(result.finesse).toBe(0);
            expect(result.command).toBe(0);
            expect(result.hide).toBe(0);
            expect(result.inspect).toBe(0);
            expect(result.intuit).toBe(0);
            expect(result.recall).toBe(0);
            expect(result.surge).toBe(0);
        });

        test('should convert string values to numbers', () => {
            const input = {
                debate: "5",
                force: "2"
            };
            
            const result = validateSkills(input);
            
            expect(result.debate).toBe(5);
            expect(result.force).toBe(2);
        });

        test('should handle null/undefined input', () => {
            const result1 = validateSkills(null);
            const result2 = validateSkills(undefined);
            
            expect(result1.debate).toBe(0);
            expect(result2.force).toBe(0);
        });

        test('should default invalid values to 0', () => {
            const input = {
                debate: "invalid",
                force: null
            };
            
            const result = validateSkills(input);
            
            expect(result.debate).toBe(0);
            expect(result.force).toBe(0);
        });
    });

    describe('validateActorAbilities', () => {
        test('should validate ability values and modifiers', () => {
            const input = {
                might: { value: 15, mod: 2 },
                grace: { value: "12", mod: "1" }
            };
            
            const result = validateActorAbilities(input);
            
            expect(result.might.value).toBe(15);
            expect(result.might.mod).toBe(2);
            expect(result.grace.value).toBe(12);
            expect(result.grace.mod).toBe(1);
        });

        test('should preserve non-numeric properties', () => {
            const input = {
                might: { value: 15, mod: 2, label: "Might" }
            };
            
            const result = validateActorAbilities(input);
            
            expect((result.might as any).value).toBe(15);
            expect((result.might as any).mod).toBe(2);
            expect((result.might as any).label).toBe("Might");
        });

        test('should handle null/undefined input', () => {
            expect(validateActorAbilities(null)).toBeNull();
            expect(validateActorAbilities(undefined)).toBeUndefined();
        });

        test('should handle invalid ability data', () => {
            const input = {
                might: "not an object",
                grace: { value: "invalid", mod: "also invalid" }
            };
            
            const result = validateActorAbilities(input);
            
            expect(result.might).toBe("not an object");
            expect((result.grace as any).value).toBe(10); // default
            expect((result.grace as any).mod).toBe(0); // default
        });
    });

    describe('validateActorSkills', () => {
        test('should validate skill values', () => {
            const input = {
                debate: "3",
                force: 2,
                invalidSkill: "abc"
            };
            
            const result = validateActorSkills(input);
            
            expect(result.debate).toBe(3);
            expect(result.force).toBe(2);
            expect(result.invalidSkill).toBe(0);
        });

        test('should handle null/undefined input', () => {
            expect(validateActorSkills(null)).toBeNull();
            expect(validateActorSkills(undefined)).toBeUndefined();
        });

        test('should skip undefined values', () => {
            const input = {
                debate: 3,
                force: undefined,
                charm: 1
            };
            
            const result = validateActorSkills(input);
            
            expect(result.debate).toBe(3);
            expect(result.force).toBeUndefined();
            expect(result.charm).toBe(1);
        });
    });

    describe('validateHealthData', () => {
        test('should validate health values', () => {
            const input = {
                value: "15",
                max: "20",
                temp: 5
            };
            
            const result = validateHealthData(input);
            
            expect((result as any).value).toBe(15);
            expect((result as any).max).toBe(20);
            expect((result as any).temp).toBe(5);
        });

        test('should preserve other properties', () => {
            const input = {
                value: 15,
                max: 20,
                modifier: "custom"
            };
            
            const result = validateHealthData(input);
            
            expect((result as any).value).toBe(15);
            expect((result as any).max).toBe(20);
            expect((result as any).modifier).toBe("custom");
        });

        test('should handle null/undefined input', () => {
            expect(validateHealthData(null)).toBeNull();
            expect(validateHealthData(undefined)).toBeUndefined();
        });

        test('should use defaults for invalid values', () => {
            const input = {
                value: "invalid",
                max: null,
                temp: "bad"
            };
            
            const result = validateHealthData(input);
            
            expect((result as any).value).toBe(20); // default
            expect((result as any).max).toBe(20); // default  
            expect((result as any).temp).toBe(0); // default
        });
    });

    describe('validatePowerPointsData', () => {
        test('should validate power point values', () => {
            const input = {
                value: "8",
                max: "10"
            };
            
            const result = validatePowerPointsData(input);
            
            expect((result as any).value).toBe(8);
            expect((result as any).max).toBe(10);
        });

        test('should handle null/undefined input', () => {
            expect(validatePowerPointsData(null)).toBeNull();
            expect(validatePowerPointsData(undefined)).toBeUndefined();
        });

        test('should use defaults for invalid values', () => {
            const input = {
                value: "invalid",
                max: null
            };
            
            const result = validatePowerPointsData(input);
            
            expect((result as any).value).toBe(10); // default
            expect((result as any).max).toBe(10); // default
        });
    });

    describe('validateUsesData', () => {
        test('should validate uses values', () => {
            const input = {
                value: "2",
                max: "5"
            };
            
            const result = validateUsesData(input);
            
            expect((result as any).value).toBe(2);
            expect((result as any).max).toBe(5);
        });

        test('should handle null/undefined input', () => {
            expect(validateUsesData(null)).toBeNull();
            expect(validateUsesData(undefined)).toBeUndefined();
        });

        test('should use defaults for invalid values', () => {
            const input = {
                value: "invalid",
                max: null
            };
            
            const result = validateUsesData(input);
            
            expect((result as any).value).toBe(0); // default
            expect((result as any).max).toBe(0); // default
        });
    });

    describe('isValidDocumentId', () => {
        test('should validate correct FoundryVTT document IDs', () => {
            expect(isValidDocumentId("a1b2c3d4e5f67890")).toBe(true);
            expect(isValidDocumentId("ABCD1234EFGH5678")).toBe(true);
            expect(isValidDocumentId("0123456789abcdef")).toBe(true);
        });

        test('should reject invalid document IDs', () => {
            expect(isValidDocumentId("short")).toBe(false);
            expect(isValidDocumentId("")).toBe(false);
            expect(isValidDocumentId("a1b2c3d4e5f67890X")).toBe(false); // too long
            expect(isValidDocumentId("a1b2-c3d4-e5f67890")).toBe(false); // special chars
            expect(isValidDocumentId(null)).toBe(false);
            expect(isValidDocumentId(undefined)).toBe(false);
            expect(isValidDocumentId(123)).toBe(false);
        });
    });

    describe('sanitizeHtml', () => {
        test('should preserve safe HTML', () => {
            const safe = '<p>Safe content</p><strong>Bold</strong>';
            expect(sanitizeHtml(safe)).toBe(safe);
        });

        test('should remove script tags', () => {
            const dangerous = '<p>Safe</p><script>alert("bad")</script><p>More safe</p>';
            const expected = '<p>Safe</p><p>More safe</p>';
            expect(sanitizeHtml(dangerous)).toBe(expected);
        });

        test('should remove javascript: links', () => {
            const dangerous = '<a href="javascript:alert(\'bad\')">Link</a>';
            const expected = '<a href="">Link</a>';
            expect(sanitizeHtml(dangerous)).toBe(expected);
        });

        test('should remove event handlers', () => {
            const dangerous = '<div onclick="alert(\'bad\')">Content</div>';
            const expected = '<div>Content</div>';
            expect(sanitizeHtml(dangerous)).toBe(expected);
        });

        test('should handle non-string input', () => {
            expect(sanitizeHtml(null)).toBe('');
            expect(sanitizeHtml(undefined)).toBe('');
            expect(sanitizeHtml(123)).toBe('');
            expect(sanitizeHtml({})).toBe('');
        });

        test('should handle empty string', () => {
            expect(sanitizeHtml('')).toBe('');
        });
    });
}); 