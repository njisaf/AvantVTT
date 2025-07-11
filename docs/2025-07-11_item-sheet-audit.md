# Item Sheet Audit Report

**Date:** 2025-07-11  
**Phase:** Phase 0 - Audit & Scoping  
**Target:** `scripts/sheets/item-sheet.ts`  
**Status:** Complete  

---

## Executive Summary

The current `item-sheet.ts` file has grown to become a significant monolith requiring refactoring. This audit provides comprehensive analysis of the current state and identifies clear refactoring opportunities aligned with the roadmap.

## Quantitative Analysis

### File Metrics
- **Total Lines:** 2,531 lines
- **Functions/Methods:** 71 functions and arrow functions
- **File Size:** 26,964 tokens (exceeds 25k token limit)
- **Complexity:** High - multiple responsibilities mixed throughout

### TODO/FIXME Analysis
- **Count:** 0 explicit TODO/FIXME markers
- **Observation:** Code is well-maintained but lacks explicit markers for known issues

## Structural Analysis

### Major Responsibility Blocks Identified

#### 1. **ApplicationV2 Configuration & Setup** (Lines 1-400)
- **Lines:** ~400 lines
- **Responsibilities:** Factory pattern, class definition, static configuration
- **Complexity:** Medium - well-documented but verbose
- **Refactor Candidate:** Configuration extraction

#### 2. **Form Data Handling** (Lines 1540-1870)
- **Lines:** ~330 lines  
- **Responsibilities:** `_prepareSubmitData`, form validation, data extraction
- **Complexity:** Very High - nested form handling, multiple data structures
- **Refactor Candidate:** **HIGH PRIORITY** - Extract to `logic/item-form.ts`

#### 3. **Drag-Drop System** (Lines 1256-1500)
- **Lines:** ~244 lines
- **Responsibilities:** Event listeners, drop validation, trait application
- **Complexity:** High - event management, DOM manipulation
- **Refactor Candidate:** **HIGH PRIORITY** - Extract to `logic/drag-drop/item-trait.ts`

#### 4. **Trait Management** (Lines 1885-2531)
- **Lines:** ~646 lines
- **Responsibilities:** Trait removal, display preparation, color fallbacks
- **Complexity:** High - trait provider integration, visual state management
- **Refactor Candidate:** **MEDIUM PRIORITY** - Extend existing `logic/trait-utils.ts`

#### 5. **UI State Management** (Lines 1149-1256)
- **Lines:** ~107 lines
- **Responsibilities:** Tab handling, visual state, AP selector integration
- **Complexity:** Medium - DOM manipulation, state coordination
- **Refactor Candidate:** **MEDIUM PRIORITY** - Extract to `ui/item-sheet-tabs.ts`

#### 6. **Template & Rendering** (Lines 462-1149)
- **Lines:** ~687 lines
- **Responsibilities:** Context preparation, template data, HTML rendering
- **Complexity:** High - data transformation, template integration
- **Refactor Candidate:** **MEDIUM PRIORITY** - Extract to `logic/item-template.ts`

## External Dependencies Analysis

### Direct Imports (12 total)
1. `ValidationUtils` - `../utils/validation.js`
2. `executeRoll, processFormData` - `../logic/item-sheet.js`
3. `prepareTemplateData, extractItemFormData, prepareItemHeaderMetaFields, prepareItemBodyFields` - `../logic/item-sheet-utils.js`
4. `logger` - `../utils/logger.js`
5. `initializeApSelector` - `./ap-selector-handler`
6. `addTraitToList, removeTraitFromList, generateTraitSuggestions, validateTraitList` - `../logic/trait-utils.ts`
7. `renderTraitSuggestion` - `../logic/chat/trait-renderer.ts`
8. `createTraitHtmlForChat, itemHasTraits` - `../logic/chat/trait-resolver.ts`
9. `FoundryUI` - `../types/adapters/foundry-ui.ts`

### Runtime Dependencies (FoundryVTT)
- `foundry.applications.api` - ApplicationV2 classes
- `globalThis.fromUuid` - UUID resolution
- `game.avant.initializationManager` - Service access
- Direct DOM manipulation (multiple instances)

### Side Effects Identified
1. **Global State Mutations** - Direct document updates through FoundryVTT
2. **DOM Manipulation** - Direct element styling and class management
3. **Service Calls** - Trait provider, initialization manager access
4. **Event Binding** - Multiple event listeners attached to DOM elements
5. **Console Logging** - Extensive debug/error logging
6. **Dynamic Imports** - Runtime module loading for trait operations

