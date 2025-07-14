/**
 * @fileoverview Reduced Motion Support
 * @description Utilities for respecting user motion preferences
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since Accessibility Module Implementation
 */

import type { MotionSafeAnimation } from './types/accessibility';

/**
 * Check if user prefers reduced motion.
 * 
 * @returns True if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (window.matchMedia) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

/**
 * Create animations that respect motion preferences.
 * 
 * @param element - Element to animate
 * @param animation - Animation configuration
 */
export function createMotionSafeAnimation(
  element: HTMLElement,
  animation: MotionSafeAnimation
): void {
  if (prefersReducedMotion()) {
    // Apply reduced animation or static fallback
    const fallback = animation.reducedAnimation || animation.staticFallback;
    
    if (fallback) {
      Object.assign(element.style, fallback);
    }
  } else {
    // Apply full animation
    const { properties, duration, easing = 'ease' } = animation.fullAnimation;
    
    element.style.transition = `all ${duration}ms ${easing}`;
    Object.assign(element.style, properties);
  }
}

/**
 * Disable all animations on an element if user prefers reduced motion.
 * 
 * @param element - Element to modify
 */
export function disableAnimationsIfNeeded(element: HTMLElement): void {
  if (prefersReducedMotion()) {
    element.style.transition = 'none';
    element.style.animation = 'none';
  }
} 