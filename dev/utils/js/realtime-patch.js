/**
 * Surgical Realtime DOM Patch Helpers
 *
 * Provides three patch functions used by all portals to update the DOM
 * in response to Supabase realtime events without replacing the entire list.
 *
 * Convention: every rendered item MUST carry data-id="{{record.id}}" on its
 * outermost element. This is the selector anchor for update/delete patches.
 */

/**
 * Patch an INSERT: prepend or append a new element into a container.
 *
 * @param {string} containerSelector  CSS selector for the list or tbody
 * @param {string} itemHTML           Rendered HTML for the new record
 * @param {object} [options]
 * @param {boolean} [options.prepend] true = prepend (newest-first lists), default false = append
 * @param {Function} [options.sortFn] optional — called with the container after insert so the
 *                                    caller can re-sort children (alpha-sorted lists)
 */
export function realtimePatchInsert(containerSelector, itemHTML, options = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const tmp = document.createElement('template');
  tmp.innerHTML = itemHTML.trim();
  const el = tmp.content.firstElementChild;
  if (!el) return;

  if (options.prepend) {
    container.prepend(el);
  } else {
    container.appendChild(el);
  }

  if (typeof options.sortFn === 'function') {
    options.sortFn(container);
  }
}

/**
 * Patch an UPDATE: find the element by data-id and swap its outerHTML.
 *
 * @param {string} containerSelector  CSS selector for the list or tbody
 * @param {string|number} recordId    The record's id value
 * @param {string} itemHTML           Rendered HTML for the updated record
 */
export function realtimePatchUpdate(containerSelector, recordId, itemHTML) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const safeId = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(String(recordId))
    : String(recordId).replace(/"/g, '\\"');
  const existing = container.querySelector(`[data-id="${safeId}"]`);
  if (!existing) return;

  const tmp = document.createElement('template');
  tmp.innerHTML = itemHTML.trim();
  const el = tmp.content.firstElementChild;
  if (!el) return;

  existing.replaceWith(el);
}

/**
 * Patch a DELETE: find the element by data-id and remove it.
 * Optionally calls onEmpty if the container becomes empty after removal.
 *
 * @param {string} containerSelector  CSS selector for the list or tbody
 * @param {string|number} recordId    The record's id value
 * @param {object} [options]
 * @param {Function} [options.onEmpty] called (with container) if list becomes empty after removal
 */
export function realtimePatchDelete(containerSelector, recordId, options = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const safeId = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(String(recordId))
    : String(recordId).replace(/"/g, '\\"');
  const existing = container.querySelector(`[data-id="${safeId}"]`);
  if (existing) existing.remove();

  if (typeof options.onEmpty === 'function' && container.children.length === 0) {
    options.onEmpty(container);
  }
}
