/* ============================================================
   me-estimation-page.js — PERT Advanced Task Estimation

   Full-page subsystem for PERT-based three-point estimation.
   Uses Optimistic, Most Likely, Pessimistic with confidence factor.
   PERT Formula: (O + 4*ML + P) / 6
   ============================================================ */

// ─────────────────────────────────────────────────────────────
// Render the estimation page (PERT-based)
// ─────────────────────────────────────────────────────────────

window.meRenderEstimationPage = function(taskIdx, tasksArray, teamArray) {
  if (taskIdx < 0 || taskIdx >= tasksArray.length) {
    return '<div style="padding: 40px; color: var(--muted);">Invalid task</div>';
  }

  const task = tasksArray[taskIdx];

  // Load or initialize PERT estimation data
  let estimates = [];
  let confidenceLevel = 1.0; // 0.5 to 2.0 multiplier
  let notes = '';

  if (task.advancedEstimation && task.advancedEstimation.pertData) {
    estimates = JSON.parse(JSON.stringify(task.advancedEstimation.pertData.estimates || []));
    confidenceLevel = task.advancedEstimation.pertData.confidenceLevel || 1.0;
    notes = task.advancedEstimation.pertData.notes || '';
  }

  // Build PERT table rows
  let tableRowsHtml = '';
  estimates.forEach((est, idx) => {
    const assigneeOptions = '<option value="">Unassigned</option>' +
      teamArray.map(m => `<option value="${m.id}" ${est.assignedTo === m.id ? 'selected' : ''}>${escapeHtml(m.name)}</option>`).join('');

    // Calculate PERT Estimate: (O + 4*ML + P) / 6
    const O = parseFloat(est.optimistic) || 0;
    const ML = parseFloat(est.mostLikely) || 0;
    const P = parseFloat(est.pessimistic) || 0;
    const pertEst = (O + 4*ML + P) / 6;
    const stdDev = (P - O) / 6;

    // Final Estimate = PERT ± (stdDev * (confidenceLevel - 1.0))
    // confidenceLevel 1.0 = PERT, 0.5 = pessimistic, 2.0 = optimistic
    const finalEst = pertEst + (stdDev * (confidenceLevel - 1.0));

    tableRowsHtml += `
      <tr data-est-idx="${idx}">
        <td><input type="text" class="me-input-small me-est-name" placeholder="Task name" value="${escapeHtml(est.name)}" data-idx="${idx}"></td>
        <td>
          <select class="me-input-assign me-est-assign" data-idx="${idx}">
            ${assigneeOptions}
          </select>
        </td>
        <td><input type="number" class="me-input-hours me-est-optimistic" placeholder="0" value="${est.optimistic || ''}" step="0.1" data-idx="${idx}" title="Best-case scenario" style="text-align: center;"></td>
        <td><input type="number" class="me-input-hours me-est-mostlikely" placeholder="0" value="${est.mostLikely || ''}" step="0.1" data-idx="${idx}" title="Most probable outcome" style="text-align: center;"></td>
        <td><input type="number" class="me-input-hours me-est-pessimistic" placeholder="0" value="${est.pessimistic || ''}" step="0.1" data-idx="${idx}" title="Worst-case scenario" style="text-align: center;"></td>
        <td class="me-est-result" style="text-align: center; padding: 8px 4px;">${(O + 4*ML + P) / 6 > 0 ? ((O + 4*ML + P) / 6).toFixed(1) : '-'}</td>
        <td class="me-est-final" style="text-align: center; padding: 8px 4px; font-weight: bold;">${finalEst > 0 ? finalEst.toFixed(1) : '-'}</td>
        <td style="text-align: center; padding: 4px;"><button class="me-btn-delete" onclick="meEstimationDeleteRow(${taskIdx}, ${idx})">🗑️</button></td>
      </tr>
    `;
  });

  // Calculate total final estimate
  let totalFinal = 0;
  estimates.forEach(est => {
    const O = parseFloat(est.optimistic) || 0;
    const ML = parseFloat(est.mostLikely) || 0;
    const P = parseFloat(est.pessimistic) || 0;
    const pertEst = (O + 4*ML + P) / 6;
    const stdDev = (P - O) / 6;
    const finalEst = pertEst + (stdDev * (confidenceLevel - 1.0));
    totalFinal += finalEst;
  });

  // Build summary breakdown (per-estimate details)
  let summaryBreakdownHtml = '';
  estimates.forEach((est, idx) => {
    const O = parseFloat(est.optimistic) || 0;
    const ML = parseFloat(est.mostLikely) || 0;
    const P = parseFloat(est.pessimistic) || 0;
    const pertEst = (O + 4*ML + P) / 6;
    const stdDev = (P - O) / 6;
    const finalEst = pertEst + (stdDev * (confidenceLevel - 1.0));
    if (pertEst > 0) {
      summaryBreakdownHtml += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
          <span style="color: var(--ink); flex: 1;">${escapeHtml(est.name || 'Estimate')}</span>
          <span style="color: var(--muted); width: 60px; text-align: right; font-family: 'IBM Plex Mono', monospace;">${pertEst.toFixed(1)}h</span>
          <span style="color: var(--blue); width: 60px; text-align: right; font-family: 'IBM Plex Mono', monospace; font-weight: 600;">${finalEst.toFixed(1)}h</span>
        </div>
      `;
    }
  });

  const html = `
    <style>
      .me-est-optimistic::-webkit-outer-spin-button,
      .me-est-optimistic::-webkit-inner-spin-button,
      .me-est-mostlikely::-webkit-outer-spin-button,
      .me-est-mostlikely::-webkit-inner-spin-button,
      .me-est-pessimistic::-webkit-outer-spin-button,
      .me-est-pessimistic::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .me-est-optimistic[type=number],
      .me-est-mostlikely[type=number],
      .me-est-pessimistic[type=number] {
        -moz-appearance: textfield;
      }
    </style>
    <div class="me-estimation-subsystem">
      <!-- Top Bar -->
      <div class="me-subsystem-topbar">
        <button class="btn btn-ghost btn-sm" onclick="meCloseEstimationSubsystem()">← Back to Tasks</button>
        <div>
          <div class="me-topbar-title">PERT Estimation: ${escapeHtml(task.name)}</div>
          <div class="me-topbar-sub">Three-point estimation with confidence adjustment</div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="me-estimation-body">
        <!-- Summary & Confidence (50/50 Top Section) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
          <!-- Left: Estimate Summary -->
          <div class="me-estimation-section">
            <h3 style="margin-top: 0;">📊 Estimate Summary</h3>
            <div class="me-summary-highlight">
              <label>Total Final Estimate:</label>
              <span class="me-summary-total" id="me-total-final">${totalFinal.toFixed(1)} h</span>
            </div>
            <div style="background: #fafbfd; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; font-size: 12px; max-height: 240px; overflow-y: auto;">
              <div style="display: flex; justify-content: space-between; padding: 6px 0; margin-bottom: 8px; font-weight: 600; color: var(--muted); border-bottom: 2px solid #d1d5db; font-family: 'IBM Plex Mono', monospace;">
                <span>Task</span>
                <span style="width: 60px; text-align: right;">PERT</span>
                <span style="width: 60px; text-align: right;">Final</span>
              </div>
              ${summaryBreakdownHtml || '<div style="padding: 8px 0; color: var(--muted); text-align: center;">No estimates yet</div>'}
            </div>
          </div>

          <!-- Right: Confidence Level -->
          <div class="me-estimation-section">
            <h3 style="margin-top: 0;">🎯 Confidence Level</h3>
            <div class="me-factor-item">
              <label style="font-size: 12px; margin-bottom: 8px; display: block;">Risk Adjustment</label>
              <input type="range" min="0.5" max="2.0" value="${confidenceLevel}" step="0.1" onchange="meEstimationUpdateConfidence(${taskIdx}, this.value)" class="me-slider" id="me-confidence-slider">
              <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: var(--muted);">
                <span>Pessimistic (0.5)</span>
                <span id="me-confidence-display" style="color: var(--ink); font-weight: 600; font-family: 'IBM Plex Mono', monospace;">${confidenceLevel.toFixed(1)}</span>
                <span>Optimistic (2.0)</span>
              </div>
            </div>
            <div style="background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px; margin-top: 12px; font-size: 11px; color: #1e40af; line-height: 1.4;">
              <strong>Current:</strong> ${confidenceLevel < 1 ? 'Conservative (lower estimate)' : confidenceLevel > 1 ? 'Optimistic (higher estimate)' : 'Most Likely'}<br/>
              Adjusts all final estimates based on risk tolerance.
            </div>
          </div>
        </div>

        <!-- PERT Table -->
        <div class="me-estimation-section">
          <h3>📋 Three-Point Estimation</h3>
          <div class="me-tbl-wrap">
            <table class="me-tbl me-pert-table" style="width: 100%;">
              <thead>
                <tr>
                  <th style="width: 390px;">Task</th>
                  <th style="width: 100px;">Assignee</th>
                  <th style="width: 70px; text-align: center;" title="Optimistic (best case)">Optimistic</th>
                  <th style="width: 70px; text-align: center;" title="Most Likely (probable)">Most Likely</th>
                  <th style="width: 70px; text-align: center;" title="Pessimistic (worst case)">Pessimistic</th>
                  <th style="width: 70px; text-align: center;" title="PERT Formula: (O + 4*ML + P) / 6">PERT Est</th>
                  <th style="width: 70px; text-align: center;" title="Confidence-adjusted final estimate">Final Est</th>
                  <th style="width: 40px; text-align: center;">Del</th>
                </tr>
              </thead>
              <tbody id="me-pert-tbody">
                ${tableRowsHtml}
              </tbody>
            </table>
          </div>
          <button class="me-btn-primary" onclick="meEstimationAddRow(${taskIdx})" style="width: 100%; max-width: 810px;">＋ Add Task</button>
        </div>

        <!-- Notes -->
        <div class="me-estimation-section">
          <h3>📝 Notes</h3>
          <textarea id="me-notes" class="me-input-full" placeholder="Estimation notes...">${escapeHtml(notes)}</textarea>
        </div>
      </div>

      <!-- Footer -->
      <div class="me-estimation-footer" style="max-width: 810px; margin: 16px auto 0; padding: 12px; display: flex; gap: 8px; justify-content: flex-end;">
        <button class="me-btn-secondary" onclick="meCloseEstimationSubsystem()">Cancel</button>
        <button class="me-btn-danger" onclick="meEstimationClearData(${taskIdx})" title="Revert to simple estimation mode">Clear Advanced Data</button>
        <button class="me-btn-primary" onclick="meEstimationSave(${taskIdx})">💾 Save Estimate</button>
      </div>
    </div>
  `;

  // After rendering, attach event listeners
  setTimeout(() => {
    meEstimationAttachEventListeners(taskIdx);
  }, 50);

  return html;
};

// ─────────────────────────────────────────────────────────────
// Event listeners for PERT table updates
// ─────────────────────────────────────────────────────────────

window.meEstimationAttachEventListeners = function(taskIdx) {
  const tbody = document.getElementById('me-pert-tbody');
  if (!tbody) return;

  // Name changes
  tbody.querySelectorAll('.me-est-name').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      meEstimationUpdatePertField(taskIdx, idx, 'name', e.target.value);
    });
  });

  // Current estimate changes
  tbody.querySelectorAll('.me-est-current').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      meEstimationUpdatePertField(taskIdx, idx, 'estimate', parseFloat(e.target.value) || 0);
      meEstimationUpdateSummary(taskIdx);
    });
  });

  // Assignee changes
  tbody.querySelectorAll('.me-est-assign').forEach(select => {
    select.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      meEstimationUpdatePertField(taskIdx, idx, 'assignedTo', e.target.value);
    });
  });

  // Optimistic input changes
  tbody.querySelectorAll('.me-est-optimistic').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      meEstimationUpdatePertField(taskIdx, idx, 'optimistic', parseFloat(e.target.value) || 0);
      meEstimationUpdateSummary(taskIdx);
    });
  });

  // Most Likely input changes
  tbody.querySelectorAll('.me-est-mostlikely').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      meEstimationUpdatePertField(taskIdx, idx, 'mostLikely', parseFloat(e.target.value) || 0);
      meEstimationUpdateSummary(taskIdx);
    });
  });

  // Pessimistic input changes
  tbody.querySelectorAll('.me-est-pessimistic').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      meEstimationUpdatePertField(taskIdx, idx, 'pessimistic', parseFloat(e.target.value) || 0);
      meEstimationUpdateSummary(taskIdx);
    });
  });
};

// ─────────────────────────────────────────────────────────────
// PERT Estimate Management
// ─────────────────────────────────────────────────────────────

window.meEstimationAddRow = function(taskIdx) {
  const task = meDataState.tasks[taskIdx];
  if (!task.advancedEstimation) {
    task.advancedEstimation = {
      pertData: {
        estimates: [],
        confidenceLevel: 1.0,
        notes: '',
        lastUpdated: new Date().toISOString()
      }
    };
  }

  if (!task.advancedEstimation.pertData) {
    task.advancedEstimation.pertData = {
      estimates: [],
      confidenceLevel: 1.0,
      notes: '',
      lastUpdated: new Date().toISOString()
    };
  }

  const estimate = {
    id: meUUID(),
    name: 'New Estimate',
    estimate: 0,
    assignedTo: '',
    optimistic: 0,
    mostLikely: 0,
    pessimistic: 0
  };

  task.advancedEstimation.pertData.estimates.push(estimate);
  meRefreshCurrentTab();
};

window.meEstimationDeleteRow = function(taskIdx, estIdx) {
  const task = meDataState.tasks[taskIdx];
  if (task.advancedEstimation && task.advancedEstimation.pertData) {
    task.advancedEstimation.pertData.estimates.splice(estIdx, 1);
    meRefreshCurrentTab();
  }
};

window.meEstimationUpdatePertField = function(taskIdx, estIdx, field, value) {
  const task = meDataState.tasks[taskIdx];
  if (!task.advancedEstimation || !task.advancedEstimation.pertData || !task.advancedEstimation.pertData.estimates[estIdx]) {
    return;
  }

  const estimate = task.advancedEstimation.pertData.estimates[estIdx];
  estimate[field] = value;
};

// ─────────────────────────────────────────────────────────────
// Confidence Level Control
// ─────────────────────────────────────────────────────────────

window.meEstimationUpdateConfidence = function(taskIdx, value) {
  const task = meDataState.tasks[taskIdx];
  if (!task.advancedEstimation) {
    task.advancedEstimation = {
      pertData: {
        estimates: [],
        confidenceLevel: 1.0,
        notes: ''
      }
    };
  }

  if (!task.advancedEstimation.pertData) {
    task.advancedEstimation.pertData = {
      estimates: [],
      confidenceLevel: 1.0,
      notes: ''
    };
  }

  const numValue = Math.max(0.5, Math.min(2.0, parseFloat(value) || 1.0));
  task.advancedEstimation.pertData.confidenceLevel = numValue;

  // Update display
  const displayEl = document.getElementById('me-confidence-display');
  if (displayEl) displayEl.textContent = numValue.toFixed(1);

  meEstimationUpdateSummary(taskIdx);
};

// ─────────────────────────────────────────────────────────────
// Summary Updates (Partial DOM updates, no full re-render)
// ─────────────────────────────────────────────────────────────

window.meEstimationUpdateSummary = function(taskIdx) {
  const task = meDataState.tasks[taskIdx];
  if (!task.advancedEstimation || !task.advancedEstimation.pertData) return;

  const estimates = task.advancedEstimation.pertData.estimates || [];
  const confidenceLevel = task.advancedEstimation.pertData.confidenceLevel || 1.0;

  // Calculate totals
  let totalCurrent = 0, totalPert = 0, totalFinal = 0;

  estimates.forEach(est => {
    totalCurrent += parseFloat(est.estimate) || 0;

    const O = parseFloat(est.optimistic) || 0;
    const ML = parseFloat(est.mostLikely) || 0;
    const P = parseFloat(est.pessimistic) || 0;
    const pertEst = (O + 4*ML + P) / 6;
    const stdDev = (P - O) / 6;
    const finalEst = pertEst + (stdDev * (confidenceLevel - 1.0));

    totalPert += pertEst;
    totalFinal += finalEst;
  });

  // Update table row values
  const tbody = document.getElementById('me-pert-tbody');
  if (tbody) {
    estimates.forEach((est, idx) => {
      const O = parseFloat(est.optimistic) || 0;
      const ML = parseFloat(est.mostLikely) || 0;
      const P = parseFloat(est.pessimistic) || 0;
      const pertEst = (O + 4*ML + P) / 6;
      const stdDev = (P - O) / 6;
      const finalEst = pertEst + (stdDev * (confidenceLevel - 1.0));

      const row = tbody.querySelector(`tr[data-est-idx="${idx}"]`);
      if (row) {
        row.querySelector('.me-est-result').textContent = pertEst > 0 ? pertEst.toFixed(1) : '-';
        row.querySelector('.me-est-final').textContent = finalEst > 0 ? finalEst.toFixed(1) : '-';
      }
    });
  }

  // Update summary section
  const totalFinalEl = document.getElementById('me-total-final');
  if (totalFinalEl) totalFinalEl.textContent = totalFinal.toFixed(1) + ' h';
};

// ─────────────────────────────────────────────────────────────
// Calculations (PERT Formula)
// ─────────────────────────────────────────────────────────────

window.meCalculatePertEstimate = function(optimistic, mostLikely, pessimistic) {
  const O = parseFloat(optimistic) || 0;
  const ML = parseFloat(mostLikely) || 0;
  const P = parseFloat(pessimistic) || 0;
  return (O + 4*ML + P) / 6;
};

window.meCalculatePertStdDev = function(optimistic, pessimistic) {
  const O = parseFloat(optimistic) || 0;
  const P = parseFloat(pessimistic) || 0;
  return (P - O) / 6;
};

// ─────────────────────────────────────────────────────────────
// Save / Clear / Cancel
// ─────────────────────────────────────────────────────────────

window.meEstimationSave = function(taskIdx) {
  const task = meDataState.tasks[taskIdx];

  // Validation
  if (!task.advancedEstimation || !task.advancedEstimation.pertData || task.advancedEstimation.pertData.estimates.length === 0) {
    alert('Please add at least one estimate before saving');
    return;
  }

  // Update notes
  const notesEl = document.getElementById('me-notes');
  if (notesEl && task.advancedEstimation.pertData) {
    task.advancedEstimation.pertData.notes = notesEl.value.trim();
  }

  // Calculate total final hours (using PERT + confidence)
  let totalFinalHours = 0;
  const confidenceLevel = task.advancedEstimation.pertData.confidenceLevel || 1.0;

  task.advancedEstimation.pertData.estimates.forEach(est => {
    const O = parseFloat(est.optimistic) || 0;
    const ML = parseFloat(est.mostLikely) || 0;
    const P = parseFloat(est.pessimistic) || 0;
    const pertEst = (O + 4*ML + P) / 6;
    const stdDev = (P - O) / 6;
    const finalEst = pertEst + (stdDev * (confidenceLevel - 1.0));
    totalFinalHours += finalEst;
  });

  // Round to 0.1
  const roundedTotal = Math.round(totalFinalHours * 10) / 10;

  // Update task with final estimate
  task.advancedEstimation.pertData.totalCalculatedHours = roundedTotal;
  task.advancedEstimation.pertData.lastUpdated = new Date().toISOString();
  task.totalHours = roundedTotal;

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

