// js/features/hub.js

// ─────────────────────────────────────────────────────────────
// Hub widget helpers
// ─────────────────────────────────────────────────────────────

// Triggered after renderHub() paints the DOM so the action widget can
// load data without blocking the initial paint.
function hubInit() {
  if (typeof actionCentreLoad === 'function' && !actionCentreLoading && !actionCentreData) {
    actionCentreLoad();
  }
}

// Builds the "logged in as / my actions summary" widget shown at the top
// of the hub portal. Gracefully degrades when action data is not yet loaded.
function renderHubActionWidget() {
  const name = typeof actionCentreGetMyName === 'function'
    ? actionCentreGetMyName()
    : (typeof currentUser !== 'undefined' && currentUser
        ? (typeof emailToDisplayName === 'function' ? emailToDisplayName(currentUser.email) : currentUser.email)
        : '');

  let summaryHTML = '';
  let pendingApprovalCount = 0;

  if (actionCentreLoading) {
    summaryHTML = `<span class="hub-widget-loading">Loading actions…</span>`;
  } else if (actionCentreData && !actionCentreData.error) {
    const { actions = [], pfmea = [], risks = [], mcsApprovals = [] } = actionCentreData;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const totalOpen =
      actions.filter(a => a.status !== 'Closed').length +
      pfmea.length +
      risks.filter(r => r.status !== 'Closed').length;

    const totalOverdue =
      actions.filter(a => a.due_date && a.status !== 'Closed' && new Date(a.due_date) < today).length +
      pfmea.filter(p => p.action_due && new Date(p.action_due) < today).length;

    pendingApprovalCount = mcsApprovals.length;

    summaryHTML = `
      <div class="hub-widget-stats">
        <div class="hub-widget-stat">
          <span class="hub-widget-num">${totalOpen}</span>
          <span class="hub-widget-label">open</span>
        </div>
        <div class="hub-widget-stat">
          <span class="hub-widget-num${totalOverdue > 0 ? ' hub-widget-overdue' : ''}">${totalOverdue}</span>
          <span class="hub-widget-label">overdue</span>
        </div>
        ${pendingApprovalCount > 0 ? `
        <div class="hub-widget-stat">
          <span class="hub-widget-num hub-widget-pending">${pendingApprovalCount}</span>
          <span class="hub-widget-label">pending approval</span>
        </div>` : ''}
      </div>`;
  }

  return `
    <div class="hub-widget">
      <div class="hub-widget-user">
        <span class="hub-widget-avatar">👤</span>
        <div class="hub-widget-user-text">
          <div class="hub-widget-greeting">Logged in as</div>
          <div class="hub-widget-name">${esc(name)}</div>
        </div>
      </div>
      ${summaryHTML ? `<div class="hub-widget-sep"></div><div class="hub-widget-summary">${summaryHTML}</div>` : ''}
      <div class="hub-widget-cta">
        <button class="btn btn-primary btn-sm" onclick="navigate('action-centre')">✅ My Actions →</button>
        ${pendingApprovalCount > 0 ? `<button class="btn btn-sm hub-widget-approve-btn" onclick="navigate('mcs')">🔧 Review Changes →</button>` : ''}
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// Hub render
// ─────────────────────────────────────────────────────────────

function renderHub() {
  return `
    <div class="proj-home">
      ${renderHubActionWidget()}

      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Tidyco Operations Portal</div>
          <div class="proj-home-sub">Quality Planning, Production & Operations Control</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="showGuide('hub')" title="User Guide">❓ Guide</button>
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

        <div class="proj-card hub-card" onclick="navigate('mcs')">
          <div class="hub-card-content">
            <div class="hub-icon">🔧</div>
            <div class="proj-card-name">MANUFACTURING CHANGE SYSTEM</div>
            <div class="proj-card-meta">Engineering Change Requests & Approvals</div>
          </div>
        </div>
      </div>
    </div>`;
}
