# Declarative Layout System

**Version**: 1.0.0  
**Author**: Avant Development Team  
**Last Updated**: 2025-07-16

## Overview

The Declarative Layout System is a powerful, type-safe DSL (Domain-Specific Language) for defining item sheet layouts in a maintainable, reusable way. It replaces the previous 200+ line switch statements with clean, declarative configuration files.

## Key Benefits

- **🔧 Maintainable**: Each item type has its own layout file
- **🎯 Type-Safe**: Full TypeScript support with proper interfaces
- **📱 Responsive**: Built-in support for full-width and side-by-side layouts
- **🔄 Reusable**: Common field definitions shared across item types
- **🎨 Consistent**: Uniform field ordering and styling
- **🚀 Performance**: Optimized field generation and rendering

## Architecture

```
scripts/layout/
├── index.ts           # Central registry and API
├── helpers.ts         # DSL helpers and common fields
├── types.ts          # Type definitions
└── item-types/       # Individual item type layouts
    ├── weapon.ts
    ├── armor.ts
    ├── talent.ts
    ├── augment.ts
    └── ...
```

## Core Concepts

### 1. Fields

Fields are the building blocks of your layout. They define form inputs and their properties:

```typescript
import { field } from '../helpers';

const damageField = field({
    type: 'text',
    name: 'system.damage',
    value: system.damage,
    label: 'Damage',
    placeholder: '1d8',
    hint: 'Damage roll for this weapon'
});
```

### 2. Layout Functions

Each item type exports two functions:

- `header(item)`: Returns fields for the header section
- `body(item)`: Returns fields for the body section

```typescript
export function header(item: LayoutItemData): Field[] {
    const system = item.system as WeaponSystemData;
    return filterFields([
        commonFields.apCost(system.apCost, 'weapon')
    ]);
}

export function body(item: LayoutItemData): Field[] {
    const system = item.system as WeaponSystemData;
    return filterFields([
        commonFields.description(system.description, 'weapon'),
        commonFields.traits(system.traits, 'weapon')
    ]);
}
```

## DSL Helpers

### `field(config)`

Creates a field with the specified configuration:

```typescript
const weightField = field({
    type: 'number',
    name: 'system.weight',
    value: system.weight || 0,
    label: 'Weight',
    min: 0,
    step: 0.1,
    placeholder: '0',
    hint: 'Weight in pounds'
});
```

### `when(condition, fieldFactory)`

Conditionally includes a field:

```typescript
const fields = filterFields([
    when(system.damage, () => field({
        type: 'text',
        name: 'system.damage',
        value: system.damage,
        label: 'Damage'
    })),
    when(system.apCost !== undefined, () => commonFields.apCost(system.apCost, 'weapon'))
]);
```

### `fullWidth(field)`

Makes a field span the full width of the container:

```typescript
const description = fullWidth(field({
    type: 'description',
    name: 'system.description',
    value: system.description,
    label: 'Description',
    rows: 6
}));
```

### `sideBy(fieldA, fieldB)`

**NEW**: Places two fields side by side in a single row:

```typescript
const weightAndCost = sideBy(
    field({
        type: 'number',
        name: 'system.weight',
        value: system.weight,
        label: 'Weight'
    }),
    field({
        type: 'number',
        name: 'system.cost',
        value: system.cost,
        label: 'Cost'
    })
);
```

### `filterFields(fields)`

Removes null values from conditional fields:

```typescript
const fields = filterFields([
    when(condition1, () => field({...})),
    field({...}),
    when(condition2, () => field({...}))
]);
```

## Common Fields

Pre-built field configurations for consistency:

```typescript
import { commonFields } from '../helpers';

// Available common fields:
commonFields.apCost(value, itemType)           // AP cost selector
commonFields.ppCost(value, itemType)           // PP cost number field
commonFields.description(value, itemType)      // Description textarea (full-width)
commonFields.weight(value, itemType)           // Weight number field
commonFields.cost(value, itemType)             // Cost number field
commonFields.ability(value, itemType)          // Ability dropdown
commonFields.levelRequirement(value, itemType) // Level requirement field
commonFields.requirements(value, itemType)     // Requirements textarea
commonFields.traits(value, itemType)           // Traits field (full-width)
commonFields.image(value, itemType)            // Image upload field
commonFields.name(value, itemType)             // Item name text field
```

## Field Types

### Standard Input Types

- `text`: Single-line text input
- `number`: Number input with min/max/step
- `textarea`: Multi-line text input
- `select`: Dropdown selection
- `checkbox`: Boolean checkbox

### Special Types

- `description`: Rich text area for descriptions
- `traits`: Trait chip input with autocomplete
- `ap-selector`: Action Point cost selector (1-3 dots)
- `image-upload`: Image upload component with preview
- `uses-counter`: Current/max counter display

