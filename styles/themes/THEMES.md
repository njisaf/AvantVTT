# Avant Theming System

The Avant system includes a powerful theming system that allows you to customize the appearance of character sheets and UI elements. You can use built-in themes, create custom themes, or extend the theming engine with new variables.

## Table of Contents
- [User Guide](#user-guide)
  - [Accessing the Theme Manager](#accessing-the-theme-manager)
  - [Built-in Themes](#built-in-themes)
  - [Creating Custom Themes](#creating-custom-themes)
  - [Installing Custom Themes](#installing-custom-themes)
  - [Theme Development Tips](#theme-development-tips)
  - [Troubleshooting Themes](#troubleshooting-themes)
  - [Sharing Themes](#sharing-themes)
- [Developer Guide](#developer-guide)
  - [Extending the Theming Engine](#extending-the-theming-engine)
  - [Adding New Theme Variables](#adding-new-theme-variables)
  - [SCSS Integration](#scss-integration)
  - [JavaScript Theme Application](#javascript-theme-application)
  - [Best Practices](#best-practices)

---

## User Guide

### Accessing the Theme Manager

1. **In-Game**: Open the game settings (⚙️) and look for "Avant Theme Manager" in the system settings
2. **Alternative**: Use the game settings sidebar to access theme options

### Built-in Themes

The system comes with several built-in themes:
- **Dark** (default) - Cyberpunk-inspired dark theme with cyan accents
- **Light** - Clean light theme for better readability

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
    "text": {
      "primary": "#FFF8E1",
      "secondary": "#FFCC80",
      "muted": "#FF8A65"
    },
    "accents": {
      "primary": "#FF8C42",
      "secondary": "#FFB347",
      "tertiary": "#FFA500"
    },
    "borders": {
      "primary": "#5D4037",
      "accent": "#FF8C42"
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
    "text": {
      "primary": "#E1F5FE",
      "secondary": "#81D4FA",
      "muted": "#4FC3F7"
    },
    "accents": {
      "primary": "#64B5F6",
      "secondary": "#4FC3F7",
      "tertiary": "#29B6F6"
    },
    "borders": {
      "primary": "#37474F",
      "accent": "#64B5F6"
    }
  }
}
```

### Theme Development CLI Tools

The Avant system includes powerful command-line tools for theme development. These tools help designers and developers create, validate, and manage themes more efficiently.

#### Prerequisites

Ensure you have Node.js 16+ installed and run:
```bash
npm install
```

#### Available Commands

**Help and Documentation**:
- `npm run theme:help` - Display help information and available commands
- `npm run theme:docs` - Generate comprehensive theme variable documentation
- `npm run theme:list` - List all available theme variables with descriptions

**Theme Templates**:
- `npm run theme:template` - Generate a basic theme template (required variables only)
- `npm run theme:template:full` - Generate a complete theme template (all variables)

**Validation and Testing**:
- `npm run theme:validate <file>` - Validate a theme JSON file
- `npm run test:themes` - Create example themes and validate them

**Development Tools**:
- `npm run theme:examples` - Create example theme files in `styles/themes/examples/`
- `npm run theme:mappings` - Generate JavaScript mappings for developers
- `npm run docs:update` - Update theme documentation

#### Quick Start Workflow

1. **Generate a theme template**:
   ```bash
   npm run theme:template > my-new-theme.json
   ```

2. **Edit the theme** in your favorite editor:
   ```bash
   # Edit my-new-theme.json with your colors and settings
   ```

3. **Validate your theme**:
   ```bash
   npm run theme:validate my-new-theme.json
   ```

4. **Test in FoundryVTT** using the Theme Manager

#### Advanced Usage

**Generate a complete theme with all options**:
```bash
npm run theme:template:full > complete-theme.json
```

**List all available theme variables**:
```bash
npm run theme:list
```

**Create example themes for reference**:
```bash
npm run theme:examples
# Creates minimal-example.json and complete-example.json in styles/themes/examples/
```

**Generate theme documentation**:
```bash
npm run theme:docs > THEME-VARIABLES.md
```

#### Theme Template Structure

When you run `npm run theme:template`, you'll get a JSON file with this structure:

```json
{
  "name": "New Theme",
  "author": "Theme Author",
  "version": "1.0.0",
  "description": "Theme description",
  "colors": {
    "backgrounds": {
      "primary": "#1C1C1C",
      "secondary": "#2A2A2A",
      "tertiary": "#333333"
    },
    "text": {
      "primary": "#FFFFFF",
      "secondary": "#BFBFBF"
    },
    "accents": {
      "primary": "#00E0DC"
    },
    "borders": {
      "primary": "#404040"
    }
  }
}
```

This includes only the required variables. For a complete template with all optional variables, use `npm run theme:template:full`.

#### Validation Features

The validation tool checks for:
- ✅ Valid JSON syntax
- ✅ Required theme properties (name, author, version, colors)
- ✅ Valid color formats (hex codes, rgb(), etc.)
- ✅ Complete theme structure
- ⚠️ Warnings for missing optional properties
- 💡 Suggestions for improvements

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

---

## Developer Guide

### Extending the Theming Engine

The Avant theming system is built on CSS custom properties (CSS variables) that can be dynamically set by JavaScript. This allows for powerful theme customization and extension.

#### Architecture Overview

```
Theme JSON → JavaScript Processing → CSS Custom Properties → SCSS Consumption
```

1. **Theme JSON**: Defines color values and other theme properties
2. **JavaScript Processing**: Converts JSON to CSS custom properties 
3. **CSS Custom Properties**: Browser-native variables that can be changed at runtime
4. **SCSS Consumption**: SCSS uses CSS custom properties with fallbacks

### Adding New Theme Variables

#### 1. Define in Base Theme Mixin

First, add your new variable to the base theme interface in `styles/themes/_base.scss`:

```scss
// styles/themes/_base.scss
@mixin theme-interface {
  // Existing variables...
  --theme-bg-primary: #{$bg-primary};
  --theme-text-primary: #{$text-primary};
  
  // NEW: Add your custom variables
  --theme-navbar-bg: #{$bg-secondary};
  --theme-navbar-accent: #{$accent-cyan};
  --theme-tooltip-bg: #{$bg-tertiary};
  --theme-tooltip-border: #{$border-primary};
  --theme-animation-speed: 0.3s;
  --theme-border-radius: 0px;
}
```

#### 2. Add to Built-in Theme Definitions

Update the built-in themes to include your new variables:

```scss
// styles/themes/_dark.scss
@mixin theme-dark {
  @include theme-interface;
  
  // Existing dark theme variables...
  --theme-bg-primary: #1C1C1C;
  --theme-text-primary: #FFFFFF;
  
  // NEW: Dark theme values for your variables
  --theme-navbar-bg: #2A2A2A;
  --theme-navbar-accent: #00E0DC;
  --theme-tooltip-bg: #333333;
  --theme-tooltip-border: #404040;
  --theme-animation-speed: 0.3s;
  --theme-border-radius: 0px;
}
```

```scss
// styles/themes/_light.scss
@mixin theme-light {
  @include theme-interface;
  
  // Existing light theme variables...
  --theme-bg-primary: #FFFFFF;
  --theme-text-primary: #333333;
  
  // NEW: Light theme values for your variables
  --theme-navbar-bg: #F5F5F5;
  --theme-navbar-accent: #2196F3;
  --theme-tooltip-bg: #FAFAFA;
  --theme-tooltip-border: #E0E0E0;
  --theme-animation-speed: 0.2s;
  --theme-border-radius: 4px;
}
```

#### 3. Update JavaScript Theme Application

Add your new variables to the theme manager's variable mapping in `scripts/theme-manager.js`:

```javascript
// scripts/theme-manager.js
applyCustomTheme(themeData, element) {
    // Existing mappings...
    const variableMap = {
        'colors.backgrounds.primary': '--theme-bg-primary',
        'colors.text.primary': '--theme-text-primary',
        
        // NEW: Add mappings for your custom variables
        'interface.navbar.background': '--theme-navbar-bg',
        'interface.navbar.accent': '--theme-navbar-accent',
        'interface.tooltip.background': '--theme-tooltip-bg',
        'interface.tooltip.border': '--theme-tooltip-border',
        'animation.speed': '--theme-animation-speed',
        'interface.borderRadius': '--theme-border-radius'
    };
    
    // Apply custom variables...
    for (const [jsonPath, cssVar] of Object.entries(variableMap)) {
        const value = this.getNestedProperty(themeData, jsonPath);
        if (value !== undefined) {
            element.style.setProperty(cssVar, value);
        }
    }
}
```

#### 4. Use in SCSS

Now you can use your new variables throughout the SCSS with fallbacks:

```scss
// styles/avant.scss
.avant {
  // NEW: Use your custom variables in CSS
  .custom-navbar {
    background: var(--theme-navbar-bg, $bg-secondary);
    border-bottom: 2px solid var(--theme-navbar-accent, $accent-cyan);
    transition: all var(--theme-animation-speed, 0.3s) ease;
    border-radius: var(--theme-border-radius, 0px);
  }
  
  .custom-tooltip {
    background: var(--theme-tooltip-bg, $bg-tertiary);
    border: 1px solid var(--theme-tooltip-border, $border-primary);
    border-radius: var(--theme-border-radius, 0px);
  }
  
  // Animations can use theme variables too
  .fade-transition {
    transition: opacity var(--theme-animation-speed, 0.3s) ease;
  }
}
```

#### 5. Update JSON Theme Structure

Document the new theme properties for theme creators:

```json
{
  "name": "Extended Theme Example",
  "author": "Developer",
  "version": "1.0.0",
  "description": "Theme with extended variables",
  "colors": {
    "backgrounds": {
      "primary": "#1C1C1C"
    },
    "text": {
      "primary": "#FFFFFF"
    }
  },
  "interface": {
    "navbar": {
      "background": "#2A2A2A",
      "accent": "#00E0DC"
    },
    "tooltip": {
      "background": "#333333",
      "border": "#404040"
    },
    "borderRadius": "4px"
  },
  "animation": {
    "speed": "0.2s"
  }
}
```

### SCSS Integration

#### Variable Naming Convention

Follow this pattern for consistency:
- `--theme-{category}-{property}`: e.g., `--theme-bg-primary`, `--theme-text-secondary`
- `--theme-{component}-{property}`: e.g., `--theme-navbar-bg`, `--theme-button-border`

#### Fallback Pattern

Always provide Sass variable fallbacks:
```scss
.element {
  background: var(--theme-bg-primary, $bg-primary);
  color: var(--theme-text-primary, $text-primary);
}
```

#### Mixin Integration

Create mixins for complex theme patterns:
```scss
@mixin themed-card($background-var: --theme-bg-secondary, $border-var: --theme-border-primary) {
  background: var(#{$background-var}, $bg-secondary);
  border: 1px solid var(#{$border-var}, $border-primary);
  border-radius: var(--theme-border-radius, 0px);
  transition: all var(--theme-animation-speed, 0.3s) ease;
}

// Usage
.character-card {
  @include themed-card(--theme-bg-tertiary, --theme-accent-primary);
}
```

### JavaScript Theme Application

#### Custom Property Helper Functions

Add utility functions to the theme manager:

```javascript
// scripts/theme-manager.js
class AvantThemeManager {
    /**
     * Set a CSS custom property on an element
     */
    setThemeProperty(element, property, value) {
        element.style.setProperty(property, value);
        console.log(`Set ${property}: ${value}`);
    }
    
    /**
     * Get current value of a CSS custom property
     */
    getThemeProperty(element, property) {
        return getComputedStyle(element).getPropertyValue(property);
    }
    
    /**
     * Apply multiple properties at once
     */
    setThemeProperties(element, properties) {
        Object.entries(properties).forEach(([prop, value]) => {
            this.setThemeProperty(element, prop, value);
        });
    }
}
```

#### Dynamic Theme Variable Updates

You can update theme variables dynamically:

```javascript
// Example: Change animation speed based on user preferences
updateAnimationSpeed(speed) {
    const elements = document.querySelectorAll('.avant');
    elements.forEach(element => {
        this.setThemeProperty(element, '--theme-animation-speed', speed + 's');
    });
}

// Example: Toggle border radius
toggleBorderRadius() {
    const elements = document.querySelectorAll('.avant');
    const currentRadius = this.getThemeProperty(elements[0], '--theme-border-radius');
    const newRadius = currentRadius === '0px' ? '8px' : '0px';
    
    elements.forEach(element => {
        this.setThemeProperty(element, '--theme-border-radius', newRadius);
    });
}
```

### Best Practices

#### 1. Performance Considerations
- **Minimize Property Changes**: Batch CSS custom property updates
- **Use Specific Selectors**: Target `.avant` elements specifically
- **Cache Element References**: Don't query DOM repeatedly

#### 2. Backwards Compatibility
- **Always Provide Fallbacks**: Use Sass variables as fallbacks in CSS custom properties
- **Test Both V12 and V13**: Ensure compatibility across FoundryVTT versions
- **Progressive Enhancement**: Core functionality should work without themes

#### 3. Variable Organization
- **Group Related Variables**: Keep navbar, tooltip, animation variables together
- **Use Consistent Naming**: Follow established patterns
- **Document New Variables**: Update this guide when adding variables

#### 4. Testing
- **Test All Themes**: Ensure new variables work with built-in and custom themes
- **Check Contrast**: Verify accessibility with new color variables
- **Test Dynamic Updates**: Ensure runtime variable changes work correctly

#### 5. Example: Adding a New UI Component

Here's a complete example of adding theming support for a new "notification" component:

**1. Add variables to base theme:**
```scss
// _base.scss
@mixin theme-interface {
  // ... existing variables
  --theme-notification-bg: #{$bg-tertiary};
  --theme-notification-border: #{$border-primary};
  --theme-notification-success: #{$success-color};
  --theme-notification-warning: #{$warning-color};
  --theme-notification-error: #{$error-color};
}
```

**2. Update built-in themes:**
```scss
// _dark.scss and _light.scss
--theme-notification-bg: #2A2A2A; // or appropriate light theme color
--theme-notification-border: #404040;
--theme-notification-success: #10B981;
--theme-notification-warning: #F59E0B;
--theme-notification-error: #EF4444;
```

**3. Add JavaScript mapping:**
```javascript
// theme-manager.js
'interface.notification.background': '--theme-notification-bg',
'interface.notification.border': '--theme-notification-border',
'colors.states.success': '--theme-notification-success',
'colors.states.warning': '--theme-notification-warning',
'colors.states.error': '--theme-notification-error'
```

**4. Use in SCSS:**
```scss
// avant.scss
.avant-notification {
  background: var(--theme-notification-bg, $bg-tertiary);
  border: 1px solid var(--theme-notification-border, $border-primary);
  
  &.success {
    border-left-color: var(--theme-notification-success, #10B981);
  }
  
  &.warning {
    border-left-color: var(--theme-notification-warning, #F59E0B);
  }
  
  &.error {
    border-left-color: var(--theme-notification-error, #EF4444);
  }
}
```

This comprehensive approach ensures your new theme variables are properly integrated throughout the theming system! 