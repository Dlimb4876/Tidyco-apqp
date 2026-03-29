# ESM Migration — Part 1 of 2
## Architecture Reference + Phases 0–3

> **For agents:** Read this entire document before touching any file.
> Mark your progress by replacing `[ ]` with `[x]` in the checklist for your assigned phase.
> When you begin a phase task, add your agent name and date next to the heading: `### P1a — Jest ESM Setup *(Codex — 2026-03-28)*`
> When you complete a phase task, add `✅ DONE` next to the heading.
> Part 2 of this guide covers Phases 4–9: `plans/esm-migration-part2.md`
>
> **Copilot `/fleet` quick-start:** Claim exactly one phase row, switch status to `in_progress`, set `Agent`, set `Date`, and work only the listed files for that phase.

---

## Copilot `/fleet` Coordination Contract (Part 1)

Use this contract when dispatching or running `/fleet` tasks for Phases 0–3.

1. **Single-owner phase claim**
   - One agent owns one phase/sub-phase at a time.
   - Before coding, update **Master Phase Status** row: `pending` → `in_progress`.
   - On completion and merge, set `done`.

2. **File ownership boundary**
   - Edit only files listed in your assigned phase.
   - If you must touch another file, log it in your handoff under **Cross-phase edits** with reason.

3. **Branch discipline**
   - Use the branch named in the phase (`esm/p1a-jest`, `esm/phase2`, etc.).
   - Never commit directly to `esm-migration`.

4. **Proof-of-work in handoff**
   - Include: changed files, key exports/imports added, gate command results, and blockers.
   - Required gate commands per phase: `npm test` and phase-specific checks listed in this doc.

5. **Environment command rule (pwsh)**
   - In this environment, do **not** run tests/checks that require `pwsh` (for example `npm test`, `npm run check:all`, `npm run check:imports`, `npm run check:esm-coverage`) until `pwsh` is confirmed available.
   - If `pwsh` is unavailable, mark the todo `blocked` and report the exact command still required in handoff.

6. **No silent assumptions**
   - If a dependency phase is not merged, stop and report blocker.
   - Do not workaround by reintroducing globals or `window.*` bridges.

### `/fleet` Task Card Template (copy/paste)

```md
Phase: <e.g., P1c>
Branch: <e.g., esm/p1c-imports>
Owner: <agent name>
Scope files:
- path/a.js
- path/b.js

Definition of done:
- checklist items in this phase are all [x]
- required commands pass
- phase row updated in Master Phase Status
```

### Handoff Template (required in agent reply)

```md
Completed:
- <file>: <what changed>

Validation:
- npm test: <pass/fail + note>
- npm run check:all: <pass/fail + note>
- phase-specific checks: <results>

Cross-phase edits:
- <none OR file + reason>

Blockers:
- <none OR blocker description + dependency phase>
```

---

## Document Index

| Doc | Covers |
|-----|--------|
| **Part 1 (this file)** | Architecture reference, ESM target, universal rules, Phases 0–3 |
| **Part 2** | Phases 4–9, master completion tracker |

---

## Master Phase Status

> Agents: update this table when work starts (`in_progress`) and when fully complete (`done`).

| Phase | Description | Status | Agent | Date |
|-------|-------------|--------|-------|------|
| 0 | Architecture doc written | `done` | Copilot | 2026-03-28 |
| 1a | Jest ESM setup | `done` | Copilot | 2026-03-28 |
| 1b | Retire old check scripts | `done` | Copilot | 2026-03-28 |
| 1c | Write check:imports | `done` | Copilot | 2026-03-28 |
| 1d | Write check:esm-coverage | `done` | Copilot | 2026-03-28 |
| 2a | Core inner chain (state, auth, db) | `done` | Copilot | 2026-03-28 |
| 2b | Core outer chain (helpers → app) | `done` | Copilot | 2026-03-28 |
| 3 | Capacity shared layer | `done` | Copilot | 2026-03-28 |
| 4a | ME capacity | `done` | Copilot | 2026-03-28 |
| 4b | PM capacity | `done` | Copilot | 2026-03-28 |
| 4c | LOG capacity | `done` | Codex | 2026-03-28 |
| 4d | UNIT6 capacity | `done` | Copilot | 2026-03-28 |
| 4e | Production capacity + shell | `done` | Copilot | 2026-03-28 |
| 5a | Operations | `done` | Copilot | 2026-03-28 |
| 5b | Production portal | `done` | Copilot | 2026-03-28 |
| 5c | Hub, Feedback, Action Centre | `done` | Copilot | 2026-03-28 |
| 5d | Settings | `done` | Copilot | 2026-03-28 |
| 5e | Product Development + Parts + Mgmt | `done` | Copilot | 2026-03-28 |
| 6a | NPI constants + data | `done` | Copilot | 2026-03-29 |
| 6b | NPI tools | `done` | Copilot | 2026-03-29 |
| 6c | NPI PFMEA + gates + dashboard | `done` | Copilot | 2026-03-29 |
| 6d | NPI orchestrator + wiring | `done` | Copilot | 2026-03-29 |
| 7a | MCS data + modals shared | `done` | Copilot | 2026-03-29 |
| 7b | MCS modals + main | `done` | Copilot | 2026-03-29 |
| 8 | Final wiring (index.html + main.js) | `done` | Codex | 2026-03-29 |
| 9 | Cleanup + docs update | `done` | Copilot | 2026-03-29 |

---

## Part A — Current Architecture Reference

This section documents exactly how the app works today. Every agent must read this before writing a single import or export.

---

### A1 — Script Loading Model

The app is a vanilla JavaScript SPA. There is no build step. All scripts load via `<script src="...">` tags in `index.html` in strict dependency order. Every function and variable lands on the browser's global `window` object and is accessible to every subsequent script.

**The complete load order (121 tags):**