## Layout Examples

### Simple Item Layout

```typescript
// scripts/layout/item-types/gear.ts
import { field, when, fullWidth, filterFields, commonFields } from '../helpers';
import type { Field } from '../helpers';
import type { LayoutItemData, GearSystemData } from '../types';

export function header(item: LayoutItemData): Field[] {
    const system = item.system as GearSystemData;
    return filterFields([
        commonFields.weight(system.weight, 'gear'),
        commonFields.cost(system.cost, 'gear')
    ]);
}

export function body(item: LayoutItemData): Field[] {
    const system = item.system as GearSystemData;
    return filterFields([
        commonFields.description(system.description, 'gear'),
        commonFields.traits(system.traits, 'gear')
    ]);
}
```

### Advanced Layout with Side-by-Side Fields

```typescript
// scripts/layout/item-types/weapon.ts
import { field, when, fullWidth, sideBy, filterFields, commonFields } from '../helpers';
import type { Field } from '../helpers';
import type { LayoutItemData, WeaponSystemData } from '../types';

export function header(item: LayoutItemData): Field[] {
    const system = item.system as WeaponSystemData;
    return filterFields([
        // Image and name side-by-side (standard pattern)
        sideBy(
            commonFields.image(item.img, 'weapon'),
            commonFields.name(item.name, 'weapon')
        ),
        
        // AP cost on its own row
        commonFields.apCost(system.apCost, 'weapon')
    ]);
}

export function body(item: LayoutItemData): Field[] {
    const system = item.system as WeaponSystemData;
    return filterFields([
        // Full-width description first
        commonFields.description(system.description, 'weapon'),
        
        // Side-by-side damage and ability
        sideBy(
            field({
                type: 'text',
                name: 'system.damage',
                value: system.damage,
                label: 'Damage',
                placeholder: '1d8',
                hint: 'Damage roll for this weapon'
            }),
            commonFields.ability(system.ability, 'weapon')
        ),
        
        // Side-by-side weight and cost
        sideBy(
            commonFields.weight(system.weight, 'weapon'),
            commonFields.cost(system.cost, 'weapon')
        ),
        
        // Full-width traits at the end
        commonFields.traits(system.traits, 'weapon')
    ]);
}
```

### Conditional Fields

```typescript
export function body(item: LayoutItemData): Field[] {
    const system = item.system as AugmentSystemData;
    return filterFields([
        commonFields.description(system.description, 'augment'),
        
        // Only show rarity for rare+ augments
        when(system.rarity && system.rarity !== 'common', () => field({
            type: 'select',
            name: 'system.rarity',
            value: system.rarity,
            label: 'Rarity',
            options: [
                { value: 'uncommon', label: 'Uncommon' },
                { value: 'rare', label: 'Rare' },
                { value: 'epic', label: 'Epic' },
                { value: 'legendary', label: 'Legendary' }
            ]
        })),
        
        // Conditional side-by-side fields
        when(system.apCost || system.ppCost, () => sideBy(
            commonFields.apCost(system.apCost, 'augment'),
            commonFields.ppCost(system.ppCost, 'augment')
        )),
        
        commonFields.traits(system.traits, 'augment')
    ]);
}
```

## Creating a New Item Type

1. **Create the layout file**: `scripts/layout/item-types/my-item.ts`

```typescript
import { field, when, fullWidth, sideBy, filterFields, commonFields } from '../helpers';
import type { Field } from '../helpers';
import type { LayoutItemData, MyItemSystemData } from '../types';

export function header(item: LayoutItemData): Field[] {
    const system = item.system as MyItemSystemData;
    return filterFields([
        // Header fields here
        commonFields.apCost(system.apCost, 'my-item')
    ]);
}

export function body(item: LayoutItemData): Field[] {
    const system = item.system as MyItemSystemData;
    return filterFields([
        // Body fields here
        commonFields.description(system.description, 'my-item'),
        commonFields.traits(system.traits, 'my-item')
    ]);
}
```

2. **Add type definitions**: Update `scripts/layout/types.ts`

```typescript
export interface MyItemSystemData {
    apCost?: number;
    description?: string;
    traits?: string[];
    // ... other fields
}
```

3. **Register the item type**: Update `scripts/layout/index.ts`

```typescript
import * as myItem from './item-types/my-item';

const layoutRegistry = {
    'weapon': weapon,
    'armor': armor,
    'talent': talent,
    'augment': augment,
    'my-item': myItem  // Add this line
};
```

## Best Practices

### 1. Field Ordering

Order fields logically from most to least important:

```typescript
return filterFields([
    // 1. Key identifying fields (AP cost, damage, etc.)
    commonFields.apCost(system.apCost, itemType),
    
    // 2. Description (always full-width)
    commonFields.description(system.description, itemType),
    
    // 3. Primary stats (side-by-side when appropriate)
    sideBy(
        commonFields.weight(system.weight, itemType),
        commonFields.cost(system.cost, itemType)
    ),
    
    // 4. Secondary requirements
    commonFields.levelRequirement(system.levelRequirement, itemType),
    commonFields.requirements(system.requirements, itemType),
    
    // 5. Traits (always last, full-width)
    commonFields.traits(system.traits, itemType)
]);
```

### 2. Use Common Fields

Prefer `commonFields` over custom fields for consistency:

```typescript
// ✅ Good: Uses common field
commonFields.apCost(system.apCost, 'weapon')

// ❌ Avoid: Custom field that duplicates common functionality
field({
    type: 'ap-selector',
    name: 'system.apCost',
    value: system.apCost,
    label: 'AP',
    max: 3
})
```

### 3. Group Related Fields

Use `sideBy` for related fields that should appear together:

```typescript
// ✅ Good: Related fields side by side
sideBy(
    commonFields.weight(system.weight, itemType),
    commonFields.cost(system.cost, itemType)
)

// ❌ Avoid: Unrelated fields side by side
sideBy(
    commonFields.description(system.description, itemType),  // This should be full-width
    commonFields.apCost(system.apCost, itemType)
)
```

### 4. Conditional Logic

Use `when()` for optional fields:

```typescript
// ✅ Good: Clear conditional logic
when(system.rarity && system.rarity !== 'common', () => 
    field({
        type: 'select',
        name: 'system.rarity',
        value: system.rarity,
        label: 'Rarity',
        options: rarityOptions
    })
)

// ❌ Avoid: Complex nested conditions
system.rarity && system.rarity !== 'common' ? field({...}) : null
```

### 5. Field Naming

Use consistent naming conventions:

```typescript
// ✅ Good: Consistent naming
field({
    type: 'text',
    name: 'system.damage',        // Always 'system.fieldName'
    label: 'Damage',             // Human readable
    class: 'weapon-damage',      // itemType-fieldName
    hint: 'Damage roll for this weapon'  // Descriptive
})
```

## Responsive Design

The layout system includes built-in responsive behavior:

- **Full-width fields**: Always span the full container width
- **Side-by-side fields**: Stack vertically on screens < 480px
- **Regular fields**: Take full width by default

## Troubleshooting

### Common Issues

1. **Field not appearing**: Check that `filterFields()` is called and the field is not null
2. **Wrong field order**: Ensure fields are in the correct order in the array
3. **TypeScript errors**: Verify system data types match the interface definitions
4. **Styling issues**: Check that CSS classes follow the `itemType-fieldName` pattern

### Debug Tips

1. **Check field generation**: Add console.log in your layout functions
2. **Verify system data**: Ensure the item has the expected system properties
3. **Test conditions**: Check that `when()` conditions are evaluating correctly

## Migration Guide

### From Switch Statements

Old pattern:
```typescript
switch (item.type) {
    case 'weapon':
        fields.push({
            type: 'text',
            name: 'system.damage',
            value: system.damage,
            label: 'Damage'
        });
        break;
    // ... more cases
}
```

New pattern:
```typescript
// scripts/layout/item-types/weapon.ts
export function body(item: LayoutItemData): Field[] {
    const system = item.system as WeaponSystemData;
    return filterFields([
        field({
            type: 'text',
            name: 'system.damage',
            value: system.damage,
            label: 'Damage'
        })
    ]);
}
```

### Adding New Field Types

1. **Define the field**: Add configuration to your layout
2. **Update templates**: Ensure render-field.hbs handles the type
3. **Add styling**: Include CSS for the new field type
4. **Test thoroughly**: Verify the field works across all item types

## API Reference

### Core Functions

- `field(config)`: Creates a field configuration
- `when(condition, fieldFactory)`: Conditional field inclusion
- `fullWidth(field)`: Marks field as full-width
- `sideBy(fieldA, fieldB)`: Groups two fields side by side
- `filterFields(fields)`: Removes null values

### Layout Registry

- `getHeaderLayout(item)`: Returns header fields for item type
- `getBodyLayout(item)`: Returns body fields for item type
- `isItemTypeSupported(type)`: Checks if type has a layout definition

### Common Fields

All common fields follow the pattern: `commonFields.fieldName(value, itemType)`

## Contributing

When adding new features to the layout system:

1. **Update helpers.ts**: Add new DSL functions
2. **Update types.ts**: Add new type definitions
3. **Update templates**: Handle new field types
4. **Update CSS**: Add styling for new features
5. **Update this documentation**: Keep examples current
6. **Add tests**: Ensure new features work correctly

## Examples Repository

See the `scripts/layout/item-types/` directory for real-world examples of each item type's layout configuration.