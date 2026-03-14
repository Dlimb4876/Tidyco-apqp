# LARGE FILE SPLIT PLAN

## Goal
Break two very large files into smaller files that are easier to read, test, and maintain, while keeping behavior exactly the same.

Target files:
1. `portals/operations/js/operations-dashboard.js` (~1,238 lines)
2. `portals/capacity/css/me-capacity.css` (~1,232 lines)

---

## Success Criteria
1. No user-facing behavior changes.
2. Existing global functions still work (especially `window.*` handlers and inline `onclick` usage).
3. Script and CSS load order remains valid in `index.html`.
4. Jest tests still pass.
5. Each new file has one clear responsibility.

---

## Part A: Split `operations-dashboard.js`

## Current Problem
This single file mixes:
1. Realtime subscriptions and refresh orchestration
2. Metric calculations
3. HTML rendering for 6 tabs
4. Forecast table/chart rendering
5. Forecast editing + CRUD event handlers
6. Entry point + global exports

This makes it hard to change one area safely.

## Proposed New JS Files
Create these in `portals/operations/js/`:

1. `operations-dashboard-state.js`
- Local UI state variables currently at top of file
- Shared getters/setters if needed

2. `operations-dashboard-realtime.js`
- `opsScheduleRefresh`
- `opsRefresh*` functions
- `opsRealtimeInit`
- `opsRealtimeCleanup`

3. `operations-dashboard-metrics.js`
- Utility helpers (`opsParseDateSafe`, `opsToNumber`, etc.)
- `opsCalc*` functions
- `opsBuildMetrics`

4. `operations-dashboard-render-core.js`
- Shared render helpers (`opsMetricCard`, pulse/radar/quick actions)
- Overview/flow/risk/people/actions render blocks

5. `operations-dashboard-forecast-view.js`
- Forecast row rendering
- Forecast tab rendering
- Forecast chart rendering

6. `operations-dashboard-forecast-actions.js`
- Inline edit handlers (`opsForecastStartInlineEdit`, cancel/save, keydown)
- Full edit handlers
- CRUD wrappers (`opsForecastSubmit`, `opsForecastDelete`, status updates)

7. `operations-dashboard-main.js`
- `setOperationsTab`
- `setupOpsPulseFeed`
- `renderOperationsDashboard`
- Final `window.*` exports (single place)

## Why this split
1. Calculations are separated from HTML generation.
2. Realtime wiring is isolated from UI code.
3. Forecast feature is grouped as a mini-module.
4. Global exports are controlled in one file.

## Safe Migration Order (JS)
1. Create `operations-dashboard-main.js` first as a thin wrapper calling old functions.
2. Move realtime block to `operations-dashboard-realtime.js`.
3. Move metrics block to `operations-dashboard-metrics.js`.
4. Move forecast render + chart to `operations-dashboard-forecast-view.js`.
5. Move forecast actions to `operations-dashboard-forecast-actions.js`.
6. Move generic render blocks to `operations-dashboard-render-core.js`.
7. Move remaining state helpers to `operations-dashboard-state.js`.
8. Update script tags in `index.html` to load new files in dependency order.
9. Keep old `operations-dashboard.js` temporarily as compatibility shell (optional for one commit), then remove once stable.

## JS Script Order to Add in `index.html`
Place after `operations-forecast-data.js` and before `app.js`, in this order:
1. `operations-dashboard-state.js`
2. `operations-dashboard-metrics.js`
3. `operations-dashboard-realtime.js`
4. `operations-dashboard-render-core.js`
5. `operations-dashboard-forecast-view.js`
6. `operations-dashboard-forecast-actions.js`
7. `operations-dashboard-main.js`

---

## Part B: Split `me-capacity.css`

## Current Problem
One stylesheet includes many independent UI areas:
1. Shell/topbar/nav
2. Table styles
3. Chart/legend styles
4. Holiday planner grid
5. Heatmap + detail modal
6. Dashboard + mini heatmap
7. Responsive rules
8. Advanced estimation modal + PERT + dropdown rows

This makes conflicts likely and slows styling changes.

## Proposed New CSS Files
Create these in `portals/capacity/css/`:

1. `me-capacity-shell.css`
- Shell, topbar, nav, generic cards

2. `me-capacity-tables.css`
- `.me-tbl*`, add row, delete button, category badges, section labels, saving row

3. `me-capacity-chart.css`
- KPI strip, chart container, chart controls, legend, chart wrapper/canvas

4. `me-capacity-holidays.css`
- `.holiday-*` matrix and bank holiday styling

5. `me-capacity-heatmap.css`
- `.me-heatmap-*`
- detail modal (`.me-detail-*`, fade keyframes)

6. `me-capacity-dashboard.css`
- `.me-dashboard-*`
- mini chart/mini heatmap classes

7. `me-capacity-estimation.css`
- advanced modal (`#me-advanced-estimation-modal`, `.me-modal-*`)
- activity editor controls
- complexity sliders
- summary/footer/buttons
- dropdown/subtask rows

8. `me-capacity-responsive.css`
- all `@media` rules only

## Why this split
1. Each visual area is isolated.
2. Future CSS bugs are easier to find.
3. Responsive overrides are centralized.
4. Estimation modal changes no longer risk core table/chart styles.

## Safe Migration Order (CSS)
1. Add new CSS files and copy rules in small chunks.
2. Keep `me-capacity.css` linked during migration.
3. Move one section at a time and remove that section from old file.
4. Add new `<link>` tags in `index.html` directly after `me-capacity.css` initially.
5. After visual verification, remove `me-capacity.css` link.
6. Final cleanup pass for duplicate or unused selectors.

## CSS Link Order to Use in `index.html`
Load in this order to preserve cascade:
1. `me-capacity-shell.css`
2. `me-capacity-tables.css`
3. `me-capacity-chart.css`
4. `me-capacity-holidays.css`
5. `me-capacity-heatmap.css`
6. `me-capacity-dashboard.css`
7. `me-capacity-estimation.css`
8. `me-capacity-responsive.css`

---

## Phase Plan (Low Risk)

### Phase 1: Preparation
1. Create new files with section headers only.
2. Add temporary comments explaining ownership of each file.
3. Do not move logic yet.

### Phase 2: Operations JS Split
1. Move one function group at a time.
2. Refresh app after each move.
3. Keep global names unchanged until final cleanup.

### Phase 3: ME CSS Split
1. Move one CSS section at a time.
2. Check three breakpoints: 375px, 768px, 1920px.
3. Verify tabs: dashboard, chart, holiday planner, heatmap, estimation modal.

### Phase 4: Validation
1. Run `npm test`.
2. Manual smoke checks for operations and ME capacity views.
3. Confirm realtime still updates operations dashboard.

### Phase 5: Cleanup
1. Remove old monolithic files (or keep as stubs for one release).
2. Update `CLAUDE.md` and any docs that mention old single-file structure.

---

## Quick Verification Checklist
1. Operations tabs all render: overview/flow/risk/people/actions/forecast.
2. Forecast inline edit Enter/Escape still works.
3. Forecast chart draws and updates after save/delete/status change.
4. ME chart, holiday matrix, and heatmap render correctly.
5. Advanced estimation modal + PERT table styling intact.
6. Mobile layout still usable with gutters and scrollable tables.

---

## Suggested Commit Sequence
1. `plan: add large-file split strategy`
2. `refactor(operations): split dashboard into focused modules`
3. `refactor(capacity-css): split me-capacity stylesheet by feature area`
4. `docs: update load-order and architecture notes`

This sequence makes review and rollback easier.
