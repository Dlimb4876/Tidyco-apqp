# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-03-29

## User Preferences

- User expects access permissions to control visibility as well as blocking: inaccessible hub and sub-hub cards should be hidden, not merely denied on click.
- For the Settings team-permissions editor, user wants a short plain-language explanation of what each permission actually allows.
- For standalone guide rollout, user wants the wiki reachable by direct URL first and does not want a portal navigation link added until after manual review.
- For large guide/documentation systems, user prefers a standalone index/wiki linked from the app (not embedded in SPA routes), with folder structure by area and small token-limited files for easier audits.
- For Logistics Product Support, user expects `Kitting` and `Booking In/Out` as separate columns (not one combined column), with Hours/Batch reflecting the component sum.
- **OpenWolf protocol is non-negotiable, even mid-flow.** Cerebrum, buglog, anatomy, and memory updates are mandatory checkpoints — not optional wrap-up.
- For Operations dashboard unit capacity displays, user prefers one box per unit (not grouped into a single shared panel/card).
- User expects README.md and TESTING_STRATEGY.md to be updated in the same logical change whenever implementation changes affect behavior, workflow, or test reality.
- For NPI PFD flowchart UX: compact preview even for 100+ steps, fixed 211% zoom, left-to-right layout, strong visual distinction between process/decision nodes, professional polished look.
- For MCS staged modals: wider dialog, bordered collapsible stage cards, fixed title banner during scroll, colored header bar, visible separators. Status is global — top bar only. Stage badges must be explicit HTML. Footer must stay light and high-contrast.
- For MCS approvals, Stage 1 Impact Assessment needs its own estimated time impact separate from Stage 3 implementation time.
- On MCS main cards, user wants explicit label text (`Change Type: ...`) rather than only the raw value.
- User wants MCS Stage 3 to mirror Stage 1 selected impacts as implementation checkboxes, with progress persisted to database-backed change data.
- For favourites UX, user expects star toggles on all hub-style cards (main hub and section root hubs).
- For layout/design feedback, recommendations must be based on direct inspection of the current implementation before suggesting changes. Verify before assuming cleanup is needed elsewhere.
- For Logistics and Unit 6 capacity pages, user does not want the shared Capacity route-switcher bar above the local page header.
- In Capacity, user-facing role labels must match the stream: Logistics uses `Logistics Technician` and Unit 6 uses `Technician` instead of generic `Engineer`.
- For ME/PM product support planning, monthly support/load must be driven by production schedule batch counts (batch multiplier), not fixed weeks-per-month multipliers.
- For Product Support effective-dated edits, user expects explicit intent controls (not auto-save on field change), with clear in-context change history at the point of editing.
- For Capacity Product Support, user expects the `📦 Bulk Save All Changes` control to sit on the right above the table across all streams (ME/PM/Logistics/Unit 6).
- For settings portal work, user prioritizes reducing churn in `settings.js`; avoid broad rewrites and stabilize tests with explicit hooks/contracts to prevent scope collisions and brittle `settings-portal.test.js` coupling.
- For Product Development architecture, user expects distinct tools like Parts Database to live as their own subsystem/folder rather than being hidden inside shared NPI implementation files.
- For debug browser launches, use a dedicated Chrome `--user-data-dir` + `--incognito --new-window` for a fresh separate-profile session; plain `Start-Process` or incognito alone may reuse existing profile.

## Key Learnings

