/**
 * Service Dependency Configuration Tests
 * 
 * 🚨 CRITICAL: These tests prevent race condition regressions
 * 
 * These tests specifically validate the timing-sensitive dependency configurations
 * that prevent actor sheet stub rendering and context menu race conditions.
 * 
 * @fileoverview Tests for service dependency configuration validation
 * @author Avant VTT Team
 * @since 2025-01-17 - Created to prevent race condition regressions
 */

import {
    SERVICE_DEPENDENCY_CONFIG,
    validateServiceDependencies,
    getServiceConfig,
    getServicesForPhase,
    getInitializationOrder,
    type ServiceDependencyConfig,
    type ServicePhase
} from '../../../scripts/utils/service-dependency-config.ts';

describe('Service Dependency Configuration', () => {
    describe('Basic Configuration Validation', () => {
        test('should have valid configuration structure', () => {
            expect(SERVICE_DEPENDENCY_CONFIG).toBeInstanceOf(Array);
            expect(SERVICE_DEPENDENCY_CONFIG.length).toBeGreaterThan(0);
        });

        test('should have all required services', () => {
            const serviceIds = SERVICE_DEPENDENCY_CONFIG.map(s => s.id);
            const requiredServices = [
                'systemSettings',
                'tagRegistry',
                'dataModels',
                'templates',
                'sheetRegistration',
                'chatContextMenu',
                'traitProvider',
                'compendiumValidation'
            ];

            for (const required of requiredServices) {
                expect(serviceIds).toContain(required);
            }
        });

        test('should have no validation errors', () => {
            const errors = validateServiceDependencies();
            expect(errors).toEqual([]);
        });
    });

    describe('🚨 CRITICAL: Race Condition Prevention', () => {
        test('CRITICAL: prevents actor sheet stub rendering race condition', () => {
            const sheetRegistration = getServiceConfig('sheetRegistration');
            const templates = getServiceConfig('templates');

            expect(sheetRegistration).toBeDefined();
            expect(templates).toBeDefined();

            // 🚨 CRITICAL: This prevents the race condition where actor sheets open as stubs
            expect(sheetRegistration!.dependencies).toContain('templates');

            // Both must be in init phase
            expect(sheetRegistration!.phase).toBe('init');
            expect(templates!.phase).toBe('init');
        });

        test('CRITICAL: prevents context menu race condition', () => {
            const chatContextMenu = getServiceConfig('chatContextMenu');

            expect(chatContextMenu).toBeDefined();

            // 🚨 CRITICAL: This prevents the race condition where context menu doesn't work
            expect(chatContextMenu!.phase).toBe('init');
        });

        test('CRITICAL: validates templates load before sheet registration', () => {
            const initOrder = getInitializationOrder();
            const templatesIndex = initOrder.indexOf('templates');
            const sheetRegistrationIndex = initOrder.indexOf('sheetRegistration');

            expect(templatesIndex).toBeGreaterThan(-1);
            expect(sheetRegistrationIndex).toBeGreaterThan(-1);

            // 🚨 CRITICAL: Templates must be initialized before sheet registration
            expect(templatesIndex).toBeLessThan(sheetRegistrationIndex);
        });

        test('CRITICAL: validates context menu runs in init phase', () => {
            const chatContextMenu = getServiceConfig('chatContextMenu');

            // 🚨 CRITICAL: Context menu must run in init phase to override methods
            // before FoundryVTT creates the ChatLog
            expect(chatContextMenu!.phase).toBe('init');
        });
    });

    describe('Phase Timing Validation', () => {
        test('should validate that context menu services must be in init phase', () => {
            // Test the actual validation rule that context menu services must be in init phase
            const contextMenuServices = SERVICE_DEPENDENCY_CONFIG.filter(s =>
                s.id.toLowerCase().includes('context') || s.id.toLowerCase().includes('menu')
            );

            // Should have at least one context menu service
            expect(contextMenuServices.length).toBeGreaterThan(0);

            // All context menu services should be in init phase
            for (const service of contextMenuServices) {
                expect(service.phase).toBe('init');
            }
        });

        test('should require all UI services in init phase', () => {
            const uiServices = SERVICE_DEPENDENCY_CONFIG.filter(s =>
                s.id.includes('sheet') ||
                s.id.includes('context') ||
                s.id.includes('menu') ||
                s.id.includes('template')
            );

            for (const service of uiServices) {
                expect(service.phase).toBe('init');
            }
        });
    });

    describe('Dependency Chain Validation', () => {
        test('should have correct dependency chain for actor sheets', () => {
            const sheetRegistration = getServiceConfig('sheetRegistration');

            // Sheet registration must depend on both data models and templates
            expect(sheetRegistration!.dependencies).toContain('dataModels');
            expect(sheetRegistration!.dependencies).toContain('templates');
        });

        test('should have no circular dependencies', () => {
            const errors = validateServiceDependencies();
            const circularErrors = errors.filter(e => e.includes('Circular'));

            expect(circularErrors).toEqual([]);
        });

        test('should have valid dependency references', () => {
            const serviceIds = SERVICE_DEPENDENCY_CONFIG.map(s => s.id);

            for (const service of SERVICE_DEPENDENCY_CONFIG) {
                for (const dep of service.dependencies) {
                    expect(serviceIds).toContain(dep);
                }
            }
        });
    });

    describe('Service Configuration Getters', () => {
        test('getServiceConfig should return correct service', () => {
            const templates = getServiceConfig('templates');
            expect(templates).toBeDefined();
            expect(templates!.id).toBe('templates');
        });

        test('getServicesForPhase should return correct services', () => {
            const initServices = getServicesForPhase('init');
            const readyServices = getServicesForPhase('ready');

            expect(initServices.length).toBeGreaterThan(0);
            expect(readyServices.length).toBeGreaterThan(0);

            // Critical services should be in init phase
            const criticalServices = ['templates', 'sheetRegistration', 'chatContextMenu'];
            for (const critical of criticalServices) {
                expect(initServices.some(s => s.id === critical)).toBe(true);
            }
        });

        test('getInitializationOrder should return valid order', () => {
            const order = getInitializationOrder();

            expect(order.length).toBeGreaterThan(0);
            expect(order).toContain('templates');
            expect(order).toContain('sheetRegistration');
            expect(order).toContain('chatContextMenu');
        });
    });

    describe('🚨 REGRESSION PREVENTION', () => {
        test('REGRESSION: prevents accidentally moving chatContextMenu to ready phase', () => {
            const chatContextMenu = getServiceConfig('chatContextMenu');

            // This test will fail if someone accidentally changes the phase
            expect(chatContextMenu!.phase).toBe('init');
        });

        test('REGRESSION: prevents accidentally removing templates dependency', () => {
            const sheetRegistration = getServiceConfig('sheetRegistration');

            // This test will fail if someone accidentally removes the templates dependency
            expect(sheetRegistration!.dependencies).toContain('templates');
        });

        test('REGRESSION: prevents accidentally changing service order', () => {
            const initOrder = getInitializationOrder();

            // Validate key ordering relationships
            const templatesIndex = initOrder.indexOf('templates');
            const sheetRegistrationIndex = initOrder.indexOf('sheetRegistration');
            const chatContextMenuIndex = initOrder.indexOf('chatContextMenu');

            // Templates must come before sheet registration
            expect(templatesIndex).toBeLessThan(sheetRegistrationIndex);

            // Context menu can come after sheet registration (has dependency)
            expect(sheetRegistrationIndex).toBeLessThan(chatContextMenuIndex);
        });
    });
});

