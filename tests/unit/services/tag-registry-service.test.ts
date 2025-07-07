/**
 * @fileoverview Unit Tests for TagRegistryService
 * @version 1.0.0
 * @description Tests the tag registry service functionality including JSON loading, filtering, and hook emission
 * @author Avant VTT Team
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type {
  TagDefinition,
  TagFilterOptions,
  TagRegistryResult
} from '../../../scripts/types/domain/tag.ts';

// Mock fetch for testing
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// Mock global hooks
const mockHooks = {
  call: jest.fn()
};

(global as any).Hooks = mockHooks;
(global as any).foundry = {
  utils: {
    hooks: mockHooks
  }
};

// Sample test data
const sampleTagsJson = {
  tags: [
    {
      id: 'weapon',
      label: 'Weapon',
      color: '#DC3545',
      icon: 'fas fa-sword',
      categories: ['trait', 'item']
    },
    {
      id: 'armor',
      label: 'Armor',
      color: '#6C757D',
      icon: 'fas fa-shield-alt',
      categories: ['trait', 'item']
    },
    {
      id: 'elemental',
      label: 'Elemental',
      color: '#00E0DC',
      icon: 'fas fa-fire',
      categories: ['trait', 'damage']
    },
    {
      id: 'healing',
      label: 'Healing',
      color: '#20C997',
      icon: 'fas fa-heart',
      categories: ['trait', 'beneficial']
    }
  ]
};

describe('TagRegistryService', () => {
  let TagRegistryService: any;
  let service: any;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset the singleton instance
    const module = await import('../../../scripts/services/tag-registry-service.ts');
    TagRegistryService = module.TagRegistryService;
    
    // Reset singleton
    (TagRegistryService as any)._instance = undefined;
    
    // Setup successful fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sampleTagsJson)
    });
    
    service = TagRegistryService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
    (TagRegistryService as any)._instance = undefined;
  });

  describe('Singleton Pattern', () => {
    test('returns same instance when called multiple times', () => {
      const service1 = TagRegistryService.getInstance();
      const service2 = TagRegistryService.getInstance();
      
      expect(service1).toBe(service2);
    });

    test('applies custom config on first instantiation', () => {
      const customConfig = {
        defaultTagsPath: 'custom/path/tags.json',
        enableCaching: false
      };
      
      const customService = TagRegistryService.getInstance(customConfig);
      expect(customService).toBeDefined();
    });
  });

  describe('Initialization', () => {
    test('initializes successfully with valid JSON', async () => {
      const result = await service.initialize();
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.metadata?.tagsLoaded).toBe(4);
      expect(result.metadata?.source).toBe('default-json');
    });

    test('calls fetch with correct path', async () => {
      await service.initialize();
      
      expect(mockFetch).toHaveBeenCalledWith('systems/avant/data/default-tags.json');
    });

    test('emits avantTagsUpdated hook on successful initialization', async () => {
      await service.initialize();
      
      expect(mockHooks.call).toHaveBeenCalledWith('avantTagsUpdated', 
        expect.objectContaining({
          action: 'loaded',
          tags: expect.any(Array),
          context: expect.objectContaining({
            totalTags: 4,
            timestamp: expect.any(Number)
          })
        })
      );
    });

    test('handles fetch failure gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await service.initialize();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch tags: 404 Not Found');
    });

    test('handles invalid JSON format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalidStructure: true })
      });

      const result = await service.initialize();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON format');
    });

    test('skips invalid tag definitions during loading', async () => {
      const invalidTagsJson = {
        tags: [
          {
            id: 'valid-tag',
            label: 'Valid Tag',
            color: '#FF0000'
          },
          {
            // Missing required fields
            color: '#00FF00'
          },
          {
            id: '',
            label: 'Empty ID'
          }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(invalidTagsJson)
      });

      const result = await service.initialize();
      
      expect(result.success).toBe(true);
      expect(result.metadata?.tagsLoaded).toBe(1); // Only valid tag loaded
    });
  });

  describe('Tag Retrieval', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('getAll returns all tags when no filter provided', () => {
      const tags = service.getAll();
      
      expect(tags).toHaveLength(4);
      expect(tags.map((t: TagDefinition) => t.id)).toEqual(['weapon', 'armor', 'elemental', 'healing']);
    });

    test('getAll filters by single category', () => {
      const tags = service.getAll({ category: 'item' });
      
      expect(tags).toHaveLength(2);
      expect(tags.map((t: TagDefinition) => t.id)).toEqual(['weapon', 'armor']);
    });

    test('getAll filters by multiple categories', () => {
      const tags = service.getAll({ categories: ['damage', 'beneficial'] });
      
      expect(tags).toHaveLength(2);
      expect(tags.map((t: TagDefinition) => t.id)).toEqual(['elemental', 'healing']);
    });

    test('getAll filters by search text (case insensitive)', () => {
      const tags = service.getAll({ search: 'WEAPON' });
      
      expect(tags).toHaveLength(1);
      expect(tags[0].id).toBe('weapon');
    });

    test('getAll combines multiple filters', () => {
      const tags = service.getAll({ 
        category: 'trait',
        search: 'el' 
      });
      
      expect(tags).toHaveLength(1);
      expect(tags[0].id).toBe('elemental');
    });

    test('getById returns correct tag', () => {
      const tag = service.getById('healing');
      
      expect(tag).toBeDefined();
      expect(tag.label).toBe('Healing');
      expect(tag.color).toBe('#20C997');
    });

    test('getById returns undefined for non-existent tag', () => {
      const tag = service.getById('non-existent');
      
      expect(tag).toBeUndefined();
    });

    test('search returns limited results', () => {
      const tags = service.search('a', 2);
      
      expect(tags).toHaveLength(2);
    });

    test('search returns all tags when query is empty', () => {
      const tags = service.search('', 10);
      
      expect(tags).toHaveLength(4);
    });
  });

  describe('Tag Management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('addOrUpdate adds new tag successfully', async () => {
      const newTag: TagDefinition = {
        id: 'custom-tag',
        label: 'Custom Tag',
        color: '#FF00FF',
        icon: 'fas fa-star',
        categories: ['custom']
      };

      const result = await service.addOrUpdate(newTag);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(newTag);
      expect(result.metadata?.action).toBe('added');
    });

    test('addOrUpdate updates existing tag', async () => {
      const updatedTag: TagDefinition = {
        id: 'weapon',
        label: 'Updated Weapon',
        color: '#000000',
        icon: 'fas fa-blade',
        categories: ['trait', 'item', 'combat']
      };

      const result = await service.addOrUpdate(updatedTag);
      
      expect(result.success).toBe(true);
      expect(result.metadata?.action).toBe('updated');
      
      const retrieved = service.getById('weapon');
      expect(retrieved.label).toBe('Updated Weapon');
      expect(retrieved.color).toBe('#000000');
    });

    test('addOrUpdate validates tag definition', async () => {
      const invalidTag = {
        id: '',
        label: ''
      } as TagDefinition;

      const result = await service.addOrUpdate(invalidTag);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid tag definition');
    });

    test('addOrUpdate emits hooks for add and update', async () => {
      const newTag: TagDefinition = {
        id: 'test-tag',
        label: 'Test Tag',
        color: '#123456'
      };

      await service.addOrUpdate(newTag);
      
      expect(mockHooks.call).toHaveBeenCalledWith('avantTagsUpdated', 
        expect.objectContaining({
          action: 'added',
          tag: newTag
        })
      );
    });

    test('remove deletes existing tag', async () => {
      const result = await service.remove('weapon');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      
      const retrieved = service.getById('weapon');
      expect(retrieved).toBeUndefined();
    });

    test('remove fails for non-existent tag', async () => {
      const result = await service.remove('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('remove emits hook', async () => {
      const originalTag = service.getById('weapon');
      await service.remove('weapon');
      
      expect(mockHooks.call).toHaveBeenCalledWith('avantTagsUpdated',
        expect.objectContaining({
          action: 'removed',
          tag: originalTag
        })
      );
    });
  });

  describe('Service State', () => {
    test('isReady returns false before initialization', () => {
      expect(service.isReady()).toBe(false);
    });

    test('isReady returns true after successful initialization', async () => {
      await service.initialize();
      expect(service.isReady()).toBe(true);
    });

    test('getCount returns correct number of tags', async () => {
      await service.initialize();
      expect(service.getCount()).toBe(4);
      
      await service.addOrUpdate({
        id: 'new-tag',
        label: 'New Tag'
      });
      
      expect(service.getCount()).toBe(5);
    });
  });

  describe('Error Handling', () => {
    test('handles initialization failure gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const result = await service.initialize();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    test('handles hook emission errors gracefully', async () => {
      mockHooks.call.mockImplementation(() => {
        throw new Error('Hook error');
      });
      
      await service.initialize(); // Should not throw
      
      // Service should still be functional
      expect(service.isReady()).toBe(true);
    });

    test('returns empty array when getAll encounters error', () => {
      // Force an error by corrupting internal state
      (service as any).tags = null;
      
      const tags = service.getAll();
      expect(tags).toEqual([]);
    });
  });
}); 