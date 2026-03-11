// ═══════════════════════════════════
// navigation.js — Hash-based routing
// Depends on: state.js, helpers.js, all feature renderers
// ═══════════════════════════════════

const SECTION_LABELS = {
  apqp:    'APQP',
  actions: 'Action Tracker',
  risks:   'Risk Register',
  bom:     'Bill of Materials',
  timing:  'NPI Timing Plan',
  capacity: 'Capacity Management',
  production: 'Production Planning',
  products: 'Products',
  productmgmt: 'Product Management'
};

function parseHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return {};
  return Object.fromEntries(hash.split('&').map(p => {
    const [k, ...v] = p.split('=');
    return [k, decodeURIComponent(v.join('='))];
  }));
}

function navigate(sec, { pushHash = true } = {}) {
  if (sec === 'home') sec = 'project';

  // Reset capacityTab to 'root' when navigating TO capacity from outside (e.g., from hub)
  if (sec === 'capacity' && currentSection !== 'capacity') {
    capacityTab = 'root';
  }

  // Reset productionTab to 'root' when navigating TO production from outside
  if (sec === 'production' && currentSection !== 'production') {
    productionTab = 'root';
  }

  // Reset productDevelopmentTab to 'root' when navigating TO product-development from outside
  if (sec === 'product-development' && currentSection !== 'product-development') {
    productDevelopmentTab = 'root';
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

function goProjects() { navigate('projects'); }
function goHome()     { navigate('project'); }

function setApqpTab(t) {
  apqpTab = t;
  const parts = ['p=' + encodeURIComponent(progId), 's=apqp'];
  if (t !== 'ctq') parts.push('t=' + encodeURIComponent(t));
  history.replaceState(null, '', '#' + parts.join('&'));
  render();
}

function render() {
  const mc = document.getElementById('mainContent');
  if (currentSection === 'projects') { mc.innerHTML = renderProjects(); return; }
  if (currentSection === 'product-development') {
    let html = `<div class="section-inner">${renderProductDevelopment()}</div>`;
    if (familyModalState?.isOpen && typeof renderFamilyModal === 'function') {
      html += renderFamilyModal();
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
  if (currentSection === 'capacity') {
    if (capacityTab === 'root') mc.innerHTML = renderCapacity();
    else if (capacityTab === 'me') mc.innerHTML = `<div class="section-inner">${renderMeCapacity()}</div>`;
    else if (capacityTab === 'overhaul') mc.innerHTML = `<div class="section-inner"><div style="padding: 20px; text-align: center; color: var(--muted);">Overhaul Capacity coming soon</div></div>`;
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

  if (currentSection === 'project') mc.innerHTML = renderDashboard();
  else if (currentSection.startsWith('gate_')) mc.innerHTML = renderGatePage(+currentSection.split('_')[1]);
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

function renderSection() {
  if (currentSection === 'apqp')    return renderAPQP();
  if (currentSection === 'actions') return renderActions();
  if (currentSection === 'risks')   return renderRisks();
  if (currentSection === 'bom')     return renderBOM();
  if (currentSection === 'timing')  return renderTimingPlan();
  return '';
}

// ── Browser back/forward support ─────────────────────────────
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
