/**
 * @fileoverview Unit Tests for Dialog Utility Functions
 * @version 2.1.0
 * @description Tests for pure functions extracted from dialog logic
 * @author Avant Development Team
 */

import { describe, test, expect } from '@jest/globals';

// Import the functions we'll create
import {
    calculateRerollCost,
    validateRerollRequest,
    buildDialogData,
    formatOutcomeString,
    hasAvailableFortunePoints,
    extractD10Results,
    extractStaticModifiers,
    buildRerollFormula,
    getCostMessage
} from '../../../scripts/logic/dialog-utils.js';

describe('Dialog Utility Functions', () => {
    
    describe('hasAvailableFortunePoints', () => {
        test('returns true when actor has fortune points', () => {
            const actor = { system: { fortunePoints: 3 } };
            
            const result = hasAvailableFortunePoints(actor);
            
            expect(result).toBe(true);
        });
        
        test('returns false when actor has no fortune points', () => {
            const actor = { system: { fortunePoints: 0 } };
            
            const result = hasAvailableFortunePoints(actor);
            
            expect(result).toBe(false);
        });
        
        test('returns false when actor has undefined fortune points', () => {
            const actor = { system: {} };
            
            const result = hasAvailableFortunePoints(actor);
            
            expect(result).toBe(false);
        });
        
        test('returns false when actor system is undefined', () => {
            const actor = {};
            
            const result = hasAvailableFortunePoints(actor);
            
            expect(result).toBe(false);
        });
        
        test('returns false when actor is null', () => {
            const result = hasAvailableFortunePoints(null);
            
            expect(result).toBe(false);
        });
    });
    
    describe('calculateRerollCost', () => {
        test('returns available fortune points when sufficient', () => {
            const actor = { system: { fortunePoints: 5 } };
            
            const result = calculateRerollCost(actor);
            
            expect(result).toEqual({
                available: 5,
                canAfford: true,
                maxRerolls: 5
            });
        });
        
        test('returns zero when no fortune points available', () => {
            const actor = { system: { fortunePoints: 0 } };
            
            const result = calculateRerollCost(actor);
            
            expect(result).toEqual({
                available: 0,
                canAfford: false,
                maxRerolls: 0
            });
        });
        
        test('handles missing fortune points gracefully', () => {
            const actor = { system: {} };
            
            const result = calculateRerollCost(actor);
            
            expect(result).toEqual({
                available: 0,
                canAfford: false,
                maxRerolls: 0
            });
        });
        
        test('handles missing system gracefully', () => {
            const actor = {};
            
            const result = calculateRerollCost(actor);
            
            expect(result).toEqual({
                available: 0,
                canAfford: false,
                maxRerolls: 0
            });
        });
    });
    
    describe('extractD10Results', () => {
        test('extracts d10 results from simple roll', () => {
            const mockRoll = {
                terms: [
                    {
                        constructor: { name: 'Die' },
                        faces: 10,
                        results: [
                            { result: 7, active: true, rerolled: false },
                            { result: 3, active: true, rerolled: false }
                        ]
                    }
                ]
            };
            
            const result = extractD10Results(mockRoll);
            
            expect(result).toEqual([
                { value: 7, wasRerolled: false },
                { value: 3, wasRerolled: false }
            ]);
        });
        
        test('excludes inactive dice results', () => {
            const mockRoll = {
                terms: [
                    {
                        constructor: { name: 'Die' },
                        faces: 10,
                        results: [
                            { result: 7, active: true, rerolled: false },
                            { result: 1, active: false, rerolled: true }, // Should be excluded
                            { result: 8, active: true, rerolled: true }
                        ]
                    }
                ]
            };
            
            const result = extractD10Results(mockRoll);
            
            expect(result).toEqual([
                { value: 7, wasRerolled: false },
                { value: 8, wasRerolled: true }
            ]);
        });
        
        test('handles rolls with no d10 terms', () => {
            const mockRoll = {
                terms: [
                    {
                        constructor: { name: 'Die' },
                        faces: 6,
                        results: [{ result: 4, active: true }]
                    }
                ]
            };
            
            const result = extractD10Results(mockRoll);
            
            expect(result).toEqual([]);
        });
        
        test('handles empty roll terms', () => {
            const mockRoll = { terms: [] };
            
            const result = extractD10Results(mockRoll);
            
            expect(result).toEqual([]);
        });
        
        test('handles null roll gracefully', () => {
            const result = extractD10Results(null);
            
            expect(result).toEqual([]);
        });
    });
    
    describe('extractStaticModifiers', () => {
        test('sums numeric terms correctly', () => {
            const mockRoll = {
                terms: [
                    { constructor: { name: 'Die' }, faces: 10 },
                    { constructor: { name: 'OperatorTerm' }, operator: '+' },
                    { constructor: { name: 'NumericTerm' }, number: 5 },
                    { constructor: { name: 'OperatorTerm' }, operator: '+' },
                    { constructor: { name: 'NumericTerm' }, number: 2 }
                ]
            };
            
            const result = extractStaticModifiers(mockRoll);
            
            expect(result).toBe(7);
        });
        
        test('returns zero when no numeric terms', () => {
            const mockRoll = {
                terms: [
                    { constructor: { name: 'Die' }, faces: 10 }
                ]
            };
            
            const result = extractStaticModifiers(mockRoll);
            
            expect(result).toBe(0);
        });
        
        test('handles negative modifiers', () => {
            const mockRoll = {
                terms: [
                    { constructor: { name: 'NumericTerm' }, number: 5 },
                    { constructor: { name: 'NumericTerm' }, number: -2 }
                ]
            };
            
            const result = extractStaticModifiers(mockRoll);
            
            expect(result).toBe(3);
        });
        
        test('handles null roll gracefully', () => {
            const result = extractStaticModifiers(null);
            
            expect(result).toBe(0);
        });
    });
    
    describe('buildDialogData', () => {
        test('builds complete dialog data for valid inputs', () => {
            const mockRoll = { total: 15 };
            const actor = { system: { fortunePoints: 3 } };
            const d10Results = [
                { value: 7, wasRerolled: false },
                { value: 3, wasRerolled: false }
            ];
            const staticModifiers = 5;
            const originalFlavor = 'Athletics Check';
            
            const result = buildDialogData(mockRoll, actor, d10Results, staticModifiers, originalFlavor);
            
            expect(result).toEqual({
                d10Results: [
                    { index: 0, value: 7, selected: false, wasRerolled: false, canReroll: true },
                    { index: 1, value: 3, selected: false, wasRerolled: false, canReroll: true }
                ],
                selectedCount: 0,
                fortunePoints: 3,
                maxRerolls: 2,
                canReroll: false,
                originalTotal: 15,
                originalFlavor: 'Athletics Check'
            });
        });
        
        test('marks rerolled dice as non-rerollable', () => {
            const mockRoll = { total: 15 };
            const actor = { system: { fortunePoints: 3 } };
            const d10Results = [
                { value: 7, wasRerolled: true },
                { value: 3, wasRerolled: false }
            ];
            const staticModifiers = 5;
            const originalFlavor = 'Athletics Check';
            
            const result = buildDialogData(mockRoll, actor, d10Results, staticModifiers, originalFlavor);
            
            expect(result.d10Results[0].canReroll).toBe(false);
            expect(result.d10Results[1].canReroll).toBe(true);
        });
        
        test('limits max rerolls to available fortune points', () => {
            const mockRoll = { total: 20 };
            const actor = { system: { fortunePoints: 1 } };
            const d10Results = [
                { value: 7, wasRerolled: false },
                { value: 3, wasRerolled: false },
                { value: 5, wasRerolled: false }
            ];
            const staticModifiers = 5;
            const originalFlavor = 'Test';
            
            const result = buildDialogData(mockRoll, actor, d10Results, staticModifiers, originalFlavor);
            
            expect(result.maxRerolls).toBe(1); // Limited by fortune points, not dice count
        });
    });
    
    describe('getCostMessage', () => {
        test('returns no points message when fortune points is zero', () => {
            const result = getCostMessage(0, 0);
            
            expect(result).toBe('No Fortune Points available!');
        });
        
        test('returns selection prompt when no dice selected', () => {
            const result = getCostMessage(3, 0);
            
            expect(result).toBe('Select dice to reroll (3 Fortune Points available)');
        });
        
        test('returns selection prompt with singular point', () => {
            const result = getCostMessage(1, 0);
            
            expect(result).toBe('Select dice to reroll (1 Fortune Point available)');
        });
        
        test('returns cost message for single die selected', () => {
            const result = getCostMessage(3, 1);
            
            expect(result).toBe('Reroll for 1 Fortune Point');
        });
        
        test('returns cost message for multiple dice selected', () => {
            const result = getCostMessage(3, 2);
            
            expect(result).toBe('Reroll for 2 Fortune Points');
        });
    });
    
    describe('validateRerollRequest', () => {
        test('validates successful reroll request', () => {
            const message = {
                rolls: [{ total: 15 }]
            };
            const actor = { system: { fortunePoints: 2 } };
            const selectedDice = [0, 1];
            
            const result = validateRerollRequest(message, actor, selectedDice);
            
            expect(result).toEqual({
                isValid: true,
                canProceed: true,
                error: null
            });
        });
        
        test('fails when no dice selected', () => {
            const message = { rolls: [{ total: 15 }] };
            const actor = { system: { fortunePoints: 2 } };
            const selectedDice = [];
            
            const result = validateRerollRequest(message, actor, selectedDice);
            
            expect(result).toEqual({
                isValid: false,
                canProceed: false,
                error: 'Please select at least one die to reroll.'
            });
        });
        
        test('fails when insufficient fortune points', () => {
            const message = { rolls: [{ total: 15 }] };
            const actor = { system: { fortunePoints: 1 } };
            const selectedDice = [0, 1]; // Want to reroll 2 dice but only have 1 point
            
            const result = validateRerollRequest(message, actor, selectedDice);
            
            expect(result).toEqual({
                isValid: false,
                canProceed: false,
                error: 'Not enough Fortune Points!'
            });
        });
        
        test('fails when no rolls in message', () => {
            const message = { rolls: [] };
            const actor = { system: { fortunePoints: 2 } };
            const selectedDice = [0];
            
            const result = validateRerollRequest(message, actor, selectedDice);
            
            expect(result).toEqual({
                isValid: false,
                canProceed: false,
                error: 'No rolls found in message'
            });
        });
    });
    
    describe('buildRerollFormula', () => {
        test('builds formula for rerolled dice with modifiers', () => {
            const d10Results = [
                { value: 8, wasRerolled: true },
                { value: 3, wasRerolled: false }
            ];
            const staticModifiers = 5;
            
            const result = buildRerollFormula(d10Results, staticModifiers);
            
            expect(result).toBe('8 + 3 + 5');
        });
        
        test('builds formula without modifiers', () => {
            const d10Results = [
                { value: 7, wasRerolled: false },
                { value: 4, wasRerolled: true }
            ];
            const staticModifiers = 0;
            
            const result = buildRerollFormula(d10Results, staticModifiers);
            
            expect(result).toBe('7 + 4');
        });
        
        test('handles single die', () => {
            const d10Results = [{ value: 9, wasRerolled: true }];
            const staticModifiers = 2;
            
            const result = buildRerollFormula(d10Results, staticModifiers);
            
            expect(result).toBe('9 + 2');
        });
        
        test('handles empty dice array', () => {
            const d10Results = [];
            const staticModifiers = 3;
            
            const result = buildRerollFormula(d10Results, staticModifiers);
            
            expect(result).toBe('0 + 3');
        });
    });
    
    describe('formatOutcomeString', () => {
        test('formats successful reroll outcome', () => {
            const rollResult = {
                total: 18,
                diceCount: 2,
                fortunePointsUsed: 2,
                remainingPoints: 1
            };
            
            const result = formatOutcomeString(rollResult);
            
            expect(result).toBe('Rerolled 2 dice with Fortune Points. Remaining: 1');
        });
        
        test('formats single die reroll', () => {
            const rollResult = {
                total: 12,
                diceCount: 1,
                fortunePointsUsed: 1,
                remainingPoints: 2
            };
            
            const result = formatOutcomeString(rollResult);
            
            expect(result).toBe('Rerolled 1 die with Fortune Points. Remaining: 2');
        });
        
        test('handles zero remaining points', () => {
            const rollResult = {
                total: 15,
                diceCount: 3,
                fortunePointsUsed: 3,
                remainingPoints: 0
            };
            
            const result = formatOutcomeString(rollResult);
            
            expect(result).toBe('Rerolled 3 dice with Fortune Points. Remaining: 0');
        });
    });
}); 