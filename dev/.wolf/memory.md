# Memory

> Chronological action log. Hooks and AI append to this file automatically.
> Old sessions are consolidated by the daemon weekly.

## 2026-03-21
- Updated `.gemini/GEMINI.md` to include the repo's OpenWolf workflow and explicit `openwolf designqc` usage guidance so Gemini-side instructions match the enforced protocol.
- Redesigned `portals/operations/js/operations-infographic.js` — replaced table-style printout with a proper infographic layout: SVG ring gauges for utilisation (ME, PM, each ops unit), hero ring for health score, pipeline flow for production stages, severity heat bars for risk, gate step tracker (G0–G5) for NPI gate completion. All 6 tests still pass. Kept `opsInfographicBar`, `opsInfographicTone`, `opsInfographicUnitCards` signatures for test compatibility.
- Finished the NPI PFD flowchart foundation work: step type and branch destinations now edit in the table, save through the relational layer, reload into UI state, and generate a Mermaid preview with focused Jest coverage.

## 2026-03-22
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

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 06:37

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 06:38 | Edited portals/capacity/css/prod-capacity.css | CSS: overflow-y | ~48 |
| 06:38 | Edited CHANGELOG.md | 1→3 lines | ~100 |

## Session: 2026-03-21 06:39

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 06:43 | Edited portals/capacity/js/me-capacity.js | added 2 condition(s) | ~129 |
| 06:44 | Edited portals/capacity/js/prod-capacity.js | added 2 condition(s) | ~103 |
| 06:44 | Edited portals/capacity/project-management/js/pm-capacity.js | added 2 condition(s) | ~122 |
| 06:44 | Edited utils/js/navigation.js | added 3 condition(s) | ~161 |
| 06:44 | Edited utils/js/navigation.js | added 3 condition(s) | ~93 |
| 06:44 | Edited core/js/app.js | added 3 condition(s) | ~91 |
| 06:44 | Edited CHANGELOG.md | 1→3 lines | ~75 |

## Session: 2026-03-21 06:49

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 07:21

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 07:22 | Added dark mode through Settings → Appearance | portals/settings/js/settings.js, portals/settings/css/settings.css, core/css/main.css, core/css/components.css, core/js/app.js, CHANGELOG.md | Theme preference now persists in tidyco_prefs and applies shared dark tokens across the portal | ~420 |
| 07:23 | Added dark mode test coverage and validation | tests/settings-portal.test.js | Settings portal tests now cover theme rendering and save/apply behavior; targeted suite passes | ~180 |
| 07:24 | Edited portals/settings/js/settings.js | expanded (+15 lines) | ~728 |
| 07:25 | Edited portals/settings/css/settings.css | modified media() | ~616 |
| 07:25 | Edited CHANGELOG.md | 4→6 lines | ~86 |
| 08:00 | Fixed dark mode not activating on click | portals/settings/js/settings.js, tests/settings-portal.test.js, CHANGELOG.md | Theme now applies immediately on radio change; targeted suite + check:all passed | ~240 |

## Session: 2026-03-21 07:38

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 07:44 | Edited core/css/components.css | expanded (+22 lines) | ~430 |
| 07:44 | Edited core/css/main.css | CSS: border-color | ~77 |
| 07:44 | Edited portals/settings/css/settings.css | CSS: mode | ~150 |
| 07:45 | Edited CHANGELOG.md | 4→6 lines | ~120 |

