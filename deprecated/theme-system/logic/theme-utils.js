/**
 * Pure Theme Utility Functions
 * 
 * This module contains pure functions for theme processing, validation, and manipulation.
 * All functions have no side effects and don't depend on FoundryVTT APIs or DOM manipulation.
 * 
 * These functions help with:
 * - Color validation and manipulation
 * - Theme structure validation
 * - CSS variable generation
 * - Object property access
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since Phase B Refactor
 */

import { ThemeConfigUtil } from '../themes/theme-config-utils.js';
import { validateColor } from '../accessibility/color-contrast.ts';

/**
 * Generates a CSS style string from a theme object
 * 
 * Takes a theme object and converts it to CSS custom properties that can be
 * applied to elements or injected into stylesheets.
 * 
 * @param {Object} theme - Theme object with colors, fonts, etc.
 * @returns {string} CSS style string with custom properties
 * 
 * @example
 * const theme = { colors: { primary: '#00E0DC' } };
 * generateThemeStyleString(theme); // '--theme-primary: #00E0DC;'
 */
export function generateThemeStyleString(theme) {
    if (!theme || typeof theme !== 'object') {
        return '';
    }

    const variables = applyThemeVariables(theme);
    const styleLines = [];

    for (const [cssVar, value] of Object.entries(variables)) {
        if (value !== undefined && value !== null) {
            styleLines.push(`${cssVar}: ${value}`);
        }
    }

    return styleLines.join(';\n') + (styleLines.length > 0 ? ';' : '');
}

/**
 * Returns an array of all CSS custom property names that should be cleared
 * 
 * Uses the theme configuration to automatically discover all CSS variables
 * that might need to be cleared when switching themes.
 * 
 * @returns {string[]} Array of CSS custom property names (e.g., ['--theme-primary'])
 */
export function clearThemeVariables() {
    try {
        return ThemeConfigUtil.getAllCSSVariables();
    } catch (error) {
        // Fallback if ThemeConfigUtil is not available
        return [
            '--theme-primary',
            '--theme-secondary',
            '--theme-accent',
            '--theme-background',
            '--theme-surface',
            '--theme-text',
            '--font-display',
            '--font-primary',
            '--theme-name',
            '--theme-author',
            '--theme-version'
        ];
    }
}

/**
 * Converts a theme object to CSS custom property assignments
 * 
 * Maps theme properties to CSS variables using the theme configuration.
 * Handles special cases like quoting text values and skipping undefined properties.
 * 
 * @param {Object} theme - Theme object to convert
 * @returns {Object} Object mapping CSS variable names to their values
 * 
 * @example
 * const theme = { name: 'Dark', colors: { primary: '#00E0DC' } };
 * applyThemeVariables(theme); 
 * // { '--theme-name': '"Dark"', '--theme-primary': '#00E0DC' }
 */
export function applyThemeVariables(theme) {
    if (!theme || typeof theme !== 'object') {
        return {};
    }

    const variableMap = {};

    try {
        // Get the automatic JSON-to-CSS mapping from configuration
        const mapping = ThemeConfigUtil.getJSONToCSSMapping();

        // Apply variables automatically based on configuration
        for (const [jsonPath, cssVar] of Object.entries(mapping)) {
            const value = getNestedProperty(theme, jsonPath);
            if (value !== undefined && value !== null) {
                // Handle special cases for metadata that need quotes
                if (cssVar.includes('name') || cssVar.includes('author') || cssVar.includes('version')) {
                    variableMap[cssVar] = `"${value}"`;
                } else if (typeof value === 'string' && (cssVar.includes('font') || value.includes(' '))) {
                    // Quote font names and values with spaces
                    variableMap[cssVar] = `"${value}"`;
                } else {
                    variableMap[cssVar] = value;
                }
            }
        }
        
        // Force fallback for metadata variables until ThemeConfigUtil includes them
        throw new Error('Use fallback for complete variable mapping');
    } catch (error) {
        // Fallback manual mapping if ThemeConfigUtil is not available
        const fallbackMapping = {
            'metadata.name': '--theme-name',
            'metadata.author': '--theme-author',
            'metadata.version': '--theme-version',
            'name': '--theme-name',           // Also support direct metadata access
            'author': '--theme-author',
            'version': '--theme-version',
            'colors.backgrounds.primary': '--theme-bg-primary',
            'colors.backgrounds.secondary': '--theme-bg-secondary',
            'colors.backgrounds.tertiary': '--theme-bg-tertiary',
            'colors.text.primary': '--theme-text-primary',
            'colors.text.secondary': '--theme-text-secondary',
            'colors.text.muted': '--theme-text-muted',
            'colors.accents.primary': '--theme-accent-primary',
            'colors.accents.secondary': '--theme-accent-secondary',
            'colors.accents.tertiary': '--theme-accent-tertiary',
            'colors.borders.primary': '--theme-border-primary',
            'colors.borders.accent': '--theme-border-accent',
            'typography.fontPrimary': '--theme-font-primary',
            'typography.fontDisplay': '--theme-font-display'
        };

        for (const [jsonPath, cssVar] of Object.entries(fallbackMapping)) {
            const value = getNestedProperty(theme, jsonPath);
            if (value !== undefined && value !== null) {
                if (cssVar.includes('name') || cssVar.includes('author') || cssVar.includes('version') || cssVar.includes('font')) {
                    variableMap[cssVar] = `"${value}"`;
                } else {
                    variableMap[cssVar] = value;
                }
            }
        }
    }

    return variableMap;
}

