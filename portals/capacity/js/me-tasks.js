/* ============================================================
   me-tasks.js — Tasks Tab Rendering
   ============================================================ */

window.meRenderTasksTab = function(tasksArray, teamArray, availableProducts) {
  availableProducts = availableProducts || [];
  const ME_CATS = ['NPI', 'Improvement', 'Tendering', 'Support', 'Other'];
  const allTasks = typeof meDataGetTasks === 'function' ? meDataGetTasks() : tasksArray;

  let totalHoursValue = 0;
  tasksArray.forEach(t => { totalHoursValue += t.totalHours || 0; });
  const totalHours = totalHoursValue.toFixed(1);

  const taskCount = tasksArray.length;
  const unassignedCount = tasksArray.filter(t => !t.assigneeId).length;
  const avgHours = taskCount > 0 ? (totalHoursValue / taskCount).toFixed(1) : '0';

  const hoursByCategory = {};
  ME_CATS.forEach(cat => {
    hoursByCategory[cat] = tasksArray.filter(t => t.category === cat)
      .reduce((sum, t) => sum + (t.totalHours || 0), 0).toFixed(1);
  });
  const topCategory = ME_CATS.reduce((top, cat) =>
    parseFloat(hoursByCategory[cat]) > parseFloat(hoursByCategory[top]) ? cat : top
  );

  let rows = '';
  tasksArray.forEach((task, idx) => {
    const taskIdx = allTasks.indexOf(task);
    const taskIndex = taskIdx >= 0 ? taskIdx : idx;
    const catOpts = ME_CATS.map(c => `<option value="${c}" ${task.category === c ? 'selected' : ''}>${c}</option>`).join('');
    const memOpts = '<option value="">Unassigned</option>' + teamArray.map(m => `<option value="${m.id}" ${task.assigneeId === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
    const prodOpts = '<option value="">— No Product</option>' + availableProducts.map(p => `<option value="${p.id}" ${task.productId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
    const department = (task.department || 'ME').toUpperCase() === 'PM' ? 'PM' : 'ME';

    rows += `
      <tr class="me-task-row" data-task-idx="${taskIndex}">
        <td><input value="${esc(task.name)}" placeholder="new task" onchange="meDataUpdateTask(${taskIndex}, 'name', this.value); meDebouncedSave();"></td>
        <td><span class="me-cat ${department === 'PM' ? 'me-cat-support' : 'me-cat-npi'}">${department}</span></td>
        <td><select onchange="meDataUpdateTask(${taskIndex}, 'category', this.value); meDebouncedSave();">${catOpts}</select></td>
        <td><select onchange="meDataUpdateTask(${taskIndex}, 'assigneeId', this.value); meDebouncedSave();">${memOpts}</select></td>
        <td><select onchange="meDataUpdateTask(${taskIndex}, 'productId', this.value); meDebouncedSave();">${prodOpts}</select></td>
        <td><input type="date" value="${task.startDate || ''}" onchange="meDataUpdateTask(${taskIndex}, 'startDate', this.value); meDebouncedSave();"></td>
        <td><input type="date" value="${task.endDate || ''}" onchange="meDataUpdateTask(${taskIndex}, 'endDate', this.value); meDebouncedSave();"></td>
        <td><input type="number" value="${task.totalHours || 0}" step="0.1" onchange="meDataUpdateTask(${taskIndex}, 'totalHours', this.value); meDebouncedSave();"></td>
        <td style="text-align: center;">
          <button class="me-del-btn" onclick="if(confirm('Delete task?')) { meDataDeleteTask(${taskIndex}); meOnSave(); meSetTab('tasks'); }">✕</button>
        </td>
      </tr>`;
  });

  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-kpi-value">${totalHours}</div>
          <div class="me-kpi-label">Total Hours</div>
          <div class="me-kpi-month">all tasks</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-kpi-value">${taskCount}</div>
          <div class="me-kpi-label">Tasks</div>
          <div class="me-kpi-month">in pipeline</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--amber);">
          <div class="me-kpi-value">${avgHours}</div>
          <div class="me-kpi-label">Average Hours</div>
          <div class="me-kpi-month">per task</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--navy);">
          <div class="me-kpi-value">${hoursByCategory[topCategory]}</div>
          <div class="me-kpi-label">Top Category</div>
          <div class="me-kpi-month">${topCategory}</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--red);">
          <div class="me-kpi-value">${unassignedCount}</div>
          <div class="me-kpi-label">Unassigned</div>
          <div class="me-kpi-month">tasks</div>
        </div>
      </div>

      <div class="me-card">
        <div class="me-card-head">
          <span class="me-card-title">TASKS</span>
          <span style="font-size:12px;color:var(--muted)">${totalHours} total hours</span>
        </div>
        <div class="me-card-body">
        <div class="me-tbl-wrap">
          <table class="me-tbl">
            <thead><tr>
              <th style="width:150px">Task Name</th>
              <th style="width:90px">Dept</th>
              <th style="width:110px">Category</th>
              <th style="width:130px">Assignee</th>
              <th style="width:130px">Product</th>
              <th style="width:110px">Start Date</th>
              <th style="width:110px">End Date</th>
              <th style="width:80px">Hours</th>
              <th style="width:60px"></th>
            </tr></thead>
            <tbody>
              ${rows || '<tr><td colspan="9"><div style="text-align:center;padding:40px;color:var(--muted)">No tasks added</div></td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="me-add-row">
          <button class="btn btn-primary btn-sm" onclick="meAddDefaultTask();">＋ Add Task</button>
        </div>
      </div>
    </div>
    </div>`;
};

window.meAddDefaultTask = function() {
  const department = typeof meGetDepartmentFromContext === 'function'
    ? meGetDepartmentFromContext()
    : 'ME';
  meDataAddTask('New Task', 'NPI', '', '', '', 0, '', department);
  meOnSave();
  meSetTab('tasks');
};


