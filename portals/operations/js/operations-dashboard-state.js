// ═══════════════════════════════════
// operations-dashboard-state.js — shared state and keys
// ═══════════════════════════════════

let opsRealtimeActive = false;
let opsRefreshTimers = {};
let opsForecastChart = null;
let opsForecastEditingId = '';
let opsForecastInlineEditId = '';
let opsPulseFeedContainer = null;

function opsForecastDomKey(id) {
	return String(id || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function opsForecastInlineFieldId(id, field) {
	return `opsForecastInline_${opsForecastDomKey(id)}_${field}`;
}
