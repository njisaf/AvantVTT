/**
 * @fileoverview Unit tests for layout system central builder
 * @description Tests for the central layout registry and builder functions
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
    getHeaderLayout, 
    getBodyLayout, 
    getSupportedItemTypes, 
    isItemTypeSupported, 
    registerItemType, 
    validateRegistry,
    _registry 
} from '../../../scripts/layout/index';

describe('Layout System Central Builder', () => {
    const mockGearItem = {
        type: 'gear',
        name: 'Test Gear',
        system: {
            weight: 2.5,
            cost: 100,
            description: 'A test gear item',
            traits: ['durable']
        }
    };
    
    const mockTalentItem = {
        type: 'talent',
        name: 'Test Talent',
        system: {
            apCost: 2,
            description: 'A test talent',
            levelRequirement: 3,
            requirements: 'Must have training',
            traits: ['combat']
        }
    };
    
    const mockWeaponItem = {
        type: 'weapon',
        name: 'Test Weapon',
        system: {
            damage: '1d8',
            modifier: 2,
            ability: 'might',
            weight: 3.0,
            cost: 150,
            description: 'A test weapon',
            traits: ['sharp', 'metal']
        }
    };
    
    describe('getHeaderLayout()', () => {
        it('should return header fields for gear items', () => {
            const result = getHeaderLayout(mockGearItem);
            
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            
            // Should have weight and cost fields
            const weightField = result.find(f => f.name === 'system.weight');
            const costField = result.find(f => f.name === 'system.cost');
            
            expect(weightField).toBeTruthy();
            expect(weightField.type).toBe('number');
            expect(weightField.value).toBe(2.5);
            
            expect(costField).toBeTruthy();
            expect(costField.type).toBe('number');
            expect(costField.value).toBe(100);
        });
        
        it('should return header fields for talent items', () => {
            const result = getHeaderLayout(mockTalentItem);
            
            expect(Array.isArray(result)).toBe(true);
            
            // Should have AP cost field
            const apField = result.find(f => f.name === 'system.apCost');
            expect(apField).toBeTruthy();
            expect(apField.type).toBe('ap-selector');
            expect(apField.value).toBe(2);
        });
        
        it('should return header fields for weapon items', () => {
            const result = getHeaderLayout(mockWeaponItem);
            
            expect(Array.isArray(result)).toBe(true);
            
            // Should have damage and modifier fields
            const damageField = result.find(f => f.name === 'system.damage');
            const modifierField = result.find(f => f.name === 'system.modifier');
            
            expect(damageField).toBeTruthy();
            expect(damageField.type).toBe('text');
            expect(damageField.value).toBe('1d8');
            
            expect(modifierField).toBeTruthy();
            expect(modifierField.type).toBe('number');
            expect(modifierField.value).toBe(2);
        });
        
        it('should return empty array for unsupported item types', () => {
            const unsupportedItem = {
                type: 'unsupported',
                name: 'Test Item',
                system: {}
            };
            
            const result = getHeaderLayout(unsupportedItem);
            
            expect(result).toEqual([]);
        });
        
        it('should handle errors gracefully', () => {
            const invalidItem = null;
            
            const result = getHeaderLayout(invalidItem);
            
            expect(result).toEqual([]);
        });
    });
    
    describe('getBodyLayout()', () => {
        it('should return body fields for gear items', () => {
            const result = getBodyLayout(mockGearItem);
            
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            
            // Should have description field
            const descriptionField = result.find(f => f.name === 'system.description');
            expect(descriptionField).toBeTruthy();
            expect(descriptionField.type).toBe('description');
            expect(descriptionField.fullWidth).toBe(true);
            expect(descriptionField.value).toBe('A test gear item');
            
            // Should have traits field
            const traitsField = result.find(f => f.name === 'system.traits');
            expect(traitsField).toBeTruthy();
            expect(traitsField.type).toBe('traits');
            expect(traitsField.fullWidth).toBe(true);
            expect(traitsField.value).toEqual(['durable']);
        });
        
        it('should return body fields for talent items', () => {
            const result = getBodyLayout(mockTalentItem);
            
            expect(Array.isArray(result)).toBe(true);
            
            // Should have AP cost field
            const apField = result.find(f => f.name === 'system.apCost');
            expect(apField).toBeTruthy();
            expect(apField.type).toBe('ap-selector');
            
            // Should have description field
            const descriptionField = result.find(f => f.name === 'system.description');
            expect(descriptionField).toBeTruthy();
            expect(descriptionField.fullWidth).toBe(true);
            
            // Should have level requirement field
            const levelField = result.find(f => f.name === 'system.levelRequirement');
            expect(levelField).toBeTruthy();
            expect(levelField.type).toBe('number');
            expect(levelField.value).toBe(3);
            
            // Should have requirements field
            const reqField = result.find(f => f.name === 'system.requirements');
            expect(reqField).toBeTruthy();
            expect(reqField.type).toBe('textarea');
            expect(reqField.value).toBe('Must have training');
        });
        
        it('should return body fields for weapon items', () => {
            const result = getBodyLayout(mockWeaponItem);
            
            expect(Array.isArray(result)).toBe(true);
            
            // Should have damage field
            const damageField = result.find(f => f.name === 'system.damage');
            expect(damageField).toBeTruthy();
            expect(damageField.type).toBe('text');
            
            // Should have ability field
            const abilityField = result.find(f => f.name === 'system.ability');
            expect(abilityField).toBeTruthy();
            expect(abilityField.type).toBe('select');
            expect(abilityField.value).toBe('might');
            
            // Should have weight and cost fields
            const weightField = result.find(f => f.name === 'system.weight');
            const costField = result.find(f => f.name === 'system.cost');
            
            expect(weightField).toBeTruthy();
            expect(costField).toBeTruthy();
        });
        
        it('should return empty array for unsupported item types', () => {
            const unsupportedItem = {
                type: 'unsupported',
                name: 'Test Item',
                system: {}
            };
            
            const result = getBodyLayout(unsupportedItem);
            
            expect(result).toEqual([]);
        });
    });
    
    describe('getSupportedItemTypes()', () => {
        it('should return array of supported item types', () => {
            const result = getSupportedItemTypes();
            
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result).toContain('gear');
            expect(result).toContain('talent');
            expect(result).toContain('weapon');
            expect(result).toContain('armor');
        });
    });
    
    describe('isItemTypeSupported()', () => {
        it('should return true for supported item types', () => {
            expect(isItemTypeSupported('gear')).toBe(true);
            expect(isItemTypeSupported('talent')).toBe(true);
            expect(isItemTypeSupported('weapon')).toBe(true);
            expect(isItemTypeSupported('armor')).toBe(true);
        });
        
        it('should return false for unsupported item types', () => {
            expect(isItemTypeSupported('unsupported')).toBe(false);
            expect(isItemTypeSupported('random')).toBe(false);
            expect(isItemTypeSupported('')).toBe(false);
            expect(isItemTypeSupported(null)).toBe(false);
            expect(isItemTypeSupported(undefined)).toBe(false);
        });
    });
    
    describe('registerItemType()', () => {
        it('should register a new item type', () => {
            const mockModule = {
                header: jest.fn(() => []),
                body: jest.fn(() => [])
            };
            
            registerItemType('testType', mockModule);
            
            expect(isItemTypeSupported('testType')).toBe(true);
            expect(getSupportedItemTypes()).toContain('testType');
        });
        
        it('should allow overriding existing item types', () => {
            const originalModule = _registry.gear;
            const mockModule = {
                header: jest.fn(() => [{ type: 'test' }]),
                body: jest.fn(() => [{ type: 'test' }])
            };
            
            registerItemType('gear', mockModule);
            
            const result = getHeaderLayout(mockGearItem);
            expect(result).toEqual([{ type: 'test' }]);
            
            // Restore original module
            _registry.gear = originalModule;
        });
    });
    
    describe('validateRegistry()', () => {
        it('should validate registry successfully', () => {
            const result = validateRegistry();
            
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        
        it('should detect invalid modules', () => {
            const originalModule = _registry.gear;
            
            // Add invalid module
            _registry.invalidModule = {
                header: 'not a function',
                // missing body function
            };
            
            const result = validateRegistry();
            
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('invalidModule module missing header function');
            expect(result.errors).toContain('invalidModule module missing body function');
            
            // Cleanup
            delete _registry.invalidModule;
        });
    });
    
    describe('field order consistency', () => {
        it('should maintain consistent field order across calls', () => {
            const result1 = getBodyLayout(mockTalentItem);
            const result2 = getBodyLayout(mockTalentItem);
            
            expect(result1).toEqual(result2);
            
            // Verify order is: AP cost, description, level requirement, requirements, traits
            const fieldNames = result1.map(f => f.name);
            
            const apIndex = fieldNames.indexOf('system.apCost');
            const descIndex = fieldNames.indexOf('system.description');
            const levelIndex = fieldNames.indexOf('system.levelRequirement');
            const reqIndex = fieldNames.indexOf('system.requirements');
            const traitsIndex = fieldNames.indexOf('system.traits');
            
            expect(apIndex).toBeLessThan(descIndex);
            expect(descIndex).toBeLessThan(levelIndex);
            expect(levelIndex).toBeLessThan(reqIndex);
            expect(reqIndex).toBeLessThan(traitsIndex);
        });
    });
});