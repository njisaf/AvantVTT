/**
 * Local FoundryVTT Type Library - Index
 * 
 * 🚨 FUTURE EXTRACTION TARGET: This entire `foundry/` directory is designed 
 * to be extracted as a standalone `foundry-types-v13` npm package when ready
 * for community release (Stage 4-C).
 * 
 * Current Location: avantVtt/scripts/types/foundry/ (Variant B - In-place)
 * Future Location: packages/foundry-types-v13/ (Variant A - Monorepo package)
 * 
 * Minimal, clean foundry-types-v13 replacement targeting FoundryVTT v13.341+
 * 
 * This library provides essential FoundryVTT type definitions without the
 * complexity and overhead of the community fvtt-types package.
 * 
 * Size Target: <50KB total (vs 500KB+ from fvtt-types)
 * Philosophy: "Thin-Core" - Only types we actually use
 * 
 * EXTRACTION CHECKLIST (for Stage 4-C):
 * - [ ] Move foundry/ → packages/foundry-types-v13/src/
 * - [ ] Create package.json with npm workspace configuration
 * - [ ] Update import paths throughout avantVtt codebase
 * - [ ] Add build scripts for declaration files (.d.ts generation)
 * - [ ] Configure semantic versioning and release automation
 */

// Core Application Framework
export type {
  Application,
  ApplicationOptions,
  ApplicationTab,
  ApplicationPosition,
  ApplicationRenderOptions,
  DragDropConfiguration
} from './application';

// Actor System
export type {
  Actor,
  ActorData,
  Collection,
  ActiveEffect,
  EffectChange,
  Folder
} from './actor';

// Item System  
export type {
  Item,
  ItemData
} from './item';

// Sheet System
export type {
  ActorSheet,
  ItemSheet,
  ActorSheetOptions,
  ItemSheetOptions,
  ActorSheetData,
  ItemSheetData
} from './sheet';

// UI and Global Types
export type {
  FoundryUI,
  FoundryGame,
  HooksInterface,
  NotificationsInterface,
  NotificationOptions,
  SettingsInterface,
  SettingRegistration,
  User,
  WorldData,
  SystemData,
  CompatibilityData,
  SidebarInterface,
  NavigationInterface
} from './ui';

// Version information
export const FOUNDRY_TYPES_VERSION = '1.0.0';
export const TARGET_FOUNDRY_VERSION = '13.341';

/**
 * Type guard to check if FoundryVTT is properly initialized
 */
export function isFoundryInitialized(): boolean {
  return typeof globalThis !== 'undefined' && 
         'game' in globalThis && 
         'ui' in globalThis &&
         (globalThis as any).game !== null;
}

/**
 * Type guard to check if game is ready (not just initialized)
 */
export function isGameReady(): boolean {
  return isFoundryInitialized() && 
         (globalThis as any).game?.ready === true;
} 