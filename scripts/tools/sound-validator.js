/**
 * Build-time Sound Asset Validator
 * 
 * This utility validates that sound assets exist and are in the correct format.
 * It can be run during the build process to catch missing sound files early.
 * 
 * Usage:
 *   node scripts/tools/sound-validator.js
 * 
 * @version 1.0.0
 * @author Avant VTT Team
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Sound types and their expected filenames
 */
const SOUND_TYPES = {
    TALENT_CHAT: 'talent-chat',
    AUGMENT_CHAT: 'augment-chat',
    SPEND_PP: 'spend-pp',
    DICE_ROLL: 'dice-roll',
    BUTTON_CLICK: 'button-click',
    SUCCESS: 'success',
    ERROR: 'error'
};

/**
 * Supported audio formats
 */
const SUPPORTED_FORMATS = ['wav', 'mp3', 'ogg'];

/**
 * Sound directories to check
 */
const SOUND_DIRECTORIES = {
    UI: 'assets/sounds/ui/',
    DICE: 'assets/sounds/dice/',
    AMBIENT: 'assets/sounds/ambient/'
};

/**
 * Colors for console output
 */
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

/**
 * Check if a file exists
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get file size in a human-readable format
 */
async function getFileSize(filePath) {
    try {
        const stats = await fs.stat(filePath);
        const bytes = stats.size;

        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    } catch {
        return 'Unknown';
    }
}

/**
 * Validate sound assets
 */
async function validateSoundAssets() {
    console.log(`${colors.bold}🎵 Avant VTT Sound Asset Validator${colors.reset}\n`);

    const results = {
        found: [],
        missing: [],
        recommendations: []
    };

    // Check each sound type
    for (const [soundType, filename] of Object.entries(SOUND_TYPES)) {
        let foundFile = null;

        // Check each supported format
        for (const format of SUPPORTED_FORMATS) {
            const filePath = path.join(SOUND_DIRECTORIES.UI, `${filename}.${format}`);

            if (await fileExists(filePath)) {
                const size = await getFileSize(filePath);
                foundFile = {
                    soundType,
                    filename,
                    format,
                    path: filePath,
                    size
                };
                results.found.push(foundFile);
                break;
            }
        }

        if (!foundFile) {
            results.missing.push({
                soundType,
                filename,
                expectedPaths: SUPPORTED_FORMATS.map(format =>
                    path.join(SOUND_DIRECTORIES.UI, `${filename}.${format}`)
                )
            });
        }
    }

    // Check for sounds directory
    const soundsDir = 'sounds';
    const uiDir = SOUND_DIRECTORIES.UI;

    if (!(await fileExists(soundsDir))) {
        results.recommendations.push(`Create ${soundsDir} directory`);
    }

    if (!(await fileExists(uiDir))) {
        results.recommendations.push(`Create ${uiDir} directory`);
    }

    return results;
}

/**
 * Display validation results
 */
function displayResults(results) {
    // Display found sounds
    if (results.found.length > 0) {
        console.log(`${colors.green}✅ Found Sound Files:${colors.reset}`);
        results.found.forEach(sound => {
            console.log(`  ${colors.blue}${sound.soundType}${colors.reset}: ${sound.path} ${colors.yellow}(${sound.size})${colors.reset}`);
        });
        console.log();
    }

    // Display missing sounds
    if (results.missing.length > 0) {
        console.log(`${colors.red}❌ Missing Sound Files:${colors.reset}`);
        results.missing.forEach(sound => {
            console.log(`  ${colors.blue}${sound.soundType}${colors.reset}: ${sound.filename}`);
            console.log(`    Expected one of:`);
            sound.expectedPaths.forEach(path => {
                console.log(`      ${colors.yellow}${path}${colors.reset}`);
            });
            console.log();
        });
    }

    // Display recommendations
    if (results.recommendations.length > 0) {
        console.log(`${colors.yellow}💡 Recommendations:${colors.reset}`);
        results.recommendations.forEach(rec => {
            console.log(`  • ${rec}`);
        });
        console.log();
    }

    // Summary
    const total = results.found.length + results.missing.length;
    const foundPercentage = Math.round((results.found.length / total) * 100);

    console.log(`${colors.bold}📊 Summary:${colors.reset}`);
    console.log(`  Found: ${colors.green}${results.found.length}${colors.reset}/${total} (${foundPercentage}%)`);
    console.log(`  Missing: ${colors.red}${results.missing.length}${colors.reset}/${total}`);

    if (results.missing.length === 0) {
        console.log(`\n${colors.green}🎉 All recommended sound files are present!${colors.reset}`);
    } else {
        console.log(`\n${colors.yellow}⚠️  Missing sound files will fall back to dice roll sound${colors.reset}`);
    }
}

/**
 * Generate sample sound files info
 */
function generateSampleInfo() {
    console.log(`\n${colors.bold}🎯 Sample Sound File Guidelines:${colors.reset}`);
    console.log(`
${colors.blue}talent-chat.wav${colors.reset}    - Light, positive card placement sound
${colors.blue}augment-chat.wav${colors.reset}   - Slightly tech-flavored enhancement sound  
${colors.blue}spend-pp.wav${colors.reset}       - Resource expenditure sound (coins, energy)
${colors.blue}button-click.wav${colors.reset}   - Subtle, crisp UI click
${colors.blue}success.wav${colors.reset}        - Uplifting confirmation tone
${colors.blue}error.wav${colors.reset}          - Gentle warning tone

${colors.yellow}Technical specs:${colors.reset}
• Format: WAV (recommended), MP3, or OGG
• Duration: Under 2 seconds
• Sample Rate: 44.1kHz
• Bit Depth: 16-bit
• Keep file sizes under 100KB for UI sounds
    `);
}

/**
 * Main validation function
 */
async function main() {
    try {
        const results = await validateSoundAssets();
        displayResults(results);

        // Show sample info if there are missing files
        if (results.missing.length > 0) {
            generateSampleInfo();
        }

        // Always exit with success code - missing files are warnings, not errors
        // The system gracefully falls back to dice roll sounds
        process.exit(0);

    } catch (error) {
        console.error(`${colors.red}❌ Validation failed:${colors.reset}`, error);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export {
    validateSoundAssets,
    displayResults,
    SOUND_TYPES,
    SUPPORTED_FORMATS,
    SOUND_DIRECTORIES
}; 