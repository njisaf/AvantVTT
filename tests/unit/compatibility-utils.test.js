/**
 * CompatibilityUtils Test Suite
 * 
 * Comprehensive tests for the CompatibilityUtils class covering:
 * - FoundryVTT version detection and compatibility checks
 * - Class and collection retrieval for different versions
 * - HTML element normalization for event listeners
 * - Version-aware logging and feature detection
 * - Edge cases for dual v12/v13 compatibility
 * 
 * @author Avant VTT Team
 * @version 2.0.0
 * @since 0.1.2
 */

import { CompatibilityUtils } from '../../scripts/utils/compatibility.js';

describe('CompatibilityUtils', () => {
  // Mock different game versions for testing
  const mockV12Game = { version: '12.331' };
  const mockV13Game = { version: '13.291' };
  const mockLegacyGame = { data: { version: '12.324' } };

  beforeEach(() => {
    // Reset global.game before each test
    global.game = mockV12Game;
  });

  describe('Version Detection', () => {
    test('should detect FoundryVTT v12 correctly', () => {
      global.game = mockV12Game;
      
      expect(CompatibilityUtils.getFoundryVersion())
        .toBeString()
        .toStartWith('12');
      
      expect(CompatibilityUtils.isV12()).toBeTrue();
      expect(CompatibilityUtils.isV13OrLater()).toBeFalse();
    });

    test('should detect FoundryVTT v13 correctly', () => {
      global.game = mockV13Game;
      
      expect(CompatibilityUtils.getFoundryVersion())
        .toBeString()
        .toStartWith('13');
      
      expect(CompatibilityUtils.isV13OrLater()).toBeTrue();
      expect(CompatibilityUtils.isV12()).toBeFalse();
    });

    test('should handle legacy version format', () => {
      global.game = mockLegacyGame;
      
      const version = CompatibilityUtils.getFoundryVersion();
      
      expect(version)
        .toBeString()
        .toBe('12.324');
      
      expect(CompatibilityUtils.isV12()).toBeTrue();
    });

    test('should fallback to default version', () => {
      global.game = {};
      
      const version = CompatibilityUtils.getFoundryVersion();
      
      expect(version)
        .toBeString()
        .toBe('12.0.0');
    });

    test('should handle missing game object', () => {
      global.game = null;
      
      expect(() => CompatibilityUtils.getFoundryVersion()).not.toThrow();
      expect(CompatibilityUtils.getFoundryVersion()).toBe('12.0.0');
    });
  });

  describe('Class and Collection Retrieval', () => {
    test('should get appropriate ActorSheet class', () => {
      // Mock v13 environment
      global.foundry = {
        appv1: {
          sheets: {
            ActorSheet: class MockV13ActorSheet {}
          }
        }
      };
      
      const ActorSheetClass = CompatibilityUtils.getActorSheetClass();
      expect(ActorSheetClass).toBeDefined();
      expect(typeof ActorSheetClass).toBe('function');
    });

    test('should fallback to v12 ActorSheet class', () => {
      global.foundry = {}; // No appv1
      global.ActorSheet = class MockV12ActorSheet {};
      
      const ActorSheetClass = CompatibilityUtils.getActorSheetClass();
      
      expect(ActorSheetClass).toBe(global.ActorSheet);
    });

    test('should get appropriate ItemSheet class', () => {
      global.foundry = {
        appv1: {
          sheets: {
            ItemSheet: class MockV13ItemSheet {}
          }
        }
      };
      
      const ItemSheetClass = CompatibilityUtils.getItemSheetClass();
      
      expect(ItemSheetClass).toBeDefined();
      expect(typeof ItemSheetClass).toBe('function');
    });

    test('should get appropriate collections', () => {
      // Test Actors collection
      global.foundry = {
        documents: {
          collections: {
            Actors: { name: 'v13-actors' }
          }
        }
      };
      
      const ActorsCollection = CompatibilityUtils.getActorsCollection();
      expect(ActorsCollection).toBeObject();
      
      // Test Items collection  
      global.foundry.documents.collections.Items = { name: 'v13-items' };
      const ItemsCollection = CompatibilityUtils.getItemsCollection();
      expect(ItemsCollection).toBeObject();
    });

    test('should fallback to v12 collections', () => {
      global.foundry = {}; // No documents.collections
      global.Actors = { name: 'v12-actors' };
      global.Items = { name: 'v12-items' };
      
      expect(CompatibilityUtils.getActorsCollection()).toBe(global.Actors);
      expect(CompatibilityUtils.getItemsCollection()).toBe(global.Items);
    });

    test('should get loadTemplates function', () => {
      global.foundry = {
        applications: {
          handlebars: {
            loadTemplates: () => 'v13-loadTemplates'
          }
        }
      };
      
      const loadTemplatesFunc = CompatibilityUtils.getLoadTemplatesFunction();
      
      expect(loadTemplatesFunc).toBeDefined();
      expect(typeof loadTemplatesFunc).toBe('function');
    });
  });

  describe('HTML Element Normalization', () => {
    test('should normalize jQuery objects to DOM elements', () => {
      const mockDOMElement = {
        nodeType: Node.ELEMENT_NODE,
        querySelectorAll: jest.fn()
      };
      
      const mockJQuery = {
        length: 1,
        0: mockDOMElement
      };
      Object.setPrototypeOf(mockJQuery, global.jQuery?.prototype || {});
      
      const result = CompatibilityUtils.normalizeHtmlForListeners(mockJQuery);
      
      expect(result).toBe(mockDOMElement);
      expect(result.querySelectorAll).toBeDefined();
    });

    test('should handle empty jQuery objects', () => {
      const emptyJQuery = { length: 0 };
      Object.setPrototypeOf(emptyJQuery, global.jQuery?.prototype || {});
      
      const result = CompatibilityUtils.normalizeHtmlForListeners(emptyJQuery);
      
      expect(result).toBeNull();
    });

    test('should handle comment nodes', () => {
      const commentNode = {
        nodeType: Node.COMMENT_NODE,
        nextElementSibling: {
          nodeType: Node.ELEMENT_NODE,
          querySelectorAll: jest.fn()
        }
      };
      
      const result = CompatibilityUtils.normalizeHtmlForListeners(commentNode);
      
      expect(result).toBe(commentNode.nextElementSibling);
    });

    test('should handle document fragments', () => {
      const formElement = {
        nodeType: Node.ELEMENT_NODE,
        querySelectorAll: jest.fn()
      };
      
      const mockQuerySelector = jest.fn().mockReturnValue(formElement);
      const documentFragment = {
        nodeType: Node.DOCUMENT_FRAGMENT_NODE,
        querySelector: mockQuerySelector,
        firstElementChild: formElement
      };
      
      const result = CompatibilityUtils.normalizeHtmlForListeners(documentFragment);
      
      expect(result).toBe(formElement);
      // Test that querySelector was called by checking call count
      expect(mockQuerySelector.mock.calls.length).toBe(1);
      expect(mockQuerySelector.mock.calls[0][0]).toBe('form');
    });

    test('should return null for invalid elements', () => {
      const invalidElement = { nodeType: Node.TEXT_NODE };
      
      const result = CompatibilityUtils.normalizeHtmlForListeners(invalidElement);
      
      expect(result).toBeNull();
    });

    test('should handle valid DOM elements directly', () => {
      const validElement = {
        nodeType: Node.ELEMENT_NODE,
        querySelectorAll: jest.fn()
      };
      
      const result = CompatibilityUtils.normalizeHtmlForListeners(validElement);
      
      expect(result).toBe(validElement);
    });
  });

  describe('Safe Listener Activation', () => {
    test('should safely activate listeners with valid HTML', () => {
      const mockElement = {
        nodeType: Node.ELEMENT_NODE,
        querySelectorAll: jest.fn()
      };
      
      const mockSheet = {};
      const mockSuperMethod = jest.fn();
      const mockjQuery = jest.fn().mockReturnValue('wrapped-element');
      
      // Mock jQuery constructor
      global.$ = mockjQuery;
      
      expect(() => {
        CompatibilityUtils.safeActivateListeners(mockSheet, mockElement, mockSuperMethod);
      }).not.toThrow();
      
      // Test calls by examining mock.calls arrays
      expect(mockSuperMethod.mock.calls.length).toBe(1);
      expect(mockSuperMethod.mock.calls[0][0]).toBe('wrapped-element');
      expect(mockjQuery.mock.calls.length).toBe(1);
      expect(mockjQuery.mock.calls[0][0]).toBe(mockElement);
    });

    test('should handle errors gracefully', () => {
      const mockSheet = {};
      const mockSuperMethod = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      // Mock console.error to avoid noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        CompatibilityUtils.safeActivateListeners(mockSheet, null, mockSuperMethod);
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Feature Detection', () => {
    test('should detect foundry.appv1 availability', () => {
      global.game = mockV13Game;
      global.foundry = { appv1: {} };
      
      expect(CompatibilityUtils.isFeatureAvailable('foundry.appv1')).toBeTrue();
      
      global.foundry = {};
      expect(CompatibilityUtils.isFeatureAvailable('foundry.appv1')).toBeFalse();
    });

    test('should detect applicationV1 availability', () => {
      global.game = mockV13Game;
      expect(CompatibilityUtils.isFeatureAvailable('applicationV1')).toBeTrue();
      
      global.game = mockV12Game;
      expect(CompatibilityUtils.isFeatureAvailable('applicationV1')).toBeFalse();
    });

    test('should detect document collections availability', () => {
      global.game = mockV13Game;
      global.foundry = {
        documents: {
          collections: {}
        }
      };
      
      expect(CompatibilityUtils.isFeatureAvailable('documentCollections')).toBeTrue();
      
      global.foundry = {};
      expect(CompatibilityUtils.isFeatureAvailable('documentCollections')).toBeFalse();
    });

    test('should handle unknown features', () => {
      expect(CompatibilityUtils.isFeatureAvailable('unknown-feature')).toBeFalsy();
    });
  });

  describe('Version-Aware Logging', () => {
    test('should handle logging without throwing errors', () => {
      global.game = { version: '13.291' };
      
      expect(() => {
        CompatibilityUtils.log('Test message');
      }).not.toThrow();
      
      expect(() => {
        CompatibilityUtils.log('Warning message', 'warn');
      }).not.toThrow();
      
      expect(() => {
        CompatibilityUtils.log('Error message', 'error');
      }).not.toThrow();
    });

    test('should handle different log levels without errors', () => {
      global.game = { version: '12.331' };
      
      expect(() => {
        CompatibilityUtils.log('Info message', 'info');
        CompatibilityUtils.log('Warning message', 'warn');
        CompatibilityUtils.log('Error message', 'error');
      }).not.toThrow();
    });

    test('should handle logging with missing game version', () => {
      const originalGame = global.game;
      global.game = {};
      
      expect(() => {
        CompatibilityUtils.log('Test message');
      }).not.toThrow();
      
      global.game = originalGame;
    });
  });

  describe('Chat Context Menu Approach', () => {
    test('should return v13 approach for v13+', () => {
      global.game = mockV13Game;
      
      const approach = CompatibilityUtils.getChatContextMenuApproach();
      
      expect(approach)
        .toBeString()
        .toBe('v13');
    });

    test('should return v12 approach for v12', () => {
      global.game = mockV12Game;
      
      const approach = CompatibilityUtils.getChatContextMenuApproach();
      
      expect(approach)
        .toBeString()
        .toBe('v12');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle completely missing global objects', () => {
      const originalFoundry = global.foundry;
      const originalGame = global.game;
      
      global.foundry = undefined;
      global.game = undefined;
      
      expect(() => {
        CompatibilityUtils.getFoundryVersion();
        CompatibilityUtils.isV12();
        CompatibilityUtils.isV13OrLater();
        CompatibilityUtils.getActorSheetClass();
        CompatibilityUtils.getItemSheetClass();
      }).not.toThrow();
      
      // Restore globals
      global.foundry = originalFoundry;
      global.game = originalGame;
    });

    test('should handle malformed version strings', () => {
      global.game = { version: 'invalid-version' };
      
      expect(() => {
        CompatibilityUtils.isV12();
        CompatibilityUtils.isV13OrLater();
      }).not.toThrow();
    });

    test('should handle circular reference in HTML normalization', () => {
      const circularElement = {
        nodeType: Node.ELEMENT_NODE,
        querySelectorAll: jest.fn()
      };
      circularElement.self = circularElement;
      
      expect(() => {
        CompatibilityUtils.normalizeHtmlForListeners(circularElement);
      }).not.toThrow();
    });

    test('should maintain backwards compatibility', () => {
      // Test that all methods exist and return reasonable defaults
      const methods = [
        'getFoundryVersion',
        'isV12',
        'isV13OrLater',
        'getActorSheetClass',
        'getItemSheetClass',
        'getActorsCollection',
        'getItemsCollection',
        'getLoadTemplatesFunction',
        'normalizeHtmlForListeners',
        'getChatContextMenuApproach'
      ];
      
      methods.forEach(method => {
        expect(CompatibilityUtils[method])
          .toBeDefined()
          .toBeFunction();
      });
    });

    test('should preserve performance under stress', () => {
      const startTime = Date.now();
      
      // Run version detection many times
      for (let i = 0; i < 1000; i++) {
        CompatibilityUtils.getFoundryVersion();
        CompatibilityUtils.isV12();
        CompatibilityUtils.isV13OrLater();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
}); 