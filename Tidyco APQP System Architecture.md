# Tidyco APQP System Architecture

## Overview
A Manufacturing Engineering tool for rail overhaul, managing APQP Gates 0-5. Built as a Single Page Application (SPA) using vanilla JavaScript and Supabase for persistence.

## Core Data Model
- **Programme**: Root object containing metadata (customer, unit, family) and child arrays.
- **CTQ**: Critical-to-Quality requirements (id, req, spec, testMethod).
- **PFD**: Process Flow steps. Includes `bomRefs` and `ctqIds`.
- **PFMEA**: Nested structure: Failure Mode -> Effects -> Causes (with RPN/Action history).
- **BOM**: Categorized into `parts`, `tools`, `equip`, `mat`, `cons`, and `kits`.

## State Management
- **db**: Global object containing all programmes.
- **progId**: UUID of the currently active project.
- **currentSection**: Current UI route (e.g., 'project', 'apqp', 'bom', 'gate_1').
- **apqpTab**: Active sub-tab within the APQP section ('ctq', 'pfd', 'pfmea', 'cp').

## Key Functions
- **prog()**: Returns the active programme object based on `progId`.
- **save()**: Local backup + debounced Supabase `saveRemote()`.
- **navigate(sec)**: Updates `currentSection` and URL hash, then calls `render()`.
- **render()**: Main UI switchboard that clears and repaints the `#mainContent` div.

## CSS Strategy
- Custom variables (`--blue`, `--ink`) defined in `:root`.
- Tabular data uses a "sticky-table-wrap" class for fixed headers.
- PFMEA uses specific `pfmea-row-sub` and `pfmea-mode-cell` classes for nested row rendering.

## RPN Logic
- **Calculation**: $RPN = SEV \times OCC \times DET$.
- **Thresholds**: High RPN is defined as $\ge 100$, triggering amber/red badges.
- **Forecast**: $Forecast RPN = SEV \times New OCC \times New DET$.