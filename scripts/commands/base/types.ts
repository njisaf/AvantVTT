/**
 * @fileoverview Shared Types for Commands Module
 * @version 1.0.0
 * @description TypeScript interfaces and types for chat commands and macro commands
 * @author Avant VTT Team
 */

/**
 * Permission levels for commands
 * Uses FoundryVTT's built-in user role system
 */
export type PermissionLevel = 'PLAYER' | 'TRUSTED_PLAYER' | 'ASSISTANT_GM' | 'GAMEMASTER';

/**
 * Chat command configuration interface
 * Defines the structure for all chat commands
 */
export interface ChatCommand {
    /** Command name (without /) */
    name: string;
    /** Command description for help */
    description: string;
    /** Permission level required */
    permission: PermissionLevel;
    /** Command handler function */
    handler: (args: string[], rawMessage: string) => Promise<boolean>;
}

/**
 * Macro command configuration interface
 * Defines the structure for all macro commands
 */
export interface MacroCommand {
    /** Macro name displayed in FoundryVTT */
    name: string;
    /** Macro type - usually 'script' */
    type: 'script' | 'chat';
    /** Macro scope - 'global' for world-wide access */
    scope?: 'global' | 'limited';
    /** The actual macro command code */
    command: string;
    /** Icon path for the macro */
    img?: string;
    /** Sort order for display */
    sort?: number;
    /** Additional macro flags */
    flags?: {
        avant?: {
            description?: string;
            version?: string;
            category?: string;
        };
        [key: string]: any;
    };
}

/**
 * Command execution result
 * Standard result format for both chat and macro commands
 */
export interface CommandResult {
    /** Whether the command executed successfully */
    success: boolean;
    /** Error message if execution failed */
    error?: string;
    /** Additional result data */
    data?: any;
}

/**
 * Command registry interface
 * Used for managing collections of commands
 */
export interface CommandRegistry<T> {
    /** Get command by name */
    get(name: string): T | undefined;
    /** Register a new command */
    register(command: T): void;
    /** Unregister a command */
    unregister(name: string): boolean;
    /** Get all commands */
    getAll(): T[];
    /** Get commands available to current user */
    getAvailable(): T[];
}

/**
 * Base command configuration for initialization
 */
export interface CommandModuleConfig {
    /** System identifier */
    systemId: string;
    /** Whether to enable chat commands */
    enableChatCommands?: boolean;
    /** Whether to enable macro commands */
    enableMacroCommands?: boolean;
    /** Custom permission checker function */
    permissionChecker?: (permission: PermissionLevel) => boolean;
    /** Custom error handler */
    errorHandler?: (error: Error, command: string) => void;
}

/**
 * Command execution context
 * Provides context information during command execution
 */
export interface CommandContext {
    /** Current user executing the command */
    user?: any; // FoundryVTT User object
    /** Current game state */
    game?: any; // FoundryVTT Game object
    /** UI utilities */
    ui?: any; // FoundryVTT UI object
    /** Additional context data */
    [key: string]: any;
}

/**
 * Macro generation data for build process
 * Used during compendium pack generation
 */
export interface MacroSeed {
    /** Unique identifier for the macro */
    id?: string;
    /** Macro name */
    name: string;
    /** Macro type */
    type: 'script' | 'chat';
    /** Macro scope */
    scope?: string;
    /** Macro command code */
    command: string;
    /** Icon path */
    img?: string;
    /** Folder reference */
    folder?: string | null;
    /** Sort order */
    sort?: number;
    /** Ownership settings */
    ownership?: Record<string, number>;
    /** Macro flags */
    flags?: Record<string, any>;
}

/**
 * Command validation result
 * Used for validating command configurations
 */
export interface ValidationResult {
    /** Whether validation passed */
    valid: boolean;
    /** Validation errors */
    errors: string[];
    /** Validation warnings */
    warnings: string[];
}

/**
 * Event handler for command lifecycle events
 */
export type CommandEventHandler = (event: string, data: any) => void;

/**
 * Command module events
 */
export interface CommandEvents {
    /** Fired when a command is registered */
    'command:registered': { type: 'chat' | 'macro'; name: string };
    /** Fired when a command is executed */
    'command:executed': { type: 'chat' | 'macro'; name: string; success: boolean };
    /** Fired when a command fails */
    'command:failed': { type: 'chat' | 'macro'; name: string; error: string };
    /** Fired when the module is initialized */
    'module:initialized': { chatCommands: number; macroCommands: number };
}

// All types are exported inline above 