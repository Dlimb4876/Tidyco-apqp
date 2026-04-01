// work-areas-helpers.js
// Shared work area helpers — removes cross-portal dependency
// (products.js no longer imports directly from the capacity portal)

import { esc } from './helpers.js'
import { workAreasDataGetAll } from '../../portals/capacity/production/js/work-areas-data.js'

// Re-export so consumers only need this one import path
export { workAreasDataGetAll }

// Build <option> elements for work area dropdowns
export function getWorkAreaOptions(selected) {
  return workAreasDataGetAll()
    .map(w => `<option value="${esc(w.name)}" ${selected === w.name ? 'selected' : ''}>${esc(w.name)}</option>`)
    .join('')
}
