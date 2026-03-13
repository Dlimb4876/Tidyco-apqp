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
  const normalized = (value || fallback || 'ME').toString().trim().toUpperCase();
  return normalized === 'PM' ? 'PM' : 'ME';
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
    // Load all tasks for this user
    const { data: tasksData, error: tasksError } = await supa
      .from('me_tasks')
      .select('*');

    if (tasksError) {
      console.warn('meLoadRelationalTasks error:', tasksError.message);
      return [];
    }

    // Transform to camelCase
    const tasks = (tasksData || []).map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      type: 'standard',
      assigneeId: t.assignee_id || '',
      productId: t.product_id || '',
      startDate: t.start_date || '',
      endDate: t.end_date || '',
      totalHours: t.total_hours || 0,
      department: meNormalizeDepartmentTag(t.department, 'ME'),
      createdAt: t.created_at
    }));

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
    if (!teamMember.id) {
      // Insert new team member
      const payload = {
        user_id: userId,
        name: teamMember.name,
        hours_per_week: teamMember.hoursPerWeek,
        utilisation: teamMember.utilisation,
        job_title: teamMember.jobTitle,
        team_group: teamMember.group,
        department,
        start_date: teamMember.startDate || null,
        end_date: teamMember.endDate || null
      };

      const { data, error } = await supa
        .from('me_teams')
        .insert([payload])
        .select('id');

      if (error) {
        console.warn('meSaveTeamRelational insert error:', error.message);
        return false;
      }

      const newId = data && data.length > 0 ? data[0].id : null;
      teamMember.id = newId;
      return true;
    } else {
      // Update existing team member
      const updatePayload = {
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

      const { error } = await supa
        .from('me_teams')
        .update(updatePayload)
        .eq('id', teamMember.id);

      if (error) {
        console.warn('meSaveTeamRelational update error:', error.message);
        return false;
      }
      return true;
    }
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

    if (!product.id) {
      // Insert new product
      const payload = {
        user_id: userId,
        name: product.name || '',
        product_database_id: product.productDatabaseId || null,
        support_from: supportFrom || null,
        support_until: supportUntil || null,
        hours_per_week: product.hoursPerWeek || product.hours_per_week || 0,
        department,
        notes: product.notes || null
      };

      const { data, error } = await supa
        .from('me_products')
        .insert([payload])
        .select('id');

      if (error) {
        console.warn('meSaveProductRelational insert error:', error.message);
        return false;
      }

      const newId = data && data.length > 0 ? data[0].id : null;
      product.id = newId;
      return true;
    } else {
      // Update existing product
      const updatePayload = {
        name: product.name || '',
        product_database_id: product.productDatabaseId || null,
        support_from: supportFrom || null,
        support_until: supportUntil || null,
        hours_per_week: product.hoursPerWeek || product.hours_per_week || 0,
        department,
        notes: product.notes || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supa
        .from('me_products')
        .update(updatePayload)
        .eq('id', product.id);

      if (error) {
        console.warn('meSaveProductRelational update error:', error.message);
        return false;
      }
      return true;
    }
  } catch (err) {
    console.warn('meSaveProductRelational exception:', err.message);
    return false;
  }
};

window.meSaveTaskRelational = async function(userId, task) {
  try {
    const department = meNormalizeDepartmentTag(task.department, 'ME');
    const todayStr = getTodayDateString();
    const startDate = task.startDate || todayStr;
    const endDate = task.endDate || todayStr;

    if (!task.id) {
      // Insert new task and capture the returned ID
      const payload = {
        user_id: userId,
        name: task.name,
        category: task.category,
        type: task.type,
        assignee_id: task.assigneeId || null,
        product_id: task.productId || null,
        start_date: startDate,
        end_date: endDate,
        total_hours: task.totalHours || 0,
        department
      };

      const { data, error } = await supa
        .from('me_tasks')
        .insert([payload])
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
      const updatePayload = {
        name: task.name,
        category: task.category,
        type: 'standard',
        assignee_id: task.assigneeId || null,
        product_id: task.productId || null,
        start_date: startDate,
        end_date: endDate,
        total_hours: task.totalHours || 0,
        department,
        updated_at: new Date().toISOString()
      };

      const { error } = await supa
        .from('me_tasks')
        .update(updatePayload)
        .eq('id', task.id);

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

    console.log('Migration complete:', results);
    return results;
  } catch (err) {
    console.warn('meMigrateJsonToRelational exception:', err.message);
    return { error: err.message };
  }
};