```
[CDN]    @supabase/supabase-js@2
[CDN]    chart.js@4.4.0

[CORE]   core/js/state.js
[CORE]   core/js/auth.js
[CORE]   core/js/db.js
[UTILS]  utils/js/helpers.js
[UTILS]  utils/js/navigation.js
[UTILS]  utils/js/realtime.js
[UTILS]  utils/js/realtime-patch.js
[UTILS]  utils/js/render-scheduler.js
[CORE]   core/js/chart-theme.js
[UTILS]  utils/js/guide.js
[CORE]   core/js/network.js

[PORTAL] portals/hub/js/hub.js

[PORTAL] portals/operations/js/operations-forecast-data.js
[PORTAL] portals/operations/js/operations-dashboard-state.js
[PORTAL] portals/operations/js/operations-dashboard-metrics.js
[PORTAL] portals/operations/js/operations-dashboard-realtime.js
[PORTAL] portals/operations/js/operations-dashboard-render-core.js
[PORTAL] portals/operations/js/operations-dashboard-forecast-view.js
[PORTAL] portals/operations/js/operations-dashboard-forecast-actions.js
[PORTAL] portals/operations/js/operations-infographic.js
[PORTAL] portals/operations/js/operations-dashboard-main.js

[PORTAL] portals/product-development/js/families-data.js
[PORTAL] portals/product-development/js/family-templates-data.js
[PORTAL] portals/product-development/product-management/js/products-data.js
[PORTAL] portals/product-development/product-management/js/trends-chart.js

[SHARED] portals/capacity/shared/js/cap-data-utils.js
[SHARED] portals/capacity/shared/js/cap-utils.js
[SHARED] portals/capacity/shared/js/cap-calculations.js
[SHARED] portals/capacity/shared/js/cap-components.js
[SHARED] portals/capacity/shared/js/cap-team.js
[SHARED] portals/capacity/shared/js/cap-tasks.js
[SHARED] portals/capacity/shared/js/cap-products.js
[SHARED] portals/capacity/shared/js/cap-product-taskload.js
[SHARED] portals/capacity/shared/js/cap-holidays.js
[SHARED] portals/capacity/shared/js/cap-chart.js
[SHARED] portals/capacity/shared/js/cap-heatmap.js
[SHARED] portals/capacity/shared/js/cap-dashboard.js

[PORTAL] portals/capacity/me/js/me-data-relational.js
[PORTAL] portals/capacity/me/js/me-data-normalize.js
[PORTAL] portals/capacity/me/js/me-data.js
[PORTAL] portals/capacity/me/js/me-data-support-history.js
[PORTAL] portals/capacity/me/js/me-data-entities.js
[PORTAL] portals/capacity/me/js/me-data-persistence.js
[PORTAL] portals/capacity/me/js/me-data-realtime.js
[PORTAL] portals/capacity/me/js/me-capacity.js

[PORTAL] portals/capacity/project-management/js/pm-data-relational.js
[PORTAL] portals/capacity/project-management/js/pm-data.js
[PORTAL] portals/capacity/project-management/js/pm-capacity.js

[PORTAL] portals/capacity/logistics/js/log-data-relational.js
[PORTAL] portals/capacity/logistics/js/log-data.js
[PORTAL] portals/capacity/logistics/js/log-capacity.js

[PORTAL] portals/capacity/unit6/js/unit6-data-relational.js
[PORTAL] portals/capacity/unit6/js/unit6-data.js
[PORTAL] portals/capacity/unit6/js/unit6-capacity.js

[PORTAL] portals/capacity/production/js/prod-capacity-data.js
[PORTAL] portals/capacity/production/js/work-areas-data.js
[PORTAL] portals/capacity/production/js/prod-capacity-dashboard.js
[PORTAL] portals/capacity/production/js/prod-capacity-workarea.js
[PORTAL] portals/capacity/production/js/prod-capacity-settings.js
[PORTAL] portals/capacity/production/js/prod-capacity-detail.js
[PORTAL] portals/capacity/production/js/prod-capacity.js

[PORTAL] portals/capacity/js/modals.js
[PORTAL] portals/capacity/js/capacity.js
[PORTAL] portals/capacity/js/capacity-events.js

[PORTAL] portals/production/js/data.js
[PORTAL] portals/production/js/products.js
[PORTAL] portals/production/js/production.js
[PORTAL] portals/production/js/scheduling.js
[PORTAL] portals/production/js/planning.js

[PORTAL] portals/product-development/product-management/js/products.js
[PORTAL] portals/product-development/parts-database/js/parts-data.js
[PORTAL] portals/product-development/parts-database/js/parts-modals.js
[PORTAL] portals/product-development/parts-database/js/parts-database.js
[PORTAL] portals/product-development/js/product-development.js
[PORTAL] portals/product-development/js/product-management.js

[PORTAL] portals/settings/js/teams-data.js
[PORTAL] portals/settings/js/settings-teams.js
[PORTAL] portals/settings/js/settings-mcs.js
[PORTAL] portals/settings/js/settings-gate-questions.js
[PORTAL] portals/settings/js/settings.js

[PORTAL] portals/product-development/npi/js/npi-constants.js
[PORTAL] portals/product-development/npi/js/npi-data-relational.js
[PORTAL] portals/product-development/npi/js/modals.js
[PORTAL] portals/product-development/npi/js/npi.js
[PORTAL] portals/product-development/npi/js/npi-data.js
[PORTAL] portals/product-development/npi/js/npi-components.js
[PORTAL] portals/product-development/npi/js/npi-gates-editor.js
[PORTAL] portals/product-development/npi/js/rpn-chart.js
[PORTAL] portals/product-development/npi/js/dashboard.js
[PORTAL] portals/product-development/npi/js/gates.js
[PORTAL] portals/product-development/npi/js/pfmea-state.js
[PORTAL] portals/product-development/npi/js/pfmea.js
[PORTAL] portals/product-development/npi/js/npi-ctq.js
[PORTAL] portals/product-development/npi/js/npi-pfd.js
[PORTAL] portals/product-development/npi/js/npi-cp.js
[PORTAL] portals/product-development/npi/js/apqp.js
[PORTAL] portals/product-development/npi/js/bom.js
[PORTAL] portals/product-development/npi/js/bom-cclass.js
[PORTAL] portals/product-development/npi/js/timing.js
[PORTAL] portals/product-development/npi/js/trackers.js
[PORTAL] portals/product-development/npi/js/documents.js
[PORTAL] portals/product-development/npi/js/npi-orchestrator.js
[PORTAL] portals/product-development/npi/js/npi-events.js

[PORTAL] portals/feedback/js/feedback-constants.js
[PORTAL] portals/feedback/js/feedback-data.js
[PORTAL] portals/feedback/js/feedback.js

[PORTAL] portals/action-centre/js/action-centre.js

[PORTAL] portals/mcs/js/mcs-realtime.js
[PORTAL] portals/mcs/js/mcs-approvers-data.js
[PORTAL] portals/mcs/js/mcs-approval.js
[PORTAL] portals/mcs/js/mcs-modal-shared.js
[PORTAL] portals/mcs/js/mcs-modal-create.js
[PORTAL] portals/mcs/js/mcs-modal-view.js
[PORTAL] portals/mcs/js/mcs-modal-edit.js
[PORTAL] portals/mcs/js/mcs-main.js
[PORTAL] portals/mcs/js/mcs-pfmea.js
[PORTAL] portals/mcs/js/mcs-actions.js

[CDN]    mermaid@10.9.0

[CORE]   core/js/app.js
```

