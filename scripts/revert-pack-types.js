#!/usr/bin/env node

/**
 * Revert Pack Types - Restores original item type names
 * 
 * This script reverts:
 * 1. Type corrections: 'avant-trait' → 'trait', 'avant-talent' → 'talent', 'avant-augment' → 'augment', 'avant-macro' → 'script'
 * 2. Restores original naming as requested by user
 */

import fs from 'fs';
import path from 'path';

const PACK_DIR = './packs';

// Type reversion mappings
const TYPE_REVERT_MAPPINGS = {
    'avant-trait': 'trait',
    'avant-talent': 'talent',
    'avant-augment': 'augment',
    'avant-macro': 'script'
};

/**
 * Revert item types in JSON files
 */
function revertItemTypes(filePath, data) {
    let reverted = false;

    // Handle array of items
    if (Array.isArray(data)) {
        data.forEach(item => {
            if (item.type && TYPE_REVERT_MAPPINGS[item.type]) {
                console.log(`🔄 Reverting type: ${item.type} → ${TYPE_REVERT_MAPPINGS[item.type]} in ${path.basename(filePath)}`);
                item.type = TYPE_REVERT_MAPPINGS[item.type];
                reverted = true;
            }
        });
    }
    // Handle single item
    else if (data.type && TYPE_REVERT_MAPPINGS[data.type]) {
        console.log(`🔄 Reverting type: ${data.type} → ${TYPE_REVERT_MAPPINGS[data.type]} in ${path.basename(filePath)}`);
        data.type = TYPE_REVERT_MAPPINGS[data.type];
        reverted = true;
    }

    return reverted;
}

/**
 * Process all JSON files in packs directory
 */
function processPacksDirectory() {
    if (!fs.existsSync(PACK_DIR)) {
        console.error(`❌ Packs directory not found: ${PACK_DIR}`);
        return;
    }

    const packDirs = fs.readdirSync(PACK_DIR).filter(dir =>
        fs.statSync(path.join(PACK_DIR, dir)).isDirectory()
    );

    console.log(`📦 Processing ${packDirs.length} pack directories...`);

    for (const packDir of packDirs) {
        const packPath = path.join(PACK_DIR, packDir);
        const files = fs.readdirSync(packPath).filter(file => file.endsWith('.json'));

        console.log(`\n📁 Processing pack: ${packDir}`);

        for (const file of files) {
            const filePath = path.join(packPath, file);

            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

                if (revertItemTypes(filePath, data)) {
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                    console.log(`✅ Reverted types in ${file}`);
                }
            } catch (error) {
                console.error(`❌ Error processing ${file}:`, error.message);
            }
        }
    }
}

// Run the reversion
console.log('🔄 REVERTING ITEM TYPES TO ORIGINAL NAMES\n');
processPacksDirectory();
console.log('\n✅ Type reversion complete!'); 