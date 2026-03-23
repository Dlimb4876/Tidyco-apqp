/* ============================================================
   capacity-events.js — Delegated UI event router for Capacity portal
   Handles click, change and input events via data-cap-action attributes.
   Depends on: capacity.js, me-*.js, prod-capacity-*.js, pm-capacity.js
   ============================================================ */

let _capEventsContainer = null

function capActionTarget(evt) {
  return evt && evt.target ? evt.target.closest('[data-cap-action]') : null
}

function capNum(v, fallback) {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : fallback
}

// Determine ME vs PM context from data-cap-context ancestor
function capIsPM(el) {
  const ctx = el.closest('[data-cap-context]')
  return ctx ? ctx.getAttribute('data-cap-context') === 'pm' : false
}

// Return the task-filters state object for the current ME or PM context.
function capTaskFilters(isPM) {
  return isPM ? window.pmTasksFilters : window.meTasksFilters
}

// Re-render the tasks tab for the current ME or PM context.
function capTaskRefresh(isPM) {
  if (isPM && typeof pmSetTab === 'function') pmSetTab('tasks')
  else meSetTab('tasks')
}

function capPreserveSearchContinuity(inputEl, replacementSelector, rerenderFn) {
  const contextRoot = inputEl && typeof inputEl.closest === 'function'
    ? inputEl.closest('[data-cap-context]')
    : null
  const contextType = contextRoot ? contextRoot.getAttribute('data-cap-context') : ''

  if (typeof preserveInputCaretAfterRender === 'function') {
    preserveInputCaretAfterRender(inputEl, rerenderFn, {
      replacementSelector,
      scopeResolver: function() {
        return contextType
          ? document.querySelector('[data-cap-context="' + contextType + '"]')
          : document
      }
    })
    return
  }

  const caretStart = inputEl && typeof inputEl.selectionStart === 'number' ? inputEl.selectionStart : null
  const caretEnd = inputEl && typeof inputEl.selectionEnd === 'number' ? inputEl.selectionEnd : caretStart
  rerenderFn()
  setTimeout(function() {
    const scope = contextType
      ? document.querySelector('[data-cap-context="' + contextType + '"]')
      : document
    const replacement = scope && typeof scope.querySelector === 'function'
      ? scope.querySelector(replacementSelector)
      : null
    if (!replacement) return

    replacement.focus()
    if (caretStart !== null && typeof replacement.setSelectionRange === 'function') {
      const len = (replacement.value || '').length
      const start = Math.min(caretStart, len)
      const end = Math.min(caretEnd === null ? start : caretEnd, len)
      replacement.setSelectionRange(start, end)
    }
  }, 0)
}

window.capacityEvents = {}

window.capacityEvents.setup = function() {
  const container = document.getElementById('mainContent')
  if (!container) return
  if (_capEventsContainer === container) return
  if (_capEventsContainer) window.capacityEvents.teardown()

  container.addEventListener('click', window.capacityEvents._onClick)
  container.addEventListener('change', window.capacityEvents._onChange)
  container.addEventListener('input', window.capacityEvents._onInput)
  container.addEventListener('keydown', window.capacityEvents._onKeydown)
  container.addEventListener('focusout', window.capacityEvents._onFocusOut)
  _capEventsContainer = container
}

window.capacityEvents.teardown = function() {
  if (!_capEventsContainer) return
  _capEventsContainer.removeEventListener('click', window.capacityEvents._onClick)
  _capEventsContainer.removeEventListener('change', window.capacityEvents._onChange)
  _capEventsContainer.removeEventListener('input', window.capacityEvents._onInput)
  _capEventsContainer.removeEventListener('keydown', window.capacityEvents._onKeydown)
  _capEventsContainer.removeEventListener('focusout', window.capacityEvents._onFocusOut)
  _capEventsContainer = null
}

