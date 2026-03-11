/* ============================================================
   me-capacity.js — ME Load Capacity Orchestrator
   ============================================================ */

// ── Module state ───────────────────────────────────────────
let meTab = 'dashboard';
let meChartStart = null; // ISO month string (e.g., '2025-03')
let meHolidayMonth = null; // Holiday planner month (independent from chart)
let meChartInst = null;  // Chart.js instance
let meSaveTimer = null;  // Debounce timer

// ── Entry point ────────────────────────────────────────────
/**
 * Main render function for ME Capacity Portal
 */
window.renderMeCapacity = function() {
  if (!meChartStart) {
    // Load from localStorage, or default to January 2026
    meChartStart = localStorage.getItem('meChartStartMonth') || '2026-01';
  }

  const html = `
    <div class="me-shell">
      <div class="me-topbar">
        <div class="me-topbar-left">
          <button class="btn btn-ghost btn-sm" onclick="setCapacityTab('root')">← Back</button>
          <div>
            <div class="me-topbar-title">ME Load Capacity</div>
            <div class="me-topbar-sub">Manufacturing Engineering · Man-hours planning</div>
          </div>
        </div>
      </div>

      <div class="me-nav">
        <button class="me-nav-btn ${meTab === 'dashboard' ? 'active' : ''}" onclick="meSetTab('dashboard')">📈 Dashboard</button>
        <button class="me-nav-btn ${meTab === 'chart' ? 'active' : ''}" onclick="meSetTab('chart')">📊 Capacity Chart</button>
        <button class="me-nav-btn ${meTab === 'heatmap' ? 'active' : ''}" onclick="meSetTab('heatmap')">🔥 Heat Map</button>
        <button class="me-nav-btn ${meTab === 'team' ? 'active' : ''}" onclick="meSetTab('team')">👷 Team</button>
        <button class="me-nav-btn ${meTab === 'tasks' ? 'active' : ''}" onclick="meSetTab('tasks')">📋 Tasks</button>
        <button class="me-nav-btn ${meTab === 'products' ? 'active' : ''}" onclick="meSetTab('products')">🚂 Products</button>
        <button class="me-nav-btn ${meTab === 'holidays' ? 'active' : ''}" onclick="meSetTab('holidays')">🏖️ Holiday Planner</button>
      </div>

      <div class="me-body" id="meBody">
        ${meGetTabContent()}
      </div>
    </div>
  `;

  // Draw dashboard charts on initial render
  setTimeout(() => {
    if (meTab === 'dashboard') {
      const team = meDataGetTeam();
      const tasks = meDataGetTasks();
      const products = meDataGetProducts();
      const holidays = meDataGetHolidays();
      meDashboardDrawMiniChart(team, tasks, products, holidays);
      meDashboardDrawMiniHeatmap(team, tasks, holidays);
    }
  }, 100);

  return html;
};

