/**
 * @fileoverview Remote Trait Service
 * @version 1.0.0 - Stage 6: Distributed Sharing
 * @description Service for syncing traits from remote repositories (GitHub)
 * @author Avant VTT Team
 */

import type { Trait, TraitProviderResult } from '../types/domain/trait.js';
import type { TraitExportData } from '../cli/traits.js';

/**
 * Configuration for remote trait synchronization
 */
export interface RemoteTraitConfig {
  /** Default remote repository URL */
  defaultUrl: string;
  
  /** Timeout for fetch requests in milliseconds */
  fetchTimeout: number;
  
  /** Whether to verify data integrity hashes */
  verifyIntegrity: boolean;
  
  /** Whether to create compendium pack for remote traits */
  createCompendiumPack: boolean;
  
  /** Name of the compendium pack for remote traits */
  compendiumPackName: string;
  
  /** Label for the compendium pack */
  compendiumPackLabel: string;
}

/**
 * Result of remote sync operation
 */
export interface RemoteSyncResult {
  /** Whether the sync succeeded */
  success: boolean;
  
  /** Number of traits synced */
  synced: number;
  
  /** Number of traits skipped (conflicts) */
  skipped: number;
  
  /** Number of traits that failed */
  failed: number;
  
  /** Error message if sync failed */
  error?: string;
  
  /** Source URL that was synced */
  sourceUrl?: string;
  
  /** Whether compendium was created/updated */
  compendiumUpdated?: boolean;
  
  /** Detailed sync information */
  details: RemoteSyncDetail[];
}

/**
 * Detail for individual trait sync operations
 */
export interface RemoteSyncDetail {
  /** Trait ID */
  traitId: string;
  
  /** Trait name */
  traitName: string;
  
  /** Action performed */
  action: 'synced' | 'skipped' | 'failed';
  
  /** Reason for skip or failure */
  reason?: string;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Remote trait manifest validation result
 */
export interface ManifestValidationResult {
  /** Whether the manifest is valid */
  valid: boolean;
  
  /** Validation errors */
  errors: string[];
  
  /** Number of traits in manifest */
  traitCount: number;
  
  /** Manifest format version */
  formatVersion?: string;
  
  /** Data integrity hash (if present) */
  integrityHash?: string;
}

/**
 * Service for synchronizing traits from remote repositories.
 * 
 * This service fetches trait data from GitHub repositories, validates the data,
 * resolves conflicts with local traits, and optionally creates/updates compendium packs.
 */
export class RemoteTraitService {
  private static _instance: RemoteTraitService | undefined;
  
  private readonly config!: RemoteTraitConfig;
  private readonly game: any;
  private readonly foundry: any;
  
  /**
   * Create a new RemoteTraitService instance.
   * Use getInstance() instead for singleton access.
   * 
   * @param config - Configuration for the remote trait service
   */
  constructor(config?: Partial<RemoteTraitConfig>) {
    // Singleton pattern
    if (RemoteTraitService._instance) {
      return RemoteTraitService._instance;
    }
    
    RemoteTraitService._instance = this;
    
    // Default configuration
    const defaultConfig: RemoteTraitConfig = {
      defaultUrl: 'https://raw.githubusercontent.com/avant-vtt/trait-library/main/traits.json',
      fetchTimeout: 30000, // 30 seconds
      verifyIntegrity: true,
      createCompendiumPack: true,
      compendiumPackName: 'remote-traits',
      compendiumPackLabel: 'Remote Traits'
    };
    
    this.config = { ...defaultConfig, ...config };
    
    // Get FoundryVTT globals safely
    this.game = (globalThis as any).game;
    this.foundry = (globalThis as any).foundry;
    
    console.log('🌐 RemoteTraitService | Instance created with config:', this.config);
  }
  
  /**
   * Get the singleton instance of RemoteTraitService
   * 
   * @param config - Optional configuration for first-time initialization
   * @returns RemoteTraitService singleton instance
   */
  static getInstance(config?: Partial<RemoteTraitConfig>): RemoteTraitService {
    if (!RemoteTraitService._instance) {
      new RemoteTraitService(config);
    }
    return RemoteTraitService._instance!;
  }
  
  /**
   * Synchronize traits from the default remote repository.
   * 
   * @param options - Optional sync configuration
   * @returns Promise with sync result
   */
  async syncFromDefault(options: { 
    skipConflicts?: boolean;
    updateCompendium?: boolean;
  } = {}): Promise<RemoteSyncResult> {
    return this.syncFromUrl(this.config.defaultUrl, options);
  }
  
