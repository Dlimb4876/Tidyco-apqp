# Tidyco APQP — Copilot Instructions

## User Context
**The primary user has zero coding experience.** Use plain language, no jargon. For any multi-step task always create a Todo list and tick off each step individually — never batch-complete.

## Acronyms
ME = Manufacturing Engineering · PM = Project Management · APQP = Advanced Product Quality Planning · RLS = Row Level Security · CTQ = Critical to Quality · PFMEA = Process Failure Mode & Effects Analysis · BOM = Bill of Materials · SPA = Single Page Application

## What This Repo Does
Tidyco APQP is a **vanilla JavaScript Single Page Application (SPA)** for managing APQP (Advanced Product Quality Planning) and Manufacturing Engineering workflows. It has no build pipeline — all files are static HTML/JS/CSS served directly in a browser. Backend is **Supabase** (PostgreSQL + Auth + RLS).

## Tech Stack
- **Language:** Plain ES6+ JavaScript (no TypeScript, no bundler)
- **Runtime:** Browser (no Node.js runtime in production)
- **Backend:** Supabase v2 (CDN), Chart.js v4.4.0 (CDN), IBM Plex Sans/Mono (Google Fonts)
- **Tests:** Jest 30 + jest-environment-jsdom
- **Lint:** ESLint 9 (NPI files only: `portals/product-development/npi/**/*.js`)
- **Format:** Prettier (`singleQuote: true`, `semi: false`, `tabWidth: 2`, `printWidth: 100`)

## Commands — Always Run in This Order

```bash
npm install          # Always run first after cloning; installs jest + eslint devDeps
npm test             # Run all tests (requires npm install first; jest is a local devDep)
npm run check:all    # All quality checks — run before every commit
npx eslint portals/product-development/npi/**/*.js   # Lint NPI files (warnings only; 0 errors expected)
npx prettier --write portals/product-development/npi/**/*.js  # Auto-format NPI JS
```

**Validated results:** `npm test` → 18 suites, 179 tests, all pass (~2.5 s). `npm test` will fail with "jest: not found" if `npm install` has not been run first. ESLint produces only warnings, never errors. There is no build step and no CI pipeline (no `.github/workflows/`).

## Repository Layout

```
index.html              # App entry point — defines ALL script/CSS load order (source of truth)
core/js/
  state.js              # All global state variables and constants (GATE_DEFS, FAMILIES, BOM_TYPES)
  auth.js               # Supabase client instantiation, login/logout
  db.js                 # Data persistence, Supabase sync, migration
  app.js                # App initialization — MUST load last
core/css/
  main.css              # CSS variables, typography, shell layout, responsive gutters
  components.css        # Shared UI: modals, buttons, cards, tables
utils/js/
  helpers.js            # esc(), showModal(), closeModal(), emptyState()
  navigation.js         # Hash routing, render() switchboard, navigate()
  realtime.js           # createRealtimeSubscription(), removeRealtimeSubscription()
portals/
  hub/                  # Central operations dashboard
  capacity/             # ME + Production + PM capacity planning
  product-development/
    npi/                # Core APQP: PFMEA, gates, BOM, CTQ, timing, trackers
    product-management/ # Product registry with overhaul history
  production/           # Production scheduling + Gantt
  operations/           # Operations dashboard, forecast, metrics
  feedback/             # Bug/feedback reports with real-time subscriptions
tests/                  # Jest test files (*.test.js) — one per feature area
jest.config.js          # testEnvironment: jsdom; setupFiles: ./jest.setup.js
jest.setup.js           # Global mocks: supa, createRealtimeSubscription, currentUser, DOM
eslint.config.js        # ESLint config (NPI files only; flat config format)
.prettierrc             # Prettier config
```

## Critical Rules

1. **Script load order in `index.html` is the source of truth.** When adding a JS file, add its `<script>` tag in the correct position. Dependencies must load before dependents. Layer order: `state.js → auth.js → db.js → helpers.js → navigation.js → realtime.js → [portals] → app.js`.

2. **No duplicate `const` in same scope.** A SyntaxError silently prevents the entire file from loading — all functions in that file become `undefined` at runtime with no console warning about the file itself.

3. **All global state lives in `core/js/state.js`.** New state variables must be added there with a default value. Use `let` for mutable state.

4. **Capacity parity rule:** Changes to ME Capacity (`portals/capacity/js/`) must be mirrored in PM Capacity (`portals/capacity/project-management/js/`) unless explicitly noted otherwise.

5. **RLS is auth-only.** All authenticated users see all data. Never filter Supabase queries by `user_id` on the client. New tables need an RLS policy: `CREATE POLICY "auth" ON table FOR ALL USING (auth.role() = 'authenticated')`.

6. **Real-time subscriptions need cleanup.** Always store the reference and call `removeRealtimeSubscription(ref)` before navigating away, or use `navigate()` which handles cleanup automatically.

7. **`esc()` for all user data in HTML strings.** Use `esc(value)` (from `helpers.js`) whenever interpolating user-supplied data into HTML to prevent XSS.

8. **Saves debounce at 800–900 ms.** Data is not persisted to Supabase immediately after a UI edit.

9. **Planning/architecture docs go in `plans/` folder**, never the repo root.

10. **Mobile-first CSS.** New CSS must include `@media (max-width: 767px)` and `@media (min-width: 768px)` breakpoints.

## Key Patterns

```javascript
// Short prefixed ID generation (5-char suffix; NOT a full UUID — used for in-array items)
const id = 'f_' + Math.random().toString(36).substr(2, 5); // f_=mode, e_=effect, c_=cause, r_=risk, a_=action

// Active programme accessor
prog()  // returns db.programmes.find(p => p.id === progId)

// Modal
showModal('modalId'); closeModal('modalId');

// Navigation (hash-based, handles subscription cleanup)
navigate('capacity', { ct: 'me' });
// Hash format: #p=<uuid>&s=<section>&t=<tab>

// RPN formula
// RPN = SEV × OCC × DET  (each 1–10; high threshold ≥ 100)
// Forecast RPN = SEV × New OCC × New DET
```

## Bug Squashing: "X is not a function"
1. Find defining file: `grep -rn "function X\|const X" portals/ utils/ core/`
2. Read that file — look for duplicate `const`, unclosed brackets, missing commas (SyntaxError = whole file fails silently)
3. Check `index.html` load order — defining file must load before caller
4. Fix the syntax error; functions reappear once file parses cleanly

Trust these instructions. Only search the codebase if information here is incomplete or appears incorrect.
