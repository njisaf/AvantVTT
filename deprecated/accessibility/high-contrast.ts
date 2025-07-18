/**
 * @fileoverview High Contrast Mode Support
 * @description Utilities for high contrast mode detection and application
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since Accessibility Module Implementation
 */

import type { HighContrastTheme } from './types/accessibility';

/**
 * Detect if user has high contrast mode enabled.
 * 
 * @returns True if high contrast mode is detected
 */
export function detectHighContrastMode(): boolean {
  if (window.matchMedia) {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }
  return false;
}

/**
 * Apply high contrast theme to an element.
 * 
 * @param element - Element to apply theme to
 * @param theme - High contrast theme configuration
 */
export function applyHighContrastTheme(
  element: HTMLElement,
  theme: HighContrastTheme
): void {
  element.style.setProperty('--hc-background', theme.background);
  element.style.setProperty('--hc-text', theme.text);
  element.style.setProperty('--hc-link', theme.link);
  element.style.setProperty('--hc-border', theme.border);
  element.style.setProperty('--hc-focus', theme.focus);
  
  element.classList.add('high-contrast-mode');
}

/**
 * Remove high contrast theme from an element.
 * 
 * @param element - Element to remove theme from
 */
export function removeHighContrastTheme(element: HTMLElement): void {
  element.style.removeProperty('--hc-background');
  element.style.removeProperty('--hc-text');
  element.style.removeProperty('--hc-link');
  element.style.removeProperty('--hc-border');
  element.style.removeProperty('--hc-focus');
  
  element.classList.remove('high-contrast-mode');
} 