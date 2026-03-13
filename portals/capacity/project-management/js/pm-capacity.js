/* ============================================================
   pm-capacity.js — Project Management Capacity Orchestrator
   ============================================================ */

let pmTab = 'overview';
let pmHolidayMonth = null;
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

  switch (pmTab) {
    case 'team':
      return meRenderTeamTab(team);
    case 'tasks':
      return meRenderTasksTab(tasks, team, products);
    case 'products':
      return meRenderProductsTab(products, products, tasks);
    case 'product-taskload':
      return meRenderProductTaskLoadTab(tasks, products);
    case 'holidays':
      return meRenderHolidaysTab(holidays, team, pmHolidayMonth);
    case 'overview':
    default:
      return meRenderDashboardTab(pmGetCurrentMonthKey(), team, tasks, products, holidays);
  }
}

function pmDrawOverviewWidgets() {
  if (pmTab !== 'overview') return;
  const { team, tasks, products, holidays } = pmGetData();
  if (typeof meDashboardDrawMiniChart === 'function') {
    meDashboardDrawMiniChart(team, tasks, products, holidays);
  }
  if (typeof meDashboardDrawMiniHeatmap === 'function') {
    meDashboardDrawMiniHeatmap(team, tasks, holidays);
  }
}

window.pmRenderCapacity = function() {
  window.meCurrentDepartmentContext = 'PM';

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
        <button class="me-nav-btn ${pmTab === 'overview' ? 'active' : ''}" data-tab="overview" onclick="pmSetTab('overview')">📊 Overview</button>
        <button class="me-nav-btn ${pmTab === 'team' ? 'active' : ''}" data-tab="team" onclick="pmSetTab('team')">👥 Team</button>
        <button class="me-nav-btn ${pmTab === 'tasks' ? 'active' : ''}" data-tab="tasks" onclick="pmSetTab('tasks')">📋 Tasks</button>
        <button class="me-nav-btn ${pmTab === 'products' ? 'active' : ''}" data-tab="products" onclick="pmSetTab('products')">📦 Products</button>
        <button class="me-nav-btn ${pmTab === 'product-taskload' ? 'active' : ''}" data-tab="product-taskload" onclick="pmSetTab('product-taskload')">📈 Product Load</button>
        <button class="me-nav-btn ${pmTab === 'holidays' ? 'active' : ''}" data-tab="holidays" onclick="pmSetTab('holidays')">🏖️ Holidays</button>
      </div>

      <div class="me-body" id="pmBody">
        ${pmGetTabContent()}
      </div>
    </div>`;

  setTimeout(() => {
    pmDrawOverviewWidgets();
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
      pmDrawOverviewWidgets();
    }, 100);
  }
};

window.pmRefreshCurrentTab = function() {
  window.meCurrentDepartmentContext = 'PM';
  const body = document.getElementById('pmBody');
  if (body) {
    body.innerHTML = pmGetTabContent();
    setTimeout(() => {
      pmDrawOverviewWidgets();
    }, 100);
  }
};

window.pmOnMonthChange = function(newMonth) {
  pmHolidayMonth = newMonth;
  pmRefreshCurrentTab();
};

window.pmOnNextMonth = function() {
  const current = pmHolidayMonth || pmGetCurrentMonthKey();
  const [year, month] = current.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + 1);
  pmHolidayMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  pmRefreshCurrentTab();
};

window.pmOnPrevMonth = function() {
  const current = pmHolidayMonth || pmGetCurrentMonthKey();
  const [year, month] = current.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 1);
  pmHolidayMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
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
