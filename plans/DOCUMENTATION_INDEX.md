# Documentation Index — NPI Tendering Feature & Helper Guides

**Created:** 2026-03-14
**Purpose:** Navigate the comprehensive documentation for the NPI Tendering feature and related systems

---

## 📚 Primary Implementation Plan

### [NPI_TENDERING_FEATURE_PLAN.md](./NPI_TENDERING_FEATURE_PLAN.md)

Complete implementation plan for the gate tendering feature.

**What it covers:**
- Feature overview and problem statement
- 7-phase implementation plan (Phase 0–7)
- Database schema design
- Data flow architecture
- Mobile-first responsive design
- Real-time sync requirements
- Security (RLS) considerations
- Testing strategy with acceptance criteria
- Architectural decisions with rationale

**Target Audience:** Project managers, developers, architects
**Length:** ~1000 lines
**Key Sections:**
- Phase 0: Product tender status trigger (integration hook)
- Phase 1–7: Staged implementation
- End-to-end workflow diagram
- Success metrics

---

## 🎓 Helper Documentation (Reference Guides)

Three complementary guides explaining existing systems. **Read these before implementing tendering feature.**

### [PRODUCT_MANAGEMENT_GUIDE.md](./PRODUCT_MANAGEMENT_GUIDE.md)

Complete reference for the Product Management system.

**What it covers:**
- Product data structure (name, family, status, overhaul hours)
- Database schema (`products` and `overhaul_history` tables)
- Full CRUD workflow with examples
- Real-time synchronization patterns
- Product status values and lifecycle
- Integration with NPI projects (tender status trigger)
- Security model (RLS policies)
- Performance characteristics
- Testing scenarios
- Common modifications and extensions
- FAQ for future AI developers

**Key Concepts:**
- Product status: 'Tender' | 'NPI' | 'Production' | 'Closed'
- Overhaul history: Time-series audit trail of hours estimates
- Real-time subscription to product changes
- **IMPORTANT:** Tender status triggers NPI project creation flow

**Target Audience:** AI assistants, developers, system integrators
**Length:** ~800 lines
**Read this first if:** You need to understand how products relate to NPI projects

---

### [NPI_PROJECT_FLOW_GUIDE.md](./NPI_PROJECT_FLOW_GUIDE.md)

Complete reference for NPI project creation and gate workflow.

**What it covers:**
- NPI project data structure (all APQP content)
- Project lifecycle (creation → gates → signoff)
- Gate workflow with examples (checklist → sign-off)
- Gate selections deep dive (how customization works)
- File organization and naming conventions
- Data layer function patterns (npi.data.*)
- State management (global state, UI state)
- Real-time collaboration scenarios
- Testing cases (product flow, checklist, selection, real-time)
- Integration checklist for tendering feature
- FAQ addressing common questions

**Key Concepts:**
- Project triggered by product "Tender" status (Phase 0)
- Gate selection = filtered checklist (indices-based)
- Real-time sync via Supabase subscriptions
- npi.data.* functions for mutations
- programmes table: master data structure

**Target Audience:** AI assistants, developers, QA engineers
**Length:** ~900 lines
**Read this second if:** You need to understand NPI project workflow

---

### [GATE_DEFINITIONS_GUIDE.md](./GATE_DEFINITIONS_GUIDE.md)

Technical reference for APQP gates and GATE_DEFS structure.

**What it covers:**
- GATE_DEFS constant structure and location
- All 6 gates with full checklist items and signatories
- Gate numbering (0–5) and phases
- How gate selection indices work
- Gate data in project (checks, sigs arrays)
- Rendering logic with filtered examples
- Fallback behavior (old projects vs. new)
- How to safely modify GATE_DEFS
- Reindexing strategies for migrations
- Validation and testing patterns
- Performance considerations

**Key Concepts:**
- GATE_DEFS[gateNum].items array (index-based)
- gate_selections stores indices, not item text
- Backward compatible (projects without selection show all items)
- Safe to add items at end; reordering requires migration
- 6 gates, ~65 total checklist items

**Target Audience:** Developers, APQP process owners, QA engineers
**Length:** ~650 lines
**Read this third if:** You need technical details about gates

---

## 🔗 How These Docs Relate

