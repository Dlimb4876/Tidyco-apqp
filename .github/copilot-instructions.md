# Tidyco APQP - Copilot Instructions

## Scope
Use these rules for all work in this repository. Keep responses and changes in plain language because the primary user is non-technical.

## Snapshot
- Vanilla JavaScript SPA with no build pipeline.
- Supabase backend (Auth, Postgres, Realtime).
- `index.html` controls script load order.

## Non-Negotiables
1. Keep script order exactly: `state.js -> auth.js -> db.js -> helpers.js -> navigation.js -> realtime.js -> portals -> app.js`.
2. Never duplicate `const` in the same scope.
3. Keep global mutable state in `core/js/state.js` with defaults.
4. Use `esc()` for any user data rendered into HTML strings.
5. Use `navigate()` for route changes so realtime cleanup runs.
6. Keep ME and PM capacity parity unless explicitly excluded.
7. Keep auth-only RLS model: do not filter client queries by `user_id`.
8. Keep new docs/plans in `plans/` unless it is a core root doc.
9. Use mobile-first CSS with both breakpoints:
   - `@media (max-width: 767px)`
   - `@media (min-width: 768px)`
10. When adding or changing a feature on any content page, update the matching entry in `GUIDE_CONTENT` inside `utils/js/guide.js` to reflect the change.

## Validation
Run in this order when needed:
1. `npm install` (fresh clone)
2. `npm test`
3. `npm run check:all`

## Changelog
- After each logical change, add a single entry near the top using:
  `## YYYY-MM-DD | Short title | Reason`

## Scoped Details (Canonical)
- Capacity rules: `.github/instructions/capacity-parity.instructions.md`
- Test rules: `.github/instructions/testing.instructions.md`
- Security: `.claude/rules/security.md`
- Database/RLS: `.claude/rules/database.md`
- Navigation: `.claude/rules/navigation.md`
- Realtime: `.claude/rules/realtime.md`
- Components: `.claude/rules/components.md`
