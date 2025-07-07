# Trait Export Directory

This directory contains exported trait data from the Avant VTT CLI tools.

## Purpose

- **Trait Exports**: JSON files containing trait definitions and metadata
- **Backup Storage**: Safe location for trait data backups before system changes
- **Data Exchange**: Shareable trait definitions for collaboration

## CLI Usage

### Export Traits
```bash
# Export all traits to this directory
npm run traits:export my-traits.json

# Export only world traits
npm run traits:export world-traits.json -- --world-only

# Export only system traits  
npm run traits:export system-traits.json -- --system-only
```

### Import Traits
```bash
# Import traits from this directory
npm run traits:import my-traits.json

# Preview what would be imported (dry run)
npm run traits:import my-traits.json -- --dry-run

# Import and overwrite existing traits
npm run traits:import my-traits.json -- --overwrite
```

## File Structure

- **Relative paths** (no `/` prefix) automatically use this `_export/` directory
- **Absolute paths** go to the specified location
- All exports include metadata: timestamp, system version, trait count

## Examples

```bash
# These commands save to _export/backup-20250627.json
npm run traits:export backup-$(date +%Y%m%d).json

# This saves to /Users/username/Desktop/traits.json
npm run traits:export /Users/username/Desktop/traits.json

# Import from _export directory
npm run traits:import backup-20250627.json
```

## Git Management

- **Exported files are ignored** by git (see `.gitignore`)
- Directory structure is preserved in version control
- Safe to export without worrying about committing large data files

---

**Related**: See `docs/CLI_COMPENDIUM.md` for compendium-based export options 