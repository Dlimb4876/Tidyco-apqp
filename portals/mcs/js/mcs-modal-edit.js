/**
 * MCS Modal — Edit & Save
 * Edit modal renderer and shared save handler (create + update).
 */

import { appState } from '../../../core/js/state.js'
import { currentUser, supabase as supa } from '../../../core/js/supa.js'
import { esc } from '../../../utils/js/helpers.js'
import { productsState } from '../../product-development/product-management/js/products-data.js'
import { mcsBuildPfmeaLinkingSection, mcsGetPfmeaCausesForLinking, mcsHandlePfmeaAction, mcsLinkToPfmeaCause } from './mcs-pfmea.js'
import { mcsAddTimelineEntry } from './mcs-approval.js'
import { mcsRenderList, mcsToast, mcStatusLabel } from './mcs-main.js'
import {
  mcsCloseModal,
  mcsGetImpactFieldMap,
  mcsBuildExtendedJustification,
  mcsExtractNominatedApprover,
  mcsParseExtendedJustification,
  mcsBuildStage3ImpactChecklistHtml,
  mcsBuildViewWorkflowStages,
  mcsBuildWorkflowRail,
  mcsApproverSelectionHtml,
  mcsGetImpactProgressInputId
} from './mcs-modal-shared.js'

/**
 * Save change (create or update)
 */
export async function mcsSaveChange() {
  const title = document.getElementById('mcs-f-title')?.value.trim()
  const type = document.getElementById('mcs-f-type')?.value
  const priority = document.getElementById('mcs-f-priority')?.value
  const description = document.getElementById('mcs-f-description')?.value.trim()

  if (!title || !type || !priority || !description) {
    alert('Please fill in required fields (marked with *)')
    return
  }

  const impactMap = mcsGetImpactFieldMap()
  const impacts = Object.entries(impactMap)
    .filter(([id]) => document.getElementById(id)?.checked)
    .map(([, label]) => label)
  const selectedImpactSet = new Set(impacts)
  const impactProgress = {}
  const progressInputs = document.querySelectorAll('input[data-impact-progress]')
  progressInputs.forEach(input => {
    const label = input.getAttribute('data-impact-progress')
    if (!label || !selectedImpactSet.has(label)) return
    impactProgress[label] = input.checked === true
  })

  const selectedPfmeaCauseId = document.getElementById('mcs-f-pfmea-cause')?.value || null
  const impactAssessmentEstimate = document.getElementById('mcs-f-impact-estimate')?.value || ''
  const documentsAffected = document.getElementById('mcs-f-docs-affected')?.value || ''
  const knockOnEffect = document.getElementById('mcs-f-knock-on')?.value || ''
  const combinedJustification = mcsBuildExtendedJustification(
    document.getElementById('mcs-f-justification')?.value,
    documentsAffected,
    knockOnEffect,
    impactAssessmentEstimate,
    impactProgress
  )

  try {
    if (appState.mcsEditingId) {
      const changeIdx = appState.mcsList.findIndex(c => c.id === appState.mcsEditingId)
      if (changeIdx === -1) return

      const partEl = document.getElementById('mcs-f-part')
      const selectedPartOption = partEl?.options[partEl.selectedIndex]
      const selectedProductId = partEl?.value || ''
      const selectedProductName = selectedPartOption?.dataset.name || selectedPartOption?.text || partEl?.value || ''

      const updateFields = {
        title,
        change_type: type,
        priority,
        description,
        affected_product_id: selectedProductId || null,
        part_drawing_no: selectedProductName || null,
        target_implementation: document.getElementById('mcs-f-target')?.value || null,
        estimated_time_impact_hours: parseFloat(document.getElementById('mcs-f-time-impact')?.value) || 0,
        justification: combinedJustification,
        updated_at: new Date().toISOString()
      }

      const { error } = await supa
        .from('mcs_changes')
        .update(updateFields)
        .eq('id', appState.mcsEditingId)

      if (error) throw error

      await supa.from('mcs_impacts').delete().eq('change_id', appState.mcsEditingId)
      if (impacts.length > 0) {
        const impactRows = impacts.map(impact_type => ({ change_id: appState.mcsEditingId, impact_type }))
        const { error: impErr } = await supa.from('mcs_impacts').insert(impactRows)
        if (impErr) console.error('Error saving impacts:', impErr)
      }

      const oldLink = appState.mcsList[changeIdx].related_pfmea_cause_id
      if (selectedPfmeaCauseId !== oldLink) {
        if (selectedPfmeaCauseId) {
          await mcsLinkToPfmeaCause(appState.mcsEditingId, selectedPfmeaCauseId)
        } else if (oldLink) {
          await supa.from('mcs_changes').update({ related_pfmea_cause_id: null }).eq('id', appState.mcsEditingId)
          await supa.from('npi_pfmea_causes').update({ action_related_ecr_id: null }).eq('id', oldLink)
        }
      }

      appState.mcsList[changeIdx] = {
        ...appState.mcsList[changeIdx],
        ...updateFields,
        impacts,
        impact_progress: impactProgress,
        related_pfmea_cause_id: selectedPfmeaCauseId
      }
      mcsToast('Change updated successfully')
    } else {
      const year = new Date().getFullYear()
      const prefix = `ECR-${year}-`
      const { data: existingIds } = await supa
        .from('mcs_changes')
        .select('id')
        .ilike('id', `${prefix}%`)
      let maxNum = 0
      if (existingIds && existingIds.length > 0) {
        existingIds.forEach(row => {
          const num = parseInt(row.id.replace(prefix, ''), 10)
          if (!isNaN(num) && num > maxNum) maxNum = num
        })
      }
      const nextNum = String(maxNum + 1).padStart(4, '0')
      const id = `${prefix}${nextNum}`
      const now = new Date().toISOString()

      const initiatedBy = document.getElementById('mcs-f-author')?.value || 'Unknown'
      const nominatedApprover = document.getElementById('mcs-f-approver')?.value || ''

      const partEl = document.getElementById('mcs-f-part')
      const selectedPartOption = partEl?.options[partEl.selectedIndex]
      const selectedProductId = partEl?.value || ''
      const selectedProductName = selectedPartOption?.dataset.name || selectedPartOption?.text || partEl?.value || ''

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
        target_implementation: document.getElementById('mcs-f-target')?.value || null,
        estimated_time_impact_hours: parseFloat(document.getElementById('mcs-f-time-impact')?.value) || 0,
        justification: combinedJustification,
        eng_review_notes: nominatedApprover ? 'nominated_approver:' + nominatedApprover : null,
        related_pfmea_cause_id: selectedPfmeaCauseId || null
      }

      const { error } = await supa
        .from('mcs_changes')
        .insert([newChange])

      if (error) throw error

      if (impacts.length > 0) {
        const impactRows = impacts.map(impact_type => ({ change_id: id, impact_type }))
        const { error: impErr } = await supa.from('mcs_impacts').insert(impactRows)
        if (impErr) console.error('Error saving impacts:', impErr)
      }

      await mcsAddTimelineEntry(id, 'raised', 'Change request submitted.', initiatedBy)

      if (selectedPfmeaCauseId) {
        await mcsLinkToPfmeaCause(id, selectedPfmeaCauseId)
      }

      appState.mcsList.unshift({ ...newChange, impacts, impact_progress: impactProgress, timeline: [] })
      mcsToast(`Created: ${id}`)
    }

    mcsCloseModal('mcs-form-backdrop')
    mcsRenderList()
  } catch (err) {
    console.error('Save error:', err)
    alert('Error saving change: ' + err.message)
  }
}