window.capacityEvents._onClick = function(evt) {
  const el = capActionTarget(evt)
  if (!el) return
  const action = el.getAttribute('data-cap-action')
  const isPM = capIsPM(el)

  switch (action) {
  // ── Navigation ─────────────────────────────────────────────
  case 'cap-nav-hub': navigate('hub'); break
  case 'cap-nav-production-schedule': navigate('production'); setProductionTab('scheduling'); break
  case 'cap-set-tab': setCapacityTab(el.getAttribute('data-tab')); break

  // ── ME tabs ────────────────────────────────────────────────
  case 'cap-me-set-tab': meSetTab(el.getAttribute('data-tab')); break
  case 'cap-me-back': setCapacityTab('root'); break
  case 'cap-me-prev-month': meOnPrevMonth(); break
  case 'cap-me-next-month': meOnNextMonth(); break
  case 'cap-me-today': if (typeof meOnTodayClick === 'function') meOnTodayClick(); break
  case 'cap-me-toggle-holiday': meToggleHoliday(el.getAttribute('data-member-id'), el.getAttribute('data-date')); break
  case 'cap-me-heatmap-open': meOpenHeatmapDetail(el.getAttribute('data-member-id'), el.getAttribute('data-start'), el.getAttribute('data-end')); break
  case 'cap-me-heatmap-close': meCloseHeatmapDetail(); break

  // ── ME Team ────────────────────────────────────────────────
  case 'cap-team-del': {
    const row = el.closest('[data-member-idx]')
    const idx = capNum(row?.getAttribute('data-member-idx'), -1)
    if (idx < 0) break
    if (confirm('Delete team member?')) { meDataDeleteTeam(idx); meOnSave(); meSetTab('team') }
    break
  }
  case 'cap-team-add': {
    const department = window.meCurrentDepartmentContext || 'ME'
    const label = isPM
      ? 'New PM Manager'
      : department === 'LOG'
        ? 'New Logistics Technician'
        : department === 'UNIT6'
          ? 'New Technician'
          : 'New Engineer'
    meDataAddTeam(label, ME_DEFAULT_HOURS_PER_WEEK, 80); meOnSave(); meSetTab('team')
    break
  }
  case 'cap-team-holidays': meSetTab('holidays'); break

  // ── ME Tasks ──────────────────────────────────────────────
  case 'cap-task-del': {
    const idx = capNum(el.closest('[data-task-idx]')?.getAttribute('data-task-idx'), -1)
    if (idx < 0) break
    if (confirm('Delete task?')) {
      meDataDeleteTask(idx); meOnSave()
      capTaskRefresh(isPM)
    }
    break
  }
  case 'cap-task-add': if (typeof meAddDefaultTask === 'function') meAddDefaultTask(); break
  case 'cap-task-sort': {
    const key = el.getAttribute('data-sort-key')
    if (typeof meTasksSortBy === 'function') meTasksSortBy(key, isPM)
    break
  }
  case 'cap-task-clear-search': {
    const f = capTaskFilters(isPM)
    if (f) f.search = ''
    const inp = document.querySelector('.me-filter-input')
    if (inp) inp.value = ''
    capTaskRefresh(isPM)
    break
  }
  case 'cap-task-clear-category': {
    const f = capTaskFilters(isPM)
    if (f) f.category = 'all'
    capTaskRefresh(isPM)
    break
  }
  case 'cap-task-clear-assignee': {
    const f = capTaskFilters(isPM)
    if (f) f.assignee = 'all'
    capTaskRefresh(isPM)
    break
  }
  case 'cap-task-clear-product': {
    const f = capTaskFilters(isPM)
    if (f) f.product = 'all'
    capTaskRefresh(isPM)
    break
  }
  case 'cap-task-clear-month': {
    const f = capTaskFilters(isPM)
    if (f) f.month = 'all'
    capTaskRefresh(isPM)
    break
  }
  case 'cap-task-toggle-hide-completed': {
    const f = capTaskFilters(isPM)
    const storageKey = isPM ? 'pmTasksHideCompleted' : 'meTasksHideCompleted'
    if (f) {
      f.hideCompleted = !f.hideCompleted
      localStorage.setItem(storageKey, f.hideCompleted)
    }
    capTaskRefresh(isPM)
    break
  }
  case 'cap-task-clear-all-filters': {
    const f = capTaskFilters(isPM)
    const storageKey = isPM ? 'pmTasksHideCompleted' : 'meTasksHideCompleted'
    const hideVal = f ? f.hideCompleted : false
    if (f) {
      Object.assign(f, { search: '', category: 'all', assignee: 'all', product: 'all', month: 'all', hideCompleted: hideVal })
    }
    capTaskRefresh(isPM)
    break
  }

  // ── ME Products ───────────────────────────────────────────
  case 'cap-products-apply-hours': {
    const row = el.closest('[data-product-idx]')
    const idx = capNum(row?.getAttribute('data-product-idx'), -1)
    if (idx < 0) break

    const hoursEl = row?.querySelector('input[data-field="hoursPerWeek"]')
    const kittingEl = row?.querySelector('input[data-field="kittingHours"]')
    const bookingInOutEl = row?.querySelector('input[data-field="bookingInOutHours"]')
    const movementEl = row?.querySelector('input[data-field="productMovementHours"]')
    const effectiveDateEl = row?.querySelector('input[data-field="supportEffectiveDate"]')
    const reasonEl = row?.querySelector('input[data-field="supportChangeReason"]')
    const hasSplitFields = !!kittingEl || !!bookingInOutEl || !!movementEl
    const kittingValue = kittingEl ? Number(kittingEl.value) : 0
    const bookingInOutValue = bookingInOutEl ? Number(bookingInOutEl.value) : 0
    const movementValue = movementEl ? Number(movementEl.value) : 0
    const hoursValue = hasSplitFields
      ? ((Number.isFinite(kittingValue) ? kittingValue : NaN) + (Number.isFinite(bookingInOutValue) ? bookingInOutValue : NaN) + (Number.isFinite(movementValue) ? movementValue : NaN))
      : (hoursEl ? Number(hoursEl.value) : NaN)
    const effectiveDate = (effectiveDateEl?.value || '').trim()
    const changeReason = (reasonEl?.value || '').trim()

    if (hasSplitFields && (!Number.isFinite(kittingValue) || kittingValue < 0 || !Number.isFinite(bookingInOutValue) || bookingInOutValue < 0 || !Number.isFinite(movementValue) || movementValue < 0)) {
      alert('Enter valid non-negative values for Kitting, Booking In/Out, and Product Movement before applying.')
      if (kittingEl && (!Number.isFinite(kittingValue) || kittingValue < 0)) kittingEl.focus()
      else if (bookingInOutEl && (!Number.isFinite(bookingInOutValue) || bookingInOutValue < 0)) bookingInOutEl.focus()
      else if (movementEl) movementEl.focus()
      break
    }

    if (!Number.isFinite(hoursValue) || hoursValue < 0) {
      alert('Enter a valid Hours/Batch value before applying.')
      if (hoursEl) hoursEl.focus()
      break
    }

    if (!effectiveDate) {
      alert('Choose an Effective Date before applying the support change.')
      if (effectiveDateEl) effectiveDateEl.focus()
      break
    }

    if (changeReason.length < 3) {
      alert('Add a short reason so this change is intentional and traceable.')
      if (reasonEl) reasonEl.focus()
      break
    }

    const products = typeof meDataGetProducts === 'function' ? meDataGetProducts() : []
    const product = products[idx]
    const currentEffectiveDate = (product && product.supportEffectiveDate) ? String(product.supportEffectiveDate) : ''

    if (currentEffectiveDate && effectiveDate < currentEffectiveDate) {
      const confirmBackdate = confirm('You are backdating this support change before the current effective date. Continue intentionally?')
      if (!confirmBackdate) break
    }

    meDataUpdateProduct(idx, 'hoursPerWeek', String(hoursValue), {
      effectiveDate,
      changeReason,
      kittingHours: hasSplitFields ? kittingValue : undefined,
      bookingInOutHours: hasSplitFields ? bookingInOutValue : undefined,
      productMovementHours: hasSplitFields ? movementValue : undefined
    })

    if (typeof meRefreshCurrentTab === 'function') meRefreshCurrentTab()
    meDebouncedSave()
    break
  }
  case 'cap-products-toggle-history': {
    if (typeof meProductsToggleHistory === 'function') {
      meProductsToggleHistory(el.getAttribute('data-product-id'), el.getAttribute('data-dept'))
    }
    break
  }
  case 'cap-products-sort-dir': if (typeof meProductsToggleSortDir === 'function') meProductsToggleSortDir(el.getAttribute('data-dept')); break
  case 'cap-products-clear-filters': if (typeof meProductsClearFilters === 'function') meProductsClearFilters(el.getAttribute('data-dept')); break

  // ── ME Product Taskload ───────────────────────────────────
  case 'cap-product-load-sort-dir': if (typeof meProductLoadToggleSortDir === 'function') meProductLoadToggleSortDir(el.getAttribute('data-dept')); break
  case 'cap-product-load-clear-filters': if (typeof meProductLoadClearFilters === 'function') meProductLoadClearFilters(el.getAttribute('data-dept')); break

  // ── PM Capacity ───────────────────────────────────────────
  case 'cap-pm-set-tab': if (typeof pmSetTab === 'function') pmSetTab(el.getAttribute('data-tab')); break
  case 'cap-pm-back': setCapacityTab('root'); break

  // ── Logistics Capacity ────────────────────────────────────
  case 'cap-log-set-tab': if (typeof logSetTab === 'function') logSetTab(el.getAttribute('data-tab')); break
  case 'cap-log-back': setCapacityTab('root'); break

  // ── Unit 6 Capacity ───────────────────────────────────────
  case 'cap-unit6-set-tab': if (typeof unit6SetTab === 'function') unit6SetTab(el.getAttribute('data-tab')); break
  case 'cap-unit6-back': setCapacityTab('root'); break

  // ── Production Capacity ───────────────────────────────────
  case 'cap-prod-set-tab': if (typeof setProdCapTab === 'function') setProdCapTab(el.getAttribute('data-tab')); break
  case 'cap-prod-back': setCapacityTab('root'); break
  case 'cap-prod-open-schedule': navigate('production'); setProductionTab('scheduling'); break
  case 'cap-prod-prev-month': if (typeof prodCapShiftMonth === 'function') prodCapShiftMonth('prev'); break
  case 'cap-prod-next-month': if (typeof prodCapShiftMonth === 'function') prodCapShiftMonth('next'); break
  case 'cap-prod-reset-month': if (typeof prodCapResetMonthOffset === 'function') prodCapResetMonthOffset(); break
  case 'cap-prod-capacity-help': {
    if (typeof showModal === 'function') showModal('modalProdCapacityFormula')
    break
  }
  case 'cap-prod-set-workarea': {
    const wa = el.getAttribute('data-workarea')
    if (typeof window.prodCapSetWorkArea === 'function') {
      window.prodCapSetWorkArea(wa)
      render()
    } else if (typeof prodCapWorkAreaSelected !== 'undefined') {
      prodCapWorkAreaSelected = wa
      render()
    }
    break
  }
  case 'cap-prod-settings-fill-forward': if (typeof prodCapSettingsFillForward === 'function') prodCapSettingsFillForward(); break
  case 'cap-prod-settings-clear-all': if (typeof prodCapSettingsClearAll === 'function') prodCapSettingsClearAll(); break

  default: break
  }
}

