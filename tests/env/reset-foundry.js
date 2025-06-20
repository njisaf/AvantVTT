/**
 * Foundry Reset Helper
 * 
 * Provides utilities to reset FoundryVTT global state between tests
 * to prevent test interference and cross-contamination.
 */

/**
 * Resets FoundryVTT global state to clean baseline
 * Call this in afterEach() to ensure test isolation
 */
export function resetFoundryGlobals() {
    // Reset game object
    if (global.game) {
        global.game = {
            settings: {
                get: jest.fn(),
                set: jest.fn(),
                register: jest.fn()
            },
            users: {
                current: {
                    id: 'test-user-id',
                    name: 'Test User'
                }
            },
            i18n: {
                localize: jest.fn(key => key),
                format: jest.fn((key, data) => `${key}:${JSON.stringify(data)}`)
            },
            socket: {
                emit: jest.fn(),
                on: jest.fn()
            }
        };
    }

    // Reset Hooks system
    if (global.Hooks) {
        global.Hooks = {
            once: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
            call: jest.fn(),
            callAll: jest.fn()
        };
    }

    // Reset CONFIG
    if (global.CONFIG) {
        global.CONFIG = {
            AVANT: {
                themes: {},
                settings: {}
            }
        };
    }

    // Reset Actors registry
    if (global.Actors) {
        global.Actors = {
            registerSheet: jest.fn(),
            unregisterSheet: jest.fn()
        };
    }

    // Reset Items registry  
    if (global.Items) {
        global.Items = {
            registerSheet: jest.fn(),
            unregisterSheet: jest.fn()
        };
    }

    // Reset ChatMessage
    if (global.ChatMessage) {
        global.ChatMessage = {
            create: () => Promise.resolve({}),
            getSpeaker: () => ({ actor: 'test-actor' })
        };
    }

    // Reset Roll system
    if (global.Roll) {
        global.Roll = function(formula) {
            return {
                formula,
                total: 10,
                result: '10',
                toMessage: () => Promise.resolve({})
            };
        };
    }

    // Reset validation utilities if they exist
    if (global.ValidationUtils) {
        global.ValidationUtils = {
            validateActorData: () => ({ validated: true }),
            validateItemData: () => ({ validated: true })
        };
    }
}

/**
 * Resets DOM elements that may have been created by tests
 * Useful for theme manager tests that manipulate the DOM
 */
export function resetTestDOM() {
    // Remove any test elements (safely handle missing remove method)
    const testElements = document.querySelectorAll('.avant, .test-element, [data-testid]');
    testElements.forEach(el => {
        if (el && typeof el.remove === 'function') {
            el.remove();
        }
    });

    // Reset document body classes
    document.body.className = '';

    // Reset document head style elements (safely handle missing remove method)
    const testStyles = document.head.querySelectorAll('style[data-test]');
    testStyles.forEach(el => {
        if (el && typeof el.remove === 'function') {
            el.remove();
        }
    });
}

/**
 * Complete reset of all test state
 * Use this for comprehensive cleanup between test suites
 */
export function resetAllTestState() {
    resetFoundryGlobals();
    resetTestDOM();
    
    // Clear any timers that might be running
    jest.clearAllTimers();
    
    // Clear all mocks
    jest.clearAllMocks();
} 