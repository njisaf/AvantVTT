/**
 * @fileoverview Unit Tests for Unified Actions Logic
 * @description Tests for pure functions in unified actions system
 * @version 1.0.0
 * @author Avant Development Team
 */

import {
    isGearActionSource,
    getGearActionButtons,
    createGearAction,
    createStandaloneAction,
    combineActionSources,
    DEFAULT_ACTION_CONFIG,
    type CombinedAction,
    type ActionCombinationConfig
} from '../../../scripts/logic/unified-actions.js';

// Mock item structure for testing
interface MockItem {
    id: string;
    name: string;
    type: string;
    system: any;
    uuid: string;
    getFlag: (scope: string, key: string) => any;
    setFlag: (scope: string, key: string, value: any) => Promise<void>;
    update: (data: any) => Promise<void>;
    delete: () => Promise<void>;
}

// Mock actor structure for testing
interface MockActor {
    id: string;
    name: string;
    items: Map<string, MockItem> & {
        values: () => MockItem[];
        find: (predicate: (item: MockItem) => boolean) => MockItem | undefined;
        get: (id: string) => MockItem | undefined;
    };
    createEmbeddedDocuments: (type: string, data: any[]) => Promise<MockItem[]>;
    system: any;
}

// Helper function to create mock items
function createMockItem(id: string, name: string, type: string, system: any = {}): MockItem {
    return {
        id,
        name,
        type,
        system,
        uuid: `Actor.test.Item.${id}`,
        getFlag: jest.fn(),
        setFlag: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    };
}

// Helper function to create mock actor
function createMockActor(id: string, name: string, items: MockItem[] = []): MockActor {
    const itemsMap = new Map<string, MockItem>();
    items.forEach(item => itemsMap.set(item.id, item));
    
    return {
        id,
        name,
        items: Object.assign(itemsMap, {
            values: () => items,
            find: (predicate: (item: MockItem) => boolean) => items.find(predicate),
            get: (id: string) => itemsMap.get(id)
        }),
        createEmbeddedDocuments: jest.fn(),
        system: {
            level: 1,
            abilities: {
                might: { modifier: 0 },
                grace: { modifier: 0 },
                intellect: { modifier: 0 },
                focus: { modifier: 0 }
            }
        }
    };
}

