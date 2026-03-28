# Sage X3 Visual Revamp Plan

## 1. Background & Motivation
The goal of this revamp is to align the Tidyco APQP visual layout and structural density with the enterprise aesthetic of Sage X3. This will create a more familiar, modular, and efficient workspace for heavy data entry and navigation. Crucially, we will retain the current Tidyco APQP color themes (defined via CSS variables) to maintain brand identity while upgrading the underlying structure.

## 2. Scope & Impact
- **Core Layout (`index.html`, `core/css/main.css`)**: Transition from a vertical flex stack (Topbar > Main > Bottombar) to a Grid layout incorporating a left sidebar.
- **Navigation (`utils/navigation.js`)**: Move main routing logic to the new sidebar and repurpose the top header.
- **Component Styling (`core/css/components.css`)**: Introduce new classes for Tabs and structured "Blocks" to handle data density.
- **Portals**: Gradual layout refactoring across all portals (Hub, NPI, Capacity, etc.) to utilize the new Block/Tab structures.

## 3. Proposed Solution

### 3.1 Shell Architecture (Grid Layout)
The current `.shell` flexbox layout will be replaced with a CSS Grid layout:
```css
.shell {
  display: grid;
  grid-template-columns: var(--sidebar-width, 240px) 1fr;
  height: 100vh;
  overflow: hidden;
  transition: grid-template-columns 0.2s ease;
}
.shell.sidebar-collapsed {
  grid-template-columns: var(--sidebar-collapsed-width, 64px) 1fr;
}
```

### 3.2 Left Navigation (Pinned & Collapsible Sidebar)
- **Structure**: A new `.sidebar` div will be introduced on the left side of the shell.
- **Function**: It will house the "Sitemap" or main module navigation (Hub, Operations, Capacity, NPI, Settings).
- **Behavior**: Always visible on desktop. Includes a toggle button at the top to collapse the sidebar into an icon-only mode to save horizontal space. On mobile, it will likely become a slide-out hamburger menu.

### 3.3 Topbar Repurposing & Header Actions
The `.topbar` will no longer serve as the primary app navigation. Instead, it will function as a contextual header:
- **Left**: Persistent Breadcrumbs (e.g., `Hub > NPI > Project X`).
- **Center**: A Global Search input (visual placeholder or functional search depending on backend capabilities).
- **Right (Header Actions)**: Page-specific actions (e.g., "Save", "Export", "Print") will be relocated here, alongside the User Profile / Logout buttons. This matches X3's approach to contextual actions without needing a separate right-side action panel.

### 3.4 Data Density (Tabs & Blocks)
To emulate X3's handling of complex ERP data without excessive vertical scrolling:
- **Tabs (`.x3-tabs`)**: Introduce a standard tabbed navigation component for splitting large forms (e.g., separating "Project Details" from "BOM" or "Risk").
- **Blocks (`.x3-block`)**: Upgrade the current `.card` styling to visually distinct blocks. Each block will have a rigid header (`.x3-block-head`) and tightly grouped form fields or tables (`.x3-block-body`).
- **Layout**: Utilize CSS Grid heavily within Blocks to align fields cleanly (e.g., 2-column or 3-column field layouts).

### 3.5 Color Retention
The existing CSS custom properties (`--ink`, `--blue`, `--surface-gradient-start`, etc.) in `main.css` will be strictly maintained. The revamp focuses purely on structure, spacing, and density, not the color palette.

## 4. Phased Implementation Plan

- **Phase 1: Shell & Sidebar Scaffold**
  - Update `index.html` to include the `.sidebar` container.
  - Modify `core/css/main.css` to implement the new Grid shell.
  - Move global navigation links from the Topbar/Hub to the Sidebar.
- **Phase 2: Topbar Contextualization**
  - Refactor Topbar HTML/CSS to support Breadcrumbs on the left and Actions on the right.
  - Update `utils/navigation.js` to dynamically update breadcrumbs and clear/inject header actions based on the current view.
- **Phase 3: Component Density (Blocks & Tabs)**
  - Add `.x3-tabs` and `.x3-block` definitions to `core/css/components.css`.
  - Standardize form field alignments within these blocks.
- **Phase 4: Portal Rollout**
  - Apply the new layout incrementally across portals, starting with the highest-density areas (NPI Dashboard, Capacity Forms).

## 5. Alternatives Considered
- **Right Action Panel**: Considered adding a persistent right panel for actions. Rejected in favor of **Header Actions** (user preference) to maximize horizontal workspace for data tables.
- **Slide-out Sidebar**: Considered a completely hidden sidebar. Rejected in favor of **Pinned & Collapsible** (user preference) to provide faster module switching for power users.

## 6. Verification
- **Responsiveness**: Verify the layout transitions gracefully from desktop (grid) to tablet/mobile (stacked/slide-out).
- **Functionality**: Ensure all existing navigation links, save actions, and global shortcuts function correctly in the new DOM structure.
- **Visual Consistency**: Confirm that the X3 structural density is achieved without breaking the established Tidyco color themes.