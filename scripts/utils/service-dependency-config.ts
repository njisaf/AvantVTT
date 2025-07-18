/**
 * Service Dependency Configuration for Avant VTT System
 * 
 * 🚨 CRITICAL: This module manages service initialization order to prevent race conditions.
 * 
 * ⚠️  WARNING: Changing the dependency order can cause random initialization failures.
 * ⚠️  NEVER modify without understanding the implications documented below.
 * 
 * @fileoverview This module defines the initialization order for all system services.
 * Each service dependency is carefully designed to prevent race conditions, particularly
 * the critical templates → sheetRegistration order that prevents actor sheet stub rendering.
 * 
 * @author Avant VTT Team
 * @since 2025-01-17 - Created to resolve actor sheet race condition (Issue #xxx)
 */

/**
 * Service phase definitions
 */
export type ServicePhase = 'init' | 'ready';

/**
 * Service dependency configuration
 */
export interface ServiceDependencyConfig {
    /** Service identifier */
    id: string;
    /** Services that must complete before this service starts */
    dependencies: string[];
    /** Phase during which this service initializes */
    phase: ServicePhase;
    /** Whether this service is critical to system operation */
    critical: boolean;
    /** Human-readable description of what this service does */
    description: string;
    /** Why this service has its specific dependencies */
    dependencyReason: string;
}

/**
 * 🚨 CRITICAL SERVICE DEPENDENCY CONFIGURATION
 * 
 * This configuration prevents race conditions by ensuring proper initialization order.
 * 
 * ⚠️  RACE CONDITION PREVENTION:
 * - Templates MUST load before sheet registration
 * - Sheet registration MUST complete before sheets become available
 * - Data models MUST be ready before sheets are registered
 * 
 * If you modify this configuration, you MUST:
 * 1. Run the full test suite
 * 2. Test actor sheet opening 10+ times in a row
 * 3. Test in both v12 and v13 environments
 * 4. Update the documentation explaining your changes
 */
export const SERVICE_DEPENDENCY_CONFIG: ServiceDependencyConfig[] = [
    {
        id: 'systemSettings',
        dependencies: [],
        phase: 'init',
        critical: true,
        description: 'Registers system settings with FoundryVTT',
        dependencyReason: 'No dependencies - must initialize first to establish configuration'
    },
    {
        id: 'tagRegistry',
        dependencies: [],
        phase: 'init',
        critical: true,
        description: 'Loads and manages trait tags for the system',
        dependencyReason: 'No dependencies - provides foundational tag data'
    },
    {
        id: 'dataModels',
        dependencies: [],
        phase: 'init',
        critical: true,
        description: 'Configures FoundryVTT data models for actors and items',
        dependencyReason: 'No dependencies - provides foundational data structures'
    },
    {
        id: 'templates',
        dependencies: [],
        phase: 'init',
        critical: true,
        description: 'Loads and compiles Handlebars templates',
        dependencyReason: '🚨 CRITICAL: Must load BEFORE sheetRegistration to prevent race condition where actors open as stubs'
    },
    {
        id: 'sheetRegistration',
        dependencies: ['dataModels', 'templates'],
        phase: 'init',
        critical: true,
        description: 'Registers ApplicationV2 actor and item sheets',
        dependencyReason: '🚨 CRITICAL: Depends on templates (prevents stub rendering) and dataModels (needs data structure)'
    },
    {
        id: 'chatContextMenu',
        dependencies: ['sheetRegistration'],
        phase: 'init',
        critical: false,
        description: 'Sets up chat context menu for Fortune Point rerolls',
        dependencyReason: '🚨 CRITICAL: Must run in init phase to override method BEFORE FoundryVTT creates ChatLog context menu'
    },
    {
        id: 'traitProvider',
        dependencies: [],
        phase: 'ready',
        critical: false,
        description: 'Provides trait data and display formatting',
        dependencyReason: 'No dependencies - data provider service'
    },
    {
        id: 'compendiumValidation',
        dependencies: [],
        phase: 'ready',
        critical: false,
        description: 'Validates compendium packs for drag-and-drop functionality',
        dependencyReason: 'No dependencies - validation service'
    },
    {
        id: 'traitSeeder',
        dependencies: [],
        phase: 'ready',
        critical: false,
        description: 'Seeds trait data into system compendium packs',
        dependencyReason: 'No dependencies - data seeding service'
    }
];

