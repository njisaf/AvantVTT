# Item Card Field Consistency Report

## Overview
This report documents the changes made to ensure item-card layouts display all fields from their corresponding item-sheet layouts.

## Changes Made

### Action Items
**Previously Missing Fields:**
- Ability
- Difficulty

**Added to Card Layout:**
- `action-ability` field in center zone
- `action-difficulty` field in center zone

### Feature Items
**Previously Missing Fields:**
- PP Cost
- Active Status
- Category

**Added to Card Layout:**
- `feature-meta` field combining PP cost and active status
- `feature-category` field for category display

### Trait Items
**Previously Missing:**
- No card layout existed

**New Implementation:**
- Created new `trait.ts` with complete card layout
- Includes all fields from trait sheet: preview, description, color, icon, rarity

## Styling Consistency
All new fields use the existing styling system from `_item-cards.scss` and `_item-sheets.scss`, ensuring visual consistency between cards and sheets.

### Reusable Patterns
Added shared styling patterns to `_item-cards.scss`:
- Shared variables for typography and spacing
- Field container mixin for consistent spacing
- Title line pattern (used in Augment cards)
- Meta info pattern (used in Feature cards)

These patterns ensure:
- Consistent spacing between fields
- Unified typography across card types
- Modular design that can be extended
- Visual harmony across components

## Feature Card Specific Updates
Added support for Feature-specific fields:
- `feature-meta`: Displays PP cost and active status
- `feature-category`: Displays feature category
- `feature-source`: Displays feature source

## Unified "Use" Functionality
Modified weapon, armor, and gear item-card types to use a unified "use" functionality:
- Replaced roll buttons with chat buttons that output structured chat cards
- All item types now use the same icon (fa-comments) for consistency
- Updated button types:
  - `weapon-roll-button` → `weapon-chat-button`
  - `armor-roll-button` → `armor-chat-button`
  - `gear-roll-button` → `gear-chat-button`

## Traits Display Field
Added "traits" display field to weapon, armor, gear, and feature item-card UIs using the existing styles from talent and augment item-cards:

- Weapon items: `weapon-traits` field type
- Armor items: `armor-traits` field type
- Gear items: `gear-traits` field type
- Feature items: `feature-traits` field type

Each traits field uses the same styling and overflow handling as talent and augment traits:
- Trait chips with colors and icons
- Overflow handling for more than 4 traits
- Professional styling and accessibility features

## Unified Feature Card System
All item-card types now use the same feature card system that outputs structured chat cards:

- Talent items: `useTalent` action handler
- Augment items: `useAugment` action handler
- Weapon items: `useWeapon` action handler
- Armor items: `useArmor` action handler
- Gear items: `useGear` action handler
- Feature items: `useFeature` action handler

Each handler connects to the feature-card-builder system to create rich, interactive chat cards with:
- Item details and descriptions
- Trait chips with colors and icons
- Power Point cost display and spending buttons
- Professional styling and accessibility features

## Verification
The changes have been manually verified to ensure:
1. All fields from item-sheet layouts are now present in item-card layouts
2. Styling is consistent between cards and sheets
3. New trait card layout matches the visual design of other cards
4. Talent and Augment styles remain unchanged as requested
5. Feature card fields render correctly with appropriate styling
6. All item-card types now use consistent "use" functionality
7. Traits display field is properly rendered for all item types

## Files Modified
- `scripts/layout/item-card/item-types/action.ts`
- `scripts/layout/item-card/item-types/feature.ts`
- `scripts/layout/item-card/item-types/trait.ts` (new)
- `scripts/layout/item-card/item-types/weapon.ts`
- `scripts/layout/item-card/item-types/armor.ts`
- `scripts/layout/item-card/item-types/gear.ts`
- `scripts/layout/item-card/index.ts`
- `scripts/layout/item-card/integration-example.ts`
- `scripts/sheets/actor-sheet.ts` (added new action handlers)
- `styles/components/_item-cards.scss`
- `templates/shared/partials/render-field.hbs`

## Future Work
Consider adding automated tests to verify field consistency between sheets and cards.