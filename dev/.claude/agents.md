# Claude Agents for Tidyco APQP

This guide documents specialized agents and when to use them for maximum efficiency.

## Available Agent Types

### 1. Explore Agent
**Best for:** Codebase exploration, file discovery, understanding patterns

**When to use:**
- Finding all instances of a pattern across files
- Discovering how a feature is implemented
- Understanding architecture and dependencies
- Searching for similar code patterns

**Example trigger:**
```
Agent(subagent_type="Explore", description="Find all Supabase queries in codebase", ...)
```

**Speed levels:**
- `quick` — basic searches, single directory
- `medium` — moderate exploration across multiple locations
- `very thorough` — comprehensive analysis with multiple naming conventions

---

### 2. Plan Agent
**Best for:** Architecture design, implementation planning, refactoring strategies

**When to use:**
- Planning a new feature implementation
- Designing database schema changes
- Planning refactoring for complex modules
- Architectural decisions with multiple options
- Breaking down large tasks into steps

**Example trigger:**
```
Agent(subagent_type="Plan", description="Design capacity data structure", ...)
```

**Output:** Step-by-step implementation plan with critical files identified

---

### 3. General-Purpose Agent
**Best for:** Complex multi-step tasks, research, code generation

**When to use:**
- Researching libraries or patterns
- Executing complex, autonomous workflows
- Tasks combining search, analysis, and code generation
- When unsure which specialized agent fits

**Example trigger:**
```
Agent(subagent_type="general-purpose", description="Research and implement JWT authentication", ...)
```

---

### 4. Claude API Agent
**Best for:** Building apps that use Claude API or Anthropic SDKs

**When to use:**
- Implementing features that call Claude API
- Building custom integrations with Anthropic SDKs
- Using Agent SDK for automation
- Features importing `anthropic` or `@anthropic-ai/sdk`

---

## When to Use Agents vs. Direct Work

### Use an Agent if:
✅ Task requires searching multiple files or patterns
✅ Task is multi-step and complex
✅ You need to plan before implementing
✅ Task requires exploring unfamiliar code
✅ Task can run autonomously while you work on other things

### Do Direct Work if:
✅ Modifying a specific, known file
✅ Task is small and focused (< 5 steps)
✅ You need immediate feedback/iteration
✅ Debugging or testing a specific fix
✅ Working with files you just read

---

## Agent Parallelization

Run independent agents in parallel to maximize efficiency:

```javascript
// ✅ Good - independent tasks run in parallel
Agent(description="Search for form validation patterns", ...)
Agent(description="Find all database migrations", ...)
Agent(description="Review security patterns", ...)

// ❌ Bad - these depend on each other
Agent(description="Find BOM tables")  // Must complete first
Agent(description="Plan BOM refactoring")  // Depends on previous search
```

---

## Best Practices

### Be Specific
**Bad:** "Find stuff in the codebase"
**Good:** "Find all instances of real-time subscription creation and identify patterns"

### Include Context
Agents work better with context:
```
Agent(description="Explore portals/ to find capacity sync patterns",
  prompt="Search for capacity data patterns and identify how each department stream manages its data")
```

### Use Foreground for Dependencies
```
// ❌ Wrong - next step depends on results
research_agent = Agent(...)
implementation_agent = Agent(...)  // Can't know what to implement yet

// ✅ Correct - wait for research, then plan implementation
research_results = Agent(...)  // Foreground
plan_results = Agent(..., resume=research_id)  // Uses research output
```

### Use Background for Independence
```
// Can run while you work on other tasks
testing_agent = Agent(run_in_background=True, ...)  // Runs in background
Notify when complete, then review results
```

---

## Common Agent Tasks for Tidyco

### Code Quality Checks
```
Agent(subagent_type="Explore", description="Find and analyze all duplicate const declarations")
```

### Feature Planning
```
Agent(subagent_type="Plan", description="Plan capacity implementation for a department stream")
```

### Codebase Onboarding
```
Agent(subagent_type="Explore", description="Map portal structure and understand how sections connect")
```

### Migration Planning
```
Agent(subagent_type="Plan", description="Plan schema migration for new PFMEA fields")
```

### Pattern Discovery
```
Agent(subagent_type="Explore", description="Find all modal implementations and identify reuse opportunities", thoroughness="very thorough")
```

---

## Agent Output Tips

- **Foreground agents** return results to your conversation — review before next steps
- **Background agents** notify you when done — no need to poll
- Agents can be resumed with `resume=agent_id` if you need follow-ups
- Save agent IDs if you plan to resume later

---

## Integration with CI/CD

Agents support automation hooks. Future setup can include:
- Auto-run code quality agents on PR
- Auto-validate test coverage
- Auto-generate changelog from commits

See `.claude/hooks.md` for automation patterns.

---

## Sample Agent Implementations

Three minimal Node.js scripts have been added to `.claude/agents/` as working stand-ins for the agent names referenced in `mcp.json`:

- **`.claude/agents/code-review.js`** — runs lint + tests, outputs JSON, writes a dated log.
- **`.claude/agents/testing.js`** — runs `npm test` and outputs a JSON summary.
- **`.claude/agents/debugging.js`** — reads a JSON failure payload from stdin and returns heuristic diagnostics.

Each script:
- accepts an optional JSON payload on stdin
- exits with code `0` on success, `1` on failure
- prints a machine-readable JSON object (`title`, `status`, `summary`) to stdout

These scripts are **non-destructive** — they only run read-only operations (lint, test) and write logs to `.claude/agents/logs/`.

For full setup and testing instructions see `.claude/README.md`.
