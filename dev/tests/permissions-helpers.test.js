const fs = require('fs');
const path = require('path');

describe('hybrid permission helpers', () => {
  beforeAll(() => {
    global.currentUserRole = null;
    global.currentUserPermissions = {};

    const src = fs.readFileSync(
      path.resolve(__dirname, '../utils/js/helpers.js'),
      'utf8'
    );
    eval(`${src}\n;globalThis.__permHelpers = { canEdit, canViewSection, canViewPortalTab, canViewPageKey, hasPermission };`); // eslint-disable-line no-eval
  });

  beforeEach(() => {
    global.currentUserRole = 'viewer';
    global.currentUserPermissions = {};
  });

  it('keeps legacy canEdit() behavior for editor role with no scope', () => {
    global.currentUserRole = 'editor';

    expect(globalThis.__permHelpers.canEdit()).toBe(true);
  });

  it('blocks settings portal for baseline viewer role', () => {
    expect(globalThis.__permHelpers.canViewSection('settings')).toBe(false);
  });

  it('allows additive team grants to extend viewer access', () => {
    global.currentUserPermissions = {
      portal_settings_view: true,
      feature_access_settings: true
    };

    expect(globalThis.__permHelpers.canViewSection('settings')).toBe(true);
    expect(globalThis.__permHelpers.canEdit('settings')).toBe(true);
  });

  it('normalizes legacy team permission keys', () => {
    global.currentUserPermissions = {
      manage_capacity: true
    };

    expect(globalThis.__permHelpers.hasPermission('feature_manage_capacity')).toBe(true);
  });

  it('allows sub-portal visibility to be controlled separately from the parent portal', () => {
    global.currentUserPermissions = {
      portal_capacity_view: true,
      portal_capacity_me_view: false,
      portal_capacity_projects_view: true
    };

    expect(globalThis.__permHelpers.canViewPortalTab('capacity', 'me')).toBe(false);
    expect(globalThis.__permHelpers.canViewPortalTab('capacity', 'projects')).toBe(true);
    expect(globalThis.__permHelpers.canViewPageKey('capacity::me')).toBe(false);
  });

  it('blocks sub-portal pages when the parent portal is denied', () => {
    global.currentUserPermissions = {
      portal_product_development_view: false,
      portal_product_development_product_management_view: true
    };

    expect(globalThis.__permHelpers.canViewPortalTab('product-development', 'product-management')).toBe(false);
    expect(globalThis.__permHelpers.canViewPageKey('product-development::product-management')).toBe(false);
  });

  it('keeps legacy parent-only capacity access when child tab policy is not configured', () => {
    global.currentUserPermissions = {
      portal_capacity_view: true,
      portal_capacity_me_view: false,
      portal_capacity_projects_view: false,
      portal_capacity_logistics_view: false,
      portal_capacity_unit6_view: false,
      portal_capacity_production_view: false
    };

    expect(globalThis.__permHelpers.canViewPortalTab('capacity', 'me')).toBe(true);
    expect(globalThis.__permHelpers.canViewPageKey('capacity::me')).toBe(true);
  });
});
