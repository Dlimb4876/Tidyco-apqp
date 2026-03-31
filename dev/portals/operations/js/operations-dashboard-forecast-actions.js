// ═══════════════════════════════════
// operations-dashboard-forecast-actions.js — forecast interactions
// ═══════════════════════════════════

import { appState } from '../../../core/js/state.js'
import { showToast } from '../../../utils/js/helpers.js'
import { opsToNumber } from './operations-dashboard-metrics.js'
import {
	opsForecastManager,
	opsForecastProbabilityPctFromBand
} from './operations-forecast-data.js'
import {
	operationsDashboardState,
	opsForecastInlineFieldId
} from './operations-dashboard-state.js'

function opsForecastInlineKeydown(event, id) {
	if (!event) return;

	if (event.key === 'Enter') {
		event.preventDefault();
		opsForecastSaveInline(id);
		return;
	}

	if (event.key === 'Escape') {
		event.preventDefault();
		opsForecastCancelInline();
	}
}

async function opsForecastSubmit(event) {
	event.preventDefault();
	if (!opsForecastManager || typeof opsForecastManager.upsertOpportunity !== 'function') return;

	const form = event.target;
	const fd = new FormData(form);
	const title = (fd.get('title') || '').toString().trim();
	const existingId = (fd.get('opportunity_id') || '').toString().trim();
	const startDate = (fd.get('start_date') || '').toString();
	const dueDate = (fd.get('due_date') || '').toString();
	const totalUnits = opsToNumber(fd.get('total_units'), 0);
	const ohHoursPerUnit = opsToNumber(fd.get('oh_hours_per_unit'), 0);
	const batchCount = opsToNumber(fd.get('batch_count'), 1);
	const beatRateDays = opsToNumber(fd.get('beat_rate_days'), 1);
	const probabilityBand = (fd.get('probability_band') || '').toString().trim().toLowerCase();
	const probabilityPct = probabilityBand && typeof opsForecastProbabilityPctFromBand === 'function'
		? opsForecastProbabilityPctFromBand(probabilityBand)
		: Math.max(0, Math.min(100, opsToNumber(fd.get('probability_pct'), 0)));

	if (!title) {
		showToast('Please add a title for this opportunity.', 'warning');
		return;
	}
	if (!startDate || !dueDate) {
		showToast('Please add both start and due dates.', 'warning');
		return;
	}
	if (startDate > dueDate) {
		showToast('Start date must be before due date.', 'warning');
		return;
	}

	await opsForecastManager.upsertOpportunity({
		...(existingId ? { id: existingId } : {}),
		title,
		owner: (fd.get('owner') || '').toString().trim(),
		status: (fd.get('status') || 'identified').toString(),
		work_area: (fd.get('work_area') || '').toString().trim() || 'Unassigned',
		start_date: startDate,
		due_date: dueDate,
		total_units: totalUnits,
		oh_hours_per_unit: ohHoursPerUnit,
		batch_count: batchCount,
		beat_rate_days: beatRateDays,
		probability_band: probabilityBand,
		probability_pct: probabilityPct,
		notes: (fd.get('notes') || '').toString().trim()
	});

	form.reset();
	operationsDashboardState.opsForecastEditingId = '';
	operationsDashboardState.opsForecastInlineEditId = '';
	if (appState.currentSection === 'operations' && typeof globalThis.render === 'function') globalThis.render();
}

async function opsForecastDelete(id) {
	if (!id || !opsForecastManager || typeof opsForecastManager.deleteOpportunity !== 'function') return;
	if (!confirm('Delete this forecast opportunity?')) return;

	await opsForecastManager.deleteOpportunity(id);
	if (operationsDashboardState.opsForecastEditingId === id) operationsDashboardState.opsForecastEditingId = '';
	if (operationsDashboardState.opsForecastInlineEditId === id) operationsDashboardState.opsForecastInlineEditId = '';
	if (appState.currentSection === 'operations' && typeof globalThis.render === 'function') globalThis.render();
}

async function opsForecastSetStatus(id, status) {
	if (!id || !status || !opsForecastManager || typeof opsForecastManager.getRows !== 'function') return;

	const row = opsForecastManager.getRows().find(item => item.id === id);
	if (!row) return;

	await opsForecastManager.upsertOpportunity({
		...row,
		status
	});

	if (status === 'archived' && operationsDashboardState.opsForecastEditingId === id) {
		operationsDashboardState.opsForecastEditingId = '';
	}
	if (status === 'archived' && operationsDashboardState.opsForecastInlineEditId === id) {
		operationsDashboardState.opsForecastInlineEditId = '';
	}

	if (appState.currentSection === 'operations' && typeof globalThis.render === 'function') globalThis.render();
}

function opsForecastStartInlineEdit(id) {
	if (!id) return;
	operationsDashboardState.opsForecastInlineEditId = id;
	operationsDashboardState.opsForecastEditingId = '';
	if (appState.currentSection === 'operations' && typeof globalThis.render === 'function') globalThis.render();
}

function opsForecastCancelInline() {
	operationsDashboardState.opsForecastInlineEditId = '';
	if (appState.currentSection === 'operations' && typeof globalThis.render === 'function') globalThis.render();
}

