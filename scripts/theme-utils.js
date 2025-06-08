#!/usr/bin/env node

/**
 * Avant Theme Utilities
 * Designer-friendly command line tools for theme management
 * Run with: node scripts/theme-utils.js [command]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { THEME_CONFIG } from './theme-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Theme Configuration Utilities
 * Functions to work with the theme configuration programmatically
 */
class ThemeConfigUtil {
    
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

class AvantThemeUtils {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
    }

    /**
     * Display help information
     */
    showHelp() {
        console.log(`
🎨 Avant Theme Utilities - Designer-Friendly Theme Management

USAGE:
  node scripts/theme-utils.js [command] [options]

COMMANDS:
  help                     Show this help message
  
  📋 DOCUMENTATION:
  docs                     Generate theme variables documentation
  list-vars               List all available theme variables
  
  🎯 THEME TEMPLATES:
  template                 Generate a basic theme template (required variables only)
  template-full           Generate a complete theme template (all variables)
  
  ✅ VALIDATION:
  validate <file>         Validate a theme JSON file
  
  🔧 DEVELOPER TOOLS:
  add-var <path>          Add a new theme variable (interactive)
  generate-mappings       Generate JavaScript mappings from config
  
  💡 EXAMPLES:
  node scripts/theme-utils.js template > my-theme.json
  node scripts/theme-utils.js validate my-theme.json
  node scripts/theme-utils.js docs > THEME-VARIABLES.md

Made for designers, by developers ❤️
        `);
    }

    /**
     * Generate theme documentation
     */
    generateDocs() {
        const doc = ThemeConfigUtil.generateDocumentation();
        console.log(doc);
    }

    /**
     * List all theme variables in a readable format
     */
    listVariables() {
        console.log('🎨 Available Theme Variables\n');
        
        const mapping = ThemeConfigUtil.getJSONToCSSMapping();
        const required = ThemeConfigUtil.getRequiredVariables().map(r => r.path);
        
        for (const [jsonPath, cssVar] of Object.entries(mapping)) {
            const isRequired = required.includes(jsonPath);
            const badge = isRequired ? '🔴 REQUIRED' : '🔵 OPTIONAL';
            console.log(`${badge} ${cssVar}`);
            console.log(`   JSON Path: ${jsonPath}`);
            console.log('');
        }
    }

    /**
     * Generate theme template
     */
    generateTemplate(includeOptional = false) {
        const template = ThemeConfigUtil.generateThemeTemplate(includeOptional);
        console.log(JSON.stringify(template, null, 2));
    }

    /**
     * Validate a theme file
     */
    validateTheme(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                console.error(`❌ File not found: ${filePath}`);
                return false;
            }

            const fileContent = fs.readFileSync(filePath, 'utf8');
            const theme = JSON.parse(fileContent);
            
            const validation = ThemeConfigUtil.validateTheme(theme);
            
            if (validation.isValid) {
                console.log('✅ Theme is valid!');
                console.log(`📄 Theme: ${theme.name} by ${theme.author} (v${theme.version})`);
                return true;
            } else {
                console.log('❌ Theme validation failed:');
                validation.errors.forEach(error => {
                    console.log(`   • ${error}`);
                });
                return false;
            }
        } catch (error) {
            console.error(`❌ Error validating theme: ${error.message}`);
            return false;
        }
    }

    /**
     * Interactive variable addition (for developers)
     */
    async addVariable(varPath) {
        console.log(`🔧 Adding new theme variable at path: ${varPath}`);
        console.log('This is a developer feature. For safety, edit theme-config.js directly.');
        console.log('');
        console.log('Example addition:');
        console.log(`
// In theme-config.js, add to the appropriate section:
${varPath}: {
    cssVar: '--theme-your-variable',
    description: 'Description of your variable',
    category: 'appropriate-category',
    required: false,
    example: '#000000'
}
        `);
    }

    /**
     * Generate JavaScript mappings for theme manager
     */
    generateMappings() {
        console.log('🔧 Generating JavaScript mappings...\n');
        
        const allVars = ThemeConfigUtil.getAllCSSVariables();
        const mapping = ThemeConfigUtil.getJSONToCSSMapping();
        
        console.log('// Auto-generated CSS variable list:');
        console.log('const themeVariables = [');
        allVars.forEach(varName => {
            console.log(`    '${varName}',`);
        });
        console.log('];\n');
        
        console.log('// Auto-generated JSON to CSS mapping:');
        console.log('const jsonToCSSMapping = {');
        for (const [jsonPath, cssVar] of Object.entries(mapping)) {
            console.log(`    '${jsonPath}': '${cssVar}',`);
        }
        console.log('};\n');
        
        console.log('// Copy the above code into theme-manager.js to update mappings');
    }

    /**
     * Create example themes
     */
    createExamples() {
        const examplesDir = path.join(this.rootDir, 'styles', 'themes', 'examples');
        
        // Ensure examples directory exists
        if (!fs.existsSync(examplesDir)) {
            fs.mkdirSync(examplesDir, { recursive: true });
        }

        // Minimal theme (required only)
        const minimalTheme = ThemeConfigUtil.generateThemeTemplate(false);
        minimalTheme.name = "Minimal Example";
        minimalTheme.description = "A minimal theme with only required variables";
        
        fs.writeFileSync(
            path.join(examplesDir, 'minimal-example.json'),
            JSON.stringify(minimalTheme, null, 2)
        );

        // Complete theme (all variables)
        const completeTheme = ThemeConfigUtil.generateThemeTemplate(true);
        completeTheme.name = "Complete Example";
        completeTheme.description = "A complete theme showing all available variables";
        
        fs.writeFileSync(
            path.join(examplesDir, 'complete-example.json'),
            JSON.stringify(completeTheme, null, 2)
        );

        console.log('✅ Example themes created in styles/themes/examples/');
    }

    /**
     * Run the CLI
     */
    run() {
        const args = process.argv.slice(2);
        const command = args[0];

        switch (command) {
            case 'help':
            case undefined:
                this.showHelp();
                break;
            
            case 'docs':
                this.generateDocs();
                break;
            
            case 'list-vars':
                this.listVariables();
                break;
            
            case 'template':
                this.generateTemplate(false);
                break;
            
            case 'template-full':
                this.generateTemplate(true);
                break;
            
            case 'validate':
                const filePath = args[1];
                if (!filePath) {
                    console.error('❌ Please specify a file to validate');
                    console.log('Usage: node scripts/theme-utils.js validate <file>');
                } else {
                    this.validateTheme(filePath);
                }
                break;
            
            case 'add-var':
                const varPath = args[1];
                if (!varPath) {
                    console.error('❌ Please specify a variable path');
                    console.log('Usage: node scripts/theme-utils.js add-var <path>');
                } else {
                    this.addVariable(varPath);
                }
                break;
            
            case 'generate-mappings':
                this.generateMappings();
                break;
            
            case 'create-examples':
                this.createExamples();
                break;
            
            default:
                console.error(`❌ Unknown command: ${command}`);
                this.showHelp();
                break;
        }
    }
}

// Run the CLI if this file is executed directly
if (process.argv[1] === __filename) {
    const utils = new AvantThemeUtils();
    utils.run();
}

export { AvantThemeUtils, ThemeConfigUtil }; 