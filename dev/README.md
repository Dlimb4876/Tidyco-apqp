# Tidyco APQP Quality Tool

A Manufacturing Engineering tool for rail overhaul, managing APQP Gates 0–5 and broader operational workflows.
Built as a Single Page Application (SPA) using vanilla JavaScript, Chart.js, and Supabase for persistence.

**Now fully responsive and mobile-friendly** across all screen sizes (480px–1920px+).

---

## Quick Navigation

**First time here?** Read these sections in order:
1. **Responsive Design** (below) — understand mobile-first approach
2. **Portals** (below) — find which portal you need
3. **Project Structure** (below) — see where files are organized
4. **Script Load Order** (near bottom) — understand dependencies

**Looking for task guidance?** See **CLAUDE.md** (primary reference for AI workers):
- Adding New Features (complete workflow)
- Common mistakes to avoid (syntax, RLS, subscriptions)
- State variables reference (all global variables)
- Bug squashing process (debugging guide)

**Writing tests?** See **TESTING_STRATEGY.md** for patterns and module guides.

**Documentation maintenance rule:** If a change affects behavior, user workflow, or test reality, update **README.md** and **TESTING_STRATEGY.md** in the same logical change.

**Looking for current planning docs?** See `plans/`:
- `master-current-state.md` — verified live baseline
- `next-implementation-sprint.md` — active near-term execution queue
- `risk-and-regression-checklist.md` — pre-merge safety checklist

---

## Running locally without VS Code

If you just want to open the site in your browser for debugging, you do not need VS Code open.

- Double-click `start-debug-site.bat` in the repo root — it starts the local server and opens the site automatically
- Double-click `start-debug-site-and-wiki.bat` to open both the main app and the standalone wiki
- Or run `PowerShell -ExecutionPolicy Bypass -File .claude\serve.ps1`
- Then open `http://localhost:8000/index.html`

Press `Ctrl+C` in the launcher window when you want to stop the local server.

---

## Responsive Design

The application is designed with a **progressive enhancement** approach:

- **480px–767px** — Small phones (portrait): Single-column stacked layouts, optimized spacing
- **768px–1199px** — Tablets & large phones: 2-column layouts, balanced readability
- **1200px+** — Desktop: Original 3-column grid layouts, full feature visibility

All portals maintain full functionality across breakpoints. Desktop appearance is preserved with no visual changes. Horizontal scrolling is retained for data-heavy tables on mobile.

### Mobile Optimizations
- Responsive grid layouts (3-col → 2-col → 1-col)
- Adjusted typography and spacing for readability
- Modal widths scale to 90vw on mobile (400–600px on desktop)
- Form fields and inputs stack vertically on mobile
- Tab navigation scrolls horizontally on small screens
- Table column widths auto-adjust with horizontal scroll fallback

### Required Design Practices for All New Features

When adding features, always account for:

- **Mobile-first layouts** — Design assumes 480px width first, scales up
- **Media queries** — All new CSS must include `@media (max-width: 767px)` and `@media (min-width: 768px)`
- **Responsive tables** — Tables scroll horizontally on mobile (no wrapping columns)
- **Responsive modals** — Max-width: 90vw on mobile, 400–600px on desktop
- **No fixed widths** — Use flexbox/grid with relative units

See **CLAUDE.md** "Adding New Features" section for full workflow.

### Capacity Bootstrap

`index.html` now loads the shared capacity `cap-*` CSS/JS layer first, then the stream-specific ME/PM/Logistics/Unit 6 data and orchestrator files, then Production, and finally `capacity.js` / `capacity-events.js`. Treat that shared-first order as the live source of truth for capacity bootstrap changes.

The shared runtime now owns the live chart month controls, embedded heatmap, Product Support table, Product Load table, and Holiday Planner rendering. Do not reintroduce ME-only placeholder bridges for those tabs.

The old ME shared render/style copies were removed in Capacity Independence Phase 10. Under `portals/capacity/me/`, only `me-data.js`, `me-data-relational.js`, and `me-capacity.js` remain as ME-specific files.

---

## Portals

The app is organised into discrete portals, all accessible from the central Hub.

