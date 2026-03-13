# CLAUDE.md — Tidyco APQP Quality Tool

## A Note for AI Assistants

**The primary user of this project has zero coding experience.** When providing explanations, generating code, or describing changes, please use the simplest possible terms (layman's terms). Avoid jargon and assume no prior knowledge of programming concepts, git, or web development. Your goal is to make the process as understandable and accessible as possible for a non-technical user.

### Task Tracking

For any multi-step request (e.g. "add a new feature", "fix this bug", "update these files"), **always create a Todo list** at the start of the task and keep it updated throughout. This helps the user follow along and see what has been done and what is still to come.

- Break the work into small, clear steps
- Mark each step as in-progress before starting it
- Mark each step as completed immediately after finishing it
- Never batch-complete multiple steps — tick them off one at a time
- If a new subtask is discovered mid-way, add it to the list before starting it

### Agent Work Assessment

When planning a Todo list, **assess each task for suitability as agent work** before starting:

- **Good candidates for an agent:** read-only research tasks (e.g. "find all usages of X", "explore how Y is structured", "check if Z exists"), tasks that require searching many files, or background investigations that don't depend on previous steps
- **Keep in the main flow:** tasks that write or edit files, tasks that depend on earlier results, anything requiring user confirmation, and sequential steps where order matters
- Delegate suitable tasks to the `Explore` subagent to avoid cluttering the main conversation with long searches
- Run multiple independent agent tasks in parallel where possible to save time

---

## Project Overview

Tidyco APQP is a **vanilla JavaScript Single Page Application (SPA)** for managing Advanced Product Quality Planning (APQP) and Manufacturing Engineering capacity. It uses **no build pipeline** — all files are served as static HTML/JS/CSS directly to the browser.

**Backend:** [Supabase](https://supabase.com) (PostgreSQL + Auth + RLS)
**Charts:** Chart.js v4.4.0 (CDN)
**Fonts:** IBM Plex Sans & IBM Plex Mono (Google Fonts)

---

## Core Design Principle: Collaborative Operations Tool

**This is a fully collaborative multi-user operations portal.** All users work simultaneously on shared data with real-time visibility.

### Design Requirements for All Features

When designing or modifying any feature, you MUST account for:

1. **Real-Time Sync**
   - All data changes must propagate to all connected users immediately
   - Use Supabase real-time subscriptions (`createRealtimeSubscription()`)
   - Handle concurrent edits gracefully (last-write-wins or optimistic UI updates)

2. **Shared State**
   - No user-specific data isolation (except audit fields like `user_id`, `created_at`)
   - All authenticated users see the same data
   - RLS enforces authentication only, not row-level user filtering

3. **Optimistic UI**
   - Update UI immediately on user action
   - Sync to Supabase in background (800ms debounce)
   - Handle sync errors with user feedback

4. **Audit Trail**
   - Track `user_id`, `created_at`, `updated_at`, `created_by_name` on all records
   - Display attribution in UI (e.g., "Responded by John, 12 Mar")
   - Enable accountability without restricting access

5. **Conflict Resolution**
   - Design for concurrent editing scenarios
   - Use timestamps for merge conflicts
   - Provide clear visual feedback when data updates from other users

6. **Presence Indicators** (where applicable)
   - Show who is viewing/editing the same record
   - Locking is NOT used — embrace collaborative editing

### Example Pattern for New Features

```javascript
// 1. Load data with real-time subscription
async function myFeatureInit() {
  await myFeatureLoad(); // Initial load from Supabase
  
  // Subscribe to changes for real-time collaboration
  createRealtimeSubscription('my_table', 'my_table_channel', {
    onInsert: (newData) => { /* update local state, re-render */ },
    onUpdate: (updated) => { /* update local state, re-render */ },
    onDelete: (deleted) => { /* update local state, re-render */ }
  });
}

// 2. Optimistic update pattern
async function myFeatureUpdate(id, updates) {
  const oldData = myState.find(x => x.id === id);
  
  // Update UI immediately (optimistic)
  Object.assign(oldData, updates);
  render();
  
  // Sync to Supabase
  try {
    await supa.from('my_table').update({
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: currentUser.email
    }).eq('id', id);
  } catch (err) {
    // Revert on error
    Object.assign(oldData, oldData);
    alert('Sync failed: ' + err.message);
  }
}
```

---

## Repository Structure

```
/
├── index.html                      # App entry point; defines all script/CSS load order and modal templates
├── core/
│   ├── css/
│   │   ├── main.css                # Global CSS variables, typography, shell layout
│   │   └── components.css         # Shared UI: modals, buttons, cards, tables
│   └── js/
│       ├── app.js                  # Initialization and session startup (LOAD LAST)
│       ├── auth.js                 # Supabase client instantiation and login/logout
│       ├── db.js                   # Data persistence, localStorage sync, Supabase sync, migration
│       └── state.js               # Global state object, constants (GATE_DEFS, FAMILIES, BOM_TYPES)
├── utils/
│   ├── js/
│   │   ├── helpers.js             # Modal helpers, HTML escaping, UI utilities
│   │   └── navigation.js          # Hash-based routing, render() switchboard
│   └── css/
├── portals/
│   ├── hub/                        # Central operations dashboard
│   ├── capacity/                   # ME load capacity + production capacity planning
│   ├── product-development/
│   │   ├── npi/                    # Core APQP modules (PFMEA, gates, BOM, etc.)
│   │   └── product-management/    # Product registry with overhaul history
│   ├── production/                 # Production scheduling and Gantt planning
│   ├── productmgmt/               # Central product master
│   └── bugs/                       # Bug reports portal with real-time subscriptions
└── *.md                            # Architecture and feature documentation
```

---

## Script Load Order (Critical)

Scripts are loaded via `<script>` tags in `index.html`. **Order matters** — do not rearrange.

```
CSS:  main.css → components.css → [feature CSS files]

JS:
  Layer 1 (Core):      state.js → auth.js → db.js
  Layer 2 (Utils):     helpers.js → navigation.js → realtime.js
  Layer 3 (Portals):   hub.js →
                       products-data.js → trends-chart.js →
                       capacity.js → me-data-relational.js → me-data.js → me-utils.js →
                       me-calculations.js → me-components.js → me-team.js → me-tasks.js →
                       me-products.js → me-product-taskload.js → me-holidays.js →
                       me-chart.js → me-heatmap.js → me-dashboard.js → me-capacity.js →
                       me-estimation-page.js →
                       prod-capacity-data.js → work-areas-data.js → prod-capacity-dashboard.js →
                       prod-capacity-workarea.js → prod-capacity-settings.js →
                       prod-capacity-detail.js → prod-capacity.js →
                       production.js → scheduling.js → planning.js →
                       families-data.js → family-templates-data.js → products.js →
                       product-development.js → product-management.js → productmgmt.js →
                       npi-constants.js → npi.js → rpn-chart.js → dashboard.js →
                       gates.js → pfmea.js → apqp.js → bom.js → timing.js → trackers.js →
                       bugs-data.js → bugs.js
  Layer 4 (Last):      app.js
```

When adding a new JS file, add its `<script>` tag to `index.html` in the correct position relative to its dependencies.

---

## State Management

All application state lives in **global variables** defined in `core/js/state.js`.

| Variable | Type | Purpose |
|---|---|---|
| `db` | Object | All project data (`{ programmes[], families[], ... }`) |
| `progId` | String (UUID) | Currently active project |
| `currentSection` | String | Active portal (`hub`, `capacity`, `product-development`, `production`) |
| `apqpTab` | String | Active APQP sub-tab |
| `capacityTab` | String | Active capacity sub-tab |
| `productionTab` | String | Active production sub-tab |
| `productDevelopmentTab` | String | Active product development sub-tab |
| `bomSubTab` | String | Active BOM category (`parts`, `tools`, `equip`, `mat`, `cons`, `kits`) |

**Accessor:** `prog()` returns the active programme object: `db.programmes.find(p => p.id === progId)`.

### Key Constants (in `state.js`)

- `GATE_DEFS` — 6 APQP gate definitions (0–5), each with checklist items and required signatories
- `FAMILIES` — Default product family definitions (HVAC, Rotating Machines, Pneumatics, Other)
- `BOM_TYPES` — BOM category definitions (parts, tools, equip, mat, cons, kits)

---

## Routing / Navigation

Navigation uses **URL hash** parameters. The main `render()` function in `utils/js/navigation.js` dispatches to feature renderers based on parsed hash state.

**Hash format:** `#p=<progId>&s=<section>&t=<tab>&...`

Example hashes:
- `#s=hub` — Hub dashboard
- `#s=capacity&t=dashboard` — Capacity portal, dashboard tab
- `#p=<uuid>&s=product-development&t=npi&nt=pfmea` — PFMEA tab for a project

When navigating programmatically, use helper functions (e.g., `goTo(section, tab)`) or update the hash directly — do not call render functions directly.

---

## Data Persistence

### Architecture

**Supabase is the sole persistence layer.** All data is stored in relational Supabase tables. There is no secondary storage target.

### Save Flow

- Data changes update in-memory state immediately
- Debounced Supabase sync fires 800ms after last change (900ms for ME capacity)
- On load: data is fetched from Supabase; if unavailable the app starts empty

---

## Database Tables (Supabase)

RLS enforces authentication — users must be logged in to access any data. All authenticated users share access to all data. The `user_id` column on rows is metadata (who created it) and is **not** used as a client-side query filter.

| Table | Purpose |
|---|---|
| `programmes` | Main project container (JSON blob for project data) |
| `families` | User-defined product families |
| `family_pfmea_templates` | Reusable PFMEA templates per family |
| `me_teams` | ME team member records |
| `me_tasks` | Engineering tasks and projects |
| `me_task_subtasks` | PERT estimation subtasks |
| `me_task_pert_history` | 3-point estimation history |
| `me_products` | Products for capacity planning |
| `production_batches` | Production scheduling batches |
| `products` | Overhaul product registry |
| `product_overhaul_history` | Historical overhaul records |
| `bug_reports` | Bug and issue reports with real-time subscriptions |
| `me_capacity` | Legacy JSON blob (no longer written to; may be removed) |

---

## Core Data Structures

### Programme (Project)
```javascript
{
  id,           // UUID
  name,         // Project name
  customer,     // Customer name
  unit,         // Unit/model identifier
  family,       // Product family ID
  lead,         // Lead engineer
  pm,           // Project manager
  date,         // Start date
  ctq[],        // Critical-to-quality characteristics
  pfd[],        // Process Flow Diagram steps
  pfmea[],      // PFMEA entries (nested structure — see below)
  cp[],         // Control Plan entries
  bom{},        // Bill of Materials (categorized)
  gates[],      // Gate review data (0–5)
  actions[],    // Action tracker items
  risks[],      // Risk tracker items
  timing[],     // Timing plan items
  gantt[],      // Gantt entries
  subAssemblies[]
}
```

### PFMEA (Nested Structure)
```javascript
// Mode level
{ id: 'f_xxxxx', _type: 'mode', step, mode,
  effects: [
    { id: 'e_xxxxx', effect, sev,
      causes: [
        { id: 'c_xxxxx', cause, occ, det, prevent, detect, action,
          history: [{ occ, det, date, note }]
        }
      ]
    }
  ]
}
```

### BOM
```javascript
{
  parts:  [{ id, num, desc, qty, unit, supplier, notes }],
  tools:  [...],
  equip:  [...],
  mat:    [...],
  cons:   [...],
  kits:   [{ id, name, items: [{ type, itemId }] }]
}
```

### Gate
```javascript
{ gateNum, checks: [{ id, text, done, notes }], sigs: [{ role, name, date, signed }] }
```

---

## RPN Calculation

```
RPN = SEV (1–10) × OCC (1–10) × DET (1–10)
Forecast RPN = SEV × New OCC × New DET
High RPN threshold: ≥ 100 (renders amber/red badges)
```

---

## Key Conventions

### Naming
| Category | Convention | Examples |
|---|---|---|
| Functions | camelCase, descriptive | `renderDashboard()`, `meDataAddTeam()`, `saveEditProject()` |
| JS variables | camelCase | `progId`, `currentSection`, `apqpTab` |
| Database columns | snake_case | `user_id`, `hours_per_week`, `created_at` |
| CSS classes | kebab-case | `.proj-home`, `.npi-tab-active`, `.modal-bg` |
| Element IDs | descriptive camelCase | `modalNewProj`, `loginEmail`, `insertNum` |
| UUID prefixes | type prefix | `f_` (failure mode), `e_` (effect), `c_` (cause), `r_` (risk), `a_` (action) |
| Feature function prefix | portal/area name | `me*()` (capacity), `prod*()` (production), `render*()` (display) |

### File Organization
- One JS file per feature/sub-feature
- CSS file mirrors JS structure (parallel naming)
- No module bundling — use global scope for inter-file communication

### Code Style
- Section headers with `// ═══` or `// ──────` separator lines
- Dependency comments at file top
- No enforced semicolons (mixed — follow surrounding file style)
- No TypeScript — plain ES6+ JavaScript

### CSS Strategy
- CSS custom properties (`--var`) defined in `:root` in `main.css`
- Responsive breakpoints: `480px` (mobile), `768px` (tablet), `1200px` (desktop)
- Mobile-first layouts: 1-col → 2-col → 3-col
- Sticky headers via `.sticky-table-wrap` wrapper class
- No CSS-in-JS

### Modal Pattern
```javascript
showModal('modalId');   // Open
closeModal('modalId');  // Close
// Modal templates defined in index.html
// Data passed via global state variables (e.g., ctqPickTarget, bomPickSelected)
```

### ID Generation
Use the existing short UUID pattern (5-char suffix with type prefix):
```javascript
'f_' + Math.random().toString(36).substr(2, 5)  // failure mode
'e_' + Math.random().toString(36).substr(2, 5)  // effect
```

---

## Authentication

- Supabase email/password auth
- Credentials in `core/js/auth.js` (hardcoded anon key — secured via RLS)
- Login flow: `doLogin()` → `supa.auth.signInWithPassword()` → `launchApp()` → `db.js::loadRemote()`
- Logout: `doLogout()` clears state and returns to login screen

---

## Adding New Features

### New Portal
1. Create `portals/<name>/` directory with `<name>.js` and `<name>.css`
2. Add `<link>` in `index.html` CSS section
3. Add `<script>` in `index.html` JS section (before `app.js`)
4. Add case to `render()` switch in `utils/js/navigation.js`
5. Add navigation card to `portals/hub/hub.js`
6. Add state variable to `core/js/state.js` if needed

### New APQP Sub-Tab
1. Add tab definition to `portals/product-development/product-development.js`
2. Create feature JS module in `portals/product-development/npi/`
3. Add corresponding CSS file
4. Register both in `index.html` load order
5. Add case to NPI tab render dispatcher

### New Database Table
1. Create table in Supabase with a `user_id` column (for record metadata — who created it)
2. Add RLS policy requiring authentication: `CREATE POLICY "authenticated access" ON table FOR ALL USING (auth.role() = 'authenticated')`
3. Add load/save functions in the appropriate data module — **do not filter queries by `user_id`**; RLS handles access control
4. Call load function from `db.js::loadRemote()` or feature init

---

## Plans & Documentation

**Any plans, architecture documents, guides, or analysis generated by Claude or Qwen must be saved as `.md` files in the `plans/` folder** — not at the repo root or elsewhere.

| File | Contents |
|---|---|
| `README.md` | Project overview, responsive design, portal structure, navigation API |
| `TESTING_STRATEGY.md` | Jest testing framework, patterns, coverage goals, and examples |
| `plans/NPI_IMPROVEMENT_PLAN.md` | Staged refactor checklist for NPI portal (namespacing, data layer, components) |
| `plans/FAMILY_TEMPLATES_ARCHITECTURE.md` | Family PFMEA template system design (DB schema, data flow, security) |
| `plans/FAMILY_TEMPLATES_GUIDE.md` | User guide for creating and applying family PFMEA templates |
| `plans/ME_DATABASE_ANALYSIS.md` | Deep-dive into ME Capacity relational DB schema (6 tables, field mappings, known issues) |
| `plans/BUG_REPORTS_SCHEMA.md` | Bug reports table schema, RLS policies, and code examples |
| `plans/REALTIME_SYNC_GUIDE.md` | How to add real-time Supabase subscriptions to any portal |

---

## Recent Additions

### Bugs Portal
- Real-time bug reporting system in `portals/bugs/`
- Uses Supabase real-time subscriptions via `bugDataManager` (init, add, update, delete)
- Table: `bug_reports` with columns for title, description, status, severity
- Loads on portal navigation via `bugDataManager.init()`

### Production Capacity Planning
- Extended capacity module with production-focused planning
- Modules: `prod-capacity-data.js`, `work-areas-data.js`, production capacity dashboard/settings/detail
- Complements ME capacity with production-side planning tools

### NPI Constants Module
- Centralized constants for NPI/APQP workflows (`npi-constants.js`)
- Loaded before main NPI module to support shared definitions

### Real-time Subscriptions
- `utils/js/realtime.js` provides utilities for real-time data sync
- Used by bugs portal and other features requiring live updates
- Load order: after `navigation.js`, before portal modules

---

## Development Notes

### Testing

**Jest** with **jsdom** environment for unit and integration testing.

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/navigation.test.js
```

**Test Files:** `tests/*.test.js`
- `navigation.test.js` — Hash routing and render switchboard (38 tests)
- `production.test.js` — Production portal functionality
- `bugs.test.js` — Bug reports data module
- `auth.test.js` — Authentication flow
- `db.test.js` — Data persistence
- `helpers.test.js` — Utility functions

**See `TESTING_STRATEGY.md` for comprehensive testing guidelines.**

### No Build Step
- Edit files and refresh the browser — changes are live immediately
- No compilation, transpilation, or bundling required

### Supabase Credentials
- Anon key is public (safe to expose — security enforced via RLS)
- All users share the same Supabase project and see the same data; RLS enforces authentication only
- Requires HTTPS for Supabase auth to work (use localhost or https-enabled server)

### Performance
- All data loaded once at session start — avoid additional queries during normal operation
- 800ms debounce on saves prevents excessive Supabase writes
- Chart.js charts use `responsive: true` — ensure container has explicit height or chart may not render

### Common Pitfalls

- **Missing `prog()`:** Always check `if (!prog()) return;` before accessing project data in render functions
- **HTML injection:** Use `esc()` (from `helpers.js`) when interpolating user data into HTML strings
- **Load order errors:** If a function is undefined at runtime, check that its file is loaded before the caller in `index.html`
- **RLS errors:** New Supabase tables need an RLS policy — inserts/selects silently fail without one. Policy must allow authenticated users; do not filter by `user_id` in queries
- **Portal initialization:** Portals with data subscriptions (e.g., bugs) must call their init functions in navigation handlers to load real-time data
- **Date fields:** Use empty string for HTML date inputs (not default date), send null to Supabase for empty dates
- **State initialization:** Always check portal state objects exist before accessing properties (e.g., `if (!prodState || !Array.isArray(prodState.batches)) return []`)
- **Bank holidays:** Use `getBankHolidaysForYear(year)` for correct UK bank holiday dates (movable holidays calculated dynamically)
- **Real-time sync filters:** NEVER filter subscriptions by `user_id` for collaborative data — all users must see all changes immediately
- **Silent file parse failures:** A `SyntaxError` in any JS file (e.g. duplicate `const` in the same scope) silently prevents the entire file from loading — all `window.*` functions defined in that file will be `undefined` at runtime, even if the broken code appears after the function definition

---

## Bug Squashing Process

When a runtime error like `X is not a function` or `X is undefined` occurs, follow this diagnostic routine:

1. **Read the error** — note the file and line number where the error occurs (e.g. `me-calculations.js:44`)
2. **Find the definition** — use `Grep` to search for where the missing function/variable is defined across all files
3. **Check load order** — search `index.html` for the relevant `<script>` tags; confirm the defining file loads before the caller. If it doesn't, reorder the tags
4. **If load order is correct, read the defining file** — the file may be failing to parse entirely due to a `SyntaxError` (duplicate `const`/`let`, unclosed bracket, etc.), which silently prevents any of its `window.*` assignments from running
5. **Look for duplicate variable names** — a common JS pitfall in large functions: two `const foo` declarations in the same scope cause a `SyntaxError` that kills the whole file
6. **Fix the syntax error** — rename the duplicate, then verify the function is now accessible

### Key Insight: No Build Step = No Compile-Time Errors
Because this project has no bundler or transpiler, syntax errors in JS files are only caught at runtime in the browser. A broken file fails silently — nothing in the console will say "me-utils.js failed to parse" before the downstream `is not a function` error appears. Always suspect a parse failure in the *defining* file, not just a missing import or load-order issue.
