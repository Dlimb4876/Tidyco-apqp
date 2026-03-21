# Instruction Rule Ownership Map

## Purpose
Single source of truth for each rule family to eliminate repeated text across multiple instruction files.

## Current Duplication Hotspots
- Core architecture and load order repeated in `CLAUDE.md`, `.github/copilot-instructions.md`, `.claude/rules/code-style.md`.
- Security and RLS repeated in `CLAUDE.md`, `.github/copilot-instructions.md`, `.claude/rules/security.md`, `.claude/rules/database.md`.
- Navigation and realtime repeated in `CLAUDE.md`, `.github/copilot-instructions.md`, `.claude/rules/navigation.md`, `.claude/rules/realtime.md`.
- Changelog process duplicated in `CLAUDE.md` and `.github/copilot-instructions.md`.

## Canonical Owners (Proposed)
1. Core app guardrails
- Owner: `.github/copilot-instructions.md`
- Includes: strict script order, state location, `esc()`, `navigate()`, duplicate `const`, validation command order.

2. Capacity parity details
- Owner: `.github/instructions/capacity-parity.instructions.md`
- Includes: ME/PM synchronization, applyTo scope, edge cases, verification checks.

3. Testing conventions
- Owner: `.github/instructions/testing.instructions.md`
- Includes: test style, mocks, coverage guidance, debugging checks.

4. Security details
- Owner: `.claude/rules/security.md`
- Includes: XSS, input validation, sensitive data handling.

5. Database and RLS details
- Owner: `.claude/rules/database.md`
- Includes: query patterns, auth-only RLS model, batch operation guidance.

6. Routing details
- Owner: `.claude/rules/navigation.md`
- Includes: hash contract, `navigate()` usage, render switchboard pattern.

7. Realtime details
- Owner: `.claude/rules/realtime.md`
- Includes: subscription lifecycle, cleanup, event usage, performance limits.

8. UI component usage
- Owner: `.claude/rules/components.md`
- Includes: modal/table/card/chart/button patterns and accessibility checklist.

9. OpenWolf protocol
- Owner: `.claude/rules/openwolf.md`
- Includes: mandatory OpenWolf operational hooks only.

## Router-Only Files (After Dedup)
- `CLAUDE.md`: short pointer to canonical docs + beginner communication preference.
- `.github/copilot-instructions.md`: enforce hard rules only, no long examples.

## Deletion / Compression Candidates
1. `.claude/rules/agents.md`
- Action: move to `docs/reference/agent-development.md` and keep a 3-5 bullet pointer in rules.

2. Repeated rule blocks in `CLAUDE.md`
- Action: replace large repeated sections with links to canonical owner files.

3. Duplicate changelog sections
- Action: keep changelog policy in one owner file only.

## Mapping Checklist
- Every rule family has exactly one canonical owner.
- Non-owner files contain a one-line pointer, not copied policy text.
- New rule proposals must declare owner file before merge.
