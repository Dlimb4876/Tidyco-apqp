import { productionTab, setProductionTab as setProdTab } from '../../../core/js/state.js';
import { navigate, render } from '../../../utils/js/navigation.js';
import { renderScheduling } from './scheduling.js';
import { renderPlanByProduct, renderPlanByUnit } from './planning.js';

// ── Production Planning Portal ──────────────────────────────
export function setProductionTab(tab) {
  setProdTab(tab);
  const parts = ['s=production'];
  if (tab !== 'root') parts.push('pt=' + encodeURIComponent(tab));
  history.replaceState(null, '', '#' + parts.join('&'));
  render();
}

export function prodNavBar() {
  return `
    <div class="prod-nav-bar">
      <button class="prod-nav-item ${productionTab === 'scheduling' ? 'active' : ''}" onclick="setProductionTab('scheduling')">📅 Schedule</button>
      <button class="prod-nav-item ${productionTab === 'by-product' ? 'active' : ''}" onclick="setProductionTab('by-product')">📋 Plan by Product</button>
      <button class="prod-nav-item ${productionTab === 'by-unit' ? 'active' : ''}" onclick="setProductionTab('by-unit')">🏭 Plan by Unit</button>
    </div>
  `;
}

export function renderProduction() {
  const nav = prodNavBar();
  // Products are now managed in Product Management — redirect if accessed
  if (productionTab === 'products') {
    setProductionTab('scheduling');
    return nav + renderScheduling();
  }
  if (productionTab === 'scheduling') return nav + renderScheduling();
  if (productionTab === 'by-product') return nav + renderPlanByProduct();
  if (productionTab === 'by-unit') return nav + renderPlanByUnit();

  // Root hub view
  return `
    <div class="proj-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Production Planning</div>
          <div class="proj-home-sub">Production schedules and batch planning</div>
        </div>
        <button class="btn btn-ghost" onclick="navigate('hub')">← Back to Portal</button>
      </div>

      <div class="proj-cards hub-grid">
        <div class="proj-card hub-card" onclick="setProductionTab('scheduling')">
          <div class="hub-card-content">
            <div class="hub-icon">📅</div>
            <div class="proj-card-name">Schedule</div>
            <div class="proj-card-meta">Add Production Batches</div>
          </div>
        </div>

        <div class="proj-card hub-card" onclick="setProductionTab('by-product')">
          <div class="hub-card-content">
            <div class="hub-icon">📋</div>
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
