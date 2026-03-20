/**
 * MCS Approver Configuration — Data Layer
 *
 * Stores approver assignments in the existing global_settings table
 * (setting_key: 'mcs_approver_approval1' / 'mcs_approver_approval2',
 *  setting_value: JSON array of {user_id, user_name}).
 * Falls back to localStorage when global_settings is not available.
 * No separate table setup required.
 *
 * MCO Process:
 *   1. Open + Impact Assessment
 *   2. Approval 1  → REJECT = Closed | APPROVE → Implementing
 *   3. Implement
 *   4. Approval 2  → REJECT = Back to Implementing | APPROVE → Implemented
 */

// Canonical step definitions — order matters (sequential approval chain)
const MCS_APPROVAL_STEPS = [
  { key: 'approval1', label: 'Approval 1',  field: 'eng_review_status', byField: 'eng_review_by', atField: 'eng_review_at', notesField: 'eng_review_notes',  activeStatus: 'review' },
  { key: 'approval2', label: 'Approval 2',  field: 'qa_review_status',  byField: 'qa_review_by',  atField: 'qa_review_at',  notesField: 'qa_review_notes',   activeStatus: 'final_review' }
];

const MCS_APPROVER_SETTING_KEYS = {
  approval1: 'mcs_approver_approval1',
  approval2: 'mcs_approver_approval2'
};

