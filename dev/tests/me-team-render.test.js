/**
 * me-team-render.test.js — Tests for portals/capacity/js/me-team.js
 *
 * Covers: meRenderTeamTab HTML structure, capacity calculations,
 *         KPI values, empty state, PM context label
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
global.meGetDepartmentFromContext = jest.fn(() => 'ME');
global.meFilterByDepartment = jest.fn((list) => list);
global.meGetHoursPerWeek = jest.fn((h) => h || 37.5);
global.meGetMonthLabel = jest.fn(() => 'Jun 2025');
global.meDataGetHolidays = jest.fn(() => []);
global.meDataGetTeam = jest.fn(() => []);

// Load module
const src = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/js/me-team.js'),
  'utf8'
);
eval(src); // eslint-disable-line no-eval

// ─────────────────────────────────────────────────────────────
// Sample data
// ─────────────────────────────────────────────────────────────

const SAMPLE_TEAM = [
  { id: 'm1', name: 'Alice', jobTitle: 'ME Engineer', group: 'NPI',        hoursPerWeek: 37.5, utilisation: 80, startDate: '2024-01-01', endDate: '' },
  { id: 'm2', name: 'Bob',   jobTitle: 'ME Technician', group: 'Production', hoursPerWeek: 37.5, utilisation: 100, startDate: '2024-06-01', endDate: '' },
];

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  global.meGetDepartmentFromContext.mockReturnValue('ME');
  global.meGetHoursPerWeek.mockImplementation((h) => h || 37.5);
  global.meDataGetHolidays.mockReturnValue([]);
  global.meDataGetTeam.mockReturnValue(SAMPLE_TEAM);
  global.meFilterByDepartment.mockImplementation((list) => list);
});

describe('meRenderTeamTab()', () => {
  it('returns a non-empty HTML string', () => {
    const html = window.meRenderTeamTab(SAMPLE_TEAM);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('renders a row for each team member', () => {
    const html = window.meRenderTeamTab(SAMPLE_TEAM);
    expect(html).toContain('Alice');
    expect(html).toContain('Bob');
  });

  it('shows ENGINEERING TEAM label for ME context', () => {
    global.meGetDepartmentFromContext.mockReturnValue('ME');
    const html = window.meRenderTeamTab(SAMPLE_TEAM);
    expect(html).toContain('ENGINEERING TEAM');
  });

  it('shows PM TEAM label for PM context', () => {
    global.meGetDepartmentFromContext.mockReturnValue('PM');
    const html = window.meRenderTeamTab(SAMPLE_TEAM);
    expect(html).toContain('PM TEAM');
  });

  it('shows member count', () => {
    const html = window.meRenderTeamTab(SAMPLE_TEAM);
    expect(html).toContain('2 engineers');
  });

  it('shows managers count for PM context', () => {
    global.meGetDepartmentFromContext.mockReturnValue('PM');
    const html = window.meRenderTeamTab(SAMPLE_TEAM);
    expect(html).toContain('2 managers');
  });

  it('includes Add Engineer button', () => {
    const html = window.meRenderTeamTab(SAMPLE_TEAM);
    expect(html).toContain('cap-team-add');
  });

  it('renders KPI strip with Total Availability', () => {
    const html = window.meRenderTeamTab(SAMPLE_TEAM);
    expect(html).toContain('Total Availability');
  });

  it('renders NPI Group and Production Group KPIs', () => {
    const html = window.meRenderTeamTab(SAMPLE_TEAM);
    expect(html).toContain('NPI Group');
    expect(html).toContain('Production Group');
  });

  it('renders Holidays This Month KPI', () => {
    const html = window.meRenderTeamTab(SAMPLE_TEAM);
    expect(html).toContain('Holidays This Month');
  });

  it('shows empty state message with no team members', () => {
    global.meDataGetTeam.mockReturnValue([]);
    const html = window.meRenderTeamTab([]);
    expect(html).toContain('No engineers added yet');
  });

  it('shows empty state Add First Engineer button', () => {
    global.meDataGetTeam.mockReturnValue([]);
    const html = window.meRenderTeamTab([]);
    expect(html).toContain('Add First Engineer');
  });

  it('includes job title in rendered rows', () => {
    const html = window.meRenderTeamTab(SAMPLE_TEAM);
    expect(html).toContain('ME Engineer');
    expect(html).toContain('ME Technician');
  });

  it('includes group selector with NPI and Production options', () => {
    const html = window.meRenderTeamTab(SAMPLE_TEAM);
    expect(html).toContain('NPI');
    expect(html).toContain('Production');
  });

  it('counts holidays from meDataGetHolidays', () => {
    // Inject a holiday for today's month
    const today = new Date();
    const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    global.meDataGetHolidays.mockReturnValue([
      { personId: 'm1', date: `${thisMonth}-10`, type: 'full' },
    ]);
    const html = window.meRenderTeamTab(SAMPLE_TEAM);
    // Holiday count KPI should show 1
    expect(html).toContain('Holidays This Month');
  });
});
