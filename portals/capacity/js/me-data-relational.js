/* ============================================================
   me-data-relational.js — ME Capacity Relational DB Operations

   Handles all Supabase table operations for:
   - me_teams, me_tasks, me_task_subtasks, me_task_pert_history
   - me_products, me_holidays

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

// ─────────────────────────────────────────────────────────────
// LOAD OPERATIONS — Fetch data from relational tables
// ─────────────────────────────────────────────────────────────

window.meLoadRelationalTeams = async function(userId) {
  try {
    const { data, error } = await supa
      .from('me_teams')
      .select('*')
      .eq('user_id', userId);

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
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.warn('meLoadRelationalProducts error:', error.message);
      return [];
    }

    return (data || []).map(mp => ({
      id: mp.id,
      name: mp.name || '(Unknown Product)',
      productId: mp.product_database_id,
      supportFrom: mp.support_from,
      supportUntil: mp.support_until,
      hoursPerWeek: mp.hours_per_week,
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
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.warn('meLoadRelationalHolidays error:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('meLoadRelationalHolidays exception:', err.message);
    return [];
  }
};

window.meLoadRelationalTasks = async function(userId) {
  try {
    // Load all tasks for this user
    const { data: tasksData, error: tasksError } = await supa
      .from('me_tasks')
      .select('*')
      .eq('user_id', userId);

    if (tasksError) {
      console.warn('meLoadRelationalTasks error:', tasksError.message);
      return [];
    }

    // Transform to camelCase
    const tasks = (tasksData || []).map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      type: t.type || 'standard',
      assigneeId: t.assignee_id || '',
      productId: t.product_id || '',
      startDate: t.start_date || '',
      endDate: t.end_date || '',
      totalHours: t.total_hours || 0,
      advancedEstimation: null,
      subtasks: [],
      createdAt: t.created_at
    }));

    // Load subtasks and PERT history for root tasks
    const taskIds = tasks.filter(t => t.type === 'root').map(t => t.id);

    if (taskIds.length > 0) {
      const { data: subtasksData, error: subtasksError } = await supa
        .from('me_task_subtasks')
        .select('*')
        .in('task_id', taskIds);

      if (subtasksError) {
        console.warn('meLoadRelationalTasks subtasks error:', subtasksError.message);
      } else {
        // Transform subtasks to camelCase
        const subtasks = (subtasksData || []).map(st => ({
          id: st.id,
          task_id: st.task_id,
          name: st.name,
          assigneeId: st.assignee_id || '',
          hours: st.hours || 0,
          startDate: st.start_date || '',
          endDate: st.end_date || '',
          source: st.source || 'pert'
        }));

        tasks.forEach(task => {
          if (task.type === 'root') {
            task.subtasks = subtasks.filter(st => st.task_id === task.id);
          }
        });
      }

      const { data: historyData, error: historyError } = await supa
        .from('me_task_pert_history')
        .select('*')
        .in('task_id', taskIds);

      if (historyError) {
        console.warn('meLoadRelationalTasks history error:', historyError.message);
      } else {
        const history = historyData || [];
        tasks.forEach(task => {
          if (task.type === 'root') {
            task.pertHistory = history.filter(h => h.task_id === task.id);
          }
        });
      }
    }

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
    const { error } = await supa
      .from('me_teams')
      .upsert({
        id: teamMember.id,
        user_id: userId,
        name: teamMember.name,
        hours_per_week: teamMember.hoursPerWeek,
        utilisation: teamMember.utilisation,
        job_title: teamMember.jobTitle,
        team_group: teamMember.group,
        start_date: teamMember.startDate || null,
        end_date: teamMember.endDate || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('meSaveTeamRelational upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('meSaveTeamRelational exception:', err.message);
    return false;
  }
};

window.meSaveProductRelational = async function(userId, product) {
  try {
    const productId = product.productId || product.id;

    const supportFrom = product.supportFrom || product.support_from || null;
    const supportUntil = product.supportUntil || product.support_until || null;

    const { error } = await supa
      .from('me_products')
      .upsert({
        id: product.id,
        user_id: userId,
        name: product.name || '',
        product_database_id: productId || null,
        support_from: supportFrom || null,
        support_until: supportUntil || null,
        hours_per_week: product.hoursPerWeek || product.hours_per_week || 0,
        notes: product.notes || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('meSaveProductRelational upsert error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('meSaveProductRelational exception:', err.message);
    return false;
  }
};

window.meSaveTaskRelational = async function(userId, task) {
  try {
    const todayStr = getTodayDateString();
    const startDate = task.startDate || todayStr;
    const endDate = task.endDate || todayStr;

    if (!task.id) {
      // Insert new task and capture the returned ID
      const { data, error } = await supa
        .from('me_tasks')
        .insert([{
          user_id: userId,
          name: task.name,
          category: task.category,
          type: task.type,
          assignee_id: task.assigneeId || null,
          product_id: task.productId || null,
          start_date: startDate,
          end_date: endDate,
          total_hours: task.totalHours || (task.type === 'root' ? (task.advancedEstimation?.totalFinalHours || 0) : 0)
        }])
        .select('id');

      if (error) {
        console.warn('meSaveTaskRelational insert error:', error.message);
        return { success: false, taskId: null };
      }

      // Return the newly created task ID
      const newId = data && data.length > 0 ? data[0].id : null;
      return { success: true, taskId: newId };
    } else {
      // Update existing task
      const { error } = await supa
        .from('me_tasks')
        .update({
          name: task.name,
          category: task.category,
          type: task.type,
          assignee_id: task.assigneeId || null,
          product_id: task.productId || null,
          start_date: startDate,
          end_date: endDate,
          total_hours: task.totalHours || (task.type === 'root' ? (task.advancedEstimation?.totalFinalHours || 0) : 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .eq('user_id', userId);

      if (error) {
        console.warn('meSaveTaskRelational update error:', error.message);
        return { success: false, taskId: null };
      }

      return { success: true, taskId: task.id };
    }
  } catch (err) {
    console.warn('meSaveTaskRelational exception:', err.message);
    return { success: false, taskId: null };
  }
};

window.meSaveTaskSubtasksRelational = async function(taskId, subtasks, userId) {
  try {
    // Delete old subtasks for this task
    const { error: deleteError } = await supa
      .from('me_task_subtasks')
      .delete()
      .eq('task_id', taskId);

    if (deleteError) {
      console.warn('meSaveTaskSubtasksRelational delete error:', deleteError.message);
      return false;
    }

    // Insert new subtasks (MUST include user_id for RLS)
    if (subtasks && subtasks.length > 0) {
      const todayStr = getTodayDateString();
      const subtasksData = subtasks.map(st => ({
        task_id: taskId,
        user_id: userId,  // REQUIRED for RLS policy
        name: st.name,
        assignee_id: st.assigneeId || null,
        hours: st.hours,
        start_date: st.startDate || todayStr,
        end_date: st.endDate || todayStr,
        source: st.source || 'pert'
      }));

      const { error: insertError } = await supa
        .from('me_task_subtasks')
        .insert(subtasksData);

      if (insertError) {
        console.warn('meSaveTaskSubtasksRelational insert error:', insertError.message);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.warn('meSaveTaskSubtasksRelational exception:', err.message);
    return false;
  }
};

window.meSaveTaskPertHistoryRelational = async function(taskId, estimates, confidenceLevel, userId) {
  try {
    // Delete old history
    const { error: deleteError } = await supa
      .from('me_task_pert_history')
      .delete()
      .eq('task_id', taskId);

    if (deleteError) {
      console.warn('meSaveTaskPertHistoryRelational delete error:', deleteError.message);
      return false;
    }

    // Insert new history records (MUST include user_id for RLS)
    if (estimates && estimates.length > 0) {
      const historyData = estimates.map(est => {
        const O = parseFloat(est.optimistic) || 0;
        const ML = parseFloat(est.mostLikely) || 0;
        const P = parseFloat(est.pessimistic) || 0;
        const pertEst = (O + 4*ML + P) / 6;
        const stdDev = (P - O) / 6;
        const finalEst = pertEst + (stdDev * (confidenceLevel - 1.0));

        return {
          task_id: taskId,
          user_id: userId,  // REQUIRED for RLS policy
          estimate_id: est.id,
          name: est.name,
          optimistic: O,
          most_likely: ML,
          pessimistic: P,
          confidence_level: confidenceLevel,
          final_hours: finalEst,
          assignee_id: est.assigneeId || est.assignedTo || null
        };
      });

      const { error: insertError } = await supa
        .from('me_task_pert_history')
        .insert(historyData);

      if (insertError) {
        console.warn('meSaveTaskPertHistoryRelational insert error:', insertError.message);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.warn('meSaveTaskPertHistoryRelational exception:', err.message);
    return false;
  }
};

window.meSaveHolidayRelational = async function(userId, holiday) {
  try {
    const { error } = await supa
      .from('me_holidays')
      .upsert({
        id: holiday.id,
        user_id: userId,
        person_id: holiday.personId,
        date: holiday.date,
        type: holiday.type
      }, { onConflict: 'id' });

    if (error) {
      console.warn('meSaveHolidayRelational upsert error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('meSaveHolidayRelational exception:', err.message);
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
      subtasks: 0,
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

          // Use the returned task ID (important for newly created tasks)
          const taskId = taskResult.taskId || task.id;

          // Save subtasks if root task
          if (taskId && task.type === 'root' && task.subtasks && Array.isArray(task.subtasks)) {
            const subtasksSuccess = await meSaveTaskSubtasksRelational(taskId, task.subtasks, userId);
            if (subtasksSuccess) {
              results.subtasks += task.subtasks.length;
            }

            // Save PERT history
            if (task.advancedEstimation && task.advancedEstimation.pertData) {
              await meSaveTaskPertHistoryRelational(
                taskId,
                task.advancedEstimation.pertData.estimates,
                task.advancedEstimation.confidenceLevel || task.advancedEstimation.pertData.confidenceLevel || 1.0,
                userId
              );
            }
          }
        } else {
          results.errors.push(`Failed to migrate task: ${task.name}`);
        }
      }
    }

    // Migrate holidays
    if (jsonData.holidays && Array.isArray(jsonData.holidays)) {
      for (const holiday of jsonData.holidays) {
        const success = await meSaveHolidayRelational(userId, holiday);
        if (success) results.holidays++;
        else results.errors.push(`Failed to migrate holiday for ${holiday.personId}`);
      }
    }

    console.log('Migration complete:', results);
    return results;
  } catch (err) {
    console.warn('meMigrateJsonToRelational exception:', err.message);
    return { error: err.message };
  }
};
