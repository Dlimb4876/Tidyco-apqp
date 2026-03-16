/* ============================================================
   me-tasks.js — Tasks Tab Rendering
   ============================================================ */

// Track filter state for tasks tab (separate for ME and PM)
window.meTasksFilters = {
  search: '',
  department: 'all',
  category: 'all',
  assignee: 'all',
  product: 'all',
  hideCompleted: localStorage.getItem('meTasksHideCompleted') === 'true'
};

window.pmTasksFilters = {
  search: '',
  category: 'all',
  assignee: 'all',
  product: 'all',
  hideCompleted: localStorage.getItem('pmTasksHideCompleted') === 'true'
};

// Track sort state for tasks tab (separate for ME and PM)
window.meTasksSort = { column: '', direction: 'asc' };
window.pmTasksSort = { column: '', direction: 'asc' };

window.meTasksSortBy = function(column, isPM = false) {
  const setState = isPM ? window.pmTasksSort : window.meTasksSort;
  
  if (setState.column === column) {
    // Toggle direction or clear sort
    setState.direction = setState.direction === 'asc' ? 'desc' : 'asc';
  } else {
    setState.column = column;
    setState.direction = 'asc';
  }
  
  if (isPM) {
    pmSetTab('tasks');
  } else {
    meSetTab('tasks');
  }
};

window.meGetSortIcon = function(column, isPM = false) {
  const sortState = isPM ? window.pmTasksSort : window.meTasksSort;
  if (sortState.column !== column) return '↕';
  return sortState.direction === 'asc' ? '↑' : '↓';
};

