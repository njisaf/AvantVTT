/**
 * @fileoverview Trait Logic Utilities
 * @version 1.0.0 - Stage 2: UI Logic
 * @description Pure function utilities for trait manipulation and filtering
 * @author Avant VTT Team
 */

import type { Trait } from '../types/domain/trait.ts';

/**
 * Result of trait operations
 */
export interface TraitOperationResult {
  /** Whether the operation was successful */
  success: boolean;

  /** Updated trait list */
  traits: string[];

  /** Error message if operation failed */
  error?: string;

  /** Whether any changes were made */
  changed: boolean;
}

/**
 * Options for trait filtering
 */
export interface TraitFilterOptions {
  /** Search query to filter by name */
  query?: string;

  /** Categories to filter by */
  categories?: string[];

  /** Tags to filter by */
  tags?: string[];

  /** Maximum number of results */
  maxResults?: number;

  /** Case-sensitive search */
  caseSensitive?: boolean;

  /** Whether to parse category prefixes from query (e.g., "weapon:fire" -> category="weapon", query="fire") */
  parseCategoryPrefixes?: boolean;
}

/**
 * Trait autocomplete suggestion
 */
export interface TraitSuggestion {
  /** Trait ID */
  id: string;

  /** Display name */
  name: string;

  /** Display color */
  color: string;

  /** Display icon */
  icon: string;

  /** Match score (0-1, higher is better) */
  score: number;

  /** Matched text for highlighting */
  matchedText?: string;
}

/**
 * Add a trait to a trait list if it's not already present.
 * 
 * This function takes a list of trait IDs and adds a new trait ID
 * if it doesn't already exist in the list.
 * 
 * @param currentTraits - Array of current trait IDs
 * @param traitIdToAdd - ID of trait to add
 * @returns Result containing updated trait list
 * 
 * @example
 * const result = addTraitToList(['fire', 'ice'], 'lightning');
 * console.log(result.traits); // ['fire', 'ice', 'lightning']
 */
export function addTraitToList(currentTraits: string[], traitIdToAdd: string): TraitOperationResult {
  try {
    // Validate inputs
    if (!Array.isArray(currentTraits)) {
      return {
        success: false,
        traits: [],
        error: 'Current traits must be an array',
        changed: false
      };
    }

    if (!traitIdToAdd || typeof traitIdToAdd !== 'string') {
      return {
        success: false,
        traits: currentTraits,
        error: 'Trait ID must be a non-empty string',
        changed: false
      };
    }

    // Check if trait is already in the list
    if (currentTraits.includes(traitIdToAdd)) {
      return {
        success: true,
        traits: currentTraits,
        error: undefined,
        changed: false
      };
    }

    // Add the trait to the end of the list
    const updatedTraits = [...currentTraits, traitIdToAdd];

    return {
      success: true,
      traits: updatedTraits,
      error: undefined,
      changed: true
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      traits: currentTraits || [],
      error: `Failed to add trait: ${errorMessage}`,
      changed: false
    };
  }
}

/**
 * Remove a trait from a trait list.
 * 
 * This function takes a list of trait IDs and removes the specified
 * trait ID if it exists in the list.
 * 
 * @param currentTraits - Array of current trait IDs
 * @param traitIdToRemove - ID of trait to remove
 * @returns Result containing updated trait list
 * 
 * @example
 * const result = removeTraitFromList(['fire', 'ice', 'lightning'], 'ice');
 * console.log(result.traits); // ['fire', 'lightning']
 */
export function removeTraitFromList(currentTraits: string[], traitIdToRemove: string): TraitOperationResult {
  try {
    // Validate inputs
    if (!Array.isArray(currentTraits)) {
      return {
        success: false,
        traits: [],
        error: 'Current traits must be an array',
        changed: false
      };
    }

    if (!traitIdToRemove || typeof traitIdToRemove !== 'string') {
      return {
        success: false,
        traits: currentTraits,
        error: 'Trait ID must be a non-empty string',
        changed: false
      };
    }

    // Check if trait exists in the list
    if (!currentTraits.includes(traitIdToRemove)) {
      return {
        success: true,
        traits: currentTraits,
        error: undefined,
        changed: false
      };
    }

    // Remove the trait from the list
    const updatedTraits = currentTraits.filter(id => id !== traitIdToRemove);

    return {
      success: true,
      traits: updatedTraits,
      error: undefined,
      changed: true
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      traits: currentTraits || [],
      error: `Failed to remove trait: ${errorMessage}`,
      changed: false
    };
  }
}

