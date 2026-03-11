export function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function emptyState(icon, title, desc) {
  return `<div class="empty"><div class="empty-icon">${icon}</div><div class="empty-title">${title}</div><div class="empty-desc">${desc}</div></div>`;
}

export function closeModal(id) {
  document.getElementById(id).style.display = 'none';
  // Note: These global variables will need to be imported or updated via setters
  // Since this is a utility file, it might be better to pass the reset logic as a callback or handle it in the caller.
  // For now, we'll keep it simple and assume the caller handles specific state resets if needed, 
  // or we can import the setters here.
}

export function showModal(id)  { document.getElementById(id).style.display = 'flex'; }

export function sortedPfd(pfd) {
  return [...pfd].sort((a, b) => a.stepNum - b.stepNum);
}

export function calcRPN(r) {
  return (r.sev || 1) * (r.occ || 1) * (r.det || 1);
}

export function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
