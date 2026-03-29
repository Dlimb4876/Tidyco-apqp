// Families Data Layer
// Manages product families with Supabase persistence
// Collaborative: all users see the same data, changes sync in real-time

import { db } from '../../../core/js/state.js'
import { supabase as supa, currentUser } from '../../../core/js/supa.js'
import { showToast } from '../../../utils/js/helpers.js'
import { createRealtimeSubscription, removeRealtimeSubscription } from '../../../utils/js/realtime.js'
import { realtimePatchInsert, realtimePatchUpdate, realtimePatchDelete } from '../../../utils/js/realtime-patch.js'
import { familyTemplatesEnsureDefaultForFamily } from './family-templates-data.js'

export const familiesState = {
  families: [],
  loading: false,
  error: null,
  subscription: null
}

function syncFamiliesIntoDb() {
  db.families = [...familiesState.families]
}

export function familiesDataSubscribe() {
  if (familiesState.subscription) return familiesState.subscription

  const sub = createRealtimeSubscription('families', 'families_changed', {
    onInsert: (record) => {
      familiesState.families.push(record)
      familiesState.families.sort((a, b) => a.label.localeCompare(b.label))
      syncFamiliesIntoDb()
      if (typeof globalThis.settingsFamilyRenderRowHTML === 'function') {
        realtimePatchInsert('#families-tbody', globalThis.settingsFamilyRenderRowHTML(record), {
          sortFn: globalThis._familiesResortTbody
        })
      }
    },
    onUpdate: (record) => {
      const idx = familiesState.families.findIndex(f => f.id === record.id)
      if (idx >= 0) familiesState.families[idx] = record
      familiesState.families.sort((a, b) => a.label.localeCompare(b.label))
      syncFamiliesIntoDb()
      if (typeof globalThis.settingsFamilyRenderRowHTML === 'function' &&
          typeof globalThis.settingsFamiliesEditingId !== 'undefined' &&
          globalThis.settingsFamiliesEditingId !== record.id) {
        realtimePatchUpdate('#families-tbody', record.id, globalThis.settingsFamilyRenderRowHTML(record))
        const tbody = document.getElementById('families-tbody')
        if (tbody && typeof globalThis._familiesResortTbody === 'function') {
          globalThis._familiesResortTbody(tbody)
        }
      }
    },
    onDelete: (record) => {
      familiesState.families = familiesState.families.filter(f => f.id !== record.id)
      syncFamiliesIntoDb()
      realtimePatchDelete('#families-tbody', record.id)
    }
  })

  familiesState.subscription = sub || 'families_changed'
  return familiesState.subscription
}

export function familiesDataUnsubscribe() {
  if (!familiesState.subscription) return
  removeRealtimeSubscription(familiesState.subscription)
  familiesState.subscription = null
}

// Backward-compatible alias used by existing navigation/settings wiring
export const familiesDataCleanup = familiesDataUnsubscribe

// Initialize families from Supabase with real-time subscription
export async function familiesDataInit() {
  familiesState.loading = true
  familiesState.error = null

  try {
    await familiesDataLoad()
    familiesDataSubscribe()
    familiesState.loading = false
    return familiesState.families
  } catch (err) {
    console.error('Error initializing families:', err)
    familiesState.error = err.message
    familiesState.loading = false
    return []
  }
}

// Load families from Supabase
export async function familiesDataLoad() {
  try {
    const { data, error } = await supa.from('families')
      .select('*')
      .order('label', { ascending: true })

    if (error) throw error

    familiesState.families = data || []
    syncFamiliesIntoDb()
    return familiesState.families
  } catch (err) {
    console.error('Error loading families:', err)
    familiesState.error = err.message
    throw err
  }
}

// Add a new family
export async function familiesDataAddFamily(name, label, icon, description) {
  if (!name || !label || !currentUser?.id) return null

  const family = {
    user_id: currentUser.id,
    name: name.trim(),
    label: label.trim(),
    icon: icon || '📋',
    description: description ? description.trim() : null
  }

  try {
    const { data, error } = await supa.from('families')
      .insert([family])
      .select()

    if (error) throw error

    if (data && data[0]) {
      const newFamily = data[0]
      familiesState.families.push(newFamily)
      familiesState.families.sort((a, b) => a.label.localeCompare(b.label))
      syncFamiliesIntoDb()

      if (typeof familyTemplatesEnsureDefaultForFamily === 'function') {
        await familyTemplatesEnsureDefaultForFamily(newFamily)
      }

      return newFamily
    }
  } catch (err) {
    console.error('Error adding family:', err)
    showToast('Failed to add family: ' + err.message, 'error')
  }
  return null
}

// Update a family
export async function familiesDataUpdateFamily(familyId, updates) {
  const family = familiesState.families.find(f => f.id === familyId)
  if (!family) return false

  try {
    const { error } = await supa.from('families')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', familyId)

    if (error) throw error

    Object.assign(family, updates)
    familiesState.families.sort((a, b) => a.label.localeCompare(b.label))
    syncFamiliesIntoDb()
    return true
  } catch (err) {
    console.error('Error updating family:', err)
    showToast('Failed to update family: ' + err.message, 'error')
  }
  return false
}

// Delete a family
export async function familiesDataDeleteFamily(familyId) {
  const idx = familiesState.families.findIndex(f => f.id === familyId)
  if (idx === -1) return false

  try {
    const { error } = await supa.from('families')
      .delete()
      .eq('id', familyId)

    if (error) throw error

    familiesState.families.splice(idx, 1)
    syncFamiliesIntoDb()
    return true
  } catch (err) {
    console.error('Error deleting family:', err)
    showToast('Failed to delete family: ' + err.message, 'error')
  }
  return false
}

// Get family by ID
export function familiesDataGetFamily(familyId) {
  return familiesState.families.find(f => f.id === familyId)
}

// Get family label by ID
export function familiesDataGetFamilyLabel(familyId) {
  const family = familiesState.families.find(f => f.id === familyId)
  return family ? family.label : 'Unknown'
}

// Get all families
export function familiesDataGetAll() {
  return [...familiesState.families]
}
