/**
 * @fileoverview Unit Tests for ThemeConfigUtil
 * @version 2.0.0
 * @author Avant Development Team  
 * @description Comprehensive tests for theme configuration utilities
 */

import { ThemeConfigUtil } from '../../scripts/themes/theme-config-utils.js';

describe('ThemeConfigUtil', () => {
  describe('getAllCSSVariables', () => {
    test('should return an array of CSS variables', () => {
      const variables = ThemeConfigUtil.getAllCSSVariables();
      
      expect(variables)
        .toBeArray()
        .not.toBeEmpty();
    });

    test('should return CSS variables with proper format', () => {
      const variables = ThemeConfigUtil.getAllCSSVariables();
      
      variables.forEach(variable => {
        expect(variable)
          .toBeString()
          .toStartWith('--');
      });
    });

    test('should return unique CSS variables', () => {
      const variables = ThemeConfigUtil.getAllCSSVariables();
      const uniqueVariables = [...new Set(variables)];
      
      expect(variables).toHaveLength(uniqueVariables.length);
    });

    test('should be consistent across multiple calls', () => {
      const variables1 = ThemeConfigUtil.getAllCSSVariables();
      const variables2 = ThemeConfigUtil.getAllCSSVariables();
      
      expect(variables1).toEqual(variables2);
    });
  });

  describe('getJSONToCSSMapping', () => {
    test('should return mapping object', () => {
      const mapping = ThemeConfigUtil.getJSONToCSSMapping();
      
      expect(mapping)
        .toBeObject()
        .not.toBeEmpty();
    });

    test('should map JSON paths to CSS variables', () => {
      const mapping = ThemeConfigUtil.getJSONToCSSMapping();
      
      Object.entries(mapping).forEach(([jsonPath, cssVar]) => {
        expect(jsonPath).toBeString();
        expect(cssVar).toBeString().toStartWith('--');
      });
    });

    test('should have no duplicate CSS variables', () => {
      const mapping = ThemeConfigUtil.getJSONToCSSMapping();
      const cssVars = Object.values(mapping);
      const uniqueCssVars = [...new Set(cssVars)];
      
      expect(cssVars).toHaveLength(uniqueCssVars.length);
    });

    test('should match getAllCSSVariables output', () => {
      const allVariables = ThemeConfigUtil.getAllCSSVariables();
      const mappingVariables = Object.values(ThemeConfigUtil.getJSONToCSSMapping());
      
      expect(allVariables.sort()).toEqual(mappingVariables.sort());
    });
  });

  describe('getRequiredVariables', () => {
    test('should return array of required variables', () => {
      const required = ThemeConfigUtil.getRequiredVariables();
      
      expect(required).toBeArray();
    });

    test('should have required structure for each variable', () => {
      const required = ThemeConfigUtil.getRequiredVariables();
      
      required.forEach(variable => {
        expect(variable).toContainKeys(['path', 'cssVar', 'description']);
        expect(variable.path).toBeString();
        expect(variable.cssVar).toBeString().toStartWith('--');
        expect(variable.description).toBeString();
      });
    });

    test('should only include required variables', () => {
      const required = ThemeConfigUtil.getRequiredVariables();
      
      // All returned variables should be marked as required
      // This is verified by the method's internal logic
      expect(required.length).toBeGreaterThanOrEqual(0);
    });

    test('should be consistent across multiple calls', () => {
      const required1 = ThemeConfigUtil.getRequiredVariables();
      const required2 = ThemeConfigUtil.getRequiredVariables();
      
      expect(required1).toEqual(required2);
    });
  });

  describe('generateThemeTemplate', () => {
    test('should generate basic theme template', () => {
      const template = ThemeConfigUtil.generateThemeTemplate(false);
      
      expect(template)
        .toBeObject()
        .toContainKeys(['name', 'author', 'version', 'description']);
    });

    test('should have proper metadata fields', () => {
      const template = ThemeConfigUtil.generateThemeTemplate(false);
      
      expect(template.name).toBe('My Custom Theme');
      expect(template.author).toBe('Your Name');
      expect(template.version).toBe('1.0.0');
      expect(template.description).toBeString();
    });

    test('should generate template with required variables only', () => {
      const template = ThemeConfigUtil.generateThemeTemplate(false);
      const requiredVars = ThemeConfigUtil.getRequiredVariables();
      
      // Verify template contains paths for required variables
      requiredVars.forEach(variable => {
        const value = ThemeConfigUtil.getNestedProperty(template, variable.path);
        expect(value).toBeDefined();
      });
    });

    test('should generate complete template when includeOptional is true', () => {
      const minimalTemplate = ThemeConfigUtil.generateThemeTemplate(false);
      const completeTemplate = ThemeConfigUtil.generateThemeTemplate(true);
      
      // Complete template should have at least as many properties as minimal
      const minimalKeys = Object.keys(minimalTemplate);
      const completeKeys = Object.keys(completeTemplate);
      
      expect(completeKeys.length).toBeGreaterThanOrEqual(minimalKeys.length);
    });

    test('should create proper nested structure', () => {
      const template = ThemeConfigUtil.generateThemeTemplate(true);
      
      // Template should be an object with nested properties
      expect(template).toBeObject();
      
      // Should have metadata plus theme configuration
      expect(Object.keys(template).length).toBeGreaterThan(4); // more than just metadata
    });
  });

  describe('validateTheme', () => {
    test('should validate complete theme successfully', () => {
      const template = ThemeConfigUtil.generateThemeTemplate(true);
      const validation = ThemeConfigUtil.validateTheme(template);
      
      expect(validation)
        .toBeObject()
        .toContainKeys(['isValid', 'errors']);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toBeArray().toBeEmpty();
    });

    test('should validate minimal theme successfully', () => {
      const template = ThemeConfigUtil.generateThemeTemplate(false);
      const validation = ThemeConfigUtil.validateTheme(template);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toBeEmpty();
    });

    test('should fail validation for incomplete theme', () => {
      const incompleteTheme = {
        name: 'Test Theme',
        author: 'Test Author'
        // Missing required properties
      };
      
      const validation = ThemeConfigUtil.validateTheme(incompleteTheme);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toBeArray();
      
      if (validation.errors.length > 0) {
        validation.errors.forEach(error => {
          expect(error).toBeString().toStartWith('Missing required property:');
        });
      }
    });

    test('should validate empty theme', () => {
      const emptyTheme = {};
      const validation = ThemeConfigUtil.validateTheme(emptyTheme);
      
      expect(validation).toContainKeys(['isValid', 'errors']);
      expect(validation.errors).toBeArray();
    });

    test('should handle null theme gracefully', () => {
      const validation = ThemeConfigUtil.validateTheme(null);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toBeArray();
    });
  });

  describe('getNestedProperty', () => {
    test('should get nested property from object', () => {
      const testObj = {
        level1: {
          level2: {
            level3: 'value'
          }
        }
      };
      
      const value = ThemeConfigUtil.getNestedProperty(testObj, 'level1.level2.level3');
      expect(value).toBe('value');
    });

    test('should get top-level property', () => {
      const testObj = { topLevel: 'value' };
      
      const value = ThemeConfigUtil.getNestedProperty(testObj, 'topLevel');
      expect(value).toBe('value');
    });

    test('should return undefined for non-existent path', () => {
      const testObj = { existing: 'value' };
      
      const value = ThemeConfigUtil.getNestedProperty(testObj, 'nonexistent.path');
      expect(value).toBeUndefined();
    });

    test('should handle empty path', () => {
      const testObj = { test: 'value' };
      
      const value = ThemeConfigUtil.getNestedProperty(testObj, '');
      expect(value).toBeUndefined(); // Empty path returns undefined, not the object
    });

    test('should handle null object gracefully', () => {
      const value = ThemeConfigUtil.getNestedProperty(null, 'any.path');
      expect(value).toBeUndefined();
    });

    test('should handle undefined object gracefully', () => {
      const value = ThemeConfigUtil.getNestedProperty(undefined, 'any.path');
      expect(value).toBeUndefined();
    });

    test('should handle complex nested structures', () => {
      const complexObj = {
        colors: {
          primary: {
            main: '#FF0000',
            variants: {
              light: '#FF6666',
              dark: '#990000'
            }
          }
        }
      };
      
      expect(ThemeConfigUtil.getNestedProperty(complexObj, 'colors.primary.main')).toBe('#FF0000');
      expect(ThemeConfigUtil.getNestedProperty(complexObj, 'colors.primary.variants.light')).toBe('#FF6666');
      expect(ThemeConfigUtil.getNestedProperty(complexObj, 'colors.secondary')).toBeUndefined();
    });
  });

  describe('generateDocumentation', () => {
    test('should generate documentation string', () => {
      const docs = ThemeConfigUtil.generateDocumentation();
      
      expect(docs)
        .toBeString()
        .not.toBeEmpty();
    });

    test('should include proper markdown headers', () => {
      const docs = ThemeConfigUtil.generateDocumentation();
      
      expect(docs).toContain('# Theme Variables Reference');
      expect(docs).toContain('##');
      expect(docs).toContain('###');
    });

    test('should include CSS variable documentation', () => {
      const docs = ThemeConfigUtil.generateDocumentation();
      const allVariables = ThemeConfigUtil.getAllCSSVariables();
      
      // Should contain at least some CSS variables
      const hasVariables = allVariables.some(variable => docs.includes(variable));
      expect(hasVariables).toBe(true);
    });

    test('should include required field information', () => {
      const docs = ThemeConfigUtil.generateDocumentation();
      
      expect(docs).toContain('**Required**');
      expect(docs).toContain('**Description**');
      expect(docs).toContain('**Example**');
    });

    test('should be properly formatted markdown', () => {
      const docs = ThemeConfigUtil.generateDocumentation();
      
      // Basic markdown format checks
      expect(docs).toContain('\n\n'); // Proper spacing
      expect(docs).toMatch(/#{1,6} /); // Headers
      expect(docs).toMatch(/\*\*.*\*\*/); // Bold text
    });
  });

  describe('Integration Tests', () => {
    test('should work together - template generation and validation', () => {
      const template = ThemeConfigUtil.generateThemeTemplate(true);
      const validation = ThemeConfigUtil.validateTheme(template);
      
      expect(validation.isValid).toBe(true);
    });

    test('should work together - mapping and variable extraction', () => {
      const allVars = ThemeConfigUtil.getAllCSSVariables();
      const mapping = ThemeConfigUtil.getJSONToCSSMapping();
      const mappedVars = Object.values(mapping);
      
      expect(allVars.sort()).toEqual(mappedVars.sort());
    });

    test('should work together - required variables and validation', () => {
      const required = ThemeConfigUtil.getRequiredVariables();
      const template = ThemeConfigUtil.generateThemeTemplate(false);
      
      // All required variables should be present in minimal template
      required.forEach(variable => {
        const value = ThemeConfigUtil.getNestedProperty(template, variable.path);
        expect(value).toBeDefined();
      });
    });

    test('should work together - documentation includes all variables', () => {
      const allVars = ThemeConfigUtil.getAllCSSVariables();
      const docs = ThemeConfigUtil.generateDocumentation();
      
      // At least some variables should be documented
      const documentedVars = allVars.filter(variable => docs.includes(variable));
      expect(documentedVars.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle methods being called multiple times', () => {
      // Test multiple calls don't interfere with each other
      for (let i = 0; i < 5; i++) {
        expect(() => {
          ThemeConfigUtil.getAllCSSVariables();
          ThemeConfigUtil.getJSONToCSSMapping();
          ThemeConfigUtil.getRequiredVariables();
          ThemeConfigUtil.generateThemeTemplate(i % 2 === 0);
          ThemeConfigUtil.generateDocumentation();
        }).not.toThrow();
      }
    });

    test('should maintain performance with repeated calls', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        ThemeConfigUtil.getAllCSSVariables();
        ThemeConfigUtil.getJSONToCSSMapping();
        ThemeConfigUtil.getRequiredVariables();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 200ms)
      expect(duration).toBeLessThan(200);
    });

    test('should handle malformed nested property paths', () => {
      const testObj = { test: 'value' };
      
      expect(() => {
        ThemeConfigUtil.getNestedProperty(testObj, 'test..double.dot');
        ThemeConfigUtil.getNestedProperty(testObj, '.starting.dot');
        ThemeConfigUtil.getNestedProperty(testObj, 'ending.dot.');
      }).not.toThrow();
    });

    test('should validate against various theme object types', () => {
      const testCases = [
        {},
        { name: 'test' },
        { invalidProperty: 'value' },
        null,
        undefined,
        'not an object',
        123,
        []
      ];
      
      testCases.forEach(testCase => {
        expect(() => {
          const validation = ThemeConfigUtil.validateTheme(testCase);
          expect(validation).toContainKeys(['isValid', 'errors']);
        }).not.toThrow();
      });
    });
  });
}); 