## Session: 2026-03-21 08:28

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 08:31 | Edited portals/operations/css/operations-dashboard.css | 4→4 lines | ~28 |
| 08:31 | Edited portals/operations/css/operations-dashboard.css | 2→2 lines | ~25 |
| 08:31 | Edited portals/operations/css/operations-dashboard.css | 13→13 lines | ~64 |
| 08:31 | Edited portals/operations/css/operations-dashboard.css | 8→6 lines | ~34 |
| 08:31 | Edited portals/operations/css/operations-dashboard.css | 5→5 lines | ~22 |
| 08:31 | Edited portals/operations/css/operations-dashboard.css | 19→19 lines | ~87 |
| 08:31 | Edited portals/operations/css/operations-dashboard.css | 5→5 lines | ~23 |
| 08:31 | Edited portals/operations/css/operations-dashboard.css | 6→6 lines | ~30 |
| 08:31 | Edited portals/operations/css/operations-dashboard.css | 8→8 lines | ~48 |
| 08:32 | Edited portals/operations/css/operations-dashboard.css | 20→20 lines | ~113 |
| 08:32 | Edited portals/operations/css/operations-dashboard.css | 25→25 lines | ~140 |
| 08:32 | Edited portals/operations/css/operations-dashboard.css | 3→3 lines | ~13 |
| 13:05 | Hardened refactoring Phase 1 checklist | plans/REFACTORING_OPPORTUNITIES.md, CHANGELOG.md, .wolf/anatomy.md | Rewrote quick wins to avoid deleting active helpers or applying unsafe blanket RPN refactors | ~900 tok |
| 08:32 | Edited portals/operations/css/operations-dashboard.css | 16→16 lines | ~90 |
| 08:32 | Edited portals/operations/css/operations-dashboard.css | 11→11 lines | ~72 |
| 08:32 | Edited portals/operations/css/operations-dashboard.css | 10→10 lines | ~59 |
| 08:32 | Edited portals/capacity/css/capacity.css | 5→5 lines | ~36 |
| 08:32 | Edited portals/capacity/css/capacity.css | 6→6 lines | ~38 |
| 08:32 | Edited portals/action-centre/css/action-centre.css | inline fix | ~10 |
| 08:32 | Edited portals/product-development/npi/css/apqp-pfd.css | 3→3 lines | ~15 |
| 08:33 | Edited portals/product-development/npi/css/apqp-pfd.css | 17→17 lines | ~97 |
| 08:33 | Edited portals/product-development/npi/css/apqp-pfd.css | CSS: move | ~40 |
| 08:33 | Edited portals/product-development/npi/css/apqp-pfd.css | 4→4 lines | ~33 |
| 08:33 | Edited portals/product-development/npi/css/apqp-pfd.css | 4→4 lines | ~26 |
| 08:33 | Edited portals/product-development/npi/css/apqp-pfd.css | 4→3 lines | ~18 |
| 08:33 | Edited portals/product-development/npi/css/apqp-ctq.css | 4→4 lines | ~26 |
| 08:33 | Edited portals/product-development/npi/js/pfmea.js | 12→12 lines | ~354 |
| 08:33 | Edited portals/product-development/npi/js/dashboard.js | "background:#fff8f8" → "background:var(--red-pale" | ~12 |
| 08:34 | Edited CHANGELOG.md | 1→3 lines | ~152 |
| 08:34 | Finished dark mode fix plan — phases 2-4: hardcoded hex colours replaced with CSS vars in operations-dashboard.css, capacity.css, action-centre.css, apqp-pfd.css, apqp-ctq.css, pfmea.js, dashboard.js | 8 files | committed + pushed to claude/finish-dark-mode-Lu872 | ~4k |

## Session: 2026-03-21 08:54

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 08:55 | Edited core/css/main.css | modified media() | ~351 |
| 08:56 | Edited portals/settings/css/settings.css | CSS: flex-direction, mobile | ~89 |
| 08:56 | Edited CHANGELOG.md | 1→3 lines | ~174 |

## Session: 2026-03-21 10:11

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 10:13 | Edited portals/product-development/npi/css/dashboard.css | modified not() | ~274 |
| 10:14 | Edited CHANGELOG.md | 1→3 lines | ~114 |

