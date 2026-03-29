/* ============================================================
   cap-tasks.js — Tasks Tab Rendering
   ============================================================ */

import { esc } from '../../../../utils/js/helpers.js'

// Track filter state for tasks tab (separate for each department)
export const capTasksFilters = {
  ME: { search: '', department: 'all', category: 'all', assignee: 'all', product: 'all', month: 'all', hideCompleted: localStorage.getItem('meTasksHideCompleted') === 'true' },
  PM: { search: '', category: 'all', assignee: 'all', product: 'all', month: 'all', hideCompleted: localStorage.getItem('pmTasksHideCompleted') === 'true' },
  LOG: { search: '', category: 'all', assignee: 'all', product: 'all', month: 'all', hideCompleted: false },
  UNIT6: { search: '', category: 'all', assignee: 'all', product: 'all', month: 'all', hideCompleted: false }
}

// Track which task ID is currently in edit mode, per department
export const capTaskEditingId = { ME: null, PM: null, LOG: null, UNIT6: null }

// Track sort state for tasks tab (separate for each department)
export const capTasksSort = {
  ME: { column: '', direction: 'asc' },
  PM: { column: '', direction: 'asc' },
  LOG: { column: '', direction: 'asc' },
  UNIT6: { column: '', direction: 'asc' }
}

export function capTasksSortBy(column, department) {
  const dept = department || 'ME'
  const setState = capTasksSort[dept]
  
  if (setState.column === column) {
    setState.direction = setState.direction === 'asc' ? 'desc' : 'asc'
  } else {
    setState.column = column
    setState.direction = 'asc'
  }
}

export function capGetSortIcon(column, department) {
  const dept = department || 'ME'
  const sortState = capTasksSort[dept]
  if (sortState.column !== column) return '↕'
  return sortState.direction === 'asc' ? '↑' : '↓'
}

function _capComputeFilteredTasks(pageTasks, activeFilters, activeSortState, teamArray, availableProducts) {
  // Apply filters
  let filteredTasks = pageTasks.filter(t => {
    const search = (activeFilters.search || '').toLowerCase();
    const cat = activeFilters.category || 'all';
    const assignee = activeFilters.assignee || 'all';
    const product = activeFilters.product || 'all';
    const hideCompleted = activeFilters.hideCompleted || false;
    const month = activeFilters.month || 'all';

    // Search filter
    if (search && !t.name.toLowerCase().includes(search)) return false;
    // Category filter
    if (cat !== 'all' && t.category !== cat) return false;
    // Assignee filter
    if (assignee !== 'all' && t.assigneeId !== assignee) return false;
    // Product filter
    if (product !== 'all' && t.productId !== product) return false;
    // Month filter — include task if it overlaps the selected month
    if (month !== 'all') {
      const monthStart = month + '-01';
      const monthEnd = month + '-31';
      if (!t.startDate || !t.endDate) return false;
      if (t.startDate > monthEnd) return false;
      if (t.endDate < monthStart) return false;
    }
    // Hide Completed filter
    if (hideCompleted && t.status === 'COMPLETED') return false;

    return true;
  });

  // Apply sorting
  if (activeSortState.column) {
    const col = activeSortState.column;
    const dir = activeSortState.direction === 'asc' ? 1 : -1;

    // Build lookup Maps once so each sort comparison is O(1) instead of O(n)
    const assigneeMap = new Map(teamArray.map(m => [m.id, m.name]));
    const productMap = new Map(availableProducts.map(p => [p.id, p.name]));

    filteredTasks.sort((a, b) => {
      let valA, valB;
      
      switch (col) {
        case 'name':
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
          break;
        case 'category':
          valA = (a.category || '').toLowerCase();
          valB = (b.category || '').toLowerCase();
          break;
        case 'assignee':
          valA = assigneeMap.get(a.assigneeId) || '';
          valB = assigneeMap.get(b.assigneeId) || '';
          break;
        case 'product':
          valA = productMap.get(a.productId) || '';
          valB = productMap.get(b.productId) || '';
          break;
        case 'startDate':
          valA = a.startDate || '';
          valB = b.startDate || '';
          break;
        case 'endDate':
          valA = a.endDate || '';
          valB = b.endDate || '';
          break;
        case 'hours':
          valA = a.totalHours || 0;
          valB = b.totalHours || 0;
          break;
        case 'status':
          valA = (a.status || 'SCHEDULED').toLowerCase();
          valB = (b.status || 'SCHEDULED').toLowerCase();
          break;
        default:
          valA = 0;
          valB = 0;
      }
      
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });
  }

  return filteredTasks;
}

