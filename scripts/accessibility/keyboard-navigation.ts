/**
 * @fileoverview Keyboard Navigation Accessibility Utilities  
 * @description Functions for enhancing keyboard accessibility and navigation
 * 
 * This module provides utilities for:
 * - Keyboard event handling and activation
 * - Tab order management
 * - Arrow key navigation
 * - Custom keyboard shortcuts
 * 
 * All functions follow WCAG 2.1 guidelines for keyboard accessibility.
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since Accessibility Module Implementation
 */

import type { KeyboardNavigationOptions } from './types/accessibility';

/**
 * Standard key codes for keyboard navigation
 */
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown'
} as const;

/**
 * Add keyboard activation (Enter/Space) to an element that only has click handlers.
 * 
 * This function ensures that interactive elements can be activated with both
 * mouse clicks and keyboard presses, meeting WCAG 2.1.1 requirements.
 * 
 * @param element - The element to enhance
 * @param callback - Function to call when activated
 * @param options - Configuration options
 * 
 * @example
 * ```typescript
 * const button = document.querySelector('.custom-button');
 * handleKeyboardActivation(button, (event) => {
 *   console.log('Button activated via keyboard or mouse');
 *   // Handle activation
 * });
 * ```
 */
export function handleKeyboardActivation(
  element: HTMLElement, 
  callback: (event: Event) => void,
  options: {
    /** Keys that trigger activation (default: Enter and Space) */
    activationKeys?: string[];
    /** Whether to prevent default behavior */
    preventDefault?: boolean;
    /** Whether to stop event propagation */
    stopPropagation?: boolean;
  } = {}
): () => void {
  const {
    activationKeys = [KEYBOARD_KEYS.ENTER, KEYBOARD_KEYS.SPACE],
    preventDefault = true,
    stopPropagation = false
  } = options;
  
  // Ensure element is focusable
  if (!element.hasAttribute('tabindex') && !element.matches('button, a, input, select, textarea')) {
    element.setAttribute('tabindex', '0');
  }
  
  // Add appropriate ARIA role if not present
  if (!element.hasAttribute('role') && !element.matches('button, a, input, select, textarea')) {
    element.setAttribute('role', 'button');
  }
  
  const keyHandler = (event: KeyboardEvent) => {
    if (activationKeys.includes(event.key)) {
      if (preventDefault) {
        event.preventDefault();
      }
      if (stopPropagation) {
        event.stopPropagation();
      }
      
      callback(event);
    }
  };
  
  element.addEventListener('keydown', keyHandler);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', keyHandler);
  };
}

/**
 * Manage focus order within a container element.
 * 
 * This function ensures logical tab order and provides utilities for
 * programmatic focus management within complex interfaces.
 * 
 * @param container - Container element to manage
 * @param selectors - CSS selectors for focusable elements in order
 * @returns Focus management utilities
 * 
 * @example
 * ```typescript
 * const manager = manageFocusOrder(sheetElement, [
 *   '.sheet-header input',
 *   '.sheet-tabs button',
 *   '.sheet-content .form-control',
 *   '.sheet-footer button'
 * ]);
 * 
 * // Focus first element
 * manager.focusFirst();
 * 
 * // Focus next element
 * manager.focusNext();
 * ```
 */
