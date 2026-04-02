# Reviewing APQP and connecting pages

**Session ID:** ses_2b59d5ee7ffeprdxkzA6wgBQTI
**Created:** 4/1/2026, 7:51:11 PM
**Updated:** 4/1/2026, 8:23:18 PM

---

## User

review APQP and connecting pages

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 8.3s)

_Thinking:_

The user wants me to review APQP and connecting pages. Let me think about what skill might apply here. This seems like a code review task, so the "requesting-code-review" skill might be relevant. However, the user is asking me to "review APQP and connecting pages" - this could be a code review of the APQP-related pages in the codebase.

Let me check if there's a relevant skill. The "requesting-code-review" skill is about requesting a review when completing tasks, not about performing a review. The "receiving-code-review" skill is about receiving feedback.

Actually, this seems like a general task where I need to review the APQP pages and their connections. Let me first explore the codebase to understand what APQP pages exist.


I need to step back and check which skills actually apply before diving into the exploration. Let me look at what skills are available and determine which ones are relevant to reviewing these pages.

**Tool: skill**

**Input:**
```json
{
  "name": "requesting-code-review"
}
```

**Output:**
```
<skill_content name="requesting-code-review">
# Skill: requesting-code-review

# Requesting Code Review

Dispatch superpowers:code-reviewer subagent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — never your session's history. This keeps the reviewer focused on the work product, not your thought process, and preserves your own context for continued work.

**Core principle:** Review early, review often.

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing major feature
- Before merge to main

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

**1. Get git SHAs:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Dispatch code-reviewer subagent:**

Use Task tool with superpowers:code-reviewer type, fill template at `code-reviewer.md`

**Placeholders:**
- `{WHAT_WAS_IMPLEMENTED}` - What you just built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{BASE_SHA}` - Starting commit
- `{HEAD_SHA}` - Ending commit
- `{DESCRIPTION}` - Brief summary

**3. Act on feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

## Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch superpowers:code-reviewer subagent]
  WHAT_WAS_IMPLEMENTED: Verification and repair functions for conversation index
  PLAN_OR_REQUIREMENTS: Task 2 from docs/superpowers/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## Integration with Workflows

**Subagent-Driven Development:**
- Review after EACH task
- Catch issues before they compound
- Fix before moving to next task

**Executing Plans:**
- Review after each batch (3 tasks)
- Get feedback, apply, continue

**Ad-Hoc Development:**
- Review before merge
- Review when stuck

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

See template at: requesting-code-review/code-reviewer.md

Base directory for this skill: file:///C:/Users/Tidyco/.cache/kilo/node_modules/superpowers/skills/requesting-code-review
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>C:\Users\Tidyco\.cache\kilo\node_modules\superpowers\skills\requesting-code-review\code-reviewer.md</file>
</skill_files>
</skill_content>
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 135.9s)

_Thinking:_

The requesting-code-review skill is about dispatching a code-reviewer subagent. But first, I need to understand what the user means by "review APQP and connecting pages". Let me explore the codebase to understand the structure first.

Actually, let me think about this more carefully. The user said "review APQP and connecting pages". This could mean:
1. Review the APQP-related code/pages in the codebase
2. Review APQP documentation

Let me first explore the codebase to understand what APQP pages exist, then I can dispatch a code-reviewer to review them.

Let me explore the project structure first.

I'll explore the codebase to understand the APQP pages and their connections, then dispatch a code review.

**Tool: task**

**Input:**
```json
{
  "description": "Explore APQP pages structure",
  "prompt": "Explore the codebase to find all APQP-related pages, components, and their connections. Look for:\n1. Any files with \"apqp\" in the name (case-insensitive)\n2. HTML files that might be APQP pages\n3. JavaScript modules related to APQP\n4. How pages connect to each other (navigation, imports, routing)\n\nSearch thoroughly across the entire codebase. Return:\n- A list of all APQP-related files with their paths\n- A brief description of what each file does\n- How pages connect to each other (navigation links, imports, shared state)\n- The overall page structure/hierarchy",
  "subagent_type": "explore"
}
```

**Output:**
```
task_id: ses_2b59d220cffevG2oP6wInMvL2L (for resuming to continue this task if needed)

<task_result>
Here is the complete analysis of all APQP-related files, their purposes, and how they connect.

---

## APQP-Related Files

### Core APQP Files

| File | Path | Description |
|------|------|-------------|
| **apqp.js** | `portals/product-development/npi/js/apqp.js` | APQP tab dispatcher — renders the 4-tab APQP shell (CTQ, PFD, PFMEA, Control Plan). Delegates rendering to sub-modules and provides backward-compatible aliases for inline handlers. |
| **npi-constants.js** | `portals/product-development/npi/js/npi-constants.js` | Defines `APQP_TABS = { CTQ, PFD, PFMEA, CP }`, RPN thresholds (`RPN_HIGH=100`, `RPN_CRITICAL=200`), and special characteristics constants. |
| **npi-shared.js** | `portals/product-development/npi/js/npi-shared.js` | Creates the shared `npi` global namespace object with sub-namespaces: `npi.apqp`, `npi.ctq`, `npi.pfd`, `npi.cp`, `npi.pfmea`, `npi.nav`, etc. |

### APQP Tab Components

| File | Path | Description |
|------|------|-------------|
| **npi-ctq.js** | `portals/product-development/npi/js/npi-ctq.js` | CTQ Matrix tab — renders the Critical-to-Quality requirements table with filtering (source, OOS action, customer agreed, coverage). Tracks CTQ coverage across PFD steps and PFMEA modes. |
| **npi-pfd.js** | `portals/product-development/npi/js/npi-pfd.js` | Process Flow Diagram tab — renders PFD steps in table or Mermaid flowchart view. Links to CTQs, BOM resources, documents, and PFMEA failure modes per step. |
| **pfmea.js** | `portals/product-development/npi/js/pfmea.js` | PFMEA tab — renders failure mode effects analysis with severity/occurrence/detection scoring, RPN calculation, history tracking, and burndown chart. |
| **npi-cp.js** | `portals/product-development/npi/js/npi-cp.js` | Control Plan tab — renders control plan rows linked to PFMEA causes. Supports auto-sync from PFMEA. |

### Data Layer

| File | Path | Description |
|------|------|-------------|
| **npi-data.js** | `portals/product-development/npi/js/npi-data.js` | Central data operations for CTQ, PFD, PFMEA, and CP (add/update/delete). |
| **npi-data-ctq.js** | `portals/product-development/npi/js/npi-data-ctq.js` | CTQ-specific data persistence. |
| **npi-data-pfmea.js** | `portals/product-development/npi/js/npi-data-pfmea.js` | PFMEA-specific data persistence. |
| **npi-data-relational.js** | `portals/product-development/npi/js/npi-data-relational.js` | Relational data save/load for PFD steps, CP rows, and cross-references. |
| **pfmea-state.js** | `portals/product-development/npi/js/pfmea-state.js` | PFMEA worksheet view/filter state management. |

### Navigation & Routing

| File | Path | Description |
|------|------|-------------|
| **navigation.js** | `utils/js/navigation.js` | Hash-based routing. Handles `navigate('apqp')` and `setApqpTab(t)` for CTQ/PFD/PFMEA/CP tab switching. URL format: `#p=uuid&s=apqp&t=ctq`. |
| **npi-orchestrator.js** | `portals/product-development/npi/js/npi-orchestrator.js` | Section orchestrator — maps `section === 'apqp'` to `renderApqp()`. |
| **npi-events.js** | `portals/product-development/npi/js/npi-events.js` | Delegated event router — handles `npi-set-apqp` action for tab switching, plus all CTQ/PFD/PFMEA/CP click and change events. |
| **npi.js** | `portals/product-development/npi/js/npi.js` | NPI namespace root — defines `npi.nav.setApqpTab()`, `npi.nav.openPfmeaTab()`, and project navigation. |

### State

| File | Path | Description |
|------|------|-------------|
| **state.js** | `core/js/state.js` | Global state — `appState.apqpTab` (default `'ctq'`), CTQ/PFD/PFMEA filters, fullscreen overlay flags (`ctqExpanded`, `pfdExpanded`, `pfmeaExpanded`). |

### CSS Files

| File | Path | Description |
|------|------|-------------|
| **apqp-shell.css** | `portals/product-development/npi/css/apqp-shell.css` | APQP tab navigation bar, tabs shell, section headers, card layout. |
| **apqp-tables.css** | `portals/product-development/npi/css/apqp-tables.css` | Shared table styles for APQP tabs. |
| **apqp-ctq.css** | `portals/product-development/npi/css/apqp-ctq.css` | CTQ Matrix-specific styles (coverage badges, filter bar). |
| **apqp-pfd.css** | `portals/product-development/npi/css/apqp-pfd.css` | Process Flow Diagram styles (step rows, flowchart, section headers). |
| **apqp-bom.css** | `portals/product-development/npi/css/apqp-bom.css` | BOM picker modal styles used within PFD. |
| **apqp-responsive.css** | `portals/product-development/npi/css/apqp-responsive.css` | Mobile-first responsive breakpoints for APQP components. |

### Supporting Files

| File | Path | Description |
|------|------|-------------|
| **modals.js** | `portals/product-development/npi/js/modals.js` | Injects NPI modals including CTQ pick, BOM pick, and PFD insert modals. Calls `npi.apqp.*` functions. |
| **dashboard.js** | `portals/product-development/npi/js/dashboard.js` | Project dashboard — includes `apqpCompletionPct()` function and "Open APQP" quick-launch buttons. |
| **bom.js** | `portals/product-development/npi/js/bom.js` | BOM module — references `appState.apqpTab` for hash state. |
| **rpn-chart.js** | `portals/product-development/npi/js/rpn-chart.js` | RPN burndown chart rendered inside PFMEA tab. |

### Tests & Documentation

| File | Path | Description |
|------|------|-------------|
| **apqp.test.js** | `tests/apqp.test.js` | Jest test for APQP module — verifies module availability. |
| **10-apqp-gates.md** | `wiki/content/learning-function/10-apqp-gates.md` | Wiki article explaining APQP gates (Gate 0–4). |
| **guide.js** | `utils/js/guide.js` | Contains `GUIDE_CONTENT` entries for `npi-apqp`, `npi-ctq`, `npi-pfd`, `npi-cp` — user guide content shown via "Guide" buttons. |

---

## Page Structure & Hierarchy

```
Hub
 └── Product Development Portal
      └── NPI Projects Dashboard (projects)
           └── Project Dashboard (project)
                ├── APQP (apqp) ←── Main APQP section
                │    ├── CTQ Matrix (t=ctq)      — Step 01
                │    ├── Process Flow (t=pfd)     — Step 02
                │    ├── PFMEA (t=pfmea)          — Step 03
                │    └── Control Plan (t=cp)      — Step 04
                ├── Action Tracker (actions)
                ├── Risk Register (risks)
                ├── Bill of Materials (bom)
                ├── NPI Timing Plan (timing)
                ├── Documents (documents)
                └── Gate Reviews (gate_0 … gate_5)
```

---

## Navigation Flow

1. **Hub → Product Development → NPI Projects → Select Project** → lands on project dashboard
2. **Dashboard → "Open APQP" button** → `navigate('apqp')` → renders APQP section with default CTQ tab
3. **Tab switching** → `npi.nav.setApqpTab('pfd'|'pfmea'|'cp'|'ctq')` → updates `appState.apqpTab`, re-renders
4. **Cross-tab links** (CTQ → PFD → PFMEA → CP):
   - CTQ tab shows "Next: Process Flow →" link → `data-action="npi-set-apqp" data-tab="pfd"`
   - PFD tab shows "Next: PFMEA →" link → `data-action="npi-set-apqp" data-tab="pfmea"`
   - PFMEA tab shows "Next: Control Plan →" link → `data-action="npi-set-apqp" data-tab="cp"`
   - Control Plan has "Sync from PFMEA" button
5. **URL hash format**: `#p=<project-id>&s=apqp&t=<tab>` (e.g., `#p=abc123&s=apqp&t=pfmea`)
6. **Back navigation**: From any APQP tab → "← Dashboard" button → `navigate('project')` returns to project dashboard

## Data Flow Between Tabs

```
CTQ (requirements) ──→ PFD (steps link to CTQs via ctqIds)
                         │
                         ├──→ PFMEA (failure modes linked to PFD steps via pfdId)
                         │         │
                         │         └──→ Control Plan (rows linked to PFMEA causes)
                         │
                         └──→ BOM Resources (steps link to BOM items via bomRefs)
```

- **CTQ → PFD**: PFD steps reference CTQs by ID (`step.ctqIds`)
- **PFD → PFMEA**: PFMEA failure modes reference PFD steps (`mode.pfdId`)
- **PFMEA → CP**: Control Plan rows reference PFMEA causes (`row.pfmeaCauseId`)
- **PFD → BOM**: PFD steps reference BOM items (`step.bomRefs`)
- **Coverage tracking**: CTQ tab shows orphaned/linked status based on PFD and PFMEA references
</task_result>
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 52.9s)

_Thinking:_

Now I have a comprehensive understanding of the APQP pages and their connections. Let me dispatch a code-reviewer subagent to review these files. I'll need to check the git status first to understand what to review.

Actually, the user asked to "review APQP and connecting pages" - this sounds like they want me to review the current state of the code. Let me check the git status to see if there are recent changes, and then dispatch a code-reviewer.

Let me check git status and recent commits first.

**Tool: bash**

**Input:**
```json
{
  "command": "git log --oneline -20",
  "description": "Check recent git commits"
}
```

**Output:**
```
304fac07 NPI upgrades & soft delete audits
6aee535a bug fixes
0478f80a bug fixes
574ec9cc desktop app
81cc74e2 desktop app beta
b45c7bbb prod/cap tweaks & ops dashboard
ebb753f7 imprved heatmap, product support tracking. improved forecasting
c0b6f775 plan: per-product support demand allocation design
4e8a94f0 New testing, capacity filtering & wiki updates
288cb4b7 fix dologon
7b879611 updates & wiki
00b81891 bug fixes
ff9ebf92 1
8540b4d3 chore: update changelog and fix settings test imports
7de30cca bug fixes
634eb77b fixes
40fa6007 ESM Migration
4aa45e27 ESM Migration
834aee61 cleanup
48241b0f general tweaks, wiki content , bug fixes, gate Q editing

```

**Tool: bash**

**Input:**
```json
{
  "command": "git status --short",
  "description": "Check working tree status"
}
```

**Output:**
```
 M AGENTS.md
 M CHANGELOG.md
 M electron/main.js
 M portals/capacity/me/js/me-data-relational.js
 M portals/operations/css/operations-dashboard.css
 M portals/operations/js/operations-dashboard-forecast-actions.js
 M portals/operations/js/operations-dashboard-forecast-view.js
 M portals/operations/js/operations-dashboard-main.js
 M portals/operations/js/operations-dashboard-state.js
 M portals/product-development/npi/js/trackers.js
 M utils/js/guide.js

```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 8.8s)

_Thinking:_

The git status shows modified files but none of them are APQP-related. The user wants to review the APQP and connecting pages in their current state. Let me read the key APQP files and dispatch a code-reviewer subagent.

Let me read the main APQP files to understand the code, then dispatch a review.

The working tree has no APQP-related changes. The user wants a review of the current APQP implementation. Let me read the key files and dispatch a code review.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\apqp.js"
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\apqp.js</path>
<type>file</type>
<content>1: // ═══════════════════════════════════
2: // apqp.js — APQP tab dispatcher
3: // Depends on: npi.js, npi-ctq.js, npi-pfd.js, pfmea.js, npi-cp.js
4: // ═══════════════════════════════════
5: 
6: import { appState, prog } from '../../../../core/js/state.js'
7: import { save } from '../../../../core/js/db.js'
8: import { showToast } from '../../../../utils/js/helpers.js'
9: import { render } from '../../../../utils/js/navigation.js'
10: import { npiData } from './npi-data.js'
11: import { APQP_TABS, RPN_HIGH } from './npi-constants.js'
12: import { npiRelDeleteCP, npiRelSaveCP } from './npi-data-relational.js'
13: import { npiCtq } from './npi-ctq.js'
14: import { npiPfd } from './npi-pfd.js'
15: import { npi } from './npi-shared.js'
16: import './pfmea.js'
17: // Bug fix: npi-cp.js was never imported — CP tab side-effects (npi.cp.*) never fired
18: import './npi-cp.js'
19: 
20: 
21: npi.apqp.renderAPQP = function() {
22:   const p = prog()
23:   const highRPN = p.pfmea.filter(r => npi.pfmea.calcRPN(r) >= RPN_HIGH).length
24:   const tabs = [
25:     { id: APQP_TABS.CTQ, label: 'CTQ Matrix', badge: p.ctq.length },
26:     { id: APQP_TABS.PFD, label: 'Process Flow', badge: p.pfd.filter(s => npiData.pfdType.isExecutable(s.type)).length },
27:     { id: APQP_TABS.PFMEA, label: 'PFMEA', badge: p.pfmea.length, warn: highRPN > 0 },
28:     { id: APQP_TABS.CP, label: 'Control Plan', badge: p.cp.length }
29:   ]
30: 
31:   const tabNav = `<div class="apqp-tabs-shell">${
32:     tabs.map(t => `<button class="apqp-tab-btn ${appState.apqpTab === t.id ? 'active' : ''}" onclick="npi.nav.setApqpTab('${t.id}')">${t.label}${t.badge > 0 ? `<span class="apqp-tab-badge">(${t.badge})</span>` : ''}${t.warn ? `<span class="apqp-tab-warning">⚠</span>` : ''}</button>`).join('')
33:   }</div>`
34: 
35:   const inner = appState.apqpTab === APQP_TABS.CTQ ? npiCtq.render()
36:     : appState.apqpTab === APQP_TABS.PFD ? npiPfd.render()
37:     : appState.apqpTab === APQP_TABS.PFMEA ? npi.pfmea.renderPFMEA()
38:     : (typeof npi.cp?.render === 'function' ? npi.cp.render() : '')
39: 
40:   return `<div class="sec-head"><div><div class="sec-eyebrow">Project</div><div class="sec-title">APQP</div><div class="sec-desc">CTQ requirements, process flow, PFMEA and control plan in one place.</div></div><div class="sec-actions"><button class="btn btn-ghost btn-sm" onclick="showGuide('npi-apqp')" title="User Guide">❓ Guide</button><button class="btn btn-ghost btn-sm" onclick="npi.nav.goHome()">← Dashboard</button></div></div>
41:   ${tabNav}
42:   <div style="background:var(--white);border:1px solid var(--line);border-top:none;border-radius:0 0 8px 8px;padding:24px 0 0"></div>
43:   <div class="apqp-tab-content" style="padding:24px 0">${inner}</div>`
44: }
45: 
46: // Backward compatibility aliases for existing inline handlers.
47: npi.apqp.renderCTQ = function() { return typeof npi.ctq?.render === 'function' ? npi.ctq.render() : '' }
48: npi.apqp.addCTQ = function() { return typeof npi.ctq?.add === 'function' ? npi.ctq.add() : undefined }
49: npi.apqp.updCTQ = function(i, f, v) { return typeof npi.ctq?.upd === 'function' ? npi.ctq.upd(i, f, v) : undefined }
50: npi.apqp.delCTQ = function(i) { return typeof npi.ctq?.del === 'function' ? npi.ctq.del(i) : undefined }
51: 
52: npi.apqp.renderPFD = function() { return typeof npi.pfd?.render === 'function' ? npi.pfd.render() : '' }
53: npi.apqp.addMainStep = function() { return typeof npi.pfd?.addMainStep === 'function' ? npi.pfd.addMainStep() : undefined }
54: npi.apqp.openInsert = function(afterOi, ft) { return typeof npi.pfd?.openInsert === 'function' ? npi.pfd.openInsert(afterOi, ft) : undefined }
55: npi.apqp.confirmInsert = function() { return typeof npi.pfd?.confirmInsert === 'function' ? npi.pfd.confirmInsert() : undefined }
56: npi.apqp.delPFD = function(sid) { return typeof npi.pfd?.del === 'function' ? npi.pfd.del(sid) : undefined }
57: npi.apqp.updPFD = function(sid, f, v) { return typeof npi.pfd?.upd === 'function' ? npi.pfd.upd(sid, f, v) : undefined }
58: npi.apqp.scrollToPfd = function(sid) { return typeof npi.pfd?.scrollTo === 'function' ? npi.pfd.scrollTo(sid) : undefined }
59: npi.apqp.toggleGroup = function(key) { return typeof npi.pfd?.toggleGroup === 'function' ? npi.pfd.toggleGroup(key) : undefined }
60: npi.apqp.openResourceEdit = function(sid, bt, iid) { return typeof npi.pfd?.openResourceEdit === 'function' ? npi.pfd.openResourceEdit(sid, bt, iid) : undefined }
61: npi.apqp.saveResourceEdit = function() { return typeof npi.pfd?.saveResourceEdit === 'function' ? npi.pfd.saveResourceEdit() : undefined }
62: npi.apqp.deleteResourceEdit = function() { return typeof npi.pfd?.deleteResourceEdit === 'function' ? npi.pfd.deleteResourceEdit() : undefined }
63: npi.apqp.openCtqPick = function(oi) { return typeof npi.pfd?.openCtqPick === 'function' ? npi.pfd.openCtqPick(oi) : undefined }
64: npi.apqp.tCP = function(cid, checked) { return typeof npi.pfd?.toggleCtqPick === 'function' ? npi.pfd.toggleCtqPick(cid, checked) : undefined }
65: npi.apqp.saveCtqPick = function() { return typeof npi.pfd?.saveCtqPick === 'function' ? npi.pfd.saveCtqPick() : undefined }
66: npi.apqp.openBomPick = function(sid) { return typeof npi.pfd?.openBomPick === 'function' ? npi.pfd.openBomPick(sid) : undefined }
67: npi.apqp.refreshBomPickModal = function(p, filterId, listId, activeFilter, searchTerm) { return typeof npi.pfd?.refreshBomPickModal === 'function' ? npi.pfd.refreshBomPickModal(p, filterId, listId, activeFilter, searchTerm) : undefined }
68: npi.apqp.setBomFilter = function(f, fid, lid) { return typeof npi.pfd?.setBomFilter === 'function' ? npi.pfd.setBomFilter(f, fid, lid) : undefined }
69: npi.apqp.searchBomPick = function(query) { return typeof npi.pfd?.searchBomPick === 'function' ? npi.pfd.searchBomPick(query) : undefined }
70: npi.apqp.toggleBomPick = function(key, el) { return typeof npi.pfd?.toggleBomPick === 'function' ? npi.pfd.toggleBomPick(key, el) : undefined }
71: npi.apqp.saveBomPick = function() { return typeof npi.pfd?.saveBomPick === 'function' ? npi.pfd.saveBomPick() : undefined }
72: npi.apqp.openDocPick = function(oi) { return typeof npi.pfd?.openDocPick === 'function' ? npi.pfd.openDocPick(oi) : undefined }
73: npi.apqp.saveDocPick = function() { return typeof npi.pfd?.saveDocPick === 'function' ? npi.pfd.saveDocPick() : undefined }
74: 
75: npi.apqp.renderCP = function() { return typeof npi.cp?.render === 'function' ? npi.cp.render() : '' }
76: npi.apqp.syncFromPFMEA = function() {
77:   if (typeof npi.cp?.syncFromPFMEA === 'function') return npi.cp.syncFromPFMEA()
78:   if (typeof npiData?.cp?.syncFromPFMEA === 'function') {
79:     const added = npiData.cp.syncFromPFMEA()
80:     if (added === 0) showToast('All PFMEA causes already in control plan.', 'info')
81:     render()
82:     return
83:   }
84: 
85:   // Legacy fallback for isolated tests where split/data modules are not loaded.
86:   const p = prog()
87:   const ex = new Set(p.cp.map(r => r.pfmeaCauseId || r.pfmeaEffectId || r.pfmeaId))
88:   let n = 0
89:   p.pfmea.forEach(mode => {
90:     const step = p.pfd.find(s => s.id === mode.pfdId)
91:     const cids = step ? (step.ctqIds || []) : []
92:     const fc = cids.length > 0 ? p.ctq.find(c => c.id === cids[0]) : null
93:     ;(mode.effects || []).forEach(ef => {
94:       ;(ef.causes || []).forEach(ca => {
95:         if (ex.has(ca.id)) return
96:         const item = {
97:           id: crypto.randomUUID(),
98:           pfmeaId: mode.id, pfmeaEffectId: ef.id, pfmeaCauseId: ca.id, pfdId: mode.pfdId,
99:           char: mode.mode + (ef.effect ? ' → ' + ef.effect : '') + (ca.cause ? ' (' + ca.cause + ')' : ''),
100:           type: 'Process', spec: fc ? fc.spec : '', method: ca.detect || ca.prevent || '',
101:           freq: '100%', resp: '', reaction: fc ? fc.oos_action || '' : '', ctqIds: [...cids]
102:         }
103:         p.cp.push(item)
104:         if (typeof npiRelSaveCP === 'function') npiRelSaveCP(item)
105:         else if (typeof save === 'function') save()
106:         n++
107:       })
108:     })
109:   })
110:   if (n === 0) return showToast('All PFMEA causes already in control plan.', 'info')
111:   render()
112: }
113: npi.apqp.addCP = function() {
114:   if (typeof npi.cp?.add === 'function') return npi.cp.add()
115:   if (typeof npiData?.cp?.add === 'function') { npiData.cp.add(); render(); return }
116:   const item = { id: crypto.randomUUID(), pfmeaId: '', pfdId: '', char: '', type: 'Process', spec: '', method: '', freq: '', resp: '', reaction: '', ctqIds: [] }
117:   prog().cp.push(item)
118:   if (typeof npiRelSaveCP === 'function') npiRelSaveCP(item)
119:   else if (typeof save === 'function') save()
120:   render()
121: }
122: npi.apqp.updCP = function(i, f, v) {
123:   if (typeof npi.cp?.upd === 'function') return npi.cp.upd(i, f, v)
124:   if (typeof npiData?.cp?.upd === 'function') return npiData.cp.upd(i, f, v)
125:   if (!prog().cp[i]) return
126:   prog().cp[i][f] = v
127:   if (typeof npiRelSaveCP === 'function') npiRelSaveCP(prog().cp[i])
128:   else if (typeof save === 'function') save()
129: }
130: npi.apqp.delCP = function(i) {
131:   if (typeof npi.cp?.del === 'function') return npi.cp.del(i)
132:   if (typeof npiData?.cp?.del === 'function') { npiData.cp.del(i); render(); return }
133:   if (!prog().cp[i]) return
134:   const id = prog().cp[i].id
135:   prog().cp.splice(i, 1)
136:   if (typeof npiRelDeleteCP === 'function') npiRelDeleteCP(id)
137:   else if (typeof save === 'function') save()
138:   render()
139: }
140: 
141: export const npiApqp = npi.apqp
142: export const renderApqp = npi.apqp.renderAPQP

