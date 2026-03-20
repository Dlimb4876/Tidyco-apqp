/**
 * MCS (Manufacturing Change System) - Main Portal
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
            <button class="btn btn-primary btn-sm" onclick="mcsOpenNewChange()">+ Raise a Change</button>
          </div>
        </div>
        <div class="mcs-list" id="mcs-list-container"></div>
      </div>

      <aside class="mcs-sidebar">
        <div class="mcs-search-wrap">
          <input class="mcs-search-input" placeholder="Search changes..." id="mcs-search-input" oninput="mcsRenderList()" />
        </div>
        <div class="mcs-sidebar-section">
          <div class="mcs-sidebar-label">Status</div>
          <button class="mcs-filter-btn active" onclick="mcsSetFilter('status', 'all', this)">
            All Changes <span class="mcs-filter-count" id="mcs-fc-all">0</span>
          </button>
          <button class="mcs-filter-btn" onclick="mcsSetFilter('status', 'open', this)">
            Open <span class="mcs-filter-count" id="mcs-fc-open">0</span>
          </button>
          <button class="mcs-filter-btn" onclick="mcsSetFilter('status', 'review', this)">
            Under Review <span class="mcs-filter-count" id="mcs-fc-review">0</span>
          </button>
          <button class="mcs-filter-btn" onclick="mcsSetFilter('status', 'approved', this)">
            Approved <span class="mcs-filter-count" id="mcs-fc-approved">0</span>
          </button>
          <button class="mcs-filter-btn" onclick="mcsSetFilter('status', 'implemented', this)">
            Implemented <span class="mcs-filter-count" id="mcs-fc-implemented">0</span>
          </button>
          <button class="mcs-filter-btn" onclick="mcsSetFilter('status', 'rejected', this)">
            Rejected <span class="mcs-filter-count" id="mcs-fc-rejected">0</span>
          </button>
        </div>
        <div class="mcs-sidebar-section">
          <div class="mcs-sidebar-label">Priority</div>
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
        <div class="mcs-sidebar-section">
          <div class="mcs-sidebar-label">Change Type</div>
          <button class="mcs-filter-btn" onclick="mcsSetFilter('type', 'Engineering', this)">Engineering</button>
          <button class="mcs-filter-btn" onclick="mcsSetFilter('type', 'Process', this)">Process</button>
          <button class="mcs-filter-btn" onclick="mcsSetFilter('type', 'Material', this)">Material</button>
          <button class="mcs-filter-btn" onclick="mcsSetFilter('type', 'Tooling', this)">Tooling</button>
          <button class="mcs-filter-btn" onclick="mcsSetFilter('type', 'Quality', this)">Quality</button>
          <button class="mcs-filter-btn" onclick="mcsSetFilter('type', 'Safety', this)">Safety</button>
        </div>
        <div class="mcs-sidebar-section">
          <div class="mcs-sidebar-label">Source</div>
          <button class="mcs-filter-btn" onclick="mcsSetFilter('source', 'Manual', this)">Manual</button>
          <button class="mcs-filter-btn" onclick="mcsSetFilter('source', 'PFMEA', this)">PFMEA</button>
          <button class="mcs-filter-btn" onclick="mcsSetFilter('source', 'Risk', this)">Risk</button>
          <button class="mcs-filter-btn" onclick="mcsSetFilter('source', 'Customer', this)">Customer</button>
          <button class="mcs-filter-btn" onclick="mcsSetFilter('source', 'Quality', this)">Quality</button>
        </div>
      </aside>
    </div>
  `;

  // Load changes from Supabase
  await mcsLoadChanges();
  mcsRenderList();
}

/**
 * Load changes from Supabase
 */
async function mcsLoadChanges() {
  mcsLoading = true;
  try {
    if (!supabase) {
      console.error('Supabase not initialized');
      mcsList = [];
      return;
    }

    const { data, error } = await supabase
      .from('mcs_changes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading MCS changes:', error);
      mcsList = [];
      return;
    }

    mcsList = data || [];
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
    // Search filter
    if (q) {
      const searchText = (
        change.title + ' ' +
        change.id + ' ' +
        (change.part_drawing_no || '') + ' ' +
        (change.initiated_by || '') + ' ' +
        change.change_type
      ).toLowerCase();

      if (!searchText.includes(q)) return false;
    }

    // Status filter
    if (mcsCurrentFilter.status !== 'all' && change.status !== mcsCurrentFilter.status) {
      return false;
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

    return true;
  });

  // Sort
  const sortKey = document.getElementById('mcs-sort-select')?.value || 'date-desc';
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const statusOrder = { open: 0, review: 1, approved: 2, implemented: 3, rejected: 4 };

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
 * Update filter counts
 */
function mcsUpdateCounts() {
  const counts = {
    all: mcsList.length,
    open: 0,
    review: 0,
    approved: 0,
    implemented: 0,
    rejected: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  mcsList.forEach(change => {
    if (counts[change.status] !== undefined) counts[change.status]++;
    if (counts[change.priority] !== undefined) counts[change.priority]++;
  });

  document.getElementById('mcs-fc-all').textContent = counts.all;
  document.getElementById('mcs-fc-open').textContent = counts.open;
  document.getElementById('mcs-fc-review').textContent = counts.review;
  document.getElementById('mcs-fc-approved').textContent = counts.approved;
  document.getElementById('mcs-fc-implemented').textContent = counts.implemented;
  document.getElementById('mcs-fc-rejected').textContent = counts.rejected;
  document.getElementById('mcs-fc-critical').textContent = counts.critical;
  document.getElementById('mcs-fc-high').textContent = counts.high;
  document.getElementById('mcs-fc-medium').textContent = counts.medium;
  document.getElementById('mcs-fc-low').textContent = counts.low;
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
      (document.getElementById('mcs-search-input')?.value || '') !== '';
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

  container.innerHTML = filtered.map(change => `
    <div class="mcs-card status-${change.status}" onclick="mcsViewChange('${esc(change.id)}')">
      <div class="mcs-card-ref">${esc(change.id)}</div>
      <div class="mcs-card-body">
        <div class="mcs-card-title">${esc(change.title)}</div>
        <div class="mcs-card-meta">
          <span class="mcs-tag">${esc(change.change_type)}</span>
          <div class="mcs-priority-dot mcs-priority-${change.priority}" title="Priority: ${change.priority}"></div>
          <span style="font-size: 11px; color: var(--text3); text-transform: capitalize;">${change.priority}</span>
        </div>
        <div class="mcs-card-submeta">
          <span>${esc(change.initiated_by || 'Unknown')}</span>
          <span>${esc(change.part_drawing_no || '—')}</span>
          <span>${change.created_at ? change.created_at.split('T')[0] : '—'}</span>
          ${change.target_implementation ? `<span>Target: ${change.target_implementation}</span>` : ''}
        </div>
      </div>
      <div class="mcs-card-right">
        <span class="mcs-status-pill mcs-status-${change.status}">${mcStatusLabel(change.status)}</span>
        <div class="mcs-card-impacts">${change.impacts_count || 0} impacts</div>
      </div>
    </div>
  `).join('');
}

/**
 * Get status label
 */
function mcStatusLabel(status) {
  const labels = {
    open: 'Open',
    review: 'Under Review',
    approved: 'Approved',
    implemented: 'Implemented',
    rejected: 'Rejected'
  };
  return labels[status] || status;
}

/**
 * View change details
 */
function mcsViewChange(id) {
  mcsViewingId = id;
  const change = mcsList.find(c => c.id === id);
  if (!change) return;

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
