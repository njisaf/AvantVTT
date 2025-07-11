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
  let tagsInput;

  beforeEach(async () => {
    // Create mock trait item
    mockItem = {
      type: 'trait',
      name: 'Test Trait',
      system: { tags: [] },
      update: jest.fn()
    };
    
    // Create a stateful mock input element
    tagsInput = {
      value: '',
      dispatchEvent: jest.fn()
    };

    // Mock HTML structure with querySelector for native DOM methods
    mockHtml = {
      find: jest.fn((selector) => {
        if (selector === 'input[name="system.tags"]') {
          return { 0: tagsInput };
        }
        return { each: jest.fn() };
      }),
      querySelector: jest.fn((selector) => {
        if (selector === 'input[name="system.tags"]') {
          return tagsInput;
        }
        return null;
      })
    };

    // Import and create item sheet
    const { createAvantItemSheet } = await import('../../../scripts/sheets/item-sheet.ts');
    const AvantItemSheet = createAvantItemSheet();
    itemSheet = new AvantItemSheet(mockItem, {});
    itemSheet.element = mockHtml;
  });

  test('tag button adds single tag correctly', async () => {
    // Arrange
    const button = {
      dataset: { tag: 'weapon' },
      classList: { add: jest.fn(), remove: jest.fn() }
    };
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      currentTarget: button
    };

    // Act
    await itemSheet.onTagExampleClick(mockEvent, mockEvent.currentTarget);

    // Assert
    expect(tagsInput.value).toBe('weapon');
    expect(button.classList.add).toHaveBeenCalledWith('selected');
  });

  test('tag button adds multiple tags correctly', async () => {
    // Arrange - Add first tag
    const button1 = {
      dataset: { tag: 'weapon' },
      classList: { add: jest.fn(), remove: jest.fn() }
    };
    const mockEvent1 = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      currentTarget: button1
    };

    // Act - Add first tag
    await itemSheet.onTagExampleClick(mockEvent1, mockEvent1.currentTarget);

    // Arrange - Add second tag
    const button2 = {
      dataset: { tag: 'armor' },
      classList: { add: jest.fn(), remove: jest.fn() }
    };
    const mockEvent2 = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      currentTarget: button2
    };

    // Act - Add second tag
    await itemSheet.onTagExampleClick(mockEvent2, mockEvent2.currentTarget);

    // Assert
    expect(tagsInput.value).toBe('weapon, armor');
    expect(button1.classList.add).toHaveBeenCalledWith('selected');
    expect(button2.classList.add).toHaveBeenCalledWith('selected');
  });

  test('tag button removes existing tags correctly', async () => {
    // Arrange
    tagsInput.value = 'weapon,armor,gear';
    
    const button = {
      dataset: { tag: 'weapon' },
      classList: { add: jest.fn(), remove: jest.fn() }
    };
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      currentTarget: button
    };

    // Act
    await itemSheet.onTagExampleClick(mockEvent, mockEvent.currentTarget);

    // Assert
    expect(tagsInput.value).toBe('armor, gear');
    expect(button.classList.remove).toHaveBeenCalledWith('selected');
  });
});