/**
 * Parse category prefixes from search query.
 * 
 * This function looks for patterns like "category:query" and extracts
 * the category filter and remaining query text.
 * 
 * @param query - Search query that may contain category prefixes
 * @returns Parsed result with separated category and query
 * 
 * @example
 * const parsed = parseCategoryPrefix("weapon:fire");
 * // Returns: { category: "weapon", query: "fire" }
 * 
 * const parsed2 = parseCategoryPrefix("elemental:ice sword");
 * // Returns: { category: "elemental", query: "ice sword" }
 */
export function parseCategoryPrefix(query: string): {
  category?: string;
  query: string;
  originalQuery: string;
} {
  try {
    if (!query || typeof query !== 'string') {
      return { query: '', originalQuery: query || '' };
    }

    const trimmed = query.trim();
    const colonIndex = trimmed.indexOf(':');

    // No colon found, return original query
    if (colonIndex === -1 || colonIndex === 0) {
      return { query: trimmed, originalQuery: query };
    }

    const potentialCategory = trimmed.substring(0, colonIndex).trim();
    const remainingQuery = trimmed.substring(colonIndex + 1).trim();

    // Validate category name (alphanumeric + some special chars)
    if (/^[a-zA-Z0-9_-]+$/.test(potentialCategory)) {
      return {
        category: potentialCategory,
        query: remainingQuery,
        originalQuery: query
      };
    }

    // Invalid category format, return original query
    return { query: trimmed, originalQuery: query };

  } catch (error) {
    console.error('Error parsing category prefix:', error);
    return { query: query || '', originalQuery: query || '' };
  }
}

/**
 * Filter traits based on search criteria.
 * 
 * This function takes an array of trait objects and filters them
 * based on the provided search options. Supports category prefix parsing.
 * 
 * @param traits - Array of trait objects to filter
 * @param options - Filter options including query, categories, tags
 * @returns Filtered array of traits
 * 
 * @example
 * // Basic name filtering
 * const filtered = filterTraits(allTraits, { query: 'fire', maxResults: 5 });
 * 
 * // Category prefix filtering
 * const filtered2 = filterTraits(allTraits, { 
 *   query: 'weapon:sharp', 
 *   parseCategoryPrefixes: true 
 * });
 * 
 * // Multiple category filtering
 * const filtered3 = filterTraits(allTraits, { 
 *   categories: ['elemental', 'damage'],
 *   query: 'ice'
 * });
 */
export function filterTraits(traits: Trait[], options: TraitFilterOptions = {}): Trait[] {
  try {
    if (!Array.isArray(traits)) {
      return [];
    }

    let filtered = [...traits];
    let searchQuery = options.query;
    let searchCategories = options.categories ? [...options.categories] : [];

    // Parse category prefixes if enabled
    if (options.parseCategoryPrefixes && searchQuery) {
      const parsed = parseCategoryPrefix(searchQuery);
      if (parsed.category) {
        searchCategories.push(parsed.category);
        searchQuery = parsed.query;
      }
    }

    // Filter by search query
    if (searchQuery && searchQuery.trim()) {
      const query = options.caseSensitive ? searchQuery.trim() : searchQuery.trim().toLowerCase();

      filtered = filtered.filter(trait => {
        const name = options.caseSensitive ? trait.name : trait.name.toLowerCase();
        const description = options.caseSensitive ?
          (trait.description || '') :
          (trait.description || '').toLowerCase();

        return name.includes(query) || description.includes(query);
      });
    }

    // Filter by categories
    if (searchCategories.length > 0) {
      filtered = filtered.filter(trait => {
        const traitCategories = trait.item.system.traitMetadata?.categories || [];
        return searchCategories.some(category => traitCategories.includes(category));
      });
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(trait => {
        const traitTags = trait.item.system.traitMetadata?.tags || [];
        return options.tags!.some(tag => traitTags.includes(tag));
      });
    }

    // Limit results
    if (options.maxResults && options.maxResults > 0) {
      filtered = filtered.slice(0, options.maxResults);
    }

    return filtered;

  } catch (error) {
    console.error('Error filtering traits:', error);
    return [];
  }
}

