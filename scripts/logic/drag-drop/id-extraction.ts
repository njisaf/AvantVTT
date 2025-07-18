/**
 * @fileoverview FoundryVTT Drag-and-Drop ID Extraction Utilities
 * @version 1.0.0
 * @author Avant VTT Team
 * 
 * This module contains the comprehensive ID extraction strategies developed for 
 * the unified native ID system. These utilities can be used for ANY FoundryVTT
 * document type, not just traits.
 * 
 * ARCHITECTURE: Uses FoundryVTT's native randomID() format as the primary standard,
 * with robust fallback strategies for legacy compatibility.
 */

/**
 * Result of ID extraction operation
 */
export interface IdExtractionResult {
    /** Successfully extracted ID */
    id: string | null;
    /** Strategy that succeeded in extracting the ID */
    strategy: string;
    /** Whether the ID matches FoundryVTT native format */
    isNativeFormat: boolean;
    /** Confidence level of the extraction */
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    /** Additional metadata about the extraction */
    metadata?: {
        uuid?: string;
        sourceProperty?: string;
        validationPassed?: boolean;
        compendiumType?: 'system' | 'custom' | 'unknown';
    };
}

/**
 * Configuration for ID extraction
 */
export interface IdExtractionConfig {
    /** Enable comprehensive logging */
    enableLogging?: boolean;
    /** Require native format validation */
    requireNativeFormat?: boolean;
    /** Custom validation function */
    customValidator?: (id: string) => boolean;
}

/**
 * Extract FoundryVTT document ID from dropped item using comprehensive strategies
 * 
 * This function implements the unified native ID extraction system that works
 * consistently across all compendium types (system and custom).
 * 
 * EXTRACTION STRATEGIES (in priority order):
 * 1. Native UUID ID extraction - Primary strategy for all modern items
 * 2. Direct ID properties - Backup for items with accessible _id/id
 * 3. Legacy UUID parsing - Fallback for unusual UUID formats
 * 4. Deprecated methods - Last resort with warnings
 * 
 * @param droppedItem - The item data from drag-and-drop event
 * @param config - Optional configuration for extraction behavior
 * @returns Result object with extracted ID and metadata
 * 
 * @example
 * ```typescript
 * const result = extractDocumentId(droppedTrait, { enableLogging: true });
 * if (result.id) {
 *     console.log(`Extracted ID: ${result.id} using ${result.strategy}`);
 * }
 * ```
 */
