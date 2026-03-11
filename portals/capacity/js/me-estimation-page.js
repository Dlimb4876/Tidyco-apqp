/* ============================================================
   me-estimation-page.js — Advanced Task Estimation Subsystem

   Full-page subsystem for editing task estimations and activities.
   Replaces modal with dedicated page for smoother UX and partial DOM updates.
   ============================================================ */

// ─────────────────────────────────────────────────────────────
// Render the estimation page (full-page subsystem)
// ─────────────────────────────────────────────────────────────

window.meRenderEstimationPage = function(taskIdx, tasksArray, teamArray) {
  if (taskIdx < 0 || taskIdx >= tasksArray.length) {
    return '<div style="padding: 40px; color: var(--muted);">Invalid task</div>';
  }

  const task = tasksArray[taskIdx];

  // Load or initialize estimation state
  let activities = [];
  let globalComplexityFactors = {
    riskLevel: 3,
    teamExperience: 3,
    technologyNovelty: 3
  };
  let notes = '';

  if (task.advancedEstimation) {
    activities = JSON.parse(JSON.stringify(task.advancedEstimation.activities || []));
    globalComplexityFactors = JSON.parse(JSON.stringify(task.advancedEstimation.globalComplexityFactors || globalComplexityFactors));
    notes = task.advancedEstimation.notes || '';
  }

  // Calculate values
  const activitySum = activities.reduce((sum, a) => sum + (parseFloat(a.baseHours) || 0), 0);
  const multiplier = meCalculateEstimationComplexityMultiplier(globalComplexityFactors);
  const totalHours = Math.round((activitySum * multiplier) * 10) / 10;

  // Build activity rows HTML
  let activityRowsHtml = '';
  activities.forEach((activity, idx) => {
    const assigneeOptions = '<option value="">Unassigned</option>' +
      teamArray.map(m => `<option value="${m.id}" ${activity.assignedTo === m.id ? 'selected' : ''}>${escapeHtml(m.name)}</option>`).join('');

    activityRowsHtml += `
      <div class="me-activity-item" data-activity-idx="${idx}" data-activity-id="${activity.id}">
        <div class="me-activity-row">
          <input type="text" class="me-input-small me-act-name" placeholder="Task" value="${escapeHtml(activity.name)}" data-idx="${idx}">
          <input type="number" class="me-input-hours me-act-hours" placeholder="Est. hours" value="${activity.baseHours}" step="0.1" data-idx="${idx}">
          <select class="me-input-assign me-act-assign" data-idx="${idx}">
            ${assigneeOptions}
          </select>
          <button class="me-btn-delete" onclick="meEstimationDeleteActivity(${taskIdx}, '${activity.id}')">🗑️</button>
        </div>
      </div>
    `;
  });

  const html = `
    <div class="me-estimation-subsystem">
      <!-- Top Bar -->
      <div class="me-subsystem-topbar">
        <button class="btn btn-ghost btn-sm" onclick="meCloseEstimationSubsystem()">← Back to Tasks</button>
        <div>
          <div class="me-topbar-title">Advanced Estimation: ${escapeHtml(task.name)}</div>
          <div class="me-topbar-sub">Configure activity breakdown and complexity factors</div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="me-estimation-body">
        <!-- Section 1: Activity Breakdown -->
        <div class="me-estimation-section">
          <h3>📋 Activity Breakdown</h3>
          <div id="me-activities-list" class="me-activities-list">
            ${activityRowsHtml}
          </div>
          <button class="me-btn-primary" onclick="meEstimationAddActivity(${taskIdx})">＋ Add Activity</button>
        </div>

        <!-- Section 2: Complexity Factors -->
        <div class="me-estimation-section">
          <h3>⚠️ Complexity Factors</h3>
          <div class="me-complexity-factors">
            <div class="me-factor-item">
              <label>Risk Level</label>
              <input type="range" min="1" max="5" value="${globalComplexityFactors.riskLevel}" onchange="meEstimationUpdateComplexityFactor(${taskIdx}, 'riskLevel', this.value)" class="me-slider">
              <span class="me-factor-value">${globalComplexityFactors.riskLevel}/5</span>
            </div>
            <div class="me-factor-item">
              <label>Team Experience</label>
              <input type="range" min="1" max="5" value="${globalComplexityFactors.teamExperience}" onchange="meEstimationUpdateComplexityFactor(${taskIdx}, 'teamExperience', this.value)" class="me-slider">
              <span class="me-factor-value">${globalComplexityFactors.teamExperience}/5</span>
            </div>
            <div class="me-factor-item">
              <label>Technology Novelty</label>
              <input type="range" min="1" max="5" value="${globalComplexityFactors.technologyNovelty}" onchange="meEstimationUpdateComplexityFactor(${taskIdx}, 'technologyNovelty', this.value)" class="me-slider">
              <span class="me-factor-value">${globalComplexityFactors.technologyNovelty}/5</span>
            </div>
          </div>
          <p class="me-complexity-note">Complexity Multiplier: <strong id="me-multiplier-value">${multiplier.toFixed(2)}x</strong></p>
        </div>

        <!-- Section 3: Summary -->
        <div class="me-estimation-section">
          <h3>📊 Summary</h3>
          <div class="me-summary-item">
            <label>Sum of Activity Hours:</label>
            <span class="me-summary-value" id="me-activity-sum">${activitySum.toFixed(1)} h</span>
          </div>
          <div class="me-summary-item">
            <label>Complexity Multiplier:</label>
            <span class="me-summary-value" id="me-multiplier-display">${multiplier.toFixed(2)}x</span>
          </div>
          <div class="me-summary-highlight">
            <label>Total Estimated Hours:</label>
            <span class="me-summary-total" id="me-total-hours">${totalHours.toFixed(1)} h</span>
          </div>
          <textarea id="me-notes" class="me-input-full" placeholder="Additional notes">${escapeHtml(notes)}</textarea>
        </div>
      </div>

      <!-- Footer -->
      <div class="me-estimation-footer">
        <button class="me-btn-secondary" onclick="meCloseEstimationSubsystem()">Cancel</button>
        <button class="me-btn-danger" onclick="meEstimationClearData(${taskIdx})" title="Revert to simple estimation mode">Clear Advanced Data</button>
        <button class="me-btn-primary" onclick="meEstimationSave(${taskIdx})">💾 Save & Use Estimate</button>
      </div>
    </div>
  `;

  // After rendering, attach event listeners for live updates
  setTimeout(() => {
    meEstimationAttachEventListeners(taskIdx);
  }, 50);

  return html;
};

