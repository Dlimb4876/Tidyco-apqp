// ═══════════════════════════════════
// navigation.js — Hash-based routing
// Depends on: state.js, helpers.js, all feature renderers
// ═══════════════════════════════════

import { appState, db, prog } from '../../core/js/state.js';
import { currentUser } from '../../core/js/supa.js';
import { autoResizeAll, broadcastPresence, stopPresenceBroadcast } from '../../core/js/db.js'
import {
  esc,
  canViewSection,
  canViewPortalTab,
  isEditingInlineCell
} from './helpers.js';
import { renderMeCapacity, meDrawChartNow, meTab, setMeTab } from '../../portals/capacity/me/js/me-capacity.js'
import { meCapacityDataUnsubscribe } from '../../portals/capacity/me/js/me-data-realtime.js'
import { renderCapacity, setCapacityTab } from '../../portals/capacity/js/capacity.js'
import { setupCapacityEvents } from '../../portals/capacity/js/capacity-events.js'
import { renderProdCapacity } from '../../portals/capacity/production/js/prod-capacity.js'
import {
  prodCapUnsubscribeUtilization
} from '../../portals/capacity/production/js/prod-capacity-data.js'
import { workAreasDataUnsubscribe } from '../../portals/capacity/production/js/work-areas-data.js'
import { logDataUnsubscribe } from '../../portals/capacity/logistics/js/log-data.js'
import { pmDataUnsubscribe } from '../../portals/capacity/project-management/js/pm-data.js'
import { pmTab, renderPmCapacity, setPmTabState } from '../../portals/capacity/project-management/js/pm-capacity.js'
import { unit6CapacityDataUnsubscribe } from '../../portals/capacity/unit6/js/unit6-data.js'
import {
  setProductDevelopmentTab,
  renderProductDevelopment,
  familyModalState,
  templateManagerState,
  templateViewerState,
  renderFamilyModal,
  renderTemplateManager,
  renderTemplateViewer,
  productDevelopmentDataUnsubscribe
} from '../../portals/product-development/js/product-development.js'
import { renderHub, hubInit } from '../../portals/hub/js/hub.js'
import { renderFeedback, feedbackDataSubscribe, feedbackDataUnsubscribe, feedbackAttachDelegation } from '../../portals/feedback/js/feedback.js'
import {
  renderActionCentre,
  actionCentreLoad,
  actionCentreDataSubscribe,
  actionCentreDataUnsubscribe
} from '../../portals/action-centre/js/action-centre.js'
import { renderSettings } from '../../portals/settings/js/settings.js'
import {
  renderOperations,
  setOperationsTab,
  operationsDataSubscribe,
  operationsDataUnsubscribe
} from '../../portals/operations/js/operations-dashboard-main.js'
import {
  renderProduction,
  productionDataUnsubscribe,
  setProductionTab
} from '../../portals/production/js/production.js'
import { setProductsActiveTab } from '../../portals/product-development/product-management/js/products.js'
import {
  cleanupNpi,
  initNpi,
  renderNpi,
  renderNpiSection
} from '../../portals/product-development/npi/js/npi.js'
import { mcsStopPolling } from '../../portals/mcs/js/mcs-realtime.js'
import { mcsDataUnsubscribe, mcsLoadChanges, renderMcs } from '../../portals/mcs/js/mcs-main.js'

function getNpiGlobal() {
  return globalThis.npi || {}
}

/**
 * Section labels for UI display (reserved for future use)
 */
export const SECTION_LABELS = {
  apqp:    'APQP',
  actions: 'Action Tracker',
  risks:   'Risk Register',
  bom:     'Bill of Materials',
  timing:  'NPI Timing Plan',
  capacity: 'Capacity Management',
  'capacity::production': 'Capacity - Production',
  'capacity::me': 'Capacity - Manufacturing Engineering',
  'capacity::projects': 'Capacity - Project Management',
  'capacity::logistics': 'Capacity - Logistics',
  'capacity::unit6': 'Capacity - Unit 6',
  operations: 'Operations Mission Control',
  production: 'Production Planning',
  'production::scheduling': 'Production - Schedule',
  'production::by-product': 'Production - Plan by Product',
  'production::by-unit': 'Production - Plan by Work Area',
  'product-development': 'Product Development',
  'product-development::npi': 'Product Development - NPI Projects',
  'product-development::product-management': 'Product Development - Product Management',
  'product-development::product-family-db': 'Product Development - Product Family Database',
  'product-development::parts-database': 'Product Development - Parts Database',
  feedback: 'Feedback & Bugs',
  'action-centre': 'Action Centre',
  mcs: 'Manufacturing Change'
};

