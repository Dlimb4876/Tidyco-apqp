/* ============================================================
   me-capacity.js — ME Load Capacity Module (complete rewrite)
   Tabs: Team | Tasks | Products | Capacity Chart
   Depends on: state.js, auth.js (supa, currentUser), db.js (save, setSyncBadge)
   ============================================================ */

// ── Module state ──────────────────────────────────────────────
let meTab        = 'chart';
let meChartStart = null;   // ISO month string e.g. '2025-03'
let meChartInst  = null;   // Chart.js instance

// ── Data scaffold ─────────────────────────────────────────────
function meEnsure() {
  if (!db.me) db.me = { team: [], tasks: [], products: [], holidays: [] };
  if (!db.me.team)     db.me.team     = [];
  if (!db.me.tasks)    db.me.tasks    = [];
  if (!db.me.products) db.me.products = [];
  if (!db.me.holidays) db.me.holidays = [];
}

// ── Entry point ───────────────────────────────────────────────
function renderMeCapacity() {
  meEnsure();
  if (!meChartStart) {
    const now = new Date();
    meChartStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`;
  }
  return `
<div class="me-shell">
  <div class="me-topbar">
    <div class="me-topbar-left">
      <button class="btn btn-ghost btn-sm" onclick="document.getElementById('mainContent').innerHTML = renderCapacity()">← Back</button>
      <div>
        <div class="me-topbar-title">ME Load Capacity</div>
        <div class="me-topbar-sub">Manufacturing Engineering · Man-hours planning</div>
      </div>
    </div>
    <button class="btn btn-ghost btn-sm" onclick="meSaveRemote(true)">↑ Save to Cloud</button>
  </div>
  <div class="me-nav">
    <button class="me-nav-btn ${meTab==='chart'?'active':''}"    onclick="meSetTab('chart')">📊 Capacity Chart</button>
    <button class="me-nav-btn ${meTab==='team'?'active':''}"     onclick="meSetTab('team')">👷 Team</button>
    <button class="me-nav-btn ${meTab==='tasks'?'active':''}"    onclick="meSetTab('tasks')">📋 Tasks</button>
    <button class="me-nav-btn ${meTab==='products'?'active':''}" onclick="meSetTab('products')">🚂 Products</button>
    <button class="me-nav-btn ${meTab==='holidays'?'active':''}" onclick="meSetTab('holidays')">🏖️ Holiday Planner</button>
  </div>
  <div class="me-body" id="meBody">
    ${meGetTabContent()}
  </div>
</div>`;
}

function meSetTab(t) {
  meTab = t;
  const body = document.getElementById('meBody');
  if (body) {
    body.innerHTML = meGetTabContent();
    if (t === 'chart') meDrawChart();
  }
}

function meGetTabContent() {
  if (meTab === 'team')     return meRenderTeam();
  if (meTab === 'tasks')    return meRenderTasks();
  if (meTab === 'products') return meRenderProducts();
  if (meTab === 'chart')    return meRenderChart();
  if (meTab === 'holidays') return meRenderHolidayPlanner();
  return '';
}

// ════════════════════════════════════
// TEAM TAB
// ════════════════════════════════════
function meRenderTeam() {
  const rows = db.me.team.map((m, i) => `
    <tr>
      <td><input value="${esc(m.name)}" onchange="meUpdTeam(${i},'name',this.value)" placeholder="Engineer name"></td>
      <td><input type="number" value="${m.hoursPerWeek||37.5}" min="1" max="80" step="0.5"
           onchange="meUpdTeam(${i},'hoursPerWeek',parseFloat(this.value)||37.5)"></td>
      <td><input type="number" value="${m.utilisation||80}" min="0" max="100" step="5"
           onchange="meUpdTeam(${i},'utilisation',parseFloat(this.value)||80)"></td>
      <td class="me-eff-display">${((m.hoursPerWeek||37.5) * ((m.utilisation||80)/100)).toFixed(1)} h/wk</td>
      <td style="width:36px"><button class="me-del-btn" onclick="meDelItem('team',${i})" title="Remove">✕</button></td>
    </tr>`).join('');

  const totalCap = db.me.team.reduce((s, m) => s + (m.hoursPerWeek||37.5) * ((m.utilisation||80)/100), 0);

  return `
<div class="me-card">
  <div class="me-card-head">
    <span class="me-card-title">TEAM MEMBERS</span>
    <span style="font-size:12px;color:var(--muted)">${db.me.team.length} engineers · ${totalCap.toFixed(1)} h/wk effective capacity</span>
  </div>
  <div class="me-card-body">
    <div class="me-tbl-wrap">
      <table class="me-tbl">
        <thead><tr>
          <th style="min-width:180px">Name</th>
          <th style="width:130px">Hours / Week</th>
          <th style="width:120px">Utilisation %</th>
          <th style="width:120px">Effective h/wk</th>
          <th style="width:36px"></th>
        </tr></thead>
        <tbody id="meTeamTbody">
          ${rows || '<tr><td colspan="5"><div class="me-empty"><div class="me-empty-icon">👷</div><div class="me-empty-title">No team members yet</div><div class="me-empty-sub">Add your first engineer below</div></div></td></tr>'}
        </tbody>
      </table>
    </div>
    <div class="me-add-row">
      <button class="btn btn-primary btn-sm" onclick="meAddTeam()">＋ Add Engineer</button>
    </div>
  </div>
</div>`;
}

function meAddTeam() {
  meEnsure();
  db.me.team.push({ id: meUUID(), name: 'New Engineer', hoursPerWeek: 37.5, utilisation: 80 });
  meSave(); meSetTab('team');
}

function meUpdTeam(i, field, val) {
  meEnsure();
  db.me.team[i][field] = val;
  // Refresh effective hours display
  const tbody = document.getElementById('meTeamTbody');
  if (tbody) {
    const eff = tbody.querySelectorAll('.me-eff-display');
    const m = db.me.team[i];
    if (eff[i]) eff[i].textContent = ((m.hoursPerWeek||37.5) * ((m.utilisation||80)/100)).toFixed(1) + ' h/wk';
  }
  meSave();
}

// ════════════════════════════════════
// TASKS TAB
// ════════════════════════════════════
const ME_CATS = ['NPI','Improvement','Tendering','Support','Other'];
const ME_CAT_CLASS = { NPI:'me-cat-npi', Improvement:'me-cat-improve', Tendering:'me-cat-tender', Support:'me-cat-support', Other:'me-cat-other' };

function meRenderTasks() {
  const teamOpts = db.me.team.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('');

  const rows = db.me.tasks.map((t, i) => {
    const catOpts = ME_CATS.map(c => `<option value="${c}" ${t.category===c?'selected':''}>${c}</option>`).join('');
    const memOpts = `<option value="">Unassigned</option>` + db.me.team.map(m => `<option value="${m.id}" ${t.assigneeId===m.id?'selected':''}>${esc(m.name)}</option>`).join('');
    return `
    <tr>
      <td style="min-width:200px"><input value="${esc(t.name)}" onchange="meUpdTask(${i},'name',this.value)" placeholder="Task name"></td>
      <td style="width:120px">
        <select onchange="meUpdTask(${i},'category',this.value)">${catOpts}</select>
      </td>
      <td style="width:140px">
        <select onchange="meUpdTask(${i},'assigneeId',this.value)">${memOpts}</select>
      </td>
      <td style="width:130px"><input type="date" value="${t.startDate||''}" onchange="meUpdTask(${i},'startDate',this.value)"></td>
      <td style="width:130px"><input type="date" value="${t.endDate||''}" onchange="meUpdTask(${i},'endDate',this.value)"></td>
      <td style="width:100px"><input type="number" value="${t.totalHours||0}" min="0" step="0.5"
           onchange="meUpdTask(${i},'totalHours',parseFloat(this.value)||0)" placeholder="hrs"></td>
      <td style="width:36px"><button class="me-del-btn" onclick="meDelItem('tasks',${i})" title="Remove">✕</button></td>
    </tr>`;
  }).join('');

  const totalHrs = db.me.tasks.reduce((s,t) => s + (t.totalHours||0), 0);

  return `
<div class="me-card">
  <div class="me-card-head">
    <span class="me-card-title">PROJECT TASKS</span>
    <span style="font-size:12px;color:var(--muted)">${db.me.tasks.length} tasks · ${totalHrs.toFixed(0)} total hours</span>
  </div>
  <div class="me-card-body">
    <div class="me-tbl-wrap">
      <table class="me-tbl">
        <thead><tr>
          <th>Task Name</th>
          <th>Category</th>
          <th>Assignee</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Total Hours</th>
          <th></th>
        </tr></thead>
        <tbody>
          ${rows || '<tr><td colspan="7"><div class="me-empty"><div class="me-empty-icon">📋</div><div class="me-empty-title">No tasks yet</div><div class="me-empty-sub">Add tasks to build your demand model</div></div></td></tr>'}
        </tbody>
      </table>
    </div>
    <div class="me-add-row">
      <button class="btn btn-primary btn-sm" onclick="meAddTask()">＋ Add Task</button>
    </div>
  </div>
</div>`;
}

function meAddTask() {
  meEnsure();
  const today = new Date().toISOString().slice(0,10);
  const end   = new Date(Date.now() + 30*24*3600*1000).toISOString().slice(0,10);
  db.me.tasks.push({ id: meUUID(), name: 'New Task', category: 'NPI', assigneeId: '', startDate: today, endDate: end, totalHours: 40 });
  meSave(); meSetTab('tasks');
}

function meUpdTask(i, field, val) {
  meEnsure();
  db.me.tasks[i][field] = val;
  meSave();
}

// ════════════════════════════════════
// PRODUCTS TAB
// ════════════════════════════════════
function meRenderProducts() {
  const rows = db.me.products.map((p, i) => `
    <tr>
      <td style="min-width:200px"><input value="${esc(p.name)}" onchange="meUpdProd(${i},'name',this.value)" placeholder="Product / fleet name"></td>
      <td style="width:130px"><input type="date" value="${p.supportStart||''}" onchange="meUpdProd(${i},'supportStart',this.value)"></td>
      <td style="width:130px"><input type="date" value="${p.supportEnd||''}" onchange="meUpdProd(${i},'supportEnd',this.value)"></td>
      <td style="width:130px"><input type="number" value="${p.hoursPerWeek||0}" min="0" step="0.5"
           onchange="meUpdProd(${i},'hoursPerWeek',parseFloat(this.value)||0)" placeholder="h/wk"></td>
      <td style="width:160px"><input value="${esc(p.notes||'')}" onchange="meUpdProd(${i},'notes',this.value)" placeholder="Notes"></td>
      <td style="width:36px"><button class="me-del-btn" onclick="meDelItem('products',${i})" title="Remove">✕</button></td>
    </tr>`).join('');

  const totalLoad = db.me.products.reduce((s,p) => s + (p.hoursPerWeek||0), 0);

  return `
<div class="me-card">
  <div class="me-card-head">
    <span class="me-card-title">PRODUCTS IN SUPPORT</span>
    <span style="font-size:12px;color:var(--muted)">${db.me.products.length} products · ${totalLoad.toFixed(1)} h/wk ongoing load</span>
  </div>
  <div class="me-card-body">
    <div class="me-tbl-wrap">
      <table class="me-tbl">
        <thead><tr>
          <th>Product / Fleet</th>
          <th>Support From</th>
          <th>Support Until</th>
          <th>Hours / Week</th>
          <th>Notes</th>
          <th></th>
        </tr></thead>
        <tbody>
          ${rows || '<tr><td colspan="6"><div class="me-empty"><div class="me-empty-icon">🚂</div><div class="me-empty-title">No products yet</div><div class="me-empty-sub">Add in-service products that require ongoing ME support</div></div></td></tr>'}
        </tbody>
      </table>
    </div>
    <div class="me-add-row">
      <button class="btn btn-primary btn-sm" onclick="meAddProduct()">＋ Add Product</button>
    </div>
  </div>
</div>`;
}

function meAddProduct() {
  meEnsure();
  const today = new Date().toISOString().slice(0,10);
  const end   = new Date(Date.now() + 365*24*3600*1000).toISOString().slice(0,10);
  db.me.products.push({ id: meUUID(), name: 'New Product', supportStart: today, supportEnd: end, hoursPerWeek: 5, notes: '' });
  meSave(); meSetTab('products');
}

function meUpdProd(i, field, val) {
  meEnsure();
  db.me.products[i][field] = val;
  meSave();
}

// ════════════════════════════════════
// DELETE (shared)
// ════════════════════════════════════
function meDelItem(collection, idx) {
  meEnsure();
  db.me[collection].splice(idx, 1);
  meSave();
  meSetTab(meTab);
}

// ════════════════════════════════════
// UK BANK HOLIDAYS
// ════════════════════════════════════
function getUKBankHolidays(year) {
  const holidays = [
    { date: `${year}-01-01`, name: 'New Year\'s Day' },
    { date: `${year}-12-25`, name: 'Christmas Day' },
    { date: `${year}-12-26`, name: 'Boxing Day' }
  ];

  // Easter-based holidays (Good Friday, Easter Monday)
  const easterDate = computeEasterDate(year);
  const goodFriday = new Date(easterDate);
  goodFriday.setDate(goodFriday.getDate() - 2);
  holidays.push({ date: goodFriday.toISOString().slice(0,10), name: 'Good Friday' });

  const easterMonday = new Date(easterDate);
  easterMonday.setDate(easterMonday.getDate() + 1);
  holidays.push({ date: easterMonday.toISOString().slice(0,10), name: 'Easter Monday' });

  // First Monday of May (Early May Bank Holiday)
  const mayFirst = new Date(year, 4, 1);
  const daysUntilMonday = (1 - mayFirst.getDay() + 7) % 7 || 7;
  const firstMayMonday = new Date(year, 4, 1 + daysUntilMonday);
  holidays.push({ date: firstMayMonday.toISOString().slice(0,10), name: 'Early May Bank Holiday' });

  // Last Monday of May (Spring Bank Holiday)
  const mayLast = new Date(year, 5, 0);
  const daysBack = (mayLast.getDay() === 1 ? 0 : (mayLast.getDay() + 6) % 7) || 0;
  const lastMayMonday = new Date(year, 4, 31 - daysBack);
  holidays.push({ date: lastMayMonday.toISOString().slice(0,10), name: 'Spring Bank Holiday' });

  // Last Monday of August (Summer Bank Holiday)
  const augLast = new Date(year, 8, 31);
  const augDaysBack = (augLast.getDay() === 1 ? 0 : (augLast.getDay() + 6) % 7) || 0;
  const lastAugMonday = new Date(year, 7, 31 - augDaysBack);
  holidays.push({ date: lastAugMonday.toISOString().slice(0,10), name: 'Summer Bank Holiday' });

  return holidays;
}

function computeEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// ════════════════════════════════════
// HOLIDAY PLANNER TAB
// ════════════════════════════════════
function meRenderHolidayPlanner() {
  meEnsure();

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 90);

  // Get bank holidays for this year and next
  const bankHolidaysThisYear = getUKBankHolidays(startDate.getFullYear());
  const bankHolidaysNextYear = getUKBankHolidays(endDate.getFullYear());
  const allBankHolidays = [...bankHolidaysThisYear, ...bankHolidaysNextYear];
  const bankHolidayDates = new Set(allBankHolidays.map(h => h.date));

  // Generate date range
  const dates = [];
  const curDate = new Date(startDate);
  while (curDate <= endDate) {
    dates.push(curDate.toISOString().slice(0,10));
    curDate.setDate(curDate.getDate() + 1);
  }

  // Build matrix rows (team members)
  const rows = db.me.team.map((member, memberIdx) => {
    const cells = dates.map((date, dateIdx) => {
      const holiday = db.me.holidays.find(h => h.personId === member.id && h.date === date);
      const isBankHoliday = bankHolidayDates.has(date);
      const holidayType = holiday ? holiday.type : null;

      let cellDisplay = '—';
      let cellClass = 'holiday-cell';
      if (isBankHoliday) {
        cellClass += ' bank-holiday';
        cellDisplay = '⬚'; // Show bank holiday marker
      } else if (holidayType === 'half') {
        cellClass += ' holiday-half';
        cellDisplay = 'H';
      } else if (holidayType === 'full') {
        cellClass += ' holiday-full';
        cellDisplay = 'F';
      }

      return `<td class="${cellClass}" onclick="meToggleHoliday('${member.id}', '${date}')" title="Click to toggle: working → half day → full day → remove">${cellDisplay}</td>`;
    }).join('');

    return `<tr><td class="holiday-person-name">${esc(member.name)}</td>${cells}</tr>`;
  }).join('');

  // Header row with dates
  const dateHeaders = dates.map((date, idx) => {
    const d = new Date(date);
    const dayStr = d.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 1);
    const dateStr = d.getDate();
    const isBankHoliday = bankHolidayDates.has(date);
    const headerClass = isBankHoliday ? 'holiday-date-header bank-holiday-header' : 'holiday-date-header';
    return `<th class="${headerClass}"><div class="holiday-date-label">${dayStr}<br>${dateStr}</div></th>`;
  }).join('');

  return `
<div class="me-card">
  <div class="me-card-head">
    <span class="me-card-title">HOLIDAY PLANNER</span>
    <span style="font-size:12px;color:var(--muted)">${db.me.team.length} team members · Next 90 days</span>
  </div>
  <div class="me-card-body">
    <div class="holiday-matrix-wrap">
      <table class="holiday-matrix">
        <thead>
          <tr>
            <th class="holiday-person-header">Person</th>
            ${dateHeaders}
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="100"><div class="me-empty"><div class="me-empty-icon">👷</div><div class="me-empty-title">No team members yet</div><div class="me-empty-sub">Add team members first to plan holidays</div></div></td></tr>'}
        </tbody>
      </table>
    </div>
    <div style="padding: 12px 16px; border-top: 1px solid var(--line); font-size: 11px; color: var(--muted);">
      <div>Click a cell: <strong>—</strong> (working) → <strong>H</strong> (half day) → <strong>F</strong> (full day) → remove</div>
      <div style="margin-top: 6px;">⬚ = UK Bank Holiday (highlights automatically but must click to mark as time off)</div>
    </div>
  </div>
</div>`;
}

function meToggleHoliday(personId, date) {
  meEnsure();
  const existingIdx = db.me.holidays.findIndex(h => h.personId === personId && h.date === date);

  if (existingIdx === -1) {
    // Add as half day
    db.me.holidays.push({ id: meUUID(), personId, date, type: 'half' });
  } else {
    const current = db.me.holidays[existingIdx];
    if (current.type === 'half') {
      // Change to full day
      current.type = 'full';
    } else {
      // Remove
      db.me.holidays.splice(existingIdx, 1);
    }
  }
  meSave();
  meSetTab('holidays');
}

// ════════════════════════════════════
// CAPACITY CHART TAB
// ════════════════════════════════════
function meRenderChart() {
  // KPIs — calculate for current month
  const now      = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const kpis     = meGetMonthData(monthKey);
  const capHrs   = kpis.capacity;
  const demHrs   = kpis.totalDemand;
  const utilPct  = capHrs > 0 ? Math.round((demHrs / capHrs) * 100) : 0;
  const headroom = Math.max(0, capHrs - demHrs);

  const kpiClass = utilPct >= 100 ? 'over' : utilPct >= 85 ? 'warn' : 'ok';

  return `
<div class="me-kpi-strip">
  <div class="me-kpi">
    <div class="me-kpi-label">Team Capacity (this month)</div>
    <div class="me-kpi-value">${capHrs.toFixed(0)}h</div>
    <div class="me-kpi-sub">${db.me.team.length} engineers</div>
  </div>
  <div class="me-kpi">
    <div class="me-kpi-label">Demand (this month)</div>
    <div class="me-kpi-value">${demHrs.toFixed(0)}h</div>
    <div class="me-kpi-sub">tasks + products</div>
  </div>
  <div class="me-kpi ${kpiClass}">
    <div class="me-kpi-label">Utilisation</div>
    <div class="me-kpi-value">${utilPct}%</div>
    <div class="me-kpi-sub">${utilPct >= 100 ? 'Overcapacity' : utilPct >= 85 ? 'Near limit' : 'Healthy'}</div>
  </div>
  <div class="me-kpi">
    <div class="me-kpi-label">Headroom (this month)</div>
    <div class="me-kpi-value">${headroom.toFixed(0)}h</div>
    <div class="me-kpi-sub">available capacity</div>
  </div>
</div>

<div class="me-card">
  <div class="me-card-head">
    <span class="me-card-title">18-MONTH LOAD vs CAPACITY</span>
    <div class="me-legend">
      <span class="me-leg-item"><span class="me-leg-swatch" style="background:#3b82f6"></span>NPI</span>
      <span class="me-leg-item"><span class="me-leg-swatch" style="background:#10b981"></span>Improvement</span>
      <span class="me-leg-item"><span class="me-leg-swatch" style="background:#f59e0b"></span>Tendering</span>
      <span class="me-leg-item"><span class="me-leg-swatch" style="background:#14b8a6"></span>Support</span>
      <span class="me-leg-item"><span class="me-leg-swatch" style="background:#8b5cf6"></span>Other</span>
      <span class="me-leg-item"><span class="me-leg-line" style="background:#ef4444;height:3px;border-radius:2px"></span>Capacity</span>
    </div>
  </div>
  <div class="me-chart-wrap">
    <div class="me-chart-controls">
      <div class="me-chart-controls-left">
        <div class="me-chart-ctrl-group">
          <label>Start month:</label>
          <input type="month" value="${meChartStart}" id="meChartStartInput"
            onchange="meChartStart=this.value; meDrawChart()">
        </div>
      </div>
    </div>
    <div class="me-chart-canvas-wrap">
      <canvas id="meCapacityChart"></canvas>
    </div>
  </div>
</div>`;
}

// ── Chart draw (Chart.js via CDN loaded in index.html) ────────
function meDrawChart() {
  // Destroy existing instance
  if (meChartInst) { meChartInst.destroy(); meChartInst = null; }

  const canvas = document.getElementById('meCapacityChart');
  if (!canvas) return;

  const [startYear, startMonth] = meChartStart.split('-').map(Number);
  const months = [];
  const labels = [];
  for (let i = 0; i < 18; i++) {
    const d = new Date(startYear, startMonth - 1 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    months.push(key);
    labels.push(d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }));
  }

  const capData   = [];
  const npiData   = [];
  const impData   = [];
  const tendData  = [];
  const suppData  = [];
  const otherData = [];

  months.forEach(mk => {
    const d = meGetMonthData(mk);
    capData.push(parseFloat(d.capacity.toFixed(1)));
    npiData.push(parseFloat(d.npi.toFixed(1)));
    impData.push(parseFloat(d.improvement.toFixed(1)));
    tendData.push(parseFloat(d.tendering.toFixed(1)));
    suppData.push(parseFloat(d.support.toFixed(1)));
    otherData.push(parseFloat(d.other.toFixed(1)));
  });

  const ctx = canvas.getContext('2d');
  meChartInst = new Chart(ctx, {
    data: {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Capacity',
          data: capData,
          borderColor: '#ef4444',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          pointBackgroundColor: '#ef4444',
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          order: 0,
          yAxisID: 'y',
          z: 10,
        },
        {
          type: 'bar', label: 'NPI',         data: npiData,   backgroundColor: '#3b82f6', stack: 'demand', order: 1 },
        {
          type: 'bar', label: 'Improvement', data: impData,   backgroundColor: '#10b981', stack: 'demand', order: 1 },
        {
          type: 'bar', label: 'Tendering',   data: tendData,  backgroundColor: '#f59e0b', stack: 'demand', order: 1 },
        {
          type: 'bar', label: 'Support',     data: suppData,  backgroundColor: '#14b8a6', stack: 'demand', order: 1 },
        {
          type: 'bar', label: 'Other',       data: otherData, backgroundColor: '#8b5cf6', stack: 'demand', order: 1 },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(13,17,23,.92)',
          titleColor: '#e2e6ed',
          bodyColor: '#bdc5d1',
          padding: 12,
          cornerRadius: 6,
          callbacks: {
            afterBody: function(items) {
              const total = items.filter(i=>i.dataset.type==='bar').reduce((s,i)=>s+(i.parsed.y||0),0);
              const cap   = items.find(i=>i.dataset.label==='Capacity')?.parsed.y || 0;
              const pct   = cap > 0 ? Math.round((total/cap)*100) : 0;
              return [`─────────`, `Total demand: ${total.toFixed(1)}h`, `Utilisation: ${pct}%`];
            }
          }
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { color: 'rgba(226,230,237,.5)' },
          ticks: { font: { family: "'IBM Plex Mono', monospace", size: 10 }, color: '#7d8799' }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: 'rgba(226,230,237,.5)' },
          ticks: {
            font: { family: "'IBM Plex Mono', monospace", size: 10 }, color: '#7d8799',
            callback: v => v + 'h'
          },
          title: { display: true, text: 'Hours', font: { size: 11 }, color: '#7d8799' }
        }
      }
    }
  });
}

// ── Data engine: compute monthly capacity & demand ────────────
function meGetMonthData(monthKey) {
  const [yr, mo] = monthKey.split('-').map(Number);
  const monthStart = new Date(yr, mo - 1, 1);
  const monthEnd   = new Date(yr, mo, 0);                  // last day of month
  const weeksInMonth = meWeeksOverlap(monthStart, monthEnd);

  // Get UK bank holidays for this year (and next if spanning year boundary)
  const bankHolidaysThisYear = getUKBankHolidays(yr);
  const bankHolidaysNextYear = yr < new Date().getFullYear() + 10 ? getUKBankHolidays(yr + 1) : [];
  const allBankHolidays = [...bankHolidaysThisYear, ...bankHolidaysNextYear];
  const bankHolidayDates = new Set(allBankHolidays.map(h => h.date));

  // Capacity: sum of (hoursPerWeek * utilisation%) * weeks in month
  // Subtract holidays (both marked by user and bank holidays)
  const capacity = db.me.team.reduce((s, m) => {
    let baseCapacity = ((m.hoursPerWeek || 37.5) * ((m.utilisation || 80) / 100)) * weeksInMonth;

    // Subtract marked holidays
    db.me.holidays.forEach(h => {
      if (h.personId === m.id) {
        const hDate = new Date(h.date);
        if (hDate >= monthStart && hDate <= monthEnd) {
          const dailyHours = (m.hoursPerWeek || 37.5) / 5;
          if (h.type === 'full') {
            baseCapacity -= dailyHours;
          } else if (h.type === 'half') {
            baseCapacity -= dailyHours / 2;
          }
        }
      }
    });

    // Subtract bank holidays
    bankHolidayDates.forEach(bankHolDate => {
      const hDate = new Date(bankHolDate);
      if (hDate >= monthStart && hDate <= monthEnd) {
        // Only subtract if it's a working day (Mon-Fri)
        if (hDate.getDay() !== 0 && hDate.getDay() !== 6) {
          const dailyHours = (m.hoursPerWeek || 37.5) / 5;
          baseCapacity -= dailyHours;
        }
      }
    });

    return s + baseCapacity;
  }, 0);

  // Demand from tasks — distribute total hours linearly across task duration
  const taskDemand = { npi: 0, improvement: 0, tendering: 0, support: 0, other: 0 };
  db.me.tasks.forEach(t => {
    if (!t.startDate || !t.endDate || !t.totalHours) return;
    const tStart = new Date(t.startDate);
    const tEnd   = new Date(t.endDate);
    if (tStart > monthEnd || tEnd < monthStart) return;

    // Duration of whole task in calendar days
    const totalDays = Math.max(1, (tEnd - tStart) / 86400000);
    // Overlap of task with this month in days
    const overlapStart = tStart < monthStart ? monthStart : tStart;
    const overlapEnd   = tEnd   > monthEnd   ? monthEnd   : tEnd;
    const overlapDays  = Math.max(0, (overlapEnd - overlapStart) / 86400000 + 1);
    const hoursThisMonth = t.totalHours * (overlapDays / totalDays);

    const cat = (t.category || 'Other').toLowerCase();
    if      (cat === 'npi')         taskDemand.npi         += hoursThisMonth;
    else if (cat === 'improvement') taskDemand.improvement += hoursThisMonth;
    else if (cat === 'tendering')   taskDemand.tendering   += hoursThisMonth;
    else if (cat === 'support')     taskDemand.support     += hoursThisMonth;
    else                            taskDemand.other       += hoursThisMonth;
  });

  // Demand from products (ongoing weekly load)
  db.me.products.forEach(p => {
    if (!p.supportStart || !p.supportEnd || !p.hoursPerWeek) return;
    const pStart = new Date(p.supportStart);
    const pEnd   = new Date(p.supportEnd);
    if (pStart > monthEnd || pEnd < monthStart) return;
    taskDemand.support += (p.hoursPerWeek || 0) * weeksInMonth;
  });

  const totalDemand = taskDemand.npi + taskDemand.improvement + taskDemand.tendering + taskDemand.support + taskDemand.other;
  return { capacity, totalDemand, ...taskDemand };
}

// Approx working weeks that overlap a calendar month (Mon–Fri weight)
function meWeeksOverlap(monthStart, monthEnd) {
  let days = 0;
  const cur = new Date(monthStart);
  while (cur <= monthEnd) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) days++;
    cur.setDate(cur.getDate() + 1);
  }
  return days / 5; // convert working days to weeks
}

// ════════════════════════════════════
// PERSISTENCE — dedicated me_capacity Supabase table
// Falls back gracefully if table doesn't exist
// ════════════════════════════════════
let meSaveTimer = null;

function meSave() {
  try { localStorage.setItem('tidyco_me_v1', JSON.stringify(db.me)); } catch(e) {}
  clearTimeout(meSaveTimer);
  meSaveTimer = setTimeout(() => meSaveRemote(false), 900);
  setSyncBadge('syncing', '● saving…');
}

async function meSaveRemote(showAlert) {
  if (!currentUser) return;
  const email = currentUser.email;
  const now   = new Date().toISOString();
  try {
    const { data: existing, error: selErr } = await supa
      .from('me_capacity')
      .select('id')
      .eq('user_id', currentUser.id)
      .limit(1);

    if (selErr) {
      // Table may not exist yet — silent fail, data is in localStorage
      console.warn('me_capacity table not found — data saved to localStorage only. Create the table in Supabase to enable cloud sync.');
      setSyncBadge('saved', '● local only');
      if (showAlert) alert('Saved locally.\n\nTo enable cloud sync, create a `me_capacity` table in Supabase:\n  id (uuid, pk), user_id (uuid), data (jsonb), updated_at (timestamptz)');
      return;
    }

    if (existing && existing.length > 0) {
      await supa.from('me_capacity').update({ data: db.me, updated_at: now })
        .eq('user_id', currentUser.id);
    } else {
      await supa.from('me_capacity').insert({ user_id: currentUser.id, data: db.me, updated_at: now });
    }
    setSyncBadge('saved', '● saved ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    if (showAlert) alert('Saved to cloud ✓');
  } catch(e) {
    console.error('meSaveRemote error', e);
    setSyncBadge('error', '● save failed');
  }
}

async function meLoadRemote() {
  if (!currentUser) return;
  try {
    const { data, error } = await supa
      .from('me_capacity')
      .select('data')
      .eq('user_id', currentUser.id)
      .limit(1)
      .single();
    if (error || !data) return;
    db.me = data.data;
    meEnsure();
  } catch(e) {
    // Table may not exist yet — use localStorage fallback
    try {
      const local = localStorage.getItem('tidyco_me_v1');
      if (local) db.me = JSON.parse(local);
    } catch(_) {}
    meEnsure();
  }
}

// ── Utils ─────────────────────────────────────────────────────
function meUUID() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'me_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Re-draw chart after tab switch
document.addEventListener('DOMContentLoaded', () => {
  // Patch: draw chart if we land straight on chart tab
});
