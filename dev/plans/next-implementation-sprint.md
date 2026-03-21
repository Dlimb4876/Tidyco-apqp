# Next Implementation Sprint

Last updated: 2026-03-21
Timebox: 1 sprint (5-7 working days)
Objective: Improve trust and maintainability before broad feature expansion.

## Progress Snapshot
- [x] Workstream A complete (README + TESTING_STRATEGY truth sync)
- [x] Workstream B complete (Ctrl+S, Ctrl+F, Escape parity + tests)
- [~] Workstream C in progress (operations-dashboard-main.js migrated to delegated actions + regression assertions added)
- [ ] Workstream D pending (cross-module regression additions + full check:all pass)

## Sprint Goal
Ship low-risk, high-impact improvements that align docs, UX promises, and code behavior.

## Priority Order
1. Documentation truth sync
2. Keyboard shortcut parity
3. Inline-handler hardening (targeted)
4. Regression tests for cross-module flows

---

## Workstream A - Documentation Truth Sync (Day 1)

### A1. Update TESTING_STRATEGY.md to match reality
- Replace stale statements claiming 0 tests for auth/db/helpers
- Add current baseline figures and test execution guidance
- Keep examples concise and aligned with current jest setup

### A2. Update README.md planning references
- Replace stale /plans description with the new minimal planning set
- Add pointer to this sprint doc and risk checklist

Done when:
- No contradictory testing claims remain
- New contributor can trust docs without guessing

---

## Workstream B - Keyboard Shortcut Parity (Day 2)

### B1. Decide parity path
- Option 1: Implement Ctrl+S and Ctrl+F globally
- Option 2: Remove these from shortcuts modal until implemented

Recommended: Option 1 for user trust.

### B2. Implement Ctrl+S
- Context-aware save trigger
- No-op safe behavior when no save context exists
- Prevent browser save dialog

### B3. Implement Ctrl+F
- Focus active portal search input when available
- Fall back safely when none exists
- Prevent browser find only when app search is available

### B4. Verify Escape behavior
- Ensure Escape closes active modal consistently
- Ensure behavior does not break inline edits unexpectedly

Done when:
- Shortcuts listed in modal are truly functional
- Tests cover at least one happy path and one no-context path per shortcut

---

## Workstream C - Inline Handler Hardening (Day 3-4)

### C1. Target high-traffic modules first
- portals/operations/js/operations-dashboard-main.js (completed)
- portals/operations/js/operations-dashboard-forecast-view.js
- portals/feedback/js/feedback.js

### C Progress Notes
- Operations dashboard header controls and tab buttons now use `data-action` delegation in `operations-dashboard-main.js`.
- Inline `onclick`/`onchange` handlers were removed from that module's rendered shell.
- Tests updated in `tests/operations-dashboard.test.js` to assert delegated attributes for these controls.

### C2. Migration approach
- Replace inline handlers with data-action + delegated listeners
- Keep action names stable and readable
- Preserve behavior exactly before refactoring further

### C3. Limit scope
- Migrate only obvious interaction clusters in this sprint
- Do not re-architect whole modules yet

Done when:
- Selected files have zero inline onclick/onchange/oninput/onkeydown outputs
- Existing behavior remains unchanged in manual smoke tests

---

## Workstream D - Regression Protection (Day 5)

### D1. Add tests for key cross-module behavior
- Shortcuts behavior
- Tender gate selection lock/unlock rendering path
- Product status -> linked project scope flow

### D2. Run full quality checks
- npm test
- npm run check:all

Done when:
- Full suite passes
- No new check:all regressions

---

## Out of Scope This Sprint
- New family template platform expansion
- Full permissions v2 matrix redesign
- Large MCS redesign follow-ups
- Broad refactors not tied to sprint goals

## Risks
1. Delegation migrations can introduce event-target bugs.
2. Shortcut handling can conflict with input focus contexts.
3. Docs updates can miss niche workflows.

## Mitigations
1. Add focused tests before and after each migration chunk.
2. Reuse isInputFocused() guards and explicit selector scopes.
3. Run quick manual checklist in Hub, Operations, Feedback, NPI.

## Exit Criteria
- Docs are accurate
- Shortcut modal matches reality
- At least 2 major inline-handler files hardened
- Tests and checks all green