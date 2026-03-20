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

---

## Portals

The app is organised into discrete portals, all accessible from the central Hub.

| Portal | Route | Description |
|--------|-------|-------------|
| **Hub** | `hub` | Operations Portal — landing page with navigation to all portals |
| **Capacity** | `capacity` | Load Capacity Management (Production & ME streams) |
| **Product Development** | `product-development` | NPI (APQP) and Product Management |
| **Production** | `production` | Production planning, scheduling, and plan views |
| **Operations** | `operations` | Operations Dashboard and Forecast |
| **Action Centre** | `action-centre` | Aggregated actions, PFMEA tasks, and risks across all projects |
| **MCS** | `mcs` | Manufacturing Change System — ECR workflow and schedule impact tracking |
| **Settings** | `settings` | User management, teams, permissions, appearance, work areas, and families |
| **Feedback** | `feedback` | User feedback and bug reporting (real-time) |

---

## Capacity Change Rule

When changing the ME Capacity plan, make the equivalent change in the PM Capacity plan under `portals/capacity/project-management/` unless the request explicitly says not to.

This applies to UI, routing, shared data handling, and persistence changes so the two capacity plans do not drift apart.

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
├── /portals
│   ├── /hub                          # Central Operations Portal
│   │   ├── /css/hub.css
│   │   └── /js/hub.js
│   ├── /capacity                     # Load Capacity Management
│   │   ├── /css
│   │   │   ├── capacity.css          # Capacity portal shell styles
│   │   │   └── me-capacity.css       # ME capacity module styles
│   │   └── /js
│   │       ├── capacity.js           # Portal entry and sub-tab routing
│   │       ├── me-data.js            # ME data layer and Supabase sync
│   │       ├── me-team.js            # Team member management
│   │       ├── me-tasks.js           # Task and project allocation
│   │       ├── me-products.js        # Product loading for ME capacity
│   │       ├── me-holidays.js        # Holiday planner
│   │       ├── me-chart.js           # Capacity bar chart (Chart.js)
│   │       ├── me-heatmap.js         # Engineer load heat map
│   │       ├── me-dashboard.js       # ME capacity dashboard summary
│   │       └── me-capacity.js        # ME capacity orchestrator
│   ├── /product-development          # NPI & Product Management
│   │   ├── /js
│   │   │   ├── product-development.js  # Portal hub and sub-tab routing
│   │   │   └── product-management.js   # Product management page orchestrator
│   │   ├── /npi                      # New Product Introduction (APQP core)
│   │   │   ├── /css
│   │   │   │   ├── dashboard.css     # KPI grid, gate strip, project list
│   │   │   │   ├── pfmea.css         # PFMEA table, RPN badges, sticky headers
│   │   │   │   ├── gantt.css         # Gantt timeline and kit builder
│   │   │   │   ├── apqp.css          # PFD steps, CTQ table, BOM picker, resource pills
│   │   │   │   └── rpn-chart.css     # RPN trend chart styles
│   │   │   └── /js
│   │   │       ├── dashboard.js      # Project list and KPI summary
│   │   │       ├── gates.js          # Gate review checklists and sign-off
│   │   │       ├── pfmea.js          # PFMEA editor (modes, effects, causes, RPN)
│   │   │       ├── apqp.js           # CTQ, PFD, and Control Plan views
│   │   │       ├── bom.js            # Bill of Materials editor and kit builder
│   │   │       ├── timing.js         # Gantt timing plan
│   │   │       ├── trackers.js       # Action and issue trackers
│   │   │       └── rpn-chart.js      # RPN trend chart (Chart.js)
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
│   ├── /mcs                          # Manufacturing Change System (ECR workflow)
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
├── /plans                            # Architecture docs and feature plans
├── /scripts                          # Quality-check scripts (check:all)
├── /supabase                         # SQL migrations and RLS policies
├── index.html                        # Main application entry point
└── README.md
```

---

## Core Data Model

- **Project**: Root object containing metadata (customer, unit, family) and child arrays.
- **CTQ**: Critical-to-Quality requirements (id, req, spec, testMethod).
- **PFD**: Process Flow steps. Includes `bomRefs` and `ctqIds`.
- **PFMEA**: Nested structure: Failure Mode → Effects → Causes (with RPN/Action history).
- **BOM**: Categorised into `parts`, `tools`, `equip`, `mat`, `cons`, and `kits`.

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

