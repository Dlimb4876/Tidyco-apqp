/* ============================================================
   me-capacity.js — ME Load Capacity Orchestrator
   ============================================================ */

// ── Module state ───────────────────────────────────────────
let meTab = 'chart';
let meChartStart = null; // ISO month string (e.g., '2025-03')
let meHolidayMonth = null; // Holiday planner month (independent from chart)
let meChartInst = null;  // Chart.js instance
let meSaveTimer = null;  // Debounce timer
let meChartDirty = true; // Chart tab recalculates only when accessed
window.mePendingRealTimeUpdate = false;  // Deferred real-time render waiting for blur
window.mePendingRerender = false;        // Deferred post-save KPI re-render waiting for blur

function meCanEditCapacity() {
  return typeof canEdit === 'function' ? canEdit() : true;
}

function meGetCapacityData() {
  return {
    team: meDataGetTeam(),
    tasks: meDataGetTasks(),
    products: meDataGetProducts(),
    holidays: meDataGetHolidays()
  };
}

function meGetLegacyCapacityFunction(name) {
  return window['me' + name];
}

function meRenderTabWithFallback(sharedRenderer, legacyName, args, legacyArgs) {
  if (typeof sharedRenderer === 'function') return sharedRenderer(...args);
  const legacyRenderer = meGetLegacyCapacityFunction(legacyName);
  return typeof legacyRenderer === 'function' ? legacyRenderer(...legacyArgs) : '';
}

function meDrawChartViews() {
  const { team, tasks, products, holidays } = meGetCapacityData();

  if (typeof window.capDrawChartNow === 'function') {
    window.capDrawChartNow(team, tasks, products, holidays, meChartStart, 'ME');
  } else {
    const legacyDrawChart = meGetLegacyCapacityFunction('DrawChartNow');
    if (typeof legacyDrawChart === 'function') legacyDrawChart();
  }

  if (typeof window.capDrawHeatmapNow === 'function') {
    window.capDrawHeatmapNow(team, tasks, products, holidays, meChartStart, 'ME');
  } else {
    const legacyDrawHeatmap = meGetLegacyCapacityFunction('DrawHeatmapNow');
    if (typeof legacyDrawHeatmap === 'function') legacyDrawHeatmap();
  }
}

// ── Smart render: skips full re-render when on read-only chart tab ──
window.meCapSmartRender = function() {
  if (meTab === 'chart') {
    // Chart stays static while open; refresh applies next time chart is opened.
    meChartDirty = true;
    return;
  }
  meRefreshCurrentTab();
};

// ── Entry point ────────────────────────────────────────────
/**
 * Main render function for ME Capacity Portal
 */
window.renderMeCapacity = function() {
  // Auto-sync ME products from Product Management database (all statuses).
  // Guard: only save if meDataInit has completed so holidays are loaded.
  // Saving before init completes would delete all holidays from the DB.
  if (typeof meDataAutoSyncProductionProducts === 'function') {
    const synced = meDataAutoSyncProductionProducts();
    if (synced && window.meDataInitialized) {
      setTimeout(() => {
        if (typeof meDebouncedSave === 'function') meDebouncedSave();
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
  meChartDirty = false;
  setTimeout(() => {
    if (meTab === 'chart') {
      meDrawChartViews();
    }
  }, 100);

  return html;
};

// ── Tab management ─────────────────────────────────────────
window.meSetTab = function(tab) {
  if (tab === 'dashboard' || tab === 'heatmap') tab = 'chart';
  const prevMeTab = meTab;
  meTab = tab;
  if (tab === 'chart') meChartDirty = false;

  // Update URL so refresh restores this tab
  const meParts = ['s=capacity', 'ct=me'];
  if (tab !== 'chart') meParts.push('met=' + encodeURIComponent(tab));
  if (typeof writeNavigationHistory === 'function') {
    writeNavigationHistory('#' + meParts.join('&'), { push: prevMeTab !== tab });
  }

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
        meDrawChartViews();
      }
    }, 100);
  }
};

// Refresh current tab without switching tabs
window.meRefreshCurrentTab = function() {
  // OPTIMIZATION: When on chart tab, only redraw the chart without replacing the HTML.
  // This prevents DOM thrashing that causes the chart to bounce during real-time updates.
  if (meTab === 'chart') {
    const monthInput = document.getElementById('meChartMonthInput');
    if (monthInput && meChartStart) {
      monthInput.value = meChartStart;
    }
    meDrawChartViews();
    return;
  }

  const body = document.getElementById('meBody');
  if (body) {
    body.innerHTML = meGetTabContent();
    setTimeout(() => {
      if (meTab === 'chart') {
        meDrawChartViews();
      }
    }, 100);
  }
};

