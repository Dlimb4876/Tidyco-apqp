# Manufacturing Change System (MCS) Integration Plan — REVISED
## Tidyco APQP Portal — Manufacturing Change Control with Schedule Impact Tracking

**Created:** 2026-03-20
**Status: ✅ COMPLETE — MCS portal implemented 2026-03-20**
**Scope:** Full integration of MCS into Tidyco APQP as a new portal
**Key Update:** MCS changes feed into existing **Overhaul Trends** system on completion
**Complexity:** High (new portal + schema enhancement + 3 cross-portal integrations)

---

## Critical Clarifications

### 1. **MCS Has Multiple Trigger Sources** (Not Just PFMEA)

Manufacturing changes can originate from:
- ✅ **Direct creation** — Users manually submit ECR via MCS portal
- ✅ **PFMEA action** — Engineering creates ECR from PFMEA worksheet
- ✅ **Risk register** — Quality creates ECR from identified risk
- ✅ **Customer request** — Sales/PM creates ECR from customer feedback
- ✅ **Quality issue** — QA creates ECR from defect/scrap analysis
- ✅ **Supplier change** — Procurement creates ECR for supply disruption

**MCS is independent**: All changes live in `mcs_changes` table. PFMEA/risks/customers are *optional* reference links, not requirements.

### 2. **Overhaul History Already Exists** (Integration, Not Replacement)

**Existing System:** `portals/product-development/product-management/` tracks `overhaul_history` table:
- **Current fields:** id, product_id, overhaul_hours, effective_date, change_reason, notes, created_by
- **Current KPIs:** Fleet average time, per-product trends, improvement %, date ranges
- **Current chart:** Line graph of manufacturing hours vs. time

**MCS Integration Plan:**
- ✅ Extend `overhaul_history` table with NEW fields for time impact tracking
- ✅ When MCS change reaches `status='implemented'`, auto-create `overhaul_history` entry
- ✅ Extend portfolio KPIs to show cumulative schedule delay impact
- ✅ Add dual-axis chart: manufacturing hours (existing) + cumulative delay days (new)

---

## Revised Data Model

### Enhanced `overhaul_history` Table

```sql
ALTER TABLE overhaul_history ADD COLUMN (
  -- Time impact tracking (NEW)
  time_impact_days INTEGER,                   -- positive=delay, negative=speedup
  schedule_impact_reason TEXT,                -- enum: Extended lead time, New supplier, Equipment, Quality req, Tooling, Process redesign, Supply chain, Other
  mcs_reference_id TEXT,                      -- FK to mcs_changes.id (if triggered by MCS)
  baseline_overhaul_hours DECIMAL,            -- before value (for delta calculation)
  approved_by_user_id UUID,                   -- who signed off on the impact
  effective_from_date DATE,                   -- when impact takes effect
  estimated_recovery_date DATE,               -- when back to baseline (nullable)
  is_mcs_triggered BOOLEAN DEFAULT FALSE      -- true if created from MCS completion
);

CREATE INDEX idx_overhaul_mcs ON overhaul_history(mcs_reference_id);
CREATE INDEX idx_overhaul_impact_date ON overhaul_history(effective_from_date DESC);
```

### New `mcs_changes` Table (Core MCS Data)