/**
 * 🔍 DEPENDENCY VALIDATION FUNCTIONS
 * 
 * These functions validate that the dependency configuration is valid
 * and catch common mistakes that could cause race conditions.
 */

/**
 * Validates that all service dependencies are properly configured
 * @returns Array of validation errors (empty if valid)
 */
export function validateServiceDependencies(): string[] {
    const errors: string[] = [];
    const serviceIds = SERVICE_DEPENDENCY_CONFIG.map(s => s.id);

    // Check for duplicate service IDs
    const duplicates = serviceIds.filter((id, index) => serviceIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
        errors.push(`Duplicate service IDs found: ${duplicates.join(', ')}`);
    }

    // Check for invalid dependencies
    for (const service of SERVICE_DEPENDENCY_CONFIG) {
        for (const dep of service.dependencies) {
            if (!serviceIds.includes(dep)) {
                errors.push(`Service '${service.id}' depends on non-existent service '${dep}'`);
            }
        }
    }

    // Check for circular dependencies
    const circularDeps = detectCircularDependencies();
    if (circularDeps.length > 0) {
        errors.push(`Circular dependencies detected: ${circularDeps.join(' → ')}`);
    }

    // 🚨 CRITICAL: Validate race condition prevention
    const templates = SERVICE_DEPENDENCY_CONFIG.find(s => s.id === 'templates');
    const sheetRegistration = SERVICE_DEPENDENCY_CONFIG.find(s => s.id === 'sheetRegistration');
    const chatContextMenu = SERVICE_DEPENDENCY_CONFIG.find(s => s.id === 'chatContextMenu');

    if (!templates || !sheetRegistration) {
        errors.push('Missing critical services: templates or sheetRegistration');
    } else if (!sheetRegistration.dependencies.includes('templates')) {
        errors.push('🚨 RACE CONDITION RISK: sheetRegistration must depend on templates');
    }

    // 🚨 CRITICAL: Validate context menu phase timing
    if (!chatContextMenu) {
        errors.push('Missing critical service: chatContextMenu');
    } else if (chatContextMenu.phase !== 'init') {
        errors.push('🚨 PHASE TIMING RISK: chatContextMenu must run in init phase, not ready phase');
    }

    // 🚨 CRITICAL: Validate phase ordering rules
    const phaseOrderErrors = validatePhaseOrdering();
    errors.push(...phaseOrderErrors);

    return errors;
}

/**
 * Detects circular dependencies in the service configuration
 * @returns Array of circular dependency chains
 */
function detectCircularDependencies(): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[] = [];

    function dfs(serviceId: string, path: string[]): void {
        if (recursionStack.has(serviceId)) {
            const cycleStart = path.indexOf(serviceId);
            cycles.push(path.slice(cycleStart).concat(serviceId).join(' → '));
            return;
        }

        if (visited.has(serviceId)) return;

        visited.add(serviceId);
        recursionStack.add(serviceId);

        const service = SERVICE_DEPENDENCY_CONFIG.find(s => s.id === serviceId);
        if (service) {
            for (const dep of service.dependencies) {
                dfs(dep, [...path, serviceId]);
            }
        }

        recursionStack.delete(serviceId);
    }

    for (const service of SERVICE_DEPENDENCY_CONFIG) {
        if (!visited.has(service.id)) {
            dfs(service.id, []);
        }
    }

    return cycles;
}

/**
 * Validates phase ordering rules to prevent timing issues
 * @returns Array of validation errors
 */
