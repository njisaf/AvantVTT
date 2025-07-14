# JSON-Based Compendium Architecture Roadmap

## 1. Goal
Create a unified **JSON-first compendium system** that replaces hard-coded seed data and provides a single, maintainable source of truth for all items (traits, talents, augments, macros).

**Benefits**: one loader, clear file structure, easy editing, scalable, developer-friendly.

## 2. Current State
All compendium items are hard-coded arrays in `scripts/build-packs.js`, making updates error-prone and hidden.

## 3. Roadmap

**Phase 1 – Foundation**  
• Add `packs/` with sub-folders for each compendium type.  
• Implement **generic `CompendiumLoader`** that reads every `*.json` file and performs basic schema validation.

**Phase 2 – Data Migration**  
• Move existing seed arrays into JSON files inside `packs/`.  
• Update `build-packs.js` to consume `CompendiumLoader` output.

**Phase 3 – Core Functionality COMPLETE**  
• Provide ≥ 20 traits, 15 talents, 15 augments, 10 macros.  
• Robust validation, error handling, and logging.  
• Build script generates `.db` packs identical to current output.  
• Contributor-friendly documentation of directory format.

*All essential functionality must be finished by the end of Phase 3.*

**Stretch Goals (Phase 4+)**  
• Full JSON schema + test suite (≥ 90 % coverage)  
• Live compendium hot-reload  
• Content editing tools & localisation support.

## 4. Advanced Feature — User-Generated Content
Leverage existing CLI export/import to allow in-game dialogs or macros to create items and **export them as schema-compatible JSON** for easy sharing or re-import.

## 5. Success Criteria (Phase 3)
• All data lives in `packs/` JSON files.  
• Build succeeds with no regressions.  
• New items require only JSON edits.  
• System fails gracefully on malformed JSON.  
• Expanded, production-ready content library present in game.

## 6. Next Action
Set up `packs/` directory and minimal `CompendiumLoader` proof-of-concept.

**Priority**: deliver full core functionality by Phase 3; later phases are optional stretch goals.