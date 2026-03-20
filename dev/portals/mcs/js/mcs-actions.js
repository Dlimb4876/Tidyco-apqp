/**
 * MCS Integration with Action Centre
 * Extracts pending MCS approvals as tasks for the "My Actions" dashboard
 */

/**
 * Extract pending MCS approval tasks for current user.
 * Uses the 2-step MCO approval system (approval1 / approval2) and
 * mcsApproverConfig to identify which steps the current user can act on.
 * Returns array compatible with Action Centre format.
 */
function mcsExtractApproveTasks() {
  if (!mcsList || mcsList.length === 0) return [];
  if (!mcsApproverConfig || !currentUser) return [];

  const tasks = [];

  // Get the steps this user is assigned to approve
  const mySteps = typeof mcsGetMyApproverSteps === 'function'
    ? mcsGetMyApproverSteps()
    : [];

  if (mySteps.length === 0) return [];

  mcsList.forEach(change => {
    mySteps.forEach(stepKey => {
      const stepDef = (typeof MCS_APPROVAL_STEPS !== 'undefined' ? MCS_APPROVAL_STEPS : [])
        .find(s => s.key === stepKey);
      if (!stepDef) return;

      // Change must be at the correct stage for this step
      if (change.status !== stepDef.activeStatus) return;

      // Step must still be pending
      const stepStatus = change[stepDef.field];
      if (stepStatus && stepStatus !== 'pending') return;

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
          if (typeof mcsAutoViewId !== 'undefined') mcsAutoViewId = change.id;
          navigate('mcs');
        },
        notes: change.description?.substring(0, 100) || '',
        createdAt: change.created_at,
        metadata: {
          changeId: change.id,
          changeType: change.change_type,
          approvalStep: stepKey,
          stepLabel: stepDef.label
        }
      });
    });
  });

  return tasks;
}

/**
 * Hook into Action Centre loading to include MCS tasks
 * This is called from actionCentreLoad() after loading NPI actions
 */
function mcsIntegrateWithActionCentre(actionCentreData) {
  if (!actionCentreData) return actionCentreData;

  const mcsTasks = mcsExtractApproveTasks();
  if (mcsTasks.length === 0) return actionCentreData;

  // Add MCS tasks to the data structure
  if (!actionCentreData.mcs_approvals) {
    actionCentreData.mcs_approvals = [];
  }

  actionCentreData.mcs_approvals = mcsTasks;

  // Return merged data
  return actionCentreData;
}

/**
 * Navigate to MCS change from Action Centre
 */
function mcsNavigateFromActionCentre(changeId) {
  navigate('mcs', { pushHash: true });
  setTimeout(() => {
    mcsViewChange(changeId);
  }, 300);
}
