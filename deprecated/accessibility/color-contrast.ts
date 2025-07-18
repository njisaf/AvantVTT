/**
 * @fileoverview Color Contrast Accessibility Utilities
 * @description WCAG-compliant color contrast and readability functions
 * 
 * This module provides comprehensive color contrast analysis and automatic
 * text color generation following Web Content Accessibility Guidelines (WCAG) 2.1.
 * 
 * All functions are pure (no side effects) and can be easily tested.
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since Accessibility Module Implementation
 */

import type { 
  RGBColor, 
  HSLColor, 
  ContrastOptions, 
  ContrastResult, 
  ColorSuggestion 
} from './types/accessibility';
import type { WCAGLevel } from './types/wcag';
import { WCAG_CONTRAST_STANDARDS } from './types/wcag';

/**
 * Calculate the relative luminance of a color according to WCAG standards.
 * 
 * Relative luminance is the relative brightness of any point in a colorspace,
 * normalized to 0 for darkest black and 1 for lightest white.
 * 
 * @param rgb - RGB color values (0-255 each)
 * @returns Relative luminance value (0-1)
 * 
 * @example
 * ```typescript
 * const luminance = calculateLuminance({ r: 255, g: 255, b: 255 });
 * console.log(luminance); // 1.0 (white)
 * 
 * const luminance2 = calculateLuminance({ r: 0, g: 0, b: 0 });
 * console.log(luminance2); // 0.0 (black)
 * ```
 */
