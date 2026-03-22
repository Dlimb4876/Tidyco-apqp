/**
 * MCS (Manufacturing Change) - Main Portal
 * Handles list rendering, filtering, sorting, and user interactions
 */

// MCS State (global - initialized in state.js)
// let mcsList = [];
// let mcsCurrentFilter = { status: 'all', priority: 'all', type: 'all', source: 'all' };
// let mcsViewingId = null;
// let mcsEditingId = null;
// let mcsLoading = false;

/**
 * Initialize MCS portal
 */
async function renderMcs() {
  const container = document.getElementById('mainContent');
  if (!container) return;

  // Create portal shell
  container.innerHTML = `
    <div class="mcs-layout">
      <div class="mcs-portal">
        <div class="mcs-toolbar">
          <div class="mcs-toolbar-title">Change Register <span class="mcs-toolbar-count" id="mcs-list-count"></span></div>
          <div class="mcs-toolbar-controls">
            <span class="mcs-sort-label">SORT:</span>
            <select class="mcs-sort-select" id="mcs-sort-select" onchange="mcsRenderList()">
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
            <button class="btn btn-ghost btn-sm" onclick="showGuide('mcs')" title="User Guide">❓ Guide</button>
            <button class="btn btn-primary btn-sm" onclick="mcsOpenNewChange()">+ Raise a Change</button>
          </div>
        </div>
        <div class="mcs-kpi-bar" id="mcs-kpi-bar">
          <div class="mcs-kpi-card kpi-open" onclick="mcsSetFilter('status', 'open', null)" title="Filter: Open">
            <div class="mcs-kpi-value" id="mcs-kpi-open">0</div>
            <div class="mcs-kpi-label">Open</div>
          </div>
          <div class="mcs-kpi-card kpi-review" onclick="mcsKpiFilterAwaiting()" title="Filter: Awaiting Approval">
            <div class="mcs-kpi-value" id="mcs-kpi-review">0</div>
            <div class="mcs-kpi-label">Awaiting Approval</div>
          </div>
          <div class="mcs-kpi-card kpi-overdue" onclick="mcsToggleQuickFilter('overdueOnly', true)" title="Filter: Overdue">
            <div class="mcs-kpi-value" id="mcs-kpi-overdue">0</div>
            <div class="mcs-kpi-label">Overdue</div>
          </div>
          <div class="mcs-kpi-card kpi-week" title="Created this week">
            <div class="mcs-kpi-value" id="mcs-kpi-week">0</div>
            <div class="mcs-kpi-label">This Week</div>
          </div>
        </div>
        <div class="mcs-list" id="mcs-list-container"></div>
      </div>

      <aside class="mcs-sidebar">
        <div class="mcs-search-wrap">
          <input class="mcs-search-input" placeholder="Search changes..." id="mcs-search-input" oninput="mcsRenderList()" />
        </div>

        <div class="mcs-filter-section" id="mcs-section-status">
          <button class="mcs-section-toggle" onclick="mcsToggleSection('status')">
            <span>Status</span><span class="mcs-toggle-icon" id="mcs-icon-status">▼</span>
          </button>
          <div class="mcs-section-body" id="mcs-body-status">
            <button class="mcs-filter-btn active" onclick="mcsSetFilter('status', 'all', this)">
              All Changes <span class="mcs-filter-count" id="mcs-fc-all">0</span>
            </button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('status', 'open', this)">
              Open <span class="mcs-filter-count" id="mcs-fc-open">0</span>
            </button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('status', 'review', this)">
              Awaiting Approval 1 <span class="mcs-filter-count" id="mcs-fc-review">0</span>
            </button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('status', 'implementing', this)">
              Implementing <span class="mcs-filter-count" id="mcs-fc-implementing">0</span>
            </button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('status', 'final_review', this)">
              Awaiting Approval 2 <span class="mcs-filter-count" id="mcs-fc-final_review">0</span>
            </button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('status', 'implemented', this)">
              Implemented <span class="mcs-filter-count" id="mcs-fc-implemented">0</span>
            </button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('status', 'closed', this)">
              Closed <span class="mcs-filter-count" id="mcs-fc-closed">0</span>
            </button>
          </div>
        </div>

        <div class="mcs-filter-section" id="mcs-section-priority">
          <button class="mcs-section-toggle" onclick="mcsToggleSection('priority')">
            <span>Priority</span><span class="mcs-toggle-icon" id="mcs-icon-priority">▶</span>
          </button>
          <div class="mcs-section-body" id="mcs-body-priority" style="display:none">
            <button class="mcs-filter-btn" onclick="mcsSetFilter('priority', 'critical', this)">
              Critical <span class="mcs-filter-count" id="mcs-fc-critical">0</span>
            </button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('priority', 'high', this)">
              High <span class="mcs-filter-count" id="mcs-fc-high">0</span>
            </button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('priority', 'medium', this)">
              Medium <span class="mcs-filter-count" id="mcs-fc-medium">0</span>
            </button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('priority', 'low', this)">
              Low <span class="mcs-filter-count" id="mcs-fc-low">0</span>
            </button>
          </div>
        </div>

        <div class="mcs-filter-section" id="mcs-section-type">
          <button class="mcs-section-toggle" onclick="mcsToggleSection('type')">
            <span>Change Type</span><span class="mcs-toggle-icon" id="mcs-icon-type">▶</span>
          </button>
          <div class="mcs-section-body" id="mcs-body-type" style="display:none">
            <button class="mcs-filter-btn" onclick="mcsSetFilter('type', 'Engineering', this)">Engineering</button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('type', 'Process', this)">Process</button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('type', 'Material', this)">Material</button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('type', 'Tooling', this)">Tooling</button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('type', 'Quality', this)">Quality</button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('type', 'Safety', this)">Safety</button>
          </div>
        </div>

        <div class="mcs-filter-section" id="mcs-section-source">
          <button class="mcs-section-toggle" onclick="mcsToggleSection('source')">
            <span>Source</span><span class="mcs-toggle-icon" id="mcs-icon-source">▶</span>
          </button>
          <div class="mcs-section-body" id="mcs-body-source" style="display:none">
            <button class="mcs-filter-btn" onclick="mcsSetFilter('source', 'Manual', this)">Manual</button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('source', 'PFMEA', this)">PFMEA</button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('source', 'Risk', this)">Risk</button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('source', 'Customer', this)">Customer</button>
            <button class="mcs-filter-btn" onclick="mcsSetFilter('source', 'Quality', this)">Quality</button>
          </div>
        </div>

        <div class="mcs-filter-section" id="mcs-section-quick">
          <button class="mcs-section-toggle" onclick="mcsToggleSection('quick')">
            <span>Quick Filters</span><span class="mcs-toggle-icon" id="mcs-icon-quick">▼</span>
          </button>
          <div class="mcs-section-body" id="mcs-body-quick">
            <label class="mcs-quick-filter-label">
              <input type="checkbox" id="mcs-qf-mychanges" onchange="mcsToggleQuickFilter('myChanges', this.checked)" />
              My Changes
            </label>
            <label class="mcs-quick-filter-label">
              <input type="checkbox" id="mcs-qf-overdue" onchange="mcsToggleQuickFilter('overdueOnly', this.checked)" />
              Overdue Only
            </label>
            <label class="mcs-quick-filter-label">
              <input type="checkbox" id="mcs-qf-highpri" onchange="mcsToggleQuickFilter('highPriority', this.checked)" />
              High Priority
            </label>
          </div>
        </div>

        <div class="mcs-filter-section" id="mcs-section-date">
          <button class="mcs-section-toggle" onclick="mcsToggleSection('date')">
            <span>Date Range</span><span class="mcs-toggle-icon" id="mcs-icon-date">▶</span>
          </button>
          <div class="mcs-section-body" id="mcs-body-date" style="display:none">
            <select class="mcs-date-range-select" id="mcs-date-range" onchange="mcsSetDateRange(this.value)">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
        </div>

        <div style="padding: 8px 0;">
          <button class="mcs-clear-filters" onclick="mcsClearFilters()">✕ Clear All Filters</button>
        </div>
      </aside>
    </div>
  `;

  // Load changes and approver config in parallel.
  // Always reload the approver config so permission changes made in Settings
  // take effect immediately without requiring a page refresh.
  await Promise.all([
    mcsLoadChanges(),
    (async () => {
      if (typeof mcsApproversLoad === 'function' && !mcsApproverConfigLoading) {
        mcsApproverConfigLoading = true;
        mcsApproverConfig = await mcsApproversLoad();
        mcsApproverConfigLoading = false;
      }
    })()
  ]);

  mcsRenderList();

  // Auto-open a specific change if requested (e.g. from Action Centre)
  if (mcsAutoViewId) {
    const autoId = mcsAutoViewId;
    mcsAutoViewId = null;
    mcsViewChange(autoId);
  }
}

