// ═══════════════════════════════════
// operations-dashboard-forecast-actions.js — forecast interactions
// ═══════════════════════════════════

function opsForecastInlineKeydown(event, id) {
	if (!event) return;

	if (event.key === 'Enter') {
		event.preventDefault();
		if (typeof window.opsForecastSaveInline === 'function') {
			window.opsForecastSaveInline(id);
		} else {
			opsForecastSaveInline(id);
		}
		return;
	}

	if (event.key === 'Escape') {
		event.preventDefault();
		if (typeof window.opsForecastCancelInline === 'function') {
			window.opsForecastCancelInline();
		} else {
			opsForecastCancelInline();
		}
	}
}

async function opsForecastSubmit(event) {
	event.preventDefault();
	if (!window.opsForecastManager || typeof window.opsForecastManager.upsertOpportunity !== 'function') return;

	const form = event.target;
	const fd = new FormData(form);
	const title = (fd.get('title') || '').toString().trim();
	const existingId = (fd.get('opportunity_id') || '').toString().trim();
	const startDate = (fd.get('start_date') || '').toString();
	const dueDate = (fd.get('due_date') || '').toString();
	const totalHours = opsToNumber(fd.get('total_hours'), 0);
	const probabilityBand = (fd.get('probability_band') || '').toString().trim().toLowerCase();
	const probabilityPct = probabilityBand && typeof window.opsForecastProbabilityPctFromBand === 'function'
		? window.opsForecastProbabilityPctFromBand(probabilityBand)
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

	await window.opsForecastManager.upsertOpportunity({
		...(existingId ? { id: existingId } : {}),
		title,
		owner: (fd.get('owner') || '').toString().trim(),
		status: (fd.get('status') || 'identified').toString(),
		work_area: (fd.get('work_area') || '').toString().trim() || 'Unassigned',
		start_date: startDate,
		due_date: dueDate,
		total_hours: totalHours,
		probability_band: probabilityBand,
		probability_pct: probabilityPct,
		notes: (fd.get('notes') || '').toString().trim()
	});

	form.reset();
	opsForecastEditingId = '';
	opsForecastInlineEditId = '';
	if (currentSection === 'operations') render();
}

async function opsForecastDelete(id) {
	if (!id || !window.opsForecastManager || typeof window.opsForecastManager.deleteOpportunity !== 'function') return;
	if (!confirm('Delete this forecast opportunity?')) return;

	await window.opsForecastManager.deleteOpportunity(id);
	if (opsForecastEditingId === id) opsForecastEditingId = '';
	if (opsForecastInlineEditId === id) opsForecastInlineEditId = '';
	if (currentSection === 'operations') render();
}

async function opsForecastSetStatus(id, status) {
	if (!id || !status || !window.opsForecastManager || typeof window.opsForecastManager.getRows !== 'function') return;

	const row = window.opsForecastManager.getRows().find(item => item.id === id);
	if (!row) return;

	await window.opsForecastManager.upsertOpportunity({
		...row,
		status
	});

	if (status === 'archived' && opsForecastEditingId === id) opsForecastEditingId = '';
	if (status === 'archived' && opsForecastInlineEditId === id) opsForecastInlineEditId = '';

	if (currentSection === 'operations') render();
}

function opsForecastStartInlineEdit(id) {
	if (!id) return;
	opsForecastInlineEditId = id;
	opsForecastEditingId = '';
	if (currentSection === 'operations') render();
}

function opsForecastCancelInline() {
	opsForecastInlineEditId = '';
	if (currentSection === 'operations') render();
}

async function opsForecastSaveInline(id) {
	if (!id || !window.opsForecastManager || typeof window.opsForecastManager.getRows !== 'function') return;

	const row = window.opsForecastManager.getRows().find(item => item.id === id);
	if (!row) return;

	const titleEl = document.getElementById(opsForecastInlineFieldId(id, 'title'));
	const statusEl = document.getElementById(opsForecastInlineFieldId(id, 'status'));
	const areaEl = document.getElementById(opsForecastInlineFieldId(id, 'work_area'));
	const startEl = document.getElementById(opsForecastInlineFieldId(id, 'start_date'));
	const dueEl = document.getElementById(opsForecastInlineFieldId(id, 'due_date'));
	const totalEl = document.getElementById(opsForecastInlineFieldId(id, 'total_hours'));
	const probBandEl = document.getElementById(opsForecastInlineFieldId(id, 'probability_band'));
	const probEl = document.getElementById(opsForecastInlineFieldId(id, 'probability_pct'));

	const nextTitle = (titleEl?.value || '').toString().trim();
	const nextStart = (startEl?.value || '').toString();
	const nextDue = (dueEl?.value || '').toString();
	const nextTotalHours = Math.max(0, opsToNumber(totalEl?.value, 0));
	const nextProbabilityBand = (probBandEl?.value || '').toString().trim().toLowerCase();
	const nextProbability = nextProbabilityBand && typeof window.opsForecastProbabilityPctFromBand === 'function'
		? window.opsForecastProbabilityPctFromBand(nextProbabilityBand)
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

	await window.opsForecastManager.upsertOpportunity({
		...row,
		title: nextTitle,
		status: (statusEl?.value || row.status || 'identified').toString(),
		work_area: (areaEl?.value || row.work_area || 'Unassigned').toString().trim() || 'Unassigned',
		start_date: nextStart,
		due_date: nextDue,
		total_hours: nextTotalHours,
		probability_band: nextProbabilityBand,
		probability_pct: nextProbability
	});

	opsForecastInlineEditId = '';
	if (currentSection === 'operations') render();
}

function opsForecastStartEdit(id) {
	if (!id) return;
	opsForecastEditingId = id;
	opsForecastInlineEditId = '';
	if (currentSection === 'operations') render();
}

function opsForecastCancelEdit() {
	opsForecastEditingId = '';
	opsForecastInlineEditId = '';
	if (currentSection === 'operations') render();
}

function opsForecastSetSort(col) {
	if (!col) return;
	if (opsForecastSortCol === col) {
		opsForecastSortDir = opsForecastSortDir === 'asc' ? 'desc' : 'asc';
	} else {
		opsForecastSortCol = col;
		opsForecastSortDir = 'asc';
	}
	if (currentSection === 'operations') render();
}

function opsForecastSetFilterStatus(val) {
	opsForecastFilterStatus = (val || '').toString();
	if (currentSection === 'operations') render();
}

function opsForecastSetFilterText(val) {
	opsForecastFilterText = (val || '').toString().trim();
	if (currentSection === 'operations') render();
}

function opsForecastToggleArchived() {
	opsForecastShowArchived = !opsForecastShowArchived;
	if (currentSection === 'operations') render();
}
