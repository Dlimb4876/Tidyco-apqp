// ═══════════════════════════════════
// parts-data.js — Parts Database relational data access
// Central source of truth for the standalone Parts Database subsystem
// ═══════════════════════════════════

import { supabase as supa, currentUser } from '../../../../core/js/supa.js'
import { safeWarn } from '../../../../utils/js/helpers.js'

export const partsDataApi = {
  async fetchCatalogue() {
    try {
      const { data, error } = await supa
        .from('abc_catalogue')
        .select('*')
        .order('item_desc')

      if (error) {
        safeWarn('partsDatabase.fetchCatalogue error:', error)
        return []
      }

      return data || []
    } catch (err) {
      safeWarn('partsDatabase.fetchCatalogue exception:', err)
      return []
    }
  },

  async saveCatalogueEntry(entry) {
    if (!entry || !entry.pn || !currentUser) return null

    try {
      const { data, error } = await supa.from('abc_catalogue').upsert({
        id: entry.id || undefined,
        pn: entry.pn,
        item_desc: entry.item_desc || '',
        supplier_pn: entry.supplier_pn || null,
        unit: entry.unit || 'ea',
        notes: entry.notes || '',
        abc_class: entry.abc_class || 'C',
        in_sage: entry.in_sage || false,
        manufacturer: entry.manufacturer || null,
        manufacturer_pn: entry.manufacturer_pn || null,
        datasheet_url: entry.datasheet_url || null,
        user_id: currentUser.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' }).select('*')

      if (error) {
        safeWarn('partsDatabase.saveCatalogueEntry error:', error)
        return null
      }

      return (data && data[0]) || null
    } catch (err) {
      safeWarn('partsDatabase.saveCatalogueEntry exception:', err)
      return null
    }
  },

  async deleteCatalogueEntry(id) {
    if (!id) return

    try {
      const { error } = await supa.from('abc_catalogue').delete().eq('id', id)
      if (error) safeWarn('partsDatabase.deleteCatalogueEntry error:', error)
    } catch (err) {
      safeWarn('partsDatabase.deleteCatalogueEntry exception:', err)
    }
  },

  async fetchPartUsage(abcCatalogueId) {
    if (!abcCatalogueId) return []

    try {
      const { data: itemsData, error: itemsError } = await supa
        .from('npi_bom_items')
        .select('project_id, item_desc, qty, abc_catalogue_id')
        .eq('abc_catalogue_id', abcCatalogueId)

      if (itemsError) {
        safeWarn('partsDatabase.fetchPartUsage items error:', itemsError)
      }

      const { data: treeData, error: treeError } = await supa
        .from('npi_bom_tree')
        .select('project_id, item_desc, qty, abc_catalogue_id')
        .eq('abc_catalogue_id', abcCatalogueId)

      if (treeError) {
        safeWarn('partsDatabase.fetchPartUsage tree error:', treeError)
      }

      const projectProgIds = new Set()
      ;(itemsData || []).forEach((row) => projectProgIds.add(row.project_id))
      ;(treeData || []).forEach((row) => projectProgIds.add(row.project_id))

      const projectsMap = {}
      if (projectProgIds.size > 0) {
        const { data: projectsData, error: projectsError } = await supa
          .from('projects')
          .select('id, prog_id, name')
          .in('prog_id', Array.from(projectProgIds))

        if (projectsError) {
          safeWarn('partsDatabase.fetchPartUsage projects error:', projectsError)
        }

        ;(projectsData || []).forEach((project) => {
          projectsMap[project.prog_id] = project
        })
      }

      const itemUsage = (itemsData || []).map((row) => ({
        projectId: projectsMap[row.project_id]?.id || row.project_id,
        projectName: projectsMap[row.project_id]?.name || 'Deleted project',
        location: 'BoM',
        qty: row.qty || 1,
        itemDesc: row.item_desc || ''
      }))

      const treeUsage = (treeData || []).map((row) => ({
        projectId: projectsMap[row.project_id]?.id || row.project_id,
        projectName: projectsMap[row.project_id]?.name || 'Deleted project',
        location: 'Assembly',
        qty: row.qty || 1,
        itemDesc: row.item_desc || ''
      }))

      return [...itemUsage, ...treeUsage]
    } catch (err) {
      safeWarn('partsDatabase.fetchPartUsage exception:', err)
      return []
    }
  },

  async fetchPartUsageBatch(abcCatalogueIds) {
    if (!abcCatalogueIds || abcCatalogueIds.length === 0) {
      return {}
    }

    try {
      const { data: itemsData, error: itemsError } = await supa
        .from('npi_bom_items')
        .select('project_id, item_desc, qty, abc_catalogue_id')
        .in('abc_catalogue_id', abcCatalogueIds)

      if (itemsError) {
        safeWarn('partsDatabase.fetchPartUsageBatch items error:', itemsError)
      }

      const { data: treeData, error: treeError } = await supa
        .from('npi_bom_tree')
        .select('project_id, item_desc, qty, abc_catalogue_id')
        .in('abc_catalogue_id', abcCatalogueIds)

      if (treeError) {
        safeWarn('partsDatabase.fetchPartUsageBatch tree error:', treeError)
      }

      const projectProgIds = new Set()
      const usageMap = {}

      ;(itemsData || []).forEach((row) => {
        projectProgIds.add(row.project_id)
        if (!usageMap[row.abc_catalogue_id]) {
          usageMap[row.abc_catalogue_id] = []
        }
        usageMap[row.abc_catalogue_id].push({
          project_id: row.project_id,
          item_desc: row.item_desc,
          location: 'BoM',
          qty: row.qty || 1
        })
      })

      ;(treeData || []).forEach((row) => {
        projectProgIds.add(row.project_id)
        if (!usageMap[row.abc_catalogue_id]) {
          usageMap[row.abc_catalogue_id] = []
        }
        usageMap[row.abc_catalogue_id].push({
          project_id: row.project_id,
          item_desc: row.item_desc,
          location: 'Assembly',
          qty: row.qty || 1
        })
      })

      const projectsMap = {}
      if (projectProgIds.size > 0) {
        const { data: projectsData, error: projectsError } = await supa
          .from('projects')
          .select('id, prog_id, name')
          .in('prog_id', Array.from(projectProgIds))

        if (projectsError) {
          safeWarn('partsDatabase.fetchPartUsageBatch projects error:', projectsError)
        }

        ;(projectsData || []).forEach((project) => {
          projectsMap[project.prog_id] = project
        })
      }

      const resultMap = {}
      Object.keys(usageMap).forEach((catalogueId) => {
        resultMap[catalogueId] = usageMap[catalogueId].map((row) => ({
          projectId: projectsMap[row.project_id]?.id || row.project_id,
          projectName: projectsMap[row.project_id]?.name || 'Deleted project',
          location: row.location,
          qty: row.qty,
          itemDesc: row.item_desc || ''
        }))
      })

      return resultMap
    } catch (err) {
      safeWarn('partsDatabase.fetchPartUsageBatch exception:', err)
      return {}
    }
  }
}
