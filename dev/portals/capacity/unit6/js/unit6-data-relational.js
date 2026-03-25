/* ============================================================
   unit6-data-relational.js — Unit 6 Capacity Relational DB Operations

   Handles all Supabase table operations for:
   - unit6_teams, unit6_tasks, unit6_products, unit6_holidays,
     unit6_product_support_history

   Called by unit6-data.js during unit6DataInit() and unit6DataSave()
   ============================================================ */

// ─────────────────────────────────────────────────────────────
// LOAD OPERATIONS
// ─────────────────────────────────────────────────────────────

window.unit6LoadRelationalTeams = async function() {
  try {
    const { data, error } = await supa.from('unit6_teams').select('*');
    if (error) { console.warn('unit6LoadRelationalTeams error:', error.message); return []; }
    return (data || []).map(t => ({
      id: t.id, name: t.name, hoursPerWeek: t.hours_per_week,
      utilisation: t.utilisation, jobTitle: t.job_title || '',
      group: t.team_group || '', department: 'UNIT6',
      startDate: t.start_date || '', endDate: t.end_date || '',
      createdAt: t.created_at
    }));
  } catch (err) { console.warn('unit6LoadRelationalTeams exception:', err.message); return []; }
};

window.unit6LoadRelationalProducts = async function() {
  try {
    const { data, error } = await supa.from('unit6_products').select('*');
    if (error) { console.warn('unit6LoadRelationalProducts error:', error.message); return []; }
    return (data || []).map(mp => ({
      id: mp.id, name: mp.name || '(Unknown Product)',
      productDatabaseId: mp.product_database_id,
      hoursPerWeek: mp.hours_per_week, department: 'UNIT6',
      notes: mp.notes, createdAt: mp.created_at, updatedAt: mp.updated_at
    }));
  } catch (err) { console.warn('unit6LoadRelationalProducts exception:', err.message); return []; }
};

window.unit6LoadRelationalProductSupportHistory = async function() {
  try {
    const { data, error } = await supa.from('unit6_product_support_history').select('*');
    if (error) { console.warn('unit6LoadRelationalProductSupportHistory error:', error.message); return []; }
    return (data || []).map(row => ({
      id: row.id, productId: row.product_id,
      hoursPerWeek: row.hours_per_week,
      kittingHours: row.kitting_hours ?? row.kitting_time_booking_hours,
      bookingInOutHours: row.booking_in_out_hours,
      kittingTimeBookingHours: row.kitting_hours ?? row.kitting_time_booking_hours,
      productMovementHours: row.product_movement_hours,
      effectiveDate: row.effective_date, endDate: row.end_date || '',
      changeReason: row.change_reason || '', notes: row.notes || '',
      department: 'UNIT6', createdAt: row.created_at, updatedAt: row.updated_at
    }));
  } catch (err) { console.warn('unit6LoadRelationalProductSupportHistory exception:', err.message); return []; }
};

window.unit6LoadRelationalHolidays = async function() {
  try {
    const { data, error } = await supa.from('unit6_holidays').select('*');
    if (error) { console.warn('unit6LoadRelationalHolidays error:', error.message); return []; }
    return (data || []).map(h => ({
      id: h.id, userId: h.user_id, personId: h.person_id,
      date: h.date, type: h.type, department: 'UNIT6', createdAt: h.created_at
    }));
  } catch (err) { console.warn('unit6LoadRelationalHolidays exception:', err.message); return []; }
};

window.unit6LoadRelationalTasks = async function() {
  try {
    const { data, error } = await supa.from('unit6_tasks').select('*');
    if (error) { console.warn('unit6LoadRelationalTasks error:', error.message); return []; }
    return (data || []).map(t => ({
      id: t.id, name: t.name, category: t.category,
      type: t.type || 'standard', assigneeId: t.assignee_id || '',
      productId: t.product_id || '', startDate: t.start_date || '',
      endDate: t.end_date || '', totalHours: t.total_hours || 0,
      status: t.status || 'SCHEDULED', isDisabled: t.is_disabled === true,
      department: 'UNIT6', createdAt: t.created_at
    }));
  } catch (err) { console.warn('unit6LoadRelationalTasks exception:', err.message); return []; }
};

// ─────────────────────────────────────────────────────────────
// SAVE OPERATIONS
// ─────────────────────────────────────────────────────────────

