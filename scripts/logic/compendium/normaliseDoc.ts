/**
 * @fileoverview Document Normalisation Logic - Pure Functions
 * @description Pure functions for normalising FoundryVTT documents for stable comparison
 * @version 2.0.0
 * @author Avant Development Team
 */

/**
 * Normalises a document by removing volatile fields and sorting keys
 * 
 * This function creates a stable, canonical representation of a document
 * by removing properties that change frequently (like IDs, stats, folder info)
 * and sorting all remaining keys lexicographically. This ensures consistent
 * hashing and comparison between documents with the same content.
 * 
 * @param {any} doc - The document object to normalise
 * @returns {any} A normalised copy with volatile fields removed and keys sorted
 * 
 * @example
 * // FoundryVTT document with volatile fields
 * const rawDoc = {
 *   name: "Sword",
 *   _id: "abc123def456",
 *   _stats: { coreVersion: "12.331" },
 *   folder: "weapons-folder",
 *   sort: 100000,
 *   system: { damage: "1d8", type: "weapon" }
 * };
 * 
 * const normalised = normaliseDoc(rawDoc);
 * // Result: {
 * //   name: "Sword",
 * //   system: { damage: "1d8", type: "weapon" }
 * // }
 * // Keys are guaranteed to be in lexicographic order
 * 
 * // Handles nested objects recursively
 * const complexDoc = {
 *   name: "Spell",
 *   _id: "volatile",
 *   data: { cost: 5, _stats: "remove" }
 * };
 * const result = normaliseDoc(complexDoc);
 * // Result: { data: { cost: 5 }, name: "Spell" }
 */
export function normaliseDoc(doc: any, visited: WeakSet<object> = new WeakSet()): any {
    // Handle null/undefined
    if (doc === null || doc === undefined) {
        return doc;
    }
    
    // Handle primitive types (string, number, boolean)
    if (typeof doc !== 'object') {
        return doc;
    }
    
    // Handle circular references
    if (visited.has(doc)) {
        return {}; // Return empty object for circular references
    }
    
    // Mark this object as visited
    visited.add(doc);
    
    // Handle arrays
    if (Array.isArray(doc)) {
        const result = doc.map(item => normaliseDoc(item, visited));
        visited.delete(doc);
        return result;
    }
    
    // Handle objects - create deep copy and remove volatile fields
    const normalised: Record<string, any> = {};
    const volatileFields = new Set(['_id', '_stats', 'folder', 'sort']);
    
    // Process all properties, filtering out volatile ones
    for (const [key, value] of Object.entries(doc)) {
        if (!volatileFields.has(key)) {
            normalised[key] = normaliseDoc(value, visited);
        }
    }
    
    // Sort keys lexicographically for stable ordering
    const sortedKeys = Object.keys(normalised).sort();
    const sortedDoc: Record<string, any> = {};
    
    for (const key of sortedKeys) {
        sortedDoc[key] = normalised[key];
    }
    
    // Remove from visited set before returning
    visited.delete(doc);
    
    return sortedDoc;
} 