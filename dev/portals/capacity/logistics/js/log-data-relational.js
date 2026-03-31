/* ============================================================
   log-data-relational.js — Logistics Capacity Relational DB Operations
   ============================================================ */

import { supabase, currentUser } from '../../../../core/js/supa.js'
import { capUUID, capNormalizeDateRange, capNormalizeDateOnly } from '../../shared/js/cap-data-utils.js'
import { safeWarn } from '../../../../utils/js/helpers.js'

const LOG_DEPARTMENT = 'LOG'

function resolveUserId(userId) {
  return userId || (currentUser && currentUser.id) || null
}

function resolveUuid() {
  return typeof capUUID === 'function' ? capUUID() : crypto.randomUUID()
}

export async function logLoadRelationalTeams() {
  try {
    const { data, error } = await supabase.from('log_teams').select('*')
    if (error) {
      safeWarn('logLoadRelationalTeams error:', error)
      return []
    }

    return (data || []).map(t => ({
      id: t.id,
      name: t.name,
      hoursPerWeek: t.hours_per_week,
      utilisation: t.utilisation,
      jobTitle: t.job_title || '',
      group: t.team_group || '',
      department: LOG_DEPARTMENT,
      startDate: t.start_date || '',
      endDate: t.end_date || '',
      createdAt: t.created_at
    }))
  } catch (err) {
    safeWarn('logLoadRelationalTeams exception:', err)
    return []
  }
}

export async function logLoadRelationalProducts() {
  try {
    const { data, error } = await supabase.from('log_products').select('*')
    if (error) {
      safeWarn('logLoadRelationalProducts error:', error)
      return []
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name || '(Unknown Product)',
      productDatabaseId: row.product_database_id,
      hoursPerWeek: row.hours_per_week,
      department: LOG_DEPARTMENT,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  } catch (err) {
    safeWarn('logLoadRelationalProducts exception:', err)
    return []
  }
}

export async function logLoadRelationalProductSupportHistory() {
  try {
    const { data, error } = await supabase.from('log_product_support_history').select('*')
    if (error) {
      safeWarn('logLoadRelationalProductSupportHistory error:', error)
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
      department: LOG_DEPARTMENT,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  } catch (err) {
    safeWarn('logLoadRelationalProductSupportHistory exception:', err)
    return []
  }
}

export async function logLoadRelationalHolidays() {
  try {
    const { data, error } = await supabase.from('log_holidays').select('*')
    if (error) {
      safeWarn('logLoadRelationalHolidays error:', error)
      return []
    }

    return (data || []).map(h => ({
      id: h.id,
      userId: h.user_id,
      personId: h.person_id,
      date: h.date,
      type: h.type,
      department: LOG_DEPARTMENT,
      createdAt: h.created_at
    }))
  } catch (err) {
    safeWarn('logLoadRelationalHolidays exception:', err)
    return []
  }
}

export async function logLoadRelationalTasks() {
  try {
    const { data, error } = await supabase.from('log_tasks').select('*')
    if (error) {
      safeWarn('logLoadRelationalTasks error:', error)
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
      department: LOG_DEPARTMENT,
      createdAt: t.created_at
    }))
  } catch (err) {
    safeWarn('logLoadRelationalTasks exception:', err)
    return []
  }
}

export async function logSaveTeamRelational(userId, teamMember) {
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
      .from('log_teams')
      .upsert([payload], { onConflict: 'id' })
      .select('id')
    if (error) {
      safeWarn('logSaveTeamRelational error:', error)
      return false
    }

    teamMember.id = data && data.length > 0 ? data[0].id : teamId
    return true
  } catch (err) {
    safeWarn('logSaveTeamRelational exception:', err)
    return false
  }
}

