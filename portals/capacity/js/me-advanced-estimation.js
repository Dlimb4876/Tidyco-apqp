import { meDataState, meDataUpdateTask, meUUID } from './me-data.js';
import { meOnSave } from './me-capacity.js';

// ── Advanced Task Estimation Modal ─────────────────────────
export let meAdvancedEstimationState = {
  isOpen: false,
  taskIdx: null,
  activities: [],
  globalComplexityFactors: {
    riskLevel: 3,
    teamExperience: 3,
    technologyNovelty: 3
  },
  notes: ''
};

// ─────────────────────────────────────────────────────────────
// Open/Close Modal
// ─────────────────────────────────────────────────────────────

export function meOpenAdvancedEstimationModal(taskIdx) {
  if (taskIdx < 0 || taskIdx >= meDataState.tasks.length) {
    console.error('Invalid task index:', taskIdx);
    return;
  }

  const task = meDataState.tasks[taskIdx];

  // Load existing data if available
  if (task.advancedEstimation) {
    meAdvancedEstimationState.activities = JSON.parse(JSON.stringify(task.advancedEstimation.activities || []));
    meAdvancedEstimationState.globalComplexityFactors = JSON.parse(JSON.stringify(task.advancedEstimation.globalComplexityFactors || {
      riskLevel: 3,
      teamExperience: 3,
      technologyNovelty: 3
    }));
    meAdvancedEstimationState.notes = task.advancedEstimation.notes || '';
  } else {
    meAdvancedEstimationState.activities = [];
    meAdvancedEstimationState.globalComplexityFactors = {
      riskLevel: 3,
      teamExperience: 3,
      technologyNovelty: 3
    };
    meAdvancedEstimationState.notes = '';
  }

  meAdvancedEstimationState.taskIdx = taskIdx;
  meAdvancedEstimationState.isOpen = true;
  meRenderAdvancedEstimationModal();
};

export function meCloseAdvancedEstimationModal() {
  meAdvancedEstimationState.isOpen = false;
  const modal = document.getElementById('me-advanced-estimation-modal');
  if (modal) {
    modal.remove();
  }
};

// ─────────────────────────────────────────────────────────────
// Activity Management
// ─────────────────────────────────────────────────────────────

export function meAddActivity() {
  const activity = {
    id: meUUID(),
    name: 'New Activity',
    description: '',
    baseHours: 0,
    assignedTo: '',
    notes: ''
  };
  meAdvancedEstimationState.activities.push(activity);
  meRenderAdvancedEstimationModal();
};

export function meUpdateActivity(activityId, field, value) {
  const activity = meAdvancedEstimationState.activities.find(a => a.id === activityId);
  if (!activity) return;

  switch (field) {
    case 'name':
      activity.name = value.trim();
      break;
    case 'description':
      activity.description = value.trim();
      break;
    case 'baseHours':
      activity.baseHours = parseFloat(value) || 0;
      break;
    case 'assignedTo':
      activity.assignedTo = value || '';
      break;
    case 'notes':
      activity.notes = value.trim();
      break;
  }
  meRenderAdvancedEstimationModal();
};

export function meDeleteActivity(activityId) {
  const idx = meAdvancedEstimationState.activities.findIndex(a => a.id === activityId);
  if (idx !== -1) {
    meAdvancedEstimationState.activities.splice(idx, 1);
    meRenderAdvancedEstimationModal();
  }
};

// ─────────────────────────────────────────────────────────────
// Complexity Factor Management
// ─────────────────────────────────────────────────────────────

export function meUpdateComplexityFactor(factor, value) {
  const numValue = parseInt(value) || 3;
  meAdvancedEstimationState.globalComplexityFactors[factor] = Math.max(1, Math.min(5, numValue));
  meRenderAdvancedEstimationModal();
};

export function meUpdateEstimationNotes(value) {
  meAdvancedEstimationState.notes = value.trim();
};

// ─────────────────────────────────────────────────────────────
// Calculation Functions
// ─────────────────────────────────────────────────────────────

