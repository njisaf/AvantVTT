/**
 * @fileoverview Unified Actions Tab Logic - Core Utilities
 * @description Pure functions for combining gear and standalone actions
 * @version 1.0.0
 * @author Avant Development Team
 */

// Types for FoundryVTT documents
type Actor = any;
type Item = any;

/**
 * Result pattern for error handling
 */
export interface Result<T, E = string> {
    success: boolean;
    data?: T;
    error?: E;
}

/**
 * Combined action data structure
 */
export interface CombinedAction {
    id: string;
    name: string;
    source: 'weapon' | 'armor' | 'gear' | 'action';
    sourceItemId?: string;
    buttons: string[];
    system: any;
    displayData?: any;
}

/**
 * Configuration for action combination
 */
export interface ActionCombinationConfig {
    includeGearActions: boolean;
    includeStandaloneActions: boolean;
    preserveOrder: boolean;
    groupBySource: boolean;
}

/**
 * Default configuration for action combination
 */
export const DEFAULT_ACTION_CONFIG: ActionCombinationConfig = {
    includeGearActions: true,
    includeStandaloneActions: true,
    preserveOrder: true,
    groupBySource: true
};

/**
 * Determine if an item should generate a gear action
 * @param item - The item to check
 * @returns True if item should generate gear action
 */
export function isGearActionSource(item: Item): boolean {
    const type = item.type;
    return type === 'weapon' || type === 'armor' || type === 'gear';
}

/**
 * Determine the action buttons for a gear item
 * @param item - The gear item
 * @returns Array of button names
 */
export function getGearActionButtons(item: Item): string[] {
    switch (item.type) {
        case 'weapon':
            return ['attack', 'damage'];
        case 'armor':
            return ['armor'];
        case 'gear':
            return ['use'];
        default:
            return [];
    }
}

/**
 * Create a combined action from a gear item
 * @param item - The source gear item
 * @returns Combined action representation
 */
export function createGearAction(item: Item): CombinedAction {
    return {
        id: `gear-${item.id}`,
        name: item.name || 'Unnamed Item',
        source: item.type as 'weapon' | 'armor' | 'gear',
        sourceItemId: item.id,
        buttons: getGearActionButtons(item),
        system: item.system,
        displayData: item
    };
}

/**
 * Create a combined action from a standalone action item
 * @param item - The action item
 * @returns Combined action representation
 */
export function createStandaloneAction(item: Item): CombinedAction {
    return {
        id: `action-${item.id}`,
        name: item.name || 'Unnamed Action',
        source: 'action',
        sourceItemId: item.id,
        buttons: ['use'],
        system: item.system,
        displayData: item
    };
}

/**
 * Combine gear and standalone actions into unified list
 * @param actor - The actor to get items from
 * @param config - Configuration options
 * @returns Result containing combined actions array
 */
export function combineActionSources(
    actor: Actor,
    config: ActionCombinationConfig = DEFAULT_ACTION_CONFIG
): Result<CombinedAction[], string> {
    try {
        const combinedActions: CombinedAction[] = [];

        // Get all items from actor
        const items = Array.from(actor.items.values());

        // Process gear items if enabled
        if (config.includeGearActions) {
            const gearItems = items.filter(isGearActionSource);
            const gearActions = gearItems.map(createGearAction);
            
            if (config.groupBySource) {
                // Group by source type
                const weaponActions = gearActions.filter(a => a.source === 'weapon');
                const armorActions = gearActions.filter(a => a.source === 'armor');
                const gearOnlyActions = gearActions.filter(a => a.source === 'gear');
                
                combinedActions.push(...weaponActions, ...armorActions, ...gearOnlyActions);
            } else {
                combinedActions.push(...gearActions);
            }
        }

        // Process standalone actions if enabled
        if (config.includeStandaloneActions) {
            const actionItems = items.filter((item: any) => item.type === 'action');
            const standaloneActions = actionItems.map(createStandaloneAction);
            combinedActions.push(...standaloneActions);
        }

        // Sort by name if preserveOrder is enabled
        if (config.preserveOrder) {
            combinedActions.sort((a, b) => {
                // First sort by source type priority
                const sourcePriority = { weapon: 1, armor: 2, gear: 3, action: 4 };
                const aPriority = sourcePriority[a.source] || 5;
                const bPriority = sourcePriority[b.source] || 5;
                
                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }
                
                // Then sort by name within same source type
                return a.name.localeCompare(b.name);
            });
        }

        return {
            success: true,
            data: combinedActions
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error in combineActionSources'
        };
    }
}

/**
 * Dispatch a combined action to the appropriate roll handler
 * @param action - The combined action to execute
 * @param button - The button that was clicked
 * @param actor - The actor performing the action
 * @param sheet - The actor sheet instance
 * @returns Result of the action dispatch
 */
