#!/usr/bin/env node

/**
 * Fix Pack Types - Corrects type mismatches and missing system fields
 * 
 * This script fixes:
 * 1. Type mismatches: 'trait' → 'avant-trait', 'talent' → 'avant-talent', 'augment' → 'avant-augment'
 * 2. Missing system fields in macros
 */

import fs from 'fs';
import path from 'path';

const PACK_DIR = './packs';

// Type mappings
const TYPE_MAPPINGS = {
    'trait': 'avant-trait',
    'talent': 'avant-talent',
    'augment': 'avant-augment',
    'script': 'avant-macro'  // Fix for macros
};

/**
 * Fix item types in JSON files
 */
function fixItemTypes(filePath, data) {
    let fixed = false;

    // Handle array of items
    if (Array.isArray(data)) {
        data.forEach(item => {
            if (item.type && TYPE_MAPPINGS[item.type]) {
                console.log(`🔧 Fixing type: ${item.type} → ${TYPE_MAPPINGS[item.type]} in ${path.basename(filePath)}`);
                item.type = TYPE_MAPPINGS[item.type];
                fixed = true;
            }
        });
    }
    // Handle single item
    else if (data.type && TYPE_MAPPINGS[data.type]) {
        console.log(`🔧 Fixing type: ${data.type} → ${TYPE_MAPPINGS[data.type]} in ${path.basename(filePath)}`);
        data.type = TYPE_MAPPINGS[data.type];
        fixed = true;
    }

    return fixed;
}

/**
 * Fix macro system fields
 */
function fixMacroSystem(filePath, data) {
    let fixed = false;

    // If it's a macro file and missing system field
    if ((data.type === 'script' || data.type === 'avant-macro') && !data.system) {
        console.log(`🔧 Adding system field to macro: ${path.basename(filePath)}`);
        data.system = {
            description: data.flags?.avant?.description || `Macro: ${data.name}`,
            version: data.flags?.avant?.version || "1.0.0",
            category: data.flags?.avant?.category || "utility"
        };
        fixed = true;
    }

    return fixed;
}

/**
 * Process all JSON files in packs directory
 */
function processPackFiles() {
    console.log('🚀 Starting pack type fixes...');

    const packDirs = fs.readdirSync(PACK_DIR).filter(dir => {
        const fullPath = path.join(PACK_DIR, dir);
        return fs.statSync(fullPath).isDirectory();
    });

    let totalFixed = 0;

    for (const packDir of packDirs) {
        const packPath = path.join(PACK_DIR, packDir);
        const files = fs.readdirSync(packPath).filter(file => file.endsWith('.json'));

        console.log(`📁 Processing pack: ${packDir} (${files.length} files)`);

        for (const file of files) {
            const filePath = path.join(packPath, file);

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);

                let fixed = false;

                // Fix item types
                if (fixItemTypes(filePath, data)) {
                    fixed = true;
                }

                // Fix macro system fields
                if (fixMacroSystem(filePath, data)) {
                    fixed = true;
                }

                // Write back if changes were made
                if (fixed) {
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                    totalFixed++;
                    console.log(`✅ Fixed: ${file}`);
                }

            } catch (error) {
                console.error(`❌ Error processing ${file}:`, error.message);
            }
        }
    }

    console.log(`🎉 Completed! Fixed ${totalFixed} files.`);
}

// Run the fixes
processPackFiles(); 