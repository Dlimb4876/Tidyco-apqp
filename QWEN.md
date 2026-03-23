# QWEN.md — Tidyco APQP Quality Tool

## Project Overview

**Tidyco APQP** is a Manufacturing Engineering web application for managing rail overhaul operations. It implements Advanced Product Quality Planning (APQP) Gates 0–5 and broader operational workflows as a Single Page Application (SPA).

**Key Characteristics:**
- **Type:** Vanilla JavaScript SPA (no build pipeline)
- **Backend:** Supabase v2 (PostgreSQL + Auth + Row Level Security)
- **UI Libraries:** Chart.js v4.4.0 for data visualization
- **Typography:** IBM Plex Sans/Mono via Google Fonts
- **Testing:** Jest 30 + jsdom
- **Linting/Formatting:** ESLint 9 + Prettier

**Core Purpose:** Enables engineering teams to manage product development lifecycles, capacity planning, production scheduling, and quality documentation in a unified, real-time collaborative environment.

---

## Building and Running

### Prerequisites

- Node.js (for dev tools only — app runs in browser)
- Modern web browser (Chrome, Firefox, Edge)

### Installation

```bash
npm install          # Installs Jest, ESLint, and other dev dependencies
```

### Running the Application

Since this is a static SPA, serve the files using any HTTP server:

```bash
# Option 1: Using npx (no installation required)
npx serve .

# Option 2: Using Python
python -m http.server 8000

# Option 3: Using VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Then open `http://localhost:3000` (or your chosen port) in a browser.

### Running Tests

```bash
npm test                    # Run all tests (179 tests, ~2.5s)
npm test -- --watch         # Watch mode for development
npm test -- tests/navigation.test.js  # Run specific test file
```

### Quality Checks

```bash
npm run check:all           # Run all quality checks before committing

# Individual checks:
npm run check:load-order    # Verify script load order in index.html
npm run check:syntax        # Validate JavaScript syntax
npm run check:rls           # Check RLS policy coverage
npm run check:subscriptions # Audit real-time subscription cleanup
npm run check:mobile        # Verify mobile breakpoints in CSS
npm run check:modals        # Check modal state management
npm run check:state         # Track global state variables
npm run check:coverage      # Report test coverage

# Linting and formatting (NPI files only):
npm run lint:npi
npm run format:npi
```

---

## Project Structure

```
tidyco-apqp/
├── index.html                  # App entry point — ALL script/CSS load order defined here
├── package.json                # Dependencies and npm scripts
├── jest.config.js              # Jest test configuration
├── eslint.config.js            # ESLint configuration
├── .prettierrc                 # Prettier formatting rules
│
├── core/                       # System engine and global styling
│   ├── css/
│   │   ├── main.css            # Global variables, typography, SPA shell layout
│   │   └── components.css      # Shared UI: modals, buttons, cards, tables
│   └── js/
│       ├── app.js              # Entry point and session initialisation
│       ├── auth.js             # Supabase authentication (login/logout)
│       ├── db.js               # Persistence and data migration
│       └── state.js            # Global state and constant definitions
│
├── utils/                      # Shared utilities
│   ├── js/
│   │   ├── helpers.js          # esc(), modal management, UI utils
│   │   ├── navigation.js       # Hash-based routing and render switchboard
│   │   └── realtime.js         # Real-time subscription helpers
│   └── css/
│
├── portals/                    # Feature portals (accessible from Hub)
│   ├── hub/                    # Operations Portal — landing page
│   ├── capacity/               # Load Capacity Management (ME & PM streams)
│   ├── product-development/    # NPI (APQP) and Product Management
│   ├── production/             # Production planning and scheduling
│   ├── productmgmt/            # Central product registry
│   ├── bugs/                   # Bug reports (real-time)
│   ├── feedback/               # Feedback and bug reporting
│   ├── operations/             # Operations dashboard
│   └── settings/               # App settings (families, work areas)
│
├── tests/                      # Jest test files
│   ├── navigation.test.js      # Hash routing tests (38 tests)
│   ├── production.test.js      # Production portal tests
│   ├── bugs.test.js            # Bug reports tests
│   └── ...
│
├── scripts/                    # Custom quality check scripts
│   ├── load-order-checker.js
│   ├── syntax-validator.js
│   ├── rls-policy-checker.js
│   ├── subscription-cleanup-auditor.js
│   ├── mobile-breakpoint-verifier.js
│   ├── modal-state-auditor.js
│   ├── state-variable-tracker.js
│   └── test-coverage-reporter.js
│
├── plans/                      # Pending plans and active implementation specs
│   ├── MASTER_PLAN.md
│   └── ...
│
├── docs/                       # Durable guides, setup docs, and references
│   ├── reference/
│   ├── guides/
│   └── setup/
│
└── coverage/                   # Test coverage reports (generated)
```

