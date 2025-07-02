/**
 * @fileoverview Integration Tests for Power Point Handlers (Phase 5 Bug Fixes)
 * @version 1.0.0 - Phase 5: Stabilisation  
 * @description Tests to verify power point button functionality in chat messages
 * @author Avant VTT Team
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { initializeChatIntegration, cleanupChatIntegration } from '../../../scripts/logic/chat/chat-integration.js';
import { initializePowerPointHandlers } from '../../../scripts/logic/chat/power-point-handler.js';

// Mock jQuery and FoundryVTT globals
(globalThis as any).$ = jest.fn((selectorOrHtml) => {
    const findMock = jest.fn();
    const mockElement = {
        find: findMock,
        each: jest.fn().mockReturnThis(),
        data: jest.fn(),
        prop: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        attr: jest.fn().mockReturnThis(),
        length: 1,
        jquery: true
    };

    if (typeof selectorOrHtml === 'string' && selectorOrHtml.includes('<')) {
        // If the HTML contains the target class, make find return a valid element
        if (selectorOrHtml.includes('avant-feature-card')) {
            findMock.mockReturnValue({ length: 1, text: () => 'Test Card' });
        } else {
            findMock.mockReturnThis();
        }
    } else {
        findMock.mockReturnThis();
    }

    return mockElement;
}) as any;

describe('Power Point Handlers Integration (Bug #2 Fix)', () => {
    let mockGame: any;
    let mockActor: any;
    let mockItem: any;
    let mockUser: any;
    let cleanupFunctions: Array<() => void> = [];

    beforeEach(() => {
        // Mock actor
        mockActor = {
            id: 'test-actor-id',
            name: 'Test Character',
            system: {
                powerPoints: {
                    value: 10,
                    max: 15
                }
            },
            ownership: {
                'test-user-id': 3 // OWNER level
            },
            update: jest.fn(() => Promise.resolve(true))
        };

        // Mock item
        mockItem = {
            id: 'test-item-id',
            name: 'Test Talent',
            type: 'talent',
            system: {
                description: 'A test talent',
                powerPointCost: 3,
                tier: 2
            }
        };

        // Mock user
        mockUser = {
            id: 'test-user-id',
            isGM: false
        };

        // Mock game object
        mockGame = {
            avant: {},
            actors: {
                get: jest.fn((id) => id === 'test-actor-id' ? mockActor : null),
                [Symbol.iterator]: function* () {
                    yield mockActor;
                }
            },
            user: mockUser
        };

        // Mock UI notifications
        (globalThis as any).ui = {
            notifications: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn()
            }
        };

        // Mock Hooks
        (globalThis as any).Hooks = {
            on: jest.fn(),
            off: jest.fn()
        };

        // Mock trait provider service
        const mockTraitProvider = {
            getAll: jest.fn(() => Promise.resolve({ success: true, data: [] }))
        };
        
        mockGame.avant.initializationManager = {
            getService: jest.fn((serviceName) => 
                serviceName === 'traitProvider' ? mockTraitProvider : null
            )
        };

        // Mock document event listeners
        jest.spyOn(document, 'addEventListener').mockImplementation(() => {});
        jest.spyOn(document, 'removeEventListener').mockImplementation(() => {});

        jest.clearAllMocks();
    });

    afterEach(() => {
        // Clean up any registered handlers
        cleanupFunctions.forEach(cleanup => {
            try { cleanup(); } catch (e) { /* ignore */ }
        });
        cleanupFunctions = [];
        
        // Clean up chat integration
        try {
            cleanupChatIntegration(mockGame);
        } catch (e) { /* ignore */ }
    });

    describe('Chat Integration Initialization', () => {
        test('should initialize chat integration with power point handlers', () => {
            const result = initializeChatIntegration(mockGame);
            
            expect(result.success).toBe(true);
            expect(mockGame.avant.chat).toBeDefined();
            expect(mockGame.avant.chat._ppCleanup).toBeDefined();
            expect(typeof mockGame.avant.chat._ppCleanup).toBe('function');
        });

        test('should register renderChatMessageHTML hook for dynamic chat messages', () => {
            const result = initializeChatIntegration(mockGame);
            
            expect(result.success).toBe(true);
            expect((globalThis as any).Hooks.on).toHaveBeenCalledWith('renderChatMessageHTML', expect.any(Function));
            expect(typeof mockGame.avant.chat._renderChatMessageHook).toBe('function');
        });
    });

    describe('Power Point Handler Registration', () => {
        test('should register document click event listener for PP buttons', () => {
            const cleanup = initializePowerPointHandlers();
            cleanupFunctions.push(cleanup);
            
            expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        });

        test('should return cleanup function that removes event listener', () => {
            const cleanup = initializePowerPointHandlers();
            
            expect(typeof cleanup).toBe('function');
            
            cleanup();
            
            expect(document.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        });
    });

    describe('Chat Message Rendering Hook', () => {
        test('should process feature cards when renderChatMessage hook fires', () => {
            // Initialize chat integration
            const result = initializeChatIntegration(mockGame);
            expect(result.success).toBe(true);
            
            // Get the registered hook function
            const hookCall = ((globalThis as any).Hooks.on as jest.Mock).mock.calls.find((call: any) => call[0] === 'renderChatMessageHTML');
            expect(hookCall).toBeDefined();
            
            const renderChatMessageHandler = hookCall![1] as any;
            
            // Mock a chat message with feature card
            const mockMessage = { id: 'test-message' };
            const mockHtml = $(`
                <div class="chat-message">
                    <div class="avant-feature-card">Test Card</div>
                </div>
            `);
            
            // Execute the hook handler
            expect(() => renderChatMessageHandler(mockMessage, mockHtml)).not.toThrow();
            
            // Verify the hook processed the message
            expect(mockHtml.find).toHaveBeenCalledWith('.avant-feature-card');
        });

        test('should handle errors in renderChatMessage hook gracefully', () => {
            // Initialize chat integration
            const result = initializeChatIntegration(mockGame);
            expect(result.success).toBe(true);
            
            // Get the registered hook function
            const hookCall = ((globalThis as any).Hooks.on as jest.Mock).mock.calls.find((call: any) => call[0] === 'renderChatMessageHTML');
            const renderChatMessageHandler = hookCall![1] as any;
            
            // Mock problematic HTML that will cause errors
            const mockMessage = { id: 'test-message' };
            const mockHtml = {
                find: jest.fn(() => { throw new Error('DOM manipulation error'); })
            };
            
            // Hook should handle the error gracefully
            expect(() => renderChatMessageHandler(mockMessage, mockHtml)).not.toThrow();
        });
    });

    describe('Power Point Button Event Handling', () => {
        test('should validate button data attributes for PP spending', () => {
            const cleanup = initializePowerPointHandlers();
            cleanupFunctions.push(cleanup);
            
            // Get the registered click handler
            const clickHandlerCall = (document.addEventListener as jest.Mock).mock.calls.find(call => call[0] === 'click');
            expect(clickHandlerCall).toBeDefined();
            
            const clickHandler = clickHandlerCall![1] as any;
            
            // Mock a click event on a PP button
            const mockButton = {
                matches: jest.fn(() => true), // Matches the .pp-spend selector
                dataset: {
                    pp: '3',
                    actorId: 'test-actor-id',
                    itemId: 'test-item-id'
                },
                disabled: false,
                textContent: 'Spend 3 PP',
                classList: {
                    add: jest.fn()
                }
            };
            
            const mockEvent = {
                target: mockButton,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
                currentTarget: mockButton
            };
            
            // Execute the click handler
            expect(() => clickHandler(mockEvent)).not.toThrow();
            
            // Verify event was handled
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockEvent.stopPropagation).toHaveBeenCalled();
        });

        test('should handle missing actor gracefully', () => {
            const cleanup = initializePowerPointHandlers();
            cleanupFunctions.push(cleanup);
            
            // Mock game to return no actor
            mockGame.actors.get = jest.fn(() => null);
            
            // Get the registered click handler
            const clickHandlerCall = (document.addEventListener as jest.Mock).mock.calls.find(call => call[0] === 'click');
            expect(clickHandlerCall).toBeDefined();
            const clickHandler = clickHandlerCall![1] as any;
            
            // Mock a click event with invalid actor ID
            const mockButton = {
                matches: jest.fn(() => true),
                dataset: {
                    pp: '3',
                    actorId: 'invalid-actor-id',
                    itemId: 'test-item-id'
                }
            };
            
            const mockEvent = {
                target: mockButton,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
                currentTarget: mockButton
            };
            
            // Execute the click handler
            expect(() => clickHandler(mockEvent)).not.toThrow();
            
            // Should warn about missing actor
            expect((globalThis as any).ui.notifications.warn).toHaveBeenCalledWith('Character not found for power point spending');
        });
    });

    describe('Cleanup and Resource Management', () => {
        test('should clean up all registered handlers when cleanupChatIntegration is called', () => {
            // Initialize chat integration
            const result = initializeChatIntegration(mockGame);
            expect(result.success).toBe(true);
            
            // Verify handlers were registered
            expect(mockGame.avant.chat._ppCleanup).toBeDefined();
            expect(mockGame.avant.chat._renderChatMessageHook).toBeDefined();
            
            // Clean up
            const cleanupResult = cleanupChatIntegration(mockGame);
            
            expect(cleanupResult.success).toBe(true);
            expect((globalThis as any).Hooks.off).toHaveBeenCalledWith('renderChatMessageHTML', expect.any(Function));
            expect(mockGame.avant.chat._ppCleanup).toBeUndefined();
            expect(mockGame.avant.chat._renderChatMessageHook).toBeUndefined();
        });

        test('should handle cleanup errors gracefully', () => {
            // Initialize with problematic cleanup
            mockGame.avant.chat = {
                _ppCleanup: jest.fn(() => { throw new Error('Cleanup error'); })
            };
            
            // Cleanup should not throw
            expect(() => cleanupChatIntegration(mockGame)).not.toThrow();
        });
    });

    describe('End-to-End Power Point Workflow', () => {
        test('should successfully process complete PP spend workflow', async () => {
            // GIVEN the chat and power point systems are initialized
            initializeChatIntegration(mockGame);
            const cleanup = initializePowerPointHandlers();
            cleanupFunctions.push(cleanup);
            
            // Mock postTalentCard to return success
            mockGame.avant.chat.postTalentCard = jest.fn().mockResolvedValue({ success: true });
            
            // AND a chat card has been rendered
            const postResult = await mockGame.avant.chat.postTalentCard('test-item-id', 'test-actor-id');
            expect(postResult.success).toBe(true);
            
            // WHEN a user clicks the "Spend PP" button
            const clickHandler = (document.addEventListener as jest.Mock).mock.calls.find(call => call[0] === 'click')?.[1] as any;
            expect(clickHandler).toBeDefined();

            const mockButton = {
                matches: jest.fn(() => true),
                dataset: {
                    pp: '3',
                    actorId: 'test-actor-id',
                    itemId: 'test-item-id'
                },
                disabled: false,
                textContent: 'Spend 3 PP',
                classList: { add: jest.fn() }
            };
            const mockEvent = { target: mockButton, preventDefault: jest.fn(), stopPropagation: jest.fn() };
            
            await clickHandler(mockEvent);

            // THEN the actor's power points should be updated
            expect(mockActor.update).toHaveBeenCalledWith({ 'system.powerPoints.value': 7 });
            expect((globalThis as any).ui.notifications.info).toHaveBeenCalledWith('Spent 3 Power Points. Remaining: 7');
        });
    });
}); 