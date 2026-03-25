/**
 * MCS Modal — View
 * Read-only detail modal, activity log, approval actions, and status advancement.
 */

/**
 * Show view/detail modal
 */
function mcsShowViewModal(change) {
  const backdrop = document.createElement('div');
  backdrop.className = 'mcs-modal-backdrop open';
  backdrop.id = 'mcs-view-backdrop';

  const workflowHtml = mcsBuildWorkflowRail(mcsBuildViewWorkflowStages(change));

  const impactIconMap = {
    'BOM Change': '[BOM]',
    'Work Instructions': '[WI]',
    'Tooling Change': '[TL]',
    'Training Required': '[TR]',
    'Customer Notification': '[CN]'
  };

  const impactsHtml = (change.impacts || []).length > 0
    ? (change.impacts || []).map(imp => `<span class="mcs-impact-tag">${impactIconMap[imp] || '[*]'} ${esc(imp)}</span>`).join('')
    : '<span class="mcs-impact-none">No impact areas selected</span>';

  const extendedJustification = mcsParseExtendedJustification(change.justification || '');

  const timelineHtml = mcsRenderTimelineHtml(change.timeline || []);
  const approval1Notes = (change.eng_review_notes || '').startsWith('nominated_approver:') ? '' : (change.eng_review_notes || '');
  const approval2Notes = change.qa_review_notes || '';

  backdrop.innerHTML = `
    <div class="mcs-modal" id="mcs-view-modal">
      <div class="mcs-modal-header">
        <div class="mcs-modal-ref-badge">${esc(change.id)}</div>
        <div class="mcs-modal-titles">
          <div class="mcs-modal-title">${esc(change.title)}</div>
          <div class="mcs-modal-tags">
            <span class="mcs-status-pill mcs-status-${change.status}">${mcStatusLabel(change.status)}</span>
            <span class="mcs-tag">${esc(change.change_type)}</span>
          </div>
        </div>
        <button class="mcs-modal-close" onclick="mcsCloseModal('mcs-view-backdrop')">&times;</button>
      </div>
      <div class="mcs-modal-body">
        <div class="mcs-staged-layout">
          <div class="mcs-stage-blocks">
            <section class="mcs-stage-block" data-stage="open">
              <div class="mcs-stage-title">Stage 1: Open + Impact</div>
              <div class="mcs-stage-subtitle">Baseline request, impacted scope, and downstream effects.</div>
              <div class="mcs-modal-grid">
                <div class="mcs-field-group">
                  <div class="mcs-field-label">Priority</div>
                  <div style="font-family: var(--mono); font-size: 12px; color: var(--text2); text-transform: capitalize;">${esc(change.priority || 'n/a')}</div>
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
                <div class="mcs-field-group mcs-modal-grid full">
                  <div class="mcs-field-label">Description of Change</div>
                  <div class="mcs-stage-readonly">${esc(change.description || '')}</div>
                </div>
                <div class="mcs-field-group mcs-modal-grid full">
                  <div class="mcs-field-label">Justification / Root Cause</div>
                  <div class="mcs-stage-readonly">${esc(extendedJustification.core || 'Not specified.')}</div>
                </div>
                <div class="mcs-field-group mcs-modal-grid full">
                  <div class="mcs-field-label">Selected Impact Areas</div>
                  <div class="mcs-impact-tags-wrap">${impactsHtml}</div>
                </div>
                <div class="mcs-field-group">
                  <div class="mcs-field-label">Impact Assessment Estimate (hours)</div>
                  <div class="mcs-stage-readonly-inline">${esc(extendedJustification.impactAssessmentHours || 'Not specified.')}</div>
                </div>
                <div class="mcs-field-group mcs-modal-grid full">
                  <div class="mcs-field-label">Documents Affected</div>
                  <div class="mcs-stage-readonly">${esc(extendedJustification.documentsAffected || 'Not specified.')}</div>
                </div>
                <div class="mcs-field-group mcs-modal-grid full">
                  <div class="mcs-field-label">Knock-on Effect for Other Products</div>
                  <div class="mcs-stage-readonly">${esc(extendedJustification.knockOnEffect || 'Not specified.')}</div>
                </div>
              </div>
            </section>

            <section class="mcs-stage-block" data-stage="approval1">
              <div class="mcs-stage-title">Stage 2: Approval 1</div>
              <div class="mcs-stage-subtitle">Initial approval decision and notes.</div>
              <div class="mcs-modal-grid">
                <div class="mcs-field-group">
                  <div class="mcs-field-label">Approval 1 Status</div>
                  <div class="mcs-stage-readonly-inline">${esc((change.eng_review_status || 'pending').toUpperCase())}</div>
                </div>
                <div class="mcs-field-group">
                  <div class="mcs-field-label">Reviewed By</div>
                  <div class="mcs-stage-readonly-inline">${esc(change.eng_review_by || '—')}</div>
                </div>
                <div class="mcs-field-group">
                  <div class="mcs-field-label">Reviewed Date</div>
                  <div class="mcs-stage-readonly-inline">${change.eng_review_at ? change.eng_review_at.split('T')[0] : '—'}</div>
                </div>
                <div class="mcs-field-group">
                  <div class="mcs-field-label">Impact Assessment Estimate (hrs)</div>
                  <div class="mcs-stage-readonly-inline">${esc(extendedJustification.impactAssessmentHours || 'Not specified.')}</div>
                </div>
                <div class="mcs-field-group mcs-modal-grid full">
                  <div class="mcs-field-label">Review Notes</div>
                  <div class="mcs-stage-readonly">${esc(approval1Notes || 'No notes recorded.')}</div>
                </div>
              </div>
            </section>

            <section class="mcs-stage-block" data-stage="implement">
              <div class="mcs-stage-title">Stage 3: Implement</div>
              <div class="mcs-stage-subtitle">Implementation target and overhaul impact.</div>
              <div class="mcs-modal-grid">
                <div class="mcs-field-group">
                  <div class="mcs-field-label">Target Implementation</div>
                  <div class="mcs-stage-readonly-inline">${change.target_implementation || '—'}</div>
                </div>
                <div class="mcs-field-group">
                  <div class="mcs-field-label">Time Impact (hrs)</div>
                  <div class="mcs-time-impact-display ${change.estimated_time_impact_hours !== 0 ? 'has-impact' : ''}">
                    ${change.estimated_time_impact_hours !== 0 ? `<span class="mcs-time-impact-value">${change.estimated_time_impact_hours > 0 ? '+' : ''}${change.estimated_time_impact_hours}h</span>` : '<span class="mcs-stage-readonly-inline">—</span>'}
                  </div>
                </div>
              </div>
            </section>

            <section class="mcs-stage-block" data-stage="approval2">
              <div class="mcs-stage-title">Stage 4: Approval 2</div>
              <div class="mcs-stage-subtitle">Final approval outcome and notes.</div>
              <div class="mcs-modal-grid">
                <div class="mcs-field-group">
                  <div class="mcs-field-label">Approval 2 Status</div>
                  <div class="mcs-stage-readonly-inline">${esc((change.qa_review_status || 'pending').toUpperCase())}</div>
                </div>
                <div class="mcs-field-group">
                  <div class="mcs-field-label">Reviewed By</div>
                  <div class="mcs-stage-readonly-inline">${esc(change.qa_review_by || '—')}</div>
                </div>
                <div class="mcs-field-group">
                  <div class="mcs-field-label">Reviewed Date</div>
                  <div class="mcs-stage-readonly-inline">${change.qa_review_at ? change.qa_review_at.split('T')[0] : '—'}</div>
                </div>
                <div class="mcs-field-group mcs-modal-grid full">
                  <div class="mcs-field-label">Review Notes</div>
                  <div class="mcs-stage-readonly">${esc(approval2Notes || 'No notes recorded.')}</div>
                </div>
              </div>
            </section>
          </div>
          ${workflowHtml}
        </div>

        <div class="mcs-section-title">Activity Log</div>
        <div class="mcs-timeline" id="mcs-view-timeline">${timelineHtml}</div>

        <div class="mcs-comment-form">
          <div class="mcs-comment-form-row">
            <select class="mcs-field-select mcs-comment-type" id="mcs-comment-type">
              <option value="comment">Comment</option>
              <option value="progress_update">Progress Update</option>
            </select>
            <button class="mcs-btn mcs-btn-primary mcs-comment-post-btn" onclick="mcsPostComment('${esc(change.id)}')">Post</button>
          </div>
          <textarea class="mcs-field-textarea mcs-comment-textarea" id="mcs-comment-text" placeholder="Add a comment or progress update..." rows="2"></textarea>
        </div>
      </div>
      <div class="mcs-modal-footer">
        <button class="mcs-btn mcs-btn-danger" onclick="mcsDeleteChange('${esc(change.id)}')">Delete</button>
        <button class="mcs-btn mcs-btn-ghost" onclick="mcsEditChange('${esc(change.id)}')">Edit</button>
        ${mcsModalFooterButtons(change)}
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  const activeViewStage = {
    open: 'open',
    review: 'approval1',
    implementing: 'implement',
    final_review: 'approval2',
    implemented: 'approval2',
    closed: 'approval2'
  }[change.status] || 'open';
  mcsInitStageCollapsibles(backdrop, [activeViewStage]);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) mcsCloseModal('mcs-view-backdrop');
  });
}

/**
 * Post a comment or progress update to the activity log
 */
async function mcsPostComment(changeId) {
  const textEl = document.getElementById('mcs-comment-text');
  const typeEl = document.getElementById('mcs-comment-type');
  const text = textEl ? textEl.value.trim() : '';
  const eventType = typeEl ? typeEl.value : 'comment';

  if (!text) {
    textEl && textEl.focus();
    return;
  }

  const actor = (currentUser && (currentUser.user_metadata?.full_name || currentUser.email)) || 'Unknown';

  try {
    const { error } = await supa
      .from('mcs_timeline')
      .insert([{
        change_id: changeId,
        event_type: eventType,
        event_text: text,
        actor_name: actor
      }]);

    if (error) throw error;

    if (textEl) textEl.value = '';

    // Reload timeline and re-render in-place
    const { data: timelineData } = await supa
      .from('mcs_timeline')
      .select('*')
      .eq('change_id', changeId)
      .order('created_at', { ascending: true });

    const events = mcsFormatTimelineEvents(timelineData || []);

    const timelineEl = document.getElementById('mcs-view-timeline');
    if (timelineEl) {
      timelineEl.innerHTML = mcsRenderTimelineHtml(events);
    }

    // Also update the in-memory change object
    const change = mcsList.find(c => c.id === changeId);
    if (change) change.timeline = events;

  } catch (err) {
    console.error('Error posting comment:', err);
    alert('Error saving: ' + err.message);
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
async function mcsEditChange(id) {
  const change = mcsList.find(c => c.id === id);
  if (!change) return;

  mcsEditingId = id;
  mcsCloseModal('mcs-view-backdrop');

  // Close and reopen with form
  setTimeout(async () => {
    await mcsShowEditModal(change);
  }, 100);
}

/**
 * Build the correct footer action buttons based on the change status and
 * whether the current user is an assigned approver for the active step.
 */
function mcsModalFooterButtons(change) {
  if (change.status === 'open') {
    // ME/editor sends to Approval 1
    return canEdit()
      ? `<button class="mcs-btn mcs-btn-primary" onclick="mcsAdvanceStatus('${esc(change.id)}')">Send to Approval 1 →</button>`
      : '';
  }

  if (change.status === 'review') {
    // Waiting for Approval 1
    const canApprove = typeof mcsCanApproveStep === 'function' && mcsCanApproveStep('approval1', change);
    if (!canApprove) {
      return `<span style="font-size:12px;color:var(--text3);align-self:center">Awaiting Approval 1</span>`;
    }
    return `
      <button class="mcs-btn mcs-btn-ghost" style="color:var(--red)" onclick="mcsRejectStepWithPrompt('${esc(change.id)}','approval1')">Reject ✗</button>
      <button class="mcs-btn mcs-btn-primary" onclick="mcsApproveStepWithPrompt('${esc(change.id)}','approval1')">Approve ✓</button>
    `;
  }

  if (change.status === 'implementing') {
    // ME submits for Approval 2 once implementation is done
    return canEdit()
      ? `<button class="mcs-btn mcs-btn-primary" onclick="mcsAdvanceStatus('${esc(change.id)}')">Submit for Approval 2 →</button>`
      : `<span style="font-size:12px;color:var(--text3);align-self:center">Being implemented</span>`;
  }

  if (change.status === 'final_review') {
    // Waiting for Approval 2
    const canApprove = typeof mcsCanApproveStep === 'function' && mcsCanApproveStep('approval2', change);
    if (!canApprove) {
      return `<span style="font-size:12px;color:var(--text3);align-self:center">Awaiting Approval 2</span>`;
    }
    return `
      <button class="mcs-btn mcs-btn-ghost" style="color:var(--red)" onclick="mcsRejectStepWithPrompt('${esc(change.id)}','approval2')">Reject ✗</button>
      <button class="mcs-btn mcs-btn-primary" onclick="mcsApproveStepWithPrompt('${esc(change.id)}','approval2')">Approve ✓</button>
    `;
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
 * Advance change status
 */
async function mcsAdvanceStatus(id) {
  const change = mcsList.find(c => c.id === id);
  if (!change) return;

  // open → review (send to Approval 1)
  // implementing → final_review (submit for Approval 2)
  const statusFlow = { open: 'review', implementing: 'final_review' };
  const nextStatus = statusFlow[change.status];
  if (!nextStatus) return;

  try {
    const now = new Date().toISOString();
    const updateData = {
      status: nextStatus,
      updated_at: now
    };

    if (nextStatus === 'review') {
      // Reset Approval 1 fields so the chain starts cleanly.
      // Preserve eng_review_notes only if it holds a nominated_approver marker.
      updateData.eng_review_status = 'pending';
      updateData.eng_review_by = null;
      updateData.eng_review_at = null;
      const existingNotes = change.eng_review_notes || '';
      if (!existingNotes.startsWith('nominated_approver:')) {
        updateData.eng_review_notes = null;
      }
    } else if (nextStatus === 'final_review') {
      // Reset Approval 2 fields so approver sees a fresh request
      updateData.qa_review_status = 'pending';
      updateData.qa_review_by = null;
      updateData.qa_review_at = null;
      updateData.qa_review_notes = null;
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

    const actor = (currentUser && currentUser.email) ? currentUser.email : 'System';
    if (nextStatus === 'review') {
      await mcsAddTimelineEntry(id, 'raised', 'Submitted for Approval 1.', actor);
    } else if (nextStatus === 'final_review') {
      await mcsAddTimelineEntry(id, 'edited', 'Implementation complete — submitted for Approval 2.', actor);
    }

    mcsToast(`Status updated to: ${mcStatusLabel(nextStatus)}`);
    mcsCloseModal('mcs-view-backdrop');
    mcsRenderList();
  } catch (err) {
    console.error('Error advancing status:', err);
    alert('Error: ' + err.message);
  }
}
