/**
 * @fileoverview Unit tests for layout system helpers
 * @description Tests for the declarative DSL helpers
 */

import { describe, it, expect } from '@jest/globals';
import { field, when, fullWidth, filterFields, commonFields } from '../../../scripts/layout/helpers';

describe('Layout System Helpers', () => {
    describe('field() helper', () => {
        it('should return the same field object passed to it', () => {
            const testField = {
                type: 'text',
                name: 'system.damage',
                value: '1d8',
                label: 'Damage'
            };
            
            const result = field(testField);
            
            expect(result).toBe(testField);
            expect(result).toEqual(testField);
        });
        
        it('should preserve all field properties', () => {
            const testField = {
                type: 'number',
                name: 'system.cost',
                value: 100,
                label: 'Cost',
                min: 0,
                max: 1000,
                placeholder: '0',
                hint: 'Cost in credits',
                class: 'gear-cost'
            };
            
            const result = field(testField);
            
            expect(result.type).toBe('number');
            expect(result.name).toBe('system.cost');
            expect(result.value).toBe(100);
            expect(result.label).toBe('Cost');
            expect(result.min).toBe(0);
            expect(result.max).toBe(1000);
            expect(result.placeholder).toBe('0');
            expect(result.hint).toBe('Cost in credits');
            expect(result.class).toBe('gear-cost');
        });
    });
    
    describe('when() helper', () => {
        it('should return field when predicate is true', () => {
            const testField = {
                type: 'text',
                name: 'system.damage',
                value: '1d8',
                label: 'Damage'
            };
            
            const result = when(true, () => testField);
            
            expect(result).toBe(testField);
        });
        
        it('should return null when predicate is false', () => {
            const testField = {
                type: 'text',
                name: 'system.damage',
                value: '1d8',
                label: 'Damage'
            };
            
            const result = when(false, () => testField);
            
            expect(result).toBeNull();
        });
        
        it('should not call factory function when predicate is false', () => {
            let called = false;
            const mockFactory = () => {
                called = true;
                return { type: 'test' };
            };
            
            when(false, mockFactory);
            
            expect(called).toBe(false);
        });
        
        it('should call factory function when predicate is true', () => {
            let called = false;
            const mockFactory = () => {
                called = true;
                return { type: 'test' };
            };
            
            when(true, mockFactory);
            
            expect(called).toBe(true);
        });
    });
    
    describe('fullWidth() helper', () => {
        it('should add fullWidth property to field', () => {
            const testField = {
                type: 'description',
                name: 'system.description',
                value: 'Test description',
                label: 'Description'
            };
            
            const result = fullWidth(testField);
            
            expect(result.fullWidth).toBe(true);
            expect(result.type).toBe('description');
            expect(result.name).toBe('system.description');
            expect(result.value).toBe('Test description');
            expect(result.label).toBe('Description');
        });
        
        it('should preserve existing properties', () => {
            const testField = {
                type: 'traits',
                name: 'system.traits',
                value: ['fire', 'sharp'],
                label: 'Traits',
                hint: 'Add descriptive traits',
                class: 'weapon-traits'
            };
            
            const result = fullWidth(testField);
            
            expect(result.fullWidth).toBe(true);
            expect(result.type).toBe('traits');
            expect(result.name).toBe('system.traits');
            expect(result.value).toEqual(['fire', 'sharp']);
            expect(result.label).toBe('Traits');
            expect(result.hint).toBe('Add descriptive traits');
            expect(result.class).toBe('weapon-traits');
        });
    });
    
    describe('filterFields() helper', () => {
        it('should filter out null values', () => {
            const fields = [
                { type: 'text', name: 'field1', label: 'Field 1' },
                null,
                { type: 'number', name: 'field2', label: 'Field 2' },
                null,
                { type: 'select', name: 'field3', label: 'Field 3' }
            ];
            
            const result = filterFields(fields);
            
            expect(result).toHaveLength(3);
            expect(result[0].name).toBe('field1');
            expect(result[1].name).toBe('field2');
            expect(result[2].name).toBe('field3');
        });
        
        it('should preserve field order', () => {
            const fields = [
                { type: 'text', name: 'first', label: 'First' },
                null,
                { type: 'number', name: 'second', label: 'Second' },
                { type: 'select', name: 'third', label: 'Third' },
                null
            ];
            
            const result = filterFields(fields);
            
            expect(result[0].name).toBe('first');
            expect(result[1].name).toBe('second');
            expect(result[2].name).toBe('third');
        });
        
        it('should handle empty array', () => {
            const result = filterFields([]);
            
            expect(result).toEqual([]);
        });
        
        it('should handle array with only null values', () => {
            const result = filterFields([null, null, null]);
            
            expect(result).toEqual([]);
        });
    });
    
    describe('commonFields helpers', () => {
        describe('apCost', () => {
            it('should return field when value is defined', () => {
                const result = commonFields.apCost(2, 'talent');
                
                expect(result).toBeTruthy();
                expect(result.type).toBe('ap-selector');
                expect(result.name).toBe('system.apCost');
                expect(result.value).toBe(2);
                expect(result.label).toBe('AP');
                expect(result.hint).toBe('Action Point cost to use this talent');
                expect(result.max).toBe(3);
                expect(result.class).toBe('talent-ap-cost');
            });
            
            it('should return null when value is undefined', () => {
                const result = commonFields.apCost(undefined, 'talent');
                
                expect(result).toBeNull();
            });
        });
        
        describe('description', () => {
            it('should return full-width description field', () => {
                const result = commonFields.description('Test description', 'weapon');
                
                expect(result.fullWidth).toBe(true);
                expect(result.type).toBe('description');
                expect(result.name).toBe('system.description');
                expect(result.value).toBe('Test description');
                expect(result.label).toBe('Description');
                expect(result.placeholder).toBe('Describe this weapon...');
                expect(result.hint).toBe('Detailed description of the weapon\'s appearance and function');
                expect(result.class).toBe('weapon-description');
            });
            
            it('should handle undefined value', () => {
                const result = commonFields.description(undefined, 'armor');
                
                expect(result.value).toBe('');
                expect(result.placeholder).toBe('Describe this armor...');
            });
        });
        
        describe('weight', () => {
            it('should return field when value is defined', () => {
                const result = commonFields.weight(2.5, 'gear');
                
                expect(result).toBeTruthy();
                expect(result.type).toBe('number');
                expect(result.name).toBe('system.weight');
                expect(result.value).toBe(2.5);
                expect(result.label).toBe('Weight');
                expect(result.min).toBe(0);
                expect(result.step).toBe(0.1);
                expect(result.hint).toBe('Weight in pounds');
                expect(result.class).toBe('gear-weight');
            });
            
            it('should return null when value is undefined', () => {
                const result = commonFields.weight(undefined, 'gear');
                
                expect(result).toBeNull();
            });
        });
        
        describe('ability', () => {
            it('should return select field with ability options', () => {
                const result = commonFields.ability('grace', 'weapon');
                
                expect(result).toBeTruthy();
                expect(result.type).toBe('select');
                expect(result.name).toBe('system.ability');
                expect(result.value).toBe('grace');
                expect(result.label).toBe('Ability');
                expect(result.options).toHaveLength(4);
                expect(result.options[0]).toEqual({ value: 'might', label: 'Might' });
                expect(result.options[1]).toEqual({ value: 'grace', label: 'Grace' });
                expect(result.options[2]).toEqual({ value: 'intellect', label: 'Intellect' });
                expect(result.options[3]).toEqual({ value: 'focus', label: 'Focus' });
                expect(result.hint).toBe('Primary ability for weapon calculations');
                expect(result.class).toBe('weapon-ability');
            });
            
            it('should return null when value is undefined', () => {
                const result = commonFields.ability(undefined, 'weapon');
                
                expect(result).toBeNull();
            });
        });
        
        describe('traits', () => {
            it('should return full-width traits field for non-trait items', () => {
                const result = commonFields.traits(['fire', 'sharp'], 'weapon');
                
                expect(result).toBeTruthy();
                expect(result.fullWidth).toBe(true);
                expect(result.type).toBe('traits');
                expect(result.name).toBe('system.traits');
                expect(result.value).toEqual(['fire', 'sharp']);
                expect(result.label).toBe('Traits');
                expect(result.hint).toBe('Add descriptive traits for this item');
                expect(result.class).toBe('weapon-traits');
            });
            
            it('should return null for trait items', () => {
                const result = commonFields.traits(['fire'], 'trait');
                
                expect(result).toBeNull();
            });
            
            it('should handle undefined value', () => {
                const result = commonFields.traits(undefined, 'armor');
                
                expect(result).toBeTruthy();
                expect(result.value).toEqual([]);
            });
        });
    });
});