/**
 * Global type declarations for AvantVTT system
 * 
 * This file extends the global scope with system-specific types
 * and ensures compatibility with our local FoundryVTT type library.
 */

// JSON module declarations
declare module '*.json' {
  const value: any;
  export default value;
}

// System-specific global extensions
declare global {
  interface Window {
    AvantVTT?: {
      version: string;
      debug: boolean;
    };
  }
}

export {}; 