/**
 * @fileoverview Trait Input System Renderer - Extracted from trait-renderer.ts
 * @deprecated This file contains rendering functions for the legacy trait input system
 * that has been deprecated in favor of drag-and-drop functionality.
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since 2025-01-17
 * 
 * DEPRECATION NOTICE:
 * These trait input rendering functions have been deprecated in favor of native FoundryVTT drag-and-drop.
 * The code is preserved here for potential restoration but should not be used in new development.
 * 
 * RESTORATION INSTRUCTIONS:
 * 1. Copy renderTraitSuggestion function back to trait-renderer.ts
 * 2. Update imports in files that use this function
 * 3. Remove stub function from trait-renderer.ts
 * 4. Update test files to reference original locations
 * 
 * ORIGINAL LOCATION: avantVtt/scripts/logic/chat/trait-renderer.ts (lines 249-307)
 */

import type { Trait } from '../../../../scripts/types/domain/trait.ts';

/**
 * Escape HTML special characters to prevent injection.
 * @deprecated Part of legacy trait input system
 */
export function escapeHtml(text: string): string {
    console.warn('escapeHtml is deprecated. Use drag-and-drop instead.');

    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Create trait chip HTML for autocomplete dropdown suggestions.
 * @deprecated Part of legacy trait input system - use drag-and-drop instead
 */
export function renderTraitSuggestion(
    trait: Trait,
    matchedText?: string
): string {
    console.warn('renderTraitSuggestion is deprecated. Use drag-and-drop instead.');

    try {
        if (!trait || !trait.id || !trait.name) {
            return '';
        }

        // Use explicit text color or fallback to black (disabled auto-contrast calculation)
        const textColor = trait.textColor || '#000000';

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
        data-text-color="${escapeHtml(textColor)}" 
        style="--trait-color: ${escapeHtml(trait.color)}; --trait-text-color: ${escapeHtml(textColor)};">
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

export default {
    renderTraitSuggestion,
    escapeHtml
}; 