## Session: 2026-03-21 10:26

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 10:29 | Edited core/css/main.css | expanded (+28 lines) | ~375 |
| 10:29 | Edited core/css/main.css | CSS: --green-dark | ~36 |
| 10:29 | Edited core/css/main.css | expanded (+29 lines) | ~420 |
| 10:30 | Edited portals/action-centre/css/action-centre.css | 55→55 lines | ~308 |
| 10:30 | Edited portals/settings/css/settings.css | 14→14 lines | ~86 |
| 10:31 | Edited portals/feedback/css/feedback.css | 16→16 lines | ~93 |
| 10:31 | Edited portals/capacity/css/me-capacity-dashboard.css | 5→5 lines | ~50 |
| 10:32 | Edited portals/capacity/css/me-capacity-dashboard.css | 23→23 lines | ~176 |
| 10:32 | Edited portals/capacity/css/me-capacity-dashboard.css | 24→24 lines | ~276 |
| 10:32 | Edited portals/capacity/css/me-capacity-dashboard.css | 7→7 lines | ~99 |
| 10:32 | Edited portals/capacity/css/me-capacity-heatmap.css | 16→16 lines | ~173 |
| 10:32 | Edited portals/capacity/css/me-capacity-heatmap.css | 9→9 lines | ~106 |
| 10:33 | Edited portals/capacity/css/me-capacity-heatmap.css | 15→15 lines | ~86 |
| 10:33 | Edited portals/capacity/css/me-capacity-heatmap.css | 6→6 lines | ~63 |
| 10:33 | Edited portals/capacity/css/me-capacity-heatmap.css | 4→4 lines | ~34 |
| 10:33 | Edited portals/capacity/css/me-capacity-shell.css | 5→5 lines | ~53 |
| 10:33 | Edited portals/capacity/css/me-capacity-tables.css | 5→5 lines | ~42 |
| 10:33 | Edited portals/capacity/css/me-capacity-holidays.css | 3→3 lines | ~36 |
| 10:33 | Edited portals/capacity/css/me-capacity-holidays.css | 3→3 lines | ~22 |
| 10:34 | Edited portals/capacity/css/me-capacity-holidays.css | 7→7 lines | ~74 |
| 10:34 | Edited portals/capacity/css/me-capacity-holidays.css | 4→4 lines | ~48 |
| 10:34 | Edited portals/production/css/production.css | 3→3 lines | ~25 |
| 10:34 | Edited portals/production/css/production.css | 15→15 lines | ~85 |
| 10:34 | Edited portals/production/css/production.css | 4→4 lines | ~33 |
| 10:34 | Edited portals/production/css/production.css | 17→17 lines | ~84 |
| 10:34 | Edited portals/production/css/production.css | 3→3 lines | ~20 |
| 10:34 | Edited portals/production/css/production.css | 3→3 lines | ~16 |
| 10:34 | Edited portals/production/css/production.css | 6→6 lines | ~34 |
| 10:35 | Edited portals/production/css/production.css | 11→11 lines | ~75 |
| 10:35 | Edited portals/production/css/production.css | 9→9 lines | ~52 |
| 10:35 | Edited portals/production/css/production.css | 11→11 lines | ~76 |
| 10:35 | Edited portals/production/css/production.css | 21→21 lines | ~130 |
| 10:36 | Edited portals/settings/js/settings.js | 2→2 lines | ~75 |
| 10:36 | Edited portals/product-development/npi/js/pfmea.js | inline fix | ~77 |
| 10:36 | Edited portals/settings/js/settings.js | 2→2 lines | ~74 |
| 10:36 | Edited portals/product-development/npi/js/pfmea.js | inline fix | ~50 |
| 10:36 | Edited portals/settings/js/settings.js | "background:#f0f0f0;paddin" → "background:var(--code-bg)" | ~36 |
| 10:36 | Edited portals/product-development/npi/js/pfmea.js | 3→3 lines | ~82 |
| 10:36 | Edited portals/settings/js/settings.js | 2→2 lines | ~63 |
| 10:36 | Edited portals/settings/js/settings.js | 2→2 lines | ~61 |
| 10:36 | Edited portals/product-development/npi/js/pfmea.js | inline fix | ~111 |
| 10:36 | Edited portals/settings/js/settings.js | "margin-bottom:12px;paddin" → "margin-bottom:12px;paddin" | ~48 |
| 10:36 | Edited portals/product-development/npi/js/pfmea.js | inline fix | ~56 |
| 10:36 | Edited portals/product-development/npi/js/pfmea.js | inline fix | ~56 |
| 10:36 | Edited portals/settings/js/settings.js | 2→2 lines | ~40 |
| 10:36 | Edited portals/settings/js/settings.js | 2→2 lines | ~44 |
| 10:36 | Edited portals/product-development/npi/js/gates.js | inline fix | ~48 |
| 10:36 | Edited utils/js/helpers.js | "#ecfdf5" → "var(--green-pale)" | ~18 |
| 10:36 | Edited portals/product-development/npi/js/gates.js | 2→2 lines | ~318 |
| 10:36 | Edited portals/capacity/js/me-holidays.js | "display: flex; align-item" → "display: flex; align-item" | ~45 |
| 10:37 | Edited portals/product-development/npi/js/gates.js | "padding:12px 16px;border-" → "padding:12px 16px;border-" | ~47 |
| 10:37 | Edited portals/capacity/js/me-holidays.js | "text-align: center; font-" → "text-align: center; font-" | ~28 |
| 10:38 | Edited portals/capacity/js/me-dashboard.js | inline fix | ~24 |
| 10:38 | Edited portals/capacity/js/me-dashboard.js | 30→33 lines | ~247 |
| 10:38 | Edited portals/capacity/js/me-dashboard.js | modified if() | ~104 |
| 10:38 | Edited portals/production/js/scheduling.js | inline fix | ~37 |
| 10:38 | Edited portals/production/js/products.js | inline fix | ~36 |
| 10:38 | Edited utils/js/guide.js | 2→2 lines | ~119 |
| 10:39 | Edited portals/capacity/js/me-chart.js | 2→2 lines | ~35 |
| 10:39 | Edited portals/capacity/js/me-chart.js | 2→2 lines | ~50 |
| 10:40 | Edited portals/capacity/js/me-chart.js | 5→5 lines | ~193 |
| 10:40 | Edited portals/capacity/js/me-chart.js | expanded (+13 lines) | ~516 |
| 10:40 | Edited portals/product-development/product-management/js/trends-chart.js | 2→2 lines | ~65 |
| 10:40 | Edited portals/product-development/product-management/js/trends-chart.js | 2→2 lines | ~51 |
| 10:40 | Edited portals/product-development/product-management/js/trends-chart.js | expanded (+8 lines) | ~779 |
| 10:41 | Edited portals/product-development/product-management/js/trends-chart.js | inline fix | ~37 |
| 10:41 | Edited portals/product-development/product-management/js/trends-chart.js | 2→2 lines | ~57 |
| 10:41 | Edited core/css/main.css | 7→8 lines | ~178 |
| 10:42 | Edited core/css/main.css | 7→8 lines | ~182 |
| 10:42 | Created core/js/chart-theme.js | — | ~697 |
| 10:42 | Edited index.html | 5→6 lines | ~56 |
| 10:42 | Edited CHANGELOG.md | 4→6 lines | ~123 |
| 10:43 | Theme remediation plan executed: ~200 hardcoded colors replaced with CSS vars across 20+ CSS/JS files | main.css, action-centre.css, settings.css, feedback.css, production.css, capacity CSS/JS, product-dev JS, ChartTheme utility | All 639 tests pass | ~8000 |