/** Parse a JSON setting_value safely, returning [] on failure. */
function _mcsParseSetting(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Load approver assignments.
 * Reads from global_settings, falls back to localStorage.
 * Returns { approval1: [{user_id, user_name}], approval2: [] }
 */
async function mcsApproversLoad() {
  const config = { approval1: [], approval2: [] };

  try {
    const { data, error } = await supa
      .from('global_settings')
      .select('setting_key, setting_value')
      .in('setting_key', Object.values(MCS_APPROVER_SETTING_KEYS));

    if (!error) {
      const foundKeys = new Set();
      (data || []).forEach(row => {
        const key = row.setting_key === MCS_APPROVER_SETTING_KEYS.approval1 ? 'approval1' : 'approval2';
        config[key] = _mcsParseSetting(row.setting_value);
        foundKeys.add(row.setting_key);
      });
      // Only overwrite localStorage for keys that were actually returned from Supabase.
      // If a key is missing from the DB response, the localStorage copy (which may have
      // been saved earlier) is preserved as the source of truth.
      if (foundKeys.has(MCS_APPROVER_SETTING_KEYS.approval1)) {
        localStorage.setItem(MCS_APPROVER_SETTING_KEYS.approval1, JSON.stringify(config.approval1));
      } else {
        config.approval1 = _mcsParseSetting(localStorage.getItem(MCS_APPROVER_SETTING_KEYS.approval1));
      }
      if (foundKeys.has(MCS_APPROVER_SETTING_KEYS.approval2)) {
        localStorage.setItem(MCS_APPROVER_SETTING_KEYS.approval2, JSON.stringify(config.approval2));
      } else {
        config.approval2 = _mcsParseSetting(localStorage.getItem(MCS_APPROVER_SETTING_KEYS.approval2));
      }
      return config;
    }
  } catch (err) {
    console.debug('[MCS Approvers] global_settings unavailable, using localStorage');
  }

  // Fallback: localStorage
  config.approval1 = _mcsParseSetting(localStorage.getItem(MCS_APPROVER_SETTING_KEYS.approval1));
  config.approval2 = _mcsParseSetting(localStorage.getItem(MCS_APPROVER_SETTING_KEYS.approval2));
  return config;
}

/** Persist a step's approver list to global_settings (+ localStorage). */
async function _mcsSaveApproverList(stepKey, list) {
  const settingKey = MCS_APPROVER_SETTING_KEYS[stepKey];
  const json = JSON.stringify(list);

  // Always write localStorage so it works even without global_settings
  localStorage.setItem(settingKey, json);

  try {
    const { data: existing } = await supa
      .from('global_settings')
      .select('id')
      .eq('setting_key', settingKey)
      .maybeSingle();

    if (existing) {
      await supa
        .from('global_settings')
        .update({ setting_value: json, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supa
        .from('global_settings')
        .insert([{ setting_key: settingKey, setting_value: json }]);
    }
  } catch (err) {
    console.debug('[MCS Approvers] Could not save to global_settings, localStorage used');
  }
}

/** Add a user as an approver for a step. */
async function mcsApproversAdd(stepKey, userId, userName, userEmail) {
  const current = (mcsApproverConfig && mcsApproverConfig[stepKey]) ||
    _mcsParseSetting(localStorage.getItem(MCS_APPROVER_SETTING_KEYS[stepKey]));

  // Skip duplicates
  if (current.some(u => u.user_id === userId)) return true;

  const entry = { user_id: userId, user_name: userName };
  if (userEmail) entry.user_email = userEmail;
  const newList = [...current, entry];
  await _mcsSaveApproverList(stepKey, newList);
  return true;
}

/** Remove a user as an approver for a step. */
async function mcsApproversRemove(stepKey, userId) {
  const current = (mcsApproverConfig && mcsApproverConfig[stepKey]) ||
    _mcsParseSetting(localStorage.getItem(MCS_APPROVER_SETTING_KEYS[stepKey]));

  const newList = current.filter(u => u.user_id !== userId);
  await _mcsSaveApproverList(stepKey, newList);
  return true;
}

/**
 * Returns the step keys the current user is an approver for.
 * e.g. ['approval1'] or ['approval1', 'approval2']
 * Checks both user_id and user_email to match how mcsCanApproveStep works.
 */
function mcsGetMyApproverSteps() {
  if (!mcsApproverConfig || !currentUser) return [];
  const myId = currentUser.id;
  const myEmail = (currentUser.email || '').toLowerCase();
  return MCS_APPROVAL_STEPS
    .map(s => s.key)
    .filter(key => (mcsApproverConfig[key] || []).some(u =>
      (myId && u.user_id && u.user_id === myId) ||
      (myEmail && u.user_email && u.user_email.toLowerCase() === myEmail)
    ));
}

/**
 * Returns true if the current user is an approver for the given step key.
 * Falls back to any canEdit() user when no specific approvers are assigned.
 * Checks both user_id (UUID) and user_email to handle any ID/email mismatch.
 * Also honours per-change nominated approvers stored in eng_review_notes.
 *
 * @param {string} stepKey - 'approval1' | 'approval2'
 * @param {object} [change] - The specific change being viewed (optional).
 *   When provided, also checks if the current user was nominated for this change.
 */
function mcsCanApproveStep(stepKey, change) {
  if (!stepKey || !currentUser) return false;

  const myId = currentUser.id;
  const myEmail = (currentUser.email || '').toLowerCase();

  // Check per-change nominated approver (only applies to approval1 step).
  // Stored in eng_review_notes as "nominated_approver:<email>" when raising.
  if (stepKey === 'approval1' && change && change.eng_review_notes) {
    const notes = change.eng_review_notes;
    if (notes.startsWith('nominated_approver:')) {
      const nominatedEmail = notes.slice('nominated_approver:'.length).trim().toLowerCase();
      if (nominatedEmail && myEmail && nominatedEmail === myEmail) return true;
    }
  }

  // Config not loaded yet — fall back to role-based edit permission
  if (!mcsApproverConfig) {
    return typeof canEdit === 'function' && canEdit();
  }
  const assigned = mcsApproverConfig[stepKey] || [];
  // No approvers assigned → anyone who can edit may approve
  if (assigned.length === 0) {
    return typeof canEdit === 'function' && canEdit();
  }
  return assigned.some(u =>
    (myId && u.user_id && u.user_id === myId) ||
    (myEmail && u.user_email && u.user_email.toLowerCase() === myEmail)
  );
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

  function isPendingAtStep(change, stepKey) {
    const stepDef = MCS_APPROVAL_STEPS.find(s => s.key === stepKey);
    if (!stepDef) return false;
    if (change.status !== stepDef.activeStatus) return false;
    const s = change[stepDef.field];
    return !s || s === 'pending';
  }

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
