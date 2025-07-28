# Item Sheet Header Layout Fix

**Date**: January 17, 2025  
**Type**: Critical Bug Fix  
**Impact**: Item Sheet Layout Functionality  

## 🚨 Issue Summary

The item sheet headers were not displaying row containers in a proper vertical stack layout. Instead of having:
1. **Row 1**: Image upload + Name field (side-by-side)
2. **Row 2**: AP selector (in its own row)

All elements were being forced into a single horizontal row, making the layout cramped and unusable.

## 🔍 Root Cause Analysis

### **The Real Problem**
The issue wasn't with the `row-container` or `form-group` styling as initially suspected. The **fundamental problem was CSS specificity conflicts** at the `.sheet-header` level.

### **Conflicting CSS Rules Found**
1. **Main avant.scss** (line 328):
   ```scss
   .sheet-header {
     display: flex;
     align-items: center;  // ← Forces horizontal layout
     // ... other properties
   }
   ```

2. **ApplicationV2 item sheets** (`_applicationv2-item-sheets.scss`, line 46):
   ```scss
   .sheet-header {
     display: flex !important;
     align-items: center !important;  // ← Forces horizontal layout with !important
     // ... other properties
   }
   ```

### **Why This Broke the Layout**
- Both CSS rules forced the entire `.sheet-header` to use `display: flex` with `align-items: center`
- This created a **single horizontal flex container** that treated all children as inline flex items
- The `row-container` elements became flex items within a horizontal layout
- Even though `row-container` had correct styling, the parent header overrode the intended layout

## ✅ Solution Implemented

### **1. High-Specificity CSS Overrides**
Added CSS rules with maximum specificity to override the conflicting styles:

**In `_item-sheets.scss`:**
```scss
// CRITICAL FIX: Override ApplicationV2 and main avant.scss flex row behavior
.application.sheet.avant.item .sheet-header,
.avant.application.sheet.item .sheet-header,
.item-sheet.avant.application.sheet .sheet-header {
    display: flex !important;
    flex-direction: column !important;        // ← Key fix
    align-items: stretch !important;
    justify-content: flex-start !important;
    gap: var(--space-sm, 8px) !important;
    padding: var(--space-md, 12px) !important;
    
    // Remove conflicting height constraints
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
}
```

### **2. ApplicationV2 File Updates**
Updated `_applicationv2-item-sheets.scss` to use column layout:

```scss
.sheet-header {
  // ... other properties
  display: flex !important;
  flex-direction: column !important;     // ← Changed from row to column
  align-items: stretch !important;       // ← Changed from center to stretch
  gap: var(--space-sm, 8px) !important;  // ← Added gap for row spacing
  // ... other properties
}
```

### **3. Form Group Layout Optimization**
Enhanced the existing `row-container` styling to properly handle form groups:

```scss
.item-sheet .sheet-header .row-container {
    // ... existing row layout rules
    
    .form-group {
        flex: 1 1 0 !important;
        min-width: 0 !important;
        margin-bottom: 0 !important;
    }
    
    .form-group--image-upload {
        flex: 0 0 auto !important;  // Don't stretch images
    }
    
    .form-group--text-field {
        flex: 1 !important;  // Text fields take remaining space
    }
}
```

## 📊 Technical Details

### **CSS Specificity Hierarchy**
The solution uses multiple selector combinations to ensure override:
- `.application.sheet.avant.item .sheet-header` (highest specificity)
- `.avant.application.sheet.item .sheet-header` (alternative order)
- `.item-sheet.avant.application.sheet .sheet-header` (legacy support)

### **Layout Flow**
1. **Sheet Header**: `flex-direction: column` creates vertical stacking
2. **Row Container**: `flex-direction: row` creates horizontal children
3. **Form Groups**: Maintain internal vertical structure while participating in row layout

## 🧪 Testing

### **Before Fix**
- All header elements cramped into single horizontal row
- Image, name field, and AP selector all inline
- Poor usability and visual hierarchy

### **After Fix**
- **Row 1**: Image upload (fixed width) + Name field (flexible width) side-by-side
- **Row 2**: AP selector in its own row with proper spacing
- Clean, readable layout with proper visual hierarchy

## 🎯 Deployment

- **Built**: npm run build completed successfully
- **Deployed**: Copied to foundry-vtt-v13 container
- **Tested**: Available at http://localhost:30000

## 💡 Key Learnings

1. **CSS Cascade Debugging**: When layout issues persist, check for higher-level specificity conflicts
2. **Multiple Style Sources**: Modern FoundryVTT systems have multiple CSS files that can conflict
3. **ApplicationV2 Compatibility**: v13 specific files require careful coordination with main styles
4. **Specificity Strategy**: Use maximum specificity selectors for critical layout overrides

## 📋 Files Modified

- `avantVtt/styles/components/_item-sheets.scss` - Added high-specificity overrides
- `avantVtt/styles/components/_applicationv2-item-sheets.scss` - Fixed header layout direction

## ✅ Resolution Status

**RESOLVED** - Item sheet headers now display proper vertical row layout with horizontal form group arrangement within each row.

---

**Next Steps**: Test across all item types (Talent, Augment, Weapon, Armor, etc.) to ensure consistent behavior. 