(End of file - total 142 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\npi-ctq.js"
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\npi-ctq.js</path>
<type>file</type>
<content>1: // ═══════════════════════════════════
2: // npi-ctq.js — CTQ tab rendering and UI actions
3: // Depends on: npi.js, npi-data.js
4: // ═══════════════════════════════════
5: 
6: import { appState, prog } from '../../../../core/js/state.js'
7: import { esc, canEdit, emptyState } from '../../../../utils/js/helpers.js'
8: import { showGuide } from '../../../../utils/js/guide.js'
9: import { writeNavigationHistory, render } from '../../../../utils/js/navigation.js'
10: import { npi } from './npi-shared.js'
11: import { npiComponents } from './npi-components.js'
12: import { npiData } from './npi-data.js'
13: 
14: const CTQ_SOURCES = ['Customer Spec', 'OEM Data', 'Internal Standard', 'Regulatory', 'Drawing']
15: const CTQ_OOS_ACTIONS = ['Repair', 'Replace', 'Scrap', 'Review', 'TBD']
16: const CTQ_COVERAGE_OPTIONS = ['all', 'linked', 'orphaned']
17: 
18: // ═══════════════════════════════════════════════════════════════
19: // Coverage helpers — track where CTQs are referenced
20: // ═══════════════════════════════════════════════════════════════
21: npi.ctq.getCoverage = function(ctqId, p) {
22:   const pfdCount = p.pfd.filter(s => (s.ctqIds || []).includes(ctqId)).length
23:   const pfmeaCount = p.pfmea.filter(m => (m.ctqIds || []).includes(ctqId)).length
24:   return { pfdCount, pfmeaCount, total: pfdCount + pfmeaCount }
25: }
26: 
27: npi.ctq.getCoverageFilter = function() {
28:   const cur = (appState.ctqCoverageFilter || 'all').toString()
29:   return CTQ_COVERAGE_OPTIONS.includes(cur) ? cur : 'all'
30: }
31: 
32: npi.ctq.setCoverageFilter = function(v) {
33:   const safe = (v || 'all').toString()
34:   appState.ctqCoverageFilter = CTQ_COVERAGE_OPTIONS.includes(safe) ? safe : 'all'
35:   const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']
36:   if (appState.ctqSourceFilter !== 'all') parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter))
37:   if (appState.ctqOosFilter !== 'all') parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter))
38:   if (appState.ctqAgreedFilter !== 'all') parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter))
39:   if (appState.ctqCoverageFilter !== 'all') parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter))
40:   if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
41:   writeNavigationHistory('#' + parts.join('&'), { push: true })
42:   render()
43: }
44: 
45: npi.ctq.matchesCoverageFilter = function(r, p, coverageFilter) {
46:   if (coverageFilter === 'all') return true
47:   const coverage = npi.ctq.getCoverage(r.id, p)
48:   if (coverageFilter === 'linked') return coverage.total > 0
49:   if (coverageFilter === 'orphaned') return coverage.total === 0
50:   return true
51: }
52: 
53: npi.ctq.getSourceFilter = function() {
54:   const cur = (appState.ctqSourceFilter || 'all').toString()
55:   return ['all', ...CTQ_SOURCES].includes(cur) ? cur : 'all'
56: }
57: 
58: npi.ctq.setSourceFilter = function(v) {
59:   const safe = (v || 'all').toString()
60:   appState.ctqSourceFilter = ['all', ...CTQ_SOURCES].includes(safe) ? safe : 'all'
61:   const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']
62:   if (appState.ctqSourceFilter !== 'all') parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter))
63:   if (appState.ctqOosFilter !== 'all') parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter))
64:   if (appState.ctqAgreedFilter !== 'all') parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter))
65:   if (appState.ctqCoverageFilter !== 'all') parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter))
66:   if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
67:   writeNavigationHistory('#' + parts.join('&'), { push: true })
68:   render()
69: }
70: 
71: npi.ctq.getOosFilter = function() {
72:   const cur = (appState.ctqOosFilter || 'all').toString()
73:   return ['all', ...CTQ_OOS_ACTIONS].includes(cur) ? cur : 'all'
74: }
75: 
76: npi.ctq.setOosFilter = function(v) {
77:   const safe = (v || 'all').toString()
78:   appState.ctqOosFilter = ['all', ...CTQ_OOS_ACTIONS].includes(safe) ? safe : 'all'
79:   const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']
80:   if (appState.ctqSourceFilter !== 'all') parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter))
81:   if (appState.ctqOosFilter !== 'all') parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter))
82:   if (appState.ctqAgreedFilter !== 'all') parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter))
83:   if (appState.ctqCoverageFilter !== 'all') parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter))
84:   if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
85:   writeNavigationHistory('#' + parts.join('&'), { push: true })
86:   render()
87: }
88: 
89: npi.ctq.getAgreedFilter = function() {
90:   const cur = (appState.ctqAgreedFilter || 'all').toString()
91:   return ['all', 'yes', 'no'].includes(cur) ? cur : 'all'
92: }
93: 
94: npi.ctq.setAgreedFilter = function(v) {
95:   const safe = (v || 'all').toString()
96:   appState.ctqAgreedFilter = ['all', 'yes', 'no'].includes(safe) ? safe : 'all'
97:   const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']
98:   if (appState.ctqSourceFilter !== 'all') parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter))
99:   if (appState.ctqOosFilter !== 'all') parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter))
100:   if (appState.ctqAgreedFilter !== 'all') parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter))
101:   if (appState.ctqCoverageFilter !== 'all') parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter))
102:   if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
103:   writeNavigationHistory('#' + parts.join('&'), { push: true })
104:   render()
105: }
106: 
107: npi.ctq.clearFilters = function() {
108:   appState.ctqSourceFilter = 'all'
109:   appState.ctqOosFilter = 'all'
110:   appState.ctqAgreedFilter = 'all'
111:   appState.ctqCoverageFilter = 'all'
112:   const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']
113:   if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
114:   writeNavigationHistory('#' + parts.join('&'), { push: true })
115:   render()
116: }
117: 
118: npi.ctq.matchesFilter = function(r, sourceFilter, oosFilter, agreedFilter) {
119:   if (sourceFilter !== 'all' && r.source !== sourceFilter) return false
120:   if (oosFilter !== 'all' && r.oos_action !== oosFilter) return false
121:   if (agreedFilter === 'yes' && !r.customerAgreed) return false
122:   if (agreedFilter === 'no' && r.customerAgreed) return false
123:   return true
124: }
125: 
126: npi.ctq.render = function() {
127:   const p = prog()
128:   const sourceFilter = npi.ctq.getSourceFilter()
129:   const oosFilter = npi.ctq.getOosFilter()
130:   const agreedFilter = npi.ctq.getAgreedFilter()
131:   const coverageFilter = npi.ctq.getCoverageFilter()
132:   const hasFilters = sourceFilter !== 'all' || oosFilter !== 'all' || agreedFilter !== 'all' || coverageFilter !== 'all'
133: 
134:   const filteredIdx = p.ctq
135:     .map((r, i) => ({ r, i }))
136:     .filter(({ r }) => npi.ctq.matchesFilter(r, sourceFilter, oosFilter, agreedFilter))
137:     .filter(({ r }) => npi.ctq.matchesCoverageFilter(r, p, coverageFilter))
138: 
139:   const coverageStats = p.ctq.map(r => npi.ctq.getCoverage(r.id, p))
140:   const linkedCount = coverageStats.filter(c => c.total > 0).length
141:   const orphanedCount = coverageStats.filter(c => c.total === 0).length
142: 
143:   const rows = filteredIdx.map(({ r, i }) => {
144:     const coverage = npi.ctq.getCoverage(r.id, p)
145:     const coverageHtml = coverage.total === 0
146:       ? `<span class="tag tag-amber" title="Not linked to any PFD steps or PFMEA modes">⚠️ Orphaned</span>`
147:       : `<span class="tag tag-green" title="Linked to ${coverage.pfdCount} PFD step(s) and ${coverage.pfmeaCount} PFMEA mode(s)">✓ ${coverage.total}</span>`
148:     return `<tr>
149:     <td style="text-align:center"><span class="tag tag-ctq">C${i + 1}</span></td>
150:     <td><textarea class="cell-edit" name="ctq_${i}_req" rows="1" data-action="ctq-upd" data-idx="${i}" data-field="req" data-autoresize placeholder="CTQ requirement">${esc(r.req)}</textarea></td>
151:     <td><textarea class="cell-edit mono" name="ctq_${i}_spec" rows="1" data-action="ctq-upd" data-idx="${i}" data-field="spec" data-autoresize placeholder="e.g. 50±0.05mm">${esc(r.spec)}</textarea></td>
152:     <td><textarea class="cell-edit" name="ctq_${i}_testMethod" rows="1" data-action="ctq-upd" data-idx="${i}" data-field="testMethod" data-autoresize placeholder="e.g. CMM, Gauge, Visual">${esc(r.testMethod || '')}</textarea></td>
153:     <td><select class="cell-edit" name="ctq_${i}_source" data-action="ctq-upd" data-idx="${i}" data-field="source" style="width:100%">${CTQ_SOURCES.map(o => `<option${r.source === o ? ' selected' : ''}>${o}</option>`).join('')}</select></td>
154:     <td><textarea class="cell-edit" name="ctq_${i}_source_ref" rows="1" data-action="ctq-upd" data-idx="${i}" data-field="source_ref" data-autoresize placeholder="e.g. Doc-123, §4.2">${esc(r.source_ref || '')}</textarea></td>
155:     <td><select class="cell-edit" name="ctq_${i}_oos_action" data-action="ctq-upd" data-idx="${i}" data-field="oos_action" style="width:100%">${CTQ_OOS_ACTIONS.map(o => `<option${r.oos_action === o ? ' selected' : ''}>${o}</option>`).join('')}</select></td>
156:     <td><div class="ctq-agreed">
157:       <input type="checkbox" name="ctq_${i}_customerAgreed" ${r.customerAgreed ? 'checked' : ''} data-action="ctq-upd" data-idx="${i}" data-field="customerAgreed" title="Customer has accepted this CTQ method and out-of-spec plan">
158:       <span class="ctq-agreed-label" style="color:${r.customerAgreed ? 'var(--green)' : 'var(--muted)'}">${r.customerAgreed ? 'ACCEPTED' : '—'}</span>
159:     </div></td>
160:     <td style="text-align:center">${coverageHtml}</td>
161:     <td style="text-align:center">${canEdit() ? `<button class="del-btn" data-action="ctq-del" data-idx="${i}">×</button>` : ''}</td>
162:   </tr>`
163:   }).join('')
164: 
165:   const filterBar = p.ctq.length > 0 ? `<div class="apqp-filters">
166:     <div class="filter-group">
167:       <label class="ctq-filter-label">Source</label>
168:       <select class="cell-edit" data-action="ctq-filter-source">
169:         <option value="all"${sourceFilter === 'all' ? ' selected' : ''}>All sources</option>
170:         ${CTQ_SOURCES.map(o => `<option value="${esc(o)}"${sourceFilter === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}
171:       </select>
172:     </div>
173:     <div class="filter-group">
174:       <label class="ctq-filter-label">Out-of-Spec Action</label>
175:       <select class="cell-edit" data-action="ctq-filter-oos">
176:         <option value="all"${oosFilter === 'all' ? ' selected' : ''}>All actions</option>
177:         ${CTQ_OOS_ACTIONS.map(o => `<option value="${esc(o)}"${oosFilter === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}
178:       </select>
179:     </div>
180:     <div class="filter-group">
181:       <label class="ctq-filter-label">Customer Accepted</label>
182:       <select class="cell-edit" data-action="ctq-filter-agreed">
183:         <option value="all"${agreedFilter === 'all' ? ' selected' : ''}>All</option>
184:         <option value="yes"${agreedFilter === 'yes' ? ' selected' : ''}>Accepted only</option>
185:         <option value="no"${agreedFilter === 'no' ? ' selected' : ''}>Not accepted</option>
186:       </select>
187:     </div>
188:     <div class="filter-group">
189:       <label class="ctq-filter-label">Coverage</label>
190:       <select class="cell-edit" data-action="ctq-filter-coverage">
191:         <option value="all"${coverageFilter === 'all' ? ' selected' : ''}>All CTQs</option>
192:         <option value="linked"${coverageFilter === 'linked' ? ' selected' : ''}>Linked (${linkedCount})</option>
193:         <option value="orphaned"${coverageFilter === 'orphaned' ? ' selected' : ''}>Orphaned (${orphanedCount})</option>
194:       </select>
195:     </div>
196:     <div class="ctq-filter-summary">
197:       <span class="tag">${filteredIdx.length}/${p.ctq.length} shown</span>
198:       ${hasFilters ? `<button class="btn btn-ghost btn-sm" data-action="ctq-filter-clear">Clear filters</button>` : ''}
199:     </div>
200:   </div>` : ''
201: 
202:   const tableContent = p.ctq.length === 0
203:     ? emptyState('🎯', 'No CTQs yet', canEdit() ? 'Add critical requirements' : 'No CTQs defined yet')
204:     : filteredIdx.length === 0
205:       ? emptyState('🔍', 'No matches', `${p.ctq.length} CTQ${p.ctq.length !== 1 ? 's' : ''} exist but none match the active filters.`) + `<div style="text-align:center;margin-top:8px"><button class="btn btn-ghost btn-sm" data-action="ctq-filter-clear">Clear filters</button></div>`
206:       : `<div class="sticky-table-wrap"><table class="tbl ctq-tbl" style="min-width:1060px;table-layout:fixed;width:100%"><colgroup><col style="width:40px"><col style="width:18%"><col style="width:12%"><col style="width:14%"><col style="width:10%"><col style="width:10%"><col style="width:10%"><col style="width:90px"><col style="width:80px"><col style="width:30px"></colgroup>${npiComponents.tableHeader([{label:'Ref'},{label:'Requirement'},{label:'Target / Tolerance'},{label:'Test Method'},{label:'Source'},{label:'Source Ref'},{label:'Out-of-Spec Action'},{label:'Customer Accepted',style:'text-align:center'},{label:'Coverage',style:'text-align:center'},{label:''}])}<tbody>${rows}</tbody></table></div>`
207: 
208:   const coverageBanner = p.ctq.length > 0
209:     ? `<div class="coverage-banner"><span class="coverage-stat"><span class="tag tag-green">${linkedCount}</span> linked</span><span class="coverage-stat"><span class="tag tag-amber">${orphanedCount}</span> orphaned</span>${orphanedCount > 0 ? ' <a href="#" data-action="npi-set-apqp" data-tab="pfd" style="color:var(--blue)">Link to PFD →</a>' : ''}</div>`
210:     : ''
211: 
212:   // Fullscreen overlay: expands the CTQ table to fill the whole screen
213:   if (appState.ctqExpanded) {
214:     return `<div class="portal-fullscreen-overlay">
215:       <div class="portal-fullscreen-bar">
216:         <span><span class="portal-fullscreen-title">CTQ Matrix</span><span class="portal-fullscreen-project">${esc(p.name || '')}</span></span>
217:         <div style="display:flex;gap:8px;align-items:center">
218:           ${canEdit() ? `<button class="btn btn-primary btn-sm" data-action="ctq-add">＋ Add CTQ</button>` : ''}
219:           <button class="btn btn-ghost btn-sm" data-action="ctq-toggle-expand">✕ Exit Fullscreen</button>
220:         </div>
221:       </div>
222:       ${filterBar}
223:       ${coverageBanner}
224:       <div class="portal-fullscreen-body">
225:         <div class="card" style="flex:1;display:flex;flex-direction:column;overflow:hidden">
226:           <div class="card-head"><span class="card-title">Requirements</span><span class="card-meta">${p.ctq.length} defined</span></div>
227:           ${tableContent}
228:           ${canEdit() ? `<button class="add-row" data-action="ctq-add">＋ Add CTQ</button>` : ''}
229:         </div>
230:       </div>
231:     </div>`
232:   }
233: 
234:   return `<div class="sec-head"><div><div class="sec-eyebrow">Step 01</div><div class="sec-title">CTQ Matrix</div><div class="sec-desc">Critical-to-Quality requirements — source of truth for PFD, PFMEA and Control Plan.</div></div><div class="sec-actions"><button class="btn btn-ghost btn-sm" onclick="showGuide('npi-ctq')" title="User Guide">❓ Guide</button><button class="btn btn-ghost btn-sm" data-action="ctq-toggle-expand" title="Fullscreen mode">⛶ Expand</button>${canEdit() ? `<button class="btn btn-primary btn-sm" data-action="ctq-add">＋ Add CTQ</button>` : ''}</div></div>
235:   ${filterBar}
236:   ${coverageBanner}
237:   <div class="card"><div class="card-head"><span class="card-title">Requirements</span><span class="card-meta">${p.ctq.length} defined</span></div>
238:   ${tableContent}
239:   ${canEdit() ? `<button class="add-row" data-action="ctq-add">＋ Add CTQ</button>` : ''}</div>
240:   ${p.ctq.length > 0 ? `<div class="info-banner">💡 ${p.ctq.length} CTQs defined. Next: <a href="#" data-action="npi-set-apqp" data-tab="pfd" style="color:var(--blue)">Process Flow →</a></div>` : ''}`
241: }
242: 
243: // Toggle fullscreen for focused CTQ Matrix editing on large screens
244: npi.ctq.toggleExpand = function() {
245:   appState.ctqExpanded = !appState.ctqExpanded
246:   render()
247: }
248: 
249: npi.ctq.add = function() { npiData.ctq.add() }
250: npi.ctq.upd = function(i, f, v) { npiData.ctq.upd(i, f, v) }
251: npi.ctq.del = function(i) { npiData.ctq.del(i) }
252: 
253: export const npiCtq = npi.ctq
254: export const renderCtq = npi.ctq.render
255: export const addCtq = npi.ctq.add
256: export const updateCtq = npi.ctq.upd
257: export const deleteCtq = npi.ctq.del

(End of file - total 257 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\npi-pfd.js"
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\npi-pfd.js</path>
<type>file</type>
<content>1: // ═══════════════════════════════════
2: // npi-pfd.js — PFD tab rendering and modal handlers
3: // Depends on: npi.js, npi-data.js
4: // ═══════════════════════════════════
5: 
6: import { appState, prog, BOM_TYPES } from '../../../../core/js/state.js'
7: import { esc, canEdit, emptyState, showModal, closeModal, showToast } from '../../../../utils/js/helpers.js'
8: import { npiRelSavePFDStep } from './npi-data-relational.js'
9: import { npi } from './npi-shared.js'
10: import { npiData } from './npi-data.js'
11: import { npiBom } from './bom.js'
12: import { RPN_HIGH } from './npi-constants.js'
13: npi.pfd.viewMode = 'table'// 'table' or 'flowchart'
14: npi.pfd.flowDirection = 'TD' // 'TD' (top-down) or 'LR' (left-right)
15: 
16: function pfdStepType(step) {
17:   return npiData.pfdType.normalize(step && step.pfd_type)
18: }
19: 
20: function pfdLinkValue(value) {
21:   return npiData.normalizePfdLink(value)
22: }
23: 
24: function pfdStepNodeId(stepNum) {
25:   return `S${stepNum}`
26: }
27: 
28: function pfdMermaidLabel(step) {
29:   const raw = step && step.op ? String(step.op) : `Step ${step.stepNum}`
30:   return raw
31:     .replace(/\r?\n+/g, ' ')
32:     .replace(/"/g, '&quot;')
33:     .replace(/[{}\[\]]/g, ' ')
34:     .trim()
35: }
36: 
37: function isHeaderStep(step) {
38:   return npiData.pfdType.isHeader(step.type)
39: }
40: 
41: function isExecutableStep(step) {
42:   return npiData.pfdType.isExecutable(step.type)
43: }
44: 
45: function getSectionStepCount(sorted, headerIndex) {
46:   let count = 0
47:   for (let i = headerIndex + 1; i < sorted.length; i++) {
48:     if (isHeaderStep(sorted[i])) break
49:     if (isExecutableStep(sorted[i])) count++
50:   }
51:   return count
52: }
53: 
54: function stepRowHTML(s, oi, p) {
55:   const ctqBadges = (s.ctqIds || []).map(cid => {
56:     const ci = p.ctq.findIndex(c => c.id === cid)
57:     return ci >= 0 ? `<span class="ctq-pick-item" data-action="pfd-open-ctq-pick" data-idx="${oi}">C${ci + 1}</span>` : ''
58:   }).join('')
59:   const pfCnt = p.pfmea.filter(r => r.pfdId === s.id).length
60:   const pills = (s.bomRefs || []).map(ref => {
61:     // Handle aggregated parts from BOM tree
62:     if (ref.bomType === 'parts_agg') {
63:       const aggregatedParts = npiBom._aggregatePartsRegister ? npiBom._aggregatePartsRegister(p) : []
64:       const part = aggregatedParts.find(x => (x.pn || x.desc) === ref.itemId)
65:       if (!part) return ''
66:       const sources = Array.from(part.sources || [])
67:       const isAaw = sources.includes('aaw')
68:       const isRepair = sources.includes('repair')
69:       const name = part.desc || part.pn || 'Part'
70:       const qtyDisplay = ref.qty && ref.qty > 1 ? ` <span style="font-weight:600;color:var(--blue)">×${ref.qty}</span>` : ''
71:       return `<span class="res-pill res-pill-part" ${canEdit() ? `data-action="pfd-open-resource-edit" data-step-id="${s.id}" data-bom-type="${ref.bomType}" data-item-id="${esc(ref.itemId)}" title="Click to edit quantity"` : ''}>🔩 ${esc(name.length > 18 ? name.slice(0, 18) + '…' : name)}${qtyDisplay}${isAaw ? ' <span class="flag flag-aaw" style="font-size:9px">AAW</span>' : ''}${isRepair ? ' <span class="flag flag-repair" style="font-size:9px">RPR</span>' : ''}</span>`
72:     }
73:     
74:     // Handle AAW/Repair assemblies
75:     if (ref.bomType === 'aaw_asm') {
76:       const group = (p.bom.aaw_repair || []).find(x => x.id === ref.itemId)
77:       if (!group) return ''
78:       const tagLabel = group.tag === 'aaw' ? 'AAW' : (group.tag === 'repair' ? 'RPR' : 'ASM')
79:       const name = group.title || 'Assembly'
80:       const qtyDisplay = ref.qty && ref.qty > 1 ? ` <span style="font-weight:600;color:var(--blue)">×${ref.qty}</span>` : ''
81:       return `<span class="res-pill res-pill-asm" ${canEdit() ? `data-action="pfd-open-resource-edit" data-step-id="${s.id}" data-bom-type="${ref.bomType}" data-item-id="${esc(ref.itemId)}" title="Click to edit quantity"` : ''}>🔧 ${esc(name.length > 18 ? name.slice(0, 18) + '…' : name)}${qtyDisplay} <span class="flag ${group.tag === 'aaw' ? 'flag-aaw' : 'flag-repair'}" style="font-size:9px">${tagLabel}</span></span>`
82:     }
83:     
84:     // Handle standard BOM types
85:     const bt = p.bom[ref.bomType]; if (!bt) return ''
86:     const item = bt.find(x => x.id === ref.itemId); if (!item) return ''
87:     const t = BOM_TYPES[ref.bomType]
88:     const name = item.desc || (item.pn || item.toolId || item.equipId || '?')
89:     const qtyDisplay = ref.qty && ref.qty > 1 ? ` <span style="font-weight:600;color:var(--blue)">×${ref.qty}</span>` : ''
90:     return `<span class="res-pill ${t.pc}" ${canEdit() ? `data-action="pfd-open-resource-edit" data-step-id="${s.id}" data-bom-type="${ref.bomType}" data-item-id="${ref.itemId}" title="Click to edit quantity"` : ''}>${t.icon} ${esc(name.length > 18 ? name.slice(0, 18) + '…' : name)}${qtyDisplay}${item.isAaw ? ' <span class="flag flag-aaw" style="font-size:9px">AAW</span>' : ''}${item.isRepair ? ' <span class="flag flag-repair" style="font-size:9px">RPR</span>' : ''}</span>`
91:   }).join('')
92:   const docBadges = (s.docRefs || []).map(docId => {
93:     const doc = (p.docs || []).find(d => d.id === docId)
94:     return doc ? `<span class="ctq-pick-item" ${canEdit() ? `data-action="pfd-del-doc-ref" data-step-id="${s.id}" data-doc-id="${docId}" title="Click to remove"` : ''}>${esc(doc.docNumber || 'Doc')} ${esc(doc.title || '')}</span>` : ''
95:   }).join('')
96: 
97:   const stepType = pfdStepType(s)
98:   const isDecision = npiData.pfdType.isDecision(stepType)
99:   const isInspection = npiData.pfdType.isInspection(stepType)
100:   const isTwoPath = npiData.pfdType.isTwoPath(stepType)
101:   const typeChipMap = { Process: 'PROC', Decision: 'DEC', Inspection: 'INSP', Rework: 'RWK', Transport: 'TRN' }
102:   const typeChip = `<span class="pfd-type-chip pfd-type-chip--${stepType.toLowerCase()}">${typeChipMap[stepType] || stepType}</span>`
103:   const flowControlHTML = `<div class="step-field f-flow">
104:     <div class="flow-control-group">
105:       <label>Type</label>
106:       <select class="cell-edit" data-action="pfd-upd" data-id="${s.id}" data-field="pfd_type">
107:         <option value="Process" ${stepType === 'Process' ? 'selected' : ''}>Process</option>
108:         <option value="Decision" ${stepType === 'Decision' ? 'selected' : ''}>Decision</option>
109:         <option value="Inspection" ${stepType === 'Inspection' ? 'selected' : ''}>Inspection</option>
110:         <option value="Rework" ${stepType === 'Rework' ? 'selected' : ''}>Rework</option>
111:         <option value="Transport" ${stepType === 'Transport' ? 'selected' : ''}>Transport</option>
112:       </select>
113:     </div>
114:     ${isTwoPath
115:     ? `<div class="flow-control-group">
116:           <label>Next (${isInspection ? 'Pass' : 'Yes'})</label>
117:           <input type="number" class="cell-edit" min="1" step="1" value="${esc(pfdLinkValue(s.nextStepId_yes) || '')}" data-action="pfd-upd" data-id="${s.id}" data-field="nextStepId_yes" placeholder="Step #">
118:         </div>
119:         <div class="flow-control-group">
120:           <label>Next (${isInspection ? 'Fail' : 'No'})</label>
121:           <input type="number" class="cell-edit" min="1" step="1" value="${esc(pfdLinkValue(s.nextStepId_no) || '')}" data-action="pfd-upd" data-id="${s.id}" data-field="nextStepId_no" placeholder="Step #">
122:         </div>`
123:     : `<div class="flow-control-group">
124:           <label>Next Step</label>
125:           <input type="number" class="cell-edit" min="1" step="1" value="${esc(pfdLinkValue(s.nextStepId) || '')}" data-action="pfd-upd" data-id="${s.id}" data-field="nextStepId" placeholder="Step #">
126:         </div>`
127:     }
128:   </div>`
129: 
130:   return `<div class="step-row" id="pfd-row-${s.id}"><div class="step-main-row"><div class="step-num-cell"><div class="step-num-badge">${s.stepNum}</div>${typeChip}<div style="display:flex;flex-direction:column;gap:2px">${canEdit() ? `<button class="mini-btn" data-action="pfd-open-insert" data-after="${oi}">＋</button><button class="mini-btn danger" data-action="pfd-del" data-id="${s.id}">×</button>` : ''}</div></div><div class="step-body"><div class="step-fields">${canEdit() ? flowControlHTML : ''}<div class="step-field f-op"><textarea class="cell-edit" rows="1" data-action="pfd-upd" data-id="${s.id}" data-field="op" data-autoresize placeholder="Operation" style="font-weight:600">${esc(s.op)}</textarea></div><div class="step-field f-detail"><textarea class="cell-edit" rows="1" data-action="pfd-upd" data-id="${s.id}" data-field="detail" data-autoresize placeholder="Method / notes…">${esc(s.detail)}</textarea></div><div class="step-field f-location"><textarea class="cell-edit" rows="1" data-action="pfd-upd" data-id="${s.id}" data-field="location" data-autoresize placeholder="Location…">${esc(s.location)}</textarea></div><div class="step-field f-operator"><textarea class="cell-edit" rows="1" data-action="pfd-upd" data-id="${s.id}" data-field="operator" data-autoresize placeholder="Operator…">${esc(s.operator)}</textarea></div><div class="step-field f-timing"><textarea class="cell-edit" rows="1" data-action="pfd-upd" data-id="${s.id}" data-field="timing" data-autoresize placeholder="Timing…">${esc(s.timing)}</textarea></div><div class="step-field f-ctq"><div class="ctq-pick">${ctqBadges}${canEdit() && p.ctq.length > 0 ? `<span class="ctq-pick-add" data-action="pfd-open-ctq-pick" data-idx="${oi}">＋ CTQ</span>` : ''}</div></div><div class="step-field f-doc"><div class="ctq-pick">${docBadges}${canEdit() && (p.docs||[]).length > 0 ? `<span class="ctq-pick-add" data-action="pfd-open-doc-pick" data-idx="${oi}">＋ Doc</span>` : ''}</div></div><div class="step-field f-pfmea">${p... (line truncated to 2000 chars)
131: }
132: 
133: function headerRowHTML(s, oi, meta) {
134:   const title = esc(s.op || 'Section Header')
135:   const collapsed = !!(meta && meta.collapsed)
136:   const stepCount = meta && Number.isFinite(meta.stepCount) ? meta.stepCount : 0
137:   const summary = stepCount === 1 ? '1 step' : `${stepCount} steps`
138:   const actions = s.isDefault || !canEdit()
139:     ? ''
140:     : `<div class="pfd-header-actions"><button class="mini-btn danger" data-action="pfd-del" data-id="${s.id}">×</button></div>`
141:   return `<div class="step-row pfd-header-row" id="pfd-row-${s.id}"><div class="pfd-header-main"><button class="pfd-header-toggle" data-action="pfd-toggle-group" data-key="${s.id}" aria-expanded="${collapsed ? 'false' : 'true'}" title="${collapsed ? 'Expand section' : 'Collapse section'}"><span class="pfd-header-toggle-icon">${collapsed ? '▸' : '▾'}</span></button><div class="pfd-header-title"><span class="pfd-header-chip">SECTION</span><input class="cell-edit pfd-header-input" value="${title}" data-action="pfd-upd" data-id="${s.id}" data-field="op" placeholder="Section title (e.g. STRIP DOWN UNIT)"></div><div class="pfd-header-meta">${collapsed ? `Hidden: ${summary}` : summary}</div>${actions}</div></div>`
142: }
143: 
144: function getInsertBounds(p, afterOi) {
145:   if (afterOi == null) return null
146:   const anchor = p.pfd[afterOi]
147:   if (!anchor) return null
148: 
149:   const base = Number(anchor.stepNum) || 0
150:   const nextExecutable = npiData.sortedPfd(p.pfd)
151:     .filter(isExecutableStep)
152:     .find(s => Number(s.stepNum) > base)
153: 
154:   return {
155:     base,
156:     ceil: nextExecutable ? Number(nextExecutable.stepNum) : base + 10
157:   }
158: }
159: 
160: npi.pfd._hideDetail = function(canvasEl) {
161:   const host = canvasEl || document.querySelector('.pfd-flowchart-canvas')
162:   if (!host) return
163:   const panel = host.querySelector('.pfd-detail-popover')
164:   if (!panel) return
165:   panel.className = 'pfd-detail-popover'
166: }
167: 
168: npi.pfd._showDetail = function(s, p, anchorEl, canvasEl) {
169:   const host = canvasEl || document.querySelector('.pfd-flowchart-canvas')
170:   if (!host || !anchorEl) return
171: 
172:   let panel = host.querySelector('.pfd-detail-popover')
173:   if (!panel) {
174:     panel = document.createElement('div')
175:     panel.className = 'pfd-detail-popover'
176:     host.appendChild(panel)
177:   }
178: 
179:   const stepType = pfdStepType(s)
180:   const typeTagClass = { Process: '', Decision: 'tag-amber', Inspection: 'tag-teal', Rework: 'tag-orange', Transport: 'tag-purple' }[stepType] || ''
181:   const pfCnt = p.pfmea.filter(r => r.pfdId === s.id).length
182:   const maxRpn = (p.pfmea || []).filter(r => r.pfdId === s.id).reduce((max, row) => {
183:     const rowMax = (row.effects || []).reduce((emax, ef) => {
184:       const efMax = (ef.causes || []).reduce((cmax, c) => Math.max(cmax, npiData.calcCauseRpn(ef.sev, c.occ, c.det)), 0)
185:       return Math.max(emax, efMax)
186:     }, 0)
187:     return Math.max(max, rowMax)
188:   }, 0)
189: 
190:   const ctqItems = (s.ctqIds || []).map(cid => {
191:     const ci = p.ctq.findIndex(c => c.id === cid)
192:     if (ci < 0) return ''
193:     const c = p.ctq[ci]
194:     return `<span class="tag tag-ctq">C${ci + 1}</span> <span>${esc(c.req || 'Unnamed')}${c.spec ? ` <span style="color:var(--muted);font-size:11px">(${esc(c.spec)})</span>` : ''}</span>`
195:   }).filter(Boolean)
196: 
197:   const docItems = (s.docRefs || []).map(docId => {
198:     const doc = (p.docs || []).find(d => d.id === docId)
199:     if (!doc) return ''
200:     return `<span class="tag">${esc(doc.docNumber || '—')}</span> <span>${esc(doc.title || 'Untitled')}</span>`
201:   }).filter(Boolean)
202: 
203:   const resItems = (s.bomRefs || []).map(ref => {
204:     const bt = p.bom && p.bom[ref.bomType]; if (!bt) return ''
205:     const item = bt.find(x => x.id === ref.itemId); if (!item) return ''
206:     const t = BOM_TYPES[ref.bomType]
207:     return `<span class="res-pill ${t.pc}">${t.icon} ${esc((item.desc || item.pn || item.toolId || item.equipId || '?').slice(0, 40))}</span>`
208:   }).filter(Boolean)
209: 
210:   const listHTML = items => items.map(i => `<li>${i}</li>`).join('')
211: 
212:   panel.className = 'pfd-detail-popover pfd-detail-popover--open'
213:   panel.innerHTML = `
214:     <div class="pfd-detail-inner">
215:       <div class="pfd-detail-header">
216:         <span class="step-num-badge">${s.stepNum}</span>
217:         <span class="pfd-detail-title">${esc(s.op || 'Untitled Step')}</span>
218:         <span class="tag ${typeTagClass}" style="flex-shrink:0">${esc(stepType)}</span>
219:         ${maxRpn >= RPN_HIGH ? `<span class="tag tag-red" style="flex-shrink:0;font-size:10px">⚑ RPN ${maxRpn}</span>` : ''}
220:         <button class="mini-btn pfd-detail-close" style="margin-left:auto">✕</button>
221:       </div>
222:       ${s.detail ? `<div class="pfd-detail-notes">${esc(s.detail)}</div>` : ''}
223:       ${s.location || s.operator || s.timing ? `<div class="pfd-detail-section"><div class="pfd-detail-label">Details</div><div style="display:flex;flex-wrap:wrap;gap:8px;font-size:13px">${s.location ? `<span>📍 ${esc(s.location)}</span>` : ''}${s.operator ? `<span>👤 ${esc(s.operator)}</span>` : ''}${s.timing ? `<span>⏱ ${esc(s.timing)}</span>` : ''}</div></div>` : ''}
224:       ${ctqItems.length ? `<div class="pfd-detail-section"><div class="pfd-detail-label">CTQs</div><ul class="pfd-detail-list">${listHTML(ctqItems)}</ul></div>` : ''}
225:       ${docItems.length ? `<div class="pfd-detail-section"><div class="pfd-detail-label">Documents</div><ul class="pfd-detail-list">${listHTML(docItems)}</ul></div>` : ''}
226:       ${resItems.length ? `<div class="pfd-detail-section"><div class="pfd-detail-label">Resources</div><div style="display:flex;flex-wrap:wrap;gap:4px">${resItems.join('')}</div></div>` : ''}
227:       ${pfCnt > 0 ? `<div class="pfd-detail-section"><div class="pfd-detail-label">PFMEA</div><span class="tag ${maxRpn >= RPN_HIGH ? 'tag-red' : 'tag-amber'}">${pfCnt} failure mode${pfCnt > 1 ? 's' : ''}${maxRpn > 0 ? ` · max RPN ${maxRpn}` : ''}</span></div>` : ''}
228:       ${ctqItems.length === 0 && docItems.length === 0 && resItems.length === 0 && pfCnt === 0 && !s.detail ? '<p style="color:var(--muted);font-size:13px;margin:0">No additional details recorded for this step.</p>' : ''}
229:     </div>`
230: 
231:   const closeBtn = panel.querySelector('.pfd-detail-close')
232:   if (closeBtn) closeBtn.addEventListener('click', () => npi.pfd._hideDetail(host))
233: 
234:   const hostRect = host.getBoundingClientRect()
235:   const anchorRect = anchorEl.getBoundingClientRect()
236:   let left = (anchorRect.right - hostRect.left) + host.scrollLeft + 12
237:   let top = (anchorRect.top - hostRect.top) + host.scrollTop
238: 
239:   panel.style.left = `${left}px`
240:   panel.style.top = `${top}px`
241: 
242:   const hostRight = host.scrollLeft + host.clientWidth - 8
243:   const hostBottom = host.scrollTop + host.clientHeight - 8
244:   const hostLeft = host.scrollLeft + 8
245:   const hostTop = host.scrollTop + 8
246: 
247:   if (left + panel.offsetWidth > hostRight) {
248:     const leftSide = (anchorRect.left - hostRect.left) + host.scrollLeft - panel.offsetWidth - 12
249:     left = Math.max(hostLeft, leftSide)
250:   }
251:   if (top + panel.offsetHeight > hostBottom) {
252:     top = Math.max(hostTop, hostBottom - panel.offsetHeight)
253:   }
254:   if (top < hostTop) top = hostTop
255: 
256:   panel.style.left = `${left}px`
257:   panel.style.top = `${top}px`
258: }
259: 
260: npi.pfd.generateMermaidSyntax = function() {
261:   const p = prog()
262:   if (!p || !p.pfd) return 'graph LR\n  A["No PFD data available"];'
263: 
264:   const sorted = npiData.sortedPfd(p.pfd)
265:   const executable = sorted.filter(isExecutableStep).sort((a, b) => a.stepNum - b.stepNum)
266:   if (executable.length === 0) return 'graph LR\n  A["No steps in PFD"];'
267: 
268:   const stepMap = new Map(executable.map(s => [s.stepNum, s]))
269:   const processNodeIds = []
270:   const decisionNodeIds = []
271:   const inspectionNodeIds = []
272:   const reworkNodeIds = []
273:   const transportNodeIds = []
274: 
275:   // Build set of high-risk step numbers (PFMEA RPN >= RPN_HIGH)
276:   const highRiskStepIds = new Set()
277:   ;(p.pfmea || []).forEach(row => {
278:     const rowMax = (row.effects || []).reduce((emax, ef) => {
279:       const efMax = (ef.causes || []).reduce((cmax, c) => Math.max(cmax, npiData.calcCauseRpn(ef.sev, c.occ, c.det)), 0)
280:       return Math.max(emax, efMax)
281:     }, 0)
282:     if (rowMax >= RPN_HIGH && row.pfdId) {
283:       const step = p.pfd.find(s => s.id === row.pfdId)
284:       if (step && step.stepNum) highRiskStepIds.add(step.stepNum)
285:     }
286:   })
287:   const riskNodeIds = []
288: 
289:   // Group steps by preceding section header for subgraph blocks
290:   const sections = []
291:   let currentSection = null
292:   sorted.forEach(s => {
293:     if (isHeaderStep(s)) {
294:       currentSection = { title: s.op || null, steps: [] }
295:       sections.push(currentSection)
296:     } else if (isExecutableStep(s)) {
297:       if (!currentSection) {
298:         currentSection = { title: null, steps: [] }
299:         sections.push(currentSection)
300:       }
301:       currentSection.steps.push(s)
302:     }
303:   })
304: 
305:   const direction = npi.pfd.flowDirection || 'TD'
306:   let syntax = `graph ${direction}\n`
307:   syntax += '  PFDSTART([START])\n'
308: 
309:   // Declare nodes inside subgraph blocks (skip empty sections)
310:   sections.forEach((sec, i) => {
311:     if (sec.steps.length === 0) return
312:     const useSubgraph = !!sec.title
313:     if (useSubgraph) {
314:       const secLabel = sec.title.replace(/"/g, '&quot;').replace(/[{}\[\]]/g, ' ').trim()
315:       syntax += `  subgraph SG${i} ["${secLabel}"]\n`
316:     }
317:     sec.steps.forEach(s => {
318:       const nodeId = pfdStepNodeId(s.stepNum)
319:       const isRisk = highRiskStepIds.has(s.stepNum)
320:       const riskMark = isRisk ? ' ⚑' : ''
321:       const nodeLabel = `${s.stepNum}: ${pfdMermaidLabel(s)}${riskMark}`
322:       const type = pfdStepType(s)
323:       if (npiData.pfdType.isDecision(type)) {
324:         syntax += `    ${nodeId}{"${nodeLabel}"}\n`
325:         decisionNodeIds.push(nodeId)
326:       } else if (npiData.pfdType.isInspection(type)) {
327:         syntax += `    ${nodeId}(("${nodeLabel}"))\n`
328:         inspectionNodeIds.push(nodeId)
329:       } else if (type === 'Rework') {
330:         syntax += `    ${nodeId}[/"${nodeLabel}"/]\n`
331:         reworkNodeIds.push(nodeId)
332:       } else if (type === 'Transport') {
333:         syntax += `    ${nodeId}(["${nodeLabel}"])\n`
334:         transportNodeIds.push(nodeId)
335:       } else {
336:         syntax += `    ${nodeId}["${nodeLabel}"]\n`
337:         processNodeIds.push(nodeId)
338:       }
339:       if (isRisk) riskNodeIds.push(nodeId)
340:     })
341:     if (useSubgraph) syntax += '  end\n'
342:   })
343: 
344:   syntax += '  PFDEND([END])\n'
345: 
346:   // Edges: START → first step
347:   syntax += `  PFDSTART --> ${pfdStepNodeId(executable[0].stepNum)}\n`
348: 
349:   // Edges: between steps
350:   executable.forEach((s, index) => {
351:     const nodeId = pfdStepNodeId(s.stepNum)
352:     const type = pfdStepType(s)
353:     if (npiData.pfdType.isTwoPath(type)) {
354:       const isInsp = npiData.pfdType.isInspection(type)
355:       const yesLabel = isInsp ? 'Pass' : 'Yes'
356:       const noLabel = isInsp ? 'Fail' : 'No'
357:       const yesTarget = pfdLinkValue(s.nextStepId_yes)
358:       const noTarget = pfdLinkValue(s.nextStepId_no)
359:       if (yesTarget && stepMap.has(yesTarget)) syntax += `  ${nodeId} -- ${yesLabel} --> ${pfdStepNodeId(yesTarget)}\n`
360:       if (noTarget && stepMap.has(noTarget)) syntax += `  ${nodeId} -- ${noLabel} --> ${pfdStepNodeId(noTarget)}\n`
361:     } else {
362:       const fallbackNext = executable[index + 1] ? executable[index + 1].stepNum : null
363:       const nextTarget = pfdLinkValue(s.nextStepId) || fallbackNext
364:       if (nextTarget && stepMap.has(nextTarget)) {
365:         syntax += `  ${nodeId} --> ${pfdStepNodeId(nextTarget)}\n`
366:       } else {
367:         syntax += `  ${nodeId} --> PFDEND\n`
368:       }
369:     }
370:   })
371: 
372:   syntax += '  classDef processNode fill:#eef4ff,stroke:#2b5da8,color:#173d73,stroke-width:1.2px\n'
373:   syntax += '  classDef decisionNode fill:#fef3c7,stroke:#d97706,color:#78350f,stroke-width:1.5px\n'
374:   syntax += '  classDef inspectionNode fill:#d1fae5,stroke:#059669,color:#064e3b,stroke-width:1.5px\n'
375:   syntax += '  classDef reworkNode fill:#ffedd5,stroke:#ea580c,color:#7c2d12,stroke-width:1.5px\n'
376:   syntax += '  classDef transportNode fill:#ede9fe,stroke:#7c3aed,color:#2e1065,stroke-width:1.5px\n'
377:   syntax += '  classDef termNode fill:#f3f4f6,stroke:#6b7280,color:#374151,stroke-width:1.5px\n'
378:   syntax += '  classDef riskBorder stroke:#dc2626,stroke-width:2.5px\n'
379:   if (processNodeIds.length > 0) syntax += `  class ${processNodeIds.join(',')} processNode\n`
380:   if (decisionNodeIds.length > 0) syntax += `  class ${decisionNodeIds.join(',')} decisionNode\n`
381:   if (inspectionNodeIds.length > 0) syntax += `  class ${inspectionNodeIds.join(',')} inspectionNode\n`
382:   if (reworkNodeIds.length > 0) syntax += `  class ${reworkNodeIds.join(',')} reworkNode\n`
383:   if (transportNodeIds.length > 0) syntax += `  class ${transportNodeIds.join(',')} transportNode\n`
384:   syntax += '  class PFDSTART,PFDEND termNode\n'
385:   if (riskNodeIds.length > 0) syntax += `  class ${riskNodeIds.join(',')} riskBorder\n`
386: 
387:   return syntax
388: }
389: 
390: npi.pfd.render = function() {
391:   const p = prog()
392:   npiData.pfd.ensureLeadingHeader()
393:   const sorted = npiData.sortedPfd(p.pfd)
394:   const executable = sorted.filter(isExecutableStep)
395: 
396:   const showFlowchart = npi.pfd.viewMode === 'table'
397:   const isLR = npi.pfd.flowDirection === 'LR'
398:   const viewToggleButton = `<button class="btn btn-secondary btn-sm" data-action="pfd-toggle-view">${showFlowchart ? 'Show Flowchart' : 'Show Table'}</button>`
399:   const layoutToggleButton = !showFlowchart ? `<button class="btn btn-secondary btn-sm" data-action="pfd-toggle-layout" title="Toggle flowchart orientation">${isLR ? '↕ Vertical' : '↔ Horizontal'}</button>` : ''
400: 
401:   // Expand button only makes sense for the table view — flowchart is an SVG canvas
402:   const expandButton = showFlowchart ? `<button class="btn btn-ghost btn-sm" data-action="pfd-toggle-expand" title="Fullscreen mode">⛶ Expand</button>` : ''
403: 
404:   const header = `<div class="sec-head"><div><div class="sec-eyebrow">Step 02</div><div class="sec-title">Process Flow Diagram</div><div class="sec-desc">Section navigator at top for fast jumps in large flows. Steps stay numbered in 10s, and those numbers remain permanent PFMEA and Control Plan references.</div></div>
405:   <div class="sec-actions">${viewToggleButton}${layoutToggleButton}${expandButton}<button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide="npi-pfd" title="User Guide">❓ Guide</button></div></div>`
406: 
407:   if (npi.pfd.viewMode === 'flowchart') {
408:     const syntax = npi.pfd.generateMermaidSyntax()
409:     setTimeout(() => {
410:       const el = document.querySelector('.mermaid')
411:       if (!el) return
412: 
413:       if (typeof window.mermaid === 'undefined' || typeof window.mermaid.render !== 'function') {
414:         el.innerHTML = '<div class="info-banner">Flowchart is unavailable right now. The step links are still saved in the table view.</div>'
415:         return
416:       }
417: 
418:       try {
419:         if (!npi.pfd._mermaidReady && typeof window.mermaid.initialize === 'function') {
420:           window.mermaid.initialize({
421:             theme: 'base',
422:             startOnLoad: false,
423:             securityLevel: 'loose',
424:             flowchart: {
425:               useMaxWidth: true,
426:               nodeSpacing: 60,
427:               rankSpacing: 80,
428:               padding: 20
429:             },
430:             themeVariables: {
431:               fontFamily: 'IBM Plex Sans, Segoe UI, sans-serif',
432:               fontSize: '13px',
433:               lineColor: '#4b5563',
434:               edgeLabelBackground: '#ffffff',
435:               primaryTextColor: '#1f2937'
436:             },
437:             themeCSS: '.edgeLabel .label{font-weight:600;letter-spacing:0.01em}.edge-thickness-normal{stroke-width:1px}.arrowheadPath{fill:#4b5563}'
438:           })
439:           npi.pfd._mermaidReady = true
440:         }
441: 
442:         const renderId = `npi-pfd-flow-${Date.now()}`
443:         const p = prog()
444:         const execSteps = npiData.sortedPfd(p.pfd).filter(isExecutableStep)
445:         const stepMap = new Map(execSteps.map(s => [s.stepNum, s]))
446:         Promise.resolve(window.mermaid.render(renderId, syntax)).then(result => {
447:           if (!result || !result.svg) throw new Error('No SVG returned from Mermaid')
448:           el.innerHTML = `<div class="pfd-flowchart-zoom">${result.svg}</div>`
449:           el.querySelectorAll('g.node').forEach(g => {
450:             const match = g.id && g.id.match(/flowchart-S(\d+)/)
451:             if (!match) return
452:             const step = stepMap.get(parseInt(match[1]))
453:             if (!step) return
454:             g.style.cursor = 'pointer'
455:             g.setAttribute('title', step.op || '')
456:             g.addEventListener('click', ev => {
457:               ev.stopPropagation()
458:               npi.pfd._showDetail(step, p, g, el)
459:             })
460:           })
461:           el.addEventListener('click', ev => {
462:             if (!ev.target.closest('.pfd-detail-popover')) npi.pfd._hideDetail(el)
463:           })
464:         }).catch(e => {
465:           console.error('Mermaid rendering failed:', e)
466:           el.innerHTML = '<div class="info-banner">Flowchart could not be rendered. Check that linked step numbers point to existing steps.</div>'
467:         })
468:       } catch (e) {
469:         console.error('Mermaid rendering failed:', e)
470:         el.innerHTML = '<div class="info-banner">Flowchart could not be rendered. Check that linked step numbers point to existing steps.</div>'
471:       }
472:     }, 50)
473:     const legend = `<div class="pfd-flowchart-legend"><span class="pfd-legend-item"><span class="pfd-legend-box pfd-legend-box--process"></span>Process</span><span class="pfd-legend-item"><span class="pfd-legend-box pfd-legend-box--decision"></span>Decision</span><span class="pfd-legend-item"><span class="pfd-legend-box pfd-legend-box--inspection"></span>Inspection</span><span class="pfd-legend-item"><span class="pfd-legend-box pfd-legend-box--rework"></span>Rework</span><span class="pfd-legend-item"><span class="pfd-legend-box pfd-legend-box--transport"></span>Transport</span><span class="pfd-legend-item"><span class="pfd-legend-risk-icon">⚑</span>High RPN</span></div>`
474:     return `${header}<div class="card pfd-flowchart-shell"><div class="card-head"><span class="card-title">Process Flowchart</span><span class="card-meta">Click any step to see its details.</span></div><div class="pfd-flowchart-help">Blank process links auto-continue to the next numbered step. ⚑ = high RPN in PFMEA.</div>${legend}<div class="mermaid pfd-flowchart-canvas"></div></div>`
475:   }
476: 
477:   // Table view (default)
478:   const sectionNavigator = []
479:   let activeSection = null
480:   sorted.forEach(s => {
481:     if (isHeaderStep(s)) {
482:       if (activeSection) sectionNavigator.push(activeSection)
483:       activeSection = {
484:         id: s.id,
485:         title: esc(s.op) || 'Section',
486:         count: 0,
487:         firstStepNum: null,
488:         lastStepNum: null
489:       }
490:       return
491:     }
492: 
493:     if (!isExecutableStep(s)) return
494: 
495:     if (!activeSection) {
496:       activeSection = {
497:         id: s.id,
498:         title: 'Main Flow',
499:         count: 0,
500:         firstStepNum: null,
501:         lastStepNum: null
502:       }
503:     }
504: 
505:     activeSection.count++
506:     const stepNum = Number(s.stepNum)
507:     if (Number.isFinite(stepNum)) {
508:       if (activeSection.firstStepNum == null) activeSection.firstStepNum = stepNum
509:       activeSection.lastStepNum = stepNum
510:     }
511:   })
512:   if (activeSection) sectionNavigator.push(activeSection)
513: 
514:   const ribbon = sectionNavigator.map((section, i, arr) => {
515:     const countLabel = section.count === 1 ? '1 step' : `${section.count} steps`
516:     const rangeLabel = section.firstStepNum == null
517:       ? ''
518:       : (section.firstStepNum === section.lastStepNum
519:         ? ` · ${section.firstStepNum}`
520:         : ` · ${section.firstStepNum}-${section.lastStepNum}`)
521: 
522:     return `<div class="flow-node" data-action="pfd-scroll" data-id="${section.id}"><div class="flow-node-num">${countLabel}${rangeLabel}</div><div class="flow-node-name">${section.title || 'Section'}</div></div>${i < arr.length - 1 ? '<div class="flow-arrow">→</div>' : ''}`
523:   }).join('')
524: 
525:   let body = ''
526:   let activeSectionId = null
527:   let hideSectionRows = false
528: 
529:   sorted.forEach((s, sortedIndex) => {
530:     const oi = p.pfd.indexOf(s)
531:     if (isHeaderStep(s)) {
532:       activeSectionId = s.id
533:       hideSectionRows = appState.collapsedGroups.has(s.id)
534:       body += headerRowHTML(s, oi, {
535:         collapsed: hideSectionRows,
536:         stepCount: getSectionStepCount(sorted, sortedIndex)
537:       })
538:       return
539:     }
540: 
541:     if (!hideSectionRows) {
542:       body += stepRowHTML(s, oi, p)
543:       if (canEdit()) body += `<div class="insert-row"><button class="insert-btn" data-action="pfd-open-insert" data-after="${oi}">＋ step after</button><button class="insert-btn" data-action="pfd-add-header-after" data-after-id="${s.id}">＋ section after</button></div>`
544:     }
545:   })
546: 
547:   // ── Reusable PFD table content block ──
548:   const pfdContent = `
549:   ${sorted.length > 0 ? `<div class="flow-ribbon">${ribbon}</div>` : ''}
550:   <div class="card"><div class="card-head"><span class="card-title">Process Steps</span><span class="card-meta">${executable.length} executable steps</span></div>
551:   ${p.pfd.length === 0 ? emptyState('🔄', 'No steps yet', 'Add your first process step') : `<div class="pfd-col-header"><div class="pfd-col-num">Step</div>${canEdit() ? '<div class="pfd-col-flow">Flow</div>' : ''}<div class="pfd-col-op">Operation</div><div class="pfd-col-detail">Method / Notes</div><div class="pfd-col-location">Location</div><div class="pfd-col-operator">Operator</div><div class="pfd-col-timing">Timing</div><div class="pfd-col-ctq">CTQs</div><div class="pfd-col-doc">Documents</div><div class="pfd-col-pfmea">PFMEA</div></div><div>${body}</div>`}
552:   ${canEdit() ? `<button class="add-row" data-action="pfd-add-main">＋ Add Process Step</button>` : ''}</div>
553:   ${p.pfd.length > 0 ? `<div class="info-banner">💡 Next: <a href="#" data-action="npi-set-apqp" data-tab="pfmea" style="color:var(--blue)">PFMEA →</a></div>` : ''}`
554: 
555:   // Fullscreen overlay for table view only (flowchart is an SVG canvas, not suited to fixed overlay)
556:   if (showFlowchart && appState.pfdExpanded) {
557:     return `<div class="portal-fullscreen-overlay">
558:       <div class="portal-fullscreen-bar">
559:         <span><span class="portal-fullscreen-title">Process Flow Diagram</span><span class="portal-fullscreen-project">${esc(p.name || '')}</span></span>
560:         <div style="display:flex;gap:8px">
561:           ${viewToggleButton}
562:           <button class="btn btn-ghost btn-sm" data-action="pfd-toggle-expand">✕ Exit Fullscreen</button>
563:         </div>
564:       </div>
565:       <div class="portal-fullscreen-body">
566:         <div class="pfd-table-wrap">
567:           ${pfdContent}
568:         </div>
569:       </div>
570:     </div>`
571:   }
572: 
573:   return `${header}
574:   ${pfdContent}`
575: }
576: 
577: // Toggle fullscreen for focused PFD table editing on large screens
578: npi.pfd.toggleExpand = function() {
579:   appState.pfdExpanded = !appState.pfdExpanded
580:   npi.notify('render')
581: }
582: 
583: npi.pfd.toggleView = function() {
584:   npi.pfd.viewMode = npi.pfd.viewMode === 'table' ? 'flowchart' : 'table'
585:   npi.notify('render')
586: }
587: 
588: npi.pfd.toggleLayout = function() {
589:   npi.pfd.flowDirection = npi.pfd.flowDirection === 'TD' ? 'LR' : 'TD'
590:   npi.pfd._mermaidReady = false
591:   npi.notify('render')
592: }
593: 
594: npi.pfd.addMainStep = function() { npiData.pfd.addMainStep() }
595: 
596: npi.pfd.addHeaderAfter = function(afterStepId) {
597:   const result = npiData.pfd.addSectionHeaderAfter(afterStepId)
598:   if (!result.ok) showToast(result.error, 'error')
599: }
600: 
601: npi.pfd.openInsert = function(afterOi) {
602:   appState.insertOriginIdx = afterOi
603:   const p = prog()
604:   const ni = document.getElementById('insertNum')
605:   const hi = document.getElementById('insertNumHint')
606: 
607:   if (afterOi != null) {
608:     const bounds = getInsertBounds(p, afterOi)
609:     const base = bounds ? bounds.base : 0
610:     const ceil = bounds ? bounds.ceil : 10
611:     ni.value = base + 1 <= ceil - 1 ? base + 1 : ''
612:     hi.textContent = `Available: ${base + 1}–${ceil - 1}`
613:   } else {
614:     const n = npiData.nextMainStepNum(p.pfd)
615:     ni.value = n
616:     hi.textContent = `Next: ${n}`
617:   }
618:   showModal('modalInsert')
619: }
620: 
621: npi.pfd.confirmInsert = function() {
622:   const rawNum = document.getElementById('insertNum').value
623:   const num = rawNum === '' ? null : parseInt(rawNum, 10)
624:   const result = npiData.pfd.insertStep(num, 'step')
625:   if (!result.ok) return showToast(result.error, 'error')
626:   closeModal('modalInsert')
627: }
628: 
629: npi.pfd.del = function(sid) { npiData.pfd.del(sid) }
630: npi.pfd.upd = function(sid, f, v) {
631:   npiData.pfd.upd(sid, f, v)
632:   if (f === 'pfd_type') {
633:     npi.notify('render')
634:   }
635: }
636: npi.pfd.scrollTo = function(sid) { const el = document.getElementById('pfd-row-' + sid); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
637: npi.pfd.toggleGroup = function(key) { npiData.pfd.toggleGroup(appState.collapsedGroups, key) }
638: npi.pfd.delBomRef = function(sid, bt, iid) { npiData.pfd.delBomRef(sid, bt, iid) }
639: 
640: npi.pfd.openResourceEdit = function(stepId, bomType, itemId) {
641:   const p = prog()
642:   if (!p) return
643:   const step = p.pfd.find(x => x.id === stepId)
644:   if (!step) return
645:   const ref = (step.bomRefs || []).find(r => r.bomType === bomType && r.itemId === itemId)
646:   if (!ref) return
647: 
648:   appState.resourceEditTarget = { stepId, bomType, itemId }
649:   appState.resourceEditQty = ref.qty || 1
650: 
651:   let itemName = 'Resource'
652:   let itemDetails = ''
653: 
654:   if (bomType === 'parts_agg') {
655:     const aggregatedParts = npiBom._aggregatePartsRegister ? npiBom._aggregatePartsRegister(p) : []
656:     const part = aggregatedParts.find(x => (x.pn || x.desc) === itemId)
657:     if (part) {
658:       itemName = part.desc || part.pn || 'Part'
659:       itemDetails = part.pn ? `Part Number: ${part.pn}` : ''
660:     }
661:   } else if (bomType === 'aaw_asm') {
662:     const group = (p.bom.aaw_repair || []).find(x => x.id === itemId)
663:     if (group) {
664:       itemName = group.title || 'Assembly'
665:       itemDetails = group.tag === 'aaw' ? 'AAW Assembly' : (group.tag === 'repair' ? 'Repair Assembly' : 'Assembly')
666:     }
667:   } else {
668:     const bt = p.bom[bomType]
669:     if (bt) {
670:       const item = bt.find(x => x.id === itemId)
671:       if (item) {
672:         const t = BOM_TYPES[bomType]
673:         itemName = item.desc || (item.pn || item.toolId || item.equipId || 'Item')
674:         itemDetails = `${t.label}${item.pn ? ' · ' + item.pn : ''}`
675:       }
676:     }
677:   }
678: 
679:   document.getElementById('resourceEditTitle').textContent = `Edit Resource`
680:   document.getElementById('resourceEditQty').value = appState.resourceEditQty
681:   document.getElementById('resourceEditInfo').innerHTML = `<strong>${esc(itemName)}</strong><br>${esc(itemDetails)}`
682: 
683:   showModal('modalResourceEdit')
684: }
685: 
686: npi.pfd.saveResourceEdit = function() {
687:   if (!appState.resourceEditTarget) return
688:   const qtyInput = document.getElementById('resourceEditQty')
689:   const qty = parseInt(qtyInput.value, 10) || 1
690:   appState.resourceEditQty = Math.max(1, qty)
691: 
692:   npiData.pfd.updateResourceQty(appState.resourceEditTarget.stepId, appState.resourceEditTarget.bomType, appState.resourceEditTarget.itemId, appState.resourceEditQty)
693:   closeModal('modalResourceEdit')
694:   appState.resourceEditTarget = null
695: }
696: 
697: npi.pfd.deleteResourceEdit = function() {
698:   if (!appState.resourceEditTarget) return
699:   npiData.pfd.delBomRef(appState.resourceEditTarget.stepId, appState.resourceEditTarget.bomType, appState.resourceEditTarget.itemId)
700:   closeModal('modalResourceEdit')
701:   appState.resourceEditTarget = null
702: }
703: 
704: npi.pfd.openCtqPick = function(oi) {
705:   const p = prog(); appState.ctqPickTarget = oi; appState.ctqPickSelected = [...(p.pfd[oi].ctqIds || [])]
706:   document.getElementById('ctqPickList').innerHTML = p.ctq.length === 0
707:     ? '<p style="color:var(--muted);font-size:13px">No CTQs defined.</p>'
708:     : p.ctq.map((c, i) => `<label class="ctq-pick-label"><input type="checkbox" ${appState.ctqPickSelected.includes(c.id) ? 'checked' : ''} data-action="pfd-toggle-ctq-pick" data-id="${c.id}" style="margin-top:2px;accent-color:var(--blue)"><div><div style="display:flex;align-items:center;gap:6px"><span class="tag tag-ctq">C${i + 1}</span><span style="font-size:12px;font-weight:600">${esc(c.req || 'Unnamed')}</span></div><div style="font-size:11px;color:var(--muted);font-family:'IBM Plex Mono',monospace;margin-top:1px">${esc(c.spec)}</div></div></label>`).join('')
709:   showModal('modalCtqPick')
710: }
711: 
712: npi.pfd.toggleCtqPick = function(cid, checked) {
713:   if (checked) {
714:     if (!appState.ctqPickSelected.includes(cid)) appState.ctqPickSelected.push(cid)
715:   } else {
716:     appState.ctqPickSelected = appState.ctqPickSelected.filter(x => x !== cid)
717:   }
718: }
719: 
720: npi.pfd.saveCtqPick = function() {
721:   npiData.pfd.saveCtqPick(appState.ctqPickTarget, appState.ctqPickSelected)
722:   closeModal('modalCtqPick')
723: }
724: 
725: npi.pfd.openDocPick = function(oi) {
726:   const p = prog(); appState.docPickTarget = oi; appState.docPickSelected = [...(p.pfd[oi].docRefs || [])]
727:   const docs = p.docs || []
728:   document.getElementById('docPickList').innerHTML = docs.length === 0
729:     ? '<p style="color:var(--muted);font-size:13px">No documents in register.</p>'
730:     : docs.map((d, i) => `<label class="ctq-pick-label"><input type="checkbox" ${appState.docPickSelected.includes(d.id) ? 'checked' : ''} data-action="pfd-toggle-doc-pick" data-id="${d.id}" style="margin-top:2px;accent-color:var(--blue)"><div><div style="display:flex;align-items:center;gap:6px"><span class="tag" style="font-size:9px;background:var(--bg);border:1px solid var(--line);color:var(--muted)">${esc(d.docNumber || '—')}</span><span style="font-size:12px;font-weight:600">${esc(d.title || 'Untitled')}</span></div><div style="font-size:11px;color:var(--muted);margin-top:1px">${esc(d.type || '')}${d.issue ? ' · Issue ' + esc(String(d.issue)) : ''}</div></div></label>`).join('')
731:   showModal('modalDocPick')
732: }
733: 
734: npi.pfd.toggleDocPick = function(docId, checked) {
735:   if (checked) { if (!appState.docPickSelected.includes(docId)) appState.docPickSelected.push(docId) }
736:   else { appState.docPickSelected = appState.docPickSelected.filter(x => x !== docId) }
737: }
738: 
739: npi.pfd.saveDocPick = function() {
740:   npiData.pfd.saveDocPick(appState.docPickTarget, appState.docPickSelected)
741:   closeModal('modalDocPick')
742: }
743: 
744: npi.pfd.delDocRef = function(sid, docId) {
745:   const s = prog().pfd.find(x => x.id === sid)
746:   if (!s) return
747:   s.docRefs = (s.docRefs || []).filter(x => x !== docId)
748:   Promise.resolve().then(() => npiRelSavePFDStep(s)).catch(err => console.error('[NPI] save PFD step failed:', err))
749:   npi.notify('render')
750: }
751: 
752: npi.pfd.openBomPick = function(sid) {
753:   const p = prog(); if (!p) return
754:   const s = p.pfd.find(x => x.id === sid); if (!s) return
755:   appState.bomPickTarget = sid
756:   appState.bomPickSelected = [...(s.bomRefs || []).map(r => r.bomType + '|' + r.itemId)]
757:   appState.bomPickFilter = 'all'
758:   appState.bomPickSearch = ''
759: 
760:   const titleEl = document.getElementById('bomPickTitle')
761:   if (titleEl) titleEl.textContent = `Resources — Step ${s.stepNum}: ${s.op || '(unnamed)'}`
762: 
763:   const searchEl = document.getElementById('bomPickSearch')
764:   if (searchEl) searchEl.value = ''
765: 
766:   npi.pfd.refreshBomPickModal(p, 'bomPickFilter', 'bomPickList', appState.bomPickFilter, appState.bomPickSearch)
767:   showModal('modalBomPick')
768: }
769: 
770: npi.pfd.refreshBomPickModal = function(p, filterId, listId, activeFilter, searchTerm) {
771:   const filterEl = document.getElementById(filterId)
772:   const listEl = document.getElementById(listId)
773:   if (!filterEl || !listEl) return
774: 
775:   const search = (searchTerm || '').toLowerCase().trim()
776:   const matchesSearch = (text) => !search || (text || '').toLowerCase().includes(search)
777: 
778:   // Aggregate parts from BOM tree and AAW groups
779:   const aggregatedParts = npiBom._aggregatePartsRegister ? npiBom._aggregatePartsRegister(p) : []
780:   
781:   // Get AAW/Repair groups (top-level only)
782:   const aawGroups = p.bom.aaw_repair || []
783: 
784:   const types = Object.entries(BOM_TYPES)
785:   const flatTotal = types.reduce((n, [k]) => n + (p.bom[k] || []).length, 0)
786:   const totalCount = flatTotal + aggregatedParts.length + aawGroups.length
787: 
788:   filterEl.innerHTML = `<button class="bom-filter-btn${activeFilter === 'all' ? ' active' : ''}" data-action="pfd-set-bom-filter" data-filter="all" data-filter-id="${filterId}" data-list-id="${listId}">All (${totalCount})</button>` +
789:     types.map(([k, t]) => `<button class="bom-filter-btn${activeFilter === k ? ' active' : ''}" data-action="pfd-set-bom-filter" data-filter="${k}" data-filter-id="${filterId}" data-list-id="${listId}">${t.icon} ${t.label} (${(p.bom[k] || []).length})</button>`).join('') +
790:     `<button class="bom-filter-btn${activeFilter === 'parts_agg' ? ' active' : ''}" data-action="pfd-set-bom-filter" data-filter="parts_agg" data-filter-id="${filterId}" data-list-id="${listId}">🔩 Parts (${aggregatedParts.length})</button>` +
791:     `<button class="bom-filter-btn${activeFilter === 'aaw_asm' ? ' active' : ''}" data-action="pfd-set-bom-filter" data-filter="aaw_asm" data-filter-id="${filterId}" data-list-id="${listId}">🔧 AAW/Repair Asm (${aawGroups.length})</button>`
792: 
793:   const items = []
794:   
795:   // Add flat BOM types (tools, equip, mat, cons)
796:   types.forEach(([k, t]) => {
797:     if (activeFilter !== 'all' && activeFilter !== k) return
798:     ;(p.bom[k] || []).forEach(item => {
799:       const key = k + '|' + item.id
800:       const name = item.desc || (item.pn || item.toolId || item.equipId || '')
801:       const flags = []
802:       if (item.isAaw) flags.push('<span class="flag-pill flag-aaw">AAW</span>')
803:       if (item.isRepair) flags.push('<span class="flag-pill flag-repair">RPR</span>')
804:       const meta = [item.pn || item.toolId || item.equipId, item.spec].filter(Boolean).join(' · ')
805:       
806:       // Filter by search term
807:       if (!matchesSearch(name) && !matchesSearch(item.pn) && !matchesSearch(item.toolId) && !matchesSearch(item.equipId) && !matchesSearch(item.spec)) return
808:       
809:       items.push(`<div class="bom-pick-item${appState.bomPickSelected.includes(key) ? ' selected' : ''}" data-action="pfd-toggle-bom-pick" data-key="${key}"><input type="checkbox" name="pfd_bom_pick_${key.replace(/[^a-zA-Z0-9_-]/g, '_')}" ${appState.bomPickSelected.includes(key) ? 'checked' : ''} data-action="pfd-toggle-bom-pick" data-key="${key}"><div class="bom-pick-info"><div class="bom-pick-name">${t.icon} ${esc(name || 'Unnamed')}</div><div class="bom-pick-meta">${esc(meta)}</div><div style="display:flex;gap:3px;margin-top:3px;flex-wrap:wrap">${flags.join('')}</div></div><span class="tag" style="font-size:9px;background:var(--bg);color:var(--muted);border:1px solid var(--line);align-self:flex-start">${t.label}</span></div>`)
810:     })
811:   })
812:   
813:   // Add aggregated parts from BOM tree and AAW groups
814:   if (activeFilter === 'all' || activeFilter === 'parts_agg') {
815:     aggregatedParts.forEach(part => {
816:       const key = 'parts_agg|' + (part.pn || part.desc)
817:       const flags = []
818:       const sources = Array.from(part.sources || [])
819:       if (sources.includes('aaw')) flags.push('<span class="flag-pill flag-aaw">AAW</span>')
820:       if (sources.includes('repair')) flags.push('<span class="flag-pill flag-repair">RPR</span>')
821:       const meta = [part.pn, `Qty: ${part.qty} ${part.unit}`].filter(Boolean).join(' · ')
822:       
823:       // Filter by search term
824:       if (!matchesSearch(part.desc) && !matchesSearch(part.pn)) return
825:       
826:       items.push(`<div class="bom-pick-item${appState.bomPickSelected.includes(key) ? ' selected' : ''}" data-action="pfd-toggle-bom-pick" data-key="${key}"><input type="checkbox" name="pfd_bom_pick_${key.replace(/[^a-zA-Z0-9_-]/g, '_')}" ${appState.bomPickSelected.includes(key) ? 'checked' : ''} data-action="pfd-toggle-bom-pick" data-key="${key}"><div class="bom-pick-info"><div class="bom-pick-name">🔩 ${esc(part.desc || part.pn || 'Unnamed')}</div><div class="bom-pick-meta">${esc(meta)}</div><div style="display:flex;gap:3px;margin-top:3px;flex-wrap:wrap">${flags.join('')}</div></div><span class="tag" style="font-size:9px;background:var(--bg);color:var(--muted);border:1px solid var(--line);align-self:flex-start">Part</span></div>`)
827:     })
828:   }
829:   
830:   // Add AAW/Repair assemblies (top-level groups only)
831:   if (activeFilter === 'all' || activeFilter === 'aaw_asm') {
832:     aawGroups.forEach(group => {
833:       const key = 'aaw_asm|' + group.id
834:       const tagLabel = group.tag === 'aaw' ? 'AAW' : (group.tag === 'repair' ? 'Repair' : 'AAW/Repair')
835:       const flagClass = group.tag === 'aaw' ? 'flag-pill flag-aaw' : (group.tag === 'repair' ? 'flag-pill flag-repair' : 'flag-pill flag-aaw')
836:       const totalParts = (group.nodes || []).filter(n => n.nodeType === 'part').length
837:       const totalSubAsm = (group.nodes || []).filter(n => n.nodeType === 'subassembly').length
838:       const meta = [`${totalSubAsm} sub-assemblies`, `${totalParts} parts`].join(' · ')
839:       
840:       // Filter by search term
841:       if (!matchesSearch(group.title)) return
842:       
843:       items.push(`<div class="bom-pick-item${appState.bomPickSelected.includes(key) ? ' selected' : ''}" data-action="pfd-toggle-bom-pick" data-key="${key}"><input type="checkbox" name="pfd_bom_pick_${key.replace(/[^a-zA-Z0-9_-]/g, '_')}" ${appState.bomPickSelected.includes(key) ? 'checked' : ''} data-action="pfd-toggle-bom-pick" data-key="${key}"><div class="bom-pick-info"><div class="bom-pick-name">🔧 ${esc(group.title || 'Unnamed Assembly')}</div><div class="bom-pick-meta">${esc(meta)}</div><div style="display:flex;gap:3px;margin-top:3px;flex-wrap:wrap"><span class="${flagClass}">${tagLabel}</span></div></div><span class="tag" style="font-size:9px;background:var(--bg);color:var(--muted);border:1px solid var(--line);align-self:flex-start">Assembly</span></div>`)
844:     })
845:   }
846: 
847:   if (items.length) {
848:     listEl.innerHTML = items.join('')
849:   } else if (search) {
850:     listEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">No resources match "${esc(search)}"</div>`
851:   } else {
852:     listEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">No items in BoM yet.</div>'
853:   }
854: }
855: 
856: npi.pfd.setBomFilter = function(f, fid, lid) { appState.bomPickFilter = f; npi.pfd.refreshBomPickModal(prog(), fid, lid, f, appState.bomPickSearch) }
857: 
858: npi.pfd.searchBomPick = function(query) {
859:   appState.bomPickSearch = query || ''
860:   npi.pfd.refreshBomPickModal(prog(), 'bomPickFilter', 'bomPickList', appState.bomPickFilter, appState.bomPickSearch)
861: }
862: 
863: npi.pfd.toggleBomPick = function(key, el) {
864:   const chk = el.querySelector('input')
865:   if (appState.bomPickSelected.includes(key)) {
866:     appState.bomPickSelected = appState.bomPickSelected.filter(x => x !== key)
867:     el.classList.remove('selected')
868:     if (chk) chk.checked = false
869:   } else {
870:     appState.bomPickSelected.push(key)
871:     el.classList.add('selected')
872:     if (chk) chk.checked = true
873:   }
874: }
875: 
876: npi.pfd.saveBomPick = function() {
877:   npiData.pfd.saveBomPick(appState.bomPickTarget, appState.bomPickSelected)
878:   closeModal('modalBomPick')
879: }
880: 
881: export const npiPfd = npi.pfd
882: export const renderPfd = npi.pfd.render
883: export const addMainPfdStep = npi.pfd.addMainStep
884: export const updatePfdStep = npi.pfd.upd
885: export const deletePfdStep = npi.pfd.del

(End of file - total 885 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\pfmea.js"
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\pfmea.js</path>
<type>file</type>
<content>1: /* ============================================================
2:    pfmea.js — PFMEA render, mutations, and RPN logic
3:    Depends on: state.js (prog), db.js (save), navigation.js (render), helpers.js (esc, ownerSelectOptions)
4:    pfmea-state.js (PFMEA worksheet/view/filter state)
5:    npi-constants.js (RPN_HIGH, RPN_CRITICAL), npi.js
6:    renderRpnBurndown() is defined in rpn-chart.js (loaded before this file)
7:    ============================================================ */
8: 
9: import { prog, appState } from '../../../../core/js/state.js'
10: import { save } from '../../../../core/js/db.js'
11: import { render } from '../../../../utils/js/navigation.js'
12: import { esc, emptyState, showModal, showToast, canEdit, emailToDisplayName, ownerSelectOptions, ownerDatalistHtml, buildOwnerLookup } from '../../../../utils/js/helpers.js'
13: import { npi } from './npi-shared.js'
14: import { npiComponents } from './npi-components.js'
15: import {
16:   RPN_HIGH,
17:   RPN_CRITICAL,
18:   PFMEA_SCORE_MIN,
19:   PFMEA_SCORE_MAX,
20:   SPECIAL_CHARS
21: } from './npi-constants.js'
22: 
23: npi.components = npiComponents
24: import { renderRpnBurndown } from './rpn-chart.js'
25: import './pfmea-state.js'
26: 
27: // ══════════════════════════════════════
28: // PFMEA — grouped by PFD step, multi-row per step
29: // ══════════════════════════════════════
30: npi.pfmea.calcCauseRpn = function(sev, occ, det) {
31:   if (typeof calcRPN === 'function') return calcRPN({ sev, occ, det })
32:   return (sev || 1) * (occ || 1) * (det || 1)
33: }
34: 
35: npi.pfmea.rpnInFilter = function(rpn, filter) {
36:   const v = Number(rpn) || 0
37:   if (filter === 'high') return v >= RPN_HIGH
38:   if (filter === 'r1_49') return v >= 1 && v <= 49
39:   if (filter === 'r50_99') return v >= 50 && v <= 99
40:   if (filter === 'r100_199') return v >= 100 && v <= 199
41:   if (filter === 'r200_plus') return v >= 200
42:   return true
43: }
44: 
45: npi.pfmea.modeMatchesFilter = function(mode, filter) {
46:   if (filter === 'all') return true
47:   return npi.pfmea.rpnInFilter(npi.pfmea.calcRPN(mode), filter)
48: }
49: 
50: npi.pfmea.parseHistoryDate = function(value) {
51:   const parsed = Date.parse(value || '')
52:   return Number.isFinite(parsed) ? parsed : 0
53: }
54: 
55: npi.pfmea.collectHistoryEntries = function() {
56:   const p = prog()
57:   const stepById = {}
58:   ;(p?.pfd || []).forEach(step => { stepById[step.id] = step })
59: 
60:   const entries = []
61:   ;(p?.pfmea || []).forEach(mode => {
62:     const step = stepById[mode.pfdId] || null
63:     ;(mode.effects || []).forEach(ef => {
64:       ;(ef.causes || []).forEach(ca => {
65:         ;(ca.history || []).forEach((hist, index) => {
66:           const oldRpn = Number(hist.rpn) || 0
67:           const newRpn = Number(hist.newRpn) || ((ef.sev || 1) * (hist.newOcc ?? ca.occ ?? 1) * (hist.newDet ?? ca.det ?? 1))
68:           entries.push({
69:             causeId: ca.id,
70:             historyIndex: index,
71:             stepId: step?.id || '',
72:             stepNum: step?.stepNum ?? '—',
73:             stepName: step?.op || 'Unlinked step',
74:             mode: mode.mode || '',
75:             effect: ef.effect || '',
76:             cause: ca.cause || '',
77:             oldRpn,
78:             newRpn,
79:             oldOcc: hist.oldOcc ?? '',
80:             newOcc: hist.newOcc ?? '',
81:             oldDet: hist.oldDet ?? '',
82:             newDet: hist.newDet ?? '',
83:             desc: hist.desc || '',
84:             date: hist.date || '',
85:             currentRpn: npi.pfmea.calcCauseRpn(ef.sev, ca.occ, ca.det)
86:           })
87:         })
88:       })
89:     })
90:   })
91: 
92:   return entries.sort((a, b) => {
93:     const dateDelta = npi.pfmea.parseHistoryDate(b.date) - npi.pfmea.parseHistoryDate(a.date)
94:     if (dateDelta !== 0) return dateDelta
95:     return (Number(a.stepNum) || 0) - (Number(b.stepNum) || 0)
96:   })
97: }
98: 
99: npi.pfmea.findCauseContext = function(causeId) {
100:   const p = prog()
101:   const stepById = {}
102:   ;(p?.pfd || []).forEach(step => { stepById[step.id] = step })
103: 
104:   for (const mode of (p?.pfmea || [])) {
105:     for (const ef of (mode.effects || [])) {
106:       for (const ca of (ef.causes || [])) {
107:         if (ca.id !== causeId) continue
108:         const step = stepById[mode.pfdId] || null
109:         return {
110:           step,
111:           mode,
112:           effect: ef,
113:           cause: ca,
114:           currentRpn: npi.pfmea.calcCauseRpn(ef.sev, ca.occ, ca.det)
115:         }
116:       }
117:     }
118:   }
119: 
120:   return null
121: }
122: 
123: npi.pfmea.renderHistoryView = function(entries) {
124:   if (!entries.length) {
125:     return `<div class="card"><div style="padding:26px">${emptyState('🕘', 'No PFMEA history yet', 'Implement a recommended action to log PFMEA changes across all steps.')}</div></div>`
126:   }
127: 
128:   return `<div class="card">
129:     <div class="card-head">
130:       <span class="card-title">PFMEA Change History</span>
131:       <span class="card-meta">All logged PFMEA changes across every step, newest first</span>
132:     </div>
133:     <div class="sticky-card-scroll">
134:       <table class="tbl tbl--compact pfmea-history-table">
135:         <thead>
136:           <tr>
137:             <th>Step</th>
138:             <th>Failure Chain</th>
139:             <th>RPN Change</th>
140:             <th>OCC / DET</th>
141:             <th>Action Logged</th>
142:             <th>Date</th>
143:           </tr>
144:         </thead>
145:         <tbody>
146:           ${entries.map(entry => {
147:             const rpnDown = entry.newRpn < entry.oldRpn
148:             const occChanged = entry.oldOcc !== '' || entry.newOcc !== ''
149:             const detChanged = entry.oldDet !== '' || entry.newDet !== ''
150:             return `<tr>
151:               <td>
152:                 <div class="pfmea-history-step">Step ${esc(entry.stepNum)}</div>
153:                 <div class="pfmea-history-step-name">${esc(entry.stepName)}</div>
154:               </td>
155:               <td>
156:                 <div class="pfmea-history-chain">${esc(entry.mode || '—')}</div>
157:                 <div class="pfmea-history-subchain">${esc(entry.effect || '—')}</div>
158:                 <div class="pfmea-history-subchain">Cause: ${esc(entry.cause || '—')}</div>
159:               </td>
160:               <td>
161:                 <div class="pfmea-history-rpn-change ${rpnDown ? 'improved' : 'raised'}">${entry.oldRpn} → ${entry.newRpn}</div>
162:                 <div class="pfmea-history-current">Current: ${npi.components.rpnBadge(entry.currentRpn)}</div>
163:               </td>
164:               <td>
165:                 <div class="pfmea-history-score">OCC ${entry.oldOcc === '' ? '—' : entry.oldOcc} → ${entry.newOcc === '' ? '—' : entry.newOcc}</div>
166:                 <div class="pfmea-history-score">DET ${entry.oldDet === '' ? '—' : entry.oldDet} → ${entry.newDet === '' ? '—' : entry.newDet}</div>
167:               </td>
168:               <td>${esc(entry.desc || 'Action implemented')}</td>
169:               <td>${esc(entry.date || '—')}</td>
170:             </tr>`
171:           }).join('')}
172:         </tbody>
173:       </table>
174:     </div>
175:   </div>`
176: }
177: 
178: npi.pfmea.renderHistoryModalBody = function(context) {
179:   const hist = [...(context.cause.history || [])].reverse()
180:   return `<div class="pfmea-history-modal-summary">
181:     <div class="pfmea-history-modal-grid">
182:       <div>
183:         <div class="pfmea-history-label">Step</div>
184:         <div class="pfmea-history-value">Step ${esc(context.step?.stepNum ?? '—')} · ${esc(context.step?.op || 'Unlinked step')}</div>
185:       </div>
186:       <div>
187:         <div class="pfmea-history-label">Current RPN</div>
188:         <div class="pfmea-history-value">${npi.components.rpnBadge(context.currentRpn)}</div>
189:       </div>
190:       <div>
191:         <div class="pfmea-history-label">Failure Mode</div>
192:         <div class="pfmea-history-value">${esc(context.mode.mode || '—')}</div>
193:       </div>
194:       <div>
195:         <div class="pfmea-history-label">Effect</div>
196:         <div class="pfmea-history-value">${esc(context.effect.effect || '—')}</div>
197:       </div>
198:       <div class="pfmea-history-modal-span">
199:         <div class="pfmea-history-label">Cause</div>
200:         <div class="pfmea-history-value">${esc(context.cause.cause || '—')}</div>
201:       </div>
202:     </div>
203:   </div>
204:   <div class="pfmea-history-modal-list">
205:     ${hist.length ? hist.map(item => {
206:       const oldRpn = Number(item.rpn) || 0
207:       const newRpn = Number(item.newRpn) || oldRpn
208:       const improved = newRpn < oldRpn
209:       return `<div class="pfmea-history-event">
210:         <div class="pfmea-history-event-head">
211:           <span class="pfmea-history-rpn-change ${improved ? 'improved' : 'raised'}">${oldRpn} → ${newRpn}</span>
212:           <span class="pfmea-history-date">${esc(item.date || '—')}</span>
213:         </div>
214:         <div class="pfmea-history-event-scores">OCC ${item.oldOcc ?? '—'} → ${item.newOcc ?? '—'} · DET ${item.oldDet ?? '—'} → ${item.newDet ?? '—'}</div>
215:         <div class="pfmea-history-event-desc">${esc(item.desc || 'Action implemented')}</div>
216:       </div>`
217:     }).join('') : `<div style="padding:8px 0">${emptyState('🕘', 'No history yet', 'This cause has not logged any PFMEA changes yet.')}</div>`}
218:   </div>`
219: }
220: 
221: npi.pfmea.renderPFMEA = function() {
222:   const p = prog()
223:   const sorted = npi.data.sortedPfd(p.pfd).filter(s => npi.data.pfdType.isExecutable(s.type))
224:   if (sorted.length === 0) return emptyState('⚠️', 'No process steps', 'Add steps in Process Flow first.')
225: 
226:   const highRPN = p.pfmea.reduce((n, m) => n + (m.effects || []).reduce((en, ef) => en + (ef.causes || []).filter(ca => npi.pfmea.calcCauseRpn(ef.sev, ca.occ, ca.det) >= RPN_HIGH).length, 0), 0)
227:   const activeFilter = npi.pfmea.getRpnFilter()
228:   const activeView = npi.pfmea.getView()
229:   const historyEntries = npi.pfmea.collectHistoryEntries()
230:   const vis = npi.pfmea.getColumnView()
231:   const xf = npi.pfmea.pfGetExtraFilters()
232: 
233:   const byStep = {}; sorted.forEach(s => { byStep[s.id] = [] }); byStep['__none'] = []
234:   p.pfmea.forEach(r => { const key = (r.pfdId && byStep[r.pfdId] !== undefined) ? r.pfdId : '__none'; byStep[key].push(r) })
235: 
236:   const hasExtraFilters = !!(xf.owner || xf.overdueOnly || xf.specialChar || xf.searchText)
237:   const visibleSteps = sorted.reduce((acc, step) => {
238:     const stepModes = byStep[step.id] || []
239:     const filteredModes = stepModes.filter(mode =>
240:       npi.pfmea.modeMatchesFilter(mode, activeFilter) &&
241:       npi.pfmea.pfModeMatchesExtraFilters(mode, xf)
242:     )
243:     const noFilters = activeFilter === 'all' && !hasExtraFilters
244:     if (noFilters || filteredModes.length > 0) acc.push({ step, modes: noFilters ? stepModes : filteredModes })
245:     return acc
246:   }, [])
247: 
248:   const totalModeCount = p.pfmea.length
249:   const visibleModeCount = visibleSteps.reduce((sum, block) => sum + block.modes.length, 0)
250: 
251:   // Compute total validation warnings for toolbar badge
252:   let totalWarnings = 0
253:   p.pfmea.forEach(mode => (mode.effects || []).forEach(ef => (ef.causes || []).forEach(ca => {
254:     totalWarnings += npi.pfmea.pfValidateCause(ca, ef).length
255:   })))
256: 
257:   // Column geometry
258:   const spanAll = npi.pfmea.pfColCount(vis)
259:   const spanNoEffects = spanAll - (vis.function ? 2 : 1)
260:   const spanNoCauses  = spanAll - (vis.function ? 4 : 3)
261:   const actionGroupSpan = (vis.action ? 2 : 0) + (vis.owner ? 1 : 0) + (vis.due ? 1 : 0) +
262:     (vis.newOcc ? 1 : 0) + (vis.newDet ? 1 : 0) + (vis.forecast ? 1 : 0) + (vis.implement ? 1 : 0)
263: 
264:   // Build colgroup
265:   const colgroup = `<colgroup>
266:     ${vis.function  ? '<col style="width:220px"><!-- function -->' : ''}
267:     <col style="width:220px"><!-- failure mode -->
268:     <col style="width:220px"><!-- effect -->
269:     <col style="width:60px"> <!-- SEV -->
270:     <col style="width:220px"><!-- cause -->
271:     <col style="width:44px"> <!-- OCC -->
272:     ${vis.prevent   ? '<col style="width:220px"><!-- prevent -->' : ''}
273:     ${vis.detect    ? '<col style="width:220px"><!-- detect -->'  : ''}
274:     ${vis.detect    ? '<col style="width:44px"> <!-- DET -->' : ''}
275:     ${vis.detect    ? '<col style="width:60px"> <!-- RPN -->' : ''}
276:     ${vis.action    ? '<col style="width:220px"><!-- action desc -->' : ''}
277:     ${vis.action    ? '<col style="width:220px"><!-- action taken -->' : ''}
278:     ${vis.owner     ? '<col style="width:80px"> <!-- owner -->'   : ''}
279:     ${vis.due       ? '<col style="width:100px"><!-- due -->'     : ''}
280:     ${vis.newOcc    ? '<col style="width:44px"> <!-- new OCC -->' : ''}
281:     ${vis.newDet    ? '<col style="width:44px"> <!-- new DET -->' : ''}
282:     ${vis.forecast  ? '<col style="width:60px"> <!-- forecast -->' : ''}
283:     ${vis.implement ? '<col style="width:60px"> <!-- implement -->' : ''}
284:     <col style="width:28px"> <!-- del -->
285:   </colgroup>`
286: 
287:   // Build header
288:   let thead = `<thead><tr>
289:     ${vis.function ? '<th rowspan="2">Function</th>' : ''}
290:     <th rowspan="2">Failure Mode</th>
291:     <th rowspan="2">Effect</th>
292:     <th rowspan="2" title="Severity of effect">SEV <button class="btn btn-ghost btn-xs" style="font-size:9px;padding:0 4px;margin-left:2px" data-action="pfmea-show-severity" title="View Severity criteria">?</button></th>
293:     <th rowspan="2">Cause</th>
294:     <th rowspan="2" title="Occurrence of cause">OCC <button class="btn btn-ghost btn-xs" style="font-size:9px;padding:0 4px;margin-left:2px" data-action="pfmea-show-occurrence" title="View Occurrence criteria">?</button></th>
295:     ${vis.prevent   ? '<th rowspan="2">Controls — Prevent</th>' : ''}
296:     ${vis.detect    ? '<th rowspan="2">Controls — Detect</th>'  : ''}
297:     ${vis.detect ? '<th rowspan="2" title="Detection rating">DET <button class="btn btn-ghost btn-xs" style="font-size:9px;padding:0 4px;margin-left:2px" data-action="pfmea-show-detection" title="View Detection criteria">?</button></th>' : ''}
298:     ${vis.detect ? '<th rowspan="2">RPN</th>' : ''}
299:     ${actionGroupSpan > 0 ? `<th colspan="${actionGroupSpan}" style="background:var(--blue-pale);color:var(--blue);letter-spacing:.5px">RECOMMENDED ACTION &amp; RESCORING</th>` : ''}
300:     <th rowspan="${actionGroupSpan > 0 ? 2 : 1}"></th>
301:   </tr>`
302:   if (actionGroupSpan > 0) {
303:     thead += `<tr>
304:       ${vis.action    ? `<th style="background:var(--blue-pale);color:var(--blue);white-space:normal;line-height:1.3;padding:3px 4px">Recommended<br>Action</th>` : ''}
305:       ${vis.action    ? `<th style="background:var(--blue-pale);color:var(--blue);white-space:normal;line-height:1.3;padding:3px 4px">Action<br>Taken</th>` : ''}
306:       ${vis.owner     ? `<th style="background:var(--blue-pale);color:var(--blue);white-space:normal;line-height:1.3;padding:3px 4px">Owner</th>` : ''}
307:       ${vis.due       ? `<th style="background:var(--blue-pale);color:var(--blue);white-space:normal;line-height:1.3;padding:3px 4px">Due</th>` : ''}
308:       ${vis.newOcc    ? `<th style="background:var(--blue-pale);color:var(--blue);white-space:normal;line-height:1.3;padding:3px 4px">New<br>OCC</th>` : ''}
309:       ${vis.newDet    ? `<th style="background:var(--blue-pale);color:var(--blue);white-space:normal;line-height:1.3;padding:3px 4px">New<br>DET</th>` : ''}
310:       ${vis.forecast  ? `<th style="background:var(--blue-pale);color:var(--blue);white-space:normal;line-height:1.3;padding:3px 4px">Forecast<br>RPN</th>` : ''}
311:       ${vis.implement ? `<th style="background:var(--blue-pale);color:var(--blue);white-space:normal;line-height:1.3;padding:3px 4px">Implement</th>` : ''}
312:     </tr>`
313:   }
314:   thead += '</thead>'
315: 
316:   let html = `<div class="pfmea-wrap" style="-webkit-overflow-scrolling:touch"><table class="tbl tbl--compact pfmea-tbl" style="table-layout:fixed;min-width:${npi.pfmea.pfColMinWidth(vis)}px;width:100%">
317:   ${colgroup}
318:   ${thead}
319:   <tbody>`
320: 
321:   visibleSteps.forEach(block => {
322:     const s = block.step
323:     const modes = block.modes || []
324:     const ctqBadges = (s.ctqIds || []).map(cid => {
325:       const ci = p.ctq.findIndex(c => c.id === cid)
326:       return ci >= 0 ? `<span class="tag tag-ctq" style="font-size:9px">C${ci + 1}</span>` : ''
327:     }).join(' ')
328: 
329:     html += `<tr><td colspan="${spanAll}" style="padding:0;border-top:3px solid var(--gray-500)"><div class="pfmea-step-header"><span class="pfmea-step-label">Step ${s.stepNum} — ${esc(s.op || '(unnamed)')}</span><div class="pfmea-step-ctqs">${ctqBadges}</div></div></td></tr>`
330: 
331:     if (modes.length === 0 && !hasExtraFilters && activeFilter === 'all') {
332:       html += `<tr class="pfmea-row-sub"><td colspan="${spanAll - 1}" style="padding:8px 14px;color:var(--muted);font-size:12px;font-style:italic">No failure modes yet</td><td></td></tr>`
333:     }
334: 
335:     modes.forEach(mode => {
336:       const mi = p.pfmea.indexOf(mode)
337:       const effects = mode.effects || []
338:       const totalCauseRows = effects.reduce((n, ef) => n + Math.max(1, (ef.causes || []).length), 0)
339:       const modeRowspan = Math.max(1, totalCauseRows)
340: 
341:       effects.forEach((ef, ei) => {
342:         const causes = ef.causes || []
343:         const efRowspan = Math.max(1, causes.length)
344:         const sev = ef.sev || 1
345:         const scKey = ef.specialChar || null
346:         const scDef = scKey ? (SPECIAL_CHARS[scKey.toUpperCase()] || null) : null
347: 
348:         causes.forEach((ca, ci) => {
349:           const occ = ca.occ || 1, det = ca.det || 1
350:           const rpn = sev * occ * det
351:           const act = ca.action || {}
352:           const hist = ca.history || []
353:           const hasAction = !!(act.newOcc || act.newDet)
354:           const newOcc = act.newOcc ? +act.newOcc : occ
355:           const newDet = act.newDet ? +act.newDet : det
356:           const forecast = sev * newOcc * newDet
357: 
358:           const warnings = npi.pfmea.pfValidateCause(ca, ef)
359:           const warnBadges = warnings.length > 0
360:             ? warnings.map(w => `<span class="pf-warning-badge pf-warning-${w.severity}" title="${esc(w.message)}" data-action="pfmea-show-warnings" data-warnings="${esc(JSON.stringify(warnings))}">⚠</span>`).join('')
361:             : ''
362: 
363:           const histRows = hist.length > 0 ? hist.map(h => {
364:             const rpnDown = h.newRpn < h.rpn
365:             const occDown = (h.newOcc ?? h.oldOcc) < (h.oldOcc ?? h.newOcc)
366:             const detDown = (h.newDet ?? h.oldDet) < (h.oldDet ?? h.newDet)
367:             return `<div style="border-bottom:1px solid var(--line);padding:5px 0;margin-bottom:4px">
368:               <div style="display:flex;align-items:center;gap:6px">
369:                 <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;color:${rpnDown ? 'var(--green)' : 'var(--red)'}">${h.rpn}→${h.newRpn}</span>
370:                 <span style="color:var(--muted);font-size:9px;margin-left:auto">${h.date}</span>
371:               </div>
372:               ${(h.oldOcc || h.oldDet) ? `<div style="color:var(--muted);font-size:9px;margin-top:2px">
373:                 OCC <b>${h.oldOcc ?? '—'}</b>→<b style="color:${occDown ? 'var(--green)' : 'var(--red)'}">${h.newOcc ?? '—'}</b>
374:                 &nbsp;·&nbsp;
375:                 DET <b>${h.oldDet ?? '—'}</b>→<b style="color:${detDown ? 'var(--green)' : 'var(--red)'}">${h.newDet ?? '—'}</b>
376:               </div>` : ''}
377:               <div style="color:var(--mid);font-size:10px;margin-top:3px;font-style:italic">"${esc(h.desc)}"</div>
378:             </div>`
379:           }).join('') : '<span style="font-size:10px;color:var(--muted);font-style:italic">No history yet</span>'
380: 
381:           let rowHtml = `<tr class="pfmea-row-sub" data-cause-id="${esc(ca.id || '')}">`
382: 
383:           // Function + Mode cell — first effect, first cause only
384:           if (ei === 0 && ci === 0) {
385:             if (vis.function) {
386:               rowHtml += `<td rowspan="${modeRowspan}" class="pfmea-mode-cell" style="vertical-align:top">
387:                 <textarea class="cell-edit" name="pfmea_fn_${mi}" rows="1" data-autoresize data-action="pfmea-upd-mode" data-mi="${mi}" data-field="function" placeholder="Intended function…" style="width:100%">${esc(mode.function || '')}</textarea>
388:               </td>`
389:             }
390:             rowHtml += `<td rowspan="${modeRowspan}" class="pfmea-mode-cell" style="vertical-align:top">
391:               <textarea class="cell-edit" name="pfmea_mode_${mi}" rows="1" data-autoresize data-action="pfmea-upd-mode" data-mi="${mi}" data-field="mode" placeholder="Failure mode" style="width:100%">${esc(mode.mode)}</textarea>
392:               ${canEdit() ? `<div style="margin-top:4px;display:flex;gap:3px;flex-wrap:wrap">
393:                 <button class="add-row" style="font-size:9px;padding:1px 6px" data-action="pfmea-add-effect" data-mi="${mi}">＋ Effect</button>
394:                 <button class="del-btn" data-action="pfmea-del-mode" data-mi="${mi}" style="font-size:9px">× Mode</button>
395:               </div>` : ''}
396:             </td>`
397:           }
398: 
399:           // Effect + SEV — first cause of each effect only
400:           if (ci === 0) {
401:             rowHtml += `<td rowspan="${efRowspan}" style="vertical-align:top">
402:               <textarea class="cell-edit" name="pfmea_effect_${mi}_${ei}" rows="1" data-autoresize data-action="pfmea-upd-effect" data-mi="${mi}" data-ei="${ei}" data-field="effect" placeholder="Effect of failure" style="width:100%">${esc(ef.effect)}</textarea>
403:               ${canEdit() ? `<div style="margin-top:3px;display:flex;gap:3px">
404:                 <button class="add-row" style="font-size:9px;padding:1px 6px" data-action="pfmea-add-cause" data-mi="${mi}" data-ei="${ei}">＋ Cause</button>
405:                 <button class="del-btn" data-action="pfmea-del-effect" data-mi="${mi}" data-ei="${ei}" style="font-size:9px">× Eff</button>
406:               </div>` : ''}
407:             </td>
408:             <td rowspan="${efRowspan}" class="pfmea-score-cell">
409:               <input type="number" class="cell-edit mono pfmea-score-input" name="pfmea_sev_${mi}_${ei}" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${sev}"
410:                 data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-kind="effect-sev" data-fallback="${sev}">
411:               ${canEdit() ? `<select class="pf-sc-select" data-action="pfmea-special-char" data-mi="${mi}" data-ei="${ei}" title="Special characteristic">
412:                 <option value="">—</option>
413:                 <option value="safety"   ${scKey === 'safety'   ? 'selected' : ''}>🦺</option>
414:                 <option value="critical" ${scKey === 'critical' ? 'selected' : ''}>❗</option>
415:                 <option value="major"    ${scKey === 'major'    ? 'selected' : ''}>⚠️</option>
416:               </select>` : (scDef ? `<span class="pf-sc-badge pf-sc-${scKey}" title="${scDef.label}">${scDef.symbol}</span>` : '')}
417:             </td>`
418:           }
419: 
420:           rowHtml += `
421:             <td class="pfmea-cause-cell pfmea-cause-text" style="vertical-align:top">
422:               <textarea class="cell-edit" name="pfmea_cause_${mi}_${ei}_${ci}" rows="1" data-autoresize data-action="pfmea-upd-cause" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="cause" placeholder="Cause of failure" style="width:100%">${esc(ca.cause)}</textarea>
423:             </td>
424:             <td class="pfmea-score-cell">
425:               <input type="number" class="cell-edit mono pfmea-score-input" name="pfmea_occ_${mi}_${ei}_${ci}" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${occ}"
426:                 data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-kind="cause-occ" data-fallback="${occ}">
427:             </td>
428:             ${vis.prevent ? `<td style="vertical-align:top">
429:               <textarea class="cell-edit" name="pfmea_prevent_${mi}_${ei}_${ci}" rows="1" data-autoresize data-action="pfmea-upd-cause" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="prevent" placeholder="Prevention controls" style="width:100%">${esc(ca.prevent || '')}</textarea>
430:             </td>` : ''}
431:             ${vis.detect ? `<td style="vertical-align:top">
432:               <textarea class="cell-edit" name="pfmea_detect_${mi}_${ei}_${ci}" rows="1" data-autoresize data-action="pfmea-upd-cause" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="detect" placeholder="Detection controls" style="width:100%">${esc(ca.detect || '')}</textarea>
433:             </td>` : ''}
434:             ${vis.detect ? `<td class="pfmea-score-cell">
435:               <input type="number" class="cell-edit mono pfmea-score-input" name="pfmea_det_${mi}_${ei}_${ci}" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${det}"
436:                 data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-kind="cause-det" data-fallback="${det}">
437:             </td>` : ''}
438:             ${vis.detect ? `<td class="pfmea-score-cell">
439:               ${npi.components.rpnBadge(rpn, { id: `rpn_${mi}_${ei}_${ci}` })}
440:               ${warnBadges}
441:               ${hist.length > 0 ? `<button class="rpn-hist-btn" data-action="pfmea-show-hist" data-cause-id="${ca.id}">⏱${hist.length}</button>` : ''}
442:             </td>` : ''}
443:             ${vis.action ? `<td style="vertical-align:top"><textarea class="cell-edit" name="pfmea_action_desc_${mi}_${ei}_${ci}" rows="1" data-autoresize data-action="pfmea-upd-cause-action" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="desc" placeholder="Recommended action" style="width:100%;background:${act.desc ? 'var(--field-highlight)' : ''};">${esc(act.desc || '')}</textarea>${ca.action_related_ecr_id ? `<div style="margin-top:4px;padding:4px 6px;background:var(--accent-dim);border-radius:3px;border-left:2px solid var(--accent);font-size:10px;font-weight:600;cursor:pointer;text-align:center" onclick="navigate('mcs');">🔗 ${esc(ca.action_related_ecr_id)}</div>` : ''}</td>` : ''}
444:             ${vis.action ? `<td style="vertical-align:top"><textarea class="cell-edit" name="pfmea_action_taken_${mi}_${ei}_${ci}" rows="1" data-autoresize data-action="pfmea-upd-cause-action" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="taken" placeholder="Action taken" style="width:100%">${esc(act.taken || '')}</textarea></td>` : ''}
445:             ${vis.owner ? `<td><div class="pfmea-owner-picker"><input type="text" class="cell-edit" name="pfmea_action_owner_display_${mi}_${ei}_${ci}" data-action="pfmea-owner-input" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" list="pfmea-owner-list" value="${esc(act.owner || '')}" placeholder="🔍 Search person" autocomplete="off" style="width:100%"><input type="hidden" name="pfmea_action_owner_${mi}_${ei}_${ci}" data-action="pfmea-upd-cause-action" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="owner" value="${esc(act.owner || '')}"></div></td>` : ''}
446:             ${vis.due ? `<td><input type="date" class="cell-edit mono" name="pfmea_action_due_${mi}_${ei}_${ci}" value="${esc(act.due || '')}" data-action="pfmea-upd-cause-action" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-field="due" style="width:100%;font-size:11px"></td>` : ''}
447:             ${vis.newOcc ? `<td class="pfmea-score-cell">
448:               <input type="number" class="cell-edit mono pfmea-score-input" name="pfmea_action_occ_${mi}_${ei}_${ci}" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${act.newOcc || ''}" placeholder="${occ}"
449:                 data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-kind="action-occ" data-allow-blank="1" data-fallback="" style="background:var(--field-highlight)">
450:             </td>` : ''}
451:             ${vis.newDet ? `<td class="pfmea-score-cell">
452:               <input type="number" class="cell-edit mono pfmea-score-input" name="pfmea_action_det_${mi}_${ei}_${ci}" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${act.newDet || ''}" placeholder="${det}"
453:                 data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" data-kind="action-det" data-allow-blank="1" data-fallback="" style="background:var(--field-highlight)">
454:             </td>` : ''}
455:             ${vis.forecast ? `<td class="pfmea-score-cell">
456:               <span id="forecast_wrap_${mi}_${ei}_${ci}" style="display:inline-block;opacity:${hasAction ? '1' : '0'}">${npi.components.rpnBadge(hasAction ? forecast : 0, { id: `forecast_${mi}_${ei}_${ci}`, emptyLabel: '—' })}</span>
457:             </td>` : ''}
458:             ${vis.implement ? `<td style="text-align:center;vertical-align:top;padding-top:4px">
459:               ${canEdit() ? `<button class="btn btn-sm btn-green" style="font-size:9px;padding:3px 6px;white-space:nowrap" data-action="pfmea-implement" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}" title="Apply new OCC/DET and log to history">▶ Apply</button>` : ''}
460:             </td>` : ''}
461:             <td style="text-align:center">${canEdit() ? `<button class="del-btn" data-action="pfmea-del-cause" data-mi="${mi}" data-ei="${ei}" data-ci="${ci}">×</button>` : ''}</td>
462:           </tr>`
463:           html += rowHtml
464:         })
465: 
466:         // Effect with no causes
467:         if (causes.length === 0) {
468:           let rowHtml = `<tr class="pfmea-row-sub">`
469:           if (ei === 0) {
470:             if (vis.function) {
471:               rowHtml += `<td rowspan="1" class="pfmea-mode-cell" style="vertical-align:top">
472:                 <textarea class="cell-edit" name="pfmea_fn_${mi}" rows="1" data-autoresize data-action="pfmea-upd-mode" data-mi="${mi}" data-field="function" placeholder="Intended function…" style="width:100%">${esc(mode.function || '')}</textarea>
473:               </td>`
474:             }
475:             rowHtml += `<td rowspan="1" class="pfmea-mode-cell" style="vertical-align:top">
476:               <textarea class="cell-edit" name="pfmea_mode_${mi}" rows="1" data-autoresize data-action="pfmea-upd-mode" data-mi="${mi}" data-field="mode" placeholder="Failure mode" style="width:100%">${esc(mode.mode)}</textarea>
477:               ${canEdit() ? `<div style="margin-top:4px;display:flex;gap:3px">
478:                 <button class="add-row" style="font-size:9px;padding:1px 6px" data-action="pfmea-add-effect" data-mi="${mi}">＋ Effect</button>
479:                 <button class="del-btn" data-action="pfmea-del-mode" data-mi="${mi}" style="font-size:9px">× Mode</button>
480:               </div>` : ''}
481:             </td>`
482:           }
483:           rowHtml += `<td style="vertical-align:top">
484:               <textarea class="cell-edit" name="pfmea_effect_${mi}_${ei}" rows="1" data-autoresize data-action="pfmea-upd-effect" data-mi="${mi}" data-ei="${ei}" data-field="effect" placeholder="Effect of failure" style="width:100%">${esc(ef.effect)}</textarea>
485:               ${canEdit() ? `<div style="margin-top:3px;display:flex;gap:3px">
486:                 <button class="add-row" style="font-size:9px;padding:1px 6px" data-action="pfmea-add-cause" data-mi="${mi}" data-ei="${ei}">＋ Cause</button>
487:                 <button class="del-btn" data-action="pfmea-del-effect" data-mi="${mi}" data-ei="${ei}" style="font-size:9px">× Eff</button>
488:               </div>` : ''}
489:             </td>
490:             <td class="pfmea-score-cell">
491:               <input type="number" class="cell-edit mono pfmea-score-input" name="pfmea_sev_${mi}_${ei}" min="${PFMEA_SCORE_MIN}" max="${PFMEA_SCORE_MAX}" value="${sev}"
492:                 data-action="pfmea-score" data-mi="${mi}" data-ei="${ei}" data-ci="-1" data-kind="effect-sev" data-fallback="${sev}">
493:             </td>
494:             <td colspan="${spanNoCauses}" style="color:var(--muted);font-size:11px;font-style:italic;padding:8px">No causes yet — click ＋ Cause</td>
495:           </tr>`
496:           html += rowHtml
497:         }
498:       })
499: 
500:       // Mode with no effects
501:       if (effects.length === 0) {
502:         let noEffHtml = `<tr class="pfmea-row-sub">`
503:         if (vis.function) {
504:           noEffHtml += `<td class="pfmea-mode-cell" style="vertical-align:top">
505:             <textarea class="cell-edit" name="pfmea_fn_${mi}" rows="1" data-autoresize data-action="pfmea-upd-mode" data-mi="${mi}" data-field="function" placeholder="Intended function…" style="width:100%">${esc(mode.function || '')}</textarea>
506:           </td>`
507:         }
508:         noEffHtml += `<td class="pfmea-mode-cell" style="vertical-align:top">
509:             <textarea class="cell-edit" name="pfmea_mode_${mi}" rows="1" data-autoresize data-action="pfmea-upd-mode" data-mi="${mi}" data-field="mode" placeholder="Failure mode" style="width:100%">${esc(mode.mode)}</textarea>
510:             ${canEdit() ? `<div style="margin-top:4px;display:flex;gap:3px">
511:               <button class="add-row" style="font-size:9px;padding:1px 6px" data-action="pfmea-add-effect" data-mi="${mi}">＋ Effect</button>
512:               <button class="del-btn" data-action="pfmea-del-mode" data-mi="${mi}" style="font-size:9px">× Mode</button>
513:             </div>` : ''}
514:           </td>
515:           <td colspan="${spanNoEffects}" style="color:var(--muted);font-size:11px;font-style:italic;padding:8px">No effects yet — click ＋ Effect</td>
516:         </tr>`
517:         html += noEffHtml
518:       }
519:     })
520: 
521:     if (canEdit()) html += `<tr><td colspan="${spanAll}" style="padding:0"><div class="pfmea-add-row" data-action="pfmea-add-mode" data-step-id="${s.id}">＋ Add failure mode for Step ${s.stepNum}</div></td></tr>`
522:   })
523: 
524:   if (visibleSteps.length === 0) {
525:     html += `<tr class="pfmea-row-sub"><td colspan="${spanAll}" style="padding:14px;color:var(--muted);font-size:12px;font-style:italic;text-align:center">No operations match this filter. <a href="#" data-action="pfmea-filter-all" style="color:var(--blue)">Show all</a></td></tr>`
526:   }
527: 
528:   html += '</tbody></table></div>'
529:   // Searchable owner picker datalist — rendered once for all PFMEA rows
530:   html += ownerDatalistHtml('pfmea-owner-list')
531: 
532:   const filterLabel = activeFilter === 'all' ? 'All RPN' :
533:     activeFilter === 'high' ? `High RPN (≥${RPN_HIGH})` :
534:     activeFilter === 'r1_49' ? 'RPN 1-49' :
535:     activeFilter === 'r50_99' ? 'RPN 50-99' :
536:     activeFilter === 'r100_199' ? 'RPN 100-199' : 'RPN 200+'
537: 
538:   const uniqueOwners = npi.pfmea.pfGetUniqueOwners(p)
539: 
540:   const viewTabs = `<div class="pfmea-toolbar">
541:     <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
542:       <div class="pfmea-view-tabs">
543:         <button class="pfmea-view-btn ${activeView === 'worksheet' ? 'active' : ''}" data-action="pfmea-set-view" data-view="worksheet">Worksheet</button>
544:         <button class="pfmea-view-btn ${activeView === 'history' ? 'active' : ''}" data-action="pfmea-set-view" data-view="history">History${historyEntries.length ? ` <span class="pfmea-view-count">${historyEntries.length}</span>` : ''}</button>
545:       </div>
546:       ${activeView === 'worksheet' ? `<div class="pf-col-view-tabs">
547:         <button class="pf-col-btn ${vis.name === 'compact'  ? 'active' : ''}" data-action="pfmea-set-col-view" data-col-view="compact"  title="Core columns only">Compact</button>
548:         <button class="pf-col-btn ${vis.name === 'standard' ? 'active' : ''}" data-action="pfmea-set-col-view" data-col-view="standard" title="Standard PFMEA view">Standard</button>
549:         <button class="pf-col-btn ${vis.name === 'full'     ? 'active' : ''}" data-action="pfmea-set-col-view" data-col-view="full"     title="All columns">Full</button>
550:       </div>` : ''}
551:     </div>
552:     ${activeView === 'worksheet'
553:       ? `<div class="pfmea-filter-wrap">
554:         <label class="pfmea-filter-label">RPN
555:           <select class="pfmea-filter-select" name="pfmea_filter" data-action="pfmea-filter">
556:             <option value="all"${activeFilter === 'all' ? ' selected' : ''}>All</option>
557:             <option value="high"${activeFilter === 'high' ? ' selected' : ''}>High only (≥${RPN_HIGH})</option>
558:             <option value="r1_49"${activeFilter === 'r1_49' ? ' selected' : ''}>1-49</option>
559:             <option value="r50_99"${activeFilter === 'r50_99' ? ' selected' : ''}>50-99</option>
560:             <option value="r100_199"${activeFilter === 'r100_199' ? ' selected' : ''}>100-199</option>
561:             <option value="r200_plus"${activeFilter === 'r200_plus' ? ' selected' : ''}>200+</option>
562:           </select>
563:         </label>
564:         ${uniqueOwners.length > 0 ? `<label class="pfmea-filter-label">Owner
565:           <select class="pfmea-filter-select" data-action="pfmea-owner-filter">
566:             <option value="">All</option>
567:             ${uniqueOwners.map(o => `<option value="${esc(o)}"${xf.owner === o ? ' selected' : ''}>${esc(emailToDisplayName(o))}</option>`).join('')}
568:           </select>
569:         </label>` : ''}
570:         <label class="pfmea-filter-label pf-checkbox-label"><input type="checkbox" data-action="pfmea-overdue-filter" ${xf.overdueOnly ? 'checked' : ''}> Overdue</label>
571:         <label class="pfmea-filter-label">SC
572:           <select class="pfmea-filter-select" data-action="pfmea-sc-filter">
573:             <option value="">All</option>
574:             <option value="safety"   ${xf.specialChar === 'safety'   ? 'selected' : ''}>🦺 Safety</option>
575:             <option value="critical" ${xf.specialChar === 'critical' ? 'selected' : ''}>❗ Critical</option>
576:             <option value="major"    ${xf.specialChar === 'major'    ? 'selected' : ''}>⚠️ Major</option>
577:           </select>
578:         </label>
579:         <input type="text" class="pfmea-filter-select pf-text-search" data-action="pfmea-text-search" placeholder="Search…" value="${esc(xf.searchText)}" style="min-width:120px">
580:         ${hasExtraFilters ? `<button class="btn btn-ghost btn-sm" data-action="pfmea-clear-extra-filters">✕ Clear</button>` : ''}
581:         <span class="tag" style="align-self:center">${filterLabel}: ${visibleModeCount}/${totalModeCount}</span>
582:         ${highRPN > 0 ? `<span class="tag tag-amber" style="align-self:center">⚠ ${highRPN} high ≥${RPN_HIGH}</span>` : ''}
583:         ${totalWarnings > 0 ? `<span class="tag tag-red pf-warn-summary" style="align-self:center;cursor:pointer" title="Click any ⚠ badge in the table for details">⚠ ${totalWarnings} warning${totalWarnings > 1 ? 's' : ''}</span>` : ''}
584:         <div class="pf-sc-legend">SC: 🦺 Safety — safety or regulatory impact &nbsp;·&nbsp; ❗ Critical — non-conformance reaches customer &nbsp;·&nbsp; ⚠️ Major — significant quality impact</div>
585:       </div>`
586:       : `<div class="pfmea-history-summary"><span class="tag" style="align-self:center">${historyEntries.length} logged change${historyEntries.length === 1 ? '' : 's'}</span></div>`}
587:   </div>`
588: 
589:   const isExpanded = !!appState.pfmeaExpanded
590: 
591:   // Fullscreen overlay — renders just the toolbar and scrollable table covering the full viewport
592:   if (isExpanded) {
593:     return `<div class="pfmea-fullscreen-overlay">
594:   <div class="pfmea-fullscreen-bar">
595:     <span class="pfmea-fullscreen-title">PFMEA <span class="pfmea-fullscreen-project">${esc(p.name || '')}</span></span>
596:     <button class="btn btn-ghost btn-sm" data-action="pfmea-toggle-expand" title="Exit fullscreen (Esc)">✕ Exit Fullscreen</button>
597:   </div>
598:   ${viewTabs}
599:   <div class="pfmea-fullscreen-body">${activeView === 'history' ? npi.pfmea.renderHistoryView(historyEntries) : html}</div>
600: </div>`
601:   }
602: 
603:   if (activeView === 'history') {
604:     return `<div class="sec-head"><div><div class="sec-eyebrow">Step 03</div><div class="sec-title">PFMEA</div>
605:     <div class="sec-desc">Failure history across all PFMEA steps in one place.</div></div>
606:     <div class="sec-actions">
607:       <button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide="npi-pfmea" title="User Guide">❓ Guide</button>
608:       <button class="btn btn-ghost btn-sm" data-action="pfmea-toggle-expand" title="Expand to fullscreen">⛶ Expand</button>
609:     </div></div>
610:     ${viewTabs}
611:     ${npi.pfmea.renderHistoryView(historyEntries)}`
612:   }
613: 
614:   return `<div class="sec-head"><div><div class="sec-eyebrow">Step 03</div><div class="sec-title">PFMEA</div>
615:   <div class="sec-desc">Failure Mode → Effect (SEV) → Cause (OCC) → Controls Prevent / Detect (DET) → RPN. Actions and rescoring per cause.</div></div>
616:   <div class="sec-actions">
617:     <button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide="npi-pfmea" title="User Guide">❓ Guide</button>
618:     <button class="btn btn-ghost btn-sm" data-action="pfmea-toggle-expand" title="Expand to fullscreen">⛶ Expand</button>
619:   </div></div>
620: ${viewTabs}
621: <details class="card" style="margin-bottom:18px;padding:0;overflow:hidden">
622:     <summary class="card-head" style="padding:10px 14px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:12px">
623:       <span style="font-size:10px;color:var(--muted)">▶</span>
624:       <span class="card-title">📉 RPN Burndown — Total Original vs Total Current</span>
625:       <span class="card-meta" style="margin-left:auto">Sum across all failure modes · green = improved</span>
626:     </summary>
627:     <div style="padding:14px 16px 16px">${renderRpnBurndown(false)}</div>
628: </details>
629: ${p.pfmea.length > 0 ? `<div class="info-banner">💡 RPN = SEV × OCC × DET. ▶ Apply writes new scores and logs old RPN to history. Next: <a href="#" data-action="npi-set-apqp" data-tab="cp" style="color:var(--blue)">Control Plan →</a></div>` : ''}
630: <div class="card">${html}</div>`
631: }
632: 
633: // ── SOD Criteria modals ─────────────────────────────────────
634: npi.pfmea.pfShowSeverity = function() {
635:   if (typeof showModal === 'function') showModal('modalPfmeaSeverity')
636:   else {
637:     const modal = document.getElementById('modalPfmeaSeverity')
638:     if (modal) modal.style.display = 'flex'
639:   }
640: }
641: npi.pfmea.pfShowOccurrence = function() {
642:   if (typeof showModal === 'function') showModal('modalPfmeaOccurrence')
643:   else {
644:     const modal = document.getElementById('modalPfmeaOccurrence')
645:     if (modal) modal.style.display = 'flex'
646:   }
647: }
648: npi.pfmea.pfShowDetection = function() {
649:   if (typeof showModal === 'function') showModal('modalPfmeaDetection')
650:   else {
651:     const modal = document.getElementById('modalPfmeaDetection')
652:     if (modal) modal.style.display = 'flex'
653:   }
654: }
655: 
656: // ── History modal ─────────────────────────────────────────────
657: npi.pfmea.pfShowHist = function(evt, cid) {
658:   const context = npi.pfmea.findCauseContext(cid)
659:   if (!context) return
660:   const titleEl = document.getElementById('pfmeaHistoryModalTitle')
661:   const bodyEl = document.getElementById('pfmeaHistoryModalBody')
662:   if (titleEl) titleEl.textContent = `PFMEA History — Step ${context.step?.stepNum ?? '—'}`
663:   if (bodyEl) bodyEl.innerHTML = npi.pfmea.renderHistoryModalBody(context)
664:   if (typeof showModal === 'function') showModal('modalPfmeaHistory')
665:   else {
666:     const modal = document.getElementById('modalPfmeaHistory')
667:     if (modal) modal.style.display = 'flex'
668:   }
669:   if (evt?.stopPropagation) evt.stopPropagation()
670: }
671: 
672: // ── PFMEA data mutators ───────────────────────────────────────
673: npi.pfmea.pfAddMode = function(pfdId) { npi.data.pfmea.addMode(pfdId); render() }
674: npi.pfmea.pfUpdMode = function(mi, f, v) { npi.data.pfmea.updMode(mi, f, v) }
675: npi.pfmea.pfDelMode = function(mi) { npi.data.pfmea.delMode(mi); render() }
676: npi.pfmea.pfAddEffect = function(mi) { npi.data.pfmea.addEffect(mi); render() }
677: npi.pfmea.pfNormalizeScore = function(v, allowBlank) {
678:   const raw = v === undefined || v === null ? '' : String(v).trim()
679:   if (!raw) return allowBlank ? '' : 1
680:   const n = parseInt(raw.replace(/[^0-9]/g, ''), 10)
681:   if (!Number.isFinite(n)) return allowBlank ? '' : 1
682:   return Math.min(PFMEA_SCORE_MAX, Math.max(PFMEA_SCORE_MIN, n))
683: }
684: npi.pfmea.pfScoreInput = function(inputEl, allowBlank) {
685:   const safe = npi.pfmea.pfNormalizeScore(inputEl.value, allowBlank)
686:   inputEl.value = safe === '' ? '' : String(safe)
687:   return safe
688: }
689: npi.pfmea.pfScorePreview = function(inputEl, allowBlank, fallback) {
690:   const raw = inputEl.value === undefined || inputEl.value === null ? '' : String(inputEl.value).trim()
691:   if (!raw) return allowBlank ? '' : npi.pfmea.pfNormalizeScore(fallback, false)
692:   const n = parseInt(raw.replace(/[^0-9]/g, ''), 10)
693:   if (!Number.isFinite(n)) return allowBlank ? '' : npi.pfmea.pfNormalizeScore(fallback, false)
694:   return Math.min(PFMEA_SCORE_MAX, Math.max(PFMEA_SCORE_MIN, n))
695: }
696: npi.pfmea.pfUpdEffect = function(mi, ei, f, v) {
697:   const saveNow = arguments.length < 5 ? true : !!arguments[4]
698:   npi.data.pfmea.updEffect(mi, ei, f, v, saveNow)
699: }
700: npi.pfmea.pfDelEffect = function(mi, ei) { npi.data.pfmea.delEffect(mi, ei); render() }
701: npi.pfmea.pfAddCause = function(mi, ei) { npi.data.pfmea.addCause(mi, ei); render() }
702: npi.pfmea.pfUpdCause = function(mi, ei, ci, f, v) {
703:   const saveNow = arguments.length < 6 ? true : !!arguments[5]
704:   npi.data.pfmea.updCause(mi, ei, ci, f, v, saveNow)
705: }
706: npi.pfmea.pfUpdCauseAction = function(mi, ei, ci, f, v) {
707:   const saveNow = arguments.length < 6 ? true : !!arguments[5]
708:   npi.data.pfmea.updCauseAction(mi, ei, ci, f, v, saveNow)
709: }
710: npi.pfmea.pfImplementAction = function(mi, ei, ci) {
711:   const p = prog()
712:   const mode = p.pfmea[mi]; const ef = mode.effects[ei]; const ca = ef.causes[ci]
713:   const act = ca.action || {}
714:   if (!act.desc && !act.newOcc && !act.newDet) { showToast('Add an action and/or new scores before implementing.', 'warning'); return }
715:   const oldRpn = npi.pfmea.calcCauseRpn(ef.sev, ca.occ, ca.det)
716:   const newOcc = act.newOcc ? +act.newOcc : ca.occ
717:   const newDet = act.newDet ? +act.newDet : ca.det
718:   if (!confirm(`Implement action?\\n\\nThis will:\\n• Update OCC: ${ca.occ} → ${newOcc}\\n• Update DET: ${ca.det} → ${newDet}\\n• New RPN: ${(ef.sev || 1) * newOcc * newDet}\\n• Log old RPN (${oldRpn}) to history\\n• Clear the action fields`)) return
719: 
720:   if (typeof npi.data?.pfmea?.implementAction === 'function') {
721:     const result = npi.data.pfmea.implementAction(mi, ei, ci)
722:     if (!result.ok) return
723:     render()
724:     return
725:   }
726: 
727:   // Legacy fallback for isolated test loads where npi-data.js is not loaded.
728:   const newRpn = npi.pfmea.calcCauseRpn(ef.sev, newOcc, newDet)
729:   if (!ca.history) ca.history = []
730:   const histEntry = {
731:     rpn: oldRpn,
732:     newRpn,
733:     date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
734:     desc: act.taken || act.desc || 'Action implemented',
735:     oldOcc: ca.occ, oldDet: ca.det,
736:     newOcc, newDet,
737:     relatedEcrId: ca.action_related_ecr_id || null
738:   }
739:   ca.history.push(histEntry)
740:   ca.occ = newOcc
741:   ca.det = newDet
742:   ca.action = { desc: '', taken: '', owner: '', due: '', newOcc: '', newDet: '' }
743:   if (typeof npiRelSavePFMEACause === 'function') npiRelSavePFMEACause(ef.id, ca)
744:   if (typeof npiRelSavePFMEAHistory === 'function') npiRelSavePFMEAHistory(ca.id, histEntry)
745:   else if (typeof save === 'function') save()
746:   render()
747: }
748: npi.pfmea.pfDelCause = function(mi, ei, ci) { npi.data.pfmea.delCause(mi, ei, ci); render() }
749: npi.pfmea.pfRefreshRPN = function() {
750:   const card = Array.from(document.querySelectorAll('.card')).find(c => c.querySelector('.card-title')?.textContent?.includes('RPN Burndown'))
751:   if (!card) return
752:   const contentDiv = card.querySelector('div[style*="padding:14px 16px"]')
753:   if (!contentDiv) return
754:   contentDiv.innerHTML = renderRpnBurndown(false)
755: }
756: 
757: // Returns max RPN across all effects/causes of a failure mode row
758: npi.pfmea.calcRPN = function(mode) {
759:   let max = 0
760:   ;(mode.effects || []).forEach(ef => {
761:     ;(ef.causes || []).forEach(ca => {
762:       const rpn = (ef.sev || 1) * (ca.occ || 1) * (ca.det || 1)
763:       if (rpn > max) max = rpn
764:     })
765:   })
766:   return max
767: }
768: 
769: // ── Live DOM RPN / Forecast updates ──────────────────────────
770: npi.pfmea.pfRpnClass = function(rpn) { return rpn >= RPN_CRITICAL ? 'rpn-hi' : rpn >= RPN_HIGH ? 'rpn-md' : 'rpn-lo' }
771: 
772: npi.pfmea.rpnColor = function(rpn) {
773:   if (rpn <= 1)            return { bg: '#dcfce7', fg: '#166534' }
774:   if (rpn < 25)            return { bg: '#bbf7d0', fg: '#166534' }
775:   if (rpn < 50)            return { bg: '#fef9c3', fg: '#854d0e' }
776:   if (rpn < RPN_HIGH)      return { bg: '#fed7aa', fg: '#9a3412' }
777:   if (rpn < 150)           return { bg: '#fca5a5', fg: '#7f1d1d' }
778:   if (rpn < RPN_CRITICAL)  return { bg: '#f87171', fg: '#fff' }
779:   if (rpn < 300)           return { bg: '#ef4444', fg: '#fff' }
780:   return { bg: '#991b1b', fg: '#fff' }
781: }
782: 
783: npi.pfmea.pfLiveRPN = function(mi, ei, ci) {
784:   const p = prog()
785:   const mode = p.pfmea[mi]; if (!mode) return
786:   const ef = mode.effects[ei]; if (!ef) return
787:   const sev = ef.sev || 1
788:   const targets = ci === -1
789:     ? ef.causes.map((ca, idx) => ({ ca, idx }))
790:     : [{ ca: ef.causes[ci], idx: ci }]
791:   targets.forEach(({ ca, idx }) => {
792:     const rpn = sev * (ca.occ || 1) * (ca.det || 1)
793:     const el = document.getElementById(`rpn_${mi}_${ei}_${idx}`)
794:     if (el) { el.textContent = rpn; el.className = 'rpn ' + npi.pfmea.pfRpnClass(rpn) }
795:   })
796: }
797: 
798: npi.pfmea.pfLiveForecast = function(mi, ei, ci) {
799:   const p = prog()
800:   const ef = p.pfmea[mi].effects[ei]
801:   const ca = ef.causes[ci]
802:   const act = ca.action || {}
803:   const sev = ef.sev || 1
804:   const newOcc = act.newOcc ? +act.newOcc : (ca.occ || 1)
805:   const newDet = act.newDet ? +act.newDet : (ca.det || 1)
806:   const forecast = sev * newOcc * newDet
807:   const hasAction = !!(act.newOcc || act.newDet)
808:   const el = document.getElementById(`forecast_${mi}_${ei}_${ci}`)
809:   const wrap = document.getElementById(`forecast_wrap_${mi}_${ei}_${ci}`)
810:   if (el) {
811:     el.textContent = hasAction ? forecast : '—'
812:     el.className = 'rpn ' + (hasAction ? npi.pfmea.pfRpnClass(forecast) : 'rpn-lo')
813:   }
814:   if (wrap) wrap.style.opacity = hasAction ? '1' : '0'
815: }
816: 
817: // ── Feature 3: Validation warnings ───────────────────────────────────────────
818: npi.pfmea.pfValidateCause = function(ca, ef) {
819:   const warnings = []
820:   const sev = ef.sev || 1
821:   const occ = ca.occ || 1
822:   const det = ca.det || 1
823:   const rpn = sev * occ * det
824:   const act = ca.action || {}
825: 
826:   if (sev >= 9 && !act.desc) {
827:     warnings.push({ type: 'high-severity-no-action', message: 'SEV ≥ 9 without a recommended action', severity: 'critical' })
828:   }
829:   if (rpn >= 200 && !act.desc) {
830:     warnings.push({ type: 'critical-rpn-no-plan', message: 'RPN ≥ 200 without an action plan', severity: 'critical' })
831:   }
832:   if (occ >= 8 && !(ca.prevent || '').trim()) {
833:     warnings.push({ type: 'high-occ-no-prevention', message: 'OCC ≥ 8 without prevention controls', severity: 'warning' })
834:   }
835:   if (act.due && new Date(act.due).getTime() < Date.now()) {
836:     warnings.push({ type: 'overdue-action', message: 'Action is overdue', severity: 'warning' })
837:   }
838:   return warnings
839: }
840: 
841: npi.pfmea.pfShowWarnings = function(warningsJson) {
842:   let warnings = []
843:   try { warnings = JSON.parse(warningsJson) } catch (e) { return }
844:   const list = document.getElementById('pfmeaWarningList')
845:   if (list) {
846:     list.innerHTML = warnings.map(w =>
847:       `<li class="pf-warning-item pf-warning-item-${w.severity}">${esc(w.message)}</li>`
848:     ).join('')
849:   }
850:   if (typeof showModal === 'function') showModal('modalPfmeaWarnings')
851: }
852: 
853: // ── Feature 2: Special characteristic update ─────────────────────────────────
854: npi.pfmea.pfUpdSpecialChar = function(mi, ei, val) {
855:   npi.data.pfmea.updEffect(mi, ei, 'specialChar', val || null)
856: }
857: 
858: export const calcCauseRpn = npi.pfmea.calcCauseRpn
859: export const renderPFMEA = npi.pfmea.renderPFMEA
860: export const pfImplementAction = npi.pfmea.pfImplementAction

(End of file - total 860 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\npi-cp.js"
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\npi-cp.js</path>
<type>file</type>
<content>1: // ═══════════════════════════════════
2: // npi-cp.js — Control Plan tab rendering and UI actions
3: // Depends on: npi.js, npi-data.js
4: // ═══════════════════════════════════
5: 
6: import { prog } from '../../../../core/js/state.js'
7: import { calcRPN, esc, canEdit, emptyState, showToast } from '../../../../utils/js/helpers.js'
8: import { showGuide } from '../../../../utils/js/guide.js'
9: import { npi } from './npi-shared.js'
10: import { npiComponents } from './npi-components.js'
11: import { npiData } from './npi-data.js'
12: 
13: npi.cp.calcCauseRpn = function(sev, occ, det) {
14:   if (typeof calcRPN === 'function') return calcRPN({ sev, occ, det })
15:   return (sev || 1) * (occ || 1) * (det || 1)
16: }
17: 
18: npi.cp.render = function() {
19:   const p = prog()
20:   const cpCauseKeys = new Set(p.cp.map(r => r.pfmeaCauseId || r.pfmeaEffectId || r.pfmeaId))
21:   const miss = []
22:   p.pfmea.forEach(mode => {
23:     (mode.effects || []).forEach(ef => {
24:       (ef.causes || []).forEach(ca => { if (!cpCauseKeys.has(ca.id)) miss.push({ mode, ef, ca }) })
25:     })
26:   })
27: 
28:   const rows = p.cp.map((r, i) => {
29:     const fr = p.pfmea.find(f => f.id === r.pfmeaId)
30:     const ef = fr && r.pfmeaEffectId ? (fr.effects || []).find(e => e.id === r.pfmeaEffectId) : null
31:     const ca = ef && r.pfmeaCauseId ? (ef.causes || []).find(c => c.id === r.pfmeaCauseId) : null
32:     const step = fr ? p.pfd.find(s => s.id === fr.pfdId) : null
33:     const sl = step ? `${step.stepNum} – ${esc(step.op || '')}` : '—'
34:     const ctqs = (step ? step.ctqIds || [] : []).map(cid => {
35:       const ci = p.ctq.findIndex(c => c.id === cid)
36:       return ci >= 0 ? `<span class="tag tag-ctq" style="font-size:9px">C${ci + 1}</span>` : ''
37:     }).join('')
38:     const rpn = ca && ef ? npi.cp.calcCauseRpn(ef.sev, ca.occ, ca.det) : 0
39:     const rpnBadge = rpn ? npiComponents.rpnBadge(rpn) : ''
40: 
41:     return `<tr><td class="w100"><span class="tag tag-step" style="font-size:10px">${sl}</span></td>
42:       <td class="w140" style="font-size:11px;color:var(--mid)">${fr ? esc(fr.mode || '—') : '—'}${ef ? `<span style="color:var(--muted)"> → ${esc(ef.effect || '')}</span>` : ''}${ca ? `<div style="font-size:10px;color:var(--muted);margin-top:1px">Cause: ${esc(ca.cause || '')}</div>` : ''}${rpnBadge ? ` ${rpnBadge}` : ''}</td>
43:       <td><input class="cell-edit" name="cp_${i}_char" value="${esc(r.char)}" data-action="cp-upd" data-idx="${i}" data-field="char" placeholder="Characteristic"></td>
44:       <td class="w80"><select class="cell-edit" name="cp_${i}_type" data-action="cp-upd" data-idx="${i}" data-field="type">${['Product', 'Process', 'Dimensional', 'Functional', 'Visual'].map(o => `<option${r.type === o ? ' selected' : ''}>${o}</option>`).join('')}</select></td>
45:       <td class="w110"><input class="cell-edit mono" name="cp_${i}_spec" value="${esc(r.spec)}" data-action="cp-upd" data-idx="${i}" data-field="spec" placeholder="Spec"></td>
46:       <td class="w110"><input class="cell-edit" name="cp_${i}_method" value="${esc(r.method)}" data-action="cp-upd" data-idx="${i}" data-field="method" placeholder="Method"></td>
47:       <td class="w60"><input class="cell-edit" name="cp_${i}_freq" value="${esc(r.freq)}" data-action="cp-upd" data-idx="${i}" data-field="freq" placeholder="100%"></td>
48:       <td class="w70"><input class="cell-edit" name="cp_${i}_resp" value="${esc(r.resp)}" data-action="cp-upd" data-idx="${i}" data-field="resp" placeholder="Who"></td>
49:       <td><textarea class="cell-edit" name="cp_${i}_reaction" rows="1" data-action="cp-upd" data-idx="${i}" data-field="reaction" data-autoresize placeholder="Reaction plan">${esc(r.reaction)}</textarea></td>
50:       <td class="w50"><div style="display:flex;flex-wrap:wrap;gap:2px">${ctqs || '—'}</div></td>
51:       <td class="w28 ctr">${canEdit() ? `<button class="del-btn" data-action="cp-del" data-idx="${i}">×</button>` : ''}</td></tr>`
52:   }).join('')
53: 
54:   const syncBanner = miss.length > 0
55:     ? `<div style="background:var(--amber-pale);border:1px solid var(--amber-mid);border-radius:6px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px"><span style="font-size:13px;color:var(--amber)">⚠ ${miss.length} PFMEA effect${miss.length !== 1 ? 's' : ''} not in control plan.</span><button class="btn btn-sm" style="background:var(--amber);color:white;border:none" data-action="cp-sync">Auto-populate from PFMEA</button></div>`
56:     : ''
57: 
58:   return `<div class="sec-head"><div><div class="sec-eyebrow">Step 04</div><div class="sec-title">Control Plan</div><div class="sec-desc">Linked to PFMEA and PFD. Step numbers and CTQs carry through automatically.</div></div>
59:   <div class="sec-actions"><button class="btn btn-ghost btn-sm" onclick="showGuide('npi-cp')" title="User Guide">❓ Guide</button>${canEdit() ? `<button class="btn btn-ghost btn-sm" data-action="cp-sync">Sync from PFMEA</button><button class="btn btn-primary btn-sm" data-action="cp-add">＋ Add Row</button>` : ''}</div></div>
60:   ${syncBanner}
61:   <div class="card" style="overflow-x:auto">
62:   <div class="card-head"><span class="card-title">Control Plan</span><span class="card-meta">${p.cp.length} characteristics</span></div>
63:    ${p.cp.length === 0 ? emptyState('📊', 'No entries yet', miss.length > 0 ? 'Use "Sync from PFMEA" to auto-populate' : 'Complete PFMEA first') : `<div class="sticky-table-wrap"><table class="tbl" style="min-width:1100px">${npiComponents.tableHeader([{label:'Step'},{label:'FMEA/RPN'},{label:'Characteristic'},{label:'Type'},{label:'Spec'},{label:'Method'},{label:'Freq'},{label:'Resp'},{label:'Reaction Plan'},{label:'CTQs'},{label:''}])}<tbody>${rows}</tbody></table></div>`}
64:   ${canEdit() ? `<button class="add-row" data-action="cp-add">＋ Add Row</button>` : ''}</div>`
65: }
66: 
67: npi.cp.syncFromPFMEA = function() { npiData.cp.syncFromPFMEA() }
68: npi.cp.add = function() { npiData.cp.add() }
69: npi.cp.upd = function(i, f, v) { npiData.cp.upd(i, f, v) }
70: npi.cp.del = function(i) { npiData.cp.del(i) }
71: 
72: export const npiCp = npi.cp
73: export const renderCp = npi.cp.render
74: export const syncCpFromPfmea = npi.cp.syncFromPFMEA
75: export const addCp = npi.cp.add
76: export const updateCp = npi.cp.upd
77: export const deleteCp = npi.cp.del

(End of file - total 77 lines)
</content>
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 8.8s)

_Thinking:_

Now I have a good understanding of the APQP codebase. Let me also read the key connecting files - npi-shared.js, npi-constants.js, npi-data.js, and npi-events.js to understand the full picture.

Let me read the remaining connecting files to complete the review context.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\npi-shared.js"
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\npi-shared.js</path>
<type>file</type>
<content>1: // ═══════════════════════════════════
2: // npi-shared.js — Shared NPI namespace access
3: // Provides a stable module import for NPI feature files.
4: // ═══════════════════════════════════
5: 
6: const root = globalThis
7: if (!Object.prototype.hasOwnProperty.call(root, 'npi')) {
8:   Object.defineProperty(root, 'npi', {
9:     value: {},
10:     writable: true,
11:     configurable: true
12:   })
13: }
14: 
15: const npi = root.npi
16: npi.nav = npi.nav || {}
17: npi.data = npi.data || {}
18: npi.components = npi.components || {}
19: npi.ctq = npi.ctq || {}
20: npi.pfd = npi.pfd || {}
21: npi.cp = npi.cp || {}
22: npi.gate = npi.gate || {}
23: npi.tracker = npi.tracker || {}
24: npi.bom = npi.bom || {}
25: npi.timing = npi.timing || {}
26: npi.pfmea = npi.pfmea || {}
27: npi.apqp = npi.apqp || {}
28: npi.docs = npi.docs || {}
29: npi.dashboard = npi.dashboard || {}
30: npi.events = npi.events || {}
31: npi._subs = npi._subs || {}
32: 
33: export { npi }

(End of file - total 33 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\npi-constants.js"
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\npi-constants.js</path>
<type>file</type>
<content>1: // ═══════════════════════════════════
2: // npi-constants.js — Shared NPI constants
3: // ═══════════════════════════════════
4: 
5: import { BOM_TYPES } from '../../../../core/js/state.js'
6: 
7: // ── RPN Thresholds ────────────────────────────────────────────
8: // Used in pfmea.js and dashboard.js for badge colouring and alerts
9: export const RPN_CRITICAL = 200 // rpn-hi class (red)
10: export const RPN_HIGH = 100 // rpn-md class (amber)  — the "high RPN" alert threshold
11: export const PFMEA_SCORE_MIN = 1
12: export const PFMEA_SCORE_MAX = 10
13: 
14: // ── APQP Tab Keys ─────────────────────────────────────────────
15: export const APQP_TABS = { CTQ: 'ctq', PFD: 'pfd', PFMEA: 'pfmea', CP: 'cp' }
16: 
17: // ── BOM Sub-Tab Keys ──────────────────────────────────────────
18: // Mirrors the keys of BOM_TYPES in state.js plus 'tree' and 'aaw_repair'
19: export const BOM_TABS = [...Object.keys(BOM_TYPES), 'tree', 'aaw_repair']
20: 
21: // ── Gantt Chart Configuration ──────────────────────────────────
22: // Used in timing.js for project timeline visualization
23: export const GANTT_WEEKS = 72 // 18 months
24: export const GANTT_ROLES = ['ME', 'PM', 'Tec', 'QA', 'Log']
25: export const GANTT_SECTIONS = [
26:   { id: 's0', label: 'G0 — Pre-Planning', color: '#6b7a99' },
27:   { id: 's1', label: 'G1 — Plan & Define', color: '#0066cc' },
28:   { id: 's2', label: 'G2 — Product Design', color: '#6d3fa0' },
29:   { id: 's3', label: 'G3 — Process Design', color: '#0a7566' },
30:   { id: 's4', label: 'G4 — Validation', color: '#b45309' },
31:   { id: 's5', label: 'G5 — Feedback & CI', color: '#1a7a3c' }
32: ]
33: export const PLAN_COLOR = '#16a34a' // green — planned
34: export const ACT_COLOR = '#d97706' // orange — actual
35: 
36: // ── Special Characteristics ────────────────────────────────────
37: // Used in PFMEA for safety/critical/major classification (AIAG-VDA Step 3)
38: export const SPECIAL_CHARS = {
39:   SAFETY:   { id: 'safety',   label: 'Safety',   symbol: '🦺', color: 'var(--red)' },
40:   CRITICAL: { id: 'critical', label: 'Critical', symbol: '❗', color: 'var(--amber)' },
41:   MAJOR:    { id: 'major',    label: 'Major',    symbol: '⚠️', color: 'var(--blue)' }
42: }

(End of file - total 42 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\npi-events.js"
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\npi-events.js</path>
<type>file</type>
<content>1: // ═══════════════════════════════════
2: // npi-events.js — Delegated UI event router for NPI portal
3: // ═══════════════════════════════════
4: 
5: import { preserveInputCaretAfterRender, buildOwnerLookup } from '../../../../utils/js/helpers.js'
6: import { showGuide } from '../../../../utils/js/guide.js'
7: import { flushDeferred } from '../../../../utils/js/render-scheduler.js'
8: import { appState } from '../../../../core/js/state.js'
9: 
10: let _npiEventsContainer = null
11: let _pfmeaSearchTimer = null
12: let _bomPickSearchTimer = null
13: let npiRef = null
14: 
15: function getNpi() {
16:   return npiRef
17: }
18: 
19: function npiActionTarget(evt) {
20:   return evt && evt.target ? evt.target.closest('[data-action]') : null
21: }
22: 
23: function npiNum(v, fallback) {
24:   const n = parseInt(v, 10)
25:   return Number.isFinite(n) ? n : fallback
26: }
27: 
28: function onClick(evt) {
29:   const npi = getNpi()
30:   if (!npi) return
31:   const el = npiActionTarget(evt)
32:   if (!el) return
33:   const action = el.getAttribute('data-action')
34: 
35:   switch (action) {
36:   case 'ctq-add': npi.ctq.add(); break
37:   case 'ctq-del': npi.ctq.del(npiNum(el.getAttribute('data-idx'), -1)); break
38:   case 'ctq-filter-clear': evt.preventDefault(); npi.ctq.clearFilters(); break
39: 
40:   case 'cp-sync': npi.cp.syncFromPFMEA(); break
41:   case 'cp-add': npi.cp.add(); break
42:   case 'cp-del': npi.cp.del(npiNum(el.getAttribute('data-idx'), -1)); break
43: 
44:   case 'pfd-add-main': npi.pfd.addMainStep(); break
45:   case 'pfd-open-insert': npi.pfd.openInsert(el.getAttribute('data-after') === '' ? null : npiNum(el.getAttribute('data-after'), null)); break
46:   case 'pfd-add-header-after': npi.pfd.addHeaderAfter(el.getAttribute('data-after-id')); break
47:   case 'pfd-confirm-insert': npi.pfd.confirmInsert(); break
48:   case 'pfd-del': npi.pfd.del(el.getAttribute('data-id')); break
49:   case 'pfd-scroll': npi.pfd.scrollTo(el.getAttribute('data-id')); break
50:   case 'pfd-toggle-group': npi.pfd.toggleGroup(el.getAttribute('data-key')); break
51:   case 'pfd-open-ctq-pick': npi.pfd.openCtqPick(npiNum(el.getAttribute('data-idx'), -1)); break
52:   case 'pfd-save-ctq-pick': npi.pfd.saveCtqPick(); break
53:   case 'pfd-open-bom-pick': npi.pfd.openBomPick(el.getAttribute('data-id')); break
54:   case 'pfd-save-bom-pick': npi.pfd.saveBomPick(); break
55:   case 'pfd-open-resource-edit': npi.pfd.openResourceEdit(el.getAttribute('data-step-id'), el.getAttribute('data-bom-type'), el.getAttribute('data-item-id')); break
56:   case 'pfd-set-bom-filter': npi.pfd.setBomFilter(el.getAttribute('data-filter'), el.getAttribute('data-filter-id'), el.getAttribute('data-list-id')); break
57:   case 'pfd-toggle-bom-pick': npi.pfd.toggleBomPick(el.getAttribute('data-key'), el.closest('.bom-pick-item')); break
58:   case 'pfd-open-doc-pick': npi.pfd.openDocPick(npiNum(el.getAttribute('data-idx'), -1)); break
59:   case 'pfd-save-doc-pick': npi.pfd.saveDocPick(); break
60:   case 'pfd-del-doc-ref': npi.pfd.delDocRef(el.getAttribute('data-step-id'), el.getAttribute('data-doc-id')); break
61:   case 'pfd-toggle-view': npi.pfd.toggleView(); break
62:   case 'pfd-toggle-layout': npi.pfd.toggleLayout(); break
63: 
64:   case 'pfmea-add-mode': npi.pfmea.pfAddMode(el.getAttribute('data-step-id')); break
65:   case 'pfmea-add-effect': npi.pfmea.pfAddEffect(npiNum(el.getAttribute('data-mi'), -1)); break
66:   case 'pfmea-del-mode': npi.pfmea.pfDelMode(npiNum(el.getAttribute('data-mi'), -1)); break
67:   case 'pfmea-add-cause': npi.pfmea.pfAddCause(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1)); break
68:   case 'pfmea-del-effect': npi.pfmea.pfDelEffect(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1)); break
69:   case 'pfmea-del-cause': npi.pfmea.pfDelCause(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), npiNum(el.getAttribute('data-ci'), -1)); break
70:   case 'pfmea-set-view': npi.pfmea.setView(el.getAttribute('data-view')); break
71:   case 'pfmea-set-col-view': npi.pfmea.setColumnView(el.getAttribute('data-col-view')); break
72:   case 'pfmea-show-hist': npi.pfmea.pfShowHist(evt, el.getAttribute('data-cause-id')); break
73:   case 'pfmea-show-warnings': npi.pfmea.pfShowWarnings(el.getAttribute('data-warnings')); break
74:   case 'pfmea-show-severity': if (typeof showModal === 'function') showModal('modalPfmeaSeverity'); break
75:   case 'pfmea-show-occurrence': if (typeof showModal === 'function') showModal('modalPfmeaOccurrence'); break
76:   case 'pfmea-show-detection': if (typeof showModal === 'function') showModal('modalPfmeaDetection'); break
77:   case 'pfmea-implement': npi.pfmea.pfImplementAction(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), npiNum(el.getAttribute('data-ci'), -1)); break
78:   case 'pfmea-filter-all': evt.preventDefault(); npi.pfmea.setRpnFilter('all'); break
79:   case 'pfmea-clear-extra-filters': npi.pfmea.pfClearExtraFilters(); break
80:   case 'pfmea-toggle-expand': npi.pfmea.toggleExpand(); break
81:   case 'gantt-toggle-expand': npi.timing.toggleExpand(); break
82:   case 'ctq-toggle-expand': npi.ctq.toggleExpand(); break
83:   case 'pfd-toggle-expand': npi.pfd.toggleExpand(); break
84: 
85:   case 'gate-sign': npi.gate.signOff(npiNum(el.getAttribute('data-gi'), -1), npiNum(el.getAttribute('data-si'), -1)); break
86:   case 'gate-unsign': npi.gate.unsign(npiNum(el.getAttribute('data-gi'), -1), npiNum(el.getAttribute('data-si'), -1)); break
87: 
88:   case 'tracker-add-action': npi.tracker.addAction(); break
89:   case 'tracker-del-action': npi.tracker.delAction(npiNum(el.getAttribute('data-idx'), -1)); break
90:   case 'tracker-add-risk': npi.tracker.addRisk(); break
91:   case 'tracker-del-risk': npi.tracker.delRisk(npiNum(el.getAttribute('data-idx'), -1)); break
92: 
93:   case 'bom-set-tab': npi.bom.setBomTab(el.getAttribute('data-tab')); break
94:   case 'bom-register-set-view': npi.bom.setPartsRegisterView(el.getAttribute('data-view')); break
95:   case 'bom-add-row': npi.bom.addBomRow(el.getAttribute('data-type')); break
96:   case 'bom-del-row': npi.bom.delBom(el.getAttribute('data-type'), npiNum(el.getAttribute('data-idx'), -1)); break
97:   case 'bom-tree-toggle': npi.bom.toggleTreeNode(el.getAttribute('data-id')); break
98:   case 'bom-tree-add-part': npi.bom.openTreeAddPart(el.getAttribute('data-parent') || null); break
99:   case 'bom-tree-add-subasm': npi.bom.openTreeAddSubAsm(el.getAttribute('data-parent') || null); break
100:   case 'bom-tree-del-node': npi.bom.delTreeNode(el.getAttribute('data-id')); break
101:   case 'bom-open-abc-pick': npi.bom.openABCPick(); break
102:   case 'bom-abc-filter': npi.bom.setAbcFilter(el.getAttribute('data-cls')); break
103:   case 'bom-abc-info': npi.bom.showAbcInfo(); break
104:   case 'bom-import-abc': npi.bom.importABCPart(npiNum(el.getAttribute('data-idx'), -1)); break
105: 
106:   case 'bom-aaw-add-group': npi.bom.addAawGroup(); break
107:   case 'bom-aaw-del-group': npi.bom.delAawGroup(el.getAttribute('data-id')); break
108:   case 'bom-aaw-tree-toggle': npi.bom.toggleAawTreeNode(el.getAttribute('data-id')); break
109:   case 'bom-aaw-tree-add-part': npi.bom.openAawAddPart(el.getAttribute('data-group'), el.getAttribute('data-parent') || null); break
110:   case 'bom-aaw-tree-add-subasm': npi.bom.openAawAddSubAsm(el.getAttribute('data-group'), el.getAttribute('data-parent') || null); break
111:   case 'bom-aaw-tree-del-node': npi.bom.delAawTreeNode(el.getAttribute('data-id'), el.getAttribute('data-group')); break
112: 
113:   case 'gantt-toggle-month': npi.timing.toggleMonth(npiNum(el.getAttribute('data-mi'), -1)); break
114:   case 'gantt-toggle-plan': npi.timing.ganttTogglePlan(el.getAttribute('data-id'), npiNum(el.getAttribute('data-wi'), -1)); break
115:   case 'gantt-toggle-act': npi.timing.ganttToggleAct(el.getAttribute('data-id'), npiNum(el.getAttribute('data-wi'), -1)); break
116:   case 'gantt-add-row': npi.timing.ganttAddRow(el.getAttribute('data-sec')); break
117:   case 'gantt-del-row': npi.timing.ganttDelRow(el.getAttribute('data-id')); break
118:   case 'gantt-clear': npi.timing.ganttClear(); break
119: 
120:   case 'show-guide': {
121:     const key = el.getAttribute('data-guide')
122:     if (key) showGuide(key)
123:     break
124:   }
125: 
126:   case 'npi-go-home': npi.nav.goHome(); break
127:   case 'npi-navigate': npi.nav.navigate(el.getAttribute('data-target')); break
128:   case 'npi-set-apqp': evt.preventDefault(); npi.nav.setApqpTab(el.getAttribute('data-tab')); break
129: 
130:   case 'dash-open-project': npi.dashboard.openProjectOrRender(el.getAttribute('data-id')); break
131:   case 'dash-set-view': npi.dashboard.setProjectsViewMode(el.getAttribute('data-mode')); break
132:   case 'dash-set-status': npi.dashboard.setProjectsStatusFilter(el.getAttribute('data-status')); break
133:   case 'dash-clear-filters': npi.dashboard.clearProjectFilters(); break
134:   case 'dash-toggle-lane': npi.dashboard.toggleNpiLane(el.getAttribute('data-fam-id')); break
135: 
136:   default: break
137:   }
138: }
139: 
140: function onChange(evt) {
141:   const npi = getNpi()
142:   if (!npi) return
143:   const el = npiActionTarget(evt)
144:   if (!el) return
145:   const action = el.getAttribute('data-action')
146: 
147:   switch (action) {
148:   case 'ctq-upd': npi.ctq.upd(npiNum(el.getAttribute('data-idx'), -1), el.getAttribute('data-field'), el.type === 'checkbox' ? el.checked : el.value); break
149:   case 'ctq-filter-source': npi.ctq.setSourceFilter(el.value); break
150:   case 'ctq-filter-oos': npi.ctq.setOosFilter(el.value); break
151:   case 'ctq-filter-agreed': npi.ctq.setAgreedFilter(el.value); break
152:   case 'ctq-filter-coverage': npi.ctq.setCoverageFilter(el.value); break
153:   case 'cp-upd': npi.cp.upd(npiNum(el.getAttribute('data-idx'), -1), el.getAttribute('data-field'), el.value); break
154:   case 'pfd-upd': npi.pfd.upd(el.getAttribute('data-id'), el.getAttribute('data-field'), el.value); break
155:   case 'pfd-toggle-ctq-pick': npi.pfd.toggleCtqPick(el.getAttribute('data-id'), !!el.checked); break
156:   case 'pfd-toggle-doc-pick': npi.pfd.toggleDocPick(el.getAttribute('data-id'), !!el.checked); break
157: 
158:   case 'pfmea-upd-mode': npi.pfmea.pfUpdMode(npiNum(el.getAttribute('data-mi'), -1), el.getAttribute('data-field'), el.value); break
159:   case 'pfmea-upd-effect': npi.pfmea.pfUpdEffect(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), el.getAttribute('data-field'), el.value); break
160:   case 'pfmea-upd-cause': npi.pfmea.pfUpdCause(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), npiNum(el.getAttribute('data-ci'), -1), el.getAttribute('data-field'), el.value); break
161:   case 'pfmea-upd-cause-action': npi.pfmea.pfUpdCauseAction(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), npiNum(el.getAttribute('data-ci'), -1), el.getAttribute('data-field'), el.value); break
162:   case 'pfmea-filter': npi.pfmea.setRpnFilter(el.value); break
163:   case 'pfmea-special-char': npi.pfmea.pfUpdSpecialChar(npiNum(el.getAttribute('data-mi'), -1), npiNum(el.getAttribute('data-ei'), -1), el.value); break
164:   case 'pfmea-owner-filter': npi.pfmea.pfSetExtraFilter('owner', el.value || null); break
165:   case 'pfmea-overdue-filter': npi.pfmea.pfSetExtraFilter('overdueOnly', el.checked); break
166:   case 'pfmea-sc-filter': npi.pfmea.pfSetExtraFilter('specialChar', el.value || null); break
167: 
168:   case 'pfmea-score': {
169:     const mi = npiNum(el.getAttribute('data-mi'), -1)
170:     const ei = npiNum(el.getAttribute('data-ei'), -1)
171:     const ci = npiNum(el.getAttribute('data-ci'), -1)
172:     const kind = el.getAttribute('data-kind')
173:     const allowBlank = el.getAttribute('data-allow-blank') === '1'
174:     const v = npi.pfmea.pfScoreInput(el, allowBlank)
175: 
176:     if (kind === 'effect-sev') npi.pfmea.pfUpdEffect(mi, ei, 'sev', v)
177:     else if (kind === 'cause-occ') npi.pfmea.pfUpdCause(mi, ei, ci, 'occ', v)
178:     else if (kind === 'cause-det') npi.pfmea.pfUpdCause(mi, ei, ci, 'det', v)
179:     else if (kind === 'action-occ') npi.pfmea.pfUpdCauseAction(mi, ei, ci, 'newOcc', v)
180:     else if (kind === 'action-det') npi.pfmea.pfUpdCauseAction(mi, ei, ci, 'newDet', v)
181:     break
182:   }
183: 
184:   case 'gate-toggle': npi.gate.toggleCheck(npiNum(el.getAttribute('data-gi'), -1), npiNum(el.getAttribute('data-ii'), -1), !!el.checked); break
185:   case 'gate-upd-sig': npi.gate.updSig(npiNum(el.getAttribute('data-gi'), -1), npiNum(el.getAttribute('data-si'), -1), el.getAttribute('data-field'), el.value); break
186: 
187:   case 'action-upd': npi.tracker.updAction(npiNum(el.getAttribute('data-idx'), -1), el.getAttribute('data-field'), el.value); break
188:   case 'risk-upd': npi.tracker.updRisk(npiNum(el.getAttribute('data-idx'), -1), el.getAttribute('data-field'), el.value); break
189:   case 'risk-score': {
190:     const i = npiNum(el.getAttribute('data-idx'), -1)
191:     const field = el.getAttribute('data-field')
192:     const v = npi.tracker.riskScoreInput(el)
193:     npi.tracker.updRisk(i, field, v, false)
194:     npi.tracker.refreshRS(i)
195:     break
196:   }
197: 
198:   case 'bom-upd-row': {
199:     const type = el.getAttribute('data-type')
200:     const idx = npiNum(el.getAttribute('data-idx'), -1)
201:     const field = el.getAttribute('data-field')
202:     let value = el.type === 'checkbox' ? !!el.checked : el.value
203:     if (el.getAttribute('data-number') === '1') value = Number(value)
204:     if (el.getAttribute('data-nullable') === '1') value = value || null
205:     npi.bom.updBom(type, idx, field, value)
206:     break
207:   }
208:   case 'bom-tree-upd-qty': npi.bom.updTreeNodeQty(el.getAttribute('data-id'), el.value); break
209:   case 'bom-tree-upd-desc': npi.bom.updTreeNodeDesc(el.getAttribute('data-id'), el.value); break
210:   case 'bom-aaw-tree-upd-qty': npi.bom.updAawTreeNodeQty(el.getAttribute('data-id'), el.getAttribute('data-group'), el.value); break
211:   case 'bom-aaw-tree-upd-desc': npi.bom.updAawTreeNodeDesc(el.getAttribute('data-id'), el.getAttribute('data-group'), el.value); break
212:   case 'bom-aaw-upd-title': npi.data.bom.updAawGroupTitle(el.getAttribute('data-id'), el.value); break
213:   case 'bom-aaw-upd-pn': npi.data.bom.updAawGroupPn(el.getAttribute('data-id'), el.value); break
214:   case 'bom-aaw-upd-tag': {
215:     const id = el.getAttribute('data-id')
216:     const tag = el.getAttribute('data-tag')
217:     npi.data.bom.updAawGroupTag(id, tag)
218:     break
219:   }
220: 
221:   case 'gantt-upd-task': npi.timing.ganttUpdTask(el.getAttribute('data-id'), el.value); break
222:   case 'gantt-upd-sec': npi.timing.ganttUpdSec(el.getAttribute('data-id'), el.value); break
223:   case 'gantt-upd-role': npi.timing.ganttUpdRole(el.getAttribute('data-id'), el.value); break
224:   case 'gantt-upd-notes': npi.timing.ganttUpdNotes(el.getAttribute('data-id'), el.value); break
225:   case 'gantt-set-start': npi.timing.ganttSetStart(el.value); break
226: 
227:   case 'dash-family-filter': npi.dashboard.setProjectsFamilyFilter(el.value); break
228: 
229:   default: break
230:   }
231: }
232: 
233: function onInput(evt) {
234:   const npi = getNpi()
235:   if (!npi) return
236:   const el = npiActionTarget(evt)
237:   if (!el) return
238:   const action = el.getAttribute('data-action')
239: 
240:   switch (action) {
241:   case 'pfmea-text-search': {
242:     clearTimeout(_pfmeaSearchTimer)
243:     const searchInput = el
244:     const searchValue = el.value
245:     _pfmeaSearchTimer = setTimeout(() => {
246:       preserveInputCaretAfterRender(searchInput, () => {
247:         npi.pfmea.pfSetExtraFilter('searchText', searchValue)
248:       }, {
249:         replacementSelector: 'input[data-action="pfmea-text-search"]'
250:       })
251:     }, 300)
252:     break
253:   }
254: 
255:   case 'pfd-search-bom': {
256:     clearTimeout(_bomPickSearchTimer)
257:     const searchValue = el.value
258:     _bomPickSearchTimer = setTimeout(() => {
259:       npi.pfd.searchBomPick(searchValue)
260:     }, 200)
261:     break
262:   }
263: 
264:   // Searchable owner picker — resolve typed name to valid profile name
265:   case 'pfmea-owner-input': {
266:     const picker = el.closest('.pfmea-owner-picker')
267:     const hiddenInput = picker
268:       ? picker.querySelector('input[data-action="pfmea-upd-cause-action"]')
269:       : null
270:     if (!hiddenInput) break
271:     const typed = (el.value || '').trim()
272:     const normalized = typed.toLowerCase()
273:     const lookup = buildOwnerLookup()
274:     // Only save on exact match or explicit clear — ignore partial typing
275:     if (!normalized) {
276:       // Cleared the field — unassign owner
277:       if (hiddenInput.value === '') break
278:       hiddenInput.value = ''
279:       hiddenInput.dispatchEvent(new Event('change', { bubbles: true }))
280:     } else if (lookup.has(normalized)) {
281:       // Exact match — assign owner
282:       if (hiddenInput.value === typed) break
283:       hiddenInput.value = typed
284:       hiddenInput.dispatchEvent(new Event('change', { bubbles: true }))
285:     }
286:     break
287:   }
288: 
289:   case 'pfmea-score': {
290:     const mi = npiNum(el.getAttribute('data-mi'), -1)
291:     const ei = npiNum(el.getAttribute('data-ei'), -1)
292:     const ci = npiNum(el.getAttribute('data-ci'), -1)
293:     const kind = el.getAttribute('data-kind')
294:     const allowBlank = el.getAttribute('data-allow-blank') === '1'
295:     const fallbackAttr = el.getAttribute('data-fallback')
296:     const fallback = allowBlank ? '' : npiNum(fallbackAttr, 1)
297:     const v = npi.pfmea.pfScorePreview(el, allowBlank, fallback)
298: 
299:     if (kind === 'effect-sev') {
300:       npi.pfmea.pfUpdEffect(mi, ei, 'sev', v, false)
301:       npi.pfmea.pfLiveRPN(mi, ei, -1)
302:       npi.pfmea.pfRefreshRPN()
303:     } else if (kind === 'cause-occ') {
304:       npi.pfmea.pfUpdCause(mi, ei, ci, 'occ', v, false)
305:       npi.pfmea.pfLiveRPN(mi, ei, ci)
306:       npi.pfmea.pfRefreshRPN()
307:     } else if (kind === 'cause-det') {
308:       npi.pfmea.pfUpdCause(mi, ei, ci, 'det', v, false)
309:       npi.pfmea.pfLiveRPN(mi, ei, ci)
310:       npi.pfmea.pfRefreshRPN()
311:     } else if (kind === 'action-occ') {
312:       npi.pfmea.pfUpdCauseAction(mi, ei, ci, 'newOcc', v, false)
313:       npi.pfmea.pfLiveForecast(mi, ei, ci)
314:       npi.pfmea.pfRefreshRPN()
315:     } else if (kind === 'action-det') {
316:       npi.pfmea.pfUpdCauseAction(mi, ei, ci, 'newDet', v, false)
317:       npi.pfmea.pfLiveForecast(mi, ei, ci)
318:       npi.pfmea.pfRefreshRPN()
319:     }
320:     break
321:   }
322: 
323:   case 'risk-score': {
324:     const i = npiNum(el.getAttribute('data-idx'), -1)
325:     const field = el.getAttribute('data-field')
326:     const fallback = npiNum(el.getAttribute('data-fallback'), 1)
327:     const v = npi.tracker.riskScorePreview(el, fallback)
328:     npi.tracker.updRisk(i, field, v, false)
329:     npi.tracker.refreshRS(i, false)
330:     break
331:   }
332: 
333:   case 'dash-search': npi.dashboard.setProjectsSearchFromInput(el); break
334: 
335:   default: break
336:   }
337: }
338: 
339: function onFocusOut(evt) {
340:   const nextFocus = evt.relatedTarget
341:   if (nextFocus && nextFocus.closest('table')) return
342:   flushDeferred('npi')
343: }
344: 
345: // Close NPI fullscreen overlays when Esc is pressed
346: function onKeydown(evt) {
347:   if (evt.key !== 'Escape') return
348:   const npi = getNpi()
349:   if (!npi) return
350:   if (appState.pfmeaExpanded && typeof npi.pfmea?.toggleExpand === 'function') { npi.pfmea.toggleExpand(); return }
351:   if (appState.ganttExpanded && typeof npi.timing?.toggleExpand === 'function') { npi.timing.toggleExpand(); return }
352:   if (appState.ctqExpanded && typeof npi.ctq?.toggleExpand === 'function') { npi.ctq.toggleExpand(); return }
353:   if (appState.pfdExpanded && typeof npi.pfd?.toggleExpand === 'function') { npi.pfd.toggleExpand(); return }
354: }
355: 
356: export function setupNpiEvents() {
357:   // Bug fix: apqp section renders via renderSection() (no #npi-content), so fall back to #mainContent
358:   const container = document.getElementById('npi-content') || document.getElementById('mainContent')
359:   if (!container) return
360:   if (_npiEventsContainer === container) return
361:   if (_npiEventsContainer) teardownNpiEvents()
362: 
363:   document.addEventListener('click', onClick)
364:   document.addEventListener('change', onChange)
365:   document.addEventListener('input', onInput)
366:   document.addEventListener('keydown', onKeydown)
367:   container.addEventListener('focusout', onFocusOut)
368:   _npiEventsContainer = container
369: }
370: 
371: export function teardownNpiEvents() {
372:   if (!_npiEventsContainer) return
373:   document.removeEventListener('click', onClick)
374:   document.removeEventListener('change', onChange)
375:   document.removeEventListener('input', onInput)
376:   document.removeEventListener('keydown', onKeydown)
377:   _npiEventsContainer.removeEventListener('focusout', onFocusOut)
378:   _npiEventsContainer = null
379: }
380: 
381: export function initNpiEvents({ getNpi: getNpiFn } = {}) {
382:   npiRef = getNpiFn()
383:   if (!npiRef) return
384: 
385:   npiRef.events = npiRef.events || {}
386:   npiRef.events.setup = setupNpiEvents
387:   npiRef.events.teardown = teardownNpiEvents
388:   npiRef.events._onClick = onClick
389:   npiRef.events._onChange = onChange
390:   npiRef.events._onInput = onInput
391:   npiRef.events._onFocusOut = onFocusOut
392: }

