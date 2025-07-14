# CSS Accessibility Patterns Documentation

**Phase 2.5: Documentation & Integration**  
**Date**: 2025-01-17  
**Purpose**: Document CSS accessibility patterns for consistent implementation

## 🎯 Overview

This document catalogs the CSS accessibility patterns used throughout the Avant VTT system and provides guidelines for implementing new accessible components.

## 📋 Existing Patterns

### **1. High Contrast Mode Support**

#### **Location**: `styles/components/_chips.scss` (lines 460-497)

```scss
@media (prefers-contrast: high) {
  .trait-chip {
    border-width: 2px;
    border-style: solid;
    border-color: currentColor;
  }
}
```

**Usage**: Automatically enhances contrast for users who prefer high contrast interfaces.

**Integration**: Works with the accessibility module's `detectHighContrastMode()` function for JavaScript-based enhancements.

### **2. Reduced Motion Support**

#### **Location**: `styles/components/_chips.scss`

```scss
@media (prefers-reduced-motion: reduce) {
  .trait-chip,
  .trait-chip-input__field {
    transition: none;
  }
}
```

**Usage**: Respects user's motion preferences by disabling animations and transitions.

**Integration**: Complements the accessibility module's `prefersReducedMotion()` function for dynamic behavior changes.

### **3. Focus Indicators (WCAG 2.1 Compliant)**

#### **Location**: `styles/components/_chips.scss`

```scss
.trait-chip:focus-visible {
  outline: 2px solid var(--color-focus, var(--color-primary));
  outline-offset: 2px;
}
```

**Features**:
- Uses `:focus-visible` for keyboard-only focus indication
- Respects CSS custom properties for theme integration
- Provides adequate contrast with 2px outline
- Uses `outline-offset` for better visual separation

**Integration**: Works with the accessibility module's focus management utilities.

### **4. Screen Reader Only Content**

#### **Utility Class**: `.visually-hidden`

```scss
.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}
```

**Usage**: Hide content visually while keeping it available to screen readers.

**Example**:
```html
<label for="trait-input" class="visually-hidden">Search for traits</label>
<input id="trait-input" placeholder="Type to search..." />
```

### **5. Color Accessibility Variables**

#### **CSS Custom Properties for Accessibility**

```scss
:root {
  --color-focus: #00E0DC;              /* Focus indicator color */
  --color-primary: #00E0DC;            /* Primary theme color */
  --trait-color: #6C757D;              /* Default trait color */
  --trait-text-color: #000000;         /* Default trait text color */
}
```

**Features**:
- Centralizes color definitions for easy theme updates
- Provides fallbacks for accessibility compliance
- Integrates with the accessibility module's color functions

## 🔧 Integration with Accessibility Module

### **JavaScript-CSS Coordination**

The CSS patterns work in conjunction with the accessibility module:

#### **1. Color Contrast Validation**
```typescript
// CSS sets colors, JavaScript validates them
const result = checkColorContrast(
  getComputedStyle(element).color,
  getComputedStyle(element).backgroundColor,
  { level: 'AA' }
);
```

#### **2. Dynamic Accessibility Enhancements**
```typescript
// JavaScript detects preferences, CSS applies them
if (prefersReducedMotion()) {
  document.body.classList.add('reduce-motion');
}

if (detectHighContrastMode()) {
  document.body.classList.add('high-contrast');
}
```

#### **3. Focus Management Integration**
```typescript
// JavaScript manages focus, CSS provides visual feedback
ensureFocusable(element, { role: 'button' });
// CSS .trait-chip:focus-visible provides the visual indication
```

## 📐 Design Guidelines

### **Creating New Accessible Components**

#### **1. Always Include Focus Indicators**
```scss
.new-interactive-element {
  /* Base styles */
  
  &:focus-visible {
    outline: 2px solid var(--color-focus, #00E0DC);
    outline-offset: 2px;
  }
}
```

#### **2. Respect User Preferences**
```scss
.animated-component {
  transition: transform 0.3s ease;
  
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}
```

