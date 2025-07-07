/**
 * @fileoverview Sheet Types for Avant Native System
 * @version 2.0.0 - TypeScript Stage 3
 * @description Type definitions for actor and item sheet functionality
 */

/**
 * Represents the result of sheet data preparation
 */
export interface SheetDataContext {
  /** System-specific data */
  system: Record<string, unknown>;
  /** FoundryVTT flags */
  flags: Record<string, unknown>;
  /** Whether the sheet is editable */
  isEditable: boolean;
  /** The document this sheet represents */
  document: unknown;
}

/**
 * Actor sheet specific context data
 */
export interface ActorSheetContext extends SheetDataContext {
  /** Total modifiers for abilities */
  abilityTotalModifiers: Record<string, number>;
  /** Total modifiers for skills */
  skillTotalModifiers: Record<string, number>;
  /** Skills organized by ability */
  skillsByAbility: Record<string, SkillsByAbility>;
  /** Items organized by type */
  items: Record<string, unknown[]>;
}

/**
 * Skills grouped by their governing ability
 */
export interface SkillsByAbility {
  /** The governing ability name */
  ability: string;
  /** List of skills under this ability */
  skills: SkillEntry[];
}

/**
 * Individual skill entry for display
 */
export interface SkillEntry {
  /** Skill identifier */
  key: string;
  /** Display name */
  name: string;
  /** Skill value */
  value: number;
  /** Total modifier including ability */
  totalModifier: number;
}

/**
 * Item sheet specific context data
 */
export interface ItemSheetContext extends SheetDataContext {
  /** Item type for template selection */
  itemType: string;
  /** Enriched HTML content */
  enrichedDescription?: string;
}

/**
 * Event handler parameters for sheet events
 */
export interface SheetEventData {
  /** The DOM event that triggered the handler */
  event: Event;
  /** HTML element that triggered the event */
  element: HTMLElement;
  /** Dataset from the triggering element */
  dataset: DOMStringMap;
}

/**
 * Roll configuration for sheet-based rolls
 */
export interface SheetRollConfig {
  /** The dice formula to roll */
  rollExpression: string;
  /** Data to use in roll evaluation */
  rollData: Record<string, unknown>;
  /** Flavor text for the roll */
  flavor: string;
  /** Roll mode to use */
  rollMode?: string;
}

/**
 * Result of a validation check for roll data
 */
export interface RollValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Validated level value */
  level?: number;
  /** Validated ability modifier */
  abilityMod?: number;
  /** Validated skill modifier */
  skillMod?: number;
}

/**
 * Power point usage validation result
 */
export interface PowerPointValidation {
  /** Whether the usage is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Remaining power points after usage */
  remaining?: number;
}

/**
 * Item creation data structure
 */
export interface ItemCreationData {
  /** Item name */
  name: string;
  /** Item type */
  type: string;
  /** System-specific data */
  system: Record<string, unknown>;
  /** Image path */
  img?: string;
}

/**
 * Form data processing result
 */
export interface ProcessedFormData {
  /** The processed data object */
  data: Record<string, unknown>;
  /** Whether processing was successful */
  success: boolean;
  /** Any validation errors */
  errors?: string[];
}

/**
 * jQuery-compatible element interface for FoundryVTT compatibility
 */
export interface JQueryElement {
  /** Length of matched elements */
  length: number;
  /** Access elements by index */
  [index: number]: Element;
  /** Find descendant elements */
  find(selector: string): JQueryElement;
  /** Bind click events */
  click(handler: (event: Event) => void): JQueryElement;
  /** Remove elements with animation */
  slideUp?(duration: number, callback?: () => void): JQueryElement;
}

/**
 * FoundryVTT Actor interface (minimal required properties)
 */
export interface FoundryActor {
  /** Actor system data */
  system: Record<string, unknown>;
  /** Actor items collection */
  items: {
    get(id: string): FoundryItem | undefined;
    [Symbol.iterator](): Iterator<FoundryItem>;
  };
  /** Get roll data for this actor */
  getRollData(): Record<string, unknown>;
  /** Update actor data */
  update(data: Record<string, unknown>): Promise<FoundryActor>;
  /** Convert to plain object */
  toObject(source?: boolean): Record<string, unknown>;
}

/**
 * FoundryVTT Item interface (minimal required properties)
 */
export interface FoundryItem {
  /** Item identifier */
  id: string;
  /** Item name */
  name: string;
  /** Item type */
  type: string;
  /** Item system data */
  system: Record<string, unknown>;
  /** Item sheet */
  sheet: {
    render(force?: boolean): void;
  };
  /** Parent actor if any */
  actor?: FoundryActor;
  /** Get roll data for this item */
  getRollData(): Record<string, unknown>;
  /** Delete this item */
  delete(): Promise<void>;
  /** Convert to plain object */
  toObject(source?: boolean): Record<string, unknown>;
} 