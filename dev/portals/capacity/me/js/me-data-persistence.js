/* ============================================================
   me-data-persistence.js — ME Capacity Persistence Orchestration
   Init, save, reset, diagnostics, and structure helpers
   ============================================================ */

function meBuildEmptyDataState() {
  if (typeof meCreateDataState === 'function') {
    return meCreateDataState();
  }

  return {
    team: [],
    tasks: [],
    products: [],
    holidays: [],
    productSupportHistory: [],
    timeLogs: []
  };
}

function meBuildEmptyPendingDeletes() {
  if (typeof meCreatePendingDeletes === 'function') {
    return meCreatePendingDeletes();
  }

  return { tasks: [], teams: [], supportHistory: [], products: [] };
}

// Initialize missing date fields on backward compatibility
function meInitTeamDates() {
  meDataState.team.forEach(member => {
    if (!member.startDate) member.startDate = '';
    if (!member.endDate) member.endDate = '';
  });
}

window.meDataInit = async function() {
  try {
    if (typeof supa === 'undefined' || typeof currentUser === 'undefined' || !currentUser) {
      // meDataInit is called during early boot as well as post-login; skip quietly until auth is ready.
      meEnsureStructure();
      return;
    }

      let relState = {
        team: [],
        tasks: [],
        products: [],
        holidays: [],
        productSupportHistory: []
      };

      // Load from relational tables first.
      if (typeof meLoadRelationalTeams === 'function') {
        try {
          relState = {
            team: await meLoadRelationalTeams(currentUser.id) || [],
            tasks: await meLoadRelationalTasks(currentUser.id) || [],
            products: await meLoadRelationalProducts(currentUser.id) || [],
            holidays: meNormalizeAndDedupeHolidays(await meLoadRelationalHolidays(currentUser.id)),
            productSupportHistory: typeof meLoadRelationalProductSupportHistory === 'function'
              ? (await meLoadRelationalProductSupportHistory(currentUser.id) || [])
              : []
          };
        } catch (relErr) {
          console.warn('[ME Capacity] INIT: Relational load failed:', relErr.message);
        }
      }

      const timeLogs = typeof meLoadTimeLogs === 'function'
        ? (await meLoadTimeLogs().catch(() => []))
        : [];

      meDataState = meBuildEmptyDataState();
      meDataState.team = relState.team;
      meDataState.tasks = relState.tasks;
      meDataState.products = relState.products;
      meDataState.holidays = relState.holidays;
      meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(relState.productSupportHistory);
      meDataState.timeLogs = timeLogs;

      // Ensure all data has backward-compatible fields
      meDataState.team.forEach(member => {
        if (!('jobTitle' in member)) member.jobTitle = '';
        if (!('group' in member)) member.group = '';
        if (!('department' in member)) member.department = 'ME';
        if (!('startDate' in member)) member.startDate = '';
        if (!('endDate' in member)) member.endDate = '';
      });

      meDataState.tasks.forEach(task => {
        if (!('type' in task)) task.type = 'standard';
        if (!('department' in task)) task.department = 'ME';
        if (!('status' in task)) task.status = 'SCHEDULED';
        if (!('isDisabled' in task)) task.isDisabled = false;
      });

      meDataState.products.forEach(product => {
        if (!('productDatabaseId' in product)) product.productDatabaseId = '';
        if (!('department' in product)) product.department = 'ME';
        meApplyLatestSupportHistoryToProduct(product, product.department);
      });

      meEnsureAllProductSupportHistoryBaselines();
      meDataState.products.forEach(product => {
        meApplyLatestSupportHistoryToProduct(product, product.department);
      });

      meDataState.holidays = meNormalizeAndDedupeHolidays(meDataState.holidays || []);

      window.meDataState = meDataState;
      window.meDataPendingDeletes = meBuildEmptyPendingDeletes();

      // Set up real-time sync
      meDataSubscribe();
  } catch (err) {
    console.warn('ME Capacity init error:', err);
  }
  meEnsureStructure();
  window.meDataInitialized = true;
};

