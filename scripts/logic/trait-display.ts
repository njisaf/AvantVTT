/**
 * @fileoverview Trait Display Logic Module
 * @version 1.0.0
 * @description Pure functions for trait visual presentation and display data preparation
 * 
 * This module handles the visual presentation logic for traits that was previously
 * embedded in the item sheet. It provides pure functions for generating trait display
 * data, handling fallback colors and icons, and formatting trait information.
 * 
 * DESIGN PRINCIPLES:
 * - Pure functions with no side effects
 * - Consistent fallback mechanisms for missing trait data
 * - Type-safe interfaces for all display data
 * - Separation of data preparation from DOM manipulation
 * - Comprehensive color and icon fallback systems
 */

import { logger } from '../utils/logger.js';
import type { Result } from '../types/core/result.js';

/**
 * Trait Display Data
 * 
 * Complete display data for a trait including visual elements.
 */
export interface TraitDisplayData {
    /** The trait ID */
    id: string;
    /** The display name */
    name: string;
    /** The description text */
    description?: string;
    /** Background color */
    backgroundColor: string;
    /** Text color */
    textColor: string;
    /** Icon class or path */
    icon: string;
    /** Whether this is fallback data */
    isFallback: boolean;
    /** Whether the trait is active/enabled */
    isActive: boolean;
    /** Additional CSS classes */
    cssClasses: string[];
    /** Tooltip text */
    tooltip?: string;
    /** Custom data attributes */
    dataAttributes?: Record<string, string>;
}

/**
 * Trait Color Scheme
 * 
 * Color scheme for a trait including background, text, and accent colors.
 */
export interface TraitColorScheme {
    /** Background color */
    background: string;
    /** Text color */
    text: string;
    /** Border color */
    border?: string;
    /** Accent color */
    accent?: string;
    /** Hover background color */
    hoverBackground?: string;
    /** Whether this is a fallback color scheme */
    isFallback: boolean;
}

/**
 * Trait Icon Data
 * 
 * Icon information for a trait.
 */
export interface TraitIconData {
    /** Icon class (e.g., 'fas fa-fire') */
    class?: string;
    /** Icon path/URL */
    path?: string;
    /** Unicode symbol */
    symbol?: string;
    /** Whether this is a fallback icon */
    isFallback: boolean;
    /** Alt text for accessibility */
    altText?: string;
}

/**
 * Trait Fallback Configuration
 * 
 * Configuration for trait fallback behavior.
 */
export interface TraitFallbackConfig {
    /** Default color scheme to use */
    defaultColorScheme: TraitColorScheme;
    /** Default icon to use */
    defaultIcon: TraitIconData;
    /** Whether to generate color from trait ID */
    generateColorFromId: boolean;
    /** Whether to generate icon from trait name */
    generateIconFromName: boolean;
    /** Color palette for generated colors */
    colorPalette: string[];
    /** Icon palette for generated icons */
    iconPalette: string[];
}

/**
 * Default trait fallback configuration
 */
export const DEFAULT_TRAIT_FALLBACK_CONFIG: TraitFallbackConfig = {
    defaultColorScheme: {
        background: '#6c757d',
        text: '#ffffff',
        border: '#5a6268',
        accent: '#495057',
        hoverBackground: '#5a6268',
        isFallback: true
    },
    defaultIcon: {
        class: 'fas fa-tag',
        isFallback: true,
        altText: 'Trait'
    },
    generateColorFromId: true,
    generateIconFromName: true,
    colorPalette: [
        '#dc3545', '#fd7e14', '#ffc107', '#28a745',
        '#20c997', '#17a2b8', '#007bff', '#6f42c1',
        '#e83e8c', '#6c757d'
    ],
    iconPalette: [
        'fas fa-fire', 'fas fa-snowflake', 'fas fa-bolt',
        'fas fa-leaf', 'fas fa-water', 'fas fa-mountain',
        'fas fa-star', 'fas fa-shield-alt', 'fas fa-sword'
    ]
};

/**
 * Trait Display Options
 * 
 * Options for controlling trait display behavior.
 */
export interface TraitDisplayOptions {
    /** Whether to show trait descriptions */
    showDescriptions: boolean;
    /** Whether to show trait icons */
    showIcons: boolean;
    /** Whether to use fallback colors */
    useFallbackColors: boolean;
    /** Maximum length for trait names */
    maxNameLength: number;
    /** Whether to show tooltips */
    showTooltips: boolean;
    /** CSS class prefix for trait elements */
    classPrefix: string;
    /** Whether to use compact display */
    compactMode: boolean;
}

