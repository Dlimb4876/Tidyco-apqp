# MCS Layout Improvement Plan

**Objective:** Redesign the Manufacturing Change System (MCS) portal for better information hierarchy, usability, and visual clarity.

**Date:** 2026-03-21  
**Priority:** High  
**Estimated Effort:** 6-8 hours

---

## Current Issues Identified

### 1. **Layout Problems**
- ❌ **Sidebar overload:** 4 filter sections (Status, Priority, Type, Source) create visual clutter
- ❌ **Wasted horizontal space:** 220px fixed sidebar could be better utilized
- ❌ **Card information density:** Too much crammed into meta rows, hard to scan
- ❌ **Modal width:** 760px is narrow for complex change forms
- ❌ **Approval chain:** Takes excessive vertical space in modal (28px padding + 20px bottom margin)

### 2. **Information Hierarchy Issues**
- ❌ **No quick stats dashboard:** Users can't see at-a-glance metrics
- ❌ **Hidden important info:** Part/drawing number buried in submeta
- ❌ **Impact count not prominent:** Critical info relegated to card corner
- ❌ **No visual priority indicator:** Only a 7px dot (easily missed)
- ❌ **Target implementation date:** Only shown in submeta, should be more prominent for planning

### 3. **Filtering & Search**
- ❌ **Search is basic:** Only searches title, ID, part number, initiator, type
- ❌ **No date range filter:** Can't filter by created date or target date
- ❌ **No "My Changes" filter:** Can't quickly see changes I initiated or need to review
- ❌ **Filter counts take space:** Could be more compact
- ❌ **No multi-select filters:** Can only filter by one status at a time

### 4. **Card Design Issues**
- ❌ **Inconsistent information:** Some cards show target date, some don't
- ❌ **Status pill position:** Right-aligned but varies with content length
- ❌ **Time impact badge:** Uses emoji (⏱) instead of icon
- ❌ **Priority text redundant:** Already has colored dot, text is redundant
- ❌ **No hover preview:** Must click to see any details

### 5. **Modal/Form Issues**
- ❌ **Two-column grid too narrow:** Fields feel cramped at 380px each
- ❌ **Impact assessment hidden:** Checkboxes not visible without scrolling
- ❌ **Timeline at bottom:** Often not visible without scrolling
- ❌ **Approval chain dominates:** Takes more space than actual content
- ❌ **No quick actions:** Can't approve/reject from view modal without scrolling

### 6. **Theme Integration**
- ❌ **Hardcoded status colors:** `--mcs-status-*` variables don't support dark mode
- ❌ **Hardcoded priority colors:** `.mcs-priority-medium` uses `#2563eb` directly
- ❌ **Status pills use hex colors:** `#dbeafe`, `#fef3c7`, etc. should use theme vars

---

## Proposed Improvements

### Phase 1: Dashboard & Stats (1.5 hours)

#### 1.1 Add KPI Dashboard Above Toolbar

