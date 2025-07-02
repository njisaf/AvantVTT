/**
 * @fileoverview TraitProvider Integration Tests - Stage 3
 * @version 2.0.0 - Stage 3: CompendiumLocalService Integration
 * @description Integration tests for TraitProvider with CompendiumLocalService seeding functionality
 * @author Avant VTT Team
 */

// @ts-nocheck - Integration tests focus on behavior over strict typing

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TraitProvider } from '../../../scripts/services/trait-provider.ts';
import { CompendiumLocalService } from '../../../scripts/services/compendium-local-service.ts';
import type { Trait, TraitProviderResult } from '../../../scripts/types/domain/trait.js';

// Create mock documents for system pack (seed pack) with proper toObject() method
const createMockDocument = (data: any) => ({
  _id: data._id,
  name: data.name,
  type: data.type,
  system: data.system,
  toObject: jest.fn().mockReturnValue(data)
});

/**
 * Test helper to initialize the TraitProvider and wait for seeding.
 * @returns {Promise<TraitProvider>}
 */
async function initializeTraitProvider(config) {
  const traitProvider = TraitProvider.getInstance(config);
  await traitProvider.initialize();
  // Flush promises to ensure all async operations complete
  await new Promise(resolve => setTimeout(resolve, 0));
  return traitProvider;
}

