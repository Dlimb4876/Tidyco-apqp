/**
 * MCS Approver Configuration — Data Layer
 *
 * Manages which users are assigned as approvers for each MCS approval step.
 * Approvers see pending changes in their Action Centre and can approve/reject
 * their designated step from the MCS view modal.
 *
 * MCO Process:
 *   1. Open + Impact Assessment
 *   2. Approval 1  → REJECT = Closed | APPROVE → Implementing
 *   3. Implement
 *   4. Approval 2  → REJECT = Back to Implementing | APPROVE → Implemented
 *
 * Requires a Supabase table:
 *
 *   CREATE TABLE mcs_approver_settings (
 *     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     step       text NOT NULL,   -- approval1 | approval2
 *     user_id    uuid NOT NULL,
 *     user_name  text NOT NULL,
 *     created_at timestamptz DEFAULT now()
 *   );
 *   CREATE POLICY "auth" ON mcs_approver_settings
 *     FOR ALL USING (auth.role() = 'authenticated');
 */

// Canonical step definitions — order matters (sequential approval chain)
const MCS_APPROVAL_STEPS = [
  { key: 'approval1', label: 'Approval 1',  field: 'eng_review_status', byField: 'eng_review_by', atField: 'eng_review_at', notesField: 'eng_review_notes',  activeStatus: 'review' },
  { key: 'approval2', label: 'Approval 2',  field: 'qa_review_status',  byField: 'qa_review_by',  atField: 'qa_review_at',  notesField: 'qa_review_notes',   activeStatus: 'final_review' }
];

/**
 * Load all approver assignments.
 * Returns { approval1: [{user_id, user_name}], approval2: [] }
 * Returns null if the table doesn't exist (shows setup prompt in Settings).
 */
async function mcsApproversLoad() {
  try {
    const { data, error } = await supa
      .from('mcs_approver_settings')
      .select('step, user_id, user_name');

    if (error) {
      // Table does not exist yet — return a sentinel so Settings can show setup SQL
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return { _tableNotFound: true, approval1: [], approval2: [] };
      }
      throw error;
    }

    const config = { approval1: [], approval2: [] };
    (data || []).forEach(row => {
      // Support both old step keys (engineering/qa/manufacturing/management) and new keys
      let key = row.step;
      if (key === 'engineering' || key === 'manufacturing') key = 'approval1';
      if (key === 'qa' || key === 'management') key = 'approval2';
      if (config[key]) config[key].push({ user_id: row.user_id, user_name: row.user_name });
    });
    // De-duplicate (old data may have mapped multiple old steps to same new key)
    for (const k of ['approval1', 'approval2']) {
      const seen = new Set();
      config[k] = config[k].filter(u => {
        if (seen.has(u.user_id)) return false;
        seen.add(u.user_id);
        return true;
      });
    }
    return config;
  } catch (err) {
    console.error('[MCS Approvers] Load failed:', err);
    return null;
  }
}

/** Add a user as an approver for a step. */
async function mcsApproversAdd(step, userId, userName) {
  try {
    const { error } = await supa
      .from('mcs_approver_settings')
      .insert([{ step, user_id: userId, user_name: userName }]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[MCS Approvers] Add failed:', err);
    return false;
  }
}

/** Remove a user as an approver for a step. */
async function mcsApproversRemove(step, userId) {
  try {
    const { error } = await supa
      .from('mcs_approver_settings')
      .delete()
      .eq('step', step)
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[MCS Approvers] Remove failed:', err);
    return false;
  }
}

/**
 * Returns the step keys the current user is an approver for.
 * e.g. ['approval1'] or ['approval1', 'approval2']
 */
function mcsGetMyApproverSteps() {
  if (!mcsApproverConfig || !currentUser) return [];
  const myId = currentUser.id;
  return MCS_APPROVAL_STEPS
    .map(s => s.key)
    .filter(key => (mcsApproverConfig[key] || []).some(u => u.user_id === myId));
}

/** Returns true if the current user is an approver for the given step key. */
function mcsCanApproveStep(stepKey) {
  if (!stepKey || !currentUser || !mcsApproverConfig) return false;
  return (mcsApproverConfig[stepKey] || []).some(u => u.user_id === currentUser.id);
}

/**
 * Returns the active step key for a change based on its current status.
 * approval1 is active when status = 'review'
 * approval2 is active when status = 'final_review'
 */
function mcsGetActiveStepKey(change) {
  if (!change) return null;
  if (change.status === 'review') return 'approval1';
  if (change.status === 'final_review') return 'approval2';
  return null;
}

/**
 * Get pending MCS changes that need the current user's approval.
 * Uses mcsList (global) when populated; falls back to a Supabase query.
 * Returns array of { change, stepKey, stepLabel }.
 */
async function mcsGetPendingApprovalsForMe() {
  if (!currentUser || !mcsApproverConfig) return [];

  const mySteps = mcsGetMyApproverSteps();
  if (mySteps.length === 0) return [];

  // Helper: check if a change is pending approval at a given step
  function isPendingAtStep(change, stepKey) {
    const stepDef = MCS_APPROVAL_STEPS.find(s => s.key === stepKey);
    if (!stepDef) return false;
    // Change must be in the active status for this step
    if (change.status !== stepDef.activeStatus) return false;
    const s = change[stepDef.field];
    return !s || s === 'pending';
  }

  // Use mcsList if it's been populated
  const source = Array.isArray(mcsList) && mcsList.length > 0 ? mcsList : null;

  if (source) {
    const pending = [];
    source.forEach(change => {
      mySteps.forEach(stepKey => {
        if (isPendingAtStep(change, stepKey)) {
          const stepDef = MCS_APPROVAL_STEPS.find(s => s.key === stepKey);
          pending.push({ change, stepKey, stepLabel: stepDef ? stepDef.label : stepKey });
        }
      });
    });
    return pending;
  }

  // Fallback: query Supabase directly
  try {
    const { data, error } = await supa
      .from('mcs_changes')
      .select('*')
      .in('status', ['review', 'final_review']);
    if (error) throw error;

    const pending = [];
    (data || []).forEach(change => {
      mySteps.forEach(stepKey => {
        if (isPendingAtStep(change, stepKey)) {
          const stepDef = MCS_APPROVAL_STEPS.find(s => s.key === stepKey);
          pending.push({ change, stepKey, stepLabel: stepDef ? stepDef.label : stepKey });
        }
      });
    });
    return pending;
  } catch (err) {
    console.error('[MCS Approvers] Pending load failed:', err);
    return [];
  }
}
