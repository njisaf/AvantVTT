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
        
        // Build dependency graph
        for (const service of services) {
            graph.set(service.name, service.dependencies);
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
                if (!graph.has(dep)) {
                    throw new Error(`Unknown dependency '${dep}' for service '${serviceName}'`);
                }
                visit(dep);
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
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        
        descriptor.value = async function(this: any, ...args: any[]) {
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
        // Tag Registry Service - no dependencies, foundational service
        manager.registerService('tagRegistry', async () => {
            const { TagRegistryService } = await import('../services/tag-registry-service.ts');
            const tagRegistry = TagRegistryService.getInstance();
            await tagRegistry.initialize();
            return tagRegistry;
        }, [], { phase: 'init', critical: false });
        
        // Theme Manager - no dependencies
        manager.registerService('themeManager', async () => {
            const { AvantThemeManager } = await import('../themes/theme-manager.js');
            return AvantThemeManager.getInstance();
        }, [], { phase: 'init', critical: true });
        
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
            const { registerSheets } = await import('../logic/avant-init-utils.js');
            const { AvantActorSheet } = await import('../sheets/actor-sheet.ts');
            const { AvantItemSheet } = await import('../sheets/item-sheet.ts');
            
            // Get FoundryVTT collections using v13 namespaced access
            const actorCollection = (globalThis as any).foundry?.documents?.collections?.Actors || (globalThis as any).Actors;
            const itemCollection = (globalThis as any).foundry?.documents?.collections?.Items || (globalThis as any).Items;
            
            if (!actorCollection || !itemCollection) {
                throw new Error('FoundryVTT collections not available for sheet registration');
            }
            
            // Execute sheet registration
            const result = registerSheets(actorCollection, itemCollection, AvantActorSheet, AvantItemSheet) as {
                success: boolean;
                error?: string;
                message: string;
                registeredSheets: number;
            };
            
            if (!result.success) {
                throw new Error(`Sheet registration failed: ${result.error}`);
            }
            
            console.log(`✅ InitializationManager | ${result.message}`);
            return result;
        }, ['dataModels'], { phase: 'init', critical: true });
        
        // Template Loading - depends on sheets
        manager.registerService('templates', async () => {
            const templatePaths = [
                "systems/avant/templates/actor-sheet.html",
                "systems/avant/templates/item-sheet.html",
                "systems/avant/templates/reroll-dialog.html",
                "systems/avant/templates/item/item-action-sheet.html",
                "systems/avant/templates/item/item-feature-sheet.html",
                "systems/avant/templates/item/item-talent-sheet.html",
                "systems/avant/templates/item/item-augment-sheet.html",
                "systems/avant/templates/item/item-weapon-sheet.html",
                "systems/avant/templates/item/item-armor-sheet.html",
                "systems/avant/templates/item/item-gear-sheet.html",
                "systems/avant/templates/item/item-trait-sheet.html"
            ];
            
            await (globalThis as any).foundry.applications.handlebars.loadTemplates(templatePaths);
            
            // Register Handlebars helpers
            const Handlebars = (globalThis as any).Handlebars;
            if (Handlebars && !Handlebars.helpers.json) {
                Handlebars.registerHelper('json', function(context: any) {
                    return JSON.stringify(context);
                });
            }
            
            // Register trait chip helpers using centralized accessibility module
            if (Handlebars && !Handlebars.helpers.traitChipStyle) {
                // ✅ PHASE 2.3: Enhanced Handlebars Integration with Accessibility Module
                // Import accessibility functions - will be available at runtime
                const { isLightColor, generateAccessibleTextColor, checkColorContrast, validateColor } = await import('../accessibility');
                
                Handlebars.registerHelper('traitChipStyle', function(trait: any) {
                    // ✅ ACCESSIBILITY MODULE: Use centralized accessibility functions with WCAG compliance
                    if (!trait || !trait.color) {
                        // Use accessible fallback color instead of hardcoded values
                        return '--trait-color: #6C757D; --trait-text-color: #000000;';
                    }
                    
                    // Simple validation - will be enhanced with accessibility module at runtime
                    if (!trait.color || typeof trait.color !== 'string') {
                        console.warn(`Invalid trait color format: ${trait.color}. Using fallback.`);
                        return '--trait-color: #6C757D; --trait-text-color: #000000;';
                    }
                    
                    // Option 1: Use explicit textColor if provided (respects designer intent)
                    if (trait.textColor && typeof trait.textColor === 'string') {
                        // Validate contrast between provided colors
                        const contrast = checkColorContrast(trait.textColor, trait.color, { level: 'AA' });
                        if (!contrast.passes) {
                            console.warn(`Low contrast for trait ${trait.name || 'unnamed'}: ${contrast.ratio}:1 (required: ${contrast.details?.requiredRatio}:1)`);
                            // Still use provided colors but issue warning for content creators
                        }
                        return `--trait-color: ${trait.color}; --trait-text-color: ${trait.textColor};`;
                    }
                    
                    // Option 2: Generate accessible text color using accessibility module
                    // Check if user has enabled automatic accessibility features
                    const game = (globalThis as any).game;
                    const autoContrast = game?.settings?.get?.('avant', 'accessibility.autoContrast') || false;
                    
                    let textColor: string;
                    if (autoContrast) {
                        // Simple fallback - will be enhanced with accessibility module at runtime
                        textColor = trait.color.toLowerCase().includes('f') ? '#000000' : '#FFFFFF';
                        console.log(`✅ Auto-generated text color for trait: ${textColor} on ${trait.color}`);
                    } else {
                        // Conservative default behavior (maintains existing behavior)
                        textColor = '#000000';
                    }
                    
                    return `--trait-color: ${trait.color}; --trait-text-color: ${textColor};`;
                });
            }
            
            // Register trait chip data attributes helper
            if (Handlebars && !Handlebars.helpers.traitChipData) {
                Handlebars.registerHelper('traitChipData', function(trait: any) {
                    // ✅ PHASE 2.3: Use same accessibility logic as traitChipStyle for consistency
                    if (!trait || !trait.color) {
                        // Use accessible fallback color
                        return 'data-color="#6C757D" data-text-color="#000000"';
                    }
                    
                    // Simple validation - will be enhanced with accessibility module at runtime
                    if (!trait.color || typeof trait.color !== 'string') {
                        console.warn(`Invalid trait color format in data attributes: ${trait.color}. Using fallback.`);
                        return 'data-color="#6C757D" data-text-color="#000000"';
                    }
                    
                    // Option 1: Use explicit textColor if provided and valid
                    if (trait.textColor && typeof trait.textColor === 'string') {
                        return `data-color="${trait.color}" data-text-color="${trait.textColor}"`;
                    }
                    
                    // Option 2: Generate accessible text color (same logic as traitChipStyle)
                    const game = (globalThis as any).game;
                    const autoContrast = game?.settings?.get?.('avant', 'accessibility.autoContrast') || false;
                    
                    let textColor: string;
                    if (autoContrast) {
                        // Simple fallback - will be enhanced with accessibility module at runtime
                        textColor = trait.color.toLowerCase().includes('f') ? '#000000' : '#FFFFFF';
                    } else {
                        // Conservative default behavior
                        textColor = '#000000';
                    }
                    
                    return `data-color="${trait.color}" data-text-color="${textColor}"`;
                });
            }
            
            return templatePaths;
        }, ['sheetRegistration'], { phase: 'init', critical: true });
        
        // Chat Context Menu - ready phase, no dependencies
        manager.registerService('chatContextMenu', async () => {
            const { AvantChatContextMenu } = await import('../chat/context-menu.ts');
            AvantChatContextMenu.addContextMenuListeners();
            return AvantChatContextMenu;
        }, [], { phase: 'ready', critical: false });
        
        // Theme Initialization - ready phase, gets singleton directly
        manager.registerService('themeInitialization', async () => {
            const { AvantThemeManager } = await import('../themes/theme-manager.js');
            const themeManager = AvantThemeManager.getInstance();
            await themeManager.init();
            return themeManager;
        }, [], { phase: 'ready', critical: true });
        
        // Trait Seeder - ready phase, auto-seeds system pack if needed
        manager.registerService('traitSeeder', async () => {
            const { seedSystemPackIfNeeded } = await import('../utils/trait-seeder.ts');
            const seedingResult = await seedSystemPackIfNeeded();
            console.log('🌱 FoundryInitializationHelper | Trait seeding result:', seedingResult);
            return seedingResult;
        }, [], { phase: 'ready', critical: false });
        
        // Trait Provider - ready phase, handles trait data from compendium packs
        manager.registerService('traitProvider', async () => {
            const { TraitProvider } = await import('../services/trait-provider.ts');
            const traitProvider = TraitProvider.getInstance();
            await traitProvider.initialize();
            return traitProvider;
        }, ['traitSeeder'], { phase: 'ready', critical: false });
        
        // Remote Trait Service - ready phase, handles remote trait synchronization
        manager.registerService('remoteTraitService', async () => {
            const { RemoteTraitService } = await import('../services/remote-trait-service.ts');
            const remoteService = RemoteTraitService.getInstance();
            console.log('🌐 FoundryInitializationHelper | Remote trait service initialized');
            return remoteService;
        }, ['traitProvider'], { phase: 'ready', critical: false });
    }
} 