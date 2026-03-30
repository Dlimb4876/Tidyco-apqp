/**
 * MCS Modal — View
 * Read-only detail modal, activity log, approval actions, and status advancement.
 */

import { appState } from '../../../core/js/state.js'
import { currentUser, supabase as supa } from '../../../core/js/supa.js'
import { esc, canEdit } from '../../../utils/js/helpers.js'
import { mcsShowEditModal } from './mcs-modal-edit.js'
import { mcsBuildPfmeaLinkBadge, mcsHandlePfmeaAction } from './mcs-pfmea.js'
import { mcsCanApproveStep } from './mcs-approvers-data.js'
import {
  mcsBuildWorkflowRail,
  mcsBuildViewWorkflowStages,
  mcsParseExtendedJustification,
  mcsBuildStage3ImpactChecklistHtml,
  mcsRenderTimelineHtml,
  mcsFormatTimelineEvents,
  mcsCloseModal
} from './mcs-modal-shared.js'
import { mcsApproveStep, mcsRejectStep, mcsAddTimelineEntry } from './mcs-approval.js'
import { mcsRenderList, mcsToast, mcStatusLabel } from './mcs-main.js'

async function mcsRefreshActionCentreList() {
  try {
    appState.actionCentreData = null
    const acModule = await import('../../action-centre/js/action-centre.js')
    if (acModule && typeof acModule.actionCentreLoad === 'function') {
      acModule.actionCentreLoad()
    }
  } catch (_) {}
}

/**
 * Show view/detail modal
 */
export function mcsShowViewModal(change) {
  const existing = document.getElementById('mcs-view-backdrop')
  if (existing) existing.remove()

  const backdrop = document.createElement('div')
  backdrop.className = 'mcs-modal-backdrop open'
  backdrop.id = 'mcs-view-backdrop'

  const workflowHtml = mcsBuildWorkflowRail(mcsBuildViewWorkflowStages(change))

  const impactIconMap = {
    'BOM Change': '[BOM]',
    'Work Instructions': '[WI]',
    'Tooling Change': '[TL]',
    'Training Required': '[TR]',
    'Customer Notification': '[CN]'
  }

  const impactsHtml = (change.impacts || []).length > 0
    ? (change.impacts || []).map(imp => `<span class="mcs-impact-tag">${impactIconMap[imp] || '[*]'} ${esc(imp)}</span>`).join('')
    : '<span class="mcs-impact-none">No impact areas selected</span>'

  const extendedJustification = mcsParseExtendedJustification(change.justification || '')
  const stage3ProgressMap = change.impact_progress && typeof change.impact_progress === 'object'
    ? change.impact_progress
    : (extendedJustification.impactProgress || {})
  const stage3ChecklistHtml = mcsBuildStage3ImpactChecklistHtml(change.impacts || [], stage3ProgressMap)

  const timelineHtml = mcsRenderTimelineHtml(change.timeline || [])
  const approval1Notes = (change.eng_review_notes || '').startsWith('nominated_approver:') ? '' : (change.eng_review_notes || '')
  const approval2Notes = change.qa_review_notes || ''
  const pfmeaBadgeHtml = mcsBuildPfmeaLinkBadge(change)

  backdrop.innerHTML = `
    <div class="mcs-modal" id="mcs-view-modal" data-change-id="${esc(change.id)}">
      <div class="mcs-modal-header">
        <div class="mcs-modal-ref-badge">${esc(change.id)}</div>
        <div class="mcs-modal-titles">
          <div class="mcs-modal-title">${esc(change.title)}</div>
          <div class="mcs-modal-tags">
            <span class="mcs-status-pill mcs-status-${change.status}">${mcStatusLabel(change.status)}</span>
            <span class="mcs-tag">${esc(change.change_type)}</span>
          </div>
        </div>
        <button class="mcs-modal-close" data-action="mcs-close-view">&times;</button>
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
                ${pfmeaBadgeHtml}
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
              <div class="mcs-stage-subtitle">Implementation target, impact checklist progress, and overhaul impact.</div>
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
              <div class="mcs-impact-progress-wrap">${stage3ChecklistHtml}</div>
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
            <button class="mcs-btn mcs-btn-primary mcs-comment-post-btn" data-action="mcs-post-comment">Post</button>
          </div>
          <textarea class="mcs-field-textarea mcs-comment-textarea" id="mcs-comment-text" placeholder="Add a comment or progress update..." rows="2"></textarea>
        </div>
      </div>
      <div class="mcs-modal-footer">
        <button class="mcs-btn mcs-btn-danger" data-action="mcs-delete-change">Delete</button>
        <button class="mcs-btn mcs-btn-ghost" data-action="mcs-edit-change">Edit</button>
        ${mcsModalFooterButtons(change)}
      </div>
    </div>
  `

  document.body.appendChild(backdrop)
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) mcsCloseModal('mcs-view-backdrop')
  })
  backdrop.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-action]')
    if (!trigger) return
    const action = trigger.dataset.action
    if (mcsHandlePfmeaAction(action, trigger)) return
    const changeId = trigger.dataset.changeId || change.id
    const stepKey = trigger.dataset.step || ''

    if (action === 'mcs-close-view') return mcsCloseModal('mcs-view-backdrop')
    if (action === 'mcs-post-comment') return mcsPostComment(changeId)
    if (action === 'mcs-delete-change') return mcsDeleteChange(changeId)
    if (action === 'mcs-edit-change') return mcsEditChange(changeId)
    if (action === 'mcs-advance-status') return mcsAdvanceStatus(changeId)
    if (action === 'mcs-approve-step') return mcsApproveStepWithPrompt(changeId, stepKey)
    if (action === 'mcs-reject-step') return mcsRejectStepWithPrompt(changeId, stepKey)
  })
}

