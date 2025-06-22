/**
 * @fileoverview InitializationManager Usage Examples
 * @description Demonstrates patterns for robust initialization and dependency management
 * @author Avant VTT Team
 * @version 1.0.0
 */

import { InitializationManager, getInitializationManager } from './initialization-manager.js';
import type { InitializationStatusReport } from '../types/core/initialization.js';

// =============================================================================
// EXAMPLE 1: Simple Service Registration
// =============================================================================

/**
 * Example: Register a simple service with no dependencies
 */
function registerSimpleService(): void {
    const manager = getInitializationManager();
    
    manager.registerService('mySimpleService', async () => {
        console.log('Initializing simple service...');
        // Your initialization logic here
        return { status: 'ready', data: [] };
    }, [], {
        phase: 'init',
        critical: true,
        timeout: 5000
    });
}

// =============================================================================
// EXAMPLE 2: Service with Dependencies
// =============================================================================

/**
 * Example: Register a service that depends on another service
 */
function registerDependentService(): void {
    const manager = getInitializationManager();
    
    manager.registerService('dataService', async () => {
        // This service needs the theme manager to be ready first
        const themeManager = await manager.waitForService('themeManager');
        
        // Now safely initialize knowing dependencies are ready
        const data = await loadSomeData();
        return { themeManager, data };
    }, ['themeManager'], {
        phase: 'ready',
        critical: false,
        timeout: 10000
    });
}

// =============================================================================
// EXAMPLE 3: Safe Service Access
// =============================================================================

/**
 * Example: Safely access a service that might not be ready yet
 */
async function safeServiceAccess(): Promise<void> {
    const manager = getInitializationManager();
    
    // Method 1: Check if service is ready first
    if (manager.isServiceReady('themeManager')) {
        const themeManager = manager.getService('themeManager');
        if (themeManager && typeof themeManager.setTheme === 'function') {
            themeManager.setTheme('dark');
        }
    } else {
        console.warn('Theme manager not ready yet');
    }
    
    // Method 2: Wait for service with timeout
    try {
        const themeManager = await manager.waitForService('themeManager', 3000);
        if (themeManager && typeof themeManager.setTheme === 'function') {
            themeManager.setTheme('dark');
        }
    } catch (error) {
        console.error('Failed to get theme manager:', error);
    }
}

// =============================================================================
// EXAMPLE 4: Error Handling and Non-Critical Services
// =============================================================================

/**
 * Example: Register a non-critical service that won't stop initialization if it fails
 */
function registerNonCriticalService(): void {
    const manager = getInitializationManager();
    
    manager.registerService('optionalEnhancement', async () => {
        // This might fail (e.g., network request, optional feature)
        const result = await fetchOptionalData();
        return result;
    }, [], {
        phase: 'ready',
        critical: false, // Won't stop initialization if this fails
        timeout: 2000,
        retries: 1
    });
}

// =============================================================================
// EXAMPLE 5: Custom Initialization Phase
// =============================================================================

/**
 * Example: Create a custom initialization phase
 */
async function runCustomInitializationPhase(): Promise<void> {
    const manager = getInitializationManager();
    
    // Register services for a custom phase
    manager.registerService('customPhaseService', async () => {
        console.log('Running custom phase initialization');
        return { phase: 'custom', ready: true };
    }, [], {
        phase: 'custom', // Custom phase name
        critical: true
    });
    
    // Execute the custom phase
    const result = await manager.initializePhase('custom');
    
    if (result.success) {
        console.log('Custom phase completed successfully');
    } else {
        console.error('Custom phase failed:', result.error);
    }
}

// =============================================================================
// EXAMPLE 6: Initialization Status Monitoring
// =============================================================================

/**
 * Example: Monitor initialization status and handle failures
 */
function monitorInitialization(): void {
    const manager = getInitializationManager();
    
    // Get status report
    const status: InitializationStatusReport = manager.getStatusReport();
    console.log('Initialization Status:', status);
    
    // Check for failures
    const failedServices = status.services.filter(s => s.status === 'failed');
    if (failedServices.length > 0) {
        console.error('Failed services:', failedServices);
        
        // Handle failures (retry, fallback, notify user, etc.)
        failedServices.forEach(service => {
            if (!service.critical) {
                console.log(`Non-critical service ${service.name} failed - continuing`);
            } else {
                console.error(`Critical service ${service.name} failed - system may be unstable`);
            }
        });
    }
}

// =============================================================================
// EXAMPLE 7: FoundryVTT Hook Integration
// =============================================================================

/**
 * Example: Integrate with FoundryVTT hooks using robust initialization
 */
function setupFoundryHookIntegration(): void {
    const manager = getInitializationManager();
    
    // Register a service that sets up FoundryVTT hooks
    manager.registerService('foundryHooks', async () => {
        // Ensure dependencies are ready before setting up hooks
        const themeManager = await manager.waitForService('themeManager');
        
        // Now safely set up hooks knowing dependencies are available
        Hooks.on('renderApplication', (app: any, html: any) => {
            // Theme manager is guaranteed to be ready
            if (themeManager && typeof themeManager.applyTheme === 'function') {
                themeManager.applyTheme('dark');
            }
        });
        
        Hooks.on('ready', () => {
            console.log('FoundryVTT ready - all our services are also ready');
        });
        
        return { hooks: 'registered' };
    }, ['themeManager'], {
        phase: 'ready',
        critical: false
    });
}

// =============================================================================
// EXAMPLE 8: Testing and Development Helpers
// =============================================================================

/**
 * Development debug interface
 */
interface DebugInitInterface {
    manager: InitializationManager;
    status: () => InitializationStatusReport;
    waitFor: <T = any>(service: string, timeout?: number) => Promise<T>;
    isReady: (service: string) => boolean;
    get: <T = any>(service: string) => T | null;
}

/**
 * Example: Development and testing utilities
 */
function developmentHelpers(): void {
    const manager = getInitializationManager();
    
    // Add to global scope for debugging
    const debugInit: DebugInitInterface = {
        manager,
        status: () => manager.getStatusReport(),
        waitFor: <T = any>(service: string, timeout?: number) => manager.waitForService<T>(service, timeout),
        isReady: (service: string) => manager.isServiceReady(service),
        get: <T = any>(service: string) => manager.getService<T>(service)
    };
    
    (globalThis as any).debugInit = debugInit;
    
    console.log('Debug helpers available at globalThis.debugInit');
    console.log('Usage: debugInit.status(), debugInit.waitFor("themeManager")');
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Simulates async data loading
 * @returns Promise resolving to sample data
 */
async function loadSomeData(): Promise<string[]> {
    // Simulate async data loading
    return new Promise(resolve => {
        setTimeout(() => resolve(['data1', 'data2']), 100);
    });
}

/**
 * Simulates optional network request that might fail
 * @returns Promise that might reject
 */
async function fetchOptionalData(): Promise<{ optional: string }> {
    // Simulate optional network request that might fail
    if (Math.random() > 0.5) {
        throw new Error('Network request failed');
    }
    return { optional: 'data' };
}

// =============================================================================
// EXPORT EXAMPLES
// =============================================================================

export {
    registerSimpleService,
    registerDependentService,
    safeServiceAccess,
    registerNonCriticalService,
    runCustomInitializationPhase,
    monitorInitialization,
    setupFoundryHookIntegration,
    developmentHelpers
}; 