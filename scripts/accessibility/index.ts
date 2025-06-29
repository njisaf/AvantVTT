/**
 * @fileoverview Avant VTT Accessibility Module
 * @description Unified accessibility utilities for WCAG-compliant FoundryVTT development
 * 
 * This module provides a comprehensive suite of accessibility functions
 * that were previously scattered throughout the codebase. All functions
 * are now centralized, well-documented, and follow WCAG 2.1 guidelines.
 * 
 * Key Features:
 * - Color contrast analysis and WCAG compliance checking
 * - Keyboard navigation and focus management
 * - Screen reader support with ARIA utilities
 * - High contrast mode support
 * - Reduced motion preference handling
 * - Focus traps for modal dialogs
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since Accessibility Module Implementation
 */

// Export all type definitions
export type * from './types/accessibility';
export type * from './types/wcag';

// Export all color contrast utilities
export {
  calculateLuminance,
  hexToRgb,
  rgbToHex,
  calculateContrastRatio,
  isLightColor,
  checkColorContrast,
  generateAccessibleTextColor,
  generateColorSuggestions,
  // MIGRATION: Color functions moved from theme-utils
  validateColor,
  mixColors
} from './color-contrast';

// Export keyboard navigation utilities
export {
  KEYBOARD_KEYS,
  handleKeyboardActivation,
  manageFocusOrder,
  addArrowKeyNavigation,
  addKeyboardShortcuts,
  ensureFocusable
} from './keyboard-navigation';

// Export focus management utilities
export {
  createFocusTrap,
  saveFocus,
  moveFocusAfterRemoval
} from './focus-management';

// Export screen reader support utilities
export {
  addAriaLabel,
  announceLiveRegion,
  createAccessibleList,
  detectScreenReader,
  enhanceFormAccessibility
} from './screen-reader';

// Export high contrast utilities
export {
  detectHighContrastMode,
  applyHighContrastTheme,
  removeHighContrastTheme
} from './high-contrast';

// Export reduced motion utilities
export {
  prefersReducedMotion,
  createMotionSafeAnimation,
  disableAnimationsIfNeeded
} from './reduced-motion';

// Export template accessibility helpers
export {
  createAccessibleIcon,
  createAccessibleButton,
  createAccessibleInput,
  createAccessibleTraitInput,
  createAccessibleTraitChip,
  registerAccessibilityHelpers
} from './template-helpers';

// Export WCAG constants for convenience
export { WCAG_CONTRAST_STANDARDS } from './types/wcag';

/**
 * Main accessibility configuration and utilities class.
 * 
 * This class provides a convenient way to configure and manage
 * accessibility features throughout the application.
 */
