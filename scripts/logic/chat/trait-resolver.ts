/**
 * @fileoverview Trait Resolution Utilities for Chat Integration
 * @version 1.0.0 - Stage 4: Chat Integration
 * @description Pure function utilities for resolving trait IDs to trait objects for chat messages
 * @author Avant VTT Team
 */

import type { Trait } from '../../types/domain/trait.js';
import type { TraitProvider } from '../../services/trait-provider.js';

/**
 * Result of trait resolution operation
 */
export interface TraitResolutionResult {
  /** Whether resolution was successful */
  success: boolean;
  
  /** Resolved trait objects */
  traits: Trait[];
  
  /** Number of traits resolved */
  count: number;
  
  /** IDs that could not be resolved */
  unresolved: string[];
  
  /** Error message if resolution failed */
  error?: string;
}

/**
 * Resolve an array of trait IDs to trait objects using the TraitProvider.
 * 
 * This function takes trait IDs from item.system.traits and resolves them
 * to full trait objects that can be used for chat message rendering.
 * 
 * @param traitIds - Array of trait ID strings to resolve
 * @param traitProvider - TraitProvider service instance
 * @returns Resolution result with trait objects
 * 
 * @example
 * const result = await resolveTraitsForChat(['fire', 'ice'], traitProvider);
 * if (result.success && result.count > 0) {
 *   const html = renderTraitChips(result.traits, { size: 'small' });
 * }
 */
export async function resolveTraitsForChat(
  traitIds: string[],
  traitProvider: TraitProvider
): Promise<TraitResolutionResult> {
  try {
    // Validate input
    if (!Array.isArray(traitIds)) {
      return {
        success: false,
        traits: [],
        count: 0,
        unresolved: [],
        error: 'Trait IDs must be an array'
      };
    }
    
    // Handle empty array
    if (traitIds.length === 0) {
      return {
        success: true,
        traits: [],
        count: 0,
        unresolved: []
      };
    }
    
    // Get all available traits from provider
    const allTraitsResult = await traitProvider.getAll();
    if (!allTraitsResult.success || !allTraitsResult.data) {
      return {
        success: false,
        traits: [],
        count: 0,
        unresolved: traitIds,
        error: 'Failed to load traits from provider'
      };
    }
    
    // Create a map for efficient lookup
    const traitMap = new Map<string, Trait>();
    for (const trait of allTraitsResult.data) {
      traitMap.set(trait.id, trait);
    }
    
    // Resolve trait IDs to trait objects
    const resolved: Trait[] = [];
    const unresolved: string[] = [];
    
    for (const traitId of traitIds) {
      if (!traitId || typeof traitId !== 'string') {
        unresolved.push(String(traitId));
        continue;
      }
      
      const trait = traitMap.get(traitId);
      if (trait) {
        resolved.push(trait);
      } else {
        unresolved.push(traitId);
      }
    }
    
    return {
      success: true,
      traits: resolved,
      count: resolved.length,
      unresolved
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error resolving traits for chat:', error);
    return {
      success: false,
      traits: [],
      count: 0,
      unresolved: traitIds,
      error: `Failed to resolve traits: ${errorMessage}`
    };
  }
}

/**
 * Resolve traits from an item for chat display.
 * 
 * This is a convenience function that extracts trait IDs from an item
 * and resolves them to trait objects.
 * 
 * @param item - FoundryVTT item with system.traits property
 * @param traitProvider - TraitProvider service instance
 * @returns Resolution result with trait objects
 * 
 * @example
 * const result = await resolveItemTraitsForChat(weapon, traitProvider);
 * if (result.success) {
 *   const traitHtml = renderTraitChips(result.traits, { size: 'small' });
 * }
 */
export async function resolveItemTraitsForChat(
  item: any,
  traitProvider: TraitProvider
): Promise<TraitResolutionResult> {
  try {
    if (!item || !item.system) {
      return {
        success: false,
        traits: [],
        count: 0,
        unresolved: [],
        error: 'Invalid item provided'
      };
    }
    
    const traitIds = item.system.traits || [];
    return await resolveTraitsForChat(traitIds, traitProvider);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error resolving item traits for chat:', error);
    return {
      success: false,
      traits: [],
      count: 0,
      unresolved: [],
      error: `Failed to resolve item traits: ${errorMessage}`
    };
  }
}

/**
 * Check if an item has any traits to display.
 * 
 * This is a quick utility to check if an item has traits without
 * doing the full resolution process.
 * 
 * @param item - FoundryVTT item to check
 * @returns Whether the item has traits
 * 
 * @example
 * if (itemHasTraits(weapon)) {
 *   // Resolve and display traits
 * }
 */
export function itemHasTraits(item: any): boolean {
  try {
    return Boolean(
      item && 
      item.system && 
      Array.isArray(item.system.traits) && 
      item.system.traits.length > 0
    );
  } catch (error) {
    console.error('Error checking if item has traits:', error);
    return false;
  }
}

/**
 * Create trait HTML for chat messages with error handling.
 * 
 * This function combines trait resolution and rendering into a single
 * operation with comprehensive error handling for chat integration.
 * 
 * @param traitIds - Array of trait IDs to render
 * @param traitProvider - TraitProvider service instance
 * @param size - Size variant for trait chips
 * @returns HTML string for trait chips or empty string if no traits
 * 
 * @example
 * const traitHtml = await createTraitHtmlForChat(
 *   weapon.system.traits, 
 *   traitProvider, 
 *   'small'
 * );
 * flavor += traitHtml; // Add to chat message
 */
export async function createTraitHtmlForChat(
  traitIds: string[],
  traitProvider: TraitProvider,
  size: 'small' | 'medium' | 'large' = 'small'
): Promise<string> {
  try {
    // Import the renderer dynamically to avoid circular dependencies
    const { renderTraitChips } = await import('./trait-renderer.js');
    
    // Resolve traits
    const resolution = await resolveTraitsForChat(traitIds, traitProvider);
    if (!resolution.success || resolution.count === 0) {
      return '';
    }
    
    // Render trait chips
    const renderResult = renderTraitChips(resolution.traits, {
      size,
      removable: false,
      showIcons: true,
      maxDisplay: 10,
      containerClasses: ['trait-chips--chat']
    });
    
    if (renderResult.success && renderResult.html) {
      return `<div class="trait-chips-wrapper">${renderResult.html}</div>`;
    }
    
    return '';
    
  } catch (error) {
    console.error('Error creating trait HTML for chat:', error);
    return '';
  }
} 