/**
 * Show edit modal
 */
export async function mcsShowEditModal(change) {
  const backdrop = document.createElement('div')
  backdrop.className = 'mcs-modal-backdrop open'
  backdrop.id = 'mcs-form-backdrop'

  const pfmeaCauses = await mcsGetPfmeaCausesForLinking()
  const initiatedBy = change.initiated_by || (currentUser && currentUser.email) || ''
  const preselectedApprover = mcsExtractNominatedApprover(change.eng_review_notes || '')
  const extendedJustification = mcsParseExtendedJustification(change.justification || '')
  const stage3ChecklistHtml = mcsBuildStage3ImpactChecklistHtml(
    change.impacts || [],
    (change.impact_progress && typeof change.impact_progress === 'object')
      ? change.impact_progress
      : (extendedJustification.impactProgress || {})
  )

  const products = (appState.productsState && appState.productsState.products) || productsState.products || []
  const productOptions = products
    .map(p => {
      const display = p.part_number ? `${esc(p.name)} (${esc(p.part_number)})` : esc(p.name)
      const selected = (change.affected_product_id === p.id || change.part_drawing_no === p.name) ? 'selected' : ''
      return `<option value="${esc(p.id)}" data-name="${esc(p.name)}" data-part="${esc(p.part_number || '')}" ${selected}>${display}</option>`
    }).join('')

  const pfmeaLinkingHtml = mcsBuildPfmeaLinkingSection(change, pfmeaCauses)
  const workflowHtml = mcsBuildWorkflowRail(mcsBuildViewWorkflowStages(change))

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
        <button class="mcs-modal-close" data-action="mcs-close-form">&times;</button>
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
              <div class="mcs-stage-subtitle">Update implementation target, checklist progress, and overhaul time impact.</div>
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
              <div class="mcs-impact-progress-wrap">${stage3ChecklistHtml}</div>
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
        <button class="mcs-btn mcs-btn-ghost" data-action="mcs-cancel-form">Cancel</button>
        <button class="mcs-btn mcs-btn-primary" data-action="mcs-save-change">Save Changes</button>
      </div>
    </div>
  `

  document.body.appendChild(backdrop)
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) mcsCloseModal('mcs-form-backdrop')
  })

  backdrop.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-action]')
    if (!trigger) return
    const action = trigger.dataset.action

    if (mcsHandlePfmeaAction(action, trigger)) return
    if (action === 'mcs-close-form' || action === 'mcs-cancel-form') {
      mcsCloseModal('mcs-form-backdrop')
      return
    }
    if (action === 'mcs-save-change') {
      mcsSaveChange()
    }
  })

  backdrop.addEventListener('change', (e) => {
    const impactInput = e.target.closest('.mcs-impact-grid input[type="checkbox"]')
    if (!impactInput) return
    const impactMap = mcsGetImpactFieldMap()
    const selectedImpacts = Object.entries(impactMap)
      .filter(([id]) => document.getElementById(id)?.checked)
      .map(([, label]) => label)
    const progressMap = {}
    selectedImpacts.forEach(label => {
      const progressInput = document.getElementById(mcsGetImpactProgressInputId(label))
      if (progressInput) progressMap[label] = progressInput.checked === true
    })
    const host = document.querySelector('#mcs-form-backdrop .mcs-impact-progress-wrap')
    if (!host) return
    host.innerHTML = mcsBuildStage3ImpactChecklistHtml(selectedImpacts, progressMap)
  })
}
