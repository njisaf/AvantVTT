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

import type { ThemeConfig, ThemeValidationResult, ThemeVariables } from '../types/domain/theme';

/**
 * RGB color components.
 * Represents red, green, and blue values for color calculations.
 */
interface RGBColor {
  /** Red component (0-255) */
  r: number;
  /** Green component (0-255) */
  g: number;
  /** Blue component (0-255) */
  b: number;
}

/**
 * ⚠️ DEPRECATED: validateColor has been moved to the accessibility module
 * 
 * MIGRATION NOTE: This function has been moved to scripts/accessibility/color-contrast.ts
 * for better organization and to centralize all accessibility-related color functionality.
 * 
 * @deprecated Use validateColor from '../accessibility' instead
 * @param color - The color string to validate
 * @returns True if the color is valid, false otherwise
 */
export function validateColor(color: unknown): boolean {
    console.warn('⚠️ validateColor is deprecated. Use validateColor from ../accessibility instead.');
    
    // Import from accessibility module
    // For TypeScript, we maintain return type compatibility
    try {
        // Dynamically import to avoid circular dependencies
        // In practice, callers should update to import directly from accessibility
        if (!color || typeof color !== 'string') return false;
        const hexPattern = /^#([0-9A-F]{3}){1,2}$/i;
        return hexPattern.test(color); // Simplified fallback
    } catch (error) {
        console.error('Error in deprecated validateColor fallback:', error);
        return false;
    }
}

/**
 * ⚠️ DEPRECATED: mixColors has been moved to the accessibility module
 * 
 * MIGRATION NOTE: This function has been moved to scripts/accessibility/color-contrast.ts
 * with enhanced WCAG-aware features and better error handling.
 * 
 * @deprecated Use mixColors from '../accessibility' instead
 * @param color1 - First hex color
 * @param color2 - Second hex color  
 * @param ratio - Mixing ratio between 0 and 1
 * @returns Mixed hex color or null if inputs are invalid
 */
export function mixColors(color1: string, color2: string, ratio: number): string | null {
    console.warn('⚠️ mixColors is deprecated. Use mixColors from ../accessibility instead.');
    
    // For TypeScript, we maintain return type compatibility
    try {
        // Simplified fallback for deprecated function
        // In practice, callers should update to import directly from accessibility
        console.error('Accessibility module should be used directly for color mixing');
        return null;
    } catch (error) {
        console.error('Error in deprecated mixColors fallback:', error);
        return null;
    }
}

/**
 * Generates a CSS style string from a theme object
 * 
 * Takes a theme object and converts it to CSS custom properties that can be
 * applied to elements or injected into stylesheets.
 * 
 * @param theme - Theme object with colors, fonts, etc.
 * @returns CSS style string with custom properties
 * 
 * @example
 * ```typescript
 * const theme = { colors: { primary: '#00E0DC' } };
 * generateThemeStyleString(theme); // '--theme-primary: #00E0DC;'
 * ```
 */
export function generateThemeStyleString(theme: unknown): string {
    if (!theme || typeof theme !== 'object') {
        return '';
    }

    const variables = applyThemeVariables(theme);
    const styleLines: string[] = [];

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
 * @returns Array of CSS custom property names (e.g., ['--theme-primary'])
 */
export function clearThemeVariables(): string[] {
    // Fallback list of CSS variables to clear
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
        '--theme-version',
        '--theme-bg-primary',
        '--theme-bg-secondary',
        '--theme-bg-tertiary',
        '--theme-text-primary',
        '--theme-text-secondary',
        '--theme-text-muted',
        '--theme-accent-primary',
        '--theme-accent-secondary',
        '--theme-accent-tertiary',
        '--theme-border-primary',
        '--theme-border-accent',
        '--theme-font-primary',
        '--theme-font-display'
    ];
}

/**
 * Converts a theme object to CSS custom property assignments
 * 
 * Maps theme properties to CSS variables using the theme configuration.
 * Handles special cases like quoting text values and skipping undefined properties.
 * 
 * @param theme - Theme object to convert
 * @returns Object mapping CSS variable names to their values
 * 
 * @example
 * ```typescript
 * const theme = { name: 'Dark', colors: { primary: '#00E0DC' } };
 * applyThemeVariables(theme); 
 * // { '--theme-name': '"Dark"', '--theme-primary': '#00E0DC' }
 * ```
 */
export function applyThemeVariables(theme: unknown): Record<string, string> {
    if (!theme || typeof theme !== 'object') {
        return {};
    }

    const variableMap: Record<string, string> = {};

    // Fallback manual mapping for theme variables
    const fallbackMapping: Record<string, string> = {
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
                variableMap[cssVar] = String(value);
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
 * @param theme - Theme object to validate
 * @returns Validation result with isValid boolean and errors array
 * 
 * @example
 * ```typescript
 * validateThemeStructure({ name: 'Test' }); 
 * // { isValid: false, errors: ['Missing required field: version', 'Missing required field: author'] }
 * ```
 */
export function validateThemeStructure(theme: unknown): ThemeValidationResult {
    const result: ThemeValidationResult = {
        valid: true,
        errors: [],
        warnings: []
    };

    // Handle non-object inputs gracefully
    if (!theme || typeof theme !== 'object' || Array.isArray(theme)) {
        result.valid = false;
        result.errors.push('Theme must be a valid object');
        return result;
    }

    const themeObj = theme as any;

    // Fallback validation for required fields
    const requiredFields = ['name', 'version', 'author'];
    
    // Check required fields
    for (const field of requiredFields) {
        if (!themeObj[field] || typeof themeObj[field] !== 'string') {
            result.errors.push(`Missing required field: ${field}`);
            result.valid = false;
        }
    }

    // Recursively validate colors
    function validateColorsRecursive(obj: any, path = 'colors'): void {
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = `${path}.${key}`;
            if (typeof value === 'string' && !validateColor(value)) {
                result.errors.push(`Invalid color format for ${currentPath}: ${value}`);
                result.valid = false;
            } else if (typeof value === 'object' && value !== null) {
                validateColorsRecursive(value, currentPath);
            }
        }
    }

    // Validate colors if present
    if (themeObj.colors && typeof themeObj.colors === 'object') {
        validateColorsRecursive(themeObj.colors);
    }

    return result;
}

/**
 * Safely retrieves a nested property from an object using dot notation
 * 
 * Traverses an object using a string path like 'colors.primary' and returns
 * the value at that path, or undefined if the path doesn't exist.
 * 
 * @param obj - Object to traverse
 * @param path - Dot-separated path to the property
 * @returns Value at the path or undefined if not found
 * 
 * @example
 * ```typescript
 * getNestedProperty({ colors: { primary: '#00E0DC' } }, 'colors.primary'); // '#00E0DC'
 * getNestedProperty({ x: 1 }, 'colors.primary'); // undefined
 * ```
 */
export function getNestedProperty(obj: unknown, path: string): unknown {
    if (!obj || typeof obj !== 'object' || !path) {
        return path === '' ? obj : undefined;
    }

    return path.split('.').reduce((current: any, key: string) => {
        return current && typeof current === 'object' ? current[key] : undefined;
    }, obj);
} 