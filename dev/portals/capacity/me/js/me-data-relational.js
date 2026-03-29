/* ============================================================
   me-data-relational.js — ME Capacity Relational DB Operations
   ============================================================ */

import { supabase, currentUser } from '../../../../core/js/supa.js'
import { capUUID, capNormalizeDateRange } from '../../shared/js/cap-data-utils.js'

const ME_DEPARTMENT = 'ME'

function resolveUserId(userId) {
  return userId || (currentUser && currentUser.id) || null
}

function resolveUuid() {
  return typeof capUUID === 'function' ? capUUID() : crypto.randomUUID()
}

function getTodayDateString() {
  return new Date().toISOString().split('T')[0]
}

export async function meLoadRelationalTeams() {
  try {
    const { data, error } = await supabase.from('me_teams').select('*')
    if (error) {
      console.warn('meLoadRelationalTeams error:', error.message)
      return []
    }

    return (data || []).map(t => ({
      id: t.id,
      name: t.name,
      hoursPerWeek: t.hours_per_week,
      utilisation: t.utilisation,
      jobTitle: t.job_title || '',
      group: t.team_group || '',
      department: ME_DEPARTMENT,
      startDate: t.start_date || '',
      endDate: t.end_date || '',
      createdAt: t.created_at
    }))
  } catch (err) {
    console.warn('meLoadRelationalTeams exception:', err.message)
    return []
  }
}

export async function meLoadRelationalProducts() {
  try {
    const { data, error } = await supabase.from('me_products').select('*')
    if (error) {
      console.warn('meLoadRelationalProducts error:', error.message)
      return []
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name || '(Unknown Product)',
      productDatabaseId: row.product_database_id,
      hoursPerWeek: row.hours_per_week,
      department: ME_DEPARTMENT,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  } catch (err) {
    console.warn('meLoadRelationalProducts exception:', err.message)
    return []
  }
}

export async function meLoadRelationalProductSupportHistory() {
  try {
    const { data, error } = await supabase.from('me_product_support_history').select('*')
    if (error) {
      console.warn('meLoadRelationalProductSupportHistory error:', error.message)
      return []
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
      department: ME_DEPARTMENT,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  } catch (err) {
    console.warn('meLoadRelationalProductSupportHistory exception:', err.message)
    return []
  }
}

export async function meLoadRelationalHolidays() {
  try {
    const { data, error } = await supabase.from('me_holidays').select('*')
    if (error) {
      console.warn('meLoadRelationalHolidays error:', error.message)
      return []
    }

    return (data || []).map(h => ({
      id: h.id,
      userId: h.user_id,
      personId: h.person_id,
      date: h.date,
      type: h.type,
      department: ME_DEPARTMENT,
      createdAt: h.created_at
    }))
  } catch (err) {
    console.warn('meLoadRelationalHolidays exception:', err.message)
    return []
  }
}

export async function meLoadRelationalTasks() {
  try {
    const { data, error } = await supabase.from('me_tasks').select('*')
    if (error) {
      console.warn('meLoadRelationalTasks error:', error.message)
      return []
    }

    return (data || []).map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      type: t.type || 'standard',
      assigneeId: t.assignee_id || '',
      productId: t.product_id || '',
      startDate: t.start_date || '',
      endDate: t.end_date || '',
      totalHours: t.total_hours || 0,
      percentComplete: t.percent_complete || 0,
      status: t.status || 'SCHEDULED',
      isDisabled: t.is_disabled === true,
      department: ME_DEPARTMENT,
      createdAt: t.created_at
    }))
  } catch (err) {
    console.warn('meLoadRelationalTasks exception:', err.message)
    return []
  }
}

export async function meLoadTimeLogs() {
  try {
    const { data, error } = await supabase
      .from('time_logs')
      .select('id, user_id, task_id, hours_logged, log_date, notes, created_at')
      .order('log_date', { ascending: false })

    if (error) {
      console.warn('meLoadTimeLogs error:', error.message)
      return []
    }

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      taskId: row.task_id,
      hoursLogged: Number(row.hours_logged) || 0,
      logDate: row.log_date,
      notes: row.notes || '',
      createdAt: row.created_at
    }))
  } catch (err) {
    console.warn('meLoadTimeLogs exception:', err.message)
    return []
  }
}

