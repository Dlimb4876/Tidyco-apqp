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

function unit6GetLegacyCapacityFunction(name) {
  return window['me' + name];
}

function unit6WithLegacyDepartment(callback) {
  const contextKey = 'me' + 'CurrentDepartmentContext';
  const previous = window[contextKey];
  window[contextKey] = 'UNIT6';
  try {
    return callback();
  } finally {
    window[contextKey] = previous;
  }
}

function unit6RenderWithSharedFallback(sharedRenderer, legacyName, args, legacyArgs) {
  if (typeof sharedRenderer === 'function') return sharedRenderer(...args);
  const legacyRenderer = unit6GetLegacyCapacityFunction(legacyName);
  return typeof legacyRenderer === 'function'
    ? unit6WithLegacyDepartment(function() { return legacyRenderer(...legacyArgs); })
    : '';
}

function unit6DrawChartViews() {
  const { team, tasks, products, holidays } = unit6GetData();

  if (typeof window.capDrawChartNow === 'function') {
    window.capDrawChartNow(team, tasks, products, holidays, unit6ChartStart, 'UNIT6');
  } else {
    const legacyDrawChart = unit6GetLegacyCapacityFunction('DrawChartNow');
    if (typeof legacyDrawChart === 'function') {
      unit6WithLegacyDepartment(function() { legacyDrawChart(); });
    }
  }

  if (typeof window.capDrawHeatmapNow === 'function') {
    window.capDrawHeatmapNow(team, tasks, products, holidays, unit6ChartStart, 'UNIT6');
  } else {
    const legacyDrawHeatmap = unit6GetLegacyCapacityFunction('DrawHeatmapNow');
    if (typeof legacyDrawHeatmap === 'function') {
      unit6WithLegacyDepartment(function() { legacyDrawHeatmap(); });
    }
  }
}

function unit6GetTabContent() {
  const { team, tasks, products, holidays } = unit6GetData();

  if (!unit6HolidayMonth) unit6HolidayMonth = unit6GetCurrentMonthKey();
  if (!unit6ChartStart)   unit6ChartStart   = unit6GetCurrentMonthKey();

  const taskFilters = window.capTasksFilters && window.capTasksFilters.UNIT6
    ? window.capTasksFilters.UNIT6
    : window['me' + 'TasksFilters'];
  const taskSort = window.capTasksSort && window.capTasksSort.UNIT6
    ? window.capTasksSort.UNIT6
    : window['me' + 'TasksSort'];
  const productsTableState = window.capProductsTableState && window.capProductsTableState.UNIT6
    ? window.capProductsTableState.UNIT6
    : undefined;
  const productLoadTableState = window.capProductLoadTableState && window.capProductLoadTableState.UNIT6
    ? window.capProductLoadTableState.UNIT6
    : undefined;
  const bankHolidays = typeof window.capGetBankHolidaysForYear === 'function'
    ? window.capGetBankHolidaysForYear(Number((unit6HolidayMonth || '').split('-')[0]) || new Date().getFullYear())
    : (typeof window.meGetBankHolidaysForYear === 'function'
      ? window.meGetBankHolidaysForYear(Number((unit6HolidayMonth || '').split('-')[0]) || new Date().getFullYear())
      : null);

  switch (unit6Tab) {
    case 'team':
      return unit6RenderWithSharedFallback(window.capRenderTeamTab, 'RenderTeamTab', [team, holidays, unit6ChartStart, 'UNIT6', canEdit()], [team]);
    case 'tasks':
      return unit6RenderWithSharedFallback(window.capRenderTasksTab, 'RenderTasksTab', [tasks, team, products, 'UNIT6', taskFilters, taskSort, canEdit()], [tasks, team, products]);
    case 'products':
      return unit6RenderWithSharedFallback(window.capRenderProductsTab, 'RenderProductsTab', [products, tasks, 'UNIT6', productsTableState], [products, products, tasks]);
    case 'product-taskload':
      return unit6RenderWithSharedFallback(window.capRenderProductTaskLoadTab, 'RenderProductTaskLoadTab', [tasks, products, 'UNIT6', productLoadTableState], [tasks, products]);
    case 'holidays':
      return unit6RenderWithSharedFallback(window.capRenderHolidaysTab, 'RenderHolidaysTab', [holidays, team, unit6HolidayMonth, 'UNIT6', bankHolidays, canEdit()], [holidays, team, unit6HolidayMonth]);
    case 'chart':
    default:
      return unit6RenderWithSharedFallback(window.capRenderChartTab, 'RenderChartTab', [unit6ChartStart, team, tasks, products, holidays, 'UNIT6'], [unit6ChartStart, team, tasks, products, holidays]);
  }
}

function unit6RerenderChartTabForMonthChange() {
  const body = document.getElementById('unit6Body');
  if (!body) return;
  body.innerHTML = unit6GetTabContent();
  setTimeout(() => {
    unit6DrawChartViews();
  }, 100);
}

window.unit6RenderCapacity = function() {
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
      unit6DrawChartViews();
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
        unit6DrawChartViews();
      }
    }, 100);
  }
};

window.unit6RefreshCurrentTab = function() {
  // OPTIMIZATION: When on chart tab, only redraw the chart without replacing the HTML.
  // This prevents DOM thrashing that causes the chart to bounce during real-time updates.
  if (unit6Tab === 'chart') {
    const monthInput = document.getElementById('meChartMonthInput');
    if (monthInput && unit6ChartStart) {
      monthInput.value = unit6ChartStart;
    }
    unit6DrawChartViews();
    return;
  }

  const body = document.getElementById('unit6Body');
  if (body) {
    body.innerHTML = unit6GetTabContent();
    setTimeout(() => {
      if (unit6Tab === 'chart') {
        unit6DrawChartViews();
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
  mc.innerHTML = `<div class="section-inner">${unit6RenderCapacity()}</div>`;
};
