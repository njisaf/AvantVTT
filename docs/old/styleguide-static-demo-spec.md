# Avant VTT – Static Style-Guide Generator (Option 1)

*Version 0.1 – 2025-07-16*

---

## 1  Purpose
Provide non-technical designers and external collaborators with a **self-contained folder** of HTML + compiled CSS that renders key Avant VTT UI screens (Actor Sheet, Item Sheet, etc.) in any browser **without** Foundry VTT or Node. This eliminates the need for local development environments while enabling rapid visual iteration on styles.

## 2  Goals
1. Generate `styleguide/` containing:
   • `index.html` (navigation page)
   • One HTML snapshot for each major template (actor, item, chat, …)
   • `styles/avant.css` (compiled, readable, source-mapped)
2. Ship the folder automatically every time we run `npm run build` or `npm run deploy`.
3. Keep the process **read-only** for designers; they edit only CSS and hand changes back.
4. Require **zero additional tooling** for designers (no Node, no Foundry, no npm).

## 3  Non-Goals
• Full component library (Storybook) – deferred.  
• Dynamic behaviour (rolls, tabs) – optional; static markup is sufficient.  
• Round-trip conversion from edited CSS back to SCSS – handled manually by engineers.

## 4  Assumptions
• Our existing SCSS-first workflow remains authoritative.  
• Engineers have Node ≥16, bash.  
• Designers can open local HTML files in modern browsers.

## 5  Deliverables
| ID  | Deliverable                                                                            | Owner          | Due Date  |
| --- | -------------------------------------------------------------------------------------- | -------------- | --------- |
| D0  | SCSS modularisation & tokenisation refactor (new sandbox partials; old SCSS retained)  | Engineering    | T+5 days  |
| D1  | `scripts/build-styleguide.js` Node script                                              | Engineering    | T+1 week  |
| D2  | `styleguide/` folder generated during build                                            | Build Pipeline | —         |
| D3  | Updated `package.json` with `build:styleguide`                                         | Engineering    | T+1 week  |
| D4  | On-boarding README for designers (`styleguide/README.md`)                              | Tech Writer    | T+2 weeks |
| D5  | Acceptance test (`tests/integration/styleguide.int.test.js`) verifying folder contents | QA             | T+2 weeks |
| D6  | Manual Testing Guide (`docs/manual-testing-styleguide.md`)                             | QA             | T+2 weeks |

## 6  Technical Specification
### 6.1 Directory Structure (after build)
```
styleguide/
├── index.html              # Landing page with links
├── actor-sheet.html        # Snapshot of `templates/actor-sheet.html`
├── item-sheet.html         # Snapshot of `templates/item-sheet.html`
├── … (additional templates as needed)
└── styles/
    └── avant.css           # Compiled CSS (expanded, source-mapped)
```

### 6.2 Build Script (`scripts/build-styleguide.js`)
1. **Compile SCSS** (already done by `build:scss:dist`) → `dist/styles/avant.css`.
2. **Copy CSS** into `styleguide/styles/` (create dirs as needed).
3. **Copy + sanitise HTML templates**:
   * Read each `.html`/`.hbs` template path from a config array.
   * Strip Handlebars tags via simple regex `{{[^}]+}}` → `—`.
   * Write to corresponding file in `styleguide/`.
4. **Generate `index.html`** with links to each snapshot.
5. **Log** success (`console.log('✅ Styleguide built → styleguide/')`).

### 6.3 Package.json Integration
```jsonc
{
  "scripts": {
    // … existing scripts …
    "build:styleguide": "node scripts/build-styleguide.js",
    "build": "npm run clean:dist && npm run build:scss:dist && npm run build:ts && npm run build:packs && npm run build:assets && npm run ci:validate && npm run validate:partials && npm run validate:templates && npm run sounds:validate && npm run build:styleguide"
  }
}
```
*The style-guide step runs at the very end to guarantee compiled CSS is available.*

### 6.4 Template Coverage (Phase 1)
| Template             | File                              | Included?    |
| -------------------- | --------------------------------- | ------------ |
| Actor Sheet          | `templates/actor-sheet.html`      | ✅            |
| Item Sheet           | `templates/item-sheet.html`       | ✅            |
| Chat Message (basic) | `templates/chat/message.html`     | 🅾️ (optional) |
| Trait Partials       | `templates/shared/partials/*.hbs` | 🅾️            |
*Phase 2 may expand coverage based on designer feedback.*

### 6.5 Testing
* **Integration test** ensures that after `npm run build`, the following hold true:
  1. `styleguide/styles/avant.css` exists and > 10 KB.
  2. `index.html` contains links to all snapshot pages.
  3. Snapshot HTML files contain **no Handlebars tokens** (`{{`).