(End of file - total 392 lines)
</content>
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 6.6s)

_Thinking:_

Now I have a comprehensive understanding of the APQP codebase. Let me dispatch a code-reviewer subagent to review these files. I need to create a comprehensive review.

Let me dispatch the code-reviewer subagent with the full context.

Now I have full context. Let me dispatch a code review of the APQP implementation.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\.cache\\kilo\\node_modules\\superpowers\\skills\\requesting-code-review\\code-reviewer.md"
}
```

**Output:**
```
<path>C:\Users\Tidyco\.cache\kilo\node_modules\superpowers\skills\requesting-code-review\code-reviewer.md</path>
<type>file</type>
<content>1: # Code Review Agent
2: 
3: You are reviewing code changes for production readiness.
4: 
5: **Your task:**
6: 1. Review {WHAT_WAS_IMPLEMENTED}
7: 2. Compare against {PLAN_OR_REQUIREMENTS}
8: 3. Check code quality, architecture, testing
9: 4. Categorize issues by severity
10: 5. Assess production readiness
11: 
12: ## What Was Implemented
13: 
14: {DESCRIPTION}
15: 
16: ## Requirements/Plan
17: 
18: {PLAN_REFERENCE}
19: 
20: ## Git Range to Review
21: 
22: **Base:** {BASE_SHA}
23: **Head:** {HEAD_SHA}
24: 
25: ```bash
26: git diff --stat {BASE_SHA}..{HEAD_SHA}
27: git diff {BASE_SHA}..{HEAD_SHA}
28: ```
29: 
30: ## Review Checklist
31: 
32: **Code Quality:**
33: - Clean separation of concerns?
34: - Proper error handling?
35: - Type safety (if applicable)?
36: - DRY principle followed?
37: - Edge cases handled?
38: 
39: **Architecture:**
40: - Sound design decisions?
41: - Scalability considerations?
42: - Performance implications?
43: - Security concerns?
44: 
45: **Testing:**
46: - Tests actually test logic (not mocks)?
47: - Edge cases covered?
48: - Integration tests where needed?
49: - All tests passing?
50: 
51: **Requirements:**
52: - All plan requirements met?
53: - Implementation matches spec?
54: - No scope creep?
55: - Breaking changes documented?
56: 
57: **Production Readiness:**
58: - Migration strategy (if schema changes)?
59: - Backward compatibility considered?
60: - Documentation complete?
61: - No obvious bugs?
62: 
63: ## Output Format
64: 
65: ### Strengths
66: [What's well done? Be specific.]
67: 
68: ### Issues
69: 
70: #### Critical (Must Fix)
71: [Bugs, security issues, data loss risks, broken functionality]
72: 
73: #### Important (Should Fix)
74: [Architecture problems, missing features, poor error handling, test gaps]
75: 
76: #### Minor (Nice to Have)
77: [Code style, optimization opportunities, documentation improvements]
78: 
79: **For each issue:**
80: - File:line reference
81: - What's wrong
82: - Why it matters
83: - How to fix (if not obvious)
84: 
85: ### Recommendations
86: [Improvements for code quality, architecture, or process]
87: 
88: ### Assessment
89: 
90: **Ready to merge?** [Yes/No/With fixes]
91: 
92: **Reasoning:** [Technical assessment in 1-2 sentences]
93: 
94: ## Critical Rules
95: 
96: **DO:**
97: - Categorize by actual severity (not everything is Critical)
98: - Be specific (file:line, not vague)
99: - Explain WHY issues matter
100: - Acknowledge strengths
101: - Give clear verdict
102: 
103: **DON'T:**
104: - Say "looks good" without checking
105: - Mark nitpicks as Critical
106: - Give feedback on code you didn't review
107: - Be vague ("improve error handling")
108: - Avoid giving a clear verdict
109: 
110: ## Example Output
111: 
112: ```
113: ### Strengths
114: - Clean database schema with proper migrations (db.ts:15-42)
115: - Comprehensive test coverage (18 tests, all edge cases)
116: - Good error handling with fallbacks (summarizer.ts:85-92)
117: 
118: ### Issues
119: 
120: #### Important
121: 1. **Missing help text in CLI wrapper**
122:    - File: index-conversations:1-31
123:    - Issue: No --help flag, users won't discover --concurrency
124:    - Fix: Add --help case with usage examples
125: 
126: 2. **Date validation missing**
127:    - File: search.ts:25-27
128:    - Issue: Invalid dates silently return no results
129:    - Fix: Validate ISO format, throw error with example
130: 
131: #### Minor
132: 1. **Progress indicators**
133:    - File: indexer.ts:130
134:    - Issue: No "X of Y" counter for long operations
135:    - Impact: Users don't know how long to wait
136: 
137: ### Recommendations
138: - Add progress reporting for user experience
139: - Consider config file for excluded projects (portability)
140: 
141: ### Assessment
142: 
143: **Ready to merge: With fixes**
144: 
145: **Reasoning:** Core implementation is solid with good architecture and tests. Important issues (help text, date validation) are easily fixed and don't affect core functionality.
146: ```

(End of file - total 146 lines)
</content>
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 270.6s)

