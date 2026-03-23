/* ============================================================
   log-capacity.js — Logistics Capacity Orchestrator
   Shared me_* tables with department='LOG' filter
   ============================================================ */

let logTab = 'chart';
let logHolidayMonth = null;
let logChartStart = null;
let logSaveTimer = null;
let logChartDirty = true;

window.logCapSmartRender = function() {
  if (logTab === 'chart') {
    logChartDirty = true;
    return;
  }
  render();
};

function logFilterByDepartment(list, department, fallback) {
  if (typeof meFilterByDepartment === 'function') {
    return meFilterByDepartment(list, department, fallback);
  }
  return Array.isArray(list) ? list : [];
}

function logGetCurrentMonthKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

function logGetData() {
  const allTeam     = typeof meDataGetTeam     === 'function' ? meDataGetTeam()     : [];
  const allTasks    = typeof meDataGetTasks    === 'function' ? meDataGetTasks()    : [];
  const allProducts = typeof meDataGetProducts === 'function' ? meDataGetProducts() : [];
  const allHolidays = typeof meDataGetHolidays === 'function' ? meDataGetHolidays() : [];

  return {
    team:     logFilterByDepartment(allTeam,     'LOG', 'ME'),
    tasks:    logFilterByDepartment(allTasks,    'LOG', 'ME'),
    products: logFilterByDepartment(allProducts, 'LOG', 'ME'),
    holidays: logFilterByDepartment(allHolidays, 'LOG', 'ME')
  };
}

function logGetTabContent() {
  const { team, tasks, products, holidays } = logGetData();

  if (!logHolidayMonth) logHolidayMonth = logGetCurrentMonthKey();
  if (!logChartStart)   logChartStart   = logGetCurrentMonthKey();

  switch (logTab) {
    case 'team':
      return meRenderTeamTab(team);
    case 'tasks':
      return meRenderTasksTab(tasks, team, products);
    case 'products':
      return meRenderProductsTab(products, products, tasks);
    case 'product-taskload':
      return meRenderProductTaskLoadTab(tasks, products);
    case 'holidays':
      return meRenderHolidaysTab(holidays, team, logHolidayMonth);
    case 'chart':
    default:
      return meRenderChartTab(logChartStart, team, tasks, products, holidays);
  }
}

window.logRenderCapacity = function() {
  window.meCurrentDepartmentContext = 'LOG';

  const html = `
    <div class="log-shell me-shell" data-cap-context="log">
      <div class="me-topbar">
        <div class="me-topbar-left">
          <button class="btn btn-ghost btn-sm" data-cap-action="cap-log-back">← Back</button>
          <div>
            <div class="me-topbar-title">Logistics Load Capacity</div>
            <div class="me-topbar-sub">Logistics · Man-hours planning</div>
          </div>
        </div>
      </div>

      <div class="me-nav">
        <button class="me-nav-btn ${logTab === 'chart'          ? 'active' : ''}" data-tab="chart"          data-cap-action="cap-log-set-tab">📊 Capacity Chart</button>
        <button class="me-nav-btn ${logTab === 'team'           ? 'active' : ''}" data-tab="team"           data-cap-action="cap-log-set-tab">👷 Team</button>
        <button class="me-nav-btn ${logTab === 'tasks'          ? 'active' : ''}" data-tab="tasks"          data-cap-action="cap-log-set-tab">📋 Tasks</button>
        <button class="me-nav-btn ${logTab === 'products'       ? 'active' : ''}" data-tab="products"       data-cap-action="cap-log-set-tab">🚂 Product Support</button>
        <button class="me-nav-btn ${logTab === 'product-taskload' ? 'active' : ''}" data-tab="product-taskload" data-cap-action="cap-log-set-tab">📦 Product Load</button>
        <button class="me-nav-btn ${logTab === 'holidays'       ? 'active' : ''}" data-tab="holidays"       data-cap-action="cap-log-set-tab">🏖️ Holiday Planner</button>
      </div>

      <div class="me-body" id="logBody">
        ${logGetTabContent()}
      </div>
    </div>`;

  logChartDirty = false;
  setTimeout(() => {
    if (logTab === 'chart') {
      if (typeof meDrawChartNow  === 'function') meDrawChartNow();
      if (typeof meDrawHeatmapNow === 'function') meDrawHeatmapNow();
    }
  }, 100);

  return html;
};

