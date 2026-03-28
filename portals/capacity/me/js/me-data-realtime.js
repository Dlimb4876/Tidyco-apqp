/* ============================================================
   me-data-realtime.js — ME Capacity Realtime Wiring
   Realtime row normalization and subscription ownership
   ============================================================ */

// Maps a raw Supabase me_tasks row to the camelCase shape used in meDataState.
// Single source of truth used by both the onInsert and onUpdate handlers.
function meNormalizeTaskRow(row) {
  return {
    id: row.id,
    name: row.name || '',
    category: row.category || 'NPI',
    type: row.type || 'standard',
    department: meNormalizeDepartmentTag(row.department, 'ME'),
    assigneeId: row.assignee_id || '',
    productId: row.product_id || '',
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    totalHours: parseFloat(row.total_hours) || 0,
    status: row.status || 'SCHEDULED',
    isDisabled: row.is_disabled === true,
    createdAt: row.created_at || new Date().toISOString()
  };
}

function meNormalizeTeamRow(row) {
  return {
    id: row.id,
    name: row.name || '',
    hoursPerWeek: meGetHoursPerWeek(row.hours_per_week),
    utilisation: parseFloat(row.utilisation) || 80,
    jobTitle: row.job_title || '',
    group: row.team_group || '',
    department: meNormalizeDepartmentTag(row.department, 'ME'),
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    createdAt: row.created_at || new Date().toISOString()
  };
}

function meNormalizeProductRow(row) {
  const breakdown = meNormalizeProductSupportBreakdown(row, row.hours_per_week);
  return {
    id: row.id,
    name: row.name || '(Unknown Product)',
    productDatabaseId: row.product_database_id || '',
    hoursPerWeek: breakdown.hoursPerWeek,
    kittingHours: breakdown.kittingHours,
    bookingInOutHours: breakdown.bookingInOutHours,
    kittingTimeBookingHours: breakdown.kittingTimeBookingHours,
    productMovementHours: breakdown.productMovementHours,
    department: meNormalizeDepartmentTag(row.department, 'ME'),
    notes: row.notes || '',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || ''
  };
}

function meIsCapacityFilterInputFocused() {
  const active = document.activeElement;
  if (!active || active === document.body) return false;
  if (typeof active.matches !== 'function') return false;

  return active.matches('[data-cap-action="cap-task-search"], [data-cap-action="cap-task-filter-category"], [data-cap-action="cap-task-filter-assignee"], [data-cap-action="cap-task-filter-product"], [data-cap-action="cap-task-filter-month"], [data-cap-action="cap-products-search"], [data-cap-action="cap-product-load-search"]');
}

let _meRealtimeDebounceTimer = null;

function meApplyRealtimeStateChange() {
  if (isEditingInlineCell() || meIsCapacityFilterInputFocused()) {
    window.mePendingRealTimeUpdate = true;
    return;
  }
  // Debounce so a burst of realtime events (e.g. one per saved row) collapses
  // into a single re-render instead of rapidly replacing the DOM each time.
  clearTimeout(_meRealtimeDebounceTimer);
  _meRealtimeDebounceTimer = setTimeout(function() {
    meCapSmartRender();
  }, 150);
}

