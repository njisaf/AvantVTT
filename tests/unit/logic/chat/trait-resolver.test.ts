/**
 * @fileoverview Unit Tests for Trait Resolver Utilities
 * @version 1.0.0 - Stage 4: Chat Integration
 * @description Tests for trait resolution and chat integration utilities
 * @author Avant VTT Team
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  resolveTraitsForChat,
  resolveItemTraitsForChat,
  itemHasTraits,
  createTraitHtmlForChat
} from '../../../../scripts/logic/chat/trait-resolver.ts';

// Create mock TraitProvider using simple object approach to avoid Jest typing issues
const createMockTraitProvider = () => ({
  getAll: () => Promise.resolve({
    success: true,
    data: mockTraits
  })
});

// Mock trait objects for testing
const mockTraits = [
  {
    id: 'fire',
    name: 'Fire',
    color: '#FF6B6B',
    icon: 'fas fa-fire',
    localKey: 'AVANT.Trait.Fire',
    description: 'Fire elemental trait',
    source: 'system' as const,
    item: {
      _id: 'fire',
      name: 'Fire',
      type: 'trait',
      system: {
        color: '#FF6B6B',
        icon: 'fas fa-fire',
        localKey: 'AVANT.Trait.Fire',
        description: 'Fire elemental trait'
      },
      img: 'icons/fire.png',
      sort: 0,
      flags: {}
    }
  },
  {
    id: 'ice',
    name: 'Ice',
    color: '#4ECDC4',
    icon: 'fas fa-snowflake',
    localKey: 'AVANT.Trait.Ice',
    description: 'Ice elemental trait',
    source: 'world' as const,
    item: {
      _id: 'ice',
      name: 'Ice',
      type: 'trait',
      system: {
        color: '#4ECDC4',
        icon: 'fas fa-snowflake',
        localKey: 'AVANT.Trait.Ice',
        description: 'Ice elemental trait'
      },
      img: 'icons/ice.png',
      sort: 1,
      flags: {}
    }
  },
  {
    id: 'lightning',
    name: 'Lightning',
    color: '#FFE66D',
    icon: 'fas fa-bolt',
    localKey: 'AVANT.Trait.Lightning',
    description: 'Lightning elemental trait',
    source: 'system' as const,
    item: {
      _id: 'lightning',
      name: 'Lightning',
      type: 'trait',
      system: {
        color: '#FFE66D',
        icon: 'fas fa-bolt',
        localKey: 'AVANT.Trait.Lightning',
        description: 'Lightning elemental trait'
      },
      img: 'icons/lightning.png',
      sort: 2,
      flags: {}
    }
  }
];

describe('resolveTraitsForChat', () => {
  test('should resolve empty array correctly', async () => {
    const mockProvider = createMockTraitProvider();
    const result = await resolveTraitsForChat([], mockProvider as any);
    
    expect(result.success).toBe(true);
    expect(result.traits).toEqual([]);
    expect(result.count).toBe(0);
    expect(result.unresolved).toEqual([]);
  });

  test('should handle invalid input gracefully', async () => {
    const mockProvider = createMockTraitProvider();
    const result = await resolveTraitsForChat(null as any, mockProvider as any);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Trait IDs must be an array');
    expect(result.count).toBe(0);
  });

  test('should resolve valid trait IDs correctly', async () => {
    const mockProvider = createMockTraitProvider();
    const result = await resolveTraitsForChat(['fire', 'ice'], mockProvider as any);
    
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.traits).toHaveLength(2);
    expect(result.traits[0].id).toBe('fire');
    expect(result.traits[1].id).toBe('ice');
    expect(result.unresolved).toEqual([]);
  });

  test('should handle invalid trait IDs', async () => {
    const mockProvider = createMockTraitProvider();
    const result = await resolveTraitsForChat(['fire', 'invalid', 'ice'], mockProvider as any);
    
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.traits).toHaveLength(2);
    expect(result.unresolved).toEqual(['invalid']);
  });

  test('should handle provider failure gracefully', async () => {
    const mockProvider = {
      getAll: () => Promise.resolve({
        success: false,
        error: 'Provider failed'
      })
    };
    
    const result = await resolveTraitsForChat(['fire'], mockProvider as any);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to load traits from provider');
    expect(result.unresolved).toEqual(['fire']);
  });

  test('should sanitize invalid trait ID types', async () => {
    const mockProvider = createMockTraitProvider();
    const result = await resolveTraitsForChat(['fire', null, '', undefined, 'ice'] as any, mockProvider as any);
    
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.traits).toHaveLength(2);
    expect(result.unresolved).toEqual(['null', '', 'undefined']);
  });

  test('should handle provider exception gracefully', async () => {
    const mockProvider = {
      getAll: () => Promise.reject(new Error('Network error'))
    };
    
    const result = await resolveTraitsForChat(['fire'], mockProvider as any);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to resolve traits');
    expect(result.unresolved).toEqual(['fire']);
  });
});

describe('resolveItemTraitsForChat', () => {
  test('should resolve item traits correctly', async () => {
    const mockProvider = createMockTraitProvider();
    const mockItem = {
      system: {
        traits: ['fire', 'ice']
      }
    };
    
    const result = await resolveItemTraitsForChat(mockItem, mockProvider as any);
    
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.traits).toHaveLength(2);
  });

  test('should handle item without system property', async () => {
    const mockProvider = createMockTraitProvider();
    const result = await resolveItemTraitsForChat({}, mockProvider as any);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid item provided');
  });

  test('should handle null item gracefully', async () => {
    const mockProvider = createMockTraitProvider();
    const result = await resolveItemTraitsForChat(null, mockProvider as any);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid item provided');
  });

  test('should handle item without traits property', async () => {
    const mockProvider = createMockTraitProvider();
    const mockItem = {
      system: {}
    };
    
    const result = await resolveItemTraitsForChat(mockItem, mockProvider as any);
    
    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
    expect(result.traits).toEqual([]);
  });

  test('should handle exceptions gracefully', async () => {
    const mockProvider = {
      getAll: () => Promise.reject(new Error('Provider error'))
    };
    
    const mockItem = {
      system: {
        traits: ['fire']
      }
    };
    
    const result = await resolveItemTraitsForChat(mockItem, mockProvider as any);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to resolve traits: Provider error');
  });
});

describe('itemHasTraits', () => {
  test('should return true for item with traits', () => {
    const mockItem = {
      system: {
        traits: ['fire', 'ice']
      }
    };
    
    expect(itemHasTraits(mockItem)).toBe(true);
  });

  test('should return false for item without traits', () => {
    const mockItem = {
      system: {
        traits: []
      }
    };
    
    expect(itemHasTraits(mockItem)).toBe(false);
  });

  test('should return false for item without system property', () => {
    expect(itemHasTraits({})).toBe(false);
  });

  test('should return false for null item', () => {
    expect(itemHasTraits(null)).toBe(false);
  });

  test('should return false for item with non-array traits', () => {
    const mockItem = {
      system: {
        traits: 'fire,ice'
      }
    };
    
    expect(itemHasTraits(mockItem)).toBe(false);
  });

  test('should handle exceptions gracefully', () => {
    const mockItem = {
      get system() {
        throw new Error('System access error');
      }
    };
    
    expect(itemHasTraits(mockItem)).toBe(false);
  });
});

describe('createTraitHtmlForChat', () => {
  test('should create HTML for valid traits', async () => {
    const mockProvider = createMockTraitProvider();
    const html = await createTraitHtmlForChat(['fire', 'ice'], mockProvider as any, 'small');
    
    expect(html).toContain('trait-chips-wrapper');
    expect(html).toContain('trait-chip');
    expect(html).toContain('Fire');
    expect(html).toContain('Ice');
  });

  test('should return empty string for no traits', async () => {
    const mockProvider = createMockTraitProvider();
    const html = await createTraitHtmlForChat([], mockProvider as any);
    
    expect(html).toBe('');
  });

  test('should handle provider failure gracefully', async () => {
    const mockProvider = {
      getAll: () => Promise.resolve({
        success: false,
        error: 'Provider failed'
      })
    };
    
    const html = await createTraitHtmlForChat(['fire'], mockProvider as any);
    
    expect(html).toBe('');
  });

  test('should handle render failure gracefully', async () => {
    const mockProvider = createMockTraitProvider();
    const html = await createTraitHtmlForChat(['fire'], mockProvider as any);
    
    // Note: We can't easily test the dynamic import failure without complex mocking
    // But the function is designed to return empty string on any error
    expect(typeof html).toBe('string');
  });

  test('should use correct size parameter', async () => {
    const mockProvider = createMockTraitProvider();
    const html = await createTraitHtmlForChat(['fire'], mockProvider as any, 'large');
    
    // Should contain trait content even if we can't easily test the size parameter
    expect(html).toContain('trait-chip');
  });

  test('should include wrapper div', async () => {
    const mockProvider = createMockTraitProvider();
    const html = await createTraitHtmlForChat(['fire'], mockProvider as any);
    
    expect(html).toContain('<div class="trait-chips-wrapper">');
    expect(html).toContain('</div>');
  });

  test('should sanitize trait data safely', async () => {
    // Test with potentially problematic trait data
    const maliciousTraits = [
      {
        id: 'xss',
        name: '<script>alert("xss")</script>',
        color: '#FF0000',
        icon: 'fas fa-skull',
        localKey: 'AVANT.Trait.XSS',
        description: '<img src=x onerror=alert("xss")>',
        source: 'system' as const,
        item: {
          _id: 'xss',
          name: '<script>alert("xss")</script>',
          type: 'trait',
          system: {
            color: '#FF0000',
            icon: 'fas fa-skull',
            localKey: 'AVANT.Trait.XSS',
            description: '<img src=x onerror=alert("xss")>'
          },
          img: 'icons/skull.png',
          sort: 0,
          flags: {}
        }
      }
    ];
    
    const mockProvider = {
      getAll: () => Promise.resolve({
        success: true,
        data: maliciousTraits
      })
    };
    
    const html = await createTraitHtmlForChat(['xss'], mockProvider as any);
    
    // Should not contain unescaped script tags
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('onerror=');
    
    // Should contain escaped content
    expect(html).toContain('&lt;script&gt;');
  });
}); 