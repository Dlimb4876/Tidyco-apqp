# APQP Gates & GATE_DEFS — Technical Reference

**Purpose:** Document the structure of APQP gates, checklist items, signatories, and how gate customization (tendering feature) interacts with GATE_DEFS.

---

## 📋 Overview

The **GATE_DEFS** constant defines the structure of all 6 APQP quality gates (0–5). Each gate has:
- **Name** (e.g., "Concept & Project Planning")
- **Phase** (e.g., "Design Phase")
- **Checklist items** — Questions/criteria to verify
- **Required signatories** — Roles that must sign off
- **Gate number** (0–5)

**Location:** `core/js/state.js` (defined at line ~180)

---

## 🗂️ GATE_DEFS Structure

### Definition Format

```javascript
const GATE_DEFS = [
  // Gate 0
  {
    num: 0,
    name: "Concept & Project Planning",
    phase: "Design",
    signatories: ["ME Lead", "PM"],
    items: [
      "ME resource confirmed available",
      "Bid submitted with ME input",
      "Contract awarded and signed",
      "Project file opened",
      "Project team assigned",
      "Preliminary timeline established"
    ]
  },

  // Gate 1
  {
    num: 1,
    name: "Product Design & Development",
    phase: "Design",
    signatories: ["Engineering Lead", "Quality Manager"],
    items: [
      "All specification information reviewed",
      "Critical-to-Quality requirements identified",
      "Internal CTQ metrics agreed with customer",
      // ... more items
    ]
  },

  // Gates 2–5 follow same pattern
];
```

### Key Properties

| Property | Type | Purpose | Example |
|----------|------|---------|---------|
| `num` | Integer | Gate number (0–5) | `0` |
| `name` | String | Full gate name | `"Concept & Project Planning"` |
| `phase` | String | Workflow phase | `"Design"` or `"Validation"` |
| `signatories` | Array[String] | Required signatory roles | `["ME Lead", "PM"]` |
| `items` | Array[String] | Checklist questions | `["Item 1", "Item 2", ...]` |

---

## 🎯 Gate Details

### Gate 0: Concept & Project Planning

**Purpose:** Project initiation, team alignment, scope definition

**Signatories:** ME Lead, PM

**Checklist Items (~6):**
1. ME resource confirmed available
2. Bid submitted with ME input
3. Contract awarded and signed
4. Project file opened
5. Project team assigned
6. Preliminary timeline established

**Typical Timeline:** 1–2 weeks

---

### Gate 1: Product Design & Development

**Purpose:** Detailed design, specification review, prototype validation

**Signatories:** Engineering Lead, Quality Manager

**Checklist Items (~15):**
1. All specification information reviewed
2. Critical-to-Quality requirements identified
3. Internal CTQ metrics agreed with customer
4. All tolerances confirmed measurable
5. Design review completed
6. Prototype built and tested
7. Performance verified against specifications
8. Design FMEA completed
9. Design controls established
10. Supplier evaluation performed
11. Make vs. buy decisions documented
12. Design feasibility confirmed
13. Preliminary process design started
14. Cost analysis completed
15. Design documentation finalized

**Typical Timeline:** 4–6 weeks

---

### Gate 2: Process Design & Development

**Purpose:** Manufacturing process design, supplier finalization, process capability

**Signatories:** Manufacturing Engineer, Process Owner

**Checklist Items (~14):**
1. Process flow diagram finalized
2. Process capability study planned
3. Suppliers selected and approved
4. Preliminary control plan created
5. Process FMEA initiated
6. Work instructions drafted
7. Equipment requirements identified
8. Tooling designed
9. Raw material specifications confirmed
10. Preventive maintenance plan outlined
11. Layout and material flow confirmed
12. Production ramp-up plan created
13. Quality system requirements defined
14. Process documentation reviewed

**Typical Timeline:** 3–4 weeks

---

### Gate 3: Design & Process Validation

**Purpose:** Process capability confirmed, controls validated, launch readiness assessed

**Signatories:** Quality Assurance, Operations Manager

**Checklist Items (~12):**
1. Process capability studies completed
2. Process FMEA finalized
3. Control plan finalized
4. Mistake-proofing controls in place
5. Statistical process control plan confirmed
6. Measurement system analysis (MSA) completed
7. Production trial runs successful
8. Product audit completed and approved
9. Packaging design finalized
10. Labeling and documentation approved
11. Customer approval obtained
12. Production readiness confirmed

**Typical Timeline:** 2–3 weeks

---

### Gate 4: Production Launch Readiness

**Purpose:** Final checks, full capacity confirmation, go/no-go decision

