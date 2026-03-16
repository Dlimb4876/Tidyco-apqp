# Sub-Assembly Visibility Improvements

## Current State Analysis

### What is "APQP TOOLS %"?

The **"APQP TOOLS %"** metric on sub-assembly cards measures **completion of the 4 core APQP sections**:

- **CTQ** (Critical-to-Quality requirements)
- **PFD** (Process Flow Diagram)
- **PFMEA** (Process Failure Mode & Effects Analysis)
- **CP** (Control Plan)

**Calculation Logic** (from `dashboard.js:446-447`):
```javascript
const apqpSectionsDone = ['ctq', 'pfd', 'pfmea', 'cp'].filter(k => (sp[k] || []).length > 0).length
const apqpPct = Math.round((apqpSectionsDone / 4) * 100)
```

- Checks if each section has **at least one item** (array length > 0)
- Counts how many of the 4 sections have content (0-4)
- Converts to percentage: `(sections_with_content / 4) × 100`
- **Possible values:** 0%, 25%, 50%, 75%, or 100%
- **Color coding:** Green (≥50%), Amber (<50%)

---

### Current Sub-Assembly Placement

Sub-assemblies are currently **buried in a collapsible details section** at the bottom of the dashboard:

```
Project Dashboard Layout:
1. Hero section (project name, metadata)
2. Command strip (KPIs: Current Gate, Critical Attention, Risk Heat)
3. Gate Trajectory (6 gates with progress visualization)
4. Quick Launch buttons (APQP, BOM, Timing, Actions, Risks, Documents)
5. Project Snapshot (family, customer, unit, PM, etc.)
6. ❌ Details section (COLLAPSED BY DEFAULT)    ← Sub-assemblies hidden here
   - Sub-assemblies
   - RPN Burndown
   - Open Actions and Top Risks
```

**Problems with current placement:**
- Hidden inside collapsed `<details>` element (line 632-635)
- User must manually expand to see sub-assemblies
- No visual indication of sub-assembly count or status when collapsed
- Low priority positioning suggests sub-assemblies are less important than they actually are

---

## Improvement Ideas

### 🎯 Recommended: Option 1 — Promote to Main Dashboard Panel

**Impact:** HIGH | **Effort:** LOW

Move sub-assemblies from the collapsible details section to a **dedicated panel** in the main dashboard layout (similar to Gate Trajectory panel).

**Changes:**
1. Create new panel section between Gate Trajectory and Quick Launch
2. Add panel header with count badge: `Sub-Assemblies (3)`
3. Keep existing card grid design (already well-designed)
4. Add quick stats summary in panel header: `75% avg completion · 12 total BoM items`

**Benefits:**
- ✅ Immediate visibility without requiring user interaction
- ✅ Minimal code changes (just move HTML, add header)
- ✅ Matches existing dashboard design language
- ✅ Can still collapse if space is needed on mobile

**Layout after change:**
```
1. Hero section
2. Command strip
3. Gate Trajectory ← existing
4. 🆕 SUB-ASSEMBLIES PANEL ← promoted from details
5. Quick Launch
6. Project Snapshot
7. Details (collapsed by default)
   - RPN Burndown
   - Open Actions and Top Risks
```

---

### 🔥 Option 2 — Add Sub-Assembly Summary to Command Strip

**Impact:** VERY HIGH | **Effort:** MEDIUM

Add a fourth card to the command strip (alongside Current Gate, Critical Attention, Risk Heat) showing sub-assembly status.

**Changes:**
1. Add new `.cmd-card` to command strip
2. Display: Count of sub-assemblies + lowest completion %
3. Click to scroll to/expand sub-assemblies section
4. Color code: Green (all >75%), Amber (any 25-75%), Red (any <25%)

**Benefits:**
- ✅ Top-level KPI visibility (prime real estate)
- ✅ Draws immediate attention to sub-assembly health
- ✅ Consistent with existing dashboard patterns

**Potential issues:**
- Command strip may feel crowded with 4 cards
- May need responsive breakpoint adjustments

**Command strip after change:**
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Current Gate │ Critical     │ Risk Heat    │ 🆕 Sub-Asms  │
│              │ Attention    │              │              │
│   Gate 3     │      5       │      8       │    3 total   │
│ Design Review│ Overdue acts │ High risks   │ 67% avg done │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

---

### 📊 Option 3 — Enhanced Card Design with More Metrics

**Impact:** MEDIUM | **Effort:** MEDIUM

Keep current placement but significantly improve the **information density** and **visual hierarchy** of sub-assembly cards.

**Changes:**
1. Larger cards with more prominent metrics
2. Add mini gate trajectory bar (show which gates are complete)
3. Add health indicators: 🟢 Healthy | 🟡 Needs Attention | 🔴 Blocked
4. Show critical action count and high-risk count
5. Add "last updated" timestamp

**Benefits:**
- ✅ More actionable information at a glance
- ✅ Better visual hierarchy (easier scanning)
- ✅ No layout changes required

**Potential issues:**
- Cards may become too large (400-500px wide minimum)
- Grid may need to change from 3-4 columns to 2 columns

---

### 🎨 Option 4 — Sub-Assembly Status Badge in Hero Section

**Impact:** LOW | **Effort:** LOW