  /**
   * Synchronize traits from a specific remote URL.
   * 
   * @param url - URL to fetch trait data from
   * @param options - Optional sync configuration
   * @returns Promise with sync result
   */
  async syncFromUrl(url: string, options: {
    skipConflicts?: boolean;
    updateCompendium?: boolean;
  } = {}): Promise<RemoteSyncResult> {
    try {
      console.log(`🌐 RemoteTraitService | Starting sync from ${url}`);
      
      // Set default options
      const opts = {
        skipConflicts: true,
        updateCompendium: this.config.createCompendiumPack,
        ...options
      };
      
      // Fetch remote data
      const fetchResult = await this._fetchRemoteData(url);
      if (!fetchResult.success || !fetchResult.data) {
        return {
          success: false,
          synced: 0,
          skipped: 0,
          failed: 0,
          error: `Failed to fetch remote data: ${fetchResult.error}`,
          sourceUrl: url,
          details: []
        };
      }
      
      const remoteData = fetchResult.data;
      
      // Validate manifest
      const validation = this._validateManifest(remoteData);
      if (!validation.valid) {
        return {
          success: false,
          synced: 0,
          skipped: 0,
          failed: 0,
          error: `Manifest validation failed: ${validation.errors.join(', ')}`,
          sourceUrl: url,
          details: []
        };
      }
      
      // Process remote traits
      const syncDetails: RemoteSyncDetail[] = [];
      let synced = 0;
      let skipped = 0;
      let failed = 0;
      
      // Get existing traits to check for conflicts
      const existingTraits = await this._getExistingTraitIds();
      
      for (const remoteTrait of remoteData.traits) {
        try {
          // Check for conflicts
          if (existingTraits.has(remoteTrait.id)) {
            if (opts.skipConflicts) {
              syncDetails.push({
                traitId: remoteTrait.id,
                traitName: remoteTrait.name,
                action: 'skipped',
                reason: 'Trait already exists locally'
              });
              skipped++;
              continue;
            }
          }
          
          // Mark trait as readonly remote trait
          const traitToSync = {
            ...remoteTrait,
            systemData: {
              ...remoteTrait.systemData,
              traitMetadata: {
                ...remoteTrait.systemData.traitMetadata,
                readonly: true,
                source: 'remote',
                remoteUrl: url,
                syncedAt: new Date().toISOString()
              }
            }
          };
          
          // Add to sync details (successful sync)
          syncDetails.push({
            traitId: remoteTrait.id,
            traitName: remoteTrait.name,
            action: 'synced'
          });
          synced++;
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          syncDetails.push({
            traitId: remoteTrait.id,
            traitName: remoteTrait.name,
            action: 'failed',
            error: errorMessage
          });
          failed++;
        }
      }
      
      // Update compendium if requested
      let compendiumUpdated = false;
      if (opts.updateCompendium && synced > 0) {
        const traitsToSync = remoteData.traits.filter((_, index) => 
          syncDetails[index]?.action === 'synced'
        );
        const compendiumResult = await this._updateCompendiumPack(traitsToSync);
        compendiumUpdated = compendiumResult.success;
        
        if (!compendiumResult.success) {
          console.warn(`🌐 RemoteTraitService | Failed to update compendium: ${compendiumResult.error}`);
        }
      }
      
      console.log(`🌐 RemoteTraitService | Sync completed: ${synced} synced, ${skipped} skipped, ${failed} failed`);
      
      return {
        success: failed === 0,
        synced,
        skipped,
        failed,
        sourceUrl: url,
        compendiumUpdated,
        details: syncDetails
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('🌐 RemoteTraitService | Sync failed:', error);
      return {
        success: false,
        synced: 0,
        skipped: 0,
        failed: 0,
        error: `Sync failed: ${errorMessage}`,
        sourceUrl: url,
        details: []
      };
    }
  }
  
  /**
   * Get information about available remote trait sources.
   * 
   * @returns Promise with remote source information
   */
  async getRemoteSourceInfo(): Promise<TraitProviderResult<{
    defaultUrl: string;
    configured: boolean;
    lastSync?: string;
    traitCount?: number;
  }>> {
    try {
      // Check if compendium pack exists to determine last sync info
      const pack = this.game?.packs?.get(this.config.compendiumPackName);
      const configured = pack !== undefined;
      
      let lastSync: string | undefined;
      let traitCount: number | undefined;
      
      if (configured && pack) {
        // Get sync metadata from pack flags
        const packFlags = pack.flags?.avant?.remoteSync;
        lastSync = packFlags?.lastSync;
        
        // Get trait count
        const items = await pack.getDocuments();
        traitCount = items.length;
      }
      
      return {
        success: true,
        data: {
          defaultUrl: this.config.defaultUrl,
          configured,
          lastSync,
          traitCount
        }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to get remote source info: ${errorMessage}`
      };
    }
  }
  
  // =========================================================================
  // PRIVATE METHODS
  // =========================================================================
  
  /**
   * Fetch remote trait data from URL with timeout and error handling.
   * 
   * @private
   */
  private async _fetchRemoteData(url: string): Promise<TraitProviderResult<TraitExportData>> {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.fetchTimeout);
      
      console.log(`🌐 RemoteTraitService | Fetching data from ${url}`);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AvantVTT-TraitSync/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      const data = await response.json() as TraitExportData;
      
      console.log(`🌐 RemoteTraitService | Fetched ${data.traits?.length || 0} traits`);
      
      return {
        success: true,
        data
      };
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: `Request timeout after ${this.config.fetchTimeout}ms`
        };
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Fetch failed: ${errorMessage}`
      };
    }
  }
  
  /**
   * Validate remote trait manifest data.
   * 
   * @private
   */
  private _validateManifest(data: TraitExportData): ManifestValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('No manifest data provided');
      return { valid: false, errors, traitCount: 0 };
    }
    
