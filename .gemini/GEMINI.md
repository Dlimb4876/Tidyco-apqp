# Gemini Assistant Guide for Tidyco APQP Project

This document provides a summary of conventions, architecture, and workflows for the Tidyco APQP project to ensure consistent and high-quality assistance.

---

## 1. User & Project Context

-   **User**: The primary user has **zero coding experience**. All explanations must be in plain language, avoiding jargon. For any multi-step task, a todo list must be used, with each item completed individually.
-   **Project**: A vanilla JavaScript Single Page Application (SPA) for APQP and Manufacturing Engineering workflows.
-   **Architecture**: It has **no build pipeline**. All files are static HTML/JS/CSS served directly. The backend is **Supabase** (PostgreSQL + Auth + RLS).

---

## 2. Technical Stack

-   **Language**: Plain ES6+ JavaScript (No TypeScript).
-   **Backend**: Supabase v2 (loaded from CDN).
-   **Libraries**: Chart.js v4.4.0 (CDN), IBM Plex Sans/Mono (Google Fonts).
-   **Testing**: Jest 30 + jest-environment-jsdom.
-   **Linting**: ESLint 9 (applied only to `portals/product-development/npi/**/*.js`).
-   **Formatting**: Prettier.

---

## 3. Commands

Always run in this order:

1.  `npm install`: (Run once) Installs Jest and ESLint dev dependencies.
2.  `npm test`: Runs all Jest tests. Expect 43 suites, 611 tests, all passing.
3.  `npm run check:all`: Runs all quality checks. **Run this before every commit.**
4.  `npx eslint portals/product-development/npi/**/*.js`: Lints NPI files.
5.  `npx prettier --write portals/product-development/npi/**/*.js`: Formats NPI files.

### OpenWolf commands and workflow

Gemini must also follow the OpenWolf protocol used by this repository.

1.  Read `.wolf/anatomy.md` before reading project files.
2.  Read `.wolf/cerebrum.md` before generating or changing code.
3.  Read `.wolf/buglog.json` before fixing a bug, test failure, or reported problem.
4.  Use `openwolf designqc` when asked to review or improve UI design. This saves screenshots to `.wolf/designqc-captures/` for inspection.
5.  After significant work, append a one-line entry to `.wolf/memory.md`.
6.  After creating, deleting, renaming, or materially changing tracked files, update `.wolf/anatomy.md`.
7.  After a bug fix or failed test/build investigation, append an entry to `.wolf/buglog.json`.

If Gemini is unsure about OpenWolf behavior, the source of truth is `.wolf/OPENWOLF.md`.

---

## 4. Critical Rules

1.  **`index.html` is the Source of Truth for Load Order**: All JS/CSS files are loaded via `<script>` and `<link>` tags. Dependencies MUST be loaded before the files that depend on them. The core order is: `state.js` → `auth.js` → `db.js` → `helpers.js` → `navigation.js` → `realtime.js` → Portal-specific JS → `app.js`.
2.  **No Duplicate `const`**: A `SyntaxError` (like a duplicate `const` in the same scope) will cause the entire JS file to fail silently at runtime. All functions within that file will become `undefined`.
3.  **Global State in `core/js/state.js`**: All global state variables must be defined here with a default value. Use `let` for mutable state.
4.  **Capacity Parity Rule**: Changes to ME Capacity (`portals/capacity/js/`) must be mirrored in PM Capacity (`portals/capacity/project-management/js/`).
5.  **RLS is Auth-Only**: All authenticated users can see all data. Supabase queries should **never** be filtered by `user_id` on the client. New tables require the policy: `CREATE POLICY "auth" ON table FOR ALL USING (auth.role() = 'authenticated')`.
6.  **Real-time Subscription Cleanup**: Always store the subscription reference and call `removeRealtimeSubscription(ref)` before navigating away. The `navigate()` function handles this automatically.
7.  **`esc()` All User Data**: Use `esc(value)` from `helpers.js` to prevent XSS when interpolating user-supplied data into HTML.
8.  **Save Debounce**: Data is persisted to Supabase on a 800-900ms debounce timer, not instantly.
9.  **`plans/` for Documentation**: All planning and architecture documents (.md) go in the `/plans` directory.
10. **Mobile-First CSS**: New CSS must include `@media (max-width: 767px)` and `@media (min-width: 768px)` breakpoints.

---

## 5. Repository Layout

