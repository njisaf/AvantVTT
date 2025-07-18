/**
 * @fileoverview Unified Actions Tab - Hook Handlers
 * @description Foundry hook handlers for auto-linking gear items to actions
 * @version 1.0.0
 * @author Avant Development Team
 */

import { isGearActionSource, linkGearItemToAction, removeLinkedAction } from './unified-actions.js';
import { logger } from '../utils/logger.js';

/**
 * Hook handler for item creation
 * Auto-creates linked actions for gear items
 */
export function handleItemCreation(item: any, data: any, options: any, userId: string): void {
    // Only process items created by the current user
    if (userId !== (globalThis as any).game.user?.id) {
        return;
    }

    // Only process gear items that should generate actions
    if (!isGearActionSource(item)) {
        return;
    }

    // Only process items that belong to an actor
    if (!item.actor) {
        return;
    }

    // Create linked action asynchronously
    linkGearItemToAction(item, item.actor)
        .then(result => {
            if (result.success) {
                logger.info(`Created linked action for ${item.type}: ${item.name}`);
            } else {
                logger.warn(`Failed to create linked action for ${item.name}: ${result.error}`);
            }
        })
        .catch(error => {
            logger.error(`Error creating linked action for ${item.name}:`, error);
        });
}

/**
 * Hook handler for item updates
 * Updates linked actions when source item changes
 */
export function handleItemUpdate(item: any, data: any, options: any, userId: string): void {
    // Only process items updated by the current user
    if (userId !== (globalThis as any).game.user?.id) {
        return;
    }

    // Only process gear items that might have linked actions
    if (!isGearActionSource(item)) {
        return;
    }

    // Only process items that belong to an actor
    if (!item.actor) {
        return;
    }

    // Check if this item has a linked action
    const hasLinkedAction = item.getFlag('avant', 'hasLinkedAction');
    if (!hasLinkedAction) {
        return;
    }

    // Find the linked action
    const linkedAction = item.actor.items.find((actorItem: any) => 
        actorItem.type === 'action' && 
        actorItem.getFlag('avant', 'sourceItemUuid') === item.uuid
    );

    if (!linkedAction) {
        logger.warn(`Linked action not found for updated item: ${item.name}`);
        return;
    }

    // Update the linked action name and description
    const updateData = {
        name: `${item.name} (${item.type})`,
        'system.description': `Auto-generated action for ${item.type}: ${item.name}`
    };

    linkedAction.update(updateData)
        .then(() => {
            logger.info(`Updated linked action for ${item.type}: ${item.name}`);
        })
        .catch((error: any) => {
            logger.error(`Error updating linked action for ${item.name}:`, error);
        });
}

/**
 * Hook handler for item deletion
 * Removes linked actions when source item is deleted
 */
export function handleItemDeletion(item: any, options: any, userId: string): void {
    // Only process items deleted by the current user
    if (userId !== (globalThis as any).game.user?.id) {
        return;
    }

    // Only process gear items that might have linked actions
    if (!isGearActionSource(item)) {
        return;
    }

    // Only process items that belong to an actor
    if (!item.actor) {
        return;
    }

    // Check if this item has a linked action
    const hasLinkedAction = item.getFlag('avant', 'hasLinkedAction');
    if (!hasLinkedAction) {
        return;
    }

    // Remove linked action asynchronously
    removeLinkedAction(item, item.actor)
        .then(result => {
            if (result.success) {
                logger.info(`Removed linked action for deleted ${item.type}: ${item.name}`);
            } else {
                logger.warn(`Failed to remove linked action for ${item.name}: ${result.error}`);
            }
        })
        .catch(error => {
            logger.error(`Error removing linked action for ${item.name}:`, error);
        });
}

/**
 * Register all unified actions hooks
 */
export function registerUnifiedActionsHooks(): void {
    // Register hook for item creation
    Hooks.on('createItem', handleItemCreation);
    
    // Register hook for item updates
    Hooks.on('updateItem', handleItemUpdate);
    
    // Register hook for item deletion
    Hooks.on('deleteItem', handleItemDeletion);
    
    logger.info('Unified Actions hooks registered');
}

/**
 * Unregister all unified actions hooks
 */
export function unregisterUnifiedActionsHooks(): void {
    // Unregister hooks
    Hooks.off('createItem', handleItemCreation);
    Hooks.off('updateItem', handleItemUpdate);
    Hooks.off('deleteItem', handleItemDeletion);
    
    logger.info('Unified Actions hooks unregistered');
}