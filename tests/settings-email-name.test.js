import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────
// Minimal mocks for settings.js globals
// ─────────────────────────────────────────────────────────────
global.settingsActiveTab = 'families';
global.familiesState = { loading: false, families: [] };
global.workAreasState = { loading: false, workAreas: [] };
global.currentUser = null;
global.db = { projects: [] };
global.supa = { from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }) };
global.esc = v => String(v ?? '');
global.navigate = () => {};
global.render = () => '';
global.familiesDataLoad = async () => {};
global.familiesDataInit = async () => {};
global.familiesDataGetAll = () => [];
global.workAreasDataInit = async () => {};
global.requestAnimationFrame = cb => cb();

// Load settings.js using eval
const script = fs.readFileSync(
  path.resolve(__dirname, '../portals/settings/js/settings.js'),
  'utf8'
);
eval(script);

// ─────────────────────────────────────────────────────────────
// Tests for settingsEmailToName()
// ─────────────────────────────────────────────────────────────
describe('settingsEmailToName', () => {
  test('converts dot-separated prefix to title-case name', () => {
    expect(settingsEmailToName('daniel.limb@tidyco.co.uk')).toBe('Daniel Limb');
  });

  test('converts underscore-separated prefix to title-case name', () => {
    expect(settingsEmailToName('john_smith@example.com')).toBe('John Smith');
  });

  test('converts hyphen-separated prefix to title-case name', () => {
    expect(settingsEmailToName('mary-jane@example.com')).toBe('Mary Jane');
  });

  test('handles single-word email prefix (no separator)', () => {
    expect(settingsEmailToName('alice@example.com')).toBe('Alice');
  });

  test('title-cases regardless of original casing', () => {
    expect(settingsEmailToName('DAVID.JONES@example.com')).toBe('David Jones');
  });

  test('returns em dash for empty string', () => {
    expect(settingsEmailToName('')).toBe('—');
  });

  test('returns em dash for null', () => {
    expect(settingsEmailToName(null)).toBe('—');
  });

  test('returns em dash for undefined', () => {
    expect(settingsEmailToName(undefined)).toBe('—');
  });
});