export function manageFocusOrder(
  container: HTMLElement, 
  selectors: string[] = []
): {
  focusFirst: () => boolean;
  focusLast: () => boolean;
  focusNext: () => boolean;
  focusPrevious: () => boolean;
  getFocusableElements: () => HTMLElement[];
  getCurrentIndex: () => number;
} {
  
  /**
   * Get all focusable elements in the specified order
   */
  function getFocusableElements(): HTMLElement[] {
    const elements: HTMLElement[] = [];
    
    if (selectors.length > 0) {
      // Use provided selectors in order
      for (const selector of selectors) {
        const matches = container.querySelectorAll<HTMLElement>(selector);
        elements.push(...Array.from(matches));
      }
    } else {
      // Use default focusable element query
      const defaultSelector = [
        'button:not([disabled])',
        '[href]', 
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ].join(', ');
      
      const matches = container.querySelectorAll<HTMLElement>(defaultSelector);
      elements.push(...Array.from(matches));
    }
    
    // Filter out elements that are hidden or have display: none
    return elements.filter(el => {
      const style = getComputedStyle(el);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             el.offsetParent !== null;
    });
  }
  
  /**
   * Get the index of the currently focused element
   */
  function getCurrentIndex(): number {
    const focusableElements = getFocusableElements();
    const activeElement = document.activeElement as HTMLElement;
    
    if (!activeElement || !container.contains(activeElement)) {
      return -1;
    }
    
    return focusableElements.indexOf(activeElement);
  }
  
  /**
   * Focus the first focusable element
   */
  function focusFirst(): boolean {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
      return true;
    }
    return false;
  }
  
  /**
   * Focus the last focusable element
   */
  function focusLast(): boolean {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
      return true;
    }
    return false;
  }
  
  /**
   * Focus the next focusable element
   */
  function focusNext(): boolean {
    const elements = getFocusableElements();
    const currentIndex = getCurrentIndex();
    
    if (elements.length === 0) return false;
    
    const nextIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
    elements[nextIndex].focus();
    return true;
  }
  
  /**
   * Focus the previous focusable element
   */
  function focusPrevious(): boolean {
    const elements = getFocusableElements();
    const currentIndex = getCurrentIndex();
    
    if (elements.length === 0) return false;
    
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
    elements[prevIndex].focus();
    return true;
  }
  
  return {
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    getFocusableElements,
    getCurrentIndex
  };
}

/**
 * Add arrow key navigation to a container with multiple items.
 * 
 * This function implements standard arrow key navigation patterns
 * for lists, menus, and other item collections.
 * 
 * @param container - Container element
 * @param itemSelector - CSS selector for navigable items
 * @param options - Navigation configuration
 * @returns Cleanup function to remove event listeners
 * 
 * @example
 * ```typescript
 * const cleanup = addArrowKeyNavigation(
 *   menuElement,
 *   '.menu-item',
 *   { 
 *     enableHomeEnd: true,
 *     wrapFocus: true,
 *     orientation: 'vertical'
 *   }
 * );
 * 
 * // Later, remove navigation
 * cleanup();
 * ```
 */
export function addArrowKeyNavigation(
  container: HTMLElement,
  itemSelector: string,
  options: KeyboardNavigationOptions & {
    /** Navigation orientation */
    orientation?: 'horizontal' | 'vertical' | 'both';
  } = {}
): () => void {
  const {
    enableArrowKeys = true,
    enableHomeEnd = false,
    wrapFocus = true,
    orientation = 'vertical',
    keyHandlers = {}
  } = options;
  
  function getNavigableItems(): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(itemSelector))
      .filter(item => {
        const style = getComputedStyle(item);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' &&
               !item.hasAttribute('disabled');
      });
  }
  
  function getCurrentItemIndex(): number {
    const items = getNavigableItems();
    const activeElement = document.activeElement as HTMLElement;
    return items.indexOf(activeElement);
  }
  
  function focusItem(index: number): void {
    const items = getNavigableItems();
    if (index >= 0 && index < items.length) {
      items[index].focus();
    }
  }
  
  const keyDownHandler = (event: KeyboardEvent) => {
    // Check for custom key handlers first
    if (keyHandlers[event.key]) {
      keyHandlers[event.key](event);
      return;
    }
    
    if (!enableArrowKeys) return;
    
    const items = getNavigableItems();
    if (items.length === 0) return;
    
    const currentIndex = getCurrentItemIndex();
    let newIndex = currentIndex;
    let handled = false;
    
    // Handle arrow keys based on orientation
    switch (event.key) {
      case KEYBOARD_KEYS.ARROW_DOWN:
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 
                     (wrapFocus ? 0 : currentIndex);
          handled = true;
        }
        break;
        
      case KEYBOARD_KEYS.ARROW_UP:
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = currentIndex > 0 ? currentIndex - 1 : 
                     (wrapFocus ? items.length - 1 : currentIndex);
          handled = true;
        }
        break;
        
      case KEYBOARD_KEYS.ARROW_RIGHT:
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 
                     (wrapFocus ? 0 : currentIndex);
          handled = true;
        }
        break;
        
      case KEYBOARD_KEYS.ARROW_LEFT:
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = currentIndex > 0 ? currentIndex - 1 : 
                     (wrapFocus ? items.length - 1 : currentIndex);
          handled = true;
        }
        break;
        
      case KEYBOARD_KEYS.HOME:
        if (enableHomeEnd) {
          newIndex = 0;
          handled = true;
        }
        break;
        
      case KEYBOARD_KEYS.END:
        if (enableHomeEnd) {
          newIndex = items.length - 1;
          handled = true;
        }
        break;
    }
    
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
      
      if (newIndex !== currentIndex || currentIndex === -1) {
        focusItem(newIndex !== -1 ? newIndex : 0);
      }
    }
  };
  
  container.addEventListener('keydown', keyDownHandler);
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', keyDownHandler);
  };
}

