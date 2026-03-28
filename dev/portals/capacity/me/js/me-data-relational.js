/* ============================================================
   me-data-relational.js — ME Capacity Relational DB Operations

   Handles all Supabase table operations for:
   - me_teams, me_tasks, me_products, me_holidays

   Called by me-data.js during meDataInit() and meDataSave()
   ============================================================ */

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

// Get today's date in YYYY-MM-DD format
function getTodayDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function meNormalizeDepartmentTag(value, fallback = 'ME') {
  if (typeof window.capNormalizeDepartmentTag === 'function') {
    return window.capNormalizeDepartmentTag(value, fallback);
  }

  const normalized = (value || fallback || 'ME').toString().trim().toUpperCase();
  if (normalized === 'PM') return 'PM';
  if (normalized === 'LOG') return 'LOG';
  if (normalized === 'UNIT6') return 'UNIT6';
  return 'ME';
}

function meNormalizeMeTableDepartment(value) {
  void value;
  return 'ME';
}

function meNormalizePersistedProductDepartment(value, fallback = 'ME') {
  return meNormalizeMeTableDepartment(meNormalizeDepartmentTag(value, fallback));
}

function meNormalizeIsoDate(dateValue, fallbackDate) {
  if (typeof window.capNormalizeIsoDate === 'function') {
    return window.capNormalizeIsoDate(dateValue, fallbackDate);
  }

  if (!dateValue) return fallbackDate;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return fallbackDate;
  return parsed.toISOString().split('T')[0];
}

function meNormalizeDateRange(startDate, endDate, fallbackDate) {
  if (typeof window.capNormalizeDateRange === 'function') {
    return window.capNormalizeDateRange(startDate, endDate, fallbackDate);
  }

  let safeStart = meNormalizeIsoDate(startDate, fallbackDate);
  let safeEnd = meNormalizeIsoDate(endDate, fallbackDate);

  if (safeEnd < safeStart) {
    safeEnd = safeStart;
  }

  return { safeStart, safeEnd };
}

// ─────────────────────────────────────────────────────────────
// LOAD OPERATIONS — Fetch data from relational tables
// ─────────────────────────────────────────────────────────────

window.meLoadRelationalTeams = async function(userId) {
  try {
    const { data, error } = await supa
      .from('me_teams')
      .select('*');

    if (error) {
      console.warn('meLoadRelationalTeams error:', error.message);
      return [];
    }

    return (data || []).map(t => ({
      id: t.id,
      name: t.name,
      hoursPerWeek: t.hours_per_week,
      utilisation: t.utilisation,
      jobTitle: t.job_title || '',
      group: t.team_group || '',
      department: meNormalizeMeTableDepartment(t.department),
      startDate: t.start_date || '',
      endDate: t.end_date || '',
      createdAt: t.created_at
    }));
  } catch (err) {
    console.warn('meLoadRelationalTeams exception:', err.message);
    return [];
  }
};

window.meLoadRelationalProducts = async function(userId) {
  try {
    const { data, error } = await supa
      .from('me_products')
      .select('*');

    if (error) {
      console.warn('meLoadRelationalProducts error:', error.message);
      return [];
    }

    return (data || []).map(mp => ({
      id: mp.id,
      name: mp.name || '(Unknown Product)',
      productDatabaseId: mp.product_database_id,
      hoursPerWeek: mp.hours_per_week,
      department: meNormalizeMeTableDepartment(mp.department),
      notes: mp.notes,
      createdAt: mp.created_at,
      updatedAt: mp.updated_at
    }));
  } catch (err) {
    console.warn('meLoadRelationalProducts exception:', err.message);
    return [];
  }
};

