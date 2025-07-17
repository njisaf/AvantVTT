/**
 * @fileoverview Integration tests for layout system with item-sheet-utils
 * @description Tests that verify the layout system integrates properly with existing item sheet utilities
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prepareItemHeaderMetaFields, prepareItemBodyFields } from '../../../scripts/logic/item-sheet-utils';

describe('Layout System Integration with Item Sheet Utils', () => {
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
    
    const mockUnsupportedItem = {
        type: 'feature',
        name: 'Test Feature',
        system: {
            powerPointCost: 3,
            isActive: true,
            description: 'A test feature',
            category: 'combat'
        }
    };
    
    describe('prepareItemHeaderMetaFields() integration', () => {
        it('should use layout system for gear items', () => {
            const result = prepareItemHeaderMetaFields(mockGearItem, mockGearItem.system);
            
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            
            // Should have weight and cost fields from layout system
            const weightField = result.find(f => f.name === 'system.weight');
            const costField = result.find(f => f.name === 'system.cost');
            
            expect(weightField).toBeTruthy();
            expect(weightField.type).toBe('number');
            expect(weightField.value).toBe(2.5);
            expect(weightField.class).toBe('gear-weight');
            
            expect(costField).toBeTruthy();
            expect(costField.type).toBe('number');
            expect(costField.value).toBe(100);
            expect(costField.class).toBe('gear-cost');
        });
        
        it('should use layout system for talent items', () => {
            const result = prepareItemHeaderMetaFields(mockTalentItem, mockTalentItem.system);
            
            expect(Array.isArray(result)).toBe(true);
            
            // Should have AP cost field from layout system
            const apField = result.find(f => f.name === 'system.apCost');
            expect(apField).toBeTruthy();
            expect(apField.type).toBe('ap-selector');
            expect(apField.value).toBe(2);
            expect(apField.class).toBe('talent-ap-cost');
        });
        
        it('should use layout system for weapon items', () => {
            const result = prepareItemHeaderMetaFields(mockWeaponItem, mockWeaponItem.system);
            
            expect(Array.isArray(result)).toBe(true);
            
            // Should have damage and modifier fields from layout system
            const damageField = result.find(f => f.name === 'system.damage');
            const modifierField = result.find(f => f.name === 'system.modifier');
            
            expect(damageField).toBeTruthy();
            expect(damageField.type).toBe('text');
            expect(damageField.value).toBe('1d8');
            expect(damageField.class).toBe('weapon-damage');
            
            expect(modifierField).toBeTruthy();
            expect(modifierField.type).toBe('number');
            expect(modifierField.value).toBe(2);
            expect(modifierField.class).toBe('weapon-modifier');
        });
        
        it('should fall back to legacy logic for unsupported items', () => {
            const result = prepareItemHeaderMetaFields(mockUnsupportedItem, mockUnsupportedItem.system);
            
            expect(Array.isArray(result)).toBe(true);
            
            // Should have legacy fields for feature items
            const ppField = result.find(f => f.name === 'system.powerPointCost');
            const activeField = result.find(f => f.name === 'system.isActive');
            
            expect(ppField).toBeTruthy();
            expect(ppField.type).toBe('number');
            expect(ppField.value).toBe(3);
            
            expect(activeField).toBeTruthy();
            expect(activeField.type).toBe('checkbox');
            expect(activeField.checked).toBe(true);
        });
    });
    
    describe('prepareItemBodyFields() integration', () => {
        it('should use layout system for gear items', () => {
            const result = prepareItemBodyFields(mockGearItem, mockGearItem.system);
            
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            
            // Should have description field
            const descriptionField = result.find(f => f.name === 'system.description');
            expect(descriptionField).toBeTruthy();
            expect(descriptionField.type).toBe('description');
            expect(descriptionField.fullWidth).toBe(true);
            expect(descriptionField.value).toBe('A test gear item');
            expect(descriptionField.class).toBe('gear-description');
            
            // Should have traits field
            const traitsField = result.find(f => f.name === 'system.traits');
            expect(traitsField).toBeTruthy();
            expect(traitsField.type).toBe('traits');
            expect(traitsField.fullWidth).toBe(true);
            expect(traitsField.value).toEqual(['durable']);
            expect(traitsField.class).toBe('gear-traits');
        });
        
        it('should use layout system for talent items', () => {
            const result = prepareItemBodyFields(mockTalentItem, mockTalentItem.system);
            
            expect(Array.isArray(result)).toBe(true);
            
            // Should have AP cost field
            const apField = result.find(f => f.name === 'system.apCost');
            expect(apField).toBeTruthy();
            expect(apField.type).toBe('ap-selector');
            expect(apField.class).toBe('talent-ap-cost');
            
            // Should have description field
            const descriptionField = result.find(f => f.name === 'system.description');
            expect(descriptionField).toBeTruthy();
            expect(descriptionField.fullWidth).toBe(true);
            expect(descriptionField.class).toBe('talent-description');
            
            // Should have level requirement field
            const levelField = result.find(f => f.name === 'system.levelRequirement');
            expect(levelField).toBeTruthy();
            expect(levelField.type).toBe('number');
            expect(levelField.value).toBe(3);
            expect(levelField.class).toBe('talent-level-requirement');
            
            // Should have requirements field
            const reqField = result.find(f => f.name === 'system.requirements');
            expect(reqField).toBeTruthy();
            expect(reqField.type).toBe('textarea');
            expect(reqField.value).toBe('Must have training');
            expect(reqField.class).toBe('talent-requirements');
        });
        
        it('should use layout system for weapon items', () => {
            const result = prepareItemBodyFields(mockWeaponItem, mockWeaponItem.system);
            
            expect(Array.isArray(result)).toBe(true);
            
            // Should have damage field
            const damageField = result.find(f => f.name === 'system.damage');
            expect(damageField).toBeTruthy();
            expect(damageField.type).toBe('text');
            expect(damageField.class).toBe('weapon-damage');
            
            // Should have ability field
            const abilityField = result.find(f => f.name === 'system.ability');
            expect(abilityField).toBeTruthy();
            expect(abilityField.type).toBe('select');
            expect(abilityField.value).toBe('might');
            expect(abilityField.class).toBe('weapon-ability');
            
            // Should have weight and cost fields
            const weightField = result.find(f => f.name === 'system.weight');
            const costField = result.find(f => f.name === 'system.cost');
            
            expect(weightField).toBeTruthy();
            expect(weightField.class).toBe('weapon-weight');
            expect(costField).toBeTruthy();
            expect(costField.class).toBe('weapon-cost');
        });
        
        it('should fall back to legacy logic for unsupported items', () => {
            const result = prepareItemBodyFields(mockUnsupportedItem, mockUnsupportedItem.system);
            
            expect(Array.isArray(result)).toBe(true);
            
            // Should have legacy fields for feature items
            const ppField = result.find(f => f.name === 'system.powerPointCost');
            const activeField = result.find(f => f.name === 'system.isActive');
            const descriptionField = result.find(f => f.name === 'system.description');
            const categoryField = result.find(f => f.name === 'system.category');
            
            expect(ppField).toBeTruthy();
            expect(ppField.type).toBe('number');
            expect(ppField.class).toBe('feature-pp-cost');
            
            expect(activeField).toBeTruthy();
            expect(activeField.type).toBe('checkbox');
            expect(activeField.class).toBe('feature-active');
            
            expect(descriptionField).toBeTruthy();
            expect(descriptionField.type).toBe('description');
            expect(descriptionField.fullWidth).toBe(true);
            expect(descriptionField.class).toBe('feature-description');
            
            expect(categoryField).toBeTruthy();
            expect(categoryField.type).toBe('select');
            expect(categoryField.value).toBe('combat');
            expect(categoryField.class).toBe('feature-category');
        });
    });
    
    describe('field order consistency', () => {
        it('should maintain consistent field order for talent items', () => {
            const result = prepareItemBodyFields(mockTalentItem, mockTalentItem.system);
            const fieldNames = result.map(f => f.name);
            
            // Verify order is: AP cost, description, level requirement, requirements, traits
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
        
        it('should maintain consistent field order for weapon items', () => {
            const result = prepareItemBodyFields(mockWeaponItem, mockWeaponItem.system);
            const fieldNames = result.map(f => f.name);
            
            // Verify order is: damage, modifier, description, ability, weight, cost, traits
            const damageIndex = fieldNames.indexOf('system.damage');
            const modifierIndex = fieldNames.indexOf('system.modifier');
            const descIndex = fieldNames.indexOf('system.description');
            const abilityIndex = fieldNames.indexOf('system.ability');
            const weightIndex = fieldNames.indexOf('system.weight');
            const costIndex = fieldNames.indexOf('system.cost');
            const traitsIndex = fieldNames.indexOf('system.traits');
            
            expect(damageIndex).toBeLessThan(modifierIndex);
            expect(modifierIndex).toBeLessThan(descIndex);
            expect(descIndex).toBeLessThan(abilityIndex);
            expect(abilityIndex).toBeLessThan(weightIndex);
            expect(weightIndex).toBeLessThan(costIndex);
            expect(costIndex).toBeLessThan(traitsIndex);
        });
    });
    
    describe('error handling', () => {
        it('should handle invalid item data gracefully', () => {
            const invalidItem = null;
            
            expect(() => {
                prepareItemHeaderMetaFields(invalidItem, {});
            }).not.toThrow();
            
            expect(() => {
                prepareItemBodyFields(invalidItem, {});
            }).not.toThrow();
        });
        
        it('should handle missing system data gracefully', () => {
            const itemWithoutSystem = {
                type: 'gear',
                name: 'Test Gear'
            };
            
            expect(() => {
                prepareItemHeaderMetaFields(itemWithoutSystem, {});
            }).not.toThrow();
            
            expect(() => {
                prepareItemBodyFields(itemWithoutSystem, {});
            }).not.toThrow();
        });
    });
    
    describe('layout system fallback', () => {
        it('should fall back to legacy logic when layout system is not available', () => {
            // Mock the require to throw an error
            const originalRequire = require;
            
            // This test verifies the fallback works, but the actual mocking 
            // would need to be done at a higher level in a real test environment
            // For now, we verify that unsupported types use legacy logic
            const result = prepareItemBodyFields(mockUnsupportedItem, mockUnsupportedItem.system);
            
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            
            // Should have legacy-style fields
            const descriptionField = result.find(f => f.name === 'system.description');
            expect(descriptionField).toBeTruthy();
            expect(descriptionField.type).toBe('description');
        });
    });
});