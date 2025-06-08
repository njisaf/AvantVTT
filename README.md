# Avant

A narrative RPG system for FoundryVTT.

## File Structure

```
avantVtt/
├── system.json          # System manifest and configuration
├── scripts/
│   └── avant.js         # Core system JavaScript
├── templates/
│   ├── actor-sheet.html # Character sheet template
│   └── item/            # Item sheet templates
├── styles/
│   ├── avant.scss       # SCSS source file (edit this)
│   └── avant.css        # Compiled CSS (generated from SCSS)
├── lang/
│   └── en.json          # English localization
└── assets/              # System assets
```

## Development

### SCSS Compilation

The system uses SCSS for styling. When making style changes:

1. **Edit** `styles/avant.scss` (the source file)
2. **Compile** to CSS using Dart Sass:
   ```bash
   npx sass styles/avant.scss styles/avant.css
   ```
3. **Deploy** using your normal deployment process

**Important**: 
- Always edit the `.scss` file, never the `.css` file directly
- The `.css` file is generated and will be overwritten
- Both `.scss` and `.css` files should be committed to version control

### Watch Mode (Optional)

For continuous development, you can use watch mode to automatically recompile on changes:

```bash
npx sass --watch styles/avant.scss styles/avant.css
```

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

## Support

- **GitHub**: [AvantVTT Repository](https://github.com/njisaf/AvantVTT)
- **Discord**: bipolardiceroller, ManSally
 
