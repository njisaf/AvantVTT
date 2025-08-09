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

## Action System (Talent Actions)

The new action system replaces the legacy `apCost` field with a more flexible `action` object that supports different action modes:

- **immediate**: Standard actions that happen immediately
- **simultaneous**: Actions that happen at the same time as another action
- **variable**: Actions with variable costs

### Action Object Structure

```typescript
{
  mode: 'immediate' | 'simultaneous' | 'variable';
  cost: number | null;        // For immediate/simultaneous modes
  minCost: number | null;     // For variable mode minimum
  maxCost: number | null;    // For variable mode maximum
  free: boolean;              // Convenience flag for cost === 0
}
```

### Displaying Actions

To display action information in item sheets or cards, use the helper functions:

```typescript
import { formatTalentAP, getActionIcon } from '../utils/formatTalentAP';

// Format the AP cost string for display
const apString = formatTalentAP(action);

// Get the appropriate Font Awesome icon class
const iconClass = getActionIcon(action);
```

### Example: Adding Action Display to an Item Sheet

```typescript
// in scripts/layout/item-sheet/item-types/talent.ts
import { formatTalentAP, getActionIcon } from '../../../utils/formatTalentAP';

function actionField(action: TalentAction, itemType: string): Field | null {
  const apString = formatTalentAP(action);
  const iconClass = getActionIcon(action);
  
  return {
    type: 'text',
    name: 'system.action.display',
    value: apString,
    label: 'Action',
    icon: iconClass,
    readonly: true,
    class: `${itemType}-action-display`
  };
}

export function body(item: LayoutItemData): Field[] {
    const system = item.system as TalentSystemData;

    return filterFields([
        sideBy(
            actionField(system.action, 'talent'),
            commonFields.levelRequirement(system.levelRequirement, 'talent'),
        ),
        // ... other fields
    ]);
}
```

## Action Display Recipe

This recipe shows how to implement a read-only action display field for any item type that supports the new action system.

### Implementation Steps

1. **Import the helper functions**:
   ```typescript
   import { formatTalentAP, getActionIcon } from '../../../utils/formatTalentAP';
   ```

2. **Create a field function for action display**:
   ```typescript
   function actionDisplayField(action: TalentAction, itemType: string): Field | null {
     // Handle undefined action (e.g., for new items)
     if (!action) {
       return {
         type: 'text',
         name: 'system.action.display',
         value: 'AP: — (set later)',
         label: 'Action',
         readonly: true,
         class: `${itemType}-action-display muted`
       };
     }
     
     const apString = formatTalentAP(action);
     const iconClass = getActionIcon(action);
     
     return {
       type: 'text',
       name: 'system.action.display',
       value: apString,
       label: 'Action',
       icon: iconClass,
       readonly: true,
       class: `${itemType}-action-display`
     };
   }
   ```

3. **Use the field in your layout**:
   ```typescript
   export function body(item: LayoutItemData): Field[] {
       const system = item.system as TalentSystemData;
       
       return filterFields([
           sideBy(
               actionDisplayField(system.action, item.type),
               commonFields.levelRequirement(system.levelRequirement, item.type),
           ),
           // ... other fields
       ]);
   }
   ```

4. **Add styling support** (in your SCSS files):
   ```scss
   .talent-action-display {
     // Style the action display field
     font-weight: 500;
     
     // Style for muted/placeholder state
     &.muted {
       color: #999;
       font-style: italic;
     }
   }
   ```

### Supported Action Modes

The action display system supports three modes:

1. **Immediate**: Standard actions with fixed cost
   - Display: "X AP" (where X is the cost)
   - Icon: `fa-regular fa-circle-dot` (●)

2. **Simultaneous**: Actions that happen at the same time
   - Display: "X AP ⊕ simultaneous" 
   - Icon: `fa-clone`

3. **Variable**: Actions with variable costs
   - Display: "AP: X–Y" (range) or "AP: X+" (minimum) or "AP: ?" (unknown)
   - Icon: `fa-sliders`

### Helper Functions

The `formatTalentAP` and `getActionIcon` functions handle all the complexity of formatting and icon selection:

- `formatTalentAP(action)`: Returns a formatted string for display
- `getActionIcon(action)`: Returns the appropriate Font Awesome icon class

These functions are fully tested and handle all edge cases including:
- Free actions (cost = 0)
- Variable cost ranges
- Missing or invalid action data
- New items with undefined actions