#### **3. Provide High Contrast Support**
```scss
.styled-component {
  border: 1px solid transparent;
  
  @media (prefers-contrast: high) {
    border-color: currentColor;
    border-width: 2px;
  }
}
```

#### **4. Use Semantic Color Variables**
```scss
.status-indicator {
  /* ✅ GOOD: Semantic variables */
  background-color: var(--color-success, #10B981);
  
  /* ❌ BAD: Hardcoded colors */
  /* background-color: #10B981; */
}
```

### **ARIA Attribute Styling**

#### **Style Based on ARIA States**
```scss
/* Style elements based on their accessibility state */
.trait-chip[aria-selected="true"] {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}

.trait-chip[aria-disabled="true"] {
  opacity: 0.6;
  cursor: not-allowed;
}

.dropdown[aria-expanded="true"] .dropdown-icon {
  transform: rotate(180deg);
}
```

## 🧪 Testing Guidelines

### **Accessibility Testing Checklist**

#### **1. Keyboard Navigation**
- [ ] All interactive elements reachable via Tab
- [ ] Focus indicators visible and consistent
- [ ] Tab order follows logical visual order
- [ ] Escape key closes modals/dropdowns

#### **2. Screen Reader Testing**
- [ ] All interactive elements have appropriate labels
- [ ] Dynamic content changes are announced
- [ ] Lists and menus have proper structure
- [ ] Form controls are properly labeled

#### **3. Color and Contrast**
- [ ] Text meets WCAG AA contrast requirements (4.5:1)
- [ ] Large text meets WCAG AA requirements (3:1)
- [ ] Focus indicators have adequate contrast
- [ ] Information isn't conveyed by color alone

#### **4. Motion and Animation**
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No flashing content that could trigger seizures
- [ ] Hover effects have keyboard equivalents

### **Automated Testing Integration**

#### **CSS Testing with Jest**
```javascript
// Test CSS custom properties
test('focus indicator color is defined', () => {
  const styles = getComputedStyle(document.documentElement);
  const focusColor = styles.getPropertyValue('--color-focus');
  expect(focusColor).toBeTruthy();
});

// Test accessibility classes
test('visually-hidden class hides content properly', () => {
  const element = document.createElement('div');
  element.className = 'visually-hidden';
  document.body.appendChild(element);
  
  const styles = getComputedStyle(element);
  expect(styles.position).toBe('absolute');
  expect(styles.width).toBe('1px');
  expect(styles.height).toBe('1px');
});
```

## 🚀 Future Enhancements

### **Planned CSS Accessibility Features**

#### **1. Enhanced Color Themes**
```scss
/* Future: Automatic dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #1a1a1a;
    --color-text: #ffffff;
    --color-focus: #4CE2E1;
  }
}
```

#### **2. Advanced Focus Management**
```scss
/* Future: Focus-within for complex components */
.trait-chip-input:focus-within {
  box-shadow: 0 0 0 2px var(--color-focus);
}
```

#### **3. Print Accessibility**
```scss
/* Future: Print-friendly accessibility */
@media print {
  .trait-chip {
    background: white !important;
    color: black !important;
    border: 1px solid black !important;
  }
  
  .visually-hidden {
    position: static !important;
    width: auto !important;
    height: auto !important;
  }
}
```

## 📚 Resources

### **WCAG 2.1 Guidelines**
- [WCAG 2.1 AA Success Criteria](https://www.w3.org/WAI/WCAG21/quickref/?levels=aaa)
- [CSS and Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility/CSS)
- [Focus Management](https://www.w3.org/WAI/fundamentals/accessibility-principles/#keyboard)

### **CSS Features for Accessibility**
- [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [`prefers-contrast`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast)
- [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)

### **Integration Points**
- **Accessibility Module**: `scripts/accessibility/index.ts`
- **Template Helpers**: `scripts/accessibility/template-helpers.ts`
- **Focus Management**: `scripts/accessibility/focus-management.ts`
- **Color Contrast**: `scripts/accessibility/color-contrast.ts`

---

**Note**: This documentation should be updated when new CSS accessibility patterns are added to the system. All patterns should integrate seamlessly with the centralized accessibility module for maximum effectiveness. 