// Production Planning Portal Hub
// Entry point for production planning module

let productionPortalDelegationContainer = null;

/**
 * Refresh only the #prodTabBody content without a full render().
 * Used by the focusout flush to avoid re-mounting the full portal.
 */
function prodRefreshCurrentTab() {
  if (currentSection !== 'production') return;
  if (isEditingInlineCell()) return;
  if (!window.prodPendingRealTimeUpdate) return;
  window.prodPendingRealTimeUpdate = false;
  const body = document.getElementById('prodTabBody');
  if (!body) { render(); return; }
  let content = '';
  if      (productionTab === 'scheduling')  content = typeof renderScheduling    === 'function' ? renderScheduling()    : '';
  else if (productionTab === 'by-product')  content = typeof renderPlanByProduct === 'function' ? renderPlanByProduct() : '';
  else if (productionTab === 'by-unit')     content = typeof renderPlanByUnit    === 'function' ? renderPlanByUnit()    : '';
  body.innerHTML = content;
}

function setProductionTab(tab) {
  const prevTab = productionTab;
  productionTab = tab;
  const parts = ['s=production'];
  if (tab !== 'root') parts.push('pt=' + encodeURIComponent(tab));
  const hash = '#' + parts.join('&');
  if (typeof writeNavigationHistory === 'function') {
    writeNavigationHistory(hash, { push: prevTab !== tab });
  } else {
    history.replaceState(null, '', hash);
  }
  render();
}

function prodNavBar() {
  return `
    <div class="prod-nav-bar">
      <button class="prod-nav-item prod-nav-back" data-action="prod-nav-root">← Back</button>
      <button class="prod-nav-item ${productionTab === 'scheduling' ? 'active' : ''}" data-action="prod-nav-tab" data-tab="scheduling">📅 Schedule</button>
      <button class="prod-nav-item ${productionTab === 'by-product' ? 'active' : ''}" data-action="prod-nav-tab" data-tab="by-product">📋 Plan by Product</button>
      <button class="prod-nav-item ${productionTab === 'by-unit' ? 'active' : ''}" data-action="prod-nav-tab" data-tab="by-unit">🏭 Plan by Work Area</button>
    </div>
  `;
}

function renderProduction() {
  const nav = prodNavBar();
  // Products are now managed in Product Management — redirect if accessed
  if (productionTab === 'products') {
    setProductionTab('scheduling');
    setTimeout(setupProductionPortalDelegation, 0);
    return `<div id="production-portal-container">${nav}<div id="prodTabBody">${renderScheduling()}</div></div>`;
  }
  if (productionTab === 'scheduling') {
    setTimeout(setupProductionPortalDelegation, 0);
    return `<div id="production-portal-container">${nav}<div id="prodTabBody">${renderScheduling()}</div></div>`;
  }
  if (productionTab === 'by-product') {
    setTimeout(setupProductionPortalDelegation, 0);
    return `<div id="production-portal-container">${nav}<div id="prodTabBody">${renderPlanByProduct()}</div></div>`;
  }
  if (productionTab === 'by-unit') {
    setTimeout(setupProductionPortalDelegation, 0);
    return `<div id="production-portal-container">${nav}<div id="prodTabBody">${renderPlanByUnit()}</div></div>`;
  }

  // Root hub view
  setTimeout(setupProductionPortalDelegation, 0);
  return `
    <div class="proj-home" id="production-portal-container">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Production Planning</div>
          <div class="proj-home-sub">Production schedules and batch planning</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide-key="production" title="User Guide">❓ Guide</button>
          <button class="btn btn-ghost" data-action="prod-nav-hub">← Back to Portal</button>
        </div>
      </div>

      <div class="proj-cards hub-grid">
        <div class="proj-card hub-card" data-action="prod-hub-tab" data-tab="scheduling">
          <div class="hub-card-content">
            <div class="hub-icon">📅</div>
            <div class="proj-card-name">Schedule</div>
            <div class="proj-card-meta">Add Production Batches</div>
          </div>
        </div>

        <div class="proj-card hub-card" data-action="prod-hub-tab" data-tab="by-product">
          <div class="hub-card-content">
            <div class="hub-icon">📋</div>
            <div class="proj-card-name">Plan by Product</div>
            <div class="proj-card-meta">View by Product</div>
          </div>
        </div>

        <div class="proj-card hub-card" data-action="prod-hub-tab" data-tab="by-unit">
          <div class="hub-card-content">
            <div class="hub-icon">🏭</div>
            <div class="proj-card-name">Plan by Work Area</div>
            <div class="proj-card-meta">Units 2, 3 & 6</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupProductionPortalDelegation() {
  const container = document.getElementById('production-portal-container');
  if (!container || productionPortalDelegationContainer === container) return;

  productionPortalDelegationContainer = container;

  container.addEventListener('click', (event) => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl || !container.contains(actionEl)) return;

    const action = actionEl.dataset.action;
    if (action === 'prod-nav-tab' || action === 'prod-hub-tab') {
      const tab = actionEl.dataset.tab;
      if (tab) setProductionTab(tab);
      return;
    }

    if (action === 'prod-nav-root') {
      setProductionTab('root');
      return;
    }

    if (action === 'prod-nav-hub') {
      navigate('hub');
      return;
    }

    if (action === 'show-guide') {
      const key = actionEl.dataset.guideKey;
      if (key && typeof showGuide === 'function') showGuide(key);
    }
  });

  container.addEventListener('focusout', (evt) => {
    const nextFocus = evt.relatedTarget;
    if (nextFocus && nextFocus.closest('table')) return;
    if (!window.prodPendingRealTimeUpdate) return;
    setTimeout(function() {
      prodRefreshCurrentTab();
    }, 0);
  });
}