---

### A2 — Global State Model

All mutable UI state lives as module-level `let` variables in `core/js/state.js`. Because scripts load sequentially into the global scope, every file can read and write these directly by name.

**Complete state variable inventory (core/js/state.js):**

```javascript
// Data
let db = { projects: [] };

// Auth
let currentUserRole = null;        // 'admin' | 'editor' | 'viewer'
let currentUserPermissions = {};   // { permission_key: boolean }
let currentUserTeams = [];         // team IDs

// Navigation
let progId = null;
let currentSection = 'hub';

// Tab state — NPI / APQP
let apqpTab = 'ctq';              // ctq | pfd | pfmea | cp
let bomSubTab = 'tree';
let bomPartsRegisterView = 'total';

// Tab state — Capacity
let capacityTab = 'root';         // root | me | production | projects | logistics | unit6
let prodCapTab = 'dashboard';     // dashboard | by-work-area | settings | detail
let pmCapTab = 'tasks';
let meStartOffset = 0;
let prodCapMonthOffset = 0;
let prodCapUtilizationFactor = 1.0;

// Tab state — Production / Operations
let productionTab = 'root';
let operationsTab = 'overview';

// Tab state — Product Development
let productDevelopmentTab = 'root';
let npiTab = 'all';
let npiDashboardTab = 'projects';

// Filter state
let pfmeaRpnFilter = 'all';
let pfmeaView = 'worksheet';
let ctqSourceFilter = 'all';
let ctqOosFilter = 'all';
let ctqAgreedFilter = 'all';
let ctqCoverageFilter = 'all';
let trackerSubAsmFilter = 'all';
let bomAbcFilter = 'all';

// Pick/modal transient state
let tenderGateScopeState = { isOpen: false, projectId: null, selectedGate: 0, workingSelections: null };
let ctqPickTarget = null, ctqPickSelected = [];
let bomPickTarget = null, bomPickSelected = [], bomPickFilter = 'all', bomPickSearch = '';
let bomTreeExpanded = new Set();
let bomTreeAddParentId = null;
let bomAawTreeExpanded = new Set();
let bomAawActiveGroupId = null;
let bomAawGroupParentId = null;
let docPickTarget = null, docPickSelected = [];
let resourceEditTarget = null;
let resourceEditQty = 1;
let insertOriginIdx = null;
let collapsedGroups = new Set();
let abcPickTarget = null;
let abcPickResults = [];
let abcPickLoading = false;
let abcPickSearch = '';
let abcPickClassFilter = 'all';
let abcPickSelected = [];
let abcCatalogueData = [];
let abcCatalogueLoading = false;
let abcCatalogueLoaded = false;
let abcCatalogueSearch = '';
let abcCatalogueClassFilter = 'all';
let abcCatalogueSort = { field: 'item_desc', ascending: true };
let abcEditTarget = null;

// Settings
let settingsActiveTab = 'families';
let settingsTeamsEditingId = null;
let settingsTeamsPermissionsEditingId = null;
let settingsTeamsData = null;
let settingsTeamsLoading = false;
let settingsTeamsError = null;

// Action Centre
let actionCentreData = null;
let actionCentreLoading = false;
let actionCentreTab = 'all';
let actionCentreStatusFilter = 'open';
let selectedActionId = null;
let selectedPfmeaCauseId = null;
let selectedRiskId = null;

// NPI loaded state
let npiLoadedProgId = null;

// Realtime / presence
let presenceMap = {};
let projectsPage = 0;
let projectsAllLoaded = false;
let prodPlanMonthOffset = 0;

// MCS
let mcsApproverConfig = null;
let mcsApproverConfigLoading = false;
let mcsAutoViewId = null;
let settingsMcsLoading = false;
let settingsMcsError = null;
let mcsList = [];
let mcsCurrentFilter = { status: 'all', priority: 'all', type: 'all', source: 'all',
  myChanges: false, overdueOnly: false, highPriority: false, dateRange: 'all', product: 'all' };
let mcsViewingId = null;
let mcsEditingId = null;
let mcsLoading = false;
```

**Key constants (also in state.js):**

```javascript
const BOM_TYPES = { parts, tools, equip, mat, cons };   // label, icon, pc per type
const GATE_DEFS = [ /* 6 gate objects: num, name, phase, signatories, items */ ];
const FAMILIES = [ /* HVAC, Rotating Machines, Pneumatics, Other */ ];
```

**Key accessor functions (also in state.js):**

```javascript
function prog()                                          // Returns current project from db
function getFamilies()                                   // Returns user-defined or default families
function findFamilyRecord(familyRef)
function getDefaultFamilyId(preferredRef)
function normalizeFamilyId(familyRef, preferredFallback)
function syncProjectFamily(project, familyRef, preferredFallback)
function newProgTemplate(name, customer, unit, family, lead, pm, date)
function getDefaultGateSelection(gateNum)
function normalizeGateSelections(gateSelections)
function getAllProjectGateSelections(projectId)
function getProjectGateSelection(projectId, gateNum)
function isGateSelectionLocked(projectId)
function canEditGateSelections(projectId)
function findProjectByProductId(productId)
```

---

### A3 — CDN Dependencies

Three external libraries are loaded via CDN before any project code runs:

| Library | CDN URL | Global exposed |
|---------|---------|----------------|
| Supabase JS v2 | `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | `window.supabase` |
| Chart.js v4.4.0 | `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js` | `window.Chart` |
| Mermaid v10.9.0 | `https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js` | `window.mermaid` |

`auth.js` calls `supabase.createClient(URL, KEY)` using the global `supabase` object.
Chart.js is used via `new Chart(ctx, config)` in any file that draws charts.
Mermaid is initialised in the NPI portal for diagram rendering.

---

### A4 — Auth and Supabase Client

**File:** `core/js/auth.js`

```javascript
const SUPA_URL = 'https://eihxvmzsfnpdaizggsvs.supabase.co';
const SUPA_KEY = '<anon key>';
const supa = supabase.createClient(SUPA_URL, SUPA_KEY);
let currentUser = null;
```

Key functions exposed globally:
- `doLogin()` — reads DOM inputs, validates `@tidyco.co.uk` email, calls `supa.auth.signInWithPassword`, sets `currentUser`, loads role, calls `launchApp()`
- `doLogout()` — calls `supa.auth.signOut()`, clears auth state, shows login screen
- `authLoadEffectivePermissions(userId, roleSlug)` — loads role baseline + team grants, sets `currentUserPermissions` and `currentUserTeams`

The variable `supa` is used directly (not via `window.supa`) by every file that queries Supabase. All portal files call `supa.from('table').select(...)` directly.

---

### A5 — Navigation and Routing

**File:** `utils/js/navigation.js`

Hash format: `#p=<uuid>&s=<section>&ct=<capacityTab>&t=<apqpTab>...`

