# Avant

A narrative RPG system for FoundryVTT.

## What is Avant?
Avant is a modular, narrative-focused game system for Foundry Virtual Tabletop (FoundryVTT v13+). It provides a modern, themeable, and extensible ruleset for digital tabletop play.

---

## Installation

Avant is distributed as an official release package via GitHub Releases. End users should NOT clone the repository or build from source unless developing or contributing.

### Method 1: Manifest URL (Recommended)
1. In FoundryVTT, go to "Add-on Modules" → "Install System"
2. Use manifest URL: `https://github.com/njisaf/AvantVTT/releases/latest/download/system.json`
3. Click "Install"

### Method 2: Manual Download
1. Download the latest release zip from: `https://github.com/njisaf/AvantVTT/releases/latest/download/avant-v0.1.6.zip`
2. Extract to your FoundryVTT `Data/systems/avant/` directory (the directory name MUST be `avant`)
3. Restart FoundryVTT
4. Create a new world using the "Avant" system

**Note:** The release zip contains everything needed to run the system. Do not copy source files unless you are developing.

---

## Quick Start

### Prerequisites
- FoundryVTT v13.344+
- Node.js 16+ (for development/building only)

### For End Users
- Install Avant using one of the methods above.
- Start FoundryVTT and select Avant as your game system when creating a new world.

### For Developers/Contributors
If you want to contribute code, develop modules, or build from source, please see our [Contributor Guide](docs/CONTRIBUTORS.md).

---

## Tag System
For full details on tags, tag management, and tag API, see [docs/TAGS.md](docs/TAGS.md).

---

## CLI Usage
For advanced CLI usage, automation, and compendium management, see [docs/CLI_COMPENDIUM.md](docs/CLI_COMPENDIUM.md).

---

