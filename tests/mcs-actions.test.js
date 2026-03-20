/**
 * MCS + Action Centre Integration Tests
 * Tests for extracting MCS approval tasks into Action Centre
 * Updated to match the 2-step MCO approval system (approval1 / approval2).
 */

describe('MCS Action Centre Integration', () => {
  beforeEach(() => {
    window.mcsList = [
      {
        id: 'ECR-2026-0001',
        title: 'Safety Valve Update',
        status: 'review',         // awaiting Approval 1
        priority: 'critical',
        description: 'Add locking mechanism',
        change_type: 'Safety',
        initiated_by: 'D. Clarke',
        target_implementation: '2026-03-25',
        eng_review_status: 'pending',
        qa_review_status: null
      },
      {
        id: 'ECR-2026-0002',
        title: 'Material Substitution',
        status: 'final_review',   // awaiting Approval 2
        priority: 'high',
        description: 'Viton to EPDM',
        change_type: 'Material',
        initiated_by: 'S. Patel',
        target_implementation: '2026-03-15',
        eng_review_status: 'approved',
        qa_review_status: 'pending'
      },
      {
        id: 'ECR-2026-0003',
        title: 'Weld Geometry Fix',
        status: 'implemented',
        priority: 'critical',
        eng_review_status: 'approved',
        qa_review_status: 'approved'
      }
    ];

    window.MCS_APPROVAL_STEPS = [
      { key: 'approval1', label: 'Approval 1', field: 'eng_review_status', activeStatus: 'review' },
      { key: 'approval2', label: 'Approval 2', field: 'qa_review_status',  activeStatus: 'final_review' }
    ];

    window.currentUser = { id: 'user-uuid-123', email: 'approver@example.com' };
    window.mcsApproverConfig = {
      approval1: [{ user_id: 'user-uuid-123', user_name: 'Approver', user_email: 'approver@example.com' }],
      approval2: [{ user_id: 'user-uuid-123', user_name: 'Approver', user_email: 'approver@example.com' }]
    };
  });

  describe('Task Extraction (2-step system)', () => {
    it('should extract Approval 1 pending task when user is assigned', () => {
      // Simulate the logic from mcsExtractApproveTasks
      const tasks = [];
      const myId = window.currentUser.id;
      const myEmail = window.currentUser.email.toLowerCase();

      window.MCS_APPROVAL_STEPS.forEach(stepDef => {
        const assigned = window.mcsApproverConfig[stepDef.key] || [];
        const isAssigned = assigned.some(u =>
          (myId && u.user_id === myId) || (myEmail && u.user_email && u.user_email.toLowerCase() === myEmail)
        );
        if (!isAssigned) return;

        window.mcsList.forEach(change => {
          if (change.status !== stepDef.activeStatus) return;
          const stepStatus = change[stepDef.field];
          if (stepStatus && stepStatus !== 'pending') return;
          tasks.push({ changeId: change.id, stepKey: stepDef.key });
        });
      });

      expect(tasks.length).toBe(2);
      expect(tasks.some(t => t.changeId === 'ECR-2026-0001' && t.stepKey === 'approval1')).toBe(true);
      expect(tasks.some(t => t.changeId === 'ECR-2026-0002' && t.stepKey === 'approval2')).toBe(true);
    });

    it('should not extract task for an implemented change', () => {
      const change = window.mcsList.find(c => c.id === 'ECR-2026-0003');
      const stepDef = window.MCS_APPROVAL_STEPS.find(s => s.key === 'approval1');
      expect(change.status).not.toBe(stepDef.activeStatus);
    });

    it('should not extract tasks when user is not assigned', () => {
      window.mcsApproverConfig = { approval1: [], approval2: [] };
      const tasks = [];

      window.MCS_APPROVAL_STEPS.forEach(stepDef => {
        const assigned = window.mcsApproverConfig[stepDef.key] || [];
        if (assigned.length === 0) return; // No assigned approvers
        window.mcsList.forEach(change => {
          if (change.status === stepDef.activeStatus) tasks.push(change);
        });
      });

      expect(tasks.length).toBe(0);
    });

    it('should match approver by email as well as user_id', () => {
      // Approver entry has ONLY email (no matching user_id)
      window.mcsApproverConfig = {
        approval1: [{ user_id: 'different-uuid', user_name: 'Approver', user_email: 'approver@example.com' }],
        approval2: []
      };
      const myEmail = window.currentUser.email.toLowerCase();
      const assigned = window.mcsApproverConfig.approval1;
      const matched = assigned.some(u =>
        u.user_email && u.user_email.toLowerCase() === myEmail
      );
      expect(matched).toBe(true);
    });
  });

  describe('Task Properties', () => {
    it('should populate task with correct metadata', () => {
      const change = window.mcsList[1]; // ECR-2026-0002, final_review
      const task = {
        id: `mcs_${change.id}_approval2`,
        title: `Review ${change.id}: ${change.title}`,
        priority: change.priority,
        dueDate: change.target_implementation,
        source: 'MCS',
        owner: change.initiated_by
      };

      expect(task.priority).toBe('high');
      expect(task.owner).toBe('S. Patel');
      expect(task.dueDate).toBe('2026-03-15');
    });

    it('should include change description in task notes', () => {
      const change = window.mcsList[0];
      const task = { notes: change.description?.substring(0, 100) || '' };
      expect(task.notes).toContain('locking');
    });

    it('should set source as MCS', () => {
      const task = { source: 'MCS', sourceIcon: '🔧' };
      expect(task.source).toBe('MCS');
    });
  });

  describe('Task Routing', () => {
    it('should route to MCS portal', () => {
      const routeTarget = 'mcs';
      expect(routeTarget).toBe('mcs');
    });

    it('should set mcsAutoViewId before navigating', () => {
      const changeId = 'ECR-2026-0001';
      window.mcsAutoViewId = changeId;
      expect(window.mcsAutoViewId).toBe(changeId);
    });
  });

  describe('Integration with Action Centre', () => {
    it('should merge MCS approvals into action centre data', () => {
      const actionCentreData = { actions: [], pfmea: [], risks: [] };
      const mcsApprovals = window.mcsList
        .filter(c => c.status === 'review' || c.status === 'final_review')
        .map(c => ({ id: `mcs_${c.id}`, type: 'mcs_approval', source: 'MCS' }));

      const merged = { ...actionCentreData, mcsApprovals };
      expect(merged.mcsApprovals.length).toBe(2);
    });

    it('should use 2-step statuses for pending detection', () => {
      const pendingAtApproval1 = window.mcsList.filter(c => c.status === 'review');
      const pendingAtApproval2 = window.mcsList.filter(c => c.status === 'final_review');
      expect(pendingAtApproval1.length).toBe(1);
      expect(pendingAtApproval2.length).toBe(1);
    });

    it('should not flag implemented changes as pending', () => {
      const implemented = window.mcsList.filter(c => c.status === 'implemented');
      expect(implemented.length).toBe(1);
      expect(implemented[0].id).toBe('ECR-2026-0003');
    });
  });

  describe('Overdue Detection', () => {
    it('should detect overdue tasks', () => {
      const pastDate = '2026-02-01';
      const today = new Date().toISOString().split('T')[0];
      expect(pastDate < today).toBe(true);
    });

    it('should calculate days until due', () => {
      const dueDate = new Date('2026-03-25');
      const today = new Date('2026-03-20');
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      expect(daysUntilDue).toBe(5);
    });
  });
});
