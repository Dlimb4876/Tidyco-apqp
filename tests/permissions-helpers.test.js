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
    eval(`${src}\n;globalThis.__permHelpers = { canEdit, canViewSection, hasPermission };`); // eslint-disable-line no-eval
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
});
