/* ============================================================
   pm-capacity.js — Project Management Capacity Orchestrator
   ============================================================ */

let pmTab = 'chart';
let pmHolidayMonth = null;
let pmChartStart = null;
let pmSaveTimer = null;
let pmChartDirty = true; // Chart tab recalculates only when accessed

// ── Smart render: skips full re-render when on read-only chart tab ──
window.pmCapSmartRender = function() {
  if (pmTab === 'chart') {
    // Chart stays static while open; refresh applies next time chart is opened.
    pmChartDirty = true;
    return;
  }
  pmRefreshCurrentTab();
};

function pmGetCurrentMonthKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

function pmGetData() {
  return {
    team: typeof pmDataGetTeam === 'function' ? pmDataGetTeam() : [],
    tasks: typeof pmDataGetTasks === 'function' ? pmDataGetTasks() : [],
    products: typeof pmDataGetProducts === 'function' ? pmDataGetProducts() : [],
    holidays: typeof pmDataGetHolidays === 'function' ? pmDataGetHolidays() : []
  };
}

function pmGetLegacyCapacityFunction(name) {
  return window['me' + name];
}

function pmWithLegacyDepartment(callback) {
  const contextKey = 'me' + 'CurrentDepartmentContext';
  const previous = window[contextKey];
  window[contextKey] = 'PM';
  try {
    return callback();
  } finally {
    window[contextKey] = previous;
  }
}

function pmRenderWithSharedFallback(sharedRenderer, legacyName, args, legacyArgs) {
  if (typeof sharedRenderer === 'function') return sharedRenderer(...args);
  const legacyRenderer = pmGetLegacyCapacityFunction(legacyName);
  return typeof legacyRenderer === 'function'
    ? pmWithLegacyDepartment(function() { return legacyRenderer(...legacyArgs); })
    : '';
}

function pmDrawChartViews() {
  const { team, tasks, products, holidays } = pmGetData();

  if (typeof window.capDrawChartNow === 'function') {
    window.capDrawChartNow(team, tasks, products, holidays, pmChartStart, 'PM');
  } else {
    const legacyDrawChart = pmGetLegacyCapacityFunction('DrawChartNow');
    if (typeof legacyDrawChart === 'function') {
      pmWithLegacyDepartment(function() { legacyDrawChart(); });
    }
  }

  if (typeof window.capDrawHeatmapNow === 'function') {
    window.capDrawHeatmapNow(team, tasks, products, holidays, pmChartStart, 'PM');
  } else {
    const legacyDrawHeatmap = pmGetLegacyCapacityFunction('DrawHeatmapNow');
    if (typeof legacyDrawHeatmap === 'function') {
      pmWithLegacyDepartment(function() { legacyDrawHeatmap(); });
    }
  }
}

function pmGetTabContent() {
  const { team, tasks, products, holidays } = pmGetData();

  if (!pmHolidayMonth) {
    pmHolidayMonth = pmGetCurrentMonthKey();
  }

  if (!pmChartStart) pmChartStart = pmGetCurrentMonthKey();

  const taskFilters = window.capTasksFilters && window.capTasksFilters.PM
    ? window.capTasksFilters.PM
    : window['pm' + 'TasksFilters'];
  const taskSort = window.capTasksSort && window.capTasksSort.PM
    ? window.capTasksSort.PM
    : window['pm' + 'TasksSort'];
  const productsTableState = window.capProductsTableState && window.capProductsTableState.PM
    ? window.capProductsTableState.PM
    : undefined;
  const productLoadTableState = window.capProductLoadTableState && window.capProductLoadTableState.PM
    ? window.capProductLoadTableState.PM
    : undefined;
  const bankHolidays = typeof window.capGetBankHolidaysForYear === 'function'
    ? window.capGetBankHolidaysForYear(Number((pmHolidayMonth || '').split('-')[0]) || new Date().getFullYear())
    : (typeof window.meGetBankHolidaysForYear === 'function'
      ? window.meGetBankHolidaysForYear(Number((pmHolidayMonth || '').split('-')[0]) || new Date().getFullYear())
      : null);

  switch (pmTab) {
    case 'team':
      return pmRenderWithSharedFallback(window.capRenderTeamTab, 'RenderTeamTab', [team, holidays, pmChartStart, 'PM', canEdit()], [team]);
    case 'tasks':
      return pmRenderWithSharedFallback(window.capRenderTasksTab, 'RenderTasksTab', [tasks, team, products, 'PM', taskFilters, taskSort, canEdit()], [tasks, team, products, true]);
    case 'products':
      return pmRenderWithSharedFallback(window.capRenderProductsTab, 'RenderProductsTab', [products, tasks, 'PM', productsTableState], [products, products, tasks]);
    case 'product-taskload':
      return pmRenderWithSharedFallback(window.capRenderProductTaskLoadTab, 'RenderProductTaskLoadTab', [tasks, products, 'PM', productLoadTableState], [tasks, products]);
    case 'holidays':
      return pmRenderWithSharedFallback(window.capRenderHolidaysTab, 'RenderHolidaysTab', [holidays, team, pmHolidayMonth, 'PM', bankHolidays, canEdit()], [holidays, team, pmHolidayMonth]);
    case 'chart':
    default:
      return pmRenderWithSharedFallback(window.capRenderChartTab, 'RenderChartTab', [pmChartStart, team, tasks, products, holidays, 'PM'], [pmChartStart, team, tasks, products, holidays]);
  }
}

function pmRerenderChartTabForMonthChange() {
  const body = document.getElementById('pmBody');
  if (!body) return;
  body.innerHTML = pmGetTabContent();
  setTimeout(() => {
    pmDrawChartViews();
  }, 100);
}

