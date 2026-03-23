# NPI Project Creation & Gate Workflow — Comprehensive Guide

**Purpose:** Document the NPI (New Product Introduction) project lifecycle, gate workflow, and integration with product tendering and gate customization features.

---

## 📋 Overview

An **NPI Project** is a structured APQP (Advanced Product Quality Planning) workflow for introducing new manufactured products through 6 quality gates (0–5).

**Location:** `portals/product-development/npi/`

**Key Entities:**
- **Projects (Projects)** — Container for APQP data
- **Gates** — 6 sequential quality checkpoints
- **Checklists** — Items to complete per gate
- **Sign-offs** — Required approvals per gate
- **Gate Selections** — Customizable questions per project (tendering feature)

---

## 🗂️ NPI Project Structure

### Data Model

An NPI project is stored in the `projects` table with this structure:

```javascript
{
  // Identification
  id: UUID,                      // Project ID
  name: "HVAC Cooling Unit Pro", // Project name
  customer: "Acme Corp",         // Customer name
  unit: "CU-Pro-2024",           // Model/unit designation
  family: "hvac",                // Product family ID

  // Team
  lead: "John Smith",            // Lead engineer email
  pm: "Sarah Johnson",           // Project manager email
  date: "2024-03-01",            // Start date (YYYY-MM-DD)

  // APQP Content (all mandatory fields per GATE_DEFS)
  ctq: [
    { id: 'cq_xxxxx', text: "Cooling efficiency", unit: "%", target: 95 },
    ...
  ],
  pfd: [
    { id: 'pd_xxxxx', step: 1, description: "Pre-check system", owner: "ME" },
    ...
  ],
  pfmea: [
    { id: 'f_xxxxx', _type: 'mode', step: 1, mode: "Compressor failure",
      effects: [ { id: 'e_xxxxx', effect: "No cooling", sev: 9,
        causes: [ { id: 'c_xxxxx', cause: "Wear", occ: 3, det: 2, ... } ]
      } ] },
    ...
  ],
  cp: [
    { id: 'cp_xxxxx', step: 1, param: "Pressure", method: "Analog gauge", owner: "QA" },
    ...
  ],
  bom: {
    parts: [ { id: 'p_xxxxx', num: 1, desc: "Compressor", qty: 1, unit: "ea", supplier: "CoolTech" }, ... ],
    tools: [ ... ],
    equip: [ ... ],
    mat: [ ... ],
    cons: [ ... ],
    kits: [ ... ]
  },

  // Gate Sign-Offs (6 gates, indices 0–5)
  gates: [
    {
      gateNum: 0,
      checks: [true, false, true, ...],     // Checklist item completion
      sigs: [
        { role: "ME Lead", name: "John Smith", date: "2024-03-14", signed: true },
        { role: "PM", name: "", date: "", signed: false }
      ]
    },
    {
      gateNum: 1,
      checks: [],
      sigs: []
    },
    ...
  ],

  // Gate Selection (Tendering Feature)
  gate_selections: {
    "0": [0, 1, 3, 5],        // Gate 0: selected question indices (custom)
    "1": [0, 1, 2, 3, 4, 6],  // Gate 1: selected questions
    "2": null,                 // Gate 2: use all GATE_DEFS (null = all)
    "3": null,
    "4": null,
    "5": null
  },

  // Trackers
  actions: [ { id: 'a_xxxxx', text: "Confirm ME resources", owner: "John", status: "open", due: "2024-03-20" }, ... ],
  risks: [ { id: 'r_xxxxx', text: "Supply chain delay", impact: 8, mitigation: "...", owner: "Sarah" }, ... ],

  // Timing & Planning
  timing: [ { id: 't_xxxxx', week: 0, task: "Kick-off meeting", owner: "PM", status: "done" }, ... ],
  gantt: [ ... ],  // Gantt chart data for production planning

  // Sub-Assemblies (if multi-tier product)
  subAssemblies: [ { id: 'sa_xxxxx', name: "Cooling Fan", status: "..." }, ... ],

  // Audit
  user_id: UUID,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  created_by_name: "John@company.com"
}
```

---

## 🔄 Project Lifecycle

### Phase 1: Project Creation

#### Trigger Point: Product Status = "Tender"

```
Product Management Portal
    ↓ User sets product status to "Tender"
    ↓
productTenderStatusTriggered(productId)
    ├─ Store product context: tenderedProductContext = {id, name, customer, family}
    ├─ Navigate to NPI → New Project modal
    │
    └─ Modal auto-opens with pre-filled fields:
       ├─ name: (from product)
       ├─ customer: (from product)
       ├─ family: (from product)
       └─ Ready for user to complete
```

#### User Completes Project Creation

