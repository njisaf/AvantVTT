/**
 * @fileoverview Chat Context Menu Types
 * @description Type definitions for chat context menu functionality and reroll system
 * @author Avant VTT Team
 * @version 1.0.0
 */

import type { Actor } from '../foundry/index.js';

// FoundryVTT types not yet fully defined in our types
type ChatMessage = any;
type Roll = any;
type JQuery<T = HTMLElement> = any;

/**
 * Validation result for message reroll eligibility
 */
export interface MessageValidationResult {
  /** Whether the message is valid for rerolling */
  isValid: boolean;
  
  /** ID of the chat message */
  messageId: string | null;
  
  /** Actor associated with the message */
  actor: Actor | null;
  
  /** Roll object from the message */
  roll: Roll | null;
  
  /** Flavor text from the message */
  flavor: string | null;
  
  /** Reason for validation failure (if any) */
  reason: string | null;
}

/**
 * Context menu option configuration
 */
export interface ContextMenuOption {
  /** Display name for the menu option */
  name: string;
  
  /** HTML icon for the menu option */
  icon: string;
  
  /** Function to determine if option should be visible */
  condition: (element: HTMLElement | JQuery<HTMLElement>) => boolean;
  
  /** Function to execute when option is selected */
  callback: (element: HTMLElement | JQuery<HTMLElement>) => void;
}

/**
 * Action data returned by context menu callbacks
 */
export interface RerollActionData {
  /** Type of action to perform */
  action: 'openRerollDialog';
  
  /** Roll to be rerolled */
  roll: Roll;
  
  /** Actor performing the reroll */
  actor: Actor;
  
  /** Flavor text for the reroll */
  flavor: string | null;
}

/**
 * Message data extracted for reroll operations
 */
export interface RerollMessageData {
  /** Chat message ID */
  messageId: string;
  
  /** Roll object from the message */
  roll: Roll;
  
  /** Actor associated with the message */
  actor: Actor;
  
  /** Flavor text from the message */
  flavor: string | null;
}

/**
 * Options for context menu creation
 */
export interface ContextMenuCreationOptions {
  /** Whether to include debug logging */
  debug?: boolean;
  
  /** Timeout for async operations */
  timeout?: number;
}

/**
 * Callback function type for reroll actions
 */
export type RerollCallback = () => RerollActionData;

/**
 * Function type for extracting message IDs
 */
export type MessageIdExtractor = (element: HTMLElement | JQuery<HTMLElement>) => string | null;

/**
 * Function type for validating messages
 */
export type MessageValidator = (message: ChatMessage) => MessageValidationResult;

/**
 * Function type for checking roll eligibility
 */
export type RollEligibilityChecker = (roll: Roll) => boolean;

/**
 * Function type for actor permission checking
 */
export type PermissionChecker = (actor: Actor) => boolean;

/**
 * Context menu entry configuration
 */
export interface ContextMenuEntry {
  /** Display label for the menu entry */
  label?: string;
  /** Menu entry name/identifier */
  name?: string;
  /** HTML icon for the menu entry */
  icon?: string;
  /** Function to determine if entry is enabled */
  condition?: boolean;
  /** Whether the entry is enabled */
  enabled?: boolean;
  /** Callback function when entry is selected */
  callback?: (li: HTMLElement) => void;
} 