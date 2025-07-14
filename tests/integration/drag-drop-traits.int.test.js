/**
 * @fileoverview Drag-and-Drop Trait Integration Tests
 * @version 1.0.0
 * @author Avant Development Team
 * @description Integration tests for Phase 2 drag-and-drop trait functionality
 * 
 * Tests the complete drag-and-drop workflow from DOM events to document updates,
 * including feature flag integration, visual feedback, and error handling.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import '../env/foundry-shim.js';
import { createMockItem } from '../mocks/item-factory.js';

// Mock the initialization manager to provide feature flag
const mockInitializationManager = {
    isServiceReady: jest.fn(() => true),
    getService: jest.fn().mockImplementation((serviceName) => {
        if (serviceName === 'systemSettings') {
            return {
                get: jest.fn().mockReturnValue(true) // Feature flag enabled
            };
        }
        return null;
    })
};

// Mock trait provider service
const mockTraitProvider = {
    getTraitById: jest.fn().mockImplementation((traitId) => {
        const mockTraits = {
            'trait-fire': { id: 'trait-fire', name: 'Fire', type: 'trait', system: { color: '#ff0000', icon: 'fas fa-fire' } },
            'trait-ice': { id: 'trait-ice', name: 'Ice', type: 'trait', system: { color: '#00ffff', icon: 'fas fa-snowflake' } },
            'trait-tech': { id: 'trait-tech', name: 'Tech', type: 'trait', system: { color: '#00ff00', icon: 'fas fa-cog' } }
        };
        return Promise.resolve(mockTraits[traitId] || null);
    })
};

// Mock UUID resolution for drag-drop data
const mockFoundryAPI = {
    TextEditor: {
        getDragEventData: jest.fn((event) => {
            const data = event.dataTransfer.getData('text/plain');
            return JSON.parse(data);
        })
    },
    fromUuid: jest.fn().mockImplementation((uuid) => {
        // Extract trait ID from UUID
        const traitId = uuid.split('.').pop();
        return mockTraitProvider.getTraitById(traitId);
    })
};

// Import the item sheet after mocking
import { createAvantItemSheet } from '../../scripts/sheets/item-sheet.ts';

// Mock global dependencies
global.InitializationManager = mockInitializationManager;
global.TraitProvider = mockTraitProvider;
Object.assign(global, mockFoundryAPI);

describe('Drag-and-Drop Trait Integration Tests', () => {
    let ItemSheet;
    let itemSheet;
    let mockItem;
    let mockTraitItem;
    let mockDropZone;
    let mockHtml;

    beforeEach(() => {
        // Create the item sheet class
        ItemSheet = createAvantItemSheet();

        // Create test item (weapon with existing traits)
        mockItem = createMockItem({
            id: 'item-sword',
            name: 'Test Sword',
            type: 'weapon',
            system: {
                traits: ['trait-fire'], // Already has fire trait
                damage: '1d8',
                modifier: 2
            }
        });

        // Create mock trait item for dropping
        mockTraitItem = {
            id: 'trait-ice',
            name: 'Ice',
            type: 'trait',
            system: {
                color: '#00ffff',
                icon: 'fas fa-snowflake'
            }
        };

        // Create item sheet instance
        itemSheet = new ItemSheet(mockItem);

        // Mock HTML environment
        const htmlElement = document.createElement('div');
        htmlElement.innerHTML = `
            <div class="trait-drop-zone" data-drop-zone="trait" style="display: none;">
                <div class="drop-zone-content">
                    <i class="fas fa-plus"></i>
                    <span>Drop trait here</span>
                </div>
                <div class="drop-zone-highlight"></div>
            </div>
            <div class="trait-chips">
                <div class="trait-chip" data-trait-id="trait-fire">Fire</div>
            </div>
        `;

        mockHtml = global.jQuery(htmlElement);
        mockDropZone = htmlElement.querySelector('.trait-drop-zone');

        // Mock item update method
        mockItem.update = jest.fn().mockResolvedValue(true);

        // Mock UI notifications
        global.ui = {
            notifications: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn()
            }
        };

        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('Feature Flag Integration', () => {
        test('drop zone is shown when feature flag is enabled', async () => {
            // ARRANGE: Feature flag enabled (default mock behavior)
            mockInitializationManager.getService.mockReturnValue({
                get: jest.fn().mockReturnValue(true)
            });

            // ACT: Activate drag-drop listeners
            itemSheet._activateDragDropListeners();

            // ASSERT: Drop zone should be visible
            expect(mockDropZone.style.display).toBe('');
        });

        test('drop zone is hidden when feature flag is disabled', async () => {
            // ARRANGE: Feature flag disabled
            mockInitializationManager.getService.mockReturnValue({
                get: jest.fn().mockReturnValue(false)
            });

            // ACT: Activate drag-drop listeners
            itemSheet._activateDragDropListeners();

            // ASSERT: Drop zone should remain hidden
            expect(mockDropZone.style.display).toBe('none');
        });
    });

    describe('Drag Event Handling', () => {
        beforeEach(() => {
            // Enable feature flag and activate listeners
            itemSheet._activateDragDropListeners();
        });

        test('dragover event prevents default and shows highlight', () => {
            // ARRANGE: Create dragover event
            const dragEvent = new DragEvent('dragover', {
                dataTransfer: new DataTransfer()
            });
            dragEvent.preventDefault = jest.fn();

            // ACT: Trigger dragover
            itemSheet._onDragOver(dragEvent);

            // ASSERT: Should prevent default and show highlight
            expect(dragEvent.preventDefault).toHaveBeenCalled();
            expect(mockDropZone.classList.contains('drag-hover')).toBe(true);
        });

        test('dragleave event removes highlight', () => {
            // ARRANGE: Start with highlight active
            mockDropZone.classList.add('drag-hover');
            const dragEvent = new DragEvent('dragleave');

            // ACT: Trigger dragleave
            itemSheet._onDragLeave(dragEvent);

            // ASSERT: Should remove highlight
            expect(mockDropZone.classList.contains('drag-hover')).toBe(false);
        });
    });

    describe('Trait Drop Processing', () => {
        beforeEach(() => {
            // Enable feature flag and activate listeners
            itemSheet._activateDragDropListeners();
        });

        test('successful trait drop adds trait to item', async () => {
            // ARRANGE: Create drop event with trait data
            const dropEvent = new DragEvent('drop', {
                dataTransfer: new DataTransfer()
            });
            dropEvent.dataTransfer.setData('text/plain', JSON.stringify({
                type: 'Item',
                uuid: 'Compendium.avant.avant-traits.trait-ice'
            }));
            dropEvent.preventDefault = jest.fn();

            // Mock successful drag data extraction
            mockFoundryAPI.TextEditor.getDragEventData.mockReturnValue({
                type: 'Item',
                uuid: 'Compendium.avant.avant-traits.trait-ice'
            });

            // ACT: Trigger drop
            await itemSheet._onDrop(dropEvent);

            // ASSERT: Should update item with new trait
            expect(mockItem.update).toHaveBeenCalledWith({
                'system.traits': ['trait-fire', 'trait-ice']
            });
            expect(global.ui.notifications.info).toHaveBeenCalledWith('Trait "Ice" added successfully');
        });

        test('duplicate trait drop shows error without updating', async () => {
            // ARRANGE: Create drop event with existing trait
            const dropEvent = new DragEvent('drop', {
                dataTransfer: new DataTransfer()
            });
            dropEvent.preventDefault = jest.fn();

            // Mock drag data for existing trait
            mockFoundryAPI.TextEditor.getDragEventData.mockReturnValue({
                type: 'Item',
                uuid: 'Compendium.avant.avant-traits.trait-fire'
            });

            // Mock trait resolution to return existing trait
            mockFoundryAPI.fromUuid.mockResolvedValue({
                id: 'trait-fire',
                name: 'Fire',
                type: 'trait'
            });

            // ACT: Trigger drop
            await itemSheet._onDrop(dropEvent);

            // ASSERT: Should show error and not update
            expect(mockItem.update).not.toHaveBeenCalled();
            expect(global.ui.notifications.warn).toHaveBeenCalledWith('Trait "Fire" is already on this item');
        });

        test('non-trait item drop shows error', async () => {
            // ARRANGE: Create drop event with non-trait item
            const dropEvent = new DragEvent('drop', {
                dataTransfer: new DataTransfer()
            });
            dropEvent.preventDefault = jest.fn();

            // Mock drag data for non-trait item
            mockFoundryAPI.TextEditor.getDragEventData.mockReturnValue({
                type: 'Item',
                uuid: 'Compendium.avant.equipment.sword-basic'
            });

            // Mock resolution to return non-trait item
            mockFoundryAPI.fromUuid.mockResolvedValue({
                id: 'sword-basic',
                name: 'Basic Sword',
                type: 'weapon'
            });

            // ACT: Trigger drop
            await itemSheet._onDrop(dropEvent);

            // ASSERT: Should show error and not update
            expect(mockItem.update).not.toHaveBeenCalled();
            expect(global.ui.notifications.error).toHaveBeenCalledWith('Cannot add weapon items as traits. Only trait items can be dropped here.');
        });

        test('trait limit enforcement prevents excessive traits', async () => {
            // ARRANGE: Create item with maximum traits
            const maxTraitsItem = createMockItem({
                id: 'item-full',
                name: 'Full Item',
                type: 'weapon',
                system: {
                    traits: Array.from({ length: 10 }, (_, i) => `trait-${i}`) // 10 traits (default limit)
                }
            });

            const fullItemSheet = new ItemSheet(maxTraitsItem);
            fullItemSheet._activateDragDropListeners();

            // Mock item update method
            maxTraitsItem.update = jest.fn().mockResolvedValue(true);

            // Create drop event
            const dropEvent = new DragEvent('drop', {
                dataTransfer: new DataTransfer()
            });
            dropEvent.preventDefault = jest.fn();

            mockFoundryAPI.TextEditor.getDragEventData.mockReturnValue({
                type: 'Item',
                uuid: 'Compendium.avant.avant-traits.trait-new'
            });

            mockFoundryAPI.fromUuid.mockResolvedValue({
                id: 'trait-new',
                name: 'New Trait',
                type: 'trait'
            });

            // ACT: Trigger drop
            await fullItemSheet._onDrop(dropEvent);

            // ASSERT: Should show limit error and not update
            expect(maxTraitsItem.update).not.toHaveBeenCalled();
            expect(global.ui.notifications.warn).toHaveBeenCalledWith('Maximum of 10 traits allowed per item');
        });
    });

    describe('Visual Feedback Integration', () => {
        beforeEach(() => {
            itemSheet._activateDragDropListeners();
        });

        test('successful drop shows success animation', async () => {
            // ARRANGE: Create successful drop scenario
            const dropEvent = new DragEvent('drop', {
                dataTransfer: new DataTransfer()
            });
            dropEvent.preventDefault = jest.fn();

            mockFoundryAPI.TextEditor.getDragEventData.mockReturnValue({
                type: 'Item',
                uuid: 'Compendium.avant.avant-traits.trait-tech'
            });

            mockFoundryAPI.fromUuid.mockResolvedValue({
                id: 'trait-tech',
                name: 'Tech',
                type: 'trait'
            });

            // ACT: Trigger drop
            await itemSheet._onDrop(dropEvent);

            // ASSERT: Should show success styling
            expect(mockDropZone.classList.contains('drop-success')).toBe(true);

            // Should clean up after animation
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(mockDropZone.classList.contains('drop-success')).toBe(false);
        });

        test('failed drop shows error animation', async () => {
            // ARRANGE: Create failed drop scenario
            const dropEvent = new DragEvent('drop', {
                dataTransfer: new DataTransfer()
            });
            dropEvent.preventDefault = jest.fn();

            mockFoundryAPI.TextEditor.getDragEventData.mockReturnValue({
                type: 'Item',
                uuid: 'Compendium.avant.avant-traits.trait-fire' // Duplicate
            });

            mockFoundryAPI.fromUuid.mockResolvedValue({
                id: 'trait-fire',
                name: 'Fire',
                type: 'trait'
            });

            // ACT: Trigger drop
            await itemSheet._onDrop(dropEvent);

            // ASSERT: Should show error styling
            expect(mockDropZone.classList.contains('drop-error')).toBe(true);

            // Should clean up after animation
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(mockDropZone.classList.contains('drop-error')).toBe(false);
        });
    });

    describe('Cross-Item Type Compatibility', () => {
        const itemTypes = ['weapon', 'armor', 'talent', 'augment', 'gear', 'action', 'feature'];

        itemTypes.forEach(itemType => {
            test(`trait drop works on ${itemType} items`, async () => {
                // ARRANGE: Create item of specific type
                const testItem = createMockItem({
                    id: `item-${itemType}`,
                    name: `Test ${itemType}`,
                    type: itemType,
                    system: {
                        traits: []
                    }
                });

                const testSheet = new ItemSheet(testItem);
                testSheet._activateDragDropListeners();
                testItem.update = jest.fn().mockResolvedValue(true);

                // Create drop event
                const dropEvent = new DragEvent('drop', {
                    dataTransfer: new DataTransfer()
                });
                dropEvent.preventDefault = jest.fn();

                mockFoundryAPI.TextEditor.getDragEventData.mockReturnValue({
                    type: 'Item',
                    uuid: 'Compendium.avant.avant-traits.trait-ice'
                });

                mockFoundryAPI.fromUuid.mockResolvedValue({
                    id: 'trait-ice',
                    name: 'Ice',
                    type: 'trait'
                });

                // ACT: Trigger drop
                await testSheet._onDrop(dropEvent);

                // ASSERT: Should work for all item types
                expect(testItem.update).toHaveBeenCalledWith({
                    'system.traits': ['trait-ice']
                });
            });
        });
    });

    describe('Error Handling Integration', () => {
        beforeEach(() => {
            itemSheet._activateDragDropListeners();
        });

        test('invalid drop data is handled gracefully', async () => {
            // ARRANGE: Create drop event with invalid data
            const dropEvent = new DragEvent('drop', {
                dataTransfer: new DataTransfer()
            });
            dropEvent.preventDefault = jest.fn();

            // Mock invalid drag data
            mockFoundryAPI.TextEditor.getDragEventData.mockReturnValue(null);

            // ACT: Trigger drop
            await itemSheet._onDrop(dropEvent);

            // ASSERT: Should handle gracefully without crashing
            expect(mockItem.update).not.toHaveBeenCalled();
            expect(global.ui.notifications.error).toHaveBeenCalledWith('Invalid drop data');
        });

        test('UUID resolution failure is handled gracefully', async () => {
            // ARRANGE: Create drop event with unresolvable UUID
            const dropEvent = new DragEvent('drop', {
                dataTransfer: new DataTransfer()
            });
            dropEvent.preventDefault = jest.fn();

            mockFoundryAPI.TextEditor.getDragEventData.mockReturnValue({
                type: 'Item',
                uuid: 'Compendium.missing.traits.nonexistent'
            });

            // Mock UUID resolution failure
            mockFoundryAPI.fromUuid.mockResolvedValue(null);

            // ACT: Trigger drop
            await itemSheet._onDrop(dropEvent);

            // ASSERT: Should handle gracefully
            expect(mockItem.update).not.toHaveBeenCalled();
            expect(global.ui.notifications.error).toHaveBeenCalledWith('Could not resolve dropped item');
        });

        test('document update failure is handled gracefully', async () => {
            // ARRANGE: Create drop event with update failure
            const dropEvent = new DragEvent('drop', {
                dataTransfer: new DataTransfer()
            });
            dropEvent.preventDefault = jest.fn();

            mockFoundryAPI.TextEditor.getDragEventData.mockReturnValue({
                type: 'Item',
                uuid: 'Compendium.avant.avant-traits.trait-ice'
            });

            mockFoundryAPI.fromUuid.mockResolvedValue({
                id: 'trait-ice',
                name: 'Ice',
                type: 'trait'
            });

            // Mock update failure
            mockItem.update = jest.fn().mockRejectedValue(new Error('Database error'));

            // ACT: Trigger drop
            await itemSheet._onDrop(dropEvent);

            // ASSERT: Should handle error gracefully
            expect(global.ui.notifications.error).toHaveBeenCalledWith('Failed to add trait: Database error');
        });
    });

    describe('Performance and Stability', () => {
        test('rapid successive drops are handled correctly', async () => {
            // ARRANGE: Enable feature flag and activate listeners
            itemSheet._activateDragDropListeners();

            // Create multiple drop events
            const dropPromises = [];
            for (let i = 0; i < 5; i++) {
                const dropEvent = new DragEvent('drop', {
                    dataTransfer: new DataTransfer()
                });
                dropEvent.preventDefault = jest.fn();

                mockFoundryAPI.TextEditor.getDragEventData.mockReturnValue({
                    type: 'Item',
                    uuid: `Compendium.avant.avant-traits.trait-${i}`
                });

                mockFoundryAPI.fromUuid.mockResolvedValue({
                    id: `trait-${i}`,
                    name: `Trait ${i}`,
                    type: 'trait'
                });

                dropPromises.push(itemSheet._onDrop(dropEvent));
            }

            // ACT: Execute all drops simultaneously
            await Promise.all(dropPromises);

            // ASSERT: Should handle all drops without race conditions
            expect(mockItem.update).toHaveBeenCalledTimes(5);
        });

        test('memory cleanup after sheet destruction', () => {
            // ARRANGE: Create and setup sheet
            itemSheet._activateDragDropListeners();

            // ACT: Destroy sheet (simulate close)
            itemSheet.close();

            // ASSERT: Should clean up event listeners
            // This test ensures no memory leaks from event listeners
            expect(mockDropZone.ondragover).toBeFalsy();
            expect(mockDropZone.ondrop).toBeFalsy();
        });
    });
}); 