```
1. New Project Modal Opens
   ├─ Fields to fill:
   │  ├─ Project name (pre-filled from product)
   │  ├─ Customer (pre-filled)
   │  ├─ Unit / Model designation
   │  ├─ Family (pre-filled from product)
   │  ├─ Lead engineer (dropdown or text)
   │  └─ Project manager (dropdown or text)
   │
   └─ Step 2: Gate Question Selection
      ├─ Display all 6 gates (0–5)
      ├─ For each gate:
      │  ├─ Load family gate templates (familyGatesGetByFamily)
      │  ├─ Show: "X selected from Y total"
      │  └─ Checkbox list: select which questions apply
      │
      ├─ Options:
      │  ├─ "Use all family defaults" (auto-select all)
      │  └─ "Customize by gate" (manual selection)
      │
      └─ Click "Create Project"

2. Project Created in Database
   ├─ INSERT INTO projects (name, customer, family, unit, lead, pm, ...)
   ├─ Initialize empty arrays: ctq=[], pfd=[], pfmea=[], etc.
   ├─ Initialize gates: [6 empty gate objects]
   ├─ Set gate_selections: {0: [selected indices], 1: [...], ...}
   │
   └─ Redirect to NPI Dashboard or Gate 0

3. User Begins APQP Process
   └─ Start filling in CTQ, PFMEA, CP, BOM, Gates, etc.
```

---

### Phase 2: APQP Content Development

User fills in APQP elements:

```
NPI Dashboard
    ├─ CTQ (Critical-to-Quality) Tab
    │  └─ Add characteristics, units, targets
    │
    ├─ PFD (Process Flow Diagram) Tab
    │  └─ Define process steps, owners
    │
    ├─ PFMEA Tab
    │  └─ Failure modes, effects, causes, controls, RPN
    │
    ├─ CP (Control Plan) Tab
    │  └─ Control parameters, methods, owners
    │
    ├─ BOM Tab
    │  └─ Parts, tools, equipment, materials, kits
    │
    ├─ Timing & Planning Tab
    │  └─ Gantt chart, milestones
    │
    └─ Trackers Tab
       ├─ Actions (open items)
       └─ Risks (risk tracking)
```

**Data Persistence:** Changes debounced and saved to Supabase (800ms–900ms delay).

---

### Phase 3: Gate Workflow

#### Before Gate: Review & Prep

```
User: Opens Gate 0 (or Gate N)
    ↓
System: renderGatePage(gateNum)
    ├─ Load gate definition from GATE_DEFS[gateNum]
    ├─ Load project gate_selections[gateNum]
    ├─ Filter GATE_DEFS items using selection indices
    │  (render only selected questions)
    │
    ├─ Display banner:
    │  "⏸ Not yet started — 6 checklist items"
    │  (based on selected count, not total GATE_DEFS count)
    │
    ├─ Checklist:
    │  └─ [✓] Question 1
    │  └─ [ ] Question 2
    │  └─ [✓] Question 3
    │  └─ ... (only selected questions shown)
    │
    └─ Signatory cards:
       ├─ ME Lead: [ ] Pending sign-off
       └─ PM: [ ] Pending sign-off
```

#### Complete Checklist

```
User: Works through checklist
    ├─ Clicks checkboxes to mark items complete
    ├─ System: npi.gate.toggleCheck(gateNum, itemIndex, checked)
    │   └─ Updates projects.gates[gateNum].checks[itemIndex] = checked
    │   └─ Saves to Supabase (debounced)
    │
    └─ Banner updates in real-time:
       "⚙ In progress — 4/6 items checked · 0/2 signed"
```

#### Sign Off (Approval)

```
User (e.g., ME Lead): Reviews completed checklist
    ↓
Enters name: "John Smith"
    ↓
Enters sign-off date: "2024-03-14"
    ↓
Clicks: "Sign Off"
    ↓
System: npi.gate.signOff(gateNum, sigIndex)
    ├─ Update: projects.gates[gateNum].sigs[sigIndex].signed = true
    ├─ Save to Supabase
    │
    └─ Display: "✓ Signed" (green badge)

When all signatories signed:
    ├─ Banner turns green
    ├─ Display: "✓ Gate signed off by all required signatories"
    │
    └─ Enable next gate button
```

#### Undo Sign-Off (if needed)

```
User: Clicks "Undo sign-off"
    ↓
System: npi.gate.unsign(gateNum, sigIndex)
    ├─ Set signed = false
    ├─ Clear name and date
    ├─ Save to Supabase
    │
    └─ Return to "Pending" state
```

---

### Phase 4: Progress Through Gates

