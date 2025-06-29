# Avant VTT Accessibility Module

## 🎯 Overview

The Accessibility Module provides a unified, extensible system for managing **accessibility features** and **WCAG compliance** in the Avant VTT FoundryVTT system. This module centralizes all accessibility-related functionality that was previously scattered throughout the codebase, making it easier to manage, test, and enhance accessibility features.

## 📁 Module Structure

```
scripts/accessibility/
├── README.md              # This documentation
├── index.ts               # Main module exports
├── color-contrast.ts      # Color contrast and readability functions
├── keyboard-navigation.ts # Keyboard accessibility utilities  
├── screen-reader.ts       # Screen reader support utilities
├── high-contrast.ts       # High contrast mode support
├── reduced-motion.ts      # Reduced motion preferences
├── focus-management.ts    # Focus trap and management utilities
└── types/
    ├── accessibility.ts   # Accessibility-related type definitions
    └── wcag.ts           # WCAG compliance types
```

## 🏗️ Architecture Principles

### **Separation of Concerns**
- **Color & Contrast**: WCAG-compliant color calculations and validation
- **Keyboard Navigation**: Focus management and keyboard accessibility  
- **Screen Reader Support**: ARIA attributes and semantic HTML helpers
- **User Preferences**: Respecting reduced motion, high contrast, etc.

### **Optional by Default**
- **Opt-in Approach**: Accessibility features are optional unless explicitly enabled
- **Designer Control**: Preserves original design intent by default
- **Progressive Enhancement**: Adds accessibility without breaking existing functionality

### **WCAG 2.1 AA Compliance**
- **Contrast Standards**: Meets or exceeds WCAG AA contrast requirements (4.5:1)
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and semantic structure

## 🎨 Color & Contrast Features

The color contrast system provides WCAG-compliant color analysis and suggestions.

### **Core Functions**

#### `calculateContrastRatio(foreground, background)`
Calculates the contrast ratio between two colors using WCAG standards.

```typescript
import { calculateContrastRatio } from '../accessibility/color-contrast';

const ratio = calculateContrastRatio('#000000', '#FFFFFF');
console.log(ratio); // 21 (perfect contrast)

const ratio2 = calculateContrastRatio('#FF6B6B', '#FFFFFF'); 
console.log(ratio2); // ~3.1 (below AA standard)
```

#### `checkColorContrast(foreground, background, options?)`
Comprehensive contrast checking with WCAG compliance validation.

```typescript
import { checkColorContrast } from '../accessibility/color-contrast';

const result = checkColorContrast('#FF6B6B', '#FFFFFF', { 
  level: 'AA',
  provideSuggestions: true 
});

console.log(result);
// {
//   ratio: 3.1,
//   passes: false,
//   level: undefined,
//   suggestions: [
//     { color: '#CC0000', ratio: 4.6, description: 'Darker red for AA compliance' }
//   ]
// }
```

#### `isLightColor(hexColor)`
Determines if a color is light or dark using relative luminance calculation.

```typescript
import { isLightColor } from '../accessibility/color-contrast';

console.log(isLightColor('#FFFFFF')); // true
console.log(isLightColor('#000000')); // false  
console.log(isLightColor('#FF6B6B')); // true (light-ish red)
```

#### `generateAccessibleTextColor(backgroundColor, options?)`
Automatically generates accessible text color for any background.

```typescript
import { generateAccessibleTextColor } from '../accessibility/color-contrast';

const textColor = generateAccessibleTextColor('#FF6B6B', { level: 'AA' });
console.log(textColor); // '#000000' or '#FFFFFF' based on contrast requirements
```

### **Integration with Trait System**

The trait rendering system can optionally use accessibility features:

```typescript
// Optional auto-contrast in trait rendering
import { renderTraitChips } from '../logic/chat/trait-renderer';

// Default behavior - uses explicit text colors
const standardRender = renderTraitChips(traits);

// Opt-in accessibility mode
const accessibleRender = renderTraitChips(traits, {
  enableAutoContrast: true,
  contrastLevel: 'AA'
});
```

## ⌨️ Keyboard Navigation

Provides utilities for comprehensive keyboard accessibility.

### **Focus Management**

#### `createFocusTrap(element, options?)`
Creates a focus trap for modal dialogs and popups.

```typescript
import { createFocusTrap } from '../accessibility/focus-management';

const trap = createFocusTrap(modalElement, {
  initialFocus: '#first-input',
  returnFocus: true,
  escapeDeactivates: true
});

trap.activate();
// Later...
trap.deactivate();
```

#### `manageFocusOrder(container, selectors?)`
Ensures logical tab order within a container.

```typescript
import { manageFocusOrder } from '../accessibility/focus-management';

manageFocusOrder(sheetElement, [
  '.sheet-header input',
  '.sheet-tabs button', 
  '.sheet-content .form-control',
  '.sheet-footer button'
]);
```

