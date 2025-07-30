# ApplicationV2 Form Handling Guide

## Overview

This document provides comprehensive guidance for handling forms in FoundryVTT v13+ ApplicationV2 sheets. ApplicationV2 introduces significant changes to form handling that differ from legacy Application classes and have caused persistent issues in our development.

## The Nested Form Problem

### What is the Nested Form Issue?

ApplicationV2 creates a complex form structure with **nested forms**:

1. **Outer Frame Form**: Contains header controls (close, minimize, etc.)
2. **Inner Content Form**: Contains actual input fields (name, description, etc.)

### The Critical Gotcha

The `form` parameter passed to `_prepareSubmitData` is often the **outer frame form**, which only contains header buttons with no `name` attributes. This means:

- `formData.object` is empty or undefined
- All your input fields are ignored
- Form submission appears to work but no data is saved
- No error messages appear, making debugging difficult

### Visual Representation

```html
<!-- ApplicationV2 creates this structure -->
<form class="app-v2-frame">  <!-- ← This is often the 'form' parameter -->
    <header>
        <button class="header-control">close</button>
        <button class="header-control">minimize</button>
    </header>
    <div class="window-content">
        <div data-application-part="form">  <!-- ← This contains your actual inputs -->
            <input name="name" type="text" value="Item Name">
            <input name="system.description" type="text" value="Description">
            <input name="system.apCost" type="number" value="1">
        </div>
    </div>
</form>
```

## The Solution Pattern

### 1. Detect the Nested Form Issue

```typescript
// Check if form only has header control buttons
const formElements = Array.from(form.elements) as HTMLFormElement[];
const hasOnlyHeaderButtons = formElements.length > 0 && formElements.every((el: any) => 
    el.tagName === 'BUTTON' && 
    el.className && 
    el.className.includes('header-control') && 
    !el.name
);
```

### 2. Find the Actual Content Form

```typescript
if (hasOnlyHeaderButtons) {
    // Find the actual content form with input fields
    const contentForm = this.element.querySelector('div[data-application-part="form"]') as HTMLElement;
    if (contentForm) {
        actualForm = contentForm;
    }
}
```

### 3. Extract Data from Multiple Sources

Handle different form data structures:

```typescript
let rawFormData: any;

if (formData && typeof formData.object === 'object') {
    // Standard FormDataExtended pattern
    rawFormData = formData.object;
} else if (formData && formData.constructor?.name === 'FormData') {
    // Native FormData - convert to object
    rawFormData = {};
    for (const [key, value] of formData.entries()) {
        rawFormData[key] = value;
    }
} else if (formData && typeof formData === 'object') {
    // Plain object - use directly
    rawFormData = formData;
} else {
    // Fallback
    rawFormData = formData || {};
}
```

### 4. Manual Form Data Extraction (Critical Fallback)

```typescript
// If we still have no form data, extract manually
if ((!rawFormData || Object.keys(rawFormData).length === 0) && actualForm) {
    const inputs = actualForm.querySelectorAll('input, select, textarea');
    const extractedData: any = {};
    
    inputs.forEach((input: any) => {
        if (input.name && !input.disabled) {
            extractedData[input.name] = input.value;
        }
    });
    
    if (Object.keys(extractedData).length > 0) {
        rawFormData = extractedData;
    }
}
```

## Adding New Form Fields

### Step-by-Step Process

1. **Add field to template with proper name attribute**:
   ```html
   <input name="system.newField" type="text" value="{{system.newField}}">
   ```

2. **Test that _prepareSubmitData captures the field**:
   - Enable debug logging in the method
   - Check console for `extractedData` object
   - Verify your field appears in the logs

3. **If field isn't captured**:
   - Verify it's in the content form, not just the frame
   - Check for typos in the name attribute
   - Ensure the field isn't disabled

4. **Update data model schema if needed**:
   ```typescript
   // In your item data model
   static defineSchema() {
       return {
           newField: new StringField({initial: ""})
       };
   }
   ```

5. **Add validation if the field is critical**:
   ```typescript
   private _validateCriticalFields(processedData: any, itemType: string): void {
       const requiredFields = ['description', 'newField']; // Add your field
       // ... validation logic
   }
   ```

### Template Naming Conventions

- Use dot notation for nested data: `name="system.fieldName"`
- Use consistent naming: `name="system.apCost"` not `name="apCost"`
- Include data types: `data-dtype="Number"` for numeric fields

### Example: Adding a New Field to Talents

1. **Template** (`templates/item/item-talent-sheet.html`):
   ```html
   <div class="form-group">
       <label>New Field</label>
       <input name="system.newField" type="text" value="{{system.newField}}" data-dtype="String">
   </div>
   ```

2. **Data Model** (`scripts/data/item-data.ts`):
   ```typescript
   class TalentData extends ItemDataModel {
       static defineSchema() {
           return {
               // ... existing fields
               newField: new StringField({initial: ""})
           };
       }
   }
   ```

3. **Validation** (in `item-sheet.ts`):
   ```typescript
   private _validateCriticalFields(processedData: any, itemType: string): void {
       if (itemType === 'talent') {
           requiredFields.push('requirements', 'levelRequirement', 'apCost', 'newField');
       }
   }
   ```

## Debugging Form Issues