-   `index.html`: The single entry point defining all script and CSS load order.
-   `core/`: Global logic and styles.
    -   `js/state.js`: Global state variables and constants.
    -   `js/auth.js`: Supabase client and authentication.
    -   `js/db.js`: Data persistence and synchronization.
    -   `js/app.js`: Main application initialization (must load last).
    -   `css/main.css`: CSS variables, typography, and core layout.
    -   `css/components.css`: Shared UI components (modals, buttons, etc.).
-   `portals/`: Self-contained feature areas (Hub, Capacity, Product Development, etc.).
-   `utils/`: Shared helper functions.
    -   `js/helpers.js`: `esc()`, `showModal()`, `closeModal()`.
    -   `js/navigation.js`: Hash-based routing and the main `render()` switchboard.
    -   `js/realtime.js`: Subscription helpers.
-   `tests/`: All Jest test files (`*.test.js`).
-   `plans/`: Project documentation and architecture plans.

---

## 6. Key Patterns

-   **Active Project Accessor**: `prog()` returns the current project object from `db.projects`.
-   **Short ID Generation**: `const id = 'f_' + Math.random().toString(36).substr(2, 5);` (Prefixes: `f_`=mode, `e_`=effect, `c_`=cause, `r_`=risk, `a_`=action).
-   **Modals**: `showModal('modalId'); closeModal('modalId');`
-   **Navigation**: `navigate('capacity', { ct: 'me' });` (Handles hash updates and subscription cleanup).
-   **Hash Format**: `#p=<uuid>&s=<section>&t=<tab>`
-   **RPN Formula**: `RPN = SEV × OCC × DET`. High threshold is ≥ 100.

---

## 7. Bug Squashing: "X is not a function"

1.  Find where the function is defined: `grep -rn "function X\|const X" portals/ utils/ core/`.
2.  Read the defining file for syntax errors (duplicate `const`, unclosed brackets, missing commas). A syntax error prevents the entire file from loading.
3.  Check the script load order in `index.html` to ensure the defining file loads before the file that calls the function.
4.  Fix the syntax error.

---

## 8. New Feature Checklist

-   [ ] Add `<script>` / `<link>` tag to `index.html` in the correct dependency order.
-   [ ] Add new global state variables to `core/js/state.js` with default values.
-   [ ] Add a new case to the `render()` switchboard in `utils/js/navigation.js`.
-   [ ] Implement real-time subscriptions with proper cleanup via `navigate()`.
-   [ ] Write mobile-first CSS with required breakpoints.
-   [ ] Write tests in the `tests/` directory.
-   [ ] Run `npm run check:all && npm test` to verify changes.

---

## 9. Code Style & Formatting

-   **JavaScript**:
    -   Single quotes: `true`
    -   Semicolons: `false`
    -   Tab width: `2`
    -   Print width: `100`
    -   No trailing commas.
-   **Linting (ESLint)**:
    -   Enforces `eqeqeq` (always use `===` or `!==`).
    -   Warns on `no-unused-vars`, `no-undef`, `no-var`, and recommends `prefer-const`.

---

## 10. Testing Strategy

-   **Framework**: Jest with `jsdom`.
-   **Setup**: `jest.setup.js` handles global mocks for the Supabase client, real-time subscriptions, global state, and the initial DOM structure from `index.html`.
-   **Philosophy**: Test behavior, not implementation. Mock all external dependencies. Keep tests fast and isolated.
-   **Priorities**:
    -   **High**: `navigation.js`, data layers (CRUD), authentication, complex business logic (RPN).
    -   **Medium**: Render functions, user interactions (clicks, forms).
-   **Async Testing**: Use `jest.useFakeTimers()` and `jest.advanceTimersByTime()` to test debounced functions (like `save()`) and other time-sensitive logic without waiting.
---

## 11. User Directives

-   You should pre-plan and create checklists for all work undertaken in this codebase.

---

## 12. Changelog Rules

**At the start of every session or instruction:** Read `CHANGELOG.md` to understand what has recently changed and why. This gives you context before touching any code.

**After every change you implement:** Add a 2-line entry at the top of `CHANGELOG.md` (below the first `---` line) using this exact format:

```
## YYYY-MM-DD | Short title of the change | Reason / what problem it solves

```

-   Use today's date.
-   The title should be short (under 80 characters).
-   The reason should explain *why*, not just *what*.
-   One entry per logical change — not one per file edited.
-   Add the entry before committing so it is included in the same commit.

---

## 13. OpenWolf source of truth

-   Repo-level OpenWolf instructions live in `.wolf/OPENWOLF.md` and `.claude/rules/openwolf.md`.
-   Gemini guidance in this file must stay aligned with those files so Gemini does not miss required OpenWolf steps.
