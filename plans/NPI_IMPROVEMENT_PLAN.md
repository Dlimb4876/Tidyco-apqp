# NPI Portal Improvement Checklist

## Context
The NPI portal (`portals/product-development/npi/`) is an 8-file, 1,775-line vanilla JS system with tight coupling and no namespacing. The goal is incremental modernization to match the architecture patterns of the Capacity portal (`portals/capacity/js/`) which uses a clean data/component/feature layer separation. This checklist is ordered for low-risk, incremental delivery.

## Progress Snapshot (2026-03-13)
- Implementation checklist progress (Stages 1-3): **56/56 complete (100%)**
- Full plan progress (including verification): **56/65 complete (~86%)**
- Status: Stages 1, 2, and 3 are complete.

---

## Stage 1: Foundational Cleanup and Standardization

### 1.1 Code Style
- [x] Add `.eslintrc` or `eslint.config.js` at repo root with basic ES6 rules (no-unused-vars, no-undef, eqeqeq)
- [x] Add `.prettierrc` with project style (2-space indent, single quotes, no semicolons to match existing files)
- [x] Run linter across all 8 NPI JS files and log all violations without fixing yet
- [x] Fix violations file-by-file: `rpn-chart.js` → `gates.js` → `trackers.js` → `bom.js` → `timing.js` → `pfmea.js` → `apqp.js` → `dashboard.js`

### 1.2 Centralize Constants
- [x] Audit all hardcoded strings in timing.js (`GANTT_WEEKS=72`, `GANTT_ROLES`, `GANTT_SECTIONS`) — move to `core/js/state.js` or a new `portals/product-development/npi/js/npi-constants.js`
- [x] Audit magic numbers in pfmea.js (RPN threshold `100`, score range `1–10`) — confirm they match `state.js` constants or centralize them
- [x] Audit hardcoded tab names/keys in apqp.js and bom.js (`'parts'`, `'tools'`, etc.) — ensure they reference `BOM_TYPES` from `state.js`
- [x] Add `npi-constants.js` to `index.html` script load order if created (before `rpn-chart.js` at line 312)

### 1.3 Namespace Functions
- [x] Define a global `npi` namespace object in a new `portals/product-development/npi/js/npi.js` file: `window.npi = {}`
- [x] Migrate `gates.js` functions to `npi.gate.*` prefix (6 functions: `gateAllSigned`, `renderGatePage`, `toggleCheck`, `updSig`, `signOff`, `unsign`)
- [x] Migrate `trackers.js` functions to `npi.tracker.*` prefix (7 functions: `renderActions`, `renderRisks`, `addAction`, `updAction`, `delAction`, `addRisk`, `updRisk`, `delRisk`, `refreshRS`)
- [x] Migrate `bom.js` functions to `npi.bom.*` prefix (6 functions: `renderBOM`, `renderBomTable`, `setBomTab`, `addBomRow`, `updBom`, `delBom`)
- [x] Migrate `timing.js` functions to `npi.timing.*` prefix (7 functions: `renderTimingPlan`, `ganttNewRow`, `ganttWeekDate`, `fmtWeekDate`, `toggleMonth`, `buildMonthGroups`)
- [x] Migrate `pfmea.js` functions to `npi.pfmea.*` prefix (all `pf*()` functions)
- [x] Migrate `apqp.js` functions to `npi.apqp.*` prefix (`renderAPQP`, `renderCTQ`, `renderPFD`, `renderCP`, CTQ/PFD mutations)
- [x] Migrate `dashboard.js` functions to `npi.dashboard.*` prefix (all `renderProjects`, `renderDashboard`, project CRUD)
- [x] Update all inline `onclick="functionName()"` HTML strings across all files to use `npi.*.*()` calls
- [x] Update `navigation.js` dispatch calls to use new namespace
- [x] Add `npi.js` to `index.html` script load order before all other NPI JS files (line 311)

---

## Stage 2: Architectural Refactoring

