/**
 * @fileoverview Trait Seed Data
 * @version 1.0.0 - Stage 1: Foundation
 * @description Seed data for creating initial traits in the system compendium pack
 * @author Avant VTT Team
 */

import type { TraitItemSystemData } from '../types/domain/trait.js';

/**
 * Interface for trait seed data that will be converted to FoundryVTT items
 */
export interface TraitSeedData {
  /** Item name */
  name: string;
  
  /** Item type (should match system.json item types) */
  type: string;
  
  /** System data containing trait properties */
  system: TraitItemSystemData;
  
  /** Optional image path */
  img?: string;
  
  /** Sort order */
  sort?: number;
}

/**
 * Default trait seeds for the system compendium pack.
 * These represent common traits that users can apply to actors and items.
 */
export const DEFAULT_TRAIT_SEEDS: TraitSeedData[] = [
  {
    name: "Fire",
    type: "feature",
    system: {
      color: "#FF6B6B",
      textColor: "#000000", // Dark text on light red background
      icon: "fas fa-fire",
      localKey: "AVANT.Trait.Fire",
      description: "Represents fire-based abilities, damage types, or elemental affinities",
      traitMetadata: {
        categories: ["elemental", "damage"],
        tags: ["fire", "elemental", "hot", "burn"],
        appliesToActors: true,
        appliesToItems: true
      }
    },
    img: "icons/svg/item-bag.svg",
    sort: 100
  },
  
  {
    name: "Ice",
    type: "feature", 
    system: {
      color: "#4ECDC4",
      textColor: "#000000", // Dark text on light cyan background
      icon: "fas fa-snowflake",
      localKey: "AVANT.Trait.Ice",
      description: "Represents ice and cold-based abilities, damage types, or elemental affinities",
      traitMetadata: {
        categories: ["elemental", "damage"],
        tags: ["ice", "cold", "elemental", "freeze"],
        appliesToActors: true,
        appliesToItems: true
      }
    },
    img: "icons/svg/item-bag.svg",
    sort: 200
  },
  
  {
    name: "Lightning",
    type: "feature",
    system: {
      color: "#FFE66D",
      textColor: "#000000", // Dark text on light yellow background
      icon: "fas fa-bolt",
      localKey: "AVANT.Trait.Lightning", 
      description: "Represents electrical and lightning-based abilities, damage types, or elemental affinities",
      traitMetadata: {
        categories: ["elemental", "damage"],
        tags: ["lightning", "electric", "elemental", "shock"],
        appliesToActors: true,
        appliesToItems: true
      }
    },
    img: "icons/svg/item-bag.svg",
    sort: 300
  },
  
  {
    name: "Stealth",
    type: "feature",
    system: {
      color: "#6C5CE7",
      textColor: "#FFFFFF", // Light text on dark purple background
      icon: "fas fa-eye-slash",
      localKey: "AVANT.Trait.Stealth",
      description: "Represents stealth, concealment, and sneaking abilities",
      traitMetadata: {
        categories: ["skill", "ability"],
        tags: ["stealth", "hidden", "sneak", "concealment"],
        appliesToActors: true,
        appliesToItems: true
      }
    },
    img: "icons/svg/item-bag.svg",
    sort: 400
  },
  
  {
    name: "Healing",
    type: "feature",
    system: {
      color: "#00B894",
      textColor: "#FFFFFF", // Light text on dark green background
      icon: "fas fa-heart",
      localKey: "AVANT.Trait.Healing",
      description: "Represents healing, restoration, and recovery abilities",
      traitMetadata: {
        categories: ["magic", "support"],
        tags: ["healing", "restoration", "recovery", "support"],
        appliesToActors: true,
        appliesToItems: true
      }
    },
    img: "icons/svg/item-bag.svg",
    sort: 500
  },
  
  {
    name: "Tech",
    type: "feature",
    system: {
      color: "#0984E3",
      textColor: "#FFFFFF", // Light text on dark blue background
      icon: "fas fa-microchip",
      localKey: "AVANT.Trait.Tech",
      description: "Represents technological, digital, or cybernetic abilities and enhancements",
      traitMetadata: {
        categories: ["technology", "augment"],
        tags: ["tech", "digital", "cyber", "technology"],
        appliesToActors: true,
        appliesToItems: true
      }
    },
    img: "icons/svg/item-bag.svg",
    sort: 600
  },
  
  {
    name: "Psychic",
    type: "feature",
    system: {
      color: "#E17055",
      textColor: "#FFFFFF", // Light text on dark orange background
      icon: "fas fa-brain",
      localKey: "AVANT.Trait.Psychic",
      description: "Represents mental, telepathic, and psionic abilities",
      traitMetadata: {
        categories: ["mental", "magic"],
        tags: ["psychic", "mental", "telepathy", "psionic"],
        appliesToActors: true,
        appliesToItems: true
      }
    },
    img: "icons/svg/item-bag.svg",
    sort: 700
  },
  
  {
    name: "Legendary",
    type: "feature",
    system: {
      color: "#FDCB6E",
      textColor: "#000000", // Dark text on light yellow background
      icon: "fas fa-star",
      localKey: "AVANT.Trait.Legendary",
      description: "Marks items or abilities as legendary quality or rarity",
      traitMetadata: {
        categories: ["quality", "rarity"],
        tags: ["legendary", "rare", "quality", "special"],
        appliesToActors: false,
        appliesToItems: true
      }
    },
    img: "icons/svg/item-bag.svg",
    sort: 800
  }
];

