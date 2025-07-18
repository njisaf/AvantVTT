# Trait Input System - Deprecated

**Status**: Phase 1 Quarantine Complete  
**Date Deprecated**: January 17, 2025  
**Reason**: Replacing fragile text-based autocomplete with native FoundryVTT drag-and-drop workflow  
**Successor**: Drag-and-drop from `Compendium["avant.traits"]` (Phase 2)

---

## 📋 Overview

This directory contains the **complete trait input system** that has been quarantined as part of the trait input deprecation & drag-and-drop migration roadmap. The system provided text-based autocomplete functionality for adding traits to items, but proved fragile and inconsistent with FoundryVTT conventions.

### **What was deprecated:**
- ❌ Text-based trait autocomplete input field
- ❌ Complex dropdown suggestion system
- ❌ 4 custom event listeners (input, keydown, focus, blur)
- ❌ 15 trait-specific methods in `item-sheet.ts`
- ❌ Complex state management (`traitInputState`)
- ❌ Custom DOM manipulation and event delegation

### **What remains active:**
- ✅ Trait data model and persistence
- ✅ Trait chip display and colors
- ✅ TraitProvider service
- ✅ Compendium integration
- ✅ All downstream trait logic

---

## 📁 Quarantined Files

### **Core Logic** (`logic/`)
- `item-sheet-trait-input.ts` - 15 trait input methods extracted from `item-sheet.ts`
- `trait-utils.ts` - Utility functions (`generateTraitSuggestions`, `addTraitToList`, etc.)
- `logic/chat/trait-renderer.ts` - Autocomplete suggestion rendering

### **Templates** (`templates/`)
- `traits-field.hbs` - Core trait input template with autocomplete container

### **Styles** (`styles/`)
- `trait-input.scss` - 300+ lines of trait input CSS including dropdown styling

### **Tests** (`tests/`)
- *(No test files moved yet - tests excluded via Jest configuration)*

---

## 🔄 Restoration Instructions

**⚠️ Important**: Only restore if Phase 2 drag-and-drop implementation fails or is rejected by stakeholders.

### **Step 1: Restore Core Logic**

1. **Copy trait input methods back to `item-sheet.ts`:**
   ```bash
   # Copy methods from deprecated/trait-input-system/logic/item-sheet-trait-input.ts
   # to scripts/sheets/item-sheet.ts starting at line ~1590
   ```

2. **Restore trait utility functions:**
   ```bash
   # Copy generateTraitSuggestions function from:
   # deprecated/trait-input-system/logic/trait-utils.ts
   # to scripts/logic/trait-utils.ts (replace stub)
   ```

3. **Restore trait renderer:**
   ```bash
   # Copy renderTraitSuggestion function from:
   # deprecated/trait-input-system/logic/chat/trait-renderer.ts  
   # to scripts/logic/chat/trait-renderer.ts (replace stub)
   ```

### **Step 2: Restore Template**

1. **Copy trait input HTML back to `traits-field.hbs`:**
   ```bash
   # Copy trait input container from:
   # deprecated/trait-input-system/templates/traits-field.hbs
   # to templates/shared/partials/traits-field.hbs
   ```

### **Step 3: Restore Styling**

1. **Copy trait input CSS back to SCSS files:**
   ```bash
   # Copy trait input styles from:
   # deprecated/trait-input-system/styles/trait-input.scss
   # to styles/components/_chips.scss
   ```

2. **Build SCSS:**
   ```bash
   npm run build:scss
   ```

### **Step 4: Restore Event Listeners**

1. **Re-add trait input event listeners in `item-sheet.ts`:**
   ```typescript
   // In _activateTraitListeners() method
   html.find('.trait-autocomplete').on('input', this._onTraitInput.bind(this));
   html.find('.trait-autocomplete').on('keydown', this._onTraitInputKeydown.bind(this));
   html.find('.trait-autocomplete').on('focus', this._onTraitInputFocus.bind(this));
   html.find('.trait-autocomplete').on('blur', this._onTraitInputBlur.bind(this));
   ```

