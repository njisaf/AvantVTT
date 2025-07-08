/**
 * @fileoverview Handlebars Template Helpers Registration
 * @description Centralized registration of all custom Handlebars helpers for the Avant system
 * @version 2.1.0 - FoundryVTT Helper Conflict Resolution
 * @author Avant Development Team
 * 
 * STAGE 4 LESSONS LEARNED (SUCCESSFULLY RESOLVED):
 * 
 * 🔍 CRITICAL DEBUGGING INSIGHTS:
 * 1. Missing helpers cause COMPLETE template rendering failure with clear error messages
 * 2. Helper registration must happen BEFORE any template rendering occurs
 * 3. FoundryVTT v13 is more strict about helper dependencies than previous versions
 * 4. Complex template expressions like {{#each (range 1 (add (or max 3) 1))}} require ALL helpers
 * 
 * 🚨 FOUNDRY HELPER CONFLICTS DISCOVERED & RESOLVED (January 2025):
 * 1. FoundryVTT v13 has built-in helpers that conflict with custom helper names
 * 2. Built-in 'or' helper performs boolean evaluation, not value selection
 * 3. This caused AP selector button generation to completely fail
 * 4. SOLUTION: Force-override conflicting helpers + provide unique fallback names
 * 5. LESSON: Always test helpers in actual FoundryVTT environment, not just build validation
 * 
 * 🎯 HELPER DESIGN PATTERNS:
 * 1. Always check if helper exists before registering (avoid conflicts)
 * 2. Use defensive parameter parsing (parseFloat, parseInt with fallbacks)
 * 3. Document helper usage clearly for future developers
 * 4. Keep helpers pure and predictable (same input = same output)
 * 5. Provide fallback helpers with unique names for critical functionality
 * 
 * 🚨 RUNTIME FAILURE POINTS:
 * 1. AP Selector template requires: add, range, avantOr helpers for iteration logic
 * 2. Template partials require .hbs extensions in FoundryVTT v13
 * 3. Helper registration timing is critical in initialization sequence
 * 4. Helper conflicts can cause silent failures with unexpected results
 * 
 * ✅ STAGE 2 UNIVERSAL ITEM SHEET SUCCESS:
 * All issues resolved! AP selectors now generate clickable visual dots correctly.
 * Universal item sheet architecture is fully functional across all item types.
 * 
 * 💡 DEBUGGING METHODOLOGY THAT WORKED:
 * 1. Check browser console for specific "Missing helper: X" errors
 * 2. Search codebase for helper usage patterns
 * 3. Implement missing helpers with proper validation
 * 4. Test deployment immediately after each fix
 * 5. Verify with actual template rendering, not just build validation
 * 6. Add comprehensive debug logging to trace helper execution
 * 7. Compare expected vs actual helper return values
 */

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
    // TRAIT ACCESSIBILITY HELPERS
    // =============================================================================

    // Trait chip styling helper
    if (!Handlebars.helpers.traitChipStyle) {
        Handlebars.registerHelper('traitChipStyle', function (trait: any) {
            if (!trait || !trait.color) {
                return '--trait-color: #6C757D; --trait-text-color: #000000;';
            }

            // Validate color format
            if (!trait.color || typeof trait.color !== 'string') {
                console.warn(`Invalid trait color format: ${trait.color}. Using fallback.`);
                return '--trait-color: #6C757D; --trait-text-color: #000000;';
            }

            // Use explicit textColor if provided, otherwise default to black
            const textColor = trait.textColor || '#000000';
            return `--trait-color: ${trait.color}; --trait-text-color: ${textColor};`;
        });
    }

    // Trait chip data attributes helper
    if (!Handlebars.helpers.traitChipData) {
        Handlebars.registerHelper('traitChipData', function (trait: any) {
            if (!trait || !trait.color) {
                return 'data-color="#6C757D" data-text-color="#000000"';
            }

            // Validate color format
            if (!trait.color || typeof trait.color !== 'string') {
                console.warn(`Invalid trait color format in data attributes: ${trait.color}. Using fallback.`);
                return 'data-color="#6C757D" data-text-color="#000000"';
            }

            // Use explicit textColor if provided, otherwise default to black
            const textColor = trait.textColor || '#000000';
            return `data-color="${trait.color}" data-text-color="${textColor}"`;
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