| Portal | Route | Description |
|--------|-------|-------------|
| **Hub** | `hub` | Operations Portal — landing page with navigation to all portals |
| **Capacity** | `capacity` | Load Capacity Management (Production, ME, Project Management, Logistics, and Unit 6 streams) |
| **Product Development** | `product-development` | NPI (APQP) and Product Management |
| **Production** | `production` | Production planning, scheduling, and plan views |
| **Operations** | `operations` | Operations Dashboard and Forecast |
| **Action Centre** | `action-centre` | Aggregated actions, PFMEA tasks, and risks across all projects |
| **MCS** | `mcs` | Manufacturing Change — ECR workflow and schedule impact tracking |
| **Settings** | `settings` | User management, teams, permissions, appearance, work areas, and families |
| **Feedback** | `feedback` | User feedback and bug reporting (real-time) |

---

## Standalone Guide Wiki (Preview)

A standalone guide wiki scaffold now exists under `wiki/` and is intentionally **not** linked from the main portal yet.

- Local review URL: `http://localhost:8000/wiki/index.html`
- Entry file: `wiki/index.html`
- Area metadata: `wiki/content/_meta/areas.json`

Validation commands:

```bash
npm run wiki:build-index
npm run wiki:audit-tokens
npm run wiki:check-links
npm run wiki:check
```

---

## ME Department Hub (Shadow Portal)

A standalone ME department hub lives at `me-hub/index.html`. It has its own auth, CSS, and JS layers and is **not linked from the main portal**.

- Reads `me_tasks` one-directionally (read-only consumer of the ME capacity plan).
- EVM foundation is in place: `percent_complete` on tasks, `time_logs` table, and `hubGetActuals()` function.
- Charting and full EVM views are deferred to later phases.

---

## CTQ Coverage Tracking

The CTQ table shows a **Coverage** column indicating whether each CTQ is referenced in at least one PFD step or PFMEA entry (green = linked, amber = orphaned). A **Coverage filter** dropdown lets users show All / Linked / Orphaned CTQs, and a stats banner displays the linked/orphaned counts. The active filter persists via the `ccf` URL param.

---

## Parts Database — Where Used

Each part in the Parts Database shows a **Used In** count of active projects referencing it. Clicking the count opens a modal listing the project names, locations (BoM section / assembly), and quantities. Usage data is loaded asynchronously and cached per session.

---

## NPI Gate Signoff Permissions

NPI gate signoff now supports named-role permissions. A user must have the matching permission key to sign, unsign, or edit signatory fields for that role.

- `feature_npi_signoff_me_manager`
- `feature_npi_signoff_operations_director`
- `feature_npi_signoff_sales_director`

Assign these from **Settings → Teams → Edit permissions**. Admin users can still sign off all roles.

---

## NPI PFD Flowchart View

The NPI Process Flow Diagram now supports a graphical flowchart view as well as the existing table view.

- Each executable step has a **Type**: `Process` or `Decision`
- `Process` steps can store one **Next Step** step number
- `Decision` steps can store **Next (Yes)** and **Next (No)** step numbers
- In the flowchart preview, blank process links automatically continue to the next numbered step so straight-line flows still render without extra setup

These links are edited directly in the PFD table and used to build the graphical preview.

---

## Project Structure

