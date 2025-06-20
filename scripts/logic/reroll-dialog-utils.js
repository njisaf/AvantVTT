/**
 * @fileoverview Pure utility functions for reroll dialog functionality
 * Extracted from AvantRerollDialog class for improved testability and modularity
 */

import { logger } from '../utils/logger.js';

/**
 * Generate cost message based on current Fortune Points and selected dice
 * 
 * This function creates user-friendly messages about Fortune Point costs
 * for rerolling dice. It handles different states: no points available,
 * no dice selected, or showing the actual cost.
 * 
 * @param {number} fortunePoints - Current Fortune Points available
 * @param {number} selectedCount - Number of dice currently selected for reroll
 * @returns {string} Appropriate cost message for the current state
 * 
 * @example
 * // When no Fortune Points available
 * const message = getCostMessage(0, 0);
 * // Result: "No Fortune Points available!"
 * 
 * @example
 * // When points available but no dice selected
 * const message = getCostMessage(3, 0);
 * // Result: "Select dice to reroll (3 Fortune Points available)"
 * 
 * @example
 * // When dice are selected
 * const message = getCostMessage(5, 2);
 * // Result: "Reroll for 2 Fortune Points"
 */
export function getCostMessage(fortunePoints, selectedCount) {
    if (fortunePoints === 0) {
        return "No Fortune Points available!";
    }
    
    if (selectedCount === 0) {
        return `Select dice to reroll (${fortunePoints} Fortune Point${fortunePoints > 1 ? 's' : ''} available)`;
    }
    
    return `Reroll for ${selectedCount} Fortune Point${selectedCount > 1 ? 's' : ''}`;
}

/**
 * Validate that a reroll operation can proceed
 * 
 * Checks if the selected dice count doesn't exceed available Fortune Points
 * and that at least one die is selected.
 * 
 * @param {number} fortunePoints - Available Fortune Points
 * @param {number} selectedCount - Number of dice selected for reroll
 * @returns {Object} Validation result with isValid flag and error message if invalid
 * 
 * @example
 * const result = validateRerollOperation(3, 2);
 * // Result: { isValid: true, error: null }
 * 
 * @example
 * const result = validateRerollOperation(1, 3);
 * // Result: { isValid: false, error: "Not enough Fortune Points..." }
 */
export function validateRerollOperation(fortunePoints, selectedCount) {
    if (selectedCount === 0) {
        return {
            isValid: false,
            error: "No dice selected for reroll"
        };
    }
    
    if (selectedCount > fortunePoints) {
        return {
            isValid: false,
            error: `Not enough Fortune Points. Need ${selectedCount}, have ${fortunePoints}`
        };
    }
    
    return {
        isValid: true,
        error: null
    };
}

/**
 * Calculate remaining Fortune Points after a reroll operation
 * 
 * Simple calculation that ensures the result never goes below zero.
 * 
 * @param {number} currentPoints - Current Fortune Points
 * @param {number} pointsToSpend - Points to spend on reroll
 * @returns {number} Remaining Fortune Points (minimum 0)
 * 
 * @example
 * const remaining = calculateRemainingPoints(5, 2);
 * // Result: 3
 * 
 * @example
 * const remaining = calculateRemainingPoints(1, 3);
 * // Result: 0 (can't go negative)
 */
export function calculateRemainingPoints(currentPoints, pointsToSpend) {
    return Math.max(0, currentPoints - pointsToSpend);
}

/**
 * Format outcome message after a successful reroll
 * 
 * Creates a summary message showing what happened in the reroll operation.
 * 
 * @param {Object} outcome - Outcome data
 * @param {number} outcome.diceCount - Number of dice rerolled
 * @param {number} outcome.fortunePointsUsed - Fortune Points spent
 * @param {number} outcome.remainingPoints - Fortune Points remaining
 * @returns {string} Formatted outcome message
 * 
 * @example
 * const message = formatRerollOutcome({
 *   diceCount: 2,
 *   fortunePointsUsed: 2,
 *   remainingPoints: 3
 * });
 * // Result: "Rerolled 2 dice using 2 Fortune Points. 3 remaining."
 */
export function formatRerollOutcome(outcome) {
    const { diceCount, fortunePointsUsed, remainingPoints } = outcome;
    
    const diceText = diceCount === 1 ? 'die' : 'dice';
    const pointsText = fortunePointsUsed === 1 ? 'Point' : 'Points';
    
    return `Rerolled ${diceCount} ${diceText} using ${fortunePointsUsed} Fortune ${pointsText}. ${remainingPoints} remaining.`;
}

/**
 * Check if a die can be selected for reroll
 * 
 * Validates that a die hasn't already been rerolled and that there are enough
 * Fortune Points available to select it.
 * 
 * @param {Object} dieData - Die information
 * @param {boolean} dieData.wasRerolled - Whether this die was already rerolled
 * @param {number} currentSelectionCount - Number of dice already selected
 * @param {number} availablePoints - Available Fortune Points
 * @returns {Object} Selection result with canSelect flag and reason if not
 * 
 * @example
 * const result = canSelectDie({ wasRerolled: false }, 1, 3);
 * // Result: { canSelect: true, reason: null }
 * 
 * @example
 * const result = canSelectDie({ wasRerolled: true }, 0, 3);
 * // Result: { canSelect: false, reason: "This die has already been rerolled" }
 */
export function canSelectDie(dieData, currentSelectionCount, availablePoints) {
    if (dieData.wasRerolled) {
        return {
            canSelect: false,
            reason: "This die has already been rerolled and cannot be rerolled again!"
        };
    }
    
    if (currentSelectionCount >= availablePoints) {
        return {
            canSelect: false,
            reason: "Not enough Fortune Points to select more dice!"
        };
    }
    
    return {
        canSelect: true,
        reason: null
    };
} 