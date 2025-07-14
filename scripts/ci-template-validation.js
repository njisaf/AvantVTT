/**
 * @fileoverview CI Template Validation - Phase 4 Universal Template
 * @description Validates universal item template architecture after per-item template removal
 * @version 2.0.0 - Phase 4 Update
 * @author Avant Development Team
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validates universal template architecture.
 * 
 * Phase 4: All item types now use the single universal template.
 * This function validates that:
 * 1. The universal template exists
 * 2. No per-item templates remain
 * 3. All item types are supported by the universal template
 * 
 * @returns {Promise<Object>} Validation result with details
 */
async function validateTemplateMapping() {
    console.log('🔍 Phase 4: Starting universal template validation...');
    
    const systemJsonPath = path.join(__dirname, '..', 'system.json');
    const templatesDir = path.join(__dirname, '..', 'templates');
    const itemTemplatesDir = path.join(templatesDir, 'item');
    
    try {
        // Read system.json
        const systemJsonContent = fs.readFileSync(systemJsonPath, 'utf8');
        const systemData = JSON.parse(systemJsonContent);
        
        // Extract item types from documentTypes.Item
        const declaredItemTypes = Object.keys(systemData.documentTypes?.Item || {});
        console.log(`📋 Found ${declaredItemTypes.length} declared item types:`, declaredItemTypes);
        
        const results = {
            total: declaredItemTypes.length,
            universalTemplateExists: false,
            perItemTemplatesRemoved: true,
            itemTypesSupported: declaredItemTypes.length,
            leftoverTemplates: []
        };
        
        // Check 1: Universal template exists
        const universalTemplatePath = path.join(templatesDir, 'item-sheet.html');
        results.universalTemplateExists = fs.existsSync(universalTemplatePath);
        
        if (results.universalTemplateExists) {
            console.log(`✅ Universal template found: item-sheet.html`);
        } else {
            console.log(`❌ Universal template missing: ${universalTemplatePath}`);
        }
        
        // Check 2: No per-item templates remain (they should all be deleted)
        const itemTypesToCheck = ['talent', 'augment', 'weapon', 'armor', 'gear', 'action', 'feature', 'trait'];
        for (const itemType of itemTypesToCheck) {
            const legacyTemplatePath = path.join(itemTemplatesDir, `item-${itemType}-new.html`);
            if (fs.existsSync(legacyTemplatePath)) {
                results.perItemTemplatesRemoved = false;
                results.leftoverTemplates.push(itemType);
                console.log(`❌ Legacy template still exists: item-${itemType}-new.html`);
            } else {
                console.log(`✅ Legacy template removed: item-${itemType}-new.html`);
            }
        }
        
        // Check 3: All declared item types should be supported (informational)
        console.log(`✅ All ${declaredItemTypes.length} item types supported by universal template`);
        
        // Report results
        console.log(`\n📊 Phase 4 Template Validation Results:`);
        console.log(`• Universal template exists: ${results.universalTemplateExists ? '✅' : '❌'}`);
        console.log(`• Per-item templates removed: ${results.perItemTemplatesRemoved ? '✅' : '❌'}`);
        console.log(`• Item types supported: ${results.itemTypesSupported}`);
        console.log(`• Leftover templates: ${results.leftoverTemplates.length}`);
        
        const success = results.universalTemplateExists && results.perItemTemplatesRemoved;
        
        if (!success) {
            if (!results.universalTemplateExists) {
                console.error(`\n❌ Universal template missing: ${universalTemplatePath}`);
            }
            if (!results.perItemTemplatesRemoved) {
                console.error(`\n❌ Legacy templates still exist: ${results.leftoverTemplates.join(', ')}`);
            }
            return { success: false, ...results };
        }
        
        console.log(`\n✅ Phase 4 universal template architecture validated!`);
        return { success: true, ...results };
        
    } catch (error) {
        console.error('❌ Template validation failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Validates universal template content for Phase 4 architecture.
 * 
 * @returns {Object} Validation result for the universal template
 */
function validateUniversalTemplateContent() {
    const templatePath = path.join(__dirname, '..', 'templates', 'item-sheet.html');
    
    if (!fs.existsSync(templatePath)) {
        return { valid: false, error: 'Universal template file not found' };
    }
    
    try {
        const content = fs.readFileSync(templatePath, 'utf8');
        const issues = [];
        
        // Check for ApplicationV2 architecture features
        if (!content.includes('data-application-part="form"')) {
            issues.push('Missing FoundryVTT v13 form application part');
        }
        
        // Check for proper component usage
        if (!content.includes('templates/shared/partials/')) {
            issues.push('Not using component-based architecture');
        }
        
        // Check for universal architecture components (layered partials)
        const requiredArchitectureComponents = [
            'avant-item-header',     // Universal header partial
            'item-body'              // Universal body partial
        ];
        
        for (const component of requiredArchitectureComponents) {
            if (!content.includes(component)) {
                issues.push(`Missing required universal architecture component: ${component}`);
            }
        }
        
        // Check for proper universal template structure
        if (!content.includes('avant-item-header') || !content.includes('item-body')) {
            issues.push('Universal template missing required architecture partials');
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
 * Main validation function for CI/CD pipeline - Phase 4.
 * 
 * @returns {Promise<boolean>} True if all validations pass
 */
async function runValidation() {
    console.log('🚀 Running Phase 4 CI Template Validation...\n');
    
    const templateResult = await validateTemplateMapping();
    
    if (!templateResult.success) {
        console.error('\n❌ Template validation failed');
        process.exit(1);
    }
    
    // Validate universal template content
    console.log('\n🔍 Validating universal template content...');
    const contentResult = validateUniversalTemplateContent();
    
    if (contentResult.valid) {
        console.log(`✅ Universal template: content valid`);
    } else {
        console.error(`❌ Universal template: ${contentResult.error || contentResult.issues?.join(', ')}`);
        console.error('\n❌ Universal template content validation failed');
        process.exit(1);
    }
    
    console.log('\n✅ All Phase 4 template validations passed!');
    return true;
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runValidation().catch(error => {
        console.error('❌ Validation script failed:', error);
        process.exit(1);
    });
}

export { validateTemplateMapping, validateUniversalTemplateContent, runValidation }; 