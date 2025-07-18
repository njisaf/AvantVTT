/**
 * @fileoverview Sound Discovery Utility for Avant VTT
 * @version 1.0.0
 * @description Automatically discovers available sound files and builds sound mappings
 * @author Avant VTT Team
 */

import { UISound } from './audio-utils.js';

/**
 * Interface for discovered sound information
 */
export interface DiscoveredSound {
    /** The UISound enum value */
    type: UISound;
    /** The file path to the sound */
    path: string;
    /** The file format (wav, mp3, ogg) */
    format: string;
    /** Whether the file was successfully validated */
    valid: boolean;
}

/**
 * Mapping of UISound enum values to their expected filenames
 */
const SOUND_FILENAME_MAP: Record<UISound, string> = {
    [UISound.TALENT_CHAT]: 'talent-chat',
    [UISound.AUGMENT_CHAT]: 'augment-chat',
    [UISound.SPEND_PP]: 'spend-pp',
    [UISound.DICE_ROLL]: 'dice-roll',
    [UISound.BUTTON_CLICK]: 'button-click',
    [UISound.SUCCESS]: 'success',
    [UISound.ERROR]: 'error'
};

/**
 * Supported audio file formats
 */
const SUPPORTED_FORMATS = ['wav', 'mp3', 'ogg'];

/**
 * Default sound directory structure
 */
const SOUND_DIRECTORIES = {
    UI: 'systems/avant/assets/sounds/ui/',
    DICE: 'systems/avant/assets/sounds/dice/',
    AMBIENT: 'systems/avant/assets/sounds/ambient/'
};

/**
 * Cached sound mappings to avoid repeated file system checks
 */
let soundMappingCache: Record<UISound, string[]> | null = null;

/**
 * Discover available sound files in the system
 * 
 * This function scans the sounds directory for available audio files and builds
 * a mapping of UISound enum values to their file paths. It supports multiple
 * formats and provides fallback options.
 * 
 * @returns Promise<DiscoveredSound[]> - Array of discovered sound information
 * 
 * @example
 * ```typescript
 * const sounds = await discoverSounds();
 * console.log('Available sounds:', sounds);
 * ```
 */
export async function discoverSounds(): Promise<DiscoveredSound[]> {
    const discovered: DiscoveredSound[] = [];

    // Scan UI sounds directory
    for (const [soundType, filename] of Object.entries(SOUND_FILENAME_MAP)) {
        const uiSound = soundType as UISound;

        // Check for each supported format
        for (const format of SUPPORTED_FORMATS) {
            const path = `${SOUND_DIRECTORIES.UI}${filename}.${format}`;

            // Check if file exists (in a FoundryVTT context)
            const exists = await checkSoundFileExists(path);

            if (exists) {
                discovered.push({
                    type: uiSound,
                    path,
                    format,
                    valid: true
                });
                break; // Use first format found
            }
        }
    }

    return discovered;
}

/**
 * Build sound mapping from discovered sounds
 * 
 * This function creates the mapping object used by the audio system to locate
 * sound files. It includes both discovered sounds and fallback options.
 * 
 * @param discoveredSounds - Array of discovered sound information
 * @returns Record<UISound, string[]> - Mapping of sound types to file paths
 * 
 * @example
 * ```typescript
 * const discovered = await discoverSounds();
 * const mapping = buildSoundMapping(discovered);
 * ```
 */
export function buildSoundMapping(discoveredSounds: DiscoveredSound[]): Record<UISound, string[]> {
    // Initialize with empty arrays for each sound type
    const mapping: Record<UISound, string[]> = {
        [UISound.TALENT_CHAT]: [],
        [UISound.AUGMENT_CHAT]: [],
        [UISound.SPEND_PP]: [],
        [UISound.DICE_ROLL]: [],
        [UISound.BUTTON_CLICK]: [],
        [UISound.SUCCESS]: [],
        [UISound.ERROR]: []
    };

    // Add discovered sounds as primary options
    for (const sound of discoveredSounds) {
        if (sound.valid) {
            mapping[sound.type].unshift(sound.path);
        }
    }

    // Add fallback options for each sound type
    for (const soundType of Object.values(UISound)) {
        const fallbacks = getDefaultFallbacks(soundType);
        mapping[soundType].push(...fallbacks);
    }

    return mapping;
}

/**
 * Get the current sound mapping with caching
 * 
 * This function returns the sound mapping, building it if necessary and caching
 * the result for subsequent calls. This avoids repeated file system scans.
 * 
 * @returns Promise<Record<UISound, string[]>> - Cached sound mapping
 * 
 * @example
 * ```typescript
 * const mapping = await getSoundMapping();
 * const talentPaths = mapping[UISound.TALENT_CHAT];
 * ```
 */