// ─────────────────────────────────────────────────────────────
// Event listeners for live updates (partial DOM updates)
// ─────────────────────────────────────────────────────────────

window.meEstimationAttachEventListeners = function(taskIdx) {
  const activitiesList = document.getElementById('me-activities-list');
  if (!activitiesList) return;

  // Activity name changes
  activitiesList.querySelectorAll('.me-act-name').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = e.target.dataset.idx;
      meEstimationUpdateActivityField(taskIdx, idx, 'name', e.target.value);
    });
  });

  // Activity hours changes
  activitiesList.querySelectorAll('.me-act-hours').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = e.target.dataset.idx;
      meEstimationUpdateActivityField(taskIdx, idx, 'baseHours', e.target.value);
      meEstimationUpdateSummary(taskIdx);
    });
  });

  // Activity assignee changes
  activitiesList.querySelectorAll('.me-act-assign').forEach(select => {
    select.addEventListener('change', (e) => {
      const idx = e.target.dataset.idx;
      meEstimationUpdateActivityField(taskIdx, idx, 'assignedTo', e.target.value);
    });
  });
};

// ─────────────────────────────────────────────────────────────
// Activity Management
// ─────────────────────────────────────────────────────────────

window.meEstimationAddActivity = function(taskIdx) {
  const task = meDataState.tasks[taskIdx];
  if (!task.advancedEstimation) {
    task.advancedEstimation = {
      activities: [],
      globalComplexityFactors: { riskLevel: 3, teamExperience: 3, technologyNovelty: 3 },
      notes: '',
      lastUpdated: new Date().toISOString()
    };
  }

  const activity = {
    id: meUUID(),
    name: 'New Activity',
    description: '',
    baseHours: 0,
    assignedTo: '',
    notes: ''
  };

  task.advancedEstimation.activities.push(activity);
  meRefreshCurrentTab();
};

window.meEstimationDeleteActivity = function(taskIdx, activityId) {
  const task = meDataState.tasks[taskIdx];
  if (task.advancedEstimation) {
    task.advancedEstimation.activities = task.advancedEstimation.activities.filter(a => a.id !== activityId);
    meRefreshCurrentTab();
  }
};

window.meEstimationUpdateActivityField = function(taskIdx, activityIdx, field, value) {
  const task = meDataState.tasks[taskIdx];
  if (!task.advancedEstimation || !task.advancedEstimation.activities[activityIdx]) return;

  const activity = task.advancedEstimation.activities[activityIdx];
  switch (field) {
    case 'name':
      activity.name = value.trim();
      break;
    case 'baseHours':
      activity.baseHours = parseFloat(value) || 0;
      break;
    case 'assignedTo':
      activity.assignedTo = value || '';
      break;
  }
};

