const fs = require('fs');
const path = require('path');

const script = fs.readFileSync(
  path.resolve(__dirname, '../portals/mcs/js/mcs-main.js'),
  'utf8'
);

describe('MCS Main Portal', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="mcs-search-input" value="" />
      <select id="mcs-sort-select">
        <option value="date-desc">Newest First</option>
        <option value="date-asc">Oldest First</option>
        <option value="priority">Priority</option>
        <option value="status">Status</option>
      </select>
      <select id="mcs-date-range"><option value="all">All</option></select>
      <input type="checkbox" id="mcs-qf-mychanges" />
      <input type="checkbox" id="mcs-qf-overdue" />
      <input type="checkbox" id="mcs-qf-highpri" />
      <div id="mcs-list-container"></div>
      <span id="mcs-list-count"></span>
      <button class="mcs-filter-btn active" onclick="mcsSetFilter('status', 'all', this)">All</button>
      <span id="mcs-fc-all"></span>
      <span id="mcs-fc-open"></span>
      <span id="mcs-fc-review"></span>
      <span id="mcs-fc-implementing"></span>
      <span id="mcs-fc-final_review"></span>
      <span id="mcs-fc-implemented"></span>
      <span id="mcs-fc-closed"></span>
      <span id="mcs-fc-critical"></span>
      <span id="mcs-fc-high"></span>
      <span id="mcs-fc-medium"></span>
      <span id="mcs-fc-low"></span>
      <span id="mcs-kpi-open"></span>
      <span id="mcs-kpi-review"></span>
      <span id="mcs-kpi-overdue"></span>
      <span id="mcs-kpi-week"></span>
    `;

    global.esc = (v) => String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    global.currentUser = { email: 'owner@test.com' };
    global.mcsList = [
      {
        id: 'ECR-1',
        title: 'Valve update',
        status: 'open',
        priority: 'critical',
        change_type: 'Engineering',
        change_source: 'Manual',
        initiated_by: 'owner@test.com',
        description: 'Improve sealing ring',
        created_at: '2026-03-10T10:00:00Z',
        target_implementation: '2099-01-01',
      },
      {
        id: 'ECR-2',
        title: 'Paint spec',
        status: 'review',
        priority: 'high',
        change_type: 'Process',
        change_source: 'Customer',
        initiated_by: 'other@test.com',
        description: 'Change coating',
        created_at: '2026-03-12T09:00:00Z',
        target_implementation: '2099-01-02',
      },
      {
        id: 'ECR-3',
        title: 'Legacy approved',
        status: 'approved',
        priority: 'low',
        change_type: 'Material',
        change_source: 'Manual',
        initiated_by: 'other@test.com',
        description: 'Legacy closure',
        created_at: '2026-03-01T09:00:00Z',
        target_implementation: '2025-01-01',
      },
    ];

    global.mcsCurrentFilter = {
      status: 'all',
      priority: 'all',
      type: 'all',
      source: 'all',
      myChanges: false,
      overdueOnly: false,
      highPriority: false,
      dateRange: 'all',
    };

    eval(`${script}\n;globalThis.__mcsMain = { mcsGetFiltered, mcStatusLabel, mcsIsOverdue, mcsClearFilters, mcsToggleQuickFilter };`); // eslint-disable-line no-eval
  });

  it('filters by status and includes legacy approved/rejected when closed is selected', () => {
    global.mcsCurrentFilter.status = 'closed';
    const filtered = globalThis.__mcsMain.mcsGetFiltered();

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('ECR-3');
  });

  it('filters by search text across title and description', () => {
    document.getElementById('mcs-search-input').value = 'sealing ring';
    const filtered = globalThis.__mcsMain.mcsGetFiltered();

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('ECR-1');
  });

  it('sorts by priority order critical > high > medium > low', () => {
    document.getElementById('mcs-sort-select').value = 'priority';
    const filtered = globalThis.__mcsMain.mcsGetFiltered();

    expect(filtered[0].priority).toBe('critical');
    expect(filtered[1].priority).toBe('high');
    expect(filtered[2].priority).toBe('low');
  });

  it('detects overdue only for non-closed statuses', () => {
    const openOverdue = { status: 'open', target_implementation: '2020-01-01' };
    const closedOverdue = { status: 'implemented', target_implementation: '2020-01-01' };

    expect(globalThis.__mcsMain.mcsIsOverdue(openOverdue)).toBe(true);
    expect(globalThis.__mcsMain.mcsIsOverdue(closedOverdue)).toBe(false);
  });

  it('maps statuses to expected display labels', () => {
    expect(globalThis.__mcsMain.mcStatusLabel('review')).toBe('Awaiting Approval 1');
    expect(globalThis.__mcsMain.mcStatusLabel('final_review')).toBe('Awaiting Approval 2');
    expect(globalThis.__mcsMain.mcStatusLabel('rejected')).toBe('Closed');
  });

  it('clear filters resets quick filters, search and sort', () => {
    document.getElementById('mcs-search-input').value = 'abc';
    document.getElementById('mcs-sort-select').value = 'priority';
    document.getElementById('mcs-qf-mychanges').checked = true;
    document.getElementById('mcs-qf-overdue').checked = true;
    document.getElementById('mcs-qf-highpri').checked = true;
    global.mcsCurrentFilter = {
      status: 'review',
      priority: 'high',
      type: 'Engineering',
      source: 'Manual',
      myChanges: true,
      overdueOnly: true,
      highPriority: true,
      dateRange: 'week',
    };

    globalThis.__mcsMain.mcsClearFilters();

    expect(global.mcsCurrentFilter.status).toBe('all');
    expect(global.mcsCurrentFilter.priority).toBe('all');
    expect(global.mcsCurrentFilter.myChanges).toBe(false);
    expect(document.getElementById('mcs-search-input').value).toBe('');
    expect(document.getElementById('mcs-sort-select').value).toBe('date-desc');
    expect(document.getElementById('mcs-qf-mychanges').checked).toBe(false);
    expect(document.getElementById('mcs-list-count').textContent).toBe('(3)');
  });

  it('toggle quick filter updates state and checkbox sync', () => {
    globalThis.__mcsMain.mcsToggleQuickFilter('overdueOnly', true);

    expect(global.mcsCurrentFilter.overdueOnly).toBe(true);
    expect(document.getElementById('mcs-qf-overdue').checked).toBe(true);
    expect(document.getElementById('mcs-list-count').textContent).toBe('(0)');
  });
});
