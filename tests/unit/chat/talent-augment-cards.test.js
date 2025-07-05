/**
 * @fileoverview Talent & Augment Chat Cards Test Suite
 * @version 1.0.0 - Phase 2: Chat Integration
 * @description TDD test suite for talent and augment chat-card functionality
 * @author Avant VTT Team
 */

import { jest } from '@jest/globals';

describe('Talent & Augment Chat Cards', () => {
    let mockActor, mockTalent, mockAugment, mockTraitProvider;

    beforeEach(() => {
        // Mock actor with power points
        mockActor = {
            id: 'test-actor-id',
            name: 'Test Character',
            system: {
                powerPoints: {
                    value: 10,
                    max: 15
                }
            },
            update: jest.fn(() => Promise.resolve(true))
        };

        // Mock talent item
        mockTalent = {
            id: 'test-talent-id',
            name: 'Test Talent',
            type: 'talent',
            system: {
                description: 'A test talent for chat cards',
                powerPointCost: 3,
                tier: 2,
                traits: ['fire', 'combat']
            }
        };

        // Mock augment item
        mockAugment = {
            id: 'test-augment-id',
            name: 'Test Augment',
            type: 'augment',
            system: {
                description: 'A test augment for chat cards',
                powerPointCost: 2,
                augmentType: 'cybernetic',
                traits: ['tech', 'enhancement']
            }
        };

        // Mock trait provider
        mockTraitProvider = {
            getAll: jest.fn(() => Promise.resolve({
                success: true,
                data: [
                    { id: 'fire', name: 'Fire', color: '#ff4444', icon: 'fas fa-fire' },
                    { id: 'combat', name: 'Combat', color: '#994400', icon: 'fas fa-sword' },
                    { id: 'tech', name: 'Tech', color: '#0088ff', icon: 'fas fa-microchip' },
                    { id: 'enhancement', name: 'Enhancement', color: '#44ff44', icon: 'fas fa-plus' }
                ]
            }))
        };

        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('buildFeatureCard', () => {
        test('should exist as a pure function', async () => {
            const { buildFeatureCard } = await import('../../../scripts/logic/chat/feature-card-builder.js');
            expect(typeof buildFeatureCard).toBe('function');
        });

        test('should build talent card with PP cost and traits', async () => {
            const { buildFeatureCard } = await import('../../../scripts/logic/chat/feature-card-builder.js');
            
            const cardHtml = await buildFeatureCard(mockTalent, mockActor, mockTraitProvider);
            
            expect(cardHtml).toContain('Test Talent');
            expect(cardHtml).toContain('A test talent for chat cards');
            expect(cardHtml).toContain('data-pp="3"');
            expect(cardHtml).toContain('Spend 3 PP');
            expect(cardHtml).toContain('<strong>Tier:</strong> 2');
            expect(cardHtml).toContain('trait-chip');
        });

        test('should build augment card with PP cost and traits', async () => {
            const { buildFeatureCard } = await import('../../../scripts/logic/chat/feature-card-builder.js');
            
            const cardHtml = await buildFeatureCard(mockAugment, mockActor, mockTraitProvider);
            
            expect(cardHtml).toContain('Test Augment');
            expect(cardHtml).toContain('A test augment for chat cards');
            expect(cardHtml).toContain('data-pp="2"');
            expect(cardHtml).toContain('Spend 2 PP');
            expect(cardHtml).toContain('Cybernetic');
            expect(cardHtml).toContain('trait-chip');
        });

        test('should disable PP button when insufficient power points', async () => {
            const { buildFeatureCard } = await import('../../../scripts/logic/chat/feature-card-builder.js');
            
            // Set actor PP lower than talent cost
            mockActor.system.powerPoints.value = 2;
            
            const cardHtml = await buildFeatureCard(mockTalent, mockActor, mockTraitProvider);
            
            expect(cardHtml).toContain('disabled');
            expect(cardHtml).toContain('Insufficient PP');
        });

        test('should handle zero PP cost items', async () => {
            const { buildFeatureCard } = await import('../../../scripts/logic/chat/feature-card-builder.js');
            
            mockTalent.system.powerPointCost = 0;
            
            const cardHtml = await buildFeatureCard(mockTalent, mockActor, mockTraitProvider);
            
            expect(cardHtml).not.toContain('pp-spend');
            expect(cardHtml).toContain('No PP Cost');
        });

        test('should handle items without traits gracefully', async () => {
            const { buildFeatureCard } = await import('../../../scripts/logic/chat/feature-card-builder.js');
            
            mockTalent.system.traits = [];
            
            const cardHtml = await buildFeatureCard(mockTalent, mockActor, mockTraitProvider);
            
            expect(cardHtml).not.toContain('trait-chip');
            expect(cardHtml).toContain('Test Talent');
        });

        test('should escape HTML in descriptions', async () => {
            const { buildFeatureCard } = await import('../../../scripts/logic/chat/feature-card-builder.js');
            
            mockTalent.system.description = '<script>alert("xss")</script>Safe content';
            
            const cardHtml = await buildFeatureCard(mockTalent, mockActor, mockTraitProvider);
            
            expect(cardHtml).not.toContain('<script>');
            expect(cardHtml).toContain('Safe content');
        });
    });

    describe('postFeatureCard', () => {
        test('should exist as a function', async () => {
            const { postFeatureCard } = await import('../../../scripts/logic/chat/feature-card-builder.js');
            expect(typeof postFeatureCard).toBe('function');
        });

        test('should post talent card to chat', async () => {
            const mockChatMessage = {
                create: jest.fn(() => Promise.resolve({ id: 'test-message-id' })),
                getSpeaker: jest.fn(() => ({ alias: 'Test Character' }))
            };
            global.ChatMessage = mockChatMessage;

            const { postFeatureCard } = await import('../../../scripts/logic/chat/feature-card-builder.js');
            
            const result = await postFeatureCard(mockTalent, mockActor, mockTraitProvider);
            
            expect(result.success).toBe(true);
            expect(mockChatMessage.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining('Test Talent'),
                    speaker: expect.any(Object)
                })
            );
        });

        test('should include actor as speaker', async () => {
            const mockChatMessage = {
                create: jest.fn(() => Promise.resolve({ id: 'test-message-id' })),
                getSpeaker: jest.fn(() => ({ alias: 'Test Character' }))
            };
            global.ChatMessage = mockChatMessage;

            const { postFeatureCard } = await import('../../../scripts/logic/chat/feature-card-builder.js');
            
            await postFeatureCard(mockTalent, mockActor, mockTraitProvider);
            
            expect(mockChatMessage.getSpeaker).toHaveBeenCalledWith({ actor: mockActor });
        });
    });

    describe('PP Button Integration', () => {
        test('should handle PP spend click events', async () => {
            const { handlePowerPointSpend } = await import('../../../scripts/logic/chat/power-point-handler.js');
            
            // Mock proper ownership
            mockActor.ownership = { 'user-1': 3 }; // OWNER level
            const mockUser = { id: 'user-1', isGM: false };
            
            const result = await handlePowerPointSpend(mockActor, 3, mockUser);
            
            expect(result.success).toBe(true);
            expect(result.newValue).toBe(7);
            expect(mockActor.update).toHaveBeenCalledWith({
                'system.powerPoints.value': 7
            });
        });

        test('should validate ownership before spending PP', async () => {
            const { validatePowerPointSpend } = await import('../../../scripts/logic/chat/power-point-handler.js');
            
            const mockUser = { id: 'user-1' };
            global.game = {
                user: mockUser
            };
            
            // Actor not owned by user
            mockActor.ownership = { 'user-2': 3 };
            
            const validation = validatePowerPointSpend(mockActor, 3, mockUser);
            
            expect(validation.valid).toBe(false);
            expect(validation.error).toContain('ownership');
        });

        test('should prevent spending more PP than available', async () => {
            const { handlePowerPointSpend } = await import('../../../scripts/logic/chat/power-point-handler.js');
            
            // Mock proper ownership
            mockActor.ownership = { 'user-1': 3 }; // OWNER level
            const mockUser = { id: 'user-1', isGM: false };
            
            const result = await handlePowerPointSpend(mockActor, 15, mockUser);
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Insufficient');
            expect(mockActor.update).not.toHaveBeenCalled();
        });
    });

    describe('Chat Integration API', () => {
        test('should expose game.avant.chat.postTalentCard', async () => {
            // This test verifies the API is properly exposed
            const mockGame = {
                avant: {
                    chat: {}
                }
            };
            
            const { initializeChatIntegration } = await import('../../../scripts/logic/chat/chat-integration.js');
            initializeChatIntegration(mockGame);
            
            expect(typeof mockGame.avant.chat.postTalentCard).toBe('function');
            expect(typeof mockGame.avant.chat.postAugmentCard).toBe('function');
        });

        test('should handle invalid item IDs gracefully', async () => {
            const mockGame = {
                avant: { 
                    chat: {},
                    initializationManager: {
                        getService: jest.fn(() => mockTraitProvider)
                    }
                },
                actors: [
                    // Mock array of actors for iteration
                    {
                        items: {
                            get: jest.fn(() => null)
                        }
                    }
                ]
            };
            
            const { initializeChatIntegration } = await import('../../../scripts/logic/chat/chat-integration.js');
            initializeChatIntegration(mockGame);
            
            const result = await mockGame.avant.chat.postTalentCard('invalid-id');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
    });

    describe('Accessibility', () => {
        test('should include proper ARIA labels on PP buttons', async () => {
            const { buildFeatureCard } = await import('../../../scripts/logic/chat/feature-card-builder.js');
            
            const cardHtml = await buildFeatureCard(mockTalent, mockActor, mockTraitProvider);
            
            expect(cardHtml).toContain('aria-label');
            expect(cardHtml).toContain('role="button"');
        });

        test('should provide screen reader friendly descriptions', async () => {
            const { buildFeatureCard } = await import('../../../scripts/logic/chat/feature-card-builder.js');
            
            const cardHtml = await buildFeatureCard(mockTalent, mockActor, mockTraitProvider);
            
            expect(cardHtml).toContain('aria-describedby');
            expect(cardHtml).toContain('sr-only');
        });
    });

    describe('Error Handling', () => {
        test('should handle trait provider failures gracefully', async () => {
            const { buildFeatureCard } = await import('../../../scripts/logic/chat/feature-card-builder.js');
            
            mockTraitProvider.getAll = jest.fn(() => Promise.resolve({ success: false, error: 'Service unavailable' }));
            
            const cardHtml = await buildFeatureCard(mockTalent, mockActor, mockTraitProvider);
            
            expect(cardHtml).toContain('Test Talent');
            expect(cardHtml).not.toContain('trait-chip');
        });

        test('should handle malformed item data', async () => {
            const { buildFeatureCard } = await import('../../../scripts/logic/chat/feature-card-builder.js');
            
            const malformedItem = { name: 'Bad Item' }; // Missing system data
            
            const cardHtml = await buildFeatureCard(malformedItem, mockActor, mockTraitProvider);
            
            expect(cardHtml).toContain('Bad Item');
            expect(cardHtml).toContain('Failed to build feature card');
        });
    });
}); 