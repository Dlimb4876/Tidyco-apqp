/* ============================================================
   me-data-persistence.js — ME Capacity Persistence Orchestration
   ============================================================ */

import { supabase, currentUser } from '../../../../core/js/supa.js'
import { setSyncBadge } from '../../../../core/js/db.js'
import {
  meDataState,
  meDataPendingDeletes,
  meDataSaveInProgress,
  meDataSaveQueued,
  setMeDataSaveInProgress,
  setMeDataSaveQueued,
  setMeDataInitialized
} from './me-data.js'
import {
  meNormalizeAndDedupeHolidays,
  meNormalizeAndDedupeSupportHistory
} from './me-data-normalize.js'
import {
  meApplyLatestSupportHistoryToProduct,
  meEnsureAllProductSupportHistoryBaselines,
  meDataDeleteProductSupportHistoryEntry
} from './me-data-support-history.js'
import {
  meLoadRelationalTeams,
  meLoadRelationalTasks,
  meLoadRelationalProducts,
  meLoadRelationalHolidays,
  meLoadRelationalProductSupportHistory,
  meLoadTimeLogs,
  meSaveTeamRelational,
  meSaveTaskRelational,
  meSaveProductRelational,
  meSaveProductSupportHistoryRelational,
  meDeleteTaskRelational,
  meDeleteTeamRelational,
  meDeleteSupportHistoryRelational,
  meDeleteProductRelational
} from './me-data-relational.js'
import { meCapacityDataSubscribe } from './me-data-realtime.js'
import {
  meDataAddTeam,
  meDataUpdateTeam,
  meDataDeleteTeam,
  meDataGetTeam,
  meDataAddTask,
  meDataUpdateTask,
  meDataDeleteTask,
  meDataGetTasks,
  meDataAddProduct,
  meDataUpdateProduct,
  meDataDeleteProduct,
  meDataGetProducts,
  meDataAddHoliday,
  meDataUpdateHoliday,
  meDataDeleteHoliday,
  meDataGetHolidays
} from './me-data-entities.js'

export {
  meDataState,
  meDataPendingDeletes,
  meDataSaveInProgress,
  meDataSaveQueued,
  meDataInitialized
} from './me-data.js'
export {
  meDataAddTeam,
  meDataUpdateTeam,
  meDataDeleteTeam,
  meDataGetTeam,
  meDataAddTask,
  meDataUpdateTask,
  meDataDeleteTask,
  meDataGetTasks,
  meDataAddProduct,
  meDataUpdateProduct,
  meDataDeleteProduct,
  meDataGetProducts,
  meDataAddHoliday,
  meDataUpdateHoliday,
  meDataDeleteHoliday,
  meDataGetHolidays,
  meDataDeleteProductSupportHistoryEntry
}

function meEnsureStructure() {
  if (!meDataState.team) meDataState.team = []
  if (!meDataState.tasks) meDataState.tasks = []
  if (!meDataState.products) meDataState.products = []
  if (!meDataState.holidays) meDataState.holidays = []
  if (!meDataState.productSupportHistory) meDataState.productSupportHistory = []
  if (!meDataState.timeLogs) meDataState.timeLogs = []
}

export async function meDataInit() {
  try {
    if (!supabase || !currentUser) {
      meEnsureStructure()
      return
    }

    const relState = {
      team: await meLoadRelationalTeams() || [],
      tasks: await meLoadRelationalTasks() || [],
      products: await meLoadRelationalProducts() || [],
      holidays: meNormalizeAndDedupeHolidays(await meLoadRelationalHolidays()),
      productSupportHistory: await meLoadRelationalProductSupportHistory() || []
    }

    const timeLogs = await meLoadTimeLogs().catch(() => [])

    meDataState.team = relState.team
    meDataState.tasks = relState.tasks
    meDataState.products = relState.products
    meDataState.holidays = relState.holidays
    meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(relState.productSupportHistory)
    meDataState.timeLogs = timeLogs

    meDataState.team.forEach(member => {
      if (!('jobTitle' in member)) member.jobTitle = ''
      if (!('group' in member)) member.group = ''
      if (!('department' in member)) member.department = 'ME'
      if (!('startDate' in member)) member.startDate = ''
      if (!('endDate' in member)) member.endDate = ''
    })

    meDataState.tasks.forEach(task => {
      if (!('type' in task)) task.type = 'standard'
      if (!('department' in task)) task.department = 'ME'
      if (!('status' in task)) task.status = 'SCHEDULED'
      if (!('isDisabled' in task)) task.isDisabled = false
    })

    meDataState.products.forEach(product => {
      if (!('productDatabaseId' in product)) product.productDatabaseId = ''
      if (!('department' in product)) product.department = 'ME'
      meApplyLatestSupportHistoryToProduct(product, product.department)
    })

    meEnsureAllProductSupportHistoryBaselines()
    meDataState.products.forEach(product => {
      meApplyLatestSupportHistoryToProduct(product, product.department)
    })

    meDataState.holidays = meNormalizeAndDedupeHolidays(meDataState.holidays || [])

    meDataPendingDeletes.tasks = []
    meDataPendingDeletes.teams = []
    meDataPendingDeletes.supportHistory = []
    meDataPendingDeletes.products = []

    meCapacityDataSubscribe()
  } catch (err) {
    console.warn('ME Capacity init error:', err)
  }

  meEnsureStructure()
  setMeDataInitialized(true)
}

