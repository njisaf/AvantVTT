# Unified Actions Tab – Roadmap & Technical Specification

**Document Date:** 2025-07-17  
**Author:** Avant VTT Core Team  
**System Version Target:** v2.2.0 (Foundry v13+)

---

## 1 · Purpose
This document defines the *why*, *what*, and *how* for replacing the existing “Combat” tab and expanding the current “Actions” tab into a single **Unified Actions Tab**.  It will be handed off to multiple engineering pods (Frontend, Data-Model, QA), so it contains the full scope, phased roadmap, acceptance criteria, and guard-rails required to deliver the feature without regressions.

> **High-Level Goal**  
> • Keep the **Gear** tab exactly as-is for inventory management.  
> • When a player adds a **Weapon**, **Armor**, or **Equipment** item to the Gear tab, a **linked Action item** is auto-created (or updated) in the Actions tab describing that item’s rollable behaviour (Attack / Damage / Defend / Use).  
> • Remove the legacy *Combat* tab entirely; the Actions tab becomes the one-stop shop for **all** rollable actions, whether sourced from gear or dragged from an **Actions compendium**.  
> • Future phases will allow dragging standalone **Action** items (e.g. maneuvers, stances) just like Talents & Augments.

---

## 2 · Glossary
| Term                | Definition                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| **Combined Action** | A display-only wrapper that exposes an Item (weapon, armor, gear, action) inside the unified list. |
| **Source Item**     | The original Item document that owns the actionable data.                                          |
| **Dispatcher**      | Pure function that routes a button click to the correct roll helper based on `source`.             |
| **Drop-Zone**       | HTML region inside the Actions tab that accepts item drag-drops.                                   |

---

## 3 · Functional Requirements
1. **Unified Actions Tab**  
   1.1. Actions tab must show: (a) auto-generated **Gear Actions** (sourced from Weapon/Armor/Equipment) **and** (b) standalone **Action items** dragged in from compendia.  
   1.2. Gear-derived actions display type-specific buttons:  
        • Weapons → *Attack* (+ optional *Damage*)  
        • Armor   → *Defend* (gates to `prepareArmorRoll`)  
        • Gear    → default *Use* (no mandatory roll)  
2. **Automated Mirroring**  
   2.1. Creating a Weapon/Armor/Gear item **in Gear tab or via drag-drop** auto-creates a *linked* Action item (`type="action"`, flag `sourceItemUuid`).  
   2.2. Updating the source item (e.g. rename Longsword → Greatsword, change damage die) propagates to the linked action on next sheet render.  
   2.3. Deleting the source item removes the linked action.  
3. **Drag-and-Drop Compendium Support** – Users can drag a standalone *Action* item from the Actions compendium directly into the Actions tab (same UX as Talents & Augments).
4. **Tab & Template Changes** – Remove all traces of `data-tab="combat"`; the **Actions tab is moved into the former Combat position (second tab in the nav)** so users keep muscle-memory navigation. The Gear tab stays untouched.  
5. **Backwards Compatibility** – Existing macros (`rollAttack`, `rollDamage`, `rollArmor`) still work by delegating through the new dispatcher.

---

## 4 · Non-Functional Requirements
* **Performance:** Combined tab render ≤ 1 ms on average (matches existing budget).  
* **Accessibility:** 100 % keyboard navigable; first focusable element is the first action card.  
* **Theming:** Inherits current SCSS variables; no inline styles.  
* **i18n:** All new labels under `AVANT.Actions.*` keys in `lang/en.json`.

---

## 5 · Success Criteria (Definition of Done)
| Area              | Metric                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| Unit Tests        | ≥ 90 % coverage for new pure functions (`combineActionSources`, `rollCombinedAction`).             |
| Integration Tests | Sheet opens → combined list populated; clicking each button emits correct Foundry `Roll` instance. |
| Manual QA         | Smoke test checklist passes on Chrome & Firefox (v13 world).                                       |
| Performance       | No measurable FPS drop & render cost ≤ budget.                                                     |
| Documentation     | This doc + changelog + updated style-guide snapshot.                                               |

---

