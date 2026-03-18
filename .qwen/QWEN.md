# Qwen Assistant Guide for Tidyco APQP Project

This document provides conventions, architecture, and workflows for the Tidyco APQP project.
**Load this file at the start of every session** so you have full context before making changes.

---

## 1. Changelog Rules (Read This First)

**At the start of every session or instruction:** Read `CHANGELOG.md` to understand what has recently changed and why.

**After every change you implement:** Add a 2-line entry at the top of `CHANGELOG.md` (below the first `---` line) using this exact format:

```
## YYYY-MM-DD | Short title of the change | Reason / what problem it solves

```

- Use today's date.
- The title should be short (under 80 characters).
- The reason should explain *why*, not just *what*.
- One entry per logical change — not one per file edited.
- Add the entry before committing so it is included in the same commit.

---

## 2. User & Project Context

- **User**: The primary user has **zero coding experience**. All explanations must be in plain language, no jargon. For any multi-step task, create a todo list and complete each item one at a time.
- **Project**: A vanilla JavaScript Single Page Application (SPA) for APQP and Manufacturing Engineering workflows.
- **Architecture**: No build pipeline. All files are static HTML/JS/CSS served directly. Backend is Supabase (PostgreSQL + Auth + RLS).

---

## 3. Technical Stack

- **Language**: Plain ES6+ JavaScript (no TypeScript, no build step).
- **Backend**: Supabase v2 (loaded from CDN).
- **Libraries**: Chart.js v4.4.0 (CDN), IBM Plex Sans/Mono (Google Fonts).
- **Testing**: Jest 30 + jest-environment-jsdom.
- **Linting**: ESLint 9 (applied only to `portals/product-development/npi/**/*.js`).
- **Formatting**: Prettier.

---

## 4. Commands

Always run in this order:

1. `npm install` — Run once; installs Jest and ESLint dev dependencies.
2. `npm test` — Runs all Jest tests. Expect ~179 tests, all passing.
3. `npm run check:all` — Runs all quality checks. **Run this before every commit.**

---

## 5. Critical Rules

1. **`index.html` is the source of truth for load order**: Core order is `state.js → auth.js → db.js → helpers.js → navigation.js → realtime.js → Portals → app.js`.
2. **No duplicate `const`**: A duplicate `const` in the same scope causes the entire JS file to fail silently. All functions in that file become `undefined`.
3. **Global state in `core/js/state.js`**: All global state variables must be defined here with a default value. Use `let` for mutable state.
4. **Capacity parity**: Changes to ME Capacity (`portals/capacity/js/`) must be mirrored in PM Capacity.
5. **RLS is auth-only**: All authenticated users see all data. Never filter Supabase queries by `user_id`. New tables require: `CREATE POLICY "auth" ON table FOR ALL USING (auth.role() = 'authenticated')`.
6. **Real-time cleanup**: Always store the subscription reference and call `removeRealtimeSubscription(ref)` before navigating. The `navigate()` function handles this automatically.
7. **`esc()` all user data**: Use `esc(value)` from `helpers.js` to prevent XSS when interpolating user-supplied data into HTML.
8. **Save debounce**: Data is persisted to Supabase on an 800–900ms debounce, not instantly.
9. **Docs in `plans/`**: All planning and architecture docs go in the `/plans` directory.
10. **Mobile-first CSS**: New CSS must include `@media (max-width: 767px)` and `@media (min-width: 768px)` breakpoints.

---

## 6. Repository Layout

```
index.html              # App entry point — ALL script/CSS load order defined here
core/js/state.js        # Global state variables and constants
core/js/auth.js         # Supabase client and authentication
core/js/db.js           # Data persistence and synchronization
core/js/app.js          # Main application init (must load last)
core/css/main.css       # CSS variables, typography, core layout
core/css/components.css # Shared UI components (modals, buttons, etc.)
utils/js/helpers.js     # esc(), showModal(), closeModal()
utils/js/navigation.js  # Hash-based routing and the render() switchboard
utils/js/realtime.js    # Subscription helpers
portals/                # Feature UIs (hub, capacity, product-development, etc.)
tests/                  # Jest test files (*.test.js)
plans/                  # Project documentation and architecture plans
CHANGELOG.md            # Log of every change made — always read and update this
```

---

## 7. Key Patterns

- **Active project accessor**: `prog()` returns the current project object.
- **Short ID generation**: `const id = 'f_' + Math.random().toString(36).substr(2, 5);`
- **ID prefixes**: `f_`=mode, `e_`=effect, `c_`=cause, `r_`=risk, `a_`=action
- **Modals**: `showModal('modalId')` / `closeModal('modalId')`
- **Navigation**: `navigate('capacity', { ct: 'me' })` — handles hash update and subscription cleanup.
- **Hash format**: `#p=<uuid>&s=<section>&t=<tab>`
- **RPN formula**: `RPN = SEV × OCC × DET`. High threshold is ≥ 100.

---

## 8. Bug Squashing: "X is not a function"

1. Find where the function is defined: `grep -rn "function X\|const X" portals/ utils/ core/`
2. Read the defining file for syntax errors (duplicate `const`, unclosed brackets, missing commas).
3. Check the script load order in `index.html` to confirm the defining file loads before callers.
4. Fix the syntax error.

---

## 9. Source References

Canonical detail docs:
- `CLAUDE.md` — primary rules file
- `.claude/rules/code-style.md`
- `.claude/rules/security.md`
- `.claude/rules/navigation.md`
- `.claude/rules/realtime.md`
- `.claude/rules/testing.md`
- `CHANGELOG.md` — read at the start of every session
