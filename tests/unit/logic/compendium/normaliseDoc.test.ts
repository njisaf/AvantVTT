/**
 * @fileoverview Unit Tests for Document Normalisation Logic
 * @description Tests for normaliseDoc pure function with comprehensive coverage
 * @version 2.0.0
 * @author Avant Development Team
 */

import { describe, test, expect } from '@jest/globals';
import { normaliseDoc } from '../../../../scripts/logic/compendium/normaliseDoc';

describe('normaliseDoc Pure Function', () => {
    describe('Primitive value handling', () => {
        test('should return null and undefined unchanged', () => {
            expect(normaliseDoc(null)).toBe(null);
            expect(normaliseDoc(undefined)).toBe(undefined);
        });

        test('should return primitive types unchanged', () => {
            expect(normaliseDoc('hello')).toBe('hello');
            expect(normaliseDoc(42)).toBe(42);
            expect(normaliseDoc(true)).toBe(true);
            expect(normaliseDoc(false)).toBe(false);
            expect(normaliseDoc(0)).toBe(0);
            expect(normaliseDoc('')).toBe('');
        });
    });

    describe('Array handling', () => {
        test('should normalise array elements recursively', () => {
            const input = [
                { name: 'Item1', _id: 'remove' },
                { name: 'Item2', _stats: 'remove' },
                'primitive'
            ];
            
            const result = normaliseDoc(input);
            
            expect(result).toEqual([
                { name: 'Item1' },
                { name: 'Item2' },
                'primitive'
            ]);
        });

        test('should handle nested arrays', () => {
            const input = [
                [{ name: 'Nested', _id: 'remove' }],
                ['primitive']
            ];
            
            const result = normaliseDoc(input);
            
            expect(result).toEqual([
                [{ name: 'Nested' }],
                ['primitive']
            ]);
        });

        test('should handle empty arrays', () => {
            expect(normaliseDoc([])).toEqual([]);
        });

        test('should handle arrays with null/undefined elements', () => {
            const input = [null, undefined, { name: 'Valid' }];
            const result = normaliseDoc(input);
            expect(result).toEqual([null, undefined, { name: 'Valid' }]);
        });
    });

    describe('Volatile field removal', () => {
        test('should remove _id field', () => {
            const input = {
                name: 'Sword',
                _id: 'abc123def456',
                damage: '1d8'
            };
            
            const result = normaliseDoc(input);
            
            expect(result).toEqual({
                damage: '1d8',
                name: 'Sword'
            });
            expect(result).not.toHaveProperty('_id');
        });

        test('should remove _stats field', () => {
            const input = {
                name: 'Sword',
                _stats: { coreVersion: '12.331' },
                damage: '1d8'
            };
            
            const result = normaliseDoc(input);
            
            expect(result).toEqual({
                damage: '1d8',
                name: 'Sword'
            });
            expect(result).not.toHaveProperty('_stats');
        });

        test('should remove folder field', () => {
            const input = {
                name: 'Sword',
                folder: 'weapons-folder',
                damage: '1d8'
            };
            
            const result = normaliseDoc(input);
            
            expect(result).toEqual({
                damage: '1d8',
                name: 'Sword'
            });
            expect(result).not.toHaveProperty('folder');
        });

        test('should remove sort field', () => {
            const input = {
                name: 'Sword',
                sort: 100000,
                damage: '1d8'
            };
            
            const result = normaliseDoc(input);
            
            expect(result).toEqual({
                damage: '1d8',
                name: 'Sword'
            });
            expect(result).not.toHaveProperty('sort');
        });

        test('should remove all volatile fields at once', () => {
            const input = {
                name: 'Sword',
                _id: 'abc123',
                _stats: { version: '1.0' },
                folder: 'weapons',
                sort: 100000,
                damage: '1d8',
                type: 'weapon'
            };
            
            const result = normaliseDoc(input);
            
            expect(result).toEqual({
                damage: '1d8',
                name: 'Sword',
                type: 'weapon'
            });
            expect(Object.keys(result)).toEqual(['damage', 'name', 'type']);
        });
    });

    describe('Key sorting', () => {
        test('should sort keys lexicographically', () => {
            const input = {
                zebra: 'last',
                alpha: 'first',
                beta: 'middle'
            };
            
            const result = normaliseDoc(input);
            
            expect(Object.keys(result)).toEqual(['alpha', 'beta', 'zebra']);
            expect(result).toEqual({
                alpha: 'first',
                beta: 'middle',
                zebra: 'last'
            });
        });

        test('should handle numeric keys as strings', () => {
            const input = {
                '10': 'ten',
                '2': 'two',
                '1': 'one'
            };
            
            const result = normaliseDoc(input);
            
            // Lexicographic order: '1', '2', '10'
            expect(Object.keys(result)).toEqual(['1', '2', '10']);
        });

        test('should handle mixed key types', () => {
            const input = {
                'z-last': 'value',
                'a-first': 'value',
                'b_middle': 'value'
            };
            
            const result = normaliseDoc(input);
            
            expect(Object.keys(result)).toEqual(['a-first', 'b_middle', 'z-last']);
        });
    });

    describe('Nested object handling', () => {
        test('should normalise nested objects recursively', () => {
            const input = {
                name: 'Complex Item',
                _id: 'remove-top',
                system: {
                    damage: '1d8',
                    _stats: 'remove-nested',
                    properties: {
                        weight: 3,
                        folder: 'remove-deep'
                    }
                }
            };
            
            const result = normaliseDoc(input);
            
            expect(result).toEqual({
                name: 'Complex Item',
                system: {
                    damage: '1d8',
                    properties: {
                        weight: 3
                    }
                }
            });
        });

        test('should handle deeply nested structures', () => {
            const input = {
                level1: {
                    _id: 'remove',
                    level2: {
                        sort: 123,
                        level3: {
                            _stats: 'remove',
                            value: 'keep'
                        }
                    }
                }
            };
            
            const result = normaliseDoc(input);
            
            expect(result).toEqual({
                level1: {
                    level2: {
                        level3: {
                            value: 'keep'
                        }
                    }
                }
            });
        });

        test('should handle mixed arrays and objects', () => {
            const input = {
                items: [
                    { name: 'Item1', _id: 'remove1' },
                    { name: 'Item2', _id: 'remove2' }
                ],
                _stats: 'remove-root'
            };
            
            const result = normaliseDoc(input);
            
            expect(result).toEqual({
                items: [
                    { name: 'Item1' },
                    { name: 'Item2' }
                ]
            });
        });
    });

    describe('Complex FoundryVTT document examples', () => {
        test('should normalise typical weapon document', () => {
            const weapon = {
                name: 'Longsword',
                _id: 'abcd1234efgh5678',
                _stats: {
                    systemId: 'avant',
                    systemVersion: '0.4.2',
                    coreVersion: '13.331',
                    createdTime: 1672531200000,
                    modifiedTime: 1672531200000,
                    lastModifiedBy: 'user123'
                },
                folder: 'weapons-folder-id',
                sort: 100000,
                type: 'weapon',
                system: {
                    damage: '1d8',
                    damageType: 'slashing',
                    properties: ['versatile'],
                    weight: 3,
                    cost: 15
                },
                img: 'icons/weapons/swords/sword-longsword-steel.webp'
            };
            
            const result = normaliseDoc(weapon);
            
            expect(result).toEqual({
                img: 'icons/weapons/swords/sword-longsword-steel.webp',
                name: 'Longsword',
                system: {
                    cost: 15,
                    damage: '1d8',
                    damageType: 'slashing',
                    properties: ['versatile'],
                    weight: 3
                },
                type: 'weapon'
            });
        });

        test('should normalise typical actor document', () => {
            const actor = {
                name: 'Hero',
                _id: 'actor123456789012',
                _stats: { version: '1.0' },
                folder: null,
                sort: 0,
                type: 'character',
                system: {
                    abilities: {
                        might: { value: 15, mod: 2 },
                        grace: { value: 14, mod: 2 }
                    },
                    health: { value: 25, max: 25 }
                }
            };
            
            const result = normaliseDoc(actor);
            
            expect(result).toEqual({
                name: 'Hero',
                system: {
                    abilities: {
                        grace: { mod: 2, value: 14 },
                        might: { mod: 2, value: 15 }
                    },
                    health: { max: 25, value: 25 }
                },
                type: 'character'
            });
        });
    });

    describe('Edge cases', () => {
        test('should handle empty objects', () => {
            expect(normaliseDoc({})).toEqual({});
        });

        test('should handle objects with only volatile fields', () => {
            const input = {
                _id: 'only-volatile',
                _stats: 'also-volatile',
                folder: 'volatile-too',
                sort: 123
            };
            
            const result = normaliseDoc(input);
            
            expect(result).toEqual({});
        });

        test('should handle circular references gracefully', () => {
            const input: any = { name: 'Test' };
            input.self = input; // Create circular reference
            
            // This should not throw or cause infinite recursion
            // Note: JSON.stringify later will handle the circular reference
            const result = normaliseDoc(input);
            expect(result.name).toBe('Test');
            expect(result.self).toBeDefined();
        });

        test('should preserve falsy values that are not null/undefined', () => {
            const input = {
                name: 'Test',
                enabled: false,
                count: 0,
                description: '',
                _id: 'remove'
            };
            
            const result = normaliseDoc(input);
            
            expect(result).toEqual({
                count: 0,
                description: '',
                enabled: false,
                name: 'Test'
            });
        });

        test('should handle objects with prototype properties', () => {
            const BaseClass = function(this: any) {
                this.name = 'Test';
                this._id = 'remove';
            };
            BaseClass.prototype.prototypeMethod = function() {};
            
            const input = new (BaseClass as any)();
            input.customProp = 'value';
            
            const result = normaliseDoc(input);
            
            // Should only include own enumerable properties
            expect(result).toEqual({
                customProp: 'value',
                name: 'Test'
            });
            expect(result).not.toHaveProperty('prototypeMethod');
        });
    });
}); 