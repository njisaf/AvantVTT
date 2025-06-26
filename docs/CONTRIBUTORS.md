# Avant Contributor Guide

Welcome! If you're interested in contributing code to Avant, this guide will help you get started. Whether you're fixing bugs, adding features, or improving documentation, we're glad to have you.

---

## Table of Contents
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Build, Test, and Lint](#build-test-and-lint)
- [Commit & Deploy](#commit--deploy)
- [Further Reading](#further-reading)

---

## Project Structure
- **avantVtt/**: Main system source code (TypeScript, SCSS, templates, etc.)
- **dist/**: Built system (do not edit directly)
- **docs/**: Documentation (including this file)
- **tests/**: Unit and integration tests

See [README.md](../README.md) for installation and user instructions.

---

## Development Workflow
1. **Fork and clone** the repository.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Develop**: Make changes in TypeScript (`.ts`) and SCSS (`.scss`) source files only.
4. **Build**:
   ```bash
   npm run build
   ```
5. **Test**:
   ```bash
   npm test
   ```
6. **Lint**:
   ```bash
   npm run lint-scss
   ```
7. **Commit** your changes and open a pull request.

For more details, see [docs/CLI_COMPENDIUM.md](CLI_COMPENDIUM.md).

---

## Code Standards
- **TypeScript-first**: All logic in `.ts` files, strict mode enabled.
- **SCSS-first**: All styling in `.scss` files. Never edit `.css` directly.
- **Functional-first**: Prefer pure functions and minimal coupling.
- **TDD**: Write tests for new features and bugfixes.
- **Documentation**: Use JSDoc for all public functions.

See [docs/TAGS.md](TAGS.md) and [docs/THEMES.md](THEMES.md) for domain-specific standards.

---

## Build, Test, and Lint
- **Build**: `npm run build` (compiles TypeScript and SCSS, outputs to `dist/`)
- **Test**: `npm test` (runs all unit and integration tests)
- **Lint SCSS**: `npm run lint-scss` (checks SCSS code style)
- **Watch**: `npm run dev` (auto-recompiles on changes)

See [README.md](../README.md) for more on the build process.

---

## Commit & Deploy
- **Commit**: Follow clear, descriptive commit messages. Commit both SCSS and generated CSS together.
- **Do not commit**: Built `dist/` files (except in release tags).
- **Deploy**: Use the ChatOps workflow for deployment (see [CHATOPS.md](CHATOPS.md)).
- **Testing**: Always test your changes in a local FoundryVTT instance before submitting a PR.

---

## Further Reading
- [CLI Compendium Reference](CLI_COMPENDIUM.md)
- [Tag System Documentation](TAGS.md)
- [Theme System Documentation](THEMES.md)
- [Compendium Framework Release Notes](../_releases/0.2.2/0.2.2_COMPENDIUM_FRAMEWORK_RELEASE_NOTES.md)
- [Changelogs](../changelogs/)

For any questions, see the main [README.md](../README.md) or open an issue on GitHub. 