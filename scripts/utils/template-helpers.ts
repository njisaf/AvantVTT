/**
 * @fileoverview Handlebars Template Helpers Registration
 * @description Centralized registration of all custom Handlebars helpers for the Avant system
 * @version 2.0.0
 * @author Avant Development Team
 */

/**
 * Register all custom Handlebars helpers for the Avant system
 * 
 * This function registers all custom helpers needed by Avant templates,
 * including utility helpers, accessibility helpers, and trait-specific helpers.
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
        Handlebars.registerHelper('json', function(context: any) {
            return JSON.stringify(context);
        });
    }

    // Times iterator helper for repeating elements (AP icons, etc.)
    if (!Handlebars.helpers.times) {
        Handlebars.registerHelper('times', function(n: number, options: any) {
            let result = '';
            for (let i = 0; i < n; i++) {
                result += options.fn(i);
            }
            return result;
        });
    }

    // Math operations helper for template calculations
    if (!Handlebars.helpers.math) {
        Handlebars.registerHelper('math', function(a: any, operator: string, b: any) {
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
    // TRAIT ACCESSIBILITY HELPERS
    // =============================================================================

    // Trait chip styling helper
    if (!Handlebars.helpers.traitChipStyle) {
        Handlebars.registerHelper('traitChipStyle', function(trait: any) {
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
        Handlebars.registerHelper('traitChipData', function(trait: any) {
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