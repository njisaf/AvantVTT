/**
 * @fileoverview Domain Types Barrel Export
 * @version 2.0.0 - TypeScript Stage 3
 * @description Central export file for all domain types in the Avant system
 */

// Actor-related types
export type {
  Ability,
  Abilities,
  Skill,
  Skills,
  CharacterStats,
  ActorData,
  ActorReference
} from './actor';

// Item-related types
export type {
  ItemType,
  WeaponData,
  ArmorData,
  TalentData,
  AugmentData,
  ActionData,
  ItemSpecificData,
  ItemData
} from './item';

// Theme-related types
export type {
  ColorPalette,
  ThemeVariables,
  ThemeConfig,
  ThemeValidationResult,
  ThemeManagerState,
  ContextMenuEntry
} from './theme';

// Sheet-related types
export type {
  SheetDataContext,
  ActorSheetContext,
  SkillsByAbility,
  SkillEntry,
  ItemSheetContext,
  SheetEventData,
  SheetRollConfig,
  RollValidationResult,
  PowerPointValidation,
  ItemCreationData,
  ProcessedFormData,
  JQueryElement,
  FoundryActor,
  FoundryItem
} from './sheet';

// Dialog-related types
export type {
  D10Result,
  StaticModifiers,
  ModifierBreakdown,
  RerollDialogData,
  RerollValidationResult,
  RerollFormulaConfig,
  RerollOutcome,
  FortunePointAvailability,
  DialogButton,
  RerollDialogOptions,
  FoundryRoll,
  RollTerm,
  DieResult,
  ChatMessageData,
  ThemeApplicationResult as DialogThemeApplicationResult
} from './dialog';

// Chat context menu types
export type {
  MessageValidationResult,
  ContextMenuOption,
  RerollActionData,
  RerollMessageData,
  ContextMenuCreationOptions,
  RerollCallback,
  MessageIdExtractor,
  MessageValidator,
  RollEligibilityChecker,
  PermissionChecker
} from './chat-context';

// Trait system types
export type {
  Trait,
  TraitSource,
  FoundryTraitItem,
  TraitItemSystemData,
  TraitMetadata,
  TraitProviderConfig,
  TraitProviderResult,
  TraitCacheEntry,
  TraitRetrievalOptions,
  CompendiumPackInfo
} from './trait'; 