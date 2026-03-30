import { jest } from '@jest/globals'

const { opsInfographicBar, opsInfographicTone, opsInfographicUnitCards } = await import('../portals/operations/js/operations-infographic.js')

describe('Operations infographic helpers', () => {
  it('opsInfographicBar should return HTML string', () => {
    const html = opsInfographicBar(50, 'good')
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
  })

  it('opsInfographicBar should clamp width to 100%', () => {
    const html = opsInfographicBar(150, 'good')
    expect(html).toContain('100%')
  })

  it('opsInfographicTone should return tone string', () => {
    const tone = opsInfographicTone(95, true)
    expect(typeof tone).toBe('string')
    expect(['critical', 'watch', 'good']).toContain(tone)
  })

  it('opsInfographicTone should evaluate utilisation threshold', () => {
    const critical = opsInfographicTone(95, true)
    const good = opsInfographicTone(50, true)
    expect(critical).not.toBe(good)
  })

  it('opsInfographicUnitCards should return HTML string', () => {
    const units = [
      { workArea: 'Unit 1', utilisation: 75, ready: true, demand: 100, capacity: 120, headroom: 20 }
    ]
    const html = opsInfographicUnitCards(units)
    expect(typeof html).toBe('string')
    expect(html).toContain('Unit 1')
  })

  it('opsInfographicUnitCards should return empty string for null or empty array', () => {
    expect(opsInfographicUnitCards(null)).toBe('')
    expect(opsInfographicUnitCards([])).toBe('')
  })
})
