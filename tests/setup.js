/**
 * Global Test Setup for Avant VTT System
 * 
 * This file is executed before each test file and configures:
 * - jest-extended for additional matchers
 * - jest-chain for fluent assertion chaining
 * - Basic FoundryVTT environment shimming
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since 0.1.2
 */

// Import jest-extended for additional matchers like toBeArray(), toBeEmpty(), etc.
const { createRequire } = await import('module');
const require = createRequire(import.meta.url);
require('jest-extended');

// Import jest-chain for fluent assertion chaining
require('jest-chain');

// Import basic FoundryVTT shim
import './env/foundry-shim.js';

// Configure console settings for tests  
global.console = {
  ...console,
  // Suppress console.log during tests unless specifically testing console output
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
}; 