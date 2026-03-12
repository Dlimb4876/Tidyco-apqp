# React ME-Load Capacity Implementation

## Overview

A React version of the Manufacturing Engineering (ME) Load Capacity module has been implemented as a functional experiment. The React version runs **side-by-side** with the existing vanilla JavaScript implementation, sharing the same:
- Supabase database
- CSS styling
- Data persistence layer
- Business logic

This allows for real-time testing and comparison of both implementations without disrupting the existing application.

## Architecture

### No Build Pipeline Required

The implementation uses:
- **React** 18 (UMD build from CDN)
- **ReactDOM** (UMD build from CDN)
- **Babel Standalone** for JSX compilation in the browser

All files are served as static assets—no build step, no bundling, no transpilation required.

```
User's Browser
    ↓
index.html (loads React + Babel from CDN)
    ↓
Static JSX files (.jsx) → Babel compiles to JS
    ↓
React renders to #reactRoot div
```

## Accessing the React Version

### Method 1: Capacity Portal
1. Navigate to **Capacity Management** (from Hub)
2. Click the new **"ME-React"** card (with ⚛️ icon)
3. This directly launches the React version

### Method 2: Toggle Button (within ME Capacity)
1. Navigate to **ME Load Capacity** (vanilla version)
2. Click **"⟳ Try React"** button in the top-right of the topbar
3. Switches to the React version
4. Click **"⟲ Switch to Vanilla"** in the React version to switch back

## File Structure

```
portals/capacity/
├── js/
│   ├── me-capacity-react.js          # Bridge module (vanilla ↔ React toggle, data sharing)
│   ├── me-capacity.js                # MODIFIED: Added "Try React" button
│   ├── capacity.js                   # MODIFIED: Added "ME-React" card to portal selector
│   └── ... (existing files unchanged)
│
└── jsx/                              # NEW directory
    ├── MeCapacityApp.jsx             # Root React component
    ├── hooks/
    │   └── useMeData.js              # Custom hook for data access + polling
    │
    └── components/
        ├── MeTopbar.jsx              # Topbar with toggle button
        ├── MeNav.jsx                 # Tab navigation
        ├── KPIStrip.jsx              # KPI cards (team, capacity, demand, utilisation)
        ├── MeDashboard.jsx           # Dashboard tab
        ├── MeTeam.jsx                # Team management tab (read-only)
        ├── MeTasks.jsx               # Task management tab (read-only)
        ├── MeProducts.jsx            # Product support tab (read-only)
        ├── MeProductTaskload.jsx     # Product taskload tab
        ├── MeHolidays.jsx            # Holiday planner tab (read-only)
        ├── MeChart.jsx               # 6-month capacity chart (Chart.js)
        ├── MeHeatmap.jsx             # Weekly utilisation heatmap
        ├── TeamTable.jsx             # Reusable team table component
        └── TaskTable.jsx             # Reusable task table component
```

## Data Flow

### Reading Data
```
React Component
    ↓
useMeData() hook
    ↓
meDataGetTeam/Tasks/Products/Holidays() [vanilla functions]
    ↓
Global meDataState (loaded from Supabase at app start)
```

The custom `useMeData` hook polls the vanilla data state every 1 second, ensuring real-time synchronization.

### Writing Data
```
React Component
    ↓
Calls meDataUpdate*() functions [vanilla data mutation functions]
    ↓
Updates global meDataState
    ↓
meReactSave() triggers
    ↓
900ms debounce delay (same as vanilla)
    ↓
meDataSave() [vanilla save function]
    ↓
Supabase upsert to me_teams, me_tasks, me_holidays, me_products
```

**Key Point:** React leverages the existing vanilla save infrastructure—no duplicate logic.

## Features Implemented