**Signatories:** Plant Manager, Materials Manager

**Checklist Items (~10):**
1. All equipment installed and calibrated
2. Work instructions approved and posted
3. Quality system operational
4. Key personnel trained
5. Material supply confirmed
6. Inventory targets established
7. Shipping procedures confirmed
8. Supplier delivery confirmed on schedule
9. Customer notification sent
10. Launch approval granted

**Typical Timeline:** 1–2 weeks

---

### Gate 5: Production Follow-Up

**Purpose:** Ongoing monitoring, issue resolution, lessons learned

**Signatories:** Quality Manager, Continuous Improvement Lead

**Checklist Items (~8):**
1. First article inspection completed
2. Production at target volume
3. Quality issues resolved
4. Customer feedback received
5. Process improvements identified
6. Cost targets achieved
7. Warranty performance acceptable
8. Lessons learned documented

**Typical Timeline:** Ongoing (4–8 weeks post-launch)

---

## 📊 Total Checklist Items by Gate

| Gate | Name | Total Items | Signatories |
|------|------|-------------|-------------|
| 0 | Concept & Planning | 6 | 2 (ME Lead, PM) |
| 1 | Product Design & Dev | 15 | 2 (Eng Lead, QA Mgr) |
| 2 | Process Design & Dev | 14 | 2 (Mfg Eng, Process Owner) |
| 3 | Design & Validation | 12 | 2 (QA, Ops Mgr) |
| 4 | Launch Readiness | 10 | 2 (Plant Mgr, Materials Mgr) |
| 5 | Production Follow-Up | 8 | 2 (QA Mgr, CI Lead) |
| **TOTAL** | | **65** | **12 unique roles** |

---

## 🔄 Gate Selection Indexing

### How Indices Work

Each gate's `items[]` array is indexed 0 to N-1:

```javascript
GATE_DEFS[0].items = [
  "ME resource confirmed available",           // Index 0
  "Bid submitted with ME input",               // Index 1
  "Contract awarded and signed",               // Index 2
  "Project file opened",                     // Index 3
  "Project team assigned",                     // Index 4
  "Preliminary timeline established"           // Index 5
]
```

When a project has `gate_selections["0"] = [0, 2, 4]`, it means:
- Show items at indices 0, 2, 4
- Hide items at indices 1, 3, 5
- Display: only "ME resource...", "Contract awarded...", "Project team..."

### Rendering Logic

```javascript
// In gates.js::npi.gate.renderGatePage(gateNum)

const gateDefinition = GATE_DEFS[gateNum];           // e.g., GATE_DEFS[0]
const selectedIndices = getSelectedGateItems(progId, gateNum);  // e.g., [0, 2, 4]

// Filter GATE_DEFS items using selected indices
const displayedItems = gateDefinition.items.filter((item, index) =>
  selectedIndices.includes(index)
);

// Render only displayedItems
// Result: 3 checkboxes shown (not 6)
```

---

## 💾 Gate Data in Project

### Project Gate Structure

Each project has a `gates[]` array with 6 objects (one per gate):

```javascript
projects[n].gates = [
  {
    gateNum: 0,
    checks: [true, false, true, false, true, false],  // Completion status
    sigs: [
      {role: "ME Lead", name: "John Smith", date: "2024-03-14", signed: true},
      {role: "PM", name: "Sarah Johnson", date: "2024-03-15", signed: true}
    ]
  },
  {
    gateNum: 1,
    checks: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    sigs: [
      {role: "Engineering Lead", name: "", date: "", signed: false},
      {role: "Quality Manager", name: "", date: "", signed: false}
    ]
  },
  // ... Gates 2–5
]
```

### Interaction with gate_selections

```javascript
// Example: Gate 0 has gate_selections["0"] = [0, 2, 4]
// checks array still has all 6 positions: [true, false, true, false, true, false]
// But when rendering, only display checks[0], checks[2], checks[4]

// Why?
// - Decouples display (selection) from state (checks)
// - If user later changes gate_selections, checks data is preserved
// - User can toggle selection without losing check state
```

---

## 🎨 Rendering Checklist with Selections

### Before (No Gate Selection)

```
Gate 0 Page
├─ "ME resource confirmed available"        [✓]
├─ "Bid submitted with ME input"             [ ]
├─ "Contract awarded and signed"             [✓]
├─ "Project file opened"                   [ ]
├─ "Project team assigned"                   [✓]
└─ "Preliminary timeline established"        [ ]
   Progress: 3/6 items
```

### After (With Gate Selection: [0, 2, 4])

