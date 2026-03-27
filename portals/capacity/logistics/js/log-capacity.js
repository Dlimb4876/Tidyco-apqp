/* ============================================================
   log-capacity.js — Logistics Capacity Orchestrator
  Dedicated logistics relational tables
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
  logRefreshCurrentTab();
};

function logGetCurrentMonthKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

function logGetData() {
  return {
    team: typeof logDataGetTeam === 'function' ? logDataGetTeam() : [],
    tasks: typeof logDataGetTasks === 'function' ? logDataGetTasks() : [],
    products: typeof logDataGetProducts === 'function' ? logDataGetProducts() : [],
    holidays: typeof logDataGetHolidays === 'function' ? logDataGetHolidays() : []
  };
}

function logGetLegacyCapacityFunction(name) {
  return window['me' + name];
}

function logWithLegacyDepartment(callback) {
  const contextKey = 'me' + 'CurrentDepartmentContext';
  const previous = window[contextKey];
  window[contextKey] = 'LOG';
  try {
    return callback();
  } finally {
    window[contextKey] = previous;
  }
}

function logRenderWithSharedFallback(sharedRenderer, legacyName, args, legacyArgs) {
  if (typeof sharedRenderer === 'function') return sharedRenderer(...args);
  const legacyRenderer = logGetLegacyCapacityFunction(legacyName);
  return typeof legacyRenderer === 'function'
    ? logWithLegacyDepartment(function() { return legacyRenderer(...legacyArgs); })
    : '';
}

function logDrawChartViews() {
  const { team, tasks, products, holidays } = logGetData();

  if (typeof window.capDrawChartNow === 'function') {
    window.capDrawChartNow(team, tasks, products, holidays, logChartStart, 'LOG');
  } else {
    const legacyDrawChart = logGetLegacyCapacityFunction('DrawChartNow');
    if (typeof legacyDrawChart === 'function') {
      logWithLegacyDepartment(function() { legacyDrawChart(); });
    }
  }

  if (typeof window.capDrawHeatmapNow === 'function') {
    window.capDrawHeatmapNow(team, tasks, products, holidays, logChartStart, 'LOG');
  } else {
    const legacyDrawHeatmap = logGetLegacyCapacityFunction('DrawHeatmapNow');
    if (typeof legacyDrawHeatmap === 'function') {
      logWithLegacyDepartment(function() { legacyDrawHeatmap(); });
    }
  }
}

function logGetTabContent() {
  const { team, tasks, products, holidays } = logGetData();

  if (!logHolidayMonth) logHolidayMonth = logGetCurrentMonthKey();
  if (!logChartStart)   logChartStart   = logGetCurrentMonthKey();

  const taskFilters = window.capTasksFilters && window.capTasksFilters.LOG
    ? window.capTasksFilters.LOG
    : window['me' + 'TasksFilters'];
  const taskSort = window.capTasksSort && window.capTasksSort.LOG
    ? window.capTasksSort.LOG
    : window['me' + 'TasksSort'];
  const productsTableState = window.capProductsTableState && window.capProductsTableState.LOG
    ? window.capProductsTableState.LOG
    : undefined;
  const productLoadTableState = window.capProductLoadTableState && window.capProductLoadTableState.LOG
    ? window.capProductLoadTableState.LOG
    : undefined;
  const bankHolidays = typeof window.capGetBankHolidaysForYear === 'function'
    ? window.capGetBankHolidaysForYear(Number((logHolidayMonth || '').split('-')[0]) || new Date().getFullYear())
    : (typeof window.meGetBankHolidaysForYear === 'function'
      ? window.meGetBankHolidaysForYear(Number((logHolidayMonth || '').split('-')[0]) || new Date().getFullYear())
      : null);

  switch (logTab) {
    case 'team':
      return logRenderWithSharedFallback(window.capRenderTeamTab, 'RenderTeamTab', [team, holidays, logChartStart, 'LOG', canEdit()], [team]);
    case 'tasks':
      return logRenderWithSharedFallback(window.capRenderTasksTab, 'RenderTasksTab', [tasks, team, products, 'LOG', taskFilters, taskSort, canEdit()], [tasks, team, products]);
    case 'products':
      return logRenderWithSharedFallback(window.capRenderProductsTab, 'RenderProductsTab', [products, tasks, 'LOG', productsTableState], [products, products, tasks]);
    case 'product-taskload':
      return logRenderWithSharedFallback(window.capRenderProductTaskLoadTab, 'RenderProductTaskLoadTab', [tasks, products, 'LOG', productLoadTableState], [tasks, products]);
    case 'holidays':
      return logRenderWithSharedFallback(window.capRenderHolidaysTab, 'RenderHolidaysTab', [holidays, team, logHolidayMonth, 'LOG', bankHolidays, canEdit()], [holidays, team, logHolidayMonth]);
    case 'chart':
    default:
      return logRenderWithSharedFallback(window.capRenderChartTab, 'RenderChartTab', [logChartStart, team, tasks, products, holidays, 'LOG'], [logChartStart, team, tasks, products, holidays]);
  }
}

function logRerenderChartTabForMonthChange() {
  const body = document.getElementById('logBody');
  if (!body) return;
  body.innerHTML = logGetTabContent();
  setTimeout(() => {
    logDrawChartViews();
  }, 100);
}

window.logRenderCapacity = function() {
  if (typeof logDataAutoSyncLogProducts === 'function') {
    const synced = logDataAutoSyncLogProducts();
    if (synced && window.logDataInitialized) {
      setTimeout(() => {
        if (typeof logDebouncedSave === 'function') logDebouncedSave();
      }, 1000);
    }
  }

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
      logDrawChartViews();
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
        logDrawChartViews();
      }
    }, 100);
  }
};

window.logRefreshCurrentTab = function() {
  // OPTIMIZATION: When on chart tab, only redraw the chart without replacing the HTML.
  // This prevents DOM thrashing that causes the chart to bounce during real-time updates.
  if (logTab === 'chart') {
    const monthInput = document.getElementById('meChartMonthInput');
    if (monthInput && logChartStart) {
      monthInput.value = logChartStart;
    }
    logDrawChartViews();
    return;
  }

  const body = document.getElementById('logBody');
  if (body) {
    body.innerHTML = logGetTabContent();
    setTimeout(() => {
      if (logTab === 'chart') {
        logDrawChartViews();
      }
    }, 100);
  }
};

window.logOnMonthChange = function(newMonth) {
  if (logTab === 'chart') {
    logChartStart = newMonth;
    logRerenderChartTabForMonthChange();
    return;
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
  if (isChart) {
    logChartStart = newMonth;
    logRerenderChartTabForMonthChange();
    return;
  } else {
    logHolidayMonth = newMonth;
  }
  logRefreshCurrentTab();
};

window.logOnPrevMonth = function() {
  const isChart = logTab === 'chart';
  const current = isChart ? (logChartStart || logGetCurrentMonthKey()) : (logHolidayMonth || logGetCurrentMonthKey());
  const [year, month] = current.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 1);
  const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  if (isChart) {
    logChartStart = newMonth;
    logRerenderChartTabForMonthChange();
    return;
  } else {
    logHolidayMonth = newMonth;
  }
  logRefreshCurrentTab();
};

window.logOnSave = async function(showAlert = false) {
  if (typeof logDataSave === 'function') {
    await logDataSave(showAlert);
  }
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
  mc.innerHTML = `<div class="section-inner">${logRenderCapacity()}</div>`;
};
