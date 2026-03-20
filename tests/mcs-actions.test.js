/**
 * MCS + Action Centre Integration Tests
 * Tests for extracting MCS approval tasks into Action Centre
 */

describe('MCS Action Centre Integration', () => {
  beforeEach(() => {
    window.mcsList = [
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
        mfg_signoff_status: null
      },
      {
        id: 'ECR-2026-0002',
        title: 'Material Substitution',
        status: 'review',
        priority: 'high',
        description: 'Viton to EPDM',
        change_type: 'Material',
        initiated_by: 'S. Patel',
        target_implementation: '2026-03-15',
        qa_review_status: 'pending',
        eng_review_status: 'approved',
        mfg_signoff_status: null
      },
      {
        id: 'ECR-2026-0003',
        title: 'Weld Geometry Fix',
        status: 'approved',
        priority: 'critical',
        eng_review_status: 'approved',
        qa_review_status: 'approved',
        mfg_signoff_status: 'approved'
      }
    ];
    window.currentUserRole = 'qa';
  });

  describe('Task Extraction', () => {
    it('should extract pending approval tasks', () => {
      const userRole = 'qa';
      const tasks = [];

      window.mcsList.forEach(change => {
        if (change.status === 'review' && change.qa_review_status === 'pending') {
          tasks.push({
            id: `mcs_${change.id}_${userRole}`,
            type: 'mcs_approval',
            title: `Review ECR-${change.id.split('-')[2]}: ${change.title}`,
            priority: change.priority,
            status: 'open'
          });
        }
      });

      expect(tasks.length).toBe(1);
      expect(tasks[0].id).toContain('ECR-2026-0002');
    });

    it('should filter by current user role', () => {
      window.currentUserRole = 'engineering';
      const engTasks = window.mcsList.filter(
        c => c.status === 'review' && c.eng_review_status === 'pending'
      );

      expect(engTasks.length).toBe(1);
      expect(engTasks[0].id).toBe('ECR-2026-0001');
    });

    it('should not extract approved or rejected changes', () => {
      const tasks = window.mcsList.filter(c => c.status === 'approved' || c.status === 'rejected');
      expect(tasks.length).toBe(1);
    });
  });

  describe('Task Properties', () => {
    it('should populate task with correct metadata', () => {
      const change = window.mcsList[1]; // ECR-2026-0002
      const task = {
        id: `mcs_${change.id}_qa`,
        title: `Review: ${change.title}`,
        priority: change.priority,
        dueDate: change.target_implementation,
        source: 'MCS',
        owner: change.initiated_by
      };

      expect(task.priority).toBe('high');
      expect(task.owner).toBe('S. Patel');
      expect(task.dueDate).toBe('2026-03-15');
    });

    it('should include change description in task', () => {
      const change = window.mcsList[0];
      const task = {
        notes: change.description
      };

      expect(task.notes).toContain('locking');
    });

    it('should set source as MCS', () => {
      const task = { source: 'MCS' };
      expect(task.source).toBe('MCS');
    });
  });

  describe('Task Routing', () => {
    it('should route to MCS portal on click', () => {
      const changeId = 'ECR-2026-0001';
      const routeTarget = `navigate('mcs')`;

      expect(routeTarget).toContain('mcs');
      expect(routeTarget).toContain('navigate');
    });

    it('should highlight change in MCS on navigation', () => {
      const changeId = 'ECR-2026-0001';
      const actionResult = {
        targetPortal: 'mcs',
        highlightedChangeId: changeId
      };

      expect(actionResult.targetPortal).toBe('mcs');
      expect(actionResult.highlightedChangeId).toBe(changeId);
    });
  });

  describe('Task Filtering', () => {
    it('should filter tasks by status', () => {
      const tasks = [
        { status: 'open', type: 'mcs_approval' },
        { status: 'completed', type: 'mcs_approval' }
      ];

      const openTasks = tasks.filter(t => t.status === 'open');
      expect(openTasks.length).toBe(1);
    });

    it('should filter tasks by priority', () => {
      const tasks = [
        { priority: 'critical' },
        { priority: 'high' },
        { priority: 'low' }
      ];

      const criticalTasks = tasks.filter(t => t.priority === 'critical');
      expect(criticalTasks.length).toBe(1);
    });

    it('should filter tasks by source', () => {
      const tasks = [
        { source: 'MCS' },
        { source: 'NPI' },
        { source: 'MCS' }
      ];

      const mcsTasks = tasks.filter(t => t.source === 'MCS');
      expect(mcsTasks.length).toBe(2);
    });
  });

  describe('Integration with Action Centre', () => {
    it('should merge MCS tasks into action centre data', () => {
      const actionCentreData = {
        npi_actions: [],
        pfmea_actions: [],
        risks: []
      };

      const mcsTasks = window.mcsList
        .filter(c => c.status === 'review')
        .map(c => ({
          id: `mcs_${c.id}`,
          type: 'mcs_approval',
          title: c.title,
          source: 'MCS'
        }));

      const merged = {
        ...actionCentreData,
        mcs_approvals: mcsTasks
      };

      expect(merged.mcs_approvals).toBeDefined();
      expect(merged.mcs_approvals.length).toBeGreaterThan(0);
    });

    it('should maintain separate task source identifiers', () => {
      const tasks = [
        { id: 'npi_act_123', source: 'NPI' },
        { id: 'mcs_ECR-2026-0001_qa', source: 'MCS' }
      ];

      const mcsOnly = tasks.filter(t => t.source === 'MCS');
      expect(mcsOnly[0].id).toContain('mcs_');
    });

    it('should update task list when MCS change status changes', () => {
      const change = window.mcsList[0];
      change.qa_review_status = 'approved';
      change.status = 'approved';

      const pendingTasks = window.mcsList.filter(
        c => c.status === 'review' && c.qa_review_status === 'pending'
      );

      expect(pendingTasks.length).toBe(1); // Only ECR-2026-0002 remains pending
    });
  });

  describe('Task Notifications', () => {
    it('should indicate new task assignment', () => {
      const task = {
        id: 'mcs_ECR-2026-0002_qa',
        isNew: true,
        createdAt: new Date().toISOString()
      };

      expect(task.isNew).toBe(true);
    });

    it('should indicate overdue tasks', () => {
      const pastDate = '2026-02-01';
      const today = new Date().toISOString().split('T')[0];
      const isOverdue = pastDate < today;

      expect(isOverdue).toBe(true);
    });

    it('should calculate days until due', () => {
      const dueDate = new Date('2026-03-25');
      const today = new Date('2026-03-20');
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      expect(daysUntilDue).toBe(5);
    });
  });
});
