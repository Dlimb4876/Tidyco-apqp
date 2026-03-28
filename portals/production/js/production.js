// Production Planning Portal Hub
// Entry point for production planning module

let productionPortalDelegationContainer = null;

function setProductionTab(tab) {
  if (tab !== 'root' && typeof canViewPortalTab === 'function' && !canViewPortalTab('production', tab)) {
    return;
  }

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
  if (typeof updateBackButton === 'function') updateBackButton();
}

function prodNavBar() {
  const tabs = [
    { key: 'scheduling', icon: '📅', label: 'Schedule' },
    { key: 'by-product', icon: '📋', label: 'Plan by Product' },
    { key: 'by-unit', icon: '🏭', label: 'Plan by Work Area' }
  ].filter((tab) => typeof canViewPortalTab !== 'function' || canViewPortalTab('production', tab.key));

  const buttons = tabs
    .map((tab) => `<button class="prod-nav-item ${productionTab === tab.key ? 'active' : ''}" data-action="prod-nav-tab" data-tab="${tab.key}">${tab.icon} ${tab.label}</button>`)
    .join('');

  return `
    <div class="prod-nav-bar">
      <button class="prod-nav-item prod-nav-back" data-action="prod-nav-root">← Back</button>
      ${buttons}
    </div>
  `;
}

function renderProductionHubCard(tabKey, favouriteKey, icon, title, meta) {
  if (typeof canViewPortalTab === 'function' && !canViewPortalTab('production', tabKey)) return '';

  const isFav = typeof hubIsPageFavourite === 'function' && hubIsPageFavourite(favouriteKey);
  return `
    <div class="proj-card hub-card" data-action="prod-hub-tab" data-tab="${tabKey}">
      <button
        class="hub-fav-toggle${isFav ? ' is-active' : ''}"
        type="button"
        title="${isFav ? 'Remove from favourites' : 'Add to favourites'}"
        data-action="prod-fav-toggle"
        data-section="${favouriteKey}">
        ${isFav ? '★' : '☆'}
      </button>
      <div class="hub-card-content">
        <div class="hub-icon">${icon}</div>
        <div class="proj-card-name">${title}</div>
        <div class="proj-card-meta">${meta}</div>
      </div>
    </div>
  `;
}

// Targeted tab-body refresh used by realtime callbacks — avoids full page render.
function prodRefreshTabBody() {
  const body = document.getElementById('prodTabBody');
  if (!body) return;

  // Preserve scroll position for scheduling table
  let scrollTop = 0;
  const tableWrap = body.querySelector('.scheduling-table-wrap');
  if (tableWrap) {
    scrollTop = tableWrap.scrollTop;
  }

  let content = '';
  if (productionTab === 'scheduling') content = renderScheduling();
  else if (productionTab === 'by-product') content = renderPlanByProduct();
  else if (productionTab === 'by-unit') content = renderPlanByUnit();

  if (content) {
    body.innerHTML = content;
    setTimeout(setupProductionPortalDelegation, 0);

    // Restore scroll position after render
    if (scrollTop > 0 && productionTab === 'scheduling') {
      setTimeout(() => {
        const newTableWrap = document.querySelector('#prodTabBody .scheduling-table-wrap');
        if (newTableWrap) {
          newTableWrap.scrollTop = scrollTop;
          // Update virtual scroll offset to match
          window.prodSchedulingScrollOffset = scrollTop;
        }
      }, 0);
    }
  }
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
  const cards = [
    renderProductionHubCard('scheduling', 'production::scheduling', '📅', 'Schedule', 'Add Production Batches'),
    renderProductionHubCard('by-product', 'production::by-product', '📋', 'Plan by Product', 'View by Product'),
    renderProductionHubCard('by-unit', 'production::by-unit', '🏭', 'Plan by Work Area', 'Units 2, 3 & 6')
  ].filter(Boolean).join('');
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
        ${cards || `<div class="hub-favs-empty">No production pages are available for your current permissions.</div>`}
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

    if (action === 'prod-fav-toggle') {
      event.preventDefault();
      event.stopPropagation();
      const section = actionEl.dataset.section;
      if (section && typeof hubTogglePageFavourite === 'function') {
        hubTogglePageFavourite(section, event);
      }
      return;
    }

    if (action === 'show-guide') {
      const key = actionEl.dataset.guideKey;
      if (key && typeof showGuide === 'function') showGuide(key);
    }
  });

  // Flush any deferred re-renders when user leaves an inline table cell
  container.addEventListener('focusout', function(evt) {
    const nextFocus = evt.relatedTarget;
    if (nextFocus && nextFocus.closest('table')) return;
    if (typeof flushDeferred === 'function') flushDeferred('prod');
  });
}

// ── Tab-level refresh (DOM body swap only — avoids full render() feedback loop) ──
function prodRefreshCurrentTab() {
  const body = document.getElementById('prodTabBody');
  if (!body) { render(); return; }
  let content = '';
  if (productionTab === 'scheduling') content = renderScheduling();
  else if (productionTab === 'by-product') content = renderPlanByProduct();
  else if (productionTab === 'by-unit') content = renderPlanByUnit();
  else return;
  body.innerHTML = content;
}
