# Instruction Core Minimal Spec

## Goal
Reduce always-loaded instruction tokens while preserving behavior-critical guardrails.

## Proposed Core File
Create one canonical always-on file:
- `.github/copilot-instructions.md` (short router + non-negotiables only)

Target size:
- 350-700 tokens

## Keep In Core (Always On)
1. Project snapshot in 3-5 bullets (vanilla JS SPA, Supabase, no build pipeline).
2. Non-negotiables only:
- Script load order source of truth is `index.html`.
- No duplicate `const` in same scope.
- All global state belongs in `core/js/state.js`.
- Escape user content with `esc()` in HTML strings.
- Use `navigate()` for route changes to protect realtime cleanup.
- Capacity ME/PM parity rule.
3. Changelog requirement (single short bullet).
4. Validation commands list (short):
- `npm test`
- `npm run check:all`
5. Routing note to scoped instruction files (no duplicated details).

## Move Out Of Core (On-Demand / Scoped)
1. Long examples/snippets -> move to docs (`docs/reference/` or `plans/`).
2. Repeated definitions (RLS details, full routing examples, modal templates) -> keep once in domain files.
3. Agent workflow/how-to content -> remove from always-on rules and keep in `docs/reference/agent-development.md`.
4. OpenWolf narrative text -> keep operational checklist only.

## Canonical Ownership After Trim
- `.github/copilot-instructions.md`: short router + hard guardrails.
- `.github/instructions/testing.instructions.md`: test-only details.
- `.github/instructions/capacity-parity.instructions.md`: capacity-only details.
- `.claude/rules/*.md`: optional reference docs, not duplicated verbatim in core.

## Compact Core Template (Draft)
```md
# Tidyco APQP Core Instructions

## Snapshot
- Vanilla JS SPA (no build pipeline)
- Supabase (Auth + Postgres + Realtime)
- `index.html` controls script order

## Hard Rules
1. Preserve script load order (`state.js -> auth.js -> db.js -> helpers.js -> navigation.js -> realtime.js -> portals -> app.js`).
2. Never introduce duplicate `const` in same scope.
3. Keep global state in `core/js/state.js` with defaults.
4. Use `esc()` for user values rendered into HTML.
5. Use `navigate()` for route changes and realtime cleanup.
6. Keep ME/PM capacity parity unless explicitly excluded.

## Validation
- Run `npm test`.
- Run `npm run check:all`.

## Changelog
- Add one short entry for each logical change.

## Scoped Details
- Capacity-specific: `.github/instructions/capacity-parity.instructions.md`
- Test-specific: `.github/instructions/testing.instructions.md`
```
