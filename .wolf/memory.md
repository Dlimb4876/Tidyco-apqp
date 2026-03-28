# Memory

> Chronological action log. Hooks and AI append to this file automatically.
> Old sessions are consolidated by the daemon weekly.

## 2026-03-21
## 2026-03-23
## 2026-03-24
## 2026-03-25
- Fixed load-order checker warnings by moving `core/js/chart-theme.js` and `utils/js/guide.js` in `index.html` to load after the core chain (`state/auth/db/helpers/navigation/realtime`); validated with `npm run check:load-order` (clean, no warnings).
## 2026-03-27
- Added `start-debug-site-and-wiki.bat` so one double-click opens both the main app and the wiki on the local debug server; updated README/testing notes to mention the dual-launch option.
- Updated `start-debug-site.bat` to auto-open `http://localhost:8000/index.html` after launch, and refreshed the README/testing notes so the no-VS-Code browser debug flow is one double-click.
- Added `start-debug-site.bat` as a double-click local launcher for the static debug server, plus matching README/TESTING_STRATEGY notes for running the site without VS Code.
- Smoothed Capacity Tasks search typing by debouncing the full tasks-tab rerender path in `portals/capacity/js/capacity-events.js` (90 ms), while keeping filter state immediate and canceling pending search refreshes when task filter/sort actions rerender immediately; updated `tests/capacity-events.test.js` and revalidated with focused Jest (`tests/capacity-events.test.js`, `tests/me-data-core.test.js`).
- Investigated ME Capacity Tasks search focus loss during startup and fixed realtime repaint deferral in `portals/capacity/me/js/me-data-realtime.js` so focused capacity search/filter controls are protected (not only table cell editors); added regression in `tests/me-data-core.test.js` and revalidated with focused Jest (`tests/me-data-core.test.js`, `tests/capacity-events.test.js`).
- Closed the remaining mobile-audit warnings by adding explicit `@media (min-width: 768px)` refinements to `portals/capacity/css/capacity.css`, `portals/capacity/shared/css/cap-tables.css`, `portals/mcs/css/mcs.css`, `portals/product-development/npi/css/apqp-bom.css`, `portals/product-development/npi/css/rpn-chart.css`, and `portals/product-development/parts-database/css/parts-database.css`; validated with clean editor diagnostics and follow-up mobile/full guardrail runs.
- Fixed repository guardrail false positives by replacing `scripts/syntax-validator.js` with Node `--check` parsing and teaching the subscription/mobile/modal auditors about Windows paths, multiline realtime calls, responsive companion stylesheets, workspace-wide modal closers, and the shared Escape-based close flow; validated with clean `npm run check:syntax`, `npm run check:subscriptions`, `npm run check:modals`, and full `npm run check:all`.
- Removed the orphaned `public.me_hub_evm_summary` view from Supabase with migration `drop_me_hub_evm_summary_view`, deleted its stale definition from `supabase/evm_phase3_wbs_migration.sql`, and logged the schema cleanup in `CHANGELOG.md` so the loose SQL cannot recreate dead DB scaffolding.
- Bridged current testing gaps around NPI duplicate project handling by adding `tests/npi-navigation-open-project.test.js` for `npi.nav.openProjectById`, extending `tests/npi-dashboard-search.test.js` with paged-project hydration coverage for `ensureProductProjects`, and stabilizing `tests/hub.test.js` favourites assertions by resetting `canViewPageKey` in the suite setup; validated with targeted suites and full `npm test` (64/64 suites, 809/809 tests).
- Completed Phase 7 of `plans/me-data-modularisation-plan.md` by turning `portals/capacity/me/js/me-data.js` into the final ME bootstrap/facade, reusing shared facade factories from `portals/capacity/me/js/me-data-persistence.js` so init/reset keep the same state and pending-delete shape, and validating with focused/full Jest plus a browser boot spot-check.
- Completed critical project dedupe + prevention: deduped `public.projects` by `product_id` (301 duplicate rows removed), repointed all FK-linked NPI `project_id` rows and `projects.parent_id` to canonical `prog_id`s before delete, verified zero remaining duplicate product groups, and applied migration `enforce_unique_projects_product_id_not_null` creating partial unique index `uq_projects_product_id_not_null`.
- Investigated live DB for "Class 717 Cooling Unit Water Pump" and confirmed duplicate `projects` rows for the same `product_id`; only one (`prog_id = p_rz5zjglz3`) had NPI rows (12 total across CTQ/PFD/actions/risks/gates). Fixed access by hydrating missing projects from Supabase during partial paging and routing dashboard opens through duplicate-safe `npi.nav.openProjectById`; validated with `npm test -- tests/product-development.test.js tests/npi-data-relational.test.js` (12/12 passing).
- Fixed NPI relational project loading regression where project pages showed blank BoM/APQP/actions/risks despite DB rows: updated `portals/product-development/npi/js/npi-data-relational.js` so `npiRelResolveProjectId` maps UUID project IDs to `projects.prog_id` before querying NPI tables; validated with `npm test -- tests/npi-data-relational.test.js` (8/8 passing).
- Completed Phase 6 of `plans/me-data-modularisation-plan.md` by extracting ME realtime row normalization plus subscribe/unsubscribe ownership from `portals/capacity/me/js/me-data.js` into new file `portals/capacity/me/js/me-data-realtime.js`, updating `index.html` and the eval-based `tests/me-data-core.test.js` load order, and validating with focused `npm test -- tests/me-data-core.test.js` plus full `npm test`.
- Completed Phase 5 of `plans/me-data-modularisation-plan.md` by extracting ME init/save/reset/diagnostic ownership from `portals/capacity/me/js/me-data.js` into new file `portals/capacity/me/js/me-data-persistence.js`, updating `index.html` and the eval-based `tests/me-data-core.test.js` load order, then fixing the reviewed regressions so existing-row realtime updates repaint correctly and support-history edits immediately refresh the matching product state. Validated with focused `npm test -- tests/me-data-core.test.js` plus full `npm test`.
- Completed Phase 4 of `plans/me-data-modularisation-plan.md` by extracting ME entity CRUD and department product autosync ownership from `portals/capacity/me/js/me-data.js` into new file `portals/capacity/me/js/me-data-entities.js`, updating `index.html` and the eval-based `tests/me-data-core.test.js` load order, and validating with focused `npm test -- tests/me-data-core.test.js` plus full `npm test`.
- Completed Phase 3 of `plans/me-data-modularisation-plan.md` by extracting ME product support history ownership from `portals/capacity/me/js/me-data.js` into new file `portals/capacity/me/js/me-data-support-history.js`, updating `index.html` and the eval-based `tests/me-data-core.test.js` load order, and validating with focused `npm test -- tests/me-data-core.test.js` plus full `npm test`.
- Completed Phase 2 of `plans/me-data-modularisation-plan.md` by extracting the pure helpers from `portals/capacity/me/js/me-data.js` into new file `portals/capacity/me/js/me-data-normalize.js`, updating `index.html` and the eval-based `tests/me-data-core.test.js` load order, and validating with focused `npm test -- tests/me-data-core.test.js` plus full `npm test`.
- Completed Phase 1 of `plans/me-data-modularisation-plan.md` by extending `tests/me-data-core.test.js` with characterization coverage for the current `window.meData*` API surface, current split product-support edit behaviour, and current ME realtime callback behaviour; validated with focused `npm test -- tests/me-data-core.test.js` and full `npm test`.
- Added `plans/me-data-modularisation-plan.md` with a phased structural refactor plan for `portals/capacity/me/js/me-data.js`; scope keeps runtime behaviour stable first, preserves the current `window.meData*` API, and splits work into characterization tests, pure helpers, support history, entity CRUD, persistence, realtime, and a final thin facade step.
- Restored the shared capacity runtime after the Phase 10 cut-over by replacing the remaining placeholder Product Support / Product Load / Holiday Planner rendering, restoring shared chart month controls plus the embedded heatmap mount, making month controls stream-aware in `capacity-events.js`, reverting the stray ME team-name lookup in `me-data-relational.js`, and fixing multiple Windows validation scripts that had been silently scanning zero files. Validated with focused capacity Jest suites and full `npm test`; `check:all` now reports real repository findings instead of zero-file false greens.
- Completed Capacity Independence Phase 10 by deleting the old ME shared JS/CSS copies from `portals/capacity/me/`, migrating direct Jest file loads onto shared `cap-*` files or shared wrapper bridge coverage, and updating README/testing docs to reflect that only the ME data/orchestrator files remain; validated with `npm run check:load-order`, focused shared-capacity Jest coverage (11/11 suites, 155/155 tests), and full `npm test` with only the pre-existing unrelated `tests/me-data-relational-queries.test.js` failure remaining.
- Completed Capacity Independence Phase 9 by cutting `index.html` over to the shared capacity `cap-*` CSS/JS bootstrap, moving `capacity.js` / `capacity-events.js` to the end of the capacity block, updating README/testing docs to match, and fixing the browser-only PM/LOG/UNIT6 top-level alias redeclaration issue that appeared once all stream scripts loaded together; validated with `npm run check:load-order`, focused capacity Jest coverage (7/7 suites, 73/73 tests), and a clean browser load at `http://localhost:8000/`.
- Completed Capacity Independence Phase 8 by moving generic data/date/normalization helper ownership into `cap-data-utils.js` / `cap-utils.js`, then making ME/PM/LOG/UNIT6 data and relational layers resolve shared `cap*` helpers first with temporary legacy fallbacks until the bootstrap cut-over; validated with targeted data-layer Jest coverage (`tests/me-data-core.test.js`, `tests/pm-capacity-data.test.js`, `tests/pm-data-relational.test.js`, `tests/log-data-relational.test.js`, `tests/unit6-data-relational.test.js`).
- Completed Capacity Independence Phases 4 to 7 by moving `pm-capacity.js`, `log-capacity.js`, and `unit6-capacity.js` onto shared `cap*` entry points with runtime-safe legacy bridges, then making `capacity-events.js` DOM-context driven and generic-helper based; validated with `npm test -- tests/pm-capacity.test.js tests/log-capacity.test.js tests/unit6-capacity.test.js tests/capacity-events.test.js` (4/4 suites, 27/27 tests).
- Replaced the remaining shared capacity placeholder tabs in `cap-products.js`, `cap-product-taskload.js`, `cap-holidays.js`, `cap-dashboard.js`, and `cap-heatmap.js` with runtime-safe wrappers to the working capacity render/draw flows; confirmed the placeholder strings are gone, editor diagnostics are clean, and focused capacity Jest coverage passed (`tests/me-products-filters.test.js`, `tests/me-holidays.test.js`, `tests/me-chart.test.js`, `tests/capacity-events.test.js`).
- Corrected `plans/capacity-independance.md` to say Phase 3 is complete for ME orchestrator decoupling but still uses a runtime-safe fallback bridge until the shared `cap-*` layer is actually cut over in `index.html`; added matching changelog and buglog notes so Phase 4 work does not assume the shared renderers are already live.
- Completed Capacity Independence Phase 3 by decoupling `portals/capacity/me/js/me-capacity.js` from `meCurrentDepartmentContext` and cross-stream PM/LOG/UNIT6 delegation, switching its tab/draw entry points to shared `cap*` calls, and keeping a runtime-safe legacy bridge because `index.html` still loads only the old ME scripts before the later cut-over phase; validated with grep checks for removed `meRender*`/`meCurrentDepartmentContext`/cross-stream delegation markers and editor error checks on touched files.
- Completed Capacity Independence Phase 2 by making the shared tasks renderer consume explicit filter/sort inputs and removing the last shared `meDataGet*` fallbacks from `portals/capacity/shared/js/cap-calculations.js`; validated with shared-layer grep checks for `meCurrentDepartmentContext`, `meGetDepartmentFromContext`, and `meDataGet|pmDataGet|logDataGet|unit6DataGet`, plus editor error checks on the touched files.
- Finished Capacity Independence Phase 1 cleanup by removing the last `window.me*` references from `portals/capacity/shared/js/cap-calculations.js`, confirming all shared Phase 1 JS/CSS files exist, and marking Phase 1 complete in `plans/capacity-independance.md`; validated with shared-folder inventory, `window.me` grep on `portals/capacity/shared/js/**`, and editor error checks on the touched files.
- Added `portals/product-development/parts-database/README.md` to document the standalone Parts Database subsystem, its ownership boundary, and the expected thin-caller relationship from NPI BoM files.
- Finished the Parts Database subsystem split by moving the Add from Parts Database picker and ABC-specific CSS into standalone Parts Database files (`parts-modals.js`, `parts-database.js`, `parts-database.css`), reducing `portals/product-development/npi/js/bom.js` to a thin caller for pick flows; validated with `npm test -- tests/parts-database.test.js tests/product-development.test.js` and full `npm test` (64/64 suites, 815/815 tests).
- Split the Parts Database into its own Product Development subsystem under `portals/product-development/parts-database/js/` and left NPI on thin compatibility wrappers (`bom-cclass.js`, `npi-data-relational.js`) so BOM flows still consume the same catalogue; validated with `npm test -- tests/product-development.test.js`, `npm run check:load-order`, and full `npm test` (63/63 suites, 814/814 tests).
- Fixed production scheduling delegation regression by replacing the empty-state inline `onclick="focusBatchNewRow()"` button in `portals/production/js/scheduling.js` with shared `data-action="focus-new-batch"` wiring, aligning it with the production portal's delegated-control pattern; validated with `npm test -- tests/production.test.js` and full `npm test` (63/63 suites, 813/813 tests).
- Fixed PM/LOG/Unit 6 Capacity date adjuster regression where month controls changed but chart/heatmap stayed pinned to ME month by introducing shared active-stream month resolver `meGetActiveChartMonthKey()` in `portals/capacity/js/me-chart.js` and using it in both `meDrawChartNow` and `meDrawHeatmapNow`; added regression in `tests/me-chart.test.js` and validated with `npm test -- tests/me-chart.test.js tests/pm-capacity.test.js`.
- Fixed Serena MCP client-context mismatch for OpenCode by changing `.mcp.json` default `oraios/serena` context to `codex` and adding `oraios/serena-claude` with `claude-code`, so both OpenCode and Claude Code can connect without conflicting prompts/tool filters.
- Fixed Product Support History edit-save reversion by making `meNormalizeAndDedupeSupportHistory` prefer the most recently updated duplicate record (instead of last-iterated), added regression in `tests/me-data-core.test.js`, and validated with `npm test -- tests/me-data-core.test.js` plus full `npm test`/`npm run check:all` runs (existing unrelated failure remains in `tests/operations-infographic.test.js`).
- Fixed dead Capacity hub stream buttons by changing `portals/capacity/js/capacity.js` root cards and top route-switcher buttons from stale `data-action` wiring to delegated `data-cap-action="cap-set-tab"`, so clicks reach `setCapacityTab` again; added focused regression coverage in `tests/capacity-hub.test.js` and validated with `npm test -- tests/capacity-hub.test.js`.
- Completed capacity isolated-stream parity fixes: PM Product Support history edit now routes to PM data, stream-specific history delete routing now dispatches to PM/LOG/UNIT6/ME correctly, PM/LOG/UNIT6 support-history delete queues + relational delete helpers were added, realtime focus guards were added to PM/LOG/UNIT6 subscriptions to prevent inline-edit rerender thrash, autosync persistence now uses debounced saves, duplicate cap-nav-tab/cap-hub-tab handling was removed from `capacity.js`, and regressions were added in `tests/capacity-events.test.js` / `tests/capacity-hub.test.js`; validated with `npm test` (63/63 suites, 807/807 tests) and `npm run check:all` (pass).
- Fixed Hub -> Capacity access regression for legacy permission sets by adding a parent-portal fallback in `canViewPortalTab` when child-tab policy is not configured (`utils/js/helpers.js`), plus regression coverage in `tests/permissions-helpers.test.js`; validated with focused permission/hub/navigation suites.
- Expanded the capacity edge-spacing polish beyond Product Support by introducing `.me-card-body-gutter` in `portals/capacity/css/me-capacity-tables.css` and applying it to Team (`me-team.js`), Tasks (`me-tasks.js`), Product Task Load (`me-product-taskload.js`), and Holiday Planner (`me-holidays.js`) card bodies so controls and table content are consistently inset across all capacity plans.
- Fixed Product Support edge-touch spacing in all capacity streams by adding a shared `me-products-card-body` padding wrapper in `portals/capacity/js/me-products.js` + `portals/capacity/css/me-capacity-tables.css`, so filters/status chips/bulk-save controls and table content no longer sit flush against the white card edges; updated `CHANGELOG.md`.
- Replaced Product Support toolbar sort controls with sortable table headers across all capacity streams (ME/PM/Logistics/Unit 6) by updating shared renderer `portals/capacity/js/me-products.js` and click routing in `portals/capacity/js/capacity-events.js`; added regression checks in `tests/me-products-filters.test.js` and `tests/capacity-events.test.js`; updated guide text (`utils/js/guide.js`) and changelog; validated with `npm test -- tests/me-products-filters.test.js tests/capacity-events.test.js` (2/2 suites, 23/23 tests).
- Pruned stale OpenWolf session blocks in `.wolf/memory.md` by removing 50 `## Session:` sections that had no action rows, and preserved all session blocks that contained logged actions.
- Fixed Product Support bulk-edit visual reset where drafted values could disappear on rerender while still saving: added multi-key draft resolution (product id / product DB id / row index) in `portals/capacity/js/me-products.js`, passed product DB IDs through `portals/capacity/js/capacity-events.js`, added regression `tests/me-products-filters.test.js`, and validated with focused Jest plus full suite (`npm test -- --runInBand --silent`, 63/63 suites, 801/801 tests).
- Moved the shared Product Support `📦 Bulk Save All Changes` control to the right above the table in `portals/capacity/js/me-products.js`, which applies to ME/PM/Logistics/Unit 6; updated guide copy in `utils/js/guide.js` and added changelog entry; validated with `npm test -- tests/me-products-filters.test.js tests/capacity-events.test.js` (2/2 suites, 20/20 tests).
- Fixed stale Capacity Chart side panels on month navigation for ME/PM/LOG/Unit 6: chart month handlers now re-render chart-tab body (KPI, Demand Breakdown, Capacity per role) before `meDrawChartNow`/`meDrawHeatmapNow`; validated with focused suites (`me-chart`, `log-capacity`, `unit6-capacity`) and full `npm test` (62/62 suites, 798/798 tests).
- Fixed Capacity chart month selector state drift across ME/PM/Logistics/Unit 6 by syncing `meChartMonthInput.value` in each stream's chart-only refresh path (`meRefreshCurrentTab`, `pmRefreshCurrentTab`, `logRefreshCurrentTab`, `unit6RefreshCurrentTab`) so Prev/Next/Today no longer leave the input stuck on stale January; validated with `npm test -- --runTestsByPath tests/me-chart.test.js`.
- Disabled live chart auto-refresh for ME/PM capacity and switched to refresh-on-open behavior: `meCapSmartRender`/`pmCapSmartRender` now mark chart dirty instead of redrawing while chart is open; chart header text in `me-chart.js` now states refresh-on-open, matching test updates in `tests/me-chart.test.js`, guide updates in `utils/js/guide.js`, and changelog entry in `CHANGELOG.md`.
- Fixed Product Support edit churn across ME/PM/Logistics/Unit 6 by adding per-stream draft state for shared Product Support rows in `portals/capacity/js/me-products.js` and wiring draft-only inputs through `portals/capacity/js/capacity-events.js`; Apply Change now clears only the matching draft, and focused regressions were added in `tests/me-products-filters.test.js` and `tests/capacity-events.test.js`.
- Fixed recurring ME save storm/400 constraint failures by coercing all ME legacy table writes (`me_teams`, `me_tasks`, `me_holidays`, `me_product_support_history`) to department `ME` in `me-data-relational.js` and `me-data.js`; added regressions in `tests/me-data-relational-queries.test.js` and `tests/me-data-core.test.js`.
- Fixed split-stream Holiday Planner routing so shared holiday clicks and Today month jumps now dispatch through the active capacity stream (`PM`, `LOG`, `UNIT6`, or `ME`) instead of always mutating ME state; added regressions in `tests/me-holidays.test.js` and `tests/me-chart.test.js`.
- Fixed team-delete persistence across all capacity streams (ME/PM/LOG/UNIT6): added `teams` pending-delete queues in each `*DataPendingDeletes`, queued deleted member IDs in each `*DataDeleteTeam`, and persisted relational team deletes inside each `*DataSave` so removed members no longer reappear after refresh; added/updated tests in `tests/me-data-core.test.js` and new `tests/capacity-team-delete-persistence.test.js`; validated with focused tests, full `npm test` (62/62 suites, 792/792), and `npm run check:all` (EXIT:0).
- Fixed post-split capacity save failures (`me_teams_department_check`) by making `portals/capacity/js/capacity-events.js` context-aware for `me`/`pm`/`log`/`unit6`, so LOG and Unit 6 now call `logData*` / `unit6Data*` CRUD+save paths instead of ME handlers; updated `tests/capacity-events.test.js` with PM + LOG routing assertions; validated with focused `npm test -- tests/capacity-events.test.js` (8/8), full `npm test` (60/60 suites, 783/783), and `npm run check:all` (pass, existing warnings unchanged).
- Finished the capacity department split runtime and repo sync: added isolated state modules `portals/capacity/logistics/js/log-data.js` and `portals/capacity/unit6/js/unit6-data.js`, rewired PM/LOG/UNIT6 orchestrators and `pm-capacity-data.js` to per-stream `*DataGet/*DataSave` APIs, loaded and initialized the split modules from `index.html` and `core/js/app.js`, updated shared chart/heatmap data reads to respect the active stream state, backfilled `supabase/capacity_dept_split.sql`, updated README/TESTING_STRATEGY/CHANGELOG, added relational split tests plus updated PM/LOG/UNIT6 tests, and validated with focused Jest, full `npm test` (60/60 suites, 782/782 tests), and `npm run check:all` (pass with only pre-existing core-script ordering warnings for `chart-theme.js` and `guide.js`).
- Added task-level Disable support to shared ME/PM capacity tasks so tasks remain visible but are excluded from calculations: added `isDisabled` state/defaults in `portals/capacity/js/me-data.js`, relational load/save mapping (`is_disabled`) in `portals/capacity/js/me-data-relational.js`, disabled-task exclusion in `portals/capacity/js/me-calculations.js`, Disable checkbox + marker in `portals/capacity/js/me-tasks.js`, and toggle handling in `portals/capacity/js/capacity-events.js`; added migration `supabase/me_tasks_disable_flag.sql`; updated guide copy (`utils/js/guide.js`) and `CHANGELOG.md`; added regressions in `tests/me-calculations.test.js`, `tests/me-data-core.test.js`, `tests/me-tasks-sort.test.js`, and `tests/capacity-events.test.js`; validated with `npm test` (57/57 suites, 774/774 tests) and `npm run check:all`.
- Added ME/PM Capacity Chart live-update indicator in the chart header (default `Live sync on`, then `Last live update ...` after realtime refresh), and wired refresh timestamps from ME/PM smart-render paths. Chart-tab realtime refresh continues to redraw both chart and embedded heatmap. Updated `portals/capacity/js/me-chart.js`, `portals/capacity/css/me-capacity-chart.css`, `portals/capacity/css/me-capacity-responsive.css`, `portals/capacity/js/me-capacity.js`, `portals/capacity/project-management/js/pm-capacity.js`, `tests/me-chart.test.js`, `utils/js/guide.js`, and `CHANGELOG.md`; validated with `npm test -- tests/me-chart.test.js tests/capacity-events.test.js tests/pm-capacity-data.test.js` (23/23 passing).
- Enabled multi-window live refresh for ME/PM Capacity Chart: realtime smart-render now refreshes the active chart tab (instead of only setting dirty), so chart/KPI values update when tasks are changed in another open window. Updated `portals/capacity/js/me-capacity.js`, `portals/capacity/project-management/js/pm-capacity.js`, `utils/js/guide.js`, and `CHANGELOG.md`; validated with `npm test -- tests/me-chart.test.js tests/capacity-events.test.js tests/pm-capacity-data.test.js` (21/21 passing).
- Fixed failing `tests/me-products-filters.test.js` assertion for Logistics Hours/Batch by replacing exact substring check (`data-field="hoursPerWeek" readonly`) with attribute-order-safe regex (`/data-field="hoursPerWeek"[^>]*readonly/`); validated with focused run and full `npm test` (57/57 suites, 766/766 tests).
- Extended team access permissions down to second-level hub cards and deep links: added sub-portal view grants in `utils/js/helpers.js`, hid denied cards/favourites/tabs across Hub, Capacity, Product Development, and Production, added direct-route access-denied handling in `utils/js/navigation.js`, updated related guide copy in `utils/js/guide.js`, and validated with `npm test -- tests/permissions-helpers.test.js tests/hub.test.js tests/capacity-hub.test.js tests/product-development.test.js tests/production.test.js tests/navigation.test.js` (141/141 passing).
- Removed misleading editable hover/focus styling from the Logistics Product Support calculated `Hours/Batch` input by tagging it as a calculated field in `portals/capacity/js/me-products.js` and adding a readonly visual override in `portals/capacity/css/me-capacity-tables.css`; updated `CHANGELOG.md`.
- Added brief plain-language descriptions to the Settings team permission editor so admins can see what each permission grants before toggling it; updated `utils/js/helpers.js`, `portals/settings/js/settings-teams.js`, `portals/settings/css/settings.css`, `tests/settings-portal.test.js`, and `CHANGELOG.md`, then aligned fallback permission copy in `settings-teams.js` and revalidated with `npm test -- tests/settings-portal.test.js` (61/61 passing).
- Fixed standalone wiki internal-link navigation so markdown links no longer open new tabs and 404. Updated `wiki/assets/js/wiki-render.js` to resolve relative `.md` links against the active topic path and output same-window hash routes; passed `topicPath` from `wiki/assets/js/wiki-app.js`; validated with `npm run wiki:check` and `npm test` (57 suites, 753 tests).
- Fixed standalone wiki bootstrap fetch failure (`Failed to load: ./content/_meta/areas.json`) by resolving wiki base path from `window.location.pathname` in `wiki/assets/js/wiki-app.js`, then added compatibility redirect page `dev/wiki/index.html` to forward legacy `/dev/wiki/` URLs to `/wiki/` while preserving hash navigation; validated with `npm run wiki:check`.
- Repaired malformed `.wolf/anatomy.md` structure caused by patch auto-correction: moved the wiki dual-lens note out of the `## ./` file list and into a dedicated `## Manual Update 2026-03-24` section; logged fix in `.wolf/buglog.json` as `bug-068`.
- Implemented wiki-wide learning-model split into Function vs Process lenses: added `learning-function/00-overview.md`, `learning-process/00-overview.md`, and area process workflow pages (`10..90`); wired both lenses into `wiki/content/_meta/areas.json`; linked PFMEA method page to PFMEA tool-workflow page; validated with `npm run wiki:check` and final `npm run wiki:audit-tokens` (soft=0 hard=0).
- Split PFMEA docs into two pages to separate intent: `wiki/content/product-development/50-pfmea.md` now serves as method/risk reference and new `wiki/content/product-development/51-pfmea-tool-workflow.md` covers in-site usage flow; updated `wiki/content/_meta/areas.json`; validated with `npm run wiki:check` (41 entries, links clean) and final `npm run wiki:audit-tokens` (soft=0 hard=0).
- Refined `wiki/content/product-development/50-pfmea.md` per user feedback: removed explicit training-objective section, expanded practical explanatory depth, then trimmed copy to stay within token soft cap; validated via `npm run wiki:audit-tokens` (soft=0 hard=0) and `npm run wiki:check-links` (broken=0).
- Reworked only `wiki/content/product-development/50-pfmea.md` into a training-manual page (objective, preparation, scoring rules, step-by-step completion flow, worked example, quality checklist, and system links), then revalidated with `npm run wiki:check` (40 entries, token audit clean, 0 broken links).
- Rewrote all standalone wiki content pages (`wiki/content/**/*.md`, 40 files) from template-style technical wording into human-facing guides focused on purpose, day-to-day usage, key calculations where relevant, and links to connected areas; rebuilt wiki search index and validated with `npm run wiki:check` (40 entries indexed, token audit clean, 0 broken links).
- Renamed wiki header/title to `Operations Portal Wiki` and removed the wiki subtext line in `wiki/index.html`; updated changelog entry for the branding tweak.
- Aligned standalone wiki styling to match main portal visual language (`wiki/assets/css/wiki.css`) and added top-left Tidyco logo + IBM Plex font link in `wiki/index.html`; validated with `npm run wiki:check` (build index, token audit, link check all passed).
- Hardened search typing continuity across re-rendering flows: added shared `preserveInputCaretAfterRender` helper (`utils/js/helpers.js`), reused it in Capacity task/product/product-load handlers, NPI dashboard and PFMEA text search, and feedback browse search; added regressions `tests/capacity-events.test.js`, `tests/npi-events-search.test.js`, `tests/feedback-search-focus.test.js`; validated with focused Jest suite (4/4 passing, 8 tests).
- Added second-wave standalone wiki APQP topics (CTQ, Control Plan, Action Tracker, Risk Register, BOM, Timing Plan, APQP Gates), expanded Product Development navigation in `wiki/content/_meta/areas.json`, rebuilt `wiki/content/_meta/search-index.json` to 27 entries, and revalidated with `npm run wiki:check` (all green).
- Added first-pass high-priority standalone wiki content set: 10 topic files across Capacity/Product Development/MCS, expanded `wiki/content/_meta/areas.json` topic navigation, rebuilt `wiki/content/_meta/search-index.json` to 20 entries, and revalidated with `npm run wiki:check` (all green).
- Scaffolded standalone guide wiki preview under `wiki/` (index page, runtime JS modules, area-based starter content, and metadata files), added wiki maintenance scripts (`wiki-build-search-index`, `wiki-token-audit`, `wiki-link-check`), validated with `npm run wiki:check`, and intentionally left portal navigation unchanged so review is URL-only.
- Reviewed and fully reframed `plans/guide-system-implementation-plan.md` to a standalone wiki strategy: separate `wiki/index.html` entrypoint, by-area content folders, and strict token/file-size guardrails for future audits and low-churn updates.
- Fixed Capacity Product Support search focus churn: `cap-products-search` now restores focus/caret after re-render in `capacity-events.js` so typing continues uninterrupted; added regression in `tests/capacity-events.test.js` and verified the suite passes.
- Corrected the Logistics Product Support split to use three distinct component fields (`Kitting`, `Booking In/Out`, `Product Movement`) with read-only `Hours/Batch` as the computed sum; updated shared render/events/state/relational/calculation paths, extended migration + applied SQL (`kitting_hours`, `booking_in_out_hours`), and revalidated with focused Jest plus full `npm test` (55 suites, 749 tests).
- Applied the Logistics product-support split migration to Supabase (`me_product_support_history` now has `kitting_time_booking_hours` and `product_movement_hours`) and updated the Product Support history panel to show both component values plus Hours/Batch; revalidated with focused Jest, full `npm test` (55 suites, 749 tests), and `npm run check:all`.
- Split Logistics Product Support hours into `Kitting Booking In/Out` and `Product Movement` in the shared capacity product-support flow: updated `me-data.js`, `me-products.js`, `capacity-events.js`, `me-data-relational.js`, `me-calculations.js`, and `me-product-taskload.js`; added support-history migration `supabase/logistics_product_support_history_split.sql`; validated with focused Jest coverage plus full `npm test` (55 suites, 748 tests) and `npm run check:all`.
- Updated shared Capacity wording for Logistics and Unit 6 so user-facing team labels no longer default to engineer-only text: `capacity-events.js`, `me-team.js`, `me-chart.js`, and `me-holidays.js` now show `Logistics Technician` for LOG and `Technician` for UNIT6; added focused regressions in `tests/me-team-render.test.js` and `tests/me-chart.test.js`; full Jest suite passes (55 suites, 737 tests).
- Verified the user's correction on capacity headers: no further code change made after checking the current router/render paths; recorded that broader header-removal suggestions must be verified first.
- Removed the shared Capacity route-switcher bar from the Logistics and Unit 6 pages in `portals/capacity/js/capacity.js` because those views already have their own local header/back controls; added regression coverage in `tests/capacity-hub.test.js`.
- Fixed Product Support duplicate values caused by legacy manual `me_products` rows (null `product_database_id`) surviving alongside synced DB-linked rows of the same name: patched `meDataAutoSyncDepartmentProducts` to drop stale manual duplicates, added regression test in `tests/me-data-core.test.js`, and deleted 19 duplicate manual rows from Supabase.
- Normalized overgrown live Supabase RLS policies across 14 public tables to the auth-only model (single `auth` policy each), removing overlapping permissive policies and broad `allow all` drift; added rollback SQL at `supabase/rollback_normalize_rls_to_single_auth_policy.sql`; validated with `npm test` (53/53 suites, 705/705 tests) and `npm run check:all` (EXIT:0).
- Fixed cascading ME relational save failures in `portals/capacity/js/me-data-relational.js`: product saves now resolve existing `me_products.id` by `product_database_id` before upsert and persist only ME/PM product departments, eliminating `uq_me_product_database_id` and `me_products_department_check` save errors; added regression in `tests/me-data-core.test.js` and verified full `npm test` (53 suites, 705 tests).
- Reduced settings portal test brittleness tied to high-churn `settings.js`: added explicit core-state test hooks (`settingsSetCoreState` / `settingsGetCoreState`) and removed the test-time `let`→`var` source rewrite from `tests/settings-portal.test.js`; settings modules are now loaded in one eval context and full Jest suite still passes.
- Added focused Logistics (LOG) and Unit 6 (UNIT6) portal coverage in new suites `tests/log-capacity.test.js` and `tests/unit6-capacity.test.js`, asserting render shell output, department-filtered tab content, URL tab history keys, and debounced save rerender behavior.
- Fixed outdated Capacity Hub Jest expectation in `tests/capacity-hub.test.js`: card count now asserts 5 (Production, ME, PM, Logistics, Unit 6) with explicit Logistics/Unit 6 action and icon checks; revalidated with `npm test` and `npm run check:all` (both passing).
- Split `portals/settings/js/settings.js` into focused modules by moving Teams/Permissions logic to `portals/settings/js/settings-teams.js` and MCS approvals logic to `portals/settings/js/settings-mcs.js`; updated `index.html` script order and adjusted `tests/settings-portal.test.js` to eval the new modules.
- Updated Production Capacity by Work Area KPIs in `portals/capacity/js/prod-capacity-workarea.js`: added a new `1-Yr Headroom` card and rounded `2-Yr Headroom` to whole hours so Unit 2/3/6 KPI tiles are easier to scan.
- Split `mcs-modal.js` (16k tokens) into four focused files: `mcs-modal-shared.js` (helpers + close), `mcs-modal-create.js`, `mcs-modal-view.js`, `mcs-modal-edit.js`. Updated `index.html` load order and deleted original file.
- Added Logistics (LOG) and Unit 6 (UNIT6) capacity plans to Capacity Hub: created `portals/capacity/logistics/js/log-capacity.js` and `portals/capacity/unit6/js/unit6-capacity.js` following the PM pattern; expanded `meNormalizeDepartmentTag` in both `me-data.js` and `me-data-relational.js` to pass through LOG and UNIT6 tags; added context redirects to `me-capacity.js` shared functions; wired up hub cards, nav bar items, routing, and events in `capacity.js` and `capacity-events.js`; added script tags to `index.html`.
- Finalized robust MCS stage-number rendering in `portals/mcs/js/mcs-modal.js` by injecting explicit `.mcs-stage-badge` elements during stage-toggle build (instead of relying only on pseudo-elements), with matching fallback-safe color styling and stronger footer/button contrast updates in `portals/mcs/css/mcs.css`.
- Fixed NPI action FK violations (409 Conflict on save): `npi_actions`, `npi_pfmea_causes`, and `npi_risks` foreign keys reference `projects(prog_id)` but `npiRelResolveProjectId` was returning `project.dbId` (the DB primary key) instead of `project.id` (which holds prog_id). Changed function to return prog_id values; updated tests in `tests/npi-data-relational.test.js` to verify correct FK behavior; all 706 tests pass.
- Applied MCS modal follow-up styling in `portals/mcs/css/mcs.css`: hard-forced Stage 2 badge rendering (`content: '2' !important`) and lightened the modal footer with higher-contrast action button styles so controls stand out.
- Fixed NPI Kanban search churn in `portals/product-development/npi/js/dashboard.js` and `portals/product-development/npi/js/npi-events.js` by restoring focus/caret after each search-triggered re-render; added regression coverage in `tests/npi-dashboard-search.test.js`.
- Polished the MCS staged modal visuals in `portals/mcs/css/mcs.css` + `portals/mcs/css/mcs-responsive.css`: added explicit numbered stage bullets (including Stage 2), a colored header bar treatment, and a left-side stage separator guide line with node markers so stage transitions are easier to identify.
- Fixed ME/PM Capacity Chart KPI month mismatch by switching KPI/breakdown calculations in `portals/capacity/js/me-chart.js` from calendar-month to selected chart month (`monthKey`); added regression coverage in `tests/me-chart.test.js` and validated with `npm test` + `npm run check:all`.
- Fixed ME/PM Capacity tasks search input churn in `portals/capacity/js/capacity-events.js` by restoring focus and caret after delegated tab re-render on each keystroke; added regression coverage in `tests/capacity-events.test.js`.
- Updated Product Support edit UX to intent-based history changes: hours/effective-date edits no longer persist automatically; users must click Apply Change with a reason, and each row now has a View History toggle showing dated support-rate records inline.
- Implemented effective-dated ME/PM product support history in capacity: added support history state + relational persistence + dated-rate lookup in monthly batch support calculations, added Product Support effective-date column/edit flow, added migration script `supabase/me_product_support_history.sql`, and validated with `npm test` and `npm run check:all` (both passing).
- Audited `supabase/` against live code, docs, and tests; kept all setup-relevant SQL files and deleted only `remove_legacy_me_pert_subtasks.sql` because it was a completed one-off cleanup with no remaining runtime or onboarding value.
- Removed the dead `me_capacity` fallback from `portals/capacity/js/me-data.js` after confirming the live project has no such table, and changed holiday saves to delete only the current user's `me_holidays` rows before insert; added focused regression coverage in `tests/me-data-core.test.js`.
- Fixed ME/PM capacity task delete persistence in `portals/capacity/js/me-data.js` by queueing deleted task IDs and deleting them from `me_tasks` during save; added regression coverage in `tests/me-data-core.test.js` to prevent refresh resurrection.
- Split PFMEA worksheet state out of `portals/product-development/npi/js/pfmea.js` into new `portals/product-development/npi/js/pfmea-state.js` (RPN/view/column/extra-filter state + column geometry helpers), updated `index.html` script order to load it before `pfmea.js`, and updated `tests/pfmea.test.js` to eval the new state module before PFMEA core.