export function calculateLuminance(rgb: RGBColor): number {
  // Convert RGB values to sRGB (0-1 range)
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  // Apply gamma correction
  const toLinear = (component: number): number => {
    return component <= 0.03928 
      ? component / 12.92 
      : Math.pow((component + 0.055) / 1.055, 2.4);
  };

  const rLinear = toLinear(rsRGB);
  const gLinear = toLinear(gsRGB);
  const bLinear = toLinear(bsRGB);

  // Calculate relative luminance using WCAG formula
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Convert hex color string to RGB values.
 * 
 * Supports both 3-digit (#RGB) and 6-digit (#RRGGBB) hex formats.
 * 
 * @param hexColor - Hex color string (with or without #)
 * @returns RGB color object or null if invalid
 * 
 * @example
 * ```typescript
 * const rgb = hexToRgb('#FF6B6B');
 * console.log(rgb); // { r: 255, g: 107, b: 107 }
 * 
 * const rgb2 = hexToRgb('ABC');
 * console.log(rgb2); // { r: 170, g: 187, b: 204 }
 * ```
 */
export function hexToRgb(hexColor: string): RGBColor | null {
  try {
    // Remove # if present and normalize
    const hex = hexColor.replace('#', '').toUpperCase();
    
    // Validate hex format
    if (!/^[0-9A-F]{3}$|^[0-9A-F]{6}$/.test(hex)) {
      return null;
    }
    
    let r: number, g: number, b: number;
    
    if (hex.length === 3) {
      // 3-digit hex: #RGB -> #RRGGBB
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      // 6-digit hex: #RRGGBB
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
    
    return { r, g, b };
  } catch (error) {
    return null;
  }
}

/**
 * Convert RGB values to hex color string.
 * 
 * @param rgb - RGB color values (0-255 each)
 * @returns Hex color string (e.g., '#FF6B6B')
 * 
 * @example
 * ```typescript
 * const hex = rgbToHex({ r: 255, g: 107, b: 107 });
 * console.log(hex); // '#FF6B6B'
 * ```
 */
export function rgbToHex(rgb: RGBColor): string {
  const toHex = (component: number): string => {
    const hex = Math.round(Math.max(0, Math.min(255, component))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

/**
 * Calculate WCAG-compliant contrast ratio between two colors.
 * 
 * The contrast ratio is calculated according to WCAG 2.1 guidelines
 * and ranges from 1:1 (no contrast) to 21:1 (maximum contrast).
 * 
 * @param foreground - Foreground color (hex string)
 * @param background - Background color (hex string)
 * @returns Contrast ratio (1-21) or 0 if calculation fails
 * 
 * @example
 * ```typescript
 * const ratio = calculateContrastRatio('#000000', '#FFFFFF');
 * console.log(ratio); // 21 (perfect contrast)
 * 
 * const ratio2 = calculateContrastRatio('#FF6B6B', '#FFFFFF');
 * console.log(ratio2); // ~3.1 (below AA standard)
 * ```
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  try {
    const fgRgb = hexToRgb(foreground);
    const bgRgb = hexToRgb(background);
    
    if (!fgRgb || !bgRgb) {
      console.warn('Invalid color format for contrast calculation:', { foreground, background });
      return 0;
    }
    
    const fgLuminance = calculateLuminance(fgRgb);
    const bgLuminance = calculateLuminance(bgRgb);
    
    // Ensure lighter color is numerator
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    
    // Calculate contrast ratio: (L1 + 0.05) / (L2 + 0.05)
    const ratio = (lighter + 0.05) / (darker + 0.05);
    
    return Math.round(ratio * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating contrast ratio:', error);
    return 0;
  }
}

/**
 * Determine if a color is light or dark for contrast determination.
 * 
 * MIGRATION NOTE: This function was moved from trait-renderer.ts where it was
 * disabled for trait rendering but preserved for future accessibility use.
 * 
 * This function converts a hex color to RGB and calculates the relative
 * luminance to determine if the color appears light or dark to the human eye.
 * 
 * @param hexColor - Hex color string (e.g., '#FF6B6B' or 'FF6B6B')
 * @returns True if the color is light, false if dark
 * 
 * @example
 * ```typescript
 * const isLight = isLightColor('#FF6B6B'); // false (dark-ish red)
 * const isLight2 = isLightColor('#FFEB3B'); // true (bright yellow)
 * const isLight3 = isLightColor('#FFFFFF'); // true (white)
 * const isLight4 = isLightColor('#000000'); // false (black)
 * ```
 */
export function isLightColor(hexColor: string): boolean {
  try {
    const rgb = hexToRgb(hexColor);
    
    if (!rgb) {
      console.warn(`Invalid hex color format: ${hexColor}`);
      return false; // Default to dark
    }
    
    // Calculate relative luminance using WCAG formula
    const luminance = calculateLuminance(rgb);
    
    // Colors with luminance > 0.5 are considered light
    return luminance > 0.5;
    
  } catch (error) {
    console.error('Error calculating color lightness:', error);
    return false; // Default to dark on error
  }
}

/**
 * Check if color combination meets WCAG contrast standards.
 * 
 * This function provides comprehensive contrast analysis including
 * compliance checking and improvement suggestions.
 * 
 * @param foreground - Foreground color (text color)
 * @param background - Background color
 * @param options - Configuration options
 * @returns Detailed contrast analysis result
 * 
 * @example
 * ```typescript
 * const result = checkColorContrast('#FF6B6B', '#FFFFFF', { 
 *   level: 'AA',
 *   provideSuggestions: true 
 * });
 * 
 * if (!result.passes) {
 *   console.log('Contrast too low:', result.ratio);
 *   console.log('Suggestions:', result.suggestions);
 * }
 * ```
 */
export function checkColorContrast(
  foreground: string, 
  background: string, 
  options: ContrastOptions = {}
): ContrastResult {
  const {
    level = 'AA',
    provideSuggestions = false,
    textSize = 'normal'
  } = options;
  
  const ratio = calculateContrastRatio(foreground, background);
  
  // Get WCAG requirements for the specified level
  const requirements = WCAG_CONTRAST_STANDARDS[level];
  const requiredRatio = textSize === 'large' 
    ? requirements.largeText 
    : requirements.normalText;
  
  const passes = ratio >= requiredRatio;
  
  // Determine highest level that passes
  let passedLevel: WCAGLevel | undefined;
  for (const testLevel of ['AAA', 'AA', 'A'] as WCAGLevel[]) {
    const testRequirements = WCAG_CONTRAST_STANDARDS[testLevel];
    const testRequired = textSize === 'large' 
      ? testRequirements.largeText 
      : testRequirements.normalText;
    
    if (ratio >= testRequired) {
      passedLevel = testLevel;
      break;
    }
  }
  
  const result: ContrastResult = {
    ratio,
    passes,
    level: passedLevel
  };
  
  // Add detailed calculation info
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  if (fgRgb && bgRgb) {
    result.details = {
      foregroundLuminance: calculateLuminance(fgRgb),
      backgroundLuminance: calculateLuminance(bgRgb),
      requiredRatio
    };
  }
  
  // Generate suggestions if requested and needed
  if (provideSuggestions && !passes) {
    result.suggestions = generateColorSuggestions(foreground, background, requiredRatio);
  }
  
  return result;
}

/**
 * Generate accessible text color for a given background.
 * 
 * This function automatically selects black or white text based on
 * which provides better contrast with the background color.
 * 
 * @param backgroundColor - Background color (hex string)
 * @param options - Configuration options
 * @returns Accessible text color (black or white)
 * 
 * @example
 * ```typescript
 * const textColor = generateAccessibleTextColor('#FF6B6B', { level: 'AA' });
 * console.log(textColor); // '#000000' or '#FFFFFF'
 * 
 * const textColor2 = generateAccessibleTextColor('#000000');
 * console.log(textColor2); // '#FFFFFF'
 * ```
 */
export function generateAccessibleTextColor(
  backgroundColor: string, 
  options: ContrastOptions = {}
): string {
  const { level = 'AA', textSize = 'normal' } = options;
  
  // Test both black and white text
  const blackContrast = calculateContrastRatio('#000000', backgroundColor);
  const whiteContrast = calculateContrastRatio('#FFFFFF', backgroundColor);
  
  const requirements = WCAG_CONTRAST_STANDARDS[level];
  const requiredRatio = textSize === 'large' 
    ? requirements.largeText 
    : requirements.normalText;
  
  // If both meet requirements, choose the one with higher contrast
  if (blackContrast >= requiredRatio && whiteContrast >= requiredRatio) {
    return blackContrast > whiteContrast ? '#000000' : '#FFFFFF';
  }
  
  // If only one meets requirements, use that one
  if (blackContrast >= requiredRatio) return '#000000';
  if (whiteContrast >= requiredRatio) return '#FFFFFF';
  
  // If neither meets requirements, use the one with higher contrast
  return blackContrast > whiteContrast ? '#000000' : '#FFFFFF';
}

/**
 * Generate color suggestions for improving contrast.
 * 
 * This function provides specific color alternatives that would
 * meet the required contrast ratio.
 * 
 * @param foreground - Current foreground color
 * @param background - Current background color  
 * @param targetRatio - Desired contrast ratio
 * @returns Array of color suggestions
 * 
 * @example
 * ```typescript
 * const suggestions = generateColorSuggestions('#FF6B6B', '#FFFFFF', 4.5);
 * // Returns suggestions for darker reds that meet AA standards
 * ```
 */
export function generateColorSuggestions(
  foreground: string, 
  background: string, 
  targetRatio: number
): ColorSuggestion[] {
  const suggestions: ColorSuggestion[] = [];
  
  try {
    const fgRgb = hexToRgb(foreground);
    const bgRgb = hexToRgb(background);
    
    if (!fgRgb || !bgRgb) return suggestions;
    
    // Generate darker/lighter variants of foreground color
    const fgHsl = rgbToHsl(fgRgb);
    
    // Try darkening the foreground color
    for (let lightness = fgHsl.l - 10; lightness >= 0; lightness -= 10) {
      const newHsl: HSLColor = { ...fgHsl, l: lightness };
      const newRgb = hslToRgb(newHsl);
      const newHex = rgbToHex(newRgb);
      const ratio = calculateContrastRatio(newHex, background);
      
      if (ratio >= targetRatio) {
        suggestions.push({
          color: newHex,
          ratio,
          description: `Darker ${foreground} for better contrast`,
          type: 'foreground'
        });
        break; // Found a working solution
      }
    }
    
    // Try lightening the foreground color
    for (let lightness = fgHsl.l + 10; lightness <= 100; lightness += 10) {
      const newHsl: HSLColor = { ...fgHsl, l: lightness };
      const newRgb = hslToRgb(newHsl);
      const newHex = rgbToHex(newRgb);
      const ratio = calculateContrastRatio(newHex, background);
      
      if (ratio >= targetRatio) {
        suggestions.push({
          color: newHex,
          ratio,
          description: `Lighter ${foreground} for better contrast`,
          type: 'foreground'
        });
        break; // Found a working solution
      }
    }
    
    // If no good foreground options, suggest using black or white
    if (suggestions.length === 0) {
      const blackRatio = calculateContrastRatio('#000000', background);
      const whiteRatio = calculateContrastRatio('#FFFFFF', background);
      
      if (blackRatio >= targetRatio) {
        suggestions.push({
          color: '#000000',
          ratio: blackRatio,
          description: 'Black text for optimal contrast',
          type: 'foreground'
        });
      }
      
      if (whiteRatio >= targetRatio) {
        suggestions.push({
          color: '#FFFFFF',
          ratio: whiteRatio,
          description: 'White text for optimal contrast',
          type: 'foreground'
        });
      }
    }
    
  } catch (error) {
    console.error('Error generating color suggestions:', error);
  }
  
  return suggestions;
}

/**
 * MIGRATION: Validate color format for theme-utils compatibility
 * 
 * MIGRATION NOTE: This function was moved from scripts/logic/theme-utils.js
 * to centralize all color validation in the accessibility module.
 * 
 * Validates if a color string is in a valid format (hex, rgb, rgba).
 * Supports all common color formats with proper validation.
 * 
 * @param color - The color string to validate
 * @returns True if the color is valid, false otherwise
 * 
 * @example
 * ```typescript
 * validateColor('#00E0DC'); // true
 * validateColor('rgb(0, 224, 220)'); // true
 * validateColor('rgba(0, 224, 220, 0.5)'); // true
 * validateColor('invalid'); // false
 * ```
 */
export function validateColor(color: unknown): boolean {
    if (!color || typeof color !== 'string') {
        return false;
    }

    // Hex color validation (3 or 6 digit)
    const hexPattern = /^#([0-9A-F]{3}){1,2}$/i;
    if (hexPattern.test(color)) {
        return true;
    }

    // RGB color validation
    const rgbPattern = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
    const rgbMatch = color.match(rgbPattern);
    if (rgbMatch) {
        const [, r, g, b] = rgbMatch;
        return [r, g, b].every(val => {
            const num = parseInt(val);
            return num >= 0 && num <= 255;
        });
    }

    // RGBA color validation
    const rgbaPattern = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)$/;
    const rgbaMatch = color.match(rgbaPattern);
    if (rgbaMatch) {
        const [, r, g, b, a] = rgbaMatch;
        const rgbValid = [r, g, b].every(val => {
            const num = parseInt(val);
            return num >= 0 && num <= 255;
        });
        const alphaValid = parseFloat(a) >= 0 && parseFloat(a) <= 1;
        return rgbValid && alphaValid;
    }

    return false;
}

/**
 * MIGRATION: Mix two colors with WCAG-aware enhancements
 * 
 * MIGRATION NOTE: This function was moved from scripts/logic/theme-utils.js
 * and enhanced with better error handling and accessibility considerations.
 * 
 * Takes two hex colors and returns a new color that is a mix of both.
 * The ratio determines how much of each color to use (0 = all color1, 1 = all color2)
 * 
 * @param color1 - First hex color (e.g., '#FF0000')
 * @param color2 - Second hex color (e.g., '#0000FF')
 * @param ratio - Mixing ratio between 0 and 1
 * @param options - Additional options for mixing
 * @returns Mixed hex color or null if inputs are invalid
 * 
 * @example
 * ```typescript
 * mixColors('#FF0000', '#0000FF', 0.5); // '#800080' (purple)
 * mixColors('#000000', '#FFFFFF', 0.5); // '#808080' (gray)
 * mixColors('#FF6B6B', '#FFFFFF', 0.3); // Light red for better contrast
 * ```
 */
export function mixColors(
    color1: string, 
    color2: string, 
    ratio: number, 
    options: { preserveContrast?: boolean; minContrast?: number } = {}
): string | null {
    // Validate inputs using centralized validation
    if (!validateColor(color1) || !validateColor(color2)) {
        console.warn('Invalid color format for mixing:', { color1, color2 });
        return null;
    }

    // Clamp ratio between 0 and 1
    ratio = Math.max(0, Math.min(1, ratio));

    // Handle edge cases
    if (ratio === 0) return color1;
    if (ratio === 1) return color2;

    // Convert hex to RGB using existing accessibility function
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    if (!rgb1 || !rgb2) {
        console.warn('Failed to convert colors to RGB for mixing:', { color1, color2 });
        return null;
    }

    // Mix the colors
    const mixedR = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
    const mixedG = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
    const mixedB = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);

    // Convert back to hex using existing accessibility function
    const mixedColor = rgbToHex({ r: mixedR, g: mixedG, b: mixedB });

    // WCAG-aware enhancement: Check contrast if requested
    if (options.preserveContrast && options.minContrast) {
        const contrastWith1 = calculateContrastRatio(mixedColor, color1);
        const contrastWith2 = calculateContrastRatio(mixedColor, color2);
        
        if (Math.max(contrastWith1, contrastWith2) < options.minContrast) {
            console.warn('Mixed color results in low contrast:', {
                mixedColor,
                contrastWith1,
                contrastWith2,
                minRequired: options.minContrast
            });
        }
    }

    return mixedColor;
}

/**
 * Convert RGB to HSL color space.
 * 
 * @param rgb - RGB color values
 * @returns HSL color values
 */
function rgbToHsl(rgb: RGBColor): HSLColor {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / diff + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }
    
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Convert HSL to RGB color space.
 * 
 * @param hsl - HSL color values
 * @returns RGB color values
 */
function hslToRgb(hsl: HSLColor): RGBColor {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  
  let r: number, g: number, b: number;
  
  if (s === 0) {
    r = g = b = l; // Achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
} 