## Session: 2026-03-21 10:51

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 10:56 | Edited portals/capacity/js/me-heatmap.js | 4→4 lines | ~164 |
| 10:56 | Edited portals/action-centre/js/action-centre.js | inline fix | ~20 |
| 10:57 | Edited portals/capacity/js/me-chart.js | "background:#ef4444;" → "background:var(--chart-re" | ~11 |
| 10:57 | Edited portals/product-development/js/product-development.js | "position:fixed;top:0;left" → "position:fixed;top:0;left" | ~62 |
| 10:57 | Edited portals/product-development/js/product-development.js | "position:fixed;top:0;left" → "position:fixed;top:0;left" | ~68 |
| 10:57 | Edited portals/product-development/js/product-development.js | "position:fixed;top:0;left" → "position:fixed;top:0;left" | ~67 |
| 13:14 | Rewrote Phase 2 into safe structural sequence with test gates | plans/REFACTORING_OPPORTUNITIES.md, CHANGELOG.md, .wolf/anatomy.md | Phase 2 now staged by module with focused suites and full-check gates to reduce regressions | ~700 tok |
| 10:57 | Edited CHANGELOG.md | 1→3 lines | ~110 |
| 10:57 | Replaced remaining hardcoded rgba/hex inline colors with CSS vars | products.js, me-heatmap.js, me-chart.js, action-centre.js, product-development.js | theme-aware colors in all portals | ~800 |
| 11:08 | Created portals/product-development/product-management/css/products.css | — | ~3852 |
| 11:09 | Edited CHANGELOG.md | 1→3 lines | ~115 |
| 13:22 | Rewrote Phase 3 into safe optimization sequence | plans/REFACTORING_OPPORTUNITIES.md, CHANGELOG.md, .wolf/anatomy.md | Phase 3 now includes scoped optimization rules plus behavior-preserving test gates | ~650 tok |