2. **Restore traitInputState property:**
   ```typescript
   private traitInputState: TraitInputState = {
     availableTraits: [],
     currentInput: '',
     selectedIndex: -1,
     isDropdownOpen: false
   };
   ```

3. **Re-add trait input action handlers in DEFAULT_OPTIONS.actions:**
   ```typescript
   traitFieldClick: function (this: AvantItemSheet, event: Event, target: HTMLElement) {
     // Restore original implementation
   },
   traitSuggestionClick: function (this: AvantItemSheet, event: Event, target: HTMLElement) {
     // Restore original implementation
   }
   ```

### **Step 5: Restore Tests**

1. **Move test files back to main test directories**
2. **Update Jest configuration to include trait input tests**
3. **Run tests to verify restoration**

### **Step 6: Verification**

1. **Build system:** `npm run build` (should pass)
2. **Test suite:** `npm test` (trait input tests should pass)
3. **Manual testing:** Verify trait autocomplete works in item sheets

---

## 🧪 Testing Notes

**Expected test failures during quarantine:**
- `renderTraitSuggestion` tests (function stubbed to return empty string)
- `generateTraitSuggestions` tests (function stubbed to return empty array)  
- Integration tests that depend on trait input functionality

**These failures are intentional** and part of the quarantine phase. Functionality remains isolated but available for restoration.

---

## 📊 Architecture Context

### **Original System Complexity**
- **15 trait-specific methods** in `item-sheet.ts`
- **4 event listeners** with complex DOM manipulation
- **Complex state management** (`traitInputState` object)
- **Custom dropdown rendering** with keyboard navigation
- **Fragile event delegation** and selector matching

### **Replacement System (Phase 2)**
- **2 standard methods** (`_onDrop`, `_onDropItem`)
- **Native FoundryVTT drag-drop events** (no custom listeners)
- **Stateless validation** (no complex state management)
- **Standard compendium workflow** (familiar to users)
- **Robust UUID resolution** (built-in FoundryVTT handling)

---

## 🚀 Migration Benefits

### **UX Improvements**
- **Visual Discovery**: Users can browse traits in compendium
- **Standard Pattern**: Familiar FoundryVTT workflow
- **Mobile Friendly**: Touch-based drag-and-drop
- **Reduced Errors**: Selection from valid options only

### **Technical Benefits**
- **Simplified Codebase**: 15 methods → 2 methods
- **Better Performance**: No complex DOM manipulation
- **Easier Maintenance**: Standard FoundryVTT patterns
- **Improved Reliability**: Less fragile event handling

---

## 📚 Dependencies

### **Services that remain active:**
- `TraitProvider` - Trait data and validation
- `InitializationManager` - Service coordination
- `CompendiumLocalService` - Compendium management

### **Systems that remain active:**
- Trait data model and persistence
- Trait chip display and theming
- Trait validation and filtering
- Compendium integration

---

## 🔗 Related Documentation

- **Main Roadmap**: `docs/TRAIT_INPUT_DEPRECATION_ROADMAP.md`
- **Deprecation Policy**: `docs/DEPRECATION_POLICY.md`
- **Phase 0 Audit**: Complete code audit and dependency analysis
- **Phase 2 Implementation**: Drag-and-drop system (upcoming)

---

## 📝 Changelog

### **Phase 1 Quarantine (January 17, 2025)**
- ✅ Moved 5 core implementation files to deprecated folder
- ✅ Created compatibility stubs with deprecation warnings
- ✅ Updated Jest configuration to exclude deprecated tests
- ✅ Verified build passes with stub implementations
- ✅ Documented complete restoration pathway

### **Next Steps**
- **Phase 2**: Implement drag-and-drop MVP with feature flag
- **Phase 3**: Remove input UI and promote drag-and-drop as default
- **Phase 4**: Delete stubs and add CI guards
- **Phase 5**: Monitor adoption and collect feedback

---

**Last Updated**: January 17, 2025  
**Restoration Time**: Estimated 30-45 minutes following this guide  
**Support**: All original functionality preserved and documented 