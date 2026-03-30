// error-handling-save.test.js — Phase 1.3: Save Failure & Retry Behaviour
// Verifies badge transitions, single automatic retry after 1500ms, and that
// no further retries occur after the retry also fails.

import { jest } from '@jest/globals'

// ── Mutable backing object for the Supabase mock ──────────────
// Shared reference so tests can reassign .from without re-importing.
const _mockClient = { from: jest.fn() }

// ── ESM mocks (must come before dynamic imports) ──────────────

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: _mockClient,
  currentUser: { id: 'test-user', email: 'test@test.com' },
  setCurrentUser: jest.fn()
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

jest.unstable_mockModule('../utils/js/realtime.js', () => ({
  createRealtimeSubscription: jest.fn()
}))

jest.unstable_mockModule('../utils/js/helpers.js', () => ({
  showToast: jest.fn(),
  esc: (s) => String(s == null ? '' : s)
}))

jest.unstable_mockModule('../portals/capacity/production/js/prod-capacity-data.js', () => ({
  setProdCapRefreshCurrentTab: jest.fn(),
  prodCapDataInit: jest.fn()
}))

// ── Dynamic imports (after mocks are registered) ──────────────

const { saveRemote, setSyncBadge } = await import('../core/js/db.js')
const { db } = await import('../core/js/state.js')

// ── Helpers ───────────────────────────────────────────────────

/** Build a Supabase chain that makes update().eq().select() resolve to result. */
function mockUpdateChain(result) {
  const selectFn = jest.fn().mockResolvedValue(result)
  const eqFn = jest.fn(() => ({ select: selectFn }))
  const updateFn = jest.fn(() => ({ eq: eqFn }))
  _mockClient.from = jest.fn(() => ({ update: updateFn }))
  return { updateFn, eqFn, selectFn }
}

/** Standard update error matching plan spec. */
const UPDATE_ERROR = { data: null, error: { message: 'Network Timeout', code: 'PGRST301' } }

// ── Tests ─────────────────────────────────────────────────────

