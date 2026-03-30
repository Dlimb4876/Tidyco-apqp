# Tidyco APQP Core Router

## OpenWolf
- Follow `.wolf/OPENWOLF.md` each session.
- Check `.wolf/anatomy.md` before reading project files.
- Check `.wolf/cerebrum.md` before generating code.

## User Context
- The primary user is non-technical. Use plain language and avoid jargon.
- For multi-step work, use a todo list and move one step at a time.

## Project Snapshot
- Vanilla JavaScript SPA with no build pipeline.
- Backend: Supabase (Auth, Postgres, Realtime).
- Script and style load order source of truth is `index.html`.

## Hard Rules
1. Use named ESM imports for every cross-file dependency. No `window.*` assignment bridges for module wiring.
2. Never introduce duplicate `const` in the same scope.
3. Keep global mutable state in `core/js/state.js` with defaults.
4. Use `esc()` for user data rendered into HTML strings.
5. Use `navigate()` for route changes so realtime cleanup runs.
6. Do not filter client queries by `user_id` (auth-only RLS model).
7. Keep new plans/docs in `plans/` unless it is a core root doc.
8. Use mobile-first CSS with both breakpoints:
	 - `@media (max-width: 767px)`
	 - `@media (min-width: 768px)`
9. When adding or changing a feature on any content page, update the matching entry in `GUIDE_CONTENT` inside `utils/js/guide.js` to reflect the change.
10. Add a brief comment explaining *why* code was added or changed (bug fix, new feature, optimization, workaround, etc.). See `.claude/rules/code-style.md` for details.

## Validation Commands
- `npm install` (fresh clone only)
- `npm test`
- `npm run check:all`

## Changelog Rule
- After each logical change, add one entry near the top of `CHANGELOG.md` using:
	`## YYYY-MM-DD | Short title | Reason`

## Tooling
- Use Serena tools (`find_symbol`, `get_symbols_overview`, `search_for_pattern`, `replace_symbol_body`, `insert_after_symbol`) for all codebase exploration and editing.
- Only fall back to `Read`, `Grep`, or `Edit` when Serena cannot handle the task (e.g. non-code files, partial-line edits within a large symbol).

## Scoped Detail Owners
- Core guardrails: `.github/copilot-instructions.md`
- Testing details: `.github/instructions/testing.instructions.md`
- Code style & comments: `.claude/rules/code-style.md`
- Security: `.claude/rules/security.md`
- Database and RLS: `.claude/rules/database.md`
- Navigation: `.claude/rules/navigation.md`
- Realtime: `.claude/rules/realtime.md`
- Components: `.claude/rules/components.md`