/**
 * Update the back button visibility and label based on current section and tab state.
 * Called from navigate() and from each set*Tab() function so the label always reflects
 * where pressing back will actually take the user.
 */
export function updateBackButton() {
  const returnBtn = document.getElementById('returnHubBtn');
  if (!returnBtn) return;

  const isTopLevel = appState.currentSection === 'hub' || appState.currentSection === 'projects' || appState.currentSection === 'project';
  returnBtn.style.display = isTopLevel ? 'none' : 'flex';
  if (isTopLevel) return;

  const npiSubSections = ['apqp', 'actions', 'risks', 'bom', 'timing', 'documents'];
  if (npiSubSections.includes(appState.currentSection) || appState.currentSection.startsWith('gate_')) {
    returnBtn.textContent = '← Back to Project';
    return;
  }
  if (appState.currentSection === 'capacity') {
    returnBtn.textContent = (appState.capacityTab && appState.capacityTab !== 'root') ? '← Back to Capacity' : '← Back to Hub';
    return;
  }
  if (appState.currentSection === 'production') {
    returnBtn.textContent = (appState.productionTab && appState.productionTab !== 'root') ? '← Back to Production' : '← Back to Hub';
    return;
  }
  if (appState.currentSection === 'product-development') {
    returnBtn.textContent = (appState.productDevelopmentTab && appState.productDevelopmentTab !== 'root') ? '← Back to Product Development' : '← Back to Hub';
    return;
  }
  if (appState.currentSection === 'operations') {
    returnBtn.textContent = (appState.operationsTab && appState.operationsTab !== 'overview') ? '← Back to Operations' : '← Back to Hub';
    return;
  }
  returnBtn.textContent = '← Back to Hub';
}

const APP_HISTORY_STATE_KEY = '__tidycoNav';

function buildNavigationHistoryState(index, baseState = history.state) {
  const safeBaseState = baseState && typeof baseState === 'object' ? baseState : {};
  return {
    ...safeBaseState,
    [APP_HISTORY_STATE_KEY]: true,
    index
  };
}

function getNavigationHistoryIndex(state = history.state) {
  if (!state || state[APP_HISTORY_STATE_KEY] !== true) return 0;
  return Number.isInteger(state.index) ? state.index : 0;
}

function ensureNavigationHistoryState() {
  if (typeof history === 'undefined') return;
  if (history.state && history.state[APP_HISTORY_STATE_KEY] === true) return;
  history.replaceState(buildNavigationHistoryState(0), '');
}

export function writeNavigationHistory(hash, { push = false } = {}) {
  ensureNavigationHistoryState();
  const currentIndex = getNavigationHistoryIndex();
  const nextIndex = push ? currentIndex + 1 : currentIndex;
  const state = buildNavigationHistoryState(nextIndex);

  if (push) {
    history.pushState(state, '', hash);
    return;
  }

  history.replaceState(state, '', hash);
}

function canNavigateBackInApp() {
  ensureNavigationHistoryState();
  return getNavigationHistoryIndex() > 0;
}

/**
 * Parses URL hash into key-value parameters
 * @returns {Object} Parsed hash parameters
 * @example
 * // Hash: #p=uuid&s=apqp&t=ctq
 * // Returns: { p: 'uuid', s: 'apqp', t: 'ctq' }
 */
export function parseHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return {};
  return Object.fromEntries(hash.split('&').map(p => {
    const [k, ...v] = p.split('=');
    return [k, decodeURIComponent(v.join('='))];
  }));
}

function isNpiLiveSection(sec) {
  if (!sec) return false;
  if (sec.startsWith('gate_')) return true;
  return ['projects', 'project', 'apqp', 'actions', 'risks', 'bom', 'timing', 'documents'].includes(sec);
}

/**
 * Primary navigation function - updates section, URL hash, and triggers render
 * @param {string} sec - Section to navigate to
 * @param {Object} options - Navigation options
 * @param {boolean} options.pushHash - Whether to push new history entry (default: true)
 * 
 * Features:
 * - Automatic subscription cleanup when leaving sections
 * - Tab reset when navigating to sections from outside
 * - Return button visibility management
 * - Feedback data initialization
 */
