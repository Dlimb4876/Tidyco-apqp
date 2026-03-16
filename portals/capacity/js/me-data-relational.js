/* ============================================================
   me-data-relational.js — ME Capacity Relational DB Operations

   Handles all Supabase table operations for:
   - me_teams, me_tasks, me_task_subtasks, me_task_pert_history,
     me_products, me_holidays

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
  const normalized = (value || fallback || 'ME').toString().trim().toUpperCase();
  return normalized === 'PM' ? 'PM' : 'ME';
}

function meNormalizeIsoDate(dateValue, fallbackDate) {
  if (!dateValue) return fallbackDate;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return fallbackDate;
  return parsed.toISOString().split('T')[0];
}

function meNormalizeDateRange(startDate, endDate, fallbackDate) {
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
      department: meNormalizeDepartmentTag(t.department, 'ME'),
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
      supportFrom: mp.support_from || '',
      supportUntil: mp.support_until || '',
      hoursPerWeek: mp.hours_per_week,
      department: meNormalizeDepartmentTag(mp.department, 'ME'),
      notes: mp.notes,
      createdAt: mp.created_at,
      updatedAt: mp.updated_at
    }));
  } catch (err) {
    console.warn('meLoadRelationalProducts exception:', err.message);
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
      personId: h.person_id,
      date: h.date,
      type: h.type,
      department: meNormalizeDepartmentTag(h.department, 'ME'),
      createdAt: h.created_at
    }));
  } catch (err) {
    console.warn('meLoadRelationalHolidays exception:', err.message);
    return [];
  }
};

window.meLoadRelationalTasks = async function(userId) {
  try {
    // Load tasks, subtasks, and PERT history in parallel
    const [
      { data: tasksData,    error: tasksError },
      { data: subtasksData, error: subtasksError },
      { data: pertData,     error: pertError }
    ] = await Promise.all([
      supa.from('me_tasks').select('*'),
      supa.from('me_task_subtasks').select('*'),
      supa.from('me_task_pert_history').select('*')
    ]);

    if (tasksError) {
      console.warn('meLoadRelationalTasks error:', tasksError.message);
      return [];
    }
    if (subtasksError) console.warn('meLoadRelationalTasks subtasks error:', subtasksError.message);
    if (pertError)     console.warn('meLoadRelationalTasks pert error:', pertError.message);

    // Group subtasks and PERT estimates by task_id for fast lookup
    const subtasksByTask = {};
    (subtasksData || []).forEach(st => {
      if (!subtasksByTask[st.task_id]) subtasksByTask[st.task_id] = [];
      subtasksByTask[st.task_id].push(st);
    });

    const pertByTask = {};
    (pertData || []).forEach(pe => {
      if (!pertByTask[pe.task_id]) pertByTask[pe.task_id] = [];
      pertByTask[pe.task_id].push(pe);
    });

    // Build task objects with subtasks and advancedEstimation reconstructed
    const tasks = (tasksData || []).map(t => {
      const rawSubtasks = subtasksByTask[t.id] || [];
      const rawPert     = pertByTask[t.id]     || [];
      const hasAdvancedEstimation = rawSubtasks.length > 0 || rawPert.length > 0;

      // Subtasks array — used by capacity calculations
      const subtasks = rawSubtasks.map(st => ({
        id:         st.id,
        name:       st.name,
        assigneeId: st.assignee_id || '',
        hours:      st.hours || 0,
        startDate:  st.start_date || t.start_date || '',
        endDate:    st.end_date   || t.end_date   || '',
        source:     st.source || 'pert'
      }));

      // Reconstruct advancedEstimation so the PERT editor can re-open correctly
      let advancedEstimation = null;
      if (hasAdvancedEstimation) {
        const confidenceLevel = rawPert.length > 0 ? (rawPert[0].confidence_level || 1.0) : 1.0;

        const estimates = rawPert.map(pe => ({
          id:          pe.estimate_id || pe.id,
          name:        pe.name,
          optimistic:  pe.optimistic  || 0,
          mostLikely:  pe.most_likely || 0,
          pessimistic: pe.pessimistic || 0,
          assignedTo:  pe.assignee_id || '',
          finalHours:  pe.final_hours || 0
        }));

        const totalFinalHours = Math.round(
          (rawPert.length > 0
            ? estimates.reduce((s, e) => s + (e.finalHours || 0), 0)
            : subtasks.reduce((s, st) => s + (st.hours || 0), 0)
          ) * 10
        ) / 10;

        advancedEstimation = {
          totalFinalHours,
          confidenceLevel,
          pertEstimates: estimates,
          pertData: {
            estimates,
            confidenceLevel,
            totalCalculatedHours: totalFinalHours,
            lastUpdated: t.updated_at || ''
          }
        };
      }

      return {
        id:                 t.id,
        name:               t.name,
        category:           t.category,
        type:               t.type || 'standard',
        assigneeId:         t.assignee_id || '',
        productId:          t.product_id  || '',
        startDate:          t.start_date  || '',
        endDate:            t.end_date    || '',
        totalHours:         t.total_hours || 0,
        status:             t.status || 'SCHEDULED',
        department:         meNormalizeDepartmentTag(t.department, 'ME'),
        createdAt:          t.created_at,
        subtasks,
        advancedEstimation
      };
    });

    return tasks;
  } catch (err) {
    console.warn('meLoadRelationalTasks exception:', err.message);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────
// SAVE OPERATIONS — Insert or update individual records
// ─────────────────────────────────────────────────────────────

window.meSaveTeamRelational = async function(userId, teamMember) {
  try {
    const department = meNormalizeDepartmentTag(teamMember.department, 'ME');
    const teamId = teamMember.id || (typeof meUUID === 'function' ? meUUID() : crypto.randomUUID());

    const payload = {
      id: teamId,
      user_id: userId,
      name: teamMember.name,
      hours_per_week: teamMember.hoursPerWeek,
      utilisation: teamMember.utilisation,
      job_title: teamMember.jobTitle,
      team_group: teamMember.group,
      department,
      start_date: teamMember.startDate || null,
      end_date: teamMember.endDate || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supa
      .from('me_teams')
      .upsert([payload], { onConflict: 'id' })
      .select('id');

    if (error) {
      console.warn('meSaveTeamRelational upsert error:', error.message);
      return false;
    }

    const persistedId = data && data.length > 0 ? data[0].id : teamId;
    teamMember.id = persistedId;
    return true;
  } catch (err) {
    console.warn('meSaveTeamRelational exception:', err.message);
    return false;
  }
};

window.meSaveProductRelational = async function(userId, product) {
  try {
    const department = meNormalizeDepartmentTag(product.department, 'ME');
    const supportFrom = product.supportFrom || product.support_from || null;
    const supportUntil = product.supportUntil || product.support_until || null;
    const productId = product.id || (typeof meUUID === 'function' ? meUUID() : crypto.randomUUID());

    const payload = {
      id: productId,
      user_id: userId,
      name: product.name || '',
      product_database_id: product.productDatabaseId || null,
      support_from: supportFrom || null,
      support_until: supportUntil || null,
      hours_per_week: product.hoursPerWeek || product.hours_per_week || 0,
      department,
      notes: product.notes || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supa
      .from('me_products')
      .upsert([payload], { onConflict: 'id' })
      .select('id');

    if (error) {
      console.warn('meSaveProductRelational upsert error:', error.message);
      return false;
    }

    const persistedId = data && data.length > 0 ? data[0].id : productId;
    product.id = persistedId;
    return true;
  } catch (err) {
    console.warn('meSaveProductRelational exception:', err.message);
    return false;
  }
};

window.meSaveTaskRelational = async function(userId, task) {
  try {
    const department = meNormalizeDepartmentTag(task.department, 'ME');
    const todayStr = getTodayDateString();
    const { safeStart, safeEnd } = meNormalizeDateRange(task.startDate, task.endDate, todayStr);
    const taskId = task.id || (typeof meUUID === 'function' ? meUUID() : crypto.randomUUID());
    task.id = taskId;
    task.startDate = safeStart;
    task.endDate = safeEnd;

    // For tasks with advanced estimation, use PERT-calculated hours so total_hours stays accurate after reload
    const totalHours = (task.advancedEstimation && task.advancedEstimation.totalFinalHours)
      ? task.advancedEstimation.totalFinalHours
      : (task.totalHours || 0);

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
      total_hours: totalHours,
      status: task.status || 'SCHEDULED',
      department,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supa
      .from('me_tasks')
      .upsert([payload], { onConflict: 'id' })
      .select('id');

    if (error) {
      console.warn('meSaveTaskRelational upsert error:', error.message);
      return { success: false, taskId: null };
    }

    const persistedId = data && data.length > 0 ? data[0].id : taskId;
    task.id = persistedId;
    await meSaveTaskSubtasksRelational(userId, persistedId, task);
    return { success: true, taskId: persistedId };
  } catch (err) {
    console.warn('meSaveTaskRelational exception:', err.message);
    return { success: false, taskId: null };
  }
};


// ─────────────────────────────────────────────────────────────
// SUBTASK + PERT SAVE — Write PERT estimation data to DB
// Called by meSaveTaskRelational after the parent task is saved
// ─────────────────────────────────────────────────────────────

window.meSaveTaskSubtasksRelational = async function(userId, taskId, task) {
  try {
    // Tasks without advanced estimation: delete any orphaned rows left over from a previous PERT estimation
    // (happens when a task is cleared via meEstimationClearData — old me_task_pert_history / me_task_subtasks rows may remain)
    const hasAdvancedEstimation = task.subtasks && task.subtasks.length > 0 || 
                                   (task.advancedEstimation && task.advancedEstimation.pertData);
    if (!hasAdvancedEstimation) {
      await supa.from('me_task_subtasks').delete().eq('task_id', taskId);
      await supa.from('me_task_pert_history').delete().eq('task_id', taskId);
      return true;
    }

    const subtasks = task.subtasks || [];
    const pertEstimates = (task.advancedEstimation && task.advancedEstimation.pertData)
      ? (task.advancedEstimation.pertData.estimates || [])
      : [];
    const confidenceLevel = (task.advancedEstimation && task.advancedEstimation.confidenceLevel) || 1.0;
    const todayStr = getTodayDateString();
    const { safeStart, safeEnd } = meNormalizeDateRange(task.startDate, task.endDate, todayStr);

    // Delete existing subtasks and PERT history for this task then re-insert
    await supa.from('me_task_subtasks').delete().eq('task_id', taskId);
    await supa.from('me_task_pert_history').delete().eq('task_id', taskId);

    // Insert subtasks
    if (subtasks.length > 0) {
      const subtaskRows = subtasks.map(st => ({
        user_id:    userId,
        task_id:    taskId,
        name:       st.name,
        assignee_id: st.assigneeId || null,
        hours:      st.hours || 0,
        start_date: meNormalizeDateRange(st.startDate || safeStart, st.endDate || safeEnd, safeStart).safeStart,
        end_date:   meNormalizeDateRange(st.startDate || safeStart, st.endDate || safeEnd, safeStart).safeEnd,
        source:     st.source || 'pert'
      }));

      const { error: insSubErr } = await supa
        .from('me_task_subtasks')
        .insert(subtaskRows);

      if (insSubErr) {
        console.warn('meSaveTaskSubtasksRelational subtask insert error:', insSubErr.message);
      }
    }

    // Insert PERT 3-point estimates
    if (pertEstimates.length > 0) {
      const pertRows = pertEstimates.map(est => ({
        user_id:          userId,
        task_id:          taskId,
        estimate_id:      est.id || null,
        name:             est.name,
        optimistic:       parseFloat(est.optimistic)  || 0,
        most_likely:      parseFloat(est.mostLikely)  || 0,
        pessimistic:      parseFloat(est.pessimistic) || 0,
        confidence_level: confidenceLevel,
        final_hours:      parseFloat(est.finalHours)  || 0,
        assignee_id:      est.assignedTo || null
      }));

      const { error: insPertErr } = await supa
        .from('me_task_pert_history')
        .insert(pertRows);

      if (insPertErr) {
        console.warn('meSaveTaskSubtasksRelational pert insert error:', insPertErr.message);
      }
    }

    return true;
  } catch (err) {
    console.warn('meSaveTaskSubtasksRelational exception:', err.message);
    return false;
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

    // Migrate tasks and subtasks
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
            type: h.type,
            department: meNormalizeDepartmentTag(h.department, 'ME')
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
