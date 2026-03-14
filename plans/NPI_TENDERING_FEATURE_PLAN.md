# NPI Gate Tendering Feature — Implementation Plan

## 📋 Overview

**Feature Goal:** Enable teams to customize which gate checklist items (questions) appear during the 5 NPI sign-off gates, based on product family or per-project preferences.

**Problem Addressed:** Currently, all projects inherit the same 85+ hardcoded gate checklist items from `GATE_DEFS` in `state.js`. Different product families (HVAC, Rotating Machines, Pneumatics, etc.) may need different questions. This feature allows:
- Define gate question templates per product family
- Select which questions apply to a specific project at creation
- Hide non-selected questions from gate pages
- Maintain audit trail of which questions were selected

**Example Use Case:**
> A project for "HVAC Cooling Unit" needs only the HVAC-specific questions (e.g., "Cooling efficiency verified"), not Pneumatics questions. The Gate 0 page should show only the selected ~12 questions, not all 6.

---

## 🎯 Design Philosophy

### Alignment with Existing Patterns

This feature follows the **Family Templates** architecture already in use for PFMEA:

```
✅ Family-level definitions     (like family_pfmea_templates)
✅ Per-project selection        (at project creation)
✅ Relational database schema   (normalized structure)
✅ Real-time sync via Supabase  (subscription-based)
✅ Mobile-first UI              (responsive design)
✅ RLS for security             (per-user isolation)
```

### Core Tenets

1. **Flexible, not enforced** — A project can use custom gates instead of family gates
2. **Backwards compatible** — Existing projects continue to work with GATE_DEFS
3. **Family-driven** — New projects default to family gate templates; can override per-project
4. **Minimal data** — Only store the *selected* question indices, not duplicates
5. **Real-time updates** — Changes to family gate templates propagate to new projects immediately

---

## 🗄️ Database Schema

### New Table: `family_gate_templates`

Stores customizable gate checklist items per family and per gate number.

```sql
CREATE TABLE family_gate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  family_id TEXT NOT NULL,                    -- e.g., "HVAC", "Rotating Machines"
  gate_number INT NOT NULL CHECK (gate_number BETWEEN 0 AND 5),
  question TEXT NOT NULL,                     -- e.g., "ME resource confirmed available"
  display_order INT DEFAULT 0,                -- Sort order within gate
  is_mandatory BOOLEAN DEFAULT true,          -- Always included? (can't deselect)
  notes TEXT,                                 -- Optional guidance text
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, family_id, gate_number, question)
);

-- RLS Policy
ALTER TABLE family_gate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own gate templates"
  ON family_gate_templates FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_family_gate_templates_user_id
  ON family_gate_templates(user_id);
CREATE INDEX idx_family_gate_templates_family_gate
  ON family_gate_templates(user_id, family_id, gate_number);
```

### Modified Table: `programmes`

Add a column to store selected gate questions per project:

```sql
ALTER TABLE programmes
ADD COLUMN gate_selections JSONB DEFAULT '{}'::jsonb;

-- Structure of gate_selections:
-- {
--   "0": [0, 2, 5],              // Gate 0: selected question indices
--   "1": [0, 1, 3, 4, 6, 7],    // Gate 1: selected indices
--   ...
--   "5": [0, 1, 2, 3]
-- }
-- If null/empty, fall back to default GATE_DEFS
-- If exists, render only the selected items

-- Rationale:
-- - Compact: stores only indices, not full question text
-- - Flexible: easy to add/remove questions without updating all projects
-- - Backward compatible: missing field = use GATE_DEFS
```

**Migration Path:**
- Existing projects get `gate_selections = null` (treated as "use GATE_DEFS")
- New projects created after feature launch get `gate_selections` populated at creation time

---

## 📂 File Structure

### New Files

```
portals/product-development/
├── js/
│   ├── family-gates-data.js         (NEW) Data layer for family gate templates
│   └── family-gates-manager.js      (NEW) UI for managing family gate templates
│
└── npi/
    └── js/
        └── npi-gates-editor.js      (NEW) Per-project gate question selector
```

### Modified Files

```
portals/product-development/product-management/js/
├── products-data.js                 (MODIFY) Add status change hook for "Tender"
└── products.js                      (MINOR) Optional: "Create NPI Project" button on product row

portals/product-development/npi/js/
├── npi.js                           (MODIFY) Add npi.gates namespace
├── gates.js                         (MODIFY) Render selected questions only
├── dashboard.js                     (MODIFY) Accept product context; add "Edit Gate Questions" button
└── npi-data.js                      (MODIFY) Add gate selection mutation functions

portals/product-development/js/
├── family-gates-data.js             (NEW)
└── family-gates-manager.js          (NEW)

core/js/
├── state.js                         (MODIFY) Add gate state variables and helper functions
└── app.js                           (MODIFY) Initialize family gate templates on launch

index.html                           (MODIFY) Add new script tags in correct load order
```

