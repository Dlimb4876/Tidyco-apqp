// ME Team Tab - Render Component

/**
 * Render team management table
 * @param {Array} teamArray Team members
 * @param {Function} onUpdate Callback: onUpdate(idx, field, value)
 * @param {Function} onAdd Callback: onAdd()
 * @param {Function} onDelete Callback: onDelete(idx)
 * @returns {string} HTML
 */
export function meRenderTeam(teamArray, onUpdate, onAdd, onDelete) {
  const totalCapacity = teamArray.reduce((sum, member) => {
    const hours = (member.hoursPerWeek || 37.5) * ((member.utilisation || 80) / 100);
    return sum + hours;
  }, 0).toFixed(1);

  let html = `
    <div class="me-team-container">
      <div class="me-team-header">
        <div class="me-kpi">
          <div class="me-kpi-value">${totalCapacity}</div>
          <div class="me-kpi-label">hours/week available</div>
        </div>
        <button class="btn btn-primary" onclick="meOnTeamAdd()">+ Add Engineer</button>
      </div>

      <table class="me-table">
        <colgroup>
          <col style="width: 200px;">
          <col style="width: 150px;">
          <col style="width: 120px;">
          <col style="width: 120px;">
          <col style="width: 140px;">
          <col style="width: 60px;">
        </colgroup>
        <thead>
          <tr>
            <th>Name</th>
            <th>Job Title</th>
            <th>Hours/Week</th>
            <th>Utilisation %</th>
            <th>Effective h/wk</th>
            <th></th>
          </tr>
        </thead>
        <tbody>`;

  if (teamArray.length === 0) {
    html += `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: var(--muted);">
          No team members added. Click "Add Engineer" to get started.
        </td>
      </tr>`;
  } else {
    teamArray.forEach((member, idx) => {
      const effective = ((member.hoursPerWeek || 37.5) * ((member.utilisation || 80) / 100)).toFixed(1);
      html += `
        <tr>
          <td class="cell-edit" data-field="name" data-idx="${idx}" data-current="${esc(member.name)}">
            ${esc(member.name)}
          </td>
          <td class="cell-edit" data-field="jobTitle" data-idx="${idx}" data-current="${esc(member.jobTitle || '')}">
            ${esc(member.jobTitle || '—')}
          </td>
          <td class="cell-edit" data-field="hoursPerWeek" data-idx="${idx}" data-current="${member.hoursPerWeek}">
            ${(member.hoursPerWeek || 37.5).toFixed(1)}
          </td>
          <td class="cell-edit" data-field="utilisation" data-idx="${idx}" data-current="${member.utilisation}">
            ${(member.utilisation || 80).toFixed(0)}%
          </td>
          <td style="font-weight: bold;">
            ${effective}
          </td>
          <td style="text-align: center;">
            <button class="btn btn-icon" onclick="meOnTeamDelete(${idx})" title="Delete">×</button>
          </td>
        </tr>`;
    });
  }

  html += `
        </tbody>
      </table>
    </div>
  `;

  // Delayed event binding
  setTimeout(() => bindTeamCells(), 0);

  return html;
}

/**
 * Bind inline edit handlers for team cells
 */
function bindTeamCells() {
  const cells = document.querySelectorAll('.me-table .cell-edit');
  cells.forEach(cell => {
    cell.addEventListener('click', function () {
      const field = this.getAttribute('data-field');
      const idx = parseInt(this.getAttribute('data-idx'));
      const current = this.getAttribute('data-current');

      // Replace cell with input
      const input = document.createElement('input');
      input.type = field === 'utilisation' || field === 'hoursPerWeek' ? 'number' : 'text';
      input.value = current;
      input.style.width = '100%';
      input.style.padding = '4px';

      const onBlur = () => {
        const newValue = input.value.trim();
        if (newValue !== current) {
          meOnTeamUpdate(idx, field, newValue);
        }
        // Re-render will happen via meOnTeamUpdate callback
      };

      input.addEventListener('blur', onBlur);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') onBlur();
        if (e.key === 'Escape') {
          // Cancel edit
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
