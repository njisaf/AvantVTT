#!/usr/bin/env node

/**
 * @fileoverview Handlebars Partial Validation Script
 * @version 1.0.1 - FoundryVTT v13 Compatible
 * @description Validates that all Handlebars partials referenced in templates exist in dist/
 * @author Avant VTT Team
 * 
 * TEMPLATE LOADING REQUIREMENTS FOR FOUNDRYVTT:
 * 
 * 1. All partials must be registered in initialization-manager.ts templatePaths array
 * 2. Template references must use full system paths: "systems/avant/templates/..."
 * 3. Physical files must exist in dist/ directory after build
 * 4. Path format must be consistent across all references
 * 
 * VALIDATION PROCESS:
 * 
 * - Scans all .html and .hbs files in dist/ directory
 * - Extracts {{> "path"}} references using regex
 * - Validates each referenced partial exists as a physical file
 * - Enforces consistent path format (systems/avant/templates/...)
 * - Reports missing partials with fix suggestions
 * 
 * COMMON ISSUES THIS CATCHES:
 * 
 * - Partial files not copied to dist/ during build
 * - Inconsistent path formats (relative vs full system paths)
 * - Typos in partial names or paths
 * - Missing template registration in initialization-manager.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');

/**
 * Extract partial references from Handlebars template content
 * @param {string} content - Template file content
 * @returns {string[]} Array of partial paths referenced
 */