describe('Service Dependency Configuration Integration', () => {
    test('should integrate with InitializationManager validation', () => {
        // This test ensures that the validation functions work correctly
        // when used by the InitializationManager
        const errors = validateServiceDependencies();

        // Should have no errors in valid configuration
        expect(errors).toEqual([]);
    });

    test('should provide complete service metadata', () => {
        for (const service of SERVICE_DEPENDENCY_CONFIG) {
            expect(service.id).toBeTruthy();
            expect(service.dependencies).toBeInstanceOf(Array);
            expect(['init', 'ready']).toContain(service.phase);
            expect(typeof service.critical).toBe('boolean');
            expect(service.description).toBeTruthy();
            expect(service.dependencyReason).toBeTruthy();
        }
    });
});

/**
 * 🚨 CRITICAL TEST DOCUMENTATION
 * 
 * These tests specifically prevent the race conditions that were fixed:
 * 
 * 1. ACTOR SHEET RACE CONDITION:
 *    - Templates must load before sheet registration
 *    - Both must be in init phase
 *    - Test validates dependency chain and timing
 * 
 * 2. CONTEXT MENU RACE CONDITION:
 *    - Context menu must run in init phase
 *    - Must override methods before FoundryVTT creates ChatLog
 *    - Test validates phase timing
 * 
 * If these tests fail, the race conditions will return and users will
 * experience random failures. These tests must pass 100% of the time.
 */ 