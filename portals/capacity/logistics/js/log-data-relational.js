/* ============================================================
   log-data-relational.js — Logistics Capacity Relational DB Operations

   Handles all Supabase table operations for:
   - log_teams, log_tasks, log_products, log_holidays,
     log_product_support_history

   Called by log-data.js during logDataInit() and logDataSave()
   ============================================================ */

// ─────────────────────────────────────────────────────────────
// LOAD OPERATIONS
// ─────────────────────────────────────────────────────────────

window.logLoadRelationalTeams = async function() {
  try {
    const { data, error } = await supa.from('log_teams').select('*');
    if (error) { console.warn('logLoadRelationalTeams error:', error.message); return []; }
    return (data || []).map(t => ({
      id: t.id, name: t.name, hoursPerWeek: t.hours_per_week,
      utilisation: t.utilisation, jobTitle: t.job_title || '',
      group: t.team_group || '', department: 'LOG',
      startDate: t.start_date || '', endDate: t.end_date || '',
      createdAt: t.created_at
    }));
  } catch (err) { console.warn('logLoadRelationalTeams exception:', err.message); return []; }
};

window.logLoadRelationalProducts = async function() {
  try {
    const { data, error } = await supa.from('log_products').select('*');
    if (error) { console.warn('logLoadRelationalProducts error:', error.message); return []; }
    return (data || []).map(mp => ({
      id: mp.id, name: mp.name || '(Unknown Product)',
      productDatabaseId: mp.product_database_id,
      hoursPerWeek: mp.hours_per_week, department: 'LOG',
      notes: mp.notes, createdAt: mp.created_at, updatedAt: mp.updated_at
    }));
  } catch (err) { console.warn('logLoadRelationalProducts exception:', err.message); return []; }
};

window.logLoadRelationalProductSupportHistory = async function() {
  try {
    const { data, error } = await supa.from('log_product_support_history').select('*');
    if (error) { console.warn('logLoadRelationalProductSupportHistory error:', error.message); return []; }
    return (data || []).map(row => ({
      id: row.id, productId: row.product_id,
      hoursPerWeek: row.hours_per_week,
      kittingHours: row.kitting_hours ?? row.kitting_time_booking_hours,
      bookingInOutHours: row.booking_in_out_hours,
      kittingTimeBookingHours: row.kitting_hours ?? row.kitting_time_booking_hours,
      productMovementHours: row.product_movement_hours,
      effectiveDate: row.effective_date, endDate: row.end_date || '',
      changeReason: row.change_reason || '', notes: row.notes || '',
      department: 'LOG', createdAt: row.created_at, updatedAt: row.updated_at
    }));
  } catch (err) { console.warn('logLoadRelationalProductSupportHistory exception:', err.message); return []; }
};

window.logLoadRelationalHolidays = async function() {
  try {
    const { data, error } = await supa.from('log_holidays').select('*');
    if (error) { console.warn('logLoadRelationalHolidays error:', error.message); return []; }
    return (data || []).map(h => ({
      id: h.id, userId: h.user_id, personId: h.person_id,
      date: h.date, type: h.type, department: 'LOG', createdAt: h.created_at
    }));
  } catch (err) { console.warn('logLoadRelationalHolidays exception:', err.message); return []; }
};

window.logLoadRelationalTasks = async function() {
  try {
    const { data, error } = await supa.from('log_tasks').select('*');
    if (error) { console.warn('logLoadRelationalTasks error:', error.message); return []; }
    return (data || []).map(t => ({
      id: t.id, name: t.name, category: t.category,
      type: t.type || 'standard', assigneeId: t.assignee_id || '',
      productId: t.product_id || '', startDate: t.start_date || '',
      endDate: t.end_date || '', totalHours: t.total_hours || 0,
      status: t.status || 'SCHEDULED', isDisabled: t.is_disabled === true,
      department: 'LOG', createdAt: t.created_at
    }));
  } catch (err) { console.warn('logLoadRelationalTasks exception:', err.message); return []; }
};

// ─────────────────────────────────────────────────────────────
// SAVE OPERATIONS
// ─────────────────────────────────────────────────────────────

window.logSaveTeamRelational = async function(userId, teamMember) {
  try {
    const teamId = teamMember.id || (typeof meUUID === 'function' ? meUUID() : crypto.randomUUID());
    const payload = {
      id: teamId, user_id: userId, name: teamMember.name,
      hours_per_week: teamMember.hoursPerWeek, utilisation: teamMember.utilisation,
      job_title: teamMember.jobTitle, team_group: teamMember.group,
      start_date: teamMember.startDate || null,
      end_date: teamMember.endDate || null, updated_at: new Date().toISOString()
    };
    const { data, error } = await supa.from('log_teams').upsert([payload], { onConflict: 'id' }).select('id');
    if (error) { console.warn('logSaveTeamRelational error:', error.message); return false; }
    teamMember.id = data && data.length > 0 ? data[0].id : teamId;
    return true;
  } catch (err) { console.warn('logSaveTeamRelational exception:', err.message); return false; }
};

