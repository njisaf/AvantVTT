/**
 * @fileoverview Integration Tests for Tag Button Interaction
 * @version 1.0.0
 * @description Tests the complete tag button interaction flow
 * @author Avant VTT Team
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import '../../env/foundry-shim.js';

describe('Tag Button Interaction Integration Tests', () => {
  let itemSheet;
  let mockItem;
  let mockHtml;

  beforeEach(async () => {
    // Create mock trait item
    mockItem = {
      type: 'trait',
      name: 'Test Trait',
      system: { tags: [] },
      update: jest.fn()
    };

    // Mock HTML structure
    const createMockInput = (initialValue) => ({
      value: initialValue,
      dispatchEvent: jest.fn()
    });

    mockHtml = {
      find: jest.fn((selector) => {
        if (selector === 'input[name="system.tags"]') {
          return { 0: createMockInput('') };
        }
        return { each: jest.fn() };
      })
    };

    // Import and create item sheet
    const { AvantItemSheet } = await import('../../../scripts/sheets/item-sheet.ts');
    itemSheet = new AvantItemSheet(mockItem, {});
    itemSheet.element = mockHtml;
  });

  test('tag button adds single tag correctly', async () => {
    // Arrange
    const tagsInput = mockHtml.find('input[name="system.tags"]')[0];
    const button = {
      dataset: { tags: 'weapon' },
      classList: { add: jest.fn(), remove: jest.fn() }
    };
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      currentTarget: button
    };

    // Act
    await itemSheet._onTagExampleClick(mockEvent);

    // Assert
    expect(tagsInput.value).toBe('weapon');
    expect(button.classList.add).toHaveBeenCalledWith('selected');
  });

  test('tag button adds multiple tags correctly', async () => {
    // Arrange
    const tagsInput = mockHtml.find('input[name="system.tags"]')[0];
    const button = {
      dataset: { tags: 'weapon,armor' },
      classList: { add: jest.fn(), remove: jest.fn() }
    };
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      currentTarget: button
    };

    // Act
    await itemSheet._onTagExampleClick(mockEvent);

    // Assert
    expect(tagsInput.value).toBe('weapon,armor');
    expect(button.classList.add).toHaveBeenCalledWith('selected');
  });

  test('tag button removes existing tags correctly', async () => {
    // Arrange
    const tagsInput = mockHtml.find('input[name="system.tags"]')[0];
    tagsInput.value = 'weapon,armor,gear';
    
    const button = {
      dataset: { tags: 'weapon,armor' },
      classList: { add: jest.fn(), remove: jest.fn() }
    };
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      currentTarget: button
    };

    // Act
    await itemSheet._onTagExampleClick(mockEvent);

    // Assert
    expect(tagsInput.value).toBe('gear');
    expect(button.classList.remove).toHaveBeenCalledWith('selected');
  });
});