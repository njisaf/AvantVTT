# Manual Testing Guide – Avant VTT Static Style-Guide

*Version 0.1 – 2025-07-16*

---

## Purpose
Ensure the refactored SCSS (`avant-sandbox.css`) renders identically to the legacy stylesheet (`avant.css`) and that the static style-guide folder works on non-developer machines before handing off to designers.

## Prerequisites
1. A freshly built repository – run `npm run build` (both CSS files produced).
2. Foundry VTT running locally with Avant system installed (v13 container).
3. Headless browser tools installed if you plan to re-run visual-regression (`bash scripts/visual-regression.sh`).
4. ZIP utility (e.g., `zip`, 7-Zip) for packaging the styleguide.

## Test Matrix
| #   | Scenario                | Steps                                                                                                        | Expected Result                                                        |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| 1   | Local file opens        | `open styleguide/index.html` (mac) / double-click (Win)                                                      | Landing page loads; no missing CSS; links work                         |
| 2   | Actor Sheet snapshot    | Click *Actor Sheet* link                                                                                     | Page shows styled sheet; fonts & colours match in legacy (`avant.css`) |
| 3   | Item Sheet snapshot     | Click *Item Sheet* link                                                                                      | Same as above                                                          |
| 4   | Toggle to sandbox CSS   | In browser dev-console → `document.querySelector('link[href$="avant.css"]').href='styles/avant-sandbox.css'` | Visual diff should be **zero** or imperceptible                        |
| 5   | Foundry live toggle     | Run macro in Foundry (*Toggle Sandbox Stylesheet*)                                                           | Actor & Item sheets still render; no console errors                    |
| 6   | Cross-browser sanity    | Test in Chrome, Firefox, Edge                                                                                | No major discrepancies                                                 |
| 7   | File-system portability | Copy `styleguide/` to USB, open on 2nd machine                                                               | Works offline                                                          |
| 8   | ZIP packaging           | `zip -r avant-styleguide.zip styleguide/`                                                                    | Archive < 5 MB, no build artefacts missing                             |

## Pass/Fail Criteria
* All eight scenarios pass without visual or console errors.
* Pixelwise diff threshold < 0.5 % (automated script) OR manual spot-check OK.
* Any failure → create ticket with screenshot + reproduction notes.

## Reporting
Record results in the Sprint QA sheet with columns: *Scenario*, *Pass/Fail*, *Notes*, *Tester*, *Date*.

---
*Document owner:* **QA Lead** 