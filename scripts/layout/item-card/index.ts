/**
 * @fileoverview Item Card Layout System - Main API
 * @description Central exports for the card layout system
 * @version 0.1.0
 * @author Avant Development Team
 */

// Core types
export type {
    CardZone,
    CardSection,
    CardLayoutConfig,
    ButtonField,
    IconField,
    CardField
} from './types';

// Core helpers
export {
    cardLayout,
    getCardLayout,
    createCardButton,
    createCardIcon
} from './helpers';

// Item type specific layouts
export { getAugmentCardLayout } from './item-types/augment';
export { getTalentCardLayout } from './item-types/talent';
export { getWeaponCardLayout } from './item-types/weapon';
export { getArmorCardLayout } from './item-types/armor';
export { getGearCardLayout } from './item-types/gear';
export { getActionCardLayout } from './item-types/action';
export { getFeatureCardLayout } from './item-types/feature';

// Re-export layout system types for convenience
export type { Field } from '../shared/types';
export type { LayoutItemData } from '../shared/types';