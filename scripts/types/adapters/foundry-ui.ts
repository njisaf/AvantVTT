/**
 * FoundryVTT UI Global Wrapper
 * 
 * Safe wrapper for FoundryVTT UI globals with proper error handling
 * Eliminates the need for repetitive null checks throughout the codebase
 */

/**
 * Safe wrapper for FoundryVTT UI globals with proper error handling
 * All UI interactions should go through this adapter to ensure consistency
 */
export class FoundryUI {
  /**
   * Display a notification to the user
   * Falls back to console logging if UI is not available
   */
  static notify(message: string, type: 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.isUIAvailable()) {
      console[type === 'error' ? 'error' : 'log'](`[FoundryUI] ${type.toUpperCase()}: ${message}`);
      return;
    }
    
    try {
      ui.notifications![type](message);
    } catch (error) {
      console.error(`[FoundryUI] Failed to show notification:`, error);
      console[type === 'error' ? 'error' : 'log'](`[FoundryUI] ${message}`);
    }
  }

  /**
   * Get a game setting value with proper error handling
   * Returns undefined if the setting cannot be accessed
   */
  static getSetting(module: string, key: string): unknown {
    if (!this.isGameAvailable()) {
      console.warn(`[FoundryUI] Cannot access setting: ${module}.${key} - game not ready`);
      return undefined;
    }
    
    try {
      return game.settings?.get(module, key);
    } catch (error) {
      console.error(`[FoundryUI] Failed to get setting ${module}.${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set a game setting value with proper error handling
   * Returns true if successful, false otherwise
   */
  static async setSetting(module: string, key: string, value: unknown): Promise<boolean> {
    if (!this.isGameAvailable()) {
      console.warn(`[FoundryUI] Cannot set setting: ${module}.${key} - game not ready`);
      return false;
    }
    
    try {
      await game.settings?.set(module, key, value);
      return true;
    } catch (error) {
      console.error(`[FoundryUI] Failed to set setting ${module}.${key}:`, error);
      return false;
    }
  }

  /**
   * Register a game setting with proper error handling
   * Returns true if successful, false otherwise
   */
  static registerSetting(module: string, key: string, data: any): boolean {
    if (!this.isGameAvailable()) {
      console.warn(`[FoundryUI] Cannot register setting: ${module}.${key} - game not ready`);
      return false;
    }
    
    try {
      game.settings?.register(module, key, data);
      return true;
    } catch (error) {
      console.error(`[FoundryUI] Failed to register setting ${module}.${key}:`, error);
      return false;
    }
  }

  /**
   * Get the current user with proper error handling
   * Returns null if user is not available
   */
  static getCurrentUser(): any | null {
    if (!this.isGameAvailable()) {
      return null;
    }
    
    return (game as any).user || null;
  }

  /**
   * Check if the current user has a specific role
   * Returns false if user cannot be determined
   */
  static userHasRole(minimumRole: number): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    return user.role >= minimumRole;
  }

  /**
   * Check if FoundryVTT UI is available and initialized
   */
  static isUIAvailable(): boolean {
    return typeof ui !== 'undefined' && 
           ui !== null && 
           ui.notifications !== undefined;
  }

  /**
   * Check if FoundryVTT game is available and ready
   */
  static isGameAvailable(): boolean {
    return typeof game !== 'undefined' && 
           game !== null && 
           game.settings !== undefined;
  }

  /**
   * Check if FoundryVTT is fully initialized (UI + Game)
   */
  static isFoundryReady(): boolean {
    return this.isUIAvailable() && this.isGameAvailable();
  }

  /**
   * Call a hook with proper error handling
   * Returns false if hooks are not available
   */
  static callHook(hookName: string, ...args: unknown[]): boolean {
    if (typeof Hooks === 'undefined') {
      console.warn(`[FoundryUI] Cannot call hook ${hookName} - Hooks not available`);
      return false;
    }
    
    try {
      return Hooks.call(hookName, ...args);
    } catch (error) {
      console.error(`[FoundryUI] Error calling hook ${hookName}:`, error);
      return false;
    }
  }

  /**
   * Register a hook listener with proper error handling
   * Returns true if successful, false otherwise
   */
  static onHook(hookName: string, callback: Function): boolean {
    if (typeof Hooks === 'undefined') {
      console.warn(`[FoundryUI] Cannot register hook ${hookName} - Hooks not available`);
      return false;
    }
    
    try {
      Hooks.on(hookName, callback);
      return true;
    } catch (error) {
      console.error(`[FoundryUI] Error registering hook ${hookName}:`, error);
      return false;
    }
  }

  /**
   * Register a one-time hook listener with proper error handling
   * Returns true if successful, false otherwise
   */
  static onceHook(hookName: string, callback: Function): boolean {
    if (typeof Hooks === 'undefined') {
      console.warn(`[FoundryUI] Cannot register hook ${hookName} - Hooks not available`);
      return false;
    }
    
    try {
      Hooks.once(hookName, callback);
      return true;
    } catch (error) {
      console.error(`[FoundryUI] Error registering one-time hook ${hookName}:`, error);
      return false;
    }
  }
} 