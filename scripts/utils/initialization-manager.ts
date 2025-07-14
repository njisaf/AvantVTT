/**
 * @fileoverview Initialization Manager - Robust loading order management
 * @description Provides dependency-aware initialization with proper error handling
 * @author Avant VTT Team
 * @version 1.0.0
 */

import type {
    InitializationPhase,
    ServiceStatus,
    ServiceOptions,
    ServiceConfiguration,
    InitializationResult,
    InitializationError,
    InitializationStatusReport,
    ServiceStatusInfo,
    RequiresServicesOptions,
    ServiceInitializer,
    DependencyGraph,
    ServiceRegistry
} from '../types/core/initialization.js';

// Import template helpers statically to ensure they're bundled
import { initializeHandlebarsHelpers } from './template-helpers.js';

/**
 * Service registration and dependency management for FoundryVTT systems
 * Prevents load order issues by ensuring dependencies are met before initialization
 */
export class InitializationManager {
    private static _instance: InitializationManager | undefined;

    private readonly services!: ServiceRegistry;
    private readonly pendingServices!: Map<string, Promise<any>>;
    private readonly initializationOrder!: string[];
    private isInitialized!: boolean;
    private isReady!: boolean;

    // Error handling
    private readonly initializationErrors!: InitializationError[];
    private readonly maxRetries!: number;
    private readonly retryDelay!: number; // ms

    constructor() {
        if (InitializationManager._instance) {
            return InitializationManager._instance;
        }

        InitializationManager._instance = this;

        // Service registry
        this.services = new Map<string, ServiceConfiguration>();
        this.pendingServices = new Map<string, Promise<any>>();
        this.initializationOrder = [];
        this.isInitialized = false;
        this.isReady = false;

        // Error handling
        this.initializationErrors = [];
        this.maxRetries = 3;
        this.retryDelay = 100; // ms

        console.log('🔧 InitializationManager | Singleton instance created');
    }

    /**
     * Gets the singleton instance of InitializationManager
     * @returns The singleton instance
     */
    static getInstance(): InitializationManager {
        if (!InitializationManager._instance) {
            InitializationManager._instance = new InitializationManager();
        }
        return InitializationManager._instance;
    }

    /**
     * Register a service with its dependencies
     * @param serviceName - Name of the service
     * @param initFunction - Async function to initialize the service
     * @param dependencies - Array of service names this service depends on
     * @param options - Additional options
     * @returns This InitializationManager instance for chaining
     */
    registerService<T = any>(
        serviceName: string,
        initFunction: ServiceInitializer<T>,
        dependencies: string[] = [],
        options: Partial<ServiceOptions> = {}
    ): InitializationManager {
        const service: ServiceConfiguration<T> = {
            name: serviceName,
            initFunction,
            dependencies,
            options: {
                phase: 'init',
                critical: true,
                retries: this.maxRetries,
                timeout: 10000, // 10 second timeout
                ...options
            } as ServiceOptions,
            status: 'pending',
            instance: null,
            error: null,
            attempts: 0
        };

        this.services.set(serviceName, service);
        console.log(`🔧 InitializationManager | Registered service: ${serviceName}`);

        return this;
    }

    /**
     * Get a service instance safely
     * @param serviceName - Name of the service
     * @returns Service instance or null if not ready
     */
    getService<T = any>(serviceName: string): T | null {
        const service = this.services.get(serviceName);
        if (!service || service.status !== 'ready') {
            console.warn(`🔧 InitializationManager | Service '${serviceName}' not ready`);
            return null;
        }
        return service.instance as T;
    }

    /**
     * Check if a service is ready
     * @param serviceName - Name of the service
     * @returns True if service is ready
     */
    isServiceReady(serviceName: string): boolean {
        const service = this.services.get(serviceName);
        return service !== undefined && service.status === 'ready';
    }