## 2026-03-22
- Fixed production hub delegation regression in `portals/production/js/production.js` by replacing inline favourite `onclick` handlers with delegated `data-action` handling (`prod-fav-toggle`), then validated with targeted production tests.
- Re-ran full validation after delegation fix: `npm test` and `npm run check:all` both pass (50 suites, 682 tests).
- Implemented schedule-driven ME/PM product support calculations: support/load tabs and monthly demand now use production batch count per month times editable product support value, with updated labels and tests in capacity modules.
- Ran validation for capacity change: focused suites passed (`tests/me-calculations.test.js`, `tests/me-products-filters.test.js`); full suite still has one unrelated pre-existing failure in `tests/production.test.js` (onclick delegation assertion).
- Fixed terminal readability in Settings Product Families/Work Areas by styling inline table input placeholders (`.cell-edit::placeholder`) with high-contrast terminal tokens in `portals/settings/css/settings.css`.
- Improved APQP Mission Control Gate Trajectory visibility in terminal theme by adding higher-contrast `mc-shell` overrides for helper text (`.panel-head span`), inactive gates, and connector lines in `portals/product-development/npi/css/dashboard.css`.
- Fixed APQP Mission Control terminal readability in `portals/product-development/npi/css/dashboard.css` by adding a terminal-specific `mc-shell` override block for heading/KPI/gate text colors that were still inheriting light-theme hardcoded values.
- Fixed project dashboard text readability in terminal/dark themes by increasing `--muted` contrast tokens in `core/css/main.css` (terminal `#006618 -> #39c95a`, dark `#8296aa -> #96abbe`) and logged changelog/bug entry.
- Removed the Hub favourites scrollbar and lowered favourites storage caps to 4 pages + 4 products in `portals/hub/js/hub.js` / `portals/hub/css/hub.css`; added a Jest regression test in `tests/hub.test.js` and revalidated with `npm test -- tests/hub.test.js tests/capacity-hub.test.js` (56/56 passing).
- Implemented Hub Phase 1 compact landing layout in `portals/hub/js/hub.js` + `portals/hub/css/hub.css`: added `hub-home` scope class, tightened desktop spacing, reduced hub card height, constrained favourites panel with internal scroll, and moved wide desktop hub grid to 3 columns to reduce laptop page scrolling; validated with `npm test -- tests/hub.test.js tests/capacity-hub.test.js` (55/55 passing).
- Fixed favourites shortcut navigation for sub-hub entries (`capacity::me`, `product-development::npi`, etc.): `hubOpenFavouritePage` now navigates to the section first, then applies the tab setter, and `tests/hub.test.js` now asserts this flow.
- Fixed favourites rollout gap: added star toggles to Capacity, Product Development, and Production root hub cards (not only main hub cards), expanded hub favourites routes to include sub-hub tabs, and added routing coverage in `tests/hub.test.js`.
- Implemented Phase 1 local favourites for portal pages and NPI products: added per-user localStorage favourites model in `portals/hub/js/hub.js`, rendered a new Hub favourites panel, added star toggles on Hub cards and NPI slim product cards, and added matching styles in `portals/hub/css/hub.css` and `portals/product-development/npi/css/dashboard.css`.
- Added favourites regression coverage in `tests/hub.test.js` and validated with `npm test -- tests/hub.test.js` plus full `npm test` (676/676 passing).
- Updated MCS main list card metadata label from raw type value to explicit text format (`Change Type: <type>`) for clearer readability. File: `portals/mcs/js/mcs-main.js`.
- Implemented 5-feature PFMEA improvement plan (AIAG-VDA compliance + UX): (1) Function field on modes — data, save, load, render; (2) Special characteristics ∇△◇ dropdown on effects — constants, save, load; (3) Validation warnings badges + modal (SEV≥9, RPN≥200, OCC≥8, overdue); (4) Collapsible column views (Compact/Standard/Full) with view toggle buttons; (5) Advanced filtering (owner, overdue, special char, text search, RPN). Files: `npi-constants.js`, `npi-data.js`, `npi-data-relational.js`, `pfmea.js`, `pfmea.css`, `npi-events.js`, `index.html`. Supabase schema requires two ALTER TABLE migrations (ADD COLUMN function TEXT to npi_pfmea_modes, ADD COLUMN special_char VARCHAR(20) to npi_pfmea_effects). All 671 tests pass.
- Added hub keyboard navigation shortcuts: keys 1-5 now open cards on hub root pages (main hub, Capacity hub, Product Development hub, Production hub), with matching help text in the Keyboard Shortcuts modal. Files: `utils/js/navigation.js`, `index.html`, `CHANGELOG.md`.
- Updated Operations dashboard overview capacity grouping in `portals/operations/js/operations-dashboard-render-core.js`: renamed the section to "Operations Capacity by Area" and moved ME/PM utilisation KPIs into the same area-capacity block as Unit 2/3/6; updated `tests/operations-dashboard.test.js` and added changelog entry.
- Added a distinct Stage 1 `Impact Assessment Estimate (hours)` field in MCS create/edit/view and surfaced it in Approval 1 context; kept it separate from Stage 3 overhaul implementation time impact. Data is persisted via structured justification metadata markers. File: `portals/mcs/js/mcs-modal.js`.
- Refined MCS modal information hierarchy: moved status pill from Stage 1 body into modal top bar (view/edit) so status is shown as global state context. File: `portals/mcs/js/mcs-modal.js`.
- Refined MCS staged modal per follow-up UX request: switched to true accordion behavior (single expanded stage), merged Impact Assessment into Stage 1, added new freeform fields for Documents Affected and Knock-on Effect for Other Products, and introduced color-coded stage headings for clearer visual separation. Files: `portals/mcs/js/mcs-modal.js`, `portals/mcs/css/mcs.css`, `portals/mcs/css/mcs-responsive.css`, `CHANGELOG.md`.
- Tweaked MCS staged modal UX: widened desktop modal (1140px), reduced right workflow rail width, converted stage cards to bordered collapsible sections (Open + active stage expanded by default), and made the modal title banner sticky while only modal body content scrolls. Files: `portals/mcs/js/mcs-modal.js`, `portals/mcs/css/mcs.css`, `portals/mcs/css/mcs-responsive.css`, `CHANGELOG.md`.
- Implemented first-pass staged engineering change modal flow in `portals/mcs/js/mcs-modal.js`: Create/Edit/View now use stage blocks (Open, Impact Assessment, Approval 1, Implement, Approval 2) with a shared vertical workflow rail rendered on the right.
- Added matching layout and responsive styles in `portals/mcs/css/mcs.css` and `portals/mcs/css/mcs-responsive.css` so the rail aligns to stage blocks on desktop and stacks beneath on mobile.
- Switched the PFD top navigator in `portals/product-development/npi/js/npi-pfd.js` from per-step nodes to per-section nodes so large flows can be navigated by section header with step count/range context.
- Reduced NPI PFD flowchart preview scale by tightening Mermaid spacing and constraining the preview canvas in `apqp-pfd.css` so large diagrams render in a compact, scrollable viewport.
- Added adaptive compact mode for NPI PFD flowcharts in `npi-pfd.js` + `apqp-pfd.css`: auto-zoom by step count, LR direction for larger graphs, tighter Mermaid spacing/font sizing, and zoom-wrapped SVG rendering to keep 100+ step flows usable.
- Finalized NPI PFD flowchart readability defaults: fixed zoom at 55%, permanent LR graph direction, and Mermaid class-based colors so process and decision nodes are clearly differentiated.
- Increased fixed NPI PFD flowchart zoom to 66% (120% of 55%) and refreshed node palette to higher-contrast blue process vs pink decision styling for better readability.
- Hardened production backend data handling in `portals/production/js/data.js` by replacing raw `name.localeCompare(...)` sorting with null-safe normalization and added regression coverage in `tests/production-data.test.js` for legacy rows missing `name`.
- Increased fixed NPI PFD flowchart zoom again to 211% (220% bigger than 66%) per user request while preserving permanent LR layout and the existing process/decision color differentiation.
- Polished NPI PFD flowchart visuals for a more professional finish: toned node palette, cleaner edge-label rendering, updated Mermaid base theme variables, and improved preview canvas presentation.