### Fully Functional
- ✅ **Dashboard** - KPI cards, upcoming deadlines
- ✅ **Capacity Chart** - 6-month forecast (Chart.js)
- ✅ **Team Tab** - View team members
- ✅ **Tasks Tab** - View tasks
- ✅ **Products Tab** - View products
- ✅ **Holidays Tab** - View holidays
- ✅ **Heatmap Tab** - Placeholder with team grid (full version in vanilla)
- ✅ **Product Taskload Tab** - Placeholder summary
- ✅ **Data Persistence** - Reads/writes to same Supabase database
- ✅ **Version Toggle** - Switch between vanilla ↔ React instantly

### Read-Only in React (Use Vanilla for Editing)
- Team members (add/edit/delete)
- Tasks (add/edit/delete)
- Products (add/edit/delete)
- Holidays (add/edit/delete)

The React version intentionally displays read-only views to avoid duplicating complex CRUD logic. Users can switch to vanilla version to edit data, and React will immediately reflect the changes.

## Technical Implementation Details

### Bridge Module (`me-capacity-react.js`)
Exposes globally accessible functions for switching versions and sharing data:

```javascript
window.toggleMeCapacityVersion()       // Toggle between vanilla ↔ React
window.renderMeCapacityReact()         // Render React version
window.renderMeCapacityVanilla()       // Render vanilla version
window.meFetchDataForReact()           // Get current data snapshot
window.meReactSave()                   // Debounced save (900ms)
```

### Custom Hook (`useMeData.js`)
Bridges React state with vanilla meDataState:

```javascript
const useMeData = () => {
  const [data, setData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Initial load
  React.useEffect(() => { /* load data */ }, []);

  // Poll vanilla state every 1s for real-time updates
  React.useEffect(() => { /* poll loop */ }, []);

  return { data, isLoading };
};
```

### Component Structure
Each component mirrors the vanilla implementation logic:
- **MeTopbar** - Renders topbar with toggle button
- **MeNav** - Tab buttons with active state styling
- **MeDashboard** - KPI calculations using utility functions
- **MeChart** - Chart.js integration with data from hook
- **MeTeam/MeTasks/etc.** - Display data in read-only tables

## CSS Integration

**No new CSS required.** React components reuse the existing CSS classes:
- `.me-shell`, `.me-topbar`, `.me-nav`, `.me-body`
- `.me-card`, `.me-tbl`, `.me-dashboard-kpis`, etc.
- All styles defined in `portals/capacity/css/me-capacity.css`

Responsive breakpoints work identically:
- **375px** - Mobile
- **768px** - Tablet
- **1200px+** - Desktop

## CDN Dependencies

Added to `<head>` in `index.html`:

```html
<!-- React 18 UMD -->
<script crossorigin src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>

<!-- ReactDOM 18 UMD -->
<script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Babel Standalone for JSX compilation -->
<script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
```

**Performance Notes:**
- React + ReactDOM (gzipped): ~40 KB
- Babel Standalone: ~1.5 MB (one-time download)
- Babel compiles JSX in browser (~1-2s on first load)
- Subsequent navigations cached by browser

## Development Workflow

### Making Changes

1. **Edit JSX files** (no build step needed)
   ```bash
   vim portals/capacity/jsx/components/MeDashboard.jsx
   ```

2. **Refresh browser** - Babel recompiles JSX automatically

3. **Test in both versions:**
   - Vanilla: Click "Try React" button in ME Capacity topbar
   - React: Click "Switch to Vanilla" button in React topbar

### Adding New Components

1. Create `.jsx` file in appropriate directory
2. Add `<script>` tag to `index.html` **before** `MeCapacityApp.jsx`
3. Babel will automatically compile on page load

Example:
```html
<script src="portals/capacity/jsx/components/MyNewComponent.jsx" type="text/babel"></script>
<script src="portals/capacity/jsx/MeCapacityApp.jsx" type="text/babel"></script>
```

## Testing Checklist

