# Hub Portal Improvements Plan — UX Enhancement & Modernization

**Created:** 2026-03-22  
**Priority:** P0-P2 (Critical to Medium)  
**Status:** Pending approval  

---

## Overview

This plan implements comprehensive improvements to the Hub portal to create a modern, accessible, and personalized landing page that serves as an effective operations dashboard.

| Priority | Feature | Effort | Impact | Status |
|----------|---------|--------|--------|--------|
| **P0** | Accessibility fixes | Low | High (compliance) | Pending |
| **P0** | Fix CSS specificity | Low | High (maintainability) | Pending |
| **P1** | Contextual badges on cards | Medium | High (UX) | Pending |
| **P1** | Recent projects section | Medium | High (UX) | Pending |
| **P1** | Event delegation refactor | Medium | High (maintainability) | Pending |
| **P1** | Keyboard navigation | Low | Medium (UX) | Pending |
| **P2** | Global search | Medium | Medium (UX) | Pending |
| **P2** | Personalization (favorites) | High | Medium (UX) | Pending |
| **P2** | First-time user onboarding | Medium | Medium (UX) | Pending |

**Total Estimated Effort:** ~8-12 hours development + testing  
**Risk:** Low (all changes are additive or refactoring)

---

## Feature 1: Accessibility Fixes (P0)

### Objective
Make Hub portal WCAG 2.1 AA compliant with proper keyboard navigation and ARIA landmarks.

### Current Issues

1. **Cards use `onclick` without keyboard activation**
2. **No ARIA roles for navigation landmarks**
3. **No focus indicators beyond default browser styling**
4. **Missing skip links**

### Changes Required

#### 1.1 Add Keyboard Activation (`portals/hub/js/hub.js`)

**Current code (line ~130):**
```javascript
<div class="proj-card hub-card" onclick="navigate('capacity')">
```

**Replace with event delegation and keyboard support:**
```javascript
// In renderHub():
<div class="hub-grid" role="navigation" aria-label="Portal navigation">
  <div class="proj-card hub-card" 
       data-portal="capacity"
       tabindex="0"
       role="button"
       aria-label="Navigate to Capacity Planning">
    <div class="hub-card-content">
      <div class="hub-icon" aria-hidden="true">📊</div>
      <div class="proj-card-name">CAPACITY</div>
      <div class="proj-card-meta">Load Capacity Planning</div>
    </div>
  </div>
  
  <!-- Repeat for other cards with appropriate data-portal values -->
</div>
```

**Add keyboard handler in hubInit():**
```javascript
function hubInit() {
  // Load action centre data
  if (typeof actionCentreLoad === 'function' && !actionCentreLoading && !actionCentreData) {
    actionCentreLoad();
  }
  
  // Add keyboard navigation
  const hubGrid = document.querySelector('.hub-grid');
  if (hubGrid) {
    hubGrid.addEventListener('keydown', (e) => {
      const cards = Array.from(hubGrid.querySelectorAll('.hub-card'));
      const currentIndex = cards.indexOf(e.target);
      
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          e.target.click();
          break;
        
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % cards.length;
          cards[nextIndex].focus();
          break;
        
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + cards.length) % cards.length;
          cards[prevIndex].focus();
          break;
      }
    });
  }
}
```

#### 1.2 Add Skip Link (`index.html` or `renderHub()`)

**Add at top of Hub content:**
```javascript
function renderHub() {
  return `
    <a href="#hub-main" class="skip-link">Skip to main content</a>
    <a href="#hub-nav" class="skip-link">Skip to navigation</a>
    
    ${renderHubActionWidget()}
    
    <div class="proj-home-header" id="hub-main">
      <!-- existing header -->
    </div>
    
    <div class="proj-cards hub-grid" id="hub-nav" role="navigation" aria-label="Portal navigation">
      <!-- cards -->
    </div>
  `;
}
```

#### 1.3 CSS for Focus Indicators (`portals/hub/css/hub.css`)

