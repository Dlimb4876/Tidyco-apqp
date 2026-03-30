/* ============================================================
   pm-data-relational.js — PM Capacity Relational DB Operations
   ============================================================ */

import { supabase, currentUser } from '../../../../core/js/supa.js'
import { capUUID, capNormalizeDateRange } from '../../shared/js/cap-data-utils.js'
import { safeWarn } from '../../../../utils/js/helpers.js'

const PM_DEPARTMENT = 'PM'

function resolveUserId(userId) {
  return userId || (currentUser && currentUser.id) || null
}

function resolveUuid() {
  return typeof capUUID === 'function' ? capUUID() : crypto.randomUUID()
}

export async function pmLoadRelationalTeams() {
  try {
    const { data, error } = await supabase.from('pm_teams').select('*')
    if (error) {
      safeWarn('pmLoadRelationalTeams error:', error)
      return []
    }

    return (data || []).map(t => ({
      id: t.id,
      name: t.name,
      hoursPerWeek: t.hours_per_week,
      utilisation: t.utilisation,
      jobTitle: t.job_title || '',
      group: t.team_group || '',
      department: PM_DEPARTMENT,
      startDate: t.start_date || '',
      endDate: t.end_date || '',
      createdAt: t.created_at
    }))
  } catch (err) {
    safeWarn('pmLoadRelationalTeams exception:', err)
    return []
  }
}

export async function pmLoadRelationalProducts() {
  try {
    const { data, error } = await supabase.from('pm_products').select('*')
    if (error) {
      safeWarn('pmLoadRelationalProducts error:', error)
      return []
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name || '(Unknown Product)',
      productDatabaseId: row.product_database_id,
      hoursPerWeek: row.hours_per_week,
      department: PM_DEPARTMENT,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  } catch (err) {
    safeWarn('pmLoadRelationalProducts exception:', err)
    return []
  }
}

export async function pmLoadRelationalProductSupportHistory() {
  try {
    const { data, error } = await supabase.from('pm_product_support_history').select('*')
    if (error) {
      safeWarn('pmLoadRelationalProductSupportHistory error:', error)
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
      department: PM_DEPARTMENT,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  } catch (err) {
    safeWarn('pmLoadRelationalProductSupportHistory exception:', err)
    return []
  }
}

export async function pmLoadRelationalHolidays() {
  try {
    const { data, error } = await supabase.from('pm_holidays').select('*')
    if (error) {
      safeWarn('pmLoadRelationalHolidays error:', error)
      return []
    }

    return (data || []).map(h => ({
      id: h.id,
      userId: h.user_id,
      personId: h.person_id,
      date: h.date,
      type: h.type,
      department: PM_DEPARTMENT,
      createdAt: h.created_at
    }))
  } catch (err) {
    safeWarn('pmLoadRelationalHolidays exception:', err)
    return []
  }
}

export async function pmLoadRelationalTasks() {
  try {
    const { data, error } = await supabase.from('pm_tasks').select('*')
    if (error) {
      safeWarn('pmLoadRelationalTasks error:', error)
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
      status: t.status || 'SCHEDULED',
      isDisabled: t.is_disabled === true,
      department: PM_DEPARTMENT,
      createdAt: t.created_at
    }))
  } catch (err) {
    safeWarn('pmLoadRelationalTasks exception:', err)
    return []
  }
}

export async function pmSaveTeamRelational(userId, teamMember) {
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
      .from('pm_teams')
      .upsert([payload], { onConflict: 'id' })
      .select('id')
    if (error) {
      safeWarn('pmSaveTeamRelational error:', error)
      return false
    }

    teamMember.id = data && data.length > 0 ? data[0].id : teamId
    return true
  } catch (err) {
    safeWarn('pmSaveTeamRelational exception:', err)
    return false
  }
}

