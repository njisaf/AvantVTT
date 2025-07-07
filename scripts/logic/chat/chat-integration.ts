/**
 * @fileoverview Chat Integration for Talents & Augments
 * @version 1.0.0 - Phase 3: TypeScript Conversion
 * @description Integration module that exposes chat API for talents and augments
 * @author Avant VTT Team
 */

import { buildFeatureCard, postFeatureCard } from './feature-card-builder.js';
import type { PostFeatureCardResult } from '../../types/domain/chat.js';
import { initializePowerPointHandlers } from './power-point-handler.js';
import type { Item, Actor } from '../../types/foundry/index';
import { TraitProvider } from '../../services/trait-provider';

/**
 * Result of chat integration initialization
 */
export interface ChatIntegrationResult {
    success: boolean;
    api?: ChatAPI;
    error?: string;
}

/**
 * Chat API interface
 */
export interface ChatAPI {
    postTalentCard: (itemId: string, actorId?: string | null, options?: Record<string, unknown>) => Promise<PostFeatureCardResult>;
    postAugmentCard: (itemId: string, actorId?: string | null, options?: Record<string, unknown>) => Promise<PostFeatureCardResult>;
    postFeatureCard: (itemId: string, actorId?: string | null, options?: Record<string, unknown>) => Promise<PostFeatureCardResult>;
    buildFeatureCardHtml: (itemId: string, actorId?: string | null) => Promise<BuildFeatureCardResult>;
}

/**
 * Result of building feature card HTML
 */
export interface BuildFeatureCardResult {
    success: boolean;
    html?: string;
    item?: Item;
    actor?: Actor;
    error?: string;
}

/**
 * Game object interface (minimal)
 */
interface GameObject {
    avant?: {
        chat?: any;
        initializationManager?: {
            getService: (serviceName: string) => any;
        };
        [key: string]: any;
    };
    actors: {
        get: (id: string) => Actor | undefined;
        [Symbol.iterator]: () => Iterator<Actor>;
    };
    [key: string]: any;
}

/**
 * Initialize chat integration for talents and augments
 * 
 * This function sets up the chat API and event handlers for the system.
 * It should be called during system initialization.
 * 
 * @param game - The FoundryVTT game object
 * @returns Integration result
 * 
 * @example
 * const result = initializeChatIntegration(game);
 * if (result.success) {
 *   console.log('Chat integration initialized');
 * }
 */