```css
/* Skip links - hidden until focused */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--primary);
  color: white;
  padding: 8px 16px;
  z-index: 1000;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 0;
}

/* Focus indicators for cards */
.hub-card:focus {
  outline: 3px solid var(--primary);
  outline-offset: 3px;
  box-shadow: 0 0 0 3px var(--primary-light);
}

.hub-card:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 3px;
}

/* Remove default focus for mouse users */
.hub-card:focus:not(:focus-visible) {
  outline: none;
}
```

### Acceptance Criteria
- [ ] All cards navigable with Tab key
- [ ] Arrow keys move between cards
- [ ] Enter/Space activate cards
- [ ] ARIA landmarks present (navigation, main)
- [ ] Skip links visible on Tab
- [ ] Focus indicators clearly visible
- [ ] Screen reader announces card purpose

---

## Feature 2: Fix CSS Specificity (P0)

### Objective
Remove `!important` flags and use proper CSS specificity for maintainability.

### Current Issues

**hub.css lines ~50-80:**
```css
.hub-grid {
  grid-template-columns: repeat(2, 1fr) !important;  /* ❌ */
  gap: 24px !important;  /* ❌ */
}

.hub-card {
  padding: 28px 32px !important;  /* ❌ */
}
```

### Changes Required

#### 2.1 Increase Specificity Properly

```css
/* Replace !important with proper specificity */
.proj-cards.hub-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.proj-card.hub-card {
  padding: 28px 32px;
}

/* Mobile breakpoint - more specific */
@media (max-width: 767px) {
  .proj-cards.hub-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .proj-card.hub-card {
    min-height: 90px;
    padding: 12px 16px;
  }
}

/* Tablet breakpoint */
@media (min-width: 768px) and (max-width: 1199px) {
  .proj-cards.hub-grid {
    gap: 16px;
  }
}
```

#### 2.2 Use CSS Variables for Consistency

```css
.proj-cards.hub-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: var(--gap-lg, 24px);
}

.proj-card.hub-card {
  min-height: 160px;
  padding: var(--card-padding-lg, 28px) var(--card-padding-xl, 32px);
}
```

### Acceptance Criteria
- [ ] Zero `!important` flags in hub.css
- [ ] All styles override correctly
- [ ] Mobile/tablet breakpoints work
- [ ] No visual regressions

---

## Feature 3: Contextual Badges on Cards (P1)

### Objective
Show real-time data counts on portal cards to help users prioritize their work.

### Changes Required

#### 3.1 Data Collection Function (`portals/hub/js/hub.js`)

**Add function to gather stats:**
```javascript
function getHubStats() {
  const stats = {
    capacity: { atRisk: 0, overloaded: 0 },
    productDev: { pendingGates: 0, openActions: 0 },
    production: { overdueBatches: 0, todaySetups: 0 },
    operations: { openRisks: 0, openBugs: 0 },
    mcs: { pendingApprovals: 0, implementedToday: 0 }
  };
  
  // Capacity stats (from project data)
  if (window.db?.projects) {
    db.projects.forEach(proj => {
      // Check capacity load
      if (proj.capacity?.me?.load > 100) stats.capacity.overloaded++;
      if (proj.capacity?.pm?.load > 100) stats.capacity.overloaded++;
      
      // Check production batches
      if (proj.production?.batches) {
        proj.production.batches.forEach(batch => {
          if (batch.dueDate && new Date(batch.dueDate) < new Date() && batch.status !== 'Complete') {
            stats.production.overdueBatches++;
          }
          if (batch.setupDate && isToday(new Date(batch.setupDate))) {
            stats.production.todaySetups++;
          }
        });
      }
      
      // Check APQP gates
      if (proj.apqp?.gates) {
        proj.apqp.gates.forEach(gate => {
          if (gate.status === 'Pending') stats.productDev.pendingGates++;
        });
      }
      
      // Check PFMEA high RPN
      if (proj.pfmea) {
        const highRPN = proj.pfmea.filter(m => 
          m.effects.some(e => e.causes.some(c => (e.sev * c.occ * c.det) >= 200))
        ).length;
        stats.productDev.openActions += highRPN;
      }
      
      // Check risks
      if (proj.risks) {
        const openRisks = proj.risks.filter(r => r.status !== 'Closed').length;
        stats.operations.openRisks += openRisks;
      }
    });
  }
  
  // MCS approvals (from action centre)
  if (window.actionCentreData?.mcsApprovals) {
    stats.mcs.pendingApprovals = actionCentreData.mcsApprovals.length;
  }
  
  // Bugs (if available)
  if (window.bugReportsData) {
    stats.operations.openBugs = bugReportsData.filter(b => b.status !== 'Closed').length;
  }
  
  return stats;
}

function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}
```

