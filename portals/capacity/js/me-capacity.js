/* ============================================================
   me-capacity.js — ME Load Capacity Module (Refactored)
   Simplified orchestrator with separated data layer (me-data.js)
   ============================================================ */

// ── Module state ───────────────────────────────────────────
let meTab = 'chart';
let meChartStart = null; // ISO month string (e.g., '2025-03')
let meChartInst = null;  // Chart.js instance
let meSaveTimer = null;  // Debounce timer

// ── Entry point ────────────────────────────────────────────
/**
 * Main render function for ME Capacity Portal
 */
window.renderMeCapacity = function() {
  if (!meChartStart) {
    // Load from localStorage, or default to January 2026
    meChartStart = localStorage.getItem('meChartStartMonth') || '2026-01';
  }

  return `
    <div class="me-shell">
      <div class="me-topbar">
        <div class="me-topbar-left">
          <button class="btn btn-ghost btn-sm" onclick="setCapacityTab('root')">← Back</button>
          <div>
            <div class="me-topbar-title">ME Load Capacity</div>
            <div class="me-topbar-sub">Manufacturing Engineering · Man-hours planning</div>
          </div>
        </div>
      </div>

      <div class="me-nav">
        <button class="me-nav-btn ${meTab === 'chart' ? 'active' : ''}" onclick="meSetTab('chart')">📊 Capacity Chart</button>
        <button class="me-nav-btn ${meTab === 'team' ? 'active' : ''}" onclick="meSetTab('team')">👷 Team</button>
        <button class="me-nav-btn ${meTab === 'tasks' ? 'active' : ''}" onclick="meSetTab('tasks')">📋 Tasks</button>
        <button class="me-nav-btn ${meTab === 'products' ? 'active' : ''}" onclick="meSetTab('products')">🚂 Products</button>
        <button class="me-nav-btn ${meTab === 'holidays' ? 'active' : ''}" onclick="meSetTab('holidays')">🏖️ Holiday Planner</button>
      </div>

      <div class="me-body" id="meBody">
        ${meGetTabContent()}
      </div>
    </div>
  `;
};

// ── Tab management ─────────────────────────────────────────
window.meSetTab = function(tab) {
  meTab = tab;
  const body = document.getElementById('meBody');
  if (body) {
    body.innerHTML = meGetTabContent();
    setTimeout(() => {
      if (tab === 'chart') meDrawChartNow();
    }, 100);
  }
};

function meGetTabContent() {
  const team = meDataGetTeam();
  const tasks = meDataGetTasks();
  const products = meDataGetProducts();
  const holidays = meDataGetHolidays();

  switch (meTab) {
    case 'team':
      return meRenderTeamTab(team);
    case 'tasks':
      return meRenderTasksTab(tasks, team);
    case 'products':
      return meRenderProductsTab(products);
    case 'holidays':
      return meRenderHolidaysTab(holidays, team);
    case 'chart':
    default:
      return meRenderChartTab(meChartStart, team, tasks, products, holidays);
  }
}

