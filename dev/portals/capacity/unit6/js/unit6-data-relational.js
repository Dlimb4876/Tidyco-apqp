/* ============================================================
   unit6-data-relational.js — Unit 6 Capacity Relational DB Operations
   ============================================================ */

import { supabase as supa, currentUser } from '../../../../core/js/supa.js'
import { capUUID, capNormalizeDateRange, capNormalizeDateOnly } from '../../shared/js/cap-data-utils.js'
import { safeWarn } from '../../../../utils/js/helpers.js'

export async function unit6LoadRelationalTeams() {
  try {
    const { data, error } = await supa.from('unit6_teams').select('*')
    if (error) {
      safeWarn('unit6LoadRelationalTeams error:', error)
      return []
    }
    return (data || []).map(t => ({
      id: t.id,
      name: t.name,
      hoursPerWeek: t.hours_per_week,
      utilisation: t.utilisation,
      jobTitle: t.job_title || '',
      group: t.team_group || '',
      department: 'UNIT6',
      startDate: t.start_date || '',
      endDate: t.end_date || '',
      createdAt: t.created_at
    }))
  } catch (err) {
    safeWarn('unit6LoadRelationalTeams exception:', err)
    return []
  }
}

export async function unit6LoadRelationalProducts() {
  try {
    const { data, error } = await supa.from('unit6_products').select('*')
    if (error) {
      safeWarn('unit6LoadRelationalProducts error:', error)
      return []
    }
    return (data || []).map(mp => ({
      id: mp.id,
      name: mp.name || '(Unknown Product)',
      productDatabaseId: mp.product_database_id,
      hoursPerWeek: mp.hours_per_week,
      department: 'UNIT6',
      notes: mp.notes,
      createdAt: mp.created_at,
      updatedAt: mp.updated_at
    }))
  } catch (err) {
    safeWarn('unit6LoadRelationalProducts exception:', err)
    return []
  }
}

export async function unit6LoadRelationalProductSupportHistory() {
  try {
    const { data, error } = await supa.from('unit6_product_support_history').select('*')
    if (error) {
      safeWarn('unit6LoadRelationalProductSupportHistory error:', error)
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
      department: 'UNIT6',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  } catch (err) {
    safeWarn('unit6LoadRelationalProductSupportHistory exception:', err)
    return []
  }
}

export async function unit6LoadRelationalHolidays() {
  try {
    const { data, error } = await supa.from('unit6_holidays').select('*')
    if (error) {
      safeWarn('unit6LoadRelationalHolidays error:', error)
      return []
    }
    return (data || []).map(h => ({
      id: h.id,
      userId: h.user_id,
      personId: h.person_id,
      date: h.date,
      type: h.type,
      department: 'UNIT6',
      createdAt: h.created_at
    }))
  } catch (err) {
    safeWarn('unit6LoadRelationalHolidays exception:', err)
    return []
  }
}

export async function unit6LoadRelationalTasks() {
  try {
    const { data, error } = await supa.from('unit6_tasks').select('*')
    if (error) {
      safeWarn('unit6LoadRelationalTasks error:', error)
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
      department: 'UNIT6',
      createdAt: t.created_at
    }))
  } catch (err) {
    safeWarn('unit6LoadRelationalTasks exception:', err)
    return []
  }
}

export async function unit6SaveTeamRelational(userId, teamMember) {
  try {
    const teamId = teamMember.id || capUUID()
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
    }
    const { data, error } = await supa.from('unit6_teams').upsert([payload], { onConflict: 'id' }).select('id')
    if (error) {
      safeWarn('unit6SaveTeamRelational error:', error)
      return false
    }
    teamMember.id = data && data.length > 0 ? data[0].id : teamId
    return true
  } catch (err) {
    safeWarn('unit6SaveTeamRelational exception:', err)
    return false
  }
}

export async function unit6SaveProductRelational(userId, product) {
  try {
    const productDatabaseId = product.productDatabaseId || product.product_database_id || null
    let productId = product.id || null

    if (productDatabaseId) {
      const { data: existing, error: lookupErr } = await supa
        .from('unit6_products')
        .select('id')
        .eq('product_database_id', productDatabaseId)
        .limit(1)
      if (!lookupErr && Array.isArray(existing) && existing.length > 0) {
        productId = existing[0].id
      }
    }
    if (!productId) productId = capUUID()

    const payload = {
      id: productId,
      user_id: userId,
      name: product.name || '',
      product_database_id: productDatabaseId,
      hours_per_week: product.hoursPerWeek || product.hours_per_week || 0,
      notes: product.notes || null,
      updated_at: new Date().toISOString()
    }
    const { data, error } = await supa.from('unit6_products').upsert([payload], { onConflict: 'id' }).select('id')
    if (error) {
      safeWarn('unit6SaveProductRelational error:', error)
      return false
    }
    product.id = data && data.length > 0 ? data[0].id : productId
    return true
  } catch (err) {
    safeWarn('unit6SaveProductRelational exception:', err)
    return false
  }
}

export async function unit6SaveProductSupportHistoryRelational(userId, historyRows) {
  try {
    const rows = Array.isArray(historyRows) ? historyRows : []
    const { error: deleteError } = await supa.from('unit6_product_support_history').delete().eq('user_id', userId)
    if (deleteError) {
      safeWarn('unit6SavePSH delete error:', deleteError)
      return false
    }
    if (rows.length === 0) return true

    const payload = rows
      .filter(row => row && row.productId && row.effectiveDate)
      .map(row => ({
        id: row.id || capUUID(),
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
      }))
    if (payload.length === 0) return true

    const { error: insertError } = await supa.from('unit6_product_support_history').insert(payload)
    if (insertError) {
      safeWarn('unit6SavePSH insert error:', insertError)
      return false
    }
    return true
  } catch (err) {
    safeWarn('unit6SavePSH exception:', err)
    return false
  }
}

