/**
 * @fileoverview Unit Tests for Pack Comparison Logic
 * @description Tests for diffPacks pure function with comprehensive coverage
 * @version 2.0.0
 * @author Avant Development Team
 */

import { describe, test, expect } from '@jest/globals';
import { diffPacks, DiffResult } from '../../../../scripts/logic/compendium/diffPacks';

describe('diffPacks Pure Function', () => {
    describe('Input validation', () => {
        test('should throw error for non-array localDocs', () => {
            const remoteDocs = [{ name: 'Test' }];
            
            expect(() => diffPacks(null as any, remoteDocs)).toThrow('localDocs must be an array');
            expect(() => diffPacks(undefined as any, remoteDocs)).toThrow('localDocs must be an array');
            expect(() => diffPacks('not-array' as any, remoteDocs)).toThrow('localDocs must be an array');
            expect(() => diffPacks({} as any, remoteDocs)).toThrow('localDocs must be an array');
        });

        test('should throw error for non-array remoteDocs', () => {
            const localDocs = [{ name: 'Test' }];
            
            expect(() => diffPacks(localDocs, null as any)).toThrow('remoteDocs must be an array');
            expect(() => diffPacks(localDocs, undefined as any)).toThrow('remoteDocs must be an array');
            expect(() => diffPacks(localDocs, 'not-array' as any)).toThrow('remoteDocs must be an array');
            expect(() => diffPacks(localDocs, {} as any)).toThrow('remoteDocs must be an array');
        });
    });

    describe('Empty array handling', () => {
        test('should handle both arrays empty', () => {
            const result = diffPacks([], []);
            
            expect(result).toEqual({
                added: [],
                removed: [],
                changed: []
            });
        });

        test('should handle empty local array', () => {
            const remoteDocs = [
                { name: 'Item1', data: 'value1' },
                { name: 'Item2', data: 'value2' }
            ];
            
            const result = diffPacks([], remoteDocs);
            
            expect(result.added).toHaveLength(2);
            expect(result.removed).toHaveLength(0);
            expect(result.changed).toHaveLength(0);
            expect(result.added).toEqual(remoteDocs);
        });

        test('should handle empty remote array', () => {
            const localDocs = [
                { name: 'Item1', data: 'value1' },
                { name: 'Item2', data: 'value2' }
            ];
            
            const result = diffPacks(localDocs, []);
            
            expect(result.added).toHaveLength(0);
            expect(result.removed).toHaveLength(2);
            expect(result.changed).toHaveLength(0);
            expect(result.removed).toEqual(localDocs);
        });
    });

    describe('Added documents detection', () => {
        test('should detect documents added in remote', () => {
            const localDocs = [
                { name: 'Sword', damage: '1d8' }
            ];
            const remoteDocs = [
                { name: 'Sword', damage: '1d8' },
                { name: 'Bow', damage: '1d6' },
                { name: 'Shield', defense: 2 }
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            expect(result.added).toHaveLength(2);
            expect(result.added).toContainEqual({ name: 'Bow', damage: '1d6' });
            expect(result.added).toContainEqual({ name: 'Shield', defense: 2 });
        });

        test('should handle case-insensitive name matching for added detection', () => {
            const localDocs = [
                { name: 'sword', damage: '1d8' }
            ];
            const remoteDocs = [
                { name: 'SWORD', damage: '1d8' },
                { name: 'bow', damage: '1d6' }
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            expect(result.added).toHaveLength(1);
            expect(result.added[0].name).toBe('bow');
        });
    });

    describe('Removed documents detection', () => {
        test('should detect documents removed from remote', () => {
            const localDocs = [
                { name: 'Sword', damage: '1d8' },
                { name: 'Bow', damage: '1d6' },
                { name: 'Shield', defense: 2 }
            ];
            const remoteDocs = [
                { name: 'Sword', damage: '1d8' }
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            expect(result.removed).toHaveLength(2);
            expect(result.removed).toContainEqual({ name: 'Bow', damage: '1d6' });
            expect(result.removed).toContainEqual({ name: 'Shield', defense: 2 });
        });

        test('should handle case-insensitive name matching for removed detection', () => {
            const localDocs = [
                { name: 'SWORD', damage: '1d8' },
                { name: 'bow', damage: '1d6' }
            ];
            const remoteDocs = [
                { name: 'sword', damage: '1d8' }
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            expect(result.removed).toHaveLength(1);
            expect(result.removed[0].name).toBe('bow');
        });
    });

    describe('Changed documents detection', () => {
        test('should detect documents with same name but different content', () => {
            const localDocs = [
                { name: 'Sword', damage: '1d8', _id: 'local1' },
                { name: 'Bow', damage: '1d6', _id: 'local2' }
            ];
            const remoteDocs = [
                { name: 'Sword', damage: '1d10', _id: 'remote1' },
                { name: 'Bow', damage: '1d6', _id: 'remote2' }
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            expect(result.changed).toHaveLength(1);
            expect(result.changed[0]).toEqual({
                local: { name: 'Sword', damage: '1d8', _id: 'local1' },
                remote: { name: 'Sword', damage: '1d10', _id: 'remote1' }
            });
            expect(result.added).toHaveLength(0);
            expect(result.removed).toHaveLength(0);
        });

        test('should ignore volatile fields when detecting changes', () => {
            const localDocs = [
                { name: 'Sword', damage: '1d8', _id: 'local1', _stats: 'local' }
            ];
            const remoteDocs = [
                { name: 'Sword', damage: '1d8', _id: 'remote1', _stats: 'remote' }
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            // Should not detect as changed since only volatile fields differ
            expect(result.changed).toHaveLength(0);
            expect(result.added).toHaveLength(0);
            expect(result.removed).toHaveLength(0);
        });

        test('should handle case-insensitive name matching for change detection', () => {
            const localDocs = [
                { name: 'SWORD', damage: '1d8' }
            ];
            const remoteDocs = [
                { name: 'sword', damage: '1d10' }
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            expect(result.changed).toHaveLength(1);
            expect(result.changed[0].local.name).toBe('SWORD');
            expect(result.changed[0].remote.name).toBe('sword');
        });
    });

    describe('Complex scenarios', () => {
        test('should handle mixed added, removed, and changed documents', () => {
            const localDocs = [
                { name: 'Sword', damage: '1d8' },      // Will be changed
                { name: 'Shield', defense: 2 },       // Will be removed
                { name: 'Potion', healing: 10 }       // Will stay same
            ];
            const remoteDocs = [
                { name: 'Sword', damage: '1d10' },     // Changed
                { name: 'Bow', damage: '1d6' },        // Added
                { name: 'Potion', healing: 10 }        // Same
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            expect(result.added).toHaveLength(1);
            expect(result.added[0].name).toBe('Bow');
            
            expect(result.removed).toHaveLength(1);
            expect(result.removed[0].name).toBe('Shield');
            
            expect(result.changed).toHaveLength(1);
            expect(result.changed[0].local.name).toBe('Sword');
            expect(result.changed[0].remote.name).toBe('Sword');
        });

        test('should handle documents with complex nested data', () => {
            const localDocs = [
                {
                    name: 'Longsword',
                    system: {
                        damage: '1d8',
                        properties: ['versatile'],
                        weight: 3
                    },
                    _id: 'local-id'
                }
            ];
            const remoteDocs = [
                {
                    name: 'Longsword',
                    system: {
                        damage: '1d8',
                        properties: ['versatile', 'finesse'],
                        weight: 3
                    },
                    _id: 'remote-id'
                }
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            expect(result.changed).toHaveLength(1);
            expect(result.changed[0].local.system.properties).toEqual(['versatile']);
            expect(result.changed[0].remote.system.properties).toEqual(['versatile', 'finesse']);
        });
    });

    describe('Edge cases and invalid data', () => {
        test('should skip documents without name field', () => {
            const localDocs = [
                { name: 'Valid', data: 'test' },
                { data: 'no-name' },
                null,
                undefined
            ];
            const remoteDocs = [
                { name: 'Valid', data: 'test' },
                { value: 'also-no-name' }
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            expect(result.added).toHaveLength(0);
            expect(result.removed).toHaveLength(0);
            expect(result.changed).toHaveLength(0);
        });

        test('should handle documents with empty or whitespace names', () => {
            const localDocs = [
                { name: '', data: 'empty' },
                { name: '   ', data: 'whitespace' },
                { name: 'Valid', data: 'test' }
            ];
            const remoteDocs = [
                { name: 'Valid', data: 'test' }
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            // Empty/whitespace names should be ignored
            expect(result.added).toHaveLength(0);
            expect(result.removed).toHaveLength(0);
            expect(result.changed).toHaveLength(0);
        });

        test('should handle documents with non-string names', () => {
            const localDocs = [
                { name: 123, data: 'number-name' },
                { name: true, data: 'boolean-name' },
                { name: 'Valid', data: 'test' }
            ];
            const remoteDocs = [
                { name: '123', data: 'string-number' },
                { name: 'Valid', data: 'test' }
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            // Non-string names converted to strings and matched
            expect(result.added).toHaveLength(0);
            expect(result.removed).toHaveLength(1);
            expect(result.removed[0].name).toBe(true);
            expect(result.changed).toHaveLength(1);
            expect(result.changed[0].local.name).toBe(123);
            expect(result.changed[0].remote.name).toBe('123');
        });

        test('should handle duplicate names in same array', () => {
            const localDocs = [
                { name: 'Duplicate', version: 1 },
                { name: 'Duplicate', version: 2 }
            ];
            const remoteDocs = [
                { name: 'Duplicate', version: 3 }
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            // Last one wins for duplicates in local, compare with remote
            expect(result.added).toHaveLength(0);
            expect(result.removed).toHaveLength(0);
            expect(result.changed).toHaveLength(1);
            expect(result.changed[0].local.version).toBe(2); // Last duplicate
            expect(result.changed[0].remote.version).toBe(3);
        });

        test('should handle arrays with mixed valid and invalid entries', () => {
            const localDocs = [
                { name: 'Valid1', data: 'test1' },
                'not-an-object',
                { name: 'Valid2', data: 'test2' },
                { noName: 'invalid' },
                { name: 'Valid3', data: 'test3' }
            ];
            const remoteDocs = [
                { name: 'Valid1', data: 'test1' },
                { name: 'Valid2', data: 'changed' },
                42
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            expect(result.added).toHaveLength(0);
            expect(result.removed).toHaveLength(1);
            expect(result.removed[0].name).toBe('Valid3');
            expect(result.changed).toHaveLength(1);
            expect(result.changed[0].local.name).toBe('Valid2');
        });

        test('should handle objects with circular references', () => {
            const circularLocal: any = { name: 'Circular', data: 'local' };
            circularLocal.self = circularLocal;
            
            const circularRemote: any = { name: 'Circular', data: 'remote' };
            circularRemote.self = circularRemote;
            
            const localDocs = [circularLocal];
            const remoteDocs = [circularRemote];
            
            // Should not throw error and should detect as changed
            const result = diffPacks(localDocs, remoteDocs);
            
            expect(result.changed).toHaveLength(1);
            expect(result.changed[0].local.name).toBe('Circular');
            expect(result.changed[0].remote.name).toBe('Circular');
        });
    });

    describe('Name normalization', () => {
        test('should trim whitespace from names', () => {
            const localDocs = [
                { name: '  Sword  ', damage: '1d8' }
            ];
            const remoteDocs = [
                { name: 'Sword', damage: '1d10' }
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            expect(result.changed).toHaveLength(1);
            expect(result.changed[0].local.name).toBe('  Sword  ');
            expect(result.changed[0].remote.name).toBe('Sword');
        });

        test('should handle mixed case properly', () => {
            const localDocs = [
                { name: 'SwOrD', damage: '1d8' },
                { name: 'SHIELD', defense: 2 }
            ];
            const remoteDocs = [
                { name: 'sword', damage: '1d8' },
                { name: 'bow', damage: '1d6' }
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            expect(result.added).toHaveLength(1);
            expect(result.added[0].name).toBe('bow');
            expect(result.removed).toHaveLength(1);
            expect(result.removed[0].name).toBe('SHIELD');
            expect(result.changed).toHaveLength(1); // Case differences are detected as changes
            expect(result.changed[0].local.name).toBe('SwOrD');
            expect(result.changed[0].remote.name).toBe('sword');
        });

        test('should preserve original case in results', () => {
            const localDocs = [
                { name: 'CamelCase', data: 'local' }
            ];
            const remoteDocs = [
                { name: 'camelcase', data: 'remote' }
            ];
            
            const result = diffPacks(localDocs, remoteDocs);
            
            expect(result.changed).toHaveLength(1);
            expect(result.changed[0].local.name).toBe('CamelCase');
            expect(result.changed[0].remote.name).toBe('camelcase');
        });
    });
}); 