| 2026-03-21 | Add role-based NPI gate signoff permissions | utils/js/helpers.js, portals/product-development/npi/js/npi-data.js, portals/product-development/npi/js/gates.js, tests/npi-gate-permissions.test.js, README.md, TESTING_STRATEGY.md, CHANGELOG.md, .wolf/anatomy.md | Added named signoff-role permission keys and enforced them in NPI gate sign/unsign/signatory editing paths with UI lockout messaging and focused Jest coverage | ~540 tok |
| 2026-03-21 | Force Operations People KPI cards into 2 columns | portals/operations/js/operations-dashboard-render-core.js, portals/operations/css/operations-dashboard.css, CHANGELOG.md, .wolf/anatomy.md, .wolf/buglog.json | Added a People-shell class and breakpoint-specific grid override so People tab KPI cards stay 2 columns on tablet/desktop for cleaner readability | ~140 tok |
| 2026-03-21 | Fix Production Capacity formula help action | portals/capacity/js/prod-capacity-dashboard.js, portals/capacity/js/capacity-events.js, CHANGELOG.md, .wolf/buglog.json, .wolf/anatomy.md | Converted static help text into a clickable delegated action and surfaced formula details via info toast so the control now responds to clicks | ~180 tok |
| 2026-03-21 | Upgrade Production Capacity help to modal | portals/capacity/js/capacity-events.js, index.html, CHANGELOG.md, .wolf/anatomy.md | Replaced toast response with a dedicated modal so users can read the full capacity formula without timeout pressure | ~150 tok |
| 2026-03-21 | Hardened test coverage for chart theme, operations infographic, and MCS approval core | tests/chart-theme.test.js, tests/operations-infographic.test.js, tests/mcs-approval-core.test.js, tests/timing-core.test.js, CHANGELOG.md, .wolf/anatomy.md, .wolf/buglog.json | Added behavior-focused Jest suites for previously untested modules, fixed timing-core test contract mismatch, and resolved eval-scope access failures via globalThis wrappers | ~780 tok |
| 2026-03-21 | Replaced simulated MCS suites with real module-behavior tests | tests/mcs-main.test.js, tests/mcs-actions.test.js, tests/mcs-approval.test.js, CHANGELOG.md, .wolf/buglog.json | Rewrote placeholder assertions to execute real mcs-main, mcs-actions, and mcs-approvers-data functions and validate filtering, routing, and approval permissions | ~640 tok |
| 2026-03-27 | Fix Windows debug launcher quoting | start-debug-site.bat, start-debug-site-and-wiki.bat, CHANGELOG.md, .wolf/cerebrum.md, .wolf/buglog.json | Replaced broken nested CMD quote escaping with delayed powershell.exe Start-Process calls so the local debug launchers open the browser correctly on Windows | ~180 tok |
| 2026-03-27 | Add logo-only icon generator | scripts/make-logo-ico.js, CHANGELOG.md, .wolf/anatomy.md | Reworked the icon helper to trim empty space from the company PNG and export `Tidyco logo-only.png` plus `Tidyco logo-only.ico` for a cleaner desktop shortcut icon | ~420 tok |