Add a compact badge next to the project name in the hero section showing sub-assembly count and status.

**Changes:**
1. Add badge after project name: `Project X · 🔩 3 Sub-Asms (2 complete)`
2. Click badge to scroll to/expand sub-assemblies section

**Benefits:**
- ✅ Very low effort
- ✅ Always visible
- ✅ Doesn't disrupt existing layout

**Potential issues:**
- Limited information (just count and completion)
- Easy to overlook

---

### 🚀 Option 5 — Dedicated Sub-Assembly Tab/View

**Impact:** HIGH | **Effort:** HIGH

Create a dedicated top-level navigation tab for sub-assemblies (like APQP, BOM, Timing, etc.).

**Changes:**
1. Add "Sub-Assemblies" to main navigation
2. Create full-screen sub-assembly management view
3. Show dependency graph, detailed metrics, bulk actions
4. Add filtering and sorting capabilities

**Benefits:**
- ✅ Most powerful and feature-rich option
- ✅ Can include advanced features (dependency visualization, etc.)
- ✅ Scales to projects with many sub-assemblies (10+)

**Potential issues:**
- Significant development effort
- Hides sub-assemblies behind navigation (not on main dashboard)
- May be overkill for typical usage (most projects have 2-4 sub-assemblies)

---

### 🎯 Option 6 — Sub-Assembly Swimlane in Gate Trajectory

**Impact:** MEDIUM | **Effort:** MEDIUM

Integrate sub-assembly progress directly into the Gate Trajectory visualization.

**Changes:**
1. Show parent project gates on top row
2. Show each sub-assembly as additional rows below
3. Align gates vertically to show dependencies
4. Color-code by completion status

**Benefits:**
- ✅ Shows parent-child relationship visually
- ✅ Easy to see if sub-assemblies are blocking parent gates
- ✅ Consolidated view of all project elements

**Potential issues:**
- Trajectory section may become very tall (10+ rows if many sub-asms)
- Complexity increases significantly
- May be visually overwhelming

---

## Recommended Implementation Plan

### Phase 1: Quick Wins (Choose 1-2)

**Recommended combination: Option 1 + Option 4**

1. **Promote to Main Dashboard Panel** (Option 1)
   - Move from collapsed details to dedicated visible panel
   - Add panel header with count and summary stats

2. **Add Hero Badge** (Option 4)
   - Add compact badge next to project name
   - Provides redundant visibility at top of page

**Implementation:**
- Time estimate: 1-2 hours
- Files to modify: `dashboard.js` (layout), `dashboard.css` (minimal)
- Breaking changes: None
- Mobile responsive: Already handled by existing grid system

### Phase 2: Enhanced Metrics (Optional)

If users want more detailed information:

3. **Enhance Card Design** (Option 3)
   - Add mini gate trajectory
   - Add health indicators
   - Increase information density

**Implementation:**
- Time estimate: 2-3 hours
- Files to modify: `dashboard.js` (card rendering), `dashboard.css` (card styles)
- Breaking changes: None
- Mobile responsive: Requires grid column adjustment

### Phase 3: Power Features (If needed)

Only if projects regularly have 10+ sub-assemblies:

4. **Dedicated Sub-Assembly Tab** (Option 5)
   - Full management interface
   - Advanced filtering and sorting

**Implementation:**
- Time estimate: 1-2 days
- Files to modify: Multiple (new files needed)
- Breaking changes: None
- Requires: Navigation changes, new route, new tests

---

## Metrics Naming Improvements

Consider renaming "APQP TOOLS %" to be more clear about what it measures:

**Current:** "APQP tools" (ambiguous — tools? software tools? what tools?)

**Better options:**
- ✅ "APQP sections" (clear: CTQ, PFD, PFMEA, CP)
- ✅ "APQP completion" (already used in progress bar label)
- ✅ "Section progress" (concise)
- ⚠️ "APQP readiness" (could be confused with gate readiness)

**Recommended:** Change label from "APQP tools" to "APQP sections" for clarity.

Location: `dashboard.js:457`

---

## Mobile Considerations

All options should maintain mobile responsiveness:

- Current grid uses `minmax(200px, 1fr)` — works well on mobile
- Existing CSS has proper breakpoints at 767px and 768px
- Any new panels should collapse/stack on mobile (already standard pattern)

---

## Testing Checklist

Before implementation:
- [ ] Verify no projects currently visible in production will break
- [ ] Test with 0 sub-assemblies (should show empty state)
- [ ] Test with 1 sub-assembly
- [ ] Test with 10+ sub-assemblies (grid overflow)
- [ ] Test mobile layout at 375px width
- [ ] Test tablet layout at 768px width
- [ ] Verify real-time updates work (if sub-assembly data changes)

---

## Summary

**What APQP TOOLS % measures:**
- Completion of 4 core APQP sections (CTQ, PFD, PFMEA, CP)
- Simple presence check: Does each section have at least one item?
- Result: 0%, 25%, 50%, 75%, or 100%

**Recommended improvements:**
1. **Promote sub-assemblies to main dashboard panel** (high impact, low effort)
2. **Add sub-assembly badge in hero section** (always visible, minimal effort)
3. Optional: **Enhance card design** with more metrics (if needed)

These changes will make sub-assemblies much more prominent without requiring major architectural changes.
