// ═══════════════════════════════════
// operations-dashboard.js — Operations Mission Control
// Depends on: state.js, navigation.js, helpers.js
// ═══════════════════════════════════

let opsRealtimeActive = false;
let opsRefreshTimers = {};
let opsForecastChart = null;
let opsForecastEditingId = '';
let opsForecastInlineEditId = '';
let opsPulseFeedContainer = null;

function opsForecastDomKey(id) {
  return String(id || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function opsForecastInlineFieldId(id, field) {
  return `opsForecastInline_${opsForecastDomKey(id)}_${field}`;
}

function opsForecastInlineKeydown(event, id) {
  if (!event) return;

  if (event.key === 'Enter') {
    event.preventDefault();
    if (typeof window.opsForecastSaveInline === 'function') {
      window.opsForecastSaveInline(id);
    } else {
      opsForecastSaveInline(id);
    }
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    if (typeof window.opsForecastCancelInline === 'function') {
      window.opsForecastCancelInline();
    } else {
      opsForecastCancelInline();
    }
  }
}

function opsScheduleRefresh(key, refreshFn, delayMs = 120) {
  if (opsRefreshTimers[key]) {
    clearTimeout(opsRefreshTimers[key]);
  }

  opsRefreshTimers[key] = setTimeout(async () => {
    try {
      await refreshFn();
    } catch (err) {
      console.warn('Operations refresh failed for', key, err && err.message ? err.message : err);
    } finally {
      if (currentSection === 'operations') render();
    }
  }, delayMs);
}

async function opsRefreshProgrammes() {
  if (typeof loadRemote === 'function' && currentUser) {
    await loadRemote();
  }
}

async function opsRefreshProductionBatches() {
  if (!currentUser || !supa || !window.prodState) return;

  const { data, error } = await supa
    .from('production_batches')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!Array.isArray(window.prodState.batches)) window.prodState.batches = [];
  window.prodState.batches = data || [];
}

async function opsRefreshProductionProducts() {
  if (typeof prodDataReloadProducts === 'function') {
    await prodDataReloadProducts();
  }
}

async function opsRefreshMeData() {
  if (!currentUser || !window.meDataState) return;

  // Load fresh ME data without attaching extra section-level subscriptions.
  if (typeof meLoadRelationalTeams !== 'function') return;

  const [teams, tasks, products, holidays] = await Promise.all([
    meLoadRelationalTeams(currentUser.id),
    meLoadRelationalTasks(currentUser.id),
    meLoadRelationalProducts(currentUser.id),
    meLoadRelationalHolidays(currentUser.id)
  ]);

  window.meDataState.team = teams || [];
  window.meDataState.tasks = tasks || [];
  window.meDataState.products = products || [];
  window.meDataState.holidays = Array.isArray(holidays) ? holidays : [];
}

async function opsRefreshBugs() {
  if (!currentUser || !window.bugDataManager || !window.bugDataManager.state) return;

  const { data, error } = await supa
    .from('bug_reports')
    .select('*')
    .order('date_raised', { ascending: false });

  if (error) throw error;
  window.bugDataManager.state.reports = data || [];
}

async function opsRefreshForecast() {
  if (window.opsForecastManager && typeof window.opsForecastManager.reload === 'function') {
    await window.opsForecastManager.reload();
  }
}

function opsRealtimeInit() {
  if (!currentUser || !supa || opsRealtimeActive) return;

  createRealtimeSubscription('programmes', 'ops_programmes_channel', {
    onInsert: () => opsScheduleRefresh('programmes', opsRefreshProgrammes),
    onUpdate: () => opsScheduleRefresh('programmes', opsRefreshProgrammes),
    onDelete: () => opsScheduleRefresh('programmes', opsRefreshProgrammes)
  });

  createRealtimeSubscription('production_batches', 'ops_production_batches_channel', {
    onInsert: () => opsScheduleRefresh('production_batches', opsRefreshProductionBatches),
    onUpdate: () => opsScheduleRefresh('production_batches', opsRefreshProductionBatches),
    onDelete: () => opsScheduleRefresh('production_batches', opsRefreshProductionBatches)
  });

  createRealtimeSubscription('products', 'ops_products_channel', {
    onInsert: () => opsScheduleRefresh('products', opsRefreshProductionProducts),
    onUpdate: () => opsScheduleRefresh('products', opsRefreshProductionProducts),
    onDelete: () => opsScheduleRefresh('products', opsRefreshProductionProducts)
  });

  createRealtimeSubscription('me_teams', 'ops_me_teams_channel', {
    onInsert: () => opsScheduleRefresh('me_data', opsRefreshMeData),
    onUpdate: () => opsScheduleRefresh('me_data', opsRefreshMeData),
    onDelete: () => opsScheduleRefresh('me_data', opsRefreshMeData)
  });

  createRealtimeSubscription('me_tasks', 'ops_me_tasks_channel', {
    onInsert: () => opsScheduleRefresh('me_data', opsRefreshMeData),
    onUpdate: () => opsScheduleRefresh('me_data', opsRefreshMeData),
    onDelete: () => opsScheduleRefresh('me_data', opsRefreshMeData)
  });

  createRealtimeSubscription('me_products', 'ops_me_products_channel', {
    onInsert: () => opsScheduleRefresh('me_data', opsRefreshMeData),
    onUpdate: () => opsScheduleRefresh('me_data', opsRefreshMeData),
    onDelete: () => opsScheduleRefresh('me_data', opsRefreshMeData)
  });

  createRealtimeSubscription('me_holidays', 'ops_me_holidays_channel', {
    onInsert: () => opsScheduleRefresh('me_data', opsRefreshMeData),
    onUpdate: () => opsScheduleRefresh('me_data', opsRefreshMeData),
    onDelete: () => opsScheduleRefresh('me_data', opsRefreshMeData)
  });

  createRealtimeSubscription('bug_reports', 'ops_bug_reports_channel', {
    onInsert: () => opsScheduleRefresh('bugs', opsRefreshBugs),
    onUpdate: () => opsScheduleRefresh('bugs', opsRefreshBugs),
    onDelete: () => opsScheduleRefresh('bugs', opsRefreshBugs)
  });

  createRealtimeSubscription('operations_forecast_opportunities', 'ops_forecast_channel', {
    onInsert: () => opsScheduleRefresh('forecast', opsRefreshForecast),
    onUpdate: () => opsScheduleRefresh('forecast', opsRefreshForecast),
    onDelete: () => opsScheduleRefresh('forecast', opsRefreshForecast)
  });

  // Ensure dashboard starts from fresh data even if user entered from sections
  // that cleaned up their own subscriptions.
  opsScheduleRefresh('programmes', opsRefreshProgrammes, 10);
  opsScheduleRefresh('production_batches', opsRefreshProductionBatches, 10);
  opsScheduleRefresh('products', opsRefreshProductionProducts, 10);
  opsScheduleRefresh('me_data', opsRefreshMeData, 10);
  opsScheduleRefresh('bugs', opsRefreshBugs, 10);
  opsScheduleRefresh('forecast', opsRefreshForecast, 10);

  opsRealtimeActive = true;
}

function opsRealtimeCleanup() {
  Object.keys(opsRefreshTimers).forEach(key => {
    clearTimeout(opsRefreshTimers[key]);
  });
  opsRefreshTimers = {};

  removeRealtimeSubscription('ops_programmes_channel');
  removeRealtimeSubscription('ops_production_batches_channel');
  removeRealtimeSubscription('ops_products_channel');
  removeRealtimeSubscription('ops_me_teams_channel');
  removeRealtimeSubscription('ops_me_tasks_channel');
  removeRealtimeSubscription('ops_me_products_channel');
  removeRealtimeSubscription('ops_me_holidays_channel');
  removeRealtimeSubscription('ops_bug_reports_channel');
  removeRealtimeSubscription('ops_forecast_channel');

  if (opsForecastChart) {
    try {
      opsForecastChart.destroy();
    } catch (err) {
      console.warn('Could not destroy operations forecast chart:', err && err.message ? err.message : err);
    }
    opsForecastChart = null;
  }

  opsRealtimeActive = false;
}

function opsParseDateSafe(raw) {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function opsTodayIso() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function opsCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function opsToNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function opsFormatHours(value) {
  return `${Math.round(opsToNumber(value)).toLocaleString('en-GB')}h`;
}

function opsStatusTone(value) {
  if (value >= 85) return 'good';
  if (value >= 65) return 'watch';
  return 'critical';
}

function opsCalcGateHealth(programmes) {
  let totalChecks = 0;
  let doneChecks = 0;

  programmes.forEach(programme => {
    const gates = Array.isArray(programme.gates) ? programme.gates : [];
    gates.forEach(gate => {
      const checks = Array.isArray(gate.checks) ? gate.checks : [];
      checks.forEach(check => {
        totalChecks += 1;
        if (check === true || (check && check.done === true)) doneChecks += 1;
      });
    });
  });

  const percentage = totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : 0;
  return { doneChecks, totalChecks, percentage };
}

function opsCalcActionHealth(programmes) {
  const today = opsTodayIso();
  let totalOpen = 0;
  let overdue = 0;

  programmes.forEach(programme => {
    const actions = Array.isArray(programme.actions) ? programme.actions : [];
    actions.forEach(action => {
      const status = (action.status || '').toString().toLowerCase();
      const closed = status === 'closed' || status === 'done' || status === 'complete';
      if (!closed) {
        totalOpen += 1;
        const due = action.due || action.dueDate || action.targetDate || '';
        if (due && due < today) overdue += 1;
      }
    });
  });

  return { totalOpen, overdue };
}

function opsCalcRiskHealth(programmes) {
  let highRisks = 0;
  let highRpn = 0;

  programmes.forEach(programme => {
    const risks = Array.isArray(programme.risks) ? programme.risks : [];
    risks.forEach(risk => {
      const score = opsToNumber(risk.score, opsToNumber(risk.likelihood) * opsToNumber(risk.impact));
      if (score >= 12) highRisks += 1;
    });

    const pfmeaModes = Array.isArray(programme.pfmea) ? programme.pfmea : [];
    pfmeaModes.forEach(mode => {
      const effects = Array.isArray(mode.effects) ? mode.effects : [];
      effects.forEach(effect => {
        const causes = Array.isArray(effect.causes) ? effect.causes : [];
        causes.forEach(cause => {
          const sev = opsToNumber(effect.sev, 1);
          const occ = opsToNumber(cause.occ, 1);
          const det = opsToNumber(cause.det, 1);
          const rpn = sev * occ * det;
          if (rpn >= 100) highRpn += 1;
        });
      });
    });
  });

  return { highRisks, highRpn };
}

function opsCalcBugHealth() {
  const reports = window.bugDataManager?.state?.reports;
  const rows = Array.isArray(reports) ? reports : [];

  let open = 0;
  let closed7d = 0;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

  rows.forEach(report => {
    const status = (report.status || '').toString().toLowerCase();
    if (status === 'open') open += 1;

    const respondedAt = opsParseDateSafe(report.responded_at);
    if (status === 'closed' && respondedAt && respondedAt >= sevenDaysAgo) {
      closed7d += 1;
    }
  });

  return { open, closed7d };
}

function opsCalcMeCapacity() {
  if (typeof window.meCalculateMonthData !== 'function' || !window.meDataState) {
    return { ready: false, utilisation: 0, headroom: 0, demand: 0, capacity: 0 };
  }

  const monthKey = opsCurrentMonthKey();
  const team = Array.isArray(window.meDataState.team) ? window.meDataState.team : [];
  const tasks = Array.isArray(window.meDataState.tasks) ? window.meDataState.tasks : [];
  const products = Array.isArray(window.meDataState.products) ? window.meDataState.products : [];
  const holidays = Array.isArray(window.meDataState.holidays) ? window.meDataState.holidays : [];

  const teamMe = typeof window.meFilterByDepartment === 'function'
    ? window.meFilterByDepartment(team, 'ME', 'ME')
    : team;
  const tasksMe = typeof window.meFilterByDepartment === 'function'
    ? window.meFilterByDepartment(tasks, 'ME', 'ME')
    : tasks;
  const productsMe = typeof window.meFilterByDepartment === 'function'
    ? window.meFilterByDepartment(products, 'ME', 'ME')
    : products;
  const holidaysMe = typeof window.meFilterByDepartment === 'function'
    ? window.meFilterByDepartment(holidays, 'ME', 'ME')
    : holidays;

  const monthData = window.meCalculateMonthData(monthKey, teamMe, tasksMe, productsMe, holidaysMe);
  const capacity = opsToNumber(monthData.capacity);
  const demand = opsToNumber(monthData.totalDemand);
  const utilisation = Math.max(0, Math.round(opsToNumber(monthData.utilisation)));
  const headroom = Math.round(capacity - demand);

  return {
    ready: true,
    utilisation,
    headroom,
    demand: Math.round(demand),
    capacity: Math.round(capacity)
  };
}

function opsCalcProductionFlow() {
  const batches = Array.isArray(window.prodState?.batches) ? window.prodState.batches : [];
  const total = batches.length;
  const active = batches.filter(batch => ['planned', 'in progress', 'active', 'queued'].includes((batch.status || '').toString().toLowerCase())).length;
  const completed = batches.filter(batch => ['done', 'complete', 'completed', 'closed'].includes((batch.status || '').toString().toLowerCase())).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, active, completed, completionRate };
}

function opsCalcForecastProduction() {
  if (
    typeof window.prodCapGet24MonthKeys !== 'function' ||
    typeof window.prodCapGetWorkAreas !== 'function' ||
    typeof window.prodCapCalcDemandMatrix !== 'function' ||
    typeof window.prodCapCalcSupplyMatrix !== 'function'
  ) {
    return {
      ready: false,
      mode: 'local',
      error: '',
      activeOpportunities: 0,
      baseline24h: 0,
      forecast24h: 0,
      total24h: 0,
      supply24h: 0,
      headroom24h: 0,
      utilisation24: 0,
      monthSeries: []
    };
  }

  const monthKeys = window.prodCapGet24MonthKeys();
  const workAreas = window.prodCapGetWorkAreas();
  const baselineMatrix = window.prodCapCalcDemandMatrix(monthKeys);
  const supplyMatrix = window.prodCapCalcSupplyMatrix(monthKeys, workAreas);
  const rows = window.opsForecastManager && typeof window.opsForecastManager.getRows === 'function'
    ? window.opsForecastManager.getRows()
    : [];

  const weightedMatrix = typeof window.opsForecastBuildWeightedMatrix === 'function'
    ? window.opsForecastBuildWeightedMatrix(monthKeys, rows)
    : {};

  const monthSeries = monthKeys.map((key, idx) => {
    const baseline = opsToNumber(baselineMatrix[key]?._total, 0);
    const forecastAdd = opsToNumber(weightedMatrix[key]?._total, 0);
    const supply = opsToNumber(supplyMatrix[key]?._total, 0);
    const totalDemand = baseline + forecastAdd;
    const label = typeof window.prodCapMonthLabel === 'function'
      ? window.prodCapMonthLabel(key)
      : `${idx + 1}`;

    return { key, label, baseline, forecastAdd, supply, totalDemand };
  });

  const baseline24h = monthSeries.reduce((sum, row) => sum + row.baseline, 0);
  const forecast24h = monthSeries.reduce((sum, row) => sum + row.forecastAdd, 0);
  const total24h = baseline24h + forecast24h;
  const supply24h = monthSeries.reduce((sum, row) => sum + row.supply, 0);
  const utilFn = typeof window.prodCapUtil === 'function'
    ? window.prodCapUtil
    : (demand, supply) => (supply <= 0 ? (demand > 0 ? 999 : 0) : Math.round((demand / supply) * 100));
  const utilisation24 = utilFn(total24h, supply24h);
  const activeOpportunities = Array.isArray(rows) && typeof window.opsForecastIsActiveStatus === 'function'
    ? rows.filter(row => window.opsForecastIsActiveStatus(row.status)).length
    : 0;
  const mode = window.opsForecastManager?.state?.mode || 'local';
  const error = window.opsForecastManager?.state?.lastError || '';

  return {
    ready: true,
    mode,
    error,
    activeOpportunities,
    baseline24h: Math.round(baseline24h),
    forecast24h: Math.round(forecast24h),
    total24h: Math.round(total24h),
    supply24h: Math.round(supply24h),
    headroom24h: Math.round(supply24h - total24h),
    utilisation24,
    monthSeries,
    rows: Array.isArray(rows) ? rows : []
  };
}

function opsCalcProgrammeFlow(programmes) {
  const total = programmes.length;
  const archived = programmes.filter(p => (p.status || '').toString().toLowerCase() === 'archive').length;
  const active = Math.max(0, total - archived);
  return { total, active, archived };
}

function opsBuildMetrics() {
  const programmes = Array.isArray(db?.programmes) ? db.programmes : [];
  const gate = opsCalcGateHealth(programmes);
  const actions = opsCalcActionHealth(programmes);
  const risk = opsCalcRiskHealth(programmes);
  const bugs = opsCalcBugHealth();
  const me = opsCalcMeCapacity();
  const production = opsCalcProductionFlow();
  const forecast = opsCalcForecastProduction();
  const programmesFlow = opsCalcProgrammeFlow(programmes);

  const healthInputs = [
    Math.max(0, 100 - (actions.overdue * 10)),
    Math.max(0, 100 - (risk.highRpn * 2)),
    gate.percentage,
    Math.max(0, 100 - (bugs.open * 4)),
    me.ready ? Math.max(0, 100 - Math.max(0, me.utilisation - 85) * 2) : 70,
    production.completionRate,
    forecast.ready ? Math.max(0, 100 - Math.max(0, forecast.utilisation24 - 85) * 2) : 70
  ];

  const healthScore = Math.round(healthInputs.reduce((sum, n) => sum + n, 0) / healthInputs.length);

  return {
    gate,
    actions,
    risk,
    bugs,
    me,
    production,
    forecast,
    programmesFlow,
    healthScore,
    generatedAt: new Date()
  };
}

function opsMetricCard(label, value, detail, tone = 'good', onclick = '') {
  const clickAttr = onclick ? ` onclick="${onclick}"` : '';
  const role = onclick ? ' role="button" tabindex="0"' : '';
  return `
    <article class="ops-metric ops-tone-${tone}"${clickAttr}${role}>
      <div class="ops-metric-label">${esc(label)}</div>
      <div class="ops-metric-value">${esc(value)}</div>
      <div class="ops-metric-detail">${esc(detail)}</div>
    </article>`;
}

function opsBuildPulseRows(metrics) {
  const rows = [];

  rows.push({
    title: 'ME Capacity Check',
    detail: metrics.me.ready
      ? `Current utilisation is ${metrics.me.utilisation}% with ${metrics.me.headroom}h headroom this month.`
      : 'ME capacity data has not been initialized yet. Open Capacity once to hydrate data.',
    tone: metrics.me.ready ? (metrics.me.utilisation > 90 ? 'critical' : metrics.me.utilisation > 80 ? 'watch' : 'good') : 'watch',
    dest: 'capacity'
  });

  rows.push({
    title: 'Delivery Confidence',
    detail: `${metrics.actions.overdue} overdue actions and ${metrics.risk.highRpn} high-RPN causes currently need attention.`,
    tone: metrics.actions.overdue > 0 || metrics.risk.highRpn > 0 ? 'critical' : 'good',
    dest: 'product-development'
  });

  rows.push({
    title: 'Production Flow',
    detail: `${metrics.production.active} active batches, ${metrics.production.completed} completed, ${metrics.production.total} total tracked.`,
    tone: metrics.production.active > metrics.production.completed ? 'watch' : 'good',
    dest: 'production'
  });

  rows.push({
    title: 'Stability Signal',
    detail: `${metrics.bugs.open} open bug reports and ${metrics.bugs.closed7d} closed in the last 7 days.`,
    tone: metrics.bugs.open > 5 ? 'critical' : metrics.bugs.open > 0 ? 'watch' : 'good',
    dest: 'bugreports'
  });

  return rows;
}

function opsRenderPulseFeed(metrics) {
  const rows = opsBuildPulseRows(metrics);
  return `
    <section class="ops-panel">
      <div class="ops-panel-head">
        <h3>Live Pulse Feed</h3>
        <span>Updated ${metrics.generatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div class="ops-feed-list">
        ${rows.map(row => `
          <button class="ops-feed-row ops-tone-${row.tone}" data-action="pulse-navigate" data-dest="${row.dest}">
            <div class="ops-feed-title">${esc(row.title)}</div>
            <div class="ops-feed-detail">${esc(row.detail)}</div>
          </button>
        `).join('')}
      </div>
    </section>`;
}

function opsRenderRiskRadar(metrics) {
  const rpnPct = Math.min(100, metrics.risk.highRpn * 4);
  const overduePct = Math.min(100, metrics.actions.overdue * 12);
  const bugPct = Math.min(100, metrics.bugs.open * 8);

  return `
    <section class="ops-panel">
      <div class="ops-panel-head">
        <h3>Risk Radar</h3>
        <span>Heat map of pressure points</span>
      </div>

      <div class="ops-radar-row">
        <div class="ops-radar-label">High RPN Pressure</div>
        <div class="ops-radar-bar"><span style="width:${rpnPct}%"></span></div>
        <div class="ops-radar-value">${metrics.risk.highRpn}</div>
      </div>

      <div class="ops-radar-row">
        <div class="ops-radar-label">Overdue Actions</div>
        <div class="ops-radar-bar"><span style="width:${overduePct}%"></span></div>
        <div class="ops-radar-value">${metrics.actions.overdue}</div>
      </div>

      <div class="ops-radar-row">
        <div class="ops-radar-label">Open Bugs</div>
        <div class="ops-radar-bar"><span style="width:${bugPct}%"></span></div>
        <div class="ops-radar-value">${metrics.bugs.open}</div>
      </div>
    </section>`;
}

function opsRenderQuickActions() {
  return `
    <section class="ops-panel">
      <div class="ops-panel-head">
        <h3>Rapid Actions</h3>
        <span>Jump directly to response screens</span>
      </div>
      <div class="ops-actions-grid">
        <button class="btn btn-ghost" onclick="navigate('capacity')">Open Capacity Board</button>
        <button class="btn btn-ghost" onclick="navigate('production')">Open Production Planner</button>
        <button class="btn btn-ghost" onclick="navigate('product-development')">Open NPI Workspace</button>
        <button class="btn btn-ghost" onclick="navigate('bugreports')">Open Bug Response</button>
      </div>
    </section>`;
}

function opsRenderOverview(metrics) {
  const scoreTone = opsStatusTone(metrics.healthScore);
  const meTone = metrics.me.ready ? (metrics.me.utilisation > 90 ? 'critical' : metrics.me.utilisation > 80 ? 'watch' : 'good') : 'watch';
  const actionTone = metrics.actions.overdue > 0 ? 'critical' : 'good';
  const bugTone = metrics.bugs.open > 5 ? 'critical' : metrics.bugs.open > 0 ? 'watch' : 'good';

  return `
    <div class="ops-shell">
      <section class="ops-hero ops-tone-${scoreTone}">
        <div class="ops-hero-copy">
          <div class="ops-kicker">Operations Mission Control</div>
          <h2>System Health ${metrics.healthScore}%</h2>
          <p>One screen for delivery confidence, team pressure, production flow, and quality stability.</p>
        </div>
        <div class="ops-hero-actions">
          <button class="btn btn-primary" onclick="setOperationsTab('risk')">View Risk Focus</button>
          <button class="btn btn-ghost" onclick="setOperationsTab('flow')">Open Flow Lens</button>
        </div>
      </section>

      <section class="ops-metrics-grid">
        ${opsMetricCard('Active Programmes', String(metrics.programmesFlow.active), `${metrics.programmesFlow.archived} archived`, 'good', "navigate('product-development')")}
        ${opsMetricCard('Gate Completion', `${metrics.gate.percentage}%`, `${metrics.gate.doneChecks}/${metrics.gate.totalChecks} checks done`, metrics.gate.percentage < 65 ? 'critical' : metrics.gate.percentage < 85 ? 'watch' : 'good', "navigate('product-development')")}
        ${opsMetricCard('ME Utilisation', metrics.me.ready ? `${metrics.me.utilisation}%` : 'Not Ready', metrics.me.ready ? `${metrics.me.headroom}h headroom this month` : 'Open Capacity once to initialize', meTone, "navigate('capacity')")}
        ${opsMetricCard('Overdue Actions', String(metrics.actions.overdue), `${metrics.actions.totalOpen} actions open`, actionTone, "navigate('product-development')")}
        ${opsMetricCard('High RPN Causes', String(metrics.risk.highRpn), `${metrics.risk.highRisks} high-risk tracker items`, metrics.risk.highRpn > 0 ? 'critical' : 'good', "navigate('product-development')")}
        ${opsMetricCard('Open Bugs', String(metrics.bugs.open), `${metrics.bugs.closed7d} closed in last 7 days`, bugTone, "navigate('bugreports')")}
        ${opsMetricCard('Production Completion', `${metrics.production.completionRate}%`, `${metrics.production.completed}/${metrics.production.total} batches complete`, metrics.production.completionRate < 40 ? 'critical' : metrics.production.completionRate < 70 ? 'watch' : 'good', "navigate('production')")}
        ${opsMetricCard('Active Batches', String(metrics.production.active), 'Live production work packets', metrics.production.active > 0 ? 'watch' : 'good', "navigate('production')")}
      </section>

      <section class="ops-columns">
        ${opsRenderPulseFeed(metrics)}
        ${opsRenderRiskRadar(metrics)}
      </section>

      ${opsRenderQuickActions()}
    </div>`;
}

function opsRenderFlowView(metrics) {
  return `
    <div class="ops-shell">
      <section class="ops-panel">
        <div class="ops-panel-head">
          <h3>Flow Lens</h3>
          <span>From demand to dispatch</span>
        </div>
        <div class="ops-flow-grid">
          ${opsMetricCard('Programmes In Flight', String(metrics.programmesFlow.active), 'Current change pipelines', 'good')}
          ${opsMetricCard('Production Active', String(metrics.production.active), 'Batches currently moving', metrics.production.active > 0 ? 'watch' : 'good')}
          ${opsMetricCard('Completion Rate', `${metrics.production.completionRate}%`, 'Overall production closure signal', metrics.production.completionRate >= 70 ? 'good' : 'watch')}
        </div>
      </section>
      ${opsRenderQuickActions()}
    </div>`;
}

function opsRenderRiskView(metrics) {
  return `
    <div class="ops-shell">
      ${opsRenderRiskRadar(metrics)}
      <section class="ops-metrics-grid">
        ${opsMetricCard('Overdue Actions', String(metrics.actions.overdue), `${metrics.actions.totalOpen} open actions`, metrics.actions.overdue > 0 ? 'critical' : 'good')}
        ${opsMetricCard('High RPN Causes', String(metrics.risk.highRpn), 'PFMEA risk pressure points', metrics.risk.highRpn > 0 ? 'critical' : 'good')}
        ${opsMetricCard('Open Bugs', String(metrics.bugs.open), 'System stability backlog', metrics.bugs.open > 0 ? 'watch' : 'good')}
      </section>
      ${opsRenderPulseFeed(metrics)}
    </div>`;
}

function opsRenderPeopleView(metrics) {
  return `
    <div class="ops-shell">
      <section class="ops-panel">
        <div class="ops-panel-head">
          <h3>People Load</h3>
          <span>Capacity pressure and breathing room</span>
        </div>
        <div class="ops-metrics-grid">
          ${opsMetricCard('ME Utilisation', metrics.me.ready ? `${metrics.me.utilisation}%` : 'Not Ready', metrics.me.ready ? `${metrics.me.capacity}h capacity / ${metrics.me.demand}h demand` : 'Open Capacity once to initialize', metrics.me.ready ? (metrics.me.utilisation > 90 ? 'critical' : metrics.me.utilisation > 80 ? 'watch' : 'good') : 'watch')}
          ${opsMetricCard('ME Headroom', metrics.me.ready ? `${metrics.me.headroom}h` : 'Not Ready', 'Current month available room', metrics.me.ready && metrics.me.headroom < 0 ? 'critical' : 'good')}
          ${opsMetricCard('Open Actions', String(metrics.actions.totalOpen), 'Cross-team workload commitments', metrics.actions.totalOpen > 20 ? 'watch' : 'good')}
        </div>
      </section>
      ${opsRenderQuickActions()}
    </div>`;
}

function opsRenderActionsView(metrics) {
  return `
    <div class="ops-shell">
      <section class="ops-panel">
        <div class="ops-panel-head">
          <h3>Action Center</h3>
          <span>What needs intervention right now</span>
        </div>
        <div class="ops-actions-grid">
          <button class="btn btn-primary" onclick="navigate('product-development')">Resolve Overdue Actions (${metrics.actions.overdue})</button>
          <button class="btn btn-primary" onclick="navigate('product-development')">Review High RPN (${metrics.risk.highRpn})</button>
          <button class="btn btn-primary" onclick="navigate('bugreports')">Triage Open Bugs (${metrics.bugs.open})</button>
          <button class="btn btn-primary" onclick="navigate('capacity')">Balance Capacity (${metrics.me.ready ? metrics.me.utilisation + '%' : 'Pending'})</button>
        </div>
      </section>
      ${opsRenderPulseFeed(metrics)}
    </div>`;
}

function opsRenderForecastRows(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (safeRows.length === 0) {
    return '<div class="ops-empty-note">No opportunities yet. Add a tender or opportunity to start the forecast layer.</div>';
  }

  return `
    <div class="ops-forecast-table-wrap">
      <table class="ops-forecast-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Area</th>
            <th>Start</th>
            <th>Due</th>
            <th>Total Hours</th>
            <th>Probability</th>
            <th>Weighted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${safeRows.map(row => {
            const inlineMode = opsForecastInlineEditId === row.id;
            const totalHours = opsToNumber(row.total_hours, 0);
            const probability = Math.max(0, Math.min(100, opsToNumber(row.probability_pct, 0)));
            const weightedHours = totalHours * (probability / 100);
            const key = opsForecastDomKey(row.id);
            return `
              <tr>
                <td>
                  ${inlineMode
                    ? `<input class="ops-forecast-inline" id="opsForecastInline_${key}_title" onkeydown="opsForecastInlineKeydown(event, '${esc(row.id)}')" value="${esc(row.title || '')}" />`
                    : esc(row.title || '-')}
                </td>
                <td>
                  ${inlineMode
                    ? `<select class="ops-forecast-inline" id="opsForecastInline_${key}_status" onkeydown="opsForecastInlineKeydown(event, '${esc(row.id)}')">
                        <option value="identified" ${(row.status || '') === 'identified' ? 'selected' : ''}>Identified</option>
                        <option value="quoted" ${(row.status || '') === 'quoted' ? 'selected' : ''}>Quoted</option>
                        <option value="negotiation" ${(row.status || '') === 'negotiation' ? 'selected' : ''}>Negotiation</option>
                        <option value="won" ${(row.status || '') === 'won' ? 'selected' : ''}>Won</option>
                        <option value="active" ${(row.status || '') === 'active' ? 'selected' : ''}>Active</option>
                        <option value="lost" ${(row.status || '') === 'lost' ? 'selected' : ''}>Lost</option>
                        <option value="archived" ${(row.status || '') === 'archived' ? 'selected' : ''}>Archived</option>
                      </select>`
                    : `<span class="ops-forecast-status">${esc(row.status || 'identified')}</span>`}
                </td>
                <td>
                  ${inlineMode
                    ? `<input class="ops-forecast-inline" id="opsForecastInline_${key}_work_area" onkeydown="opsForecastInlineKeydown(event, '${esc(row.id)}')" value="${esc(row.work_area || '')}" />`
                    : esc(row.work_area || 'Unassigned')}
                </td>
                <td>
                  ${inlineMode
                    ? `<input class="ops-forecast-inline" type="date" id="opsForecastInline_${key}_start_date" onkeydown="opsForecastInlineKeydown(event, '${esc(row.id)}')" value="${esc(row.start_date || '')}" />`
                    : esc(row.start_date || '-')}
                </td>
                <td>
                  ${inlineMode
                    ? `<input class="ops-forecast-inline" type="date" id="opsForecastInline_${key}_due_date" onkeydown="opsForecastInlineKeydown(event, '${esc(row.id)}')" value="${esc(row.due_date || '')}" />`
                    : esc(row.due_date || '-')}
                </td>
                <td>
                  ${inlineMode
                    ? `<input class="ops-forecast-inline" type="number" min="0" step="1" id="opsForecastInline_${key}_total_hours" onkeydown="opsForecastInlineKeydown(event, '${esc(row.id)}')" value="${esc(totalHours)}" />`
                    : esc(opsFormatHours(totalHours))}
                </td>
                <td>
                  ${inlineMode
                    ? `<input class="ops-forecast-inline" type="number" min="0" max="100" step="1" id="opsForecastInline_${key}_probability_pct" onkeydown="opsForecastInlineKeydown(event, '${esc(row.id)}')" value="${esc(Math.round(probability))}" />`
                    : esc(`${Math.round(probability)}%`)}
                </td>
                <td>${esc(opsFormatHours(weightedHours))}</td>
                <td class="ops-forecast-actions">
                  <button class="btn btn-ghost" onclick="opsForecastStartEdit('${esc(row.id)}')">Edit</button>
                  ${inlineMode
                    ? `<button class="btn btn-primary" onclick="opsForecastSaveInline('${esc(row.id)}')">Save</button>
                       <button class="btn btn-ghost" onclick="opsForecastCancelInline()">Cancel</button>`
                    : `<button class="btn btn-ghost" onclick="opsForecastStartInlineEdit('${esc(row.id)}')">Quick Edit</button>`}
                  <button class="btn btn-ghost" onclick="opsForecastSetStatus('${esc(row.id)}', 'archived')">Archive</button>
                  <button class="btn btn-ghost" onclick="opsForecastDelete('${esc(row.id)}')">Delete</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

function opsRenderForecastView(metrics) {
  const forecast = metrics.forecast;
  if (!forecast.ready) {
    return `
      <div class="ops-shell">
        <section class="ops-panel">
          <div class="ops-panel-head">
            <h3>Production Forecast</h3>
            <span>Loading baseline and forecast data...</span>
          </div>
        </section>
      </div>`;
  }

  const utilTone = forecast.utilisation24 >= 95 ? 'critical' : forecast.utilisation24 >= 85 ? 'watch' : 'good';
  const headroomTone = forecast.headroom24h < 0 ? 'critical' : forecast.headroom24h < 250 ? 'watch' : 'good';
  const modeText = forecast.mode === 'remote' ? 'Connected to shared forecast table' : 'Using local fallback mode';
  const editingRow = (Array.isArray(forecast.rows) ? forecast.rows : []).find(row => row.id === opsForecastEditingId) || null;
  const formTitle = editingRow ? 'Edit Opportunity' : 'Add Opportunity';
  const formSub = editingRow
    ? 'Update this opportunity and save changes to the forecast layer'
    : 'Create a new forecast entry from active tenders and opportunities';

  return `
    <div class="ops-shell">
      <section class="ops-panel">
        <div class="ops-panel-head">
          <h3>Production Capacity Forecast (24 Months)</h3>
          <span>${esc(modeText)}</span>
        </div>
        ${forecast.error ? `<div class="ops-empty-note">Forecast sync warning: ${esc(forecast.error)}</div>` : ''}
        <div class="ops-metrics-grid">
          ${opsMetricCard('Active Opportunities', String(forecast.activeOpportunities), 'Status in active pipeline', 'good')}
          ${opsMetricCard('Baseline Demand', opsFormatHours(forecast.baseline24h), 'Read-in from production load data', 'good')}
          ${opsMetricCard('Forecast Added', opsFormatHours(forecast.forecast24h), 'Weighted by probability', forecast.forecast24h > 0 ? 'watch' : 'good')}
          ${opsMetricCard('Forecast Total', opsFormatHours(forecast.total24h), 'Baseline + weighted layer', utilTone)}
          ${opsMetricCard('Capacity Supply', opsFormatHours(forecast.supply24h), 'Available production capacity', 'good')}
          ${opsMetricCard('Headroom', opsFormatHours(forecast.headroom24h), 'Supply minus forecast total', headroomTone)}
          ${opsMetricCard('Utilisation', `${forecast.utilisation24}%`, '24-month blended utilisation', utilTone)}
        </div>
      </section>

      <section class="ops-panel">
        <div class="ops-panel-head">
          <h3>Forecast Trend</h3>
          <span>Baseline demand plus weighted opportunity layer</span>
        </div>
        <div class="ops-forecast-chart-wrap">
          <canvas id="opsForecastTrendChart" aria-label="Forecast trend chart"></canvas>
        </div>
      </section>

      <section class="ops-panel">
        <div class="ops-panel-head">
          <h3>${esc(formTitle)}</h3>
          <span>${esc(formSub)}</span>
        </div>
        <form class="ops-forecast-form" onsubmit="opsForecastSubmit(event)">
          <input type="hidden" name="opportunity_id" value="${esc(editingRow?.id || '')}" />
          <label>Title<input type="text" name="title" required maxlength="120" value="${esc(editingRow?.title || '')}" /></label>
          <label>Owner<input type="text" name="owner" maxlength="80" value="${esc(editingRow?.owner || '')}" /></label>
          <label>Status
            <select name="status">
              <option value="identified" ${editingRow?.status === 'identified' ? 'selected' : ''}>Identified</option>
              <option value="quoted" ${editingRow?.status === 'quoted' ? 'selected' : ''}>Quoted</option>
              <option value="negotiation" ${editingRow?.status === 'negotiation' ? 'selected' : ''}>Negotiation</option>
              <option value="won" ${editingRow?.status === 'won' ? 'selected' : ''}>Won</option>
              <option value="active" ${editingRow?.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="lost" ${editingRow?.status === 'lost' ? 'selected' : ''}>Lost</option>
              <option value="archived" ${editingRow?.status === 'archived' ? 'selected' : ''}>Archived</option>
            </select>
          </label>
          <label>Work Area<input type="text" name="work_area" placeholder="Unit 2" value="${esc(editingRow?.work_area || '')}" /></label>
          <label>Start Date<input type="date" name="start_date" required value="${esc(editingRow?.start_date || '')}" /></label>
          <label>Due Date<input type="date" name="due_date" required value="${esc(editingRow?.due_date || '')}" /></label>
          <label>Total Hours<input type="number" name="total_hours" required min="0" step="1" value="${esc(editingRow?.total_hours || 0)}" /></label>
          <label>Probability %<input type="number" name="probability_pct" required min="0" max="100" step="1" value="${esc(editingRow?.probability_pct ?? 0)}" /></label>
          <label class="ops-forecast-notes">Notes<textarea name="notes" rows="2" maxlength="400">${esc(editingRow?.notes || '')}</textarea></label>
          <div class="ops-forecast-form-actions">
            ${editingRow ? '<button class="btn btn-ghost" type="button" onclick="opsForecastCancelEdit()">Cancel Edit</button>' : ''}
            <button class="btn btn-primary" type="submit">${editingRow ? 'Save Changes' : 'Add Opportunity'}</button>
          </div>
        </form>
      </section>

      <section class="ops-panel">
        <div class="ops-panel-head">
          <h3>Opportunity Layer</h3>
          <span>These entries are stacked on top of baseline production demand</span>
        </div>
        ${opsRenderForecastRows(forecast.rows)}
      </section>
    </div>`;
}

function opsRenderForecastChart(forecast) {
  if (!forecast || !Array.isArray(forecast.monthSeries)) return;
  if (typeof Chart !== 'function') return;

  const canvas = document.getElementById('opsForecastTrendChart');
  if (!canvas) return;

  if (opsForecastChart) {
    try {
      opsForecastChart.destroy();
    } catch (err) {
      console.warn('Could not reset operations forecast chart:', err && err.message ? err.message : err);
    }
    opsForecastChart = null;
  }

  const labels = forecast.monthSeries.map(row => row.label);
  const baseline = forecast.monthSeries.map(row => Math.round(row.baseline));
  const forecastAdd = forecast.monthSeries.map(row => Math.round(row.forecastAdd));
  const supply = forecast.monthSeries.map(row => Math.round(row.supply));

  opsForecastChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Baseline Demand',
          data: baseline,
          backgroundColor: 'rgba(17, 108, 148, 0.65)',
          borderColor: 'rgba(17, 108, 148, 1)',
          borderWidth: 1,
          stack: 'demand'
        },
        {
          type: 'bar',
          label: 'Forecast Added',
          data: forecastAdd,
          backgroundColor: 'rgba(181, 119, 0, 0.7)',
          borderColor: 'rgba(181, 119, 0, 1)',
          borderWidth: 1,
          stack: 'demand'
        },
        {
          type: 'line',
          label: 'Capacity Supply',
          data: supply,
          borderColor: 'rgba(31, 143, 101, 1)',
          backgroundColor: 'rgba(31, 143, 101, 0.2)',
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.25
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `${value}h`
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      }
    }
  });
}

