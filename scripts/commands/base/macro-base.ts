/**
 * @fileoverview Base Macro Functionality
 * @version 1.0.0
 * @description Utilities and base classes specifically for macro commands
 * @author Avant VTT Team
 */

import type { MacroCommand, MacroSeed, ValidationResult } from './types';
import { CommandBase } from './command-base';

// FoundryVTT globals
declare const game: any;
declare const Macro: any;
declare const foundry: any;

/**
 * Base class for macro-specific functionality
 * Extends CommandBase with macro-specific utilities
 */
export class MacroBase extends CommandBase {
    
    /**
     * Validate macro command configuration
     * Ensures macro meets FoundryVTT requirements
     * 
     * @param macro - Macro command to validate
     * @returns Validation result
     */
    static validateMacro(macro: MacroCommand): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        
        // Validate basic properties
        const nameValidation = this.validateCommandName(macro.name);
        errors.push(...nameValidation.errors);
        warnings.push(...nameValidation.warnings);
        
        // Validate macro-specific properties
        if (!macro.command || typeof macro.command !== 'string') {
            errors.push('Macro command must be a non-empty string');
        } else {
            // Check for potentially dangerous code
            const dangerousPatterns = [
                /eval\s*\(/,
                /Function\s*\(/,
                /document\.write/,
                /localStorage\.clear/,
                /sessionStorage\.clear/
            ];
            
            for (const pattern of dangerousPatterns) {
                if (pattern.test(macro.command)) {
                    warnings.push('Macro contains potentially dangerous code patterns');
                    break;
                }
            }
            
            // Check command length
            if (macro.command.length > 50000) {
                warnings.push('Macro command is very long, consider splitting into multiple functions');
            }
        }
        
        // Validate type
        if (macro.type && !['script', 'chat'].includes(macro.type)) {
            errors.push('Macro type must be "script" or "chat"');
        }
        
        // Validate scope
        if (macro.scope && !['global', 'limited'].includes(macro.scope)) {
            errors.push('Macro scope must be "global" or "limited"');
        }
        
        // Validate image path
        if (macro.img && typeof macro.img !== 'string') {
            errors.push('Macro image must be a string path');
        }
        
        // Validate sort order
        if (macro.sort !== undefined && (typeof macro.sort !== 'number' || macro.sort < 0)) {
            errors.push('Macro sort order must be a non-negative number');
        }
        
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    /**
     * Convert MacroCommand to MacroSeed for build process
     * Transforms command definition to build-ready format
     * 
     * @param macro - Macro command to convert
     * @param options - Additional conversion options
     * @returns Macro seed for build process
     */
    static toSeed(
        macro: MacroCommand, 
        options: { timestamp?: number; index?: number } = {}
    ): MacroSeed {
        const timestamp = options.timestamp || Date.now();
        const index = options.index || 0;
        
        // Generate unique ID
        const id = `macro_${macro.name.toLowerCase().replace(/\s+/g, '_')}_${timestamp}_${index}`;
        
        return {
            id,
            name: macro.name,
            type: macro.type,
            scope: macro.scope || 'global',
            command: macro.command,
            img: macro.img || 'icons/svg/dice-target.svg',
            folder: null,
            sort: macro.sort || 0,
            ownership: { default: 3 }, // Accessible to all by default
            flags: macro.flags || {}
        };
    }
    
    /**
     * Create macro in FoundryVTT world
     * Handles the actual creation of macro documents
     * 
     * @param macro - Macro command to create
     * @returns Promise resolving to created macro or null
     */
    static async createWorldMacro(macro: MacroCommand): Promise<any | null> {
        try {
            // Check if macros collection is available
            if (!game?.macros) {
                console.warn('🎯 Macros | Macros collection not available yet');
                return null;
            }
            
            // Check if macro already exists
            const existingMacro = game.macros.find((m: any) => m.name === macro.name);
            if (existingMacro) {
                console.log(`🎯 Macros | Macro "${macro.name}" already exists`);
                return existingMacro;
            }
            
            // Create the macro
            const macroData = {
                name: macro.name,
                type: macro.type || 'script',
                scope: macro.scope || 'global',
                command: macro.command,
                img: macro.img || 'icons/svg/dice-target.svg',
                folder: null,
                sort: macro.sort || 0,
                ownership: { default: 3 },
                flags: macro.flags || {}
            };
            
            const createdMacro = await Macro.create(macroData);
            console.log(`✅ Macros | Created world macro: ${macro.name}`);
            
            return createdMacro;
            
        } catch (error) {
            console.error(`❌ Macros | Error creating macro "${macro.name}":`, error);
            return null;
        }
    }
    
    /**
     * Check if macro exists in world
     * 
     * @param name - Macro name to check
     * @returns true if macro exists
     */
    static macroExists(name: string): boolean {
        if (!game?.macros) return false;
        return game.macros.some((macro: any) => macro.name === name);
    }
    
    /**
     * Generate macro command with error handling wrapper
     * Wraps macro code in try-catch for better user experience
     * 
     * @param code - Original macro code
     * @param macroName - Name of macro for error reporting
     * @returns Wrapped macro code
     */
    static wrapMacroCode(code: string, macroName: string): string {
        return `
try {
    // Generated macro: ${macroName}
    // Execution timestamp: ${new Date().toISOString()}
    
    ${code}
    
} catch (error) {
    console.error('🎯 Macro Error | ${macroName}:', error);
    ui.notifications.error(\`Macro "${macroName}" failed: \${error.message}\`);
}`;
    }
    
    /**
     * Create fallback console function for macro creation
     * Provides manual creation when timing fails
     * 
     * @param macros - Array of macros to create
     * @param functionName - Name of the console function
     */
    static createConsoleFallback(macros: MacroCommand[], functionName: string): void {
        (globalThis as any)[functionName] = async function() {
            console.log(`🎯 Macros | Creating ${macros.length} macros...`);
            
            const results = await Promise.allSettled(
                macros.map(macro => MacroBase.createWorldMacro(macro))
            );
            
            const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
            const failed = results.length - successful;
            
            console.log(`✅ Macros | Created ${successful} macros successfully`);
            if (failed > 0) {
                console.warn(`⚠️ Macros | ${failed} macros failed to create`);
            }
            
            MacroBase.notify(
                `Created ${successful}/${macros.length} macros successfully!`,
                failed > 0 ? 'warn' : 'info'
            );
        };
        
        console.log(`🎯 Macros | Console fallback available: ${functionName}()`);
    }
    
    /**
     * Batch create multiple macros
     * Handles creation of multiple macros with progress reporting
     * 
     * @param macros - Array of macros to create
     * @returns Array of creation results
     */
    static async batchCreateMacros(macros: MacroCommand[]): Promise<Array<{ macro: MacroCommand; success: boolean; error?: string }>> {
        const results: Array<{ macro: MacroCommand; success: boolean; error?: string }> = [];
        
        for (const macro of macros) {
            try {
                const created = await this.createWorldMacro(macro);
                results.push({
                    macro,
                    success: created !== null,
                    error: created === null ? 'Creation returned null' : undefined
                });
            } catch (error) {
                results.push({
                    macro,
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        
        return results;
    }
    
    /**
     * Get macro execution statistics
     * Provides insights into macro usage and performance
     * 
     * @returns Macro statistics
     */
    static getMacroStats(): {
        totalMacros: number;
        scriptMacros: number;
        chatMacros: number;
        avantMacros: number;
    } {
        if (!game?.macros) {
            return { totalMacros: 0, scriptMacros: 0, chatMacros: 0, avantMacros: 0 };
        }
        
        const macros = Array.from(game.macros);
        
        return {
            totalMacros: macros.length,
            scriptMacros: macros.filter((m: any) => m.type === 'script').length,
            chatMacros: macros.filter((m: any) => m.type === 'chat').length,
            avantMacros: macros.filter((m: any) => m.flags?.avant).length
        };
    }
}

/**
 * Macro registry for managing macro commands
 * Extends base registry with macro-specific functionality
 */
export class MacroRegistry extends CommandBase {
    private macros = new Map<string, MacroCommand>();
    
    /**
     * Register a macro command
     * 
     * @param macro - Macro to register
     */
    register(macro: MacroCommand): void {
        // Validate before registering
        const validation = MacroBase.validateMacro(macro);
        if (!validation.valid) {
            console.error(`🎯 Macros | Invalid macro "${macro.name}":`, validation.errors);
            return;
        }
        
        // Log warnings
        if (validation.warnings.length > 0) {
            console.warn(`🎯 Macros | Warnings for macro "${macro.name}":`, validation.warnings);
        }
        
        this.macros.set(macro.name.toLowerCase(), macro);
        console.log(`🎯 Macros | Registered: ${macro.name}`);
    }
    
    /**
     * Get all registered macros
     * 
     * @returns Array of macro commands
     */
    getAll(): MacroCommand[] {
        return Array.from(this.macros.values());
    }
    
    /**
     * Get macro by name
     * 
     * @param name - Macro name
     * @returns Macro command or undefined
     */
    get(name: string): MacroCommand | undefined {
        return this.macros.get(name.toLowerCase());
    }
    
    /**
     * Convert all macros to seeds for build process
     * 
     * @returns Array of macro seeds
     */
    toSeeds(): MacroSeed[] {
        const timestamp = Date.now();
        return this.getAll().map((macro, index) => 
            MacroBase.toSeed(macro, { timestamp, index })
        );
    }
} 