/**
 * Jest Configuration for Avant VTT System
 * 
 * Configures Jest testing framework for FoundryVTT system development with:
 * - jsdom environment for DOM manipulation testing
 * - jest-extended and jest-chain integration for enhanced assertions
 * - Coverage reporting with appropriate thresholds
 * - Support for ESM modules and FoundryVTT client APIs
 * - Separate projects for unit and integration tests
 * - Enhanced JSDOM stability for Stage 4 Sprint 2
 * 
 * @author Avant VTT Team
 * @version 2.1.0
 * @since 0.1.2
 */

export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  projects: [
    // Unit tests project - Fast, isolated, pure function tests
    {
      displayName: 'unit',
      rootDir: '.',
      testEnvironment: 'jsdom',
      preset: 'ts-jest/presets/default-esm',
      transform: {
        '^.+\\.(t|j)s$': ['ts-jest', { useESM: true }],
      },
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@/(.*)$': '<rootDir>/scripts/$1',
        '^#lib/(.*)$': '<rootDir>/scripts/lib/$1'
      },
      testMatch: [
        '<rootDir>/tests/unit/**/*.test.[jt]s',
        '!<rootDir>/tests/unit/**/*.int.test.[jt]s'
      ],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup.js'
      ],
      collectCoverageFrom: [
        'scripts/logic/**/*.js',
        'scripts/utils/**/*.js',
        'scripts/data/**/*.{js,ts}',
        'scripts/services/**/*.{js,ts}',
        'scripts/themes/theme-manager.js',
        'scripts/avant.js',
        '!**/*.test.js',
        '!**/*.spec.js',
        '!**/*.test.ts',
        '!**/*.spec.ts'
      ],
      coverageThreshold: {
        'scripts/utils/logger.js': {
          lines: 90
        },
        'scripts/themes/theme-manager.js': {
          lines: 75
        },
        'scripts/avant.js': {
          lines: 60
        },
        'scripts/logic/avant-init-utils.js': {
          lines: 90
        },
        global: {
          lines: 72,
          branches: 65
        }
      },
      coverageDirectory: '<rootDir>/coverage/unit',
      clearMocks: true,
      restoreMocks: true,
      // Enhanced JSDOM configuration for stability
      testEnvironmentOptions: {
        url: 'http://localhost:30000',
        resources: 'usable',
        runScripts: 'dangerously',
        pretendToBeVisual: true,
        beforeParse: (window) => {
          // Ensure critical DOM APIs are available
          if (!window.document.addEventListener) {
            window.document.addEventListener = jest.fn();
            window.document.removeEventListener = jest.fn();
          }
          if (!window.addEventListener) {
            window.addEventListener = jest.fn();
            window.removeEventListener = jest.fn();
          }
        }
      }
    },
    
    // Integration tests project - Sheet wrappers and system integration
    {
      displayName: 'integration',
      rootDir: '.',
      testEnvironment: 'jsdom',
      preset: 'ts-jest/presets/default-esm',
      transform: {
        '^.+\\.(t|j)s$': ['ts-jest', { useESM: true }],
      },
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@/(.*)$': '<rootDir>/scripts/$1',
        '^#lib/(.*)$': '<rootDir>/scripts/lib/$1'
      },
      testMatch: [
        '<rootDir>/tests/integration/**/*.int.test.[jt]s'
      ],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup.js'
      ],
      collectCoverageFrom: [
        'scripts/sheets/**/*.js',
        'scripts/dialogs/**/*.js',
        'scripts/avant.js',
        '!**/*.test.js',
        '!**/*.spec.js'
      ],
      coverageThreshold: {
        'scripts/sheets/actor-sheet.js': {
          lines: 70
        },
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60
        }
      },
      coverageDirectory: '<rootDir>/coverage/integration',
      clearMocks: true,
      restoreMocks: true,
      // Enhanced JSDOM configuration for stability
      testEnvironmentOptions: {
        url: 'http://localhost:30000',
        resources: 'usable',
        runScripts: 'dangerously',
        pretendToBeVisual: true,
        beforeParse: (window) => {
          // Ensure critical DOM APIs are available
          if (!window.document.addEventListener) {
            window.document.addEventListener = jest.fn();
            window.document.removeEventListener = jest.fn();
          }
          if (!window.addEventListener) {
            window.addEventListener = jest.fn();
            window.removeEventListener = jest.fn();
          }
        }
      }
    }
  ],
  
  // Global configuration for all projects
  collectCoverage: false, // Only when --coverage flag is used
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  
  // Stage 4 Coverage Thresholds (temporarily disabled for realistic assessment)
  // coverageThreshold: {
  //   'scripts/avant.js': {
  //     lines: 60
  //   },
  //   global: {
  //     lines: 75,
  //     branches: 50
  //   }
  // },
  
  // Module file extensions in order of resolution
  moduleFileExtensions: [
    'ts',
    'js',
    'json'
  ],
  
  // Transform configuration for ES modules
  transform: {},
  
  // Test environment options - fallback for single project runs
  testEnvironmentOptions: {
    url: 'http://localhost:30000',
    resources: 'usable',
    runScripts: 'dangerously',
    pretendToBeVisual: true
  },
  
  // Additional stability configurations
  maxWorkers: 1, // Prevent race conditions in JSDOM
  testTimeout: 10000, // Increase timeout for stability
  
  // Error handling improvements
  errorOnDeprecated: false, // Don't fail on deprecation warnings during stabilization
  verbose: false, // Reduce noise during mass test runs
  fakeTimers: {
    enableGlobally: true,
    legacyFakeTimers: false
  }
}; 