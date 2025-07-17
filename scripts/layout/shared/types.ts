/**
 * @fileoverview Shared Layout System Types
 * @description Common type definitions used by both item-sheet and item-card layout systems
 * @version 1.0.0
 * @author Avant Development Team
 */

/**
 * Generic Field type that matches existing template expectations
 */
export interface Field {
    type: string;
    name: string;
    [key: string]: unknown;
}

/**
 * Common fields that appear in all item types
 */
export interface BaseItemSystemData {
    description: string;
    traits: string[];
}

/**
 * Action item system data
 */
export interface ActionSystemData extends BaseItemSystemData {
    ability: 'might' | 'grace' | 'intellect' | 'focus';
    difficulty: number;
    apCost: number;
    ppCost: number;
}

/**
 * Feature item system data
 */
export interface FeatureSystemData extends BaseItemSystemData {
    source: string;
    category: string;
    uses: {
        value: number;
        max: number;
    };
    color: string;
    icon: string;
    localKey: string;
    isActive: boolean;
    powerPointCost: number;
}

/**
 * Talent item system data
 */
export interface TalentSystemData extends BaseItemSystemData {
    apCost: number;
    levelRequirement: number;
    tier: number;
    requirements: string;
    prerequisites: string;
    uses: {
        value: number;
        max: number;
    };
    isActive: boolean;
}

/**
 * Augment item system data
 */
export interface AugmentSystemData extends BaseItemSystemData {
    apCost: number;
    ppCost: number;
    levelRequirement: number;
    uses: {
        value: number;
        max: number;
    };
    augmentType: 'enhancement' | 'cybernetic' | 'biological' | 'neural';
    powerPointCost: number;
    isActive: boolean;
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    requirements: string;
}

/**
 * Weapon item system data
 */
export interface WeaponSystemData extends BaseItemSystemData {
    damageType: string;
    range: string;
    weight: number;
    cost: number;
    ability: 'might' | 'grace' | 'intellect' | 'focus';
    modifier: number;
    damageDie: string;
    properties: string;
    threshold: number;
    quantity: number;
    equipped: boolean;
    // Note: the template uses 'damageDie' but the code expects 'damage' 
    damage?: string;
}

/**
 * Armor item system data
 */
export interface ArmorSystemData extends BaseItemSystemData {
    weight: number;
    cost: number;
    ability: 'might' | 'grace' | 'intellect' | 'focus';
    modifier: number;
    threshold: number;
    damageReduction: number;
    armorType: 'light' | 'medium' | 'heavy';
    quantity: number;
    equipped: boolean;
    properties: string;
    // Note: the template uses 'threshold' but the code expects 'armorClass'
    armorClass?: number;
}

/**
 * Gear item system data
 */
export interface GearSystemData extends BaseItemSystemData {
    weight: number;
    cost: number;
    quantity: number;
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    category: string;
    isConsumable: boolean;
    uses: {
        value: number;
        max: number;
    };
}

/**
 * Trait item system data
 */
export interface TraitSystemData {
    description: string;
    color: string;
    icon: string;
    localKey: string;
    tags: string[];
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    effects: string;
    // Note: traits don't have a 'traits' field themselves
}

/**
 * Union type for all system data types
 */
export type ItemSystemData =
    | ActionSystemData
    | FeatureSystemData
    | TalentSystemData
    | AugmentSystemData
    | WeaponSystemData
    | ArmorSystemData
    | GearSystemData
    | TraitSystemData;

/**
 * Complete item data structure for the layout system
 */
export interface LayoutItemData {
    type: 'action' | 'feature' | 'talent' | 'augment' | 'weapon' | 'armor' | 'gear' | 'trait';
    name: string;
    img?: string;
    system: ItemSystemData;
} 