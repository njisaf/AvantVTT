/**
 * @fileoverview Trait Bulk Operations Utilities
 * @version 1.0.0 - Stage 5: Advanced Features
 * @description Pure function utilities for bulk trait operations
 * @author Avant VTT Team
 */

import type { Trait } from '../types/domain/trait.ts';

/**
 * Result of bulk trait operations
 */
export interface BulkTraitOperationResult {
  /** Whether the operation was successful */
  success: boolean;
  
  /** Updated trait list */
  traits: string[];
  
  /** Number of traits added */
  added: number;
  
  /** Number of traits removed */
  removed: number;
  
  /** Number of traits that were already present (for add operations) */
  skipped: number;
  
  /** Error message if operation failed */
  error?: string;
  
  /** Detailed results for each trait operation */
  details: BulkTraitOperationDetail[];
}

/**
 * Detail for individual trait operations within a bulk operation
 */
export interface BulkTraitOperationDetail {
  /** Trait ID that was processed */
  traitId: string;
  
  /** Action that was attempted */
  action: 'add' | 'remove';
  
  /** Result of the action */
  result: 'added' | 'removed' | 'skipped' | 'error';
  
  /** Error message if the action failed */
  error?: string;
}

/**
 * Options for bulk trait operations
 */
export interface BulkTraitOperationOptions {
  /** Whether to skip validation of trait IDs */
  skipValidation?: boolean;
  
  /** Maximum number of traits to process in one operation */
  maxTraits?: number;
  
  /** Whether to continue processing after individual errors */
  continueOnError?: boolean;
}

/**
 * Configuration for bulk trait selection UI
 */
export interface BulkTraitSelectionConfig {
  /** Available traits to choose from */
  availableTraits: Trait[];
  
  /** Currently selected trait IDs */
  currentTraits: string[];
  
  /** Whether to show categories in the selection UI */
  showCategories?: boolean;
  
  /** Whether to show search/filter functionality */
  showSearch?: boolean;
  
  /** Whether to use virtualized rendering for large lists */
  useVirtualization?: boolean;
  
  /** Height for each trait item in pixels (for virtualization) */
  itemHeight?: number;
  
  /** Maximum height for the selection container */
  maxHeight?: number;
}

/**
 * Add multiple traits to a trait list in a single operation.
 * 
 * This function takes a list of current trait IDs and adds multiple
 * new trait IDs, avoiding duplicates and providing detailed results.
 * 
 * @param currentTraits - Array of current trait IDs
 * @param traitsToAdd - Array of trait IDs to add
 * @param options - Options for the bulk operation
 * @returns Result containing updated trait list and operation details
 * 
 * @example
 * const result = addTraitsToList(['fire'], ['ice', 'lightning', 'fire']);
 * // Result: { traits: ['fire', 'ice', 'lightning'], added: 2, skipped: 1 }
 */
export function addTraitsToList(
  currentTraits: string[], 
  traitsToAdd: string[], 
  options: BulkTraitOperationOptions = {}
): BulkTraitOperationResult {
  try {
    // Validate inputs
    if (!Array.isArray(currentTraits)) {
      return {
        success: false,
        traits: [],
        added: 0,
        removed: 0,
        skipped: 0,
        error: 'Current traits must be an array',
        details: []
      };
    }
    
    if (!Array.isArray(traitsToAdd)) {
      return {
        success: false,
        traits: currentTraits,
        added: 0,
        removed: 0,
        skipped: 0,
        error: 'Traits to add must be an array',
        details: []
      };
    }
    
    // Apply limits
    const maxTraits = options.maxTraits || 1000;
    if (traitsToAdd.length > maxTraits) {
      return {
        success: false,
        traits: currentTraits,
        added: 0,
        removed: 0,
        skipped: 0,
        error: `Cannot process more than ${maxTraits} traits at once`,
        details: []
      };
    }
    
    const updatedTraits = [...currentTraits];
    const details: BulkTraitOperationDetail[] = [];
    let added = 0;
    let skipped = 0;
    let hasErrors = false;
    
    for (const traitId of traitsToAdd) {
      try {
        // Validate trait ID
        if (!options.skipValidation && (!traitId || typeof traitId !== 'string')) {
          details.push({
            traitId: String(traitId),
            action: 'add',
            result: 'error',
            error: 'Invalid trait ID'
          });
          hasErrors = true;
          if (!options.continueOnError) break;
          continue;
        }
        
        // Check if trait is already in the list
        if (updatedTraits.includes(traitId)) {
          details.push({
            traitId,
            action: 'add',
            result: 'skipped'
          });
          skipped++;
          continue;
        }
        
        // Add the trait
        updatedTraits.push(traitId);
        details.push({
          traitId,
          action: 'add',
          result: 'added'
        });
        added++;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        details.push({
          traitId: String(traitId),
          action: 'add',
          result: 'error',
          error: errorMessage
        });
        hasErrors = true;
        if (!options.continueOnError) break;
      }
    }
    
    return {
      success: !hasErrors || (options.continueOnError === true),
      traits: updatedTraits,
      added,
      removed: 0,
      skipped,
      error: hasErrors && !(options.continueOnError === true) ? 'Operation stopped due to errors' : undefined,
      details
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      traits: currentTraits || [],
      added: 0,
      removed: 0,
      skipped: 0,
      error: `Failed to add traits: ${errorMessage}`,
      details: []
    };
  }
}

