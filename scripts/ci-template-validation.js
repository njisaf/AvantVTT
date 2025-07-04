/**
 * @fileoverview CI Template Validation
 * @description Validates that all declared item types have corresponding template files
 * @version 1.0.0
 * @author Avant Development Team
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validates that all item types have corresponding templates.
 * 
 * This function reads the system.json file to get all declared item types,
 * then checks that each type has a corresponding template file in the
 * templates/item/ directory.
 * 
 * @returns {Promise<Object>} Validation result with details
 */
async function validateTemplateMapping() {
    console.log('🔍 Starting template validation...');
    
    const systemJsonPath = path.join(__dirname, '..', 'system.json');
    const templatesDir = path.join(__dirname, '..', 'templates', 'item');
    
    try {
        // Read system.json
        const systemJsonContent = fs.readFileSync(systemJsonPath, 'utf8');
        const systemData = JSON.parse(systemJsonContent);
        
        // Extract item types from documentTypes.Item
        const declaredItemTypes = Object.keys(systemData.documentTypes?.Item || {});
        console.log(`📋 Found ${declaredItemTypes.length} declared item types:`, declaredItemTypes);
        
        // Check for template files
        const results = {
            total: declaredItemTypes.length,
            valid: 0,
            missing: [],
            found: []
        };
        
        for (const itemType of declaredItemTypes) {
            const templatePath = path.join(templatesDir, `item-${itemType}-sheet.html`);
            const exists = fs.existsSync(templatePath);
            
            if (exists) {
                results.valid++;
                results.found.push(itemType);
                console.log(`✅ ${itemType}: template found`);
            } else {
                results.missing.push(itemType);
                console.log(`❌ ${itemType}: template missing at ${templatePath}`);
            }
        }
        
        // Check for extra templates (informational)
        const templateFiles = fs.readdirSync(templatesDir)
            .filter(file => file.startsWith('item-') && file.endsWith('-sheet.html'))
            .map(file => file.replace('item-', '').replace('-sheet.html', ''));
        
        const extraTemplates = templateFiles.filter(type => !declaredItemTypes.includes(type));
        if (extraTemplates.length > 0) {
            console.log(`ℹ️  Found ${extraTemplates.length} extra templates:`, extraTemplates);
        }
        
        // Report results
        console.log(`\n📊 Template Validation Results:`);
        console.log(`• Total item types: ${results.total}`);
        console.log(`• Valid mappings: ${results.valid}`);
        console.log(`• Missing templates: ${results.missing.length}`);
        
        if (results.missing.length > 0) {
            console.error(`\n❌ Missing templates for: ${results.missing.join(', ')}`);
            return { success: false, ...results };
        }
        
        console.log(`\n✅ All item types have corresponding templates!`);
        return { success: true, ...results };
        
    } catch (error) {
        console.error('❌ Template validation failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Validates specific template content for common issues.
 * 
 * @param {string} itemType - The item type to validate
 * @returns {Object} Validation result for the template
 */
function validateTemplateContent(itemType) {
    const templatePath = path.join(__dirname, '..', 'templates', 'item', `item-${itemType}-sheet.html`);
    
    if (!fs.existsSync(templatePath)) {
        return { valid: false, error: 'Template file not found' };
    }
    
    try {
        const content = fs.readFileSync(templatePath, 'utf8');
        const issues = [];
        
        // Check for common issues
        if (!content.includes('data-action')) {
            issues.push('Missing data-action attributes for buttons');
        }
        
        if (!content.includes('data-dtype')) {
            issues.push('Missing data-dtype attributes for form fields');
        }
        
        if (itemType === 'talent' && !content.includes('apCost')) {
            issues.push('Talent template missing AP cost field');
        }
        
        if (itemType === 'augment' && !content.includes('ppCost')) {
            issues.push('Augment template missing PP cost field');
        }
        
        return {
            valid: issues.length === 0,
            issues: issues
        };
        
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

/**
 * Main validation function for CI/CD pipeline.
 * 
 * @returns {Promise<boolean>} True if all validations pass
 */
async function runValidation() {
    console.log('🚀 Running CI Template Validation...\n');
    
    const templateResult = await validateTemplateMapping();
    
    if (!templateResult.success) {
        console.error('\n❌ Template validation failed');
        process.exit(1);
    }
    
    // Validate specific template content for key types
    const criticalTypes = ['talent', 'augment'];
    let contentIssues = 0;
    
    console.log('\n🔍 Validating template content...');
    for (const itemType of criticalTypes) {
        const contentResult = validateTemplateContent(itemType);
        
        if (contentResult.valid) {
            console.log(`✅ ${itemType}: template content valid`);
        } else {
            console.error(`❌ ${itemType}: ${contentResult.error || contentResult.issues?.join(', ')}`);
            contentIssues++;
        }
    }
    
    if (contentIssues > 0) {
        console.error(`\n❌ Found ${contentIssues} template content issues`);
        process.exit(1);
    }
    
    console.log('\n✅ All template validations passed!');
    return true;
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runValidation().catch(error => {
        console.error('❌ Validation script failed:', error);
        process.exit(1);
    });
}

export { validateTemplateMapping, validateTemplateContent, runValidation }; 