/**
 * @fileoverview TagRegistryService implementation
 * @version 1.0.0
 * @description Service for managing tag definitions with in-memory store and JSON file loading
 * @author Avant VTT Team
 */

import type {
  TagDefinition,
  TagFilterOptions,
  TagRegistryResult,
  TagRegistryConfig,
  TagRegistryHookData
} from '../types/domain/tag.ts';

/**
 * Service for managing tag definitions used across the trait system.
 * 
 * This service provides a centralized registry of tag definitions loaded from
 * a JSON file, with in-memory caching and event emission for updates.
 */
export class TagRegistryService {
  private static _instance: TagRegistryService | undefined;
  
  private readonly config!: TagRegistryConfig;
  private tags: Map<string, TagDefinition> = new Map();
  private isInitialized = false;
  private lastLoadTime = 0;

  /**
   * Create a new TagRegistryService instance.
   * Use getInstance() instead for singleton access.
   * 
   * @param config - Configuration for the tag registry
   */
  constructor(config?: Partial<TagRegistryConfig>) {
    // Singleton pattern
    if (TagRegistryService._instance) {
      return TagRegistryService._instance;
    }
    
    TagRegistryService._instance = this;
    
    // Default configuration
    const defaultConfig: TagRegistryConfig = {
      defaultTagsPath: undefined, // Disable default tags loading
      enableCaching: true,
      cacheTimeout: 300000 // 5 minutes
    };
    
    this.config = { ...defaultConfig, ...config };
    
    console.log('🏷️ TagRegistryService | Instance created with config:', this.config);
  }
  
  /**
   * Get the singleton instance of TagRegistryService
   * 
   * @param config - Optional configuration for first-time initialization
   * @returns TagRegistryService singleton instance
   */
  static getInstance(config?: Partial<TagRegistryConfig>): TagRegistryService {
    if (!TagRegistryService._instance) {
      new TagRegistryService(config);
    }
    return TagRegistryService._instance!;
  }

