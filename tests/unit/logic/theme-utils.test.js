/**
 * @fileoverview Tests for Theme Utility Functions - Pure Logic
 * @version 1.0.0
 * @author Avant VTT Team
 * @description Unit tests for extracted theme utility functions with no FoundryVTT dependencies
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { 
    validateColor,
    mixColors,
    generateThemeStyleString,
    clearThemeVariables,
    applyThemeVariables,
    validateThemeStructure,
    getNestedProperty
} from '../../../scripts/logic/theme-utils.js';

describe('Theme Utils - Pure Logic Functions', () => {
    
    describe('validateColor', () => {
        test('should validate hex colors correctly', () => {
            
            // Valid hex colors
            expect(validateColor('#00E0DC')).toBe(true);
            expect(validateColor('#FFF')).toBe(true);
            expect(validateColor('#000000')).toBe(true);
            expect(validateColor('#4CE2E1')).toBe(true);
            
            // Invalid hex colors
            expect(validateColor('00E0DC')).toBe(false); // Missing #
            expect(validateColor('#GGG')).toBe(false); // Invalid characters
            expect(validateColor('#12345')).toBe(false); // Wrong length
            expect(validateColor('')).toBe(false); // Empty string
            expect(validateColor(null)).toBe(false); // Null
            expect(validateColor(undefined)).toBe(false); // Undefined
        });

        test('should validate RGB colors correctly', () => {
            
            // Valid RGB colors
            expect(validateColor('rgb(0, 224, 220)')).toBe(true);
            expect(validateColor('rgba(76, 226, 225, 0.8)')).toBe(true);
            expect(validateColor('rgb(255, 255, 255)')).toBe(true);
            
            // Invalid RGB colors
            expect(validateColor('rgb(256, 224, 220)')).toBe(false); // Out of range
            expect(validateColor('rgb(0, 224)')).toBe(false); // Missing component
            expect(validateColor('rgba(0, 224, 220)')).toBe(false); // Missing alpha
        });
    });

    describe('mixColors', () => {
        test('should mix two hex colors correctly', () => {
            
            // Mix black and white should give gray
            expect(mixColors('#000000', '#FFFFFF', 0.5)).toBe('#808080');
            
            // Mix at different ratios
            expect(mixColors('#FF0000', '#0000FF', 0.5)).toBe('#800080'); // Red + Blue = Purple
            expect(mixColors('#FF0000', '#0000FF', 0.0)).toBe('#FF0000'); // All first color
            expect(mixColors('#FF0000', '#0000FF', 1.0)).toBe('#0000FF'); // All second color
        });

        test('should handle edge cases for color mixing', () => {
            // Invalid inputs should return first color or null
            expect(mixColors('invalid', '#FFFFFF', 0.5)).toBeNull();
            expect(mixColors('#000000', 'invalid', 0.5)).toBeNull();
            expect(mixColors('#000000', '#FFFFFF', -0.5)).toBe('#000000'); // Clamp to 0
            expect(mixColors('#000000', '#FFFFFF', 1.5)).toBe('#FFFFFF'); // Clamp to 1
        });
    });

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
        test('should validate complete theme objects', () => {
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

            const result = validateThemeStructure(validTheme);
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        test('should identify missing required fields', () => {
            const invalidTheme = {
                // Missing name, version, author
                colors: {
                    backgrounds: {
                        primary: '#1C1C1C'
                    }
                }
            };

            const result = validateThemeStructure(invalidTheme);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('name'))).toBe(true);
            expect(result.errors.some(error => error.includes('version'))).toBe(true);
            expect(result.errors.some(error => error.includes('author'))).toBe(true);
        });

        test('should validate color format in theme', () => {
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

            const result = validateThemeStructure(themeWithInvalidColors);
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
        test('should work together for complete theme processing', () => {
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
            const validation = validateThemeStructure(theme);
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
        test('should handle large theme objects efficiently', () => {
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
            const validation = validateThemeStructure(largeTheme);
            const variables = applyThemeVariables(largeTheme);
            const end = performance.now();

            expect(validation.isValid).toBe(true);
            expect(Object.keys(variables).length).toBeGreaterThan(2);
            expect(end - start).toBeLessThan(100); // Should complete in < 100ms
        });

        test('should handle malformed data gracefully', () => {
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

            malformedInputs.forEach(input => {
                expect(() => validateThemeStructure(input)).not.toThrow();
                expect(() => applyThemeVariables(input)).not.toThrow();
            });
        });
    });
}); 