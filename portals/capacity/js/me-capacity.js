/* ============================================================
   me-capacity.js — ME Load Capacity Orchestrator
   ============================================================ */

// ── Module state ───────────────────────────────────────────
let meTab = 'chart';
let meChartStart = null; // ISO month string (e.g., '2025-03')
let meHolidayMonth = null; // Holiday planner month (independent from chart)
let meChartInst = null;  // Chart.js instance
let meSaveTimer = null;  // Debounce timer
window.mePendingRealTimeUpdate = false;  // Deferred real-time render waiting for blur
window.mePendingRerender = false;        // Deferred post-save KPI re-render waiting for blur

// ── Entry point ────────────────────────────────────────────
/**
 * Main render function for ME Capacity Portal
 */
window.renderMeCapacity = function() {
  window.meCurrentDepartmentContext = 'ME';

  // Auto-sync ME products from Product Management database (all statuses).
  if (typeof meDataAutoSyncProductionProducts === 'function') {
    const synced = meDataAutoSyncProductionProducts();
    if (synced) {
      setTimeout(() => {
        if (typeof meDataSave === 'function') meDataSave(false);
      }, 1000);
    }
  }

  if (!meChartStart) {
    // Load from localStorage, or default to January 2026
    meChartStart = localStorage.getItem('meChartStartMonth') || '2026-01';
  }

  const html = `
    <div class="me-shell" data-cap-context="me">
      <div class="me-topbar">
        <div class="me-topbar-left">
          <button class="btn btn-ghost btn-sm" data-cap-action="cap-me-back">← Back</button>
          <div>
            <div class="me-topbar-title">ME Load Capacity</div>
            <div class="me-topbar-sub">Manufacturing Engineering · Man-hours planning</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="showGuide('capacity-me')" title="User Guide">❓ Guide</button>
      </div>

      <div class="me-nav">
        <button class="me-nav-btn ${meTab === 'chart' ? 'active' : ''}" data-tab="chart" data-cap-action="cap-me-set-tab">📊 Capacity Chart</button>
        <button class="me-nav-btn ${meTab === 'team' ? 'active' : ''}" data-tab="team" data-cap-action="cap-me-set-tab">👷 Team</button>
        <button class="me-nav-btn ${meTab === 'tasks' ? 'active' : ''}" data-tab="tasks" data-cap-action="cap-me-set-tab">📋 Tasks</button>
        <button class="me-nav-btn ${meTab === 'products' ? 'active' : ''}" data-tab="products" data-cap-action="cap-me-set-tab">🚂 Product Support</button>
        <button class="me-nav-btn ${meTab === 'product-taskload' ? 'active' : ''}" data-tab="product-taskload" data-cap-action="cap-me-set-tab">📦 Product Load</button>
        <button class="me-nav-btn ${meTab === 'holidays' ? 'active' : ''}" data-tab="holidays" data-cap-action="cap-me-set-tab">🏖️ Holiday Planner</button>
      </div>

      <div class="me-body" id="meBody">
        ${meGetTabContent()}
      </div>
    </div>
  `;

  // Draw chart and embedded heat map on initial render
  setTimeout(() => {
    if (meTab === 'chart') {
      meDrawChartNow();
      meDrawHeatmapNow();
    }
  }, 100);

  return html;
};