export function navigate(sec, { pushHash = true } = {}) {
  if (sec === 'home') sec = 'project';

  // Keep NPI project pages live-updated across all users.
  const leavingNpiLiveSection = isNpiLiveSection(appState.currentSection) && !isNpiLiveSection(sec);
  const enteringNpiLiveSection = !isNpiLiveSection(appState.currentSection) && isNpiLiveSection(sec);

  if (leavingNpiLiveSection) {
    cleanupNpi();
    // Task 2-A: stop broadcasting presence when leaving NPI project view
    stopPresenceBroadcast()
  }

  if (enteringNpiLiveSection) {
    initNpi();
    // Task 2-A: start broadcasting presence when entering NPI project view
    if (appState.progId) broadcastPresence(appState.progId)
  }

  // Clean up subscriptions when leaving feedback
  if (appState.currentSection === 'feedback' && sec !== 'feedback') {
    feedbackDataUnsubscribe();
  }

  // Initialize feedback data when navigating TO feedback
  if (sec === 'feedback' && appState.currentSection !== 'feedback') {
    feedbackDataSubscribe().catch(err => console.error('Failed to initialize feedback:', err));
  }

  if (appState.currentSection === 'action-centre' && sec !== 'action-centre') {
    actionCentreDataUnsubscribe()
  }

  // Clean up subscriptions when leaving capacity
  if (appState.currentSection === 'capacity' && sec !== 'capacity') {
    meCapacityDataUnsubscribe();
    prodCapUnsubscribeUtilization()
    workAreasDataUnsubscribe()
    logDataUnsubscribe()
    pmDataUnsubscribe()
    unit6CapacityDataUnsubscribe()
  }

  // Clean up MCS subscriptions when leaving MCS
  if (appState.currentSection === 'mcs' && sec !== 'mcs') {
    mcsDataUnsubscribe()
    mcsStopPolling()
  }

  // Clean up subscriptions when leaving production
  if (appState.currentSection === 'production' && sec !== 'production') {
    productionDataUnsubscribe();
  }

  // Clean up subscriptions when leaving operations
  if (appState.currentSection === 'operations' && sec !== 'operations') {
    operationsDataUnsubscribe();
  }

  // Clean up product-development subscriptions when leaving product-development
  if (appState.currentSection === 'product-development' && sec !== 'product-development') {
    productDevelopmentDataUnsubscribe();
  }

  // Clean up subscriptions when leaving settings
  if (appState.currentSection === 'settings' && sec !== 'settings') {
    workAreasDataUnsubscribe()
  }

  // Initialize operations real-time subscriptions when entering operations.
  if (sec === 'operations' && appState.currentSection !== 'operations') {
    operationsDataSubscribe();
  }

  const prevSection = appState.currentSection;
  appState.currentSection = sec;

  if (pushHash) {
    // Reset portal tabs to 'root' only for new user-driven navigations (not back/forward restores).
    // This intentionally runs after prevSection is captured so the check is correct.
    if (sec === 'capacity' && prevSection !== 'capacity') appState.capacityTab = 'root';
    if (sec === 'operations' && prevSection !== 'operations') appState.operationsTab = 'overview';
    if (sec === 'production' && prevSection !== 'production') appState.productionTab = 'root';
    if (sec === 'product-development' && prevSection !== 'product-development') {
      appState.productDevelopmentTab = 'root';
      setProductsActiveTab('list')
    }

    const parts = [];
    if (appState.progId)             parts.push('p=' + encodeURIComponent(appState.progId));
    if (sec !== 'projects') parts.push('s=' + encodeURIComponent(sec));
    if (sec === 'projects' && appState.npiTab !== 'all') parts.push('nft=' + encodeURIComponent(appState.npiTab));
    if (sec === 'apqp' && appState.apqpTab !== 'ctq') parts.push('t=' + encodeURIComponent(appState.apqpTab));
    if (sec === 'capacity' && appState.capacityTab !== 'root') parts.push('ct=' + encodeURIComponent(appState.capacityTab));
    if (sec === 'capacity' && appState.capacityTab === 'me' && meTab !== 'chart') parts.push('met=' + encodeURIComponent(meTab));
    if (sec === 'capacity' && appState.capacityTab === 'production' && appState.prodCapTab !== 'dashboard') parts.push('pct=' + encodeURIComponent(appState.prodCapTab));
    if (sec === 'capacity' && appState.capacityTab === 'projects' && pmTab !== 'chart') parts.push('pmt=' + encodeURIComponent(pmTab));
    if (sec === 'operations' && appState.operationsTab !== 'overview') parts.push('od=' + encodeURIComponent(appState.operationsTab));
    if (sec === 'production' && appState.productionTab !== 'root') parts.push('pt=' + encodeURIComponent(appState.productionTab));
    if (sec === 'product-development' && appState.productDevelopmentTab !== 'root') parts.push('pdt=' + encodeURIComponent(appState.productDevelopmentTab));

    // NPI Projects Dashboard filters
    if (sec === 'projects') {
      if (appState.npiProjectsSearch) parts.push('ps=' + encodeURIComponent(appState.npiProjectsSearch));
      if (appState.npiProjectsFamilyFilter !== 'all') parts.push('pf=' + encodeURIComponent(appState.npiProjectsFamilyFilter));
      if (appState.npiProjectsStatusFilter !== 'all') parts.push('pst=' + encodeURIComponent(appState.npiProjectsStatusFilter));
      if (appState.npiProjectsViewMode !== 'active') parts.push('pvm=' + encodeURIComponent(appState.npiProjectsViewMode));
    }

    // BOM sub-tab
    if (sec === 'project' && typeof appState.bomSubTab !== 'undefined' && appState.bomSubTab !== 'tree') {
      parts.push('bt=' + encodeURIComponent(appState.bomSubTab));
    }

    // PFMEA filters
    if (sec === 'project' && typeof appState.apqpTab !== 'undefined' && appState.apqpTab === 'pfmea') {
      if (typeof appState.pfmeaRpnFilter !== 'undefined' && appState.pfmeaRpnFilter !== 'all') {
        parts.push('pfr=' + encodeURIComponent(appState.pfmeaRpnFilter));
      }
      if (typeof appState.pfmeaView !== 'undefined' && appState.pfmeaView !== 'worksheet') {
        parts.push('pfv=' + encodeURIComponent(appState.pfmeaView));
      }
    }

    // CTQ filters
    if (sec === 'project' && typeof appState.apqpTab !== 'undefined' && appState.apqpTab === 'ctq') {
      if (typeof appState.ctqSourceFilter !== 'undefined' && appState.ctqSourceFilter !== 'all') {
        parts.push('csf=' + encodeURIComponent(appState.ctqSourceFilter));
      }
      if (typeof appState.ctqOosFilter !== 'undefined' && appState.ctqOosFilter !== 'all') {
        parts.push('cof=' + encodeURIComponent(appState.ctqOosFilter));
      }
      if (typeof appState.ctqAgreedFilter !== 'undefined' && appState.ctqAgreedFilter !== 'all') {
        parts.push('caf=' + encodeURIComponent(appState.ctqAgreedFilter));
      }
      if (typeof appState.ctqCoverageFilter !== 'undefined' && appState.ctqCoverageFilter !== 'all') {
        parts.push('ccf=' + encodeURIComponent(appState.ctqCoverageFilter));
      }
    }

    // Tracker sub-assembly filter
    if (sec === 'project' && typeof appState.trackerSubAsmFilter !== 'undefined' && appState.trackerSubAsmFilter !== 'all') {
      parts.push('tsf=' + encodeURIComponent(appState.trackerSubAsmFilter));
    }

    const hash = parts.length ? '#' + parts.join('&') : '#';
    writeNavigationHistory(hash, { push: sec !== prevSection });
  }

  updateBackButton();

  // Update project name breadcrumb display
  updateProjectBreadcrumb();

  render();
}

