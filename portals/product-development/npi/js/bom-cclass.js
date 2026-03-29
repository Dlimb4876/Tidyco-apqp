// ═══════════════════════════════════
// bom-cclass.js — compatibility wrapper for the standalone Parts Database system
// NPI still calls npi.bom.*, but Product Development owns the catalogue module
// ═══════════════════════════════════

import { npi } from './npi-shared.js'
import { npiBom } from './bom.js'
import { getPartsDatabase } from '../../parts-database/js/parts-database.js'
const partsDatabase = getPartsDatabase()

function bindPartsDatabaseCompatibility(target, source) {
  if (!target || !source) return

  target.renderABCCatalogueResults = function() { return source.renderCatalogueResults() }
  target.refreshABCCatalogueResults = function() { return source.refreshCatalogueResults() }
  target.renderABCCatalogue = function() { return source.renderCatalogue() }
  target.loadABCCatalogue = function() { return source.loadCatalogue() }
  target.subscribeABCCatalogue = function() { return source.subscribeCatalogue() }
  target.setABCSearch = function(value) { return source.setSearch(value) }
  target.openABCNew = function() { return source.openNew() }
  target.openABCEdit = function(index) { return source.openEdit(index) }
  target.deleteFromModal = function() { return source.deleteFromModal() }
  target.saveABCEdit = function() { return source.saveEdit() }
  target.cancelABCEdit = function() { return source.cancelEdit() }
  target.openABCDatasheetLink = function() { return source.openDatasheetLink() }
  target.updABCInline = function(index, field, value) { return source.updateInline(index, field, value) }
  target.loadPartUsageCounts = function() { return source.loadPartUsageCounts() }
  target.showWhereUsed = function(partId) { return source.showWhereUsed(partId) }
  target.closeWhereUsed = function() { return source.closeWhereUsed() }
}

bindPartsDatabaseCompatibility(npi.bom, partsDatabase)

function unsubscribeABCCatalogue() {
  if (partsDatabase && typeof partsDatabase.unsubscribeCatalogue === 'function') {
    partsDatabase.unsubscribeCatalogue()
  }
}

npi.bom.unsubscribeABCCatalogue = unsubscribeABCCatalogue

export { bindPartsDatabaseCompatibility, unsubscribeABCCatalogue }
