/**
 * MCS Integration with Action Centre
 * Extracts pending MCS approvals as tasks for the "My Actions" dashboard
 */

/**
 * Extract pending MCS approval tasks for current user
 * Returns array compatible with Action Centre format
 */
function mcsExtractApproveTasks() {
  if (!mcsList || mcsList.length === 0) return [];

  const tasks = [];

  // Get current user's role from auth (assuming it's set in auth.js)
  const userRole = currentUserRole || 'Unknown';

  // Map role to approval step
  const roleToStep = {
    'engineering': { field: 'eng_review_status', label: 'Engineering Review', by: 'eng_review_by' },
    'qa': { field: 'qa_review_status', label: 'QA Approval', by: 'qa_review_by' },
    'quality': { field: 'qa_review_status', label: 'QA Approval', by: 'qa_review_by' },
    'manufacturing': { field: 'mfg_signoff_status', label: 'Manufacturing Sign-off', by: 'mfg_signoff_by' },
    'operations': { field: 'mfg_signoff_status', label: 'Manufacturing Sign-off', by: 'mfg_signoff_by' },
    'management': { field: 'auth_implementation_status', label: 'Authorization to Implement', by: 'auth_implementation_by' }
  };

  const stepInfo = roleToStep[userRole?.toLowerCase()];
  if (!stepInfo) return [];

  // Find changes in review status with pending approval at this step
  mcsList.forEach(change => {
    if (change.status !== 'review') return;

    const stepStatus = change[stepInfo.field];
    if (stepStatus === 'pending' || stepStatus === null) {
      tasks.push({
        id: `mcs_${change.id}_${userRole}`,
        type: 'mcs_approval',
        title: `Review ECR-${change.id.split('-')[2]}: ${esc(change.title.substring(0, 50))}${change.title.length > 50 ? '…' : ''}`,
        description: `${stepInfo.label} required for ${esc(change.change_type)} change`,
        status: 'open',
        priority: change.priority,
        dueDate: change.target_implementation,
        owner: change.initiated_by || 'Unknown',
        source: 'MCS',
        sourceIcon: '🔧',
        sourceLink: () => {
          navigate('mcs', { pushHash: true });
          // Highlight the change in MCS view
          mcsViewingId = change.id;
          setTimeout(() => mcsViewChange(change.id), 200);
        },
        notes: change.description?.substring(0, 100) || '',
        createdAt: change.created_at,
        metadata: {
          changeId: change.id,
          changeType: change.change_type,
          approvalStep: userRole,
          area: change.affected_area
        }
      });
    }
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
