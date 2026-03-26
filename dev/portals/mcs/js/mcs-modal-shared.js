/**
 * MCS Modal Shared Helpers
 * Utilities used across create, view, and edit modals.
 */

/**
 * Map raw mcs_timeline DB rows to display-friendly event objects
 */
function mcsFormatTimelineEvents(rows) {
  return rows.map(ev => ({
    time: new Date(ev.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    text: ev.event_text || '',
    author: ev.actor_name || ev.actor_email || '',
    type: ev.event_type
  }));
}

/**
 * Render timeline events array to HTML string
 */
function mcsRenderTimelineHtml(events) {
  if (!events.length) return '<div style="color: var(--text3); font-size: 12px; padding: 8px 0;">No activity recorded.</div>';
  return events.map(ev => `
    <div class="mcs-tl-event ${ev.type || ''}">
      <div class="mcs-tl-time">${ev.time || '—'}</div>
      <div class="mcs-tl-text">${esc(ev.text || '')}</div>
      <div class="mcs-tl-author">${esc(ev.author || '')}</div>
    </div>
  `).join('');
}

/**
 * Build the "Select Approver" section for the create/edit form.
 * Shows configured Approval 1 approvers as a dropdown so the submitter
 * can nominate a specific reviewer. The nomination is stored in
 * eng_review_notes as "nominated_approver:<email>" when the change is saved.
 */
function mcsApproverSelectionHtml(preselectedEmail, includeTitle = true) {
  const step1Approvers = (mcsApproverConfig && mcsApproverConfig.approval1) || [];
  const titleHtml = includeTitle ? '<div class="mcs-section-title">Approval 1 Reviewer</div>' : '';

  if (step1Approvers.length === 0) {
    return `
      ${titleHtml}
      <div style="font-size:12px;color:var(--text3);padding:4px 0 8px">
        No specific approvers configured - any editor can approve.
        <a href="#s=settings&tab=mcs-approvers" onclick="navigate('settings',{tab:'mcs-approvers'});mcsCloseModal('mcs-form-backdrop');return false;"
           style="color:var(--accent);text-decoration:none;margin-left:4px">Configure in Settings -&gt;</a>
      </div>`;
  }

  const options = step1Approvers.map(a => {
    const email = a.user_email || '';
    const selected = preselectedEmail && email && email === preselectedEmail ? 'selected' : '';
    return `<option value="${esc(email)}" data-id="${esc(a.user_id)}" ${selected}>${esc(a.user_name)}${email ? ' - ' + esc(email) : ''}</option>`;
  }).join('');

  return `
    ${titleHtml}
    <div class="mcs-field-group">
      <div class="mcs-field-label">Select who should review this change</div>
      <select class="mcs-field-select" id="mcs-f-approver">
        <option value="">Any configured approver</option>
        ${options}
      </select>
    </div>`;
}

function mcsExtractNominatedApprover(notesValue) {
  if (!notesValue || typeof notesValue !== 'string') return '';
  if (!notesValue.startsWith('nominated_approver:')) return '';
  return notesValue.replace('nominated_approver:', '').trim();
}

function mcsParseExtendedJustification(rawValue) {
  const raw = String(rawValue || '');
  const impactMarker = '[ImpactAssessmentHours]';
  const docsMarker = '[DocumentsAffected]';
  const knockMarker = '[KnockOnEffect]';

  const markers = [
    { key: 'impactAssessmentHours', token: impactMarker, idx: raw.indexOf(impactMarker) },
    { key: 'documentsAffected', token: docsMarker, idx: raw.indexOf(docsMarker) },
    { key: 'knockOnEffect', token: knockMarker, idx: raw.indexOf(knockMarker) }
  ].filter(item => item.idx !== -1).sort((a, b) => a.idx - b.idx);

  if (markers.length === 0) {
    return {
      core: raw,
      impactAssessmentHours: '',
      documentsAffected: '',
      knockOnEffect: ''
    };
  }

  const parsed = {
    core: raw.slice(0, markers[0].idx).trimEnd(),
    impactAssessmentHours: '',
    documentsAffected: '',
    knockOnEffect: ''
  };

  markers.forEach((marker, index) => {
    const start = marker.idx + marker.token.length;
    const end = index < markers.length - 1 ? markers[index + 1].idx : raw.length;
    parsed[marker.key] = raw.slice(start, end).trim();
  });

  return parsed;
}

function mcsBuildExtendedJustification(coreValue, documentsAffectedValue, knockOnEffectValue, impactAssessmentHoursValue) {
  const core = String(coreValue || '').trim();
  const documentsAffected = String(documentsAffectedValue || '').trim();
  const knockOnEffect = String(knockOnEffectValue || '').trim();
  const impactAssessmentHours = String(impactAssessmentHoursValue || '').trim();

  if (!documentsAffected && !knockOnEffect && !impactAssessmentHours) {
    return core;
  }

  const parts = [];
  if (core) parts.push(core);
  if (impactAssessmentHours) parts.push(`[ImpactAssessmentHours]\n${impactAssessmentHours}`);
  if (documentsAffected) parts.push(`[DocumentsAffected]\n${documentsAffected}`);
  if (knockOnEffect) parts.push(`[KnockOnEffect]\n${knockOnEffect}`);
  return parts.join('\n\n').trim();
}

function mcsBuildWorkflowRail(stages) {
  const flowHtml = stages.map((stage, index) => {
    const cls = stage.status || '';
    const badge = stage.badge || String(index + 1);
    const noteHtml = stage.note ? `<div class="mcs-flow-note">${esc(stage.note)}</div>` : '';
    const metaHtml = stage.meta ? `<div class="mcs-flow-meta">${esc(stage.meta)}</div>` : '';

    return `
      <div class="mcs-flow-step ${cls}">
        <div class="mcs-flow-dot">${badge}</div>
        <div class="mcs-flow-content">
          <div class="mcs-flow-name">${esc(stage.name)}</div>
          ${stage.role ? `<div class="mcs-flow-role">${esc(stage.role)}</div>` : ''}
          <div class="mcs-flow-state">${esc(stage.stateLabel || 'PENDING')}</div>
          ${metaHtml}
          ${noteHtml}
        </div>
      </div>
    `;
  }).join('');

  return `
    <aside class="mcs-flow-rail mcs-approval-chain" aria-label="Workflow chart">
      <div class="mcs-flow-rail-title">Workflow Chart</div>
      <div class="mcs-flow-list">${flowHtml}</div>
    </aside>
  `;
}

function mcsBuildViewWorkflowStages(change) {
  const openState = change.status === 'open' ? 'current' : 'done';

  let approval1State = 'pending';
  if (change.eng_review_status === 'approved') approval1State = 'done';
  else if (change.eng_review_status === 'rejected') approval1State = 'rejected';
  else if (change.status === 'review') approval1State = 'current';

  const implementState = ['final_review', 'implemented', 'closed'].includes(change.status)
    ? 'done'
    : (change.status === 'implementing' ? 'current' : 'pending');

  let approval2State = 'pending';
  if (change.qa_review_status === 'approved') approval2State = 'done';
  else if (change.qa_review_status === 'rejected') approval2State = 'rejected';
  else if (change.status === 'final_review') approval2State = 'current';

  const approval1By = change.eng_review_by || '';
  const approval1At = change.eng_review_at ? change.eng_review_at.split('T')[0] : '';
  const approval1RawNotes = change.eng_review_notes || '';
  const approval1Notes = approval1RawNotes.startsWith('nominated_approver:') ? '' : approval1RawNotes;

  const approval2By = change.qa_review_by || '';
  const approval2At = change.qa_review_at ? change.qa_review_at.split('T')[0] : '';
  const approval2Notes = change.qa_review_notes || '';

  return [
    {
      name: 'Open + Impact',
      role: 'Capture request and impacted scope',
      status: openState,
      badge: openState === 'done' ? 'OK' : '1',
      stateLabel: openState === 'done' ? 'DONE' : 'IN PROGRESS'
    },
    {
      name: 'Approval 1',
      role: 'Initial sign-off',
      status: approval1State,
      badge: approval1State === 'done' ? 'OK' : approval1State === 'rejected' ? 'NO' : '2',
      stateLabel: approval1State === 'done' ? 'APPROVED' : approval1State === 'rejected' ? 'REJECTED' : approval1State === 'current' ? 'AWAITING' : 'PENDING',
      meta: approval1By ? `${approval1By}${approval1At ? ' | ' + approval1At : ''}` : '',
      note: approval1Notes || ''
    },
    {
      name: 'Implement',
      role: 'Apply the approved change',
      status: implementState,
      badge: implementState === 'done' ? 'OK' : '3',
      stateLabel: implementState === 'done' ? 'DONE' : implementState === 'current' ? 'IN PROGRESS' : 'PENDING'
    },
    {
      name: 'Approval 2',
      role: 'Final sign-off',
      status: approval2State,
      badge: approval2State === 'done' ? 'OK' : approval2State === 'rejected' ? 'NO' : '4',
      stateLabel: approval2State === 'done' ? 'APPROVED' : approval2State === 'rejected' ? 'REJECTED' : approval2State === 'current' ? 'AWAITING' : 'PENDING',
      meta: approval2By ? `${approval2By}${approval2At ? ' | ' + approval2At : ''}` : '',
      note: approval2Notes || ''
    }
  ];
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
  // Clear the viewing ID when the view modal is closed so the realtime
  // subscription does not auto-reopen it after the user has dismissed it.
  if (id === 'mcs-view-backdrop') {
    mcsViewingId = null;
  }
}