/**
 * Update project name display in topbar breadcrumb
 * Shows project name when inside a project-specific section
 */
function updateProjectBreadcrumb() {
  const projectNameEl = document.getElementById('projectName');
  if (!projectNameEl) return;

  const p = prog();
  const isProjectSection = appState.progId && p && (
    appState.currentSection === 'project' ||
    appState.currentSection === 'apqp' ||
    appState.currentSection === 'actions' ||
    appState.currentSection === 'risks' ||
    appState.currentSection === 'bom' ||
    appState.currentSection === 'timing' ||
    appState.currentSection === 'documents' ||
    appState.currentSection.startsWith('gate_')
  );

  if (isProjectSection && p) {
    projectNameEl.textContent = p.name;
    projectNameEl.style.display = 'block';
  } else {
    projectNameEl.style.display = 'none';
  }
}

/**
 * Navigate to projects list
 */
export function goProjects() { navigate('projects'); }

/**
 * Navigate to current project home (dashboard)
 */
export function goHome()     { navigate('project'); }

/**
 * Intelligent back navigation
 * Portal sub-pages (capacity/me, production/scheduling, etc.) → portal root
 * Portal root (capacity, production, product-development) → hub
 * NPI sub-sections (apqp, actions, risks, bom, timing, gates) → active project dashboard
 * All other sections → hub
 */