window.meRenderTasksTab = function(tasksArray, teamArray, availableProducts, isPM = false) {
  availableProducts = availableProducts || [];
  const ME_CATS = ['NPI', 'Improvement', 'Tendering', 'Support', 'Other'];
  const allTasks = typeof meDataGetTasks === 'function'
    ? meDataGetTasks()
    : (Array.isArray(tasksArray) ? tasksArray : []);
  const pageTasks = Array.isArray(tasksArray) ? tasksArray : allTasks;
  
  // Use separate filter state for PM vs ME
  const filters = isPM ? (window.pmTasksFilters || {}) : (window.meTasksFilters || {});

  // Apply filters
  let filteredTasks = pageTasks.filter(t => {
    const search = (filters.search || '').toLowerCase();
    const cat = filters.category || 'all';
    const assignee = filters.assignee || 'all';
    const product = filters.product || 'all';
    const hideCompleted = filters.hideCompleted || false;

    // Search filter
    if (search && !t.name.toLowerCase().includes(search)) return false;
    // Category filter
    if (cat !== 'all' && t.category !== cat) return false;
    // Assignee filter
    if (assignee !== 'all' && t.assigneeId !== assignee) return false;
    // Product filter
    if (product !== 'all' && t.productId !== product) return false;
    // Hide Completed filter
    if (hideCompleted && t.status === 'COMPLETED') return false;

    return true;
  });

  // Apply sorting
  const sortState = isPM ? window.pmTasksSort : window.meTasksSort;
  if (sortState.column) {
    const col = sortState.column;
    const dir = sortState.direction === 'asc' ? 1 : -1;
    
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
          valA = teamArray.find(m => m.id === a.assigneeId)?.name || '';
          valB = teamArray.find(m => m.id === b.assigneeId)?.name || '';
          break;
        case 'product':
          valA = availableProducts.find(p => p.id === a.productId)?.name || '';
          valB = availableProducts.find(p => p.id === b.productId)?.name || '';
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

  let rows = '';
  filteredTasks.forEach((task, idx) => {
    let taskIndex = -1;
    if (task && task.id) {
      taskIndex = allTasks.findIndex(t => t && t.id === task.id);
    }
    if (taskIndex < 0) {
      taskIndex = allTasks.indexOf(task);
    }
    if (taskIndex < 0) {
      taskIndex = idx;
    }

    // Detect if task is overdue (SCHEDULED status and startDate on or before today)
    const today = new Date(); today.setHours(0,0,0,0);
    const startD = new Date(task.startDate || ''); startD.setHours(0,0,0,0);
    const isOverdue = task.status === 'SCHEDULED' && task.startDate && startD <= today;
    const rowUrgencyClass = isOverdue ? 'batch-row-overdue' : '';

    const catOpts = ME_CATS.map(c => `<option value="${c}" ${task.category === c ? 'selected' : ''}>${c}</option>`).join('');
    const memOpts = '<option value="">Unassigned</option>' + teamArray.map(m => `<option value="${m.id}" ${task.assigneeId === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
    const prodOpts = '<option value="">— No Product</option>' + availableProducts.map(p => `<option value="${p.id}" ${task.productId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
    const statusOpts = '<option value="SCHEDULED" ' + (task.status === 'SCHEDULED' ? 'selected' : '') + '>Scheduled</option>' +
      '<option value="STARTED" ' + (task.status === 'STARTED' ? 'selected' : '') + '>Started</option>' +
      '<option value="COMPLETED" ' + (task.status === 'COMPLETED' ? 'selected' : '') + '>Completed</option>';

    const setTabFunc = isPM ? 'pmSetTab' : 'meSetTab';
    const debouncedSaveFunc = isPM ? 'pmDebouncedSave' : 'meDebouncedSave';

    rows += `
      <tr class="me-task-row ${rowUrgencyClass}" data-task-idx="${taskIndex}">
        <td><input name="cap_task_${taskIndex}_name" value="${esc(task.name)}" placeholder="new task" data-cap-action="cap-task-upd" data-field="name"></td>
        <td><select name="cap_task_${taskIndex}_category" data-cap-action="cap-task-upd" data-field="category">${catOpts}</select></td>
        <td><select name="cap_task_${taskIndex}_assigneeId" data-cap-action="cap-task-upd" data-field="assigneeId">${memOpts}</select></td>
        <td><select name="cap_task_${taskIndex}_productId" data-cap-action="cap-task-upd" data-field="productId">${prodOpts}</select></td>
        <td><input name="cap_task_${taskIndex}_startDate" type="date" value="${task.startDate || ''}" data-cap-action="cap-task-upd" data-field="startDate"></td>
        <td><input name="cap_task_${taskIndex}_endDate" type="date" value="${task.endDate || ''}" data-cap-action="cap-task-upd" data-field="endDate"></td>
        <td><select name="cap_task_${taskIndex}_status" data-cap-action="cap-task-status-upd">${statusOpts}</select>${isOverdue ? '<div class="batch-due-badge batch-overdue">⚠ Overdue</div>' : ''}</td>
        <td><input name="cap_task_${taskIndex}_totalHours" type="number" value="${task.totalHours || 0}" step="0.5" data-cap-action="cap-task-upd" data-field="totalHours"></td>
        <td style="text-align: center;">
          <button class="me-del-btn" data-cap-action="cap-task-del">✕</button>
        </td>
      </tr>`;
  });

  // Build filter options - use correct filter state for ME vs PM
  const currentFilters = filters;
  const filterPrefix = isPM ? 'pm' : 'me';
  const filterStateVar = isPM ? 'window.pmTasksFilters' : 'window.meTasksFilters';
  
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
        <div class="me-card-body">
          <div class="me-filters" style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
            <div class="filter-chip">
              <input type="text" class="me-filter-input" placeholder="🔍 Search tasks..." value="${esc(currentFilters.search || '')}"
                data-cap-action="cap-task-search"
                style="flex:1;min-width:180px;padding:6px 10px;border:1px solid var(--line);border-radius:4px;font-size:13px;">
              ${currentFilters.search ? `<button class="filter-clear" data-cap-action="cap-task-clear-search" title="Clear search">×</button>` : ''}
            </div>
            <div class="filter-chip">
              <select class="me-filter-select" data-cap-action="cap-task-filter-category"
                style="min-width:130px;padding:6px 8px;border:1px solid var(--line);border-radius:4px;font-size:13px;">
                ${catOpts}
              </select>
              ${currentFilters.category && currentFilters.category !== 'all' ? `<button class="filter-clear" data-cap-action="cap-task-clear-category" title="Clear category filter">×</button>` : ''}
            </div>
            <div class="filter-chip">
              <select class="me-filter-select" data-cap-action="cap-task-filter-assignee"
                style="min-width:140px;padding:6px 8px;border:1px solid var(--line);border-radius:4px;font-size:13px;">
                ${assigneeOpts}
              </select>
              ${currentFilters.assignee && currentFilters.assignee !== 'all' ? `<button class="filter-clear" data-cap-action="cap-task-clear-assignee" title="Clear assignee filter">×</button>` : ''}
            </div>
            <div class="filter-chip">
              <select class="me-filter-select" data-cap-action="cap-task-filter-product"
                style="min-width:140px;padding:6px 8px;border:1px solid var(--line);border-radius:4px;font-size:13px;">
                ${productOpts}
              </select>
              ${currentFilters.product && currentFilters.product !== 'all' ? `<button class="filter-clear" data-cap-action="cap-task-clear-product" title="Clear product filter">×</button>` : ''}
            </div>
            <button class="btn ${currentFilters.hideCompleted ? 'btn-primary' : 'btn-ghost'} btn-sm" data-cap-action="cap-task-toggle-hide-completed"
              style="padding:6px 10px;font-size:13px;" title="Show or hide completed tasks">${currentFilters.hideCompleted ? 'Show Completed' : 'Hide Completed'}</button>
            <button class="btn btn-ghost btn-sm" data-cap-action="cap-task-clear-all-filters"
              style="padding:6px 10px;font-size:13px;" title="Clear all filters">Clear</button>
          </div>
        <div class="me-tbl-wrap">
          <table class="me-tbl">
            <thead><tr>
              <th style="width:150px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="name" title="Sort by name">${meGetSortIcon('name', isPM)} Task Name</th>
              <th style="width:110px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="category" title="Sort by category">${meGetSortIcon('category', isPM)} Category</th>
              <th style="width:130px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="assignee" title="Sort by assignee">${meGetSortIcon('assignee', isPM)} Assignee</th>
              <th style="width:130px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="product" title="Sort by product">${meGetSortIcon('product', isPM)} Product</th>
              <th style="width:110px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="startDate" title="Sort by start date">${meGetSortIcon('startDate', isPM)} Start Date</th>
              <th style="width:110px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="endDate" title="Sort by end date">${meGetSortIcon('endDate', isPM)} End Date</th>
              <th style="width:120px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="status" title="Sort by status">${meGetSortIcon('status', isPM)} Status</th>
              <th style="width:80px;cursor:pointer;" data-cap-action="cap-task-sort" data-sort-key="hours" title="Sort by hours">${meGetSortIcon('hours', isPM)} Hours</th>
              <th style="width:60px"></th>
            </tr></thead>
            <tbody>
              ${rows || `<tr><td colspan="9"><div style="text-align:center;padding:40px">
                  <div style="color:var(--muted);margin-bottom:12px">No tasks match the current filters</div>
                  <button class="btn btn-primary btn-sm" data-cap-action="cap-task-add">＋ Add Task</button>
                </div></td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="me-add-row">
          <button class="btn btn-primary btn-sm" data-cap-action="cap-task-add">＋ Add Task</button>
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


