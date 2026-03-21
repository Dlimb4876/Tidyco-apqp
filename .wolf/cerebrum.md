# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-03-20

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Project:** tidyco-apqp
- **Description:** A Manufacturing Engineering tool for rail overhaul, managing APQP Gates 0–5 and broader operational workflows. Built as a Single Page Application (SPA) using vanilla JavaScript, Chart.js, and Supabase for persistence.
- The repo now splits documentation by purpose: `plans/` for pending work/specs, `docs/reference/` for current technical references, `docs/guides/` for how-to docs, and `docs/setup/` for setup instructions.
- Docs filenames under `docs/` now use lowercase kebab-case for consistency and easier linking.
- Appearance preferences are browser-local in `tidyco_prefs`; `settingsApplyAppearance()` is the global hook that applies them during startup and should be extended for app-wide theming changes.
- Theme selection UX should apply immediately on `ap-theme` radio change in Settings so users get instant visual feedback without requiring Save.
- **ChartTheme utility** (`core/js/chart-theme.js`) is loaded after `db.js` in index.html and provides `ChartTheme.getColors()`, `ChartTheme.getPalette(n)`, `ChartTheme.getDefaultOptions()` — use for all new Chart.js code instead of hardcoding colors.
- `--bg-soft` (`#f8fbff` light / `#101a24` dark) replaces `#fafbfd`/`#f7fbff` subtle surface tints. `--table-head-bg` replaces `#f4f6fa` header backgrounds. `--overlay-bg` replaces `rgba(0,0,0,0.5)` modal backdrops.

## Do-Not-Repeat

<!-- [2026-03-21] Dark mode colour overrides: never rely on hardcoded hex values for borders/backgrounds in shared components (tags, flags, alerts). Any colour used in a component that renders against --surface or --bg must either use a CSS variable or have an explicit :root[data-theme="dark"] override. --blue-dark (#3f8ded) is NOT legible on dark blue backgrounds — use --blue (#5aa5ff) instead for dark mode text. -->

<!-- [2026-03-21] Theme remediation complete: all ~200 hardcoded colors now use CSS variables. New variables added to main.css: --chart-blue/green/amber/pink/purple/red (+ -pale/-lt variants), --status-green/blue/amber/purple/red (-bg/-text), --gray-50..900, --code-bg, --field-highlight, --row-highlight-blue/amber, --overlay-light/medium, --green-dark. ChartTheme utility at core/js/chart-theme.js provides getColors(), getPalette(), getDefaultOptions() for all Chart.js usage. -->

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
- [2026-03-21] Dark mode was added through the existing browser-local Appearance preferences flow rather than a DB/global setting, because the Settings page already defines these preferences as device-specific and startup already applies them before render.