/**
 * Remove multiple traits from a trait list in a single operation.
 * 
 * This function takes a list of current trait IDs and removes multiple
 * trait IDs, providing detailed results for each operation.
 * 
 * @param currentTraits - Array of current trait IDs
 * @param traitsToRemove - Array of trait IDs to remove
 * @param options - Options for the bulk operation
 * @returns Result containing updated trait list and operation details
 * 
 * @example
 * const result = removeTraitsFromList(['fire', 'ice', 'lightning'], ['ice', 'wind']);
 * // Result: { traits: ['fire', 'lightning'], removed: 1, skipped: 1 }
 */
export function removeTraitsFromList(
  currentTraits: string[], 
  traitsToRemove: string[], 
  options: BulkTraitOperationOptions = {}
): BulkTraitOperationResult {
  try {
    // Validate inputs
    if (!Array.isArray(currentTraits)) {
      return {
        success: false,
        traits: [],
        added: 0,
        removed: 0,
        skipped: 0,
        error: 'Current traits must be an array',
        details: []
      };
    }
    
    if (!Array.isArray(traitsToRemove)) {
      return {
        success: false,
        traits: currentTraits,
        added: 0,
        removed: 0,
        skipped: 0,
        error: 'Traits to remove must be an array',
        details: []
      };
    }
    
    // Apply limits
    const maxTraits = options.maxTraits || 1000;
    if (traitsToRemove.length > maxTraits) {
      return {
        success: false,
        traits: currentTraits,
        added: 0,
        removed: 0,
        skipped: 0,
        error: `Cannot process more than ${maxTraits} traits at once`,
        details: []
      };
    }
    
    let updatedTraits = [...currentTraits];
    const details: BulkTraitOperationDetail[] = [];
    let removed = 0;
    let skipped = 0;
    let hasErrors = false;
    
    for (const traitId of traitsToRemove) {
      try {
        // Validate trait ID
        if (!options.skipValidation && (!traitId || typeof traitId !== 'string')) {
          details.push({
            traitId: String(traitId),
            action: 'remove',
            result: 'error',
            error: 'Invalid trait ID'
          });
          hasErrors = true;
          if (!options.continueOnError) break;
          continue;
        }
        
        // Check if trait exists in the list
        if (!updatedTraits.includes(traitId)) {
          details.push({
            traitId,
            action: 'remove',
            result: 'skipped'
          });
          skipped++;
          continue;
        }
        
        // Remove the trait
        updatedTraits = updatedTraits.filter(id => id !== traitId);
        details.push({
          traitId,
          action: 'remove',
          result: 'removed'
        });
        removed++;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        details.push({
          traitId: String(traitId),
          action: 'remove',
          result: 'error',
          error: errorMessage
        });
        hasErrors = true;
        if (!options.continueOnError) break;
      }
    }
    
    return {
      success: !hasErrors || (options.continueOnError === true),
      traits: updatedTraits,
      added: 0,
      removed,
      skipped,
      error: hasErrors && !(options.continueOnError === true) ? 'Operation stopped due to errors' : undefined,
      details
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      traits: currentTraits || [],
      added: 0,
      removed: 0,
      skipped: 0,
      error: `Failed to remove traits: ${errorMessage}`,
      details: []
    };
  }
}