/**
 * Load changes from Supabase
 */
async function mcsLoadChanges() {
  mcsLoading = true;
  try {
    if (!supa) {
      console.error('Supabase not initialized');
      mcsList = [];
      return;
    }

    const { data, error } = await supa
      .from('mcs_changes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading MCS changes:', error);
      mcsList = [];
      return;
    }

    // Load all impacts and group by change_id
    const { data: impactsData } = await supa
      .from('mcs_impacts')
      .select('change_id, impact_type');

    const impactsByChange = {};
    (impactsData || []).forEach(imp => {
      if (!impactsByChange[imp.change_id]) impactsByChange[imp.change_id] = [];
      impactsByChange[imp.change_id].push(imp.impact_type);
    });

    mcsList = (data || []).map(change => ({
      ...change,
      impacts: impactsByChange[change.id] || []
    }));
  } catch (err) {
    console.error('MCS load error:', err);
    mcsList = [];
  } finally {
    mcsLoading = false;
  }
}

/**
 * Set filter and re-render list
 */
function mcsSetFilter(filterType, value, el) {
  mcsCurrentFilter = { ...mcsCurrentFilter, [filterType]: value };

  // Update active button styling
  if (el) {
    const buttons = el.parentElement.querySelectorAll('.mcs-filter-btn');
    buttons.forEach(b => b.classList.remove('active'));
    el.classList.add('active');
  }

  mcsRenderList();
}