window.meLoadRelationalProductSupportHistory = async function(userId) {
  try {
    const { data, error } = await supa
      .from('me_product_support_history')
      .select('*');

    if (error) {
      console.warn('meLoadRelationalProductSupportHistory error:', error.message);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      productId: row.product_id,
      hoursPerWeek: row.hours_per_week,
      kittingHours: row.kitting_hours ?? row.kitting_time_booking_hours,
      bookingInOutHours: row.booking_in_out_hours,
      kittingTimeBookingHours: row.kitting_hours ?? row.kitting_time_booking_hours,
      productMovementHours: row.product_movement_hours,
      effectiveDate: row.effective_date,
      endDate: row.end_date || '',
      changeReason: row.change_reason || '',
      notes: row.notes || '',
      department: meNormalizeMeTableDepartment(row.department),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (err) {
    console.warn('meLoadRelationalProductSupportHistory exception:', err.message);
    return [];
  }
};

window.meLoadRelationalHolidays = async function(userId) {
  try {
    const { data, error } = await supa
      .from('me_holidays')
      .select('*');

    if (error) {
      console.warn('meLoadRelationalHolidays error:', error.message);
      return [];
    }

    return (data || []).map(h => ({
      id: h.id,
      userId: h.user_id,
      personId: h.person_id,
      date: h.date,
      type: h.type,
      department: meNormalizeMeTableDepartment(h.department),
      createdAt: h.created_at
    }));
  } catch (err) {
    console.warn('meLoadRelationalHolidays exception:', err.message);
    return [];
  }
};

window.meLoadRelationalTasks = async function(userId) {
  try {
    const { data: tasksData, error: tasksError } = await supa
      .from('me_tasks')
      .select('*');

    if (tasksError) {
      console.warn('meLoadRelationalTasks error:', tasksError.message);
      return [];
    }

    return (tasksData || []).map(t => ({
      id:              t.id,
      name:            t.name,
      category:        t.category,
      type:            t.type || 'standard',
      assigneeId:      t.assignee_id || '',
      productId:       t.product_id  || '',
      startDate:       t.start_date  || '',
      endDate:         t.end_date    || '',
      totalHours:      t.total_hours || 0,
      percentComplete: t.percent_complete || 0,
      status:          t.status || 'SCHEDULED',
      isDisabled:      t.is_disabled === true,
      department:      meNormalizeMeTableDepartment(t.department),
      createdAt:       t.created_at
    }));
  } catch (err) {
    console.warn('meLoadRelationalTasks exception:', err.message);
    return [];
  }
};

window.meLoadTimeLogs = async function() {
  try {
    const { data, error } = await supa
      .from('time_logs')
      .select('id, user_id, task_id, hours_logged, log_date, notes, created_at')
      .order('log_date', { ascending: false });

    if (error) {
      console.warn('meLoadTimeLogs error:', error.message);
      return [];
    }

    return (data || []).map(row => ({
      id:          row.id,
      userId:      row.user_id,
      taskId:      row.task_id,
      hoursLogged: Number(row.hours_logged) || 0,
      logDate:     row.log_date,
      notes:       row.notes || '',
      createdAt:   row.created_at
    }));
  } catch (err) {
    console.warn('meLoadTimeLogs exception:', err.message);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────
// SAVE OPERATIONS — Insert or update individual records
// ─────────────────────────────────────────────────────────────

window.meSaveTeamRelational = async function(userId, teamMember) {
  try {
    const teamId = teamMember.id || (typeof meUUID === 'function' ? meUUID() : crypto.randomUUID());

    const payload = {
      id: teamId,
      user_id: userId,
      name: teamMember.name,
      hours_per_week: teamMember.hoursPerWeek,
      utilisation: teamMember.utilisation,
      job_title: teamMember.jobTitle,
      team_group: teamMember.group,
      start_date: teamMember.startDate || null,
      end_date: teamMember.endDate || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supa
      .from('me_teams')
      .upsert([payload], { onConflict: 'id' })
      .select('id');

    if (error) {
      console.warn('[ME Capacity] meSaveTeamRelational upsert error:', error.message);
      return false;
    }

    const persistedId = data && data.length > 0 ? data[0].id : teamId;
    teamMember.id = persistedId;
    return true;
  } catch (err) {
    console.warn('[ME Capacity] meSaveTeamRelational exception:', err.message);
    return false;
  }
};

window.meSaveProductRelational = async function(userId, product) {
  try {
    const productDatabaseId = product.productDatabaseId || product.product_database_id || null;
    let productId = product.id || null;

    if (productDatabaseId) {
      const { data: existingRows, error: lookupError } = await supa
        .from('me_products')
        .select('id')
        .eq('product_database_id', productDatabaseId)
        .limit(1);

      if (lookupError) {
        console.warn('[ME Capacity] meSaveProductRelational lookup error:', lookupError.message);
        return false;
      }

      if (Array.isArray(existingRows) && existingRows.length > 0 && existingRows[0].id) {
        productId = existingRows[0].id;
      }
    }

    if (!productId) {
      productId = typeof meUUID === 'function' ? meUUID() : crypto.randomUUID();
    }

    const payload = {
      id: productId,
      user_id: userId,
      name: product.name || '',
      product_database_id: productDatabaseId,
      hours_per_week: product.hoursPerWeek || product.hours_per_week || 0,
      notes: product.notes || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supa
      .from('me_products')
      .upsert([payload], { onConflict: 'id' })
      .select('id');

    if (error) {
      console.warn('[ME Capacity] meSaveProductRelational upsert error:', error.message);
      return false;
    }

    const persistedId = data && data.length > 0 ? data[0].id : productId;
    product.id = persistedId;
    return true;
  } catch (err) {
    console.warn('[ME Capacity] meSaveProductRelational exception:', err.message);
    return false;
  }
};

window.meSaveProductSupportHistoryRelational = async function(userId, historyRows) {
  try {
    const rows = Array.isArray(historyRows) ? historyRows : [];

    const { error: deleteError } = await supa
      .from('me_product_support_history')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.warn('meSaveProductSupportHistoryRelational delete error:', deleteError.message);
      return false;
    }

    if (rows.length === 0) {
      return true;
    }

    const payload = rows
      .filter(row => row && row.productId && row.effectiveDate)
      .map(row => ({
        id: row.id || (typeof meUUID === 'function' ? meUUID() : crypto.randomUUID()),
        user_id: userId,
        product_id: row.productId,
        hours_per_week: Number(row.hoursPerWeek || 0) || 0,
        kitting_hours: Number((row.kittingHours ?? row.kittingTimeBookingHours) || 0) || 0,
        booking_in_out_hours: Number(row.bookingInOutHours || 0) || 0,
        kitting_time_booking_hours: Number((row.kittingHours ?? row.kittingTimeBookingHours) || 0) || 0,
        product_movement_hours: Number(row.productMovementHours || 0) || 0,
        effective_date: row.effectiveDate,
        end_date: row.endDate || null,
        change_reason: row.changeReason || null,
        notes: row.notes || null,
        updated_at: new Date().toISOString()
      }));

    if (payload.length === 0) {
      return true;
    }

    const { error: insertError } = await supa
      .from('me_product_support_history')
      .insert(payload);

    if (insertError) {
      console.warn('meSaveProductSupportHistoryRelational insert error:', insertError.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('meSaveProductSupportHistoryRelational exception:', err.message);
    return false;
  }
};

window.meSaveTaskRelational = async function(userId, task) {
  try {
    const todayStr = getTodayDateString();
    const { safeStart, safeEnd } = meNormalizeDateRange(task.startDate, task.endDate, todayStr);
    const taskId = task.id || (typeof meUUID === 'function' ? meUUID() : crypto.randomUUID());
    task.id = taskId;
    task.startDate = safeStart;
    task.endDate = safeEnd;

    const payload = {
      id: taskId,
      user_id: userId,
      name: task.name,
      category: task.category,
      type: task.type || 'standard',
      assignee_id: task.assigneeId || null,
      product_id: task.productId || null,
      start_date: safeStart,
      end_date: safeEnd,
      total_hours: task.totalHours || 0,
      percent_complete: task.percentComplete || 0,
      status: task.status || 'SCHEDULED',
      is_disabled: task.isDisabled === true,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supa
      .from('me_tasks')
      .upsert([payload], { onConflict: 'id' })
      .select('id');

    if (error) {
      console.warn('[ME Capacity] meSaveTaskRelational upsert error:', error.message);
      return { success: false, taskId: null };
    }

    const persistedId = data && data.length > 0 ? data[0].id : taskId;
    task.id = persistedId;
    return { success: true, taskId: persistedId };
  } catch (err) {
    console.warn('[ME Capacity] meSaveTaskRelational exception:', err.message);
    return { success: false, taskId: null };
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE OPERATIONS — Remove records (cascade via FK)
// ─────────────────────────────────────────────────────────────

window.meDeleteTeamRelational = async function(teamId) {
  try {
    const { error } = await supa
      .from('me_teams')
      .delete()
      .eq('id', teamId);

    if (error) {
      console.warn('meDeleteTeamRelational error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('meDeleteTeamRelational exception:', err.message);
    return false;
  }
};

window.meDeleteTaskRelational = async function(taskId) {
  try {
    const { error } = await supa
      .from('me_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.warn('meDeleteTaskRelational error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('meDeleteTaskRelational exception:', err.message);
    return false;
  }
};

window.meDeleteSupportHistoryRelational = async function(historyId) {
  try {
    const { error } = await supa
      .from('me_product_support_history')
      .delete()
      .eq('id', historyId);

    if (error) {
      console.warn('meDeleteSupportHistoryRelational error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('meDeleteSupportHistoryRelational exception:', err.message);
    return false;
  }
};

window.meDeleteProductRelational = async function(productId) {
  try {
    const { error } = await supa
      .from('me_products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.warn('meDeleteProductRelational error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('meDeleteProductRelational exception:', err.message);
    return false;
  }
};

window.meDeleteHolidayRelational = async function(holidayId) {
  try {
    const { error } = await supa
      .from('me_holidays')
      .delete()
      .eq('id', holidayId);

    if (error) {
      console.warn('meDeleteHolidayRelational error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('meDeleteHolidayRelational exception:', err.message);
    return false;
  }
};

// ─────────────────────────────────────────────────────────────
// MIGRATION — Convert JSON blob to relational format
// ─────────────────────────────────────────────────────────────

window.meMigrateJsonToRelational = async function(userId, jsonData) {
  try {
    const results = {
      teams: 0,
      tasks: 0,
      products: 0,
      holidays: 0,
      errors: []
    };

    // Migrate team members
    if (jsonData.team && Array.isArray(jsonData.team)) {
      for (const member of jsonData.team) {
        const success = await meSaveTeamRelational(userId, member);
        if (success) results.teams++;
        else results.errors.push(`Failed to migrate team member: ${member.name}`);
      }
    }

    // Migrate products
    if (jsonData.products && Array.isArray(jsonData.products)) {
      for (const product of jsonData.products) {
        const success = await meSaveProductRelational(userId, product);
        if (success) results.products++;
        else results.errors.push(`Failed to migrate product: ${product.name}`);
      }
    }

    // Migrate tasks
    if (jsonData.tasks && Array.isArray(jsonData.tasks)) {
      for (const task of jsonData.tasks) {
        const taskResult = await meSaveTaskRelational(userId, task);
        if (taskResult.success) {
          results.tasks++;
        } else {
          results.errors.push(`Failed to migrate task: ${task.name}`);
        }
      }
    }

    // Migrate holidays (batch insert after deleting old ones)
    if (jsonData.holidays && Array.isArray(jsonData.holidays)) {
      const holidayData = jsonData.holidays
        .filter(h => h.personId)
        .map(h => {
          const row = {
            id: h.id,
            user_id: userId,
            person_id: h.personId,
            date: h.date,
            type: h.type
          };
          return row;
        });

      if (holidayData.length > 0) {
        // Delete ALL holidays first (shared-data model)
        await supa.from('me_holidays').delete().not('person_id', 'is', null);

        // Then insert new ones
        const { error: insertErr } = await supa
          .from('me_holidays')
          .insert(holidayData);

        if (!insertErr) {
          results.holidays = holidayData.length;
        } else {
          results.errors.push(`Failed to migrate holidays: ${insertErr.message}`);
        }
      }
    }

    return results;
  } catch (err) {
    console.warn('meMigrateJsonToRelational exception:', err.message);
    return { error: err.message };
  }
};