/**
 * Group traits by category for display in bulk selection UI.
 * 
 * This function takes an array of traits and groups them by their
 * categories for organized display in selection interfaces.
 * 
 * @param traits - Array of traits to group
 * @returns Map of category names to trait arrays
 * 
 * @example
 * const grouped = groupTraitsByCategory(allTraits);
 * // Returns: Map { 'elemental' => [fire, ice], 'damage' => [sharp, blunt] }
 */
export function groupTraitsByCategory(traits: Trait[]): Map<string, Trait[]> {
  try {
    const groups = new Map<string, Trait[]>();
    
    if (!Array.isArray(traits)) {
      return groups;
    }
    
    for (const trait of traits) {
      const categories = trait.item.system.traitMetadata?.categories || [];
      
      if (categories.length === 0) {
        // Add to 'uncategorized' group
        if (!groups.has('uncategorized')) {
          groups.set('uncategorized', []);
        }
        groups.get('uncategorized')!.push(trait);
      } else {
        // Add to each category the trait belongs to
        for (const category of categories) {
          if (!groups.has(category)) {
            groups.set(category, []);
          }
          groups.get(category)!.push(trait);
        }
      }
    }
    
    return groups;
    
  } catch (error) {
    console.error('Error grouping traits by category:', error);
    return new Map();
  }
}

/**
 * Generate summary text for bulk trait operation results.
 * 
 * This function creates human-readable summary text describing
 * the results of a bulk trait operation.
 * 
 * @param result - Result from a bulk trait operation
 * @returns Human-readable summary text
 * 
 * @example
 * const summary = generateBulkOperationSummary(result);
 * // Returns: "Added 3 traits, skipped 1 duplicate. Operation completed successfully."
 */
export function generateBulkOperationSummary(result: BulkTraitOperationResult): string {
  try {
    const parts: string[] = [];
    
    if (result.added > 0) {
      parts.push(`added ${result.added} trait${result.added !== 1 ? 's' : ''}`);
    }
    
    if (result.removed > 0) {
      parts.push(`removed ${result.removed} trait${result.removed !== 1 ? 's' : ''}`);
    }
    
    if (result.skipped > 0) {
      const skipReason = result.added > 0 ? 'duplicate' : 'not found';
      parts.push(`skipped ${result.skipped} ${skipReason}${result.skipped !== 1 ? 's' : ''}`);
    }
    
    if (parts.length === 0) {
      return 'No changes made.';
    }
    
    const summary = parts.join(', ').replace(/,([^,]*)$/, ' and$1');
    const status = result.success ? 'Operation completed successfully.' : 'Operation completed with errors.';
    
    // Capitalize only the first character of the entire summary
    const capitalizedSummary = summary.charAt(0).toUpperCase() + summary.slice(1);
    
    return `${capitalizedSummary}. ${status}`;
    
  } catch (error) {
    return 'Summary generation failed.';
  }
}

/**
 * Validate a bulk trait selection configuration.
 * 
 * This function checks that a bulk selection configuration has
 * all required properties and reasonable values.
 * 
 * @param config - Configuration to validate
 * @returns Validation result with any errors
 */
export function validateBulkSelectionConfig(config: BulkTraitSelectionConfig): {
  valid: boolean;
  errors: string[];
} {
  try {
    const errors: string[] = [];
    
    if (!config) {
      errors.push('Configuration is required');
      return { valid: false, errors };
    }
    
    if (!Array.isArray(config.availableTraits)) {
      errors.push('Available traits must be an array');
    }
    
    if (!Array.isArray(config.currentTraits)) {
      errors.push('Current traits must be an array');
    }
    
    if (config.itemHeight !== undefined && (typeof config.itemHeight !== 'number' || config.itemHeight <= 0)) {
      errors.push('Item height must be a positive number');
    }
    
    if (config.maxHeight !== undefined && (typeof config.maxHeight !== 'number' || config.maxHeight <= 0)) {
      errors.push('Max height must be a positive number');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
    
  } catch (error) {
    return {
      valid: false,
      errors: ['Configuration validation failed']
    };
  }
} 