```sql
CREATE TABLE mcs_changes (
  id TEXT PRIMARY KEY,                        -- ECR-YYYY-NNNNN format
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  justification TEXT,
  change_type TEXT NOT NULL,                  -- Engineering, Process, Material, Tooling, Quality, Safety
  priority TEXT NOT NULL,                     -- critical, high, medium, low
  status TEXT NOT NULL,                       -- open, review, approved, implemented, rejected
  affected_area TEXT,                         -- Assembly, Fabrication, etc.
  part_drawing_no TEXT,
  initiated_by TEXT,
  initiated_by_user_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  updated_by_user_id UUID,
  target_implementation DATE,

  -- Approval workflow (4-step)
  eng_review_at TIMESTAMP,
  eng_review_by UUID,
  eng_review_status TEXT,                     -- pending, approved, rejected
  eng_review_notes TEXT,

  qa_review_at TIMESTAMP,
  qa_review_by UUID,
  qa_review_status TEXT,
  qa_review_notes TEXT,

  mfg_signoff_at TIMESTAMP,
  mfg_signoff_by UUID,
  mfg_signoff_status TEXT,
  mfg_signoff_notes TEXT,

  auth_implementation_at TIMESTAMP,
  auth_implementation_by UUID,
  auth_implementation_status TEXT,
  auth_implementation_notes TEXT,

  implementation_date DATE,

  -- Time impact assessment (NEW - Links to Overhaul Trends)
  affected_product_id UUID,                   -- FK to products.id (optional)
  estimated_time_impact_days INTEGER,         -- estimated delay/speedup when implemented
  time_impact_reason TEXT,                    -- why this change impacts time
  recovery_target_date DATE,                  -- when should we be back on schedule?

  -- Source tracking (Multiple triggers)
  change_source TEXT,                         -- 'Manual', 'PFMEA', 'Risk', 'Customer', 'Quality', 'Supply Chain'
  related_pfmea_cause_id TEXT,                -- FK to npi_pfmea_causes (if from PFMEA)
  related_risk_id TEXT,                       -- FK to npi_risks (if from risk register)
  related_customer_feedback_id TEXT,          -- FK if from feedback
  related_quality_issue_id TEXT,              -- FK if from quality system

  search_text TEXT GENERATED ALWAYS AS (title || ' ' || description || ' ' || part_drawing_no) STORED,

  created_by_user_id UUID REFERENCES profiles(id)
);

CREATE POLICY "auth" ON mcs_changes FOR ALL USING (auth.role() = 'authenticated');
CREATE INDEX idx_mcs_status ON mcs_changes(status);
CREATE INDEX idx_mcs_product ON mcs_changes(affected_product_id);
CREATE INDEX idx_mcs_source ON mcs_changes(change_source);
CREATE INDEX idx_mcs_search ON mcs_changes USING GIN(search_text);
```

### New `mcs_impacts` Table

```sql
CREATE TABLE mcs_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_id TEXT NOT NULL REFERENCES mcs_changes(id) ON DELETE CASCADE,
  impact_type TEXT NOT NULL,
    -- Drawing Update, BOM Change, Work Instructions, QC Plan Update,
    -- Supplier Approval, Tooling Change, Training Required, Customer Notification
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  completed_by_user_id UUID,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE POLICY "auth" ON mcs_impacts FOR ALL USING (auth.role() = 'authenticated');
```

### New `mcs_timeline` Table

```sql
CREATE TABLE mcs_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_id TEXT NOT NULL REFERENCES mcs_changes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
    -- raised, submitted_review, eng_reviewed, qa_reviewed, mfg_signed, authorized,
    -- implemented, rejected, edited, impact_updated, linked_product, approved_impact
  event_text TEXT,
  actor_user_id UUID REFERENCES profiles(id),
  actor_email TEXT,
  actor_name TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE POLICY "auth" ON mcs_timeline FOR ALL USING (auth.role() = 'authenticated');
```

---

## Integration Architecture

### 1. **MCS Portal** (Independent System)
- **Location:** `portals/mcs/`
- **Data source:** `mcs_changes`, `mcs_impacts`, `mcs_timeline` tables
- **Features:**
  - Create/edit/delete changes (any trigger source)
  - 4-step approval workflow (Eng → QA → Mfg → Auth)
  - Impact assessment (8 impact types with completion tracking)
  - Timeline activity log
  - Status transitions (open → review → approved → implemented → closed)
  - Link to related PFMEA causes, risks, products, etc.
  - Time impact estimation field (days delay/speedup)

**MCS is the "hub"** — all manufacturing changes flow through here, regardless of origin.

---

### 2. **Integration with Action Centre** (Task Aggregation)

**What:** Pending MCS approvals appear as tasks in "My Actions" dashboard

