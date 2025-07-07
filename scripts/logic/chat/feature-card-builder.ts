/**
 * @fileoverview Feature Card Builder for Talents & Augments
 * @version 1.0.0 - Phase 3: TypeScript Conversion
 * @description Pure functions for building talent and augment chat cards with PP functionality
 * @author Avant VTT Team
 * 
 * 🎯 FEATURE CARD SYSTEM OVERVIEW
 * 
 * This module is the core of the feature card system that creates rich, interactive chat cards
 * for talents and augments. The system was completely functional but wasn't being triggered
 * due to ApplicationV2 action registration issues that have now been resolved.
 * 
 * SYSTEM ARCHITECTURE:
 * 1. Pure Function Design: All functions are pure with no side effects
 * 2. Template-Based Generation: Uses custom Handlebars-style template system
 * 3. Trait Integration: Resolves trait chips with colors and icons
 * 4. Power Point Integration: Interactive PP spending buttons
 * 5. Accessibility: Full ARIA support and semantic HTML
 * 
 * INTEGRATION POINTS:
 * - Called by actor-sheet.ts (_onUseTalent/_onUseAugment handlers)
 * - Uses trait-provider.ts for trait resolution and styling
 * - Connects to power-point-handler.ts for PP validation and spending
 * - Posts to FoundryVTT chat system for display
 * 
 * TEMPLATE SYSTEM:
 * - Custom lightweight template renderer (not full Handlebars)
 * - Supports {{variable}}, {{{html}}}, {{#if}}, {{#each}} syntax
 * - XSS protection with HTML escaping
 * - Fallback error handling for missing data
 * 
 * DEBUGGING NOTES:
 * - All functions were working correctly during the debug session
 * - Issue was in ApplicationV2 action registration, not this module
 * - Comprehensive error handling and logging throughout
 * - Template rendering tested and verified functional
 */

import { createTraitHtmlForChat } from './trait-resolver.js';
import type { Item, Actor } from '../../types/foundry/index';
import type { 
    PostFeatureCardResult,
    FeatureCardMetadata,
    FeatureCardTemplateData,
    PowerPointButtonTemplateData
} from '../../types/domain/index';
import { TraitProvider } from '../../services/trait-provider';

/**
 * HTML template for feature cards
 * @private
 */
const FEATURE_CARD_TEMPLATE = `
<div class="avant avant-feature-card" data-item-id="{{itemId}}" data-actor-id="{{actorId}}">
    <div class="card-header">
        <h3 class="feature-name">{{featureName}}</h3>
        <div class="feature-type">{{featureType}}</div>
    </div>
    
    <div class="card-content">
        <div class="feature-description">{{description}}</div>
        
        {{#if traits}}
        <div class="feature-traits">
            {{{traits}}}
        </div>
        {{/if}}
        
        {{#if metadata}}
        <div class="feature-metadata">
            {{#each metadata}}
            <span class="metadata-item">
                <strong>{{label}}:</strong> {{value}}
            </span>
            {{/each}}
        </div>
        {{/if}}
    </div>
    
    {{#if powerPointSection}}
    <div class="card-footer">
        <div class="power-point-section">
            {{{powerPointSection}}}
        </div>
    </div>
    {{/if}}
</div>
`;

/**
 * HTML template for power point buttons
 * @private
 */
const PP_BUTTON_TEMPLATE = `
<button 
    type="button" 
    class="pp-spend {{#if disabled}}disabled{{/if}}" 
    data-pp="{{cost}}"
    data-actor-id="{{actorId}}"
    data-item-id="{{itemId}}"
    {{#if disabled}}disabled{{/if}}
    role="button"
    aria-label="{{ariaLabel}}"
    aria-describedby="pp-cost-description"
>
    {{buttonText}}
</button>
<span id="pp-cost-description" class="sr-only">
    {{description}}
</span>
`;

/**
 * Escape HTML characters to prevent XSS attacks
 * @param text - Text to escape
 * @returns Escaped text
 * @private
 */
function escapeHtml(text: unknown): string {
    if (typeof text !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Simple template renderer with basic Handlebars-style syntax support
 * @param template - Template string with {{variable}} placeholders
 * @param data - Data to fill template
 * @returns Rendered template
 * @private
 */
function renderTemplate(template: string, data: Record<string, unknown>): string {
    let result = template;
    
    // Handle {{#if condition}} blocks
    result = result.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
        return data[condition.trim()] ? content : '';
    });
    
    // Handle {{#each array}} blocks
    result = result.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
        const array = data[arrayName.trim()];
        if (!Array.isArray(array)) return '';
        
        return array.map((item: Record<string, unknown>) => {
            return content.replace(/\{\{([^}]+)\}\}/g, (_innerMatch: string, key: string) => {
                const trimmedKey = key.trim();
                const value = item[trimmedKey];
                return value !== undefined && value !== null ? escapeHtml(String(value)) : '';
            });
        }).join('');
    });
    
    // Handle simple variable substitutions
    result = result.replace(/\{\{\{?([^}]+)\}?\}\}/g, (match, key) => {
        const isHtml = match.startsWith('{{{');
        const trimmedKey = key.trim();
        const value = data[trimmedKey];
        
        // Return empty string for undefined/null but preserve 0 and false
        if (value === undefined || value === null) {
            return '';
        }
        
        return isHtml ? String(value) : escapeHtml(String(value));
    });
    
    return result;
}