```
Gate 0 (Concept & Planning)
    ├─ Items: ME resources, bidding, scope definition, CTQ requirements
    ├─ Signatories: ME Lead, PM
    └─ Status: All signed off ✓

Gate 1 (Product Design & Development)
    ├─ Items: Design reviews, prototype built, testing, specifications confirmed
    ├─ Signatories: Engineering Lead, Quality Manager
    └─ Status: In progress (4/6 items, 1/2 signed)

Gate 2 (Process Design & Development)
    ├─ Items: Process capability, supplier selection, control plan finalized
    ├─ Signatories: Manufacturing Engineering, Process Owner
    └─ Status: Not started

Gate 3 (Design & Process Validation)
    ├─ Signatories: Quality Assurance, Operations
    └─ Status: Not started

Gate 4 (Production Launch Readiness)
    ├─ Signatories: Plant Manager, Materials Manager
    └─ Status: Not started

Gate 5 (Production Follow-Up)
    ├─ Signatories: Quality Manager, Continuous Improvement Lead
    └─ Status: Not started
```

---

## 🎯 Gate Selections (Tendering Feature)

### What is Gate Selection?

Allows customization of which gate checklist items appear for a project.

**Scenario:**
- Family "HVAC" has 15 possible Gate 1 questions
- Project "HVAC-Cooling-Unit" only needs 12 of them
- 3 questions about pneumatic controls don't apply
- User unchecks those 3 in the selector
- Gate 1 page shows only 12 questions

### Data Storage

```javascript
// In projects table: gate_selections JSONB column

gate_selections: {
  "0": [0, 1, 3, 5, 6],             // Gate 0: 5 selected from 6 total
  "1": [0, 1, 2, 3, 4, 6, 7, 10],  // Gate 1: 8 selected from 15 total
  "2": null,                         // Gate 2: null = use all GATE_DEFS
  "3": null,
  "4": null,
  "5": null
}

// Indices map to GATE_DEFS[gateNum].items
// e.g., GATE_DEFS[0].items[0] = "ME resource confirmed available"
```

### Selection Workflow

```
1. Create New Project
   ├─ Step: Family selection (e.g., "HVAC")
   └─ Step: Gate Question Selection
      ├─ Load familyGatesGetByFamily("hvac")
      ├─ Display 6 gate tabs
      ├─ For each gate:
      │  ├─ Show all available family questions
      │  ├─ Pre-select all as default
      │  └─ User can uncheck specific ones
      │
      └─ Save selection: gate_selections = {0: [...], 1: [...], ...}

2. Edit Existing Project Gates
   ├─ Button: "⚙ Edit Gate Questions"
   ├─ Opens selector modal
   ├─ Shows current selection per gate
   ├─ User customizes
   └─ Saves: UPDATE projects SET gate_selections = {...}

3. Render Gate Page
   ├─ Load gate_selections[gateNum]
   ├─ Filter GATE_DEFS[gateNum].items using selected indices
   ├─ Render only filtered questions
   └─ Display: "6 selected / 15 available" (if customized)
```

---

## 🔗 File Organization

### Core Files

```
portals/product-development/npi/js/
├── npi.js                    # Main namespace definition
├── npi-data.js               # Data layer (CRUD mutations)
├── npi-components.js         # Reusable UI components (badges, inputs)
├── npi-constants.js          # GANTT_WEEKS, gate definitions, etc.
│
├── apqp.js                   # Dispatcher (renders CTQ/PFD/CP based on tab)
├── npi-ctq.js                # CTQ tab (add, edit, delete CTQ)
├── npi-pfd.js                # PFD tab (process flow)
├── npi-cp.js                 # CP tab (control plan)
│
├── gates.js                  # Gate rendering & checklist + sign-off
├── npi-gates-editor.js       # Gate question selector (Phase 3)
│
├── pfmea.js                  # PFMEA table & RPN calculation
├── rpn-chart.js              # RPN trend chart
│
├── timing.js                 # Timing plan & Gantt
├── bom.js                    # Bill of Materials by category
├── trackers.js               # Actions & Risks
│
├── dashboard.js              # NPI dashboard + project CRUD
├── npi-orchestrator.js       # Main coordinator (init, render dispatch)
```

### Data Layer Functions

**Common pattern in npi-data.js:**

```javascript
npi.data.ctq = {
  add: (text, unit, target) => { ... },
  update: (id, text, unit, target) => { ... },
  delete: (id) => { ... }
};

npi.data.gate = {
  toggleCheck: (gateNum, itemIndex, checked) => { ... },
  updSig: (gateNum, sigIndex, field, value) => { ... },
  signOff: (gateNum, sigIndex) => { ... },
  unsign: (gateNum, sigIndex) => { ... },
  updateSelection: (gateNum, selectedIndices) => { ... }  // NEW (Phase 3)
};

npi.data.pfmea = {
  addMode: (step, mode) => { ... },
  addEffect: (modeId, effect, severity) => { ... },
  addCause: (effectId, cause, occ, det) => { ... },
  ...
};

// All persist to Supabase and update global `db` state
```

