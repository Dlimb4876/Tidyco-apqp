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
  production: 'Production Planning',
  products: 'Products',
  productmgmt: 'Product Management',
  bugreports: 'Bug Reports'
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
 * - Bug reports data initialization
 */
function navigate(sec, { pushHash = true } = {}) {
  if (sec === 'home') sec = 'project';

  // Clean up subscriptions when leaving bugreports
  if (currentSection === 'bugreports' && sec !== 'bugreports' && typeof bugDataUnsubscribe === 'function') {
    bugDataUnsubscribe();
  }

  // Initialize bugreports data when navigating TO bugreports
  if (sec === 'bugreports' && currentSection !== 'bugreports' && typeof bugDataManager !== 'undefined') {
    bugDataManager.init().catch(err => console.error('Failed to initialize bug reports:', err));
  }

  // Clean up subscriptions when leaving capacity
  if (currentSection === 'capacity' && sec !== 'capacity') {
    if (typeof meDataUnsubscribe === 'function') meDataUnsubscribe();
    if (typeof prodCapUnsubscribeUtilization === 'function') prodCapUnsubscribeUtilization();
  }

  // Reset capacityTab to 'root' when navigating TO capacity from outside (e.g., from hub)
  if (sec === 'capacity' && currentSection !== 'capacity') {
    capacityTab = 'root';
  }

  // Clean up subscriptions when leaving production
  if (currentSection === 'production' && sec !== 'production') {
    if (typeof prodDataUnsubscribe === 'function') prodDataUnsubscribe();
  }

  // Reset productionTab to 'root' when navigating TO production from outside
  if (sec === 'production' && currentSection !== 'production') {
    productionTab = 'root';
  }

  // Reset productDevelopmentTab to 'root' when navigating TO product-development from outside
  if (sec === 'product-development' && currentSection !== 'product-development') {
    productDevelopmentTab = 'root';
    if (typeof productsActiveTab !== 'undefined') productsActiveTab = 'list';
  }

  // Clean up families subscription when leaving product-development
  if (currentSection === 'product-development' && sec !== 'product-development' && typeof familiesDataCleanup === 'function') {
    familiesDataCleanup();
  }

  currentSection = sec;

  if (pushHash) {
    const parts = [];
    if (progId)             parts.push('p=' + encodeURIComponent(progId));
    if (sec !== 'projects') parts.push('s=' + encodeURIComponent(sec));
    if (sec === 'projects' && npiTab !== 'all') parts.push('nft=' + encodeURIComponent(npiTab));
    if (sec === 'apqp' && apqpTab !== 'ctq') parts.push('t=' + encodeURIComponent(apqpTab));
    if (sec === 'capacity' && capacityTab !== 'root') parts.push('ct=' + encodeURIComponent(capacityTab));
    if (sec === 'production' && productionTab !== 'root') parts.push('pt=' + encodeURIComponent(productionTab));
    if (sec === 'product-development' && productDevelopmentTab !== 'root') parts.push('pdt=' + encodeURIComponent(productDevelopmentTab));
    const hash = parts.length ? '#' + parts.join('&') : '#';
    if (sec === currentSection || sec === 'apqp' || sec === 'capacity' || sec === 'production' || sec === 'product-development') {
      history.replaceState(null, '', hash);
    } else {
      history.pushState(null, '', hash);
    }
  }

  // Show Return to Portal button on all feature pages (not hub, projects, or project home)
  const returnBtn = document.getElementById('returnHubBtn');
  returnBtn.style.display = (sec === 'hub' || sec === 'projects' || sec === 'project') ? 'none' : 'flex';

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
 * NPI sub-sections (apqp, actions, risks, bom, timing) → product-development
 * All other sections → hub
 */
function navigateBack() {
  const npiSections = ['apqp', 'actions', 'risks', 'bom', 'timing'];
  if (npiSections.includes(currentSection) || currentSection.startsWith('gate_')) {
    navigate('product-development');
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
  if (currentSection === 'products') {
    mc.innerHTML = renderProductsPortalHTML();
    renderProductsPortalSetup();
    return;
  }
  if (currentSection === 'productmgmt') {
    mc.innerHTML = `<div class="section-inner">${renderProductMgmt()}</div>`;
    return;
  }
  if (currentSection === 'bugreports') {
    mc.innerHTML = `<div class="section-inner">${renderBugReports()}</div>`;
    return;
  }
  if (currentSection === 'capacity') {
    if (capacityTab === 'root') mc.innerHTML = renderCapacity();
    else if (capacityTab === 'me') mc.innerHTML = `<div class="section-inner">${renderMeCapacity()}</div>`;
    else if (capacityTab === 'overhaul') mc.innerHTML = `<div class="section-inner">${renderProdCapacity()}</div>`;
    else if (capacityTab === 'projects') mc.innerHTML = `<div class="section-inner"><div style="padding: 20px; text-align: center; color: var(--muted);">Projects Capacity coming soon</div></div>`;
    else mc.innerHTML = renderCapacity();
    // Draw chart after ME Capacity is rendered
    if (capacityTab === 'me') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (typeof meDrawChartNow === 'function') meDrawChartNow();
        });
      });
    }
    return;
  }
  if (!prog()) { mc.innerHTML = renderProjects(); return; }

  if (currentSection === 'hub') { mc.innerHTML = renderHub(); return; }

  if (currentSection === 'project') mc.innerHTML = npi.dashboard.renderDashboard();
  else if (currentSection.startsWith('gate_')) mc.innerHTML = npi.gate.renderGatePage(+currentSection.split('_')[1]);
  else { mc.innerHTML = `<div class="section-inner">${renderSection()}</div>`; }

  // Double rAF: first frame commits the new HTML to the DOM;
  // second frame ensures layout is fully calculated before
  // running any post-render hooks (e.g. textarea auto-resize).
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      autoResizeAll();
    });
  });
}

/**
 * Renders NPI/APQP sections (apqp, actions, risks, bom, timing)
 * @returns {string} HTML content for the current section
 */
function renderSection() {
  if (currentSection === 'apqp')    return npi.apqp.renderAPQP();
  if (currentSection === 'actions') return npi.tracker.renderActions();
  if (currentSection === 'risks')   return npi.tracker.renderRisks();
  if (currentSection === 'bom')     return npi.bom.renderBOM();
  if (currentSection === 'timing')  return npi.timing.renderTimingPlan();
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
  if (h.p && db.programmes.find(p => p.id === h.p)) {
    progId = h.p;
    if (h.t)   apqpTab              = h.t;
    if (h.ct)  capacityTab          = h.ct;
    if (h.pt)  productionTab        = h.pt;
    if (h.pdt) productDevelopmentTab = h.pdt;
    navigate(h.s || 'project', { pushHash: false });
  } else {
    navigate('projects', { pushHash: false });
  }
});