function meGetTabContent() {
  const { team, tasks, products, holidays } = meGetCapacityData();

  // Initialize holiday month on first view
  if (!meHolidayMonth) {
    const today = new Date();
    meHolidayMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }

  // Get available products from ME capacity database
  const availableProducts = products || [];
  const taskFilters = window.capTasksFilters && window.capTasksFilters.ME ? window.capTasksFilters.ME : undefined;
  const taskSort = window.capTasksSort && window.capTasksSort.ME ? window.capTasksSort.ME : undefined;
  const productsTableState = window.capProductsTableState && window.capProductsTableState.ME
    ? window.capProductsTableState.ME
    : undefined;
  const productLoadTableState = window.capProductLoadTableState && window.capProductLoadTableState.ME
    ? window.capProductLoadTableState.ME
    : undefined;
  const bankHolidays = typeof meGetBankHolidaysForYear === 'function'
    ? meGetBankHolidaysForYear(Number((meHolidayMonth || '').split('-')[0]) || new Date().getFullYear())
    : null;

  switch (meTab) {
    case 'team':
      return meRenderTabWithFallback(window.capRenderTeamTab, 'RenderTeamTab', [team, holidays, meChartStart, 'ME', meCanEditCapacity()], [team]);
    case 'tasks':
      return meRenderTabWithFallback(window.capRenderTasksTab, 'RenderTasksTab', [tasks, team, availableProducts, 'ME', taskFilters, taskSort, meCanEditCapacity()], [tasks, team, availableProducts]);
    case 'products':
      return meRenderTabWithFallback(window.capRenderProductsTab, 'RenderProductsTab', [products, tasks, 'ME', productsTableState], [products, availableProducts, tasks]);
    case 'product-taskload':
      return meRenderTabWithFallback(window.capRenderProductTaskLoadTab, 'RenderProductTaskLoadTab', [tasks, products, 'ME', productLoadTableState], [tasks, products]);
    case 'holidays':
      return meRenderTabWithFallback(window.capRenderHolidaysTab, 'RenderHolidaysTab', [holidays, team, meHolidayMonth, 'ME', bankHolidays, meCanEditCapacity()], [holidays, team, meHolidayMonth]);
    case 'chart':
    default:
      return meRenderTabWithFallback(window.capRenderChartTab, 'RenderChartTab', [meChartStart, team, tasks, products, holidays, 'ME'], [meChartStart, team, tasks, products, holidays]);
  }
}

function meRerenderChartTabForMonthChange() {
  const body = document.getElementById('meBody');
  if (!body) return;
  body.innerHTML = meGetTabContent();
  setTimeout(() => {
    meDrawChartViews();
  }, 100);
}

// ── Month navigation handlers ──────────────────────────────
window.meOnMonthChange = function(newMonth) {
  if (meTab === 'holidays') {
    meHolidayMonth = newMonth;
  } else {
    meChartStart = newMonth;
    localStorage.setItem('meChartStartMonth', newMonth);
    meRerenderChartTabForMonthChange();
    return;
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
    meRerenderChartTabForMonthChange();
    return;
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
    meRerenderChartTabForMonthChange();
    return;
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
    // Chart tab is read-only — mark dirty and skip re-render
    if (meTab === 'chart') {
      meChartDirty = true;
      return;
    }
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
    }
  }, 500);
}

// ── Initialization ─────────────────────────────────────────
window.meInit = async function() {
  await meDataInit();
  if (!meChartStart) {
    // Load from localStorage, or default to January 2026
    meChartStart = localStorage.getItem('meChartStartMonth') || '2026-01';
  }
};

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

  // Fire pending team deletes so they are committed even if the debounce
  // save cycle hasn't processed them yet.
  const pendingTeams = window.meDataPendingDeletes && Array.isArray(window.meDataPendingDeletes.teams)
    ? window.meDataPendingDeletes.teams
    : [];
  if (pendingTeams.length > 0 && typeof meDeleteTeamRelational === 'function') {
    pendingTeams.forEach(teamId => {
      meDeleteTeamRelational(teamId).catch(err => {
        console.warn('Failed to flush team delete', teamId, err.message);
      });
    });
  }

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
