#!/usr/bin/env node

/**
 * @fileoverview Trait CLI executable shim
 * @description Lightweight proxy to scripts/cli/traits.ts for npm exec usage
 * @author Avant VTT Team
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the project root directory (one level up from bin/)
const projectRoot = dirname(__dirname);

// Path to the TypeScript CLI file
const traitsCliPath = join(projectRoot, 'scripts', 'cli', 'traits.ts');

// Get command line arguments (skip node and script name)
const args = process.argv.slice(2);

// If no arguments provided, show help
if (args.length === 0) {
  args.push('--help');
}

// Spawn the TypeScript CLI with ts-node
const child = spawn('node', [
  '--experimental-loader', 'ts-node/esm',
  traitsCliPath,
  ...args
], {
  stdio: 'inherit',
  cwd: projectRoot
});

// Forward exit code
child.on('exit', (code) => {
  process.exit(code || 0);
});

// Handle errors
child.on('error', (error) => {
  console.error('❌ Failed to execute traits CLI:', error.message);
  process.exit(1);
}); 