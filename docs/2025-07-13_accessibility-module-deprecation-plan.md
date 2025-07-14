    # Accessibility Module Deprecation Roadmap

    **Component**: `scripts/accessibility/**`

    **Decision Date**: 2025-07-13  
    **Prepared By**: Avant VTT Dev Team  
    **Policy Reference**: [Deprecation Policy for AvantVTT](./DEPRECATION_POLICY.md)

    ---

    ## 🎯 Why Deprecate Now?

    The accessibility helper library is aspirational and not required for the immediate gameplay-critical milestones (item sheets, drag-drop, trait system).  Maintaining it slows the TypeScript migration and build times, and creates test surface we do not have capacity to keep green during the current sprint.  We will archive it now and restore or redesign it once core functionality is stable.

    *Integration audit summary*
    | Area               | Coupling           | Notes                                                                                                                           |
    | ------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
    | Production imports | **1 hard**, 1 soft | `trait-renderer.ts` re-exports `isLightColor` (hard); `bulk-trait-dialog.ts` dynamic-imports `ensureFocusable` (soft fallback). |
    | Tests              | 2 suites           | `tests/unit/accessibility/*`, `tests/unit/logic/chat/trait-renderer.test.ts`                                                    |
    | Templates / SCSS   | none               | –                                                                                                                               |

    Risk is therefore LOW and deprecation is safe with stubs.

    ---

    ## 🛣️ Four-Phase Plan

    ### Phase 1 – Quarantine (Sprint 2025-07-B)
    1. **Archive Source**  
    ```bash
    mkdir -p deprecated/accessibility/
    git mv scripts/accessibility/* deprecated/accessibility/
    ```
    2. **Stub Barrel** (`scripts/accessibility/index.ts`)  
    Export *only* the symbols currently referenced (`isLightColor`, `ensureFocusable`) as minimal no-op shims.
    3. **Unit Tests**  
    * Move accessibility-specific tests into the archive and exclude them in `jest.config.js` (`testPathIgnorePatterns`).
    * Keep `trait-renderer` tests running (they will import the stub).
    4. **Docs**  
    Add `README.md` inside `deprecated/accessibility/` with deprecation details.

    **Success criteria**: build + tests pass unchanged; runtime unaffected; README present.

    ---

    ### Phase 2 – Clean Runtime (Sprint 2025-08-A)
    1. **Remove Hard Import**  
    ‑ Replace `export { isLightColor } from "../../accessibility"` in `trait-renderer.ts` with the local helper already defined in the same file.
    2. **Drop Soft Import**  
    ‑ In `bulk-trait-dialog` simply call `searchInput.focus()`; delete dynamic import block.
    3. **Verify Bundle** – run `npm run build` and confirm no `scripts/accessibility` code in `dist/`.

    **Success criteria**: zero runtime references; dist bundle free of module.

    ---

    ### Phase 3 – Repository Hygiene (Sprint 2025-08-B)
    1. **Delete Stub Barrel** once no code imports it.
    2. **Remove Dead Imports / ESLint** – run `eslint --fix` and manual sweep.
    3. **Pre-commit Guard** – extend existing guard to block new refs to `scripts/accessibility` unless commit msg contains `restore-accessibility-module`.

    **Success criteria**: stubs gone; guard active; build still clean.

    ---

    ### Phase 4 – Long-Term Safeguards (Sprint 2025-09)
    1. **CI Check** – GitHub Action fails if any file outside `deprecated/` imports from `scripts/accessibility`.
    2. **Dead-Code Scan** – add path to `npm run lint:deadcode` allowlist.
    3. **Weekly Monitor** – include in automated “deprecated scan” job.

    **Success criteria**: CI prevents accidental resurrection; monitoring scheduled.

    ---

    ## ⏳ Timeline & Owners
    | Phase | Target Date | Owner         | PR Branch                        |
    | ----- | ----------- | ------------- | -------------------------------- |
    | 1     | 2025-07-15  | @lead-dev     | `deprecate/accessibility-phase1` |
    | 2     | 2025-08-01  | @frontend-dev | `deprecate/accessibility-phase2` |
    | 3     | 2025-08-15  | @infra-dev    | `deprecate/accessibility-phase3` |
    | 4     | 2025-09-01  | @ci-ops       | `deprecate/accessibility-phase4` |

    ---

    ## 🔄 Restoration Checklist (for future)
    If a future sprint reprioritises accessibility, follow *Restoration Procedure* in `DEPRECATION_POLICY.md` using keyword **`restore-accessibility-module`** in commit messages.

    ---

    ## 📌 Changelog & Tracking
    * A matching changelog entry will be added in `changelogs/` when Phase 1 PR merges.
    * Sprint progress reports will be logged in `_sprints/` with phase completion details.

    ---

    *Prepared with love & caution – let’s ship core features first!* 