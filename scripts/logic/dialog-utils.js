/**
 * @fileoverview Dialog Utility Functions (Pure Logic)
 * @version 2.1.0
 * @description Pure functions for dialog business logic, extracted from FoundryVTT integration code
 * @author Avant Development Team
 * 
 * IMPORTANT: This module contains ONLY pure functions with NO external dependencies.
 * No FoundryVTT APIs, no DOM manipulation, no side effects.
 * All functions should be predictable: same input always produces same output.
 */

/**
 * Checks if an actor has any fortune points available for rerolling dice.
 * 
 * This function looks at the actor's current fortune point total and returns
 * true if they have at least one point they can spend on rerolls.
 * 
 * @param {Object|null} actor - The actor object to check
 * @returns {boolean} True if the actor has fortune points available, false otherwise
 * 
 * @example
 * // Actor with fortune points
 * const actor = { system: { fortunePoints: 3 } };
 * const canReroll = hasAvailableFortunePoints(actor);
 * // Result: true
 * 
 * @example
 * // Actor without fortune points  
 * const actor = { system: { fortunePoints: 0 } };
 * const canReroll = hasAvailableFortunePoints(actor);
 * // Result: false
 */
export function hasAvailableFortunePoints(actor) {
    if (!actor?.system) {
        return false;
    }
    
    const fortunePoints = actor.system.fortunePoints || 0;
    return fortunePoints > 0;
}

/**
 * Calculates the cost information for a reroll request.
 * 
 * This function determines how many fortune points the actor has available,
 * whether they can afford any rerolls, and what the maximum number of
 * dice they could reroll would be.
 * 
 * @param {Object|null} actor - The actor attempting to reroll
 * @returns {Object} Cost calculation with available points, affordability, and max rerolls
 * 
 * @example
 * // Actor with 3 fortune points
 * const actor = { system: { fortunePoints: 3 } };
 * const cost = calculateRerollCost(actor);
 * // Result: { available: 3, canAfford: true, maxRerolls: 3 }
 */
export function calculateRerollCost(actor) {
    if (!actor?.system) {
        return {
            available: 0,
            canAfford: false,
            maxRerolls: 0
        };
    }
    
    const available = actor.system.fortunePoints || 0;
    
    return {
        available: available,
        canAfford: available > 0,
        maxRerolls: available
    };
}

/**
 * Extracts d10 dice results from a completed roll.
 * 
 * This function looks through all the terms in a roll and finds the d10 dice,
 * then extracts their individual results along with whether each die was 
 * previously rerolled. Only active dice results are included.
 * 
 * @param {Object|null} roll - The completed roll object to extract from
 * @returns {Array} Array of die data objects with value and reroll status
 * 
 * @example
 * // Roll with 2d10 showing 7 and 3
 * const roll = {
 *   terms: [{
 *     constructor: { name: 'Die' },
 *     faces: 10,
 *     results: [
 *       { result: 7, active: true, rerolled: false },
 *       { result: 3, active: true, rerolled: false }
 *     ]
 *   }]
 * };
 * const dice = extractD10Results(roll);
 * // Result: [{ value: 7, wasRerolled: false }, { value: 3, wasRerolled: false }]
 */
export function extractD10Results(roll) {
    if (!roll?.terms) {
        return [];
    }
    
    const d10Results = [];
    
    for (const term of roll.terms) {
        // Check if this is a d10 die term
        if (term?.constructor?.name === 'Die' && term.faces === 10) {
            // Safely check if results exist and is iterable
            if (term.results && Array.isArray(term.results)) {
                for (const result of term.results) {
                    if (result?.active) {
                        d10Results.push({
                            value: result.result,
                            wasRerolled: result.rerolled || false
                        });
                    }
                }
            }
        }
    }
    
    return d10Results;
}

/**
 * Extracts static modifiers (non-dice numbers) from a completed roll.
 * 
 * This function looks through all the terms in a roll and finds numeric
 * terms (like attribute modifiers, skill bonuses, etc.) and adds them up
 * to get the total static modifier that was applied to the roll.
 * 
 * @param {Object|null} roll - The completed roll object to extract from
 * @returns {number} The sum of all static numeric modifiers in the roll
 * 
 * @example
 * // Roll with +3 attribute mod and +2 skill bonus
 * const roll = {
 *   terms: [
 *     { constructor: { name: 'Die' }, faces: 10 },
 *     { constructor: { name: 'OperatorTerm' }, operator: '+' },
 *     { constructor: { name: 'NumericTerm' }, number: 3 },
 *     { constructor: { name: 'OperatorTerm' }, operator: '+' },
 *     { constructor: { name: 'NumericTerm' }, number: 2 }
 *   ]
 * };
 * const modifiers = extractStaticModifiers(roll);
 * // Result: 5 (3 + 2)
 */
