# Avant System Changelog

## [0.3.2] - 2025-08-08

### BREAKING CHANGES

- **Talent Action System**: Replaced legacy `system.cost` field with new `system.action` object for talents
  - New structure: `{ mode: 'immediate' | 'simultaneous' | 'variable', cost: number | null, minCost: number | null, maxCost: number | null, free: boolean }`
  - AP cost display now supports variable cost talents with min/max ranges
  - Visual indicators for different action modes (immediate, simultaneous, variable)
  - Removed legacy `apCost` field from all item types

### Added

- New `TalentAction` and `TalentDocument` types for type-safe talent handling
- `formatTalentAP` and `getActionIcon` utility functions for formatting and displaying action information
- Updated item sheet and item card layouts to use new action system
- Documentation for action system in `LAYOUT.md`

### Changed

- Updated talent item sheet to display action information instead of legacy AP cost
- Updated talent item card to display action information with icons
- Removed `apCost` field from shared layout helpers
- Updated shared types to use new action system for all item types

### Fixed

- None

## [0.3.1] - 2025-07-15

### Added

- None

### Changed

- None

### Fixed

- Various bug fixes and performance improvements

## [0.3.0] - 2025-07-01

### Added

- Initial release with core system features