describe('Phase 1.3 — Save Failure & Retry Behaviour', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    // Provide one project so saveRemote has something to write
    db.projects = [{ id: 'proj-1', name: 'Test Project' }]

    // Set up DOM badge elements required by setSyncBadge
    document.getElementById('syncBadge')?.remove()
    document.getElementById('bottombarSync')?.remove()

    const badge = document.createElement('span')
    badge.id = 'syncBadge'
    document.body.appendChild(badge)

    const bottombar = document.createElement('span')
    bottombar.id = 'bottombarSync'
    document.body.appendChild(bottombar)
  })

  afterEach(() => {
    jest.useRealTimers()
    document.getElementById('syncBadge')?.remove()
    document.getElementById('bottombarSync')?.remove()
  })

  // ── Badge transitions on first failure ─────────────────────

  describe('badge transitions — first-attempt failure', () => {
    it('should set badge to syncing → retrying… when update fails on first attempt', async () => {
      mockUpdateChain(UPDATE_ERROR)
      jest.spyOn(console, 'error').mockImplementation(() => {})

      // Call without attempt flag — this is the first attempt
      await saveRemote()

      const badge = document.getElementById('syncBadge')
      expect(badge.className).toBe('sync-badge syncing')
      expect(badge.textContent).toBe('● retrying…')

      console.error.mockRestore()
    })

    it('should also update #bottombarSync to syncing on first failure', async () => {
      mockUpdateChain(UPDATE_ERROR)
      jest.spyOn(console, 'error').mockImplementation(() => {})

      await saveRemote()

      const bottombar = document.getElementById('bottombarSync')
      expect(bottombar.className).toBe('bottombar-status syncing')
      expect(bottombar.textContent).toBe('● retrying…')

      console.error.mockRestore()
    })
  })

  // ── Single automatic retry after 1500ms ────────────────────

  describe('automatic retry — fires once after 1500ms', () => {
    it('should schedule exactly one retry after 1500ms on first failure', async () => {
      // Both attempts fail so we can observe the retry fires
      mockUpdateChain(UPDATE_ERROR)
      jest.spyOn(console, 'error').mockImplementation(() => {})

      const firstRun = saveRemote()
      await firstRun

      // First run done — badge should be "retrying…" and a 1500ms timer queued
      const badge = document.getElementById('syncBadge')
      expect(badge.textContent).toBe('● retrying…')

      // Advance to trigger the retry callback
      jest.advanceTimersByTime(1500)
      // Flush the async retry
      await Promise.resolve()
      await Promise.resolve()

      // After retry (attempt=true) the badge should now be 'error'
      expect(badge.className).toBe('sync-badge error')

      console.error.mockRestore()
    })

    it('should NOT schedule a second retry when the retry itself fails', async () => {
      mockUpdateChain(UPDATE_ERROR)
      jest.spyOn(console, 'error').mockImplementation(() => {})
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

      // First attempt
      await saveRemote()
      // Advance and flush retry
      jest.advanceTimersByTime(1500)
      await Promise.resolve()
      await Promise.resolve()

      // The only setTimeout call for saveRemote was from the first attempt.
      // No additional saveRemote setTimeout should have been scheduled.
      const saveRemoteTimerCalls = setTimeoutSpy.mock.calls.filter(
        call => typeof call[0] === 'function' && call[1] === 1500
      )
      // Exactly one 1500ms timer (from first attempt), none from the retry
      expect(saveRemoteTimerCalls).toHaveLength(1)

      console.error.mockRestore()
      setTimeoutSpy.mockRestore()
    })
  })

  // ── Badge stays 'error' after retry failure ─────────────────

  describe('badge stays error after retry also fails', () => {
    it('should show error badge with the failed project name after retry', async () => {
      mockUpdateChain(UPDATE_ERROR)
      jest.spyOn(console, 'error').mockImplementation(() => {})

      // First attempt — queues retry
      await saveRemote()
      jest.advanceTimersByTime(1500)
      await Promise.resolve()
      await Promise.resolve()

      const badge = document.getElementById('syncBadge')
      expect(badge.className).toBe('sync-badge error')
      // Error text should include the project name and the error message
      expect(badge.textContent).toContain('● save failed:')
      expect(badge.textContent).toContain('Test Project')

      console.error.mockRestore()
    })

    it('should update #bottombarSync to error state after retry fails', async () => {
      mockUpdateChain(UPDATE_ERROR)
      jest.spyOn(console, 'error').mockImplementation(() => {})

      await saveRemote()
      jest.advanceTimersByTime(1500)
      await Promise.resolve()
      await Promise.resolve()

      const bottombar = document.getElementById('bottombarSync')
      expect(bottombar.className).toBe('bottombar-status error')
      expect(bottombar.textContent).toContain('● save failed:')

      console.error.mockRestore()
    })

    it('badge should not revert to syncing after retry fails', async () => {
      mockUpdateChain(UPDATE_ERROR)
      jest.spyOn(console, 'error').mockImplementation(() => {})

      await saveRemote()
      jest.advanceTimersByTime(1500)
      await Promise.resolve()
      await Promise.resolve()

      // Advance well past any potential additional timer
      jest.advanceTimersByTime(5000)
      await Promise.resolve()

      const badge = document.getElementById('syncBadge')
      // Must still be error, not syncing (no further retries)
      expect(badge.className).toBe('sync-badge error')

      console.error.mockRestore()
    })
  })

  // ── Exception path (catch block) ────────────────────────────

  describe('exception path — saveRemote throws', () => {
    it('should show retrying… when update throws on first attempt', async () => {
      // Make update throw an exception rather than returning an error object
      _mockClient.from = jest.fn(() => ({
        update: jest.fn(() => { throw new Error('Connection refused') })
      }))
      jest.spyOn(console, 'error').mockImplementation(() => {})

      await saveRemote()

      const badge = document.getElementById('syncBadge')
      expect(badge.className).toBe('sync-badge syncing')
      expect(badge.textContent).toBe('● retrying…')

      console.error.mockRestore()
    })

    it('should show error badge when retry also throws', async () => {
      _mockClient.from = jest.fn(() => ({
        update: jest.fn(() => { throw new Error('Connection refused') })
      }))
      jest.spyOn(console, 'error').mockImplementation(() => {})

      // First attempt queues retry
      await saveRemote()
      jest.advanceTimersByTime(1500)
      await Promise.resolve()
      await Promise.resolve()

      const badge = document.getElementById('syncBadge')
      expect(badge.className).toBe('sync-badge error')
      expect(badge.textContent).toContain('Connection refused')

      console.error.mockRestore()
    })

    it('should NOT schedule a third retry when the exception-path retry throws', async () => {
      _mockClient.from = jest.fn(() => ({
        update: jest.fn(() => { throw new Error('Connection refused') })
      }))
      jest.spyOn(console, 'error').mockImplementation(() => {})
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

      await saveRemote()
      jest.advanceTimersByTime(1500)
      await Promise.resolve()
      await Promise.resolve()

      const saveRemoteTimerCalls = setTimeoutSpy.mock.calls.filter(
        call => typeof call[0] === 'function' && call[1] === 1500
      )
      expect(saveRemoteTimerCalls).toHaveLength(1)

      console.error.mockRestore()
      setTimeoutSpy.mockRestore()
    })
  })

  // ── Success path (control case) ─────────────────────────────

  describe('success path — no retry when save succeeds', () => {
    it('should show saved badge and not schedule any retry on success', async () => {
      // Update returns an existing row (no insert needed)
      _mockClient.from = jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn().mockResolvedValue({
              data: [{ id: 'db-1', prog_id: 'proj-1' }],
              error: null
            })
          }))
        }))
      }))

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

      await saveRemote()

      const badge = document.getElementById('syncBadge')
      expect(badge.className).toBe('sync-badge saved')
      expect(badge.textContent).toContain('● saved')

      // No retry timer should be scheduled on success
      const saveRemoteTimerCalls = setTimeoutSpy.mock.calls.filter(
        call => typeof call[0] === 'function' && call[1] === 1500
      )
      expect(saveRemoteTimerCalls).toHaveLength(0)

      setTimeoutSpy.mockRestore()
    })
  })
})
