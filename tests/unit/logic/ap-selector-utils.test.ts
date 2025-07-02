/**
 * @fileoverview Unit tests for AP selector utility functions
 * @description Tests for Action Point (AP) icon selection and validation logic
 * @version 2.0.0
 * @author Avant Development Team
 */

import { describe, test, expect } from '@jest/globals';

// Import the functions we're going to implement
import { 
    validateApCost, 
    getApIconsHtml, 
    parseApCostFromForm 
} from '../../../scripts/logic/ap-selector-utils';

describe('AP Selector Utils', () => {
    describe('validateApCost', () => {
        test('should return valid AP cost values unchanged', () => {
            expect(validateApCost(0)).toBe(0);
            expect(validateApCost(1)).toBe(1);
            expect(validateApCost(2)).toBe(2);
            expect(validateApCost(3)).toBe(3);
        });

        test('should clamp invalid values to valid range', () => {
            expect(validateApCost(-1)).toBe(0);
            expect(validateApCost(4)).toBe(3);
            expect(validateApCost(10)).toBe(3);
        });

        test('should convert non-numeric values to 0', () => {
            expect(validateApCost(null)).toBe(0);
            expect(validateApCost(undefined)).toBe(0);
            expect(validateApCost('invalid')).toBe(0);
            expect(validateApCost({})).toBe(0);
        });

        test('should convert string numbers to valid AP cost', () => {
            expect(validateApCost('0')).toBe(0);
            expect(validateApCost('2')).toBe(2);
            expect(validateApCost('3')).toBe(3);
        });

        test('should handle decimal numbers by rounding down', () => {
            expect(validateApCost(1.7)).toBe(1);
            expect(validateApCost(2.9)).toBe(2);
        });
    });

    describe('getApIconsHtml', () => {
        test('should generate HTML for AP cost 0 (no icons)', () => {
            const html = getApIconsHtml(0);
            expect(html).toContain('class="ap-selector"');
            expect(html).toContain('data-ap-cost="0"');
            expect(html).not.toContain('ap-icon--filled');
        });

        test('should generate HTML for AP cost 1', () => {
            const html = getApIconsHtml(1);
            expect(html).toContain('data-ap-cost="1"');
            expect(html.match(/ap-icon--filled/g)).toHaveLength(1);
        });

        test('should generate HTML for AP cost 2', () => {
            const html = getApIconsHtml(2);
            expect(html).toContain('data-ap-cost="2"');
            expect(html.match(/ap-icon--filled/g)).toHaveLength(2);
        });

        test('should generate HTML for AP cost 3', () => {
            const html = getApIconsHtml(3);
            expect(html).toContain('data-ap-cost="3"');
            expect(html.match(/ap-icon--filled/g)).toHaveLength(3);
        });

        test('should include proper ARIA labels for accessibility', () => {
            const html = getApIconsHtml(2);
            expect(html).toContain('aria-label');
            expect(html).toContain('Action Point cost: 2');
        });

        test('should include click handlers for each icon', () => {
            const html = getApIconsHtml(2);
            expect(html).toContain('data-ap-value="0"');
            expect(html).toContain('data-ap-value="1"');
            expect(html).toContain('data-ap-value="2"');
            expect(html).toContain('data-ap-value="3"');
        });
    });

    describe('parseApCostFromForm', () => {
        test('should extract AP cost from form data', () => {
            const formData = new FormData();
            formData.append('system.apCost', '2');
            
            expect(parseApCostFromForm(formData)).toBe(2);
        });

        test('should return 0 for missing AP cost in form', () => {
            const formData = new FormData();
            
            expect(parseApCostFromForm(formData)).toBe(0);
        });

        test('should validate extracted values', () => {
            const formData = new FormData();
            formData.append('system.apCost', '5'); // Invalid, should be clamped
            
            expect(parseApCostFromForm(formData)).toBe(3);
        });

        test('should handle invalid form data gracefully', () => {
            expect(parseApCostFromForm(null)).toBe(0);
            expect(parseApCostFromForm(undefined)).toBe(0);
        });
    });
}); 