describe('TraitProvider Integration Tests - Stage 3', () => {
  let traitProvider: TraitProvider;
  let compendiumService: CompendiumLocalService;
  let mockHookCalls: any[];
  
  beforeEach(() => {
    // Reset singleton before each test
    (TraitProvider as any)._instance = undefined;
    
    // Track hook calls
    mockHookCalls = [];
    
    // Mock FoundryVTT environment
    const mockCompendiumPacks = new Map();
    
    const mockSystemTraitData = [
      {
        _id: 'fire-trait',
        name: 'Fire',
        type: 'trait',
        system: {
          color: '#ff4444',
          icon: 'icons/magic/fire/flame-burning-orange.webp',
          localKey: 'TRAIT.Fire',
          description: 'Fire elemental trait'
        }
      },
      {
        _id: 'ice-trait',
        name: 'Ice',
        type: 'trait',
        system: {
          color: '#4444ff',
          icon: 'icons/magic/water/ice-crystal-blue.webp',
          localKey: 'TRAIT.Ice',
          description: 'Ice elemental trait'
        }
      },
      {
        _id: 'tech-trait',
        name: 'Tech',
        type: 'trait',
        system: {
          color: '#44ff44',
          icon: 'icons/tools/scribal/circuit-board.webp',
          localKey: 'TRAIT.Tech',
          description: 'Technology trait'
        }
      }
    ];
    
    const mockSystemTraits = mockSystemTraitData.map(createMockDocument);

    // Mock system pack
    const mockSystemPack = {
      name: 'avant.avant-traits',
      collection: 'avant.avant-traits',
      visible: true,
      getDocuments: jest.fn().mockResolvedValue(mockSystemTraits),
      createDocuments: jest.fn().mockResolvedValue(mockSystemTraits.map(t => createMockDocument(t.toObject())))
    };
    
    // Mock custom pack (initially empty) - use default TraitProvider worldPackName
    let customPackDocs: any[] = [];
    const mockCustomPack = {
      name: 'world.custom-traits',
      collection: 'world.custom-traits',
      visible: true,
      getDocuments: jest.fn().mockImplementation(() => Promise.resolve(customPackDocs)),
      createDocuments: jest.fn().mockImplementation(async (docs, options) => {
        const createdDocs = docs.map(doc => {
          const docData = { ...doc, _id: doc._id || `generated-${Math.random()}` };
          const mockDoc = createMockDocument(docData);
          return mockDoc;
        });
        customPackDocs.push(...createdDocs);
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 0));
        return createdDocs;
      })
    };
    
    // Set up pack map
    mockCompendiumPacks.set('avant.avant-traits', mockSystemPack);
    mockCompendiumPacks.set('world.custom-traits', mockCustomPack);
    
    // Mock game with realistic pack structure
    const mockGame = {
      ready: true,
      system: { id: 'avant' },
      packs: mockCompendiumPacks
    };
    
    // Mock foundry utilities with proper hook support
    const mockFoundry = {
      documents: {
        collections: {
          CompendiumCollection: {
            createCompendium: jest.fn().mockImplementation(async (data: any) => {
              const mockPack = {
                name: data.name,
                label: data.label,
                type: data.type,
                getDocuments: jest.fn().mockResolvedValue([])
              };
              mockCompendiumPacks.set(data.name, mockPack);
              return mockPack;
            })
          }
        }
      },
      utils: {
        hooks: {
          call: jest.fn().mockImplementation((hookName, data) => {
            mockHookCalls.push({ hookName, data });
          })
        }
      }
    };
    
    // Mock Hooks for alternative hook calling
    const mockHooks = {
      call: jest.fn().mockImplementation((hookName, data) => {
        mockHookCalls.push({ hookName, data });
      }),
      callAll: jest.fn().mockImplementation((hookName, data) => {
        mockHookCalls.push({ hookName, data });
      })
    };
    
    // Set up global mocks
    Object.defineProperty(globalThis, 'game', {
      value: mockGame,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(globalThis, 'foundry', {
      value: mockFoundry,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(globalThis, 'Hooks', {
      value: mockHooks,
      writable: true,
      configurable: true
    });
  });
  
  afterEach(() => {
    // Clean up globals
    ['game', 'foundry', 'Hooks'].forEach(prop => {
      if (prop in globalThis) {
        Object.defineProperty(globalThis, prop, { value: undefined, configurable: true });
      }
    });
    jest.restoreAllMocks();
  });

  describe('Service Integration', () => {
    test('should create TraitProvider with CompendiumLocalService', () => {
      traitProvider = TraitProvider.getInstance();
      
      expect(traitProvider).toBeInstanceOf(TraitProvider);
      expect((traitProvider as any).compendiumService).toBeInstanceOf(CompendiumLocalService);
    });

    test('should use consistent configuration between services', () => {
      const config = {
        systemPackName: 'custom.system-traits',
        worldPackName: 'custom.world-traits'
      };
      
      traitProvider = TraitProvider.getInstance(config);
      
      expect((traitProvider as any).config.systemPackName).toBe('custom.system-traits');
      expect((traitProvider as any).config.worldPackName).toBe('custom.world-traits');
    });
  });

  describe('Trait Seeding Functionality', () => {
    test('should seed missing traits from system pack to custom pack on initialization', async () => {
      traitProvider = await initializeTraitProvider();
      
      const result = await traitProvider.getPackInfo();
      expect(result.success).toBe(true);
      
      const customPack = result.data?.world.collection;
      const customDocs = await customPack.getDocuments();
      expect(customDocs.length).toBe(3);
    });

    test('should emit avantTraitSeeded hook when traits are copied', async () => {
      traitProvider = await initializeTraitProvider();
      
      const seedHook = mockHookCalls.find(call => call.hookName === 'avantTraitSeeded');
      
      expect(seedHook).toBeDefined();
      expect(seedHook.data).toEqual({
        copied: 3,
        targetPack: 'world.custom-traits'
      });
    });

    test('should not seed traits if custom pack already has all system traits', async () => {
      // Pre-populate custom pack with system traits
      const existingTraitData = [
        {
          _id: 'fire-trait-custom',
          name: 'Fire',
          type: 'trait',
          system: {
            color: '#ff4444',
            icon: 'icons/magic/fire/flame-burning-orange.webp',
            description: 'Fire elemental trait'
          }
        },
        {
          _id: 'ice-trait-custom',
          name: 'Ice',
          type: 'trait',
          system: {
            color: '#4444ff',
            icon: 'icons/magic/water/ice-crystal-blue.webp',
            description: 'Ice elemental trait'
          }
        },
        {
          _id: 'tech-trait-custom',
          name: 'Tech',
          type: 'trait',
          system: {
            color: '#44ff44',
            icon: 'icons/tools/scribal/circuit-board.webp',
            description: 'Technology trait'
          }
        }
      ];
      
      const mockCustomPackWithTraits = (globalThis as any).game.packs.get('world.custom-traits');
      mockCustomPackWithTraits.getDocuments.mockResolvedValue(
        existingTraitData.map(createMockDocument)
      );
      
      traitProvider = await initializeTraitProvider();
      
      const result = await traitProvider.getPackInfo();
      
      expect(result.success).toBe(true);
      
      // No seeding hook should be called
      const seedHook = mockHookCalls.find(call => call.hookName === 'avantTraitSeeded');
      expect(seedHook).toBeUndefined();
    });

    test('should handle partial seeding when some traits already exist', async () => {
      // Pre-populate custom pack with only one trait
      const partialTraitData = [{
        _id: 'fire-trait-existing',
        name: 'Fire',
        type: 'trait',
        system: {
          color: '#ff4444',
          icon: 'icons/magic/fire/flame-burning-orange.webp',
          description: 'Fire elemental trait'
        }
      }];
      
      const mockCustomPackPartial = (globalThis as any).game.packs.get('world.custom-traits');
      mockCustomPackPartial.getDocuments.mockResolvedValue(
        partialTraitData.map(createMockDocument)
      );
      
      traitProvider = await initializeTraitProvider();

      const updatedInfo = await traitProvider.getPackInfo();
      const customPack = updatedInfo.data?.world.collection;
      const customDocs = await customPack.getDocuments();
      expect(customDocs.length).toBe(3); // Should now have original + 2 seeded
    });

    test('should continue initialization even if seeding fails', async () => {
      // Mock CompendiumLocalService to throw error during seeding
      const originalLoadPack = CompendiumLocalService.prototype.loadPack;
      CompendiumLocalService.prototype.loadPack = jest.fn()
        .mockRejectedValueOnce(new Error('System pack not accessible'))
        .mockResolvedValue([]); // Second call for custom pack
      
      traitProvider = await initializeTraitProvider();
      
      const result = await traitProvider.getPackInfo();
      expect(result.success).toBe(true);
      
      // Restore original method
      (CompendiumLocalService.prototype.loadPack as jest.Mock).mockRestore();
    });
  });

  describe('Pack Loading Integration', () => {
    beforeEach(async () => {
      traitProvider = await initializeTraitProvider();
    });

    test('should load traits using CompendiumLocalService', async () => {
      const allTraits = await traitProvider.getAll({ forceRefresh: true });
      
      expect(allTraits.success).toBe(true);
      expect(allTraits.data).toBeDefined();
      expect(allTraits.data!.length).toBeGreaterThan(0);
      
      // Should contain traits from both system and custom packs
      const traitNames = allTraits.data!.map(t => t.name);
      expect(traitNames).toContain('Fire');
      expect(traitNames).toContain('Ice');
      expect(traitNames).toContain('Tech');
    });

    test('should handle missing system pack gracefully', async () => {
      // Remove system pack
      (globalThis as any).game.packs.delete('avant.avant-traits');
      
      const result = await traitProvider.initialize();
      
      expect(result.success).toBe(true);
      expect(result.metadata?.traitsSeeded).toBe(0);
    });

    test('should create custom pack if it does not exist', async () => {
      // Remove custom pack
      (globalThis as any).game.packs.delete('world.custom-traits');
      
      const result = await traitProvider.initialize();
      
      expect(result.success).toBe(true);
      
      // Verify pack creation was called
      const foundry = (globalThis as any).foundry;
      expect(foundry.documents.collections.CompendiumCollection.createCompendium)
        .toHaveBeenCalledWith(expect.objectContaining({
          name: 'world.custom-traits',
          label: 'Custom Traits',
          type: 'Item'
        }));
    });
  });

  describe('Hook Emission', () => {
    beforeEach(async () => {
      traitProvider = await initializeTraitProvider();
    });

    test('should emit avantTraitRegistered hooks for initialized traits', async () => {
      // Find trait registered hooks
      const registeredHooks = mockHookCalls.filter(call => call.hookName === 'avantTraitRegistered');
      
      expect(registeredHooks.length).toBeGreaterThan(0);
      
      // All should be 'initialized' action
      registeredHooks.forEach(hook => {
        expect(hook.data.action).toBe('initialized');
        expect(hook.data.trait).toBeDefined();
        expect(hook.data.source).toMatch(/^(system|world)$/);
        expect(hook.data.timestamp).toBeDefined();
      });
    });

    test('should emit avantCompendiumDiffed hook during seeding', async () => {
      // Find compendium diffed hook
      const diffHook = mockHookCalls.find(call => call.hookName === 'avantCompendiumDiffed');
      
      expect(diffHook).toBeDefined();
      expect(diffHook.data.srcId).toBe('avant.avant-traits');
      expect(diffHook.data.destId).toBe('world.custom-traits');
      expect(diffHook.data.diff).toBeDefined();
    });

    test('should emit avantCompendiumCopied hook during seeding', async () => {
      // Find compendium copied hook
      const copyHook = mockHookCalls.find(call => call.hookName === 'avantCompendiumCopied');
      
      expect(copyHook).toBeDefined();
      expect(copyHook.data.srcId).toBe('avant.avant-traits');
      expect(copyHook.data.destId).toBe('world.custom-traits');
      expect(copyHook.data.docsCopied).toBe(3);
      expect(copyHook.data.copiedNames).toEqual(['Fire', 'Ice', 'Tech']);
    });
  });

  describe('Public API Compatibility', () => {
    test('should maintain all existing public methods', async () => {
      traitProvider = TraitProvider.getInstance();
      await traitProvider.initialize();
      
      // Verify all public methods exist and are callable
      expect(typeof traitProvider.getAll).toBe('function');
      expect(typeof traitProvider.get).toBe('function');
      expect(typeof traitProvider.isReady).toBe('function');
      expect(typeof traitProvider.clearCache).toBe('function');
      expect(typeof traitProvider.search).toBe('function');
      expect(typeof traitProvider.createTrait).toBe('function');
      expect(typeof traitProvider.updateTrait).toBe('function');
      expect(typeof traitProvider.deleteTrait).toBe('function');
      
      // Test key methods work correctly
      expect(traitProvider.isReady()).toBe(true);
      
      const searchResult = await traitProvider.search('Fire');
      expect(searchResult.success).toBe(true);
      
      const getResult = await traitProvider.get('fire-trait');
      expect(getResult.success).toBe(true);
    });

    test('should return proper TraitProviderResult structure', async () => {
      traitProvider = TraitProvider.getInstance();
      await traitProvider.initialize();
      
      const result = await traitProvider.getAll();
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Performance and Error Handling', () => {
    test('should complete initialization within reasonable time', async () => {
      const startTime = Date.now();
      
      traitProvider = TraitProvider.getInstance();
      await traitProvider.initialize();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 5 seconds (integration test requirement)
      expect(duration).toBeLessThan(5000);
    });

    test('should handle invalid system pack configuration gracefully', async () => {
      const config = {
        systemPackName: 'invalid.pack.name',
        worldPackName: 'custom-traits'
      };
      
      traitProvider = TraitProvider.getInstance(config);
      
      const result = await traitProvider.initialize();
      
      // Should still succeed even with invalid system pack
      expect(result.success).toBe(true);
      expect(result.metadata?.traitsSeeded).toBe(0);
    });

    test('should handle CompendiumLocalService errors gracefully', async () => {
      // Mock service to throw errors
      const errorService = {
        loadPack: jest.fn().mockRejectedValue(new Error('Service unavailable')),
        diffLocalPacks: jest.fn().mockRejectedValue(new Error('Diff failed')),
        copyDocs: jest.fn().mockRejectedValue(new Error('Copy failed'))
      };
      
      traitProvider = TraitProvider.getInstance();
      (traitProvider as any).compendiumService = errorService;
      
      const result = await traitProvider.initialize();
      
      // Should handle errors gracefully and still succeed
      expect(result.success).toBe(true);
    });
  });
}); 