# AvantVTT Compendium Packs - JSON Sources

**Version 1.1.0 - Phase 3 Production-Ready System**

This directory contains the JSON source files for all AvantVTT compendium packs. These files serve as the single source of truth for all items that get compiled into FoundryVTT-compatible compendium databases.

## Quick Start

```bash
# Build all compendium packs
npm run build:packs

# Run with enhanced logging
AVANT_DEBUG=true npm run build:packs

# Validate compendium health
node scripts/data/compendium-integration.js --validate
```

## Directory Structure

```
packs/
├── traits/          # Trait items (23 items) - Elemental, combat, utility
├── talents/         # Talent items (15 items) - Active abilities  
├── augments/        # Augment items (15 items) - Cybernetic/biological enhancements
├── macros/          # Macro items (10 items) - Automation scripts
└── README.md        # This comprehensive guide
```

## Content Overview

- **🔥 Traits (23 items)**: Fire, Ice, Lightning, Earth, Air, Water, Combat, Stealth, Tech, Bio, Equipment categories
- **⚡ Talents (15 items)**: Elemental attacks, defensive abilities, utility powers
- **🤖 Augments (15 items)**: Neural interfaces, muscle enhancers, sensory augments, cybernetic limbs
- **🎮 Macros (10 items)**: Combat utilities, token management, system automation

## File Format

Each JSON file represents a single item and **must** follow this structure:

### Pipeline Schema (Required)
```json
{
  "_id": "eoBL454MnKXSQFjY",     // REQUIRED: 16-char unique ID
  "name": "Fire",                // REQUIRED: Display name
  "type": "trait",               // REQUIRED: Item type
  "category": "general",         // REQUIRED: Category (auto-inferred if missing)
  "system": {
    "color": "#FF6B6B",
    "icon": "fas fa-fire",
    "localKey": "AVANT.Trait.Fire",
    "description": "Represents fire-based abilities",
    "isActive": false,
    "powerPointCost": 0,
    "uses": { "value": 0, "max": 0 }
  },
  "img": "icons/svg/item-bag.svg",
  "sort": 100
}
```

### Traits
```json
{
  "_id": "eoBL454MnKXSQFjY",
  "name": "Fire",
  "type": "trait",
  "category": "elemental",
  "system": {
    "color": "#FF6B6B",
    "icon": "fas fa-fire",
    "localKey": "AVANT.Trait.Fire",
    "description": "Represents fire-based abilities",
    "isActive": false,
    "powerPointCost": 0,
    "uses": { "value": 0, "max": 0 }
  },
  "img": "icons/svg/item-bag.svg",
  "sort": 100
}
```

### Talents
```json
{
  "_id": "eqMhAeO8fALxqWwn",
  "name": "Fire Strike",
  "type": "talent",
  "category": "combat",
  "system": {
    "apCost": 2,
    "levelRequirement": 1,
    "traits": ["Fire", "Attack"],
    "requirements": "",
    "description": "Channel fire energy into a devastating melee attack."
  },
  "img": "icons/svg/item-bag.svg",
  "sort": 100
}
```

### Augments
```json
{
  "_id": "f1mv2Zww6xxz1tzv",
  "name": "Neural Interface",
  "type": "augment",
  "category": "cybernetic",
  "system": {
    "apCost": 1,
    "ppCost": 2,
    "levelRequirement": 2,
    "traits": ["Tech", "Enhancement"],
    "requirements": "Must have cybernetic compatibility",
    "description": "A neural implant that enhances cognitive processing."
  },
  "img": "icons/svg/item-bag.svg",
  "sort": 100
}
```

### Macros
```json
{
  "_id": "JwRjYlxcHY1Clja5",
  "name": "Export Custom Traits",
  "type": "script",
  "category": "utility",
  "command": "console.log('Macro functionality here');",
  "img": "icons/svg/item-bag.svg",
  "sort": 100
}
```

## Build Process

