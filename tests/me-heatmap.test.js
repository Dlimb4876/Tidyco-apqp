import { jest } from '@jest/globals'

const { capRenderHeatmapTab, capDrawHeatmapNow, capOpenHeatmapDetail, capCloseHeatmapDetail } = await import('../portals/capacity/shared/js/cap-heatmap.js')

describe('Heatmap renderer', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="capHeatmapGrid"></div>'
  })

  it('should export capRenderHeatmapTab function', () => {
    expect(typeof capRenderHeatmapTab).toBe('function')
  })

  it('should export capDrawHeatmapNow function', () => {
    expect(typeof capDrawHeatmapNow).toBe('function')
  })

  it('should export capOpenHeatmapDetail function', () => {
    expect(typeof capOpenHeatmapDetail).toBe('function')
  })

  it('should export capCloseHeatmapDetail function', () => {
    expect(typeof capCloseHeatmapDetail).toBe('function')
  })

  it('capRenderHeatmapTab should return HTML string', () => {
    const html = capRenderHeatmapTab('2026-03', [], [], [], [], 'ME')
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
  })
})