#### 3.2 Badge Component (`portals/hub/js/hub.js`)

**Add badge rendering helper:**
```javascript
function renderStatBadges(statName) {
  const stats = getHubStats()[statName];
  if (!stats) return '';
  
  const badges = [];
  
  for (const [key, value] of Object.entries(stats)) {
    if (value > 0) {
      const type = key.includes('overdue') || key.includes('overloaded') || key.includes('open') ? 'critical' :
                   key.includes('pending') || key.includes('atRisk') ? 'warning' : 'info';
      
      badges.push(`
        <span class="stat-badge stat-badge-${type}" title="${formatBadgeLabel(key)}">
          ${value}
        </span>
      `);
    }
  }
  
  return badges.length > 0 ? `<div class="stat-badges">${badges.join('')}</div>` : '';
}

function formatBadgeLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}
```

#### 3.3 Update Card Rendering

**Add badges to each card:**
```javascript
<div class="proj-card hub-card" data-portal="capacity" tabindex="0" role="button">
  <div class="hub-card-content">
    <div class="hub-icon" aria-hidden="true">📊</div>
    <div class="proj-card-name">
      CAPACITY
      ${renderStatBadges('capacity')}
    </div>
    <div class="proj-card-meta">Load Capacity Planning</div>
  </div>
</div>
```

#### 3.4 CSS Styling (`portals/hub/css/hub.css`)

```css
.stat-badges {
  display: inline-flex;
  gap: 4px;
  margin-left: 8px;
  vertical-align: middle;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 10px;
  color: white;
}

.stat-badge-critical {
  background: #dc2626;
}

.stat-badge-warning {
  background: #f59e0b;
}

.stat-badge-info {
  background: #2563eb;
}

.proj-card-name {
  display: flex;
  align-items: center;
  gap: 4px;
}
```

### Acceptance Criteria
- [ ] Badges appear on cards with counts > 0
- [ ] Color coding: critical (red), warning (amber), info (blue)
- [ ] Tooltips show what each badge means
- [ ] Stats update on Hub revisit
- [ ] No badges shown when all counts are 0
- [ ] Mobile-responsive (badges wrap if needed)

---

## Feature 4: Recent Projects Section (P1)

### Objective
Show recently accessed projects for quick navigation back to active work.

### Changes Required

#### 4.1 Track Recent Projects (`core/js/state.js`)

**Add recent projects tracking:**
```javascript
// Add to state:
let recentProjects = [];  // Array of { id, name, lastAccessed }

// Max recent projects to track:
const MAX_RECENT_PROJECTS = 5;
```

#### 4.2 Update Navigation to Track Access (`utils/js/navigation.js`)

**Add tracking when navigating to project:**
```javascript
function navigate(section, params = {}) {
  // Existing navigation logic...
  
  // Track project access
  if (params.p) {
    const project = db.projects.find(p => p.id === params.p);
    if (project) {
      addToRecentProjects({
        id: project.id,
        name: project.name || project.unit || 'Unnamed Project',
        lastAccessed: new Date().toISOString()
      });
    }
  }
  
  // Continue with navigation...
}

function addToRecentProjects(project) {
  // Remove if already exists
  recentProjects = recentProjects.filter(p => p.id !== project.id);
  
  // Add to front
  recentProjects.unshift(project);
  
  // Trim to max
  if (recentProjects.length > MAX_RECENT_PROJECTS) {
    recentProjects = recentProjects.slice(0, MAX_RECENT_PROJECTS);
  }
  
  // Persist to localStorage
  localStorage.setItem('tidyco_recent_projects', JSON.stringify(recentProjects));
}

// Load from localStorage on app start
function loadRecentProjects() {
  const stored = localStorage.getItem('tidyco_recent_projects');
  if (stored) {
    try {
      recentProjects = JSON.parse(stored);
    } catch (e) {
      recentProjects = [];
    }
  }
}
```

