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
            <div class="mcs-field-label">Affected Area</div>
            <select class="mcs-field-select" id="mcs-f-area">
              <option value="">Select area...</option>
              <option>Assembly</option>
              <option>Fabrication</option>
              <option>Machining</option>
              <option>Paint & Finish</option>
              <option>Electrical</option>
              <option>Testing & Inspection</option>
              <option>Stores / Warehouse</option>
              <option>Design Office</option>
              <option>All Areas</option>
            </select>
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Part / Drawing No.</div>
            <input class="mcs-field-input" id="mcs-f-part" placeholder="e.g. DRG-0042-A" style="font-family: var(--mono)" />
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
            <input class="mcs-field-input" id="mcs-f-author" placeholder="Name / email" />
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Target Implementation</div>
            <input class="mcs-field-input" id="mcs-f-target" type="date" />
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Est. Time Impact (days)</div>
            <input class="mcs-field-input" id="mcs-f-time-impact" type="number" placeholder="e.g. +5 or -2" />
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
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-drawing" /><label for="mcs-imp-drawing">Drawing Update</label></div>
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-bom" /><label for="mcs-imp-bom">BOM Change</label></div>
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-proc" /><label for="mcs-imp-proc">Work Instructions</label></div>
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-qual" /><label for="mcs-imp-qual">QC Plan Update</label></div>
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-supplier" /><label for="mcs-imp-supplier">Supplier Approval</label></div>
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

  // Build approval chain HTML
  const approvalSteps = [
    { name: 'ENGINEERING', role: 'Eng. Review', status: change.eng_review_status },
    { name: 'QUALITY', role: 'QA Approval', status: change.qa_review_status },
    { name: 'MANUFACTURING', role: 'Mfg. Sign-off', status: change.mfg_signoff_status },
    { name: 'MANAGEMENT', role: 'Auth. to Implement', status: change.auth_implementation_status }
  ];

  const statusOrder = { open: 0, review: 1, approved: 2, implemented: 3, rejected: 4 };
  const currentStatusIndex = statusOrder[change.status] || 0;

  const approvalChainHtml = approvalSteps.map((step, i) => {
    let cls = '';
    const icons = { approved: '✓', rejected: '✗', pending: '•', null: i + 1 };
    const iconValue = icons[step.status] || icons.null;

    if (change.status === 'rejected') {
      cls = i === 0 ? 'done' : i === 1 ? 'rejected' : '';
    } else if (currentStatusIndex > i) {
      cls = 'done';
    } else if (currentStatusIndex === i) {
      cls = 'current';
    }

    return `
      <div class="mcs-approval-step ${cls}">
        <div class="mcs-approval-circle">${iconValue}</div>
        <div class="mcs-approval-name">${step.name}</div>
        <div class="mcs-approval-role">${step.role}</div>
      </div>
    `;
  }).join('');

  // Build impacts HTML
  const impactTypes = [
    'Drawing Update', 'BOM Change', 'Work Instructions', 'QC Plan Update',
    'Supplier Approval', 'Tooling Change', 'Training Required', 'Customer Notification'
  ];
  const impactsHtml = (change.impacts || []).length > 0
    ? (change.impacts || []).map(imp => `<span class="mcs-tag" style="background: var(--blue-dim); color: var(--blue); border: 1px solid rgba(37,99,235,0.2)">✓ ${esc(imp)}</span>`).join('')
    : '<span style="color: var(--text3); font-size: 12px;">None specified</span>';

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
            <span class="mcs-tag">${esc(change.affected_area || '—')}</span>
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
            <div class="mcs-field-label">Affected Area</div>
            <div style="font-size: 13px; color: var(--text2);">${esc(change.affected_area || '—')}</div>
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Part / Drawing</div>
            <div style="font-family: var(--mono); font-size: 12px; color: var(--text2);">${esc(change.part_drawing_no || '—')}</div>
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
        <button class="mcs-btn mcs-btn-primary" id="mcs-advance-btn" onclick="mcsAdvanceStatus('${esc(change.id)}')" style="display: ${(change.status === 'open' || change.status === 'review' || change.status === 'approved') ? '' : 'none'};">
          ${change.status === 'open' ? 'Send to Review →' : change.status === 'review' ? 'Approve →' : change.status === 'approved' ? 'Mark Implemented →' : 'Close'}
        </button>
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
    'mcs-imp-drawing': 'Drawing Update',
    'mcs-imp-bom': 'BOM Change',
    'mcs-imp-proc': 'Work Instructions',
    'mcs-imp-qual': 'QC Plan Update',
    'mcs-imp-supplier': 'Supplier Approval',
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

      const updated = {
        ...mcsList[changeIdx],
        title,
        type,
        priority,
        description,
        impacts,
        affected_area: document.getElementById('mcs-f-area')?.value,
        part_drawing_no: document.getElementById('mcs-f-part')?.value,
        initiated_by: document.getElementById('mcs-f-author')?.value,
        target_implementation: document.getElementById('mcs-f-target')?.value,
        estimated_time_impact_days: parseInt(document.getElementById('mcs-f-time-impact')?.value) || 0,
        justification: document.getElementById('mcs-f-justification')?.value,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('mcs_changes')
        .update(updated)
        .eq('id', mcsEditingId);

      if (error) throw error;

      mcsList[changeIdx] = updated;
      mcsToast('Change updated successfully');
    } else {
      // Create new
      const year = new Date().getFullYear();
      const nextNum = String(mcsList.length + 1).padStart(4, '0');
      const id = `ECR-${year}-${nextNum}`;
      const now = new Date().toISOString();

      const newChange = {
        id,
        title,
        change_type: type,
        priority,
        status: 'open',
        description,
        impacts,
        affected_area: document.getElementById('mcs-f-area')?.value,
        part_drawing_no: document.getElementById('mcs-f-part')?.value,
        initiated_by: document.getElementById('mcs-f-author')?.value || 'Unknown',
        change_source: document.getElementById('mcs-f-source')?.value || 'Manual',
        created_at: now,
        updated_at: now,
        target_implementation: document.getElementById('mcs-f-target')?.value,
        estimated_time_impact_days: parseInt(document.getElementById('mcs-f-time-impact')?.value) || 0,
        justification: document.getElementById('mcs-f-justification')?.value,
        timeline: [
          {
            time: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            text: 'Change request submitted.',
            author: document.getElementById('mcs-f-author')?.value || 'User',
            type: 'accent'
          }
        ]
      };

      const { error } = await supabase
        .from('mcs_changes')
        .insert([newChange]);

      if (error) throw error;

      mcsList.unshift(newChange);
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
    const { error } = await supabase
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
            <div class="mcs-field-label">Affected Area</div>
            <input class="mcs-field-input" id="mcs-f-area" value="${esc(change.affected_area || '')}" />
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Part / Drawing No.</div>
            <input class="mcs-field-input" id="mcs-f-part" value="${esc(change.part_drawing_no || '')}" style="font-family: var(--mono)" />
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Initiated By</div>
            <input class="mcs-field-input" id="mcs-f-author" value="${esc(change.initiated_by || '')}" />
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Target Implementation</div>
            <input class="mcs-field-input" id="mcs-f-target" type="date" value="${change.target_implementation || ''}" />
          </div>
          <div class="mcs-field-group">
            <div class="mcs-field-label">Est. Time Impact (days)</div>
            <input class="mcs-field-input" id="mcs-f-time-impact" type="number" value="${change.estimated_time_impact_days || 0}" />
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
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-drawing" ${(change.impacts || []).includes('Drawing Update') ? 'checked' : ''} /><label for="mcs-imp-drawing">Drawing Update</label></div>
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-bom" ${(change.impacts || []).includes('BOM Change') ? 'checked' : ''} /><label for="mcs-imp-bom">BOM Change</label></div>
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-proc" ${(change.impacts || []).includes('Work Instructions') ? 'checked' : ''} /><label for="mcs-imp-proc">Work Instructions</label></div>
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-qual" ${(change.impacts || []).includes('QC Plan Update') ? 'checked' : ''} /><label for="mcs-imp-qual">QC Plan Update</label></div>
          <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-supplier" ${(change.impacts || []).includes('Supplier Approval') ? 'checked' : ''} /><label for="mcs-imp-supplier">Supplier Approval</label></div>
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
    const updated = {
      ...change,
      status: nextStatus,
      updated_at: now
    };

    if (nextStatus === 'review') {
      updated.eng_review_status = 'pending';
    } else if (nextStatus === 'approved') {
      updated.qa_review_status = 'approved';
    } else if (nextStatus === 'implemented') {
      updated.implementation_date = new Date().toISOString().split('T')[0];
    }

    const { error } = await supabase
      .from('mcs_changes')
      .update(updated)
      .eq('id', id);

    if (error) throw error;

    const idx = mcsList.findIndex(c => c.id === id);
    if (idx !== -1) {
      mcsList[idx] = updated;
    }

    mcsToast(`Status updated to: ${mcStatusLabel(nextStatus)}`);
    mcsCloseModal('mcs-view-backdrop');
    mcsRenderList();
  } catch (err) {
    console.error('Error advancing status:', err);
    alert('Error: ' + err.message);
  }
}