export function extractStaticModifiers(roll) {
    if (!roll?.terms) {
        return 0;
    }
    
    let staticModifiers = 0;
    
    for (const term of roll.terms) {
        if (term?.constructor?.name === 'NumericTerm' && typeof term.number === 'number') {
            staticModifiers += term.number;
        }
    }
    
    return staticModifiers;
}

/**
 * Extracts clean roll name from HTML-rich flavor text.
 * 
 * This function removes HTML tags and trait chip markup from flavor text,
 * extracting only the core roll name for display in UI contexts where
 * HTML is not appropriate (like dialog titles). Use this at the SOURCE
 * when creating dialogs, not during rendering.
 * 
 * @param {string|null} flavor - The original flavor text that may contain HTML
 * @returns {string} Clean roll name without HTML markup
 * 
 * @example
 * // Extract clean name when creating dialog
 * const htmlFlavor = 'New Weapon Attack<br /><div class="trait-chips-wrapper">...</div>';
 * const cleanName = cleanFlavorForDisplay(htmlFlavor);
 * const dialog = new AvantRerollDialog(roll, actor, cleanName);
 * // Result: "New Weapon Attack"
 * 
 * @example
 * // Works with already clean text too
 * const cleanName = cleanFlavorForDisplay('Athletics Check');
 * // Result: "Athletics Check"
 */
export function cleanFlavorForDisplay(flavor) {
    if (!flavor || typeof flavor !== 'string') {
        return '';
    }
    
    // First, decode HTML entities (in case the text was already escaped)
    let cleaned = flavor
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'");
    
    // Remove everything after the first HTML tag (usually <br/> followed by trait chips)
    const firstTagIndex = cleaned.indexOf('<');
    if (firstTagIndex !== -1) {
        cleaned = cleaned.substring(0, firstTagIndex);
    }
    
    // Clean up any remaining whitespace
    cleaned = cleaned.trim();
    
    // If we ended up with an empty string, return a fallback
    return cleaned || 'Roll';
}

/**
 * Builds the complete data object needed to display the reroll dialog.
 * 
 * This function takes the extracted dice results and actor information and
 * formats it into the structure that the dialog template expects. It 
 * calculates which dice can be rerolled and determines the maximum possible
 * rerolls based on available fortune points.
 * 
 * @param {Object} originalRoll - The original roll being rerolled
 * @param {Object} actor - The actor performing the reroll
 * @param {Array} d10Results - Extracted d10 dice results
 * @param {number} staticModifiers - Static modifiers from the roll
 * @param {string} cleanRollName - Clean name of the roll (no HTML)
 * @returns {Object} Complete dialog data structure
 * 
 * @example
 * // Build data for a reroll dialog
 * const roll = { total: 15 };
 * const actor = { system: { fortunePoints: 2 } };
 * const dice = [{ value: 7, wasRerolled: false }, { value: 3, wasRerolled: false }];
 * const data = buildDialogData(roll, actor, dice, 5, 'Athletics Check');
 * // Result: Complete dialog data with dice options and Fortune Point info
 */
export function buildDialogData(originalRoll, actor, d10Results, staticModifiers, cleanRollName) {
    const fortunePoints = actor?.system?.fortunePoints || 0;
    const maxRerolls = Math.min(d10Results.length, fortunePoints);
    
    return {
        d10Results: d10Results.map((result, index) => ({
            index: index,
            value: result.value,
            selected: false, // Initially no dice are selected
            wasRerolled: result.wasRerolled,
            canReroll: !result.wasRerolled // Can only reroll dice that haven't been rerolled yet
        })),
        selectedCount: 0, // No dice selected initially
        fortunePoints: fortunePoints,
        maxRerolls: maxRerolls,
        canReroll: false, // Can't reroll until dice are selected
        originalTotal: originalRoll?.total || 0,
        originalFlavor: cleanRollName // Clean roll name (no HTML processing needed)
    };
}

/**
 * Generates a cost message based on fortune points and selected dice.
 * 
 * This function creates user-friendly text that explains the cost of rerolling
 * and guides the player on what they can do. It handles different scenarios
 * like having no points, needing to select dice, or showing the actual cost.
 * 
 * @param {number} fortunePoints - Number of fortune points available
 * @param {number} selectedCount - Number of dice currently selected for reroll
 * @returns {string} User-friendly cost message
 * 
 * @example
 * // No fortune points available
 * const message = getCostMessage(0, 0);
 * // Result: "No Fortune Points available!"
 * 
 * @example
 * // Has points but no dice selected
 * const message = getCostMessage(3, 0);
 * // Result: "Select dice to reroll (3 Fortune Points available)"
 * 
 * @example
 * // Has points and dice selected
 * const message = getCostMessage(3, 2);
 * // Result: "Reroll for 2 Fortune Points"
 */