export async function meDataSave(showAlert) {
  void showAlert
  if (meDataSaveInProgress) {
    setMeDataSaveQueued(true)
    return
  }

  setMeDataSaveInProgress(true)

  try {
    if (!supabase || !currentUser) {
      console.warn('[ME Capacity] SAVE FAILED: Supabase not available or no current user')
      return
    }

    setSyncBadge('syncing', 'Saving...')
    let relationalSuccess = true

    // Save products, team, tasks, and pending deletes FIRST so all FKs exist before holiday insert
    for (let i = 0; i < meDataState.products.length; i += 1) {
      const success = await meSaveProductRelational(currentUser.id, meDataState.products[i])
      if (!success) relationalSuccess = false
    }

    const validProductIds = new Set(meDataState.products.map(p => p.id).filter(Boolean))
    meDataState.productSupportHistory = meNormalizeAndDedupeSupportHistory(meDataState.productSupportHistory)
    const validHistory = meDataState.productSupportHistory.filter(
      row => row && row.productId && validProductIds.has(row.productId)
    )
    if (validHistory.length > 0) {
      const ok = await meSaveProductSupportHistoryRelational(currentUser.id, validHistory)
      if (!ok) relationalSuccess = false
    }

    // Team upserted before holidays so person_id FK is valid for any new team member
    for (let i = 0; i < meDataState.team.length; i += 1) {
      const success = await meSaveTeamRelational(currentUser.id, meDataState.team[i])
      if (!success) relationalSuccess = false
    }

    for (let i = 0; i < meDataState.tasks.length; i += 1) {
      const task = meDataState.tasks[i]
      if (validProductIds.size > 0 && task.productId && !validProductIds.has(task.productId)) task.productId = ''
      const result = await meSaveTaskRelational(currentUser.id, task)
      if (!result.success) relationalSuccess = false
    }

    const drainDeletes = async (arr, fn) => {
      const failed = []
      for (let i = 0; i < arr.length; i += 1) {
        const ok = await fn(arr[i])
        if (!ok) {
          failed.push(arr[i])
          relationalSuccess = false
        }
      }
      return failed
    }

    if (meDataPendingDeletes.tasks.length > 0) {
      meDataPendingDeletes.tasks = await drainDeletes(meDataPendingDeletes.tasks.slice(), meDeleteTaskRelational)
    }
    if (meDataPendingDeletes.teams.length > 0) {
      meDataPendingDeletes.teams = await drainDeletes(meDataPendingDeletes.teams.slice(), meDeleteTeamRelational)
    }
    if (meDataPendingDeletes.supportHistory.length > 0) {
      meDataPendingDeletes.supportHistory = await drainDeletes(
        meDataPendingDeletes.supportHistory.slice(),
        meDeleteSupportHistoryRelational
      )
    }
    if (meDataPendingDeletes.products.length > 0) {
      meDataPendingDeletes.products = await drainDeletes(
        meDataPendingDeletes.products.slice(),
        meDeleteProductRelational
      )
    }

    // Holidays saved last — team members are guaranteed to exist in me_teams by this point
    const seen = new Set()
    meDataState.holidays = meNormalizeAndDedupeHolidays(meDataState.holidays)
    const holidayData = (meDataState.holidays || [])
      .filter(h => {
        if (h.userId && h.userId !== currentUser.id) return false
        const key = `${h.personId}_${h.date}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map(h => ({
        id: h.id,
        user_id: currentUser.id,
        person_id: h.personId,
        date: h.date,
        type: h.type,
        department: 'ME'
      }))

    const { error: delHolErr } = await supabase.from('me_holidays').delete().eq('user_id', currentUser.id)
    if (delHolErr) {
      console.warn('Failed to clear holidays:', delHolErr.message)
      relationalSuccess = false
    } else if (holidayData.length > 0) {
      const { error: insHolErr } = await supabase.from('me_holidays').insert(holidayData)
      if (insHolErr) {
        console.warn('Failed to insert holidays:', insHolErr.message)
        relationalSuccess = false
      }
    }

    if (relationalSuccess) {
      setSyncBadge('saved', 'Saved')
    } else {
      throw new Error('Relational save failed')
    }
  } catch (err) {
    console.error('[ME Capacity] SAVE ERROR:', err.message || err)
    setSyncBadge('error', 'Save failed')
  } finally {
    setMeDataSaveInProgress(false)
    if (meDataSaveQueued) {
      setMeDataSaveQueued(false)
      await meDataSave(false)
    }
  }
}

export function meDataGetState() {
  return { ...meDataState }
}

export function meDataReset() {
  meDataState.team = []
  meDataState.tasks = []
  meDataState.products = []
  meDataState.holidays = []
  meDataState.productSupportHistory = []
  meDataState.timeLogs = []
  meDataPendingDeletes.tasks = []
  meDataPendingDeletes.teams = []
  meDataPendingDeletes.supportHistory = []
  meDataPendingDeletes.products = []
  setMeDataInitialized(false)
}

export function meDiagnostics() {
  return {
    initialized: Boolean(currentUser),
    saveInProgress: meDataSaveInProgress,
    saveQueued: meDataSaveQueued,
    hasSupabase: Boolean(supabase),
    hasCurrentUser: Boolean(currentUser),
    currentUserId: currentUser?.id || 'N/A',
    data: {
      team: meDataState.team.length,
      tasks: meDataState.tasks.length,
      products: meDataState.products.length,
      holidays: meDataState.holidays.length,
      productSupportHistory: meDataState.productSupportHistory.length
    }
  }
}