export async function pmSaveProductRelational(userId, product) {
  try {
    const resolvedUserId = resolveUserId(userId)
    if (!resolvedUserId) return false

    const productDatabaseId = product.productDatabaseId || product.product_database_id || null
    let productId = product.id || null

    if (productDatabaseId) {
      const { data: existingRows, error: lookupError } = await supabase
        .from('pm_products')
        .select('id')
        .eq('product_database_id', productDatabaseId)
        .limit(1)

      if (lookupError) {
        safeWarn('pmSaveProductRelational lookup error:', lookupError)
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
      .from('pm_products')
      .upsert([payload], { onConflict: 'id' })
      .select('id')
    if (error) {
      safeWarn('pmSaveProductRelational error:', error)
      return false
    }

    product.id = data && data.length > 0 ? data[0].id : productId
    return true
  } catch (err) {
    safeWarn('pmSaveProductRelational exception:', err)
    return false
  }
}

export async function pmSaveProductSupportHistoryRelational(userId, historyRows) {
  try {
    const resolvedUserId = resolveUserId(userId)
    if (!resolvedUserId) return false

    const rows = Array.isArray(historyRows) ? historyRows : []
    const { error: deleteError } = await supabase
      .from('pm_product_support_history')
      .delete()
      .eq('user_id', resolvedUserId)
    if (deleteError) {
      safeWarn('pmSavePSH delete error:', deleteError)
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

    const { error: insertError } = await supabase.from('pm_product_support_history').insert(payload)
    if (insertError) {
      safeWarn('pmSavePSH insert error:', insertError)
      return false
    }

    return true
  } catch (err) {
    safeWarn('pmSavePSH exception:', err)
    return false
  }
}

export async function pmSaveTaskRelational(userId, task) {
  try {
    const resolvedUserId = resolveUserId(userId)
    if (!resolvedUserId) return { success: false, taskId: null }

    const today = new Date().toISOString().split('T')[0]
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
      status: task.status || 'SCHEDULED',
      is_disabled: task.isDisabled === true,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('pm_tasks')
      .upsert([payload], { onConflict: 'id' })
      .select('id')
    if (error) {
      safeWarn('pmSaveTaskRelational error:', error)
      return { success: false, taskId: null }
    }

    task.id = data && data.length > 0 ? data[0].id : taskId
    return { success: true, taskId: task.id }
  } catch (err) {
    safeWarn('pmSaveTaskRelational exception:', err)
    return { success: false, taskId: null }
  }
}

export async function pmDeleteTeamRelational(teamId) {
  try {
    const { error } = await supabase.from('pm_teams').delete().eq('id', teamId)
    if (error) {
      safeWarn('pmDeleteTeamRelational error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('pmDeleteTeamRelational exception:', err)
    return false
  }
}

export async function pmDeleteTaskRelational(taskId) {
  try {
    const { error } = await supabase.from('pm_tasks').delete().eq('id', taskId)
    if (error) {
      safeWarn('pmDeleteTaskRelational error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('pmDeleteTaskRelational exception:', err)
    return false
  }
}

export async function pmDeleteProductRelational(productId) {
  try {
    const { error } = await supabase.from('pm_products').delete().eq('id', productId)
    if (error) {
      safeWarn('pmDeleteProductRelational error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('pmDeleteProductRelational exception:', err)
    return false
  }
}

export async function pmDeleteHolidayRelational(holidayId) {
  try {
    const { error } = await supabase.from('pm_holidays').delete().eq('id', holidayId)
    if (error) {
      safeWarn('pmDeleteHolidayRelational error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('pmDeleteHolidayRelational exception:', err)
    return false
  }
}

export async function pmDeleteSupportHistoryRelational(historyId) {
  try {
    const { error } = await supabase.from('pm_product_support_history').delete().eq('id', historyId)
    if (error) {
      safeWarn('pmDeleteSupportHistoryRelational error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('pmDeleteSupportHistoryRelational exception:', err)
    return false
  }
}
