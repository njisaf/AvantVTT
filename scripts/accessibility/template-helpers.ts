/**
 * @fileoverview Template Accessibility Helpers
 * @description Standardized helpers for creating accessible HTML templates
 * 
 * MIGRATION NOTE: This module centralizes template accessibility patterns
 * that were previously scattered across multiple template files.
 * 
 * Phase 2.2: Template Accessibility Standardization
 * - Provides consistent ARIA attributes across all templates
 * - Standardizes keyboard accessibility patterns
 * - Ensures WCAG 2.1 compliance for all generated HTML
 */

import type { Trait } from '../types/domain/trait';

/**
 * Interface for accessible icon configuration
 */
interface AccessibleIconConfig {
  /** Icon class name (e.g., 'fas fa-fire') */
  iconClass: string;
  /** Whether the icon is decorative (aria-hidden) or semantic */
  decorative?: boolean;
  /** Aria label for semantic icons */
  ariaLabel?: string;
}

/**
 * Interface for accessible button configuration
 */
interface AccessibleButtonConfig {
  /** Button label text */
  label: string;
  /** Action identifier for data attribute */
  action?: string;
  /** Additional CSS classes */
  className?: string;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Tooltip text for additional context */
  tooltip?: string;
}

/**
 * Interface for accessible input field configuration
 */
