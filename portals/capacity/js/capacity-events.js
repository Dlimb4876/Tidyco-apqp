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

function capContextType(el) {
  const ctx = el.closest('[data-cap-context]')
  if (ctx) {
    return (ctx.getAttribute('data-cap-context') || 'me').toLowerCase()
  }

  const dep = (window.meCurrentDepartmentContext || 'ME').toUpperCase()
  if (dep === 'PM') return 'pm'
  if (dep === 'LOG') return 'log'
  if (dep === 'UNIT6') return 'unit6'
  return 'me'
}

function capIsPM(contextType) {
  return contextType === 'pm'
}

function capGetDataApi(contextType) {
  if (contextType === 'pm') {
    return {
      addTeam: window.pmDataAddTeam,
      updateTeam: window.pmDataUpdateTeam,
      deleteTeam: window.pmDataDeleteTeam,
      addTask: window.pmDataAddTask,
      updateTask: window.pmDataUpdateTask,
      deleteTask: window.pmDataDeleteTask,
      updateProduct: window.pmDataUpdateProduct,
      getProducts: window.pmDataGetProducts
    }
  }
  if (contextType === 'log') {
    return {
      addTeam: window.logDataAddTeam,
      updateTeam: window.logDataUpdateTeam,
      deleteTeam: window.logDataDeleteTeam,
      addTask: window.logDataAddTask,
      updateTask: window.logDataUpdateTask,
      deleteTask: window.logDataDeleteTask,
      updateProduct: window.logDataUpdateProduct,
      getProducts: window.logDataGetProducts
    }
  }
  if (contextType === 'unit6') {
    return {
      addTeam: window.unit6DataAddTeam,
      updateTeam: window.unit6DataUpdateTeam,
      deleteTeam: window.unit6DataDeleteTeam,
      addTask: window.unit6DataAddTask,
      updateTask: window.unit6DataUpdateTask,
      deleteTask: window.unit6DataDeleteTask,
      updateProduct: window.unit6DataUpdateProduct,
      getProducts: window.unit6DataGetProducts
    }
  }
  return {
    addTeam: window.meDataAddTeam,
    updateTeam: window.meDataUpdateTeam,
    deleteTeam: window.meDataDeleteTeam,
    addTask: window.meDataAddTask,
    updateTask: window.meDataUpdateTask,
    deleteTask: window.meDataDeleteTask,
    updateProduct: window.meDataUpdateProduct,
    getProducts: window.meDataGetProducts
  }
}

function capRunSave(contextType) {
  if (contextType === 'pm' && typeof window.pmOnSave === 'function') return window.pmOnSave()
  if (contextType === 'log' && typeof window.logOnSave === 'function') return window.logOnSave()
  if (contextType === 'unit6' && typeof window.unit6OnSave === 'function') return window.unit6OnSave()
  if (typeof window.meOnSave === 'function') return window.meOnSave()
  return null
}

function capRunDebouncedSave(contextType) {
  if (contextType === 'pm' && typeof window.pmDebouncedSave === 'function') return window.pmDebouncedSave()
  if (contextType === 'log' && typeof window.logDebouncedSave === 'function') return window.logDebouncedSave()
  if (contextType === 'unit6' && typeof window.unit6DebouncedSave === 'function') return window.unit6DebouncedSave()
  if (typeof window.meDebouncedSave === 'function') return window.meDebouncedSave()
  return null
}

function capSetTab(contextType, tabName) {
  if (contextType === 'pm' && typeof window.pmSetTab === 'function') return window.pmSetTab(tabName)
  if (contextType === 'log' && typeof window.logSetTab === 'function') return window.logSetTab(tabName)
  if (contextType === 'unit6' && typeof window.unit6SetTab === 'function') return window.unit6SetTab(tabName)
  if (typeof window.meSetTab === 'function') return window.meSetTab(tabName)
  return null
}

function capRefreshCurrentTab(contextType) {
  if (contextType === 'pm' && typeof window.pmRefreshCurrentTab === 'function') return window.pmRefreshCurrentTab()
  if (contextType === 'log' && typeof window.logRefreshCurrentTab === 'function') return window.logRefreshCurrentTab()
  if (contextType === 'unit6' && typeof window.unit6RefreshCurrentTab === 'function') return window.unit6RefreshCurrentTab()
  if (typeof window.meRefreshCurrentTab === 'function') return window.meRefreshCurrentTab()
  return null
}

