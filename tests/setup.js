/**
 * Global Test Setup for Avant VTT System
 * 
 * This file is executed before each test file and configures:
 * - jest-extended for additional matchers
 * - jest-chain for fluent assertion chaining
 * - Basic FoundryVTT environment shimming
 * - Logger wrapper mocking for testability
 * - JSDOM environment stabilization
 * 
 * @author Avant VTT Team
 * @version 2.0.0
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

// Mock foundry.data.fields
if (typeof global.foundry === 'undefined') {
  global.foundry = {};
}
if (typeof global.foundry.data === 'undefined') {
  global.foundry.data = {};
}

const fields = {
    StringField: jest.fn().mockImplementation(options => ({ options })),
 NumberField: jest.fn().mockImplementation(options => ({ options })),
 BooleanField: jest.fn().mockImplementation(options => ({ options })),
 HTMLField: jest.fn().mockImplementation(options => ({ options })),
 ObjectField: jest.fn().mockImplementation(options => ({ options })),
 SchemaField: jest.fn().mockImplementation(fields => ({ fields })),
 ArrayField: jest.fn().mockImplementation(field => ({ field })),
};

global.foundry.data.fields = fields;

// Import logger for global mocking
import { logger } from '../scripts/utils/logger.js';

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

// Fix JSDOM environment issues - ensure document is properly initialized
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Ensure document has addEventListener method (JSDOM compatibility fix)
  if (!document.addEventListener) {
    document.addEventListener = jest.fn();
    document.removeEventListener = jest.fn();
  }
  
  // Ensure window has addEventListener method
  if (!window.addEventListener) {
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  }
  
  // Fix JSDOM window.document reference if broken
  if (typeof window.document === 'undefined') {
    Object.defineProperty(window, 'document', {
      value: document,
      writable: true,
      configurable: true
    });
  }
}

// Global setup for logger mocking
beforeEach(() => {
  // Mock all logger methods for clean test slate
  Object.keys(logger).forEach(methodName => {
    if (typeof logger[methodName] === 'function') {
      jest.spyOn(logger, methodName).mockImplementation(() => {});
    }
  });
}); 

// Global cleanup after each test to prevent DOM pollution and flakiness
afterEach(() => {
  // Clear DOM body to prevent cross-test pollution
  if (typeof document !== 'undefined' && document.body) {
    document.body.innerHTML = '';
  }
  
  // Clear any timers that might cause test interference
  jest.clearAllTimers();
  
  // Clear all mocks to prevent state leakage
  jest.clearAllMocks();
  
  // Reset any global state that might have been modified
  if (typeof window !== 'undefined') {
    // Clear any global event listeners that tests might have added
    if (window.removeEventListener && typeof window.removeEventListener === 'function') {
      ['load', 'DOMContentLoaded', 'resize', 'beforeunload'].forEach(eventType => {
        window.removeEventListener(eventType, jest.fn());
      });
    }
  }
});

// Global error handler to catch and log test environment issues
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
}); 