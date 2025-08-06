/**
 * @fileoverview Unit Tests for Actor Sheet Chat Integration (Phase 4)
 * @version 1.0.0 - Phase 4: UI Integration
 * @description Tests for the new chat card posting functionality on actor sheets
 * @author Avant VTT Team
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { AvantActorSheet } from '../../../scripts/sheets/actor-sheet';
import * as actorSheetUtils from '@/logic/actor-sheet-utils';
import { FoundryUI } from '../../../scripts/types/adapters/foundry-ui';

// Mock dependencies
jest.unstable_mockModule('@/logic/actor-sheet-utils', () => ({
    extractItemIdFromElement: jest.fn(),
    calculateAttributeTotalModifiers: jest.fn(() => ({})),
    calculateSkillTotalModifiers: jest.fn(() => ({})),
    getAbilityModifier: jest.fn(() => 0),
    getSkillModifier: jest.fn(() => 0)
}));

jest.unstable_mockModule('../../../scripts/types/adapters/foundry-ui', () => ({
    FoundryUI: {
        notify: jest.fn()
    }
}));

jest.mock('../../../scripts/utils/logger', () => ({
    logger: {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

describe('Actor Sheet Chat Integration (Phase 4)', () => {
    let mockActor: any;
    let mockItem: any;
    let mockAugment: any;
    let mockFeature: any;
    let actorSheet: AvantActorSheet;
    let mockChatAPI: any;

    beforeEach(async () => {
        const actorSheetUtils = await import('@/logic/actor-sheet-utils');

        // Mock global jQuery
        (global as any).$ = jest.fn((selector) => ({
            slideUp: jest.fn(),
            find: jest.fn(() => ({ click: jest.fn() })),
            length: 1
        })) as any;

        // Mock actor
        mockActor = {
            id: 'test-actor-id',
            name: 'Test Character',
            items: {
                get: jest.fn()
            },
            toObject: jest.fn(() => ({
                system: {
                    level: 3,
                    attributes: {},
                    skills: {},
                    powerPoints: { value: 10, max: 15 }
                },
                flags: {}
            }))
        };

        // Mock talent item
        mockItem = {
            id: 'test-talent-id',
            name: 'Test Talent',
            type: 'talent',
            system: {
                description: 'A test talent for chat posting',
                powerPointCost: 3,
                tier: 2
            }
        };

        // Mock chat API
        mockChatAPI = {
            postTalentCard: jest.fn(),
            postAugmentCard: jest.fn(),
            postFeatureCard: jest.fn()
        };

        // Mock game object with chat API
        (global as any).game = {
            avant: {
                chat: mockChatAPI,
                initializationManager: {
                    getService: jest.fn()
                }
            }
        } as any;

        // Create actor sheet instance - cast to any to avoid TypeScript constructor issues
        actorSheet = new (AvantActorSheet as any)(mockActor, {});

        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('_onPostChatCard', () => {
        test('should exist as a method', () => {
            expect(typeof actorSheet._onPostChatCard).toBe('function');
        });

        test('should post talent card successfully', async () => {
            // Setup mocks
            (actorSheetUtils.extractItemIdFromElement as jest.Mock).mockReturnValue('test-talent-id');
            mockActor.items.get.mockReturnValue(mockItem);
            mockChatAPI.postTalentCard.mockResolvedValue({
                success: true,
                messageId: 'test-message-id'
            });

            // Create mock event
            const mockEvent = {
                preventDefault: jest.fn(),
                currentTarget: {
                    closest: jest.fn(() => ({ dataset: { itemId: 'test-talent-id' } }))
                }
            } as unknown as Event;

            // Execute method
            await actorSheet._onPostChatCard(mockEvent);

            // Verify results
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(actorSheetUtils.extractItemIdFromElement).toHaveBeenCalled();
            expect(mockActor.items.get).toHaveBeenCalledWith('test-talent-id');
            expect(mockChatAPI.postTalentCard).toHaveBeenCalledWith('test-talent-id', 'test-actor-id');
            expect(FoundryUI.notify).toHaveBeenCalledWith('Posted Test Talent to chat', 'info');
        });

        test('should post augment card successfully', async () => {
            // Setup augment item
            mockAugment = {
                ...mockItem,
                type: 'augment',
                name: 'Test Augment'
            };

            // Setup mocks
            (actorSheetUtils.extractItemIdFromElement as jest.Mock).mockReturnValue('test-augment-id');
            mockActor.items.get.mockReturnValue(mockAugment);
            mockChatAPI.postAugmentCard.mockResolvedValue({
                success: true,
                messageId: 'test-message-id'
            });

            // Create mock event
            const mockEvent = {
                preventDefault: jest.fn(),
                currentTarget: {
                    closest: jest.fn(() => ({ dataset: { itemId: 'test-augment-id' } }))
                }
            } as unknown as Event;

            // Execute method
            await actorSheet._onPostChatCard(mockEvent);

            // Verify results
            expect(mockChatAPI.postAugmentCard).toHaveBeenCalledWith('test-augment-id', 'test-actor-id');
            expect(FoundryUI.notify).toHaveBeenCalledWith('Posted Test Augment to chat', 'info');
        });

        test('should handle missing item gracefully', async () => {
            // Setup mocks
            (actorSheetUtils.extractItemIdFromElement as jest.Mock).mockReturnValue('missing-item-id');
            mockActor.items.get.mockReturnValue(null);

            // Create mock event
            const mockEvent = {
                preventDefault: jest.fn(),
                currentTarget: {
                    closest: jest.fn(() => ({ dataset: { itemId: 'missing-item-id' } }))
                }
            } as unknown as Event;

            // Execute method
            await actorSheet._onPostChatCard(mockEvent);

            // Verify results
            expect(FoundryUI.notify).toHaveBeenCalledWith('Item not found', 'warn');
            expect(mockChatAPI.postTalentCard).not.toHaveBeenCalled();
        });

        test('should handle missing item element gracefully', async () => {
            // Setup mocks
            (actorSheetUtils.extractItemIdFromElement as jest.Mock).mockReturnValue(null);

            // Create mock event
            const mockEvent = {
                preventDefault: jest.fn(),
                currentTarget: {
                    closest: jest.fn(() => null)
                }
            } as unknown as Event;

            // Execute method
            await actorSheet._onPostChatCard(mockEvent);

            // Verify results
            expect(FoundryUI.notify).toHaveBeenCalledWith('Item not found', 'warn');
            expect(mockChatAPI.postTalentCard).not.toHaveBeenCalled();
        });

        test('should handle chat API failure gracefully', async () => {
            // Setup mocks
            (actorSheetUtils.extractItemIdFromElement as jest.Mock).mockReturnValue('test-talent-id');
            mockActor.items.get.mockReturnValue(mockItem);
            mockChatAPI.postTalentCard.mockResolvedValue({
                success: false,
                error: 'Failed to create chat message'
            });

            // Create mock event
            const mockEvent = {
                preventDefault: jest.fn(),
                currentTarget: {
                    closest: jest.fn(() => ({ dataset: { itemId: 'test-talent-id' } }))
                }
            } as unknown as Event;

            // Execute method
            await actorSheet._onPostChatCard(mockEvent);

            // Verify results
            expect(FoundryUI.notify).toHaveBeenCalledWith('Failed to post chat card: Failed to create chat message', 'error');
        });

        test('should handle missing chat integration gracefully', async () => {
            // Remove chat API
            (global as any).game = {
                avant: {}
            } as any;

            // Setup mocks
            (actorSheetUtils.extractItemIdFromElement as jest.Mock).mockReturnValue('test-talent-id');
            mockActor.items.get.mockReturnValue(mockItem);

            // Create mock event
            const mockEvent = {
                preventDefault: jest.fn(),
                currentTarget: {
                    closest: jest.fn(() => ({ dataset: { itemId: 'test-talent-id' } }))
                }
            } as unknown as Event;

            // Execute method
            await actorSheet._onPostChatCard(mockEvent);

            // Verify results
            expect(FoundryUI.notify).toHaveBeenCalledWith('Chat integration not available', 'warn');
        });

        test('should handle unknown item types with fallback', async () => {
            // Setup unknown item type
            mockFeature = {
                ...mockItem,
                type: 'feature',
                name: 'Test Feature'
            };

            // Setup mocks
            (actorSheetUtils.extractItemIdFromElement as jest.Mock).mockReturnValue('test-feature-id');
            mockActor.items.get.mockReturnValue(mockFeature);
            mockChatAPI.postFeatureCard.mockResolvedValue({
                success: true,
                messageId: 'test-message-id'
            });

            // Create mock event
            const mockEvent = {
                preventDefault: jest.fn(),
                currentTarget: {
                    closest: jest.fn(() => ({ dataset: { itemId: 'test-feature-id' } }))
                }
            } as unknown as Event;

            // Execute method
            await actorSheet._onPostChatCard(mockEvent);

            // Verify results
            expect(mockChatAPI.postFeatureCard).toHaveBeenCalledWith('test-feature-id', 'test-actor-id');
            expect(FoundryUI.notify).toHaveBeenCalledWith('Posted Test Feature to chat', 'info');
        });

        test('should handle exceptions gracefully', async () => {
            // Setup mocks
            (actorSheetUtils.extractItemIdFromElement as jest.Mock).mockReturnValue('test-talent-id');
            mockActor.items.get.mockReturnValue(mockItem);
            mockChatAPI.postTalentCard.mockRejectedValue(new Error('Network error'));

            // Create mock event
            const mockEvent = {
                preventDefault: jest.fn(),
                currentTarget: {
                    closest: jest.fn(() => ({ dataset: { itemId: 'test-talent-id' } }))
                }
            } as unknown as Event;

            // Execute method
            await actorSheet._onPostChatCard(mockEvent);

            // Verify results
            expect(FoundryUI.notify).toHaveBeenCalledWith('Failed to post chat card: Network error', 'error');
        });
    });

    describe('activateListeners', () => {
        test('should register post-chat-card event listener', () => {
            const mockHtml = {
                find: jest.fn(() => ({
                    click: jest.fn()
                }))
            };

            // Mock isEditable property
            Object.defineProperty(actorSheet, 'isEditable', {
                get: () => true,
                configurable: true
            });

            // Execute method
            actorSheet.activateListeners(mockHtml);

            // Verify that the post-chat-card listener was registered
            expect(mockHtml.find).toHaveBeenCalledWith('.post-chat-card');
        });

        test('should not register listeners when not editable', () => {
            const mockHtml = {
                find: jest.fn(() => ({
                    click: jest.fn()
                }))
            };

            // Mock isEditable property to false
            Object.defineProperty(actorSheet, 'isEditable', {
                get: () => false,
                configurable: true
            });

            // Execute method
            actorSheet.activateListeners(mockHtml);

            // Verify that the post-chat-card listener was NOT registered
            expect(mockHtml.find).not.toHaveBeenCalledWith('.post-chat-card');
        });
    });
}); 