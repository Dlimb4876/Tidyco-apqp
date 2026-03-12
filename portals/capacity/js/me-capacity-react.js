/* ============================================================
   me-capacity-react.js — React Bridge Module
   Enables switching between vanilla JS and React ME Capacity
   ============================================================ */

let meReactEnabled = false;
let meReactRoot = null;

// ── Toggle between vanilla and React versions ────────────
window.toggleMeCapacityVersion = function() {
  meReactEnabled = !meReactEnabled;
  if (meReactEnabled) {
    renderMeCapacityReact();
  } else {
    renderMeCapacityVanilla();
  }
};

// ── Render vanilla JS version ──────────────────────────────
window.renderMeCapacityVanilla = function() {
  const mainContent = document.getElementById('mainContent');
  const reactRoot = document.getElementById('reactRoot');

  if (mainContent) mainContent.style.display = 'block';
  if (reactRoot) reactRoot.style.display = 'none';

  // Unmount React
  if (meReactRoot) {
    meReactRoot.unmount();
    meReactRoot = null;
  }

  meReactEnabled = false;
  render(); // Triggers normal vanilla JS render
};

// ── Render React version ───────────────────────────────────
window.renderMeCapacityReact = function() {
  const mainContent = document.getElementById('mainContent');
  const reactRoot = document.getElementById('reactRoot');

  if (mainContent) mainContent.style.display = 'none';
  if (reactRoot) reactRoot.style.display = 'block';

  // Mount React app
  if (typeof MeCapacityApp !== 'undefined') {
    const root = ReactDOM.createRoot(document.getElementById('reactRoot'));
    meReactRoot = root;
    root.render(React.createElement(window.MeCapacityApp));
  } else {
    console.warn('MeCapacityApp component not loaded yet');
  }

  meReactEnabled = true;
};

// ── Data access functions for React ────────────────────────
window.meFetchDataForReact = function() {
  return {
    team: typeof meDataGetTeam === 'function' ? meDataGetTeam() : [],
    tasks: typeof meDataGetTasks === 'function' ? meDataGetTasks() : [],
    products: typeof meDataGetProducts === 'function' ? meDataGetProducts() : [],
    holidays: typeof meDataGetHolidays === 'function' ? meDataGetHolidays() : []
  };
};

// ── Debounced save for React (reuse vanilla debounce) ──────
let meReactSaveTimer = null;
window.meReactSave = function() {
  clearTimeout(meReactSaveTimer);
  meReactSaveTimer = setTimeout(async () => {
    if (typeof meDataSave === 'function') {
      await meDataSave(false);
    }
  }, 900);
};

// ── Utility for HTML escaping ──────────────────────────────
window.escapeHtml = function(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

// ── Month utilities ────────────────────────────────────────
window.meGetMonthLabelReact = function(monthKey) {
  if (!monthKey) return ['Month', 'Label'];
  const [year, month] = monthKey.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return [monthNames[parseInt(month) - 1], year];
};

window.meGetMonthRangeReact = function(monthKey, count) {
  if (!monthKey) return [];
  const [year, month] = monthKey.split('-').map(Number);
  const result = [];
  let d = new Date(year, month - 1, 1);

  for (let i = 0; i < count; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    result.push(`${y}-${m}`);
    d.setMonth(d.getMonth() + 1);
  }

  return result;
};

window.meCalculateMonthDataReact = function(monthKey, teamArray, tasksArray, productsArray, holidaysArray) {
  if (!monthKey || !teamArray) {
    return { capacity: 0, totalDemand: 0, utilisation: 0 };
  }

  const [year, month] = monthKey.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // Calculate capacity from team
  let capacity = 0;
  if (Array.isArray(teamArray)) {
    teamArray.forEach(person => {
      if (!person.startDate || !person.hoursPerWeek) return;

      const personStart = new Date(person.startDate);
      const personEnd = person.endDate ? new Date(person.endDate) : new Date(2099, 11, 31);

      if (personStart <= endDate && personEnd >= startDate) {
        const weekCount = Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000));
        const hoursInMonth = person.hoursPerWeek * weekCount;

        // Apply holidays
        let holidayHours = 0;
        if (Array.isArray(holidaysArray)) {
          holidaysArray.forEach(h => {
            const hDate = new Date(h.date);
            if (hDate >= startDate && hDate <= endDate) {
              holidayHours += person.hoursPerWeek / 5; // Assuming 5-day work week
            }
          });
        }

        capacity += hoursInMonth - holidayHours;
      }
    });
  }

  // Calculate demand from tasks
  let totalDemand = 0;
  if (Array.isArray(tasksArray)) {
    tasksArray.forEach(task => {
      if (!task.startDate || !task.endDate || !task.totalHours) return;

      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);

      if (taskStart <= endDate && taskEnd >= startDate) {
        const daysInRange = Math.min(endDate, taskEnd) - Math.max(startDate, taskStart);
        const totalDays = taskEnd - taskStart || 1;
        const proportion = daysInRange / totalDays;
        totalDemand += task.totalHours * Math.max(0, Math.min(1, proportion));
      }
    });
  }

  const utilisation = capacity > 0 ? Math.round((totalDemand / capacity) * 100) : 0;

  return {
    capacity: Math.round(capacity * 10) / 10,
    totalDemand: Math.round(totalDemand * 10) / 10,
    utilisation: Math.min(999, utilisation)
  };
};
