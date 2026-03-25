// ═══════════════════════════════════
// navigation.js — Hash-based routing
// Depends on: state.js, helpers.js, all feature renderers
// ═══════════════════════════════════

/**
 * Section labels for UI display (reserved for future use)
 */
const SECTION_LABELS = {
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

// 1.5 Back button labels — defined once at module level
const BACK_BUTTON_LABELS = {
  capacity: '← Back to Capacity',
  production: '← Back to Production',
  'product-development': '← Back to Product Development',
  operations: '← Back to Operations',
  feedback: '← Back to Feedback & Bugs',
  'action-centre': '← Back to Hub',
  mcs: '← Back to Hub',
  apqp: '← Back to Project',
  actions: '← Back to Project',
  risks: '← Back to Project',
  bom: '← Back to Project',
  timing: '← Back to Project',
  documents: '← Back to Project'
};

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

function writeNavigationHistory(hash, { push = false } = {}) {
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
function parseHash() {
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
function navigate(sec, { pushHash = true } = {}) {
  if (sec === 'home') sec = 'project';

  // Keep NPI project pages live-updated across all users.
  const leavingNpiLiveSection = isNpiLiveSection(currentSection) && !isNpiLiveSection(sec);
  const enteringNpiLiveSection = !isNpiLiveSection(currentSection) && isNpiLiveSection(sec);

  if (leavingNpiLiveSection) {
    if (typeof npi?.cleanup === 'function') npi.cleanup();
    else if (typeof npiDataUnsubscribe === 'function') npiDataUnsubscribe();
    // Task 2-A: stop broadcasting presence when leaving NPI project view
    if (typeof stopPresenceBroadcast === 'function') stopPresenceBroadcast();
  }

  if (enteringNpiLiveSection) {
    if (typeof npi?.init === 'function') npi.init();
    else if (typeof npiDataInit === 'function') npiDataInit();
    // Task 2-A: start broadcasting presence when entering NPI project view
    if (progId && typeof broadcastPresence === 'function') broadcastPresence(progId);
  }

  // Clean up subscriptions when leaving feedback
  if (currentSection === 'feedback' && sec !== 'feedback' && typeof feedbackDataUnsubscribe === 'function') {
    feedbackDataUnsubscribe();
  }

  // Initialize feedback data when navigating TO feedback
  if (sec === 'feedback' && currentSection !== 'feedback' && typeof feedbackDataManager !== 'undefined') {
    feedbackDataManager.init().catch(err => console.error('Failed to initialize feedback:', err));
  }

  // Clean up subscriptions when leaving capacity
  if (currentSection === 'capacity' && sec !== 'capacity') {
    if (typeof meDataUnsubscribe === 'function') meDataUnsubscribe();
    if (typeof prodCapUnsubscribeUtilization === 'function') prodCapUnsubscribeUtilization();
    if (typeof workAreasDataUnsubscribe === 'function') workAreasDataUnsubscribe();
  }

  // Clean up MCS subscriptions when leaving MCS
  if (currentSection === 'mcs' && sec !== 'mcs') {
    if (typeof mcsCleanupRealtimeSubscriptions === 'function') mcsCleanupRealtimeSubscriptions();
    if (typeof mcsStopPolling === 'function') mcsStopPolling();
  }

  // Setup MCS subscriptions when entering MCS
  if (sec === 'mcs' && currentSection !== 'mcs') {
    if (typeof mcsSetupRealtimeSubscriptions === 'function') {
      setTimeout(() => mcsSetupRealtimeSubscriptions(), 100);
    }
  }

  // Clean up subscriptions when leaving production
  if (currentSection === 'production' && sec !== 'production') {
    if (typeof prodDataUnsubscribe === 'function') prodDataUnsubscribe();
  }

  // Clean up subscriptions when leaving operations
  if (currentSection === 'operations' && sec !== 'operations') {
    if (typeof opsRealtimeCleanup === 'function') opsRealtimeCleanup();
  }

  // Clean up families subscription when leaving product-development
  if (currentSection === 'product-development' && sec !== 'product-development' && typeof familiesDataCleanup === 'function') {
    familiesDataCleanup();
  }
  if (currentSection === 'product-development' && sec !== 'product-development' && typeof familyTemplatesDataUnsubscribe === 'function') {
    familyTemplatesDataUnsubscribe();
  }

  // Clean up subscriptions when leaving settings
  if (currentSection === 'settings' && sec !== 'settings') {
    if (typeof familiesDataCleanup === 'function') familiesDataCleanup();
    if (typeof workAreasDataUnsubscribe === 'function') workAreasDataUnsubscribe();
  }

  // Initialize operations real-time subscriptions when entering operations.
  if (sec === 'operations' && currentSection !== 'operations' && typeof opsRealtimeInit === 'function') {
    opsRealtimeInit();
  }

  const prevSection = currentSection;
  currentSection = sec;

  if (pushHash) {
    // Reset portal tabs to 'root' only for new user-driven navigations (not back/forward restores).
    // This intentionally runs after prevSection is captured so the check is correct.
    if (sec === 'capacity' && prevSection !== 'capacity') capacityTab = 'root';
    if (sec === 'operations' && prevSection !== 'operations') operationsTab = 'overview';
    if (sec === 'production' && prevSection !== 'production') productionTab = 'root';
    if (sec === 'product-development' && prevSection !== 'product-development') {
      productDevelopmentTab = 'root';
      if (typeof productsActiveTab !== 'undefined') productsActiveTab = 'list';
    }

    const parts = [];
    if (progId)             parts.push('p=' + encodeURIComponent(progId));
    if (sec !== 'projects') parts.push('s=' + encodeURIComponent(sec));
    if (sec === 'projects' && npiTab !== 'all') parts.push('nft=' + encodeURIComponent(npiTab));
    if (sec === 'apqp' && apqpTab !== 'ctq') parts.push('t=' + encodeURIComponent(apqpTab));
    if (sec === 'capacity' && capacityTab !== 'root') parts.push('ct=' + encodeURIComponent(capacityTab));
    if (sec === 'capacity' && capacityTab === 'me' && typeof meTab !== 'undefined' && meTab !== 'chart') parts.push('met=' + encodeURIComponent(meTab));
    if (sec === 'capacity' && capacityTab === 'production' && prodCapTab !== 'dashboard') parts.push('pct=' + encodeURIComponent(prodCapTab));
    if (sec === 'capacity' && capacityTab === 'projects' && typeof pmTab !== 'undefined' && pmTab !== 'chart') parts.push('pmt=' + encodeURIComponent(pmTab));
    if (sec === 'operations' && operationsTab !== 'overview') parts.push('od=' + encodeURIComponent(operationsTab));
    if (sec === 'production' && productionTab !== 'root') parts.push('pt=' + encodeURIComponent(productionTab));
    if (sec === 'product-development' && productDevelopmentTab !== 'root') parts.push('pdt=' + encodeURIComponent(productDevelopmentTab));

    // NPI Projects Dashboard filters
    if (sec === 'projects') {
      if (npiProjectsSearch) parts.push('ps=' + encodeURIComponent(npiProjectsSearch));
      if (npiProjectsFamilyFilter !== 'all') parts.push('pf=' + encodeURIComponent(npiProjectsFamilyFilter));
      if (npiProjectsStatusFilter !== 'all') parts.push('pst=' + encodeURIComponent(npiProjectsStatusFilter));
      if (npiProjectsViewMode !== 'active') parts.push('pvm=' + encodeURIComponent(npiProjectsViewMode));
    }

    // BOM sub-tab
    if (sec === 'project' && typeof bomSubTab !== 'undefined' && bomSubTab !== 'tree') {
      parts.push('bt=' + encodeURIComponent(bomSubTab));
    }

    // PFMEA filters
    if (sec === 'project' && typeof apqpTab !== 'undefined' && apqpTab === 'pfmea') {
      if (typeof pfmeaRpnFilter !== 'undefined' && pfmeaRpnFilter !== 'all') {
        parts.push('pfr=' + encodeURIComponent(pfmeaRpnFilter));
      }
      if (typeof pfmeaView !== 'undefined' && pfmeaView !== 'worksheet') {
        parts.push('pfv=' + encodeURIComponent(pfmeaView));
      }
    }

    // CTQ filters
    if (sec === 'project' && typeof apqpTab !== 'undefined' && apqpTab === 'ctq') {
      if (typeof ctqSourceFilter !== 'undefined' && ctqSourceFilter !== 'all') {
        parts.push('csf=' + encodeURIComponent(ctqSourceFilter));
      }
      if (typeof ctqOosFilter !== 'undefined' && ctqOosFilter !== 'all') {
        parts.push('cof=' + encodeURIComponent(ctqOosFilter));
      }
      if (typeof ctqAgreedFilter !== 'undefined' && ctqAgreedFilter !== 'all') {
        parts.push('caf=' + encodeURIComponent(ctqAgreedFilter));
      }
      if (typeof ctqCoverageFilter !== 'undefined' && ctqCoverageFilter !== 'all') {
        parts.push('ccf=' + encodeURIComponent(ctqCoverageFilter));
      }
    }

    // Tracker sub-assembly filter
    if (sec === 'project' && typeof trackerSubAsmFilter !== 'undefined' && trackerSubAsmFilter !== 'all') {
      parts.push('tsf=' + encodeURIComponent(trackerSubAsmFilter));
    }

    const hash = parts.length ? '#' + parts.join('&') : '#';
    writeNavigationHistory(hash, { push: sec !== prevSection });
  }

  // Show Return to Portal button on all feature pages (not hub, projects, or project home)
  const returnBtn = document.getElementById('returnHubBtn');
  returnBtn.style.display = (sec === 'hub' || sec === 'projects' || sec === 'project') ? 'none' : 'flex';
  // 1.5 Dynamic back button text using module-level constant
  returnBtn.textContent = BACK_BUTTON_LABELS[sec] || '← Return to Portal';

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
  const isProjectSection = progId && p && (
    currentSection === 'project' ||
    currentSection === 'apqp' ||
    currentSection === 'actions' ||
    currentSection === 'risks' ||
    currentSection === 'bom' ||
    currentSection === 'timing' ||
    currentSection === 'documents' ||
    currentSection.startsWith('gate_')
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
function goProjects() { navigate('projects'); }

/**
 * Navigate to current project home (dashboard)
 */
function goHome()     { navigate('project'); }

/**
 * Intelligent back navigation
 * Portal sub-pages (capacity/me, production/scheduling, etc.) → portal root
 * Portal root (capacity, production, product-development) → hub
 * NPI sub-sections (apqp, actions, risks, bom, timing, gates) → active project dashboard
 * All other sections → hub
 */
function navigateBack() {
  if (canNavigateBackInApp()) {
    history.back();
    return;
  }

  // Step back to portal root before going all the way to hub
  if (currentSection === 'capacity' && capacityTab !== 'root') {
    setCapacityTab('root');
    return;
  }
  if (currentSection === 'production' && productionTab !== 'root') {
    setProductionTab('root');
    return;
  }
  if (currentSection === 'operations' && operationsTab !== 'overview') {
    setOperationsTab('overview');
    return;
  }
  if (currentSection === 'product-development' && productDevelopmentTab !== 'root') {
    setProductDevelopmentTab('root');
    return;
  }
  if (currentSection === 'project') {
    navigate('projects');
    return;
  }
  const npiSections = ['apqp', 'actions', 'risks', 'bom', 'timing', 'documents'];
  if (npiSections.includes(currentSection) || currentSection.startsWith('gate_')) {
    navigate('project');
  } else {
    navigate('hub');
  }
}

/**
 * Set APQP sub-tab and update URL hash
 * @param {string} t - Tab name (ctq, pfd, pfmea, cp)
 */
function setApqpTab(t) {
  const prevTab = apqpTab;
  apqpTab = t;
  const parts = ['p=' + encodeURIComponent(progId), 's=apqp'];
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
function render() {
  const mc = document.getElementById('mainContent');
  if (typeof canViewSection === 'function' && !canViewSection(currentSection)) {
    mc.innerHTML = renderAccessDenied(currentSection);
    return;
  }

  if (currentSection === 'projects') { mc.innerHTML = npi.dashboard.renderProjects(); return; }
  if (currentSection === 'product-development') {
    if (productDevelopmentTab !== 'root' && typeof canViewPortalTab === 'function' && !canViewPortalTab('product-development', productDevelopmentTab)) {
      mc.innerHTML = renderAccessDenied(`product-development::${productDevelopmentTab}`);
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
  if (currentSection === 'production') {
    if (productionTab !== 'root' && typeof canViewPortalTab === 'function' && !canViewPortalTab('production', productionTab)) {
      mc.innerHTML = renderAccessDenied(`production::${productionTab}`);
      return;
    }
    mc.innerHTML = `<div class="section-inner">${renderProduction()}</div>`;
    return;
  }
  if (currentSection === 'operations') {
    mc.innerHTML = `<div class="section-inner">${renderOperationsDashboard()}</div>`;
    return;
  }
  if (currentSection === 'feedback') {
    mc.innerHTML = `<div class="section-inner">${renderFeedback()}</div>`;
    return;
  }
  if (currentSection === 'settings') {
    mc.innerHTML = `<div class="section-inner">${renderSettings()}</div>`;
    return;
  }
  if (currentSection === 'action-centre') {
    mc.innerHTML = `<div class="section-inner">${renderActionCentre()}</div>`;
    if (!actionCentreData && !actionCentreLoading) actionCentreLoad();
    return;
  }
  if (currentSection === 'mcs') {
    renderMcs();
    if (!mcsList || mcsList.length === 0) mcsLoadChanges();
    return;
  }
  if (currentSection === 'capacity') {
    if (capacityTab !== 'root' && typeof canViewPortalTab === 'function' && !canViewPortalTab('capacity', capacityTab)) {
      mc.innerHTML = renderAccessDenied(`capacity::${capacityTab}`);
      return;
    }
    if (capacityTab === 'root') mc.innerHTML = renderCapacity();
    else if (capacityTab === 'me') mc.innerHTML = `<div class="section-inner">${renderMeCapacity()}</div>`;
    else if (capacityTab === 'production') mc.innerHTML = `<div class="section-inner">${renderProdCapacity()}</div>`;
    else if (capacityTab === 'projects') {
      if (typeof pmRenderCapacity === 'function') {
        mc.innerHTML = `<div class="section-inner">${pmRenderCapacity()}</div>`;
      } else {
        mc.innerHTML = `<div class="section-inner"><div style="padding: 20px; text-align: center; color: var(--muted);">Project Management Capacity unavailable</div></div>`;
      }
    }
    else mc.innerHTML = renderCapacity();
    // Draw chart after ME Capacity is rendered
    if (capacityTab === 'me') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (typeof meDrawChartNow === 'function') meDrawChartNow();
          if (typeof capacityEvents?.setup === 'function') capacityEvents.setup();
        });
      });
    } else {
      if (typeof capacityEvents?.setup === 'function') capacityEvents.setup();
    }
    return;
  }
  if (currentSection === 'hub') { mc.innerHTML = renderHub(); hubInit(); return; }

  if (!prog()) { mc.innerHTML = npi.dashboard.renderProjects(); return; }

  if (currentSection === 'project' || currentSection.startsWith('gate_')) {
    mc.innerHTML = typeof npi?.render === 'function'
      ? npi.render(currentSection)
      : (currentSection === 'project'
        ? npi.dashboard.renderDashboard()
        : npi.gate.renderGatePage(+currentSection.split('_')[1]));
  } else {
    mc.innerHTML = `<div class="section-inner">${renderSection()}</div>`;
  }

  // Double rAF: first frame commits the new HTML to the DOM;
  // second frame ensures layout is fully calculated before
  // running any post-render hooks (e.g. textarea auto-resize).
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      autoResizeAll();
      if (typeof npi?.events?.setup === 'function') npi.events.setup();

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
  if (typeof npi?.render === 'function') return npi.render(currentSection);
  if (currentSection === 'apqp') return npi.apqp.renderAPQP();
  if (currentSection === 'actions') return npi.tracker.renderActions();
  if (currentSection === 'risks') return npi.tracker.renderRisks();
  if (currentSection === 'bom') return npi.bom.renderBOM();
  if (currentSection === 'timing') return npi.timing.renderTimingPlan();
  if (currentSection === 'documents') return npi.docs.render();
  return '';
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
  const npiDataReady = npiLoadedProgId === progId;

  if (currentSection === 'actions' && selectedActionId) {
    const targetRow = document.querySelector(`tr[data-action-id="${selectedActionId}"]`);
    if (targetRow) {
      targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetRow.classList.add('pulse');
      setTimeout(() => targetRow.classList.remove('pulse'), 2000);
      selectedActionId = null;
    } else if (npiDataReady) {
      // Data is loaded but row not found — item was deleted or ID is wrong; stop retrying.
      selectedActionId = null;
    }
    // If data not yet loaded, keep selectedActionId so the post-load render retries.
  }

  if (currentSection === 'risks' && selectedRiskId) {
    const targetRow = document.querySelector(`tr[data-risk-id="${selectedRiskId}"]`);
    if (targetRow) {
      targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetRow.classList.add('pulse');
      setTimeout(() => targetRow.classList.remove('pulse'), 2000);
      selectedRiskId = null;
    } else if (npiDataReady) {
      selectedRiskId = null;
    }
  }

  if (currentSection === 'apqp' && selectedPfmeaCauseId) {
    // For PFMEA, scroll to the row containing the cause
    const targetRow = document.querySelector(`tr[data-cause-id="${selectedPfmeaCauseId}"]`);
    if (targetRow) {
      targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetRow.classList.add('pulse');
      setTimeout(() => targetRow.classList.remove('pulse'), 2000);
      selectedPfmeaCauseId = null;
    } else if (npiDataReady) {
      selectedPfmeaCauseId = null;
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
  npiTab = h.nft || 'all';
  // Always restore all tab state from hash before navigating.
  // navigate() with pushHash:false will NOT reset tabs, so these values stick.
  capacityTab          = h.ct  || 'root';
  operationsTab        = h.od  || 'overview';
  productionTab        = h.pt  || 'root';
  productDevelopmentTab = h.pdt || 'root';
  if (h.met && typeof meTab !== 'undefined') meTab = h.met;
  if (h.pct) prodCapTab = h.pct;
  if (h.pmt && typeof pmTab !== 'undefined') pmTab = h.pmt;
  if (h.t) apqpTab = h.t;

  // Restore NPI Projects Dashboard filters
  if (h.ps)  npiProjectsSearch       = decodeURIComponent(h.ps);
  else       npiProjectsSearch       = '';
  if (h.pf)  npiProjectsFamilyFilter = decodeURIComponent(h.pf);
  else       npiProjectsFamilyFilter = 'all';
  if (h.pst) npiProjectsStatusFilter = decodeURIComponent(h.pst);
  else       npiProjectsStatusFilter = 'all';
  if (h.pvm) npiProjectsViewMode     = decodeURIComponent(h.pvm);
  else       npiProjectsViewMode     = 'active';

  // Restore BOM sub-tab
  if (h.bt)  bomSubTab               = decodeURIComponent(h.bt);
  else       bomSubTab               = 'tree';

  // Restore PFMEA filters
  if (h.pfr) pfmeaRpnFilter          = decodeURIComponent(h.pfr);
  else       pfmeaRpnFilter          = 'all';
  if (h.pfv) pfmeaView               = decodeURIComponent(h.pfv);
  else       pfmeaView               = 'worksheet';

  // Restore CTQ filters
  if (h.csf) ctqSourceFilter         = decodeURIComponent(h.csf);
  else       ctqSourceFilter         = 'all';
  if (h.cof) ctqOosFilter            = decodeURIComponent(h.cof);
  else       ctqOosFilter            = 'all';
  if (h.caf) ctqAgreedFilter         = decodeURIComponent(h.caf);
  else       ctqAgreedFilter         = 'all';
  if (h.ccf) ctqCoverageFilter       = decodeURIComponent(h.ccf);
  else       ctqCoverageFilter       = 'all';

  // Restore tracker sub-assembly filter
  if (h.tsf) trackerSubAsmFilter     = decodeURIComponent(h.tsf);
  else       trackerSubAsmFilter     = 'all';

  if (h.p && db.projects.find(p => p.id === h.p)) {
    progId = h.p;
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
  if (currentSection === 'hub') {
    const hubRoutes = {
      '1': () => navigate('capacity'),
      '2': () => navigate('product-development'),
      '3': () => navigate('production'),
      '4': () => navigate('operations'),
      '5': () => navigate('mcs')
    };
    return hubRoutes[key] || null;
  }

  if (currentSection === 'capacity' && capacityTab === 'root') {
    const capacityRoutes = {
      '1': () => setCapacityTab('production'),
      '2': () => setCapacityTab('me'),
      '3': () => setCapacityTab('projects')
    };
    return capacityRoutes[key] || null;
  }

  if (currentSection === 'product-development' && productDevelopmentTab === 'root') {
    const productDevelopmentRoutes = {
      '1': () => setProductDevelopmentTab('npi'),
      '2': () => setProductDevelopmentTab('product-management'),
      '3': () => setProductDevelopmentTab('product-family-db'),
      '4': () => setProductDevelopmentTab('parts-database')
    };
    return productDevelopmentRoutes[key] || null;
  }

  if (currentSection === 'production' && productionTab === 'root') {
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
