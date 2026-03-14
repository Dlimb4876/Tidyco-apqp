/* ============================================================
   pm-capacity.js — Project Management Capacity Orchestrator
   ============================================================ */

let pmTab = 'chart';
let pmHolidayMonth = null;
let pmChartStart = null;
let pmSaveTimer = null;

function pmFilterByDepartment(list, department, fallback) {
  if (typeof meFilterByDepartment === 'function') {
    return meFilterByDepartment(list, department, fallback);
  }
  return Array.isArray(list) ? list : [];
}

function pmGetCurrentMonthKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

function pmGetData() {
  const allTeam = typeof meDataGetTeam === 'function' ? meDataGetTeam() : [];
  const allTasks = typeof meDataGetTasks === 'function' ? meDataGetTasks() : [];
  const allProducts = typeof meDataGetProducts === 'function' ? meDataGetProducts() : [];
  const allHolidays = typeof meDataGetHolidays === 'function' ? meDataGetHolidays() : [];

  const team = pmFilterByDepartment(allTeam, 'PM', 'ME');
  const tasks = pmFilterByDepartment(allTasks, 'PM', 'ME');
  const products = pmFilterByDepartment(allProducts, 'PM', 'ME');
  const holidays = pmFilterByDepartment(allHolidays, 'PM', 'ME');

  return { team, tasks, products, holidays };
}

function pmGetTabContent() {
  const { team, tasks, products, holidays } = pmGetData();

  if (!pmHolidayMonth) {
    pmHolidayMonth = pmGetCurrentMonthKey();
  }

  if (!pmChartStart) pmChartStart = pmGetCurrentMonthKey();

  switch (pmTab) {
    case 'team':
      return meRenderTeamTab(team);
    case 'tasks':
      return meRenderTasksTab(tasks, team, products, true); // isPM = true
    case 'products':
      return meRenderProductsTab(products, products, tasks);
    case 'product-taskload':
      return meRenderProductTaskLoadTab(tasks, products);
    case 'holidays':
      return meRenderHolidaysTab(holidays, team, pmHolidayMonth);
    case 'chart':
    default:
      return meRenderChartTab(pmChartStart, team, tasks, products, holidays);
  }
}

window.pmRenderCapacity = function() {
  window.meCurrentDepartmentContext = 'PM';

  // Auto-sync project products (Tender/NPI) from the Product Management database
  if (typeof meDataAutoSyncPMProducts === 'function') {
    const synced = meDataAutoSyncPMProducts();
    if (synced) {
      // Persist any newly-added products to Supabase (debounced)
      setTimeout(() => {
        if (typeof meDataSave === 'function') meDataSave(false);
      }, 1000);
    }
  }

  const html = `
    <div class="pm-shell me-shell">
      <div class="me-topbar">
        <div class="me-topbar-left">
          <button class="btn btn-ghost btn-sm" onclick="setCapacityTab('root')">← Back</button>
          <div>
            <div class="me-topbar-title">Project Management Capacity</div>
            <div class="me-topbar-sub">PM stream · shared table with department tag</div>
          </div>
        </div>
      </div>

      <div class="me-nav">
        <button class="me-nav-btn ${pmTab === 'chart' ? 'active' : ''}" data-tab="chart" onclick="pmSetTab('chart')">📊 Capacity Chart</button>
        <button class="me-nav-btn ${pmTab === 'team' ? 'active' : ''}" data-tab="team" onclick="pmSetTab('team')">👷 Team</button>
        <button class="me-nav-btn ${pmTab === 'tasks' ? 'active' : ''}" data-tab="tasks" onclick="pmSetTab('tasks')">📋 Tasks</button>
        <button class="me-nav-btn ${pmTab === 'products' ? 'active' : ''}" data-tab="products" onclick="pmSetTab('products')">🚂 Product Support</button>
        <button class="me-nav-btn ${pmTab === 'product-taskload' ? 'active' : ''}" data-tab="product-taskload" onclick="pmSetTab('product-taskload')">📦 Product Load</button>
        <button class="me-nav-btn ${pmTab === 'holidays' ? 'active' : ''}" data-tab="holidays" onclick="pmSetTab('holidays')">🏖️ Holiday Planner</button>
      </div>

      <div class="me-body" id="pmBody">
        ${pmGetTabContent()}
      </div>
    </div>`;

  setTimeout(() => {
    if (pmTab === 'chart') {
      meDrawChartNow();
      meDrawHeatmapNow();
    }
  }, 100);

  return html;
};

window.pmSetTab = function(tab) {
  pmTab = tab;
  window.meCurrentDepartmentContext = 'PM';

  document.querySelectorAll('.pm-shell .me-nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`.pm-shell .me-nav-btn[data-tab="${tab}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  const body = document.getElementById('pmBody');
  if (body) {
    body.innerHTML = pmGetTabContent();
    setTimeout(() => {
      if (tab === 'chart') {
        if (typeof meChartStart !== 'undefined') window.meChartStart = pmChartStart || pmGetCurrentMonthKey();
        if (typeof meDrawChartNow === 'function') meDrawChartNow();
        if (typeof meDrawHeatmapNow === 'function') meDrawHeatmapNow();
      }
    }, 100);
  }
};

window.pmRefreshCurrentTab = function() {
  window.meCurrentDepartmentContext = 'PM';
  const body = document.getElementById('pmBody');
  if (body) {
    body.innerHTML = pmGetTabContent();
    setTimeout(() => {
      if (pmTab === 'chart') {
        if (typeof meChartStart !== 'undefined') window.meChartStart = pmChartStart || pmGetCurrentMonthKey();
        if (typeof meDrawChartNow === 'function') meDrawChartNow();
        if (typeof meDrawHeatmapNow === 'function') meDrawHeatmapNow();
      }
    }, 100);
  }
};

window.pmOnMonthChange = function(newMonth) {
  if (pmTab === 'chart') {
    pmChartStart = newMonth;
  } else {
    pmHolidayMonth = newMonth;
  }
  pmRefreshCurrentTab();
};

window.pmOnNextMonth = function() {
  const isChart = pmTab === 'chart';
  const current = isChart ? (pmChartStart || pmGetCurrentMonthKey()) : (pmHolidayMonth || pmGetCurrentMonthKey());
  const [year, month] = current.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + 1);
  const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  if (isChart) { pmChartStart = newMonth; } else { pmHolidayMonth = newMonth; }
  pmRefreshCurrentTab();
};

window.pmOnPrevMonth = function() {
  const isChart = pmTab === 'chart';
  const current = isChart ? (pmChartStart || pmGetCurrentMonthKey()) : (pmHolidayMonth || pmGetCurrentMonthKey());
  const [year, month] = current.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 1);
  const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  if (isChart) { pmChartStart = newMonth; } else { pmHolidayMonth = newMonth; }
  pmRefreshCurrentTab();
};

window.pmOnSave = async function(showAlert = false) {
  await meDataSave(showAlert);
};

window.pmDebouncedSave = function() {
  clearTimeout(pmSaveTimer);
  pmSaveTimer = setTimeout(async () => {
    await pmOnSave(false);
    pmRefreshCurrentTab();
  }, 900);
};

window.pmRefresh = function() {
  const mc = document.getElementById('mainContent');
  if (!mc || currentSection !== 'capacity' || capacityTab !== 'projects') return;
  window.meCurrentDepartmentContext = 'PM';
  mc.innerHTML = `<div class="section-inner">${pmRenderCapacity()}</div>`;
};