/**
 * Utility functions for working with trait seeds
 */
export class TraitSeedUtils {
  
  /**
   * Get all trait seeds as an array
   * 
   * @returns Array of trait seed data
   */
  static getAllSeeds(): TraitSeedData[] {
    return [...DEFAULT_TRAIT_SEEDS];
  }
  
  /**
   * Get a specific trait seed by name
   * 
   * @param name - Name of the trait to find
   * @returns Trait seed data or undefined if not found
   */
  static getSeedByName(name: string): TraitSeedData | undefined {
    return DEFAULT_TRAIT_SEEDS.find(seed => seed.name === name);
  }
  
  /**
   * Get trait seeds filtered by category
   * 
   * @param category - Category to filter by
   * @returns Array of trait seeds in the specified category
   */
  static getSeedsByCategory(category: string): TraitSeedData[] {
    return DEFAULT_TRAIT_SEEDS.filter(seed => 
      seed.system.traitMetadata?.categories?.includes(category)
    );
  }
  
  /**
   * Get trait seeds filtered by tag
   * 
   * @param tag - Tag to filter by
   * @returns Array of trait seeds with the specified tag
   */
  static getSeedsByTag(tag: string): TraitSeedData[] {
    return DEFAULT_TRAIT_SEEDS.filter(seed =>
      seed.system.traitMetadata?.tags?.includes(tag)
    );
  }
  
  /**
   * Validate a trait seed data structure
   * 
   * @param seed - Trait seed to validate
   * @returns True if valid, false otherwise
   */
  static validateSeed(seed: TraitSeedData): boolean {
    try {
      // Required fields
      if (!seed.name || !seed.type || !seed.system) {
        return false;
      }
      
      // Required system fields
      if (!seed.system.color || !seed.system.icon || !seed.system.localKey) {
        return false;
      }
      
      // Color should be a valid hex color
      if (!/^#[0-9A-Fa-f]{6}$/.test(seed.system.color)) {
        return false;
      }
      
      // Icon should not be empty
      if (seed.system.icon.trim().length === 0) {
        return false;
      }
      
      // LocalKey should follow pattern
      if (!/^[A-Z][A-Z_]*\.[A-Z][A-Za-z]*\.[A-Za-z]+$/.test(seed.system.localKey)) {
        return false;
      }
      
      return true;
      
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Convert a trait seed to a FoundryVTT item creation data structure
   * 
   * @param seed - Trait seed to convert
   * @param folderId - Optional folder ID for organization
   * @returns Item creation data
   */
  static seedToItemData(seed: TraitSeedData, folderId?: string): any {
    const itemData = {
      name: seed.name,
      type: seed.type,
      system: seed.system,
      img: seed.img,
      sort: seed.sort || 0,
      folder: folderId
    };
    
    return itemData;
  }
} 