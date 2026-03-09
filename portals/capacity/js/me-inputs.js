function renderMeInputsView() {
  // Render Team List
  const teamHtml = db.me.team.map(t => `
    <tr>
      <td>${t.name}</td>
      <td>${t.hours}h</td>
      <td>${t.utilisation}%</td>
      <td>${(t.hours * (t.utilisation/100)).toFixed(1)}h</td>
      <td><button class="tbtn tbtn-ghost" onclick="delMeItem('team', '${t.id}')">✕</button></td>
    </tr>`).join('');

  // Render Tasks List
  const tasksHtml = db.me.tasks.map(t => {
    const assignee = db.me.team.find(m => m.id === t.memberId)?.name || 'Unassigned';
    return `
    <tr>
      <td>${t.name}</td>
      <td><span class="me-badge me-${t.category.toLowerCase()}">${t.category}</span></td>
      <td>${assignee}</td>
      <td>${t.start} to ${t.end}</td>
      <td>${t.totalHours}h</td>
      <td><button class="tbtn tbtn-ghost" onclick="delMeItem('tasks', '${t.id}')">✕</button></td>
    </tr>`;
  }).join('');

  // Render Products List
  const prodHtml = db.me.products.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.start} to ${p.end}</td>
      <td>${p.supportHours}h/wk</td>
      <td><button class="tbtn tbtn-ghost" onclick="delMeItem('products', '${p.id}')">✕</button></td>
    </tr>`).join('');

  const teamOpts = db.me.team.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

  return `
    <div class="me-grid-2">
      <div class="me-card">
        <h3>Team Members</h3>
        <div class="me-form-row">
          <input type="text" id="i_tm_name" placeholder="Name">
          <input type="number" id="i_tm_hrs" placeholder="Hrs/Wk" value="37.5" style="width:80px">
          <input type="number" id="i_tm_util" placeholder="Util %" value="80" style="width:80px">
          <button class="btn btn-primary" onclick="addMeTeam()">Add</button>
        </div>
        <table class="me-table">
          <tr><th>Name</th><th>Base Hrs</th><th>Util %</th><th>Effective</th><th></th></tr>
          ${teamHtml}
        </table>
      </div>

      <div class="me-card">
        <h3>Products (Support)</h3>
        <div class="me-form-row">
          <input type="text" id="i_pr_name" placeholder="Product Name">
          <input type="date" id="i_pr_start" title="Start Date">
          <input type="date" id="i_pr_end" title="End Date">
          <input type="number" id="i_pr_hrs" placeholder="Hrs/Wk" value="5" style="width:80px">
          <button class="btn btn-primary" onclick="addMeProduct()">Add</button>
        </div>
        <table class="me-table">
          <tr><th>Product</th><th>Timeline</th><th>Support Load</th><th></th></tr>
          ${prodHtml}
        </table>
      </div>
    </div>

    <div class="me-card">
      <h3>Project Tasks</h3>
      <div class="me-form-row">
        <input type="text" id="i_tk_name" placeholder="Task Name" style="flex:2">
        <select id="i_tk_cat">
          <option value="NPI">NPI</option>
          <option value="Improvement">Improvement</option>
          <option value="Tendering">Tendering</option>
          <option value="Other">Other</option>
        </select>
        <select id="i_tk_mem"><option value="">Unassigned</option>${teamOpts}</select>
        <input type="date" id="i_tk_start" title="Start">
        <input type="date" id="i_tk_end" title="End">
        <input type="number" id="i_tk_hrs" placeholder="Total Hrs" style="width:90px">
        <button class="btn btn-primary" onclick="addMeTask()">Add</button>
      </div>
      <table class="me-table">
        <tr><th>Task</th><th>Category</th><th>Assignee</th><th>Timeline</th><th>Total Load</th><th></th></tr>
        ${tasksHtml}
      </table>
    </div>
  `;
}

function addMeTeam() {
  const name = document.getElementById('i_tm_name').value;
  const hours = parseFloat(document.getElementById('i_tm_hrs').value);
  const utilisation = parseFloat(document.getElementById('i_tm_util').value);
  if (!name) return alert('Enter a name');
  db.me.team.push({ id: crypto.randomUUID(), name, hours, utilisation });
  save(); setMeTab('inputs');
}

function addMeTask() {
  const name = document.getElementById('i_tk_name').value;
  const category = document.getElementById('i_tk_cat').value;
  const memberId = document.getElementById('i_tk_mem').value;
  const start = document.getElementById('i_tk_start').value;
  const end = document.getElementById('i_tk_end').value;
  const totalHours = parseFloat(document.getElementById('i_tk_hrs').value);
  if (!name || !start || !end || !totalHours) return alert('Fill all task fields');
  db.me.tasks.push({ id: crypto.randomUUID(), name, category, memberId, start, end, totalHours });
  save(); setMeTab('inputs');
}

function addMeProduct() {
  const name = document.getElementById('i_pr_name').value;
  const start = document.getElementById('i_pr_start').value;
  const end = document.getElementById('i_pr_end').value;
  const supportHours = parseFloat(document.getElementById('i_pr_hrs').value);
  if (!name || !start || !end || !supportHours) return alert('Fill all product fields');
  db.me.products.push({ id: crypto.randomUUID(), name, start, end, supportHours });
  save(); setMeTab('inputs');
}

function delMeItem(collection, id) {
  db.me[collection] = db.me[collection].filter(i => i.id !== id);
  save();
  // refresh current tab
  document.getElementById('mainContent').innerHTML = renderMeCapacity();
}
