# Theme System Migration Guide

## Overview

Starting with Avant v0.2.4, the theme system has been simplified to use a single, optimized dark theme. This guide helps users migrate from previous versions with multiple theme support.

## What Changed

### Removed Features
- **Theme switching interface** - No longer available in settings
- **Light theme** - All UI now uses consistent dark theme
- **Custom theme upload** - Theme customization has been retired
- **Theme manager application** - Management interface removed

### What Remains
- **Dark (Cyberpunk) theme** - Now the default and only theme
- **All visual styling** - No functionality changes, only theme options removed
- **CSS custom properties** - Still used internally for consistency

## Migration Process

### Automatic Migration
- **No action required** for most users
- Existing installations automatically use the dark theme
- All data and functionality remains intact
- Sheet layouts and styling are preserved

### For Users with Custom Themes
If you were using custom themes:

1. **Theme preferences are preserved** in the deprecated system for potential future restoration
2. **Your world data is unaffected** - no characters or items are lost  
3. **Visual experience** defaults to the polished dark theme
4. **Custom themes** are archived but not deleted

## Benefits of the Change

### Performance Improvements
- **Faster loading** - No theme initialization overhead
- **Reduced CSS size** - 1.9% smaller stylesheets (3KB reduction)
- **Improved build time** - 12% faster compilation (338ms vs 386ms)

### User Experience
- **Consistent interface** - No theme switching confusion
- **Optimized design** - Single theme receives focused attention
- **Reduced complexity** - Simpler system maintenance

### Development Benefits
- **Streamlined codebase** - 300+ lines of theme code removed
- **Easier maintenance** - Single styling target
- **Better testing** - Focused quality assurance

## Frequently Asked Questions

### Q: Can I still customize the appearance?
**A:** Basic CSS customization is possible through browser extensions or custom CSS modules, but the built-in theme manager has been removed.

### Q: Will my world still work?
**A:** Yes, absolutely. All your characters, items, and game data remain completely intact. Only the theme selection interface has changed.

### Q: What if I preferred the light theme?
**A:** The dark theme has been optimized for extended gaming sessions and better eye strain reduction. It provides the best user experience for tabletop gaming.

### Q: Can themes be restored in the future?
**A:** The theme system is preserved in the deprecated directory. Future restoration is possible if there's sufficient user demand.

### Q: Will this affect FoundryVTT modules?
**A:** No impact on other modules. The dark theme is designed to be compatible with the broader FoundryVTT ecosystem.

## Technical Details

### For Developers
- **CSS Custom Properties** still available for module integration
- **Theme variables** follow the `--theme-*` naming convention
- **SCSS source** maintains modular structure for future extensibility

### File Changes
- Theme manager files moved to `deprecated/theme-system/`
- Main CSS output optimized and consolidated
- No breaking changes to public APIs

## Support

If you experience any issues after upgrading:

1. **Clear browser cache** to ensure fresh CSS loading
2. **Restart FoundryVTT** to complete the upgrade process
3. **Check console** for any error messages

For additional support:
- **Discord**: bipolardiceroller, ManSally
- **GitHub**: [Report Issues](https://github.com/njisaf/AvantVTT/issues)

## Version History

- **v0.2.3 and earlier**: Full theme system with light/dark/custom themes
- **v0.2.4+**: Simplified single dark theme
- **Deprecated theme system**: Preserved in `deprecated/theme-system/`

---

*This migration ensures Avant provides the best possible experience while focusing development resources on core gameplay features.* 