**How:**
- Query `mcs_changes` for changes with `status='review'` AND pending approver step matches current user
- Extract task:
  ```javascript
  {
    id: 'mcs_' + changeId + '_' + approvalStep,
    type: 'mcs_approval',
    title: `Review ECR-2024-0041: Rail Bracket Weld Geometry`,
    status: 'open',
    priority: mcsChange.priority,
    dueDate: mcsChange.target_implementation,
    source: 'MCS',
    sourceLink: () => navigate('mcs', { changeId })
  }
  ```
- New filter in Action Centre sidebar: "MCS Approvals"
- Clicking task → jumps to MCS portal with change highlighted
- **Reverse:** MCS change modal has "View Approval Tasks" button → jump to Action Centre

---

### 3. **Integration with PFMEA (Optional Link)**

**What:** If MCS change links to PFMEA cause, log approval as PFMEA history entry

**How:**
- When ECR has `related_pfmea_cause_id` set AND `status` transitions to 'approved' or 'implemented'
- Call `mcsLogToPfmeaHistory(changeId)` to create history entry in `npi_pfmea_history`
- History entry includes:
  - Cause ID, failure chain (mode/effect/cause), RPN before/after
  - Change description + status
  - Link back to ECR via `related_mcs_change_id`
- **Bidirectional:** PFMEA history view shows "🔗 ECR-2024-0041" badge; click → jump to MCS

**Note:** This is OPTIONAL. Changes can exist without PFMEA linkage.

---

### 4. **Integration with Overhaul Trends** (Schedule Impact Tracking) ⭐

**What:** When MCS change is IMPLEMENTED, time impact is logged to `overhaul_history` table

**Trigger:** Change reaches `status='implemented'`

**Auto-Create `overhaul_history` Entry:**
```javascript
{
  product_id: mcsChange.affected_product_id,
  overhaul_hours: [updated value based on time_impact],
  time_impact_days: mcsChange.estimated_time_impact_days,
  schedule_impact_reason: mcsChange.time_impact_reason,
  mcs_reference_id: mcsChange.id,
  baseline_overhaul_hours: [previous value],
  effective_from_date: mcsChange.implementation_date,
  estimated_recovery_date: mcsChange.recovery_target_date,
  is_mcs_triggered: true,
  change_reason: `MCS: ${mcsChange.change_type} - ${mcsChange.title}`,
  notes: mcsChange.justification,
  created_by_name: implementingUser.name,
  user_id: implementingUser.id
}
```

**Portfolio KPI Extensions:**
- **Current metrics** (existing):
  - Fleet average overhaul hours
  - Per-product trends
  - Improvement %

- **NEW metrics** (from MCS):
  - **Total Schedule Delay**: Sum of `time_impact_days` across all implemented MCS changes (cumulative)
  - **Products Affected**: Count of unique products with schedule impact
  - **Recovery Status**: Which products are overdue vs. recovery_target_date
  - **Avg Impact per Change**: Mean time_impact_days
  - **Highest Impact Change**: Which ECR caused biggest delay

**Chart Enhancement:**
- **Dual-axis line chart:**
  - Left axis: Overhaul hours (green line, existing)
  - Right axis: Cumulative delay days (red line, new)
- **Annotation bands:** Highlight recovery windows (dashed red zone)
- **Risk alerts:** If recovery_date < today AND product still delayed → red badge

**Timeline Table Extension:**
| Effective Date | Product | Overhaul (hrs) | Time Impact (days) | Recovery Target | Source (MCS ECR) | Status |
|---|---|---|---|---|---|---|
| 2026-03-20 | Product A | 42.5 | +2.5 | 2026-04-15 | ECR-2024-0041 | On track |
| 2026-03-15 | Product B | 38 | +5 | 2026-03-30 | ECR-2024-0039 | **OVERDUE** |

---

## UI/UX Strategy

### MCS Portal Layout (Matches Tidyco Design)

**Sidebar (248px):**
- Search bar
- Status filters (All / Open / Review / Approved / Implemented / Rejected)
- Priority filters (Critical / High / Medium / Low)
- Source filters (Manual / PFMEA / Risk / Customer / Quality / Supply Chain)
- Type filters (Engineering / Process / Material / Tooling / Quality / Safety)

