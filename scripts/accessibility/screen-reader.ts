/**
 * @fileoverview Screen Reader Support Utilities
 * @description Functions for enhancing screen reader accessibility
 * 
 * This module provides utilities for:
 * - ARIA label management
 * - Live region announcements
 * - Semantic structure helpers
 * - Screen reader detection
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since Accessibility Module Implementation
 */

import type { LiveRegionOptions, AccessibleListOptions } from './types/accessibility';

/**
 * Add comprehensive ARIA labeling to an element.
 * 
 * This function ensures elements have proper labels and descriptions
 * for screen reader users, following WCAG 4.1.2 guidelines.
 * 
 * @param element - Element to enhance with ARIA labels
 * @param label - Primary accessible label
 * @param description - Optional detailed description
 * 
 * @example
 * ```typescript
 * const deleteButton = document.querySelector('.delete-btn');
 * addAriaLabel(
 *   deleteButton, 
 *   'Delete Trait', 
 *   'Permanently removes this trait from the character'
 * );
 * ```
 */
export function addAriaLabel(
  element: HTMLElement,
  label: string,
  description?: string
): void {
  // Add primary label if not already present
  if (!element.hasAttribute('aria-label') && 
      !element.hasAttribute('aria-labelledby')) {
    element.setAttribute('aria-label', label);
  }
  
  // Add description if provided and not already present
  if (description && 
      !element.hasAttribute('aria-description') && 
      !element.hasAttribute('aria-describedby')) {
    element.setAttribute('aria-description', description);
  }
}

/**
 * Create a live region for dynamic announcements to screen readers.
 * 
 * Live regions allow screen readers to announce dynamic content changes
 * without disrupting the user's current focus.
 * 
 * @param message - Message to announce
 * @param options - Configuration options
 * 
 * @example
 * ```typescript
 * // Polite announcement (doesn't interrupt current speech)
 * announceLiveRegion('Trait successfully added', { priority: 'polite' });
 * 
 * // Assertive announcement (interrupts current speech)
 * announceLiveRegion('Critical error occurred', { priority: 'assertive' });
 * ```
 */
export function announceLiveRegion(
  message: string,
  options: LiveRegionOptions = {}
): void {
  const {
    priority = 'polite',
    clearPrevious = true,
    delay = 100,
    announceWhenFocused = true
  } = options;
  
  // Check if we should announce when document doesn't have focus
  if (!announceWhenFocused && !document.hasFocus()) {
    return;
  }
  
  // Find or create live region
  let liveRegion = document.querySelector(`[aria-live="${priority}"][data-avant-live-region]`) as HTMLElement;
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('data-avant-live-region', 'true');
    
    // Hide the live region visually but keep it accessible to screen readers
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(liveRegion);
  }
  
  // Clear previous content if requested
  if (clearPrevious) {
    liveRegion.textContent = '';
  }
  
  // Add the message after a small delay to ensure screen readers notice the change
  setTimeout(() => {
    if (clearPrevious) {
      liveRegion.textContent = message;
    } else {
      liveRegion.textContent += (liveRegion.textContent ? ' ' : '') + message;
    }
  }, delay);
}

/**
 * Create an accessible list with proper ARIA attributes.
 * 
 * This function enhances lists with appropriate ARIA roles and properties
 * for better screen reader navigation.
 * 
 * @param items - Array of items to include in the list
 * @param options - Configuration options
 * @returns Enhanced list element
 * 
 * @example
 * ```typescript
 * const traitList = createAccessibleList(traits, {
 *   role: 'listbox',
 *   label: 'Available Character Traits',
 *   multiselectable: false
 * });
 * 
 * container.appendChild(traitList);
 * ```
 */
export function createAccessibleList(
  items: any[],
  options: AccessibleListOptions = {}
): HTMLElement {
  const {
    role = 'list',
    multiselectable = false,
    label,
    checkable = false,
    orientation = 'vertical'
  } = options;
  
  // Create list container
  const listElement = document.createElement('ul');
  listElement.setAttribute('role', role);
  
  if (label) {
    listElement.setAttribute('aria-label', label);
  }
  
  if (role === 'listbox' || role === 'menu') {
    listElement.setAttribute('aria-orientation', orientation);
    
    if (multiselectable) {
      listElement.setAttribute('aria-multiselectable', 'true');
    }
  }
  
  // Create list items
  items.forEach((item, index) => {
    const listItem = document.createElement('li');
    
    // Set appropriate item role
    const itemRole = role === 'listbox' ? 'option' :
                    role === 'menu' ? 'menuitem' :
                    role === 'tree' ? 'treeitem' : 'listitem';
    
    listItem.setAttribute('role', itemRole);
    listItem.setAttribute('tabindex', index === 0 ? '0' : '-1');
    
    if (checkable) {
      listItem.setAttribute('aria-checked', 'false');
    }
    
    // Add item content
    if (typeof item === 'string') {
      listItem.textContent = item;
    } else if (item.name || item.label) {
      listItem.textContent = item.name || item.label;
      
      if (item.description) {
        listItem.setAttribute('aria-description', item.description);
      }
    }
    
    listElement.appendChild(listItem);
  });
  
  return listElement;
}

