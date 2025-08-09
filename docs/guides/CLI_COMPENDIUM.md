# Compendium CLI Reference

**Version**: 2.0.0 - Stage 5: Polish & Prove  
**Author**: Avant VTT Team  
**Updated**: January 2025

## Overview

The Avant Compendium CLI provides powerful tools for managing FoundryVTT compendium packs during development and testing. These tools operate directly on compendium data structures and support both interactive and automated workflows.

## Prerequisites

- FoundryVTT context (CLI must run within FoundryVTT environment)
- Node.js 16+ (for TypeScript execution)
- Avant VTT system installed

## Command Structure

```bash
npx tsx scripts/cli/compendium.ts <command> [options]
```

**Alias via npm scripts**:
```bash
npm run cli:compendium <command> [options]
```

## Core Commands

### `list` - List Compendium Packs

Display available compendium packs with filtering and formatting options.

**Syntax**:
```bash
npm run cli:compendium list [options]
```

**Options**:
- `--filter <type>` - Filter by document type (Item, Actor, JournalEntry, etc.)
- `--verbose` - Show detailed pack information
- `--json` - Output in JSON format

**Examples**:
```bash
# List all packs
npm run cli:compendium list

# Show only Item packs with details
npm run cli:compendium list --filter Item --verbose

# JSON output for scripts
npm run cli:compendium list --json
```

**Sample Output**:
```
📦 Available Compendium Packs (2):

🎭 System Packs:
┌──────────────────────┬────────┬─────────┬────────────────────────┐
│ Pack ID              │ Type   │ Count   │ Description            │
├──────────────────────┼────────┼─────────┼────────────────────────┤
│ avant.avant-traits   │ Item   │ 8       │ Default system traits  │
└──────────────────────┴────────┴─────────┴────────────────────────┘

🌍 World Packs:
┌──────────────────────┬────────┬─────────┬────────────────────────┐
│ Pack ID              │ Type   │ Count   │ Description            │
├──────────────────────┼────────┼─────────┼────────────────────────┤
│ world.custom-traits  │ Item   │ 3       │ Custom trait definitions│
└──────────────────────┴────────┴─────────┴────────────────────────┘
```

### `export` - Export Pack Contents

Export compendium pack contents to JSON for backup, analysis, or migration.

**Syntax**:
```bash
npm run cli:compendium export <pack-id> <output-file> [options]
```

**Options**:
- `--json` - Machine-readable output format
- `--compact` - Compact JSON formatting

**Examples**:
```bash
# Export system traits
npm run cli:compendium export avant.avant-traits system-traits.json

# Export with compact formatting
npm run cli:compendium export world.custom-traits custom-traits.json --compact
```

**Output Structure**:
```json
{
  "pack": {
    "id": "avant.avant-traits",
    "label": "System Traits",
    "type": "Item",
    "system": "avant"
  },
  "documents": [
    {
      "_id": "trait_fire_123",
      "name": "Fire",
      "type": "trait",
      "system": {
        "color": "#FF6B6B",
        "icon": "fas fa-fire",
        "localKey": "AVANT.Trait.Fire"
      }
    }
  ],
  "metadata": {
    "exportedAt": "2025-01-08T10:30:00.000Z",
    "version": "2.0.0",
    "documentCount": 8
  }
}
```

### `diff` - Compare Pack Contents

Compare contents between two compendium packs to identify differences.

**Syntax**:
```bash
npm run cli:compendium diff <pack1-id> <pack2-id> [options]
```

**Options**:
- `--json` - JSON output format
- `--verbose` - Show detailed differences

**Examples**:
```bash
# Compare system and world traits
npm run cli:compendium diff avant.avant-traits world.custom-traits

# JSON output for automated processing
npm run cli:compendium diff pack1 pack2 --json
```

**Sample Output**:
```
📊 Pack Comparison: avant.avant-traits ↔ world.custom-traits

🟢 Items only in avant.avant-traits (5):
  • Lightning (trait_lightning_123) - Lightning elemental trait
  • Stealth (trait_stealth_456) - Stealth and concealment
  • Healing (trait_healing_789) - Healing and restoration
  • Psychic (trait_psychic_012) - Mental abilities
  • Legendary (trait_legendary_345) - Legendary quality

🟡 Items only in world.custom-traits (2):
  • Custom Fire (trait_custom_fire_678) - Modified fire trait
  • Shadow (trait_shadow_901) - Custom shadow trait

🟠 Items in both packs with differences (1):
  • Fire: system.color differs (#FF6B6B vs #FF0000)

📋 Summary:
  - Total items: avant.avant-traits=8, world.custom-traits=3
  - Unique to first: 5 items
  - Unique to second: 2 items  
  - Different versions: 1 item
```

