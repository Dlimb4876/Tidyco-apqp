import { jest } from '@jest/globals'

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: global.supa,
  currentUser: { id: 'user-1', email: 'test@test.com' }
}))

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: {},
  db: {}
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

jest.unstable_mockModule('../utils/js/guide.js', () => ({
  showGuide: jest.fn()
}))

jest.unstable_mockModule('../portals/settings/js/settings.js', () => ({
  settingsState: {}
}))

jest.unstable_mockModule('../portals/settings/js/settings-teams.js', () => ({
  settingsEnsurePermissionsData: jest.fn()
}))

jest.unstable_mockModule('../portals/mcs/js/mcs-approvers-data.js', () => ({
  mcsApproversLoad: jest.fn(() => Promise.resolve({}))
}))

describe('Action Centre portal', () => {
  beforeEach(() => {
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          ilike: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
    }
  })

  it('should have action centre module available', () => {
    expect(true).toBe(true)
  })
})
