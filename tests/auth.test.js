import { jest } from '@jest/globals'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─────────────────────────────────────────────────────────────
// Mock Dependencies (must be set up before importing modules)
// ─────────────────────────────────────────────────────────────

const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signOut: jest.fn().mockResolvedValue({}),
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'test-user', email: 'test@test.com' } } }
    }),
    onAuthStateChange: jest.fn()
  },
  from: jest.fn()
}

const mockState = {
  currentUser: null,
  db: { projects: [] },
  currentUserRole: null,
  currentUserPermissions: {},
  currentUserTeams: [],
  appState: { progId: null }
}

// Mock supa.js module
jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: mockSupabase,
  currentUser: mockState.currentUser,
  setCurrentUser: jest.fn((u) => { mockState.currentUser = u })
}))

// Mock state.js module
jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: mockState.appState,
  setDb: jest.fn((db) => { mockState.db = db }),
  currentUserRole: mockState.currentUserRole,
  setCurrentUserRole: jest.fn((r) => { mockState.currentUserRole = r }),
  setCurrentUserPermissions: jest.fn((p) => { mockState.currentUserPermissions = p }),
  setCurrentUserTeams: jest.fn((t) => { mockState.currentUserTeams = t })
}))

// ─────────────────────────────────────────────────────────────
// Set up DOM
// ─────────────────────────────────────────────────────────────

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8')
document.documentElement.innerHTML = html.toString()

// Ensure required login DOM elements exist
;['loginEmail', 'loginPassword', 'loginBtn', 'loginErr', 'appShell', 'loginScreen'].forEach(id => {
  if (!document.getElementById(id)) {
    const el = document.createElement(
      id === 'loginBtn' ? 'button' : id === 'loginEmail' || id === 'loginPassword' ? 'input' : 'div'
    )
    el.id = id
    if (id === 'loginBtn') el.textContent = 'Sign in'
    document.body.appendChild(el)
  }
})

// ─────────────────────────────────────────────────────────────
// Import the module under test (after mocks are set up)
// ─────────────────────────────────────────────────────────────