#### 4.3 Render Recent Projects Section (`portals/hub/js/hub.js`)

**Add to renderHub():**
```javascript
function renderHub() {
  const recentProjectsHtml = renderRecentProjects();
  
  return `
    ${renderHubActionWidget()}
    
    <div class="proj-home-header">
      <!-- existing header -->
    </div>
    
    ${recentProjectsHtml ? `
      <div class="recent-projects-section">
        <h2 class="section-title">
          <span class="section-icon">🕐</span>
          Recent Projects
          <button class="btn-clear-recent" title="Clear recent projects">Clear</button>
        </h2>
        <div class="recent-projects-grid">
          ${recentProjectsHtml}
        </div>
      </div>
    ` : ''}
    
    <div class="section-title portal-section">
      <h2>Portal Modules</h2>
    </div>
    
    <div class="proj-cards hub-grid">
      <!-- existing portal cards -->
    </div>
  `;
}

function renderRecentProjects() {
  if (!recentProjects || recentProjects.length === 0) return '';
  
  return recentProjects.map(proj => `
    <div class="recent-project-card" 
         data-project-id="${proj.id}" 
         tabindex="0"
         role="button"
         aria-label="Open ${esc(proj.name)}">
      <div class="recent-project-icon">📁</div>
      <div class="recent-project-info">
        <div class="recent-project-name">${esc(proj.name)}</div>
        <div class="recent-project-time">${formatRelativeTime(proj.lastAccessed)}</div>
      </div>
    </div>
  `).join('');
}

function formatRelativeTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
```

#### 4.4 Event Handler for Recent Projects

**Add to hubInit():**
```javascript
function hubInit() {
  // Existing action centre loading...
  
  // Recent projects navigation
  const recentGrid = document.querySelector('.recent-projects-grid');
  if (recentGrid) {
    recentGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.recent-project-card');
      if (card) {
        const projectId = card.dataset.projectId;
        navigate('product-development', { p: projectId });
      }
    });
    
    recentGrid.addEventListener('keydown', (e) => {
      const card = e.target.closest('.recent-project-card');
      if (card && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        card.click();
      }
    });
  }
  
  // Clear recent projects button
  const clearBtn = document.querySelector('.btn-clear-recent');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      recentProjects = [];
      localStorage.removeItem('tidyco_recent_projects');
      renderHub();
    });
  }
}
```

#### 4.5 CSS Styling (`portals/hub/css/hub.css`)

```css
.recent-projects-section {
  margin-bottom: 32px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-icon {
  font-size: 20px;
}

.btn-clear-recent {
  margin-left: auto;
  padding: 4px 12px;
  font-size: 12px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary);
}

.btn-clear-recent:hover {
  background: var(--bg-hover);
}

.recent-projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.recent-project-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.recent-project-card:hover {
  background: var(--bg-hover);
  border-color: var(--primary);
  transform: translateX(4px);
}

.recent-project-card:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.recent-project-icon {
  font-size: 24px;
}

.recent-project-info {
  flex: 1;
  min-width: 0;
}

.recent-project-name {
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-project-time {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Mobile responsive */
@media (max-width: 767px) {
  .recent-projects-grid {
    grid-template-columns: 1fr;
  }
}
```

### Acceptance Criteria
- [ ] Recent projects appear below header when accessed
- [ ] Shows up to 5 most recent projects
- [ ] Clicking navigates to project in Product Development
- [ ] "Clear" button removes all recent projects
- [ ] Persists across browser sessions (localStorage)
- [ ] Keyboard navigable
- [ ] Mobile-responsive (single column)