window.capacityEvents._onChange = function(evt) {
  const el = capActionTarget(evt)
  if (!el) return
  const action = el.getAttribute('data-cap-action')
  const isPM = capIsPM(el)

  switch (action) {
  // ── ME month change ────────────────────────────────────────
  case 'cap-me-month-change': if (typeof meOnMonthChange === 'function') meOnMonthChange(el.value); break

  // ── ME Team update ────────────────────────────────────────
  case 'cap-team-upd': {
    const row = el.closest('[data-member-idx]')
    const idx = capNum(row?.getAttribute('data-member-idx'), -1)
    if (idx < 0) break
    const field = el.getAttribute('data-field')
    meDataUpdateTeam(idx, field, el.value)
    meDebouncedSave()
    break
  }

  // ── ME Tasks update ───────────────────────────────────────
  case 'cap-task-upd': {
    const row = el.closest('[data-task-idx]')
    const idx = capNum(row?.getAttribute('data-task-idx'), -1)
    if (idx < 0) break
    const field = el.getAttribute('data-field')
    meDataUpdateTask(idx, field, el.value)
    if (isPM && typeof pmDebouncedSave === 'function') pmDebouncedSave()
    else meDebouncedSave()
    break
  }
  case 'cap-task-status-upd': {
    const row = el.closest('[data-task-idx]')
    const idx = capNum(row?.getAttribute('data-task-idx'), -1)
    if (idx < 0) break
    meDataUpdateTask(idx, 'status', el.value)
    if (isPM && typeof pmDebouncedSave === 'function') pmDebouncedSave()
    else meDebouncedSave()
    // Do NOT immediately call meSetTab/pmSetTab — the debounce and blur handler
    // will re-render at the right time, preserving focus.
    break
  }
  case 'cap-task-filter-category': {
    const f = capTaskFilters(isPM)
    if (f) f.category = el.value
    capTaskRefresh(isPM)
    break
  }
  case 'cap-task-filter-assignee': {
    const f = capTaskFilters(isPM)
    if (f) f.assignee = el.value
    capTaskRefresh(isPM)
    break
  }
  case 'cap-task-filter-product': {
    const f = capTaskFilters(isPM)
    if (f) f.product = el.value
    capTaskRefresh(isPM)
    break
  }
  case 'cap-task-filter-month': {
    const f = capTaskFilters(isPM)
    if (f) f.month = el.value
    capTaskRefresh(isPM)
    break
  }

  // ── ME Products update ────────────────────────────────────
  case 'cap-products-upd': {
    const row = el.closest('[data-product-idx]')
    const idx = capNum(row?.getAttribute('data-product-idx'), -1)
    if (idx < 0) break
    const field = el.getAttribute('data-field')
    if (field === 'kittingHours' || field === 'bookingInOutHours' || field === 'productMovementHours') {
      const hoursEl = row?.querySelector('input[data-field="hoursPerWeek"]')
      const kittingEl = row?.querySelector('input[data-field="kittingHours"]')
      const bookingInOutEl = row?.querySelector('input[data-field="bookingInOutHours"]')
      const movementEl = row?.querySelector('input[data-field="productMovementHours"]')
      const kittingValue = kittingEl ? Number(kittingEl.value) : 0
      const bookingInOutValue = bookingInOutEl ? Number(bookingInOutEl.value) : 0
      const movementValue = movementEl ? Number(movementEl.value) : 0
      if (hoursEl) {
        const total = Math.max(0, Number.isFinite(kittingValue) ? kittingValue : 0) + Math.max(0, Number.isFinite(bookingInOutValue) ? bookingInOutValue : 0) + Math.max(0, Number.isFinite(movementValue) ? movementValue : 0)
        hoursEl.value = String(total)
      }
      break
    }
    if (field === 'hoursPerWeek' || field === 'supportEffectiveDate') {
      // Intent-based flow: dated support changes are only persisted via cap-products-apply-hours.
      break
    }

    meDataUpdateProduct(idx, field, el.value)
    meDebouncedSave()
    break
  }
  case 'cap-products-family-filter': {
    if (typeof meProductsSetFamilyFilter === 'function') meProductsSetFamilyFilter(el.value, el.getAttribute('data-dept'))
    break
  }
  case 'cap-products-sort': {
    if (typeof meProductsSetSort === 'function') meProductsSetSort(el.value, el.getAttribute('data-dept'))
    break
  }
  case 'cap-products-status-toggle': {
    if (typeof meProductsToggleStatusFilter === 'function') {
      meProductsToggleStatusFilter(
        el.getAttribute('data-status'),
        !!el.checked,
        el.getAttribute('data-dept')
      )
    }
    break
  }

  // ── ME Product Taskload ────────────────────────────────────
  case 'cap-product-load-family-filter': {
    if (typeof meProductLoadSetFamilyFilter === 'function') meProductLoadSetFamilyFilter(el.value, el.getAttribute('data-dept'))
    break
  }
  case 'cap-product-load-sort': {
    if (typeof meProductLoadSetSort === 'function') meProductLoadSetSort(el.value, el.getAttribute('data-dept'))
    break
  }

  // ── Production Capacity ────────────────────────────────────
  case 'cap-prod-detail-filter-status': if (typeof prodCapDetailFilter !== 'undefined') { prodCapDetailFilter.status = el.value; render() } break
  case 'cap-prod-detail-filter-family': if (typeof prodCapDetailFilter !== 'undefined') { prodCapDetailFilter.family = el.value; render() } break
  case 'cap-prod-detail-filter-workarea': if (typeof prodCapDetailFilter !== 'undefined') { prodCapDetailFilter.workArea = el.value; render() } break
  case 'cap-prod-settings-capacity': {
    const wa = el.getAttribute('data-workarea')
    const year = capNum(el.getAttribute('data-year'), 0)
    const month = capNum(el.getAttribute('data-month'), 0)
    if (typeof prodCapSettingsUpdate === 'function') prodCapSettingsUpdate(wa, year, month, el.value)
    break
  }
  case 'cap-prod-settings-utilization': {
    if (typeof prodCapSettingsSetUtilization === 'function') prodCapSettingsSetUtilization(el.value)
    break
  }

  default: break
  }
}