/**
 * Detect if a screen reader is likely being used.
 * 
 * This function uses various heuristics to detect screen reader usage,
 * though detection is not always reliable or necessary.
 * 
 * @returns Object with screen reader detection information
 * 
 * @example
 * ```typescript
 * const srInfo = detectScreenReader();
 * if (srInfo.detected) {
 *   // Provide enhanced screen reader experience
 *   enableVerboseDescriptions();
 * }
 * ```
 */
export function detectScreenReader(): {
  detected: boolean;
  confidence: 'high' | 'medium' | 'low';
  indicators: string[];
} {
  const indicators: string[] = [];
  
  // Check for known screen reader user agents
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('nvda') || userAgent.includes('jaws') || userAgent.includes('dragon')) {
    indicators.push('screen-reader-user-agent');
  }
  
  // Check for reduced motion preference (often correlates with screen reader use)
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    indicators.push('prefers-reduced-motion');
  }
  
  // Check for high contrast preference
  if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
    indicators.push('prefers-high-contrast');
  }
  
  // Check if focus is being managed programmatically (possible screen reader)
  const hasTabIndex = document.querySelectorAll('[tabindex]').length > 0;
  if (hasTabIndex) {
    indicators.push('programmatic-focus-management');
  }
  
  // Check for ARIA usage (may indicate accessibility-conscious setup)
  const hasAriaLabels = document.querySelectorAll('[aria-label], [aria-labelledby]').length > 0;
  if (hasAriaLabels) {
    indicators.push('aria-labels-present');
  }
  
  const detected = indicators.length > 0;
  let confidence: 'high' | 'medium' | 'low' = 'low';
  
  if (indicators.includes('screen-reader-user-agent')) {
    confidence = 'high';
  } else if (indicators.length >= 2) {
    confidence = 'medium';
  }
  
  return {
    detected,
    confidence,
    indicators
  };
}

/**
 * Enhance form controls with better screen reader support.
 * 
 * This function adds missing labels, descriptions, and error messages
 * to form controls for better accessibility.
 * 
 * @param form - Form element to enhance
 * 
 * @example
 * ```typescript
 * const characterSheet = document.querySelector('.character-sheet form');
 * enhanceFormAccessibility(characterSheet);
 * ```
 */
export function enhanceFormAccessibility(form: HTMLFormElement): void {
  // Find all form controls
  const controls = form.querySelectorAll<HTMLElement>(
    'input, select, textarea, [role="combobox"], [role="spinbutton"]'
  );
  
  controls.forEach(control => {
    // Ensure each control has a label
    if (!control.hasAttribute('aria-label') && 
        !control.hasAttribute('aria-labelledby') &&
        !form.querySelector(`label[for="${control.id}"]`)) {
      
      // Try to find an associated label by looking at nearby text
      const parentLabel = control.closest('label');
      if (parentLabel) {
        // Control is inside a label
        return;
      }
      
      // Look for preceding text that might be a label
      const prevSibling = control.previousElementSibling;
      if (prevSibling && prevSibling.textContent) {
        control.setAttribute('aria-label', prevSibling.textContent.trim());
      }
    }
    
    // Add required indicator for required fields
    if (control.hasAttribute('required') && !control.hasAttribute('aria-required')) {
      control.setAttribute('aria-required', 'true');
    }
    
    // Add invalid state for fields with validation errors
    if (control.matches(':invalid') && !control.hasAttribute('aria-invalid')) {
      control.setAttribute('aria-invalid', 'true');
    }
  });
  
  // Enhance fieldsets with proper naming
  const fieldsets = form.querySelectorAll('fieldset');
  fieldsets.forEach(fieldset => {
    const legend = fieldset.querySelector('legend');
    if (legend && !fieldset.hasAttribute('aria-labelledby')) {
      if (!legend.id) {
        legend.id = `legend-${Math.random().toString(36).substr(2, 9)}`;
      }
      fieldset.setAttribute('aria-labelledby', legend.id);
    }
  });
} 