_Thinking:_

Now I have the code-reviewer template. Let me dispatch a code-reviewer subagent to review the APQP implementation. Since there are no recent changes to review (no git diff), I'll review the current state of the codebase.

Let me dispatch the subagent with the appropriate context.

**Tool: task**

**Input:**
```json
{
  "description": "Review APQP codebase",
  "prompt": "You are reviewing the APQP module and its connecting pages for production readiness.\n\n## What Was Implemented\n\nAPQP (Advanced Product Quality Planning) module with 4 interconnected tabs:\n1. CTQ Matrix (Critical-to-Quality requirements)\n2. Process Flow Diagram (PFD) with table and Mermaid flowchart views\n3. PFMEA (Process Failure Mode and Effects Analysis) with RPN scoring, history, and burndown\n4. Control Plan linked to PFMEA causes\n\n## Files to Review\n\nThe following files form the APQP module. Read each one and review them thoroughly:\n\n1. `portals/product-development/npi/js/apqp.js` (142 lines) - APQP tab dispatcher, backward-compat aliases\n2. `portals/product-development/npi/js/npi-ctq.js` (257 lines) - CTQ Matrix tab rendering and filters\n3. `portals/product-development/npi/js/npi-pfd.js` (885 lines) - PFD tab rendering, Mermaid flowchart, BOM/CTQ/Doc pickers\n4. `portals/product-development/npi/js/pfmea.js` (860 lines) - PFMEA render, mutations, RPN logic, history\n5. `portals/product-development/npi/js/npi-cp.js` (77 lines) - Control Plan tab rendering\n6. `portals/product-development/npi/js/npi-shared.js` (33 lines) - Shared NPI namespace\n7. `portals/product-development/npi/js/npi-constants.js` (42 lines) - Constants (RPN thresholds, APQP tabs)\n8. `portals/product-development/npi/js/npi-events.js` (392 lines) - Delegated event router\n\n## Architecture Context\n\n- Framework: Vanilla JavaScript SPA (no build pipeline)\n- Backend: Supabase (Auth, Postgres, Realtime)\n- ESM Only: Named imports/exports, no window.* bridge assignments\n- Global State: Mutable state in core/js/state.js\n- XSS Prevention: esc() helper for user data in HTML\n- Navigation: navigate() for route changes with realtime cleanup\n- Save Debouncing: 800-900ms debounce to Supabase\n\n## Data Flow Between Tabs\n\n```\nCTQ (requirements) → PFD (steps link to CTQs via ctqIds)\n                       ├── PFMEA (failure modes linked to PFD steps via pfdId)\n                       │     └── Control Plan (rows linked to PFMEA causes)\n                       └── BOM Resources (steps link to BOM items via bomRefs)\n```\n\n## Review Checklist\n\n**Code Quality:**\n- Clean separation of concerns?\n- Proper error handling?\n- DRY principle followed?\n- Edge cases handled?\n- XSS prevention via esc()?\n\n**Architecture:**\n- Sound design decisions?\n- Performance implications?\n- Security concerns?\n- Namespace pollution?\n\n**Cross-Tab Integrity:**\n- Are CTQ→PFD→PFMEA→CP links maintained correctly?\n- Coverage tracking accurate?\n- Sync from PFMEA to CP working?\n\n**Production Readiness:**\n- Backward compatibility (legacy fallbacks)?\n- No obvious bugs?\n- Event delegation clean?\n\n## Output Format\n\n### Strengths\n[What's well done? Be specific.]\n\n### Issues\n\n#### Critical (Must Fix)\n[Bugs, security issues, data loss risks, broken functionality]\n\n#### Important (Should Fix)\n[Architecture problems, missing features, poor error handling, test gaps]\n\n#### Minor (Nice to Have)\n[Code style, optimization opportunities, documentation improvements]\n\n**For each issue:**\n- File:line reference\n- What's wrong\n- Why it matters\n- How to fix (if not obvious)\n\n### Recommendations\n[Improvements for code quality, architecture, or process]\n\n### Assessment\n\n**Ready for production?** [Yes/No/With fixes]\n\n**Reasoning:** [Technical assessment in 1-2 sentences]",
  "subagent_type": "general"
}
```

