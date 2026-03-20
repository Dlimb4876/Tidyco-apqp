# Product Families Feature Expansion Plan

**Status:** 📋 PENDING — Not yet implemented  
**Date:** 2026-03-17  
**Vision:** Transform product families from a simple categorization system into a powerful knowledge reuse and intelligence platform that accelerates NPI projects and captures organizational learning.

---

## Executive Summary

The current product families feature provides basic categorization (HVAC, Rotating Machines, Pneumatics, Other) with PFMEA template storage. While functional, this represents only **10% of the potential value**.

This plan outlines how to evolve families into a **strategic knowledge management system** that:
- ✅ Reduces NPI setup time by 60–80%
- ✅ Captures and reuses engineering knowledge across projects
- ✅ Provides data-driven insights for continuous improvement
- ✅ Enables intelligent recommendations and pattern matching
- ✅ Creates a living library of best practices

---

## Current State Analysis

### ✅ What Exists Today

**Database Infrastructure:**
- `families` table — stores family definitions (id, label, icon, description)
- `family_pfmea_templates` table — stores reusable PFMEA failure modes per family
- Real-time subscriptions for collaborative editing
- RLS policies (user-scoped data)

**UI Components:**
- Settings portal → Families tab (CRUD interface)
- Product Family Database view (card-based layout)
- Template manager modal (view/edit/delete templates)
- NPI project list with family swim lanes
- Family filter on NPI dashboard

**Functionality:**
- Create/edit/delete families
- Create PFMEA templates per family
- Apply templates to new projects (manual process)
- Filter projects by family
- Basic statistics (template count, avg RPN)

### ❌ Limitations & Gaps

1. **Manual template application** — Users must manually apply templates during project creation
2. **No versioning** — Templates have no history or revision tracking
3. **No analytics** — Can't see which templates are most used or effective
4. **No cross-family learning** — Templates siloed within families
5. **No quality metrics** — Can't identify high-risk patterns across projects
6. **No intelligent recommendations** — System doesn't suggest relevant templates
7. **No BOM templates** — Only PFMEA, not parts/tooling knowledge
8. **No CTQ templates** — Critical-to-Quality requirements not reusable
9. **No PFD templates** — Process flows not captured at family level
10. **No gate checklist templates** — Gate reviews recreated from scratch each time

---

## Strategic Vision: Three Horizons

### Horizon 1: Foundation (Q2 2026)
**Theme:** "Make families indispensable for NPI setup"

**Goals:**
- One-click template application during project creation
- Multi-template support (PFMEA + BOM + CTQ + PFD)
- Template versioning and audit trail
- Basic usage analytics

**Business Value:**
- 50% reduction in NPI setup time
- Consistent PFMEA quality across similar projects
- Knowledge retention when engineers leave

---

### Horizon 2: Intelligence (Q3 2026)
**Theme:** "Make families smart enough to recommend and predict"

**Goals:**
- AI-powered template recommendations based on project attributes
- Cross-family pattern detection (similar failure modes across families)
- RPN trend analysis (are risks improving over time?)
- Template health scoring (identify outdated or ineffective templates)
- Automated template suggestions from completed projects

**Business Value:**
- 70% reduction in NPI setup time
- Proactive risk identification before projects start
- Continuous improvement driven by data

---

### Horizon 3: Autonomy (Q4 2026)
**Theme:** "Make families proactive partners in product development"

**Goals:**
- Auto-generate draft PFMEA/BOM/CTQ from product requirements
- Predictive risk alerts ("This design resembles projects with high RPNs")
- Template marketplace (share templates across teams/organizations)
- Integration with CAD/BOM systems for automated parts suggestions
- Lessons learned feedback loop (field failures → template updates)

**Business Value:**
- 80% reduction in NPI setup time
- Prevent recurrence of historical failures
- Organizational learning at scale

---

## Detailed Feature Roadmap

### Horizon 1: Foundation Features

#### 1.1 One-Click Template Application ✅ HIGH PRIORITY

**Current Problem:** Users must manually apply templates after project creation.

**Solution:** Integrate template selection into the new project wizard.

**Implementation:**
```javascript
// In dashboard.js → npi.dashboard.renderNewProjectModal()
{
  // After user selects family, show template options:
  const templates = familyTemplatesGetGroupedByFamily(selectedFamilyId);
  
  // Display checkbox list:
  ☑️ Apply PFMEA template: "Standard HVAC PFMEA" (18 items)
  ☑️ Apply BOM template: "HVAC Base Kit" (45 parts)
  ☑️ Apply CTQ template: "HVAC Critical Requirements" (12 specs)
  ☑️ Apply PFD template: "Standard HVAC Flow" (8 steps)
  
  // On project creation, auto-populate all selected templates
}
```

