#!/usr/bin/env node
/**
 * @fileoverview Toggle Stylesheet Script
 * @description Foundry VTT macro to toggle between production and sandbox CSS
 * @version 1.0.0
 * @author Avant Development Team
 */

/* ==================================================
   FOUNDRY VTT MACRO CODE
   ================================================== */

const FOUNDRY_MACRO = `
// Avant VTT Stylesheet Toggle Macro
// This macro toggles between production and sandbox CSS in Foundry VTT
// Usage: Run this macro in the Foundry console or as a macro

(function() {
  const PRODUCTION_CSS = 'systems/avant/styles/avant.css';
  const SANDBOX_CSS = 'systems/avant/styles/avant-sandbox.css';
  
  // Find the current stylesheet link - try multiple methods
  let link = document.querySelector('link[href*="avant.css"], link[href*="avant-sandbox.css"]');
  
  if (!link) {
    // Fallback: look for any link with 'avant' in the href
    link = document.querySelector('link[href*="avant"]');
  }
  
  if (!link) {
    ui.notifications.error('Avant: Could not find stylesheet link. Is the Avant system loaded?');
    console.error('Available stylesheets:', Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href));
    return;
  }
  
  // Determine current and new stylesheet
  const currentHref = link.getAttribute('href');
  const isUsingSandbox = currentHref.includes('avant-sandbox.css');
  const newHref = isUsingSandbox ? PRODUCTION_CSS : SANDBOX_CSS;
  const newMode = isUsingSandbox ? 'Production' : 'Sandbox';
  
  // Update the stylesheet
  link.setAttribute('href', newHref);
  
  // Add ID for future reference
  link.setAttribute('id', 'avant-system-css');
  
  // Show notification
  ui.notifications.info(\`Avant: Switched to \${newMode} CSS (\${newHref.split('/').pop()})\`);
  
  // Log for debugging
  console.log('Avant Stylesheet Toggle:', {
    from: currentHref,
    to: newHref,
    mode: newMode,
    element: link
  });
  
  // Trigger a small visual feedback
  document.body.style.transition = 'filter 0.1s ease';
  document.body.style.filter = 'brightness(1.1)';
  setTimeout(() => {
    document.body.style.filter = '';
    setTimeout(() => document.body.style.transition = '', 100);
  }, 100);
})();
`;

/* ==================================================
   BROWSER BOOKMARKLET CODE
   ================================================== */

const BOOKMARKLET_CODE = `
javascript:(function() {
  const PRODUCTION_CSS = 'systems/avant/styles/avant.css';
  const SANDBOX_CSS = 'systems/avant/styles/avant-sandbox.css';
  
  let link = document.querySelector('link[href*="avant.css"], link[href*="avant-sandbox.css"]');
  if (!link) {
    link = document.querySelector('link[href*="avant"]');
  }
  
  if (!link) {
    alert('Avant stylesheet not found');
    console.log('Available stylesheets:', Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href));
    return;
  }
  
  const currentHref = link.getAttribute('href');
  const isUsingSandbox = currentHref.includes('avant-sandbox.css');
  const newHref = isUsingSandbox ? PRODUCTION_CSS : SANDBOX_CSS;
  const mode = isUsingSandbox ? 'Production' : 'Sandbox';
  
  link.setAttribute('href', newHref);
  console.log('Avant: Switched to ' + mode + ' CSS (' + newHref.split('/').pop() + ')');
})();
`;

/* ==================================================
   UTILITY FUNCTIONS
   ================================================== */

function generateMacroFile() {
  const macroContent = `
# Avant VTT Stylesheet Toggle Macro

## For Foundry VTT Console

Copy and paste this code into the Foundry VTT console:

\`\`\`javascript
${FOUNDRY_MACRO}
\`\`\`

## For Browser Bookmarklet

Create a bookmark with this URL:

\`\`\`
${BOOKMARKLET_CODE}
\`\`\`

## Usage

1. **In Foundry VTT**: Run the macro above in the console or save it as a macro
2. **In Browser**: Use the bookmarklet when viewing the styleguide
3. **Toggle Effect**: Switches between production (\`avant.css\`) and sandbox (\`avant-sandbox.css\`)

## Notes

- The macro will show a notification when the stylesheet is toggled
- Both methods work in real-time without requiring a page refresh
- Use this for testing style changes between production and sandbox versions
`;

  return macroContent;
}

function printMacro() {
  console.log('🎨 Avant VTT Stylesheet Toggle');
  console.log('=====================================');
  console.log('');
  console.log('Copy this macro code into Foundry VTT console:');
  console.log('');
  console.log(FOUNDRY_MACRO);
  console.log('');
  console.log('Or use this bookmarklet in your browser:');
  console.log('');
  console.log(BOOKMARKLET_CODE);
  console.log('');
}

/* ==================================================
   MAIN EXECUTION
   ================================================== */

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const fs = await import('fs');
    const path = await import('path');

    // Check command line arguments
    const args = process.argv.slice(2);

    if (args.includes('--print')) {
      printMacro();
    } else if (args.includes('--save')) {
      const macroPath = 'styleguide/stylesheet-toggle-macro.md';
      const macroContent = generateMacroFile();

      fs.default.writeFileSync(macroPath, macroContent);
      console.log(`✅ Macro saved to: ${macroPath}`);
    } else {
      console.log('Usage:');
      console.log('  node scripts/toggle-stylesheet.js --print   # Print macro to console');
      console.log('  node scripts/toggle-stylesheet.js --save    # Save macro to file');
    }
  })();
}

export {
  FOUNDRY_MACRO,
  BOOKMARKLET_CODE,
  generateMacroFile
};