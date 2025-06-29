/**
 * @fileoverview SHA-1 Hashing Logic - Pure Functions
 * @description Pure functions for generating stable SHA-1 hashes of objects
 * @version 2.0.0
 * @author Avant Development Team
 */

import { normaliseDoc } from './normaliseDoc';

/**
 * Generates a SHA-1 hash of an object for change detection
 * 
 * This function creates a stable SHA-1 hash of any object by first normalising
 * it (removing volatile fields and sorting keys) and then converting to JSON
 * for hashing. The hash is returned as a lowercase hexadecimal string.
 * This is used to detect changes between versions of the same document.
 * 
 * @param {any} obj - The object to hash
 * @returns {string} A lowercase hexadecimal SHA-1 hash
 * 
 * @example
 * // Simple object hashing
 * const weapon = {
 *   name: "Sword",
 *   damage: "1d8",
 *   _id: "will-be-removed"
 * };
 * 
 * const hash1 = sha1(weapon);
 * // Result: "a1b2c3d4e5f6789012345678901234567890abcd"
 * 
 * // Same content produces same hash (volatile fields ignored)
 * const weapon2 = {
 *   damage: "1d8",
 *   name: "Sword",
 *   _id: "different-id"
 * };
 * const hash2 = sha1(weapon2);
 * // hash1 === hash2 (true - content is identical)
 * 
 * // Different content produces different hash
 * const weapon3 = { ...weapon, damage: "1d10" };
 * const hash3 = sha1(weapon3);
 * // hash1 !== hash3 (true - content differs)
 */
export async function sha1(obj: any): Promise<string> {
    // Normalise the object first to ensure stable hashing
    const normalised = normaliseDoc(obj);
    
    // Convert to stable JSON string
    const jsonString = JSON.stringify(normalised);
    
    try {
        // Check if crypto is available
        const crypto = (globalThis as any).crypto;
        if (!crypto || !crypto.subtle || !crypto.subtle.digest) {
            // Fallback to sync version if crypto is not available (e.g., in tests)
            return sha1Sync(obj);
        }
        
        // Convert string to bytes for hashing
        const encoder = new TextEncoder();
        const data = encoder.encode(jsonString);
        
        // Generate SHA-1 hash using Web Crypto API
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        
        // Convert hash to lowercase hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
        
        return hashHex;
    } catch (error) {
        // If crypto fails for any reason, fallback to sync version
        return sha1Sync(obj);
    }
}

/**
 * Synchronous version of sha1 for environments where async is not suitable
 * 
 * This is a fallback implementation that uses a simple hash algorithm
 * when the Web Crypto API is not available or when synchronous operation
 * is required. Less secure than true SHA-1 but provides consistent hashing.
 * 
 * @param {any} obj - The object to hash
 * @returns {string} A lowercase hexadecimal hash string
 * 
 * @example
 * // When you need synchronous hashing
 * const weapon = { name: "Sword", damage: "1d8" };
 * const hash = sha1Sync(weapon);
 * // Result: consistent hash string for the same input
 */
export function sha1Sync(obj: any): string {
    // Normalise the object first
    const normalised = normaliseDoc(obj);
    
    // Convert to stable JSON string
    const jsonString = JSON.stringify(normalised);
    
    // Handle null/undefined/empty cases
    if (!jsonString || jsonString === 'null' || jsonString === 'undefined') {
        return '00000000';
    }
    
    // Simple hash algorithm (not cryptographically secure, but consistent)
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive number and then to hex
    const positiveHash = Math.abs(hash);
    return positiveHash.toString(16).padStart(8, '0');
} 