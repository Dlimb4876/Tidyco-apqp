# Tidyco APQP Quality Tool

A Manufacturing Engineering tool for rail overhaul, managing APQP Gates 0–5 and broader operational workflows.
Built as a Single Page Application (SPA) using vanilla JavaScript, Chart.js, and Supabase for persistence.

---

## Portals

The app is organised into discrete portals, all accessible from the central Hub.

| Portal | Route | Description |
|--------|-------|-------------|
| **Hub** | `hub` | Operations Portal — landing page with navigation to all portals |
| **Capacity** | `capacity` | Load Capacity Management (Production & ME streams) |
| **Product Development** | `product-development` | NPI (APQP) and Product Management |
| **Production** | `production` | Production planning, scheduling, and plan views |
| **Product Management** | `productmgmt` | Central product registry (in development) |

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
│   └── /productmgmt                  # Central Product Management (in development)
│       ├── /css/productmgmt.css
│       └── /js/productmgmt.js
├── /utils                            # Shared utilities
│   └── /js
│       ├── helpers.js                # Escaping, modal management, and UI utils
│       └── navigation.js             # Hash-based routing and render switchboard
├── index.html                        # Main application entry point
└── README.md
```

---

## Core Data Model

- **Programme**: Root object containing metadata (customer, unit, family) and child arrays.
- **CTQ**: Critical-to-Quality requirements (id, req, spec, testMethod).
- **PFD**: Process Flow steps. Includes `bomRefs` and `ctqIds`.
- **PFMEA**: Nested structure: Failure Mode → Effects → Causes (with RPN/Action history).
- **BOM**: Categorised into `parts`, `tools`, `equip`, `mat`, `cons`, and `kits`.

---

## State Management

| Variable | Description |
|----------|-------------|
| `db` | Global object containing all programmes |
| `progId` | UUID of the currently active project |
| `currentSection` | Current UI route (e.g. `hub`, `capacity`, `production`) |
| `apqpTab` | Active APQP sub-tab (`ctq` / `pfd` / `pfmea` / `cp`) |
| `bomSubTab` | Active BOM sub-tab (`parts` / `tools` / `equip` / `mat` / `cons` / `kits`) |
| `capacityTab` | Active capacity stream (`root` / `me` / `overhaul`) |
| `productionTab` | Active production view (`root` / `products` / `scheduling` / `by-product` / `by-unit`) |
| `productDevelopmentTab` | Active product development sub-tab (`root` / `npi` / `product-management`) |
| `prodPlanWeekOffset` | Week offset for the 4-week rolling production plan |
| `meStartOffset` | Month offset for the ME capacity chart |

---

## Key Functions

| Function | Module | Description |
|----------|--------|-------------|
| `prog()` | state.js | Returns the active programme object |
| `save()` | db.js | Local backup + debounced Supabase `saveRemote()` |
| `navigate(sec)` | navigation.js | Updates `currentSection` and URL hash, calls `render()` |
| `render()` | navigation.js | Main UI switchboard, clears and repaints `#mainContent` |
| `launchApp()` | app.js | Loads remote data and restores navigation from URL hash |

---

## Script Load Order

Scripts must be loaded in dependency order (all use the global scope):

```
state.js → auth.js → db.js →
helpers.js → navigation.js →
hub.js → rpn-chart.js → dashboard.js →
capacity.js → me-data.js → me-team.js → me-tasks.js → me-products.js →
  me-holidays.js → me-chart.js → me-heatmap.js → me-dashboard.js → me-capacity.js →
data.js → production.js → products.js (production) → scheduling.js → planning.js →
products-data.js → products.js (product-dev) →
product-development.js → product-management.js →
productmgmt.js →
gates.js → pfmea.js → apqp.js → bom.js → timing.js → trackers.js →
app.js
```

---

## CSS Load Order

CSS files must be loaded in cascade order so feature overrides work correctly:

```
main.css → components.css →
dashboard.css → hub.css →
capacity.css → me-capacity.css →
production.css →
products.css (product-dev) → productmgmt.css →
pfmea.css → gantt.css → apqp.css → rpn-chart.css
```

---

## RPN Logic

- **Calculation**: `RPN = SEV × OCC × DET`
- **Thresholds**: High RPN ≥ 100 triggers amber/red badges
- **Forecast RPN**: `SEV × New OCC × New DET`

---

## CSS Strategy

- **Global Shell**: `main.css` defines custom variables (`--blue`, `--ink`, etc.) and the primary SPA layout.
- **Common UI**: Shared elements such as modals, buttons, cards, tables, and form inputs reside in `components.css`.
- **Feature Isolation**: Styles for complex features are kept in standalone files:
  - `dashboard.css` — KPI grid, gate strip, sub-assembly cards, project list
  - `hub.css` — Operations portal hub grid
  - `capacity.css` / `me-capacity.css` — Capacity portal and ME load planning views
  - `production.css` — Production planning shell and tab views
  - `products.css` — Product registry and overhaul trends
  - `pfmea.css` — PFMEA table, RPN badges, sticky headers
  - `gantt.css` — Gantt timeline, kit builder
  - `apqp.css` — PFD steps, CTQ table, BOM picker, resource pills
  - `rpn-chart.css` — RPN trend chart

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

## External Dependencies

| Library | Source | Purpose |
|---------|--------|---------|
| Supabase JS v2 | CDN | Authentication and remote persistence |
| Chart.js v4.4.0 | CDN | Capacity charts and RPN trend charts |
| IBM Plex Sans / Mono | Google Fonts | Typography |
