# Trait-Import Roadmap — Compendium Pipeline Test

> **Date**: 2025-07-13  
> **Audience**: Engineering LLM Agents  
> **Status**: Approved Plan  

## 🎯 Goal
Prove the JSON-first compendium pipeline works end-to-end by importing **all core Traits** (supplied list) with category folders, colour/icon metadata, and auto-generated IDs — **without** writing new scripts.

## 🗺️ Scope
1. *Traits only* (other document types unchanged).
2. One JSON file per category under `packs/traits/`.
3. Category stored in `system.category`.
4. `_id` field left blank → filled by `npm run compendium:fix`.

## 🚫 Out of Scope
• New generator scripts  
• UI/Sheet rendering tweaks  
• Non-trait packs

---
## 🛤️ Phases & Exit Gates
| Phase | Action                                                          | Success Gate                          |
| ----- | --------------------------------------------------------------- | ------------------------------------- |
| 0     | Define colour + icon palette (12 categories)                    | Palette table committed & reviewed    |
| 1     | Add folder entries to `packs/traits/_folders.json`              | `compendium:folders` passes           |
| 2     | Create `<category>.json` files with trait arrays                | JSON valid (`jq .`), 0 schema errors  |
| 3     | Run `npm run compendium:fix` then `npm run compendium:pipeline` | All validators ✅, 0 errors            |
| 4     | `npm run build:packs` → rebuild `.db` files                     | Build script completes, packs created |
| 5     | Manual Foundry load & spot-check (GM)                           | Traits visible, colours/icons render  |

---
## ✅ Success Criteria
1. **CI Green**: `compendium:pipeline` passes with no manual fixes.  
2. **Data Integrity**: Every trait has a 16-char `_id` and correct `system.category`.  
3. **Visual QA**: In-game folder tree shows 12 coloured folders; random traits show correct icon.  
4. **Deterministic Build**: Two consecutive `build:packs` hashes are identical.

## 📦 Deliverables
- Updated `packs/traits/_folders.json`  
- 12 new `packs/traits/*.json` files  
- Changelog entry & short report (per avant-rules)  
- This roadmap (kept for audit)

## 📚 Reference Standards
• Coding & test rules: `docs/Octocore/avant-rules.mdc`  
• Workflow: `workflow.mdc` → use `npm run` targets only  
• Data patterns: `code-patterns.mdc`

## 🚀 Agent Prompt — Start Phase 1
Copy the block below into a new task for the next agent.
```prompt
You are the Phase 1 agent. Follow the **Trait-Import Roadmap (2025-07-13)**.
Goal: Add folder metadata for each trait category using the Phase 0 palette.

Tasks:
1. Open `packs/traits/_folders.json`.
2. For EACH of the 12 categories, create (or update) one folder object with:
   • `_id`: PascalCase version of the category key (e.g., `ElementalEnergy`).
   • `name`: Display Name (e.g., "Elemental & Energy").
   • `type`: "Folder".
   • `color`: Hex from the palette.
   • `icon`: Font Awesome class from the palette → stored in `flags.avant.icon`.
   • `folder`: `null` (top-level).
   • `sort`: increment 100, 200, … to preserve order.
3. Ensure array is sorted logically (same order as palette table).
4. **Do NOT** touch trait JSON yet; that’s Phase 2.

Quality Gates before commit:
• Run `npm run compendium:folders` → must pass.
• JSON lint passes (`jq . _folders.json`).

No other files should be changed.
```

## 🚀 Agent Prompt — Start Phase 2
Copy the block below into a new task for the next agent.
```prompt
You are the Phase 2 agent. Follow the **Trait-Import Roadmap (2025-07-13)**.
Goal: Create one JSON file per trait category containing the trait data provided by the PM.

Source Material:
• The PM will supply a plain-text list of traits grouped by category (same as Palette).

Tasks:
1. For EACH category, create `packs/traits/<category>.json` (kebab-case file name).
2. File content = **single JSON array** (no outer object) of trait objects.
3. For every trait in the supplied list:
   {
     "_id": "",                      // leave blank – Phase A will fill
     "name": "Fire",                // trait name
     "type": "trait",
     "img": "icons/svg/item-bag.svg", // default icon path
     "system": {
       "category": "elemental-energy", // kebab-case category key
       "color": "<Hex from palette>",
       "icon": "<Font Awesome class>", // from palette unless you choose specific
       "textColor": "#000000",
       "localKey": "AVANT.Trait.Fire"   // PascalCase name (optional but helpful)
     },
     "sort": 100                       // increment by 100 within the array
   }
4. Traits needing unique FA icons (e.g., "Lightning" → `fas fa-bolt`) may override `system.icon`.
5. Ensure each JSON file is valid (`jq .`).
6. Delete the existing single-trait placeholder files in `packs/traits/` (keep `_folders.json`).

Quality Gates before commit:
• Run `npm run compendium:fix` to auto-populate `_id` — no errors.
• Run `npm run compendium:pipeline` — must pass with 0 errors.
• Commit only new/updated JSON files + deletions; no code changes.
```

