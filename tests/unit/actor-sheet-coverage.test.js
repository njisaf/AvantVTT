/**
 * @fileoverview Actor Sheet Coverage Tests for Stage 3(b)
 * Focus on exercising specific actor sheet methods to increase coverage
 */

import { createMockActor } from '../mocks/actor-factory.js';
import '../env/foundry-shim.js';

describe('Actor Sheet Coverage Tests', () => {
    let mockActor;
    let actorSheet;

    beforeEach(async () => {
        // Create test actor using factory
        mockActor = createMockActor();
        
        // Import the actor sheet class
        const { AvantActorSheet } = await import('../../scripts/sheets/actor-sheet.js');
        
        // Create sheet instance
        actorSheet = new AvantActorSheet(mockActor, {});
    });

    test('should exercise defaultOptions static method', async () => {
        const { AvantActorSheet } = await import('../../scripts/sheets/actor-sheet.js');
        
        // Call static defaultOptions method
        const options = AvantActorSheet.defaultOptions;
        
        // Verify default options
        expect(options).toBeDefined();
        expect(options.classes).toContain('avant');
        expect(options.template).toContain('actor-sheet.html');
        expect(options.width).toBe(900);
        expect(options.height).toBe(630);
    });

    test('should exercise _activateCoreListeners method', () => {
        // Mock html element
        const mockHtml = document.createElement('div');
        
        // Call _activateCoreListeners to exercise it
        expect(() => actorSheet._activateCoreListeners(mockHtml)).not.toThrow();
    });

    test('should exercise various roll methods', async () => {
        // Mock event for roll methods
        const mockEvent = {
            preventDefault: jest.fn(),
            currentTarget: {
                dataset: {
                    rollType: 'ability',
                    ability: 'might'
                }
            }
        };

        // Exercise _onRoll method
        await expect(actorSheet._onRoll(mockEvent)).resolves.not.toThrow();
        
        // Exercise _onAbilityRoll method
        const abilityEvent = {
            preventDefault: jest.fn(),
            currentTarget: {
                dataset: {
                    ability: 'might'
                }
            }
        };
        await expect(actorSheet._onAbilityRoll(abilityEvent)).resolves.not.toThrow();
    });

    test('should exercise skill roll method', async () => {
        // Mock event for skill roll
        const skillEvent = {
            preventDefault: jest.fn(),
            currentTarget: {
                dataset: {
                    skill: 'athletics'
                }
            }
        };

        // Exercise _onSkillRoll method
        await expect(actorSheet._onSkillRoll(skillEvent)).resolves.not.toThrow();
    });

    test('should exercise item edit method', () => {
        // Mock event for item operations
        const itemEvent = {
            preventDefault: jest.fn(),
            currentTarget: {
                closest: jest.fn().mockReturnValue({
                    dataset: { itemId: 'test-item-id' }
                })
            }
        };

        // Exercise _onItemEdit method
        expect(() => actorSheet._onItemEdit(itemEvent)).not.toThrow();
    });
}); 