## 2026-03-21 — NPI Timing Plan bug fix + overhaul
- **Bug fixed**: `timing.js` early `return` on line 105 (`if (rows.length === 0 && p.gantt.length > 0) return`) caused all sections except the first one with tasks to lose their "Add task" button. Removed the early return.
- **Features added to timing.js**: section header rows (G0–G5 colored dividers with task count), section collapse/expand (saved per-project), row reorder (↑↓ within section), milestone markers (◆ row in thead, per-week, named, saved per-project), configurable timeline length (24–72 weeks, stored in localStorage independent of project), PDF export (`window.print()`), removed top-bar "Add Task" button that hardcoded section s1.
- **npi-data.js**: added `moveRow`, `addMilestone`, `delMilestone` to `npi.data.timing`.
- **gantt.css**: added section header, milestone row, row-actions, and `@media print` styles.
- **OpenWolf compliance gap**: anatomy.md, cerebrum.md, and buglog.json were not updated during the session — caught up at end of session.

| 2026-03-21 | Switched VS Code GitHub MCP server from Docker to remote HTTP | .vscode/mcp.json, CHANGELOG.md, .wolf/buglog.json, .wolf/anatomy.md | Replaced the Docker-based GitHub MCP launch config with the hosted GitHub endpoint to eliminate `spawn docker ENOENT` startup failures in VS Code | ~160 tok |

| 2026-03-21 | Started hybrid permissions implementation (role baseline + team grants) | core/js/state.js, core/js/auth.js, utils/js/helpers.js, utils/js/navigation.js, portals/settings/js/settings.js, portals/settings/js/teams-data.js, supabase/hybrid_permissions_role_team_grants.sql, tests/permissions-helpers.test.js, CHANGELOG.md, .wolf/buglog.json, .wolf/anatomy.md | Added effective permission resolution at login, section access guard rendering, team assignment in Settings permissions table, normalized permission definitions in team editor, and migration/test scaffolding | ~1800 tok |

| 2026-03-21 | Cleared all plan files for full planning reset | plans/, CHANGELOG.md, .wolf/anatomy.md | Deleted all files from plans folder to remove stale implementation plans before drafting new ones | ~120 tok |

| 2026-03-21 | Created fresh 3-file planning baseline from live code state | plans/master-current-state.md, plans/next-implementation-sprint.md, plans/risk-and-regression-checklist.md, CHANGELOG.md, .wolf/anatomy.md | Replaced stale planning set with current-state baseline, next sprint queue, and regression checklist | ~220 tok |

| 2026-03-21 | Synced README and TESTING_STRATEGY with current baseline | README.md, TESTING_STRATEGY.md, CHANGELOG.md, .wolf/anatomy.md | Updated planning references and corrected outdated test coverage claims to match current passing suite totals | ~200 tok |

| 2026-03-21 | Added Ctrl+S/Ctrl+F/Escape shortcuts and docs-sync enforcement | utils/js/helpers.js, tests/helpers.test.js, README.md, TESTING_STRATEGY.md, plans/risk-and-regression-checklist.md, CHANGELOG.md, .wolf/anatomy.md | Implemented advertised shortcuts, added regression tests, and codified requirement to update README.md + TESTING_STRATEGY.md when behavior changes | ~320 tok |

| 2026-03-21 | Harden Operations main shell to delegated actions | portals/operations/js/operations-dashboard-main.js, tests/operations-dashboard.test.js, plans/next-implementation-sprint.md, CHANGELOG.md, .wolf/anatomy.md | Replaced inline handlers for reporting-date controls/header actions/tab navigation with data-action delegation and added regression assertions | ~260 tok |

| 2026-03-21 | Make top bar colors theme-aware | core/css/main.css, CHANGELOG.md, .wolf/buglog.json, .wolf/anatomy.md | Replaced hardcoded topbar blue palette with Light/Dark/Terminal theme tokens so header background, text, and control states change with theme | ~260 tok |

| 12:50 | Executed MCS_LAYOUT_IMPROVEMENT_PLAN.md (all 6 phases) | state.js, portals/mcs/css/mcs.css, portals/mcs/css/mcs-responsive.css, portals/mcs/js/mcs-main.js | success — 83 MCS tests pass | ~12k |

| 2026-03-21 | Add reporting date changer to Operations Mission Control | portals/operations/js/operations-dashboard-state.js, portals/operations/js/operations-dashboard-metrics.js, portals/operations/js/operations-dashboard-main.js, portals/operations/js/operations-dashboard-render-core.js, portals/operations/css/operations-dashboard.css, tests/operations-dashboard.test.js, CHANGELOG.md, .wolf/buglog.json | Added selectable reporting date and as-of labels so dashboard metrics clearly show snapshot context and can be shifted by date | ~950 tok |

| 2026-03-21 | Fix Settings table row density behavior | portals/settings/css/settings.css, CHANGELOG.md, .wolf/buglog.json, .wolf/anatomy.md | Compact row density now updates shared table spacing variables so standard .tbl rows visibly tighten across pages | ~180 tok |

| 2026-03-21 | Fix compact row selection UX in Appearance | portals/settings/js/settings.js, tests/settings-portal.test.js, CHANGELOG.md, .wolf/buglog.json, .wolf/anatomy.md | Density cards now set checked and selected state immediately on click/change so compact is clearly selectable | ~220 tok |

| 2026-03-21 | Stage 2 domain-rule deduplication | .claude/rules/agents.md, .claude/rules/code-style.md, .claude/rules/security.md, .claude/rules/database.md, CHANGELOG.md, .wolf/anatomy.md | Removed repeated core policy text from domain docs and retained canonical owner pointers to cut instruction payload | ~1200 tok |

| 2026-03-21 | Stage 1 instruction compression | CLAUDE.md, .github/copilot-instructions.md, CHANGELOG.md, .wolf/anatomy.md | Reduced always-on instruction payload by converting duplicated guidance into compact router-style guardrails with scoped references | ~900 tok |

| 2026-03-21 | Instruction token optimization package | plans/INSTRUCTION_CORE_MINIMAL_SPEC.md, plans/INSTRUCTION_OWNERSHIP_MAP.md, plans/INSTRUCTION_MIGRATION_PLAN.md, CHANGELOG.md, .wolf/anatomy.md | Added minimal core spec, deduplicated rule ownership map, and safe migration plan with compliance logging updates | ~1100 tok |

| 2026-03-21 | Docs filename normalization | docs/, docs/README.md, plans/MASTER_PLAN.md, QWEN.md | Renamed live docs to lowercase kebab-case and repaired active references and indexes | ~1800 tok |

| 2026-03-21 | Docs folder reorganization | docs/, plans/MASTER_PLAN.md, docs/reference/, docs/guides/, docs/setup/ | Moved live guide/reference files out of `plans/` and trimmed stale future-only sections from surviving docs | ~2600 tok |

| 2026-03-21 | Plans folder cleanup | plans/, plans/MASTER_PLAN.md, plans/NPI_PROJECT_FLOW_GUIDE.md, supabase/mcs_changes_2step_migration.sql | Removed stale completed plan/archive files and kept only active reference docs in `plans/` | ~2200 tok |

| 2026-03-21 | Dark mode accessibility audit + fixes | core/css/components.css, core/css/main.css, portals/settings/css/settings.css | Fixed 2 WCAG AA contrast failures and 8 hardcoded light-palette colours | ~3500 tok |

| 2026-03-21 | Fix tab URL memory for ME/ProdCap/PM capacity sub-tabs | me-capacity.js, prod-capacity.js, pm-capacity.js, navigation.js, app.js | meSetTab/setProdCapTab/pmSetTab now write met=/pct=/pmt= to URL; app.js+popstate restore them on refresh | ~400 tok |

## Session: 2026-03-21 06:37
> Consolidated session (2 actions)

## Session: 2026-03-21 06:39
> Consolidated session (7 actions)

## Session: 2026-03-21 07:21
> Consolidated session (6 actions)

## Session: 2026-03-21 07:38
> Consolidated session (4 actions)

## Session: 2026-03-21 08:28
> Consolidated session (30 actions)

## Session: 2026-03-21 08:54
> Consolidated session (3 actions)

## Session: 2026-03-21 10:11
> Consolidated session (2 actions)

## Session: 2026-03-21 10:26
> Consolidated session (73 actions)

## Session: 2026-03-21 10:51
> Consolidated session (12 actions)

## Session: 2026-03-21 11:14
> Consolidated session (10 actions)

## Session: 2026-03-21 11:20
> Consolidated session (6 actions)

## Session: 2026-03-21 11:43
> Consolidated session (5 actions)

## Session: 2026-03-21 12:00
> Consolidated session (7 actions)

## Session: 2026-03-21 12:09
> Consolidated session (2 actions)

## Session: 2026-03-21 12:42
> Consolidated session (21 actions)

## Session: 2026-03-21 12:55
> Consolidated session (23 actions)

## Session: 2026-03-21 20:26
> Consolidated session (2 actions)

## Session: 2026-03-21 20:43
> Consolidated session (3 actions)

## Session: 2026-03-21 21:01
> Consolidated session (6 actions)

## Session: 2026-03-21 21:28
> Consolidated session (2 actions)

## Session: 2026-03-21 21:36
> Consolidated session (4 actions)

## Session: 2026-03-21 21:46
> Consolidated session (41 actions)

## Session: 2026-03-21 21:58
> Consolidated session (2 actions)

## Session: 2026-03-21 22:08
> Consolidated session (4 actions)

## Session: 2026-03-21 22:13
> Consolidated session (2 actions)

## Session: 2026-03-22 07:47

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 07:47 | Edited ../../../.serena/serena_config.yml | inline fix | ~10 |
| 07:47 | Session end: 1 writes across 1 files (serena_config.yml) | 2 reads | ~10 tok |

## Session: 2026-03-22 07:59

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 08:02 | Created ../../../.claude/plans/valiant-puzzling-origami.md | — | ~1544 |
| 08:05 | Edited portals/product-development/npi/css/apqp-pfd.css | modified media() | ~362 |
| 08:05 | Edited portals/product-development/npi/css/apqp-pfd.css | CSS: max-width | ~34 |
| 08:05 | Edited portals/product-development/npi/js/npi-pfd.js | inline fix | ~126 |
| 08:06 | Edited portals/product-development/npi/js/npi-pfd.js | added 6 condition(s) | ~965 |
| 08:06 | Edited portals/product-development/npi/js/npi-pfd.js | 7→7 lines | ~56 |
| 08:06 | Edited portals/product-development/npi/js/npi-pfd.js | reduced (-7 lines) | ~36 |
| 08:08 | Edited CHANGELOG.md | 1→3 lines | ~123 |
| 08:08 | Session end: 8 writes across 4 files (valiant-puzzling-origami.md, apqp-pfd.css, npi-pfd.js, CHANGELOG.md) | 10 reads | ~56551 tok |

## Session: 2026-03-22 08:11

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 08:24 | Created ../../../.claude/plans/cheerful-frolicking-ember.md | — | ~1695 |
| 08:27 | Edited portals/product-development/npi/js/npi-data.js | modified isHeader() | ~188 |
| 08:27 | Edited portals/product-development/npi/js/npi-pfd.js | expanded (+7 lines) | ~1090 |
| 08:27 | Edited portals/product-development/npi/js/npi-data.js | isDecision() → isTwoPath() | ~44 |
| 08:28 | Edited portals/product-development/npi/js/npi-pfd.js | added 10 condition(s) | ~1568 |
| 08:29 | Edited portals/product-development/npi/js/npi-pfd.js | 2→3 lines | ~42 |
| 08:29 | Edited portals/product-development/npi/js/npi-pfd.js | 2→4 lines | ~135 |
| 08:29 | Edited portals/product-development/npi/js/npi-pfd.js | inline fix | ~88 |
| 08:29 | Edited portals/product-development/npi/js/npi-pfd.js | 1→2 lines | ~305 |
| 08:30 | Edited portals/product-development/npi/js/npi-pfd.js | modified function() | ~85 |
| 08:30 | Edited portals/product-development/npi/js/npi-events.js | 1→2 lines | ~32 |
| 08:30 | Edited portals/product-development/npi/js/npi-pfd.js | 3→7 lines | ~137 |
| 08:30 | Edited portals/product-development/npi/js/npi-pfd.js | 1→2 lines | ~66 |
| 08:30 | Edited portals/product-development/npi/js/npi-pfd.js | inline fix | ~81 |
| 08:31 | Edited portals/product-development/npi/css/apqp-pfd.css | expanded (+54 lines) | ~566 |
| 08:32 | Edited tests/npi-pfd-flowchart.test.js | expanded (+114 lines) | ~1228 |
| 08:32 | Edited CHANGELOG.md | 1→3 lines | ~151 |
| 08:33 | Session end: 17 writes across 7 files (cheerful-frolicking-ember.md, npi-data.js, npi-pfd.js, npi-events.js, apqp-pfd.css) | 17 reads | ~86055 tok |
| 08:33 | Session end: 17 writes across 7 files (cheerful-frolicking-ember.md, npi-data.js, npi-pfd.js, npi-events.js, apqp-pfd.css) | 18 reads | ~86055 tok |

