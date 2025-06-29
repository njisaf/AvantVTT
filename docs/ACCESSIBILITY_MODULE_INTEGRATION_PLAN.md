# Accessibility Module Integration Plan

**Date**: 2025-01-17  
**Type**: Migration Plan  
**Goal**: Complete integration of Accessibility Module and remove duplicate code

## 🎯 Overview

This document outlines the step-by-step plan to properly integrate the implemented Accessibility Module by:
1. Migrating all accessibility function usage to the centralized module
2. Removing duplicate functions from legacy locations
3. Updating all imports and dependencies
4. Ensuring zero breaking changes during transition

## 📋 Current State Assessment

### **Functions to Migrate:**
- ✅ `isLightColor` - **3 locations** (trait-renderer.ts, initialization-manager.ts, accessibility/color-contrast.ts)
- ✅ `calculateContrastRatio` - **implemented in accessibility module**
- ✅ `checkColorContrast` - **implemented in accessibility module**
- ✅ Handlebars helpers - **need to use accessibility module**

### **Import Locations to Update:**
- `tests/unit/logic/chat/trait-renderer.test.ts` - imports `isLightColor` from trait-renderer
- `tests/integration/sheets/trait-chip-color-persistence.int.test.js` - imports from trait-renderer
- `scripts/utils/initialization-manager.ts` - contains duplicate `isLightColor` function

### **Template Dependencies:**
- All item sheet templates use `{{traitChipStyle trait}}` and `{{traitChipData trait}}`
- These helpers need to be updated to use accessibility module functions

## 🔄 Migration Phases

### **Phase 1: Update Handlebars Helpers (Critical)**
**Priority**: HIGH - This affects all trait rendering

**Current State:**
```typescript
// In initialization-manager.ts - DUPLICATE LOGIC
Handlebars.registerHelper('traitChipStyle', function(trait: any) {
    // Inline color logic here - NEEDS MIGRATION
});
```

**Target State:**
```typescript
// In initialization-manager.ts - USING ACCESSIBILITY MODULE
import { isLightColor, generateAccessibleTextColor } from '../accessibility';

Handlebars.registerHelper('traitChipStyle', function(trait: any) {
    // Use centralized accessibility functions
});
```

**Files to Update:**
- `scripts/utils/initialization-manager.ts` (lines ~536-568)

### **Phase 2: Remove Duplicate Functions**
**Priority**: HIGH - Clean up technical debt

**Files to Clean:**
1. **`scripts/logic/chat/trait-renderer.ts`**
   - Remove `isLightColor` function (lines 66-93)
   - Keep export structure for backward compatibility during transition
   - Add deprecation notice and redirect to accessibility module

2. **`scripts/utils/initialization-manager.ts`**
   - Remove inline `isLightColor` function (line 573)
   - Import from accessibility module instead

### **Phase 3: Update Test Imports**
**Priority**: MEDIUM - Ensure tests continue to pass

**Files to Update:**
1. **`tests/unit/logic/chat/trait-renderer.test.ts`**
   ```typescript
   // OLD
   import { isLightColor } from '../../../scripts/logic/chat/trait-renderer.ts';
   
   // NEW
   import { isLightColor } from '../../../scripts/accessibility';
   ```

2. **`tests/integration/sheets/trait-chip-color-persistence.int.test.js`**
   ```javascript
   // OLD
   const { isLightColor } = await import('../../../avantVtt/scripts/logic/chat/trait-renderer.ts');
   
   // NEW
   const { isLightColor } = await import('../../../avantVtt/scripts/accessibility');
   ```

### **Phase 4: Enhanced Integration (Optional)**
**Priority**: LOW - Future improvements

**Optional Enhancements:**
1. **Add accessibility settings to system configuration**
2. **Integrate with theme system for automatic accessibility validation**
3. **Add accessibility checker tool for content creators**
4. **Create accessibility documentation for users**

## 🛠️ Implementation Steps

### **Step 1: Update Handlebars Helpers**

**File**: `scripts/utils/initialization-manager.ts`

**Changes**:
1. Add import from accessibility module
2. Replace inline `isLightColor` function with import
3. Update `traitChipStyle` helper to use accessibility functions
4. Update `traitChipData` helper to use accessibility functions
5. Remove duplicate function definition

**Before**:
```typescript
// Inline function definition (DUPLICATE)
function isLightColor(hexColor: string): boolean {
    // 20+ lines of duplicate code
}

Handlebars.registerHelper('traitChipStyle', function(trait: any) {
    // Uses inline isLightColor
});
```

