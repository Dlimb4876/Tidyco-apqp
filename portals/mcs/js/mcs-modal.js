/**
 * MCS Modal Handlers - Create, Edit, View
 */

/**
 * Show create/new change modal
 */
function mcsShowCreateModal() {
  const backdrop = document.createElement('div');
  backdrop.className = 'mcs-modal-backdrop open';
  backdrop.id = 'mcs-form-backdrop';

  const initiatedBy = (currentUser && currentUser.email) ? currentUser.email : '';
  const productOptions = (window.productsState && window.productsState.products || [])
    .map(p => {
      const display = p.part_number ? `${esc(p.name)} (${esc(p.part_number)})` : esc(p.name);
      return `<option value="${esc(p.name)}">${display}</option>`;
    }).join('');

  backdrop.innerHTML = `
    <div class="mcs-modal" id="mcs-form-modal">
      <div class="mcs-modal-header">
        <div class="mcs-modal-ref-badge">NEW CHANGE REQUEST</div>
        <div class="mcs-modal-titles">
          <div class="mcs-modal-title">Create Change Request</div>
        </div>
        <button class="mcs-modal-close" onclick="mcsCloseModal('mcs-form-backdrop')">&times;</button>
      </div>
      <div class="mcs-modal-body">
        <div class="mcs-modal-grid">
          <div class="mcs-field-group mcs-modal-grid full">
            <div class="mcs-field-label">Change Title *</div>
            <input class="mcs-field-input" id="mcs-f-title" placeholder="Brief, descriptive title..." />
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Change Type *</div>
            <select class="mcs-field-select" id="mcs-f-type">
              <option value="">Select type...</option>
              <option>Engineering</option>
              <option>Process</option>
              <option>Material</option>
              <option>Tooling</option>
              <option>Quality</option>
              <option>Safety</option>
            </select>
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Priority *</div>
            <select class="mcs-field-select" id="mcs-f-priority">
              <option value="">Select priority...</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Part / Drawing No.</div>
            <select class="mcs-field-select" id="mcs-f-part">
              <option value="">Select product...</option>
              ${productOptions}
            </select>
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Source</div>
            <select class="mcs-field-select" id="mcs-f-source">
              <option value="Manual">Manual</option>
              <option value="PFMEA">PFMEA</option>
              <option value="Risk">Risk</option>
              <option value="Customer">Customer</option>
              <option value="Quality">Quality</option>
              <option value="Supply Chain">Supply Chain</option>
            </select>
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Initiated By</div>
            <input class="mcs-field-input" id="mcs-f-author" value="${esc(initiatedBy)}" readonly style="background: var(--surface2); color: var(--text2);" />
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Target Implementation</div>
            <input class="mcs-field-input" id="mcs-f-target" type="date" />
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Overhaul Time Impact (hours)</div>
            <input class="mcs-field-input" id="mcs-f-time-impact" type="number" min="0" step="0.5" placeholder="e.g. 4.5" />
          </div>
          <div class="mcs-field-group mcs-modal-grid full">
            <div class="mcs-field-label">Description of Change *</div>
            <textarea class="mcs-field-textarea" id="mcs-f-description" placeholder="Describe exactly what is changing..." rows="4"></textarea>
          </div>
          <div class="mcs-field-group mcs-modal-grid full">
            <div class="mcs-field-label">Justification / Root Cause</div>
            <textarea class="mcs-field-textarea" id="mcs-f-justification" placeholder="Why is this change necessary?..." rows="3"></textarea>
          </div>
        </div>

        <div class="mcs-section-title">Impact Assessment</div>
        <div class="mcs-impact-grid">
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-bom" /><label for="mcs-imp-bom">BOM Change</label></div>
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-proc" /><label for="mcs-imp-proc">Work Instructions</label></div>
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-tooling" /><label for="mcs-imp-tooling">Tooling Change</label></div>
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-training" /><label for="mcs-imp-training">Training Required</label></div>
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-customer" /><label for="mcs-imp-customer">Customer Notification</label></div>
        </div>
      </div>
      <div class="mcs-modal-footer">
        <button class="mcs-btn mcs-btn-ghost" onclick="mcsCloseModal('mcs-form-backdrop')">Cancel</button>
        <button class="mcs-btn mcs-btn-primary" onclick="mcsSaveChange()">Submit Change Request</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) mcsCloseModal('mcs-form-backdrop');
  });
}

/**
 * Show view/detail modal
 */
function mcsShowViewModal(change) {
  const backdrop = document.createElement('div');
  backdrop.className = 'mcs-modal-backdrop open';
  backdrop.id = 'mcs-view-backdrop';

  // Build approval chain HTML — use each step's actual approval status
  const approvalSteps = [
    { name: 'Engineering', role: 'Eng. Review', status: change.eng_review_status, byField: 'eng_review_by', atField: 'eng_review_at', notesField: 'eng_review_notes' },
    { name: 'Quality', role: 'QA Approval', status: change.qa_review_status, byField: 'qa_review_by', atField: 'qa_review_at', notesField: 'qa_review_notes' },
    { name: 'Manufacturing', role: 'Mfg. Sign-off', status: change.mfg_signoff_status, byField: 'mfg_signoff_by', atField: 'mfg_signoff_at', notesField: 'mfg_signoff_notes' },
    { name: 'Management', role: 'Auth. to Implement', status: change.auth_implementation_status, byField: 'auth_implementation_by', atField: 'auth_implementation_at', notesField: 'auth_implementation_notes' }
  ];

  const approvalChainHtml = approvalSteps.map((step, i) => {
    let cls = '';
    let icon = String(i + 1);

    if (step.status === 'approved') {
      cls = 'done';
      icon = '✓';
    } else if (step.status === 'rejected') {
      cls = 'rejected';
      icon = '✗';
    } else {
      // Active if all prior steps are approved and change is in review
      const allPriorApproved = approvalSteps.slice(0, i).every(s => s.status === 'approved');
      if (allPriorApproved && change.status === 'review') cls = 'current';
    }

    const approvedBy = change[step.byField] || '';
    const approvedAt = change[step.atField] ? change[step.atField].split('T')[0] : '';
    const notes = change[step.notesField] || '';
    const stepStatus = step.status === 'approved' ? 'Approved' : step.status === 'rejected' ? 'Rejected' : cls === 'current' ? 'In Review' : 'Pending';

    return `
      <div class="mcs-approval-step ${cls}">
        <div class="mcs-approval-circle">${icon}</div>
        <div class="mcs-approval-name">${esc(step.name)}</div>
        <div class="mcs-approval-role">${step.role}</div>
        <div class="mcs-approval-status-label">${stepStatus}</div>
        ${approvedBy ? `<div class="mcs-approval-meta">${esc(approvedBy)}</div>` : ''}
        ${approvedAt ? `<div class="mcs-approval-date">${approvedAt}</div>` : ''}
        ${notes ? `<div class="mcs-approval-notes" title="${esc(notes)}">"${esc(notes.length > 40 ? notes.slice(0, 40) + '…' : notes)}"</div>` : ''}
      </div>
    `;
  }).join('');

  // Build impacts HTML with icons per type
  const impactIconMap = {
    'BOM Change': '📋',
    'Work Instructions': '📝',
    'Tooling Change': '🔧',
    'Training Required': '🎓',
    'Customer Notification': '📣'
  };
  const impactsHtml = (change.impacts || []).length > 0
    ? (change.impacts || []).map(imp => `<span class="mcs-impact-tag">${impactIconMap[imp] || '•'} ${esc(imp)}</span>`).join('')
    : '<span class="mcs-impact-none">No impact areas selected</span>';

  // Build timeline HTML
  const timelineHtml = (change.timeline || []).length > 0
    ? (change.timeline || []).map(ev => `
      <div class="mcs-tl-event ${ev.type || ''}">
        <div class="mcs-tl-time">${ev.time || '—'}</div>
        <div class="mcs-tl-text">${esc(ev.text || '')}</div>
        <div class="mcs-tl-author">${esc(ev.author || '')}</div>
      </div>
    `).join('')
    : '<div style="color: var(--text3); font-size: 12px; padding: 8px 0;">No activity recorded.</div>';

  backdrop.innerHTML = `
    <div class="mcs-modal" id="mcs-view-modal">
      <div class="mcs-modal-header">
        <div class="mcs-modal-ref-badge">${esc(change.id)}</div>
        <div class="mcs-modal-titles">
          <div class="mcs-modal-title">${esc(change.title)}</div>
          <div class="mcs-modal-tags">
            <span class="mcs-tag">${esc(change.change_type)}</span>
          </div>
        </div>
        <button class="mcs-modal-close" onclick="mcsCloseModal('mcs-view-backdrop')">&times;</button>
      </div>
      <div class="mcs-modal-body">
        <div class="mcs-modal-grid">
          <div class="mcs-field-group">
            <div class="mcs-field-label">Status</div>
            <div><span class="mcs-status-pill mcs-status-${change.status}">${mcStatusLabel(change.status)}</span></div>
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Priority</div>
            <div style="font-family: var(--mono); font-size: 12px; color: var(--text2); text-transform: capitalize;">• ${change.priority}</div>
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Initiated By</div>
            <div style="font-size: 13px; color: var(--text2);">${esc(change.initiated_by || '—')}</div>
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Date Raised</div>
            <div style="font-family: var(--mono); font-size: 12px; color: var(--text2);">${change.created_at ? change.created_at.split('T')[0] : '—'}</div>
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Part / Drawing</div>
            <div style="font-family: var(--mono); font-size: 12px; color: var(--text2);">${esc(change.part_drawing_no || '—')}</div>
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Time Impact (hrs)</div>
            <div class="mcs-time-impact-display ${change.estimated_time_impact_days > 0 ? 'has-impact' : ''}">
              ${change.estimated_time_impact_days > 0 ? `<span class="mcs-time-impact-value">⏱ ${change.estimated_time_impact_days}h</span>` : '<span style="color:var(--text3);font-size:12px;">—</span>'}
            </div>
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Target Implementation</div>
            <div style="font-family: var(--mono); font-size: 12px; color: var(--text2);">${change.target_implementation || '—'}</div>
          </div>
          <div class="mcs-field-group mcs-modal-grid full">
            <div class="mcs-field-label">Description of Change</div>
            <div style="font-size: 13px; color: var(--text2); line-height: 1.6; background: var(--surface2); padding: 12px; border-radius: 6px; border: 1px solid var(--border);">
              ${esc(change.description || '')}
            </div>
          </div>
          <div class="mcs-field-group mcs-modal-grid full">
            <div class="mcs-field-label">Justification / Root Cause</div>
            <div style="font-size: 13px; color: var(--text2); line-height: 1.6; background: var(--surface2); padding: 12px; border-radius: 6px; border: 1px solid var(--border);">
              ${esc(change.justification || 'Not specified.')}
            </div>
          </div>
        </div>

        <div class="mcs-section-title">Approval Chain</div>
        <div class="mcs-approval-chain">${approvalChainHtml}</div>

        <div class="mcs-section-title">Impact Assessment</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px;">
          ${impactsHtml}
        </div>

        <div class="mcs-section-title">Activity Log</div>
        <div class="mcs-timeline">${timelineHtml}</div>
      </div>
      <div class="mcs-modal-footer">
        <button class="mcs-btn mcs-btn-danger" onclick="mcsDeleteChange('${esc(change.id)}')">Delete</button>
        <button class="mcs-btn mcs-btn-ghost" onclick="mcsEditChange('${esc(change.id)}')">Edit</button>
        ${mcsModalFooterButtons(change)}
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) mcsCloseModal('mcs-view-backdrop');
  });
}

