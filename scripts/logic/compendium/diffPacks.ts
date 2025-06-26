/**
 * @fileoverview Pack Comparison Logic - Pure Functions
 * @description Pure functions for comparing and diffing document collections
 * @version 2.0.0
 * @author Avant Development Team
 */

import { sha1Sync } from './sha1';

/**
 * Result of comparing two document collections
 */
export interface DiffResult {
    /** Documents present only in remoteDocs */
    added: any[];
    /** Documents present only in localDocs */
    removed: any[];
    /** Documents with same name but different content */
    changed: Array<{ local: any; remote: any }>;
}

/**
 * Compares two document arrays and identifies differences
 * 
 * This function performs a comprehensive comparison between local and remote
 * document collections, identifying which documents have been added, removed,
 * or changed. Documents are matched by their 'name' field (case-insensitive)
 * and compared using SHA-1 hashes of their normalised content.
 * 
 * @param {any[]} localDocs - The local document collection
 * @param {any[]} remoteDocs - The remote document collection to compare against
 * @returns {DiffResult} Object containing added, removed, and changed documents
 * 
 * @example
 * // Basic pack comparison
 * const localDocs = [
 *   { name: "Sword", damage: "1d8", _id: "local1" },
 *   { name: "Shield", defense: 2, _id: "local2" }
 * ];
 * 
 * const remoteDocs = [
 *   { name: "Sword", damage: "1d10", _id: "remote1" }, // Changed
 *   { name: "Bow", damage: "1d6", _id: "remote2" }     // Added
 * ];
 * 
 * const diff = diffPacks(localDocs, remoteDocs);
 * // Result: {
 * //   added: [{ name: "Bow", damage: "1d6" }],
 * //   removed: [{ name: "Shield", defense: 2 }],
 * //   changed: [{
 * //     local: { name: "Sword", damage: "1d8" },
 * //     remote: { name: "Sword", damage: "1d10" }
 * //   }]
 * // }
 * 
 * // Case-insensitive name matching
 * const local = [{ name: "SWORD", damage: "1d8" }];
 * const remote = [{ name: "sword", damage: "1d8" }];
 * const result = diffPacks(local, remote);
 * // Result: { added: [], removed: [], changed: [] }
 * // (No differences - same content, case-insensitive match)
 */
export function diffPacks(localDocs: any[], remoteDocs: any[]): DiffResult {
    // Validate inputs
    if (!Array.isArray(localDocs)) {
        throw new Error('localDocs must be an array');
    }
    if (!Array.isArray(remoteDocs)) {
        throw new Error('remoteDocs must be an array');
    }
    
    // Create maps for efficient lookup by normalised name
    const localMap = new Map<string, any>();
    const remoteMap = new Map<string, any>();
    
    // Populate local map
    for (const doc of localDocs) {
        if (doc && typeof doc === 'object' && doc.name) {
            const normalisedName = doc.name.toString().toLowerCase().trim();
            if (normalisedName) {
                localMap.set(normalisedName, doc);
            }
        }
    }
    
    // Populate remote map
    for (const doc of remoteDocs) {
        if (doc && typeof doc === 'object' && doc.name) {
            const normalisedName = doc.name.toString().toLowerCase().trim();
            if (normalisedName) {
                remoteMap.set(normalisedName, doc);
            }
        }
    }
    
    const added: any[] = [];
    const removed: any[] = [];
    const changed: Array<{ local: any; remote: any }> = [];
    
    // Find added and changed documents
    for (const [normalisedName, remoteDoc] of remoteMap) {
        const localDoc = localMap.get(normalisedName);
        
        if (!localDoc) {
            // Document exists in remote but not local - it's added
            added.push(remoteDoc);
        } else {
            // Document exists in both - check if content differs
            const localHash = sha1Sync(localDoc);
            const remoteHash = sha1Sync(remoteDoc);
            
            if (localHash !== remoteHash) {
                // Content differs - it's changed
                changed.push({
                    local: localDoc,
                    remote: remoteDoc
                });
            }
        }
    }
    
    // Find removed documents
    for (const [normalisedName, localDoc] of localMap) {
        if (!remoteMap.has(normalisedName)) {
            // Document exists in local but not remote - it's removed
            removed.push(localDoc);
        }
    }
    
    return {
        added,
        removed,
        changed
    };
} 