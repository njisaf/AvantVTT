/**
 * @fileoverview Talent Action Point Formatting Utilities
 * @description Helper functions for formatting talent action point costs and getting action icons
 * @version 1.0.0
 * @author Avant Development Team
 */

import type { TalentAction } from '../types/domain/talent';

/**
 * Format talent action point cost for display
 * 
 * @param action - The talent action object (can be undefined for legacy items)
 * @returns Formatted string representation of the action point cost
 * 
 * @example
 * formatTalentAP({ mode: 'immediate', cost: 2, free: false }) // Returns "2 AP"
 * formatTalentAP({ mode: 'immediate', cost: 0, free: true }) // Returns "0 AP"
 * formatTalentAP({ mode: 'variable', cost: null, minCost: 1, maxCost: 3, free: false }) // Returns "AP: 1–3"
 * formatTalentAP(undefined) // Returns "AP: ?"
 */
export function formatTalentAP(action: TalentAction | undefined): string {
  // Handle undefined or null action
  if (!action) {
    return 'AP: ?';
  }
  
  // Handle free actions
  if (action.free) {
    return '0 AP';
  }
  
  // Handle variable mode
  if (action.mode === 'variable') {
    // If we have both min and max costs
    if (action.minCost !== null && action.maxCost !== null) {
      return `AP: ${action.minCost}–${action.maxCost}`;
    }
    // If we only have a minimum cost
    if (action.minCost !== null) {
      return `AP: ${action.minCost}+`;
    }
    // If we only have a maximum cost
    if (action.maxCost !== null) {
      return `AP: ?–${action.maxCost}`;
    }
    // If we have no cost information
    return 'AP: ?';
  }
  
  // Handle immediate/simultaneous modes with a specific cost
  if (action.cost !== null) {
    return `${action.cost} AP`;
  }
  
  // Fallback for unknown cases
  return 'AP: ?';
}

/**
 * Get the appropriate Font Awesome icon class for a talent action mode
 * 
 * @param action - The talent action object (can be undefined for legacy items)
 * @returns Font Awesome icon class string
 * 
 * @example
 * getActionIcon({ mode: 'immediate' }) // Returns "fa-regular fa-circle-dot"
 * getActionIcon({ mode: 'simultaneous' }) // Returns "fa-solid fa-clone"
 * getActionIcon({ mode: 'variable' }) // Returns "fa-solid fa-sliders"
 * getActionIcon(undefined) // Returns "fa-regular fa-circle-dot"
 */
export function getActionIcon(action: TalentAction | undefined): string {
  // Handle undefined or null action
  if (!action) {
    return 'fa-regular fa-circle-dot'; // Default to immediate
  }
  
  switch (action.mode) {
    case 'immediate':
      return 'fa-regular fa-circle-dot'; // ●
    case 'simultaneous':
      return 'fa-solid fa-clone'; // ⊕
    case 'variable':
      return 'fa-solid fa-sliders'; // Sliders
    default:
      return 'fa-regular fa-circle-dot'; // Default to immediate
  }
}