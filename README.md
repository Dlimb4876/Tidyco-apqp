# Tidyco APQP Quality Tool

A Manufacturing Engineering tool for rail overhaul, managing APQP Gates 0–5.  
Built as a Single Page Application (SPA) using vanilla JavaScript and Supabase for persistence.

---

## Project Structure

```
/tidyco-apqp
├── /css
│   ├── main.css            # Global styles, variables, and shell layout
│   └── pfmea.css           # Specific styles for the PFMEA table
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
| `db`            | Global object containing all programmes              |
| `progId`        | UUID of the currently active project                 |
| `currentSection`| Current UI route (e.g. `project`, `apqp`, `gate_1`) |
| `apqpTab`       | Active sub-tab within APQP (`ctq` / `pfd` / `pfmea` / `cp`) |
| `bomSubTab`     | Active sub-tab within BOM (`parts` / `tools` / etc.) |

---

## Key Functions

| Function          | Module          | Description                                    |
|------------------|-----------------|------------------------------------------------|
| `prog()`          | state.js        | Returns the active programme object            |
| `save()`          | db.js           | Local backup + debounced Supabase `saveRemote()` |
| `navigate(sec)`   | navigation.js   | Updates `currentSection` and URL hash, calls `render()` |
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

- **Calculation**: `RPN = SEV × OCC × DET`
- **Thresholds**: High RPN ≥ 100 triggers amber/red badges
- **Forecast RPN**: `SEV × New OCC × New DET`

---

## CSS Strategy

- Custom variables (`--blue`, `--ink`, etc.) defined in `:root` in `main.css`
- Tabular data uses `.sticky-table-wrap` for fixed headers
- PFMEA-specific classes (`pfmea-row-sub`, `pfmea-mode-cell`, etc.) live in `pfmea.css`