## Session: 2026-03-21 11:14

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 11:17 | Edited core/css/main.css | expanded (+80 lines) | ~1032 |
| 12:08 | Finished Operations People tab parity for Unit 2/3/6 | portals/operations/js/operations-dashboard-render-core.js, tests/operations-dashboard.test.js, CHANGELOG.md, .wolf/buglog.json | Added unit utilisation/headroom cards in People view and passing regression test coverage | ~320 |
| 11:17 | Edited portals/settings/css/settings.css | expanded (+35 lines) | ~236 |
| 11:17 | Edited portals/settings/js/settings.js | modified settingsApplyAppearance() | ~152 |
| 11:18 | Edited portals/settings/js/settings.js | modified settingsAppearanceSetTheme() | ~80 |
| 11:18 | Edited portals/settings/js/settings.js | 3→3 lines | ~59 |
| 11:18 | Edited portals/settings/js/settings.js | expanded (+8 lines) | ~481 |
| 11:18 | Edited CHANGELOG.md | 1→3 lines | ~120 |
| 11:19 | Implemented Phase 1 safe refactor + full validation | utils/js/helpers.js, core/css/components.css, portals/capacity/js/me-capacity.js, portals/capacity/js/me-product-taskload.js, portals/product-development/npi/js/pfmea.js, portals/product-development/npi/js/npi-data.js, portals/product-development/npi/js/npi-cp.js, portals/settings/js/settings.js, CHANGELOG.md | Focused suites + full `npm test` + `npm run check:all` passed; added local helper fallbacks for isolated Jest contexts | ~2200 |
| 11:19 | Added Terminal theme (phosphor-green on black) | main.css, settings.css, settings.js | completed | ~600 |

## Session: 2026-03-21 11:20

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 11:21 | Edited core/css/main.css | inline fix | ~32 |
| 11:21 | Edited core/css/main.css | inline fix | ~33 |
| 11:21 | Edited core/css/main.css | inline fix | ~33 |
| 11:22 | Edited CHANGELOG.md | 1→3 lines | ~66 |
| 11:39 | Edited core/css/main.css | 8→8 lines | ~194 |
| 11:39 | Edited CHANGELOG.md | 1→3 lines | ~74 |

## Session: 2026-03-21 11:43

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 11:45 | Edited portals/capacity/js/me-chart.js | reduced (-26 lines) | ~147 |
| 11:45 | Edited portals/capacity/js/me-chart.js | 5→5 lines | ~193 |
| 11:45 | Edited CHANGELOG.md | 4→8 lines | ~108 |
| 11:51 | Edited portals/capacity/js/prod-capacity-dashboard.js | 8→9 lines | ~79 |
| 11:51 | Edited CHANGELOG.md | 1→3 lines | ~86 |

