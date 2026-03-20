/**
 * MCS Approval Workflow
 * Handles 4-step approval chain: Engineering → QA → Manufacturing → Management
 */

/**
 * Get approval status for a change
 */
function mcsGetApprovalStatus(change) {
  const steps = [
    { field: 'eng_review_status', label: 'Engineering' },
    { field: 'qa_review_status', label: 'Quality' },
    { field: 'mfg_signoff_status', label: 'Manufacturing' },
    { field: 'auth_implementation_status', label: 'Management' }
  ];

  return steps.map(step => ({
    label: step.label,
    status: change[step.field] || 'pending'
  }));
}

/**
 * Get pending approvals for current user
 */
function mcsGetUserPendingApprovals(userRole) {
  return mcsList.filter(change => {
    if (change.status !== 'review') return false;

    // Check which step needs current user's approval
    const roleSteps = {
      'engineering': 'eng_review_status',
      'qa': 'qa_review_status',
      'manufacturing': 'mfg_signoff_status',
      'management': 'auth_implementation_status'
    };

    const stepField = roleSteps[userRole];
    if (!stepField) return false;

    return change[stepField] === 'pending' || change[stepField] === null;
  });
}

/**
 * Approve a step in the workflow
 */
async function mcsApproveStep(changeId, step, notes) {
  const change = mcsList.find(c => c.id === changeId);
  if (!change) return false;

  const stepMap = {
    'engineering': { field: 'eng_review_status', byField: 'eng_review_by', atField: 'eng_review_at', notesField: 'eng_review_notes' },
    'qa': { field: 'qa_review_status', byField: 'qa_review_by', atField: 'qa_review_at', notesField: 'qa_review_notes' },
    'manufacturing': { field: 'mfg_signoff_status', byField: 'mfg_signoff_by', atField: 'mfg_signoff_at', notesField: 'mfg_signoff_notes' },
    'management': { field: 'auth_implementation_status', byField: 'auth_implementation_by', atField: 'auth_implementation_at', notesField: 'auth_implementation_notes' }
  };

  const stepInfo = stepMap[step];
  if (!stepInfo) return false;

  try {
    const now = new Date().toISOString();
    const user = currentUserRole || 'Unknown'; // Assumes currentUserRole is set in auth.js

    const updated = {
      ...change,
      [stepInfo.field]: 'approved',
      [stepInfo.byField]: user,
      [stepInfo.atField]: now,
      [stepInfo.notesField]: notes || '',
      updated_at: now
    };

    // Auto-advance to next step
    const allApproved = updated.eng_review_status === 'approved' &&
                       updated.qa_review_status === 'approved' &&
                       updated.mfg_signoff_status === 'approved';

    if (allApproved && updated.status === 'review') {
      updated.status = 'approved';
    }

    const { error } = await supabase
      .from('mcs_changes')
      .update(updated)
      .eq('id', changeId);

    if (error) throw error;

    const idx = mcsList.findIndex(c => c.id === changeId);
    if (idx !== -1) {
      mcsList[idx] = updated;
    }

    // Log timeline entry
    await mcsAddTimelineEntry(changeId, `${step}_reviewed`, `${step} review approved.`, user);

    return true;
  } catch (err) {
    console.error('Error approving step:', err);
    return false;
  }
}

/**
 * Reject a step in the workflow
 */
