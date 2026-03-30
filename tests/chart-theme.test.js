import { jest } from '@jest/globals'

const { ChartTheme } = await import('../core/js/chart-theme.js')

describe('ChartTheme', () => {
  beforeEach(() => {
    // Set up CSS variables in the DOM
    document.documentElement.innerHTML = ''
    const style = document.createElement('style')
    style.textContent = `
      :root {
        --chart-blue: #1f77b4;
        --chart-blue-lt: rgba(31,119,180,0.2);
        --chart-green: #2ca02c;
        --chart-green-lt: rgba(44,160,44,0.2);
        --chart-amber: #ffbf00;
        --chart-amber-lt: rgba(255,191,0,0.2);
        --chart-pink: #e377c2;
        --chart-pink-lt: rgba(227,119,194,0.2);
        --chart-purple: #9467bd;
        --chart-red: #d62728;
        --line: #d8dee5;
        --ink: #102030;
        --muted: #5f6f7f;
        --white: #ffffff;
      }
    `
    document.head.appendChild(style)
  })

  it('should resolve CSS variables via get()', () => {
    expect(ChartTheme.get('--chart-blue')).toBe('#1f77b4')
    expect(ChartTheme.get('--chart-green')).toBe('#2ca02c')
    expect(ChartTheme.get('--white')).toBe('#ffffff')
  })

  it('should return color object via getColors()', () => {
    const colors = ChartTheme.getColors()
    expect(colors.blue).toBe('#1f77b4')
    expect(colors.green).toBe('#2ca02c')
    expect(colors.amber).toBe('#ffbf00')
    expect(colors.pink).toBe('#e377c2')
    expect(colors.purple).toBe('#9467bd')
    expect(colors.red).toBe('#d62728')
    expect(colors.white).toBe('#ffffff')
  })

  it('should cycle palette colors when count exceeds available colors', () => {
    const palette = ChartTheme.getPalette(8)
    expect(palette).toHaveLength(8)
    // First few should be distinct colors
    expect(palette[0]).toBe('#1f77b4') // blue
    // Should cycle back to blue
    expect(palette[6]).toBe('#1f77b4')
  })

  it('should return scale defaults with theme colors', () => {
    const scales = ChartTheme.getScaleDefaults()
    expect(scales.x.grid.color).toBe('#d8dee5') // --line
    expect(scales.y.ticks.color).toBe('#5f6f7f') // --muted
  })

  it('should return plugin defaults with theme colors', () => {
    const plugins = ChartTheme.getPluginDefaults()
    expect(plugins.legend.labels.color).toBe('#102030') // --ink
    expect(plugins.tooltip.borderColor).toBe('#d8dee5') // --line
  })

  it('should merge overrides into getDefaultOptions()', () => {
    const options = ChartTheme.getDefaultOptions({
      responsive: false,
      plugins: { legend: { display: false } }
    })
    expect(options.responsive).toBe(false)
    expect(options.maintainAspectRatio).toBe(false)
    expect(options.plugins.legend.display).toBe(false)
  })

  it('should handle missing CSS variables gracefully', () => {
    document.documentElement.style.removeProperty('--chart-blue')
    expect(() => ChartTheme.getColors()).not.toThrow()
  })
})
