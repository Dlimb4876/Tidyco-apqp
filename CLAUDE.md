# CLAUDE.md — Tidyco APQP Quality Tool

## Project Overview

Tidyco APQP is a **vanilla JavaScript Single Page Application (SPA)** for managing Advanced Product Quality Planning (APQP) and Manufacturing Engineering capacity. It uses **no build pipeline** — all files are served as static HTML/JS/CSS directly to the browser.

**Backend:** [Supabase](https://supabase.com) (PostgreSQL + Auth + RLS)
**Charts:** Chart.js v4.4.0 (CDN)
**Fonts:** IBM Plex Sans & IBM Plex Mono (Google Fonts)

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
│   ├── capacity/                   # ME load capacity (18 JS modules)
│   ├── product-development/
│   │   ├── npi/                    # Core APQP modules (8 JS modules)
│   │   └── product-management/    # Product registry with overhaul history
│   ├── production/                 # Production scheduling and Gantt planning
│   └── productmgmt/               # Central product master (in development)
└── *.md                            # Architecture and feature documentation
```

---

## Script Load Order (Critical)

Scripts are loaded via `<script>` tags in `index.html`. **Order matters** — do not rearrange.

```
CSS:  main.css → components.css → [feature CSS files] → apqp.css → rpn-chart.css

JS:
  Layer 1 (Core):      state.js → auth.js → db.js
  Layer 2 (Utils):     helpers.js → navigation.js
  Layer 3 (Portals):   hub.js → rpn-chart.js → dashboard.js →
                       products-data.js → trends-chart.js →
                       capacity.js → me-data-relational.js → me-data.js → me-utils.js →
                       me-calculations.js → me-components.js → me-team.js → me-tasks.js →
                       me-products.js → me-product-taskload.js → me-holidays.js →
                       me-chart.js → me-heatmap.js → me-dashboard.js → me-capacity.js →
                       me-estimation-page.js →
                       production.js → scheduling.js → planning.js →
                       families-data.js → family-templates-data.js → products.js →
                       product-development.js → product-management.js → productmgmt.js →
                       gates.js → pfmea.js → apqp.js → bom.js → timing.js → trackers.js
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

## Existing Documentation

| File | Contents |
|---|---|
| `README.md` | Portals overview, project structure, state management, key functions, script load order |
| `Tidyco APQP System Architecture.md` | Architecture summary, core data model, RPN logic |
| `FAMILY_TEMPLATES_ARCHITECTURE.md` | Family PFMEA template system design (DB schema, data flow, security) |
| `FAMILY_TEMPLATES_GUIDE.md` | User guide for creating and applying family PFMEA templates |
| `ME_DATABASE_ANALYSIS.md` | Deep-dive into ME Capacity relational DB schema (6 tables, field mappings) |

---

## Development Notes

### No Build Step
- Edit files and refresh the browser — changes are live immediately
- No compilation, transpilation, or bundling required

### No Test Framework
- All testing is manual via browser
- Check browser console for JS errors
- Test at breakpoints: 375px (mobile), 768px (tablet), 1920px (desktop)

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