```
┌─────────────────────────────────────────────────────────────────┐
│  [Open: 12]  [Awaiting Review: 5]  [Overdue: 3]  [This Week: 8] │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Add `mcs-dashboard` component above toolbar
- Show 4-5 key metrics in clickable cards
- Clicking a metric applies the corresponding filter
- Use theme colors: `--blue`, `--amber`, `--red`, `--green`

**CSS Variables:**
```css
--mcs-kpi-bg: var(--surface);
--mcs-kpi-border: var(--line);
--mcs-kpi-value: var(--ink);
--mcs-kpi-label: var(--muted);
```

---

### Phase 2: Sidebar Redesign (2 hours)

#### 2.1 Consolidate Filters into Accordion Sections

**Current:** All sections expanded, 20+ buttons visible  
**Proposed:** Collapsible sections, max 2-3 expanded at once

```
┌──────────────────────┐
│ 🔍 Search...         │
├──────────────────────┤
│ ▼ Status        [4]  │  ← Click to expand
│   ● Open        [12] │
│   ● Review      [5]  │
│   ● Implement   [3]  │
├──────────────────────┤
│ ▶ Priority      [2]  │  ← Collapsed
├──────────────────────┤
│ ▶ Type          [All]│
├──────────────────────┤
│ ▶ Source        [All]│
├──────────────────────┤
│ ▼ Quick Filters      │
│   ☐ My Changes       │
│   ☐ Overdue Only     │
│   ☐ High Priority    │
└──────────────────────┘
```

**New Features:**
- **"My Changes" filter:** Shows changes where `initiated_by = currentUser.email`
- **"Overdue Only" filter:** Shows changes where `target_implementation < today` and status not closed
- **"High Priority" filter:** Shows critical + high priority
- **Multi-select support:** Ctrl+click to select multiple statuses

#### 2.2 Reduce Sidebar Width on Desktop

**Current:** 220px fixed  
**Proposed:** 200px default, collapsible to 48px (icons only)

```css
.mcs-sidebar {
  width: 200px;
  transition: width 0.2s;
}
.mcs-sidebar.collapsed {
  width: 48px;
}
```

---

### Phase 3: Card Redesign (2 hours)

#### 3.1 New Card Layout

**Current:**
```
┌────────────────────────────────────────────────────────┐
│ MCS-0042  Title text...         [Status]               │
│           [Type] ● priority     [Impacts]              │
│           User • Part • Date    [⏱ 4h]                 │
└────────────────────────────────────────────────────────┘
```

**Proposed:**
```
┌────────────────────────────────────────────────────────┐
│ MCS-0042                    [Status Pill - Top Right]  │
│ Title text that describes the change request           │
│                                                         │
│ [Type] [Priority Badge]     [Impacts] [⏱ 4h]          │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│ 👤 User  📦 Part-123  📅 Created: Jan 15  🎯 Due: Feb 1│
└────────────────────────────────────────────────────────┘
```

**Key Changes:**
1. **Priority badge:** Replace 7px dot with pill badge
2. **Icons for meta:** Use emoji/icons for user, part, dates
3. **Target date prominent:** Show with `🎯` icon, highlight if overdue
4. **Separator line:** Visual break between primary and meta info
5. **Consistent height:** All cards same min-height for grid alignment

#### 3.2 Add Hover Preview Card

On hover, show a quick preview tooltip:
- First 2 lines of description
- Impact types (Engineering, Process, etc.)
- Current approver name
- Days until target date

---

### Phase 4: Modal Improvements (2 hours)

#### 4.1 Wider Modal for Complex Forms

**Current:** 760px  
**Proposed:** 900px for create/edit, 800px for view

```css
.mcs-modal-create { width: 900px; }
.mcs-modal-view { width: 800px; }
```

#### 4.2 Reorganize Modal Content

**New Order:**
1. **Header** (title, ref badge, close)
2. **Quick Actions Bar** (Approve/Reject/Request Info) - if pending approval
3. **Approval Chain** (reduced padding: 16px → 12px)
4. **Two-column layout:**
   - **Left (60%):** Description, impacts, attachments
   - **Right (35%):** Metadata, timeline, quick stats
5. **Footer** (Save, Cancel, Delete)

#### 4.3 Compact Approval Chain

**Current:**
```css
.mcs-approval-chain { padding: 28px 20px 20px; }
.mcs-approval-circle { width: 48px; height: 48px; }
```

**Proposed:**
```css
.mcs-approval-chain { padding: 12px 16px; }
.mcs-approval-circle { width: 40px; height: 40px; font-size: 14px; }
```

**Savings:** ~20px vertical space

---

### Phase 5: Theme Integration (1.5 hours)

#### 5.1 Replace Hardcoded Colors

**In `mcs.css`:**

| Current | Replacement |
|---------|-------------|
| `--mcs-status-open: #2563eb` | `var(--blue)` |
| `--mcs-status-review: #d97706` | `var(--amber)` |
| `--mcs-status-approved: #16a34a` | `var(--green)` |
| `--mcs-status-implemented: #9ca3af` | `var(--muted)` |
| `--mcs-status-rejected: #dc2626` | `var(--red)` |
| `.mcs-priority-medium: #2563eb` | `var(--blue)` |
| `.mcs-status-open: #dbeafe` | `var(--blue-pale)` |
| `.mcs-status-review: #fef3c7` | `var(--amber-pale)` |
| `.mcs-status-approved: #dcfce7` | `var(--green-pale)` |
| `.mcs-status-rejected: #fee2e2` | `var(--red-pale)` |

