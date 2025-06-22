/**
 * Minimal FoundryVTT Sheet type definitions
 * Targeting FoundryVTT v13.341+ with essential interfaces only
 */

import { Application, ApplicationOptions } from './application';
import { Actor } from './actor';
import { Item } from './item';

export interface ActorSheetOptions extends ApplicationOptions {
  classes?: string[];
  template?: string;
  width?: number;
  height?: number;
  tabs?: ApplicationTab[];
  dragDrop?: DragDropConfiguration[];
  submitOnChange?: boolean;
  submitOnClose?: boolean;
  closeOnSubmit?: boolean;
  editable?: boolean;
}

export interface ItemSheetOptions extends ApplicationOptions {
  classes?: string[];
  template?: string;
  width?: number;
  height?: number;
  tabs?: ApplicationTab[];
  dragDrop?: DragDropConfiguration[];
  submitOnChange?: boolean;
  submitOnClose?: boolean;
  closeOnSubmit?: boolean;
  editable?: boolean;
}

export interface ActorSheetData {
  actor: Actor;
  data?: Record<string, unknown>;
  items?: unknown[];
  effects?: unknown[];
  limited?: boolean;
  options?: ActorSheetOptions;
  owner?: boolean;
  title?: string;
  cssClass?: string;
  editable?: boolean;
  [key: string]: unknown;
}

export interface ItemSheetData {
  item: Item;
  data?: Record<string, unknown>;
  limited?: boolean;
  options?: ItemSheetOptions;
  owner?: boolean;
  title?: string;
  cssClass?: string;
  editable?: boolean;
  [key: string]: unknown;
}

/**
 * Base ActorSheet class for FoundryVTT
 * Handles actor character sheet rendering and interaction
 */
export declare class ActorSheet extends Application {
  declare options: ActorSheetOptions;
  actor: Actor;
  
  constructor(actor: Actor, options?: Partial<ActorSheetOptions>);
  
  /**
   * Gets the default options for actor sheets
   */
  static get defaultOptions(): ActorSheetOptions;
  
  /**
   * Gets the template data for rendering the sheet
   */
  getData(): ActorSheetData | Promise<ActorSheetData>;
  
  /**
   * Activates event listeners for the actor sheet
   * @param html - The rendered HTML element
   */
  activateListeners(html: JQuery): void;
  
  /**
   * Handles form submission for the actor sheet
   * @param event - The form submission event
   * @param formData - The form data being submitted
   */
  _onSubmit(event: Event, formData?: FormData): Promise<void>;
  
  /**
   * Handles updates to the actor from the sheet
   * @param event - The update event
   * @param formData - The form data
   */
  _updateObject(event: Event, formData: Record<string, unknown>): Promise<void>;
  
  /**
   * Gets the title for the sheet window
   */
  get title(): string;
}

/**
 * Base ItemSheet class for FoundryVTT
 * Handles item sheet rendering and interaction
 */
export declare class ItemSheet extends Application {
  declare options: ItemSheetOptions;
  item: Item;
  
  constructor(item: Item, options?: Partial<ItemSheetOptions>);
  
  /**
   * Gets the default options for item sheets
   */
  static get defaultOptions(): ItemSheetOptions;
  
  /**
   * Gets the template data for rendering the sheet
   */
  getData(): ItemSheetData | Promise<ItemSheetData>;
  
  /**
   * Activates event listeners for the item sheet
   * @param html - The rendered HTML element
   */
  activateListeners(html: JQuery): void;
  
  /**
   * Handles form submission for the item sheet
   * @param event - The form submission event
   * @param formData - The form data being submitted
   */
  _onSubmit(event: Event, formData?: FormData): Promise<void>;
  
  /**
   * Handles updates to the item from the sheet
   * @param event - The update event
   * @param formData - The form data
   */
  _updateObject(event: Event, formData: Record<string, unknown>): Promise<void>;
  
  /**
   * Gets the title for the sheet window
   */
  get title(): string;
}

// Import interfaces from application
interface ApplicationTab {
  navSelector: string;
  contentSelector: string;
  initial: string;
  group?: string;
}

interface DragDropConfiguration {
  dragSelector?: string;
  dropSelector?: string;
  permissions?: Record<string, unknown>;
} 