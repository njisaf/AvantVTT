/**
 * Avant Theme Configuration
 * Centralized theme variable definitions for easy management
 * This file is the single source of truth for all theme variables
 */

export const THEME_CONFIG = {
    // Core color variables - these are essential and should always be present
    colors: {
        backgrounds: {
            primary: {
                cssVar: '--theme-bg-primary',
                description: 'Main background color for sheet body and primary areas',
                category: 'backgrounds',
                required: true,
                example: '#1C1C1C'
            },
            secondary: {
                cssVar: '--theme-bg-secondary',
                description: 'Secondary backgrounds like sidebars and headers',
                category: 'backgrounds',
                required: true,
                example: '#2A2A2A'
            },
            tertiary: {
                cssVar: '--theme-bg-tertiary',
                description: 'UI element backgrounds like buttons and tiles',
                category: 'backgrounds',
                required: true,
                example: '#333333'
            }
        },
        text: {
            primary: {
                cssVar: '--theme-text-primary',
                description: 'Main text color with high contrast',
                category: 'text',
                required: true,
                example: '#FFFFFF'
            },
            secondary: {
                cssVar: '--theme-text-secondary',
                description: 'Secondary text with medium contrast',
                category: 'text',
                required: true,
                example: '#BFBFBF'
            },
            muted: {
                cssVar: '--theme-text-muted',
                description: 'Subtle text with low contrast',
                category: 'text',
                required: false,
                example: '#808080'
            }
        },
        accents: {
            primary: {
                cssVar: '--theme-accent-primary',
                description: 'Main accent color for borders, highlights, and active states',
                category: 'accents',
                required: true,
                example: '#00E0DC'
            },
            secondary: {
                cssVar: '--theme-accent-secondary',
                description: 'Secondary accent for alternative highlights',
                category: 'accents',
                required: false,
                example: '#4CE2E1'
            },
            tertiary: {
                cssVar: '--theme-accent-tertiary',
                description: 'Additional accent color for variety',
                category: 'accents',
                required: false,
                example: '#00B8B5'
            }
        },
        borders: {
            primary: {
                cssVar: '--theme-border-primary',
                description: 'Primary border color for UI elements',
                category: 'borders',
                required: true,
                example: '#404040'
            },
            accent: {
                cssVar: '--theme-border-accent',
                description: 'Accent border color for highlights',
                category: 'borders',
                required: false,
                example: '#00E0DC'
            }
        },
        states: {
            success: {
                cssVar: '--theme-success',
                description: 'Success state color (green)',
                category: 'states',
                required: false,
                example: '#10B981'
            },
            warning: {
                cssVar: '--theme-warning',
                description: 'Warning state color (yellow/orange)',
                category: 'states',
                required: false,
                example: '#F59E0B'
            },
            error: {
                cssVar: '--theme-error',
                description: 'Error state color (red)',
                category: 'states',
                required: false,
                example: '#EF4444'
            },
            info: {
                cssVar: '--theme-info',
                description: 'Info state color (blue)',
                category: 'states',
                required: false,
                example: '#3B82F6'
            }
        }
    },
    
    // Typography variables
    typography: {
        fontPrimary: {
            cssVar: '--theme-font-primary',
            description: 'Primary font family for body text',
            category: 'typography',
            required: false,
            example: "'Exo 2', sans-serif"
        },
        fontDisplay: {
            cssVar: '--theme-font-display',
            description: 'Display font family for headers and titles',
            category: 'typography',
            required: false,
            example: "'Orbitron', monospace"
        }
    },
    
    // Effects and visual enhancements
    effects: {
        shadows: {
            primary: {
                cssVar: '--theme-shadow-primary',
                description: 'Primary shadow for subtle depth',
                category: 'effects',
                required: false,
                example: '0 4px 20px rgba(0, 224, 220, 0.1)'
            },
            accent: {
                cssVar: '--theme-shadow-accent',
                description: 'Accent shadow for highlights and focus states',
                category: 'effects',
                required: false,
                example: '0 0 20px rgba(0, 224, 220, 0.3)'
            },
            deep: {
                cssVar: '--theme-shadow-deep',
                description: 'Deep shadow for elevated elements',
                category: 'effects',
                required: false,
                example: '0 8px 32px rgba(0, 0, 0, 0.6)'
            }
        },
        gradients: {
            primary: {
                cssVar: '--theme-gradient-primary',
                description: 'Primary gradient for backgrounds',
                category: 'effects',
                required: false,
                example: 'linear-gradient(135deg, #1C1C1C 0%, #2A2A2A 100%)'
            },
            accent: {
                cssVar: '--theme-gradient-accent',
                description: 'Accent gradient for highlights',
                category: 'effects',
                required: false,
                example: 'linear-gradient(135deg, #00E0DC 0%, #4CE2E1 100%)'
            }
        }
    },
    
    // Interface-specific variables (new additions go here)
    interface: {
        animation: {
            speed: {
                cssVar: '--theme-animation-speed',
                description: 'Default animation duration',
                category: 'interface',
                required: false,
                example: '0.3s'
            }
        },
        layout: {
            borderRadius: {
                cssVar: '--theme-border-radius',
                description: 'Default border radius for UI elements',
                category: 'interface',
                required: false,
                example: '0px'
            }
        }
    },
    
    // Metadata variables
    metadata: {
        name: {
            cssVar: '--theme-name',
            description: 'Theme name for identification',
            category: 'metadata',
            required: false,
            example: '"My Theme"'
        },
        author: {
            cssVar: '--theme-author',
            description: 'Theme author name',
            category: 'metadata',
            required: false,
            example: '"Theme Creator"'
        },
        version: {
            cssVar: '--theme-version',
            description: 'Theme version number',
            category: 'metadata',
            required: false,
            example: '"1.0.0"'
        }
    }
};

