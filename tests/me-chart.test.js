import { jest } from '@jest/globals'

const { capGetChartRefreshText, capRenderChartTab } = await import('../portals/capacity/shared/js/cap-chart.js')

describe('Chart rendering', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="meChart"></div>'
  })

  it('should export capGetChartRefreshText function', () => {
    expect(typeof capGetChartRefreshText).toBe('function')
  })

  it('should export capRenderChartTab function', () => {
    expect(typeof capRenderChartTab).toBe('function')
  })

  it('capGetChartRefreshText should return string', () => {
    const text = capGetChartRefreshText()
    expect(typeof text).toBe('string')
    expect(text.length).toBeGreaterThan(0)
  })

  it('capRenderChartTab should return HTML string', () => {
    const html = capRenderChartTab('2026-03', [], [], [], [], 'ME')
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
  })
})
