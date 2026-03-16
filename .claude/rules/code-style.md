# Code Style & Critical Rules

## Script Load Order
The `index.html` file is the source of truth for dependency order. Layer scripts correctly to ensure dependencies load before dependents:

```
state.js → auth.js → db.js → helpers.js → navigation.js → realtime.js → [portals] → app.js
```

**Action**: When adding new `<script>` tags, insert them in the correct position based on their dependencies.

## No Duplicate Constants in Same Scope
A duplicate `const` declaration in the same scope causes a **SyntaxError that silently kills the entire file**. All functions in that file become `undefined` at runtime with no console warning.

**Prevention**: Lint strictly. Check file before relying on any function from it.

## Global State Management
All global state must live in `core/js/state.js` with a default value:
- Use `let` for mutable state
- Use `const` for fixed values (constants)
- **Never** create state variables in other files

**Example**:
```javascript
// In state.js
let currentProgramme = null;
const GATE_DEFS = { ... };
```

## Mobile-First CSS
All new CSS must use mobile-first design with two breakpoints:
- `@media (max-width: 767px)` — mobile styles (375px base)
- `@media (min-width: 768px)` — desktop styles

Write mobile styles first, then add desktop overrides.

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

## Documentation Location
- **Plans and architecture docs** go in `plans/` folder
- **Never** place documentation at repo root (unless it's CLAUDE.md, README.md, or similar core files)

## Naming Conventions
- Use camelCase for variables and functions
- Use SCREAMING_SNAKE_CASE for constants
- Use PascalCase for classes/constructors
