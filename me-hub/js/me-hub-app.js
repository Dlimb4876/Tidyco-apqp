// ═══════════════════════════════════
// me-hub-app.js — Application logic for ME Department Hub
// Phase 3: Added Work Breakdown Structure (WBS) and Management View
// ═══════════════════════════════════

let hubActiveTab = 'tasks';
let hubTaskSearch = '';
let hubExpandedTasks = new Set(); // Track which tasks have expanded WBS
let hubSelectedTaskForWBS = null; // Currently selected task in WBS view
let hubTimeLogTaskId = null; // Task currently being logged against

// ─────────────────────────────────────────────────────────────
// INIT — called by auth.js after sign-in
// ─────────────────────────────────────────────────────────────
async function hubAppInit() {
  const content = document.getElementById('hubContent');
  content.innerHTML = '<div class="hub-loading">Loading tasks…</div>';

  try {
    await hubDataInit();
    hubRenderCurrentTab();
  } catch (err) {
    console.error('Failed to initialize hub:', err);
    content.innerHTML = `
      <div class="hub-empty" style="color: #c0392b;">
        <p><strong>Error loading data</strong></p>
        <p>${hubEsc(err.message)}</p>
        <p style="font-size: 12px; color: #666; margin-top: 12px;">
          Check that the Phase 3 database migration has been run.<br>
          Table 'me_hub_subtasks' may not exist yet.
        </p>
      </div>
    `;
  }
}

// ─────────────────────────────────────────────────────────────
// TAB SWITCHING
// ─────────────────────────────────────────────────────────────
function hubSetTab(tab) {
  const tabs = document.querySelectorAll('.hub-tab');
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  hubActiveTab = tab;
  hubRenderCurrentTab();
}

function hubRenderCurrentTab() {
  switch (hubActiveTab) {
    case 'tasks':
      hubRenderTasks();
      break;
    case 'wbs':
      hubRenderWBS();
      break;
    case 'management':
      hubRenderManagementView();
      break;
    default:
      hubRenderTasks();
  }
}

// ─────────────────────────────────────────────────────────────
// TASKS VIEW
// ─────────────────────────────────────────────────────────────
function hubRenderTasks() {
  const content = document.getElementById('hubContent');

  const search = hubTaskSearch.toLowerCase();
  const filtered = hubTasks.filter(t => {
    if (t.isDisabled) return false;
    if (!search) return true;
    return (
      t.name.toLowerCase().includes(search) ||
      (t.category || '').toLowerCase().includes(search) ||
      hubGetTeamName(t.assigneeId).toLowerCase().includes(search)
    );
  });

  const totalHours = filtered.reduce((sum, t) => sum + (t.totalHours || 0), 0);

  content.innerHTML = `
    <div class="hub-tasks-header">
      <div>
        <div class="hub-tasks-title">ME Capacity Tasks</div>
        <div class="hub-tasks-meta">${filtered.length} task${filtered.length !== 1 ? 's' : ''} · ${totalHours.toLocaleString()}h total budget</div>
      </div>
      <input
        id="hubTaskSearch"
        class="hub-tasks-search"
        type="search"
        placeholder="Search tasks…"
        value="${hubEsc(hubTaskSearch)}"
        oninput="hubOnSearchInput(this.value)"
      >
    </div>
    <div class="hub-table-wrap">
      ${filtered.length === 0 ? hubRenderEmptyTasks(search) : hubRenderTaskTable(filtered)}
    </div>
  `;
}

function hubRenderEmptyTasks(search) {
  return `
    <div class="hub-empty">
      <p>${search ? 'No tasks match your search.' : 'No tasks found.'}</p>
      <p>${search ? 'Try a different keyword.' : 'Tasks from the ME Capacity plan will appear here.'}</p>
    </div>
  `;
}

