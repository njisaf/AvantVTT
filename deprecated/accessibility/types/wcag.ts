/**
 * @fileoverview WCAG 2.1 Compliance Type Definitions
 * @description Type definitions for Web Content Accessibility Guidelines compliance
 */

/**
 * WCAG compliance levels
 */
export type WCAGLevel = 'A' | 'AA' | 'AAA';

/**
 * WCAG contrast ratio requirements
 */
export interface WCAGContrastRequirements {
  /** Normal text minimum contrast ratio */
  normalText: number;
  
  /** Large text minimum contrast ratio */
  largeText: number;
  
  /** UI components and graphics minimum contrast ratio */
  uiComponents: number;
}

/**
 * WCAG contrast ratio standards by compliance level
 */
export const WCAG_CONTRAST_STANDARDS: Record<WCAGLevel, WCAGContrastRequirements> = {
  'A': {
    normalText: 3.0,
    largeText: 2.0,
    uiComponents: 2.0
  },
  'AA': {
    normalText: 4.5,
    largeText: 3.0,
    uiComponents: 3.0
  },
  'AAA': {
    normalText: 7.0,
    largeText: 4.5,
    uiComponents: 4.5
  }
};

/**
 * Text size categories for contrast calculations
 */
export type TextSize = 'normal' | 'large';

/**
 * WCAG success criteria
 */
export interface WCAGSuccessCriteria {
  /** Criterion identifier (e.g., '1.4.3') */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** WCAG compliance level */
  level: WCAGLevel;
  
  /** Brief description */
  description: string;
  
  /** Whether this criterion is met */
  passes: boolean;
  
  /** Additional details or recommendations */
  details?: string;
}

/**
 * Comprehensive WCAG compliance report
 */
export interface WCAGComplianceReport {
  /** Overall compliance level achieved */
  level: WCAGLevel | null;
  
  /** Whether all required criteria pass */
  passes: boolean;
  
  /** Individual success criteria results */
  criteria: WCAGSuccessCriteria[];
  
  /** Summary of issues found */
  issues: string[];
  
  /** Recommendations for improvement */
  recommendations: string[];
  
  /** Total score (0-100) */
  score: number;
}

/**
 * WCAG color contrast success criterion (1.4.3 and 1.4.6)
 */
export interface ColorContrastCriterion {
  /** Success criterion identifier */
  id: '1.4.3' | '1.4.6';
  
  /** Required contrast ratio */
  requiredRatio: number;
  
  /** Actual contrast ratio */
  actualRatio: number;
  
  /** Whether criterion is met */
  passes: boolean;
  
  /** Text size category */
  textSize: TextSize;
  
  /** Foreground color */
  foreground: string;
  
  /** Background color */
  background: string;
}

/**
 * WCAG keyboard accessibility criterion (2.1.1)
 */
export interface KeyboardAccessibilityCriterion {
  /** Success criterion identifier */
  id: '2.1.1' | '2.1.2';
  
  /** Whether all functionality is keyboard accessible */
  keyboardAccessible: boolean;
  
  /** Whether there are keyboard traps */
  hasKeyboardTraps: boolean;
  
  /** Elements that failed keyboard accessibility */
  failedElements: string[];
  
  /** Whether criterion is met */
  passes: boolean;
}

/**
 * WCAG focus visibility criterion (2.4.7)
 */
export interface FocusVisibilityCriterion {
  /** Success criterion identifier */
  id: '2.4.7';
  
  /** Whether focus indicators are visible */
  focusVisible: boolean;
  
  /** Whether focus indicators have sufficient contrast */
  focusContrast: boolean;
  
  /** Elements with poor focus indicators */
  poorFocusElements: string[];
  
  /** Whether criterion is met */
  passes: boolean;
}

/**
 * WCAG text alternatives criterion (1.1.1)
 */
export interface TextAlternativesCriterion {
  /** Success criterion identifier */
  id: '1.1.1';
  
  /** Images without alt text */
  missingAltText: string[];
  
  /** Decorative images not marked as such */
  unmarkedDecorative: string[];
  
  /** Whether criterion is met */
  passes: boolean;
}

/**
 * Motion preferences for accessibility
 */
export interface MotionPreferences {
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean;
  
  /** Whether animations should be disabled */
  disableAnimations: boolean;
  
  /** Whether parallax effects should be disabled */
  disableParallax: boolean;
  
  /** Whether auto-playing media should be disabled */
  disableAutoplay: boolean;
}

/**
 * High contrast preferences
 */
export interface HighContrastPreferences {
  /** Whether high contrast mode is enabled */
  enabled: boolean;
  
  /** High contrast color scheme */
  scheme: 'dark' | 'light' | 'custom';
  
  /** Custom high contrast colors */
  customColors?: {
    background: string;
    text: string;
    link: string;
    border: string;
  };
}

/**
 * Screen reader preferences and capabilities
 */
export interface ScreenReaderInfo {
  /** Whether a screen reader is detected */
  detected: boolean;
  
  /** Screen reader name if detectable */
  name?: string;
  
  /** Whether live regions are supported */
  supportsLiveRegions: boolean;
  
  /** Whether ARIA landmarks are supported */
  supportsLandmarks: boolean;
  
  /** Preferred announcement verbosity */
  verbosity: 'minimal' | 'normal' | 'verbose';
} 