/**
 * Generate autocomplete suggestions for trait search.
 * @deprecated This function has been moved to deprecated/trait-input-system/
 * Use drag-and-drop from compendium instead of autocomplete input
 * @param traits - Array of available traits
 * @param query - Search query string
 * @param maxSuggestions - Maximum number of suggestions to return
 * @returns Empty array (stubbed)
 */
export function generateTraitSuggestions(
  traits: Trait[],
  query: string,
  maxSuggestions: number = 10
): TraitSuggestion[] {
  console.warn('generateTraitSuggestions is deprecated. Use drag-and-drop from compendium instead.');
  console.warn('Original implementation available in: deprecated/trait-input-system/logic/trait-utils.ts');
  return [];
}

/**
 * Validate a trait list for an item.
 * 
 * This function checks that a trait list contains valid trait IDs
 * and that the traits are appropriate for the item type.
 * 
 * @param traitIds - Array of trait IDs to validate
 * @param availableTraits - Array of available trait objects
 * @param itemType - Type of item (for applicability checking)
 * @returns Validation result with valid/invalid trait lists
 * 
 * @example
 * const validation = validateTraitList(['fire', 'invalid'], allTraits, 'weapon');
 */
export function validateTraitList(
  traitIds: string[],
  availableTraits: Trait[],
  itemType: string = 'item'
): {
  valid: string[];
  invalid: string[];
  warnings: string[];
  allValid: boolean;
} {
  try {
    if (!Array.isArray(traitIds)) {
      return { valid: [], invalid: [], warnings: ['Trait IDs must be an array'], allValid: false };
    }

    if (!Array.isArray(availableTraits)) {
      return { valid: [], invalid: traitIds, warnings: ['No available traits provided'], allValid: false };
    }

    const valid: string[] = [];
    const invalid: string[] = [];
    const warnings: string[] = [];

    // Create a map for faster lookup
    const traitMap = new Map(availableTraits.map(trait => [trait.id, trait]));

    for (const traitId of traitIds) {
      if (!traitId || typeof traitId !== 'string') {
        invalid.push(String(traitId));
        warnings.push(`Invalid trait ID: ${traitId}`);
        continue;
      }

      const trait = traitMap.get(traitId);
      if (!trait) {
        invalid.push(traitId);
        warnings.push(`Trait not found: ${traitId}`);
        continue;
      }

      // Check if trait applies to items
      if (!trait.item.system.traitMetadata?.appliesToItems) {
        invalid.push(traitId);
        warnings.push(`Trait '${trait.name}' does not apply to items`);
        continue;
      }

      valid.push(traitId);
    }

    return {
      valid,
      invalid,
      warnings,
      allValid: invalid.length === 0 && warnings.length === 0
    };

  } catch (error) {
    console.error('Error validating trait list:', error);
    return {
      valid: [],
      invalid: traitIds || [],
      warnings: [`Validation error: ${error}`],
      allValid: false
    };
  }
}

/**
 * Get trait objects from a list of trait IDs.
 * 
 * This function takes an array of trait IDs and returns the corresponding
 * trait objects from the available traits list.
 * 
 * @param traitIds - Array of trait IDs
 * @param availableTraits - Array of available trait objects
 * @returns Array of trait objects (missing traits are filtered out)
 * 
 * @example
 * const traitObjects = getTraitsFromIds(['fire', 'ice'], allTraits);
 */
