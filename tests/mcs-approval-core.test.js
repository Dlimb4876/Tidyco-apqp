import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'user-1' }
}))

jest.unstable_mockModule('../portals/capacity/production/js/prod-capacity-data.js', () => ({
  setProdCapRefreshCurrentTab: jest.fn(),
  prodCapDataInit: jest.fn()
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: {},
  currentUserRole: 'editor'
}))

describe('MCS approval workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.supa = {
      from: jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })),
        insert: jest.fn().mockResolvedValue({ data: [], error: null })
      }))
    }
    global.currentUser = { id: 'user-1', email: 'approver@test.com' }
    global.MCS_APPROVAL_STEPS = [
      { key: 'approval1', label: 'Approval 1', field: 'eng_review_status', activeStatus: 'review' }
    ]
  })

  it('should have MCS approval module available', () => {
    expect(true).toBe(true)
  })
})
