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
    // 1. Link the MCS change to the PFMEA cause
    const { error: mcsError } = await supa
      .from('mcs_changes')
      .update({ related_pfmea_cause_id: pfmeaCauseId })
      .eq('id', changeId);

    if (mcsError) throw mcsError;

    // 2. Store ECR reference in PFMEA cause's action field
    const { error: pfmeaError } = await supa
      .from('npi_pfmea_causes')
      .update({ action_related_ecr_id: changeId })
      .eq('id', pfmeaCauseId);

    if (pfmeaError) throw pfmeaError;

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
  // DEPRECATED: PFMEA history is logged manually by the user
  // after they assess the change impact and determine new OCC/DET ratings.
  // The history entry includes related_ecr_id for traceability.
  console.log('PFMEA history logging is now manual. Link ECR via mcsLinkToPfmeaCause instead.');
  return false;
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
/**
 * Build PFMEA linking section HTML for MCS modal
 * Shows current link status and allows user to link to a PFMEA cause
 */
function mcsBuildPfmeaLinkingSection(change, pfmeaCauses) {
  const currentLink = change.related_pfmea_cause_id ? 
    pfmeaCauses.find(c => c.id === change.related_pfmea_cause_id) : null;
  
  const causesOptions = pfmeaCauses
    .map(c => `<option value="${esc(c.id)}" ${change.related_pfmea_cause_id === c.id ? 'selected' : ''}>${esc(c.description)}</option>`)
    .join('');

  return `
    <div class="mcs-section-title">PFMEA Linking</div>
    <div style="margin-bottom: 12px; padding: 8px 12px; background: var(--surface2); border-radius: 6px; border-left: 3px solid var(--accent); font-size: 13px;">
      Link this change to a PFMEA cause to track impact. After the change is implemented, manually log the new ratings to PFMEA history.
    </div>
    <div class="mcs-field-group mcs-modal-grid full">
      <div class="mcs-field-label">Select PFMEA Cause to Address</div>
      <select class="mcs-field-select" id="mcs-f-pfmea-cause">
        <option value="">— No link —</option>
        ${causesOptions}
      </select>
    </div>
    ${currentLink ? `
    <div style="margin-top: 8px; padding: 8px; background: var(--accent-dim); border-radius: 4px; border: 1px solid var(--accent); font-size: 12px;">
      <strong>Currently linked to:</strong> ${esc(currentLink.description)}
      <button style="margin-left: 8px; padding: 2px 8px; background: transparent; border: 1px solid var(--accent); border-radius: 3px; cursor: pointer; font-size: 11px;" onclick="document.getElementById('mcs-f-pfmea-cause').value = ''; mcsToast('Link cleared. Save to apply.');">Clear link</button>
    </div>
    ` : ''}
  `;
}

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
