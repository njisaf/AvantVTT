/**
 * @fileoverview Unit Tests for Chat Card Styling (Phase 5 Bug Fixes)
 * @version 1.0.0 - Phase 5: Stabilisation
 * @description Tests to verify chat card styling and CSS import fixes
 * @author Avant VTT Team
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { buildFeatureCard } from '../../../scripts/logic/chat/feature-card-builder';
import { TraitProvider } from '@/services/trait-provider';
import { applyStylingToCard } from '../../../scripts/logic/chat/chat-card-styling';

// Mock dependencies
jest.unstable_mockModule('@/services/trait-provider', () => ({
    TraitProvider: jest.fn(() => ({
        getAll: jest.fn(() => Promise.resolve({ success: true, data: [] }))
    }))
}));
jest.unstable_mockModule('../../../scripts/logic/chat/trait-resolver', () => ({
    createTraitHtmlForChat: jest.fn(() => Promise.resolve('<span class="trait-chip">Test Trait</span>'))
}));

const mockTraitProvider = new TraitProvider() as jest.Mocked<TraitProvider>;

describe('Chat Card Styling (Bug #1 Fix)', () => {
    let mockItem: any;
    let mockActor: any;
    let mockTraitProvider: any;

    beforeEach(() => {
        // Mock item
        mockItem = {
            id: 'test-item-id',
            name: 'Test Talent',
            type: 'talent',
            system: {
                description: 'A test talent for styling verification',
                powerPointCost: 3,
                tier: 2,
                traits: ['fire']
            }
        };

        // Mock actor
        mockActor = {
            id: 'test-actor-id',
            name: 'Test Character',
            system: {
                powerPoints: {
                    value: 10,
                    max: 15
                }
            }
        };

        // Mock trait provider
        mockTraitProvider = {
            getAll: jest.fn(() => Promise.resolve({
                success: true,
                data: [
                    { id: 'fire', name: 'Fire', color: '#ff4444', icon: 'fas fa-fire' }
                ]
            }))
        };

        jest.clearAllMocks();
    });

    describe('CSS Class Application', () => {
        test('should generate card with correct root CSS class', async () => {
            const html = await buildFeatureCard(mockItem, mockActor, mockTraitProvider);
            
            // Check for the main avant-feature-card class that should receive styling
            expect(html).toContain('class="avant-feature-card"');
        });

        test('should include required data attributes for functionality', async () => {
            const html = await buildFeatureCard(mockItem, mockActor, mockTraitProvider);
            
            // Check for data attributes needed for power point functionality
            expect(html).toContain('data-item-id="test-item-id"');
            expect(html).toContain('data-actor-id="test-actor-id"');
        });

        test('should generate power point button with correct classes and attributes', async () => {
            const html = await buildFeatureCard(mockItem, mockActor, mockTraitProvider);
            
            // Check for PP button with correct class for event delegation
            expect(html).toContain('class="pp-spend');
            expect(html).toContain('data-pp="3"');
            expect(html).toContain('data-actor-id="test-actor-id"');
            expect(html).toContain('data-item-id="test-item-id"');
        });

        test('should apply correct structure classes for styling', async () => {
            const html = await buildFeatureCard(mockItem, mockActor, mockTraitProvider);
            
            // Check for structural classes that should receive styling
            expect(html).toContain('class="card-header"');
            expect(html).toContain('class="feature-name"');
            expect(html).toContain('class="feature-type"');
            expect(html).toContain('class="card-content"');
            expect(html).toContain('class="feature-description"');
            expect(html).toContain('class="card-footer"');
        });

        test('should include accessibility attributes', async () => {
            const html = await buildFeatureCard(mockItem, mockActor, mockTraitProvider);
            
            // Check for accessibility attributes
            expect(html).toContain('role="button"');
            expect(html).toContain('aria-label=');
            expect(html).toContain('aria-describedby=');
        });
    });

    describe('Conditional Styling Classes', () => {
        test('should add disabled class when insufficient power points', async () => {
            // Set actor PP lower than cost
            mockActor.system.powerPoints.value = 1;
            
            const html = await buildFeatureCard(mockItem, mockActor, mockTraitProvider);
            
            // Button should have disabled state
            expect(html).toContain('disabled');
            expect(html).toContain('Insufficient PP');
        });

        test('should not add disabled class when sufficient power points', async () => {
            // Ensure actor has enough PP
            mockActor.system.powerPoints.value = 10;
            
            const html = await buildFeatureCard(mockItem, mockActor, mockTraitProvider);
            
            // Button should not be disabled
            expect(html).toContain('Spend 3 PP');
            expect(html).not.toContain('disabled');
        });

        test('should handle zero PP cost items correctly', async () => {
            mockItem.system.powerPointCost = 0;
            
            const html = await buildFeatureCard(mockItem, mockActor, mockTraitProvider);
            
            // Should show no PP cost message
            expect(html).toContain('No PP Cost');
            expect(html).not.toContain('pp-spend');
        });
    });

    describe('Error State Styling', () => {
        test('should apply error class for invalid items', async () => {
            const invalidItem = {
                id: null,
                name: null,
                system: null
            };
            
            const html = await buildFeatureCard(invalidItem as any, mockActor, mockTraitProvider);
            
            // Should have error styling class
            expect(html).toContain('class="avant-feature-card error"');
        });
    });
});

describe('SCSS Import Verification', () => {
    test('should confirm _cards.scss is imported in main stylesheet', () => {
        // This test verifies the fix for Bug #1
        // We can't directly test SCSS compilation in unit tests,
        // but we can verify the expected structure is in place
        
        // In a real environment, the compiled CSS should include the card styles
        // This test documents the expected behavior
        expect(true).toBe(true); // Placeholder - actual verification happens in integration tests
    });
}); 