// ── Tab management ─────────────────────────────────────────
window.meSetTab = function(tab) {
  meTab = tab;

  // Update nav button active states
  document.querySelectorAll('.me-nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`.me-nav-btn:nth-child(${
    tab === 'dashboard' ? 1 : tab === 'chart' ? 2 : tab === 'heatmap' ? 3 : tab === 'team' ? 4 : tab === 'tasks' ? 5 : tab === 'products' ? 6 : 7
  })`);
  if (activeBtn) activeBtn.classList.add('active');

  // Update body content
  const body = document.getElementById('meBody');
  if (body) {
    body.innerHTML = meGetTabContent();
    setTimeout(() => {
      if (tab === 'dashboard') {
        const team = meDataGetTeam();
        const tasks = meDataGetTasks();
        const products = meDataGetProducts();
        const holidays = meDataGetHolidays();
        meDashboardDrawMiniChart(team, tasks, products, holidays);
        meDashboardDrawMiniHeatmap(team, tasks, holidays);
      } else if (tab === 'chart') meDrawChartNow();
      else if (tab === 'heatmap') meDrawHeatmapNow();
    }, 100);
  }
};

// Refresh current tab without switching tabs
window.meRefreshCurrentTab = function() {
  const body = document.getElementById('meBody');
  if (body) {
    body.innerHTML = meGetTabContent();
    setTimeout(() => {
      if (meTab === 'dashboard') {
        const team = meDataGetTeam();
        const tasks = meDataGetTasks();
        const products = meDataGetProducts();
        const holidays = meDataGetHolidays();
        meDashboardDrawMiniChart(team, tasks, products, holidays);
        meDashboardDrawMiniHeatmap(team, tasks, holidays);
      } else if (meTab === 'chart') meDrawChartNow();
      else if (meTab === 'heatmap') meDrawHeatmapNow();
    }, 100);
  }
};

function meGetTabContent() {
  const team = meDataGetTeam();
  const tasks = meDataGetTasks();
  const products = meDataGetProducts();
  const holidays = meDataGetHolidays();

  // Initialize holiday month on first view
  if (!meHolidayMonth) {
    const today = new Date();
    meHolidayMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }

  // Get available products from product management database (non-closed only)
  const availableProducts = productsState?.products?.filter(p => p.status !== 'closed') || [];

  switch (meTab) {
    case 'dashboard':
      return meRenderDashboardTab(meChartStart, team, tasks, products, holidays);
    case 'team':
      return meRenderTeamTab(team);
    case 'tasks':
      return meRenderTasksTab(tasks, team, availableProducts);
    case 'products':
      return meRenderProductsTab(products, availableProducts);
    case 'holidays':
      return meRenderHolidaysTab(holidays, team, meHolidayMonth);
    case 'heatmap':
      return meRenderHeatmapTab(meChartStart, team, tasks, products, holidays);
    case 'chart':
    default:
      return meRenderChartTab(meChartStart, team, tasks, products, holidays);
  }
}

// ── Month navigation handlers ──────────────────────────────
window.meOnMonthChange = function(newMonth) {
  if (meTab === 'holidays') {
    meHolidayMonth = newMonth;
  } else {
    meChartStart = newMonth;
    localStorage.setItem('meChartStartMonth', newMonth);
  }
  meRefreshCurrentTab();
};

window.meOnNextMonth = function() {
  const currentMonth = meTab === 'holidays' ? meHolidayMonth : meChartStart;
  const [year, month] = currentMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + 1);
  const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  if (meTab === 'holidays') {
    meHolidayMonth = newMonth;
  } else {
    meChartStart = newMonth;
    localStorage.setItem('meChartStartMonth', newMonth);
  }
  meRefreshCurrentTab();
};

window.meOnPrevMonth = function() {
  const currentMonth = meTab === 'holidays' ? meHolidayMonth : meChartStart;
  const [year, month] = currentMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 1);
  const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  if (meTab === 'holidays') {
    meHolidayMonth = newMonth;
  } else {
    meChartStart = newMonth;
    localStorage.setItem('meChartStartMonth', newMonth);
  }
  meRefreshCurrentTab();
};

// ── Persistence ────────────────────────────────────────────
window.meOnSave = async function(showAlert) {
  await meDataSave(showAlert);
};

function meDebouncedSave() {
  clearTimeout(meSaveTimer);
  meSaveTimer = setTimeout(async () => {
    await meDataSave(false);
    // Re-render current tab to update KPIs and sums
    const body = document.getElementById('meBody');
    if (body) {
      body.innerHTML = meGetTabContent();
      if (meTab === 'chart') meDrawChartNow();
    }
  }, 900);
}

// ── Initialization ─────────────────────────────────────────
window.meInit = async function() {
  await meDataInit();
  if (!meChartStart) {
    // Load from localStorage, or default to January 2026
    meChartStart = localStorage.getItem('meChartStartMonth') || '2026-01';
  }
};

// ── Utility Functions ──────────────────────────────────────
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Auto-init
meInit().catch(err => console.error('ME init failed:', err));

// Prevent data loss on page close by flushing debounce timer
window.addEventListener('beforeunload', (event) => {
  clearTimeout(meSaveTimer);  // Cancel pending debounced save
  // Attempt immediate save (fallback for async failures)
  if (typeof meDataSave === 'function') {
    meDataSave(false);  // Don't show alert on unload
  }
});
