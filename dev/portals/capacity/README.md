# Capacity Portal

The Capacity portal provides capacity planning and management for multiple departments across the organisation. It includes team management, task tracking, product support planning, and visual capacity charts.

## Overview

This module supports five distinct capacity streams:

| Stream | Code | Description |
|--------|------|-------------|
| Production | `production` | Production line capacity by work area |
| Manufacturing Engineering | `me` | Engineering resource planning |
| Project Management | `pm` | Project resource allocation |
| Logistics | `log` | Logistics and kitting capacity |
| Unit 6 | `unit6` | Unit 6 specific capacity planning |

## Folder Structure

```
portals/capacity/
├── js/
│   ├── capacity.js           # Portal entry point and hub navigation
│   ├── capacity-events.js    # Delegated event handling for all streams
│   └── modals.js             # Capacity-specific modal dialogs
├── css/
│   └── capacity.css          # Stream-specific styles
├── me/                       # Manufacturing Engineering (ME)
│   ├── js/
│   │   ├── me-capacity.js    # ME orchestrator/render coordinator
│   │   ├── me-data.js        # ME data facade (thin bootstrap layer)
│   │   ├── me-data-*.js      # Extracted ME data modules
│   │   └── me-*.js           # ME tab renderers (chart, tasks, products, etc.)
├── project-management/       # Project Management (PM)
│   ├── js/
│   │   ├── pm-capacity.js    # PM orchestrator
│   │   ├── pm-data.js        # PM data module
│   │   └── pm-data-relational.js # PM relational persistence
│   └── css/
│       └── pm-capacity.css   # PM-specific styles
├── logistics/                # Logistics (LOG)
│   ├── js/
│   │   ├── log-capacity.js   # Logistics orchestrator
│   │   ├── log-data.js       # Logistics data module
│   │   └── log-data-relational.js
├── unit6/                    # Unit 6 (UNIT6)
│   ├── js/
│   │   ├── unit6-capacity.js # Unit 6 orchestrator
│   │   ├── unit6-data.js     # Unit 6 data module
│   │   └── unit6-data-relational.js
├── production/               # Production capacity
│   ├── js/
│   │   ├── prod-capacity.js          # Production entry point
│   │   ├── prod-capacity-dashboard.js # Dashboard view
│   │   ├── prod-capacity-workarea.js  # Work area detail
│   │   ├── prod-capacity-detail.js    # Detailed capacity view
│   │   ├── prod-capacity-settings.js  # Settings/configuration
│   │   ├── prod-capacity-data.js      # Data layer
│   │   └── work-areas-data.js         # Work areas data
│   └── css/
│       └── prod-capacity.css # Production-specific styles
└── shared/                   # Shared components across all streams
    ├── js/
    │   ├── cap-*.js          # Shared renderers (cap-tasks, cap-products, etc.)
    │   ├── cap-calculations.js   # Shared calculation logic
    │   ├── cap-components.js     # Shared UI components
    │   ├── cap-data-utils.js     # Data utilities
    │   └── cap-utils.js          # General utilities
    └── css/
        ├── cap-*.css         # Shared styles (shell, tables, charts, heatmaps)
        └── cap-responsive.css    # Responsive breakpoints

```

## Key Concepts

### Capacity Streams
Each department has its own capacity stream with:
- **State management**: Stream-specific data stores (teams, tasks, products, holidays)
- **Data API**: Standardised CRUD operations (e.g., `meDataGet`, `pmDataSave`)
- **Orchestrator**: Renders tabs and coordinates between shared components
- **Relational layer**: Maps between UI state and database schema

### Shared Components
Components in `shared/` are stream-agnostic and work across all capacity types:
- `cap-tasks.js` - Task list rendering and editing
- `cap-products.js` - Product support table with bulk editing
- `cap-holidays.js` - Holiday planner calendar
- `cap-chart.js` - Capacity chart with KPI cards
- `cap-heatmap.js` - Availability heatmap
- `cap-dashboard.js` - Summary dashboard

### Data Flow
1. **Orchestrator** calls shared renderer with stream context
2. **Shared renderer** uses data API to read/write state
3. **Data API** manages in-memory state and persists to Supabase
4. **Relational layer** converts between UI objects and database rows
5. **Realtime subscriptions** keep data synchronised across windows

## State Management

Each stream maintains its own state:
```javascript
// ME example (other streams follow same pattern)
window.meDataState = {
  team: [],           // Team members
  tasks: [],          // Capacity tasks
  products: [],       // Product support data
  holidays: [],       // Holiday entries
  productSupportHistory: []  // Historical support values
}
```

## Events

Capacity uses delegated event handling via `capacity-events.js`:
- Data attributes drive actions: `data-cap-action="cap-set-tab"`
- Context-aware: `data-cap-context="me|pm|log|unit6"`
- Focus preservation during re-renders for search inputs

## API Conventions

### Stream Data APIs
Each stream exports a consistent API:

| Function | Purpose |
|----------|---------|
| `*DataGet()` | Get full state object |
| `*DataSave()` | Persist to database |
| `*DataAddTask()` / `*DataUpdateTask()` / `*DataDeleteTask()` | Task CRUD |
| `*DataAddTeam()` / `*DataUpdateTeam()` / `*DataDeleteTeam()` | Team CRUD |
| `*DataUpdateProduct()` | Update product support values |
| `*DataInit()` | Initialise from database |
| `*DataReset()` | Reset to defaults |

### Naming Patterns
- `me*` / `pm*` / `log*` / `unit6*` - Stream-specific functions
- `cap*` - Shared/cross-stream functions
- `render*` / `draw*` - Rendering functions

## Testing

Test files follow the naming convention:
```
tests/me-data-core.test.js
tests/pm-capacity.test.js
tests/log-capacity.test.js
tests/capacity-events.test.js
```

Run tests with:
```bash
npm test -- tests/capacity-events.test.js  # Specific suite
npm test                                   # All tests
```

## Database Schema

Key tables per stream:
- `{stream}_teams` - Team member definitions
- `{stream}_tasks` - Capacity tasks
- `{stream}_products` - Product support configuration
- `{stream}_product_support_history` - Historical support values
- `{stream}_holidays` - Holiday/non-working days

Streams: `me`, `pm`, `logistics`, `unit6`

## Adding a New Stream

1. Create folder `portals/capacity/{stream}/`
2. Implement `{stream}-capacity.js` orchestrator
3. Implement `{stream}-data.js` with standard API
4. Add data-context handlers in `capacity-events.js`
5. Update `capacity.js` hub cards and navigation
6. Add tests in `tests/{stream}-capacity.test.js`

## Related Documentation

- `plans/me-data-modularisation-plan.md` - ME data layer refactor history
- `plans/capacity-independance.md` - Shared component extraction roadmap
- `docs/reference/` - User-facing feature guides
