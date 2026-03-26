/* ============================================================
   unit6-capacity.js — Unit 6 Capacity Orchestrator
  Dedicated Unit 6 relational tables
   ============================================================ */

let unit6Tab = 'chart';
let unit6HolidayMonth = null;
let unit6ChartStart = null;
let unit6SaveTimer = null;
let unit6ChartDirty = true;

window.unit6CapSmartRender = function() {
  if (unit6Tab === 'chart') {
    unit6ChartDirty = true;
    return;
  }
  unit6RefreshCurrentTab();
};

function unit6GetCurrentMonthKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

function unit6GetData() {
  return {
    team: typeof unit6DataGetTeam === 'function' ? unit6DataGetTeam() : [],
    tasks: typeof unit6DataGetTasks === 'function' ? unit6DataGetTasks() : [],
    products: typeof unit6DataGetProducts === 'function' ? unit6DataGetProducts() : [],
    holidays: typeof unit6DataGetHolidays === 'function' ? unit6DataGetHolidays() : []
  };
}

function unit6GetTabContent() {
  const { team, tasks, products, holidays } = unit6GetData();

  if (!unit6HolidayMonth) unit6HolidayMonth = unit6GetCurrentMonthKey();
  if (!unit6ChartStart)   unit6ChartStart   = unit6GetCurrentMonthKey();

  switch (unit6Tab) {
    case 'team':
      return meRenderTeamTab(team);
    case 'tasks':
      return meRenderTasksTab(tasks, team, products);
    case 'products':
      return meRenderProductsTab(products, products, tasks);
    case 'product-taskload':
      return meRenderProductTaskLoadTab(tasks, products);
    case 'holidays':
      return meRenderHolidaysTab(holidays, team, unit6HolidayMonth);
    case 'chart':
    default:
      return meRenderChartTab(unit6ChartStart, team, tasks, products, holidays);
  }
}

function unit6RerenderChartTabForMonthChange() {
  const body = document.getElementById('unit6Body');
  if (!body) return;
  body.innerHTML = unit6GetTabContent();
  setTimeout(() => {
    if (typeof meChartStart !== 'undefined') window.meChartStart = unit6ChartStart || unit6GetCurrentMonthKey();
    if (typeof meDrawChartNow === 'function') meDrawChartNow();
    if (typeof meDrawHeatmapNow === 'function') meDrawHeatmapNow();
  }, 100);
}

window.unit6RenderCapacity = function() {
  window.meCurrentDepartmentContext = 'UNIT6';

  if (typeof unit6DataAutoSyncUnit6Products === 'function') {
    const synced = unit6DataAutoSyncUnit6Products();
    if (synced && window.unit6DataInitialized) {
      setTimeout(() => {
        if (typeof unit6DebouncedSave === 'function') unit6DebouncedSave();
      }, 1000);
    }
  }

  const html = `
    <div class="unit6-shell me-shell" data-cap-context="unit6">
      <div class="me-topbar">
        <div class="me-topbar-left">
          <button class="btn btn-ghost btn-sm" data-cap-action="cap-unit6-back">← Back</button>
          <div>
            <div class="me-topbar-title">Unit 6 Load Capacity</div>
            <div class="me-topbar-sub">Unit 6 · Man-hours planning</div>
          </div>
        </div>
      </div>

      <div class="me-nav">
        <button class="me-nav-btn ${unit6Tab === 'chart'           ? 'active' : ''}" data-tab="chart"          data-cap-action="cap-unit6-set-tab">📊 Capacity Chart</button>
        <button class="me-nav-btn ${unit6Tab === 'team'            ? 'active' : ''}" data-tab="team"           data-cap-action="cap-unit6-set-tab">👷 Team</button>
        <button class="me-nav-btn ${unit6Tab === 'tasks'           ? 'active' : ''}" data-tab="tasks"          data-cap-action="cap-unit6-set-tab">📋 Tasks</button>
        <button class="me-nav-btn ${unit6Tab === 'products'        ? 'active' : ''}" data-tab="products"       data-cap-action="cap-unit6-set-tab">🚂 Product Support</button>
        <button class="me-nav-btn ${unit6Tab === 'product-taskload' ? 'active' : ''}" data-tab="product-taskload" data-cap-action="cap-unit6-set-tab">📦 Product Load</button>
        <button class="me-nav-btn ${unit6Tab === 'holidays'        ? 'active' : ''}" data-tab="holidays"       data-cap-action="cap-unit6-set-tab">🏖️ Holiday Planner</button>
      </div>

      <div class="me-body" id="unit6Body">
        ${unit6GetTabContent()}
      </div>
    </div>`;

  unit6ChartDirty = false;
  setTimeout(() => {
    if (unit6Tab === 'chart') {
      if (typeof meDrawChartNow   === 'function') meDrawChartNow();
      if (typeof meDrawHeatmapNow === 'function') meDrawHeatmapNow();
    }
  }, 100);

  return html;
};

