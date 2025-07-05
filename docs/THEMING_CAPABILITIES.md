# Avant VTT Theming Capabilities Documentation

## Full Window Theming Capability

**Date Discovered**: 2025-01-17  
**Status**: Proof of concept working, intentionally scoped down

### What We Discovered

The Avant theme manager has the capability to theme the **entire FoundryVTT interface**, not just our specific components. This was discovered when debugging theme application issues and the theme manager was applying themes to the whole Foundry window.

### How It Works

The theme manager uses CSS custom properties (CSS variables) and CSS classes to apply themes. When given broad selectors, it can target:

- The entire Foundry UI (`body`, `.window-app`, etc.)
- All chat messages and sidebar elements
- Menu bars, buttons, and interface elements
- Background colors, text colors, and accent colors throughout the interface

### Technical Implementation

The key parts of the code that enable this are in `scripts/themes/theme-manager.js`:

1. **Broad Selector Support**: The `applyTheme` method can use selectors like:
   ```javascript
   const selectors = [
       'body',                      // Entire page
       '.window-app',              // All Foundry windows
       '.sidebar',                 // Sidebar elements
       '[class*="avant"]'          // Any element with "avant" in class name
   ];
   ```

2. **CSS Variable Injection**: The theme manager can inject CSS variables at the document root level:
   ```javascript
   document.documentElement.style.setProperty('--primary-color', themeColor);
   ```

3. **Global Class Application**: Can add theme classes to high-level elements like `body` or `#board`.

### Current Implementation (Scoped)

For the current product needs, we intentionally scope the theming to only:
- `.avant-feature-card` (chat feature cards)
- `.avant` (actor sheets and item sheets)

This is done by using specific selectors and avoiding broad ones.

### Future Possibilities

If we ever want to provide "full Foundry theming" as a feature, we have the technical foundation to do so. This could include:

- **Complete UI Theming**: Theme the entire Foundry interface to match Avant's aesthetic
- **Accessibility Themes**: High contrast themes for the whole interface
- **Custom Branding**: Allow users to completely rebrand their Foundry instance
- **Integration with Other Systems**: Provide theming that works across multiple game systems

### Implementation Notes

To enable full window theming in the future:

1. **Modify Selectors**: Change the selectors in `applyTheme()` to target broader elements
2. **Add CSS Variables**: Define CSS variables that affect core Foundry CSS
3. **Test Compatibility**: Ensure themes don't break other modules or core functionality
4. **User Settings**: Add settings to control the scope of theming (component-only vs. full-window)

### Warnings

- Full window theming could conflict with other modules that also modify the UI
- Some Foundry updates might break full window themes
- Users might find it overwhelming or prefer the standard Foundry interface
- Performance impact of theming the entire interface needs to be tested

### Related Files

- `scripts/themes/theme-manager.js` - Main theming logic
- `styles/themes/` - Theme definitions
- `templates/accessibility-settings.html` - Accessibility controls

---

**Note**: This capability was discovered during debugging and represents the "happy accident" of building a robust theming system. The current scoped implementation is intentional and appropriate for the current product needs. 