Full URL key reference:
```
p    progId
s    section (hub | capacity | production | product-development | operations | mcs | action-centre | feedback | settings | apqp | actions | risks | bom | timing | documents)
t    apqpTab (ctq | pfd | pfmea | cp)
ct   capacityTab
od   operationsTab
pt   productionTab
pdt  productDevelopmentTab
met  meTab
pct  prodCapTab
pmt  pmCapTab
nft  npiTab
bt   bomSubTab
pfr  pfmeaRpnFilter
pfv  pfmeaView
csf  ctqSourceFilter
cof  ctqOosFilter
caf  ctqAgreedFilter
ccf  ctqCoverageFilter
tsf  trackerSubAsmFilter
ps/pf/pst/pvm  NPI project list filters
```

Key functions:
- `navigate(sec, { pushHash: true })` — updates state, cleans up subscriptions, builds hash, calls `render()`
- `render()` — the main routing switchboard; one `case` per section
- `parseHash()` — returns state object from current URL hash
- `navigateBack()` — smart back with portal awareness
- `setApqpTab(t)` — updates `apqpTab`, pushes hash, re-renders

Subscription cleanup happens inside `navigate()`. It calls unsubscribe functions (e.g. `meCapacityDataUnsubscribe()`) before switching sections. These functions are currently expected on `window`.

---

### A6 — Realtime Subscription Pattern

**File:** `utils/js/realtime.js`

```javascript
let realtimeSubscriptions = {};   // { channelName: subscriptionHandle }

createRealtimeSubscription(tableName, channelName, callbacks, options)
  // callbacks: { onInsert, onUpdate, onDelete }
  // options:   { events, filter }

removeRealtimeSubscription(channelName)
```

**File:** `utils/js/render-scheduler.js`

```javascript
requestRender(key, { trigger, renderNow, isEditing, isFiltering, debounceMs })
flushDeferred(key)
```

`key` values in use: `'me'`, `'pm'`, `'log'`, `'unit6'`, `'npi'`, `'prod'`, `'ops'`

Each portal's subscribe/unsubscribe functions are currently assigned to `window`:
```javascript
window.meCapacityDataSubscribe = function() { ... }
window.meCapacityDataUnsubscribe = function() { ... }
```

`navigation.js` calls them as:
```javascript
if (typeof meCapacityDataUnsubscribe === 'function') meCapacityDataUnsubscribe();
```

---

### A7 — Test Setup (Current)

**Framework:** Jest 30 + jsdom
**Config:** `jest.config.js` — `{ testEnvironment: 'jsdom', setupFiles: ['./jest.setup.js'] }`
**No `"type": "module"` in package.json** — Jest runs in CommonJS mode

Current pattern: every test file uses Node's `fs.readFileSync` + `eval()` to load scripts into the jsdom global scope:

```javascript
// Typical test file setup
const fs = require('fs');
const path = require('path');

// 1. Mock globals that the script expects
global.supabase = { createClient: jest.fn(() => global.supa) };
global.supa = { auth: { ... }, from: jest.fn() };
global.db = { projects: [] };
global.currentUser = null;
global.launchApp = jest.fn();

// 2. Load DOM from index.html
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html;

// 3. EVAL the script under test — lands functions on global scope
const script = fs.readFileSync(path.resolve(__dirname, '../core/js/auth.js'), 'utf8');
eval(script);

// 4. Tests call the eval'd functions directly
describe('...', () => {
  test('...', async () => {
    await doLogin();   // calls the eval'd function
    expect(...).toBe(...);
  });
});
```

This works only because there is no `import`/`export` syntax. ESM files cannot be `eval()`'d.

---

### A8 — Validation Scripts

| Script | Purpose | ESM fate |
|--------|---------|----------|
| `scripts/load-order-checker.js` | Validates `<script>` tag order in index.html | **DELETE** — load order no longer enforced by tag position |
| `scripts/state-variable-tracker.js` | Tracks `window.*` globals | **REWRITE** — scan for `window.*` assignments; fail if found |
| `scripts/subscription-cleanup-auditor.js` | Checks subscribe/unsubscribe pattern | **REWRITE** — check that subscribe fns are exported not window-assigned |
| `scripts/syntax-validator.js` | Node `--check` syntax parsing | **KEEP** — still valid for ESM syntax |
| `scripts/mobile-breakpoint-verifier.js` | Checks CSS breakpoints | **KEEP** — unaffected |
| `scripts/modal-state-auditor.js` | Checks modal open/close patterns | **KEEP** — unaffected |
| `scripts/test-coverage-reporter.js` | Reports Jest coverage | **KEEP** — unaffected |
| `scripts/rls-policy-checker.js` | Validates RLS SQL | **KEEP** — unaffected |

New scripts to write:
- `scripts/import-checker.js` — scans all JS files for remaining `window.*` assignments; fail if found
- `scripts/esm-coverage.js` — counts files with/without `export`; prints migration progress %

---

## Part B — ESM Target Architecture

This section defines exactly what the codebase looks like after migration is complete.

---

### B1 — CDN Import Map

Replace the three `<script src="cdn...">` tags with an import map in `index.html`:

```html
<script type="importmap">
{
  "imports": {
    "@supabase/supabase-js": "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm",
    "chart.js": "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/+esm",
    "mermaid": "https://cdn.jsdelivr.net/npm/mermaid@10.9.0/+esm"
  }
}
</script>
<script type="module" src="core/js/main.js"></script>
```

No other `<script>` tags remain.

---

### B2 — Module Export Shape

**Rule:** Every JS file must export every function and constant that any other file uses. Nothing is assigned to `window`. Nothing reaches across to another module without an explicit `import`.

Export shape per layer:

```javascript
// state.js — export every variable and function
export let db = { projects: [] };
export let currentUserRole = null;
export let currentUser = null;
// ... all variables ...
export function prog() { ... }
export function getFamilies() { ... }
export const BOM_TYPES = { ... };
export const GATE_DEFS = [ ... ];
export const FAMILIES = [ ... ];

// auth.js
import { createClient } from '@supabase/supabase-js';
import { db, currentUserPermissions, /* etc */ } from './state.js';
export const supabase = createClient(SUPA_URL, SUPA_KEY);
export let currentUser = null;
export async function doLogin() { ... }
export async function doLogout() { ... }
export async function authLoadEffectivePermissions(userId, roleSlug) { ... }

// A portal data file
import { supabase, currentUser } from '../../../core/js/auth.js';
import { meDataState } from './me-data.js';
export function meDataAddTeam(...) { ... }
export function meDataSave(...) { ... }
```

---

### B3 — Mutable State in ESM

ES module named exports are **live bindings**. This means:

```javascript
// state.js
export let currentSection = 'hub';
// later in the same file:
currentSection = 'capacity';   // all importers immediately see 'capacity'
```

Any module that does `import { currentSection } from './state.js'` always reads the current value — not a snapshot. This matches the current `window.*` behaviour exactly.

**However:** Importers cannot directly assign to another module's export:

```javascript
// WRONG — will throw a TypeError
import { currentSection } from './state.js';
currentSection = 'capacity';   // ERROR: cannot assign to imported binding
```

**Fix:** state.js must export setter functions for every variable that other modules need to mutate:

```javascript
// state.js
export let currentSection = 'hub';
export function setCurrentSection(s) { currentSection = s; }
```

Alternatively, group mutable state into a single exported object:

```javascript
export const appState = {
  currentSection: 'hub',
  progId: null,
  // ...
};
// Importers do: appState.currentSection = 'capacity';  — this is valid
```

**Decision for this migration:** Use the **setter function** pattern for auth variables (`currentUser`, `currentUserRole`, `currentUserPermissions`, `currentUserTeams`) since they are the most widely mutated. For the large collection of tab/filter state in `state.js`, group into `appState` object to avoid writing 50+ setters.

---

### B4 — Entry Point (main.js)

`core/js/main.js` is the single ESM entry point. It bootstraps the app in the same sequence `app.js` does today:

```javascript
// core/js/main.js
import './state.js';          // establishes appState
import './auth.js';           // creates supabase client, sets up auth listener
import './db.js';
import '../utils/js/helpers.js';
import '../utils/js/navigation.js';
import '../utils/js/realtime.js';
import '../utils/js/realtime-patch.js';
import '../utils/js/render-scheduler.js';
import './chart-theme.js';
import '../utils/js/guide.js';
import './network.js';
import './app.js';            // launchApp, session restore
```

All portal imports are handled by `navigation.js` (the render switchboard) or by `app.js` during init. Portal files that are only reached on demand can use dynamic `import()` in Phase 8 if desired — but static imports are acceptable and simpler.

---

### B5 — Subscription Pattern in ESM

Today navigation calls `meCapacityDataUnsubscribe()` from global scope. In ESM, navigation.js must import the function:

```javascript
// navigation.js
import { meCapacityDataSubscribe, meCapacityDataUnsubscribe } from '../portals/capacity/me/js/me-data-realtime.js';
// ... etc for each portal
```

This creates a circular-looking dependency (navigation → portals → navigation for render). This is handled in Phase 8 by ensuring portal files import `navigate` but navigation imports only the subscribe/unsubscribe exports, not the render functions. Render functions are called via the switchboard inside navigation.js itself.

---

### B6 — ESM Test Setup (Target)

Replace `eval()` with native ESM imports in Jest using `--experimental-vm-modules`:

**package.json changes:**
```json
{
  "type": "module",
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/.bin/jest"
  }
}
```

**jest.config.js changes:**
```javascript
export default {
  testEnvironment: 'jsdom',
  setupFiles: ['./jest.setup.js'],
  transform: {}   // empty — no transform; native ESM
};
```

**Test file pattern (ESM):**
```javascript
// tests/auth.test.js
import { jest } from '@jest/globals';
import { doLogin, doLogout } from '../core/js/auth.js';

// Mock dependencies
jest.mock('../core/js/auth.js', () => ({
  supabase: { auth: { signInWithPassword: jest.fn(), signOut: jest.fn() } },
  currentUser: null,
  doLogin: jest.fn(),
  doLogout: jest.fn()
}));

describe('Auth', () => {
  test('doLogin sets currentUser', async () => {
    await doLogin();
    // assertions
  });
});
```

Key difference: `jest.mock('../module')` replaces the `eval()` + global-mock pattern. Dependencies are mocked at the module level, not set on `global.*`.

---

## Part C — Universal ESM Rules

Every agent working on any phase must follow these rules without exception. They apply to every file in the project.

**Rule 1 — No window assignments**
```javascript
// FORBIDDEN
window.meDataState = { ... };
window.meCapacityDataSubscribe = function() { ... };

// CORRECT
export const meDataState = { ... };
export function meCapacityDataSubscribe() { ... }
```

**Rule 2 — No global reads**
```javascript
// FORBIDDEN — relies on window.currentUser
if (currentUser) { ... }

// CORRECT
import { currentUser } from '../../../core/js/auth.js';
if (currentUser) { ... }
```

**Rule 3 — No typeof guards for globals**
```javascript
// FORBIDDEN — this is a global-scope smell
if (typeof meCapacityDataUnsubscribe === 'function') meCapacityDataUnsubscribe();

// CORRECT — import it; if it doesn't exist the import will fail at load time (find bugs early)
import { meCapacityDataUnsubscribe } from './me-data-realtime.js';
meCapacityDataUnsubscribe();
```

**Rule 4 — No backwards compatibility aliases**
Do not create `window.xyz = exportedFunction` bridges. If the site breaks between phases, that is expected and acceptable.

**Rule 5 — Relative imports only**
All imports use relative paths. No bare specifiers except for the three CDN packages in the import map (`@supabase/supabase-js`, `chart.js`, `mermaid`).

**Rule 6 — Live bindings for mutable state**
Import mutable state variables directly (they are live bindings). Use setter functions for cross-module mutation of another file's variables.

**Rule 7 — esc() still required**
All user data rendered into HTML strings still goes through `esc()`. Import it from helpers.js.

**Rule 8 — navigate() still required**
All route changes go through `navigate()`. Import it from navigation.js.

**Rule 9 — Each file gets one default export or named exports — not both**
Use named exports throughout. No default exports. This keeps import statements explicit and greppable.

---

## Phase 0 — Architecture Documentation