---

## Feature 5: Event Delegation Refactor (P1)

### Objective
Replace inline `onclick` handlers with event delegation for better maintainability and consistency with other portals.

### Current Issues

**hub.js uses inline onclick:**
```javascript
<div class="proj-card hub-card" onclick="navigate('capacity')">  /* ❌ */
```

**Capacity portal uses event delegation (better pattern):**
```javascript
// In capacity.js:
container.addEventListener('click', (e) => {
  const card = e.target.closest('[data-action]');
  if (card) {
    const action = card.dataset.action;
    if (action === 'me') navigate('capacity', { ct: 'me' });
    // etc.
  }
});
```

### Changes Required

#### 5.1 Update Card Rendering

**Replace onclick with data attributes:**
```javascript
function renderHub() {
  return `
    <div class="proj-cards hub-grid" role="navigation" aria-label="Portal navigation">
      <div class="proj-card hub-card" data-portal="capacity" tabindex="0" role="button">
        <div class="hub-card-content">
          <div class="hub-icon" aria-hidden="true">📊</div>
          <div class="proj-card-name">CAPACITY</div>
          <div class="proj-card-meta">Load Capacity Planning</div>
        </div>
      </div>
      
      <div class="proj-card hub-card" data-portal="product-development" tabindex="0" role="button">
        <div class="hub-card-content">
          <div class="hub-icon" aria-hidden="true">🚀</div>
          <div class="proj-card-name">PRODUCT DEVELOPMENT</div>
          <div class="proj-card-meta">NPI & Product Management</div>
        </div>
      </div>
      
      <div class="proj-card hub-card" data-portal="production" tabindex="0" role="button">
        <div class="hub-card-content">
          <div class="hub-icon" aria-hidden="true">🏭</div>
          <div class="proj-card-name">PRODUCTION</div>
          <div class="proj-card-meta">Batch Scheduling & Planning</div>
        </div>
      </div>
      
      <div class="proj-card hub-card" data-portal="operations" tabindex="0" role="button">
        <div class="hub-card-content">
          <div class="hub-icon" aria-hidden="true">🛰️</div>
          <div class="proj-card-name">OPERATIONS DASHBOARD</div>
          <div class="proj-card-meta">Unified Operations Overview</div>
        </div>
      </div>
      
      <div class="proj-card hub-card" data-portal="mcs" tabindex="0" role="button">
        <div class="hub-card-content">
          <div class="hub-icon" aria-hidden="true">🔧</div>
          <div class="proj-card-name">MANUFACTURING CHANGE</div>
          <div class="proj-card-meta">Engineering Change Requests</div>
        </div>
      </div>
    </div>
  `;
}
```

#### 5.2 Add Event Delegation in hubInit()

```javascript
function hubInit() {
  // Load action centre data
  if (typeof actionCentreLoad === 'function' && !actionCentreLoading && !actionCentreData) {
    actionCentreLoad();
  }
  
  // Portal card navigation via event delegation
  const hubGrid = document.querySelector('.hub-grid');
  if (hubGrid) {
    // Click handler
    hubGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.hub-card');
      if (card) {
        const portal = card.dataset.portal;
        if (portal) {
          navigate(portal);
        }
      }
    });
    
    // Keyboard handler
    hubGrid.addEventListener('keydown', (e) => {
      const card = e.target.closest('.hub-card');
      if (card) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
        // Arrow key navigation (see Feature 1)
      }
    });
  }
  
  // Add keyboard navigation between cards
  setupArrowKeyNavigation(hubGrid);
}

function setupArrowKeyNavigation(grid) {
  const cards = Array.from(grid.querySelectorAll('.hub-card'));
  
  grid.addEventListener('keydown', (e) => {
    const currentIndex = cards.indexOf(e.target);
    if (currentIndex === -1) return;
    
    let nextIndex;
    
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % cards.length;
        cards[nextIndex].focus();
        break;
      
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + cards.length) % cards.length;
        cards[nextIndex].focus();
        break;
    }
  });
}
```

