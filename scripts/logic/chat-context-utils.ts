/**
 * @fileoverview Chat Context Utils - Pure Functions
 * @version 1.0.0
 * @author Avant VTT Team
 * @description Pure business logic functions for chat context menu functionality
 */

import type { ContextMenuEntry } from '../types/domain/chat-context';

/**
 * Validation result for message reroll eligibility.
 * Contains status, extracted data, and reason for failure if applicable.
 */
export interface MessageRerollValidation {
  /** Whether the message is valid for reroll */
  isValid: boolean;
  /** The message ID */
  messageId: string | null;
  /** The actor if found */
  actor: unknown | null;
  /** The roll if found */
  roll: unknown | null;
  /** The flavor text if any */
  flavor: string | null;
  /** Reason for failure if not valid */
  reason: string | null;
}

/**
 * Reroll action data returned by callbacks.
 * Contains the action type and necessary data for performing the reroll.
 */
export interface RerollActionData {
  /** The action to perform */
  action: 'openRerollDialog';
  /** The roll to reroll */
  roll: unknown;
  /** The actor performing the reroll */
  actor: unknown;
  /** The flavor text for the roll */
  flavor: string | null;
}

/**
 * Extracts an actor from a chat message by looking up the speaker's actor ID.
 * This function safely accesses the game.actors collection and handles missing data.
 * 
 * @param message - The chat message object with speaker information
 * @returns The actor object if found, null if not found or invalid
 * 
 * @example
 * ```typescript
 * const message = { speaker: { actor: 'actor-123' } };
 * const actor = getActorFromMessage(message);
 * // Returns actor object or null
 * ```
 */
export function getActorFromMessage(message: unknown): unknown | null {
    // Check if we have the basic structure we need
    if (!message || typeof message !== 'object' || message === null) {
        return null;
    }
    
    const messageObj = message as any;
    if (!messageObj.speaker || !messageObj.speaker.actor) {
        return null;
    }
    
    // Check if game.actors is available
    if (typeof game === 'undefined' || !game?.actors?.get) {
        return null;
    }
    
    const actorId = messageObj.speaker.actor;
    const actor = (game as any).actors.get(actorId);
    
    return actor || null;
}

/**
 * Checks if a roll is eligible for reroll by examining its dice terms.
 * A roll is eligible if it contains exactly 2d10 dice (may be split across terms).
 * 
 * @param roll - The roll object to check for eligibility
 * @returns True if the roll contains exactly 2d10 dice, false otherwise
 * 
 * @example
 * ```typescript
 * const roll = { terms: [{ faces: 10, number: 2 }] };
 * const eligible = isEligibleRoll(roll);
 * // Returns true if exactly 2d10, false otherwise
 * ```
 */
export function isEligibleRoll(roll: unknown): boolean {
    // Basic validation
    if (!roll || typeof roll !== 'object' || roll === null) {
        return false;
    }
    
    const rollObj = roll as any;
    if (!rollObj.terms || !Array.isArray(rollObj.terms)) {
        return false;
    }
    
    // Check if foundry.dice.terms.Die is available
    if (typeof foundry === 'undefined' || !foundry?.dice?.terms?.Die) {
        return false;
    }
    
    let d10Count = 0;
    
    // Count all d10 dice across all terms
    for (const term of rollObj.terms) {
        // Check if this term is a Die with 10 faces
        if (term instanceof (foundry as any).dice.terms.Die && term.faces === 10) {
            d10Count += term.number;
        }
    }
    
    // Roll is eligible if it has exactly 2d10
    return d10Count === 2;
}

/**
 * Extracts a message ID from a DOM element using various methods for v12/v13 compatibility.
 * Tries multiple approaches: dataset, getAttribute, jQuery data(), and jQuery attr().
 * 
 * @param element - The DOM element or jQuery object to extract the message ID from
 * @returns The message ID if found, null if not found
 * 
 * @example
 * ```typescript
 * const element = { dataset: { messageId: 'msg-123' } };
 * const messageId = extractMessageId(element);
 * // Returns 'msg-123'
 * ```
 */
export function extractMessageId(element: unknown): string | null {
    if (!element || typeof element !== 'object' || element === null) {
        return null;
    }
    
    const elementObj = element as any;
    
    // Try dataset first (v13 style)
    if (elementObj.dataset && elementObj.dataset.messageId) {
        return elementObj.dataset.messageId;
    }
    
    // Try getAttribute fallback
    if (elementObj.getAttribute && typeof elementObj.getAttribute === 'function') {
        const messageId = elementObj.getAttribute('data-message-id');
        if (messageId) {
            return messageId;
        }
    }
    
    // Try jQuery data method (v12 compatibility)
    if (elementObj.data && typeof elementObj.data === 'function') {
        const messageId = elementObj.data('messageId');
        if (messageId) {
            return messageId;
        }
    }
    
    // Try jQuery attr method as final fallback
    if (elementObj.attr && typeof elementObj.attr === 'function') {
        const messageId = elementObj.attr('data-message-id');
        if (messageId) {
            return messageId;
        }
    }
    
    return null;
}

