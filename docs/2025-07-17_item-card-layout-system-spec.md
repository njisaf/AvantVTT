# Item Card Declarative Layout System – Specification & Roadmap

**Version**: 0.1.0 (Initial Draft)  
**Date**: 2025-07-17  
**Author**: Avant Engineering Team  
**Audience**: Avant Engineering Agents & Core Maintainers

---

## 1 · Executive Summary

We will extend the existing **Declarative Layout System** (located under `scripts/layout/`) so that the miniature “item cards” rendered inside an **Actor Sheet** are driven by the same DSL that powers full-screen Item Sheets. The new subsystem—hereafter **Item Card Layout System (ICLS)**—will introduce a lightweight *card layer* that wraps DSL fields into a three-zone grid: **Left (rollable)** · **Centre (layout-driven)** · **Right (controls)**.

This document defines the *requirements*, *success outcomes*, *technical specification*, *integration plan*, and *delivery roadmap* for ICLS. It also re-states the mandatory coding & workflow standards that govern implementation.

---

## 2 · Background & Motivation

1. **Existing Sheet DSL** – The current Declarative Layout System ("DLS") lives in `scripts/layout/`. It provides:
   - Type-safe *DSL helpers* (`field`, `when`, `sideBy`, `fullWidth`, `filterFields`).
   - Item-type specific layout modules under `scripts/layout/item-types/`.
   - A pure-function architecture that enables unit tests and code reuse.

2. **Problem** – Actor Sheets still render item cards (Augments, Talents, Weapons, etc.) using hand-rolled HTML + jQuery. This results in:
   - Redundant markup & styling per item type.
   - Divergent UX patterns and missing roll / control consistency.
   - Higher maintenance cost when adding new item properties.

3. **Opportunity** – By re-using DLS for cards we:
   - Achieve 1:1 visual/token parity between sheets and cards.
   - Cut boilerplate and enable rapid item-type iteration.
   - Enforce uniform ARIA, keyboard, and styling rules automatically.

---

## 3 · Scope

### 3.1 In-Scope

| Area                         | Detail                                                      |
| ---------------------------- | ----------------------------------------------------------- |
| **Card DSL Layer**           | `scripts/layout-card/` with helpers & type definitions.     |
| **Handlebars Partial**       | `templates/partials/item-card.hbs` – generic 3-column grid. |
| **SCSS Module**              | `styles/components/_item-cards.scss` – responsive rules.    |
| **ActorSheet Integration**   | Modify sheet renderer to use new card engine.               |
| **PoC Item Types**           | *Augment* & *Talent* converted first.                       |
| **Unit + Integration Tests** | Ensure new helpers & rendering pass CI.                     |
| **Documentation**            | Update LAYOUT.md + add usage docs.                          |

### 3.2 Out-of-Scope

* Full migration of every legacy item type (will occur incrementally post-PoC).
* Visual theme re-designs (handled by separate UX initiative).
* FoundryVTT version < v13 compatibility.

---

## 4 · Functional Requirements

### 4.1 Card Grid

1. **Three Zones**  
   `grid-template-columns: auto 1fr auto;`
   - **Left**: roll button(s) + optional icons.  
   - **Centre**: DSL-driven dynamic fields.  
   - **Right**: edit / delete / drag handles.
2. **Responsive**  
   ≤ 480 px viewport → stack centre below (2-row fallback).
3. **ARIA & Keyboard**  
   Tab order follows visual flow; buttons labelled via `aria-label`.

### 4.2 Card DSL Helpers

| Helper                                 | Purpose                                                                                                  |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `cardLayout(centerFields, {rollable})` | Returns `{ left, center, right }` arrays of **Field** objects with auto-injected roll + control buttons. |
| `getCardLayout(item)`                  | Registry resolver; maps `item.type` → layout module.                                                     |

All helpers are pure functions and live in `scripts/layout-card/helpers.ts`.

### 4.3 Field Re-use

* Cards reuse the existing **Field** interface from DLS → zero duplication.
* New *pseudo-field types* (`roll-button`, `icon-button`) will be added and rendered by the existing `render-field` partial.

### 4.4 Templates & Styling

* **Handlebars** partial renders each zone iterating over its field array.  
* **SCSS** file follows *SCSS-first* rules (see workspace standards).  
* `avant.css` is re-built via `npm run build:scss`.

### 4.5 Actor Sheet API Changes

* Replace legacy `.item .roll` click handlers with delegation to `roll-button` field definitions.  
* Provide backward-compat shim during transition.

### 4.6 Functional Parity Guarantee

* **No Business-Logic Drift** – ICLS must **not** alter any data calculations, formulas, or document updates currently executed by item cards. The new engine is **presentation-only**.
* **Field Fidelity** – Every field rendered today (labels, values, tooltips, i18n keys) must appear in the new card with identical data bindings.
* **Action Equivalence** – Roll, edit, delete, drag-drop, and any item-specific context actions must behave exactly as they do in the legacy implementation.
* **Visual Parity (Baseline)** – While minor CSS tweaks are acceptable, the overall look & feel should match 1:1 at standard zoom (±2 px tolerance on spacing). Any unavoidable deviation must be documented.

