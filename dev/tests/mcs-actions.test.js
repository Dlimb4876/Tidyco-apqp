const fs = require('fs');
const path = require('path');

const script = fs.readFileSync(
  path.resolve(__dirname, '../portals/mcs/js/mcs-actions.js'),
  'utf8'
);

describe('MCS Action Centre Integration', () => {
  beforeEach(() => {
    global.esc = (v) => String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    global.navigate = jest.fn();
    global.currentUser = { id: 'user-uuid-123', email: 'approver@example.com' };
    global.mcsApproverConfig = {
      approval1: [{ user_id: 'user-uuid-123', user_name: 'Approver', user_email: 'approver@example.com' }],
      approval2: [{ user_id: 'user-uuid-123', user_name: 'Approver', user_email: 'approver@example.com' }],
    };

    global.MCS_APPROVAL_STEPS = [
      { key: 'approval1', label: 'Approval 1', field: 'eng_review_status', activeStatus: 'review' },
      { key: 'approval2', label: 'Approval 2', field: 'qa_review_status', activeStatus: 'final_review' },
    ];

    global.mcsGetMyApproverSteps = jest.fn(() => ['approval1', 'approval2']);

    global.mcsList = [
      {
        id: 'ECR-2026-0001',
        title: 'Safety Valve Update',
        status: 'review',
        priority: 'critical',
        description: 'Add locking mechanism',
        change_type: 'Safety',
        initiated_by: 'D. Clarke',
        target_implementation: '2026-03-25',
        eng_review_status: 'pending',
        qa_review_status: null,
        created_at: '2026-03-01T00:00:00Z',
      },
      {
        id: 'ECR-2026-0002',
        title: 'Material Substitution',
        status: 'final_review',
        priority: 'high',
        description: 'Viton to EPDM',
        change_type: 'Material',
        initiated_by: 'S. Patel',
        target_implementation: '2026-03-15',
        eng_review_status: 'approved',
        qa_review_status: 'pending',
        created_at: '2026-03-02T00:00:00Z',
      },
      {
        id: 'ECR-2026-0003',
        title: 'Weld Geometry Fix',
        status: 'implemented',
        priority: 'critical',
        eng_review_status: 'approved',
        qa_review_status: 'approved',
      },
    ];

    global.mcsAutoViewId = null;

    eval(`${script}\n;globalThis.__mcsActions = { mcsExtractApproveTasks, mcsIntegrateWithActionCentre, mcsNavigateFromActionCentre };`); // eslint-disable-line no-eval
  });

  it('extracts pending approval tasks for assigned user and active stages', () => {
    const tasks = globalThis.__mcsActions.mcsExtractApproveTasks();

    expect(tasks).toHaveLength(2);
    expect(tasks[0].id).toContain('ECR-2026-0001');
    expect(tasks[1].id).toContain('ECR-2026-0002');
    expect(tasks.every((t) => t.type === 'mcs_approval')).toBe(true);
  });

  it('returns empty when no approver config or no user', () => {
    global.mcsApproverConfig = null;
    expect(globalThis.__mcsActions.mcsExtractApproveTasks()).toEqual([]);

    global.mcsApproverConfig = { approval1: [] };
    global.currentUser = null;
    expect(globalThis.__mcsActions.mcsExtractApproveTasks()).toEqual([]);
  });

  it('integrates extracted tasks into action centre data under mcs_approvals', () => {
    const base = { actions: [], pfmea: [], risks: [] };
    const merged = globalThis.__mcsActions.mcsIntegrateWithActionCentre(base);

    expect(merged).toHaveProperty('mcs_approvals');
    expect(Array.isArray(merged.mcs_approvals)).toBe(true);
    expect(merged.mcs_approvals.length).toBe(2);
  });

  it('sourceLink callback routes to MCS and sets auto-view id', () => {
    const tasks = globalThis.__mcsActions.mcsExtractApproveTasks();
    const task = tasks.find((t) => t.metadata.changeId === 'ECR-2026-0001');

    task.sourceLink();

    expect(global.mcsAutoViewId).toBe('ECR-2026-0001');
    expect(global.navigate).toHaveBeenCalledWith('mcs');
  });

  it('navigate helper sets auto-view id and routes to MCS', () => {
    globalThis.__mcsActions.mcsNavigateFromActionCentre('ECR-2026-0002');

    expect(global.mcsAutoViewId).toBe('ECR-2026-0002');
    expect(global.navigate).toHaveBeenCalledWith('mcs');
  });
});