window.meDataSave = async function(showAlert) {
  if (window.meDataSaveInProgress) {
    window.meDataSaveQueued = true;
    return;
  }

  window.meDataSaveInProgress = true;

  try {
    if (typeof supa === 'undefined' || typeof currentUser === 'undefined' || !currentUser) {
      console.warn('[ME Capacity] SAVE FAILED: Supabase not available or no current user');
      return;
    }

    if (typeof setSyncBadge === 'function') {
      setSyncBadge('syncing', 'Saving...');
    }

    let relationalSuccess = true;

    // Save to relational tables (if functions available)
    if (typeof meSaveTeamRelational === 'function' &&
        typeof meSaveTaskRelational === 'function' &&
        typeof meSaveProductRelational === 'function') {
      try {

        // 0. Save holidays FIRST for immediate user feedback (fast operation)
        // The table's unique key is (user_id, person_id, date), so global deletes are
        // destructive and can wipe other users' rows if one user saves an empty state.
        const _holSeen = new Set();
        meDataState.holidays = meNormalizeAndDedupeHolidays(meDataState.holidays);
        const holidayData = (meDataState.holidays || [])
          .filter(h => {
            // Only save holidays owned by the current user — other users' holidays
            // are loaded for display (shared data) but must not be re-inserted here
            // as their DB rows were not deleted, which would cause a PK conflict.
            if (h.userId && h.userId !== currentUser.id) return false;
            const key = h.personId + '_' + h.date;
            if (_holSeen.has(key)) return false;
            _holSeen.add(key);
            return true;
          })
          .map(h => {
            const row = {
              id: h.id,
              user_id: currentUser.id,
              person_id: h.personId,
              date: h.date,
              type: h.type,
              department: meNormalizeMeTableDepartment(h.department)
            };
            return row;
          });

        const { error: delHolErr } = await supa
          .from('me_holidays')
          .delete()
          .eq('user_id', currentUser.id);

        if (delHolErr) {
          console.warn('Failed to clear holidays:', delHolErr.message);
          relationalSuccess = false;
        } else if (holidayData.length > 0) {
          const { error: insHolErr } = await supa
            .from('me_holidays')
            .insert(holidayData);
          if (insHolErr) {
            console.warn('Failed to insert holidays:', insHolErr.message);
            relationalSuccess = false;
          }
        }

        // 1. Save products FIRST (tasks FK-reference products)
        for (let i = 0; i < meDataState.products.length; i++) {
          const success = await meSaveProductRelational(currentUser.id, meDataState.products[i]);
          if (!success) {
            console.warn('Failed to save product', i);
            relationalSuccess = false;
          }
        }

        // Build set of valid product IDs now in DB
        const validProductIds = new Set(meDataState.products.map(p => p.id).filter(Boolean));

        // 1-B. Save support history rows once products have stable IDs.
        if (typeof meSaveProductSupportHistoryRelational === 'function') {
          meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(meDataState.productSupportHistory);
          // Filter out rows referencing products not in DB (prevents FK violation)
          const validHistory = meDataState.productSupportHistory.filter(
            row => row && row.productId && validProductIds.has(row.productId)
          );
          if (validHistory.length > 0) {
            const supportSaveOk = await meSaveProductSupportHistoryRelational(currentUser.id, validHistory);
            if (!supportSaveOk) {
              relationalSuccess = false;
            }
          }
        }

        // 2. Save team members
        for (let i = 0; i < meDataState.team.length; i++) {
          const success = await meSaveTeamRelational(currentUser.id, meDataState.team[i]);
          if (!success) {
            console.warn('Failed to save team member', i);
            relationalSuccess = false;
          }
        }

        // 3. Save tasks (products must already be saved above)
        for (let i = 0; i < meDataState.tasks.length; i++) {
          const task = meDataState.tasks[i];

          // Null out productId if it doesn't exist in me_products (prevents FK violation)
          if (task.productId && !validProductIds.has(task.productId)) {
            task.productId = '';
          }

          const taskResult = await meSaveTaskRelational(currentUser.id, task);
          if (!taskResult.success) {
            console.warn('Failed to save task', i);
            relationalSuccess = false;
          } else {
            const taskId = taskResult.taskId || task.id;
            if (!task.id && taskId) {
              task.id = taskId;
            }
          }
        }

        // 3-B. Persist queued task deletions so refresh does not resurrect removed rows.
        const queuedTaskDeletes = window.meDataPendingDeletes && Array.isArray(window.meDataPendingDeletes.tasks)
          ? window.meDataPendingDeletes.tasks.slice()
          : [];

        if (queuedTaskDeletes.length > 0) {
          if (typeof meDeleteTaskRelational === 'function') {
            const failedTaskDeletes = [];
            for (let i = 0; i < queuedTaskDeletes.length; i++) {
              const taskId = queuedTaskDeletes[i];
              const deleted = await meDeleteTaskRelational(taskId);
              if (!deleted) {
                failedTaskDeletes.push(taskId);
                relationalSuccess = false;
              }
            }
            window.meDataPendingDeletes.tasks = failedTaskDeletes;
          } else {
            console.warn('Task deletes queued but meDeleteTaskRelational is unavailable');
            relationalSuccess = false;
          }
        }

        // 3-C. Persist queued team deletions so refresh does not resurrect removed rows.
        const queuedTeamDeletes = window.meDataPendingDeletes && Array.isArray(window.meDataPendingDeletes.teams)
          ? window.meDataPendingDeletes.teams.slice()
          : [];

        if (queuedTeamDeletes.length > 0) {
          if (typeof meDeleteTeamRelational === 'function') {
            const failedTeamDeletes = [];
            for (let i = 0; i < queuedTeamDeletes.length; i++) {
              const teamId = queuedTeamDeletes[i];
              const deleted = await meDeleteTeamRelational(teamId);
              if (!deleted) {
                failedTeamDeletes.push(teamId);
                relationalSuccess = false;
              }
            }
            window.meDataPendingDeletes.teams = failedTeamDeletes;
          } else {
            console.warn('Team deletes queued but meDeleteTeamRelational is unavailable');
            relationalSuccess = false;
          }
        }

        // 3-D. Persist queued support history deletions.
        const queuedHistoryDeletes = window.meDataPendingDeletes && Array.isArray(window.meDataPendingDeletes.supportHistory)
          ? window.meDataPendingDeletes.supportHistory.slice()
          : [];

        if (queuedHistoryDeletes.length > 0) {
          if (typeof meDeleteSupportHistoryRelational === 'function') {
            const failedHistoryDeletes = [];
            for (let i = 0; i < queuedHistoryDeletes.length; i++) {
              const historyId = queuedHistoryDeletes[i];
              const deleted = await meDeleteSupportHistoryRelational(historyId);
              if (!deleted) {
                failedHistoryDeletes.push(historyId);
                relationalSuccess = false;
              }
            }
            window.meDataPendingDeletes.supportHistory = failedHistoryDeletes;
          } else {
            console.warn('Support history deletes queued but meDeleteSupportHistoryRelational is unavailable');
            relationalSuccess = false;
          }
        }

        // 3-E. Persist queued product deletions.
        const queuedProductDeletes = window.meDataPendingDeletes && Array.isArray(window.meDataPendingDeletes.products)
          ? window.meDataPendingDeletes.products.slice()
          : [];

        if (queuedProductDeletes.length > 0) {
          if (typeof meDeleteProductRelational === 'function') {
            const failedProductDeletes = [];
            for (let i = 0; i < queuedProductDeletes.length; i++) {
              const productId = queuedProductDeletes[i];
              const deleted = await meDeleteProductRelational(productId);
              if (!deleted) {
                failedProductDeletes.push(productId);
                relationalSuccess = false;
              }
            }
            window.meDataPendingDeletes.products = failedProductDeletes;
          } else {
            console.warn('Product deletes queued but meDeleteProductRelational is unavailable');
            relationalSuccess = false;
          }
        }

        // 4. Skip holidays - already saved in step 0 for faster feedback

        if (relationalSuccess) {
        } else {
          console.warn('⚠ Relational save had issues');
        }
      } catch (relErr) {
        console.warn('Relational save error:', relErr.message);
        relationalSuccess = false;
      }
    } else {
      console.warn('Relational functions not available');
      relationalSuccess = false;
    }

    // Final status
    if (relationalSuccess) {
      if (typeof setSyncBadge === 'function') {
        setSyncBadge('saved', 'Saved');
      }
    } else {
      throw new Error('Relational save failed');
    }
  } catch (err) {
    console.error('[ME Capacity] SAVE ERROR:', err.message || err);
    if (typeof setSyncBadge === 'function') {
      setSyncBadge('error', 'Save failed');
    }
  } finally {
    window.meDataSaveInProgress = false;
    if (window.meDataSaveQueued) {
      window.meDataSaveQueued = false;
      await window.meDataSave(false);
    }
  }
};