function extractPartialReferences(content) {
    const partialPattern = /\{\{\>\s*["']([^"']+)["']/g;
    const partials = [];
    let match;
    
    while ((match = partialPattern.exec(content)) !== null) {
        partials.push(match[1]);
    }
    
    return partials;
}

/**
 * Validate that a partial file exists in the dist directory
 * @param {string} partialPath - Partial path from template
 * @param {string} templateFile - Source template file for error reporting
 * @returns {boolean} True if partial exists
 */
function validatePartialExists(partialPath, templateFile) {
    // Handle different partial path formats and provide suggestions
    let actualPath;
    let exists = false;
    let suggestions = [];
    
    if (partialPath.startsWith('systems/avant/')) {
        // Full system path format - should work with proper template loading
        actualPath = partialPath.replace('systems/avant/', '');
        
        // Check with .hbs extension first (most common case for partials)
        let fullPath = path.join(DIST_DIR, actualPath + '.hbs');
        exists = fs.existsSync(fullPath);
        
        // If not found with .hbs, try without extension (for .html templates)
        if (!exists) {
            fullPath = path.join(DIST_DIR, actualPath);
            exists = fs.existsSync(fullPath);
        }
        
        if (!exists) {
            suggestions.push(`Check if file exists at: ${fullPath}`);
            suggestions.push(`Ensure templates are copied correctly during build`);
        }
    } else if (partialPath.startsWith('templates/')) {
        // Relative path format - check if it exists and suggest fix
        actualPath = partialPath;
        
        // Check with .hbs extension first
        let fullPath = path.join(DIST_DIR, actualPath + '.hbs');
        exists = fs.existsSync(fullPath);
        
        // If not found with .hbs, try without extension
        if (!exists) {
            fullPath = path.join(DIST_DIR, actualPath);
            exists = fs.existsSync(fullPath);
        }
        
        if (exists) {
            // File exists but path format is inconsistent
            console.warn(`⚠️  INCONSISTENT PATH: ${partialPath}`);
            console.warn(`   Referenced in: ${templateFile}`);
            console.warn(`   File exists but should use full system path: systems/avant/${partialPath}`);
            console.warn(`   This may cause runtime errors in FoundryVTT`);
            suggestions.push(`Change reference to: "systems/avant/${partialPath}"`);
        } else {
            suggestions.push(`File not found at: ${fullPath}`);
            suggestions.push(`Check if file should be: systems/avant/${partialPath}`);
        }
    } else {
        // Assume it's a relative path that should be in templates/
        actualPath = `templates/${partialPath}`;
        
        // Check with .hbs extension first
        let fullPath = path.join(DIST_DIR, actualPath + '.hbs');
        exists = fs.existsSync(fullPath);
        
        // If not found with .hbs, try without extension
        if (!exists) {
            fullPath = path.join(DIST_DIR, actualPath);
            exists = fs.existsSync(fullPath);
        }
        
        if (!exists) {
            suggestions.push(`Check if file exists at: ${fullPath}`);
            suggestions.push(`Consider using full path: systems/avant/templates/${partialPath}`);
        }
    }
    
    if (!exists) {
        console.error(`❌ MISSING PARTIAL: ${partialPath}`);
        console.error(`   Referenced in: ${templateFile}`);
        console.error(`   Expected path: ${actualPath}`);
        suggestions.forEach(suggestion => {
            console.error(`   💡 ${suggestion}`);
        });
    } else if (!partialPath.startsWith('systems/avant/')) {
        // Found but using inconsistent path format
        return false; // Treat as validation failure to enforce consistency
    } else {
        console.log(`✅ Found partial: ${actualPath}`);
    }
    
    return exists && partialPath.startsWith('systems/avant/');
}

/**
 * Main validation function
 */
async function validatePartials() {
    console.log('🔍 Handlebars Partial Validation: Starting...');
    console.log(`📁 Validating partials in: ${DIST_DIR}`);
    
    if (!fs.existsSync(DIST_DIR)) {
        console.error(`❌ Dist directory not found: ${DIST_DIR}`);
        console.error('💡 Run "npm run build" first to create the dist directory');
        process.exit(1);
    }
    
    // Find all template files in dist
    const templatePattern = path.join(DIST_DIR, '**/*.{html,hbs}');
    const templateFiles = await glob(templatePattern);
    
    if (templateFiles.length === 0) {
        console.error('❌ No template files found in dist directory');
        process.exit(1);
    }
    
    console.log(`📋 Found ${templateFiles.length} template files to validate`);
    
    let totalPartials = 0;
    let missingPartials = 0;
    const allMissingPartials = [];
    
    // Process each template file
    for (const templateFile of templateFiles) {
        const relativePath = path.relative(DIST_DIR, templateFile);
        const content = fs.readFileSync(templateFile, 'utf8');
        const partials = extractPartialReferences(content);
        
        if (partials.length > 0) {
            console.log(`\n📄 Checking template: ${relativePath}`);
            console.log(`   Found ${partials.length} partial reference(s)`);
            
            for (const partial of partials) {
                totalPartials++;
                const exists = validatePartialExists(partial, relativePath);
                if (!exists) {
                    missingPartials++;
                    allMissingPartials.push({
                        partial,
                        template: relativePath
                    });
                }
            }
        }
    }
    
    // Summary
    console.log('\n📊 Validation Summary:');
    console.log(`   Total partials checked: ${totalPartials}`);
    console.log(`   Missing partials: ${missingPartials}`);
    console.log(`   Templates processed: ${templateFiles.length}`);
    
    if (missingPartials > 0) {
        console.error('\n❌ VALIDATION FAILED');
        console.error('Missing partials detected:');
        
        for (const missing of allMissingPartials) {
            console.error(`   • ${missing.partial} (in ${missing.template})`);
        }
        
        console.error('\n💡 Fix suggestions:');
        console.error('   1. Ensure partial files exist in the correct location');
        console.error('   2. Use FULL system paths: "systems/avant/templates/path/file.hbs" (required by FoundryVTT)');
        console.error('   3. Register template in initialization-manager.ts templatePaths array');
        console.error('   4. Check that build process copies all template files to dist/');
        
        process.exit(1);
    } else {
        console.log('\n✅ All partials validated successfully!');
        console.log('🎉 No missing partials detected');
    }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    validatePartials().catch((error) => {
        console.error('❌ Validation script failed:', error);
        process.exit(1);
    });
}

export { validatePartials, extractPartialReferences, validatePartialExists }; 