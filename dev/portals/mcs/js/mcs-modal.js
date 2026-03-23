/**
 * MCS Modal Handlers - Create, Edit, View
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

function mcsToggleStageBlock(stageBlock, expand) {
  if (!stageBlock) return;
  stageBlock.classList.toggle('is-collapsed', !expand);

  const toggle = stageBlock.querySelector('.mcs-stage-toggle');
  if (toggle) {
    toggle.setAttribute('aria-expanded', expand ? 'true' : 'false');
  }

  const content = stageBlock.querySelector('.mcs-stage-content');
  if (content) {
    content.hidden = !expand;
  }
}

function mcsInitStageCollapsibles(container, expandedStages) {
  if (!container) return;

  const stageBadgeMap = {
    open: '1',
    approval1: '2',
    implement: '3',
    approval2: '4'
  };

  const expandedOrder = (expandedStages || ['open']).map(String);
  const blocks = container.querySelectorAll('.mcs-stage-block');
  const expandedKey = expandedOrder.find(key => container.querySelector(`.mcs-stage-block[data-stage="${key}"]`)) ||
    (blocks[0] ? (blocks[0].getAttribute('data-stage') || 'open') : 'open');

  blocks.forEach((block, index) => {
    if (block.dataset.collapsibleInit === '1') return;

    const titleEl = block.querySelector(':scope > .mcs-stage-title');
    if (!titleEl) return;
    const subtitleEl = block.querySelector(':scope > .mcs-stage-subtitle');

    const stageKey = block.getAttribute('data-stage') || `stage-${index + 1}`;
    const contentId = `mcs-stage-content-${stageKey}-${index}`;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'mcs-stage-toggle';
    toggle.setAttribute('aria-controls', contentId);

    const textWrap = document.createElement('span');
    textWrap.className = 'mcs-stage-toggle-text';
    const titleClone = titleEl.cloneNode(true);
    const stageBadge = document.createElement('span');
    stageBadge.className = 'mcs-stage-badge';
    stageBadge.textContent = stageBadgeMap[stageKey] || String(index + 1);
    titleClone.classList.add('has-stage-badge');
    titleClone.prepend(stageBadge);
    textWrap.appendChild(titleClone);
    if (subtitleEl) textWrap.appendChild(subtitleEl.cloneNode(true));

    const chevron = document.createElement('span');
    chevron.className = 'mcs-stage-chevron';
    chevron.innerHTML = '&#9662;';
    chevron.setAttribute('aria-hidden', 'true');

    toggle.appendChild(textWrap);
    toggle.appendChild(chevron);

    const content = document.createElement('div');
    content.className = 'mcs-stage-content';
    content.id = contentId;

    Array.from(block.children).forEach(child => {
      if (child !== titleEl && child !== subtitleEl) content.appendChild(child);
    });

    titleEl.remove();
    if (subtitleEl) subtitleEl.remove();

    block.prepend(toggle);
    block.appendChild(content);

    mcsToggleStageBlock(block, stageKey === expandedKey);

    toggle.addEventListener('click', () => {
      const isCollapsed = block.classList.contains('is-collapsed');
      if (!isCollapsed) return;

      blocks.forEach(otherBlock => {
        if (otherBlock !== block) mcsToggleStageBlock(otherBlock, false);
      });
      mcsToggleStageBlock(block, true);
    });

    block.dataset.collapsibleInit = '1';
  });
}

/**
 * Show create/new change modal
 */