**After**:
```typescript
// Import from centralized module
import { isLightColor, generateAccessibleTextColor } from '../accessibility';

Handlebars.registerHelper('traitChipStyle', function(trait: any) {
    // Uses imported functions
});
```

### **Step 2: Clean Up trait-renderer.ts**

**File**: `scripts/logic/chat/trait-renderer.ts`

**Changes**:
1. Remove `isLightColor` function completely
2. Add deprecation export that redirects to accessibility module
3. Update comments to reference accessibility module

**Before**:
```typescript
export function isLightColor(hexColor: string): boolean {
    // 27 lines of code
}
```

**After**:
```typescript
// DEPRECATED: Use accessibility module instead
export { isLightColor } from '../accessibility';
```

### **Step 3: Update All Test Files**

**Files**: 
- `tests/unit/logic/chat/trait-renderer.test.ts`
- `tests/integration/sheets/trait-chip-color-persistence.int.test.js`

**Changes**: Update import statements to use accessibility module

### **Step 4: Verification & Testing**

**Checklist**:
- [ ] All tests pass after migration
- [ ] No TypeScript compilation errors
- [ ] Trait rendering works correctly in FoundryVTT
- [ ] No console errors during trait operations
- [ ] Handlebars helpers produce identical output
- [ ] Accessibility functions work as expected

## 📊 Expected Benefits

### **Code Quality**
- **Single Source of Truth**: All accessibility logic in one module
- **Reduced Duplication**: Eliminate 3 duplicate `isLightColor` functions
- **Better Testing**: Centralized functions easier to test comprehensively
- **Enhanced Functionality**: Access to full WCAG-compliant accessibility features

### **Maintainability**
- **Clear Dependencies**: Import relationships clearly defined
- **Consistent Updates**: Changes only needed in one location
- **Documentation**: Comprehensive accessibility documentation in one place
- **Future Features**: Easy to add new accessibility features

### **Performance**
- **Smaller Bundle**: Remove duplicate code
- **Optimized Functions**: Accessibility module uses more efficient algorithms
- **Lazy Loading**: Accessibility features load only when needed

## 🚨 Risk Mitigation

### **Potential Issues**
1. **Breaking Changes**: Ensure backward compatibility during transition
2. **Test Failures**: Update test imports before removing old functions
3. **Template Errors**: Verify Handlebars helpers work correctly
4. **Timing Issues**: Ensure accessibility module loads before helpers register

### **Mitigation Strategies**
1. **Gradual Migration**: Update imports before removing functions
2. **Comprehensive Testing**: Test each phase thoroughly
3. **Rollback Plan**: Keep git history for easy rollback if needed
4. **Documentation**: Update all relevant documentation

## 📈 Success Metrics

### **Technical Metrics**
- [ ] Zero duplicate `isLightColor` functions
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Clean import graph (no circular dependencies)

### **Functional Metrics**
- [ ] Trait chips render correctly with proper colors
- [ ] Accessibility features work as expected
- [ ] No performance regressions
- [ ] All Handlebars helpers function correctly

### **Code Quality Metrics**
- [ ] Improved test coverage for accessibility functions
- [ ] Reduced technical debt (duplicate code removed)
- [ ] Clear documentation and examples
- [ ] Consistent coding patterns throughout

## 🔄 Post-Migration Cleanup

### **Documentation Updates**
1. Update system README with accessibility module information
2. Add accessibility guidelines for content creators
3. Update development documentation with new import patterns
4. Create migration guide for external developers

### **Future Enhancements**
1. Add accessibility settings panel
2. Integrate with theme validation
3. Create accessibility testing tools
4. Add automated accessibility checking

## 📝 Implementation Timeline

### **Phase 1: Critical Path (Day 1)**
- Update Handlebars helpers to use accessibility module
- Test trait rendering thoroughly

### **Phase 2: Cleanup (Day 1-2)**
- Remove duplicate functions
- Update test imports
- Verify all functionality

### **Phase 3: Documentation (Day 2)**
- Update relevant documentation
- Create usage examples
- Add migration notes

### **Phase 4: Verification (Day 2-3)**
- Comprehensive testing
- Performance verification
- Final cleanup and optimization

---

**Next Action**: Begin with Phase 1 - Update Handlebars helpers to use the accessibility module. 