// ─────────────────────────────────────────────────────────────
// Complexity Factors
// ─────────────────────────────────────────────────────────────

window.meEstimationUpdateComplexityFactor = function(taskIdx, factor, value) {
  const task = meDataState.tasks[taskIdx];
  if (!task.advancedEstimation) {
    task.advancedEstimation = {
      activities: [],
      globalComplexityFactors: { riskLevel: 3, teamExperience: 3, technologyNovelty: 3 },
      notes: '',
      lastUpdated: new Date().toISOString()
    };
  }

  const numValue = parseInt(value) || 3;
  task.advancedEstimation.globalComplexityFactors[factor] = Math.max(1, Math.min(5, numValue));

  // Update factor display
  const factorLabel = factor === 'riskLevel' ? 'Risk Level' :
                      factor === 'teamExperience' ? 'Team Experience' :
                      'Technology Novelty';
  const factorValues = document.querySelectorAll('.me-factor-value');
  for (const el of factorValues) {
    if (el.textContent.includes(`${numValue}/5`)) {
      // Found the right one, but we need to update all in order
      break;
    }
  }

  meEstimationUpdateSummary(taskIdx);
};

// ─────────────────────────────────────────────────────────────
// Summary Updates (Partial DOM updates, no full re-render)
// ─────────────────────────────────────────────────────────────

window.meEstimationUpdateSummary = function(taskIdx) {
  const task = meDataState.tasks[taskIdx];
  if (!task.advancedEstimation) return;

  const activities = task.advancedEstimation.activities || [];
  const complexityFactors = task.advancedEstimation.globalComplexityFactors || {};

  // Calculate values
  const activitySum = activities.reduce((sum, a) => sum + (parseFloat(a.baseHours) || 0), 0);
  const multiplier = meCalculateEstimationComplexityMultiplier(complexityFactors);
  const totalHours = Math.round((activitySum * multiplier) * 10) / 10;

  // Update summary values (partial DOM updates only)
  const sumEl = document.getElementById('me-activity-sum');
  const multEl = document.getElementById('me-multiplier-display');
  const multValueEl = document.getElementById('me-multiplier-value');
  const totalEl = document.getElementById('me-total-hours');

  if (sumEl) sumEl.textContent = activitySum.toFixed(1) + ' h';
  if (multEl) multEl.textContent = multiplier.toFixed(2) + 'x';
  if (multValueEl) multValueEl.textContent = multiplier.toFixed(2) + 'x';
  if (totalEl) totalEl.textContent = totalHours.toFixed(1) + ' h';
};

// ─────────────────────────────────────────────────────────────
// Calculations
// ─────────────────────────────────────────────────────────────

window.meCalculateEstimationComplexityMultiplier = function(factors) {
  const avgFactor = (factors.riskLevel + factors.teamExperience + factors.technologyNovelty) / 3;
  const multiplier = 1.0 + (avgFactor - 1) * 0.125;
  return Math.round(multiplier * 100) / 100;
};

// ─────────────────────────────────────────────────────────────
// Save / Clear / Cancel
// ─────────────────────────────────────────────────────────────

window.meEstimationSave = function(taskIdx) {
  const task = meDataState.tasks[taskIdx];

  // Validation
  if (!task.advancedEstimation || task.advancedEstimation.activities.length === 0) {
    alert('Please add at least one activity before saving');
    return;
  }

  const hasZeroHours = task.advancedEstimation.activities.some(a => parseFloat(a.baseHours) <= 0);
  if (hasZeroHours) {
    alert('All activities must have hours greater than 0');
    return;
  }

  // Update notes
  const notesEl = document.getElementById('me-notes');
  if (notesEl) {
    task.advancedEstimation.notes = notesEl.value.trim();
  }

  // Calculate total hours
  const activitySum = task.advancedEstimation.activities.reduce((sum, a) => sum + (parseFloat(a.baseHours) || 0), 0);
  const multiplier = meCalculateEstimationComplexityMultiplier(task.advancedEstimation.globalComplexityFactors);
  const totalHours = Math.round((activitySum * multiplier) * 10) / 10;

  // Update task
  task.advancedEstimation.totalCalculatedHours = totalHours;
  task.advancedEstimation.lastUpdated = new Date().toISOString();
  task.totalHours = totalHours;

  // Save to database
  meOnSave();

  // Close subsystem
  meCloseEstimationSubsystem();
};

window.meEstimationClearData = function(taskIdx) {
  if (confirm('Are you sure you want to clear all advanced estimation data? The task will revert to simple mode.')) {
    const task = meDataState.tasks[taskIdx];
    task.advancedEstimation = null;
    meOnSave();
    meCloseEstimationSubsystem();
  }
};

