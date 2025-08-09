/**
 * @fileoverview Generic Action Point (AP) Display helpers for layout system
 * @description Shared formatting and tooltip helpers for displaying AP across Talents, Augments, Actions, etc.
 * @version 1.0.0
 * @author Avant
 */

export type ActionMode = 'immediate' | 'simultaneous' | 'variable';

export interface GenericActionCost {
  mode: ActionMode;
  cost: number | null;
  minCost: number | null;
  maxCost: number | null;
  free: boolean;
}

/**
 * Format an AP label suitable for display next to icons
 * Examples:
 * - "2 AP"
 * - "AP: 1–3"
 * - "0 AP" (free)
 * - "AP: ?"
 */
export function formatAPLabel(action: GenericActionCost | undefined): string {
  if (!action) return 'AP: ?';
  if (action.free) return '0 AP';

  if (action.mode === 'variable') {
    const { minCost, maxCost } = action;
    if (minCost !== null && maxCost !== null) return `AP: ${minCost}–${maxCost}`;
    if (minCost !== null) return `AP: ${minCost}+`;
    if (maxCost !== null) return `AP: ?–${maxCost}`;
    return 'AP: ?';
  }

  if (action.cost !== null) return `${action.cost} AP`;
  return 'AP: ?';
}

/**
 * Choose a Font Awesome icon class representing the action mode and free/paid state.
 * Close-enough FA substitutes for spec glyphs:
 *  - ◯ Immediate (paid)         -> far fa-circle
 *  - ⊖ Simultaneous (paid)      -> fa-solid fa-circle-minus
 *  - ⊚ Variable                 -> fa-solid fa-circle-notch
 *  - ⊘ No Action, Immediate     -> fa-solid fa-ban            (placeholder)
 *  - ⊜ No Action, Simultaneous  -> fa-solid fa-equals         (placeholder)
 *
 * Notes:
 *  - We intentionally use different icons from the AP dot row to avoid visual duplication.
 *  - The AP dot row itself represents the numeric cost; the leading icon conveys type/state.
 */
export function getAPIcon(action: GenericActionCost | undefined): string {
  if (!action) return 'fa-regular fa-circle'; // neutral fallback

  const isFree = action.free === true || action.cost === 0;

  switch (action.mode) {
    case 'immediate': {
      // Free immediate (⊘) vs paid immediate (◯)
      return isFree ? 'fa-solid fa-ban' : 'fa-regular fa-circle';
    }
    case 'simultaneous': {
      // Free simultaneous (⊜) vs paid simultaneous (⊖)
      return isFree ? 'fa-solid fa-equals' : 'fa-solid fa-circle-minus';
    }
    case 'variable': {
      // Variable (⊚)
      return 'fa-solid fa-circle-notch';
    }
    default:
      // Unknown/new modes fallback to outlined circle
      return 'fa-regular fa-circle';
  }
}

/**
 * Build a screen-reader/tooltip friendly description of the AP cost.
 * Examples:
 * - "2 Action Points (Immediate)"
 * - "1 Action Point (Simultaneous)"
 * - "1 or 2 or 3 Action Points (Variable)"
 * - "Free Action (Immediate)"
 */
export function getAPTooltip(action: GenericActionCost | undefined): string {
  if (!action) return 'Action Points: Unknown';

  const modeText = toTitleCase(action.mode);
  if (action.free) {
    // Some systems call this a "Free Action"; keep the term and clarify if mode is relevant
    return `Free Action (${modeText})`;
  }

  if (action.mode === 'variable') {
    const parts: string[] = [];
    if (action.minCost !== null && action.maxCost !== null) {
      // Build "1 or 2 or 3"
      for (let i = action.minCost; i <= action.maxCost; i++) {
        parts.push(String(i));
      }
      const joined = humanJoin(parts, 'or');
      const plural = parts.length === 1 && parts[0] === '1' ? 'Action Point' : 'Action Points';
      return `${joined} ${plural} (${modeText})`;
    }
    if (action.minCost !== null) {
      const plural = action.minCost === 1 ? 'Action Point' : 'Action Points';
      return `${action.minCost}+ ${plural} (${modeText})`;
    }
    if (action.maxCost !== null) {
      const plural = action.maxCost === 1 ? 'Action Point' : 'Action Points';
      return `Up to ${action.maxCost} ${plural} (${modeText})`;
    }
    return `Action Points: Variable (${modeText})`;
  }

  if (typeof action.cost === 'number') {
    const plural = action.cost === 1 ? 'Action Point' : 'Action Points';
    return `${action.cost} ${plural} (${modeText})`;
  }

  return `Action Points: Unknown (${modeText})`;
}

/**
 * Utility to join ["1","2","3"] => "1 or 2 or 3"
 */
function humanJoin(items: string[], conjunction = 'or'): string {
  if (items.length <= 1) return items.join('');
  return items.join(` ${conjunction} `);
}

function toTitleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}