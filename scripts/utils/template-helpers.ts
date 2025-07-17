/**
 * Template helpers for the Avant Native system
 * Provides utility functions for Handlebars templates
 */

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a color is light (for determining text contrast)
 * @param color - Hex color string (e.g., '#FF0000' or '#f00')
 * @returns true if the color is light, false if dark
 */
function isLightColor(color: string): boolean {
    if (!color) return false;

    // Remove # if present
    const hex = color.replace('#', '');

    // Handle 3-digit hex colors
    let r, g, b;
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else {
        return false; // Invalid hex color
    }

    // Calculate luminance using standard formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return true if luminance is greater than 0.5 (light color)
    return luminance > 0.5;
}

/**
 * Initialize template helpers for the Avant Native system
 */
export function initializeTemplateHelpers(): void {
    // This function is now empty as all helper registration is handled by registerAvantHandlebarsHelpers
    // and called from initializeHandlebarsHelpers.
    // Keeping it here for now, but it will be removed once all helper registration is centralized.
}

/**
 * Register all custom Handlebars helpers for the Avant system
 * 
 * This function registers all custom helpers needed by Avant templates,
 * including utility helpers, accessibility helpers, and trait-specific helpers.
 * 
 * STAGE 4 ADDITIONS:
 * - Added mathematical helpers (add, range, or) for AP selector functionality
 * - Enhanced error handling and validation for all helper parameters
 * - Documented all helper usage patterns for future maintenance
 * 
 * @param Handlebars - The Handlebars instance to register helpers on
 */