/**
 * Default trait display options
 */
export const DEFAULT_TRAIT_DISPLAY_OPTIONS: TraitDisplayOptions = {
    showDescriptions: false,
    showIcons: true,
    useFallbackColors: true,
    maxNameLength: 20,
    showTooltips: true,
    classPrefix: 'trait',
    compactMode: false
};

/**
 * Trait List Display Configuration
 * 
 * Configuration for displaying lists of traits.
 */
export interface TraitListDisplayConfig {
    /** Maximum number of traits to display */
    maxTraits: number;
    /** Whether to show overflow indicator */
    showOverflow: boolean;
    /** Text for overflow indicator */
    overflowText: string;
    /** Whether to group traits by category */
    groupByCategory: boolean;
    /** Sort order for traits */
    sortOrder: 'alphabetical' | 'category' | 'custom' | 'none';
    /** Custom sort function */
    customSort?: (a: TraitDisplayData, b: TraitDisplayData) => number;
}

/**
 * Default trait list display configuration
 */
export const DEFAULT_TRAIT_LIST_CONFIG: TraitListDisplayConfig = {
    maxTraits: 10,
    showOverflow: true,
    overflowText: '+{count} more',
    groupByCategory: false,
    sortOrder: 'alphabetical'
};

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Prepare trait display data from raw trait information
 * 
 * Converts raw trait data into complete display data with colors, icons,
 * and all necessary visual information.
 * 
 * @param traitData - Raw trait data from provider
 * @param options - Display options
 * @param fallbackConfig - Fallback configuration
 * @returns Complete trait display data
 */