---

## 🔄 Data Flow

### On App Launch

```
1. User logs in
2. launchApp()
   ├─ familiesDataInit()
   ├─ familyTemplatesDataInit()   (existing PFMEA templates)
   └─ familyGatesDataInit()        (NEW: load family gate templates)
3. populateFamilySelects()         (existing)
4. Subscribe to real-time changes   (NEW: family_gate_templates channel)
```

### Trigger Point: Product Status → "Tender"

When a product in **Product Management** portal has status changed to **"Tender"**, the system should:

```
1. User: Product Management portal → Edit product
2. User: Changes status from "—" or "Production" to "Tender"
3. System: On save (productsDataUpdateProduct)
   ├─ Saves product with status = "Tender"
   ├─ Checks if `currentSection === 'product-development'`
   ├─ If yes, triggers: `productTenderStatusTriggered(productId)`
4. productTenderStatusTriggered():
   ├─ Loads product data
   ├─ Pre-populates new project modal with product info:
   │  └─ name, customer, unit, family (if set)
   ├─ Navigates to NPI → New Project modal
   ├─ Project creation flow includes gate selection (Phase 3)
5. User: Completes project creation with gate selection
6. Project linked to product (via product_id or name matching)
```

**Integration Points:**
- `products-data.js::productsDataUpdateProduct()` — Add status change hook
- `dashboard.js::showNewProjectModal()` — Accept product data parameter
- UI flow: Product detail → "Create NPI Project" button → New project modal with gates

---

### Create New Project (with Tendering)

```
1. User: "New Project" → showNewProjectModal() [or triggered by product Tender status]
2. User: Selects family (e.g., "HVAC")
3. System: Auto-loads "HVAC" family gate templates
4. User: Reviews suggested gate questions per gate (0–5)
   └─ [✓] "ME resource confirmed available"
   └─ [✓] "Bid submitted with ME input"
   └─ [ ] "Contract awarded and signed"        (unchecked = won't show)
   └─ [✓] "Programme file opened"
   └─ ...
5. User: Clicks "Create Project"
6. System: Saves project with gate_selections JSON
7. Project created with customized gates
```

### Edit Project Gate Questions

```
1. User: Opens project → Dashboard
2. User: Clicks "⚙ Edit Gate Questions"
3. System: Opens modal showing:
   ├─ Gate 0: [✓] 6 selected from 6 total
   ├─ Gate 1: [✓] 12 selected from 15 total
   ├─ Gate 2: [✓] 14 selected from 14 total
   ├─ ... (all gates)
4. User: Clicks "Gate 1" to customize
5. System: Shows checklist of all Gate 1 questions
   └─ [✓] "All specification information reviewed"
   └─ [✓] "Critical-to-Quality requirements identified"
   └─ [ ] "Internal CTQ metrics agreed with customer"
   └─ [✓] "All tolerances confirmed measurable"
   └─ ... (all 15 options)
6. User: Checks/unchecks questions
7. System: Updates project gate_selections
8. User: Sees Gate 1 page now shows only selected items

Data flow:
  User action → npi.gates.updateSelection()
    → npi.data.gates.updateSelection()
      → Supabase UPDATE programmes.gate_selections
      → Optimistically re-render gates.js
```

### View Gate (with Tendering)

```
1. User: Opens project → Gate 0
2. System: gates.js renders
   ├─ Load from prog().gates[0] (checklist data)
   ├─ Load from prog().gate_selections["0"] (selected indices)
   ├─ Filter GATE_DEFS[0].items using selection
   ├─ Render only selected questions
3. User: Sees 6 checked items (instead of all 6 from GATE_DEFS)
   └─ Missing items don't appear at all
4. User: Completes checks → normal gate workflow
```

---

## 📊 State Management

### New Global Variables (in `state.js`)

```javascript
let familyGatesState = {
  templates: [],      // Array of family gate template records
  loading: false,
  error: null
};

let gateEditorState = {
  isOpen: false,          // Modal open?
  projectId: null,        // Which project?
  selectedGate: 0,        // Which gate (0–5) being edited?
  tempSelection: null     // Temporary selection before save
};
```

### Helper Functions (in `state.js`)

