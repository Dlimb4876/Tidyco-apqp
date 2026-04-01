// ═══════════════════════════════════
// operations-dashboard-forecast-view.js — forecast visuals (v1.0.1)
// ═══════════════════════════════════

import { appState } from '../../../core/js/state.js'
import { canEdit, esc } from '../../../utils/js/helpers.js'
import { getWorkAreaOptions } from '../../capacity/production/js/work-areas-data.js'
import {
	prodCapGet24MonthKeys,
	prodCapMonthLabelFull
} from '../../capacity/production/js/prod-capacity-data.js'
import {
	opsMetricCard
} from './operations-dashboard-render-core.js'
import {
	opsToNumber,
	opsFormatHours
} from './operations-dashboard-metrics.js'
import {
	opsForecastProbabilityBandFromPct,
	opsForecastProbabilityLabel
} from './operations-forecast-data.js'
import {
	operationsDashboardState,
	opsForecastDomKey,
	opsForecastInlineFieldId
} from './operations-dashboard-state.js'

function opsRenderForecastRows(rows) {
	const safeRows = Array.isArray(rows) ? rows : [];

	// Read filter/sort state
	const filterText = (operationsDashboardState.opsForecastFilterText || '').trim().toLowerCase();
	const filterStatus = operationsDashboardState.opsForecastFilterStatus || '';
	const showArchived = operationsDashboardState.opsForecastShowArchived || false;
	const sortCol = operationsDashboardState.opsForecastSortCol || '';
	const sortDir = operationsDashboardState.opsForecastSortDir || 'asc';

	// Filter rows
	let displayRows = safeRows.filter(row => {
		if (!showArchived && row.status === 'archived') return false;
		if (filterStatus && row.status !== filterStatus) return false;
		if (filterText && !(row.title || '').toLowerCase().includes(filterText)) return false;
		return true;
	});

	// Sort rows
	if (sortCol) {
		displayRows = [...displayRows].sort((a, b) => {
			let av, bv;
			switch (sortCol) {
				case 'title': av = (a.title || '').toLowerCase(); bv = (b.title || '').toLowerCase(); break;
				case 'status': av = a.status || ''; bv = b.status || ''; break;
				case 'area': av = (a.work_area || '').toLowerCase(); bv = (b.work_area || '').toLowerCase(); break;
				case 'start': av = a.start_date || ''; bv = b.start_date || ''; break;
				case 'end': av = a.due_date || ''; bv = b.due_date || ''; break;
			case 'units': av = opsToNumber(a.total_units, 0); bv = opsToNumber(b.total_units, 0); break;
			case 'hours': av = opsToNumber(a.total_hours, 0); bv = opsToNumber(b.total_hours, 0); break;
			case 'probability': av = opsToNumber(a.probability_pct, 0); bv = opsToNumber(b.probability_pct, 0); break;
				default: av = ''; bv = '';
			}
			if (av < bv) return sortDir === 'asc' ? -1 : 1;
			if (av > bv) return sortDir === 'asc' ? 1 : -1;
			return 0;
		});
	}

	function sortIcon(col) {
		if (sortCol !== col) return '<span class="ops-sort-icon ops-sort-inactive">⇅</span>';
		return sortDir === 'asc' ? '<span class="ops-sort-icon">↑</span>' : '<span class="ops-sort-icon">↓</span>';
	}

	const archivedCount = safeRows.filter(r => r.status === 'archived').length;

	const filterControls = `
		<div class="ops-forecast-filters">
			<input
				class="ops-forecast-filter-text"
				name="ops_forecast_filter_text"
				type="text"
				placeholder="Filter by title…"
				value="${esc(operationsDashboardState.opsForecastFilterText || '')}"
				data-action="ops-forecast-filter-text"
			/>
			<select class="ops-forecast-filter-status" name="ops_forecast_filter_status" data-action="ops-forecast-filter-status">
				<option value="">All statuses</option>
				<option value="identified" ${filterStatus === 'identified' ? 'selected' : ''}>Identified</option>
				<option value="quoted" ${filterStatus === 'quoted' ? 'selected' : ''}>Quoted</option>
				<option value="negotiation" ${filterStatus === 'negotiation' ? 'selected' : ''}>Negotiation</option>
				<option value="won" ${filterStatus === 'won' ? 'selected' : ''}>Won</option>
				<option value="lost" ${filterStatus === 'lost' ? 'selected' : ''}>Lost</option>
			</select>
			<button class="btn btn-ghost ops-forecast-archived-toggle" data-action="ops-forecast-toggle-archived">
				${showArchived ? 'Hide Archived' : `Show Archived${archivedCount > 0 ? ` (${archivedCount})` : ''}`}
			</button>
		</div>`;

	if (displayRows.length === 0) {
		return `
			${filterControls}
			<div class="ops-empty-note">${safeRows.length === 0 ? 'No opportunities yet. Add a tender or opportunity to start the forecast layer.' : 'No opportunities match the current filters.'}</div>`;
	}

	return `
		${filterControls}
		<div class="ops-forecast-table-wrap">
			<table class="ops-forecast-table">
				<thead>
					<tr>
						<th class="ops-sortable ops-col-title" data-action="ops-forecast-sort" data-col="title">Title ${sortIcon('title')}</th>
						<th class="ops-sortable ops-col-status" data-action="ops-forecast-sort" data-col="status">Status ${sortIcon('status')}</th>
						<th class="ops-sortable ops-col-area" data-action="ops-forecast-sort" data-col="area">Area ${sortIcon('area')}</th>
						<th class="ops-sortable ops-col-date" data-action="ops-forecast-sort" data-col="start">Start ${sortIcon('start')}</th>
						<th class="ops-sortable ops-col-date" data-action="ops-forecast-sort" data-col="end">End ${sortIcon('end')}</th>
						<th class="ops-sortable ops-col-units" data-action="ops-forecast-sort" data-col="units">Units ${sortIcon('units')}</th>
						<th class="ops-col-oh">OH/Unit</th>
						<th class="ops-sortable ops-col-hours" data-action="ops-forecast-sort" data-col="hours">Total Hours ${sortIcon('hours')}</th>
						<th class="ops-sortable ops-col-prob" data-action="ops-forecast-sort" data-col="probability">Probability ${sortIcon('probability')}</th>
						<th class="ops-col-actions">Actions</th>
					</tr>
				</thead>
				<tbody>
					${displayRows.map(row => {
						const inlineMode = operationsDashboardState.opsForecastInlineEditId === row.id;
						const totalHours = opsToNumber(row.total_hours, 0);
						const probability = Math.max(0, Math.min(100, opsToNumber(row.probability_pct, 0)));
						const probabilityBand = typeof opsForecastProbabilityBandFromPct === 'function'
							? opsForecastProbabilityBandFromPct(probability)
							: (probability <= 33 ? 'low' : probability <= 66 ? 'medium' : 'high');
						const probabilityLabel = typeof opsForecastProbabilityLabel === 'function'
							? opsForecastProbabilityLabel(probabilityBand)
							: (probabilityBand.charAt(0).toUpperCase() + probabilityBand.slice(1));
						const key = opsForecastDomKey(row.id);
						return `
							<tr class="ops-forecast-row-main">
								<td class="ops-col-title">
									${inlineMode
										? `<input class="ops-forecast-inline" id="${opsForecastInlineFieldId(row.id, 'title')}" data-action="ops-forecast-inline-keydown" data-id="${esc(row.id)}" value="${esc(row.title || '')}" />`
										: esc(row.title || '-')}
								</td>
								<td class="ops-col-status">
									${inlineMode
										? `<select class="ops-forecast-inline" id="${opsForecastInlineFieldId(row.id, 'status')}" data-action="ops-forecast-inline-keydown" data-id="${esc(row.id)}">
												<option value="identified" ${(row.status || '') === 'identified' ? 'selected' : ''}>Identified</option>
												<option value="quoted" ${(row.status || '') === 'quoted' ? 'selected' : ''}>Quoted</option>
												<option value="negotiation" ${(row.status || '') === 'negotiation' ? 'selected' : ''}>Negotiation</option>
												<option value="won" ${(row.status || '') === 'won' ? 'selected' : ''}>Won</option>
												<option value="lost" ${(row.status || '') === 'lost' ? 'selected' : ''}>Lost</option>
												<option value="archived" ${(row.status || '') === 'archived' ? 'selected' : ''}>Archived</option>
											</select>`
										: `<span class="ops-forecast-status">${esc(row.status || 'identified')}</span>`}
								</td>
								<td class="ops-col-area">
									${inlineMode
									? `<select class="ops-forecast-inline" id="${opsForecastInlineFieldId(row.id, 'work_area')}" data-action="ops-forecast-inline-keydown" data-id="${esc(row.id)}"><option value="">— Unassigned</option>${getWorkAreaOptions(row.work_area || '')}</select>`
										: esc(row.work_area || 'Unassigned')}
								</td>
								<td class="ops-col-date">
									${inlineMode
										? `<input class="ops-forecast-inline" type="date" id="${opsForecastInlineFieldId(row.id, 'start_date')}" data-action="ops-forecast-inline-keydown" data-id="${esc(row.id)}" value="${esc(row.start_date || '')}" />`
										: esc(row.start_date || '-')}
								</td>
								<td class="ops-col-date">
									${inlineMode
										? `<input class="ops-forecast-inline" type="date" id="${opsForecastInlineFieldId(row.id, 'due_date')}" data-action="ops-forecast-inline-keydown" data-id="${esc(row.id)}" value="${esc(row.due_date || '')}" />`
										: esc(row.due_date || '-')}
								</td>
								<td class="ops-col-units">
									${inlineMode
										? `<input class="ops-forecast-inline" type="number" min="0" step="1" id="${opsForecastInlineFieldId(row.id, 'total_units')}" data-action="ops-forecast-inline-keydown" data-id="${esc(row.id)}" value="${esc(opsToNumber(row.total_units, 0))}" />`
										: esc(opsToNumber(row.total_units, 0).toLocaleString('en-GB'))}
								</td>
								<td class="ops-col-oh">
									${inlineMode
										? `<input class="ops-forecast-inline" type="number" min="0" step="0.01" id="${opsForecastInlineFieldId(row.id, 'oh_hours_per_unit')}" data-action="ops-forecast-inline-keydown" data-id="${esc(row.id)}" value="${esc(opsToNumber(row.oh_hours_per_unit, 0))}" />`
										: esc(opsToNumber(row.oh_hours_per_unit, 0))}
								</td>
								<td class="ops-col-hours">
									${esc(opsFormatHours(totalHours))}
								</td>
								<td class="ops-col-prob">
									${inlineMode
										? `<select class="ops-forecast-inline" id="${opsForecastInlineFieldId(row.id, 'probability_band')}" data-action="ops-forecast-inline-keydown" data-id="${esc(row.id)}">
												<option value="low" ${probabilityBand === 'low' ? 'selected' : ''}>Low</option>
												<option value="medium" ${probabilityBand === 'medium' ? 'selected' : ''}>Medium</option>
												<option value="high" ${probabilityBand === 'high' ? 'selected' : ''}>High</option>
										</select>`
										: esc(probabilityLabel)}
								</td>
								<td class="ops-forecast-actions ops-col-actions">
									${inlineMode
										? `<button class="btn btn-primary" data-action="ops-forecast-save-inline" data-id="${esc(row.id)}">Save</button>
											 <button class="btn btn-ghost" data-action="ops-forecast-cancel-inline">Cancel</button>`
										: (canEdit() ? `<button class="btn btn-ghost" data-action="ops-forecast-start-inline" data-id="${esc(row.id)}">Edit</button>` : '')}
									${canEdit() ? `<button class="btn btn-ghost" data-action="ops-forecast-archive" data-id="${esc(row.id)}">Archive</button>
									<button class="btn btn-ghost" data-action="ops-forecast-delete" data-id="${esc(row.id)}">Delete</button>` : ''}
								</td>
							</tr>
							<tr class="ops-forecast-row-notes">
								<td colspan="10">
									<div class="ops-forecast-notes-expansion">
										${inlineMode
											? `<textarea class="ops-forecast-inline-notes" id="${opsForecastInlineFieldId(row.id, 'notes')}" placeholder="Add notes..." maxlength="400">${esc(row.notes || '')}</textarea>`
											: (row.notes ? `<div class="ops-forecast-notes-text"><strong>Notes:</strong> ${esc(row.notes)}</div>` : '')}
									</div>
								</td>
							</tr>
						`;
					}).join('')}
				</tbody>
			</table>
		</div>`;
}

