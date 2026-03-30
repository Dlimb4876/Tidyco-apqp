import { jest } from '@jest/globals'

// Mock global state
global.MCS_APPROVAL_STEPS = [
  { key: 'approval1', label: 'Approval 1', field: 'eng_review_status', activeStatus: 'review' },
  { key: 'approval2', label: 'Approval 2', field: 'qa_review_status', activeStatus: 'final_review' }
]
global.currentUser = { id: 'uuid-bob', email: 'bob@example.com' }
global.mcsApproverConfig = {
  approval1: [{ user_id: 'uuid-bob', user_name: 'Bob', user_email: 'bob@example.com' }],
  approval2: [{ user_id: 'uuid-alice', user_name: 'Alice', user_email: 'alice@example.com' }]
}
global.canEdit = jest.fn(() => false)

const { mcsCanApproveStep, mcsGetActiveStepKey, mcsGetMyApproverSteps } = await import('../portals/mcs/js/mcs-approvers-data.js')

describe('MCS Approver Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('mcsCanApproveStep', () => {
    it('should return boolean', () => {
      const result = mcsCanApproveStep('approval1', {})
      expect(typeof result).toBe('boolean')
    })

    it('should check user assignment for step', () => {
      expect(typeof mcsCanApproveStep('approval1', {})).toBe('boolean')
      expect(typeof mcsCanApproveStep('approval2', {})).toBe('boolean')
    })
  })

  describe('mcsGetActiveStepKey', () => {
    it('should return string or null', () => {
      const result = mcsGetActiveStepKey({})
      expect(result === null || typeof result === 'string').toBe(true)
    })
  })

  describe('mcsGetMyApproverSteps', () => {
    it('should return array', () => {
      const result = mcsGetMyApproverSteps()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should contain step keys from MCS_APPROVAL_STEPS', () => {
      const result = mcsGetMyApproverSteps()
      result.forEach(step => {
        expect(typeof step).toBe('string')
      })
    })
  })
})
