/* ============================================================
   me-team.js — Team Tab Rendering
   ============================================================ */

window.meRenderTeamTab = function(teamArray) {
  const department = typeof meGetDepartmentFromContext === 'function'
    ? meGetDepartmentFromContext()
    : 'ME';
  const isPmContext = department === 'PM';
  const teamTitle = isPmContext
    ? 'PM TEAM'
    : department === 'LOG'
      ? 'LOGISTICS TECHNICIANS'
      : department === 'UNIT6'
        ? 'TECHNICIAN TEAM'
        : 'ENGINEERING TEAM';
  const memberPlural = isPmContext
    ? 'managers'
    : department === 'LOG'
      ? 'logistics technicians'
      : department === 'UNIT6'
        ? 'technicians'
        : 'engineers';
  const addFirstLabel = isPmContext
    ? 'Manager'
    : department === 'LOG'
      ? 'Logistics Technician'
      : department === 'UNIT6'
        ? 'Technician'
        : 'Engineer';

  // Calculate monthly capacity (4.33 weeks per month average) — single pass
  const weeksPerMonth = 4.33;
  const capTotals = teamArray.reduce((acc, member) => {
    const c = meGetHoursPerWeek(member.hoursPerWeek) * ((member.utilisation || 80) / 100) * weeksPerMonth;
    acc.total += c;
    if ((member.group || '') === 'NPI') acc.npi += c;
    if ((member.group || '') === 'Production') acc.prod += c;
    return acc;
  }, { total: 0, npi: 0, prod: 0 });
  const totalCapacity = capTotals.total.toFixed(1);
  const npiCapacity = capTotals.npi.toFixed(1);
  const prodCapacity = capTotals.prod.toFixed(1);

  // Calculate holidays this month
  const today = new Date();
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const allHolidays = meDataGetHolidays();
  const holidays = typeof meFilterByDepartment === 'function'
    ? meFilterByDepartment(allHolidays, department, 'ME')
    : allHolidays;
  const holidaysThisMonth = holidays.filter(h => h.date.substring(0, 7) === thisMonth);
  const uniqueHolidayKeysThisMonth = new Set(
    holidaysThisMonth
      .map(h => `${h.personId || h.person_id || ''}|${h.date}`)
      .filter(key => !key.startsWith('|'))
  );

  const allTeam = typeof meDataGetTeam === 'function' ? meDataGetTeam() : teamArray;

  let rows = '';
  teamArray.forEach((member, idx) => {
    const globalIdx = allTeam.indexOf(member);
    const rowIndex = globalIdx >= 0 ? globalIdx : idx;
    const effective = (meGetHoursPerWeek(member.hoursPerWeek) * ((member.utilisation || 80) / 100)).toFixed(1);
    const groupOpts = '<option value="">—</option><option value="NPI" ' + ((member.group || '') === 'NPI' ? 'selected' : '') + '>NPI</option><option value="Production" ' + ((member.group || '') === 'Production' ? 'selected' : '') + '>Production</option>';
    rows += `
      <tr data-member-idx="${rowIndex}">
        <td><input name="cap_team_${rowIndex}_name" value="${esc(member.name)}" data-cap-action="cap-team-upd" data-field="name"></td>
        <td><input name="cap_team_${rowIndex}_jobTitle" value="${esc(member.jobTitle || '')}" data-cap-action="cap-team-upd" data-field="jobTitle"></td>
        <td><select name="cap_team_${rowIndex}_group" data-cap-action="cap-team-upd" data-field="group">${groupOpts}</select></td>
        <td><input name="cap_team_${rowIndex}_startDate" type="date" value="${member.startDate || ''}" data-cap-action="cap-team-upd" data-field="startDate"></td>
        <td><input name="cap_team_${rowIndex}_endDate" type="date" value="${member.endDate || ''}" data-cap-action="cap-team-upd" data-field="endDate"></td>
        <td><input name="cap_team_${rowIndex}_hoursPerWeek" type="number" value="${meGetHoursPerWeek(member.hoursPerWeek)}" min="1" max="80" step="0.5" data-cap-action="cap-team-upd" data-field="hoursPerWeek"></td>
        <td><input name="cap_team_${rowIndex}_utilisation" type="number" value="${member.utilisation || 80}" min="0" max="100" step="5" data-cap-action="cap-team-upd" data-field="utilisation"></td>
        <td style="font-weight: bold;">${effective}</td>
        <td style="text-align: center;">${canEdit() ? `<button class="me-del-btn" data-cap-action="cap-team-del">✕</button>` : ''}</td>
      </tr>`;
  });

  const monthLabel = meGetMonthLabel(thisMonth);

  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="me-kpi-strip">
        <div class="me-kpi" style="border-left: 4px solid var(--green);">
          <div class="me-kpi-value">${totalCapacity}</div>
          <div class="me-kpi-label">Total Availability</div>
          <div class="me-kpi-month">h/month</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--blue);">
          <div class="me-kpi-value">${npiCapacity}</div>
          <div class="me-kpi-label">NPI Group</div>
          <div class="me-kpi-month">h/month</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--amber);">
          <div class="me-kpi-value">${prodCapacity}</div>
          <div class="me-kpi-label">Production Group</div>
          <div class="me-kpi-month">h/month</div>
        </div>
        <div class="me-kpi" style="border-left: 4px solid var(--teal); cursor: pointer;" data-cap-action="cap-team-holidays">
          <div class="me-kpi-value">${uniqueHolidayKeysThisMonth.size}</div>
          <div class="me-kpi-label">Holidays This Month</div>
          <div class="me-kpi-month">${monthLabel}</div>
        </div>
      </div>

      <div class="me-card">
        <div class="me-card-head">
          <span class="me-card-title">${teamTitle}</span>
          <span style="font-size:12px;color:var(--muted)">${teamArray.length} ${memberPlural}</span>
        </div>
        <div class="me-card-body me-card-body-gutter">
          <div class="me-tbl-wrap">
            <table class="me-tbl">
              <thead><tr>
                <th style="width:120px">Name</th>
                <th style="width:110px">Job Title</th>
                <th style="width:100px">Group</th>
                <th style="width:100px">Start Date</th>
                <th style="width:100px">End Date</th>
                <th style="width:100px">Hours / Week</th>
                <th style="width:100px">Utilisation %</th>
                <th style="width:110px">Effective h/wk</th>
                <th style="width:36px"></th>
              </tr></thead>
              <tbody>
                ${rows || `<tr><td colspan="9"><div style="text-align:center;padding:40px">
                  <div style="color:var(--muted);margin-bottom:12px">No ${memberPlural} added yet</div>
                  ${canEdit() ? `<button class="btn btn-primary btn-sm" data-cap-action="cap-team-add">＋ Add First ${addFirstLabel}</button>` : ''}
                </div></td></tr>`}
              </tbody>
            </table>
          </div>
          ${canEdit() ? `<div class="me-add-row">
            <button class="btn btn-primary btn-sm" data-cap-action="cap-team-add">＋ Add ${addFirstLabel}</button>
          </div>` : ''}
        </div>
      </div>
    </div>`;
};
