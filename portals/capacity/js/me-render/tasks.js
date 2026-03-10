// ME Tasks Tab - Render Component

import { ME_TASK_CATEGORIES } from '../me-utils/constants.js';

/**
 * Render tasks management table
 * @param {Array} tasksArray Tasks
 * @param {Array} teamArray Team members (for assignee dropdown)
 * @param {Function} onUpdate Callback: onUpdate(idx, field, value)
 * @param {Function} onAdd Callback: onAdd()
 * @param {Function} onDelete Callback: onDelete(idx)
 * @returns {string} HTML
 */
export function meRenderTasks(tasksArray, teamArray, onUpdate, onAdd, onDelete) {
  const totalHours = tasksArray.reduce((sum, task) => sum + (task.totalHours || 0), 0).toFixed(1);

  let html = `
    <div class="me-tasks-container">
      <div class="me-tasks-header">
        <div class="me-kpi">
          <div class="me-kpi-value">${totalHours}</div>
          <div class="me-kpi-label">total hours</div>
        </div>
        <button class="btn btn-primary" onclick="meOnTaskAdd()">+ Add Task</button>
      </div>

      <table class="me-table">
        <colgroup>
          <col style="width: 200px;">
          <col style="width: 120px;">
          <col style="width: 150px;">
          <col style="width: 110px;">
          <col style="width: 110px;">
          <col style="width: 100px;">
          <col style="width: 60px;">
        </colgroup>
        <thead>
          <tr>
            <th>Task Name</th>
            <th>Category</th>
            <th>Assignee</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Total Hours</th>
            <th></th>
          </tr>
        </thead>
        <tbody>`;

  if (tasksArray.length === 0) {
    html += `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--muted);">
          No tasks added. Click "Add Task" to define project work.
        </td>
      </tr>`;
  } else {
    tasksArray.forEach((task, idx) => {
      const assigneeName = teamArray.find(m => m.id === task.assigneeId)?.name || '—';
      const category = task.category || 'Other';

      html += `
        <tr>
          <td class="cell-edit" data-field="name" data-idx="${idx}" data-current="${esc(task.name)}">
            ${esc(task.name)}
          </td>
          <td class="cell-select" data-field="category" data-idx="${idx}" data-current="${category}">
            <select onchange="meOnTaskUpdate(${idx}, 'category', this.value)">
              ${ME_TASK_CATEGORIES.map(cat => `
                <option value="${cat}" ${category === cat ? 'selected' : ''}>${cat}</option>
              `).join('')}
            </select>
          </td>
          <td class="cell-select" data-field="assigneeId" data-idx="${idx}" data-current="${task.assigneeId}">
            <select onchange="meOnTaskUpdate(${idx}, 'assigneeId', this.value)">
              <option value="">— Unassigned —</option>
              ${teamArray.map(member => `
                <option value="${member.id}" ${task.assigneeId === member.id ? 'selected' : ''}>
                  ${esc(member.name)}
                </option>
              `).join('')}
            </select>
          </td>
          <td class="cell-edit" data-field="startDate" data-idx="${idx}" data-current="${task.startDate}">
            ${task.startDate}
          </td>
          <td class="cell-edit" data-field="endDate" data-idx="${idx}" data-current="${task.endDate}">
            ${task.endDate}
          </td>
          <td class="cell-edit" data-field="totalHours" data-idx="${idx}" data-current="${task.totalHours}">
            ${(task.totalHours || 0).toFixed(1)}
          </td>
          <td style="text-align: center;">
            <button class="btn btn-icon" onclick="meOnTaskDelete(${idx})" title="Delete">×</button>
          </td>
        </tr>`;
    });
  }

  html += `
        </tbody>
      </table>
    </div>
  `;

  // Delayed event binding for editable cells
  setTimeout(() => bindTaskCells(), 0);

  return html;
}

/**
 * Bind inline edit handlers for task cells
 */
function bindTaskCells() {
  const cells = document.querySelectorAll('.me-table .cell-edit');
  cells.forEach(cell => {
    cell.addEventListener('click', function () {
      // Skip if already has input
      if (this.querySelector('input')) return;

      const field = this.getAttribute('data-field');
      const idx = parseInt(this.getAttribute('data-idx'));
      const current = this.getAttribute('data-current');

      const input = document.createElement('input');
      input.type = field === 'totalHours' ? 'number' : 'date';
      input.value = current;
      input.style.width = '100%';
      input.style.padding = '4px';
      if (field === 'totalHours') input.step = '0.1';

      const onBlur = () => {
        const newValue = input.value.trim();
        if (newValue !== current) {
          meOnTaskUpdate(idx, field, newValue);
        }
      };

      input.addEventListener('blur', onBlur);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') onBlur();
        if (e.key === 'Escape') {
          if (typeof render === 'function') render();
        }
      });

      this.innerHTML = '';
      this.appendChild(input);
      input.focus();
      input.select();
    });
  });
}

/**
 * Escape HTML special characters
 */
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
