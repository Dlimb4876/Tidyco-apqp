// ═══════════════════════════════════
// helpers.js — Escaping, UI utils, modal helpers, keyboard shortcuts,
//              context menus, toast notifications, and undo manager
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

// ── Toast Notifications ─────────────────────────────────────
/**
 * Show a non-blocking toast notification.
 * @param {string} message - Text to display
 * @param {'success'|'error'|'info'|'warning'} type - Visual style
 * @param {number} duration - Auto-dismiss after ms (default 3500)
 * @param {string} [actionHtml] - Optional pre-sanitized HTML for an action button area.
 *   IMPORTANT: This is inserted as raw HTML. Callers MUST ensure this string contains
 *   no user-supplied data or is properly sanitized to prevent XSS.
 */
function showToast(message, type = 'info', duration = 3500, actionHtml = '') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-msg">${esc(message)}</span>${actionHtml ? `<span class="toast-action">${actionHtml}</span>` : ''}`;
  container.appendChild(toast);

  // Trigger animation on next frame
  requestAnimationFrame(() => toast.classList.add('toast-show'));

  const dismiss = () => {
    toast.classList.remove('toast-show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  };

  const timer = duration > 0 ? setTimeout(dismiss, duration) : null;

  // Clicking the toast dismisses it immediately
  toast.addEventListener('click', () => {
    if (timer) clearTimeout(timer);
    dismiss();
  });

  return { dismiss };
}

// ── Keyboard Shortcuts Manager ──────────────────────────────
const KeyboardShortcuts = {
  handlers: {},

  register(combo, handler, description) {
    this.handlers[combo.toLowerCase()] = { handler, description };
  },

  init() {
    document.addEventListener('keydown', (e) => {
      // Skip when user is typing in an input
      if (isEditableElement(e.target)) return;

      const combo = this._buildCombo(e);
      const shortcut = this.handlers[combo];
      if (shortcut) {
        e.preventDefault();
        shortcut.handler();
      }
    });
  },

  _buildCombo(e) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  },

  getAll() {
    return Object.entries(this.handlers).map(([combo, { description }]) => ({ combo, description }));
  }
};

// ── Context Menu ────────────────────────────────────────────
const ContextMenu = {
  _menu: null,

  init() {
    this._menu = document.createElement('div');
    this._menu.className = 'context-menu';
    this._menu.id = 'globalContextMenu';
    document.body.appendChild(this._menu);

    document.addEventListener('click', () => this.hide());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.hide(); });
    document.addEventListener('contextmenu', (e) => this._handle(e));
  },

  _handle(e) {
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    e.preventDefault();
    const id = row.dataset.id;
    const actions = this._getActions(id, row);
    this.show(e.clientX, e.clientY, actions);
  },

  _getActions(id, row) {
    // Build context-aware actions based on closest table data attributes
    const table = row.closest('table, [data-context]');
    const context = table ? (table.dataset.context || '') : '';
    const actions = [];

    // Edit action — look for a visible edit button in the row
    const editBtn = row.querySelector('[data-action="edit"], [onclick*="Edit"], [onclick*="edit"]');
    if (editBtn) {
      actions.push({ label: 'Edit', icon: '✏️', action: () => editBtn.click() });
    }

    // Delete action — look for a visible delete button in the row
    const delBtn = row.querySelector('[data-action="delete"], [onclick*="Delete"], [onclick*="delete"]');
    if (delBtn) {
      actions.push({ label: 'Delete', icon: '🗑️', action: () => delBtn.click(), danger: true });
    }

    // Fallback: at least show a Copy ID option for debugging
    if (actions.length === 0) {
      actions.push({ label: 'Copy ID', icon: '📋', action: () => {
        if (navigator.clipboard) navigator.clipboard.writeText(id).catch(() => {});
      }});
    }

    return actions;
  },

  show(x, y, actions) {
    if (!this._menu) return;
    this._menu.innerHTML = actions.map(a => {
      const safeLabel = esc(a.label);
      const safeIcon = a.icon || '';
      return `<div class="context-menu-item${a.danger ? ' danger' : ''}">${safeIcon} ${safeLabel}</div>`;
    }).join('');

    // Attach click handlers
    const items = this._menu.querySelectorAll('.context-menu-item');
    items.forEach((el, i) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide();
        actions[i].action();
      });
    });

    this._menu.style.display = 'block';
    this._menu.style.left = x + 'px';
    this._menu.style.top = y + 'px';

    // Keep within viewport
    requestAnimationFrame(() => {
      const rect = this._menu.getBoundingClientRect();
      if (rect.right > window.innerWidth)  this._menu.style.left = (x - rect.width) + 'px';
      if (rect.bottom > window.innerHeight) this._menu.style.top = (y - rect.height) + 'px';
    });
  },

  hide() {
    if (this._menu) this._menu.style.display = 'none';
  }
};

