/**
 * @fileoverview TraitProvider Service
 * @version 2.0.0 - Stage 3: Compendium Integration  
 * @description Service for managing trait data from system and world compendium packs using CompendiumLocalService
 * @author Avant VTT Team
 */

import type {
  Trait,
  TraitSource,
  FoundryTraitItem,
  TraitItemSystemData,
  TraitProviderConfig,
  TraitProviderResult,
  TraitCacheEntry,
  TraitRetrievalOptions,
  CompendiumPackInfo
} from '../types/domain/trait.js';
import { CompendiumLocalService } from './compendium-local-service.ts';

/**
 * Service that provides access to trait data from both system and world compendium packs.
 * 
 * This service waits for FoundryVTT initialization, merges traits from multiple sources,
 * provides caching for performance, automatically creates world packs if needed, and 
 * seeds custom traits with defaults from the system pack using CompendiumLocalService.
 */
export class TraitProvider {
  private static _instance: TraitProvider | undefined;

  private readonly config!: TraitProviderConfig;
  private cache: TraitCacheEntry | null = null;
  private isInitialized = false;
  private readonly foundry: any;
  private readonly game: any;
  private readonly compendiumService!: CompendiumLocalService;

  /**
   * Create a new TraitProvider instance.
   * Use getInstance() instead for singleton access.
   * 
   * @param config - Configuration for the trait provider
   */
  constructor(config?: Partial<TraitProviderConfig>) {
    // Singleton pattern
    if (TraitProvider._instance) {
      return TraitProvider._instance;
    }

    TraitProvider._instance = this;

    // Default configuration - explicit assignment to fix TypeScript error
    const defaultConfig: TraitProviderConfig = {
      systemPackName: 'avant.avant-traits',
      worldPackName: 'world.custom-traits',  // Use proper world pack format for v13
      worldPackLabel: 'Custom Traits',
      itemType: 'trait', // Use trait type to avoid collision with future feature items
      enableCaching: true,
      cacheTimeout: 300000 // 5 minutes
    };

    this.config = { ...defaultConfig, ...config };

    // Get FoundryVTT globals safely
    this.foundry = (globalThis as any).foundry;
    this.game = (globalThis as any).game;

    // Initialize CompendiumLocalService for pack operations
    this.compendiumService = new CompendiumLocalService();

    console.log('🏷️ TraitProvider | Instance created with config:', this.config);
  }

  /**
   * Get the singleton instance of TraitProvider
   * 
   * @param config - Optional configuration for first-time initialization
   * @returns TraitProvider singleton instance
   */
  static getInstance(config?: Partial<TraitProviderConfig>): TraitProvider {
    if (!TraitProvider._instance) {
      new TraitProvider(config);
    }
    return TraitProvider._instance!;
  }