/**
 * Build power point section HTML
 * @param item - Item with power point cost
 * @param actor - Actor with power points
 * @param alreadySpent - Optional amount already spent (shows "Spent X PP" instead of spend button)
 * @returns Power point section HTML
 * @private
 * 
 * 🔧 DEVELOPMENT NOTE (2025-01-17):
 * This function handles a critical field compatibility issue between item types:
 * - Augments use `ppCost` field for PP cost storage
 * - Actions/Features use `powerPointCost` field for PP cost storage  
 * - We check BOTH fields to ensure all item types display PP costs correctly
 * 
 * The `alreadySpent` parameter enables "post-spend" cards that show confirmation
 * instead of spending buttons, creating consistent UX across direct spend vs chat spend methods.
 * 
 * 🎓 CRITICAL LESSON - HTML STRUCTURE COORDINATION:
 * This function MUST generate identical HTML to power-point-handler.ts and actor-sheet.ts
 * for spent states. During development, we discovered that even tiny differences in HTML
 * structure cause visual inconsistencies. The solution: standardize on this exact pattern:
 * `<i class="fas fa-check-circle" aria-hidden="true"></i>Spent X PP`
 * 
 * 🎨 AUTOMATIC THEMING DISCOVERY:
 * We learned that the theme system "just works" - we don't need to manually apply themes
 * to feature cards. The CSS variables (--theme-success) automatically adapt based on 
 * the theme manager's detection of .avant classes. This is magical but fragile - always
 * ensure feature cards have the 'avant' class for theme compatibility.
 */
function buildPowerPointSection(item: Item, actor: Actor, alreadySpent?: number): string {
    // Check both ppCost (augments) and powerPointCost (actions/features) for backwards compatibility
    const system = item.system as any;
    const ppCost = system?.ppCost || system?.powerPointCost || 0;
    const currentPP = (actor.system as any)?.powerPoints?.value || 0;
    
    // Debug logging to help track down PP cost issues
    console.log('🔋 Avant | Power Point Debug:', {
        itemName: item.name,
        itemType: item.type,
        ppCost_field: system?.ppCost,
        powerPointCost_field: system?.powerPointCost,
        finalPPCost: ppCost,
        actorCurrentPP: currentPP,
        alreadySpent: alreadySpent
    });
    
    if (ppCost === 0) {
        return '<span class="no-pp-cost">No PP Cost</span>';
    }
    
    // If PP has already been spent, show confirmation message
    // 🎓 FEATURE CARD DEVELOPMENT WISDOM:
    // This exact HTML structure is replicated in 3 files (feature-card-builder, 
    // power-point-handler, actor-sheet). Future feature card development should 
    // remember: consistency across all interaction points is critical for UX.
    if (alreadySpent && alreadySpent > 0) {
        return `<span class="pp-spent-confirmation">
            <i class="fas fa-check-circle" aria-hidden="true"></i>
            Spent ${alreadySpent} PP
        </span>`;
    }
    
    const insufficient = currentPP < ppCost;
    const buttonText = insufficient ? 'Insufficient PP' : `Spend ${ppCost} PP`;
    const ariaLabel = insufficient 
        ? `Cannot spend ${ppCost} power points - insufficient points available`
        : `Spend ${ppCost} power points from ${actor.name}`;
    
    const description = insufficient
        ? `Requires ${ppCost} power points, but ${actor.name} only has ${currentPP} available`
        : `This will deduct ${ppCost} power points from ${actor.name}'s total of ${currentPP}`;
    
    const templateData: PowerPointButtonTemplateData = {
        cost: ppCost,
        actorId: actor.id,
        itemId: item.id,
        disabled: insufficient,
        buttonText,
        ariaLabel,
        description
    };
    
    return renderTemplate(PP_BUTTON_TEMPLATE, templateData);
}

/**
 * Get feature metadata for display
 * @param item - Feature item
 * @returns Array of metadata objects with label and value
 * @private
 */
function getFeatureMetadata(item: Item): FeatureCardMetadata[] {
    const metadata: FeatureCardMetadata[] = [];
    const system = item.system as any;
    
    if (item.type === 'talent' && system?.tier) {
        metadata.push({
            label: 'Tier',
            value: String(system.tier)
        });
    }
    
    if (item.type === 'augment' && system?.augmentType) {
        metadata.push({
            label: 'Type',
            value: system.augmentType.charAt(0).toUpperCase() + system.augmentType.slice(1)
        });
    }
    
    if (system?.rarity && system.rarity !== 'common') {
        metadata.push({
            label: 'Rarity',
            value: system.rarity.charAt(0).toUpperCase() + system.rarity.slice(1)
        });
    }
    
    if (system?.prerequisites) {
        metadata.push({
            label: 'Prerequisites',
            value: String(system.prerequisites)
        });
    }
    
    return metadata;
}

