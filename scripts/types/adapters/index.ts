/**
 * FoundryVTT Adapter Layer - Index
 * 
 * Framework adapters that shield business logic from FoundryVTT complexity.
 * These adapters handle the generic overload hell and UI global null checks
 * so domain code can focus on game logic.
 */

// Sheet adapters - handle FoundryVTT sheet complexity
export {
  AvantActorSheetBase,
  AvantItemSheetBase
} from './sheet-adapter';

// UI adapter - safe FoundryVTT global access
export {
  FoundryUI
} from './foundry-ui';

/**
 * Re-export common types for convenience
 */
export type { Actor, Item } from '../foundry/actor';
export type { ActorSheet, ItemSheet } from '../foundry/sheet'; 