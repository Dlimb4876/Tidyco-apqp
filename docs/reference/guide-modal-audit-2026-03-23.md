# Guide Modal Audit Report

**Date:** 2026-03-23  
**Scope:** All guide modal content in `utils/js/guide.js` vs actual application state  
**Status:** 🔴 **SIGNIFICANT OUTDATED CONTENT FOUND**

---

## Executive Summary

The guide modal system (`utils/js/guide.js`) contains **29 guide keys**, all of which are referenced correctly in the codebase. However, the **content** of several guides is significantly out of date with the current application state.

### Critical Findings

| Issue | Severity | Files Affected |
|-------|----------|----------------|
| Missing Logistics & Unit 6 capacity streams | 🔴 High | `capacity` guide |
| No guide keys for Logistics/Unit 6 tabs | 🔴 High | `utils/js/guide.js` |
| PFMEA missing template system & MCS integration | 🟡 Medium | `npi-pfmea` guide |
| APQP missing sub-assembly & flowchart features | 🟡 Medium | `npi-apqp` guide |
| Product Development missing overhaul trends | 🟡 Medium | `product-development` guide |
| Production navigation incomplete | 🟡 Medium | `production` guide |

---

## Detailed Findings

### 1. ❌ Capacity Hub Guide — Missing 2 Departments

**Guide Key:** `capacity`  
**Location:** `utils/js/guide.js` lines 37-54  
**Severity:** 🔴 High

#### What the Guide Says

> "The Capacity Management portal lets you plan and monitor workload across **three** operational streams."

Lists only:
- 🚂 Production Capacity
- 🧑‍🔧 Manufacturing Engineering (ME)
- 📅 Project Management (PM)

#### What Actually Exists

**Five** streams (see `portals/capacity/js/capacity.js`):

```javascript
// Capacity tab navigation (line 25-31)
<button class="prod-nav-item" data-tab="production">🚂 Production</button>
<button class="prod-nav-item" data-tab="me">🧑‍🔧 ME</button>
<button class="prod-nav-item" data-tab="projects">📅 Projects</button>
<button class="prod-nav-item" data-tab="logistics">🚚 Logistics</button>    ← MISSING
<button class="prod-nav-item" data-tab="unit6">🏭 Unit 6</button>          ← MISSING
```

#### Required Fix

Update guide to list all 5 streams and explain the department structure.

---

### 2. ❌ Missing Guide Keys — Logistics & Unit 6

**Guide Keys:** *(none exist)*  
**Location:** N/A — keys are missing  
**Severity:** 🔴 High

#### What Exists in Application

**Logistics Capacity** (`portals/capacity/logistics/js/log-capacity.js`):
```javascript
// Same tab structure as ME:
- 📊 Capacity Chart
- 👷 Team
- 📋 Tasks
- 🚂 Product Support
- 📦 Product Load
- 🏖️ Holiday Planner
```

**Unit 6 Capacity** (`portals/capacity/unit6/js/unit6-capacity.js`):
```javascript
// Same tab structure as ME:
- 📊 Capacity Chart
- 👷 Team
- 📋 Tasks
- 🚂 Product Support
- 📦 Product Load
- 🏖️ Holiday Planner
```

#### Required Fix

Add two new guide keys:
- `capacity-logistics`
- `capacity-unit6`

---

### 3. ❌ ME Capacity Guide — Missing Department Context

**Guide Key:** `capacity-me`  
**Location:** `utils/js/guide.js` lines 57-89  
**Severity:** 🟡 Medium

#### What's Missing

- No mention that the same tabs exist for **Logistics** and **Unit 6** departments
- Guide doesn't explain that ME, Logistics, and Unit 6 all share the same underlying data structure with department filtering
- No explanation of how data is separated by department tag

#### Actual Tab Structure

From `portals/capacity/js/me-capacity.js` lines 67-72:
```javascript
<button data-tab="chart">📊 Capacity Chart</button>
<button data-tab="team">👷 Team</button>
<button data-tab="tasks">📋 Tasks</button>
<button data-tab="products">🚂 Product Support</button>
<button data-tab="product-taskload">📦 Product Load</button>
<button data-tab="holidays">🏖️ Holiday Planner</button>
```

#### Required Fix

Add note explaining department replication and data separation.

---

### 4. ❌ NPI/APQP Guide — Missing Sub-assemblies & Flowchart

**Guide Key:** `npi-apqp`  
**Location:** `utils/js/guide.js` lines 236-258  
**Severity:** 🟡 Medium

#### What's Missing

