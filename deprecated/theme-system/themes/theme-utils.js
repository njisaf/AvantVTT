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
import { ThemeConfigUtil as BrowserThemeConfigUtil } from './theme-config-utils.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Theme Configuration Utilities - CLI Version
 * Extends browser utilities with Node.js file system capabilities
 */
class ThemeConfigUtil extends BrowserThemeConfigUtil {
    
    /**
     * Add a new theme variable to the configuration
     * This is for programmatic additions (CLI only)
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
        
        logger.log(`Added theme variable: ${config.cssVar} at path ${path}`);
    }
}

class AvantThemeUtils {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..', '..');
    }

    /**
     * Display help information
     */
    showHelp() {
        logger.log(`
🎨 Avant Theme Utilities - Designer-Friendly Theme Management

USAGE:
  npm run theme:[command] [options]

COMMANDS:
  npm run theme:help                    Show this help message
  
  📋 DOCUMENTATION:
  npm run theme:docs                    Generate theme variables documentation
  npm run theme:list                    List all available theme variables
  
  🎯 THEME TEMPLATES:
  npm run theme:template                Generate a basic theme template (required variables only)
  npm run theme:template:full           Generate a complete theme template (all variables)
  
  ✅ VALIDATION:
  npm run theme:validate <file>         Validate a theme JSON file
  
  🔧 DEVELOPER TOOLS:
  npm run theme:examples                Create example theme files
  npm run theme:mappings                Generate JavaScript mappings from config
  
  📚 DOCUMENTATION:
  npm run docs:update                   Update all theme documentation
  npm run test:themes                   Test theme system end-to-end
  
  💡 EXAMPLES:
  npm run theme:template > my-theme.json
  npm run theme:validate my-theme.json
  npm run theme:docs > THEME-VARIABLES.md

Made for designers, by developers ❤️
        `);
    }

    /**
     * Generate theme documentation
     */
    generateDocs() {
        const doc = ThemeConfigUtil.generateDocumentation();
        logger.log(doc);
    }

    /**
     * List all theme variables in a readable format
     */
    listVariables() {
        logger.log('🎨 Available Theme Variables\n');
        
        const mapping = ThemeConfigUtil.getJSONToCSSMapping();
        const required = ThemeConfigUtil.getRequiredVariables().map(r => r.path);
        
        for (const [jsonPath, cssVar] of Object.entries(mapping)) {
            const isRequired = required.includes(jsonPath);
            const badge = isRequired ? '🔴 REQUIRED' : '🔵 OPTIONAL';
            logger.log(`${badge} ${cssVar}`);
            logger.log(`   JSON Path: ${jsonPath}`);
            logger.log('');
        }
    }

    /**
     * Generate theme template
     */
    generateTemplate(includeOptional = false) {
        const template = ThemeConfigUtil.generateThemeTemplate(includeOptional);
        logger.log(JSON.stringify(template, null, 2));
    }

    /**
     * Validate a theme file
     */
    validateTheme(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                logger.error(`❌ File not found: ${filePath}`);
                return false;
            }

            const fileContent = fs.readFileSync(filePath, 'utf8');
            const theme = JSON.parse(fileContent);
            
            const validation = ThemeConfigUtil.validateTheme(theme);
            
            if (validation.isValid) {
                logger.log('✅ Theme is valid!');
                logger.log(`📄 Theme: ${theme.name} by ${theme.author} (v${theme.version})`);
                return true;
            } else {
                logger.log('❌ Theme validation failed:');
                validation.errors.forEach(error => {
                    logger.log(`   • ${error}`);
                });
                return false;
            }
        } catch (error) {
            logger.error(`❌ Error validating theme: ${error.message}`);
            return false;
        }
    }

    /**
     * Interactive variable addition (for developers)
     */
    async addVariable(varPath) {
        logger.log(`🔧 Adding new theme variable at path: ${varPath}`);
        logger.log('This is a developer feature. For safety, edit theme-config.js directly.');
        logger.log('');
        logger.log('Example addition:');
        logger.log(`
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
        logger.log('🔧 Generating JavaScript mappings...\n');
        
        const allVars = ThemeConfigUtil.getAllCSSVariables();
        const mapping = ThemeConfigUtil.getJSONToCSSMapping();
        
        logger.log('// Auto-generated CSS variable list:');
        logger.log('const themeVariables = [');
        allVars.forEach(varName => {
            logger.log(`    '${varName}',`);
        });
        logger.log('];\n');
        
        logger.log('// Auto-generated JSON to CSS mapping:');
        logger.log('const jsonToCSSMapping = {');
        for (const [jsonPath, cssVar] of Object.entries(mapping)) {
            logger.log(`    '${jsonPath}': '${cssVar}',`);
        }
        logger.log('};\n');
        
        logger.log('// Copy the above code into theme-manager.js to update mappings');
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

        logger.log('✅ Example themes created in styles/themes/examples/');
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
                    logger.error('❌ Please specify a file to validate');
                    logger.log('Usage: node scripts/theme-utils.js validate <file>');
                } else {
                    this.validateTheme(filePath);
                }
                break;
            
            case 'add-var':
                const varPath = args[1];
                if (!varPath) {
                    logger.error('❌ Please specify a variable path');
                    logger.log('Usage: node scripts/theme-utils.js add-var <path>');
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
                logger.error(`❌ Unknown command: ${command}`);
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