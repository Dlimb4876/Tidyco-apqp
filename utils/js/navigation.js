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
  operations: 'Operations Mission Control',
  production: 'Production Planning',
  'product-development': 'Product Development',
  feedback: 'Feedback & Bugs'
};

// 1.5 Back button labels — defined once at module level
const BACK_BUTTON_LABELS = {
  capacity: '← Back to Capacity',
  production: '← Back to Production',
  'product-development': '← Back to Product Development',
  operations: '← Back to Operations',
  feedback: '← Back to Feedback & Bugs',
  apqp: '← Back to Project',
  actions: '← Back to Project',
  risks: '← Back to Project',
  bom: '← Back to Project',
  timing: '← Back to Project'
};

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
  return ['projects', 'project', 'apqp', 'actions', 'risks', 'bom', 'timing'].includes(sec);
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
    if (sec === 'operations' && operationsTab !== 'overview') parts.push('od=' + encodeURIComponent(operationsTab));
    if (sec === 'production' && productionTab !== 'root') parts.push('pt=' + encodeURIComponent(productionTab));
    if (sec === 'product-development' && productDevelopmentTab !== 'root') parts.push('pdt=' + encodeURIComponent(productDevelopmentTab));
    const hash = parts.length ? '#' + parts.join('&') : '#';
    if (sec === prevSection) {
      history.replaceState(null, '', hash);
    } else {
      history.pushState(null, '', hash);
    }
  }

  // Show Return to Portal button on all feature pages (not hub, projects, or project home)
  const returnBtn = document.getElementById('returnHubBtn');
  returnBtn.style.display = (sec === 'hub' || sec === 'projects' || sec === 'project') ? 'none' : 'flex';
  // 1.5 Dynamic back button text using module-level constant
  returnBtn.textContent = BACK_BUTTON_LABELS[sec] || '← Return to Portal';

  render();
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
  const npiSections = ['apqp', 'actions', 'risks', 'bom', 'timing'];
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
  apqpTab = t;
  const parts = ['p=' + encodeURIComponent(progId), 's=apqp'];
  if (t !== 'ctq') parts.push('t=' + encodeURIComponent(t));
  history.replaceState(null, '', '#' + parts.join('&'));
  render();
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
  if (currentSection === 'projects') { mc.innerHTML = npi.dashboard.renderProjects(); return; }
  if (currentSection === 'product-development') {
    let html = `<div class="section-inner">${renderProductDevelopment()}</div>`;
    if (familyModalState?.isOpen && typeof renderFamilyModal === 'function') {
      html += renderFamilyModal();
    }
    if (templateManagerState?.isOpen && typeof renderTemplateManager === 'function') {
      html += renderTemplateManager();
    }
    mc.innerHTML = html;
    return;
  }
  if (currentSection === 'production') {
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
  if (currentSection === 'capacity') {
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
  if (!prog()) { mc.innerHTML = renderProjects(); return; }

  if (currentSection === 'hub') { mc.innerHTML = renderHub(); return; }

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
  return '';
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
  if (h.t) apqpTab = h.t;
  if (h.p && db.programmes.find(p => p.id === h.p)) {
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
 * Backspace acts as app-level back navigation when not typing/editing.
 */
window.addEventListener('keydown', (event) => {
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