## 6 · Architecture & Data Model Impact
### 6.1 Logic Layer
* **New Helper:** `linkGearItemToAction(sourceItem: Item): Promise<Item>` – creates/updates Action item, sets flag `flags.avant.sourceItemUuid`, returns the action document.  
* **Dispatcher:** `rollCombinedAction(action)` routes to correct roll helper by `action.flags.avant.sourceType` (`weapon│armor│gear│action`).  
* **Hook Handlers (foundry side):**  
  ```ts
  Hooks.on('createItem', (item, data, actor) => { if(isGearActionSource(item)) linkGearItemToAction(item); });
  Hooks.on('updateItem', (item) => { if(hasLinkedAction(item)) updateLinkedAction(item); });
  Hooks.on('deleteItem', (item) => { removeLinkedAction(item); });
  ```

### 6.2 Sheet Layer (`scripts/sheets/actor-sheet.ts`)
* Extend `_prepareContext` → calculate `items.combinedAction` via new helper.  
* Register ApplicationV2 actions: `rollCombinedAction`, `dropAction`.

### 6.3 Template Layer
* Gear tab remains **unchanged**.  
* **Re-order nav bar**: update `shared/tabs.hbs` so the Actions `<a>` anchor is the second item (immediately after Core), preserving visual order after the Combat tab’s removal.  
* In Actions tab partial:  
  * Show **gear-derived** actions first (grouped “Gear Actions”), then standalone Action items.

### 6.4 Styles
* No CSS edits; create `_actions.scss` partial if new styling needed, compile via SCSS-first flow.

---

## 7 · Implementation Roadmap
| Phase                 | Owner(s)      | Scope                                          | Key Deliverables              |
| --------------------- | ------------- | ---------------------------------------------- | ----------------------------- |
| **0  Audit**          | QA            | Baseline capture, fixture world                | Test fixture, regression list |
| **1  Utilities**      | Core Logic    | `combineActionSources`, dispatcher, unit tests | PR #1                         |
| **2  Sheet Context**  | Sheet Team    | `_prepareContext` update, actions registration | PR #2                         |
| **3  Template**       | Frontend / UX | Tab removal, new partial, drop-zone            | PR #3                         |
| **4  Event Handlers** | Sheet Team    | `dropAction`, delegate to dispatcher           | PR #4                         |
| **5  Testing**        | QA + Dev      | Integration tests, perf bench                  | PR #5                         |
| **6  Docs & Cleanup** | Docs Guild    | Changelog, style-guide, remove dead code       | PR #6                         |
| **7  Deploy**         | DevOps        | `npm run deploy` to staging, user acceptance   | Release v2.2.0                |

Each PR merges sequentially; CI gates must pass per workspace rules.

---

## 8 · Testing Strategy
1. **Unit (Jest):** Pure helpers – data-only tests.  
2. Manual testing. Prompt human for feedback. 

---

## 9 · Risk Register
| Risk                                                | Impact                       | Mitigation                                    |
| --------------------------------------------------- | ---------------------------- | --------------------------------------------- |
| Forgotten external reference to `data-tab="combat"` | Broken links, console errors | Phase 0 exhaustive grep + lint rule           |
| Large actors (> 50 items) slow render               | UX lag                       | Virtualise list later; monitor perf logs      |
| Macro Back-Compat Breakage                          | Community scripts fail       | Keep legacy handlers; add deprecation warning |

---

## 10 · Open Questions / Parking Lot
* Should Gear items with **no** actionable rules still appear?  
* Collapse sub-groups visually (🗡 Weapons, 🛡 Armor) – yay or nay?  
* Future bulk-batch PP/AP cost UI?

---

## 11 · Appendices
### A. Sample CombinedAction JSON
```json
{
  "id": "abc123",
  "name": "Longsword",
  "source": "weapon",
  "buttons": ["attack", "damage"],
  "system": {
    "damageDie": "1d8",
    "apCost": 1,
    "threshold": 2
  }
}
```

### B. Reference Rules & Standards
* Workspace SCSS-first, TDD, changelog policies (see `.cursor/rules/*`).
* Performance & A11Y budgets (UX patterns doc).

---

*End of Document* 