async function mcsPostComment(changeId) {
  const textEl = document.getElementById('mcs-comment-text')
  const typeEl = document.getElementById('mcs-comment-type')
  const text = textEl ? textEl.value.trim() : ''
  const eventType = typeEl ? typeEl.value : 'comment'

  if (!text) {
    textEl && textEl.focus()
    return
  }

  const actor = (currentUser && (currentUser.user_metadata?.full_name || currentUser.email)) || 'Unknown'

  try {
    const { error } = await supa
      .from('mcs_timeline')
      .insert([{
        change_id: changeId,
        event_type: eventType,
        event_text: text,
        actor_name: actor
      }])
    if (error) throw error
    if (textEl) textEl.value = ''

    const { data: timelineData } = await supa
      .from('mcs_timeline')
      .select('*')
      .eq('change_id', changeId)
      .order('created_at', { ascending: true })

    const events = mcsFormatTimelineEvents(timelineData || [])
    const timelineEl = document.getElementById('mcs-view-timeline')
    if (timelineEl) timelineEl.innerHTML = mcsRenderTimelineHtml(events)

    const localChange = appState.mcsList.find(c => c.id === changeId)
    if (localChange) localChange.timeline = events
  } catch (err) {
    console.error('Error posting comment:', err)
    alert('Error saving: ' + err.message)
  }
}

async function mcsDeleteChange(id) {
  if (!confirm('Permanently delete this change request?')) return
  try {
    const { error } = await supa.from('mcs_changes').delete().eq('id', id)
    if (error) throw error

    appState.mcsList = appState.mcsList.filter(c => c.id !== id)
    mcsToast('Change deleted')
    mcsCloseModal('mcs-view-backdrop')
    mcsRenderList()
  } catch (err) {
    console.error('Delete error:', err)
    alert('Error deleting change: ' + err.message)
  }
}

async function mcsEditChange(id) {
  const change = appState.mcsList.find(c => c.id === id)
  if (!change) return

  appState.mcsEditingId = id
  mcsCloseModal('mcs-view-backdrop')
  setTimeout(async () => {
    await mcsShowEditModal(change)
  }, 100)
}

