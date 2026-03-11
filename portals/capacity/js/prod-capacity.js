// ═══════════════════════════════════════════════════════════════
// prod-capacity.js — Production Load Capacity Portal
// Entry point: nav bar + tab dispatcher
// Tabs: dashboard | by-work-area | settings | detail
// Depends on: prod-capacity-data.js, prod-capacity-dashboard.js,
//             prod-capacity-workarea.js, prod-capacity-settings.js,
//             prod-capacity-detail.js
// ═══════════════════════════════════════════════════════════════

// Tab state lives in state.js: let prodCapTab = 'dashboard'

function setProdCapTab(tab) {
  prodCapTab = tab;
  render();
}

function renderProdCapacity() {
  // Body content
  let body = '';
  if      (prodCapTab === 'dashboard')   body = renderProdCapDashboard();
  else if (prodCapTab === 'by-work-area') body = renderProdCapWorkArea();
  else if (prodCapTab === 'settings')    body = renderProdCapSettings();
  else if (prodCapTab === 'detail')      body = renderProdCapDetail();
  else                                   body = renderProdCapDashboard();

  const tabs = [
    { id: 'dashboard',    icon: '📈', label: 'Dashboard' },
    { id: 'by-work-area', icon: '🏭', label: 'By Work Area' },
    { id: 'settings',     icon: '⚙️', label: 'Capacity Settings' },
    { id: 'detail',       icon: '📋', label: 'Batch Detail' },
  ];

  const navBtns = tabs.map(t => `
    <button class="pc-nav-btn ${prodCapTab === t.id ? 'active' : ''}" onclick="setProdCapTab('${t.id}')">
      ${t.icon} ${t.label}
    </button>`).join('');

  const html = `
    <div class="pc-shell">
      <!-- Top bar -->
      <div class="pc-topbar">
        <div class="pc-topbar-left">
          <button class="btn btn-ghost btn-sm" onclick="setCapacityTab('root')">← Back</button>
          <div>
            <div class="pc-topbar-title">Production Load Capacity</div>
            <div class="pc-topbar-sub">Schedule-driven capacity plan · ${(prodState?.batches||[]).length} batches · ${(prodState?.products||[]).filter(p=>p.status==='active').length} active products</div>
          </div>
        </div>
        <div class="pc-topbar-actions">
          <button class="btn btn-ghost btn-sm" onclick="navigate('production');setProductionTab('scheduling')">↗ Open Schedule</button>
        </div>
      </div>

      <!-- Tab Nav -->
      <div class="pc-nav">${navBtns}</div>

      <!-- Body -->
      <div class="pc-body" id="pcBody">
        ${body}
      </div>
    </div>
  `;

  // Post-render chart drawing
  setTimeout(() => {
    if (prodCapTab === 'dashboard')    prodCapDrawDashChart();
    if (prodCapTab === 'by-work-area') prodCapDrawWorkAreaChart();
  }, 80);

  return html;
}
