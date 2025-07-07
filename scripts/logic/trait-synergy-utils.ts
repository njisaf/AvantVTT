/**
 * @fileoverview Trait Synergy Utilities
 * @version 1.0.0 - Stage 6: Distributed Sharing
 * @description Pure functions for calculating trait synergies and effects
 * @author Avant VTT Team
 */

import type { Trait } from '../types/domain/trait.js';

/**
 * Represents a synergy effect between traits
 */
export interface TraitSynergy {
  /** Unique identifier for this synergy */
  id: string;
  
  /** Human-readable name of the synergy */
  name: string;
  
  /** Trait IDs required for this synergy */
  requiredTraits: string[];
  
  /** Description of the synergy effect */
  description: string;
  
  /** Type of synergy effect */
  type: SynergyType;
  
  /** Magnitude/value of the effect */
  value?: number;
  
  /** Additional properties for the effect */
  properties?: Record<string, any>;
}

/**
 * Types of synergy effects
 */
export type SynergyType = 
  | 'damage_bonus'        // Additional damage
  | 'defense_bonus'       // Additional defense
  | 'skill_bonus'         // Skill modifier
  | 'special_ability'     // Unlocks special ability
  | 'resistance'          // Damage resistance
  | 'vulnerability'       // Damage vulnerability
  | 'custom';             // Custom effect type

/**
 * Result of synergy calculation
 */
export interface SynergyCalculationResult {
  /** Whether calculation succeeded */
  success: boolean;
  
  /** Active synergies found */
  synergies: TraitSynergy[];
  
  /** Total number of traits processed */
  traitsProcessed: number;
  
  /** Error message if calculation failed */
  error?: string;
  
  /** Additional metadata */
  metadata?: {
    /** Trait IDs that were processed */
    processedTraitIds: string[];
    
    /** Unmatched trait IDs (no synergies) */
    unmatchedTraitIds: string[];
    
    /** Calculation time in milliseconds */
    calculationTime?: number;
  };
}

/**
 * Configuration for synergy calculation
 */
export interface SynergyCalculationOptions {
  /** Whether to include partial matches */
  includePartialMatches?: boolean;
  
  /** Maximum number of synergies to return */
  maxSynergies?: number;
  
  /** Filter by synergy types */
  allowedTypes?: SynergyType[];
  
  /** Whether to include custom synergies */
  includeCustomSynergies?: boolean;
}

/**
 * Calculate synergy effects for a given set of trait IDs.
 * 
 * This function determines which synergies are active based on the traits
 * present in the provided list. It checks all possible combinations and
 * returns active synergies along with their effects.
 * 
 * @param traitIds - Array of trait IDs to check for synergies
 * @param options - Optional calculation configuration
 * @returns Calculation result with active synergies
 * 
 * @example
 * // Check synergies for fire and ice traits
 * const result = calculateSynergyEffects(['fire', 'ice']);
 * if (result.success) {
 *   console.log(`Found ${result.synergies.length} active synergies`);
 * }
 */
export function calculateSynergyEffects(
  traitIds: string[], 
  options: SynergyCalculationOptions = {}
): SynergyCalculationResult {
  const startTime = Date.now();
  
  try {
    // Validate input
    if (!Array.isArray(traitIds)) {
      return {
        success: false,
        synergies: [],
        traitsProcessed: 0,
        error: 'Trait IDs must be an array'
      };
    }
    
    // Set default options
    const opts = {
      includePartialMatches: false,
      maxSynergies: 100,
      includeCustomSynergies: true,
      ...options
    };
    
    // Get built-in synergies
    const availableSynergies = getBuiltInSynergies();
    
    // Filter by allowed types if specified
    const filteredSynergies = opts.allowedTypes 
      ? availableSynergies.filter(synergy => opts.allowedTypes!.includes(synergy.type))
      : availableSynergies;
    
    // Find active synergies
    const activeSynergies: TraitSynergy[] = [];
    const traitIdSet = new Set(traitIds);
    const unmatchedTraitIds = new Set(traitIds);
    
    for (const synergy of filteredSynergies) {
      const hasAllRequiredTraits = synergy.requiredTraits.every(
        requiredTrait => traitIdSet.has(requiredTrait)
      );
      
      if (hasAllRequiredTraits) {
        activeSynergies.push(synergy);
        
        // Remove matched traits from unmatched set
        synergy.requiredTraits.forEach(traitId => {
          unmatchedTraitIds.delete(traitId);
        });
        
        // Stop if we've reached the maximum
        if (activeSynergies.length >= opts.maxSynergies) {
          break;
        }
      }
    }
    
    const calculationTime = Date.now() - startTime;
    
    return {
      success: true,
      synergies: activeSynergies,
      traitsProcessed: traitIds.length,
      metadata: {
        processedTraitIds: traitIds,
        unmatchedTraitIds: Array.from(unmatchedTraitIds),
        calculationTime
      }
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      synergies: [],
      traitsProcessed: 0,
      error: `Synergy calculation failed: ${errorMessage}`
    };
  }
}

/**
 * Get synergies available for a specific trait.
 * 
 * This function returns all synergies that involve the specified trait,
 * regardless of whether the other required traits are present.
 * 
 * @param traitId - ID of the trait to get synergies for
 * @param options - Optional calculation configuration
 * @returns Array of synergies involving the trait
 * 
 * @example
 * // Get all synergies that involve the 'fire' trait
 * const fireSynergies = getSynergiesForTrait('fire');
 */
