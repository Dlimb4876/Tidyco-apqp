// js/features/hub.js

// ── Pending gate sign-offs helper ─────────────────────────────
// Returns count of (project, gate) pairs where all checklist items are checked
// but at least one signatory has not yet signed.
function hubPendingGateSignOffs() {
  let total = 0;
  (db?.projects || []).forEach(proj => {
    (proj.gates || []).forEach(g => {
      const allChecked = Array.isArray(g.checks) && g.checks.length > 0 && g.checks.every(c => c === true);
      const hasUnsigned = Array.isArray(g.sigs) && g.sigs.some(s => !s.signed);
      if (allChecked && hasUnsigned) total++;
    });
  });
  return total;
}

// ── Derive display name from email (e.g. "daniel.limb" → "Daniel Limb") ──
function hubNameFromEmail(email) {
  if (!email) return 'Unknown';
  return email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function renderHub() {
  // ── "Logged in as" user widget ──────────────────────────────
  const canApprove = currentUserProfile && currentUserProfile.role === 'admin';
  const pendingCount = canApprove ? hubPendingGateSignOffs() : 0;

  const rawName = (currentUserProfile && currentUserProfile.full_name)
    ? currentUserProfile.full_name
    : hubNameFromEmail(currentUser && currentUser.email);
  const email = (currentUser && currentUser.email) ? currentUser.email : '';
  const role  = (currentUserProfile && currentUserProfile.role) ? currentUserProfile.role : 'user';

  const pendingBanner = (canApprove && pendingCount > 0) ? `
      <button class="hub-pending-approvals" onclick="navigate('product-development')" title="Navigate to NPI to review pending sign-offs">
        <span class="hub-approvals-badge">${pendingCount}</span>
        <span class="hub-approvals-label">pending gate sign-off${pendingCount !== 1 ? 's' : ''} awaiting your approval — click to review</span>
        <span class="hub-approvals-arrow">→</span>
      </button>` : '';

  return `
    <div class="proj-home">
      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Tidyco Operations Portal</div>
          <div class="proj-home-sub">Quality Planning, Production & Operations Control</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="showGuide('hub')" title="User Guide">❓ Guide</button>
      </div>

      <div class="hub-user-widget">
        <div class="hub-user-info">
          <span class="hub-user-avatar">👤</span>
          <div class="hub-user-details">
            <div class="hub-user-name">${esc(rawName)}</div>
            <div class="hub-user-email">${esc(email)}</div>
          </div>
          <span class="permissions-badge">${esc(role)}</span>
        </div>${pendingBanner}
      </div>

      <div class="proj-cards hub-grid">
        <div class="proj-card hub-card" onclick="navigate('capacity')">
          <div class="hub-card-content">
            <div class="hub-icon">📊</div>
            <div class="proj-card-name">CAPACITY</div>
            <div class="proj-card-meta">Load Capacity Planning</div>
          </div>
        </div>

        <div class="proj-card hub-card" onclick="navigate('product-development')">
          <div class="hub-card-content">
            <div class="hub-icon">🚀</div>
            <div class="proj-card-name">PRODUCT DEVELOPMENT</div>
            <div class="proj-card-meta">NPI & Product Management</div>
          </div>
        </div>

        <div class="proj-card hub-card" onclick="navigate('production')">
          <div class="hub-card-content">
            <div class="hub-icon">🏭</div>
            <div class="proj-card-name">PRODUCTION</div>
            <div class="proj-card-meta">Batch Scheduling & Planning</div>
          </div>
        </div>

        <div class="proj-card hub-card" onclick="navigate('operations')">
          <div class="hub-card-content">
            <div class="hub-icon">🛰️</div>
            <div class="proj-card-name">OPERATIONS DASHBOARD</div>
            <div class="proj-card-meta">Unified overview of all operations, metrics, and risks</div>
          </div>
        </div>
      </div>
    </div>`;
}
