# NPI Tender Gate Scope Feature — Implementation Plan

## Overview

Feature goal: let the team manually choose, during tender, which standard NPI gate questions apply to a specific job.

This feature uses the existing standard NPI gate question set. It is not based on product family, and it is not designed to create family-only questions.

This feature also does not disable PFMEA, CTQ, BOM, timing, trackers, or any other NPI feature. It only controls:

- which gate checklist questions appear on Gate 0 to Gate 5
- what the sign-off criteria are for that specific job

Example use case:

> A low-volume or lower-complexity tender may not need the full gate sign-off burden. During tender, the team manually deselects some standard gate questions that are not needed for that job. A larger or more demanding tender can keep the full standard gate scope. In both cases, PFMEA and the rest of NPI remain available as normal tools.

---

## Core Rules

1. The gate question library stays standard and shared.
2. Tender gate scope selection is a manual exercise on purpose.
3. The selection only affects gate checklist and sign-off criteria.
4. The selection does not disable any NPI feature or tab.
5. Once confirmed, the project gate scope is locked for Gate 1 to Gate 5.
6. Existing projects remain backward compatible and show all standard gate questions unless a project-specific selection exists.

---

## Dual-Track Delivery (Do Both)

This plan is intentionally structured as two tracks delivered together:

1. Track A: Manual tender gate scope and lock (core functional change)
2. Track B: Visibility, tests, and documentation (safe rollout and team clarity)

Track A gives the operational behaviour needed by the business.

Track B makes the behaviour visible, testable, and maintainable.

Both tracks are required for release readiness.

---

## Design Direction

### What this feature is

- A per-project gate scope decision
- Agreed during tender
- Stored against the linked NPI programme
- Used to render only the selected checklist questions on gate pages

### What this feature is not

- Not family-specific gate templates
- Not automatic question suggestions
- Not quantity-driven automation
- Not a way to hide or turn off PFMEA or any other NPI module

---

## Current System Alignment

The app already has:

- one central gate question set in `core/js/state.js` via `GATE_DEFS`
- explicit product-to-programme linkage through `product_id`
- an existing NPI programme lifecycle tied to product records

Because of that, this feature should work with the existing linked programme rather than create a second parallel NPI project flow.

Recommended approach:

1. Product is created or updated in Product Management
2. Product has an existing linked NPI programme
3. When the product enters Tender, the user opens a tender gate scope editor for that linked programme
4. The user selects which standard gate questions apply
5. The selection is saved and then locked
6. Gate pages render only those selected questions

---

## Database Changes

### Programmes table

Add project-level fields to `programmes`:

```sql
ALTER TABLE programmes
ADD COLUMN gate_selections JSONB DEFAULT NULL,
ADD COLUMN gate_selection_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN gate_selection_locked_at TIMESTAMP NULL,
ADD COLUMN gate_selection_locked_by TEXT NULL;
```

### `gate_selections` structure

```json
{
  "0": [0, 1, 2, 4, 5],
  "1": [0, 1, 3, 4, 7, 8],
  "2": [0, 2, 5, 8],
  "3": [0, 1, 2, 3],
  "4": [0, 2, 5],
  "5": [0, 1, 3]
}
```

Meaning:

- each key is a gate number `0` to `5`
- each value is a list of selected indices from the standard `GATE_DEFS[gateNum].items`

Fallback rule:

- `null` or missing `gate_selections` means all standard questions are selected

Lock rule:

- `gate_selection_locked = true` means the tender scope is fixed and cannot be edited in the normal workflow

Audit rule:

- `gate_selection_locked_at` and `gate_selection_locked_by` record when the scope was locked and by whom

---

## Why Use Indices

Indices are suitable here because:

- the questions are standard and centrally defined
- the user is selecting from the standard list, not creating family-specific questions
- the payload stays small and simple

Important implementation note:

The render layer must preserve original item indices when displaying filtered gate questions. Do not reindex the filtered checklist, otherwise saved check states can drift onto the wrong questions.

---

## State Model

Add project-scope editor state in `core/js/state.js`:

```javascript
let tenderGateScopeState = {
  isOpen: false,
  programmeId: null,
  selectedGate: 0,
  workingSelections: null
};
```

Recommended helper functions:

```javascript
function getProjectGateSelection(projectId, gateNum) {}
function getAllProjectGateSelections(projectId) {}
function normalizeGateSelections(gateSelections) {}
function getDefaultGateSelection(gateNum) {}
function isGateSelectionLocked(projectId) {}
function canEditGateSelections(projectId) {}
```

Behaviour:

- `getProjectGateSelection()` returns saved selected indices or all defaults
- `normalizeGateSelections()` removes duplicates and invalid indices
- `isGateSelectionLocked()` checks whether the tender scope has already been confirmed

---

## File Changes

### New files

```text
portals/product-development/npi/js/
  npi-gates-editor.js
```

### Modified files

```text
core/js/
  state.js
  db.js
  app.js

portals/product-development/product-management/js/
  products-data.js
  products.js

portals/product-development/npi/js/
  dashboard.js
  gates.js
  npi-data.js
  npi-data-relational.js

index.html
TESTING_STRATEGY.md
README.md
CLAUDE.md
```

### Files no longer needed from the old plan

Do not add these:

- `family-gates-data.js`
- `family-gates-manager.js`
- any `family_gate_templates` table

---

## User Flow

### Tender scope setup

1. User opens a product in Product Management
2. Product status is set to `Tender`
3. System resolves the linked NPI programme using `product_id`
4. User opens the tender gate scope editor
5. User manually ticks which standard gate questions apply for this job
6. User reviews all 6 gates
7. User clicks `Confirm and Lock`
8. System saves `gate_selections`, sets `gate_selection_locked = true`, and stores audit fields

### After lock

1. Gate pages show only selected questions
2. Progress and sign-off are based only on selected questions
3. PFMEA and all other NPI tabs remain available exactly as before
4. Normal users cannot change gate selections after lock

### Existing projects

1. If no `gate_selections` exist, use all standard questions
2. If no lock exists, treat the project as unscoped legacy data
3. Optional future enhancement: allow admins to apply a tender scope to legacy projects manually

---

## Rendering Rules

### Gate pages

`gates.js` should:

1. load the saved selected indices for that project and gate
2. map selected indices back to the original `GATE_DEFS[gateNum].items`
3. render only those questions
4. keep checkbox state tied to the original stored index positions

Recommended render helper:

```javascript
function resolveGateChecklistItems(projectId, gateNum) {
  // returns [{ sourceIndex, text, checked }]
}
```

This helper should return each visible row with:

- `sourceIndex`
- `text`
- `checked`

That prevents mismatches between filtered display order and stored check state.

### Sign-off and progress

Progress should be based only on visible selected questions.

Example:

- standard gate has 15 questions
- project selection keeps 9 questions
- gate header should show `4 / 9 complete`, not `4 / 15`

---

## Data Layer Functions

Recommended functions to add:

### State and selection helpers

- `getProjectGateSelection(projectId, gateNum)`
- `getAllProjectGateSelections(projectId)`
- `normalizeGateSelections(gateSelections)`
- `getDefaultGateSelection(gateNum)`
- `isGateSelectionLocked(projectId)`
- `canEditGateSelections(projectId)`

### UI helpers

- `openTenderGateSelectionModal(productId)`
- `closeTenderGateSelectionModal()`
- `renderGateQuestionSelector(projectId)`
- `renderGateSelectorTab(projectId, gateNum)`
- `renderGateSelectionSummary(projectId)`

### Persistence helpers

- `saveProjectGateSelections(projectId, gateSelections)`
- `lockProjectGateSelections(projectId)`
- `unlockProjectGateSelections(projectId)`

### Linkage helpers

- `findProgrammeByProductId(productId)`
- `productTenderStatusTriggered(productId, productData)`

### Render-safe helpers

- `resolveGateChecklistItems(projectId, gateNum)`
- `countSelectedGateQuestions(projectId, gateNum)`
- `countCompletedSelectedGateQuestions(projectId, gateNum)`

---

## Phase Plan

### Phase 0: Resolve linkage and trigger flow

Goal: make sure tendering works against the existing linked programme, not a duplicate one.

Deliverables:

- review current `ensureProductProgrammes()` behaviour
- define one supported path for tender scope editing
- add `findProgrammeByProductId(productId)`
- add `productTenderStatusTriggered(productId, productData)`
- ensure status change to `Tender` opens or offers the tender scope editor for the linked programme

Success criteria:

- no duplicate NPI programmes created
- tendering acts on the correct linked programme

### Phase 1: Schema and state support

Goal: store project-specific tender scope and lock state.

Deliverables:

- add `gate_selections`
- add `gate_selection_locked`
- add lock audit fields
- update programme migration logic in `db.js`
- add helper functions in `state.js`

Success criteria:

- old projects still render all standard questions
- new scoped projects save and load cleanly

### Phase 2: Tender gate scope editor

Goal: provide the manual tender-stage selection UI.

Deliverables:

- create `npi-gates-editor.js`
- build gate-by-gate checkbox editor for standard questions
- show all 6 gates in tabs
- allow save while still editable
- add `Confirm and Lock` action

Success criteria:

- user can manually choose gate questions for each gate
- user can lock the selection when agreed

### Phase 3: Gate rendering updates

Goal: gate pages only show selected questions while preserving check state.

Deliverables:

- update `gates.js`
- add `resolveGateChecklistItems(projectId, gateNum)`
- update progress counters to use selected items only
- ensure sign-off logic remains unchanged apart from selected question count

Success criteria:

- visible gate questions match saved tender scope
- checkbox history remains aligned with the correct source question

### Phase 4: Dashboard visibility

Goal: make project gate scope visible without opening the editor.

Deliverables:

- show gate scope status on project dashboard
- show whether gate scope is locked
- show counts such as `Gate 2: 9 of 14 selected`
- add `Edit Gate Scope` button when editable

Success criteria:

- user can see at a glance whether a project has been scoped and locked

### Phase 5: Testing and documentation

Goal: make the feature safe to ship.

Deliverables:

- add unit tests for selection helpers and rendering helpers
- add integration tests for tendering flow and gate rendering
- update docs and architecture notes

Success criteria:

- tests cover save, load, lock, and render flows
- documentation matches actual implementation

---

## Concrete Execution Checklist

This section turns the plan into implementation-ready tasks against the current codebase.

### Step 1: Database schema update

Apply a migration to add these columns to `programmes`:

```sql
ALTER TABLE programmes
ADD COLUMN gate_selections JSONB DEFAULT NULL,
ADD COLUMN gate_selection_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN gate_selection_locked_at TIMESTAMP NULL,
ADD COLUMN gate_selection_locked_by TEXT NULL;
```

Implementation task:

- add the migration before any UI work so load and save code can be updated safely

### Step 2: Persistence layer update

Files:

- `core/js/db.js`

Tasks:

- update `saveRemote()` to include:
  - `gate_selections`
  - `gate_selection_locked`
  - `gate_selection_locked_at`
  - `gate_selection_locked_by`
- update `loadRemote()` to select and map those fields back into each programme
- update `migrateprog()` to initialise safe defaults for:
  - `gate_selections`
  - `gate_selection_locked`
  - `gate_selection_locked_at`
  - `gate_selection_locked_by`
- ensure legacy projects still load with full default gate scope

### Step 3: Global state and helper functions

Files:

- `core/js/state.js`

Tasks:

- add `tenderGateScopeState`
- add:
  - `getProjectGateSelection(projectId, gateNum)`
  - `getAllProjectGateSelections(projectId)`
  - `normalizeGateSelections(gateSelections)`
  - `getDefaultGateSelection(gateNum)`
  - `isGateSelectionLocked(projectId)`
  - `canEditGateSelections(projectId)`
- keep helpers generic and side-effect free where possible

### Step 4: Product-to-programme resolution

Files:

- `portals/product-development/product-management/js/products-data.js`
- `portals/product-development/npi/js/dashboard.js`
- `core/js/app.js`

Tasks:

- add `findProgrammeByProductId(productId)` in a shared place used by tender flow
- review `npi.dashboard.ensureProductProgrammes()` and confirm how it should coexist with the tender scope editor
- add `productTenderStatusTriggered(productId, productData)`
- update `productsDataUpdateProduct()` so a move to `Tender` opens or offers the tender gate scope editor for the linked programme
- make sure this does not create duplicate programmes

### Step 5: Tender gate scope editor UI

Files:

- `portals/product-development/npi/js/npi-gates-editor.js`
- `index.html`

Tasks:

- create the new file and add its script tag in the correct load order
- build modal open/close functions:
  - `openTenderGateSelectionModal(productId)`
  - `closeTenderGateSelectionModal()`
- build render functions:
  - `renderGateQuestionSelector(projectId)`
  - `renderGateSelectorTab(projectId, gateNum)`
  - `renderGateSelectionSummary(projectId)`
- include:
  - all 6 gates
  - standard questions only
  - save button
  - confirm-and-lock button
  - clear read-only state once locked

### Step 6: NPI data mutation functions

Files:

- `portals/product-development/npi/js/npi-data.js`
- `portals/product-development/npi/js/npi-data-relational.js`

Tasks:

- add in-memory mutation functions for gate scope selection
- add relational save/update helpers for:
  - `gate_selections`
  - `gate_selection_locked`
  - `gate_selection_locked_at`
  - `gate_selection_locked_by`
- keep optimistic UI behaviour consistent with the rest of the app

Recommended functions:

- `saveProjectGateSelections(projectId, gateSelections)`
- `lockProjectGateSelections(projectId)`
- `unlockProjectGateSelections(projectId)`

### Step 7: Gate rendering changes

Files:

- `portals/product-development/npi/js/gates.js`

Tasks:

- add `resolveGateChecklistItems(projectId, gateNum)`
- render only selected questions
- preserve original `sourceIndex` for checkbox binding
- update progress display to selected-question count only
- keep signatory workflow unchanged

Recommended helper outputs:

- `sourceIndex`
- `text`
- `checked`

### Step 8: Dashboard visibility

Files:

- `portals/product-development/npi/js/dashboard.js`

Tasks:

- show whether the project gate scope is:
  - not yet set
  - editable
  - locked
- add an `Edit Gate Scope` button when allowed
- show simple counts such as:
  - `Gate 1: 9 of 15 selected`

### Step 9: Load order update

Files:

- `index.html`

Tasks:

- add `npi-gates-editor.js` in the NPI script block
- place it after the core NPI namespace/data files it depends on and before files that call it

### Step 10: Tests

Files:

- `tests/` new or updated test files

Tasks:

- add unit tests for selection helpers
- add integration tests for tender trigger and lock flow
- add rendering tests for filtered gate questions
- add regression checks that PFMEA and other NPI areas are still accessible

### Step 11: Documentation updates

Files:

- `README.md`
- `TESTING_STRATEGY.md`
- `CLAUDE.md`

Tasks:

- document that tender gate scope affects gate checklist only
- document the lock behaviour
- document new programme fields and helper functions

---

## Recommended Build Order

Build in this order to reduce breakage:

1. database migration
2. `db.js` save/load/migration updates
3. `state.js` helper functions
4. `npi-data.js` and `npi-data-relational.js` selection persistence
5. `npi-gates-editor.js` modal UI
6. `products-data.js` tender trigger wiring
7. `gates.js` filtered rendering
8. `dashboard.js` visibility and entry points
9. tests
10. docs

---

## Testing Strategy

### Unit tests

Add tests for:

- `normalizeGateSelections()`
- `getProjectGateSelection()`
- `isGateSelectionLocked()`
- `resolveGateChecklistItems()`
- progress counting for selected questions only

### Integration tests

Add tests for:

1. product status changed to `Tender`
2. linked programme is found correctly
3. gate scope editor saves selection
4. `Confirm and Lock` sets lock fields
5. gate pages show only selected questions
6. PFMEA and other NPI tabs remain accessible

### Manual checks

1. Create or edit a product and move it to `Tender`
2. Open tender gate scope editor
3. Deselect some Gate 1 and Gate 2 questions
4. Lock the selection
5. Open those gate pages and confirm only selected questions appear
6. Open PFMEA and confirm it is still available
7. Confirm sign-off is based on selected checklist only

---

## Security and Collaboration

This project uses shared authenticated access, so this feature should follow the same collaborative model.

That means:

- all authenticated users can see the same project gate scope
- `gate_selections` is shared project data
- locking is a workflow control, not a security boundary

Recommended validations:

- gate number must be `0` to `5`
- selected indices must be within the range of the relevant `GATE_DEFS[gateNum].items`
- duplicates must be removed before save

---

## Acceptance Criteria

### Functional

- standard NPI gate questions remain central and shared
- users can manually select gate questions during tender
- selection is stored per project
- selection can be locked
- Gate 0 to Gate 5 show only selected questions
- sign-off and progress use selected questions only
- PFMEA, CTQ, BOM, timing, trackers, and other NPI features remain unaffected

### Compatibility

- existing projects without `gate_selections` still show all standard gate questions
- no duplicate NPI programmes are created
- product linkage continues to use `product_id`

### Audit

- lock timestamp is stored
- lock user is stored

---

## Out of Scope

These items are not part of this feature:

- family-specific gate questions
- question suggestions based on build quantity or volume
- disabling PFMEA or any NPI module
- replacing the standard `GATE_DEFS` library with per-family templates
- complex approval workflow beyond one lock action

---

## Suggested Plain-English User Message

When explaining this feature in the UI, use wording like:

> During tender, choose which standard gate questions apply to this job. This sets the gate checklist and sign-off criteria only. It does not turn off PFMEA or any other NPI tools.

---

## Next Steps

1. Update the data model on `programmes`
2. Resolve tender trigger against the existing linked programme flow
3. Build the manual gate scope editor
4. Update gate rendering to use selected questions safely
5. Add tests before rollout

---

Plan status: ready for implementation after agreement on the tender trigger UX.

Last updated: 2026-03-14