  /**
   * Initialize the tag registry by loading default tags from JSON file.
   * 
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<TagRegistryResult<boolean>> {
    try {
      console.log('🏷️ TagRegistryService | Starting initialization...');
      
      // Load default tags from JSON file (if path is configured)
      if (this.config.defaultTagsPath) {
        const loadResult = await this.loadDefaultTags();
        if (!loadResult.success) {
          console.warn(`🏷️ TagRegistryService | Failed to load default tags: ${loadResult.error}`);
          // Continue initialization without default tags
        }
      } else {
        console.log('🏷️ TagRegistryService | No default tags path configured, skipping default tags load');
      }
      
      this.isInitialized = true;
      this.lastLoadTime = Date.now();
      
      // Emit initialization hook
      this._emitTagsUpdatedHook('loaded');
      
      console.log(`🏷️ TagRegistryService | Initialized successfully with ${this.tags.size} tags`);
      
      return {
        success: true,
        data: true,
        metadata: {
          tagsLoaded: this.tags.size,
          source: 'default-json'
        }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('🏷️ TagRegistryService | Initialization failed:', error);
      return {
        success: false,
        error: `TagRegistryService initialization failed: ${errorMessage}`
      };
    }
  }

  /**
   * Load default tags from the JSON file.
   * 
   * @private
   * @returns Promise that resolves when tags are loaded
   */
  private async loadDefaultTags(): Promise<TagRegistryResult<TagDefinition[]>> {
    try {
      const response = await fetch(this.config.defaultTagsPath!);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.status} ${response.statusText}`);
      }
      
      const jsonData = await response.json();
      
      if (!jsonData || !Array.isArray(jsonData.tags)) {
        throw new Error('Invalid JSON format: expected object with "tags" array');
      }
      
      // Clear existing tags and load new ones
      this.tags.clear();
      
      const loadedTags: TagDefinition[] = [];
      for (const tagData of jsonData.tags) {
        if (this.validateTagDefinition(tagData)) {
          this.tags.set(tagData.id, tagData);
          loadedTags.push(tagData);
        } else {
          console.warn('🏷️ TagRegistryService | Invalid tag definition skipped:', tagData);
        }
      }
      
      console.log(`🏷️ TagRegistryService | Loaded ${loadedTags.length} tags from JSON`);
      
      return {
        success: true,
        data: loadedTags,
        metadata: { loadedCount: loadedTags.length }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('🏷️ TagRegistryService | Failed to load default tags:', error);
      return {
        success: false,
        error: `Failed to load default tags: ${errorMessage}`
      };
    }
  }

  /**
   * Validate a tag definition object.
   * 
   * @private
   * @param tagData - The tag data to validate
   * @returns True if valid
   */
  private validateTagDefinition(tagData: any): tagData is TagDefinition {
    return (
      tagData &&
      typeof tagData.id === 'string' &&
      tagData.id.length > 0 &&
      typeof tagData.label === 'string' &&
      tagData.label.length > 0
    );
  }

  /**
   * Get all tags, optionally filtered by criteria.
   * 
   * @param options - Filter options for tags
   * @returns Array of tag definitions
   */
  getAll(options?: TagFilterOptions): TagDefinition[] {
    try {
      let tags = Array.from(this.tags.values());
      
      if (!options) {
        return tags;
      }
      
      // Filter by single category
      if (options.category) {
        tags = tags.filter(tag => 
          tag.categories?.includes(options.category!)
        );
      }
      
      // Filter by multiple categories
      if (options.categories && options.categories.length > 0) {
        tags = tags.filter(tag =>
          tag.categories?.some(cat => options.categories!.includes(cat))
        );
      }
      
      // Filter by search text
      if (options.search && options.search.trim()) {
        const searchTerm = options.caseSensitive ? 
          options.search.trim() : 
          options.search.trim().toLowerCase();
          
        tags = tags.filter(tag => {
          const label = options.caseSensitive ? tag.label : tag.label.toLowerCase();
          const id = options.caseSensitive ? tag.id : tag.id.toLowerCase();
          
          return label.includes(searchTerm) || id.includes(searchTerm);
        });
      }
      
      return tags;
      
    } catch (error) {
      console.error('🏷️ TagRegistryService | Error filtering tags:', error);
      return [];
    }
  }

  /**
   * Get a specific tag by ID.
   * 
   * @param id - The tag ID to find
   * @returns The tag definition or undefined if not found
   */
  getById(id: string): TagDefinition | undefined {
    return this.tags.get(id);
  }

  /**
   * Add or update a tag definition.
   * 
   * @param tagDef - The tag definition to add/update
   * @returns Promise that resolves when the operation is complete
   */
  async addOrUpdate(tagDef: TagDefinition): Promise<TagRegistryResult<TagDefinition>> {
    try {
      if (!this.validateTagDefinition(tagDef)) {
        return {
          success: false,
          error: 'Invalid tag definition: missing required fields (id, label)'
        };
      }
      
      const isUpdate = this.tags.has(tagDef.id);
      this.tags.set(tagDef.id, { ...tagDef });
      
      // Emit hook for tag update
      this._emitTagsUpdatedHook(isUpdate ? 'updated' : 'added', tagDef);
      
      console.log(`🏷️ TagRegistryService | ${isUpdate ? 'Updated' : 'Added'} tag '${tagDef.id}'`);
      
      return {
        success: true,
        data: tagDef,
        metadata: { action: isUpdate ? 'updated' : 'added' }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('🏷️ TagRegistryService | Failed to add/update tag:', error);
      return {
        success: false,
        error: `Failed to add/update tag: ${errorMessage}`
      };
    }
  }

  /**
   * Remove a tag by ID.
   * 
   * @param id - The tag ID to remove
   * @returns Promise that resolves when the operation is complete
   */
  async remove(id: string): Promise<TagRegistryResult<boolean>> {
    try {
      const existingTag = this.tags.get(id);
      
      if (!existingTag) {
        return {
          success: false,
          error: `Tag '${id}' not found`
        };
      }
      
      this.tags.delete(id);
      
      // Emit hook for tag removal
      this._emitTagsUpdatedHook('removed', existingTag);
      
      console.log(`🏷️ TagRegistryService | Removed tag '${id}'`);
      
      return {
        success: true,
        data: true,
        metadata: { removedTag: existingTag }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('🏷️ TagRegistryService | Failed to remove tag:', error);
      return {
        success: false,
        error: `Failed to remove tag: ${errorMessage}`
      };
    }
  }

  /**
   * Check if the service is initialized and ready to use.
   * 
   * @returns True if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get the total number of tags in the registry.
   * 
   * @returns Number of tags
   */
  getCount(): number {
    return this.tags.size;
  }

  /**
   * Get tags that match a specific search query.
   * 
   * @param query - Search query
   * @param maxResults - Maximum number of results to return
   * @returns Array of matching tags
   */
  search(query: string, maxResults: number = 10): TagDefinition[] {
    if (!query || query.trim().length === 0) {
      return this.getAll().slice(0, maxResults);
    }
    
    const searchOptions: TagFilterOptions = {
      search: query.trim(),
      caseSensitive: false
    };
    
    return this.getAll(searchOptions).slice(0, maxResults);
  }

  /**
   * Emit the avantTagsUpdated hook.
   * 
   * @private
   * @param action - The action that occurred
   * @param tag - The tag that was affected (optional)
   */
  private _emitTagsUpdatedHook(action: 'added' | 'updated' | 'removed' | 'loaded', tag?: TagDefinition): void {
    try {
      const hookData: TagRegistryHookData = {
        action,
        tags: this.getAll(),
        tag,
        context: {
          totalTags: this.tags.size,
          timestamp: Date.now()
        }
      };
      
      // Try Foundry v13 hooks first, then fall back to global Hooks
      const foundry = (globalThis as any).foundry;
      const globalHooks = (globalThis as any).Hooks;
      
      if (foundry?.utils?.hooks?.call) {
        foundry.utils.hooks.call('avantTagsUpdated', hookData);
      } else if (globalHooks?.call) {
        globalHooks.call('avantTagsUpdated', hookData);
      } else {
        console.warn('🏷️ TagRegistryService | No hook system available for avantTagsUpdated');
      }
      
      console.log(`🏷️ TagRegistryService | Emitted avantTagsUpdated hook for action: ${action}`);
      
    } catch (error) {
      console.error('🏷️ TagRegistryService | Failed to emit avantTagsUpdated hook:', error);
    }
  }
} 