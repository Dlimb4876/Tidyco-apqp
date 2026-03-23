# Code Style & Critical Rules

## Scope
This file covers style-oriented conventions only. Core guardrails (script order, state ownership, `esc()`, `navigate()`, parity, RLS, and changelog process) are owned by `.github/copilot-instructions.md`.

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