#### 5.2 Add Dark Mode Support

Add to `main.css` dark theme section:
```css
:root[data-theme="dark"] {
  --mcs-kpi-bg: var(--surface);
  --mcs-kpi-border: var(--line);
  --mcs-kpi-value: var(--ink);
  --mcs-kpi-label: var(--muted);
  --mcs-card-hover-bg: rgba(255,255,255,0.03);
}
```

---

### Phase 6: Enhanced Filtering (1.5 hours)

#### 6.1 Add Date Range Picker

```html
<div class="mcs-filter-section">
  <div class="mcs-sidebar-label">Date Range</div>
  <select class="mcs-date-range-select" onchange="mcsSetDateRange(this.value)">
    <option value="all">All Time</option>
    <option value="today">Today</option>
    <option value="week">This Week</option>
    <option value="month">This Month</option>
    <option value="quarter">This Quarter</option>
    <option value="custom">Custom Range...</option>
  </select>
</div>
```

#### 6.2 Add "My Changes" Quick Filter

```javascript
function mcsToggleMyChanges() {
  mcsCurrentFilter.myChanges = !mcsCurrentFilter.myChanges;
  mcsRenderList();
}
```

Filter logic:
```javascript
if (mcsCurrentFilter.myChanges) {
  filtered = filtered.filter(c => c.initiated_by === currentUser.email);
}
```

#### 6.3 Add Overdue Filter

```javascript
function mcsIsOverdue(change) {
  if (!change.target_implementation) return false;
  const target = new Date(change.target_implementation);
  const today = new Date();
  return target < today && change.status !== 'closed';
}
```

---

## Implementation Checklist

### Phase 1: Dashboard & Stats
- [ ] Create `mcs-dashboard` HTML structure
- [ ] Add KPI calculation logic
- [ ] Style dashboard cards with theme variables
- [ ] Add click handlers to apply filters
- [ ] Test with various data volumes

### Phase 2: Sidebar Redesign
- [ ] Convert filter sections to accordions
- [ ] Add collapse/expand toggle
- [ ] Implement "My Changes" filter
- [ ] Implement "Overdue Only" filter
- [ ] Add multi-select filter support
- [ ] Reduce sidebar width to 200px
- [ ] Add sidebar collapse button

### Phase 3: Card Redesign
- [ ] Update card HTML structure
- [ ] Replace priority dot with badge
- [ ] Add icons to meta information
- [ ] Highlight overdue target dates
- [ ] Add separator line
- [ ] Implement hover preview tooltip
- [ ] Ensure consistent card heights

### Phase 4: Modal Improvements
- [ ] Increase modal width to 900px
- [ ] Add quick actions bar
- [ ] Reorganize content layout (60/35 split)
- [ ] Compact approval chain (40px circles)
- [ ] Move timeline to right column
- [ ] Add metadata panel

### Phase 5: Theme Integration
- [ ] Replace all hardcoded colors in `mcs.css`
- [ ] Add dark mode variables to `main.css`
- [ ] Test in both light and dark themes
- [ ] Update status pill colors
- [ ] Update priority badge colors

### Phase 6: Enhanced Filtering
- [ ] Add date range dropdown
- [ ] Implement "My Changes" toggle
- [ ] Implement "Overdue Only" toggle
- [ ] Add search to description field
- [ ] Add clear all filters button

---

## File Changes Required

