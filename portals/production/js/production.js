// Production Planning Portal Hub
// Entry point for production planning module

function setProductionTab(tab) {
  productionTab = tab;
  const parts = ['s=production'];
  if (tab !== 'root') parts.push('pt=' + encodeURIComponent(tab));
  history.replaceState(null, '', '#' + parts.join('&'));
  render();
}

function renderProduction() {
  if (productionTab === 'products') return renderProductMaster();
  if (productionTab === 'scheduling') return renderScheduling();
  if (productionTab === 'by-product') return renderPlanByProduct();
  if (productionTab === 'by-unit') return renderPlanByUnit();

  // Root hub view
  return `
    <div class="prod-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Production Planning</div>
          <div class="proj-home-sub">Manage product master list and production schedules</div>
        </div>
        <button class="btn btn-ghost" onclick="navigate('hub')">← Back to Portal</button>
      </div>

      <div class="prod-grid">
        <div class="proj-card prod-card" onclick="setProductionTab('products')">
          <div class="hub-card-content">
            <div class="hub-icon">📦</div>
            <div class="proj-card-name">Products</div>
            <div class="proj-card-meta">Product Master List</div>
          </div>
        </div>

        <div class="proj-card prod-card" onclick="setProductionTab('scheduling')">
          <div class="hub-card-content">
            <div class="hub-icon">📅</div>
            <div class="proj-card-name">Schedule</div>
            <div class="proj-card-meta">Add Production Batches</div>
          </div>
        </div>

        <div class="proj-card prod-card" onclick="setProductionTab('by-product')">
          <div class="hub-card-content">
            <div class="hub-icon">🎯</div>
            <div class="proj-card-name">Plan by Product</div>
            <div class="proj-card-meta">View by Product</div>
          </div>
        </div>

        <div class="proj-card prod-card" onclick="setProductionTab('by-unit')">
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