### **Keyboard Event Helpers**

#### `handleKeyboardActivation(element, callback)`
Adds both click and keyboard activation to elements.

```typescript
import { handleKeyboardActivation } from '../accessibility/keyboard-navigation';

handleKeyboardActivation(button, (event) => {
  console.log('Activated via click or Enter/Space key');
});
```

## 📢 Screen Reader Support

Enhances screen reader experience with proper ARIA attributes and announcements.

### **ARIA Helpers**

#### `addAriaLabel(element, label, description?)`
Adds comprehensive ARIA labeling to elements.

```typescript
import { addAriaLabel } from '../accessibility/screen-reader';

addAriaLabel(button, 'Delete Trait', 'Permanently removes this trait from the character');
// Results in: aria-label="Delete Trait" aria-description="Permanently removes..."
```

#### `announceLiveRegion(message, priority?)`
Makes dynamic announcements to screen readers.

```typescript
import { announceLiveRegion } from '../accessibility/screen-reader';

announceLiveRegion('Trait successfully added', 'polite');
announceLiveRegion('Critical error occurred', 'assertive');
```

### **Semantic Structure**

#### `createAccessibleList(items, options?)`
Creates properly structured lists with ARIA attributes.

```typescript
import { createAccessibleList } from '../accessibility/screen-reader';

const list = createAccessibleList(traits, {
  role: 'listbox',
  multiselectable: false,
  label: 'Available Traits'
});
```

## 🎭 High Contrast Mode

Provides high contrast mode support for users with visual impairments.

### **High Contrast Detection**

#### `detectHighContrastMode()`
Detects if user has high contrast mode enabled.

```typescript
import { detectHighContrastMode } from '../accessibility/high-contrast';

if (detectHighContrastMode()) {
  // Apply high contrast styles
  document.body.classList.add('high-contrast-mode');
}
```

#### `applyHighContrastTheme(element, theme?)`
Applies high contrast theme overrides.

```typescript
import { applyHighContrastTheme } from '../accessibility/high-contrast';

applyHighContrastTheme(sheetElement, {
  background: '#000000',
  text: '#FFFFFF', 
  border: '#FFFFFF',
  accent: '#FFFF00'
});
```

## 🎬 Reduced Motion Support

Respects user preferences for reduced motion.

### **Motion Preferences**

#### `prefersReducedMotion()`
Checks if user prefers reduced motion.

```typescript
import { prefersReducedMotion } from '../accessibility/reduced-motion';

if (prefersReducedMotion()) {
  // Disable animations
  element.style.transition = 'none';
}
```

#### `createMotionSafeAnimation(element, animation, fallback?)`
Creates animations that respect motion preferences.

```typescript
import { createMotionSafeAnimation } from '../accessibility/reduced-motion';

createMotionSafeAnimation(
  element,
  { transform: 'translateY(-10px)', duration: 300 }, // Full animation
  { opacity: '0.8' } // Reduced motion fallback
);
```

## ⚙️ Configuration & Settings

### **System Settings Integration**

The accessibility module integrates with FoundryVTT's settings system:

```typescript
// Automatic registration of accessibility settings
game.settings.register('avant', 'accessibility', {
  name: 'AVANT.Settings.Accessibility.Name',
  hint: 'AVANT.Settings.Accessibility.Hint', 
  scope: 'client',
  config: true,
  type: Object,
  default: {
    autoContrast: false,        // Enable automatic contrast calculation
    highContrast: false,        // Force high contrast mode
    reducedMotion: false,       // Disable animations
    contrastLevel: 'AA',        // WCAG compliance level ('AA' | 'AAA')
    announceChanges: true,      // Screen reader announcements
    keyboardNavigation: true    // Enhanced keyboard support
  }
});
```

### **Theme Integration**

Accessibility features integrate with the theme system:

```typescript
// Theme configuration with accessibility options
export interface ThemeConfig {
  // ... existing theme properties ...
  
  accessibility?: {
    /** Enable high contrast mode */
    highContrast?: boolean;
    
    /** Override all colors for accessibility */
    forceAccessibleColors?: boolean;
    
    /** Minimum contrast ratio */
    minContrastRatio?: number;
    
    /** Enhanced focus indicators */
    enhancedFocus?: boolean;
  };
}
```

## 🧪 Testing Accessibility

### **Automated Testing**

The module includes comprehensive test utilities:

```typescript
import { testColorContrast, testKeyboardNavigation } from '../accessibility/testing';

// Test color contrast compliance
const contrastResults = testColorContrast(element);
console.log(contrastResults);
// { passes: true, issues: [], recommendations: [] }

// Test keyboard navigation
const keyboardResults = testKeyboardNavigation(container);
console.log(keyboardResults);
// { tabOrder: ['#input1', '#button1'], issues: [], accessibility: 'compliant' }
```