function opsRenderForecastView(metrics) {
	const forecast = metrics.forecast;
	if (!forecast.ready) {
		return `
			<div class="ops-shell">
				<section class="ops-panel">
					<div class="ops-panel-head">
						<h3>Production Forecast</h3>
						<span>Loading baseline and forecast data...</span>
					</div>
				</section>
			</div>`;
	}

	const utilTone = forecast.utilisation24 >= 95 ? 'critical' : forecast.utilisation24 >= 85 ? 'watch' : 'good';
	const headroomTone = forecast.headroom24h < 0 ? 'critical' : forecast.headroom24h < 250 ? 'watch' : 'good';
	const modeText = forecast.mode === 'remote' ? 'Connected to shared forecast table' : 'Using local fallback mode';
	const editingRow = (Array.isArray(forecast.rows) ? forecast.rows : []).find(row => row.id === operationsDashboardState.opsForecastEditingId) || null;
	const formTitle = editingRow ? 'Edit Opportunity' : 'Add Opportunity';
	const formSub = editingRow
		? 'Update this opportunity and save changes to the forecast layer'
		: 'Create a new forecast entry from active tenders and opportunities';
	const editingProbabilityBand = typeof opsForecastProbabilityBandFromPct === 'function'
		? opsForecastProbabilityBandFromPct(editingRow?.probability_pct ?? 0)
		: ((editingRow?.probability_pct ?? 0) <= 33 ? 'low' : (editingRow?.probability_pct ?? 0) <= 66 ? 'medium' : 'high');

	const forecastMonthLabel = typeof prodCapGet24MonthKeys === 'function' && typeof prodCapMonthLabelFull === 'function'
		? prodCapMonthLabelFull(prodCapGet24MonthKeys()[0])
		: '';
	const workAreaFilter = forecast.workAreaFilter || 'ALL'
	const workAreaOptions = ['ALL', ...(Array.isArray(forecast.workAreas) ? forecast.workAreas : [])]
	const workAreaPills = workAreaOptions.map((workArea) => {
		const label = workArea === 'ALL' ? 'ALL' : workArea
		const isActive = workArea === workAreaFilter
		return `<button class="ops-pill ${isActive ? 'active' : ''}" data-action="ops-forecast-filter-workarea" data-work-area="${esc(workArea)}">${esc(label)}</button>`
	}).join('')
	const scopeLabel = workAreaFilter === 'ALL' ? 'ALL Work Areas' : workAreaFilter

	return `
		<div class="ops-shell">
			<section class="ops-panel">
				<div class="ops-panel-head">
					<h3>Production Capacity Forecast (24 Months)</h3>
					<span>${esc(modeText)}</span>
				</div>
				${forecast.error ? `<div class="ops-empty-note">Forecast sync warning: ${esc(forecast.error)}</div>` : ''}
				<div class="ops-metrics-grid">
					${opsMetricCard('Active Opportunities', String(forecast.activeOpportunities), 'Status in active pipeline', 'good')}
					${opsMetricCard('Baseline Demand', opsFormatHours(forecast.baseline24h), 'Read-in from production load data', 'good')}
					${opsMetricCard('Forecast Added', opsFormatHours(forecast.forecast24h), 'From total opportunity hours', forecast.forecast24h > 0 ? 'watch' : 'good')}
					${opsMetricCard('Forecast Total', opsFormatHours(forecast.total24h), 'Baseline + opportunity hours', utilTone)}
					${opsMetricCard('Utilisation Capacity', opsFormatHours(forecast.supply24h), 'Available production capacity', 'good')}
					${opsMetricCard('Headroom', opsFormatHours(forecast.headroom24h), 'Supply minus forecast total', headroomTone)}
					${opsMetricCard('Utilisation', `${forecast.utilisation24}%`, '24-month blended utilisation', utilTone)}
				</div>
			</section>

			<section class="ops-panel">
				<div class="ops-panel-head">
					<div>
						<h3>Forecast Trend</h3>
						<span>Scope: ${esc(scopeLabel)} · Baseline demand plus forecast layers, with solid utilised capacity and dashed 100% available capacity</span>
					</div>
					<div class="pc-window-controls" style="margin-bottom: 0; padding: 0; border: none; background: none;">
						<button class="btn btn-sm btn-ghost" data-action="ops-forecast-shift-month" data-direction="prev" title="View previous month">← Previous</button>
						<div class="pc-window-label">${forecastMonthLabel}</div>
						<button class="btn btn-sm btn-ghost" data-action="ops-forecast-shift-month" data-direction="next" title="View next month">Next →</button>
						<button class="btn btn-sm btn-ghost" data-action="ops-refresh-forecast-chart" title="Force refresh chart">Refresh Chart</button>
					</div>
				</div>
				<div class="ops-pill-row" role="group" aria-label="Filter forecast chart by work area">
					${workAreaPills}
				</div>
				<div class="ops-forecast-chart-wrap">
					<canvas id="opsForecastTrendChart" aria-label="Forecast trend chart"></canvas>
				</div>
			</section>

			${canEdit() ? `<section class="ops-panel">
				<div class="ops-panel-head">
					<h3>${esc(formTitle)}</h3>
					<span>${esc(formSub)}</span>
				</div>
				<form class="ops-forecast-form" data-action="ops-forecast-submit">
					<input type="hidden" name="opportunity_id" value="${esc(editingRow?.id || '')}" />
					<label>Title<input type="text" name="title" required maxlength="120" value="${esc(editingRow?.title || '')}" /></label>
					<label>Owner<input type="text" name="owner" maxlength="80" value="${esc(editingRow?.owner || '')}" /></label>
					<label>Status
						<select name="status">
							<option value="identified" ${editingRow?.status === 'identified' ? 'selected' : ''}>Identified</option>
							<option value="quoted" ${editingRow?.status === 'quoted' ? 'selected' : ''}>Quoted</option>
							<option value="negotiation" ${editingRow?.status === 'negotiation' ? 'selected' : ''}>Negotiation</option>
							<option value="won" ${editingRow?.status === 'won' ? 'selected' : ''}>Won</option>
							<option value="lost" ${editingRow?.status === 'lost' ? 'selected' : ''}>Lost</option>
							<option value="archived" ${editingRow?.status === 'archived' ? 'selected' : ''}>Archived</option>
						</select>
					</label>
					<label>Work Area
						<select name="work_area">
							<option value="">— Unassigned</option>
							${getWorkAreaOptions(editingRow?.work_area || '')}
						</select>
					</label>
					<label>Start Date<input type="date" name="start_date" required value="${esc(editingRow?.start_date || '')}" /></label>
					<label>End Date<input type="date" name="due_date" required value="${esc(editingRow?.due_date || '')}" /></label>
					<label>Total Units<input type="number" name="total_units" required min="0" step="1" value="${esc(editingRow?.total_units || 0)}" /></label>
					<label>OH Hours/Unit<input type="number" name="oh_hours_per_unit" required min="0" step="0.01" value="${esc(editingRow?.oh_hours_per_unit || 0)}" /></label>
					<label>Probability
						<select name="probability_band" required>
							<option value="low" ${editingProbabilityBand === 'low' ? 'selected' : ''}>Low</option>
							<option value="medium" ${editingProbabilityBand === 'medium' ? 'selected' : ''}>Medium</option>
							<option value="high" ${editingProbabilityBand === 'high' ? 'selected' : ''}>High</option>
						</select>
					</label>
					<label class="ops-forecast-notes">Notes<textarea name="notes" rows="2" maxlength="400">${esc(editingRow?.notes || '')}</textarea></label>
					<div class="ops-forecast-form-actions">
						${editingRow ? '<button class="btn btn-ghost" type="button" data-action="ops-forecast-cancel-edit">Cancel Edit</button>' : ''}
						<button class="btn btn-primary" type="submit">${editingRow ? 'Save Changes' : 'Add Opportunity'}</button>
					</div>
				</form>
			</section>` : ''}

			<section class="ops-panel">
				<div class="ops-panel-head">
					<h3>Opportunity Layer</h3>
					<span>These entries are stacked on top of baseline production demand</span>
				</div>
				${opsRenderForecastRows(forecast.rows)}
			</section>
		</div>`;
}

