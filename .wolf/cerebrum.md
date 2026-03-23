# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-03-23

## User Preferences

- **OpenWolf protocol is non-negotiable, even mid-flow.** Cerebrum, buglog, anatomy, and memory updates are mandatory checkpoints — not optional wrap-up. A fast-moving session is not an excuse to skip them.
- For Operations dashboard unit capacity displays, user prefers one box per unit (not grouped into a single shared panel/card).
- User expects README.md and TESTING_STRATEGY.md to be updated in the same logical change whenever implementation changes affect behavior, workflow, or test reality.
- For NPI PFD flowchart UX, user expects the preview to stay compact even for very large maps (100+ steps), with fixed 211% zoom, permanent left-to-right layout, strong visual distinction between process and decision nodes, and a professional polished look (clean edge labels, restrained palette, non-scruffy rendering).
- For MCS staged modals: wider dialog, bordered collapsible stage cards, fixed title banner visible during scroll, colored header bar, visible separators between stages. Status is global state — show in top bar, not Stage 1. Stage numbered badges must be explicit HTML elements (pseudo-element-only numbering is unreliable). Footer action bar must stay light and high-contrast.
- For MCS approvals, Stage 1 Impact Assessment needs its own estimated time impact separate from Stage 3 implementation time.
- On MCS main cards, user wants explicit label text (`Change Type: ...`) rather than only the raw value.
- For favourites UX, user expects star toggles on all hub-style cards (main hub and section root hubs).
- For layout/design feedback, recommendations must be based on direct inspection of the current implementation before suggesting changes.
- For Logistics and Unit 6 capacity pages, user does not want the shared Capacity route-switcher bar above the local page header.
- In Capacity, user-facing role labels must match the stream: Logistics uses `Logistics Technician` and Unit 6 uses `Technician` instead of generic `Engineer` wording.
- Do not assume the same capacity-header cleanup is needed on other capacity pages; verify the current implementation before suggesting broader nav removals.
- For ME/PM product support planning, monthly support/load must be driven by production schedule batch counts (batch multiplier), not fixed weeks-per-month multipliers.
- For Product Support effective-dated edits, user expects explicit intent controls (not auto-save on field change), with clear in-context change history at the point of editing.
- For settings portal work, user prioritizes reducing churn in `settings.js`; avoid broad rewrites and stabilize tests with explicit hooks/contracts to prevent scope collisions and brittle `settings-portal.test.js` coupling.

## Key Learnings

- **Project:** tidyco-apqp — Manufacturing Engineering SPA for rail overhaul, managing APQP Gates 0–5. Stack: vanilla JavaScript, Chart.js, Supabase.
- Docs split: `plans/` (pending work/specs), `docs/reference/` (technical refs), `docs/guides/` (how-to), `docs/setup/` (setup). Filenames use lowercase kebab-case.
- Appearance preferences are browser-local in `tidyco_prefs`; `settingsApplyAppearance()` applies them on startup. Theme selection must apply immediately on `ap-theme` radio change — no Save required.
- **ChartTheme utility** (`core/js/chart-theme.js`, loaded after `db.js`) provides `getColors()`, `getPalette(n)`, `getDefaultOptions()` — use for all Chart.js code. CSS variables `--bg-soft`, `--table-head-bg`, `--overlay-bg` replace legacy hardcoded values; all component colors must use CSS variables or have explicit `[data-theme="dark"]` overrides.
- **Jest/eval (consolidated):** Modules loaded via `eval()` run without full script load order — replace inline logic with helpers that include local fallback wrappers. Export needed functions through `globalThis` inside the eval string. Prefer asserting DOM/state outcomes rather than mocked invocation counts for internal calls. Coverage maps may be empty for eval-loaded files even when all tests pass.
- Operations dashboard parity: People tab must include Unit 2/3/6 capacity cards alongside ME and PM. Capacity affordances must be interactive controls, not static `div` with tooltip.
- `supabase/` is a loose set of setup/incremental SQL scripts, not a managed migration chain.
- NPI PFD flowchart: links are step numbers, not row ids; blank Process links fall through to the next numbered step so legacy straight-line PFDs render without rewiring.
- OpenWolf 1.0.4 AI cron tasks require `claude` CLI on PATH (`cron-engine.js` only checks for `claude`); `.wolf/config.json` flags `use_claude_p`/`api_key_env` do not change that behavior.
- On this Windows setup, `winget install --id Anthropic.ClaudeCode --exact` installs a working `claude.exe` under `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Anthropic.ClaudeCode_*`; existing shells may need restart to see the alias, but restarting the OpenWolf daemon with that directory on PATH is enough to recover AI cron tasks immediately.
- `.gemini/GEMINI.md` must be kept aligned with OpenWolf protocol when workflow requirements change.

## Do-Not-Repeat

<!-- [2026-03-21] Dark mode colours: never use hardcoded hex for borders/backgrounds in shared components. Any colour against --surface or --bg must use a CSS variable or have a [data-theme="dark"] override. --blue-dark (#3f8ded) is NOT legible on dark blue — use --blue (#5aa5ff) for dark mode text. -->
<!-- [2026-03-21] Refactor gotcha: do not assume helpers.js globals are always available in tests. When replacing inline formulas/UI snippets with shared helpers, add local wrappers that call the helper when defined and fall back to equivalent inline behavior. -->
<!-- [2026-03-23] Capacity persistence: `public.me_holidays` is the live source; `public.me_capacity` does not exist. Never reintroduce a query to `me_capacity`, and never delete all `me_holidays` rows globally — delete only the current user's rows before reinserting. -->
<!-- [2026-03-23] Capacity task delete: removing from `meDataState.tasks` is not enough — always persist a relational delete (or queue ids in `meDataSave`) so `me_tasks` rows don't return on refresh. -->
<!-- [2026-03-23] NPI dashboard search: if search triggers `render()` on each keystroke, the input is replaced and focus/caret is lost. Capture selection before render and restore focus + selection on the replacement input. -->
<!-- [2026-03-23] OpenWolf cron: `openwolf cron run <ai-task>` only works when `claude` CLI is on PATH; daemon records failure even if CLI wrapper reports success. -->
<!-- [2026-03-23] Settings test stability: do not use blanket `let`→`var` rewrites of `settings.js` in Jest. Prefer explicit state hooks (`settingsSetCoreState`) and stable load contracts to avoid eval-scope collisions across split settings modules. -->

## Decision Log

- [2026-03-21] Dark mode added through browser-local Appearance preferences (not DB/global), because Settings already defines these as device-specific and startup applies them before render.