```javascript
// Get selected question indices for a project's gate
function getSelectedGateItems(projectId, gateNum) {
  const p = db.programmes.find(x => x.id === projectId);
  if (!p) return [];
  if (!p.gate_selections || !p.gate_selections[gateNum]) {
    // Fallback: all items selected (backward compatibility)
    return GATE_DEFS[gateNum].items.map((_, i) => i);
  }
  return p.gate_selections[gateNum];
}

// Get family gate templates for a specific family
function getFamilyGateTemplates(familyId, gateNum) {
  return familyGatesState.templates.filter(
    t => t.family_id === familyId && t.gate_number === gateNum
  );
}

// Get default selection for a family's gate
function getDefaultGateSelection(familyId, gateNum) {
  const templates = getFamilyGateTemplates(familyId, gateNum);
  if (templates.length === 0) {
    // No family template: use GATE_DEFS
    return GATE_DEFS[gateNum].items.map((_, i) => i);
  }
  // Return indices of templates mapped to GATE_DEFS
  return templates
    .filter(t => !t.is_mandatory === false)  // Include all non-optional
    .map(t => GATE_DEFS[gateNum].items.indexOf(t.question))
    .filter(i => i >= 0);  // Only if found in GATE_DEFS
}
```

---

## 🛠️ Implementation Phases

### Phase 0: Integration Hook (Prerequisite)

**Goal:** Add trigger point for when product status changes to "Tender"

**Deliverables:**
- [ ] Modify `products-data.js::productsDataUpdateProduct()`
  - [ ] After successful update, check if `updates.status === 'Tender'`
  - [ ] If true, call `productTenderStatusTriggered(productId, updates)` (new function)
  - [ ] Pass product name, customer, family to NPI project creation context

- [ ] Create helper function `productTenderStatusTriggered(productId, productData)`
  - [ ] Store product context in global variable: `tenderedProductContext = { id, name, customer, family }`
  - [ ] Navigate to NPI → New Project modal
  - [ ] Modal pre-fills with product data (name, customer, family)
  - [ ] Gate selection feature activates automatically (Phase 3)

- [ ] Modify `dashboard.js::showNewProjectModal()`
  - [ ] Accept optional `prefilledData` parameter from product context
  - [ ] If `tenderedProductContext` exists, auto-select family and pre-fill fields
  - [ ] Display: "Creating NPI Project for Product: <product name>" (header hint)

**Effort:** 0.5–1 day
**Dependencies:** None (minimal changes to existing code)
**Testing:** Verify product status change triggers modal; pre-filled fields appear

---

### Phase 1: Database & Data Layer (Foundation)

**Goal:** Set up database, data loading, real-time sync

**Deliverables:**
- [ ] Create `family_gate_templates` table + RLS policy + indexes (Supabase)
- [ ] Migrate `programmes` table: add `gate_selections` JSONB column
- [ ] Create `family-gates-data.js` module
  - [ ] `familyGatesDataInit()` — Load templates from Supabase
  - [ ] `familyGatesGetByFamily(familyId)` — Get all templates for a family
  - [ ] `familyGatesGetGroupedByGate(familyId)` — Group by gate number
  - [ ] `familyGatesAddItem(familyId, gateNum, question, order, mandatory)` — Add template
  - [ ] `familyGatesUpdateItem(itemId, question, order, mandatory)` — Edit
  - [ ] `familyGatesDeleteItem(itemId)` — Delete template item
  - [ ] `familyGatesSubscribe()` — Real-time subscription to changes
- [ ] Add state variables to `state.js`
- [ ] Add initialization to `app.js::launchApp()`
- [ ] Add script tags to `index.html`

**Effort:** 2–3 days
**Dependencies:** Phase 0 (product tender context)
**Testing:** Unit tests for data functions; Supabase policies verified

---

### Phase 2: Family Gate Manager UI ✅ (Template Administration)

**Goal:** Allow admins to create and manage gate question templates per family

**Deliverables:**
- [ ] Create `family-gates-manager.js` UI module
  - [ ] `renderFamilyGatesManager()` — Main view with family list
  - [ ] `renderGateTemplateEditor(familyId, gateNum)` — Edit questions for a gate
  - [ ] Modal: "Add New Question"
  - [ ] Modal: "Edit Question"
  - [ ] List of questions with drag-to-reorder, toggle mandatory, delete
- [ ] Integrate into **Product Family Database** (existing portal)
  - [ ] Add "📋 Gate Questions" button next to "📋 PFMEA Templates"
  - [ ] Opens gate template manager side-by-side with family card
- [ ] Update `product-development.js`
  - [ ] Add state: `gateManagerState = { isOpen, familyId, gateNum }`
  - [ ] Functions: `showGateManager(familyId)`, `closeGateManager()`
- [ ] UI features:
  - [ ] View all gates (0–5) in tabs
  - [ ] Add/edit/delete questions per gate
  - [ ] Mark as "Mandatory" (always selected)
  - [ ] Drag-to-reorder display order
  - [ ] Live preview: "In projects, selected questions will appear"

