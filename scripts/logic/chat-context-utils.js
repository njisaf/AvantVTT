/**
 * @fileoverview Chat Context Utils - Pure Functions
 * @version 1.0.0
 * @author Avant VTT Team
 * @description Pure business logic functions for chat context menu functionality
 */

/**
 * Extracts an actor from a chat message by looking up the speaker's actor ID.
 * This function safely accesses the game.actors collection and handles missing data.
 * 
 * @param {Object} message - The chat message object with speaker information
 * @returns {Object|null} The actor object if found, null if not found or invalid
 * 
 * @example
 * const message = { speaker: { actor: 'actor-123' } };
 * const actor = getActorFromMessage(message);
 * // Returns actor object or null
 */
export function getActorFromMessage(message) {
    // Check if we have the basic structure we need
    if (!message || !message.speaker || !message.speaker.actor) {
        return null;
    }
    
    // Check if game.actors is available
    if (!global.game || !global.game.actors || !global.game.actors.get) {
        return null;
    }
    
    const actorId = message.speaker.actor;
    const actor = global.game.actors.get(actorId);
    
    return actor || null;
}

/**
 * Checks if a roll is eligible for reroll by examining its dice terms.
 * A roll is eligible if it contains exactly 2d10 dice (may be split across terms).
 * 
 * @param {Object} roll - The roll object to check for eligibility
 * @returns {boolean} True if the roll contains exactly 2d10 dice, false otherwise
 * 
 * @example
 * const roll = { terms: [{ faces: 10, number: 2 }] };
 * const eligible = isEligibleRoll(roll);
 * // Returns true if exactly 2d10, false otherwise
 */
export function isEligibleRoll(roll) {
    // Basic validation
    if (!roll || !roll.terms || !Array.isArray(roll.terms)) {
        return false;
    }
    
    // Check if foundry.dice.terms.Die is available
    if (!global.foundry || !global.foundry.dice || !global.foundry.dice.terms || !global.foundry.dice.terms.Die) {
        return false;
    }
    
    let d10Count = 0;
    
    // Count all d10 dice across all terms
    for (const term of roll.terms) {
        // Check if this term is a Die with 10 faces
        if (term instanceof global.foundry.dice.terms.Die && term.faces === 10) {
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
 * @param {Object} element - The DOM element or jQuery object to extract the message ID from
 * @returns {string|null} The message ID if found, null if not found
 * 
 * @example
 * const element = { dataset: { messageId: 'msg-123' } };
 * const messageId = extractMessageId(element);
 * // Returns 'msg-123'
 */
export function extractMessageId(element) {
    if (!element) {
        return null;
    }
    
    // Try dataset first (v13 style)
    if (element.dataset && element.dataset.messageId) {
        return element.dataset.messageId;
    }
    
    // Try getAttribute fallback
    if (element.getAttribute && typeof element.getAttribute === 'function') {
        const messageId = element.getAttribute('data-message-id');
        if (messageId) {
            return messageId;
        }
    }
    
    // Try jQuery data method (v12 compatibility)
    if (element.data && typeof element.data === 'function') {
        const messageId = element.data('messageId');
        if (messageId) {
            return messageId;
        }
    }
    
    // Try jQuery attr method as final fallback
    if (element.attr && typeof element.attr === 'function') {
        const messageId = element.attr('data-message-id');
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
 * @param {Object} messageData - Data about the message including roll, actor, and flavor
 * @returns {Object} Menu entry configuration with name, icon, condition, and callback
 * 
 * @example
 * const messageData = { roll: {}, actor: {}, flavor: 'Test' };
 * const menuEntry = buildRerollMenuEntry(messageData);
 * // Returns { name: "Reroll...", icon: "...", condition: fn, callback: fn }
 */
export function buildRerollMenuEntry(messageData) {
    return {
        name: "Reroll with Fortune Points",
        icon: '<i class="fas fa-dice"></i>',
        condition: () => {
            // Menu entry is available if we have an actor (roll eligibility already checked)
            return messageData && messageData.actor !== null;
        },
        callback: () => {
            // Return action data rather than performing side effects
            return {
                action: 'openRerollDialog',
                roll: messageData.roll,
                actor: messageData.actor,
                flavor: messageData.flavor
            };
        }
    };
}

/**
 * Validates a complete chat message for reroll eligibility.
 * Checks all requirements: has rolls, actor exists, roll is eligible.
 * 
 * @param {Object} message - The complete chat message to validate
 * @returns {Object} Validation result with isValid flag and extracted data or reason
 * 
 * @example
 * const message = { id: 'msg-1', speaker: { actor: 'actor-1' }, rolls: [...] };
 * const validation = validateMessageForReroll(message);
 * // Returns { isValid: true/false, messageId, actor, roll, flavor, reason }
 */
export function validateMessageForReroll(message) {
    const baseResult = {
        isValid: false,
        messageId: message?.id || null,
        actor: null,
        roll: null,
        flavor: null,
        reason: null
    };
    
    // Check if message has rolls
    if (!message?.rolls || message.rolls.length === 0) {
        return {
            ...baseResult,
            reason: 'No rolls found in message'
        };
    }
    
    // Get the first roll
    const roll = message.rolls[0];
    
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
        messageId: message.id,
        actor: actor,
        roll: roll,
        flavor: message.flavor || null,
        reason: null
    };
}

/**
 * Creates a callback function for reroll menu entries.
 * The callback returns action data rather than performing side effects directly.
 * 
 * @param {Object} messageData - Data about the message including roll, actor, and flavor
 * @returns {Function} Callback function that returns reroll action data
 * 
 * @example
 * const messageData = { roll: {}, actor: {}, flavor: 'Test' };
 * const callback = createRerollCallback(messageData);
 * const action = callback(); // { action: 'openRerollDialog', ... }
 */
export function createRerollCallback(messageData) {
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
 * @param {Object} actor - The actor to check for reroll permission
 * @returns {boolean} True if actor has fortune points available, false otherwise
 * 
 * @example
 * const actor = { system: { fortunePoints: { current: 3 } } };
 * const canReroll = hasRerollPermission(actor);
 * // Returns true if fortunePoints.current > 0
 */
export function hasRerollPermission(actor) {
    if (!actor || !actor.system) {
        return false;
    }
    
    const fortunePoints = actor.system.fortunePoints;
    if (!fortunePoints || typeof fortunePoints.current !== 'number') {
        return false;
    }
    
    return fortunePoints.current > 0;
} 