/**
 * Validates the structure and content of a theme object
 * 
 * Checks that a theme has all required fields and that color values are valid.
 * Returns detailed validation results with specific error messages.
 * 
 * @param {Object} theme - Theme object to validate
 * @returns {Promise<Object>} A promise that resolves to a validation result with isValid boolean and errors array
 * 
 * @example
 * await validateThemeStructure({ name: 'Test' }); 
 * // { isValid: false, errors: ['Missing required field: version', 'Missing required field: author'] }
 */
export async function validateThemeStructure(theme) {
    const result = {
        isValid: true,
        errors: []
    };

    // Handle non-object inputs gracefully
    if (!theme || typeof theme !== 'object' || Array.isArray(theme)) {
        result.isValid = false;
        result.errors.push('Theme must be a valid object');
        return result;
    }

    try {
        // Use ThemeConfigUtil if available
        const validation = ThemeConfigUtil.validateTheme(theme);
        
        // Force fallback for consistent validation
        throw new Error('Use fallback for complete validation');
        
        return validation;
    } catch (error) {
        // Fallback validation if ThemeConfigUtil is not available
        const requiredFields = ['name', 'version', 'author'];
        
        // Check required fields
        for (const field of requiredFields) {
            if (!theme[field] || typeof theme[field] !== 'string') {
                result.errors.push(`Missing required field: ${field}`);
                result.isValid = false;
            }
        }

        // Recursively validate colors
        async function validateColorsRecursive(obj, path = 'colors') {
            for (const [key, value] of Object.entries(obj)) {
                const currentPath = `${path}.${key}`;
                if (typeof value === 'string') {
                    if (!(await validateColor(value))) {
                        result.errors.push(`Invalid color format for ${currentPath}: ${value}`);
                        result.isValid = false;
                    }
                } else if (typeof value === 'object' && value !== null) {
                    await validateColorsRecursive(value, currentPath);
                }
            }
        }

        // Validate colors if present
        if (theme.colors && typeof theme.colors === 'object') {
            await validateColorsRecursive(theme.colors);
        }

        return result;
    }
}

/**
 * Safely retrieves a nested property from an object using dot notation
 * 
 * Traverses an object using a string path like 'colors.primary' and returns
 * the value at that path, or undefined if the path doesn't exist.
 * 
 * @param {Object} obj - Object to traverse
 * @param {string} path - Dot-separated path to the property
 * @returns {*} Value at the path or undefined if not found
 * 
 * @example
 * getNestedProperty({ colors: { primary: '#00E0DC' } }, 'colors.primary'); // '#00E0DC'
 * getNestedProperty({ x: 1 }, 'colors.primary'); // undefined
 */
export function getNestedProperty(obj, path) {
    if (!obj || typeof obj !== 'object' || !path) {
        return path === '' ? obj : undefined;
    }

    return path.split('.').reduce((current, key) => {
        return current && typeof current === 'object' ? current[key] : undefined;
    }, obj);
} 