```
/tidyco-apqp
├── /core                             # System engine and global styling
│   ├── /css
│   │   ├── main.css                  # Global variables, typography, and SPA shell layout
│   │   └── components.css            # Shared UI: modals, buttons, cards, tables
│   └── /js
│       ├── app.js                    # Entry point and session initialisation
│       ├── auth.js                   # Supabase authentication
│       ├── db.js                     # Persistence and data migration
│       └── state.js                  # Global state and constant definitions
├── /me-hub                           # ME Department Hub (standalone shadow portal)
│   ├── index.html                    # Standalone entry — own auth, CSS, JS
│   ├── /css
│   └── /js                           # Reads me_tasks one-directionally; EVM foundation
├── /portals
│   ├── /hub                          # Central Operations Portal
│   │   ├── /css/hub.css
│   │   └── /js/hub.js
│   ├── /capacity                     # Load Capacity Management
│   │   ├── /css
│   │   │   └── capacity.css          # Capacity portal shell styles
│   │   ├── /shared                   # Shared capacity UI/calculation layer
│   │   │   ├── /css                  # Shared capacity shell/table/chart/dashboard/heatmap styles
│   │   │   └── /js                   # Shared cap-* renderers, utilities, and calculations
│   │   ├── /js
│   │   │   ├── capacity.js           # Portal entry and sub-tab routing
│   │   │   ├── capacity-events.js    # Delegated event handler for all capacity streams
│   │   │   └── modals.js             # Capacity portal modal injection
│   │   ├── /me/js                    # ME-specific data + orchestrator layer
│   │   │   ├── me-capacity.js
│   │   │   ├── me-data.js
│   │   │   └── me-data-relational.js
│   │   ├── /production/js            # Production capacity files
│   │   │   ├── prod-capacity.js
│   │   │   ├── prod-capacity-dashboard.js
│   │   │   ├── prod-capacity-data.js
│   │   │   ├── prod-capacity-detail.js
│   │   │   ├── prod-capacity-settings.js
│   │   │   ├── prod-capacity-workarea.js
│   │   │   └── work-areas-data.js
│   │   ├── /project-management/js    # PM isolated data layer
│   │   │   ├── pm-data.js
│   │   │   ├── pm-data-relational.js
│   │   │   ├── pm-capacity-data.js
│   │   │   └── pm-capacity.js
│   │   ├── /logistics/js             # Logistics isolated data layer
│   │   │   ├── log-capacity.js
│   │   │   ├── log-data.js
│   │   │   └── log-data-relational.js
│   │   └── /unit6/js                 # Unit 6 isolated data layer
│   │       ├── unit6-capacity.js
│   │       ├── unit6-data.js
│   │       └── unit6-data-relational.js
│   ├── /product-development          # NPI & Product Management
│   │   ├── /js
│   │   │   ├── product-development.js  # Portal hub and sub-tab routing
│   │   │   └── product-management.js   # Product management page orchestrator
│   │   ├── /npi                      # New Product Introduction (APQP core)
│   │   │   ├── /css
│   │   │   │   ├── dashboard.css     # KPI grid, gate strip, project list
│   │   │   │   ├── pfmea.css         # PFMEA table, RPN badges, sticky headers
│   │   │   │   ├── gantt.css         # Gantt timeline
│   │   │   │   ├── apqp.css          # PFD steps, CTQ table, BOM picker, resource pills
│   │   │   │   └── rpn-chart.css     # RPN trend chart styles
│   │   │   └── /js
│   │   │       ├── apqp.js           # APQP tab router (CTQ, PFD, Control Plan)
│   │   │       ├── bom.js            # BoM editor (Structure / AAW-Repair / Parts Register)
│   │   │       ├── bom-cclass.js     # ABC Part Class catalogue integration
│   │   │       ├── dashboard.js      # Project list and KPI summary
│   │   │       ├── documents.js      # Document attachments
│   │   │       ├── gates.js          # Gate review checklists and sign-off
│   │   │       ├── npi.js            # NPI section orchestrator
│   │   │       ├── npi-components.js # Shared NPI UI components
│   │   │       ├── npi-constants.js  # NPI-wide constants
│   │   │       ├── npi-cp.js         # Control Plan view
│   │   │       ├── npi-ctq.js        # CTQ editor with coverage tracking
│   │   │       ├── npi-data.js       # NPI project data layer
│   │   │       ├── npi-data-relational.js # Relational data (BOM, PFMEA, time logs)
│   │   │       ├── npi-events.js     # Delegated event handler for NPI actions
│   │   │       ├── npi-gates-editor.js # Gate sign-off UI
│   │   │       ├── npi-orchestrator.js # NPI section bootstrap and teardown
│   │   │       ├── npi-pfd.js        # PFD editor and flowchart view
│   │   │       ├── pfmea.js          # PFMEA editor (modes, effects, causes, RPN)
│   │   │       ├── pfmea-state.js    # PFMEA local state helpers
│   │   │       ├── rpn-chart.js      # RPN trend chart (Chart.js)
│   │   │       ├── timing.js         # Gantt timing plan
│   │   │       └── trackers.js       # Action and issue trackers
│   │   └── /product-management       # Product registry within Product Development
│   │       ├── /css/products.css
│   │       └── /js
│   │           ├── products-data.js  # Product data layer
│   │           └── products.js       # Product list, CRUD, overhaul history
│   ├── /production                   # Production Planning
│   │   ├── /css/production.css
│   │   └── /js
│   │       ├── data.js               # Production data layer
│   │       ├── production.js         # Portal entry and tab routing
│   │       ├── products.js           # Product master view
│   │       ├── scheduling.js         # Schedule view
│   │       └── planning.js           # Plan by Product / Plan by Unit views
│   ├── /operations                   # Operations Dashboard
│   │   ├── /css/operations.css
│   │   └── /js
│   │       ├── operations-dashboard-main.js   # Portal entry and orchestrator
│   │       ├── operations-dashboard-state.js  # State and constants
│   │       ├── operations-dashboard-metrics.js# KPI metric calculations
│   │       ├── operations-dashboard-realtime.js # Real-time subscriptions
│   │       ├── operations-dashboard-render-core.js # Core render functions
│   │       ├── operations-dashboard-forecast-view.js # Forecast chart view
│   │       └── operations-dashboard-forecast-actions.js # Forecast edit actions
│   ├── /action-centre                # Aggregated Actions, PFMEA tasks, and risks
│   │   ├── /css/action-centre.css
│   │   └── /js/action-centre.js
│   ├── /mcs                          # Manufacturing Change (ECR workflow)
│   │   ├── /css/mcs.css
│   │   └── /js
│   │       ├── mcs-data.js           # MCS data layer
│   │       ├── mcs-approval.js       # Approval workflow
│   │       └── mcs.js                # MCS portal UI
│   ├── /settings                     # Settings (users, teams, permissions, appearance)
│   │   ├── /css/settings.css
│   │   └── /js
│   │       ├── settings.js           # Settings portal and tab routing
│   │       └── teams-data.js         # Teams CRUD data layer
│   └── /feedback                     # User feedback and bug reporting (real-time)
│       ├── /css/feedback.css
│       └── /js
│           ├── feedback-constants.js # Types, statuses, icons, colours
│           ├── feedback-data.js      # Supabase operations and real-time sync
│           └── feedback.js           # Feedback UI and form handling
├── /utils                            # Shared utilities
│   ├── /js
│   │   ├── helpers.js                # Escaping, modal management, and UI utils
│   │   ├── navigation.js             # Hash-based routing and render switchboard
│   │   └── realtime.js               # Real-time subscription helpers
│   └── /css
├── /tests                            # Jest test files (*.test.js)
├── /plans                            # Live planning baseline (current state, next sprint, risk checklist)
├── /scripts                          # Quality-check scripts (check:all)
├── /supabase                         # SQL migrations and RLS policies
├── /wiki                             # Standalone guide wiki (not linked from portal yet)
├── index.html                        # Main application entry point
└── README.md
```