/**
 * Save change (create or update)
 */
async function mcsSaveChange() {
  const title = document.getElementById('mcs-f-title')?.value.trim();
  const type = document.getElementById('mcs-f-type')?.value;
  const priority = document.getElementById('mcs-f-priority')?.value;
  const description = document.getElementById('mcs-f-description')?.value.trim();

  if (!title || !type || !priority || !description) {
    alert('Please fill in required fields (marked with *)');
    return;
  }

  const impactMap = {
    'mcs-imp-bom': 'BOM Change',
    'mcs-imp-proc': 'Work Instructions',
    'mcs-imp-tooling': 'Tooling Change',
    'mcs-imp-training': 'Training Required',
    'mcs-imp-customer': 'Customer Notification'
  };

  const impacts = Object.entries(impactMap)
    .filter(([id]) => document.getElementById(id)?.checked)
    .map(([, label]) => label);

  try {
    if (mcsEditingId) {
      // Update existing
      const changeIdx = mcsList.findIndex(c => c.id === mcsEditingId);
      if (changeIdx === -1) return;

      const updateFields = {
        title,
        change_type: type,
        priority,
        description,
        part_drawing_no: document.getElementById('mcs-f-part')?.value,
        target_implementation: document.getElementById('mcs-f-target')?.value,
        estimated_time_impact_days: parseFloat(document.getElementById('mcs-f-time-impact')?.value) || 0,
        justification: document.getElementById('mcs-f-justification')?.value,
        updated_at: new Date().toISOString()
      };

      const { error } = await supa
        .from('mcs_changes')
        .update(updateFields)
        .eq('id', mcsEditingId);

      if (error) throw error;

      // Replace impacts: delete old rows, insert new ones
      await supa.from('mcs_impacts').delete().eq('change_id', mcsEditingId);
      if (impacts.length > 0) {
        const impactRows = impacts.map(impact_type => ({ change_id: mcsEditingId, impact_type }));
        const { error: impErr } = await supa.from('mcs_impacts').insert(impactRows);
        if (impErr) console.error('Error saving impacts:', impErr);
      }

      mcsList[changeIdx] = { ...mcsList[changeIdx], ...updateFields, impacts };
      mcsToast('Change updated successfully');
    } else {
      // Create new
      const year = new Date().getFullYear();
      const nextNum = String(mcsList.length + 1).padStart(4, '0');
      const id = `ECR-${year}-${nextNum}`;
      const now = new Date().toISOString();

      const initiatedBy = document.getElementById('mcs-f-author')?.value || 'Unknown';

      const newChange = {
        id,
        title,
        change_type: type,
        priority,
        status: 'open',
        description,
        part_drawing_no: document.getElementById('mcs-f-part')?.value,
        initiated_by: initiatedBy,
        change_source: document.getElementById('mcs-f-source')?.value || 'Manual',
        created_at: now,
        updated_at: now,
        target_implementation: document.getElementById('mcs-f-target')?.value,
        estimated_time_impact_days: parseFloat(document.getElementById('mcs-f-time-impact')?.value) || 0,
        justification: document.getElementById('mcs-f-justification')?.value
      };

      const { error } = await supa
        .from('mcs_changes')
        .insert([newChange]);

      if (error) throw error;

      // Save impact checkboxes to mcs_impacts table
      if (impacts.length > 0) {
        const impactRows = impacts.map(impact_type => ({ change_id: id, impact_type }));
        const { error: impErr } = await supa.from('mcs_impacts').insert(impactRows);
        if (impErr) console.error('Error saving impacts:', impErr);
      }

      // Log the initial timeline entry to mcs_timeline
      await mcsAddTimelineEntry(id, 'raised', 'Change request submitted.', initiatedBy);

      mcsList.unshift({ ...newChange, impacts, timeline: [] });
      mcsToast(`Created: ${id}`);
    }

    mcsCloseModal(mcsEditingId ? 'mcs-view-backdrop' : 'mcs-form-backdrop');
    mcsRenderList();
  } catch (err) {
    console.error('Save error:', err);
    alert('Error saving change: ' + err.message);
  }
}

