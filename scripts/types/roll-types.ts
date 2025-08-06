/**
 * @fileoverview Roll System Type Definitions
 * @description TypeScript interfaces and types for the Role Utility Framework
 * @version 1.0.0
 * @author Avant Development Team
 */

/**
 * Represents a single modifier applied to a roll
 */
export interface RollModifier {
  /** Human-readable label for the modifier source */
  label: string;
  /** Numeric value to add to the roll */
  value: number;
  /** Optional category for grouping related modifiers */
  category?: ModifierCategory;
}

/**
 * Configuration options for roll payload generation
 */
export interface RollOptions {
  /** Custom flavor text for the roll */
  flavor?: string;
  /** Speaker data for chat messages */
  speaker?: any;
  /** Additional roll data for formula evaluation */
  rollData?: Record<string, any>;
  /** Whether to show individual modifiers in tooltip */
  showModifierBreakdown?: boolean;
  /** Roll mode for chat messages */
  rollMode?: RollMode;
  /** Whether to evaluate the roll immediately */
  evaluateRoll?: boolean;
}

/**
 * Complete roll payload ready for execution and display
 */
export interface RollPayload {
  /** Raw dice formula string (e.g., "2d10 + 2 + 3") */
  formula: string;
  /** Human-readable tooltip text with modifier breakdown */
  tooltip: string;
  /** Computed total value (helper for UI) */
  total: number;
  /** Base dice expression without modifiers */
  baseDice: string;
  /** Array of applied modifiers */
  modifiers: RollModifier[];
  /** Function to execute roll and post to chat */
  sendToChat: () => Promise<void>;
  /** Function to create Roll object without posting */
  createRoll: () => any;
}

/**
 * Result of roll validation operations
 */
export interface RollValidationResult {
  /** Whether the roll configuration is valid */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Warnings about the roll configuration */
  warnings?: string[];
  /** Suggested corrections for invalid configurations */
  suggestions?: string[];
}

/**
 * Performance metrics for roll operations
 */
export interface RollMetrics {
  /** Time taken to build roll payload (ms) */
  buildTime: number;
  /** Time taken to execute roll (ms) */
  executeTime: number;
  /** Memory usage for roll payload (bytes) */
  memoryUsage: number;
  /** Number of modifiers processed */
  modifierCount: number;
}

/**
 * Configuration for roll performance monitoring
 */
export interface RollPerformanceConfig {
  /** Whether to collect performance metrics */
  enabled: boolean;
  /** Threshold for slow roll warnings (ms) */
  slowRollThreshold: number;
  /** Maximum number of metrics to store */
  maxMetrics: number;
  /** Whether to log performance warnings */
  logWarnings: boolean;
}

/**
 * Error handling configuration for roll operations
 */
export interface RollErrorHandling {
  /** Strategy for invalid dice expressions */
  invalidDice: 'fallback' | 'error' | 'warn';
  /** Strategy for missing modifiers */
  missingModifiers: 'ignore' | 'zero' | 'error';
  /** Strategy for chat posting failures */
  chatFailure: 'retry' | 'local' | 'error';
  /** Number of retry attempts for failed operations */
  retryAttempts: number;
}

/**
 * Common roll types supported by the system
 */
export type RollType = 'attribute' | 'skill' | 'weapon-attack' | 'weapon-damage' | 'armor' | 'generic';

/**
 * Modifier categories for organization
 */
export type ModifierCategory = 'attribute' | 'level' | 'gear' | 'situational' | 'feat' | 'condition';

/**
 * Chat message roll modes
 */
export type RollMode = 'publicroll' | 'gmroll' | 'blindroll' | 'selfroll';

/**
 * Dice expression validation result
 */
export interface DiceValidationResult {
  /** Whether the dice expression is valid */
  valid: boolean;
  /** Parsed dice components */
  components?: DiceComponent[];
  /** Error message if invalid */
  error?: string;
}

/**
 * Individual dice component in an expression
 */
export interface DiceComponent {
  /** Type of component (die, modifier, etc.) */
  type: 'die' | 'modifier' | 'function';
  /** Raw text of the component */
  text: string;
  /** Parsed value or configuration */
  value: number | string;
}

/**
 * Roll builder configuration for specific roll types
 */
export interface RollBuilderConfig {
  /** Default base dice expression */
  defaultDice: string;
  /** Required modifier categories */
  requiredModifiers: ModifierCategory[];
  /** Optional modifier categories */
  optionalModifiers: ModifierCategory[];
  /** Custom flavor text template */
  flavorTemplate?: string;
  /** Performance configuration */
  performance?: RollPerformanceConfig;
  /** Error handling configuration */
  errorHandling?: RollErrorHandling;
}