function capToggleTaskSort(column, contextType) {
  const sortState = capIsPM(contextType) ? window.pmTasksSort : window.meTasksSort
  if (!sortState) return
  if (sortState.column === column) {
    sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc'
  } else {
    sortState.column = column
    sortState.direction = 'asc'
  }
}

// Return the task-filters state object for the current ME or PM context.
function capTaskFilters(contextType) {
  return capIsPM(contextType) ? window.pmTasksFilters : window.meTasksFilters
}

function capProductDraftDepartment(contextType) {
  if (contextType === 'pm') return 'PM'
  if (contextType === 'log') return 'LOG'
  if (contextType === 'unit6') return 'UNIT6'
  return 'ME'
}

function capSetProductDraft(row, contextType, patch) {
  if (!row || typeof window.meProductsSetDraftValue !== 'function') return null
  const idx = capNum(row.getAttribute('data-product-idx'), -1)
  if (idx < 0) return null
  const productDbId = row.getAttribute('data-product-db-id') || ''

  if (productDbId) {
    return window.meProductsSetDraftValue(
      capProductDraftDepartment(contextType),
      row.getAttribute('data-product-id') || '',
      idx,
      patch || {},
      productDbId
    )
  }

  return window.meProductsSetDraftValue(
    capProductDraftDepartment(contextType),
    row.getAttribute('data-product-id') || '',
    idx,
    patch || {}
  )
}

function capHandleProductDraftChange(el, contextType) {
  const row = el.closest('[data-product-idx]')
  if (!row) return

  const field = el.getAttribute('data-field')
  if (!field) return

  if (field === 'kittingHours' || field === 'bookingInOutHours' || field === 'productMovementHours') {
    const kittingEl = row.querySelector('input[data-field="kittingHours"]')
    const bookingInOutEl = row.querySelector('input[data-field="bookingInOutHours"]')
    const movementEl = row.querySelector('input[data-field="productMovementHours"]')
    const hoursEl = row.querySelector('input[data-field="hoursPerWeek"]')
    const kittingRaw = kittingEl ? kittingEl.value : ''
    const bookingInOutRaw = bookingInOutEl ? bookingInOutEl.value : ''
    const movementRaw = movementEl ? movementEl.value : ''
    const kittingValue = Number(kittingRaw)
    const bookingInOutValue = Number(bookingInOutRaw)
    const movementValue = Number(movementRaw)
    const total = Math.max(0, Number.isFinite(kittingValue) ? kittingValue : 0) +
      Math.max(0, Number.isFinite(bookingInOutValue) ? bookingInOutValue : 0) +
      Math.max(0, Number.isFinite(movementValue) ? movementValue : 0)

    if (hoursEl) hoursEl.value = String(total)

    capSetProductDraft(row, contextType, {
      kittingHours: kittingRaw,
      bookingInOutHours: bookingInOutRaw,
      productMovementHours: movementRaw,
      hoursPerWeek: String(total)
    })
    return
  }

  capSetProductDraft(row, contextType, {
    [field]: el.value
  })
}