---

## Core Data Model

- **Project**: Root object containing metadata (customer, unit, family) and child arrays.
- **CTQ**: Critical-to-Quality requirements (id, req, spec, testMethod). Includes **Coverage** status — whether each CTQ is linked to a PFD step or PFMEA entry (linked / orphaned).
- **PFD**: Process Flow steps. Includes `bomRefs`, `ctqIds`, `pfd_type`, and optional next-step links for flowchart rendering.
- **PFMEA**: Nested structure: Failure Mode → Effects → Causes (with RPN/Action history).
- **BOM**: Three-tab structure:
  - **Structure** — hierarchical product tree (parts from Parts Database, sub-assemblies with manual PNs, up to 4 levels deep). Replaces the old flat Kits view.
  - **AAW / Repair** — multiple named BoM groups for after-warranty and repair scopes, each with its own tree and a top-level Part Number field. Groups are tagged AAW or Repair.
  - **Parts Register** — rolled-up view of unique parts from Structure and AAW/Repair with summed quantities. Supports Total / Structure-only / AAW-Repair-only filters.
  - Part Class (ABC) badges display on all BoM views for parts linked to the Parts Database catalogue.

For complete state variables reference, see **CLAUDE.md "State Management"** section.

---

## Key Functions

| Function | Module | Description |
|----------|--------|-------------|
| `prog()` | state.js | Returns the active project object |
| `save()` | db.js | Local backup + debounced Supabase `saveRemote()` |
| `navigate(sec)` | navigation.js | Updates `currentSection` and URL hash, calls `render()` |
| `render()` | navigation.js | Main UI switchboard, clears and repaints `#mainContent` |
| `launchApp()` | app.js | Loads remote data and restores navigation from URL hash |
| `parseHash()` | navigation.js | Parses URL hash into key-value parameters |
| `navigateBack()` | navigation.js | Smart back navigation (NPI sections → product-development, others → hub) |
| `setApqpTab(tab)` | navigation.js | Sets APQP sub-tab and updates URL hash |
| `goProjects()` | navigation.js | Quick navigation to projects list |
| `goHome()` | navigation.js | Quick navigation to current project home |

