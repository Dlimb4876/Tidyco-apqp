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
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'none';
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

function showModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}
// Helper to sort Process Flow steps by their step number
function sortedPfd(pfd) {
  return [...pfd].sort((a, b) => a.stepNum - b.stepNum);
}
// js/utils/helpers.js

/**
 * Shared utility to calculate RPN (Risk Priority Number).
 * Required by dashboard.js, apqp.js, and pfmea.js.
 */
function calcRPN(r) {
  return (r.sev || 1) * (r.occ || 1) * (r.det || 1);
}


function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