### `validate` - Validate Pack Integrity

Check compendium pack data integrity and report any issues.

**Syntax**:
```bash
npm run cli:compendium validate <pack-id> [options]
```

**Options**:
- `--json` - JSON output format
- `--verbose` - Detailed validation results

**Examples**:
```bash
# Validate custom traits pack
npm run cli:compendium validate world.custom-traits

# JSON output for CI/CD integration
npm run cli:compendium validate avant.avant-traits --json --verbose
```

**Sample Output**:
```
🔍 Validating Pack: world.custom-traits

✅ Schema Validation:
  - All 3 documents have valid structure
  - Required fields present: name, type, system
  - Data types match schema definitions

🎨 Trait-Specific Validation:
  - Color codes valid: 3/3 items
  - Icon classes valid: 3/3 items  
  - Localization keys unique: 3/3 items

📊 Validation Summary:
  - Status: ✅ PASSED
  - Documents validated: 3
  - Errors found: 0
  - Warnings: 0
  - Validation time: 45ms
```

### `create` - Create New Pack

Create a new compendium pack with specified configuration.

**Syntax**:
```bash
npm run cli:compendium create <pack-id> <type> <label> [options]
```

**Parameters**:
- `<pack-id>` - Unique pack identifier (format: world.pack-name)
- `<type>` - Document type (Item, Actor, JournalEntry, etc.)
- `<label>` - Human-readable pack name

**Options**:
- `--dry-run` - Preview creation without making changes
- `--force` - Overwrite existing pack
- `--json` - JSON output format

**Examples**:
```bash
# Create new item pack
npm run cli:compendium create world.my-items Item "Custom Items"

# Preview creation
npm run cli:compendium create world.test-pack Item "Test Pack" --dry-run
```

### `copy` - Copy Documents Between Packs

Copy documents from one pack to another with filtering options.

**Syntax**:
```bash
npm run cli:compendium copy <source-pack> <target-pack> [options]
```

**Options**:
- `--filter <criteria>` - Filter documents (name:pattern, type:value)
- `--dry-run` - Preview copy without making changes
- `--force` - Overwrite existing documents
- `--json` - JSON output format

**Examples**:
```bash
# Copy all fire-related traits
npm run cli:compendium copy avant.avant-traits world.custom-traits --filter name:Fire

# Preview copy operation
npm run cli:compendium copy source-pack target-pack --dry-run
```

## JSON Output Format

All commands support `--json` for machine-readable output:

```json
{
  "command": "list",
  "success": true,
  "data": {
    "packs": [
      {
        "id": "avant.avant-traits",
        "label": "System Traits",
        "type": "Item",
        "documentCount": 8,
        "scope": "system"
      }
    ]
  },
  "metadata": {
    "executionTime": 150,
    "timestamp": "2025-01-08T10:30:00.000Z",
    "version": "2.0.0"
  }
}
```

## Error Handling

The CLI provides comprehensive error handling with helpful messages:

### Common Errors

**Pack Not Found**:
```
❌ Error: Pack 'world.missing-pack' not found
💡 Available packs: avant.avant-traits, world.custom-traits
💡 Use 'npm run cli:compendium list' to see all available packs
```

**Invalid Document Type**:
```
❌ Error: Invalid document type 'InvalidType'
💡 Valid types: Item, Actor, JournalEntry, RollTable, Macro, Playlist
```

**Permission Error**:
```
❌ Error: Insufficient permissions to modify pack 'avant.avant-traits'
💡 System packs are read-only. Use world packs for modifications.
```

### Exit Codes

- `0` - Success
- `1` - General error (invalid arguments, pack not found)
- `2` - Permission error (read-only pack, insufficient permissions)
- `3` - Validation error (invalid data, schema mismatch)

## Integration Examples

### CI/CD Pipeline

```bash
#!/bin/bash
# Validate all custom packs in CI
npm run cli:compendium list --json | \
  jq -r '.data.packs[] | select(.scope == "world") | .id' | \
  while read pack; do
    npm run cli:compendium validate "$pack" --json
  done
```

### Backup Script

