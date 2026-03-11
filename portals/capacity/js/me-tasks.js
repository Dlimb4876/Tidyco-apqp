/* ============================================================
   me-tasks.js — Tasks Tab Rendering
   ============================================================ */

window.meRenderTasksTab = function(tasksArray, teamArray, availableProducts) {
  availableProducts = availableProducts || [];
  const ME_CATS = ['NPI', 'Improvement', 'Tendering', 'Support', 'Other'];

  // Calculate total hours (handle both standard and root tasks)
  let totalHoursValue = 0;
  tasksArray.forEach(t => {
    if (t.type === 'root') {
      // Root task: use totalFinalHours from advancedEstimation
      totalHoursValue += t.advancedEstimation?.totalFinalHours || 0;
    } else {
      // Standard task: use totalHours
      totalHoursValue += t.totalHours || 0;
    }
  });
  const totalHours = totalHoursValue.toFixed(1);

  const taskCount = tasksArray.length;
  const unassignedCount = tasksArray.filter(t => !t.assigneeId).length;
  const avgHours = taskCount > 0 ? (totalHoursValue / taskCount).toFixed(1) : '0';

  // Hours by category (handle both standard and root tasks)
  const hoursByCategory = {};
  ME_CATS.forEach(cat => {
    hoursByCategory[cat] = tasksArray.filter(t => t.category === cat).reduce((sum, t) => {
      if (t.type === 'root') {
        return sum + (t.advancedEstimation?.totalFinalHours || 0);
      } else {
        return sum + (t.totalHours || 0);
      }
    }, 0).toFixed(1);
  });
  const topCategory = ME_CATS.reduce((top, cat) =>
    parseFloat(hoursByCategory[cat]) > parseFloat(hoursByCategory[top]) ? cat : top
  );

  let rows = '';
  tasksArray.forEach((task, idx) => {
    const catOpts = ME_CATS.map(c => `<option value="${c}" ${task.category === c ? 'selected' : ''}>${c}</option>`).join('');
    const memOpts = '<option value="">Unassigned</option>' + teamArray.map(m => `<option value="${m.id}" ${task.assigneeId === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
    const prodOpts = '<option value="">— No Product</option>' + availableProducts.map(p => `<option value="${p.id}" ${task.productId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');

    // Determine if task has subtasks (from PERT estimation)
    const isRootTask = task.type === 'root';
    const hasSubtasks = isRootTask && task.subtasks && task.subtasks.length > 0;
    const effectiveHours = isRootTask ? (task.advancedEstimation?.totalFinalHours || task.totalHours || 0) : (task.totalHours || 0);

    const assigneeNames = {};
    teamArray.forEach(m => {
      assigneeNames[m.id] = m.name;
    });

    // Type badge for root tasks
    const typeBadge = isRootTask ? `<span style="display: inline-block; background: #ea580c; color: white; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 3px; margin-right: 4px;">ROOT${hasSubtasks ? ` (${task.subtasks.length})` : ''}</span>` : '';

    rows += `
      <tr class="me-task-row" data-task-idx="${idx}">
        <td style="width: 30px; text-align: center;">
          ${hasSubtasks ? `<button class="me-dropdown-toggle" onclick="meToggleTaskDropdown(${idx})" style="background: none; border: none; cursor: pointer; font-size: 14px; padding: 4px;">▶</button>` : ''}
        </td>
        <td><span style="display: inline-flex; align-items: center; gap: 4px; width: 100%;">${typeBadge}${hasSubtasks ? '<span style="width: 6px; height: 6px; background: #ea580c; border-radius: 50%; flex-shrink: 0;" title="Advanced estimation with subtasks"></span>' : ''}<input value="${esc(task.name)}" placeholder="new task" onchange="meDataUpdateTask(${idx}, 'name', this.value); meDebouncedSave();" style="flex: 1;"></span></td>
        <td><select onchange="meDataUpdateTask(${idx}, 'category', this.value); meDebouncedSave();">${catOpts}</select></td>
        <td><select onchange="meDataUpdateTask(${idx}, 'assigneeId', this.value); meDebouncedSave();">${memOpts}</select></td>
        <td><select onchange="meDataUpdateTask(${idx}, 'productId', this.value); meDebouncedSave();">${prodOpts}</select></td>
        <td><input type="date" value="${task.startDate}" onchange="meDataUpdateTask(${idx}, 'startDate', this.value); meDebouncedSave();"></td>
        <td><input type="date" value="${task.endDate}" onchange="meDataUpdateTask(${idx}, 'endDate', this.value); meDebouncedSave();"></td>
        <td><input type="number" value="${effectiveHours}" step="0.1" ${isRootTask ? 'disabled title="Edit hours via PERT estimation"' : ''} onchange="meDataUpdateTask(${idx}, 'totalHours', this.value); meDebouncedSave();"></td>
        <td style="text-align: center; white-space: nowrap;">
          <button class="me-adv-btn" title="Advanced Estimation" onclick="meOpenEstimationSubsystem(${idx})">⚙️</button>
          <button class="me-del-btn" onclick="if(confirm('Delete task?')) { meDataDeleteTask(${idx}); meOnSave(); meSetTab('tasks'); }">✕</button>
        </td>
      </tr>`;

    // Add dropdown row if has subtasks
    if (hasSubtasks) {
      const subtasksHtml = task.subtasks.map(st => {
        const assigneeName = st.assigneeId ? (assigneeNames[st.assigneeId] || 'Unassigned') : 'Unassigned';
        return `
          <div class="me-subtask-item">
            <div style="flex: 0 0 30px;"></div>
            <div style="flex: 0 0 150px;" class="me-subtask-name">${esc(st.name)}</div>
            <div style="flex: 0 0 110px;"></div>
            <div style="flex: 0 0 130px;" class="me-subtask-assignee">${esc(assigneeName)}</div>
            <div style="flex: 0 0 130px;"></div>
            <div style="flex: 0 0 110px;"></div>
            <div style="flex: 0 0 110px;"></div>
            <div style="flex: 0 0 80px; text-align: right;" class="me-subtask-hours">${(parseFloat(st.hours) || 0).toFixed(1)} h</div>
            <div style="flex: 0 0 60px;"></div>
          </div>
        `;
      }).join('');

      rows += `
        <tr class="me-task-dropdown-row" data-task-idx="${idx}">
          <td colspan="9" style="padding: 0;">
            <div class="me-task-dropdown-content">
              <div class="me-subtask-list">
                ${subtasksHtml}
              </div>
            </div>
          </td>
        </tr>`;
    }
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
              <th style="width:30px"></th>
              <th style="width:150px">Task Name</th>
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
  meDataAddTask('New Task', 'NPI', '', '', '', 0);
  meOnSave();
  meSetTab('tasks');
};

// ── Dropdown Toggle ────────────────────────────────────────
window.meToggleTaskDropdown = function(taskIdx) {
  const dropdownRow = document.querySelector(`.me-task-dropdown-row[data-task-idx="${taskIdx}"]`);
  const toggleBtn = document.querySelector(`.me-task-row[data-task-idx="${taskIdx}"] .me-dropdown-toggle`);

  if (dropdownRow) {
    dropdownRow.classList.toggle('expanded');
    if (toggleBtn) {
      toggleBtn.textContent = dropdownRow.classList.contains('expanded') ? '▼' : '▶';
    }
  }
};

