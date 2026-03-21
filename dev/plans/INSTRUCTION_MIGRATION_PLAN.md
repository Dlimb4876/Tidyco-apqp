# Instruction Token Optimization Migration Plan

## Goal
Lower always-loaded instruction/context tokens with zero behavior regression.

## Baseline (Measured)
- Approx key instruction footprint: ~11.6k tokens.
- Largest files: `.wolf/OPENWOLF.md`, `.claude/rules/agents.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.wolf/cerebrum.md`, `.wolf/anatomy.md`.

## Success Criteria
1. Reduce baseline instruction load to 5k-7k tokens.
2. Preserve all critical guardrails (load order, state, escaping, routing cleanup, capacity parity).
3. Keep test and quality checks unchanged.

## Rollout Stages

### Stage 0: Freeze and Snapshot
1. Record current token baseline and file sizes.
2. Mark canonical owner for each rule family (see ownership map).
3. No behavior changes.

### Stage 1: Core Compression (Safe)
1. Compress `.github/copilot-instructions.md` to router + hard rules only.
2. Keep `CLAUDE.md` as beginner-context + short pointers.
3. Remove long duplicated examples from both files.

Expected savings: 1.2k-2.0k tokens.

Validation:
- Manual instruction sanity pass.
- `npm test`
- `npm run check:all`

### Stage 2: Dedup Domain Rules
1. Keep one canonical detail file per domain (`security`, `database`, `navigation`, `realtime`, `components`, `testing`, `capacity`).
2. Replace repeated paragraphs in non-owner files with one-line pointers.
3. Ensure `applyTo` scoped instructions remain scoped.

Expected savings: 1.0k-2.0k tokens.

Validation:
- Spot-check at least one workflow per domain.
- `npm test`
- `npm run check:all`

### Stage 3: OpenWolf Context Hygiene
1. Keep `.wolf/anatomy.md` compact (high-signal summary only).
2. Keep `.wolf/cerebrum.md` concise; archive stale notes.
3. Keep `.wolf/OPENWOLF.md` operational checklist only (move narrative text to docs).

Expected savings: 1.0k-2.0k tokens.

Validation:
- Confirm required OpenWolf steps still explicit.
- Run a normal edit task and verify no missed checklist steps.

### Stage 4: Long-Term Maintenance
1. Add instruction lint rule: no duplicate ownership blocks.
2. Add quarterly token audit script for instruction files.
3. Archive historical changelog blocks if required by tooling context size.

## Risk Register
1. Risk: accidental deletion of critical rule text.
- Mitigation: owner map + staged changes + validation after each stage.

2. Risk: ambiguity from over-compression.
- Mitigation: keep concise examples only in canonical domain files.

3. Risk: OpenWolf protocol drift.
- Mitigation: preserve explicit checklist bullets in owner file and verify on one live task.

## Execution Order (Recommended)
1. Stage 1 in one PR.
2. Stage 2 in one PR.
3. Stage 3 in one PR.
4. Stage 4 as follow-up automation.

## Rollback Plan
- Revert last stage only if regression appears.
- Keep each stage isolated to make rollback low risk.
