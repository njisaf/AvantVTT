# Avant Compendium System - User Guide

## Overview

The Avant Compendium System is a comprehensive content management solution for FoundryVTT that allows you to create, manage, and validate game content using JSON files. This system provides a modern, version-controlled approach to compendium management with automated validation and cross-referencing capabilities.

## What is the Compendium System?

Think of the compendium system as a digital library for your game content. Instead of managing items directly in FoundryVTT, you create and edit JSON files that describe your game elements (traits, talents, augments, macros). The system then automatically builds these files into compendium packs that FoundryVTT can use.

### Key Benefits

- **Version Control**: Track changes to your game content using Git
- **Collaboration**: Multiple developers can work on content simultaneously
- **Validation**: Automatic checking ensures content meets quality standards
- **Cross-referencing**: Automatic linking between related content
- **Backup**: Your content is stored as human-readable JSON files

## System Architecture

The compendium system uses a 5-phase pipeline to process your content:

1. **Phase A: ID & Category Guard** - Ensures all items have unique identifiers
2. **Phase B: File Granularity** - Supports individual JSON files for each item
3. **Phase C: Folder Support** - Organizes content into logical folders
4. **Phase D: Link Rewriting** - Converts references into proper FoundryVTT links
5. **Phase E: Round-trip Validation** - Verifies consistency between source and built files

## Getting Started

### Directory Structure

Your compendium content is organized in the `packs/` directory:

```
packs/
├── traits/          # Trait definitions
├── talents/         # Talent definitions  
├── augments/        # Augment definitions
├── macros/          # Macro definitions
└── _folders/        # Folder organization (optional)
```

### Basic Commands

```bash
# Validate all compendium files
npm run compendium:check

# Build compendium packs
npm run build:packs

# Run complete validation pipeline
npm run compendium:pipeline

# Extract data from built packs
npm run compendium:extract
```

## Creating Content

### Creating a New Trait

1. **Create the JSON file** in `packs/traits/`:

```json
{
  "_id": "myUniqueId123456",
  "name": "Fire Mastery",
  "type": "trait",
  "img": "icons/svg/item-bag.svg",
  "system": {
    "description": "Grants mastery over fire-based abilities",
    "color": "#FF6B6B",
    "icon": "fas fa-fire",
    "localKey": "AVANT.Trait.FireMastery",
    "tags": ["elemental", "fire"],
    "rarity": "uncommon",
    "effects": "Increases fire damage by 25%",
    "textColor": "#FFFFFF"
  },
  "folder": "ElementalTraits"
}
```

2. **Required Fields**:
   - `_id`: 16-character unique identifier
   - `name`: Display name
   - `type`: Document type ("trait", "talent", "augment", "macro")
   - `system`: Game-specific data

3. **Generate ID automatically**:
   ```bash
   npm run compendium:check -- --fix
   ```

### Creating a New Talent

```json
{
  "_id": "talentId1234567",
  "name": "Flame Strike",
  "type": "talent",
  "img": "icons/svg/item-bag.svg",
  "system": {
    "description": "Channel fire energy into a devastating attack",
    "apCost": 2,
    "levelRequirement": 1,
    "traits": ["Fire", "Attack"],
    "requirements": "Must have Fire Mastery trait",
    "effects": "Deal 2d6 fire damage to target"
  },
  "folder": "OffensiveTalents"
}
```

### Creating a New Augment

```json
{
  "_id": "augmentId123456",
  "name": "Neural Interface",
  "type": "augment",
  "img": "icons/svg/item-bag.svg",
  "system": {
    "description": "Cybernetic enhancement for cognitive processing",
    "apCost": 1,
    "ppCost": 2,
    "levelRequirement": 2,
    "traits": ["Tech", "Enhancement"],
    "requirements": "Must have cybernetic compatibility",
    "effects": "Gain +2 to all Tech skill rolls"
  },
  "folder": "CyberneticAugments"
}
```

### Creating a New Macro

```json
{
  "_id": "macroId123456",
  "name": "Roll Initiative",
  "type": "script",
  "img": "icons/svg/dice-target.svg",
  "command": "// Roll initiative for selected tokens\nconst tokens = canvas.tokens.controlled;\nfor (let token of tokens) {\n  await token.actor.rollInitiative();\n}",
  "folder": "CombatMacros",
  "flags": {
    "avant": {
      "description": "Automatically rolls initiative for selected tokens",
      "version": "1.0.0",
      "category": "combat"
    }
  }
}
```

## Organizing Content with Folders

### Creating Folders

Create a `_folders.json` file in your pack directory:

```json
[
  {
    "_id": "ElementalTraits",
    "name": "Elemental Traits",
    "type": "Folder",
    "color": "#FF6B6B",
    "folder": null,
    "sort": 100
  },
  {
    "_id": "OffensiveTalents",
    "name": "Offensive Talents",
    "type": "Folder",
    "color": "#FF4444",
    "folder": null,
    "sort": 200
  }
]
```

### Nested Folders

```json
[
  {
    "_id": "MagicTraits",
    "name": "Magic Traits",
    "type": "Folder",
    "color": "#8B5CF6",
    "folder": null,
    "sort": 100
  },
  {
    "_id": "ElementalMagic",
    "name": "Elemental Magic",
    "type": "Folder",
    "color": "#EC4899",
    "folder": "MagicTraits",
    "sort": 100
  }
]
```

## Cross-Referencing and Links

### Trait References

The system automatically converts trait references to proper FoundryVTT links:

```json
{
  "name": "Fire Strike",
  "system": {
    "traits": ["Fire", "Attack"]
  }
}
```

