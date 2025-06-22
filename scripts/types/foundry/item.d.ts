/**
 * Minimal FoundryVTT Item type definitions
 * Targeting FoundryVTT v13.341+ with essential interfaces only
 */

export interface ItemData {
  _id: string;
  name: string;
  type: string;
  img?: string;
  system: Record<string, unknown>;
  effects?: unknown[];
  flags?: Record<string, unknown>;
  folder?: string;
  sort?: number;
  ownership?: Record<string, number>;
  [key: string]: unknown;
}

/**
 * Base Item document for FoundryVTT
 * Represents weapons, armor, spells, and other game items
 */
export declare class Item {
  id: string;
  name: string;
  type: string;
  img: string;
  system: Record<string, unknown>;
  effects: Collection<ActiveEffect>;
  flags: Record<string, unknown>;
  folder: Folder | null;
  sort: number;
  ownership: Record<string, number>;
  parent: Actor | null;
  
  constructor(data: ItemData, context?: Record<string, unknown>);
  
  /**
   * Updates the item with new data
   * @param updates - Data updates to apply
   * @param options - Update options
   */
  update(updates: Record<string, unknown>, options?: Record<string, unknown>): Promise<this>;
  
  /**
   * Deletes the item
   * @param options - Delete options
   */
  delete(options?: Record<string, unknown>): Promise<this>;
  
  /**
   * Creates embedded documents on this item
   * @param embeddedName - The embedded document type
   * @param data - Array of data to create
   * @param options - Creation options
   */
  createEmbeddedDocuments(embeddedName: string, data: Record<string, unknown>[], options?: Record<string, unknown>): Promise<unknown[]>;
  
  /**
   * Updates embedded documents on this item
   * @param embeddedName - The embedded document type
   * @param updates - Array of updates to apply
   * @param options - Update options
   */
  updateEmbeddedDocuments(embeddedName: string, updates: Record<string, unknown>[], options?: Record<string, unknown>): Promise<unknown[]>;
  
  /**
   * Deletes embedded documents from this item
   * @param embeddedName - The embedded document type
   * @param ids - Array of IDs to delete
   * @param options - Delete options
   */
  deleteEmbeddedDocuments(embeddedName: string, ids: string[], options?: Record<string, unknown>): Promise<unknown[]>;
  
  /**
   * Gets the item's sheet application
   */
  get sheet(): ItemSheet;
  
  /**
   * Converts the item to a plain object
   * @param source - Whether to get source data
   */
  toObject(source?: boolean): ItemData;
  
  /**
   * Checks if the item is owned by an actor
   */
  get isOwned(): boolean;
  
  /**
   * Gets the actor that owns this item
   */
  get actor(): Actor | null;
}

// Collection interface for item effects
export interface Collection<T> {
  contents: T[];
  size: number;
  get(id: string): T | undefined;
  find(predicate: (item: T) => boolean): T | undefined;
  filter(predicate: (item: T) => boolean): T[];
  map<U>(callback: (item: T) => U): U[];
  [Symbol.iterator](): Iterator<T>;
}

// Forward declarations to avoid circular dependencies
export interface ItemSheet {
  item: Item;
}

export interface Actor {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface ActiveEffect {
  id: string;
  name: string;
  changes: EffectChange[];
  disabled: boolean;
  [key: string]: unknown;
}

export interface EffectChange {
  key: string;
  mode: number;
  value: string;
  [key: string]: unknown;
}

export interface Folder {
  id: string;
  name: string;
  type: string;
  [key: string]: unknown;
} 