---

## Portals

The application is organized into discrete portals, all accessible from the central Hub:

| Portal | Route | Description |
|--------|-------|-------------|
| **Hub** | `hub` | Operations Portal — landing page with navigation to all portals |
| **Capacity** | `capacity` | Load Capacity Management (Production & ME streams) |
| **Product Development** | `product-development` | NPI (APQP) and Product Management |
| **Production** | `production` | Production planning, scheduling, and plan views |
| **Product Management** | `productmgmt` | Central product registry |
| **Bug Reports** | `bugreports` | Bug and issue reporting (real-time) |
| **Feedback** | `feedback` | Feedback and bug reporting interface |
| **Operations** | `operations` | Operations dashboard |
| **Settings** | `settings` | App configuration (families, work areas) |

---

## Key Conventions

### Script Load Order

**Critical:** Scripts must load in dependency order in `index.html`. Layer order:

```
state.js → auth.js → db.js → helpers.js → navigation.js → realtime.js → [portals] → app.js
```

Dependencies load before dependents. Adding new scripts requires inserting them at the correct position.

### Global State Management

All global state lives in `core/js/state.js` with default values:
- Use `let` for mutable state
- Use `const` for fixed constants
- Never create state variables in other files

Key state variables include:
- `db` — Main data store (projects array)
- `progId` — Active project ID
- `currentSection` — Current portal/section
- `currentUser` — Authenticated user info
- Various tab state variables (`apqpTab`, `capacityTab`, etc.)

### Coding Style

**JavaScript:**
- No semicolons (per `.prettierrc`)
- Single quotes for strings
- 2-space tab indentation
- 100 character max line width
- No trailing commas

**CSS:**
- Kebab-case class names (`.my-class`)
- Use CSS variables (`--var`) for colors and spacing
- Mobile-first with media queries at 767px and 768px breakpoints

### Security Patterns

1. **XSS Prevention:** Always use `esc(value)` from `helpers.js` when interpolating user input into HTML
2. **RLS (Row Level Security):** All authenticated users see all data — never filter by `user_id`
3. **Subscription Cleanup:** Store real-time subscription refs and call `removeRealtimeSubscription(ref)` when navigating

---

## Development Practices

### Adding New Features

1. Add `<script>` / `<link>` to `index.html` in correct dependency order
2. Add new state variables to `core/js/state.js` with defaults
3. Add routing case to `render()` in `utils/js/navigation.js`
4. Implement real-time subscription with cleanup
5. Write mobile-first CSS with both breakpoints required
6. Write tests in `tests/`
7. Run `npm run check:all && npm test`

### Mobile-First CSS

All new CSS must include responsive breakpoints:

```css
/* Default: Desktop (1200px+) */
.my-component { display: grid; grid-template-columns: repeat(3, 1fr); }

/* Tablet (768px–1199px) */
@media (min-width: 768px) and (max-width: 1199px) {
  .my-component { grid-template-columns: repeat(2, 1fr); }
}

/* Mobile (max-width: 767px) */
@media (max-width: 767px) {
  .my-component { grid-template-columns: 1fr; }
}
```

### Testing Practices

- Test behavior, not implementation
- Mock external dependencies (Supabase, DOM)
- Keep tests fast, isolated, and deterministic
- Prioritize critical paths and complex logic
- Test files mirror source files: `<module>.test.js`

### Common Mistakes to Avoid

1. **Duplicate `const` in same scope** — Causes silent SyntaxError, entire file fails
2. **Missing subscription cleanup** — Leads to memory leaks
3. **Wrong script load order** — Dependencies must load first
4. **Hardcoded values** — Use constants in `state.js` or `npi-constants.js`
5. **Skipping mobile breakpoints** — All CSS must be responsive
6. **Direct `window.location.hash`** — Use `navigate()` for proper cleanup