## 7  Roadmap & Milestones
| Phase                     | Duration    | Key Tasks                                                                             | Exit Criteria                                             |
| ------------------------- | ----------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 0 – Kick-off              | 1 day       | Assign owners, create branch `styleguide-option1`                                     | Confluence page & Jira tickets created                    |
| 1 – SCSS Refactor         | 5 days      | Modularise SCSS, introduce tokens, generate sandbox build; keep legacy SCSS as backup | `npm run build` passes; visual diff matches current build |
| 2 – Style-Guide MVP Build | 5 days      | Implement script, integrate into build, generate actor/item sheets                    | Build passes, folder opens in browser                     |
| 3 – Manual Testing Pause  | 2 days      | Execute steps in `manual-testing-styleguide.md`, capture findings                     | All critical issues resolved or ticketed                  |
| 4 – Designer Handoff      | 1 day       | Zip `styleguide/` output, send along with README                                      | Designer acknowledges receipt                             |
| 5 – Template Expansion    | *as needed* | Add more templates, handle partials                                                   | Additional snapshots render correctly                     |
| 6 – Enhancements          | *future*    | Pretty index, dark/light toggle, bundle JS for interactivity                          | Out of scope for initial release                          |

## 7a  SCSS Refactor – Detailed Objectives

**Why are we doing this?**  Our current `avant.scss` has grown organically; selectors for multiple components are mixed together, and design tokens (colours, spacing, fonts) are sometimes hard-coded.  This makes external collaboration and long-term maintenance difficult.  A modest restructure will provide a **stable, inspectable foundation** for the static style-guide and future Storybook adoption without altering any live visuals.

### Scope
1. **No visual changes** — the compiled CSS delivered to Foundry must render *identically*.  Automated screenshot regression tests will verify this.
2. **Tokenisation** — every colour, font, spacing unit, border radius, and z-index used in production must originate from `_utilities/_variables.scss` (or a future Design Token file).  **Zero hex values** are allowed elsewhere.
3. **One-partial-per-component rule** — each UI slice (e.g., `Actor Sheet`, `Item Sheet`, `Tabs`, `Buttons`, `Forms`) must live in its own partial under `styles/components/` or `styles/utilities/`.
4. **Explicit import order** — create a `styles/avant-sandbox.scss` that imports variables → mixins → utilities → components in deterministic order.  (Legacy `avant.scss` stays untouched for now.)
5. **Source maps mandatory** — `npm run build` must continue to emit an *expanded* CSS + map to aid diffing.
6. **Linter compliance** — pass `npm run lint-scss` with zero new warnings; nesting depth ≤3.

### Deliverables (expands on D0)
| ID   | Artifact                                                               | Notes                                                                                  |
| ---- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| D0.1 | `styles/avant-sandbox.scss`                                            | New entry point; compiles to `dist/styles/avant-sandbox.css`                           |
| D0.2 | **Legacy `styles/avant.scss` retained unchanged**                      | Acts as reference and quick rollback target                                            |
| D0.3 | Refactored partials under `styles/components/` and `styles/utilities/` | One per component; uses tokens                                                         |
| D0.4 | Dual-compile support in build script                                   | `npm run build` emits **both** `avant.css` (legacy) and `avant-sandbox.css` (refactor) |
| D0.5 | Quick-toggle helper (`scripts/toggle-stylesheet.js`)                   | Injects sandbox CSS at runtime for instant A/B in Foundry                              |
| D0.6 | `scripts/visual-regression.sh`                                         | Runs headless Chrome + pixelmatch to compare before/after screenshots                  |
| D0.7 | Documentation update in `styles/README.md`                             | Explains architecture, naming, how to add new tokens                                   |

### Runtime Testing Strategy
1. **Default remains legacy CSS.** Foundry loads `avant.css` as it does today.
2. A developer macro or `scripts/toggle-stylesheet.js` can be executed in the Foundry console:
```js
// 👉 Swap to sandbox CSS
document.getElementById('avant-stylesheet').href = 'systems/avant/styles/avant-sandbox.css';
```
   • Running the macro again reverts to legacy by switching the `href` back.
3. CI & visual-regression scripts always test **both** stylesheets to guarantee parity.

### Success Metrics
1. **Visual parity:** pixel diff < 0.5 % across Actor Sheet + Item Sheet baseline screenshots.
2. **Selector uniqueness:** running `stylelint --reportNeedlessDisables` shows no duplicate selectors across partials.
3. **Token coverage:** `grep -E "#[0-9a-fA-F]{3,6}" styles/components | wc -l` → **0**.
4. **Build health:** total build time increase ≤ 0.5 s; CSS output size change ≤ +2 %. 
5. **CI green:** all existing Jest/int tests + new visual tests pass.

### Out of Scope
* Converting designer CSS overrides back into SCSS (handled manually post-refactor).
* Dark-mode variables (will be handled in Phase 5 – Enhancements).

---

## 8  Risks & Mitigations
| Risk                                            | Impact | Mitigation                                                              |
| ----------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| Template drift → out-of-date snapshots          | Medium | Script regenerates on every build; designers use latest build artifact. |
| Regex stripping breaks complex Handlebars logic | Low    | Acceptable for visual design; fall back to manual replacing if needed.  |
| Large CSS size > 500 KB                         | Low    | Covered by existing SCSS standards.                                     |

## 9  Acceptance Criteria
1. Running `npm run build` on a clean checkout produces a `styleguide/` folder as described.  
2. Opening `styleguide/index.html` in Chrome/Edge/Firefox ≥ v100 shows the linked pages with correct styling.  
3. Style-guide generation does **not** slow the build by more than 1 second on CI.  
4. All existing tests continue to pass.

---
*Document owner:* **@tech-lead-frontend**  
*Last updated:* 2025-07-16 