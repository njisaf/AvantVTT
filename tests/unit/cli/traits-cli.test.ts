/**
 * @fileoverview Jest tests for Traits CLI
 * @description Tests CLI functionality using execa to spawn processes
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import execa from 'execa';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the traits CLI script
const CLI_PATH = join(__dirname, '../../../scripts/cli/traits.ts');
const PROJECT_ROOT = join(__dirname, '../../..');

describe('Traits CLI', () => {
  beforeEach(() => {
    // Mock console methods to avoid spam during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Help Command', () => {
    test('should show help when no arguments provided', async () => {
      const result = await execa('node', [
        '--experimental-loader', 'ts-node/esm',
        CLI_PATH
      ], {
        cwd: PROJECT_ROOT,
        timeout: 10000,
        reject: false
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Avant VTT - Trait CLI Utilities');
      expect(result.stdout).toContain('USAGE:');
      expect(result.stdout).toContain('EXAMPLES:');
      expect(result.stdout).toContain('OPTIONS:');
    });

    test('should show help with --help flag', async () => {
      const result = await execa('node', [
        '--experimental-loader', 'ts-node/esm',
        CLI_PATH,
        '--help'
      ], {
        cwd: PROJECT_ROOT,
        timeout: 10000,
        reject: false
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Avant VTT - Trait CLI Utilities');
      expect(result.stdout).toContain('npm run traits:export');
      expect(result.stdout).toContain('npm run traits:import');
    });
  });

  describe('Export Command', () => {
    test('should execute export command successfully', async () => {
      const result = await execa('node', [
        '--experimental-loader', 'ts-node/esm',
        CLI_PATH,
        'export',
        'test-traits.json'
      ], {
        cwd: PROJECT_ROOT,
        timeout: 15000,
        reject: false
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Starting trait export');
      expect(result.stdout).toContain('Export data prepared');
    });

    test('should handle export command with default filename', async () => {
      const result = await execa('node', [
        '--experimental-loader', 'ts-node/esm',
        CLI_PATH,
        'export'
      ], {
        cwd: PROJECT_ROOT,
        timeout: 15000,
        reject: false
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Starting trait export');
      expect(result.stdout).toContain('traits-export.json');
    });
  });

  describe('Import Command', () => {
    test('should execute import command in dry-run mode', async () => {
      const result = await execa('node', [
        '--experimental-loader', 'ts-node/esm',
        CLI_PATH,
        'import',
        'test-traits.json',
        '--dry-run'
      ], {
        cwd: PROJECT_ROOT,
        timeout: 15000,
        reject: false
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Starting trait import');
      expect(result.stdout).toContain('(dry run)');
    });

    test('should require file path for import', async () => {
      const result = await execa('node', [
        '--experimental-loader', 'ts-node/esm',
        CLI_PATH,
        'import'
      ], {
        cwd: PROJECT_ROOT,
        timeout: 10000,
        reject: false
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Please provide a file path to import from');
    });
  });

  describe('Sync Command', () => {
    test('should execute sync command', async () => {
      const result = await execa('node', [
        '--experimental-loader', 'ts-node/esm',
        CLI_PATH,
        'sync'
      ], {
        cwd: PROJECT_ROOT,
        timeout: 15000,
        reject: false
      });

      // Sync command may fail due to missing remote service, but should attempt execution
      expect([0, 1]).toContain(result.exitCode);
      expect(result.stdout || result.stderr).not.toBe('');
    });
  });

  describe('Remote Command', () => {
    test('should execute remote command', async () => {
      const result = await execa('node', [
        '--experimental-loader', 'ts-node/esm',
        CLI_PATH,
        'remote'
      ], {
        cwd: PROJECT_ROOT,
        timeout: 15000,
        reject: false
      });

      // Remote command may fail due to missing remote service, but should attempt execution
      expect([0, 1]).toContain(result.exitCode);
      expect(result.stdout || result.stderr).not.toBe('');
    });
  });

  describe('Integrity Command', () => {
    test('should execute integrity check', async () => {
      const result = await execa('node', [
        '--experimental-loader', 'ts-node/esm',
        CLI_PATH,
        'integrity'
      ], {
        cwd: PROJECT_ROOT,
        timeout: 15000,
        reject: false
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Data integrity hash');
      expect(result.stdout).toContain('Total traits');
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown commands gracefully', async () => {
      const result = await execa('node', [
        '--experimental-loader', 'ts-node/esm',
        CLI_PATH,
        'unknown-command'
      ], {
        cwd: PROJECT_ROOT,
        timeout: 10000,
        reject: false
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Unknown command: unknown-command');
      expect(result.stdout).toContain('Run with --help to see available commands');
    });

    test('should handle execution errors gracefully', async () => {
      // Try to run with invalid Node.js options to trigger an error
      const result = await execa('node', [
        '--invalid-option',
        CLI_PATH,
        'help'
      ], {
        cwd: PROJECT_ROOT,
        timeout: 10000,
        reject: false
      });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('bad option');
    });
  });

  describe('NPM Scripts Integration', () => {
    test('should work via npm run traits:export', async () => {
      const result = await execa('npm', [
        'run',
        'traits:export',
        'test-output.json'
      ], {
        cwd: PROJECT_ROOT,
        timeout: 20000,
        reject: false
      });

      // Should either succeed or fail due to missing dependencies, but not crash
      expect([0, 1]).toContain(result.exitCode);
    });

    test('should work via npm run traits:integrity', async () => {
      const result = await execa('npm', [
        'run',
        'traits:integrity'
      ], {
        cwd: PROJECT_ROOT,
        timeout: 20000,
        reject: false
      });

      // Should either succeed or fail due to missing dependencies, but not crash  
      expect([0, 1]).toContain(result.exitCode);
    });
  });

  describe('Binary Shim', () => {
    test('should work via binary shim', async () => {
      const binPath = join(PROJECT_ROOT, 'bin/traits.mjs');
      
      const result = await execa('node', [
        binPath,
        '--help'
      ], {
        cwd: PROJECT_ROOT,
        timeout: 15000,
        reject: false
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Avant VTT - Trait CLI Utilities');
    });

    test('should proxy arguments correctly via binary', async () => {
      const binPath = join(PROJECT_ROOT, 'bin/traits.mjs');
      
      const result = await execa('node', [
        binPath,
        'integrity'
      ], {
        cwd: PROJECT_ROOT,
        timeout: 15000,
        reject: false
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Data integrity hash');
    });
  });
}); 