// ═══════════════════════════════════
// helpers.js — Escaping, UI utils, and modal helpers
// ═══════════════════════════════════

// ── Permission helpers ─────────────────────────────────────────
// Returns true if the current user can create, edit, or delete data.
// Admins and editors can edit; viewers are read-only.
function canEdit() {
  return currentUserRole === 'admin' || currentUserRole === 'editor';
}

// Returns true only for admin users (e.g. role management in Settings).
function isAdmin() {
  return currentUserRole === 'admin';
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
  if (!el) return;
  el.style.display = 'flex';
  // 1.1 Auto-focus first input in modal
  setTimeout(() => {
    const firstInput = el.querySelector('input:not([type="hidden"]), select, textarea');
    if (firstInput) firstInput.focus();
  }, 50);
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

// ── 1.3 Toast Notifications ───────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${esc(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── 1.10 Keyboard Shortcuts ───────────────────────────────────
function isInputFocused() {
  const active = document.activeElement;
  return active && (
    active.tagName === 'INPUT' ||
    active.tagName === 'TEXTAREA' ||
    active.tagName === 'SELECT' ||
    active.isContentEditable
  );
}

document.addEventListener('keydown', function(e) {
  if ((e.key === '?' && !isInputFocused()) ||
      (e.ctrlKey && e.key === '/')) {
    e.preventDefault();
    showModal('shortcutsModal');
  }
});

// ── 1.11 Smart Date Entry Helper ──────────────────────────────
function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

function parseSmartDate(input) {
  if (!input) return null;
  const today = new Date();
  const lower = input.toLowerCase().trim();

  if (lower === 'today') return formatDateISO(today);
  if (lower === 'tomorrow') {
    const t = new Date(today);
    t.setDate(t.getDate() + 1);
    return formatDateISO(t);
  }
  if (lower === 'next week') {
    const t = new Date(today);
    t.setDate(t.getDate() + 7);
    return formatDateISO(t);
  }

  const relMatch = lower.match(/^\+(\d+)(d|w|m)$/);
  if (relMatch) {
    const num = parseInt(relMatch[1]);
    const unit = relMatch[2];
    const t = new Date(today);
    if (unit === 'd') t.setDate(t.getDate() + num);
    if (unit === 'w') t.setDate(t.getDate() + num * 7);
    if (unit === 'm') t.setMonth(t.getMonth() + num);
    return formatDateISO(t);
  }

  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayIdx = days.indexOf(lower);
  if (dayIdx >= 0) {
    const t = new Date(today);
    const currentDay = t.getDay();
    const daysUntil = (dayIdx - currentDay + 7) % 7 || 7;
    t.setDate(t.getDate() + daysUntil);
    return formatDateISO(t);
  }

  return null;
}

function setupSmartDateInputs() {
  document.querySelectorAll('input[type="date"]').forEach(input => {
    if (input.hasAttribute('data-smart-date')) return;
    input.setAttribute('data-smart-date', '');
    input.addEventListener('blur', (e) => {
      const parsed = parseSmartDate(e.target.value);
      if (parsed) {
        e.target.value = parsed;
        e.target.style.backgroundColor = '#ecfdf5';
        setTimeout(() => { e.target.style.backgroundColor = ''; }, 1000);
      }
    });
  });
}

// ── Focus Guard Helper for Inline Editing ─────────────────────
/**
 * Returns true if the user's focus is currently inside a table cell
 * (any input, select, or textarea inside a <table> element).
 * Used by focus-guard logic to defer re-renders that would eject cursor.
 */
function isEditingInlineCell() {
  const active = document.activeElement;
  if (!active || active === document.body) return false;
  const tag = active.tagName;
  return (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA')
    && !!active.closest('table');
}