The guide mentions the four tabs (CTQ, PFD, PFMEA, Control Plan) but doesn't document:

1. **Sub-assembly support** in PFD
   - `+ Sub-assembly` button to insert group headers
   - Collapsible step groups for complex processes

2. **Flowchart view** vs Table view toggle in PFD
   - Visual flow diagram mode
   - Step type configuration (Start, Process, Decision, End)
   - Branch destination mapping

3. **BOM resource linking** directly from PFD steps
   - `+ Resource` button on each step
   - Links to parts, tools, equipment, materials, consumables, kits

#### Required Fix

Add sections for sub-assemblies, flowchart view, and BOM linking workflow.

---

### 5. ❌ PFMEA Guide — Missing Templates & MCS Integration

**Guide Key:** `npi-pfmea`  
**Location:** `utils/js/guide.js` lines 280-343  
**Severity:** 🟡 Medium

#### What's Missing

1. **PFMEA Template System**
   - Family templates from Product Family Database
   - `Apply Template` button to import standard failure modes
   - Template customization per project

2. **MCS Integration**
   - PFMEA changes can create Manufacturing Change宋 requests
   - Link from PFMEA history to Change Register
   - Approval workflow for high-impact changes

3. **Bulk Edit Capabilities**
   - Multi-row selection and edit
   - Batch RPN recalculation

4. **Sync to Control Plan Workflow**
   - `Sync from PFMEA` button in Control Plan tab
   - Auto-population of control methods from causes

#### Required Fix

Add sections for template system, MCS integration, and sync workflow.

---

### 6. ❌ Product Development Guide — Missing Overhaul Trends

**Guide Key:** `product-development`  
**Location:** `utils/js/guide.js` lines 165-189  
**Severity:** 🟡 Medium

#### What the Guide Says

Lists 4 sections:
- 📋 NPI Projects
- 📦 Product Management
- 🏢 Product Family Database
- 🔩 Parts Database

#### What's Missing

1. **Overhaul Trends Chart** (in Product Management tab)
   - Historical overhaul frequency visualization
   - KPI metrics for high-turn products
   - Links to detailed overhaul history

2. **Product Lifecycle Status Workflow**
   - Status progression: Tender → NPI → Production → Closed
   - How status affects NPI Projects lane placement
   - Gate completion requirements per status

3. **Family Template Application Workflow**
   - How to apply PFMEA templates from families
   - Template customization process

#### Required Fix

Add overhaul trends section and expand Product Management description.

---

### 7. ❌ Production Guide — Incomplete Navigation

**Guide Key:** `production`  
**Location:** `utils/js/guide.js` lines 689-713  
**Severity:** 🟡 Medium

#### What's Missing

1. **Plan by Product View**
   - Groups all batches by product
   - Shows production history and forward schedule per product
   - Guide key `production-by-product` exists but not mentioned in hub guide

2. **Plan by Work Area View**
   - Groups batches by assigned work area
   - Identifies work area congestion
   - Guide key `production-by-unit` exists but not mentioned in hub guide

3. **Real-time Sync Explanation**
   - How Production Scheduling feeds Capacity charts
   - Live updates across connected users
   - Data flow to Operations Dashboard

#### Required Fix

Expand guide to describe all three views and real-time data flow.

---

### 8. ✅ Operations Dashboard Guide — CORRECT

**Guide Key:** `operations`  
**Location:** `utils/js/guide.js` lines 753-813  
**Status:** ✅ Accurate

#### Verification

Guide lists 6 tabs:
- ✅ Overview
- ✅ Flow
- ✅ Risk
- ✅ People
- ✅ Actions
- ✅ Forecast

All 6 tabs exist in `portals/operations/js/operations-dashboard-main.js` lines 127-132.

**No changes required.**

---

### 9. ✅ Guide Keys — All Referenced Keys Defined

**Status:** ✅ All 29 guide keys have matching definitions

Every guide key called in the codebase has a corresponding entry in `GUIDE_CONTENT`:

