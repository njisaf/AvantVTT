#!/usr/bin/env node
/**
 * @fileoverview Build Styleguide Script
 * @description Generates static HTML styleguide from templates and compiled CSS
 * @version 1.0.0
 * @author Avant Development Team
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/* ==================================================
   CONFIGURATION
   ================================================== */

const CONFIG = {
  // Source directories
  templatesDir: 'templates',
  stylesDir: 'styles',
  distDir: 'dist',
  
  // Output directory
  styleguideDir: 'styleguide',
  
  // Templates to process
  templates: [
    {
      source: 'templates/actor-sheet.html',
      output: 'actor-sheet.html',
      title: 'Actor Sheet'
    },
    {
      source: 'templates/item-sheet.html',
      output: 'item-sheet.html',
      title: 'Item Sheet'
    }
  ],
  
  // CSS files to copy
  stylesheets: [
    {
      source: 'dist/styles/avant.css',
      output: 'styles/avant.css'
    },
    {
      source: 'dist/styles/avant-sandbox.css',
      output: 'styles/avant-sandbox.css'
    }
  ]
};

/* ==================================================
   UTILITY FUNCTIONS
   ================================================== */

/**
 * Ensure directory exists, create if not
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Clean Handlebars syntax from HTML and generate mock content
 */
function sanitizeHandlebars(html) {
  // First, handle partials with mock content
  html = html.replace(/\{\{>\s*"([^"]*)"([^}]*)\}\}/g, (match, partialPath, context) => {
    const partialName = partialPath.split('/').pop();
    
    if (partialName === 'avant-item-header') {
      return `
        <header class="sheet-header">
          <div class="header-main">
            <div class="form-group--image-upload">
              <div class="image-upload">
                <img class="image-upload__img" src="icons/weapons/guns/rifle-plasma-blue.webp" alt="Plasma Rifle" width="48" height="48">
                <div class="image-upload__overlay">
                  <i class="fas fa-upload" aria-hidden="true"></i>
                </div>
              </div>
            </div>
            <div class="form-group--text-field">
              <label class="form-label">Name</label>
              <input class="form-input" type="text" value="Plasma Rifle" placeholder="Item Name">
            </div>
          </div>
          <div class="ap-selector-row">
            <div class="form-group">
              <label class="form-label">AP Cost</label>
              <div class="ap-selector">
                <span class="ap-dot active"></span>
                <span class="ap-dot active"></span>
                <span class="ap-dot"></span>
                <span class="ap-dot"></span>
              </div>
            </div>
          </div>
        </header>
      `;
    }
    
    if (partialName === 'item-body') {
      return `
        <section class="sheet-body">
          <div class="tab active">
            <div class="row-container full-width">
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-textarea" rows="4" placeholder="Describe this item...">A high-tech plasma rifle featuring advanced energy discharge technology. Popular among corporate security forces and mercenaries for its stopping power and reliability in urban combat scenarios.</textarea>
              </div>
            </div>
            
            <div class="row-container">
              <div class="form-group">
                <label class="form-label">Damage</label>
                <input class="form-input" type="text" value="2d8+3">
              </div>
              <div class="form-group">
                <label class="form-label">Range</label>
                <input class="form-input" type="text" value="Long">
              </div>
            </div>
            
            <div class="row-container">
              <div class="form-group">
                <label class="form-label">Weight</label>
                <input class="form-input" type="number" value="4.5">
              </div>
              <div class="form-group">
                <label class="form-label">Cost</label>
                <input class="form-input" type="number" value="2500">
              </div>
            </div>
            
            <div class="row-container full-width">
              <div class="form-group">
                <label class="form-label">Traits</label>
                <div class="trait-chip-input">
                  <div class="trait-chips">
                    <span class="trait-chip" style="background-color: #ff6b6b; color: white;">
                      <span class="trait-name">Energy</span>
                      <button class="trait-remove">×</button>
                    </span>
                    <span class="trait-chip" style="background-color: #4ecdc4; color: white;">
                      <span class="trait-name">Military</span>
                      <button class="trait-remove">×</button>
                    </span>
                    <span class="trait-chip" style="background-color: #45b7d1; color: white;">
                      <span class="trait-name">Rare</span>
                      <button class="trait-remove">×</button>
                    </span>
                  </div>
                  <div class="trait-input-container">
                    <input class="trait-autocomplete" type="text" placeholder="Add trait...">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      `;
    }
    
    // Default partial replacement
    return `<div class="partial-placeholder"><!-- ${partialName} partial --></div>`;
  });
  
  // Replace remaining Handlebars expressions with mock data
  html = html
    // Handle common expressions
    .replace(/\{\{\s*cssClass\s*\}\}/g, 'application sheet avant item')
    .replace(/\{\{\s*item\.type\s*\}\}/g, 'weapon')
    .replace(/\{\{\s*item\.name\s*\}\}/g, 'Plasma Rifle')
    .replace(/\{\{\s*item\.img\s*\}\}/g, 'icons/weapons/guns/rifle-plasma-blue.webp')
    
    // Remove Handlebars comments (keep these)
    .replace(/\{\{!--[\s\S]*?--\}\}/g, '')
    
    // Remove remaining Handlebars expressions
    .replace(/\{\{[^}]*\}\}/g, '')
    
    // Remove Handlebars block helpers
    .replace(/\{\{#[^}]*\}\}/g, '')
    .replace(/\{\{\/[^}]*\}\}/g, '')
    
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
  
  return html;
}

/**
 * Generate mock data for templates
 */
function generateMockData() {
  return {
    // Actor data
    actor: {
      name: 'Alex Chen',
      type: 'character',
      img: 'icons/svg/mystery-man.svg',
      system: {
        abilities: {
          might: { value: 12 },
          grace: { value: 14 },
          intellect: { value: 16 },
          focus: { value: 10 }
        },
        health: { value: 25, max: 30 },
        powerPoints: { value: 8, max: 12 }
      }
    },
    
    // Item data
    item: {
      name: 'Plasma Rifle',
      type: 'weapon',
      img: 'icons/weapons/guns/rifle-plasma-blue.webp',
      system: {
        damage: '2d8+3',
        range: 'Long',
        weight: 4.5,
        cost: 2500,
        traits: ['Energy', 'Military', 'Rare']
      }
    },
    
    // UI state
    cssClass: 'avant sheet actor character',
    editable: true,
    isGM: false,
    
    // Helper functions
    helpers: {
      titleCase: (str) => str.charAt(0).toUpperCase() + str.slice(1),
      concat: (...args) => args.slice(0, -1).join('')
    }
  };
}

/**
 * Process template with mock data
 */
function processTemplate(templatePath, mockData) {
  if (!fs.existsSync(templatePath)) {
    console.warn(`⚠️  Template not found: ${templatePath}`);
    return `<div class="error">Template not found: ${templatePath}</div>`;
  }
  
  let html = fs.readFileSync(templatePath, 'utf8');
  
  // Inject mock data (simplified)
  html = html.replace(/\{\{actor\.name\}\}/g, mockData.actor.name);
  html = html.replace(/\{\{item\.name\}\}/g, mockData.item.name);
  html = html.replace(/\{\{cssClass\}\}/g, mockData.cssClass);
  
  // Clean remaining Handlebars
  html = sanitizeHandlebars(html);
  
  // If this is an item sheet, wrap it in ApplicationV2 structure
  if (templatePath.includes('item-sheet')) {
    html = `<div class="application sheet avant item">
      <div class="window-content">
        ${html}
      </div>
    </div>`;
  }
  
  return html;
}

/**
 * Generate index.html navigation page
 */
function generateIndexHtml(templates) {
  const templateLinks = templates.map(template => {
    return `
      <li class="nav-item">
        <a href="${template.output}" class="nav-link">
          ${template.title}
        </a>
      </li>
    `;
  }).join('');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Avant VTT - Style Guide</title>
  <link rel="stylesheet" href="styles/avant-sandbox.css">
  <style>
    .styleguide-nav {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      background: var(--bg-secondary, #2A2A2A);
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 224, 220, 0.1);
    }
    
    .styleguide-title {
      font-family: 'Orbitron', monospace;
      font-size: 2.5rem;
      color: var(--accent-primary, #00E0DC);
      text-align: center;
      margin-bottom: 1rem;
    }
    
    .styleguide-subtitle {
      text-align: center;
      color: var(--text-secondary, #BFBFBF);
      margin-bottom: 2rem;
    }
    
    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .nav-item {
      margin-bottom: 1rem;
    }
    
    .nav-link {
      display: block;
      padding: 1rem 1.5rem;
      background: var(--bg-tertiary, #333333);
      color: var(--text-primary, #FFFFFF);
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.3s ease;
      font-weight: 600;
    }
    
    .nav-link:hover {
      background: var(--accent-primary, #00E0DC);
      color: var(--color-black-pure, #000000);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 224, 220, 0.3);
    }
    
    .info-box {
      background: rgba(0, 224, 220, 0.1);
      border: 1px solid var(--accent-primary, #00E0DC);
      border-radius: 8px;
      padding: 1rem;
      margin-top: 2rem;
      font-size: 0.9rem;
    }
    
    .css-toggle {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
    }
    
    .css-toggle button {
      background: var(--accent-primary, #00E0DC);
      color: var(--color-black-pure, #000000);
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="css-toggle">
    <button onclick="toggleCSS()">Toggle CSS</button>
  </div>
  
  <div class="styleguide-nav">
    <h1 class="styleguide-title">Avant VTT</h1>
    <p class="styleguide-subtitle">Static Style Guide</p>
    
    <ul class="nav-list">
      ${templateLinks}
    </ul>
    
    <div class="info-box">
      <h3>For Designers:</h3>
      <p>This is a static snapshot of the Avant VTT interface. You can:</p>
      <ul>
        <li>Edit <code>styles/avant-sandbox.css</code> directly</li>
        <li>Use browser DevTools to experiment with styles</li>
        <li>Toggle between production and sandbox CSS using the button above</li>
      </ul>
      <p>See <code>README.md</code> for detailed instructions.</p>
    </div>
  </div>
  
  <script>
    function toggleCSS() {
      const link = document.querySelector('link[href*="avant"]');
      const currentHref = link.getAttribute('href');
      const newHref = currentHref.includes('avant-sandbox.css') 
        ? 'styles/avant.css' 
        : 'styles/avant-sandbox.css';
      
      link.setAttribute('href', newHref);
      
      const button = document.querySelector('.css-toggle button');
      button.textContent = newHref.includes('sandbox') ? 'Use Production CSS' : 'Use Sandbox CSS';
    }
  </script>
</body>
</html>
  `.trim();
}

/**
 * Wrap processed template with full HTML structure
 */
function wrapWithLayout(content, title) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Avant VTT Style Guide</title>
  <link rel="stylesheet" href="styles/avant-sandbox.css">
  <style>
    body {
      padding: 20px;
      background: var(--bg-primary, #1C1C1C);
      color: var(--text-primary, #FFFFFF);
      font-family: 'Exo 2', sans-serif;
    }
    
    .styleguide-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(28, 28, 28, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border-primary, #404040);
      padding: 10px 20px;
      z-index: 1000;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .styleguide-header a {
      color: var(--accent-primary, #00E0DC);
      text-decoration: none;
      font-weight: 600;
    }
    
    .styleguide-header a:hover {
      text-decoration: underline;
    }
    
    .styleguide-controls {
      display: flex;
      gap: 10px;
    }
    
    .styleguide-controls button {
      background: var(--accent-primary, #00E0DC);
      color: var(--color-black-pure, #000000);
      border: none;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    }
    
    .styleguide-content {
      margin-top: 60px;
      max-width: 1200px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .partial-placeholder {
      background: rgba(0, 224, 220, 0.1);
      border: 1px dashed var(--accent-primary, #00E0DC);
      padding: 20px;
      text-align: center;
      color: var(--text-secondary, #BFBFBF);
      font-style: italic;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="styleguide-header">
    <div>
      <a href="index.html">← Back to Style Guide</a>
      <span style="margin-left: 20px; color: var(--text-secondary, #BFBFBF);">${title}</span>
    </div>
    <div class="styleguide-controls">
      <button onclick="toggleCSS()">Toggle CSS</button>
      <button onclick="toggleGrid()">Toggle Grid</button>
    </div>
  </div>
  
  <div class="styleguide-content">
    ${content}
  </div>
  
  <script>
    function toggleCSS() {
      const link = document.querySelector('link[href*="avant"]');
      const currentHref = link.getAttribute('href');
      const newHref = currentHref.includes('avant-sandbox.css') 
        ? 'styles/avant.css' 
        : 'styles/avant-sandbox.css';
      
      link.setAttribute('href', newHref);
      
      const button = event.target;
      button.textContent = newHref.includes('sandbox') ? 'Use Production CSS' : 'Use Sandbox CSS';
    }
    
    function toggleGrid() {
      const gridStyle = document.getElementById('debug-grid');
      if (gridStyle) {
        gridStyle.remove();
      } else {
        const style = document.createElement('style');
        style.id = 'debug-grid';
        style.textContent = \`
          * {
            outline: 1px solid rgba(0, 224, 220, 0.2) !important;
          }
          *:hover {
            outline: 2px solid rgba(0, 224, 220, 0.5) !important;
          }
        \`;
        document.head.appendChild(style);
      }
    }
  </script>
</body>
</html>
  `.trim();
}

/* ==================================================
   MAIN BUILD PROCESS
   ================================================== */

async function buildStyleguide() {
  console.log('🚀 Building Avant VTT Style Guide...');
  
  try {
    // 1. Ensure output directory exists
    ensureDir(CONFIG.styleguideDir);
    ensureDir(path.join(CONFIG.styleguideDir, 'styles'));
    
    // 2. Compile sandbox SCSS if needed
    console.log('📦 Compiling sandbox SCSS...');
    try {
      await execAsync('sass styles/avant-sandbox.scss dist/styles/avant-sandbox.css --style=expanded --source-map');
      console.log('✅ Sandbox SCSS compiled successfully');
    } catch (error) {
      console.warn('⚠️  Sandbox SCSS compilation failed, using existing file if available');
    }
    
    // 3. Copy CSS files
    console.log('📄 Copying stylesheets...');
    for (const stylesheet of CONFIG.stylesheets) {
      const sourcePath = stylesheet.source;
      const outputPath = path.join(CONFIG.styleguideDir, stylesheet.output);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, outputPath);
        console.log(`✅ Copied ${sourcePath} → ${outputPath}`);
      } else {
        console.warn(`⚠️  Source stylesheet not found: ${sourcePath}`);
      }
    }
    
    // 4. Generate mock data
    const mockData = generateMockData();
    
    // 5. Process templates
    console.log('🔄 Processing templates...');
    for (const template of CONFIG.templates) {
      const sourcePath = template.source;
      const outputPath = path.join(CONFIG.styleguideDir, template.output);
      
      if (fs.existsSync(sourcePath)) {
        const processedContent = processTemplate(sourcePath, mockData);
        const wrappedContent = wrapWithLayout(processedContent, template.title);
        
        fs.writeFileSync(outputPath, wrappedContent);
        console.log(`✅ Generated ${template.output}`);
      } else {
        console.warn(`⚠️  Template not found: ${sourcePath}`);
      }
    }
    
    // 6. Generate index.html
    console.log('📝 Generating index.html...');
    const indexContent = generateIndexHtml(CONFIG.templates);
    fs.writeFileSync(path.join(CONFIG.styleguideDir, 'index.html'), indexContent);
    
    // 7. Copy README if it doesn't exist
    const readmePath = path.join(CONFIG.styleguideDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
      console.log('📖 README.md already exists, skipping copy');
    }
    
    console.log('✅ Style guide built successfully!');
    console.log(`📁 Output: ${CONFIG.styleguideDir}/`);
    console.log(`🌐 Open: ${CONFIG.styleguideDir}/index.html`);
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run the build if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildStyleguide();
}

export {
  buildStyleguide,
  CONFIG
};