/* ============================================================
   me-capacity.js — ME Load Capacity Orchestrator
   ============================================================ */

// ── Module state ───────────────────────────────────────────
let meTab = 'chart';
let meChartStart = null; // ISO month string (e.g., '2025-03')
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

  return `
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
        <button class="me-nav-btn ${meTab === 'chart' ? 'active' : ''}" onclick="meSetTab('chart')">📊 Capacity Chart</button>
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
};

// ── Tab management ─────────────────────────────────────────
window.meSetTab = function(tab) {
  meTab = tab;

  // Update nav button active states
  document.querySelectorAll('.me-nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`.me-nav-btn:nth-child(${
    tab === 'chart' ? 1 : tab === 'team' ? 2 : tab === 'tasks' ? 3 : tab === 'products' ? 4 : 5
  })`);
  if (activeBtn) activeBtn.classList.add('active');

  // Update body content
  const body = document.getElementById('meBody');
  if (body) {
    body.innerHTML = meGetTabContent();
    setTimeout(() => {
      if (tab === 'chart') meDrawChartNow();
    }, 100);
  }
};

function meGetTabContent() {
  const team = meDataGetTeam();
  const tasks = meDataGetTasks();
  const products = meDataGetProducts();
  const holidays = meDataGetHolidays();

  switch (meTab) {
    case 'team':
      return meRenderTeamTab(team);
    case 'tasks':
      return meRenderTasksTab(tasks, team);
    case 'products':
      return meRenderProductsTab(products);
    case 'holidays':
      return meRenderHolidaysTab(holidays, team);
    case 'chart':
    default:
      return meRenderChartTab(meChartStart, team, tasks, products, holidays);
  }
}

// ── Chart event handlers ───────────────────────────────────
window.meOnMonthChange = function(newMonth) {
  meChartStart = newMonth;
  localStorage.setItem('meChartStartMonth', newMonth);
  meSetTab('chart');
};

window.meOnNextMonth = function() {
  const [year, month] = meChartStart.split('-').map(Number);
  const date = new Date(year, month, 1);
  date.setMonth(date.getMonth() + 1);
  meChartStart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  localStorage.setItem('meChartStartMonth', meChartStart);
  meSetTab('chart');
};

window.meOnPrevMonth = function() {
  const [year, month] = meChartStart.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  meChartStart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  localStorage.setItem('meChartStartMonth', meChartStart);
  meSetTab('chart');
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
