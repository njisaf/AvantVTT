/**
 * @fileoverview Unit Tests - Item Card Layout System Helpers
 * @description Tests for card layout helper functions
 * @version 0.1.0
 * @author Avant Development Team
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { cardLayout, createCardButton, createCardIcon } from '../../../../scripts/layout/item-card/helpers.js';

describe('Item Card Layout System - Helpers', () => {
    
    describe('cardLayout()', () => {
        it('should create basic three-zone layout', () => {
            const centerFields = [
                { type: 'text', name: 'test-field', value: 'test' }
            ];
            
            const result = cardLayout(centerFields);
            
            expect(result).toHaveProperty('left');
            expect(result).toHaveProperty('center');
            expect(result).toHaveProperty('right');
            expect(result.center).toEqual(centerFields);
        });
        
        it('should include roll button in left zone when rollable', () => {
            const centerFields = [];
            const config = {
                rollable: true,
                rollLabel: 'Test Roll',
                rollAction: 'test-roll'
            };
            
            const result = cardLayout(centerFields, config);
            
            expect(result.left).toHaveLength(2); // roll button + item icon
            expect(result.left[0]).toMatchObject({
                type: 'button',
                buttonType: 'roll',
                action: 'test-roll',
                label: 'Test Roll'
            });
        });
        
        it('should include item icon in left zone', () => {
            const centerFields = [];
            
            const result = cardLayout(centerFields);
            
            expect(result.left).toHaveLength(1); // just item icon when not rollable
            expect(result.left[0]).toMatchObject({
                type: 'icon',
                icon: 'item-img'
            });
        });
        
        it('should include control buttons in right zone by default', () => {
            const centerFields = [];
            
            const result = cardLayout(centerFields);
            
            expect(result.right).toHaveLength(3); // edit, delete, drag
            expect(result.right[0].buttonType).toBe('edit');
            expect(result.right[1].buttonType).toBe('delete');
            expect(result.right[2].buttonType).toBe('drag');
        });
        
        it('should respect control button visibility config', () => {
            const centerFields = [];
            const config = {
                showEdit: false,
                showDelete: false,
                showDrag: true
            };
            
            const result = cardLayout(centerFields, config);
            
            expect(result.right).toHaveLength(1); // only drag
            expect(result.right[0].buttonType).toBe('drag');
        });
        
        it('should pass through center fields unchanged', () => {
            const centerFields = [
                { type: 'text', name: 'field1', value: 'value1' },
                { type: 'number', name: 'field2', value: 42 }
            ];
            
            const result = cardLayout(centerFields);
            
            expect(result.center).toEqual(centerFields);
        });
    });
    
    describe('createCardButton()', () => {
        it('should create button with required properties', () => {
            const config = {
                type: 'roll',
                action: 'test-action',
                label: 'Test Button'
            };
            
            const button = createCardButton(config);
            
            expect(button).toMatchObject({
                type: 'button',
                buttonType: 'roll',
                action: 'test-action',
                label: 'Test Button'
            });
        });
        
        it('should apply default values for optional properties', () => {
            const config = {
                type: 'custom',
                action: 'test-action',
                label: 'Test Button'
            };
            
            const button = createCardButton(config);
            
            expect(button.icon).toBe('fas fa-circle');
            expect(button.tooltip).toBe('Test Button');
            expect(button.class).toBe('card-custom-btn');
        });
        
        it('should use provided optional values', () => {
            const config = {
                type: 'edit',
                action: 'edit-item',
                label: 'Edit',
                icon: 'fas fa-pencil',
                tooltip: 'Edit this item',
                className: 'custom-edit-btn'
            };
            
            const button = createCardButton(config);
            
            expect(button.icon).toBe('fas fa-pencil');
            expect(button.tooltip).toBe('Edit this item');
            expect(button.class).toBe('custom-edit-btn');
        });
    });
    
    describe('createCardIcon()', () => {
        it('should create icon with required properties', () => {
            const config = {
                icon: 'fas fa-star'
            };
            
            const icon = createCardIcon(config);
            
            expect(icon).toMatchObject({
                type: 'icon',
                icon: 'fas fa-star'
            });
        });
        
        it('should apply default class name', () => {
            const config = {
                icon: 'fas fa-star'
            };
            
            const icon = createCardIcon(config);
            
            expect(icon.class).toBe('card-custom-icon');
        });
        
        it('should use provided optional values', () => {
            const config = {
                icon: 'fas fa-fire',
                tooltip: 'Fire damage',
                color: '#ff4444',
                className: 'damage-icon'
            };
            
            const icon = createCardIcon(config);
            
            expect(icon.tooltip).toBe('Fire damage');
            expect(icon.color).toBe('#ff4444');
            expect(icon.class).toBe('damage-icon');
        });
    });
    
    describe('Edge Cases', () => {
        it('should handle empty center fields array', () => {
            const result = cardLayout([]);
            
            expect(result.center).toEqual([]);
            expect(result.left).toHaveLength(1); // item icon
            expect(result.right).toHaveLength(3); // all controls
        });
        
        it('should handle null/undefined config', () => {
            const centerFields = [{ type: 'text', name: 'test', value: 'test' }];
            
            const result1 = cardLayout(centerFields, null);
            const result2 = cardLayout(centerFields, undefined);
            
            expect(result1.left).toHaveLength(1); // not rollable
            expect(result2.left).toHaveLength(1); // not rollable
        });
        
        it('should handle partial config objects', () => {
            const centerFields = [];
            const config = { rollable: true }; // missing other properties
            
            const result = cardLayout(centerFields, config);
            
            // Should use defaults for missing properties
            expect(result.left[0].label).toBe('Use');
            expect(result.left[0].action).toBe('item-roll');
            expect(result.right).toHaveLength(3); // all controls enabled by default
        });
    });
});