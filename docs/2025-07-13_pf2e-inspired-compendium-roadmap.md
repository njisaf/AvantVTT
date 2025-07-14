# Avant Compendium Pipeline Roadmap

> **Audience**: LLM build agents  
> **Goal**: Minimal token plan for a robust JSON→LevelDB pack workflow.

---
## 1. Objective
Create an automated pipeline that takes human-readable JSON in `packs/` and produces Foundry-ready `.db` compendiums **with guaranteed stability and safety**.

Key requirements:
1. JSON is the *only* source of truth.  
2. Every document has a permanent 16-char `_id`.  
3. Categories & folder trees are preserved.  
4. Duplicate IDs, broken links, or schema errors abort the build.  
5. Two consecutive builds are byte-identical (`hash check`).

---
## 2. Minimal Schema
```jsonc
{
  "_id": "<required> 16-char string",
  "name": "<string>",
  "type": "trait | talent | augment | macro | ...",
  "category": "<string>",        // optional except for traits
  "system": { /* game data */ },
  "img": "path",
  // extra fields allowed by Foundry
}
```
*Folder metadata* lives in a companion file: `packs/<pack>/_folders.json` (array of folder objects with `_id`, `name`, `parent`).

---
## 3. Build Phases
| Phase                                                                                                            | Deliverable                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| A – ID & Category Guard                                                                                          | • CLI `compendium:check` validates JSON.                                                                                          |
| • `--fix` mode injects missing `_id` using `foundry.utils.randomID()` and infers `category` from directory name. |
| B – File Granularity                                                                                             | Migrate to **one JSON file per document** (script `split-pack.ts`). Loader must accept both monolith and split during transition. |
| C – Folder Support                                                                                               | Read `_folders.json`, validate IDs & parent refs, embed folder array in output pack.                                              |
| D – Link Rewrite                                                                                                 | Replace `@Compendium[avant.<pack>.<DocName>]` with `@UUID[...]`; fail on unknown refs.                                            |
| E – Extractor                                                                                                    | `compendium:extract` converts `.db` back to JSON; CI checks for round-trip diff = 0.                                              |
| Stretch                                                                                                          | Hot-reload packs during dev; cross-pack duplicate detection.                                                                      |

---
## 4. Success Criteria (CI gates)
• `npm run build` exits 0 and prints no warnings.  
• Linter: no JSON missing `_id`.  
• Duplicate `_id` (same pack) → fail.  
• Broken compendium links → fail.  
• `sha256` of `.db` files unchanged between two builds.  
• `compendium:extract` followed by diff shows no changes.

---
## 5. Immediate Tasks (for agents)
1. Implement Phase A validator + fixer in TypeScript (`scripts/compendium/validator.ts`).  
2. Add GitHub Action `compendium-check` (validator in dry-run mode).  
3. Back-fill missing `_id` in current JSON via `npm run compendium:fix`.  
4. Update developer docs & schema examples.

---
*End of document* 