/**
 * @fileoverview General Accessibility Type Definitions
 * @description Type definitions for accessibility features and configurations
 */

import type { WCAGLevel, MotionPreferences, HighContrastPreferences, ScreenReaderInfo } from './wcag';

/**
 * RGB color representation
 */
export interface RGBColor {
  /** Red component (0-255) */
  r: number;
  
  /** Green component (0-255) */
  g: number;
  
  /** Blue component (0-255) */
  b: number;
}

/**
 * HSL color representation
 */
export interface HSLColor {
  /** Hue (0-360) */
  h: number;
  
  /** Saturation (0-100) */
  s: number;
  
  /** Lightness (0-100) */
  l: number;
}

/**
 * Color contrast calculation options
 */
export interface ContrastOptions {
  /** WCAG compliance level ('AA' | 'AAA') */
  level?: WCAGLevel;
  
  /** Whether to return suggestions for fixing low contrast */
  provideSuggestions?: boolean;
  
  /** Minimum contrast ratio override */
  minRatio?: number;
  
  /** Text size for calculation ('normal' | 'large') */
  textSize?: 'normal' | 'large';
}

/**
 * Color contrast calculation result
 */
export interface ContrastResult {
  /** Calculated contrast ratio */
  ratio: number;
  
  /** Whether the contrast meets WCAG standards */
  passes: boolean;
  
  /** WCAG level that passes (if any) */
  level?: WCAGLevel;
  
  /** Suggested colors if contrast is insufficient */
  suggestions?: ColorSuggestion[];
  
  /** Details about the calculation */
  details?: {
    foregroundLuminance: number;
    backgroundLuminance: number;
    requiredRatio: number;
  };
}

/**
 * Color suggestion for improving contrast
 */
export interface ColorSuggestion {
  /** Suggested color value */
  color: string;
  
  /** Resulting contrast ratio */
  ratio: number;
  
  /** Description of the change */
  description: string;
  
  /** Type of suggestion */
  type: 'foreground' | 'background' | 'both';
}

/**
 * Focus trap configuration options
 */
export interface FocusTrapOptions {
  /** Element to focus initially */
  initialFocus?: string | HTMLElement;
  
  /** Whether to return focus to trigger element on deactivation */
  returnFocus?: boolean;
  
  /** Whether ESC key deactivates the trap */
  escapeDeactivates?: boolean;
  
  /** Whether clicking outside deactivates the trap */
  clickOutsideDeactivates?: boolean;
  
  /** Callback when trap is activated */
  onActivate?: () => void;
  
  /** Callback when trap is deactivated */
  onDeactivate?: () => void;
}

/**
 * Focus trap instance
 */
export interface FocusTrap {
  /** Activate the focus trap */
  activate(): void;
  
  /** Deactivate the focus trap */
  deactivate(): void;
  
  /** Whether the trap is currently active */
  active: boolean;
  
  /** The container element */
  container: HTMLElement;
}

/**
 * Keyboard navigation options
 */
export interface KeyboardNavigationOptions {
  /** Whether to enable arrow key navigation */
  enableArrowKeys?: boolean;
  
  /** Whether to enable Home/End key navigation */
  enableHomeEnd?: boolean;
  
  /** Whether to wrap focus around container */
  wrapFocus?: boolean;
  
  /** Custom key handlers */
  keyHandlers?: Record<string, (event: KeyboardEvent) => void>;
}

/**
 * ARIA live region configuration
 */
export interface LiveRegionOptions {
  /** Politeness level */
  priority?: 'polite' | 'assertive' | 'off';
  
  /** Whether to clear previous announcements */
  clearPrevious?: boolean;
  
  /** Delay before announcement (ms) */
  delay?: number;
  
  /** Whether to announce if document has focus */
  announceWhenFocused?: boolean;
}

/**
 * Accessible list configuration
 */
export interface AccessibleListOptions {
  /** ARIA role for the list */
  role?: 'list' | 'listbox' | 'menu' | 'tree';
  
  /** Whether multiple items can be selected */
  multiselectable?: boolean;
  
  /** ARIA label for the list */
  label?: string;
  
  /** Whether items are checkable */
  checkable?: boolean;
  
  /** Orientation of the list */
  orientation?: 'vertical' | 'horizontal';
}

/**
 * High contrast theme configuration
 */
export interface HighContrastTheme {
  /** Background color */
  background: string;
  
  /** Primary text color */
  text: string;
  
  /** Link color */
  link: string;
  
  /** Border color */
  border: string;
  
  /** Focus indicator color */
  focus: string;
  
  /** Button background color */
  buttonBackground?: string;
  
  /** Button text color */
  buttonText?: string;
}

/**
 * Animation configuration respecting motion preferences
 */
export interface MotionSafeAnimation {
  /** Full animation for users who don't prefer reduced motion */
  fullAnimation: {
    /** CSS properties to animate */
    properties: Record<string, string>;
    
    /** Animation duration in milliseconds */
    duration: number;
    
    /** Animation easing function */
    easing?: string;
  };
  
  /** Reduced animation fallback */
  reducedAnimation?: {
    /** CSS properties for reduced motion */
    properties: Record<string, string>;
    
    /** Reduced duration */
    duration: number;
  };
  
  /** No animation fallback (just apply final state) */
  staticFallback?: Record<string, string>;
}

/**
 * Accessibility test result
 */
export interface AccessibilityTestResult {
  /** Whether the test passed */
  passes: boolean;
  
  /** Issues found during testing */
  issues: string[];
  
  /** Recommendations for improvement */
  recommendations: string[];
  
  /** Test score (0-100) */
  score: number;
  
  /** Specific test details */
  details: Record<string, any>;
}

/**
 * Complete accessibility configuration
 */
export interface AccessibilityConfig {
  /** Color contrast settings */
  contrast: {
    enabled: boolean;
    level: WCAGLevel;
    autoFix: boolean;
  };
  
  /** Keyboard navigation settings */
  keyboard: {
    enabled: boolean;
    focusTraps: boolean;
    enhancedFocus: boolean;
  };
  
  /** Screen reader settings */
  screenReader: {
    enabled: boolean;
    announcements: boolean;
    verbosity: 'minimal' | 'normal' | 'verbose';
  };
  
  /** Motion preferences */
  motion: MotionPreferences;
  
  /** High contrast preferences */
  highContrast: HighContrastPreferences;
  
  /** Screen reader information */
  screenReaderInfo: ScreenReaderInfo;
}

/**
 * Trait rendering accessibility options
 */
export interface TraitAccessibilityOptions {
  /** Enable accessibility auto-contrast (default: false) */
  enableAutoContrast?: boolean;
  
  /** WCAG compliance level for auto-contrast */
  contrastLevel?: WCAGLevel;
  
  /** Force high contrast mode for traits */
  forceHighContrast?: boolean;
  
  /** Add enhanced ARIA labels */
  enhancedAria?: boolean;
}

/**
 * Theme accessibility validation result
 */
export interface ThemeAccessibilityResult {
  /** Whether theme passes accessibility checks */
  passes: boolean;
  
  /** Accessibility issues found */
  issues: string[];
  
  /** Suggestions for improvement */
  suggestions: string[];
  
  /** Auto-fixed theme (if applicable) */
  fixedTheme?: any;
  
  /** Contrast ratio analysis */
  contrastAnalysis: {
    textContrast: ContrastResult;
    linkContrast: ContrastResult;
    borderContrast: ContrastResult;
  };
} 