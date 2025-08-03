/**
 * Integration tests for the unified actions system
 * Tests the complete flow from gear items to action display
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { performance } from 'perf_hooks';
import { combineActionSources, type CombinedAction } from '../../scripts/logic/unified-actions.js';
import { DEFAULT_ACTION_CONFIG } from '../../scripts/logic/unified-actions.js';
import { createMockActor, createMockItem } from '../mocks/mock-factories.js';

describe('Unified Actions Integration Tests', () => {
    let mockActor: any;
    let mockWeapon: any;
    let mockArmor: any;
    let mockAction: any;
    let performanceTimer: number;

    beforeEach(() => {
        // Create test actor with gear items
        mockActor = createMockActor({
            name: 'Test Actor',
            system: {
                attributes: {
                    strength: { value: 12 },
                    agility: { value: 14 }
                }
            }
        });

        // Create mock weapon
        mockWeapon = createMockItem({
            name: 'Plasma Rifle',
            type: 'weapon',
            system: {
                weaponType: 'energy',
                damage: '2d10+4',
                range: '120',
                traits: ['high-energy', 'two-handed']
            }
        });

        // Create mock armor
        mockArmor = createMockItem({
            name: 'Combat Vest',
            type: 'armor',
            system: {
                armorClass: 3,
                traits: ['ballistic', 'light']
            }
        });

        // Create mock standalone action
        mockAction = createMockItem({
            name: 'Tactical Sprint',
            type: 'action',
            system: {
                actionType: 'movement',
                description: 'Move up to double speed for one turn'
            }
        });

        // Mock actor's items collection
        mockActor.items = new Map([
            [mockWeapon.id, mockWeapon],
            [mockArmor.id, mockArmor],
            [mockAction.id, mockAction]
        ]);

        // Start performance timer
        performanceTimer = performance.now();
    });

    afterEach(() => {
        const elapsed = performance.now() - performanceTimer;
        console.log(`Test completed in ${elapsed.toFixed(2)}ms`);
    });

    describe('Action Combination', () => {
        it('should combine gear and standalone actions correctly', () => {
            const result = combineActionSources(mockActor, DEFAULT_ACTION_CONFIG);
            
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            
            if (result.success && result.data) {
                const actions = result.data;
                expect(actions.length).toBe(3); // weapon, armor, action
                
                // Check weapon action
                const weaponAction = actions.find(a => a.source === 'weapon');
                expect(weaponAction).toBeDefined();
                if (weaponAction) {
                    expect(weaponAction.name).toBe('Plasma Rifle');
                    expect(weaponAction.buttons.map(b => b.type)).toContain('attack');
                    expect(weaponAction.buttons.map(b => b.type)).toContain('damage');
                    const attackButton = weaponAction.buttons.find(b => b.type === 'attack');
                    expect(attackButton?.total).toBe('+11');
                }

                // Check armor action
                const armorAction = actions.find(a => a.source === 'armor');
                expect(armorAction).toBeDefined();
                if (armorAction) {
                    expect(armorAction.name).toBe('Combat Vest');
                    expect(armorAction.buttons.map(b => b.type)).toContain('armor');
                    const armorButton = armorAction.buttons.find(b => b.type === 'armor');
                    expect(armorButton?.total).toBe('+11');
                }

                // Check standalone action
                const standaloneAction = actions.find(a => a.source === 'action');
                expect(standaloneAction).toBeDefined();
                if (standaloneAction) {
                    expect(standaloneAction.name).toBe('Tactical Sprint');
                    expect(standaloneAction.buttons.map(b => b.type)).toContain('use');
                }
            }
        });

        it('should handle empty actor gracefully', () => {
            const emptyActor = createMockActor({ name: 'Empty Actor' });
            emptyActor.items = new Map();
            
            const result = combineActionSources(emptyActor, DEFAULT_ACTION_CONFIG);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
        });

        it('should maintain proper sorting order', () => {
            const result = combineActionSources(mockActor, DEFAULT_ACTION_CONFIG);
            
            expect(result.success).toBe(true);
            
            if (result.success && result.data) {
                const actions = result.data;
                const sourceOrder = actions.map(a => a.source);
                
                // Should maintain order: weapons, armor, gear, actions
                expect(sourceOrder.indexOf('weapon')).toBeLessThan(sourceOrder.indexOf('armor'));
                expect(sourceOrder.indexOf('armor')).toBeLessThan(sourceOrder.indexOf('action'));
            }
        });
    });

    describe('Performance Benchmarks', () => {
        it('should process actions within performance threshold', () => {
            const startTime = performance.now();
            
            // Run multiple iterations to get average
            for (let i = 0; i < 100; i++) {
                const result = combineActionSources(mockActor, DEFAULT_ACTION_CONFIG);
                expect(result.success).toBe(true);
            }
            
            const endTime = performance.now();
            const averageTime = (endTime - startTime) / 100;
            
            // Should process within 1ms per call
            expect(averageTime).toBeLessThan(1);
        });

        it('should handle large item collections efficiently', () => {
            // Create actor with many items
            const largeActor = createMockActor({ name: 'Large Actor' });
            const items = new Map();
            
            // Add 50 weapons
            for (let i = 0; i < 50; i++) {
                const weapon = createMockItem({
                    name: `Weapon ${i}`,
                    type: 'weapon',
                    system: { damage: '1d6' }
                });
                items.set(weapon.id, weapon);
            }
            
            largeActor.items = items;
            
            const startTime = performance.now();
            const result = combineActionSources(largeActor, DEFAULT_ACTION_CONFIG);
            const endTime = performance.now();
            
            expect(result.success).toBe(true);
            expect(result.data?.length).toBe(50);
            expect(endTime - startTime).toBeLessThan(10); // Should complete in under 10ms
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed item data gracefully', () => {
            const malformedItem = createMockItem({
                name: 'Broken Item',
                type: 'weapon',
                system: null // Malformed system data
            });
            
            mockActor.items.set(malformedItem.id, malformedItem);
            
            const result = combineActionSources(mockActor, DEFAULT_ACTION_CONFIG);
            
            expect(result.success).toBe(true);
            // Should still process valid items
            expect(result.data?.length).toBeGreaterThan(0);
        });

        it('should handle missing actor data', () => {
            const result = combineActionSources(null as any, DEFAULT_ACTION_CONFIG);
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid actor');
        });
    });

    describe('Configuration Options', () => {
        it('should respect disabled sources in config', () => {
            const config = {
                ...DEFAULT_ACTION_CONFIG,
                includeWeapons: false,
                includeArmor: false
            };
            
            const result = combineActionSources(mockActor, config);
            
            expect(result.success).toBe(true);
            
            if (result.success && result.data) {
                const actions = result.data;
                expect(actions.every(a => a.source !== 'weapon')).toBe(true);
                expect(actions.every(a => a.source !== 'armor')).toBe(true);
                expect(actions.some(a => a.source === 'action')).toBe(true);
            }
        });

        it('should apply custom sorting when configured', () => {
            const config = {
                ...DEFAULT_ACTION_CONFIG,
                sortBy: 'name' as const
            };
            
            const result = combineActionSources(mockActor, config);
            
            expect(result.success).toBe(true);
            
            if (result.success && result.data) {
                const actions = result.data;
                const names = actions.map(a => a.name);
                const sortedNames = [...names].sort();
                expect(names).toEqual(sortedNames);
            }
        });
    });

    describe('Action Button Generation', () => {
        it('should generate correct buttons for weapon items', () => {
            const result = combineActionSources(mockActor, DEFAULT_ACTION_CONFIG);
            
            expect(result.success).toBe(true);
            
            if (result.success && result.data) {
                const weaponAction = result.data.find(a => a.source === 'weapon');
                expect(weaponAction?.buttons.map(b => b.type)).toEqual(['attack', 'damage']);
            }
        });

        it('should generate correct buttons for armor items', () => {
            const result = combineActionSources(mockActor, DEFAULT_ACTION_CONFIG);
            
            expect(result.success).toBe(true);
            
            if (result.success && result.data) {
                const armorAction = result.data.find(a => a.source === 'armor');
                expect(armorAction?.buttons.map(b => b.type)).toEqual(['armor']);
            }
        });

        it('should generate correct buttons for standalone actions', () => {
            const result = combineActionSources(mockActor, DEFAULT_ACTION_CONFIG);
            
            expect(result.success).toBe(true);
            
            if (result.success && result.data) {
                const standaloneAction = result.data.find(a => a.source === 'action');
                expect(standaloneAction?.buttons.map(b => b.type)).toEqual(['use']);
            }
        });
    });
});