// ── TEAM TAB ───────────────────────────────────────────────
function meRenderTeamTab(teamArray) {
  // Calculate monthly capacity (4.33 weeks per month average)
  const weeksPerMonth = 4.33;
  const totalCapacity = teamArray.reduce((sum, member) => {
    const hours = (member.hoursPerWeek || 37.5) * ((member.utilisation || 80) / 100) * weeksPerMonth;
    return sum + hours;
  }, 0).toFixed(1);

  // Calculate group availability
  const npiCapacity = teamArray.filter(m => (m.group || '') === 'NPI').reduce((sum, m) => sum + ((m.hoursPerWeek || 37.5) * ((m.utilisation || 80) / 100) * weeksPerMonth), 0).toFixed(1);
  const prodCapacity = teamArray.filter(m => (m.group || '') === 'Production').reduce((sum, m) => sum + ((m.hoursPerWeek || 37.5) * ((m.utilisation || 80) / 100) * weeksPerMonth), 0).toFixed(1);
  const bothCapacity = teamArray.filter(m => (m.group || '') === 'NPI / Production').reduce((sum, m) => sum + ((m.hoursPerWeek || 37.5) * ((m.utilisation || 80) / 100) * weeksPerMonth), 0).toFixed(1);

  // Calculate holidays this month
  const today = new Date();
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const holidays = meDataGetHolidays();
  const holidaysThisMonth = holidays.filter(h => h.date.substring(0, 7) === thisMonth);

  let rows = '';
  teamArray.forEach((member, idx) => {
    const effective = ((member.hoursPerWeek || 37.5) * ((member.utilisation || 80) / 100)).toFixed(1);
    const groupOpts = '<option value="">—</option><option value="NPI" ' + ((member.group || '') === 'NPI' ? 'selected' : '') + '>NPI</option><option value="Production" ' + ((member.group || '') === 'Production' ? 'selected' : '') + '>Production</option><option value="NPI / Production" ' + ((member.group || '') === 'NPI / Production' ? 'selected' : '') + '>NPI / Production</option>';
    rows += `
      <tr>
        <td><input value="${esc(member.name)}" onchange="meDataUpdateTeam(${idx}, 'name', this.value); meDebouncedSave();"></td>
        <td><input value="${esc(member.jobTitle || '')}" onchange="meDataUpdateTeam(${idx}, 'jobTitle', this.value); meDebouncedSave();"></td>
        <td><select onchange="meDataUpdateTeam(${idx}, 'group', this.value); meDebouncedSave();">${groupOpts}</select></td>
        <td><input type="number" value="${member.hoursPerWeek || 37.5}" min="1" max="80" step="0.5" onchange="meDataUpdateTeam(${idx}, 'hoursPerWeek', this.value); meDebouncedSave();"></td>
        <td><input type="number" value="${member.utilisation || 80}" min="0" max="100" step="5" onchange="meDataUpdateTeam(${idx}, 'utilisation', this.value); meDebouncedSave();"></td>
        <td style="font-weight: bold;">${effective}</td>
        <td style="text-align: center;"><button class="me-del-btn" onclick="if(confirm('Delete engineer?')) { meDataDeleteTeam(${idx}); meOnSave(); meSetTab('team'); }">✕</button></td>
      </tr>`;
  });

  const monthLabel = meGetMonthLabel(thisMonth);

  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-kpi-value">${totalCapacity}</div>
          <div class="me-kpi-label">Total Availability</div>
          <div class="me-kpi-month">h/month</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-kpi-value">${npiCapacity}</div>
          <div class="me-kpi-label">NPI Group</div>
          <div class="me-kpi-month">h/month</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--amber);">
          <div class="me-kpi-value">${prodCapacity}</div>
          <div class="me-kpi-label">Production Group</div>
          <div class="me-kpi-month">h/month</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--navy);">
          <div class="me-kpi-value">${bothCapacity}</div>
          <div class="me-kpi-label">NPI / Production</div>
          <div class="me-kpi-month">h/month</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--teal); cursor: pointer;" onclick="meSetTab('holidays')">
          <div class="me-kpi-value">${holidaysThisMonth.length}</div>
          <div class="me-kpi-label">Holidays This Month</div>
          <div class="me-kpi-month">${monthLabel}</div>
        </div>
      </div>

      <div class="me-card">
        <div class="me-card-head">
          <span class="me-card-title">TEAM MEMBERS</span>
          <span style="font-size:12px;color:var(--muted)">${teamArray.length} engineers</span>
        </div>
        <div class="me-card-body">
          <div class="me-tbl-wrap">
            <table class="me-tbl">
              <thead><tr>
                <th style="min-width:180px">Name</th>
                <th style="width:140px">Job Title</th>
                <th style="width:140px">Group</th>
                <th style="width:130px">Hours / Week</th>
                <th style="width:120px">Utilisation %</th>
                <th style="width:120px">Effective h/wk</th>
                <th style="width:36px"></th>
              </tr></thead>
              <tbody>
                ${rows || '<tr><td colspan="7"><div style="text-align:center;padding:40px;color:var(--muted)">No team members added</div></td></tr>'}
              </tbody>
            </table>
          </div>
          <div class="me-add-row">
            <button class="btn btn-primary btn-sm" onclick="meDataAddTeam('New Engineer', 37.5, 80); meOnSave(); meSetTab('team');">＋ Add Engineer</button>
          </div>
        </div>
      </div>
    </div>`;
}

// ── TASKS TAB ──────────────────────────────────────────────
function meRenderTasksTab(tasksArray, teamArray) {
  const ME_CATS = ['NPI', 'Improvement', 'Tendering', 'Support', 'Other'];
  const totalHours = tasksArray.reduce((sum, t) => sum + (t.totalHours || 0), 0).toFixed(1);

  let rows = '';
  tasksArray.forEach((task, idx) => {
    const catOpts = ME_CATS.map(c => `<option value="${c}" ${task.category === c ? 'selected' : ''}>${c}</option>`).join('');
    const memOpts = '<option value="">Unassigned</option>' + teamArray.map(m => `<option value="${m.id}" ${task.assigneeId === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('');

    rows += `
      <tr>
        <td><input value="${esc(task.name)}" onchange="meDataUpdateTask(${idx}, 'name', this.value); meDebouncedSave();"></td>
        <td><select onchange="meDataUpdateTask(${idx}, 'category', this.value); meDebouncedSave();">${catOpts}</select></td>
        <td><select onchange="meDataUpdateTask(${idx}, 'assigneeId', this.value); meDebouncedSave();">${memOpts}</select></td>
        <td><input type="date" value="${task.startDate}" onchange="meDataUpdateTask(${idx}, 'startDate', this.value); meDebouncedSave();"></td>
        <td><input type="date" value="${task.endDate}" onchange="meDataUpdateTask(${idx}, 'endDate', this.value); meDebouncedSave();"></td>
        <td><input type="number" value="${task.totalHours || 0}" step="0.1" onchange="meDataUpdateTask(${idx}, 'totalHours', this.value); meDebouncedSave();"></td>
        <td style="text-align: center;"><button class="me-del-btn" onclick="if(confirm('Delete task?')) { meDataDeleteTask(${idx}); meOnSave(); meSetTab('tasks'); }">✕</button></td>
      </tr>`;
  });

  return `
    <div class="me-card">
      <div class="me-card-head">
        <span class="me-card-title">TASKS</span>
        <span style="font-size:12px;color:var(--muted)">${totalHours} total hours</span>
      </div>
      <div class="me-card-body">
        <div class="me-tbl-wrap">
          <table class="me-tbl">
            <thead><tr>
              <th style="width:200px">Task Name</th>
              <th style="width:120px">Category</th>
              <th style="width:150px">Assignee</th>
              <th style="width:110px">Start Date</th>
              <th style="width:110px">End Date</th>
              <th style="width:100px">Hours</th>
              <th style="width:36px"></th>
            </tr></thead>
            <tbody>
              ${rows || '<tr><td colspan="7"><div style="text-align:center;padding:40px;color:var(--muted)">No tasks added</div></td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="me-add-row">
          <button class="btn btn-primary btn-sm" onclick="meAddDefaultTask();">＋ Add Task</button>
        </div>
      </div>
    </div>`;
}