**Main Content:**
- Toolbar: "Change Register (47)" + Sort dropdown (Newest / Oldest / Priority / Status)
- Card list: Each change shows ID, title, type, area, priority, status, author, part#, date, impact count
- Colors: Blue (open) → Orange (review) → Green (approved) → Gray (implemented) → Red (rejected)

**Detail Modal (ECR View):**
- Header: ID, title, tags (type, area)
- Grid: Status, Priority, Initiated by, Date, Area, Part#
- Sections:
  - Description / Justification
  - **Approval Chain** (4-step visual + reviewer names)
  - **Time Impact Assessment** (new section):
    - Affected Product (dropdown)
    - Estimated Time Impact (days: ±30)
    - Impact Reason (dropdown)
    - Recovery Target (date picker)
  - **Impact Checklist** (8 impact types, track completion)
  - **Activity Timeline** (all status changes + approvals)
- Footer: Delete / Edit / Advance Status buttons

**Cross-Portal Links:**
- "🔗 From PFMEA Cause: DRG-STEP-02" (if linked)
- "📊 Affects Product: Product A (tracking impact)" (if product linked)
- "📌 Linked Actions: 3" (if impacts create Action Centre tasks)

### Overhaul Trends Enhancement

**New Tab: "Time Impact"** (alongside existing "Trends" tab)
- Metrics cards: Total delay, affected products, overdue recoveries
- Dual-axis chart: Hours + cumulative delay
- Filter by year, product, source (MCS / manual / other)
- Table: All `time_impact_days > 0` entries sorted by recovery urgency

---

## Testing Strategy

### Unit Tests (`tests/mcs-*.test.js`)

**tests/mcs-main.test.js**
- Filter logic (status, priority, source, type)
- Search with multiple ECRs
- Sort order (date, priority, status)
- Count calculations

**tests/mcs-approval.test.js**
- Approval transitions (open → review → approved → implemented)
- Invalid transitions
- Timeline entry logging
- Approver role matching

**tests/mcs-overhaul-integration.test.js** ⭐
- When change `status='implemented'`, verify:
  - `overhaul_history` entry created
  - `time_impact_days` correctly recorded
  - `mcs_reference_id` set for traceability
  - `estimated_recovery_date` calculated correctly
  - Product portfolio KPIs updated

**tests/mcs-actions.test.js**
- Action Centre task extraction (approval filter)
- Navigation link generation

**tests/mcs-pfmea-integration.test.js**
- PFMEA history logging (if change linked to cause)
- Bidirectional link creation

### Integration Tests

**Test: "Complete MCS workflow with time impact"**
1. User creates ECR with `affected_product_id=productA`, `estimated_time_impact_days=5`
2. Approves ECR through 4-step workflow
3. Marks as implemented
4. System auto-creates `overhaul_history` entry with time impact
5. Load Overhaul Trends > Time Impact tab
6. Verify:
   - Product A shows +5 days cumulative delay
   - KPI shows "1 Product Affected"
   - Chart shows red line at +5 days
   - Recovery target date appears on chart

**Test: "Action Centre approval task"**
1. ECR in 'review' status, awaiting QA review
2. Load Action Centre as QA user
3. Verify ECR approval task in list
4. Click task → jump to MCS with change highlighted
5. Approve ECR → task disappears from Action Centre

**Test: "PFMEA linkage"**
1. Create ECR with `related_pfmea_cause_id` set
2. Approve ECR
3. Query `npi_pfmea_history` → verify entry with `related_mcs_change_id`
4. PFMEA worksheet → show "Linked to ECR" badge

### E2E Tests (Playwright)

**Scenario: "Multi-trigger workflow"**
1. NPI user creates ECR from PFMEA worksheet (trigger: PFMEA)
2. MCS user manually creates second ECR (trigger: Manual)
3. Customer service creates third ECR (trigger: Customer feedback)
4. All three go through approval workflow
5. PM user implements all three → time impacts logged to Overhaul Trends
6. Verify portfolio KPIs show all three sources mixed

