function renderMeHolidaysView() {
  const teamOpts = db.me.team.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  
  const holsHtml = db.me.holidays.map(h => {
    const member = db.me.team.find(m => m.id === h.memberId)?.name || 'Unknown';
    return `
    <tr>
      <td>${member}</td>
      <td>${h.start}</td>
      <td>${h.end}</td>
      <td>${h.days} days</td>
      <td><button class="tbtn tbtn-ghost" onclick="delMeItem('holidays', '${h.id}')">✕</button></td>
    </tr>`;
  }).join('');

  return `
    <div class="me-card" style="max-width: 600px;">
      <h3>Book Holiday / Absence</h3>
      <div class="me-form-row">
        <select id="i_hol_mem">${teamOpts}</select>
        <input type="date" id="i_hol_start" title="Start Date">
        <input type="date" id="i_hol_end" title="End Date">
        <button class="btn btn-primary" onclick="addMeHoliday()">Log Absence</button>
      </div>
      <table class="me-table">
        <tr><th>Team Member</th><th>Start Date</th><th>End Date</th><th>Working Days Lost</th><th></th></tr>
        ${holsHtml}
      </table>
    </div>
  `;
}

function addMeHoliday() {
  const memberId = document.getElementById('i_hol_mem').value;
  const start = document.getElementById('i_hol_start').value;
  const end = document.getElementById('i_hol_end').value;
  if (!memberId || !start || !end) return alert('Fill all fields');

  // Calculate working days
  const days = meCalcWorkingDays(new Date(start), new Date(end));
  
  db.me.holidays.push({ id: crypto.randomUUID(), memberId, start, end, days });
  save(); setMeTab('holidays');
}

// Helper: Count Mon-Fri days between two dates inclusive
function meCalcWorkingDays(startDate, endDate) {
  let count = 0;
  let cur = new Date(startDate);
  while (cur <= endDate) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}
