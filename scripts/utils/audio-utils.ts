/**
 * @fileoverview Audio Utilities for Avant VTT
 * @version 2.0.0
 * @description Utility functions for playing UI sounds in the Avant system
 * @author Avant VTT Team
 */

/**
 * Enum for available UI sound types in the Avant system
 * 
 * This enum defines all the UI sounds that can be played, making it easy to
 * add new sounds and ensuring type safety when calling the playSound function.
 * 
 * @enum {string}
 */
export enum UISound {
    /** Sound for posting talent cards to chat */
    TALENT_CHAT = 'talent_chat',

    /** Sound for posting augment cards to chat */
    AUGMENT_CHAT = 'augment_chat',

    /** Sound for spending power points */
    SPEND_PP = 'spend_pp',

    /** Generic dice roll sound (fallback) */
    DICE_ROLL = 'dice_roll',

    /** Generic button click sound */
    BUTTON_CLICK = 'button_click',

    /** Success/confirmation sound */
    SUCCESS = 'success',

    /** Error/failure sound */
    ERROR = 'error'
}

/**
 * Configuration for sound playback options
 * 
 * @interface SoundOptions
 */
export interface SoundOptions {
    /** Volume level (0.0 to 1.0) */
    volume?: number;

    /** Audio context to use ('interface', 'global', etc.) */
    context?: string;

    /** Whether to use fallback sound if main sound fails */
    allowFallback?: boolean;
}

/**
 * Play a UI sound effect using FoundryVTT's native audio system
 * 
 * This function plays sounds through the 'interface' audio context, which is
 * the same context used for dice rolls and other UI interactions. This ensures
 * the sound respects the user's interface volume settings.
 * 
 * @param soundType - The type of sound to play from the UISound enum
 * @param options - Additional options for sound playback
 * @returns Promise<void> - Resolves when sound starts playing
 * 
 * @example
 * ```typescript
 * // Play a talent chat sound
 * await playSound(UISound.TALENT_CHAT);
 * 
 * // Play a PP spend sound with custom volume
 * await playSound(UISound.SPEND_PP, { volume: 0.5 });
 * 
 * // Play an augment chat sound with no fallback
 * await playSound(UISound.AUGMENT_CHAT, { allowFallback: false });
 * ```
 */
export async function playSound(
    soundType: UISound,
    options: SoundOptions = {}
): Promise<void> {
    try {
        // Get the AudioHelper instance using the new v13 namespace
        const AudioHelper = (globalThis as any).foundry.audio.AudioHelper;

        if (!AudioHelper) {
            console.warn('🔇 Avant | AudioHelper not available, skipping sound');
            return;
        }

        // Get the sound file path
        const soundPath = await getSoundPath(soundType);

        // Sound configuration - using interface channel like dice rolls
        const soundData = {
            src: soundPath,
            volume: options.volume || 0.5,
            autoplay: true,
            loop: false,
            channel: options.context || 'interface'
        };

        // Play the sound using FoundryVTT's AudioHelper
        AudioHelper.play(soundData, false);

        console.log(`🎵 Avant | Played ${soundType} sound: ${soundPath}`);

    } catch (error) {
        console.warn(`🔇 Avant | Failed to play ${soundType} sound:`, error);

        // Fallback: Try to create a simple beep sound if allowed
        if (options.allowFallback !== false) {
            await playFallbackSound(soundType);
        }
    }
}

/**
 * Get the file path for a UI sound type
 * 
 * This function maps sound types to their file paths using the automatic sound
 * discovery system. It first tries to use discovered custom sounds, then falls
 * back to default options.
 * 
 * @param soundType - The type of sound to get the path for
 * @returns Promise<string> - The file path to the sound
 * 
 * @private
 */
async function getSoundPath(soundType: UISound): Promise<string> {
    try {
        // Try to use the sound discovery system
        const { getSoundMapping } = await import('./sound-discovery.js');
        const soundMapping = await getSoundMapping();

        // Get the first available path for this sound type
        const paths = soundMapping[soundType];
        if (paths && paths.length > 0) {
            return paths[0];
        }

    } catch (error) {
        console.warn(`🔇 Avant | Sound discovery failed, using fallback:`, error);
    }

    // Final fallback if discovery system fails
    return 'sounds/dice.wav';
}

/**
 * Play a fallback sound when the main sound fails
 * 
 * This creates a programmatic beep sound as a last resort when no sound files
 * are available. The beep varies slightly based on the sound type.
 * 
 * @param soundType - The type of sound that failed to play
 * @returns Promise<void> - Resolves when fallback sound starts playing
 * 
 * @private
 */
async function playFallbackSound(soundType: UISound): Promise<void> {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Different frequencies for different sound types
        const frequencyMap: Record<UISound, number> = {
            [UISound.TALENT_CHAT]: 600,
            [UISound.AUGMENT_CHAT]: 650,
            [UISound.SPEND_PP]: 800,
            [UISound.DICE_ROLL]: 500,
            [UISound.BUTTON_CLICK]: 400,
            [UISound.SUCCESS]: 700,
            [UISound.ERROR]: 300
        };

        oscillator.frequency.value = frequencyMap[soundType] || 500;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;

        oscillator.start();
        setTimeout(() => oscillator.stop(), 100);

        console.log(`🔔 Avant | Played fallback beep for ${soundType}`);

    } catch (fallbackError) {
        console.warn('🔇 Avant | Even fallback sound failed:', fallbackError);
    }
}

// Legacy wrapper functions for backward compatibility
// These are deprecated and should be replaced with playSound() calls

/**
 * @deprecated Use playSound(UISound.TALENT_CHAT) instead
 */
export async function playTalentSound(options: { volume?: number } = {}): Promise<void> {
    return playSound(UISound.TALENT_CHAT, options);
}

/**
 * @deprecated Use playSound(UISound.AUGMENT_CHAT) instead
 */
export async function playAugmentSound(options: { volume?: number } = {}): Promise<void> {
    return playSound(UISound.AUGMENT_CHAT, options);
}

/**
 * @deprecated Use playSound(UISound.SPEND_PP) instead
 */
export async function playSpendSound(options: { volume?: number } = {}): Promise<void> {
    return playSound(UISound.SPEND_PP, options);
} 