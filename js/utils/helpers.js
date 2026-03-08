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

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
  // Clear picker state to prevent carry-over between opens
  if (id === 'modalCtqPick') {
    ctqPickTarget = null;
    ctqPickSelected = [];
  } else if (id === 'modalBomPick') {
    bomPickTarget = null;
    bomPickSelected = [];
    bomPickFilter = 'all';
  } else if (id === 'modalKitPick') {
    kitPickTarget = null;
    kitPickSelected = [];
    kitPickFilter = 'all';
  }
}

function showModal(id)  { document.getElementById(id).style.display = 'flex'; }
