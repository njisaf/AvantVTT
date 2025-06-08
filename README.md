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

## File Structure

```
avantVtt/
├── package.json         # Node.js package configuration
├── system.json          # System manifest and configuration
├── scripts/
│   ├── avant.js         # Core system JavaScript
│   ├── theme-config.js  # Theme configuration definitions
│   ├── theme-manager.js # Theme management system
│   └── theme-utils.js   # Theme development utilities
├── templates/
│   ├── actor-sheet.html # Character sheet template
│   └── item/            # Item sheet templates
├── styles/
│   ├── avant.scss       # SCSS source file (edit this)
│   ├── avant.css        # Compiled CSS (generated from SCSS)
│   └── themes/          # Theming system files
├── lang/
│   └── en.json          # English localization
└── assets/              # System assets
```

## Development

### SCSS Compilation

The system uses SCSS for styling. Available commands:

- **Build once**: `npm run build`
- **Watch mode** (auto-recompile): `npm run dev`
- **SCSS only**: `npm run compile-scss`
- **SCSS watch**: `npm run watch-scss`

**Important**: 
- Always edit the `.scss` file, never the `.css` file directly
- The `.css` file is generated and will be overwritten
- Both `.scss` and `.css` files should be committed to version control

### Theme Development

The Avant system includes powerful theming tools:

- **Theme help**: `npm run theme:help`
- **Generate template**: `npm run theme:template`
- **Generate full template**: `npm run theme:template:full`
- **List variables**: `npm run theme:list`
- **Create examples**: `npm run theme:examples`
- **Validate theme**: `npm run theme:validate <file>`
- **Generate docs**: `npm run theme:docs`

### Documentation

- **Update theme docs**: `npm run docs:update`
- **Generate theme variables**: `npm run docs:themes`

### Testing

- **Test themes**: `npm run test:themes`

## Theming

The Avant system includes a powerful theming system with built-in themes and support for custom themes.

📖 **For complete theming documentation, see [THEMES.md](styles/themes/THEMES.md)**

This includes:
- User guide for creating and applying custom themes
- Developer guide for extending the theming engine  
- CLI utilities and npm scripts for theme development
- Examples and troubleshooting

## Installation

### Method 1: Manual Installation
1. Download the system files
2. Extract to your FoundryVTT `Data/systems/avant/` directory
3. Restart FoundryVTT
4. Create a new world using the "Avant" system

### Method 2: Manifest URL
1. In FoundryVTT, go to "Add-on Modules" → "Install System"
2. Use manifest URL: `https://raw.githubusercontent.com/njisaf/AvantVTT/main/system.json`
3. Click "Install"

## Requirements

- FoundryVTT v13+ (v12 compatible)
- Node.js 16+ (for development)

## Support

- **GitHub**: [AvantVTT Repository](https://github.com/njisaf/AvantVTT)
- **Discord**: bipolardiceroller, ManSally
 
