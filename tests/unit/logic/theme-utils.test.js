/**
 * @fileoverview Tests for Theme Utility Functions - Pure Logic
 * @version 1.0.0
 * @author Avant VTT Team
 * @description Unit tests for extracted theme utility functions with no FoundryVTT dependencies
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { 
    generateThemeStyleString,
    clearThemeVariables,
    applyThemeVariables,
    validateThemeStructure,
    getNestedProperty
} from '../../../scripts/logic/theme-utils.js';

describe('Theme Utils - Pure Logic Functions', () => {

    describe('generateThemeStyleString', () => {
        test('should generate CSS style string from theme object', () => {
            const theme = {
                name: 'Test Theme',
                colors: {
                    backgrounds: {
                        primary: '#1C1C1C'
                    },
                    accents: {
                        primary: '#00E0DC'
                    }
                },
                typography: {
                    fontDisplay: 'Orbitron, monospace'
                }
            };

            const styleString = generateThemeStyleString(theme);
            
            // Should contain CSS variables
            expect(styleString).toContain('--theme-bg-primary: #1C1C1C');
            expect(styleString).toContain('--theme-accent-primary: #00E0DC');
            expect(styleString).toContain('--theme-font-display: "Orbitron, monospace"');
        });

        test('should handle empty or invalid theme objects', () => {
            expect(generateThemeStyleString({})).toBe('');
            expect(generateThemeStyleString(null)).toBe('');
            expect(generateThemeStyleString(undefined)).toBe('');
        });
    });

    describe('clearThemeVariables', () => {
        test('should return array of CSS variables to clear', () => {
            const variables = clearThemeVariables();
            
            // Should be an array
            expect(Array.isArray(variables)).toBe(true);
            
            // Should contain expected theme variables (using actual config names)
            expect(variables).toContain('--theme-bg-primary');
            expect(variables).toContain('--theme-accent-primary');
            expect(variables).toContain('--theme-font-display');
            
            // Should only contain CSS custom property names
            variables.forEach(variable => {
                expect(variable).toMatch(/^--/);
            });
        });
    });

    describe('applyThemeVariables', () => {
        test('should generate CSS variable assignments from theme', () => {
            const theme = {
                name: 'Dark Theme',
                author: 'Test Author',
                colors: {
                    backgrounds: {
                        primary: '#1C1C1C'
                    },
                    accents: {
                        primary: '#00E0DC'
                    }
                },
                typography: {
                    fontDisplay: 'Orbitron, monospace'
                }
            };

            const variableMap = applyThemeVariables(theme);
            
            // Should return an object with CSS variable assignments
            expect(typeof variableMap).toBe('object');
            expect(variableMap['--theme-bg-primary']).toBe('#1C1C1C');
            expect(variableMap['--theme-accent-primary']).toBe('#00E0DC');
            expect(variableMap['--theme-font-display']).toBe('"Orbitron, monospace"');
            
            // Metadata should be quoted
            expect(variableMap['--theme-name']).toBe('"Dark Theme"');
            expect(variableMap['--theme-author']).toBe('"Test Author"');
        });

        test('should handle missing or undefined values gracefully', () => {
            const incompleteTheme = {
                name: 'Incomplete Theme',
                colors: {
                    backgrounds: {
                        primary: '#1C1C1C'
                    }
                    // accents missing
                }
                // typography section missing
            };

            const variableMap = applyThemeVariables(incompleteTheme);
            
            // Should include what's available
            expect(variableMap['--theme-bg-primary']).toBe('#1C1C1C');
            expect(variableMap['--theme-name']).toBe('"Incomplete Theme"');
            
            // Should not include undefined values
            expect(variableMap['--theme-accent-primary']).toBeUndefined();
            expect(variableMap['--theme-font-display']).toBeUndefined();
        });
    });

    describe('validateThemeStructure', () => {
        test('should validate complete theme objects', async () => {
            const validTheme = {
                name: 'Valid Theme',
                version: '1.0.0',
                author: 'Test Author',
                description: 'A test theme',
                colors: {
                    backgrounds: {
                        primary: '#1C1C1C'
                    },
                    accents: {
                        primary: '#00E0DC'
                    }
                },
                typography: {
                    fontDisplay: 'Orbitron, monospace'
                }
            };

            const result = await validateThemeStructure(validTheme);
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        test('should identify missing required fields', async () => {
            const invalidTheme = {
                // Missing name, version, author
                colors: {
                    backgrounds: {
                        primary: '#1C1C1C'
                    }
                }
            };

            const result = await validateThemeStructure(invalidTheme);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('name'))).toBe(true);
            expect(result.errors.some(error => error.includes('version'))).toBe(true);
            expect(result.errors.some(error => error.includes('author'))).toBe(true);
        });

        test('should validate color format in theme', async () => {
            const themeWithInvalidColors = {
                name: 'Bad Colors Theme',
                version: '1.0.0',
                author: 'Test Author',
                colors: {
                    backgrounds: {
                        primary: 'not-a-color'
                    },
                    accents: {
                        primary: '#GGG'
                    }
                }
            };

            const result = await validateThemeStructure(themeWithInvalidColors);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('backgrounds.primary'))).toBe(true);
            expect(result.errors.some(error => error.includes('accents.primary'))).toBe(true);
        });
    });

    describe('getNestedProperty', () => {
        test('should retrieve nested object properties', () => {
            const obj = {
                colors: {
                    primary: '#00E0DC',
                    secondary: '#4CE2E1',
                    nested: {
                        deep: {
                            value: 'found'
                        }
                    }
                },
                fonts: {
                    display: 'Orbitron'
                }
            };

            expect(getNestedProperty(obj, 'colors.primary')).toBe('#00E0DC');
            expect(getNestedProperty(obj, 'colors.secondary')).toBe('#4CE2E1');
            expect(getNestedProperty(obj, 'fonts.display')).toBe('Orbitron');
            expect(getNestedProperty(obj, 'colors.nested.deep.value')).toBe('found');
        });

        test('should handle non-existent paths gracefully', () => {
            const obj = {
                colors: {
                    primary: '#00E0DC'
                }
            };

            expect(getNestedProperty(obj, 'colors.nonexistent')).toBeUndefined();
            expect(getNestedProperty(obj, 'fonts.display')).toBeUndefined();
            expect(getNestedProperty(obj, 'deeply.nested.path')).toBeUndefined();
            expect(getNestedProperty(null, 'any.path')).toBeUndefined();
            expect(getNestedProperty(undefined, 'any.path')).toBeUndefined();
        });

        test('should handle edge cases for path formats', () => {
            const obj = {
                'key.with.dots': 'value1',
                normal: {
                    nested: 'value2'
                }
            };

            // Standard nested path
            expect(getNestedProperty(obj, 'normal.nested')).toBe('value2');
            
            // Empty path should return the object itself
            expect(getNestedProperty(obj, '')).toBe(obj);
            
            // Top-level access
            expect(getNestedProperty(obj, 'normal')).toEqual({ nested: 'value2' });
        });
    });

    describe('Theme Utils Integration', () => {
        test('should work together for complete theme processing', async () => {
            const theme = {
                name: 'Integration Test Theme',
                version: '1.0.0',
                author: 'Test Suite',
                colors: {
                    backgrounds: {
                        primary: '#1C1C1C'
                    },
                    accents: {
                        primary: '#00E0DC'
                    }
                },
                typography: {
                    fontDisplay: 'Orbitron, monospace'
                }
            };

            // Validate theme
            const validation = await validateThemeStructure(theme);
            expect(validation.isValid).toBe(true);

            // Generate CSS variables
            const variables = applyThemeVariables(theme);
            expect(Object.keys(variables).length).toBeGreaterThan(0);

            // Generate style string
            const styleString = generateThemeStyleString(theme);
            expect(styleString.length).toBeGreaterThan(0);
            expect(styleString).toContain('--theme-bg-primary');
        });
    });

    describe('Performance and Edge Cases', () => {
        test('should handle large theme objects efficiently', async () => {
            // Create large theme with many properties
            const largeTheme = {
                name: 'Large Theme',
                version: '1.0.0',
                author: 'Performance Test'
            };

            // Add many color variations
            largeTheme.colors = {
                backgrounds: {},
                accents: {}
            };
            for (let i = 0; i < 50; i++) {
                largeTheme.colors.backgrounds[`bg${i}`] = `#${i.toString(16).padStart(6, '0')}`;
                largeTheme.colors.accents[`accent${i}`] = `#${i.toString(16).padStart(6, '0')}`;
            }

            const start = performance.now();
            const validation = await validateThemeStructure(largeTheme);
            const variables = applyThemeVariables(largeTheme);
            const end = performance.now();

            expect(validation.isValid).toBe(true);
            expect(Object.keys(variables).length).toBeGreaterThan(2);
            expect(end - start).toBeLessThan(100); // Should complete in < 100ms
        });

        test('should handle malformed data gracefully', async () => {
            const malformedInputs = [
                null,
                undefined,
                'not an object',
                123,
                [],
                { circular: null }
            ];

            // Set up circular reference
            malformedInputs[malformedInputs.length - 1].circular = malformedInputs[malformedInputs.length - 1];

            for (const input of malformedInputs) {
                await expect(validateThemeStructure(input)).resolves.not.toThrow();
                expect(() => applyThemeVariables(input)).not.toThrow();
            }
        });
    });
}); 