export function navigateBack() {
  // Always return to project dashboard when inside any NPI project section
  const npiSections = ['apqp', 'actions', 'risks', 'bom', 'timing', 'documents'];
  if (npiSections.includes(appState.currentSection) || appState.currentSection.startsWith('gate_')) {
    navigate('project');
    return;
  }

  if (canNavigateBackInApp()) {
    history.back();
    return;
  }

  // Step back to portal root before going all the way to hub
  if (appState.currentSection === 'capacity' && appState.capacityTab !== 'root') {
    setCapacityTab('root');
    return;
  }
  if (appState.currentSection === 'production' && appState.productionTab !== 'root') {
    setProductionTab('root');
    return;
  }
  if (appState.currentSection === 'operations' && appState.operationsTab !== 'overview') {
    setOperationsTab('overview');
    return;
  }
  if (appState.currentSection === 'product-development' && appState.productDevelopmentTab !== 'root') {
    setProductDevelopmentTab('root');
    return;
  }
  if (appState.currentSection === 'project') {
    navigate('projects');
    return;
  }
  navigate('hub');
}

/**
 * Set APQP sub-tab and update URL hash
 * @param {string} t - Tab name (ctq, pfd, pfmea, cp)
 */
export function setApqpTab(t) {
  const prevTab = appState.apqpTab;
  appState.apqpTab = t;
  const parts = ['p=' + encodeURIComponent(appState.progId), 's=apqp'];
  if (t !== 'ctq') parts.push('t=' + encodeURIComponent(t));
  writeNavigationHistory('#' + parts.join('&'), { push: prevTab !== t });
  render();
}

function renderAccessDenied(sectionKey) {
  const label = SECTION_LABELS[sectionKey] || sectionKey || 'this section';
  return `
    <div class="section-inner">
      <div class="card" style="padding:20px;max-width:760px;margin:20px auto">
        <h2 style="margin-top:0">Access denied</h2>
        <p>You do not currently have permission to view ${esc(label)}.</p>
        <p style="color:var(--muted);font-size:13px">Ask an admin to update your role or team grants in Settings.</p>
      </div>
    </div>
  `;
}

/**
 * Main UI render switchboard - clears and repaints #mainContent
 * Routes to appropriate render function based on currentSection
 * 
 * Render flow:
 * 1. Portal-level routing (projects, product-development, production, etc.)
 * 2. Sub-tab routing within portals (capacity, production, product-development)
 * 3. NPI section routing (apqp, actions, risks, bom, timing, gates)
 * 4. Post-render hooks (auto-resize textareas)
 */