window.unit6SaveTeamRelational = async function(userId, teamMember) {
  try {
    const teamId = teamMember.id || (typeof meUUID === 'function' ? meUUID() : crypto.randomUUID());
    const payload = {
      id: teamId, user_id: userId, name: teamMember.name,
      hours_per_week: teamMember.hoursPerWeek, utilisation: teamMember.utilisation,
      job_title: teamMember.jobTitle, team_group: teamMember.group,
      start_date: teamMember.startDate || null,
      end_date: teamMember.endDate || null, updated_at: new Date().toISOString()
    };
    const { data, error } = await supa.from('unit6_teams').upsert([payload], { onConflict: 'id' }).select('id');
    if (error) { console.warn('unit6SaveTeamRelational error:', error.message); return false; }
    teamMember.id = data && data.length > 0 ? data[0].id : teamId;
    return true;
  } catch (err) { console.warn('unit6SaveTeamRelational exception:', err.message); return false; }
};

window.unit6SaveProductRelational = async function(userId, product) {
  try {
    const productDatabaseId = product.productDatabaseId || product.product_database_id || null;
    let productId = product.id || null;

    if (productDatabaseId) {
      const { data: existing, error: lookupErr } = await supa
        .from('unit6_products').select('id').eq('product_database_id', productDatabaseId).limit(1);
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
    const { data, error } = await supa.from('unit6_products').upsert([payload], { onConflict: 'id' }).select('id');
    if (error) { console.warn('unit6SaveProductRelational error:', error.message); return false; }
    product.id = data && data.length > 0 ? data[0].id : productId;
    return true;
  } catch (err) { console.warn('unit6SaveProductRelational exception:', err.message); return false; }
};

window.unit6SaveProductSupportHistoryRelational = async function(userId, historyRows) {
  try {
    const rows = Array.isArray(historyRows) ? historyRows : [];
    const { error: deleteError } = await supa.from('unit6_product_support_history').delete().eq('user_id', userId);
    if (deleteError) { console.warn('unit6SavePSH delete error:', deleteError.message); return false; }
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

    const { error: insertError } = await supa.from('unit6_product_support_history').insert(payload);
    if (insertError) { console.warn('unit6SavePSH insert error:', insertError.message); return false; }
    return true;
  } catch (err) { console.warn('unit6SavePSH exception:', err.message); return false; }
};

window.unit6SaveTaskRelational = async function(userId, task) {
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
    const { data, error } = await supa.from('unit6_tasks').upsert([payload], { onConflict: 'id' }).select('id');
    if (error) { console.warn('unit6SaveTaskRelational error:', error.message); return { success: false, taskId: null }; }
    task.id = data && data.length > 0 ? data[0].id : taskId;
    return { success: true, taskId: task.id };
  } catch (err) { console.warn('unit6SaveTaskRelational exception:', err.message); return { success: false, taskId: null }; }
};

// ─────────────────────────────────────────────────────────────
// DELETE OPERATIONS
// ─────────────────────────────────────────────────────────────

window.unit6DeleteTeamRelational = async function(teamId) {
  try {
    const { error } = await supa.from('unit6_teams').delete().eq('id', teamId);
    if (error) { console.warn('unit6DeleteTeamRelational error:', error.message); return false; }
    return true;
  } catch (err) { console.warn('unit6DeleteTeamRelational exception:', err.message); return false; }
};

window.unit6DeleteTaskRelational = async function(taskId) {
  try {
    const { error } = await supa.from('unit6_tasks').delete().eq('id', taskId);
    if (error) { console.warn('unit6DeleteTaskRelational error:', error.message); return false; }
    return true;
  } catch (err) { console.warn('unit6DeleteTaskRelational exception:', err.message); return false; }
};

window.unit6DeleteProductRelational = async function(productId) {
  try {
    const { error } = await supa.from('unit6_products').delete().eq('id', productId);
    if (error) { console.warn('unit6DeleteProductRelational error:', error.message); return false; }
    return true;
  } catch (err) { console.warn('unit6DeleteProductRelational exception:', err.message); return false; }
};

window.unit6DeleteHolidayRelational = async function(holidayId) {
  try {
    const { error } = await supa.from('unit6_holidays').delete().eq('id', holidayId);
    if (error) { console.warn('unit6DeleteHolidayRelational error:', error.message); return false; }
    return true;
  } catch (err) { console.warn('unit6DeleteHolidayRelational exception:', err.message); return false; }
};

window.unit6DeleteSupportHistoryRelational = async function(historyId) {
  try {
    const { error } = await supa.from('unit6_product_support_history').delete().eq('id', historyId);
    if (error) { console.warn('unit6DeleteSupportHistoryRelational error:', error.message); return false; }
    return true;
  } catch (err) { console.warn('unit6DeleteSupportHistoryRelational exception:', err.message); return false; }
};
