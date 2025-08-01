# ADR 0011: Add Expertise Field to Core Item Types

**Date:** 2025-08-01
**Status:** Accepted

## Context

We needed a standardized way to represent an item's "expertise" — a numeric value indicating mastery or quality — on weapons, armor, and gear. This required a new field that was visually consistent with existing inputs and whose value would be correctly saved with the item's data.

## Decision

We decided to add an `expertise` integer field to the data model for `weapon`, `armor`, and `gear` item types. The implementation involved these key steps:

1.  **Data Schema Registration:** The `expertise` field was added to the schema definitions in `scripts/data/item-data.js` for `AvantWeaponData`, `AvantArmorData`, and `AvantGearData`. This was the most critical step, as it formally registers the new property in the core data model, ensuring it's available for both new and existing items. The field is a `NumberField` with an initial value of `0`, and is restricted to integers.

2.  **Layout System Integration:**
    *   A new `expertise` helper was added to the `commonFields` object in `scripts/layout/shared/helpers.ts`. This provides a reusable, declarative way to add the field to any item sheet layout.
    *   The `body` layout functions in `scripts/layout/item-sheet/item-types/weapon.ts`, `armor.ts`, and `gear.ts` were updated to call this new helper, placing the expertise field consistently in the UI.

3.  **Default Value Handling:**
    *   A default value of `0` was added to `template.json` for all three item types. This ensures that new items created from the sidebar will have the `expertise` field from the start.
    *   To handle existing items that predate this change, logic was added to `scripts/layout/item-sheet/index.ts` to check for and default the `expertise` value to `0` before rendering the sheet.

4.  **Type-Safety:** All relevant TypeScript interfaces, including `WeaponSystemData`, `ArmorSystemData`, and `GearSystemData`, were updated to include the `expertise` property.

## Consequences

*   All weapons, armor, and gear now have a unified `expertise` field that can be used for future game mechanics.
*   The implementation followed the existing declarative layout system, promoting code consistency and maintainability.
*   The process of debugging this feature highlighted the importance of registering new fields in the core data model, a lesson that will be documented to prevent future issues.