## Session: 2026-03-21 11:57

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 12:00

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 12:00

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 12:03 | Edited portals/operations/js/operations-dashboard-render-core.js | removed 36 lines | ~21 |
| 12:03 | Created portals/operations/js/operations-infographic.js | — | ~2283 |
| 12:04 | Edited portals/operations/js/operations-dashboard-main.js | 4→5 lines | ~113 |
| 12:04 | Edited index.html | 2→3 lines | ~63 |
| 12:04 | Edited CHANGELOG.md | 1→3 lines | ~75 |
| 12:15 | Split Operations units into one-box-per-unit layout in People + Infographic | portals/operations/js/operations-dashboard-render-core.js, portals/operations/js/operations-infographic.js, tests/operations-dashboard.test.js, CHANGELOG.md, .wolf/cerebrum.md, .wolf/buglog.json | Unit 2/3/6 now render as separate boxes; targeted operations suite still passes | ~360 |
| 12:22 | Fixed misleading 0% coverage output in check:coverage | scripts/test-coverage-reporter.js, CHANGELOG.md, .wolf/buglog.json, .wolf/cerebrum.md | Reporter now prints explicit coverage-unavailable status when coverage map is empty; check:coverage and check:all pass | ~280 |

## Session: 2026-03-21 12:08

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 12:09

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 12:10 | Edited utils/js/guide.js | expanded (+14 lines) | ~518 |
| 12:10 | Edited CHANGELOG.md | 1→3 lines | ~68 |

## Session: 2026-03-21 12:14

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 12:35

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 12:35

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 12:42

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 12:45 | Edited core/js/state.js | 6→10 lines | ~249 |
| 12:46 | Edited portals/mcs/css/mcs.css | 9→9 lines | ~78 |
| 12:46 | Edited portals/mcs/css/mcs.css | CSS: flex-direction | ~81 |
| 12:46 | Edited portals/mcs/css/mcs.css | expanded (+22 lines) | ~262 |
| 12:46 | Edited portals/mcs/css/mcs.css | expanded (+7 lines) | ~174 |
| 12:46 | Edited portals/mcs/css/mcs.css | CSS: font-weight | ~57 |
| 12:46 | Edited portals/mcs/css/mcs.css | expanded (+11 lines) | ~219 |
| 12:46 | Edited portals/mcs/css/mcs.css | 6→6 lines | ~46 |
| 12:46 | Edited portals/mcs/css/mcs.css | 12→12 lines | ~97 |
| 12:47 | Edited portals/mcs/css/mcs.css | 11→11 lines | ~82 |
| 12:47 | Edited portals/mcs/css/mcs.css | 11→11 lines | ~72 |
| 12:47 | Edited portals/mcs/css/mcs.css | expanded (+165 lines) | ~961 |
| 12:48 | Edited portals/mcs/js/mcs-main.js | expanded (+77 lines) | ~2621 |
| 12:48 | Edited portals/mcs/js/mcs-main.js | added 4 condition(s) | ~524 |
| 12:48 | Edited portals/mcs/js/mcs-main.js | added 13 condition(s) | ~823 |
| 12:49 | Edited portals/mcs/js/mcs-main.js | expanded (+18 lines) | ~521 |
| 12:49 | Edited portals/mcs/js/mcs-main.js | added 11 condition(s) | ~914 |
| 12:49 | Edited portals/mcs/css/mcs-responsive.css | CSS: flex-wrap | ~54 |
| 12:49 | Edited portals/mcs/css/mcs-responsive.css | modified media() | ~157 |
| 12:49 | Edited portals/mcs/css/mcs-responsive.css | modified media() | ~66 |
| 12:50 | Edited CHANGELOG.md | 1→3 lines | ~196 |