**Output:**
```
task_id: ses_2b5997c7bffelTaum2LD5t30bG (for resuming to continue this task if needed)

<task_result>
Now I have a comprehensive understanding of the codebase. Here is the full review.

---

## APQP Module — Production Readiness Review

### Strengths

1. **XSS Prevention** — Consistent use of `esc()` for all user-generated content rendered into HTML strings (`helpers.js:304`). The function safely handles null/undefined via `s == null ? '' : s`.

2. **Event Delegation Architecture** — `npi-events.js` uses a single delegated event listener on `document` rather than per-element handlers. This is memory-efficient and survives re-renders without re-attaching listeners.

3. **CTQ Coverage Tracking** — The CTQ→PFD→PFMEA linkage is well-designed. Coverage stats (`npi-ctq.js:21-24`) compute PFD and PFMEA reference counts, enabling the "orphaned CTQ" filter that helps users find unlinked requirements.

4. **PFMEA History System** — `pfmea.js:55-97` collects and sorts history entries with date-based ordering. The implement action flow (`pfmea.js:710-747`) correctly logs old RPN, old OCC/DET, and clears action fields atomically.

5. **PFMEA Validation Warnings** — `pfmea.js:818-839` catches four critical quality scenarios: high severity without action, critical RPN without plan, high occurrence without prevention, and overdue actions.

6. **RPN Live Preview** — `pfmea.js:783-815` updates RPN badges and forecast RPN in real-time as the user types scores, using DOM manipulation without full re-render.

7. **Mermaid Flowchart** — `npi-pfd.js:260-388` generates proper Mermaid syntax with section subgraphs, typed node shapes (decision diamonds, inspection double-circles), and high-RPN risk borders.

8. **Debounced Saves** — The 800-900ms debounce on Supabase writes (per AGENTS.md) prevents excessive API calls during rapid editing.

9. **Backward Compatibility** — `apqp.js:46-139` provides compatibility aliases for inline `onclick` handlers, with safe `typeof` guards.

10. **Fullscreen Overlays** — CTQ, PFD, and PFMEA all support fullscreen mode with consistent Escape key handling (`npi-events.js:346-354`).

---

### Issues

#### Critical (Must Fix)

**1. Undefined `npi.pfmea.calcRPN` at render time if pfmea.js hasn't initialized**

- File: `apqp.js:23`
- `npi.pfmea.calcRPN` is called in `renderAPQP()` but is defined in `pfmea.js:758` as a side-effect import. If `renderAPQP()` is called before the ESM module graph completes evaluation of `pfmea.js`, `npi.pfmea.calcRPN` will be `undefined` and the `.filter()` callback will throw.
- Why it matters: This is the tab badge calculation — a crash here would blank the entire APQP view.
- Fix: Add a guard: `const calc = typeof npi.pfmea.calcRPN === 'function' ? npi.pfmea.calcRPN : () => 0` or move the high-RPN badge computation into a lazy getter.

**2. `p.pfmea` may be undefined in `renderAPQP`**

- File: `apqp.js:23`
- `p.pfmea.filter(...)` is called without a null guard. If `prog()` returns an object where `pfmea` hasn't been initialized to `[]`, this throws.
- Why it matters: Same as above — blanks the entire APQP view.
- Fix: `const highRPN = (p.pfmea || []).filter(...)` — other files like `npi-pfd.js:59` already use this pattern.

**3. `p.pfd` / `p.ctq` / `p.cp` may be undefined in `renderAPQP`**

- File: `apqp.js:26-28`
- `p.pfd.filter(...)`, `p.cp.length`, `p.ctq.length` — none guarded with `|| []`.
- Fix: Wrap each with `(p.xxx || [])`.

#### Important (Should Fix)

**4. `showModal`/`closeModal` not imported but used without guard in pfmea.js**

- File: `pfmea.js:618` (`showModal('modalInsert')`), `pfmea.js:626` (`closeModal('modalInsert')`)
- `showModal` IS imported at line 12, so it's available. However, in the modal-showing functions (`pfShowSeverity`, `pfShowOccurrence`, `pfShowDetection` at lines 634-654), there's a `typeof showModal === 'function'` fallback that sets `modal.style.display = 'flex'` directly — but `closeModal` is never used to undo this. If the `showModal` fallback path is taken, the corresponding `closeModal` calls (e.g., via the modal's close button) might not find the modal in the expected state.
- Fix: Use `showModal`/`closeModal` consistently or add a `closeModal` fallback for the manual `style.display` path.

**5. Massive DRY violations in filter URL-building**

- File: `npi-ctq.js:35-41`, `61-68`, `79-86`, `97-104`, `112-115`
- Five filter setter functions contain identical URL-building logic (8 lines each). Any change to URL parameters must be replicated in 5 places.
- Fix: Extract a `buildCtqUrl()` helper function.

**6. Massive DRY violations in PFMEA row HTML generation**

- File: `pfmea.js:381-497` and `467-517`
- The "effect with no causes" block (lines 467-497) duplicates the mode/effect cell rendering from the main loop (lines 384-418). The "mode with no effects" block (lines 500-518) duplicates it a third time.
- Fix: Extract `renderModeCell(mi, mode, vis)` and `renderEffectCell(mi, ei, ef, vis)` helper functions.

**7. `pfdMermaidLabel` doesn't escape `&` character**

- File: `npi-pfd.js:28-35`
- The function escapes `"` and replaces `{}`, `[]` but does NOT escape `&`. If an operation description contains `&`, Mermaid syntax will break.
- Fix: Add `.replace(/&/g, '&amp;')` before the other replacements.

