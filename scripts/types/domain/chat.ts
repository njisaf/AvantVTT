/**
 * @fileoverview Chat Domain Types for Talents & Augments
 * @version 1.0.0 - Phase 3: TypeScript Conversion
 * @description Type definitions for chat integration, feature cards, and power point system
 * @author Avant VTT Team
 */

import type { Item, Actor } from '../foundry/index';

/**
 * Result of posting a feature card to chat
 */
export interface PostFeatureCardResult {
    success: boolean;
    messageId?: string;
    message?: any;
    error?: string;
}

/**
 * Result of building feature card HTML
 */
export interface BuildFeatureCardResult {
    success: boolean;
    html?: string;
    item?: Item;
    actor?: Actor;
    error?: string;
}

/**
 * Chat API interface for talents and augments
 */
export interface ChatAPI {
    postTalentCard: (itemId: string, actorId?: string | null, options?: Record<string, unknown>) => Promise<PostFeatureCardResult>;
    postAugmentCard: (itemId: string, actorId?: string | null, options?: Record<string, unknown>) => Promise<PostFeatureCardResult>;
    postFeatureCard: (itemId: string, actorId?: string | null, options?: Record<string, unknown>) => Promise<PostFeatureCardResult>;
    buildFeatureCardHtml: (itemId: string, actorId?: string | null) => Promise<BuildFeatureCardResult>;
}

/**
 * Result of chat integration initialization
 */
export interface ChatIntegrationResult {
    success: boolean;
    api?: ChatAPI;
    error?: string;
}

/**
 * Metadata item for feature card display
 */
export interface FeatureCardMetadata {
    label: string;
    value: string;
}

/**
 * Template data for feature cards
 */
export interface FeatureCardTemplateData extends Record<string, unknown> {
    itemId: string;
    actorId: string;
    featureName: string;
    featureType: string;
    description: string;
    traits?: string;
    metadata?: FeatureCardMetadata[] | null;
    powerPointSection?: string | null;
}

/**
 * Power point validation result
 */
export interface PowerPointValidationResult {
    valid: boolean;
    error?: string;
    currentPP?: number;
    newValue?: number;
}

/**
 * Result of power point spending operation
 */
export interface PowerPointSpendResult {
    success: boolean;
    newValue?: number;
    spent?: number;
    previousValue?: number;
    error?: string;
}

/**
 * Power point button data for UI generation
 */
export interface PowerPointButtonData {
    cost: number;
    showButton: boolean;
    disabled: boolean;
    buttonText: string;
    tooltip: string;
    ariaLabel: string;
    canAfford: boolean;
}

/**
 * Template data for power point buttons
 */
export interface PowerPointButtonTemplateData extends Record<string, unknown> {
    cost: number;
    actorId: string;
    itemId: string;
    disabled: boolean;
    buttonText: string;
    ariaLabel: string;
    description: string;
}

/**
 * Options for power point handler initialization
 */
export interface PowerPointHandlerOptions {
    selector?: string;
}

/**
 * Feature card styling options
 */
export interface FeatureCardStyleOptions {
    theme?: 'dark' | 'light' | 'custom';
    compact?: boolean;
    showTraits?: boolean;
    showMetadata?: boolean;
    customClasses?: string[];
}

/**
 * Chat message options for feature cards
 */
export interface FeatureCardChatOptions {
    whisper?: string[];
    blind?: boolean;
    flavor?: string;
    sound?: string;
    type?: number;
    speaker?: any;
    content?: string;
}

/**
 * Feature card export data
 */
export interface FeatureCardExportData {
    name: string;
    type: 'talent' | 'augment';
    system: {
        description: string;
        powerPointCost?: number;
        tier?: string;
        augmentType?: string;
        rarity?: string;
        prerequisites?: string;
        traits?: string[];
        [key: string]: any;
    };
    img?: string;
    flags?: Record<string, any>;
}

/**
 * Batch operation result for multiple feature cards
 */
export interface BatchFeatureCardResult {
    success: boolean;
    processed: number;
    failed: number;
    results: PostFeatureCardResult[];
    errors: string[];
}

/**
 * Feature card validation result
 */
export interface FeatureCardValidation {
    valid: boolean;
    errors: string[];
    warnings: string[];
    item?: Item;
    actor?: Actor;
}

/**
 * Chat integration configuration
 */
export interface ChatIntegrationConfig {
    enablePowerPoints?: boolean;
    enableTraitDisplay?: boolean;
    enableMetadata?: boolean;
    defaultCardStyle?: FeatureCardStyleOptions;
    powerPointSelector?: string;
    autoCleanup?: boolean;
} 