export function meCalculateComplexityMultiplier(factors) {
  // Average the three factors (each 1-5)
  const avgFactor = (factors.riskLevel + factors.teamExperience + factors.technologyNovelty) / 3;

  // Map 1-5 scale to 1.0-1.5x multiplier
  // 1 (low) = 1.0x, 5 (high) = 1.5x
  const multiplier = 1.0 + (avgFactor - 1) * 0.125;

  return Math.round(multiplier * 100) / 100;
};

export function meCalculateActivitySum() {
  return meAdvancedEstimationState.activities.reduce((sum, activity) => {
    return sum + (parseFloat(activity.baseHours) || 0);
  }, 0);
};

export function meCalculateTotalHours() {
  const activitySum = meCalculateActivitySum();
  const multiplier = meCalculateComplexityMultiplier(meAdvancedEstimationState.globalComplexityFactors);
  return Math.round((activitySum * multiplier) * 10) / 10; // Round to 1 decimal
};

// ─────────────────────────────────────────────────────────────
// Save & Submit
// ─────────────────────────────────────────────────────────────

export function meSaveAdvancedEstimation() {
  // Validation
  if (meAdvancedEstimationState.activities.length === 0) {
    alert('Please add at least one activity before saving');
    return;
  }

  const hasZeroHours = meAdvancedEstimationState.activities.some(a => parseFloat(a.baseHours) <= 0);
  if (hasZeroHours) {
    alert('All activities must have hours greater than 0');
    return;
  }

  const taskIdx = meAdvancedEstimationState.taskIdx;
  const totalHours = meCalculateTotalHours();

  // Create/update advancedEstimation object
  const advancedEstimation = {
    activities: JSON.parse(JSON.stringify(meAdvancedEstimationState.activities)),
    globalComplexityFactors: JSON.parse(JSON.stringify(meAdvancedEstimationState.globalComplexityFactors)),
    totalCalculatedHours: totalHours,
    notes: meAdvancedEstimationState.notes,
    lastUpdated: new Date().toISOString()
  };

  // Update task with new estimation data and calculated hours
  meDataUpdateTask(taskIdx, 'advancedEstimation', advancedEstimation);
  meDataUpdateTask(taskIdx, 'totalHours', totalHours);

  // Save to database
  meOnSave();

  // Close modal
  meCloseAdvancedEstimationModal();
};

export function meClearAdvancedEstimation() {
  if (confirm('Are you sure you want to clear all advanced estimation data? The task will revert to simple mode.')) {
    const taskIdx = meAdvancedEstimationState.taskIdx;
    meDataUpdateTask(taskIdx, 'advancedEstimation', null);
    meOnSave();
    meCloseAdvancedEstimationModal();
  }
};

// ─────────────────────────────────────────────────────────────
// Modal Rendering
// ─────────────────────────────────────────────────────────────

