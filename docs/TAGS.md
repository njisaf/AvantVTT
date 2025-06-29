# Tag Registry System

## Overview

The Tag Registry system provides a centralized service for managing tag definitions used throughout the Avant Native FoundryVTT system. Tags are used to categorize and enhance traits, items, and other game elements with visual indicators and metadata.

## Architecture

### TagRegistryService

The `TagRegistryService` is a singleton service that manages tag definitions. It loads default tags from a JSON file and provides methods for retrieving, filtering, and managing tags.

```typescript
import { TagRegistryService } from './scripts/services/tag-registry-service.ts';

// Get the singleton instance
const tagRegistry = TagRegistryService.getInstance();

// Initialize the service (loads default tags)
await tagRegistry.initialize();

// Get all tags
const allTags = tagRegistry.getAll();

// Filter tags by category
const weaponTags = tagRegistry.getAll({ category: 'item' });

// Search for tags
const matchingTags = tagRegistry.search('weapon');
```

### TagDefinition Interface

Tags are defined using the `TagDefinition` interface:

```typescript
interface TagDefinition {
  /** Unique machine-readable identifier (lowercase, no spaces) */
  id: string;
  
  /** Human-readable display name */
  label: string;
  
  /** Optional color for visual representation */
  color?: string;
  
  /** Optional icon class (e.g., "fas fa-sword") */
  icon?: string;
  
  /** Categories this tag belongs to (e.g., ["trait", "damage"]) */
  categories?: string[];
}
```

## Default Tags

The system comes with 12 predefined tags loaded from `data/default-tags.json`:

| Tag ID | Label | Color | Icon | Categories |
|--------|-------|-------|------|------------|
| `weapon` | Weapon | #DC3545 | fas fa-sword | trait, item |
| `armor` | Armor | #6C757D | fas fa-shield-alt | trait, item |
| `gear` | Gear | #17A2B8 | fas fa-cog | trait, item |
| `talent` | Talent | #28A745 | fas fa-star | trait, character |
| `feature` | Feature | #FFC107 | fas fa-gem | trait, character |
| `augment` | Augment | #6F42C1 | fas fa-microchip | trait, character |
| `action` | Action | #FD7E14 | fas fa-bolt | trait, ability |
| `elemental` | Elemental | #00E0DC | fas fa-fire | trait, damage |
| `physical` | Physical | #8B4513 | fas fa-fist-raised | trait, damage |
| `tech` | Tech | #007BFF | fas fa-robot | trait, damage |
| `healing` | Healing | #20C997 | fas fa-heart | trait, beneficial |
| `defensive` | Defensive | #6C757D | fas fa-shield | trait, beneficial |

## Integration with Item Sheets

### Tag Example Buttons

The trait item sheet includes tag example buttons that allow users to quickly add common tags to their traits:

```html
<div class="tag-examples">
  <button type="button" class="tag-example" data-tags="weapon">Weapon</button>
  <button type="button" class="tag-example" data-tags="armor">Armor</button>
  <button type="button" class="tag-example" data-tags="weapon,armor">Combat Gear</button>
</div>
```

### Button Functionality

- **Click to Add**: Clicking a tag button adds the tag(s) to the trait's tags field
- **Click to Remove**: If all tags are already applied, clicking removes them
- **Visual State**: Selected buttons are highlighted with the `.selected` class
- **Multi-Tag Support**: Buttons can apply multiple tags at once (comma-separated)

### SCSS Styling

Tag buttons are styled with theme-aware colors and hover effects:

```scss
.tag-example {
  background: var(--theme-bg-tertiary, $bg-tertiary);
  border: 1px solid var(--theme-border-primary, $border-primary);
  color: var(--theme-text-secondary, $text-secondary);
  
  &:hover {
    background: var(--theme-bg-primary, $bg-primary);
    border-color: var(--theme-accent-primary, $accent-cyan);
    box-shadow: 0 0 5px rgba(0, 224, 220, 0.3);
  }
  
  &.selected {
    background: var(--theme-accent-primary, $accent-cyan);
    color: var(--theme-bg-primary, $bg-primary);
    box-shadow: 0 0 8px rgba(0, 224, 220, 0.4);
  }
}
```

## Hook System

The TagRegistryService emits `avantTagsUpdated` hooks when tags are modified:

```typescript
// Listen for tag updates
Hooks.on('avantTagsUpdated', (hookData) => {
  console.log('Tags updated:', hookData.action); // 'added', 'updated', 'removed', 'loaded'
  console.log('Current tags:', hookData.tags);
  console.log('Affected tag:', hookData.tag);
});
```

## Integration with TraitProvider

The TraitProvider automatically emits tag update hooks when custom traits are created, ensuring that tag-based autocomplete systems stay in sync:

```typescript
// In TraitProvider._emitTraitRegisteredHook()
Hooks.call('avantTagsUpdated', {
  action: 'loaded',
  tags: this.getAll(),
  context: {
    source: 'trait-creation',
    timestamp: Date.now()
  }
});
```

## Configuration

The TagRegistryService can be configured during initialization:

```typescript
const tagRegistry = TagRegistryService.getInstance({
  defaultTagsPath: 'systems/avant/data/custom-tags.json',
  enableCaching: true,
  cacheTimeout: 300000 // 5 minutes
});
```

## API Reference

### TagRegistryService Methods

#### `getInstance(config?: Partial<TagRegistryConfig>): TagRegistryService`
Returns the singleton instance, optionally with custom configuration.

#### `async initialize(): Promise<TagRegistryResult<boolean>>`
Initializes the service by loading default tags from JSON.

#### `getAll(options?: TagFilterOptions): TagDefinition[]`
Returns all tags, optionally filtered by criteria.

#### `getById(id: string): TagDefinition | undefined`
Returns a specific tag by ID.

#### `async addOrUpdate(tagDef: TagDefinition): Promise<TagRegistryResult<TagDefinition>>`
Adds or updates a tag definition.

#### `async remove(id: string): Promise<TagRegistryResult<boolean>>`
Removes a tag by ID.

#### `isReady(): boolean`
Checks if the service has been initialized.

#### `getCount(): number`
Returns the total number of tags.

#### `search(query: string, maxResults?: number): TagDefinition[]`
Searches for tags matching a query string.

### Filter Options

```typescript
interface TagFilterOptions {
  category?: string;        // Filter by single category
  categories?: string[];    // Filter by multiple categories
  search?: string;          // Text search in id/label
  caseSensitive?: boolean;  // Case-sensitive search
}
```

## Testing

The TagRegistryService includes comprehensive unit tests covering:

- Singleton pattern behavior
- JSON loading and validation
- Tag filtering and searching
- CRUD operations
- Hook emission
- Error handling

Run tests with:
```bash
npm test -- --testPathPattern=tag-registry-service.test.ts
```

## Future Enhancements

### Planned Features

1. **Dynamic Tag Registration**: Allow modules to register custom tag definitions
2. **Tag Categories Management**: CRUD operations for tag categories
3. **Tag Templates**: Predefined tag combinations for common scenarios
4. **Visual Tag Editor**: UI for creating and editing tags
5. **Tag Import/Export**: Support for importing tags from external sources
6. **Tag Validation**: Runtime validation of tag usage across items

### Extension Points

The system is designed to be extensible:

- Custom tag categories can be added to default tags
- Hook system allows external modules to react to tag changes
- Filter system supports custom filtering logic
- Service can be extended for specialized tag operations

## Troubleshooting

### Common Issues

**Tags not loading**
- Check that `data/default-tags.json` exists and is valid JSON
- Verify the `defaultTagsPath` configuration is correct
- Check browser console for initialization errors

**Tag buttons not working**
- Ensure trait item sheet templates include tag example buttons
- Verify click handlers are properly attached in `activateListeners()`
- Check that `system.tags` field exists on trait items

**Styling issues**
- Verify SCSS has been compiled to CSS
- Check that theme CSS custom properties are defined
- Ensure `.tag-example` styles are included in the build

### Debug Information

Enable detailed logging by checking browser console for messages prefixed with:
- `🏷️ TagRegistryService |` - Service operations
- `🏷️ TAG DEBUG |` - Tag button interactions

## Migration Guide

When upgrading from systems without tag support:

1. **Backup Data**: Export world data before upgrading
2. **Update Templates**: Ensure item templates include tag fields
3. **Rebuild Sheets**: Force refresh of actor/item sheets
4. **Test Functionality**: Verify tag buttons work correctly
5. **Custom Tags**: Add any custom tags via the service API

This documentation covers the complete Tag Registry system as implemented in the Avant Native FoundryVTT system. 