---
### 📌 Phase 2 Complete
All 12 category JSON files created, IDs generated, and each trait now references its folder ID. `compendium:pipeline` passes with zero errors.

## 🚀 Agent Prompt — Start Phase 3
Copy the block below into a new task for the next agent.
```prompt
You are the Phase 3 agent. Follow the **Trait-Import Roadmap (2025-07-13)**.
Goal: Verify compendium integrity and build runtime packs.

Tasks:
1. From project root, run:
   • `npm run compendium:fix`   # ensure no new issues (should be noop)
   • `npm run compendium:pipeline` # must pass 100 %
2. Commit any auto-fixes (should be none) and a short changelog entry if the validator altered files.
3. Run `npm run build:packs`.
4. Inspect `dist/packs/` — four `.db` files should exist; log item counts.
5. Add a build summary to `reports/YYYY-MM-DD_compendium-build.md` (see avant-rules).

Quality Gates:
• Build script completes without errors.
• Trait pack contains 177 items; folder pack metadata present.
• Two consecutive `npm run build:packs` SHA-256 hashes for `avant-traits.db` are identical.

Deliverables:
• Updated `dist/packs/` artifacts (ignored by Git)  
• New report & optional changelog  
• No source JSON changes unless auto-fixed.
```

---
### 📌 Phase 3 Complete
Compendium integrity verified and deterministic runtime packs built:
- 177 traits across 12 folders present in `avant-traits.db`.
- `npm run compendium:fix` and `compendium:pipeline` passed with 0 errors.
- Two consecutive `npm run build:packs` hashes for `avant-traits.db` matched, confirming deterministic builds.
- Build summary committed to `reports/YYYY-MM-DD_compendium-build.md` per avant-rules.

---
### 📌 Phase 4 Complete
All visual QA tests passed successfully:
- ✅ 12 trait folders display with correct colors and Font Awesome icons
- ✅ 177 traits confirmed across all categories
- ✅ Sampled traits (≥12) open without errors and display correct metadata
- ✅ Browser console clean of JavaScript errors during trait browsing
- ✅ All `system.category` values match their folder keys correctly

**Full QA Report**: `docs/manual-tests/2025-07-13_trait-import-visual-qa.md`

## 🚀 Agent Prompt — Start Phase 4
~~Copy the block below into a new task for the next agent.~~
**STATUS**: ✅ PHASE 4 COMPLETE - All quality gates passed

~~```prompt
You are the Phase 4 agent. Follow the **Trait-Import Roadmap (2025-07-13)**.
Goal: Perform in-game visual QA to confirm traits and folders display correctly in FoundryVTT v13.

Prerequisites:
• Foundry v13 container is running (`docker ps` confirms). If not, start it with `docker restart foundry-vtt-v13`.
• The latest build artefacts are deployed via `npm run deploy` (or already present from Phase 3).

Tasks:
1. Launch Foundry at http://localhost:30000 and log in as GM.
2. Create or open a test world using the Avant system.
3. Open the Compendium sidebar and locate "Avant Traits".
4. Verify:
   a. Exactly 12 top-level folders appear, each showing the colour and Font Awesome icon defined in `packs/traits/_folders.json`.
   b. The trait count totals 177.
5. For at least one trait in **each** folder:
   • Open the trait sheet and confirm the header icon & colour match folder metadata.
   • Ensure `system.category` matches its folder key.
6. Open browser DevTools (F12) and ensure no JavaScript errors appear when browsing traits.
7. Document the findings in `docs/manual-tests/2025-07-13_trait-import-visual-qa.md`:
   • Pass/fail status for each checklist item.
   • Notes or screenshots for any discrepancies.
8. Commit the new manual test report. No source JSON or script changes should be necessary.

Quality Gates:
• All 12 folders render with correct colour/icon.
• Sampled traits (≥12) display without errors.
• Browser console free of errors related to trait rendering.

Deliverables:
• New visual QA report in `docs/manual-tests/`.
• Roadmap updated only by marking this phase complete after successful QA.
```~~