function mcsModalFooterButtons(change) {
  if (change.status === 'open') {
    return canEdit()
      ? `<button class="mcs-btn mcs-btn-primary" data-action="mcs-advance-status" data-change-id="${esc(change.id)}">Send to Approval 1 →</button>`
      : ''
  }

  if (change.status === 'review') {
    const canApprove = mcsCanApproveStep('approval1', change)
    if (!canApprove) {
      return `<span style="font-size:12px;color:var(--text3);align-self:center">Awaiting Approval 1</span>`
    }
    return `
      <button class="mcs-btn mcs-btn-ghost" style="color:var(--red)" data-action="mcs-reject-step" data-step="approval1" data-change-id="${esc(change.id)}">Reject ✗</button>
      <button class="mcs-btn mcs-btn-primary" data-action="mcs-approve-step" data-step="approval1" data-change-id="${esc(change.id)}">Approve ✓</button>
    `
  }

  if (change.status === 'implementing') {
    return canEdit()
      ? `<button class="mcs-btn mcs-btn-primary" data-action="mcs-advance-status" data-change-id="${esc(change.id)}">Submit for Approval 2 →</button>`
      : `<span style="font-size:12px;color:var(--text3);align-self:center">Being implemented</span>`
  }

  if (change.status === 'final_review') {
    const canApprove = mcsCanApproveStep('approval2', change)
    if (!canApprove) {
      return `<span style="font-size:12px;color:var(--text3);align-self:center">Awaiting Approval 2</span>`
    }
    return `
      <button class="mcs-btn mcs-btn-ghost" style="color:var(--red)" data-action="mcs-reject-step" data-step="approval2" data-change-id="${esc(change.id)}">Reject ✗</button>
      <button class="mcs-btn mcs-btn-primary" data-action="mcs-approve-step" data-step="approval2" data-change-id="${esc(change.id)}">Approve ✓</button>
    `
  }

  return ''
}

async function mcsApproveStepWithPrompt(changeId, stepKey) {
  const notes = prompt('Approval notes (optional):') || ''
  const success = await mcsApproveStep(changeId, stepKey, notes)
  if (success) {
    mcsToast('Step approved')
    mcsCloseModal('mcs-view-backdrop')
    mcsRenderList()
    mcsRefreshActionCentreList()
  } else {
    alert('Could not approve — you may not be assigned as an approver for this step.')
  }
}

async function mcsRejectStepWithPrompt(changeId, stepKey) {
  const reason = prompt('Rejection reason (required):')
  if (!reason || !reason.trim()) return
  const success = await mcsRejectStep(changeId, stepKey, reason)
  if (success) {
    mcsToast('Step rejected')
    mcsCloseModal('mcs-view-backdrop')
    mcsRenderList()
    mcsRefreshActionCentreList()
  } else {
    alert('Could not reject — you may not be assigned as an approver for this step.')
  }
}

async function mcsAdvanceStatus(id) {
  const change = appState.mcsList.find(c => c.id === id)
  if (!change) return

  const statusFlow = { open: 'review', implementing: 'final_review' }
  const nextStatus = statusFlow[change.status]
  if (!nextStatus) return

  try {
    const now = new Date().toISOString()
    const updateData = { status: nextStatus, updated_at: now }

    if (nextStatus === 'review') {
      updateData.eng_review_status = 'pending'
      updateData.eng_review_by = null
      updateData.eng_review_at = null
      const existingNotes = change.eng_review_notes || ''
      if (!existingNotes.startsWith('nominated_approver:')) updateData.eng_review_notes = null
    } else if (nextStatus === 'final_review') {
      updateData.qa_review_status = 'pending'
      updateData.qa_review_by = null
      updateData.qa_review_at = null
      updateData.qa_review_notes = null
    }

    const { error } = await supa.from('mcs_changes').update(updateData).eq('id', id)
    if (error) throw error

    const idx = appState.mcsList.findIndex(c => c.id === id)
    if (idx !== -1) appState.mcsList[idx] = { ...appState.mcsList[idx], ...updateData }

    const actor = (currentUser && currentUser.email) ? currentUser.email : 'System'
    if (nextStatus === 'review') {
      await mcsAddTimelineEntry(id, 'raised', 'Submitted for Approval 1.', actor)
    } else if (nextStatus === 'final_review') {
      await mcsAddTimelineEntry(id, 'edited', 'Implementation complete — submitted for Approval 2.', actor)
    }

    mcsToast(`Status updated to: ${mcStatusLabel(nextStatus)}`)
    mcsCloseModal('mcs-view-backdrop')
    mcsRenderList()
  } catch (err) {
    console.error('Error advancing status:', err)
    alert('Error: ' + err.message)
  }
}
