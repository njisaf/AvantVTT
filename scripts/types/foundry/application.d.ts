/**
 * Minimal FoundryVTT Application type definitions
 * Targeting FoundryVTT v13.341+ with essential interfaces only
 */

export interface ApplicationOptions {
  id?: string;
  classes?: string[];
  template?: string;
  width?: number;
  height?: number;
  minimizable?: boolean;
  resizable?: boolean;
  title?: string;
  tabs?: ApplicationTab[];
  dragDrop?: DragDropConfiguration[];
  [key: string]: unknown;
}

export interface ApplicationTab {
  navSelector: string;
  contentSelector: string;
  initial: string;
  group?: string;
}

export interface DragDropConfiguration {
  dragSelector?: string;
  dropSelector?: string;
  permissions?: Record<string, unknown>;
}

export interface ApplicationRenderOptions {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scale?: number;
  focus?: boolean;
  renderContext?: string;
  renderData?: Record<string, unknown>;
}

/**
 * Base Application class for FoundryVTT
 * Handles window management and basic UI functionality
 */
export declare class Application {
  options: ApplicationOptions;
  appId: number;
  element: JQuery;
  position: ApplicationPosition;
  
  constructor(options?: Partial<ApplicationOptions>);
  
  /**
   * Renders the application UI
   * @param force - Force re-render even if already rendered
   * @param options - Rendering options
   */
  render(force?: boolean, options?: ApplicationRenderOptions): Promise<this>;
  
  /**
   * Closes the application
   * @param options - Close options
   */
  close(options?: Record<string, unknown>): Promise<void>;
  
  /**
   * Activates event listeners for the application
   * @param html - The rendered HTML element
   */
  activateListeners(html: JQuery): void;
  
  /**
   * Gets the application data for template rendering
   */
  getData(): Record<string, unknown> | Promise<Record<string, unknown>>;
  
  /**
   * Defines the default options for this application
   */
  static get defaultOptions(): ApplicationOptions;
}

export interface ApplicationPosition {
  left: number;
  top: number;
  width: number;
  height: number;
  scale: number;
} 