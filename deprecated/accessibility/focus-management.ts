/**
 * @fileoverview Focus Management Accessibility Utilities
 * @description Advanced focus management including focus traps for modals and dialogs
 * 
 * This module provides utilities for:
 * - Focus traps for modal dialogs
 * - Focus restoration
 * - Focus containment
 * - Focus order management
 * 
 * All functions follow WCAG 2.1 guidelines for focus management.
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since Accessibility Module Implementation
 */

import type { FocusTrap, FocusTrapOptions } from './types/accessibility';

/**
 * Create a focus trap for modal dialogs and popups.
 * 
 * A focus trap ensures that keyboard navigation is contained within
 * a specific element, which is essential for modal dialogs to meet
 * WCAG 2.1.2 (No Keyboard Trap) requirements.
 * 
 * @param container - The container element to trap focus within
 * @param options - Configuration options for the focus trap
 * @returns Focus trap instance
 * 
 * @example
 * ```typescript
 * const trap = createFocusTrap(modalElement, {
 *   initialFocus: '#first-input',
 *   returnFocus: true,
 *   escapeDeactivates: true
 * });
 * 
 * // Activate the trap when modal opens
 * trap.activate();
 * 
 * // Deactivate when modal closes
 * trap.deactivate();
 * ```
 */
export function createFocusTrap(
  container: HTMLElement,
  options: FocusTrapOptions = {}
): FocusTrap {
  const {
    initialFocus,
    returnFocus = true,
    escapeDeactivates = true,
    clickOutsideDeactivates = false,
    onActivate,
    onDeactivate
  } = options;
  
  let active = false;
  let previouslyFocusedElement: HTMLElement | null = null;
  let sentinelStart: HTMLElement | null = null;
  let sentinelEnd: HTMLElement | null = null;
  
  /**
   * Get all focusable elements within the container
   */
  function getFocusableElements(): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    return Array.from(container.querySelectorAll<HTMLElement>(selector))
      .filter(el => {
        const style = getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               el.offsetParent !== null;
      });
  }
  
  /**
   * Handle keydown events for the focus trap
   */
  function handleKeyDown(event: KeyboardEvent): void {
    if (!active) return;
    
    if (event.key === 'Escape' && escapeDeactivates) {
      event.preventDefault();
      deactivate();
      return;
    }
    
    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements();
      
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (event.shiftKey) {
        // Shift + Tab (moving backwards)
        if (document.activeElement === firstElement || document.activeElement === sentinelStart) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab (moving forwards)
        if (document.activeElement === lastElement || document.activeElement === sentinelEnd) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }
  
  /**
   * Handle click events outside the container
   */
  function handleClickOutside(event: MouseEvent): void {
    if (!active || !clickOutsideDeactivates) return;
    
    const target = event.target as Node;
    if (!container.contains(target)) {
      deactivate();
    }
  }
  
  /**
   * Create sentinel elements for focus trapping
   */
  function createSentinels(): void {
    // Create start sentinel
    sentinelStart = document.createElement('div');
    sentinelStart.setAttribute('tabindex', '0');
    sentinelStart.setAttribute('aria-hidden', 'true');
    sentinelStart.style.position = 'fixed';
    sentinelStart.style.top = '0';
    sentinelStart.style.left = '0';
    sentinelStart.style.width = '1px';
    sentinelStart.style.height = '1px';
    sentinelStart.style.opacity = '0';
    sentinelStart.style.pointerEvents = 'none';
    
    // Create end sentinel
    sentinelEnd = document.createElement('div');
    sentinelEnd.setAttribute('tabindex', '0');
    sentinelEnd.setAttribute('aria-hidden', 'true');
    sentinelEnd.style.position = 'fixed';
    sentinelEnd.style.top = '0';
    sentinelEnd.style.left = '0';
    sentinelEnd.style.width = '1px';
    sentinelEnd.style.height = '1px';
    sentinelEnd.style.opacity = '0';
    sentinelEnd.style.pointerEvents = 'none';
    
    // Insert sentinels
    container.insertBefore(sentinelStart, container.firstChild);
    container.appendChild(sentinelEnd);
  }
  
  /**
   * Remove sentinel elements
   */
  function removeSentinels(): void {
    if (sentinelStart) {
      sentinelStart.remove();
      sentinelStart = null;
    }
    if (sentinelEnd) {
      sentinelEnd.remove();
      sentinelEnd = null;
    }
  }
  
  /**
   * Activate the focus trap
   */
  function activate(): void {
    if (active) return;
    
    // Store currently focused element
    previouslyFocusedElement = document.activeElement as HTMLElement;
    
    // Create sentinels
    createSentinels();
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    if (clickOutsideDeactivates) {
      document.addEventListener('click', handleClickOutside, true);
    }
    
    // Set initial focus
    const focusableElements = getFocusableElements();
    if (initialFocus) {
      const initialElement = typeof initialFocus === 'string' 
        ? container.querySelector<HTMLElement>(initialFocus)
        : initialFocus;
      
      if (initialElement && focusableElements.includes(initialElement)) {
        initialElement.focus();
      } else if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
    
    active = true;
    
    // Call activation callback
    if (onActivate) {
      onActivate();
    }
  }
  
  /**
   * Deactivate the focus trap
   */
  function deactivate(): void {
    if (!active) return;
    
    // Remove event listeners
    document.removeEventListener('keydown', handleKeyDown, true);
    document.removeEventListener('click', handleClickOutside, true);
    
    // Remove sentinels
    removeSentinels();
    
    // Restore focus
    if (returnFocus && previouslyFocusedElement) {
      previouslyFocusedElement.focus();
    }
    
    active = false;
    
    // Call deactivation callback
    if (onDeactivate) {
      onDeactivate();
    }
  }
  
  return {
    activate,
    deactivate,
    get active() {
      return active;
    },
    container
  };
}

/**
 * Save and restore focus for complex UI operations.
 * 
 * This utility helps maintain proper focus management when
 * performing operations that might disrupt the focus order.
 * 
 * @example
 * ```typescript
 * const focusManager = saveFocus();
 * 
 * // Perform some operation that changes the DOM
 * rebuildItemList();
 * 
 * // Restore focus to the previously focused element
 * focusManager.restore();
 * ```
 */
export function saveFocus(): {
  restore: () => boolean;
  element: HTMLElement | null;
} {
  const savedElement = document.activeElement as HTMLElement | null;
  
  return {
    element: savedElement,
    restore(): boolean {
      if (savedElement && savedElement.isConnected) {
        try {
          savedElement.focus();
          return true;
        } catch (error) {
          console.warn('Could not restore focus to saved element:', error);
          return false;
        }
      }
      return false;
    }
  };
}

/**
 * Move focus to the next logical element after DOM changes.
 * 
 * This function helps maintain logical focus flow when elements
 * are dynamically added or removed from the DOM.
 * 
 * @param removedElement - Element that was removed or will be removed
 * @param container - Container to search for next focusable element
 * @param direction - Direction to search for next element
 * @returns Whether focus was successfully moved
 * 
 * @example
 * ```typescript
 * const listItem = document.querySelector('.list-item');
 * 
 * // Move focus before removing the element
 * moveFocusAfterRemoval(listItem, listContainer, 'next');
 * 
 * // Now safe to remove the element
 * listItem.remove();
 * ```
 */
export function moveFocusAfterRemoval(
  removedElement: HTMLElement,
  container: HTMLElement,
  direction: 'next' | 'previous' | 'parent' = 'next'
): boolean {
  const focusableSelector = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');
  
  const focusableElements = Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector)
  ).filter(el => {
    const style = getComputedStyle(el);
    return el !== removedElement &&
           style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           el.offsetParent !== null;
  });
  
  if (focusableElements.length === 0) {
    // Try to focus the container itself if it's focusable
    if (container.hasAttribute('tabindex') || 
        container.matches('button, a, input, select, textarea')) {
      container.focus();
      return true;
    }
    return false;
  }
  
  // Find the index of the removed element in the original list
  const allElements = Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector)
  );
  const removedIndex = allElements.indexOf(removedElement);
  
  let targetElement: HTMLElement;
  
  switch (direction) {
    case 'next':
      // Find next focusable element after the removed one
      targetElement = focusableElements.find(el => 
        allElements.indexOf(el) > removedIndex
      ) || focusableElements[0];
      break;
      
    case 'previous':
      // Find previous focusable element before the removed one
      const prevElements = focusableElements.filter(el => 
        allElements.indexOf(el) < removedIndex
      );
      targetElement = prevElements[prevElements.length - 1] || focusableElements[0];
      break;
      
    case 'parent':
      // Focus the container or closest focusable parent
      let parent = removedElement.parentElement;
      while (parent && parent !== container) {
        if (parent.hasAttribute('tabindex') || 
            parent.matches('button, a, input, select, textarea')) {
          targetElement = parent;
          break;
        }
        parent = parent.parentElement;
      }
      targetElement = targetElement! || focusableElements[0];
      break;
      
    default:
      targetElement = focusableElements[0];
  }
  
  if (targetElement) {
    targetElement.focus();
    return true;
  }
  
  return false;
} 