const { doLogin, doLogout, showLoginErr } = await import('../core/js/auth.js')

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('Auth Module (auth.js)', () => {
  const mockLaunchApp = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockState.currentUser = null
    mockState.db = { projects: [] }
    mockState.currentUserRole = null
    mockState.appState.progId = null

    document.getElementById('loginEmail').value = ''
    document.getElementById('loginPassword').value = ''
    document.getElementById('loginErr').style.display = 'none'
    document.getElementById('loginErr').textContent = ''
    document.getElementById('loginBtn').disabled = false
    document.getElementById('loginBtn').textContent = 'Sign in'
  })

  // ── doLogin ──────────────────────────────────────────────────
  describe('doLogin()', () => {
    test('should show error when email and password are empty', async () => {
      document.getElementById('loginEmail').value = ''
      document.getElementById('loginPassword').value = ''

      await doLogin(mockLaunchApp)

      const errDiv = document.getElementById('loginErr')
      expect(errDiv.style.display).toBe('block')
      expect(errDiv.textContent).toBe('Please enter your email and password.')
    })

    test('should show error when email is empty but password is filled', async () => {
      document.getElementById('loginEmail').value = ''
      document.getElementById('loginPassword').value = 'password123'

      await doLogin(mockLaunchApp)

      expect(document.getElementById('loginErr').style.display).toBe('block')
    })

    test('should show error when password is empty but email is filled', async () => {
      document.getElementById('loginEmail').value = 'user@tidyco.co.uk'
      document.getElementById('loginPassword').value = ''

      await doLogin(mockLaunchApp)

      expect(document.getElementById('loginErr').style.display).toBe('block')
    })

    test('should call launchApp on successful login', async () => {
      document.getElementById('loginEmail').value = 'user@tidyco.co.uk'
      document.getElementById('loginPassword').value = 'password123'

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'test-user', email: 'user@tidyco.co.uk' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { role: 'editor' }, error: null })
          })
        })
      })

      await doLogin(mockLaunchApp)

      expect(mockLaunchApp).toHaveBeenCalledTimes(1)
    })

    test('should show error message on failed login', async () => {
      document.getElementById('loginEmail').value = 'user@tidyco.co.uk'
      document.getElementById('loginPassword').value = 'wrongpassword'

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {},
        error: { message: 'Invalid login credentials' }
      })

      await doLogin(mockLaunchApp)

      const errDiv = document.getElementById('loginErr')
      expect(errDiv.style.display).toBe('block')
      expect(errDiv.textContent).toBe('Invalid login credentials')
      expect(mockLaunchApp).not.toHaveBeenCalled()
    })

    test('should re-enable login button after failed login', async () => {
      document.getElementById('loginEmail').value = 'user@tidyco.co.uk'
      document.getElementById('loginPassword').value = 'wrongpassword'

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {},
        error: { message: 'Invalid login credentials' }
      })

      await doLogin(mockLaunchApp)

      expect(document.getElementById('loginBtn').disabled).toBe(false)
      expect(document.getElementById('loginBtn').textContent).toBe('Sign in')
    })

    test('should not call Supabase auth when credentials are empty', async () => {
      document.getElementById('loginEmail').value = ''
      document.getElementById('loginPassword').value = ''

      await doLogin(mockLaunchApp)

      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    test('should block non-tidyco email before calling Supabase auth', async () => {
      document.getElementById('loginEmail').value = 'user@example.com'
      document.getElementById('loginPassword').value = 'password123'

      await doLogin(mockLaunchApp)

      const errDiv = document.getElementById('loginErr')
      expect(errDiv.style.display).toBe('block')
      expect(errDiv.textContent).toBe('Please use your @tidyco.co.uk email address.')
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    test('should block uppercase domain — domain check is case-sensitive', async () => {
      document.getElementById('loginEmail').value = 'user@TIDYCO.CO.UK'
      document.getElementById('loginPassword').value = 'password123'

      await doLogin(mockLaunchApp)

      const errDiv = document.getElementById('loginErr')
      expect(errDiv.style.display).toBe('block')
      expect(errDiv.textContent).toBe('Please use your @tidyco.co.uk email address.')
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    test('should block a subdomain that only ends with tidyco.co.uk via spoofing', async () => {
      document.getElementById('loginEmail').value = 'user@evil.tidyco.co.uk'
      document.getElementById('loginPassword').value = 'password123'

      await doLogin(mockLaunchApp)

      // A subdomain does NOT match endsWith('@tidyco.co.uk'), so it is blocked.
      const errDiv = document.getElementById('loginErr')
      expect(errDiv.style.display).toBe('block')
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })
  })

  // ── showLoginErr ─────────────────────────────────────────────
  describe('showLoginErr()', () => {
    test('should display the error element with the given message', () => {
      showLoginErr('Something went wrong')
      const e = document.getElementById('loginErr')
      expect(e.style.display).toBe('block')
      expect(e.textContent).toBe('Something went wrong')
    })
  })

  // ── doLogout ─────────────────────────────────────────────────
  describe('doLogout()', () => {
    test('should call supabase.auth.signOut', async () => {
      await doLogout()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    test('should hide appShell and show loginScreen', async () => {
      const appShell = document.getElementById('appShell')
      const loginScreen = document.getElementById('loginScreen')
      appShell.style.display = 'flex'
      loginScreen.style.display = 'none'

      await doLogout()

      expect(appShell.style.display).toBe('none')
      expect(loginScreen.style.display).toBe('flex')
    })

    test('should clear the password field after logout', async () => {
      document.getElementById('loginPassword').value = 'somepassword'

      await doLogout()

      expect(document.getElementById('loginPassword').value).toBe('')
    })
  })
})
