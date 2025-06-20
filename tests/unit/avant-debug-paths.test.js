/**
 * Avant Debug Paths Unit Tests
 * 
 * Tests debug configuration setup with CONFIG and logger mocking
 * to exercise both true and false branches of setupConfigDebug.
 * Target: +6pp avant.js coverage
 * 
 * @author Avant VTT Team  
 * @version 1.0.0
 * @since Stage 7 Coverage Initiative
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { setupConfigDebug } from '../../scripts/logic/avant-init-utils.js';

describe('Avant Debug Configuration', () => {
    let mockConfig;
    let mockLogger;

    beforeEach(() => {
        // Mock CONFIG object
        mockConfig = {
            debug: {},
            logging: {}
        };

        // Mock logger object  
        mockLogger = {
            setLevel: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('Debug Mode Enabled', () => {
        test('setupConfigDebug with enableDebug:true sets debug flags', () => {
            const result = setupConfigDebug(mockConfig, { enableDebug: true });

            expect(result.success).toBe(true);
            expect(mockConfig.debug).toBe(true);
            expect(mockConfig.AVANT.debug).toBe(true);
        });

        test('setupConfigDebug with debug logLevel sets proper level', () => {
            const result = setupConfigDebug(mockConfig, { logLevel: 'debug' });

            expect(result.success).toBe(true);
            expect(mockConfig.logLevel).toBe('debug');
            expect(mockConfig.AVANT.logLevel).toBe('debug');
        });

        test('setupConfigDebug with enableTiming sets timing flag', () => {
            const result = setupConfigDebug(mockConfig, { enableTiming: true });

            expect(result.success).toBe(true);
            expect(mockConfig.time).toBe(true);
        });
    });

    describe('Debug Mode Disabled', () => {
        test('setupConfigDebug with enableDebug:false disables debug', () => {
            const result = setupConfigDebug(mockConfig, { enableDebug: false });

            expect(result.success).toBe(true);
            expect(mockConfig.debug).toBe(false);
            expect(mockConfig.AVANT.debug).toBe(false);
        });

        test('setupConfigDebug with info logLevel sets info level', () => {
            const result = setupConfigDebug(mockConfig, { logLevel: 'info' });

            expect(result.success).toBe(true);
            expect(mockConfig.logLevel).toBe('info');
            expect(mockConfig.AVANT.logLevel).toBe('info');
        });

        test('setupConfigDebug returns success message', () => {
            const result = setupConfigDebug(mockConfig, { enableDebug: false });

            expect(result.success).toBe(true);
            expect(result.message).toContain('Debug configuration applied successfully');
        });
    });

    describe('Error Handling', () => {
        test('handles missing CONFIG object gracefully', () => {
            expect(() => {
                setupConfigDebug(null, { enableDebug: true });
            }).toThrow('CONFIG object is required for debug setup');
        });

        test('handles invalid log level gracefully', () => {
            const result = setupConfigDebug(mockConfig, { logLevel: 'invalid' });

            expect(result.success).toBe(true);
            // Invalid log level should be ignored, function continues
            expect(result.appliedSettings).toBeDefined();
        });

        test('handles CONFIG modification errors', () => {
            // Make CONFIG immutable to trigger error
            Object.freeze(mockConfig);
            
            const result = setupConfigDebug(mockConfig, { enableDebug: true });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Cannot assign to read only property');
        });
    });
}); 