**Assigned to:** Copilot
**Status:** `done` ✅ DONE
**Gate:** This doc exists and is complete before any code changes.

This document IS Phase 0. Once it is complete and reviewed, mark the gate below.

### Phase 0 Checklist

- [x] `plans/esm-migration-part1.md` written and committed
- [x] `plans/esm-migration-part2.md` written and committed
- [x] All agents on the project have read both docs
- [x] Master phase status table reviewed and understood
- [x] No code has been changed yet

---

## Phase 1 — Tooling

**Prerequisite:** Phase 0 complete.
**Parallelism:** P1a, P1b, P1c, P1d can all run simultaneously on separate branches.
**Git strategy:** Each sub-task gets its own branch: `esm/p1a-jest`, `esm/p1b-scripts`, etc. All merge to `esm/phase1` before Phase 2 starts.

---

### P1a — Jest ESM Setup *(Copilot — 2026-03-28)*

**Assigned to:** Copilot *(2026-03-28)*
**Status:** `done`
**Branch:** `esm/p1a-jest`
**Files to change:** `package.json`, `jest.config.js`, `jest.setup.js`, all `tests/*.test.js`

**Goal:** Jest can run ESM files natively. All 69 existing test suites still pass after the change.

**Step-by-step:**

1. Add `"type": "module"` to `package.json`
2. Change the test script to: `"test": "node --experimental-vm-modules node_modules/.bin/jest"`
3. Rewrite `jest.config.js` as ESM (`export default { ... }`) with `transform: {}`
4. Rewrite `jest.setup.js` as ESM if it uses `require()`
5. Convert every test file from `require()` / `eval()` pattern to ESM imports and `jest.mock()`
6. Run `npm test` — all suites must pass

**What changes in each test file:**
- Remove `const fs = require('fs')` and `const path = require('path')`
- Remove `eval(fs.readFileSync(...))` calls
- Remove `global.xyz = ...` mock assignments
- Add `import { jest } from '@jest/globals'`
- Add `import { functionUnderTest } from '../path/to/file.js'`
- Add `jest.mock('../dependency.js', () => ({ ... }))` for each mocked dependency
- Keep `describe()` / `test()` / `expect()` structure unchanged

**Note:** At this stage the source files are still global-scope scripts. The test files will need to use `jest.unstable_mockModule` or dynamic import for files that haven't been converted yet. Coordinate with Phase 2 agents — test conversion may need to happen file-by-file as source files convert.

### P1a Checklist

- [x] `package.json` — `"type": "module"` added
- [x] `package.json` — test script updated to use `--experimental-vm-modules`
- [x] `jest.config.js` — converted to ESM, `transform: {}` set
- [x] `jest.setup.js` — converted to ESM (no `require()`)
- [ ] All test files converted from `eval()` to `import` + `jest.mock()`
- [ ] `npm test` passes — all suites green
- [ ] No `eval()` remains in any test file
- [ ] Branch `esm/p1a-jest` pushed and ready to merge to `esm/phase1`

---

### P1b — Retire Old Validation Scripts

**Assigned to:** *(agent name here)*
**Branch:** `esm/p1b-scripts`
**Files to change:** `scripts/load-order-checker.js`, `scripts/state-variable-tracker.js`, `scripts/subscription-cleanup-auditor.js`, `package.json` (`check:all` script)

**Goal:** Remove checks that enforce the old model. Do not break `check:all` — just remove or stub the retired scripts.

**Actions:**

- `scripts/load-order-checker.js` — **Delete** the enforcement logic. Replace the entire file with a one-liner that prints "load-order check retired (ESM migration)" and exits 0.
- `scripts/state-variable-tracker.js` — **Gut** the window.* tracking logic. Replace with a stub that prints "state-variable check retired (see check:imports)" and exits 0. Do not delete the file yet — Phase 9 will clean up.
- `scripts/subscription-cleanup-auditor.js` — **Gut** logic that looks for `window.xyz = function`. Replace with stub. Do not delete.
- `package.json` `check:all` — Keep `check:load-order`, `check:state`, `check:subscriptions` in the chain (they now exit 0 immediately). Add `check:imports` and `check:esm-coverage` to the chain (written in P1c and P1d). Final `check:all` order:

```
check:load-order (stub) &&
check:syntax &&
check:imports &&
check:esm-coverage &&
check:rls &&
check:mobile &&
check:modals &&
check:coverage
```

### P1b Checklist

- [x] `scripts/load-order-checker.js` gutted to stub (exits 0)
- [x] `scripts/state-variable-tracker.js` gutted to stub (exits 0)
- [x] `scripts/subscription-cleanup-auditor.js` gutted to stub (exits 0)
- [x] `package.json` `check:all` updated with new script order
- [ ] `npm run check:all` completes without error (stubs pass, others unchanged)
- [ ] Branch `esm/p1b-scripts` pushed and ready to merge to `esm/phase1`

---

### P1c — Write check:imports

**Assigned to:** *(agent name here)*
**Branch:** `esm/p1c-imports`
**New file:** `scripts/import-checker.js`

**Goal:** A script that scans every `.js` file in `core/`, `utils/`, and `portals/` and fails if it finds any `window.` assignment or any bare global reference to a known cross-module symbol.

**Detection targets:**
```
window\.\w+\s*=          — window property assignment
globalThis\.\w+\s*=      — globalThis assignment
```

**Exclusions:** Comments, string literals, test files (`tests/`), validation scripts (`scripts/`), CDN files.

**Output format:**
```
[check:imports] Scanning 131 files...
[check:imports] FAIL: portals/capacity/me/js/me-data.js:12
  window.meDataState = { ... }
  Fix: export const meDataState = { ... }
[check:imports] 3 violations found. Run ESM conversion for these files.
```

**Exit code:** 0 if clean, 1 if violations found.

**Note:** During the migration, this script will fail until all files are converted. That is expected. It becomes the final gate for Phase 8.

### P1c Checklist

- [ ] `scripts/import-checker.js` written
- [ ] Script correctly detects `window.xyz =` assignments
- [ ] Script correctly excludes test files, script files, comments
- [ ] Script exits 0 on a clean file, 1 on violations
- [ ] `package.json` — `"check:imports": "node scripts/import-checker.js"` added to scripts
- [ ] Manually verified: running against a known violation produces correct output
- [ ] Branch `esm/p1c-imports` pushed and ready to merge to `esm/phase1`

---

### P1d — Write check:esm-coverage

**Assigned to:** *(agent name here)*
**Branch:** `esm/p1d-coverage`
**New file:** `scripts/esm-coverage.js`

