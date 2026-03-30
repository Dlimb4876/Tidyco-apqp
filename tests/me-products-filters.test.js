import { jest } from '@jest/globals'

const { renderKPIStrip, renderMonthPicker } = await import('../portals/capacity/shared/js/cap-components.js')

describe('Product filtering components', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="meProducts"></div>'
  })

  it('should export renderKPIStrip function', () => {
    expect(typeof renderKPIStrip).toBe('function')
  })

  it('should export renderMonthPicker function', () => {
    expect(typeof renderMonthPicker).toBe('function')
  })

  it('renderKPIStrip should return HTML string for product data', () => {
    const html = renderKPIStrip([])
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
  })

  it('renderMonthPicker should return HTML string', () => {
    const html = renderMonthPicker('2026-03')
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
  })
})
