/**
 * @fileoverview Actor Domain Types
 * @description Type definitions for characters, NPCs, and other actors in the game
 * @version 2.0.0
 * @author Avant Development Team
 */

/**
 * Represents a single ability score in the game.
 * Abilities like Might, Grace, Intellect, and Focus define character capabilities.
 */
export interface Ability {
  /** The ability modifier (-10 to +10) */
  modifier: number;
  /** Display label for the ability */
  label?: string;
}

/**
 * Complete set of ability scores for a character.
 * The four core abilities that define character capabilities.
 */
export interface Abilities {
  /** Physical strength and power */
  might: Ability;
  /** Agility, dexterity, and speed */
  grace: Ability;
  /** Reasoning, knowledge, and mental acuity */
  intellect: Ability;
  /** Willpower, perception, and mental discipline */
  focus: Ability;
}

/**
 * Represents a single skill in the game.
 * Skills represent learned abilities and training.
 */
export interface Skill {
  /** The skill value (0-10+ typically) */
  value: number;
  /** Display label for the skill */
  label?: string;
  /** Which ability this skill is based on */
  ability?: 'might' | 'grace' | 'intellect' | 'focus';
}

/**
 * Complete set of skills for a character.
 * All twelve core skills in the Avant system.
 */
export interface Skills {
  /** Convince others through logical argument (Intellect) */
  debate: number;
  /** Overpower opposition through physical might (Might) */
  force: number;
  /** Convince others through personal appeal (Focus) */
  charm: number;
  /** Notice hidden details and read situations (Focus) */
  discern: number;
  /** Resist physical and mental stress (Might) */
  endure: number;
  /** Perform delicate tasks requiring precision (Grace) */
  finesse: number;
  /** Lead others and coordinate group efforts (Focus) */
  command: number;
  /** Avoid detection and move unseen (Grace) */
  hide: number;
  /** Search for clues and examine evidence (Intellect) */
  inspect: number;
  /** Understand motivations and emotions (Focus) */
  intuit: number;
  /** Remember facts and access knowledge (Intellect) */
  recall: number;
  /** Move quickly and react with speed (Grace) */
  surge: number;
}

/**
 * Character statistics derived from abilities and other factors.
 * These are calculated values that change based on character progression.
 */
export interface CharacterStats {
  /** Current health points */
  health: {
    value: number;
    max: number;
    temp?: number;
  };
  /** Current power points (for special abilities) */
  powerPoints: {
    value: number;
    max: number;
  };
  /** Defense threshold (difficulty to hit in combat) */
  defense: number;
  /** Character tier (0-6, representing power level) */
  tier: number;
  /** Fortune points (metacurrency for rerolls) */
  fortune: {
    value: number;
    max: number;
  };
}

/**
 * Complete actor data structure.
 * Represents all the game-mechanical information about a character or NPC.
 */
export interface ActorData {
  /** Character's name */
  name: string;
  /** Actor type (character, npc, vehicle) */
  type: 'character' | 'npc' | 'vehicle';
  /** Core ability scores */
  abilities: Abilities;
  /** Learned skills */
  skills: Skills;
  /** Derived statistics */
  stats: CharacterStats;
  /** Character biography and description */
  biography?: string;
  /** Character portrait image path */
  image?: string;
  /** Custom flags for system-specific data */
  flags?: Record<string, unknown>;
}

/**
 * Lightweight reference to an actor.
 * Used when you need to reference an actor without loading all their data.
 */
export interface ActorReference {
  /** The actor's unique ID */
  id: string;
  /** The actor's name */
  name: string;
  /** The actor's type */
  type: 'character' | 'npc' | 'vehicle';
  /** The actor's current health (for quick reference) */
  health?: {
    value: number;
    max: number;
  };
} 