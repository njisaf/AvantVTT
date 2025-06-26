/**
 * @fileoverview Integration Tests for CompendiumLocalService
 * @description Tests for CompendiumLocalService with mocked FoundryVTT environment
 * @version 2.0.0
 * @author Avant Development Team
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CompendiumLocalService, CompendiumDocument, CopyDocsOptions } from '../../../scripts/services/compendium-local-service';
import { DiffResult } from '../../../scripts/logic/compendium/diffPacks';

// Mock document class for testing
class MockDocument {
    constructor(public data: any) {}
    
    toObject() {
        return { ...this.data };
    }
    
    static async createDocuments(data: any[], options: any) {
        // Mock document creation
        return data.map(d => new MockDocument(d));
    }
}

// Mock compendium pack for testing
class MockPack {
    constructor(
        public id: string,
        public documents: MockDocument[] = [],
        public documentClass = MockDocument
    ) {}
    
    async getDocuments() {
        return this.documents;
    }
    
    get collection() {
        return this.id;
    }
}

describe('CompendiumLocalService Integration Tests', () => {
    let service: CompendiumLocalService;
    let originalGame: any;
    let originalHooks: any;
    let mockGame: any;
    let mockHooks: any;
    let hooksCalled: Array<{ hook: string; data: any }>;

    beforeEach(() => {
        // Save original global state
        originalGame = (globalThis as any).game;
        originalHooks = (globalThis as any).Hooks;
        
        // Clear any existing mocks
        jest.clearAllMocks();
        
        // Reset hooks tracking
        hooksCalled = [];
        
        // Create mock hooks system
        mockHooks = {
            callAll: jest.fn((hookName: string, data: any) => {
                hooksCalled.push({ hook: hookName, data });
            })
        };
        
        // Create mock game with packs
        const pack1Documents = [
            new MockDocument({ _id: '1', name: 'Sword', damage: '1d8', type: 'weapon' }),
            new MockDocument({ _id: '2', name: 'Shield', defense: 2, type: 'armor' }),
            new MockDocument({ _id: '3', name: 'Potion', healing: 10, type: 'consumable' })
        ];
        
        const pack2Documents = [
            new MockDocument({ _id: '4', name: 'Bow', damage: '1d6', type: 'weapon' }),
            new MockDocument({ _id: '5', name: 'Helmet', defense: 1, type: 'armor' })
        ];
        
        const pack3Documents = [
            new MockDocument({ _id: '6', name: 'Sword', damage: '1d10', type: 'weapon' }), // Changed damage
            new MockDocument({ _id: '7', name: 'Shield', defense: 2, type: 'armor' }), // Same
            new MockDocument({ _id: '8', name: 'Staff', damage: '1d6', type: 'weapon' }) // New
        ];
        
        const emptyPackDocuments: MockDocument[] = [];
        
        const packs = new Map([
            ['world.pack1', new MockPack('world.pack1', pack1Documents)],
            ['world.pack2', new MockPack('world.pack2', pack2Documents)],
            ['world.pack3', new MockPack('world.pack3', pack3Documents)],
            ['world.empty', new MockPack('world.empty', emptyPackDocuments)]
        ]);
        
        mockGame = {
            packs
        };
        
        // Set global mocks
        (globalThis as any).game = mockGame;
        (globalThis as any).Hooks = mockHooks;
        
        // Create fresh service instance
        service = new CompendiumLocalService();
    });

    afterEach(() => {
        // Restore original global state
        (globalThis as any).game = originalGame;
        (globalThis as any).Hooks = originalHooks;
        
        // Reset service
        service.reset();
    });

    describe('Service Initialization', () => {
        test('should initialize automatically on first use', async () => {
            expect(service.isInitialized()).toBe(false);
            
            await service.loadPack('world.pack1');
            
            expect(service.isInitialized()).toBe(true);
        });

        test('should throw error if game is not available', async () => {
            (globalThis as any).game = null;
            
            await expect(service.loadPack('world.pack1'))
                .rejects.toThrow('FoundryVTT game not available');
        });

        test('should throw error if packs are not available', async () => {
            (globalThis as any).game = {};
            
            await expect(service.loadPack('world.pack1'))
                .rejects.toThrow('FoundryVTT compendium packs not available');
        });
    });

    describe('loadPack method', () => {
        test('should load documents from existing pack', async () => {
            const docs = await service.loadPack('world.pack1');
            
            expect(docs).toHaveLength(3);
            expect(docs[0]).toEqual({
                _id: '1',
                name: 'Sword',
                damage: '1d8',
                type: 'weapon'
            });
            expect(docs[1]).toEqual({
                _id: '2',
                name: 'Shield',
                defense: 2,
                type: 'armor'
            });
            expect(docs[2]).toEqual({
                _id: '3',
                name: 'Potion',
                healing: 10,
                type: 'consumable'
            });
        });

        test('should load empty pack successfully', async () => {
            const docs = await service.loadPack('world.empty');
            
            expect(docs).toHaveLength(0);
            expect(docs).toEqual([]);
        });

        test('should throw error for non-existent pack', async () => {
            await expect(service.loadPack('world.nonexistent'))
                .rejects.toThrow('Compendium pack \'world.nonexistent\' not found');
        });

        test('should validate pack ID parameter', async () => {
            await expect(service.loadPack(''))
                .rejects.toThrow('Invalid pack ID');
            
            await expect(service.loadPack(null as any))
                .rejects.toThrow('Invalid pack ID');
        });

        test('should handle documents without names', async () => {
            // Add pack with unnamed document
            const unnamedDoc = new MockDocument({ _id: '999', type: 'mystery' }); // No name
            const packWithUnnamed = new MockPack('world.unnamed', [unnamedDoc]);
            mockGame.packs.set('world.unnamed', packWithUnnamed);
            
            const docs = await service.loadPack('world.unnamed');
            
            expect(docs).toHaveLength(1);
            expect(docs[0].name).toBe('Unnamed-999');
        });
    });

    describe('diffLocalPacks method', () => {
        test('should identify added, removed, and changed documents', async () => {
            const diff = await service.diffLocalPacks('world.pack1', 'world.pack3');
            
            // pack1: Sword(1d8), Shield(2), Potion(10)
            // pack3: Sword(1d10), Shield(2), Staff(1d6)
            // Expected: added=[Staff], removed=[Potion], changed=[Sword]
            
            expect(diff.added).toHaveLength(1);
            expect(diff.added[0].name).toBe('Staff');
            
            expect(diff.removed).toHaveLength(1);
            expect(diff.removed[0].name).toBe('Potion');
            
            expect(diff.changed).toHaveLength(1);
            expect(diff.changed[0].local.name).toBe('Sword');
            expect(diff.changed[0].remote.name).toBe('Sword');
            expect(diff.changed[0].local.damage).toBe('1d8');
            expect(diff.changed[0].remote.damage).toBe('1d10');
        });

        test('should handle identical packs', async () => {
            // Create identical pack
            const identicalDocs = [
                new MockDocument({ _id: '10', name: 'Sword', damage: '1d8', type: 'weapon' }),
                new MockDocument({ _id: '11', name: 'Shield', defense: 2, type: 'armor' })
            ];
            const identicalPack = new MockPack('world.identical', identicalDocs);
            mockGame.packs.set('world.identical', identicalPack);
            
            const diff = await service.diffLocalPacks('world.pack2', 'world.identical');
            
            // pack2: Bow(1d6), Helmet(1)
            // identical: Sword(1d8), Shield(2)
            // Should find differences since they're different packs
            expect(diff.added).toHaveLength(2); // Sword, Shield added
            expect(diff.removed).toHaveLength(2); // Bow, Helmet removed
            expect(diff.changed).toHaveLength(0);
        });

        test('should emit hook with diff results', async () => {
            const diff = await service.diffLocalPacks('world.pack1', 'world.pack2');
            
            expect(hooksCalled).toHaveLength(1);
            expect(hooksCalled[0].hook).toBe('avantCompendiumDiffed');
            expect(hooksCalled[0].data).toEqual({
                srcId: 'world.pack1',
                destId: 'world.pack2',
                diff,
                totalDifferences: diff.added.length + diff.removed.length + diff.changed.length
            });
        });

        test('should validate pack IDs', async () => {
            await expect(service.diffLocalPacks('', 'world.pack1'))
                .rejects.toThrow('Both source and destination pack IDs are required');
            
            await expect(service.diffLocalPacks('world.pack1', ''))
                .rejects.toThrow('Both source and destination pack IDs are required');
            
            await expect(service.diffLocalPacks('world.pack1', 'world.pack1'))
                .rejects.toThrow('Source and destination pack IDs cannot be the same');
        });

        test('should handle empty packs in comparison', async () => {
            const diff = await service.diffLocalPacks('world.empty', 'world.pack1');
            
            expect(diff.added).toHaveLength(3); // All from pack1
            expect(diff.removed).toHaveLength(0);
            expect(diff.changed).toHaveLength(0);
        });
    });

    describe('copyDocs method', () => {
        test('should copy all documents without filter', async () => {
            await service.copyDocs('world.pack1', 'world.pack2');
            
            expect(hooksCalled).toHaveLength(1);
            expect(hooksCalled[0].hook).toBe('avantCompendiumCopied');
            expect(hooksCalled[0].data).toEqual({
                srcId: 'world.pack1',
                destId: 'world.pack2',
                docsCopied: 3,
                copiedNames: ['Sword', 'Shield', 'Potion']
            });
            
            // Operation success verified by hook data above
        });

        test('should copy filtered documents', async () => {
            const filter = (doc: CompendiumDocument) => doc.type === 'weapon';
            
            await service.copyDocs('world.pack1', 'world.pack2', { filter });
            
            expect(hooksCalled).toHaveLength(1);
            expect(hooksCalled[0].data.docsCopied).toBe(1);
            expect(hooksCalled[0].data.copiedNames).toEqual(['Sword']);
        });

        test('should handle no documents matching filter', async () => {
            const filter = (doc: CompendiumDocument) => doc.type === 'nonexistent';
            
            await service.copyDocs('world.pack1', 'world.pack2', { filter });
            
            expect(hooksCalled).toHaveLength(1);
            expect(hooksCalled[0].data.docsCopied).toBe(0);
            expect(hooksCalled[0].data.copiedNames).toEqual([]);
        });

        test('should preserve IDs when requested', async () => {
            const createSpy = jest.spyOn(MockDocument, 'createDocuments');
            
            await service.copyDocs('world.pack1', 'world.pack2', { preserveIds: true });
            
            const callArgs = createSpy.mock.calls[0][0];
            expect(callArgs[0]).toHaveProperty('_id', '1');
            expect(callArgs[1]).toHaveProperty('_id', '2');
            expect(callArgs[2]).toHaveProperty('_id', '3');
        });

        test('should remove IDs by default', async () => {
            const createSpy = jest.spyOn(MockDocument, 'createDocuments');
            
            await service.copyDocs('world.pack1', 'world.pack2');
            
            const callArgs = createSpy.mock.calls[0][0];
            expect(callArgs[0]).not.toHaveProperty('_id');
            expect(callArgs[1]).not.toHaveProperty('_id');
            expect(callArgs[2]).not.toHaveProperty('_id');
        });

        test('should validate pack IDs', async () => {
            await expect(service.copyDocs('', 'world.pack1'))
                .rejects.toThrow('Both source and destination pack IDs are required');
            
            await expect(service.copyDocs('world.pack1', ''))
                .rejects.toThrow('Both source and destination pack IDs are required');
            
            await expect(service.copyDocs('world.pack1', 'world.pack1'))
                .rejects.toThrow('Cannot copy documents to the same pack');
        });

        test('should handle non-existent destination pack', async () => {
            await expect(service.copyDocs('world.pack1', 'world.nonexistent'))
                .rejects.toThrow('Destination pack \'world.nonexistent\' not found');
        });
    });

    describe('Error Handling', () => {
        test('should handle pack loading errors gracefully', async () => {
            // Mock pack that throws error
            const errorPack = {
                getDocuments: jest.fn().mockRejectedValue(new Error('Network error'))
            };
            mockGame.packs.set('world.error', errorPack);
            
            await expect(service.loadPack('world.error'))
                .rejects.toThrow('Failed to load documents from pack \'world.error\': Network error');
        });

        test('should handle document creation errors', async () => {
            // Mock createDocuments to throw error
            const createError = new Error('Creation failed');
            const createSpy = jest.spyOn(MockDocument, 'createDocuments' as any) as jest.MockedFunction<any>;
            createSpy.mockRejectedValue(createError);
            
            await expect(service.copyDocs('world.pack1', 'world.pack2'))
                .rejects.toThrow('Failed to copy documents from \'world.pack1\' to \'world.pack2\': Creation failed');
            
            // Clean up
            createSpy.mockRestore();
        });
    });

    describe('Performance', () => {
        test('should complete operations within time limits', async () => {
            const startTime = Date.now();
            
            // Perform multiple operations
            await service.loadPack('world.pack1');
            await service.loadPack('world.pack2');
            await service.diffLocalPacks('world.pack1', 'world.pack2');
            await service.copyDocs('world.pack1', 'world.empty');
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Should complete well under 5 seconds
            expect(duration).toBeLessThan(1000); // 1 second for mocked operations
        });
    });

    describe('Service State Management', () => {
        test('should track initialization state correctly', () => {
            expect(service.isInitialized()).toBe(false);
            
            service.reset();
            expect(service.isInitialized()).toBe(false);
        });

        test('should reinitialize after reset', async () => {
            await service.loadPack('world.pack1');
            expect(service.isInitialized()).toBe(true);
            
            service.reset();
            expect(service.isInitialized()).toBe(false);
            
            await service.loadPack('world.pack2');
            expect(service.isInitialized()).toBe(true);
        });
    });
}); 