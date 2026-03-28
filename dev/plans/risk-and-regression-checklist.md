# Risk and Regression Checklist

Last updated: 2026-03-21
Use this checklist before merging any non-trivial frontend or data-flow change.

## 1. Routing and load-order safety
- [ ] Script order in index.html remains valid
- [ ] No new dependency loaded before its provider
- [ ] navigate() still used for route changes (not window.location hacks)
- [ ] Back navigation behavior still works for portal/sub-tab paths

## 2. State and persistence safety
- [ ] New mutable globals are declared in core/js/state.js
- [ ] Data defaults added to migration path in core/js/db.js
- [ ] Save debounce behavior is preserved
- [ ] Sync badge transitions remain meaningful (saved/saving/error)

## 3. Security and rendering safety
- [ ] User-rendered values in HTML strings pass through esc()
- [ ] No new inline event handlers introduced (onclick/onchange/oninput/onkeydown)
- [ ] Event delegation roots are stable and idempotent
- [ ] Dangerous innerHTML usage is reviewed for escaped interpolation

## 4. Realtime and cleanup safety
- [ ] New subscriptions have explicit cleanup path
- [ ] Leaving section unsubscribes listeners
- [ ] No duplicate subscriptions after repeated navigation

## 5. Tender gate scope safety
- [ ] gate_selections normalization handles invalid indices safely
- [ ] Legacy projects without selections still show full gate checklist
- [ ] Locked selection prevents edits in normal flow
- [ ] Progress/sign-off counts are based on visible selected items

## 6. Permissions safety
- [ ] New sections define canView/canEdit behavior
- [ ] Unauthorized access is blocked in navigation/render path
- [ ] Admin behavior remains full-access

## 7. UX contract safety
- [ ] Keyboard shortcut modal only lists working shortcuts
- [ ] Mobile and desktop layouts verified for touched screens
- [ ] Empty states remain actionable and understandable

## 8. Testing and quality gates
- [ ] Added/updated focused tests for touched modules
- [ ] npm test passes
- [ ] npm run check:all passes
- [ ] Manual smoke test done for affected portals

## 9. Documentation and traceability
- [ ] CHANGELOG entry added for logical change
- [ ] README or strategy docs updated when behavior contract changes
- [ ] README.md and TESTING_STRATEGY.md are both updated when affected by the change
- [ ] OpenWolf anatomy and memory entries updated

## Manual Smoke Test Template
1. Launch app and sign in.
2. Navigate: Hub -> Operations -> Feedback -> Product Development -> Capacity -> Settings.
3. Validate key interactions changed in the PR.
4. Confirm no console errors during route transitions.
5. Confirm data still persists and reloads as expected.

## Merge Blockers
If any of these occur, do not merge:
- check:all failures
- broken route rendering
- unescaped user HTML in changed files
- shortcut modal advertising non-working shortcuts