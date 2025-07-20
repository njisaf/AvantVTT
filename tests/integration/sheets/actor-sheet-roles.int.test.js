/**
 * @fileoverview Actor Sheet Roll Integration Tests
 * @description Integration tests for the actor sheet roll functionality using the Role Utility Framework
 * @version 1.0.0
 * @author Avant Development Team
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Actor Sheet Roll Integration', () => {
  let actorSheet;
  let mockActor;
  let mockRoll;
  let mockChatMessage;
  let mockButton;
  let mockEvent;

  beforeEach(async () => {
    // Setup mock actor data
    mockActor = {
      name: 'Test Actor',
      system: {
        abilities: {
          might: { value: 5, label: 'Might' },
          grace: { value: 3, label: 'Grace' },
          intellect: { value: 4, label: 'Intellect' },
          cunning: { value: 2, label: 'Cunning' }
        },
        skills: {
          athletics: { value: 7, label: 'Athletics' },
          stealth: { value: 5, label: 'Stealth' },
          investigation: { value: 6, label: 'Investigation' },
          deception: { value: 4, label: 'Deception' }
        },
        level: 3
      }
    };

    // Setup mock Roll and ChatMessage
    mockRoll = {
      evaluate: vi.fn().mockResolvedValue(undefined),
      toMessage: vi.fn().mockResolvedValue(undefined),
      total: 15
    };

    mockChatMessage = {
      getSpeaker: vi.fn().mockReturnValue({ alias: 'Test Actor' })
    };

    // Setup FoundryVTT globals
    (globalThis as any).Roll = vi.fn(() => mockRoll);
    (globalThis as any).ChatMessage = mockChatMessage;
    (globalThis as any).ui = {
      notifications: {
        error: vi.fn()
      }
    };

    // Create mock button and event
    mockButton = {
      dataset: {},
      closest: vi.fn().mockReturnValue(null)
    };

    mockEvent = {
      preventDefault: vi.fn(),
      target: mockButton
    };

    // Import and create actor sheet
    const { createAvantActorSheet } = await import('../../../scripts/sheets/actor-sheet.js');
    const AvantActorSheet = createAvantActorSheet();
    actorSheet = new AvantActorSheet(mockActor, {});
    
    // Mock logger
    globalThis.logger = {
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn()
    };
  });

  afterEach(() => {
    // Clean up globals
    delete (globalThis as any).Roll;
    delete (globalThis as any).ChatMessage;
    delete (globalThis as any).ui;
    delete (globalThis as any).logger;
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Ability Roll Integration', () => {
    it('should successfully roll abilities using the role utility framework', async () => {
      // Setup button with ability data
      mockButton.dataset.ability = 'might';
      
      // Import the sheet class to access static methods
      const { createAvantActorSheet } = await import('../../../scripts/sheets/actor-sheet.js');
      const AvantActorSheet = createAvantActorSheet();
      
      // Execute the ability roll
      await AvantActorSheet._onRollAbility.call(actorSheet, mockEvent, mockButton);
      
      // Verify the roll was created and executed
      expect(mockRoll.evaluate).toHaveBeenCalled();
      expect(mockRoll.toMessage).toHaveBeenCalledWith({
        speaker: { alias: 'Test Actor' },
        flavor: 'Might Roll'
      });
    });

    it('should handle missing ability gracefully', async () => {
      // Setup button with non-existent ability
      mockButton.dataset.ability = 'nonexistent';
      
      const { createAvantActorSheet } = await import('../../../scripts/sheets/actor-sheet.js');
      const AvantActorSheet = createAvantActorSheet();
      
      // Execute the ability roll
      await AvantActorSheet._onRollAbility.call(actorSheet, mockEvent, mockButton);
      
      // Verify error handling
      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to roll nonexistent')
      );
    });

    it('should handle missing dataset gracefully', async () => {
      // Setup button without ability data
      mockButton.dataset = {};
      
      const { createAvantActorSheet } = await import('../../../scripts/sheets/actor-sheet.js');
      const AvantActorSheet = createAvantActorSheet();
      
      // Execute the ability roll
      await AvantActorSheet._onRollAbility.call(actorSheet, mockEvent, mockButton);
      
      // Verify no roll was attempted
      expect(mockRoll.evaluate).not.toHaveBeenCalled();
      expect(globalThis.logger.warn).toHaveBeenCalledWith(
        'AvantActorSheet | No ability specified for roll'
      );
    });
  });

  describe('Skill Roll Integration', () => {
    it('should successfully roll skills using the role utility framework', async () => {
      // Setup button with skill data
      mockButton.dataset.skill = 'athletics';
      
      const { createAvantActorSheet } = await import('../../../scripts/sheets/actor-sheet.js');
      const AvantActorSheet = createAvantActorSheet();
      
      // Execute the skill roll
      await AvantActorSheet._onRollSkill.call(actorSheet, mockEvent, mockButton);
      
      // Verify the roll was created and executed
      expect(mockRoll.evaluate).toHaveBeenCalled();
      expect(mockRoll.toMessage).toHaveBeenCalledWith({
        speaker: { alias: 'Test Actor' },
        flavor: 'Athletics Skill Roll'
      });
    });

    it('should handle missing skill gracefully', async () => {
      // Setup button with non-existent skill
      mockButton.dataset.skill = 'nonexistent';
      
      const { createAvantActorSheet } = await import('../../../scripts/sheets/actor-sheet.js');
      const AvantActorSheet = createAvantActorSheet();
      
      // Execute the skill roll
      await AvantActorSheet._onRollSkill.call(actorSheet, mockEvent, mockButton);
      
      // Verify error handling
      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to roll nonexistent')
      );
    });

    it('should handle missing dataset gracefully', async () => {
      // Setup button without skill data
      mockButton.dataset = {};
      
      const { createAvantActorSheet } = await import('../../../scripts/sheets/actor-sheet.js');
      const AvantActorSheet = createAvantActorSheet();
      
      // Execute the skill roll
      await AvantActorSheet._onRollSkill.call(actorSheet, mockEvent, mockButton);
      
      // Verify no roll was attempted
      expect(mockRoll.evaluate).not.toHaveBeenCalled();
      expect(globalThis.logger.warn).toHaveBeenCalledWith(
        'AvantActorSheet | No skill specified for roll'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle roll evaluation errors gracefully', async () => {
      // Setup button with valid ability
      mockButton.dataset.ability = 'might';
      
      // Make roll evaluation throw an error
      mockRoll.evaluate.mockRejectedValue(new Error('Roll evaluation failed'));
      
      const { createAvantActorSheet } = await import('../../../scripts/sheets/actor-sheet.js');
      const AvantActorSheet = createAvantActorSheet();
      
      // Execute the ability roll
      await AvantActorSheet._onRollAbility.call(actorSheet, mockEvent, mockButton);
      
      // Verify error was logged and notification shown
      expect(globalThis.logger.error).toHaveBeenCalledWith(
        'AvantActorSheet | Error rolling ability:',
        expect.any(Error)
      );
      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to roll might')
      );
    });

    it('should handle chat message posting errors gracefully', async () => {
      // Setup button with valid skill
      mockButton.dataset.skill = 'athletics';
      
      // Make chat message posting throw an error
      mockRoll.toMessage.mockRejectedValue(new Error('Chat posting failed'));
      
      const { createAvantActorSheet } = await import('../../../scripts/sheets/actor-sheet.js');
      const AvantActorSheet = createAvantActorSheet();
      
      // Execute the skill roll
      await AvantActorSheet._onRollSkill.call(actorSheet, mockEvent, mockButton);
      
      // Verify error was logged and notification shown
      expect(globalThis.logger.error).toHaveBeenCalledWith(
        'AvantActorSheet | Error rolling skill:',
        expect.any(Error)
      );
      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to roll athletics')
      );
    });
  });

  describe('Roll Payload Validation', () => {
    it('should create valid roll payloads for abilities', async () => {
      // Import the role utility to test payload creation directly
      const { buildAbilityRoll } = await import('../../../scripts/logic/rolls-utils.js');
      
      // Create a roll payload for might ability
      const payload = buildAbilityRoll('might', mockActor);
      
      // Verify payload structure
      expect(payload.formula).toBe('2d10 + 5');
      expect(payload.tooltip).toBe('2d10 +5 (Ability)');
      expect(payload.total).toBe(5);
      expect(payload.baseDice).toBe('2d10');
      expect(payload.modifiers).toEqual([
        { label: 'Ability', value: 5 }
      ]);
      expect(typeof payload.sendToChat).toBe('function');
      expect(typeof payload.createRoll).toBe('function');
    });

    it('should create valid roll payloads for skills', async () => {
      // Import the role utility to test payload creation directly
      const { buildSkillRoll } = await import('../../../scripts/logic/rolls-utils.js');
      
      // Create a roll payload for athletics skill
      const payload = buildSkillRoll('athletics', mockActor);
      
      // Verify payload structure
      expect(payload.formula).toBe('2d10 + 7');
      expect(payload.tooltip).toBe('2d10 +7 (Skill)');
      expect(payload.total).toBe(7);
      expect(payload.baseDice).toBe('2d10');
      expect(payload.modifiers).toEqual([
        { label: 'Skill', value: 7 }
      ]);
      expect(typeof payload.sendToChat).toBe('function');
      expect(typeof payload.createRoll).toBe('function');
    });
  });

  describe('Performance Integration', () => {
    it('should execute ability rolls within performance requirements', async () => {
      mockButton.dataset.ability = 'might';
      
      const { createAvantActorSheet } = await import('../../../scripts/sheets/actor-sheet.js');
      const AvantActorSheet = createAvantActorSheet();
      
      // Measure execution time
      const start = performance.now();
      await AvantActorSheet._onRollAbility.call(actorSheet, mockEvent, mockButton);
      const end = performance.now();
      
      // Verify performance (should be much faster than 5ms for the integration)
      expect(end - start).toBeLessThan(5);
    });

    it('should execute skill rolls within performance requirements', async () => {
      mockButton.dataset.skill = 'athletics';
      
      const { createAvantActorSheet } = await import('../../../scripts/sheets/actor-sheet.js');
      const AvantActorSheet = createAvantActorSheet();
      
      // Measure execution time
      const start = performance.now();
      await AvantActorSheet._onRollSkill.call(actorSheet, mockEvent, mockButton);
      const end = performance.now();
      
      // Verify performance (should be much faster than 5ms for the integration)
      expect(end - start).toBeLessThan(5);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing behavior for ability rolls', async () => {
      // Test that the new implementation produces the same results as the old one
      mockButton.dataset.ability = 'grace';
      
      const { createAvantActorSheet } = await import('../../../scripts/sheets/actor-sheet.js');
      const AvantActorSheet = createAvantActorSheet();
      
      // Execute the ability roll
      await AvantActorSheet._onRollAbility.call(actorSheet, mockEvent, mockButton);
      
      // Verify the roll was created with expected parameters
      expect(mockRoll.evaluate).toHaveBeenCalled();
      expect(mockRoll.toMessage).toHaveBeenCalledWith({
        speaker: { alias: 'Test Actor' },
        flavor: 'Grace Roll'
      });
    });

    it('should maintain existing behavior for skill rolls', async () => {
      // Test that the new implementation produces the same results as the old one
      mockButton.dataset.skill = 'stealth';
      
      const { createAvantActorSheet } = await import('../../../scripts/sheets/actor-sheet.js');
      const AvantActorSheet = createAvantActorSheet();
      
      // Execute the skill roll
      await AvantActorSheet._onRollSkill.call(actorSheet, mockEvent, mockButton);
      
      // Verify the roll was created with expected parameters
      expect(mockRoll.evaluate).toHaveBeenCalled();
      expect(mockRoll.toMessage).toHaveBeenCalledWith({
        speaker: { alias: 'Test Actor' },
        flavor: 'Stealth Skill Roll'
      });
    });
  });
});

describe('Roll Payload Chat Integration', () => {
  let mockRoll;
  let mockChatMessage;

  beforeEach(() => {
    // Setup mock Roll and ChatMessage
    mockRoll = {
      evaluate: vi.fn().mockResolvedValue(undefined),
      toMessage: vi.fn().mockResolvedValue(undefined),
      total: 15
    };

    mockChatMessage = {
      getSpeaker: vi.fn().mockReturnValue({ alias: 'Test Actor' })
    };

    // Setup FoundryVTT globals
    (globalThis as any).Roll = vi.fn(() => mockRoll);
    (globalThis as any).ChatMessage = mockChatMessage;
  });

  afterEach(() => {
    // Clean up globals
    delete (globalThis as any).Roll;
    delete (globalThis as any).ChatMessage;
    
    // Reset mocks
    vi.clearAllMocks();
  });

  it('should create and execute roll payloads correctly', async () => {
    const { buildRollPayload } = await import('../../../scripts/logic/rolls-utils.js');
    
    const modifiers = [
      { label: 'Ability', value: 3 },
      { label: 'Level', value: 2 }
    ];
    
    const payload = buildRollPayload('2d10', modifiers, {
      flavor: 'Test Roll',
      speaker: { alias: 'Test Actor' }
    });
    
    // Execute the roll
    await payload.sendToChat();
    
    // Verify Roll was created with correct formula
    expect((globalThis as any).Roll).toHaveBeenCalledWith('2d10 + 5', {});
    
    // Verify roll was evaluated
    expect(mockRoll.evaluate).toHaveBeenCalled();
    
    // Verify chat message was posted
    expect(mockRoll.toMessage).toHaveBeenCalledWith({
      flavor: 'Test Roll',
      speaker: { alias: 'Test Actor' }
    });
  });

  it('should handle chat posting errors with retry mechanism', async () => {
    const { buildRollPayload } = await import('../../../scripts/logic/rolls-utils.js');
    
    // Mock console.error to avoid test output pollution
    const originalConsoleError = console.error;
    console.error = vi.fn();
    
    // Make the first call fail, second succeed
    mockRoll.toMessage
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(undefined);
    
    const payload = buildRollPayload('2d10', [], {
      flavor: 'Test Roll'
    });
    
    // Execute the roll
    await payload.sendToChat();
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Avant VTT | Failed to post roll to chat:',
      expect.any(Error)
    );
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});