**8. Legacy fallback uses undeclared globals**

- File: `apqp.js:104` — `npiRelSaveCP` is imported but `npiRelSavePFMEACause` and `npiRelSavePFMEAHistory` at `pfmea.js:743-744` are NOT imported. The `typeof` check prevents a crash, but the fallback path silently does nothing if these functions aren't globals.
- File: `apqp.js:105` — `save` IS imported, so the `else if` works. But in `pfmea.js:745`, `save` is imported and works.
- Fix: Remove dead legacy fallback code or import the relational functions properly.

**9. `npi.pfd.viewMode` variable name is misleading**

- File: `npi-pfd.js:396`
- `const showFlowchart = npi.pfd.viewMode === 'table'` — when viewMode is `'table'`, showFlowchart is TRUE. The variable name is inverted from what it means. This means the "Expand" button (line 402) only appears in table mode, which is correct, but the logic is confusing.
- Fix: Rename to `showTable` or invert the condition.

**10. `oninput` event for PFMEA scores fires on every keystroke but saves with `saveNow=false`**

- File: `npi-events.js:289-321`, `pfmea.js:696-708`
- The `onInput` handler calls `pfUpdEffect`/`pfUpdCause`/`pfUpdCauseAction` with `saveNow=false` (line 300, 304, 308, 312, 316). But the `onChange` handler (line 159-161) calls the same functions without the `saveNow` argument, defaulting to `true`. This is correct — the design defers saves until `change` fires (blur). However, there's no explicit flush on navigation away. If the user types a score then immediately clicks a different tab, the `focusout` handler (`npi-events.js:339-343`) calls `flushDeferred('npi')` — but only if the next focus target is NOT inside a table. This could lose data.
- Fix: Ensure `flushDeferred` is called on tab switch, not just on focusout.

#### Minor (Nice to Have)

**11. `npi-ctq.js` coverage stats computed twice per render**

- File: `npi-ctq.js:139-141` and `npi-ctq.js:144`
- `coverageStats` is computed once for the banner (lines 139-141), then `getCoverage()` is called AGAIN for each row in the `filteredIdx.map()` loop (line 144).
- Fix: Compute coverage once in the `filteredIdx` mapping and reuse.

**12. Inconsistent null-check style**

- File: `npi-ctq.js:28` uses `|| 'all'` fallback
- File: `pfmea.js:346` uses `(scKey ? ... : null)` conditional
- The codebase mixes `|| ''`, `|| []`, and explicit null checks inconsistently. Minor readability issue.

**13. `apqp.js:32` — Inline onclick with string interpolation for tab IDs**

- Tab navigation uses inline `onclick="npi.nav.setApqpTab('${t.id}')"` rather than `data-action` delegation. This is the only place in the APQP module that uses inline handlers instead of the delegated event system.
- Fix: Convert to `data-action="npi-set-apqp" data-tab="${t.id}"` for consistency.

**14. `pfmea.js:360` — JSON.stringify in HTML attribute**

- Warnings are serialized to JSON and placed in a `data-warnings` attribute: `data-warnings="${esc(JSON.stringify(warnings))}"`. If warnings contain characters that break attribute parsing after `esc()`, this could fail. The `esc()` function handles `"→&quot;` which is safe for HTML attributes, but complex nested JSON in attributes is fragile.
- Fix: Store warnings in a JS-side cache and reference by ID.

**15. Missing `showModal` import in `npi-pfd.js`**

- File: `npi-pfd.js:7` — `showModal` and `closeModal` are imported.
- This is fine — just noting that `npi-pfd.js` correctly imports them.

**16. `npi-pfd.js:130` — Truncated line**

- The `stepRowHTML` return statement at line 130 is a single line exceeding 2000 characters. This makes debugging and code review difficult.
- Fix: Break into multiple lines or extract sub-components.

---

### Recommendations

1. **Add unit tests** for RPN calculation, history collection, coverage tracking, and PFMEA validation. The AGENTS.md specifies Jest with jsdom — the codebase should have tests for `npi.pfmea.calcRPN`, `npi.pfmea.collectHistoryEntries`, `npi.pfmea.pfValidateCause`, and `npi.ctq.getCoverage`.

2. **Extract HTML generation helpers** — The inline HTML templates in `npi-pfd.js` and `pfmea.js` are hundreds of lines long. Extracting reusable components (e.g., `renderScoreInput()`, `renderModeCell()`, `renderStepRow()`) would reduce duplication and improve testability.

3. **Add error boundaries** — The event router (`npi-events.js`) has no try-catch around handler calls. A single thrown error in any handler will break the entire click/change/input dispatch.

4. **Document the module load order dependency** — `pfmea.js` depends on `npi-data.js` setting `npi.data = npiData` before pfmea.js's top-level code runs. This dependency is implicit and fragile. Consider having `pfmea.js` import `npiData` directly instead of relying on the global namespace.

5. **Consider TypeScript or JSDoc annotations** — The deeply nested PFMEA data structure (`mode.effects[].causes[].action.{newOcc,newDet}`) would benefit from type definitions to catch null-reference errors at development time.

---

### Assessment

**Ready for production?** Yes, with fixes to the 3 critical items.

**Reasoning:** The module is well-architected with clean separation of concerns, proper XSS prevention, and a solid event delegation system. However, the 3 critical null-safety issues in `apqp.js:23-28` (unguarded `.filter()` / `.length` calls on potentially undefined arrays) would cause a blank screen if any project data is incomplete, which is a common scenario in production. These are one-line fixes that should be applied before deployment.
</task_result>
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 190.4s)

_Thinking:_

The code review is complete. Let me present the results to the user in a clear summary format.

## APQP Module — Code Review Complete

The code-reviewer has completed a thorough review of the APQP module and its connecting pages. Here's the summary:

### Strengths
- Consistent XSS prevention via `esc()` across all user-rendered content
- Clean event delegation architecture (single listener on `document`)
- Well-designed CTQ→PFD→PFMEA→CP linkage with coverage tracking
- PFMEA history system with atomic RPN logging
- RPN live preview without full re-render
- Proper backward compatibility aliases with `typeof` guards

### Critical Issues (3)

1. **`apqp.js:23`** — `npi.pfmea.calcRPN` may be `undefined` if `pfmea.js` hasn't finished evaluating when `renderAPQP()` is called. Would blank the entire APQP view.

2. **`apqp.js:23`** — `p.pfmea.filter(...)` has no null guard. If `prog()` returns an object where `pfmea` isn't initialized to `[]`, this throws.

3. **`apqp.js:26-28`** — `p.pfd`, `p.ctq`, `p.cp` are all accessed without `|| []` guards.

### Important Issues (7)

4. Inconsistent `showModal`/`closeModal` fallback in PFMEA severity/occurrence/detection modals
5. DRY violations in CTQ filter URL-building (5 identical blocks)
6. DRY violations in PFMEA row HTML generation (3x duplicated mode/effect cell rendering)
7. `pfdMermaidLabel` doesn't escape `&` — breaks Mermaid syntax
8. Legacy fallback uses undeclared globals (`npiRelSavePFMEACause`, `npiRelSavePFMEAHistory`)
9. `showFlowchart` variable name is inverted from its meaning
10. Potential data loss on tab switch if scores typed but not saved

### Minor Issues (6)

11. CTQ coverage stats computed twice per render
12. Inconsistent null-check style across files
13. Tab navigation uses inline `onclick` instead of `data-action` delegation
14. JSON in HTML attributes for PFMEA warnings is fragile
15. 2000+ character single-line HTML in `npi-pfd.js:130`

### Assessment

**Ready for production: Yes, with fixes to the 3 critical items.**

The module is well-architected with clean separation, proper XSS prevention, and solid event delegation. The 3 critical null-safety issues in `apqp.js:23-28` are one-line fixes that should be applied before deployment — they would cause a blank screen if any project data is incomplete.

**Tool: question**

**Input:**
```json
{
  "questions": [
    {
      "question": "Would you like me to fix the 3 critical issues identified in the review?",
      "header": "Fix Critical Issues?",
      "options": [
        {
          "label": "Fix all 3 critical issues",
          "description": "Apply null guards to apqp.js:23-28 (pfmea, pfd, ctq, cp arrays and calcRPN function)"
        },
        {
          "label": "Fix critical + important",
          "description": "Fix the 3 critical issues plus the 7 important issues"
        },
        {
          "label": "No fixes needed now",
          "description": "Just wanted the review, will address issues later"
        }
      ]
    }
  ]
}
```

