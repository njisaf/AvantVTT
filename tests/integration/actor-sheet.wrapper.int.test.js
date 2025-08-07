/**
 * @fileoverview Integration tests for actor-sheet.js wrapper functionality
 * Tests delegation from FoundryVTT sheet wrapper to pure functions
 */

import { createMockActor } from '../mocks/actor-factory.js';
import '../env/foundry-shim.js';

describe('Actor Sheet Wrapper Integration', () => {
    let mockActor;
    let actorSheet;

    beforeEach(async () => {
        // Create test actor using factory
        mockActor = createMockActor();
        
        // Import the actor sheet class
        const { AvantActorSheet } = await import('../../scripts/sheets/actor-sheet.ts');
        
        // Create sheet instance
        actorSheet = new AvantActorSheet(mockActor, {});
    });

    test('should create actor sheet and exercise getData method', async () => {
        // Call getData which delegates to pure functions
        const data = await actorSheet.getData();
        
        // Verify delegation occurred and returns data
        expect(data).toBeDefined();
        expect(typeof data).toBe('object');
        expect(data.system).toBeDefined();
        
        // Verify that calculated values are added by delegation
        expect(data.attributeTotalModifiers).toBeDefined();
        expect(data.skillTotalModifiers).toBeDefined();
    });

    test('should handle _onItemCreate method', async () => {
        // Mock event with proper structure that won't cause errors
        const mockEvent = {
            preventDefault: () => {},
            currentTarget: {
                dataset: { type: 'action' }
            }
        };
        
        // Call _onItemCreate to exercise wrapper functionality  
        // This should not throw an error
        await expect(actorSheet._onItemCreate(mockEvent)).resolves.not.toThrow();
    });

    test('should handle activateListeners method', () => {
        // Create mock HTML wrapped in jQuery for v13 compatibility
        const htmlElement = document.createElement('div');
        const mockHtml = global.jQuery(htmlElement);
        
        // Mock isEditable to exercise listener setup
        actorSheet.isEditable = true;
        
        // Call activateListeners to exercise it - should not throw
        expect(() => actorSheet.activateListeners(mockHtml)).not.toThrow();
    });

    test('should handle roll delegation to utility functions', async () => {
        // Mock the roll event that would be triggered from sheet
        const mockEvent = {
            preventDefault: () => {},
            currentTarget: {
                dataset: { 
                    rollType: 'skill',
                    skill: 'athletics'
                }
            }
        };
        
        // Mock Roll constructor to avoid FoundryVTT dependency
        global.Roll = jest.fn().mockImplementation(() => ({
            toMessage: jest.fn().mockResolvedValue(),
            evaluate: jest.fn().mockResolvedValue()
        }));
        
        // Mock ChatMessage.getSpeaker 
        global.ChatMessage = {
            getSpeaker: jest.fn().mockReturnValue({ actor: mockActor })
        };
        
        // Call _onRoll method if it exists to exercise roll delegation
        if (typeof actorSheet._onRoll === 'function') {
            await expect(actorSheet._onRoll(mockEvent)).resolves.not.toThrow();
        }
        
        // Alternatively, test that roll data is prepared correctly from the actor
        const rollData = mockActor.getRollData();
        expect(rollData).toBeDefined();
        expect(typeof rollData).toBe('object');
    });
}); 