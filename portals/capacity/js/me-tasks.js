/* ============================================================
   me-tasks.js — Tasks Tab Rendering
   ============================================================ */

window.meRenderTasksTab = function(tasksArray, teamArray) {
  const ME_CATS = ['NPI', 'Improvement', 'Tendering', 'Support', 'Other'];
  const totalHours = tasksArray.reduce((sum, t) => sum + (t.totalHours || 0), 0).toFixed(1);
  const taskCount = tasksArray.length;
  const unassignedCount = tasksArray.filter(t => !t.assigneeId).length;
  const avgHours = taskCount > 0 ? (totalHours / taskCount).toFixed(1) : '0';

  // Hours by category
  const hoursByCategory = {};
  ME_CATS.forEach(cat => {
    hoursByCategory[cat] = tasksArray.filter(t => t.category === cat).reduce((sum, t) => sum + (t.totalHours || 0), 0).toFixed(1);
  });
  const topCategory = ME_CATS.reduce((top, cat) =>
    parseFloat(hoursByCategory[cat]) > parseFloat(hoursByCategory[top]) ? cat : top
  );

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
    </div>
    </div>`;
};

window.meAddDefaultTask = function() {
  meDataAddTask('New Task', 'NPI', '', '', '', 0);
  meOnSave();
  meSetTab('tasks');
};
