/**
 * @fileoverview Chat Context Utils - Pure Function Tests
 * @version 1.0.0
 * @author Avant VTT Team
 * @description Tests for pure business logic functions extracted from chat context menu
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
    getActorFromMessage,
    isEligibleRoll, 
    extractMessageId,
    buildRerollMenuEntry,
    validateMessageForReroll,
    createRerollCallback,
    hasRerollPermission
} from '../../../scripts/logic/chat-context-utils.js';

describe('Chat Context Utils - Pure Functions', () => {
    
    describe('getActorFromMessage', () => {
        test('returns actor when message has valid speaker with actor ID', () => {
            const mockMessage = {
                speaker: {
                    actor: 'actor-123'
                }
            };
            
            // Mock game.actors.get
            global.game = {
                actors: {
                    get: (id) => id === 'actor-123' ? { 
                        id: 'actor-123', 
                        name: 'Test Character',
                        system: { fortunePoints: { current: 5 } }
                    } : null
                }
            };
            
            const result = getActorFromMessage(mockMessage);
            
            expect(result).not.toBeNull();
            expect(result.id).toBe('actor-123');
            expect(result.name).toBe('Test Character');
        });

        test('returns null when message has no speaker', () => {
            const mockMessage = {};
            
            const result = getActorFromMessage(mockMessage);
            
            expect(result).toBeNull();
        });

        test('returns null when speaker has no actor ID', () => {
            const mockMessage = {
                speaker: {}
            };
            
            const result = getActorFromMessage(mockMessage);
            
            expect(result).toBeNull();
        });

        test('returns null when actor not found in game collection', () => {
            const mockMessage = {
                speaker: {
                    actor: 'nonexistent-actor'
                }
            };
            
            global.game = {
                actors: {
                    get: () => null
                }
            };
            
            const result = getActorFromMessage(mockMessage);
            
            expect(result).toBeNull();
        });

        test('handles missing game object gracefully', () => {
            const mockMessage = {
                speaker: {
                    actor: 'actor-123'
                }
            };
            
            global.game = undefined;
            
            const result = getActorFromMessage(mockMessage);
            
            expect(result).toBeNull();
        });
    });

    describe('isEligibleRoll', () => {
        test('returns true for valid 2d10 roll', () => {
            const mockRoll = {
                terms: [
                    {
                        constructor: { name: 'Die' },
                        faces: 10,
                        number: 2
                    }
                ]
            };
            
            // Mock foundry dice terms
            global.foundry = {
                dice: {
                    terms: {
                        Die: class MockDie {
                            constructor(faces, number) {
                                this.faces = faces;
                                this.number = number;
                            }
                        }
                    }
                }
            };
            
            // Make mock roll instance of Die
            mockRoll.terms[0] = Object.create(global.foundry.dice.terms.Die.prototype);
            Object.assign(mockRoll.terms[0], {
                faces: 10,
                number: 2
            });
            
            const result = isEligibleRoll(mockRoll);
            
            expect(result).toBe(true);
        });

        test('returns false for roll with wrong number of d10s', () => {
            const mockRoll = {
                terms: [
                    {
                        constructor: { name: 'Die' },
                        faces: 10,
                        number: 1 // Only 1d10
                    }
                ]
            };
            
            global.foundry = {
                dice: {
                    terms: {
                        Die: class MockDie {}
                    }
                }
            };
            
            mockRoll.terms[0] = Object.create(global.foundry.dice.terms.Die.prototype);
            Object.assign(mockRoll.terms[0], {
                faces: 10,
                number: 1
            });
            
            const result = isEligibleRoll(mockRoll);
            
            expect(result).toBe(false);
        });

        test('returns false for non-d10 dice', () => {
            const mockRoll = {
                terms: [
                    {
                        constructor: { name: 'Die' },
                        faces: 20,
                        number: 2
                    }
                ]
            };
            
            global.foundry = {
                dice: {
                    terms: {
                        Die: class MockDie {}
                    }
                }
            };
            
            mockRoll.terms[0] = Object.create(global.foundry.dice.terms.Die.prototype);
            Object.assign(mockRoll.terms[0], {
                faces: 20,
                number: 2
            });
            
            const result = isEligibleRoll(mockRoll);
            
            expect(result).toBe(false);
        });

        test('returns false for empty roll', () => {
            const result = isEligibleRoll(null);
            
            expect(result).toBe(false);
        });

        test('returns false for roll without terms', () => {
            const mockRoll = {};
            
            const result = isEligibleRoll(mockRoll);
            
            expect(result).toBe(false);
        });

        test('handles multiple terms correctly (compound rolls)', () => {
            const mockRoll = {
                terms: [
                    {
                        constructor: { name: 'Die' },
                        faces: 10,
                        number: 1
                    },
                    {
                        constructor: { name: 'OperatorTerm' },
                        operator: '+'
                    },
                    {
                        constructor: { name: 'Die' },
                        faces: 10,
                        number: 1
                    }
                ]
            };
            
            global.foundry = {
                dice: {
                    terms: {
                        Die: class MockDie {}
                    }
                }
            };
            
            // Mock both die terms
            mockRoll.terms[0] = Object.create(global.foundry.dice.terms.Die.prototype);
            Object.assign(mockRoll.terms[0], { faces: 10, number: 1 });
            
            mockRoll.terms[2] = Object.create(global.foundry.dice.terms.Die.prototype);
            Object.assign(mockRoll.terms[2], { faces: 10, number: 1 });
            
            const result = isEligibleRoll(mockRoll);
            
            expect(result).toBe(true); // 1d10 + 1d10 = 2d10 total
        });
    });

    describe('extractMessageId', () => {
        test('extracts message ID from data attribute', () => {
            const mockElement = {
                dataset: {
                    messageId: 'msg-123'
                }
            };
            
            const result = extractMessageId(mockElement);
            
            expect(result).toBe('msg-123');
        });

        test('extracts message ID from getAttribute fallback', () => {
            const mockElement = {
                getAttribute: (attr) => attr === 'data-message-id' ? 'msg-456' : null
            };
            
            const result = extractMessageId(mockElement);
            
            expect(result).toBe('msg-456');
        });

        test('handles jQuery-style data method (v12 compatibility)', () => {
            const mockElement = {
                data: (key) => key === 'messageId' ? 'msg-789' : null
            };
            
            const result = extractMessageId(mockElement);
            
            expect(result).toBe('msg-789');
        });

        test('handles jQuery attr method fallback', () => {
            const mockElement = {
                data: () => null,
                attr: (attr) => attr === 'data-message-id' ? 'msg-abc' : null
            };
            
            const result = extractMessageId(mockElement);
            
            expect(result).toBe('msg-abc');
        });

        test('returns null when no message ID found', () => {
            const mockElement = {};
            
            const result = extractMessageId(mockElement);
            
            expect(result).toBeNull();
        });

        test('prioritizes dataset over getAttribute', () => {
            const mockElement = {
                dataset: {
                    messageId: 'dataset-id'
                },
                getAttribute: () => 'getAttribute-id'
            };
            
            const result = extractMessageId(mockElement);
            
            expect(result).toBe('dataset-id');
        });
    });

    describe('buildRerollMenuEntry', () => {
        test('builds complete menu entry with all properties', () => {
            const messageData = {
                messageId: 'msg-123',
                roll: { formula: '2d10' },
                actor: { name: 'Test Character' },
                flavor: 'Skill Check'
            };
            
            const result = buildRerollMenuEntry(messageData);
            
            expect(result).toEqual({
                name: "Reroll with Fortune Points",
                icon: '<i class="fas fa-dice"></i>',
                condition: expect.any(Function),
                callback: expect.any(Function)
            });
        });

        test('condition function returns true for valid data', () => {
            const messageData = {
                messageId: 'msg-123',
                roll: { formula: '2d10' },
                actor: { name: 'Test Character' },
                flavor: 'Skill Check'
            };
            
            const result = buildRerollMenuEntry(messageData);
            
            expect(result.condition()).toBe(true);
        });

        test('condition function returns false for missing actor', () => {
            const messageData = {
                messageId: 'msg-123',
                roll: { formula: '2d10' },
                actor: null,
                flavor: 'Skill Check'
            };
            
            const result = buildRerollMenuEntry(messageData);
            
            expect(result.condition()).toBe(false);
        });

        test('callback function returns proper action data', () => {
            const messageData = {
                messageId: 'msg-123',
                roll: { formula: '2d10' },
                actor: { name: 'Test Character' },
                flavor: 'Skill Check'
            };
            
            const result = buildRerollMenuEntry(messageData);
            const callbackResult = result.callback();
            
            expect(callbackResult).toEqual({
                action: 'openRerollDialog',
                roll: messageData.roll,
                actor: messageData.actor,
                flavor: messageData.flavor
            });
        });
    });

    describe('validateMessageForReroll', () => {
        beforeEach(() => {
            global.game = {
                actors: {
                    get: (id) => id === 'valid-actor' ? { 
                        id: 'valid-actor',
                        name: 'Test Character',
                        system: { fortunePoints: { current: 3 } }
                    } : null
                }
            };
            
            global.foundry = {
                dice: {
                    terms: {
                        Die: class MockDie {}
                    }
                }
            };
        });

        test('returns validation result for fully valid message', () => {
            const mockMessage = {
                id: 'msg-123',
                speaker: {
                    actor: 'valid-actor'
                },
                rolls: [
                    {
                        terms: [
                            Object.assign(Object.create(global.foundry.dice.terms.Die.prototype), {
                                faces: 10,
                                number: 2
                            })
                        ]
                    }
                ],
                flavor: 'Test Roll'
            };
            
            const result = validateMessageForReroll(mockMessage);
            
            expect(result).toEqual({
                isValid: true,
                messageId: 'msg-123',
                actor: expect.objectContaining({ id: 'valid-actor' }),
                roll: expect.objectContaining({ terms: expect.any(Array) }),
                flavor: 'Test Roll',
                reason: null
            });
        });

        test('returns invalid result when message has no rolls', () => {
            const mockMessage = {
                id: 'msg-123',
                speaker: { actor: 'valid-actor' },
                rolls: []
            };
            
            const result = validateMessageForReroll(mockMessage);
            
            expect(result).toEqual({
                isValid: false,
                messageId: 'msg-123',
                actor: null,
                roll: null,
                flavor: null,
                reason: 'No rolls found in message'
            });
        });

        test('returns invalid result when actor not found', () => {
            const mockMessage = {
                id: 'msg-123',
                speaker: { actor: 'invalid-actor' },
                rolls: [{ terms: [] }]
            };
            
            const result = validateMessageForReroll(mockMessage);
            
            expect(result).toEqual({
                isValid: false,
                messageId: 'msg-123',
                actor: null,
                roll: null,
                flavor: null,
                reason: 'Actor not found'
            });
        });

        test('returns invalid result when roll not eligible', () => {
            const mockMessage = {
                id: 'msg-123',
                speaker: { actor: 'valid-actor' },
                rolls: [
                    {
                        terms: [
                            Object.assign(Object.create(global.foundry.dice.terms.Die.prototype), {
                                faces: 20,
                                number: 1
                            })
                        ]
                    }
                ]
            };
            
            const result = validateMessageForReroll(mockMessage);
            
            expect(result).toEqual({
                isValid: false,
                messageId: 'msg-123',
                actor: expect.objectContaining({ id: 'valid-actor' }),
                roll: expect.objectContaining({ terms: expect.any(Array) }),
                flavor: null,
                reason: 'Roll not eligible for reroll'
            });
        });
    });

    describe('createRerollCallback', () => {
        test('creates callback function that returns dialog action', () => {
            const messageData = {
                roll: { formula: '2d10' },
                actor: { name: 'Test' },
                flavor: 'Test Roll'
            };
            
            const callback = createRerollCallback(messageData);
            const result = callback();
            
            expect(result).toEqual({
                action: 'openRerollDialog',
                roll: messageData.roll,
                actor: messageData.actor,
                flavor: messageData.flavor
            });
        });

        test('handles missing flavor gracefully', () => {
            const messageData = {
                roll: { formula: '2d10' },
                actor: { name: 'Test' }
            };
            
            const callback = createRerollCallback(messageData);
            const result = callback();
            
            expect(result.flavor).toBeUndefined();
        });
    });

    describe('hasRerollPermission', () => {
        test('returns true for actor with fortune points', () => {
            const actor = {
                system: {
                    fortunePoints: {
                        current: 3
                    }
                }
            };
            
            const result = hasRerollPermission(actor);
            
            expect(result).toBe(true);
        });

        test('returns false for actor without fortune points', () => {
            const actor = {
                system: {
                    fortunePoints: {
                        current: 0
                    }
                }
            };
            
            const result = hasRerollPermission(actor);
            
            expect(result).toBe(false);
        });

        test('returns false for actor with missing fortune points data', () => {
            const actor = {
                system: {}
            };
            
            const result = hasRerollPermission(actor);
            
            expect(result).toBe(false);
        });

        test('returns false for null actor', () => {
            const result = hasRerollPermission(null);
            
            expect(result).toBe(false);
        });
    });
}); 