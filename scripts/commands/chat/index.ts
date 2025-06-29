/**
 * @fileoverview Chat Commands Index
 * @version 1.0.0
 * @description Central export point for all chat commands
 * @author Avant VTT Team
 */

import type { ChatCommand } from '../base/types';
import { helpCommand } from './help';

/**
 * All available chat commands
 * Add new commands to this array for automatic registration
 */
export const chatCommands: ChatCommand[] = [
    helpCommand
    // Add new chat commands here as they are created
];

/**
 * Get chat command by name
 * 
 * @param name - Command name to find
 * @returns Chat command or undefined if not found
 */
export function getChatCommand(name: string): ChatCommand | undefined {
    return chatCommands.find(cmd => cmd.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get all chat command names
 * 
 * @returns Array of command names
 */
export function getChatCommandNames(): string[] {
    return chatCommands.map(cmd => cmd.name);
}

/**
 * Export individual commands for direct import
 */
export { helpCommand } from './help';

/**
 * Export command count for reporting
 */
export const chatCommandCount = chatCommands.length; 