// ── Undo Manager (soft-delete with 5-second restore window) ─
const UndoManager = {
  _queue: [],

  /**
   * Stage a deletion for soft-undo.
   * The actual delete is deferred 5 s; clicking Undo cancels it.
   * @param {string} label - Human-readable item name for the toast
   * @param {Function} deleteFn - Called after 5 s if not undone
   * @param {Function} restoreFn - Called immediately if undo is clicked
   */
  add(label, deleteFn, restoreFn) {
    const id = Date.now() + Math.random();
    const entry = { id, deleteFn, restoreFn, timer: null };

    entry.timer = setTimeout(() => {
      const idx = this._queue.findIndex(q => q.id === id);
      if (idx >= 0) {
        this._queue.splice(idx, 1);
        deleteFn();
      }
    }, 5000);

    this._queue.push(entry);

    showToast(
      `"${label}" deleted`,
      'info',
      5000,
      `<button class="toast-undo-btn" onclick="UndoManager.undo(${id})">Undo</button>`
    );
  },

  undo(id) {
    const idx = this._queue.findIndex(q => q.id === id);
    if (idx < 0) return;
    clearTimeout(this._queue[idx].timer);
    this._queue[idx].restoreFn();
    this._queue.splice(idx, 1);
    showToast('Restored', 'success', 2500);
  }
};

// ── Bulk Select / Multi-Select Manager ─────────────────────
/**
 * Lightweight utility to add bulk-select to any table.
 * Usage:
 *   BulkSelect.init('myTableId', { onDelete: (ids) => ..., onExport: (ids) => ... });
 *
 * Each data row must have:  <tr data-id="<id>">
 * The header row must have: <th class="bulk-th"></th>  (added by BulkSelect.headerCell())
 * Each data row must start: <td class="bulk-td"></td>  (added by BulkSelect.rowCell())
 */
const BulkSelect = {
  _handlers: {},

  /** Returns the <th> HTML to include as the first header cell. */
  headerCell() {
    return `<th class="bulk-th" style="width:32px;text-align:center"><input type="checkbox" class="bulk-select-all" onchange="BulkSelect._toggleAll(this)" title="Select all"></th>`;
  },

  /** Returns the <td> HTML to include as the first data cell for a row. */
  rowCell() {
    return `<td class="bulk-td" style="width:32px;text-align:center"><input type="checkbox" class="row-select" onchange="BulkSelect._onChange()"></td>`;
  },

  /**
   * Bind bulk-action handlers to a named context.
   * @param {string} context - Unique identifier (e.g. 'products', 'tasks')
   * @param {Object} handlers - { onDelete(ids), onExport(ids) }
   */
  bind(context, handlers) {
    this._handlers[context] = handlers;
  },

  _toggleAll(checkbox) {
    const table = checkbox.closest('table');
    if (!table) return;
    table.querySelectorAll('.row-select').forEach(cb => { cb.checked = checkbox.checked; });
    this._onChange();
  },

  _onChange() {
    const selected = [...document.querySelectorAll('.row-select:checked')];
    const toolbar = document.getElementById('bulkToolbar');
    if (!toolbar) return;

    if (selected.length > 0) {
      toolbar.classList.add('active');
      // Determine active context from toolbar data attribute (set when binding)
      const context = toolbar.dataset.context || '';
      const handlers = this._handlers[context] || {};
      toolbar.innerHTML = `
        <span class="bulk-count">${selected.length} selected</span>
        ${handlers.onDelete ? `<button class="btn btn-sm btn-danger" onclick="BulkSelect._execDelete()">🗑 Delete</button>` : ''}
        ${handlers.onExport ? `<button class="btn btn-sm btn-ghost" onclick="BulkSelect._execExport()">⬇ Export CSV</button>` : ''}
        <button class="btn btn-sm btn-ghost" onclick="BulkSelect.clearSelection()">✕ Clear</button>
      `;
    } else {
      toolbar.classList.remove('active');
    }
  },

  getSelectedIds() {
    return [...document.querySelectorAll('.row-select:checked')]
      .map(cb => cb.closest('tr')?.dataset.id)
      .filter(Boolean);
  },

  clearSelection() {
    document.querySelectorAll('.row-select, .bulk-select-all').forEach(cb => { cb.checked = false; });
    const toolbar = document.getElementById('bulkToolbar');
    if (toolbar) toolbar.classList.remove('active');
  },

  _execDelete() {
    const toolbar = document.getElementById('bulkToolbar');
    const context = toolbar?.dataset.context || '';
    const handlers = this._handlers[context] || {};
    if (!handlers.onDelete) return;
    const ids = this.getSelectedIds();
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} item(s)?`)) return;
    handlers.onDelete(ids);
    this.clearSelection();
  },

  _execExport() {
    const toolbar = document.getElementById('bulkToolbar');
    const context = toolbar?.dataset.context || '';
    const handlers = this._handlers[context] || {};
    if (!handlers.onExport) return;
    const ids = this.getSelectedIds();
    if (!ids.length) return;
    handlers.onExport(ids);
    this.clearSelection();
  }
};

/**
 * Export an array of objects to a CSV file download.
 * @param {Object[]} rows - Array of plain objects
 * @param {string} filename - Filename (without extension)
 */
function exportToCsv(rows, filename) {
  if (!rows || !rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(','),
    ...rows.map(r => keys.map(k => {
      const v = r[k] == null ? '' : String(r[k]).replace(/[\r\n]+/g, ' ');
      return '"' + v.replace(/"/g, '""') + '"';
    }).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename + '_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Real-time Granular Update Helper ───────────────────────
/**
 * Run an update function while preserving the scroll position.
 * @param {Function} updateFn - Function that modifies the DOM
 */
function preserveScrollDuringUpdate(updateFn) {
  const scrollEl = document.scrollingElement || document.documentElement;
  const scrollY = scrollEl ? scrollEl.scrollTop : 0;
  updateFn();
  requestAnimationFrame(() => {
    if (scrollEl) scrollEl.scrollTop = scrollY;
  });
}
