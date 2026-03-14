/* ============================================================
   me-team.js — Team Tab Rendering
   ============================================================ */

window.meRenderTeamTab = function(teamArray) {
  const department = typeof meGetDepartmentFromContext === 'function'
    ? meGetDepartmentFromContext()
    : 'ME';
  const isPmContext = department === 'PM';

  // Calculate monthly capacity (4.33 weeks per month average)
  const weeksPerMonth = 4.33;
  const totalCapacity = teamArray.reduce((sum, member) => {
    const hours = meGetHoursPerWeek(member.hoursPerWeek) * ((member.utilisation || 80) / 100) * weeksPerMonth;
    return sum + hours;
  }, 0).toFixed(1);

  // Calculate group availability
  const npiCapacity = teamArray.filter(m => (m.group || '') === 'NPI').reduce((sum, m) => sum + (meGetHoursPerWeek(m.hoursPerWeek) * ((m.utilisation || 80) / 100) * weeksPerMonth), 0).toFixed(1);
  const prodCapacity = teamArray.filter(m => (m.group || '') === 'Production').reduce((sum, m) => sum + (meGetHoursPerWeek(m.hoursPerWeek) * ((m.utilisation || 80) / 100) * weeksPerMonth), 0).toFixed(1);

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
        <td><input value="${esc(member.name)}" data-cap-action="cap-team-upd" data-field="name"></td>
        <td><input value="${esc(member.jobTitle || '')}" data-cap-action="cap-team-upd" data-field="jobTitle"></td>
        <td><select data-cap-action="cap-team-upd" data-field="group">${groupOpts}</select></td>
        <td><input type="date" value="${member.startDate || ''}" data-cap-action="cap-team-upd" data-field="startDate"></td>
        <td><input type="date" value="${member.endDate || ''}" data-cap-action="cap-team-upd" data-field="endDate"></td>
        <td><input type="number" value="${meGetHoursPerWeek(member.hoursPerWeek)}" min="1" max="80" step="0.5" data-cap-action="cap-team-upd" data-field="hoursPerWeek"></td>
        <td><input type="number" value="${member.utilisation || 80}" min="0" max="100" step="5" data-cap-action="cap-team-upd" data-field="utilisation"></td>
        <td style="font-weight: bold;">${effective}</td>
        <td style="text-align: center;"><button class="me-del-btn" data-cap-action="cap-team-del">✕</button></td>
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
          <span class="me-card-title">${isPmContext ? 'PM TEAM' : 'ENGINEERING TEAM'}</span>
          <span style="font-size:12px;color:var(--muted)">${teamArray.length} ${isPmContext ? 'managers' : 'engineers'}</span>
        </div>
        <div class="me-card-body">
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
                  <div style="color:var(--muted);margin-bottom:12px">No ${isPmContext ? 'managers' : 'engineers'} added yet</div>
                  <button class="btn btn-primary btn-sm" data-cap-action="cap-team-add">＋ Add First ${isPmContext ? 'Manager' : 'Engineer'}</button>
                </div></td></tr>`}
              </tbody>
            </table>
          </div>
          <div class="me-add-row">
            <button class="btn btn-primary btn-sm" data-cap-action="cap-team-add">＋ Add ${isPmContext ? 'Manager' : 'Engineer'}</button>
          </div>
        </div>
      </div>
    </div>`;
};