---

## Data Model

### Core Entities

- **Project:** Root object containing metadata (customer, unit, family) and child arrays
- **CTQ:** Critical-to-Quality requirements (id, req, spec, testMethod)
- **PFD:** Process Flow steps with `bomRefs` and `ctqIds`
- **PFMEA:** Nested structure: Failure Mode → Effects → Causes (with RPN/Action history)
- **BOM:** Categorised into `parts`, `tools`, `equip`, `mat`, `cons`, and `kits`

### APQP Gates

Six gates (0–5) defined in `state.js`:

| Gate | Name | Phase |
|------|------|-------|
| 0 | Pre-Planning | Concept |
| 1 | Plan and Define | Requirements |
| 2 | Product Design & Development | Design |
| 3 | Process Design & Development | Process |
| 4 | Product & Process Validation | Validation |
| 5 | Feedback & Corrective Action | Production |

### RPN Calculation

- **Formula:** `RPN = SEV × OCC × DET`
- **Thresholds:** High RPN ≥ 100 (amber/red badges)
- **Forecast RPN:** `SEV × New OCC × New DET`

---

## Navigation System

### URL Hash Format

```
#p=<uuid>&s=<section>&t=<tab>&ct=<capacity-tab>&pt=<production-tab>
```

**Parameters:**
- `p` — Project UUID
- `s` — Section/portal (hub, capacity, production, etc.)
- `t` — APQP sub-tab (ctq, pfd, pfmea, cp)
- `ct` — Capacity sub-tab (root, me, overhaul, projects)
- `pt` — Production sub-tab (root, products, scheduling)

### Navigation Functions

```javascript
navigate('capacity', { ct: 'me' })     // Primary navigation with subscription cleanup
navigateBack()                          // Smart back navigation
setApqpTab('pfmea')                     // Change APQP tab without full navigation
goHome()                                // Navigate to current project home
goProjects()                            // Navigate to projects list
```

Always use `navigate()` instead of directly setting `window.location.hash` to ensure proper subscription cleanup.

---

## External Dependencies

| Library | Source | Purpose |
|---------|--------|---------|
| Supabase JS v2 | CDN | Authentication and remote persistence |
| Chart.js v4.4.0 | CDN | Capacity charts and RPN trend charts |
| IBM Plex Sans/Mono | Google Fonts | Typography |

---

## Documentation Files

| File | Purpose |
|------|---------|
| **README.md** | Project overview and architecture |
| **CLAUDE.md** | AI worker reference (conventions, checklists, state vars) |
| **TESTING_STRATEGY.md** | Jest testing patterns and module guides |
| **CHANGE_CHECKLIST.md** | Pre-commit checklist by change type |
| **SKILLS_GUIDE.md** | npm script skills detailed explanation |
| **SKILLS_QUICK_REFERENCE.txt** | Quick lookup card for npm scripts |
| **plans/** | Architecture docs and feature plans |

---

## Getting Started as an AI Worker

1. **Read CLAUDE.md first** — Primary reference for conventions and workflows
2. **Understand the architecture** — Review core files and data flow
3. **Follow the Feature Addition Checklist** — Complete workflow guide
4. **Avoid common mistakes** — Read the "Common Mistakes" section
5. **Write tests** — See TESTING_STRATEGY.md for patterns
6. **Update documentation** — Keep CLAUDE.md and README.md current

---

## Key Commands Summary

```bash
# Development
npm install              # Install dependencies
npm test                 # Run all tests
npm test -- --watch      # Watch mode

# Quality Checks
npm run check:all        # All checks
npm run check:load-order # Script dependencies
npm run check:syntax     # JavaScript validation
npm run check:rls        # RLS policy coverage
npm run check:subscriptions  # Subscription cleanup audit
npm run check:mobile     # Mobile breakpoints
npm run check:modals     # Modal state management
npm run check:state      # Global state tracking
npm run check:coverage   # Test coverage report

# Linting
npm run lint:npi         # Lint NPI files
npm run format:npi       # Format NPI files
```