/**
 * Create keyboard shortcuts for an element or container.
 * 
 * This function allows easy registration of keyboard shortcuts
 * with proper event handling and conflict avoidance.
 * 
 * @param element - Element to attach shortcuts to
 * @param shortcuts - Keyboard shortcut definitions
 * @returns Cleanup function to remove shortcuts
 * 
 * @example
 * ```typescript
 * const cleanup = addKeyboardShortcuts(document.body, {
 *   'Ctrl+S': (event) => {
 *     event.preventDefault();
 *     saveDocument();
 *   },
 *   'Ctrl+Z': (event) => {
 *     event.preventDefault(); 
 *     undoLastAction();
 *   },
 *   'F1': (event) => {
 *     event.preventDefault();
 *     showHelp();
 *   }
 * });
 * ```
 */
export function addKeyboardShortcuts(
  element: HTMLElement,
  shortcuts: Record<string, (event: KeyboardEvent) => void>
): () => void {
  
  function parseShortcut(shortcut: string): {
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
    key: string;
  } {
    const parts = shortcut.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    
    return {
      ctrl: parts.includes('ctrl'),
      alt: parts.includes('alt'),
      shift: parts.includes('shift'),
      meta: parts.includes('meta') || parts.includes('cmd'),
      key: key
    };
  }
  
  const keyDownHandler = (event: KeyboardEvent) => {
    for (const [shortcut, handler] of Object.entries(shortcuts)) {
      const parsed = parseShortcut(shortcut);
      
      const keyMatches = event.key.toLowerCase() === parsed.key.toLowerCase();
      const ctrlMatches = event.ctrlKey === parsed.ctrl;
      const altMatches = event.altKey === parsed.alt;
      const shiftMatches = event.shiftKey === parsed.shift;
      const metaMatches = event.metaKey === parsed.meta;
      
      if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
        handler(event);
        break; // Only handle first matching shortcut
      }
    }
  };
  
  element.addEventListener('keydown', keyDownHandler);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', keyDownHandler);
  };
}

/**
 * Ensure an element is properly focusable and has appropriate ARIA attributes.
 * 
 * This function enhances elements to meet keyboard accessibility standards
 * by adding missing attributes and ensuring proper focus behavior.
 * 
 * @param element - Element to enhance
 * @param options - Enhancement options
 * 
 * @example
 * ```typescript
 * const customButton = document.querySelector('.custom-button');
 * ensureFocusable(customButton, {
 *   role: 'button',
 *   label: 'Delete Item',
 *   description: 'Permanently removes this item from the list'
 * });
 * ```
 */
export function ensureFocusable(
  element: HTMLElement,
  options: {
    /** ARIA role for the element */
    role?: string;
    /** Accessible label */
    label?: string;
    /** Accessible description */
    description?: string;
    /** Tab index (-1 for programmatic focus only, 0 for tab order) */
    tabIndex?: number;
  } = {}
): void {
  const {
    role,
    label,
    description,
    tabIndex = 0
  } = options;
  
  // Ensure element is focusable
  if (!element.hasAttribute('tabindex') && 
      !element.matches('button, a, input, select, textarea')) {
    element.setAttribute('tabindex', tabIndex.toString());
  }
  
  // Add ARIA role if specified and not present
  if (role && !element.hasAttribute('role')) {
    element.setAttribute('role', role);
  }
  
  // Add accessible label if specified
  if (label) {
    if (!element.hasAttribute('aria-label') && 
        !element.hasAttribute('aria-labelledby')) {
      element.setAttribute('aria-label', label);
    }
  }
  
  // Add accessible description if specified
  if (description) {
    if (!element.hasAttribute('aria-description') && 
        !element.hasAttribute('aria-describedby')) {
      element.setAttribute('aria-description', description);
    }
  }
  
  // Ensure interactive elements have proper cursor
  if (!element.style.cursor && 
      (role === 'button' || element.matches('button, a[href]'))) {
    element.style.cursor = 'pointer';
  }
} 