export function initializeChatIntegration(game: GameObject): ChatIntegrationResult {
    try {
        // Ensure the avant namespace exists
        if (!game.avant) {
            game.avant = {};
        }
        
        if (!game.avant.chat) {
            game.avant.chat = {};
        }
        
        // Get trait provider service
        const traitProvider: TraitProvider = game.avant?.initializationManager?.getService('traitProvider');
        
        /**
         * Find an item and its actor by item ID
         */
        function findItemAndActor(itemId: string, actorId?: string | null): { item: Item | null; actor: Actor | null } {
            let item: Item | null = null;
            let actor: Actor | null = null;
            
            if (actorId) {
                actor = game.actors.get(actorId) || null;
                if (actor) {
                    item = (actor as any).items.get(itemId) || null;
                }
            } else {
                // Look through all actors for the item
                for (const gameActor of game.actors) {
                    const foundItem = (gameActor as any).items.get(itemId);
                    if (foundItem) {
                        item = foundItem;
                        actor = gameActor;
                        break;
                    }
                }
            }
            
            return { item, actor };
        }
        
        /**
         * Post a talent card to chat
         * 
         * @param itemId - ID of the talent item
         * @param actorId - ID of the actor (optional, will use default token)
         * @param options - Additional chat message options
         * @returns Result object
         */
        game.avant.chat.postTalentCard = async function(
            itemId: string, 
            actorId: string | null = null, 
            options: Record<string, unknown> = {}
        ): Promise<PostFeatureCardResult> {
            try {
                const { item, actor } = findItemAndActor(itemId, actorId);
                
                if (!item) {
                    return {
                        success: false,
                        error: `Talent with ID '${itemId}' not found`
                    };
                }
                
                if (item.type !== 'talent') {
                    return {
                        success: false,
                        error: `Item '${item.name}' is not a talent (type: ${item.type})`
                    };
                }
                
                // Post the card
                return await postFeatureCard(item, actor!, traitProvider, options);
                
            } catch (error) {
                console.error('Avant | Error posting talent card:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to post talent card'
                };
            }
        };
        
        /**
         * Post an augment card to chat
         * 
         * @param itemId - ID of the augment item
         * @param actorId - ID of the actor (optional, will use default token)
         * @param options - Additional chat message options
         * @returns Result object
         */
        game.avant.chat.postAugmentCard = async function(
            itemId: string, 
            actorId: string | null = null, 
            options: Record<string, unknown> = {}
        ): Promise<PostFeatureCardResult> {
            try {
                const { item, actor } = findItemAndActor(itemId, actorId);
                
                if (!item) {
                    return {
                        success: false,
                        error: `Augment with ID '${itemId}' not found`
                    };
                }
                
                if (item.type !== 'augment') {
                    return {
                        success: false,
                        error: `Item '${item.name}' is not an augment (type: ${item.type})`
                    };
                }
                
                // Post the card
                return await postFeatureCard(item, actor!, traitProvider, options);
                
            } catch (error) {
                console.error('Avant | Error posting augment card:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to post augment card'
                };
            }
        };
        
        /**
         * Post a generic feature card to chat
         * 
         * @param itemId - ID of the item
         * @param actorId - ID of the actor (optional, will use default token)
         * @param options - Additional chat message options
         * @returns Result object
         */
        game.avant.chat.postFeatureCard = async function(
            itemId: string, 
            actorId: string | null = null, 
            options: Record<string, unknown> = {}
        ): Promise<PostFeatureCardResult> {
            try {
                const { item, actor } = findItemAndActor(itemId, actorId);
                
                if (!item) {
                    return {
                        success: false,
                        error: `Item with ID '${itemId}' not found`
                    };
                }
                
                // Post the card
                return await postFeatureCard(item, actor!, traitProvider, options);
                
            } catch (error) {
                console.error('Avant | Error posting feature card:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to post feature card'
                };
            }
        };
        
        /**
         * Build a feature card HTML without posting
         * 
         * @param itemId - ID of the item
         * @param actorId - ID of the actor (optional)
         * @returns Result object with HTML
         */
        game.avant.chat.buildFeatureCardHtml = async function(
            itemId: string, 
            actorId: string | null = null
        ): Promise<BuildFeatureCardResult> {
            try {
                const { item, actor } = findItemAndActor(itemId, actorId);
                
                if (!item) {
                    return {
                        success: false,
                        error: `Item with ID '${itemId}' not found`
                    };
                }
                
                // Build the card HTML
                const html = await buildFeatureCard(item, actor!, traitProvider);
                
                return {
                    success: true,
                    html,
                    item,
                    actor: actor || undefined
                };
                
            } catch (error) {
                console.error('Avant | Error building feature card HTML:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to build feature card HTML'
                };
            }
        };
        
        // Initialize power point handlers
        const ppCleanup = initializePowerPointHandlers();
        
        // Store cleanup function for later use
        game.avant.chat._ppCleanup = ppCleanup;
        
        // Hook into chat message rendering to ensure power point buttons work
        // Use the v13 renderChatMessageHTML hook instead of deprecated renderChatMessage
        const Hooks = (globalThis as any).Hooks;
        if (Hooks) {
            // Define the hook handler function so we can properly clean it up later
            const renderChatMessageHandler = (message: any, html: HTMLElement) => {
                try {
                    // Check if this message contains Avant feature cards using native DOM
                    const featureCards = html.querySelectorAll('.avant-feature-card');
                    
                    if (featureCards.length > 0) {
                        // Power point handlers are already set up via document event delegation
                        // But we can add additional validation here if needed
                        featureCards.forEach((card: Element) => {
                            const ppButtons = card.querySelectorAll('.pp-spend');
                            
                            ppButtons.forEach((button: Element) => {
                                const htmlButton = button as HTMLButtonElement;
                                const actorId = htmlButton.getAttribute('data-actor-id') || 
                                               htmlButton.dataset?.actorId ||
                                               (htmlButton as any).actorId;
                                const costStr = htmlButton.getAttribute('data-pp') || 
                                               htmlButton.dataset?.pp ||
                                               '0';
                                const cost = parseInt(costStr);
                                
                                // Validate button data and update disabled state if needed
                                if (actorId && cost > 0) {
                                    const actor = game.actors.get(actorId);
                                    if (actor) {
                                        const currentPP = (actor.system as any)?.powerPoints?.value || 0;
                                        const insufficient = currentPP < cost;
                                        
                                        if (insufficient && !htmlButton.disabled) {
                                            htmlButton.disabled = true;
                                            htmlButton.textContent = 'Insufficient PP';
                                            htmlButton.setAttribute('title', `Requires ${cost} PP, but only ${currentPP} available`);
                                        }
                                    } else {
                                        console.warn('Avant | Actor not found for PP button:', actorId);
                                    }
                                } else {
                                    console.warn('Avant | Invalid PP button data:', { actorId, cost });
                                }
                            });
                        });
                    }
                } catch (error) {
                    console.error('Avant | Error in renderChatMessageHTML hook for power point handlers:', error);
                }
            };
            
            // Register the hook
            Hooks.on('renderChatMessageHTML', renderChatMessageHandler);
            
            // Store hook handler for cleanup
            game.avant.chat._renderChatMessageHook = renderChatMessageHandler;
        }
        
        console.log('✅ Avant | Chat integration initialized with talent and augment support');
        
        const api: ChatAPI = {
            postTalentCard: game.avant.chat.postTalentCard,
            postAugmentCard: game.avant.chat.postAugmentCard,
            postFeatureCard: game.avant.chat.postFeatureCard,
            buildFeatureCardHtml: game.avant.chat.buildFeatureCardHtml
        };
        
        return {
            success: true,
            api
        };
        
    } catch (error) {
        console.error('Avant | Error initializing chat integration:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to initialize chat integration'
        };
    }
}