function hubRenderTaskTable(tasks) {
  const rows = tasks.map(t => {
    const assignee = hubEsc(hubGetTeamName(t.assigneeId));
    const startFmt = t.startDate ? t.startDate.slice(0, 7) : '—';
    const endFmt   = t.endDate   ? t.endDate.slice(0, 7)   : '—';
    const statusBadge = hubStatusBadge(t.status);
    const catBadge    = t.category
      ? `<span class="hub-cat">${hubEsc(t.category)}</span>`
      : '<span class="hub-cat" style="opacity:.4">—</span>';

    return `
      <tr>
        <td>${hubEsc(t.name)}</td>
        <td>${catBadge}</td>
        <td>${assignee}</td>
        <td class="col-date">${startFmt}</td>
        <td class="col-date">${endFmt}</td>
        <td class="col-hours">${t.totalHours.toLocaleString()}h</td>
        <td>${statusBadge}</td>
        <td class="col-evm">Phase 2+</td>
      </tr>
    `;
  }).join('');

  return `
    <table class="hub-table">
      <thead>
        <tr>
          <th>Task Name</th>
          <th>Category</th>
          <th>Assignee</th>
          <th>Start</th>
          <th>End</th>
          <th style="text-align:right">BAC (hrs)</th>
          <th>Status</th>
          <th title="Earned Value fields — available from Phase 2">EVM / EAC</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function hubStatusBadge(status) {
  const s = (status || '').toUpperCase();
  if (s === 'ACTIVE' || s === 'IN_PROGRESS')
    return `<span class="hub-badge hub-badge-active">${hubEsc(status)}</span>`;
  if (s === 'COMPLETE' || s === 'COMPLETED' || s === 'DONE')
    return `<span class="hub-badge hub-badge-complete">${hubEsc(status)}</span>`;
  if (s === 'ON_HOLD' || s === 'HOLD' || s === 'PAUSED')
    return `<span class="hub-badge hub-badge-hold">${hubEsc(status)}</span>`;
  return `<span class="hub-badge hub-badge-scheduled">${hubEsc(status)}</span>`;
}

// ─────────────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────────────
function hubOnSearchInput(value) {
  hubTaskSearch = value;
  hubRenderTasks();
  // Keep focus in the search box after re-render
  const el = document.getElementById('hubTaskSearch');
  if (el) { el.focus(); el.setSelectionRange(value.length, value.length); }
}

// ═══════════════════════════════════════════════════════════════
// WORK BREAKDOWN STRUCTURE (WBS) VIEW
// ═══════════════════════════════════════════════════════════════

function hubRenderWBS() {
  const content = document.getElementById('hubContent');
  
  const search = hubTaskSearch.toLowerCase();
  const filtered = hubTasks.filter(t => {
    if (t.isDisabled) return false;
    if (!search) return true;
    return (
      t.name.toLowerCase().includes(search) ||
      (t.category || '').toLowerCase().includes(search) ||
      hubGetTeamName(t.assigneeId).toLowerCase().includes(search)
    );
  });

  content.innerHTML = `
    <div class="hub-wbs-header">
      <div>
        <div class="hub-tasks-title">Work Breakdown Structure</div>
        <div class="hub-tasks-meta">Break down tasks into subtasks, track progress, and log time</div>
      </div>
      <input
        id="hubWBSSearch"
        class="hub-tasks-search"
        type="search"
        placeholder="Search tasks…"
        value="${hubEsc(hubTaskSearch)}"
        oninput="hubOnWBSSearch(this.value)"
      >
    </div>
    <div class="hub-wbs-list">
      ${filtered.length === 0 ? hubRenderEmptyWBS(search) : filtered.map(t => hubRenderWBSTask(t)).join('')}
    </div>
  `;
}

function hubRenderEmptyWBS(search) {
  return `
    <div class="hub-empty">
      <p>${search ? 'No tasks match your search.' : 'No tasks found.'}</p>
      <p>${search ? 'Try a different keyword.' : 'Tasks from the ME Capacity plan will appear here.'}</p>
    </div>
  `;
}

function hubRenderWBSTask(task) {
  const isExpanded = hubExpandedTasks.has(task.id);
  const subtasks = hubSubtasks.filter(s => s.parentTaskId === task.id);
  const evm = hubCalculateEVM(task.id);
  const actuals = hubGetActuals(task.id);
  const recentLogs = hubTimeLogs
    .filter(l => l.taskId === task.id)
    .slice(0, 3);

  return `
    <div class="hub-wbs-task ${isExpanded ? 'expanded' : ''}" data-task-id="${task.id}">
      <div class="hub-wbs-task-header" onclick="hubToggleTaskExpand('${task.id}')">
        <div class="hub-wbs-task-main">
          <span class="hub-wbs-expand-icon">${isExpanded ? '▼' : '▶'}</span>
          <span class="hub-wbs-task-name">${hubEsc(task.name)}</span>
          <span class="hub-cat">${hubEsc(task.category || '—')}</span>
        </div>
        <div class="hub-wbs-task-meta">
          <span class="hub-wbs-hours">BAC: <strong>${task.totalHours}h</strong></span>
          <span class="hub-wbs-hours">Actual: <strong>${actuals}h</strong></span>
          <span class="hub-wbs-progress">${evm.percentComplete}%</span>
          <span class="hub-wbs-subtask-count">${subtasks.length} subtask${subtasks.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      
      ${isExpanded ? `
        <div class="hub-wbs-task-body">
          <!-- Progress & Time Log Section -->
          <div class="hub-wbs-task-progress-section">
            <div class="hub-wbs-progress-row">
              <label>Overall Progress:</label>
              <input type="range" min="0" max="100" value="${task.percentComplete}" 
                     onchange="hubUpdateTaskProgress('${task.id}', this.value)"
                     class="hub-wbs-progress-slider">
              <span class="hub-wbs-progress-value">${task.percentComplete}%</span>
            </div>
            
            <!-- Quick Time Log -->
            <div class="hub-wbs-timelog-quick">
              <label>Log Time:</label>
              <input type="number" id="timelog-hours-${task.id}" placeholder="Hours" min="0.5" max="24" step="0.5" class="hub-wbs-hours-input">
              <input type="date" id="timelog-date-${task.id}" value="${new Date().toISOString().split('T')[0]}" class="hub-wbs-date-input">
              <button class="hub-btn hub-btn-primary hub-btn-sm" onclick="hubQuickLogTime('${task.id}')">Log Time</button>
            </div>
            
            ${recentLogs.length > 0 ? `
              <div class="hub-wbs-recent-logs">
                <label>Recent Logs:</label>
                ${recentLogs.map(l => `
                  <span class="hub-wbs-log-entry">${l.hoursLogged}h on ${l.logDate.slice(5)} (${hubGetTeamName(l.userId).split(' ')[0]})</span>
                `).join('')}
              </div>
            ` : ''}
          </div>
          
          <!-- Subtasks List -->
          <div class="hub-wbs-subtasks">
            <div class="hub-wbs-subtasks-header">
              <span>Subtasks</span>
              <button class="hub-btn hub-btn-primary hub-btn-sm" onclick="hubShowAddSubtaskForm('${task.id}')">+ Add Subtask</button>
            </div>
            
            ${subtasks.length === 0 ? `
              <div class="hub-wbs-no-subtasks">
                No subtasks yet. Break this task down into smaller deliverables.
              </div>
            ` : `
              <div class="hub-wbs-subtask-list">
                ${subtasks.map(s => hubRenderSubtaskRow(s)).join('')}
              </div>
            `}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function hubRenderSubtaskRow(subtask) {
  return `
    <div class="hub-wbs-subtask-row" data-subtask-id="${subtask.id}">
      <div class="hub-wbs-subtask-info">
        <span class="hub-wbs-subtask-name">${hubEsc(subtask.name)}</span>
        ${subtask.assigneeId ? `<span class="hub-wbs-subtask-assignee">${hubEsc(hubGetTeamName(subtask.assigneeId))}</span>` : ''}
      </div>
      <div class="hub-wbs-subtask-controls">
        <input type="range" min="0" max="100" value="${subtask.percentComplete}" 
               onchange="hubUpdateSubtaskProgress('${subtask.id}', this.value)"
               class="hub-wbs-subtask-slider"
               title="${subtask.percentComplete}% complete">
        <span class="hub-wbs-subtask-hours">${subtask.plannedHours}h</span>
        <span class="hub-badge hub-badge-${hubGetSubtaskStatusClass(subtask.status)}">${hubEsc(subtask.status.replace('_', ' '))}</span>
        <button class="hub-btn hub-btn-ghost hub-btn-sm" onclick="hubEditSubtask('${subtask.id}')">Edit</button>
        <button class="hub-btn hub-btn-danger hub-btn-sm" onclick="hubDeleteSubtaskConfirm('${subtask.id}')">×</button>
      </div>
    </div>
  `;
}

function hubGetSubtaskStatusClass(status) {
  const s = (status || '').toUpperCase();
  if (s === 'COMPLETE') return 'complete';
  if (s === 'IN_PROGRESS') return 'active';
  if (s === 'ON_HOLD') return 'hold';
  return 'scheduled';
}

// ─────────────────────────────────────────────────────────────
// WBS INTERACTIONS
// ─────────────────────────────────────────────────────────────
function hubToggleTaskExpand(taskId) {
  if (hubExpandedTasks.has(taskId)) {
    hubExpandedTasks.delete(taskId);
  } else {
    hubExpandedTasks.add(taskId);
  }
  hubRenderWBS();
}

function hubOnWBSSearch(value) {
  hubTaskSearch = value;
  hubRenderWBS();
}

async function hubUpdateTaskProgress(taskId, percent) {
  try {
    await hubSupa.from('me_tasks').update({ percent_complete: parseInt(percent) }).eq('id', taskId);
    // Refresh data
    const task = hubTasks.find(t => t.id === taskId);
    if (task) task.percentComplete = parseInt(percent);
    hubRenderWBS();
  } catch (err) {
    console.error('Failed to update task progress:', err);
    alert('Failed to update progress. Please try again.');
  }
}

async function hubUpdateSubtaskProgress(subtaskId, percent) {
  try {
    await hubUpdateSubtask(subtaskId, { percentComplete: parseInt(percent) });
    hubRenderWBS();
  } catch (err) {
    console.error('Failed to update subtask progress:', err);
    alert('Failed to update subtask progress. Please try again.');
  }
}

async function hubQuickLogTime(taskId) {
  const hoursInput = document.getElementById(`timelog-hours-${taskId}`);
  const dateInput = document.getElementById(`timelog-date-${taskId}`);
  
  const hours = parseFloat(hoursInput.value);
  const logDate = dateInput.value;
  
  if (!hours || hours <= 0) {
    alert('Please enter valid hours');
    return;
  }
  
  try {
    await hubLogTime(taskId, hours, logDate);
    hoursInput.value = '';
    hubRenderWBS();
  } catch (err) {
    console.error('Failed to log time:', err);
    alert('Failed to log time. Please try again.');
  }
}

// ─────────────────────────────────────────────────────────────
// SUBTASK FORM
// ─────────────────────────────────────────────────────────────
function hubShowAddSubtaskForm(taskId) {
  hubSelectedTaskForWBS = taskId;
  const modal = document.createElement('div');
  modal.className = 'hub-modal';
  modal.id = 'hubSubtaskModal';
  modal.innerHTML = `
    <div class="hub-modal-overlay" onclick="hubCloseSubtaskModal()"></div>
    <div class="hub-modal-content">
      <div class="hub-modal-header">
        <h3>Add Subtask</h3>
        <button class="hub-modal-close" onclick="hubCloseSubtaskModal()">×</button>
      </div>
      <div class="hub-modal-body">
        <div class="hub-field">
          <label>Subtask Name</label>
          <input type="text" id="subtaskName" placeholder="e.g., Design fixture assembly" required>
        </div>
        <div class="hub-field">
          <label>Description (optional)</label>
          <input type="text" id="subtaskDesc" placeholder="Brief description of work">
        </div>
        <div class="hub-field-row">
          <div class="hub-field">
            <label>Planned Hours</label>
            <input type="number" id="subtaskHours" min="0.5" step="0.5" value="8" required>
          </div>
          <div class="hub-field">
            <label>Assignee</label>
            <select id="subtaskAssignee">
              <option value="">— Unassigned —</option>
              ${hubTeam.map(m => `<option value="${m.id}">${hubEsc(m.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="hub-field-row">
          <div class="hub-field">
            <label>Start Date</label>
            <input type="date" id="subtaskStart">
          </div>
          <div class="hub-field">
            <label>End Date</label>
            <input type="date" id="subtaskEnd">
          </div>
        </div>
      </div>
      <div class="hub-modal-footer">
        <button class="hub-btn hub-btn-ghost" onclick="hubCloseSubtaskModal()">Cancel</button>
        <button class="hub-btn hub-btn-primary" onclick="hubSaveSubtask()">Add Subtask</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function hubCloseSubtaskModal() {
  const modal = document.getElementById('hubSubtaskModal');
  if (modal) modal.remove();
  hubSelectedTaskForWBS = null;
}

async function hubSaveSubtask() {
  const name = document.getElementById('subtaskName').value.trim();
  const description = document.getElementById('subtaskDesc').value.trim();
  const plannedHours = parseFloat(document.getElementById('subtaskHours').value) || 0;
  const assigneeId = document.getElementById('subtaskAssignee').value || null;
  const startDate = document.getElementById('subtaskStart').value || null;
  const endDate = document.getElementById('subtaskEnd').value || null;
  
  if (!name) {
    alert('Please enter a subtask name');
    return;
  }
  
  try {
    await hubCreateSubtask({
      parentTaskId: hubSelectedTaskForWBS,
      name,
      description,
      plannedHours,
      assigneeId,
      startDate,
      endDate,
      status: 'NOT_STARTED',
      percentComplete: 0
    });
    hubCloseSubtaskModal();
    hubRenderWBS();
  } catch (err) {
    console.error('Failed to create subtask:', err);
    alert('Failed to create subtask. Please try again.');
  }
}

async function hubDeleteSubtaskConfirm(subtaskId) {
  if (!confirm('Are you sure you want to delete this subtask?')) return;
  
  try {
    await hubDeleteSubtask(subtaskId);
    hubRenderWBS();
  } catch (err) {
    console.error('Failed to delete subtask:', err);
    alert('Failed to delete subtask. Please try again.');
  }
}

function hubEditSubtask(subtaskId) {
  const subtask = hubSubtasks.find(s => s.id === subtaskId);
  if (!subtask) return;
  
  // For now, just allow inline editing of key fields
  // Full edit modal could be added later
  const newName = prompt('Subtask name:', subtask.name);
  if (newName === null) return;
  
  const newHours = prompt('Planned hours:', subtask.plannedHours);
  if (newHours === null) return;
  
  hubUpdateSubtask(subtaskId, {
    name: newName.trim() || subtask.name,
    plannedHours: parseFloat(newHours) || subtask.plannedHours
  }).then(() => hubRenderWBS()).catch(err => {
    console.error('Failed to update subtask:', err);
    alert('Failed to update subtask');
  });
}

// ═══════════════════════════════════════════════════════════════
// MANAGEMENT VIEW — EAC & Financial Forecasting
// ═══════════════════════════════════════════════════════════════

function hubRenderManagementView() {
  const content = document.getElementById('hubContent');
  const evmData = hubGetAllEVM();
  
  const totalBAC = evmData.reduce((sum, e) => sum + e.bac, 0);
  const totalActuals = evmData.reduce((sum, e) => sum + e.actuals, 0);
  const totalEAC = evmData.reduce((sum, e) => sum + e.eac, 0);
  const totalVariance = totalEAC - totalBAC;
  
  content.innerHTML = `
    <div class="hub-mgmt-header">
      <div>
        <div class="hub-tasks-title">Management View</div>
        <div class="hub-tasks-meta">Earned Value Management & Financial Forecasting</div>
      </div>
      <div class="hub-mgmt-summary">
        <div class="hub-mgmt-total">
          <span class="hub-mgmt-label">Total Budget (BAC)</span>
          <span class="hub-mgmt-value">${totalBAC.toLocaleString()}h</span>
        </div>
        <div class="hub-mgmt-total">
          <span class="hub-mgmt-label">Forecast (EAC)</span>
          <span class="hub-mgmt-value ${totalVariance > 0 ? 'negative' : 'positive'}">${totalEAC.toLocaleString()}h</span>
        </div>
        <div class="hub-mgmt-total">
          <span class="hub-mgmt-label">Variance</span>
          <span class="hub-mgmt-value ${totalVariance > 0 ? 'negative' : 'positive'}">${totalVariance > 0 ? '+' : ''}${totalVariance.toLocaleString()}h</span>
        </div>
      </div>
    </div>
    
    <div class="hub-table-wrap">
      <table class="hub-table hub-mgmt-table">
        <thead>
          <tr>
            <th>Task Name</th>
            <th style="text-align:right">BAC</th>
            <th style="text-align:right">Actuals</th>
            <th style="text-align:center">Progress</th>
            <th style="text-align:right">EV</th>
            <th style="text-align:right">ETC</th>
            <th style="text-align:right">EAC</th>
            <th>Variance Status</th>
          </tr>
        </thead>
        <tbody>
          ${evmData.map(e => `
            <tr>
              <td>
                <strong>${hubEsc(e.taskName)}</strong>
                ${e.subtaskCount > 0 ? `<span class="hub-mgmt-subtask-badge">${e.subtaskCount} subtasks</span>` : ''}
              </td>
              <td class="col-hours">${e.bac.toLocaleString()}h</td>
              <td class="col-hours">${e.actuals.toLocaleString()}h</td>
              <td class="col-progress">
                <div class="hub-mgmt-progress-bar">
                  <div class="hub-mgmt-progress-fill" style="width: ${e.percentComplete}%"></div>
                </div>
                <span class="hub-mgmt-progress-text">${e.percentComplete}%</span>
              </td>
              <td class="col-hours">${e.ev.toLocaleString()}h</td>
              <td class="col-hours">${e.etc.toLocaleString()}h</td>
              <td class="col-hours"><strong>${e.eac.toLocaleString()}h</strong></td>
              <td>${hubRenderVarianceBadge(e)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="hub-mgmt-legend">
      <h4>EVM Definitions</h4>
      <div class="hub-mgmt-legend-grid">
        <div class="hub-mgmt-legend-item">
          <strong>BAC</strong> — Budget At Completion (original allocated hours)
        </div>
        <div class="hub-mgmt-legend-item">
          <strong>EV</strong> — Earned Value (BAC × % Complete)
        </div>
        <div class="hub-mgmt-legend-item">
          <strong>ETC</strong> — Estimate To Complete (remaining work)
        </div>
        <div class="hub-mgmt-legend-item">
          <strong>EAC</strong> — Estimate At Completion (forecast total)
        </div>
        <div class="hub-mgmt-legend-item">
          <strong>Variance</strong> — EAC − BAC (negative = under budget, positive = over)
        </div>
      </div>
    </div>
  `;
}

function hubRenderVarianceBadge(evm) {
  if (evm.bac === 0) {
    return '<span class="hub-badge hub-badge-scheduled">No Budget</span>';
  }
  
  const varianceText = evm.variance > 0 ? `+${evm.variance}h` : `${evm.variance}h`;
  
  switch (evm.status) {
    case 'overrun':
      return `<span class="hub-badge hub-badge-danger">🔴 Overrun ${varianceText}</span>`;
    case 'under':
      return `<span class="hub-badge hub-badge-success">🟢 Under ${varianceText}</span>`;
    default:
      return `<span class="hub-badge hub-badge-success">🟢 On Track</span>`;
  }
}
