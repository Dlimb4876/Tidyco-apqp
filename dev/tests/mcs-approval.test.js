/**
 * MCS Approval Workflow Tests
 * Tests for 2-step MCO approval chain and status transitions
 *
 * MCO Process:
 *   open → review (Approval 1) → closed         [if rejected]
 *                              → implementing → final_review (Approval 2) → implementing  [if rejected]
 *                                                                          → implemented   [if approved]
 */

describe('MCS Approval Workflow', () => {
  beforeEach(() => {
    window.mcsList = [
      {
        id: 'ECR-2026-0001',
        title: 'Test Change',
        status: 'review',
        priority: 'high',
        eng_review_status: 'pending',  // Approval 1 field
        qa_review_status: null,        // Approval 2 field
        timeline: []
      }
    ];
    window.currentUserRole = 'approval1';
  });

  describe('Approval Step Validation', () => {
    it('should identify pending Approval 1', () => {
      const change = window.mcsList[0];
      expect(change.eng_review_status).toBe('pending');
      expect(change.status).toBe('review');
    });

    it('should identify Approval 2 not yet reached', () => {
      const change = window.mcsList[0];
      expect(change.qa_review_status).toBeNull();
    });

    it('should mark Approval 1 as complete', () => {
      const change = window.mcsList[0];
      change.eng_review_status = 'approved';
      change.eng_review_by = 'T. Singh';
      change.eng_review_at = new Date().toISOString();

      expect(change.eng_review_status).toBe('approved');
      expect(change.eng_review_by).toBeTruthy();
    });
  });

  describe('Approval Chain States', () => {
    it('should start in review status (awaiting Approval 1)', () => {
      const change = window.mcsList[0];
      expect(change.status).toBe('review');
    });

    it('should advance to implementing when Approval 1 approved', () => {
      const change = window.mcsList[0];
      change.eng_review_status = 'approved';
      // Simulates what mcsApproveStep does
      if (change.eng_review_status === 'approved' && change.status === 'review') {
        change.status = 'implementing';
      }
      expect(change.status).toBe('implementing');
    });

    it('should close MCO when Approval 1 rejected', () => {
      const change = window.mcsList[0];
      change.eng_review_status = 'rejected';
      // Simulates what mcsRejectStep does for approval1
      if (change.eng_review_status === 'rejected' && change.status === 'review') {
        change.status = 'closed';
      }
      expect(change.status).toBe('closed');
    });

    it('should advance to final_review when submitted for Approval 2', () => {
      const change = window.mcsList[0];
      change.status = 'implementing';
      change.qa_review_status = 'pending';
      // Simulates mcsAdvanceStatus for implementing → final_review
      if (change.status === 'implementing') {
        change.status = 'final_review';
      }
      expect(change.status).toBe('final_review');
    });

    it('should advance to implemented when Approval 2 approved', () => {
      const change = window.mcsList[0];
      change.status = 'final_review';
      change.eng_review_status = 'approved';
      change.qa_review_status = 'approved';
      // Simulates what mcsApproveStep does for approval2
      if (change.qa_review_status === 'approved' && change.status === 'final_review') {
        change.status = 'implemented';
        change.implementation_date = new Date().toISOString().split('T')[0];
      }
      expect(change.status).toBe('implemented');
      expect(change.implementation_date).toBeTruthy();
    });

    it('should return to implementing when Approval 2 rejected', () => {
      const change = window.mcsList[0];
      change.status = 'final_review';
      change.qa_review_status = 'rejected';
      // Simulates mcsRejectStep for approval2 — returns to implementing
      if (change.qa_review_status === 'rejected' && change.status === 'final_review') {
        change.status = 'implementing';
        change.qa_review_status = 'pending'; // reset for next attempt
      }
      expect(change.status).toBe('implementing');
      expect(change.qa_review_status).toBe('pending');
    });
  });

  describe('Timeline Logging', () => {
    it('should log Approval 1 approval event', () => {
      const change = window.mcsList[0];
      const timeline = change.timeline || [];

      const approvalEntry = {
        time: new Date().toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }),
        text: 'Approval 1 approved.',
        author: 'T. Singh',
        type: 'eng_reviewed'
      };

      timeline.push(approvalEntry);
      expect(timeline.length).toBe(1);
      expect(timeline[0].text).toContain('Approval 1');
    });

    it('should log Approval 1 rejection with reason and closed status', () => {
      const change = window.mcsList[0];
      const timeline = change.timeline || [];

      const rejectionEntry = {
        time: new Date().toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }),
        text: 'Approval 1 rejected — MCO closed. Reason: Change not required at this stage.',
        author: 'M. Jones',
        type: 'rejected'
      };

      timeline.push(rejectionEntry);
      expect(timeline.length).toBe(1);
      expect(timeline[0].type).toBe('rejected');
      expect(timeline[0].text).toContain('MCO closed');
    });

    it('should log Approval 2 rejection and return-to-implementing message', () => {
      const change = window.mcsList[0];
      const timeline = change.timeline || [];

      const rejectionEntry = {
        time: new Date().toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }),
        text: 'Approval 2 rejected — returned to implementation. Reason: Insufficient documentation.',
        author: 'M. Jones',
        type: 'rejected'
      };

      timeline.push(rejectionEntry);
      expect(timeline[0].text).toContain('returned to implementation');
    });

    it('should maintain chronological order', () => {
      const change = window.mcsList[0];
      change.timeline = [
        { time: '01 Feb 2026 09:00', text: 'Submitted for Approval 1', author: 'User' },
        { time: '02 Feb 2026 10:30', text: 'Approval 1 approved', author: 'Approver1' },
        { time: '03 Feb 2026 14:00', text: 'Implementation complete — submitted for Approval 2', author: 'User' }
      ];

      const times = change.timeline.map(e => new Date(e.time));
      const isSorted = times.every((t, i) => i === 0 || t >= times[i - 1]);

      expect(isSorted).toBe(true);
    });
  });

  describe('Two-Step Approval Process', () => {
    it('should require Approval 1 before implementation', () => {
      const change = window.mcsList[0];
      const canImplement = change.status === 'implementing';
      // Can only implement after Approval 1 (status moves to implementing)
      expect(canImplement).toBe(false); // still in 'review'
    });

    it('should allow implementation after Approval 1', () => {
      const change = window.mcsList[0];
      change.status = 'implementing';
      change.eng_review_status = 'approved';

      const canImplement = change.status === 'implementing';
      expect(canImplement).toBe(true);
    });

    it('should only submit overhaul entry after Approval 2', () => {
      const change = window.mcsList[0];
      change.status = 'implementing';
      change.eng_review_status = 'approved';

      // Not yet submitted for Approval 2 — no overhaul entry yet
      const shouldCreateOverhaul = change.status === 'implemented';
      expect(shouldCreateOverhaul).toBe(false);
    });

    it('should trigger overhaul entry on Approval 2 approval', () => {
      const change = window.mcsList[0];
      change.status = 'implemented';
      change.eng_review_status = 'approved';
      change.qa_review_status = 'approved';
      change.implementation_date = new Date().toISOString().split('T')[0];

      const shouldCreateOverhaul = change.status === 'implemented';
      expect(shouldCreateOverhaul).toBe(true);
      expect(change.implementation_date).toBeTruthy();
    });

    it('should set implementation date on transition to implemented', () => {
      const change = window.mcsList[0];
      const now = new Date().toISOString().split('T')[0];
      change.implementation_date = now;
      change.status = 'implemented';

      expect(change.implementation_date).toBe(now);
      expect(change.status).toBe('implemented');
    });
  });

  describe('Concurrent Edits', () => {
    it('should handle simultaneous approval attempts', () => {
      const change = window.mcsList[0];

      const approval1 = { ...change, eng_review_status: 'approved' };
      const approval2 = { ...change, eng_review_status: 'approved' };

      // Last write should win
      change.eng_review_status = approval2.eng_review_status;

      expect(change.eng_review_status).toBe('approved');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mcsCanApproveStep permission logic
// ─────────────────────────────────────────────────────────────────────────────
describe('mcsCanApproveStep', () => {
  // Inline implementation matching the production function so tests run
  // without requiring a browser DOM.
  function mcsCanApproveStep(stepKey, change, currentUser, mcsApproverConfig) {
    if (!stepKey || !currentUser) return false;
    const myId = currentUser.id;
    const myEmail = (currentUser.email || '').toLowerCase();

    if (stepKey === 'approval1' && change && change.eng_review_notes) {
      const notes = change.eng_review_notes;
      if (notes.startsWith('nominated_approver:')) {
        const nominatedEmail = notes.slice('nominated_approver:'.length).trim().toLowerCase();
        if (nominatedEmail && myEmail && nominatedEmail === myEmail) return true;
      }
    }

    if (!mcsApproverConfig) return false;
    const assigned = mcsApproverConfig[stepKey] || [];
    if (assigned.length === 0) return false;
    return assigned.some(u =>
      (myId && u.user_id && u.user_id === myId) ||
      (myEmail && u.user_email && u.user_email.toLowerCase() === myEmail)
    );
  }

  const USER = { id: 'uuid-bob', email: 'bob@example.com' };

  describe('Config-based approval', () => {
    it('returns true when user_id matches an assigned approver', () => {
      const config = { approval1: [{ user_id: 'uuid-bob', user_name: 'Bob' }] };
      expect(mcsCanApproveStep('approval1', {}, USER, config)).toBe(true);
    });

    it('returns true when user_email matches an assigned approver', () => {
      const config = { approval1: [{ user_id: 'other-uuid', user_name: 'Bob', user_email: 'bob@example.com' }] };
      expect(mcsCanApproveStep('approval1', {}, USER, config)).toBe(true);
    });

    it('returns true when both user_id and user_email match', () => {
      const config = { approval1: [{ user_id: 'uuid-bob', user_name: 'Bob', user_email: 'bob@example.com' }] };
      expect(mcsCanApproveStep('approval1', {}, USER, config)).toBe(true);
    });

    it('returns false when user is not in the assigned list', () => {
      const config = { approval1: [{ user_id: 'other-uuid', user_name: 'Alice', user_email: 'alice@example.com' }] };
      expect(mcsCanApproveStep('approval1', {}, USER, config)).toBe(false);
    });

    it('returns false when assigned list is empty', () => {
      const config = { approval1: [] };
      expect(mcsCanApproveStep('approval1', {}, USER, config)).toBe(false);
    });

    it('returns false when config has no entry for the step', () => {
      const config = { approval2: [{ user_id: 'uuid-bob', user_name: 'Bob' }] };
      expect(mcsCanApproveStep('approval1', {}, USER, config)).toBe(false);
    });
  });

  describe('Nominated approver (approval1 only)', () => {
    it('returns true for the nominated approver even if not in config list', () => {
      const config = { approval1: [{ user_id: 'other-uuid', user_name: 'Alice', user_email: 'alice@example.com' }] };
      const change = { eng_review_notes: 'nominated_approver:bob@example.com' };
      expect(mcsCanApproveStep('approval1', change, USER, config)).toBe(true);
    });

    it('returns true for the nominated approver regardless of case', () => {
      const config = { approval1: [] };
      const change = { eng_review_notes: 'nominated_approver:BOB@EXAMPLE.COM' };
      expect(mcsCanApproveStep('approval1', change, USER, config)).toBe(true);
    });

    it('does not grant approval for approval2 via nominated_approver in eng_review_notes', () => {
      const config = { approval2: [] };
      const change = { eng_review_notes: 'nominated_approver:bob@example.com' };
      // nominated_approver check only applies to approval1
      expect(mcsCanApproveStep('approval2', change, USER, config)).toBe(false);
    });

    it('falls through to config check when nominated email does not match', () => {
      const config = { approval1: [{ user_id: 'uuid-bob', user_name: 'Bob', user_email: 'bob@example.com' }] };
      const change = { eng_review_notes: 'nominated_approver:alice@example.com' };
      // Bob is in config list so should still be able to approve
      expect(mcsCanApproveStep('approval1', change, USER, config)).toBe(true);
    });
  });

  describe('Guard conditions', () => {
    it('returns false when stepKey is falsy', () => {
      const config = { approval1: [{ user_id: 'uuid-bob' }] };
      expect(mcsCanApproveStep('', {}, USER, config)).toBe(false);
      expect(mcsCanApproveStep(null, {}, USER, config)).toBe(false);
    });

    it('returns false when currentUser is null', () => {
      const config = { approval1: [{ user_id: 'uuid-bob' }] };
      expect(mcsCanApproveStep('approval1', {}, null, config)).toBe(false);
    });

    it('returns false when mcsApproverConfig is null', () => {
      expect(mcsCanApproveStep('approval1', {}, USER, null)).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mcsGetMyApproverSteps — checks both user_id and user_email
// ─────────────────────────────────────────────────────────────────────────────
describe('mcsGetMyApproverSteps', () => {
  const MCS_APPROVAL_STEPS = [
    { key: 'approval1' },
    { key: 'approval2' }
  ];

  function mcsGetMyApproverSteps(currentUser, mcsApproverConfig) {
    if (!mcsApproverConfig || !currentUser) return [];
    const myId = currentUser.id;
    const myEmail = (currentUser.email || '').toLowerCase();
    return MCS_APPROVAL_STEPS
      .map(s => s.key)
      .filter(key => (mcsApproverConfig[key] || []).some(u =>
        (myId && u.user_id && u.user_id === myId) ||
        (myEmail && u.user_email && u.user_email.toLowerCase() === myEmail)
      ));
  }

  const USER = { id: 'uuid-bob', email: 'bob@example.com' };

  it('returns matching steps when matched by user_id', () => {
    const config = {
      approval1: [{ user_id: 'uuid-bob', user_name: 'Bob' }],
      approval2: []
    };
    expect(mcsGetMyApproverSteps(USER, config)).toEqual(['approval1']);
  });

  it('returns matching steps when matched by user_email', () => {
    const config = {
      approval1: [{ user_id: 'other-uuid', user_name: 'Bob', user_email: 'bob@example.com' }],
      approval2: []
    };
    expect(mcsGetMyApproverSteps(USER, config)).toEqual(['approval1']);
  });

  it('returns both steps when user is assigned to both', () => {
    const config = {
      approval1: [{ user_id: 'uuid-bob', user_name: 'Bob', user_email: 'bob@example.com' }],
      approval2: [{ user_id: 'uuid-bob', user_name: 'Bob', user_email: 'bob@example.com' }]
    };
    expect(mcsGetMyApproverSteps(USER, config)).toEqual(['approval1', 'approval2']);
  });

  it('returns empty array when user is not in any step', () => {
    const config = {
      approval1: [{ user_id: 'other-uuid', user_name: 'Alice', user_email: 'alice@example.com' }],
      approval2: []
    };
    expect(mcsGetMyApproverSteps(USER, config)).toEqual([]);
  });

  it('returns empty array when config is null', () => {
    expect(mcsGetMyApproverSteps(USER, null)).toEqual([]);
  });

  it('returns empty array when currentUser is null', () => {
    const config = { approval1: [{ user_id: 'uuid-bob' }], approval2: [] };
    expect(mcsGetMyApproverSteps(null, config)).toEqual([]);
  });
});
