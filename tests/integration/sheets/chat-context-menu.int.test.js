/**
 * @fileoverview Chat Context Menu Integration Tests
 * @version 1.0.0
 * @author Avant VTT Team
 * @description Integration tests for chat context menu functionality with FoundryVTT
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AvantChatContextMenu } from '../../../scripts/chat/context-menu.js';
import { CompatibilityUtils } from '../../../scripts/utils/compatibility.js';

// Mock FoundryVTT environment for chat context menu testing
describe('AvantChatContextMenu Integration Tests', () => {
    let mockUi, mockGame, mockHooks, originalConsole, mockAvantRerollDialog;
    
    beforeEach(() => {
        // Save original console
        originalConsole = global.console;
        
        // Create and setup AvantRerollDialog mock
        mockAvantRerollDialog = jest.fn();
        
        // Mock the AvantRerollDialog import directly by replacing the module cache
        jest.doMock('../../../scripts/dialogs/reroll-dialog.js', () => ({
            AvantRerollDialog: mockAvantRerollDialog
        }), { virtual: true });
        
        // Mock comprehensive FoundryVTT environment
        mockGame = {
            version: '13.0.0',
            messages: {
                get: jest.fn((id) => {
                    if (id === 'valid-message') {
                        return {
                            id: 'valid-message',
                            speaker: { actor: 'test-actor' },
                            rolls: [{
                                terms: [
                                    Object.assign(Object.create(global.foundry.dice.terms.Die.prototype), {
                                        faces: 10,
                                        number: 2,
                                        results: [
                                            { result: 7, active: true, rerolled: false },
                                            { result: 3, active: true, rerolled: false }
                                        ]
                                    })
                                ]
                            }],
                            flavor: 'Test Roll'
                        };
                    }
                    return null;
                }),
                collection: new Map()
            },
            actors: {
                get: jest.fn((id) => {
                    if (id === 'test-actor') {
                        return {
                            id: 'test-actor',
                            name: 'Test Character',
                            system: {
                                fortunePoints: { current: 5 }
                            }
                        };
                    }
                    return null;
                })
            }
        };
        
        mockUi = {
            chat: {
                _getEntryContextOptions: jest.fn(() => [
                    { name: 'Edit Message' },
                    { name: 'Delete Message' }
                ]),
                _avantExtended: false
            }
        };
        
        mockHooks = {
            once: jest.fn((event, callback) => {
                // Simulate immediate execution for testing
                if (event === 'ready' || event === 'renderChatLog') {
                    setTimeout(callback, 0);
                }
            }),
            on: jest.fn()
        };
        
        // Set up global environment
        global.game = mockGame;
        global.ui = mockUi;
        global.Hooks = mockHooks;
        global.ChatMessage = class MockChatMessage {
            constructor(data) {
                Object.assign(this, data);
            }
        };
        
        // Mock foundry dice terms for testing
        global.foundry = {
            dice: {
                terms: {
                    Die: class MockDie {
                        constructor(faces, number) {
                            this.faces = faces;
                            this.number = number;
                        }
                    },
                    NumericTerm: class MockNumericTerm {
                        constructor(number) {
                            this.number = number;
                        }
                    },
                    OperatorTerm: class MockOperatorTerm {
                        constructor(operator) {
                            this.operator = operator;
                        }
                    }
                }
            }
        };
        
        // Mock CompatibilityUtils
        jest.spyOn(CompatibilityUtils, 'getChatContextMenuApproach').mockReturnValue('v13');
    });
    
    afterEach(() => {
        jest.clearAllMocks();
        global.console = originalConsole;
    });
    
    describe('Context Menu Initialization', () => {
        test('should initialize context menu listeners without errors', () => {
            expect(() => {
                AvantChatContextMenu.addContextMenuListeners();
            }).not.toThrow();
        });
        
        test('should extend ChatLog context menu for v13', async () => {
            AvantChatContextMenu.addContextMenuListeners();
            
            // Wait for async initialization
            await new Promise(resolve => setTimeout(resolve, 50));
            
            expect(mockUi.chat._avantExtended).toBe(true);
            expect(typeof mockUi.chat._getEntryContextOptions).toBe('function');
        });
        
        test('should register hooks for v12 approach', () => {
            jest.spyOn(CompatibilityUtils, 'getChatContextMenuApproach').mockReturnValue('v12');
            
            AvantChatContextMenu.addContextMenuListeners();
            
            expect(mockHooks.on).toHaveBeenCalledWith('getChatLogEntryContext', expect.any(Function));
            expect(mockHooks.on).toHaveBeenCalledWith('getDocumentContextOptions', expect.any(Function));
        });
    });
    
    describe('Menu Option Creation', () => {
        beforeEach(() => {
            AvantChatContextMenu.addContextMenuListeners();
        });
        
        test('should create reroll menu option with correct structure', () => {
            const options = mockUi.chat._getEntryContextOptions();
            
            expect(options).toHaveLength(3); // Original 2 + our 1
            
            const rerollOption = options.find(opt => opt.name === "Reroll with Fortune Points");
            expect(rerollOption).toBeDefined();
            expect(rerollOption.icon).toBe('<i class="fas fa-dice"></i>');
            expect(typeof rerollOption.condition).toBe('function');
            expect(typeof rerollOption.callback).toBe('function');
        });
        
        test('should show reroll option for valid messages', () => {
            const options = mockUi.chat._getEntryContextOptions();
            const rerollOption = options.find(opt => opt.name === "Reroll with Fortune Points");
            
            const mockElement = {
                dataset: { messageId: 'valid-message' }
            };
            
            const shouldShow = rerollOption.condition(mockElement);
            expect(shouldShow).toBe(true);
        });
        
        test('should hide reroll option for invalid messages', () => {
            const options = mockUi.chat._getEntryContextOptions();
            const rerollOption = options.find(opt => opt.name === "Reroll with Fortune Points");
            
            const mockElement = {
                dataset: { messageId: 'invalid-message' }
            };
            
            const shouldShow = rerollOption.condition(mockElement);
            expect(shouldShow).toBe(false);
        });
    });
    
    describe('Message Validation', () => {
        beforeEach(() => {
            AvantChatContextMenu.addContextMenuListeners();
        });
        
        test('should validate message with rolls and actor', () => {
            const options = mockUi.chat._getEntryContextOptions();
            const rerollOption = options.find(opt => opt.name === "Reroll with Fortune Points");
            
            const mockElement = {
                dataset: { messageId: 'valid-message' }
            };
            
            expect(rerollOption.condition(mockElement)).toBe(true);
        });
        
        test('should reject message without rolls', () => {
            mockGame.messages.get.mockReturnValue({
                id: 'no-rolls',
                speaker: { actor: 'test-actor' },
                rolls: []
            });
            
            const options = mockUi.chat._getEntryContextOptions();
            const rerollOption = options.find(opt => opt.name === "Reroll with Fortune Points");
            
            const mockElement = {
                dataset: { messageId: 'no-rolls' }
            };
            
            expect(rerollOption.condition(mockElement)).toBe(false);
        });
        
        test('should reject message without actor', () => {
            mockGame.messages.get.mockReturnValue({
                id: 'no-actor',
                speaker: {},
                rolls: [{ terms: [] }]
            });
            
            const options = mockUi.chat._getEntryContextOptions();
            const rerollOption = options.find(opt => opt.name === "Reroll with Fortune Points");
            
            const mockElement = {
                dataset: { messageId: 'no-actor' }
            };
            
            expect(rerollOption.condition(mockElement)).toBe(false);
        });
    });
    
    describe('DOM Element Compatibility', () => {
        beforeEach(() => {
            AvantChatContextMenu.addContextMenuListeners();
        });
        
        test('should extract message ID from dataset', () => {
            const options = mockUi.chat._getEntryContextOptions();
            const rerollOption = options.find(opt => opt.name === "Reroll with Fortune Points");
            
            const mockElement = {
                dataset: { messageId: 'valid-message' }
            };
            
            expect(rerollOption.condition(mockElement)).toBe(true);
        });
        
        test('should extract message ID from getAttribute fallback', () => {
            const options = mockUi.chat._getEntryContextOptions();
            const rerollOption = options.find(opt => opt.name === "Reroll with Fortune Points");
            
            const mockElement = {
                getAttribute: jest.fn().mockReturnValue('valid-message')
            };
            
            expect(rerollOption.condition(mockElement)).toBe(true);
            expect(mockElement.getAttribute).toHaveBeenCalledWith('data-message-id');
        });
        
        test('should extract message ID from jQuery data method (v12)', () => {
            const options = mockUi.chat._getEntryContextOptions();
            const rerollOption = options.find(opt => opt.name === "Reroll with Fortune Points");
            
            const mockElement = {
                data: jest.fn().mockReturnValue('valid-message')
            };
            
            expect(rerollOption.condition(mockElement)).toBe(true);
            expect(mockElement.data).toHaveBeenCalledWith('messageId');
        });
    });
    
    describe('Callback Execution', () => {
        let mockDialog;
        
        beforeEach(() => {
            mockDialog = {
                render: jest.fn()
            };
            
            // Setup the mocked AvantRerollDialog
            mockAvantRerollDialog.mockImplementation(() => mockDialog);
            
            AvantChatContextMenu.addContextMenuListeners();
        });
        
        test('should execute callback without errors for valid message', () => {
            const options = mockUi.chat._getEntryContextOptions();
            const rerollOption = options.find(opt => opt.name === "Reroll with Fortune Points");
            
            const mockElement = {
                dataset: { messageId: 'valid-message' }
            };
            
            expect(() => {
                rerollOption.callback(mockElement);
            }).not.toThrow();
        });
        
        test('should open reroll dialog when callback executed', () => {
            const options = mockUi.chat._getEntryContextOptions();
            const rerollOption = options.find(opt => opt.name === "Reroll with Fortune Points");
            
            const mockElement = {
                dataset: { messageId: 'valid-message' }
            };
            
            // Setup mock dialog to return from constructor
            const mockDialogInstance = {
                render: jest.fn()
            };
            mockAvantRerollDialog.mockReturnValue(mockDialogInstance);
            
            rerollOption.callback(mockElement);
            
            expect(mockAvantRerollDialog).toHaveBeenCalledWith(
                expect.objectContaining({ terms: expect.any(Array) }),
                expect.objectContaining({ id: 'test-actor' }),
                'Test Roll'
            );
            expect(mockDialogInstance.render).toHaveBeenCalledWith(true);
        });
        
        test('should handle invalid message gracefully in callback', () => {
            const options = mockUi.chat._getEntryContextOptions();
            const rerollOption = options.find(opt => opt.name === "Reroll with Fortune Points");
            
            const mockElement = {
                dataset: { messageId: 'invalid-message' }
            };
            
            expect(() => {
                rerollOption.callback(mockElement);
            }).not.toThrow();
            
            expect(mockAvantRerollDialog).not.toHaveBeenCalled();
        });
    });
    
    describe('Version Compatibility', () => {
        test('should work with v12 approach', () => {
            jest.spyOn(CompatibilityUtils, 'getChatContextMenuApproach').mockReturnValue('v12');
            
            expect(() => {
                AvantChatContextMenu.addContextMenuListeners();
            }).not.toThrow();
            
            expect(mockHooks.on).toHaveBeenCalledWith('getChatLogEntryContext', expect.any(Function));
        });
        
        test('should work with v13 approach', () => {
            jest.spyOn(CompatibilityUtils, 'getChatContextMenuApproach').mockReturnValue('v13');
            
            expect(() => {
                AvantChatContextMenu.addContextMenuListeners();
            }).not.toThrow();
            
            expect(mockHooks.once).toHaveBeenCalledWith('ready', expect.any(Function));
        });
    });
    
    describe('Error Resilience', () => {
        test('should handle missing ui.chat gracefully', () => {
            global.ui = {};
            
            expect(() => {
                AvantChatContextMenu.addContextMenuListeners();
            }).not.toThrow();
        });
        
        test('should handle missing game.messages gracefully', () => {
            global.game = { messages: undefined };
            
            AvantChatContextMenu.addContextMenuListeners();
            
            const options = mockUi.chat._getEntryContextOptions();
            const rerollOption = options.find(opt => opt.name === "Reroll with Fortune Points");
            
            const mockElement = {
                dataset: { messageId: 'any-message' }
            };
            
            expect(() => {
                rerollOption.condition(mockElement);
            }).not.toThrow();
        });
        
        test('should handle corrupted message data gracefully', () => {
            // Temporarily replace the messages.get mock to throw an error
            const originalGet = mockGame.messages.get;
            mockGame.messages.get = jest.fn(() => {
                throw new Error('Data corruption');
            });
            
            AvantChatContextMenu.addContextMenuListeners();
            
            const options = mockUi.chat._getEntryContextOptions();
            const rerollOption = options.find(opt => opt.name === "Reroll with Fortune Points");
            
            const mockElement = {
                dataset: { messageId: 'corrupted-message' }
            };
            
            expect(() => {
                rerollOption.condition(mockElement);
            }).not.toThrow();
            
            // Restore original mock
            mockGame.messages.get = originalGet;
        });
    });
    
    describe('Deprecated Methods', () => {
        test('should maintain backward compatibility with deprecated methods', () => {
            const mockMessage = {
                speaker: { actor: 'test-actor' }
            };
            
            const result = AvantChatContextMenu._getActorFromMessage(mockMessage);
            expect(result).toEqual(expect.objectContaining({ id: 'test-actor' }));
        });
        
        test('should maintain backward compatibility with deprecated roll check', () => {
            const mockRoll = {
                terms: [
                    Object.assign(Object.create(global.foundry.dice.terms.Die.prototype), {
                        faces: 10,
                        number: 2
                    })
                ]
            };
            
            const result = AvantChatContextMenu._isEligibleRoll(mockRoll);
            expect(result).toBe(true);
        });
    });
}); 