#!/usr/bin/env node

/**
 * @fileoverview CI Path Validation Script
 * @version 1.0.0 - FoundryVTT v13 Compatible
 * @description Validates that all paths referenced in dist/system.json actually exist
 * @author Avant VTT Team
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validate that all paths in system.json exist in dist/
 * @returns {Promise<void>}
 */
async function validatePaths() {
  try {
    console.log('🔍 CI Path Validation: Starting...');
    
    const projectRoot = path.resolve(__dirname, '..');
    const distPath = path.join(projectRoot, 'dist');
    const systemJsonPath = path.join(distPath, 'system.json');
    
    // Check if dist exists
    if (!fs.existsSync(distPath)) {
      console.error('❌ CI Path Validation: dist/ directory does not exist');
      console.error('💡 Run "npm run build" first to create dist package');
      process.exit(1);
    }
    
    // Check if system.json exists in dist
    if (!fs.existsSync(systemJsonPath)) {
      console.error('❌ CI Path Validation: dist/system.json does not exist');
      console.error('💡 Build process did not copy system.json to dist/');
      process.exit(1);
    }
    
    console.log(`📁 Validating paths in: ${systemJsonPath}`);
    
    // Read system.json from dist
    const systemJson = JSON.parse(fs.readFileSync(systemJsonPath, 'utf8'));
    console.log(`📋 System: ${systemJson.title} v${systemJson.version}`);
    
    const pathsToValidate = [];
    let validationErrors = [];
    
    // Collect all paths that need validation
    
    // 1. ES modules
    if (systemJson.esmodules && Array.isArray(systemJson.esmodules)) {
      systemJson.esmodules.forEach(modulePath => {
        pathsToValidate.push({
          type: 'esmodule',
          path: modulePath,
          fullPath: path.join(distPath, modulePath)
        });
      });
    }
    
    // 2. Styles
    if (systemJson.styles && Array.isArray(systemJson.styles)) {
      systemJson.styles.forEach(stylePath => {
        pathsToValidate.push({
          type: 'style',
          path: stylePath,
          fullPath: path.join(distPath, stylePath)
        });
      });
    }
    
    // 3. Languages
    if (systemJson.languages && Array.isArray(systemJson.languages)) {
      systemJson.languages.forEach(lang => {
        if (lang.path) {
          pathsToValidate.push({
            type: 'language',
            path: lang.path,
            fullPath: path.join(distPath, lang.path)
          });
        }
      });
    }
    
    // 4. Compendium packs
    if (systemJson.packs && Array.isArray(systemJson.packs)) {
      systemJson.packs.forEach(pack => {
        if (pack.path) {
          // Handle both .db files and directory paths for v13 LevelDB
          let packPath = pack.path;
          if (packPath.startsWith('./')) {
            packPath = packPath.substring(2);
          }
          
          // Check for actual .db file first (what gets built), then directory
          const dbFilePath = path.join(distPath, packPath + '.db');
          const dirPath = path.join(distPath, packPath);
          
          // Prefer .db file if it exists, otherwise check for directory
          if (fs.existsSync(dbFilePath)) {
            pathsToValidate.push({
              type: 'pack',
              path: pack.path,
              name: pack.name,
              fullPath: dbFilePath,
              actualFormat: '.db file'
            });
          } else {
            pathsToValidate.push({
              type: 'pack',
              path: pack.path,
              name: pack.name,
              fullPath: dirPath,
              actualFormat: 'directory'
            });
          }
        }
      });
    }
    
    console.log(`🔍 Validating ${pathsToValidate.length} paths...`);
    
    // Validate each path
    pathsToValidate.forEach(item => {
      const formatInfo = item.actualFormat ? ` (${item.actualFormat})` : '';
      console.log(`  📄 Checking ${item.type}: ${item.path}${formatInfo}`);
      
      if (!fs.existsSync(item.fullPath)) {
        const error = `❌ Missing ${item.type}: ${item.path}${formatInfo}`;
        console.error(`    ${error}`);
        validationErrors.push(error);
      } else {
        console.log(`    ✅ Found: ${item.path}${formatInfo}`);
        
        // Additional validation for specific file types
        if (item.type === 'pack') {
          const stat = fs.statSync(item.fullPath);
          
          if (item.fullPath.endsWith('.db')) {
            // Validate .db files have content
            if (stat.size === 0) {
              const error = `❌ Empty pack file: ${item.path}`;
              console.error(`    ${error}`);
              validationErrors.push(error);
            } else {
              console.log(`    📦 Pack size: ${stat.size} bytes`);
            }
          } else if (stat.isDirectory()) {
            // For LevelDB directories, check if they contain files
            const dirContents = fs.readdirSync(item.fullPath);
            if (dirContents.length === 0) {
              const error = `❌ Empty pack directory: ${item.path}`;
              console.error(`    ${error}`);
              validationErrors.push(error);
            } else {
              console.log(`    📂 Pack directory contains ${dirContents.length} files`);
            }
          }
        }
      }
    });
    
    // Report results
    if (validationErrors.length === 0) {
      console.log('✅ CI Path Validation: All paths valid');
      console.log(`📊 Validated ${pathsToValidate.length} paths successfully`);
    } else {
      console.error(`❌ CI Path Validation: ${validationErrors.length} errors found`);
      validationErrors.forEach(error => console.error(error));
      console.error('💡 Fix missing files and run build again');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ CI Path Validation failed:', error.message);
    console.error('🔧 Debug info:', error);
    process.exit(1);
  }
}

// Run validation if script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validatePaths();
}

export { validatePaths }; 