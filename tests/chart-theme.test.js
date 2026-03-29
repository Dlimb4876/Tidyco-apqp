import { ChartTheme } from '../core/js/chart-theme.js';

describe('ChartTheme utility', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = '';
    const style = document.createElement('style');
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
    `;
    document.head.appendChild(style);
    // Make ChartTheme available on window for tests that expect it
    window.ChartTheme = ChartTheme;
  });

  it('returns resolved css variables via get()', () => {
    expect(window.ChartTheme.get('--chart-blue')).toBe('#1f77b4');
  });

  it('returns a full color object via getColors()', () => {
    const colors = window.ChartTheme.getColors();
    expect(colors.blue).toBe('#1f77b4');
    expect(colors.green).toBe('#2ca02c');
    expect(colors.white).toBe('#ffffff');
  });

  it('cycles palette entries when count exceeds base colors', () => {
    const palette = window.ChartTheme.getPalette(8);
    expect(palette).toHaveLength(8);
    expect(palette[0]).toBe('#1f77b4');
    expect(palette[6]).toBe('#1f77b4');
  });

  it('returns plugin and scale defaults with theme colors', () => {
    const scales = window.ChartTheme.getScaleDefaults();
    const plugins = window.ChartTheme.getPluginDefaults();

    expect(scales.x.grid.color).toBe('#d8dee5');
    expect(scales.y.ticks.color).toBe('#5f6f7f');
    expect(plugins.legend.labels.color).toBe('#102030');
    expect(plugins.tooltip.borderColor).toBe('#d8dee5');
  });

  it('merges overrides into getDefaultOptions()', () => {
    const options = window.ChartTheme.getDefaultOptions({
      responsive: false,
      plugins: { legend: { display: false } },
    });

    expect(options.responsive).toBe(false);
    expect(options.maintainAspectRatio).toBe(false);
    expect(options.plugins.legend.display).toBe(false);
  });

  it('handles missing css vars without throwing', () => {
    document.documentElement.style.removeProperty('--chart-blue');
    expect(() => window.ChartTheme.getColors()).not.toThrow();
  });
});
