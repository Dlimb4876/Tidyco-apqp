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

// Load hub.js
const src = fs.readFileSync(
  path.resolve(__dirname, '../portals/hub/js/hub.js'),
  'utf8'
);
eval(src); // eslint-disable-line no-eval

describe('renderHub()', () => {
  let html;

  beforeAll(() => {
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
});
