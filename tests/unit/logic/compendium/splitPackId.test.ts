/**
 * @fileoverview Unit Tests for Pack ID Parsing Logic
 * @description Tests for splitPackId pure function with comprehensive coverage
 * @version 2.0.0
 * @author Avant Development Team
 */

import { describe, test, expect } from '@jest/globals';
import { splitPackId } from '../../../../scripts/logic/compendium/splitPackId';

describe('splitPackId Pure Function', () => {
    describe('Valid pack ID formats', () => {
        test('should split standard system pack ID', () => {
            const result = splitPackId('avant.weapons');
            expect(result).toEqual({
                package: 'avant',
                name: 'weapons'
            });
        });

        test('should split module pack ID with hyphens', () => {
            const result = splitPackId('my-module.spell-list');
            expect(result).toEqual({
                package: 'my-module',
                name: 'spell-list'
            });
        });

        test('should split pack ID with numbers', () => {
            const result = splitPackId('system123.pack456');
            expect(result).toEqual({
                package: 'system123',
                name: 'pack456'
            });
        });

        test('should handle pack ID with underscores', () => {
            const result = splitPackId('my_system.my_pack');
            expect(result).toEqual({
                package: 'my_system',
                name: 'my_pack'
            });
        });

        test('should trim whitespace from parts', () => {
            const result = splitPackId(' avant . weapons ');
            expect(result).toEqual({
                package: 'avant',
                name: 'weapons'
            });
        });

        test('should handle single character parts', () => {
            const result = splitPackId('a.b');
            expect(result).toEqual({
                package: 'a',
                name: 'b'
            });
        });

        test('should handle very long pack names', () => {
            const longName = 'very-long-system-name-with-many-parts';
            const longPack = 'very-long-pack-name-with-many-descriptive-words';
            const result = splitPackId(`${longName}.${longPack}`);
            expect(result).toEqual({
                package: longName,
                name: longPack
            });
        });
    });

    describe('Invalid pack ID formats', () => {
        test('should throw error for non-string input', () => {
            expect(() => splitPackId(null as any)).toThrow(
                "Invalid pack ID format: must be 'package.name', got object"
            );
            expect(() => splitPackId(undefined as any)).toThrow(
                "Invalid pack ID format: must be 'package.name', got undefined"
            );
            expect(() => splitPackId(123 as any)).toThrow(
                "Invalid pack ID format: must be 'package.name', got number"
            );
            expect(() => splitPackId([] as any)).toThrow(
                "Invalid pack ID format: must be 'package.name', got object"
            );
            expect(() => splitPackId({} as any)).toThrow(
                "Invalid pack ID format: must be 'package.name', got object"
            );
        });

        test('should throw error for empty string', () => {
            expect(() => splitPackId('')).toThrow(
                "Invalid pack ID format: must be 'package.name', got empty string"
            );
            expect(() => splitPackId('   ')).toThrow(
                "Invalid pack ID format: must be 'package.name', got empty string"
            );
        });

        test('should throw error for missing dot separator', () => {
            expect(() => splitPackId('avantweapons')).toThrow(
                "Invalid pack ID format: must be 'package.name', got 'avantweapons'"
            );
            expect(() => splitPackId('avant_weapons')).toThrow(
                "Invalid pack ID format: must be 'package.name', got 'avant_weapons'"
            );
        });

        test('should throw error for too many dot separators', () => {
            expect(() => splitPackId('avant.weapons.extra')).toThrow(
                "Invalid pack ID format: must be 'package.name', got 'avant.weapons.extra'"
            );
            expect(() => splitPackId('a.b.c.d')).toThrow(
                "Invalid pack ID format: must be 'package.name', got 'a.b.c.d'"
            );
        });

        test('should throw error for empty package part', () => {
            expect(() => splitPackId('.weapons')).toThrow(
                "Invalid pack ID format: package and name must be non-empty, got '.weapons'"
            );
            expect(() => splitPackId('  .weapons')).toThrow(
                "Invalid pack ID format: package and name must be non-empty, got '  .weapons'"
            );
        });

        test('should throw error for empty name part', () => {
            expect(() => splitPackId('avant.')).toThrow(
                "Invalid pack ID format: package and name must be non-empty, got 'avant.'"
            );
            expect(() => splitPackId('avant.  ')).toThrow(
                "Invalid pack ID format: package and name must be non-empty, got 'avant.  '"
            );
        });

        test('should throw error for both parts empty', () => {
            expect(() => splitPackId('.')).toThrow(
                "Invalid pack ID format: package and name must be non-empty, got '.'"
            );
            expect(() => splitPackId(' . ')).toThrow(
                "Invalid pack ID format: package and name must be non-empty, got ' . '"
            );
        });

        test('should throw error for only dots', () => {
            expect(() => splitPackId('..')).toThrow(
                "Invalid pack ID format: must be 'package.name', got '..'"
            );
            expect(() => splitPackId('...')).toThrow(
                "Invalid pack ID format: must be 'package.name', got '...'"
            );
        });
    });

    describe('Edge cases', () => {
        test('should handle pack ID with dot in package name', () => {
            // This should fail because it has too many dots
            expect(() => splitPackId('system.v2.weapons')).toThrow(
                "Invalid pack ID format: must be 'package.name', got 'system.v2.weapons'"
            );
        });

        test('should handle pack ID with special characters', () => {
            const result = splitPackId('system-123.pack_456');
            expect(result).toEqual({
                package: 'system-123',
                name: 'pack_456'
            });
        });

        test('should handle case sensitivity properly', () => {
            const result = splitPackId('AVANT.WEAPONS');
            expect(result).toEqual({
                package: 'AVANT',
                name: 'WEAPONS'
            });
        });

        test('should handle mixed case', () => {
            const result = splitPackId('AvAnT.WeApOnS');
            expect(result).toEqual({
                package: 'AvAnT',
                name: 'WeApOnS'
            });
        });

        test('should preserve original casing in results', () => {
            const result = splitPackId('MySystem.MyPack');
            expect(result.package).toBe('MySystem');
            expect(result.name).toBe('MyPack');
        });
    });
}); 