interface AccessibleInputConfig {
  /** Input name attribute */
  name: string;
  /** Input value */
  value?: string;
  /** Input type */
  type?: string;
  /** Label text */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Create accessible icon HTML with proper ARIA attributes
 * 
 * Generates icons with appropriate accessibility attributes based on
 * whether they are decorative or semantic elements.
 * 
 * @param config - Icon configuration
 * @returns HTML string for accessible icon
 * 
 * @example
 * ```typescript
 * // Decorative icon (default)
 * createAccessibleIcon({ iconClass: 'fas fa-fire' });
 * // Returns: <i class="fas fa-fire" aria-hidden="true"></i>
 * 
 * // Semantic icon with meaning
 * createAccessibleIcon({ 
 *   iconClass: 'fas fa-warning', 
 *   decorative: false,
 *   ariaLabel: 'Warning'
 * });
 * // Returns: <i class="fas fa-warning" aria-label="Warning" role="img"></i>
 * ```
 */
export function createAccessibleIcon(config: AccessibleIconConfig): string {
  const { iconClass, decorative = true, ariaLabel } = config;
  
  if (!iconClass) {
    return '';
  }
  
  if (decorative) {
    // Decorative icons are hidden from screen readers
    return `<i class="${iconClass}" aria-hidden="true"></i>`;
  } else {
    // Semantic icons need labels and roles
    const label = ariaLabel || 'Icon';
    return `<i class="${iconClass}" aria-label="${escapeHtml(label)}" role="img"></i>`;
  }
}

/**
 * Create accessible button HTML with proper ARIA attributes
 * 
 * Generates buttons with consistent accessibility attributes including
 * proper labeling, keyboard navigation, and semantic markup.
 * 
 * @param config - Button configuration
 * @returns HTML string for accessible button
 * 
 * @example
 * ```typescript
 * createAccessibleButton({
 *   label: 'Remove trait',
 *   action: 'remove-trait',
 *   className: 'trait-chip__remove'
 * });
 * // Returns: <button type="button" class="trait-chip__remove" 
 * //                  aria-label="Remove trait" data-action="remove-trait" 
 * //                  tabindex="0">×</button>
 * ```
 */
export function createAccessibleButton(config: AccessibleButtonConfig): string {
  const { 
    label, 
    action, 
    className = '', 
    type = 'button',
    tooltip 
  } = config;
  
  let attributes = `type="${type}" class="${className}" aria-label="${escapeHtml(label)}" tabindex="0"`;
  
  if (action) {
    attributes += ` data-action="${escapeHtml(action)}"`;
  }
  
  if (tooltip) {
    attributes += ` title="${escapeHtml(tooltip)}"`;
  }
  
  // Use × symbol for remove buttons, generic text for others
  const buttonText = action === 'remove-trait' ? '×' : escapeHtml(label);
  
  return `<button ${attributes}>${buttonText}</button>`;
}

/**
 * Create accessible input field HTML with proper labeling
 * 
 * Generates input fields with consistent accessibility attributes including
 * proper labeling, validation states, and keyboard navigation.
 * 
 * @param config - Input configuration
 * @returns HTML string for accessible input field
 * 
 * @example
 * ```typescript
 * createAccessibleInput({
 *   name: 'trait-search',
 *   label: 'Search traits',
 *   placeholder: 'Type to search...',
 *   className: 'trait-chip-input__input'
 * });
 * ```
 */
export function createAccessibleInput(config: AccessibleInputConfig): string {
  const { 
    name, 
    value = '', 
    type = 'text', 
    label, 
    required = false,
    placeholder,
    className = ''
  } = config;
  
  const inputId = `input-${name.replace(/[^a-zA-Z0-9]/g, '-')}`;
  let inputAttributes = `type="${type}" id="${inputId}" name="${name}" class="${className}" value="${escapeHtml(value)}"`;
  
  if (placeholder) {
    inputAttributes += ` placeholder="${escapeHtml(placeholder)}"`;
  }
  
  if (required) {
    inputAttributes += ` required aria-required="true"`;
  }
  
  let html = '';
  
  // Add label if provided
  if (label) {
    html += `<label for="${inputId}" class="visually-hidden">${escapeHtml(label)}</label>`;
  }
  
  html += `<input ${inputAttributes}>`;
  
  return html;
}

/**
 * Create accessible trait chip input field with dropdown
 * 
 * Generates the complete trait input component with accessibility features
 * including keyboard navigation, ARIA attributes, and screen reader support.
 * 
 * @param name - Input name attribute
 * @param placeholder - Placeholder text
 * @returns HTML string for accessible trait input
 */
export function createAccessibleTraitInput(name: string, placeholder: string = 'Add trait...'): string {
  const fieldId = `trait-field-${name.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const inputId = `trait-input-${name.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const dropdownId = `trait-dropdown-${name.replace(/[^a-zA-Z0-9]/g, '-')}`;
  
  return `
    <div class="trait-chip-input__field" 
         id="${fieldId}"
         tabindex="0" 
         role="combobox" 
         aria-expanded="false" 
         aria-owns="${dropdownId}"
         aria-label="Trait selection field">
      <label for="${inputId}" class="visually-hidden">Add new trait</label>
      <input type="text" 
             id="${inputId}"
             class="trait-chip-input__input" 
             placeholder="${escapeHtml(placeholder)}"
             autocomplete="off"
             aria-autocomplete="list"
             aria-describedby="${dropdownId}"
             role="textbox">
      <div class="trait-chip-input__dropdown" 
           id="${dropdownId}"
           role="listbox" 
           aria-label="Available traits"></div>
    </div>
  `;
}

/**
 * Create accessible trait chip display
 * 
 * Generates trait chips with proper accessibility attributes for display
 * in various contexts (item sheets, actor sheets, chat messages).
 * 
 * @param trait - Trait data
 * @param removable - Whether the trait can be removed
 * @returns HTML string for accessible trait chip
 */
export function createAccessibleTraitChip(trait: Trait, removable: boolean = false): string {
  if (!trait) {
    return '';
  }
  
  const traitName = escapeHtml(trait.name || 'Unknown Trait');
  const traitColor = trait.color || '#6C757D';
  const textColor = trait.textColor || '#000000';
  
  let chipHtml = `
    <span class="trait-chip" 
          data-trait-id="${escapeHtml(trait.id || '')}"
          style="--trait-color: ${traitColor}; --trait-text-color: ${textColor};"
          role="listitem"
          aria-label="Trait: ${traitName}">
  `;
  
  // Add icon if present
  if (trait.icon) {
    chipHtml += createAccessibleIcon({ 
      iconClass: trait.icon, 
      decorative: true 
    });
  }
  
  // Add trait name
  chipHtml += `<span class="trait-chip__name">${traitName}</span>`;
  
  // Add remove button if removable
  if (removable) {
    chipHtml += createAccessibleButton({
      label: `Remove ${traitName} trait`,
      action: 'remove-trait',
      className: 'trait-chip__remove',
      tooltip: `Remove the ${traitName} trait`
    });
  }
  
  chipHtml += '</span>';
  
  return chipHtml;
}

/**
 * Register Handlebars helpers for accessibility
 * 
 * Registers all template accessibility helpers as Handlebars helpers
 * for use in template files.
 * 
 * @param Handlebars - Handlebars instance
 */
export function registerAccessibilityHelpers(Handlebars: any): void {
  if (!Handlebars) {
    console.warn('Handlebars not available for accessibility helper registration');
    return;
  }
  
  // Register icon helper
  Handlebars.registerHelper('accessibleIcon', function(iconClass: string, options: any = {}) {
    const { decorative = true, label } = options.hash || {};
    return new Handlebars.SafeString(createAccessibleIcon({
      iconClass,
      decorative,
      ariaLabel: label
    }));
  });
  
  // Register button helper
  Handlebars.registerHelper('accessibleButton', function(label: string, options: any = {}) {
    const { action, className, type, tooltip } = options.hash || {};
    return new Handlebars.SafeString(createAccessibleButton({
      label,
      action,
      className,
      type,
      tooltip
    }));
  });
  
  // Register input helper
  Handlebars.registerHelper('accessibleInput', function(name: string, options: any = {}) {
    const { value, type, label, required, placeholder, className } = options.hash || {};
    return new Handlebars.SafeString(createAccessibleInput({
      name,
      value,
      type,
      label,
      required,
      placeholder,
      className
    }));
  });
  
  // Register trait input helper
  Handlebars.registerHelper('accessibleTraitInput', function(name: string, options: any = {}) {
    const { placeholder } = options.hash || {};
    return new Handlebars.SafeString(createAccessibleTraitInput(name, placeholder));
  });
  
  // Register trait chip helper
  Handlebars.registerHelper('accessibleTraitChip', function(trait: any, options: any = {}) {
    const { removable = false } = options.hash || {};
    return new Handlebars.SafeString(createAccessibleTraitChip(trait, removable));
  });
}

/**
 * Escape HTML to prevent XSS attacks
 * 
 * @param text - Text to escape
 * @returns Escaped HTML-safe text
 */
function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return String(text || '');
  }
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Add visually hidden class for screen reader only content
 * 
 * CSS class should be defined as:
 * .visually-hidden {
 *   position: absolute !important;
 *   width: 1px !important;
 *   height: 1px !important;
 *   padding: 0 !important;
 *   margin: -1px !important;
 *   overflow: hidden !important;
 *   clip: rect(0, 0, 0, 0) !important;
 *   white-space: nowrap !important;
 *   border: 0 !important;
 * }
 */ 