| Guide Key | Usage Count | Status |
|-----------|-------------|--------|
| `hub` | 2 | ✅ |
| `capacity` | 1 | ✅ |
| `capacity-me` | 1 | ✅ |
| `capacity-production` | 1 | ✅ |
| `capacity-pm` | 1 | ✅ |
| `product-development` | 1 | ✅ |
| `npi-projects` | 2 | ✅ |
| `npi-dashboard` | 1 | ✅ |
| `npi-apqp` | 1 | ✅ |
| `npi-ctq` | 1 | ✅ |
| `npi-pfd` | 1 | ✅ |
| `npi-pfmea` | 1 | ✅ |
| `npi-cp` | 1 | ✅ |
| `npi-actions` | 1 | ✅ |
| `npi-risks` | 1 | ✅ |
| `npi-bom` | 1 | ✅ |
| `npi-timing` | 1 | ✅ |
| `npi-gates` | 1 | ✅ |
| `product-management` | 1 | ✅ |
| `product-family-db` | 1 | ✅ |
| `parts-database` | 1 | ✅ |
| `production` | 1 | ✅ |
| `production-scheduling` | 1 | ✅ |
| `production-by-product` | 1 | ✅ |
| `production-by-unit` | 1 | ✅ |
| `operations` | 1 | ✅ |
| `mcs` | 1 | ✅ |
| `action-centre` | 1 | ✅ |
| `feedback` | 1 | ✅ |

**Total:** 29 keys, all defined, all referenced correctly.

---

## Implementation Patterns Found

### Pattern 1: Direct onclick Handler

```javascript
onclick="showGuide('hub')"
```

**Used in:** Hub, ME Capacity, Feedback, MCS, Action Centre

---

### Pattern 2: Data Attribute with Event Delegation

```html
<button 
  data-action="show-guide" 
  data-guide-key="production" 
  title="User Guide">
  ❓ Guide
</button>
```

```javascript
if (action === 'show-guide') {
  const key = actionEl.dataset.guideKey;
  if (key && typeof showGuide === 'function') showGuide(key);
}
```

**Used in:** Capacity Hub, Production Hub, Product Development Hub

---

### Pattern 3: NPI data-guide Attribute

```html
<button 
  data-action="show-guide" 
  data-guide="npi-pfmea" 
  title="User Guide">
  ❓ Guide
</button>
```

```javascript
case 'show-guide': { 
  const key = el.getAttribute('data-guide'); 
  if (key && typeof showGuide === 'function') showGuide(key); 
  break 
}
```

**Used in:** NPI portal files (PFMEA, PFD, BOM)

---

## Recommended Actions

### Priority 1: Critical (Missing Content)

1. **Add `capacity-logistics` guide key**
   - Document Logistics capacity tabs
   - Explain kitting booking and product movement tracking

2. **Add `capacity-unit6` guide key**
   - Document Unit 6 capacity tabs
   - Explain department-specific features

3. **Update `capacity` guide**
   - Change "three streams" to "five streams"
   - Add Logistics and Unit 6 sections

### Priority 2: High (Significant Omissions)

4. **Update `npi-pfmea` guide**
   - Add PFMEA template system section
   - Add MCS integration section
   - Mention bulk edit capabilities

5. **Update `npi-apqp` guide**
   - Add sub-assembly support section
   - Add flowchart view vs table view section
   - Mention BOM resource linking

### Priority 3: Medium (Incomplete Descriptions)

6. **Update `product-development` guide**
   - Add overhaul trends chart section
   - Expand Product Management lifecycle status explanation

7. **Update `production` guide**
   - Add Plan by Product description
   - Add Plan by Work Area description
   - Explain real-time sync with Capacity

8. **Update `capacity-me` guide**
   - Add note about department replication
   - Explain data separation by department tag

---

## Files to Modify

| File | Lines | Changes Required |
|------|-------|------------------|
| `utils/js/guide.js` | 37-54 | Update `capacity` guide |
| `utils/js/guide.js` | 57-89 | Update `capacity-me` guide |
| `utils/js/guide.js` | ~890 | Add `capacity-logistics` key |
| `utils/js/guide.js` | ~890 | Add `capacity-unit6` key |
| `utils/js/guide.js` | 236-258 | Update `npi-apqp` guide |
| `utils/js/guide.js` | 280-343 | Update `npi-pfmea` guide |
| `utils/js/guide.js` | 165-189 | Update `product-development` guide |
| `utils/js/guide.js` | 689-713 | Update `production` guide |

---

## Test Coverage

After updates, verify guide modals with:

```bash
npm test -- tests/hub.test.js
npm test -- tests/capacity-hub.test.js
npm test -- tests/product-development.test.js
```

All tests mock `showGuide` function — no test changes required for content updates.

---

## Related Documentation

- `QWEN.md` — Project overview and conventions
- `CLAUDE.md` — AI worker reference
- `utils/js/guide.js` — Guide modal system source
- `index.html` — Guide modal HTML structure (lines 527-532)

---

**Report generated:** 2026-03-23  
**Next audit:** After guide content updates are applied