### Enable Debug Logging

Add this to your `_prepareSubmitData` method:

```typescript
logger.debug('AvantItemSheet | Form debugging:', {
    formElementType: form?.tagName,
    formElementCount: form?.elements?.length,
    formDataKeys: Object.keys(formData || {}),
    hasFormDataObject: !!(formData?.object),
    rawFormDataKeys: Object.keys(rawFormData || {}),
    extractedDataKeys: Object.keys(extractedData || {}),
    processedDataKeys: Object.keys(processedData || {})
});
```

### Common Debug Patterns

1. **Check form element count**:
   ```
   formElementCount: 4  // If only 4, likely header buttons only
   ```

2. **Check form data keys**:
   ```
   formDataKeys: []           // Empty = problem
   rawFormDataKeys: ["name", "system.description"]  // Good
   ```

3. **Check extracted data**:
   ```
   extractedDataKeys: ["name", "system.description", "system.apCost"]  // All fields present
   ```

### Debugging Checklist

- [ ] Form has proper name attributes
- [ ] Fields are not disabled
- [ ] Debug logs show field extraction
- [ ] Data model schema includes new fields
- [ ] Validation passes for required fields
- [ ] Form submission triggers document update

## Best Practices

### 1. Use Proper Form Structure

```html
<!-- Good: Proper name attributes -->
<input name="system.description" type="text" value="{{system.description}}">

<!-- Bad: Missing name attribute -->
<input type="text" value="{{system.description}}">
```

### 2. Handle Multiple Data Types

```html
<!-- String fields -->
<input name="system.name" type="text" value="{{system.name}}" data-dtype="String">

<!-- Number fields -->
<input name="system.apCost" type="number" value="{{system.apCost}}" data-dtype="Number">

<!-- Boolean fields -->
<input name="system.enabled" type="checkbox" {{checked system.enabled}} data-dtype="Boolean">
```

### 3. Add Validation for Critical Fields

```typescript
const requiredFields = ['description'];
if (itemType === 'talent') {
    requiredFields.push('requirements', 'levelRequirement', 'apCost');
}
```

### 4. Use Pure Functions for Data Processing

```typescript
// Don't process data directly in the sheet
const processedData = extractItemFormData(rawFormData);

// Do use imported utility functions
import { extractItemFormData } from '../logic/item-sheet-utils.js';
```

## Common Pitfalls

### 1. Assuming Form Parameter is Content Form

```typescript
// Wrong - assumes form is the content form
const inputs = form.querySelectorAll('input');

// Right - find the actual content form
const contentForm = this.element.querySelector('div[data-application-part="form"]');
const inputs = contentForm?.querySelectorAll('input');
```

### 2. Not Handling Multiple Form Data Structures

```typescript
// Wrong - assumes formData.object exists
const data = formData.object;

// Right - handle multiple structures
let data = formData?.object || formData || {};
```

### 3. Missing Name Attributes

```html
<!-- Wrong - no name attribute -->
<input type="text" value="{{system.description}}">

<!-- Right - proper name attribute -->
<input name="system.description" type="text" value="{{system.description}}">
```

### 4. Forgetting Data Type Attributes

```html
<!-- Wrong - no data type -->
<input name="system.apCost" type="number" value="{{system.apCost}}">

<!-- Right - with data type -->
<input name="system.apCost" type="number" value="{{system.apCost}}" data-dtype="Number">
```

## Action Handler Patterns

### Adding New Action Handlers

1. **Add to DEFAULT_OPTIONS.actions**:
   ```typescript
   actions: {
       myNewAction: function(this: AvantItemSheet, event: Event, target: HTMLElement) {
           // Use regular function syntax for proper 'this' binding
           return this.onMyNewAction(event, target);
       }
   }
   ```

2. **Add to template**:
   ```html
   <button data-action="myNewAction">Click Me</button>
   ```

3. **Implement instance method**:
   ```typescript
   async onMyNewAction(event: Event, target: HTMLElement): Promise<void> {
       // Your action logic here
   }
   ```

### Action Handler Rules

- **Use regular function syntax**, not arrow functions
- **First parameter is Event**, second is HTMLElement
- **Return value can be Promise** for async operations
- **'this' is automatically bound** to sheet instance

## Testing Your Changes

### 1. Manual Testing

1. Open the item sheet
2. Add/edit form fields
3. Save the sheet
4. Reopen the sheet
5. Verify data persists

### 2. Debug Log Testing

1. Enable debug logging in `_prepareSubmitData`
2. Check console for form data extraction
3. Verify all fields appear in logs
4. Test with different item types

### 3. Edge Case Testing

1. Test with empty forms
2. Test with disabled fields
3. Test with different data types
4. Test form submission errors

## Conclusion

ApplicationV2 form handling requires careful attention to the nested form structure and multiple data extraction patterns. By following the patterns in this guide and the comprehensive comments in `item-sheet.ts`, you can avoid the common pitfalls that have caused persistent form data issues.

Remember:
- Always check for the nested form issue
- Handle multiple form data structures
- Use proper name attributes
- Test thoroughly with debug logging
- Follow the established patterns for consistency

For implementation details, see the `_prepareSubmitData` method in `avantVtt/scripts/sheets/item-sheet.ts`. 