## Session: 2026-03-22 10:11

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 10:11 | Created ../../../root/.claude/plans/keen-wibbling-island.md | — | ~609 |
| 10:15 | Edited ../../../root/.claude/plans/keen-wibbling-island.md | modified 1() | ~623 |

## Session: 2026-03-22 10:22

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 10:22 | Edited ../../../root/.claude/plans/keen-wibbling-island.md | added 5 condition(s) | ~1741 |
| 10:24 | Edited index.html | expanded (+15 lines) | ~210 |
| 10:24 | Edited core/css/main.css | modified media() | ~749 |
| 10:24 | Edited core/js/db.js | added 1 condition(s) | ~138 |
| 10:24 | Edited core/js/db.js | added 2 condition(s) | ~253 |
| 10:25 | Edited utils/js/realtime.js | added 1 condition(s) | ~131 |
| 10:25 | Edited utils/js/realtime.js | 3→4 lines | ~51 |
| 10:25 | Edited utils/js/realtime.js | modified removeRealtimeSubscription() | ~109 |
| 10:25 | Edited utils/js/realtime.js | modified removeRealtimeSubscriptionsMatching() | ~104 |
| 10:28 | Created core/js/network.js | — | ~739 |
| 10:28 | Edited index.html | 6→7 lines | ~72 |
| 10:28 | Edited core/js/app.js | added 1 condition(s) | ~74 |

## Session: 2026-03-22 10:34

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 10:35 | Edited index.html | 11→9 lines | ~223 |
| 10:36 | Edited core/css/main.css | CSS: tbtn-primary | ~177 |
| 10:36 | Edited core/css/main.css | 5→5 lines | ~62 |

## Session: 2026-03-22 10:40

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 10:44 | Edited portals/hub/css/hub.css | modified media() | ~108 |
| 10:44 | Edited portals/hub/css/hub.css | 7→7 lines | ~40 |
| 10:44 | Edited CHANGELOG.md | 6→8 lines | ~148 |

## Session: 2026-03-22 10:52

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 10:55 | Created ../../../root/.claude/plans/zippy-chasing-ritchie.md | — | ~1057 |
| 10:59 | Edited core/css/components.css | modified media() | ~115 |
| 10:59 | Edited core/css/main.css | expanded (+8 lines) | ~71 |
| 10:59 | Edited core/css/components.css | expanded (+26 lines) | ~177 |
| 10:59 | Edited core/css/main.css | 2→2 lines | ~18 |
| 10:59 | Edited core/css/components.css | CSS: box-shadow | ~180 |
| 10:59 | Edited core/css/main.css | expanded (+13 lines) | ~106 |
| 10:59 | Edited core/css/components.css | CSS: max-width | ~109 |
| 10:59 | Edited core/css/components.css | CSS: border-radius | ~122 |
| 11:00 | Edited CHANGELOG.md | 6→8 lines | ~185 |

## Session: 2026-03-22 11:07

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 11:10 | Edited core/css/main.css | CSS: theme, background | ~124 |
| 11:10 | Edited CHANGELOG.md | 1→3 lines | ~87 |

## Session: 2026-03-22 11:14

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 11:16 | Edited portals/capacity/css/me-capacity-heatmap.css | CSS: max-height, -webkit-overflow-scrolling, min-width | ~100 |
| 11:16 | Edited portals/capacity/css/me-capacity-responsive.css | 13→13 lines | ~66 |
| 11:16 | Edited CHANGELOG.md | 1→3 lines | ~93 |

## Session: 2026-03-22 11:21

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 11:23 | Edited core/css/main.css | 10→13 lines | ~331 |
| 11:23 | Edited index.html | inline fix | ~26 |
| 11:23 | Edited core/css/main.css | 11→11 lines | ~71 |
| 11:24 | Edited CHANGELOG.md | 4→6 lines | ~211 |

## Session: 2026-03-22 11:28

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 11:29 | Edited index.html | 9→7 lines | ~60 |
| 11:30 | Edited index.html | 7→9 lines | ~79 |
| 11:30 | Edited core/css/main.css | — | ~0 |
| 11:30 | Edited core/css/main.css | removed 4 lines | ~1 |
| 11:30 | Edited CHANGELOG.md | 2→4 lines | ~87 |
| 11:30 | Session end: 5 writes across 3 files (index.html, main.css, CHANGELOG.md) | 3 reads | ~18281 tok |
| 11:32 | Edited core/css/main.css | inline fix | ~12 |
| 11:32 | Edited core/css/main.css | 2→2 lines | ~38 |
| 11:32 | Edited CHANGELOG.md | 1→3 lines | ~65 |
| 11:32 | Session end: 8 writes across 3 files (index.html, main.css, CHANGELOG.md) | 3 reads | ~18396 tok |

## Session: 2026-03-22 11:34

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 11:39 | Edited portals/mcs/js/mcs-approvers-data.js | added 8 condition(s) | ~1282 |
| 11:39 | Edited portals/product-development/npi/js/npi-data.js | added 3 condition(s) | ~364 |
| 11:40 | Edited portals/settings/js/settings.js | 3→3 lines | ~63 |
| 11:40 | Edited portals/settings/js/settings.js | modified settingsEnsureMcsData() | ~251 |
| 11:41 | Edited portals/settings/js/settings.js | modified renderSettingsMcsTab() | ~1808 |
| 11:41 | Edited portals/settings/js/settings.js | added 10 condition(s) | ~773 |
| 11:41 | Edited portals/settings/js/settings.js | added 2 condition(s) | ~182 |
| 11:42 | Edited portals/product-development/npi/js/npi.js | added 1 condition(s) | ~159 |
| 11:43 | Edited CHANGELOG.md | 5→7 lines | ~122 |
| 11:43 | Session end: 9 writes across 5 files (mcs-approvers-data.js, npi-data.js, settings.js, npi.js, CHANGELOG.md) | 7 reads | ~15312 tok |
| 11:44 | Session end: 9 writes across 5 files (mcs-approvers-data.js, npi-data.js, settings.js, npi.js, CHANGELOG.md) | 7 reads | ~15312 tok |
| 11:56 | Created ../../../.claude/projects/c--Users-Tidyco-Documents-VScode-Tidyco-apqp/memory/feedback_use_serena.md | — | ~229 |
| 11:56 | Created ../../../.claude/projects/c--Users-Tidyco-Documents-VScode-Tidyco-apqp/memory/MEMORY.md | — | ~73 |
| 11:56 | Session end: 11 writes across 7 files (mcs-approvers-data.js, npi-data.js, settings.js, npi.js, CHANGELOG.md) | 8 reads | ~15635 tok |
| 12:01 | Edited CLAUDE.md | 1→5 lines | ~94 |
| 12:01 | Session end: 12 writes across 8 files (mcs-approvers-data.js, npi-data.js, settings.js, npi.js, CHANGELOG.md) | 9 reads | ~16219 tok |

## Session: 2026-03-22 14:23

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 14:24 | Edited index.html | 4→4 lines | ~120 |
| 14:24 | Edited CHANGELOG.md | 1→3 lines | ~66 |

## Session: 2026-03-22 15:10

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 15:11 | Edited portals/hub/css/hub.css | CSS: cursor | ~91 |
| 15:12 | Created tests/capacity-hub.test.js | — | ~2344 |
| 15:12 | Edited tests/capacity-hub.test.js | 6→7 lines | ~96 |
| 15:12 | Edited tests/capacity-hub.test.js | modified expect() | ~222 |
| 15:12 | Edited tests/capacity-hub.test.js | 9→9 lines | ~75 |
| 15:12 | Edited tests/capacity-hub.test.js | modified const() | ~300 |
| 15:13 | Edited CHANGELOG.md | 6→8 lines | ~142 |

## Session: 2026-03-22 18:34

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 18:36 | Edited README.md | inline fix | ~23 |
| 18:36 | Edited README.md | inline fix | ~20 |
| 18:36 | Edited index.html | inline fix | ~10 |
| 18:36 | Edited portals/mcs/css/mcs.css | inline fix | ~14 |
| 18:36 | Edited portals/mcs/js/mcs-main.js | 4→4 lines | ~35 |
| 18:36 | Edited core/js/state.js | inline fix | ~16 |
| 18:36 | Edited utils/js/navigation.js | "Manufacturing Change Syst" → "Manufacturing Change" | ~9 |
| 18:36 | Edited utils/js/helpers.js | inline fix | ~26 |
| 18:36 | Edited CHANGELOG.md | 4→6 lines | ~139 |
| 18:44 | Edited portals/mcs/js/mcs-main.js | added 1 condition(s) | ~104 |
| 18:44 | Edited portals/mcs/js/mcs-main.js | 18→22 lines | ~378 |
| 18:44 | Edited portals/mcs/js/mcs-main.js | 6→7 lines | ~76 |
| 18:44 | Edited portals/mcs/js/mcs-main.js | modified mcsKpiFilterApproval1() | ~169 |
| 18:44 | Edited portals/mcs/css/mcs.css | 4→5 lines | ~93 |
| 18:49 | Edited .gitignore | 6→7 lines | ~53 |

## Session: 2026-03-22 19:10

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 19:12 | Created supabase/pfmea_mcs_linking.sql | — | ~278 |
| 19:19 | Edited portals/product-development/npi/js/pfmea.js | inline fix | ~196 |
| 20:02 | Edited core/js/state.js | 2→3 lines | ~48 |
| 20:04 | Edited portals/mcs/js/mcs-main.js | expanded (+11 lines) | ~209 |
| 20:04 | Edited portals/mcs/js/mcs-main.js | 3→4 lines | ~86 |
| 20:04 | Edited CHANGELOG.md | 4→6 lines | ~66 |
| 20:04 | Session end: 6 writes across 5 files (pfmea_mcs_linking.sql, pfmea.js, state.js, mcs-main.js, CHANGELOG.md) | 9 reads | ~46018 tok |

## Session: 2026-03-22 20:13

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 20:17 | Edited plans/pfMEA-improvements-plan.md | modified field() | ~79 |
| 20:17 | Edited plans/pfMEA-improvements-plan.md | modified delegation() | ~160 |
| 20:17 | Edited plans/pfMEA-improvements-plan.md | modified column() | ~121 |
| 20:18 | Edited plans/pfMEA-improvements-plan.md | modified object() | ~79 |
| 20:18 | Edited plans/pfMEA-improvements-plan.md | modified delegation() | ~172 |
| 20:18 | Edited plans/pfMEA-improvements-plan.md | 7→7 lines | ~157 |
| 20:18 | Edited plans/pfMEA-improvements-plan.md | 32→31 lines | ~309 |
| 20:18 | Edited plans/pfMEA-improvements-plan.md | 20→17 lines | ~187 |
| 20:19 | Edited plans/pfMEA-improvements-plan.md | modified pfmeaInit() | ~454 |
| 20:19 | Edited plans/pfMEA-improvements-plan.md | modified js() | ~71 |
| 20:19 | Edited plans/pfMEA-improvements-plan.md | 4→3 lines | ~59 |
| 20:19 | Edited plans/pfMEA-improvements-plan.md | modified js() | ~145 |
| 20:19 | Edited plans/pfMEA-improvements-plan.md | 4→3 lines | ~55 |
| 20:20 | Session end: 13 writes across 1 files (pfMEA-improvements-plan.md) | 2 reads | ~2193 tok |

## Session: 2026-03-22 20:30

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 20:36 | Edited portals/product-development/npi/js/npi-data-relational.js | 6→7 lines | ~64 |
| 20:36 | Edited portals/product-development/npi/js/npi-data-relational.js | 8→9 lines | ~79 |
| 20:36 | Edited portals/product-development/npi/js/npi-constants.js | expanded (+8 lines) | ~150 |
| 20:42 | Edited portals/product-development/npi/js/pfmea.js | added error handling | ~1912 |
| 20:44 | Edited index.html | expanded (+14 lines) | ~155 |
| 20:44 | Edited portals/product-development/npi/js/npi-events.js | 1→2 lines | ~17 |
| 20:45 | Edited portals/product-development/npi/js/npi-events.js | 4→7 lines | ~202 |
| 20:45 | Edited portals/product-development/npi/js/npi-events.js | 5→9 lines | ~356 |
| 20:45 | Edited portals/product-development/npi/js/npi-events.js | modified switch() | ~68 |
| 20:46 | Edited portals/product-development/npi/css/pfmea.css | modified media() | ~1012 |
| 20:46 | Edited portals/product-development/npi/css/pfmea.css | modified media() | ~94 |
| 20:47 | Edited CHANGELOG.md | 1→3 lines | ~120 |
| 20:48 | Session end: 12 writes across 7 files (npi-data-relational.js, npi-constants.js, pfmea.js, index.html, npi-events.js) | 11 reads | ~30910 tok |

## Session: 2026-03-22 20:58

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 21:01 | Edited portals/product-development/npi/js/npi-events.js | added 1 condition(s) | ~103 |
| 21:01 | Edited portals/product-development/npi/js/npi-constants.js | 5→5 lines | ~82 |
| 21:01 | Edited portals/product-development/npi/js/pfmea.js | 4→4 lines | ~100 |
| 21:02 | Edited portals/product-development/npi/js/pfmea.js | 4→4 lines | ~104 |
| 21:02 | Edited portals/product-development/npi/js/pfmea.js | 2→3 lines | ~128 |
| 21:02 | Edited portals/product-development/npi/css/pfmea.css | expanded (+9 lines) | ~132 |
| 21:03 | Edited utils/js/guide.js | expanded (+19 lines) | ~696 |
| 21:03 | Edited CHANGELOG.md | 1→3 lines | ~126 |
| 21:03 | Session end: 8 writes across 6 files (npi-events.js, npi-constants.js, pfmea.js, pfmea.css, guide.js) | 8 reads | ~34608 tok |
| 21:14 | Edited portals/product-development/npi/js/pfmea.js | 4→4 lines | ~94 |
| 21:15 | Session end: 9 writes across 6 files (npi-events.js, npi-constants.js, pfmea.js, pfmea.css, guide.js) | 8 reads | ~34748 tok |

## Session: 2026-03-22 21:17

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 21:21 | Edited portals/product-development/npi/js/pfmea.js | "width:44px" → "width:60px" | ~12 |
| 21:21 | Edited portals/product-development/npi/js/pfmea.js | inline fix | ~28 |
| 21:21 | Edited CHANGELOG.md | 4→6 lines | ~104 |
| 21:21 | Session end: 3 writes across 2 files (pfmea.js, CHANGELOG.md) | 3 reads | ~30298 tok |

## Session: 2026-03-23 06:26

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 06:30 | Created ../../../.claude/plans/polymorphic-waddling-shell.md | — | ~1370 |
| 06:35 | Edited portals/production/js/scheduling.js | 1→2 lines | ~37 |
| 06:37 | Edited portals/production/css/production.css | expanded (+26 lines) | ~228 |
| 06:38 | Edited CHANGELOG.md | 2→4 lines | ~75 |
| 06:38 | Session end: 4 writes across 4 files (polymorphic-waddling-shell.md, scheduling.js, production.css, CHANGELOG.md) | 11 reads | ~65814 tok |
| 16:02 | Edited portals/capacity/js/me-data.js | removed dead me_capacity fallback and scoped holiday delete to current user | ~365 |
| 16:03 | Edited tests/me-data-core.test.js | replaced fallback regression with init/save protection tests | ~170 |
| 16:05 | Edited CHANGELOG.md | updated holiday persistence entry | ~46 |