export function prepareTraitDisplayData(
    traitData: any,
    options: TraitDisplayOptions = DEFAULT_TRAIT_DISPLAY_OPTIONS,
    fallbackConfig: TraitFallbackConfig = DEFAULT_TRAIT_FALLBACK_CONFIG
): TraitDisplayData {
    try {
        // Extract basic trait information
        const traitId = traitData.id || traitData.traitId || traitData.name;
        let traitName = traitData.name || generateFallbackDisplayName(traitId);
        
        // Truncate name if needed
        if (traitName.length > options.maxNameLength) {
            traitName = traitName.substring(0, options.maxNameLength) + '...';
        }
        
        // Determine color scheme
        let colorScheme: TraitColorScheme;
        let isFallback = false;
        
        if (traitData.color && options.useFallbackColors === false) {
            // Use provided color
            colorScheme = {
                background: traitData.color,
                text: calculateContrastColor(traitData.color),
                border: adjustColorBrightness(traitData.color, -20),
                accent: adjustColorBrightness(traitData.color, 10),
                hoverBackground: adjustColorBrightness(traitData.color, -10),
                isFallback: false
            };
        } else {
            // Generate fallback color scheme
            colorScheme = generateFallbackColorScheme(traitId, traitName, fallbackConfig);
            isFallback = true;
        }
        
        // Determine icon
        let icon = traitData.icon || fallbackConfig.defaultIcon.class || 'fas fa-tag';
        
        // Generate CSS classes
        const cssClasses = generateTraitCssClasses(traitData, options);
        
        // Generate tooltip
        const tooltip = options.showTooltips ? generateTraitTooltip(traitData, options) : undefined;
        
        // Generate data attributes
        const dataAttributes = generateTraitDataAttributes(traitData);
        
        const displayData: TraitDisplayData = {
            id: traitId,
            name: traitName,
            description: traitData.description,
            backgroundColor: colorScheme.background,
            textColor: colorScheme.text,
            icon,
            isFallback,
            isActive: traitData.isActive !== false, // Default to true
            cssClasses,
            tooltip,
            dataAttributes
        };
        
        return displayData;
        
    } catch (error) {
        logger.error('TraitDisplay | Error preparing trait display data:', error);
        
        // Return minimal fallback data
        return {
            id: traitData?.id || 'unknown',
            name: traitData?.name || 'Unknown Trait',
            backgroundColor: '#6c757d',
            textColor: '#ffffff',
            icon: 'fas fa-tag',
            isFallback: true,
            isActive: true,
            cssClasses: ['trait', 'fallback']
        };
    }
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Generate fallback color scheme for a trait
 * 
 * Generates a color scheme for a trait when no explicit colors are provided.
 * Uses trait ID or name to generate consistent colors.
 * 
 * @param traitId - The trait ID
 * @param traitName - The trait name
 * @param config - Fallback configuration
 * @returns Generated color scheme
 */
export function generateFallbackColorScheme(
    traitId: string,
    traitName: string,
    config: TraitFallbackConfig = DEFAULT_TRAIT_FALLBACK_CONFIG
): TraitColorScheme {
    // Generate consistent color from trait ID
    const backgroundColor = hashStringToColor(traitId, config.colorPalette);
    const textColor = calculateContrastColor(backgroundColor);
    
    // Generate accent colors
    const borderColor = adjustColorBrightness(backgroundColor, -20);
    const accentColor = adjustColorBrightness(backgroundColor, 10);
    const hoverColor = adjustColorBrightness(backgroundColor, -10);
    
    return {
        background: backgroundColor,
        text: textColor,
        border: borderColor,
        accent: accentColor,
        hoverBackground: hoverColor,
        isFallback: true
    };
}

// Helper function to adjust color brightness
function adjustColorBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Generate fallback icon for a trait
 * 
 * Generates an icon for a trait when no explicit icon is provided.
 * Uses trait name or category to select appropriate icon.
 * 
 * @param traitName - The trait name
 * @param traitCategory - The trait category
 * @param config - Fallback configuration
 * @returns Generated icon data
 */
export function generateFallbackIcon(
    traitName: string,
    traitCategory?: string,
    config: TraitFallbackConfig = DEFAULT_TRAIT_FALLBACK_CONFIG
): TraitIconData {
    // STUB - Phase 2 Implementation
    throw new Error('Phase 1 stub - implement in Phase 2');
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Generate fallback display name for a trait
 * 
 * Generates a human-readable display name from a trait ID when no
 * explicit name is provided.
 * 
 * @param traitId - The trait ID
 * @returns Generated display name
 */
export function generateFallbackDisplayName(traitId: string): string {
    if (!traitId) return 'Unknown Trait';
    
    // Handle different naming conventions
    let displayName = traitId;
    
    // Convert camelCase to Title Case
    displayName = displayName.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    // Convert kebab-case to Title Case
    displayName = displayName.replace(/-/g, ' ');
    
    // Convert snake_case to Title Case
    displayName = displayName.replace(/_/g, ' ');
    
    // Capitalize first letter of each word
    displayName = displayName.replace(/\b\w/g, l => l.toUpperCase());
    
    return displayName;
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Prepare trait list display data
 * 
 * Prepares display data for a list of traits, handling sorting, grouping,
 * and overflow according to the configuration.
 * 
 * @param traits - Array of trait data
 * @param config - List display configuration
 * @param options - Display options
 * @param fallbackConfig - Fallback configuration
 * @returns Prepared trait display data array
 */
export function prepareTraitListDisplayData(
    traits: any[],
    config: TraitListDisplayConfig = DEFAULT_TRAIT_LIST_CONFIG,
    options: TraitDisplayOptions = DEFAULT_TRAIT_DISPLAY_OPTIONS,
    fallbackConfig: TraitFallbackConfig = DEFAULT_TRAIT_FALLBACK_CONFIG
): Result<TraitDisplayData[], string> {
    // STUB - Phase 2 Implementation
    throw new Error('Phase 1 stub - implement in Phase 2');
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Sort traits according to configuration
 * 
 * Sorts an array of trait display data according to the specified sort order.
 * 
 * @param traits - Array of trait display data
 * @param sortOrder - Sort order to apply
 * @param customSort - Custom sort function if using custom sort
 * @returns Sorted trait array
 */
export function sortTraits(
    traits: TraitDisplayData[],
    sortOrder: TraitListDisplayConfig['sortOrder'],
    customSort?: (a: TraitDisplayData, b: TraitDisplayData) => number
): TraitDisplayData[] {
    // STUB - Phase 2 Implementation
    throw new Error('Phase 1 stub - implement in Phase 2');
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Group traits by category
 * 
 * Groups traits by their category for organized display.
 * 
 * @param traits - Array of trait display data
 * @returns Grouped traits by category
 */
export function groupTraitsByCategory(
    traits: TraitDisplayData[]
): Record<string, TraitDisplayData[]> {
    // STUB - Phase 2 Implementation
    throw new Error('Phase 1 stub - implement in Phase 2');
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Validate trait display data
 * 
 * Validates that trait display data has all required fields and valid values.
 * 
 * @param displayData - Trait display data to validate
 * @returns Validation result
 */
export function validateTraitDisplayData(
    displayData: TraitDisplayData
): Result<boolean, string> {
    // STUB - Phase 2 Implementation
    throw new Error('Phase 1 stub - implement in Phase 2');
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Generate CSS variables for trait colors
 * 
 * Generates CSS custom properties for trait colors that can be used in stylesheets.
 * 
 * @param colorScheme - The color scheme to generate variables for
 * @param prefix - CSS variable prefix
 * @returns CSS variables as object
 */
export function generateTraitCssVariables(
    colorScheme: TraitColorScheme,
    prefix: string = '--trait'
): Record<string, string> {
    // STUB - Phase 2 Implementation
    throw new Error('Phase 1 stub - implement in Phase 2');
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Generate tooltip text for a trait
 * 
 * Generates appropriate tooltip text for a trait based on its data.
 * 
 * @param traitData - The trait data
 * @param options - Display options
 * @returns Tooltip text
 */
export function generateTraitTooltip(
    traitData: any,
    options: TraitDisplayOptions = DEFAULT_TRAIT_DISPLAY_OPTIONS
): string {
    const parts: string[] = [];
    
    // Add trait name
    if (traitData.name) {
        parts.push(`<strong>${traitData.name}</strong>`);
    }
    
    // Add description if available and enabled
    if (traitData.description && options.showDescriptions) {
        parts.push(traitData.description);
    }
    
    // Add category if available
    if (traitData.category) {
        parts.push(`<em>Category: ${traitData.category}</em>`);
    }
    
    return parts.join('<br>');
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Generate data attributes for trait elements
 * 
 * Generates HTML data attributes for trait elements for interaction and styling.
 * 
 * @param traitData - The trait data
 * @param prefix - Attribute prefix
 * @returns Data attributes as object
 */
export function generateTraitDataAttributes(
    traitData: any,
    prefix: string = 'data-trait'
): Record<string, string> {
    const attributes: Record<string, string> = {};
    
    // Add trait ID
    if (traitData.id || traitData.traitId) {
        attributes[`${prefix}-id`] = traitData.id || traitData.traitId;
    }
    
    // Add trait name
    if (traitData.name) {
        attributes[`${prefix}-name`] = traitData.name;
    }
    
    // Add category
    if (traitData.category) {
        attributes[`${prefix}-category`] = traitData.category;
    }
    
    // Add type
    if (traitData.type) {
        attributes[`${prefix}-type`] = traitData.type;
    }
    
    return attributes;
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Generate CSS classes for trait elements
 * 
 * Generates appropriate CSS classes for trait elements based on their state and data.
 * 
 * @param traitData - The trait data
 * @param options - Display options
 * @returns Array of CSS classes
 */
export function generateTraitCssClasses(
    traitData: any,
    options: TraitDisplayOptions = DEFAULT_TRAIT_DISPLAY_OPTIONS
): string[] {
    const classes: string[] = [];
    
    // Base class
    classes.push(options.classPrefix);
    
    // State classes
    if (traitData.isActive !== false) {
        classes.push(`${options.classPrefix}-active`);
    }
    
    // Category class
    if (traitData.category) {
        classes.push(`${options.classPrefix}-${traitData.category}`);
    }
    
    // Compact mode
    if (options.compactMode) {
        classes.push(`${options.classPrefix}-compact`);
    }
    
    // Fallback class
    if (traitData.isFallback) {
        classes.push(`${options.classPrefix}-fallback`);
    }
    
    return classes;
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Hash string to color
 * 
 * Generates a consistent color from a string by hashing it.
 * 
 * @param str - The string to hash
 * @param palette - Color palette to choose from
 * @returns Hex color code
 */
export function hashStringToColor(str: string, palette: string[]): string {
    if (!palette || palette.length === 0) {
        return '#6c757d'; // Default gray
    }
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Get color from palette
    const index = Math.abs(hash) % palette.length;
    return palette[index];
}

/**
 * PHASE 1 INTERFACE STUB
 * 
 * Calculate contrast color
 * 
 * Calculates an appropriate contrast color (white or black) for a given background color.
 * 
 * @param backgroundColor - The background color
 * @returns Contrast color (white or black)
 */
export function calculateContrastColor(backgroundColor: string): string {
    try {
        // Remove # if present
        const hex = backgroundColor.replace('#', '');
        
        // Parse RGB values
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate relative luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return black or white based on luminance
        return luminance > 0.5 ? '#000000' : '#ffffff';
    } catch (error) {
        logger.error('TraitDisplay | Error calculating contrast color:', error);
        return '#ffffff'; // Default to white on error
    }
}

// Export type-only interfaces for external use
// Note: These are already exported above as part of the interface definitions