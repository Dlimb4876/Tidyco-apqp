// Capacity Management Portal Hub
// Entry point for capacity management module

let capacityPortalDelegationContainer = null;

function setCapacityTab(tab) {
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
}

function capacityNavBar() {
  return `
    <div class="prod-nav-bar">
      <button class="prod-nav-item prod-nav-back" data-action="cap-nav-root">← Back</button>
      <button class="prod-nav-item ${capacityTab === 'production' ? 'active' : ''}" data-action="cap-nav-tab" data-tab="production">🚂 Production</button>
      <button class="prod-nav-item ${capacityTab === 'me' ? 'active' : ''}" data-action="cap-nav-tab" data-tab="me">🧑‍🔧 ME</button>
      <button class="prod-nav-item ${capacityTab === 'projects' ? 'active' : ''}" data-action="cap-nav-tab" data-tab="projects">📅 Projects</button>
      <button class="prod-nav-item ${capacityTab === 'logistics' ? 'active' : ''}" data-action="cap-nav-tab" data-tab="logistics">🚚 Logistics</button>
      <button class="prod-nav-item ${capacityTab === 'unit6' ? 'active' : ''}" data-action="cap-nav-tab" data-tab="unit6">🏭 Unit 6</button>
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
  const favProduction = typeof hubIsPageFavourite === 'function' && hubIsPageFavourite('capacity::production');
  const favMe = typeof hubIsPageFavourite === 'function' && hubIsPageFavourite('capacity::me');
  const favProjects = typeof hubIsPageFavourite === 'function' && hubIsPageFavourite('capacity::projects');
  const favLogistics = typeof hubIsPageFavourite === 'function' && hubIsPageFavourite('capacity::logistics');
  const favUnit6 = typeof hubIsPageFavourite === 'function' && hubIsPageFavourite('capacity::unit6');
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
        <div class="proj-card hub-card" data-action="cap-hub-tab" data-tab="production">
          <button
            class="hub-fav-toggle${favProduction ? ' is-active' : ''}"
            type="button"
            title="${favProduction ? 'Remove from favourites' : 'Add to favourites'}"
            onclick="hubTogglePageFavourite('capacity::production', event)">
            ${favProduction ? '★' : '☆'}
          </button>
          <div class="hub-card-content">
            <div class="hub-icon">🚂</div>
            <div class="proj-card-name">Production</div>
            <div class="proj-card-meta">Production load capacity plan</div>
          </div>
        </div>

        <div class="proj-card hub-card" data-action="cap-hub-tab" data-tab="me">
          <button
            class="hub-fav-toggle${favMe ? ' is-active' : ''}"
            type="button"
            title="${favMe ? 'Remove from favourites' : 'Add to favourites'}"
            onclick="hubTogglePageFavourite('capacity::me', event)">
            ${favMe ? '★' : '☆'}
          </button>
          <div class="hub-card-content">
            <div class="hub-icon">🧑‍🔧</div>
            <div class="proj-card-name">Manufacturing Engineering</div>
            <div class="proj-card-meta">Manufacturing Engineering load capacity plan</div>
          </div>
        </div>

        <div class="proj-card hub-card" data-action="cap-hub-tab" data-tab="projects">
          <button
            class="hub-fav-toggle${favProjects ? ' is-active' : ''}"
            type="button"
            title="${favProjects ? 'Remove from favourites' : 'Add to favourites'}"
            onclick="hubTogglePageFavourite('capacity::projects', event)">
            ${favProjects ? '★' : '☆'}
          </button>
          <div class="hub-card-content">
            <div class="hub-icon">📅</div>
            <div class="proj-card-name">Project Management</div>
            <div class="proj-card-meta">Project Management load capacity plan</div>
          </div>
        </div>

        <div class="proj-card hub-card" data-action="cap-hub-tab" data-tab="logistics">
          <button
            class="hub-fav-toggle${favLogistics ? ' is-active' : ''}"
            type="button"
            title="${favLogistics ? 'Remove from favourites' : 'Add to favourites'}"
            onclick="hubTogglePageFavourite('capacity::logistics', event)">
            ${favLogistics ? '★' : '☆'}
          </button>
          <div class="hub-card-content">
            <div class="hub-icon">🚚</div>
            <div class="proj-card-name">Logistics</div>
            <div class="proj-card-meta">Logistics load capacity plan</div>
          </div>
        </div>

        <div class="proj-card hub-card" data-action="cap-hub-tab" data-tab="unit6">
          <button
            class="hub-fav-toggle${favUnit6 ? ' is-active' : ''}"
            type="button"
            title="${favUnit6 ? 'Remove from favourites' : 'Add to favourites'}"
            onclick="hubTogglePageFavourite('capacity::unit6', event)">
            ${favUnit6 ? '★' : '☆'}
          </button>
          <div class="hub-card-content">
            <div class="hub-icon">🏭</div>
            <div class="proj-card-name">Unit 6</div>
            <div class="proj-card-meta">Unit 6 load capacity plan</div>
          </div>
        </div>
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
    if (action === 'cap-nav-tab' || action === 'cap-hub-tab') {
      const tab = actionEl.dataset.tab;
      if (tab) setCapacityTab(tab);
      return;
    }

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
