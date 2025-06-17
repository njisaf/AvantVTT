/**
 * Jest Configuration for Avant VTT System
 * 
 * Configures Jest testing framework for FoundryVTT system development with:
 * - jsdom environment for DOM manipulation testing
 * - jest-extended and jest-chain integration for enhanced assertions
 * - Coverage reporting with appropriate thresholds
 * - Support for ESM modules and FoundryVTT client APIs
 * - Separate projects for unit and integration tests
 * 
 * @author Avant VTT Team
 * @version 2.0.0
 * @since 0.1.2
 */

export default {
  projects: [
    // Unit tests project - Fast, isolated, pure function tests
    {
      displayName: 'unit',
      rootDir: '.',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/tests/unit/**/*.test.js',
        '!<rootDir>/tests/unit/**/*.int.test.js'
      ],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup.js'
      ],
      collectCoverageFrom: [
        'scripts/logic/**/*.js',
        'scripts/utils/**/*.js',
        'scripts/data/**/*.js',
        '!**/*.test.js',
        '!**/*.spec.js'
      ],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      coverageDirectory: '<rootDir>/coverage/unit',
      clearMocks: true,
      restoreMocks: true
    },
    
    // Integration tests project - Sheet wrappers and system integration
    {
      displayName: 'integration',
      rootDir: '.',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/tests/integration/**/*.int.test.js'
      ],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup.js'
      ],
      collectCoverageFrom: [
        'scripts/sheets/**/*.js',
        'scripts/avant.js',
        '!**/*.test.js',
        '!**/*.spec.js'
      ],
      coverageThreshold: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60
        }
      },
      coverageDirectory: '<rootDir>/coverage/integration',
      clearMocks: true,
      restoreMocks: true
    }
  ],
  
  // Global configuration for all projects
  collectCoverage: false, // Only when --coverage flag is used
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  
  // Module file extensions in order of resolution
  moduleFileExtensions: [
    'js',
    'json'
  ],
  
  // Transform configuration for ES modules
  transform: {},
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:30000'
  }
}; 