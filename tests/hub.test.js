/**
 * hub.test.js — Tests for portals/hub/js/hub.js
 *
 * Covers: renderHub HTML structure and navigation onclick attributes,
 *         hubPendingGateSignOffs() helper, and the "logged in as" widget.
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.showGuide = jest.fn();
global.navigate = jest.fn();
global.esc = (v) => String(v ?? '');
global.currentUser = { email: 'daniel.limb@tidyco.co.uk' };
global.currentUserProfile = null;
global.db = { projects: [] };

// Load hub.js
const src = fs.readFileSync(
  path.resolve(__dirname, '../portals/hub/js/hub.js'),
  'utf8'
);
eval(src); // eslint-disable-line no-eval

describe('renderHub()', () => {
  let html;

  beforeEach(() => {
    global.currentUser = { email: 'daniel.limb@tidyco.co.uk' };
    global.currentUserProfile = null;
    global.db = { projects: [] };
    html = renderHub(); // eslint-disable-line no-undef
  });

  it('returns a non-empty HTML string', () => {
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('contains the portal title', () => {
    expect(html).toContain('Tidyco Operations Portal');
  });

  it('contains a CAPACITY card', () => {
    expect(html).toContain('CAPACITY');
  });

  it('contains a PRODUCT DEVELOPMENT card', () => {
    expect(html).toContain('PRODUCT DEVELOPMENT');
  });

  it('contains a PRODUCTION card', () => {
    expect(html).toContain('PRODUCTION');
  });

  it('contains an OPERATIONS DASHBOARD card', () => {
    expect(html).toContain('OPERATIONS DASHBOARD');
  });

  it('includes navigate("capacity") on the capacity card', () => {
    expect(html).toContain("navigate('capacity')");
  });

  it('includes navigate("product-development") on the product development card', () => {
    expect(html).toContain("navigate('product-development')");
  });

  it('includes navigate("production") on the production card', () => {
    expect(html).toContain("navigate('production')");
  });

  it('includes navigate("operations") on the operations card', () => {
    expect(html).toContain("navigate('operations')");
  });

  it('includes a guide button', () => {
    expect(html).toContain("showGuide('hub')");
  });

  it('includes hub-grid layout class', () => {
    expect(html).toContain('hub-grid');
  });

  it('includes hub-card class for each portal card', () => {
    const matches = (html.match(/hub-card/g) || []).length;
    expect(matches).toBeGreaterThanOrEqual(4);
  });

  // ── "Logged in as" widget ─────────────────────────────────
  it('renders the hub-user-widget', () => {
    expect(html).toContain('hub-user-widget');
  });

  it('shows the user email in the widget', () => {
    expect(html).toContain('daniel.limb@tidyco.co.uk');
  });

  it('derives user name from email when full_name is absent', () => {
    // daniel.limb → Daniel Limb (capitalised words)
    expect(html).toContain('Daniel Limb');
  });

  it('shows full_name when currentUserProfile has one', () => {
    global.currentUserProfile = { full_name: 'Alice Smith', role: 'user' };
    const h = renderHub(); // eslint-disable-line no-undef
    expect(h).toContain('Alice Smith');
  });

  it('shows the user role badge', () => {
    global.currentUserProfile = { full_name: 'Alice Smith', role: 'admin' };
    const h = renderHub(); // eslint-disable-line no-undef
    expect(h).toContain('admin');
  });

  it('shows "user" role badge when profile has no role', () => {
    global.currentUserProfile = null;
    const h = renderHub(); // eslint-disable-line no-undef
    expect(h).toContain('user');
  });

  it('shows "Unknown" when both currentUser and currentUserProfile are null', () => {
    global.currentUser = null;
    global.currentUserProfile = null;
    const h = renderHub(); // eslint-disable-line no-undef
    expect(h).toContain('hub-user-widget');
    expect(h).toContain('Unknown');
  });

  it('shows empty email when currentUser is null', () => {
    global.currentUser = null;
    global.currentUserProfile = null;
    const h = renderHub(); // eslint-disable-line no-undef
    // email field should be empty (no crash)
    expect(typeof h).toBe('string');
    expect(h).toContain('hub-user-email');
  });
  it('does NOT show pending approvals banner for non-admin users', () => {
    global.currentUserProfile = { full_name: 'Bob', role: 'user' };
    global.db = {
      projects: [{
        gates: [{
          checks: [true, true],
          sigs: [{ role: 'ME Manager', name: 'Bob', date: '2026-01-01', signed: false }]
        }]
      }]
    };
    const h = renderHub(); // eslint-disable-line no-undef
    expect(h).not.toContain('hub-pending-approvals');
  });

  it('does NOT show pending approvals banner for admin when no gates are fully checked', () => {
    global.currentUserProfile = { full_name: 'Admin User', role: 'admin' };
    global.db = {
      projects: [{
        gates: [{
          checks: [true, false],
          sigs: [{ role: 'ME Manager', name: '', date: '', signed: false }]
        }]
      }]
    };
    const h = renderHub(); // eslint-disable-line no-undef
    expect(h).not.toContain('hub-pending-approvals');
  });

  it('shows pending approvals banner for admin when gates are fully checked but unsigned', () => {
    global.currentUserProfile = { full_name: 'Admin User', role: 'admin' };
    global.db = {
      projects: [{
        gates: [{
          checks: [true, true],
          sigs: [{ role: 'ME Manager', name: 'Admin User', date: '', signed: false }]
        }]
      }]
    };
    const h = renderHub(); // eslint-disable-line no-undef
    expect(h).toContain('hub-pending-approvals');
    expect(h).toContain('hub-approvals-badge');
  });

  it('shows correct pending count (1) in the approvals banner', () => {
    global.currentUserProfile = { full_name: 'Admin User', role: 'admin' };
    global.db = {
      projects: [{
        gates: [{
          checks: [true, true],
          sigs: [{ role: 'ME Manager', name: 'Admin', date: '', signed: false }]
        }]
      }]
    };
    const h = renderHub(); // eslint-disable-line no-undef
    expect(h).toContain('>1<');
    expect(h).toContain('pending gate sign-off ');
  });

  it('shows plural label when multiple pending gates exist', () => {
    global.currentUserProfile = { full_name: 'Admin User', role: 'admin' };
    global.db = {
      projects: [{
        gates: [
          { checks: [true], sigs: [{ role: 'ME Manager', name: 'X', date: '', signed: false }] },
          { checks: [true], sigs: [{ role: 'Ops Director', name: 'Y', date: '', signed: false }] }
        ]
      }]
    };
    const h = renderHub(); // eslint-disable-line no-undef
    expect(h).toContain('>2<');
    expect(h).toContain('pending gate sign-offs ');
  });

  it('does NOT show pending banner when admin has all gates signed', () => {
    global.currentUserProfile = { full_name: 'Admin User', role: 'admin' };
    global.db = {
      projects: [{
        gates: [{
          checks: [true, true],
          sigs: [{ role: 'ME Manager', name: 'Admin', date: '2026-01-01', signed: true }]
        }]
      }]
    };
    const h = renderHub(); // eslint-disable-line no-undef
    expect(h).not.toContain('hub-pending-approvals');
  });
});

describe('hubPendingGateSignOffs()', () => {
  beforeEach(() => {
    global.db = { projects: [] };
  });

  it('returns 0 when there are no projects', () => {
    expect(hubPendingGateSignOffs()).toBe(0); // eslint-disable-line no-undef
  });

  it('returns 0 when no gates are fully checked', () => {
    global.db = {
      projects: [{
        gates: [{ checks: [true, false], sigs: [{ signed: false }] }]
      }]
    };
    expect(hubPendingGateSignOffs()).toBe(0); // eslint-disable-line no-undef
  });

  it('returns 0 when all sigs are signed on a fully-checked gate', () => {
    global.db = {
      projects: [{
        gates: [{ checks: [true, true], sigs: [{ signed: true }] }]
      }]
    };
    expect(hubPendingGateSignOffs()).toBe(0); // eslint-disable-line no-undef
  });

  it('returns 1 when one gate is fully checked with an unsigned sig', () => {
    global.db = {
      projects: [{
        gates: [{ checks: [true], sigs: [{ signed: false }] }]
      }]
    };
    expect(hubPendingGateSignOffs()).toBe(1); // eslint-disable-line no-undef
  });

  it('counts pending gates across multiple projects', () => {
    global.db = {
      projects: [
        { gates: [{ checks: [true], sigs: [{ signed: false }] }] },
        { gates: [{ checks: [true], sigs: [{ signed: false }] }] }
      ]
    };
    expect(hubPendingGateSignOffs()).toBe(2); // eslint-disable-line no-undef
  });

  it('handles gates with empty checks array gracefully', () => {
    global.db = {
      projects: [{
        gates: [{ checks: [], sigs: [{ signed: false }] }]
      }]
    };
    expect(hubPendingGateSignOffs()).toBe(0); // eslint-disable-line no-undef
  });
});

describe('hubNameFromEmail()', () => {
  it('returns "Unknown" for null/empty input', () => {
    expect(hubNameFromEmail(null)).toBe('Unknown'); // eslint-disable-line no-undef
    expect(hubNameFromEmail('')).toBe('Unknown'); // eslint-disable-line no-undef
  });

  it('converts dot-separated email prefix to title case', () => {
    expect(hubNameFromEmail('daniel.limb@tidyco.co.uk')).toBe('Daniel Limb'); // eslint-disable-line no-undef
  });

  it('converts underscore-separated email prefix to title case', () => {
    expect(hubNameFromEmail('john_doe@example.com')).toBe('John Doe'); // eslint-disable-line no-undef
  });

  it('handles a single-word email prefix', () => {
    expect(hubNameFromEmail('admin@example.com')).toBe('Admin'); // eslint-disable-line no-undef
  });
});