window.meDataSubscribe = function() {
  if (!currentUser) return;
  if (typeof render !== 'function') {
    console.warn('meDataSubscribe: render() not yet defined, skipping subscription setup');
    return;
  }

  createMultiTableRealtimeSubscription([
    {
      table: 'me_teams',
      onInsert: (newTeam) => {
        const normalizedTeam = meNormalizeTeamRow(newTeam);
        if (!meDataState.team.some(t => t.id === normalizedTeam.id)) {
          meDataState.team.push(normalizedTeam);
          meApplyRealtimeStateChange();
        }
      },
      onUpdate: (updatedTeam) => {
        const normalizedTeam = meNormalizeTeamRow(updatedTeam);
        const idx = meDataState.team.findIndex(t => t.id === normalizedTeam.id);
        if (idx < 0) {
          meDataState.team.push(normalizedTeam);
        } else {
          meDataState.team[idx] = { ...meDataState.team[idx], ...normalizedTeam };
        }
        meApplyRealtimeStateChange();
      },
      onDelete: (deleted) => {
        meDataState.team = meDataState.team.filter(t => t.id !== deleted.id);
        meApplyRealtimeStateChange();
      }
    },
    {
      table: 'me_tasks',
      onInsert: (newTask) => {
        const normalizedTask = meNormalizeTaskRow(newTask);
        if (!meDataState.tasks.some(t => t.id === normalizedTask.id)) {
          meDataState.tasks.push(normalizedTask);
          meApplyRealtimeStateChange();
        }
      },
      onUpdate: (updatedTask) => {
        const normalizedTask = meNormalizeTaskRow(updatedTask);

        const idx = meDataState.tasks.findIndex(t => t.id === normalizedTask.id);
        if (idx < 0) {
          meDataState.tasks.push(normalizedTask);
          meApplyRealtimeStateChange();
          return;
        }

        const current = meDataState.tasks[idx];
        const changed =
          current.name !== normalizedTask.name ||
          current.category !== normalizedTask.category ||
          current.type !== normalizedTask.type ||
          current.department !== normalizedTask.department ||
          current.assigneeId !== normalizedTask.assigneeId ||
          current.productId !== normalizedTask.productId ||
          current.startDate !== normalizedTask.startDate ||
          current.endDate !== normalizedTask.endDate ||
          Number(current.totalHours || 0) !== Number(normalizedTask.totalHours || 0) ||
          current.status !== normalizedTask.status ||
          Boolean(current.isDisabled) !== Boolean(normalizedTask.isDisabled);

        if (!changed) return;
        meDataState.tasks[idx] = { ...current, ...normalizedTask };
        meApplyRealtimeStateChange();
      },
      onDelete: (deleted) => {
        meDataState.tasks = meDataState.tasks.filter(t => t.id !== deleted.id);
        meApplyRealtimeStateChange();
      }
    },
    {
      table: 'me_products',
      onInsert: (newProduct) => {
        const normalizedProduct = meNormalizeProductRow(newProduct);
        if (!meDataState.products.some(p => p.id === normalizedProduct.id)) {
          meDataState.products.push(normalizedProduct);
          meApplyRealtimeStateChange();
        }
      },
      onUpdate: (updatedProduct) => {
        const normalizedProduct = meNormalizeProductRow(updatedProduct);
        const idx = meDataState.products.findIndex(p => p.id === normalizedProduct.id);
        if (idx < 0) {
          meDataState.products.push(normalizedProduct);
        } else {
          meDataState.products[idx] = { ...meDataState.products[idx], ...normalizedProduct };
        }
        meApplyRealtimeStateChange();
      },
      onDelete: (deleted) => {
        meDataState.products = meDataState.products.filter(p => p.id !== deleted.id);
        meApplyRealtimeStateChange();
      }
    },
    {
      table: 'me_product_support_history',
      onInsert: (newEntry) => {
        if (window.meDataSaveInProgress) return;
        const normalized = meNormalizeSupportHistoryRecord(newEntry);
        if (!normalized) return;
        const existingIdx = meDataState.productSupportHistory.findIndex(h => h.id === normalized.id);
        if (existingIdx >= 0) {
          meDataState.productSupportHistory[existingIdx] = normalized;
        } else {
          meDataState.productSupportHistory.push(normalized);
        }
        meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(meDataState.productSupportHistory);
        meDataState.products.forEach(product => {
          if (product.id !== normalized.productId) return;
          if (meNormalizeDepartmentTag(product.department, normalized.department) !== normalized.department) return;
          meApplyLatestSupportHistoryToProduct(product, normalized.department);
        });
        meApplyRealtimeStateChange();
      },
      onUpdate: (updatedEntry) => {
        const normalized = meNormalizeSupportHistoryRecord(updatedEntry);
        if (!normalized) return;
        const existingIdx = meDataState.productSupportHistory.findIndex(h => h.id === normalized.id);
        if (existingIdx >= 0) {
          meDataState.productSupportHistory[existingIdx] = normalized;
        } else {
          meDataState.productSupportHistory.push(normalized);
        }
        meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(meDataState.productSupportHistory);
        meDataState.products.forEach(product => {
          if (product.id !== normalized.productId) return;
          if (meNormalizeDepartmentTag(product.department, normalized.department) !== normalized.department) return;
          meApplyLatestSupportHistoryToProduct(product, normalized.department);
        });
        meApplyRealtimeStateChange();
      },
      onDelete: (deleted) => {
        if (window.meDataSaveInProgress) return;
        meDataState.productSupportHistory = meDataState.productSupportHistory.filter(h => h.id !== deleted.id);
        meApplyRealtimeStateChange();
      }
    },
    {
      table: 'me_holidays',
      onInsert: (newHoliday) => {
        if (window.meDataSaveInProgress) return;
        const normalized = meNormalizeHolidayRecord(newHoliday);
        if (!normalized) return;
        const existingIdx = meDataState.holidays.findIndex(h =>
          h.id === normalized.id ||
          (h.personId === normalized.personId && h.date === normalized.date)
        );
        if (existingIdx >= 0) {
          meDataState.holidays[existingIdx] = normalized;
        } else {
          meDataState.holidays.push(normalized);
        }
        meApplyRealtimeStateChange();
      },
      onUpdate: (updatedHoliday) => {
        const normalized = meNormalizeHolidayRecord(updatedHoliday);
        if (!normalized) return;
        const existingIdx = meDataState.holidays.findIndex(h =>
          h.id === normalized.id ||
          (h.personId === normalized.personId && h.date === normalized.date)
        );
        if (existingIdx >= 0) {
          meDataState.holidays[existingIdx] = normalized;
        } else {
          meDataState.holidays.push(normalized);
        }
        meApplyRealtimeStateChange();
      },
      onDelete: (deleted) => {
        if (window.meDataSaveInProgress) return;
        const normalized = meNormalizeHolidayRecord(deleted);
        meDataState.holidays = meDataState.holidays.filter(h => {
          if (h.id === deleted.id) return false;
          if (normalized && h.personId === normalized.personId && h.date === normalized.date) return false;
          return true;
        });
        meApplyRealtimeStateChange();
      }
    }
  ], 'me_all_channel');
};

window.meDataUnsubscribe = function() {
  removeRealtimeSubscription('me_all_channel');
};