| File | Changes |
|------|---------|
| `portals/mcs/css/mcs.css` | Complete rewrite of layout, add new components |
| `portals/mcs/css/mcs-responsive.css` | Update breakpoints for new layout |
| `portals/mcs/js/mcs-main.js` | Add dashboard, new filters, card rendering |
| `portals/mcs/js/mcs-modal.js` | Update modal layout, compact approval chain |
| `core/css/main.css` | Add MCS-specific theme variables |

---

## Visual Mockup

### New Dashboard Layout

```
╔══════════════════════════════════════════════════════════════════╗
║  Change Register (24)                    [+ Raise a Change]      ║
╠══════════════════════════════════════════════════════════════════╣
║  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                ║
║  │  Open   │ │ Review  │ │ Overdue │ │  This   │                ║
║  │   12    │ │    5    │ │    3    │ │  Week   │                ║
║  │         │ │         │ │         │ │    8    │                ║
║  └─────────┘ └─────────┘ └─────────┘ └─────────┘                ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │ 🔍 Search changes...                                      │   ║
║  └──────────────────────────────────────────────────────────┘   ║
║                                                                  ║
║  ┌─ Status ─────────┐  ┌─ Priority ─────┐                       ║
║  │ ▼                │  │ ▶              │                       ║
║  │ ● Open      [12] │  │ ● Critical [2] │                       ║
║  │ ● Review     [5] │  │ ● High     [4] │                       ║
║  │ ● Implement  [3] │  │ ● Medium   [8] │                       ║
║  │ ● Final      [2] │  │ ● Low     [10] │                       ║
║  │ ● Implemented[4] │  └────────────────┘                       ║
║  │ ● Closed     [6] │                                           ║
║  └──────────────────┘  ┌─ Quick Filters ─┐                      ║
║                        │ ☐ My Changes    │                      ║
║  ┌─ Type ───────────┐  │ ☐ Overdue Only  │                      ║
║  │ ▶                │  │ ☐ High Priority │                      ║
║  │ Engineering  [8] │  └─────────────────┘                      ║
║  │ Process     [10] │                                           ║
║  │ Material     [3] │                                           ║
║  └──────────────────┘                                           ║
╠══════════════════════════════════════════════════════════════════╣
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │ MCS-0042                              [Review]            │   ║
║  │ Update welding parameters for rail assembly               │   ║
║  │                                                           │   ║
║  │ [Process] [High Priority]    [3 impacts] [⏱ 4h]          │   ║
║  │ ───────────────────────────────────────────────────────  │   ║
║  │ 👤 j.smith@co.uk  📦 RAIL-001  📅 Jan 15  🎯 Feb 1       │   ║
║  └──────────────────────────────────────────────────────────┘   ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │ MCS-0041                              [Open]              │   ║
║  │ ...                                                       │   ║
║  └──────────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Success Metrics

- [ ] **Load time:** < 500ms for list rendering
- [ ] **Filter response:** < 100ms for filter changes
- [ ] **Mobile usability:** All touch targets ≥ 44px
- [ ] **Accessibility:** WCAG AA contrast ratios
- [ ] **Theme support:** Full light/dark mode parity
- [ ] **Responsive:** Works at 375px - 1920px viewport

---

## Testing Plan

### Unit Tests
- [ ] Dashboard KPI calculations
- [ ] Filter logic (status, priority, type, source)
- [ ] Date range filtering
- [ ] "My Changes" filter
- [ ] Overdue detection

### Integration Tests
- [ ] Filter combinations work correctly
- [ ] Search + filter combinations
- [ ] Modal open/close from various states
- [ ] Approval chain renders correctly

### Visual Tests
- [ ] Light theme at all breakpoints
- [ ] Dark theme at all breakpoints
- [ ] High contrast mode
- [ ] Reduced motion mode

### User Testing
- [ ] Create new change request
- [ ] Apply and clear filters
- [ ] View change details
- [ ] Approve/reject change
- [ ] Search for specific change

---

## Rollback Plan

If issues arise:
```bash
git stash  # Save changes
git checkout portals/mcs/  # Revert MCS files
git stash pop  # Restore other changes
```

---

**Document Version:** 1.0  
**Created:** 2026-03-21  
**Status:** Ready for Implementation