export function getTraitsFromIds(traitIds: string[], availableTraits: Trait[]): Trait[] {
  try {
    if (!Array.isArray(traitIds) || !Array.isArray(availableTraits)) {
      return [];
    }

    // Create a map for efficient lookup
    const traitMap = new Map(availableTraits.map(trait => [trait.id, trait]));

    // Get trait objects, filtering out missing ones
    const traits: Trait[] = [];
    for (const traitId of traitIds) {
      const trait = traitMap.get(traitId);
      if (trait) {
        traits.push(trait);
      }
    }

    return traits;

  } catch (error) {
    console.error('Error getting traits from IDs:', error);
    return [];
  }
}

/**
 * Sort traits by a specified criteria.
 * 
 * @param traits - Array of traits to sort
 * @param sortBy - Sort criteria ('name', 'color', 'source')
 * @param ascending - Whether to sort in ascending order
 * @returns Sorted array of traits
 */
export function sortTraits(
  traits: Trait[],
  sortBy: 'name' | 'color' | 'source' = 'name',
  ascending: boolean = true
): Trait[] {
  try {
    if (!Array.isArray(traits)) {
      return [];
    }

    const sorted = [...traits].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortBy) {
        case 'color':
          aValue = a.color;
          bValue = b.color;
          break;
        case 'source':
          aValue = a.source;
          bValue = b.source;
          break;
        case 'name':
        default:
          aValue = a.name;
          bValue = b.name;
          break;
      }

      const comparison = aValue.localeCompare(bValue);
      return ascending ? comparison : -comparison;
    });

    return sorted;

  } catch (error) {
    console.error('Error sorting traits:', error);
    return [...traits]; // Return original order on error
  }
}

/**
 * Virtualize a list for performance with large datasets
 * 
 * This function implements windowing for lists with many items to improve performance
 * by only rendering visible items plus a buffer zone.
 * 
 * @param items - Array of items to virtualize
 * @param startIndex - Starting index of visible window
 * @param endIndex - Ending index of visible window  
 * @param totalHeight - Total height of container
 * @param itemHeight - Height of individual items
 * @returns Virtualized list data with visible items and positioning
 * 
 * @example
 * const virtualList = virtualizeList(traits, 10, 30, 400, 20);
 * // Renders only items 10-30 with proper spacing
 */
export function virtualizeList<T>(
  items: T[],
  startIndex: number,
  endIndex: number,
  totalHeight: number,
  itemHeight: number = 32
): VirtualListResult<T> {
  // Input validation
  if (!Array.isArray(items)) {
    return {
      visibleItems: [],
      startIndex: 0,
      endIndex: 0,
      totalHeight: 0,
      spacerTop: 0,
      spacerBottom: 0
    };
  }

  // Clamp indices to valid range
  const safeStart = Math.max(0, Math.min(startIndex, items.length - 1));
  const safeEnd = Math.max(safeStart, Math.min(endIndex, items.length));

  // Calculate virtual positioning
  const spacerTop = safeStart * itemHeight;
  const visibleHeight = (safeEnd - safeStart) * itemHeight;
  const spacerBottom = Math.max(0, (items.length - safeEnd) * itemHeight);

  return {
    visibleItems: items.slice(safeStart, safeEnd),
    startIndex: safeStart,
    endIndex: safeEnd,
    totalHeight: items.length * itemHeight,
    spacerTop,
    spacerBottom,
    visibleHeight
  };
}

/**
 * Calculate optimal dropdown position to stay within viewport
 * 
 * This function ensures dropdowns don't render off-screen by calculating
 * the best position relative to the input element and viewport boundaries.
 * 
 * @param inputRect - Bounding rectangle of input element
 * @param dropdownHeight - Height of dropdown content
 * @param dropdownWidth - Width of dropdown content
 * @param viewportWidth - Width of viewport (window.innerWidth)
 * @param viewportHeight - Height of viewport (window.innerHeight)
 * @param offset - Optional offset from input element
 * @returns Calculated position with constraints applied
 * 
 * @example
 * const inputRect = inputElement.getBoundingClientRect();
 * const position = calculateDropdownPosition(inputRect, 200, 300, window.innerWidth, window.innerHeight);
 * dropdown.style.left = position.left + 'px';
 * dropdown.style.top = position.top + 'px';
 */
