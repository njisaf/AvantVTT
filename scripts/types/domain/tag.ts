/**
 * @fileoverview Tag system type definitions
 * @version 1.0.0
 * @description TypeScript definitions for the tag registry system
 * @author Avant VTT Team
 */

/**
 * Definition of a tag that can be applied to traits and other game elements
 */
export interface TagDefinition {
  /** Unique machine-readable identifier (lowercase, no spaces) */
  id: string;
  
  /** Human-readable display name */
  label: string;
  
  /** Optional color for visual representation */
  color?: string;
  
  /** Optional icon class (e.g., "fas fa-sword") */
  icon?: string;
  
  /** Categories this tag belongs to (e.g., ["trait", "damage"]) */
  categories?: string[];
}

/**
 * Options for filtering tags
 */
export interface TagFilterOptions {
  /** Filter by specific category */
  category?: string;
  
  /** Filter by multiple categories */
  categories?: string[];
  
  /** Search by label text */
  search?: string;
  
  /** Case-sensitive search */
  caseSensitive?: boolean;
}

/**
 * Result wrapper for tag registry operations
 */
export interface TagRegistryResult<T> {
  /** Whether the operation was successful */
  success: boolean;
  
  /** The result data (if successful) */
  data?: T;
  
  /** Error message (if unsuccessful) */
  error?: string;
  
  /** Additional metadata about the operation */
  metadata?: Record<string, any>;
}

/**
 * Configuration options for TagRegistryService
 */
export interface TagRegistryConfig {
  /** Path to the default tags JSON file */
  defaultTagsPath?: string;
  
  /** Whether to enable caching */
  enableCaching?: boolean;
  
  /** Cache timeout in milliseconds */
  cacheTimeout?: number;
}

/**
 * Event data for tag-related hooks
 */
export interface TagRegistryHookData {
  /** The tag that was affected */
  tag?: TagDefinition;
  
  /** All current tags */
  tags?: TagDefinition[];
  
  /** The action that occurred */
  action?: 'added' | 'updated' | 'removed' | 'loaded';
  
  /** Additional context data */
  context?: Record<string, any>;
} 