```
TENDERING FEATURE PLAN (Implementation roadmap)
    ├─→ Depends on: PRODUCT_MANAGEMENT_GUIDE
    │   (Understand product → project trigger)
    │
    ├─→ Depends on: NPI_PROJECT_FLOW_GUIDE
    │   (Understand project creation & gates)
    │
    └─→ Depends on: GATE_DEFINITIONS_GUIDE
        (Understand gate structure & selection)

For Implementation:
1. Read NPI_TENDERING_FEATURE_PLAN.md (overview)
2. Read PRODUCT_MANAGEMENT_GUIDE.md (Phase 0 prerequisite)
3. Read NPI_PROJECT_FLOW_GUIDE.md (Phase 3 context)
4. Read GATE_DEFINITIONS_GUIDE.md (technical details)
5. Begin Phase 0 implementation
```

---

## 📂 Documentation Map

### System Architecture

```
projects/product-development/
│
├─ product-management/         (Where products live)
│  ├─ products-data.js         ← See PRODUCT_MANAGEMENT_GUIDE
│  ├─ products.js
│  └─ trends-chart.js
│
└─ npi/                        (Where NPI projects live)
   ├─ dashboard.js            ← See NPI_PROJECT_FLOW_GUIDE
   ├─ gates.js                ← See GATE_DEFINITIONS_GUIDE
   ├─ npi-gates-editor.js      ← See NPI_TENDERING_FEATURE_PLAN
   ├─ npi-data.js             ← See NPI_PROJECT_FLOW_GUIDE
   ├─ npi-constants.js        ← See GATE_DEFINITIONS_GUIDE
   └─ [other APQP modules]
```

### Data Flow

```
Product with Status="Tender"  ──→ See PRODUCT_MANAGEMENT_GUIDE
           ↓
     NPI Project Created      ──→ See NPI_PROJECT_FLOW_GUIDE
           ↓
     Gate Questions Selected  ──→ See GATE_DEFINITIONS_GUIDE
           ↓
     Gates Display Filtered   ──→ See NPI_TENDERING_FEATURE_PLAN
```

---

## 🚀 Quick Start by Role

### For Project Managers
1. Read: **NPI_TENDERING_FEATURE_PLAN.md** (Overview & timeline)
2. Skim: **PRODUCT_MANAGEMENT_GUIDE.md** (Product workflow)
3. Skim: **NPI_PROJECT_FLOW_GUIDE.md** (Project workflow)

### For Developers (Implementing Phase 0–1)
1. Read: **PRODUCT_MANAGEMENT_GUIDE.md** (Complete)
2. Read: **NPI_TENDERING_FEATURE_PLAN.md** (Phases 0–1)
3. Skim: **GATE_DEFINITIONS_GUIDE.md** (Understand gate structure)

### For Developers (Implementing Phase 2–4)
1. Read: **NPI_PROJECT_FLOW_GUIDE.md** (Complete)
2. Read: **GATE_DEFINITIONS_GUIDE.md** (Complete)
3. Read: **NPI_TENDERING_FEATURE_PLAN.md** (Phases 2–4)

### For QA/Testing
1. Read: **NPI_TENDERING_FEATURE_PLAN.md** (Testing strategy)
2. Read: **PRODUCT_MANAGEMENT_GUIDE.md** (Testing section)
3. Read: **NPI_PROJECT_FLOW_GUIDE.md** (Testing section)
4. Read: **GATE_DEFINITIONS_GUIDE.md** (Validation section)

### For AI Assistants (Future Work)
1. Read: All four documents completely
2. These explain the systems without requiring source code reading
3. Reference whenever you modify products, projects, or gates

---

## 📖 Documentation Statistics

| Document | Lines | Sections | Code Examples | FAQ |
|----------|-------|----------|---------------|-----|
| NPI_TENDERING_FEATURE_PLAN.md | 1000 | 15+ | Yes | 6 items |
| PRODUCT_MANAGEMENT_GUIDE.md | 800 | 14+ | Yes | 6 questions |
| NPI_PROJECT_FLOW_GUIDE.md | 900 | 13+ | Yes | 6 questions |
| GATE_DEFINITIONS_GUIDE.md | 650 | 12+ | Yes | 5 questions |
| **TOTAL** | **3350** | **54+** | **Yes** | **23 items** |

---

## 🔍 Finding Answers

### "How do products get created?"
→ **PRODUCT_MANAGEMENT_GUIDE.md** → "Create New Product" section