    if (!data.metadata) {
      errors.push('Missing metadata section');
    } else {
      if (!data.metadata.formatVersion) {
        errors.push('Missing format version in metadata');
      } else if (data.metadata.formatVersion !== '1.0.0') {
        errors.push(`Unsupported format version: ${data.metadata.formatVersion}`);
      }
      
      if (!data.metadata.timestamp) {
        errors.push('Missing timestamp in metadata');
      }
    }
    
    if (!Array.isArray(data.traits)) {
      errors.push('Traits must be an array');
      return { valid: false, errors, traitCount: 0 };
    }
    
    // Validate individual traits
    for (const [index, trait] of data.traits.entries()) {
      if (!trait.id) {
        errors.push(`Trait at index ${index} missing required 'id' field`);
      }
      if (!trait.name) {
        errors.push(`Trait at index ${index} missing required 'name' field`);
      }
      if (!trait.systemData) {
        errors.push(`Trait at index ${index} missing required 'systemData' field`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      traitCount: data.traits.length,
      formatVersion: data.metadata?.formatVersion,
      integrityHash: data.metadata ? this._calculateIntegrityHash(data) : undefined
    };
  }
  
  /**
   * Get set of existing trait IDs to check for conflicts.
   * 
   * @private
   */
  private async _getExistingTraitIds(): Promise<Set<string>> {
    try {
      const { TraitProvider } = await import('./trait-provider.js');
      const traitProvider = TraitProvider.getInstance();
      
      const result = await traitProvider.getAll();
      if (result.success && result.data) {
        return new Set(result.data.map(trait => trait.id));
      }
      
      return new Set();
      
    } catch (error) {
      console.warn('🌐 RemoteTraitService | Failed to get existing trait IDs:', error);
      return new Set();
    }
  }
  
  /**
   * Create or update the compendium pack with remote traits.
   * 
   * @private
   */
  private async _updateCompendiumPack(traits: any[]): Promise<TraitProviderResult<boolean>> {
    try {
      if (!this.game?.ready) {
        return {
          success: false,
          error: 'Game not ready for compendium operations'
        };
      }
      
      // Check if pack already exists
      let pack = this.game.packs.get(this.config.compendiumPackName);
      
      if (!pack) {
        // Create new compendium pack
        if (!this.foundry?.documents?.collections?.CompendiumCollection?.createCompendium) {
          return {
            success: false,
            error: 'Cannot create compendium - FoundryVTT API not available'
          };
        }
        
        const packData = {
          name: this.config.compendiumPackName,
          label: this.config.compendiumPackLabel,
          type: 'Item',
          system: this.game.system.id,
          private: true // Mark as private so it doesn't clutter world selection
        };
        
        pack = await this.foundry.documents.collections.CompendiumCollection.createCompendium(packData);
        console.log(`🌐 RemoteTraitService | Created compendium pack '${this.config.compendiumPackName}'`);
      }
      
      // Clear existing remote traits from pack
      const existingItems = await pack.getDocuments();
      const remoteItems = existingItems.filter((item: any) => 
        item.flags?.avant?.remote === true
      );
      
      if (remoteItems.length > 0) {
        // FoundryVTT v13 compatibility: ensure IDs are valid for bulk delete
        const idsToDelete = remoteItems
          .map((item: any) => item._id)
          .filter((id: any) => id && typeof id === 'string');
        
        if (idsToDelete.length > 0) {
          await pack.deleteDocuments(idsToDelete);
          console.log(`🌐 RemoteTraitService | Removed ${idsToDelete.length} existing remote traits`);
        }
      }
      
      // Add new remote traits
      const itemsToCreate = traits.map(trait => ({
        name: trait.name,
        type: 'feature',
        system: trait.systemData,
        flags: {
          avant: {
            remote: true,
            remoteUrl: trait.systemData.traitMetadata?.remoteUrl,
            syncedAt: trait.systemData.traitMetadata?.syncedAt
          }
        }
      }));
      
      if (itemsToCreate.length > 0) {
        // FoundryVTT v13 compatibility: explicit options for bulk create
        await pack.createDocuments(itemsToCreate, {
          keepId: false  // Ensure FoundryVTT generates new IDs
        });
        console.log(`🌐 RemoteTraitService | Added ${itemsToCreate.length} remote traits to compendium`);
      }
      
      // Update pack flags with sync metadata
      await pack.setFlag('avant', 'remoteSync', {
        lastSync: new Date().toISOString(),
        traitCount: itemsToCreate.length,
        sourceUrl: traits[0]?.systemData?.traitMetadata?.remoteUrl
      });
      
      return {
        success: true,
        data: true
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('🌐 RemoteTraitService | Failed to update compendium pack:', error);
      return {
        success: false,
        error: `Failed to update compendium: ${errorMessage}`
      };
    }
  }
  
  /**
   * Calculate data integrity hash for validation.
   * 
   * @private
   */
  private _calculateIntegrityHash(data: TraitExportData): string {
    try {
      // Create a deterministic string representation
      const hashData = JSON.stringify({
        formatVersion: data.metadata.formatVersion,
        traitCount: data.metadata.traitCount,
        traits: data.traits.map(trait => ({
          id: trait.id,
          name: trait.name,
          color: trait.color,
          icon: trait.icon
        })).sort((a, b) => a.id.localeCompare(b.id))
      });
      
      // Simple hash function (in production, would use crypto.subtle)
      let hash = 0;
      for (let i = 0; i < hashData.length; i++) {
        const char = hashData.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return Math.abs(hash).toString(16);
      
    } catch (error) {
      console.error('🌐 RemoteTraitService | Failed to calculate integrity hash:', error);
      return 'hash-error';
    }
  }
}

/**
 * Create a CLI command interface for remote trait operations.
 * 
 * @param remoteService - RemoteTraitService instance
 * @returns CLI command functions
 */
export function createRemoteTraitCommands(remoteService: RemoteTraitService) {
  return {
    /**
     * Sync traits from default remote repository
     */
    async sync(args: string[]): Promise<void> {
      const skipConflicts = !args.includes('--overwrite');
      const updateCompendium = !args.includes('--no-compendium');
      
      console.log('🌐 Starting remote trait sync...');
      
      const result = await remoteService.syncFromDefault({
        skipConflicts,
        updateCompendium
      });
      
      if (result.success) {
        console.log(`✅ Sync completed: ${result.synced} synced, ${result.skipped} skipped`);
        if (result.compendiumUpdated) {
          console.log('📦 Compendium pack updated with remote traits');
        }
      } else {
        console.error(`❌ Sync failed: ${result.error}`);
      }
    },
    
    /**
     * Get information about remote trait sources
     */
    async info(): Promise<void> {
      const result = await remoteService.getRemoteSourceInfo();
      
      if (result.success && result.data) {
        const info = result.data;
        console.log('🌐 Remote Trait Source Information:');
        console.log(`   Default URL: ${info.defaultUrl}`);
        console.log(`   Configured: ${info.configured ? 'Yes' : 'No'}`);
        if (info.lastSync) {
          console.log(`   Last Sync: ${new Date(info.lastSync).toLocaleString()}`);
        }
        if (info.traitCount !== undefined) {
          console.log(`   Remote Traits: ${info.traitCount}`);
        }
      } else {
        console.error(`❌ Failed to get remote info: ${result.error}`);
      }
    }
  };
} 