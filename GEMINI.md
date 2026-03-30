# GEMINI.md — Tidyco APQP Project Guide

This document provides a comprehensive overview of the Tidyco APQP project, its architecture, development conventions, and mandatory workflows. It serves as the primary instructional context for Gemini CLI.

---

## 1. Project Overview

**Tidyco APQP Quality Tool** is a Manufacturing Engineering (ME) tool for rail overhaul. It manages APQP Gates 0–5 and broader operational workflows (Capacity, Production, NPI, MCS, etc.).

- **Architecture**: Vanilla JavaScript Single Page Application (SPA).
- **Build System**: **None**. All files are static HTML/JS/CSS served directly.
- **Backend**: Supabase (PostgreSQL + Auth + Real-time).
- **Frontend**: ES6+ JS, Chart.js (v4.4.0), IBM Plex fonts.
- **Design Philosophy**: Mobile-first, responsive (480px to 1920px+).

---

## 2. Technical Stack & Key Commands

- **Language**: Plain JavaScript (No TypeScript).
- **Persistence**: Supabase v2 (loaded via CDN).
- **Testing**: Jest 30 + `jest-environment-jsdom`.
- **Linting/Formatting**: ESLint 9 & Prettier (applied mainly to NPI portal).

### Core Commands (Run in order)

1.  `npm install`: Install dev dependencies (Jest, ESLint).
2.  `npm test`: Run all Jest tests (expect ~600+ passing tests).
3.  `npm run check:all`: **Mandatory before every commit.** Runs all quality audits:
    - `check:syntax`: Validates JS syntax (parser-backed).
    - `check:imports`: Verifies ESM import/export wiring.
    - `check:esm-coverage`: Tracks remaining non-ESM files.
    - `check:subscriptions`: Audits real-time subscription cleanup.
    - `check:state`: Tracks global state variable ownership.
    - `check:rls`: Audits RLS policies.
    - `check:mobile`: Verifies CSS breakpoints.
    - `check:modals`: Audits modal state handling.
    - `check:coverage`: Generates test coverage report.
4.  `npm run lint:npi` / `npm run format:npi`: Lint and format NPI portal files.

---

## 3. Architecture & Critical Rules

### 3.1 Source of Truth: `index.html`
`index.html` is the bootstrap source of truth. Keep a single module entrypoint:
`<script type="module" src="core/js/main.js"></script>`
Cross-file dependencies must be wired through named ESM imports/exports (not `window.*` bridges).

### 3.2 Global State (`core/js/state.js`)
All global state variables must be defined here with default values. Use `let` for mutable state. Never define new globals in feature files.

### 3.3 No Duplicate `const`
In this vanilla JS environment, a duplicate `const` in the global scope causes a **silent runtime failure** of the entire file. Always verify syntax before committing.

### 3.4 Security & XSS
- Always use the `esc(value)` helper from `helpers.js` when interpolating user data into HTML strings.
- RLS (Row Level Security) is auth-only: Queries should not filter by `user_id` on the client; the backend handles visibility.

### 3.5 Navigation & Real-time
- Use `navigate(section, options)` for all routing.
- `navigate()` automatically handles cleanup for real-time subscriptions.
- Store subscription references and ensure they are cleared before navigating away.

### 3.6 Guide Content
- When adding or changing a feature on any content page, update the matching entry in `GUIDE_CONTENT` inside `utils/js/guide.js` to reflect the change.

---

## 4. OpenWolf Protocol

This repository follows the **OpenWolf** protocol. You MUST adhere to these steps:

1.  **Anatomy**: Read `.wolf/anatomy.md` before reading project files.
2.  **Cerebrum**: Read `.wolf/cerebrum.md` (Do-Not-Repeat list) before generating code.
3.  **Buglog**: Read `.wolf/buglog.json` before fixing any reported problem.
4.  **Memory**: Append a one-line entry to `.wolf/memory.md` after significant work.
5.  **DesignQC**: Use `openwolf designqc` (if available) when asked to improve UI design.

---

## 5. Development Conventions

### 5.1 CSS & Responsiveness
- **Mobile-First**: Design for 480px first, then scale up.
- **Breakpoints**: Every new feature CSS MUST include:
  - `@media (max-width: 767px)` (Mobile/Tablet Stack)
  - `@media (min-width: 768px)` (Desktop Layout)
- **Tables**: Use horizontal scrolling for data-heavy tables on mobile.

### 5.2 ID Generation
Use the standard prefixed short ID pattern:
`const id = 'f_' + Math.random().toString(36).substr(2, 5);`
- `f_`: Mode, `e_`: Effect, `c_`: Cause, `r_`: Risk, `a_`: Action.

### 5.3 Save Debouncing
Data is persisted to Supabase via a **debounced save cycle (800-900ms)**. Ensure UX handles this delay (e.g., sync badges).

---

## 6. Testing Strategy

- **Location**: All tests reside in `tests/*.test.js`.
- **Environment**: Jest with `jsdom` and global mocks (see `jest.setup.js`).
- **Patterns**:
  - **ESM-First**: Use `jest.unstable_mockModule` and dynamic `import()` for all module tests.
  - Test behavior, not internals.
  - Use `jest.useFakeTimers()` for debounced save tests (800ms).
  - Mock Supabase client (`supa`) and global `appState` object.
- **State**: Prefer mocking `appState` in `core/js/state.js` over individual globals.

---

## 7. Changelog Management

**Mandatory**: After every logical change, add a 2-line entry to the top of `CHANGELOG.md`:
`## YYYY-MM-DD | Short Title | Reason / Problem solved`

---

## 8. Directory Structure (Key Areas)

- `/core`: Global engine (state, auth, db, app).
- `/portals`: Feature-specific modules (Hub, Capacity, NPI, etc.).
- `/utils`: Shared helpers and navigation logic.
- `/supabase`: SQL migrations and RLS policies.
- `/plans`: Architecture and sprint planning documents.
- `/scripts`: Quality-check and validation scripts.

---

*This file is managed by Gemini CLI. Update it whenever core architectural decisions or workflows change.*
