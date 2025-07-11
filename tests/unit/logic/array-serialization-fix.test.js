/**
 * Array Serialization Fix Test
 * Tests that trait arrays are properly serialized and processed through form submission
 */

import { jest } from '@jest/globals';
import { extractItemFormData } from '../../../scripts/logic/item-sheet-utils.ts';

describe('Array Serialization Fix (2B-01)', () => {
    test('should properly handle array fields with [] suffix', () => {
        // Simulate form data with array field naming
        const formData = {
            'name': 'Test Item',
            'system.description': 'A test item',
            'system.traits[]': ['fire', 'ice', 'lightning']
        };

        const result = extractItemFormData(formData);

        expect(result).toMatchObject({
            name: 'Test Item',
            system: {
                description: 'A test item',
                traits: ['fire', 'ice', 'lightning']
            }
        });

        // Verify traits is a proper array
        expect(Array.isArray(result.system.traits)).toBe(true);
        expect(result.system.traits).toHaveLength(3);
        expect(result.system.traits).toEqual(['fire', 'ice', 'lightning']);
    });

    test('should handle single trait in array field', () => {
        // Single trait should still be processed as array
        const formData = {
            'name': 'Test Item',
            'system.traits[]': ['fire']
        };

        const result = extractItemFormData(formData);

        expect(result.system.traits).toEqual(['fire']);
        expect(Array.isArray(result.system.traits)).toBe(true);
    });

    test('should handle multiple hidden inputs with same array name', () => {
        // This simulates what the template generates:
        // <input type="hidden" name="system.traits[]" value="fire">
        // <input type="hidden" name="system.traits[]" value="ice">
        // <input type="hidden" name="system.traits[]" value="lightning">

        // FormData would collect these as a single key with array of values
        const formData = {
            'name': 'Test Item',
            'system.traits[]': ['fire', 'ice', 'lightning']
        };

        const result = extractItemFormData(formData);

        expect(result.system.traits).toEqual(['fire', 'ice', 'lightning']);
        expect(Array.isArray(result.system.traits)).toBe(true);
    });

    test('should handle empty array field', () => {
        // When no traits are present, the array field should be empty
        const formData = {
            'name': 'Test Item',
            'system.description': 'A test item'
            // No traits[] field
        };

        const result = extractItemFormData(formData);

        expect(result.system.traits).toBeUndefined();
        expect(result.system.description).toBe('A test item');
    });

    test('should handle mixed array and regular fields', () => {
        const formData = {
            'name': 'Test Item',
            'system.description': 'A test item',
            'system.traits[]': ['fire', 'ice'],
            'system.weight': '5.5',
            'system.equipped': 'true'
        };

        const result = extractItemFormData(formData);

        expect(result).toMatchObject({
            name: 'Test Item',
            system: {
                description: 'A test item',
                traits: ['fire', 'ice'],
                weight: 5.5,
                equipped: true
            }
        });

        // Verify all types are correct
        expect(Array.isArray(result.system.traits)).toBe(true);
        expect(typeof result.system.weight).toBe('number');
        expect(typeof result.system.equipped).toBe('boolean');
    });

    test('should demonstrate the bug scenario that was fixed', () => {
        // This test demonstrates what would happen with the OLD broken approach
        // where traits were serialized as comma-separated strings

        // BROKEN APPROACH (what used to happen):
        // Template would generate: <input type="hidden" name="system.traits" value="fire,ice,lightning">
        // Result would be: { system: { traits: "fire,ice,lightning" } } // STRING!

        const brokenFormData = {
            'name': 'Test Item',
            'system.traits': 'fire,ice,lightning'  // This is a STRING, not an array!
        };

        const brokenResult = extractItemFormData(brokenFormData);

        // The broken approach would give us a string instead of an array
        expect(brokenResult.system.traits).toBe('fire,ice,lightning');
        expect(Array.isArray(brokenResult.system.traits)).toBe(false);
        expect(typeof brokenResult.system.traits).toBe('string');

        // FIXED APPROACH (what we have now):
        // Template generates: multiple <input type="hidden" name="system.traits[]" value="fire"> etc.
        // Result should be: { system: { traits: ["fire", "ice", "lightning"] } } // ARRAY!

        const fixedFormData = {
            'name': 'Test Item',
            'system.traits[]': ['fire', 'ice', 'lightning']  // This is an ARRAY!
        };

        const fixedResult = extractItemFormData(fixedFormData);

        // The fixed approach gives us a proper array
        expect(fixedResult.system.traits).toEqual(['fire', 'ice', 'lightning']);
        expect(Array.isArray(fixedResult.system.traits)).toBe(true);
        expect(typeof fixedResult.system.traits).toBe('object');
    });

    test('should handle FoundryVTT FormData format', () => {
        // Test with FormData-like object structure
        // IMPORTANT: We can't use Map for multiple same keys, so simulate FormData.entries()
        const formDataEntries = [
            ['name', 'Test Item'],
            ['system.description', 'A test item'],
            ['system.traits[]', 'fire'],
            ['system.traits[]', 'ice'],
            ['system.traits[]', 'lightning']
        ];

        // Convert to object format that extractItemFormData expects
        // This simulates what FoundryVTT does when converting FormData to object
        const formObj = {};
        for (const [key, value] of formDataEntries) {
            if (formObj.hasOwnProperty(key)) {
                // Key already exists - convert to array if needed
                if (!Array.isArray(formObj[key])) {
                    formObj[key] = [formObj[key]];
                }
                formObj[key].push(value);
            } else {
                formObj[key] = value;
            }
        }

        // This should result in:
        // {
        //   'name': 'Test Item',
        //   'system.description': 'A test item',
        //   'system.traits[]': ['fire', 'ice', 'lightning']
        // }

        expect(formObj['system.traits[]']).toEqual(['fire', 'ice', 'lightning']);

        const result = extractItemFormData(formObj);

        expect(result.system.traits).toEqual(['fire', 'ice', 'lightning']);
        expect(Array.isArray(result.system.traits)).toBe(true);
    });
}); 