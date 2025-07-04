# Deprecated Theme System

**Status**: Deprecated and archived  
**Retirement Date**: 2025-01-17  
**Last Commit**: a7a2220 (Basic T&A functionality, but then we had to upgrade to V2 and that took two bloody days.)

## Overview

This directory contains the archived Avant VTT theme system that was deprecated and removed from the active codebase. The theme system provided dynamic theming capabilities but was retired in favor of a simplified single-theme approach.

## What's Archived Here

- **logic/**: Theme management service classes and utilities
- **templates/**: Theme configuration templates and UI components
- **themes/**: Theme asset files and configurations
- **types/**: TypeScript type definitions for theme system
- **docs/**: Complete theme system documentation
- **tests/**: Test suites for theme functionality
- **reports/**: Analysis reports and debugging documentation

## Retirement Phases

### Phase 1: Quarantine (2025-01-17)
- Moved all theme-related files to this deprecated directory
- Created stub files to prevent build failures
- Preserved all code and documentation for future reference

### Phase 2: Clean Runtime (2025-01-17)
- Removed all runtime references to theme system
- Cleaned up initialization manager and system bootstrap
- Eliminated theme manager from sheet wrappers
- Verified zero theme-related code in active system

### Phase 3: SCSS Consolidation (2025-01-17)
- Consolidated styling to dark theme only
- Removed light theme SCSS files
- Simplified build process

## Restoration Process

If you need to restore the theme system in the future:

1. **Copy back the relevant files** from this directory to their original locations
2. **Restore the imports** in the main system files
3. **Update the initialization manager** to include theme services
4. **Restore SCSS imports** for multiple theme support
5. **Run tests** to ensure compatibility with current system

## Original Documentation

See `docs/THEMES.md` for the complete original documentation of the theme system architecture and usage patterns.

## Migration Information

**📖 For users upgrading to v0.3.0+**: See the complete [Upgrade Guide](../../docs/UPGRADE_GUIDE.md) for migration steps and information about the new single-theme approach.

## Contact

For questions about the theme system or restoration process, contact the Avant VTT development team. 