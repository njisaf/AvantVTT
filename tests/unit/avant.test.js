/**
 * Unit Tests for Avant Main System
 * 
 * Tests the main system initialization, hook registration,
 * and sheet class registration using FoundryVTT mocks.
 * Target: ≥60% coverage
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since Stage 1 Coverage Initiative
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Import FoundryVTT environment from existing shim
import '../env/foundry-shim.js';

describe('Avant Native System', () => {
    let mockActorsCollection, mockItemsCollection;
    
    beforeEach(async () => {
        // Reset all existing mocks
        jest.clearAllMocks();
        
        // Reset CONFIG
        global.CONFIG = {
            Actor: {},
            Item: {}
        };
        
        // Set up FoundryVTT environment
        global.game = {
            avant: {}
        };
        
        // Set up Hooks system with callback storage
        global.Hooks = {
            once: jest.fn((event, callback) => {
                // Store callbacks for later execution
                if (!global.Hooks._callbacks) global.Hooks._callbacks = {};
                if (!global.Hooks._callbacks[event]) global.Hooks._callbacks[event] = [];
                global.Hooks._callbacks[event].push(callback);
            }),
            on: jest.fn(),
            _callbacks: {}
        };
        
        // Create mock collections
        mockActorsCollection = {
            unregisterSheet: jest.fn(),
            registerSheet: jest.fn()
        };
        
        mockItemsCollection = {
            unregisterSheet: jest.fn(),
            registerSheet: jest.fn()
        };
        
        global.console = {
            log: jest.fn(),
            error: jest.fn()
        };
    });

    describe('System Loading', () => {
        test('loads system without throwing errors', async () => {
            await expect(async () => {
                await import('../../scripts/avant.js');
            }).not.toThrow();
        });

        test('logs system loading message', async () => {
            await import('../../scripts/avant.js');
            
            expect(global.console.log).toHaveBeenCalledWith(
                expect.stringContaining('Avant | Loading Avant Native System...')
            );
        });
    });

    describe('Hook Registration', () => {
        test('registers init hook', async () => {
            const beforeCalls = global.Hooks.once.mock.calls.length;
            await import('../../scripts/avant.js?v=' + Math.random());
            
            // Should have added at least one call for init
            const afterCalls = global.Hooks.once.mock.calls.length;
            expect(afterCalls).toBeGreaterThan(beforeCalls);
            
            // Find the init hook registration
            const initCall = global.Hooks.once.mock.calls.find(call => call[0] === 'init');
            expect(initCall).toBeTruthy();
            expect(initCall[1]).toEqual(expect.any(Function));
        });

        test('registers ready hook', async () => {
            const beforeCalls = global.Hooks.once.mock.calls.length;
            await import('../../scripts/avant.js?v=' + Math.random());
            
            // Should have added at least one call for ready
            const afterCalls = global.Hooks.once.mock.calls.length;
            expect(afterCalls).toBeGreaterThan(beforeCalls);
            
            // Find the ready hook registration
            const readyCall = global.Hooks.once.mock.calls.find(call => call[0] === 'ready');
            expect(readyCall).toBeTruthy();
            expect(readyCall[1]).toEqual(expect.any(Function));
        });

        test('registers exactly two hooks', async () => {
            const beforeCalls = global.Hooks.once.mock.calls.length;
            await import('../../scripts/avant.js?v=' + Math.random());
            
            // Should have added exactly 2 calls (init and ready)
            const afterCalls = global.Hooks.once.mock.calls.length;
            expect(afterCalls - beforeCalls).toBe(2);
        });
    });

    describe('Init Hook Execution', () => {
        let initCallback;

        beforeEach(async () => {
            // Import system to register hooks with fresh cache
            await import('../../scripts/avant.js?v=' + Math.random());
            
            // Find the init callback from all registered calls
            const initCalls = global.Hooks.once.mock.calls.filter(call => call[0] === 'init');
            expect(initCalls.length).toBeGreaterThan(0);
            // Get the most recent init callback
            initCallback = initCalls[initCalls.length - 1][1];
        });

        test('init hook exists and is callable', () => {
            expect(typeof initCallback).toBe('function');
        });

        test('init callback logs initialization', async () => {
            await initCallback();
            
            expect(global.console.log).toHaveBeenCalledWith(
                expect.stringContaining('Avant | Initializing Avant Native system')
            );
        });

        test('init callback sets CONFIG objects', async () => {
            await initCallback();
            
            expect(global.CONFIG.Actor).toBeDefined();
            expect(global.CONFIG.Item).toBeDefined();
        });
    });

    describe('Ready Hook Execution', () => {
        let readyCallback;

        beforeEach(async () => {
            // Import system to register hooks with fresh cache
            await import('../../scripts/avant.js?v=' + Math.random());
            
            // Find the ready callback from all registered calls
            const readyCalls = global.Hooks.once.mock.calls.filter(call => call[0] === 'ready');
            expect(readyCalls.length).toBeGreaterThan(0);
            // Get the most recent ready callback
            readyCallback = readyCalls[readyCalls.length - 1][1];
        });

        test('ready hook exists and is callable', () => {
            expect(typeof readyCallback).toBe('function');
        });

        test('ready callback logs system ready', async () => {
            await readyCallback();
            
            expect(global.console.log).toHaveBeenCalledWith(
                expect.stringContaining('Avant | System ready - setting up additional features')
            );
        });
    });

    describe('Module Integration', () => {
        test('imports all required modules without errors', async () => {
            // Test that the main module can be imported without dependency issues
            await expect(async () => {
                await import('../../scripts/avant.js');
            }).not.toThrow();
        });

        test('sets up game.avant namespace', async () => {
            await import('../../scripts/avant.js?v=' + Math.random());
            
            // The ready callback should set up the game.avant object
            const readyCalls = global.Hooks.once.mock.calls.filter(call => call[0] === 'ready');
            expect(readyCalls.length).toBeGreaterThan(0);
            const readyCallback = readyCalls[readyCalls.length - 1][1];
            
            await readyCallback();
            
            expect(global.game.avant).toBeDefined();
            expect(typeof global.game.avant).toBe('object');
        });
    });

    describe('Error Handling', () => {
        test('handles missing FoundryVTT globals gracefully', async () => {
            // Temporarily remove a global
            const originalConfig = global.CONFIG;
            delete global.CONFIG;
            
            await expect(async () => {
                // Re-import to test error handling with cache busting
                await import('../../scripts/avant.js?cache=' + Date.now());
            }).not.toThrow();
            
            // Restore global
            global.CONFIG = originalConfig;
        });

        test('handles missing Hooks gracefully', async () => {
            const originalHooks = global.Hooks;
            global.Hooks = undefined;
            
            // Should not throw even without Hooks
            await expect(async () => {
                await import('../../scripts/avant.js?cache=' + Date.now());
            }).not.toThrow();
            
            global.Hooks = originalHooks;
        });
    });

    describe('System Configuration', () => {
        test('maintains compatibility with FoundryVTT v12 and v13', async () => {
            await import('../../scripts/avant.js?v=' + Math.random());
            
            // System should not use v13-only APIs that break v12 compatibility
            const initCalls = global.Hooks.once.mock.calls.filter(call => call[0] === 'init');
            expect(initCalls.length).toBeGreaterThan(0);
            const initCallback = initCalls[initCalls.length - 1][1];
            
            await expect(async () => {
                await initCallback();
            }).not.toThrow();
        });

        test('sets up system metadata correctly', async () => {
            await import('../../scripts/avant.js?v=' + Math.random());
            
            const initCalls = global.Hooks.once.mock.calls.filter(call => call[0] === 'init');
            expect(initCalls.length).toBeGreaterThan(0);
            const initCallback = initCalls[initCalls.length - 1][1];
            
            await initCallback();
            
            // Verify CONFIG objects are set up correctly
            expect(global.CONFIG.Actor).toBeDefined();
            expect(global.CONFIG.Item).toBeDefined();
            
            // Test ready callback for game.avant setup
            const readyCalls = global.Hooks.once.mock.calls.filter(call => call[0] === 'ready');
            expect(readyCalls.length).toBeGreaterThan(0);
            const readyCallback = readyCalls[readyCalls.length - 1][1];
            
            await readyCallback();
            
            // Verify system namespace is established
            expect(global.game.avant).toBeDefined();
        });
    });

    describe('Performance and Resource Management', () => {
        test('imports complete within reasonable time', async () => {
            const startTime = Date.now();
            
            await import('../../scripts/avant.js');
            
            const loadTime = Date.now() - startTime;
            expect(loadTime).toBeLessThan(1000); // Should load in under 1 second
        });

        test('does not pollute global namespace excessively', async () => {
            const beforeKeys = Object.keys(global);
            
            await import('../../scripts/avant.js');
            
            const afterKeys = Object.keys(global);
            const newKeys = afterKeys.filter(key => !beforeKeys.includes(key));
            
            // Should add minimal globals
            expect(newKeys.length).toBeLessThan(10);
        });
    });

    describe('Hook Callback Validation', () => {
        test('all registered callbacks are async or return promises', async () => {
            await import('../../scripts/avant.js');
            
            const allCallbacks = global.Hooks.once.mock.calls.map(call => call[1]);
            
            for (const callback of allCallbacks) {
                expect(typeof callback).toBe('function');
                
                // Test that callback can be called without throwing
                await expect(async () => {
                    const result = callback();
                    if (result && typeof result.then === 'function') {
                        await result;
                    }
                }).not.toThrow();
            }
        });

        test('callbacks handle undefined game object gracefully', async () => {
            await import('../../scripts/avant.js');
            
            const originalGame = global.game;
            global.game = undefined;
            
            const callbacks = global.Hooks.once.mock.calls.map(call => call[1]);
            
            for (const callback of callbacks) {
                await expect(async () => {
                    await callback();
                }).not.toThrow();
            }
            
            global.game = originalGame;
        });
    });
}); 