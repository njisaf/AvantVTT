# ADR-0009: Base Item Sheet Architecture

**Date**: 2025-01-17  
**Status**: Accepted  
**Phase**: 1 - Item Sheet Unification  

## Context

The Avant VTT system currently has 8 different item sheet implementations with significant duplication and inconsistencies:

- 8 separate item sheet templates with different structures
- Inconsistent widget implementations (AP selectors, trait chips, etc.)
- Mixed CSS class patterns (some use `{{cssClass}}`, others hardcoded)
- No unified form validation or error handling
- Difficult to maintain and extend individual sheet types

This architectural decision addresses the need for a unified, maintainable foundation for all item sheets while preserving the unique characteristics of each item type.

## Decision

We will implement a **BaseItemSheet** architectural pattern using FoundryVTT v13's ApplicationV2 framework with the following key decisions:

### 1. Factory Function Pattern

**Decision**: Use a factory function `createBaseItemSheet()` rather than direct class extension.

**Rationale**:
- FoundryVTT v13 ApplicationV2 classes are only available after full initialization
- Prevents class definition errors during system startup
- Follows established pattern in existing codebase
- Enables proper TypeScript typing with dynamic class loading

```typescript
export function createBaseItemSheet() {
    const { HandlebarsApplicationMixin, DocumentSheetV2 } = getFoundryV13Classes();
    
    class BaseItemSheet extends HandlebarsApplicationMixin(DocumentSheetV2) {
        // Implementation
    }
    
    return BaseItemSheet;
}
```

### 2. Widget Configuration System

**Decision**: Implement widget detection through configuration objects rather than hardcoded templates.

**Rationale**:
- Enables conditional rendering based on item type and system data
- Provides clear extension points for Phase 2 component library
- Centralizes widget logic for easier maintenance
- Supports complex widgets (AP selectors, trait chips, etc.)

```typescript
getWidgetConfigurations(): Record<string, any> {
    const system = this.document?.system || {};
    return {
        apSelector: system.apCost !== undefined,
        ppCostInput: system.ppCost !== undefined,
        traitChips: system.traits !== undefined,
        imageUpload: this.document?.type !== "talent" && this.document?.type !== "augment",
        usesCounter: system.uses !== undefined
    };
}
```

### 3. Template Strategy: Base + Partials

**Decision**: Use a single base template with conditional partial inclusion rather than inheritance.

**Rationale**:
- Reduces template complexity and maintenance burden
- Enables shared widget patterns across item types
- Provides clear structure for Phase 2 component library integration
- Supports both tabbed and non-tabbed layouts

```html
{{#if (gt tabs.length 1)}}
    <!-- Multi-tab content with partials -->
{{else}}
    <!-- Single content section -->
{{/if}}
```

### 4. CSS Architecture: BEM + CSS Grid

**Decision**: Use BEM methodology with CSS Grid-first layout and CSS custom properties.

**Rationale**:
- BEM provides consistent, maintainable class naming
- CSS Grid offers superior responsive layout capabilities
- CSS custom properties enable theme system integration
- Future-proofs for component library styling

```scss
.item-sheet {
    display: grid;
    grid-template-areas: "header" "tabs" "body";
    // Theme integration
    background: var(--color-background-primary, #ffffff);
}
```

### 5. Accessibility-First Design

**Decision**: Implement WCAG 2.1 AA compliance from the foundation level.

**Rationale**:
- Easier to build accessibility in than retrofit
- Required for professional game system
- ARIA patterns consistent across all item types
- Keyboard navigation support built-in

```html
<div class="item-sheet__ap-selector" 
     role="radiogroup" 
     aria-label="Action Point cost: {{system.apCost}}">
```

### 6. Testing Strategy: Pure Function Focus

**Decision**: Make architectural methods public and testable without full FoundryVTT mocking.

**Rationale**:
- Enables fast, reliable unit testing
- Follows functional-first development philosophy
- Reduces test complexity and maintenance
- Provides confidence in architectural foundations

## Alternatives Considered

### Alternative 1: Template Inheritance

**Rejected**: Handlebars template inheritance is complex and fragile. The base + partials approach provides better flexibility and maintenance.

### Alternative 2: Direct Class Extension

**Rejected**: FoundryVTT v13's dynamic class loading makes direct extension error-prone. Factory pattern provides better reliability.

### Alternative 3: Individual Sheet Refactoring

**Rejected**: Would perpetuate existing duplication and inconsistencies. Unified architecture provides better long-term maintainability.

### Alternative 4: Single Monolithic Template

**Rejected**: Would be difficult to maintain and extend. Conditional widget system provides better flexibility.

## Consequences

### Positive

- **Consistency**: All item sheets follow the same architectural patterns
- **Maintainability**: Single source of truth for common functionality
- **Extensibility**: Clear extension points for future features
- **Performance**: Efficient widget loading and CSS Grid layout
- **Accessibility**: Built-in WCAG compliance across all sheets
- **Testability**: Public methods enable comprehensive unit testing

### Negative

- **Learning Curve**: Developers must understand the widget configuration system
- **Initial Complexity**: More architectural setup compared to simple templates
- **Migration Required**: Existing sheets need conversion in future phases

### Neutral

- **Breaking Changes**: Minimal - factory pattern maintains API compatibility
- **Performance Impact**: CSS Grid may require modern browser support (FoundryVTT v13 requirement)

## Implementation Plan

### Phase 1 (Complete)
- ✅ BaseItemSheet factory function and class
- ✅ Base template with conditional widgets
- ✅ SCSS architectural skeleton
- ✅ Unit tests with ≥90% coverage
- ✅ Documentation and ADR

### Phase 2 (Future)
- Component library development
- Validation utilities implementation
- Storybook integration for visual QA
- Begin migration of existing sheets

### Phase 3 (Future)
- Complete migration of Talent and Augment sheets
- Integration testing with all item types
- Performance optimization and polish

## References

- **FoundryVTT v13 ApplicationV2 Documentation**: https://foundryvtt.com/api/v13/
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **BEM Methodology**: https://getbem.com/
- **CSS Grid Guide**: https://css-tricks.com/snippets/css/complete-guide-grid/
- **Field Matrix**: `_sprints/2025-01-17-item-sheet-unification-phase1.md`

## Approval

**Architect**: Avant VTT Team  
**Date**: 2025-01-17  
**Phase**: 1 - Architectural Skeleton Complete

---

*This ADR establishes the architectural foundation for item sheet unification. Future phases will build upon these decisions to create a comprehensive, maintainable item sheet system.* 