**Files to Modify:**
- `portals/product-development/npi/js/dashboard.js` — Add template selection to project creation modal
- `portals/product-development/js/family-templates-data.js` — Add multi-template apply function
- `core/js/state.js` — Add template state variables for BOM/CTQ/PFD templates

**Database Changes:**
```sql
-- New tables for additional template types
CREATE TABLE family_bom_templates (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES families(id),
  template_name TEXT NOT NULL,
  bom_type TEXT NOT NULL,  -- parts|tools|equip|mat|cons
  part_number TEXT,
  description TEXT NOT NULL,
  quantity INT DEFAULT 1,
  unit TEXT,
  abc_class TEXT,
  created_at TIMESTAMP,
  UNIQUE(user_id, family_id, template_name, part_number)
);

CREATE TABLE family_ctq_templates (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES families(id),
  template_name TEXT NOT NULL,
  requirement TEXT NOT NULL,
  specification TEXT NOT NULL,
  test_method TEXT,
  priority TEXT DEFAULT 'High',  -- High|Medium|Low
  created_at TIMESTAMP,
  UNIQUE(user_id, family_id, template_name, requirement)
);

CREATE TABLE family_pfd_templates (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES families(id),
  template_name TEXT NOT NULL,
  step_num INT NOT NULL,
  operation TEXT NOT NULL,
  description TEXT,
  ctq_refs TEXT[],  -- Array of CTQ requirement IDs
  bom_refs TEXT[],  -- Array of BOM part numbers
  created_at TIMESTAMP,
  UNIQUE(user_id, family_id, template_name, step_num)
);

CREATE TABLE family_gate_checklist_templates (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES families(id),
  template_name TEXT NOT NULL,
  gate_num INT NOT NULL,  -- 0-5
  checklist_item TEXT NOT NULL,
  category TEXT,  -- Documentation|Testing|Resources|etc.
  mandatory BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  UNIQUE(user_id, family_id, template_name, gate_num, checklist_item)
);
```

