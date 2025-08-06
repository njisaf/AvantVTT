/**
 * FoundryVTT Sheet Adapter Layer
 * 
 * 🚨 FUTURE EXTRACTION TARGET: This adapter layer is part of the local
 * foundry-types-v13 library and will be extracted along with the foundry/
 * types during Stage 4-C community release.
 * 
 * Current Location: avantVtt/scripts/types/adapters/ (Variant B - In-place)
 * Future Location: packages/foundry-types-v13/src/adapters/ (Variant A - Package)
 * 
 * Base adapter classes that handle FoundryVTT generic complexity once,
 * allowing business logic to work with clean domain types.
 * 
 * This adapter pattern isolates FoundryVTT framework quirks from our domain code.
 */

import { ActorSheet, ItemSheet } from '../foundry/sheet';
import type { Actor } from '../foundry/actor';
import type { Item } from '../foundry/item';

/**
 * Base adapter that handles FoundryVTT ActorSheet complexity.
 * All system actor sheets should extend this instead of raw ActorSheet.
 * 
 * Benefits:
 * - Shields domain code from FoundryVTT generic overload hell
 * - Provides type-safe context methods
 * - Handles common sheet patterns consistently
 */
export abstract class AvantActorSheetBase extends ActorSheet {
  declare actor: Actor;

  /** 
   * Type-safe context getter used by all sheets
   * Returns the actor's system data in a readonly format
   */
  protected getActorContext(): Readonly<Record<string, unknown>> {
    return this.actor.system;
  }
  
  /** 
   * Type-safe skill access with validation
   * Returns the actor's skills or empty object if none exist
   */
  protected getSkills(): Record<string, unknown> {
    const system = this.actor.system as any;
    return (system?.skills as Record<string, unknown>) || {};
  }

  /** 
   * Type-safe attribute access with validation
   * Returns the actor's attributes or empty object if none exist
   */
  protected getAbilities(): Record<string, unknown> {
    const system = this.actor.system as any;
    return (system?.abilities as Record<string, unknown>) || {};
  }

  /** 
   * Type-safe health data access
   * Returns the actor's health information
   */
  protected getHealthData(): Record<string, unknown> {
    const system = this.actor.system as any;
    return (system?.health as Record<string, unknown>) || {};
  }

  /**
   * Safe actor update that handles validation
   * Updates the actor with new data, with error handling
   */
  protected async updateActorSafely(updates: Record<string, unknown>): Promise<void> {
    try {
      await this.actor.update(updates);
    } catch (error) {
      console.error('Failed to update actor:', error);
      this.showNotification('Failed to update character data', 'error');
    }
  }

  /**
   * Show notification with fallback for when UI is not available
   */
  protected showNotification(message: string, type: 'info' | 'warn' | 'error' = 'info'): void {
    if (typeof ui !== 'undefined' && ui.notifications) {
      ui.notifications[type](message);
    } else {
      console[type === 'error' ? 'error' : 'log'](`[AvantVTT] ${message}`);
    }
  }
}

/**
 * Base adapter that handles FoundryVTT ItemSheet complexity.
 * All system item sheets should extend this instead of raw ItemSheet.
 * 
 * Benefits:
 * - Shields domain code from FoundryVTT generic overload hell
 * - Provides type-safe context methods
 * - Handles common item patterns consistently
 */
export abstract class AvantItemSheetBase extends ItemSheet {
  declare item: Item;

  /** 
   * Type-safe context getter used by all item sheets
   * Returns the item's system data in a readonly format
   */
  protected getItemContext(): Readonly<Record<string, unknown>> {
    return this.item.system;
  }

  /** 
   * Type-safe item type check
   * Returns the item's type with proper validation
   */
  protected getItemType(): string {
    return this.item.type || 'unknown';
  }

  /**
   * Check if this item is owned by an actor
   */
  protected get isOwnedItem(): boolean {
    return Boolean((this.item as any).isOwned);
  }

  /**
   * Get the owning actor if this item is owned
   */
  protected getOwningActor(): Actor | null {
    return (this.item as any).actor || null;
  }

  /**
   * Safe item update that handles validation
   * Updates the item with new data, with error handling
   */
  protected async updateItemSafely(updates: Record<string, unknown>): Promise<void> {
    try {
      await (this.item as any).update(updates);
    } catch (error) {
      console.error('Failed to update item:', error);
      this.showNotification('Failed to update item data', 'error');
    }
  }

  /**
   * Show notification with fallback for when UI is not available
   */
  protected showNotification(message: string, type: 'info' | 'warn' | 'error' = 'info'): void {
    if (typeof ui !== 'undefined' && ui.notifications) {
      ui.notifications[type](message);
    } else {
      console[type === 'error' ? 'error' : 'log'](`[AvantVTT] ${message}`);
    }
  }
} 