async function opsForecastSubmit(event) {
  event.preventDefault();
  if (!window.opsForecastManager || typeof window.opsForecastManager.upsertOpportunity !== 'function') return;

  const form = event.target;
  const fd = new FormData(form);
  const title = (fd.get('title') || '').toString().trim();
  const existingId = (fd.get('opportunity_id') || '').toString().trim();
  const startDate = (fd.get('start_date') || '').toString();
  const dueDate = (fd.get('due_date') || '').toString();
  const totalHours = opsToNumber(fd.get('total_hours'), 0);
  const probabilityPct = Math.max(0, Math.min(100, opsToNumber(fd.get('probability_pct'), 0)));

  if (!title) {
    alert('Please add a title for this opportunity.');
    return;
  }
  if (!startDate || !dueDate) {
    alert('Please add both start and due dates.');
    return;
  }
  if (startDate > dueDate) {
    alert('Start date must be before due date.');
    return;
  }

  await window.opsForecastManager.upsertOpportunity({
    ...(existingId ? { id: existingId } : {}),
    title,
    owner: (fd.get('owner') || '').toString().trim(),
    status: (fd.get('status') || 'identified').toString(),
    work_area: (fd.get('work_area') || '').toString().trim() || 'Unassigned',
    start_date: startDate,
    due_date: dueDate,
    total_hours: totalHours,
    probability_pct: probabilityPct,
    notes: (fd.get('notes') || '').toString().trim()
  });

  form.reset();
  opsForecastEditingId = '';
  opsForecastInlineEditId = '';
  if (currentSection === 'operations') render();
}