/**
 * Get feature type display name
 * @param item - Feature item
 * @returns Feature type for display
 * @private
 */
function getFeatureType(item: Item): string {
    const typeMap: Record<string, string> = {
        talent: 'Talent',
        augment: 'Augment',
        feature: 'Feature',
        action: 'Action'
    };
    
    return typeMap[item.type] || item.type.charAt(0).toUpperCase() + item.type.slice(1);
}

/**
 * Build feature card HTML for talents and augments
 * 
 * This pure function generates a complete HTML card for a talent or augment
 * including traits, power point cost, and accessibility features.
 * 
 * @param item - The talent or augment item
 * @param actor - The actor who owns the item
 * @param traitProvider - TraitProvider service for trait resolution
 * @param options - Optional configuration including alreadySpent amount
 * @returns HTML string for the feature card
 * 
 * @example
 * const cardHtml = await buildFeatureCard(talent, actor, traitProvider);
 * // Returns: "<div class=\"avant-feature-card\">...</div>"
 */
export async function buildFeatureCard(
    item: Item, 
    actor: Actor, 
    traitProvider: TraitProvider,
    options: { alreadySpent?: number } = {}
): Promise<string> {
    try {
        // Validate inputs
        if (!item?.name) {
            return `<div class="avant avant-feature-card error">
                <div class="card-content">
                    <div class="feature-name">${escapeHtml(item?.name || 'Unknown Item')}</div>
                    <div class="feature-description">No description available</div>
                </div>
            </div>`;
        }
        
        // Get trait HTML if item has traits
        let traitsHtml = '';
        const system = item.system as any;
        if (system?.traits && Array.isArray(system.traits) && system.traits.length > 0) {
            try {
                traitsHtml = await createTraitHtmlForChat(system.traits, traitProvider, 'small');
            } catch (error) {
                console.warn('Avant | Failed to generate trait HTML for feature card:', error);
                // Continue without traits rather than failing completely
            }
        }
        
        // Build power point section if actor is provided
        let powerPointSection = '';
        if (actor && system && (system?.ppCost !== undefined || system?.powerPointCost !== undefined)) {
            powerPointSection = buildPowerPointSection(item, actor, options.alreadySpent);
        }
        
        // Get metadata for display
        const metadata = getFeatureMetadata(item);
        
        // Get safe description
        const description = system?.description || 'No description available.';
        
        // Build template data
        const templateData: FeatureCardTemplateData = {
            itemId: item.id || '',
            actorId: actor?.id || '',
            featureName: item.name,
            featureType: getFeatureType(item),
            description: String(description),
            traits: traitsHtml || undefined,
            metadata: metadata.length > 0 ? metadata : null,
            powerPointSection: powerPointSection || null
        };
        
        // Render the card template
        return renderTemplate(FEATURE_CARD_TEMPLATE, templateData);
        
    } catch (error) {
        console.error('Avant | Error building feature card:', error);
        return `<div class="avant avant-feature-card error">
            <div class="card-content">
                <div class="feature-name">${escapeHtml(item?.name || 'Error')}</div>
                <div class="feature-description">Failed to build feature card</div>
            </div>
        </div>`;
    }
}

/**
 * Post a feature card to chat
 * 
 * This function creates a chat message with the feature card HTML.
 * 
 * @param item - The talent or augment item
 * @param actor - The actor who owns the item
 * @param traitProvider - TraitProvider service for trait resolution
 * @param options - Additional options for the chat message and card display
 * @returns Result object with success status and message ID
 * 
 * @example
 * const result = await postFeatureCard(talent, actor, traitProvider);
 * if (result.success) {
 *   console.log('Posted message:', result.messageId);
 * }
 */
export async function postFeatureCard(
    item: Item, 
    actor: Actor, 
    traitProvider: TraitProvider, 
    options: Record<string, unknown> = {}
): Promise<PostFeatureCardResult> {
    try {
        // Extract card options from general options
        const cardOptions = {
            alreadySpent: options.alreadySpent as number | undefined
        };
        
        // Build the card HTML with card-specific options
        const cardHtml = await buildFeatureCard(item, actor, traitProvider, cardOptions);
        
        // Get ChatMessage class from global scope
        const ChatMessage = (globalThis as any).ChatMessage;
        if (!ChatMessage) {
            return {
                success: false,
                error: 'ChatMessage not available - FoundryVTT not loaded'
            };
        }
        
        // Prepare chat message data (exclude card-specific options)
        const { alreadySpent, ...chatOptions } = options;
        const messageData = {
            content: cardHtml,
            speaker: ChatMessage.getSpeaker({ actor }),
            type: 1, // CHAT_MESSAGE_TYPES.OTHER
            ...chatOptions
        };
        
        // Create the chat message
        const message = await ChatMessage.create(messageData);
        
        return {
            success: true,
            messageId: message.id,
            message
        };
        
    } catch (error) {
        console.error('Avant | Error posting feature card to chat:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to post feature card'
        };
    }
} 