export function calculateDropdownPosition(
  inputRect: DOMRect | ClientRect,
  dropdownHeight: number,
  dropdownWidth: number,
  viewportWidth: number,
  viewportHeight: number,
  offset: DropdownOffset = { x: 0, y: 4 }
): DropdownPosition {
  // Input validation
  if (!inputRect || typeof dropdownHeight !== 'number' || typeof dropdownWidth !== 'number') {
    return {
      left: 0,
      top: 0,
      placement: 'bottom-left',
      withinViewport: false
    };
  }

  // Calculate preferred position (below input, aligned left)
  let left = inputRect.left + offset.x;
  let top = inputRect.bottom + offset.y;
  let placement: DropdownPlacement = 'bottom-left';

  // Check if dropdown would overflow viewport horizontally
  if (left + dropdownWidth > viewportWidth) {
    // Try right-aligning with input
    left = inputRect.right - dropdownWidth - offset.x;
    placement = 'bottom-right';

    // If still overflowing, clamp to viewport edge
    if (left < 0) {
      left = Math.max(8, viewportWidth - dropdownWidth - 8); // 8px margin
      placement = 'bottom-center';
    }
  }

  // Check if dropdown would overflow viewport vertically
  if (top + dropdownHeight > viewportHeight) {
    // Try positioning above input
    top = inputRect.top - dropdownHeight - offset.y;
    placement = placement.replace('bottom', 'top') as DropdownPlacement;

    // If still overflowing, position within viewport
    if (top < 0) {
      top = Math.max(8, viewportHeight - dropdownHeight - 8); // 8px margin
      placement = placement.replace('top', 'middle') as DropdownPlacement;
    }
  }

  // Final clamps to ensure dropdown stays within viewport
  left = Math.max(8, Math.min(left, viewportWidth - dropdownWidth - 8));
  top = Math.max(8, Math.min(top, viewportHeight - dropdownHeight - 8));

  const withinViewport =
    left >= 0 &&
    top >= 0 &&
    left + dropdownWidth <= viewportWidth &&
    top + dropdownHeight <= viewportHeight;

  return {
    left: Math.round(left),
    top: Math.round(top),
    placement,
    withinViewport
  };
}

/**
 * Calculate which items should be visible in a virtualized list
 * 
 * Based on scroll position and container height, determines which items
 * need to be rendered for optimal performance.
 * 
 * @param scrollTop - Current scroll position
 * @param containerHeight - Height of scrollable container
 * @param itemHeight - Height of individual items
 * @param totalItems - Total number of items
 * @param bufferSize - Number of items to render outside visible area
 * @returns Start and end indices for visible items
 * 
 * @example
 * const { startIndex, endIndex } = calculateVirtualWindow(
 *   scrollContainer.scrollTop,
 *   scrollContainer.clientHeight,
 *   32,
 *   1000,
 *   5
 * );
 */
export function calculateVirtualWindow(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  bufferSize: number = 5
): VirtualWindow {
  // Input validation
  if (itemHeight <= 0 || totalItems <= 0) {
    return { startIndex: 0, endIndex: 0, visibleCount: 0 };
  }

  // Calculate visible range
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const visibleEnd = visibleStart + visibleCount;

  // Add buffer to reduce flicker during scrolling
  const startIndex = Math.max(0, visibleStart - bufferSize);
  const endIndex = Math.min(totalItems, visibleEnd + bufferSize);

  return {
    startIndex,
    endIndex,
    visibleCount
  };
}

/**
 * Debounce touch move events for better mobile performance
 * 
 * Reduces the frequency of touch move event handlers to improve
 * scrolling performance on mobile devices.
 * 
 * @param callback - Function to call after debounce delay
 * @param delay - Delay in milliseconds (default 16ms for 60fps)
 * @returns Debounced function
 * 
 * @example
 * const debouncedScroll = debounceTouchMove((event) => {
 *   updateVirtualList(event.target.scrollTop);
 * }, 16);
 * 
 * container.addEventListener('touchmove', debouncedScroll);
 */