async function opsForecastDelete(id) {
  if (!id || !window.opsForecastManager || typeof window.opsForecastManager.deleteOpportunity !== 'function') return;
  if (!confirm('Delete this forecast opportunity?')) return;

  await window.opsForecastManager.deleteOpportunity(id);
  if (opsForecastEditingId === id) opsForecastEditingId = '';
  if (opsForecastInlineEditId === id) opsForecastInlineEditId = '';
  if (currentSection === 'operations') render();
}

async function opsForecastSetStatus(id, status) {
  if (!id || !status || !window.opsForecastManager || typeof window.opsForecastManager.getRows !== 'function') return;

  const row = window.opsForecastManager.getRows().find(item => item.id === id);
  if (!row) return;

  await window.opsForecastManager.upsertOpportunity({
    ...row,
    status
  });

  if (status === 'archived' && opsForecastEditingId === id) opsForecastEditingId = '';
  if (status === 'archived' && opsForecastInlineEditId === id) opsForecastInlineEditId = '';

  if (currentSection === 'operations') render();
}

function opsForecastStartInlineEdit(id) {
  if (!id) return;
  opsForecastInlineEditId = id;
  opsForecastEditingId = '';
  if (currentSection === 'operations') render();
}

function opsForecastCancelInline() {
  opsForecastInlineEditId = '';
  if (currentSection === 'operations') render();
}

