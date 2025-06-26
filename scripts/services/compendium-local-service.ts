/**
 * @fileoverview Local Compendium Service - FoundryVTT Local Operations
 * @description Service for local compendium management, loading, diffing, and copying
 * @version 2.0.0
 * @author Avant Development Team
 */

import { diffPacks, DiffResult } from '../logic/compendium/diffPacks';

/**
 * Document interface for compendium operations
 */
export interface CompendiumDocument {
    /** Document name (used for matching) */
    name: string;
    /** Document ID (may be preserved during copy operations) */
    _id?: string;
    /** Any other document properties */
    [key: string]: any;
}

/**
 * Options for document copying operations
 */
export interface CopyDocsOptions {
    /** Filter function to select which documents to copy */
    filter?: (doc: CompendiumDocument) => boolean;
    /** Whether to preserve original document IDs when possible */
    preserveIds?: boolean;
}

/**
 * Hook data emitted when documents are copied between packs
 */
export interface CompendiumCopiedHookData {
    /** Source pack ID */
    srcId: string;
    /** Destination pack ID */
    destId: string;
    /** Number of documents successfully copied */
    docsCopied: number;
    /** Array of copied document names */
    copiedNames: string[];
}

/**
 * Hook data emitted when packs are compared
 */
export interface CompendiumDiffedHookData {
    /** Source pack ID */
    srcId: string;
    /** Destination pack ID */
    destId: string;
    /** Comparison results */
    diff: DiffResult;
    /** Total number of differences found */
    totalDifferences: number;
}

/**
 * Service for local compendium pack operations
 * 
 * This service provides utilities for working with FoundryVTT compendium packs
 * stored locally. It handles loading documents, comparing pack contents, and
 * copying documents between packs using only local Foundry APIs.
 * 
 * @example
 * // Basic usage
 * const service = new CompendiumLocalService();
 * 
 * // Load all documents from a pack
 * const docs = await service.loadPack('world.my-weapons');
 * 
 * // Compare two packs
 * const diff = await service.diffLocalPacks('world.pack1', 'world.pack2');
 * 
 * // Copy all documents
 * await service.copyDocs('world.source', 'world.dest');
 * 
 * // Copy with filter
 * await service.copyDocs('world.weapons', 'world.magic-weapons', {
 *   filter: (doc) => doc.system?.magical === true
 * });
 */
export class CompendiumLocalService {
    private initialized: boolean = false;

    /**
     * Initialize the service (called automatically on first use)
     * 
     * Ensures the FoundryVTT game is ready and compendium packs are available.
     * This is called automatically by other methods, so manual initialization
     * is not required.
     * 
     * @throws {Error} If FoundryVTT game or packs are not available
     */
    private ensureInitialized(): void {
        if (this.initialized) return;

        if (!(globalThis as any).game) {
            throw new Error('FoundryVTT game not available - service requires active game session');
        }

        if (!(globalThis as any).game.packs) {
            throw new Error('FoundryVTT compendium packs not available');
        }

        this.initialized = true;
    }

