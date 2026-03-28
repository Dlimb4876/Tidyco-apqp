// render-scheduler.js
// Central deferred-render scheduler for all table-edit portals.
//
// API:
//   requestRender(key, options)   — request a render, deferring if user is editing
//   flushDeferred(key)            — immediately flush any pending render for a key
//
// options:
//   trigger      {string}    'realtime' | 'save'
//   renderNow    {Function}  called when it is safe to render; always pulls fresh data
//   isEditing    {boolean}   true when user has an inline cell active
//   isFiltering  {boolean}   true when a filter/search input has focus
//   debounceMs   {number}    coalescing window in ms (default 150)

'use strict';

(function () {
  // Internal state — keyed by portal key (e.g. 'me', 'pm', 'npi')
  // Entry shape: { trigger, renderNow, timer, pending }
  const _state = {};

  /**
   * Request a render for the given key.
   * If the user is editing or filtering, the render is deferred and a console
   * message is logged so the team can see what is waiting.
   */
  function requestRender(key, options) {
    const {
      trigger = 'realtime',
      renderNow,
      isEditing = false,
      isFiltering = false,
      debounceMs = 150,
    } = options;

    if (typeof renderNow !== 'function') {
      console.warn(`[Scheduler] requestRender("${key}"): renderNow must be a function`);
      return;
    }

    if (isEditing || isFiltering) {
      // Mark pending so focusout flush knows what to do
      if (!_state[key]) _state[key] = {};
      _state[key].pending = true;
      _state[key].trigger = trigger;
      _state[key].renderNow = renderNow;
      _state[key].debounceMs = debounceMs;

      const reason = isEditing ? 'you are editing this table' : 'a filter input has focus';
      console.debug(`[Scheduler] Render deferred (${trigger}) — ${reason} [key: ${key}]`);
      return;
    }

    // Not blocked — coalesce into a debounced render
    _scheduleRender(key, trigger, renderNow, debounceMs);
  }

  /**
   * Flush any pending deferred render for the given key immediately.
   * Typically called from a focusout handler.
   */
  function flushDeferred(key) {
    const entry = _state[key];
    if (!entry || !entry.pending) return;

    clearTimeout(entry.timer);
    entry.pending = false;

    const { trigger, renderNow, debounceMs } = entry;
    console.debug(`[Scheduler] Flushing deferred render (${trigger}) [key: ${key}]`);
    _scheduleRender(key, trigger, renderNow, debounceMs);
  }

  // ─── internal ────────────────────────────────────────────────────────────────

  function _scheduleRender(key, trigger, renderNow, debounceMs) {
    if (!_state[key]) _state[key] = {};
    // Keep renderNow fresh in case it changed between events
    _state[key].renderNow = renderNow;
    _state[key].trigger = trigger;

    clearTimeout(_state[key].timer);
    _state[key].timer = setTimeout(function () {
      try {
        renderNow();
      } catch (err) {
        console.error(`[Scheduler] renderNow threw for key "${key}":`, err);
      }
    }, debounceMs);
  }

  // ─── exports ─────────────────────────────────────────────────────────────────

  window.requestRender = requestRender;
  window.flushDeferred = flushDeferred;
})();
