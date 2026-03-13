# Security Plan: Accuracy Review + Staged Remediation

Date: 2026-03-13
Last reviewed against live code: 2026-03-13

## 1) Accuracy Review (What was right, what changed)

### Accurate in the previous plan
1. Inline event handlers are still a broad XSS risk.
2. Database integrity constraints are still missing and should be added.
3. CDN scripts still do not use SRI hashes.
4. The collaborative auth model (all authenticated users see all data) is a known architectural risk.

### Outdated or partially outdated
1. The previously flagged critical sink `onclick="${row.action}"` in operations pulse feed is now fixed.
2. The migration scope was underestimated. Current scan shows larger exposure than previously stated.

## 2) Current Security Baseline (Measured)

Measured directly from current workspace code on 2026-03-13:

1. Inline `onclick` occurrences in portal JS: 230
2. JS files containing inline `onclick`: 30
3. Remaining dynamic onclick sink pattern in operations metrics helper: resolved (migrated to `data-action="metric-navigate"` delegation)
4. CDN scripts without SRI in [index.html](index.html#L32): Supabase and Chart.js

Top exposure files by count:
1. [portals/product-development/npi/js/dashboard.js](portals/product-development/npi/js/dashboard.js): 33
2. [portals/operations/js/operations-dashboard.js](portals/operations/js/operations-dashboard.js): 24
3. [portals/product-development/js/product-development.js](portals/product-development/js/product-development.js): 24
4. [portals/product-development/npi/js/pfmea.js](portals/product-development/npi/js/pfmea.js): 16
5. [portals/product-development/npi/js/bom.js](portals/product-development/npi/js/bom.js): 13
6. [portals/product-development/npi/js/npi-pfd.js](portals/product-development/npi/js/npi-pfd.js): 12
7. [portals/product-development/product-management/js/products.js](portals/product-development/product-management/js/products.js): 12

## 3) Priority Staged Plan (Step-by-step, monitorable)

This plan is designed so progress can be tracked every week with clear pass/fail checkpoints.

### Stage P0 - Immediate Security Correction (Priority: Critical)

Objective: Remove remaining dynamic onclick injection sinks.

Steps:
1. Replace dynamic onclick generation in [portals/operations/js/operations-dashboard.js](portals/operations/js/operations-dashboard.js#L515) (`opsMetricCard`) with `data-action` attributes.
2. Add delegated click handling for metric card navigation in operations container.
3. Verify no dynamic string interpolation is used to build executable inline handlers in operations dashboard.

Done when:
1. `opsMetricCard` no longer writes `onclick="..."` into HTML.
2. Operations navigation still works in UI.
3. Operations tests pass.

Status: Done (completed 2026-03-13)
Target window: 0-1 day

Completion evidence:
1. [portals/operations/js/operations-dashboard.js](portals/operations/js/operations-dashboard.js#L515) no longer injects dynamic onclick strings for metric cards.
2. Metric cards now use delegated actions via `data-action="metric-navigate"` with `data-dest`.
3. Operations test suites passed after change.

### Stage P1 - High-Risk Surface Reduction (Priority: High)

Objective: Reduce the largest inline-handler footprint quickly.

Steps:
1. Migrate [portals/product-development/product-management/js/products.js](portals/product-development/product-management/js/products.js) to event delegation.
2. Migrate [portals/product-development/npi/js/dashboard.js](portals/product-development/npi/js/dashboard.js) to event delegation.
3. Migrate [portals/product-development/js/product-development.js](portals/product-development/js/product-development.js) to event delegation.
4. Migrate remaining operations dashboard inline handlers in [portals/operations/js/operations-dashboard.js](portals/operations/js/operations-dashboard.js).
5. Add or update tests to assert rendered HTML does not contain `onclick=` for each migrated module.

Done when:
1. All four files above have zero `onclick=`.
2. Related tests pass.
3. No navigation or button regressions in smoke test.

Status: In progress (started 2026-03-13)
Target window: 2-5 days

Progress notes:
1. Completed: [portals/product-development/product-management/js/products.js](portals/product-development/product-management/js/products.js) migrated from inline `onclick` to delegated `data-action` handling.
2. Added regression tests in [tests/product-management.test.js](tests/product-management.test.js) to enforce no inline handlers and validate delegated behavior.

### Stage P2 - NPI Core Hardening (Priority: High)

Objective: Address dense NPI modules with highest interaction complexity.

Steps:
1. Migrate [portals/product-development/npi/js/pfmea.js](portals/product-development/npi/js/pfmea.js).
2. Migrate [portals/product-development/npi/js/bom.js](portals/product-development/npi/js/bom.js).
3. Migrate [portals/product-development/npi/js/npi-pfd.js](portals/product-development/npi/js/npi-pfd.js).
4. Migrate [portals/product-development/npi/js/timing.js](portals/product-development/npi/js/timing.js).
5. Migrate [portals/product-development/npi/js/gates.js](portals/product-development/npi/js/gates.js).

Done when:
1. No inline `onclick` and `onchange` remain in migrated NPI files.
2. APQP/NPI smoke flow works end-to-end (dashboard -> APQP -> PFMEA -> BOM -> timing).
3. Existing NPI tests pass.

Status: Not started
Target window: 1-2 weeks

### Stage P3 - Capacity + PM Parity (Priority: Medium)

Objective: Remove inline handlers across capacity modules while keeping ME and PM behavior aligned.

Steps:
1. Migrate [portals/capacity/js/me-capacity.js](portals/capacity/js/me-capacity.js) and mirror equivalent behavior in [portals/capacity/project-management/js/pm-capacity.js](portals/capacity/project-management/js/pm-capacity.js).
2. Migrate capacity submodules with repeated controls:
   1. [portals/capacity/js/me-chart.js](portals/capacity/js/me-chart.js)
   2. [portals/capacity/js/me-holidays.js](portals/capacity/js/me-holidays.js)
   3. [portals/capacity/js/me-estimation-page.js](portals/capacity/js/me-estimation-page.js)
   4. [portals/capacity/js/prod-capacity-settings.js](portals/capacity/js/prod-capacity-settings.js)
   5. [portals/capacity/js/prod-capacity-dashboard.js](portals/capacity/js/prod-capacity-dashboard.js)
3. Migrate smaller capacity shell files:
   1. [portals/capacity/js/capacity.js](portals/capacity/js/capacity.js)
   2. [portals/capacity/js/prod-capacity.js](portals/capacity/js/prod-capacity.js)

Done when:
1. All listed files have no inline handlers.
2. Capacity parity checks pass between ME and PM tab navigation and core actions.

Status: Not started
Target window: 1 week

### Stage P4 - Platform Hardening (Priority: Medium)

Objective: Address non-UI hardening controls (integrity and data quality).

Steps:
1. Add SRI hashes to CDN script tags in [index.html](index.html#L32) and [index.html](index.html#L33).
2. Apply DB constraints from [plans/ME_DATABASE_ANALYSIS.md](plans/ME_DATABASE_ANALYSIS.md#L361):
   1. Unique constraint on `me_holidays(person_id, date)`
   2. Unique constraint on `me_products(product_database_id)`
   3. Check constraints on `me_teams` fields
   4. Check constraint for task date order in `me_tasks`
3. Run regression checks for save/load behavior in capacity modules after constraints.
4. Document accepted risk and data classification limits for collaborative authorization model.

Done when:
1. CDN scripts use SRI and `crossorigin="anonymous"`.
2. Constraints are applied and verified in Supabase.
3. No data write regressions in capacity tests.
4. Authorization risk acceptance is documented.

Status: Not started
Target window: 1-2 weeks

## 4) Monitoring Dashboard (Weekly)

Track these KPIs every week:

| KPI | Baseline | Target | Owner | Check cadence |
|---|---:|---:|---|---|
| Inline `onclick` count in `portals/**/*.js` | 230 | 0 | Frontend lead | Weekly |
| Files with inline `onclick` | 29 | 0 | Frontend lead | Weekly |
| Dynamic onclick sinks (`onclick="${...}"`) | 3 remaining sinks (2 in me-components, 1 in npi gates) | 0 | Frontend lead | Weekly |
| CDN scripts with SRI | 0/2 | 2/2 | Platform owner | Once per release |
| DB integrity constraints applied (planned set) | 0/4 groups | 4/4 groups | DB owner | Weekly until done |

### Weekly Status Log Template

Use this table each week (append one row per week):

| Week ending | P0 | P1 | P2 | P3 | P4 | onclick count | blockers | notes |
|---|---|---|---|---|---|---:|---|---|
| YYYY-MM-DD | Not started / In progress / Done | Not started / In progress / Done | Not started / In progress / Done | Not started / In progress / Done | Not started / In progress / Done | 230 | - | - |

## 5) Execution Rules (to prevent regressions)

1. New UI code must not introduce inline `onclick` or `onchange` handlers.
2. New interactive elements must use `data-action` and delegated listeners.
3. Any module migrated must include at least one test asserting rendered HTML does not contain inline handlers.
4. For capacity work, apply ME/PM parity checks before closing a task.
5. Keep this plan updated with real measured counts, not estimates.
