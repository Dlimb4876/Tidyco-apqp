# Tidyco APQP Quality Tool

A Manufacturing Engineering tool for rail overhaul, managing APQP Gates 0–5.  
Built as a Single Page Application (SPA) using vanilla JavaScript and Supabase for persistence.

---

## Project Structure

The CSS architecture is modularised to separate global shell styles from feature-specific component logic, preventing `main.css` from becoming over-encumbered.

```
/tidyco-apqp
├── /css
│   ├── main.css            # Global variables, reset, typography, and shell layout
│   ├── components.css      # Shared UI: Modals, buttons, cards, tables, and forms
│   ├── dashboard.css       # KPI cards, project grid, gate strip, and status badges
│   ├── hub.css             # Operations Portal grid and large card styling
│   ├── capacity.css        # Capacity portal layout and specialized grid
│   ├── pfmea.css           # PFMEA logic: RPN badges and nested row styles
│   ├── gantt.css           # Timing plan: Timeline bars, markers, and kit styles
│   └── apqp.css            # Styles for PFD, CTQ, BOM picker, and Control Plans
├── /js
│   ├── /core
│   │   ├── auth.js         # Supabase authentication logic
│   │   ├── db.js           # Supabase persistence and data migration
│   │   └── state.js        # Global state (db, progId, currentSection, tabs)
│   ├── /features
│   │   ├── hub.js          # Operations Portal main menu rendering
│   │   ├── capacity.js     # Capacity portal (Overhaul, ME, and Projects)
│   │   ├── dashboard.js    # Project home and KPI dashboard rendering
│   │   ├── gates.js        # Gate checklist and sign-off logic
│   │   ├── apqp.js         # Unified APQP tab management (CTQ, PFD, CP)
│   │   ├── pfmea.js        # PFMEA specific logic and RPN calculations
│   │   ├── bom.js          # Bill of Materials and Kit builder
│   │   ├── timing.js       # Gantt chart and NPI timing plan
│   │   └── trackers.js     # Action Tracker and Risk Register
│   ├── /utils
│   │   ├── helpers.js      # Escaping, modal management, and UI utils
│   │   └── navigation.js   # Hash-based routing, breadcrumbs, and render switch
│   └── app.js              # Entry point, session init, and app launch
├── index.html              # Shell with navigation, main content, and modal containers
├── README.md               # System architecture and documentation
└── Tidyco APQP System Architecture.md # Core data model and technical overview
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

| Variable          | Description                                           |
|-------------------|-------------------------------------------------------|
| `db`              | Global object containing all programmes              |
| `progId`          | UUID of the currently active project                 |
| `currentSection`  | Current UI route (e.g. `project`, `apqp`, `gate_1`)  |
| `apqpTab`         | Active sub-tab within APQP (`ctq` / `pfd` / `pfmea` / `cp`) |
| `bomSubTab`       | Active sub-tab within BOM (`parts` / `tools` / etc.) |

---

## Key Functions

| Function          | Module         | Description                                        |
|-------------------|----------------|----------------------------------------------------|
| `prog()`          | state.js       | Returns the active programme object                |
| `save()`          | db.js          | Local backup + debounced Supabase `saveRemote()`   |
| `navigate(sec)`   | navigation.js  | Updates `currentSection` and URL hash, calls `render()` |
| `render()`        | navigation.js  | Main UI switchboard, clears and repaints `#mainContent` |
| `launchApp()`     | app.js         | Loads remote data and restores navigation from URL hash |

---

## Script Load Order

Scripts must be loaded in dependency order (all use the global scope):

```
state.js → auth.js → db.js → helpers.js → navigation.js →
dashboard.js → gates.js → pfmea.js → apqp.js → bom.js → timing.js → trackers.js →
app.js
```

---

## CSS Load Order

CSS files must be loaded in cascade order so feature overrides work correctly:

```
main.css → components.css → dashboard.css → pfmea.css → gantt.css → apqp.css
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
- **Feature Isolation**: Styles for complex features are kept in standalone files to ensure `main.css` and `components.css` remain lightweight:
  - `dashboard.css` — KPI grid, gate strip, sub-assembly cards, project list
  - `pfmea.css` — PFMEA table, RPN badges, sticky headers
  - `gantt.css` — Gantt timeline, kit builder
  - `apqp.css` — PFD steps, CTQ table, BOM picker, resource pills
