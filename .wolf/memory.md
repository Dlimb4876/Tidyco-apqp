# Memory

> Chronological action log. Hooks and AI append to this file automatically.
> Old sessions are consolidated by the daemon weekly.

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