## Refactoring Opportunities by Priority

### **HIGH PRIORITY** (Must Address)

#### 1. Form Data Handling Module
- **Target:** `logic/item-form.ts`
- **Size:** ~330 lines → ~150 lines (pure functions)
- **Benefits:** Eliminate ApplicationV2 form handling complexity
- **Risk:** Low - well-isolated functionality

#### 2. Drag-Drop System Module
- **Target:** `logic/drag-drop/item-trait.ts`
- **Size:** ~244 lines → ~100 lines (pure functions) + ~50 lines (thin service)
- **Benefits:** Reusable across different sheet types
- **Risk:** Medium - tight DOM coupling

### **MEDIUM PRIORITY** (Should Address)

#### 3. Trait Display & Management
- **Target:** Extend `logic/trait-utils.ts` + new `logic/trait-display.ts`
- **Size:** ~646 lines → ~200 lines (distributed)
- **Benefits:** Centralized trait logic, better testability
- **Risk:** Low - well-defined interfaces

#### 4. UI State Management
- **Target:** `ui/item-sheet-tabs.ts`
- **Size:** ~107 lines → ~80 lines (thin wrapper)
- **Benefits:** Reusable tab system
- **Risk:** Low - standard UI patterns

### **LOWER PRIORITY** (Nice to Have)

#### 5. Template & Rendering
- **Target:** `logic/item-template.ts`
- **Size:** ~687 lines → ~300 lines (pure functions)
- **Benefits:** Better template data testability
- **Risk:** Medium - complex data transformations

#### 6. ApplicationV2 Configuration
- **Target:** `config/item-sheet-config.ts`
- **Size:** ~400 lines → ~100 lines (thin wrapper)
- **Benefits:** Configuration reusability
- **Risk:** Low - static configuration

## Implementation Risk Assessment

### **LOW RISK** Areas
- Form data extraction (pure functions)
- Trait utility functions (existing patterns)
- UI state management (standard patterns)
- Static configuration (no business logic)

### **MEDIUM RISK** Areas
- Drag-drop system (DOM event handling)
- Template rendering (complex data transformations)
- ApplicationV2 integration (framework-specific)

### **HIGH RISK** Areas
- None identified - incremental approach mitigates risks

## Recommended Module Structure

```
scripts/
├── logic/
│   ├── item-form.ts              # Form data extraction & validation
│   ├── trait-display.ts          # Trait visual presentation logic
│   ├── item-template.ts          # Template data preparation
│   └── drag-drop/
│       └── item-trait.ts         # Drag-drop trait handling
├── ui/
│   ├── item-sheet-tabs.ts        # Tab management
│   └── image-upload.ts           # Image handling (reusable)
├── config/
│   └── item-sheet-config.ts      # ApplicationV2 configuration
└── sheets/
    └── item-sheet.ts             # Thin wrapper (≤300 lines)
```

## Test Coverage Requirements

### **Unit Tests** (New modules)
- **Target Coverage:** ≥90% for pure functions
- **Focus Areas:** Form validation, trait display logic, data transformations
- **Existing Coverage:** Baseline to maintain

### **Integration Tests** (Workflows)
- **Target Coverage:** ≥70% for UI workflows
- **Focus Areas:** Drag-drop, tab switching, form submission
- **Existing Coverage:** Extensive integration test suite exists

## Performance Considerations

### **Current Performance Concerns**
- Large file size impacts initial load
- Mixed responsibilities prevent optimizations
- No clear performance bottlenecks identified

### **Expected Performance Impact**
- **Positive:** Smaller modules, better caching
- **Negative:** Potentially more imports (minimal impact)
- **Neutral:** Same runtime performance expected

## Conclusion

The item sheet is a prime candidate for refactoring with clear module boundaries and well-defined responsibilities. The incremental approach outlined in the roadmap is appropriate and low-risk.

**Recommended Action:** Proceed with Phase 1 (Interface Design) focusing on the HIGH PRIORITY modules first.

---

**Next Steps:**
1. Review and approve this audit report
2. Begin Phase 1 - Interface Design for `logic/item-form.ts` and `logic/drag-drop/item-trait.ts`
3. Schedule audit review meeting for 2025-07-15