## Session: 2026-03-23 10:38

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 10:43 | Edited portals/capacity/js/me-data.js | 2→3 lines | ~30 |
| 10:43 | Edited portals/capacity/js/me-data.js | modified catch() | ~59 |
| 10:43 | Edited portals/capacity/js/me-capacity.js | modified if() | ~144 |
| 10:44 | Edited CHANGELOG.md | 1→3 lines | ~134 |
| 10:44 | Session end: 4 writes across 3 files (me-data.js, me-capacity.js, CHANGELOG.md) | 9 reads | ~31595 tok |

## Session: 2026-03-23 10:56

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 11:06 | Edited CHANGELOG.md | 1→3 lines | ~69 |
| 11:06 | Session end: 1 writes across 1 files (CHANGELOG.md) | 1 reads | ~12216 tok |

## Session: 2026-03-23 11:46

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 11:48 | Edited portals/capacity/css/me-capacity-heatmap.css | 20 → 52 | ~14 |
| 11:48 | Edited portals/capacity/js/me-heatmap.js | inline fix | ~23 |
| 11:48 | Edited portals/capacity/js/me-heatmap.js | 20 → 52 | ~13 |
| 11:48 | Edited CHANGELOG.md | 2→4 lines | ~72 |
| 11:48 | Session end: 4 writes across 3 files (me-capacity-heatmap.css, me-heatmap.js, CHANGELOG.md) | 4 reads | ~16415 tok |

## Session: 2026-03-23 12:06

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 12:09 | Edited portals/capacity/js/me-tasks.js | 16→18 lines | ~114 |
| 12:09 | Edited portals/capacity/js/me-tasks.js | added 4 condition(s) | ~236 |
| 12:09 | Edited portals/capacity/js/me-tasks.js | added 3 condition(s) | ~397 |
| 12:10 | Edited portals/capacity/js/me-tasks.js | expanded (+7 lines) | ~334 |
| 12:10 | Edited portals/capacity/js/capacity-events.js | added 1 condition(s) | ~78 |
| 12:10 | Edited portals/capacity/js/capacity-events.js | added 1 condition(s) | ~80 |
| 12:10 | Edited portals/capacity/js/capacity-events.js | inline fix | ~36 |
| 12:10 | Edited CHANGELOG.md | 4→6 lines | ~80 |
| 12:11 | Session end: 8 writes across 3 files (me-tasks.js, capacity-events.js, CHANGELOG.md) | 3 reads | ~23423 tok |

## Session: 2026-03-23 12:36

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 12:39 | Edited portals/capacity/js/me-calculations.js | added 4 condition(s) | ~292 |
| 12:39 | Edited CHANGELOG.md | 1→3 lines | ~66 |
| 12:40 | Session end: 2 writes across 2 files (me-calculations.js, CHANGELOG.md) | 4 reads | ~18893 tok |

## Session: 2026-03-23 13:09

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 18:31 | Edited portals/capacity/js/me-data-relational.js | added 3 condition(s) | ~82 |
| 18:31 | Edited portals/capacity/js/me-data.js | added 3 condition(s) | ~82 |
| 18:31 | Edited portals/capacity/js/me-capacity.js | added 2 condition(s) | ~134 |
| 18:31 | Edited portals/capacity/js/me-capacity.js | added 2 condition(s) | ~153 |
| 18:31 | Edited portals/capacity/js/me-capacity.js | added 2 condition(s) | ~142 |
| 18:31 | Edited portals/capacity/js/me-capacity.js | added 2 condition(s) | ~154 |
| 18:31 | Edited portals/capacity/js/me-capacity.js | added 2 condition(s) | ~141 |
| 18:32 | Edited portals/capacity/js/me-capacity.js | added 2 condition(s) | ~141 |
| 18:32 | Created portals/capacity/logistics/js/log-capacity.js | — | ~2256 |
| 18:33 | Created portals/capacity/unit6/js/unit6-capacity.js | — | ~2314 |
| 18:33 | Edited portals/capacity/js/capacity.js | modified capacityNavBar() | ~261 |
| 18:33 | Edited portals/capacity/js/capacity.js | added 2 condition(s) | ~156 |
| 18:34 | Edited portals/capacity/js/capacity.js | 5→7 lines | ~170 |
| 18:34 | Edited portals/capacity/js/capacity.js | expanded (+30 lines) | ~580 |
| 18:34 | Edited portals/capacity/js/capacity-events.js | added 2 condition(s) | ~196 |
| 18:34 | Edited portals/capacity/js/capacity-events.js | 4→5 lines | ~92 |
| 18:34 | Edited portals/capacity/js/capacity-events.js | added 4 condition(s) | ~485 |
| 18:35 | Edited index.html | 3→5 lines | ~97 |
| 18:35 | Edited core/js/state.js | inline fix | ~21 |
| 18:35 | Edited CHANGELOG.md | 1→3 lines | ~139 |
| 18:36 | Session end: 20 writes across 10 files (me-data-relational.js, me-data.js, me-capacity.js, log-capacity.js, unit6-capacity.js) | 13 reads | ~61105 tok |
| 18:36 | Diagnosed OpenWolf cerebrum-reflection cron failure | .wolf/cron-state.json, .wolf/daemon.log, .wolf/config.json, C:/Users/Tidyco/AppData/Roaming/npm/node_modules/openwolf/dist/src/daemon/cron-engine.js | confirmed AI cron tasks fail when `claude` CLI is missing from PATH | ~1800 tok |
| 18:48 | Installed Claude Code and verified OpenWolf cron recovery | .wolf/cron-state.json, .wolf/daemon.log | installed Claude Code 2.1.81 via winget, verified `claude -p`, restarted daemon with updated PATH, and confirmed `cerebrum-reflection` succeeded | ~2200 tok |

## Session: 2026-03-23 18:55

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 19:00 | Created portals/mcs/js/mcs-modal-shared.js | — | ~3486 |
| 19:00 | Created portals/mcs/js/mcs-modal-create.js | — | ~2728 |
| 19:01 | Created portals/mcs/js/mcs-modal-view.js | — | ~5331 |
| 19:02 | Created portals/mcs/js/mcs-modal-edit.js | — | ~4964 |
| 19:03 | Edited index.html | 1→4 lines | ~62 |
| 19:03 | Edited CHANGELOG.md | 4→6 lines | ~94 |
| 19:03 | Session end: 6 writes across 6 files (mcs-modal-shared.js, mcs-modal-create.js, mcs-modal-view.js, mcs-modal-edit.js, index.html) | 3 reads | ~56393 tok |
| 19:04 | Session end: 6 writes across 6 files (mcs-modal-shared.js, mcs-modal-create.js, mcs-modal-view.js, mcs-modal-edit.js, index.html) | 3 reads | ~56393 tok |

## Session: 2026-03-23 19:08

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 19:12 | Edited .mcp.json | 12→14 lines | ~83 |
| 19:12 | Session end: 1 writes across 1 files (.mcp.json) | 2 reads | ~262 tok |

## Session: 2026-03-23 19:27

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 19:29 | Edited portals/capacity/js/me-data.js | 8→9 lines | ~82 |
| 19:29 | Session end: 1 writes across 1 files (me-data.js) | 3 reads | ~29566 tok |

## Session: 2026-03-23 19:33

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 19:37 | Edited portals/capacity/js/me-data.js | modified if() | ~221 |
| 19:37 | Edited CHANGELOG.md | 4→6 lines | ~86 |
| 19:37 | Session end: 2 writes across 2 files (me-data.js, CHANGELOG.md) | 4 reads | ~29906 tok |

## Session: 2026-03-23 19:40

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 19:47 | Edited portals/capacity/js/me-data.js | inline fix | ~28 |
| 19:47 | Edited portals/capacity/js/me-data.js | modified function() | ~169 |
| 19:47 | Edited portals/capacity/logistics/js/log-capacity.js | added 3 condition(s) | ~106 |
| 19:47 | Edited portals/capacity/unit6/js/unit6-capacity.js | added 3 condition(s) | ~108 |
| 19:47 | Edited CHANGELOG.md | 4→6 lines | ~116 |
| 19:47 | Session end: 5 writes across 4 files (me-data.js, log-capacity.js, unit6-capacity.js, CHANGELOG.md) | 8 reads | ~38970 tok |

## Session: 2026-03-23 20:03

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 20:55 | Edited CHANGELOG.md | 1→3 lines | ~123 |
| 20:56 | Session end: 1 writes across 1 files (CHANGELOG.md) | 3 reads | ~28042 tok |
| 21:00 | Edited tests/npi-data-relational.test.js | added 1 condition(s) | ~566 |
| 21:01 | Edited CHANGELOG.md | 1→3 lines | ~81 |
| 21:01 | Session end: 3 writes across 2 files (CHANGELOG.md, npi-data-relational.test.js) | 5 reads | ~30557 tok |

## Session: 2026-03-23 21:08

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 21:10 | Created tests/me-data-relational-queries.test.js | — | ~3553 |
| 21:11 | Edited tests/prod-capacity-data.test.js | expanded (+63 lines) | ~840 |
| 21:11 | Created tests/work-areas-data.test.js | — | ~1643 |
| 21:12 | Edited CHANGELOG.md | 1→3 lines | ~107 |
| 21:12 | Session end: 4 writes across 4 files (me-data-relational-queries.test.js, prod-capacity-data.test.js, work-areas-data.test.js, CHANGELOG.md) | 2 reads | ~20755 tok |

## Session: 2026-03-23 21:17

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 21:55 | Edited utils/js/guide.js | 2→2 lines | ~75 |
| 21:56 | Edited utils/js/guide.js | expanded (+8 lines) | ~450 |
| 21:56 | Edited utils/js/guide.js | inline fix | ~92 |
| 21:56 | Edited utils/js/guide.js | 12→16 lines | ~440 |
| 21:56 | Edited utils/js/guide.js | inline fix | ~119 |
| 21:57 | Edited utils/js/guide.js | expanded (+70 lines) | ~1204 |
| 21:57 | Edited CHANGELOG.md | 4→6 lines | ~115 |
| 21:57 | Session end: 7 writes across 2 files (guide.js, CHANGELOG.md) | 4 reads | ~32397 tok |
| 21:59 | Edited utils/js/guide.js | 18→22 lines | ~475 |
| 22:00 | Edited CHANGELOG.md | inline fix | ~78 |
| 22:00 | Session end: 9 writes across 2 files (guide.js, CHANGELOG.md) | 4 reads | ~34636 tok |

## Session: 2026-03-23 22:17

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 22:18 | Edited index.html | 3→4 lines | ~95 |
| 22:18 | Edited core/css/main.css | CSS: opacity, wiki-btn, opacity | ~228 |
| 22:19 | Edited CHANGELOG.md | 6→8 lines | ~186 |
| 22:20 | Session end: 3 writes across 3 files (index.html, main.css, CHANGELOG.md) | 4 reads | ~33599 tok |
| 22:25 | Edited index.html | 2→1 lines | ~26 |
| 22:25 | Edited index.html | inline fix | ~24 |
| 22:25 | Edited CHANGELOG.md | 4→6 lines | ~82 |
| 22:25 | Session end: 7 writes across 4 files (index.html, main.css, CHANGELOG.md, app.js) | 5 reads | ~35603 tok |

## Session: 2026-03-24 06:00

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 06:01 | Created .nojekyll | — | ~0 |
| 06:01 | Edited .claude/serve.ps1 | 2→3 lines | ~16 |
| 06:02 | Edited CHANGELOG.md | 4→6 lines | ~89 |
| 06:02 | Session end: 3 writes across 3 files (.nojekyll, serve.ps1, CHANGELOG.md) | 6 reads | ~27587 tok |
| 06:03 | Session end: 3 writes across 3 files (.nojekyll, serve.ps1, CHANGELOG.md) | 6 reads | ~27587 tok |

## Session: 2026-03-24 06:13

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 06:14 | Edited core/js/app.js | removed 21 lines | ~1 |
| 06:15 | Edited CHANGELOG.md | 4→6 lines | ~104 |
| 06:15 | Session end: 2 writes across 2 files (app.js, CHANGELOG.md) | 3 reads | ~27434 tok |

## Session: 2026-03-24 09:17

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 09:19 | Edited CHANGELOG.md | 4→6 lines | ~91 |
| 09:20 | Session end: 1 writes across 1 files (CHANGELOG.md) | 4 reads | ~97 tok |
| 09:20 | Session end: 1 writes across 1 files (CHANGELOG.md) | 4 reads | ~97 tok |

## Session: 2026-03-24 10:15

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 11:26 | Created ../../../.claude/plans/dapper-meandering-quilt.md | — | ~2165 |
| 11:31 | Edited ../../../.claude/plans/dapper-meandering-quilt.md | 2→2 lines | ~61 |
| 11:31 | Edited ../../../.claude/plans/dapper-meandering-quilt.md | 1→3 lines | ~212 |
| 11:32 | Edited ../../../.claude/plans/dapper-meandering-quilt.md | 4→4 lines | ~265 |
| 11:32 | Edited ../../../.claude/plans/dapper-meandering-quilt.md | 4→5 lines | ~190 |
| 11:40 | Created ../../../.claude/projects/c--Users-Tidyco-Documents-VScode-Tidyco-apqp/memory/project_capacity_split.md | — | ~657 |
| 11:40 | Edited ../../../.claude/projects/c--Users-Tidyco-Documents-VScode-Tidyco-apqp/memory/MEMORY.md | 1→2 lines | ~107 |
| 11:44 | Created plans/capacity-department-split.md | — | ~2588 |
| 11:44 | Session end: 8 writes across 4 files (dapper-meandering-quilt.md, project_capacity_split.md, MEMORY.md, capacity-department-split.md) | 45 reads | ~6691 tok |
| 11:51 | Created plans/capacity-department-split.md | — | ~3975 |
| 11:52 | Session end: 9 writes across 4 files (dapper-meandering-quilt.md, project_capacity_split.md, MEMORY.md, capacity-department-split.md) | 51 reads | ~13377 tok |

## Session: 2026-03-24 11:52

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 12:01 | Created portals/capacity/project-management/js/pm-data-relational.js | — | ~3143 |
| 12:02 | Created portals/capacity/logistics/js/log-data-relational.js | — | ~3166 |
| 12:02 | Created portals/capacity/unit6/js/unit6-data-relational.js | — | ~3207 |
| 12:04 | Created portals/capacity/project-management/js/pm-data.js | — | ~8203 |

## Session: 2026-03-24 21:05

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 21:14 | Edited portals/capacity/js/me-data.js | added 8 condition(s) | ~664 |
| 21:14 | Edited portals/capacity/js/me-products.js | modified meProductsCreateState() | ~73 |
| 21:15 | Edited portals/capacity/js/me-products.js | added 14 condition(s) | ~849 |
| 21:16 | Edited portals/capacity/js/me-products.js | added 1 condition(s) | ~1136 |
| 21:16 | Edited portals/capacity/js/capacity-events.js | added 5 condition(s) | ~541 |
| 21:17 | Edited utils/js/guide.js | 4→5 lines | ~320 |
| 21:17 | Edited utils/js/guide.js | 1→2 lines | ~189 |
| 21:17 | Edited utils/js/guide.js | 2→3 lines | ~188 |
| 21:17 | Edited utils/js/guide.js | 2→3 lines | ~178 |
| 21:17 | Edited CHANGELOG.md | 1→3 lines | ~134 |
| 21:18 | Session end: 10 writes across 5 files (me-data.js, me-products.js, capacity-events.js, guide.js, CHANGELOG.md) | 7 reads | ~71022 tok |


