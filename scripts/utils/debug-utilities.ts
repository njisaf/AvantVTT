/**
 * @fileoverview Debug Utilities Module
 * @version 1.0.0
 * @description Utilities for debugging ApplicationV2 sheet rendering and template issues
 * 
 * This module provides centralized debugging utilities for diagnosing common
 * ApplicationV2 template and rendering issues.
 * 
 * DESIGN PRINCIPLES:
 * - Centralized debugging logic
 * - Conditional logging based on configuration
 * - Comprehensive template path investigation
 * - Handlebars integration debugging
 * - Performance monitoring utilities
 */

import { logger } from './logger.js';

/**
 * Debug Configuration
 * 
 * Configuration for controlling debug output behavior.
 */
export interface DebugConfig {
    /** Whether to enable debug logging */
    enabled: boolean;
    /** Whether to enable console logging */
    enableConsole: boolean;
    /** Whether to enable template path investigation */
    enableTemplateDebugging: boolean;
    /** Whether to enable context debugging */
    enableContextDebugging: boolean;
    /** Whether to enable performance monitoring */
    enablePerformanceMonitoring: boolean;
    /** Log level for debug output */
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Default debug configuration
 */
export const DEFAULT_DEBUG_CONFIG: DebugConfig = {
    enabled: true,
    enableConsole: true,
    enableTemplateDebugging: true,
    enableContextDebugging: true,
    enablePerformanceMonitoring: true,
    logLevel: 'debug'
};

/**
 * Template Debug Information
 * 
 * Information about template paths and configuration.
 */
export interface TemplateDebugInfo {
    /** Template from parts configuration */
    templateFromParts?: string;
    /** Template from options */
    templateFromOptions?: string;
    /** Template from context */
    templateFromContext?: string;
    /** Actual template being used */
    actualTemplate?: string;
    /** Parts configuration */
    partsConfig?: any;
    /** Options configuration */
    optionsConfig?: any;
    /** Available partials */
    availablePartials?: string[];
}

/**
 * Context Debug Information
 * 
 * Information about template context data.
 */
export interface ContextDebugInfo {
    /** Context keys */
    contextKeys: string[];
    /** System keys */
    systemKeys: string[];
    /** Document information */
    documentInfo: {
        type?: string;
        id?: string;
        name?: string;
        exists: boolean;
    };
    /** Display traits information */
    displayTraitsInfo: {
        exists: boolean;
        type: string;
        length: number;
        firstItem?: any;
    };
    /** Meta information */
    metaInfo: {
        hasMetaFields: boolean;
        metaFieldCount: number;
        hasBodyFields: boolean;
        bodyFieldCount: number;
    };
}

/**
 * PHASE 4 DEBUG UTILITY
 * 
 * Investigate template paths for ApplicationV2 debugging
 * 
 * Provides comprehensive information about template path resolution
 * to help diagnose template loading issues.
 * 
 * @param sheet - The ApplicationV2 sheet instance
 * @param context - Template context data
 * @param config - Debug configuration
 * @returns Template debug information
 */
export function investigateTemplatePaths(
    sheet: any,
    context: any,
    config: DebugConfig = DEFAULT_DEBUG_CONFIG
): TemplateDebugInfo {
    const partsConfig = sheet.parts;
    const templateFromParts = partsConfig?.form?.template;
    const templateFromOptions = sheet.options.template;
    const templateFromContext = context?.template;
    const actualTemplate = sheet.options.parts?.form?.template || sheet.options.template;

    const debugInfo: TemplateDebugInfo = {
        templateFromParts,
        templateFromOptions,
        templateFromContext,
        actualTemplate,
        partsConfig: sheet.options.parts || {},
        optionsConfig: {
            keys: Object.keys(sheet.options),
            template: sheet.options.template,
            parts: sheet.options.parts
        }
    };

    // Get available Handlebars partials
    try {
        const handlebars = (globalThis as any).Handlebars;
        if (handlebars && handlebars.partials) {
            debugInfo.availablePartials = Object.keys(handlebars.partials);
        }
    } catch (error) {
        if (config.enabled) {
            logger.warn('DebugUtilities | Error accessing Handlebars partials:', error);
        }
    }

    if (config.enabled && config.enableTemplateDebugging) {
        logger.debug('DebugUtilities | Template path investigation:', {
            itemType: sheet.document?.type,
            templateFromParts,
            templateFromOptions,
            templateFromContext,
            actualTemplate,
            partsConfig: debugInfo.partsConfig,
            partsKeys: Object.keys(debugInfo.partsConfig),
            optionsKeys: Object.keys(sheet.options),
            availablePartials: debugInfo.availablePartials?.slice(0, 10) // Limit for readability
        });
    }

    return debugInfo;
}

/**
 * PHASE 4 DEBUG UTILITY
 * 
 * Investigate context data for ApplicationV2 debugging
 * 
 * Provides comprehensive information about template context data
 * to help diagnose context-related issues.
 * 
 * @param sheet - The ApplicationV2 sheet instance
 * @param context - Template context data
 * @param config - Debug configuration
 * @returns Context debug information
 */
export function investigateContextData(
    sheet: any,
    context: any,
    config: DebugConfig = DEFAULT_DEBUG_CONFIG
): ContextDebugInfo {
    const debugInfo: ContextDebugInfo = {
        contextKeys: Object.keys(context),
        systemKeys: Object.keys(context.system || {}),
        documentInfo: {
            type: sheet.document?.type,
            id: sheet.document?.id,
            name: sheet.document?.name,
            exists: !!sheet.document
        },
        displayTraitsInfo: {
            exists: !!context.displayTraits,
            type: typeof context.displayTraits,
            length: context.displayTraits?.length || 0,
            firstItem: context.displayTraits?.[0]
        },
        metaInfo: {
            hasMetaFields: !!context.metaFields,
            metaFieldCount: context.metaFields?.length || 0,
            hasBodyFields: !!context.bodyFields,
            bodyFieldCount: context.bodyFields?.length || 0
        }
    };

    if (config.enabled && config.enableContextDebugging) {
        logger.debug('DebugUtilities | Context data investigation:', {
            contextKeys: debugInfo.contextKeys,
            systemKeys: debugInfo.systemKeys,
            documentInfo: debugInfo.documentInfo,
            displayTraitsInfo: debugInfo.displayTraitsInfo,
            metaInfo: debugInfo.metaInfo
        });
    }

    return debugInfo;
}

/**
 * PHASE 4 DEBUG UTILITY
 * 
 * Log render debugging information
 * 
 * Provides comprehensive logging for ApplicationV2 render debugging.
 * 
 * @param sheet - The ApplicationV2 sheet instance
 * @param context - Template context data
 * @param options - Render options
 * @param config - Debug configuration
 * @returns Combined debug information
 */
export function logRenderDebugInfo(
    sheet: any,
    context: any,
    options: any,
    config: DebugConfig = DEFAULT_DEBUG_CONFIG
): { templateInfo: TemplateDebugInfo; contextInfo: ContextDebugInfo } {
    const templateInfo = investigateTemplatePaths(sheet, context, config);
    const contextInfo = investigateContextData(sheet, context, config);

    if (config.enabled && config.enableConsole) {
        console.log('🔧 RENDER DEBUG | Template investigation:', {
            itemType: sheet.document?.type,
            actualTemplate: templateInfo.actualTemplate,
            availablePartials: templateInfo.availablePartials?.slice(0, 5),
            contextKeys: contextInfo.contextKeys.slice(0, 10),
            displayTraitsLength: contextInfo.displayTraitsInfo.length
        });
    }

    return { templateInfo, contextInfo };
}

/**
 * PHASE 4 DEBUG UTILITY
 * 
 * Log post-render debugging information
 * 
 * Provides comprehensive logging after template rendering.
 * 
 * @param sheet - The ApplicationV2 sheet instance
 * @param context - Template context data
 * @param renderedHtml - The rendered HTML content
 * @param processingTime - Time taken to render
 * @param config - Debug configuration
 */
export function logPostRenderDebugInfo(
    sheet: any,
    context: any,
    renderedHtml: any,
    processingTime: number,
    config: DebugConfig = DEFAULT_DEBUG_CONFIG
): void {
    if (!config.enabled) {
        return;
    }

    // Handle both string and object returns from ApplicationV2
    const htmlString = typeof renderedHtml === 'string' ? renderedHtml : JSON.stringify(renderedHtml);
    const htmlLength = htmlString.length;
    const htmlPreview = htmlString.substring(0, 200);
    const hasTraitElements = htmlString.includes('trait-chip') || htmlString.includes('displayTraits');

    if (config.enableConsole) {
        console.log('🔧 TEMPLATE RENDER DEBUG | After template render:', {
            itemType: sheet.document?.type,
            contextKeys: Object.keys(context).slice(0, 10),
            htmlLength,
            htmlPreview,
            hasTraitElements,
            processingTime,
            displayTraitsInContext: !!context.displayTraits,
            displayTraitsLength: context.displayTraits?.length || 0,
            renderedHtmlType: typeof renderedHtml,
            renderedHtmlStructure: typeof renderedHtml === 'object' ? Object.keys(renderedHtml || {}) : 'string'
        });
    }

    if (config.enablePerformanceMonitoring) {
        logger.debug('DebugUtilities | Post-render performance:', {
            processingTime,
            htmlLength,
            contextSize: Object.keys(context).length,
            hasTraitElements,
            itemType: sheet.document?.type
        });
    }
}

/**
 * PHASE 4 DEBUG UTILITY
 * 
 * Create performance timer
 * 
 * Creates a simple performance timer for measuring operation duration.
 * 
 * @param label - Label for the timer
 * @param config - Debug configuration
 * @returns Timer object with start and stop methods
 */
export function createPerformanceTimer(
    label: string,
    config: DebugConfig = DEFAULT_DEBUG_CONFIG
): { start: () => void; stop: () => number } {
    let startTime: number;

    return {
        start: () => {
            startTime = Date.now();
            if (config.enabled && config.enablePerformanceMonitoring) {
                logger.debug(`DebugUtilities | Performance timer started: ${label}`);
            }
        },
        stop: () => {
            const duration = Date.now() - startTime;
            if (config.enabled && config.enablePerformanceMonitoring) {
                logger.debug(`DebugUtilities | Performance timer stopped: ${label} (${duration}ms)`);
            }
            return duration;
        }
    };
}

/**
 * PHASE 4 DEBUG UTILITY
 * 
 * Log error with context
 * 
 * Logs errors with additional context information for debugging.
 * 
 * @param error - The error to log
 * @param context - Additional context information
 * @param config - Debug configuration
 */
export function logErrorWithContext(
    error: Error | string,
    context: Record<string, any>,
    config: DebugConfig = DEFAULT_DEBUG_CONFIG
): void {
    if (!config.enabled) {
        return;
    }

    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('DebugUtilities | Error with context:', {
        error: errorMessage,
        stack: errorStack,
        context
    });

    if (config.enableConsole) {
        console.error('🔧 DEBUG ERROR:', {
            error: errorMessage,
            context
        });
    }
}

/**
 * PHASE 4 DEBUG UTILITY
 * 
 * Create debug-enabled function wrapper
 * 
 * Wraps a function with debug logging and performance monitoring.
 * 
 * @param fn - The function to wrap
 * @param label - Label for debug logging
 * @param config - Debug configuration
 * @returns Wrapped function with debug capabilities
 */
export function createDebugWrapper<T extends (...args: any[]) => any>(
    fn: T,
    label: string,
    config: DebugConfig = DEFAULT_DEBUG_CONFIG
): T {
    return ((...args: Parameters<T>) => {
        if (!config.enabled) {
            return fn(...args);
        }

        const timer = createPerformanceTimer(label, config);
        timer.start();

        try {
            const result = fn(...args);
            const duration = timer.stop();

            if (config.enablePerformanceMonitoring) {
                logger.debug(`DebugUtilities | Function ${label} completed in ${duration}ms`);
            }

            return result;
        } catch (error) {
            const duration = timer.stop();
            logErrorWithContext(error as Error, {
                function: label,
                duration,
                arguments: args.length
            }, config);
            throw error;
        }
    }) as T;
}