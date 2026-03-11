/* ============================================================
   me-team.js — Team Tab Rendering
   ============================================================ */

window.meRenderTeamTab = function(teamArray) {
  // Calculate monthly capacity (4.33 weeks per month average)
  const weeksPerMonth = 4.33;
  const totalCapacity = teamArray.reduce((sum, member) => {
    const hours = (member.hoursPerWeek || 37.5) * ((member.utilisation || 80) / 100) * weeksPerMonth;
    return sum + hours;
  }, 0).toFixed(1);


  // Calculate holidays this month
  const today = new Date();
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const holidays = meDataGetHolidays();
  const holidaysThisMonth = holidays.filter(h => h.date.substring(0, 7) === thisMonth);

  let rows = '';
  teamArray.forEach((member, idx) => {
    const effective = ((member.hoursPerWeek || 37.5) * ((member.utilisation || 80) / 100)).toFixed(1);
    rows += `
      <tr>
        <td><input value="${esc(member.name)}" onchange="meDataUpdateTeam(${idx}, 'name', this.value); meDebouncedSave();"></td>
        <td><input value="${esc(member.jobTitle || '')}" onchange="meDataUpdateTeam(${idx}, 'jobTitle', this.value); meDebouncedSave();"></td>
        <td><input type="date" value="${member.startDate || ''}" onchange="meDataUpdateTeam(${idx}, 'startDate', this.value); meDebouncedSave();"></td>
        <td><input type="date" value="${member.endDate || ''}" onchange="meDataUpdateTeam(${idx}, 'endDate', this.value); meDebouncedSave();"></td>
        <td><input type="number" value="${member.hoursPerWeek || 37.5}" min="1" max="80" step="0.5" onchange="meDataUpdateTeam(${idx}, 'hoursPerWeek', this.value); meDebouncedSave();"></td>
        <td><input type="number" value="${member.utilisation || 80}" min="0" max="100" step="5" onchange="meDataUpdateTeam(${idx}, 'utilisation', this.value); meDebouncedSave();"></td>
        <td style="font-weight: bold;">${effective}</td>
        <td style="text-align: center;"><button class="me-del-btn" onclick="if(confirm('Delete engineer?')) { meDataDeleteTeam(${idx}); meOnSave(); meSetTab('team'); }">✕</button></td>
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
        <div class="me-kpi" style="border-left: 4px solid var(--teal); cursor: pointer;" onclick="meSetTab('holidays')">
          <div class="me-kpi-value">${holidaysThisMonth.length}</div>
          <div class="me-kpi-label">Holidays This Month</div>
          <div class="me-kpi-month">${monthLabel}</div>
        </div>
      </div>

      <div class="me-card">
        <div class="me-card-head">
          <span class="me-card-title">TEAM MEMBERS</span>
          <span style="font-size:12px;color:var(--muted)">${teamArray.length} engineers</span>
        </div>
        <div class="me-card-body">
          <div class="me-tbl-wrap">
            <table class="me-tbl">
              <thead><tr>
                <th style="width:120px">Name</th>
                <th style="width:110px">Job Title</th>
                <th style="width:100px">Start Date</th>
                <th style="width:100px">End Date</th>
                <th style="width:100px">Hours / Week</th>
                <th style="width:100px">Utilisation %</th>
                <th style="width:110px">Effective h/wk</th>
                <th style="width:36px"></th>
              </tr></thead>
              <tbody>
                ${rows || '<tr><td colspan="8"><div style="text-align:center;padding:40px;color:var(--muted)">No team members added</div></td></tr>'}
              </tbody>
            </table>
          </div>
          <div class="me-add-row">
            <button class="btn btn-primary btn-sm" onclick="meDataAddTeam('New Engineer', 37.5, 80); meOnSave(); meSetTab('team');">＋ Add Engineer</button>
          </div>
        </div>
      </div>
    </div>`;
};
