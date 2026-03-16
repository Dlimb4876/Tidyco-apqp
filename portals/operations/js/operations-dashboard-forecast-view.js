// ═══════════════════════════════════
// operations-dashboard-forecast-view.js — forecast visuals
// ═══════════════════════════════════

function opsRenderForecastRows(rows) {
	const safeRows = Array.isArray(rows) ? rows : [];

	// Read filter/sort state
	const filterText = (typeof opsForecastFilterText !== 'undefined' ? opsForecastFilterText : '').trim().toLowerCase();
	const filterStatus = typeof opsForecastFilterStatus !== 'undefined' ? opsForecastFilterStatus : '';
	const showArchived = typeof opsForecastShowArchived !== 'undefined' ? opsForecastShowArchived : false;
	const sortCol = typeof opsForecastSortCol !== 'undefined' ? opsForecastSortCol : '';
	const sortDir = typeof opsForecastSortDir !== 'undefined' ? opsForecastSortDir : 'asc';

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
				type="text"
				placeholder="Filter by title…"
				value="${esc(opsForecastFilterText || '')}"
				onchange="opsForecastSetFilterText(this.value)"
			/>
			<select class="ops-forecast-filter-status" onchange="opsForecastSetFilterStatus(this.value)">
				<option value="">All statuses</option>
				<option value="identified" ${filterStatus === 'identified' ? 'selected' : ''}>Identified</option>
				<option value="quoted" ${filterStatus === 'quoted' ? 'selected' : ''}>Quoted</option>
				<option value="negotiation" ${filterStatus === 'negotiation' ? 'selected' : ''}>Negotiation</option>
				<option value="won" ${filterStatus === 'won' ? 'selected' : ''}>Won</option>
				<option value="active" ${filterStatus === 'active' ? 'selected' : ''}>Active</option>
				<option value="lost" ${filterStatus === 'lost' ? 'selected' : ''}>Lost</option>
			</select>
			<button class="btn btn-ghost ops-forecast-archived-toggle" onclick="opsForecastToggleArchived()">
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
						<th class="ops-sortable" onclick="opsForecastSetSort('title')">Title ${sortIcon('title')}</th>
						<th class="ops-sortable" onclick="opsForecastSetSort('status')">Status ${sortIcon('status')}</th>
						<th class="ops-sortable" onclick="opsForecastSetSort('area')">Area ${sortIcon('area')}</th>
						<th class="ops-sortable" onclick="opsForecastSetSort('start')">Start ${sortIcon('start')}</th>
						<th class="ops-sortable" onclick="opsForecastSetSort('end')">End ${sortIcon('end')}</th>
						<th class="ops-sortable" onclick="opsForecastSetSort('hours')">Total Hours ${sortIcon('hours')}</th>
						<th class="ops-sortable" onclick="opsForecastSetSort('probability')">Probability ${sortIcon('probability')}</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					${displayRows.map(row => {
						const inlineMode = opsForecastInlineEditId === row.id;
						const totalHours = opsToNumber(row.total_hours, 0);
						const probability = Math.max(0, Math.min(100, opsToNumber(row.probability_pct, 0)));
						const probabilityBand = typeof window.opsForecastProbabilityBandFromPct === 'function'
							? window.opsForecastProbabilityBandFromPct(probability)
							: (probability <= 33 ? 'low' : probability <= 66 ? 'medium' : 'high');
						const probabilityLabel = typeof window.opsForecastProbabilityLabel === 'function'
							? window.opsForecastProbabilityLabel(probabilityBand)
							: (probabilityBand.charAt(0).toUpperCase() + probabilityBand.slice(1));
						const key = opsForecastDomKey(row.id);
						return `
							<tr>
								<td>
									${inlineMode
										? `<input class="ops-forecast-inline" id="opsForecastInline_${key}_title" onkeydown="opsForecastInlineKeydown(event, '${esc(row.id)}')" value="${esc(row.title || '')}" />`
										: esc(row.title || '-')}
								</td>
								<td>
									${inlineMode
										? `<select class="ops-forecast-inline" id="opsForecastInline_${key}_status" onkeydown="opsForecastInlineKeydown(event, '${esc(row.id)}')">
												<option value="identified" ${(row.status || '') === 'identified' ? 'selected' : ''}>Identified</option>
												<option value="quoted" ${(row.status || '') === 'quoted' ? 'selected' : ''}>Quoted</option>
												<option value="negotiation" ${(row.status || '') === 'negotiation' ? 'selected' : ''}>Negotiation</option>
												<option value="won" ${(row.status || '') === 'won' ? 'selected' : ''}>Won</option>
												<option value="active" ${(row.status || '') === 'active' ? 'selected' : ''}>Active</option>
												<option value="lost" ${(row.status || '') === 'lost' ? 'selected' : ''}>Lost</option>
												<option value="archived" ${(row.status || '') === 'archived' ? 'selected' : ''}>Archived</option>
											</select>`
										: `<span class="ops-forecast-status">${esc(row.status || 'identified')}</span>`}
								</td>
								<td>
									${inlineMode
									? `<select class="ops-forecast-inline" id="opsForecastInline_${key}_work_area" onkeydown="opsForecastInlineKeydown(event, '${esc(row.id)}')"><option value="">— Unassigned</option>${getWorkAreaOptions(row.work_area || '')}</select>`
										: esc(row.work_area || 'Unassigned')}
								</td>
								<td>
									${inlineMode
										? `<input class="ops-forecast-inline" type="date" id="opsForecastInline_${key}_start_date" onkeydown="opsForecastInlineKeydown(event, '${esc(row.id)}')" value="${esc(row.start_date || '')}" />`
										: esc(row.start_date || '-')}
								</td>
								<td>
									${inlineMode
										? `<input class="ops-forecast-inline" type="date" id="opsForecastInline_${key}_due_date" onkeydown="opsForecastInlineKeydown(event, '${esc(row.id)}')" value="${esc(row.due_date || '')}" />`
										: esc(row.due_date || '-')}
								</td>
								<td>
									${inlineMode
										? `<input class="ops-forecast-inline" type="number" min="0" step="1" id="opsForecastInline_${key}_total_hours" onkeydown="opsForecastInlineKeydown(event, '${esc(row.id)}')" value="${esc(totalHours)}" />`
										: esc(opsFormatHours(totalHours))}
								</td>
								<td>
									${inlineMode
										? `<select class="ops-forecast-inline" id="opsForecastInline_${key}_probability_band" onkeydown="opsForecastInlineKeydown(event, '${esc(row.id)}')">
												<option value="low" ${probabilityBand === 'low' ? 'selected' : ''}>Low</option>
												<option value="medium" ${probabilityBand === 'medium' ? 'selected' : ''}>Medium</option>
												<option value="high" ${probabilityBand === 'high' ? 'selected' : ''}>High</option>
										</select>`
										: esc(probabilityLabel)}
								</td>
								<td class="ops-forecast-actions">
									${inlineMode
										? `<button class="btn btn-primary" onclick="opsForecastSaveInline('${esc(row.id)}')">Save</button>
											 <button class="btn btn-ghost" onclick="opsForecastCancelInline()">Cancel</button>`
										: `<button class="btn btn-ghost" onclick="opsForecastStartInlineEdit('${esc(row.id)}')">Edit</button>`}
									<button class="btn btn-ghost" onclick="opsForecastSetStatus('${esc(row.id)}', 'archived')">Archive</button>
									<button class="btn btn-ghost" onclick="opsForecastDelete('${esc(row.id)}')">Delete</button>
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
	const editingRow = (Array.isArray(forecast.rows) ? forecast.rows : []).find(row => row.id === opsForecastEditingId) || null;
	const formTitle = editingRow ? 'Edit Opportunity' : 'Add Opportunity';
	const formSub = editingRow
		? 'Update this opportunity and save changes to the forecast layer'
		: 'Create a new forecast entry from active tenders and opportunities';
	const editingProbabilityBand = typeof window.opsForecastProbabilityBandFromPct === 'function'
		? window.opsForecastProbabilityBandFromPct(editingRow?.probability_pct ?? 0)
		: ((editingRow?.probability_pct ?? 0) <= 33 ? 'low' : (editingRow?.probability_pct ?? 0) <= 66 ? 'medium' : 'high');

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
					${opsMetricCard('Capacity Supply', opsFormatHours(forecast.supply24h), 'Available production capacity', 'good')}
					${opsMetricCard('Headroom', opsFormatHours(forecast.headroom24h), 'Supply minus forecast total', headroomTone)}
					${opsMetricCard('Utilisation', `${forecast.utilisation24}%`, '24-month blended utilisation', utilTone)}
				</div>
			</section>

			<section class="ops-panel">
				<div class="ops-panel-head">
					<h3>Forecast Trend</h3>
					<span>Baseline demand plus low, medium and high probability opportunity layers</span>
				</div>
				<div class="ops-forecast-chart-wrap">
					<canvas id="opsForecastTrendChart" aria-label="Forecast trend chart"></canvas>
				</div>
			</section>

			<section class="ops-panel">
				<div class="ops-panel-head">
					<h3>${esc(formTitle)}</h3>
					<span>${esc(formSub)}</span>
				</div>
				<form class="ops-forecast-form" onsubmit="opsForecastSubmit(event)">
					<input type="hidden" name="opportunity_id" value="${esc(editingRow?.id || '')}" />
					<label>Title<input type="text" name="title" required maxlength="120" value="${esc(editingRow?.title || '')}" /></label>
					<label>Owner<input type="text" name="owner" maxlength="80" value="${esc(editingRow?.owner || '')}" /></label>
					<label>Status
						<select name="status">
							<option value="identified" ${editingRow?.status === 'identified' ? 'selected' : ''}>Identified</option>
							<option value="quoted" ${editingRow?.status === 'quoted' ? 'selected' : ''}>Quoted</option>
							<option value="negotiation" ${editingRow?.status === 'negotiation' ? 'selected' : ''}>Negotiation</option>
							<option value="won" ${editingRow?.status === 'won' ? 'selected' : ''}>Won</option>
							<option value="active" ${editingRow?.status === 'active' ? 'selected' : ''}>Active</option>
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
					<label>Total Hours<input type="number" name="total_hours" required min="0" step="1" value="${esc(editingRow?.total_hours || 0)}" /></label>
					<label>Probability
						<select name="probability_band" required>
							<option value="low" ${editingProbabilityBand === 'low' ? 'selected' : ''}>Low</option>
							<option value="medium" ${editingProbabilityBand === 'medium' ? 'selected' : ''}>Medium</option>
							<option value="high" ${editingProbabilityBand === 'high' ? 'selected' : ''}>High</option>
						</select>
					</label>
					<label class="ops-forecast-notes">Notes<textarea name="notes" rows="2" maxlength="400">${esc(editingRow?.notes || '')}</textarea></label>
					<div class="ops-forecast-form-actions">
						${editingRow ? '<button class="btn btn-ghost" type="button" onclick="opsForecastCancelEdit()">Cancel Edit</button>' : ''}
						<button class="btn btn-primary" type="submit">${editingRow ? 'Save Changes' : 'Add Opportunity'}</button>
					</div>
				</form>
			</section>

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
	if (typeof Chart !== 'function') return;

	const canvas = document.getElementById('opsForecastTrendChart');
	if (!canvas) return;

	if (opsForecastChart) {
		try {
			opsForecastChart.destroy();
		} catch (err) {
			console.warn('Could not reset operations forecast chart:', err && err.message ? err.message : err);
		}
		opsForecastChart = null;
	}

	const labels = forecast.monthSeries.map(row => row.label);
	const baseline = forecast.monthSeries.map(row => Math.round(row.baseline));
	const forecastLow = forecast.monthSeries.map(row => Math.round(row.forecastLow));
	const forecastMedium = forecast.monthSeries.map(row => Math.round(row.forecastMedium));
	const forecastHigh = forecast.monthSeries.map(row => Math.round(row.forecastHigh));
	const supply = forecast.monthSeries.map(row => Math.round(row.supply));

	opsForecastChart = new Chart(canvas, {
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
					stack: 'demand'
				},
				{
					type: 'bar',
					label: 'Forecast Low',
					data: forecastLow,
					backgroundColor: 'rgba(153, 174, 63, 0.7)',
					borderColor: 'rgba(153, 174, 63, 1)',
					borderWidth: 1,
					stack: 'demand'
				},
				{
					type: 'bar',
					label: 'Forecast Medium',
					data: forecastMedium,
					backgroundColor: 'rgba(217, 158, 24, 0.75)',
					borderColor: 'rgba(217, 158, 24, 1)',
					borderWidth: 1,
					stack: 'demand'
				},
				{
					type: 'bar',
					label: 'Forecast High',
					data: forecastHigh,
					backgroundColor: 'rgba(204, 90, 30, 0.75)',
					borderColor: 'rgba(204, 90, 30, 1)',
					borderWidth: 1,
					stack: 'demand'
				},
				{
					type: 'line',
					label: 'Capacity Supply',
					data: supply,
					borderColor: 'rgba(31, 143, 101, 1)',
					backgroundColor: 'rgba(31, 143, 101, 0.2)',
					borderWidth: 2,
					pointRadius: 2,
					tension: 0.25
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
}