### Acceptance Criteria
- [ ] No inline `onclick` handlers in hub.js
- [ ] All navigation via event delegation
- [ ] Click on card navigates correctly
- [ ] Keyboard navigation works
- [ ] Consistent with Capacity/Production portals
- [ ] No console errors

---

## Feature 6: Keyboard Shortcuts (P1)

### Objective
Add keyboard shortcuts for quick access to portals and common actions.

### Changes Required

#### 6.1 Keyboard Shortcuts Modal (`portals/hub/js/hub.js`)

**Add shortcuts content:**
```javascript
const HUB_SHORTCUTS = [
  { keys: ['1'], action: 'Open Capacity', icon: '📊' },
  { keys: ['2'], action: 'Open Product Development', icon: '🚀' },
  { keys: ['3'], action: 'Open Production', icon: '🏭' },
  { keys: ['4'], action: 'Open Operations', icon: '🛰️' },
  { keys: ['5'], action: 'Open Manufacturing Change', icon: '🔧' },
  { keys: ['R'], action: 'View Recent Projects', icon: '🕐' },
  { keys: ['M'], action: 'My Actions', icon: '✅' },
  { keys: ['G', 'H'], action: 'Go to Hub', icon: '🏠' },
  { keys: ['?'], action: 'Show Shortcuts', icon: '⌨️' }
];
```

#### 6.2 Global Keyboard Handler (`utils/js/navigation.js` or `hub.js`)

```javascript
// In hubInit():
document.addEventListener('keydown', (e) => {
  // Ignore if in input/textarea
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return;
  }
  
  // Number keys 1-5 for portal navigation
  if (e.key >= '1' && e.key <= '5') {
    const portals = ['capacity', 'product-development', 'production', 'operations', 'mcs'];
    const index = parseInt(e.key) - 1;
    if (portals[index]) {
      navigate(portals[index]);
    }
    return;
  }
  
  // Other shortcuts
  switch (e.key.toLowerCase()) {
    case 'r':
      // Scroll to recent projects or show if hidden
      const recent = document.querySelector('.recent-projects-section');
      if (recent) {
        recent.scrollIntoView({ behavior: 'smooth' });
      }
      break;
    
    case 'm':
      // My actions
      if (typeof navigate === 'function') {
        navigate('action-centre');
      }
      break;
    
    case '?':
      // Show shortcuts modal
      e.preventDefault();
      showShortcutsModal();
      break;
  }
});
```

#### 6.3 Shortcuts Modal Display

```javascript
function showShortcutsModal() {
  const modal = document.createElement('div');
  modal.className = 'modal shortcuts-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>⌨️ Keyboard Shortcuts</h3>
      <div class="shortcuts-grid">
        ${HUB_SHORTCUTS.map(shortcut => `
          <div class="shortcut-item">
            <div class="shortcut-keys">
              ${shortcut.keys.map(key => `<kbd>${key}</kbd>`).join(' + ')}
            </div>
            <div class="shortcut-action">
              <span class="shortcut-icon">${shortcut.icon}</span>
              ${shortcut.action}
            </div>
          </div>
        `).join('')}
      </div>
      <button class="btn-primary" onclick="this.closest('.modal').remove()">Close</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.showModal();
}
```

#### 6.4 CSS Styling (`portals/hub/css/hub.css`)

```css
.shortcuts-modal .shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin: 20px 0;
  max-height: 400px;
  overflow-y: auto;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--bg-soft);
  border-radius: 6px;
  border: 1px solid var(--border);
}

.shortcut-keys {
  display: flex;
  gap: 4px;
  align-items: center;
}

.shortcut-keys kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.shortcut-action {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.shortcut-icon {
  font-size: 16px;
}
```

### Acceptance Criteria
- [ ] Number keys 1-5 navigate to portals
- [ ] 'M' opens My Actions
- [ ] '?' shows shortcuts modal
- [ ] Shortcuts work only when not in input fields
- [ ] Modal displays all shortcuts clearly
- [ ] Shortcuts documented in Guide

