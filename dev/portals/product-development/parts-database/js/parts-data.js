// ═══════════════════════════════════
// parts-data.js — Parts Database relational data access
// Central source of truth for the standalone Parts Database subsystem
// ═══════════════════════════════════

import { supabase as supa, currentUser } from '../../../../core/js/supa.js'

export const partsDataApi = {
  async fetchCatalogue() {
    try {
      const { data, error } = await supa
        .from('abc_catalogue')
        .select('*')
        .order('item_desc')

      if (error) {
        console.warn('partsDatabase.fetchCatalogue error:', error.message)
        return []
      }

      return data || []
    } catch (err) {
      console.warn('partsDatabase.fetchCatalogue exception:', err.message)
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
        console.warn('partsDatabase.saveCatalogueEntry error:', error.message)
        return null
      }

      return (data && data[0]) || null
    } catch (err) {
      console.warn('partsDatabase.saveCatalogueEntry exception:', err.message)
      return null
    }
  },

  async deleteCatalogueEntry(id) {
    if (!id) return

    try {
      const { error } = await supa.from('abc_catalogue').delete().eq('id', id)
      if (error) console.warn('partsDatabase.deleteCatalogueEntry error:', error.message)
    } catch (err) {
      console.warn('partsDatabase.deleteCatalogueEntry exception:', err.message)
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
        console.warn('partsDatabase.fetchPartUsage items error:', itemsError.message)
      }

      const { data: treeData, error: treeError } = await supa
        .from('npi_bom_tree')
        .select('project_id, item_desc, qty, abc_catalogue_id')
        .eq('abc_catalogue_id', abcCatalogueId)

      if (treeError) {
        console.warn('partsDatabase.fetchPartUsage tree error:', treeError.message)
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
          console.warn('partsDatabase.fetchPartUsage projects error:', projectsError.message)
        }

        ;(projectsData || []).forEach((project) => {
          projectsMap[project.prog_id] = project
        })
      }

      const itemUsage = (itemsData || []).map((row) => ({
        projectId: projectsMap[row.project_id]?.id || row.project_id,
        projectName: projectsMap[row.project_id]?.name || row.project_id,
        location: 'BoM',
        qty: row.qty || 1,
        itemDesc: row.item_desc || ''
      }))

      const treeUsage = (treeData || []).map((row) => ({
        projectId: projectsMap[row.project_id]?.id || row.project_id,
        projectName: projectsMap[row.project_id]?.name || row.project_id,
        location: 'Assembly',
        qty: row.qty || 1,
        itemDesc: row.item_desc || ''
      }))

      return [...itemUsage, ...treeUsage]
    } catch (err) {
      console.warn('partsDatabase.fetchPartUsage exception:', err.message)
      return []
    }
  }
}
