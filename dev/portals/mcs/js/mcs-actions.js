/**
 * MCS Integration with Action Centre
 * Extracts pending MCS approvals as tasks for the "My Actions" dashboard
 */

import { appState } from '../../../core/js/state.js'
import { currentUser } from '../../../core/js/supa.js'
import { esc } from '../../../utils/js/helpers.js'
import { navigate } from '../../../utils/js/navigation.js'
import { MCS_APPROVAL_STEPS } from './mcs-approvers-data.js'
import { mcsGetMyApproverSteps } from './mcs-approvers-data.js'

function mcsGetList() {
  return Array.isArray(appState.mcsList) ? appState.mcsList : []
}

/**
 * Extract pending MCS approval tasks for current user.
 * Uses the 2-step MCO approval system (approval1 / approval2) and
 * mcsApproverConfig to identify which steps the current user can act on.
 * Returns array compatible with Action Centre format.
 */
export function mcsExtractApproveTasks() {
  if (!mcsGetList().length) return []
  if (!appState.mcsApproverConfig || !currentUser) return []

  const tasks = []
  const mySteps = mcsGetMyApproverSteps()
  if (mySteps.length === 0) return []

  mcsGetList().forEach(change => {
    mySteps.forEach(stepKey => {
      const stepDef = MCS_APPROVAL_STEPS.find(s => s.key === stepKey)
      if (!stepDef) return

      if (change.status !== stepDef.activeStatus) return
      const stepStatus = change[stepDef.field]
      if (stepStatus && stepStatus !== 'pending') return

      tasks.push({
        id: `mcs_${change.id}_${stepKey}`,
        type: 'mcs_approval',
        title: `Review ${change.id}: ${esc(change.title.substring(0, 50))}${change.title.length > 50 ? '…' : ''}`,
        description: `${stepDef.label} required for ${esc(change.change_type)} change`,
        status: 'open',
        priority: change.priority,
        dueDate: change.target_implementation,
        owner: change.initiated_by || 'Unknown',
        source: 'MCS',
        sourceIcon: '🔧',
        sourceLink: () => {
          appState.mcsAutoViewId = change.id
          navigate('mcs')
        },
        notes: change.description?.substring(0, 100) || '',
        createdAt: change.created_at,
        metadata: {
          changeId: change.id,
          changeType: change.change_type,
          approvalStep: stepKey,
          stepLabel: stepDef.label
        }
      })
    })
  })

  return tasks
}

/**
 * Hook into Action Centre loading to include MCS tasks
 * This is called from actionCentreLoad() after loading NPI actions
 */
export function mcsIntegrateWithActionCentre(actionCentreData) {
  if (!actionCentreData) return actionCentreData

  const mcsTasks = mcsExtractApproveTasks()
  if (mcsTasks.length === 0) return actionCentreData

  if (!actionCentreData.mcs_approvals) actionCentreData.mcs_approvals = []
  actionCentreData.mcs_approvals = mcsTasks
  return actionCentreData
}

/**
 * Navigate to MCS change from Action Centre.
 * Uses mcsAutoViewId so renderMcs() opens the change only after the
 * approver config and change list have finished loading — no race condition.
 */
export function mcsNavigateFromActionCentre(changeId) {
  appState.mcsAutoViewId = changeId
  navigate('mcs')
}
