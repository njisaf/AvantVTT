/**
 * @fileoverview Help Chat Command
 * @version 1.0.0
 * @description Displays available chat commands and trait management guidance
 * @author Avant VTT Team
 */

import type { ChatCommand } from '../base/types';

// FoundryVTT globals
declare const game: any;
declare const ui: any;
declare const CONST: any;
declare const ChatMessage: any;

/**
 * Help command implementation
 * Shows available chat commands and comprehensive trait management guidance
 */
export const helpCommand: ChatCommand = {
    name: 'help',
    description: 'Show available chat commands and trait management guidance',
    permission: 'PLAYER',
    handler: handleHelpCommand
};

/**
 * Handle /help command execution
 * Shows available chat commands using native FoundryVTT chat API
 * 
 * @param args - Command arguments (unused for help)
 * @param rawMessage - Original message text (unused for help)
 * @returns Promise resolving to true on success
 */
async function handleHelpCommand(args: string[], rawMessage: string): Promise<boolean> {
    try {
        console.log('🎯 Commands | Executing help command');
        
        // Build comprehensive help message
        const helpMessage = buildHelpMessage();
        
        // Send help message using native FoundryVTT chat API
        await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ user: game.user }),
            content: helpMessage,
            whisper: [game.user.id], // Whisper to self
            style: CONST.CHAT_MESSAGE_STYLES.OOC
        });
        
        console.log('✅ Commands | Help message sent successfully');
        return true;
        
    } catch (error) {
        console.error('🎯 Commands | Error in help command:', error);
        
        // Fallback notification if chat message fails
        if (ui?.notifications) {
            ui.notifications.error('Failed to display help information');
        }
        
        throw error;
    }
}

/**
 * Build the comprehensive help message
 * Creates formatted HTML help content with all available commands and guidance
 * 
 * @returns Formatted HTML help message
 */
function buildHelpMessage(): string {
    let helpMessage = '<h3>🎯 Avant Chat Commands</h3>';
    helpMessage += '<p><em>For trait import/export, use the macros in the "Avant Macros" compendium pack.</em></p>';
    
    // Add available chat commands section
    helpMessage += '<ul>';
    helpMessage += '<li><strong>/help</strong> - Show available chat commands and trait management guidance</li>';
    helpMessage += '</ul>';
    
    // Add comprehensive trait management guidance
    helpMessage += buildTraitManagementHelp();
    
    return helpMessage;
}

/**
 * Build trait management help section
 * Creates detailed guidance for trait-related operations
 * 
 * @returns Formatted HTML for trait management help
 */
function buildTraitManagementHelp(): string {
    let traitHelp = '<p><strong>📦 Trait Management (Use Macros):</strong></p>';
    traitHelp += '<ul>';
    
    // Import traits guidance
    traitHelp += '<li><strong>Import Traits:</strong> Open "Avant Macros" compendium → Find "Import to Avant Traits" → Right-click → Execute</li>';
    
    // Create trait guidance
    traitHelp += '<li><strong>Create Trait:</strong> Open "Avant Macros" compendium → Find "Create Custom Trait" → Right-click → Execute</li>';
    
    // Export traits guidance
    traitHelp += '<li><strong>Export Traits:</strong> Open "Avant Macros" compendium → Find "Export Custom Traits" → Right-click → Execute</li>';
    
    // Hotbar access
    traitHelp += '<li><strong>Hotbar Access:</strong> Drag any macro from compendium to your hotbar → Click to run</li>';
    
    // Auto-created macros
    traitHelp += '<li><strong>Auto-Created:</strong> Check Macro Directory for auto-created "Import Avant Traits" and "Create Custom Trait" macros</li>';
    
    traitHelp += '</ul>';
    
    // Add best practices
    traitHelp += '<p><em>💡 Best Practice: Drag macros to hotbar for one-click access! The "Create Custom Trait" macro will automatically set up the custom traits compendium and open a new trait sheet for editing.</em></p>';
    
    return traitHelp;
}

/**
 * Check if current user has permission to see a command
 * Uses FoundryVTT's native permission system
 * 
 * @param permission - Required permission level
 * @returns true if user has permission
 */
function hasPermission(permission: string): boolean {
    if (!game?.user) return false;
    
    const userRole = game.user.role;
    const requiredRole = CONST?.USER_ROLES?.[permission];
    
    if (typeof requiredRole !== 'number') {
        console.warn(`🎯 Commands | Unknown permission level: ${permission}`);
        return false;
    }
    
    return userRole >= requiredRole;
}

/**
 * Export the help command for registration
 */
export default helpCommand; 