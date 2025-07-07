# 🎨 Theme System Upgrade Guide

## Overview

Starting with **Avant v0.3.0**, the theme system has been completely removed to improve performance and simplify the user experience. This guide explains the changes and what to expect when upgrading.

## 🎯 What Changed

### Before (v0.2.x)
- Multiple theme options (Dark, Light, Custom)
- Theme upload/download functionality
- Theme manager interface
- Complex theme switching system

### After (v0.3.0+)
- **Single professional dark theme**
- **Optimized performance**
- **Simplified codebase**
- **Consistent visual experience**

## 🚀 Benefits of the Change

### Performance Improvements
- **Faster loading times**: No theme selection overhead
- **Reduced memory usage**: Eliminated 300+ lines of theme management code
- **Smoother interactions**: No DOM mutation observer overhead
- **Instant rendering**: No theme application delays

### User Experience
- **Consistency**: Same beautiful dark theme across all environments
- **Simplicity**: No theme configuration needed
- **Reliability**: No theme-related errors or conflicts
- **Professional appearance**: Polished cyberpunk aesthetic

## 📋 Migration Steps

### For End Users

#### Automatic Migration
✅ **No action required!** Your existing worlds will continue to work exactly as before.

#### What to Expect
1. **Visual consistency**: All sheets and UI elements will use the dark theme
2. **Immediate performance**: Faster loading and smoother interactions
3. **No data loss**: All your characters, items, and world data remain intact
4. **Familiar interface**: Same layout and functionality, just with consistent theming

#### If You Used Custom Themes
- **Custom themes are no longer supported**
- **Your data is preserved**: All game content remains accessible
- **New appearance**: The professional dark theme provides excellent readability and visual appeal
- **Consistent experience**: No more theme-related rendering issues

### For Developers

#### Theme API Removal
- **`game.avant.themes`** - No longer available
- **Theme configuration objects** - Removed from system
- **Theme upload/download functions** - Deprecated
- **Theme validation utilities** - Moved to deprecated archive

#### CSS Variables
- **Core styling variables preserved**: Standard color and typography variables remain
- **Theme-specific variables removed**: No more theme switching variables
- **Single source of truth**: All styling controlled by main CSS file

#### Build Process
- **Simplified SCSS compilation**: No theme variants to build
- **Faster builds**: Reduced validation and processing time
- **Cleaner output**: Single CSS file instead of multiple theme variants

## 🎨 New Visual Design

The unified dark theme features:

### Color Palette
- **Primary Background**: Dark cyberpunk tones
- **Accent Color**: Cyan (#00E0DC) for interactive elements
- **Text Colors**: High contrast for excellent readability
- **Form Elements**: Consistent styling with cyan accents

### Typography
- **Headers**: Orbitron font for a futuristic feel
- **Body Text**: Exo 2 font for excellent readability
- **Consistent Sizing**: Optimal font sizes for all UI elements

### Accessibility
- **WCAG Compliance**: All color contrasts meet accessibility standards
- **Focus Indicators**: Clear visual feedback for keyboard navigation
- **Screen Reader Support**: Proper ARIA labels and semantic markup

## 🔧 Technical Details

### Removed Components
- `ThemeManager` service class
- `ThemeProvider` service class
- Theme configuration system
- Theme upload/download functionality
- Theme validation utilities
- Mutation observer for dynamic theming

### Preserved Components
- Core game functionality
- Character sheets and item sheets
- Dice rolling system
- Chat integration
- Trait system
- Compendium packs

## 🚨 Troubleshooting

### Common Questions

**Q: Can I still use custom themes?**
A: No, custom themes are no longer supported. The system now uses a single, optimized dark theme.

**Q: Will my existing worlds work?**
A: Yes! All your world data, characters, and items will work exactly as before.

**Q: Can I switch back to a light theme?**
A: No, the light theme has been removed. The dark theme is optimized for gaming sessions and provides better performance.

**Q: Are there any breaking changes to my game data?**
A: No, all game data remains compatible. Only the theming system has been removed.

### If You Experience Issues

1. **Clear browser cache**: Refresh the page with Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. **Restart FoundryVTT**: Close and reopen FoundryVTT to ensure all changes are loaded
3. **Check console**: Look for any error messages in the browser console (F12)
4. **Contact support**: If issues persist, contact the Avant development team

## 🔄 Rollback (Not Recommended)

If you absolutely need to rollback to a previous version:

1. **Backup your world data** before any changes
2. **Download Avant v0.2.3** from the GitHub releases
3. **Install the older version** following standard installation procedures
4. **Note**: You'll lose performance improvements and bug fixes

⚠️ **Warning**: Rolling back is not recommended as it reintroduces performance issues and potential bugs that were fixed in v0.3.0.

## 📖 Additional Resources

### Documentation
- **Main README**: Updated with single theme information
- **Deprecated Theme System**: Preserved in `/deprecated/theme-system/`
- **Development Guide**: Build instructions for developers

### Support
- **GitHub Issues**: Report bugs or request features
- **Discord**: Chat with the development team and community
- **Documentation**: Comprehensive guides for users and developers

## 🎉 Welcome to Avant v0.3.0

The theme system removal represents a significant step forward in the Avant system's evolution. By focusing on a single, professionally designed theme, we've delivered:

- **Better performance** for all users
- **Consistent visual experience** across all environments
- **Simplified maintenance** for faster development
- **Improved reliability** with fewer potential issues

Thank you for using Avant, and enjoy the enhanced gaming experience!

---

**Need Help?** Contact the Avant development team through GitHub Issues or Discord.

**Last Updated**: January 17, 2025  
**Version**: v0.3.0+ 