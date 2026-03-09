# Tidyco APQP Quality Tool

A Manufacturing Engineering tool for rail overhaul, managing APQP Gates 0–5.  
Built as a Single Page Application (SPA) using vanilla JavaScript and Supabase for persistence.

---

## Project Structure

The CSS architecture is modularized to separate global shell styles from feature-specific component logic, preventing `main.css` from becoming over-encumbered.


```

/tidyco-apqp
├── /css
│   ├── main.css            # Global variables, reset, typography, and shell layout
│   ├── components.css      # Shared UI: Modals, buttons, and form inputs
│   ├── dashboard.css       # KPI cards, project grid, and status badges
│   ├── pfmea.css           # PFMEA logic: RPN badges and nested row styles
│   ├── gantt.css           # Timing plan: Timeline bars and milestone markers
│   └── apqp.css            # Shared styles for PFD, CTQ, and Control Plans
├── /js
│   ├── /core
│   │   ├── auth.js         # Supabase authentication logic
│   │   ├── db.js           # Supabase persistence and data migration
│   │   └── state.js        # Global state (db, progId, currentSection)
│   ├── /features
│   │   ├── dashboard.js    # Project home and KPI dashboard rendering
│   │   ├── gates.js        # Gate checklist and sign-off logic
│   │   ├── apqp.js         # Unified APQP tab management (CTQ, PFD, CP)
│   │   ├── pfmea.js        # PFMEA specific logic and RPN calculations
│   │   ├── bom.js          # Bill of Materials and Kit builder
│   │   ├── timing.js       # Gantt chart and NPI timing plan
│   │   └── trackers.js     # Action Tracker and Risk Register
│   ├── /utils
│   │   ├── helpers.js      # Escaping, date formatting, and UI utils
│   │   └── navigation.js   # Hash-based routing and breadcrumbs
│   └── app.js              # Entry point (launchApp) and event listeners
├── index.html              # Clean shell with modal containers
└── README.md               # System architecture documentation

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

| Variable         | Description                                          |
|-----------------|------------------------------------------------------|
| `db`            | Global object containing all programmes             |
| `progId`        | UUID of the currently active project                |
| `currentSection`| Current UI route (e.g. `project`, `apqp`, `gate_1`) |
| `apqpTab`       | Active sub-tab within APQP (`ctq` / `pfd` / `pfmea` / `cp`) |
| `bomSubTab`     | Active sub-tab within BOM (`parts` / `tools` / etc.) |

---

## Key Functions

| Function          | Module          | Description                                    |
|------------------|-----------------|------------------------------------------------|
| `prog()`          | state.js        | Returns the active programme object           |
| `save()`          | db.js           | Local backup + debounced Supabase `saveRemote()` |
| `Maps(sec)`   | navigation.js   | Updates `currentSection` and URL hash, calls `render()` |
| `render()`        | navigation.js   | Main UI switchboard, clears and repaints `#mainContent` |
| `launchApp()`     | app.js          | Loads remote data and restores navigation from URL hash |

---

## Script Load Order

Scripts must be loaded in dependency order (all use the global scope):


```

state.js → auth.js → db.js → helpers.js → navigation.js →
dashboard.js → gates.js → pfmea.js → apqp.js → bom.js → timing.js → trackers.js →
app.js

```

---

## RPN Logic

- **Calculation**: $RPN = SEV \times OCC \times DET$
- **Thresholds**: High $RPN \ge 100$ triggers amber/red badges
- **Forecast RPN**: $SEV \times New OCC \times New DET$

---

## CSS Strategy

- **Global Shell**: `main.css` defines custom variables (`--blue`, `--ink`, etc.) and the primary SPA layout.
- **Feature Isolation**: Styles for complex components like the Gantt chart (`gantt.css`) or the Dashboard grid (`dashboard.css`) are kept in standalone files to ensure `main.css` remains lightweight.
- **Common UI**: Shared elements such as modals and standardized buttons reside in `components.css`.

```
