/**
 * @fileoverview Power Point Handler for Chat Cards
 * @version 1.0.0 - Phase 3: TypeScript Conversion
 * @description Pure functions for validating and handling power point spending from chat
 * @author Avant VTT Team
 */

import type { Item, Actor } from '../../types/foundry/index';

/**
 * Validation result for power point operations
 */
export interface PowerPointValidationResult {
    valid: boolean;
    error?: string;
    currentPP?: number;
    newValue?: number;
}

/**
 * Result of power point spending operation
 */
export interface PowerPointSpendResult {
    success: boolean;
    newValue?: number;
    spent?: number;
    previousValue?: number;
    error?: string;
}

/**
 * Power point button data
 */
export interface PowerPointButtonData {
    cost: number;
    showButton: boolean;
    disabled: boolean;
    buttonText: string;
    tooltip: string;
    ariaLabel: string;
    canAfford: boolean;
}

/**
 * User interface (minimal)
 */
interface User {
    id: string;
    isGM: boolean;
}

/**
 * Options for power point handler initialization
 */
export interface PowerPointHandlerOptions {
    selector?: string;
}

/**
 * Validate power point spending operation
 * 
 * This pure function validates whether a power point spend operation is valid
 * including ownership checks and availability validation.
 * 
 * @param actor - The actor to spend power points from
 * @param cost - The power point cost to spend
 * @param user - The user attempting the operation
 * @returns Validation result with valid flag and error message
 * 
 * @example
 * const validation = validatePowerPointSpend(actor, 3, game.user);
 * if (!validation.valid) {
 *   ui.notifications.warn(validation.error);
 *   return;
 * }
 */
