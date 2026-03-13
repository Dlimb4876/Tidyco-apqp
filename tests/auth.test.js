const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

// Mock the supabase library used in auth.js
global.supabase = {
  createClient: jest.fn(() => global.supa)
};

// Mock Supabase auth methods
global.supa = {
  auth: {
    signInWithPassword: jest.fn(),
    signOut: jest.fn().mockResolvedValue({}),
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'test-user', email: 'test@test.com' } } }
    })
  }
};

// Global state
global.db = { programmes: [] };
global.progId = null;
global.currentUser = null;

// Mock functions called by auth.js
global.launchApp = jest.fn();
global.navigate = jest.fn();
global.showLoginErr = undefined; // will be defined by eval'd script

// Set up DOM from index.html
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Ensure required login DOM elements exist
['loginEmail', 'loginPassword', 'loginBtn', 'loginErr', 'appShell', 'loginScreen'].forEach(id => {
  if (!document.getElementById(id)) {
    const el = document.createElement(
      id === 'loginBtn' ? 'button' : id === 'loginEmail' || id === 'loginPassword' ? 'input' : 'div'
    );
    el.id = id;
    if (id === 'loginBtn') el.textContent = 'Sign in';
    document.body.appendChild(el);
  }
});

// Load auth script
const script = fs.readFileSync(path.resolve(__dirname, '../core/js/auth.js'), 'utf8');
eval(script);

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('Auth Module (auth.js)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.currentUser = null;
    global.db = { programmes: [] };
    global.progId = null;

    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginErr').style.display = 'none';
    document.getElementById('loginErr').textContent = '';
    document.getElementById('loginBtn').disabled = false;
    document.getElementById('loginBtn').textContent = 'Sign in';
  });

  // ── doLogin ──────────────────────────────────────────────────
  describe('doLogin()', () => {
    test('should show error when email and password are empty', async () => {
      document.getElementById('loginEmail').value = '';
      document.getElementById('loginPassword').value = '';

      await doLogin();

      const errDiv = document.getElementById('loginErr');
      expect(errDiv.style.display).toBe('block');
      expect(errDiv.textContent).toBe('Please enter your email and password.');
    });

    test('should show error when email is empty but password is filled', async () => {
      document.getElementById('loginEmail').value = '';
      document.getElementById('loginPassword').value = 'password123';

      await doLogin();

      expect(document.getElementById('loginErr').style.display).toBe('block');
    });

    test('should show error when password is empty but email is filled', async () => {
      document.getElementById('loginEmail').value = 'user@example.com';
      document.getElementById('loginPassword').value = '';

      await doLogin();

      expect(document.getElementById('loginErr').style.display).toBe('block');
    });

    test('should call launchApp on successful login', async () => {
      document.getElementById('loginEmail').value = 'user@example.com';
      document.getElementById('loginPassword').value = 'password123';

      global.supa.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'test-user', email: 'user@example.com' } },
        error: null
      });

      await doLogin();

      expect(global.launchApp).toHaveBeenCalledTimes(1);
    });

    test('should show error message on failed login', async () => {
      document.getElementById('loginEmail').value = 'user@example.com';
      document.getElementById('loginPassword').value = 'wrongpassword';

      global.supa.auth.signInWithPassword.mockResolvedValue({
        data: {},
        error: { message: 'Invalid login credentials' }
      });

      await doLogin();

      const errDiv = document.getElementById('loginErr');
      expect(errDiv.style.display).toBe('block');
      expect(errDiv.textContent).toBe('Invalid login credentials');
      expect(global.launchApp).not.toHaveBeenCalled();
    });

    test('should re-enable login button after failed login', async () => {
      document.getElementById('loginEmail').value = 'user@example.com';
      document.getElementById('loginPassword').value = 'wrongpassword';

      global.supa.auth.signInWithPassword.mockResolvedValue({
        data: {},
        error: { message: 'Invalid login credentials' }
      });

      await doLogin();

      expect(document.getElementById('loginBtn').disabled).toBe(false);
      expect(document.getElementById('loginBtn').textContent).toBe('Sign in');
    });

    test('should not call Supabase auth when credentials are empty', async () => {
      document.getElementById('loginEmail').value = '';
      document.getElementById('loginPassword').value = '';

      await doLogin();

      expect(global.supa.auth.signInWithPassword).not.toHaveBeenCalled();
    });
  });

  // ── showLoginErr ─────────────────────────────────────────────
  describe('showLoginErr()', () => {
    test('should display the error element with the given message', () => {
      showLoginErr('Something went wrong');
      const e = document.getElementById('loginErr');
      expect(e.style.display).toBe('block');
      expect(e.textContent).toBe('Something went wrong');
    });
  });

  // ── doLogout ─────────────────────────────────────────────────
  describe('doLogout()', () => {
    test('should call supa.auth.signOut', async () => {
      await doLogout();
      expect(global.supa.auth.signOut).toHaveBeenCalled();
    });

    test('should clear db and progId after logout', async () => {
      global.progId = 'some-prog';

      await doLogout();

      // currentUser is a local let in auth.js scope; db and progId are globals
      expect(global.progId).toBeNull();
      expect(global.db).toEqual({ programmes: [] });
    });

    test('should hide appShell and show loginScreen', async () => {
      const appShell = document.getElementById('appShell');
      const loginScreen = document.getElementById('loginScreen');
      appShell.style.display = 'flex';
      loginScreen.style.display = 'none';

      await doLogout();

      expect(appShell.style.display).toBe('none');
      expect(loginScreen.style.display).toBe('flex');
    });

    test('should clear the password field after logout', async () => {
      document.getElementById('loginPassword').value = 'somepassword';

      await doLogout();

      expect(document.getElementById('loginPassword').value).toBe('');
    });
  });
});