async function opsForecastSaveInline(id) {
  if (!id || !window.opsForecastManager || typeof window.opsForecastManager.getRows !== 'function') return;

  const row = window.opsForecastManager.getRows().find(item => item.id === id);
  if (!row) return;

  const titleEl = document.getElementById(opsForecastInlineFieldId(id, 'title'));
  const statusEl = document.getElementById(opsForecastInlineFieldId(id, 'status'));
  const areaEl = document.getElementById(opsForecastInlineFieldId(id, 'work_area'));
  const startEl = document.getElementById(opsForecastInlineFieldId(id, 'start_date'));
  const dueEl = document.getElementById(opsForecastInlineFieldId(id, 'due_date'));
  const totalEl = document.getElementById(opsForecastInlineFieldId(id, 'total_hours'));
  const probEl = document.getElementById(opsForecastInlineFieldId(id, 'probability_pct'));

  const nextTitle = (titleEl?.value || '').toString().trim();
  const nextStart = (startEl?.value || '').toString();
  const nextDue = (dueEl?.value || '').toString();
  const nextTotalHours = Math.max(0, opsToNumber(totalEl?.value, 0));
  const nextProbability = Math.max(0, Math.min(100, opsToNumber(probEl?.value, 0)));

  if (!nextTitle) {
    alert('Please add a title for this opportunity.');
    return;
  }

  if (!nextStart || !nextDue) {
    alert('Please add both start and due dates.');
    return;
  }

  if (nextStart > nextDue) {
    alert('Start date must be before due date.');
    return;
  }

  await window.opsForecastManager.upsertOpportunity({
    ...row,
    title: nextTitle,
    status: (statusEl?.value || row.status || 'identified').toString(),
    work_area: (areaEl?.value || row.work_area || 'Unassigned').toString().trim() || 'Unassigned',
    start_date: nextStart,
    due_date: nextDue,
    total_hours: nextTotalHours,
    probability_pct: nextProbability
  });

  opsForecastInlineEditId = '';
  if (currentSection === 'operations') render();
}