---

## Navigation API

### URL Hash Parameters

The application uses hash-based routing with the following parameters:

| Parameter | Description | Example Values |
|-----------|-------------|----------------|
| `p` | Project/project UUID | `p=a1b2c3d4-e5f6-...` |
| `s` | Section/portal | `s=hub`, `s=capacity`, `s=product-development`, `s=production` |
| `nft` | NPI projects filter tab | `nft=all`, `nft=HVAC`, `nft=Pneumatics` |
| `t` | APQP sub-tab | `t=ctq`, `t=pfd`, `t=pfmea`, `t=cp` |
| `ct` | Capacity sub-tab | `ct=root`, `ct=me`, `ct=overhaul`, `ct=projects` |
| `pt` | Production sub-tab | `pt=root`, `pt=products`, `pt=scheduling` |
| `pdt` | Product Development sub-tab | `pdt=root`, `pdt=npi`, `pdt=product-management` |
| `pvm` | NPI projects view mode | `pvm=list`, `pvm=grid` |
| `ps` | NPI projects search text | `ps=HVAC` |
| `pf` | NPI projects family filter | `pf=Pneumatics` |
| `pst` | NPI projects status filter | `pst=active` |
| `bt` | BOM sub-tab | `bt=tree`, `bt=register`, `bt=tools`, `bt=equip`, `bt=cons` |
| `pfr` | PFMEA RPN filter | `pfr=high` |
| `pfv` | PFMEA view mode | `pfv=compact` |
| `csf` | CTQ source filter | `csf=customer` |
| `cof` | CTQ OOS filter | `cof=true` |
| `caf` | CTQ agreed filter | `caf=true` |
| `ccf` | CTQ coverage filter | `ccf=orphaned`, `ccf=linked` |
| `tsf` | Tracker sub-assembly filter | `tsf=<sub-assembly-id>` |

### Example URLs

```
# Hub dashboard
#s=hub

# Capacity portal, ME view
#s=capacity&ct=me

# Product Development portal, NPI section, PFMEA tab
#p=<uuid>&s=product-development&pdt=npi&t=pfmea

# APQP section (when project is active)
#p=<uuid>&s=product-development&t=ctq

# Production portal
#s=production&pt=scheduling
```

### Navigation Functions

**`navigate(section, options)`**
- Primary navigation function
- Automatically manages subscription cleanup and tab resets
- Options: `{ pushHash: true }` - set to false to replace history instead of pushing

**`navigateBack()`**
- Intelligent back navigation
- NPI sections (apqp, actions, risks, bom, timing) → product-development
- All other sections → hub

**`setApqpTab(tab)`**
- Changes APQP sub-tab without full navigation
- Valid tabs: `ctq`, `pfd`, `pfmea`, `cp`

### Subscription Management

Navigation automatically handles cleanup for real-time subscriptions:

- **Bug Reports**: Unsubscribes when leaving `bugreports` section
- **ME Capacity**: Unsubscribes from team data and utilization when leaving `capacity`
- **Production**: Unsubscribes when leaving `production`

Always use `navigate()` instead of directly setting `window.location.hash` to ensure proper cleanup.

---

## RPN Logic