- [ ] Click "ME-React" card on Capacity portal → launches React version
- [ ] Click "Try React" button in vanilla ME Capacity → switches to React
- [ ] Click "Switch to Vanilla" button in React version → returns to vanilla
- [ ] Tab navigation works in React (Dashboard, Team, Tasks, etc.)
- [ ] Dashboard shows correct KPIs
- [ ] Edit data in vanilla version → see updates in React version
- [ ] Refresh page → React loads data from Supabase correctly
- [ ] Mobile layout (375px) renders properly
- [ ] Tablet layout (768px) renders properly
- [ ] Desktop layout (1200px+) renders properly

## Known Limitations

1. **Read-Only Data Entry** - CRUD operations (add/edit/delete) only available in vanilla version
2. **Heatmap Placeholder** - Full utilisation calculations in vanilla version only
3. **Estimation Subsystem** - Not implemented in React (use vanilla version)
4. **Modal Interactions** - Vanilla version handles all modal dialogs

These intentional limitations ensure data integrity while the React implementation is experimental.

## Future Enhancements

1. **Full CRUD Support** - Implement add/edit/delete for team, tasks, holidays
2. **Interactive Heatmap** - Full week-by-week utilisation calculations
3. **Estimation Subsystem** - React version of PERT estimation
4. **TypeScript** - Convert to TypeScript when/if build pipeline added
5. **State Management** - Consider Zustand or Redux for complex state
6. **Code Splitting** - Lazy-load React components on-demand

## Troubleshooting

### React version not loading
- Check browser console for Babel compilation errors
- Verify all JSX files have `type="text/babel"` attribute in script tags
- Ensure React CDN scripts loaded before JSX scripts

### Data not syncing
- Check that vanilla `meDataGetTeam()`, etc. functions return data
- Verify useMeData hook mounted correctly
- Check browser DevTools Network tab for Supabase sync

### Chart not rendering
- Ensure Canvas element has explicit height (not just CSS)
- Verify Chart.js loaded from CDN (`window.Chart` exists)
- Check for chart instance cleanup on unmount

## File Manifest

### New Files
- `portals/capacity/js/me-capacity-react.js` (191 lines)
- `portals/capacity/jsx/MeCapacityApp.jsx` (55 lines)
- `portals/capacity/jsx/hooks/useMeData.js` (43 lines)
- `portals/capacity/jsx/components/MeTopbar.jsx` (26 lines)
- `portals/capacity/jsx/components/MeNav.jsx` (32 lines)
- `portals/capacity/jsx/components/KPIStrip.jsx` (45 lines)
- `portals/capacity/jsx/components/MeDashboard.jsx` (69 lines)
- `portals/capacity/jsx/components/TeamTable.jsx` (45 lines)
- `portals/capacity/jsx/components/TaskTable.jsx` (48 lines)
- `portals/capacity/jsx/components/MeTeam.jsx` (30 lines)
- `portals/capacity/jsx/components/MeTasks.jsx` (30 lines)
- `portals/capacity/jsx/components/MeProducts.jsx` (69 lines)
- `portals/capacity/jsx/components/MeProductTaskload.jsx` (48 lines)
- `portals/capacity/jsx/components/MeHolidays.jsx` (77 lines)
- `portals/capacity/jsx/components/MeChart.jsx` (84 lines)
- `portals/capacity/jsx/components/MeHeatmap.jsx` (92 lines)

### Modified Files
- `index.html` - Added React/Babel CDN scripts, React root div, JSX script tags
- `portals/capacity/js/me-capacity.js` - Added "Try React" toggle button
- `portals/capacity/js/capacity.js` - Added "ME-React" card to portal selector

**Total New Code:** ~1,100 lines (all JSX/JavaScript)
**Build Pipeline:** None required
**Browser Support:** ES6+ (modern browsers)

## Summary

This React implementation demonstrates how a modern frontend framework can coexist with vanilla JavaScript in a static-file SPA environment. It provides a foundation for:
- **A/B testing** framework choices
- **Gradual migration** to React if desired
- **Experimental features** without disrupting production code
- **Team learning** with real codebase examples

The shared database, CSS, and utility functions ensure consistency while allowing both implementations to serve as reference for future development.
