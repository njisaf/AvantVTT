/**
 * @fileoverview Theme Domain Types
 * @description Type definitions for the UI theming system
 * @version 2.0.0
 * @author Avant Development Team
 */

/**
 * Represents a color palette for theming.
 * Contains all the colors needed for a complete theme.
 */
export interface ColorPalette {
  /** Primary brand color */
  primary: string;
  /** Secondary accent color */
  secondary: string;
  /** Background color for main areas */
  background: string;
  /** Background color for secondary areas */
  backgroundSecondary: string;
  /** Primary text color */
  text: string;
  /** Secondary text color (muted) */
  textSecondary: string;
  /** Border color for UI elements */
  border: string;
  /** Color for success states */
  success: string;
  /** Color for warning states */
  warning: string;
  /** Color for error states */
  error: string;
  /** Color for informational states */
  info: string;
}

/**
 * CSS custom properties (variables) for theme implementation.
 * These map to actual CSS variables used in stylesheets.
 */
export interface ThemeVariables {
  /** Color variables */
  '--avant-color-primary': string;
  '--avant-color-secondary': string;
  '--avant-color-background': string;
  '--avant-color-background-secondary': string;
  '--avant-color-text': string;
  '--avant-color-text-secondary': string;
  '--avant-color-border': string;
  '--avant-color-success': string;
  '--avant-color-warning': string;
  '--avant-color-error': string;
  '--avant-color-info': string;
  
  /** Typography variables */
  '--avant-font-family-primary': string;
  '--avant-font-family-display': string;
  '--avant-font-size-base': string;
  '--avant-line-height-base': string;
  
  /** Spacing variables */
  '--avant-spacing-xs': string;
  '--avant-spacing-sm': string;
  '--avant-spacing-md': string;
  '--avant-spacing-lg': string;
  '--avant-spacing-xl': string;
  
  /** Border radius variables */
  '--avant-border-radius-sm': string;
  '--avant-border-radius-md': string;
  '--avant-border-radius-lg': string;
  
  /** Shadow variables */
  '--avant-shadow-sm': string;
  '--avant-shadow-md': string;
  '--avant-shadow-lg': string;
}

/**
 * Complete theme configuration.
 * Defines all aspects of a theme including metadata and styling.
 */
export interface ThemeConfig {
  /** Unique theme identifier */
  id: string;
  /** Human-readable theme name */
  name: string;
  /** Theme description */
  description?: string;
  /** Theme author */
  author?: string;
  /** Theme version */
  version?: string;
  /** Base theme this extends (if any) */
  extends?: string;
  
  /** Color palette for this theme */
  colors: ColorPalette;
  
  /** Typography settings */
  typography?: {
    /** Primary font family */
    fontFamily?: string;
    /** Display font family (for headings) */
    displayFont?: string;
    /** Base font size */
    fontSize?: string;
    /** Base line height */
    lineHeight?: string;
  };
  
  /** Spacing scale */
  spacing?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  
  /** Border radius scale */
  borderRadius?: {
    sm?: string;
    md?: string;
    lg?: string;
  };
  
  /** Shadow definitions */
  shadows?: {
    sm?: string;
    md?: string;
    lg?: string;
  };
  
  /** Custom CSS variables */
  customVariables?: Record<string, string>;
}

/**
 * Result of theme validation.
 * Contains validation status and any errors found.
 */
export interface ThemeValidationResult {
  /** Whether the theme is valid */
  valid: boolean;
  /** Array of validation errors */
  errors: string[];
  /** Array of validation warnings */
  warnings: string[];
  /** The validated theme config (if valid) */
  theme?: ThemeConfig;
}

/**
 * Theme manager state.
 * Tracks the currently active theme and available themes.
 */
export interface ThemeManagerState {
  /** Currently active theme ID */
  activeTheme: string;
  /** Available theme configurations */
  availableThemes: Record<string, ThemeConfig>;
  /** Whether themes are currently being loaded */
  loading: boolean;
  /** Any error that occurred during theme operations */
  error?: string;
}

/**
 * Context menu entry for theme-related actions.
 * Used in right-click context menus and similar interfaces.
 */
export interface ContextMenuEntry {
  /** Display text for the menu item */
  label: string;
  /** Icon to display (optional) */
  icon?: string;
  /** Callback function when item is selected */
  callback: () => void;
  /** Whether this item is enabled */
  enabled?: boolean;
  /** CSS classes to apply to the menu item */
  classes?: string[];
  /** Submenu items (if this is a parent menu) */
  submenu?: ContextMenuEntry[];
} 