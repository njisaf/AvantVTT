/**
 * @fileoverview Jest Setup for Integration Tests
 * @description Initializes FoundryVTT environment for integration testing
 * @version 2.0.0
 */

// Import the foundry shim to set up the global environment
import './foundry-shim.js';
import { logger } from '../../scripts/utils/logger.js';

// Additional setup for integration tests
beforeEach(() => {
    // Mock logger methods to prevent console spam in tests
    Object.keys(logger).forEach(key => {
        if (typeof logger[key] === 'function') {
            jest.spyOn(logger, key).mockImplementation(() => {});
        }
    });
    // Reset global state before each test
    global.game = {
        settings: {
            get: jest.fn((module, key) => {
                if (module === 'core' && key === 'rollMode') {
                    return 'publicroll';
                }
                return undefined;
            })
        }
    };

    global.ui = {
        notifications: {
            error: jest.fn(),
            warn: jest.fn(),
            info: jest.fn()
        }
    };

    global.ChatMessage = {
        getSpeaker: jest.fn(() => ({ alias: 'Test Actor' }))
    };

    global.Roll = jest.fn().mockImplementation((formula, data) => ({
        formula,
        data,
        evaluate: jest.fn(),
        toMessage: jest.fn()
    }));

    global.foundry = {
        utils: {
            mergeObject: jest.fn((a, b) => ({ ...a, ...b })),
            flattenObject: jest.fn(obj => obj)
        }
    };

    global.CompatibilityUtils = {
        safeActivateListeners: jest.fn(),
        normalizeHtmlForListeners: jest.fn(html => html),
        log: jest.fn(),
        getActorSheetClass: jest.fn(() => class MockActorSheet {
            static get defaultOptions() { return {}; }
            get isEditable() { return true; }
        }),
        getItemSheetClass: jest.fn(() => class MockItemSheet {
            static get defaultOptions() { return {}; }
            get isEditable() { return true; }
        })
    };
});

afterEach(() => {
    // Clean up after each test - use jest's built-in clearAllMocks if available
    if (typeof jest !== 'undefined' && jest.clearAllMocks) {
        jest.clearAllMocks();
    }
}); 