export function validatePowerPointSpend(actor: Actor, cost: number, user: User): PowerPointValidationResult {
    try {
        // Validate inputs
        if (!actor) {
            return {
                valid: false,
                error: 'No actor provided for power point spending'
            };
        }
        
        if (typeof cost !== 'number' || cost < 0) {
            return {
                valid: false,
                error: 'Invalid power point cost - must be a positive number'
            };
        }
        
        if (!user) {
            return {
                valid: false,
                error: 'No user provided for ownership validation'
            };
        }
        
        // Check actor ownership - user must own the actor or be GM
        const ownership = (actor as any).ownership;
        const isOwner = ownership?.[user.id] >= 3; // OWNER level
        const isGM = user.isGM;
        
        if (!isOwner && !isGM) {
            return {
                valid: false,
                error: 'You do not have ownership of this character to spend their power points'
            };
        }
        
        // Check power point availability
        const currentPP = (actor.system as any)?.powerPoints?.value || 0;
        
        if (currentPP < cost) {
            return {
                valid: false,
                error: `Insufficient power points. Required: ${cost}, Available: ${currentPP}`
            };
        }
        
        return {
            valid: true,
            currentPP,
            newValue: currentPP - cost
        };
        
    } catch (error) {
        console.error('Avant | Error validating power point spend:', error);
        return {
            valid: false,
            error: `Validation failed: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Handle power point spending from chat cards
 * 
 * This function performs the actual power point deduction after validation.
 * 
 * @param actor - The actor to spend power points from
 * @param cost - The power point cost to spend
 * @param user - The user attempting the operation (optional, defaults to game.user)
 * @returns Result object with success status and new PP value
 * 
 * @example
 * const result = await handlePowerPointSpend(actor, 3);
 * if (result.success) {
 *   ui.notifications.info(`Spent 3 PP. Remaining: ${result.newValue}`);
 * }
 */
export async function handlePowerPointSpend(
    actor: Actor, 
    cost: number, 
    user: User | null = null
): Promise<PowerPointSpendResult> {
    try {
        // Use provided user or get from global game object
        const currentUser = user || (globalThis as any).game?.user;
        
        // Validate the operation
        const validation = validatePowerPointSpend(actor, cost, currentUser);
        
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error
            };
        }
        
        // Update the actor's power points
        await (actor as any).update({
            'system.powerPoints.value': validation.newValue
        });
        
        return {
            success: true,
            newValue: validation.newValue,
            spent: cost,
            previousValue: validation.currentPP
        };
        
    } catch (error) {
        console.error('Avant | Error handling power point spend:', error);
        return {
            success: false,
            error: `Power point spending failed: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Get power point spend button data for an item
 * 
 * This pure function generates the data needed for power point buttons
 * including validation state and display text.
 * 
 * @param item - The item with power point cost
 * @param actor - The actor who would spend the power points
 * @param user - The current user
 * @returns Button data object
 * 
 * @example
 * const buttonData = getPowerPointButtonData(talent, actor, game.user);
 * console.log(buttonData.disabled); // true if button should be disabled
 */
export function getPowerPointButtonData(item: Item, actor: Actor, user: User): PowerPointButtonData {
    try {
        const cost = (item.system as any)?.powerPointCost || 0;
        
        if (cost === 0) {
            return {
                cost: 0,
                showButton: false,
                disabled: false,
                buttonText: 'No PP Cost',
                tooltip: 'This ability has no power point cost',
                ariaLabel: 'No power point cost for this ability',
                canAfford: true
            };
        }
        
        const validation = validatePowerPointSpend(actor, cost, user);
        const currentPP = (actor.system as any)?.powerPoints?.value || 0;
        
        return {
            cost,
            showButton: true,
            disabled: !validation.valid,
            buttonText: validation.valid ? `Spend ${cost} PP` : 'Insufficient PP',
            tooltip: validation.valid 
                ? `Spend ${cost} power points (${currentPP - cost} remaining)`
                : validation.error || 'Cannot spend power points',
            ariaLabel: validation.valid
                ? `Spend ${cost} power points from ${actor.name}`
                : `Cannot spend ${cost} power points - ${validation.error}`,
            canAfford: validation.valid
        };
        
    } catch (error) {
        console.error('Avant | Error getting power point button data:', error);
        return {
            cost: 0,
            showButton: false,
            disabled: true,
            buttonText: 'Error',
            tooltip: 'Error calculating power point cost',
            ariaLabel: 'Power point button error',
            canAfford: false
        };
    }
}

/**
 * Initialize power point handlers for chat messages
 * 
 * This function sets up click handlers for power point buttons in chat cards.
 * Should be called when the chat integration is initialized.
 * 
 * @param options - Configuration options
 * @returns Cleanup function to remove handlers
 * 
 * @example
 * const cleanup = initializePowerPointHandlers();
 * // Later: cleanup();
 */
export function initializePowerPointHandlers(options: PowerPointHandlerOptions = {}): () => void {
    const selector = options.selector || '.pp-spend';
    
    /**
     * Handle PP button clicks with pre-captured data
     * @param button - The button element (captured immediately)
     * @param cost - Power point cost (captured immediately) 
     * @param actorId - Actor ID (captured immediately)
     * @param itemId - Item ID (captured immediately)
     */
    async function handlePPButtonClickWithData(
        button: HTMLElement, 
        cost: number, 
        actorId: string, 
        itemId: string | null
    ): Promise<void> {
        // Get the actor
        const game = (globalThis as any).game;
        const actor = game?.actors?.get(actorId);
        if (!actor) {
            console.warn('Avant | Actor not found for PP spending:', actorId);
            const ui = (globalThis as any).ui;
            ui?.notifications?.warn('Character not found for power point spending');
            return;
        }
        
        // Disable button during processing (safe DOM access)
        const buttonElement = button as HTMLButtonElement;
        const originalText = buttonElement.textContent || `Spend ${cost} PP`;
        buttonElement.disabled = true;
        buttonElement.textContent = 'Processing...';
        
        try {
            // Attempt to spend the power points
            const result = await handlePowerPointSpend(actor, cost);
            
            if (result.success) {
                // Update button to show success
                buttonElement.textContent = `Spent ${cost} PP`;
                buttonElement.classList.add('spent');
                
                // Show notification
                const ui = (globalThis as any).ui;
                ui?.notifications?.info(
                    `${actor.name} spent ${cost} Power Point${cost > 1 ? 's' : ''}. ` +
                    `Remaining: ${result.newValue}`
                );
                
                // Disable button permanently after successful spend
                buttonElement.disabled = true;
                
            } else {
                // Show error and re-enable button
                const ui = (globalThis as any).ui;
                ui?.notifications?.warn(result.error);
                buttonElement.disabled = false;
                buttonElement.textContent = 'Insufficient PP';
            }
            
        } catch (error) {
            console.error('Avant | Error in PP button click handler:', error);
            const ui = (globalThis as any).ui;
            ui?.notifications?.error('Power point spending failed');
            
            // Re-enable button on error (if element still exists)
            try {
                buttonElement.disabled = false;
                buttonElement.textContent = originalText;
            } catch (domError) {
                console.warn('Avant | Button element no longer available for reset');
            }
        }
    }
    
    // Add event listener with targeted delegation (FIXED - no longer captures every click)
    const eventListener = async (event: Event) => {
        const target = event.target as HTMLElement;
        
        // CRITICAL FIX: Early return for non-PP buttons to prevent interference
        if (!target.matches(selector)) {
            return; // Don't process or log non-PP button clicks
        }
        
        console.log('🎯 Avant | PP button click detected:', { 
            targetTag: target.tagName,
            targetClass: target.className,
            targetId: target.id,
            selector
        });
        
        console.log('🎯 Avant | PP button click matched, calling handler');
        
        // CRITICAL: Capture data IMMEDIATELY before DOM changes
        event.preventDefault();
        event.stopPropagation();
        
        let cost = 0;
        let actorId: string | null = null;
        let itemId: string | null = null;
        
        try {
            // Use target (the clicked element) not currentTarget
            const element = target as HTMLElement;
            
            // Immediate data capture using direct attribute access
            cost = parseInt(element.getAttribute('data-pp') || '0') || 0;
            actorId = element.getAttribute('data-actor-id');
            itemId = element.getAttribute('data-item-id');
            
            console.log('🎯 Avant | IMMEDIATE data capture:', { 
                cost, 
                actorId, 
                itemId,
                elementTag: element.tagName,
                elementClass: element.className,
                element: element
            });
            
            if (!actorId || cost <= 0) {
                console.warn('Avant | Invalid PP button data:', { actorId, itemId, cost });
                const ui = (globalThis as any).ui;
                ui?.notifications?.warn('Invalid power point button configuration');
                return;
            }
            
            // Now call the handler with captured data
            await handlePPButtonClickWithData(element, cost, actorId, itemId);
            
        } catch (error) {
            console.error('🎯 Avant | Error in immediate data capture:', error);
            const ui = (globalThis as any).ui;
            ui?.notifications?.error('Power point button error');
        }
    };
    
    document.addEventListener('click', eventListener);
    console.log('🎯 Avant | Power point click handler registered with selector:', selector);
    
    // Return cleanup function
    return function cleanup() {
        document.removeEventListener('click', eventListener);
    };
} 