**Output:**
```
User has answered your questions: "Would you like me to fix the 3 critical issues identified in the review?"="fix critical then report back". You can now continue with the user's answers in mind.
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 9.7s)

_Thinking:_

The user wants me to fix the 3 critical issues and then report back. Let me fix them now.

Critical issues:
1. `apqp.js:23` — `npi.pfmea.calcRPN` may be `undefined` if `pfmea.js` hasn't finished evaluating
2. `apqp.js:23` — `p.pfmea.filter(...)` has no null guard
3. `apqp.js:26-28` — `p.pfd`, `p.ctq`, `p.cp` accessed without `|| []` guards

Let me fix all three in apqp.js.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Fix Critical #1: Guard npi.pfmea.calcRPN in renderAPQP()",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Fix Critical #2: Guard p.pfmea with || [] in renderAPQP()",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Fix Critical #3: Guard p.pfd, p.ctq, p.cp with || [] in renderAPQP()",
      "status": "pending",
      "priority": "high"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Fix Critical #1: Guard npi.pfmea.calcRPN in renderAPQP()",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Fix Critical #2: Guard p.pfmea with || [] in renderAPQP()",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Fix Critical #3: Guard p.pfd, p.ctq, p.cp with || [] in renderAPQP()",
    "status": "pending",
    "priority": "high"
  }
]
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 35.1s)

_Thinking:_

Let me fix all three critical issues in a single edit to apqp.js. They're all in the same renderAPQP function, so I can address them together.

Looking at the code:
```javascript
npi.apqp.renderAPQP = function() {
  const p = prog()
  const highRPN = p.pfmea.filter(r => npi.pfmea.calcRPN(r) >= RPN_HIGH).length
  const tabs = [
    { id: APQP_TABS.CTQ, label: 'CTQ Matrix', badge: p.ctq.length },
    { id: APQP_TABS.PFD, label: 'Process Flow', badge: p.pfd.filter(s => npiData.pfdType.isExecutable(s.type)).length },
    { id: APQP_TABS.PFMEA, label: 'PFMEA', badge: p.pfmea.length, warn: highRPN > 0 },
    { id: APQP_TABS.CP, label: 'Control Plan', badge: p.cp.length }
  ]
```

I need to:
1. Guard `npi.pfmea.calcRPN` - use a fallback function if it's not defined
2. Guard `p.pfmea` with `|| []`
3. Guard `p.ctq`, `p.pfd`, `p.cp` with `|| []`

Let me make a single edit to fix all of these.

Fixing all 3 critical issues in `apqp.js:21-29`. They're in the same block so I'll fix them together.

**Tool: edit**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\apqp.js",
  "oldString": "npi.apqp.renderAPQP = function() {\n  const p = prog()\n  const highRPN = p.pfmea.filter(r => npi.pfmea.calcRPN(r) >= RPN_HIGH).length\n  const tabs = [\n    { id: APQP_TABS.CTQ, label: 'CTQ Matrix', badge: p.ctq.length },\n    { id: APQP_TABS.PFD, label: 'Process Flow', badge: p.pfd.filter(s => npiData.pfdType.isExecutable(s.type)).length },\n    { id: APQP_TABS.PFMEA, label: 'PFMEA', badge: p.pfmea.length, warn: highRPN > 0 },\n    { id: APQP_TABS.CP, label: 'Control Plan', badge: p.cp.length }\n  ]",
  "newString": "npi.apqp.renderAPQP = function() {\n  const p = prog()\n  // Bug fix: Guard against undefined arrays and calcRPN if pfmea.js hasn't fully initialized\n  const pfmea = p.pfmea || []\n  const pfd = p.pfd || []\n  const ctq = p.ctq || []\n  const cp = p.cp || []\n  const calcRPN = typeof npi.pfmea.calcRPN === 'function' ? npi.pfmea.calcRPN : () => 0\n  const highRPN = pfmea.filter(r => calcRPN(r) >= RPN_HIGH).length\n  const tabs = [\n    { id: APQP_TABS.CTQ, label: 'CTQ Matrix', badge: ctq.length },\n    { id: APQP_TABS.PFD, label: 'Process Flow', badge: pfd.filter(s => npiData.pfdType.isExecutable(s.type)).length },\n    { id: APQP_TABS.PFMEA, label: 'PFMEA', badge: pfmea.length, warn: highRPN > 0 },\n    { id: APQP_TABS.CP, label: 'Control Plan', badge: cp.length }\n  ]"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 55.7s)

_Thinking:_

All 3 critical issues are fixed in a single edit. Let me update the todo list and report back.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Fix Critical #1: Guard npi.pfmea.calcRPN in renderAPQP()",
      "priority": "high",
      "status": "completed"
    },
    {
      "content": "Fix Critical #2: Guard p.pfmea with || [] in renderAPQP()",
      "priority": "high",
      "status": "completed"
    },
    {
      "content": "Fix Critical #3: Guard p.pfd, p.ctq, p.cp with || [] in renderAPQP()",
      "priority": "high",
      "status": "completed"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Fix Critical #1: Guard npi.pfmea.calcRPN in renderAPQP()",
    "priority": "high",
    "status": "completed"
  },
  {
    "content": "Fix Critical #2: Guard p.pfmea with || [] in renderAPQP()",
    "priority": "high",
    "status": "completed"
  },
  {
    "content": "Fix Critical #3: Guard p.pfd, p.ctq, p.cp with || [] in renderAPQP()",
    "priority": "high",
    "status": "completed"
  }
]
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 13.2s)

_Thinking:_

Let me verify the fix looks correct by reading the modified section.

Let me verify the fix looks correct.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\apqp.js",
  "offset": 21,
  "limit": 25
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\apqp.js</path>
<type>file</type>
<content>21: npi.apqp.renderAPQP = function() {
22:   const p = prog()
23:   // Bug fix: Guard against undefined arrays and calcRPN if pfmea.js hasn't fully initialized
24:   const pfmea = p.pfmea || []
25:   const pfd = p.pfd || []
26:   const ctq = p.ctq || []
27:   const cp = p.cp || []
28:   const calcRPN = typeof npi.pfmea.calcRPN === 'function' ? npi.pfmea.calcRPN : () => 0
29:   const highRPN = pfmea.filter(r => calcRPN(r) >= RPN_HIGH).length
30:   const tabs = [
31:     { id: APQP_TABS.CTQ, label: 'CTQ Matrix', badge: ctq.length },
32:     { id: APQP_TABS.PFD, label: 'Process Flow', badge: pfd.filter(s => npiData.pfdType.isExecutable(s.type)).length },
33:     { id: APQP_TABS.PFMEA, label: 'PFMEA', badge: pfmea.length, warn: highRPN > 0 },
34:     { id: APQP_TABS.CP, label: 'Control Plan', badge: cp.length }
35:   ]
36: 
37:   const tabNav = `<div class="apqp-tabs-shell">${
38:     tabs.map(t => `<button class="apqp-tab-btn ${appState.apqpTab === t.id ? 'active' : ''}" onclick="npi.nav.setApqpTab('${t.id}')">${t.label}${t.badge > 0 ? `<span class="apqp-tab-badge">(${t.badge})</span>` : ''}${t.warn ? `<span class="apqp-tab-warning">⚠</span>` : ''}</button>`).join('')
39:   }</div>`
40: 
41:   const inner = appState.apqpTab === APQP_TABS.CTQ ? npiCtq.render()
42:     : appState.apqpTab === APQP_TABS.PFD ? npiPfd.render()
43:     : appState.apqpTab === APQP_TABS.PFMEA ? npi.pfmea.renderPFMEA()
44:     : (typeof npi.cp?.render === 'function' ? npi.cp.render() : '')
45: 

(Showing lines 21-45 of 148. Use offset=46 to continue.)
</content>
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 39.5s)

_Thinking:_

The fix looks correct. Let me run the tests to make sure nothing is broken.

Let me run the tests to verify nothing is broken.

**Tool: bash**

**Input:**
```json
{
  "command": "npm test -- tests/apqp.test.js 2>&1",
  "description": "Run APQP test"
}
```

**Output:**
```

> tidyco-apqp@1.0.0 test
> node --experimental-vm-modules ./node_modules/jest/bin/jest.js tests/apqp.test.js

(node:9120) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
PASS tests/apqp.test.js
  APQP tab
    √ should have APQP module available (2 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        1.553 s
Ran all test suites matching tests/apqp.test.js.

```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 41.6s)

_Thinking:_

Tests pass. Let me also run the syntax check to make sure there are no issues.

Tests pass. Let me also run a syntax check.

**Tool: bash**

**Input:**
```json
{
  "command": "npm run check:syntax 2>&1",
  "description": "Run syntax validation"
}
```

**Output:**
```

> tidyco-apqp@1.0.0 check:syntax
> node scripts/syntax-validator.js


✓ Syntax Validator
════════════════════════════════════════

Scanning 129 JS files...

✅ No syntax errors found!


```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 44.5s)

_Thinking:_

All checks pass. Let me report back to the user.

All 3 critical issues fixed and verified. Here's the report:

## Fixes Applied — `apqp.js:21-35`

**What changed:** Added null guards to `renderAPQP()` to prevent blank-screen crashes when project data is incomplete.

```javascript
// Before (crashed if any array was undefined or calcRPN not yet loaded):
const highRPN = p.pfmea.filter(r => npi.pfmea.calcRPN(r) >= RPN_HIGH).length
// ...
badge: p.ctq.length
badge: p.pfd.filter(...)
badge: p.pfmea.length
badge: p.cp.length

// After (safe fallbacks):
const pfmea = p.pfmea || []
const pfd = p.pfd || []
const ctq = p.ctq || []
const cp = p.cp || []
const calcRPN = typeof npi.pfmea.calcRPN === 'function' ? npi.pfmea.calcRPN : () => 0
```

**Verification:**
- `npm test` — 1/1 passing
- `npm run check:syntax` — 0 errors across 129 JS files

The remaining 7 important and 6 minor issues from the review are documented above for future attention.

---

## User

fix important

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 12.1s)

_Thinking:_

The user wants me to fix the 7 important issues identified in the code review. Let me list them:

4. Inconsistent `showModal`/`closeModal` fallback in PFMEA severity/occurrence/detection modals
5. DRY violations in CTQ filter URL-building (5 identical blocks)
6. DRY violations in PFMEA row HTML generation (3x duplicated mode/effect cell rendering)
7. `pfdMermaidLabel` doesn't escape `&` — breaks Mermaid syntax
8. Legacy fallback uses undeclared globals (`npiRelSavePFMEACause`, `npiRelSavePFMEAHistory`)
9. `showFlowchart` variable name is inverted from its meaning


10. Potential data loss on tab switch if scores typed but not saved

Now I'll create a todo list and work through each one systematically.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Fix Important #4: Inconsistent showModal/closeModal fallback in PFMEA modals",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Fix Important #5: DRY violations in CTQ filter URL-building (extract helper)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Fix Important #6: DRY violations in PFMEA row HTML generation",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Fix Important #7: pfdMermaidLabel doesn't escape & character",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Fix Important #8: Legacy fallback uses undeclared globals in pfmea.js",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Fix Important #9: showFlowchart variable name is inverted",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Fix Important #10: Potential data loss on tab switch (flushDeferred)",
      "status": "pending",
      "priority": "high"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Fix Important #4: Inconsistent showModal/closeModal fallback in PFMEA modals",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Fix Important #5: DRY violations in CTQ filter URL-building (extract helper)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Fix Important #6: DRY violations in PFMEA row HTML generation",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Fix Important #7: pfdMermaidLabel doesn't escape & character",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Fix Important #8: Legacy fallback uses undeclared globals in pfmea.js",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Fix Important #9: showFlowchart variable name is inverted",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Fix Important #10: Potential data loss on tab switch (flushDeferred)",
    "status": "pending",
    "priority": "high"
  }
]
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 20.5s)

_Thinking:_

Let me start fixing these issues one by one. Let me begin with the easier ones first.

**Issue #7: pfdMermaidLabel doesn't escape &** - This is a quick fix.

**Issue #9: showFlowchart variable name is inverted** - Quick rename.

**Issue #4: Inconsistent showModal/closeModal** - Need to fix the fallback paths.

**Issue #5: DRY violations in CTQ filter URL-building** - Extract a helper function.

**Issue #6: DRY violations in PFMEA row HTML** - This is a big refactor, but I can extract the duplicated mode/effect cell rendering.

**Issue #8: Legacy fallback uses undeclared globals** - Remove or guard the dead code.

**Issue #10: Potential data loss on tab switch** - Need to ensure flushDeferred is called.


Now I'll tackle the straightforward fixes first before moving to the more complex refactoring work.

Starting with the quick fixes first, then the larger refactors.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Fix Important #4: Inconsistent showModal/closeModal fallback in PFMEA modals",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Fix Important #5: DRY violations in CTQ filter URL-building (extract helper)",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Fix Important #6: DRY violations in PFMEA row HTML generation",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Fix Important #7: pfdMermaidLabel doesn't escape & character",
      "priority": "high",
      "status": "in_progress"
    },
    {
      "content": "Fix Important #8: Legacy fallback uses undeclared globals in pfmea.js",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Fix Important #9: showFlowchart variable name is inverted",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Fix Important #10: Potential data loss on tab switch (flushDeferred)",
      "priority": "high",
      "status": "pending"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Fix Important #4: Inconsistent showModal/closeModal fallback in PFMEA modals",
    "priority": "high",
    "status": "pending"
  },
  {
    "content": "Fix Important #5: DRY violations in CTQ filter URL-building (extract helper)",
    "priority": "high",
    "status": "pending"
  },
  {
    "content": "Fix Important #6: DRY violations in PFMEA row HTML generation",
    "priority": "high",
    "status": "pending"
  },
  {
    "content": "Fix Important #7: pfdMermaidLabel doesn't escape & character",
    "priority": "high",
    "status": "in_progress"
  },
  {
    "content": "Fix Important #8: Legacy fallback uses undeclared globals in pfmea.js",
    "priority": "high",
    "status": "pending"
  },
  {
    "content": "Fix Important #9: showFlowchart variable name is inverted",
    "priority": "high",
    "status": "pending"
  },
  {
    "content": "Fix Important #10: Potential data loss on tab switch (flushDeferred)",
    "priority": "high",
    "status": "pending"
  }
]
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 7.3s)

_Thinking:_

Let me fix #7 first - the pfdMermaidLabel escaping issue.

**Fix #7: Escape `&` in `pfdMermaidLabel`**

**Tool: edit**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\npi-pfd.js",
  "oldString": "function pfdMermaidLabel(step) {\n  const raw = step && step.op ? String(step.op) : `Step ${step.stepNum}`\n  return raw\n    .replace(/\\r?\\n+/g, ' ')\n    .replace(/\"/g, '&quot;')\n    .replace(/[{}\\[\\]]/g, ' ')\n    .trim()\n}",
  "newString": "function pfdMermaidLabel(step) {\n  const raw = step && step.op ? String(step.op) : `Step ${step.stepNum}`\n  return raw\n    .replace(/&/g, '&amp;')\n    .replace(/\\r?\\n+/g, ' ')\n    .replace(/\"/g, '&quot;')\n    .replace(/[{}\\[\\]]/g, ' ')\n    .trim()\n}"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 6.0s)

_Thinking:_

Now fix #9 - the showFlowchart variable name is inverted. Let me find the relevant code.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Fix Important #4: Inconsistent showModal/closeModal fallback in PFMEA modals",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Fix Important #5: DRY violations in CTQ filter URL-building (extract helper)",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Fix Important #6: DRY violations in PFMEA row HTML generation",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Fix Important #7: pfdMermaidLabel doesn't escape & character",
      "priority": "high",
      "status": "completed"
    },
    {
      "content": "Fix Important #8: Legacy fallback uses undeclared globals in pfmea.js",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Fix Important #9: showFlowchart variable name is inverted",
      "priority": "high",
      "status": "in_progress"
    },
    {
      "content": "Fix Important #10: Potential data loss on tab switch (flushDeferred)",
      "priority": "high",
      "status": "pending"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Fix Important #4: Inconsistent showModal/closeModal fallback in PFMEA modals",
    "priority": "high",
    "status": "pending"
  },
  {
    "content": "Fix Important #5: DRY violations in CTQ filter URL-building (extract helper)",
    "priority": "high",
    "status": "pending"
  },
  {
    "content": "Fix Important #6: DRY violations in PFMEA row HTML generation",
    "priority": "high",
    "status": "pending"
  },
  {
    "content": "Fix Important #7: pfdMermaidLabel doesn't escape & character",
    "priority": "high",
    "status": "completed"
  },
  {
    "content": "Fix Important #8: Legacy fallback uses undeclared globals in pfmea.js",
    "priority": "high",
    "status": "pending"
  },
  {
    "content": "Fix Important #9: showFlowchart variable name is inverted",
    "priority": "high",
    "status": "in_progress"
  },
  {
    "content": "Fix Important #10: Potential data loss on tab switch (flushDeferred)",
    "priority": "high",
    "status": "pending"
  }
]
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 5.6s)

_Thinking:_

Now fix #9 - the showFlowchart variable name is inverted. Let me read the relevant section of npi-pfd.js to understand the usage.

**Fix #9: Rename `showFlowchart` to `showTable`**

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\npi-pfd.js",
  "offset": 390,
  "limit": 20
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\npi-pfd.js</path>
<type>file</type>
<content>390: 
391: npi.pfd.render = function() {
392:   const p = prog()
393:   npiData.pfd.ensureLeadingHeader()
394:   const sorted = npiData.sortedPfd(p.pfd)
395:   const executable = sorted.filter(isExecutableStep)
396: 
397:   const showFlowchart = npi.pfd.viewMode === 'table'
398:   const isLR = npi.pfd.flowDirection === 'LR'
399:   const viewToggleButton = `<button class="btn btn-secondary btn-sm" data-action="pfd-toggle-view">${showFlowchart ? 'Show Flowchart' : 'Show Table'}</button>`
400:   const layoutToggleButton = !showFlowchart ? `<button class="btn btn-secondary btn-sm" data-action="pfd-toggle-layout" title="Toggle flowchart orientation">${isLR ? '↕ Vertical' : '↔ Horizontal'}</button>` : ''
401: 
402:   // Expand button only makes sense for the table view — flowchart is an SVG canvas
403:   const expandButton = showFlowchart ? `<button class="btn btn-ghost btn-sm" data-action="pfd-toggle-expand" title="Fullscreen mode">⛶ Expand</button>` : ''
404: 
405:   const header = `<div class="sec-head"><div><div class="sec-eyebrow">Step 02</div><div class="sec-title">Process Flow Diagram</div><div class="sec-desc">Section navigator at top for fast jumps in large flows. Steps stay numbered in 10s, and those numbers remain permanent PFMEA and Control Plan references.</div></div>
406:   <div class="sec-actions">${viewToggleButton}${layoutToggleButton}${expandButton}<button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide="npi-pfd" title="User Guide">❓ Guide</button></div></div>`
407: 
408:   if (npi.pfd.viewMode === 'flowchart') {
409:     const syntax = npi.pfd.generateMermaidSyntax()

(Showing lines 390-409 of 886. Use offset=410 to continue.)
</content>
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 4.6s)

_Thinking:_

I see. `showFlowchart` is `true` when `viewMode === 'table'` which is indeed inverted. Let me also check where else it's used in the function.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\npi-pfd.js",
  "offset": 550,
  "limit": 30
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\npi-pfd.js</path>
<type>file</type>
<content>550:   ${sorted.length > 0 ? `<div class="flow-ribbon">${ribbon}</div>` : ''}
551:   <div class="card"><div class="card-head"><span class="card-title">Process Steps</span><span class="card-meta">${executable.length} executable steps</span></div>
552:   ${p.pfd.length === 0 ? emptyState('🔄', 'No steps yet', 'Add your first process step') : `<div class="pfd-col-header"><div class="pfd-col-num">Step</div>${canEdit() ? '<div class="pfd-col-flow">Flow</div>' : ''}<div class="pfd-col-op">Operation</div><div class="pfd-col-detail">Method / Notes</div><div class="pfd-col-location">Location</div><div class="pfd-col-operator">Operator</div><div class="pfd-col-timing">Timing</div><div class="pfd-col-ctq">CTQs</div><div class="pfd-col-doc">Documents</div><div class="pfd-col-pfmea">PFMEA</div></div><div>${body}</div>`}
553:   ${canEdit() ? `<button class="add-row" data-action="pfd-add-main">＋ Add Process Step</button>` : ''}</div>
554:   ${p.pfd.length > 0 ? `<div class="info-banner">💡 Next: <a href="#" data-action="npi-set-apqp" data-tab="pfmea" style="color:var(--blue)">PFMEA →</a></div>` : ''}`
555: 
556:   // Fullscreen overlay for table view only (flowchart is an SVG canvas, not suited to fixed overlay)
557:   if (showFlowchart && appState.pfdExpanded) {
558:     return `<div class="portal-fullscreen-overlay">
559:       <div class="portal-fullscreen-bar">
560:         <span><span class="portal-fullscreen-title">Process Flow Diagram</span><span class="portal-fullscreen-project">${esc(p.name || '')}</span></span>
561:         <div style="display:flex;gap:8px">
562:           ${viewToggleButton}
563:           <button class="btn btn-ghost btn-sm" data-action="pfd-toggle-expand">✕ Exit Fullscreen</button>
564:         </div>
565:       </div>
566:       <div class="portal-fullscreen-body">
567:         <div class="pfd-table-wrap">
568:           ${pfdContent}
569:         </div>
570:       </div>
571:     </div>`
572:   }
573: 
574:   return `${header}
575:   ${pfdContent}`
576: }
577: 
578: // Toggle fullscreen for focused PFD table editing on large screens
579: npi.pfd.toggleExpand = function() {

(Showing lines 550-579 of 886. Use offset=580 to continue.)
</content>
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 27.2s)

_Thinking:_

I see the usage. `showFlowchart` is used in:
- Line 397: `const showFlowchart = npi.pfd.viewMode === 'table'` (inverted naming)
- Line 399: Button text uses `showFlowchart ? 'Show Flowchart' : 'Show Table'` (correct logic)
- Line 400: `!showFlowchart` for layout toggle (correct)
- Line 403: `showFlowchart` for expand button (correct)
- Line 557: `showFlowchart && appState.pfdExpanded` for fullscreen (correct)

The logic is correct, just the variable name is misleading. 

I'll rename it to `showTable` to better reflect what it actually represents.

**Tool: edit**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\npi-pfd.js",
  "oldString": "  const showFlowchart = npi.pfd.viewMode === 'table'\n  const isLR = npi.pfd.flowDirection === 'LR'\n  const viewToggleButton = `<button class=\"btn btn-secondary btn-sm\" data-action=\"pfd-toggle-view\">${showFlowchart ? 'Show Flowchart' : 'Show Table'}</button>`\n  const layoutToggleButton = !showFlowchart ? `<button class=\"btn btn-secondary btn-sm\" data-action=\"pfd-toggle-layout\" title=\"Toggle flowchart orientation\">${isLR ? '↕ Vertical' : '↔ Horizontal'}</button>` : ''\n\n  // Expand button only makes sense for the table view — flowchart is an SVG canvas\n  const expandButton = showFlowchart ? `<button class=\"btn btn-ghost btn-sm\" data-action=\"pfd-toggle-expand\" title=\"Fullscreen mode\">⛶ Expand</button>` : ''",
  "newString": "  // showTable is true when viewing the table (viewMode === 'table'), false when viewing the flowchart\n  const showTable = npi.pfd.viewMode === 'table'\n  const isLR = npi.pfd.flowDirection === 'LR'\n  const viewToggleButton = `<button class=\"btn btn-secondary btn-sm\" data-action=\"pfd-toggle-view\">${showTable ? 'Show Flowchart' : 'Show Table'}</button>`\n  const layoutToggleButton = !showTable ? `<button class=\"btn btn-secondary btn-sm\" data-action=\"pfd-toggle-layout\" title=\"Toggle flowchart orientation\">${isLR ? '↕ Vertical' : '↔ Horizontal'}</button>` : ''\n\n  // Expand button only makes sense for the table view — flowchart is an SVG canvas\n  const expandButton = showTable ? `<button class=\"btn btn-ghost btn-sm\" data-action=\"pfd-toggle-expand\" title=\"Fullscreen mode\">⛶ Expand</button>` : ''"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 15.9s)

_Thinking:_

Now I need to update the other reference to `showFlowchart` at line 557.

**Tool: edit**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\npi-pfd.js",
  "oldString": "  // Fullscreen overlay for table view only (flowchart is an SVG canvas, not suited to fixed overlay)\n  if (showFlowchart && appState.pfdExpanded) {",
  "newString": "  // Fullscreen overlay for table view only (flowchart is an SVG canvas, not suited to fixed overlay)\n  if (showTable && appState.pfdExpanded) {"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 25.5s)

_Thinking:_

Now let me fix #4 - the inconsistent showModal/closeModal fallback in PFMEA modals. Let me read the relevant code.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Fix Important #4: Inconsistent showModal/closeModal fallback in PFMEA modals",
      "priority": "high",
      "status": "in_progress"
    },
    {
      "content": "Fix Important #5: DRY violations in CTQ filter URL-building (extract helper)",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Fix Important #6: DRY violations in PFMEA row HTML generation",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Fix Important #7: pfdMermaidLabel doesn't escape & character",
      "priority": "high",
      "status": "completed"
    },
    {
      "content": "Fix Important #8: Legacy fallback uses undeclared globals in pfmea.js",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Fix Important #9: showFlowchart variable name is inverted",
      "priority": "high",
      "status": "completed"
    },
    {
      "content": "Fix Important #10: Potential data loss on tab switch (flushDeferred)",
      "priority": "high",
      "status": "pending"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Fix Important #4: Inconsistent showModal/closeModal fallback in PFMEA modals",
    "priority": "high",
    "status": "in_progress"
  },
  {
    "content": "Fix Important #5: DRY violations in CTQ filter URL-building (extract helper)",
    "priority": "high",
    "status": "pending"
  },
  {
    "content": "Fix Important #6: DRY violations in PFMEA row HTML generation",
    "priority": "high",
    "status": "pending"
  },
  {
    "content": "Fix Important #7: pfdMermaidLabel doesn't escape & character",
    "priority": "high",
    "status": "completed"
  },
  {
    "content": "Fix Important #8: Legacy fallback uses undeclared globals in pfmea.js",
    "priority": "high",
    "status": "pending"
  },
  {
    "content": "Fix Important #9: showFlowchart variable name is inverted",
    "priority": "high",
    "status": "completed"
  },
  {
    "content": "Fix Important #10: Potential data loss on tab switch (flushDeferred)",
    "priority": "high",
    "status": "pending"
  }
]
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 31.9s)

_Thinking:_

Let me read the PFMEA modal functions that have the inconsistent fallback.

**Fix #4: Consistent showModal/closeModal in PFMEA modals**

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\pfmea.js",
  "limit": 30,
  "offset": 633
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\pfmea.js</path>
<type>file</type>
<content>633: // ── SOD Criteria modals ─────────────────────────────────────
634: npi.pfmea.pfShowSeverity = function() {
635:   if (typeof showModal === 'function') showModal('modalPfmeaSeverity')
636:   else {
637:     const modal = document.getElementById('modalPfmeaSeverity')
638:     if (modal) modal.style.display = 'flex'
639:   }
640: }
641: npi.pfmea.pfShowOccurrence = function() {
642:   if (typeof showModal === 'function') showModal('modalPfmeaOccurrence')
643:   else {
644:     const modal = document.getElementById('modalPfmeaOccurrence')
645:     if (modal) modal.style.display = 'flex'
646:   }
647: }
648: npi.pfmea.pfShowDetection = function() {
649:   if (typeof showModal === 'function') showModal('modalPfmeaDetection')
650:   else {
651:     const modal = document.getElementById('modalPfmeaDetection')
652:     if (modal) modal.style.display = 'flex'
653:   }
654: }
655: 
656: // ── History modal ─────────────────────────────────────────────
657: npi.pfmea.pfShowHist = function(evt, cid) {
658:   const context = npi.pfmea.findCauseContext(cid)
659:   if (!context) return
660:   const titleEl = document.getElementById('pfmeaHistoryModalTitle')
661:   const bodyEl = document.getElementById('pfmeaHistoryModalBody')
662:   if (titleEl) titleEl.textContent = `PFMEA History — Step ${context.step?.stepNum ?? '—'}`

(Showing lines 633-662 of 860. Use offset=663 to continue.)
</content>
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 16.5s)

_Thinking:_

The issue is that `showModal` IS imported at line 12, so the `typeof showModal === 'function'` check will always be true. The fallback to `modal.style.display = 'flex'` is dead code. But the real issue is that if somehow the fallback path IS taken (e.g., in tests where showModal might not be available), the modal would be shown via `style.display = 'flex'` but there's no corresponding close mechanism.

Since `showModal` is already imported, the `typeof` check is unnecessary. Let me simplify these functions to just call `showModal` directly.

**Tool: edit**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\pfmea.js",
  "oldString": "// ── SOD Criteria modals ─────────────────────────────────────\nnpi.pfmea.pfShowSeverity = function() {\n  if (typeof showModal === 'function') showModal('modalPfmeaSeverity')\n  else {\n    const modal = document.getElementById('modalPfmeaSeverity')\n    if (modal) modal.style.display = 'flex'\n  }\n}\nnpi.pfmea.pfShowOccurrence = function() {\n  if (typeof showModal === 'function') showModal('modalPfmeaOccurrence')\n  else {\n    const modal = document.getElementById('modalPfmeaOccurrence')\n    if (modal) modal.style.display = 'flex'\n  }\n}\nnpi.pfmea.pfShowDetection = function() {\n  if (typeof showModal === 'function') showModal('modalPfmeaDetection')\n  else {\n    const modal = document.getElementById('modalPfmeaDetection')\n    if (modal) modal.style.display = 'flex'\n  }\n}",
  "newString": "// ── SOD Criteria modals ─────────────────────────────────────\n// showModal is imported from helpers.js — no fallback needed\nnpi.pfmea.pfShowSeverity = function() { showModal('modalPfmeaSeverity') }\nnpi.pfmea.pfShowOccurrence = function() { showModal('modalPfmeaOccurrence') }\nnpi.pfmea.pfShowDetection = function() { showModal('modalPfmeaDetection') }"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 24.4s)

_Thinking:_

Now let me also check the pfShowHist function for the same issue.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\pfmea.js",
  "limit": 20,
  "offset": 645
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\pfmea.js</path>
<type>file</type>
<content>645:   if (titleEl) titleEl.textContent = `PFMEA History — Step ${context.step?.stepNum ?? '—'}`
646:   if (bodyEl) bodyEl.innerHTML = npi.pfmea.renderHistoryModalBody(context)
647:   if (typeof showModal === 'function') showModal('modalPfmeaHistory')
648:   else {
649:     const modal = document.getElementById('modalPfmeaHistory')
650:     if (modal) modal.style.display = 'flex'
651:   }
652:   if (evt?.stopPropagation) evt.stopPropagation()
653: }
654: 
655: // ── PFMEA data mutators ───────────────────────────────────────
656: npi.pfmea.pfAddMode = function(pfdId) { npi.data.pfmea.addMode(pfdId); render() }
657: npi.pfmea.pfUpdMode = function(mi, f, v) { npi.data.pfmea.updMode(mi, f, v) }
658: npi.pfmea.pfDelMode = function(mi) { npi.data.pfmea.delMode(mi); render() }
659: npi.pfmea.pfAddEffect = function(mi) { npi.data.pfmea.addEffect(mi); render() }
660: npi.pfmea.pfNormalizeScore = function(v, allowBlank) {
661:   const raw = v === undefined || v === null ? '' : String(v).trim()
662:   if (!raw) return allowBlank ? '' : 1
663:   const n = parseInt(raw.replace(/[^0-9]/g, ''), 10)
664:   if (!Number.isFinite(n)) return allowBlank ? '' : 1

(Showing lines 645-664 of 843. Use offset=665 to continue.)
</content>
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 20.9s)

_Thinking:_

Same issue in pfShowHist. Let me fix that too.

**Tool: edit**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\pfmea.js",
  "newString": "  if (titleEl) titleEl.textContent = `PFMEA History — Step ${context.step?.stepNum ?? '—'}`\n  if (bodyEl) bodyEl.innerHTML = npi.pfmea.renderHistoryModalBody(context)\n  showModal('modalPfmeaHistory')\n  if (evt?.stopPropagation) evt.stopPropagation()",
  "oldString": "  if (titleEl) titleEl.textContent = `PFMEA History — Step ${context.step?.stepNum ?? '—'}`\n  if (bodyEl) bodyEl.innerHTML = npi.pfmea.renderHistoryModalBody(context)\n  if (typeof showModal === 'function') showModal('modalPfmeaHistory')\n  else {\n    const modal = document.getElementById('modalPfmeaHistory')\n    if (modal) modal.style.display = 'flex'\n  }\n  if (evt?.stopPropagation) evt.stopPropagation()"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 16.8s)

_Thinking:_

Now let me fix #8 - legacy fallback uses undeclared globals in pfmea.js. Let me read the relevant section.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Fix Important #4: Inconsistent showModal/closeModal fallback in PFMEA modals",
      "priority": "high",
      "status": "completed"
    },
    {
      "content": "Fix Important #5: DRY violations in CTQ filter URL-building (extract helper)",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Fix Important #6: DRY violations in PFMEA row HTML generation",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Fix Important #7: pfdMermaidLabel doesn't escape & character",
      "priority": "high",
      "status": "completed"
    },
    {
      "content": "Fix Important #8: Legacy fallback uses undeclared globals in pfmea.js",
      "priority": "high",
      "status": "in_progress"
    },
    {
      "content": "Fix Important #9: showFlowchart variable name is inverted",
      "priority": "high",
      "status": "completed"
    },
    {
      "content": "Fix Important #10: Potential data loss on tab switch (flushDeferred)",
      "priority": "high",
      "status": "pending"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Fix Important #4: Inconsistent showModal/closeModal fallback in PFMEA modals",
    "priority": "high",
    "status": "completed"
  },
  {
    "content": "Fix Important #5: DRY violations in CTQ filter URL-building (extract helper)",
    "priority": "high",
    "status": "pending"
  },
  {
    "content": "Fix Important #6: DRY violations in PFMEA row HTML generation",
    "priority": "high",
    "status": "pending"
  },
  {
    "content": "Fix Important #7: pfdMermaidLabel doesn't escape & character",
    "priority": "high",
    "status": "completed"
  },
  {
    "content": "Fix Important #8: Legacy fallback uses undeclared globals in pfmea.js",
    "priority": "high",
    "status": "in_progress"
  },
  {
    "content": "Fix Important #9: showFlowchart variable name is inverted",
    "priority": "high",
    "status": "completed"
  },
  {
    "content": "Fix Important #10: Potential data loss on tab switch (flushDeferred)",
    "priority": "high",
    "status": "pending"
  }
]
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 5.7s)

_Thinking:_

Let me read the legacy fallback section in pfmea.js.

**Fix #8: Remove dead legacy fallback code in pfmea.js**

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\pfmea.js",
  "limit": 40,
  "offset": 690
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\pfmea.js</path>
<type>file</type>
<content>690:   const p = prog()
691:   const mode = p.pfmea[mi]; const ef = mode.effects[ei]; const ca = ef.causes[ci]
692:   const act = ca.action || {}
693:   if (!act.desc && !act.newOcc && !act.newDet) { showToast('Add an action and/or new scores before implementing.', 'warning'); return }
694:   const oldRpn = npi.pfmea.calcCauseRpn(ef.sev, ca.occ, ca.det)
695:   const newOcc = act.newOcc ? +act.newOcc : ca.occ
696:   const newDet = act.newDet ? +act.newDet : ca.det
697:   if (!confirm(`Implement action?\\n\\nThis will:\\n• Update OCC: ${ca.occ} → ${newOcc}\\n• Update DET: ${ca.det} → ${newDet}\\n• New RPN: ${(ef.sev || 1) * newOcc * newDet}\\n• Log old RPN (${oldRpn}) to history\\n• Clear the action fields`)) return
698: 
699:   if (typeof npi.data?.pfmea?.implementAction === 'function') {
700:     const result = npi.data.pfmea.implementAction(mi, ei, ci)
701:     if (!result.ok) return
702:     render()
703:     return
704:   }
705: 
706:   // Legacy fallback for isolated test loads where npi-data.js is not loaded.
707:   const newRpn = npi.pfmea.calcCauseRpn(ef.sev, newOcc, newDet)
708:   if (!ca.history) ca.history = []
709:   const histEntry = {
710:     rpn: oldRpn,
711:     newRpn,
712:     date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
713:     desc: act.taken || act.desc || 'Action implemented',
714:     oldOcc: ca.occ, oldDet: ca.det,
715:     newOcc, newDet,
716:     relatedEcrId: ca.action_related_ecr_id || null
717:   }
718:   ca.history.push(histEntry)
719:   ca.occ = newOcc
720:   ca.det = newDet
721:   ca.action = { desc: '', taken: '', owner: '', due: '', newOcc: '', newDet: '' }
722:   if (typeof npiRelSavePFMEACause === 'function') npiRelSavePFMEACause(ef.id, ca)
723:   if (typeof npiRelSavePFMEAHistory === 'function') npiRelSavePFMEAHistory(ca.id, histEntry)
724:   else if (typeof save === 'function') save()
725:   render()
726: }
727: npi.pfmea.pfDelCause = function(mi, ei, ci) { npi.data.pfmea.delCause(mi, ei, ci); render() }
728: npi.pfmea.pfRefreshRPN = function() {
729:   const card = Array.from(document.querySelectorAll('.card')).find(c => c.querySelector('.card-title')?.textContent?.includes('RPN Burndown'))

(Showing lines 690-729 of 839. Use offset=730 to continue.)
</content>
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 13.7s)

