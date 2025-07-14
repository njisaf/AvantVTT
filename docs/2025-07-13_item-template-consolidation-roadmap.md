# Item Template Consolidation & Cleanup Roadmap

**Date:** 2025-07-13  
**Authors:** Avant VTT Core Engineering  
**Status:** Draft (ready for review)

---

## 🎯 Objective
Eliminate the redundant per-item templates under `templates/item/` (e.g. `item-talent-new.html`, `item-weapon-new.html`, …) and migrate **all** item sheets to the single universal template `templates/item-sheet.html`.  The system must retain **identical user-facing functionality** across Foundry VTT v13.

---

## 📦 Scope
1. **Templates** – remove the eight `item-*-new.html` files and any unused partials they reference.
2. **Runtime Code** – delete dynamic template-selection logic (`get parts()` in `scripts/sheets/item-sheet.ts`) plus any helper code that exists solely to support per-type templates.
3. **Styles** – drop SCSS/CSS selectors that only style those templates.
4. **Tests** – update or remove tests referencing per-type templates; ensure coverage remains ≥ current baseline.
5. **CI / Scripts** – clean template-loading arrays in `initialization-manager.ts`, `assert-no-legacy-templates.js`, etc.
6. **Documentation** – update docs to reference the universal template only.

Out of scope: functional enhancements, visual redesigns, or data-model changes.

---

## 🛣️ Phased Plan

| Phase                            | Goal                                                      | Key Tasks                                                                                                                                                                                                                                                | Exit Criteria                                                                               |
| -------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **0 · Discovery**                | Confirm no hidden runtime references                      | • Enable verbose render logging and verify `item-sheet.html` is the only template rendered.<br>• grep for `/item\-.*\-new\.html` across `dist/` at runtime.                                                                                              | Written audit report proves zero production dependency.                                     |
| **1 · Feature Parity Hardening** | Ensure universal template supports every item-type nuance | • List every per-type field/component.<br>• Add missing block helpers / conditional sections to `item-sheet.html`.<br>• Extend pure-logic utils & schema validators where needed.<br>• Add integration tests per item-type using the universal template. | All item-types render & save correctly with `item-sheet.html` behind a runtime flag.        |
| **2 · Flagged Roll-out**         | Toggle switch to universal template                       | • Introduce game-setting `avant.useUniversalItemSheet` (default *off*).<br>• Replace dynamic `get parts()` with **static** `PARTS` pointing to `item-sheet.html` when flag is *on*.<br>• Provide macro/GM-setting to flip flag.                          | QA confirms no regressions with flag on.                                                    |
| **3 · Deprecation Warning**      | Notify developers & modules                               | • Emit console `warn` if flag is *off*.<br>• Changelog entry + docs update.                                                                                                                                                                              | Flag remains *on* in staging environments for ≥ one sprint.                                 |
| **4 · Hard Switch**              | Remove per-type templates from runtime                    | • Delete `templates/item/item-*-new.html`.<br>• Purge paths from `initialization-manager.ts`.<br>• Delete `get parts()`; keep only `static PARTS` (universal).                                                                                           | CI passes, build size reduced.                                                              |
| **5 · Code & Style Cleanup**     | Remove dead code & styles                                 | • Delete SCSS partials and selectors used exclusively by old templates.<br>• Remove unit tests that mocked dynamic templates.<br>• Drop debug utilities referencing `.parts`.                                                                            | `npm run lint && npm test && npm run build` succeed with 0 warnings.<br>Coverage unchanged. |
| **6 · Final Validation**         | Regression & performance test                             | • Manual smoke test on v13 container.<br>• Run integration + e2e suites.<br>• Validate theme manager still applies correctly.                                                                                                                            | Acceptance sign-off from QA.                                                                |
| **7 · Cleanup & Release**        | Merge & document                                          | • Delete feature flag.<br>• Final changelog (`BREAKING CHANGE: per-type templates removed`).<br>• Bump system minor version.                                                                                                                             | Tag & release `vX.Y+1`.                                                                     |

---

## ✅ Success Criteria
• **Functional parity** – every item-type creates, edits, and renders exactly as before.
• **Performance** – initial template loading reduced (fewer HTML files). No render slowdown.
• **Clean build** – no references to removed templates in source, dist, or tests.
• **Coverage** – ≥ current global coverage percentage.
• **Documentation** – docs, ADRs, and changelogs updated.

---

## 🛡️ Standards & Practices Reminder
1. **TDD** – write failing unit/integration tests *before* removing a template; keep green bar.
2. **SCSS-first** – delete CSS only after its SCSS source is removed; run `npm run build` every step.
3. **Functional-first** – template logic goes into pure helpers in `scripts/logic/` with tests.
4. **Changelog** – every phase that hits `main` must add a file under `changelogs/` and `_sprints/`.
5. **CI Gates** – `npm run lint && npm run build:ts && npm test` must pass; coverage must not drop.
6. **Version bump** – bump `system.json` after Phase 7.

---

## 📋 Task Owner Matrix (RACI)
| Role          | Discovery | Hardening | Flagged Roll-out | Removal | Cleanup |
| ------------- | --------- | --------- | ---------------- | ------- | ------- |
| Lead Engineer | A         | A         | R                | A       | A       |
| QA            | C         | I         | A                | R       | A       |
| Docs          | I         | A         | A                | A       | R       |
| Dev Ops       | I         | I         | A                | C       | C       |

*(A = Accountable, R = Responsible, C = Consulted, I = Informed)*

---

## 🗂️ References
• `.cursor/rules/code-patterns.mdc` – functional-first guidelines  
• `.cursor/rules/workflow.mdc` – build & deploy workflow  
• ADR-0009 – base item sheet architecture  

---

### Next Step
Kick off **Phase 0: Discovery** by assigning an engineer to run the runtime audit script and produce the dependency report (see tasks list inside Phase 0). 