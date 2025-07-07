/**
 * @fileoverview Tests for Color Contrast and Accessibility Utilities
 * @version 1.0.0
 * @author Avant VTT Team
 * @description Unit tests for color validation, mixing, and contrast checking.
 */

import { describe, test, expect } from '@jest/globals';
import { 
    validateColor,
    mixColors
} from '../../../scripts/accessibility/color-contrast.ts';

describe('Color Contrast Utilities', () => {
    
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
            // Invalid inputs should return null
            expect(mixColors('invalid', '#FFFFFF', 0.5)).toBeNull();
            expect(mixColors('#000000', 'invalid', 0.5)).toBeNull();
            
            // Clamping ratios
            expect(mixColors('#000000', '#FFFFFF', -0.5)).toBe('#000000'); // Clamp to 0
            expect(mixColors('#000000', '#FFFFFF', 1.5)).toBe('#FFFFFF'); // Clamp to 1
        });
    });
}); 