---

## 5 · Non-Functional Requirements

| Category                 | Requirement                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| **Performance**          | Card render ≤ 0.5 ms each; sheet refresh ≤ 16 ms (60 FPS).       |
| **Test Coverage**        | ≥ 90 % unit for helpers; ≥ 70 % integration for sheet rendering. |
| **Accessibility**        | WCAG 2.1 AA keyboard operability; ARIA labels on controls.       |
| **Internationalisation** | All visible strings use `game.i18n.localize`.                    |
| **Security**             | GM-only actions gated via `game.user.isGM`.                      |

---

## 6 · Integration Plan

1. **Folder Scaffolding**  
   ```bash
   mkdir -p scripts/layout-card/item-types
   touch scripts/layout-card/{helpers.ts,types.ts,index.ts}
   touch templates/partials/item-card.hbs
   touch styles/components/_item-cards.scss
   ```
2. **Helpers & Types** – Implement `cardLayout`, `CardSection`, etc.
3. **Template** – Build generic grid; reuse `render-field` partial.
4. **SCSS** – Add grid layout + mobile media query; compile.
5. **ActorSheet Update** –
   * Import `getCardLayout`.
   * Render cards via template loop.
   * Remove old HTML generation.
6. **PoC Migration** – Convert *Augment* and *Talent* card modules.
7. **Testing** –
   * Unit: helpers produce expected arrays.  
   * Integration: Jest + @testing-library validate rendered HTML structure.  
   * Snapshot tests for card HTML.
8. **QA Pass** – Manual check inside Foundry (v13) world.
9. **Rollout** – Enable feature flag `avant.cardLayoutV1` → default **off** for initial release; flip to **on** after feedback.

---

## 7 · Roadmap & Milestones

| Phase                    | Target Date | Deliverables                                                     |
| ------------------------ | ----------- | ---------------------------------------------------------------- |
| **0 – Spec**             | 2025-07-17  | This document approved.                                          |
| **1 – Scaffolding**      | +2 d        | Folder structure, helpers stubs, empty template + SCSS skeleton. |
| **2 – PoC**              | +5 d        | Augment & Talent card modules rendering visually correct.        |
| **3 – Integration**      | +7 d        | ActorSheet switched, regression tests pass.                      |
| **4 – Migration Wave-1** | +10 d       | Convert Weapons, Armour, Gear.                                   |
| **5 – Migration Wave-2** | +14 d       | Remaining item types converted; legacy code removed.             |
| **6 – Hard Launch**      | +16 d       | Feature flag removed; doc updates; changelog entry.              |

Timeline assumes 20 % buffer for review cycles.

---

## 8 · Success Criteria

* **Functional** – All item cards render via ICLS with identical or improved UX compared to legacy.
* **Performance** – No measurable FPS drop; sheet open time unchanged (±5 %).
* **Quality** – Test suite green; coverage thresholds met or exceeded.
* **Maintainability** – ≥ 75 % shared code reuse between sheet & card DSL.
* **Developer DX** – New item type cards can be implemented by adding <40 loc.
* **Parity** – Visual + functional parity with legacy cards confirmed via side-by-side QA checklist; no regression in dice formulas or item updates.

---

## 9 · Coding & Workflow Standards Reminder

* **Functional-First Design** & **TDD** – follow `Octocore/avant-rules` & `code-patterns.mdc`.
* **TypeScript Strict** – new files use `.ts`, pass `tsc --strict`.
* **SCSS-First Styling** – edit SCSS, never CSS; run `npm run build`.
* **Pre-commit Hooks** – lint, type-check, unit + integration tests must pass.
* **Documentation** – All public helpers require JSDoc in *plain English*.
* **Changelog** – Add entry in `/changelogs/` and `_sprints/` after each phase.

---

## 10 · Risks & Mitigations

| Risk                                    | Impact                   | Mitigation                                                     |
| --------------------------------------- | ------------------------ | -------------------------------------------------------------- |
| Grid CSS clashes with legacy styles     | Visual regressions       | Namespace `.item-card` class; add unit tests per viewport.     |
| ActorSheet hooks rely on old DOM        | Broken roll/edit actions | Provide interim data-action attributes; remove post-migration. |
| Performance degradation on large actors | Slow UI                  | Profile early; memoise `getCardLayout`; virtualise if needed.  |
| Developer learning curve                | Slower adoption          | Provide code examples & pairing sessions.                      |

---

## 11 · Appendices

### A · Current Layout System Reference
* See `scripts/layout/LAYOUT.md` for architecture, helpers, and examples.
* Common field list documented under *Common Fields* section.

### B · Glossary
* **DLS** – Declarative Layout System (existing).
* **ICLS** – Item Card Layout System (this proposal).
* **Field** – Plain object describing an input or static text.

---

> *“Great software feels cohesive because its smallest parts share the same design DNA. ICLS gives our Actor Sheets that DNA.”* 