### "What happens when product status changes to Tender?"
→ **PRODUCT_MANAGEMENT_GUIDE.md** → "Integration Points" section
→ **NPI_TENDERING_FEATURE_PLAN.md** → "Phase 0" section

### "How do projects get created?"
→ **NPI_PROJECT_FLOW_GUIDE.md** → "Project Lifecycle" section

### "How do gate selections work?"
→ **GATE_DEFINITIONS_GUIDE.md** → "Gate Selection Indexing" section
→ **NPI_PROJECT_FLOW_GUIDE.md** → "Gate Selections" section

### "What's gate_selections?"
→ **GATE_DEFINITIONS_GUIDE.md** → "Data Storage" section

### "How do I safely modify gates?"
→ **GATE_DEFINITIONS_GUIDE.md** → "Modifying GATE_DEFS" section

### "How is real-time sync implemented?"
→ **PRODUCT_MANAGEMENT_GUIDE.md** → "Real-Time Synchronization" section
→ **NPI_PROJECT_FLOW_GUIDE.md** → "Real-Time Collaboration" section

### "What are the 6 gates?"
→ **GATE_DEFINITIONS_GUIDE.md** → "Gate Details" section

### "How do I test this feature?"
→ **NPI_TENDERING_FEATURE_PLAN.md** → "Testing Strategy" section
→ All guides have "Testing" sections

---

## 🎯 Implementation Checklist (Using These Docs)

- [ ] Read all 4 docs (use Quick Start above)
- [ ] Understand product → project flow (PRODUCT_MANAGEMENT_GUIDE)
- [ ] Understand NPI project structure (NPI_PROJECT_FLOW_GUIDE)
- [ ] Understand gate customization (GATE_DEFINITIONS_GUIDE)
- [ ] Plan Phase 0 implementation (NPI_TENDERING_FEATURE_PLAN)
- [ ] Implement Phase 0 (products-data.js hook)
- [ ] Test Phase 0 (product tender triggers project modal)
- [ ] Review integration checklist in NPI_PROJECT_FLOW_GUIDE
- [ ] Proceed with Phases 1–4 per NPI_TENDERING_FEATURE_PLAN

---

## 📝 Version History

| Date | Change | Documents Affected |
|------|--------|-------------------|
| 2026-03-14 | Initial creation | All 4 docs |
| — | — | — |

---

## 🤝 Contributing to Documentation

When you implement features or fix bugs, consider updating these docs:

- **Added new product field?** → Update PRODUCT_MANAGEMENT_GUIDE.md database schema
- **Changed gate items?** → Update GATE_DEFINITIONS_GUIDE.md gate tables
- **Modified project structure?** → Update NPI_PROJECT_FLOW_GUIDE.md data model
- **Changed integration points?** → Update all relevant docs
- **Discovered a pattern or best practice?** → Add to relevant FAQ section

---

## 🔗 Related External Documentation

- **CLAUDE.md** — Project architecture, constants, state management
- **TESTING_STRATEGY.md** — Jest testing framework and patterns
- **FAMILY_TEMPLATES_ARCHITECTURE.md** — Family PFMEA templates (similar pattern)
- **README.md** — Project overview and portal structure

---

## 💡 Key Principles Across All Documentation

1. **Index-Based Filtering** — gate_selections stores indices, not text (resilient to wording changes)
2. **Backward Compatibility** — Old projects without gate_selections use all GATE_DEFS items (no migration needed)
3. **Real-Time Sync** — All data synced via Supabase subscriptions (immediate visibility)
4. **No Breaking Changes** — Adding items at end of GATE_DEFS.items is safe; reordering requires migration
5. **Collaborative Model** — All authenticated users see all data; RLS enforces auth, not authorization
6. **Mobile-First Design** — All UI components responsive (mobile-first, tablet, desktop)

---

## 📞 Questions?

- **About products?** → PRODUCT_MANAGEMENT_GUIDE.md → FAQ
- **About NPI projects?** → NPI_PROJECT_FLOW_GUIDE.md → FAQ
- **About gates?** → GATE_DEFINITIONS_GUIDE.md → FAQ
- **About implementation?** → NPI_TENDERING_FEATURE_PLAN.md → Questions & Notes
- **About AI usage?** → All docs have "🤔 FAQ for Future AI" sections

---

**Last Updated:** 2026-03-14
**Status:** Complete documentation suite ready for use
**Audience:** AI assistants, developers, project managers, QA, system integrators
