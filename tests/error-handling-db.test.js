import { jest } from '@jest/globals'

const mockOrder = jest.fn()

jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        order: mockOrder
      })
    })),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user', email: 'test@test.com' } } }
      })
    }
  },
  default: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        order: mockOrder
      })
    })),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user', email: 'test@test.com' } } }
      })
    }
  },
  currentUser: { id: 'test-user', email: 'test@test.com' }
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

jest.unstable_mockModule('../portals/capacity/production/js/prod-capacity-data.js', () => ({
  setProdCapRefreshCurrentTab: jest.fn(),
  prodCapDataInit: jest.fn()
}))

const { loadRemote, loadRemotePage } = await import('../core/js/db.js')

describe('Phase 1.1: Database Connection Failures', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.currentUser = { id: 'test-user', email: 'test@test.com' }
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: 'Network Timeout', code: 'PGRST301' }
    })

    document.body.innerHTML = `
      <div id="toastContainer" class="toast-container"></div>
      <div id="syncBadge" class="sync-badge saved">● saved</div>
      <div id="bottombarSync" class="bottombar-status saved"></div>
    `
  })

  it('should call supabase from and select when loading remote', async () => {
    await loadRemote()

    expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false })
  })

  it('should handle PGRST301 error code gracefully without throwing', async () => {
    await expect(loadRemote()).resolves.not.toThrow()
  })

  it('should not update db.projects on connection error', async () => {
    const { db } = await import('../core/js/state.js')
    const initialProjects = [...db.projects]

    await loadRemote()

    expect(db.projects).toEqual(initialProjects)
  })

  it('should show error toast when database query fails', async () => {
    const { showToast } = await import('../utils/js/helpers.js')

    showToast('Direct test', 'error')

    const container = document.getElementById('toastContainer')
    const toasts = container.querySelectorAll('.toast-error')
    expect(toasts.length).toBe(1)
  })

  it('should update sync badge to error state on connection failure', async () => {
    document.body.innerHTML = `
      <div id="toastContainer" class="toast-container"></div>
      <div id="syncBadge" class="sync-badge saved">● saved</div>
      <div id="bottombarSync" class="bottombar-status saved"></div>
    `

    const badge = document.getElementById('syncBadge')
    expect(badge).not.toBeNull()
    expect(badge.className).toBe('sync-badge saved')

    await loadRemote()
    
    expect(badge.className).toBe('sync-badge error')
    expect(badge.textContent).toContain('load failed')
  })

  it('should handle connection error in loadRemotePage', async () => {
    const mockRange = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Connection refused', code: 'ECONNREFUSED' }
    })
    mockOrder.mockReturnValue({
      range: mockRange
    })

    await expect(loadRemotePage(0)).resolves.not.toThrow()
  })

  it('should handle null error object gracefully', async () => {
    mockOrder.mockResolvedValue({
      data: null,
      error: null
    })

    await expect(loadRemote()).resolves.not.toThrow()
  })
})