/**
 * Creates a reroll menu entry configuration for context menus.
 * Returns a standardized menu entry object with icon, condition, and callback.
 * 
 * @param messageData - Data about the message including roll, actor, and flavor
 * @returns Menu entry configuration with name, icon, condition, and callback
 * 
 * @example
 * ```typescript
 * const messageData = { roll: {}, actor: {}, flavor: 'Test' };
 * const menuEntry = buildRerollMenuEntry(messageData);
 * // Returns { name: "Reroll...", icon: "...", condition: fn, callback: fn }
 * ```
 */
export function buildRerollMenuEntry(messageData: { roll: unknown; actor: unknown; flavor: string | null }): ContextMenuEntry {
    return {
        label: "Reroll with Fortune Points",
        icon: '<i class="fas fa-dice"></i>',
        callback: () => {
            // Return action data rather than performing side effects
            return {
                action: 'openRerollDialog',
                roll: messageData.roll,
                actor: messageData.actor,
                flavor: messageData.flavor
            } as RerollActionData;
        },
        enabled: messageData && messageData.actor !== null
    };
}

/**
 * Validates a complete chat message for reroll eligibility.
 * Checks all requirements: has rolls, actor exists, roll is eligible.
 * 
 * @param message - The complete chat message to validate
 * @returns Validation result with isValid flag and extracted data or reason
 * 
 * @example
 * ```typescript
 * const message = { id: 'msg-1', speaker: { actor: 'actor-1' }, rolls: [...] };
 * const validation = validateMessageForReroll(message);
 * // Returns { isValid: true/false, messageId, actor, roll, flavor, reason }
 * ```
 */
export function validateMessageForReroll(message: unknown): MessageRerollValidation {
    const messageObj = message as any;
    const baseResult: MessageRerollValidation = {
        isValid: false,
        messageId: messageObj?.id || null,
        actor: null,
        roll: null,
        flavor: null,
        reason: null
    };
    
    // Check if message has rolls
    if (!messageObj?.rolls || messageObj.rolls.length === 0) {
        return {
            ...baseResult,
            reason: 'No rolls found in message'
        };
    }
    
    // Get the first roll
    const roll = messageObj.rolls[0];
    
    // Try to get the actor
    const actor = getActorFromMessage(message);
    if (!actor) {
        return {
            ...baseResult,
            reason: 'Actor not found'
        };
    }
    
    // Check if roll is eligible
    if (!isEligibleRoll(roll)) {
        return {
            ...baseResult,
            actor: actor,
            roll: roll,
            reason: 'Roll not eligible for reroll'
        };
    }
    
    // All checks passed
    return {
        isValid: true,
        messageId: messageObj.id,
        actor: actor,
        roll: roll,
        flavor: messageObj.flavor || null,
        reason: null
    };
}

/**
 * Creates a callback function for reroll menu entries.
 * The callback returns action data rather than performing side effects directly.
 * 
 * @param messageData - Data about the message including roll, actor, and flavor
 * @returns Callback function that returns reroll action data
 * 
 * @example
 * ```typescript
 * const messageData = { roll: {}, actor: {}, flavor: 'Test' };
 * const callback = createRerollCallback(messageData);
 * const action = callback(); // { action: 'openRerollDialog', ... }
 * ```
 */
export function createRerollCallback(messageData: { roll: unknown; actor: unknown; flavor: string | null }): () => RerollActionData {
    return () => {
        return {
            action: 'openRerollDialog',
            roll: messageData.roll,
            actor: messageData.actor,
            flavor: messageData.flavor
        };
    };
}

/**
 * Checks if an actor has permission to perform rerolls based on their Fortune Points.
 * An actor can reroll if they have at least 1 current Fortune Point.
 * 
 * @param actor - The actor to check for reroll permission
 * @returns True if actor has fortune points available, false otherwise
 * 
 * @example
 * ```typescript
 * const actor = { system: { fortunePoints: { current: 3 } } };
 * const canReroll = hasRerollPermission(actor);
 * // Returns true if fortunePoints.current > 0
 * ```
 */
export function hasRerollPermission(actor: unknown): boolean {
    if (!actor || typeof actor !== 'object' || actor === null) {
        return false;
    }
    
    const actorObj = actor as any;
    if (!actorObj.system) {
        return false;
    }
    
    const fortunePoints = actorObj.system.fortunePoints;
    if (!fortunePoints || typeof fortunePoints.current !== 'number') {
        return false;
    }
    
    return fortunePoints.current > 0;
} 