export async function registerAvantHandlebarsHelpers(Handlebars: any): Promise<void> {
    if (!Handlebars) {
        console.warn('Handlebars not available for helper registration');
        return;
    }

    // =============================================================================
    // UTILITY HELPERS
    // =============================================================================

    // JSON serialization helper
    if (!Handlebars.helpers.json) {
        Handlebars.registerHelper('json', function (context: any) {
            return JSON.stringify(context);
        });
    }

    // Times iterator helper for repeating elements (AP icons, etc.)
    if (!Handlebars.helpers.times) {
        Handlebars.registerHelper('times', function (n: number, options: any) {
            let result = '';
            for (let i = 0; i < n; i++) {
                result += options.fn(i);
            }
            return result;
        });
    }

    // Math operations helper for template calculations
    if (!Handlebars.helpers.math) {
        Handlebars.registerHelper('math', function (a: any, operator: string, b: any) {
            const numA = parseFloat(a) || 0;
            const numB = parseFloat(b) || 0;

            switch (operator) {
                case '+': return numA + numB;
                case '-': return numA - numB;
                case '*': return numA * numB;
                case '/': return numB !== 0 ? numA / numB : 0;
                case '%': return numB !== 0 ? numA % numB : 0;
                default: return 0;
            }
        });
    }

    // =============================================================================
    // STAGE 4 CRITICAL ADDITIONS: Mathematical & Logical Helpers
    // These helpers were MISSING and caused complete template rendering failure
    // =============================================================================

    // Add helper for simple addition (CRITICAL for AP selector)
    // Usage: {{add 1 3}} returns 4
    // Used in: templates/shared/partials/ap-selector.hbs
    if (!Handlebars.helpers.add) {
        Handlebars.registerHelper('add', function (a: any, b: any) {
            const numA = parseFloat(a) || 0;
            const numB = parseFloat(b) || 0;
            return numA + numB;
        });
    }

    // Range helper for iterating over numeric ranges (CRITICAL for AP selector)
    // Usage: {{#each (range 1 5)}} iterates from 1 to 4
    // Used in: templates/shared/partials/ap-selector.hbs for AP cost selection
    if (!Handlebars.helpers.range) {
        Handlebars.registerHelper('range', function (start: any, end: any) {
            const startNum = parseInt(start) || 0;
            const endNum = parseInt(end) || 0;
            const result = [];

            // Generate array of numbers from start to end-1 (exclusive end)
            for (let i = startNum; i < endNum; i++) {
                result.push(i);
            }

            return result;
        });
    }

    // =============================================================================
    // CRITICAL DISCOVERY: FoundryVTT Helper Conflicts (January 2025)
    // =============================================================================
    // 
    // ISSUE DISCOVERED: FoundryVTT v13 has built-in helpers that conflict with custom helpers.
    // The built-in 'or' helper performs boolean evaluation instead of value selection.
    // 
    // MANIFESTATION:
    // - {{or max 3}} returned 'true' instead of the numeric value '3'
    // - This caused {{range 1 1}} to generate empty arrays []
    // - Result: AP selector buttons failed to render completely
    // 
    // SOLUTION: Force-override conflicting helpers + provide fallback with unique names
    // LESSON: Always test helper behavior in actual FoundryVTT environment, not just build tools
    // 
    // =============================================================================

    // Or helper for logical OR operations (CRITICAL for AP selector)
    // Usage: {{or value1 value2}} returns first truthy value or value2
    // Used in: templates/shared/partials/ap-selector.hbs for default values
    // 
    // IMPORTANT: Force override any existing 'or' helper that might conflict
    // FoundryVTT's built-in 'or' helper returns boolean values, not actual values
    Handlebars.registerHelper('or', function (a: any, b: any) {
        return a || b;
    });

    // Alternative helper name to avoid future conflicts
    // Usage: {{avantOr value1 value2}} - guaranteed conflict-free
    // This is the primary helper used in templates for reliability
    Handlebars.registerHelper('avantOr', function (a: any, b: any) {
        return a || b;
    });

    // =============================================================================
    // HEADER LAYOUT HELPERS - Item Sheet Refactor
    // These helpers support the new consistent header layout system
    // =============================================================================

    // Chunk helper for splitting arrays into smaller groups
    // Usage: {{#each (chunk metaFields 2)}} creates rows of max 2 fields
    // Used in: item sheet headers for row-based layout
    if (!Handlebars.helpers.chunk) {
        Handlebars.registerHelper('chunk', function (array: any[], size: number) {
            if (!Array.isArray(array) || size <= 0) {
                return [];
            }

            const chunks = [];
            for (let i = 0; i < array.length; i += size) {
                chunks.push(array.slice(i, i + size));
            }

            return chunks;
        });
    }

    // Concat helper for joining strings
    // Usage: {{concat "Enter " (titleCase item.type) " name..."}}
    // Used in: dynamic placeholder text generation
    if (!Handlebars.helpers.concat) {
        Handlebars.registerHelper('concat', function (...args: any[]) {
            // Remove the last argument which is the Handlebars options object
            return args.slice(0, -1).join('');
        });
    }

    // Title case helper for capitalizing strings
    // Usage: {{titleCase item.type}} converts "weapon" to "Weapon"
    // Used in: dynamic text generation
    if (!Handlebars.helpers.titleCase) {
        Handlebars.registerHelper('titleCase', function (str: string) {
            if (!str || typeof str !== 'string') {
                return '';
            }
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        });
    }

    // =============================================================================
    // PHASE 5 ADDITIONS: Array and Object Helpers
    // These helpers create arrays and objects for use in templates with select-field
    // =============================================================================

    // Array helper for creating arrays in templates
    // Usage: {{array (object value="test" label="Test") (object value="demo" label="Demo")}}
    // Used in: select-field partials for options arrays
    if (!Handlebars.helpers.array) {
        Handlebars.registerHelper('array', function (...args: any[]) {
            // Remove the last argument which is the Handlebars options object
            return args.slice(0, -1);
        });
    }

    // Object helper for creating objects in templates
    // Usage: {{object value="test" label="Test"}}
    // Used in: select-field partials for option objects
    if (!Handlebars.helpers.object) {
        Handlebars.registerHelper('object', function (options: any) {
            return options.hash || {};
        });
    }

    // And helper for logical AND operations
    // Usage: {{and value1 value2}} returns true if both are truthy
    // Used in: conditional rendering of elements
    if (!Handlebars.helpers.and) {
        Handlebars.registerHelper('and', function (a: any, b: any) {
            return a && b;
        });
    }

    // Filter array helper for filtering arrays by property values
    // Usage: {{filterArray array 'property' value}} returns filtered array
    // Used in: item-body.hbs to separate full-width from regular fields
    if (!Handlebars.helpers.filterArray) {
        Handlebars.registerHelper('filterArray', function (array: any[], property: string, value: any) {
            if (!Array.isArray(array)) {
                return [];
            }

            return array.filter((item: any) => {
                if (value === false) {
                    // Filter for items where property is falsy or doesn't exist
                    return !item[property];
                } else if (value === true) {
                    // Filter for items where property is truthy
                    return !!item[property];
                } else {
                    // Filter for items where property equals value
                    return item[property] === value;
                }
            });
        });
    }

    // =============================================================================
    // TRAIT DISPLAY HELPERS - RICH TRAIT OBJECT PROCESSING
    // =============================================================================

    // Helper to get trait styling from rich trait object (used in displayTraits branch)
    if (!Handlebars.helpers.traitChipStyle) {
        Handlebars.registerHelper('traitChipStyle', function (trait: any) {
            if (!trait) return '--trait-color: #6C757D; --trait-text-color: #000000;';

            if (trait.color) {
                const textColor = isLightColor(trait.color) ? '#000000' : '#FFFFFF';
                const result = `--trait-color: ${trait.color}; --trait-text-color: ${textColor};`;
                return result;
            }

            // Fallback styling
            return '--trait-color: #6C757D; --trait-text-color: #000000;';
        });
    }

    // Helper to get trait data attributes from rich trait object
    if (!Handlebars.helpers.traitChipData) {
        Handlebars.registerHelper('traitChipData', function (trait: any) {
            if (!trait) return 'data-trait-type="unknown" data-trait-source="fallback"';

            const traitType = trait.type || trait.category || 'custom';
            const traitSource = trait.source || (trait.id?.startsWith('system_trait_') ? 'system' : 'custom');

            // Build base attributes
            let result = `data-trait-id="${trait.id}" data-trait-type="${traitType}" data-trait-source="${traitSource}"`;

            // Only add data-color and data-text-color if trait has a color (for CSS selector matching)
            if (trait.color) {
                const textColor = isLightColor(trait.color) ? '#000000' : '#FFFFFF';
                result += ` data-color="${trait.color}" data-text-color="${textColor}"`;
            }

            return result;
        });
    }

    // =============================================================================
    // TRAIT DISPLAY HELPERS - ID TO DISPLAY DATA CONVERSION (FALLBACK)
    // =============================================================================

    // Helper to get trait styling from ID
    if (!Handlebars.helpers.traitChipStyleFromId) {
        Handlebars.registerHelper('traitChipStyleFromId', function (traitId: string) {
            if (!traitId) return '--trait-color: #6C757D; --trait-text-color: #000000;';

            try {
                const initManager = (game as any)?.avant?.initializationManager;
                if (initManager) {
                    // Use synchronous getService for template helpers since we can't await in handlebars
                    const traitProvider = initManager.getService('traitProvider');
                    if (traitProvider && typeof traitProvider.getTraitById === 'function') {
                        const trait = traitProvider.getTraitById(traitId);
                        if (trait?.color) {
                            const textColor = isLightColor(trait.color) ? '#000000' : '#FFFFFF';
                            return `--trait-color: ${trait.color}; --trait-text-color: ${textColor};`;
                        }
                    }
                }
            } catch (error) {
                console.warn('Failed to get trait style for ID:', traitId, error);
            }

            // Fallback styling
            return '--trait-color: #6C757D; --trait-text-color: #000000;';
        });
    }

    // Helper to get trait name from ID
    if (!Handlebars.helpers.traitNameFromId) {
        Handlebars.registerHelper('traitNameFromId', function (traitId: string) {
            if (!traitId) return traitId;

            try {
                const traitProvider = (game as any)?.avant?.initializationManager?.getService('traitProvider');
                if (traitProvider && typeof traitProvider.getTraitById === 'function') {
                    const trait = traitProvider.getTraitById(traitId);
                    if (trait?.name) {
                        return trait.name;
                    }
                }
            } catch (error) {
                console.warn('Failed to get trait name for ID:', traitId, error);
            }

            // Fallback: return the ID itself
            return traitId;
        });
    }

    // Helper to get trait data from ID
    if (!Handlebars.helpers.traitDataFromId) {
        Handlebars.registerHelper('traitDataFromId', function (traitId: string) {
            if (!traitId) return { id: traitId, name: traitId, color: '#6C757D', icon: '' };

            try {
                const traitProvider = (game as any)?.avant?.initializationManager?.getService('traitProvider');
                if (traitProvider && typeof traitProvider.getTraitById === 'function') {
                    const trait = traitProvider.getTraitById(traitId);
                    if (trait) {
                        return {
                            id: trait.id,
                            name: trait.name || traitId,
                            color: trait.color || '#6C757D',
                            icon: trait.icon || ''
                        };
                    }
                }
            } catch (error) {
                console.warn('Failed to get trait data for ID:', traitId, error);
            }

            // Fallback data
            return { id: traitId, name: traitId, color: '#6C757D', icon: '' };
        });
    }

    // Helper to get trait icon from ID
    if (!Handlebars.helpers.traitIconFromId) {
        Handlebars.registerHelper('traitIconFromId', function (traitId: string) {
            if (!traitId) return '';

            try {
                const traitProvider = (game as any)?.avant?.initializationManager?.getService('traitProvider');
                if (traitProvider && typeof traitProvider.getTraitById === 'function') {
                    const trait = traitProvider.getTraitById(traitId);
                    if (trait?.icon) {
                        return trait.icon;
                    }
                }
            } catch (error) {
                console.warn('Failed to get trait icon for ID:', traitId, error);
            }

            // Fallback: no icon
            return '';
        });
    }

    // =============================================================================
    // DEBUG HELPERS FOR TRAIT TEMPLATE INVESTIGATION
    // =============================================================================

    // DEBUG: Remove these debug helpers as they're causing template rendering issues
    // These were added during debugging but are now interfering with production rendering

    /*
    // Debug helper to track template data flow
    if (!Handlebars.helpers.debugLog) {
        Handlebars.registerHelper('debugLog', function (this: any, message: string, data: any) {
            console.log(`🔧 TEMPLATE DEBUG | ${message}:`, data);
            console.log(`🔧 TEMPLATE DEBUG | Full context at debugLog:`, this);
            console.log(`🔧 TEMPLATE DEBUG | Context keys at debugLog:`, Object.keys(this || {}));
            return '';
        });
    }

    // Debug helper to check array length
    if (!Handlebars.helpers.debugArrayLength) {
        Handlebars.registerHelper('debugArrayLength', function (array: any[], label: string) {
            const length = Array.isArray(array) ? array.length : 0;
            console.log(`🔧 TEMPLATE DEBUG | Array length for ${label}: ${length}`);
            return '';
        });
    }

    // Debug helper to check if we're about to start an each loop
    if (!Handlebars.helpers.debugEachStart) {
        Handlebars.registerHelper('debugEachStart', function (array: any[], label: string) {
            console.log(`🔧 TEMPLATE DEBUG | About to start each loop: ${label}`, array);
            return '';
        });
    }

    // Debug helper to check if we've finished an each loop
    if (!Handlebars.helpers.debugEachEnd) {
        Handlebars.registerHelper('debugEachEnd', function (array: any[], label: string) {
            console.log(`🔧 TEMPLATE DEBUG | Finished each loop: ${label}`, array);
            return '';
        });
    }
    */

    // =============================================================================
    // UTILITY HELPERS
    // =============================================================================

    // Helper to check if a color is light (for text contrast)
    if (!Handlebars.helpers.isLightColor) {
        Handlebars.registerHelper('isLightColor', function (color: string) {
            return isLightColor(color);
        });
    }

    // Helper to join array elements
    if (!Handlebars.helpers.join) {
        Handlebars.registerHelper('join', function (array: any[], separator: string = ', ') {
            if (!Array.isArray(array)) return '';
            return array.join(separator);
        });
    }

    // =============================================================================
    // TRAIT ACCESSIBILITY HELPERS - REMOVED DUPLICATE REGISTRATIONS
    // =============================================================================
    //
    // CRITICAL FIX: The trait helpers were being registered twice in this file.
    // The first registration (lines 284-308) was correct and used isLightColor()
    // to determine text color automatically. The second registration (here) was
    // incorrect and expected a textColor property that doesn't exist on trait objects.
    //
    // The duplicate registration was overriding the working helpers with broken ones.
    // This section has been removed to prevent the override.
    //
    // The working helpers are registered earlier in this file (lines 284-308).
    // =============================================================================

    // Debug helper to trace template rendering flow
    if (!Handlebars.helpers.debugContext) {
        Handlebars.registerHelper('debugContext', function (label: string, context: any) {
            console.log(`🔧 TEMPLATE DEBUG | ${label}:`, {
                hasDisplayTraits: !!context,
                contextType: typeof context,
                contextLength: context ? context.length : 0,
                contextValue: context
            });
            return '';
        });
    }

    console.log('✅ Template Helpers | All Avant Handlebars helpers registered successfully');
    console.log('🎯 Template Helpers | Stage 4 mathematical helpers (add, range, or) now available');
    console.log('🔧 Template Helpers | FoundryVTT v13 helper conflicts resolved (January 2025)');
}

/**
 * Register Handlebars helpers with error handling and logging
 * 
 * This is the main entry point for helper registration called from
 * the initialization manager.
 * 
 * @returns Promise<boolean> Success status
 */
export async function initializeHandlebarsHelpers(): Promise<boolean> {
    try {
        const Handlebars = (globalThis as any).Handlebars;

        if (!Handlebars) {
            console.warn('Template Helpers | Handlebars not available, skipping helper registration');
            return false;
        }

        await registerAvantHandlebarsHelpers(Handlebars);

        console.log('✅ Template Helpers | Handlebars helper initialization complete');
        return true;

    } catch (error) {
        console.error('❌ Template Helpers | Failed to initialize Handlebars helpers:', error);
        return false;
    }
} 