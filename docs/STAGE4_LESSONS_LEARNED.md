# Stage 4 Lessons Learned: Quick Reference Guide

## 🚨 Critical FoundryVTT v13 Breaking Changes

### **Template Partial References**
```handlebars
❌ BROKEN (v12): {{> "systems/avant/templates/shared/partials/image-upload"}}
✅ FIXED (v13):  {{> "systems/avant/templates/shared/partials/image-upload.hbs"}}
```
**Rule:** ALL partial references MUST include `.hbs` extension in FoundryVTT v13

### **Handlebars Helper Requirements**
```handlebars
❌ BROKEN: {{#each (range 1 (add (or max 3) 1))}}
✅ FIXED:  Register all required helpers: add, range, or
```
**Rule:** ALL helpers used in templates must be explicitly registered

## 🔍 Debugging Methodology That Works

### **1. Browser Console First**
- Check browser console for specific error messages
- FoundryVTT v13 provides clear, actionable error messages
- Look for "Missing helper: X" or "partial could not be found"

### **2. Sequential Problem Solving**
1. Fix template loading issues first (partials, extensions)
2. Then fix template rendering issues (missing helpers)
3. Test after each fix before moving to next issue

### **3. Runtime vs Build-Time Validation**
- Build validation catches syntax errors
- Runtime validation catches missing dependencies
- Both are essential for complete validation

## 🛠️ Template System Architecture Rules

### **Helper Registration**
```typescript
// ✅ CORRECT: Check existence before registering
if (!Handlebars.helpers.add) {
    Handlebars.registerHelper('add', function(a, b) {
        return (parseFloat(a) || 0) + (parseFloat(b) || 0);
    });
}

// ❌ WRONG: Direct registration without checking
Handlebars.registerHelper('add', function(a, b) {
    return a + b; // No validation, potential conflicts
});
```

### **Complex Template Expressions**
```handlebars
{{#each (range 1 (add (or max 3) 1)) as |apValue|}}
```
**Requirements:** ALL helpers must be available: `range`, `add`, `or`

## 📝 Common Error Messages & Solutions

### **Template Partial Errors**
```
❌ "The partial shared/partials/image-upload could not be found"
✅ Add .hbs extension to partial reference
```

### **Helper Errors**
```
❌ "Missing helper: add"
✅ Register the helper in template-helpers.ts before template rendering
```

### **Template Syntax Errors**
```
❌ "You are only allowed to load template files with an extension in [handlebars, hbs, html]"
✅ Ensure all partial references include file extensions
```

## 🎯 Best Practices for Future Development

### **1. Template Development**
- Always include `.hbs` extensions in partial references
- Test templates in actual FoundryVTT runtime, not just build validation
- Use defensive helper registration with existence checks

### **2. Debugging Workflow**
- Start with browser console error messages
- Fix foundational issues (template loading) before advanced issues (helper logic)
- Deploy and test immediately after each fix

### **3. Documentation**
- Document all helper usage patterns
- Comment complex template expressions
- Maintain change logs for template modifications

## 🔄 Integration Patterns

### **Component Library Usage**
```handlebars
{{!-- ✅ CORRECT: Use layout partials with content blocks --}}
{{#> "systems/avant/templates/shared/partials/single-content.hbs"}}
    {{> "systems/avant/templates/shared/partials/text-field.hbs" name="system.name"}}
{{/}}
```

### **Helper Composition**
```handlebars
{{!-- ✅ CORRECT: Complex helper expressions --}}
{{#each (range 1 (add (or max 3) 1)) as |apValue|}}
    <option value="{{apValue}}">{{apValue}} AP</option>
{{/each}}
```

## 🚀 Performance Considerations

### **Build Time Optimization**
- Template validation: <5 seconds for 47+ templates
- Helper registration: <1 second for all helpers
- Deployment: Docker bind mounts for rapid iteration

### **Runtime Performance**
- No console errors in production
- Helpers use defensive parsing (parseFloat, parseInt)
- Template expressions are optimized for readability and performance

---

**Quick Access:** For detailed analysis, see `reports/2025-01-17_stage4-complete-final-report.md` 