export async function logSaveProductRelational(userId, product) {
  try {
    const resolvedUserId = resolveUserId(userId)
    if (!resolvedUserId) return false

    const productDatabaseId = product.productDatabaseId || product.product_database_id || null
    let productId = product.id || null

    if (productDatabaseId) {
      const { data: existingRows, error: lookupError } = await supabase
        .from('log_products')
        .select('id')
        .eq('product_database_id', productDatabaseId)
        .limit(1)

      if (lookupError) {
        safeWarn('logSaveProductRelational lookup error:', lookupError)
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
      .from('log_products')
      .upsert([payload], { onConflict: 'id' })
      .select('id')
    if (error) {
      safeWarn('logSaveProductRelational error:', error)
      return false
    }

    product.id = data && data.length > 0 ? data[0].id : productId
    return true
  } catch (err) {
    safeWarn('logSaveProductRelational exception:', err)
    return false
  }
}

export async function logSaveProductSupportHistoryRelational(userId, historyRows) {
  try {
    const resolvedUserId = resolveUserId(userId)
    if (!resolvedUserId) return false

    const rows = Array.isArray(historyRows) ? historyRows : []
    const { error: deleteError } = await supabase
      .from('log_product_support_history')
      .delete()
      .eq('user_id', resolvedUserId)
    if (deleteError) {
      safeWarn('logSavePSH delete error:', deleteError)
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

    const { error: insertError } = await supabase.from('log_product_support_history').insert(payload)
    if (insertError) {
      safeWarn('logSavePSH insert error:', insertError)
      return false
    }

    return true
  } catch (err) {
    safeWarn('logSavePSH exception:', err)
    return false
  }
}

export async function logSaveTaskRelational(userId, task) {
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
      .from('log_tasks')
      .upsert([payload], { onConflict: 'id' })
      .select('id')
    if (error) {
      safeWarn('logSaveTaskRelational error:', error)
      return { success: false, taskId: null }
    }

    task.id = data && data.length > 0 ? data[0].id : taskId
    return { success: true, taskId: task.id }
  } catch (err) {
    safeWarn('logSaveTaskRelational exception:', err)
    return { success: false, taskId: null }
  }
}

export async function logDeleteTeamRelational(teamId) {
  try {
    const { error } = await supabase.from('log_teams').delete().eq('id', teamId)
    if (error) {
      safeWarn('logDeleteTeamRelational error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('logDeleteTeamRelational exception:', err)
    return false
  }
}

export async function logDeleteTaskRelational(taskId) {
  try {
    const { error } = await supabase.from('log_tasks').delete().eq('id', taskId)
    if (error) {
      safeWarn('logDeleteTaskRelational error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('logDeleteTaskRelational exception:', err)
    return false
  }
}

export async function logDeleteProductRelational(productId) {
  try {
    const { error } = await supabase.from('log_products').delete().eq('id', productId)
    if (error) {
      safeWarn('logDeleteProductRelational error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('logDeleteProductRelational exception:', err)
    return false
  }
}

export async function logDeleteHolidayRelational(holidayId) {
  try {
    const { error } = await supabase.from('log_holidays').delete().eq('id', holidayId)
    if (error) {
      safeWarn('logDeleteHolidayRelational error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('logDeleteHolidayRelational exception:', err)
    return false
  }
}

export async function logDeleteSupportHistoryRelational(historyId) {
  try {
    const { error } = await supabase.from('log_product_support_history').delete().eq('id', historyId)
    if (error) {
      safeWarn('logDeleteSupportHistoryRelational error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('logDeleteSupportHistoryRelational exception:', err)
    return false
  }
}

// Product-support allocation CRUD — mirrors ME pattern
export async function logLoadRelationalProductSupportAllocations() {
  try {
    const { data, error } = await supabase.from('log_product_support_allocations').select('*')
    if (error) {
      safeWarn('logLoadRelationalProductSupportAllocations error:', error)
      return []
    }
    return (data || []).map(row => ({
      id: row.id,
      productId: row.product_id,
      personId: row.person_id,
      percentage: Number(row.percentage) || 0,
      effectiveDate: row.effective_date || '',
      endDate: row.end_date || '',
      notes: row.notes || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  } catch (err) {
    safeWarn('logLoadRelationalProductSupportAllocations exception:', err)
    return []
  }
}

export async function logSaveProductSupportAllocationSet(productId, effectiveDate, rows) {
  try {
    const resolvedUserId = resolveUserId()
    if (!resolvedUserId || !productId || !effectiveDate) return false

    const prevDay = capNormalizeDateOnly(effectiveDate)
    if (prevDay) {
      const d = new Date(prevDay)
      d.setDate(d.getDate() - 1)
      const endDateStr = d.toISOString().split('T')[0]

      const { error: closeError } = await supabase
        .from('log_product_support_allocations')
        .update({ end_date: endDateStr, updated_at: new Date().toISOString() })
        .eq('product_id', productId)
        .is('end_date', null)

      if (closeError) {
        safeWarn('logSaveProductSupportAllocationSet close error:', closeError)
        return false
      }
    }

    const payload = (Array.isArray(rows) ? rows : [])
      .filter(r => r && r.personId && Number(r.percentage) > 0)
      .map(r => ({
        id: resolveUuid(),
        user_id: resolvedUserId,
        product_id: productId,
        person_id: r.personId,
        percentage: Number(r.percentage),
        effective_date: effectiveDate,
        end_date: null,
        notes: r.notes || null
      }))

    if (payload.length === 0) return true

    const { error: insertError } = await supabase
      .from('log_product_support_allocations')
      .insert(payload)
    if (insertError) {
      safeWarn('logSaveProductSupportAllocationSet insert error:', insertError)
      return false
    }
    return true
  } catch (err) {
    safeWarn('logSaveProductSupportAllocationSet exception:', err)
    return false
  }
}

export async function logDeleteProductSupportAllocation(allocationId) {
  try {
    const { error } = await supabase
      .from('log_product_support_allocations')
      .delete()
      .eq('id', allocationId)
    if (error) {
      safeWarn('logDeleteProductSupportAllocation error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('logDeleteProductSupportAllocation exception:', err)
    return false
  }
}
