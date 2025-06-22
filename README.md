# Avant

A narrative RPG system for FoundryVTT.

## Quick Start

### Prerequisites

- Node.js 16+ 
- npm (comes with Node.js)

### Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the system**:
   ```bash
   npm run build
   ```

3. **For active development** (auto-recompiles on changes):
   ```bash
   npm run dev
   ```

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

**End users only need the contents of `/dist`** (provided in the release zip).

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

### Theme Development

The Avant system includes powerful theming tools:

- **Theme help**: `npm run theme:help`
- **Generate template**: `npm run theme:template`
- **Generate full template**: `npm run theme:template:full`
- **List variables**: `npm run theme:list`
- **Create examples**: `npm run theme:examples`
- **Validate theme**: `npm run theme:validate <file>`
- **Generate docs**: `npm run theme:docs`
- **Update documentation**: `npm run docs:update`
- **Test themes**: `npm run test:themes`

### Documentation

- **Update theme docs**: `npm run docs:update`
- **Generate theme variables**: `npm run docs:themes`

### Testing

- **Test themes**: `npm run test:themes`

## Theming (Updated)

Avant includes a robust theming system with three built-in themes:
- Dark (Cyberpunk Dark)
- Light (Clean Light)
- Forest Green (Nature-inspired)

Theme persistence is fully fixed and works reliably in all environments. Custom themes are supported via the theme manager.

📖 **For complete theming documentation, see [THEMES.md](styles/themes/THEMES.md)**

This includes:
- User guide for creating and applying custom themes
- Developer guide for extending the theming engine  
- CLI utilities and npm scripts for theme development
- Examples and troubleshooting

## Installation (Recommended)

Avant is now distributed as an official release package via GitHub Releases. End users should NOT clone the repository or build from source unless developing or contributing.

### Method 1: Manifest URL (Recommended)
1. In FoundryVTT, go to "Add-on Modules" → "Install System"
2. Use manifest URL: `https://github.com/njisaf/AvantVTT/releases/latest/download/system.json`
3. Click "Install"

### Method 2: Manual Download
1. Download the latest release zip from: `https://github.com/njisaf/AvantVTT/releases/latest/download/avant-v0.1.6.zip`
2. Extract to your FoundryVTT `Data/systems/avant/` directory (the directory name MUST be `avant`)
3. Restart FoundryVTT
4. Create a new world using the "Avant" system

**Note:** The `/dist` directory in the release zip contains everything needed to run the system. Do not copy source files unless you are developing.

## Release Process (For Maintainers)

Avant uses a modern build and release workflow:

1. Make changes in TypeScript (`.ts`) and SCSS (`.scss`) source files only.
2. Run `npm run build` to generate the complete `/dist` runtime package (TypeScript → JS, SCSS → CSS).
3. Zip the contents of `/dist` (not the folder itself) as `avant-v0.1.6.zip`.
4. Create a new GitHub Release and upload both `avant-v0.1.6.zip` and the generated `system.json`.
5. Update the manifest URL and download URL in the release description if needed.
6. Test installation via manifest URL in a clean FoundryVTT v13 instance.

**Important:** The system ID is `avant` and the directory name in `Data/systems/` must match exactly.

## TypeScript & SCSS-First Development

- All source code is written in TypeScript and SCSS.
- Never edit `.css` or built `.js` files directly.
- Only commit source files; `/dist` is generated during build/release.

## System Requirements

- FoundryVTT v13.344+
- Node.js 16+ (for development/building only)

## System ID & Directory

- The system ID is `avant`.
- The directory in `Data/systems/` must be named `avant` for FoundryVTT to recognize the system.

## Support

- **GitHub**: [AvantVTT Repository](https://github.com/njisaf/AvantVTT)
- **Discord**: bipolardiceroller, ManSally
 