function validatePhaseOrdering(): string[] {
    const errors: string[] = [];

    // Rule 1: Context menu services must run in init phase
    const contextMenuServices = SERVICE_DEPENDENCY_CONFIG.filter(s =>
        s.id.toLowerCase().includes('context') || s.id.toLowerCase().includes('menu')
    );

    for (const service of contextMenuServices) {
        if (service.phase !== 'init') {
            errors.push(`🚨 PHASE TIMING RISK: Context menu service '${service.id}' must run in init phase, not ${service.phase}`);
        }
    }

    // Rule 2: Sheet registration services must run in init phase
    const sheetServices = SERVICE_DEPENDENCY_CONFIG.filter(s =>
        s.id.toLowerCase().includes('sheet') || s.id.toLowerCase().includes('registration')
    );

    for (const service of sheetServices) {
        if (service.phase !== 'init') {
            errors.push(`🚨 PHASE TIMING RISK: Sheet service '${service.id}' must run in init phase, not ${service.phase}`);
        }
    }

    // Rule 3: Template services must run in init phase
    const templateServices = SERVICE_DEPENDENCY_CONFIG.filter(s =>
        s.id.toLowerCase().includes('template')
    );

    for (const service of templateServices) {
        if (service.phase !== 'init') {
            errors.push(`🚨 PHASE TIMING RISK: Template service '${service.id}' must run in init phase, not ${service.phase}`);
        }
    }

    return errors;
}

/**
 * Gets the dependency configuration for a specific service
 * @param serviceId - The service identifier
 * @returns Service configuration or undefined if not found
 */
export function getServiceConfig(serviceId: string): ServiceDependencyConfig | undefined {
    return SERVICE_DEPENDENCY_CONFIG.find(s => s.id === serviceId);
}

/**
 * Gets all services that should initialize in a specific phase
 * @param phase - The initialization phase
 * @returns Array of service configurations for that phase
 */
export function getServicesForPhase(phase: ServicePhase): ServiceDependencyConfig[] {
    return SERVICE_DEPENDENCY_CONFIG.filter(s => s.phase === phase);
}

/**
 * Validates and returns the initialization order for services
 * @returns Array of service IDs in dependency order
 */
export function getInitializationOrder(): string[] {
    const errors = validateServiceDependencies();
    if (errors.length > 0) {
        throw new Error(`Service dependency validation failed:\n${errors.join('\n')}`);
    }

    // Topological sort to get correct initialization order
    const visited = new Set<string>();
    const result: string[] = [];

    function visit(serviceId: string) {
        if (visited.has(serviceId)) return;

        visited.add(serviceId);
        const service = SERVICE_DEPENDENCY_CONFIG.find(s => s.id === serviceId);

        if (service) {
            // Visit dependencies first
            for (const dep of service.dependencies) {
                visit(dep);
            }
            result.push(serviceId);
        }
    }

    // Process init phase services first
    const initServices = getServicesForPhase('init');
    for (const service of initServices) {
        visit(service.id);
    }

    return result;
}

/**
 * 🚨 CRITICAL RACE CONDITION DOCUMENTATION
 * 
 * This section documents the specific race condition that was fixed
 * and must be preserved in any future modifications.
 * 
 * PROBLEM: Actor sheets opening as stubs (icon + title only)
 * CAUSE: Templates loading after sheet registration
 * SOLUTION: Templates must load before sheet registration
 * 
 * DEPENDENCY CHAIN THAT MUST BE PRESERVED:
 * 1. templates (loads Handlebars templates)
 * 2. sheetRegistration (depends on templates)
 * 
 * If this order is violated, users will experience random failures
 * where actor sheets open as empty stubs instead of full content.
 * 
 * TESTING REQUIREMENTS:
 * - Test actor sheet opening 10+ times consecutively
 * - Test in fresh incognito browser windows
 * - Test with cleared cache
 * - Test should pass 100% of the time
 */ 