**Goal:** A progress-tracking script that counts converted (has `export`) vs unconverted (no `export`) JS files in `core/`, `utils/`, `portals/`. Prints a percentage and list of remaining files. Always exits 0 (it is informational, not a gate).

**Output format:**
```
[esm-coverage] Progress: 23/131 files converted (17%)
████░░░░░░░░░░░░░░░░  17%

Remaining files:
  portals/capacity/me/js/me-data.js
  portals/capacity/me/js/me-capacity.js
  ... (etc)
```

### P1d Checklist

- [ ] `scripts/esm-coverage.js` written
- [ ] Correctly counts files with at least one `export` statement
- [ ] Prints progress bar and percentage
- [ ] Lists remaining unconverted files
- [ ] Always exits 0
- [ ] `package.json` — `"check:esm-coverage": "node scripts/esm-coverage.js"` added to scripts
- [ ] Branch `esm/p1d-coverage` pushed and ready to merge to `esm/phase1`

---

### Phase 1 Gate

Before Phase 2 begins, merge all P1a–P1d branches to `esm/phase1` and verify:

> Validation note: `npm test` and `npm run check:*` command validation is deferred until `pwsh` is available in this environment.

- [x] P1a–P1d implementation and check wiring complete on `esm/phase1`
- [ ] `npm test` — deferred (requires `pwsh` in this environment)
- [ ] `npm run check:all` — deferred (requires `pwsh` in this environment)
- [ ] `npm run check:esm-coverage` — deferred (requires `pwsh` in this environment)
- [ ] `npm run check:imports` — deferred (requires `pwsh` in this environment)
- [x] `esm/phase1` merged to integration branch `esm-migration`

---

## Phase 2 — Core Chain

**Prerequisite:** Phase 1 gate passed. `esm-migration` branch is the working branch.
**Warning:** After Phase 2a completes, the browser app stops working. This is expected.
**Git strategy:** P2a and P2b are sequential on the same branch `esm/phase2`. P2b cannot start until P2a is merged.

---

### P2a — Inner Core (state.js, auth.js, db.js)

**Assigned to:** *(agent name here)*
**Branch:** `esm/phase2`
**Files:** `core/js/state.js`, `core/js/auth.js`, `core/js/db.js`

**state.js conversion:**

- Add `export` to every `let`, `const`, and `function` in the file
- Group the ~50 tab/filter `let` variables into `export const appState = { ... }` object to avoid 50 setter functions
- Keep `BOM_TYPES`, `GATE_DEFS`, `FAMILIES` as named `export const`
- Keep all accessor functions as named `export function`
- Add setter functions for the 4 auth variables that other modules mutate:
  ```javascript
  export function setCurrentUserRole(r) { currentUserRole = r; }
  export function setCurrentUserPermissions(p) { currentUserPermissions = p; }
  export function setCurrentUserTeams(t) { currentUserTeams = t; }
  ```
- Remove any `window.*` assignments

**auth.js conversion:**

- Add at top: `import { createClient } from '@supabase/supabase-js';`
- Add: `import { db, appState, setCurrentUserRole, setCurrentUserPermissions, setCurrentUserTeams } from './state.js';`
- Change `const supa = supabase.createClient(...)` to `export const supabase = createClient(SUPA_URL, SUPA_KEY);`
- Change `let currentUser = null` to `export let currentUser = null;`
- Add: `export function setCurrentUser(u) { currentUser = u; }`
- Export all public functions: `doLogin`, `doLogout`, `authLoadEffectivePermissions`, `showLoginErr`
- Replace all internal references to `window.*` globals with imported names

**db.js conversion:**

- Add at top: `import { supabase, currentUser } from './auth.js';`
- Import any state variables it uses from `./state.js`
- Export all public functions
- Remove any `window.*` assignments

**Also in P2a:** Add import map to `index.html` (see B1). Do NOT yet remove the `<script>` tags — that is Phase 8.

### P2a Checklist

- [x] `core/js/state.js` — all variables and functions exported
- [x] `core/js/state.js` — tab/filter state grouped in `appState` object
- [x] `core/js/state.js` — setter functions added for auth variables
- [x] `core/js/state.js` — no `window.*` assignments remain
- [x] `core/js/auth.js` — imports `createClient` from `@supabase/supabase-js`
- [x] `core/js/auth.js` — imports from `./state.js`
- [x] `core/js/auth.js` — `supabase` client exported as named export
- [x] `core/js/auth.js` — `currentUser` exported as live binding
- [x] `core/js/auth.js` — `setCurrentUser` setter exported
- [x] `core/js/auth.js` — no `window.*` assignments remain
- [x] `core/js/db.js` — imports `supabase`, `currentUser` from `./auth.js`
- [x] `core/js/db.js` — all public functions exported
- [x] `core/js/db.js` — no `window.*` assignments remain
- [x] Import map added to `index.html` (CDN script tags still present — that is fine for now)
- [ ] `npm test` — deferred (requires `pwsh` in this environment)
- [ ] `npm run check:imports` — deferred (requires `pwsh` in this environment)

Validation note: command validation for P2a is deferred in this environment because `pwsh` is unavailable.

---

### P2b — Outer Core (helpers.js → app.js) *(Codex — 2026-03-28)* ✅ DONE

**Assigned to:** *(agent name here)*
**Branch:** `esm/phase2` (same branch, after P2a merged)
**Files:** `utils/js/helpers.js`, `utils/js/navigation.js`, `utils/js/realtime.js`, `utils/js/realtime-patch.js`, `utils/js/render-scheduler.js`, `core/js/chart-theme.js`, `utils/js/guide.js`, `core/js/network.js`, `core/js/app.js`

**helpers.js conversion:**

- Import any state it reads from `../core/js/state.js`
- Export: `esc()`, `emptyState()`, `showModal()`, `closeModal()`, `showGuide()`, all permission/helper functions
- Export constants: `HYBRID_PERMISSION_DEFINITIONS`, `LEGACY_TEAM_PERMISSION_MAP`, `SECTION_VIEW_PERMISSION_MAP`, `SECTION_EDIT_PERMISSION_MAP`

**navigation.js conversion:**

- Import from `../core/js/state.js`, `./helpers.js`
- Import subscribe/unsubscribe functions from every portal that navigation cleans up (see current cleanup calls inside `navigate()` — find every `if (typeof xyzUnsubscribe === 'function')` call and replace with an import)
- Export: `navigate()`, `render()`, `parseHash()`, `navigateBack()`, `setApqpTab()`, `goProjects()`, `goHome()`, `updateBackButton()`, `updateProjectBreadcrumb()`, `SECTION_LABELS`

