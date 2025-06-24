/**
 * @fileoverview Trait Domain Types
 * @version 1.0.0 - Stage 1: Foundation
 * @description Type definitions for the Avant trait system
 * @author Avant VTT Team
 */

/**
 * A trait represents a characteristic or quality that can be applied to actors and items.
 * Traits are stored as items in compendium packs and provide visual/mechanical tags.
 */
export interface Trait {
  /** Unique identifier for the trait */
  id: string;
  
  /** Human-readable name of the trait */
  name: string;
  
  /** Hex color code for visual representation (e.g., "#FF6B6B") */
  color: string;
  
  /** Path to icon file or FontAwesome class (e.g., "fas fa-fire", "icons/fire.svg") */
  icon: string;
  
  /** Localization key for internationalization (e.g., "AVANT.Trait.Fire") */
  localKey: string;
  
  /** Optional description of what this trait represents */
  description?: string;
  
  /** Tags for filtering and categorization */
  tags?: string[];
  
  /** Whether this trait is from system pack (read-only) or world pack (editable) */
  source: TraitSource;
  
  /** Underlying FoundryVTT item reference */
  item: FoundryTraitItem;
}

/**
 * Source of a trait (system vs world)
 */
export type TraitSource = 'system' | 'world';

/**
 * FoundryVTT item structure for traits
 * These are stored as regular items with type matching one of the available item types
 */
export interface FoundryTraitItem {
  /** FoundryVTT item ID */
  _id: string;
  
  /** Item name */
  name: string;
  
  /** Item type (using existing types from system.json) */
  type: string;
  
  /** System-specific data containing trait properties */
  system: TraitItemSystemData;
  
  /** Standard FoundryVTT item properties */
  img?: string;
  sort?: number;
  flags?: Record<string, any>;
}

/**
 * System data structure for trait items
 */
export interface TraitItemSystemData {
  /** Hex color code for the trait */
  color: string;
  
  /** Icon path or class for the trait */
  icon: string;
  
  /** Localization key for the trait */
  localKey: string;
  
  /** Optional description */
  description?: string;
  
  /** Tags for filtering and categorization */
  tags?: string[];
  
  /** Trait-specific metadata */
  traitMetadata?: TraitMetadata;
}

/**
 * Additional metadata for traits
 */
export interface TraitMetadata {
  /** Categories this trait belongs to */
  categories?: string[];
  
  /** Tags for filtering/searching */
  tags?: string[];
  
  /** Whether this trait can be applied to actors */
  appliesToActors?: boolean;
  
  /** Whether this trait can be applied to items */
  appliesToItems?: boolean;
  
  /** Trait IDs that this trait has synergy with */
  synergies?: string[];
  
  /** Whether this trait is read-only (from remote sync) */
  readonly?: boolean;
  
  /** Source of the trait if remote ('remote' | 'local') */
  source?: 'remote' | 'local';
  
  /** Remote URL if synced from remote repository */
  remoteUrl?: string;
  
  /** Timestamp when synced from remote */
  syncedAt?: string;
  
  /** Custom properties for system-specific use */
  customProperties?: Record<string, any>;
}

/**
 * Configuration for trait provider initialization
 */
export interface TraitProviderConfig {
  /** Name of the system compendium pack */
  systemPackName: string;
  
  /** Name of the world compendium pack */
  worldPackName: string;
  
  /** Label for the world pack when created */
  worldPackLabel: string;
  
  /** Item type to use for trait items */
  itemType: string;
  
  /** Whether to enable caching */
  enableCaching?: boolean;
  
  /** Cache timeout in milliseconds */
  cacheTimeout?: number;
}

/**
 * Result of trait provider operations
 */
export interface TraitProviderResult<T = any> {
  /** Whether the operation succeeded */
  success: boolean;
  
  /** Result data if successful */
  data?: T;
  
  /** Error message if failed */
  error?: string;
  
  /** Additional metadata about the operation */
  metadata?: Record<string, any>;
}

/**
 * Cache entry for trait data
 */
export interface TraitCacheEntry {
  /** Cached trait data */
  traits: Trait[];
  
  /** Timestamp when cached */
  timestamp: number;
  
  /** Source packs that were cached */
  sources: TraitSource[];
}

/**
 * Options for trait retrieval
 */
export interface TraitRetrievalOptions {
  /** Whether to include system traits */
  includeSystem?: boolean;
  
  /** Whether to include world traits */
  includeWorld?: boolean;
  
  /** Whether to force refresh cache */
  forceRefresh?: boolean;
  
  /** Filter by categories */
  categories?: string[];
  
  /** Filter by tags */
  tags?: string[];
}

/**
 * Compendium pack information
 */
export interface CompendiumPackInfo {
  /** Pack key/name */
  name: string;
  
  /** Pack label for display */
  label: string;
  
  /** Whether pack exists */
  exists: boolean;
  
  /** Whether pack is accessible */
  accessible: boolean;
  
  /** FoundryVTT CompendiumCollection reference */
  collection?: any;
} 