| 21:31 | Edited portals/capacity/js/me-data.js | added 1 condition(s) | ~77 |
| 21:31 | Edited portals/capacity/js/me-data.js | added 1 condition(s) | ~126 |
| 21:31 | Edited portals/capacity/js/me-products.js | added 1 condition(s) | ~90 |
| 21:31 | Edited portals/capacity/js/me-products.js | 9→9 lines | ~591 |
| 21:32 | Edited portals/capacity/js/capacity-events.js | added 1 condition(s) | ~130 |
| 21:32 | Edited portals/capacity/js/capacity-events.js | added 1 condition(s) | ~132 |
| 21:33 | Edited CHANGELOG.md | 4→6 lines | ~153 |
| 21:33 | Session end: 7 writes across 4 files (me-data.js, me-products.js, capacity-events.js, CHANGELOG.md) | 5 reads | ~60731 tok |

## Session: 2026-03-24 21:39

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 08:26

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 08:26

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 10:27

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 10:27

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 11:28 | Edited portals/capacity/logistics/js/log-data.js | added 2 condition(s) | ~749 |
| 11:29 | Edited portals/capacity/project-management/js/pm-data.js | added 2 condition(s) | ~701 |
| 11:29 | Edited portals/capacity/unit6/js/unit6-data.js | added 2 condition(s) | ~757 |
| 11:29 | Edited CHANGELOG.md | 1→3 lines | ~139 |
| 11:29 | Session end: 4 writes across 4 files (log-data.js, pm-data.js, unit6-data.js, CHANGELOG.md) | 9 reads | ~2355 tok |

## Session: 2026-03-25 12:07

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 12:10 | Edited portals/mcs/js/mcs-modal-edit.js | 4→4 lines | ~82 |
| 12:10 | Edited portals/mcs/js/mcs-modal-edit.js | 4→4 lines | ~79 |
| 12:10 | Edited CHANGELOG.md | 2→4 lines | ~102 |
| 12:10 | Session end: 3 writes across 2 files (mcs-modal-edit.js, CHANGELOG.md) | 2 reads | ~23945 tok |

## Session: 2026-03-25 12:13

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 12:33 | Created plans/surgical-realtime-updates.md | — | ~2675 |
| 12:33 | Session end: 1 writes across 1 files (surgical-realtime-updates.md) | 3 reads | ~14758 tok |

## Session: 2026-03-25 12:46

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 12:46

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 12:48

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 12:48

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 12:53 | Created utils/js/realtime-patch.js | — | ~845 |
| 12:53 | Edited index.html | 1→2 lines | ~26 |
| 12:56 | Edited portals/settings/js/settings.js | modified map() | ~448 |
| 12:56 | Edited portals/settings/js/settings.js | added optional chaining | ~273 |
| 12:57 | Edited portals/capacity/js/work-areas-data.js | added 4 condition(s) | ~391 |
| 12:58 | Edited portals/settings/js/settings.js | modified map() | ~626 |
| 12:58 | Edited portals/settings/js/settings.js | added optional chaining | ~453 |
| 12:58 | Edited portals/product-development/js/families-data.js | added 3 condition(s) | ~471 |
| 13:08 | Edited portals/product-development/js/product-development.js | removed 23 lines | ~44 |
| 13:08 | Edited portals/product-development/js/product-development.js | modified familyTemplateViewerRowHTML() | ~479 |
| 13:08 | Edited portals/product-development/js/family-templates-data.js | added 3 condition(s) | ~524 |
| 13:09 | Edited portals/product-development/npi/js/bom-cclass.js | render() → refreshABCCatalogueResults() | ~276 |
| 13:10 | Edited portals/mcs/js/mcs-main.js | removed 42 lines | ~24 |
| 13:11 | Edited portals/mcs/js/mcs-main.js | modified mcsRenderCardHTML() | ~567 |
| 13:11 | Edited portals/mcs/js/mcs-realtime.js | added optional chaining | ~614 |
| 13:13 | Edited portals/feedback/js/feedback.js | added 2 condition(s) | ~151 |
| 13:13 | Edited portals/feedback/js/feedback-data.js | _publishChange() → feedbackRefreshContent() | ~371 |
| 13:15 | Edited portals/production/js/scheduling.js | inline fix | ~38 |
| 13:15 | Edited portals/production/js/scheduling.js | 2→2 lines | ~34 |
| 13:15 | Edited portals/production/js/production.js | added 5 condition(s) | ~160 |
| 13:16 | Edited portals/production/js/data.js | added 11 condition(s) | ~1246 |
| 13:17 | Edited CHANGELOG.md | 1→3 lines | ~130 |

## Session: 2026-03-25 13:18

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 13:20 | Edited portals/capacity/js/me-capacity.js | render() → meRefreshCurrentTab() | ~51 |
| 13:20 | Edited portals/capacity/project-management/js/pm-capacity.js | render() → pmRefreshCurrentTab() | ~51 |
| 13:20 | Edited portals/capacity/logistics/js/log-capacity.js | render() → logRefreshCurrentTab() | ~28 |
| 13:21 | Edited portals/capacity/unit6/js/unit6-capacity.js | render() → unit6RefreshCurrentTab() | ~30 |
| 13:21 | Edited portals/capacity/js/prod-capacity-data.js | render() → prodCapRefreshCurrentTab() | ~66 |
| 13:21 | Edited portals/capacity/js/prod-capacity-data.js | render() → prodCapRefreshCurrentTab() | ~324 |
| 13:22 | Edited CHANGELOG.md | 1→3 lines | ~100 |
| 13:22 | Session end: 7 writes across 6 files (me-capacity.js, pm-capacity.js, log-capacity.js, unit6-capacity.js, prod-capacity-data.js) | 7 reads | ~36805 tok |

## Session: 2026-03-25 15:20

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 15:49 | Edited core/js/state.js | inline fix | ~17 |
| 15:49 | Edited core/js/state.js | 2→3 lines | ~73 |
| 15:49 | Edited core/js/state.js | inline fix | ~22 |
| 15:49 | Edited portals/product-development/npi/js/npi-constants.js | 3→3 lines | ~51 |
| 15:50 | Edited portals/product-development/npi/js/npi-data-relational.js | 22→21 lines | ~446 |
| 15:50 | Edited portals/product-development/npi/js/npi-data-relational.js | modified if() | ~444 |
| 15:50 | Edited portals/product-development/npi/js/npi-data-relational.js | added error handling | ~453 |
| 15:50 | Edited portals/product-development/npi/js/npi-data-relational.js | 4→4 lines | ~77 |
| 15:51 | Edited portals/product-development/npi/js/npi-data.js | modified delRow() | ~644 |
| 15:54 | Edited portals/product-development/npi/js/bom.js | 4→4 lines | ~66 |
| 15:54 | Edited portals/product-development/npi/js/bom.js | "kits" → "tree" | ~30 |
| 15:55 | Edited portals/product-development/npi/js/bom.js | added optional chaining | ~2221 |
| 15:56 | Edited portals/product-development/npi/js/bom.js | added 2 condition(s) | ~400 |
| 15:56 | Edited portals/product-development/npi/js/bom.js | modified Set() | ~92 |
| 15:56 | Edited portals/product-development/npi/js/npi-events.js | 6→5 lines | ~124 |
| 15:56 | Edited portals/product-development/npi/js/npi-events.js | 2→1 lines | ~27 |
| 15:57 | Edited index.html | expanded (+8 lines) | ~263 |
| 15:57 | Edited portals/product-development/npi/css/apqp-bom.css | modified media() | ~1071 |
| 15:58 | Edited utils/js/guide.js | expanded (+6 lines) | ~774 |
| 15:58 | Edited CHANGELOG.md | 4→6 lines | ~92 |
| 15:59 | Session end: 20 writes across 10 files (state.js, npi-constants.js, npi-data-relational.js, npi-data.js, bom.js) | 12 reads | ~105043 tok |

## Session: 2026-03-25 16:20

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 16:21

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 16:21

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 16:22

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 16:36

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 16:37 | Edited portals/product-development/npi/js/dashboard.js | "${totalBomItems} items · " → "${totalBomItems} items · " | ~22 |
| 16:37 | Edited portals/product-development/npi/js/npi-data-relational.js | inline fix | ~26 |
| 16:37 | Edited CHANGELOG.md | 2→4 lines | ~84 |
| 16:38 | Session end: 3 writes across 3 files (dashboard.js, npi-data-relational.js, CHANGELOG.md) | 3 reads | ~46233 tok |

## Session: 2026-03-25 16:59

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 18:17

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 18:17

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 18:26 | Edited core/js/state.js | 2→5 lines | ~129 |
| 18:26 | Edited core/js/state.js | inline fix | ~26 |
| 18:26 | Edited portals/product-development/npi/js/npi-constants.js | 2→2 lines | ~41 |
| 18:27 | Edited portals/product-development/npi/js/npi-data-relational.js | 22→23 lines | ~480 |
| 18:27 | Edited portals/product-development/npi/js/npi-data-relational.js | added 2 condition(s) | ~331 |
| 18:27 | Edited portals/product-development/npi/js/npi-data-relational.js | 13→14 lines | ~128 |
| 18:27 | Edited portals/product-development/npi/js/npi-data-relational.js | added 4 condition(s) | ~397 |
| 18:28 | Edited portals/product-development/npi/js/npi-data.js | added 8 condition(s) | ~986 |
| 18:30 | Edited portals/product-development/npi/js/npi-events.js | expanded (+7 lines) | ~264 |
| 18:30 | Edited portals/product-development/npi/js/npi-events.js | 1→3 lines | ~95 |
| 18:31 | Edited utils/js/guide.js | expanded (+11 lines) | ~300 |
| 18:31 | Edited CHANGELOG.md | 4→6 lines | ~81 |
| 18:32 | Session end: 12 writes across 7 files (state.js, npi-constants.js, npi-data-relational.js, npi-data.js, npi-events.js) | 9 reads | ~91412 tok |

## Session: 2026-03-25 18:35

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 18:37 | Edited portals/product-development/npi/js/npi-data-relational.js | 6→7 lines | ~74 |
| 18:38 | Edited portals/product-development/npi/js/npi-events.js | 1→2 lines | ~58 |
| 18:39 | Edited utils/js/guide.js | 1→2 lines | ~82 |
| 18:39 | Edited CHANGELOG.md | 1→3 lines | ~71 |
| 18:39 | Session end: 4 writes across 4 files (npi-data-relational.js, npi-events.js, guide.js, CHANGELOG.md) | 4 reads | ~56673 tok |

## Session: 2026-03-25 19:39

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 19:39

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 19:41 | Edited .opencode/config.json | 2→2 lines | ~10 |
| 19:41 | Session end: 1 writes across 1 files (config.json) | 2 reads | ~333 tok |

## Session: 2026-03-25 19:43

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 19:43

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 19:45

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 19:45

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 21:54

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 21:54

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 22:29

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 22:29

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 22:31 | Edited portals/feedback/js/feedback.js | "#mc .section-inner" → "#mainContent .section-inn" | ~20 |
| 22:31 | Edited CHANGELOG.md | 2→4 lines | ~76 |
| 22:31 | Session end: 2 writes across 2 files (feedback.js, CHANGELOG.md) | 5 reads | ~31768 tok |

## Session: 2026-03-25 22:39

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-25 22:39

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 22:44 | Edited .gitignore | 3→7 lines | ~37 |
| 22:44 | Session end: 1 writes across 1 files (.gitignore) | 2 reads | ~386 tok |

## Session: 2026-03-25 22:54

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 22:56 | Created me-hub/index.html | — | ~926 |
| 22:57 | Created me-hub/css/me-hub.css | — | ~2542 |
| 22:57 | Created me-hub/js/me-hub-auth.js | — | ~730 |
| 22:57 | Created me-hub/js/me-hub-data.js | — | ~660 |
| 22:58 | Created me-hub/js/me-hub-app.js | — | ~1379 |
| 22:58 | Edited CHANGELOG.md | 1→3 lines | ~80 |
| 22:58 | Session end: 6 writes across 6 files (index.html, me-hub.css, me-hub-auth.js, me-hub-data.js, me-hub-app.js) | 9 reads | ~68736 tok |
| 22:59 | Session end: 6 writes across 6 files (index.html, me-hub.css, me-hub-auth.js, me-hub-data.js, me-hub-app.js) | 11 reads | ~69398 tok |

## Session: 2026-03-25 23:01

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-26 05:31

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-26 05:31

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 05:33 | Created supabase/evm_phase2_migration.sql | — | ~667 |
| 05:33 | Edited portals/capacity/js/me-data-relational.js | added error handling | ~264 |
| 05:33 | Edited portals/capacity/js/me-data.js | 7→8 lines | ~36 |
| 05:33 | Edited portals/capacity/js/me-data.js | modified if() | ~339 |
| 05:33 | Edited portals/capacity/js/me-data.js | added 1 condition(s) | ~109 |
| 05:33 | Edited portals/capacity/js/me-data-relational.js | 15→16 lines | ~187 |
| 05:34 | Edited portals/capacity/js/me-data-relational.js | 15→16 lines | ~150 |
| 05:34 | Edited me-hub/js/me-hub-data.js | 2→3 lines | ~19 |
| 05:34 | Edited me-hub/js/me-hub-data.js | 12→13 lines | ~142 |
| 05:34 | Edited me-hub/js/me-hub-data.js | added 1 condition(s) | ~261 |
| 05:34 | Edited me-hub/js/me-hub-data.js | modified hubGetActuals() | ~72 |
| 05:34 | Edited CHANGELOG.md | 1→3 lines | ~159 |
| 05:35 | Session end: 12 writes across 5 files (evm_phase2_migration.sql, me-data-relational.js, me-data.js, me-hub-data.js, CHANGELOG.md) | 7 reads | ~47153 tok |

## Session: 2026-03-26 08:25

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-26 09:42

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 10:03 | Edited README.md | 7→11 lines | ~307 |
| 10:03 | Edited README.md | expanded (+12 lines) | ~338 |
| 10:04 | Edited README.md | expanded (+40 lines) | ~2336 |
| 10:04 | Edited README.md | expanded (+10 lines) | ~234 |
| 10:05 | Edited README.md | expanded (+12 lines) | ~190 |
| 10:05 | Edited CHANGELOG.md | 1→3 lines | ~72 |
| 10:05 | Session end: 6 writes across 2 files (README.md, CHANGELOG.md) | 2 reads | ~28511 tok |

## Session: 2026-03-26 13:26

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 13:28 | Edited trello/index.html | "7c0eed216cb49f42fd518bc94" → "ATTAebac25d48d129931cbd98" | ~26 |
| 13:28 | Session end: 1 writes across 1 files (index.html) | 1 reads | ~11077 tok |
| 13:31 | Edited trello/index.html | expanded (+106 lines) | ~754 |
| 13:31 | Edited trello/index.html | expanded (+19 lines) | ~286 |
| 13:31 | Edited trello/index.html | modified switchTab() | ~97 |
| 13:32 | Edited trello/index.html | 4→6 lines | ~146 |
| 13:32 | Edited trello/index.html | expanded (+19 lines) | ~266 |
| 13:32 | Session end: 6 writes across 1 files (index.html) | 1 reads | ~12735 tok |
| 13:33 | Session end: 6 writes across 1 files (index.html) | 1 reads | ~12735 tok |
| 13:34 | Edited trello/index.html | 4→3 lines | ~32 |
| 13:34 | Edited trello/index.html | removed 1 lines | ~5 |
| 13:34 | Session end: 8 writes across 1 files (index.html) | 1 reads | ~12775 tok |

## Session: 2026-03-26 13:36

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 13:37 | Created trello/index.html | — | ~3742 |
| 13:37 | Session end: 1 writes across 1 files (index.html) | 1 reads | ~15058 tok |

## Session: 2026-03-26 16:19

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 16:20 | Edited .gitignore | 1→4 lines | ~14 |
| 16:20 | Session end: 1 writes across 1 files (.gitignore) | 1 reads | ~385 tok |

