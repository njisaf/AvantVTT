/**
 * Unit Tests for Logger Utility
 * 
 * Tests the lightweight console wrapper structure and basic functionality.
 * Since the logger uses arrow functions with direct console references,
 * we focus on testing the API surface and basic behavior.
 * Target: ≥90% coverage
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since Stage 1 Coverage Initiative
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Import logger before any mocking happens
import { logger } from '../../../scripts/utils/logger.js';

describe('Logger Utility', () => {
    let originalConsole;
    
    beforeEach(() => {
        // Backup original console methods
        originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug
        };
        
        // Replace with mock implementations
        console.log = jest.fn();
        console.info = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();
        console.debug = jest.fn();
        
        // Restore original logger functionality (override global setup mocking)
        logger.log.mockRestore?.();
        logger.info.mockRestore?.();
        logger.warn.mockRestore?.();
        logger.error.mockRestore?.();
        logger.debug.mockRestore?.();
    });
    
    afterEach(() => {
        // Restore original console methods
        console.log = originalConsole.log;
        console.info = originalConsole.info;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
        console.debug = originalConsole.debug;
    });

    describe('log method', () => {
        test('is a function that calls console.log', () => {
            expect(typeof logger.log).toBe('function');
            
            logger.log('Test log message');
            
            expect(console.log).toHaveBeenCalledWith('Test log message');
            expect(console.log).toHaveBeenCalledTimes(1);
        });

        test('forwards multiple arguments to console.log', () => {
            const arg1 = 'Test message';
            const arg2 = { data: 'test' };
            const arg3 = 42;
            
            logger.log(arg1, arg2, arg3);
            
            expect(console.log).toHaveBeenCalledWith(arg1, arg2, arg3);
        });

        test('handles no arguments', () => {
            logger.log();
            
            expect(console.log).toHaveBeenCalledWith();
        });
    });

    describe('info method', () => {
        test('is a function that calls console.info', () => {
            expect(typeof logger.info).toBe('function');
            
            logger.info('Test info message');
            
            expect(console.info).toHaveBeenCalledWith('Test info message');
        });

        test('forwards multiple arguments to console.info', () => {
            const arg1 = 'Info message';
            const arg2 = { level: 'info' };
            
            logger.info(arg1, arg2);
            
            expect(console.info).toHaveBeenCalledWith(arg1, arg2);
        });

        test('only calls console.info, not other methods', () => {
            logger.info('Test message');
            
            expect(console.info).toHaveBeenCalled();
            expect(console.log).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
            expect(console.debug).not.toHaveBeenCalled();
        });
    });

    describe('warn method', () => {
        test('is a function that calls console.warn', () => {
            expect(typeof logger.warn).toBe('function');
            
            logger.warn('Test warning message');
            
            expect(console.warn).toHaveBeenCalledWith('Test warning message');
        });

        test('forwards multiple arguments to console.warn', () => {
            const arg1 = 'Warning:';
            const arg2 = 'Something went wrong';
            const arg3 = { code: 'WARN_001' };
            
            logger.warn(arg1, arg2, arg3);
            
            expect(console.warn).toHaveBeenCalledWith(arg1, arg2, arg3);
        });

        test('only calls console.warn, not other methods', () => {
            logger.warn('Test warning');
            
            expect(console.warn).toHaveBeenCalled();
            expect(console.log).not.toHaveBeenCalled();
            expect(console.info).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
            expect(console.debug).not.toHaveBeenCalled();
        });
    });

    describe('error method', () => {
        test('is a function that calls console.error', () => {
            expect(typeof logger.error).toBe('function');
            
            logger.error('Test error message');
            
            expect(console.error).toHaveBeenCalledWith('Test error message');
        });

        test('forwards multiple arguments to console.error', () => {
            const arg1 = 'Error:';
            const arg2 = new Error('Something failed');
            const arg3 = { stack: 'test stack' };
            
            logger.error(arg1, arg2, arg3);
            
            expect(console.error).toHaveBeenCalledWith(arg1, arg2, arg3);
        });

        test('handles Error objects properly', () => {
            const error = new Error('Test error');
            
            logger.error('Failed operation:', error);
            
            expect(console.error).toHaveBeenCalledWith('Failed operation:', error);
        });

        test('only calls console.error, not other methods', () => {
            logger.error('Test error');
            
            expect(console.error).toHaveBeenCalled();
            expect(console.log).not.toHaveBeenCalled();
            expect(console.info).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.debug).not.toHaveBeenCalled();
        });
    });

    describe('debug method', () => {
        test('is a function that calls console.debug', () => {
            expect(typeof logger.debug).toBe('function');
            
            logger.debug('Test debug message');
            
            expect(console.debug).toHaveBeenCalledWith('Test debug message');
        });

        test('forwards multiple arguments to console.debug', () => {
            const arg1 = 'Debug info:';
            const arg2 = { state: 'testing' };
            const arg3 = ['item1', 'item2'];
            
            logger.debug(arg1, arg2, arg3);
            
            expect(console.debug).toHaveBeenCalledWith(arg1, arg2, arg3);
        });

        test('only calls console.debug, not other methods', () => {
            logger.debug('Test debug');
            
            expect(console.debug).toHaveBeenCalled();
            expect(console.log).not.toHaveBeenCalled();
            expect(console.info).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
        });
    });

    describe('logger object structure', () => {
        test('exports all expected methods', () => {
            expect(typeof logger.log).toBe('function');
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.warn).toBe('function');
            expect(typeof logger.error).toBe('function');
            expect(typeof logger.debug).toBe('function');
        });

        test('methods are properly bound to logger object', () => {
            const { log, info, warn, error, debug } = logger;
            
            // Should still work when destructured
            log('test');
            info('test');
            warn('test');
            error('test');
            debug('test');
            
            expect(console.log).toHaveBeenCalledTimes(1);
            expect(console.info).toHaveBeenCalledTimes(1);
            expect(console.warn).toHaveBeenCalledTimes(1);
            expect(console.error).toHaveBeenCalledTimes(1);
            expect(console.debug).toHaveBeenCalledTimes(1);
        });

        test('logger object is immutable reference', () => {
            const originalLogger = logger;
            
            // Verify it's the same reference
            expect(logger).toBe(originalLogger);
            
            // And that methods work
            logger.log('test immutability');
            expect(console.log).toHaveBeenCalledWith('test immutability');
        });
    });

    describe('spying and mocking capabilities', () => {
        test('allows easy spying on logger methods for testing', () => {
            const loggerSpy = jest.spyOn(logger, 'log');
            
            logger.log('test spy');
            
            expect(loggerSpy).toHaveBeenCalledWith('test spy');
            expect(loggerSpy).toHaveBeenCalledTimes(1);
            
            loggerSpy.mockRestore();
        });

        test('supports mocking for different test scenarios', () => {
            const mockImplementation = jest.fn();
            const loggerSpy = jest.spyOn(logger, 'warn').mockImplementation(mockImplementation);
            
            logger.warn('mocked warning');
            
            expect(mockImplementation).toHaveBeenCalledWith('mocked warning');
            expect(console.warn).not.toHaveBeenCalled(); // Original was mocked
            
            loggerSpy.mockRestore();
        });
    });

    describe('edge cases and error handling', () => {
        test('handles undefined arguments gracefully', () => {
            logger.log(undefined);
            logger.info(undefined);
            logger.warn(undefined);
            logger.error(undefined);
            logger.debug(undefined);
            
            expect(console.log).toHaveBeenCalledWith(undefined);
            expect(console.info).toHaveBeenCalledWith(undefined);
            expect(console.warn).toHaveBeenCalledWith(undefined);
            expect(console.error).toHaveBeenCalledWith(undefined);
            expect(console.debug).toHaveBeenCalledWith(undefined);
        });

        test('handles null arguments gracefully', () => {
            logger.log(null);
            logger.info(null);
            logger.warn(null);
            logger.error(null);
            logger.debug(null);
            
            expect(console.log).toHaveBeenCalledWith(null);
            expect(console.info).toHaveBeenCalledWith(null);
            expect(console.warn).toHaveBeenCalledWith(null);
            expect(console.error).toHaveBeenCalledWith(null);
            expect(console.debug).toHaveBeenCalledWith(null);
        });

        test('handles complex object arguments', () => {
            const complexObject = {
                nested: {
                    deeply: {
                        property: 'value'
                    }
                },
                array: [1, 2, { inner: 'object' }],
                func: () => 'test'
            };
            
            logger.log('Complex object:', complexObject);
            
            expect(console.log).toHaveBeenCalledWith('Complex object:', complexObject);
        });
    });
}); 