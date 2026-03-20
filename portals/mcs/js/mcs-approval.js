/**
 * MCS Approval Workflow
 *
 * MCO Process:
 *   open → review (Approval 1) → closed  [if rejected]
 *                              → implementing → final_review (Approval 2) → implementing  [if rejected]
 *                                                                          → implemented   [if approved → overhaul entry]
 */

/**
 * Approve the active step for a change.
 * approval1 approved → status becomes 'implementing'
 * approval2 approved → status becomes 'implemented' + overhaul entry created
 */
async function mcsApproveStep(changeId, step, notes) {
  const change = mcsList.find(c => c.id === changeId);
  if (!change) return false;

  const stepDef = MCS_APPROVAL_STEPS.find(s => s.key === step);
  if (!stepDef) return false;

  // Must be active step (correct status for this step)
  if (change.status !== stepDef.activeStatus) {
    console.warn('[MCS] Change status', change.status, 'does not match active status for step', step);
    return false;
  }

  try {
    const now = new Date().toISOString();
    const user = (currentUser && currentUser.email) ? currentUser.email : (currentUserRole || 'Unknown');

    // Determine next status
    const nextStatus = step === 'approval1' ? 'implementing' : 'implemented';

    const updateData = {
      [stepDef.field]: 'approved',
      [stepDef.byField]: user,
      [stepDef.atField]: now,
      [stepDef.notesField]: notes || '',
      status: nextStatus,
      updated_at: now
    };

    if (nextStatus === 'implemented') {
      updateData.implementation_date = now.split('T')[0];
    }

    const { error } = await supa
      .from('mcs_changes')
      .update(updateData)
      .eq('id', changeId);

    if (error) throw error;

    const idx = mcsList.findIndex(c => c.id === changeId);
    if (idx !== -1) {
      mcsList[idx] = { ...mcsList[idx], ...updateData };
    }

    // Log timeline entry
    const eventTypeMap = { approval1: 'eng_reviewed', approval2: 'authorized' };
    const label = stepDef.label;
    await mcsAddTimelineEntry(changeId, eventTypeMap[step] || 'edited', `${label} approved.`, user);

    // Approval 2 approved → auto-create overhaul history entry
    if (step === 'approval2' && change.affected_product_id) {
      const mergedChange = { ...change, ...updateData };
      await mcsCreateOverhaulHistoryEntry(mergedChange);
    }

    return true;
  } catch (err) {
    console.error('Error approving step:', err);
    return false;
  }
}

/**
 * Reject the active step for a change.
 * approval1 rejected → status becomes 'closed' (MCO terminated)
 * approval2 rejected → status returns to 'implementing' (try again)
 */
async function mcsRejectStep(changeId, step, reason) {
  const change = mcsList.find(c => c.id === changeId);
  if (!change) return false;

  const stepDef = MCS_APPROVAL_STEPS.find(s => s.key === step);
  if (!stepDef) return false;

  // Must be active step
  if (change.status !== stepDef.activeStatus) {
    console.warn('[MCS] Change status', change.status, 'does not match active status for step', step);
    return false;
  }

  try {
    const now = new Date().toISOString();
    const user = (currentUser && currentUser.email) ? currentUser.email : (currentUserRole || 'Unknown');

    // approval1 rejected → closed (terminated); approval2 rejected → back to implementing
    const nextStatus = step === 'approval1' ? 'closed' : 'implementing';

    const updateData = {
      [stepDef.field]: 'rejected',
      [stepDef.byField]: user,
      [stepDef.atField]: now,
      [stepDef.notesField]: reason || '',
      status: nextStatus,
      updated_at: now
    };

    // Reset approval2 fields when returning to implementing so it can be re-submitted
    if (step === 'approval2') {
      updateData.qa_review_status = 'pending';
      updateData.qa_review_by = null;
      updateData.qa_review_at = null;
      updateData.qa_review_notes = null;
    }

    const { error } = await supa
      .from('mcs_changes')
      .update(updateData)
      .eq('id', changeId);

    if (error) throw error;

    const idx = mcsList.findIndex(c => c.id === changeId);
    if (idx !== -1) {
      mcsList[idx] = { ...mcsList[idx], ...updateData };
    }

    const label = stepDef.label;
    const msg = step === 'approval1'
      ? `${label} rejected — MCO closed. Reason: ${reason || 'No reason provided'}`
      : `${label} rejected — returned to implementation. Reason: ${reason || 'No reason provided'}`;
    await mcsAddTimelineEntry(changeId, 'rejected', msg, user);

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
    const { error } = await supa
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
 * Create overhaul_history entry on implementation.
 * Called automatically when Approval 2 is approved.
 * This links MCO changes to product timeline (Overhaul Trends).
 *
 * overhaul_hours is calculated as: current product hours + estimated_time_impact_days
 * so the trends chart immediately reflects the new overhaul time.
 */
async function mcsCreateOverhaulHistoryEntry(change) {
  try {
    const implDate = change.implementation_date || new Date().toISOString().split('T')[0];

    // Calculate new overhaul hours: current hours + time impact delta
    const currentProduct = window.productsState && window.productsState.products
      ? window.productsState.products.find(p => p.id === change.affected_product_id)
      : null;
    const currentHours = currentProduct ? (currentProduct.current_overhaul_hours || 0) : 0;
    const timeImpact = change.estimated_time_impact_days || 0;
    const newOverhaulHours = currentHours + timeImpact;

    const { error } = await supa
      .from('overhaul_history')
      .insert([{
        product_id: change.affected_product_id,
        overhaul_hours: newOverhaulHours,
        effective_date: implDate,
        time_impact_days: timeImpact,
        schedule_impact_reason: change.time_impact_reason || '',
        mcs_reference_id: change.id,
        effective_from_date: implDate,
        estimated_recovery_date: change.recovery_target_date,
        is_mcs_triggered: true,
        change_reason: `MCO: ${change.change_type} - ${change.title}`,
        notes: change.justification || '',
        created_by_name: change.initiated_by || 'MCO System',
        user_id: change.initiated_by_user_id,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error creating overhaul entry:', error);
      return;
    }

    console.log('[MCS] Overhaul Trends entry created for:', change.id, '— new hours:', newOverhaulHours);

    // Update the product's current_overhaul_hours to reflect the new value
    if (currentProduct && typeof productsDataUpdateProduct === 'function') {
      await productsDataUpdateProduct(change.affected_product_id, {
        current_overhaul_hours: newOverhaulHours
      });
    }
  } catch (err) {
    console.error('Overhaul creation error:', err);
  }
}
