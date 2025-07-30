# Foundry VTT Global Style Audit

This document identifies CSS selectors in the Avant VTT system that are not namespaced and are likely to conflict with core Foundry VTT styles or other modules.

## Summary of Findings

Our system currently applies styles to several generic HTML tags and common Foundry CSS classes without scoping them to an `.avant` parent class. This causes our custom styles to "bleed" out and affect UI elements outside of our character and item sheets, most notably in pop-up dialogs for creating actors/items.

The following selectors have been identified as problematic and require namespacing.

---

## 1. Generic HTML Element Selectors

These selectors style common HTML tags globally. They are the most critical to fix.

### `input`
- **Location:** `styles/avant.scss`, `styles/components/_item-rows.scss`, `styles/components/_item-sheets.scss`
- **Impact:** Affects all text inputs, checkboxes, and radio buttons across the entire Foundry interface. This is a primary cause of the visual issues in the "Create Item/Actor" dialogs.

### `select`
- **Location:** `styles/avant.scss`, `styles/components/_item-sheets.scss`
- **Impact:** Affects all dropdown menus.

### `textarea`
- **Location:** `styles/avant.scss`, `styles/components/_forms.scss`, `styles/components/_item-sheets.scss`
- **Impact:** Affects all multi-line text areas.

### `button`
- **Location:** `styles/avant.scss`
- **Impact:** Affects all buttons.

---

## 2. Foundry Core CSS Class Selectors

These selectors target CSS classes that are widely used by the Foundry VTT core software.

### `.form-group`
- **Location:** `styles/avant.scss`, `styles/components/_forms.scss`, `styles/components/_item-sheets.scss`, `styles/components/_form-components.scss`
- **Impact:** This is a foundational class in Foundry for laying out form elements. Our global styling for it disrupts the structure of core dialogs and other forms.

### `.window-content`
- **Location:** (Partially fixed) `styles/components/_item-sheets.scss`
- **Impact:** As identified previously, this class is used for the main content area of all application windows in Foundry. While one instance was fixed, this audit confirms that other instances may exist and should be reviewed.

---

## Remediation Plan

The solution is to "namespace" all the selectors listed above. This means ensuring they only apply when they are inside an element that has our system's unique class, `.avant`.

**Example:**

A problematic global rule:
```scss
// In _forms.scss
.form-group {
  display: flex;
  flex-direction: column;
}
```

Should be corrected to:
```scss
// In _forms.scss
.avant .form-group {
  display: flex;
  flex-direction: column;
}
```

This ensures the style only applies to `.form-group` elements that are descendants of an `.avant` element, leaving the core Foundry UI unaffected.

This process must be applied to all selectors identified in this audit. 