/**
 * Theme Configuration Utilities
 * Functions to work with the theme configuration programmatically
 */
export class ThemeConfigUtil {
    
    /**
     * Get all CSS custom property names
     */
    static getAllCSSVariables() {
        const variables = [];
        
        function traverse(obj) {
            for (const key in obj) {
                if (obj[key].cssVar) {
                    variables.push(obj[key].cssVar);
                } else if (typeof obj[key] === 'object') {
                    traverse(obj[key]);
                }
            }
        }
        
        traverse(THEME_CONFIG);
        return variables;
    }
    
    /**
     * Get mapping from JSON paths to CSS variables
     */
    static getJSONToCSSMapping() {
        const mapping = {};
        
        function traverse(obj, path = '') {
            for (const key in obj) {
                const currentPath = path ? `${path}.${key}` : key;
                
                if (obj[key].cssVar) {
                    mapping[currentPath] = obj[key].cssVar;
                } else if (typeof obj[key] === 'object' && !obj[key].cssVar) {
                    traverse(obj[key], currentPath);
                }
            }
        }
        
        traverse(THEME_CONFIG);
        return mapping;
    }
    
    /**
     * Get all required variables
     */
    static getRequiredVariables() {
        const required = [];
        
        function traverse(obj, path = '') {
            for (const key in obj) {
                const currentPath = path ? `${path}.${key}` : key;
                
                if (obj[key].required === true) {
                    required.push({
                        path: currentPath,
                        cssVar: obj[key].cssVar,
                        description: obj[key].description
                    });
                } else if (typeof obj[key] === 'object' && !obj[key].cssVar) {
                    traverse(obj[key], currentPath);
                }
            }
        }
        
        traverse(THEME_CONFIG);
        return required;
    }
    
    /**
     * Generate JSON theme template
     */
    static generateThemeTemplate(includeOptional = false) {
        const template = {
            name: "My Custom Theme",
            author: "Your Name",
            version: "1.0.0",
            description: "A description of your theme"
        };
        
        function buildStructure(obj, target, path = '') {
            for (const key in obj) {
                if (obj[key].cssVar) {
                    // This is a variable definition
                    if (obj[key].required || includeOptional) {
                        // Create nested structure in target
                        const pathParts = path.split('.');
                        let current = target;
                        
                        for (const part of pathParts) {
                            if (!current[part]) {
                                current[part] = {};
                            }
                            current = current[part];
                        }
                        
                        current[key] = obj[key].example;
                    }
                } else if (typeof obj[key] === 'object') {
                    const newPath = path ? `${path}.${key}` : key;
                    buildStructure(obj[key], target, newPath);
                }
            }
        }
        
        buildStructure(THEME_CONFIG, template);
        return template;
    }
    
    /**
     * Validate theme against configuration
     */
    static validateTheme(theme) {
        const errors = [];
        const required = this.getRequiredVariables();
        
        for (const req of required) {
            const value = this.getNestedProperty(theme, req.path);
            if (!value) {
                errors.push(`Missing required property: ${req.path}`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Helper to get nested object properties
     */
    static getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    /**
     * Generate documentation from configuration
     */
    static generateDocumentation() {
        let doc = "# Theme Variables Reference\n\n";
        doc += "This document lists all available theme variables.\n\n";
        
        function documentSection(obj, sectionName, level = 2) {
            let content = `${'#'.repeat(level)} ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}\n\n`;
            
            for (const key in obj) {
                if (obj[key].cssVar) {
                    const variable = obj[key];
                    content += `### \`${variable.cssVar}\`\n`;
                    content += `**Description**: ${variable.description}\n`;
                    content += `**Required**: ${variable.required ? 'Yes' : 'No'}\n`;
                    content += `**Example**: \`${variable.example}\`\n\n`;
                } else if (typeof obj[key] === 'object') {
                    content += documentSection(obj[key], key, level + 1);
                }
            }
            
            return content;
        }
        
        for (const section in THEME_CONFIG) {
            doc += documentSection(THEME_CONFIG[section], section);
        }
        
        return doc;
    }
    
    /**
     * Add a new theme variable to the configuration
     * This is for programmatic additions
     */
    static addVariable(path, config) {
        const pathParts = path.split('.');
        let current = THEME_CONFIG;
        
        // Navigate to the parent
        for (let i = 0; i < pathParts.length - 1; i++) {
            if (!current[pathParts[i]]) {
                current[pathParts[i]] = {};
            }
            current = current[pathParts[i]];
        }
        
        // Add the variable
        const varName = pathParts[pathParts.length - 1];
        current[varName] = {
            cssVar: config.cssVar,
            description: config.description,
            category: config.category,
            required: config.required || false,
            example: config.example
        };
        
        console.log(`Added theme variable: ${config.cssVar} at path ${path}`);
    }
} 