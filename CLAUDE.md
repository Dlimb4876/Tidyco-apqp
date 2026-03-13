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

---

## About This Project

This project uses **vanilla JavaScript with no build pipeline**. All work is done in the primary Claude conversation using bash, file tools, and code editing tools. There are no subagents or delegated workers.

When you encounter a task like "find all files that use X", use bash (grep, find, xargs) rather than delegating:

```bash
grep -r "functionName" --include="*.js" .
```

Batch file operations together to reduce tool calls (e.g., edit 3 related files in sequence rather than triggering 3 separate create_file calls).

---

## Project Overview

Tidyco APQP is a **vanilla JavaScript Single Page Application (SPA)** for managing Advanced Product Quality Planning (APQP) and Manufacturing Engineering capacity. It uses **no build pipeline** — all files are served as static HTML/JS/CSS directly to the browser.

**Backend:** [Supabase](https://supabase.com) (PostgreSQL + Auth + RLS)
**Charts:** Chart.js v4.4.0 (CDN)
**Fonts:** IBM Plex Sans & IBM Plex Mono (Google Fonts)

---

## Core Architecture

### Collaborative Operations Model

**This is a fully collaborative multi-user operations portal.** All users work simultaneously on shared data with real-time visibility.

#### RLS Design Philosophy (Important!)

The application uses **Supabase RLS for authentication gating only**, not for row-level authorization:

- ✅ All authenticated users see all data (by design)
- ✅ RLS prevents unauthenticated access
- ❌ RLS does NOT isolate data by user
- ❌ User filtering does NOT happen in the application

**Why this design?**
- Simpler RLS policies (one policy per table, no complex per-user logic)
- All team members see same data (collaborative operations model)
- No multi-tenancy complexity
- Trade-off: No per-user privacy isolation

**Consequence for feature design:**
When adding new features, assume all authenticated users will see the data. If you need per-user isolation later, RLS policies would need complete redesign. Do not build user-specific filters into features without explicit discussion.

### Design Requirements for All Features

When designing or modifying any feature, you MUST account for:

### Capacity Parity Rule

When changing the ME Capacity plan, make the equivalent change in the PM Capacity plan under `portals/capacity/project-management/` unless the request explicitly says not to.

- ✅ Treat ME Capacity and PM Capacity as paired features
- ✅ Mirror relevant UI, data, routing, and persistence changes across both plans
- ✅ Call out any intentional differences clearly in your explanation
- ❌ Do not update only ME Capacity and leave PM Capacity behind by accident

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

### Mobile-First Design Requirements

All new features must follow mobile-first responsive design:

- **Mobile-first layouts** — Design assumes 480px width first, scales up
- **Media queries** — All new CSS must include `@media (max-width: 767px)` and `@media (min-width: 768px)`
- **Responsive tables** — Tables scroll horizontally on mobile (no wrapping columns)
- **Responsive modals** — Max-width: 90vw on mobile, 400–600px on desktop
- **No fixed widths** — Use flexbox/grid with relative units
- **Test at breakpoints** — 375px (mobile), 768px (tablet), 1920px (desktop)

See README.md "Responsive Design" section for complete details.

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

## Common Mistakes (Prevent These!)

### 1. Syntax Errors Kill Entire Files

A single syntax error in a JS file prevents the whole file from loading. The error may not appear in the browser console—the file simply won't execute. Watch for:

- ❌ `const foo = 1; const foo = 2;` — duplicate variable name in same scope
- ❌ `{ foo: 1, bar: 2 }` — missing comma between object properties  
- ❌ Multiple `const x = ...` declarations in same function scope
- ❌ Unclosed bracket or parenthesis
- ✅ Use `let` for reassignable values, `const` for constants
- ✅ Check opening/closing brackets match: `{ } [ ] ( )`

**Diagnostic:** If you see "functionName is not a function" at runtime, **suspect a parse error in the *defining* file first**, not just a load order issue. Read the file where the function is defined and look for syntax errors.

### 2. RLS Returns Empty Data Silently

Supabase RLS errors don't show in the browser console. Your query just returns empty data without error message. Watch for:

- ❌ Querying a new table without an RLS policy → returns `{ data: [], error: null }` (looks successful!)
- ❌ Querying a table that exists in Supabase but you haven't defined an RLS policy for
- ✅ Check that every table has a policy allowing authenticated users: `CREATE POLICY "authenticated" ON table FOR ALL USING (auth.role() = 'authenticated')`
- ✅ Don't filter queries by `user_id` on the client side; RLS handles authentication, not authorization
- ✅ If a query returns empty when you expect data, check the Supabase table RLS policies first

### 3. Subscription Cleanup Leaks Memory

Forgetting to unsubscribe from real-time channels causes memory leaks and stale data across the app.

- ❌ `createRealtimeSubscription('table', ...)` in `init()` but no cleanup when feature closes
- ❌ Multiple subscriptions to same table without cleanup
- ✅ Always store subscription reference: `const subRef = createRealtimeSubscription(...)`
- ✅ Always cleanup before navigation: `removeRealtimeSubscription(subRef)` in navigation handlers
- ✅ Use navigation.js functions (`navigate()`) which handle cleanup automatically for known features

### 4. Modal State Pollution

Modals pass data via global variables. Forgetting to clear them causes bugs when reopening modals.

- ❌ `ctqPickTarget = row; showModal('...')` but never clear `ctqPickTarget` afterward
- ❌ Modal templates use global variables without checking they're initialized
- ✅ Clear the target variable in close handler: `ctqPickTarget = null`
- ✅ Initialize modal globals before use: `if (!ctqPickTarget) return;`

### 5. Debounce Timing (800ms / 900ms)

Saves don't sync to Supabase instantly. They debounce to avoid excessive writes.

- ❌ Assume data is persisted to Supabase immediately after user edit
- ❌ Write test code expecting instant Supabase updates
- ✅ Test that debounce actually delays the save (use browser DevTools Network tab to observe)
- ✅ If testing async behavior, use fake timers: `jest.useFakeTimers(); ... jest.runAllTimers();`
- ✅ Typical debounce: 800ms for capacity/production, 900ms for ME capacity

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

## State Management

All application state lives in **global variables** defined in `core/js/state.js`.

| Variable | Type | Purpose |
|----------|------|---------|
| `db` | Object | All project data (`{ programmes[], families[], ... }`) |
| `progId` | String (UUID) | Currently active project |
| `currentSection` | String | Active portal (`hub`, `capacity`, `product-development`, `production`, `bugreports`, `productmgmt`) |
| `apqpTab` | String | Active APQP sub-tab (`ctq`, `pfd`, `pfmea`, `cp`, `gates`, `bom`, `timing`, `trackers`) |
| `capacityTab` | String | Active capacity sub-tab (`root`, `me`, `overhaul`, `projects`) |
| `productionTab` | String | Active production sub-tab (`root`, `products`, `scheduling`, `by-product`, `by-unit`) |
| `productDevelopmentTab` | String | Active product development sub-tab (`root`, `npi`, `product-management`) |
| `bomSubTab` | String | Active BOM category (`parts`, `tools`, `equip`, `mat`, `cons`, `kits`) |
| `meStartOffset` | Number | Month offset for ME capacity chart (0 = current month) |
| `prodPlanMonthOffset` | Number | Month offset for production plan Gantt view (0 = current month) |

**Accessor:** `prog()` returns the active programme object: `db.programmes.find(p => p.id === progId)`.

**State Storage:** All variables are defined in `core/js/state.js`. When adding a new state variable, add it there with a default value. Do not create state variables in other files.

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
- `#s=capacity&ct=me` — Capacity portal, ME view
- `#p=<uuid>&s=product-development&t=npi&nt=pfmea` — PFMEA tab for a project

When navigating programmatically, use `navigate(section, options)` or update the hash directly — do not call render functions directly. Always use `navigate()` when you need subscription cleanup.

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

## Script Load Order (Critical)

Scripts are loaded via `<script>` tags in `index.html`. **Order matters** — do not rearrange.

⚠️ **Script load order is defined in index.html `<script>` tags. That is the source of truth.** The list below is informational only and may lag if scripts are reordered. When reordering scripts, update index.html first, then update this reference.

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

## Complete Feature Addition Checklist

### Step 1: Understand Requirements
- [ ] Read the Portal structure in README.md (understand the pattern for your feature type)
- [ ] Check this CLAUDE.md script load order (verify dependencies)
- [ ] Check if this needs real-time subscriptions (plan cleanup in navigation.js)
- [ ] Check if this needs responsive design (plan mobile-first layouts with media queries)

### Step 2: Create Files
- [ ] **New portal?** Create `portals/<name>/<name>.js` + `<name>.css`
- [ ] **New sub-tab?** Create in parent portal directory following naming convention
- [ ] **New data layer?** Create `<feature>-data.js` in portal directory
- [ ] **New database table?** Create in Supabase with `user_id` column + RLS policy

### Step 3: Register in index.html
- [ ] Add `<link>` for CSS in correct position (see CSS load order section)
- [ ] Add `<script>` for JS in correct position (dependencies must load before dependents)
- [ ] Run `npm test` to verify no load errors

### Step 4: Add Navigation
- [ ] Add case to `render()` switch in utils/js/navigation.js
- [ ] Add state variable to state.js if new section/tab (with default value)
- [ ] Add navigation card to parent portal hub (e.g., hub.js, product-development.js)
- [ ] Update hash example in README.md if new major section

### Step 5: Implement Mobile-First Responsive Design
- [ ] Add `@media (max-width: 767px)` for mobile layout (single column, optimized spacing)
- [ ] Add `@media (min-width: 768px)` for tablet layout (2 columns where applicable)
- [ ] Design is mobile-first: start with mobile, scale up
- [ ] Test at 375px (mobile), 768px (tablet), 1920px (desktop)
- [ ] Ensure horizontal scroll for data-heavy tables (don't wrap columns)
- [ ] Reference: README.md "Required Design Practices" section

### Step 6: Add Real-Time Sync (if applicable)
- [ ] Check CLAUDE.md "Example Pattern for New Features" section
- [ ] Initialize subscription in feature `init()` function
- [ ] Store subscription reference in global variable: `const subRef = createRealtimeSubscription(...)`
- [ ] Add cleanup in navigation.js before leaving section: `removeRealtimeSubscription(subRef)`
- [ ] Alternative: Use `navigate()` function which handles cleanup automatically for known features
- [ ] Test concurrent edits (two users changing same record)

### Step 7: Write Tests
- [ ] Create `tests/<feature>.test.js` following TESTING_STRATEGY.md patterns
- [ ] Mock Supabase, DOM, subscriptions, and globals
- [ ] Test happy path (normal flow) + error cases (Supabase failures)
- [ ] Run `npm test` locally before committing
- [ ] See TESTING_STRATEGY.md "Module-Specific Testing Guides" for feature-specific patterns

### Step 8: Update Documentation
- [ ] Add entry to README.md Portal table (if new portal/major section)
- [ ] Update load order in CLAUDE.md AND index.html (if you added new files)
- [ ] Add to plans/ folder if architectural changes or complex logic
- [ ] Update state variables reference (CLAUDE.md) if new state variable added

---

## Bug Squashing Process

When a runtime error like `X is not a function` or `X is undefined` occurs, follow this diagnostic routine:

1. **Read the error** — note the file and line number where the error occurs (e.g. `me-calculations.js:44`)
2. **Check for parse errors in the defining file** — use bash to search for the missing function/variable:
   ```bash
   grep -rn "function myFunc\|const myFunc\|let myFunc" portals/ utils/ core/
   ```
3. **Read the defining file for syntax errors** — the file may be failing to parse entirely due to:
   - Duplicate `const` declarations in same scope
   - Unclosed brackets or parentheses
   - Missing commas in object literals
   - Other JavaScript syntax errors
4. **Check load order** — search `index.html` for the relevant `<script>` tags; confirm the defining file loads before the caller
5. **If load order is correct, check for syntax errors again** — a file that fails to parse silently prevents any of its `window.*` assignments from running
6. **Look for duplicate variable names** — a common JS pitfall: two `const foo` declarations in same scope cause a SyntaxError that kills the whole file
7. **Fix the error** — rename the duplicate, close the bracket, add the comma, then verify the function is now accessible

### Key Insight: No Build Step = No Compile-Time Errors

Because this project has no bundler or transpiler, syntax errors in JS files are only caught at runtime in the browser. A broken file fails silently — nothing in the console will say "me-utils.js failed to parse" before the downstream `is not a function` error appears. **Always suspect a parse failure in the *defining* file, not just a missing import or load-order issue.**

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

## External Dependencies

| Library | Source | Purpose |
|---------|--------|---------|
| Supabase JS v2 | CDN | Authentication and remote persistence |
| Chart.js v4.4.0 | CDN | Capacity charts and RPN trend charts (responsive: true) |
| IBM Plex Sans / Mono | Google Fonts | Typography (scales responsively) |