### **Manual Testing Guidelines**

1. **Keyboard Navigation**: Tab through all interactive elements
2. **Screen Reader**: Test with NVDA, JAWS, or VoiceOver
3. **High Contrast**: Enable high contrast mode in OS
4. **Reduced Motion**: Set `prefers-reduced-motion: reduce`
5. **Color Blind**: Test with color blindness simulators

## 🔧 Migration from Scattered Functions

This module consolidates previously scattered accessibility code:

### **Before Migration**
```typescript
// Functions were scattered across multiple files:
// - trait-renderer.ts: isLightColor()
// - initialization-manager.ts: Handlebars helpers with contrast logic  
// - theme-utils.js: Color validation functions
// - _chips.scss: Accessibility CSS mixed with component styles
```

### **After Migration**
```typescript
// All accessibility functions centralized:
import { 
  isLightColor,
  checkColorContrast,
  createFocusTrap,
  addAriaLabel 
} from '../accessibility';

// Clean separation of concerns
// Optional accessibility features
// Comprehensive testing utilities
```

## 🚀 Future Extensions

### **Planned Features**
- **Voice Commands**: Integration with Web Speech API
- **Eye Tracking**: Support for eye tracking devices
- **Cognitive Accessibility**: Reading level analysis and simplification
- **Multi-language**: Accessibility features for international users

### **Plugin Architecture**
```typescript
// Future plugin system for accessibility extensions
import { AccessibilityPlugin } from '../accessibility/plugins';

class VoiceCommandPlugin extends AccessibilityPlugin {
  name = 'voice-commands';
  
  async initialize() {
    // Voice command implementation
  }
}
```

## 📚 WCAG 2.1 Reference

### **Level AA Compliance (Current Target)**
- ✅ **Color Contrast**: 4.5:1 minimum for normal text
- ✅ **Keyboard Navigation**: All functionality via keyboard
- ✅ **Focus Indicators**: Visible focus indicators
- ✅ **Screen Reader**: Proper ARIA labels and structure

### **Level AAA Compliance (Future Goal)**
- 🔄 **Enhanced Contrast**: 7:1 minimum for normal text
- 🔄 **Advanced Navigation**: Multiple navigation methods
- 🔄 **Cognitive Support**: Reading assistance and simplification

## 🔗 Integration Examples

### **Sheet Integration**
```typescript
// Enhanced actor sheet with accessibility
import { 
  createFocusTrap, 
  addAriaLabel,
  checkColorContrast 
} from '../accessibility';

export class AccessibleActorSheet extends AvantActorSheet {
  activateListeners(html) {
    super.activateListeners(html);
    
    // Add focus management
    this.focusTrap = createFocusTrap(html[0]);
    
    // Enhance all buttons with ARIA labels
    html.find('button').each((i, btn) => {
      addAriaLabel(btn, btn.textContent, btn.dataset.tooltip);
    });
    
    // Validate color contrast for custom elements
    html.find('[data-color]').each((i, el) => {
      const bgColor = el.dataset.color;
      const textColor = getComputedStyle(el).color;
      const contrast = checkColorContrast(textColor, bgColor);
      
      if (!contrast.passes) {
        console.warn('Low contrast detected:', contrast);
      }
    });
  }
}
```

### **Theme Integration**
```typescript
// Theme with accessibility validation
import { validateThemeAccessibility } from '../accessibility';

export function applyTheme(theme) {
  // Validate accessibility before applying
  const validation = validateThemeAccessibility(theme);
  
  if (!validation.passes) {
    console.warn('Theme accessibility issues:', validation.issues);
    
    // Optionally auto-fix or provide suggestions
    if (game.settings.get('avant', 'accessibility.autoContrast')) {
      theme = validation.fixedTheme;
    }
  }
  
  // Apply theme...
}
```

## 📋 Development Guidelines

### **Code Style**
- **TypeScript**: Strict typing for all accessibility functions
- **Pure Functions**: Prefer pure functions for testability
- **Error Handling**: Graceful degradation when accessibility features fail
- **Documentation**: Comprehensive JSDoc with WCAG references

### **Testing Requirements**
- **Unit Tests**: Test all accessibility functions in isolation
- **Integration Tests**: Test with real FoundryVTT elements
- **Accessibility Tests**: Use automated accessibility testing tools
- **Manual Testing**: Regular testing with assistive technologies

### **Performance Considerations**
- **Lazy Loading**: Load accessibility features only when needed
- **Caching**: Cache accessibility calculations for performance
- **Debouncing**: Debounce expensive accessibility checks
- **Progressive Enhancement**: Add accessibility without impacting core performance

---

*This module represents a significant improvement in accessibility for the Avant VTT system, providing comprehensive WCAG-compliant features while maintaining design flexibility and performance.* 