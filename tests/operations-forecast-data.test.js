import { jest } from '@jest/globals'

const { opsForecastBuildWeightedMatrix } = await import('../portals/operations/js/operations-forecast-data.js')

describe('opsForecastBuildWeightedMatrix', () => {
  it('should return a matrix object', () => {
    const monthKeys = ['2026-01']
    const rows = [{
      id: 'o1',
      title: 'Tender A',
      status: 'identified',
      work_area: 'Unit 2',
      start_date: '2026-01-01',
      due_date: '2026-01-31',
      total_hours: 100,
      probability_pct: 50
    }]
    const matrix = opsForecastBuildWeightedMatrix(monthKeys, rows)
    expect(typeof matrix).toBe('object')
    expect(matrix).not.toBeNull()
  })

  it('should include month keys in matrix', () => {
    const monthKeys = ['2026-01', '2026-02']
    const rows = [{
      id: 'o1',
      title: 'Opportunity',
      work_area: 'Unit 1',
      start_date: '2026-01-01',
      due_date: '2026-02-28',
      total_hours: 100,
      probability_pct: 100
    }]
    const matrix = opsForecastBuildWeightedMatrix(monthKeys, rows)
    monthKeys.forEach(month => {
      expect(month in matrix).toBe(true)
    })
  })

  it('should handle empty rows', () => {
    const monthKeys = ['2026-01']
    const matrix = opsForecastBuildWeightedMatrix(monthKeys, [])
    expect(typeof matrix).toBe('object')
  })
})