function opsRenderForecastChart(forecast) {
	if (!forecast || !Array.isArray(forecast.monthSeries)) return;
	const ChartCtor = globalThis.Chart;
	if (typeof ChartCtor !== 'function') return;

	const canvas = document.getElementById('opsForecastTrendChart');
	if (!canvas) return;

	if (operationsDashboardState.opsForecastChart) {
		try {
			operationsDashboardState.opsForecastChart.destroy();
		} catch (err) {
			console.warn('Could not reset operations forecast chart:', err && err.message ? err.message : err);
		}
		operationsDashboardState.opsForecastChart = null;
	}

	const labels = forecast.monthSeries.map(row => row.label);
	const baseline = forecast.monthSeries.map(row => Math.round(row.baseline));
	const forecastLow = forecast.monthSeries.map(row => Math.round(row.forecastLow));
	const forecastMedium = forecast.monthSeries.map(row => Math.round(row.forecastMedium));
	const forecastHigh = forecast.monthSeries.map(row => Math.round(row.forecastHigh));
	const supply = forecast.monthSeries.map(row => Math.round(row.supply));
	const utilFactor = Number(appState.prodCapUtilizationFactor) || 0;
	const totalAvailable = forecast.monthSeries.map(row => {
		const utilisedCapacity = Math.round(row.supply);
		if (utilFactor <= 0) return 0;
		return Math.round(utilisedCapacity / utilFactor);
	});

	try {
		operationsDashboardState.opsForecastChart = new ChartCtor(canvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						type: 'bar',
						label: 'Baseline Demand',
						data: baseline,
						backgroundColor: 'rgba(17, 108, 148, 0.65)',
						borderColor: 'rgba(17, 108, 148, 1)',
						borderWidth: 1,
						stack: 'demand',
						order: 1
					},
					{
						type: 'bar',
						label: 'Forecast High',
						data: forecastHigh,
						backgroundColor: 'rgba(204, 90, 30, 0.75)',
						borderColor: 'rgba(204, 90, 30, 1)',
						borderWidth: 1,
						stack: 'demand',
						order: 1
					},
					{
						type: 'bar',
						label: 'Forecast Medium',
						data: forecastMedium,
						backgroundColor: 'rgba(217, 158, 24, 0.75)',
						borderColor: 'rgba(217, 158, 24, 1)',
						borderWidth: 1,
						stack: 'demand',
						order: 1
					},
					{
						type: 'bar',
						label: 'Forecast Low',
						data: forecastLow,
						backgroundColor: 'rgba(153, 174, 63, 0.7)',
						borderColor: 'rgba(153, 174, 63, 1)',
						borderWidth: 1,
						stack: 'demand',
						order: 1
					},
					{
						type: 'line',
						label: 'Utilisation Capacity',
						data: supply,
						borderColor: 'rgba(31, 143, 101, 1)',
						backgroundColor: 'rgba(31, 143, 101, 0.2)',
						// Why: keep utilisation capacity as its own baseline line separate from demand bars.
						stack: 'ops-forecast-capacity-line',
						borderWidth: 2,
						pointRadius: 2,
						tension: 0.25,
						order: 0
					},
					{
						type: 'line',
						// Why: show full 100%-utilisation baseline on the forecast trend for planning headroom.
						label: 'Total Available (100%)',
						data: totalAvailable,
						borderColor: 'rgba(100, 116, 139, 1)',
						backgroundColor: 'rgba(100, 116, 139, 0.2)',
						stack: 'ops-forecast-available-line',
						borderWidth: 2,
						borderDash: [6, 4],
						pointRadius: 1,
						tension: 0.25,
						order: 0
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							callback: (value) => `${value}h`
						}
					}
				},
				plugins: {
					legend: {
						position: 'bottom'
					},
					tooltip: {
						mode: 'index',
						intersect: false
					}
				}
			}
		});
	} catch (err) {
		console.warn('Could not create operations forecast chart:', err && err.message ? err.message : err);
	}
}

export {
	opsRenderForecastRows,
	opsRenderForecastView,
	opsRenderForecastChart
}