## Session: 2026-03-26 16:26

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-26 16:26

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-26 16:31

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-26 16:31

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-26 16:31

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-26 16:35

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-26 16:35

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-27 06:34

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-27 06:34

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 06:39 | Edited plans/capacity-independance.md | 7→9 lines | ~187 |
| 06:39 | Edited plans/capacity-independance.md | modified remains() | ~351 |
| 06:40 | Edited plans/capacity-independance.md | added 3 condition(s) | ~489 |
| 06:40 | Edited plans/capacity-independance.md | modified JS() | ~158 |
| 06:40 | Session end: 4 writes across 1 files (capacity-independance.md) | 1 reads | ~1269 tok |

## Session: 2026-03-27 10:58

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-27 10:58

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-27 11:04

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 11:06 | Edited .claude/settings.json | — | ~0 |
| 11:06 | Session end: 1 writes across 1 files (settings.json) | 2 reads | ~1388 tok |

## Session: 2026-03-27 11:06

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 11:34 | Edited CLAUDE.md | 8→7 lines | ~123 |
| 11:34 | Edited .github/copilot-instructions.md | 4→3 lines | ~54 |
| 11:34 | Edited .github/copilot-instructions.md | 4→4 lines | ~71 |
| 11:34 | Edited .github/copilot-instructions.md | 2→1 lines | ~16 |
| 11:34 | Edited CLAUDE.md | 2→1 lines | ~18 |
| 11:34 | Edited .serena/memories/style-and-conventions.md | 2→1 lines | ~6 |
| 11:34 | Edited plans/risk-and-regression-checklist.md | removed 6 lines | ~9 |
| 11:34 | Edited plans/risk-and-regression-checklist.md | 2→1 lines | ~14 |
| 11:34 | Edited plans/risk-and-regression-checklist.md | 6→6 lines | ~59 |
| 11:34 | Edited plans/risk-and-regression-checklist.md | 7 → 6 | ~7 |
| 11:34 | Edited plans/risk-and-regression-checklist.md | 8 → 7 | ~7 |
| 11:34 | Edited plans/risk-and-regression-checklist.md | 9 → 8 | ~9 |
| 11:34 | Edited plans/risk-and-regression-checklist.md | 10 → 9 | ~10 |
| 11:36 | Edited .claude/rules/database.md | inline fix | ~19 |
| 11:36 | Edited .claude/rules/code-style.md | inline fix | ~53 |
| 11:43 | Edited .claude/hooks.md | removed 5 lines | ~7 |
| 11:44 | Edited .claude/hooks.md | removed 12 lines | ~8 |
| 11:44 | Edited .claude/hooks.md | 2→1 lines | ~7 |
| 11:44 | Edited .claude/agents.md | inline fix | ~21 |
| 11:44 | Edited .claude/agents.md | 2→2 lines | ~46 |
| 11:44 | Edited .claude/agents.md | inline fix | ~26 |
| 11:44 | Edited .claude/agents.md | 2→1 lines | ~11 |
| 11:44 | Session end: 22 writes across 8 files (CLAUDE.md, copilot-instructions.md, style-and-conventions.md, risk-and-regression-checklist.md, database.md) | 6 reads | ~5312 tok |

## Session: 2026-03-27 11:50

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 12:00 | Edited portals/capacity/me/js/me-data-relational.js | 12→13 lines | ~128 |
| 12:00 | Edited portals/capacity/me/js/me-data-relational.js | 9→10 lines | ~100 |
| 12:00 | Edited portals/capacity/me/js/me-data-relational.js | 16→17 lines | ~162 |
| 12:01 | Edited CHANGELOG.md | 4→6 lines | ~98 |
| 12:01 | Session end: 4 writes across 2 files (me-data-relational.js, CHANGELOG.md) | 4 reads | ~20426 tok |
| 12:32 | Edited portals/capacity/me/js/me-data.js | 7→7 lines | ~62 |
| 12:33 | Edited portals/capacity/me/js/me-data.js | added 2 condition(s) | ~167 |
| 12:33 | Edited portals/capacity/me/js/me-data.js | added 3 condition(s) | ~312 |
| 12:34 | Edited CHANGELOG.md | 1→2 lines | ~108 |
| 12:34 | Session end: 8 writes across 3 files (me-data-relational.js, CHANGELOG.md, me-data.js) | 6 reads | ~37779 tok |

## Session: 2026-03-27 12:39

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-27 15:40

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 15:52 | Edited portals/capacity/me/js/me-data-relational.js | 5→4 lines | ~26 |
| 15:52 | Edited portals/capacity/me/js/me-data-relational.js | 5→4 lines | ~28 |
| 15:52 | Edited portals/capacity/me/js/me-data-relational.js | 5→4 lines | ~25 |
| 15:52 | Edited portals/capacity/shared/js/cap-dashboard.js | modified function() | ~44 |
| 15:52 | Edited portals/capacity/shared/js/cap-dashboard.js | modified function() | ~52 |
| 15:53 | Edited portals/capacity/shared/js/cap-heatmap.js | modified function() | ~35 |
| 15:54 | Edited tests/me-heatmap.test.js | reduced (-6 lines) | ~70 |
| 15:54 | Edited CHANGELOG.md | 4→6 lines | ~117 |
| 15:54 | Session end: 8 writes across 5 files (me-data-relational.js, cap-dashboard.js, cap-heatmap.js, me-heatmap.test.js, CHANGELOG.md) | 10 reads | ~62377 tok |
| 16:00 | Session end: 8 writes across 5 files (me-data-relational.js, cap-dashboard.js, cap-heatmap.js, me-heatmap.test.js, CHANGELOG.md) | 10 reads | ~62377 tok |

## Session: 2026-03-27 16:03

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-27 16:20

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-27 16:45

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-27 18:34

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-27 18:44

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-27 18:44

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-27 18:47

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-27 18:52

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-27 21:11

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-27 22:06

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-27 22:09

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 22:18 | Edited portals/capacity/me/js/me-data-realtime.js | modified meApplyRealtimeStateChange() | ~141 |
| 22:18 | Edited CHANGELOG.md | 4→6 lines | ~97 |
| 22:18 | Session end: 2 writes across 2 files (me-data-realtime.js, CHANGELOG.md) | 3 reads | ~32955 tok |
| 22:54 | Edited portals/capacity/me/js/me-data-entities.js | modified function() | ~42 |
| 22:54 | Edited portals/capacity/me/js/me-data-entities.js | modified function() | ~63 |
| 22:54 | Edited portals/capacity/project-management/js/pm-data.js | modified function() | ~42 |
| 22:54 | Edited portals/capacity/project-management/js/pm-data.js | modified function() | ~62 |
| 22:54 | Edited portals/capacity/logistics/js/log-data.js | modified function() | ~43 |
| 22:54 | Edited portals/capacity/logistics/js/log-data.js | modified function() | ~63 |
| 22:54 | Edited portals/capacity/unit6/js/unit6-data.js | modified function() | ~44 |
| 22:54 | Edited portals/capacity/unit6/js/unit6-data.js | modified function() | ~66 |
| 22:54 | Edited portals/capacity/shared/js/cap-tasks.js | 2→5 lines | ~73 |
| 22:55 | Edited portals/capacity/shared/js/cap-tasks.js | added 1 condition(s) | ~1427 |
| 22:55 | Edited portals/capacity/shared/js/cap-tasks.js | expanded (+12 lines) | ~1057 |
| 22:56 | Edited portals/capacity/js/capacity-events.js | added 1 condition(s) | ~1510 |
| 22:57 | Edited portals/capacity/js/capacity-events.js | added 1 condition(s) | ~1104 |
| 22:57 | Edited portals/capacity/js/capacity-events.js | added 11 condition(s) | ~1148 |
| 22:57 | Edited portals/capacity/js/capacity-events.js | capNum() → toggle() | ~127 |
| 22:58 | Edited tests/capacity-events.test.js | 75→75 lines | ~922 |
| 22:58 | Edited tests/me-tasks-sort.test.js | 4→5 lines | ~88 |
| 22:58 | Edited tests/me-data-core.test.js | 2→2 lines | ~35 |
| 22:59 | Edited tests/me-data-core.test.js | 27→30 lines | ~263 |
| 22:59 | Edited tests/me-data-core.test.js | 1→2 lines | ~25 |
| 22:59 | Edited CHANGELOG.md | 1→3 lines | ~96 |
| 23:00 | Session end: 23 writes across 11 files (me-data-realtime.js, CHANGELOG.md, me-data-entities.js, pm-data.js, log-data.js) | 11 reads | ~45553 tok |

## Session: 2026-03-28 06:09

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 06:27 | Edited portals/capacity/shared/js/cap-tasks.js | 9→9 lines | ~331 |
| 06:27 | Edited portals/capacity/shared/js/cap-tasks.js | inline fix | ~80 |
| 06:27 | Edited portals/capacity/shared/js/cap-tasks.js | 9→9 lines | ~262 |
| 06:27 | Edited portals/capacity/js/capacity-events.js | 9→9 lines | ~356 |
| 06:28 | Edited portals/capacity/js/capacity-events.js | inline fix | ~75 |
| 06:28 | Edited portals/capacity/js/capacity-events.js | 9→9 lines | ~252 |
| 06:28 | Edited CHANGELOG.md | 4→6 lines | ~77 |
| 06:28 | Session end: 7 writes across 3 files (cap-tasks.js, capacity-events.js, CHANGELOG.md) | 10 reads | ~96005 tok |

## Session: 2026-03-28 06:52

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 07:03 | Edited plans/realtime-render-centralization-audit.md | expanded (+32 lines) | ~730 |
| 07:03 | Session end: 1 writes across 1 files (realtime-render-centralization-audit.md) | 1 reads | ~782 tok |
| 07:07 | Created utils/js/render-scheduler.js | — | ~915 |
| 07:07 | Edited index.html | 2→3 lines | ~40 |
| 07:08 | Edited CHANGELOG.md | 4→6 lines | ~96 |
| 07:08 | Session end: 4 writes across 4 files (realtime-render-centralization-audit.md, render-scheduler.js, index.html, CHANGELOG.md) | 3 reads | ~29547 tok |
| 07:12 | Edited portals/capacity/me/js/me-data-realtime.js | modified meApplyRealtimeStateChange() | ~11 |
| 07:12 | Edited portals/capacity/me/js/me-capacity.js | removed 4 lines | ~12 |
| 07:12 | Edited portals/capacity/me/js/me-capacity.js | removed 11 lines | ~18 |
| 07:12 | Edited portals/capacity/me/js/me-capacity.js | 3→2 lines | ~22 |
| 07:12 | Edited portals/capacity/me/js/me-capacity.js | 3→1 lines | ~13 |
| 07:13 | Edited tests/me-data-core.test.js | added 1 condition(s) | ~140 |
| 07:14 | Edited tests/me-data-core.test.js | 3→2 lines | ~27 |
| 07:14 | Edited tests/me-data-core.test.js | 5→3 lines | ~40 |
| 07:14 | Edited tests/me-data-core.test.js | 2→1 lines | ~32 |
| 07:14 | Edited tests/me-data-core.test.js | 2→4 lines | ~42 |
| 07:14 | Edited CHANGELOG.md | 1→2 lines | ~112 |
| 07:14 | Session end: 15 writes across 7 files (realtime-render-centralization-audit.md, render-scheduler.js, index.html, CHANGELOG.md, me-data-realtime.js) | 6 reads | ~48003 tok |
| 07:22 | Edited portals/capacity/project-management/js/pm-data.js | modified pmIsCapacityFilterInputFocused() | ~12 |
| 07:22 | Edited portals/capacity/project-management/js/pm-data.js | removed 9 lines | ~12 |
| 07:22 | Edited portals/capacity/project-management/js/pm-data.js | 2→1 lines | ~10 |
| 07:22 | Edited portals/capacity/project-management/js/pm-data.js | 2→1 lines | ~10 |
| 07:22 | Edited portals/capacity/project-management/js/pm-capacity.js | removed 14 lines | ~16 |
| 07:22 | Edited portals/capacity/project-management/js/pm-capacity.js | modified if() | ~54 |
| 07:23 | Edited CHANGELOG.md | 1→2 lines | ~74 |
| 07:23 | Session end: 22 writes across 9 files (realtime-render-centralization-audit.md, render-scheduler.js, index.html, CHANGELOG.md, me-data-realtime.js) | 8 reads | ~61951 tok |
| 07:28 | Edited portals/capacity/logistics/js/log-data.js | modified logIsCapacityFilterInputFocused() | ~12 |
| 07:28 | Edited portals/capacity/unit6/js/unit6-data.js | modified unit6IsCapacityFilterInputFocused() | ~13 |
| 07:28 | Edited portals/capacity/logistics/js/log-data.js | removed 9 lines | ~12 |
| 07:28 | Edited portals/capacity/unit6/js/unit6-data.js | removed 9 lines | ~12 |
| 07:28 | Edited portals/capacity/logistics/js/log-data.js | 2→1 lines | ~10 |
| 07:28 | Edited portals/capacity/unit6/js/unit6-data.js | 2→1 lines | ~10 |
| 07:28 | Edited portals/capacity/logistics/js/log-data.js | — | ~0 |
| 07:28 | Edited portals/capacity/unit6/js/unit6-data.js | — | ~0 |
| 07:28 | Edited portals/capacity/logistics/js/log-capacity.js | modified logGetCurrentMonthKey() | ~17 |
| 07:28 | Edited portals/capacity/unit6/js/unit6-capacity.js | modified unit6GetCurrentMonthKey() | ~18 |
| 07:28 | Edited portals/capacity/logistics/js/log-capacity.js | 2→1 lines | ~6 |
| 07:28 | Edited portals/capacity/logistics/js/log-capacity.js | 3→1 lines | ~5 |
| 07:28 | Edited portals/capacity/unit6/js/unit6-capacity.js | 2→1 lines | ~6 |
| 07:28 | Edited portals/capacity/unit6/js/unit6-capacity.js | 3→1 lines | ~5 |
| 07:29 | Edited CHANGELOG.md | 1→2 lines | ~66 |
| 07:29 | Session end: 37 writes across 13 files (realtime-render-centralization-audit.md, render-scheduler.js, index.html, CHANGELOG.md, me-data-realtime.js) | 12 reads | ~90097 tok |
| 07:32 | Edited portals/product-development/npi/js/npi.js | render() → requestRender() | ~48 |
| 07:32 | Edited portals/production/js/production.js | modified addEventListener() | ~86 |
| 07:32 | Edited portals/operations/js/operations-dashboard-main.js | modified addEventListener() | ~84 |
| 07:33 | Edited portals/operations/js/operations-dashboard-state.js | — | ~0 |
| 07:33 | Edited portals/production/js/data.js | render() → requestRender() | ~70 |
| 07:33 | Edited portals/production/js/data.js | render() → requestRender() | ~56 |
| 07:33 | Edited CHANGELOG.md | 1→2 lines | ~78 |
| 07:33 | Session end: 44 writes across 18 files (realtime-render-centralization-audit.md, render-scheduler.js, index.html, CHANGELOG.md, me-data-realtime.js) | 18 reads | ~104667 tok |
| 07:51 | Created .claude/rules/realtime.md | — | ~1582 |
| 07:51 | Session end: 45 writes across 19 files (realtime-render-centralization-audit.md, render-scheduler.js, index.html, CHANGELOG.md, me-data-realtime.js) | 19 reads | ~106831 tok |
| 07:51 | Session end: 45 writes across 19 files (realtime-render-centralization-audit.md, render-scheduler.js, index.html, CHANGELOG.md, me-data-realtime.js) | 20 reads | ~108369 tok |
| 07:54 | Session end: 45 writes across 19 files (realtime-render-centralization-audit.md, render-scheduler.js, index.html, CHANGELOG.md, me-data-realtime.js) | 21 reads | ~108441 tok |
