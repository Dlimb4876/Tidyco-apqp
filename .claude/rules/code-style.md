# Code Style & Critical Rules

## Scope
This file covers style-oriented conventions only. Core guardrails (script order, state ownership, `esc()`, `navigate()`, RLS, and changelog process) are owned by `.github/copilot-instructions.md`.

## ID Generation Pattern
Use prefixed short IDs consistently across the app:

```javascript
const id = 'f_' + Math.random().toString(36).substr(2, 5);
```

**ID Prefixes**:
- `f_` = mode
- `e_` = effect
- `c_` = cause
- `r_` = risk
- `a_` = action

## Save Debouncing
Data is **not persisted to Supabase immediately** after UI edits. Saves debounce at **800–900 ms**. Plan UX with this delay in mind.

## Naming Conventions
- Use camelCase for variables and functions
- Use SCREAMING_SNAKE_CASE for constants
- Use PascalCase for classes/constructors

## Comment Conventions

**Rule: Add a brief comment explaining *why* code was added or changed.**

This helps future developers (and future-you) understand the intent behind code modifications.

### When to comment
- **Bug fix**: Explain what was broken and why this fixes it
- **New feature**: Explain what it does and why it's needed
- **Refactor**: Explain the motivation for the change
- **Workaround**: Explain the limitation being worked around
- **Optimization**: Explain what was slow and how this improves it

### Format
Use a single-line comment above or inline with the code:

```javascript
// Bug fix: Filter out deleted items before rendering to prevent "key not found" errors
const activeItems = items.filter(i => !i.deleted);

// New feature: Track unsaved changes to warn user on nav away
let hasUnsavedChanges = false;

// Optimization: Use Set lookup instead of array.includes() for O(1) instead of O(n)
const validIds = new Set(data.map(d => d.id));
```

### Do not comment
- Self-evident code: `const count = items.length;`
- Comments that just repeat the code: `// Increment x` above `x++`
- Comments that are just noise: `// TODO`, `// FIXME` without context

Keep comments meaningful and concise. One sentence is usually enough.