**Acceptance Criteria:**
- [ ] User creates new project, selects family "HVAC"
- [ ] Modal shows: "Apply templates from HVAC family?"
- [ ] User can select which templates to apply (PFMEA, BOM, CTQ, PFD, Gate Checklists)
- [ ] On confirm, project is created with all selected templates applied
- [ ] Applied templates appear in respective project sections
- [ ] User can edit/delete applied items (they're now project-specific)

---

#### 1.2 Template Versioning & History ✅ HIGH PRIORITY

**Current Problem:** No audit trail — can't see when templates changed or who modified them.

**Solution:** Add version tracking and change history to all template types.

**Implementation:**
```sql
-- Add version columns to template tables
ALTER TABLE family_pfmea_templates
ADD COLUMN version INT DEFAULT 1,
ADD COLUMN version_notes TEXT,
ADD COLUMN is_active BOOLEAN DEFAULT true,
ADD COLUMN created_by_email TEXT,
ADD COLUMN updated_by_email TEXT;

-- Create history table for tracking changes
CREATE TABLE family_template_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  template_type TEXT NOT NULL,  -- pfmea|bom|ctq|pfd|gate
  template_id UUID NOT NULL,
  action TEXT NOT NULL,  -- created|updated|deleted|applied
  version INT,
  changes JSONB,  -- Store before/after snapshot
  changed_at TIMESTAMP DEFAULT NOW(),
  changed_by_email TEXT
);
```

**UI Enhancements:**
```
Template Manager Modal
┌─────────────────────────────────────────┐
│ 📋 HVAC PFMEA Templates                 │
├─────────────────────────────────────────┤
│ Standard HVAC PFMEA v2.3                │
│ ├─ 18 failure modes                    │
│ ├─ Avg RPN: 72                         │
│ ├─ Last updated: 2026-03-15 by john.doe│
│ └─ [📖 View] [📝 Edit] [🕐 History]    │
│                                         │
│ Standard HVAC PFMEA v2.2 (archived)    │
│ ├─ 16 failure modes                    │
│ └─ [📖 View] [🔄 Restore]               │
└─────────────────────────────────────────┘
```

**Files to Modify:**
- `portals/product-development/js/family-templates-data.js` — Add versioning logic
- `portals/product-development/js/product-development.js` — Add history viewer modal
- `core/js/db.js` — Add history tracking on save

**Acceptance Criteria:**
- [ ] Every template shows version number (auto-incremented on save)
- [ ] Version notes field when updating (optional)
- [ ] History view shows all changes with timestamps and authors
- [ ] Can restore archived versions
- [ ] Applied templates record which version was used (audit trail)

---

#### 1.3 Template Analytics Dashboard ✅ MEDIUM PRIORITY

**Current Problem:** No visibility into template usage or effectiveness.

**Solution:** Dashboard showing template performance metrics.

**Metrics to Track:**
```
Family Analytics: HVAC Systems
├─ Usage Statistics
│  ├─ 12 projects used HVAC templates (last 12 months)
│  ├─ Most popular: "Standard HVAC PFMEA" (used 10 times)
│  └─ Avg setup time: 15 min (vs. 2 hrs manual)
│
├─ Quality Metrics
│  ├─ Avg RPN: 72 (↓12% from last year)
│  ├─ High RPN items: 3 of 18 (17%)
│  └─ Field failures linked to template gaps: 0
│
└─ Continuous Improvement
   ├─ Templates updated: 2 (last quarter)
   ├─ New failure modes added: 4
   └─ Obsolete items removed: 1
```

**Implementation:**
```javascript
// New data layer function
window.familyAnalyticsGetReport = async function(familyId, dateRange) {
  const projects = getProjectsByFamily(familyId, dateRange);
  const templates = familyTemplatesGetByFamily(familyId);
  
  // Calculate metrics
  const usageCount = projects.filter(p => p.template_applied?.includes(familyId)).length;
  const avgRPN = calculateAverageRPN(templates);
  const rpnTrend = compareRPNToPreviousPeriod(templates, dateRange);
  
  return {
    usage: { projectCount: usageCount, templateApplications: countApplications(templates) },
    quality: { avgRPN, rpnTrend, highRpnItems: countHighRPN(templates) },
    improvement: { updatesCount, itemsAdded, itemsRemoved }
  };
};
```

**Files to Create:**
- `portals/product-development/js/family-analytics-data.js` — Analytics data layer
- `portals/product-development/npi/css/family-analytics.css` — Dashboard styles
- `portals/product-development/npi/js/family-analytics.js` — Dashboard UI

**Acceptance Criteria:**
- [ ] Analytics dashboard accessible from family card
- [ ] Shows usage, quality, and improvement metrics
- [ ] Date range filter (last 3/6/12 months, all time)
- [ ] Export to PDF/CSV for reporting
- [ ] Visual charts (RPN trend, usage over time)

---

#### 1.4 BOM Templates ✅ HIGH PRIORITY

**Current Problem:** BOMs are recreated from scratch for each project.

**Solution:** Reusable BOM templates at family level with parts, tools, equipment.

**Implementation:**
```javascript
// Example: HVAC BOM Template
{
  template_name: "HVAC Base Kit",
  family_id: "hvac_uuid",
  items: [
    { type: 'parts', part_number: 'COMP-001', description: 'Compressor 5kW', qty: 1, abc_class: 'A' },
    { type: 'parts', part_number: 'FAN-042', description: 'Condenser Fan', qty: 2, abc_class: 'A' },
    { type: 'tools', part_number: 'TOOL-JIG-01', description: 'Mounting Jig', qty: 1, abc_class: 'C' },
    { type: 'equip', part_number: 'TEST-RIG-HVAC', description: 'HVAC Test Bench', qty: 1, abc_class: 'C' },
    { type: 'mat', part_number: 'REFRIG-R134a', description: 'Refrigerant R134a', qty: 500, unit: 'g', abc_class: 'B' }
  ]
}
```

**UI Integration:**
```
BOM Template Editor
┌─────────────────────────────────────────┐
│ 🔩 HVAC Base Kit v1.0                   │
├─────────────────────────────────────────┤
│ Tabs: [Parts] [Tools] [Equipment] [Materials] [Consumables] │
│                                         │
│ Parts (24 items)                        │
│ ┌─────────────────────────────────────┐ │
│ │ Part Number │ Desc │ Qty │ ABC │ 🗑️ │ │
│ ├─────────────────────────────────────┤ │
│ │ COMP-001    │ ...  │  1  │  A  │ ❌  │ │
│ │ FAN-042     │ ...  │  2  │  A  │ ❌  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [+ Add Item]  [💾 Save Template]        │
└─────────────────────────────────────────┘
```

**Files to Create:**
- `portals/product-development/js/family-bom-templates-data.js` — Data layer
- `portals/product-development/npi/js/family-bom-templates.js` — UI
- `portals/product-development/npi/css/family-bom-templates.css` — Styles

**Acceptance Criteria:**
- [ ] Create/edit/delete BOM templates per family
- [ ] Support all BOM types (parts, tools, equip, mat, cons)
- [ ] Import from existing project BOMs
- [ ] Apply to new projects during creation
- [ ] ABC classification included

---

#### 1.5 CTQ Templates ✅ HIGH PRIORITY

**Current Problem:** Critical-to-Quality requirements reinvented per project.

**Solution:** Standard CTQ templates per family with specs and test methods.

**Implementation:**
```javascript
// Example: HVAC CTQ Template
{
  template_name: "HVAC Critical Requirements",
  family_id: "hvac_uuid",
  items: [
    { requirement: 'Cooling capacity', specification: '5.0 kW ±5%', test_method: 'ISO 5151 test rig' },
    { requirement: 'Noise level', specification: '< 45 dB(A)', test_method: 'Sound meter @ 1m' },
    { requirement: 'Power consumption', specification: '< 1.8 kW', test_method: 'Power analyzer' },
    { requirement: 'Refrigerant leakage', specification: '< 5 g/year', test_method: 'Helium mass spec' }
  ]
}
```

**Files to Create:**
- `portals/product-development/js/family-ctq-templates-data.js` — Data layer
- `portals/product-development/npi/js/family-ctq-templates.js` — UI

**Acceptance Criteria:**
- [ ] Create/edit/delete CTQ templates per family
- [ ] Fields: requirement, specification, test method, priority
- [ ] Import from existing project CTQ
- [ ] Apply to new projects during creation
- [ ] CTQ appear in project APQP section

---

#### 1.6 PFD Templates ✅ MEDIUM PRIORITY

**Current Problem:** Process flow diagrams recreated from scratch.

**Solution:** Standard process flows per family with CTQ and BOM links.

**Implementation:**
```javascript
// Example: HVAC PFD Template
{
  template_name: "Standard HVAC Overhaul Flow",
  family_id: "hvac_uuid",
  steps: [
    { step_num: 10, operation: 'Receiving Inspection', description: 'Verify unit condition', ctq_refs: [], bom_refs: [] },
    { step_num: 20, operation: 'Disassembly', description: 'Strip to component level', ctq_refs: [], bom_refs: ['TOOL-KIT-01'] },
    { step_num: 30, operation: 'Cleaning', description: 'Ultrasonic clean all parts', ctq_refs: [], bom_refs: ['CHEM-SOLVENT'] },
    { step_num: 40, operation: 'Compressor Overhaul', description: 'Rebuild compressor', ctq_refs: ['CTQ-001', 'CTQ-003'], bom_refs: ['SEAL-KIT-COMP'] },
    { step_num: 50, operation: 'Reassembly', description: 'Rebuild unit', ctq_refs: [], bom_refs: [] },
    { step_num: 60, operation: 'Testing', description: 'Performance test', ctq_refs: ['CTQ-001', 'CTQ-002', 'CTQ-004'], bom_refs: ['TEST-RIG-HVAC'] },
    { step_num: 70, operation: 'Final Inspection', description: 'QA release', ctq_refs: [], bom_refs: [] }
  ]
}
```

**Files to Create:**
- `portals/product-development/js/family-pfd-templates-data.js` — Data layer
- `portals/product-development/npi/js/family-pfd-templates.js` — UI

**Acceptance Criteria:**
- [ ] Create/edit/delete PFD templates per family
- [ ] Steps with operation name, description, CTQ refs, BOM refs
- [ ] Visual flow diagram view
- [ ] Import from existing project PFD
- [ ] Apply to new projects during creation

---

#### 1.7 Gate Checklist Templates ✅ MEDIUM PRIORITY

**Current Problem:** Gate review checklists are generic, not family-specific.

**Solution:** Family-specific gate checklists with mandatory/optional items.

**Implementation:**
```javascript
// Example: HVAC Gate 3 Checklist Template
{
  template_name: "HVAC Gate Reviews",
  family_id: "hvac_uuid",
  gate_num: 3,  // Process Design & Development
  items: [
    { item: 'Draft inspection procedure completed', category: 'Documentation', mandatory: true },
    { item: 'HVAC-specific work instructions completed', category: 'Documentation', mandatory: true },
    { item: 'Refrigerant handling procedures defined', category: 'Safety', mandatory: true },
    { item: 'Test rig commissioned for HVAC testing', category: 'Equipment', mandatory: true },
    { item: 'Leak detection equipment calibrated', category: 'Quality', mandatory: true }
  ]
}
```

**Files to Create:**
- `portals/product-development/js/family-gate-templates-data.js` — Data layer
- `portals/product-development/npi/js/family-gate-templates.js` — UI

**Acceptance Criteria:**
- [ ] Create/edit/delete gate checklist templates per family
- [ ] Items categorized (Documentation, Testing, Resources, Safety, Quality)
- [ ] Mandatory vs. optional flags
- [ ] Apply to new projects during creation
- [ ] Gate checklists appear in project Gates section

---

### Horizon 2: Intelligence Features

#### 2.1 AI-Powered Template Recommendations 🔮 MEDIUM PRIORITY

**Vision:** System suggests relevant templates based on project attributes.

**Implementation:**
```javascript
// When user creates project with:
// - Family: HVAC
// - Customer: RailCorp
// - Unit Type: Class 158

// System recommends:
{
  recommended_templates: [
    { type: 'pfmea', name: 'Standard HVAC PFMEA', confidence: 0.95, reason: 'Used in 10 similar projects' },
    { type: 'bom', name: 'RailCorp HVAC Kit', confidence: 0.88, reason: 'Customer-specific template' },
    { type: 'ctq', name: 'Class 158 Critical Requirements', confidence: 0.82, reason: 'Unit type match' },
    { type: 'pfd', name: 'Standard HVAC Overhaul Flow', confidence: 0.75, reason: 'Family default' }
  ]
}
```

**Algorithm:**
```python
def recommend_templates(project_attributes):
    # Find similar historical projects
    similar_projects = find_projects_by_similarity(
        family=project.family,
        customer=project.customer,
        unit_type=project.unit
    )
    
    # Count template usage in similar projects
    template_scores = {}
    for proj in similar_projects:
        for template in proj.applied_templates:
            template_scores[template] += 1
    
    # Rank by frequency + recency
    recommendations = rank_templates(template_scores)
    
    return recommendations
```

**Files to Create:**
- `portals/product-development/js/family-recommendations-data.js` — ML/data layer
- `utils/js/similarity-matcher.js` — Project similarity algorithm

**Acceptance Criteria:**
- [ ] Template recommendations shown during project creation
- [ ] Confidence score displayed (0–100%)
- [ ] Reason provided ("Used in 12 similar projects")
- [ ] One-click apply for recommended templates
- [ ] Feedback loop (thumbs up/down to improve recommendations)

---

#### 2.2 Cross-Family Pattern Detection 🔮 LOW PRIORITY

**Vision:** Identify common failure modes across different product families.

**Implementation:**
```javascript
// System detects:
"Compressor failure" appears in:
- HVAC family (18 projects, avg RPN 72)
- Pneumatics family (7 projects, avg RPN 65)
- Rotating Machines family (12 projects, avg RPN 80)

// Insight:
"Compressor-related failures are a cross-family risk pattern.
Consider creating a shared 'Compressor Best Practices' template."
```

**UI:**
```
Cross-Family Insights
┌─────────────────────────────────────────┐
│ 🔍 Pattern Detected: Compressor Failures│
├─────────────────────────────────────────┤
│ Found in 3 families, 37 projects        │
│ Average RPN: 72 (High Risk)             │
│                                         │
│ Common causes:                          │
│ ├─ Electrical overload (65% of cases)   │
│ ├─ Lubrication failure (23% of cases)   │
│ └─ Mechanical wear (12% of cases)       │
│                                         │
│ [📋 Create Cross-Family Template]       │
└─────────────────────────────────────────┘
```

---

#### 2.3 RPN Trend Analysis 🔮 MEDIUM PRIORITY

**Vision:** Track whether risks are improving over time.

**Implementation:**
```javascript
// For family "HVAC":
{
  rpn_trend: {
    current_quarter: { avg_rpn: 72, high_rpn_items: 3 },
    last_quarter: { avg_rpn: 78, high_rpn_items: 5 },
    change: '-7.7%',
    trend: 'improving'
  },
  
  // By failure mode category:
  categories: {
    'Electrical': { trend: 'stable', avg_rpn: 65 },
    'Mechanical': { trend: 'improving', avg_rpn: 58 },
    'Thermal': { trend: 'worsening', avg_rpn: 82 }  // ⚠️ Alert
  }
}
```

**UI:**
```
RPN Trend Chart (HVAC Family)
┌─────────────────────────────────────────┐
│ 100 │           ╭──╮                    │
│  90 │      ╭──╮╯  ╰╮  ╭──╮              │
│  80 │   ╭──╯     ╭╯  ╭╯  ╰╮  ╭──        │
│  70 │──╯         ╰──╯    ╰──╯   ╰──     │
│  60 │──────────────────────────────     │
│     │ Q1    Q2    Q3    Q4    Q1         │
│     │ 2025              2026             │
│                                         │
│ ⚠️ Thermal risks increasing             │
│    Recommend: Review thermal management │
└─────────────────────────────────────────┘
```

---

#### 2.4 Template Health Scoring 🔮 MEDIUM PRIORITY

**Vision:** Automatically identify outdated or ineffective templates.

**Health Score Factors:**
```
Template: "Standard HVAC PFMEA v2.3"
├─ Age: 18 months since last update (⚠️ stale)
├─ Usage: Used in 10 projects last year (✅ popular)
├─ Field Failures: 0 linked failures (✅ effective)
├─ RPN Trend: -12% improvement (✅ improving)
├─ Coverage: 18 failure modes (✅ comprehensive)
└─ Health Score: 78/100 (Good)
```

**Scoring Algorithm:**
```javascript
function calculateTemplateHealth(template) {
  let score = 100;
  
  // Age penalty (>12 months = -20 points)
  const ageMonths = monthsSince(template.updated_at);
  if (ageMonths > 12) score -= 20;
  else if (ageMonths > 6) score -= 10;
  
  // Usage bonus (used in >5 projects = +10 points)
  if (template.usage_count > 5) score += 10;
  
  // Field failure penalty
  if (template.linked_field_failures > 0) score -= 30;
  
  // RPN trend bonus (improving = +10 points)
  if (template.rpn_trend < 0) score += 10;
  
  return Math.max(0, Math.min(100, score));
}
```

**UI Indicators:**
```
Template List with Health Scores:
┌─────────────────────────────────────────┐
│ ✅ Standard HVAC PFMEA v2.3 (Health: 92)│
│ ⚠️  HVAC Test Procedures v1.1 (Health: 65)│
│    └─ Not updated in 18 months          │
│ ❌ Legacy Compressor Guide v0.9 (Health: 34)│
│    └─ Linked to 2 field failures        │
└─────────────────────────────────────────┘
```

---

#### 2.5 Automated Template Generation from Projects 🔮 HIGH PRIORITY

**Vision:** Convert completed projects into templates automatically.

**Implementation:**
```javascript
// User flow:
1. Open completed project "Class 158 HVAC Overhaul"
2. Click "Create Template from Project"
3. Select what to extract:
   ☑️ PFMEA (18 failure modes)
   ☑️ BOM (45 parts)
   ☑️ CTQ (12 requirements)
   ☑️ PFD (7 steps)
   ☑️ Gate Checklists (24 items)
4. Select target family: "HVAC"
5. Name template: "Class 158 HVAC Template"
6. System creates draft template for review
7. User reviews and publishes
```

**Files to Create:**
- `portals/product-development/js/template-extractor.js` — Extraction logic
- `portals/product-development/npi/js/create-template-wizard.js` — Wizard UI

**Acceptance Criteria:**
- [ ] One-click extraction from any project
- [ ] Preview before publishing
- [ ] Merge with existing templates (optional)
- [ ] Auto-categorize by family
- [ ] Version control (v1.0 created from project X)

---

### Horizon 3: Autonomy Features

#### 3.1 Predictive Risk Alerts 🔮 LOW PRIORITY

**Vision:** System warns about risks before they occur.

**Example:**
```
⚠️ Risk Alert: Design Similarity Detected

Your new "Class 158 HVAC" project has:
- Similar compressor layout to Project X (RPN 85)
- Similar refrigerant routing to Project Y (field failure)
- New supplier for seals (not in approved vendor list)

Recommendations:
1. Review Project X PFMEA item "Compressor overload"
2. Add leak detection CTQ from Project Y lessons learned
3. Validate seal supplier against qualification database

[📋 Apply Recommended Templates] [🔕 Dismiss]
```

---

#### 3.2 Template Marketplace 🔮 LOW PRIORITY

**Vision:** Share templates across teams/organizations.

**Features:**
- Public/private template sharing
- Rating and review system
- Template certification (verified by experts)
- Download/import from marketplace

**Example:**
```
Template Marketplace
┌─────────────────────────────────────────┐
│ 🔥 Trending Templates                   │
├─────────────────────────────────────────┤
│ ⭐⭐⭐⭐⭐ (4.9)                          │
│ HVAC Best Practices v3.1                │
│ By: RailCorp Engineering                │
│ Downloads: 1,247                        │
│ [⬇ Import] [📖 Preview]                 │
│                                         │
│ ⭐⭐⭐⭐ (4.2)                            │
│ Compressor Maintenance Guide v2.0       │
│ By: Eurostar ME Team                    │
│ Downloads: 834                          │
│ [⬇ Import] [📖 Preview]                 │
└─────────────────────────────────────────┘
```

---

#### 3.3 CAD/BOM System Integration 🔮 LOW PRIORITY

**Vision:** Auto-suggest parts from CAD models.

**Integration Points:**
- Import BOM from CAD (SolidWorks, AutoCAD)
- Match parts to existing template items
- Suggest alternatives from approved suppliers
- Flag obsolete or non-preferred parts

---

#### 3.4 Field Failures Feedback Loop 🔮 MEDIUM PRIORITY

**Vision:** Field failures automatically update templates.

**Flow:**
```
1. Field failure reported in Service Portal
   ↓
2. Root cause analysis: "Compressor seal failure"
   ↓
3. System identifies related templates:
   - "Standard HVAC PFMEA" (missing this failure mode)
   - "HVAC BOM Template" (seal part number)
   ↓
4. Suggests template updates:
   "Add 'Seal failure' to HVAC PFMEA template?"
   ↓
5. Engineer reviews and approves
   ↓
6. Template updated, all future projects benefit
```

---

## Implementation Priority Matrix

### Q2 2026 (Horizon 1)
| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| One-Click Template Application | 🔴 High | Medium | High |
| BOM Templates | 🔴 High | Medium | High |
| CTQ Templates | 🔴 High | Low | High |
| Template Versioning | 🔴 High | Medium | Medium |
| PFD Templates | 🟡 Medium | Medium | Medium |
| Gate Checklist Templates | 🟡 Medium | Low | Medium |
| Template Analytics | 🟡 Medium | High | Medium |

### Q3 2026 (Horizon 2)
| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| Automated Template Generation | 🔴 High | High | High |
| AI Template Recommendations | 🟡 Medium | High | High |
| RPN Trend Analysis | 🟡 Medium | Medium | Medium |
| Template Health Scoring | 🟡 Medium | Medium | Low |
| Cross-Family Pattern Detection | 🟢 Low | High | Medium |

### Q4 2026 (Horizon 3)
| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| Field Failures Feedback Loop | 🟡 Medium | High | High |
| Predictive Risk Alerts | 🟢 Low | High | Medium |
| Template Marketplace | 🟢 Low | High | Low |
| CAD/BOM Integration | 🟢 Low | Very High | Medium |

---

## Technical Architecture

### Data Layer Enhancements

**New Tables:**
```sql
-- Core template tables (see section 1.1 for schema)
family_bom_templates
family_ctq_templates
family_pfd_templates
family_gate_checklist_templates

-- Analytics and tracking
family_template_usage (tracks when templates applied to projects)
family_template_history (audit trail of changes)
family_template_health_scores (cached health metrics)
family_rpn_trends (quarterly RPN snapshots)
family_field_failure_links (links failures to template gaps)
```

**Indexes:**
```sql
CREATE INDEX idx_family_templates_lookup 
  ON family_pfmea_templates(user_id, family_id, template_name);

CREATE INDEX idx_template_usage_project 
  ON family_template_usage(project_id);

CREATE INDEX idx_template_health_family 
  ON family_template_health_scores(family_id, scored_at DESC);
```

### API Layer

**New Functions:**
```javascript
// Template application
window.familyTemplatesApplyMulti = function(familyId, templateTypes) {
  // Apply PFMEA + BOM + CTQ + PFD + Gate templates in one call
}

// Analytics
window.familyAnalyticsGetReport = function(familyId, options) {
  // Return usage, quality, improvement metrics
}

// Recommendations
window.familyRecommendationsGet = function(projectAttributes) {
  // Return ranked template recommendations
}

// Health scoring
window.familyTemplatesCalculateHealth = function(templateId) {
  // Calculate and cache health score
}
```

### UI Components

**New Modals:**
- Template Application Wizard (multi-template selection)
- Template History Viewer (version timeline)
- Family Analytics Dashboard (metrics and charts)
- Create Template from Project Wizard (extraction flow)

**Enhanced Views:**
- Family cards show template counts for all types (PFMEA, BOM, CTQ, PFD, Gates)
- Health score badges on templates (✅ 🟡 ⚠️ ❌)
- Usage statistics on template cards ("Used in 12 projects")

---

## Success Metrics

### Adoption Metrics
- **Template Usage Rate:** % of new projects using family templates
  - Target: 80% by Q4 2026
- **Templates per Family:** Average number of templates created per family
  - Target: 5+ (PFMEA, BOM, CTQ, PFD, Gates)
- **Template Application Rate:** Average templates applied per project
  - Target: 3.5+

### Efficiency Metrics
- **NPI Setup Time:** Time from project creation to PFMEA/BOM/CTQ complete
  - Baseline: 4 hours (manual)
  - Target: 45 minutes (with templates) → **80% reduction**
- **Template Creation Time:** Time to create new template from project
  - Target: <10 minutes (automated extraction)

### Quality Metrics
- **RPN Trend:** Average RPN across all families
  - Target: -15% year-over-year improvement
- **Field Failure Rate:** Failures linked to missing template items
  - Target: 0 (all lessons learned captured in templates)
- **Template Health:** % of templates with health score >70
  - Target: 90%

### Business Impact
- **Engineering Hours Saved:** Hours saved per project × projects per year
  - Example: 3.5 hours saved × 50 projects/year = **175 hours/year**
- **Failure Prevention:** Estimated cost of failures prevented
  - Example: 2 field failures prevented × £50k each = **£100k/year**

---

## Risks & Mitigations

### Risk: Template Quality Degradation
**Problem:** Users create low-quality templates that propagate errors.

**Mitigation:**
- Template review workflow (require approval before publishing)
- Health scoring flags low-quality templates
- Template certification program (expert-reviewed templates get badge)

---

### Risk: Template Sprawl
**Problem:** Too many similar templates cause confusion.

**Mitigation:**
- Duplicate detection ("Similar template already exists")
- Template consolidation recommendations
- Archive unused templates automatically

---

### Risk: User Resistance
**Problem:** Engineers prefer creating from scratch.

**Mitigation:**
- Make templates the default option (opt-out not opt-in)
- Show time savings ("You saved 2 hours using templates")
- Gamification (badges for template contributors)

---

### Risk: Data Overload
**Problem:** Too many metrics overwhelm users.

**Mitigation:**
- Progressive disclosure (basic metrics first, advanced on demand)
- Actionable insights only ("Do this" not just "Here's data")
- Executive summaries (one-page family health report)

---

## Next Steps

### Immediate (Week 1–2)
1. **Prioritize Horizon 1 features** — Select 3–4 for Q2 sprint
2. **Database schema design** — Finalize new table structures
3. **Create technical specs** — Detailed implementation plans for each feature
4. **User research** — Interview 5–10 engineers about template needs

### Short-Term (Month 1–2)
1. **Implement BOM Templates** — First new template type
2. **Implement CTQ Templates** — Second template type
3. **One-Click Application** — Integrate into project creation flow
4. **Beta testing** — 3–5 power users test new features

### Medium-Term (Month 3–6)
1. **Template Versioning** — Audit trail and history
2. **Analytics Dashboard** — Usage and quality metrics
3. **Automated Template Generation** — Extract from projects
4. **Rollout to all users** — Training and documentation

---

## Appendix: Example User Journeys

### Journey 1: New Project Setup (5 minutes)
```
1. User clicks "➕ New Project"
2. Enters: Name="Class 158 HVAC", Customer="RailCorp", Family="HVAC"
3. System recommends:
   - "Standard HVAC PFMEA" (95% match)
   - "RailCorp BOM Kit" (88% match)
   - "Class 158 CTQ" (82% match)
4. User clicks "Apply All"
5. Project created with:
   - 18 PFMEA failure modes
   - 45 BOM parts
   - 12 CTQ requirements
   - 7 PFD steps
   - 24 gate checklist items
6. User reviews and customizes (15 minutes total)
7. ✅ Project ready for execution
```

**Time Saved:** 3.5 hours vs. manual creation

---

### Journey 2: Template Creation from Project (10 minutes)
```
1. User opens completed project "Class 158 HVAC Overhaul"
2. Clicks "📋 Create Template from Project"
3. Selects: PFMEA ✓ BOM ✓ CTQ ✓
4. Names: "Class 158 HVAC Template v1.0"
5. System extracts:
   - 18 PFMEA items (filtered high-RPN only)
   - 45 BOM items (ABC-classified)
   - 12 CTQ requirements (priority-ranked)
6. User reviews preview, clicks "Publish"
7. ✅ Template available for future projects
```

**Knowledge Captured:** 6 months of project learning → reusable asset

---

### Journey 3: Template Health Review (5 minutes)
```
1. Family owner receives email: "HVAC Template Health Alert"
2. Opens analytics dashboard
3. Sees: "Standard HVAC PFMEA v2.3" health score dropped to 65
   - Reason: Not updated in 18 months
   - Linked to 1 field failure (compressor seal)
4. Clicks "Review Failure"
5. Adds new failure mode: "Seal degradation over time"
6. Updates template to v2.4
7. ✅ Health score restored to 88
8. ✅ All future projects benefit from lesson learned
```

**Risk Prevented:** Recurrence of seal failure in future projects

---

## Conclusion

This plan transforms product families from a **passive categorization system** into an **active knowledge management platform** that:

1. **Accelerates NPI** — 80% reduction in setup time
2. **Captures Learning** — Every project contributes to organizational knowledge
3. **Improves Quality** — Data-driven insights reduce RPN over time
4. **Prevents Failures** — Field issues feed back into template updates
5. **Scales Expertise** — Best practices available to all engineers

**Investment:** ~6 months development (3 horizons)  
**Return:** 175 engineering hours saved/year + £100k failure prevention/year  
**Strategic Value:** Institutional memory that grows with every project

---

**Ready to begin?** Start with Horizon 1, Feature 1.1 (One-Click Template Application) — highest impact, lowest complexity.
