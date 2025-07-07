/**
 * @fileoverview Template Partial Registration Tests
 * @description Tests to prevent template registration issues from occurring again
 * @author Avant VTT Team
 * @version 1.0.0
 */

import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

describe('Template Partial Registration', () => {
    test('image-upload partial exists and is properly structured', () => {
        const partialPath = path.join(PROJECT_ROOT, 'templates/shared/partials/image-upload.hbs');
        
        // Verify file exists
        expect(fs.existsSync(partialPath)).toBe(true);
        
        // Verify file has proper content structure
        const content = fs.readFileSync(partialPath, 'utf8');
        expect(content).toContain('image-upload');
        expect(content).toContain('data-edit="img"');
        expect(content).toContain('role="button"');
        expect(content).toContain('aria-label=');
    });

    test('all component library partials exist', () => {
        const requiredPartials = [
            'form-row.hbs',
            'number-field.hbs',
            'checkbox-field.hbs',
            'select-field.hbs',
            'text-field.hbs',
            'ap-selector.hbs',
            'image-upload.hbs',
            'textarea-field.hbs',
            'traits-field.hbs',
            'single-content.hbs',
            'description-tab.hbs',
            'details-tab.hbs'
        ];

        for (const partial of requiredPartials) {
            const partialPath = path.join(PROJECT_ROOT, 'templates/shared/partials', partial);
            expect(fs.existsSync(partialPath)).toBe(true);
        }
    });

    test('template registration list includes image-upload partial', () => {
        const initManagerPath = path.join(PROJECT_ROOT, 'scripts/utils/initialization-manager.ts');
        const content = fs.readFileSync(initManagerPath, 'utf8');
        
        // Verify image-upload is registered in template paths
        expect(content).toContain('"systems/avant/templates/shared/partials/image-upload.hbs"');
    });

    test('talent and augment templates use full system paths', () => {
        const talentTemplatePath = path.join(PROJECT_ROOT, 'templates/item/item-talent-new.html');
        const augmentTemplatePath = path.join(PROJECT_ROOT, 'templates/item/item-augment-new.html');
        
        // Verify both templates exist
        expect(fs.existsSync(talentTemplatePath)).toBe(true);
        expect(fs.existsSync(augmentTemplatePath)).toBe(true);
        
        // Verify they use full system paths for partials
        const talentContent = fs.readFileSync(talentTemplatePath, 'utf8');
        const augmentContent = fs.readFileSync(augmentTemplatePath, 'utf8');
        
        // Should contain full system path references
        expect(talentContent).toContain('"systems/avant/templates/shared/partials/image-upload"');
        expect(augmentContent).toContain('"systems/avant/templates/shared/partials/image-upload"');
        
        // Should NOT contain short path references
        expect(talentContent).not.toContain('{{> shared/partials/image-upload');
        expect(augmentContent).not.toContain('{{> shared/partials/image-upload');
    });

    test('no template uses deprecated short partial paths', () => {
        const templateDir = path.join(PROJECT_ROOT, 'templates');
        const templateFiles = fs.readdirSync(templateDir, { recursive: true })
            .filter(file => file.endsWith('.html') || file.endsWith('.hbs'))
            .map(file => path.join(templateDir, file));

        for (const templateFile of templateFiles) {
            if (fs.statSync(templateFile).isFile()) {
                const content = fs.readFileSync(templateFile, 'utf8');
                
                // Check for deprecated short path usage
                const shortPathPattern = /\{\{\>\s*shared\/partials\//g;
                const matches = content.match(shortPathPattern);
                
                if (matches) {
                    const relativePath = path.relative(PROJECT_ROOT, templateFile);
                    throw new Error(
                        `Template ${relativePath} uses deprecated short paths for partials. ` +
                        `Found ${matches.length} instances. Use full system paths instead: ` +
                        `"systems/avant/templates/shared/partials/..."`
                    );
                }
            }
        }
    });
}); 