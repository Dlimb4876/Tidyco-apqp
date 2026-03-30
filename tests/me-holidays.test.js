import { jest } from '@jest/globals'

const { capFormatDate } = await import('../portals/capacity/shared/js/cap-holidays.js')

describe('Holiday utilities', () => {
  it('should export capFormatDate function', () => {
    expect(typeof capFormatDate).toBe('function')
  })

  it('capFormatDate should format valid date', () => {
    const date = new Date('2026-03-15')
    const formatted = capFormatDate(date)
    expect(typeof formatted).toBe('string')
    expect(formatted.length).toBeGreaterThan(0)
    expect(formatted).toMatch(/\d{4}-\d{2}-\d{2}/)
  })

  it('capFormatDate should handle null/invalid dates', () => {
    const result = capFormatDate(null)
    expect(typeof result).toBe('string')
  })

  it('capFormatDate should handle non-Date objects', () => {
    const result = capFormatDate('not a date')
    expect(typeof result).toBe('string')
  })
})
