# AvantVTT Layout System

This document outlines the architecture and process for adding new fields to item sheets using the declarative layout system.

## Core Concepts

The layout system is designed to be declarative, data-driven, and type-safe. It separates the **definition** of a layout from its **rendering**, which allows for greater consistency and easier maintenance.

- **Data Models (`scripts/data/item-data.js`):** This is the single source of truth for the data schema of all item types. **Any new field that needs to be saved must be registered here first.**
- **Layout Definitions (`scripts/layout/item-sheet/item-types/`):** These TypeScript modules define the structure of each item sheet's header and body by arranging fields.
- **Shared Helpers (`scripts/layout/shared/helpers.ts`):** This file contains reusable functions for creating and arranging fields (e.g., `field`, `when`, `sideBy`).
- **Templates (`templates/`):** The Handlebars templates that render the final HTML. The system uses a universal template (`universal-item-sheet.html`) and a series of partials to render the fields defined in the layout modules.

## How to Add a New Field (Step-by-Step)

This is the definitive, step-by-step process for adding a new, savable field to an item sheet. Following these steps will ensure the field is correctly registered, rendered, and persisted.

### Step 1: Register the Field in the Core Data Model

This is the most critical step. If a field is not registered in the core data model, **it will not be saved.**

1.  Open [`scripts/data/item-data.js`](/scripts/data/item-data.js).
2.  Locate the data model class for the item type you want to modify (e.g., `AvantWeaponData`).
3.  Inside the `defineSchema` method, add a new field to the returned object. Use the appropriate `foundry.data.fields` type (e.g., `NumberField`, `StringField`, `BooleanField`).

**Example: Adding `expertise` to `AvantWeaponData`**

```javascript
// in scripts/data/item-data.js, inside AvantWeaponData.defineSchema()
            ...
            properties: new fields.StringField({ ... }),
            expertise: new fields.NumberField({
                required: true,
                initial: 0,
                integer: true,
                min: 0
            }),
            traits: new fields.ArrayField(...)
...
```

### Step 2: Update the TypeScript Interfaces

To maintain type safety, update the relevant TypeScript interfaces to include the new field.

1.  Open [`scripts/layout/shared/types.ts`](/scripts/layout/shared/types.ts).
2.  Add the new property to the appropriate system data interface (e.g., `WeaponSystemData`).

**Example: Adding `expertise` to `WeaponSystemData`**

```typescript
// in scripts/layout/shared/types.ts
export interface WeaponSystemData extends BaseItemSystemData {
    // ... other properties
    expertise?: number;
}
```

### Step 3: Add the Field to the Layout Definition

Tell the layout system where to render the new field.

1.  Open the layout definition file for your item type (e.g., [`scripts/layout/item-sheet/item-types/weapon.ts`](/scripts/layout/item-sheet/item-types/weapon.ts)).
2.  In the `body` function (or `header`, if appropriate), add a call to create the field. It is highly recommended to create a reusable helper in `commonFields` if the field will be used across multiple item types.

**Example: Creating a common helper**

```typescript
// in scripts/layout/shared/helpers.ts, inside the commonFields object
    expertise: (value: number | undefined, itemType: string) => when(value !== undefined, () => field({
        type: 'number',
        name: 'system.expertise',
        value: value,
        label: 'Expertise',
        min: 0,
        step: 1, // Ensures integer values
        placeholder: '0',
        hint: 'Expertise bonus for this item',
        class: `${itemType}-expertise`
    })),
```

**Example: Using the helper in the layout**

```typescript
// in scripts/layout/item-sheet/item-types/weapon.ts, inside the body() function
export function body(item: LayoutItemData): Field[] {
    const system = item.system as WeaponSystemData;
    return filterFields([
        // ... other fields
        commonFields.expertise(system.expertise, 'weapon'),
        // ... other fields
    ]);
}
```

### Step 4: Add a Default Value for New Items

To ensure new items created in the sidebar have the field initialized, add a default value to `template.json`.

1.  Open [`template.json`](/template.json).
2.  Find the appropriate item type and add the new field with its default value.

**Example: Adding `expertise` to the weapon template**

```json
// in template.json, under Item.weapon
    "weapon": {
        ...
        "expertise": 0,
        "traits": []
    },
```

### Step 5: Handle Existing Items (Optional, but Recommended)

For items that existed before this change, the new field will be `undefined`. You must handle this to ensure the field renders correctly.

1.  Open [`scripts/layout/item-sheet/index.ts`](/scripts/layout/item-sheet/index.ts).
2.  In the `getBodyLayout` function, add logic to check for the item type and default the value if it's missing.

**Example: Defaulting `expertise`**

```typescript
// in scripts/layout/item-sheet/index.ts
export function getBodyLayout(item: LayoutItemData): Field[] {
    // ...
    try {
        if (item.type === 'weapon' || item.type === 'armor' || item.type === 'gear') {
            const system = item.system as WeaponSystemData | ArmorSystemData | GearSystemData;
            if (typeof system.expertise === 'undefined') {
                const itemCopyWithDefault = {
                    ...item,
                    system: {
                        ...item.system,
                        expertise: 0
                    }
                };
                return module.body(itemCopyWithDefault);
            }
        }
        return module.body(item);
    }
    // ...
}
```

By following these five steps, you can add any new field to the system with confidence that it will be correctly registered, typed, rendered, and saved.