/**
 * @fileoverview Trait Chat Rendering Utilities
 * @version 1.0.0 - Stage 3: Chat Integration
 * @description Pure function utilities for rendering trait chips in chat messages
 * @author Avant VTT Team
 */

import type { Trait } from '../../types/domain/trait.ts';

/**
 * Options for rendering trait chips in chat
 */
export interface TraitRenderOptions {
  /** Size variant for the chips */
  size?: 'small' | 'medium' | 'large';

  /** Whether to include remove buttons */
  removable?: boolean;

  /** Whether to include icons */
  showIcons?: boolean;

  /** Maximum number of traits to display */
  maxDisplay?: number;

  /** CSS classes to add to container */
  containerClasses?: string[];

  /** CSS classes to add to individual chips */
  chipClasses?: string[];
}

/**
 * Result of trait rendering
 */
export interface TraitRenderResult {
  /** Whether rendering was successful */
  success: boolean;

  /** Rendered HTML string */
  html: string;

  /** Number of traits rendered */
  count: number;

  /** Error message if rendering failed */
  error?: string;
}

/**
 * @deprecated Use accessibility module instead: import { isLightColor } from '../accessibility'
 * 
 * MIGRATION NOTICE: This function has been moved to the centralized accessibility module 
 * for better organization and enhanced WCAG compliance. The accessibility module provides 
 * more comprehensive color analysis features including proper gamma correction and 
 * accessible text color generation.
 * 
 * @see scripts/accessibility/color-contrast.ts for the new implementation
 * @see docs/ACCESSIBILITY_MODULE_INTEGRATION_PLAN.md for migration guidance
 */
export { isLightColor } from '../../accessibility';

/**
 * Escape HTML special characters to prevent injection.
 * 
 * @param text - Text to escape
 * @returns HTML-safe text
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Strip all HTML tags from a string.
 * @param html - The string to strip
 * @returns Text with all HTML tags removed
 */