export function render() {
  const mc = document.getElementById('mainContent');
  if (!canViewSection(appState.currentSection)) {
    mc.innerHTML = renderAccessDenied(appState.currentSection);
    return;
  }

  if (appState.currentSection === 'projects') {
    const npiGlobal = getNpiGlobal()
    if (typeof npiGlobal?.dashboard?.renderProjects === 'function') {
      mc.innerHTML = npiGlobal.dashboard.renderProjects()
    } else {
      mc.innerHTML = '<div class="section-inner"><div class="card" style="padding:20px;max-width:760px;margin:20px auto">Projects are loading…</div></div>'
    }
    return
  }
  if (appState.currentSection === 'product-development') {
    if (appState.productDevelopmentTab !== 'root' && !canViewPortalTab('product-development', appState.productDevelopmentTab)) {
      mc.innerHTML = renderAccessDenied(`product-development::${appState.productDevelopmentTab}`);
      return;
    }
    mc.innerHTML = `<div class="section-inner">${renderProductDevelopment()}</div>`;
    const pdContainer = mc.querySelector('#product-development-portal-container');
    if (pdContainer) {
      if (familyModalState?.isOpen && typeof renderFamilyModal === 'function') {
        pdContainer.insertAdjacentHTML('beforeend', renderFamilyModal());
      }
      if (templateManagerState?.isOpen && typeof renderTemplateManager === 'function') {
        pdContainer.insertAdjacentHTML('beforeend', renderTemplateManager());
      }
      if (templateViewerState?.isOpen && typeof renderTemplateViewer === 'function') {
        pdContainer.insertAdjacentHTML('beforeend', renderTemplateViewer());
      }
    }
    return;
  }
  if (appState.currentSection === 'production') {
    if (appState.productionTab !== 'root' && !canViewPortalTab('production', appState.productionTab)) {
      mc.innerHTML = renderAccessDenied(`production::${appState.productionTab}`);
      return;
    }
    mc.innerHTML = `<div class="section-inner">${renderProduction()}</div>`;
    return;
  }
  if (appState.currentSection === 'operations') {
    mc.innerHTML = `<div class="section-inner">${renderOperations()}</div>`;
    return;
  }
  if (appState.currentSection === 'feedback') {
    mc.innerHTML = `<div class="section-inner">${renderFeedback()}</div>`;
    feedbackAttachDelegation(); // Fix: attach delegation immediately so tab clicks work before async data loads
    return;
  }
  if (appState.currentSection === 'settings') {
    mc.innerHTML = `<div class="section-inner">${renderSettings()}</div>`;
    return;
  }
  if (appState.currentSection === 'action-centre') {
    mc.innerHTML = `<div class="section-inner">${renderActionCentre()}</div>`;
    actionCentreDataSubscribe()
    if (!appState.actionCentreData && !appState.actionCentreLoading) actionCentreLoad();
    return;
  }
  if (appState.currentSection === 'mcs') {
    renderMcs();
    if (!appState.mcsList || appState.mcsList.length === 0) mcsLoadChanges();
    return;
  }
  if (appState.currentSection === 'capacity') {
    if (appState.capacityTab !== 'root' && !canViewPortalTab('capacity', appState.capacityTab)) {
      mc.innerHTML = renderAccessDenied(`capacity::${appState.capacityTab}`);
      return;
    }
    if (appState.capacityTab === 'root') mc.innerHTML = renderCapacity();
    else if (appState.capacityTab === 'me') mc.innerHTML = `<div class="section-inner">${renderMeCapacity()}</div>`;
    else if (appState.capacityTab === 'production') mc.innerHTML = `<div class="section-inner">${renderProdCapacity()}</div>`;
    else if (appState.capacityTab === 'projects') {
      mc.innerHTML = `<div class="section-inner">${renderPmCapacity()}</div>`;
    }
    else mc.innerHTML = renderCapacity();
    // Draw chart after ME Capacity is rendered
    if (appState.capacityTab === 'me') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          meDrawChartNow()
          setupCapacityEvents()
        });
      });
    } else {
      setupCapacityEvents()
    }
    return;
  }
  if (appState.currentSection === 'hub') { mc.innerHTML = renderHub(); hubInit(); return; }

  // Allow missing project only when coming from URL hash (project may not be loaded yet)
  const hasHashProject = typeof window !== 'undefined' && window.location &&
    window.location.hash.includes('p=') && appState.progId;
  if (!prog() && !hasHashProject) {
    const npiGlobal = getNpiGlobal()
    if (typeof npiGlobal?.dashboard?.renderProjects === 'function') {
      mc.innerHTML = npiGlobal.dashboard.renderProjects()
    } else {
      mc.innerHTML = '<div class="section-inner"><div class="card" style="padding:20px;max-width:760px;margin:20px auto">Projects are loading…</div></div>'
    }
    return
  }

  if (appState.currentSection === 'project' || appState.currentSection.startsWith('gate_')) {
    mc.innerHTML = renderNpi(appState.currentSection);
  } else {
    mc.innerHTML = `<div class="section-inner">${renderSection()}</div>`;
  }

  // Double rAF: first frame commits the new HTML to the DOM;
  // second frame ensures layout is fully calculated before
  // running any post-render hooks (e.g. textarea auto-resize).
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      autoResizeAll();
      const npiGlobal = getNpiGlobal()
      if (typeof npiGlobal?.events?.setup === 'function') npiGlobal.events.setup();

      // Scroll to selected item when navigating from Action Centre
      scrollToSelectedItem();

      // Update project name breadcrumb display
      updateProjectBreadcrumb();
    });
  });
}

/**
 * Renders NPI/APQP sections (apqp, actions, risks, bom, timing)
 * @returns {string} HTML content for the current section
 */
function renderSection() {
  return renderNpiSection(appState.currentSection);
}

/**
 * Scrolls to a selected item when navigating from Action Centre.
 * NPI relational data loads asynchronously, so the first render after
 * navigation may not yet have the row in the DOM.  The selected IDs are
 * therefore kept in state until the row is actually found; they are cleared
 * only on a successful scroll (or when the data is confirmed loaded but the
 * row still cannot be found, meaning the item no longer exists).
 */
