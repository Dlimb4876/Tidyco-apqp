import { jest } from '@jest/globals'

// Mock dependencies
jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: { currentSection: 'operations' }
}))

jest.unstable_mockModule('../utils/js/helpers.js', () => ({
  canEdit: () => true,
  esc: (v) => v || ''
}))

// Fixed relative paths for mocks
jest.unstable_mockModule('../portals/capacity/production/js/work-areas-data.js', () => ({
  getWorkAreaOptions: () => ''
}))

jest.unstable_mockModule('../portals/capacity/production/js/prod-capacity-data.js', () => ({
  prodCapGet24MonthKeys: () => [],
  prodCapMonthLabelFull: () => ''
}))

jest.unstable_mockModule('../portals/operations/js/operations-dashboard-state.js', () => ({
  operationsDashboardState: {
    opsForecastFilterText: '',
    opsForecastFilterStatus: '',
    opsForecastShowArchived: false,
    opsForecastSortCol: '',
    opsForecastSortDir: 'asc',
    opsForecastInlineEditId: ''
  },
  opsForecastDomKey: (id) => String(id || '').replace(/[^a-z0-9]/gi, '_'),
  opsForecastInlineFieldId: (id, field) => `inline_${id}_${field}`
}))

// Mock metrics
jest.unstable_mockModule('../portals/operations/js/operations-dashboard-metrics.js', () => ({
  opsToNumber: (v) => Number(v) || 0,
  opsFormatHours: (v) => `${v}h`
}))

// Mock render core
jest.unstable_mockModule('../portals/operations/js/operations-dashboard-render-core.js', () => ({
  opsMetricCard: () => ''
}))

// Import the function to test
const { opsRenderForecastRows } = await import('../portals/operations/js/operations-dashboard-forecast-view.js')

describe('Operations Forecast View', () => {
  it('should render notes in the forecast table', () => {
    const rows = [
      {
        id: 'opt-1',
        title: 'Test Opportunity',
        status: 'identified',
        notes: 'This is a test note'
      }
    ]

    const html = opsRenderForecastRows(rows)
    
    // Check for the expanded notes row content
    expect(html).toContain('ops-forecast-row-notes')
    expect(html).toContain('Notes:</strong> This is a test note')
  })

  it('should show placeholder for empty notes', () => {
    const rows = [
      {
        id: 'opt-2',
        title: 'Empty Note Opportunity',
        status: 'won',
        notes: ''
      }
    ]

    const html = opsRenderForecastRows(rows)
    
    // Check that notes summary icon/column is NOT present
    expect(html).not.toContain('📝')
    
    // Check that expanded row doesn't show "Notes:" text
    expect(html).not.toContain('Notes:</strong>')
  })
})