---

## Feature 7: Global Search (P2)

### Objective
Add global search from Hub to quickly find projects, products, and features.

### Proposed Implementation

- Search bar at top of Hub
- Fuzzy search across: project names, unit codes, product names
- Quick navigation to search results
- Keyboard shortcut: `Ctrl+K` or `/` to focus search

*(Full spec available on request - deferring to dedicated search feature plan)*

---

## Feature 8: Personalization - Favorite Portals (P2)

### Objective
Allow users to pin favorite portals to top and reorder cards.

### Proposed Implementation

- Star button on each card to favorite
- Drag-and-drop reordering
- Persist order to localStorage
- "Reset to default" option

*(Full spec available on request)*

---

## Feature 9: First-Time User Onboarding (P2)

### Objective
Guide new users through Hub features with interactive tooltips.

### Changes Required

#### 9.1 Onboarding Tour (`portals/hub/js/hub.js`)

```javascript
const HUB_ONBOARDING = [
  {
    target: '.hub-widget',
    title: 'Your Action Summary',
    content: 'See your open actions, overdue items, and pending approvals at a glance. Click "My Actions" to view details.',
    position: 'bottom'
  },
  {
    target: '.hub-card[data-portal="capacity"]',
    title: 'Capacity Planning',
    content: 'Monitor load capacity for Production, ME, and PM streams. See which resources are overloaded.',
    position: 'right'
  },
  {
    target: '.hub-card[data-portal="product-development"]',
    title: 'Product Development',
    content: 'Manage NPI projects through APQP gates. Access PFMEA, BOM, and Control Plans.',
    position: 'right'
  },
  {
    target: '.recent-projects-section',
    title: 'Recent Projects',
    content: 'Quickly return to projects you\'ve been working on. Click "Clear" to reset.',
    position: 'bottom'
  },
  {
    target: '.btn-shortcuts',
    title: 'Keyboard Shortcuts',
    content: 'Press "?" anytime to see all keyboard shortcuts. Speed up your workflow!',
    position: 'left'
  }
];

function showHubOnboarding() {
  const hasSeenOnboarding = localStorage.getItem('tidyco_hub_onboarding_seen');
  if (hasSeenOnboarding) return;
  
  startOnboardingTour(HUB_ONBOARDING);
}

function startOnboardingTour(steps) {
  let currentStep = 0;
  
  function showStep(stepIndex) {
    if (stepIndex >= steps.length) {
      // Complete onboarding
      localStorage.setItem('tidyco_hub_onboarding_seen', 'true');
      return;
    }
    
    const step = steps[stepIndex];
    const target = document.querySelector(step.target);
    
    if (!target) {
      showStep(stepIndex + 1);
      return;
    }
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'onboarding-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-content">
        <h4>${step.title}</h4>
        <p>${step.content}</p>
        <div class="tooltip-actions">
          <button class="btn-skip">Skip Tour</button>
          <button class="btn-next">${stepIndex === steps.length - 1 ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    `;
    
    // Position tooltip
    const rect = target.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + 8}px`;
    tooltip.style.left = `${rect.left}px`;
    
    document.body.appendChild(tooltip);
    
    // Highlight target
    target.classList.add('onboarding-highlight');
    
    // Handle buttons
    tooltip.querySelector('.btn-skip').addEventListener('click', () => {
      tooltip.remove();
      localStorage.setItem('tidyco_hub_onboarding_seen', 'true');
    });
    
    tooltip.querySelector('.btn-next').addEventListener('click', () => {
      tooltip.remove();
      target.classList.remove('onboarding-highlight');
      showStep(stepIndex + 1);
    });
  }
  
  showStep(currentStep);
}
```

#### 9.2 CSS Styling

