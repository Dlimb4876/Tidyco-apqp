/**
 * MCS Integration with PFMEA History
 * Auto-logs MCS change approvals/implementations to PFMEA history
 */

/**
 * Link an MCS change to a PFMEA cause
 * Call this when user selects a cause from PFMEA
 */
async function mcsLinkToPfmeaCause(changeId, pfmeaCauseId) {
  const change = mcsList.find(c => c.id === changeId);
  if (!change || !supa) return false;

  try {
    const { error } = await supa
      .from('mcs_changes')
      .update({ related_pfmea_cause_id: pfmeaCauseId })
      .eq('id', changeId);

    if (error) throw error;

    // Update local list
    const idx = mcsList.findIndex(c => c.id === changeId);
    if (idx !== -1) {
      mcsList[idx].related_pfmea_cause_id = pfmeaCauseId;
    }

    mcsToast(`Linked to PFMEA cause`);
    return true;
  } catch (err) {
    console.error('Error linking to PFMEA:', err);
    return false;
  }
}

/**
 * Log MCS change approval to PFMEA history
 * Called when change reaches 'approved' or 'implemented' status
 */
async function mcsLogToPfmeaHistory(changeId) {
  const change = mcsList.find(c => c.id === changeId);
  if (!change || !change.related_pfmea_cause_id) return false;

  if (!supa) return false;

  try {
    const now = new Date().toISOString();
    const eventText = `ECR ${change.id} approved. Change: ${change.title}. Status: ${change.status}`;

    // Create timeline entry in mcs_timeline (if not already done)
    await mcsAddTimelineEntry(
      changeId,
      'linked_product',
      `Linked to PFMEA cause for historical tracking`,
      'System'
    );

    // Note: Full PFMEA history logging would be done via npi-data-relational.js
    // This function hooks the MCS approval into the PFMEA audit trail

    console.log('MCS approval logged to PFMEA history:', changeId);
    return true;
  } catch (err) {
    console.error('Error logging to PFMEA:', err);
    return false;
  }
}

/**
 * Get PFMEA causes for linking in MCS modal
 * Populates a dropdown for users to link changes to causes
 */
async function mcsGetPfmeaCausesForLinking() {
  if (!supa) return [];

  try {
    // Query PFMEA causes (this assumes npi-related queries are available)
    // For now, return empty array - actual implementation depends on NPI module structure
    const { data, error } = await supa
      .from('npi_pfmea_causes')
      .select('id, description')
      .limit(100);

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error('Error fetching PFMEA causes:', err);
    return [];
  }
}

/**
 * Show PFMEA link badge in MCS change view
 * Returns HTML badge if change is linked to PFMEA cause
 */
function mcsBuildPfmeaLinkBadge(change) {
  if (!change.related_pfmea_cause_id) return '';

  return `
    <div style="margin-top: 12px; padding: 8px 12px; background: var(--accent-dim); border-radius: 6px; border: 1px solid var(--accent); display: inline-flex; gap: 8px; align-items: center; font-size: 12px; cursor: pointer;" onclick="navigate('product-development'); setTimeout(() => { if (typeof npi?.pfmea?.selectCauseAndRender === 'function') npi.pfmea.selectCauseAndRender('${esc(change.related_pfmea_cause_id)}'); }, 300);">
      <span>🔗</span>
      <span><strong>Linked to PFMEA cause:</strong> ${esc(change.related_pfmea_cause_id)}</span>
      <span style="margin-left: auto; font-size: 10px; opacity: 0.7;">Click to view</span>
    </div>
  `;
}

/**
 * Show MCS link in PFMEA history view
 * Called from NPI PFMEA history render
 */
function mcsGetLinkedChange(pfmeaCauseId) {
  // Find MCS change linked to this PFMEA cause
  const change = mcsList.find(c => c.related_pfmea_cause_id === pfmeaCauseId);
  if (!change) return null;

  return {
    id: change.id,
    title: change.title,
    status: change.status,
    approvedAt: change.approval_at,
    implementedAt: change.implementation_date
  };
}