function meAddDefaultTask() {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 30);
  const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  meDataAddTask('New Task', 'NPI', '', formatDate(today), formatDate(endDate), 40);
  meOnSave();
  meSetTab('tasks');
}

// ── PRODUCTS TAB ───────────────────────────────────────────
function meRenderProductsTab(productsArray) {
  const weeksPerMonth = 4.33;
  const totalLoadWeekly = productsArray.reduce((sum, p) => sum + (p.hoursPerWeek || 0), 0).toFixed(1);
  const totalLoadMonthly = (totalLoadWeekly * weeksPerMonth).toFixed(1);
  const today = new Date();
  const activeProducts = productsArray.filter(p => {
    const from = new Date(p.supportFrom);
    const until = new Date(p.supportUntil);
    return from <= today && today <= until;
  }).length;

  let rows = '';
  productsArray.forEach((product, idx) => {
    rows += `
      <tr>
        <td><input value="${esc(product.name)}" onchange="meDataUpdateProduct(${idx}, 'name', this.value); meDebouncedSave();"></td>
        <td><input type="date" value="${product.supportFrom}" onchange="meDataUpdateProduct(${idx}, 'supportFrom', this.value); meDebouncedSave();"></td>
        <td><input type="date" value="${product.supportUntil}" onchange="meDataUpdateProduct(${idx}, 'supportUntil', this.value); meDebouncedSave();"></td>
        <td><input type="number" value="${product.hoursPerWeek || 0}" step="0.1" onchange="meDataUpdateProduct(${idx}, 'hoursPerWeek', this.value); meDebouncedSave();"></td>
        <td><input value="${esc(product.notes || '')}" onchange="meDataUpdateProduct(${idx}, 'notes', this.value); meDebouncedSave();"></td>
        <td style="text-align: center;"><button class="me-del-btn" onclick="if(confirm('Delete product?')) { meDataDeleteProduct(${idx}); meOnSave(); meSetTab('products'); }">✕</button></td>
      </tr>`;
  });

  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-kpi-value">${totalLoadMonthly}</div>
          <div class="me-kpi-label">Support Load</div>
          <div class="me-kpi-month">h/month</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-kpi-value">${activeProducts}</div>
          <div class="me-kpi-label">Active Products</div>
          <div class="me-kpi-month">in support</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--amber);">
          <div class="me-kpi-value">${productsArray.length}</div>
          <div class="me-kpi-label">Total Products</div>
          <div class="me-kpi-month">tracked</div>
        </div>
      </div>

      <div class="me-card">
        <div class="me-card-head">
          <span class="me-card-title">PRODUCTS / ONGOING SUPPORT</span>
          <span style="font-size:12px;color:var(--muted)">${totalLoadWeekly} h/wk</span>
        </div>
      <div class="me-card-body">
        <div class="me-tbl-wrap">
          <table class="me-tbl">
            <thead><tr>
              <th style="width:180px">Product/Fleet Name</th>
              <th style="width:110px">Support From</th>
              <th style="width:110px">Support Until</th>
              <th style="width:110px">Hours/Week</th>
              <th style="width:250px">Notes</th>
              <th style="width:36px"></th>
            </tr></thead>
            <tbody>
              ${rows || '<tr><td colspan="6"><div style="text-align:center;padding:40px;color:var(--muted)">No products added</div></td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="me-add-row">
          <button class="btn btn-primary btn-sm" onclick="meAddDefaultProduct();">＋ Add Product</button>
        </div>
      </div>
    </div>
    </div>`;
}

function meAddDefaultProduct() {
  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  meDataAddProduct('New Product', formatDate(today), formatDate(nextYear), 5, '');
  meOnSave();
  meSetTab('products');
}

// ── HOLIDAYS TAB ───────────────────────────────────────────
function meRenderHolidaysTab(holidaysArray, teamArray) {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 90);

  const bankHols = meGetBankHolidaysForYear(today.getFullYear());

  const dates = [];
  for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = meFormatDate(new Date(d));
    const dayOfWeek = new Date(dateStr).getDay();
    // Only include weekdays (Mon=1 to Fri=5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      dates.push(dateStr);
    }
  }

  let html = `
    <div class="me-card" style="overflow: auto;">
      <div class="me-card-head">
        <span class="me-card-title">HOLIDAY PLANNER</span>
        <span style="font-size:11px;color:var(--muted)">5-day work week · Click cells: working → full day → half day → remove · Blue = bank holidays (read-only)</span>
      </div>
      <div class="me-card-body" style="overflow-x: auto;">
        <table class="holiday-matrix">
          <thead>
            <tr>
              <th style="position: sticky; left: 0; z-index: 10; background: var(--white); text-align: left;">Team Member</th>`;

  dates.forEach((date, idx) => {
    const d = new Date(date);
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    const dayNum = d.getDate();
    const isBank = !!bankHols[date];
    const isMonday = d.getDay() === 1 ? ' week-start' : '';
    html += `<th class="holiday-date-header ${isBank ? 'bank-holiday-header' : ''}${isMonday}" title="${date}"><div>${dayName}</div><div>${dayNum}</div></th>`;
  });

  html += `</tr></thead><tbody>`;

  teamArray.forEach(member => {
    html += `<tr><th style="position: sticky; left: 0; background: var(--white); z-index: 9; text-align: left; padding: 8px;">${esc(member.name)}</th>`;

    dates.forEach(date => {
      const isBank = !!bankHols[date];
      const holiday = holidaysArray.find(h => h.personId === member.id && h.date === date);
      const state = holiday ? holiday.type : null;
      const d = new Date(date);
      const isMonday = d.getDay() === 1 ? ' week-start' : '';

      let cellClass = `holiday-cell${isMonday}`;
      let cellContent = '—';

      if (isBank) {
        cellClass += ' bank-holiday';
        cellContent = 'BH';
      } else if (state === 'full') {
        cellClass += ' holiday-full';
        cellContent = 'F';
      } else if (state === 'half') {
        cellClass += ' holiday-half';
        cellContent = 'H';
      }

      const clickHandler = !isBank ? `onclick="meToggleHoliday('${member.id}', '${date}')"` : '';
      html += `<td class="${cellClass}" ${clickHandler} title="${date}">${cellContent}</td>`;
    });

    html += `</tr>`;
  });

  html += `</tbody></table></div></div>`;
  return html;
}

window.meToggleHoliday = function(personId, date) {
  const holidays = meDataGetHolidays();
  const holiday = holidays.find(h => h.personId === personId && h.date === date);

  if (!holiday) {
    meDataAddHoliday(personId, date, 'full');
  } else if (holiday.type === 'full') {
    meDataUpdateHoliday(personId, date, 'half');
  } else {
    meDataDeleteHoliday(personId, date);
  }

  meDebouncedSave();
  meSetTab('holidays');
};

// ── CHART TAB ──────────────────────────────────────────────
function meRenderChartTab(monthKey, teamArray, tasksArray, productsArray, holidaysArray) {
  const monthData = meCalculateMonthData(monthKey, teamArray, tasksArray, productsArray, holidaysArray);
  const capacity = monthData.capacity.toFixed(1);
  const demand = monthData.totalDemand.toFixed(1);
  const utilisation = monthData.utilisation;
  const headroom = Math.max(0, monthData.capacity - monthData.totalDemand).toFixed(1);

  const utilisationColor = utilisation < 85 ? 'var(--green)' :
                           utilisation < 100 ? 'var(--amber)' : 'var(--red)';

  const monthLabel = meGetMonthLabel(monthKey);

  return `
    <div class="me-chart-container">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-kpi-value">${capacity}</div>
          <div class="me-kpi-label">Team Capacity (hours)</div>
          <div class="me-kpi-month">${monthLabel}</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-kpi-value">${demand}</div>
          <div class="me-kpi-label">Total Demand (hours)</div>
          <div class="me-kpi-month">${monthLabel}</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid ${utilisationColor};">
          <div class="me-kpi-value">${utilisation}%</div>
          <div class="me-kpi-label">Utilisation</div>
          <div class="me-kpi-month">${utilisation < 85 ? '✓ Healthy' : utilisation < 100 ? '⚠ Tight' : '✗ Over'}</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--navy);">
          <div class="me-kpi-value">${headroom}</div>
          <div class="me-kpi-label">Available Headroom (hours)</div>
          <div class="me-kpi-month">${monthLabel}</div>
        </div>
      </div>

      <div class="me-chart-controls">
        <button class="btn btn-secondary" onclick="meOnPrevMonth()">← Previous</button>
        <input type="month" id="meChartMonthInput" value="${monthKey}" onchange="meOnMonthChange(this.value)" />
        <button class="btn btn-secondary" onclick="meOnNextMonth()">Next →</button>
      </div>

      <div class="me-chart-wrapper">
        <canvas id="meChart" height="300"></canvas>
      </div>

      <div class="me-chart-legend">
        <div class="legend-item"><div class="legend-color" style="background: #3b82f6;"></div><span>NPI</span></div>
        <div class="legend-item"><div class="legend-color" style="background: #10b981;"></div><span>Improvement</span></div>
        <div class="legend-item"><div class="legend-color" style="background: #f59e0b;"></div><span>Tendering</span></div>
        <div class="legend-item"><div class="legend-color" style="background: #14b8a6;"></div><span>Support</span></div>
        <div class="legend-item"><div class="legend-color" style="background: #8b5cf6;"></div><span>Other</span></div>
        <div class="legend-item" style="margin-left: 30px;"><div class="legend-line" style="background: #ef4444;"></div><span>Team Capacity</span></div>
        <div class="legend-item"><div class="legend-line" style="background: #9ca3af; border-top: 2px dashed #9ca3af;"></div><span>100% Max Capacity</span></div>
      </div>
    </div>
  `;
}

function meDrawChartNow() {
  const team = meDataGetTeam();
  const tasks = meDataGetTasks();
  const products = meDataGetProducts();
  const holidays = meDataGetHolidays();

  if (!window.Chart) {
    console.warn('Chart.js not loaded');
    return;
  }

  const canvas = document.getElementById('meChart');
  if (!canvas) return;

  if (meChartInst) meChartInst.destroy();

  const monthKeys = meGetMonthRange(meChartStart, 18);
  const monthLabels = monthKeys.map(m => meGetMonthLabel(m));

  const capacityData = [];
  const capacityMaxData = [];
  const npiData = [];
  const improvementData = [];
  const tenderingData = [];
  const supportData = [];
  const otherData = [];

  monthKeys.forEach(monthKey => {
    const data = meCalculateMonthData(monthKey, team, tasks, products, holidays);
    capacityData.push(data.capacity);
    capacityMaxData.push(data.capacityMax);
    npiData.push(data.npi);
    improvementData.push(data.improvement);
    tenderingData.push(data.tendering);
    supportData.push(data.support);
    otherData.push(data.other);
  });

  const ctx = canvas.getContext('2d');
  meChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthLabels,
      datasets: [
        { label: 'NPI', data: npiData, backgroundColor: '#3b82f6', order: 2 },
        { label: 'Improvement', data: improvementData, backgroundColor: '#10b981', order: 2 },
        { label: 'Tendering', data: tenderingData, backgroundColor: '#f59e0b', order: 2 },
        { label: 'Support', data: supportData, backgroundColor: '#14b8a6', order: 2 },
        { label: 'Other', data: otherData, backgroundColor: '#8b5cf6', order: 2 },
        { label: 'Team Capacity', data: capacityData, borderColor: '#ef4444', borderWidth: 2, type: 'line', fill: false, pointRadius: 3, pointBackgroundColor: '#ef4444', order: 1 },
        { label: '100% Max Capacity', data: capacityMaxData, borderColor: '#9ca3af', borderWidth: 2, borderDash: [4, 4], type: 'line', fill: false, pointRadius: 2, pointBackgroundColor: '#9ca3af', order: 1 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }
      }
    }
  });
}

// ── Chart event handlers ───────────────────────────────────
window.meOnMonthChange = function(newMonth) {
  meChartStart = newMonth;
  localStorage.setItem('meChartStartMonth', newMonth);
  meSetTab('chart');
};

window.meOnNextMonth = function() {
  const [year, month] = meChartStart.split('-').map(Number);
  const date = new Date(year, month, 1);
  date.setMonth(date.getMonth() + 1);
  meChartStart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  localStorage.setItem('meChartStartMonth', meChartStart);
  meSetTab('chart');
};

window.meOnPrevMonth = function() {
  const [year, month] = meChartStart.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  meChartStart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  localStorage.setItem('meChartStartMonth', meChartStart);
  meSetTab('chart');
};

// ── Persistence ────────────────────────────────────────────
window.meOnSave = async function(showAlert) {
  await meDataSave(showAlert);
};

function meDebouncedSave() {
  clearTimeout(meSaveTimer);
  meSaveTimer = setTimeout(async () => {
    await meDataSave(false);
    // Re-render current tab to update KPIs and sums
    const body = document.getElementById('meBody');
    if (body) {
      body.innerHTML = meGetTabContent();
      if (meTab === 'chart') meDrawChartNow();
    }
  }, 900);
}

// ── Initialization ─────────────────────────────────────────
window.meInit = async function() {
  await meDataInit();
  if (!meChartStart) {
    // Load from localStorage, or default to January 2026
    meChartStart = localStorage.getItem('meChartStartMonth') || '2026-01';
  }
};

// ── Utility Functions ──────────────────────────────────────
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function meFormatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function meGetMonthLabel(monthKey) {
  const date = new Date(monthKey + '-01');
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function meGetMonthRange(startMonth, count) {
  const months = [];
  let current = startMonth;
  for (let i = 0; i < count; i++) {
    months.push(current);
    const [year, month] = current.split('-').map(Number);
    const date = new Date(year, month, 1);
    date.setMonth(date.getMonth() + 1);
    current = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  return months;
}

function meGetBankHolidaysForYear(year) {
  const holidays = {};
  holidays[`${year}-01-01`] = 'New Year';
  holidays[`${year}-12-25`] = 'Christmas';
  holidays[`${year}-12-26`] = 'Boxing Day';

  // Simple Easter calculation (Meeus algorithm)
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
  const easter = new Date(year, month - 1, day);

  const goodFriday = new Date(easter);
  goodFriday.setDate(goodFriday.getDate() - 2);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easterMonday.getDate() + 1);

  holidays[meFormatDate(goodFriday)] = 'Good Friday';
  holidays[meFormatDate(easterMonday)] = 'Easter Monday';

  // UK bank holidays
  const mayFirst = new Date(year, 4, 1);
  const daysUntilMonday = (1 - mayFirst.getDay() + 7) % 7;
  const firstMondayMay = new Date(year, 4, 1 + daysUntilMonday);
  holidays[meFormatDate(firstMondayMay)] = 'Early May Bank Holiday';

  return holidays;
}

function meCalculateMonthData(monthKey, teamArray, tasksArray, productsArray, holidaysArray) {
  const [year, month] = monthKey.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  // Calculate capacity
  let capacity = 0;
  let capacityMax = 0;  // 100% theoretical max
  teamArray.forEach(member => {
    const hoursAdjusted = (member.hoursPerWeek || 37.5) * ((member.utilisation || 80) / 100);
    const hoursMax = (member.hoursPerWeek || 37.5);  // 100% without utilization
    const workDays = meCountWorkDaysInMonth(year, month);
    const monthCapacity = hoursAdjusted * (workDays / 5);
    const monthCapacityMax = hoursMax * (workDays / 5);
    capacity += monthCapacity;
    capacityMax += monthCapacityMax;
  });

  // 🔴 FIX #1 & #5: Calculate and subtract holiday deductions
  let holidayDeduction = 0;
  const bankHols = meGetBankHolidaysForYear(year);
  const hoursPerDay = 7.5;  // Standard 37.5 hours / 5 days

  // Subtract user-marked holidays
  holidaysArray.forEach(holiday => {
    const holidayMonth = holiday.date.substring(0, 7);  // Extract 'YYYY-MM'
    if (holidayMonth === monthKey) {
      if (holiday.type === 'full') {
        holidayDeduction += hoursPerDay;
      } else if (holiday.type === 'half') {
        holidayDeduction += hoursPerDay / 2;
      }
    }
  });

  // Subtract bank holidays (Mon-Fri only, avoiding double-deduction)
  const markedHolidayDates = new Set(
    holidaysArray
      .filter(h => h.date.substring(0, 7) === monthKey)
      .map(h => h.date)
  );

  Object.entries(bankHols).forEach(([dateStr, name]) => {
    const bankMonth = dateStr.substring(0, 7);
    if (bankMonth === monthKey && !markedHolidayDates.has(dateStr)) {
      const d = new Date(dateStr);
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {  // Not weekend
        holidayDeduction += hoursPerDay;
      }
    }
  });

  const adjustedCapacity = Math.max(0, capacity - holidayDeduction);

  // Calculate demand from tasks
  let npi = 0, improvement = 0, tendering = 0, support = 0, other = 0;

  tasksArray.forEach(task => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const overlapStart = new Date(Math.max(taskStart.getTime(), monthStart.getTime()));
    const overlapEnd = new Date(Math.min(taskEnd.getTime(), monthEnd.getTime()));

    if (overlapStart <= overlapEnd) {
      const totalDays = (taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1;
      const overlapDays = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
      const hoursThisMonth = (task.totalHours || 0) * (overlapDays / totalDays);

      const category = (task.category || 'other').toLowerCase();
      if (category === 'npi') npi += hoursThisMonth;
      else if (category === 'improvement') improvement += hoursThisMonth;
      else if (category === 'tendering') tendering += hoursThisMonth;
      else if (category === 'support') support += hoursThisMonth;
      else other += hoursThisMonth;
    }
  });

  // 🔴 FIX #8: Calculate product support with proper date range overlap
  productsArray.forEach(product => {
    const prodStart = new Date(product.supportFrom);
    const prodEnd = new Date(product.supportUntil);

    // Check if product active in this month
    if (prodStart <= monthEnd && prodEnd >= monthStart) {
      // Find overlap between product date range and month
      const overlapStart = new Date(Math.max(prodStart.getTime(), monthStart.getTime()));
      const overlapEnd = new Date(Math.min(prodEnd.getTime(), monthEnd.getTime()));

      // Calculate working days in overlap period
      const overlapDays = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
      const workingDaysInOverlap = overlapDays * (5 / 7);  // Approximate working days
      const weeksInOverlap = workingDaysInOverlap / 5;

      support += (product.hoursPerWeek || 0) * weeksInOverlap;
    }
  });

  const totalDemand = npi + improvement + tendering + support + other;
  const adjustedCapacityMax = Math.max(0, capacityMax - holidayDeduction);
  return {
    capacity: adjustedCapacity,
    capacityMax: adjustedCapacityMax,
    npi,
    improvement,
    tendering,
    support,
    other,
    totalDemand,
    utilisation: adjustedCapacity > 0 ? Math.round((totalDemand / adjustedCapacity) * 100) : 0
  };
}

function meCountWorkDaysInMonth(year, month) {
  const date = new Date(year, month - 1, 1);
  let workDays = 0;
  while (date.getMonth() === month - 1) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) workDays++;
    date.setDate(date.getDate() + 1);
  }
  return workDays;
}

// Auto-init
meInit().catch(err => console.error('ME init failed:', err));

// 🔴 FIX #4: Prevent data loss on page close by flushing debounce timer
window.addEventListener('beforeunload', (event) => {
  clearTimeout(meSaveTimer);  // Cancel pending debounced save
  // Attempt immediate save (fallback for async failures)
  if (typeof meDataSave === 'function') {
    meDataSave(false);  // Don't show alert on unload
  }
});
