/**
 * @fileoverview Item Domain Types
 * @description Type definitions for weapons, armor, talents, and other items in the game
 * @version 2.0.0
 * @author Avant Development Team
 */

/**
 * All possible item types in the Avant system.
 * Each type has different properties and behaviors.
 */
export type ItemType = 'action' | 'feature' | 'talent' | 'augment' | 'weapon' | 'armor' | 'gear' | 'trait';

/**
 * Data specific to weapon items.
 * Weapons are used for combat and have damage and range properties.
 */
export interface WeaponData {
  /** Damage formula (e.g., "1d8", "2d6+1") */
  damage: string;
  /** Weapon range in feet/meters */
  range: string;
  /** Special weapon properties */
  properties: string[];
  /** Whether this is a ranged weapon */
  ranged: boolean;
  /** Ammunition type (if applicable) */
  ammunition?: string;
}

/**
 * Data specific to armor items.
 * Armor provides protection and may have special properties.
 */
export interface ArmorData {
  /** Defense bonus provided by the armor */
  defense: number;
  /** Armor type (light, medium, heavy) */
  type: 'light' | 'medium' | 'heavy';
  /** Special armor properties */
  properties: string[];
  /** Movement penalty (if any) */
  speedPenalty?: number;
}

/**
 * Data specific to talent items.
 * Talents represent learned abilities and special techniques.
 */
export interface TalentData {
  /** Talent category (combat, social, exploration, etc.) */
  category: string;
  /** Prerequisites for learning this talent */
  prerequisites: string[];
  /** Whether this talent is always active */
  passive: boolean;
  /** Cost to use the talent (if applicable) */
  cost?: {
    type: 'power' | 'fortune' | 'action';
    amount: number;
  };
}

/**
 * Data specific to augment items.
 * Augments are cybernetic or magical enhancements.
 */
export interface AugmentData {
  /** Augment type (enhancement, replacement, implant) */
  augmentType: 'enhancement' | 'replacement' | 'implant';
  /** Body slot this augment occupies */
  slot: string;
  /** Power requirements (if any) */
  powerRequirement?: number;
  /** Side effects or drawbacks */
  sideEffects?: string[];
}

/**
 * Data specific to action items.
 * Actions represent special abilities that can be performed.
 */
export interface ActionData {
  /** Primary attribute used for this action */
  attribute: 'might' | 'grace' | 'intellect' | 'focus';
  /** Action type (attack, skill, special) */
  actionType: 'attack' | 'skill' | 'special';
  /** Target type (self, single, area, etc.) */
  target: string;
  /** Range of the action */
  range: string;
  /** Cost to perform the action */
  cost?: {
    type: 'power' | 'fortune' | 'health';
    amount: number;
  };
  /** Usage limitations */
  uses?: {
    value: number;
    max: number;
    per: 'encounter' | 'day' | 'recharge';
  };
}

/**
 * Union type for all item-specific data.
 * The actual data depends on the item type.
 */
export type ItemSpecificData = 
  | WeaponData 
  | ArmorData 
  | TalentData 
  | AugmentData 
  | ActionData 
  | Record<string, unknown>; // For gear and other generic items

/**
 * Complete item data structure.
 * Represents all the information about an item in the game.
 */
export interface ItemData {
  /** Item's name */
  name: string;
  /** Item type determines behavior and available properties */
  type: ItemType;
  /** Item description and flavor text */
  description: string;
  /** Item rarity (common, uncommon, rare, legendary) */
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
  /** Item's monetary value */
  price?: number;
  /** Item's weight in pounds/kilograms */
  weight?: number;
  /** Whether the item is equipped/active */
  equipped?: boolean;
  /** Quantity of this item (for stackable items) */
  quantity?: number;
  /** Item-specific data based on type */
  system: ItemSpecificData;
  /** Item image path */
  image?: string;
  /** Custom flags for system-specific data */
  flags?: Record<string, unknown>;
} 