# Tidyco APQP Quality Tool

A Manufacturing Engineering tool for rail overhaul, managing APQP Gates 0–5.  
Built as a Single Page Application (SPA) using vanilla JavaScript and Supabase for persistence.

---

## Project Structure

The CSS architecture is modularised to separate global shell styles from feature-specific component logic, preventing `main.css` from becoming over-encumbered.

```
/tidyco-apqp
├── /core                   # System engine and global styling
│   ├── /css
│   │   ├── main.css        # Global variables, typography, and SPA shell layout
│   │   └── components.css  # Shared UI: Modals, buttons, cards, and tables
│   └── /js
│       ├── app.js          # Entry point and session initialization
│       ├── auth.js         # Supabase authentication
│       ├── db.js           # Persistence and data migration
│       └── state.js        # Global state and constant definitions
├── /portals                # Feature-specific modules
│   ├── /hub                # Central Operations Portal
│   ├── /capacity           # Capacity Management stream
│   └── /npi                # New Product Introduction (APQP Core)
│       ├── /css            # Feature-specific styles (apqp, gantt, pfmea)
│       └── /js             # Feature-specific logic (gates, bom, timing)
├── /utils                  # Shared utilities
│   └── /js
│       ├── helpers.js      # Escaping, modal management, and UI utils
│       └── navigation.js   # Hash-based routing and breadcrumbs
├── index.html              # Main application entry point
└── README.md               # System documentation
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