```
Gate 0 Page
├─ "ME resource confirmed available"        [✓]
├─ "Contract awarded and signed"             [✓]
├─ "Project team assigned"                   [✓]
   Progress: 3/3 items
   (or: 3 selected / 6 available)
```

**Visual Change:**
- Items 1, 3, 5 are completely hidden (not greyed out)
- Progress counter shows 3/3 (not 3/6)
- Optional badge: "⚙ 3 selected / 6 available"

---

## 📝 Default Gate_Selections Logic

### Fallback Behavior

```javascript
function getSelectedGateItems(projectId, gateNum) {
  const p = prog();
  if (!p) return [];

  // If gate_selections doesn't exist or is empty, use all items
  if (!p.gate_selections || !p.gate_selections[gateNum]) {
    const totalItems = GATE_DEFS[gateNum].items.length;
    return Array.from({length: totalItems}, (_, i) => i);  // [0, 1, 2, ..., N-1]
  }

  // Use custom selection
  return p.gate_selections[gateNum];
}
```

**Result:**
- **Old projects (pre-tendering):** No gate_selections → show all GATE_DEFS items (backward compatible)
- **New projects (post-tendering):** gate_selections populated → show only selected items

---

## 🔐 Signatories Logic

### Why Signatories are Fixed (Not Customizable)

Signatories define **required roles** for each gate, not individual people.

```javascript
GATE_DEFS[0].signatories = ["ME Lead", "PM"]

// This means:
// - Role 1: "ME Lead" (could be John, Jane, etc.)
// - Role 2: "PM" (could be Sarah, Bob, etc.)

projects[0].gates[0].sigs = [
  {role: "ME Lead", name: "", date: "", signed: false},
  {role: "PM", name: "", date: "", signed: false}
]

// User fills in actual names when signing
```

**Not Customizable Because:**
- Signatories define **governance** (who can approve)
- Gate selections define **scope** (which items to verify)
- These are separate concerns

---

## 🛠️ Modifying GATE_DEFS

### Scenario 1: Add New Checklist Item to Gate 1

**Current:** Gate 1 has 15 items

**Change:** Add "Design freeze confirmed" as item 16

```javascript
// In npi-constants.js
const GATE_DEFS = [
  {
    num: 0,
    // ... (unchanged)
  },
  {
    num: 1,
    // ... (other properties)
    items: [
      "All specification information reviewed",
      // ... (existing 15 items)
      "Design freeze confirmed"  // NEW ITEM (index 15)
    ]
  },
  // ... (gates 2–5)
];
```

**Impact:**
- **New projects:** Will see 16 items in Gate 1 selector
- **Existing projects:** Will automatically include index 15 in gate_selections (if family template updated)
- **Projects without gate_selections:** Show all 16 items (fallback)

**Migration:** Optional — can update existing projects' gate_selections, or leave as-is (they'll use all 16).

---

### Scenario 2: Remove Checklist Item

**Current:** Gate 0 item 4 ("Project team assigned") is redundant

**Problem:** If you delete it, indices shift:
```javascript
// Old:
items[0] = "ME resource..."
items[1] = "Bid submitted..."
items[2] = "Contract awarded..."
items[3] = "Project file..."
items[4] = "Project team..."        // ← Delete this
items[5] = "Preliminary timeline..."

// New (if deleted):
items[0] = "ME resource..."
items[1] = "Bid submitted..."
items[2] = "Contract awarded..."
items[3] = "Project file..."
items[4] = "Preliminary timeline..."  // ← Index changed!
```

**Issue:** Projects with `gate_selections["0"] = [0, 2, 4]` now reference wrong item (used to be "Project team", now "Preliminary timeline").

**Solution:** Mark as archived instead of deleting:

```javascript
items: [
  "ME resource...",
  "Bid submitted...",
  "Contract awarded...",
  "Project file...",
  "(Archived) Project team assigned",  // Mark but keep
  "Preliminary timeline..."
]
```

Or maintain a migration map:
```javascript
const INDEX_MIGRATION = {
  0: {0: 0, 1: 1, 2: 2, 3: 3, 5: 4}  // Old Gate 0 index -> New Gate 0 index
};
```

---

### Scenario 3: Reorder Checklist Items

**Current:** Gate 1 items are in document order, not logical order

**Change:** Move "Design freeze confirmed" to position 2

```javascript
// Old:
items: [
  "All specifications reviewed",        // 0
  "CTQ identified",                     // 1
  "Design freeze confirmed",            // 2 (should be earlier)
  "Internal CTQ metrics...",            // 3
  // ...
]

// New:
items: [
  "All specifications reviewed",        // 0
  "Design freeze confirmed",            // 1 (moved up)
  "CTQ identified",                     // 2 (shifted down)
  "Internal CTQ metrics...",            // 3
  // ...
]
```

