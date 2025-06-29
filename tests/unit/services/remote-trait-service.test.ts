/**
 * @fileoverview Unit Tests for RemoteTraitService
 * @version 1.0.0 - Stage 6: Distributed Sharing
 * @description Comprehensive tests for remote trait synchronization
 * @author Avant VTT Team
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { RemoteTraitService, type RemoteSyncResult, type RemoteTraitConfig } from '@/services/remote-trait-service.ts';
import type { TraitExportData } from '@/cli/traits.ts';

// Mock fetch globally
const mockFetch = jest.fn();
Object.defineProperty(globalThis, 'fetch', {
  value: mockFetch,
  writable: true,
  configurable: true
});

// Mock AbortController
class MockAbortController {
  signal = { aborted: false };
  abort() {
    this.signal.aborted = true;
  }
}
Object.defineProperty(globalThis, 'AbortController', {
  value: MockAbortController,
  writable: true,
  configurable: true
});

describe('RemoteTraitService', () => {
  let service: RemoteTraitService;
  let mockGame: any;
  let mockFoundry: any;
  
  beforeEach(() => {
    // Reset singleton
    (RemoteTraitService as any)._instance = undefined;
    
    // Mock game object
    mockGame = {
      ready: true,
      system: { id: 'avant' },
      packs: new Map()
    };
    
    // Mock foundry object
    mockFoundry = {
      documents: {
        collections: {
          CompendiumCollection: {
            createCompendium: jest.fn().mockResolvedValue({
              name: 'remote-traits',
              getDocuments: jest.fn().mockResolvedValue([]),
              deleteDocuments: jest.fn().mockResolvedValue(true),
              createDocuments: jest.fn().mockResolvedValue(true),
              setFlag: jest.fn().mockResolvedValue(true)
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
    
    // Clear fetch mock
    mockFetch.mockClear();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Constructor and Singleton', () => {
    test('should create instance with default configuration', () => {
      service = new RemoteTraitService();
      
      expect(service).toBeInstanceOf(RemoteTraitService);
      
      const config = (service as any).config;
      expect(config.defaultUrl).toContain('githubusercontent.com');
      expect(config.fetchTimeout).toBe(30000);
      expect(config.verifyIntegrity).toBe(true);
      expect(config.createCompendiumPack).toBe(true);
      expect(config.compendiumPackName).toBe('remote-traits');
    });
    
    test('should merge custom configuration with defaults', () => {
      const customConfig: Partial<RemoteTraitConfig> = {
        fetchTimeout: 60000,
        verifyIntegrity: false,
        compendiumPackName: 'custom-remote'
      };
      
      service = new RemoteTraitService(customConfig);
      
      const config = (service as any).config;
      expect(config.fetchTimeout).toBe(60000);
      expect(config.verifyIntegrity).toBe(false);
      expect(config.compendiumPackName).toBe('custom-remote');
      expect(config.defaultUrl).toContain('githubusercontent.com'); // Should still have default
    });
    
    test('should implement singleton pattern', () => {
      const service1 = RemoteTraitService.getInstance();
      const service2 = RemoteTraitService.getInstance();
      
      expect(service1).toBe(service2);
    });
  });
  
  describe('syncFromDefault', () => {
    beforeEach(() => {
      service = RemoteTraitService.getInstance();
    });
    
    test('should call syncFromUrl with default URL', async () => {
      const mockSyncFromUrl = jest.spyOn(service, 'syncFromUrl').mockResolvedValue({
        success: true,
        synced: 5,
        skipped: 0,
        failed: 0,
        details: []
      });
      
      const result = await service.syncFromDefault();
      
      expect(mockSyncFromUrl).toHaveBeenCalledWith(
        expect.stringContaining('githubusercontent.com'),
        expect.any(Object)
      );
      expect(result.success).toBe(true);
      
      mockSyncFromUrl.mockRestore();
    });
    
    test('should pass options to syncFromUrl', async () => {
      const mockSyncFromUrl = jest.spyOn(service, 'syncFromUrl').mockResolvedValue({
        success: true,
        synced: 0,
        skipped: 0,
        failed: 0,
        details: []
      });
      
      await service.syncFromDefault({
        skipConflicts: false,
        updateCompendium: false
      });
      
      expect(mockSyncFromUrl).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          skipConflicts: false,
          updateCompendium: false
        })
      );
      
      mockSyncFromUrl.mockRestore();
    });
  });
  
  describe('syncFromUrl', () => {
    beforeEach(() => {
      service = RemoteTraitService.getInstance();
    });
    
    test('should successfully sync traits from valid URL', async () => {
      const mockTraitData: TraitExportData = {
        metadata: {
          timestamp: new Date().toISOString(),
          systemVersion: '1.0.0',
          traitCount: 2,
          formatVersion: '1.0.0',
          exportSource: 'system'
        },
        traits: [
          {
            id: 'fire',
            name: 'Fire',
            color: '#FF0000',
            icon: 'fas fa-fire',
            localKey: 'AVANT.Trait.Fire',
            source: 'system',
            systemData: {
              color: '#FF0000',
              icon: 'fas fa-fire',
              localKey: 'AVANT.Trait.Fire',
              traitMetadata: {}
            },
            exportedAt: new Date().toISOString()
          },
          {
            id: 'ice',
            name: 'Ice',
            color: '#0000FF',
            icon: 'fas fa-snowflake',
            localKey: 'AVANT.Trait.Ice',
            source: 'system',
            systemData: {
              color: '#0000FF',
              icon: 'fas fa-snowflake',
              localKey: 'AVANT.Trait.Ice',
              traitMetadata: {}
            },
            exportedAt: new Date().toISOString()
          }
        ]
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockTraitData)
      });
      
      // Mock TraitProvider.getAll to return empty (no conflicts)
      jest.doMock('@/services/trait-provider.ts', () => ({
        TraitProvider: {
          getInstance: () => ({
            getAll: jest.fn().mockResolvedValue({
              success: true,
              data: []
            })
          })
        }
      }));
      
      const result = await service.syncFromUrl('https://example.com/traits.json');
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.sourceUrl).toBe('https://example.com/traits.json');
    });
    
    test('should handle fetch timeout', async () => {
      jest.useFakeTimers();
      // Mock fetch to hang indefinitely
      mockFetch.mockImplementation(() => new Promise(() => {}));
      
      const promise = service.syncFromUrl('https://example.com/timeout.json');
      
      jest.runAllTimers();

      const result = await promise;
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      jest.useRealTimers();
    });
    
    test('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      const result = await service.syncFromUrl('https://example.com/notfound.json');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP 404');
    });
    
    test('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const result = await service.syncFromUrl('https://example.com/error.json');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Fetch failed: Network error');
    });
    
    test('should validate manifest format', async () => {
      const invalidData = {
        // Missing metadata
        traits: []
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(invalidData)
      });
      
      const result = await service.syncFromUrl('https://example.com/invalid.json');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Manifest validation failed');
    });
    
    test('should skip conflicting traits when skipConflicts is true', async () => {
      const mockTraitData: TraitExportData = {
        metadata: {
          timestamp: new Date().toISOString(),
          systemVersion: '1.0.0',
          traitCount: 1,
          formatVersion: '1.0.0',
          exportSource: 'system'
        },
        traits: [
          {
            id: 'existing-trait',
            name: 'Existing Trait',
            color: '#FF0000',
            icon: 'fas fa-fire',
            localKey: 'AVANT.Trait.Existing',
            source: 'system',
            systemData: {
              color: '#FF0000',
              icon: 'fas fa-fire',
              localKey: 'AVANT.Trait.Existing',
              traitMetadata: {}
            },
            exportedAt: new Date().toISOString()
          }
        ]
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockTraitData)
      });
      
      // Mock TraitProvider to return existing trait
      jest.doMock('@/services/trait-provider.ts', () => ({
        TraitProvider: {
          getInstance: () => ({
            getAll: jest.fn().mockResolvedValue({
              success: true,
              data: [{ id: 'existing-trait', name: 'Existing Trait' }]
            })
          })
        }
      }));
      
      const result = await service.syncFromUrl('https://example.com/conflicts.json', {
        skipConflicts: true
      });
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.details[0].action).toBe('skipped');
      expect(result.details[0].reason).toContain('already exists');
    });
  });
  
  describe('getRemoteSourceInfo', () => {
    beforeEach(() => {
      service = RemoteTraitService.getInstance();
    });
    
    test('should return basic info when no compendium exists', async () => {
      const result = await service.getRemoteSourceInfo();
      
      expect(result.success).toBe(true);
      expect(result.data?.defaultUrl).toContain('githubusercontent.com');
      expect(result.data?.configured).toBe(false);
    });
    
    test('should return extended info when compendium exists', async () => {
      const mockPack = {
        flags: {
          avant: {
            remoteSync: {
              lastSync: '2024-01-01T00:00:00.000Z',
              traitCount: 5
            }
          }
        },
        getDocuments: jest.fn().mockResolvedValue([{}, {}, {}, {}, {}])
      };
      
      mockGame.packs.set('remote-traits', mockPack);
      
      const result = await service.getRemoteSourceInfo();
      
      expect(result.success).toBe(true);
      expect(result.data?.configured).toBe(true);
      expect(result.data?.lastSync).toBe('2024-01-01T00:00:00.000Z');
      expect(result.data?.traitCount).toBe(5);
    });
    
    test('should handle errors gracefully', async () => {
      mockGame.packs.get = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const result = await service.getRemoteSourceInfo();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get remote source info');
    });
  });
  
  describe('_fetchRemoteData', () => {
    beforeEach(() => {
      service = RemoteTraitService.getInstance();
    });
    
    test('should include proper headers in fetch request', async () => {
      const mockData = {
        metadata: { formatVersion: '1.0.0', timestamp: '', traitCount: 0, exportSource: 'system' as const },
        traits: []
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData)
      });
      
      await (service as any)._fetchRemoteData('https://example.com/test.json');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/test.json',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'User-Agent': 'AvantVTT-TraitSync/1.0'
          })
        })
      );
    });
    
    test('should handle AbortController timeout', async () => {
      jest.useFakeTimers();
      // Create a service with short timeout for testing
      const shortTimeoutService = new RemoteTraitService({ fetchTimeout: 1 });
      
      // Mock fetch to delay longer than timeout
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const promise = (shortTimeoutService as any)._fetchRemoteData('https://example.com/slow.json');
      jest.runAllTimers();
      const result = await promise;
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      jest.useRealTimers();
    });
  });
  
  describe('_validateManifest', () => {
    beforeEach(() => {
      service = RemoteTraitService.getInstance();
    });
    
    test('should validate correct manifest format', () => {
      const validData: TraitExportData = {
        metadata: {
          timestamp: new Date().toISOString(),
          systemVersion: '1.0.0',
          traitCount: 1,
          formatVersion: '1.0.0',
          exportSource: 'system'
        },
        traits: [
          {
            id: 'test',
            name: 'Test Trait',
            color: '#FF0000',
            icon: 'fas fa-test',
            localKey: 'AVANT.Trait.Test',
            source: 'system',
            systemData: {
              color: '#FF0000',
              icon: 'fas fa-test',
              localKey: 'AVANT.Trait.Test'
            },
            exportedAt: new Date().toISOString()
          }
        ]
      };
      
      const result = (service as any)._validateManifest(validData);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.traitCount).toBe(1);
      expect(result.formatVersion).toBe('1.0.0');
    });
    
    test('should reject manifest with missing metadata', () => {
      const invalidData = {
        traits: []
      };
      
      const result = (service as any)._validateManifest(invalidData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing metadata section');
    });
    
    test('should reject manifest with unsupported format version', () => {
      const invalidData = {
        metadata: {
          formatVersion: '2.0.0',
          timestamp: new Date().toISOString(),
          systemVersion: '1.0.0',
          traitCount: 0,
          exportSource: 'system'
        },
        traits: []
      };
      
      const result = (service as any)._validateManifest(invalidData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unsupported format version: 2.0.0');
    });
    
    test('should validate individual trait structure', () => {
      const invalidData = {
        metadata: {
          formatVersion: '1.0.0',
          timestamp: new Date().toISOString(),
          systemVersion: '1.0.0',
          traitCount: 1,
          exportSource: 'system'
        },
        traits: [
          {
            // Missing required fields
            name: 'Incomplete Trait'
          }
        ]
      };
      
      const result = (service as any)._validateManifest(invalidData);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('missing required'))).toBe(true);
    });
    
    test('should handle null input', () => {
      const result = (service as any)._validateManifest(null);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No manifest data provided');
      expect(result.traitCount).toBe(0);
    });
  });
  
  describe('_updateCompendiumPack', () => {
    beforeEach(() => {
      service = RemoteTraitService.getInstance();
    });
    
    test('should create compendium pack if it does not exist', async () => {
      const mockTraits = [
        {
          name: 'Test Trait',
          systemData: {
            color: '#FF0000',
            icon: 'fas fa-test',
            localKey: 'AVANT.Trait.Test',
            traitMetadata: {
              remoteUrl: 'https://example.com',
              syncedAt: new Date().toISOString()
            }
          }
        }
      ];
      
      const result = await (service as any)._updateCompendiumPack(mockTraits);
      
      expect(result.success).toBe(true);
      expect(mockFoundry.documents.collections.CompendiumCollection.createCompendium).toHaveBeenCalled();
    });
    
    test('should handle game not ready', async () => {
      mockGame.ready = false;
      
      const result = await (service as any)._updateCompendiumPack([]);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Game not ready');
    });
    
    test('should handle missing FoundryVTT API', async () => {
      mockFoundry.documents.collections.CompendiumCollection.createCompendium = undefined;
      
      const result = await (service as any)._updateCompendiumPack([]);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('FoundryVTT API not available');
    });
    
    test('should remove existing remote traits before adding new ones', async () => {
      const mockExistingPack = {
        getDocuments: jest.fn().mockResolvedValue([
          {
            _id: 'old1',
            flags: { avant: { remote: true } }
          },
          {
            _id: 'old2',
            flags: { avant: { remote: false } }
          }
        ]),
        deleteDocuments: jest.fn().mockResolvedValue(true),
        createDocuments: jest.fn().mockResolvedValue(true),
        setFlag: jest.fn().mockResolvedValue(true)
      };
      
      mockGame.packs.set('remote-traits', mockExistingPack);
      
      const mockTraits = [
        {
          name: 'New Trait',
          systemData: {
            color: '#FF0000',
            icon: 'fas fa-new',
            localKey: 'AVANT.Trait.New',
            traitMetadata: {
              remoteUrl: 'https://example.com',
              syncedAt: new Date().toISOString()
            }
          }
        }
      ];
      
      const result = await (service as any)._updateCompendiumPack(mockTraits);
      
      expect(result.success).toBe(true);
      expect(mockExistingPack.deleteDocuments).toHaveBeenCalledWith(['old1']);
      expect(mockExistingPack.createDocuments).toHaveBeenCalled();
    });
  });
  
  describe('_calculateIntegrityHash', () => {
    beforeEach(() => {
      service = RemoteTraitService.getInstance();
    });
    
    test('should generate consistent hash for same data', () => {
      const data: TraitExportData = {
        metadata: {
          formatVersion: '1.0.0',
          traitCount: 2,
          timestamp: '',
          systemVersion: '',
          exportSource: 'system'
        },
        traits: [
          {
            id: 'fire',
            name: 'Fire',
            color: '#FF0000',
            icon: 'fas fa-fire',
            localKey: '',
            source: 'system',
            systemData: {} as any,
            exportedAt: ''
          },
          {
            id: 'ice',
            name: 'Ice',
            color: '#0000FF',
            icon: 'fas fa-snowflake',
            localKey: '',
            source: 'system',
            systemData: {} as any,
            exportedAt: ''
          }
        ]
      };
      
      const hash1 = (service as any)._calculateIntegrityHash(data);
      const hash2 = (service as any)._calculateIntegrityHash(data);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });
    
    test('should generate different hashes for different data', () => {
      const data1: TraitExportData = {
        metadata: {
          formatVersion: '1.0.0',
          traitCount: 1,
          timestamp: '',
          systemVersion: '',
          exportSource: 'system'
        },
        traits: [
          {
            id: 'fire',
            name: 'Fire',
            color: '#FF0000',
            icon: 'fas fa-fire',
            localKey: '',
            source: 'system',
            systemData: {} as any,
            exportedAt: ''
          }
        ]
      };
      
      const data2: TraitExportData = {
        metadata: {
          formatVersion: '1.0.0',
          traitCount: 1,
          timestamp: '',
          systemVersion: '',
          exportSource: 'system'
        },
        traits: [
          {
            id: 'ice',
            name: 'Ice',
            color: '#0000FF',
            icon: 'fas fa-snowflake',
            localKey: '',
            source: 'system',
            systemData: {} as any,
            exportedAt: ''
          }
        ]
      };
      
      const hash1 = (service as any)._calculateIntegrityHash(data1);
      const hash2 = (service as any)._calculateIntegrityHash(data2);
      
      expect(hash1).not.toBe(hash2);
    });
    
    test('should handle errors in hash calculation', () => {
      const corruptedData = {
        metadata: null,
        traits: [{ toJSON: () => { throw new Error('Circular reference'); } }]
      };
      
      const hash = (service as any)._calculateIntegrityHash(corruptedData);
      
      expect(hash).toBe('hash-error');
    });
  });
  
  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      service = RemoteTraitService.getInstance();
    });
    
    test('should handle exceptions in syncFromUrl', async () => {
      // Mock _fetchRemoteData to throw an error
      jest.spyOn(service as any, '_fetchRemoteData').mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      const result = await service.syncFromUrl('https://example.com/test.json');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Sync failed: Unexpected error');
    });
    
    test('should handle empty traits array', async () => {
      const emptyData: TraitExportData = {
        metadata: {
          timestamp: new Date().toISOString(),
          systemVersion: '1.0.0',
          traitCount: 0,
          formatVersion: '1.0.0',
          exportSource: 'system'
        },
        traits: []
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(emptyData)
      });
      
      const result = await service.syncFromUrl('https://example.com/empty.json');
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);
    });
    
    test('should handle partial sync failures', async () => {
      const mockTraitData: TraitExportData = {
        metadata: {
          timestamp: new Date().toISOString(),
          systemVersion: '1.0.0',
          traitCount: 2,
          formatVersion: '1.0.0',
          exportSource: 'system'
        },
        traits: [
          {
            id: 'valid-trait',
            name: 'Valid Trait',
            color: '#FF0000',
            icon: 'fas fa-check',
            localKey: 'AVANT.Trait.Valid',
            source: 'system',
            systemData: {
              color: '#FF0000',
              icon: 'fas fa-check',
              localKey: 'AVANT.Trait.Valid',
              traitMetadata: {}
            },
            exportedAt: new Date().toISOString()
          },
          // This will cause an error during processing
          null as any
        ]
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockTraitData)
      });
      
      const result = await service.syncFromUrl('https://example.com/partial.json');
      
      expect(result.success).toBe(false); // Should fail due to processing errors
      expect(result.failed).toBeGreaterThan(0);
    });
  });
}); 