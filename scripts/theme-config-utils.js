/**
 * Theme Configuration Utilities - Browser Compatible
 * Functions to work with the theme configuration in FoundryVTT
 * This file contains NO Node.js imports and is safe for browser use
 */

import { THEME_CONFIG } from './theme-config.js';

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
} 