  /**
   * Initialize the trait provider by waiting for FoundryVTT, setting up packs, and seeding custom traits.
   * 
   * This method ensures the world pack exists, loads the seed pack (system traits), compares them with
   * the custom pack, and copies any missing default traits to ensure the world always has the standard
   * 8 traits available. After seeding, it loads all traits to populate the cache.
   * 
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<TraitProviderResult<boolean>> {
    try {
      console.log('🏷️ TraitProvider | Starting initialization...');

      // Verify FoundryVTT is ready
      if (!this.game?.ready) {
        return {
          success: false,
          error: 'FoundryVTT game not ready - cannot initialize TraitProvider'
        };
      }

      // Ensure world pack exists
      const worldPackResult = await this.ensureWorldPackExists();
      if (!worldPackResult.success) {
        return {
          success: false,
          error: `Failed to ensure world pack exists: ${worldPackResult.error}`
        };
      }

      // Seed custom traits from system pack using CompendiumLocalService
      let traitsSeeded = 0;
      try {
        console.log('🏷️ TraitProvider | Starting trait seeding process...');

        // Load seed pack (system traits) and custom pack
        const seedDocs = await this.compendiumService.loadPack(this.config.systemPackName);
        const customDocs = await this.compendiumService.loadPack(this.config.worldPackName);

        // Compare packs to find missing traits in custom pack
        const diff = await this.compendiumService.diffLocalPacks(this.config.systemPackName, this.config.worldPackName);

        if (diff.added.length > 0) {
          console.log(`🏷️ TraitProvider | Found ${diff.added.length} traits missing from custom pack, copying...`);

          // Copy missing traits to custom pack
          await this.compendiumService.copyDocs(
            this.config.systemPackName,
            this.config.worldPackName,
            {
              filter: (doc) => diff.added.some(addedDoc => addedDoc.name === doc.name),
              preserveIds: false
            }
          );

          traitsSeeded = diff.added.length;

          // Emit seeding hook
          const seedHookData = {
            copied: traitsSeeded,
            targetPack: this.config.worldPackName
          };

          if (this.foundry?.utils?.hooks?.call) {
            this.foundry.utils.hooks.call('avantTraitSeeded', seedHookData);
          } else if ((globalThis as any).Hooks?.call) {
            (globalThis as any).Hooks.call('avantTraitSeeded', seedHookData);
          }

          console.log(`🏷️ TraitProvider | Seeded ${traitsSeeded} traits to custom pack`);
        } else {
          console.log('🏷️ TraitProvider | All default traits already present in custom pack');
        }

      } catch (seedError) {
        // Log seeding error but don't fail initialization - custom traits may still exist
        const seedErrorMessage = seedError instanceof Error ? seedError.message : String(seedError);
        console.warn(`🏷️ TraitProvider | Trait seeding failed, continuing with existing traits: ${seedErrorMessage}`);
      }

      // Load initial traits to populate cache
      const traitsResult = await this.getAll({ forceRefresh: true });
      if (!traitsResult.success) {
        return {
          success: false,
          error: `Failed to load initial traits: ${traitsResult.error}`
        };
      }

      // Emit hook for each initially loaded trait
      if (traitsResult.data) {
        for (const trait of traitsResult.data) {
          this._emitTraitRegisteredHook(trait, 'initialized');
        }
      }

      this.isInitialized = true;
      console.log(`🏷️ TraitProvider | Initialized successfully with ${traitsResult.data?.length || 0} traits (${traitsSeeded} newly seeded)`);

      return {
        success: true,
        data: true,
        metadata: {
          traitsLoaded: traitsResult.data?.length || 0,
          traitsSeeded,
          systemPackExists: await this.checkPackExists('system'),
          worldPackExists: await this.checkPackExists('world')
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('🏷️ TraitProvider | Initialization failed:', error);
      return {
        success: false,
        error: `TraitProvider initialization failed: ${errorMessage}`
      };
    }
  }

  /**
   * Get all available traits from both system and world packs.
   * 
   * @param options - Options for trait retrieval
   * @returns All available traits
   */
  async getAll(options: TraitRetrievalOptions = {}): Promise<TraitProviderResult<Trait[]>> {
    try {
      const opts = {
        includeSystem: true,
        includeWorld: true,
        forceRefresh: false,
        ...options
      };

      // Check cache first (if not forcing refresh)
      if (!opts.forceRefresh && this.config.enableCaching && this.cache) {
        const cacheAge = Date.now() - this.cache.timestamp;
        if (cacheAge < this.config.cacheTimeout!) {
          console.log('🏷️ TraitProvider | Returning cached traits');
          return {
            success: true,
            data: this.filterTraits(this.cache.traits, opts),
            metadata: { source: 'cache', cacheAge }
          };
        }
      }

      // Load traits from packs
      const allTraits: Trait[] = [];
      const sources: TraitSource[] = [];

      if (opts.includeSystem) {
        const systemTraits = await this.loadTraitsFromPack('system');
        if (systemTraits.success && systemTraits.data) {
          allTraits.push(...systemTraits.data);
          sources.push('system');
        }
      }

      if (opts.includeWorld) {
        const worldTraits = await this.loadTraitsFromPack('world');
        if (worldTraits.success && worldTraits.data) {
          allTraits.push(...worldTraits.data);
          sources.push('world');
        }
      }

      // Deduplicate traits (world takes precedence over system)
      const deduplicatedTraits = this.deduplicateTraits(allTraits);

      // Update cache
      if (this.config.enableCaching) {
        this.cache = {
          traits: deduplicatedTraits,
          timestamp: Date.now(),
          sources
        };
      }

      console.log(`🏷️ TraitProvider | Loaded ${deduplicatedTraits.length} traits from ${sources.join(', ')}`);

      return {
        success: true,
        data: this.filterTraits(deduplicatedTraits, opts),
        metadata: {
          sources,
          totalTraits: deduplicatedTraits.length,
          loadedFrom: 'packs'
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('🏷️ TraitProvider | Failed to get all traits:', error);
      return {
        success: false,
        error: `Failed to get traits: ${errorMessage}`
      };
    }
  }

  /**
   * Get a specific trait by ID.
   * 
   * @param id - The trait ID to find
   * @param options - Options for trait retrieval
   * @returns The requested trait or null if not found
   */
  async get(id: string, options: TraitRetrievalOptions = {}): Promise<TraitProviderResult<Trait | null>> {
    try {
      const allTraitsResult = await this.getAll(options);

      if (!allTraitsResult.success || !allTraitsResult.data) {
        return {
          success: false,
          error: `Failed to load traits: ${allTraitsResult.error}`
        };
      }

      const trait = allTraitsResult.data.find(t => t.id === id) || null;

      return {
        success: true,
        data: trait,
        metadata: { searchedId: id, found: trait !== null }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`🏷️ TraitProvider | Failed to get trait '${id}':`, error);
      return {
        success: false,
        error: `Failed to get trait: ${errorMessage}`
      };
    }
  }

  /**
   * Synchronous lookup of a trait by ID using the in-memory cache.
   *
   * Handlebars helpers run synchronously, so they cannot await the asynchronous
   * {@link get} method.  This convenience wrapper allows template-level helpers
   * (`traitNameFromId`, `traitIconFromId`, etc.) to resolve traits instantly
   * once the provider has already been initialized and its cache populated.
   *
   * IMPORTANT:  If the cache has not been populated yet this will return `null`.
   * Callers that require a guaranteed result should fall back to the async
   * {@link get} method.
   *
   * @param id  The trait document ID to resolve.
   * @returns   The matching {@link Trait} or `null` if not found / not cached.
   */
  public getTraitById(id: string): Trait | null {
    if (!id) return null;

    // If cache exists, attempt direct lookup.
    if (this.cache && Array.isArray(this.cache.traits)) {
      const trait = this.cache.traits.find(t => t.id === id) || null;
      return trait;
    }

    // No cache available – return null (template helper will fall back).
    return null;
  }

  /**
   * Find a trait by flexible reference lookup
   * 
   * CRITICAL FEATURE: This method was added to solve the trait display issue where
   * items could reference traits using various ID formats, but the provider only
   * supported exact document ID lookups.
   * 
   * THE PROBLEM WE SOLVED:
   * - Items stored trait references as: "Fire", "Ice", "system_trait_fire", old IDs like "jNreUvVJ5HZsxCXM"
   * - TraitProvider only looked up by exact document ID: "avant-trait-fire"
   * - Result: Most trait lookups failed, showing gray boxes with IDs
   * 
   * THE SOLUTION - MULTIPLE LOOKUP STRATEGIES:
   * This method tries to find traits using multiple approaches in order of preference:
   * 
   * 1. **Exact Document ID**: "avant-trait-fire" → matches trait.id directly
   * 2. **Exact Name Match**: "Fire" → finds trait where trait.name === "Fire"  
   * 3. **Case-Insensitive Name**: "FIRE" → finds trait where trait.name.toLowerCase() === "fire"
   * 4. **Legacy System ID**: "system_trait_fire" → legacy format support
   * 5. **Partial Name Match**: "fir" → finds trait where trait.name includes "fir"
   * 6. **Custom Trait Fallback**: Generate placeholder trait for unknown custom IDs
   * 
   * REAL-WORLD EXAMPLE:
   * - User adds "Fire" trait to an item (stores as "Fire" string)
   * - Actor sheet calls findByReference("Fire")
   * - Method tries document ID lookup (fails), then name lookup (succeeds!)
   * - Returns trait with proper color (#FF6B6B) and icon (fas fa-fire)
   * - Trait displays correctly instead of gray box
   * 
   * @param {string} reference - The trait reference to look up (ID, name, legacy format, etc.)
   * @param {TraitRetrievalOptions} options - Options for trait retrieval
   * @returns {Promise<TraitProviderResult<Trait | null>>} The found trait with metadata about how it was found
   */
  async findByReference(reference: string, options: TraitRetrievalOptions = {}): Promise<TraitProviderResult<Trait | null>> {
    try {
      if (!reference || reference.trim() === '') {
        return {
          success: true,
          data: null,
          metadata: { searchedReference: reference, reason: 'empty_reference' }
        };
      }

      const allTraitsResult = await this.getAll(options);

      if (!allTraitsResult.success || !allTraitsResult.data) {
        return {
          success: false,
          error: `Failed to load traits: ${allTraitsResult.error}`
        };
      }

      const cleanReference = reference.trim();
      let trait: Trait | null = null;
      let matchType: string = 'none';

      // Strategy 1: Exact document ID match
      trait = allTraitsResult.data.find(t => t.id === cleanReference) || null;
      if (trait) {
        matchType = 'document_id';
      }

      // Strategy 2: Exact name match (case-sensitive)
      if (!trait) {
        trait = allTraitsResult.data.find(t => t.name === cleanReference) || null;
        if (trait) {
          matchType = 'exact_name';
        }
      }

      // Strategy 3: Case-insensitive name match
      if (!trait) {
        const lowerReference = cleanReference.toLowerCase();
        trait = allTraitsResult.data.find(t => t.name.toLowerCase() === lowerReference) || null;
        if (trait) {
          matchType = 'case_insensitive_name';
        }
      }

      // Strategy 4: Legacy system ID pattern (system_trait_<name>)
      if (!trait && cleanReference.startsWith('system_trait_')) {
        const legacyName = cleanReference
          .replace(/^system_trait_/, '')         // Remove prefix
          .replace(/_\d+$/, '')                  // Remove timestamp suffix if present
          .replace(/_/g, ' ')                    // Replace underscores with spaces
          .split(' ')                            // Split into words
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
          .join(' ');                            // Join back together

        // Try exact match first
        trait = allTraitsResult.data.find(t => t.name === legacyName) || null;

        // If not found, try case-insensitive
        if (!trait) {
          trait = allTraitsResult.data.find(t => t.name.toLowerCase() === legacyName.toLowerCase()) || null;
        }

        if (trait) {
          matchType = 'legacy_system_id';
        }
      }

      // Strategy 5: Simple name normalization (handle single words)
      if (!trait) {
        const normalizedReference = cleanReference.charAt(0).toUpperCase() + cleanReference.slice(1).toLowerCase();
        trait = allTraitsResult.data.find(t => t.name === normalizedReference) || null;
        if (trait) {
          matchType = 'normalized_name';
        }
      }

      // Strategy 6: Custom trait fallback
      if (!trait) {
        console.log(`🏷️ TraitProvider | Creating fallback trait for unknown reference: ${reference}`);

        // Use the actual reference as the ID, or clean it up for display
        const fallbackId = reference;
        const fallbackName = cleanReference.replace(/[_-]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase()); // Title case

        const placeholderTrait: Trait = {
          id: fallbackId,
          name: fallbackName,
          color: '#6C757D', // Bootstrap secondary gray
          icon: 'fas fa-tag', // Tag icon for unknown traits
          localKey: `CUSTOM.Trait.${cleanReference.replace(/[^a-zA-Z0-9]/g, '')}`,
          description: `Custom trait: ${fallbackName}`,
          textColor: '#FFFFFF', // White text on gray background
          source: 'world',
          tags: ['custom', 'fallback'],
          item: {
            _id: fallbackId,
            name: fallbackName,
            type: 'trait',
            system: {
              color: '#6C757D',
              icon: 'fas fa-tag',
              localKey: `CUSTOM.Trait.${cleanReference.replace(/[^a-zA-Z0-9]/g, '')}`,
              description: `Custom trait: ${fallbackName}`,
              textColor: '#FFFFFF',
              tags: ['custom', 'fallback']
            },
            img: undefined,
            sort: 0,
            flags: {}
          }
        };
        trait = placeholderTrait;
        matchType = 'custom_fallback';
      }

      return {
        success: true,
        data: trait,
        metadata: {
          searchedReference: cleanReference,
          found: trait !== null,
          matchType,
          traitId: trait?.id,
          traitName: trait?.name
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`🏷️ TraitProvider | Failed to find trait by reference '${reference}':`, error);
      return {
        success: false,
        error: `Failed to find trait by reference: ${errorMessage}`
      };
    }
  }

  /**
   * Check if the TraitProvider is initialized and ready to use.
   * 
   * @returns True if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Clear the internal cache, forcing next request to reload from packs.
   */
  clearCache(): void {
    this.cache = null;
    console.log('🏷️ TraitProvider | Cache cleared');
  }

  /**
   * Get information about both system and world compendium packs.
   * 
   * @returns Information about trait compendium packs
   */
  async getPackInfo(): Promise<TraitProviderResult<{ system: CompendiumPackInfo; world: CompendiumPackInfo }>> {
    try {
      const systemPack = await this.getPackInfo_internal('system');
      const worldPack = await this.getPackInfo_internal('world');

      return {
        success: true,
        data: { system: systemPack, world: worldPack }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to get pack info: ${errorMessage}`
      };
    }
  }

  /**
   * Create a new trait in the world pack.
   * 
   * @param traitData - Data for the new trait
   * @returns Result with the created trait
   */
  async createTrait(traitData: Partial<FoundryTraitItem>): Promise<TraitProviderResult<Trait | null>> {
    try {
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'TraitProvider not initialized'
        };
      }

      const worldPack = this.game.packs.get(this.config.worldPackName);
      if (!worldPack) {
        return {
          success: false,
          error: 'World pack not found'
        };
      }

      // Create the item in the world pack
      const itemData = {
        name: traitData.name || 'New Trait',
        type: this.config.itemType,
        system: traitData.system || {},
        ...traitData
      };

      const [createdItem] = await worldPack.createDocuments([itemData]);

      if (!createdItem) {
        return {
          success: false,
          error: 'Failed to create trait item'
        };
      }

      // Convert to trait object
      const trait = this.convertItemToTrait(createdItem, 'world');

      if (trait) {
        // Clear cache to force reload
        this.clearCache();

        // Emit hook for trait registration
        this._emitTraitRegisteredHook(trait, 'created');

        console.log(`🏷️ TraitProvider | Created trait '${trait.name}' in world pack`);
      }

      return {
        success: true,
        data: trait,
        metadata: {
          itemId: createdItem._id,
          packName: this.config.worldPackName
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('🏷️ TraitProvider | Failed to create trait:', error);
      return {
        success: false,
        error: `Failed to create trait: ${errorMessage}`
      };
    }
  }

  /**
   * Update an existing trait in the world pack.
   * 
   * @param traitId - ID of the trait to update
   * @param updateData - Data to update
   * @returns Result with the updated trait
   */
  async updateTrait(traitId: string, updateData: Partial<FoundryTraitItem>): Promise<TraitProviderResult<Trait | null>> {
    try {
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'TraitProvider not initialized'
        };
      }

      const worldPack = this.game.packs.get(this.config.worldPackName);
      if (!worldPack) {
        return {
          success: false,
          error: 'World pack not found'
        };
      }

      // Find the existing item
      const existingItem = worldPack.get(traitId);
      if (!existingItem) {
        return {
          success: false,
          error: 'Trait not found in world pack'
        };
      }

      // Update the item
      await existingItem.update(updateData);

      // Convert to trait object
      const trait = this.convertItemToTrait(existingItem, 'world');

      if (trait) {
        // Clear cache to force reload
        this.clearCache();

        // Emit hook for trait registration
        this._emitTraitRegisteredHook(trait, 'updated');

        console.log(`🏷️ TraitProvider | Updated trait '${trait.name}' in world pack`);
      }

      return {
        success: true,
        data: trait,
        metadata: {
          itemId: traitId,
          packName: this.config.worldPackName
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('🏷️ TraitProvider | Failed to update trait:', error);
      return {
        success: false,
        error: `Failed to update trait: ${errorMessage}`
      };
    }
  }

  /**
   * Delete a trait from the world pack.
   * 
   * @param traitId - ID of the trait to delete
   * @returns Result indicating success or failure
   */
  async deleteTrait(traitId: string): Promise<TraitProviderResult<boolean>> {
    try {
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'TraitProvider not initialized'
        };
      }

      const worldPack = this.game.packs.get(this.config.worldPackName);
      if (!worldPack) {
        return {
          success: false,
          error: 'World pack not found'
        };
      }

      // Find the existing item
      const existingItem = worldPack.get(traitId);
      if (!existingItem) {
        return {
          success: false,
          error: 'Trait not found in world pack'
        };
      }

      // Convert to trait object before deletion for the hook
      const trait = this.convertItemToTrait(existingItem, 'world');

      // Delete the item
      await existingItem.delete();

      // Clear cache to force reload
      this.clearCache();

      // Emit hook for trait deletion
      if (trait) {
        this._emitTraitDeletedHook(trait);
      }

      console.log(`🏷️ TraitProvider | Deleted trait '${existingItem.name}' from world pack`);

      return {
        success: true,
        data: true,
        metadata: {
          itemId: traitId,
          packName: this.config.worldPackName
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('🏷️ TraitProvider | Failed to delete trait:', error);
      return {
        success: false,
        error: `Failed to delete trait: ${errorMessage}`
      };
    }
  }

  /**
   * Search traits by name and tags
   * 
   * @param searchTerm - The search term to look for
   * @param options - Options for trait retrieval and search
   * @returns Matching traits
   */
  async search(searchTerm: string, options: TraitRetrievalOptions = {}): Promise<TraitProviderResult<Trait[]>> {
    try {
      const allTraitsResult = await this.getAll(options);

      if (!allTraitsResult.success || !allTraitsResult.data) {
        return {
          success: false,
          error: `Failed to load traits for search: ${allTraitsResult.error}`
        };
      }

      const searchTermLower = searchTerm.toLowerCase().trim();

      if (!searchTermLower) {
        // Return all traits if no search term
        return allTraitsResult;
      }

      const matchingTraits = allTraitsResult.data.filter(trait => {
        // Search in trait name
        if (trait.name.toLowerCase().includes(searchTermLower)) {
          return true;
        }

        // Search in trait tags
        if (trait.tags && trait.tags.length > 0) {
          return trait.tags.some(tag => tag.toLowerCase().includes(searchTermLower));
        }

        // Search in legacy metadata tags for backward compatibility
        if (trait.item.system.traitMetadata?.tags && trait.item.system.traitMetadata.tags.length > 0) {
          return trait.item.system.traitMetadata.tags.some(tag => tag.toLowerCase().includes(searchTermLower));
        }

        return false;
      });

      console.log(`🏷️ TraitProvider | Search for '${searchTerm}' found ${matchingTraits.length} matches`);

      return {
        success: true,
        data: matchingTraits,
        metadata: {
          searchTerm,
          totalTraits: allTraitsResult.data.length,
          matchCount: matchingTraits.length
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`🏷️ TraitProvider | Failed to search traits for '${searchTerm}':`, error);
      return {
        success: false,
        error: `Failed to search traits: ${errorMessage}`
      };
    }
  }

  // =========================================================================
  // PRIVATE METHODS
  // =========================================================================

  /**
   * Load traits from a specific pack (system or world) using CompendiumLocalService
   * 
   * This method uses the CompendiumLocalService for consistent pack management and
   * then converts the loaded documents to Trait objects. It maintains compatibility
   * with the existing trait filtering and conversion logic while leveraging the
   * new compendium framework.
   * 
   * @private
   */
  private async loadTraitsFromPack(source: TraitSource): Promise<TraitProviderResult<Trait[]>> {
    try {
      const packName = source === 'system' ? this.config.systemPackName : this.config.worldPackName;


      // Use CompendiumLocalService to load documents
      let items;
      try {
        items = await this.compendiumService.loadPack(packName);
      } catch (loadError) {
        // If pack doesn't exist or can't be loaded, that's not necessarily an error
        const errorMsg = loadError instanceof Error ? loadError.message : String(loadError);

        // If it's a "not found" error, return empty result rather than failing
        if (errorMsg.includes('not found')) {
          return {
            success: true, // Not finding a pack is not an error
            data: []
          };
        }

        // Re-throw other errors
        throw loadError;
      }

      // If system pack is empty, this means the build process didn't populate it correctly
      if (items.length === 0 && source === 'system') {
      }


      const traits: Trait[] = [];
      let processedCount = 0;
      let skippedCount = 0;
      let convertedCount = 0;

      for (const item of items) {
        processedCount++;

        // For system pack, only process items of the configured type (feature)
        // For world pack, allow any item type if it has the required trait properties
        if (source === 'system') {
          if (item.type !== this.config.itemType) {
            skippedCount++;
            continue;
          }
        } else {
          // For world pack, check if the item has trait properties regardless of item type
          // localKey is optional for custom/world traits since they don't need localization
          const system = item.system;
          const hasTraitProperties = !!(system?.color && system?.icon);

          if (!hasTraitProperties) {
            const missingProps = [];
            if (!system?.color) missingProps.push('color');
            if (!system?.icon) missingProps.push('icon');
            skippedCount++;
            continue;
          } else {
          }
        }

        const trait = this.convertItemToTrait(item, source);
        if (trait) {
          traits.push(trait);
          convertedCount++;
        } else {
          skippedCount++;
        }
      }

      console.log(`🏷️ TraitProvider | Loaded ${traits.length} traits from ${source} pack '${packName}' via CompendiumLocalService`);

      return {
        success: true,
        data: traits
      };
    } catch (error) {
      console.error(`🏷️ TraitProvider | Error loading traits from ${source} pack:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
      };
    }
  }

  /**
   * Convert a FoundryVTT item to a Trait object
   * 
   * @private
   */
  private convertItemToTrait(item: any, source: TraitSource): Trait | null {
    try {

      const system = item.system as TraitItemSystemData;

      // For new trait items, validate required properties
      if (item.type === 'trait') {
        if (!system.color || !system.icon) {
          return null;
        }
      } else {
        // For legacy feature items used as traits, validate required trait properties
        // localKey is optional for world/custom traits since they don't need localization
        if (!system.color || !system.icon || (source === 'system' && !system.localKey)) {
          const missingProps = [];
          if (!system.color) missingProps.push('color');
          if (!system.icon) missingProps.push('icon');
          if (source === 'system' && !system.localKey) missingProps.push('localKey');
          return null;
        }
      }


      // Generate ID with fallback strategy if item._id is null
      let traitId = item._id || item.id;
      if (!traitId) {
        // Generate a stable, deterministic ID based on name and source (NO timestamp)
        const sanitizedName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        traitId = `${source}_trait_${sanitizedName}`;
      }

      const trait: Trait = {
        id: traitId,
        name: item.name,
        color: system.color,
        icon: system.icon,
        localKey: system.localKey || `CUSTOM.Trait.${item.name.replace(/[^a-zA-Z0-9]/g, '')}`,
        description: system.description,
        textColor: system.textColor || '#000000', // Add missing textColor property with fallback
        source,
        tags: system.tags || [], // Include tags for search functionality
        item: {
          _id: traitId,
          name: item.name,
          type: item.type,
          system: system,
          img: item.img,
          sort: item.sort,
          flags: item.flags
        }
      };

      return trait;

    } catch (error) {
      console.error(`🏷️ TRAIT DEBUG | Failed to convert item '${item.name}' to trait:`, error);
      console.error(`🏷️ TRAIT DEBUG | Error stack:`, (error as Error)?.stack || 'No stack trace');
      return null;
    }
  }

  /**
   * Remove duplicate traits, preferring world traits over system traits
   * 
   * @private
   */
  private deduplicateTraits(traits: Trait[]): Trait[] {
    const traitMap = new Map<string, Trait>();


    // First add all system traits (use trait name as key, not ID)
    for (const trait of traits) {
      if (trait.source === 'system') {
        traitMap.set(trait.name, trait);
      }
    }

    // Then add world traits, which will override system traits with same name
    for (const trait of traits) {
      if (trait.source === 'world') {
        traitMap.set(trait.name, trait);
      }
    }

    const result = Array.from(traitMap.values());

    return result;
  }

  /**
   * Filter traits based on retrieval options
   * 
   * @private
   */
  private filterTraits(traits: Trait[], options: TraitRetrievalOptions): Trait[] {
    let filtered = traits;

    // Filter by categories
    if (options.categories?.length) {
      filtered = filtered.filter(trait => {
        const categories = trait.item.system.traitMetadata?.categories || [];
        return options.categories!.some(cat => categories.includes(cat));
      });
    }

    // Filter by tags
    if (options.tags?.length) {
      filtered = filtered.filter(trait => {
        const tags = trait.item.system.traitMetadata?.tags || [];
        return options.tags!.some(tag => tags.includes(tag));
      });
    }

    return filtered;
  }

  /**
   * Ensure the world compendium pack exists, creating it if necessary
   * 
   * @private
   */
  private async ensureWorldPackExists(): Promise<TraitProviderResult<boolean>> {
    try {
      const packExists = await this.checkPackExists('world');

      if (packExists) {
        console.log('🏷️ TraitProvider | World pack already exists');
        return { success: true, data: true };
      }

      // Create the world pack
      console.log('🏷️ TraitProvider | Creating world pack...');

      const packData = {
        name: this.config.worldPackName,
        label: this.config.worldPackLabel,
        path: `./packs/${this.config.worldPackName}.db`,
        type: 'Item',
        system: this.game.system.id
      };

      await (this.foundry as any).documents.collections.CompendiumCollection.createCompendium(packData);

      console.log(`🏷️ TraitProvider | World pack '${this.config.worldPackName}' created successfully`);

      return { success: true, data: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if error is about pack already existing - this is not actually an error
      if (errorMessage.includes('already exists') || errorMessage.includes('cannot be created')) {
        console.log('🏷️ TraitProvider | World pack already exists (detected via error), continuing...');
        return { success: true, data: true };
      }

      console.error('🏷️ TraitProvider | Failed to ensure world pack exists:', error);
      return {
        success: false,
        error: `Failed to create world pack: ${errorMessage}`
      };
    }
  }

  /**
   * Check if a specific pack exists
   * 
   * @private
   */
  private async checkPackExists(source: TraitSource): Promise<boolean> {
    try {
      const packName = source === 'system' ? this.config.systemPackName : this.config.worldPackName;
      const pack = this.game?.packs?.get(packName);
      return pack !== undefined && pack !== null;
    } catch (error) {
      console.error(`🏷️ TraitProvider | Error checking if ${source} pack exists:`, error);
      return false;
    }
  }

  /**
   * Get detailed information about a specific pack
   * 
   * @private
   */
  private async getPackInfo_internal(source: TraitSource): Promise<CompendiumPackInfo> {
    const packName = source === 'system' ? this.config.systemPackName : this.config.worldPackName;
    const packLabel = source === 'system' ? 'Avant Traits' : this.config.worldPackLabel;

    try {
      const pack = this.game?.packs?.get(packName);
      const exists = pack !== undefined && pack !== null;

      return {
        name: packName,
        label: packLabel,
        exists,
        accessible: exists && pack.visible !== false,
        collection: exists ? pack : undefined
      };

    } catch (error) {
      console.error(`🏷️ TraitProvider | Error getting pack info for ${source}:`, error);
      return {
        name: packName,
        label: packLabel,
        exists: false,
        accessible: false
      };
    }
  }

  /**
   * Emit the 'avantTraitRegistered' hook for plugin integration.
   * 
   * @private
   * @param trait - The trait that was registered/updated
   * @param action - The action that occurred ('created', 'updated', 'initialized')
   */
  private _emitTraitRegisteredHook(trait: Trait, action: 'created' | 'updated' | 'initialized'): void {
    try {
      const hookData = {
        trait: trait,
        action: action,
        source: trait.source,
        timestamp: new Date().toISOString(),
        provider: this
      };

      // Emit the hook for plugins to listen to
      if (this.foundry?.utils?.hooks?.call) {
        this.foundry.utils.hooks.call('avantTraitRegistered', hookData);
        // ✅ NEW: Also emit avantTagsUpdated hook to trigger autocomplete index rebuild
        this.foundry.utils.hooks.call('avantTagsUpdated', []);
      } else if ((globalThis as any).Hooks?.call) {
        (globalThis as any).Hooks.call('avantTraitRegistered', hookData);
        // ✅ NEW: Also emit avantTagsUpdated hook to trigger autocomplete index rebuild
        (globalThis as any).Hooks.call('avantTagsUpdated', []);
      }

    } catch (error) {
      console.error('🏷️ TraitProvider | Failed to emit trait registered hook:', error);
    }
  }

  /**
   * Emit the 'avantTraitDeleted' hook for plugin integration.
   * 
   * @private
   * @param trait - The trait that was deleted
   */
  private _emitTraitDeletedHook(trait: Trait): void {
    try {
      const hookData = {
        trait: trait,
        action: 'deleted' as const,
        source: trait.source,
        timestamp: new Date().toISOString(),
        provider: this
      };

      // Emit the hook for plugins to listen to
      if (this.foundry?.utils?.hooks?.call) {
        this.foundry.utils.hooks.call('avantTraitDeleted', hookData);
      } else if ((globalThis as any).Hooks?.call) {
        (globalThis as any).Hooks.call('avantTraitDeleted', hookData);
      }

      console.log(`🏷️ TraitProvider | Emitted 'avantTraitDeleted' hook for trait '${trait.name}'`);

    } catch (error) {
      console.error('🏷️ TraitProvider | Failed to emit trait deleted hook:', error);
    }
  }
}