The **Avant Compendium Pipeline** ensures robust, validated builds:

### Pipeline Validation
```bash
# Validate all JSON files (Phase A)
npm run compendium:check

# Auto-fix missing _id and category fields
npm run compendium:fix

# Split monolithic files into individual files (Phase B)
npm run compendium:split

# Build with enhanced validation and deterministic output
npm run build:packs
```

### Build Steps
1. **Phase A Validation**: Check _id uniqueness and required fields
2. **Phase B Loading**: Hybrid loader supports both monolithic and split formats
3. **JSON Parsing**: Load and validate all `*.json` files (skip metadata files)
4. **Schema Validation**: Ensure compliance with Pipeline Schema
5. **Duplicate Detection**: Prevent duplicate _id conflicts
6. **Compilation**: Generate FoundryVTT-compatible `.db` files using permanent IDs
7. **Placement**: Deploy to `dist/packs/` directory

### Success Criteria
- ✅ All JSON files have valid syntax
- ✅ All documents have unique 16-character `_id` fields
- ✅ No duplicate IDs within or across packs
- ✅ Build process is deterministic (identical hashes)
- ✅ All required fields present (name, type, category)

## Adding New Items

To add a new item:

1. **Create JSON file**: Add a new `.json` file in the appropriate subdirectory
2. **Follow Pipeline Schema**: Use the required format (see examples above)
3. **Generate IDs**: Run `npm run compendium:fix` to auto-generate missing `_id` fields
4. **Validate**: Run `npm run compendium:check` to verify compliance
5. **Build**: Run `npm run build:packs` to generate the compendium
6. **Test**: Validate in FoundryVTT

### Quick Template
```json
{
  "_id": "",                    // Leave empty - auto-generated by compendium:fix
  "name": "Your Item Name",
  "type": "trait|talent|augment|script",
  "category": "",               // Leave empty - auto-inferred
  "system": {
    "description": "Item description here"
  },
  "img": "icons/svg/item-bag.svg",
  "sort": 100
}
```

## Schema Validation

The **Avant Compendium Pipeline** validates all JSON files at multiple levels:

### Required Fields (Pipeline Schema)
- **All Items**: `_id` (16 chars), `name`, `type`, `category`
- **Traits**: `system.color`, `system.icon`, `system.description`
- **Talents/Augments**: `system.description`, `system.traits`
- **Macros**: `command`

### Validation Commands
```bash
# Comprehensive validation
npm run compendium:check

# Fix missing fields automatically
npm run compendium:fix

# Verbose validation output
npm run compendium:check --verbose
```

### CI/CD Integration
- **GitHub Actions**: Automatic validation on push/PR
- **Duplicate Detection**: Prevents ID conflicts
- **Hash Consistency**: Ensures deterministic builds
- **JSON Syntax**: Validates all files for syntax errors

Invalid files will cause the build to fail with descriptive error messages.

## Migration Status

- **Phase 1**: ✅ Directory structure created, CompendiumLoader implemented
- **Phase 2**: ✅ Migrated existing seed data to JSON files, updated build system
- **Phase 3**: ✅ Full content library (63 items), enhanced validation, comprehensive logging
- **Pipeline A**: ✅ ID & Category Guard with validator and auto-fix functionality
- **Pipeline B**: ✅ File granularity with hybrid loader and deterministic builds

### Pipeline Phase A Achievements

- ✅ **ID & Category Guard**: Validates and fixes missing `_id` and `category` fields
- ✅ **CLI Commands**: `npm run compendium:check` and `npm run compendium:fix`
- ✅ **Duplicate Detection**: Prevents ID conflicts across all packs
- ✅ **Auto-fix Mode**: Generates missing IDs using Foundry-compatible format
- ✅ **GitHub Actions**: Automated validation on push/PR
- ✅ **Hash Consistency**: Ensures deterministic builds
- ✅ **Updated Documentation**: Complete Pipeline Schema and workflows