function stripHtml(html: string): string {
  if (typeof html !== 'string') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

/**
 * Render trait chips as HTML for chat messages.
 * 
 * This function takes an array of trait objects and converts them into
 * HTML chip elements suitable for display in FoundryVTT chat messages.
 * 
 * @param traits - Array of trait objects to render
 * @param options - Rendering options for customization
 * @returns Rendering result with HTML and metadata
 * 
 * @example
 * const result = renderTraitChips([fireTrait, iceTrait], { size: 'small' });
 * if (result.success) {
 *   console.log(result.html); // HTML string with trait chips
 * }
 */
export function renderTraitChips(
  traits: Trait[],
  options: TraitRenderOptions = {}
): TraitRenderResult {
  try {
    // Validate inputs
    if (!Array.isArray(traits)) {
      return {
        success: false,
        html: '',
        count: 0,
        error: 'Traits must be an array'
      };
    }

    // Handle empty trait list
    if (traits.length === 0) {
      return {
        success: true,
        html: '',
        count: 0
      };
    }

    // Default options
    const opts = {
      size: 'medium',
      removable: false,
      showIcons: true,
      maxDisplay: 10,
      containerClasses: [],
      chipClasses: [],
      ...options
    };

    // Limit traits if maxDisplay is set
    const traitsToRender = opts.maxDisplay > 0 ?
      traits.slice(0, opts.maxDisplay) :
      traits;

    // Generate chip HTML
    const chipHtmls: string[] = [];

    for (const trait of traitsToRender) {
      // Validate trait object
      if (!trait || !trait.id || !trait.name || !trait.color) {
        console.warn('Invalid trait object, skipping:', trait);
        continue;
      }

      // Use explicit text color or fallback to black (disabled auto-contrast calculation)
      const textColor = trait.textColor || '#000000';

      // ACCESSIBILITY NOTE: Automatic contrast calculation disabled per user request
      // For accessibility features, see planned accessibility module
      // const isLight = isLightColor(trait.color); // DISABLED

      // Build chip classes
      const chipClasses = [
        'trait-chip',
        opts.size !== 'medium' ? `trait-chip--${opts.size}` : '',
        ...opts.chipClasses
      ].filter(Boolean);

      // Build icon HTML if enabled
      const iconHtml = opts.showIcons && trait.icon ?
        `<i class="trait-chip__icon ${escapeHtml(trait.icon)}" aria-hidden="true"></i>` :
        '';

      // Build remove button if enabled
      const removeHtml = opts.removable ?
        '<button type="button" class="trait-chip__remove" aria-label="Remove trait" tabindex="-1">×</button>' :
        '';

      // Build chip HTML - using explicit text color instead of auto-calculated
      const chipHtml = `<span class="${chipClasses.join(' ')}" 
        data-trait="${escapeHtml(trait.id)}" 
        data-color="${escapeHtml(trait.color)}" 
        data-text-color="${escapeHtml(textColor)}" 
        style="--trait-color: ${escapeHtml(trait.color)}; --trait-text-color: ${escapeHtml(textColor)};" 
        title="${escapeHtml(stripHtml(trait.description || trait.name))}" 
        aria-label="Trait: ${escapeHtml(trait.name)}">
        ${iconHtml}
        <span class="trait-chip__text">${escapeHtml(trait.name)}</span>
        ${removeHtml}
      </span>`;

      chipHtmls.push(chipHtml);
    }

    // If no valid traits were rendered
    if (chipHtmls.length === 0) {
      return {
        success: true,
        html: '',
        count: 0
      };
    }

    // Build container HTML
    const containerClasses = [
      'trait-chips',
      ...opts.containerClasses
    ].filter(Boolean);

    const containerHtml = `<div class="${containerClasses.join(' ')}" role="list">
      ${chipHtmls.join('')}
    </div>`;

    return {
      success: true,
      html: containerHtml,
      count: chipHtmls.length
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error rendering trait chips:', error);
    return {
      success: false,
      html: '',
      count: 0,
      error: `Failed to render traits: ${errorMessage}`
    };
  }
}

/**
 * Render a single trait chip as HTML.
 * 
 * This is a convenience function for rendering individual trait chips.
 * 
 * @param trait - Trait object to render
 * @param options - Rendering options
 * @returns Rendering result with HTML
 * 
 * @example
 * const result = renderSingleTraitChip(fireTrait, { size: 'large' });
 */
export function renderSingleTraitChip(
  trait: Trait,
  options: TraitRenderOptions = {}
): TraitRenderResult {
  return renderTraitChips([trait], options);
}

/**
 * Create trait chip HTML for autocomplete dropdown suggestions.
 * @deprecated This function has been moved to deprecated/trait-input-system/
 * Use drag-and-drop from compendium instead of autocomplete input
 * @param trait - Trait object to render
 * @param matchedText - Text that was matched for highlighting
 * @returns Empty string (stubbed)
 */
export function renderTraitSuggestion(
  trait: Trait,
  matchedText?: string
): string {
  console.warn('renderTraitSuggestion is deprecated. Use drag-and-drop from compendium instead.');
  console.warn('Original implementation available in: deprecated/trait-input-system/logic/chat/trait-renderer.ts');
  return '';
}

/**
 * Extract trait data attributes from chip HTML elements.
 * 
 * This function parses trait chip elements to extract their data attributes,
 * useful for reconstructing trait information from rendered chips.
 * 
 * @param chipElement - HTML element containing trait chip
 * @returns Trait data or null if invalid
 * 
 * @example
 * const traitData = extractTraitFromChip(chipElement);
 * if (traitData) {
 *   console.log(traitData.id); // Trait ID
 * }
 */
export function extractTraitFromChip(chipElement: HTMLElement): { id: string; color: string } | null {
  try {
    if (!chipElement || !chipElement.dataset) {
      return null;
    }

    const traitId = chipElement.dataset.trait;
    const traitColor = chipElement.dataset.color;

    if (!traitId || !traitColor) {
      return null;
    }

    return {
      id: traitId,
      color: traitColor
    };

  } catch (error) {
    console.error('Error extracting trait from chip:', error);
    return null;
  }
} 