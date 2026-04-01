// ═══════════════════════════════════
// operations-dashboard-state.js — shared state and keys
// ═══════════════════════════════════

export const operationsDashboardState = {
  opsRealtimeActive: false,
  opsRefreshTimers: {},
  opsForecastChart: null,
  // Why: only render forecast chart on first entry to Forecast tab or manual refresh click.
  opsForecastChartRenderRequested: false,
  opsLastRenderedTab: '',
  opsForecastEditingId: '',
  opsForecastInlineEditId: '',
  opsPulseFeedContainer: null,
  opsForecastShowArchived: false,
  opsForecastSortCol: '',
  opsForecastSortDir: 'asc',
  opsForecastFilterStatus: '',
  opsForecastFilterText: '',
  opsForecastWorkAreaFilter: 'ALL',
  opsReportingDateIso: '',
  opsRefreshCurrentTab: null
}

export function opsForecastDomKey(id) {
  return String(id || '').replace(/[^a-zA-Z0-9_-]/g, '_')
}

export function opsForecastInlineFieldId(id, field) {
  return `opsForecastInline_${opsForecastDomKey(id)}_${field}`
}

export function setOpsRefreshCurrentTab(handler) {
  operationsDashboardState.opsRefreshCurrentTab = typeof handler === 'function' ? handler : null
}
