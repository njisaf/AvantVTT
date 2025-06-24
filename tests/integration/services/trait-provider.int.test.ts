/**
 * @fileoverview TraitProvider Integration Tests
 * @version 2.0.0 - Stage 4: Stability Focus
 * @description Integration tests for the TraitProvider service using Foundry shim
 * @author Avant VTT Team
 */

// @ts-nocheck - Integration tests focus on behavior over strict typing

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TraitProvider } from '../../../scripts/services/trait-provider.ts';
import type { Trait, TraitProviderResult } from '../../../scripts/types/domain/trait.js';

describe('TraitProvider Integration Tests', () => {
  let traitProvider: TraitProvider;
  
  beforeEach(() => {
    // Reset singleton before each test
    (TraitProvider as any)._instance = undefined;
    
    // Mock FoundryVTT environment
    const mockCompendiumPacks = new Map();
    
    // Mock game with realistic pack structure
    const mockGame = {
      ready: true,
      system: { id: 'avant' },
      packs: mockCompendiumPacks
    };
    
    // Mock foundry utilities with proper typing
    const mockFoundry = {
      documents: {
        collections: {
          CompendiumCollection: {
            createCompendium: jest.fn().mockImplementation(async (data: any) => {
              // Simulate pack creation by adding to game.packs
              const mockPack = {
                name: data.name,
                label: data.label,
                type: data.type,
                getDocuments: jest.fn().mockResolvedValue([] as any[])
              };
              mockCompendiumPacks.set(data.name, mockPack);
              return mockPack;
            })
          }
        }
      }
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
  });
  
  afterEach(() => {
    // Clean up globals
    if ('game' in globalThis) {
      Object.defineProperty(globalThis, 'game', { value: undefined, configurable: true });
    }
    if ('foundry' in globalThis) {
      Object.defineProperty(globalThis, 'foundry', { value: undefined, configurable: true });
    }
  });
  
  describe('World Pack Auto-Creation', () => {
    test('should automatically create world pack when missing', async () => {
      // Setup: No world pack exists
      const game = (globalThis as any).game;
      const foundry = (globalThis as any).foundry;
      
      traitProvider = TraitProvider.getInstance();
      
      // Execute: Initialize provider
      const result = await traitProvider.initialize();
      
      // Verify: Initialization succeeded
      expect(result.success).toBe(true);
      
      // Verify: createCompendium was called with correct parameters
      expect(foundry.documents.collections.CompendiumCollection.createCompendium).toHaveBeenCalledWith({
        name: 'custom-traits',
        label: 'Custom Traits',
        path: './packs/custom-traits.db',
        type: 'Item',
        system: 'avant'
      });
      
      // Verify: World pack now exists in game.packs
      expect(game.packs.has('custom-traits')).toBe(true);
      
      // Verify: Provider reports pack info correctly
      const packInfo = await traitProvider.getPackInfo();
      expect(packInfo.success).toBe(true);
      expect(packInfo.data?.world.exists).toBe(true);
      expect(packInfo.data?.world.name).toBe('custom-traits');
    });
    
    test('should skip creation if world pack already exists', async () => {
      // Setup: World pack already exists
      const game = (globalThis as any).game;
      const foundry = (globalThis as any).foundry;
      
      const existingWorldPack = {
        name: 'custom-traits',
        label: 'Custom Traits',
        getDocuments: jest.fn().mockResolvedValue([])
      };
      game.packs.set('custom-traits', existingWorldPack);
      
      traitProvider = TraitProvider.getInstance();
      
      // Execute: Initialize provider
      const result = await traitProvider.initialize();
      
      // Verify: Initialization succeeded
      expect(result.success).toBe(true);
      
      // Verify: createCompendium was NOT called
      expect(foundry.documents.collections.CompendiumCollection.createCompendium).not.toHaveBeenCalled();
      
      // Verify: Original pack is still there
      expect(game.packs.get('custom-traits')).toBe(existingWorldPack);
    });
    
    test('should handle pack creation errors gracefully', async () => {
      // Setup: createCompendium fails
      const foundry = (globalThis as any).foundry;
      foundry.documents.collections.CompendiumCollection.createCompendium.mockRejectedValueOnce(
        new Error('Permission denied: Cannot create compendium pack')
      );
      
      traitProvider = TraitProvider.getInstance();
      
      // Execute: Initialize provider
      const result = await traitProvider.initialize();
      
      // Verify: Initialization failed gracefully
      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });
  
  describe('World Overrides System Deduplication', () => {
    test('should prefer world traits over system traits with same ID', async () => {
      // Setup: Both system and world packs with conflicting trait IDs
      const game = (globalThis as any).game;
      
      const systemTraitItem = {
        _id: 'fire-trait',
        name: 'Fire (System)',
        type: 'feature',
        system: {
          color: '#FF0000',
          icon: 'fas fa-fire',
          localKey: 'AVANT.Trait.Fire',
          description: 'System fire trait'
        }
      };
      
      const worldTraitItem = {
        _id: 'fire-trait', // Same ID as system trait
        name: 'Fire (World Override)',
        type: 'feature',
        system: {
          color: '#FF6B6B',
          icon: 'fas fa-flame',
          localKey: 'AVANT.Trait.Fire',
          description: 'World fire trait override'
        }
      };
      
      // Mock system pack
      const systemPack = {
        name: 'avant.avant-traits',
        getDocuments: jest.fn().mockResolvedValue([systemTraitItem])
      };
      game.packs.set('avant.avant-traits', systemPack);
      
      // Mock world pack
      const worldPack = {
        name: 'custom-traits',
        getDocuments: jest.fn().mockResolvedValue([worldTraitItem])
      };
      game.packs.set('custom-traits', worldPack);
      
      traitProvider = TraitProvider.getInstance();
      await traitProvider.initialize();
      
      // Execute: Get all traits
      const result = await traitProvider.getAll();
      
      // Verify: Only one trait returned (world override)
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      
      // Verify: World trait is returned, not system trait
      const trait = result.data![0];
      expect(trait.id).toBe('fire-trait');
      expect(trait.name).toBe('Fire (World Override)');
      expect(trait.source).toBe('world');
      expect(trait.color).toBe('#FF6B6B');
      expect(trait.icon).toBe('fas fa-flame');
    });
    
    test('should merge system and world traits when IDs are different', async () => {
      // Setup: System and world packs with different trait IDs
      const game = (globalThis as any).game;
      
      const systemTraitItem = {
        _id: 'system-fire',
        name: 'Fire',
        type: 'feature',
        system: {
          color: '#FF0000',
          icon: 'fas fa-fire',
          localKey: 'AVANT.Trait.Fire'
        }
      };
      
      const worldTraitItem = {
        _id: 'world-ice',
        name: 'Ice',
        type: 'feature',
        system: {
          color: '#00FFFF',
          icon: 'fas fa-snowflake',
          localKey: 'AVANT.Trait.Ice'
        }
      };
      
      // Mock system pack
      const systemPack = {
        name: 'avant.avant-traits',
        getDocuments: jest.fn().mockResolvedValue([systemTraitItem])
      };
      game.packs.set('avant.avant-traits', systemPack);
      
      // Mock world pack
      const worldPack = {
        name: 'custom-traits',
        getDocuments: jest.fn().mockResolvedValue([worldTraitItem])
      };
      game.packs.set('custom-traits', worldPack);
      
      traitProvider = TraitProvider.getInstance();
      await traitProvider.initialize();
      
      // Execute: Get all traits
      const result = await traitProvider.getAll();
      
      // Verify: Both traits returned
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      
      // Verify: System trait is present
      const systemTrait = result.data!.find(t => t.source === 'system');
      expect(systemTrait).toBeDefined();
      expect(systemTrait!.name).toBe('Fire');
      expect(systemTrait!.id).toBe('system-fire');
      
      // Verify: World trait is present
      const worldTrait = result.data!.find(t => t.source === 'world');
      expect(worldTrait).toBeDefined();
      expect(worldTrait!.name).toBe('Ice');
      expect(worldTrait!.id).toBe('world-ice');
    });
    
    test('should handle multiple trait overrides correctly', async () => {
      // Setup: Multiple conflicting traits between system and world
      const game = (globalThis as any).game;
      
      const systemTraits = [
        {
          _id: 'trait-1',
          name: 'Trait 1 (System)',
          type: 'feature',
          system: { color: '#FF0000', icon: 'fas fa-1', localKey: 'AVANT.Trait.1' }
        },
        {
          _id: 'trait-2',
          name: 'Trait 2 (System)',
          type: 'feature',
          system: { color: '#00FF00', icon: 'fas fa-2', localKey: 'AVANT.Trait.2' }
        },
        {
          _id: 'trait-3',
          name: 'Trait 3 (System Only)',
          type: 'feature',
          system: { color: '#0000FF', icon: 'fas fa-3', localKey: 'AVANT.Trait.3' }
        }
      ];
      
      const worldTraits = [
        {
          _id: 'trait-1', // Override trait-1
          name: 'Trait 1 (World Override)',
          type: 'feature',
          system: { color: '#FF6B6B', icon: 'fas fa-1-world', localKey: 'AVANT.Trait.1' }
        },
        {
          _id: 'trait-2', // Override trait-2
          name: 'Trait 2 (World Override)',
          type: 'feature',
          system: { color: '#6BFF6B', icon: 'fas fa-2-world', localKey: 'AVANT.Trait.2' }
        },
        {
          _id: 'trait-4', // New world-only trait
          name: 'Trait 4 (World Only)',
          type: 'feature',
          system: { color: '#FFFF00', icon: 'fas fa-4', localKey: 'AVANT.Trait.4' }
        }
      ];
      
      // Mock packs
      game.packs.set('avant.avant-traits', {
        getDocuments: jest.fn().mockResolvedValue(systemTraits)
      });
      game.packs.set('custom-traits', {
        getDocuments: jest.fn().mockResolvedValue(worldTraits)
      });
      
      traitProvider = TraitProvider.getInstance();
      await traitProvider.initialize();
      
      // Execute: Get all traits
      const result = await traitProvider.getAll();
      
      // Verify: Correct number of traits (4 total: 2 overrides + 1 system-only + 1 world-only)
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(4);
      
      // Verify: trait-1 comes from world (override)
      const trait1 = result.data!.find(t => t.id === 'trait-1');
      expect(trait1!.name).toBe('Trait 1 (World Override)');
      expect(trait1!.source).toBe('world');
      
      // Verify: trait-2 comes from world (override)
      const trait2 = result.data!.find(t => t.id === 'trait-2');
      expect(trait2!.name).toBe('Trait 2 (World Override)');
      expect(trait2!.source).toBe('world');
      
      // Verify: trait-3 comes from system (no override)
      const trait3 = result.data!.find(t => t.id === 'trait-3');
      expect(trait3!.name).toBe('Trait 3 (System Only)');
      expect(trait3!.source).toBe('system');
      
      // Verify: trait-4 comes from world (world-only)
      const trait4 = result.data!.find(t => t.id === 'trait-4');
      expect(trait4!.name).toBe('Trait 4 (World Only)');
      expect(trait4!.source).toBe('world');
    });
  });
  
  describe('Error Recovery', () => {
    test('should handle corrupted world pack gracefully', async () => {
      // Setup: World pack with invalid data
      const game = (globalThis as any).game;
      
      const worldPack = {
        name: 'custom-traits',
        getDocuments: jest.fn().mockRejectedValue(new Error('Database corrupted'))
      };
      game.packs.set('custom-traits', worldPack);
      
      const systemPack = {
        name: 'avant.avant-traits',
        getDocuments: jest.fn().mockResolvedValue([{
          _id: 'fire',
          name: 'Fire',
          type: 'feature',
          system: { color: '#FF0000', icon: 'fas fa-fire', localKey: 'AVANT.Trait.Fire' }
        }])
      };
      game.packs.set('avant.avant-traits', systemPack);
      
      traitProvider = TraitProvider.getInstance();
      await traitProvider.initialize();
      
      // Execute: Get all traits (should still work with system pack)
      const result = await traitProvider.getAll();
      
      // Verify: Initialization failed but provider is still functional for system pack
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database corrupted');
    });
  });
}); 