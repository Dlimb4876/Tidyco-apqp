# Tidyco APQP - Copilot Instructions

## Scope
Use these rules for all work in this repository. Keep responses and changes in plain language because the primary user is non-technical.

## Snapshot
- Vanilla JavaScript SPA with no build pipeline.
- Supabase backend (Auth, Postgres, Realtime).
- ESM-first app bootstrap: `index.html` should load a single module entry (`core/js/main.js`).

## Non-Negotiables
1. Use named ESM imports/exports for cross-file dependencies. Do not add `window.*` bridge assignments for module wiring.
2. Never duplicate `const` in the same scope.
3. Keep global mutable state in `core/js/state.js` with defaults.
4. Use `esc()` for any user data rendered into HTML strings.
5. Use `navigate()` for route changes so realtime cleanup runs.
6. Keep auth-only RLS model: do not filter client queries by `user_id`.
7. Keep new docs/plans in `plans/` unless it is a core root doc.
8. Use mobile-first CSS with both breakpoints:
   - `@media (max-width: 767px)`
   - `@media (min-width: 768px)`
9. When adding or changing a feature on any content page, update the matching entry in `GUIDE_CONTENT` inside `utils/js/guide.js` to reflect the change.
10. Add a brief comment explaining *why* code was added or changed (bug fix, new feature, optimization, etc.). See `.claude/rules/code-style.md` for format details.

## Validation
Run in this order when needed:
1. `npm install` (fresh clone)
2. `npm test`
3. `npm run check:all`

## Changelog
- After each logical change, add a single entry near the top using:
  `## YYYY-MM-DD | Short title | Reason`

## Scoped Details (Canonical)
- Test rules: `.github/instructions/testing.instructions.md`
- Code style & comments: `.claude/rules/code-style.md`
- Security: `.claude/rules/security.md`
- Database/RLS: `.claude/rules/database.md`
- Navigation: `.claude/rules/navigation.md`
- Realtime: `.claude/rules/realtime.md`
- Components: `.claude/rules/components.md`