function scrollToSelectedItem() {
  // npiLoadedProgId (state.js) is set to progId when npiRelLoad completes.
  const npiDataReady = appState.npiLoadedProgId === appState.progId;

  if (appState.currentSection === 'actions' && appState.selectedActionId) {
    const targetRow = document.querySelector(`tr[data-action-id="${appState.selectedActionId}"]`);
    if (targetRow) {
      targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetRow.classList.add('pulse');
      setTimeout(() => targetRow.classList.remove('pulse'), 2000);
      appState.selectedActionId = null;
    } else if (npiDataReady) {
      // Data is loaded but row not found — item was deleted or ID is wrong; stop retrying.
      appState.selectedActionId = null;
    }
    // If data not yet loaded, keep selectedActionId so the post-load render retries.
  }

  if (appState.currentSection === 'risks' && appState.selectedRiskId) {
    const targetRow = document.querySelector(`tr[data-risk-id="${appState.selectedRiskId}"]`);
    if (targetRow) {
      targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetRow.classList.add('pulse');
      setTimeout(() => targetRow.classList.remove('pulse'), 2000);
      appState.selectedRiskId = null;
    } else if (npiDataReady) {
      appState.selectedRiskId = null;
    }
  }

  if (appState.currentSection === 'apqp' && appState.selectedPfmeaCauseId) {
    // For PFMEA, scroll to the row containing the cause
    const targetRow = document.querySelector(`tr[data-cause-id="${appState.selectedPfmeaCauseId}"]`);
    if (targetRow) {
      targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetRow.classList.add('pulse');
      setTimeout(() => targetRow.classList.remove('pulse'), 2000);
      appState.selectedPfmeaCauseId = null;
    } else if (npiDataReady) {
      appState.selectedPfmeaCauseId = null;
    }
  }
}

// ── Browser back/forward support ─────────────────────────────
/**
 * Handles browser back/forward button navigation
 * Restores state from URL hash parameters
 */
window.addEventListener('popstate', () => {
  if (!currentUser) return;
  const h = parseHash();
  appState.npiTab = h.nft || 'all';
  // Always restore all tab state from hash before navigating.
  // navigate() with pushHash:false will NOT reset tabs, so these values stick.
  appState.capacityTab          = h.ct  || 'root';
  appState.operationsTab        = h.od  || 'overview';
  appState.productionTab        = h.pt  || 'root';
  appState.productDevelopmentTab = h.pdt || 'root';
  if (h.met) setMeTab(h.met);
  if (h.pct) appState.prodCapTab = h.pct;
  if (h.pmt) setPmTabState(h.pmt)
  if (h.t) appState.apqpTab = h.t;

  // Restore NPI Projects Dashboard filters
  if (h.ps)  appState.npiProjectsSearch       = decodeURIComponent(h.ps);
  else       appState.npiProjectsSearch       = '';
  if (h.pf)  appState.npiProjectsFamilyFilter = decodeURIComponent(h.pf);
  else       appState.npiProjectsFamilyFilter = 'all';
  if (h.pst) appState.npiProjectsStatusFilter = decodeURIComponent(h.pst);
  else       appState.npiProjectsStatusFilter = 'all';
  if (h.pvm) appState.npiProjectsViewMode     = decodeURIComponent(h.pvm);
  else       appState.npiProjectsViewMode     = 'active';

  // Restore BOM sub-tab
  if (h.bt)  appState.bomSubTab               = decodeURIComponent(h.bt);
  else       appState.bomSubTab               = 'tree';

  // Restore PFMEA filters
  if (h.pfr) appState.pfmeaRpnFilter          = decodeURIComponent(h.pfr);
  else       appState.pfmeaRpnFilter          = 'all';
  if (h.pfv) appState.pfmeaView               = decodeURIComponent(h.pfv);
  else       appState.pfmeaView               = 'worksheet';

  // Restore CTQ filters
  if (h.csf) appState.ctqSourceFilter         = decodeURIComponent(h.csf);
  else       appState.ctqSourceFilter         = 'all';
  if (h.cof) appState.ctqOosFilter            = decodeURIComponent(h.cof);
  else       appState.ctqOosFilter            = 'all';
  if (h.caf) appState.ctqAgreedFilter         = decodeURIComponent(h.caf);
  else       appState.ctqAgreedFilter         = 'all';
  if (h.ccf) appState.ctqCoverageFilter       = decodeURIComponent(h.ccf);
  else       appState.ctqCoverageFilter       = 'all';

  // Restore tracker sub-assembly filter
  if (h.tsf) appState.trackerSubAsmFilter     = decodeURIComponent(h.tsf);
  else       appState.trackerSubAsmFilter     = 'all';

  if (h.p && db.projects.find(p => p.id === h.p)) {
    appState.progId = h.p;
    navigate(h.s || 'project', { pushHash: false });
  } else if (h.s) {
    navigate(h.s, { pushHash: false });
  } else {
    navigate('hub', { pushHash: false });
  }
});