/**
 * Delete change
 */
async function mcsDeleteChange(id) {
  if (!confirm('Permanently delete this change request?')) return;

  try {
    const { error } = await supa
      .from('mcs_changes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    mcsList = mcsList.filter(c => c.id !== id);
    mcsToast('Change deleted');
    mcsCloseModal('mcs-view-backdrop');
    mcsRenderList();
  } catch (err) {
    console.error('Delete error:', err);
    alert('Error deleting change: ' + err.message);
  }
}

/**
 * Edit change
 */
function mcsEditChange(id) {
  const change = mcsList.find(c => c.id === id);
  if (!change) return;

  mcsEditingId = id;
  mcsCloseModal('mcs-view-backdrop');

  // Close and reopen with form
  setTimeout(() => {
    mcsShowEditModal(change);
  }, 100);
}

/**
 * Show edit modal
 */
function mcsShowEditModal(change) {
  // Similar to create but pre-filled
  const backdrop = document.createElement('div');
  backdrop.className = 'mcs-modal-backdrop open';
  backdrop.id = 'mcs-form-backdrop';

  const initiatedBy = change.initiated_by || (currentUser && currentUser.email) || '';
  const productOptions = (window.productsState && window.productsState.products || [])
    .map(p => {
      const display = p.part_number ? `${esc(p.name)} (${esc(p.part_number)})` : esc(p.name);
      const selected = change.part_drawing_no === p.name ? 'selected' : '';
      return `<option value="${esc(p.name)}" ${selected}>${display}</option>`;
    }).join('');

  backdrop.innerHTML = `
    <div class="mcs-modal">
      <div class="mcs-modal-header">
        <div class="mcs-modal-ref-badge">${esc(change.id)}</div>
        <div class="mcs-modal-titles">
          <div class="mcs-modal-title">Edit Change Request</div>
        </div>
        <button class="mcs-modal-close" onclick="mcsCloseModal('mcs-form-backdrop')">&times;</button>
      </div>
      <div class="mcs-modal-body">
        <div class="mcs-modal-grid">
          <div class="mcs-field-group mcs-modal-grid full">
            <div class="mcs-field-label">Change Title *</div>
            <input class="mcs-field-input" id="mcs-f-title" value="${esc(change.title)}" />
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Change Type *</div>
            <select class="mcs-field-select" id="mcs-f-type">
              <option value="Engineering" ${change.change_type === 'Engineering' ? 'selected' : ''}>Engineering</option>
              <option value="Process" ${change.change_type === 'Process' ? 'selected' : ''}>Process</option>
              <option value="Material" ${change.change_type === 'Material' ? 'selected' : ''}>Material</option>
              <option value="Tooling" ${change.change_type === 'Tooling' ? 'selected' : ''}>Tooling</option>
              <option value="Quality" ${change.change_type === 'Quality' ? 'selected' : ''}>Quality</option>
              <option value="Safety" ${change.change_type === 'Safety' ? 'selected' : ''}>Safety</option>
            </select>
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Priority *</div>
            <select class="mcs-field-select" id="mcs-f-priority">
              <option value="critical" ${change.priority === 'critical' ? 'selected' : ''}>Critical</option>
              <option value="high" ${change.priority === 'high' ? 'selected' : ''}>High</option>
              <option value="medium" ${change.priority === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="low" ${change.priority === 'low' ? 'selected' : ''}>Low</option>
            </select>
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Part / Drawing No.</div>
            <select class="mcs-field-select" id="mcs-f-part">
              <option value="">Select product...</option>
              ${productOptions}
            </select>
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Initiated By</div>
            <input class="mcs-field-input" id="mcs-f-author" value="${esc(initiatedBy)}" readonly style="background: var(--surface2); color: var(--text2);" />
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Target Implementation</div>
            <input class="mcs-field-input" id="mcs-f-target" type="date" value="${change.target_implementation || ''}" />
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Overhaul Time Impact (hours)</div>
            <input class="mcs-field-input" id="mcs-f-time-impact" type="number" min="0" step="0.5" value="${change.estimated_time_impact_days || 0}" />
          </div>
          <div class="mcs-field-group mcs-modal-grid full">
            <div class="mcs-field-label">Description of Change *</div>
            <textarea class="mcs-field-textarea" id="mcs-f-description" rows="4">${esc(change.description || '')}</textarea>
          </div>
          <div class="mcs-field-group mcs-modal-grid full">
            <div class="mcs-field-label">Justification / Root Cause</div>
            <textarea class="mcs-field-textarea" id="mcs-f-justification" rows="3">${esc(change.justification || '')}</textarea>
          </div>
        </div>
        <div class="mcs-section-title">Impact Assessment</div>
        <div class="mcs-impact-grid">
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-bom" ${(change.impacts || []).includes('BOM Change') ? 'checked' : ''} /><label for="mcs-imp-bom">BOM Change</label></div>
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-proc" ${(change.impacts || []).includes('Work Instructions') ? 'checked' : ''} /><label for="mcs-imp-proc">Work Instructions</label></div>
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-tooling" ${(change.impacts || []).includes('Tooling Change') ? 'checked' : ''} /><label for="mcs-imp-tooling">Tooling Change</label></div>
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-training" ${(change.impacts || []).includes('Training Required') ? 'checked' : ''} /><label for="mcs-imp-training">Training Required</label></div>
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-customer" ${(change.impacts || []).includes('Customer Notification') ? 'checked' : ''} /><label for="mcs-imp-customer">Customer Notification</label></div>
        </div>
      </div>
      <div class="mcs-modal-footer">
        <button class="mcs-btn mcs-btn-ghost" onclick="mcsCloseModal('mcs-form-backdrop')">Cancel</button>
        <button class="mcs-btn mcs-btn-primary" onclick="mcsSaveChange()">Save Changes</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) mcsCloseModal('mcs-form-backdrop');
  });
}

/**
 * Build the correct footer action buttons based on the change status and
 * whether the current user is an assigned approver for the active step.
 */
function mcsModalFooterButtons(change) {
  if (change.status === 'open') {
    // Anyone with edit access can send to review
    return canEdit()
      ? `<button class="mcs-btn mcs-btn-primary" onclick="mcsAdvanceStatus('${esc(change.id)}')">Send to Review →</button>`
      : '';
  }

  if (change.status === 'review') {
    const activeStepKey = typeof mcsGetActiveStepKey === 'function' ? mcsGetActiveStepKey(change) : null;
    const canApprove = activeStepKey && typeof mcsCanApproveStep === 'function' && mcsCanApproveStep(activeStepKey);
    if (!canApprove) {
      // Show a greyed-out label so the user knows where approval sits
      const stepDef = activeStepKey && typeof MCS_APPROVAL_STEPS !== 'undefined'
        ? MCS_APPROVAL_STEPS.find(s => s.key === activeStepKey)
        : null;
      const waitingFor = stepDef ? stepDef.label : 'next approver';
      return `<span style="font-size:12px;color:var(--text3);align-self:center">Awaiting ${esc(waitingFor)}</span>`;
    }
    return `
      <button class="mcs-btn mcs-btn-ghost" style="color:var(--red)" onclick="mcsRejectStepWithPrompt('${esc(change.id)}','${esc(activeStepKey)}')">Reject ✗</button>
      <button class="mcs-btn mcs-btn-primary" onclick="mcsApproveStepWithPrompt('${esc(change.id)}','${esc(activeStepKey)}')">Approve ✓</button>
    `;
  }

  if (change.status === 'approved') {
    // Mark implemented — only management approvers or admins
    const canImplement = isAdmin() ||
      (typeof mcsCanApproveStep === 'function' && mcsCanApproveStep('management'));
    return canImplement
      ? `<button class="mcs-btn mcs-btn-primary" onclick="mcsAdvanceStatus('${esc(change.id)}')">Mark Implemented →</button>`
      : `<span style="font-size:12px;color:var(--text3);align-self:center">Awaiting implementation</span>`;
  }

  return '';
}

/**
 * Prompt for approval notes then approve the active step.
 */
function mcsApproveStepWithPrompt(changeId, stepKey) {
  const notes = prompt('Approval notes (optional):') || '';
  mcsApproveStep(changeId, stepKey, notes).then(success => {
    if (success) {
      mcsToast('Step approved');
      mcsCloseModal('mcs-view-backdrop');
      mcsRenderList();
      // Refresh action centre data so the item disappears from the list
      if (typeof actionCentreData !== 'undefined') {
        actionCentreData = null;
        if (typeof actionCentreLoad === 'function') actionCentreLoad();
      }
    } else {
      alert('Could not approve — you may not be assigned as an approver for this step.');
    }
  });
}

/**
 * Prompt for a rejection reason then reject the active step.
 */
function mcsRejectStepWithPrompt(changeId, stepKey) {
  const reason = prompt('Rejection reason (required):');
  if (!reason || !reason.trim()) return;
  mcsRejectStep(changeId, stepKey, reason).then(success => {
    if (success) {
      mcsToast('Step rejected');
      mcsCloseModal('mcs-view-backdrop');
      mcsRenderList();
      if (typeof actionCentreData !== 'undefined') {
        actionCentreData = null;
        if (typeof actionCentreLoad === 'function') actionCentreLoad();
      }
    } else {
      alert('Could not reject — you may not be assigned as an approver for this step.');
    }
  });
}

/**
 * Close modal
 */
function mcsCloseModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('open');
    setTimeout(() => el.remove(), 200);
  }
}

/**
 * Advance change status
 */
async function mcsAdvanceStatus(id) {
  const change = mcsList.find(c => c.id === id);
  if (!change) return;

  const statusFlow = { open: 'review', review: 'approved', approved: 'implemented' };
  const nextStatus = statusFlow[change.status];
  if (!nextStatus) return;

  try {
    const now = new Date().toISOString();
    const updateData = {
      status: nextStatus,
      updated_at: now
    };

    if (nextStatus === 'review') {
      updateData.eng_review_status = 'pending';
    } else if (nextStatus === 'approved') {
      updateData.qa_review_status = 'approved';
    } else if (nextStatus === 'implemented') {
      updateData.implementation_date = new Date().toISOString().split('T')[0];
    }

    const { error } = await supa
      .from('mcs_changes')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    const idx = mcsList.findIndex(c => c.id === id);
    if (idx !== -1) {
      mcsList[idx] = { ...mcsList[idx], ...updateData };
    }

    mcsToast(`Status updated to: ${mcStatusLabel(nextStatus)}`);
    mcsCloseModal('mcs-view-backdrop');
    mcsRenderList();
  } catch (err) {
    console.error('Error advancing status:', err);
    alert('Error: ' + err.message);
  }
}
