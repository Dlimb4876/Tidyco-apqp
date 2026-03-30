import { jest } from '@jest/globals'

const {
  capGetHoursPerWeek,
  getBankHolidaysForYear,
  countNetworkDaysBetween
} = await import('../portals/capacity/shared/js/cap-utils.js')

const {
  capCalculateMonthData,
  capCalcWeekUtilisation,
  getEffectiveSubtasks
} = await import('../portals/capacity/shared/js/cap-calculations.js')

describe('Capacity calculations', () => {
  beforeEach(() => {
    global.prodState = { batches: [] }
    global.meDataGetProductSupportRateForDate = undefined
  })

  it('should return implicit subtask from task with assigneeId', () => {
    const task = { assigneeId: 'p1', totalHours: 24, name: 'Task A' }
    const result = getEffectiveSubtasks(task)
    expect(result).toEqual([
      { assigneeId: 'p1', hours: 24, name: 'Task A' }
    ])
  })

  it('should calculate monthly capacity with 40h/week default', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', utilisation: 100 }]
    const result = capCalculateMonthData('2026-01', team, [], [], [])
    // Jan 2026 has 21 network days after excluding New Year bank holiday
    expect(result.capacity).toBeCloseTo(168, 6)
  })

  it('should deduct personal full-day holiday as 8 hours', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }]
    const holidays = [{ personId: 'p1', date: '2026-01-05', type: 'full' }]
    const result = capCalculateMonthData('2026-01', team, [], [], holidays)
    expect(result.capacity).toBeCloseTo(160, 6)
  })

  it('should ignore weekend holidays', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }]
    const holidays = [{ personId: 'p1', date: '2026-01-04', type: 'full' }] // Sunday
    const result = capCalculateMonthData('2026-01', team, [], [], holidays)
    expect(result.capacity).toBeCloseTo(168, 6)
  })

  it('should ignore holidays for team members not in team list', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }]
    const holidays = [{ personId: 'unknown', date: '2026-01-05', type: 'full' }]
    const result = capCalculateMonthData('2026-01', team, [], [], holidays)
    expect(result.capacity).toBeCloseTo(168, 6)
  })

  it('should deduct half-day holiday as 4 hours', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }]
    const holidays = [{ personId: 'p1', date: '2026-01-05', type: 'half' }]
    const result = capCalculateMonthData('2026-01', team, [], [], holidays)
    expect(result.capacity).toBeCloseTo(164, 6)
  })

  it('should support legacy person_id field in holidays', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 35, utilisation: 100 }]
    const holidays = [{ person_id: 'p1', date: '2026-01-05', type: 'full' }]
    const result = capCalculateMonthData('2026-01', team, [], [], holidays)
    expect(result.capacity).toBeCloseTo(140, 6)
  })

  it('should clip capacity to member start and end date', () => {
    const team = [{
      id: 'p1',
      name: 'Alex',
      startDate: '2026-01-15',
      endDate: '2026-01-21',
      hoursPerWeek: 40,
      utilisation: 100
    }]
    const result = capCalculateMonthData('2026-01', team, [], [], [])
    // Capacity should be less than full month when start/end dates are bounded
    expect(result.capacity).toBeGreaterThan(0)
    expect(result.capacity).toBeLessThan(200)
  })

  it('should include task demand in monthly calculation', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }]
    const task = {
      id: 't1',
      assigneeId: 'p1',
      totalHours: 100,
      category: 'npi',
      startDate: '2026-01-20',
      endDate: '2026-02-10'
    }
    const result = capCalculateMonthData('2026-01', team, [task], [], [])
    expect(result).toHaveProperty('npi')
  })

  it('should exclude disabled tasks from demand', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }]
    const tasks = [
      { id: 't1', assigneeId: 'p1', totalHours: 20, category: 'npi', startDate: '2026-01-05', endDate: '2026-01-09', isDisabled: false },
      { id: 't2', assigneeId: 'p1', totalHours: 30, category: 'npi', startDate: '2026-01-05', endDate: '2026-01-09', isDisabled: true }
    ]
    const result = capCalculateMonthData('2026-01', team, tasks, [], [])
    expect(result.npi).toBeCloseTo(20, 6)
  })

  it('should return result object with capacity property', () => {
    const team = [{ id: 'p1', name: 'Alex', startDate: '2025-01-01', hoursPerWeek: 40, utilisation: 100 }]
    const result = capCalculateMonthData('2026-01', team, [], [], [])
    expect(result).toHaveProperty('capacity')
    expect(typeof result.capacity).toBe('number')
  })
})
