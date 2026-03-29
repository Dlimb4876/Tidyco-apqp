import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { jest } from '@jest/globals'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function installSharedHelperStubs() {
  global.meUUID = jest.fn(() => 'uuid-1')
  global.meGetHoursPerWeek = jest.fn((value) => {
    const numeric = Number(value)
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 37
  })
  global.meNormalizeDateOnly = jest.fn((value) => value || '2026-01-01')
  global.meNormalizeAndDedupeHolidays = jest.fn((rows) => (Array.isArray(rows) ? rows : []))
  global.meNormalizeAndDedupeSupportHistory = jest.fn((rows) => (Array.isArray(rows) ? rows : []))
  global.meNormalizeProductSupportBreakdown = jest.fn(() => ({
    hoursPerWeek: 0,
    kittingHours: 0,
    bookingInOutHours: 0,
    productMovementHours: 0
  }))
  global.meNormalizeHolidayRecord = jest.fn((row) => row)
  global.meNormalizeSupportHistoryRecord = jest.fn((row) => row)
  global.meSortSupportHistoryByDate = jest.fn((rows) => (Array.isArray(rows) ? rows : []))
  global.meGetDateMinusOneDay = jest.fn(() => '2026-01-01')
  // cap-* aliases used by capacity modules
  global.capNormalizeAndDedupeSupportHistory = global.meNormalizeAndDedupeSupportHistory
  global.capNormalizeProductSupportBreakdown = global.meNormalizeProductSupportBreakdown
  global.capUUID = global.meUUID
  global.pmSaveTeamRelational = jest.fn().mockResolvedValue(true)
  global.pmSaveTaskRelational = jest.fn().mockResolvedValue({ success: true, taskId: null })
  global.pmSaveProductRelational = jest.fn().mockResolvedValue(true)
  global.pmSaveProductSupportHistoryRelational = jest.fn().mockResolvedValue(true)
  global.logSaveTeamRelational = jest.fn().mockResolvedValue(true)
  global.logSaveTaskRelational = jest.fn().mockResolvedValue({ success: true, taskId: null })
  global.logSaveProductRelational = jest.fn().mockResolvedValue(true)
  global.logSaveProductSupportHistoryRelational = jest.fn().mockResolvedValue(true)
  global.unit6SaveTeamRelational = jest.fn().mockResolvedValue(true)
  global.unit6SaveTaskRelational = jest.fn().mockResolvedValue({ success: true, taskId: null })
  global.unit6SaveProductRelational = jest.fn().mockResolvedValue(true)
  global.unit6SaveProductSupportHistoryRelational = jest.fn().mockResolvedValue(true)
}

function installSupabaseDeleteMock() {
  const eq = jest.fn().mockResolvedValue({ error: null })
  const del = jest.fn().mockReturnValue({ eq })
  const insert = jest.fn().mockResolvedValue({ error: null })
  global.supa = {
    from: jest.fn(() => ({
      delete: del,
      insert
    }))
  }
}

async function loadScript(relativePath) {
  const fullPath = path.resolve(__dirname, '..', relativePath)
  const source = fs.readFileSync(fullPath, 'utf8')
  // Transpile ESM imports/exports for eval context and expose to global scope
  const transpiled = source
    .replace(/import\s+{[^}]+}\s+from\s+['"][^'"]+['"];?\n?/g, '')
    .replace(/export\s+async\s+function\s+(\w+)/g, 'global.$1 = async function $1')
    .replace(/export\s+function\s+(\w+)/g, 'global.$1 = function $1')
    .replace(/export\s+const\s+(\w+)/g, 'global.$1')
    .replace(/export\s+let\s+(\w+)/g, 'global.$1')
    .replace(/export\s+var\s+(\w+)/g, 'global.$1')
    .replace(/export\s+class\s+(\w+)/g, 'global.$1 = class $1')
    .replace(/export\s*\{/g, '// exports: {')
    .replace(/\}\s*from\s*['"][^'"]+['"];?/g, '}')
  eval(transpiled) // eslint-disable-line no-eval
}

beforeAll(async () => {
  installSharedHelperStubs()
  global.window = global
  // Mock supabase for the capacity data scripts
  global.supabase = { from: jest.fn(() => ({ upsert: jest.fn().mockResolvedValue({ error: null }), delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) })) }

  await loadScript('portals/capacity/project-management/js/pm-data.js')
  await loadScript('portals/capacity/logistics/js/log-data.js')
  await loadScript('portals/capacity/unit6/js/unit6-data.js')
})

beforeEach(() => {
  installSupabaseDeleteMock()
  global.currentUser = { id: 'user-1' }
  global.setSyncBadge = jest.fn()

  window.pmDataReset()
  window.logDataReset()
  window.unit6DataReset()
})

afterEach(() => {
  delete global.pmSaveTeamRelational
  delete global.pmSaveTaskRelational
  delete global.pmSaveProductRelational
  delete global.pmSaveProductSupportHistoryRelational
  delete global.pmDeleteTeamRelational
  delete global.pmDeleteTaskRelational
  delete global.logSaveTeamRelational
  delete global.logSaveTaskRelational
  delete global.logSaveProductRelational
  delete global.logSaveProductSupportHistoryRelational
  delete global.logDeleteTeamRelational
  delete global.logDeleteTaskRelational
  delete global.unit6SaveTeamRelational
  delete global.unit6SaveTaskRelational
  delete global.unit6SaveProductRelational
  delete global.unit6SaveProductSupportHistoryRelational
  delete global.unit6DeleteTeamRelational
  delete global.unit6DeleteTaskRelational
  delete global.currentUser
  delete global.setSyncBadge
  delete global.supa
})

describe('PM/LOG/UNIT6 team delete persistence', () => {
  it('queues and persists PM team deletes during save', async () => {
    window.pmDataState.team = [
      { id: 'pm-team-1', name: 'PM One', department: 'PM' }
    ]

    window.pmDataDeleteTeam(0)

    expect(window.pmDataPendingDeletes.teams).toEqual(['pm-team-1'])

    global.pmDeleteTeamRelational = jest.fn().mockResolvedValue(true)

    await window.pmDataSave(false)

    expect(global.pmDeleteTeamRelational).toHaveBeenCalledWith('pm-team-1')
    expect(window.pmDataPendingDeletes.teams).toEqual([])
  })

  it('queues and persists logistics team deletes during save', async () => {
    window.logDataState.team = [
      { id: 'log-team-1', name: 'Log One', department: 'LOG' }
    ]

    window.logDataDeleteTeam(0)

    expect(window.logDataPendingDeletes.teams).toEqual(['log-team-1'])

    global.logDeleteTeamRelational = jest.fn().mockResolvedValue(true)

    await window.logDataSave(false)

    expect(global.logDeleteTeamRelational).toHaveBeenCalledWith('log-team-1')
    expect(window.logDataPendingDeletes.teams).toEqual([])
  })

  it('queues and persists Unit 6 team deletes during save', async () => {
    window.unit6DataState.team = [
      { id: 'unit6-team-1', name: 'Unit6 One', department: 'UNIT6' }
    ]

    window.unit6DataDeleteTeam(0)

    expect(window.unit6DataPendingDeletes.teams).toEqual(['unit6-team-1'])

    global.unit6DeleteTeamRelational = jest.fn().mockResolvedValue(true)

    await window.unit6DataSave(false)

    expect(global.unit6DeleteTeamRelational).toHaveBeenCalledWith('unit6-team-1')
    expect(window.unit6DataPendingDeletes.teams).toEqual([])
  })
})
