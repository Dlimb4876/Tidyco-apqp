// Production Planning Portal Hub
// Entry point for production planning module

function setProductionTab(tab) {
  productionTab = tab;
  const parts = ['s=production'];
  if (tab !== 'root') parts.push('pt=' + encodeURIComponent(tab));
  history.replaceState(null, '', '#' + parts.join('&'));
  render();
}

function prodNavBar() {
  return `
    <div class="prod-nav-bar">
      <button class="prod-nav-item ${productionTab === 'products' ? 'active' : ''}" onclick="setProductionTab('products')">📦 Products</button>
      <button class="prod-nav-item ${productionTab === 'scheduling' ? 'active' : ''}" onclick="setProductionTab('scheduling')">📅 Schedule</button>
      <button class="prod-nav-item ${productionTab === 'by-product' ? 'active' : ''}" onclick="setProductionTab('by-product')">📋 Plan by Product</button>
      <button class="prod-nav-item ${productionTab === 'by-unit' ? 'active' : ''}" onclick="setProductionTab('by-unit')">🏭 Plan by Unit</button>
    </div>
  `;
}

function renderProduction() {
  const nav = prodNavBar();
  if (productionTab === 'products') return nav + renderProductMaster();
  if (productionTab === 'scheduling') return nav + renderScheduling();
  if (productionTab === 'by-product') return nav + renderPlanByProduct();
  if (productionTab === 'by-unit') return nav + renderPlanByUnit();

  // Root hub view
  return `
    <div class="proj-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Production Planning</div>
          <div class="proj-home-sub">Product management and production schedules</div>
        </div>
        <button class="btn btn-ghost" onclick="navigate('hub')">← Back to Portal</button>
      </div>

      <div class="proj-cards hub-grid">
        <div class="proj-card hub-card" onclick="setProductionTab('products')">
          <div class="hub-card-content">
            <div class="hub-icon">🎯</div>
            <div class="proj-card-name">Products</div>
            <div class="proj-card-meta">Master List & Details</div>
          </div>
        </div>

        <div class="proj-card hub-card" onclick="setProductionTab('scheduling')">
          <div class="hub-card-content">
            <div class="hub-icon">📅</div>
            <div class="proj-card-name">Schedule</div>
            <div class="proj-card-meta">Add Production Batches</div>
          </div>
        </div>

        <div class="proj-card hub-card" onclick="setProductionTab('by-product')">
          <div class="hub-card-content">
            <div class="hub-icon">🎯</div>
            <div class="proj-card-name">Plan by Product</div>
            <div class="proj-card-meta">View by Product</div>
          </div>
        </div>

        <div class="proj-card hub-card" onclick="setProductionTab('by-unit')">
          <div class="hub-card-content">
            <div class="hub-icon">🏭</div>
            <div class="proj-card-name">Plan by Unit</div>
            <div class="proj-card-meta">View by Unit 2/3/6</div>
          </div>
        </div>
      </div>
    </div>
  `;
}