    /**
     * Wait for a service to be ready
     * @param serviceName - Name of the service
     * @param timeout - Timeout in milliseconds
     * @returns Promise that resolves with service instance
     */
    async waitForService<T = any>(serviceName: string, timeout: number = 5000): Promise<T> {
        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Service '${serviceName}' not registered`);
        }

        if (service.status === 'ready') {
            return service.instance as T;
        }

        return new Promise<T>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Timeout waiting for service '${serviceName}'`));
            }, timeout);

            const checkStatus = (): void => {
                if (service.status === 'ready') {
                    clearTimeout(timeoutId);
                    resolve(service.instance as T);
                } else if (service.status === 'failed') {
                    clearTimeout(timeoutId);
                    reject(new Error(`Service '${serviceName}' failed to initialize`));
                } else {
                    setTimeout(checkStatus, 50);
                }
            };

            checkStatus();
        });
    }

    /**
     * Initialize all services in dependency order
     * @param phase - Initialization phase ('init', 'ready', 'setup')
     * @returns Results of initialization
     */
    async initializePhase(phase: InitializationPhase): Promise<InitializationResult> {
        console.log(`🔧 InitializationManager | Starting ${phase} phase`);

        const phaseServices = Array.from(this.services.values())
            .filter(service => service.options.phase === phase);

        if (phaseServices.length === 0) {
            console.log(`🔧 InitializationManager | No services for ${phase} phase`);
            return { success: true, results: {} };
        }

        const results: Record<string, any> = {};
        const errors: InitializationError[] = [];

        try {
            // Build dependency graph and determine initialization order
            const initOrder = this._resolveDependencies(phaseServices);

            // Initialize services in dependency order
            for (const serviceName of initOrder) {
                const service = this.services.get(serviceName);
                if (!service || service.options.phase !== phase) continue;

                try {
                    console.log(`🔧 InitializationManager | Initializing ${serviceName}...`);
                    const startTime = performance.now();

                    service.status = 'initializing';
                    service.attempts++;

                    // Initialize with timeout
                    const result = await this._initializeWithTimeout(service);

                    service.instance = result;
                    service.status = 'ready';
                    service.error = null;

                    results[serviceName] = result;

                    const duration = Math.round(performance.now() - startTime);
                    console.log(`✅ InitializationManager | ${serviceName} initialized in ${duration}ms`);

                } catch (error) {
                    service.status = 'failed';
                    service.error = error instanceof Error ? error : new Error(String(error));

                    const errorInfo: InitializationError = {
                        service: serviceName,
                        phase,
                        error: service.error.message,
                        attempts: service.attempts
                    };

                    if (service.options.critical) {
                        console.error(`❌ InitializationManager | Critical service ${serviceName} failed:`, error);
                        errors.push(errorInfo);
                        throw new Error(`Critical service '${serviceName}' failed: ${service.error.message}`);
                    } else {
                        console.warn(`⚠️ InitializationManager | Non-critical service ${serviceName} failed:`, error);
                        errors.push(errorInfo);
                        results[serviceName] = null;
                    }
                }
            }

            console.log(`✅ InitializationManager | ${phase} phase completed successfully`);
            return { success: true, results, errors };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ InitializationManager | ${phase} phase failed:`, error);
            return { success: false, error: errorMessage, results, errors };
        }
    }

    /**
     * Initialize service with timeout and retry logic
     * @private
     */
    private async _initializeWithTimeout<T>(service: ServiceConfiguration<T>): Promise<T> {
        const { initFunction, options } = service;

        return new Promise<T>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Service '${service.name}' initialization timed out`));
            }, options.timeout);

            Promise.resolve(initFunction())
                .then(result => {
                    clearTimeout(timeoutId);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
    }

    /**
     * Resolve service dependencies and return initialization order
     * @private
     */
    private _resolveDependencies(services: ServiceConfiguration[]): string[] {
        const graph: DependencyGraph = new Map();
        const visited = new Set<string>();
        const visiting = new Set<string>();
        const order: string[] = [];

        // Build dependency graph for current phase services
        for (const service of services) {
            graph.set(service.name, service.dependencies);
        }

        // Create a map of ALL services (across all phases) for dependency validation
        const allServicesMap = new Map<string, ServiceConfiguration>();
        for (const service of this.services.values()) {
            allServicesMap.set(service.name, service);
        }

        // Topological sort with cycle detection
        const visit = (serviceName: string): void => {
            if (visited.has(serviceName)) return;

            if (visiting.has(serviceName)) {
                throw new Error(`Circular dependency detected involving '${serviceName}'`);
            }

            visiting.add(serviceName);

            const dependencies = graph.get(serviceName) || [];
            for (const dep of dependencies) {
                // Check if dependency exists in ANY phase (not just current phase)
                if (!allServicesMap.has(dep)) {
                    throw new Error(`Unknown dependency '${dep}' for service '${serviceName}'`);
                }

                // Only visit dependencies that are in the current phase
                // Dependencies from earlier phases should already be initialized
                if (graph.has(dep)) {
                    visit(dep);
                } else {
                    // Dependency is from an earlier phase - verify it's ready
                    const depService = this.services.get(dep);
                    if (depService && depService.status !== 'ready') {
                        console.warn(`⚠️ InitializationManager | Dependency '${dep}' from earlier phase is not ready for '${serviceName}'`);
                    }
                }
            }

            visiting.delete(serviceName);
            visited.add(serviceName);
            order.push(serviceName);
        };

        for (const serviceName of graph.keys()) {
            visit(serviceName);
        }

        return order;
    }

    /**
     * Get initialization status report
     * @returns Status report
     */
    getStatusReport(): InitializationStatusReport {
        const services = Array.from(this.services.values());
        const report: InitializationStatusReport = {
            total: services.length,
            ready: services.filter(s => s.status === 'ready').length,
            pending: services.filter(s => s.status === 'pending').length,
            initializing: services.filter(s => s.status === 'initializing').length,
            failed: services.filter(s => s.status === 'failed').length,
            services: services.map(s => ({
                name: s.name,
                status: s.status,
                phase: s.options.phase,
                critical: s.options.critical,
                attempts: s.attempts,
                error: s.error?.message
            } as ServiceStatusInfo))
        };

        return report;
    }

    /**
     * Reset initialization state (for testing)
     */
    reset(): void {
        this.services.clear();
        this.pendingServices.clear();
        this.initializationOrder.length = 0;
        this.isInitialized = false;
        this.isReady = false;
        this.initializationErrors.length = 0;

        console.log('🔧 InitializationManager | State reset');
    }
}