function _capRenderTaskRows(filteredTasks, teamArray, availableProducts, canEditFlag, dept) {
  const ME_CATS = ['NPI', 'Improvement', 'Tendering', 'Support', 'Other'];
  const editingId = capTaskEditingId[dept] || null
  const teamMap = new Map(teamArray.map(m => [m.id, m.name]));
  const productMap = new Map(availableProducts.map(p => [p.id, p.name]));

  let rows = '';
  filteredTasks.forEach(task => {
    const today = new Date(); today.setHours(0,0,0,0);
    const startD = new Date(task.startDate || ''); startD.setHours(0,0,0,0);
    const isOverdue = task.status === 'SCHEDULED' && task.startDate && startD <= today;
    const rowUrgencyClass = isOverdue ? 'batch-row-overdue' : '';
    const disabledRowClass = task.isDisabled === true ? ' me-task-row-disabled' : '';

    if (editingId === task.id) {
      // ── EDIT ROW ──────────────────────────────────────────
      const catOpts = ME_CATS.map(c => `<option value="${c}" ${task.category === c ? 'selected' : ''}>${c}</option>`).join('');
      const memOpts = '<option value="">Unassigned</option>' + teamArray.map(m => `<option value="${m.id}" ${task.assigneeId === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
      const prodOpts = '<option value="">— No Product</option>' + availableProducts.map(p => `<option value="${p.id}" ${task.productId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
      const statusOpts = ['SCHEDULED', 'STARTED', 'COMPLETED'].map(s =>
        `<option value="${s}"${task.status === s ? ' selected' : ''}>${s[0] + s.slice(1).toLowerCase()}</option>`
      ).join('');
      rows += `
        <tr class="me-task-row ${rowUrgencyClass}${disabledRowClass}" data-task-id="${esc(task.id)}" style="background-color:var(--row-highlight-amber,#fffbeb);outline:2px solid var(--chart-amber-lt,#fbbf24);outline-offset:-2px;">
          <td><input name="task_name" data-task-field="name" value="${esc(task.name)}" placeholder="Task name" style="width:100%;"></td>
          <td><select name="task_category" data-task-field="category">${catOpts}</select></td>
          <td><select name="task_assigneeId" data-task-field="assigneeId">${memOpts}</select></td>
          <td><select name="task_productId" data-task-field="productId">${prodOpts}</select></td>
          <td><input type="date" name="task_startDate" data-task-field="startDate" value="${task.startDate || ''}"></td>
          <td><input type="date" name="task_endDate" data-task-field="endDate" value="${task.endDate || ''}"></td>
          <td><select name="task_status" data-task-field="status">${statusOpts}</select></td>
          <td style="text-align:center;"><input type="checkbox" name="task_isDisabled" data-task-field="isDisabled" aria-label="Disable task from calculations" style="width:14px;height:14px;" ${task.isDisabled === true ? 'checked' : ''}></td>
          <td><input type="number" name="task_totalHours" data-task-field="totalHours" value="${task.totalHours || 0}" step="0.5" style="width:70px;"></td>
          <td style="text-align:center;display:flex;gap:4px;justify-content:center;">
            <button class="btn-del" title="Save" data-cap-action="cap-task-save-edit" data-task-id="${esc(task.id)}">✓</button>
            <button class="btn-del" title="Cancel" data-cap-action="cap-task-cancel-edit">✕</button>
          </td>
        </tr>`;
    } else {
      // ── READ-ONLY ROW ─────────────────────────────────────
      const assigneeName = teamMap.get(task.assigneeId) || '—';
      const productName = productMap.get(task.productId) || '—';
      const statusLabel = task.status ? task.status[0] + task.status.slice(1).toLowerCase() : '—';
      const overdueBadge = isOverdue ? '<div class="batch-due-badge batch-overdue">⚠ Overdue</div>' : '';
      const disabledBadge = task.isDisabled === true ? '<div class="batch-due-badge" style="background:var(--bg-soft);color:var(--muted);border-color:var(--line);">Disabled from calculations</div>' : '';
      rows += `
        <tr class="me-task-row ${rowUrgencyClass}${disabledRowClass}" data-task-id="${esc(task.id)}">
          <td>${esc(task.name)}</td>
          <td>${esc(task.category)}</td>
          <td>${esc(assigneeName)}</td>
          <td>${esc(productName)}</td>
          <td>${task.startDate || '—'}</td>
          <td>${task.endDate || '—'}</td>
          <td><span class="badge badge-${task.status}">${statusLabel}</span>${overdueBadge}</td>
          <td style="text-align:center;"><input type="checkbox" name="task_toggle_disabled" style="width:14px;height:14px;" aria-label="Disable task from calculations" data-cap-action="cap-task-toggle-disabled" ${task.isDisabled === true ? 'checked' : ''}>${disabledBadge}</td>
          <td>${(task.totalHours || 0).toFixed(1)}</td>
          <td style="text-align:center;display:flex;gap:4px;justify-content:center;">
            ${canEditFlag ? `<button class="btn-del" title="Edit task" data-cap-action="cap-task-start-edit" data-task-id="${esc(task.id)}">✏️</button>
            <button class="me-del-btn" title="Delete task" data-cap-action="cap-task-del" data-task-id="${esc(task.id)}">✕</button>` : ''}
          </td>
        </tr>`;
    }
  });

  return rows;
}

function _capRenderTasksKPI(filteredTasks, dept) {
  const ME_CATS = ['NPI', 'Improvement', 'Tendering', 'Support', 'Other'];
  
  let totalHoursValue = 0;
  filteredTasks.forEach(t => { totalHoursValue += t.totalHours || 0; });
  const totalHours = totalHoursValue.toFixed(1);

  const taskCount = filteredTasks.length;
  const unassignedCount = filteredTasks.filter(t => !t.assigneeId).length;
  const avgHours = taskCount > 0 ? (totalHoursValue / taskCount).toFixed(1) : '0';

  const hoursByCategory = {};
  ME_CATS.forEach(cat => {
    hoursByCategory[cat] = filteredTasks.filter(t => t.category === cat)
      .reduce((sum, t) => sum + (t.totalHours || 0), 0).toFixed(1);
  });
  const topCategory = ME_CATS.reduce((top, cat) =>
    parseFloat(hoursByCategory[cat]) > parseFloat(hoursByCategory[top]) ? cat : top
  );

  return `
    <div class="me-kpi" style="border-left: 4px solid var(--green);">
      <div class="me-kpi-value">${totalHours}</div>
      <div class="me-kpi-label">Total Hours</div>
      <div class="me-kpi-month">${filteredTasks.length} tasks</div>
    </div>
    <div class="me-kpi" style="border-left: 4px solid var(--blue);">
      <div class="me-kpi-value">${taskCount}</div>
      <div class="me-kpi-label">Tasks</div>
      <div class="me-kpi-month">filtered</div>
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
      <div class="me-kpi-month">filtered tasks</div>
    </div>`;
}

function _capRenderTasksTable(filteredTasks, teamArray, availableProducts, canEditFlag, dept) {
  const rows = _capRenderTaskRows(filteredTasks, teamArray, availableProducts, canEditFlag, dept);
  
  return `
    <table class="me-tbl">
      <thead><tr>
        <th style="width:150px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="name" title="Sort by name">${capGetSortIcon('name', dept)} Task Name</th>
        <th style="width:110px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="category" title="Sort by category">${capGetSortIcon('category', dept)} Category</th>
        <th style="width:130px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="assignee" title="Sort by assignee">${capGetSortIcon('assignee', dept)} Assignee</th>
        <th style="width:130px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="product" title="Sort by product">${capGetSortIcon('product', dept)} Product</th>
        <th style="width:110px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="startDate" title="Sort by start date">${capGetSortIcon('startDate', dept)} Start Date</th>
        <th style="width:110px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="endDate" title="Sort by end date">${capGetSortIcon('endDate', dept)} End Date</th>
        <th style="width:120px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="status" title="Sort by status">${capGetSortIcon('status', dept)} Status</th>
        <th style="width:90px">Disable</th>
        <th style="width:80px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="hours" title="Sort by hours">${capGetSortIcon('hours', dept)} Hours</th>
        <th style="width:60px"></th>
      </tr></thead>
      <tbody>
        ${rows || `<tr><td colspan="10"><div style="text-align:center;padding:40px">
            <div style="color:var(--muted);margin-bottom:12px">No tasks match the current filters</div>
            ${canEditFlag ? `<button class="btn btn-primary btn-sm" data-cap-action="cap-task-add">＋ Add Task</button>` : ''}
          </div></td></tr>`}
      </tbody>
    </table>`;
}

export function capRenderTasksTab(tasksArray, teamArray, availableProducts, department, filters, sortState, canEditFlag) {
  availableProducts = availableProducts || [];
  const ME_CATS = ['NPI', 'Improvement', 'Tendering', 'Support', 'Other'];
  const pageTasks = Array.isArray(tasksArray) ? tasksArray : [];
  const dept = department || 'ME';
  const activeFilters = filters || capTasksFilters[dept] || {}
  const activeSortState = sortState || capTasksSort[dept] || { column: '', direction: 'asc' }

  const filteredTasks = _capComputeFilteredTasks(pageTasks, activeFilters, activeSortState, teamArray, availableProducts);
  
  let totalHoursValue = 0;
  filteredTasks.forEach(t => { totalHoursValue += t.totalHours || 0; });
  const totalHours = totalHoursValue.toFixed(1);
  
  const taskCount = filteredTasks.length;
  const unassignedCount = filteredTasks.filter(t => !t.assigneeId).length;
  const avgHours = taskCount > 0 ? (totalHoursValue / taskCount).toFixed(1) : '0';

  const hoursByCategory = {};
  ME_CATS.forEach(cat => {
    hoursByCategory[cat] = filteredTasks.filter(t => t.category === cat)
      .reduce((sum, t) => sum + (t.totalHours || 0), 0).toFixed(1);
  });
  const topCategory = ME_CATS.reduce((top, cat) =>
    parseFloat(hoursByCategory[cat]) > parseFloat(hoursByCategory[top]) ? cat : top
  );

  const rows = _capRenderTaskRows(filteredTasks, teamArray, availableProducts, canEditFlag, dept);

  // Build filter options - use correct filter state
  const currentFilters = activeFilters;
  
  // Build month options from the full unfiltered task list date ranges
  const _monthSet = new Set();
  pageTasks.forEach(t => {
    if (t.startDate) _monthSet.add(t.startDate.substring(0, 7));
    if (t.endDate) _monthSet.add(t.endDate.substring(0, 7));
  });
  const _monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const _monthsSorted = Array.from(_monthSet).sort();
  let _allMonths = [];
  if (_monthsSorted.length) {
    let _cur = _monthsSorted[0];
    const _max = _monthsSorted[_monthsSorted.length - 1];
    while (_cur <= _max) {
      _allMonths.push(_cur);
      const [_y, _m] = _cur.split('-').map(Number);
      _cur = _m === 12 ? `${_y + 1}-01` : `${_y}-${String(_m + 1).padStart(2, '0')}`;
    }
  }
  const monthOpts = '<option value="all" ' + (currentFilters.month === 'all' ? 'selected' : '') + '>All Months</option>' +
    _allMonths.map(ym => {
      const [_y, _m] = ym.split('-');
      const label = _monthNames[parseInt(_m, 10) - 1] + ' ' + _y;
      return `<option value="${ym}" ${currentFilters.month === ym ? 'selected' : ''}>${label}</option>`;
    }).join('');

  const catOpts = '<option value="all" ' + ((currentFilters.category === 'all') ? 'selected' : '') + '>All Categories</option>' +
    ME_CATS.map(c => `<option value="${c}" ${currentFilters.category === c ? 'selected' : ''}>${c}</option>`).join('');

  const assigneeOpts = '<option value="all" ' + ((currentFilters.assignee === 'all') ? 'selected' : '') + '>All Assignees</option>' +
    teamArray.map(m => `<option value="${m.id}" ${currentFilters.assignee === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('');

  const productOpts = '<option value="all" ' + ((currentFilters.product === 'all') ? 'selected' : '') + '>All Products</option>' +
    availableProducts.map(p => `<option value="${p.id}" ${currentFilters.product === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');

  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-kpi-value">${totalHours}</div>
          <div class="me-kpi-label">Total Hours</div>
          <div class="me-kpi-month">${filteredTasks.length} tasks</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-kpi-value">${taskCount}</div>
          <div class="me-kpi-label">Tasks</div>
          <div class="me-kpi-month">filtered</div>
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
          <div class="me-kpi-month">filtered tasks</div>
        </div>
      </div>

      <div class="me-card">
        <div class="me-card-head">
          <span class="me-card-title">TASKS</span>
          <span style="font-size:12px;color:var(--muted)">${totalHours} total hours</span>
        </div>
        <div class="me-card-body me-card-body-gutter">
          <div class="me-filters" style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
            <div class="filter-chip">
              <input type="text" autocomplete="off" class="me-filter-input" placeholder="🔍 Search tasks..." value="${esc(currentFilters.search || '')}"
                data-cap-action="cap-task-search"
                style="flex:1;min-width:180px;padding:6px 10px;border:1px solid var(--line);border-radius:4px;font-size:13px;">
              ${currentFilters.search ? `<button class="filter-clear" data-cap-action="cap-task-clear-search" title="Clear search">×</button>` : ''}
            </div>
            <div class="filter-chip">
              <select autocomplete="off" class="me-filter-select" data-cap-action="cap-task-filter-category"
                style="min-width:130px;padding:6px 8px;border:1px solid var(--line);border-radius:4px;font-size:13px;">
                ${catOpts}
              </select>
              ${currentFilters.category && currentFilters.category !== 'all' ? `<button class="filter-clear" data-cap-action="cap-task-clear-category" title="Clear category filter">×</button>` : ''}
            </div>
            <div class="filter-chip">
              <select autocomplete="off" class="me-filter-select" data-cap-action="cap-task-filter-assignee"
                style="min-width:140px;padding:6px 8px;border:1px solid var(--line);border-radius:4px;font-size:13px;">
                ${assigneeOpts}
              </select>
              ${currentFilters.assignee && currentFilters.assignee !== 'all' ? `<button class="filter-clear" data-cap-action="cap-task-clear-assignee" title="Clear assignee filter">×</button>` : ''}
            </div>
            <div class="filter-chip">
              <select autocomplete="off" class="me-filter-select" data-cap-action="cap-task-filter-product"
                style="min-width:140px;padding:6px 8px;border:1px solid var(--line);border-radius:4px;font-size:13px;">
                ${productOpts}
              </select>
              ${currentFilters.product && currentFilters.product !== 'all' ? `<button class="filter-clear" data-cap-action="cap-task-clear-product" title="Clear product filter">×</button>` : ''}
            </div>
            <div class="filter-chip">
              <select autocomplete="off" class="me-filter-select" data-cap-action="cap-task-filter-month"
                style="min-width:120px;padding:6px 8px;border:1px solid var(--line);border-radius:4px;font-size:13px;">
                ${monthOpts}
              </select>
              ${currentFilters.month && currentFilters.month !== 'all' ? `<button class="filter-clear" data-cap-action="cap-task-clear-month" title="Clear month filter">×</button>` : ''}
            </div>
            <button class="btn ${currentFilters.hideCompleted ? 'btn-primary' : 'btn-ghost'} btn-sm" data-cap-action="cap-task-toggle-hide-completed"
              style="padding:6px 10px;font-size:13px;" title="Show or hide completed tasks">${currentFilters.hideCompleted ? 'Show Completed' : 'Hide Completed'}</button>
            <button class="btn btn-ghost btn-sm" data-cap-action="cap-task-clear-all-filters"
              style="padding:6px 10px;font-size:13px;" title="Clear all filters">Clear</button>
          </div>
        <div class="me-tbl-wrap">
          <table class="me-tbl">
            <thead><tr>
              <th style="width:150px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="name" title="Sort by name">${capGetSortIcon('name', dept)} Task Name</th>
              <th style="width:110px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="category" title="Sort by category">${capGetSortIcon('category', dept)} Category</th>
              <th style="width:130px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="assignee" title="Sort by assignee">${capGetSortIcon('assignee', dept)} Assignee</th>
              <th style="width:130px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="product" title="Sort by product">${capGetSortIcon('product', dept)} Product</th>
              <th style="width:110px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="startDate" title="Sort by start date">${capGetSortIcon('startDate', dept)} Start Date</th>
              <th style="width:110px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="endDate" title="Sort by end date">${capGetSortIcon('endDate', dept)} End Date</th>
              <th style="width:120px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="status" title="Sort by status">${capGetSortIcon('status', dept)} Status</th>
              <th style="width:90px">Disable</th>
              <th style="width:80px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="hours" title="Sort by hours">${capGetSortIcon('hours', dept)} Hours</th>
              <th style="width:60px"></th>
            </tr></thead>
            <tbody>
              ${canEditFlag ? (() => {
                const newCatOpts = ME_CATS.map(c => `<option value="${c}">${c}</option>`).join('');
                const newMemOpts = '<option value="">Unassigned</option>' + teamArray.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
                const newProdOpts = '<option value="">— No Product</option>' + availableProducts.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
                const newStatusOpts = ['SCHEDULED', 'STARTED', 'COMPLETED'].map(s => `<option value="${s}">${s[0] + s.slice(1).toLowerCase()}</option>`).join('');
                return `<tr class="me-task-row" data-cap-new-task="1" style="background-color:var(--row-highlight-blue,#eff6ff);outline:2px solid var(--chart-blue-lt,#93c5fd);outline-offset:-2px;">
                  <td><input name="task_name" data-task-field="name" placeholder="Task name" style="width:100%;"></td>
                  <td><select name="task_category" data-task-field="category">${newCatOpts}</select></td>
                  <td><select name="task_assigneeId" data-task-field="assigneeId">${newMemOpts}</select></td>
                  <td><select name="task_productId" data-task-field="productId">${newProdOpts}</select></td>
                  <td><input type="date" name="task_startDate" data-task-field="startDate"></td>
                  <td><input type="date" name="task_endDate" data-task-field="endDate"></td>
                  <td><select name="task_status" data-task-field="status">${newStatusOpts}</select></td>
                  <td></td>
                  <td><input type="number" name="task_totalHours" data-task-field="totalHours" placeholder="0" step="0.5" style="width:70px;"></td>
                  <td style="text-align:center;"><button class="btn-del" title="Add task" data-cap-action="cap-task-add">✓</button></td>
                </tr>`;
              })() : ''}
              ${rows || `<tr><td colspan="10"><div style="text-align:center;padding:40px;color:var(--muted);">No tasks match the current filters</div></td></tr>`}
            </tbody>
          </table>
        </div>
       </div>
    </div>
    </div>`;
}

/**
 * Render only the tasks results (KPIs + table) without the filters section.
 * Used for targeted re-renders during search/filter operations to avoid
 * re-rendering the entire tab and losing focus on input controls.
 */
export function capRenderTasksResults(tasksArray, teamArray, availableProducts, department, filters, sortState, canEditFlag) {
  availableProducts = availableProducts || [];
  const pageTasks = Array.isArray(tasksArray) ? tasksArray : [];
  const dept = department || 'ME';
  const activeFilters = filters || capTasksFilters[dept] || {}
  const activeSortState = sortState || capTasksSort[dept] || { column: '', direction: 'asc' }

  const filteredTasks = _capComputeFilteredTasks(pageTasks, activeFilters, activeSortState, teamArray, availableProducts);

  let totalHoursValue = 0;
  filteredTasks.forEach(t => { totalHoursValue += t.totalHours || 0; });
  const totalHours = totalHoursValue.toFixed(1);

  const kpiHtml = _capRenderTasksKPI(filteredTasks, dept);
  const tableHtml = _capRenderTasksTable(filteredTasks, teamArray, availableProducts, canEditFlag, dept);

  return `
    <div class="me-kpi-strip" id="capTasksKPI-${dept}">
      ${kpiHtml}
    </div>

    <div class="me-card" id="capTasksCard-${dept}">
      <div class="me-card-head">
        <span class="me-card-title">TASKS</span>
        <span style="font-size:12px;color:var(--muted)">${totalHours} total hours</span>
      </div>
      <div class="me-card-body me-card-body-gutter">
        <div class="me-tbl-wrap" id="capTasksTable-${dept}">
          ${tableHtml}
        </div>
        ${canEditFlag ? `<div class="me-add-row">
          <button class="btn btn-primary btn-sm" data-cap-action="cap-task-add">＋ Add Task</button>
        </div>` : ''}
      </div>
    </div>`;
}