- **Project:** tidyco-apqp — Manufacturing Engineering SPA for rail overhaul, managing APQP Gates 0–5. Stack: vanilla JavaScript, Chart.js, Supabase.
- Serena MCP context is client-specific: OpenCode/Codex expects `--context codex`, Claude Code expects `--context claude-code`. A single `claude-code` entry can appear visible in OpenCode but still be rejected as incompatible.
- Wiki compatibility: keep legacy `/dev/wiki/` URL functional (redirect to `/wiki/`) and avoid raw `./content/...` bootstrap fetch paths that depend on trailing-slash URL shape.
- Appearance preferences are browser-local in `tidyco_prefs`; `settingsApplyAppearance()` applies on startup. Theme must apply immediately on `ap-theme` radio change — no Save required.
- **ChartTheme utility** (`core/js/chart-theme.js`, loaded after `db.js`) provides `getColors()`, `getPalette(n)`, `getDefaultOptions()`. CSS variables `--bg-soft`, `--table-head-bg`, `--overlay-bg` replace legacy hardcoded values; all component colors must use CSS variables or have explicit `[data-theme="dark"]` overrides.
- **Jest/eval (consolidated):** Modules loaded via `eval()` run without full script load order — replace inline logic with helpers that include local fallback wrappers. Export needed functions through `globalThis` inside the eval string. Prefer asserting DOM/state outcomes over mocked invocation counts. Coverage maps may be empty for eval-loaded files even when all tests pass.
- Operations dashboard parity: People tab must include Unit 2/3/6 capacity cards alongside ME and PM. Capacity affordances must be interactive controls, not static `div` with tooltip.
- `supabase/` is a loose set of setup/incremental SQL scripts, not a managed migration chain.
- NPI PFD flowchart: links are step numbers, not row ids; blank Process links fall through to the next numbered step so legacy straight-line PFDs render without rewiring.
- **OpenWolf cron + Claude CLI:** AI cron tasks require `claude` CLI on PATH (`cron-engine.js` only checks for `claude`). On Windows, `winget install --id Anthropic.ClaudeCode --exact` installs `claude.exe` under `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Anthropic.ClaudeCode_*`; restart the daemon with that directory on PATH to recover.
- `.gemini/GEMINI.md` must be kept aligned with OpenWolf protocol when workflow requirements change.
- **ESM migration (consolidated):** P7a: export `mcsDataSubscribe`/`mcsDataUnsubscribe` from `mcs-realtime.js`, remove in-scope `window.*` usage. Phase 8: `index.html` uses single module entry (`core/js/main.js`); inline HTML handlers need safe `globalThis` bridges (`doLogin`, `navigate`, modal helpers) until removed. Phase 9: guardrails are now `check:imports` + `check:esm-coverage`. If `auth.js` calls `launchApp()`, it must import it explicitly from `core/js/app.js` — legacy global lookup causes `ReferenceError` after sign-in. Remove all window-bridge assignments in scoped files; route actions through delegated handlers, not inline `onclick`.
- **Hosted Supabase bootstrap:** Static/browser builds must read a tracked public config module (`core/js/config.public.js`). Pointing runtime at gitignored `core/js/config.js` causes a hosted 404, aborts module startup, and leaves inline login handlers like `doLogin()` undefined.

## Do-Not-Repeat