```bash
#!/bin/bash
# Backup all world packs
BACKUP_DIR="backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

npm run cli:compendium list --json | \
  jq -r '.data.packs[] | select(.scope == "world") | .id' | \
  while read pack; do
    npm run cli:compendium export "$pack" "$BACKUP_DIR/${pack}.json"
  done
```

### Development Workflow

```bash
# 1. Check current custom traits
npm run cli:compendium list --filter trait --verbose

# 2. Export for backup
npm run cli:compendium export world.custom-traits backup-$(date +%Y%m%d).json

# 3. Compare with system defaults  
npm run cli:compendium diff avant.avant-traits world.custom-traits

# 4. Validate integrity
npm run cli:compendium validate world.custom-traits
```

## Performance Considerations

- **Large Packs**: Commands may take longer with packs containing 1000+ documents
- **JSON Output**: Use `--compact` flag for smaller file sizes
- **Diff Operations**: Performance scales with O(n*m) where n,m are pack sizes
- **Validation**: Comprehensive validation may be slower but provides detailed results

## Troubleshooting

### Common Issues

**1. "FoundryVTT context required"**
- CLI must run within FoundryVTT environment
- Ensure system is loaded and game is ready

**2. "Pack appears empty"**
- Pack may not be properly indexed
- Try refreshing compendium in FoundryVTT UI

**3. "Permission denied"** 
- System packs are read-only
- Use world packs for modifications

**4. "Invalid JSON output"**
- Large datasets may exceed memory limits
- Use filtering to reduce output size

### Debug Mode

Enable verbose logging:
```bash
DEBUG=avant:cli npm run cli:compendium list
```

## API Reference

The CLI uses the CompendiumLocalService for all operations:

```typescript
import { CompendiumLocalService } from '../services/compendium-local-service.ts';

const service = new CompendiumLocalService();
const docs = await service.loadPack('world.custom-traits');
```

## Version History

- **2.0.0**: Stage 5 - Polish & Prove Sprint
  - Enhanced error handling and user experience
  - Added comprehensive validation
  - Improved JSON output format
  - Added filtering and verbose options

- **1.0.0**: Stage 3 - Compendium Integration
  - Initial CLI implementation
  - Basic CRUD operations
  - JSON export/import functionality

## Support

For CLI-related issues:
1. Check this documentation first
2. Verify FoundryVTT context and permissions
3. Use `--json` output for debugging
4. Report issues on GitHub with full command output

---

**📖 Related Documentation**:
- [Compendium Architecture](COMPENDIUM_ARCHITECTURE.md) 
- [System Development Guide](../README.md#development)
- [CHANGELOG](../changelogs/) for recent updates 
## Trait Normalization (Pre-Export)

The build includes a pre-export step that normalizes talent traits from human-readable names to trait document IDs.

- Script: [scripts/compendium/normalize-traits.ts](scripts/compendium/normalize-traits.ts:1)
- Source talents: [packs/avant-talents/talents.json](packs/avant-talents/talents.json:1)
- Normalized output: [_export/packs/avant-talents/talents.json](_export/packs/avant-talents/talents.json:1)
- Fallback trait: “Unknown” in mechanics-traits (required)
  - Defined in [packs/avant-traits/mechanics-traits.json](packs/avant-traits/mechanics-traits.json:1) with name “Unknown”
- Loader override: [scripts/data/compendium-loader.js](scripts/data/compendium-loader.js:1) prefers files in _export/packs over packs when the filename matches

What it does:
- Scans all trait JSON files under [packs/avant-traits](packs/avant-traits:1) to build a name → id map (case-insensitive, trimmed)
- Rewrites each talent’s `system.traits[]` to trait IDs
- Synonyms applied:
  - “Area” → “AOE”
  - “Force” → “Magical”
- If no match is found, falls back to the “Unknown” trait id
- Writes a report to [reports/trait-normalization-YYYYMMDD.json](reports:1) with statistics and any fallbacks

How to run manually:
- npm run compendium:normalize-traits

When it runs automatically:
- The npm lifecycle hook “prebuild:packs” runs before “build:packs”, so normalization executes automatically during “npm run build”.
  - Scripts: see [package.json](package.json:1)

Notes:
- Keep sources human-readable in packs/; the build consumes normalized copies from _export/.
- Extend synonyms by editing the constant in [scripts/compendium/normalize-traits.ts](scripts/compendium/normalize-traits.ts:1).
- If you remove or rename the fallback “Unknown” trait, the script will fail fast with an error.