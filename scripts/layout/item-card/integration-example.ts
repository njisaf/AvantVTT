/**
 * @fileoverview Item Card Layout System - Integration Example
 * @description Example showing how to integrate ICLS with ActorSheet
 * @version 0.1.0
 * @author Avant Development Team
 */

import {
    getCardLayout,
    getAugmentCardLayout,
    getTalentCardLayout,
    getWeaponCardLayout,
    getArmorCardLayout,
    getGearCardLayout,
    getActionCardLayout,
    getFeatureCardLayout,
    getTraitCardLayout
} from './index';
import type { LayoutItemData, CardSection } from './index';

/**
 * Example: ActorSheet integration point for card layouts
 * 
 * This demonstrates how the ActorSheet would use the new card system
 * to render item lists with three-zone layouts.
 */
export class CardLayoutIntegration {

    /**
     * Prepare card layouts for a collection of items
     * 
     * @param items - Array of items to render as cards
     * @returns Array of objects with item data and card layout
     */
    static async prepareItemCards(items: LayoutItemData[]): Promise<Array<{
        item: LayoutItemData;
        cardLayout: CardSection;
    }>> {
        const cardData = [];

        for (const item of items) {
            const cardLayout = await this.getCardLayoutForItem(item);
            cardData.push({ item, cardLayout });
        }

        return cardData;
    }

    /**
     * Get the appropriate card layout for an item type
     */
    private static async getCardLayoutForItem(item: LayoutItemData): Promise<CardSection> {
       // Use type-specific layouts when available
       switch (item.type) {
           case 'augment':
               return getAugmentCardLayout(item);
           case 'talent':
               return getTalentCardLayout(item);
           case 'weapon':
               return getWeaponCardLayout(item);
           case 'armor':
               return getArmorCardLayout(item);
           case 'gear':
               return getGearCardLayout(item);
           case 'action':
               return getActionCardLayout(item);
           case 'feature':
               return getFeatureCardLayout(item);
           case 'trait':
               return getTraitCardLayout(item);
           default:
               // Fallback to generic card layout
               return getCardLayout(item);
       }
   }

    /**
     * Example: ActorSheet data preparation method integration
     * 
     * This shows how an ActorSheet's getData() method would integrate
     * the card layout system for rendering items.
     */
    static async prepareActorSheetData(actor: any): Promise<{
        augmentCards: Array<{ item: LayoutItemData; cardLayout: CardSection }>;
        talentCards: Array<{ item: LayoutItemData; cardLayout: CardSection }>;
        [key: string]: any;
    }> {
        // Get items from actor
        const augments = actor.items.filter((item: any) => item.type === 'augment');
        const talents = actor.items.filter((item: any) => item.type === 'talent');

        // Prepare card layouts
        const augmentCards = await this.prepareItemCards(augments);
        const talentCards = await this.prepareItemCards(talents);

        return {
            augmentCards,
            talentCards,
            // ... other actor sheet data
        };
    }
}

/**
 * Example Handlebars template usage:
 * 
 * In templates/actor-sheet.html:
 * ```handlebars
 * <div class="augments-section">
 *   <h3>Augments</h3>
 *   {{#each augmentCards}}
 *     {{> shared/partials/item-card item=this.item layout=this.cardLayout}}
 *   {{/each}}
 * </div>
 * 
 * <div class="talents-section">
 *   <h3>Talents</h3>
 *   {{#each talentCards}}
 *     {{> shared/partials/item-card item=this.item layout=this.cardLayout}}
 *   {{/each}}
 * </div>
 * ```
 */

/**
 * Example CSS usage:
 * 
 * The _item-cards.scss module provides all necessary styling.
 * Simply ensure it's imported in your main stylesheet:
 * 
 * ```scss
 * @use 'components/item-cards';
 * ```
 */

/**
 * Migration notes:
 * 
 * 1. Replace existing item list templates with card templates
 * 2. Update ActorSheet getData() to use prepareItemCards()
 * 3. Add card action handlers to sheet's DEFAULT_OPTIONS.actions
 * 4. Test with existing drag-and-drop functionality
 * 5. Ensure proper ApplicationV2 event handling
 */