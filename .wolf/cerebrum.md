# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-03-20

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->
- For Operations dashboard unit capacity displays, user prefers one box per unit (not grouped into a single shared unit panel/card).
- User expects README.md and TESTING_STRATEGY.md to be updated in the same logical change whenever implementation changes affect behavior, workflow, or test reality.
- For NPI PFD flowchart UX, user expects the preview to stay compact even for very large maps (100+ steps), not just moderate-size flows.
- For NPI PFD flowchart readability, user prefers fixed 211% zoom (220% bigger than prior 66%, not adaptive 45%), permanent left-to-right layout, and strong visual distinction between process and decision nodes.
- For NPI PFD flowchart visuals, user expects a professional polished look (clean edge labels, restrained palette, and non-scruffy rendering) in addition to readability.
- For MCS staged modals, user prefers a wider dialog with bordered collapsible stage cards and a fixed title banner that remains visible during scroll.
- For MCS stage headings, user prefers clear color-coded visual hierarchy (not monochrome black-and-white section labels).
- For MCS modals, status is a global state and should appear in the top bar, not inside Stage 1 content.
- For MCS approvals, Stage 1 Impact Assessment needs its own estimated time impact separate from the Stage 3 implementation time impact.
- On MCS main cards, user wants explicit label text (`Change Type: ...`) rather than only the raw type value.
- For favourites UX, user expects star toggles on all hub-style cards (main hub and section root hubs), not only on the main portal hub.
- For layout/design feedback, user expects recommendations to be based on direct inspection of the current implementation before suggesting changes.
- For ME/PM product support planning, user wants per-product editable support values to stay product-specific, but monthly support/load must be driven by production schedule batch counts (batch multiplier) rather than fixed weeks-per-month multipliers.
- For Product Support effective-dated edits, user expects explicit intent controls (not auto-save on field change), with clear in-context visibility of change history at the point of editing.

## Key Learnings

- **Project:** tidyco-apqp
- **Description:** A Manufacturing Engineering tool for rail overhaul, managing APQP Gates 0–5 and broader operational workflows. Built as a Single Page Application (SPA) using vanilla JavaScript, Chart.js, and Supabase for persistence.
- The repo now splits documentation by purpose: `plans/` for pending work/specs, `docs/reference/` for current technical references, `docs/guides/` for how-to docs, and `docs/setup/` for setup instructions.
- Docs filenames under `docs/` now use lowercase kebab-case for consistency and easier linking.
- Appearance preferences are browser-local in `tidyco_prefs`; `settingsApplyAppearance()` is the global hook that applies them during startup and should be extended for app-wide theming changes.
- Theme selection UX should apply immediately on `ap-theme` radio change in Settings so users get instant visual feedback without requiring Save.
- **ChartTheme utility** (`core/js/chart-theme.js`) is loaded after `db.js` in index.html and provides `ChartTheme.getColors()`, `ChartTheme.getPalette(n)`, `ChartTheme.getDefaultOptions()` — use for all new Chart.js code instead of hardcoding colors.
- `--bg-soft` (`#f8fbff` light / `#101a24` dark) replaces `#fafbfd`/`#f7fbff` subtle surface tints. `--table-head-bg` replaces `#f4f6fa` header backgrounds. `--overlay-bg` replaces `rgba(0,0,0,0.5)` modal backdrops.
- Some Jest suites evaluate modules in isolation (without full script load order), so refactors that replace inline logic with global helpers must include local fallback wrappers to avoid `ReferenceError` in tests.
- For script files loaded via eval in Jest, function declarations may not be directly visible in test scope; export needed functions through `globalThis` inside the eval string to make tests deterministic.
- In eval-loaded browser scripts, mocking `global.<fnName>` may not intercept same-scope function calls inside the module; prefer asserting DOM/state outcomes rather than expecting mocked invocation counts for internal function calls.
- Coverage reporting note: many suites load source files via eval(), which means Jest can pass all tests but still emit an empty source coverage map.
- Operations dashboard parity expectation: the People tab must include Unit 2/3/6 capacity cards alongside ME and PM, not only on Overview.
- Capacity info affordances in dashboard cards must be interactive controls (button or delegated action), not static `div` text with only a `title` tooltip.
- The `supabase/` folder is a loose set of setup and incremental SQL scripts, not a managed migration chain; keep files that a fresh environment still needs, and only delete one-off cleanup scripts once they have no remaining setup value.
- `.gemini/GEMINI.md` is a separate assistant-facing guide and must be kept aligned with the repo's OpenWolf protocol when workflow requirements change.
- NPI PFD flowchart links are stored as step numbers, not row ids; blank Process links should fall through to the next numbered step so legacy straight-line PFDs still render without manual rewiring.

## User Preferences (continued)

- **OpenWolf protocol is non-negotiable, even mid-flow.** User expects cerebrum.md, buglog.json, anatomy.md, and memory.md to be updated automatically — not only when reminded. A fast-moving session (bug → fix → feature sprint with no pause) is not an excuse to skip the protocol. Treat the protocol steps as mandatory checkpoints, not optional wrap-up.

## Do-Not-Repeat

<!-- [2026-03-21] Dark mode colour overrides: never rely on hardcoded hex values for borders/backgrounds in shared components (tags, flags, alerts). Any colour used in a component that renders against --surface or --bg must either use a CSS variable or have an explicit :root[data-theme="dark"] override. --blue-dark (#3f8ded) is NOT legible on dark blue backgrounds — use --blue (#5aa5ff) instead for dark mode text. -->

<!-- [2026-03-21] Theme remediation complete: all ~200 hardcoded colors now use CSS variables. New variables added to main.css: --chart-blue/green/amber/pink/purple/red (+ -pale/-lt variants), --status-green/blue/amber/purple/red (-bg/-text), --gray-50..900, --code-bg, --field-highlight, --row-highlight-blue/amber, --overlay-light/medium, --green-dark. ChartTheme utility at core/js/chart-theme.js provides getColors(), getPalette(), getDefaultOptions() for all Chart.js usage. -->
<!-- [2026-03-21] Refactor gotcha: do not assume helpers.js globals are always available in tests. When replacing inline formulas/UI snippets with shared helpers in NPI/Settings modules, add local wrappers that call the helper when defined and fall back to equivalent inline behavior. -->

<!-- [2026-03-23] Capacity persistence gotcha: `public.me_holidays` is the live source of truth and `public.me_capacity` does not exist in production. Do not reintroduce a client query to `me_capacity`, and never delete all `me_holidays` rows globally during save — delete only the current user's rows before reinserting replacements. -->
<!-- [2026-03-23] Capacity task delete gotcha: removing a task from `meDataState.tasks` is not enough. Any delete path must also persist a relational delete (or queue ids for deletion in `meDataSave`) so `me_tasks` rows do not come back on refresh. -->

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
- [2026-03-21] Dark mode was added through the existing browser-local Appearance preferences flow rather than a DB/global setting, because the Settings page already defines these preferences as device-specific and startup already applies them before render.