```css
.onboarding-highlight {
  box-shadow: 0 0 0 3px var(--primary);
  animation: pulse-highlight 1.5s infinite;
}

@keyframes pulse-highlight {
  0%, 100% { box-shadow: 0 0 0 3px var(--primary); }
  50% { box-shadow: 0 0 0 6px var(--primary-light); }
}

.onboarding-tooltip {
  position: absolute;
  z-index: 1000;
  max-width: 300px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  padding: 16px;
}

.tooltip-content h4 {
  margin: 0 0 8px 0;
  font-size: 15px;
  color: var(--text-primary);
}

.tooltip-content p {
  margin: 0 0 16px 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.tooltip-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.btn-skip {
  padding: 6px 12px;
  font-size: 13px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
}

.btn-next {
  padding: 6px 12px;
  font-size: 13px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
```

### Acceptance Criteria
- [ ] Onboarding shows on first Hub visit
- [ ] Tour highlights each feature in sequence
- [ ] User can skip or complete tour
- [ ] Tour doesn't show again after completion
- [ ] "Show tour again" option in settings

---

## Implementation Order

### Phase 1: P0 Features (Compliance & Maintainability) — ~2 hours
1. **Accessibility Fixes** (~1 hour)
2. **Fix CSS Specificity** (~1 hour)

### Phase 2: P1 Features (Core UX) — ~4-5 hours
3. **Contextual Badges** (~1.5 hours)
4. **Recent Projects** (~1.5 hours)
5. **Event Delegation Refactor** (~1 hour)
6. **Keyboard Shortcuts** (~1 hour)

### Phase 3: P2 Features (Advanced UX) — ~3-5 hours
7. **Global Search** (~2 hours - deferred to dedicated plan)
8. **Personalization** (~2 hours)
9. **First-Time Onboarding** (~1.5 hours)

---

## Testing Plan

### Unit Tests (`tests/hub.test.js`)

**Accessibility:**
- [ ] `hub cards are keyboard navigable`
- [ ] `Enter/Space activate cards`
- [ ] `Arrow keys navigate between cards`
- [ ] `ARIA landmarks present`
- [ ] `Skip links functional`

**Contextual Badges:**
- [ ] `getHubStats returns correct counts`
- [ ] `Badges render for non-zero counts`
- [ ] `No badges when all counts zero`
- [ ] `Badge colors match severity`

**Recent Projects:**
- [ ] `addToRecentProjects adds to list`
- [ ] `List trimmed to MAX_RECENT_PROJECTS`
- [ ] `Persists to localStorage`
- [ ] `Loads from localStorage on start`
- [ ] `Clear button removes all`

**Event Delegation:**
- [ ] `Click on card navigates to correct portal`
- [ ] `No inline onclick handlers`
- [ ] `Event delegation setup in hubInit`

**Keyboard Shortcuts:**
- [ ] `Number keys 1-5 navigate to portals`
- [ ] `? shows shortcuts modal`
- [ ] `Shortcuts disabled in input fields`

### Integration Tests

**Manual Testing Checklist:**
- [ ] Tab through all cards
- [ ] Use arrow keys to navigate
- [ ] Press 1-5 to open portals
- [ ] Access recent project
- [ ] Verify badge counts accurate
- [ ] Clear recent projects
- [ ] Complete onboarding tour

---

## Success Metrics

After implementation:

- ✅ **Accessibility:** WCAG 2.1 AA compliant
- ✅ **Maintainability:** Zero `!important` flags, event delegation pattern
- ✅ **Efficiency:** Users navigate to projects 40% faster (recent projects + shortcuts)
- ✅ **Awareness:** Users see contextual data (badges) before clicking
- ✅ **Onboarding:** New users complete tour in <2 minutes

---

## Notes

- All changes are backward compatible
- No breaking changes to existing navigation
- LocalStorage used for persistence (recent projects, onboarding state, favorites)
- Consider adding "Reset Hub settings" option in future

---

**Next Steps:**
1. Review and approve this plan
2. Implement Phase 1 (P0 - accessibility & CSS)
3. Test Phase 1
4. Implement Phase 2 (P1 - core UX features)
5. Test Phase 2
6. Implement Phase 3 (P2 - advanced features)
7. Test Phase 3
8. Update documentation
9. Deploy to production