// ── Global keyboard navigation ──────────────────────────────
/**
 * Returns true when the element is an editable input context
 * (text controls, selects, or contenteditable nodes).
 * @param {EventTarget|null} el - Keyboard event target/active element
 * @returns {boolean}
 */
function isEditableElement(el) {
  if (!el || !(el instanceof Element)) return false;

  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;

  // Handle nested nodes inside editable containers.
  return !!el.closest('[contenteditable="true"], input, textarea, select');
}

/**
 * Returns true when there is an active non-collapsed text selection.
 * This avoids hijacking Backspace while users are interacting with selected text.
 * @returns {boolean}
 */
function hasActiveTextSelection() {
  if (typeof window.getSelection !== 'function') return false;
  const selection = window.getSelection();
  if (!selection) return false;
  return !selection.isCollapsed && selection.toString().length > 0;
}

/**
 * Returns true when any modal overlay is currently visible.
 * @returns {boolean}
 */
function hasVisibleModal() {
  return !!document.querySelector(
    '.modal-bg[style*="display: flex"], .modal-bg[style*="display:flex"], .modal-bg[style*="display: block"], .modal-bg[style*="display:block"]'
  );
}

/**
 * Resolves a hub shortcut key (1-5) to a navigation action.
 * Returns null when the current page is not a supported hub/root view.
 * @param {string} key
 * @returns {Function|null}
 */
function getHubKeyAction(key) {
  if (appState.currentSection === 'hub') {
    const hubRoutes = {
      '1': () => navigate('capacity'),
      '2': () => navigate('product-development'),
      '3': () => navigate('production'),
      '4': () => navigate('operations'),
      '5': () => navigate('mcs')
    };
    return hubRoutes[key] || null;
  }

  if (appState.currentSection === 'capacity' && appState.capacityTab === 'root') {
    const capacityRoutes = {
      '1': () => setCapacityTab('production'),
      '2': () => setCapacityTab('me'),
      '3': () => setCapacityTab('projects')
    };
    return capacityRoutes[key] || null;
  }

  if (appState.currentSection === 'product-development' && appState.productDevelopmentTab === 'root') {
    const productDevelopmentRoutes = {
      '1': () => setProductDevelopmentTab('npi'),
      '2': () => setProductDevelopmentTab('product-management'),
      '3': () => setProductDevelopmentTab('product-family-db'),
      '4': () => setProductDevelopmentTab('parts-database')
    };
    return productDevelopmentRoutes[key] || null;
  }

  if (appState.currentSection === 'production' && appState.productionTab === 'root') {
    const productionRoutes = {
      '1': () => setProductionTab('scheduling'),
      '2': () => setProductionTab('by-product'),
      '3': () => setProductionTab('by-unit')
    };
    return productionRoutes[key] || null;
  }

  return null;
}

/**
 * Backspace acts as app-level back navigation when not typing/editing.
 */
window.addEventListener('keydown', (event) => {
  const isHubNumberShortcut = /^[1-5]$/.test(event.key || '');
  if (isHubNumberShortcut) {
    if (event.defaultPrevented) return;
    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;

    const activeEl = document.activeElement;
    if (isEditableElement(event.target) || isEditableElement(activeEl)) return;
    if (hasVisibleModal()) return;

    const action = getHubKeyAction(event.key);
    if (!action) return;

    event.preventDefault();
    action();
    return;
  }

  const isBackspace = event.key === 'Backspace' || event.keyCode === 8;
  if (!isBackspace) return;
  if (event.defaultPrevented) return;
  if (event.ctrlKey || event.altKey || event.metaKey) return;

  const activeEl = document.activeElement;
  if (isEditableElement(event.target) || isEditableElement(activeEl)) return;
  if (hasActiveTextSelection()) return;

  event.preventDefault();
  navigateBack();
});

ensureNavigationHistoryState();