export function extractDocumentId(
    droppedItem: any,
    config: IdExtractionConfig = {}
): IdExtractionResult {
    const { enableLogging = false, requireNativeFormat = false, customValidator } = config;

    if (enableLogging) {
        console.group('🔍 DOCUMENT ID EXTRACTION');
        console.log('📦 Dropped Item Analysis:', {
            name: droppedItem?.name,
            type: droppedItem?.type,
            uuid: droppedItem?.uuid,
            pack: droppedItem?.pack,
            hasDirectId: !!(droppedItem?._id || droppedItem?.id)
        });
    }

    let extractedId: string | null = null;
    let strategy = 'none';
    let isNativeFormat = false;
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    let metadata: any = {};

    // ========================================================================
    // 🥇 STRATEGY 1: Native UUID ID Extraction (PRIMARY)
    // ========================================================================
    if (!extractedId && droppedItem.uuid && typeof droppedItem.uuid === 'string') {
        if (enableLogging) {
            console.log('🔍 Strategy 1: Analyzing UUID structure');
        }

        const uuidParts = droppedItem.uuid.split('.');
        if (uuidParts.length >= 5 && uuidParts[3] === 'Item') {
            const candidateId = uuidParts[4];

            // Validate native FoundryVTT ID format (16-character alphanumeric)
            const isValidNative = candidateId &&
                candidateId.length === 16 &&
                /^[A-Za-z0-9]{16}$/.test(candidateId);

            if (isValidNative || !requireNativeFormat) {
                extractedId = candidateId;
                strategy = 'native_uuid_extraction';
                isNativeFormat = isValidNative;
                confidence = 'HIGH';
                metadata = {
                    uuid: droppedItem.uuid,
                    sourceProperty: 'uuid',
                    validationPassed: isValidNative,
                    compendiumType: droppedItem.pack?.includes('.avant-') ? 'system' : 'custom'
                };

                if (enableLogging) {
                    console.log('✅ Strategy 1 SUCCESS: Native UUID extraction', {
                        extractedId,
                        isNativeFormat,
                        metadata
                    });
                }
            }
        }
    }

    // ========================================================================
    // 🥈 STRATEGY 2: Direct ID Properties (BACKUP)
    // ========================================================================
    if (!extractedId && droppedItem._id && typeof droppedItem._id === 'string') {
        const candidateId = droppedItem._id;
        const isValidNative = candidateId.length === 16 && /^[A-Za-z0-9]{16}$/.test(candidateId);

        if (isValidNative || !requireNativeFormat) {
            extractedId = candidateId;
            strategy = isValidNative ? 'native_direct_id' : 'legacy_direct_id';
            isNativeFormat = isValidNative;
            confidence = isValidNative ? 'HIGH' : 'MEDIUM';
            metadata = {
                sourceProperty: '_id',
                validationPassed: isValidNative
            };

            if (enableLogging) {
                console.log('✅ Strategy 2 SUCCESS: Direct _id extraction', {
                    extractedId,
                    isNativeFormat,
                    metadata
                });
            }
        }
    }

    // Alternative: id property
    if (!extractedId && droppedItem.id && typeof droppedItem.id === 'string') {
        const candidateId = droppedItem.id;
        const isValidNative = candidateId.length === 16 && /^[A-Za-z0-9]{16}$/.test(candidateId);

        if (isValidNative || !requireNativeFormat) {
            extractedId = candidateId;
            strategy = isValidNative ? 'native_id_property' : 'legacy_id_property';
            isNativeFormat = isValidNative;
            confidence = isValidNative ? 'HIGH' : 'MEDIUM';
            metadata = {
                sourceProperty: 'id',
                validationPassed: isValidNative
            };

            if (enableLogging) {
                console.log('✅ Strategy 2B SUCCESS: Direct id property extraction', {
                    extractedId,
                    isNativeFormat,
                    metadata
                });
            }
        }
    }

    // ========================================================================
    // 🥉 STRATEGY 3: Legacy UUID Parsing (FALLBACK)
    // ========================================================================
    if (!extractedId && droppedItem.uuid && typeof droppedItem.uuid === 'string') {
        const uuidParts = droppedItem.uuid.split('.');
        if (uuidParts.length >= 4) {
            const lastPart = uuidParts[uuidParts.length - 1];
            if (lastPart && lastPart.length > 0) {
                extractedId = lastPart;
                strategy = 'legacy_uuid_parsing';
                isNativeFormat = false;
                confidence = 'MEDIUM';
                metadata = {
                    uuid: droppedItem.uuid,
                    sourceProperty: 'uuid_last_part',
                    validationPassed: false
                };

                if (enableLogging) {
                    console.log('✅ Strategy 3 SUCCESS: Legacy UUID parsing', {
                        extractedId,
                        metadata
                    });
                }
            }
        }
    }

    // ========================================================================
    // 🚨 STRATEGY 4: Name-based Slug (DEPRECATED)
    // ========================================================================
    if (!extractedId && droppedItem.name && typeof droppedItem.name === 'string' && !requireNativeFormat) {
        const nameSlug = droppedItem.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        if (nameSlug && nameSlug.length > 0) {
            extractedId = nameSlug;
            strategy = 'deprecated_name_slug';
            isNativeFormat = false;
            confidence = 'LOW';
            metadata = {
                originalName: droppedItem.name,
                sourceProperty: 'name_derived',
                validationPassed: false,
                warning: 'DEPRECATED: Name-based IDs are incompatible with unified native ID system'
            };

            if (enableLogging) {
                console.warn('⚠️ Strategy 4 SUCCESS: Name-based slug (DEPRECATED)', {
                    extractedId,
                    metadata
                });
            }
        }
    }

    // Apply custom validation if provided
    if (extractedId && customValidator && !customValidator(extractedId)) {
        if (enableLogging) {
            console.warn('❌ Custom validation failed for extracted ID:', extractedId);
        }
        extractedId = null;
        strategy = 'custom_validation_failed';
        confidence = 'LOW';
    }

    if (enableLogging) {
        console.log('🎯 FINAL EXTRACTION RESULT:', {
            success: !!extractedId,
            extractedId,
            strategy,
            isNativeFormat,
            confidence,
            metadata
        });
        console.groupEnd();
    }

    return {
        id: extractedId,
        strategy,
        isNativeFormat,
        confidence,
        metadata
    };
}

/**
 * Validate that an ID matches FoundryVTT native format
 * 
 * @param id - The ID to validate
 * @returns True if ID matches native 16-character alphanumeric format
 */
export function isNativeFoundryId(id: string): boolean {
    return id.length === 16 && /^[A-Za-z0-9]{16}$/.test(id);
}

/**
 * Extract compendium type from UUID or pack information
 * 
 * @param droppedItem - The dropped item
 * @returns The compendium type classification
 */
export function getCompendiumType(droppedItem: any): 'system' | 'custom' | 'unknown' {
    if (droppedItem.pack) {
        if (droppedItem.pack.includes('.avant-') || droppedItem.pack.startsWith('avant.')) {
            return 'system';
        }
        if (droppedItem.pack.includes('world.') || droppedItem.pack.includes('custom')) {
            return 'custom';
        }
    }

    if (droppedItem.uuid) {
        if (droppedItem.uuid.includes('.avant.') || droppedItem.uuid.includes('.avant-')) {
            return 'system';
        }
        if (droppedItem.uuid.includes('.world.') || droppedItem.uuid.includes('.custom')) {
            return 'custom';
        }
    }

    return 'unknown';
} 