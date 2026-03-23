# Master Current State (Live Baseline)

Last updated: 2026-03-21
Status: Active baseline after full plans reset

## Purpose
This document captures the current, verified state of the app so new planning starts from live behavior, not historic assumptions.

## Architecture Snapshot
- Stack: Vanilla JavaScript SPA, Supabase (Auth + Postgres + Realtime), Chart.js
- Entry shell: index.html
- Core load order is preserved: state.js -> auth.js -> db.js -> helpers.js -> navigation.js -> realtime.js -> portals -> app.js
- Routing: hash-based navigation via utils/js/navigation.js
- Persistence: debounced save path in core/js/db.js

## Portal Inventory (Live)
- Hub
- Capacity (ME, Production Capacity, PM Capacity)
- Product Development (NPI + Product Management)
- Production
- Operations
- MCS
- Action Centre
- Settings
- Feedback

## Verified Feature Status

### 1. Test and quality baseline
- Jest suites: 44
- Tests passing: 648/648
- Last validation: npm test -- --runInBand --silent (pass)

### 2. NPI tender gate scope
- Present in state model and helpers
- Persisted through db save/load/migration logic
- Editor module loaded and wired
- Product -> linked project handoff path present
- Gate lock metadata present (locked, locked_at, locked_by)

### 3. Permissions model
- Hybrid effective permissions are present (role baseline + team grants)
- Navigation guards are active
- Settings contains permissions/team management paths

### 4. MCS
- Layout overhaul is present
- KPI/filters/cards/approval UI paths exist
- MCS approvals are surfaced into Action Centre and Hub counters

### 5. Capacity
- Delegated event hub exists (capacity-events.js)
- ME/PM/Production subflows appear wired through shared capacity shell
- Parity rule remains mandatory for ME/PM edits

## Known Drift / Mismatch Areas
1. Docs drift
- TESTING_STRATEGY.md still claims auth/db/helpers are untested
- README.md still references plans as if populated historical docs exist

2. Keyboard shortcuts mismatch
- UI advertises Ctrl+S and Ctrl+F in shortcuts modal
- Global implementation appears to only guarantee ? and Ctrl+/ help modal behavior

3. Inline handler debt still present
- Many portal renderers still output inline onclick/onchange/oninput/onkeydown
- This is inconsistent with delegated-action standards used in newer modules

## Constraints and Non-Negotiables
- Keep script order stable in index.html
- Keep global mutable state in core/js/state.js
- Use esc() for user-rendered values in HTML strings
- Use navigate() for route changes (realtime cleanup)
- Preserve ME/PM parity in capacity scope unless explicitly excluded
- Keep auth-only shared-access model unless policy change is explicitly approved

## Immediate Planning Principle
Any new implementation plan must start with:
1. live code inspection,
2. explicit dependency map,
3. tests to protect behavior,
4. rollback notes.

## Next Doc
Use plans/next-implementation-sprint.md as the active execution queue.