_Thinking:_

The legacy fallback (lines 706-725) uses undeclared globals `npiRelSavePFMEACause` and `npiRelSavePFMEAHistory`. The `typeof` check prevents a crash, but the fallback is dead code in production since `npi.data.pfmea.implementAction` is always available (it's defined in npi-data.js which is loaded before pfmea.js).

However, looking at the code more carefully, the early return on line 703 means the legacy fallback only runs if `npi.data?.pfmea?.implementAction` is not a function. 

In production this never executes, so I can safely remove the dead code path. The `npi.data.pfmea.implementAction` function is guaranteed to exist when pfmea.js loads since npi-data.js initializes it first.

**Tool: edit**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\pfmea.js",
  "newString": "  if (!confirm(`Implement action?\\\\n\\\\nThis will:\\\\n• Update OCC: ${ca.occ} → ${newOcc}\\\\n• Update DET: ${ca.det} → ${newDet}\\\\n• New RPN: ${(ef.sev || 1) * newOcc * newDet}\\\\n• Log old RPN (${oldRpn}) to history\\\\n• Clear the action fields`)) return\n\n  // npi.data.pfmea.implementAction handles history logging, score update, and action reset\n  const result = npi.data.pfmea.implementAction(mi, ei, ci)\n  if (!result.ok) return\n  render()\n}",
  "oldString": "  if (!confirm(`Implement action?\\\\n\\\\nThis will:\\\\n• Update OCC: ${ca.occ} → ${newOcc}\\\\n• Update DET: ${ca.det} → ${newDet}\\\\n• New RPN: ${(ef.sev || 1) * newOcc * newDet}\\\\n• Log old RPN (${oldRpn}) to history\\\\n• Clear the action fields`)) return\n\n  if (typeof npi.data?.pfmea?.implementAction === 'function') {\n    const result = npi.data.pfmea.implementAction(mi, ei, ci)\n    if (!result.ok) return\n    render()\n    return\n  }\n\n  // Legacy fallback for isolated test loads where npi-data.js is not loaded.\n  const newRpn = npi.pfmea.calcCauseRpn(ef.sev, newOcc, newDet)\n  if (!ca.history) ca.history = []\n  const histEntry = {\n    rpn: oldRpn,\n    newRpn,\n    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),\n    desc: act.taken || act.desc || 'Action implemented',\n    oldOcc: ca.occ, oldDet: ca.det,\n    newOcc, newDet,\n    relatedEcrId: ca.action_related_ecr_id || null\n  }\n  ca.history.push(histEntry)\n  ca.occ = newOcc\n  ca.det = newDet\n  ca.action = { desc: '', taken: '', owner: '', due: '', newOcc: '', newDet: '' }\n  if (typeof npiRelSavePFMEACause === 'function') npiRelSavePFMEACause(ef.id, ca)\n  if (typeof npiRelSavePFMEAHistory === 'function') npiRelSavePFMEAHistory(ca.id, histEntry)\n  else if (typeof save === 'function') save()\n  render()\n}"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 5.3s)

_Thinking:_

Now let me also check if there are similar legacy fallbacks in apqp.js that I should clean up. Let me read the relevant section.

Now let me also clean up the legacy fallback in `apqp.js` for the same reason.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\apqp.js",
  "limit": 60,
  "offset": 82
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\apqp.js</path>
<type>file</type>
<content>82: npi.apqp.syncFromPFMEA = function() {
83:   if (typeof npi.cp?.syncFromPFMEA === 'function') return npi.cp.syncFromPFMEA()
84:   if (typeof npiData?.cp?.syncFromPFMEA === 'function') {
85:     const added = npiData.cp.syncFromPFMEA()
86:     if (added === 0) showToast('All PFMEA causes already in control plan.', 'info')
87:     render()
88:     return
89:   }
90: 
91:   // Legacy fallback for isolated tests where split/data modules are not loaded.
92:   const p = prog()
93:   const ex = new Set(p.cp.map(r => r.pfmeaCauseId || r.pfmeaEffectId || r.pfmeaId))
94:   let n = 0
95:   p.pfmea.forEach(mode => {
96:     const step = p.pfd.find(s => s.id === mode.pfdId)
97:     const cids = step ? (step.ctqIds || []) : []
98:     const fc = cids.length > 0 ? p.ctq.find(c => c.id === cids[0]) : null
99:     ;(mode.effects || []).forEach(ef => {
100:       ;(ef.causes || []).forEach(ca => {
101:         if (ex.has(ca.id)) return
102:         const item = {
103:           id: crypto.randomUUID(),
104:           pfmeaId: mode.id, pfmeaEffectId: ef.id, pfmeaCauseId: ca.id, pfdId: mode.pfdId,
105:           char: mode.mode + (ef.effect ? ' → ' + ef.effect : '') + (ca.cause ? ' (' + ca.cause + ')' : ''),
106:           type: 'Process', spec: fc ? fc.spec : '', method: ca.detect || ca.prevent || '',
107:           freq: '100%', resp: '', reaction: fc ? fc.oos_action || '' : '', ctqIds: [...cids]
108:         }
109:         p.cp.push(item)
110:         if (typeof npiRelSaveCP === 'function') npiRelSaveCP(item)
111:         else if (typeof save === 'function') save()
112:         n++
113:       })
114:     })
115:   })
116:   if (n === 0) return showToast('All PFMEA causes already in control plan.', 'info')
117:   render()
118: }
119: npi.apqp.addCP = function() {
120:   if (typeof npi.cp?.add === 'function') return npi.cp.add()
121:   if (typeof npiData?.cp?.add === 'function') { npiData.cp.add(); render(); return }
122:   const item = { id: crypto.randomUUID(), pfmeaId: '', pfdId: '', char: '', type: 'Process', spec: '', method: '', freq: '', resp: '', reaction: '', ctqIds: [] }
123:   prog().cp.push(item)
124:   if (typeof npiRelSaveCP === 'function') npiRelSaveCP(item)
125:   else if (typeof save === 'function') save()
126:   render()
127: }
128: npi.apqp.updCP = function(i, f, v) {
129:   if (typeof npi.cp?.upd === 'function') return npi.cp.upd(i, f, v)
130:   if (typeof npiData?.cp?.upd === 'function') return npiData.cp.upd(i, f, v)
131:   if (!prog().cp[i]) return
132:   prog().cp[i][f] = v
133:   if (typeof npiRelSaveCP === 'function') npiRelSaveCP(prog().cp[i])
134:   else if (typeof save === 'function') save()
135: }
136: npi.apqp.delCP = function(i) {
137:   if (typeof npi.cp?.del === 'function') return npi.cp.del(i)
138:   if (typeof npiData?.cp?.del === 'function') { npiData.cp.del(i); render(); return }
139:   if (!prog().cp[i]) return
140:   const id = prog().cp[i].id
141:   prog().cp.splice(i, 1)

(Showing lines 82-141 of 148. Use offset=142 to continue.)
</content>
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 28.3s)

_Thinking:_

The legacy fallbacks in `apqp.js` for CP operations (syncFromPFMEA, addCP, updCP, delCP) have the same pattern - they check for `npi.cp.*` functions first, then `npiData.cp.*`, then fall back to legacy code with undeclared globals. Since `npi-cp.js` is imported as a side-effect at line 18, `npi.cp.*` functions should always be available. The `npiData.cp.*` functions are also always available since `npi-data.js` is imported.

Let me simplify these by removing the legacy fallbacks. But I should be careful - the `syncFromPFMEA` function has a first check for `npi.cp.syncFromPFMEA` which delegates to `npiData.cp.syncFromPFMEA`. 

So the chain is: `npi.apqp.syncFromPFMEA` → `npi.cp.syncFromPFMEA` → `npiData.cp.syncFromPFMEA`, and the legacy fallback only triggers if both `npi.cp.syncFromPFMEA` and `npiData.cp.syncFromPFMEA` are undefined, which shouldn't happen. I'll clean up these functions by removing the unnecessary fallback paths.

**Tool: edit**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\apqp.js",
  "newString": "// Backward-compat aliases delegate to npi.cp.* (imported via npi-cp.js side-effect)\nnpi.apqp.syncFromPFMEA = function() { return npi.cp.syncFromPFMEA() }\nnpi.apqp.addCP = function() { return npi.cp.add() }\nnpi.apqp.updCP = function(i, f, v) { return npi.cp.upd(i, f, v) }\nnpi.apqp.delCP = function(i) { return npi.cp.del(i) }",
  "oldString": "npi.apqp.syncFromPFMEA = function() {\n  if (typeof npi.cp?.syncFromPFMEA === 'function') return npi.cp.syncFromPFMEA()\n  if (typeof npiData?.cp?.syncFromPFMEA === 'function') {\n    const added = npiData.cp.syncFromPFMEA()\n    if (added === 0) showToast('All PFMEA causes already in control plan.', 'info')\n    render()\n    return\n  }\n\n  // Legacy fallback for isolated tests where split/data modules are not loaded.\n  const p = prog()\n  const ex = new Set(p.cp.map(r => r.pfmeaCauseId || r.pfmeaEffectId || r.pfmeaId))\n  let n = 0\n  p.pfmea.forEach(mode => {\n    const step = p.pfd.find(s => s.id === mode.pfdId)\n    const cids = step ? (step.ctqIds || []) : []\n    const fc = cids.length > 0 ? p.ctq.find(c => c.id === cids[0]) : null\n    ;(mode.effects || []).forEach(ef => {\n      ;(ef.causes || []).forEach(ca => {\n        if (ex.has(ca.id)) return\n        const item = {\n          id: crypto.randomUUID(),\n          pfmeaId: mode.id, pfmeaEffectId: ef.id, pfmeaCauseId: ca.id, pfdId: mode.pfdId,\n          char: mode.mode + (ef.effect ? ' → ' + ef.effect : '') + (ca.cause ? ' (' + ca.cause + ')' : ''),\n          type: 'Process', spec: fc ? fc.spec : '', method: ca.detect || ca.prevent || '',\n          freq: '100%', resp: '', reaction: fc ? fc.oos_action || '' : '', ctqIds: [...cids]\n        }\n        p.cp.push(item)\n        if (typeof npiRelSaveCP === 'function') npiRelSaveCP(item)\n        else if (typeof save === 'function') save()\n        n++\n      })\n    })\n  })\n  if (n === 0) return showToast('All PFMEA causes already in control plan.', 'info')\n  render()\n}\nnpi.apqp.addCP = function() {\n  if (typeof npi.cp?.add === 'function') return npi.cp.add()\n  if (typeof npiData?.cp?.add === 'function') { npiData.cp.add(); render(); return }\n  const item = { id: crypto.randomUUID(), pfmeaId: '', pfdId: '', char: '', type: 'Process', spec: '', method: '', freq: '', resp: '', reaction: '', ctqIds: [] }\n  prog().cp.push(item)\n  if (typeof npiRelSaveCP === 'function') npiRelSaveCP(item)\n  else if (typeof save === 'function') save()\n  render()\n}\nnpi.apqp.updCP = function(i, f, v) {\n  if (typeof npi.cp?.upd === 'function') return npi.cp.upd(i, f, v)\n  if (typeof npiData?.cp?.upd === 'function') return npiData.cp.upd(i, f, v)\n  if (!prog().cp[i]) return\n  prog().cp[i][f] = v\n  if (typeof npiRelSaveCP === 'function') npiRelSaveCP(prog().cp[i])\n  else if (typeof save === 'function') save()\n}\nnpi.apqp.delCP = function(i) {\n  if (typeof npi.cp?.del === 'function') return npi.cp.del(i)\n  if (typeof npiData?.cp?.del === 'function') { npiData.cp.del(i); render(); return }\n  if (!prog().cp[i]) return\n  const id = prog().cp[i].id\n  prog().cp.splice(i, 1)\n  if (typeof npiRelDeleteCP === 'function') npiRelDeleteCP(id)\n  else if (typeof save === 'function') save()\n  render()\n}"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 18.4s)

_Thinking:_

Now I can also clean up the unused imports in apqp.js since we removed the legacy code that used `save`, `showToast`, `npiRelDeleteCP`, and `npiRelSaveCP`. Let me check what imports are still needed.

Let me clean up the now-unused imports in `apqp.js`.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\apqp.js"
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\apqp.js</path>
<type>file</type>
<content>1: // ═══════════════════════════════════
2: // apqp.js — APQP tab dispatcher
3: // Depends on: npi.js, npi-ctq.js, npi-pfd.js, pfmea.js, npi-cp.js
4: // ═══════════════════════════════════
5: 
6: import { appState, prog } from '../../../../core/js/state.js'
7: import { save } from '../../../../core/js/db.js'
8: import { showToast } from '../../../../utils/js/helpers.js'
9: import { render } from '../../../../utils/js/navigation.js'
10: import { npiData } from './npi-data.js'
11: import { APQP_TABS, RPN_HIGH } from './npi-constants.js'
12: import { npiRelDeleteCP, npiRelSaveCP } from './npi-data-relational.js'
13: import { npiCtq } from './npi-ctq.js'
14: import { npiPfd } from './npi-pfd.js'
15: import { npi } from './npi-shared.js'
16: import './pfmea.js'
17: // Bug fix: npi-cp.js was never imported — CP tab side-effects (npi.cp.*) never fired
18: import './npi-cp.js'
19: 
20: 
21: npi.apqp.renderAPQP = function() {
22:   const p = prog()
23:   // Bug fix: Guard against undefined arrays and calcRPN if pfmea.js hasn't fully initialized
24:   const pfmea = p.pfmea || []
25:   const pfd = p.pfd || []
26:   const ctq = p.ctq || []
27:   const cp = p.cp || []
28:   const calcRPN = typeof npi.pfmea.calcRPN === 'function' ? npi.pfmea.calcRPN : () => 0
29:   const highRPN = pfmea.filter(r => calcRPN(r) >= RPN_HIGH).length
30:   const tabs = [
31:     { id: APQP_TABS.CTQ, label: 'CTQ Matrix', badge: ctq.length },
32:     { id: APQP_TABS.PFD, label: 'Process Flow', badge: pfd.filter(s => npiData.pfdType.isExecutable(s.type)).length },
33:     { id: APQP_TABS.PFMEA, label: 'PFMEA', badge: pfmea.length, warn: highRPN > 0 },
34:     { id: APQP_TABS.CP, label: 'Control Plan', badge: cp.length }
35:   ]
36: 
37:   const tabNav = `<div class="apqp-tabs-shell">${
38:     tabs.map(t => `<button class="apqp-tab-btn ${appState.apqpTab === t.id ? 'active' : ''}" onclick="npi.nav.setApqpTab('${t.id}')">${t.label}${t.badge > 0 ? `<span class="apqp-tab-badge">(${t.badge})</span>` : ''}${t.warn ? `<span class="apqp-tab-warning">⚠</span>` : ''}</button>`).join('')
39:   }</div>`
40: 
41:   const inner = appState.apqpTab === APQP_TABS.CTQ ? npiCtq.render()
42:     : appState.apqpTab === APQP_TABS.PFD ? npiPfd.render()
43:     : appState.apqpTab === APQP_TABS.PFMEA ? npi.pfmea.renderPFMEA()
44:     : (typeof npi.cp?.render === 'function' ? npi.cp.render() : '')
45: 
46:   return `<div class="sec-head"><div><div class="sec-eyebrow">Project</div><div class="sec-title">APQP</div><div class="sec-desc">CTQ requirements, process flow, PFMEA and control plan in one place.</div></div><div class="sec-actions"><button class="btn btn-ghost btn-sm" onclick="showGuide('npi-apqp')" title="User Guide">❓ Guide</button><button class="btn btn-ghost btn-sm" onclick="npi.nav.goHome()">← Dashboard</button></div></div>
47:   ${tabNav}
48:   <div style="background:var(--white);border:1px solid var(--line);border-top:none;border-radius:0 0 8px 8px;padding:24px 0 0"></div>
49:   <div class="apqp-tab-content" style="padding:24px 0">${inner}</div>`
50: }
51: 
52: // Backward compatibility aliases for existing inline handlers.
53: npi.apqp.renderCTQ = function() { return typeof npi.ctq?.render === 'function' ? npi.ctq.render() : '' }
54: npi.apqp.addCTQ = function() { return typeof npi.ctq?.add === 'function' ? npi.ctq.add() : undefined }
55: npi.apqp.updCTQ = function(i, f, v) { return typeof npi.ctq?.upd === 'function' ? npi.ctq.upd(i, f, v) : undefined }
56: npi.apqp.delCTQ = function(i) { return typeof npi.ctq?.del === 'function' ? npi.ctq.del(i) : undefined }
57: 
58: npi.apqp.renderPFD = function() { return typeof npi.pfd?.render === 'function' ? npi.pfd.render() : '' }
59: npi.apqp.addMainStep = function() { return typeof npi.pfd?.addMainStep === 'function' ? npi.pfd.addMainStep() : undefined }
60: npi.apqp.openInsert = function(afterOi, ft) { return typeof npi.pfd?.openInsert === 'function' ? npi.pfd.openInsert(afterOi, ft) : undefined }
61: npi.apqp.confirmInsert = function() { return typeof npi.pfd?.confirmInsert === 'function' ? npi.pfd.confirmInsert() : undefined }
62: npi.apqp.delPFD = function(sid) { return typeof npi.pfd?.del === 'function' ? npi.pfd.del(sid) : undefined }
63: npi.apqp.updPFD = function(sid, f, v) { return typeof npi.pfd?.upd === 'function' ? npi.pfd.upd(sid, f, v) : undefined }
64: npi.apqp.scrollToPfd = function(sid) { return typeof npi.pfd?.scrollTo === 'function' ? npi.pfd.scrollTo(sid) : undefined }
65: npi.apqp.toggleGroup = function(key) { return typeof npi.pfd?.toggleGroup === 'function' ? npi.pfd.toggleGroup(key) : undefined }
66: npi.apqp.openResourceEdit = function(sid, bt, iid) { return typeof npi.pfd?.openResourceEdit === 'function' ? npi.pfd.openResourceEdit(sid, bt, iid) : undefined }
67: npi.apqp.saveResourceEdit = function() { return typeof npi.pfd?.saveResourceEdit === 'function' ? npi.pfd.saveResourceEdit() : undefined }
68: npi.apqp.deleteResourceEdit = function() { return typeof npi.pfd?.deleteResourceEdit === 'function' ? npi.pfd.deleteResourceEdit() : undefined }
69: npi.apqp.openCtqPick = function(oi) { return typeof npi.pfd?.openCtqPick === 'function' ? npi.pfd.openCtqPick(oi) : undefined }
70: npi.apqp.tCP = function(cid, checked) { return typeof npi.pfd?.toggleCtqPick === 'function' ? npi.pfd.toggleCtqPick(cid, checked) : undefined }
71: npi.apqp.saveCtqPick = function() { return typeof npi.pfd?.saveCtqPick === 'function' ? npi.pfd.saveCtqPick() : undefined }
72: npi.apqp.openBomPick = function(sid) { return typeof npi.pfd?.openBomPick === 'function' ? npi.pfd.openBomPick(sid) : undefined }
73: npi.apqp.refreshBomPickModal = function(p, filterId, listId, activeFilter, searchTerm) { return typeof npi.pfd?.refreshBomPickModal === 'function' ? npi.pfd.refreshBomPickModal(p, filterId, listId, activeFilter, searchTerm) : undefined }
74: npi.apqp.setBomFilter = function(f, fid, lid) { return typeof npi.pfd?.setBomFilter === 'function' ? npi.pfd.setBomFilter(f, fid, lid) : undefined }
75: npi.apqp.searchBomPick = function(query) { return typeof npi.pfd?.searchBomPick === 'function' ? npi.pfd.searchBomPick(query) : undefined }
76: npi.apqp.toggleBomPick = function(key, el) { return typeof npi.pfd?.toggleBomPick === 'function' ? npi.pfd.toggleBomPick(key, el) : undefined }
77: npi.apqp.saveBomPick = function() { return typeof npi.pfd?.saveBomPick === 'function' ? npi.pfd.saveBomPick() : undefined }
78: npi.apqp.openDocPick = function(oi) { return typeof npi.pfd?.openDocPick === 'function' ? npi.pfd.openDocPick(oi) : undefined }
79: npi.apqp.saveDocPick = function() { return typeof npi.pfd?.saveDocPick === 'function' ? npi.pfd.saveDocPick() : undefined }
80: 
81: npi.apqp.renderCP = function() { return typeof npi.cp?.render === 'function' ? npi.cp.render() : '' }
82: // Backward-compat aliases delegate to npi.cp.* (imported via npi-cp.js side-effect)
83: npi.apqp.syncFromPFMEA = function() { return npi.cp.syncFromPFMEA() }
84: npi.apqp.addCP = function() { return npi.cp.add() }
85: npi.apqp.updCP = function(i, f, v) { return npi.cp.upd(i, f, v) }
86: npi.apqp.delCP = function(i) { return npi.cp.del(i) }
87: 
88: export const npiApqp = npi.apqp
89: export const renderApqp = npi.apqp.renderAPQP

(End of file - total 89 lines)
</content>
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 8.9s)

_Thinking:_

Now I can see that `save`, `showToast`, `npiRelDeleteCP`, and `npiRelSaveCP` are no longer used. Let me remove those imports. `render` is also no longer used. Let me check... no, `render` is not used anymore either since the legacy fallbacks were removed. Let me clean up the imports.

**Tool: edit**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\apqp.js",
  "newString": "import { appState, prog } from '../../../../core/js/state.js'\nimport { npiData } from './npi-data.js'\nimport { APQP_TABS, RPN_HIGH } from './npi-constants.js'\nimport { npiCtq } from './npi-ctq.js'\nimport { npiPfd } from './npi-pfd.js'\nimport { npi } from './npi-shared.js'\nimport './pfmea.js'\n// Bug fix: npi-cp.js was never imported — CP tab side-effects (npi.cp.*) never fired\nimport './npi-cp.js'",
  "oldString": "import { appState, prog } from '../../../../core/js/state.js'\nimport { save } from '../../../../core/js/db.js'\nimport { showToast } from '../../../../utils/js/helpers.js'\nimport { render } from '../../../../utils/js/navigation.js'\nimport { npiData } from './npi-data.js'\nimport { APQP_TABS, RPN_HIGH } from './npi-constants.js'\nimport { npiRelDeleteCP, npiRelSaveCP } from './npi-data-relational.js'\nimport { npiCtq } from './npi-ctq.js'\nimport { npiPfd } from './npi-pfd.js'\nimport { npi } from './npi-shared.js'\nimport './pfmea.js'\n// Bug fix: npi-cp.js was never imported — CP tab side-effects (npi.cp.*) never fired\nimport './npi-cp.js'"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 6.0s)

_Thinking:_

Now let me fix #5 - DRY violations in CTQ filter URL-building. Let me read the relevant section of npi-ctq.js.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Fix Important #4: Inconsistent showModal/closeModal fallback in PFMEA modals",
      "priority": "high",
      "status": "completed"
    },
    {
      "content": "Fix Important #5: DRY violations in CTQ filter URL-building (extract helper)",
      "priority": "high",
      "status": "in_progress"
    },
    {
      "content": "Fix Important #6: DRY violations in PFMEA row HTML generation",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Fix Important #7: pfdMermaidLabel doesn't escape & character",
      "priority": "high",
      "status": "completed"
    },
    {
      "content": "Fix Important #8: Legacy fallback uses undeclared globals in pfmea.js",
      "priority": "high",
      "status": "completed"
    },
    {
      "content": "Fix Important #9: showFlowchart variable name is inverted",
      "priority": "high",
      "status": "completed"
    },
    {
      "content": "Fix Important #10: Potential data loss on tab switch (flushDeferred)",
      "priority": "high",
      "status": "pending"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Fix Important #4: Inconsistent showModal/closeModal fallback in PFMEA modals",
    "priority": "high",
    "status": "completed"
  },
  {
    "content": "Fix Important #5: DRY violations in CTQ filter URL-building (extract helper)",
    "priority": "high",
    "status": "in_progress"
  },
  {
    "content": "Fix Important #6: DRY violations in PFMEA row HTML generation",
    "priority": "high",
    "status": "pending"
  },
  {
    "content": "Fix Important #7: pfdMermaidLabel doesn't escape & character",
    "priority": "high",
    "status": "completed"
  },
  {
    "content": "Fix Important #8: Legacy fallback uses undeclared globals in pfmea.js",
    "priority": "high",
    "status": "completed"
  },
  {
    "content": "Fix Important #9: showFlowchart variable name is inverted",
    "priority": "high",
    "status": "completed"
  },
  {
    "content": "Fix Important #10: Potential data loss on tab switch (flushDeferred)",
    "priority": "high",
    "status": "pending"
  }
]
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 64.3s)

_Thinking:_

Let me read the CTQ filter URL-building code to understand the pattern and extract a helper.

**Fix #5: Extract CTQ filter URL helper**

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\npi-ctq.js",
  "limit": 120,
  "offset": 30
}
```

**Output:**
```
<path>C:\Users\Tidyco\Documents\VScode\Tidyco-apqp\portals\product-development\npi\js\npi-ctq.js</path>
<type>file</type>
<content>30: }
31: 
32: npi.ctq.setCoverageFilter = function(v) {
33:   const safe = (v || 'all').toString()
34:   appState.ctqCoverageFilter = CTQ_COVERAGE_OPTIONS.includes(safe) ? safe : 'all'
35:   const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']
36:   if (appState.ctqSourceFilter !== 'all') parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter))
37:   if (appState.ctqOosFilter !== 'all') parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter))
38:   if (appState.ctqAgreedFilter !== 'all') parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter))
39:   if (appState.ctqCoverageFilter !== 'all') parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter))
40:   if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
41:   writeNavigationHistory('#' + parts.join('&'), { push: true })
42:   render()
43: }
44: 
45: npi.ctq.matchesCoverageFilter = function(r, p, coverageFilter) {
46:   if (coverageFilter === 'all') return true
47:   const coverage = npi.ctq.getCoverage(r.id, p)
48:   if (coverageFilter === 'linked') return coverage.total > 0
49:   if (coverageFilter === 'orphaned') return coverage.total === 0
50:   return true
51: }
52: 
53: npi.ctq.getSourceFilter = function() {
54:   const cur = (appState.ctqSourceFilter || 'all').toString()
55:   return ['all', ...CTQ_SOURCES].includes(cur) ? cur : 'all'
56: }
57: 
58: npi.ctq.setSourceFilter = function(v) {
59:   const safe = (v || 'all').toString()
60:   appState.ctqSourceFilter = ['all', ...CTQ_SOURCES].includes(safe) ? safe : 'all'
61:   const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']
62:   if (appState.ctqSourceFilter !== 'all') parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter))
63:   if (appState.ctqOosFilter !== 'all') parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter))
64:   if (appState.ctqAgreedFilter !== 'all') parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter))
65:   if (appState.ctqCoverageFilter !== 'all') parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter))
66:   if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
67:   writeNavigationHistory('#' + parts.join('&'), { push: true })
68:   render()
69: }
70: 
71: npi.ctq.getOosFilter = function() {
72:   const cur = (appState.ctqOosFilter || 'all').toString()
73:   return ['all', ...CTQ_OOS_ACTIONS].includes(cur) ? cur : 'all'
74: }
75: 
76: npi.ctq.setOosFilter = function(v) {
77:   const safe = (v || 'all').toString()
78:   appState.ctqOosFilter = ['all', ...CTQ_OOS_ACTIONS].includes(safe) ? safe : 'all'
79:   const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']
80:   if (appState.ctqSourceFilter !== 'all') parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter))
81:   if (appState.ctqOosFilter !== 'all') parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter))
82:   if (appState.ctqAgreedFilter !== 'all') parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter))
83:   if (appState.ctqCoverageFilter !== 'all') parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter))
84:   if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
85:   writeNavigationHistory('#' + parts.join('&'), { push: true })
86:   render()
87: }
88: 
89: npi.ctq.getAgreedFilter = function() {
90:   const cur = (appState.ctqAgreedFilter || 'all').toString()
91:   return ['all', 'yes', 'no'].includes(cur) ? cur : 'all'
92: }
93: 
94: npi.ctq.setAgreedFilter = function(v) {
95:   const safe = (v || 'all').toString()
96:   appState.ctqAgreedFilter = ['all', 'yes', 'no'].includes(safe) ? safe : 'all'
97:   const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']
98:   if (appState.ctqSourceFilter !== 'all') parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter))
99:   if (appState.ctqOosFilter !== 'all') parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter))
100:   if (appState.ctqAgreedFilter !== 'all') parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter))
101:   if (appState.ctqCoverageFilter !== 'all') parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter))
102:   if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
103:   writeNavigationHistory('#' + parts.join('&'), { push: true })
104:   render()
105: }
106: 
107: npi.ctq.clearFilters = function() {
108:   appState.ctqSourceFilter = 'all'
109:   appState.ctqOosFilter = 'all'
110:   appState.ctqAgreedFilter = 'all'
111:   appState.ctqCoverageFilter = 'all'
112:   const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']
113:   if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))
114:   writeNavigationHistory('#' + parts.join('&'), { push: true })
115:   render()
116: }
117: 
118: npi.ctq.matchesFilter = function(r, sourceFilter, oosFilter, agreedFilter) {
119:   if (sourceFilter !== 'all' && r.source !== sourceFilter) return false
120:   if (oosFilter !== 'all' && r.oos_action !== oosFilter) return false
121:   if (agreedFilter === 'yes' && !r.customerAgreed) return false
122:   if (agreedFilter === 'no' && r.customerAgreed) return false
123:   return true
124: }
125: 
126: npi.ctq.render = function() {
127:   const p = prog()
128:   const sourceFilter = npi.ctq.getSourceFilter()
129:   const oosFilter = npi.ctq.getOosFilter()
130:   const agreedFilter = npi.ctq.getAgreedFilter()
131:   const coverageFilter = npi.ctq.getCoverageFilter()
132:   const hasFilters = sourceFilter !== 'all' || oosFilter !== 'all' || agreedFilter !== 'all' || coverageFilter !== 'all'
133: 
134:   const filteredIdx = p.ctq
135:     .map((r, i) => ({ r, i }))
136:     .filter(({ r }) => npi.ctq.matchesFilter(r, sourceFilter, oosFilter, agreedFilter))
137:     .filter(({ r }) => npi.ctq.matchesCoverageFilter(r, p, coverageFilter))
138: 
139:   const coverageStats = p.ctq.map(r => npi.ctq.getCoverage(r.id, p))
140:   const linkedCount = coverageStats.filter(c => c.total > 0).length
141:   const orphanedCount = coverageStats.filter(c => c.total === 0).length
142: 
143:   const rows = filteredIdx.map(({ r, i }) => {
144:     const coverage = npi.ctq.getCoverage(r.id, p)
145:     const coverageHtml = coverage.total === 0
146:       ? `<span class="tag tag-amber" title="Not linked to any PFD steps or PFMEA modes">⚠️ Orphaned</span>`
147:       : `<span class="tag tag-green" title="Linked to ${coverage.pfdCount} PFD step(s) and ${coverage.pfmeaCount} PFMEA mode(s)">✓ ${coverage.total}</span>`
148:     return `<tr>
149:     <td style="text-align:center"><span class="tag tag-ctq">C${i + 1}</span></td>

(Showing lines 30-149 of 257. Use offset=150 to continue.)
</content>
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 18.0s)

_Thinking:_

I can see the pattern. The URL-building code is identical in 5 places (setCoverageFilter, setSourceFilter, setOosFilter, setAgreedFilter, clearFilters). Let me extract a helper function.

**Tool: edit**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\npi-ctq.js",
  "oldString": "const CTQ_SOURCES = ['Customer Spec', 'OEM Data', 'Internal Standard', 'Regulatory', 'Drawing']\nconst CTQ_OOS_ACTIONS = ['Repair', 'Replace', 'Scrap', 'Review', 'TBD']\nconst CTQ_COVERAGE_OPTIONS = ['all', 'linked', 'orphaned']\n\n// ═══════════════════════════════════════════════════════════════\n// Coverage helpers — track where CTQs are referenced\n// ═══════════════════════════════════════════════════════════════",
  "newString": "const CTQ_SOURCES = ['Customer Spec', 'OEM Data', 'Internal Standard', 'Regulatory', 'Drawing']\nconst CTQ_OOS_ACTIONS = ['Repair', 'Replace', 'Scrap', 'Review', 'TBD']\nconst CTQ_COVERAGE_OPTIONS = ['all', 'linked', 'orphaned']\n\n// Build CTQ filter URL and push to history — used by all filter setters\nfunction pushCtqFilterUrl() {\n  const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']\n  if (appState.ctqSourceFilter !== 'all') parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter))\n  if (appState.ctqOosFilter !== 'all') parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter))\n  if (appState.ctqAgreedFilter !== 'all') parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter))\n  if (appState.ctqCoverageFilter !== 'all') parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter))\n  if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))\n  writeNavigationHistory('#' + parts.join('&'), { push: true })\n  render()\n}\n\n// ═══════════════════════════════════════════════════════════════\n// Coverage helpers — track where CTQs are referenced\n// ═══════════════════════════════════════════════════════════════"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 10.7s)

_Thinking:_

Now I need to replace all 5 filter setter functions to use the helper.

**Tool: edit**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\npi-ctq.js",
  "newString": "npi.ctq.setCoverageFilter = function(v) {\n  const safe = (v || 'all').toString()\n  appState.ctqCoverageFilter = CTQ_COVERAGE_OPTIONS.includes(safe) ? safe : 'all'\n  pushCtqFilterUrl()\n}",
  "oldString": "npi.ctq.setCoverageFilter = function(v) {\n  const safe = (v || 'all').toString()\n  appState.ctqCoverageFilter = CTQ_COVERAGE_OPTIONS.includes(safe) ? safe : 'all'\n  const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']\n  if (appState.ctqSourceFilter !== 'all') parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter))\n  if (appState.ctqOosFilter !== 'all') parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter))\n  if (appState.ctqAgreedFilter !== 'all') parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter))\n  if (appState.ctqCoverageFilter !== 'all') parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter))\n  if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))\n  writeNavigationHistory('#' + parts.join('&'), { push: true })\n  render()\n}"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 9.3s)

_Thinking:_

Now let me fix the other 4 filter setters.

**Tool: edit**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\npi-ctq.js",
  "newString": "npi.ctq.setSourceFilter = function(v) {\n  const safe = (v || 'all').toString()\n  appState.ctqSourceFilter = ['all', ...CTQ_SOURCES].includes(safe) ? safe : 'all'\n  pushCtqFilterUrl()\n}",
  "oldString": "npi.ctq.setSourceFilter = function(v) {\n  const safe = (v || 'all').toString()\n  appState.ctqSourceFilter = ['all', ...CTQ_SOURCES].includes(safe) ? safe : 'all'\n  const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']\n  if (appState.ctqSourceFilter !== 'all') parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter))\n  if (appState.ctqOosFilter !== 'all') parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter))\n  if (appState.ctqAgreedFilter !== 'all') parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter))\n  if (appState.ctqCoverageFilter !== 'all') parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter))\n  if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))\n  writeNavigationHistory('#' + parts.join('&'), { push: true })\n  render()\n}"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 18.3s)

_Thinking:_

Continue with the remaining filter setters.

**Tool: edit**

**Input:**
```json
{
  "filePath": "C:\\Users\\Tidyco\\Documents\\VScode\\Tidyco-apqp\\portals\\product-development\\npi\\js\\npi-ctq.js",
  "newString": "npi.ctq.setOosFilter = function(v) {\n  const safe = (v || 'all').toString()\n  appState.ctqOosFilter = ['all', ...CTQ_OOS_ACTIONS].includes(safe) ? safe : 'all'\n  pushCtqFilterUrl()\n}",
  "oldString": "npi.ctq.setOosFilter = function(v) {\n  const safe = (v || 'all').toString()\n  appState.ctqOosFilter = ['all', ...CTQ_OOS_ACTIONS].includes(safe) ? safe : 'all'\n  const parts = ['p=' + encodeURIComponent(appState.progId), 's=project', 't=ctq']\n  if (appState.ctqSourceFilter !== 'all') parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter))\n  if (appState.ctqOosFilter !== 'all') parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter))\n  if (appState.ctqAgreedFilter !== 'all') parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter))\n  if (appState.ctqCoverageFilter !== 'all') parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter))\n  if (appState.bomSubTab !== 'tree') parts.push('bt=' + encodeURIComponent(appState.bomSubTab))\n  writeNavigationHistory('#' + parts.join('&'), { push: true })\n  render()\n}"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free · 316.3s)

---

## User

continue

---

## Assistant (Debug · xiaomi/mimo-v2-pro:free)

---

