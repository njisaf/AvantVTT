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
 * Calculate if a color is light or dark for contrast determination.
 * 
 * This function converts a hex color to RGB and calculates the relative
 * luminance to determine if the color appears light or dark to the human eye.
 * 
 * @param hexColor - Hex color string (e.g., '#FF6B6B' or 'FF6B6B')
 * @returns True if the color is light, false if dark
 * 
 * @example
 * const isLight = isLightColor('#FF6B6B'); // false (dark-ish red)
 * const isLight2 = isLightColor('#FFEB3B'); // true (bright yellow)
 */
export function isLightColor(hexColor: string): boolean {
  try {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Validate hex color format
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      console.warn(`Invalid hex color format: ${hexColor}`);
      return false; // Default to dark
    }
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate relative luminance using WCAG formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Colors with luminance > 0.5 are considered light
    return luminance > 0.5;
    
  } catch (error) {
    console.error('Error calculating color lightness:', error);
    return false; // Default to dark on error
  }
}

/**
 * Escape HTML special characters to prevent injection.
 * 
 * @param text - Text to escape
 * @returns HTML-safe text
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
      
      // Determine if color is light for contrast
      const isLight = isLightColor(trait.color);
      
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
      
      // Build chip HTML
      const chipHtml = `<span class="${chipClasses.join(' ')}" 
        data-trait="${escapeHtml(trait.id)}" 
        data-color="${escapeHtml(trait.color)}" 
        data-light="${isLight}" 
        style="--trait-color: ${escapeHtml(trait.color)}; --trait-text-color: ${isLight ? '#000000' : '#ffffff'};" 
        title="${escapeHtml(trait.description || trait.name)}" 
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
 * 
 * This function creates smaller, simplified trait chips for display
 * in autocomplete dropdowns and suggestion lists.
 * 
 * @param trait - Trait object to render
 * @param matchedText - Text that was matched for highlighting
 * @returns HTML string for the suggestion
 * 
 * @example
 * const html = renderTraitSuggestion(fireTrait, 'fir');
 * // Returns HTML with 'fir' highlighted in the trait name
 */
export function renderTraitSuggestion(
  trait: Trait, 
  matchedText?: string
): string {
  try {
    if (!trait || !trait.id || !trait.name) {
      return '';
    }
    
    // Determine if color is light
    const isLight = isLightColor(trait.color);
    
    // Highlight matched text if provided
    let displayName = escapeHtml(trait.name);
    if (matchedText && matchedText.trim()) {
      const escapedMatch = escapeHtml(matchedText);
      const regex = new RegExp(`(${escapedMatch})`, 'gi');
      displayName = displayName.replace(regex, '<span class="trait-chip-input__suggestion-match">$1</span>');
    }
    
    // Create mini chip preview
    const iconHtml = trait.icon ? 
      `<i class="${escapeHtml(trait.icon)}" aria-hidden="true"></i>` : 
      '';
    
    return `<div class="trait-chip-input__suggestion" data-trait-id="${escapeHtml(trait.id)}" role="option">
      <span class="trait-chip trait-chip--preview trait-chip--small" 
        data-color="${escapeHtml(trait.color)}" 
        data-light="${isLight}" 
        style="--trait-color: ${escapeHtml(trait.color)}; --trait-text-color: ${isLight ? '#000000' : '#ffffff'};">
        ${iconHtml}
        <span class="trait-chip__text">${escapeHtml(trait.name)}</span>
      </span>
      <div class="trait-chip-input__suggestion-text">
        <div class="trait-chip-input__suggestion-name">${displayName}</div>
      </div>
    </div>`;
    
  } catch (error) {
    console.error('Error rendering trait suggestion:', error);
    return '';
  }
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