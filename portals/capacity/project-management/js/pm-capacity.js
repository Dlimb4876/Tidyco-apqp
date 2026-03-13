/* ============================================================
   pm-capacity.js — Project Management Capacity (shared me_* tables)
   ============================================================ */

let pmSaveTimer = null;

function pmFilterByDepartment(list, department, fallback) {
  if (typeof meFilterByDepartment === 'function') {
    return meFilterByDepartment(list, department, fallback);
  }
  return Array.isArray(list) ? list : [];
}

function pmGetTaskRows(pmTasks, teamArray, productArray) {
  const allTasks = typeof meDataGetTasks === 'function' ? meDataGetTasks() : pmTasks;
  const taskCategories = ['NPI', 'Improvement', 'Tendering', 'Support', 'Other'];

  return pmTasks.map((task, idx) => {
    const globalIdx = allTasks.indexOf(task);
    const rowIndex = globalIdx >= 0 ? globalIdx : idx;
    const catOpts = taskCategories
      .map(c => `<option value="${c}" ${task.category === c ? 'selected' : ''}>${c}</option>`)
      .join('');
    const memOpts = '<option value="">Unassigned</option>' + teamArray
      .map(m => `<option value="${m.id}" ${task.assigneeId === m.id ? 'selected' : ''}>${esc(m.name)}</option>`)
      .join('');
    const prodOpts = '<option value="">— No Product</option>' + productArray
      .map(p => `<option value="${p.id}" ${task.productId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`)
      .join('');

    return `
      <tr>
        <td><input value="${esc(task.name || '')}" onchange="meDataUpdateTask(${rowIndex}, 'name', this.value); pmDebouncedSave();"></td>
        <td><span class="pm-dept-pill">PM</span></td>
        <td><select onchange="meDataUpdateTask(${rowIndex}, 'category', this.value); pmDebouncedSave();">${catOpts}</select></td>
        <td><select onchange="meDataUpdateTask(${rowIndex}, 'assigneeId', this.value); pmDebouncedSave();">${memOpts}</select></td>
        <td><select onchange="meDataUpdateTask(${rowIndex}, 'productId', this.value); pmDebouncedSave();">${prodOpts}</select></td>
        <td><input type="date" value="${task.startDate || ''}" onchange="meDataUpdateTask(${rowIndex}, 'startDate', this.value); pmDebouncedSave();"></td>
        <td><input type="date" value="${task.endDate || ''}" onchange="meDataUpdateTask(${rowIndex}, 'endDate', this.value); pmDebouncedSave();"></td>
        <td><input type="number" step="0.1" value="${task.totalHours || 0}" onchange="meDataUpdateTask(${rowIndex}, 'totalHours', this.value); pmDebouncedSave();"></td>
        <td style="text-align:center;">
          <button class="me-del-btn" onclick="if(confirm('Delete PM task?')) { meDataDeleteTask(${rowIndex}); pmOnSave(); pmRefresh(); }">✕</button>
        </td>
      </tr>`;
  }).join('');
}

window.pmRenderCapacity = function() {
  window.meCurrentDepartmentContext = 'PM';

  const allTeam = typeof meDataGetTeam === 'function' ? meDataGetTeam() : [];
  const pmTeam = pmFilterByDepartment(allTeam, 'PM', 'ME');
  const team = pmTeam.length > 0 ? pmTeam : allTeam;

  const allProducts = typeof meDataGetProducts === 'function' ? meDataGetProducts() : [];
  const pmProducts = pmFilterByDepartment(allProducts, 'PM', 'ME');
  const products = pmProducts.length > 0 ? pmProducts : allProducts;

  const allTasks = typeof meDataGetTasks === 'function' ? meDataGetTasks() : [];
  const tasks = pmFilterByDepartment(allTasks, 'PM', 'ME');

  const totalHours = tasks.reduce((sum, task) => sum + (task.totalHours || 0), 0).toFixed(1);
  const unassigned = tasks.filter(task => !task.assigneeId).length;

  return `
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

      <div class="me-body">
        <div class="me-kpi-strip">
          <div class="me-kpi" style="border-left: 4px solid var(--navy);">
            <div class="me-kpi-value">${tasks.length}</div>
            <div class="me-kpi-label">PM Tasks</div>
            <div class="me-kpi-month">department filtered</div>
          </div>
          <div class="me-kpi" style="border-left: 4px solid var(--amber);">
            <div class="me-kpi-value">${unassigned}</div>
            <div class="me-kpi-label">Unassigned</div>
            <div class="me-kpi-month">tasks</div>
          </div>
          <div class="me-kpi" style="border-left: 4px solid var(--green);">
            <div class="me-kpi-value">${totalHours}</div>
            <div class="me-kpi-label">Total Hours</div>
            <div class="me-kpi-month">PM queue</div>
          </div>
        </div>

        <div class="me-card">
          <div class="me-card-head">
            <span class="me-card-title">PM TASKS</span>
            <span style="font-size:12px;color:var(--muted)">Writes department=PM in background</span>
          </div>
          <div class="me-card-body">
            <div class="me-tbl-wrap">
              <table class="me-tbl">
                <thead>
                  <tr>
                    <th style="width:170px">Task Name</th>
                    <th style="width:90px">Dept</th>
                    <th style="width:120px">Category</th>
                    <th style="width:140px">Assignee</th>
                    <th style="width:140px">Product</th>
                    <th style="width:120px">Start Date</th>
                    <th style="width:120px">End Date</th>
                    <th style="width:90px">Hours</th>
                    <th style="width:60px"></th>
                  </tr>
                </thead>
                <tbody>
                  ${pmGetTaskRows(tasks, team, products) || '<tr><td colspan="9"><div style="text-align:center;padding:40px;color:var(--muted)">No PM tasks added</div></td></tr>'}
                </tbody>
              </table>
            </div>
            <div class="me-add-row">
              <button class="btn btn-primary btn-sm" onclick="pmAddDefaultTask()">＋ Add PM Task</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
};

window.pmAddDefaultTask = function() {
  meDataAddTask('New PM Task', 'NPI', '', '', '', 0, '', 'PM');
  pmOnSave();
  pmRefresh();
};

window.pmOnSave = async function() {
  await meDataSave(false);
};

window.pmDebouncedSave = function() {
  clearTimeout(pmSaveTimer);
  pmSaveTimer = setTimeout(async () => {
    await pmOnSave();
    pmRefresh();
  }, 900);
};

window.pmRefresh = function() {
  const mc = document.getElementById('mainContent');
  if (!mc || currentSection !== 'capacity' || capacityTab !== 'projects') return;
  mc.innerHTML = `<div class="section-inner">${pmRenderCapacity()}</div>`;
};
