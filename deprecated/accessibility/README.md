# Accessibility Module - DEPRECATED

**Deprecation Date**: 2025-07-13  
**Status**: Phase 1 - Quarantined  
**Policy Reference**: [Deprecation Policy for AvantVTT](../../DEPRECATION_POLICY.md)

---

## ⚠️ DEPRECATION NOTICE

This accessibility module has been **DEPRECATED** and moved to the archive as part of a strategic focus on core gameplay features.

**Current Status**: This module is in **Phase 1 - Quarantine** of the deprecation roadmap.

---

## 🎯 Why Was This Deprecated?

The accessibility helper library was aspirational and not required for the immediate gameplay-critical milestones:
- Item sheets functionality
- Drag-drop trait system  
- Core trait management

**Impact Assessment**:
- **Maintenance Cost**: Slowing TypeScript migration and build times
- **Test Surface**: Creating test coverage we don't have capacity to maintain
- **Integration Coupling**: Low risk - only 2 hard dependencies found
- **Priority**: Not essential for current sprint objectives

---

## 📋 Integration Audit Summary

| Area               | Coupling           | Details                                                          |
| ------------------ | ------------------ | ---------------------------------------------------------------- |
| **Production Imports** | 1 hard, 1 soft    | `trait-renderer.ts` re-exports `isLightColor`; `bulk-trait-dialog.ts` dynamic-imports `ensureFocusable` |
| **Tests**              | 1 test suite       | `tests/unit/accessibility/color-contrast.test.ts` (now archived) |
| **Templates/SCSS**     | None              | No template or style dependencies found                          |

**Risk Level**: **LOW** - Safe for deprecation with stubs

---

## 🗂️ Archived Contents

This directory contains the complete accessibility module as it existed before deprecation:

### Core Module Files
- `index.ts` - Main barrel exports and AccessibilityManager class
- `color-contrast.ts` - WCAG-compliant color contrast utilities
- `focus-management.ts` - Focus trap and management utilities
- `keyboard-navigation.ts` - Keyboard navigation helpers
- `screen-reader.ts` - Screen reader support utilities
- `high-contrast.ts` - High contrast mode detection
- `reduced-motion.ts` - Reduced motion preference handling
- `template-helpers.ts` - Handlebars template accessibility helpers

### Type Definitions
- `types/accessibility.ts` - Core accessibility type definitions
- `types/wcag.ts` - WCAG standards and compliance types

### Documentation
- `css-patterns.md` - CSS accessibility patterns guide

### Tests
- `tests/color-contrast.test.ts` - Color contrast utility tests

---

## 🔄 Current Stub Implementation

A minimal stub has been created at `scripts/accessibility/index.ts` that provides:

### Exported Functions
```typescript
// Conservative stub - always returns false (assumes dark colors)
export function isLightColor(hexColor: string): boolean

// Basic focus management without accessibility enhancements  
export function ensureFocusable(element: HTMLElement, options?: { role?: string; label?: string }): void
```

### Deprecated Warnings
All stub functions log deprecation warnings when called to help identify remaining usage.

---

## 📋 Dependencies Resolved

### Hard Dependencies (1)
- **`trait-renderer.ts`**: Re-exported `isLightColor` 
  - **Resolution**: Will be replaced with local implementation in Phase 2

### Soft Dependencies (1)  
- **`bulk-trait-dialog.ts`**: Dynamic import of `ensureFocusable`
  - **Resolution**: Will use direct `element.focus()` in Phase 2

---

## 🛣️ Deprecation Roadmap

### ✅ Phase 1 - Quarantine (COMPLETED)
- [x] Archive source code to `deprecated/accessibility/`
- [x] Create stub barrel with minimal exports
- [x] Move tests to archive and exclude from Jest
- [x] Create this documentation

### ✅ Phase 2 - Clean Runtime (COMPLETED)
- [x] Remove hard import in `trait-renderer.ts` 
- [x] Remove soft import in `bulk-trait-dialog.ts`
- [x] Verify zero runtime references

### ✅ Phase 3 - Repository Hygiene (COMPLETED)
- [x] Delete stub barrel once no imports remain
- [x] ESLint cleanup for dead imports
- [x] Add pre-commit guard against new references

### ✅ Phase 4 - Long-Term Safeguards (COMPLETED)
- [x] CI check to prevent accidental resurrection
- [x] Add to dead-code scanner allowlist
- [x] Weekly monitoring automation

---

## 🔄 Restoration Procedure

If accessibility becomes a priority in future sprints, follow the **Restoration Procedure** in the main [Deprecation Policy](../../DEPRECATION_POLICY.md).

### Restoration Steps
1. Use commit keyword **`restore-accessibility-module`** to bypass guards
2. Move files from `deprecated/accessibility/` back to `scripts/accessibility/`
3. Update Jest configuration to include tests
4. Verify all imports and run full test suite
5. Update documentation to remove deprecation notices

---

## 📞 Contact & Support

If you have questions about this deprecation or need to restore accessibility features:

1. **Check the roadmap** in [DEPRECATION_POLICY.md](../../DEPRECATION_POLICY.md)
2. **Review restoration procedures** above
3. **Contact the development team** for guidance on restoration priority

---

**Archive Date**: 2025-07-13  
**Archive Reason**: Strategic focus on core gameplay features  
**Restoration Path**: Available via documented restoration procedure  
**Risk Assessment**: Low impact, minimal coupling, safe for deprecation