window.logSetTab = function(tab) {
  const prevLogTab = logTab;
  logTab = tab;
  if (tab === 'chart') logChartDirty = false;

  const logParts = ['s=capacity', 'ct=logistics'];
  if (tab !== 'chart') logParts.push('lgt=' + encodeURIComponent(tab));
  if (typeof writeNavigationHistory === 'function') {
    writeNavigationHistory('#' + logParts.join('&'), { push: prevLogTab !== tab });
  }
  window.meCurrentDepartmentContext = 'LOG';

  document.querySelectorAll('.log-shell .me-nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`.log-shell .me-nav-btn[data-tab="${tab}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  const body = document.getElementById('logBody');
  if (body) {
    body.innerHTML = logGetTabContent();
    setTimeout(() => {
      if (tab === 'chart') {
        if (typeof meChartStart    !== 'undefined') window.meChartStart = logChartStart || logGetCurrentMonthKey();
        if (typeof meDrawChartNow  === 'function')  meDrawChartNow();
        if (typeof meDrawHeatmapNow === 'function') meDrawHeatmapNow();
      }
    }, 100);
  }
};

window.logRefreshCurrentTab = function() {
  window.meCurrentDepartmentContext = 'LOG';
  const body = document.getElementById('logBody');
  if (body) {
    body.innerHTML = logGetTabContent();
    setTimeout(() => {
      if (logTab === 'chart') {
        if (typeof meChartStart    !== 'undefined') window.meChartStart = logChartStart || logGetCurrentMonthKey();
        if (typeof meDrawChartNow  === 'function')  meDrawChartNow();
        if (typeof meDrawHeatmapNow === 'function') meDrawHeatmapNow();
      }
    }, 100);
  }
};

window.logOnMonthChange = function(newMonth) {
  if (logTab === 'chart') {
    logChartStart = newMonth;
  } else {
    logHolidayMonth = newMonth;
  }
  logRefreshCurrentTab();
};

window.logOnNextMonth = function() {
  const isChart = logTab === 'chart';
  const current = isChart ? (logChartStart || logGetCurrentMonthKey()) : (logHolidayMonth || logGetCurrentMonthKey());
  const [year, month] = current.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + 1);
  const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  if (isChart) { logChartStart = newMonth; } else { logHolidayMonth = newMonth; }
  logRefreshCurrentTab();
};

window.logOnPrevMonth = function() {
  const isChart = logTab === 'chart';
  const current = isChart ? (logChartStart || logGetCurrentMonthKey()) : (logHolidayMonth || logGetCurrentMonthKey());
  const [year, month] = current.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 1);
  const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  if (isChart) { logChartStart = newMonth; } else { logHolidayMonth = newMonth; }
  logRefreshCurrentTab();
};

window.logOnSave = async function(showAlert = false) {
  await meDataSave(showAlert);
};

window.logDebouncedSave = function() {
  clearTimeout(logSaveTimer);
  logSaveTimer = setTimeout(async () => {
    await logOnSave(false);
    if (logTab === 'chart') {
      logChartDirty = true;
      return;
    }
    if (typeof isEditingInlineCell === 'function' && isEditingInlineCell()) {
      window.logPendingRerender = true;
      return;
    }
    logRefreshCurrentTab();
  }, 900);
};

window.logRefresh = function() {
  const mc = document.getElementById('mainContent');
  if (!mc || currentSection !== 'capacity' || capacityTab !== 'logistics') return;
  window.meCurrentDepartmentContext = 'LOG';
  mc.innerHTML = `<div class="section-inner">${logRenderCapacity()}</div>`;
};
