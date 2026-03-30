import { jest } from '@jest/globals'

const { getBankHolidaysForYear } = await import('../portals/capacity/shared/js/cap-utils.js')

describe('getBankHolidaysForYear', () => {
  it('should return holidays with date property', () => {
    const holidays = getBankHolidaysForYear(2026)
    expect(Array.isArray(holidays)).toBe(true)
    expect(holidays.length).toBeGreaterThan(0)
    expect(holidays[0]).toHaveProperty('date')
  })

  it('should not include June 1st 2026 as bank holiday', () => {
    const holidays2026 = getBankHolidaysForYear(2026)
    const dates = holidays2026.map(h => h.date)
    expect(dates).not.toContain('2026-06-01')
  })

  it('should include May 25 2026', () => {
    const holidays2026 = getBankHolidaysForYear(2026)
    const dates = holidays2026.map(h => h.date)
    expect(dates).toContain('2026-05-25')
  })

  it('should use New Year substitute date when Jan 1st is on weekend (2022)', () => {
    const holidays2022 = getBankHolidaysForYear(2022)
    const dates = holidays2022.map(h => h.date)
    // Jan 1 2022 was Saturday, so Jan 3 is the substitute
    expect(dates).toContain('2022-01-03')
    expect(dates).not.toContain('2022-01-01')
  })

  it('should handle Christmas and Boxing Day substitutions when Christmas is Saturday (2021)', () => {
    const holidays2021 = getBankHolidaysForYear(2021)
    const dates = holidays2021.map(h => h.date)
    // Dec 25 2021 was Saturday
    // Dec 26 2021 was Sunday
    // Substitutes are Dec 27 (Monday) and Dec 28 (Tuesday)
    expect(dates).toContain('2021-12-27')
    expect(dates).toContain('2021-12-28')
    expect(dates).not.toContain('2021-12-25')
    expect(dates).not.toContain('2021-12-26')
  })

  it('should handle Christmas and Boxing Day correctly when weekday (2023)', () => {
    const holidays2023 = getBankHolidaysForYear(2023)
    const dates = holidays2023.map(h => h.date)
    // Dec 25 2023 was Monday, Dec 26 was Tuesday
    expect(dates).toContain('2023-12-25')
    expect(dates).toContain('2023-12-26')
  })
})