/**
 * Get filtered and sorted changes
 */
function mcsGetFiltered() {
  const q = document.getElementById('mcs-search-input')?.value.toLowerCase() || '';

  let filtered = mcsList.filter(change => {
    // Search filter (includes description)
    if (q) {
      const searchText = (
        change.title + ' ' +
        change.id + ' ' +
        (change.part_drawing_no || '') + ' ' +
        (change.initiated_by || '') + ' ' +
        change.change_type + ' ' +
        (change.description || '')
      ).toLowerCase();

      if (!searchText.includes(q)) return false;
    }

    // Status filter — 'closed' also matches legacy 'rejected'/'approved'
    if (mcsCurrentFilter.status !== 'all') {
      const matchClosed = mcsCurrentFilter.status === 'closed' &&
        (change.status === 'closed' || change.status === 'rejected' || change.status === 'approved');
      if (!matchClosed && change.status !== mcsCurrentFilter.status) return false;
    }

    // Priority filter
    if (mcsCurrentFilter.priority !== 'all' && change.priority !== mcsCurrentFilter.priority) {
      return false;
    }

    // Type filter
    if (mcsCurrentFilter.type !== 'all' && change.change_type !== mcsCurrentFilter.type) {
      return false;
    }

    // Source filter
    if (mcsCurrentFilter.source !== 'all' && change.change_source !== mcsCurrentFilter.source) {
      return false;
    }

    // Quick filter: My Changes
    if (mcsCurrentFilter.myChanges) {
      const email = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.email : null;
      if (!email || change.initiated_by !== email) return false;
    }

    // Quick filter: Overdue Only
    if (mcsCurrentFilter.overdueOnly && !mcsIsOverdue(change)) return false;

    // Quick filter: High Priority
    if (mcsCurrentFilter.highPriority && change.priority !== 'critical' && change.priority !== 'high') {
      return false;
    }

    // Date range filter (by created_at)
    if (mcsCurrentFilter.dateRange !== 'all' && change.created_at) {
      const created = new Date(change.created_at);
      const now = new Date();
      if (mcsCurrentFilter.dateRange === 'today') {
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
        if (created < todayStart) return false;
      } else if (mcsCurrentFilter.dateRange === 'week') {
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
        if (created < weekStart) return false;
      } else if (mcsCurrentFilter.dateRange === 'month') {
        const monthStart = new Date(now); monthStart.setDate(now.getDate() - 30);
        if (created < monthStart) return false;
      } else if (mcsCurrentFilter.dateRange === 'quarter') {
        const quarterStart = new Date(now); quarterStart.setDate(now.getDate() - 90);
        if (created < quarterStart) return false;
      }
    }

    return true;
  });

  // Sort
  const sortKey = document.getElementById('mcs-sort-select')?.value || 'date-desc';
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const statusOrder = { open: 0, review: 1, implementing: 2, final_review: 3, implemented: 4, closed: 5, approved: 4, rejected: 5 };

  if (sortKey === 'date-desc') {
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (sortKey === 'date-asc') {
    filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else if (sortKey === 'priority') {
    filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  } else if (sortKey === 'status') {
    filtered.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  }

  return filtered;
}

/**
 * Update filter counts and KPI bar
 */
function mcsUpdateCounts() {
  const counts = {
    all: mcsList.length,
    open: 0,
    review: 0,
    implementing: 0,
    final_review: 0,
    implemented: 0,
    closed: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  let overdueCount = 0;
  let thisWeekCount = 0;

  mcsList.forEach(change => {
    if (counts[change.status] !== undefined) counts[change.status]++;
    // Legacy: treat old 'rejected'/'approved' statuses as 'closed'
    if (change.status === 'rejected' || change.status === 'approved') counts.closed++;
    if (counts[change.priority] !== undefined) counts[change.priority]++;

    // KPI: overdue
    if (mcsIsOverdue(change)) overdueCount++;

    // KPI: created this week
    if (change.created_at) {
      const created = new Date(change.created_at);
      if (created >= weekAgo) thisWeekCount++;
    }
  });

  // Sidebar counts
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('mcs-fc-all', counts.all);
  setEl('mcs-fc-open', counts.open);
  setEl('mcs-fc-review', counts.review);
  setEl('mcs-fc-implementing', counts.implementing);
  setEl('mcs-fc-final_review', counts.final_review);
  setEl('mcs-fc-implemented', counts.implemented);
  setEl('mcs-fc-closed', counts.closed);
  setEl('mcs-fc-critical', counts.critical);
  setEl('mcs-fc-high', counts.high);
  setEl('mcs-fc-medium', counts.medium);
  setEl('mcs-fc-low', counts.low);

  // KPI bar counts
  setEl('mcs-kpi-open', counts.open);
  setEl('mcs-kpi-review', counts.review + counts.final_review);
  setEl('mcs-kpi-overdue', overdueCount);
  setEl('mcs-kpi-week', thisWeekCount);
}

/**
 * Render change list
 */
function mcsRenderList() {
  mcsUpdateCounts();

  const filtered = mcsGetFiltered();
  const container = document.getElementById('mcs-list-container');
  const countEl = document.getElementById('mcs-list-count');

  if (!container) return;

  countEl.textContent = `(${filtered.length})`;

  if (filtered.length === 0) {
    const isFiltered = mcsCurrentFilter.status !== 'all' || mcsCurrentFilter.priority !== 'all' ||
      mcsCurrentFilter.type !== 'all' || mcsCurrentFilter.source !== 'all' ||
      (document.getElementById('mcs-search-input')?.value?.trim() || '') !== '';
    container.innerHTML = isFiltered
      ? `<div class="mcs-empty-state">
          <div class="mcs-empty-icon">🔍</div>
          <div class="mcs-empty-text">No changes match your filters</div>
          <div class="mcs-empty-sub">Try adjusting the filters or search term</div>
        </div>`
      : `<div class="mcs-empty-state">
          <div class="mcs-empty-icon">📋</div>
          <div class="mcs-empty-text">No change requests yet</div>
          <div class="mcs-empty-sub">Click <strong>+ Raise a Change</strong> in the toolbar to log your first engineering change request.</div>
        </div>`;
    return;
  }

  container.innerHTML = filtered.map(change => {
    const impactCount = (change.impacts || []).length;
    const impactStr = impactCount > 0
      ? `${impactCount} impact${impactCount !== 1 ? 's' : ''}`
      : 'No impacts';
    const overdue = mcsIsOverdue(change);
    const targetStr = change.target_implementation
      ? `<span class="${overdue ? 'mcs-overdue-date' : ''}">🎯 ${change.target_implementation}${overdue ? ' ⚠' : ''}</span>`
      : '';
    const partStr = change.part_drawing_no
      ? `<span>📦 ${esc(change.part_drawing_no)}</span>`
      : '';
    const timeStr = change.estimated_time_impact_hours
      ? `<div class="mcs-card-time-impact">⏱ ${change.estimated_time_impact_hours > 0 ? '+' : ''}${change.estimated_time_impact_hours}h</div>`
      : '';

    return `
    <div class="mcs-card status-${change.status}" onclick="mcsViewChange('${esc(change.id)}')">
      <div class="mcs-card-header">
        <div class="mcs-card-ref">${esc(change.id)}</div>
        <span class="mcs-status-pill mcs-status-${change.status}">${mcStatusLabel(change.status)}</span>
      </div>
      <div class="mcs-card-title">${esc(change.title)}</div>
      <div class="mcs-card-meta">
        <div class="mcs-card-meta-left">
          <span class="mcs-tag">${esc(change.change_type)}</span>
          <span class="mcs-priority-badge mcs-priority-${change.priority}">${change.priority}</span>
        </div>
        <div class="mcs-card-meta-right">
          <div class="mcs-card-impacts">${impactStr}</div>
          ${timeStr}
        </div>
      </div>
      <div class="mcs-card-sep"></div>
      <div class="mcs-card-submeta">
        <span>👤 ${esc(change.initiated_by || 'Unknown')}</span>
        ${partStr}
        <span>📅 ${change.created_at ? change.created_at.split('T')[0] : '—'}</span>
        ${targetStr}
      </div>
    </div>`;
  }).join('');
}

/**
 * Get status label
 */
function mcStatusLabel(status) {
  const labels = {
    open: 'Open',
    review: 'Awaiting Approval 1',
    implementing: 'Implementing',
    final_review: 'Awaiting Approval 2',
    implemented: 'Implemented',
    closed: 'Closed',
    // Legacy values from before the process rework
    approved: 'Approved',
    rejected: 'Closed'
  };
  return labels[status] || status;
}

/**
 * View change details
 */
async function mcsViewChange(id) {
  mcsViewingId = id;
  const change = mcsList.find(c => c.id === id);
  if (!change) return;

  // Load timeline from mcs_timeline table
  const { data: timelineData } = await supa
    .from('mcs_timeline')
    .select('*')
    .eq('change_id', id)
    .order('created_at', { ascending: true });

  change.timeline = mcsFormatTimelineEvents(timelineData || []);

  // Show modal (handled by mcs-modal.js)
  mcsShowViewModal(change);
}

/**
 * New change button handler
 */
function mcsOpenNewChange() {
  mcsEditingId = null;
  mcsShowCreateModal();
}

/**
 * Check if a change is overdue (target date passed, status not closed/implemented)
 */
function mcsIsOverdue(change) {
  if (!change.target_implementation) return false;
  const closedStatuses = ['closed', 'implemented', 'rejected', 'approved'];
  if (closedStatuses.includes(change.status)) return false;
  const target = new Date(change.target_implementation);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target < today;
}

/**
 * Toggle accordion sidebar section
 */
function mcsToggleSection(section) {
  const body = document.getElementById(`mcs-body-${section}`);
  const icon = document.getElementById(`mcs-icon-${section}`);
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : '';
  if (icon) icon.textContent = isOpen ? '▶' : '▼';
}

/**
 * Toggle a quick filter checkbox
 */
function mcsToggleQuickFilter(key, value) {
  mcsCurrentFilter = { ...mcsCurrentFilter, [key]: value };
  // Sync checkbox state if toggled programmatically
  const map = { myChanges: 'mcs-qf-mychanges', overdueOnly: 'mcs-qf-overdue', highPriority: 'mcs-qf-highpri' };
  if (map[key]) {
    const cb = document.getElementById(map[key]);
    if (cb) cb.checked = value;
  }
  mcsRenderList();
}

/**
 * Set date range filter
 */
function mcsSetDateRange(value) {
  mcsCurrentFilter = { ...mcsCurrentFilter, dateRange: value };
  mcsRenderList();
}

/**
 * KPI click: filter to awaiting approval (review + final_review combined)
 * Uses 'review' as the status filter — both approval stages show as "review" equivalent
 */
function mcsKpiFilterAwaiting() {
  // Reset status filter to show all awaiting changes; highlight via search not possible,
  // so we filter 'review' and show a combined view by filtering both in mcsGetFiltered.
  // For simplicity, set status to 'review' (Awaiting Approval 1).
  mcsSetFilter('status', 'review', document.querySelector('[onclick*="mcsSetFilter(\'status\', \'review\'"]'));
}

/**
 * Clear all active filters and reset to defaults
 */
function mcsClearFilters() {
  mcsCurrentFilter = {
    status: 'all',
    priority: 'all',
    type: 'all',
    source: 'all',
    myChanges: false,
    overdueOnly: false,
    highPriority: false,
    dateRange: 'all'
  };

  // Reset search input
  const search = document.getElementById('mcs-search-input');
  if (search) search.value = '';

  // Reset sort select
  const sort = document.getElementById('mcs-sort-select');
  if (sort) sort.value = 'date-desc';

  // Reset date range select
  const dateRange = document.getElementById('mcs-date-range');
  if (dateRange) dateRange.value = 'all';

  // Reset quick filter checkboxes
  ['mcs-qf-mychanges', 'mcs-qf-overdue', 'mcs-qf-highpri'].forEach(id => {
    const cb = document.getElementById(id);
    if (cb) cb.checked = false;
  });

  // Reset active button styling in all filter sections
  document.querySelectorAll('.mcs-filter-btn').forEach(b => b.classList.remove('active'));
  const allBtn = document.querySelector('[onclick*="mcsSetFilter(\'status\', \'all\'"]');
  if (allBtn) allBtn.classList.add('active');

  mcsRenderList();
}

/**
 * Toast notification
 */
function mcsToast(msg) {
  const el = document.createElement('div');
  el.className = 'mcs-toast show';
  el.textContent = '✓ ' + msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 200);
  }, 3000);
}