function opsForecastStartEdit(id) {
  if (!id) return;
  opsForecastEditingId = id;
  opsForecastInlineEditId = '';
  if (currentSection === 'operations') render();
}

function opsForecastCancelEdit() {
  opsForecastEditingId = '';
  opsForecastInlineEditId = '';
  if (currentSection === 'operations') render();
}

function setOperationsTab(tab) {
  operationsTab = tab || 'overview';

  const parts = [];
  if (progId) parts.push('p=' + encodeURIComponent(progId));
  parts.push('s=operations');
  if (operationsTab !== 'overview') parts.push('od=' + encodeURIComponent(operationsTab));

  history.replaceState(null, '', '#' + parts.join('&'));
  render();
}

function setupOpsPulseFeed() {
  const container = document.getElementById('ops-dashboard');
  if (!container || opsPulseFeedContainer === container) return;
  opsPulseFeedContainer = container;

  container.addEventListener('click', (event) => {
    const el = event.target.closest('[data-action="pulse-navigate"]');
    if (!el || !container.contains(el)) return;
    const dest = el.dataset.dest;
    if (dest) navigate(dest);
  });
}

function renderOperationsDashboard() {
  opsRealtimeInit();

  const tab = operationsTab || 'overview';
  const metrics = opsBuildMetrics();

  let body = '';
  if (tab === 'flow') body = opsRenderFlowView(metrics);
  else if (tab === 'risk') body = opsRenderRiskView(metrics);
  else if (tab === 'people') body = opsRenderPeopleView(metrics);
  else if (tab === 'actions') body = opsRenderActionsView(metrics);
  else if (tab === 'forecast') body = opsRenderForecastView(metrics);
  else body = opsRenderOverview(metrics);

  setTimeout(() => {
    setupOpsPulseFeed();
    if (tab === 'forecast' && currentSection === 'operations' && (operationsTab || 'overview') === 'forecast') {
      opsRenderForecastChart(metrics.forecast);
    }
  }, 0);

  return `
    <div class="proj-home ops-home" id="ops-dashboard">
      <div class="proj-home-header ops-headline">
        <div>
          <div class="proj-home-title">Operations Mission Control</div>
          <div class="proj-home-sub">Director-level command surface with live operational signals</div>
        </div>
      </div>

      <nav class="ops-tabs" aria-label="Operations dashboard views">
        <button class="ops-tab ${tab === 'overview' ? 'active' : ''}" onclick="setOperationsTab('overview')">Overview</button>
        <button class="ops-tab ${tab === 'flow' ? 'active' : ''}" onclick="setOperationsTab('flow')">Flow</button>
        <button class="ops-tab ${tab === 'risk' ? 'active' : ''}" onclick="setOperationsTab('risk')">Risk</button>
        <button class="ops-tab ${tab === 'people' ? 'active' : ''}" onclick="setOperationsTab('people')">People</button>
        <button class="ops-tab ${tab === 'actions' ? 'active' : ''}" onclick="setOperationsTab('actions')">Actions</button>
        <button class="ops-tab ${tab === 'forecast' ? 'active' : ''}" onclick="setOperationsTab('forecast')">Forecast</button>
      </nav>

      ${body}
    </div>`;
}

window.renderOperationsDashboard = renderOperationsDashboard;
window.setOperationsTab = setOperationsTab;
window.opsBuildMetrics = opsBuildMetrics;
window.opsRealtimeInit = opsRealtimeInit;
window.opsRealtimeCleanup = opsRealtimeCleanup;
window.opsForecastSubmit = opsForecastSubmit;
window.opsForecastDelete = opsForecastDelete;
window.opsForecastSetStatus = opsForecastSetStatus;
window.opsForecastStartEdit = opsForecastStartEdit;
window.opsForecastCancelEdit = opsForecastCancelEdit;
window.opsForecastStartInlineEdit = opsForecastStartInlineEdit;
window.opsForecastCancelInline = opsForecastCancelInline;
window.opsForecastSaveInline = opsForecastSaveInline;
window.opsForecastInlineKeydown = opsForecastInlineKeydown;
