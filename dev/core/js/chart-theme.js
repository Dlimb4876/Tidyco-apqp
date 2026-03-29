/* ============================================================
   chart-theme.js — Centralised Chart.js theming
   Reads CSS custom properties so charts respect light/dark mode.
   ============================================================ */

import { Chart as ChartJs } from 'chart.js';

export const ChartTheme = {
  /** Return a resolved CSS variable value from :root */
  get(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  },

  /** Shorthand: get multiple variables at once → { blue, green, … } */
  getColors() {
    const g = (v) => this.get(v);
    return {
      blue:       g('--chart-blue'),
      blueLt:     g('--chart-blue-lt'),
      green:      g('--chart-green'),
      greenLt:    g('--chart-green-lt'),
      amber:      g('--chart-amber'),
      amberLt:    g('--chart-amber-lt'),
      pink:       g('--chart-pink'),
      pinkLt:     g('--chart-pink-lt'),
      purple:     g('--chart-purple'),
      red:        g('--chart-red'),
      line:       g('--line'),
      ink:        g('--ink'),
      muted:      g('--muted'),
      white:      g('--white'),
    };
  },

  /** Ordered palette for multi-series charts */
  getPalette(count) {
    const c = this.getColors();
    const list = [c.blue, c.green, c.amber, c.pink, c.purple, c.red];
    return Array.from({ length: count }, (_, i) => list[i % list.length]);
  },

  /** Standard Chart.js scale options (grid + tick colours from theme) */
  getScaleDefaults() {
    const c = this.getColors();
    return {
      x: {
        grid:  { color: c.line, drawBorder: false },
        ticks: { color: c.muted, font: { size: 11 } },
      },
      y: {
        grid:  { color: c.line, drawBorder: false },
        ticks: { color: c.muted, font: { size: 11 } },
      },
    };
  },

  /** Standard Chart.js plugin defaults */
  getPluginDefaults() {
    const c = this.getColors();
    return {
      legend: {
        labels: { color: c.ink, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.82)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: c.line,
        borderWidth: 1,
      },
    };
  },

  /** Convenience: full default options object for most charts */
  getDefaultOptions(overrides = {}) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: this.getPluginDefaults(),
      scales:  this.getScaleDefaults(),
      ...overrides,
    };
  },
};

export function applyGlobalChartTheme() {
  if (!ChartJs || !ChartJs.defaults) return;
  const c = ChartTheme.getColors();
  ChartJs.defaults.color = c.ink || ChartJs.defaults.color;
  ChartJs.defaults.borderColor = c.line || ChartJs.defaults.borderColor;
}
