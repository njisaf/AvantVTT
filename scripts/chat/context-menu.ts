/**
 * @fileoverview Chat Context Menu Handler for Avant Native System
 * @version 2.0.0 - FoundryVTT v13+ Only
 * @author Avant Development Team
 * @description Chat context menu for Fortune Point rerolls in v13
 * 
 * 🚨 CRITICAL TIMING REQUIREMENTS:
 * 
 * This service MUST run in the "init" phase to prevent race conditions.
 * 
 * FoundryVTT creates the ChatLog context menu during initialization (init phase).
 * Our method override MUST happen BEFORE the context menu is created, otherwise
 * our extended options will never appear.
 * 
 * RACE CONDITION PREVENTION:
 * ✅ Service configured in "init" phase via service-dependency-config.ts
 * ✅ Override _getEntryContextOptions() before FoundryVTT creates ChatLog
 * ✅ Let FoundryVTT create context menu naturally using our overridden method
 * ✅ No manual context menu creation/destruction (prevents DOM conflicts)
 * 
 * ARCHITECTURAL APPROACH:
 * 1. Service runs in "init" phase (configured in service-dependency-config.ts)
 * 2. Override ui.chat._getEntryContextOptions() to inject our reroll option
 * 3. FoundryVTT creates context menu during ChatLog initialization
 * 4. When user right-clicks, FoundryVTT calls our overridden method
 * 5. Our method returns original options + our reroll option
 * 
 * FOUNDRY API REFERENCES:
 * - ChatLog._getEntryContextOptions(): https://foundryvtt.com/api/classes/client.ChatLog.html
 * - ContextMenu: https://foundryvtt.com/api/classes/client.ContextMenu.html
 * - Service Dependencies: ../utils/service-dependency-config.ts
 */

// TypeScript compiler hint to allow any types for now during gradual migration
// @ts-check

import { AvantRerollDialog } from '../dialogs/reroll-dialog.js';
import { logger } from '../utils/logger.js';
import { validateMessageForReroll } from '../logic/chat-context-utils.js';
import { cleanFlavorForDisplay } from '../logic/dialog-utils.js';

/**
 * Chat Message Context Menu Handler - FoundryVTT v13+
 * @class AvantChatContextMenu
 * @description Provides Fortune Point reroll functionality via direct ChatLog extension + context menu recreation
 */
export class AvantChatContextMenu {
    /**
     * Initialize context menu listeners for v13 using init phase approach
     * 
     * 🚨 CRITICAL: This method runs in the init phase to override the
     * _getEntryContextOptions method BEFORE FoundryVTT creates the ChatLog context menu.
     * 
     * This timing is essential to prevent race conditions where the context menu
     * doesn't include our extended options.
     * 
     * @static
     */
    static addContextMenuListeners(): void {
        logger.log('Avant | Initializing chat context menu system...');

        // 🚨 CRITICAL: Override method early so FoundryVTT uses it when creating context menu
        AvantChatContextMenu._overrideGetEntryContextOptions();

        logger.log('Avant | ✅ Context menu initialization complete');
    }



    /**
     * Override ChatLog._getEntryContextOptions with our extended functionality
     * 
     * This method extends the standard FoundryVTT chat context menu with our
     * "Reroll with Fortune Points" option, using pure function validation
     * for maintainability and testability.
     * 
     * FOUNDRY API: ChatLog._getEntryContextOptions() returns an array of context
     * menu options that are displayed when right-clicking chat messages.
     * 
     * @static
     * @private
     */
    static _overrideGetEntryContextOptions(): void {
        const ui = (globalThis as any).ui;

        // Prevent double-override
        if (ui.chat._getEntryContextOptions._avantExtended) {
            return;
        }

        // Store original method for delegation
        const originalGetEntryContextOptions = ui.chat._getEntryContextOptions;

        // Override with extended functionality
        ui.chat._getEntryContextOptions = function () {
            // Get original FoundryVTT options
            const options = originalGetEntryContextOptions.call(this);

            // Add our reroll option
            options.push({
                name: "Reroll with Fortune Points",
                icon: '<i class="fas fa-dice"></i>',
                condition: (li: HTMLElement) => {
                    try {
                        // FoundryVTT v13 DOM compatibility: use dataset and getAttribute fallback
                        const messageId = (li as any).dataset?.messageId || li.getAttribute('data-message-id');
                        if (!messageId) {
                            return false;
                        }

                        const game = (globalThis as any).game;
                        const message = game.messages?.get(messageId);
                        if (!message) {
                            return false;
                        }

                        // Use pure function for validation (testable, maintainable)
                        const validation = validateMessageForReroll(message);
                        return validation.isValid;

                    } catch (error) {
                        logger.error('Avant | Error in reroll condition:', error);
                        return false;
                    }
                },
                callback: (li: HTMLElement) => {
                    try {
                        // FoundryVTT v13 DOM compatibility: use dataset and getAttribute fallback
                        const messageId = (li as any).dataset?.messageId || li.getAttribute('data-message-id');
                        if (!messageId) {
                            logger.error('Avant | No message ID found in context menu callback');
                            return;
                        }

                        const game = (globalThis as any).game;
                        const message = game.messages?.get(messageId);
                        if (!message) {
                            logger.error('Avant | Message not found in context menu callback:', messageId);
                            return;
                        }

                        // Use pure function to validate and extract data
                        const validation = validateMessageForReroll(message);
                        if (!validation.isValid) {
                            logger.error('Avant | Message validation failed in context menu callback:', validation.reason);
                            return;
                        }

                        // Extract clean roll name from flavor text (remove HTML)
                        const cleanRollName = cleanFlavorForDisplay(validation.flavor || 'Reroll');

                        // Open the reroll dialog with validated data
                        const dialog = new AvantRerollDialog(
                            validation.roll,
                            validation.actor,
                            cleanRollName
                        );
                        (dialog as any).render(true);
                        logger.log('Avant | Reroll dialog opened successfully');

                    } catch (error) {
                        logger.error('Avant | Error in reroll callback:', error);
                    }
                }
            });

            return options;
        };

        // Mark as extended to prevent double-override
        ui.chat._getEntryContextOptions._avantExtended = true;

        logger.log('Avant | ✅ _getEntryContextOptions method overridden successfully');
    }





} 