export function getSynergiesForTrait(
  traitId: string, 
  options: SynergyCalculationOptions = {}
): TraitSynergy[] {
  if (!traitId || typeof traitId !== 'string') {
    return [];
  }
  
  const availableSynergies = getBuiltInSynergies();
  
  // Filter synergies that include this trait
  const relevantSynergies = availableSynergies.filter(synergy =>
    synergy.requiredTraits.includes(traitId)
  );
  
  // Apply type filtering if specified
  if (options.allowedTypes) {
    return relevantSynergies.filter(synergy => 
      options.allowedTypes!.includes(synergy.type)
    );
  }
  
  return relevantSynergies;
}

/**
 * Check if two or more traits have any synergies together.
 * 
 * This is a convenience function for quickly checking if a set of traits
 * has any synergistic effects without needing the full calculation.
 * 
 * @param traitIds - Array of trait IDs to check
 * @returns True if any synergies exist between the traits
 * 
 * @example
 * // Quick check for synergies
 * const hasSynergy = hasTraitSynergies(['fire', 'ice']);
 * if (hasSynergy) {
 *   console.log('These traits work together!');
 * }
 */
export function hasTraitSynergies(traitIds: string[]): boolean {
  if (!Array.isArray(traitIds) || traitIds.length < 2) {
    return false;
  }
  
  const result = calculateSynergyEffects(traitIds);
  return result.success && result.synergies.length > 0;
}

/**
 * Generate a human-readable description of active synergies.
 * 
 * @param synergies - Array of active synergies
 * @returns Formatted description string
 * 
 * @example
 * const result = calculateSynergyEffects(['fire', 'ice']);
 * const description = formatSynergyDescription(result.synergies);
 * // "Fire and Ice create Elemental Balance: +2 damage to all attacks"
 */
export function formatSynergyDescription(synergies: TraitSynergy[]): string {
  if (!Array.isArray(synergies) || synergies.length === 0) {
    return 'No active synergies';
  }
  
  if (synergies.length === 1) {
    const synergy = synergies[0];
    return `${synergy.name}: ${synergy.description}`;
  }
  
  // Multiple synergies
  const synergyDescriptions = synergies.map(synergy => 
    `${synergy.name} (${synergy.description})`
  );
  
  return synergyDescriptions.join('; ');
}

// =========================================================================
// PRIVATE HELPER FUNCTIONS
// =========================================================================

/**
 * Get the built-in synergies defined for the Avant system.
 * 
 * In the future, this could be loaded from configuration files or
 * extended by modules and plugins.
 * 
 * @private
 */
function getBuiltInSynergies(): TraitSynergy[] {
  return [
    {
      id: 'fire-ice-balance',
      name: 'Elemental Balance',
      requiredTraits: ['fire', 'ice'],
      description: 'Fire and Ice traits create elemental balance, providing +2 damage bonus',
      type: 'damage_bonus',
      value: 2,
      properties: {
        damageTypes: ['fire', 'ice'],
        source: 'elemental'
      }
    },
    {
      id: 'lightning-metal-conduction',
      name: 'Electrical Conduction',
      requiredTraits: ['lightning', 'metal'],
      description: 'Metal conducts lightning effectively, increasing electrical damage by 50%',
      type: 'damage_bonus',
      value: 1.5,
      properties: {
        damageTypes: ['lightning'],
        multiplier: true
      }
    },
    {
      id: 'earth-nature-growth',
      name: 'Natural Growth',
      requiredTraits: ['earth', 'nature'],
      description: 'Earth and nature synergize to provide healing bonuses',
      type: 'special_ability',
      properties: {
        ability: 'regeneration',
        value: 1
      }
    },
    {
      id: 'shadow-stealth-mastery',
      name: 'Shadow Mastery',
      requiredTraits: ['shadow', 'stealth'],
      description: 'Shadow and stealth traits combine for superior concealment',
      type: 'skill_bonus',
      value: 3,
      properties: {
        skills: ['stealth', 'hide'],
        situational: 'in darkness'
      }
    },
    {
      id: 'holy-undead-bane',
      name: 'Undead Bane',
      requiredTraits: ['holy', 'blessed'],
      description: 'Holy and blessed traits are especially effective against undead',
      type: 'damage_bonus',
      value: 4,
      properties: {
        targetTypes: ['undead'],
        damageTypes: ['radiant', 'holy']
      }
    },
    {
      id: 'poison-acid-corrosion',
      name: 'Corrosive Toxin',
      requiredTraits: ['poison', 'acid'],
      description: 'Poison and acid create a corrosive effect that reduces enemy armor',
      type: 'special_ability',
      properties: {
        effect: 'armor_reduction',
        value: 2,
        duration: 3
      }
    }
  ];
}

/**
 * Validate a synergy object structure.
 * 
 * @private
 */
function validateSynergy(synergy: any): synergy is TraitSynergy {
  return (
    typeof synergy === 'object' &&
    typeof synergy.id === 'string' &&
    typeof synergy.name === 'string' &&
    Array.isArray(synergy.requiredTraits) &&
    typeof synergy.description === 'string' &&
    typeof synergy.type === 'string'
  );
} 