/**
 * Convenience function to get the InitializationManager instance
 * @returns Singleton instance
 */
export function getInitializationManager(): InitializationManager {
    return InitializationManager.getInstance();
}

/**
 * Decorator for FoundryVTT hook functions to ensure dependencies are met
 * @param dependencies - Required services
 * @param options - Options
 * @returns Decorator function
 */
export function requiresServices(
    dependencies: string[] = [],
    options: RequiresServicesOptions = {}
) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (this: any, ...args: any[]) {
            const manager = getInitializationManager();

            // Wait for all dependencies
            for (const dep of dependencies) {
                try {
                    await manager.waitForService(dep, options.timeout || 5000);
                } catch (error) {
                    console.error(`Failed to wait for dependency '${dep}':`, error);
                    if (options.critical !== false) {
                        throw error;
                    }
                }
            }

            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}

/**
 * FoundryVTT-specific initialization helpers
 */
export class FoundryInitializationHelper {
    /**
     * Register common FoundryVTT services with proper dependencies
     * @param manager - Manager instance
     */
    static registerFoundryServices(manager: InitializationManager): void {
        // System Settings Service - no dependencies, foundational service
        manager.registerService('systemSettings', async () => {
            const game = (globalThis as any).game;
            if (!game?.settings) {
                throw new Error('FoundryVTT settings not available');
            }

            // Register the drag-and-drop trait input feature flag
            game.settings.register('avant', 'enableDragTraitInput', {
                name: 'Enable Drag-and-Drop Trait Input',
                hint: 'Allow dragging traits from the compendium onto item sheets instead of using text input (experimental)',
                scope: 'world',
                config: true,
                type: Boolean,
                default: false,
                onChange: (value: boolean) => {
                    console.log(`🏷️ Avant | Drag-and-drop trait input ${value ? 'enabled' : 'disabled'}`);
                }
            });

            // Register the universal item sheet template feature flag
            game.settings.register('avant', 'useUniversalItemSheet', {
                name: 'Use Universal Item Sheet Template',
                hint: 'Use the single universal template for all item types. ⚠️ Phase 3: Per-type templates are DEPRECATED and will be REMOVED in Phase 4. Disabling this setting is not recommended.',
                scope: 'world',
                config: true,
                type: Boolean,
                default: true, // Phase 2: Changed from false to true for broader testing
                onChange: (value: boolean) => {
                    console.log(`📋 Avant | Universal item sheet template ${value ? 'enabled' : 'disabled'}`);
                    
                    if (ui?.notifications) {
                        if (value) {
                            // User enabled universal template
                            ui.notifications.info(`✅ Universal item sheet template enabled. Refresh item sheets to see changes.`);
                        } else {
                            // Phase 3: Strong warning when user disables universal template
                            ui.notifications.warn(
                                `⚠️ DEPRECATION WARNING: Per-item templates are deprecated and will be REMOVED in Phase 4. ` +
                                `Consider keeping universal template enabled for better performance and future compatibility. ` +
                                `Refresh item sheets to see changes.`,
                                { permanent: true }
                            );
                            console.warn('🚨 AVANT DEPRECATION WARNING 🚨');
                            console.warn('📋 Per-item templates will be REMOVED in Phase 4');
                            console.warn('🔄 Consider re-enabling "Use Universal Item Sheet Template"');
                            console.warn('⚡ Universal template provides better performance and consistency');
                        }
                    }
                }
            });

            console.log('✅ InitializationManager | System settings registered');
            return { success: true };
        }, [], { phase: 'init', critical: true });

        // Tag Registry Service - no dependencies, foundational service
        manager.registerService('tagRegistry', async () => {
            const { TagRegistryService } = await import('../services/tag-registry-service.ts');
            const tagRegistry = TagRegistryService.getInstance();
            await tagRegistry.initialize();
            return tagRegistry;
        }, [], { phase: 'init', critical: false });



        // Data Models - no dependencies
        manager.registerService('dataModels', async () => {
            const { setupDataModels } = await import('../logic/avant-init-utils.js');
            const { AvantActorData } = await import('../data/actor-data.ts');
            const { AvantActionData, AvantFeatureData, AvantTalentData, AvantAugmentData, AvantWeaponData, AvantArmorData, AvantGearData, AvantTraitData } = await import('../data/item-data.js');

            // Get FoundryVTT CONFIG
            const CONFIG = (globalThis as any).CONFIG;
            if (!CONFIG) {
                throw new Error('FoundryVTT CONFIG not available for data model setup');
            }

            // Use our custom extended Actor and Item classes that have required v13 methods
            const AvantActor = (globalThis as any).AvantActor;
            const AvantItem = (globalThis as any).AvantItem;

            if (!AvantActor || !AvantItem) {
                throw new Error('Custom AvantActor and AvantItem classes not available - they should be defined in avant.ts');
            }

            // Define data models
            const actorDataModels = {
                character: AvantActorData,
                npc: AvantActorData,
                vehicle: AvantActorData
            };

            const itemDataModels = {
                action: AvantActionData,
                feature: AvantFeatureData,
                talent: AvantTalentData,
                augment: AvantAugmentData,
                weapon: AvantWeaponData,
                armor: AvantArmorData,
                gear: AvantGearData,
                trait: AvantTraitData
            };

            // Execute data model setup
            const result = setupDataModels(CONFIG, AvantActor, AvantItem, actorDataModels, itemDataModels) as {
                success: boolean;
                error?: string;
                message: string;
            };

            if (!result.success) {
                throw new Error(`Data model setup failed: ${result.error}`);
            }

            console.log(`✅ InitializationManager | ${result.message}`);
            return result;
        }, [], { phase: 'init', critical: true });

        // Sheet Registration - depends on data models
        manager.registerService('sheetRegistration', async () => {
            console.log('🚨 SHEET REGISTRATION | Starting sheet registration service...');

            const { registerSheets } = await import('../logic/avant-init-utils.js');
            console.log('🚨 SHEET REGISTRATION | Imported registerSheets function');

            // Create actor sheet class when Foundry is ready
            console.log('🚨 SHEET REGISTRATION | Importing createAvantActorSheet...');
            const { createAvantActorSheet } = await import('../sheets/actor-sheet.ts');
            console.log('🚨 SHEET REGISTRATION | createAvantActorSheet imported successfully');

            console.log('🚨 SHEET REGISTRATION | Creating AvantActorSheet class...');
            const AvantActorSheet = createAvantActorSheet();
            console.log('🚨 SHEET REGISTRATION | AvantActorSheet created:', {
                name: AvantActorSheet.name,
                hasDefaultOptions: !!AvantActorSheet.DEFAULT_OPTIONS,
                actionsCount: Object.keys(AvantActorSheet.DEFAULT_OPTIONS?.actions || {}).length
            });

            // Create item sheet class when Foundry is ready
            console.log('🚨 SHEET REGISTRATION | Importing createAvantItemSheet...');
            const { createAvantItemSheet } = await import('../sheets/item-sheet.ts');
            console.log('🚨 SHEET REGISTRATION | createAvantItemSheet imported successfully');

            console.log('🚨 SHEET REGISTRATION | Creating AvantItemSheet class...');
            const AvantItemSheet = createAvantItemSheet();
            console.log('🚨 SHEET REGISTRATION | AvantItemSheet created:', {
                name: AvantItemSheet.name,
                hasDefaultOptions: !!AvantItemSheet.DEFAULT_OPTIONS
            });

            // Get FoundryVTT collections using v13 namespaced access
            console.log('🚨 SHEET REGISTRATION | Getting FoundryVTT collections...');
            const actorCollection = (globalThis as any).foundry?.documents?.collections?.Actors || (globalThis as any).Actors;
            const itemCollection = (globalThis as any).foundry?.documents?.collections?.Items || (globalThis as any).Items;

            console.log('🚨 SHEET REGISTRATION | Collections found:', {
                actorCollection: !!actorCollection,
                itemCollection: !!itemCollection,
                actorCollectionName: actorCollection?.constructor?.name,
                itemCollectionName: itemCollection?.constructor?.name
            });

            if (!actorCollection || !itemCollection) {
                throw new Error('FoundryVTT collections not available for sheet registration');
            }

            // Execute sheet registration
            console.log('🚨 SHEET REGISTRATION | Executing registerSheets...');
            const result = registerSheets(actorCollection, itemCollection, AvantActorSheet, AvantItemSheet) as {
                success: boolean;
                error?: string;
                message: string;
                registeredSheets: number;
            };

            console.log('🚨 SHEET REGISTRATION | Registration result:', result);

            if (!result.success) {
                throw new Error(`Sheet registration failed: ${result.error}`);
            }

            console.log(`✅ InitializationManager | ${result.message} (ApplicationV2)`);
            return result;
        }, ['dataModels'], { phase: 'init', critical: true });

        // Template Loading - depends on sheets being registered first
        // CRITICAL: All templates must be explicitly registered here to be found by FoundryVTT
        manager.registerService('templates', async () => {
            /**
             * TEMPLATE LOADING PROCESS DOCUMENTATION:
             * 
             * 1. FoundryVTT requires ALL templates to be pre-loaded during initialization
             * 2. Templates are loaded via foundry.applications.handlebars.loadTemplates()
             * 3. Each template path must be the FULL system path: "systems/avant/templates/..."
             * 4. Partial templates (*.hbs) MUST be included in this list to be found
             * 5. Template references in HTML use the same full path format
             * 
             * COMMON PITFALLS TO AVOID:
             * - Don't use relative paths like "templates/..." - always use full system paths
             * - Don't put partials in subdirectories - FoundryVTT prefers flat structure
             * - Don't forget to add new templates to this list - they won't be found otherwise
             * - Don't assume templates will be auto-discovered - explicit registration required
             * 
             * DEBUGGING TEMPLATE ISSUES:
             * - Check browser console for "template could not be found" errors
             * - Verify template exists in dist/ directory after build
             * - Confirm template path in templatePaths array matches exact file location
             * - Test template reference syntax in HTML: {{> "systems/avant/templates/..."}}
             */
            const templatePaths = [
                // Main sheet templates - the primary UI components
                "systems/avant/templates/actor-sheet.html",
                "systems/avant/templates/item-sheet.html",
                "systems/avant/templates/reroll-dialog.html",

                // Phase 4: Per-item templates removed - universal template consolidation complete
                // All item types now use the single universal template: item-sheet.html

                // PARTIAL TEMPLATES - reusable components included in main templates
                // NOTE: These are *.hbs files that get included via {{> "path"}} syntax
                // CRITICAL: Every partial referenced in templates MUST be listed here
                "systems/avant/templates/actor/row-talent-augment.hbs",      // Talent/Augment row component
                "systems/avant/templates/actor/power-points-section.hbs",    // Power Points tracking UI (Phase 3F)

                // Phase 2-5 Component Library - Form field partials
                "systems/avant/templates/shared/partials/form-row.hbs",
                "systems/avant/templates/shared/partials/number-field.hbs",
                "systems/avant/templates/shared/partials/checkbox-field.hbs",
                "systems/avant/templates/shared/partials/select-field.hbs",
                "systems/avant/templates/shared/partials/text-field.hbs",
                "systems/avant/templates/shared/partials/ap-selector.hbs",
                "systems/avant/templates/shared/partials/image-upload.hbs",
                "systems/avant/templates/shared/partials/textarea-field.hbs",
                "systems/avant/templates/shared/partials/traits-field.hbs",
                "systems/avant/templates/shared/partials/item-header.hbs",

                // Stage 2 Universal Item Sheet Partials - NEW shared header and body architecture
                "systems/avant/templates/shared/partials/avant-item-header.hbs",  // Universal header with icon + name + meta fields
                "systems/avant/templates/shared/partials/item-body.hbs",          // Universal body with organized field rows
                "systems/avant/templates/shared/partials/render-field.hbs",       // Field renderer for all field types

                // Phase 5 Additional Components
                "systems/avant/templates/shared/partials/category-select.hbs",
                "systems/avant/templates/shared/partials/uses-counter.hbs",

                // Phase 3 Layout Partials - NEW layout components
                "systems/avant/templates/shared/partials/single-content.hbs",
                "systems/avant/templates/shared/partials/description-tab.hbs",
                "systems/avant/templates/shared/partials/details-tab.hbs"
            ];

            // Load all templates into FoundryVTT's template cache
            // This makes them available for {{> "template-path"}} references
            console.log('🔧 Template Loading | About to load templates:', templatePaths);

            try {
                // CRITICAL: Wrap template loading in proper error handling
                await (globalThis as any).foundry.applications.handlebars.loadTemplates(templatePaths);
                console.log(`✅ Template Loading | Successfully loaded ${templatePaths.length} templates`);

                // FIX: FoundryVTT v13 template loading registers partials with full paths including .hbs
                // But our template references look for them without .hbs extensions
                // We need to create aliases without the .hbs extension
                const handlebars = (globalThis as any).Handlebars;
                if (handlebars && handlebars.partials) {
                    console.log('🔧 Template Loading | Creating .hbs extension aliases for partials...');

                    const partialsToAlias = templatePaths.filter(path => path.endsWith('.hbs'));
                    let aliasesCreated = 0;

                    for (const fullPath of partialsToAlias) {
                        const aliasPath = fullPath.replace(/\.hbs$/, '');

                        // Check if template is loaded with .hbs extension
                        if (handlebars.partials[fullPath]) {
                            // Create alias without .hbs extension
                            handlebars.partials[aliasPath] = handlebars.partials[fullPath];
                            aliasesCreated++;
                            console.log(`✅ Template Loading | Created alias: "${aliasPath}" -> "${fullPath}"`);
                        } else {
                            console.warn(`⚠️ Template Loading | Template not found for aliasing: "${fullPath}"`);
                        }
                    }

                    console.log(`✅ Template Loading | Created ${aliasesCreated} template aliases`);
                }
            } catch (error) {
                console.error('❌ Template Loading | CRITICAL ERROR during template loading:', error);
                throw new Error(`Template loading failed: ${error instanceof Error ? error.message : String(error)}`);
            }

            // DEBUGGING: Check what's actually registered in Handlebars partials
            const handlebars = (globalThis as any).Handlebars;
            if (handlebars && handlebars.partials) {
                console.log('🔍 Debug | Handlebars partials registry keys:', Object.keys(handlebars.partials));

                // Specifically check for our problematic partial
                const rowTalentAugmentKey = 'systems/avant/templates/actor/row-talent-augment';
                const rowTalentAugmentRegistered = handlebars.partials[rowTalentAugmentKey];
                console.log(`🔍 Debug | row-talent-augment partial registered:`, !!rowTalentAugmentRegistered);

                if (rowTalentAugmentRegistered) {
                    console.log(`🔍 Debug | row-talent-augment partial type:`, typeof rowTalentAugmentRegistered);
                    console.log(`🔍 Debug | row-talent-augment partial content preview:`,
                        typeof rowTalentAugmentRegistered === 'string' ?
                            rowTalentAugmentRegistered.substring(0, 100) + '...' :
                            '[Function]'
                    );
                } else {
                    console.log('🔍 Debug | Checking alternative partial names...');
                    // Check if it's registered under a different name
                    const alternativeKeys = Object.keys(handlebars.partials).filter(key =>
                        key.includes('row-talent-augment') || key.includes('talent-augment')
                    );
                    console.log('🔍 Debug | Found row-talent-augment alternatives:', alternativeKeys);

                    // Log all partials that start with systems/avant/templates/actor/
                    const actorPartials = Object.keys(handlebars.partials).filter(key =>
                        key.startsWith('systems/avant/templates/actor/')
                    );
                    console.log('🔍 Debug | Actor partial keys found:', actorPartials);
                }
            } else {
                console.error('❌ Debug | Handlebars partials registry not accessible');
            }

            // DEBUGGING: Also check FoundryVTT's template cache
            const foundryTemplates = (globalThis as any).foundry?.applications?.handlebars;
            if (foundryTemplates && foundryTemplates.getTemplate) {
                try {
                    const rowTalentAugmentTemplate = foundryTemplates.getTemplate('systems/avant/templates/actor/row-talent-augment');
                    console.log('🔍 Debug | FoundryVTT template cache has row-talent-augment:', !!rowTalentAugmentTemplate);
                } catch (error) {
                    console.log('🔍 Debug | FoundryVTT template cache error:', (error as Error).message);
                }
            }

            // ADDITIONAL DEBUG: Check if the file actually exists by testing one template
            try {
                const testTemplate = await (globalThis as any).foundry.applications.handlebars.renderTemplate(
                    'systems/avant/templates/actor/row-talent-augment',
                    { item: { _id: 'test', name: 'Test Item', type: 'talent' } }
                );
                console.log('🔍 Debug | Direct template render test - SUCCESS');
            } catch (error) {
                console.error('❌ Debug | Direct template render test - FAILED:', error);
            }

            // Register all Handlebars helpers through dedicated helper module
            // These provide custom helper functions like {{traitChipStyle}}, {{localize}}, etc.
            const helpersRegistered = await initializeHandlebarsHelpers();

            if (!helpersRegistered) {
                console.warn('InitializationManager | Handlebars helpers registration failed, but continuing');
            }

            return templatePaths;
        }, ['sheetRegistration'], { phase: 'init', critical: true });

        // Chat Context Menu - ready phase, no dependencies
        manager.registerService('chatContextMenu', async () => {
            const { AvantChatContextMenu } = await import('../chat/context-menu.ts');
            AvantChatContextMenu.addContextMenuListeners();
            return AvantChatContextMenu;
        }, [], { phase: 'ready', critical: false });

        // Trait Provider - init phase, handles trait data from compendium packs
        // CRITICAL FIX: Moved from 'ready' to 'init' phase so it's available when item sheets render
        manager.registerService('traitProvider', async () => {
            const { TraitProvider } = await import('../services/trait-provider.ts');
            const traitProvider = TraitProvider.getInstance();
            await traitProvider.initialize();
            return traitProvider;
        }, [], { phase: 'init', critical: false });

        // Compendium Validation Service - ready phase, validates compendiums for drag-and-drop
        manager.registerService('compendiumValidation', async () => {
            const { validateAllCompendiums } = await import('../dev/assert-trait-compendium.ts');

            try {
                await validateAllCompendiums();
                console.log('✅ InitializationManager | Compendium validation passed - drag-and-drop ready');
                return { success: true, validated: true };
            } catch (error) {
                console.warn('⚠️ InitializationManager | Compendium validation failed:', error);
                // Non-critical - don't fail system initialization
                return { success: false, error: error instanceof Error ? error.message : String(error), validated: false };
            }
        }, [], { phase: 'ready', critical: false });

        // Trait Seeder - ready phase, auto-seeds system pack if needed
        manager.registerService('traitSeeder', async () => {
            const { seedSystemPackIfNeeded } = await import('../utils/trait-seeder.ts');
            const seedingResult = await seedSystemPackIfNeeded();
            console.log('🌱 FoundryInitializationHelper | Trait seeding result:', seedingResult);
            return seedingResult;
        }, [], { phase: 'ready', critical: false });

        // Remote Trait Service - DEPRECATED in Phase 2
        // Service registration removed to eliminate runtime references
        // See deprecated/remote-trait-service/README.md for more information
    }
} 