window.pmRenderCapacity = function() {
  // Auto-sync PM products from the Product Management database (all statuses)
  if (typeof pmDataAutoSyncPMProducts === 'function') {
    const synced = pmDataAutoSyncPMProducts();
    if (synced) {
      // Persist any newly-added products to Supabase (debounced)
      setTimeout(() => {
        if (typeof pmDebouncedSave === 'function') pmDebouncedSave();
      }, 1000);
    }
  }

  const html = `
    <div class="pm-shell me-shell" data-cap-context="pm">
      <div class="me-topbar">
        <div class="me-topbar-left">
          <button class="btn btn-ghost btn-sm" data-cap-action="cap-pm-back">← Back</button>
          <div>
            <div class="me-topbar-title">Project Management Capacity</div>
            <div class="me-topbar-sub">PM stream · dedicated relational tables</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="showGuide('capacity-pm')" title="User Guide">❓ Guide</button>
      </div>

      <div class="me-nav">
        <button class="me-nav-btn ${pmTab === 'chart' ? 'active' : ''}" data-tab="chart" data-cap-action="cap-pm-set-tab">📊 Capacity Chart</button>
        <button class="me-nav-btn ${pmTab === 'team' ? 'active' : ''}" data-tab="team" data-cap-action="cap-pm-set-tab">👷 Team</button>
        <button class="me-nav-btn ${pmTab === 'tasks' ? 'active' : ''}" data-tab="tasks" data-cap-action="cap-pm-set-tab">📋 Tasks</button>
        <button class="me-nav-btn ${pmTab === 'products' ? 'active' : ''}" data-tab="products" data-cap-action="cap-pm-set-tab">🚂 Product Support</button>
        <button class="me-nav-btn ${pmTab === 'product-taskload' ? 'active' : ''}" data-tab="product-taskload" data-cap-action="cap-pm-set-tab">📦 Product Load</button>
        <button class="me-nav-btn ${pmTab === 'holidays' ? 'active' : ''}" data-tab="holidays" data-cap-action="cap-pm-set-tab">🏖️ Holiday Planner</button>
      </div>

      <div class="me-body" id="pmBody">
        ${pmGetTabContent()}
      </div>
    </div>`;

  pmChartDirty = false;
  setTimeout(() => {
    if (pmTab === 'chart') {
      pmDrawChartViews();
    }
  }, 100);

  return html;
};

window.pmSetTab = function(tab) {
  const prevPmTab = pmTab;
  pmTab = tab;
  if (tab === 'chart') pmChartDirty = false;

  // Update URL so refresh restores this tab
  const pmParts = ['s=capacity', 'ct=projects'];
  if (tab !== 'chart') pmParts.push('pmt=' + encodeURIComponent(tab));
  if (typeof writeNavigationHistory === 'function') {
    writeNavigationHistory('#' + pmParts.join('&'), { push: prevPmTab !== tab });
  }

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
        pmDrawChartViews();
      }
    }, 100);
  }
};

window.pmRefreshCurrentTab = function() {
  // OPTIMIZATION: When on chart tab, only redraw the chart without replacing the HTML.
  // This prevents DOM thrashing that causes the chart to bounce during real-time updates.
  if (pmTab === 'chart') {
    const monthInput = document.getElementById('meChartMonthInput');
    if (monthInput && pmChartStart) {
      monthInput.value = pmChartStart;
    }
    pmDrawChartViews();
    return;
  }

  const body = document.getElementById('pmBody');
  if (body) {
    body.innerHTML = pmGetTabContent();
    setTimeout(() => {
      if (pmTab === 'chart') {
        pmDrawChartViews();
      }
    }, 100);
  }
};

window.pmOnMonthChange = function(newMonth) {
  if (pmTab === 'chart') {
    pmChartStart = newMonth;
    pmRerenderChartTabForMonthChange();
    return;
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
  if (isChart) {
    pmChartStart = newMonth;
    pmRerenderChartTabForMonthChange();
    return;
  } else {
    pmHolidayMonth = newMonth;
  }
  pmRefreshCurrentTab();
};

window.pmOnPrevMonth = function() {
  const isChart = pmTab === 'chart';
  const current = isChart ? (pmChartStart || pmGetCurrentMonthKey()) : (pmHolidayMonth || pmGetCurrentMonthKey());
  const [year, month] = current.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 1);
  const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  if (isChart) {
    pmChartStart = newMonth;
    pmRerenderChartTabForMonthChange();
    return;
  } else {
    pmHolidayMonth = newMonth;
  }
  pmRefreshCurrentTab();
};

window.pmOnSave = async function(showAlert = false) {
  if (typeof pmDataSave === 'function') {
    await pmDataSave(showAlert);
  }
};

window.pmDebouncedSave = function() {
  clearTimeout(pmSaveTimer);
  pmSaveTimer = setTimeout(async () => {
    await pmOnSave(false);
    // Chart tab is read-only — mark dirty and skip re-render
    if (pmTab === 'chart') {
      pmChartDirty = true;
      return;
    }
    // Defer tab refresh if user is still editing an inline cell
    if (typeof isEditingInlineCell === 'function' && isEditingInlineCell()) {
      window.pmPendingRerender = true;
      return;
    }
    pmRefreshCurrentTab();
  }, 900);
};

window.pmRefresh = function() {
  const mc = document.getElementById('mainContent');
  if (!mc || currentSection !== 'capacity' || capacityTab !== 'projects') return;
  mc.innerHTML = `<div class="section-inner">${pmRenderCapacity()}</div>`;
};
