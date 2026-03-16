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

  // Root hub view
  setTimeout(setupCapacityPortalDelegation, 0);
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
          <div class="hub-card-content">
            <div class="hub-icon">🚂</div>
            <div class="proj-card-name">Production</div>
            <div class="proj-card-meta">Production load capacity plan</div>
          </div>
        </div>

        <div class="proj-card hub-card" data-action="cap-hub-tab" data-tab="me">
          <div class="hub-card-content">
            <div class="hub-icon">🧑‍🔧</div>
            <div class="proj-card-name">Manufacturing Engineering</div>
            <div class="proj-card-meta">Manufacturing Engineering load capacity plan</div>
          </div>
        </div>

        <div class="proj-card hub-card" data-action="cap-hub-tab" data-tab="projects">
          <div class="hub-card-content">
            <div class="hub-icon">📅</div>
            <div class="proj-card-name">Project Management</div>
            <div class="proj-card-meta">Project Management load capacity plan</div>
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