// ── Tab management ─────────────────────────────────────────
window.meSetTab = function(tab) {
  if (typeof capacityTab !== 'undefined' && capacityTab === 'projects' && typeof pmSetTab === 'function') {
    pmSetTab(tab);
    return;
  }

  if (tab === 'dashboard' || tab === 'heatmap') tab = 'chart';
  meTab = tab;

  // Update nav button active states
  document.querySelectorAll('.me-nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`.me-nav-btn[data-tab="${tab}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Update body content
  const body = document.getElementById('meBody');
  if (body) {
    body.innerHTML = meGetTabContent();
    setTimeout(() => {
      if (tab === 'chart') {
        meDrawChartNow();
        meDrawHeatmapNow();
      }
    }, 100);
  }
};

// Refresh current tab without switching tabs
window.meRefreshCurrentTab = function() {
  if (typeof capacityTab !== 'undefined' && capacityTab === 'projects' && typeof pmRefreshCurrentTab === 'function') {
    pmRefreshCurrentTab();
    return;
  }

  const body = document.getElementById('meBody');
  if (body) {
    body.innerHTML = meGetTabContent();
    setTimeout(() => {
      if (meTab === 'chart') {
        meDrawChartNow();
        meDrawHeatmapNow();
      }
    }, 100);
  }
};

function meGetTabContent() {
  const team = typeof meFilterByDepartment === 'function'
    ? meFilterByDepartment(meDataGetTeam(), 'ME', 'ME')
    : meDataGetTeam();
  const tasks = typeof meFilterByDepartment === 'function'
    ? meFilterByDepartment(meDataGetTasks(), 'ME', 'ME')
    : meDataGetTasks();
  const products = typeof meFilterByDepartment === 'function'
    ? meFilterByDepartment(meDataGetProducts(), 'ME', 'ME')
    : meDataGetProducts();
  const holidays = typeof meFilterByDepartment === 'function'
    ? meFilterByDepartment(meDataGetHolidays(), 'ME', 'ME')
    : meDataGetHolidays();

  // Initialize holiday month on first view
  if (!meHolidayMonth) {
    const today = new Date();
    meHolidayMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }

  // Get available products from ME capacity database
  const availableProducts = products || [];

  switch (meTab) {
    case 'team':
      return meRenderTeamTab(team);
    case 'tasks':
      return meRenderTasksTab(tasks, team, availableProducts);
    case 'products':
      return meRenderProductsTab(products, availableProducts, tasks);
    case 'product-taskload':
      return meRenderProductTaskLoadTab(tasks, products);
    case 'holidays':
      return meRenderHolidaysTab(holidays, team, meHolidayMonth);
    case 'chart':
    default:
      return meRenderChartTab(meChartStart, team, tasks, products, holidays);
  }
}

// ── Month navigation handlers ──────────────────────────────
window.meOnMonthChange = function(newMonth) {
  if (typeof capacityTab !== 'undefined' && capacityTab === 'projects' && typeof pmOnMonthChange === 'function') {
    pmOnMonthChange(newMonth);
    return;
  }

  if (meTab === 'holidays') {
    meHolidayMonth = newMonth;
  } else {
    meChartStart = newMonth;
    localStorage.setItem('meChartStartMonth', newMonth);
  }
  meRefreshCurrentTab();
};

window.meOnNextMonth = function() {
  if (typeof capacityTab !== 'undefined' && capacityTab === 'projects' && typeof pmOnNextMonth === 'function') {
    pmOnNextMonth();
    return;
  }

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
  if (typeof capacityTab !== 'undefined' && capacityTab === 'projects' && typeof pmOnPrevMonth === 'function') {
    pmOnPrevMonth();
    return;
  }

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
  if (typeof capacityTab !== 'undefined' && capacityTab === 'projects' && typeof pmOnSave === 'function') {
    await pmOnSave(showAlert);
    return;
  }

  await meDataSave(showAlert);
};

function meDebouncedSave() {
  if (typeof capacityTab !== 'undefined' && capacityTab === 'projects' && typeof pmDebouncedSave === 'function') {
    pmDebouncedSave();
    return;
  }

  clearTimeout(meSaveTimer);
  meSaveTimer = setTimeout(async () => {
    await meDataSave(false);
    // Only re-render for KPI/sum updates if the user is not mid-edit.
    // If they are, defer the re-render until they blur out of the table.
    if (isEditingInlineCell()) {
      window.mePendingRerender = true;
      return;
    }
    // Re-render current tab to update KPIs and sums
    const body = document.getElementById('meBody');
    if (body) {
      body.innerHTML = meGetTabContent();
      if (meTab === 'chart') {
        meDrawChartNow();
        meDrawHeatmapNow();
      }
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
  if (meSaveTimer) {
    clearTimeout(meSaveTimer);
    // Flush pending save synchronously using XMLHttpRequest to ensure it completes
    flushMEDataNow();
  }
});

// Immediate synchronous save without debounce (for beforeunload)
window.flushMEDataNow = function() {
  if (!supa || !currentUser) return;

  // Quick synchronous save for team members only (most critical)
  if (meDataState.team && meDataState.team.length > 0) {
    meDataState.team.forEach((member, i) => {
      if (typeof meSaveTeamRelational === 'function') {
        // Don't await, just fire and forget for unload
        meSaveTeamRelational(currentUser.id, member).catch(err => {
          console.warn('Failed to flush team member', i, err.message);
        });
      }
    });
  }
};
