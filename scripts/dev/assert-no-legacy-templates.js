#!/usr/bin/env node

/**
 * CI Guard: Assert No Legacy Templates
 * 
 * This script prevents the introduction of legacy item sheet templates
 * into the repository. All item sheets must use the component-based
 * architecture with -new.html suffix.
 * 
 * Usage: node scripts/dev/assert-no-legacy-templates.js
 * 
 * Exit codes:
 * - 0: Success, no legacy templates found
 * - 1: Failure, legacy templates detected
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the templates directory
const templatesDir = path.join(__dirname, '..', '..', 'templates', 'item');

// Legacy template patterns to detect
const legacyPatterns = [
    /^item-.*-sheet\.html$/,  // Legacy naming pattern
    /^item-.*\.html$/         // Generic item templates (except *-new.html)
];

// Allowed patterns (these are OK)
const allowedPatterns = [
    /^item-.*-new\.html$/,    // Component-based templates
    /^item-base-sheet\.html$/ // Base sheet template (still used)
];

/**
 * Check if a file name is a legacy template
 * @param {string} filename - The file name to check
 * @returns {boolean} True if it's a legacy template
 */
function isLegacyTemplate(filename) {
    // Skip if it's an allowed pattern
    if (allowedPatterns.some(pattern => pattern.test(filename))) {
        return false;
    }
    
    // Check if it matches legacy patterns
    return legacyPatterns.some(pattern => pattern.test(filename));
}

/**
 * Main validation function
 * @returns {boolean} True if validation passes
 */
function validateNoLegacyTemplates() {
    console.log('🛡️  CI Guard | Checking for legacy templates...');
    
    // Check if templates directory exists
    if (!fs.existsSync(templatesDir)) {
        console.log('✅ CI Guard | No templates directory found - OK');
        return true;
    }
    
    // Get all files in templates directory
    const files = fs.readdirSync(templatesDir);
    console.log(`🔍 CI Guard | Found ${files.length} files in templates/item/`);
    
    // Check each file
    const legacyFiles = [];
    
    for (const file of files) {
        if (isLegacyTemplate(file)) {
            legacyFiles.push(file);
        }
    }
    
    // Report results
    if (legacyFiles.length === 0) {
        console.log('✅ CI Guard | No legacy templates found - All clear!');
        
        // Show what we found instead
        const componentFiles = files.filter(file => file.endsWith('-new.html'));
        console.log(`📊 CI Guard | Found ${componentFiles.length} component-based templates:`);
        componentFiles.forEach(file => {
            console.log(`   - ${file}`);
        });
        
        return true;
    } else {
        console.error('❌ CI Guard | Legacy templates detected!');
        console.error('');
        console.error('The following legacy templates were found:');
        legacyFiles.forEach(file => {
            console.error(`   - ${file}`);
        });
        console.error('');
        console.error('🚨 REQUIRED ACTION:');
        console.error('   1. Remove legacy templates and update references');
        console.error('   2. Use component-based templates (item-*-new.html)');
        console.error('   3. Update initialization-manager.ts template loading');
        console.error('');
        console.error('📚 For help, see: docs/components/item-sheets.md');
        
        return false;
    }
}

/**
 * Additional validation: Check for legacy references in code
 * @returns {boolean} True if no legacy references found
 */
function validateNoLegacyReferences() {
    console.log('🔍 CI Guard | Checking for legacy template references in code...');
    
    const filesToCheck = [
        'scripts/utils/initialization-manager.ts',
        'scripts/logic/item-sheet-utils.ts',
        'scripts/logic/item-sheet-utils.js',
        'templates/item-sheet.html'
    ];
    
    const legacyReferences = [];
    
    for (const file of filesToCheck) {
        const filePath = path.join(__dirname, '..', '..', file);
        
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check for legacy template references
            const legacyRefPattern = /item-.*-sheet\.html/g;
            const matches = content.match(legacyRefPattern);
            
            if (matches) {
                legacyReferences.push({
                    file,
                    references: matches
                });
            }
        }
    }
    
    if (legacyReferences.length === 0) {
        console.log('✅ CI Guard | No legacy template references found in code');
        return true;
    } else {
        console.error('❌ CI Guard | Legacy template references found in code!');
        console.error('');
        legacyReferences.forEach(({ file, references }) => {
            console.error(`   File: ${file}`);
            references.forEach(ref => {
                console.error(`     - ${ref}`);
            });
        });
        console.error('');
        console.error('🚨 REQUIRED ACTION:');
        console.error('   Update these references to use component-based templates');
        console.error('   Replace *-sheet.html with *-new.html');
        
        return false;
    }
}

// Run the validation
function main() {
    console.log('🎯 Phase 6 CI Guard | Legacy Template Prevention');
    console.log('===============================================');
    
    const templateCheck = validateNoLegacyTemplates();
    const referenceCheck = validateNoLegacyReferences();
    
    if (templateCheck && referenceCheck) {
        console.log('');
        console.log('🎉 SUCCESS | No legacy templates or references found!');
        console.log('🚀 Component-based architecture is properly enforced');
        process.exit(0);
    } else {
        console.log('');
        console.log('❌ FAILURE | Legacy templates or references detected');
        console.log('🛑 Build should be blocked until fixed');
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export {
    validateNoLegacyTemplates,
    validateNoLegacyReferences,
    isLegacyTemplate
}; 