## Session: 2026-03-21 12:55

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 13:07 | Edited portals/mcs/js/mcs-approval.js | 3→3 lines | ~47 |
| 13:08 | Edited CHANGELOG.md | 1→3 lines | ~80 |
| 13:44 | Created supabase/overhaul_hours_rename_and_backfill.sql | — | ~811 |
| 13:44 | Edited portals/mcs/js/mcs-approval.js | 2→2 lines | ~44 |
| 13:44 | Edited portals/mcs/js/mcs-approval.js | inline fix | ~18 |
| 13:45 | Edited portals/mcs/js/mcs-approval.js | inline fix | ~11 |
| 13:45 | Edited portals/mcs/js/mcs-modal.js | inline fix | ~31 |
| 13:45 | Edited portals/mcs/js/mcs-modal.js | 4→7 lines | ~162 |
| 13:45 | Edited portals/mcs/js/mcs-modal.js | 2→2 lines | ~107 |
| 13:46 | Edited portals/mcs/js/mcs-main.js | 3→3 lines | ~60 |
| 13:46 | Edited portals/product-development/product-management/js/products-data.js | added 3 condition(s) | ~313 |
| 13:46 | Edited portals/product-development/product-management/js/products-data.js | modified productsDataAddHistory() | ~496 |
| 13:46 | Edited portals/product-development/product-management/js/products.js | "cell-edit cell-num" → "cell-display" | ~76 |
| 13:46 | Edited portals/product-development/product-management/js/products.js | removed 2 lines | ~1 |
| 13:47 | Edited portals/product-development/product-management/js/trends-chart.js | Time() → Change() | ~530 |
| 13:47 | Edited portals/product-development/product-management/js/trends-chart.js | modified if() | ~198 |
| 13:47 | Edited portals/product-development/product-management/js/trends-chart.js | 8→9 lines | ~77 |
| 13:47 | Edited portals/product-development/product-management/js/trends-chart.js | expanded (+7 lines) | ~286 |
| 13:48 | Edited tests/mcs-overhaul-integration.test.js | inline fix | ~8 |
| 13:48 | Edited tests/mcs-overhaul-integration.test.js | inline fix | ~5 |
| 13:48 | Edited tests/mcs-overhaul-integration.test.js | inline fix | ~23 |
| 13:48 | Edited tests/mcs-overhaul-integration.test.js | inline fix | ~17 |
| 13:48 | Edited CHANGELOG.md | 1→3 lines | ~126 |

## Session: 2026-03-21 14:00

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 20:26

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 20:26

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 20:28 | Edited portals/capacity/js/me-products.js | 2→2 lines | ~33 |
| 20:28 | Edited CHANGELOG.md | 4→6 lines | ~76 |

## Session: 2026-03-21 20:28

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 20:34

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 20:34

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 20:43

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 20:43

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 20:43

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 20:51 | Created .mcp.json | — | ~81 |
| 20:51 | Edited .vscode/mcp.json | 12→11 lines | ~61 |
| 20:52 | Edited .mcp.json | expanded (+15 lines) | ~105 |

## Session: 2026-03-21 20:55

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 20:55

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 21:01

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 21:04 | Edited portals/product-development/npi/js/timing.js | 4→3 lines | ~28 |
| 21:04 | Edited CHANGELOG.md | 1→5 lines | ~75 |
| 21:19 | Created portals/product-development/npi/js/timing.js | — | ~4714 |
| 21:19 | Edited portals/product-development/npi/js/npi-data.js | added 4 condition(s) | ~320 |
| 21:19 | Edited portals/product-development/npi/css/gantt.css | modified not() | ~647 |
| 21:19 | Edited CHANGELOG.md | 1→5 lines | ~96 |

## Session: 2026-03-21 21:28

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 21:33 | Edited portals/product-development/npi/js/timing.js | added error handling | ~3650 |
| 21:34 | Edited CHANGELOG.md | 1→3 lines | ~133 |

## Session: 2026-03-21 21:36

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 21:37 | Edited index.html | 6→5 lines | ~69 |
| 21:37 | Edited core/css/main.css | CSS: filter, display | ~29 |
| 21:37 | Edited CHANGELOG.md | 4→6 lines | ~71 |
| 21:44 | Edited core/css/main.css | inline fix | ~5 |

