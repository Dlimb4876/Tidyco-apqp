# Tidyco APQP - Copilot Instructions

## Scope
Use these rules for all work in this repository. Keep responses and changes in plain language because the primary user is non-technical.

## Project Snapshot
Tidyco APQP is a vanilla JavaScript SPA (no build pipeline). Files are served directly in the browser. Backend is Supabase (Auth + Postgres + Realtime).

## Build And Test
Run commands in this order when validation is needed:

```bash
npm install
npm test
npm run check:all
```

Optional focused checks:

```bash
npm run lint:npi
npm run format:npi
```

Notes:
- `npm install` must run first on a fresh clone or `npm test` can fail with `jest: not found`.
- `check:all` currently runs: load order, syntax, subscriptions, mobile breakpoints, modal state, state variable tracking, and coverage checks.

## Architecture
- `index.html` is the source of truth for JS/CSS load order.
- Core dependency order is strict: `state.js -> auth.js -> db.js -> helpers.js -> navigation.js -> realtime.js -> portals -> app.js`.
- `app.js` must load last.
- Major boundaries:
  - `core/js`: global state, auth, persistence, app bootstrap
  - `utils/js`: shared helpers, routing, realtime subscription helpers
  - `portals/*`: feature UIs and feature data/render modules

## Critical Conventions
1. Keep all global state in `core/js/state.js` with defaults (`let` for mutable state).
2. Never add duplicate `const` declarations in the same scope. One syntax error can stop the full file from loading.
3. Use `esc()` for any user-provided value interpolated into HTML strings.
4. Use `navigate()` for route changes so realtime cleanup runs correctly.
5. Keep ME/PM capacity parity: changes in `portals/capacity/` must be mirrored in PM capacity unless explicitly excluded.
6. Follow auth-only RLS model: do not filter client queries by `user_id`.
7. Respect save debounce behavior (about 800ms) when designing UX.
8. Keep new docs/plans in `plans/`, not repository root.
9. Use mobile-first CSS with both breakpoints:
   - `@media (max-width: 767px)`
   - `@media (min-width: 768px)`

## Navigation And Patterns
- Hash routing pattern: `#p=<uuid>&s=<section>&t=<tab>`.
- Common helper patterns:
  - `showModal('modalId')` / `closeModal('modalId')`
  - `emptyState(title, subtitle)` for empty lists
  - short prefixed IDs such as `f_`, `e_`, `c_`, `r_`, `a_`

## Troubleshooting Shortcut
If a function appears undefined (`X is not a function`):
1. Check the defining file for syntax errors (especially duplicate `const`).
2. Confirm the defining script loads before callers in `index.html`.
3. Re-run syntax/load-order checks.

## Source References
Use these as canonical detail docs instead of duplicating rules here:
- `CLAUDE.md`
- `.claude/rules/code-style.md`
- `.claude/rules/security.md`
- `.claude/rules/navigation.md`
- `.claude/rules/realtime.md`
- `.claude/rules/testing.md`

## Changelog Rules

**At the start of every session or instruction:** Read `CHANGELOG.md` to understand what has recently changed and why. This gives you context before touching any code.

**After every change you implement:** Add a 2-line entry at the top of `CHANGELOG.md` (below the first `---` line) using this exact format:

```
## YYYY-MM-DD | Short title of the change | Reason / what problem it solves

```

- Use today's date.
- The title should be short (under 80 characters).
- The reason should explain *why*, not just *what*.
- One entry per logical change — not one per file edited.
- Add the entry before committing so it is included in the same commit.
