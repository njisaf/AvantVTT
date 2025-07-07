/**
 * Minimal FoundryVTT UI and Global type definitions
 * Targeting FoundryVTT v13.341+ with essential interfaces only
 */

/**
 * FoundryVTT global UI interface
 * Contains notifications, dialogs, and other UI components
 */
export interface FoundryUI {
  notifications?: NotificationsInterface;
  windows?: Record<number, Application>;
  sidebar?: SidebarInterface;
  nav?: NavigationInterface;
  [key: string]: unknown;
}

export interface NotificationsInterface {
  info(message: string, options?: NotificationOptions): void;
  warn(message: string, options?: NotificationOptions): void;
  error(message: string, options?: NotificationOptions): void;
  [key: string]: unknown;
}

export interface NotificationOptions {
  permanent?: boolean;
  localize?: boolean;
  console?: boolean;
  [key: string]: unknown;
}

export interface SidebarInterface {
  tabs?: Record<string, unknown>;
  activeTab?: string;
  [key: string]: unknown;
}

export interface NavigationInterface {
  [key: string]: unknown;
}

/**
 * FoundryVTT global game interface
 * Contains actors, items, settings, and other game data
 */
export interface FoundryGame {
  actors?: Collection<Actor>;
  items?: Collection<Item>;
  settings?: SettingsInterface;
  user?: User;
  users?: Collection<User>;
  world?: WorldData;
  system?: SystemData;
  [key: string]: unknown;
}

export interface SettingsInterface {
  get(module: string, key: string): unknown;
  set(module: string, key: string, value: unknown): Promise<unknown>;
  register(module: string, key: string, data: SettingRegistration): void;
  [key: string]: unknown;
}

export interface SettingRegistration {
  name?: string;
  hint?: string;
  scope?: 'client' | 'world';
  config?: boolean;
  type?: unknown;
  default?: unknown;
  choices?: Record<string, string>;
  [key: string]: unknown;
}

export interface User {
  id: string;
  name: string;
  role: number;
  active: boolean;
  [key: string]: unknown;
}

export interface WorldData {
  id: string;
  title: string;
  description: string;
  system: string;
  version: string;
  [key: string]: unknown;
}

export interface SystemData {
  id: string;
  title: string;
  description: string;
  version: string;
  compatibility: CompatibilityData;
  [key: string]: unknown;
}

export interface CompatibilityData {
  minimum: string;
  verified: string;
  maximum?: string;
  [key: string]: unknown;
}

/**
 * FoundryVTT Hooks system
 * Allows registering callbacks for game events
 */
export interface HooksInterface {
  on(event: string, callback: Function): void;
  once(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  call(event: string, ...args: unknown[]): boolean;
  callAll(event: string, ...args: unknown[]): void;
  [key: string]: unknown;
}

/**
 * FoundryVTT Core API
 * Contains dice systems and other core functionality
 */
export interface FoundryCore {
  dice?: {
    terms?: {
      Die?: any;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Collection interface used throughout FoundryVTT
export interface Collection<T> {
  contents: T[];
  size: number;
  get(id: string): T | undefined;
  find(predicate: (item: T) => boolean): T | undefined;
  filter(predicate: (item: T) => boolean): T[];
  map<U>(callback: (item: T) => U): U[];
  [Symbol.iterator](): Iterator<T>;
}

// Forward declarations
export interface Application {
  render(): Promise<unknown>;
  close(): Promise<unknown>;
  [key: string]: unknown;
}

export interface Actor {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface Item {
  id: string;
  name: string;
  [key: string]: unknown;
}

// Declare global variables available in FoundryVTT
declare global {
  const ui: FoundryUI;
  const game: FoundryGame;
  const Hooks: {
    on(event: string, callback: Function): void;
    once(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    call(event: string, ...args: unknown[]): boolean;
    callAll(event: string, ...args: unknown[]): void;
    [key: string]: unknown;
  };
  const foundry: FoundryCore;
  
  // jQuery is available globally in FoundryVTT
  const $: JQueryStatic;
  const jQuery: JQueryStatic;
  
  // Socket.io for multiplayer
  const socket: unknown;
  
  // Common FoundryVTT classes
  const Actor: typeof Actor;
  const Item: typeof Item;
  const Roll: unknown;
  const ChatMessage: unknown;
} 