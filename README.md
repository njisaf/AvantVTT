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
├── template.json        # System data template definitions
├── RULES.md             # System development rules and patterns
├── scripts/
│   ├── avant.js         # Core system JavaScript
│   ├── sheets/          # Sheet classes
│   │   ├── actor-sheet.js  # Actor sheet implementation
│   │   └── item-sheet.js   # Item sheet implementation
│   ├── data/            # Data structure definitions
│   │   ├── actor-data.js   # Actor data models
│   │   └── item-data.js    # Item data models
│   ├── dialogs/         # Dialog implementations
│   ├── chat/            # Chat message handlers
│   ├── themes/          # Theme management system
│   └── utils/           # Utility functions
├── templates/
│   ├── actor-sheet.html    # Character sheet template
│   ├── item-sheet.html     # General item sheet template
│   ├── theme-manager.html  # Theme management interface
│   ├── reroll-dialog.html  # Fortune point reroll dialog
│   └── item/               # Specific item sheet templates
│       ├── item-action-sheet.html
│       ├── item-armor-sheet.html
│       ├── item-augment-sheet.html
│       ├── item-feature-sheet.html
│       ├── item-gear-sheet.html
│       ├── item-talent-sheet.html
│       └── item-weapon-sheet.html
├── styles/
│   ├── avant.scss       # SCSS source file (edit this)
│   ├── avant.css        # Compiled CSS (generated from SCSS)
│   ├── avant.css.map    # Source map for debugging
│   └── themes/          # Theming system files
├── lang/
│   └── en.json          # English localization
└── assets/              # System assets (currently empty)
```

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
2. Use manifest URL: `https://github.com/njisaf/AvantVTT/releases/latest/download/system.json`
3. Click "Install"

## Requirements

- FoundryVTT v13+
- Node.js 16+ (for development)

## Support

- **GitHub**: [AvantVTT Repository](https://github.com/njisaf/AvantVTT)
- **Discord**: bipolardiceroller, ManSally
 