**Styling:**
- Mobile-first responsive layout (single column on mobile, 2-col on tablet/desktop)
- Reuse global button/card styles from `components.css`
- Consistent with Family PFMEA Templates UI

**Effort:** 3–4 days
**Dependencies:** Phase 1 (data layer)
**Testing:** UI tests for add/edit/delete; verify modal state management

---

### Phase 3: Project Gate Question Selector (Per-Project Customization)

**Goal:** Allow projects to select which family gate questions apply

**Deliverables:**
- [ ] Modify **New Project Modal** (`dashboard.js`)
  - [ ] After family selection, show "Select Gate Questions" step
  - [ ] Display all 6 gates with question count and preview
  - [ ] Option: "Use all family defaults" (pre-selected)
  - [ ] Option: "Customize by gate" (manual selection)
  - [ ] Load from `familyGatesGetGroupedByGate(familyId)`
  - [ ] Store in `gate_selections` on project creation
  - [ ] **Integration:** If `tenderedProductContext` exists, auto-skip to gate selection (don't ask family, use from product)

- [ ] Create `npi-gates-editor.js` module
  - [ ] `renderGateQuestionSelector(projectData = null)` — The modal UI
  - [ ] `renderGateSelectorTab(gateNum, templateQuestions)` — One gate's tab
  - [ ] Checkbox list for each gate (0–5)
  - [ ] Preview gate progress: "X selected from Y total"
  - [ ] Buttons: "Apply Defaults" (reset to family), "Customize", "Save"
  - [ ] **Integration:** If called from product tender trigger, show: "Product: <name> (Tendered)"

- [ ] Add **Edit Gate Questions** feature to project dashboard
  - [ ] New button/action in project header: "⚙ Edit Gate Questions"
  - [ ] Opens same selector modal, but for existing project
  - [ ] Updates `programmes.gate_selections` via Supabase
  - [ ] Changes reflected immediately in gate pages

- [ ] Modify `dashboard.js::newProgTemplate()`
  - [ ] Accept `gateSelections` parameter
  - [ ] Initialize `gates` array with selections
  - [ ] Accept `prefilledData` from product context (`tenderedProductContext`)

**Styling:**
- Modal: 90vw max-width on mobile, 500px on desktop
- Tab navigation for gates (horizontal scroll on mobile)
- Checkbox list with preview counter
- "X selected / Y total" per gate

**Effort:** 3–4 days
**Dependencies:** Phase 0 (product context), Phase 1 (data), Phase 2 (UI patterns)
**Testing:** Modal state, selection persistence, default loading, product context pre-fill

---

### Phase 4: Gate Rendering Updates ✅ (Core Feature)

**Goal:** Render gates showing only selected questions

**Deliverables:**
- [ ] Modify `gates.js::npi.gate.renderGatePage(gateNum)`
  - [ ] After loading gate data, load selected indices: `getSelectedGateItems(progId, gateNum)`
  - [ ] If `gate_selections` exists and has items, filter checklist to selected only
  - [ ] If `gate_selections` is empty/null, use all GATE_DEFS items (backward compat)
  - [ ] Example:
    ```javascript
    const selectedIndices = getSelectedGateItems(progId, gateNum);
    const filteredItems = GATE_DEFS[gateNum].items.filter(
      (_, i) => selectedIndices.includes(i)
    );
    ```
  - [ ] Render filtered items in checklist
  - [ ] Maintain check state and signoff workflow unchanged

- [ ] Update checklist progress counter
  - [ ] "6 of 6 items selected" (not "6 of 15 available")
  - [ ] Progress bar still reflects completion %

- [ ] Add visual indicator (subtle)
  - [ ] Gate header might show: "⚙ 6 selected from 6 available" (small badge)
  - [ ] Only if selection differs from GATE_DEFS

**Effort:** 1–2 days
**Dependencies:** Phase 1, Phase 3
**Testing:** Unit tests for filtering logic; E2E: create project with custom gates, verify questions appear

---

### Phase 5: Dashboard & Analytics ✅ (Visibility)

**Goal:** Show gate customization status in dashboard and reports

**Deliverables:**
- [ ] Add gate customization indicator to project card
  - [ ] Badge: "⚙ 6/15 questions" if customized
  - [ ] Tooltip: "This project uses custom gate questions. Click to edit."
  - [ ] Disappears if using all defaults

- [ ] Project summary page
  - [ ] Show gate customization status for all 6 gates
  - [ ] Example: "Gate 0: 6 selected (100%)" vs "Gate 3: 12 selected (86%)"
  - [ ] Link to edit gates

- [ ] Family templates page
  - [ ] Show impact: "Used by 5 projects" (count of projects using this family's gates)

**Styling:**
- Inline badges, consistent with existing design
- Reuse colors: green for 100%, amber for partial, blue for info

**Effort:** 1–2 days
**Dependencies:** Phase 4
**Testing:** Verify badges show/hide correctly; counters accurate

---

### Phase 6: Real-Time Sync & Testing ✅ (Production Ready)

**Goal:** Ensure data stays in sync across users and test thoroughly

**Deliverables:**
- [ ] Real-time subscription to `family_gate_templates` changes
  - [ ] In `family-gates-data.js::familyGatesSubscribe()`
  - [ ] On INSERT/UPDATE/DELETE: update `familyGatesState`, trigger render
  - [ ] On project open: reload `gate_selections` from DB

- [ ] Concurrent edit handling
  - [ ] If User A edits family gate template, User B's new project sees changes immediately
  - [ ] If User A and B both edit same project gate selections, last-write-wins (normal save behavior)

- [ ] Comprehensive test suite
  - [ ] Unit tests: `tests/family-gates.test.js`
    - [ ] Data loading and filtering
    - [ ] Selection logic
    - [ ] Edge cases (no templates, partial selection, all defaults)
  - [ ] Integration tests: `tests/npi-gates-tendering.test.js`
    - [ ] Create project with custom gates
    - [ ] Edit project gates
    - [ ] Verify gate pages render correctly
    - [ ] Signoff workflow unchanged
  - [ ] E2E tests: `tests/e2e-gates-tendering.test.js`
    - [ ] Full workflow: create family → set gate template → create project → verify gates → complete gate → signoff

- [ ] TESTING_STRATEGY.md updated with gate tendering test patterns

**Effort:** 2–3 days
**Dependencies:** Phases 1–5
**Testing:** Run full test suite; manual E2E walkthrough

---

### Phase 7: Documentation & Rollout ✅ (Knowledge Transfer)

**Goal:** Document feature for users and developers

**Deliverables:**
- [ ] Create `plans/NPI_TENDERING_GUIDE.md`
  - [ ] User guide: Create family gate templates
  - [ ] User guide: Select gates when creating project
  - [ ] User guide: Edit gates for existing project
  - [ ] Screenshots/mockups
  - [ ] FAQs

- [ ] Update helper documentation
  - [ ] Update `plans/PRODUCT_FLOW_DIAGRAM.md` (add "Future State" section showing tendering flow)
  - [ ] Update `plans/NPI_PROJECT_FLOW_GUIDE.md` (add Phase 0 trigger details)
  - [ ] Update `plans/GATE_DEFINITIONS_GUIDE.md` (add gate customization examples)
  - [ ] Update `plans/PRODUCT_MANAGEMENT_GUIDE.md` (add tendering integration point)
  - [ ] Update `plans/DOCUMENTATION_INDEX.md` (add references to tendering flow)

- [ ] Update `CLAUDE.md`
  - [ ] Add to "Script Load Order" section
  - [ ] Add new files to "Repository Structure"
  - [ ] Add state variables reference
  - [ ] Add "Common Mistakes" if relevant

- [ ] Update `README.md`
  - [ ] Add Gate Tendering to "Portals" table
  - [ ] Update feature highlights

- [ ] Update `TESTING_STRATEGY.md`
  - [ ] Add "NPI Gate Tendering" section
  - [ ] Testing patterns for data layer, UI, E2E
  - [ ] Mock examples

- [ ] Code comments
  - [ ] Add inline comments explaining gate selection filtering in `gates.js`
  - [ ] Document `gate_selections` JSON structure in `state.js`

- [ ] Rollout notes
  - [ ] Existing projects unaffected (fallback to GATE_DEFS)
  - [ ] No migration needed
  - [ ] New projects get prompted to select gates

**Effort:** 1–2 days
**Dependencies:** All phases complete

---

## 🔐 Security Considerations

### RLS Policies

✅ **family_gate_templates** table:
- Per-user isolation: `auth.uid() = user_id`
- Users cannot see other users' family gate templates

✅ **programmes** table (existing):
- No changes to existing RLS
- `gate_selections` visible to all authenticated users (shared data model)

✅ **Data validation:**
- Gate numbers: must be 0–5
- Question text: max 300 chars
- Indices in `gate_selections`: validated against GATE_DEFS length

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| User edits family gates; breaks existing projects | Use **indices** not text; field is backward-compatible |
| User deletes question; selection becomes invalid | UI prevents deletion if used by projects; optional archive |
| User sees other users' family gates | RLS policy enforces `user_id` matching |
| Gate selection corrupted (invalid JSON) | Validation on save; fallback to all defaults |
| Performance: loading all templates on startup | Indexes on `user_id`, `family_id`, `gate_number` |

---

## 📦 Dependencies & Load Order

### Script Load Order (update `index.html`)

```html
<!-- Family Gate Templates (NEW) -->
<script src="portals/product-development/js/family-gates-data.js"></script>

<!-- (after family-templates-data.js, before product-development.js) -->
<script src="portals/product-development/js/family-gates-manager.js"></script>

<!-- NPI Gates (NEW) -->
<script src="portals/product-development/npi/js/npi-gates-editor.js"></script>

<!-- (before npi-orchestrator.js) -->
```

### Import Dependencies

**family-gates-data.js** depends on:
- `supa` (Supabase client from `auth.js`)
- `currentUser` (from `auth.js`)

**family-gates-manager.js** depends on:
- `familyGatesState`, functions from `family-gates-data.js`
- `getFamilies()` from `state.js`
- UI helpers from `helpers.js`

**npi-gates-editor.js** depends on:
- `familyGatesState` from `family-gates-data.js`
- `GATE_DEFS`, `getSelectedGateItems()` from `state.js`
- `prog()`, `progId` from `state.js`
- `npi.data` namespace

**gates.js** (modified) depends on:
- `getSelectedGateItems()` from `state.js`
- No new external dependencies

---

## 🧪 Testing Strategy

### Unit Tests

**tests/family-gates.test.js** (new file)
```javascript
describe('family-gates-data', () => {
  it('loads family gate templates from Supabase', ...)
  it('filters templates by family and gate number', ...)
  it('handles missing templates gracefully', ...)
  it('updates template item correctly', ...)
  it('deletes template item and updates state', ...)
})

describe('npi-gates-editor', () => {
  it('renders gate selector modal with family templates', ...)
  it('selects/deselects questions', ...)
  it('saves selection to gate_selections', ...)
  it('loads existing project selection on edit', ...)
})

describe('gates.js (tendering)', () => {
  it('filters checklist items by selection', ...)
  it('falls back to GATE_DEFS if no selection', ...)
  it('maintains checkmarks and signoff state', ...)
})
```

### Integration Tests

**tests/npi-tendering.test.js** (new file)
```javascript
describe('NPI Gate Tendering', () => {
  it('creates project with family gate templates', ...)
  it('displays only selected questions on gate page', ...)
  it('allows editing project gate selections', ...)
  it('real-time updates when family templates change', ...)
})
```

### E2E Tests (Manual)

**Workflow 1: Family Gate Template Setup**
```
1. Navigate to Product Family Database
2. Create family "Test HVAC"
3. Open Gate Templates for HVAC
4. Add custom question to Gate 0
5. Verify question appears in project creation flow
```

**Workflow 2: Project Creation with Custom Gates**
```
1. Create new NPI project, select "Test HVAC"
2. In "Select Gate Questions" step:
   - Verify Gate 0 shows new question
   - Uncheck 2 questions
   - Click "Customize" for Gate 1
3. Create project
4. Open project, go to Gate 0
5. Verify only selected questions shown
```

**Workflow 3: Edit Existing Project Gates**
```
1. Open existing project
2. Click "⚙ Edit Gate Questions"
3. Gate 0: Uncheck 3 more questions
4. Save
5. Gate 0 page now shows fewer items
6. Signoff workflow still works
```

**Workflow 4: Real-Time Update**
```
1. User A: Family Gates Manager → Add new question to Gate 2
2. User B: Creating new project, same family
3. Verify User B sees new question in Gate 2 selector
```

---

## 🚀 Rollout & Migration

### Backward Compatibility

- **Existing projects** continue to work unchanged
  - `gate_selections = null` → render all GATE_DEFS items
  - No data migration needed
  - No UI changes for existing projects

- **New projects** (post-feature launch)
  - Prompted to select family gate templates or use defaults
  - Created with `gate_selections` populated
  - Can edit gates anytime via dashboard

### Launch Checklist

- [ ] Database changes deployed to Supabase
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code reviewed and merged to main
- [ ] Documentation published
- [ ] Team trained on new feature
- [ ] Feature flag removed (if used)

### Monitoring

- Track: New projects created with custom gates
- Track: Projects editing gates post-launch
- Monitor: Database query performance (indexes)
- Monitor: Real-time subscription stability

---

## 📊 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Feature adoption | 60% of new projects use custom gates | Dashboard analytics |
| Time to create project | No increase | User timing metrics |
| Real-time sync lag | <500ms | Subscription latency logs |
| Test coverage | >85% | Jest coverage report |
| Page load time | <2s | Performance audit |
| User satisfaction | >4/5 | Survey (if applicable) |

---

## 📚 Related Documents

- **CLAUDE.md** — Architecture, state management, common mistakes
- **FAMILY_TEMPLATES_ARCHITECTURE.md** — Design pattern (to be mirrored)
- **TESTING_STRATEGY.md** — Testing patterns (to be extended)
- **README.md** — Project structure and portal overview
- **plans/NPI_TENDERING_GUIDE.md** — User guide (to be created in Phase 7)

---

## 🔗 Product-to-NPI Integration

### Tender Status Workflow

The NPI Gate Tendering feature is **triggered by product status change**:

```
Product Management Portal
    ↓
    User edits product → Status = "Tender"
    ↓
    productsDataUpdateProduct(productId, {status: "Tender"})
    ↓
    Hook: productTenderStatusTriggered(productId, productData)
    ↓
    Global Context: tenderedProductContext = {id, name, customer, family}
    ↓
    Navigate → NPI Portal → New Project Modal
    ↓
    Modal pre-fills: name, customer, family (from product)
    ↓
    Gate Selection Step: User picks which gate questions apply
    ↓
    Project Created with gate_selections saved
    ↓
    Gates display only selected questions throughout project lifecycle
```

### Data Linkage

**Option A: Implicit Linkage (Recommended)**
- Product name matches NPI project name
- Link maintained at UI level only
- No database foreign key needed
- Simpler, fewer schema changes

**Option B: Explicit Linkage (Alternative)**
- Add column to `programmes` table: `product_id UUID`
- FK reference to `products` table
- Enables "Create NPI Project" button on product row
- Richer querying (e.g., "show all NPI projects for product")
- Trade-off: More complex schema

**Decision:** Start with Option A (implicit). If needed, Option B can be added in Phase 8.

---

## 🔗 Key Architectural Decisions

### 1. Why JSON Blob for `gate_selections` instead of Normalized Table?

**Chosen: JSON Blob** (`programmes.gate_selections`)

```json
{ "0": [0, 2, 5], "1": [0, 1, 3, ...], ... }
```

**Pros:**
- ✅ Compact (1 column per project)
- ✅ Atomic (entire selection = single update)
- ✅ Flexible (easily add new gates without schema changes)
- ✅ No JOINs (loaded with programme in single query)
- ✅ Matches existing `gates` and `bom` JSONB patterns in `programmes`

**Alternative Considered: Normalized Table**

```sql
CREATE TABLE project_gate_selections (
  id UUID,
  project_id UUID,
  gate_number INT,
  selected_indices INT[],
  PRIMARY KEY(project_id, gate_number)
)
```

**Cons:**
- ❌ Extra JOINs when loading programme
- ❌ More rows = slower queries
- ❌ Requires migration for new schema
- ❌ Overkill for 6 gates per project

**Decision:** Use JSON blob. It's simpler, faster, and aligns with existing `programmes` structure.

---

### 2. Why Family-Level Templates, Not Project-Level Only?

**Chosen: Family + Project Level**

```
GATE_DEFS (hardcoded)
    ↓
Family Gate Templates (shared by family)
    ↓
Project Gate Selections (per-project override)
```

**Pros:**
- ✅ Teams can set defaults once per family
- ✅ New projects auto-inherit family standards
- ✅ Still allow per-project customization
- ✅ Reduces manual work for large teams

**Alternative Considered: Project-Only**

Allow each project to pick its own questions without family templates.

**Cons:**
- ❌ Every project requires manual setup
- ❌ No team standards
- ❌ Duplicate effort for similar projects

**Decision:** Family templates provide sensible defaults; projects can still override.

---

### 3. Why Store Selected Indices, Not Question Text?

**Chosen: Indices** (e.g., `[0, 2, 5]`)

```javascript
gate_selections["0"] = [0, 2, 5]  // Gate 0: questions 0, 2, 5 selected
```

**Pros:**
- ✅ Compact (integers, not strings)
- ✅ Resilient to GATE_DEFS question wording changes
- ✅ Easy to reorder (indices stay stable)
- ✅ Compatible with GATE_DEFS structure

**Alternative Considered: Store Question Text**

```javascript
gate_selections["0"] = [
  "ME resource confirmed available",
  "Bid submitted with ME input",
  ...
]
```

**Cons:**
- ❌ Large payload (duplicate text)
- ❌ Brittle (breaks if text changes)
- ❌ Harder to reorder

**Decision:** Use indices. Update mapping in gates.js rendering.

---

## 📋 Acceptance Criteria

### For Phase 0 (Integration Hook)
- [ ] Product status change to "Tender" is captured
- [ ] `productTenderStatusTriggered()` function called on status change
- [ ] Global `tenderedProductContext` populated with product data (id, name, customer, family)
- [ ] New Project modal opens automatically with pre-filled fields
- [ ] Modal shows hint: "Creating NPI Project for Product: <name> (Tendered)"
- [ ] Existing NPI project creation flow still works (no breaking changes)

### For Phase 1 (Database & Data Layer)
- [ ] Supabase table `family_gate_templates` created with correct schema
- [ ] RLS policies enforce user isolation
- [ ] `family-gates-data.js` loads templates without errors
- [ ] Real-time subscription works
- [ ] `programmes` table has `gate_selections` column

### For Phase 2 (Family Gate Manager UI)
- [ ] Family Gate Manager renders list of families
- [ ] Can add new gate question to a family/gate
- [ ] Can edit question text and order
- [ ] Can delete question
- [ ] Changes reflected immediately in state
- [ ] Responsive on mobile (single column, scrollable)

### For Phase 3 (Project Gate Question Selector)
- [ ] New project modal includes gate selection step
- [ ] Can select/deselect questions per gate
- [ ] Selection saved to `gate_selections` on create
- [ ] Existing projects can edit gates via dashboard button
- [ ] Changes persist to database

### For Phase 4 (Gate Rendering)
- [ ] Gate pages show only selected questions
- [ ] Checkbox state preserved
- [ ] Signoff workflow works unchanged
- [ ] Backward compatible (existing projects show all GATE_DEFS)

### For Phase 5 (Dashboard)
- [ ] Project cards show gate customization indicator
- [ ] Dashboard summary shows selection % per gate
- [ ] Family page shows project count using templates

### For Phase 6 (Testing)
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] E2E workflows tested manually
- [ ] Coverage >85%

### For Phase 7 (Documentation)
- [ ] User guide written and reviewed
- [ ] CLAUDE.md updated
- [ ] Code comments added
- [ ] README.md reflects new feature

---

## 🎯 Next Steps

1. **Immediate:** Review this plan with team; adjust priorities
2. **Phase 0 Start:** Implement product tender status trigger (minimal changes, fast)
3. **Phase 1 Start:** Create database schema and data layer
4. **Weekly Check-ins:** Review phase progress; adjust as needed
5. **Phase 2–7:** Follow implementation phases sequentially
6. **Final Review:** Team walkthrough before production launch

---

## 🗺️ Workflow Overview (End-to-End)

```
PRODUCT MANAGER
    ↓
    Creates new product in Product Management
    • Name: "HVAC Cooling Unit Pro"
    • Customer: "Acme Corp"
    • Family: "HVAC Systems"
    • Status: "Tender" ← TRIGGER
    ↓
SYSTEM RESPONSE (Phase 0)
    • Opens NPI New Project modal
    • Pre-fills: name, customer, family
    • Shows: "Creating NPI Project for Product: HVAC Cooling Unit Pro (Tendered)"
    ↓
PROJECT MANAGER / ENGINEER
    ↓
    Sees gate question selector (Phase 3)
    • Gate 0: Family templates loaded → 6 questions available
    • User: Selects 6 (all apply to HVAC)
    • Gate 1: 15 questions available → User selects 12
    • ... (Gates 2–5)
    ↓
    Creates NPI project with gate_selections saved
    ↓
APQP PROCESS
    ↓
    Project gates display only selected questions (Phase 4)
    • Gate 0: Shows 6 questions (not all possible)
    • Team completes checks, signs off
    • Only selected questions in audit trail
    ↓
    Project progresses through gates 0→5 normally
    ↓
COMPLETION
    ↓
    All gates signed off
    Product moves from Tender → NPI → Production (manually updated in Product Management)
```

---

## 📞 Questions & Notes

**Q: What if a question is deleted from family gates after a project already uses it?**
A: Indices remain valid. If question at index 5 is deleted, we filter out index 5 from display. UI shows "selected 5 from 14 available" (smaller number). No data loss.

**Q: Can users copy gate templates from one family to another?**
A: Out of scope for Phase 1. Could be added in Phase 8 as enhancement.

**Q: Do gate selections affect gate signoff workflow?**
A: No. Signoff remains unchanged. Only the *displayed* questions change.

**Q: What if a project has no family (null family)?**
A: Use all GATE_DEFS items. Optional: prompt user to assign family.

**Q: How are gate selections versioned?**
A: Not versioned in Phase 1. Audit trail via Supabase `updated_at` timestamp. History queries can reconstruct.

---

**Plan Status:** ✅ Ready for implementation
**Last Updated:** 2026-03-14
**Author:** Claude (AI Assistant)
