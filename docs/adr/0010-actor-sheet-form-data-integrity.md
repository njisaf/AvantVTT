# ADR-0010: Actor Sheet Form Data Integrity for Duplicate Partials

**Date**: 2025-07-31
**Status**: Accepted

## Context

The Actor Sheet in the AvantVTT system includes a UI section for "Expertise Points," which is rendered on both the "Skills" tab and the "Gear" tab for user convenience. This was achieved by including the same Handlebars partial (`templates/actor/expertise-points-section.hbs`) in two different locations within the main actor sheet template (`templates/actor-sheet.html`).

This implementation led to a critical bug: when a user edited any field on the actor sheet, a `DataModelValidationError` was thrown, preventing any data from being saved. The error indicated that integer fields for `expertisePoints` were receiving non-integer values. Further investigation revealed that this initial error caused a cascading failure where no form data, including `powerPoints` and even the actor's name, could be persisted.

The root cause was that including the same partial twice created duplicate form inputs with identical `name` attributes (e.g., `name="system.expertisePoints.total"`). Per standard browser behavior, when a form with duplicate input names is submitted, the values are packaged as an array. FoundryVTT's data model, expecting a single integer for these fields, rejected the array, causing the validation to fail and halting the entire update operation.

## Decision

The final decision is to address the problem at its source—the HTML—by ensuring that only one instance of the shared partial submits its data, thus preventing the creation of invalid form data from the outset.

The implementation consists of three parts:

1.  **Conditional `name` Attribute**: The `expertise-points-section.hbs` partial was modified to conditionally render the `name` attribute on its `<input>` elements. The attribute is only included if a `submit=true` parameter is passed to the partial.
2.  **Single Submitting Instance**: The `actor-sheet.html` template was updated. The partial inclusion on the "Gear" tab now passes `submit=true`, designating it as the single source of truth for form data. The instance on the "Skills" tab omits this parameter, making it a display-only component.
3.  **UI Synchronization**: To keep the two sections synchronized, a `data-field` attribute was added to the inputs in the partial. A JavaScript function (`_synchronizeExpertiseInputs` in `actor-sheet.ts`) uses these attributes to mirror changes between the two instances in real-time.

With the form now submitting clean data, all custom JavaScript workarounds for form submission (`_prepareSubmitData` override) were removed from `actor-sheet.ts`, restoring FoundryVTT's default (and more robust) form handling logic.

## Consequences

-   **Pros**:
    -   **Robustness**: This solution is structurally sound and eliminates the root cause of the bug, rather than patching its symptoms. It is less likely to be broken by future FoundryVTT updates.
    -   **Clarity**: The logic is clear and well-documented. Future developers will immediately understand why only one partial submits data and how the UI is kept in sync.
    -   **Correctness**: The form now generates valid HTML and submits clean, predictable data, which aligns with framework expectations.
    -   **Reliability**: All actor sheet fields now save correctly, and the `DataModelValidationError` is fully resolved.

-   **Cons**:
    -   **Slight Complexity**: This solution adds a small amount of conditional logic to the Handlebars templates and requires a dedicated JavaScript function for synchronization. However, this complexity is well-contained and documented.

-   **Rejected Alternatives**:
    -   **JavaScript-only Fix (`_prepareSubmitData`)**: The initial approach was to intercept the corrupted form data in JavaScript and flatten the arrays before they reached the data model. This was rejected because it was brittle, failed to handle all edge cases within the ApplicationV2 lifecycle, and caused a regression where no data would save. It treated the symptom rather than the cause.
    -   **Custom Form Handler (`form.handler`)**: An attempt to use a fully custom form handler also failed because it proved difficult to correctly interface with the complex ApplicationV2 sheet and document lifecycle, leading to a complete failure to persist any data.
    -   **Removing the Duplicate Partial**: Removing one of the expertise point sections was not an option as it would have violated the functional requirement to have the UI present on both tabs.