- **Calculation**: `RPN = SEV × OCC × DET`
- **Thresholds**: High RPN ≥ 100 triggers amber/red badges
- **Forecast RPN**: `SEV × New OCC × New DET`

---

## CSS Strategy

- **Global Shell**: `main.css` defines custom variables (`--blue`, `--ink`, etc.) and the primary SPA layout, plus global responsive utilities.
- **Common UI**: Shared elements such as modals, buttons, cards, tables, and form inputs reside in `components.css`, with responsive media queries for mobile/tablet.
- **Responsive Breakpoints**: All feature CSS files include media queries at 480px and 768px to handle mobile and tablet layouts.
- **Feature Isolation**: Styles for complex features are kept in standalone files:
  - `dashboard.css` — KPI grid, gate strip, sub-assembly cards, project list (responsive grid layout)
  - `hub.css` — Operations portal hub grid (3-col → 2-col → 1-col responsive)
  - `capacity.css` / `me-capacity.css` — Capacity portal and ME load planning views (responsive charts and heatmaps)
  - `production.css` — Production planning shell and tab views (responsive filters and grids)
  - `products.css` — Product registry and overhaul trends (responsive product management UI)
  - `pfmea.css` — PFMEA table, RPN badges, sticky headers (optimized for mobile scroll)
  - `gantt.css` — Gantt timeline, kit builder (responsive timeline cells and kit cards)
  - `apqp.css` — PFD steps, CTQ table, BOM picker, resource pills (flexible column widths)
  - `rpn-chart.css` — RPN trend chart (responsive SVG scaling)
  - `productmgmt.css` — Central product management (responsive family and usage lists)

### CSS Media Queries

Standard responsive breakpoints applied consistently:

```css
/* Mobile (max-width: 767px) */
@media (max-width: 767px) {
  /* Single-column layouts, reduced padding, smaller fonts */
}

/* Tablet (min-width: 768px, max-width: 1199px) */
@media (min-width: 768px) and (max-width: 1199px) {
  /* 2-column layouts, balanced spacing */
}

/* Desktop (min-width: 1200px) */
/* Default styles, no media query needed */
```

---

## APQP Gates

Six gates (0–5) are defined in `state.js` as `GATE_DEFS`, each with a name, phase label, required signatories, and a checklist of completion criteria.

| Gate | Name |
|------|------|
| 0 | Pre-Planning |
| 1 | Plan and Define |
| 2 | Product Design & Development |
| 3 | Process Design & Development |
| 4 | Product & Process Validation |
| 5 | Feedback & Corrective Action |

---

## Script Load Order

⚠️ **Script load order is defined in index.html `<script>` tags. That is the source of truth.** See **CLAUDE.md "Script Load Order"** for complete reference list.

The load order is critical because scripts use the global scope and depend on earlier scripts being available. When adding a new JS file:
1. Add `<script>` tag to index.html in the correct position
2. Update CLAUDE.md script load order reference
3. Do NOT add `<script>` tags out of order

---

## CSS Load Order

CSS files must be loaded in cascade order so feature overrides work correctly:

```
main.css → components.css →
dashboard.css → hub.css →
capacity.css → me-capacity.css →
production.css → operations.css →
products.css (product-dev) →
pfmea.css → gantt.css → apqp.css → rpn-chart.css →
action-centre.css → mcs.css → settings.css → feedback.css
```

---

## External Dependencies

| Library | Source | Purpose |
|---------|--------|---------|
| Supabase JS v2 | CDN | Authentication and remote persistence |
| Chart.js v4.4.0 | CDN | Capacity charts and RPN trend charts (responsive: true) |
| IBM Plex Sans / Mono | Google Fonts | Typography (scales responsively) |

---

## Getting Started as an AI Worker

1. **Read CLAUDE.md first** — it's the primary reference for AI workers working on this project
2. **Read CHANGELOG.md** — see what has changed recently before touching any code
3. **Follow the New Feature Checklist** — it guides you through the complete process
4. **Avoid common mistakes** — duplicate `const`, wrong load order, missing RLS, subscription leaks
5. **Write tests** — see TESTING_STRATEGY.md for patterns and guidelines
6. **Update CHANGELOG.md** — add a 2-line entry for every logical change you make
