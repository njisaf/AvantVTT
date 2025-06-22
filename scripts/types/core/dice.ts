/**
 * @fileoverview Core Dice Types
 * @description Type definitions for dice rolling and results
 * @version 2.0.0
 * @author Avant Development Team
 */

/**
 * Represents the result of rolling a single die.
 * Contains the face value that was rolled.
 */
export interface DieResult {
  /** The face value that was rolled (1 to number of sides) */
  result: number;
  /** Whether this die result was discarded (for advantage/disadvantage) */
  discarded?: boolean;
  /** Whether this die was rerolled */
  rerolled?: boolean;
}

/**
 * Represents the complete result of a dice roll operation.
 * Includes individual die results and calculated totals.
 */
export interface DiceRollResult {
  /** Array of individual die results */
  dice: DieResult[];
  /** The sum of all non-discarded dice */
  total: number;
  /** Any modifier applied to the roll */
  modifier: number;
  /** The final result (total + modifier) */
  finalResult: number;
  /** The original roll formula (e.g., "2d10+3") */
  formula: string;
  /** Whether this was a critical success */
  critical?: boolean;
  /** Whether this was a critical failure */
  fumble?: boolean;
}

/**
 * Configuration for how dice should be rolled.
 * Defines the parameters of a dice roll operation.
 */
export interface RollConfig {
  /** Number of dice to roll */
  count: number;
  /** Number of sides on each die */
  sides: number;
  /** Modifier to add to the total */
  modifier: number;
  /** Whether to roll with advantage (keep highest) */
  advantage?: boolean;
  /** Whether to roll with disadvantage (keep lowest) */
  disadvantage?: boolean;
  /** Target number for success (if applicable) */
  target?: number;
}

/**
 * Data needed for reroll operations.
 * Contains information about Fortune Point expenditure and reroll attempts.
 */
export interface RerollData {
  /** Number of Fortune Points being spent */
  fortunePointsSpent: number;
  /** The original roll result being rerolled */
  originalRoll: DiceRollResult;
  /** The new roll result */
  newRoll: DiceRollResult;
  /** Whether the player chose to keep the new result */
  keepNewResult: boolean;
  /** Reason for the reroll (optional) */
  reason?: string;
} 