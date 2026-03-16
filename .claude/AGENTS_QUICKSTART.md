# Agent Quickstart Guide

Quick reference for using agents in Tidyco APQP development.

## 5-Second Summary

Agents are specialized AI workers that handle specific tasks **while you do other things**. They're especially useful for:
- Searching large codebases
- Running quality checks
- Planning complex features
- Running tests automatically

---

## When Should I Use Agents?

### Use an Agent When:
✅ You need to search across many files
✅ Task can run while you work on something else
✅ Task is complex with multiple steps
✅ You want automated quality checks

### Don't Use an Agent When:
❌ Editing one specific file you can see
❌ Task takes 2 minutes or less
❌ You need immediate feedback for iteration

---

## Quick Commands

### Run Code Quality Checks (Foreground)
```
Agent(
  description="Run all quality checks",
  prompt="Run npm run check:all and report results"
)
```
*Wait for results before proceeding.*

### Search for Patterns (Foreground)
```
Agent(
  subagent_type="Explore",
  description="Find all RLS policies",
  prompt="Search database.md and portals/**/*.sql for RLS policies"
)
```
*Agent finds patterns, returns results.*

### Plan a Feature (Foreground)
```
Agent(
  subagent_type="Plan",
  description="Plan capacity parity feature",
  prompt="Design how to sync ME and PM capacity automatically"
)
```
*Agent provides step-by-step plan.*

### Run Tests in Background (Background)
```
Agent(
  description="Run full test suite",
  prompt="Run npm test and report coverage",
  run_in_background=True
)
```
*Agent runs in background. You get notified when done.*

---

## Readable Agent Examples

### Example 1: Explore Agent
**Goal:** Find all places where we create database queries

```
Agent(
  subagent_type="Explore",
  description="Find all Supabase queries",
  prompt="Search portals/ and core/ for .from().select() patterns. List each file and line number."
)
```

**Agent will return:**
```
Found 24 Supabase queries in 8 files:

✓ core/js/db.js - 5 queries
✓ portals/capacity/db.js - 4 queries
✓ portals/product-development/db.js - 6 queries
...

[Full list with line numbers]
```

---

### Example 2: Plan Agent
**Goal:** Plan a new feature for PFMEA (Process Failure Mode Analysis)

```
Agent(
  subagent_type="Plan",
  description="Plan PFMEA feature implementation",
  prompt="""
  Design a new PFMEA (Process Failure Mode & Effects Analysis) feature for the app.
  Consider:
  1. Database schema needed
  2. Where it fits in the navigation
  3. UI components required
  4. How to sync with other portals
  5. Testing strategy

  Provide step-by-step implementation plan.
  """
)
```

**Agent will return:**
```
## PFMEA Feature Implementation Plan

### Phase 1: Database Setup
1. Create pfmea_items table with fields: mode, effect, cause, severity, occurrence, detection
2. Add RLS policy for authenticated users
3. Create migration script

[Details for each phase...]
```

---

### Example 3: General-Purpose Agent
**Goal:** Research and implement authentication improvements

```
Agent(
  subagent_type="general-purpose",
  description="Research and implement Supabase session management",
  prompt="""
  1. Research current session handling in auth.js
  2. Identify any gaps compared to Supabase best practices
  3. Suggest improvements for session persistence and refresh
  4. Implement recommended changes
  5. Write tests for new session logic
  """
)
```

---

## Running Agents in Parallel

When tasks are **independent**, run them simultaneously:

```
// ✅ Good - these don't depend on each other
Agent(description="Check code style")
Agent(description="Run tests")
Agent(description="Validate database schema")

// ❌ Bad - second depends on first
Agent(description="Search for RLS policies")  // Must complete first
Agent(description="Plan RLS refactoring")     // Needs search results
```

---

## Understanding Agent Output

### Foreground Agent
```
Status: Running "Search for duplicate constants"
[Agent works...]
Status: Complete

Results:
- No duplicate constants found ✓
- Script load order valid ✓
- All state vars in state.js ✓
```

**What to do:** Review results, proceed with your task.

### Background Agent
```
Status: Starting background agent "Run tests"
[Agent runs in background while you work...]

[Later, you get notified:]
Status: Background agent complete "Run tests"
Results: 179 tests passed, 98% coverage ✓
```

**What to do:** Check results when notified.

---

## Common Tasks & Agents

| Task | Agent Type | Example |
|---|---|---|
| Find code patterns | Explore | "Find all modal implementations" |
| Plan feature | Plan | "Design new capacity sync" |
| Check code quality | General | "Run npm run check:all" |
| Search codebase | Explore | "Find all RLS policies" |
| Refactor strategy | Plan | "Plan refactoring of helpers.js" |
| Research | General | "Research Supabase real-time best practices" |

---

## Troubleshooting

### Agent Not Finding What I Need
**Solution:** Be more specific in your prompt
- ❌ "Find stuff"
- ✅ "Find all esc() function calls in portals/"

### Agent Taking Too Long
**Solution:** Use `run_in_background=True` or break into smaller agents
- Split "Find all issues" into "Find style issues" + "Find security issues"

### Agent Results Are Wrong
**Solution:**
1. Review the prompt — was it clear?
2. Check if agent has enough context
3. Simplify the task
4. Resume the agent with corrections: `Agent(..., resume=agent_id)`

---

## Agent ID for Follow-ups

Agents return an `agent_id` that lets you continue work:

```
Agent(description="Search for patterns")
// Returns: agent_id = "agent_001"

// Later, if you need more info:
Agent(description="Find more patterns", resume="agent_001")
// Agent continues with previous context
```

---

## Tips for Efficiency

1. **Use background agents for slow tasks:**
   - Tests (30+ seconds)
   - Database operations
   - Large file searches

2. **Use foreground agents for fast tasks:**
   - Code style checks (< 5 seconds)
   - Small searches
   - Planning and analysis

3. **Run independent agents in parallel:**
   - Multiple style checks
   - Multiple searches
   - Tests + lint together

4. **Provide context in your prompt:**
   - "Search portals/ (not core/) for..."
   - "Consider CLAUDE.md rules about..."
   - "Looking for issues related to capacity..."

---

## Next Steps

- See `.claude/agents.md` for detailed agent documentation
- See `.claude/rules/agents.md` for development patterns
- See `.claude/hooks.md` for automation setup
- Read CLAUDE.md for project context
