import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const script = readFileSync(
  resolve(__dirname, '../portals/mcs/js/mcs-approvers-data.js'),
  'utf8'
);

describe('MCS Approver Permissions', () => {
  beforeEach(() => {
    global.MCS_APPROVAL_STEPS = [
      { key: 'approval1', label: 'Approval 1', field: 'eng_review_status', activeStatus: 'review' },
      { key: 'approval2', label: 'Approval 2', field: 'qa_review_status', activeStatus: 'final_review' },
    ];

    global.currentUser = { id: 'uuid-bob', email: 'bob@example.com' };
    global.mcsApproverConfig = {
      approval1: [{ user_id: 'uuid-bob', user_name: 'Bob', user_email: 'bob@example.com' }],
      approval2: [{ user_id: 'uuid-alice', user_name: 'Alice', user_email: 'alice@example.com' }],
    };

    global.canEdit = jest.fn(() => false);

    eval(`${script}\n;globalThis.__mcsApprover = { mcsCanApproveStep, mcsGetActiveStepKey, mcsGetMyApproverSteps };`); // eslint-disable-line no-eval
  });

  describe('mcsCanApproveStep', () => {
    it('returns true when user matches assigned approver by user_id', () => {
      expect(globalThis.__mcsApprover.mcsCanApproveStep('approval1', {})).toBe(true);
    });

    it('returns false when user is not assigned for the step', () => {
      expect(globalThis.__mcsApprover.mcsCanApproveStep('approval2', {})).toBe(false);
    });

    it('allows nominated approver on approval1 via eng_review_notes', () => {
      const change = { eng_review_notes: 'nominated_approver:bob@example.com' };
      expect(globalThis.__mcsApprover.mcsCanApproveStep('approval1', change)).toBe(true);
    });

    it('falls back to canEdit when config is not loaded', () => {
      global.mcsApproverConfig = null;
      global.canEdit = jest.fn(() => true);

      expect(globalThis.__mcsApprover.mcsCanApproveStep('approval1', {})).toBe(true);
      expect(global.canEdit).toHaveBeenCalled();
    });

    it('falls back to canEdit when no approvers are assigned to a step', () => {
      global.mcsApproverConfig = { approval1: [] };
      global.canEdit = jest.fn(() => true);

      expect(globalThis.__mcsApprover.mcsCanApproveStep('approval1', {})).toBe(true);
    });
  });

  describe('mcsGetActiveStepKey', () => {
    it('returns approval1 for review status', () => {
      expect(globalThis.__mcsApprover.mcsGetActiveStepKey({ status: 'review' })).toBe('approval1');
    });

    it('returns approval2 for final_review status', () => {
      expect(globalThis.__mcsApprover.mcsGetActiveStepKey({ status: 'final_review' })).toBe('approval2');
    });

    it('returns null for non-approval statuses', () => {
      expect(globalThis.__mcsApprover.mcsGetActiveStepKey({ status: 'implementing' })).toBeNull();
    });
  });

  describe('mcsGetMyApproverSteps', () => {
    it('returns only steps assigned to the current user', () => {
      const steps = globalThis.__mcsApprover.mcsGetMyApproverSteps();
      expect(steps).toEqual(['approval1']);
    });

    it('returns empty when no current user', () => {
      global.currentUser = null;
      expect(globalThis.__mcsApprover.mcsGetMyApproverSteps()).toEqual([]);
    });
  });
});