describe('Unified Actions Logic', () => {
    
    describe('isGearActionSource', () => {
        it('should return true for weapon items', () => {
            const weapon = createMockItem('weapon1', 'Sword', 'weapon');
            expect(isGearActionSource(weapon as any)).toBe(true);
        });

        it('should return true for armor items', () => {
            const armor = createMockItem('armor1', 'Chainmail', 'armor');
            expect(isGearActionSource(armor as any)).toBe(true);
        });

        it('should return true for gear items', () => {
            const gear = createMockItem('gear1', 'Rope', 'gear');
            expect(isGearActionSource(gear as any)).toBe(true);
        });

        it('should return false for non-gear items', () => {
            const talent = createMockItem('talent1', 'Fireball', 'talent');
            expect(isGearActionSource(talent as any)).toBe(false);
        });
    });

    describe('getGearActionButtons', () => {
        it('should return attack and damage buttons for weapons', () => {
            const weapon = createMockItem('weapon1', 'Sword', 'weapon');
            expect(getGearActionButtons(weapon as any)).toEqual(['attack', 'damage']);
        });

        it('should return armor button for armor', () => {
            const armor = createMockItem('armor1', 'Chainmail', 'armor');
            expect(getGearActionButtons(armor as any)).toEqual(['armor']);
        });

        it('should return use button for gear', () => {
            const gear = createMockItem('gear1', 'Rope', 'gear');
            expect(getGearActionButtons(gear as any)).toEqual(['use']);
        });

        it('should return empty array for unknown types', () => {
            const unknown = createMockItem('unknown1', 'Unknown', 'unknown');
            expect(getGearActionButtons(unknown as any)).toEqual([]);
        });
    });

    describe('createGearAction', () => {
        const mockActor = createMockActor('actor1', 'Test Actor');
        mockActor.system = {
            level: 5,
            abilities: {
                might: { modifier: 3 },
                grace: { modifier: 2 },
            },
        };

        it('should create gear action for weapon and compute threshold', () => {
            const weapon = createMockItem('weapon1', 'Longsword', 'weapon', {
                damageDie: '1d8',
                ability: 'might',
                expertise: 2,
            });

            const action = createGearAction(weapon as any, mockActor as any);

            expect(action.system.threshold).toBe(21); // 11 + 5 (level) + 3 (might) + 2 (expertise)
            expect(action.name).toBe('Longsword');
            expect(action.source).toBe('weapon');
            expect(action.buttons).toEqual([
                { type: 'attack', total: '+20' },
                { type: 'damage', total: '1d8' }
            ]);
        });

        it('should create gear action for armor and compute threshold', () => {
            const armor = createMockItem('armor1', 'Chainmail', 'armor', {
                armorClass: 3,
                ability: 'grace',
                expertise: 1,
            });

            const action = createGearAction(armor as any, mockActor as any);

            expect(action.system.threshold).toBe(19); // 11 + 5 (level) + 2 (grace) + 1 (expertise)
            expect(action.name).toBe('Chainmail')
            expect(action.source).toBe('armor')
        });

        it('should handle unnamed items', () => {
            const gear = createMockItem('gear1', '', 'gear');
            const action = createGearAction(gear as any, mockActor as any);
            expect(action.name).toBe('Unnamed Item');
        });

        it('should not add threshold to non-weapon/armor gear', () => {
            const gear = createMockItem('gear1', 'Rope', 'gear', { cost: 5 });
            const action = createGearAction(gear as any, mockActor as any);
            expect(action.system.threshold).toBe(undefined);
            expect(action.system.cost).toBe(5);
        });
    });

    describe('createStandaloneAction', () => {
        it('should create standalone action', () => {
            const actionItem = createMockItem('action1', 'Power Strike', 'action', {
                apCost: 2,
                description: 'A powerful strike'
            });

            const action = createStandaloneAction(actionItem as any);

            expect(action).toEqual({
                id: 'action-action1',
                name: 'Power Strike',
                source: 'action',
                sourceItemId: 'action1',
                buttons: [{ type: 'use', total: '' }],
                system: { apCost: 2, description: 'A powerful strike' },
                displayData: actionItem
            });
        });

        it('should handle unnamed actions', () => {
            const actionItem = createMockItem('action1', '', 'action');
            const action = createStandaloneAction(actionItem as any);
            expect(action.name).toBe('Unnamed Action');
        });
    });

    describe('combineActionSources', () => {
        it('should combine gear and standalone actions', () => {
            const weapon = createMockItem('weapon1', 'Sword', 'weapon');
            const armor = createMockItem('armor1', 'Shield', 'armor');
            const gear = createMockItem('gear1', 'Rope', 'gear');
            const action = createMockItem('action1', 'Dodge', 'action');
            
            const actor = createMockActor('actor1', 'Test Actor', [weapon, armor, gear, action]);
            actor.system.level = 1;
            actor.system.abilities.might.mod = 0;

            const result = combineActionSources(actor as any);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(4);
            
            // Check that all items are represented
            const actionIds = result.data!.map(a => a.id);
            expect(actionIds).toContain('gear-weapon1');
            expect(actionIds).toContain('gear-armor1');
            expect(actionIds).toContain('gear-gear1');
            expect(actionIds).toContain('action-action1');
        });

        it('should exclude gear actions when disabled', () => {
            const weapon = createMockItem('weapon1', 'Sword', 'weapon');
            const action = createMockItem('action1', 'Dodge', 'action');
            
            const actor = createMockActor('actor1', 'Test Actor', [weapon, action]);
            
            const config: ActionCombinationConfig = {
                ...DEFAULT_ACTION_CONFIG,
                includeGearActions: false
            };

            const result = combineActionSources(actor as any, config);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data![0].id).toBe('action-action1');
        });

        it('should exclude standalone actions when disabled', () => {
            const weapon = createMockItem('weapon1', 'Sword', 'weapon');
            const action = createMockItem('action1', 'Dodge', 'action');
            
            const actor = createMockActor('actor1', 'Test Actor', [weapon, action]);
            
            const config: ActionCombinationConfig = {
                ...DEFAULT_ACTION_CONFIG,
                includeStandaloneActions: false
            };

            const result = combineActionSources(actor as any, config);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data![0].id).toBe('gear-weapon1');
        });

        it('should sort actions by source type priority', () => {
            const gear = createMockItem('gear1', 'Rope', 'gear');
            const action = createMockItem('action1', 'Dodge', 'action');
            const weapon = createMockItem('weapon1', 'Sword', 'weapon');
            const armor = createMockItem('armor1', 'Shield', 'armor');
            
            const actor = createMockActor('actor1', 'Test Actor', [gear, action, weapon, armor]);

            const result = combineActionSources(actor as any);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(4);
            
            // Check that order is weapon, armor, gear, action
            expect(result.data![0].source).toBe('weapon');
            expect(result.data![1].source).toBe('armor');
            expect(result.data![2].source).toBe('gear');
            expect(result.data![3].source).toBe('action');
        });

        it('should handle empty actor', () => {
            const actor = createMockActor('actor1', 'Test Actor', []);

            const result = combineActionSources(actor as any);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(0);
        });

        it('should handle errors gracefully', () => {
            // Create a mock actor that throws an error
            const badActor = {
                items: {
                    values: () => {
                        throw new Error('Test error');
                    }
                }
            };

            const result = combineActionSources(badActor as any);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Test error');
        });
    });

    describe('DEFAULT_ACTION_CONFIG', () => {
        it('should have correct default values', () => {
            expect(DEFAULT_ACTION_CONFIG).toEqual({
                includeGearActions: true,
                includeStandaloneActions: true,
                preserveOrder: true,
                groupBySource: true
            });
        });
    });
});