/**
 * @fileoverview Commands Module Main Index
 * @version 1.0.0
 * @description Central export point for the entire commands module
 * @author Avant VTT Team
 */

import type { 
    ChatCommand, 
    MacroCommand, 
    CommandModuleConfig, 
    CommandResult,
    MacroSeed 
} from './base/types';
import { CommandBase, CommandRegistryBase } from './base/command-base';
import { MacroBase, MacroRegistry } from './base/macro-base';
import { chatCommands, getChatCommand, getChatCommandNames, chatCommandCount } from './chat';
import { macroCommands, getMacroCommand, getMacroCommandNames, getMacroSeeds, macroCommandCount } from './macros';

// FoundryVTT globals
declare const game: any;
declare const ui: any;
declare const Hooks: any;
declare const CONST: any;
declare const ChatMessage: any;

/**
 * Commands Module
 * Main class that provides unified access to both chat commands and macro commands
 */
export class CommandsModule {
    private static instance: CommandsModule | null = null;
    private chatRegistry = new CommandRegistryBase<ChatCommand>();
    private macroRegistry = new MacroRegistry();
    private config: CommandModuleConfig;
    private initialized = false;

    constructor(config: CommandModuleConfig) {
        this.config = {
            enableChatCommands: true,
            enableMacroCommands: true,
            ...config
        };
    }

    /**
     * Get singleton instance
     * 
     * @param config - Module configuration
     * @returns CommandsModule instance
     */
    static getInstance(config?: CommandModuleConfig): CommandsModule {
        if (!CommandsModule.instance && config) {
            CommandsModule.instance = new CommandsModule(config);
        }
        return CommandsModule.instance!;
    }

    /**
     * Initialize the commands module
     * Sets up chat command hooks and macro registration
     * 
     * @returns Promise resolving to initialization result
     */
    async initialize(): Promise<CommandResult> {
        if (this.initialized) {
            return { success: true, data: 'Already initialized' };
        }

        try {
            console.log('🎯 Commands | Initializing commands module...');

            // Register chat commands
            if (this.config.enableChatCommands) {
                this.initializeChatCommands();
            }

            // Register macro commands
            if (this.config.enableMacroCommands) {
                this.initializeMacroCommands();
            }

            this.initialized = true;

            const stats = {
                chatCommands: this.config.enableChatCommands ? chatCommandCount : 0,
                macroCommands: this.config.enableMacroCommands ? macroCommandCount : 0
            };

            console.log(`✅ Commands | Module initialized with ${stats.chatCommands} chat commands and ${stats.macroCommands} macro commands`);

            return {
                success: true,
                data: stats
            };

        } catch (error) {
            console.error('🎯 Commands | Initialization failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Initialize chat commands
     * Sets up chat message hook and registers all chat commands
     */
    private initializeChatCommands(): void {
        // Register all chat commands
        for (const command of chatCommands) {
            this.chatRegistry.register(command);
        }

        // Set up chat message hook
        Hooks.on('chatMessage', this.processChatMessage.bind(this));

        console.log(`🎯 Commands | Registered ${chatCommands.length} chat commands`);
    }

    /**
     * Initialize macro commands
     * Registers all macro commands for world creation and build process
     */
    private initializeMacroCommands(): void {
        // Register all macro commands
        for (const macro of macroCommands) {
            this.macroRegistry.register(macro);
        }

        console.log(`🎯 Commands | Registered ${macroCommands.length} macro commands`);
    }

    /**
     * Process chat messages for command detection
     * 
     * @param chatLog - Chat log element
     * @param messageText - Message text
     * @param chatData - Chat message data
     * @returns true if command was processed, false otherwise
     */
    private async processChatMessage(chatLog: any, messageText: string, chatData: any): Promise<boolean> {
        // Check if message starts with command prefix
        if (!messageText.startsWith('/')) {
            return true; // Not a command, let it pass through
        }

        // Parse command and arguments
        const trimmed = messageText.slice(1).trim();
        const [commandName, ...argParts] = trimmed.split(' ');
        const args = CommandBase.parseArguments(argParts.join(' '));

        // Find command
        const command = this.chatRegistry.get(commandName);
        if (!command) {
            return true; // Command not found, let FoundryVTT handle it
        }

        // Check permissions
        if (!CommandBase.hasPermission(command.permission)) {
            CommandBase.notify(`You don't have permission to use /${commandName}`, 'warn');
            return false; // Block the message
        }

        // Execute command
        const startTime = Date.now();
        try {
            const result = await command.handler(args, messageText);
            const duration = Date.now() - startTime;
            
            CommandBase.logExecution('chat', commandName, result, duration);
            
            return false; // Block the original message

        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`🎯 Commands | Chat command /${commandName} failed:`, error);
            
            CommandBase.logExecution('chat', commandName, false, duration);
            CommandBase.notify(`Command /${commandName} failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
            
            return false; // Block the message even on error
        }
    }

    /**
     * Create world macros from registered macro commands
     * 
     * @returns Promise resolving to creation results
     */
    async createWorldMacros(): Promise<Array<{ macro: MacroCommand; success: boolean; error?: string }>> {
        if (!this.config.enableMacroCommands) {
            return [];
        }

        console.log(`🎯 Macros | Creating ${macroCommands.length} world macros...`);
        
        const results = await MacroBase.batchCreateMacros(macroCommands);
        
        // Set up console fallback
        MacroBase.createConsoleFallback(macroCommands, 'createAvantMacros');
        
        return results;
    }

    /**
     * Get macro seeds for build process
     * 
     * @returns Array of macro seeds
     */
    getMacroSeeds(): MacroSeed[] {
        if (!this.config.enableMacroCommands) {
            return [];
        }
        
        return getMacroSeeds();
    }

    /**
     * Get module statistics
     * 
     * @returns Module statistics
     */
    getStats() {
        return {
            initialized: this.initialized,
            chatCommands: this.config.enableChatCommands ? chatCommandCount : 0,
            macroCommands: this.config.enableMacroCommands ? macroCommandCount : 0,
            macroStats: MacroBase.getMacroStats()
        };
    }
}

/**
 * Initialize the commands module for Avant system
 * Convenience function for easy system integration
 * 
 * @returns Promise resolving to CommandsModule instance
 */
export async function initializeAvantCommands(): Promise<CommandsModule> {
    const config: CommandModuleConfig = {
        systemId: 'avant',
        enableChatCommands: true,
        enableMacroCommands: true
    };

    const commandsModule = CommandsModule.getInstance(config);
    await commandsModule.initialize();
    
    return commandsModule;
}

/**
 * Export everything for external use
 */
export {
    // Base classes and utilities
    CommandBase,
    CommandRegistryBase,
    MacroBase,
    MacroRegistry,
    
    // Chat commands
    chatCommands,
    getChatCommand,
    getChatCommandNames,
    chatCommandCount,
    
    // Macro commands
    macroCommands,
    getMacroCommand,
    getMacroCommandNames,
    getMacroSeeds,
    macroCommandCount
};

// Export types
export type {
    ChatCommand,
    MacroCommand,
    CommandModuleConfig,
    CommandResult,
    MacroSeed
} from './base/types';

// Export specific commands for direct access
export * from './chat';
export * from './macros'; 