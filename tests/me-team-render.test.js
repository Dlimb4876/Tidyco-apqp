/**
 * me-team-render.test.js — Tests for portals/capacity/shared/js/cap-team.js
 *
 * Covers: capRenderTeamTab HTML structure, capacity calculations,
 *         KPI values, empty state, and department-specific labels
 */

import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ─────────────────────────────────────────────────────────────
// Mock Dependencies
// ─────────────────────────────────────────────────────────────

global.esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
global.getMonthLabel = jest.fn(() => 'Jun 2025')

// Import modules (ESM exports)
await import(resolve(__dirname, '../portals/capacity/shared/js/cap-utils.js'))
const { capRenderTeamTab } = await import(
  resolve(__dirname, '../portals/capacity/shared/js/cap-team.js')
)

// ─────────────────────────────────────────────────────────────
// Sample data
// ─────────────────────────────────────────────────────────────

const SAMPLE_TEAM = [
  { id: 'm1', name: 'Alice', jobTitle: 'ME Engineer', group: 'NPI',        hoursPerWeek: 37.5, utilisation: 80, startDate: '2024-01-01', endDate: '' },
  { id: 'm2', name: 'Bob',   jobTitle: 'ME Technician', group: 'Production', hoursPerWeek: 37.5, utilisation: 100, startDate: '2024-06-01', endDate: '' },
]

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  global.getMonthLabel = jest.fn(() => 'Jun 2025')
})

describe('capRenderTeamTab()', () => {
  it('returns a non-empty HTML string', () => {
    const html = capRenderTeamTab(SAMPLE_TEAM, [], '2025-06', 'ME', true)
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
  })

  it('renders a row for each team member', () => {
    const html = capRenderTeamTab(SAMPLE_TEAM, [], '2025-06', 'ME', true)
    expect(html).toContain('Alice')
    expect(html).toContain('Bob')
  })

  it('shows ENGINEERING TEAM label for ME context', () => {
    const html = capRenderTeamTab(SAMPLE_TEAM, [], '2025-06', 'ME', true)
    expect(html).toContain('ENGINEERING TEAM')
  })

  it('shows PM TEAM label for PM context', () => {
    const html = capRenderTeamTab(SAMPLE_TEAM, [], '2025-06', 'PM', true)
    expect(html).toContain('PM TEAM')
  })

  it('shows LOGISTICS TECHNICIANS label for Logistics context', () => {
    const html = capRenderTeamTab(SAMPLE_TEAM, [], '2025-06', 'LOG', true)
    expect(html).toContain('LOGISTICS TECHNICIANS')
  })

  it('shows TECHNICIAN TEAM label for Unit 6 context', () => {
    const html = capRenderTeamTab(SAMPLE_TEAM, [], '2025-06', 'UNIT6', true)
    expect(html).toContain('TECHNICIAN TEAM')
  })

  it('shows member count', () => {
    const html = capRenderTeamTab(SAMPLE_TEAM, [], '2025-06', 'ME', true)
    expect(html).toContain('2 engineers')
  })

  it('shows managers count for PM context', () => {
    const html = capRenderTeamTab(SAMPLE_TEAM, [], '2025-06', 'PM', true)
    expect(html).toContain('2 managers')
  })

  it('shows logistics technicians count for Logistics context', () => {
    const html = capRenderTeamTab(SAMPLE_TEAM, [], '2025-06', 'LOG', true)
    expect(html).toContain('2 logistics technicians')
  })

  it('shows technicians count for Unit 6 context', () => {
    const html = capRenderTeamTab(SAMPLE_TEAM, [], '2025-06', 'UNIT6', true)
    expect(html).toContain('2 technicians')
  })

  it('includes Add Engineer button', () => {
    const html = capRenderTeamTab(SAMPLE_TEAM, [], '2025-06', 'ME', true)
    expect(html).toContain('cap-team-add')
  })

  it('renders KPI strip with Total Availability', () => {
    const html = capRenderTeamTab(SAMPLE_TEAM, [], '2025-06', 'ME', true)
    expect(html).toContain('Total Availability')
  })

  it('renders NPI Group and Production Group KPIs', () => {
    const html = capRenderTeamTab(SAMPLE_TEAM, [], '2025-06', 'ME', true)
    expect(html).toContain('NPI Group')
    expect(html).toContain('Production Group')
  })

  it('renders Holidays This Month KPI', () => {
    const html = capRenderTeamTab(SAMPLE_TEAM, [{ personId: 'm1', date: '2025-06-10', type: 'full' }], '2025-06', 'ME', true)
    expect(html).toContain('Holidays This Month')
  })

  it('shows empty state message with no team members', () => {
    const html = capRenderTeamTab([], [], '2025-06', 'ME', true)
    expect(html).toContain('No engineers added yet')
  })

  it('shows empty state Add First Engineer button', () => {
    const html = capRenderTeamTab([], [], '2025-06', 'ME', true)
    expect(html).toContain('Add First Engineer')
  })

  it('shows Logistics Technician empty state labels for Logistics context', () => {
    const html = capRenderTeamTab([], [], '2025-06', 'LOG', true)
    expect(html).toContain('No logistics technicians added yet')
    expect(html).toContain('Add First Logistics Technician')
    expect(html).toContain('＋ Add Logistics Technician')
  })

  it('shows Technician empty state labels for Unit 6 context', () => {
    const html = capRenderTeamTab([], [], '2025-06', 'UNIT6', true)
    expect(html).toContain('No technicians added yet')
    expect(html).toContain('Add First Technician')
    expect(html).toContain('＋ Add Technician')
  })

  it('includes job title in rendered rows', () => {
    const html = capRenderTeamTab(SAMPLE_TEAM, [], '2025-06', 'ME', true)
    expect(html).toContain('ME Engineer')
    expect(html).toContain('ME Technician')
  })

  it('includes group selector with NPI and Production options', () => {
    const html = capRenderTeamTab(SAMPLE_TEAM, [], '2025-06', 'ME', true)
    expect(html).toContain('NPI')
    expect(html).toContain('Production')
  })

  it('counts unique holidays from the supplied month data', () => {
    const html = capRenderTeamTab([
      SAMPLE_TEAM[0]
    ], [
      { personId: 'm1', date: '2025-06-10', type: 'full' },
      { personId: 'm1', date: '2025-06-10', type: 'half' }
    ], '2025-06', 'ME', true)
    expect(html).toContain('>1<')
  })
})