export async function meSaveTeamRelational(userId, teamMember) {
  try {
    const resolvedUserId = resolveUserId(userId)
    if (!resolvedUserId) return false

    const teamId = teamMember.id || resolveUuid()
    const payload = {
      id: teamId,
      user_id: resolvedUserId,
      name: teamMember.name,
      hours_per_week: teamMember.hoursPerWeek,
      utilisation: teamMember.utilisation,
      job_title: teamMember.jobTitle,
      team_group: teamMember.group,
      start_date: teamMember.startDate || null,
      end_date: teamMember.endDate || null,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('me_teams')
      .upsert([payload], { onConflict: 'id' })
      .select('id')
    if (error) {
      console.warn('meSaveTeamRelational error:', error.message)
      return false
    }

    teamMember.id = data && data.length > 0 ? data[0].id : teamId
    return true
  } catch (err) {
    console.warn('meSaveTeamRelational exception:', err.message)
    return false
  }
}

export async function meSaveProductRelational(userId, product) {
  try {
    const resolvedUserId = resolveUserId(userId)
    if (!resolvedUserId) return false

    const productDatabaseId = product.productDatabaseId || product.product_database_id || null
    let productId = product.id || null

    if (productDatabaseId) {
      const { data: existingRows, error: lookupError } = await supabase
        .from('me_products')
        .select('id')
        .eq('product_database_id', productDatabaseId)
        .limit(1)

      if (lookupError) {
        console.warn('meSaveProductRelational lookup error:', lookupError.message)
        return false
      }

      if (Array.isArray(existingRows) && existingRows.length > 0 && existingRows[0].id) {
        productId = existingRows[0].id
      }
    }

    if (!productId) productId = resolveUuid()

    const payload = {
      id: productId,
      user_id: resolvedUserId,
      name: product.name || '',
      product_database_id: productDatabaseId,
      hours_per_week: product.hoursPerWeek || product.hours_per_week || 0,
      notes: product.notes || null,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('me_products')
      .upsert([payload], { onConflict: 'id' })
      .select('id')
    if (error) {
      console.warn('meSaveProductRelational error:', error.message)
      return false
    }

    product.id = data && data.length > 0 ? data[0].id : productId
    return true
  } catch (err) {
    console.warn('meSaveProductRelational exception:', err.message)
    return false
  }
}

export async function meSaveProductSupportHistoryRelational(userId, historyRows) {
  try {
    const resolvedUserId = resolveUserId(userId)
    if (!resolvedUserId) return false

    const rows = Array.isArray(historyRows) ? historyRows : []
    const { error: deleteError } = await supabase
      .from('me_product_support_history')
      .delete()
      .eq('user_id', resolvedUserId)
    if (deleteError) {
      console.warn('meSaveProductSupportHistoryRelational delete error:', deleteError.message)
      return false
    }

    if (rows.length === 0) return true

    const payload = rows
      .filter(row => row && row.productId && row.effectiveDate)
      .map(row => ({
        id: row.id || resolveUuid(),
        user_id: resolvedUserId,
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
      }))

    if (payload.length === 0) return true

    const { error: insertError } = await supabase.from('me_product_support_history').insert(payload)
    if (insertError) {
      console.warn('meSaveProductSupportHistoryRelational insert error:', insertError.message)
      return false
    }

    return true
  } catch (err) {
    console.warn('meSaveProductSupportHistoryRelational exception:', err.message)
    return false
  }
}

export async function meSaveTaskRelational(userId, task) {
  try {
    const resolvedUserId = resolveUserId(userId)
    if (!resolvedUserId) return { success: false, taskId: null }

    const today = getTodayDateString()
    const { safeStart, safeEnd } = capNormalizeDateRange(task.startDate, task.endDate, today)
    const taskId = task.id || resolveUuid()

    task.id = taskId
    task.startDate = safeStart
    task.endDate = safeEnd

    const payload = {
      id: taskId,
      user_id: resolvedUserId,
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
    }

    const { data, error } = await supabase
      .from('me_tasks')
      .upsert([payload], { onConflict: 'id' })
      .select('id')
    if (error) {
      console.warn('meSaveTaskRelational error:', error.message)
      return { success: false, taskId: null }
    }

    task.id = data && data.length > 0 ? data[0].id : taskId
    return { success: true, taskId: task.id }
  } catch (err) {
    console.warn('meSaveTaskRelational exception:', err.message)
    return { success: false, taskId: null }
  }
}

export async function meDeleteTeamRelational(teamId) {
  try {
    const { error } = await supabase.from('me_teams').delete().eq('id', teamId)
    if (error) {
      console.warn('meDeleteTeamRelational error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('meDeleteTeamRelational exception:', err.message)
    return false
  }
}

export async function meDeleteTaskRelational(taskId) {
  try {
    const { error } = await supabase.from('me_tasks').delete().eq('id', taskId)
    if (error) {
      console.warn('meDeleteTaskRelational error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('meDeleteTaskRelational exception:', err.message)
    return false
  }
}

export async function meDeleteProductRelational(productId) {
  try {
    const { error } = await supabase.from('me_products').delete().eq('id', productId)
    if (error) {
      console.warn('meDeleteProductRelational error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('meDeleteProductRelational exception:', err.message)
    return false
  }
}

export async function meDeleteHolidayRelational(holidayId) {
  try {
    const { error } = await supabase.from('me_holidays').delete().eq('id', holidayId)
    if (error) {
      console.warn('meDeleteHolidayRelational error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('meDeleteHolidayRelational exception:', err.message)
    return false
  }
}

export async function meDeleteSupportHistoryRelational(historyId) {
  try {
    const { error } = await supabase.from('me_product_support_history').delete().eq('id', historyId)
    if (error) {
      console.warn('meDeleteSupportHistoryRelational error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('meDeleteSupportHistoryRelational exception:', err.message)
    return false
  }
}

export async function meMigrateJsonToRelational(userId, jsonData) {
  try {
    const resolvedUserId = resolveUserId(userId)
    if (!resolvedUserId) return { error: 'Missing user id' }

    const results = { teams: 0, tasks: 0, products: 0, holidays: 0, errors: [] }

    if (Array.isArray(jsonData.team)) {
      for (const member of jsonData.team) {
        const success = await meSaveTeamRelational(resolvedUserId, member)
        if (success) results.teams++
        else results.errors.push(`Failed to migrate team member: ${member.name}`)
      }
    }

    if (Array.isArray(jsonData.products)) {
      for (const product of jsonData.products) {
        const success = await meSaveProductRelational(resolvedUserId, product)
        if (success) results.products++
        else results.errors.push(`Failed to migrate product: ${product.name}`)
      }
    }

    if (Array.isArray(jsonData.tasks)) {
      for (const task of jsonData.tasks) {
        const taskResult = await meSaveTaskRelational(resolvedUserId, task)
        if (taskResult.success) results.tasks++
        else results.errors.push(`Failed to migrate task: ${task.name}`)
      }
    }

    if (Array.isArray(jsonData.holidays)) {
      const holidayData = jsonData.holidays
        .filter(h => h.personId)
        .map(h => ({
          id: h.id || resolveUuid(),
          user_id: resolvedUserId,
          person_id: h.personId,
          date: h.date,
          type: h.type
        }))

      if (holidayData.length > 0) {
        await supabase.from('me_holidays').delete().eq('user_id', resolvedUserId)
        const { error: insertErr } = await supabase.from('me_holidays').insert(holidayData)
        if (!insertErr) results.holidays = holidayData.length
        else results.errors.push(`Failed to migrate holidays: ${insertErr.message}`)
      }
    }

    return results
  } catch (err) {
    console.warn('meMigrateJsonToRelational exception:', err.message)
    return { error: err.message }
  }
}
