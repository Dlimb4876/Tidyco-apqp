/**
 * MCS Approver Configuration — Data Layer
 *
 * Manages which users are assigned as approvers for each MCS approval step.
 * Approvers see pending changes in their Action Centre and can approve/reject
 * their designated step from the MCS view modal.
 *
 * Requires a Supabase table:
 *
 *   CREATE TABLE mcs_approver_settings (
 *     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     step       text NOT NULL,   -- engineering | qa | manufacturing | management
 *     user_id    uuid NOT NULL,
 *     user_name  text NOT NULL,
 *     created_at timestamptz DEFAULT now()
 *   );
 *   CREATE POLICY "auth" ON mcs_approver_settings
 *     FOR ALL USING (auth.role() = 'authenticated');
 */

// Canonical step definitions — order matters (sequential approval chain)
const MCS_APPROVAL_STEPS = [
  { key: 'engineering',   label: 'Engineering Review',     field: 'eng_review_status',          byField: 'eng_review_by',              atField: 'eng_review_at',              notesField: 'eng_review_notes' },
  { key: 'qa',            label: 'Quality Assurance',      field: 'qa_review_status',           byField: 'qa_review_by',               atField: 'qa_review_at',               notesField: 'qa_review_notes' },
  { key: 'manufacturing', label: 'Manufacturing Sign-off', field: 'mfg_signoff_status',         byField: 'mfg_signoff_by',             atField: 'mfg_signoff_at',             notesField: 'mfg_signoff_notes' },
  { key: 'management',    label: 'Management Auth.',       field: 'auth_implementation_status', byField: 'auth_implementation_by',     atField: 'auth_implementation_at',     notesField: 'auth_implementation_notes' }
];

/**
 * Load all approver assignments.
 * Returns { engineering: [{user_id, user_name}], qa: [], manufacturing: [], management: [] }
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
        return { _tableNotFound: true, engineering: [], qa: [], manufacturing: [], management: [] };
      }
      throw error;
    }

    const config = { engineering: [], qa: [], manufacturing: [], management: [] };
    (data || []).forEach(row => {
      if (config[row.step]) config[row.step].push({ user_id: row.user_id, user_name: row.user_name });
    });
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
 * e.g. ['engineering', 'qa']
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
 * Returns the active (first unapproved) step key for a change that is 'review',
 * or null if all steps are done.
 */
function mcsGetActiveStepKey(change) {
  if (!change || change.status !== 'review') return null;
  for (const step of MCS_APPROVAL_STEPS) {
    const s = change[step.field];
    if (!s || s === 'pending') return step.key;
    if (s === 'rejected') return null; // chain broken
  }
  return null; // all approved
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

  // Helper: check if a change is pending approval at a given step (and prior steps done)
  function isPendingAtStep(change, stepKey) {
    if (change.status !== 'review') return false;
    const stepIdx = MCS_APPROVAL_STEPS.findIndex(s => s.key === stepKey);
    if (stepIdx === -1) return false;
    // All prior steps must be approved
    for (let i = 0; i < stepIdx; i++) {
      if (MCS_APPROVAL_STEPS[i].field && change[MCS_APPROVAL_STEPS[i].field] !== 'approved') return false;
    }
    const stepField = MCS_APPROVAL_STEPS[stepIdx].field;
    const s = change[stepField];
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
      .eq('status', 'review');
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
