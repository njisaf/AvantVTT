#!/usr/bin/env node
/**
 * @fileoverview CSS Comparison Script
 * @description Compare CSS output from avant.scss vs avant-sandbox.scss to identify differences
 * @version 1.0.0
 * @author Avant Development Team
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Build CSS from a specific SCSS file using npm scripts
 */
async function buildCSS(inputFile, outputFile) {
  console.log(`📦 Building ${inputFile} → ${outputFile}`);
  
  try {
    // Use npx to run sass with the project's sass installation
    const command = `npx sass ${inputFile} ${outputFile} --style=expanded --no-source-map`;
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      console.warn(`⚠️  Warnings for ${inputFile}:`);
      console.warn(stderr);
    }
    
    console.log(`✅ Built ${outputFile}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to build ${inputFile}:`);
    console.error(error.message);
    return false;
  }
}

/**
 * Parse CSS into rules for comparison
 */
function parseCSS(cssContent) {
  const rules = new Map();
  
  // Remove comments and normalize whitespace
  const cleaned = cssContent
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Split into rules - simple approach for comparison
  const ruleMatches = cleaned.match(/[^{}]+\{[^{}]*\}/g) || [];
  
  ruleMatches.forEach(rule => {
    const parts = rule.split('{');
    if (parts.length === 2) {
      const selector = parts[0].trim();
      const declarations = parts[1].replace('}', '').trim();
      
      // Store rule with normalized selector
      const normalizedSelector = selector.replace(/\s+/g, ' ').trim();
      rules.set(normalizedSelector, declarations);
    }
  });
  
  return rules;
}

/**
 * Compare two CSS rule sets
 */
function compareCSS(originalRules, sandboxRules) {
  const differences = {
    missing: new Map(),
    different: new Map(),
    extra: new Map()
  };
  
  // Find missing rules
  for (const [selector, declarations] of originalRules) {
    if (!sandboxRules.has(selector)) {
      differences.missing.set(selector, declarations);
    } else if (sandboxRules.get(selector) !== declarations) {
      differences.different.set(selector, {
        original: declarations,
        sandbox: sandboxRules.get(selector)
      });
    }
  }
  
  // Find extra rules in sandbox
  for (const [selector, declarations] of sandboxRules) {
    if (!originalRules.has(selector)) {
      differences.extra.set(selector, declarations);
    }
  }
  
  return differences;
}

/**
 * Generate comparison report
 */
function generateReport(differences, originalSize, sandboxSize) {
  const report = [];
  
  report.push('# CSS Comparison Report');
  report.push('');
  report.push(`**Original CSS Size**: ${originalSize} bytes`);
  report.push(`**Sandbox CSS Size**: ${sandboxSize} bytes`);
  report.push(`**Size Difference**: ${sandboxSize - originalSize} bytes`);
  report.push('');
  
  // Missing rules
  if (differences.missing.size > 0) {
    report.push(`## Missing Rules in Sandbox (${differences.missing.size})`);
    report.push('');
    
    // Show ALL missing rules
    let count = 0;
    for (const [selector, declarations] of differences.missing) {
      report.push(`### ${selector}`);
      report.push('```css');
      report.push(`${selector} {`);
      report.push(`  ${declarations}`);
      report.push('}');
      report.push('```');
      report.push('');
      count++;
    }
  }
  
  // Different rules
  if (differences.different.size > 0) {
    report.push(`## Different Rules (${differences.different.size})`);
    report.push('');
    
    // Show ALL different rules
    let count = 0;
    for (const [selector, diff] of differences.different) {
      report.push(`### ${selector}`);
      report.push('**Original:**');
      report.push('```css');
      report.push(`${selector} { ${diff.original} }`);
      report.push('```');
      report.push('**Sandbox:**');
      report.push('```css');
      report.push(`${selector} { ${diff.sandbox} }`);
      report.push('```');
      report.push('');
      count++;
    }
  }
  
  // Extra rules
  if (differences.extra.size > 0) {
    report.push(`## Extra Rules in Sandbox (${differences.extra.size})`);
    report.push('');
    
    // Show ALL extra rules
    let count = 0;
    for (const [selector, declarations] of differences.extra) {
      report.push(`### ${selector}`);
      report.push('```css');
      report.push(`${selector} { ${declarations} }`);
      report.push('```');
      report.push('');
      count++;
    }
  }
  
  return report.join('\n');
}

/**
 * Main comparison function
 */
async function main() {
  console.log('🔍 CSS Comparison Tool');
  console.log('=====================');
  
  const tempDir = 'temp-css-comparison';
  const originalCSS = path.join(tempDir, 'avant-original.css');
  const sandboxCSS = path.join(tempDir, 'avant-sandbox.css');
  const reportFile = path.join(tempDir, 'comparison-report.md');
  
  // Create temp directory
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  try {
    // Build both CSS files
    const originalSuccess = await buildCSS('styles/avant-backup.scss', originalCSS);
    const sandboxSuccess = await buildCSS('styles/avant.scss', sandboxCSS);
    
    if (!originalSuccess || !sandboxSuccess) {
      console.error('❌ Failed to build one or both CSS files');
      return;
    }
    
    // Read and parse CSS files
    console.log('📖 Reading CSS files...');
    const originalContent = fs.readFileSync(originalCSS, 'utf8');
    const sandboxContent = fs.readFileSync(sandboxCSS, 'utf8');
    
    console.log('🔍 Parsing CSS rules...');
    const originalRules = parseCSS(originalContent);
    const sandboxRules = parseCSS(sandboxContent);
    
    console.log(`📊 Original CSS: ${originalRules.size} rules`);
    console.log(`📊 Sandbox CSS: ${sandboxRules.size} rules`);
    
    // Compare CSS
    console.log('⚖️  Comparing CSS...');
    const differences = compareCSS(originalRules, sandboxRules);
    
    // Generate report
    console.log('📝 Generating report...');
    const report = generateReport(differences, originalContent.length, sandboxContent.length);
    
    // Write report
    fs.writeFileSync(reportFile, report);
    
    // Summary
    console.log('\n📋 COMPARISON SUMMARY');
    console.log('====================');
    console.log(`📁 Original rules: ${originalRules.size}`);
    console.log(`📁 Sandbox rules: ${sandboxRules.size}`);
    console.log(`❌ Missing rules: ${differences.missing.size}`);
    console.log(`⚠️  Different rules: ${differences.different.size}`);
    console.log(`➕ Extra rules: ${differences.extra.size}`);
    console.log(`📄 Report saved to: ${reportFile}`);
    
    // Show critical missing selectors
    if (differences.missing.size > 0) {
      console.log('\n🚨 CRITICAL MISSING SELECTORS (first 10):');
      let count = 0;
      for (const [selector] of differences.missing) {
        if (count >= 10) break;
        console.log(`   ${selector}`);
        count++;
      }
    }
    
  } catch (error) {
    console.error('❌ Error during comparison:', error.message);
  }
}

// Run the comparison
main().catch(console.error);