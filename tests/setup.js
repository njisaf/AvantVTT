/**
 * Global Test Setup for Avant VTT System
 * 
 * This file is executed before each test file and configures:
 * - jest-extended for additional matchers
 * - jest-chain for fluent assertion chaining
 * - Basic FoundryVTT environment shimming
 * - Proper Jest mocks for console functions
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since 0.1.2
 */

// Import jest-extended for additional matchers like toBeArray(), toBeEmpty(), etc.
import 'jest-extended/all';

// Import jest-chain for fluent assertion chaining
import 'jest-chain';

// Import basic FoundryVTT shim
import './env/foundry-shim.js';

// Import Jest for mock creation
import { jest } from '@jest/globals';

// Configure console settings for tests with proper Jest mocks
global.console = {
  ...console,
  // Create proper Jest mocks that can be tested with toHaveBeenCalled()
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}; 