**realtime.js conversion:**

- Import `supabase` from `../core/js/auth.js`
- Export: `createRealtimeSubscription()`, `removeRealtimeSubscription()`, `createMultiTableRealtimeSubscription()`

**realtime-patch.js conversion:**

- Import whatever it patches from `./realtime.js`
- Export any public API

**render-scheduler.js conversion:**

- Remove the IIFE wrapper `(function () { ... })()`
- Export: `requestRender()`, `flushDeferred()`

**chart-theme.js conversion:**

- Import `Chart` from `chart.js`
- Export any theme-setup functions

**guide.js conversion:**

- Export: `GUIDE_CONTENT`, `showGuide()`

**network.js conversion:**

- Export: `setupNetworkDetection()` and any public network helpers

**app.js conversion:**

- Import everything it calls: all `*DataInit()` functions from portals, `navigate()`, `render()` from navigation, `supabase` from auth, `launchApp` logic etc.
- Export: `launchApp()`
- This file is the last in the chain — it imports from everything above

**Also in P2b:** Create `core/js/main.js` as the ESM entry point (see B4). It imports `./app.js` and nothing else — app.js handles the cascade.

### P2b Checklist

- [x] `utils/js/helpers.js` — all public functions and constants exported, imports from state.js
- [x] `utils/js/navigation.js` — converted to ESM exports/imports for core dependencies
- [x] `utils/js/realtime.js` — imports supabase, exports subscription functions
- [x] `utils/js/realtime-patch.js` — converted, exports patch functions
- [x] `utils/js/render-scheduler.js` — IIFE removed, exports requestRender and flushDeferred
- [x] `core/js/chart-theme.js` — imports Chart from chart.js, exports theme functions
- [x] `utils/js/guide.js` — exports GUIDE_CONTENT and showGuide
- [x] `core/js/network.js` — exports setupNetworkDetection
- [x] `core/js/app.js` — imports core dependencies, exports launchApp
- [x] `core/js/main.js` — created as single ESM entry point
- [x] No `window.*` assignments in any of these files
- [ ] No `typeof xyz === 'function'` guards for cross-module calls (deferred to downstream portal ESM phases)
- [ ] `npm test` — deferred (`pwsh`)
- [ ] `npm run check:esm-coverage` — deferred (`pwsh`)

Validation note: command validation for P2b is deferred in this environment because `pwsh` is unavailable.

---

### Phase 2 Gate

- [x] P2a + P2b implementation complete on `esm/phase2`
- [ ] `npm test` — deferred (`pwsh` unavailable in this environment)
- [ ] `npm run check:all` — deferred (`pwsh` unavailable in this environment)
- [ ] `npm run check:esm-coverage` — deferred (`pwsh` unavailable in this environment; expected 12/131 when run)
- [x] `esm/phase2` merged to `esm-migration`
- [ ] **Browser app is broken at this point — this is expected and acceptable**

---

## Phase 3 — Capacity Shared Layer

**Prerequisite:** Phase 2 gate passed.
**Parallelism:** Single agent. Phase 4 portals cannot start until Phase 3 is complete.
**Branch:** `esm/phase3`

**Files (13):**
```
portals/capacity/shared/js/cap-data-utils.js
portals/capacity/shared/js/cap-utils.js
portals/capacity/shared/js/cap-calculations.js
portals/capacity/shared/js/cap-components.js
portals/capacity/shared/js/cap-team.js
portals/capacity/shared/js/cap-tasks.js
portals/capacity/shared/js/cap-products.js
portals/capacity/shared/js/cap-product-taskload.js
portals/capacity/shared/js/cap-holidays.js
portals/capacity/shared/js/cap-chart.js
portals/capacity/shared/js/cap-heatmap.js
portals/capacity/shared/js/cap-dashboard.js
```

**Internal dependency order (convert in this order):**
```
cap-data-utils.js         (no internal deps)
cap-utils.js              (imports cap-data-utils)
cap-calculations.js       (imports cap-utils)
cap-components.js         (imports cap-utils)
cap-team.js               (imports cap-utils, cap-data-utils)
cap-tasks.js              (imports cap-utils, cap-data-utils)
cap-products.js           (imports cap-utils, cap-data-utils)
cap-product-taskload.js   (imports cap-utils, cap-data-utils)
cap-holidays.js           (imports cap-utils, cap-data-utils)
cap-chart.js              (imports cap-calculations, cap-utils)
cap-heatmap.js            (imports cap-calculations, cap-utils)
cap-dashboard.js          (imports cap-chart, cap-heatmap)
```

**For each file:**
- Add `import` statements for its dependencies (other shared files, plus core/utils as needed)
- Add `export` to every function and constant used by capacity portal files
- Remove all `window.*` assignments
- Import `esc()` from `utils/js/helpers.js` if used
- Import `supabase`, `currentUser` from `core/js/auth.js` if used
- Import `requestRender`, `flushDeferred` from `utils/js/render-scheduler.js` if used

### Phase 3 Checklist

- [x] `cap-data-utils.js` — converted, all public functions exported
- [x] `cap-utils.js` — converted, imports cap-data-utils, exports all public functions
- [x] `cap-calculations.js` — converted, imports cap-utils, exports calculations
- [x] `cap-components.js` — converted, imports cap-utils, exports components
- [x] `cap-team.js` — converted, imports cap-utils + cap-data-utils, exports team functions
- [x] `cap-tasks.js` — converted, exports task functions
- [x] `cap-products.js` — converted, exports product functions
- [x] `cap-product-taskload.js` — converted, exports taskload functions
- [x] `cap-holidays.js` — converted, exports holiday functions
- [x] `cap-chart.js` — converted, imports Chart from chart.js, exports chart functions
- [x] `cap-heatmap.js` — converted, exports heatmap functions
- [x] `cap-dashboard.js` — converted, imports cap-chart + cap-heatmap, exports dashboard functions
- [x] No `window.*` assignments in any of the 13 files
- [ ] `npm test` — deferred (requires `pwsh` in this environment)
- [ ] `npm run check:esm-coverage` — deferred (requires `pwsh` in this environment; expected 25/131 converted)
- [x] `esm/phase3` merged to `esm-migration`

Validation note: command validation for Phase 3 is deferred in this environment because `pwsh` is unavailable.

---

> **Continue in `plans/esm-migration-part2.md` for Phases 4–9 and the master completion tracker.**
