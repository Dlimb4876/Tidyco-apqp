// ═══════════════════════════════════
// helpers.js — Escaping, UI utils, and modal helpers
// ═══════════════════════════════════

function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function emptyState(icon, title, desc) {
  return `<div class="empty"><div class="empty-icon">${icon}</div><div class="empty-title">${title}</div><div class="empty-desc">${desc}</div></div>`;
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function showModal(id)  { document.getElementById(id).style.display = 'flex'; }