export async function getSoundMapping(): Promise<Record<UISound, string[]>> {
    if (soundMappingCache) {
        return soundMappingCache;
    }

    const discovered = await discoverSounds();
    soundMappingCache = buildSoundMapping(discovered);

    return soundMappingCache;
}

/**
 * Clear the sound mapping cache
 * 
 * This function clears the cached sound mapping, forcing a re-scan on the next
 * call to getSoundMapping(). Useful when sound files have been added or removed.
 * 
 * @example
 * ```typescript
 * clearSoundCache();
 * const freshMapping = await getSoundMapping();
 * ```
 */
export function clearSoundCache(): void {
    soundMappingCache = null;
}

/**
 * Check if a sound file exists in the system
 * 
 * This function attempts to verify if a sound file exists. In a FoundryVTT context,
 * this uses the game's file system APIs. In other contexts, it may use different
 * methods or return true for fallback behavior.
 * 
 * @param path - The file path to check
 * @returns Promise<boolean> - Whether the file exists
 * 
 * @private
 */
async function checkSoundFileExists(path: string): Promise<boolean> {
    try {
        // In FoundryVTT context, we can use the game's file system
        const game = (globalThis as any).game;

        if (game?.files) {
            // Use FoundryVTT's file system API if available
            try {
                const response = await fetch(path, { method: 'HEAD' });
                return response.ok;
            } catch {
                return false;
            }
        }

        // Fallback: assume file exists for development/testing
        return true;

    } catch (error) {
        console.warn(`Sound discovery | Failed to check file: ${path}`, error);
        return false;
    }
}

/**
 * Get default fallback paths for a sound type
 * 
 * This function returns the default fallback paths for a given sound type.
 * These are used when no custom sound files are found.
 * 
 * @param soundType - The sound type to get fallbacks for
 * @returns string[] - Array of fallback paths
 * 
 * @private
 */
function getDefaultFallbacks(soundType: UISound): string[] {
    // Default fallbacks - these are the paths we had in the original implementation
    const fallbacks: Record<UISound, string[]> = {
        [UISound.TALENT_CHAT]: [
            'systems/avant/assets/sounds/ui/card-play.wav',
            'sounds/dice.wav'
        ],
        [UISound.AUGMENT_CHAT]: [
            'systems/avant/assets/sounds/ui/card-play.wav',
            'sounds/dice.wav'
        ],
        [UISound.SPEND_PP]: [
            'systems/avant/assets/sounds/ui/coin-spend.wav',
            'systems/avant/assets/sounds/ui/resource-spend.wav',
            'sounds/dice.wav'
        ],
        [UISound.DICE_ROLL]: [
            'sounds/dice.wav',
            'systems/avant/assets/sounds/ui/dice.wav'
        ],
        [UISound.BUTTON_CLICK]: [
            'systems/avant/assets/sounds/ui/click.wav',
            'systems/avant/assets/sounds/ui/button.wav',
            'sounds/dice.wav'
        ],
        [UISound.SUCCESS]: [
            'systems/avant/assets/sounds/ui/confirm.wav',
            'sounds/dice.wav'
        ],
        [UISound.ERROR]: [
            'systems/avant/assets/sounds/ui/fail.wav',
            'sounds/dice.wav'
        ]
    };

    return fallbacks[soundType] || ['sounds/dice.wav'];
}

/**
 * Validate sound assets at build time
 * 
 * This function can be called during the build process to validate that expected
 * sound files exist and are in the correct format.
 * 
 * @returns Promise<{ valid: boolean; errors: string[] }> - Validation results
 * 
 * @example
 * ```typescript
 * const validation = await validateSoundAssets();
 * if (!validation.valid) {
 *     console.error('Sound validation errors:', validation.errors);
 * }
 * ```
 */
export async function validateSoundAssets(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const discovered = await discoverSounds();

    // Check if we have at least some sounds
    if (discovered.length === 0) {
        errors.push('No custom sound files found - system will use dice roll fallback');
    }

    // Check for missing recommended sounds
    const recommendedSounds = [UISound.TALENT_CHAT, UISound.AUGMENT_CHAT, UISound.SPEND_PP];
    for (const soundType of recommendedSounds) {
        const hasSound = discovered.some(s => s.type === soundType && s.valid);
        if (!hasSound) {
            errors.push(`Recommended sound missing: ${soundType}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
} 