async function mcsShowCreateModal() {
  const backdrop = document.createElement('div');
  backdrop.className = 'mcs-modal-backdrop open';
  backdrop.id = 'mcs-form-backdrop';

  const pfmeaCauses = await mcsGetPfmeaCausesForLinking();
  const emptyChange = { related_pfmea_cause_id: null };
  const pfmeaLinkingHtml = mcsBuildPfmeaLinkingSection(emptyChange, pfmeaCauses);

  const initiatedBy = (currentUser && currentUser.email) ? currentUser.email : '';
  const productOptions = (window.productsState && window.productsState.products || [])
    .map(p => {
      const display = p.part_number ? `${esc(p.name)} (${esc(p.part_number)})` : esc(p.name);
      return `<option value="${esc(p.id)}" data-name="${esc(p.name)}" data-part="${esc(p.part_number || '')}">${display}</option>`;
    }).join('');

  const workflowHtml = mcsBuildWorkflowRail([
    { name: 'Open + Impact', role: 'Capture request and impacted scope', status: 'current', badge: '1', stateLabel: 'IN PROGRESS' },
    { name: 'Approval 1', role: 'Initial sign-off', status: 'pending', badge: '2', stateLabel: 'PENDING' },
    { name: 'Implement', role: 'Apply the approved change', status: 'pending', badge: '3', stateLabel: 'PENDING' },
    { name: 'Approval 2', role: 'Final sign-off', status: 'pending', badge: '4', stateLabel: 'PENDING' }
  ]);

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
        <div class="mcs-staged-layout">
          <div class="mcs-stage-blocks">
            <section class="mcs-stage-block" data-stage="open">
              <div class="mcs-stage-title">Stage 1: Open + Impact</div>
              <div class="mcs-stage-subtitle">Capture the request details and all downstream impacts.</div>
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
                <div class="mcs-field-group mcs-modal-grid full">
                  <div class="mcs-field-label">Description of Change *</div>
                  <textarea class="mcs-field-textarea" id="mcs-f-description" placeholder="Describe exactly what is changing..." rows="4"></textarea>
                </div>
                <div class="mcs-field-group mcs-modal-grid full">
                  <div class="mcs-field-label">Justification / Root Cause</div>
                  <textarea class="mcs-field-textarea" id="mcs-f-justification" placeholder="Why is this change necessary?..." rows="3"></textarea>
                </div>
              </div>
              <div class="mcs-impact-grid">
                <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-bom" /><label for="mcs-imp-bom">BOM Change</label></div>
                <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-proc" /><label for="mcs-imp-proc">Work Instructions</label></div>
                <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-tooling" /><label for="mcs-imp-tooling">Tooling Change</label></div>
                <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-training" /><label for="mcs-imp-training">Training Required</label></div>
                <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-customer" /><label for="mcs-imp-customer">Customer Notification</label></div>
              </div>
              <div class="mcs-modal-grid">${pfmeaLinkingHtml}</div>
              <div class="mcs-modal-grid">
                <div class="mcs-field-group">
                  <div class="mcs-field-label">Impact Assessment Estimate (hours)</div>
                  <input class="mcs-field-input" id="mcs-f-impact-estimate" type="number" min="0" step="0.5" placeholder="e.g. 2.0" />
                </div>
                <div class="mcs-field-group mcs-modal-grid full">
                  <div class="mcs-field-label">Documents Affected</div>
                  <textarea class="mcs-field-textarea" id="mcs-f-docs-affected" placeholder="List drawings, SOPs, work instructions, control plans, or customer docs impacted by this change..." rows="3"></textarea>
                </div>
                <div class="mcs-field-group mcs-modal-grid full">
                  <div class="mcs-field-label">Knock-on Effect for Other Products</div>
                  <textarea class="mcs-field-textarea" id="mcs-f-knock-on" placeholder="Describe potential side effects for other products, assemblies, or programmes..." rows="3"></textarea>
                </div>
              </div>
            </section>

            <section class="mcs-stage-block" data-stage="approval1">
              <div class="mcs-stage-title">Stage 2: Approval 1</div>
              <div class="mcs-stage-subtitle">Nominate the initial reviewer before submitting.</div>
              ${mcsApproverSelectionHtml('', false)}
            </section>

            <section class="mcs-stage-block" data-stage="implement">
              <div class="mcs-stage-title">Stage 3: Implement</div>
              <div class="mcs-stage-subtitle">Capture implementation target and expected time impact.</div>
              <div class="mcs-modal-grid">
                <div class="mcs-field-group">
                  <div class="mcs-field-label">Target Implementation</div>
                  <input class="mcs-field-input" id="mcs-f-target" type="date" />
                </div>
                <div class="mcs-field-group">
                  <div class="mcs-field-label">Overhaul Time Impact (hours)</div>
                  <input class="mcs-field-input" id="mcs-f-time-impact" type="number" min="0" step="0.5" placeholder="e.g. 4.5" />
                </div>
              </div>
            </section>

            <section class="mcs-stage-block" data-stage="approval2">
              <div class="mcs-stage-title">Stage 4: Approval 2</div>
              <div class="mcs-stage-subtitle">Final sign-off happens after implementation is complete.</div>
              <div class="mcs-stage-note">No extra data entry is required here during request creation.</div>
            </section>
          </div>
          ${workflowHtml}
        </div>
      </div>
      <div class="mcs-modal-footer">
        <button class="mcs-btn mcs-btn-ghost" onclick="mcsCloseModal('mcs-form-backdrop')">Cancel</button>
        <button class="mcs-btn mcs-btn-primary" onclick="mcsSaveChange()">Submit Change Request</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  mcsInitStageCollapsibles(backdrop, ['open']);
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

  // Get selected PFMEA cause
  const selectedPfmeaCauseId = document.getElementById('mcs-f-pfmea-cause')?.value || null;
  const impactAssessmentEstimate = document.getElementById('mcs-f-impact-estimate')?.value || '';
  const documentsAffected = document.getElementById('mcs-f-docs-affected')?.value || '';
  const knockOnEffect = document.getElementById('mcs-f-knock-on')?.value || '';
  const combinedJustification = mcsBuildExtendedJustification(
    document.getElementById('mcs-f-justification')?.value,
    documentsAffected,
    knockOnEffect,
    impactAssessmentEstimate
  );

  try {
    if (mcsEditingId) {
      // Update existing
      const changeIdx = mcsList.findIndex(c => c.id === mcsEditingId);
      if (changeIdx === -1) return;

      const partEl = document.getElementById('mcs-f-part');
      const selectedPartOption = partEl?.options[partEl.selectedIndex];
      const selectedProductId = partEl?.value || '';
      const selectedProductName = selectedPartOption?.dataset.name || selectedPartOption?.text || partEl?.value || '';

      const updateFields = {
        title,
        change_type: type,
        priority,
        description,
        affected_product_id: selectedProductId || null,
        part_drawing_no: selectedProductName || null,
        target_implementation: document.getElementById('mcs-f-target')?.value,
        estimated_time_impact_hours: parseFloat(document.getElementById('mcs-f-time-impact')?.value) || 0,
        justification: combinedJustification,
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

      // Handle PFMEA linking if changed
      const oldLink = mcsList[changeIdx].related_pfmea_cause_id;
      if (selectedPfmeaCauseId !== oldLink) {
        if (selectedPfmeaCauseId) {
          await mcsLinkToPfmeaCause(mcsEditingId, selectedPfmeaCauseId);
        } else if (oldLink) {
          // Unlink: clear both sides
          await supa.from('mcs_changes').update({ related_pfmea_cause_id: null }).eq('id', mcsEditingId);
          await supa.from('npi_pfmea_causes').update({ action_related_ecr_id: null }).eq('id', oldLink);
        }
      }

      mcsList[changeIdx] = { ...mcsList[changeIdx], ...updateFields, impacts, related_pfmea_cause_id: selectedPfmeaCauseId };
      mcsToast('Change updated successfully');
    } else {
      // Create new — query DB for highest existing ECR number this year to avoid duplicate key
      const year = new Date().getFullYear();
      const prefix = `ECR-${year}-`;
      const { data: existingIds } = await supa
        .from('mcs_changes')
        .select('id')
        .ilike('id', `${prefix}%`);
      let maxNum = 0;
      if (existingIds && existingIds.length > 0) {
        existingIds.forEach(row => {
          const num = parseInt(row.id.replace(prefix, ''), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        });
      }
      const nextNum = String(maxNum + 1).padStart(4, '0');
      const id = `${prefix}${nextNum}`;
      const now = new Date().toISOString();

      const initiatedBy = document.getElementById('mcs-f-author')?.value || 'Unknown';

      const nominatedApprover = document.getElementById('mcs-f-approver')?.value || '';

      const partEl = document.getElementById('mcs-f-part');
      const selectedPartOption = partEl?.options[partEl.selectedIndex];
      const selectedProductId = partEl?.value || '';
      const selectedProductName = selectedPartOption?.dataset.name || selectedPartOption?.text || partEl?.value || '';

      const newChange = {
        id,
        title,
        change_type: type,
        priority,
        status: 'open',
        description,
        affected_product_id: selectedProductId || null,
        part_drawing_no: selectedProductName || null,
        initiated_by: initiatedBy,
        change_source: document.getElementById('mcs-f-source')?.value || 'Manual',
        created_at: now,
        updated_at: now,
        target_implementation: document.getElementById('mcs-f-target')?.value,
        estimated_time_impact_hours: parseFloat(document.getElementById('mcs-f-time-impact')?.value) || 0,
        justification: combinedJustification,
        // Store nominated approver so mcsCanApproveStep can identify who was asked to review
        eng_review_notes: nominatedApprover ? 'nominated_approver:' + nominatedApprover : null,
        related_pfmea_cause_id: selectedPfmeaCauseId || null
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

      // If PFMEA link selected, link it now
      if (selectedPfmeaCauseId) {
        await mcsLinkToPfmeaCause(id, selectedPfmeaCauseId);
      }

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
 * Show edit modal
 */
async function mcsShowEditModal(change) {
  const backdrop = document.createElement('div');
  backdrop.className = 'mcs-modal-backdrop open';
  backdrop.id = 'mcs-form-backdrop';

  const pfmeaCauses = await mcsGetPfmeaCausesForLinking();
  const initiatedBy = change.initiated_by || (currentUser && currentUser.email) || '';
  const preselectedApprover = mcsExtractNominatedApprover(change.eng_review_notes || '');
  const extendedJustification = mcsParseExtendedJustification(change.justification || '');

  const productOptions = (window.productsState && window.productsState.products || [])
    .map(p => {
      const display = p.part_number ? `${esc(p.name)} (${esc(p.part_number)})` : esc(p.name);
      const selected = (change.affected_product_id === p.id || change.part_drawing_no === p.name) ? 'selected' : '';
      return `<option value="${esc(p.id)}" data-name="${esc(p.name)}" data-part="${esc(p.part_number || '')}" ${selected}>${display}</option>`;
    }).join('');

  const pfmeaLinkingHtml = mcsBuildPfmeaLinkingSection(change, pfmeaCauses);
  const workflowHtml = mcsBuildWorkflowRail(mcsBuildViewWorkflowStages(change));

  backdrop.innerHTML = `
    <div class="mcs-modal">
      <div class="mcs-modal-header">
        <div class="mcs-modal-ref-badge">${esc(change.id)}</div>
        <div class="mcs-modal-titles">
          <div class="mcs-modal-title">Edit Change Request</div>
          <div class="mcs-modal-tags">
            <span class="mcs-status-pill mcs-status-${change.status}">${mcStatusLabel(change.status)}</span>
            <span class="mcs-tag">${esc(change.change_type || 'Change')}</span>
          </div>
        </div>
        <button class="mcs-modal-close" onclick="mcsCloseModal('mcs-form-backdrop')">&times;</button>
      </div>
      <div class="mcs-modal-body">
        <div class="mcs-staged-layout">
          <div class="mcs-stage-blocks">
            <section class="mcs-stage-block" data-stage="open">
              <div class="mcs-stage-title">Stage 1: Open + Impact</div>
              <div class="mcs-stage-subtitle">Update request details, impacts, and downstream effects.</div>
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
                <div class="mcs-field-group mcs-modal-grid full">
                  <div class="mcs-field-label">Description of Change *</div>
                  <textarea class="mcs-field-textarea" id="mcs-f-description" rows="4">${esc(change.description || '')}</textarea>
                </div>
                <div class="mcs-field-group mcs-modal-grid full">
                  <div class="mcs-field-label">Justification / Root Cause</div>
                  <textarea class="mcs-field-textarea" id="mcs-f-justification" rows="3">${esc(extendedJustification.core || '')}</textarea>
                </div>
              </div>
              <div class="mcs-impact-grid">
                <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-bom" ${(change.impacts || []).includes('BOM Change') ? 'checked' : ''} /><label for="mcs-imp-bom">BOM Change</label></div>
                <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-proc" ${(change.impacts || []).includes('Work Instructions') ? 'checked' : ''} /><label for="mcs-imp-proc">Work Instructions</label></div>
                <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-tooling" ${(change.impacts || []).includes('Tooling Change') ? 'checked' : ''} /><label for="mcs-imp-tooling">Tooling Change</label></div>
                <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-training" ${(change.impacts || []).includes('Training Required') ? 'checked' : ''} /><label for="mcs-imp-training">Training Required</label></div>
                <div class="mcs-impact-cell"><input type="checkbox" id="mcs-imp-customer" ${(change.impacts || []).includes('Customer Notification') ? 'checked' : ''} /><label for="mcs-imp-customer">Customer Notification</label></div>
              </div>
              <div class="mcs-modal-grid">${pfmeaLinkingHtml}</div>
              <div class="mcs-modal-grid">
                <div class="mcs-field-group">
                  <div class="mcs-field-label">Impact Assessment Estimate (hours)</div>
                  <input class="mcs-field-input" id="mcs-f-impact-estimate" type="number" min="0" step="0.5" value="${esc(extendedJustification.impactAssessmentHours || '')}" />
                </div>
                <div class="mcs-field-group mcs-modal-grid full">
                  <div class="mcs-field-label">Documents Affected</div>
                  <textarea class="mcs-field-textarea" id="mcs-f-docs-affected" rows="3">${esc(extendedJustification.documentsAffected || '')}</textarea>
                </div>
                <div class="mcs-field-group mcs-modal-grid full">
                  <div class="mcs-field-label">Knock-on Effect for Other Products</div>
                  <textarea class="mcs-field-textarea" id="mcs-f-knock-on" rows="3">${esc(extendedJustification.knockOnEffect || '')}</textarea>
                </div>
              </div>
            </section>

            <section class="mcs-stage-block" data-stage="approval1">
              <div class="mcs-stage-title">Stage 2: Approval 1</div>
              <div class="mcs-stage-subtitle">Confirm the nominated initial reviewer.</div>
              ${mcsApproverSelectionHtml(preselectedApprover, false)}
            </section>

            <section class="mcs-stage-block" data-stage="implement">
              <div class="mcs-stage-title">Stage 3: Implement</div>
              <div class="mcs-stage-subtitle">Update implementation target and overhaul time impact.</div>
              <div class="mcs-modal-grid">
                <div class="mcs-field-group">
                  <div class="mcs-field-label">Target Implementation</div>
                  <input class="mcs-field-input" id="mcs-f-target" type="date" value="${change.target_implementation || ''}" />
                </div>
                <div class="mcs-field-group">
                  <div class="mcs-field-label">
                    Overhaul Time Impact (hours)
                    <span class="field-tooltip" title="Enter the change in overhaul hours this MCO will cause. Use a negative number if this change reduces overhaul time (an improvement), for example -2 means 2 hours saved. Use a positive number if it adds time.">i</span>
                  </div>
                  <input class="mcs-field-input" id="mcs-f-time-impact" type="number" step="0.5" value="${change.estimated_time_impact_hours || 0}" />
                </div>
              </div>
            </section>

            <section class="mcs-stage-block" data-stage="approval2">
              <div class="mcs-stage-title">Stage 4: Approval 2</div>
              <div class="mcs-stage-subtitle">Final sign-off is captured in the review flow after implementation.</div>
              <div class="mcs-stage-note">Use the View modal actions when this change reaches Approval 2.</div>
            </section>
          </div>
          ${workflowHtml}
        </div>
      </div>
      <div class="mcs-modal-footer">
        <button class="mcs-btn mcs-btn-ghost" onclick="mcsCloseModal('mcs-form-backdrop')">Cancel</button>
        <button class="mcs-btn mcs-btn-primary" onclick="mcsSaveChange()">Save Changes</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  const activeEditStage = {
    open: 'open',
    review: 'approval1',
    implementing: 'implement',
    final_review: 'approval2',
    implemented: 'approval2',
    closed: 'approval2'
  }[change.status] || 'open';
  mcsInitStageCollapsibles(backdrop, [activeEditStage]);
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
