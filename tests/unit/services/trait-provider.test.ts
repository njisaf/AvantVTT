/**
 * @fileoverview TraitProvider Unit Tests
 * @version 1.0.0 - Stage 1: Foundation
 * @description Comprehensive unit tests for the TraitProvider service
 * @author Avant VTT Team
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type { 
  Trait, 
  TraitProviderConfig, 
  TraitRetrievalOptions,
  CompendiumPackInfo
} from '../../../scripts/types/domain/trait.js';
import { TraitProvider } from '../../../scripts/services/trait-provider.ts';
import type { TraitProviderResult } from '../../../scripts/types/domain/trait.js';

// Mock FoundryVTT globals with proper typing
const mockFoundry = {
  documents: {
    collections: {
      CompendiumCollection: {
        createCompendium: jest.fn<any>().mockResolvedValue({})
      }
    }
  }
};

const mockGame = {
  ready: true,
  system: { id: 'avant' },
  packs: {
    get: jest.fn<any>(),
    set: jest.fn<any>(),
    clear: jest.fn<any>()
  } as any
};

// Mock compendium pack with proper typing
const createMockPack = (items: any[] = []) => ({
  name: 'test-pack',
  visible: true,
  getDocuments: jest.fn<any>().mockResolvedValue(items)
});

// Mock trait item data
const createMockTraitItem = (id: string, name: string, source: 'system' | 'world' = 'system') => ({
  _id: id,
  name: name,
  type: 'trait',
  system: {
    color: '#FF6B6B',
    icon: 'fas fa-fire',
    localKey: `AVANT.Trait.${name}`,
    description: `Test ${name} trait`,
    textColor: '#000000', // Add missing textColor field
    traitMetadata: {
      categories: ['test'],
      tags: ['test', name.toLowerCase()],
      appliesToActors: true,
      appliesToItems: true
    }
  },
  img: 'test-icon.webp',
  sort: 100,
  flags: {}
});

describe('TraitProvider', () => {
  let traitProvider: TraitProvider;
  
  beforeEach(() => {
    // Reset singleton
    (TraitProvider as any)._instance = undefined;
    
    // Setup global mocks
    Object.defineProperty(globalThis, 'foundry', {
      value: mockFoundry,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(globalThis, 'game', {
      value: mockGame,
      writable: true,
      configurable: true
    });
    
    // Clear mocks
    jest.clearAllMocks();
    mockGame.packs.get.mockReturnValue(undefined);
  });
  
  afterEach(() => {
    // Clean up globals
    if ('foundry' in globalThis) {
      Object.defineProperty(globalThis, 'foundry', { value: undefined, configurable: true });
    }
    if ('game' in globalThis) {
      Object.defineProperty(globalThis, 'game', { value: undefined, configurable: true });
    }
  });
  
  describe('Singleton Pattern', () => {
    test('should return same instance when called multiple times', () => {
      const instance1 = TraitProvider.getInstance();
      const instance2 = TraitProvider.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(TraitProvider);
    });
    
    test('should use provided config on first instantiation', () => {
      const config: Partial<TraitProviderConfig> = {
        systemPackName: 'custom.system-pack',
        worldPackName: 'custom-world-pack'
      };
      
      const instance = TraitProvider.getInstance(config);
      expect(instance).toBeInstanceOf(TraitProvider);
      
      // Config should be applied (checking through behavior)
      expect((instance as any).config.systemPackName).toBe('custom.system-pack');
      expect((instance as any).config.worldPackName).toBe('custom-world-pack');
    });
  });
  
  describe('Configuration', () => {
    test('should have default configuration values', () => {
      traitProvider = TraitProvider.getInstance();
      
      const config = (traitProvider as any).config;
      expect(config.systemPackName).toBe('avant.avant-traits');
      expect(config.worldPackName).toBe('world.custom-traits');
      expect(config.worldPackLabel).toBe('Custom Traits');
      expect(config.itemType).toBe('trait');
      expect(config.enableCaching).toBe(true);
      expect(config.cacheTimeout).toBe(300000);
    });
    
    test('should merge custom config with defaults', () => {
      const customConfig: Partial<TraitProviderConfig> = {
        enableCaching: false,
        cacheTimeout: 60000,
        worldPackLabel: 'My Custom Traits'
      };
      
      traitProvider = TraitProvider.getInstance(customConfig);
      
      const config = (traitProvider as any).config;
      expect(config.enableCaching).toBe(false);
      expect(config.cacheTimeout).toBe(60000);
      expect(config.worldPackLabel).toBe('My Custom Traits');
      // Defaults should still be present
      expect(config.systemPackName).toBe('avant.avant-traits');
      expect(config.itemType).toBe('trait');
    });
  });
  
  describe('Initialization', () => {
    beforeEach(() => {
      traitProvider = TraitProvider.getInstance();
    });
    
    test('should fail initialization when game is not ready', async () => {
      mockGame.ready = false;
      
      const result = await traitProvider.initialize();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('FoundryVTT game not ready');
    });
    
    test('should successfully initialize when game is ready', async () => {
      mockGame.ready = true;
      mockGame.packs.get.mockReturnValue(createMockPack());
      
      const result = await traitProvider.initialize();
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(traitProvider.isReady()).toBe(true);
    });
    
    test('should create world pack if it does not exist', async () => {
      mockGame.ready = true;
      // No world pack exists initially
      mockGame.packs.get.mockReturnValue(undefined);
      
      const createSpy = mockFoundry.documents.collections.CompendiumCollection.createCompendium;
      
      const result = await traitProvider.initialize();
      
      expect(createSpy).toHaveBeenCalledWith({
        name: 'world.custom-traits',
        label: 'Custom Traits',
        path: './packs/world.custom-traits.db',
        type: 'Item',
        system: 'avant'
      });
      expect(result.success).toBe(true);
    });
    
    test('should handle initialization errors gracefully', async () => {
      mockGame.ready = true;
      mockFoundry.documents.collections.CompendiumCollection.createCompendium
        .mockRejectedValue(new Error('Pack creation failed'));
      
      const result = await traitProvider.initialize();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Pack creation failed');
    });
  });
  
  describe('Trait Retrieval', () => {
    let mockCompendiumService: any;

    beforeEach(() => {
      traitProvider = TraitProvider.getInstance();
      mockGame.ready = true;
      
      mockCompendiumService = {
        loadPack: jest.fn().mockResolvedValue([]),
        // Add other methods if needed by tests
      };
      
      // Inject the mock service
      (traitProvider as any).compendiumService = mockCompendiumService;
    });
    
    test('should get all traits from both system and world packs', async () => {
      const systemItem = createMockTraitItem('sys1', 'Fire', 'system');
      const worldItem = createMockTraitItem('world1', 'Custom', 'world');
      
      mockCompendiumService.loadPack.mockImplementation((packName: string) => {
        if (packName.includes('avant-traits')) return Promise.resolve([systemItem]);
        if (packName.includes('custom-traits')) return Promise.resolve([worldItem]);
        return Promise.resolve([]);
      });
      
      const result = await traitProvider.getAll();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data!.find(t => t.name === 'Fire')).toBeDefined();
      expect(result.data!.find(t => t.name === 'Custom')).toBeDefined();
    });
    
    test('should deduplicate traits with world taking precedence', async () => {
      const systemItem = createMockTraitItem('trait1', 'Fire', 'system');
      const worldItem = createMockTraitItem('trait1', 'Fire', 'world'); // Same ID
      
      mockCompendiumService.loadPack.mockImplementation((packName: string) => {
        if (packName.includes('avant-traits')) return Promise.resolve([systemItem]);
        if (packName.includes('custom-traits')) return Promise.resolve([worldItem]);
        return Promise.resolve([]);
      });
      
      const result = await traitProvider.getAll();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].source).toBe('world'); // World should take precedence
    });
    
    test('should respect includeSystem and includeWorld options', async () => {
      const systemItem = createMockTraitItem('sys1', 'Fire', 'system');
      const worldItem = createMockTraitItem('world1', 'Custom', 'world');
      
      mockCompendiumService.loadPack.mockImplementation((packName: string) => {
        if (packName.includes('avant-traits')) return Promise.resolve([systemItem]);
        if (packName.includes('custom-traits')) return Promise.resolve([worldItem]);
        return Promise.resolve([]);
      });
      
      // Only system traits
      const systemResult = await traitProvider.getAll({ includeWorld: false });
      expect(systemResult.data).toHaveLength(1);
      expect(systemResult.data![0].name).toBe('Fire');
      
      // Clear cache by creating a new instance
      (TraitProvider as any)._instance = undefined;
      traitProvider = TraitProvider.getInstance();
      (traitProvider as any).compendiumService = mockCompendiumService; // Re-inject mock
      
      // Only world traits
      const worldResult = await traitProvider.getAll({ includeSystem: false });
      expect(worldResult.data).toHaveLength(1);
      expect(worldResult.data![0].name).toBe('Custom');
    });
    
    test('should filter traits by categories', async () => {
      const fireItem = createMockTraitItem('fire', 'Fire');
      fireItem.system.traitMetadata!.categories = ['elemental'];
      
      const stealthItem = createMockTraitItem('stealth', 'Stealth');
      stealthItem.system.traitMetadata!.categories = ['skill'];
      
      mockCompendiumService.loadPack.mockResolvedValue([fireItem, stealthItem]);
      
      const result = await traitProvider.getAll({ categories: ['elemental'] });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].name).toBe('Fire');
    });
    
    test('should filter traits by tags', async () => {
      const fireItem = createMockTraitItem('fire', 'Fire');
      fireItem.system.traitMetadata!.tags = ['fire', 'elemental'];
      
      const iceItem = createMockTraitItem('ice', 'Ice');
      iceItem.system.traitMetadata!.tags = ['ice', 'elemental'];
      
      mockCompendiumService.loadPack.mockResolvedValue([fireItem, iceItem]);
      
      const result = await traitProvider.getAll({ tags: ['fire'] });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].name).toBe('Fire');
    });
    
    test('should handle missing packs gracefully', async () => {
      mockCompendiumService.loadPack.mockResolvedValue([]);
      
      const result = await traitProvider.getAll();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
    
    test('should skip items with missing trait properties', async () => {
      const validItem = createMockTraitItem('valid', 'Valid');
      const invalidItem = { ...createMockTraitItem('invalid', 'Invalid'), system: { ...createMockTraitItem('invalid', 'Invalid').system, color: undefined } };
      
      mockCompendiumService.loadPack.mockResolvedValue([validItem, invalidItem]);
      
      const result = await traitProvider.getAll();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].name).toBe('Valid');
    });
  });
  
  describe('Individual Trait Retrieval', () => {
    let mockCompendiumService: any;

    beforeEach(() => {
      traitProvider = TraitProvider.getInstance();
      mockGame.ready = true;
      
      mockCompendiumService = {
        loadPack: jest.fn().mockResolvedValue([]),
      };
      
      (traitProvider as any).compendiumService = mockCompendiumService;
    });
    
    test('should get specific trait by ID', async () => {
      const traitItem = createMockTraitItem('fire123', 'Fire');
      
      mockCompendiumService.loadPack.mockResolvedValue([traitItem]);
      
      const result = await traitProvider.get('fire123');
      
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data!.id).toBe('fire123');
      expect(result.data!.name).toBe('Fire');
    });
    
    test('should return null for non-existent trait', async () => {
      const traitItem = createMockTraitItem('fire123', 'Fire');
      
      mockCompendiumService.loadPack.mockResolvedValue([traitItem]);
      
      const result = await traitProvider.get('nonexistent');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.metadata?.found).toBe(false);
    });
  });
  
  describe('Caching', () => {
    beforeEach(() => {
      traitProvider = TraitProvider.getInstance();
      mockGame.ready = true;
      
      const mockItem = createMockTraitItem('test1', 'Test Trait', 'system');
      const mockPack = createMockPack([mockItem]);
      mockGame.packs.get.mockReturnValue(mockPack);
    });
    
    test('should bypass cache when forceRefresh is true', async () => {
      // Initialize will call getAll({ forceRefresh: true }) once
      await traitProvider.initialize();
      const mockPack = mockGame.packs.get();
      
      // Reset mock call count after initialization
      mockPack.getDocuments.mockClear();
      
      // First call after initialization - should use cache
      await traitProvider.getAll();
      expect(mockPack.getDocuments).toHaveBeenCalledTimes(0);
      
      // Second call with forceRefresh should bypass cache
      await traitProvider.getAll({ forceRefresh: true });
      expect(mockPack.getDocuments).toHaveBeenCalledTimes(2); // Called twice (system + world)
    });
    
    test('should clear cache when clearCache is called', async () => {
      // Initialize will call getAll({ forceRefresh: true }) once
      await traitProvider.initialize();
      const mockPack = mockGame.packs.get();
      
      // Reset mock call count after initialization
      mockPack.getDocuments.mockClear();
      
      // First call should use cache
      await traitProvider.getAll();
      expect(mockPack.getDocuments).toHaveBeenCalledTimes(0);
      
      // Clear cache
      traitProvider.clearCache();
      
      // Next call should reload from packs
      await traitProvider.getAll();
      expect(mockPack.getDocuments).toHaveBeenCalledTimes(2); // Called twice (system + world)
    });
    
    test('should not cache when caching is disabled', async () => {
      // Reset singleton and create new instance with caching disabled
      (TraitProvider as any)._instance = undefined;
      traitProvider = TraitProvider.getInstance({ enableCaching: false });
      
      const mockItem = createMockTraitItem('test1', 'Test Trait', 'system');
      const mockPack = createMockPack([mockItem]);
      mockGame.packs.get.mockReturnValue(mockPack);
      
      // Initialize will call getAll({ forceRefresh: true }) once
      await traitProvider.initialize();
      
      // Reset mock call count after initialization
      mockPack.getDocuments.mockClear();
      
      // Two calls without caching should each hit the pack
      await traitProvider.getAll();
      await traitProvider.getAll();
      
      expect(mockPack.getDocuments).toHaveBeenCalledTimes(4); // 2 calls × 2 packs each
    });
  });
  
  describe('Pack Information', () => {
    beforeEach(() => {
      traitProvider = TraitProvider.getInstance();
      mockGame.ready = true;
    });
    
    test('should return information about both packs', async () => {
      mockGame.packs.get.mockImplementation((packName: string) => {
        if (packName === 'avant.avant-traits') return createMockPack();
        if (packName === 'world.custom-traits') return createMockPack();
        return undefined;
      });
      
      const result = await traitProvider.getPackInfo();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('system');
      expect(result.data).toHaveProperty('world');
      
      expect(result.data!.system.exists).toBe(true);
      expect(result.data!.system.name).toBe('avant.avant-traits');
      expect(result.data!.world.exists).toBe(true);
      expect(result.data!.world.name).toBe('world.custom-traits');
    });
    
    test('should handle missing packs in pack info', async () => {
      // No packs exist
      mockGame.packs.get.mockReturnValue(undefined);
      
      const result = await traitProvider.getPackInfo();
      
      expect(result.success).toBe(true);
      expect(result.data!.system.exists).toBe(false);
      expect(result.data!.world.exists).toBe(false);
    });
  });
  
  describe('Error Handling', () => {
    beforeEach(() => {
      traitProvider = TraitProvider.getInstance();
      mockGame.ready = true;
    });
    
    test('should handle pack loading errors gracefully', async () => {
      traitProvider = TraitProvider.getInstance();
      mockGame.ready = true;
      
      // Mock pack that throws error on getDocuments
      const mockPack = {
        name: 'avant.avant-traits',
        getDocuments: jest.fn<() => Promise<never>>().mockRejectedValue(new Error('Pack loading failed'))
      };
      mockGame.packs.get.mockReturnValue(mockPack);
      
      // The method should handle the error and still return success: true with empty data
      // because pack loading errors are considered non-fatal
      const result = await traitProvider.getAll();
      
      expect(result.success).toBe(true); // Should still succeed
      expect(result.data).toEqual([]); // But with empty data
      expect(mockPack.getDocuments).toHaveBeenCalled();
    });
    
    test('should handle trait conversion errors gracefully', async () => {
      const invalidItem = {
        _id: 'invalid',
        name: 'Invalid',
        type: 'feature',
        system: null // Invalid system data
      };
      
      mockGame.packs.get.mockReturnValue(createMockPack([invalidItem]));
      
      const result = await traitProvider.getAll();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0); // Invalid item should be skipped
    });
    
    test('should handle checkPackExists error gracefully', async () => {
      // Reset singleton to test error branch in checkPackExists
      (TraitProvider as any)._instance = undefined;
      traitProvider = TraitProvider.getInstance();
      
      // Mock game.packs.get to throw an error
      mockGame.packs.get.mockImplementation(() => {
        throw new Error('Packs access failed');
      });
      
      // Call a method that uses checkPackExists internally
      const packInfo = await traitProvider.getPackInfo();
      
      // Should handle the error and return false for pack existence
      expect(packInfo.success).toBe(true);
      expect(packInfo.data!.system.exists).toBe(false);
      expect(packInfo.data!.world.exists).toBe(false);
    });
    
    test('should handle getPackInfo_internal error branch', async () => {
      // Reset singleton
      (TraitProvider as any)._instance = undefined;
      traitProvider = TraitProvider.getInstance();
      
      // Mock game to be null to trigger error branch
      const originalGame = (traitProvider as any).game;
      (traitProvider as any).game = null;
      
      const packInfo = await traitProvider.getPackInfo();
      
      // Restore game for cleanup
      (traitProvider as any).game = originalGame;
      
      expect(packInfo.success).toBe(true);
      expect(packInfo.data!.system.exists).toBe(false);
      expect(packInfo.data!.world.exists).toBe(false);
    });
    
    test('should handle unexpected error in getAll method', async () => {
      // Reset singleton
      (TraitProvider as any)._instance = undefined;
      traitProvider = TraitProvider.getInstance();
      
      // Mock loadTraitsFromPack to throw an error by making deduplicateTraits fail
      const originalConfig = (traitProvider as any).config;
      (traitProvider as any).config = null; // This will cause an error in the method
      
      const result = await traitProvider.getAll();
      
      // Restore config for cleanup
      (traitProvider as any).config = originalConfig;
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get traits');
    });
    
    test('should handle get method error when getAll fails', async () => {
      // Reset singleton
      (TraitProvider as any)._instance = undefined;
      traitProvider = TraitProvider.getInstance();
      
      // Mock getAllTraits to fail
      const originalGetAll = traitProvider.getAll;
      (traitProvider as any).getAll = jest.fn<() => Promise<TraitProviderResult<Trait[]>>>().mockResolvedValue({
        success: false,
        error: 'Simulated getAll failure',
        data: undefined,
        metadata: {}
      } as TraitProviderResult<Trait[]>);
      
      const result = await traitProvider.get('test-id');
      
      // Restore method
      traitProvider.getAll = originalGetAll;
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load traits');
    });
    
    test('should handle unexpected error in get method', async () => {
      // Create a scenario where get method throws an error
      traitProvider = TraitProvider.getInstance();
      
      // Mock getAll to return malformed data that will cause an error
      const originalGetAll = traitProvider.getAll;
      (traitProvider as any).getAll = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error in get method');
      });
      
      const result = await traitProvider.get('test-id');
      
      // Restore method
      traitProvider.getAll = originalGetAll;
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get trait');
    });
    
    test('should handle getPackInfo error scenarios', async () => {
      // Reset singleton  
      (TraitProvider as any)._instance = undefined;
      traitProvider = TraitProvider.getInstance();
      
      // Mock getPackInfo_internal to throw an error
      const originalMethod = (traitProvider as any).getPackInfo_internal;
      (traitProvider as any).getPackInfo_internal = jest.fn().mockImplementation(() => {
        throw new Error('Pack info internal error');
      });
      
      const result = await traitProvider.getPackInfo();
      
      // Restore method
      (traitProvider as any).getPackInfo_internal = originalMethod;
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get pack info');
    });
  });
}); 