**Impact:** All projects' gate_selections[1] indices are now wrong!

**Solution:** Use a re-index migration:
```javascript
const GATE1_REINDEX = {
  0: 0,  // spec review: index 0 → 0
  1: 2,  // CTQ identified: index 1 → 2
  2: 1,  // design freeze: index 2 → 1
  3: 3,  // CTQ metrics: index 3 → 3
  // ...
};

// After deploying new GATE_DEFS, run migration:
db.projects.forEach(p => {
  if (p.gate_selections && p.gate_selections[1]) {
    p.gate_selections[1] = p.gate_selections[1]
      .map(oldIndex => GATE1_REINDEX[oldIndex])
      .sort((a, b) => a - b);
  }
});
```

**Recommendation:** Minimize reordering. Add new items at the end, mark obsolete items, don't delete.

---

## 🧪 Testing GATE_DEFS

### Validation Test

```javascript
describe('GATE_DEFS', () => {
  it('has 6 gates', () => {
    expect(GATE_DEFS.length).toBe(6);
  });

  it('gates numbered 0-5', () => {
    GATE_DEFS.forEach((gate, i) => {
      expect(gate.num).toBe(i);
    });
  });

  it('gates have items array', () => {
    GATE_DEFS.forEach(gate => {
      expect(Array.isArray(gate.items)).toBe(true);
      expect(gate.items.length).toBeGreaterThan(0);
    });
  });

  it('gates have signatories', () => {
    GATE_DEFS.forEach(gate => {
      expect(Array.isArray(gate.signatories)).toBe(true);
      expect(gate.signatories.length).toBeGreaterThan(0);
    });
  });
});
```

### Gate Selection Test

```javascript
describe('Gate Selection Rendering', () => {
  it('filters items by selection indices', () => {
    const gateNum = 0;
    const selectedIndices = [0, 2, 4];
    const gateDefinition = GATE_DEFS[gateNum];

    const displayedItems = gateDefinition.items.filter((_, index) =>
      selectedIndices.includes(index)
    );

    expect(displayedItems.length).toBe(3);
    expect(displayedItems[0]).toBe(gateDefinition.items[0]);
    expect(displayedItems[1]).toBe(gateDefinition.items[2]);
    expect(displayedItems[2]).toBe(gateDefinition.items[4]);
  });
});
```

---

## 📊 Summary Table: Items per Gate

| Gate | # Items | # Signatories | Est. Duration | Focus |
|------|---------|---------------|---------------|-------|
| 0 | 6 | 2 | 1-2 weeks | Initiation |
| 1 | 15 | 2 | 4-6 weeks | Design |
| 2 | 14 | 2 | 3-4 weeks | Process |
| 3 | 12 | 2 | 2-3 weeks | Validation |
| 4 | 10 | 2 | 1-2 weeks | Launch |
| 5 | 8 | 2 | 4-8 weeks | Follow-up |

---

## 🔗 Related Documentation

- **CLAUDE.md** — Constants, state management
- **NPI_PROJECT_FLOW_GUIDE.md** — Gate workflow in practice
- **NPI_TENDERING_FEATURE_PLAN.md** — How gate customization works
- **TESTING_STRATEGY.md** — Jest testing patterns

---

## 🤔 FAQ

**Q: Why are there exactly 6 gates?**
A: APQP standard defines 6 gates from concept through production follow-up. This aligns with automotive (IATF) and medical (FDA) quality standards.

**Q: Can I add a 7th gate?**
A: Technically yes, but breaks APQP standard. Stick with 6. If you need more checkpoints, use sub-gates or add items to existing gates.

**Q: What if a project only needs 3 gates?**
A: Set gate_selections to show items for gates 0–2 only, and leave gates 3–5 with empty items. Not ideal UX, but technically works.

**Q: Can signatories be customized per project?**
A: No (by design). Signatories define governance roles. Use gate_selections for scope customization.

**Q: What happens if I change GATE_DEFS after projects created?**
A: Existing projects unaffected (old data persists). New projects use updated GATE_DEFS. No migration needed (indices stay stable if items added at end).

**Q: How many items should a gate have?**
A: Typically 6-15. More items = more thorough but slower. Balance completeness with speed.

---

**Last Updated:** 2026-03-14
**Status:** Technical reference for GATE_DEFS structure
**Audience:** AI assistants, developers, APQP process owners