export function rollCombinedAction(
    action: CombinedAction,
    button: string,
    actor: Actor,
    sheet: any
): Result<boolean, string> {
    try {
        // Get the source item if it exists
        const sourceItem = action.sourceItemId ? (actor.items as any).get(action.sourceItemId) : null;
        
        if (!sourceItem && action.source !== 'action') {
            return {
                success: false,
                error: `Source item not found for action: ${action.name}`
            };
        }

        // Create mock event and target for compatibility with existing handlers
        const mockEvent = new Event('click', { bubbles: true, cancelable: true });
        const mockTarget = document.createElement('button');
        mockTarget.setAttribute('data-item-id', action.sourceItemId || '');
        mockTarget.setAttribute('data-action', button);

        // Dispatch based on source type and button
        switch (action.source) {
            case 'weapon':
                if (button === 'attack') {
                    sheet.constructor._onRollAttack.call(sheet, mockEvent, mockTarget);
                } else if (button === 'damage') {
                    sheet.constructor._onRollDamage.call(sheet, mockEvent, mockTarget);
                } else {
                    return { success: false, error: `Unknown weapon button: ${button}` };
                }
                break;

            case 'armor':
                if (button === 'armor') {
                    sheet.constructor._onRollArmor.call(sheet, mockEvent, mockTarget);
                } else {
                    return { success: false, error: `Unknown armor button: ${button}` };
                }
                break;

            case 'gear':
                if (button === 'use') {
                    // For gear items, we'll use the generic useAction handler
                    if (sheet.constructor._onUseAction) {
                        sheet.constructor._onUseAction.call(sheet, mockEvent, mockTarget);
                    } else {
                        // Fallback to a simple chat message
                        const chatData = {
                            user: (globalThis as any).game.user?.id,
                            speaker: { actor: actor.id, alias: actor.name },
                            content: `<p><strong>${actor.name}</strong> uses <em>${action.name}</em></p>`
                        };
                        (globalThis as any).ChatMessage.create(chatData);
                    }
                } else {
                    return { success: false, error: `Unknown gear button: ${button}` };
                }
                break;

            case 'action':
                if (button === 'use') {
                    // For standalone actions, use the useAction handler
                    if (sheet.constructor._onUseAction) {
                        sheet.constructor._onUseAction.call(sheet, mockEvent, mockTarget);
                    } else {
                        // Fallback to a simple chat message
                        const chatData = {
                            user: (globalThis as any).game.user?.id,
                            speaker: { actor: actor.id, alias: actor.name },
                            content: `<p><strong>${actor.name}</strong> uses action <em>${action.name}</em></p>`
                        };
                        (globalThis as any).ChatMessage.create(chatData);
                    }
                } else {
                    return { success: false, error: `Unknown action button: ${button}` };
                }
                break;

            default:
                return { success: false, error: `Unknown action source: ${action.source}` };
        }

        return { success: true, data: true };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error in rollCombinedAction'
        };
    }
}

/**
 * Check if an item has a linked action
 * @param item - The item to check
 * @returns True if item has a linked action
 */
export function hasLinkedAction(item: Item): boolean {
    return item.getFlag('avant', 'hasLinkedAction') === true;
}

/**
 * Link a gear item to an action item
 * @param sourceItem - The source gear item
 * @param actor - The actor owning the items
 * @returns Result containing the linked action item
 */
export async function linkGearItemToAction(
    sourceItem: Item,
    actor: Actor
): Promise<Result<Item, string>> {
    try {
        // Check if action already exists
        const existingAction = (actor.items as any).find((item: any) => 
            item.type === 'action' && 
            item.getFlag('avant', 'sourceItemUuid') === sourceItem.uuid
        );

        if (existingAction) {
            // Update existing action
            await existingAction.update({
                name: `${sourceItem.name} (${sourceItem.type})`,
                'system.description': `Auto-generated action for ${sourceItem.type}: ${sourceItem.name}`
            });
            return { success: true, data: existingAction };
        }

        // Create new linked action
        const actionData = {
            name: `${sourceItem.name} (${sourceItem.type})`,
            type: 'action',
            system: {
                description: `Auto-generated action for ${sourceItem.type}: ${sourceItem.name}`,
                apCost: 0,
                ppCost: 0
            },
            flags: {
                avant: {
                    sourceItemUuid: sourceItem.uuid,
                    sourceType: sourceItem.type,
                    isLinkedAction: true
                }
            }
        };

        const createdAction = await actor.createEmbeddedDocuments('Item', [actionData]);
        
        // Mark source item as having a linked action
        await sourceItem.setFlag('avant', 'hasLinkedAction', true);
        await sourceItem.setFlag('avant', 'linkedActionUuid', createdAction[0].uuid);

        return { success: true, data: createdAction[0] };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error in linkGearItemToAction'
        };
    }
}

/**
 * Remove linked action when source item is deleted
 * @param sourceItem - The source item being deleted
 * @param actor - The actor owning the items
 * @returns Result of the removal operation
 */
export async function removeLinkedAction(
    sourceItem: Item,
    actor: Actor
): Promise<Result<boolean, string>> {
    try {
        const linkedAction = (actor.items as any).find((item: any) => 
            item.type === 'action' && 
            item.getFlag('avant', 'sourceItemUuid') === sourceItem.uuid
        );

        if (linkedAction) {
            await linkedAction.delete();
        }

        return { success: true, data: true };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error in removeLinkedAction'
        };
    }
}