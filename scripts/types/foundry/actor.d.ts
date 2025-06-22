/**
 * Minimal FoundryVTT Actor type definitions
 * Targeting FoundryVTT v13.341+ with essential interfaces only
 */

export interface ActorData {
  _id: string;
  name: string;
  type: string;
  img?: string;
  system: Record<string, unknown>;
  items?: unknown[];
  effects?: unknown[];
  flags?: Record<string, unknown>;
  folder?: string;
  sort?: number;
  ownership?: Record<string, number>;
  prototypeToken?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Base Actor document for FoundryVTT
 * Represents a character, NPC, or other game entity
 */
export declare class Actor {
  id: string;
  name: string;
  type: string;
  img: string;
  system: Record<string, unknown>;
  items: Collection<Item>;
  effects: Collection<ActiveEffect>;
  flags: Record<string, unknown>;
  folder: Folder | null;
  sort: number;
  ownership: Record<string, number>;
  prototypeToken: Record<string, unknown>;
  
  constructor(data: ActorData, context?: Record<string, unknown>);
  
  /**
   * Updates the actor with new data
   * @param updates - Data updates to apply
   * @param options - Update options
   */
  update(updates: Record<string, unknown>, options?: Record<string, unknown>): Promise<this>;
  
  /**
   * Deletes the actor
   * @param options - Delete options
   */
  delete(options?: Record<string, unknown>): Promise<this>;
  
  /**
   * Creates an embedded item on this actor
   * @param itemData - The item data to create
   * @param options - Creation options
   */
  createEmbeddedDocuments(embeddedName: string, data: Record<string, unknown>[], options?: Record<string, unknown>): Promise<unknown[]>;
  
  /**
   * Updates embedded documents on this actor
   * @param embeddedName - The embedded document type
   * @param updates - Array of updates to apply
   * @param options - Update options
   */
  updateEmbeddedDocuments(embeddedName: string, updates: Record<string, unknown>[], options?: Record<string, unknown>): Promise<unknown[]>;
  
  /**
   * Deletes embedded documents from this actor
   * @param embeddedName - The embedded document type
   * @param ids - Array of IDs to delete
   * @param options - Delete options
   */
  deleteEmbeddedDocuments(embeddedName: string, ids: string[], options?: Record<string, unknown>): Promise<unknown[]>;
  
  /**
   * Gets the actor's sheet application
   */
  get sheet(): ActorSheet;
  
  /**
   * Converts the actor to a plain object
   * @param source - Whether to get source data
   */
  toObject(source?: boolean): ActorData;
}

// Collection interface for actor items/effects
export interface Collection<T> {
  contents: T[];
  size: number;
  get(id: string): T | undefined;
  find(predicate: (item: T) => boolean): T | undefined;
  filter(predicate: (item: T) => boolean): T[];
  map<U>(callback: (item: T) => U): U[];
  [Symbol.iterator](): Iterator<T>;
}

// Forward declaration for circular dependency
export interface ActorSheet {
  actor: Actor;
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

export interface Item {
  id: string;
  name: string;
  type: string;
  system: Record<string, unknown>;
  [key: string]: unknown;
} 