export function meRenderAdvancedEstimationModal() {
  if (!meAdvancedEstimationState.isOpen) return;

  const taskIdx = meAdvancedEstimationState.taskIdx;
  const task = meDataState.tasks[taskIdx];
  const activitySum = meCalculateActivitySum();
  const multiplier = meCalculateComplexityMultiplier(meAdvancedEstimationState.globalComplexityFactors);
  const totalHours = meCalculateTotalHours();

  // Remove existing modal if present
  const existing = document.getElementById('me-advanced-estimation-modal');
  if (existing) {
    existing.remove();
  }

  const html = `
    <div id="me-advanced-estimation-modal" class="me-detail-modal" style="display: flex;">
      <div class="me-modal-content">
        <div class="me-modal-header">
          <h2>Advanced Estimation: ${escapeHtml(task.name)}</h2>
          <button class="me-modal-close" onclick="meCloseAdvancedEstimationModal()">✕</button>
        </div>

        <div class="me-modal-body">
          <!-- Section 1: Task Breakdown -->
          <div class="me-estimation-section">
            <h3>📋 Task Breakdown</h3>
            <div id="me-activities-list" class="me-activities-list">
              ${meAdvancedEstimationState.activities.map((activity, idx) => `
                <div class="me-activity-item" data-activity-id="${activity.id}">
                  <div class="me-activity-row">
                    <input type="text" class="me-input-small" placeholder="task description" value="${escapeHtml(activity.name)}" onchange="meUpdateActivity('${activity.id}', 'name', this.value)">
                    <input type="number" class="me-input-hours" placeholder="Est. hours" value="${activity.baseHours}" step="0.1" onchange="meUpdateActivity('${activity.id}', 'baseHours', this.value)">
                    <select class="me-input-assign" onchange="meUpdateActivity('${activity.id}', 'assignedTo', this.value)">
                      <option value="">Assign to...</option>
                      ${meDataState.team.map(member => `<option value="${member.id}" ${activity.assignedTo === member.id ? 'selected' : ''}>${escapeHtml(member.name)}</option>`).join('')}
                    </select>
                    <button class="me-btn-delete" onclick="meDeleteActivity('${activity.id}')">🗑️</button>
                  </div>
                </div>
              `).join('')}
            </div>
            <button class="me-btn-primary" onclick="meAddActivity()">＋ Add Activity</button>
          </div>

          <!-- Section 2: Complexity Factors -->
          <div class="me-estimation-section">
            <h3>⚠️ Complexity Factors</h3>
            <div class="me-complexity-factors">
              <div class="me-factor-item">
                <label>Risk Level</label>
                <input type="range" min="1" max="5" value="${meAdvancedEstimationState.globalComplexityFactors.riskLevel}" onchange="meUpdateComplexityFactor('riskLevel', this.value)" class="me-slider">
                <span class="me-factor-value">${meAdvancedEstimationState.globalComplexityFactors.riskLevel}/5</span>
              </div>
              <div class="me-factor-item">
                <label>Team Experience</label>
                <input type="range" min="1" max="5" value="${meAdvancedEstimationState.globalComplexityFactors.teamExperience}" onchange="meUpdateComplexityFactor('teamExperience', this.value)" class="me-slider">
                <span class="me-factor-value">${meAdvancedEstimationState.globalComplexityFactors.teamExperience}/5</span>
              </div>
              <div class="me-factor-item">
                <label>Technology Novelty</label>
                <input type="range" min="1" max="5" value="${meAdvancedEstimationState.globalComplexityFactors.technologyNovelty}" onchange="meUpdateComplexityFactor('technologyNovelty', this.value)" class="me-slider">
                <span class="me-factor-value">${meAdvancedEstimationState.globalComplexityFactors.technologyNovelty}/5</span>
              </div>
            </div>
            <p class="me-complexity-note">Complexity Multiplier: <strong>${multiplier.toFixed(2)}x</strong></p>
          </div>

          <!-- Section 3: Summary -->
          <div class="me-estimation-section">
            <h3>📊 Summary</h3>
            <div class="me-summary-item">
              <label>Sum of Activity Hours:</label>
              <span class="me-summary-value">${activitySum.toFixed(1)} h</span>
            </div>
            <div class="me-summary-item">
              <label>Complexity Multiplier:</label>
              <span class="me-summary-value">${multiplier.toFixed(2)}x</span>
            </div>
            <div class="me-summary-highlight">
              <label>Total Estimated Hours:</label>
              <span class="me-summary-total">${totalHours.toFixed(1)} h</span>
            </div>
            <textarea class="me-input-full" placeholder="Additional notes" onchange="meUpdateEstimationNotes(this.value)">${escapeHtml(meAdvancedEstimationState.notes)}</textarea>
          </div>
        </div>

        <div class="me-modal-footer">
          <button class="me-btn-secondary" onclick="meCloseAdvancedEstimationModal()">Cancel</button>
          <button class="me-btn-danger" onclick="meClearAdvancedEstimation()" title="Revert to simple estimation mode">Clear Advanced Data</button>
          <button class="me-btn-primary" onclick="meSaveAdvancedEstimation()">💾 Save & Use Estimate</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  // Add event listeners for real-time updates
  const modal = document.getElementById('me-advanced-estimation-modal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        meCloseAdvancedEstimationModal();
      }
    });
  }
};

// ─────────────────────────────────────────────────────────────
// Utility: HTML escape for safety
// ─────────────────────────────────────────────────────────────

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
