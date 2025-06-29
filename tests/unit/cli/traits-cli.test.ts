/**
 * @fileoverview Jest tests for Traits CLI
 * @description Tests CLI functionality using execa to spawn processes
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { main as mainCLI } from '../../../scripts/cli/traits.ts';
import type { TraitProvider } from '../../../scripts/services/trait-provider.ts';

describe('Traits CLI Logic', () => {
  let mockTraitProvider: Partial<TraitProvider>;
  let logSpy: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]], any>;
  let errorSpy: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]], any>;
  let argvSpy: jest.SpyInstance<string[], [], any>;

  beforeEach(() => {
    // Mock the trait provider for controlled testing
    mockTraitProvider = {
      getAll: jest.fn().mockResolvedValue({
        success: true,
        data: [{ id: 'fire', name: 'Fire', color: '#F00', icon: 'fa-fire' }]
      }),
      // Add other methods with default mock implementations
      get: jest.fn().mockResolvedValue({ success: true, data: null }),
      createTrait: jest.fn().mockResolvedValue({ success: true }),
      updateTrait: jest.fn().mockResolvedValue({ success: true }),
      deleteTrait: jest.fn().mockResolvedValue({ success: true }),
    };

    // Spy on console outputs
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Spy on process.argv to simulate CLI arguments
    argvSpy = jest.spyOn(process, 'argv', 'get');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const runCliWithArgs = async (args: string[]) => {
    argvSpy.mockReturnValue(['node', 'traits.ts', ...args]);
    await mainCLI(mockTraitProvider as TraitProvider);
  };

  describe('Help Command', () => {
    test('should show help with --help flag', async () => {
      await runCliWithArgs(['--help']);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('USAGE:'));
    });

    test('should show help with no arguments', async () => {
      await runCliWithArgs([]);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('USAGE:'));
    });
  });

  describe('Export Command', () => {
    test('should execute export command successfully', async () => {
      await runCliWithArgs(['export']);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Successfully exported'));
    });
  });

  describe('Import Command', () => {
    test('should require a file path for import', async () => {
      await runCliWithArgs(['import']);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Please provide a file path'));
    });

    test('should handle file not found error gracefully', async () => {
      await runCliWithArgs(['import', 'nonexistent.json']);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Import failed'));
    });
  });
  
  describe('Integrity Command', () => {
    test('should execute integrity check', async () => {
        await runCliWithArgs(['integrity']);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Data integrity hash'));
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Total traits'));
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown commands gracefully', async () => {
      await runCliWithArgs(['unknown-command']);
      expect(errorSpy).toHaveBeenCalledWith('❌ Unknown command: unknown-command');
    });
  });
}); 