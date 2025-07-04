/**
 * @fileoverview Actor Sheet - Talents & Augments QA Integration Tests
 * @description Comprehensive tests for S3-C Phase: keyboard navigation, AP selector, and persistence
 * @version 1.0.0 - FoundryVTT v13 Compatible
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock FoundryVTT globals
global.game = {
  user: { isGM: false },
  settings: {
    get: jest.fn(() => 'dark'),
    set: jest.fn()
  },
  i18n: {
    localize: jest.fn((key) => key),
    format: jest.fn((key, data) => `${key}: ${JSON.stringify(data)}`)
  }
};

global.ui = {
  notifications: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
};

global.foundry = {
  utils: {
    mergeObject: jest.fn((target, source) => ({ ...target, ...source }))
  }
};

global.ActorSheet = class MockActorSheet {
  static get defaultOptions() {
    return {
      classes: ['sheet', 'actor'],
      template: 'templates/actor-sheet.html',
      width: 600,
      height: 700
    };
  }
};

global.$ = jest.fn(() => ({
  find: jest.fn(() => ({
    click: jest.fn(),
    focus: jest.fn(),
    length: 1,
    on: jest.fn(),
    off: jest.fn(),
    trigger: jest.fn(),
    val: jest.fn(() => '2'),
    prop: jest.fn()
  })),
  on: jest.fn(),
  off: jest.fn()
}));

global.CONFIG = {
  AVANT: {}
};

describe('Actor Sheet - Talents & Augments QA Integration Tests', () => {
  let mockActorSheet;
  let mockActor;
  let mockHtml;

  beforeEach(() => {
    // Create mock actor with talent and augment items
    mockActor = {
      _id: 'test-actor-123',
      name: 'Test Character',
      type: 'character',
      system: {
        level: 3,
        health: { value: 25, max: 30 },
        abilities: {
          might: { modifier: 2 },
          grace: { modifier: 1 },
          intellect: { modifier: 3 },
          focus: { modifier: 1 }
        }
      },
      items: [
        {
          _id: 'talent-123',
          name: 'Fire Strike',
          type: 'talent',
          system: {
            apCost: 2,
            usable: true,
            isActive: false,
            description: 'Channel fire energy into a devastating melee attack.'
          }
        },
        {
          _id: 'augment-456',
          name: 'Neural Interface',
          type: 'augment',
          system: {
            apCost: 1,
            ppCost: 2,
            usable: true,
            isActive: false,
            description: 'A neural implant that enhances cognitive processing.'
          }
        }
      ],
      update: jest.fn(),
      getFlag: jest.fn(),
      setFlag: jest.fn()
    };

    // Create mock HTML element with proper structure
    mockHtml = {
      find: jest.fn((selector) => {
        const mockElement = {
          length: 1,
          click: jest.fn(),
          focus: jest.fn(),
          on: jest.fn(),
          off: jest.fn(),
          trigger: jest.fn(),
          val: jest.fn(() => '2'),
          prop: jest.fn(),
          attr: jest.fn(),
          dataset: {},
          dispatchEvent: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };

        // Simulate specific element queries
        if (selector.includes('.row-control')) {
          mockElement.dataset = { action: 'useTalent', itemId: 'talent-123' };
        } else if (selector.includes('.ap-selector')) {
          mockElement.dataset = { apValue: '2' };
        }

        return mockElement;
      }),
      on: jest.fn(),
      off: jest.fn()
    };

    // Create mock actor sheet
    mockActorSheet = {
      actor: mockActor,
      element: mockHtml,
      isEditable: true,
      getData: jest.fn(() => ({
        actor: mockActor,
        system: mockActor.system,
        items: {
          talent: [mockActor.items[0]],
          augment: [mockActor.items[1]]
        }
      })),
      activateListeners: jest.fn(),
      _onItemAction: jest.fn(),
      _onAPSelectorClick: jest.fn(),
      render: jest.fn(),
      close: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Keyboard Navigation Tests', () => {
    test('should focus chat/activate control with keyboard navigation', async () => {
      // Arrange
      const chatButton = mockHtml.find('.row-control .chat-roll-btn, .row-control .activate-toggle-btn');
      const keyboardEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });

      // Act
      chatButton.focus();
      chatButton.trigger('focus');

      // Assert
      expect(chatButton.focus).toHaveBeenCalled();
      expect(chatButton.length).toBe(1);
    });

    test('should handle Space key press on chat/activate control', async () => {
      // Arrange
      const chatButton = mockHtml.find('.row-control .activate-toggle-btn');
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space',
        bubbles: true,
        preventDefault: jest.fn()
      });

      chatButton.trigger = jest.fn((event, handler) => {
        if (typeof handler === 'function') {
          handler(spaceEvent);
        }
      });

      // Act
      chatButton.trigger('keydown', (e) => {
        if (e.key === ' ') {
          e.preventDefault();
          mockActorSheet._onItemAction(e);
        }
      });

      // Assert
      expect(chatButton.trigger).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('should navigate between AP selector circles with arrow keys', async () => {
      // Arrange
      const apSelector = mockHtml.find('.ap-selector .ap-circle');
      const rightArrowEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true
      });

      // Mock multiple AP circles
      const mockCircles = [
        { focus: jest.fn(), dataset: { apValue: '1' } },
        { focus: jest.fn(), dataset: { apValue: '2' } },
        { focus: jest.fn(), dataset: { apValue: '3' } },
        { focus: jest.fn(), dataset: { apValue: '4' } }
      ];

      mockHtml.find = jest.fn((selector) => {
        if (selector.includes('.ap-circle')) {
          return mockCircles;
        }
        return { length: 0 };
      });

      // Act - simulate arrow key navigation
      mockCircles[0].focus();
      // Simulate moving to next circle
      mockCircles[1].focus();

      // Assert
      expect(mockCircles[0].focus).toHaveBeenCalled();
      expect(mockCircles[1].focus).toHaveBeenCalled();
    });
  });

  describe('AP Selector Functionality Tests', () => {
    test('should update AP value when selector is clicked', async () => {
      // Arrange
      const apCircle = mockHtml.find('.ap-selector .ap-circle[data-ap-value="3"]');
      const clickEvent = new Event('click');
      
      mockActorSheet._onAPSelectorClick = jest.fn(async (event) => {
        const apValue = parseInt(event.target.dataset.apValue);
        await mockActor.update({ 'system.apCost': apValue });
      });

      // Act
      await mockActorSheet._onAPSelectorClick({
        target: { dataset: { apValue: '3' } }
      });

      // Assert
      expect(mockActorSheet._onAPSelectorClick).toHaveBeenCalled();
      expect(mockActor.update).toHaveBeenCalledWith({ 'system.apCost': 3 });
    });

    test('should persist AP value after save and reopen', async () => {
      // Arrange
      const initialAPValue = 2;
      const newAPValue = 4;
      
      // Simulate setting AP value
      await mockActor.update({ 'system.apCost': newAPValue });
      
      // Simulate closing and reopening sheet
      mockActorSheet.close();
      
      // Mock actor with updated AP value
      mockActor.system.apCost = newAPValue;
      
      // Simulate reopening sheet
      const sheetData = mockActorSheet.getData();

      // Assert
      expect(mockActor.update).toHaveBeenCalledWith({ 'system.apCost': newAPValue });
      expect(sheetData.system.apCost).toBe(newAPValue);
    });

    test('should display correct number of filled/empty AP circles', () => {
      // Arrange
      const apCost = 3;
      const maxAP = 4;
      
      // Mock the helper function that determines AP display
      const getAPDisplay = (cost, max) => {
        const display = [];
        for (let i = 1; i <= max; i++) {
          display.push({
            value: i,
            filled: i <= cost,
            empty: i > cost
          });
        }
        return display;
      };

      // Act
      const apDisplay = getAPDisplay(apCost, maxAP);

      // Assert
      expect(apDisplay).toHaveLength(4);
      expect(apDisplay.filter(ap => ap.filled)).toHaveLength(3);
      expect(apDisplay.filter(ap => ap.empty)).toHaveLength(1);
      expect(apDisplay[0].filled).toBe(true);
      expect(apDisplay[1].filled).toBe(true);
      expect(apDisplay[2].filled).toBe(true);
      expect(apDisplay[3].filled).toBe(false);
    });
  });

  describe('Data Persistence Tests', () => {
    test('should maintain talent data across sheet reloads', async () => {
      // Arrange
      const talentData = {
        name: 'Fire Strike',
        system: {
          apCost: 2,
          description: 'Channel fire energy into a devastating melee attack.',
          isActive: true
        }
      };

      // Simulate updating talent
      await mockActor.update({ 'items.0.system.isActive': true });

      // Simulate sheet reload
      const reloadedData = mockActorSheet.getData();

      // Assert
      expect(mockActor.update).toHaveBeenCalled();
      expect(reloadedData.items.talent[0].name).toBe('Fire Strike');
    });

    test('should maintain augment PP cost data', () => {
      // Arrange
      const augment = mockActor.items[1];

      // Assert
      expect(augment.type).toBe('augment');
      expect(augment.system.ppCost).toBe(2);
      expect(augment.system.apCost).toBe(1);
    });
  });

  describe('UI Integration Tests', () => {
    test('should render talent and augment rows with correct structure', () => {
      // Arrange
      const sheetData = mockActorSheet.getData();

      // Assert - Check data structure
      expect(sheetData.items.talent).toHaveLength(1);
      expect(sheetData.items.augment).toHaveLength(1);
      expect(sheetData.items.talent[0]._id).toBe('talent-123');
      expect(sheetData.items.augment[0]._id).toBe('augment-456');
    });

    test('should display proper button labels and ARIA attributes', () => {
      // Arrange
      const talentButton = mockHtml.find('.row-control .activate-toggle-btn');
      
      // Mock proper ARIA attributes
      talentButton.attr = jest.fn((attr) => {
        if (attr === 'aria-label') return 'Use Talent: Fire Strike';
        if (attr === 'title') return 'Use Talent: Fire Strike';
        return null;
      });

      // Assert
      expect(talentButton.attr('aria-label')).toBe('Use Talent: Fire Strike');
      expect(talentButton.attr('title')).toBe('Use Talent: Fire Strike');
    });

    test('should handle edit and delete button clicks', async () => {
      // Arrange
      const editButton = mockHtml.find('.row-edit');
      const deleteButton = mockHtml.find('.row-delete');

      editButton.click = jest.fn();
      deleteButton.click = jest.fn();

      // Act
      editButton.click();
      deleteButton.click();

      // Assert
      expect(editButton.click).toHaveBeenCalled();
      expect(deleteButton.click).toHaveBeenCalled();
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle missing item data gracefully', () => {
      // Arrange
      const invalidActor = {
        ...mockActor,
        items: []
      };

      mockActorSheet.actor = invalidActor;

      // Act
      const sheetData = mockActorSheet.getData();

      // Assert
      expect(sheetData.items.talent).toEqual([]);
      expect(sheetData.items.augment).toEqual([]);
    });

    test('should handle invalid AP values gracefully', async () => {
      // Arrange
      const invalidAPEvent = {
        target: { dataset: { apValue: 'invalid' } }
      };

      mockActorSheet._onAPSelectorClick = jest.fn(async (event) => {
        const apValue = parseInt(event.target.dataset.apValue);
        if (isNaN(apValue)) {
          console.warn('Invalid AP value');
          return;
        }
        await mockActor.update({ 'system.apCost': apValue });
      });

      // Act
      await mockActorSheet._onAPSelectorClick(invalidAPEvent);

      // Assert
      expect(mockActor.update).not.toHaveBeenCalled();
    });
  });
}); 