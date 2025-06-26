/**
 * @fileoverview Pack ID Parsing Logic - Pure Functions
 * @description Pure functions for parsing FoundryVTT compendium pack identifiers
 * @version 2.0.0
 * @author Avant Development Team
 */

/**
 * Splits a full pack ID into package and name components
 * 
 * This function takes a compendium pack identifier in the format "package.name"
 * and splits it into its constituent parts. This is used throughout the compendium
 * system to separate the system/module identifier from the pack name.
 * 
 * @param {string} fullId - The full pack ID to split (e.g., "avant.weapons")
 * @returns {{package: string, name: string}} The split pack components
 * @throws {Error} If the pack ID format is invalid
 * 
 * @example
 * // Standard system pack
 * const result = splitPackId("avant.weapons");
 * // Result: { package: "avant", name: "weapons" }
 * 
 * // Module pack
 * const moduleResult = splitPackId("my-module.spells");
 * // Result: { package: "my-module", name: "spells" }
 * 
 * // Invalid format throws error
 * try {
 *   splitPackId("invalid-format");
 * } catch (error) {
 *   // Error: Invalid pack ID format: must be 'package.name'
 * }
 */
export function splitPackId(fullId: string): { package: string; name: string } {
    // Validate input type
    if (typeof fullId !== 'string') {
        throw new Error(`Invalid pack ID format: must be 'package.name', got ${typeof fullId}`);
    }
    
    // Validate non-empty string
    if (fullId.trim() === '') {
        throw new Error(`Invalid pack ID format: must be 'package.name', got empty string`);
    }
    
    // Split on the dot separator
    const parts = fullId.split('.');
    
    // Must have exactly two parts
    if (parts.length !== 2) {
        throw new Error(`Invalid pack ID format: must be 'package.name', got '${fullId}'`);
    }
    
    const [packagePart, namePart] = parts;
    
    // Both parts must be non-empty after trimming
    if (packagePart.trim() === '' || namePart.trim() === '') {
        throw new Error(`Invalid pack ID format: package and name must be non-empty, got '${fullId}'`);
    }
    
    return {
        package: packagePart.trim(),
        name: namePart.trim()
    };
} 