// Re-render the tasks tab for the current ME or PM context.
function capTaskRefresh(contextType) {
  capSetTab(contextType, 'tasks')
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
  const contextType = capContextType(el)
  const isPM = capIsPM(contextType)

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
    const api = capGetDataApi(contextType)
    if (confirm('Delete team member?')) {
      if (typeof api.deleteTeam === 'function') api.deleteTeam(idx)
      capRunSave(contextType)
      capSetTab(contextType, 'team')
    }
    break
  }
  case 'cap-team-add': {
    const department = (window.meCurrentDepartmentContext || 'ME').toUpperCase()
    const label = isPM
      ? 'New PM Manager'
      : department === 'LOG'
        ? 'New Logistics Technician'
        : department === 'UNIT6'
          ? 'New Technician'
          : 'New Engineer'
    const api = capGetDataApi(contextType)
    if (typeof api.addTeam === 'function') {
      api.addTeam(label, ME_DEFAULT_HOURS_PER_WEEK, 80)
      capRunSave(contextType)
      capSetTab(contextType, 'team')
    }
    break
  }
  case 'cap-team-holidays': capSetTab(contextType, 'holidays'); break

  // ── ME Tasks ──────────────────────────────────────────────
  case 'cap-task-del': {
    const idx = capNum(el.closest('[data-task-idx]')?.getAttribute('data-task-idx'), -1)
    if (idx < 0) break
    const api = capGetDataApi(contextType)
    if (confirm('Delete task?')) {
      if (typeof api.deleteTask === 'function') api.deleteTask(idx)
      capRunSave(contextType)
      capTaskRefresh(contextType)
    }
    break
  }
  case 'cap-task-add': {
    const api = capGetDataApi(contextType)
    if (typeof api.addTask === 'function') {
      api.addTask('New Task', 'NPI', '', '', '', 0, '')
      capRunSave(contextType)
      capSetTab(contextType, 'tasks')
    }
    break
  }
  case 'cap-task-sort': {
    const key = el.getAttribute('data-sort-key')
    capToggleTaskSort(key, contextType)
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-clear-search': {
    const f = capTaskFilters(contextType)
    if (f) f.search = ''
    const inp = document.querySelector('.me-filter-input')
    if (inp) inp.value = ''
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-clear-category': {
    const f = capTaskFilters(contextType)
    if (f) f.category = 'all'
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-clear-assignee': {
    const f = capTaskFilters(contextType)
    if (f) f.assignee = 'all'
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-clear-product': {
    const f = capTaskFilters(contextType)
    if (f) f.product = 'all'
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-clear-month': {
    const f = capTaskFilters(contextType)
    if (f) f.month = 'all'
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-toggle-hide-completed': {
    const f = capTaskFilters(contextType)
    const storageKey = isPM ? 'pmTasksHideCompleted' : 'meTasksHideCompleted'
    if (f) {
      f.hideCompleted = !f.hideCompleted
      localStorage.setItem(storageKey, f.hideCompleted)
    }
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-clear-all-filters': {
    const f = capTaskFilters(contextType)
    const storageKey = isPM ? 'pmTasksHideCompleted' : 'meTasksHideCompleted'
    const hideVal = f ? f.hideCompleted : false
    if (f) {
      Object.assign(f, { search: '', category: 'all', assignee: 'all', product: 'all', month: 'all', hideCompleted: hideVal })
    }
    capTaskRefresh(contextType)
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

    const api = capGetDataApi(contextType)
    const products = typeof api.getProducts === 'function' ? api.getProducts() : []
    const product = products[idx]
    const currentEffectiveDate = (product && product.supportEffectiveDate) ? String(product.supportEffectiveDate) : ''

    if (currentEffectiveDate && effectiveDate < currentEffectiveDate) {
      const confirmBackdate = confirm('You are backdating this support change before the current effective date. Continue intentionally?')
      if (!confirmBackdate) break
    }

    if (typeof api.updateProduct === 'function') {
      api.updateProduct(idx, 'hoursPerWeek', String(hoursValue), {
        effectiveDate,
        changeReason,
        kittingHours: hasSplitFields ? kittingValue : undefined,
        bookingInOutHours: hasSplitFields ? bookingInOutValue : undefined,
        productMovementHours: hasSplitFields ? movementValue : undefined
      })
    }

    if (typeof window.meProductsClearDraft === 'function') {
      const productDbId = row?.getAttribute('data-product-db-id') || ''
      if (productDbId) {
        window.meProductsClearDraft(
          capProductDraftDepartment(contextType),
          row?.getAttribute('data-product-id') || '',
          idx,
          productDbId
        )
      } else {
        window.meProductsClearDraft(
          capProductDraftDepartment(contextType),
          row?.getAttribute('data-product-id') || '',
          idx
        )
      }
    }

    capRefreshCurrentTab(contextType)
    capRunDebouncedSave(contextType)
    break
  }
  case 'cap-products-toggle-history': {
    if (typeof meProductsToggleHistory === 'function') {
      meProductsToggleHistory(el.getAttribute('data-product-id'), el.getAttribute('data-dept'))
    }
    break
  }
  case 'cap-products-edit-history': {
    const historyId = el.getAttribute('data-history-id')
    const dept = el.getAttribute('data-dept') || 'ME'
    if (!historyId) break
    const isLogContext = dept === 'LOG'
    const entrySnapshot = {
      effectiveDate: el.getAttribute('data-effective-date') || '',
      hoursPerWeek: parseFloat(el.getAttribute('data-hours') || '0'),
      changeReason: el.getAttribute('data-reason') || ''
    }
    if (isLogContext) {
      entrySnapshot.kittingHours = parseFloat(el.getAttribute('data-kitting') || '0')
      entrySnapshot.bookingInOutHours = parseFloat(el.getAttribute('data-booking') || '0')
      entrySnapshot.productMovementHours = parseFloat(el.getAttribute('data-movement') || '0')
    }
    if (typeof window.meProductsStartHistoryEdit === 'function') {
      window.meProductsStartHistoryEdit(historyId, entrySnapshot, dept)
    }
    break
  }
  case 'cap-products-save-history-edit': {
    const historyId = el.getAttribute('data-history-id')
    const dept = el.getAttribute('data-dept') || 'ME'
    if (!historyId) break
    const editRow = el.closest('tr[data-history-edit-row]')
    if (typeof window.meProductsSaveHistoryEdit === 'function') {
      window.meProductsSaveHistoryEdit(historyId, dept, editRow)
    }
    break
  }
  case 'cap-products-cancel-history-edit': {
    const dept = el.getAttribute('data-dept') || 'ME'
    if (typeof window.meProductsCancelHistoryEdit === 'function') {
      window.meProductsCancelHistoryEdit(dept)
    }
    break
  }
  case 'cap-products-delete-history': {
    const historyId = el.getAttribute('data-history-id')
    const dept = (el.getAttribute('data-dept') || '').toUpperCase()
    const deleteContextType = dept === 'PM' ? 'pm' : dept === 'LOG' ? 'log' : dept === 'UNIT6' ? 'unit6' : contextType
    if (!historyId) break
    if (!confirm('Delete this support history entry? This cannot be undone.')) break
    const deleteFn = deleteContextType === 'pm'
      ? window.pmDataDeleteProductSupportHistoryEntry
      : deleteContextType === 'log'
        ? window.logDataDeleteProductSupportHistoryEntry
        : deleteContextType === 'unit6'
          ? window.unit6DataDeleteProductSupportHistoryEntry
          : window.meDataDeleteProductSupportHistoryEntry
    if (typeof deleteFn === 'function') {
      deleteFn(historyId)
    }
    capRefreshCurrentTab(deleteContextType)
    capRunDebouncedSave(deleteContextType)
    break
  }
  case 'cap-products-sort-column': {
    const key = el.getAttribute('data-sort-key')
    const dept = el.getAttribute('data-dept') || capProductDraftDepartment(contextType)
    if (typeof window.meProductsSortByColumn === 'function') {
      window.meProductsSortByColumn(key, dept)
    }
    break
  }
  case 'cap-products-sort-dir': if (typeof meProductsToggleSortDir === 'function') meProductsToggleSortDir(el.getAttribute('data-dept')); break
  case 'cap-products-clear-filters': if (typeof meProductsClearFilters === 'function') meProductsClearFilters(el.getAttribute('data-dept')); break
  case 'cap-products-bulk-save': {
    const department = el.getAttribute('data-dept') || 'ME'
    if (typeof window.meProductsBulkSaveChanges === 'function') {
      window.meProductsBulkSaveChanges(department)
    }
    break
  }

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
  const contextType = capContextType(el)
  const isPM = capIsPM(contextType)

  switch (action) {
  // ── ME month change ────────────────────────────────────────
  case 'cap-me-month-change': if (typeof meOnMonthChange === 'function') meOnMonthChange(el.value); break

  // ── ME Team update ────────────────────────────────────────
  case 'cap-team-upd': {
    const row = el.closest('[data-member-idx]')
    const idx = capNum(row?.getAttribute('data-member-idx'), -1)
    if (idx < 0) break
    const field = el.getAttribute('data-field')
    const api = capGetDataApi(contextType)
    if (typeof api.updateTeam === 'function') api.updateTeam(idx, field, el.value)
    capRunDebouncedSave(contextType)
    break
  }

  // ── ME Tasks update ───────────────────────────────────────
  case 'cap-task-upd': {
    const row = el.closest('[data-task-idx]')
    const idx = capNum(row?.getAttribute('data-task-idx'), -1)
    if (idx < 0) break
    const field = el.getAttribute('data-field')
    const api = capGetDataApi(contextType)
    if (typeof api.updateTask === 'function') api.updateTask(idx, field, el.value)
    capRunDebouncedSave(contextType)
    break
  }
  case 'cap-task-status-upd': {
    const row = el.closest('[data-task-idx]')
    const idx = capNum(row?.getAttribute('data-task-idx'), -1)
    if (idx < 0) break
    const api = capGetDataApi(contextType)
    if (typeof api.updateTask === 'function') api.updateTask(idx, 'status', el.value)
    capRunDebouncedSave(contextType)
    // Do NOT immediately call meSetTab/pmSetTab — the debounce and blur handler
    // will re-render at the right time, preserving focus.
    break
  }
  case 'cap-task-toggle-disabled': {
    const row = el.closest('[data-task-idx]')
    const idx = capNum(row?.getAttribute('data-task-idx'), -1)
    if (idx < 0) break
    const api = capGetDataApi(contextType)
    if (typeof api.updateTask === 'function') api.updateTask(idx, 'isDisabled', !!el.checked)
    capRunDebouncedSave(contextType)
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-filter-category': {
    const f = capTaskFilters(contextType)
    if (f) f.category = el.value
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-filter-assignee': {
    const f = capTaskFilters(contextType)
    if (f) f.assignee = el.value
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-filter-product': {
    const f = capTaskFilters(contextType)
    if (f) f.product = el.value
    capTaskRefresh(contextType)
    break
  }
  case 'cap-task-filter-month': {
    const f = capTaskFilters(contextType)
    if (f) f.month = el.value
    capTaskRefresh(contextType)
    break
  }

  // ── ME Products update ────────────────────────────────────
  case 'cap-products-draft': {
    capHandleProductDraftChange(el, contextType)
    break
  }
  case 'cap-products-history-edit-field': {
    const field = el.getAttribute('data-history-edit-field')
    const dept = el.getAttribute('data-dept') || 'ME'
    if (field && typeof window.meProductsUpdateHistoryEditDraft === 'function') {
      window.meProductsUpdateHistoryEditDraft(dept, field, el.value)
    }
    break
  }
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

    const api = capGetDataApi(contextType)
    if (typeof api.updateProduct === 'function') api.updateProduct(idx, field, el.value)
    capRunDebouncedSave(contextType)
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
  const contextType = capContextType(el)
  const isPM = capIsPM(contextType)

  switch (action) {
  case 'cap-task-search': {
    const filterStateVar = capTaskFilters(contextType)
    capPreserveSearchContinuity(el, '[data-cap-action="cap-task-search"]', function() {
      if (filterStateVar) filterStateVar.search = el.value
      capTaskRefresh(contextType)
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
  case 'cap-products-draft': {
    capHandleProductDraftChange(el, contextType)
    break
  }
  case 'cap-products-history-edit-field': {
    const field = el.getAttribute('data-history-edit-field')
    const dept = el.getAttribute('data-dept') || 'ME'
    if (field && typeof window.meProductsUpdateHistoryEditDraft === 'function') {
      window.meProductsUpdateHistoryEditDraft(dept, field, el.value)
    }
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
      var activeLogBtn = document.querySelector('.log-shell .me-nav-btn.active')
      if (activeLogBtn && activeLogBtn.getAttribute('data-tab') === 'chart') {
        if (typeof logCapSmartRender === 'function') logCapSmartRender()
        return
      }
      if (typeof logRefreshCurrentTab === 'function') logRefreshCurrentTab()
      return
    }

    // ── Unit 6 Capacity flush ──────────────────────────────
    if (window.unit6PendingRerender) {
      window.unit6PendingRerender = false
      var activeUnit6Btn = document.querySelector('.unit6-shell .me-nav-btn.active')
      if (activeUnit6Btn && activeUnit6Btn.getAttribute('data-tab') === 'chart') {
        if (typeof unit6CapSmartRender === 'function') unit6CapSmartRender()
        return
      }
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