window.capacityEvents._onInput = function(evt) {
  const el = capActionTarget(evt)
  if (!el) return
  const action = el.getAttribute('data-cap-action')
  const isPM = capIsPM(el)

  switch (action) {
  case 'cap-task-search': {
    const filterStateVar = isPM ? window.pmTasksFilters : window.meTasksFilters
    capPreserveSearchContinuity(el, '[data-cap-action="cap-task-search"]', function() {
      if (filterStateVar) filterStateVar.search = el.value
      capTaskRefresh(isPM)
    })
    break
  }
  case 'cap-products-search': {
    const dept = el.getAttribute('data-dept')
    capPreserveSearchContinuity(el, '[data-cap-action="cap-products-search"]', function() {
      if (typeof meProductsSetSearch === 'function') meProductsSetSearch(el.value, dept)
    })
    break
  }
  case 'cap-product-load-search': {
    const dept = el.getAttribute('data-dept')
    capPreserveSearchContinuity(el, '[data-cap-action="cap-product-load-search"]', function() {
      if (typeof meProductLoadSetSearch === 'function') meProductLoadSetSearch(el.value, dept)
    })
    break
  }
  default: break
  }
}

window.capacityEvents._onKeydown = function(evt) {
  const el = capActionTarget(evt)
  if (!el) return
  const action = el.getAttribute('data-cap-action')

  switch (action) {
  case 'cap-prod-settings-capacity': {
    const wa = el.getAttribute('data-workarea')
    const key = el.getAttribute('data-key')
    if (typeof prodCapSettingsNavKey === 'function') prodCapSettingsNavKey(evt, wa, key)
    break
  }
  default: break
  }
}

