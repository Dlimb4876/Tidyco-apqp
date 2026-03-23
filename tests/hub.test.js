/**
 * hub.test.js — Tests for portals/hub/js/hub.js
 *
 * Covers: renderHub HTML structure and navigation onclick attributes
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.showGuide = jest.fn();
global.navigate = jest.fn();
global.esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
global.emailToDisplayName = (email) => {
  if (!email) return '';
  return email.split('@')[0].split(/[._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
};

// Load hub.js
const src = fs.readFileSync(
  path.resolve(__dirname, '../portals/hub/js/hub.js'),
  'utf8'
);
eval(src); // eslint-disable-line no-eval

describe('renderHub()', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset action centre state before each test
    global.actionCentreLoading = false;
    global.actionCentreData = null;
    global.currentUser = null;
    global.actionCentreGetMyName = jest.fn().mockReturnValue('');
    global.actionCentreLoad = jest.fn();
  });

  it('returns a non-empty HTML string', () => {
    const html = renderHub(); // eslint-disable-line no-undef
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('contains the portal title', () => {
    const html = renderHub(); // eslint-disable-line no-undef
    expect(html).toContain('Tidyco Operations Portal');
  });

  it('contains a CAPACITY card', () => {
    const html = renderHub(); // eslint-disable-line no-undef
    expect(html).toContain('CAPACITY');
  });

  it('contains a PRODUCT DEVELOPMENT card', () => {
    const html = renderHub(); // eslint-disable-line no-undef
    expect(html).toContain('PRODUCT DEVELOPMENT');
  });

  it('contains a PRODUCTION card', () => {
    const html = renderHub(); // eslint-disable-line no-undef
    expect(html).toContain('PRODUCTION');
  });

  it('contains an OPERATIONS DASHBOARD card', () => {
    const html = renderHub(); // eslint-disable-line no-undef
    expect(html).toContain('OPERATIONS DASHBOARD');
  });

  it('includes navigate("capacity") on the capacity card', () => {
    const html = renderHub(); // eslint-disable-line no-undef
    expect(html).toContain("navigate('capacity')");
  });

  it('includes navigate("product-development") on the product development card', () => {
    const html = renderHub(); // eslint-disable-line no-undef
    expect(html).toContain("navigate('product-development')");
  });

  it('includes navigate("production") on the production card', () => {
    const html = renderHub(); // eslint-disable-line no-undef
    expect(html).toContain("navigate('production')");
  });

  it('includes navigate("operations") on the operations card', () => {
    const html = renderHub(); // eslint-disable-line no-undef
    expect(html).toContain("navigate('operations')");
  });

  it('includes a guide button', () => {
    const html = renderHub(); // eslint-disable-line no-undef
    expect(html).toContain("showGuide('hub')");
  });

  it('includes hub-grid layout class', () => {
    const html = renderHub(); // eslint-disable-line no-undef
    expect(html).toContain('hub-grid');
  });

  it('includes hub-card class for each portal card', () => {
    const html = renderHub(); // eslint-disable-line no-undef
    const matches = (html.match(/hub-card/g) || []).length;
    expect(matches).toBeGreaterThanOrEqual(4);
  });

  it('shows empty favourites message when no favourites are saved', () => {
    const html = renderHub(); // eslint-disable-line no-undef
    expect(html).toContain('No favourites yet. Star pages or NPI products for quick access.');
  });

  it('shows favourited page in favourites panel for current user', () => {
    global.currentUser = { email: 'fav.user@example.com' };
    localStorage.setItem('tidyco_favourites_v1_fav.user@example.com', JSON.stringify({
      version: 1,
      pages: ['capacity'],
      products: []
    }));
    const html = renderHub(); // eslint-disable-line no-undef
    expect(html).toContain('📊 Capacity');
  });
});

describe('renderHubActionWidget()', () => {
  beforeEach(() => {
    global.actionCentreLoading = false;
    global.actionCentreData = null;
    global.currentUser = null;
    global.actionCentreGetMyName = jest.fn().mockReturnValue('');
    global.actionCentreLoad = jest.fn();
  });

  it('renders the hub-widget container', () => {
    const html = renderHubActionWidget(); // eslint-disable-line no-undef
    expect(html).toContain('hub-widget');
  });

  it('includes "Logged in as" label', () => {
    const html = renderHubActionWidget(); // eslint-disable-line no-undef
    expect(html).toContain('Logged in as');
  });

  it('includes a link to the action centre', () => {
    const html = renderHubActionWidget(); // eslint-disable-line no-undef
    expect(html).toContain("navigate('action-centre')");
  });

  it('shows user name when actionCentreGetMyName returns a value', () => {
    global.actionCentreGetMyName = jest.fn().mockReturnValue('Daniel Limb');
    const html = renderHubActionWidget(); // eslint-disable-line no-undef
    expect(html).toContain('Daniel Limb');
  });

  it('falls back to emailToDisplayName when actionCentreGetMyName is not available', () => {
    global.actionCentreGetMyName = undefined;
    global.currentUser = { email: 'john.smith@example.com' };
    const html = renderHubActionWidget(); // eslint-disable-line no-undef
    expect(html).toContain('John Smith');
  });

  it('shows loading text when actionCentreLoading is true', () => {
    global.actionCentreLoading = true;
    const html = renderHubActionWidget(); // eslint-disable-line no-undef
    expect(html).toContain('Loading actions');
  });

  it('shows open and overdue counts when actionCentreData is loaded', () => {
    global.actionCentreData = {
      actions: [
        { status: 'Open', due_date: '2020-01-01' }, // overdue
        { status: 'Closed', due_date: null },
      ],
      pfmea: [
        { action_taken: false, action_due: '2020-01-01' }, // overdue
      ],
      risks: [
        { status: 'Open' },
      ],
      error: null,
    };
    const html = renderHubActionWidget(); // eslint-disable-line no-undef
    expect(html).toContain('hub-widget-stats');
    expect(html).toContain('hub-widget-overdue'); // overdue count highlighted
  });

  it('does not show overdue highlight when all items are on time', () => {
    global.actionCentreData = {
      actions: [{ status: 'Open', due_date: '2099-01-01' }],
      pfmea: [],
      risks: [],
      error: null,
    };
    const html = renderHubActionWidget(); // eslint-disable-line no-undef
    expect(html).not.toContain('hub-widget-overdue');
  });

  it('shows pending approval count when mcsApprovals has items', () => {
    global.actionCentreData = {
      actions: [],
      pfmea: [],
      risks: [],
      mcsApprovals: [
        { change: { id: 'c1', title: 'Test Change', status: 'review' }, stepKey: 'approval1', stepLabel: 'Approval 1' },
        { change: { id: 'c2', title: 'Another Change', status: 'final_review' }, stepKey: 'approval2', stepLabel: 'Approval 2' },
      ],
      error: null,
    };
    const html = renderHubActionWidget(); // eslint-disable-line no-undef
    expect(html).toContain('hub-widget-pending');
    expect(html).toContain('2');
    expect(html).toContain('pending approval');
    expect(html).not.toContain('Review Changes');
  });

  it('does not show pending approval stat when mcsApprovals is empty', () => {
    global.actionCentreData = {
      actions: [],
      pfmea: [],
      risks: [],
      mcsApprovals: [],
      error: null,
    };
    const html = renderHubActionWidget(); // eslint-disable-line no-undef
    expect(html).not.toContain('hub-widget-pending');
    expect(html).not.toContain('pending approval');
  });

  it('does not show pending approval stat when mcsApprovals is absent from data', () => {
    global.actionCentreData = {
      actions: [],
      pfmea: [],
      risks: [],
      error: null,
    };
    const html = renderHubActionWidget(); // eslint-disable-line no-undef
    expect(html).not.toContain('hub-widget-pending');
    expect(html).not.toContain('pending approval');
  });
});

describe('hubInit()', () => {
  it('calls actionCentreLoad when data is not loaded and not loading', () => {
    global.actionCentreLoading = false;
    global.actionCentreData = null;
    global.actionCentreLoad = jest.fn();
    hubInit(); // eslint-disable-line no-undef
    expect(global.actionCentreLoad).toHaveBeenCalledTimes(1);
  });

  it('does not call actionCentreLoad when already loading', () => {
    global.actionCentreLoading = true;
    global.actionCentreData = null;
    global.actionCentreLoad = jest.fn();
    hubInit(); // eslint-disable-line no-undef
    expect(global.actionCentreLoad).not.toHaveBeenCalled();
  });

  it('does not call actionCentreLoad when data is already available', () => {
    global.actionCentreLoading = false;
    global.actionCentreData = { actions: [], pfmea: [], risks: [], error: null };
    global.actionCentreLoad = jest.fn();
    hubInit(); // eslint-disable-line no-undef
    expect(global.actionCentreLoad).not.toHaveBeenCalled();
  });
});

describe('hub favourites storage', () => {
  beforeEach(() => {
    localStorage.clear();
    global.currentUser = { email: 'star.user@example.com' };
    global.render = jest.fn();
    global.currentSection = 'hub';
    global.setCapacityTab = undefined;
    global.setProductDevelopmentTab = undefined;
    global.setProductionTab = undefined;
    global.navigate = jest.fn();
  });

  it('toggles page favourites in localStorage', () => {
    hubTogglePageFavourite('capacity'); // eslint-disable-line no-undef
    let raw = JSON.parse(localStorage.getItem('tidyco_favourites_v1_star.user@example.com'));
    expect(raw.pages).toContain('capacity');

    hubTogglePageFavourite('capacity'); // eslint-disable-line no-undef
    raw = JSON.parse(localStorage.getItem('tidyco_favourites_v1_star.user@example.com'));
    expect(raw.pages).not.toContain('capacity');
  });

  it('toggles product favourites in localStorage', () => {
    hubToggleProductFavourite('prod_1'); // eslint-disable-line no-undef
    let raw = JSON.parse(localStorage.getItem('tidyco_favourites_v1_star.user@example.com'));
    expect(raw.products).toContain('prod_1');

    hubToggleProductFavourite('prod_1'); // eslint-disable-line no-undef
    raw = JSON.parse(localStorage.getItem('tidyco_favourites_v1_star.user@example.com'));
    expect(raw.products).not.toContain('prod_1');
  });

  it('caps stored page favourites to four items', () => {
    hubTogglePageFavourite('capacity'); // eslint-disable-line no-undef
    hubTogglePageFavourite('product-development'); // eslint-disable-line no-undef
    hubTogglePageFavourite('production'); // eslint-disable-line no-undef
    hubTogglePageFavourite('operations'); // eslint-disable-line no-undef
    hubTogglePageFavourite('mcs'); // eslint-disable-line no-undef

    const raw = JSON.parse(localStorage.getItem('tidyco_favourites_v1_star.user@example.com'));
    expect(raw.pages).toHaveLength(4);
    expect(raw.pages).not.toContain('mcs');
  });

  it('returns false for unknown product favourite', () => {
    expect(hubIsProductFavourite('missing')).toBe(false); // eslint-disable-line no-undef
  });

  it('opens sub-hub favourites by navigating section then setting tab', () => {
    global.setCapacityTab = jest.fn();
    hubOpenFavouritePage('capacity::me'); // eslint-disable-line no-undef
    expect(global.navigate).toHaveBeenCalledWith('capacity');
    expect(global.setCapacityTab).toHaveBeenCalledWith('me');
  });
});
