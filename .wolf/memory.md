# Memory

> Chronological action log. Hooks and AI append to this file automatically.
> Old sessions are consolidated by the daemon weekly.

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
