/**
 * @fileoverview Chat Context Menu Handler for Avant Native System
 * @version 2.0.0 - FoundryVTT v13+ Only
 * @author Avant Development Team
 * @description Chat context menu for Fortune Point rerolls in v13
 */

import { AvantRerollDialog } from '../dialogs/reroll-dialog.js';
import { logger } from '../utils/logger.js';
import {
    getActorFromMessage,
    isEligibleRoll,
    extractMessageId,
    buildRerollMenuEntry,
    validateMessageForReroll,
    createRerollCallback,
    hasRerollPermission
} from '../logic/chat-context-utils.js';

/**
 * Chat Message Context Menu Handler - FoundryVTT v13+
 * @class AvantChatContextMenu
 * @description Provides Fortune Point reroll functionality via chat context menus
 */
export class AvantChatContextMenu {
    /**
     * Initialize context menu listeners for v13
     * @static
     */
    static addContextMenuListeners() {
        logger.log('Avant | Initializing v13 context menu system...');
        
        logger.log('Avant | Using v13 approach: Direct ChatLog._getEntryContextOptions extension');
        AvantChatContextMenu._initializeV13Approach();
        
        logger.log('Avant | Context menu listeners registered successfully');
    }
    
    /**
     * Initialize context menu for FoundryVTT v13
     * Uses direct ChatLog method extension
     * @static
     * @private
     */
    static _initializeV13Approach() {
        logger.log('Avant | Initializing v13 context menu approach...');
        
        // Improved initialization with multiple timing checks
        const initializeV13Menu = () => {
            if (ui.chat && ui.chat._getEntryContextOptions) {
                logger.log('Avant | ui.chat available, extending context menu...');
                AvantChatContextMenu._extendChatLogContextMenuV13();
            } else {
                logger.log('Avant | ui.chat not ready, scheduling retry...');
                // Try again after a short delay
                setTimeout(initializeV13Menu, 100);
            }
        };
        
        // Try immediate initialization
        initializeV13Menu();
        
        // Also hook into 'ready' as a backup
        Hooks.once('ready', () => {
            logger.log('Avant | Ready hook - ensuring v13 context menu is initialized...');
            setTimeout(() => {
                if (ui.chat && !ui.chat._avantExtended) {
                    logger.log('Avant | Context menu not yet extended, doing it now...');
                    AvantChatContextMenu._extendChatLogContextMenuV13();
                }
            }, 200);
        });
        
        // Additional safety - try again when chat renders
        Hooks.once('renderChatLog', () => {
            logger.log('Avant | ChatLog rendered - final context menu check...');
            setTimeout(() => {
                if (ui.chat && !ui.chat._avantExtended) {
                    logger.log('Avant | Final attempt at context menu extension...');
                    AvantChatContextMenu._extendChatLogContextMenuV13();
                }
            }, 300);
        });
    }
    
    /**
     * Extend ChatLog's context menu for v13 (WORKING SOLUTION)
     * @static
     * @private
     */
    static _extendChatLogContextMenuV13() {
        logger.log('Avant | 🎯 Extending ChatLog context menu for v13...');
        
        if (!ui.chat) {
            logger.log('Avant | ERROR: ui.chat not available');
            return;
        }
        
        // Store the original method
        const originalGetEntryContextOptions = ui.chat._getEntryContextOptions;
        
        if (!originalGetEntryContextOptions) {
            logger.log('Avant | ERROR: _getEntryContextOptions method not found on ChatLog');
            return;
        }
        
        logger.log('Avant | Found _getEntryContextOptions method, extending...');
        
        // Mark as extended to prevent duplicate extensions
        ui.chat._avantExtended = true;
        
        // Override the method
        ui.chat._getEntryContextOptions = function() {
            logger.log('Avant | 🎯 EXTENDED _getEntryContextOptions called (v13)!');
            
            // Get the original options
            const options = originalGetEntryContextOptions.call(this);
            logger.log('Avant | Original options:', options.map(opt => opt.name));
            
            // Add our reroll option using pure function delegation
            const rerollOption = AvantChatContextMenu._createRerollMenuOption();
            options.push(rerollOption);
            
            logger.log('Avant | Extended options (v13):', options.map(opt => opt.name));
            return options;
        };
        
        logger.log('Avant | ✅ ChatLog context menu extended successfully for v13!');
    }
    
    /**
     * Creates a reroll menu option using pure functions for business logic
     * @static
     * @private
     * @returns {Object} Menu option configuration
     */
    static _createRerollMenuOption() {
        return {
            name: "Reroll with Fortune Points",
            icon: '<i class="fas fa-dice"></i>',
            condition: (li) => {
                try {
                    logger.log('Avant | Condition check - li element:', li);
                    
                    // Extract message ID using pure function
                    const messageId = extractMessageId(li);
                    logger.log('Avant | Message ID:', messageId);
                    
                    if (!messageId) return false;
                    
                    const message = game.messages?.get(messageId);
                    logger.log('Avant | Message object:', message);
                    
                    if (!message) return false;
                    
                    // Use pure function to validate the entire message
                    const validation = validateMessageForReroll(message);
                    logger.log('Avant | Validation result:', validation);
                    
                    return validation.isValid;
                } catch (error) {
                    logger.error('Avant | Error in reroll condition check:', error);
                    return false;
                }
            },
            callback: (li) => {
                try {
                    logger.log('Avant | === CONTEXT MENU CALLBACK TRIGGERED ===');
                    
                    // Extract message ID using pure function
                    const messageId = extractMessageId(li);
                    const message = game.messages?.get(messageId);
                    
                    // Validate message using pure function
                    const validation = validateMessageForReroll(message);
                    
                    if (!validation.isValid) {
                        logger.log('Avant | Message validation failed:', validation.reason);
                        return;
                    }
                    
                    // Use the pure callback to get action data
                    const callbackData = createRerollCallback(validation);
                    const actionData = callbackData();
                    
                    // Perform the side effect (open dialog)
                    AvantChatContextMenu._executeRerollAction(actionData);
                } catch (error) {
                    logger.error('Avant | Error in reroll callback:', error);
                }
            }
        };
    }
    
    /**
     * Executes the reroll action by opening the dialog (side effect)
     * @static
     * @param {Object} actionData - Action data from pure callback
     * @private
     */
    static _executeRerollAction(actionData) {
        if (actionData.action !== 'openRerollDialog') {
            logger.log('Avant | Unknown action:', actionData.action);
            return;
        }
        
        const dialog = new AvantRerollDialog(
            actionData.roll, 
            actionData.actor, 
            actionData.flavor
        );
        dialog.render(true);
        logger.log('Avant | Dialog rendered');
    }
    
    /**
     * Get actor from chat message (DEPRECATED - use pure function)
     * @static
     * @param {ChatMessage} message - The chat message
     * @returns {Actor|null} The actor or null
     * @private
     * @deprecated Use getActorFromMessage from chat-context-utils.js instead
     */
    static _getActorFromMessage(message) {
        logger.log('Avant | DEPRECATED: _getActorFromMessage called, use pure function instead');
        return getActorFromMessage(message);
    }
    
    /**
     * Check if roll is eligible for reroll (DEPRECATED - use pure function)
     * @static
     * @param {Roll} roll - The roll to check
     * @returns {boolean} True if eligible
     * @private
     * @deprecated Use isEligibleRoll from chat-context-utils.js instead
     */
    static _isEligibleRoll(roll) {
        logger.log('Avant | DEPRECATED: _isEligibleRoll called, use pure function instead');
        return isEligibleRoll(roll);
    }
} 