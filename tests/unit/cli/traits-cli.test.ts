/**
 * @fileoverview Jest tests for Traits CLI
 * @description Tests CLI functionality using execa to spawn processes
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { main as mainCLI } from '../../../scripts/cli/traits';
import type { TraitProvider } from '../../../scripts/services/trait-provider';
import type { Trait, FoundryTraitItem, TraitProviderResult } from '../../../scripts/types/domain/trait';

describe('Traits CLI Logic', () => {
  let mockTraitProvider: TraitProvider;
  let logSpy: any;
  let errorSpy: any;

  beforeEach(() => {
    // A more robust way to mock the provider to satisfy TypeScript
    mockTraitProvider = {
      getAll: jest.fn(),
      get: jest.fn(),
      createTrait: jest.fn(),
      updateTrait: jest.fn(),
      deleteTrait: jest.fn(),
    } as unknown as TraitProvider;

    (mockTraitProvider.getAll as jest.Mock).mockResolvedValue({
      success: true,
      data: [{ id: 'fire', name: 'Fire', color: '#F00', icon: 'fa-fire' }] as Trait[],
    });
    (mockTraitProvider.get as jest.Mock).mockResolvedValue({ success: true, data: null });
    (mockTraitProvider.createTrait as jest.Mock).mockResolvedValue({ success: true, data: {} as Trait });
    (mockTraitProvider.updateTrait as jest.Mock).mockResolvedValue({ success: true, data: {} as Trait });
    (mockTraitProvider.deleteTrait as jest.Mock).mockResolvedValue({ success: true });


    // Spy on console outputs
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const runCliWithArgs = async (args: string[]) => {
    const originalArgv = process.argv;
    try {
      process.argv = ['node', 'traits.ts', ...args];
      await mainCLI(mockTraitProvider);
    } finally {
      process.argv = originalArgv;
    }
  };

  describe('Help Command', () => {
    test('should show help with --help flag', async () => {
      await expect(runCliWithArgs(['--help'])).rejects.toThrow('process.exit called');
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('USAGE:'));
    });

    test('should show help with no arguments', async () => {
      await expect(runCliWithArgs([])).rejects.toThrow('process.exit called');
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