async function opsForecastSaveInline(id) {
	if (!id || !opsForecastManager || typeof opsForecastManager.getRows !== 'function') return;

	const row = opsForecastManager.getRows().find(item => item.id === id);
	if (!row) return;

	const titleEl = document.getElementById(opsForecastInlineFieldId(id, 'title'));
	const statusEl = document.getElementById(opsForecastInlineFieldId(id, 'status'));
	const areaEl = document.getElementById(opsForecastInlineFieldId(id, 'work_area'));
	const startEl = document.getElementById(opsForecastInlineFieldId(id, 'start_date'));
	const dueEl = document.getElementById(opsForecastInlineFieldId(id, 'due_date'));
	const totalUnitsEl = document.getElementById(opsForecastInlineFieldId(id, 'total_units'));
	const ohHoursEl = document.getElementById(opsForecastInlineFieldId(id, 'oh_hours_per_unit'));
	const batchCountEl = document.getElementById(opsForecastInlineFieldId(id, 'batch_count'));
	const beatRateEl = document.getElementById(opsForecastInlineFieldId(id, 'beat_rate_days'));
	const probBandEl = document.getElementById(opsForecastInlineFieldId(id, 'probability_band'));
	const probEl = document.getElementById(opsForecastInlineFieldId(id, 'probability_pct'));

	const nextTitle = (titleEl?.value || '').toString().trim();
	const nextStart = (startEl?.value || '').toString();
	const nextDue = (dueEl?.value || '').toString();
	const nextTotalUnits = Math.max(0, opsToNumber(totalUnitsEl?.value, 0));
	const nextOhHoursPerUnit = Math.max(0, opsToNumber(ohHoursEl?.value, 0));
	const nextBatchCount = Math.max(1, opsToNumber(batchCountEl?.value, 1));
	const nextBeatRateDays = Math.max(1, opsToNumber(beatRateEl?.value, 1));
	const nextProbabilityBand = (probBandEl?.value || '').toString().trim().toLowerCase();
	const nextProbability = nextProbabilityBand && typeof opsForecastProbabilityPctFromBand === 'function'
		? opsForecastProbabilityPctFromBand(nextProbabilityBand)
		: Math.max(0, Math.min(100, opsToNumber(probEl?.value, 0)));

	if (!nextTitle) {
		showToast('Please add a title for this opportunity.', 'warning');
		return;
	}

	if (!nextStart || !nextDue) {
		showToast('Please add both start and due dates.', 'warning');
		return;
	}

	if (nextStart > nextDue) {
		showToast('Start date must be before due date.', 'warning');
		return;
	}

	await opsForecastManager.upsertOpportunity({
		...row,
		title: nextTitle,
		status: (statusEl?.value || row.status || 'identified').toString(),
		work_area: (areaEl?.value || row.work_area || 'Unassigned').toString().trim() || 'Unassigned',
		start_date: nextStart,
		due_date: nextDue,
		total_units: nextTotalUnits,
		oh_hours_per_unit: nextOhHoursPerUnit,
		batch_count: nextBatchCount,
		beat_rate_days: nextBeatRateDays,
		probability_band: nextProbabilityBand,
		probability_pct: nextProbability
	});

	operationsDashboardState.opsForecastInlineEditId = '';
	if (appState.currentSection === 'operations' && typeof globalThis.render === 'function') globalThis.render();
}

function opsForecastStartEdit(id) {
	if (!id) return;
	operationsDashboardState.opsForecastEditingId = id;
	operationsDashboardState.opsForecastInlineEditId = '';
	if (appState.currentSection === 'operations' && typeof globalThis.render === 'function') globalThis.render();
}

function opsForecastCancelEdit() {
	operationsDashboardState.opsForecastEditingId = '';
	operationsDashboardState.opsForecastInlineEditId = '';
	if (appState.currentSection === 'operations' && typeof globalThis.render === 'function') globalThis.render();
}

function opsForecastSetSort(col) {
	if (!col) return;
	if (operationsDashboardState.opsForecastSortCol === col) {
		operationsDashboardState.opsForecastSortDir = operationsDashboardState.opsForecastSortDir === 'asc' ? 'desc' : 'asc';
	} else {
		operationsDashboardState.opsForecastSortCol = col;
		operationsDashboardState.opsForecastSortDir = 'asc';
	}
	if (appState.currentSection === 'operations' && typeof globalThis.render === 'function') globalThis.render();
}

function opsForecastSetFilterStatus(val) {
	operationsDashboardState.opsForecastFilterStatus = (val || '').toString();
	if (appState.currentSection === 'operations' && typeof globalThis.render === 'function') globalThis.render();
}

function opsForecastSetFilterText(val) {
	operationsDashboardState.opsForecastFilterText = (val || '').toString().trim();
	if (appState.currentSection === 'operations' && typeof globalThis.render === 'function') globalThis.render();
}

function opsForecastToggleArchived() {
	operationsDashboardState.opsForecastShowArchived = !operationsDashboardState.opsForecastShowArchived;
	if (appState.currentSection === 'operations' && typeof globalThis.render === 'function') globalThis.render();
}

function opsForecastSetWorkAreaFilter(workArea) {
	const next = (workArea || '').toString().trim()
	operationsDashboardState.opsForecastWorkAreaFilter = next || 'ALL'
	if (appState.currentSection === 'operations' && typeof globalThis.render === 'function') globalThis.render()
}

export {
	opsForecastInlineKeydown,
	opsForecastSubmit,
	opsForecastDelete,
	opsForecastSetStatus,
	opsForecastStartInlineEdit,
	opsForecastCancelInline,
	opsForecastSaveInline,
	opsForecastStartEdit,
	opsForecastCancelEdit,
	opsForecastSetSort,
	opsForecastSetFilterStatus,
	opsForecastSetFilterText,
	opsForecastToggleArchived,
	opsForecastSetWorkAreaFilter
}