### Performance Tests

- MCS portal loads <2s with 200+ changes
- Search filters 200 changes in <250ms
- Overhaul history recalculates on ECR implementation in <1s
- Portfolio KPIs render in <500ms

### Security Tests

- RLS: Unauthenticated users cannot query `mcs_changes`
- XSS: `<script>` tags in ECR title/description sanitized with `esc()`
- Time impact overflow: System handles negative time_impact_days correctly
- Product linkage: Can't create impact on products user doesn't have access to

---

## Implementation Roadmap

### Phase 1: Core MCS Portal + Schema
**Week 1–2**
1. Create Supabase tables (`mcs_changes`, `mcs_impacts`, `mcs_timeline`)
2. Enhance `overhaul_history` with time impact fields
3. Implement MCS main portal (list, filters, search)
4. Implement create/edit/delete modals
5. Add routing to `navigation.js`
6. Seed sample ECRs (6–10 reference changes)

### Phase 2: Approval Workflow
**Week 3**
7. Build approval chain logic (4-step transitions)
8. Implement timeline activity logging
9. Add status pills and visual indicators
10. Real-time subscription setup

### Phase 3: Cross-Portal Integration
**Week 4**
11. Action Centre integration (approval task extraction)
12. PFMEA history integration (log approvals)
13. Add reverse links (PFMEA ↔ MCS, Actions ↔ MCS)

### Phase 4: Overhaul Trends Integration ⭐
**Week 5**
14. Enhance `overhaul_history` table schema
15. Implement auto-creation of history entry on ECR implementation
16. Extend portfolio KPIs (add time impact metrics)
17. Build dual-axis chart (hours + cumulative delay)
18. New "Time Impact" tab in trends view

### Phase 5: Polish & Testing
**Week 6**
19. Unit tests (all modules)
20. Integration tests (cross-portal workflows)
21. E2E tests (Playwright scenarios)
22. Security audit (XSS, RLS, injection)
23. Performance optimization
24. CHANGELOG & CLAUDE.md updates

---

## Critical Files

### New Files
```
portals/mcs/
├── css/mcs.css
├── css/mcs-responsive.css
├── js/mcs-main.js
├── js/mcs-modal.js
├── js/mcs-approval.js
├── js/mcs-actions.js
├── js/mcs-realtime.js
└── templates/sample-changes.json

tests/
├── mcs-main.test.js
├── mcs-approval.test.js
├── mcs-overhaul-integration.test.js
├── mcs-actions.test.js
└── mcs-pfmea-integration.test.js

plans/mcs-integration-revised.md
```

### Modified Files
```
index.html → Add MCS script tags (proper load order)
utils/navigation.js → Add 'mcs' case to render() switchboard
core/js/state.js → Add global MCS state vars
portals/product-development/product-management/js/trends-chart.js → Extend KPI calculations
portals/product-development/product-management/js/products.js → Add time impact display
portals/action-centre/js/action-centre.js → Add mcsExtractApproveTasks()
portals/product-development/npi/js/npi-data-relational.js → Add mcsLogToPfmeaHistory()
```

### Database Changes
```sql
CREATE TABLE mcs_changes (...)
CREATE TABLE mcs_impacts (...)
CREATE TABLE mcs_timeline (...)
ALTER TABLE overhaul_history ADD COLUMN (time_impact_days, ...)
```

---

## Summary

This revised plan emphasizes:

✅ **MCS is independent** — Multiple trigger sources (manual, PFMEA, risks, customers, quality, supply)
✅ **Integration into existing Overhaul Trends** — Not a replacement, an enhancement
✅ **Time impact tracking** — MCS changes include estimated delay/speedup, logged to Overhaul Trends on implementation
✅ **Portfolio visibility** — PM can see cumulative schedule impact across all products via enhanced KPIs and dual-axis chart
✅ **Cross-portal connectivity** — MCS ↔ Action Centre ↔ PFMEA ↔ Overhaul Trends