/**
 * Cleanup chat integration
 * 
 * This function removes event handlers and cleans up the chat integration.
 * Should be called when the system is being unloaded.
 * 
 * @param game - The FoundryVTT game object
 * @returns Cleanup result
 */
export function cleanupChatIntegration(game: GameObject): { success: boolean; error?: string } {
    try {
        // Call power point handler cleanup
        if (game.avant?.chat?._ppCleanup) {
            game.avant.chat._ppCleanup();
            delete game.avant.chat._ppCleanup;
        }
        
        // Remove chat message hook
        if (game.avant?.chat?._renderChatMessageHook) {
            const Hooks = (globalThis as any).Hooks;
            if (Hooks) {
                Hooks.off('renderChatMessageHTML', game.avant.chat._renderChatMessageHook);
            }
            delete game.avant.chat._renderChatMessageHook;
        }
        
        // Remove chat API
        if (game.avant?.chat) {
            delete game.avant.chat.postTalentCard;
            delete game.avant.chat.postAugmentCard;
            delete game.avant.chat.postFeatureCard;
            delete game.avant.chat.buildFeatureCardHtml;
        }
        
        console.log('✅ Avant | Chat integration cleaned up');
        
        return {
            success: true
        };
        
    } catch (error) {
        console.error('Avant | Error cleaning up chat integration:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to cleanup chat integration'
        };
    }
} 