/**
 * @fileoverview Styleguide Integration Tests
 * @description Tests for the static styleguide generation system
 * @version 1.0.0
 * @author Avant Development Team
 */

import fs from 'fs';
import path from 'path';
import { buildStyleguide, CONFIG } from '../../scripts/build-styleguide.js';

describe('Styleguide Integration Tests', () => {
  const styleguideDir = CONFIG.styleguideDir;
  
  beforeAll(async () => {
    // Clean up any existing styleguide
    if (fs.existsSync(styleguideDir)) {
      fs.rmSync(styleguideDir, { recursive: true, force: true });
    }
  });
  
  afterAll(() => {
    // Clean up generated files
    if (fs.existsSync(styleguideDir)) {
      fs.rmSync(styleguideDir, { recursive: true, force: true });
    }
  });
  
  describe('Build Process', () => {
    it('should build styleguide without errors', async () => {
      expect(async () => {
        await buildStyleguide();
      }).not.toThrow();
    });
    
    it('should create styleguide directory', async () => {
      await buildStyleguide();
      expect(fs.existsSync(styleguideDir)).toBe(true);
    });
    
    it('should create styles directory', async () => {
      await buildStyleguide();
      const stylesDir = path.join(styleguideDir, 'styles');
      expect(fs.existsSync(stylesDir)).toBe(true);
    });
  });
  
  describe('Generated Files', () => {
    beforeAll(async () => {
      await buildStyleguide();
    });
    
    it('should generate index.html', () => {
      const indexPath = path.join(styleguideDir, 'index.html');
      expect(fs.existsSync(indexPath)).toBe(true);
      
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      expect(indexContent).toContain('<title>Avant VTT - Style Guide</title>');
      expect(indexContent).toContain('Actor Sheet');
      expect(indexContent).toContain('Item Sheet');
    });
    
    it('should generate template snapshots', () => {
      CONFIG.templates.forEach(template => {
        const templatePath = path.join(styleguideDir, template.output);
        expect(fs.existsSync(templatePath)).toBe(true);
        
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        expect(templateContent).toContain('<!DOCTYPE html>');
        expect(templateContent).toContain(template.title);
      });
    });
    
    it('should copy CSS files', () => {
      CONFIG.stylesheets.forEach(stylesheet => {
        const cssPath = path.join(styleguideDir, stylesheet.output);
        
        if (fs.existsSync(stylesheet.source)) {
          expect(fs.existsSync(cssPath)).toBe(true);
          
          const cssContent = fs.readFileSync(cssPath, 'utf8');
          expect(cssContent.length).toBeGreaterThan(1000); // Should have substantial content
        }
      });
    });
  });
  
  describe('Content Validation', () => {
    beforeAll(async () => {
      await buildStyleguide();
    });
    
    it('should not contain Handlebars syntax in templates', () => {
      CONFIG.templates.forEach(template => {
        const templatePath = path.join(styleguideDir, template.output);
        
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          
          // Should not contain Handlebars expressions
          expect(templateContent).not.toMatch(/\{\{[^}]+\}\}/);
          
          // Should not contain Handlebars comments
          expect(templateContent).not.toMatch(/\{\{!--[\s\S]*?--\}\}/);
          
          // Should not contain block helpers
          expect(templateContent).not.toMatch(/\{\{#[^}]*\}\}/);
          expect(templateContent).not.toMatch(/\{\{\/[^}]*\}\}/);
        }
      });
    });
    
    it('should have valid HTML structure', () => {
      CONFIG.templates.forEach(template => {
        const templatePath = path.join(styleguideDir, template.output);
        
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          
          // Should have basic HTML structure
          expect(templateContent).toContain('<!DOCTYPE html>');
          expect(templateContent).toContain('<html');
          expect(templateContent).toContain('<head>');
          expect(templateContent).toContain('<body>');
          expect(templateContent).toContain('</html>');
        }
      });
    });
    
    it('should reference correct CSS files', () => {
      CONFIG.templates.forEach(template => {
        const templatePath = path.join(styleguideDir, template.output);
        
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          
          // Should reference sandbox CSS by default
          expect(templateContent).toContain('avant-sandbox.css');
          
          // Should not reference non-existent files
          expect(templateContent).not.toContain('missing.css');
        }
      });
    });
  });
  
  describe('Interactive Features', () => {
    beforeAll(async () => {
      await buildStyleguide();
    });
    
    it('should include CSS toggle functionality', () => {
      const indexPath = path.join(styleguideDir, 'index.html');
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      expect(indexContent).toContain('toggleCSS');
      expect(indexContent).toContain('Toggle CSS');
    });
    
    it('should include navigation in template pages', () => {
      CONFIG.templates.forEach(template => {
        const templatePath = path.join(styleguideDir, template.output);
        
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          
          // Should have back navigation
          expect(templateContent).toContain('Back to Style Guide');
          
          // Should have controls
          expect(templateContent).toContain('styleguide-controls');
        }
      });
    });
  });
  
  describe('CSS Validation', () => {
    beforeAll(async () => {
      await buildStyleguide();
    });
    
    it('should have production CSS with reasonable size', () => {
      const productionCssPath = path.join(styleguideDir, 'styles', 'avant.css');
      
      if (fs.existsSync(productionCssPath)) {
        const cssContent = fs.readFileSync(productionCssPath, 'utf8');
        const cssSize = Buffer.byteLength(cssContent, 'utf8');
        
        // Should be substantial but not too large
        expect(cssSize).toBeGreaterThan(10000); // At least 10KB
        expect(cssSize).toBeLessThan(500000); // Less than 500KB
      }
    });
    
    it('should have sandbox CSS with reasonable size', () => {
      const sandboxCssPath = path.join(styleguideDir, 'styles', 'avant-sandbox.css');
      
      if (fs.existsSync(sandboxCssPath)) {
        const cssContent = fs.readFileSync(sandboxCssPath, 'utf8');
        const cssSize = Buffer.byteLength(cssContent, 'utf8');
        
        // Should be substantial but not too large
        expect(cssSize).toBeGreaterThan(10000); // At least 10KB
        expect(cssSize).toBeLessThan(500000); // Less than 500KB
      }
    });
  });
  
  describe('Error Handling', () => {
    it('should handle missing templates gracefully', async () => {
      // Temporarily modify CONFIG to include non-existent template
      const originalTemplates = CONFIG.templates;
      CONFIG.templates = [
        ...originalTemplates,
        {
          source: 'templates/non-existent.html',
          output: 'non-existent.html',
          title: 'Non-existent Template'
        }
      ];
      
      expect(async () => {
        await buildStyleguide();
      }).not.toThrow();
      
      // Restore original templates
      CONFIG.templates = originalTemplates;
    });
    
    it('should handle missing source CSS gracefully', async () => {
      // Temporarily modify CONFIG to include non-existent CSS
      const originalStylesheets = CONFIG.stylesheets;
      CONFIG.stylesheets = [
        ...originalStylesheets,
        {
          source: 'dist/styles/non-existent.css',
          output: 'styles/non-existent.css'
        }
      ];
      
      expect(async () => {
        await buildStyleguide();
      }).not.toThrow();
      
      // Restore original stylesheets
      CONFIG.stylesheets = originalStylesheets;
    });
  });
});