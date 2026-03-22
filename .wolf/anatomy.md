# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-03-22T21:21:45.628Z
> Files: 11 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `CHANGELOG.md` — Changelog (~11283 tok)
- `index.html` — Tidyco Operations Portal (~10154 tok)

## .claude/


## .claude/agents/


## .claude/agents/logs/


## .claude/hooks/


## .claude/rules/


## .gemini/


## .github/


## .github/agents/


## .github/hooks/


## .github/instructions/


## .github/prompts/


## .github/skills/code-review/


## .github/workflows/


## .qwen/


## .serena/


## .serena/cache/typescript/


## .serena/memories/


## Manual Update 2026-03-22

- `portals/production/js/production.js` — Production hub favourites now use delegated `data-action` handling instead of inline `onclick`, aligning root-card interactions with delegation test expectations.

- `portals/capacity/js/me-calculations.js` — Product support demand now uses production schedule batch overlap count multiplied by editable per-product support value.
- `portals/capacity/js/me-products.js` — Products tab support KPI switched to schedule-driven monthly load and relabeled support input to Hours/Batch semantics.
- `portals/capacity/js/me-product-taskload.js` — Product Load support/total columns switched from weekly multiplier to batch-count monthly support.
- `tests/me-calculations.test.js` / `tests/me-products-filters.test.js` — Added regression coverage for batch-based support calculations and updated load/support copy assertions.
- `CHANGELOG.md` — Added entry for schedule-driven ME/PM product support change.

- `portals/product-development/npi/css/dashboard.css` — Added terminal-theme `mc-shell` overrides so Mission Control heading and KPI text no longer inherit unreadable light-theme hardcoded colors.
- `portals/product-development/npi/css/dashboard.css` — Increased terminal contrast in Gate Trajectory area for helper text, inactive gate circles, and connector lines.
- `portals/settings/css/settings.css` — Added terminal-only high-contrast placeholder styling for inline Product Families and Work Areas table inputs.
- `core/css/main.css` — Increased dark/terminal `--muted` contrast token values to restore readable secondary text on project dashboard screens.
- `portals/hub/js/hub.js` — Added `hub-home` class on hub root container to scope compact desktop layout overrides.
- `portals/hub/css/hub.css` — Added Hub Phase 1 desktop compact mode (reduced spacing, reduced card height, 3-column wide-screen grid) and then removed favourites panel internal scrollbar once favourites caps were lowered.
- `portals/hub/js/hub.js` — Reduced stored favourites caps to 4 pages and 4 products so the Hub favourites panel remains compact.
- `CHANGELOG.md` — Added entry for Hub Phase 1 compact landing layout.
- `tests/hub.test.js` / `tests/capacity-hub.test.js` — Executed targeted regression tests after hub layout changes and favourites cap follow-up.


## core/css/


## core/js/

- `state.js` — ═══════════════════════════════════ (~4502 tok)

## docs/


## docs/guides/


## docs/reference/


## docs/setup/


## plans/

- `pfMEA-improvements-plan.md` — PFMEA Improvements Plan — AIAG-VDA Compliance & UX Enhancement (~7631 tok)

## portals/action-centre/css/


## portals/action-centre/js/


## portals/capacity/css/


## portals/capacity/js/


## portals/capacity/project-management/css/


## portals/capacity/project-management/js/


## portals/feedback/css/


## portals/feedback/js/


## portals/hub/css/


## portals/hub/js/


## portals/mcs/css/


## portals/mcs/js/

- `mcs-main.js` — MCS (Manufacturing Change) - Main Portal (~7919 tok)

## portals/mcs/templates/


## portals/operations/css/


## portals/operations/js/


## portals/product-development/js/


## portals/product-development/npi/css/

- `pfmea.css` — Styles: 74 rules (~4030 tok)

## portals/product-development/npi/js/

- `npi-constants.js` — ═══════════════════════════════════ (~567 tok)
- `npi-data-relational.js` — npiRelLooksLikeUuid: npiRelFindProject, npiRelIsHeaderStep, npiRelPersistedPfdStepNum, npiRelHydrate (~12209 tok)
- `npi-events.js` — ═══════════════════════════════════ (~4630 tok)
- `pfmea.js` — Declares PFMEA_RPN_FILTERS (~14939 tok)

## portals/product-development/product-management/css/


## portals/product-development/product-management/js/


## portals/production/css/


## portals/production/js/


## portals/settings/css/


## portals/settings/js/


## scripts/


## supabase/


## tests/


## utils/js/

- `guide.js` — ═══════════════════════════════════ (~15787 tok)
