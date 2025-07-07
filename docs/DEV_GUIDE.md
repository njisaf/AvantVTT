# AvantVTT Developer Guide

A comprehensive guide for developers working on the AvantVTT system.

## 🎯 Overview

This guide covers the essential development practices, tools, and workflows for contributing to AvantVTT. Whether you're fixing bugs, adding features, or maintaining the system, this document provides the foundational knowledge you need.

## 📋 Quick Start

### Prerequisites
- Node.js 18+ 
- Git
- FoundryVTT v13.344+ (for testing)

### Setup
```bash
# Clone the repository
git clone https://github.com/njisaf/AvantVTT.git
cd AvantVTT

# Install dependencies
npm ci

# Build the system
npm run build

# Run tests
npm test
```

## 🏗️ Development Workflow

### 1. Code Quality Standards
- **TypeScript**: New code should be written in TypeScript
- **ESLint**: All code must pass linting (`npm run lint`)
- **Testing**: Maintain test coverage above 65%
- **Documentation**: Use JSDoc for all public functions

### 2. Build Process
```bash
# Complete build (TypeScript + SCSS + Validation)
npm run build

# Development mode (auto-rebuild)
npm run dev

# SCSS compilation only
npm run build:scss

# TypeScript compilation only
npm run build:ts
```

### 3. Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run with coverage
npm test -- --coverage
```

## 🚨 Deprecation Policy & Tooling

AvantVTT follows a comprehensive four-phase deprecation process for managing legacy code. All developers must be familiar with these tools and procedures.

### Deprecation Guard System

The system includes automated CI guards that prevent accidental modification of deprecated code:

#### **CI Guards**
- **Deprecated Folder Protection**: CI blocks edits to `deprecated/` folders without restoration keywords
- **Import Scanning**: CI scans for imports of deprecated services in active code
- **Distribution Validation**: Build process ensures no deprecated references exist in final package

#### **Local Guard Commands**
```bash
# Run all deprecation guards locally
npm run guard:deprecated

# Run dead-code scanning
npm run lint:deadcode

# Full lint including guards
npm run lint
```

### Working with Deprecated Code

#### **Viewing Deprecated Code**
```bash
# Deprecated code is stored in deprecated/ folders
ls deprecated/

# Each deprecated component has comprehensive documentation
cat deprecated/remote-trait-service/README.md
```

#### **Restoring Deprecated Code**
If you need to restore deprecated code:

1. **Review the restoration guide** in the deprecated component's README
2. **Include restoration keyword** in your commit message: `restore-remote-trait-service`
3. **Follow the restoration procedures** documented in the archival README
4. **Update the deprecation status** in relevant documentation

#### **Creating New Deprecations**
Follow the four-phase process documented in `docs/DEPRECATION_POLICY.md`:

1. **Phase 1**: Quarantine (move to deprecated folder)
2. **Phase 2**: Stub replacement (maintain compatibility)
3. **Phase 3**: Local safeguards (pre-commit hooks)
4. **Phase 4**: CI enforcement (automated guards)

### Dead-Code Detection

The system includes automated dead-code scanning to prevent accumulation of unused dependencies:

```bash
# Run dead-code scan
npm run lint:deadcode

# The scan checks for:
# - Unused npm dependencies
# - Unused imports in TypeScript/JavaScript files
# - Orphaned configuration files
```

**Note**: Dead-code scanning is automatically run during CI builds and can be triggered locally for faster feedback.

## 📁 Project Structure

```
avantVtt/
├── scripts/                 # Source code (TypeScript/JavaScript)
│   ├── avant.ts            # Main system entry point
│   ├── logic/              # Pure functions (business logic)
│   ├── services/           # Stateful services
│   ├── sheets/             # FoundryVTT sheet wrappers
│   └── types/              # TypeScript type definitions
├── styles/                 # SCSS source files
│   ├── avant.scss          # Main stylesheet
│   ├── themes/             # Theme configurations
│   └── components/         # Component styles
├── templates/              # Handlebars templates
├── lang/                   # Localization files
├── dist/                   # Build output (generated)
├── tests/                  # Test files
├── docs/                   # Documentation
├── deprecated/             # Deprecated code archive
└── changelogs/            # Change documentation
```

## 🎨 Styling Standards

### SCSS Development
- **Always edit `.scss` files**, never `.css` directly
- **Use the build process** to generate CSS from SCSS
- **Follow the component architecture** in `styles/components/`

```bash
# Build SCSS
npm run build:scss

# Watch SCSS changes
npm run watch-scss
```

### Theme System
- AvantVTT uses a single, optimized dark theme
- Theme variables are defined in `styles/themes/`
- Use CSS custom properties for dynamic theming

## 🧪 Testing Strategy

### Test Structure
```
tests/
├── unit/                   # Pure function tests
├── integration/            # FoundryVTT integration tests
├── mocks/                  # Test utilities and mocks
└── env/                    # Test environment setup
```

### Test Types
- **Unit Tests**: Test pure functions in isolation
- **Integration Tests**: Test FoundryVTT interactions
- **Coverage Requirements**: Maintain >65% overall coverage

### Writing Tests
```javascript
// Unit test example
import { calculateDamage } from '../../scripts/logic/combat-utils.js';

describe('calculateDamage', () => {
  test('should calculate basic damage correctly', () => {
    const result = calculateDamage(10, 3);
    expect(result).toBe(7);
  });
});
```

## 🔧 Troubleshooting

### Common Issues

#### **Build Failures**
```bash
# Clear build cache
npm run clean

# Rebuild from scratch
npm run build
```

#### **Test Failures**
```bash
# Run specific test file
npm test -- --testNamePattern="actor-sheet"

# Run with verbose output
npm test -- --verbose
```

#### **Lint Errors**
```bash
# Run linting
npm run lint

# Auto-fix linting issues
npm run lint -- --fix
```

#### **Deprecated Code Issues**
```bash
# Check for deprecated code violations
npm run guard:deprecated

# Review deprecation policy
cat docs/DEPRECATION_POLICY.md
```

### Getting Help

1. **Check the documentation** in `docs/`
2. **Review existing tests** for examples
3. **Check deprecation guidelines** in `docs/DEPRECATION_POLICY.md`
4. **Create an issue** using the appropriate template

## 📚 Additional Resources

- **[Deprecation Policy](DEPRECATION_POLICY.md)**: Complete deprecation process documentation
- **[Architecture Decision Records](adr/)**: Technical decision history
- **[Contributors Guide](CONTRIBUTORS.md)**: Contribution guidelines and processes
- **[Tag System](TAGS.md)**: Tag management and API documentation
- **[CLI Documentation](CLI_COMPENDIUM.md)**: Command-line interface reference

## 🎯 Development Principles

1. **Maintainability**: Write code that will be readable in 5+ years
2. **Testability**: Prefer pure functions over stateful classes
3. **Documentation**: Document the "why" not just the "what"
4. **Consistency**: Follow established patterns and conventions
5. **Performance**: Consider the impact on FoundryVTT's performance
6. **Backward Compatibility**: Maintain compatibility with existing worlds

---

**Last Updated**: 2025-01-17  
**Version**: 1.0.0  
**Maintainer**: AvantVTT Development Team 