// ── Focus Guard: Deferred Re-render Flush ──────────────────
/**
 * When user leaves an inline-editable table cell, flush any pending re-renders
 * that were deferred by the focus guard logic in me-capacity.js, me-data.js,
 * pm-capacity.js, and prod-capacity-data.js
 */
window.capacityEvents._onFocusOut = function(evt) {
  const nextFocus = evt.relatedTarget
  const contextRoot = evt.target && typeof evt.target.closest === 'function'
    ? evt.target.closest('[data-cap-context]')
    : null
  const isPMContext = (contextRoot && contextRoot.getAttribute('data-cap-context') === 'pm') ||
    window.meCurrentDepartmentContext === 'PM'
  // If moving to next cell in same table, no need to flush
  if (nextFocus && nextFocus.closest('table')) return
  // No pending re-renders to flush across any capacity portal
  if (!window.mePendingRealTimeUpdate && !window.mePendingRerender &&
      !window.pmPendingRealTimeUpdate && !window.pmPendingRerender &&
      !window.logPendingRerender && !window.unit6PendingRerender &&
      !window.prodCapPendingRealTimeUpdate) return

  // Use setTimeout(0) to let browser settle focus (handles select dropdown quirk)
  setTimeout(function() {
    // Re-check if still editing (in case user moved to a new cell)
    if (typeof isEditingInlineCell === 'function' && isEditingInlineCell()) return

    // ── Production Capacity flush ──────────────────────────
    if (window.prodCapPendingRealTimeUpdate) {
      window.prodCapPendingRealTimeUpdate = false
      if (capacityTab === 'production' && typeof prodCapRefreshCurrentTab === 'function') {
        prodCapRefreshCurrentTab()
      }
      return
    }

    // ── PM Capacity flush ──────────────────────────────────
    if (window.pmPendingRealTimeUpdate || window.pmPendingRerender) {
      window.pmPendingRealTimeUpdate = false
      window.pmPendingRerender = false
      var activePMBtn = document.querySelector('.pm-shell .me-nav-btn.active')
      if (activePMBtn && activePMBtn.getAttribute('data-tab') === 'chart') {
        if (typeof pmCapSmartRender === 'function') pmCapSmartRender()
        return
      }
      if (typeof pmRefreshCurrentTab === 'function') pmRefreshCurrentTab()
      return
    }

    // ── Logistics Capacity flush ───────────────────────────
    if (window.logPendingRerender) {
      window.logPendingRerender = false
      if (typeof logRefreshCurrentTab === 'function') logRefreshCurrentTab()
      return
    }

    // ── Unit 6 Capacity flush ──────────────────────────────
    if (window.unit6PendingRerender) {
      window.unit6PendingRerender = false
      if (typeof unit6RefreshCurrentTab === 'function') unit6RefreshCurrentTab()
      return
    }

    // ── ME Capacity flush ──────────────────────────────────
    // Using render() here would call renderMeCapacity() → meDataAutoSyncProductionProducts()
    // which schedules another meDataSave, creating a feedback loop that constantly
    // redraws the capacity chart.
    if (window.mePendingRealTimeUpdate || window.mePendingRerender) {
      window.mePendingRealTimeUpdate = false
      window.mePendingRerender = false
      // Chart tab is read-only — mark dirty, recalculate when user navigates to it.
      // Only query .me-shell here; PM has already been handled above.
      var activeNavBtn = contextRoot
        ? contextRoot.querySelector('.me-nav-btn.active')
        : document.querySelector('.me-shell .me-nav-btn.active')
      if (activeNavBtn && activeNavBtn.getAttribute('data-tab') === 'chart') {
        if (isPMContext && typeof pmCapSmartRender === 'function') pmCapSmartRender()
        else if (typeof meCapSmartRender === 'function') meCapSmartRender()
        return
      }
      if (isPMContext && typeof pmRefreshCurrentTab === 'function') {
        pmRefreshCurrentTab()
      } else if (typeof meRefreshCurrentTab === 'function') {
        meRefreshCurrentTab()
      }
    }
  }, 0)
}
