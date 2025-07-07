/**
 * @fileoverview Base Command Functionality
 * @version 1.0.0
 * @description Shared utilities and base classes for chat commands and macro commands
 * @author Avant VTT Team
 */

import type { 
    PermissionLevel, 
    CommandResult, 
    CommandContext,
    ValidationResult 
} from './types';

// FoundryVTT globals - will be properly typed when available
declare const game: any;
declare const ui: any;
declare const CONST: any;

/**
 * Base command utilities class
 * Provides common functionality for all command types
 */
export class CommandBase {
    
    /**
     * Check if current user has required permission level
     * Uses native FoundryVTT permission system
     * 
     * @param required - Required permission level
     * @returns true if user has permission
     */
    static hasPermission(required: PermissionLevel): boolean {
        if (!game?.user) return false;
        
        const userRole = game.user.role;
        const requiredRole = CONST?.USER_ROLES?.[required];
        
        if (typeof requiredRole !== 'number') {
            console.warn(`🎯 Commands | Unknown permission level: ${required}`);
            return false;
        }
        
        return userRole >= requiredRole;
    }
    
    /**
     * Get current command execution context
     * Provides safe access to FoundryVTT globals
     * 
     * @returns Command execution context
     */
    static getContext(): CommandContext {
        return {
            user: game?.user,
            game: game,
            ui: ui,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Show notification to user
     * Uses FoundryVTT's native notification system
     * 
     * @param message - Message to display
     * @param type - Notification type
     */
    static notify(message: string, type: 'info' | 'warn' | 'error' = 'info'): void {
        if (!ui?.notifications) {
            console.log(`Notification [${type}]: ${message}`);
            return;
        }
        
        switch (type) {
            case 'info':
                ui.notifications.info(message);
                break;
            case 'warn':
                ui.notifications.warn(message);
                break;
            case 'error':
                ui.notifications.error(message);
                break;
        }
    }
    
    /**
     * Validate command name format
     * Ensures command names follow consistent patterns
     * 
     * @param name - Command name to validate
     * @returns Validation result
     */
    static validateCommandName(name: string): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        
        if (!name || typeof name !== 'string') {
            errors.push('Command name must be a non-empty string');
        } else {
            // Check for valid characters (alphanumeric, dash, underscore)
            if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
                errors.push('Command name can only contain letters, numbers, dashes, and underscores');
            }
            
            // Check length
            if (name.length < 2) {
                errors.push('Command name must be at least 2 characters long');
            }
            
            if (name.length > 32) {
                warnings.push('Command name is quite long, consider shortening for better UX');
            }
            
            // Check for reserved words
            const reserved = ['help', 'roll', 'r', 'chat', 'ic', 'ooc', 'emote', 'scene'];
            if (reserved.includes(name.toLowerCase())) {
                warnings.push(`Command name '${name}' may conflict with FoundryVTT built-ins`);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    /**
     * Validate permission level
     * Ensures permission levels are valid FoundryVTT roles
     * 
     * @param permission - Permission level to validate
     * @returns Validation result
     */
    static validatePermission(permission: PermissionLevel): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        
        const validPermissions: PermissionLevel[] = ['PLAYER', 'TRUSTED_PLAYER', 'ASSISTANT_GM', 'GAMEMASTER'];
        
        if (!validPermissions.includes(permission)) {
            errors.push(`Invalid permission level: ${permission}. Must be one of: ${validPermissions.join(', ')}`);
        }
        
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    /**
     * Safe async execution wrapper
     * Provides consistent error handling for command execution
     * 
     * @param operation - Async operation to execute
     * @param context - Execution context for logging
     * @returns Command result
     */
    static async safeExecute<T>(
        operation: () => Promise<T>, 
        context: string
    ): Promise<CommandResult & { data?: T }> {
        try {
            const data = await operation();
            return {
                success: true,
                data
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`🎯 Commands | Error in ${context}:`, error);
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    
    /**
     * Parse command arguments
     * Handles quoted strings and provides consistent argument parsing
     * 
     * @param argsString - Raw arguments string
     * @returns Parsed arguments array
     */
    static parseArguments(argsString: string): string[] {
        if (!argsString?.trim()) return [];
        
        const args: string[] = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < argsString.length; i++) {
            const char = argsString[i];
            
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
            } else if (char === ' ' && !inQuotes) {
                if (current.trim()) {
                    args.push(current.trim());
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current.trim()) {
            args.push(current.trim());
        }
        
        return args;
    }
    
    /**
     * Generate help text for command
     * Creates consistent help documentation
     * 
     * @param name - Command name
     * @param description - Command description
     * @param args - Command arguments (optional)
     * @param examples - Usage examples (optional)
     * @returns Formatted help text
     */
    static generateHelpText(
        name: string, 
        description: string, 
        args?: string[], 
        examples?: string[]
    ): string {
        let help = `<strong>/${name}</strong> - ${description}`;
        
        if (args && args.length > 0) {
            help += `<br><em>Arguments:</em> ${args.join(', ')}`;
        }
        
        if (examples && examples.length > 0) {
            help += `<br><em>Examples:</em>`;
            examples.forEach(example => {
                help += `<br>  • ${example}`;
            });
        }
        
        return help;
    }
    
    /**
     * Log command execution
     * Provides consistent logging for debugging and monitoring
     * 
     * @param type - Command type ('chat' or 'macro')
     * @param name - Command name
     * @param success - Whether execution was successful
     * @param duration - Execution duration in milliseconds (optional)
     */
    static logExecution(
        type: 'chat' | 'macro', 
        name: string, 
        success: boolean, 
        duration?: number
    ): void {
        const status = success ? '✅' : '❌';
        const durationText = duration ? ` (${duration}ms)` : '';
        
        console.log(`🎯 Commands | ${status} ${type}:${name} executed${durationText}`);
    }
}

/**
 * Command registry base class
 * Provides common functionality for managing command collections
 */
export class CommandRegistryBase<T extends { name: string }> {
    private commands = new Map<string, T>();
    
    /**
     * Register a command
     * 
     * @param command - Command to register
     */
    register(command: T): void {
        this.commands.set(command.name.toLowerCase(), command);
        console.log(`🎯 Commands | Registered: ${command.name}`);
    }
    
    /**
     * Unregister a command
     * 
     * @param name - Command name to unregister
     * @returns true if command was found and removed
     */
    unregister(name: string): boolean {
        const removed = this.commands.delete(name.toLowerCase());
        if (removed) {
            console.log(`🎯 Commands | Unregistered: ${name}`);
        }
        return removed;
    }
    
    /**
     * Get command by name
     * 
     * @param name - Command name
     * @returns Command or undefined if not found
     */
    get(name: string): T | undefined {
        return this.commands.get(name.toLowerCase());
    }
    
    /**
     * Get all commands
     * 
     * @returns Array of all registered commands
     */
    getAll(): T[] {
        return Array.from(this.commands.values());
    }
    
    /**
     * Check if command exists
     * 
     * @param name - Command name
     * @returns true if command is registered
     */
    has(name: string): boolean {
        return this.commands.has(name.toLowerCase());
    }
    
    /**
     * Get number of registered commands
     * 
     * @returns Number of commands
     */
    size(): number {
        return this.commands.size;
    }
    
    /**
     * Clear all commands
     */
    clear(): void {
        this.commands.clear();
        console.log(`🎯 Commands | Cleared all commands`);
    }
} 