window.unit6SetTab = function(tab) {
  const prevUnit6Tab = unit6Tab;
  unit6Tab = tab;
  if (tab === 'chart') unit6ChartDirty = false;

  const u6Parts = ['s=capacity', 'ct=unit6'];
  if (tab !== 'chart') u6Parts.push('u6t=' + encodeURIComponent(tab));
  if (typeof writeNavigationHistory === 'function') {
    writeNavigationHistory('#' + u6Parts.join('&'), { push: prevUnit6Tab !== tab });
  }
  window.meCurrentDepartmentContext = 'UNIT6';

  document.querySelectorAll('.unit6-shell .me-nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`.unit6-shell .me-nav-btn[data-tab="${tab}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  const body = document.getElementById('unit6Body');
  if (body) {
    body.innerHTML = unit6GetTabContent();
    setTimeout(() => {
      if (tab === 'chart') {
        if (typeof meChartStart    !== 'undefined') window.meChartStart = unit6ChartStart || unit6GetCurrentMonthKey();
        if (typeof meDrawChartNow  === 'function')  meDrawChartNow();
        if (typeof meDrawHeatmapNow === 'function') meDrawHeatmapNow();
      }
    }, 100);
  }
};

window.unit6RefreshCurrentTab = function() {
  window.meCurrentDepartmentContext = 'UNIT6';

  // OPTIMIZATION: When on chart tab, only redraw the chart without replacing the HTML.
  // This prevents DOM thrashing that causes the chart to bounce during real-time updates.
  if (unit6Tab === 'chart') {
    const monthInput = document.getElementById('meChartMonthInput');
    if (monthInput && unit6ChartStart) {
      monthInput.value = unit6ChartStart;
    }
    if (typeof meChartStart    !== 'undefined') window.meChartStart = unit6ChartStart || unit6GetCurrentMonthKey();
    if (typeof meDrawChartNow  === 'function')  meDrawChartNow();
    if (typeof meDrawHeatmapNow === 'function') meDrawHeatmapNow();
    return;
  }

  const body = document.getElementById('unit6Body');
  if (body) {
    body.innerHTML = unit6GetTabContent();
    setTimeout(() => {
      if (unit6Tab === 'chart') {
        if (typeof meChartStart    !== 'undefined') window.meChartStart = unit6ChartStart || unit6GetCurrentMonthKey();
        if (typeof meDrawChartNow  === 'function')  meDrawChartNow();
        if (typeof meDrawHeatmapNow === 'function') meDrawHeatmapNow();
      }
    }, 100);
  }
};

window.unit6OnMonthChange = function(newMonth) {
  if (unit6Tab === 'chart') {
    unit6ChartStart = newMonth;
    unit6RerenderChartTabForMonthChange();
    return;
  } else {
    unit6HolidayMonth = newMonth;
  }
  unit6RefreshCurrentTab();
};

window.unit6OnNextMonth = function() {
  const isChart = unit6Tab === 'chart';
  const current = isChart ? (unit6ChartStart || unit6GetCurrentMonthKey()) : (unit6HolidayMonth || unit6GetCurrentMonthKey());
  const [year, month] = current.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + 1);
  const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  if (isChart) {
    unit6ChartStart = newMonth;
    unit6RerenderChartTabForMonthChange();
    return;
  } else {
    unit6HolidayMonth = newMonth;
  }
  unit6RefreshCurrentTab();
};

window.unit6OnPrevMonth = function() {
  const isChart = unit6Tab === 'chart';
  const current = isChart ? (unit6ChartStart || unit6GetCurrentMonthKey()) : (unit6HolidayMonth || unit6GetCurrentMonthKey());
  const [year, month] = current.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 1);
  const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  if (isChart) {
    unit6ChartStart = newMonth;
    unit6RerenderChartTabForMonthChange();
    return;
  } else {
    unit6HolidayMonth = newMonth;
  }
  unit6RefreshCurrentTab();
};

window.unit6OnSave = async function(showAlert = false) {
  if (typeof unit6DataSave === 'function') {
    await unit6DataSave(showAlert);
  }
};

window.unit6DebouncedSave = function() {
  clearTimeout(unit6SaveTimer);
  unit6SaveTimer = setTimeout(async () => {
    await unit6OnSave(false);
    if (unit6Tab === 'chart') {
      unit6ChartDirty = true;
      return;
    }
    if (typeof isEditingInlineCell === 'function' && isEditingInlineCell()) {
      window.unit6PendingRerender = true;
      return;
    }
    unit6RefreshCurrentTab();
  }, 900);
};

window.unit6Refresh = function() {
  const mc = document.getElementById('mainContent');
  if (!mc || currentSection !== 'capacity' || capacityTab !== 'unit6') return;
  window.meCurrentDepartmentContext = 'UNIT6';
  mc.innerHTML = `<div class="section-inner">${unit6RenderCapacity()}</div>`;
};
