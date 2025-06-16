/**
 * Jest Configuration for Avant VTT System
 * 
 * Configures Jest testing framework for FoundryVTT system development with:
 * - jsdom environment for DOM manipulation testing
 * - jest-extended and jest-chain integration for enhanced assertions
 * - Coverage reporting with appropriate thresholds
 * - Support for ESM modules and FoundryVTT client APIs
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since 0.1.2
 */

export default {
  // Use avantVtt directory as root for all paths
  rootDir: '.',
  
  // Use jsdom environment to simulate browser DOM for FoundryVTT client testing
  testEnvironment: 'jsdom',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // Setup files executed before each test file
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  
  // Module file extensions in order of resolution
  moduleFileExtensions: [
    'js',
    'json'
  ],
  
  // Transform configuration for ES modules
  transform: {},
  
  // Coverage configuration
  collectCoverage: false, // Only when --coverage flag is used
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'scripts/**/*.js',
    '!scripts/**/*.test.js',
    '!scripts/**/*.spec.js',
    '!node_modules/**',
    '!coverage/**'
  ],
  
  // Coverage thresholds (will be tightened in later stages)
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:30000'
  },
  
  // Verbose output for detailed test results  
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true
}; 