export async function unit6SaveTaskRelational(userId, task) {
  try {
    const todayStr = new Date().toISOString().split('T')[0]
    const { safeStart, safeEnd } = capNormalizeDateRange(task.startDate, task.endDate, todayStr)
    const taskId = task.id || capUUID()
    task.id = taskId
    task.startDate = safeStart
    task.endDate = safeEnd

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
      status: task.status || 'SCHEDULED',
      is_disabled: task.isDisabled === true,
      updated_at: new Date().toISOString()
    }
    const { data, error } = await supa.from('unit6_tasks').upsert([payload], { onConflict: 'id' }).select('id')
    if (error) {
      safeWarn('unit6SaveTaskRelational error:', error)
      return { success: false, taskId: null }
    }
    task.id = data && data.length > 0 ? data[0].id : taskId
    return { success: true, taskId: task.id }
  } catch (err) {
    safeWarn('unit6SaveTaskRelational exception:', err)
    return { success: false, taskId: null }
  }
}

export async function unit6DeleteTeamRelational(teamId) {
  try {
    const { error } = await supa.from('unit6_teams').delete().eq('id', teamId)
    if (error) {
      safeWarn('unit6DeleteTeamRelational error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('unit6DeleteTeamRelational exception:', err)
    return false
  }
}

export async function unit6DeleteTaskRelational(taskId) {
  try {
    const { error } = await supa.from('unit6_tasks').delete().eq('id', taskId)
    if (error) {
      safeWarn('unit6DeleteTaskRelational error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('unit6DeleteTaskRelational exception:', err)
    return false
  }
}

export async function unit6DeleteProductRelational(productId) {
  try {
    const { error } = await supa.from('unit6_products').delete().eq('id', productId)
    if (error) {
      safeWarn('unit6DeleteProductRelational error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('unit6DeleteProductRelational exception:', err)
    return false
  }
}

export async function unit6DeleteHolidayRelational(holidayId) {
  try {
    const { error } = await supa.from('unit6_holidays').delete().eq('id', holidayId)
    if (error) {
      safeWarn('unit6DeleteHolidayRelational error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('unit6DeleteHolidayRelational exception:', err)
    return false
  }
}

export async function unit6DeleteSupportHistoryRelational(historyId) {
  try {
    const { error } = await supa.from('unit6_product_support_history').delete().eq('id', historyId)
    if (error) {
      safeWarn('unit6DeleteSupportHistoryRelational error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('unit6DeleteSupportHistoryRelational exception:', err)
    return false
  }
}

export function unit6HasCurrentUser() {
  return !!currentUser
}

// Product-support allocation CRUD — mirrors ME pattern
export async function unit6LoadRelationalProductSupportAllocations() {
  try {
    const { data, error } = await supa.from('unit6_product_support_allocations').select('*')
    if (error) {
      safeWarn('unit6LoadRelationalProductSupportAllocations error:', error)
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
    safeWarn('unit6LoadRelationalProductSupportAllocations exception:', err)
    return []
  }
}

export async function unit6SaveProductSupportAllocationSet(productId, effectiveDate, rows) {
  try {
    const resolvedUserId = currentUser && currentUser.id
    if (!resolvedUserId || !productId || !effectiveDate) return false

    const prevDay = capNormalizeDateOnly(effectiveDate)
    if (prevDay) {
      const d = new Date(prevDay)
      d.setDate(d.getDate() - 1)
      const endDateStr = d.toISOString().split('T')[0]

      const { error: closeError } = await supa
        .from('unit6_product_support_allocations')
        .update({ end_date: endDateStr, updated_at: new Date().toISOString() })
        .eq('product_id', productId)
        .is('end_date', null)

      if (closeError) {
        safeWarn('unit6SaveProductSupportAllocationSet close error:', closeError)
        return false
      }
    }

    const payload = (Array.isArray(rows) ? rows : [])
      .filter(r => r && r.personId && Number(r.percentage) > 0)
      .map(r => ({
        id: typeof capUUID === 'function' ? capUUID() : crypto.randomUUID(),
        user_id: resolvedUserId,
        product_id: productId,
        person_id: r.personId,
        percentage: Number(r.percentage),
        effective_date: effectiveDate,
        end_date: null,
        notes: r.notes || null
      }))

    if (payload.length === 0) return true

    const { error: insertError } = await supa
      .from('unit6_product_support_allocations')
      .insert(payload)
    if (insertError) {
      safeWarn('unit6SaveProductSupportAllocationSet insert error:', insertError)
      return false
    }
    return true
  } catch (err) {
    safeWarn('unit6SaveProductSupportAllocationSet exception:', err)
    return false
  }
}

export async function unit6DeleteProductSupportAllocation(allocationId) {
  try {
    const { error } = await supa
      .from('unit6_product_support_allocations')
      .delete()
      .eq('id', allocationId)
    if (error) {
      safeWarn('unit6DeleteProductSupportAllocation error:', error)
      return false
    }
    return true
  } catch (err) {
    safeWarn('unit6DeleteProductSupportAllocation exception:', err)
    return false
  }
}