### 2.1 Create a Data Layer (`npi-data.js`)
- [x] Create `portals/product-development/npi/js/npi-data.js`
- [x] Move all data read helpers into it: `prog()` wrappers, `sortedPfd()`, `ganttNewRow()`, and any derived-data functions
- [x] Move all mutation + save helpers: `addCTQ/updCTQ/delCTQ`, `addMainStep`, `addBomRow/updBom/delBom`, `addAction/updAction/delAction`, `addRisk/updRisk/delRisk`, all `pf*` mutations
- [x] Ensure each mutation calls persistence then the appropriate `render*()` — remove direct persistence calls from UI handlers where refactored
- [x] Add `npi-data.js` to `index.html` script load order after `npi.js` (so it's available to all NPI feature files)

### 2.2 Build a Component Library (`npi-components.js`)
- [x] Create `portals/product-development/npi/js/npi-components.js`
- [x] Extract reusable table header builder (used in CTQ, PFD, CP, BOM tables) — implement as `npi.components.tableHeader(cols)`
- [x] Extract status badge renderer (used in dashboard KPIs and tracker) — implement as `npi.components.badge(value, thresholds)`
- [x] Extract RPN badge renderer (shared between pfmea.js and dashboard.js `pfRpnClass/rpnColor`) — move to `npi.components.rpnBadge(rpn)`
- [x] Extract inline edit input pattern (score inputs in PFMEA, weight inputs in trackers) — implement as `npi.components.scoreInput(value, handler)`
- [x] Add `npi-components.js` to `index.html` script load order after `npi-data.js`

### 2.3 Decompose Monolithic Files

#### Split apqp.js (currently handles CTQ + PFD + CP + dispatch)
- [x] Create `portals/product-development/npi/js/npi-ctq.js` — move all CTQ rendering and mutation functions from `apqp.js`
- [x] Create `portals/product-development/npi/js/npi-pfd.js` — move all PFD rendering and mutation functions from `apqp.js`
- [x] Create `portals/product-development/npi/js/npi-cp.js` — move all Control Plan rendering and mutation functions from `apqp.js`
- [x] Reduce `apqp.js` to a pure dispatcher: `renderAPQP()` switches on `apqpTab` and delegates to `npi.ctq.*`, `npi.pfd.*`, `npi.cp.*`, `npi.pfmea.*`
- [x] Add the 3 new files to `index.html` load order before `apqp.js`

#### Refactor rendering functions to use component library
- [x] Update `pfmea.js` table rendering to use `npi.components.rpnBadge()` and `npi.components.scoreInput()`
- [x] Update `dashboard.js` KPI section to use `npi.components.badge()`
- [x] Update `trackers.js` score rendering to use `npi.components.scoreInput()`
- [x] Update all BOM category tables to use `npi.components.tableHeader()`

#### Create `npi-orchestrator.js` entry point
- [x] Create `portals/product-development/npi/js/npi-orchestrator.js` as the main coordinator (analogous to `me-capacity.js`)
- [x] Move tab routing logic from `navigation.js` NPI case into `npi-orchestrator.js::npi.render(tab)`
- [x] Move NPI init logic (currently scattered) into `npi-orchestrator.js::npi.init()`
- [x] Add `npi-orchestrator.js` to `index.html` load order last among NPI files (before `app.js`)
- [x] Update `navigation.js` to call `npi.render(tab)` instead of individual render functions

---

## Stage 3: Modernization and Final Polish

### 3.1 Modernize Event Handling
- [x] Audit all inline `onclick`, `onchange`, `oninput` attributes across NPI HTML template strings
- [x] Replace with `addEventListener` using event delegation per container — add `data-action` attributes to interactive elements
- [x] Implement a single delegated listener in each feature module (pattern: `container.addEventListener('click', e => { const action = e.target.dataset.action; ... })`)
- [x] Remove all inline handler strings from HTML generation functions

### 3.2 Improve State Management
- [x] Define a lightweight reactive helper in `npi.js`: `npi.watch(key, callback)` that triggers callbacks when `prog()[key]` changes
- [x] Replace explicit `render*()` calls after mutations with `npi.notify(key)` signals
- [x] Update all mutation functions in `npi-data.js` to call `npi.notify()` instead of direct render calls
- [x] Wire render functions as subscribers via `npi.watch()` on init

### 3.3 Adopt Async/Await
- [x] Audit all NPI data save calls — confirm they already use the debounced `save()` from `db.js` (async-safe)
- [x] Convert any remaining synchronous Supabase calls in NPI-related code to `async/await`
- [x] Add `async/await` error handling (`try/catch`) around Supabase operations in `npi-data.js`
- [x] Ensure `npi.init()` in `npi-orchestrator.js` is `async` and awaits data load before first render

---

## Verification Steps (per stage)

### After Stage 1
- [ ] Open app in browser — all NPI tabs render without console errors
- [ ] Create a project, edit CTQ/PFMEA/BOM/Gates — all saves work
- [ ] Verify `npi.*.*` calls work in browser console

### After Stage 2
- [ ] All 6 NPI tabs (Dashboard, APQP/CTQ, PFD, PFMEA, CP, Gates, BOM, Timing, Trackers) render correctly
- [ ] No regressions in PFMEA RPN calculations or gate sign-off flow
- [ ] Check `index.html` load order has no undefined function errors

### After Stage 3
- [ ] Click all interactive elements — no broken event handlers
- [ ] Simulate slow network: confirm async error handling shows graceful failure, not JS crash
- [ ] Run through full APQP workflow: create project → fill PFMEA → implement action → sign gate

---

## Critical Files

| File | Role |
|------|------|
| `portals/product-development/npi/js/` | All NPI JS modules |
| `index.html` | Script load order (lines 311–367) |
| `utils/js/navigation.js` | NPI tab dispatch |
| `core/js/state.js` | Shared constants (GATE_DEFS, BOM_TYPES, FAMILIES) |
| `core/js/db.js` | `save()` debounce function |
| `utils/js/helpers.js` | `esc()`, `showModal()`, `closeModal()` |
| `portals/capacity/js/me-capacity.js` | Reference orchestrator pattern |
| `portals/capacity/js/me-components.js` | Reference component library pattern |
| `portals/capacity/js/me-data.js` | Reference data layer pattern |