window.meDataGetState = function() {
  return { ...meDataState };
};

window.meDataReset = function() {
  meDataState = meBuildEmptyDataState();
  window.meDataState = meDataState;
  window.meDataPendingDeletes = meBuildEmptyPendingDeletes();
};

// Console diagnostic helper - type meDiagnostics() in browser console
window.meDiagnostics = function() {
  const diagnostics = {
    initialized: window.meDataInitialized,
    saveInProgress: window.meDataSaveInProgress,
    saveQueued: window.meDataSaveQueued,
    hasSupabase: typeof supa !== 'undefined',
    hasCurrentUser: typeof currentUser !== 'undefined' && !!currentUser,
    currentUserId: currentUser?.id || 'N/A',
    data: {
      team: meDataState.team.length,
      tasks: meDataState.tasks.length,
      products: meDataState.products.length,
      holidays: meDataState.holidays.length,
      productSupportHistory: meDataState.productSupportHistory.length
    },
    pendingDeletes: {
      tasks: window.meDataPendingDeletes?.tasks?.length || 0,
      teams: window.meDataPendingDeletes?.teams?.length || 0,
      supportHistory: window.meDataPendingDeletes?.supportHistory?.length || 0,
      products: window.meDataPendingDeletes?.products?.length || 0
    },
    relationalFunctions: {
      meSaveTeamRelational: typeof meSaveTeamRelational === 'function',
      meSaveTaskRelational: typeof meSaveTaskRelational === 'function',
      meSaveProductRelational: typeof meSaveProductRelational === 'function',
      meSaveProductSupportHistoryRelational: typeof meSaveProductSupportHistoryRelational === 'function'
    }
  };
  console.log('%c[ME Capacity Diagnostics]', 'color: #0066cc; font-weight: bold; font-size: 14px;');
  console.table(diagnostics);
  console.log('Full state object:', meDataState);
  console.log('To test save manually, run: await meDataSave(true)');
  return diagnostics;
};

function meEnsureStructure() {
  if (!meDataState.team) meDataState.team = [];
  if (!meDataState.tasks) meDataState.tasks = [];
  if (!meDataState.products) meDataState.products = [];
  if (!meDataState.holidays) meDataState.holidays = [];
  if (!meDataState.productSupportHistory) meDataState.productSupportHistory = [];
  if (!meDataState.timeLogs) meDataState.timeLogs = [];
}