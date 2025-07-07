import { AvantActorSheet } from '../../../scripts/sheets/actor-sheet';
import * as actorSheetUtils from '@/logic/actor-sheet-utils';
import { FoundryUI } from '../../../scripts/types/adapters/foundry-ui';

// Mock dependencies
jest.mock('@/logic/actor-sheet-utils', () => ({
    extractItemIdFromElement: jest.fn(),
    // ... existing code ...
}));

describe('Chat Integration', () => {
    describe('onPostItem', () => {
        test('should post talent card successfully', async () => {
            // Setup mocks
            (actorSheetUtils.extractItemIdFromElement as jest.Mock).mockReturnValue('test-talent-id');
            mockActor.items.get.mockReturnValue(mockItem);
            mockChatAPI.postTalentCard.mockResolvedValue({ success: true });

            // Create mock event
            const mockEvent = { preventDefault: jest.fn() };

            // Call the function
            await onPostItem(mockEvent);

            // Verify results
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(actorSheetUtils.extractItemIdFromElement).toHaveBeenCalled();
            expect(mockActor.items.get).toHaveBeenCalledWith('test-talent-id');
            expect(mockChatAPI.postTalentCard).toHaveBeenCalledWith('test-talent-id', 'test-actor-id');
        });

        test('should post augment card successfully', async () => {
            // Setup mocks
            (actorSheetUtils.extractItemIdFromElement as jest.Mock).mockReturnValue('test-augment-id');
            mockActor.items.get.mockReturnValue(mockAugment);
            mockChatAPI.postAugmentCard.mockResolvedValue({ success: true });

            // Create mock event
            const mockEvent = { preventDefault: jest.fn() };

            // Call the function
            await onPostItem(mockEvent);

            expect(mockChatAPI.postAugmentCard).toHaveBeenCalledWith('test-augment-id', 'test-actor-id');
        });

        test('should handle missing item gracefully', async () => {
            // Setup mocks
            (actorSheetUtils.extractItemIdFromElement as jest.Mock).mockReturnValue('missing-item-id');
            mockActor.items.get.mockReturnValue(null);

            // Create mock event
            const mockEvent = { preventDefault: jest.fn() };

            // Call the function
            await onPostItem(mockEvent);

            expect(mockChatAPI.postTalentCard).not.toHaveBeenCalled();
        });

        test('should handle missing item element gracefully', async () => {
            // Setup mocks
            (actorSheetUtils.extractItemIdFromElement as jest.Mock).mockReturnValue(null);

            // Create mock event
            const mockEvent = { preventDefault: jest.fn(), currentTarget: null };

            // Call the function
            await onPostItem(mockEvent);

            expect(mockChatAPI.postTalentCard).not.toHaveBeenCalled();
        });

        test('should handle chat API failure gracefully', async () => {
            // Setup mocks
            (actorSheetUtils.extractItemIdFromElement as jest.Mock).mockReturnValue('test-talent-id');
            mockActor.items.get.mockReturnValue(mockItem);
            mockChatAPI.postTalentCard.mockResolvedValue({ success: false, error: 'API Error' });

            // Create mock event
            const mockEvent = { preventDefault: jest.fn(), currentTarget: {} };

            // Call the function
            await onPostItem(mockEvent);

            expect(mockChatAPI.postTalentCard).toHaveBeenCalledWith('test-talent-id', 'test-actor-id');
        });

        test('should post feature card successfully', async () => {
            // Setup mocks
            (actorSheetUtils.extractItemIdFromElement as jest.Mock).mockReturnValue('test-feature-id');
            mockActor.items.get.mockReturnValue(mockFeature);
            mockChatAPI.postFeatureCard.mockResolvedValue({ success: true });

            // Create mock event
            const mockEvent = { preventDefault: jest.fn() };

            // Call the function
            await onPostItem(mockEvent);

            expect(mockChatAPI.postFeatureCard).toHaveBeenCalledWith('test-feature-id', 'test-actor-id');
        });

        test('should handle exceptions gracefully', async () => {
            // Setup mocks
            (actorSheetUtils.extractItemIdFromElement as jest.Mock).mockReturnValue('test-talent-id');
            mockActor.items.get.mockReturnValue(mockItem);
            mockChatAPI.postTalentCard.mockRejectedValue(new Error('Network error'));

            // Create mock event
            const mockEvent = { preventDefault: jest.fn() };

            // Call the function
            await onPostItem(mockEvent);

            expect(mockChatAPI.postTalentCard).toHaveBeenCalledWith('test-talent-id', 'test-actor-id');
        });
    });
}); 