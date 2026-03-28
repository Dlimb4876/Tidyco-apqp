// Capacity Management Portal Hub
// Entry point for capacity management module

let capacityPortalDelegationContainer = null;

function setCapacityTab(tab) {
  if (tab !== 'root' && typeof canViewPortalTab === 'function' && !canViewPortalTab('capacity', tab)) {
    return;
  }

  const prevTab = capacityTab;
  capacityTab = tab;
  const parts = ['s=capacity'];
  if (tab !== 'root') parts.push('ct=' + encodeURIComponent(tab));
  const hash = '#' + parts.join('&');
  if (typeof writeNavigationHistory === 'function') {
    writeNavigationHistory(hash, { push: prevTab !== tab });
  } else {
    history.replaceState(null, '', hash);
  }
  render();
  if (typeof updateBackButton === 'function') updateBackButton();
}

function capacityNavBar() {
  if (capacityTab === 'logistics' || capacityTab === 'unit6') {
    return '';
  }

  const tabs = [
    { key: 'production', icon: '🚂', label: 'Production' },
    { key: 'me', icon: '🧑‍🔧', label: 'ME' },
    { key: 'projects', icon: '📅', label: 'Projects' },
    { key: 'logistics', icon: '🚚', label: 'Logistics' },
    { key: 'unit6', icon: '🏭', label: 'Unit 6' }
  ].filter((tab) => typeof canViewPortalTab !== 'function' || canViewPortalTab('capacity', tab.key));

  const buttons = tabs
    .map((tab) => `<button class="prod-nav-item ${capacityTab === tab.key ? 'active' : ''}" data-cap-action="cap-set-tab" data-tab="${tab.key}">${tab.icon} ${tab.label}</button>`)
    .join('');

  return `
    <div class="prod-nav-bar">
      <button class="prod-nav-item prod-nav-back" data-cap-action="cap-set-tab" data-tab="root">← Back</button>
      ${buttons}
    </div>
  `;
}

function renderCapacityHubCard(tabKey, favouriteKey, icon, title, meta) {
  if (typeof canViewPortalTab === 'function' && !canViewPortalTab('capacity', tabKey)) return '';

  const isFav = typeof hubIsPageFavourite === 'function' && hubIsPageFavourite(favouriteKey);
  return `
    <div class="proj-card hub-card" data-cap-action="cap-set-tab" data-tab="${tabKey}">
      <button
        class="hub-fav-toggle${isFav ? ' is-active' : ''}"
        type="button"
        title="${isFav ? 'Remove from favourites' : 'Add to favourites'}"
        onclick="hubTogglePageFavourite('${favouriteKey}', event)">
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

function renderCapacity() {
  const nav = capacityNavBar();
  if (capacityTab === 'production') {
    setTimeout(setupCapacityPortalDelegation, 0);
    return `<div id="capacity-portal-container">${nav}${renderProdCapacity()}</div>`;
  }
  if (capacityTab === 'me') {
    setTimeout(setupCapacityPortalDelegation, 0);
    return `<div id="capacity-portal-container">${nav}${renderMeCapacity()}</div>`;
  }
  if (capacityTab === 'projects') {
    setTimeout(setupCapacityPortalDelegation, 0);
    return `<div id="capacity-portal-container">${nav}${pmRenderCapacity()}</div>`;
  }
  if (capacityTab === 'logistics') {
    setTimeout(setupCapacityPortalDelegation, 0);
    return `<div id="capacity-portal-container">${nav}${logRenderCapacity()}</div>`;
  }
  if (capacityTab === 'unit6') {
    setTimeout(setupCapacityPortalDelegation, 0);
    return `<div id="capacity-portal-container">${nav}${unit6RenderCapacity()}</div>`;
  }

  // Root hub view
  setTimeout(setupCapacityPortalDelegation, 0);
  const cards = [
    renderCapacityHubCard('production', 'capacity::production', '🚂', 'Production', 'Production load capacity plan'),
    renderCapacityHubCard('me', 'capacity::me', '🧑‍🔧', 'Manufacturing Engineering', 'Manufacturing Engineering load capacity plan'),
    renderCapacityHubCard('projects', 'capacity::projects', '📅', 'Project Management', 'Project Management load capacity plan'),
    renderCapacityHubCard('logistics', 'capacity::logistics', '🚚', 'Logistics', 'Logistics load capacity plan'),
    renderCapacityHubCard('unit6', 'capacity::unit6', '🏭', 'Unit 6', 'Unit 6 load capacity plan')
  ].filter(Boolean).join('');
  return `
    <div class="proj-home" id="capacity-portal-container">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Capacity Management</div>
          <div class="proj-home-sub">Select a capacity stream to view loading</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" data-action="show-guide" data-guide-key="capacity" title="User Guide">❓ Guide</button>
          <button class="btn btn-ghost" data-action="cap-nav-hub">← Back to Portal</button>
        </div>
      </div>

      <div class="proj-cards hub-grid">
        ${cards || `<div class="hub-favs-empty">No capacity streams are available for your current permissions.</div>`}
      </div>
    </div>
  `;
}

function setupCapacityPortalDelegation() {
  const container = document.getElementById('capacity-portal-container');
  if (!container || capacityPortalDelegationContainer === container) return;

  capacityPortalDelegationContainer = container;

  container.addEventListener('click', (event) => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl || !container.contains(actionEl)) return;

    const action = actionEl.dataset.action;
    if (action === 'cap-nav-root') {
      setCapacityTab('root');
      return;
    }

    if (action === 'cap-nav-hub') {
      navigate('hub');
      return;
    }

    if (action === 'show-guide') {
      const key = actionEl.dataset.guideKey;
      if (key && typeof showGuide === 'function') showGuide(key);
    }
  });
}

// ── Ensure capacity modals are injected ────────────────────────────
function ensureCapacityModals() {
  if (typeof injectCapacityModals === 'function') {
    injectCapacityModals()
  }
}

// Hook into renderCapacity to ensure modals are injected
const originalRenderCapacity = renderCapacity
renderCapacity = function() {
  ensureCapacityModals()
  return originalRenderCapacity()
}