export function debounceTouchMove<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 16
): T {
  let timeoutId: number | null = null;
  let lastCallTime = 0;

  return ((...args: Parameters<T>) => {
    const now = Date.now();

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // If enough time has passed, call immediately
    if (now - lastCallTime >= delay) {
      lastCallTime = now;
      callback(...args);
    } else {
      // Otherwise, schedule for later
      timeoutId = window.setTimeout(() => {
        lastCallTime = Date.now();
        callback(...args);
        timeoutId = null;
      }, delay - (now - lastCallTime));
    }
  }) as T;
}

/**
 * Add touch-friendly minimum tap area to elements
 * 
 * Ensures elements meet the 44px minimum tap target size
 * recommended for mobile accessibility.
 * 
 * @param element - Element to enhance for touch
 * @param minSize - Minimum tap area size (default 44px)
 * @returns Modified element with touch enhancements
 * 
 * @example
 * const traitChip = document.querySelector('.trait-chip');
 * enhanceForTouch(traitChip, 44);
 */
export function enhanceForTouch(element: HTMLElement, minSize: number = 44): HTMLElement {
  if (!element) {
    return element;
  }

  const computedStyle = window.getComputedStyle(element);
  const currentWidth = element.offsetWidth;
  const currentHeight = element.offsetHeight;

  // Add touch-friendly padding if element is too small
  if (currentWidth < minSize || currentHeight < minSize) {
    const paddingX = Math.max(0, (minSize - currentWidth) / 2);
    const paddingY = Math.max(0, (minSize - currentHeight) / 2);

    element.style.paddingLeft = `${paddingX}px`;
    element.style.paddingRight = `${paddingX}px`;
    element.style.paddingTop = `${paddingY}px`;
    element.style.paddingBottom = `${paddingY}px`;
    element.style.minWidth = `${minSize}px`;
    element.style.minHeight = `${minSize}px`;
  }

  // Add touch-friendly cursor
  element.style.cursor = 'pointer';

  // Prevent text selection on touch
  element.style.userSelect = 'none';
  (element.style as any).webkitUserSelect = 'none';
  (element.style as any).webkitTouchCallout = 'none';

  return element;
}

// Type definitions for the virtualization and positioning utilities

/**
 * Result of virtualizing a list for performance
 */
export interface VirtualListResult<T> {
  /** Items that should be rendered */
  visibleItems: T[];
  /** Starting index of visible window */
  startIndex: number;
  /** Ending index of visible window */
  endIndex: number;
  /** Total height of all items */
  totalHeight: number;
  /** Height of spacer before visible items */
  spacerTop: number;
  /** Height of spacer after visible items */
  spacerBottom: number;
  /** Height of visible items area */
  visibleHeight?: number;
}

/**
 * Calculated dropdown position with viewport constraints
 */
export interface DropdownPosition {
  /** Left position in pixels */
  left: number;
  /** Top position in pixels */
  top: number;
  /** Preferred placement relative to input */
  placement: DropdownPlacement;
  /** Whether dropdown fits within viewport */
  withinViewport: boolean;
}

/**
 * Dropdown placement options
 */
export type DropdownPlacement =
  | 'bottom-left' | 'bottom-right' | 'bottom-center'
  | 'top-left' | 'top-right' | 'top-center'
  | 'middle-left' | 'middle-right' | 'middle-center';

/**
 * Offset for dropdown positioning
 */
export interface DropdownOffset {
  /** Horizontal offset in pixels */
  x: number;
  /** Vertical offset in pixels */
  y: number;
}

/**
 * Virtual window calculation result
 */
export interface VirtualWindow {
  /** Starting index of items to render */
  startIndex: number;
  /** Ending index of items to render */
  endIndex: number;
  /** Number of visible items */
  visibleCount: number;
} 