## Session: 2026-03-21 21:46

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 21:50 | Edited index.html | 2→2 lines | ~23 |
| 21:50 | Edited index.html | 2→2 lines | ~26 |
| 21:50 | Edited index.html | inline fix | ~23 |
| 21:50 | Edited index.html | 2→2 lines | ~51 |
| 21:50 | Edited index.html | 2→2 lines | ~30 |
| 21:50 | Edited index.html | 2→2 lines | ~48 |
| 21:50 | Edited index.html | 4→4 lines | ~88 |
| 21:50 | Edited index.html | inline fix | ~25 |
| 21:50 | Edited index.html | inline fix | ~24 |
| 21:51 | Edited index.html | 2→2 lines | ~28 |
| 21:51 | Edited index.html | inline fix | ~28 |
| 21:51 | Edited index.html | 2→2 lines | ~48 |
| 21:51 | Edited index.html | inline fix | ~23 |
| 21:51 | Edited index.html | 2→2 lines | ~24 |
| 21:51 | Edited index.html | 2→2 lines | ~26 |
| 21:51 | Edited index.html | 2→2 lines | ~25 |
| 21:51 | Edited index.html | 2→2 lines | ~28 |
| 21:51 | Edited index.html | 2→2 lines | ~24 |
| 21:51 | Edited index.html | 2→2 lines | ~27 |
| 21:51 | Edited index.html | 2→2 lines | ~24 |
| 21:51 | Edited index.html | 2→2 lines | ~32 |
| 21:51 | Edited index.html | 2→2 lines | ~32 |
| 21:52 | Edited index.html | 3→3 lines | ~47 |
| 21:52 | Edited portals/feedback/js/feedback.js | 2→2 lines | ~60 |
| 21:52 | Edited portals/feedback/js/feedback.js | 2→2 lines | ~58 |
| 21:52 | Edited portals/feedback/js/feedback.js | 2→2 lines | ~33 |
| 21:52 | Edited portals/feedback/js/feedback.js | 2→2 lines | ~32 |
| 21:52 | Edited portals/feedback/js/feedback.js | 2→2 lines | ~31 |
| 21:52 | Edited portals/feedback/js/feedback.js | 2→2 lines | ~44 |
| 21:52 | Edited portals/feedback/js/feedback.js | 2→2 lines | ~46 |
| 21:52 | Edited portals/feedback/js/feedback.js | 2→2 lines | ~37 |
| 21:53 | Edited portals/product-development/js/product-development.js | 2→2 lines | ~72 |
| 21:53 | Edited portals/product-development/js/product-development.js | 2→2 lines | ~73 |
| 21:53 | Edited portals/product-development/js/product-development.js | 2→2 lines | ~70 |
| 21:53 | Edited portals/product-development/js/product-development.js | 2→2 lines | ~69 |
| 21:53 | Edited portals/product-development/npi/js/gates.js | "display:block;font-size:1" → "gate_${gateNum}_sig_${si}" | ~82 |
| 21:53 | Edited portals/product-development/npi/js/gates.js | "display:block;font-size:1" → "gate_${gateNum}_sig_${si}" | ~85 |
| 21:53 | Edited portals/capacity/js/prod-capacity-detail.js | 2→2 lines | ~45 |
| 21:54 | Edited portals/capacity/js/prod-capacity-detail.js | 2→2 lines | ~45 |
| 21:54 | Edited portals/capacity/js/prod-capacity-detail.js | 2→2 lines | ~48 |
| 21:54 | Edited CHANGELOG.md | 1→3 lines | ~68 |

## Session: 2026-03-21 21:58

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 22:00 | Edited portals/operations/css/operations-dashboard.css | expanded (+41 lines) | ~368 |
| 22:00 | Edited CHANGELOG.md | 4→6 lines | ~83 |

## Session: 2026-03-21 22:08

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 22:09 | Edited portals/operations/js/operations-infographic.js | added error handling | ~327 |
| 22:10 | Edited portals/operations/js/operations-infographic.js | 9→14 lines | ~250 |
| 22:10 | Edited tests/operations-infographic.test.js | 45→47 lines | ~517 |
| 22:10 | Edited CHANGELOG.md | 1→3 lines | ~51 |

## Session: 2026-03-21 22:13

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 22:20 | Created portals/operations/js/operations-infographic.js | — | ~5115 |
| 22:21 | Edited CHANGELOG.md | 4→6 lines | ~125 |

## Session: 2026-03-21 22:29

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-21 23:02

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-22 07:26

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-22 07:26

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-22 07:42

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

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
