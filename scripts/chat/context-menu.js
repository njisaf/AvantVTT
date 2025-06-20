/**
 * @fileoverview Chat Context Menu Handler for Avant Native System
 * @version 2.0.0
 * @author Avant Development Team
 * @description Version-aware chat context menu for Fortune Point rerolls
 */

import { CompatibilityUtils } from '../utils/compatibility.js';
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
 * Chat Message Context Menu Handler - Version-Aware Implementation
 * Supports both v12 and v13 FoundryVTT versions
 * @class AvantChatContextMenu
 * @description Provides Fortune Point reroll functionality via chat context menus
 */
export class AvantChatContextMenu {
    /**
     * Initialize context menu listeners with version detection
     * @static
     */
    static addContextMenuListeners() {
        logger.log('Avant | Initializing version-aware context menu system...');
        
        const approach = CompatibilityUtils.getChatContextMenuApproach();
        logger.log(`Using ${approach} approach for chat context menu`);
        
        if (approach === 'v13') {
            logger.log('Avant | Using v13 approach: Direct ChatLog._getEntryContextOptions extension');
            AvantChatContextMenu._initializeV13Approach();
        } else {
            logger.log('Avant | Using v12 approach: Traditional hook-based method');
            AvantChatContextMenu._initializeV12Approach();
        }
        
        logger.log('Avant | Context menu listeners registered successfully');
    }
    
    /**
     * Initialize context menu for FoundryVTT v13
     * Uses direct ChatLog method extension (PROVEN WORKING)
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
     * Initialize context menu for FoundryVTT v12
     * Uses traditional hook-based approach
     * @static
     * @private
     */
    static _initializeV12Approach() {
        logger.log('Avant | Setting up v12 hook-based context menu...');
        
        // Immediate hook registration
        Hooks.on('getChatLogEntryContext', (html, options) => {
            logger.log('Avant | 🎯 getChatLogEntryContext hook fired (v12)');
            AvantChatContextMenu._addRerollOptionV12(html, options);
        });
        
        // Also try getDocumentContextOptions as backup
        Hooks.on('getDocumentContextOptions', (document, options) => {
            logger.log('Avant | 🎯 getDocumentContextOptions hook fired (v12)');
            if (document instanceof ChatMessage) {
                AvantChatContextMenu._addRerollOptionForDocument(document, options);
            }
        });
        
        // Additional v12 hook for immediate availability
        Hooks.once('renderChatLog', () => {
            logger.log('Avant | v12 ChatLog rendered - context menu should be available');
        });
        
        logger.log('Avant | v12 hooks registered successfully');
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
     * Add reroll option for v12 hook-based approach
     * @static
     * @param {jQuery} html - The HTML element
     * @param {Array} options - The context menu options
     * @private
     */
    static _addRerollOptionV12(html, options) {
        logger.log('Avant | Adding reroll option via v12 hook approach');
        
        const rerollOption = AvantChatContextMenu._createRerollMenuOption();
        options.push(rerollOption);
        
        logger.log('Avant | Reroll option added via v12 hook');
    }

    /**
     * Add reroll option for document-based context menu (v12 fallback)
     * @static
     * @param {ChatMessage} document - The chat message document
     * @param {Array} options - The context menu options
     * @private
     */
    static _addRerollOptionForDocument(document, options) {
        logger.log('Avant | Adding reroll option for document approach (v12 fallback)');
        
        if (!(document instanceof ChatMessage)) {
            logger.log('Avant | Document is not a ChatMessage');
            return;
        }
        
        // Use pure function to validate message
        const validation = validateMessageForReroll(document);
        
        if (!validation.isValid) {
            logger.log('Avant | Message not eligible for reroll (document approach):', validation.reason);
            return;
        }
        
        options.push({
            name: "Reroll with Fortune Points",
            icon: '<i class="fas fa-dice"></i>',
            condition: () => true, // Already checked above
            callback: () => {
                logger.log('Avant | === DOCUMENT CONTEXT MENU CALLBACK TRIGGERED ===');
                
                // Use pure callback to get action data
                const callbackData = createRerollCallback(validation);
                const actionData = callbackData();
                
                // Perform the side effect (open dialog)
                AvantChatContextMenu._executeRerollAction(actionData);
            }
        });
        
        logger.log('Avant | Reroll option added via document approach');
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