export function getCostMessage(fortunePoints, selectedCount) {
    if (fortunePoints === 0) {
        return 'No Fortune Points available!';
    }
    
    if (selectedCount === 0) {
        const pointText = fortunePoints === 1 ? 'Fortune Point' : 'Fortune Points';
        return `Select dice to reroll (${fortunePoints} ${pointText} available)`;
    }
    
    const pointText = selectedCount === 1 ? 'Fortune Point' : 'Fortune Points';
    return `Reroll for ${selectedCount} ${pointText}`;
}

/**
 * Validates whether a reroll request can proceed.
 * 
 * This function checks if the player has selected dice to reroll, has enough
 * fortune points to pay for the reroll, and if the original message contains
 * valid roll data. It returns detailed information about what's wrong if
 * the request can't proceed.
 * 
 * @param {Object} message - The original chat message with roll data
 * @param {Object} actor - The actor attempting to reroll
 * @param {Array} selectedDice - Array of dice indices selected for reroll
 * @returns {Object} Validation result with success status and error details
 * 
 * @example
 * // Valid reroll request
 * const message = { rolls: [{ total: 15 }] };
 * const actor = { system: { fortunePoints: 2 } };
 * const selected = [0, 1];
 * const result = validateRerollRequest(message, actor, selected);
 * // Result: { isValid: true, canProceed: true, error: null }
 * 
 * @example
 * // Invalid - not enough points
 * const result = validateRerollRequest(message, { system: { fortunePoints: 1 } }, [0, 1]);
 * // Result: { isValid: false, canProceed: false, error: "Not enough Fortune Points!" }
 */
export function validateRerollRequest(message, actor, selectedDice) {
    // Check if any dice are selected
    if (!selectedDice || selectedDice.length === 0) {
        return {
            isValid: false,
            canProceed: false,
            error: 'Please select at least one die to reroll.'
        };
    }
    
    // Check if message has rolls
    if (!message?.rolls || message.rolls.length === 0) {
        return {
            isValid: false,
            canProceed: false,
            error: 'No rolls found in message'
        };
    }
    
    // Check fortune points
    const fortunePoints = actor?.system?.fortunePoints || 0;
    if (selectedDice.length > fortunePoints) {
        return {
            isValid: false,
            canProceed: false,
            error: 'Not enough Fortune Points!'
        };
    }
    
    return {
        isValid: true,
        canProceed: true,
        error: null
    };
}

/**
 * Builds a formula string for the rerolled dice result.
 * 
 * This function takes the new dice values after rerolling and creates
 * a readable formula string that shows each die result plus any static
 * modifiers. This is used to display the math behind the new total.
 * 
 * @param {Array} d10Results - Array of die results with values
 * @param {number} staticModifiers - Static modifiers to add
 * @returns {string} Formula string showing the calculation
 * 
 * @example
 * // Two dice rerolled to 8 and 3, with +5 modifier
 * const dice = [{ value: 8, wasRerolled: true }, { value: 3, wasRerolled: false }];
 * const formula = buildRerollFormula(dice, 5);
 * // Result: "8 + 3 + 5"
 */
export function buildRerollFormula(d10Results, staticModifiers) {
    if (!d10Results || d10Results.length === 0) {
        return staticModifiers === 0 ? '0' : `0 + ${staticModifiers}`;
    }
    
    const diceValues = d10Results.map(die => die.value.toString());
    let formula = diceValues.join(' + ');
    
    if (staticModifiers !== 0) {
        formula += ` + ${staticModifiers}`;
    }
    
    return formula;
}

/**
 * Formats the outcome message for a completed reroll.
 * 
 * This function creates a user-friendly message that tells the player
 * what happened with their reroll: how many dice were rerolled, how many
 * fortune points were spent, and how many they have remaining.
 * 
 * @param {Object} rollResult - Result data from the reroll
 * @returns {string} Formatted outcome message
 * 
 * @example
 * // Rerolled 2 dice, used 2 points, 1 remaining
 * const result = {
 *   total: 18,
 *   diceCount: 2,
 *   fortunePointsUsed: 2,
 *   remainingPoints: 1
 * };
 * const message = formatOutcomeString(result);
 * // Result: "Rerolled 2 dice with Fortune Points. Remaining: 1"
 */
export function formatOutcomeString(rollResult) {
    const { diceCount, remainingPoints } = rollResult;
    const diceText = diceCount === 1 ? 'die' : 'dice';
    
    return `Rerolled ${diceCount} ${diceText} with Fortune Points. Remaining: ${remainingPoints}`;
} 