---

## 📊 State Management

### Global State Variables

```javascript
// In state.js
let progId = null;                     // Currently active project
let apqpTab = 'ctq';                   // Active APQP tab (ctq|pfd|pfmea|cp|gates|bom|timing|trackers)

// Helpers
function prog() {
  return db.projects.find(p => p.id === progId);
}

function getSelectedGateItems(projectId, gateNum) {
  const p = prog();
  if (!p) return [];
  if (!p.gate_selections || !p.gate_selections[gateNum]) {
    // Fallback: all items selected
    return GATE_DEFS[gateNum].items.map((_, i) => i);
  }
  return p.gate_selections[gateNum];
}
```

---

## 🔄 Real-Time Collaboration

### Scenario: Two Users Editing Same Project

```
User A: Opens project → Gate 0
    ├─ Loads project data
    └─ Subscribes to gate changes

User A: Checks item 1
    ├─ Updates projects.gates[0].checks[0] = true
    ├─ Saves to Supabase
    │
    └─ Subscription triggers on User B's browser:
       onUpdate: (row) => {
         // Update local state
         prog().gates[0].checks = row.gates[0].checks;
         // Re-render gate page
         render();
       }

Result: User B sees checkbox 1 checked without refresh (real-time)
```

---

## 🧪 Testing Scenarios

### Test Case 1: Product to Project Flow

```
Setup:
  - Create product "Test HVAC Unit" with status "Production"

Test:
  1. Change status to "Tender"
  2. Verify NPI New Project modal opens
  3. Verify name, customer, family pre-filled
  4. Complete project creation with gate selection
  5. Verify gate_selections populated in database

Verify:
  - Gate page shows only selected questions (not all)
  - Selection indices map correctly to GATE_DEFS
```

### Test Case 2: Gate Checklist Workflow

```
Setup:
  - Create project with Gate 0 selected (6 questions)

Test:
  1. Open Gate 0
  2. Check items 1, 3, 5
  3. Verify UI shows "3/6 items" progress
  4. Enter signatory 1 name, date, click "Sign Off"
  5. Verify UI shows "1/2 signed", green badge
  6. Enter signatory 2 name, date, click "Sign Off"
  7. Verify gate turns fully green "Signed off"
  8. Click "Undo sign-off" on signatory 1
  9. Verify returns to "Pending" state

Verify:
  - All state changes persisted to Supabase
  - Other users see updates in real-time
```

### Test Case 3: Gate Selection Customization

```
Setup:
  - Create project with family "HVAC"
  - Family has 15 Gate 1 questions

Test:
  1. In New Project modal, view Gate 1 selector
  2. Uncheck questions 10, 12, 14
  3. Verify count shows "12 selected from 15"
  4. Save project
  5. Open Gate 1 page
  6. Verify only 12 questions displayed (10, 12, 14 not shown)
  7. Click "Edit Gate Questions"
  8. Check question 10 back
  9. Verify Gate 1 now shows 13 questions

Verify:
  - gate_selections JSON correctly filters items
  - Unchecked questions truly hidden (not just greyed out)
```

---

## 📚 Related Documentation

- **CLAUDE.md** — Core architecture, state management
- **NPI_TENDERING_FEATURE_PLAN.md** — Multi-phase implementation plan
- **docs/reference/FAMILY_TEMPLATES_ARCHITECTURE.md** — Family PFMEA templates (similar pattern)
- **TESTING_STRATEGY.md** — Jest testing framework & patterns

---

## 🤔 FAQ for Future AI

**Q: How are gate items numbered/indexed?**
A: Each gate in GATE_DEFS has an `items[]` array. Index 0 = first item, index 1 = second, etc. gate_selections stores these indices.

**Q: What if user selects 0 items for a gate?**
A: Allowed (edge case). Gate page would show "0/0 items" and blank checklist. Not ideal UX, but technically valid.

**Q: Can gate selections be edited after project created?**
A: Yes. Button "⚙ Edit Gate Questions" in dashboard allows modification anytime.

**Q: What happens if family templates change after project created?**
A: Project remains unchanged. gate_selections is a snapshot taken at creation. Family template changes don't auto-update existing projects.

**Q: How does gate_selections interact with already-checked items?**
A: If user checked items [0, 1, 3, 5] in Gate 0, then later unchecks item 1 in selector, item 1 is removed from display but check state persists in database. If re-selected later, check state is restored.

**Q: What's the difference between `checks[]` and `gate_selections`?**
A: `checks[]` = completion status (true/false per item). `gate_selections` = which items are applicable (indices). Both stored together in `projects.gates[gateNum]`.

---

**Last Updated:** 2026-03-21
**Status:** Reference guide for current NPI workflow and gate-scope behaviour
**Audience:** AI assistants, developers, system integrators