/**
 * Actor-specific roll configuration
 */
export interface ActorRollConfig extends RollBuilderConfig {
  /** Actor document reference */
  actor: any;
  /** Whether to include level modifier */
  includeLevel: boolean;
  /** Whether to include attribute modifiers */
  includeAttribute: boolean;
  /** Custom modifier sources */
  customModifiers?: string[];
}

/**
 * Item-specific roll configuration
 */
export interface ItemRollConfig extends RollBuilderConfig {
  /** Item document reference */
  item: any;
  /** Actor document reference */
  actor: any;
  /** Whether to include item modifiers */
  includeItemModifiers: boolean;
  /** Whether to include actor modifiers */
  includeActorModifiers: boolean;
}

/**
 * Tooltip configuration for roll buttons
 */
export interface TooltipConfig {
  /** Whether to show tooltips */
  enabled: boolean;
  /** Tooltip position relative to button */
  position: 'top' | 'bottom' | 'left' | 'right';
  /** Delay before showing tooltip (ms) */
  delay: number;
  /** Whether to show modifier breakdown */
  showBreakdown: boolean;
  /** Maximum width of tooltip */
  maxWidth: number;
}

/**
 * Chat message configuration for rolls
 */
export interface ChatConfig {
  /** Whether to post to chat automatically */
  autoPost: boolean;
  /** Template for chat message flavor */
  flavorTemplate?: string;
  /** Whether to show roll formula in chat */
  showFormula: boolean;
  /** Whether to show modifier breakdown in chat */
  showModifiers: boolean;
  /** Custom CSS classes for chat message */
  cssClasses?: string[];
}

/**
 * Comprehensive roll system configuration
 */
export interface RollSystemConfig {
  /** Performance monitoring configuration */
  performance: RollPerformanceConfig;
  /** Error handling configuration */
  errorHandling: RollErrorHandling;
  /** Tooltip configuration */
  tooltips: TooltipConfig;
  /** Chat message configuration */
  chat: ChatConfig;
  /** Whether to enable debug logging */
  debug: boolean;
}

/**
 * Default configuration values
 */
export const DEFAULT_ROLL_CONFIG: RollSystemConfig = {
  performance: {
    enabled: true,
    slowRollThreshold: 1.0,
    maxMetrics: 100,
    logWarnings: true
  },
  errorHandling: {
    invalidDice: 'warn',
    missingModifiers: 'zero',
    chatFailure: 'retry',
    retryAttempts: 3
  },
  tooltips: {
    enabled: true,
    position: 'top',
    delay: 500,
    showBreakdown: true,
    maxWidth: 300
  },
  chat: {
    autoPost: true,
    showFormula: true,
    showModifiers: true,
    cssClasses: ['avant-roll-message']
  },
  debug: false
};

/**
 * Roll builder function signature
 */
export type RollBuilder<T = any> = (
  data: T,
  options?: RollOptions
) => Promise<RollPayload>;

/**
 * Roll validation function signature
 */
export type RollValidator = (
  baseDice: string,
  modifiers: RollModifier[]
) => RollValidationResult;

/**
 * Performance measurement function signature
 */
export type PerformanceMeasurer<T> = (
  operation: () => T
) => { result: T; metrics: RollMetrics };

/**
 * Error handler function signature
 */
export type ErrorHandler = (
  error: Error,
  context: string,
  config: RollErrorHandling
) => void;

/**
 * Tooltip formatter function signature
 */
export type TooltipFormatter = (
  payload: RollPayload,
  config: TooltipConfig
) => string;

/**
 * Chat message formatter function signature
 */
export type ChatFormatter = (
  payload: RollPayload,
  config: ChatConfig
) => any;

/**
 * Utility type for extracting roll data from various sources
 */
export type RollDataExtractor<T> = (source: T) => {
  baseDice: string;
  modifiers: RollModifier[];
  options?: RollOptions;
};

/**
 * Type guard for RollModifier
 */
export function isRollModifier(obj: any): obj is RollModifier {
  return obj && 
         typeof obj === 'object' &&
         typeof obj.label === 'string' &&
         typeof obj.value === 'number';
}

/**
 * Type guard for RollPayload
 */
export function isRollPayload(obj: any): obj is RollPayload {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.formula === 'string' &&
         typeof obj.tooltip === 'string' &&
         typeof obj.total === 'number' &&
         typeof obj.baseDice === 'string' &&
         Array.isArray(obj.modifiers) &&
         typeof obj.sendToChat === 'function' &&
         typeof obj.createRoll === 'function';
}

/**
 * Type guard for RollValidationResult
 */
export function isRollValidationResult(obj: any): obj is RollValidationResult {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.valid === 'boolean';
}