async function mcsRejectStep(changeId, step, reason) {
  const change = mcsList.find(c => c.id === changeId);
  if (!change) return false;

  const stepMap = {
    'engineering': { field: 'eng_review_status', byField: 'eng_review_by', atField: 'eng_review_at', notesField: 'eng_review_notes' },
    'qa': { field: 'qa_review_status', byField: 'qa_review_by', atField: 'qa_review_at', notesField: 'qa_review_notes' },
    'manufacturing': { field: 'mfg_signoff_status', byField: 'mfg_signoff_by', atField: 'mfg_signoff_at', notesField: 'mfg_signoff_notes' },
    'management': { field: 'auth_implementation_status', byField: 'auth_implementation_by', atField: 'auth_implementation_at', notesField: 'auth_implementation_notes' }
  };

  const stepInfo = stepMap[step];
  if (!stepInfo) return false;

  try {
    const now = new Date().toISOString();
    const user = currentUserRole || 'Unknown';

    const updated = {
      ...change,
      [stepInfo.field]: 'rejected',
      [stepInfo.byField]: user,
      [stepInfo.atField]: now,
      [stepInfo.notesField]: reason || '',
      status: 'rejected',
      updated_at: now
    };

    const { error } = await supabase
      .from('mcs_changes')
      .update(updated)
      .eq('id', changeId);

    if (error) throw error;

    const idx = mcsList.findIndex(c => c.id === changeId);
    if (idx !== -1) {
      mcsList[idx] = updated;
    }

    await mcsAddTimelineEntry(changeId, 'rejected', `${step} review rejected. Reason: ${reason || 'No reason provided'}`, user);

    return true;
  } catch (err) {
    console.error('Error rejecting step:', err);
    return false;
  }
}

/**
 * Add timeline entry
 */
async function mcsAddTimelineEntry(changeId, eventType, text, actor) {
  try {
    const { error } = await supabase
      .from('mcs_timeline')
      .insert([{
        change_id: changeId,
        event_type: eventType,
        event_text: text,
        actor_name: actor,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error adding timeline entry:', error);
    }
  } catch (err) {
    console.error('Timeline error:', err);
  }
}

/**
 * Check if change can be marked as implemented
 */
function mcsCanMarkImplemented(change) {
  return change.status === 'approved' &&
    change.eng_review_status === 'approved' &&
    change.qa_review_status === 'approved' &&
    change.mfg_signoff_status === 'approved';
}

/**
 * Mark change as implemented and create overhaul_history entry
 */
async function mcsMarkImplemented(changeId) {
  const change = mcsList.find(c => c.id === changeId);
  if (!change || !mcsCanMarkImplemented(change)) {
    alert('Change is not ready for implementation');
    return false;
  }

  try {
    const now = new Date().toISOString();
    const implementationDate = now.split('T')[0];

    const updated = {
      ...change,
      status: 'implemented',
      implementation_date: implementationDate,
      updated_at: now
    };

    const { error: updateError } = await supabase
      .from('mcs_changes')
      .update(updated)
      .eq('id', changeId);

    if (updateError) throw updateError;

    const idx = mcsList.findIndex(c => c.id === changeId);
    if (idx !== -1) {
      mcsList[idx] = updated;
    }

    // Auto-create overhaul_history entry if product is linked
    if (change.affected_product_id) {
      await mcsCreateOverhaulHistoryEntry(change);
    }

    await mcsAddTimelineEntry(changeId, 'implemented', 'Change marked as implemented.', 'System');

    return true;
  } catch (err) {
    console.error('Error marking implemented:', err);
    return false;
  }
}

/**
 * Create overhaul_history entry on implementation
 * This links MCS changes to product timeline
 */
async function mcsCreateOverhaulHistoryEntry(change) {
  try {
    const { error } = await supabase
      .from('overhaul_history')
      .insert([{
        product_id: change.affected_product_id,
        time_impact_days: change.estimated_time_impact_days || 0,
        schedule_impact_reason: change.time_impact_reason || '',
        mcs_reference_id: change.id,
        effective_from_date: change.implementation_date || new Date().toISOString().split('T')[0],
        estimated_recovery_date: change.recovery_target_date,
        is_mcs_triggered: true,
        change_reason: `MCS: ${change.change_type} - ${change.title}`,
        notes: change.justification || '',
        created_by_name: change.initiated_by || 'MCS System',
        user_id: change.initiated_by_user_id,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error creating overhaul entry:', error);
    } else {
      console.log('Overhaul history entry created for:', change.id);
    }
  } catch (err) {
    console.error('Overhaul creation error:', err);
  }
}
