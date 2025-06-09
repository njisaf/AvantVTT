/**
 * @fileoverview Chat Context Menu Handler for Avant Native System
 * @version 2.0.0
 * @author Avant Development Team
 * @description Version-aware chat context menu for Fortune Point rerolls
 */

import { CompatibilityUtils } from '../utils/compatibility.js';
import { AvantRerollDialog } from '../dialogs/reroll-dialog.js';

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
        console.log('Avant | Initializing version-aware context menu system...');
        
        const approach = CompatibilityUtils.getChatContextMenuApproach();
        CompatibilityUtils.log(`Using ${approach} approach for chat context menu`);
        
        if (approach === 'v13') {
            console.log('Avant | Using v13 approach: Direct ChatLog._getEntryContextOptions extension');
            AvantChatContextMenu._initializeV13Approach();
        } else {
            console.log('Avant | Using v12 approach: Traditional hook-based method');
            AvantChatContextMenu._initializeV12Approach();
        }
        
        console.log('Avant | Context menu listeners registered successfully');
    }
    
    /**
     * Initialize context menu for FoundryVTT v13
     * Uses direct ChatLog method extension (PROVEN WORKING)
     * @static
     * @private
     */
    static _initializeV13Approach() {
        // Wait for ChatLog to be available
        if (ui.chat) {
            AvantChatContextMenu._extendChatLogContextMenuV13();
        } else {
            // Wait for UI to be ready
            Hooks.once('ready', () => {
                AvantChatContextMenu._extendChatLogContextMenuV13();
            });
        }
    }
    
    /**
     * Initialize context menu for FoundryVTT v12
     * Uses traditional hook-based approach
     * @static
     * @private
     */
    static _initializeV12Approach() {
        console.log('Avant | Setting up v12 hook-based context menu...');
        
        // Try getChatLogEntryContext hook first (most common in v12)
        Hooks.on('getChatLogEntryContext', (html, options) => {
            console.log('Avant | 🎯 getChatLogEntryContext hook fired (v12)');
            AvantChatContextMenu._addRerollOptionV12(html, options);
        });
        
        // Also try getDocumentContextOptions as backup
        Hooks.on('getDocumentContextOptions', (document, options) => {
            console.log('Avant | 🎯 getDocumentContextOptions hook fired (v12)');
            if (document instanceof ChatMessage) {
                AvantChatContextMenu._addRerollOptionForDocument(document, options);
            }
        });
        
        console.log('Avant | v12 hooks registered');
    }
    
    /**
     * Extend ChatLog's context menu for v13 (WORKING SOLUTION)
     * @static
     * @private
     */
    static _extendChatLogContextMenuV13() {
        console.log('Avant | 🎯 Extending ChatLog context menu for v13...');
        
        if (!ui.chat) {
            console.log('Avant | ERROR: ui.chat not available');
            return;
        }
        
        // Store the original method
        const originalGetEntryContextOptions = ui.chat._getEntryContextOptions;
        
        if (!originalGetEntryContextOptions) {
            console.log('Avant | ERROR: _getEntryContextOptions method not found on ChatLog');
            return;
        }
        
        console.log('Avant | Found _getEntryContextOptions method, extending...');
        
        // Override the method
        ui.chat._getEntryContextOptions = function() {
            console.log('Avant | 🎯 EXTENDED _getEntryContextOptions called (v13)!');
            
            // Get the original options
            const options = originalGetEntryContextOptions.call(this);
            console.log('Avant | Original options:', options.map(opt => opt.name));
            
            // Add our reroll option
            options.push({
                name: "Reroll with Fortune Points",
                icon: '<i class="fas fa-dice"></i>',
                condition: (li) => {
                    console.log('Avant | Condition check - li element (v13):', li);
                    
                    // v13 DOM compatibility: use vanilla DOM methods
                    const messageId = li.dataset?.messageId || li.getAttribute('data-message-id');
                    console.log('Avant | Message ID from li (v13):', messageId);
                    
                    if (!messageId) return false;
                    
                    const message = game.messages.get(messageId);
                    console.log('Avant | Message object (v13):', message);
                    
                    if (!message || !message.rolls || message.rolls.length === 0) {
                        console.log('Avant | No rolls in message (v13)');
                        return false;
                    }
                    
                    const roll = message.rolls[0];
                    const actor = AvantChatContextMenu._getActorFromMessage(message);
                    const isEligible = AvantChatContextMenu._isEligibleRoll(roll);
                    
                    console.log('Avant | Condition check result (v13) - eligible:', isEligible, 'actor:', !!actor);
                    return isEligible && actor;
                },
                callback: (li) => {
                    console.log('Avant | === CONTEXT MENU CALLBACK TRIGGERED (v13) ===');
                    console.log('Avant | Callback li element (v13):', li);
                    
                    const messageId = li.dataset?.messageId || li.getAttribute('data-message-id');
                    const message = game.messages.get(messageId);
                    const roll = message.rolls[0];
                    const actor = AvantChatContextMenu._getActorFromMessage(message);
                    
                    const dialog = new AvantRerollDialog(roll, actor, message.flavor);
                    dialog.render(true);
                    console.log('Avant | Dialog rendered (v13)');
                }
            });
            
            console.log('Avant | Extended options (v13):', options.map(opt => opt.name));
            return options;
        };
        
        console.log('Avant | ✅ ChatLog context menu extended successfully for v13!');
    }
    
    /**
     * Add reroll option for v12 hook-based approach
     * @static
     * @param {jQuery} html - The HTML element
     * @param {Array} options - The context menu options
     * @private
     */
    static _addRerollOptionV12(html, options) {
        console.log('Avant | Adding reroll option via v12 hook approach');
        
        options.push({
            name: "Reroll with Fortune Points",
            icon: '<i class="fas fa-dice"></i>',
            condition: (li) => {
                console.log('Avant | Condition check - li element (v12):', li);
                
                // v12 jQuery compatibility: use jQuery methods if available
                let messageId;
                if (li.data && typeof li.data === 'function') {
                    messageId = li.data('messageId') || li.attr('data-message-id');
                } else {
                    // Fallback to vanilla DOM
                    messageId = li.dataset?.messageId || li.getAttribute('data-message-id');
                }
                
                console.log('Avant | Message ID from li (v12):', messageId);
                
                if (!messageId) return false;
                
                const message = game.messages.get(messageId);
                console.log('Avant | Message object (v12):', message);
                
                if (!message || !message.rolls || message.rolls.length === 0) {
                    console.log('Avant | No rolls in message (v12)');
                    return false;
                }
                
                const roll = message.rolls[0];
                const actor = AvantChatContextMenu._getActorFromMessage(message);
                const isEligible = AvantChatContextMenu._isEligibleRoll(roll);
                
                console.log('Avant | Condition check result (v12) - eligible:', isEligible, 'actor:', !!actor);
                return isEligible && actor;
            },
            callback: (li) => {
                console.log('Avant | === CONTEXT MENU CALLBACK TRIGGERED (v12) ===');
                console.log('Avant | Callback li element (v12):', li);
                
                let messageId;
                if (li.data && typeof li.data === 'function') {
                    messageId = li.data('messageId') || li.attr('data-message-id');
                } else {
                    messageId = li.dataset?.messageId || li.getAttribute('data-message-id');
                }
                
                const message = game.messages.get(messageId);
                const roll = message.rolls[0];
                const actor = AvantChatContextMenu._getActorFromMessage(message);
                
                const dialog = new AvantRerollDialog(roll, actor, message.flavor);
                dialog.render(true);
                console.log('Avant | Dialog rendered (v12)');
            }
        });
        
        console.log('Avant | Reroll option added via v12 hook');
    }

    /**
     * Add reroll option for document-based context menu (v12 fallback)
     * @static
     * @param {ChatMessage} document - The chat message document
     * @param {Array} options - The context menu options
     * @private
     */
    static _addRerollOptionForDocument(document, options) {
        console.log('Avant | Adding reroll option for document approach (v12 fallback)');
        
        if (!(document instanceof ChatMessage)) {
            console.log('Avant | Document is not a ChatMessage');
            return;
        }
        
        const message = document;
        
        if (!message.rolls || message.rolls.length === 0) {
            console.log('Avant | No rolls in message (document approach)');
            return;
        }
        
        const roll = message.rolls[0];
        const actor = AvantChatContextMenu._getActorFromMessage(message);
        const isEligible = AvantChatContextMenu._isEligibleRoll(roll);
        
        if (!isEligible || !actor) {
            console.log('Avant | Message not eligible for reroll (document approach)');
            return;
        }
        
        options.push({
            name: "Reroll with Fortune Points",
            icon: '<i class="fas fa-dice"></i>',
            condition: () => true, // Already checked above
            callback: () => {
                console.log('Avant | === DOCUMENT CONTEXT MENU CALLBACK TRIGGERED ===');
                const dialog = new AvantRerollDialog(roll, actor, message.flavor);
                dialog.render(true);
                console.log('Avant | Dialog rendered (document approach)');
            }
        });
        
        console.log('Avant | Reroll option added via document approach');
    }
    
    /**
     * Get actor from chat message
     * @static
     * @param {ChatMessage} message - The chat message
     * @returns {Actor|null} The actor or null
     * @private
     */
    static _getActorFromMessage(message) {
        console.log('Avant | === _getActorFromMessage START ===');
        console.log('Avant | Message ID:', message?.id);
        console.log('Avant | Message speaker:', message?.speaker);
        console.log('Avant | Speaker actor ID:', message?.speaker?.actor);
        
        if (message?.speaker?.actor) {
            const actorId = message.speaker.actor;
            const actor = game.actors.get(actorId);
            console.log('Avant | Found actor by ID:', actorId, '→', actor?.name);
            console.log('Avant | Actor system data:', actor?.system);
            console.log('Avant | === _getActorFromMessage END (found) ===');
            return actor;
        }
        
        console.log('Avant | ERROR: No actor ID found in message speaker');
        console.log('Avant | === _getActorFromMessage END (not found) ===');
        return null;
    }
    
    /**
     * Check if roll is eligible for reroll (2d10 roll)
     * @static
     * @param {Roll} roll - The roll to check
     * @returns {boolean} True if eligible
     * @private
     */
    static _isEligibleRoll(roll) {
        console.log('Avant | === _isEligibleRoll START ===');
        console.log('Avant | Roll object:', roll);
        console.log('Avant | Roll formula:', roll?.formula);
        console.log('Avant | Roll terms count:', roll?.terms?.length);
        console.log('Avant | Roll terms:', roll?.terms);
        
        if (!roll || !roll.terms || !Array.isArray(roll.terms)) {
            console.log('Avant | ERROR: Invalid roll object or no terms');
            console.log('Avant | === _isEligibleRoll END (invalid) ===');
            return false;
        }
        
        // Check if roll contains exactly 2d10
        let d10Count = 0;
        
        for (let i = 0; i < roll.terms.length; i++) {
            const term = roll.terms[i];
            console.log(`Avant | Checking term ${i}:`, term);
            console.log(`Avant | Term ${i} type:`, term?.constructor?.name);
            console.log(`Avant | Term ${i} faces:`, term?.faces);
            console.log(`Avant | Term ${i} number:`, term?.number);
            
            if (term instanceof foundry.dice.terms.Die && term.faces === 10) {
                d10Count += term.number;
                console.log(`Avant | Term ${i} is d10 with ${term.number} dice, total count now:`, d10Count);
            } else {
                console.log(`Avant | Term ${i} is not a d10 die`);
            }
        }
        
        const eligible = d10Count === 2;
        console.log('Avant | Final analysis: Roll has', d10Count, 'd10 dice');
        console.log('Avant | Eligible for reroll:', eligible);
        console.log('Avant | === _isEligibleRoll END ===');
        return eligible;
    }
} 