window.logSaveProductRelational = async function(userId, product) {
  try {
    const productDatabaseId = product.productDatabaseId || product.product_database_id || null;
    let productId = product.id || null;

    if (productDatabaseId) {
      const { data: existing, error: lookupErr } = await supa
        .from('log_products').select('id').eq('product_database_id', productDatabaseId).limit(1);
      if (!lookupErr && Array.isArray(existing) && existing.length > 0) {
        productId = existing[0].id;
      }
    }
    if (!productId) productId = typeof meUUID === 'function' ? meUUID() : crypto.randomUUID();

    const payload = {
      id: productId, user_id: userId, name: product.name || '',
      product_database_id: productDatabaseId,
      hours_per_week: product.hoursPerWeek || product.hours_per_week || 0,
      notes: product.notes || null,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supa.from('log_products').upsert([payload], { onConflict: 'id' }).select('id');
    if (error) { console.warn('logSaveProductRelational error:', error.message); return false; }
    product.id = data && data.length > 0 ? data[0].id : productId;
    return true;
  } catch (err) { console.warn('logSaveProductRelational exception:', err.message); return false; }
};

window.logSaveProductSupportHistoryRelational = async function(userId, historyRows) {
  try {
    const rows = Array.isArray(historyRows) ? historyRows : [];
    const { error: deleteError } = await supa.from('log_product_support_history').delete().eq('user_id', userId);
    if (deleteError) { console.warn('logSavePSH delete error:', deleteError.message); return false; }
    if (rows.length === 0) return true;

    const payload = rows
      .filter(row => row && row.productId && row.effectiveDate)
      .map(row => ({
        id: row.id || (typeof meUUID === 'function' ? meUUID() : crypto.randomUUID()),
        user_id: userId, product_id: row.productId,
        hours_per_week: Number(row.hoursPerWeek || 0) || 0,
        kitting_hours: Number((row.kittingHours ?? row.kittingTimeBookingHours) || 0) || 0,
        booking_in_out_hours: Number(row.bookingInOutHours || 0) || 0,
        kitting_time_booking_hours: Number((row.kittingHours ?? row.kittingTimeBookingHours) || 0) || 0,
        product_movement_hours: Number(row.productMovementHours || 0) || 0,
        effective_date: row.effectiveDate, end_date: row.endDate || null,
        change_reason: row.changeReason || null, notes: row.notes || null,
        updated_at: new Date().toISOString()
      }));
    if (payload.length === 0) return true;

    const { error: insertError } = await supa.from('log_product_support_history').insert(payload);
    if (insertError) { console.warn('logSavePSH insert error:', insertError.message); return false; }
    return true;
  } catch (err) { console.warn('logSavePSH exception:', err.message); return false; }
};

window.logSaveTaskRelational = async function(userId, task) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const { safeStart, safeEnd } = meNormalizeDateRange(task.startDate, task.endDate, todayStr);
    const taskId = task.id || (typeof meUUID === 'function' ? meUUID() : crypto.randomUUID());
    task.id = taskId; task.startDate = safeStart; task.endDate = safeEnd;

    const payload = {
      id: taskId, user_id: userId, name: task.name, category: task.category,
      type: task.type || 'standard', assignee_id: task.assigneeId || null,
      product_id: task.productId || null, start_date: safeStart, end_date: safeEnd,
      total_hours: task.totalHours || 0, status: task.status || 'SCHEDULED',
      is_disabled: task.isDisabled === true,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supa.from('log_tasks').upsert([payload], { onConflict: 'id' }).select('id');
    if (error) { console.warn('logSaveTaskRelational error:', error.message); return { success: false, taskId: null }; }
    task.id = data && data.length > 0 ? data[0].id : taskId;
    return { success: true, taskId: task.id };
  } catch (err) { console.warn('logSaveTaskRelational exception:', err.message); return { success: false, taskId: null }; }
};

// ─────────────────────────────────────────────────────────────
// DELETE OPERATIONS
// ─────────────────────────────────────────────────────────────

window.logDeleteTeamRelational = async function(teamId) {
  try {
    const { error } = await supa.from('log_teams').delete().eq('id', teamId);
    if (error) { console.warn('logDeleteTeamRelational error:', error.message); return false; }
    return true;
  } catch (err) { console.warn('logDeleteTeamRelational exception:', err.message); return false; }
};

window.logDeleteTaskRelational = async function(taskId) {
  try {
    const { error } = await supa.from('log_tasks').delete().eq('id', taskId);
    if (error) { console.warn('logDeleteTaskRelational error:', error.message); return false; }
    return true;
  } catch (err) { console.warn('logDeleteTaskRelational exception:', err.message); return false; }
};

window.logDeleteProductRelational = async function(productId) {
  try {
    const { error } = await supa.from('log_products').delete().eq('id', productId);
    if (error) { console.warn('logDeleteProductRelational error:', error.message); return false; }
    return true;
  } catch (err) { console.warn('logDeleteProductRelational exception:', err.message); return false; }
};

window.logDeleteHolidayRelational = async function(holidayId) {
  try {
    const { error } = await supa.from('log_holidays').delete().eq('id', holidayId);
    if (error) { console.warn('logDeleteHolidayRelational error:', error.message); return false; }
    return true;
  } catch (err) { console.warn('logDeleteHolidayRelational exception:', err.message); return false; }
};

window.logDeleteSupportHistoryRelational = async function(historyId) {
  try {
    const { error } = await supa.from('log_product_support_history').delete().eq('id', historyId);
    if (error) { console.warn('logDeleteSupportHistoryRelational error:', error.message); return false; }
    return true;
  } catch (err) { console.warn('logDeleteSupportHistoryRelational exception:', err.message); return false; }
};