    /**
     * Load all documents from a compendium pack
     * 
     * Retrieves all documents from the specified compendium pack. The pack
     * must be available in the current game session. Returns an array of
     * document objects that can be used for comparison or copying operations.
     * 
     * @param {string} packId - Full pack identifier (e.g., 'world.my-pack' or 'system.equipment')
     * @returns {Promise<CompendiumDocument[]>} Array of documents from the pack
     * 
     * @throws {Error} If pack is not found or cannot be accessed
     * 
     * @example
     * // Load world-level pack
     * const worldDocs = await service.loadPack('world.custom-weapons');
     * 
     * // Load system pack
     * const systemDocs = await service.loadPack('dnd5e.spells');
     * 
     * // Load module pack
     * const moduleDocs = await service.loadPack('my-module.monsters');
     */
    async loadPack(packId: string): Promise<CompendiumDocument[]> {
        this.ensureInitialized();

        if (!packId || typeof packId !== 'string') {
            throw new Error(`Invalid pack ID: ${packId}. Must be a non-empty string.`);
        }

        // Get the pack from FoundryVTT
        const pack = (globalThis as any).game.packs.get(packId);
        if (!pack) {
            throw new Error(`Compendium pack '${packId}' not found. Available packs: ${Array.from((globalThis as any).game.packs.keys()).join(', ')}`);
        }

        try {
            // Load all documents from the pack
            const documents = await pack.getDocuments();
            
            // Convert to plain objects for easier manipulation
            const plainDocs: CompendiumDocument[] = documents.map((doc: any) => {
                const data = doc.toObject();
                return {
                    name: data.name || `Unnamed-${data._id}`,
                    ...data
                } as CompendiumDocument;
            });

            return plainDocs;
        } catch (error) {
            throw new Error(`Failed to load documents from pack '${packId}': ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Compare two local compendium packs and identify differences
     * 
     * Loads documents from both packs and performs a comprehensive comparison
     * to identify which documents have been added, removed, or changed. The
     * comparison uses normalized document content to ignore volatile fields.
     * 
     * @param {string} srcId - Source pack identifier to compare from
     * @param {string} destId - Destination pack identifier to compare to
     * @returns {Promise<DiffResult>} Comparison results with added, removed, and changed documents
     * 
     * @throws {Error} If either pack cannot be loaded
     * 
     * @example
     * // Compare world pack with backup
     * const diff = await service.diffLocalPacks('world.weapons', 'world.weapons-backup');
     * 
     * console.log(`Added: ${diff.added.length}`);
     * console.log(`Removed: ${diff.removed.length}`);
     * console.log(`Changed: ${diff.changed.length}`);
     * 
     * // Access specific changes
     * diff.changed.forEach(change => {
     *   console.log(`${change.local.name} differs from ${change.remote.name}`);
     * });
     */
    async diffLocalPacks(srcId: string, destId: string): Promise<DiffResult> {
        this.ensureInitialized();

        if (!srcId || !destId) {
            throw new Error('Both source and destination pack IDs are required');
        }

        if (srcId === destId) {
            throw new Error('Source and destination pack IDs cannot be the same');
        }

        try {
            // Load documents from both packs
            const [srcDocs, destDocs] = await Promise.all([
                this.loadPack(srcId),
                this.loadPack(destId)
            ]);

            // Perform diff using pure function
            const diff = diffPacks(srcDocs, destDocs);

            // Emit hook for listeners
            const totalDifferences = diff.added.length + diff.removed.length + diff.changed.length;
            const hookData: CompendiumDiffedHookData = {
                srcId,
                destId,
                diff,
                totalDifferences
            };

            if ((globalThis as any).Hooks) {
                (globalThis as any).Hooks.callAll('avantCompendiumDiffed', hookData);
            }

            return diff;
        } catch (error) {
            throw new Error(`Failed to compare packs '${srcId}' and '${destId}': ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Copy documents from source pack to destination pack
     * 
     * Loads documents from the source pack and creates them in the destination
     * pack. Supports filtering to copy only specific documents. Handles
     * document creation, update conflicts, and ID preservation based on options.
     * 
     * @param {string} srcId - Source pack identifier to copy from
     * @param {string} destId - Destination pack identifier to copy to
     * @param {CopyDocsOptions} [options] - Optional filtering and copy behavior
     * @returns {Promise<void>} Resolves when copy operation completes
     * 
     * @throws {Error} If source/destination packs cannot be accessed or documents cannot be copied
     * 
     * @example
     * // Copy all documents
     * await service.copyDocs('world.all-weapons', 'world.backup-weapons');
     * 
     * // Copy only magical items
     * await service.copyDocs('world.equipment', 'world.magic-items', {
     *   filter: (doc) => doc.system?.magical === true
     * });
     * 
     * // Copy with ID preservation
     * await service.copyDocs('world.source', 'world.dest', {
     *   preserveIds: true,
     *   filter: (doc) => doc.system?.rarity === 'legendary'
     * });
     */
    async copyDocs(srcId: string, destId: string, options: CopyDocsOptions = {}): Promise<void> {
        this.ensureInitialized();

        if (!srcId || !destId) {
            throw new Error('Both source and destination pack IDs are required');
        }

        if (srcId === destId) {
            throw new Error('Cannot copy documents to the same pack');
        }

        const { filter, preserveIds = false } = options;

        try {
            // Load source documents
            const srcDocs = await this.loadPack(srcId);
            
            // Apply filter if provided
            const docsTooCopy = filter ? srcDocs.filter(filter) : srcDocs;
            
            if (docsTooCopy.length === 0) {
                // No documents to copy - emit hook with zero count
                const hookData: CompendiumCopiedHookData = {
                    srcId,
                    destId,
                    docsCopied: 0,
                    copiedNames: []
                };

                if ((globalThis as any).Hooks) {
                    (globalThis as any).Hooks.callAll('avantCompendiumCopied', hookData);
                }
                return;
            }

            // Get destination pack
            const destPack = (globalThis as any).game.packs.get(destId);
            if (!destPack) {
                throw new Error(`Destination pack '${destId}' not found`);
            }

            // Prepare documents for creation
            const copiedNames: string[] = [];
            const createData = docsTooCopy.map(doc => {
                const data = { ...doc };
                
                // Handle ID preservation
                if (!preserveIds) {
                    delete data._id;
                }
                
                copiedNames.push(data.name);
                return data;
            });

            // Batch create documents in destination pack
            await destPack.documentClass.createDocuments(createData, { pack: destPack.collection });

            // Emit success hook
            const hookData: CompendiumCopiedHookData = {
                srcId,
                destId,
                docsCopied: createData.length,
                copiedNames
            };

            if ((globalThis as any).Hooks) {
                (globalThis as any).Hooks.callAll('avantCompendiumCopied', hookData);
            }

        } catch (error) {
            throw new Error(`Failed to copy documents from '${srcId}' to '${destId}': ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get service initialization status
     * 
     * Returns whether the service has been initialized and is ready for use.
     * Primarily useful for testing and debugging purposes.
     * 
     * @returns {boolean} True if service is initialized and ready
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Reset service state (primarily for testing)
     * 
     * Resets the service to uninitialized state, forcing re-initialization
     * on next use. This is primarily useful for testing scenarios where
     * you need to simulate different initialization conditions.
     */
    reset(): void {
        this.initialized = false;
    }
} 