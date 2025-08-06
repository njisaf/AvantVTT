/**
 * @fileoverview Dialog Types for Avant Native System
 * @version 2.0.0 - TypeScript Stage 3
 * @description Type definitions for dialog functionality, especially Fortune Point reroll dialogs
 */

/**
 * Represents a single d10 result from a roll
 */
export interface D10Result {
  /** The face value that was rolled */
  value: number;
  /** Index position in the original roll */
  index: number;
  /** Whether this die was rerolled */
  wasRerolled?: boolean;
  /** Whether this die is currently selected for reroll */
  selected?: boolean;
}

/**
 * Static modifiers extracted from a roll
 */
export interface StaticModifiers {
  /** Total value of all static modifiers */
  total: number;
  /** Breakdown of individual modifiers */
  breakdown: ModifierBreakdown[];
}

/**
 * Individual modifier component
 */
export interface ModifierBreakdown {
  /** Source of the modifier (level, attribute, etc.) */
  source: string;
  /** Numeric value of the modifier */
  value: number;
  /** Whether this modifier is positive */
  positive: boolean;
}

/**
 * Data structure for reroll dialog rendering
 */
export interface RerollDialogData {
  /** The original roll being rerolled */
  originalRoll: FoundryRoll;
  /** Actor performing the reroll */
  actor: {
    name: string;
    fortunePoints: number;
  };
  /** Array of d10 results available for reroll */
  d10Results: D10Result[];
  /** Static modifiers from the original roll */
  staticModifiers: number;
  /** Original flavor text */
  originalFlavor: string;
  /** Current total of the roll */
  currentTotal: number;
  /** Number of currently selected dice */
  selectedCount: number;
  /** Whether reroll is possible */
  canReroll: boolean;
  /** Cost message to display */
  costMessage: string;
  /** Actor's current Fortune Points */
  fortunePoints: number;
}

/**
 * Validation result for reroll requests
 */
export interface RerollValidationResult {
  /** Whether the reroll request is valid */
  isValid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Validated actor data */
  actorData?: {
    fortunePoints: number;
    canAfford: boolean;
  };
  /** Validated dice selection */
  diceData?: {
    selectedCount: number;
    availableForReroll: number;
  };
}

/**
 * Configuration for building reroll formulas
 */
export interface RerollFormulaConfig {
  /** Updated d10 results after reroll */
  d10Results: D10Result[];
  /** Static modifiers to add */
  staticModifiers: number;
  /** Whether to show individual dice */
  showIndividualDice?: boolean;
}

/**
 * Outcome message data for reroll results
 */
export interface RerollOutcome {
  /** Number of dice rerolled */
  diceCount: number;
  /** Fortune Points spent */
  fortunePointsUsed: number;
  /** Remaining Fortune Points */
  remainingPoints: number;
  /** New total after reroll */
  newTotal?: number;
  /** Previous total before reroll */
  previousTotal?: number;
}

/**
 * Fortune Point availability check result
 */
export interface FortunePointAvailability {
  /** Whether Fortune Points are available */
  available: boolean;
  /** Current Fortune Point count */
  current: number;
  /** Maximum selectable dice */
  maxSelectable: number;
  /** Reason if not available */
  reason?: string;
}

/**
 * Dialog button configuration
 */
export interface DialogButton {
  /** Button label text */
  label: string;
  /** Icon class for the button */
  icon?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Click handler function */
  callback?: (event: Event) => void | Promise<void>;
}

/**
 * Dialog options for reroll dialog
 */
export interface RerollDialogOptions {
  /** Dialog width */
  width?: number;
  /** Dialog height */
  height?: number;
  /** Whether dialog is resizable */
  resizable?: boolean;
  /** Additional CSS classes */
  classes?: string[];
}

/**
 * FoundryVTT Roll interface (minimal required properties)
 */
export interface FoundryRoll {
  /** Roll formula */
  formula: string;
  /** Roll total */
  total: number;
  /** Roll terms */
  terms: RollTerm[];
  /** Whether the roll has been evaluated */
  _evaluated: boolean;
  /** Cached total value */
  _total: number;
  /** Create a chat message from this roll */
  toMessage(messageData: ChatMessageData): Promise<unknown>;
  /** Evaluate the roll */
  evaluate(): Promise<FoundryRoll>;
}

/**
 * Roll term interface
 */
export interface RollTerm {
  /** Type of term */
  constructor: {
    name: string;
  };
  /** Term results */
  results?: DieResult[];
  /** Numeric value for numeric terms */
  number?: number;
  /** Operator for operator terms */
  operator?: string;
  /** Whether the term has been evaluated */
  _evaluated?: boolean;
}

/**
 * Individual die result
 */
export interface DieResult {
  /** The rolled value */
  result: number;
  /** Whether this result is active */
  active: boolean;
  /** Whether this die was rerolled */
  rerolled?: boolean;
}

/**
 * Chat message data for roll messages
 */
export interface ChatMessageData {
  /** Message speaker */
  speaker: {
    actor?: string;
    token?: string;
    alias?: string;
  };
  /** Flavor text for the message */
  flavor: string;
  /** Roll mode to use */
  rollMode: string;
  /** Additional message content */
  content?: string;
}

 