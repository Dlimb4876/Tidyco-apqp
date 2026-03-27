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
global.canViewPageKey = jest.fn(() => true);
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
    global.canViewPageKey = jest.fn(() => true);
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

  it('hides cards the user cannot view', () => {
    global.canViewPageKey = jest.fn((pageKey) => pageKey !== 'capacity');

    const html = renderHub(); // eslint-disable-line no-undef

    expect(html).not.toContain('CAPACITY');
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

  it('hides inaccessible favourites from the favourites panel', () => {
    global.currentUser = { email: 'fav.user@example.com' };
    global.canViewPageKey = jest.fn((pageKey) => pageKey !== 'capacity');
    localStorage.setItem('tidyco_favourites_v1_fav.user@example.com', JSON.stringify({
      version: 1,
      pages: ['capacity', 'product-development'],
      products: []
    }));

    const html = renderHub(); // eslint-disable-line no-undef

    expect(html).not.toContain('📊 Capacity');
    expect(html).toContain('🚀 Product Development');
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
    global.canViewPageKey = jest.fn(() => true);
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

  it('does not clear product favourites when products data is not loaded', () => {
    // Setup: Add product favorites
    hubToggleProductFavourite('prod_123'); // eslint-disable-line no-undef
    hubToggleProductFavourite('prod_456'); // eslint-disable-line no-undef

    // Simulate products data not being loaded yet
    global.productsDataGetAll = jest.fn(() => []);
    global.productsState = { loaded: false, products: [] };

    // Call hubGetFavouriteProducts which would previously clear favorites
    const result = hubGetFavouriteProducts(); // eslint-disable-line no-undef

    // Verify favorites were NOT cleared from localStorage
    const raw = JSON.parse(localStorage.getItem('tidyco_favourites_v1_star.user@example.com'));
    expect(raw.products).toContain('prod_123');
    expect(raw.products).toContain('prod_456');
    expect(result).toHaveLength(0); // Returns empty array since data not loaded
  });

  it('clears stale product favourites only when products data is loaded', () => {
    // Setup: Add product favorites for a product that no longer exists
    hubToggleProductFavourite('deleted_product'); // eslint-disable-line no-undef

    // Simulate products data loaded but product doesn't exist
    global.productsDataGetAll = jest.fn(() => [{ id: 'existing_product', name: 'Test' }]);
    global.productsState = { loaded: true, products: [{ id: 'existing_product', name: 'Test' }] };

    // Call hubGetFavouriteProducts
    const result = hubGetFavouriteProducts(); // eslint-disable-line no-undef

    // Verify stale favorite was cleared from localStorage
    const raw = JSON.parse(localStorage.getItem('tidyco_favourites_v1_star.user@example.com'));
    expect(raw.products).not.toContain('deleted_product');
    expect(result).toHaveLength(0); // deleted_product not in products list
  });

  it('opens sub-hub favourites by navigating section then setting tab', () => {
    global.setCapacityTab = jest.fn();
    hubOpenFavouritePage('capacity::me'); // eslint-disable-line no-undef
    expect(global.navigate).toHaveBeenCalledWith('capacity');
    expect(global.setCapacityTab).toHaveBeenCalledWith('me');
  });

  it('does not open a favourite page that is no longer viewable', () => {
    global.setCapacityTab = jest.fn();
    global.canViewPageKey = jest.fn(() => false);

    hubOpenFavouritePage('capacity::me'); // eslint-disable-line no-undef

    expect(global.navigate).not.toHaveBeenCalled();
    expect(global.setCapacityTab).not.toHaveBeenCalled();
  });

  it('removes page favourite with hubRemovePageFavourite', () => {
    // Setup: Add a page favourite
    hubTogglePageFavourite('capacity'); // eslint-disable-line no-undef
    let raw = JSON.parse(localStorage.getItem('tidyco_favourites_v1_star.user@example.com'));
    expect(raw.pages).toContain('capacity');

    // Remove it
    hubRemovePageFavourite('capacity'); // eslint-disable-line no-undef
    raw = JSON.parse(localStorage.getItem('tidyco_favourites_v1_star.user@example.com'));
    expect(raw.pages).not.toContain('capacity');
    expect(global.render).toHaveBeenCalled();
  });

  it('removes product favourite with hubRemoveProductFavourite', () => {
    // Setup: Add a product favourite
    hubToggleProductFavourite('prod_123'); // eslint-disable-line no-undef
    let raw = JSON.parse(localStorage.getItem('tidyco_favourites_v1_star.user@example.com'));
    expect(raw.products).toContain('prod_123');

    // Remove it
    hubRemoveProductFavourite('prod_123'); // eslint-disable-line no-undef
    raw = JSON.parse(localStorage.getItem('tidyco_favourites_v1_star.user@example.com'));
    expect(raw.products).not.toContain('prod_123');
    expect(global.render).toHaveBeenCalled();
  });

  it('includes delete buttons in favourites panel for pages', () => {
    global.currentUser = { email: 'fav.user@example.com' };
    localStorage.setItem('tidyco_favourites_v1_fav.user@example.com', JSON.stringify({
      version: 1,
      pages: ['capacity'],
      products: []
    }));
    const html = renderHub(); // eslint-disable-line no-undef
    expect(html).toContain('hubRemovePageFavourite');
    expect(html).toContain('hub-fav-delete');
  });

  it('includes delete buttons in favourites panel for products', () => {
    global.currentUser = { email: 'fav.user@example.com' };
    global.productsDataGetAll = jest.fn(() => [{ id: 'prod_123', name: 'Test Product', status: 'Active' }]);
    global.productsState = { loaded: true };
    localStorage.setItem('tidyco_favourites_v1_fav.user@example.com', JSON.stringify({
      version: 1,
      pages: [],
      products: ['prod_123']
    }));
    const html = renderHub(); // eslint-disable-line no-undef
    expect(html).toContain('hubRemoveProductFavourite');
    expect(html).toContain('hub-fav-delete');
  });
});