## Support
- **GitHub**: [AvantVTT Repository](https://github.com/njisaf/AvantVTT)
- **Discord**: bipolardiceroller, ManSally

---

*For developer and contributor documentation, see [docs/CONTRIBUTORS.md](docs/CONTRIBUTORS.md).*

## File Structure (Updated)

```
avantVtt/
├── package.json         # Node.js package configuration
├── system.json          # System manifest and configuration
├── template.json        # System data template definitions
├── scripts/             # Source code (TypeScript, not needed for end users)
├── styles/              # SCSS source (not needed for end users)
├── templates/           # Handlebars templates
├── lang/                # Localization
├── assets/              # System assets
├── dist/                # [Release Artifact] - All runtime files for FoundryVTT
└── changelogs/          # Changelog and release notes
```


## CLI Quick Start

Avant includes powerful CLI utilities for trait management:

### Trait Management

```bash
# Export all traits to JSON
npm run traits:export my-traits.json

# Export only world traits
npm run traits:export world-traits.json -- --world-only

# Import with dry-run (safe preview)
npm run traits:import my-traits.json -- --dry-run

# Import and overwrite existing traits
npm run traits:import my-traits.json -- --overwrite

# Sync from remote repository
npm run traits:sync

# Check data integrity
npm run traits:integrity

# Get remote trait information
npm run traits:remote
```

### Alternative: Binary Usage

```bash
# Via npm exec (after installation)
npm exec traits export my-traits.json
npm exec traits import my-traits.json --dry-run
npm exec traits integrity
```

### Command Reference

| Command            | Description                 | Options                                      |
| ------------------ | --------------------------- | -------------------------------------------- |
| `traits:export`    | Export traits to JSON       | `--world-only`, `--system-only`, `--compact` |
| `traits:import`    | Import traits from JSON     | `--dry-run`, `--overwrite`                   |
| `traits:sync`      | Sync from remote repository | None                                         |
| `traits:remote`    | Get remote information      | None                                         |
| `traits:integrity` | Check data integrity        | None                                         |

## Developer Tools / Compendium CLI

Avant includes advanced compendium management tools for developers working with FoundryVTT packs:

### Compendium Operations

```bash
# List all available compendium packs
npm run cli:compendium list

# Show detailed pack information  
npm run cli:compendium list --verbose

# Filter packs by type
npm run cli:compendium list --filter Item

# Export pack content to JSON
npm run cli:compendium export world.my-pack output.json

# Compare differences between packs
npm run cli:compendium diff system-pack world-pack

# Create new compendium pack
npm run cli:compendium create world.new-pack Item "My New Pack"

# Validate pack integrity
npm run cli:compendium validate world.my-pack

# Copy documents between packs
npm run cli:compendium copy source-pack target-pack --filter name:Fire
```

### JSON Output Format

All CLI commands support `--json` for machine-readable output:

```bash
# JSON output for integration with other tools
npm run cli:compendium list --json
npm run cli:compendium diff pack1 pack2 --json
```

### Advanced Options

| Option            | Description             | Available Commands |
| ----------------- | ----------------------- | ------------------ |
| `--json`          | Output in JSON format   | All commands       |
| `--filter <type>` | Filter by document type | `list`, `copy`     |
| `--verbose`       | Detailed information    | `list`, `validate` |
| `--dry-run`       | Preview without changes | `copy`, `create`   |
| `--force`         | Overwrite existing      | `create`, `copy`   |

### Developer Examples

```bash
# Development workflow: Check what's in your custom traits
npm run cli:compendium list --filter trait --verbose

# Export custom traits for backup/sharing
npm run cli:compendium export world.custom-traits backup-traits.json

# Compare system traits with custom modifications
npm run cli:compendium diff avant.avant-traits world.custom-traits

# Validate data integrity during development
npm run cli:compendium validate world.custom-traits --json
```

**📖 For complete CLI reference, see [docs/CLI_COMPENDIUM.md](docs/CLI_COMPENDIUM.md)**

## Tag Registry System

Avant includes a comprehensive tag management system for organizing and categorizing traits and items:

### Tag Example Buttons

The trait item sheet includes interactive tag buttons that allow quick addition/removal of common tags:

- **Click to Add**: Clicking a tag button adds the tag(s) to the trait's tags field
- **Click to Remove**: If the tag is already applied, clicking removes it
- **Visual Feedback**: Selected buttons are highlighted with cyan accents
- **Multi-Tag Support**: Some buttons apply multiple tags at once (e.g., "Combat Gear" adds both "weapon" and "armor")

### Default Tags

The system includes 12 predefined tags:

| Tag       | Category   | Description                                      |
| --------- | ---------- | ------------------------------------------------ |
| Weapon    | item       | Combat weapons and offensive tools               |
| Armor     | item       | Protective gear and defensive equipment          |
| Gear      | item       | General equipment and utility items              |
| Talent    | character  | Character abilities and skills                   |
| Feature   | character  | Character traits and background elements         |
| Augment   | character  | Cybernetic and technological enhancements        |
| Action    | ability    | Special actions and maneuvers                    |
| Elemental | damage     | Fire, ice, lightning, and elemental effects      |
| Physical  | damage     | Blunt force, piercing, and physical damage       |
| Tech      | damage     | Digital, electromagnetic, and tech-based effects |
| Healing   | beneficial | Restorative and healing abilities                |
| Defensive | beneficial | Protective and defensive bonuses                 |

### TagRegistryService API

For developers integrating with the tag system:

```typescript
import { TagRegistryService } from './scripts/services/tag-registry-service.ts';

// Get the singleton instance
const tagRegistry = TagRegistryService.getInstance();

// Get all tags
const allTags = tagRegistry.getAll();

// Filter tags by category
const itemTags = tagRegistry.getAll({ category: 'item' });

// Search for tags
const matchingTags = tagRegistry.search('weapon');

// Get specific tag
const weaponTag = tagRegistry.getById('weapon');
```

**📖 For complete tag system documentation, see [docs/TAGS.md](docs/TAGS.md)**

## Documentation

### User Guides
- **[Custom Sounds Guide](docs/user-guide-custom-sounds.md)** - How to add and manage custom UI sound effects
- **[Tags System Documentation](docs/TAGS.md)** - Complete guide to the tag system

### Development Documentation
- **[Refactoring Guide](REFACTORING_GUIDE.md)** - System architecture and refactoring patterns
- **[Testing Guide](TESTING_GUIDE.md)** - Comprehensive testing strategy and implementation
- **[Migration Guide](MIGRATION_GUIDE.md)** - Upgrade and migration procedures

## Development

### Build Process

The system uses a modern build pipeline that creates a complete runtime package:

- **Build complete system**: `npm run build`
- **Development mode** (auto-recompile): `npm run dev`
- **TypeScript compilation**: `npm run build:ts`
- **SCSS compilation**: `npm run build:scss`

**Important Build Notes**: 
- `npm run build` creates a complete system in `/dist` directory
- The `/dist` directory contains everything needed to run the system
- Source files are in the project root; built files go to `/dist`
- Only commit source files; `/dist` is generated during build/release

### SCSS Compilation

The system uses SCSS for styling:

- **Build once**: `npm run build`
- **Watch mode** (auto-recompile): `npm run dev`
- **SCSS only**: `npm run build:scss`
- **SCSS watch**: `npm run watch-scss`

**Important**: 
- Always edit the `.scss` file, never the `.css` file directly
- The `.css` file is generated and will be overwritten
- Only source `.scss` files should be committed to version control

### SCSS Development

The system uses SCSS for streamlined styling:

- **Build complete styles**: `npm run build`
- **Watch mode** (auto-recompile): `npm run dev`
- **SCSS only**: `npm run build:scss`

**Important**: Always edit `.scss` files, never `.css` directly. The CSS is generated from SCSS source.

## Visual Design

Avant features a sleek, cyberpunk-inspired dark theme with:
- **Professional dark aesthetic** optimized for long gaming sessions
- **Cyan accent colors** (#00E0DC) for key interactive elements
- **Consistent typography** using Orbitron (headers) and Exo 2 (body text)
- **Accessibility-compliant** color contrast ratios for readability

The system is designed with a single, polished theme to provide:
- **Optimal performance** without theme switching overhead
- **Consistent user experience** across all FoundryVTT environments  
- **Reduced complexity** for easier maintenance and development
- **Eye strain reduction** with carefully chosen dark colors

*Theme customization was removed in v0.2.4 to focus on core functionality and performance.*

## System Requirements

- FoundryVTT v13.344+
- Node.js 16+ (for development/building only)

## System ID & Directory

- The system ID is `avant`.
- The directory in `Data/systems/` must be named `avant` for FoundryVTT to recognize the system.

 