export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private config: {
    autoContrast: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
    contrastLevel: 'AA' | 'AAA';
    announceChanges: boolean;
    keyboardNavigation: boolean;
  };

  private constructor() {
    this.config = {
      autoContrast: false,
      highContrast: false,
      reducedMotion: false,
      contrastLevel: 'AA',
      announceChanges: true,
      keyboardNavigation: true
    };
  }

  /**
   * Get singleton instance of AccessibilityManager
   */
  public static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  /**
   * Initialize accessibility features with configuration
   */
  public async initialize(config?: Partial<typeof this.config>): Promise<void> {
    if (config) {
      Object.assign(this.config, config);
    }

    // Load configuration from FoundryVTT settings if available
    if (typeof game !== 'undefined' && game.settings) {
      try {
        const savedConfig = game.settings.get('avant', 'accessibility') as typeof this.config;
        Object.assign(this.config, savedConfig);
      } catch (error) {
        // Settings not available or not configured
        console.debug('Accessibility settings not found, using defaults');
      }
    }

    // Apply automatic accessibility features based on user preferences
    this.detectAndApplyUserPreferences();
  }

  /**
   * Get current accessibility configuration
   */
  public getConfig(): typeof this.config {
    return { ...this.config };
  }

  /**
   * Update accessibility configuration
   */
  public updateConfig(newConfig: Partial<typeof this.config>): void {
    Object.assign(this.config, newConfig);
    
    // Save to FoundryVTT settings if available
    if (typeof game !== 'undefined' && game.settings) {
      try {
        game.settings.set('avant', 'accessibility', this.config);
      } catch (error) {
        console.warn('Could not save accessibility settings:', error);
      }
    }

    // Re-apply preferences
    this.detectAndApplyUserPreferences();
  }

  /**
   * Detect user accessibility preferences and apply them
   */
  private detectAndApplyUserPreferences(): void {
    // Import required functions dynamically to avoid circular imports
    import('./reduced-motion').then(({ prefersReducedMotion }) => {
      if (prefersReducedMotion()) {
        this.config.reducedMotion = true;
        document.body.classList.add('prefers-reduced-motion');
      }
    });

    import('./high-contrast').then(({ detectHighContrastMode }) => {
      if (detectHighContrastMode()) {
        this.config.highContrast = true;
        document.body.classList.add('prefers-high-contrast');
      }
    });

    import('./screen-reader').then(({ detectScreenReader, announceLiveRegion }) => {
      const srInfo = detectScreenReader();
      if (srInfo.detected && this.config.announceChanges) {
        // Enable enhanced screen reader support
        document.body.classList.add('screen-reader-detected');
        
        if (srInfo.confidence === 'high') {
          announceLiveRegion('Avant VTT accessibility features enabled', { priority: 'polite' });
        }
      }
    });
  }

  /**
   * Validate and fix accessibility issues in a container element
   */
  public async validateAndFix(container: HTMLElement): Promise<{
    issues: string[];
    fixed: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const fixed: string[] = [];
    const recommendations: string[] = [];

    // Import validation functions
    const { checkColorContrast } = await import('./color-contrast');
    const { ensureFocusable } = await import('./keyboard-navigation');
    const { addAriaLabel } = await import('./screen-reader');

    // Check for missing alt text on images
    const images = container.querySelectorAll('img:not([alt])');
    images.forEach(img => {
      const imgElement = img as HTMLImageElement;
      issues.push(`Image missing alt text: ${imgElement.src || imgElement.className}`);
      imgElement.setAttribute('alt', '');
      fixed.push(`Added empty alt text to decorative image`);
    });

    // Check for missing labels on form controls
    const inputs = container.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const hasLabel = input.hasAttribute('aria-label') || 
                      input.hasAttribute('aria-labelledby') ||
                      container.querySelector(`label[for="${input.id}"]`) ||
                      input.closest('label');
      
      if (!hasLabel && input.id) {
        issues.push(`Form control missing label: ${input.id}`);
        recommendations.push(`Add aria-label or associate with a label element for ${input.id}`);
      }
    });

    // Check for interactive elements without keyboard access
    const interactive = container.querySelectorAll('[onclick], .clickable, [data-action]');
    interactive.forEach(element => {
      if (!element.hasAttribute('tabindex') && 
          !element.matches('button, a, input, select, textarea')) {
        ensureFocusable(element as HTMLElement, { role: 'button' });
        fixed.push(`Made interactive element keyboard accessible: ${element.className || element.tagName}`);
      }
    });

    // Check color contrast if auto-contrast is enabled
    if (this.config.autoContrast) {
      const coloredElements = container.querySelectorAll('[style*="color"], [data-color]');
      for (const element of coloredElements) {
        const style = getComputedStyle(element);
        const textColor = style.color;
        const bgColor = style.backgroundColor;
        
        if (textColor && bgColor && textColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'rgba(0, 0, 0, 0)') {
          const result = checkColorContrast(textColor, bgColor, { level: this.config.contrastLevel });
          if (!result.passes) {
            issues.push(`Low color contrast: ${result.ratio}:1 (required: ${result.details?.requiredRatio}:1)`);
            recommendations.push(`Improve contrast for element: ${element.className || element.tagName}`);
          }
        }
      }
    }

    return { issues, fixed, recommendations };
  }
}

/**
 * Convenience function to get the global accessibility manager instance
 */
export function getAccessibilityManager(): AccessibilityManager {
  return AccessibilityManager.getInstance();
}

/**
 * Quick initialization function for basic accessibility setup
 * 
 * @example
 * ```typescript
 * // Initialize with default settings
 * await initializeAccessibility();
 * 
 * // Initialize with custom configuration
 * await initializeAccessibility({
 *   autoContrast: true,
 *   contrastLevel: 'AAA',
 *   announceChanges: true
 * });
 * ```
 */
export async function initializeAccessibility(config?: {
  autoContrast?: boolean;
  highContrast?: boolean;
  reducedMotion?: boolean;
  contrastLevel?: 'AA' | 'AAA';
  announceChanges?: boolean;
  keyboardNavigation?: boolean;
}): Promise<AccessibilityManager> {
  const manager = getAccessibilityManager();
  await manager.initialize(config);
  return manager;
}

/**
 * Validate accessibility for a given element and return a report
 * 
 * @param element - Element to validate
 * @returns Accessibility validation report
 * 
 * @example
 * ```typescript
 * const report = await validateAccessibility(document.body);
 * if (report.issues.length > 0) {
 *   console.warn('Accessibility issues found:', report.issues);
 * }
 * ```
 */
export async function validateAccessibility(element: HTMLElement): Promise<{
  issues: string[];
  fixed: string[];
  recommendations: string[];
}> {
  const manager = getAccessibilityManager();
  return manager.validateAndFix(element);
}

// Default export for convenience
export default {
  AccessibilityManager,
  getAccessibilityManager,
  initializeAccessibility,
  validateAccessibility
}; 