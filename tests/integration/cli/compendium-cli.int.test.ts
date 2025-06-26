/**
 * @fileoverview Compendium CLI Integration Tests
 * @description Integration tests for the compendium CLI commands (diff, copy, list)
 * @version 2.0.0
 * @author Avant Development Team
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { diffCommand, copyCommand, listCommand, setupProgram } from '../../../scripts/cli/compendium';
import { CompendiumLocalService } from '../../../scripts/services/compendium-local-service';

// Mock console methods to capture output
let consoleLogOutput: string[] = [];
let consoleErrorOutput: string[] = [];
let processExitCode: number | undefined;

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalProcessExit = process.exit;

describe('Compendium CLI Integration Tests', () => {
  beforeEach(() => {
    // Reset output arrays
    consoleLogOutput = [];
    consoleErrorOutput = [];
    processExitCode = undefined;
    
    // Mock console methods
    console.log = jest.fn((...args: any[]) => {
      consoleLogOutput.push(args.join(' '));
    });
    
    console.error = jest.fn((...args: any[]) => {
      consoleErrorOutput.push(args.join(' '));
    });
    
    // Mock process.exit
    process.exit = jest.fn((code?: number) => {
      processExitCode = code || 0;
      throw new Error(`Process exit called with code ${code || 0}`);
    }) as any;
    
    // Mock FoundryVTT environment
    const mockDocs = [
      {
        _id: 'test-doc-1',
        name: 'Test Document 1',
        type: 'Item',
        toObject: jest.fn().mockReturnValue({
          _id: 'test-doc-1',
          name: 'Test Document 1',
          type: 'Item'
        })
      },
      {
        _id: 'test-doc-2',
        name: 'Test Document 2',
        type: 'Item',
        toObject: jest.fn().mockReturnValue({
          _id: 'test-doc-2',
          name: 'Test Document 2',
          type: 'Item'
        })
      }
    ];
    
    const mockPack1 = {
      title: 'Test Pack 1',
      documentName: 'Item',
      visible: true,
      getDocuments: jest.fn().mockResolvedValue(mockDocs)
    };
    
    const mockPack2 = {
      title: 'Test Pack 2',
      documentName: 'Item',
      visible: true,
      getDocuments: jest.fn().mockResolvedValue([]),
      documentClass: {
        createDocuments: jest.fn().mockResolvedValue([])
      }
    };
    
    const mockPacks = new Map([
      ['world.pack1', mockPack1],
      ['world.pack2', mockPack2]
    ]);
    
    const mockGame = {
      ready: true,
      packs: mockPacks
    };
    
    const mockHooks = {
      callAll: jest.fn()
    };
    
    Object.defineProperty(globalThis, 'game', {
      value: mockGame,
      configurable: true
    });
    
    Object.defineProperty(globalThis, 'Hooks', {
      value: mockHooks,
      configurable: true
    });
  });
  
  afterEach(() => {
    // Restore original methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
    
    // Clean up globals
    Object.defineProperty(globalThis, 'game', { value: undefined, configurable: true });
    Object.defineProperty(globalThis, 'Hooks', { value: undefined, configurable: true });
  });

  describe('CLI Program Setup', () => {
    test('should create CLI program with all commands', () => {
      const program = setupProgram();
      
      expect(program).toBeDefined();
      expect(program.name()).toBe('compendium');
      expect(program.description()).toBe('CLI tool for FoundryVTT compendium operations');
      expect(program.version()).toBe('2.0.0');
      
      // Commands should be registered
      const commands = program.commands;
      const commandNames = commands.map(cmd => cmd.name());
      
      expect(commandNames).toContain('diff');
      expect(commandNames).toContain('copy');
      expect(commandNames).toContain('list');
    });
  });

  describe('diff command', () => {
    test('should compare two packs and display results', async () => {
      const options = { json: false };
      
      try {
        await diffCommand('world.pack1', 'world.pack2', options);
      } catch (error) {
        // Expected due to process.exit mock
      }
      
      expect(processExitCode).toBe(0);
      expect(consoleLogOutput.some(line => line.includes('Comparing packs'))).toBe(true);
      expect(consoleLogOutput.some(line => line.includes('Compendium Comparison'))).toBe(true);
      expect(consoleLogOutput.some(line => line.includes('Added documents'))).toBe(true);
    });

    test('should output JSON format when --json flag is used', async () => {
      const options = { json: true };
      
      try {
        await diffCommand('world.pack1', 'world.pack2', options);
      } catch (error) {
        // Expected due to process.exit mock
      }
      
      expect(processExitCode).toBe(0);
      
      // Should contain JSON output
      const jsonOutput = consoleLogOutput.find(line => {
        try {
          JSON.parse(line);
          return true;
        } catch {
          return false;
        }
      });
      
      expect(jsonOutput).toBeDefined();
      
      if (jsonOutput) {
        const parsed = JSON.parse(jsonOutput);
        expect(parsed).toHaveProperty('srcId', 'world.pack1');
        expect(parsed).toHaveProperty('destId', 'world.pack2');
        expect(parsed).toHaveProperty('added');
        expect(parsed).toHaveProperty('removed');
        expect(parsed).toHaveProperty('changed');
      }
    });

    test('should handle errors gracefully', async () => {
      // Set up error condition
      Object.defineProperty(globalThis, 'game', { value: null, configurable: true });
      
      const options = { json: false };
      
      try {
        await diffCommand('invalid.pack1', 'invalid.pack2', options);
      } catch (error) {
        // Expected due to process.exit mock
      }
      
      expect(processExitCode).toBe(1);
      expect(consoleErrorOutput.some(line => line.includes('Error'))).toBe(true);
    });
  });

  describe('copy command', () => {
    test('should copy documents between packs', async () => {
      const options = { json: false };
      
      try {
        await copyCommand('world.pack1', 'world.pack2', options);
      } catch (error) {
        // Expected due to process.exit mock
      }
      
      expect(processExitCode).toBe(0);
      expect(consoleLogOutput.some(line => line.includes('Copying documents'))).toBe(true);
      expect(consoleLogOutput.some(line => line.includes('Documents copied successfully'))).toBe(true);
    });

    test('should apply filter when provided', async () => {
      const options = { 
        json: false,
        filter: 'name:/Test Document 1/'
      };
      
      try {
        await copyCommand('world.pack1', 'world.pack2', options);
      } catch (error) {
        // Expected due to process.exit mock
      }
      
      expect(processExitCode).toBe(0);
      expect(consoleLogOutput.some(line => line.includes('Using filter'))).toBe(true);
      expect(consoleLogOutput.some(line => line.includes('Filter applied'))).toBe(true);
    });

    test('should output JSON format for copy operations', async () => {
      const options = { json: true };
      
      try {
        await copyCommand('world.pack1', 'world.pack2', options);
      } catch (error) {
        // Expected due to process.exit mock
      }
      
      expect(processExitCode).toBe(0);
      
      const jsonOutput = consoleLogOutput.find(line => {
        try {
          const parsed = JSON.parse(line);
          return parsed.hasOwnProperty('success');
        } catch {
          return false;
        }
      });
      
      expect(jsonOutput).toBeDefined();
      
      if (jsonOutput) {
        const parsed = JSON.parse(jsonOutput);
        expect(parsed).toHaveProperty('success', true);
        expect(parsed).toHaveProperty('srcId', 'world.pack1');
        expect(parsed).toHaveProperty('destId', 'world.pack2');
      }
    });

    test('should handle copy errors with JSON output', async () => {
      // Set up error condition
      Object.defineProperty(globalThis, 'game', { value: null, configurable: true });
      
      const options = { json: true };
      
      try {
        await copyCommand('invalid.pack1', 'invalid.pack2', options);
      } catch (error) {
        // Expected due to process.exit mock
      }
      
      expect(processExitCode).toBe(1);
      
      const jsonOutput = consoleLogOutput.find(line => {
        try {
          const parsed = JSON.parse(line);
          return parsed.hasOwnProperty('success') && parsed.success === false;
        } catch {
          return false;
        }
      });
      
      expect(jsonOutput).toBeDefined();
    });
  });

  describe('list command', () => {
    test('should list all available compendium packs', async () => {
      const options = { json: false };
      
      try {
        await listCommand(options);
      } catch (error) {
        // Expected due to process.exit mock
      }
      
      expect(processExitCode).toBe(0);
      expect(consoleLogOutput.some(line => line.includes('Listing available compendium packs'))).toBe(true);
      expect(consoleLogOutput.some(line => line.includes('Found 2 compendium packs'))).toBe(true);
      expect(consoleLogOutput.some(line => line.includes('world.pack1'))).toBe(true);
      expect(consoleLogOutput.some(line => line.includes('world.pack2'))).toBe(true);
    });

    test('should output pack information in JSON format', async () => {
      const options = { json: true };
      
      try {
        await listCommand(options);
      } catch (error) {
        // Expected due to process.exit mock
      }
      
      expect(processExitCode).toBe(0);
      
      const jsonOutput = consoleLogOutput.find(line => {
        try {
          const parsed = JSON.parse(line);
          return parsed.hasOwnProperty('packs');
        } catch {
          return false;
        }
      });
      
      expect(jsonOutput).toBeDefined();
      
      if (jsonOutput) {
        const parsed = JSON.parse(jsonOutput);
        expect(parsed).toHaveProperty('packs');
        expect(Array.isArray(parsed.packs)).toBe(true);
        expect(parsed.packs.length).toBe(2);
        
        const pack1Info = parsed.packs.find((p: any) => p.id === 'world.pack1');
        expect(pack1Info).toBeDefined();
        expect(pack1Info).toHaveProperty('name', 'Test Pack 1');
        expect(pack1Info).toHaveProperty('type', 'Item');
        expect(pack1Info).toHaveProperty('documentCount', 2);
        expect(pack1Info).toHaveProperty('visible', true);
      }
    });

    test('should handle pack loading errors gracefully', async () => {
      // Mock a pack that throws an error
      const errorPack = {
        title: 'Error Pack',
        documentName: 'Item',
        visible: true,
        getDocuments: jest.fn().mockRejectedValue(new Error('Pack loading failed'))
      };
      
      const game = (globalThis as any).game;
      game.packs.set('world.errorpack', errorPack);
      
      const options = { json: false };
      
      try {
        await listCommand(options);
      } catch (error) {
        // Expected due to process.exit mock
      }
      
      expect(processExitCode).toBe(0);
      expect(consoleLogOutput.some(line => line.includes('world.errorpack'))).toBe(true);
      expect(consoleLogOutput.some(line => line.includes('Error loading'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should exit with code 1 when FoundryVTT is not available', async () => {
      Object.defineProperty(globalThis, 'game', { value: null, configurable: true });
      
      try {
        await diffCommand('pack1', 'pack2', { json: false });
      } catch (error) {
        // Expected due to process.exit mock
      }
      
      expect(processExitCode).toBe(1);
      expect(consoleErrorOutput.some(line => line.includes('FoundryVTT context'))).toBe(true);
    });

    test('should handle invalid filter patterns', async () => {
      const options = { 
        json: false,
        filter: 'invalid-filter-format'
      };
      
      try {
        await copyCommand('world.pack1', 'world.pack2', options);
      } catch (error) {
        // Expected due to process.exit mock
      }
      
      expect(processExitCode).toBe(1);
      expect(consoleErrorOutput.some(line => line.includes('Invalid filter format'))).toBe(true);
    });
  });

  describe('Performance Requirements', () => {
    test('should complete operations within reasonable time', async () => {
      const startTime = Date.now();
      
      try {
        await listCommand({ json: true });
      } catch (error) {
        // Expected due to process.exit mock
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 5 seconds (requirement from Stage 4)
      expect(duration).toBeLessThan(5000);
    });

    test('should handle large pack lists efficiently', async () => {
      // Add many mock packs to test performance
      const game = (globalThis as any).game;
      
      for (let i = 0; i < 50; i++) {
        const mockPack = {
          title: `Test Pack ${i}`,
          documentName: 'Item',
          visible: true,
          getDocuments: jest.fn().mockResolvedValue([])
        };
        game.packs.set(`world.pack${i}`, mockPack);
      }
      
      const startTime = Date.now();
      
      try {
        await listCommand({ json: true });
      } catch (error) {
        // Expected due to process.exit mock
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should still complete quickly even with many packs
      expect(duration).toBeLessThan(5000);
      expect(processExitCode).toBe(0);
    });
  });
}); 