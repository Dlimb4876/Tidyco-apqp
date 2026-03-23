# MCP Tools Configuration

## Available MCP Servers

### Serena (oraios/serena)
**Status:** Active  
**Config:** `.mcp.json`

**Available Tools:**
- `find_symbol` — Find specific symbols/functions/classes in the codebase
- `get_symbols_overview` — Get overview of all symbols in a file or directory
- `search_for_pattern` — Search for code patterns using regex
- `replace_symbol_body` — Replace the implementation of a symbol
- `insert_after_symbol` — Insert code after a specified symbol

**Usage:**
- Use Serena tools for **all codebase exploration and editing**
- Only fall back to `Read`, `Grep`, `Glob`, or `Edit` when Serena cannot handle the task:
  - Non-code files (markdown, JSON, CSS, HTML)
  - Partial-line edits within a large symbol
  - Multi-file operations that span unrelated symbols

**Example:**
```
# Find a function
find_symbol: "hubInit"

# Search for a pattern
search_for_pattern: "function.*Init\(\)"

# Replace a symbol's implementation
replace_symbol_body: "renderHub" with new content

# Insert after a symbol
insert_after_symbol: "hubInit" with new function
```

---

## OpenWolf Protocol

**Config:** `.wolf/OPENWOLF.md`

**Key Requirements:**

### File Navigation
1. Check `.wolf/anatomy.md` BEFORE reading any file
2. Use anatomy descriptions when sufficient (saves tokens)
3. Update anatomy.md when discovering new files

### Code Generation
1. Read `.wolf/cerebrum.md` before generating code
2. Check `## Do-Not-Repeat` section
3. Follow `## Key Learnings` and `## User Preferences`

### After Actions
1. Append to `.wolf/memory.md` after every significant action:
   `| HH:MM | description | file(s) | outcome | ~tokens |`
2. Update `.wolf/anatomy.md` after creating/deleting/renaming files

### Bug Logging
Log to `.wolf/buglog.json` when:
- User reports an error or bug
- A test/command fails
- You fix something broken
- You edit a file more than twice to get it right

**Bug format:**
```json
{
  "id": "bug-NNN",
  "timestamp": "ISO date",
  "error_message": "exact error or user complaint",
  "file": "file that was fixed",
  "root_cause": "why it broke",
  "fix": "what you changed to fix it",
  "tags": ["relevant", "keywords"],
  "related_bugs": [],
  "occurrences": 1,
  "last_seen": "ISO date"
}
```

### Cerebrum Updates (MANDATORY)
Update `.wolf/cerebrum.md` when you learn:
- User preferences (corrections, style, workflow)
- Project conventions
- Framework-specific patterns
- Gotchas and mistakes (add to `## Do-Not-Repeat`)
- Architectural decisions (add to `## Decision Log`)

---

## Workflow Summary

```
1. Check .wolf/anatomy.md → 2. Use Serena tools → 3. Update memory/buglog/cerebrum
```