### Pipeline Phase B Achievements

- ✅ **Permanent ID Usage**: Build system now uses `_id` from JSON files instead of generating new ones
- ✅ **Deterministic Builds**: Fixed timestamps and user IDs ensure identical hashes on consecutive builds
- ✅ **Hybrid Loader**: Supports both monolithic arrays and individual file formats during transition
- ✅ **Split-Pack Script**: `npm run compendium:split` migrates from monolithic to individual files
- ✅ **Hash Consistency**: Two consecutive builds produce byte-identical `.db` files
- ✅ **Metadata Support**: Loader skips `_folders.json` and other metadata files

### Next Pipeline Phases

- **Phase C**: Folder support with `_folders.json` metadata
- **Phase D**: Link rewriting (`@Compendium` → `@UUID`)
- **Phase E**: Round-trip extractor for CI validation

## Advanced Features

### Environment Configuration

```bash
# Enable debug logging
export AVANT_DEBUG=true

# Set log level (error, warn, info, debug)
export AVANT_LOG_LEVEL=debug

# Run build with enhanced logging
npm run build:packs
```

### System Health Validation

```javascript
// In your code or console
import { validateSystemHealth } from './scripts/data/compendium-integration.js';

const health = await validateSystemHealth();
console.log('System Health:', health.healthy ? 'GOOD' : 'ISSUES FOUND');
```

### Diagnostic Information

```javascript
// Get comprehensive system diagnostics
import { getDiagnostics } from './scripts/data/compendium-integration.js';

const diagnostics = await getDiagnostics();
console.log('Performance:', diagnostics.performance.loadTimeMs + 'ms');
```

## Contributing

### Development Workflow

1. **Set up environment**:
   ```bash
   export AVANT_DEBUG=true
   export AVANT_LOG_LEVEL=debug
   ```

2. **Create new items**:
   - Use existing items as templates
   - Follow naming conventions (kebab-case filenames)
   - Ensure all required fields are present

3. **Validate your changes**:
   ```bash
   npm run build:packs        # Test build process
   npm run validate:templates # Validate templates
   ```

4. **Test in FoundryVTT**:
   - Load the generated compendiums
   - Test item functionality
   - Verify traits display correctly

### Content Guidelines

#### Traits
- Use hex colors: `#FF6B6B` format
- Choose descriptive icons: `fas fa-fire`
- Keep descriptions under 100 characters
- Assign appropriate categories

#### Talents & Augments  
- Include meaningful trait associations
- Provide clear requirements and costs
- Write descriptive text (minimum 20 characters)
- Test power point costs (0-20 range)

#### Macros
- Include security review for commands
- Test with different token selections
- Provide clear user feedback
- Use appropriate scope (global/actor/chat)

### Validation Levels

The system performs multiple validation passes:

1. **Structural**: JSON syntax, required fields
2. **Type-specific**: Field validation per item type  
3. **Semantic**: Content quality, reasonable values
4. **Security**: Basic security checks for macros

### Troubleshooting

**Build Failures**:
```bash
# Run with debug logging
AVANT_DEBUG=true npm run build:packs

# Get detailed diagnostics
node -e "import('./scripts/data/compendium-integration.js').then(m => m.getDiagnostics().then(console.log))"
```

**Validation Errors**:
- Check file syntax with JSON validator
- Verify all required fields are present
- Ensure colors use hex format (#RRGGBB)
- Check trait arrays are properly formatted

**Performance Issues**:
- Large files (>50KB) will generate warnings
- High error rates (>10%) indicate systemic issues
- Use `validateSystemHealth()` for comprehensive checks

### Support

For questions about the compendium system:
- Check the main project documentation in `CLAUDE.md`
- Review validation error messages for specific guidance
- Use debug mode for detailed troubleshooting information
- Test changes incrementally to isolate issues

---

**System Architecture**: JSON-First Compendium with CompendiumLoader + Enhanced Validation + Comprehensive Logging