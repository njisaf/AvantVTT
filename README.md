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

## Theming System

The Avant system includes a powerful theming system that allows you to customize the appearance of character sheets and UI elements. You can use built-in themes or create your own custom themes.

### Accessing the Theme Manager

1. **In-Game**: Open the game settings (⚙️) and look for "Avant Theme Manager" in the system settings
2. **Alternative**: Use the game settings sidebar to access theme options

### Built-in Themes

The system comes with several built-in themes:
- **Dark** (default) - Cyberpunk-inspired dark theme with cyan accents
- **Light** - Clean light theme for better readability
- **Forest Green** - Nature-inspired theme with green tones

### Creating Custom Themes

Custom themes are JSON files that define color schemes, fonts, and visual effects. Here's how to create one:

#### 1. Basic Theme Structure

Create a `.json` file with the following structure:

```json
{
  "name": "My Custom Theme",
  "author": "Your Name",
  "version": "1.0.0",
  "description": "A description of your theme",
  "colors": {
    "backgrounds": {
      "primary": "#1C1C1C",
      "secondary": "#2A2A2A", 
      "tertiary": "#333333"
    },
    "text": {
      "primary": "#FFFFFF",
      "secondary": "#BFBFBF",
      "muted": "#808080"
    },
    "accents": {
      "primary": "#FF6B6B",
      "secondary": "#4ECDC4",
      "tertiary": "#45B7D1"
    },
    "borders": {
      "primary": "#404040",
      "accent": "#FF6B6B"
    },
    "states": {
      "success": "#10B981",
      "warning": "#F59E0B", 
      "error": "#EF4444",
      "info": "#3B82F6"
    }
  },
  "typography": {
    "fontPrimary": "'Inter', sans-serif",
    "fontDisplay": "'Orbitron', monospace"
  },
  "effects": {
    "shadows": {
      "primary": "0 4px 20px rgba(255, 107, 107, 0.1)",
      "accent": "0 0 20px rgba(255, 107, 107, 0.3)",
      "deep": "0 8px 32px rgba(0, 0, 0, 0.6)"
    },
    "gradients": {
      "primary": "linear-gradient(135deg, #1C1C1C 0%, #2A2A2A 100%)",
      "accent": "linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)"
    }
  }
}
```

#### 2. Color Guidelines

**Backgrounds**: Use darker colors for dark themes, lighter for light themes
- `primary`: Main background (sheet body, main areas)
- `secondary`: Secondary backgrounds (sidebars, headers)
- `tertiary`: UI element backgrounds (buttons, tiles)

**Text**: Ensure good contrast with your backgrounds
- `primary`: Main text color (high contrast)
- `secondary`: Secondary text (medium contrast)
- `muted`: Subtle text (low contrast)

**Accents**: Colors for highlights and interactive elements
- `primary`: Main accent (borders, highlights, active states)
- `secondary`: Secondary accent (alternative highlights)
- `tertiary`: Additional accent color

#### 3. Example Themes

**Warm Orange Theme**:
```json
{
  "name": "Sunset Glow",
  "author": "ThemeCreator",
  "version": "1.0.0",
  "description": "Warm orange and amber tones",
  "colors": {
    "backgrounds": {
      "primary": "#1A1A1A",
      "secondary": "#2C1810",
      "tertiary": "#3D2416"
    },
    "accents": {
      "primary": "#FF8C42",
      "secondary": "#FFB347",
      "tertiary": "#FFA500"
    }
  }
}
```

**Cool Blue Theme**:
```json
{
  "name": "Arctic Breeze", 
  "author": "ThemeCreator",
  "version": "1.0.0",
  "description": "Cool blues and teals",
  "colors": {
    "backgrounds": {
      "primary": "#0F1419",
      "secondary": "#1A2332",
      "tertiary": "#253345"
    },
    "accents": {
      "primary": "#64B5F6",
      "secondary": "#4FC3F7",
      "tertiary": "#29B6F6"
    }
  }
}
```

### Installing Custom Themes

1. **Open Theme Manager**: Access through game settings
2. **Upload Theme**: Click "Choose Theme File" and select your `.json` file
3. **Apply Theme**: Once uploaded, click "Select" on your custom theme
4. **Verify**: Check that colors apply throughout the interface

### Theme Development Tips

- **Test Contrast**: Ensure text is readable on your background colors
- **Use Color Tools**: Tools like [Coolors.co](https://coolors.co) help create harmonious palettes
- **Start Simple**: Begin with just background and accent colors, then expand
- **Test in Different Lighting**: Verify your theme works in various environments
- **Export Backups**: Use the "Export" button to backup your themes

### Troubleshooting Themes

**Theme not applying**: 
- Refresh the page after applying a theme
- Check browser console for JSON syntax errors
- Ensure all required color properties are defined

**Colors look wrong**:
- Verify hex color codes are valid (e.g., `#FF0000`)
- Check contrast ratios for accessibility
- Test with different content types (character sheets, items, etc.)

**Theme Manager issues**:
- Clear browser cache and refresh
- Check that theme JSON structure matches the examples above
- Ensure file is valid JSON (use [JSONLint](https://jsonlint.com) to validate)

### Sharing Themes

Custom themes can be shared by:
1. **Export**: Use the "Export" button in Theme Manager
2. **Share JSON**: Distribute the `.json` file
3. **Community**: Share in Discord or GitHub discussions

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
 