During build, this becomes:

```json
{
  "name": "Fire Strike",
  "system": {
    "traits": [
      "@UUID[Compendium.avant.avant-traits.fireTraitId123]{Fire}",
      "@UUID[Compendium.avant.avant-traits.attackTraitId456]{Attack}"
    ]
  }
}
```

### Manual Links

You can also create manual links to other compendium items:

```json
{
  "system": {
    "description": "Requires @UUID[Compendium.avant.avant-traits.fireTraitId123]{Fire Mastery} trait"
  }
}
```

## Import and Export

### Exporting Traits

Use the built-in macro to export traits:

1. Run the "Export Custom Traits" macro from the macro compendium
2. Select export location
3. Choose between system traits or custom traits only

### Importing Traits

Use the built-in macro to import traits:

1. Run the "Import to Avant Traits" macro
2. Select JSON file to import
3. Choose target compendium (system or custom)
4. Configure overwrite settings

### CLI Export/Import

```bash
# Export traits to JSON
npm run traits:export my-traits.json

# Import traits from JSON
npm run traits:import my-traits.json

# Check trait data integrity
npm run traits:integrity
```

## Validation and Quality Assurance

### Automatic Validation

The system automatically validates your content:

```bash
# Check for missing IDs and structural issues
npm run compendium:check

# Validate folder structure
npm run compendium:folders

# Check cross-references
npm run compendium:links

# Verify build consistency
npm run compendium:roundtrip
```

### Common Validation Issues

1. **Missing `_id` field**:
   ```bash
   # Fix automatically
   npm run compendium:check -- --fix
   ```

2. **Duplicate IDs**:
   - Check console output for conflicting files
   - Manually resolve by changing one of the IDs

3. **Broken trait references**:
   - Ensure referenced traits exist in the traits compendium
   - Check spelling and capitalization

4. **Invalid folder references**:
   - Ensure folder exists in `_folders.json`
   - Check folder ID matches exactly

## Advanced Features

### Batch Operations

```bash
# Process multiple files
find packs/traits -name "*.json" -exec npm run compendium:check -- {} \;

# Validate specific pack
npm run compendium:check -- --pack=traits
```

### Custom Validation Rules

Create custom validation by extending the validator:

```typescript
import { CompendiumValidator } from './scripts/compendium/validator.js';

class CustomValidator extends CompendiumValidator {
  validateCustomFields(document: any): boolean {
    // Your custom validation logic
    return true;
  }
}
```

### Build Automation

Set up GitHub Actions for automatic validation:

```yaml
# .github/workflows/compendium-validation.yml
name: Compendium Validation
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run compendium:pipeline
```

## Troubleshooting

### Common Issues

1. **"Pack not found" errors**:
   - Ensure pack directory exists in `packs/`
   - Check directory naming matches system.json

2. **"Invalid JSON" errors**:
   - Validate JSON syntax using online tools
   - Check for trailing commas or missing quotes

3. **"Duplicate ID" errors**:
   - Search for the duplicate ID across all files
   - Generate new ID using `npm run compendium:check -- --fix`

4. **"Broken reference" errors**:
   - Verify referenced trait exists
   - Check trait name spelling and case

### Debug Mode

Enable verbose logging:

```bash
npm run compendium:check -- --verbose
npm run compendium:pipeline -- --verbose
```

### File Recovery

If files become corrupted:

1. **Restore from Git**:
   ```bash
   git checkout HEAD -- packs/traits/corrupted-file.json
   ```

2. **Regenerate from backup**:
   ```bash
   npm run compendium:extract -- --output=backup
   ```

## Best Practices

### Content Creation

1. **Use descriptive names** for files and folders
2. **Follow naming conventions** (kebab-case for files)
3. **Include comprehensive descriptions** for complex items
4. **Use consistent color schemes** for related content
5. **Test content** in FoundryVTT before committing

### Version Control

1. **Commit frequently** with descriptive messages
2. **Use branches** for major content changes
3. **Review changes** before merging
4. **Tag releases** for stable versions

### Collaboration

1. **Coordinate ID generation** to avoid conflicts
2. **Use pull requests** for content review
3. **Document changes** in commit messages
4. **Maintain style guides** for consistency

## API Reference

### Validation Options

```typescript
interface ValidationOptions {
  fix: boolean;           // Auto-fix issues
  verbose: boolean;       // Detailed output
  packsDirectory?: string; // Custom packs path
}
```

### Document Structure

```typescript
interface CompendiumDocument {
  _id: string;           // Required: 16-char unique ID
  name: string;          // Required: Display name
  type: string;          // Required: Document type
  system?: any;          // Optional: Game data
  folder?: string;       // Optional: Folder ID
  img?: string;          // Optional: Icon path
}
```

## Support and Community

### Getting Help

- **Documentation**: Check this guide and inline comments
- **Issues**: Report bugs on GitHub issues
- **Discord**: Join the Avant VTT community server
- **Examples**: Review existing content in `packs/` directories

### Contributing

1. **Fork the repository**
2. **Create feature branch**
3. **Add your content**
4. **Run validation pipeline**
5. **Submit pull request**

### Resources

- [FoundryVTT Documentation](https://foundryvtt.com/api/)
- [JSON Schema Validator](https://jsonschemavalidator.net/)
- [Avant VTT System Guide](./DEV_GUIDE.md)
- [Contributing Guidelines](./CONTRIBUTORS.md)

---

*This guide covers the essential features of the Avant Compendium System. For technical details, see the developer documentation in the `scripts/compendium/` directory.*