<!-- [2026-03-24] Avoid exact-string HTML assertions that depend on attribute order (e.g. `data-field="..." readonly`) in rendered input tests; use regex/assertions that tolerate extra attributes/classes. -->
<!-- [2026-03-24] When adding new "access" permissions, wire them into both render-time visibility (hub cards, local nav tabs, favourites) and deep-link access checks; only gating navigate/render is not enough. -->
<!-- [2026-03-24] Settings permissions copy: when `settings-teams.js` falls back to local permission definitions in isolated tests, keep labels/descriptions aligned with `utils/js/helpers.js` or the test harness will render different text from the live app. -->
<!-- [2026-03-21] Dark mode colours: never use hardcoded hex for borders/backgrounds in shared components. Any colour against --surface or --bg must use a CSS variable or have a [data-theme="dark"] override. --blue-dark (#3f8ded) is NOT legible on dark blue — use --blue (#5aa5ff). -->
<!-- [2026-03-21] Refactor gotcha: do not assume helpers.js globals are always available in tests. When replacing inline snippets with shared helpers, add local wrappers that call the helper when defined and fall back to equivalent inline behavior. -->
<!-- [2026-03-23] Capacity persistence: `public.me_holidays` is the live source; `public.me_capacity` does not exist. Never reintroduce a query to `me_capacity`, and never delete all `me_holidays` rows globally — delete only the current user's rows before reinserting. -->
<!-- [2026-03-23] Capacity task delete: removing from `meDataState.tasks` is not enough — always persist a relational delete (or queue ids in `meDataSave`) so `me_tasks` rows don't return on refresh. -->
<!-- [2026-03-23] Any search/filter path that triggers rerender must use `preserveInputCaretAfterRender` (with a local fallback in isolated tests). Capturing + restoring focus/caret must happen around every render that replaces the input element. -->
<!-- [2026-03-23] Settings test stability: do not use blanket `let`→`var` rewrites of `settings.js` in Jest. Prefer explicit state hooks (`settingsSetCoreState`) and stable load contracts. -->
<!-- [2026-03-24] When moving or deduplicating event routing between `capacity.js` and `capacity-events.js`, update routing-ownership tests immediately; stale delegation expectations can hide duplicated handlers or false regressions. -->
<!-- [2026-03-24] Intent-based table inputs committed only by an Apply action must not live only in the DOM. Store per-row draft values in state (scoped by stream/page) so shared tab refreshes and realtime rerenders cannot wipe in-progress edits. -->
<!-- [2026-03-24] Capacity chart month navigation cannot rely on chart-only canvas redraw. If month changes, re-render chart-tab HTML so KPI cards, Demand Breakdown, and Capacity-per-role tables recalculate across ME/PM/LOG/UNIT6. -->
<!-- [2026-03-25] Shared capacity chart/heatmap draw code must resolve month key from active stream context (PM/LOG/UNIT6/ME). Reading `meChartStart` directly causes non-ME date adjusters to appear broken. -->
<!-- [2026-03-25] Keep strict core script order in index bootstrap (`state -> auth -> db -> helpers -> navigation -> realtime`). Place utility scripts like chart-theme.js and guide.js after this chain. -->
<!-- [2026-03-27] Before deleting legacy shared files, grep tests for direct `readFileSync(...old-file...)` + `eval` coupling. Runtime bootstrap can be clean while Jest still depends on deleted artifacts. -->
<!-- [2026-03-27] When a user reports "data is in DB but UI is blank", run direct Supabase SQL first to verify duplicate keys/rows before assuming frontend ID mapping only; duplicate projects can make cards open empty clones. -->
<!-- [2026-03-27] In NPI, ensure dashboard project-open handlers call `npi.nav.openProjectById`. Bypassing it with direct `progId = id; navigate('project')` can silently reopen empty clones. -->
<!-- [2026-03-27] Capacity realtime focus guard must cover search/filter controls as well as inline table editors. If defer logic only checks `isEditingInlineCell()`, startup realtime bursts can replace search inputs and eject cursor. Debounce filter rerenders and cancel stale timers. -->
<!-- [2026-03-27] In Windows batch files, do not use `\"` as nested-quote escaping for `cmd`/`start` commands. Use doubled CMD quotes or hand off the browser launch to `powershell.exe`. -->
<!-- [2026-03-28] For MCS Stage 3 impact-progress persistence, avoid hard dependency on a new DB column unless migration is guaranteed. Persist in existing change data and parse on load. -->
<!-- [2026-03-29] Before converting many files to import from a new shared module (e.g., `npi-shared.js`), ensure the shared file exists first; missing shared modules can abort bootstrap and hide as unrelated runtime errors like missing global login handlers. -->
<!-- [2026-03-29] Do not make the browser app depend on gitignored core/js/config.js. Hosted/static environments cannot see local-only files, so the missing config aborts main.js before doLogin and other global bridges are assigned. -->

## Decision Log

- [2026-03-21] Dark mode added through browser-local Appearance preferences (not DB/global), because Settings already defines these as device-specific and startup applies them before render.
