# Agent Development Patterns

Guidelines for building and running lightweight repo agents in Tidyco APQP.

## Project Agents

### Code Quality
- Purpose: Validate core guardrails (load order, duplicate `const`, state ownership, `esc()` usage).
- Trigger: Pre-commit and PR review.

### Testing
- Purpose: Validate test health and gaps.
- Trigger: Test changes and PR review.
- Default checks: `npm run check:all`.

### Documentation
- Purpose: Keep docs/rules aligned with real behavior.
- Trigger: Significant rule or architecture changes.

### Database Validation
- Purpose: Validate migrations and auth-only RLS expectations.
- Trigger: Schema and Supabase workflow changes.

## Build Checklist
1. Define scope (inputs, outputs, trigger, dependencies).
2. Define rule checks (owner files, pass/fail criteria).
3. Return structured findings (file, severity, issue, fix suggestion).
4. Keep failures actionable; continue independent checks when possible.

## Output Contract
- `status`: `success | warning | error`
- `checks[]`: `file`, `line` (if known), `severity`, `issue`, `suggestion`
- `summary`: one-line total

## Performance Defaults
- Run independent checks in parallel.
- Use cache where available.
- Suggested timeouts: lint 10s, tests 30s, DB checks 20s.

## Workflow Order
1. Code Quality
2. Testing
3. Security/DB validation (when relevant)
4. Documentation consistency
