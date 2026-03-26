/**
 * me-data-relational-queries.test.js
 *
 * Verifies that each Supabase operation in me-data-relational.js
 * targets the correct table and sends the expected DB column names.
 * Catches schema drift: wrong column names in payloads, wrong filter
 * columns in deletes, wrong camelCase mapping in load returns.
 */

const fs = require('fs')
const path = require('path')

const USER_ID = 'user-uuid-123'

// Globals required by the script at eval time
global.currentUser = { id: USER_ID }
global.meUUID = () => 'mock-uuid'
global.capacityTab = 'team'
global.supa = { from: jest.fn() }

const script = fs.readFileSync(
  path.resolve(__dirname, '../portals/capacity/js/me-data-relational.js'),
  'utf8'
)
eval(script) // eslint-disable-line no-eval

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── Mock helpers ─────────────────────────────────────────────

// Builds a supa mock for a simple upsert().select() chain.
function makeUpsertSupa () {
  const selectAfterUpsert = jest.fn().mockResolvedValue({ data: [{ id: 'mock-uuid' }], error: null })
  const upsertMock = jest.fn().mockReturnValue({ select: selectAfterUpsert })
  const supa = { from: jest.fn(() => ({ upsert: upsertMock })) }
  return { supa, upsertMock }
}

// Builds a supa mock for a delete().eq() chain.
function makeDeleteSupa () {
  const eqMock = jest.fn().mockResolvedValue({ error: null })
  const deleteMock = jest.fn().mockReturnValue({ eq: eqMock })
  const supa = { from: jest.fn(() => ({ delete: deleteMock })) }
  return { supa, eqMock }
}

// ─── meSaveTeamRelational ────────────────────────────────────

describe('meSaveTeamRelational', () => {
  test('upserts to me_teams with snake_case DB column names', async () => {
    const { supa, upsertMock } = makeUpsertSupa()
    global.supa = supa

    await meSaveTeamRelational(USER_ID, {
      name: 'Alice',
      hoursPerWeek: 40,
      utilisation: 0.8,
      jobTitle: 'Engineer',
      group: 'Mech',
      department: 'ME',
      startDate: '2025-01-01',
      endDate: ''
    })

    expect(supa.from).toHaveBeenCalledWith('me_teams')
    expect(upsertMock).toHaveBeenCalledWith(
      [expect.objectContaining({
        hours_per_week: 40,
        utilisation: 0.8,
        job_title: 'Engineer',
        team_group: 'Mech',
        start_date: '2025-01-01'
      })],
      { onConflict: 'id' }
    )
  })

  test('does not send camelCase keys to me_teams', async () => {
    const { supa, upsertMock } = makeUpsertSupa()
    global.supa = supa

    await meSaveTeamRelational(USER_ID, { name: 'Bob', hoursPerWeek: 35, utilisation: 1, jobTitle: 'Tech', group: '', department: 'ME', startDate: '', endDate: '' })

    const [payload] = upsertMock.mock.calls[0][0]
    expect(payload).not.toHaveProperty('hoursPerWeek')
    expect(payload).not.toHaveProperty('jobTitle')
  })

  test('does not send department column for me_teams writes', async () => {
    const { supa, upsertMock } = makeUpsertSupa()
    global.supa = supa

    await meSaveTeamRelational(USER_ID, {
      name: 'Logistics User',
      hoursPerWeek: 37,
      utilisation: 0.9,
      jobTitle: 'Technician',
      group: 'Log',
      department: 'LOG',
      startDate: '2025-01-01',
      endDate: ''
    })

    const [payload] = upsertMock.mock.calls[0][0]
    expect(payload).not.toHaveProperty('department')
  })
})

// ─── meSaveProductRelational ─────────────────────────────────

describe('meSaveProductRelational', () => {
  test('upserts to me_products with snake_case DB column names', async () => {
    const selectAfterUpsert = jest.fn().mockResolvedValue({ data: [{ id: 'mock-uuid' }], error: null })
    const upsertMock = jest.fn().mockReturnValue({ select: selectAfterUpsert })
    global.supa = { from: jest.fn(() => ({ upsert: upsertMock })) }

    await meSaveProductRelational(USER_ID, {
      id: null,
      name: 'Widget',
      productDatabaseId: null, // triggers manual lookup path
      hoursPerWeek: 5,
      department: 'ME',
      notes: null
    })

    expect(global.supa.from).toHaveBeenCalledWith('me_products')
    expect(upsertMock).toHaveBeenCalledWith(
      [expect.objectContaining({
        name: 'Widget',
        product_database_id: null,
        hours_per_week: 5
      })],
      { onConflict: 'id' }
    )
  })

  test('does not send camelCase keys to me_products', async () => {
    const selectAfterUpsert = jest.fn().mockResolvedValue({ data: [{ id: 'mock-uuid' }], error: null })
    const upsertMock = jest.fn().mockReturnValue({ select: selectAfterUpsert })
    global.supa = { from: jest.fn(() => ({ upsert: upsertMock })) }

    await meSaveProductRelational(USER_ID, { id: null, name: 'W', productDatabaseId: null, hoursPerWeek: 5, department: 'ME', notes: null })

    const [payload] = upsertMock.mock.calls[0][0]
    expect(payload).not.toHaveProperty('hoursPerWeek')
    expect(payload).not.toHaveProperty('productDatabaseId')
  })

  test('looks up me_products by product_database_id when productDatabaseId is set', async () => {
    const limitMock = jest.fn().mockResolvedValue({ data: [], error: null })
    const lookupEqMock = jest.fn(() => ({ limit: limitMock }))
    const selectLookup = jest.fn(() => ({ eq: lookupEqMock }))
    const selectAfterUpsert = jest.fn().mockResolvedValue({ data: [{ id: 'mock-uuid' }], error: null })
    const upsertMock = jest.fn().mockReturnValue({ select: selectAfterUpsert })
    global.supa = { from: jest.fn(() => ({ select: selectLookup, upsert: upsertMock })) }

    await meSaveProductRelational(USER_ID, { id: null, name: 'Widget', productDatabaseId: 'db-id-1', hoursPerWeek: 5, department: 'ME', notes: null })

    expect(lookupEqMock).toHaveBeenCalledWith('product_database_id', 'db-id-1')
  })
})

// ─── meSaveTaskRelational ─────────────────────────────────────

describe('meSaveTaskRelational', () => {
  test('upserts to me_tasks with snake_case DB column names', async () => {
    const { supa, upsertMock } = makeUpsertSupa()
    global.supa = supa

    await meSaveTaskRelational(USER_ID, {
      name: 'Design Review',
      category: 'Engineering',
      type: 'standard',
      assigneeId: 'person-1',
      productId: 'prod-1',
      startDate: '2025-06-01',
      endDate: '2025-06-30',
      totalHours: 20,
      status: 'SCHEDULED',
      department: 'ME'
    })

    expect(supa.from).toHaveBeenCalledWith('me_tasks')
    expect(upsertMock).toHaveBeenCalledWith(
      [expect.objectContaining({
        assignee_id: 'person-1',
        product_id: 'prod-1',
        start_date: expect.any(String),
        end_date: expect.any(String),
        total_hours: 20,
        status: 'SCHEDULED'
      })],
      { onConflict: 'id' }
    )
  })

  test('does not send camelCase keys to me_tasks', async () => {
    const { supa, upsertMock } = makeUpsertSupa()
    global.supa = supa

    await meSaveTaskRelational(USER_ID, { name: 'T', category: 'C', type: 'standard', assigneeId: 'p1', productId: 'pr1', startDate: '2025-01-01', endDate: '2025-01-31', totalHours: 10, status: 'SCHEDULED', department: 'ME' })

    const [payload] = upsertMock.mock.calls[0][0]
    expect(payload).not.toHaveProperty('assigneeId')
    expect(payload).not.toHaveProperty('productId')
    expect(payload).not.toHaveProperty('totalHours')
    expect(payload).not.toHaveProperty('startDate')
    expect(payload).not.toHaveProperty('endDate')
  })

  test('does not send department column for me_tasks writes', async () => {
    const { supa, upsertMock } = makeUpsertSupa()
    global.supa = supa

    await meSaveTaskRelational(USER_ID, {
      name: 'Logistics Task',
      category: 'Engineering',
      type: 'standard',
      assigneeId: 'person-1',
      productId: 'prod-1',
      startDate: '2025-06-01',
      endDate: '2025-06-30',
      totalHours: 20,
      status: 'SCHEDULED',
      department: 'UNIT6'
    })

    const [payload] = upsertMock.mock.calls[0][0]
    expect(payload).not.toHaveProperty('department')
  })
})

// ─── meSaveProductSupportHistoryRelational ────────────────────

describe('meSaveProductSupportHistoryRelational', () => {
  test('deletes by user_id then inserts rows with snake_case column names', async () => {
    const deleteEqMock = jest.fn().mockResolvedValue({ error: null })
    const insertMock = jest.fn().mockResolvedValue({ error: null })
    global.supa = {
      from: jest.fn(() => ({
        delete: jest.fn(() => ({ eq: deleteEqMock })),
        insert: insertMock
      }))
    }

    await meSaveProductSupportHistoryRelational(USER_ID, [
      {
        productId: 'prod-1',
        hoursPerWeek: 5,
        kittingHours: 3,
        bookingInOutHours: 1,
        productMovementHours: 2,
        effectiveDate: '2025-01-01',
        endDate: '',
        changeReason: '',
        notes: '',
        department: 'ME'
      }
    ])

    expect(deleteEqMock).toHaveBeenCalledWith('user_id', USER_ID)
    expect(insertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          product_id: 'prod-1',
          hours_per_week: 5,
          kitting_hours: 3,
          booking_in_out_hours: 1,
          kitting_time_booking_hours: 3,
          product_movement_hours: 2,
          effective_date: '2025-01-01'
        })
      ])
    )
  })

  test('does not filter delete by id (must clear all rows for this user)', async () => {
    const deleteEqMock = jest.fn().mockResolvedValue({ error: null })
    global.supa = {
      from: jest.fn(() => ({
        delete: jest.fn(() => ({ eq: deleteEqMock })),
        insert: jest.fn().mockResolvedValue({ error: null })
      }))
    }

    await meSaveProductSupportHistoryRelational(USER_ID, [
      { productId: 'p1', hoursPerWeek: 1, effectiveDate: '2025-01-01', endDate: '', changeReason: '', notes: '', department: 'ME' }
    ])

    // delete must filter by user_id, not by id
    expect(deleteEqMock).toHaveBeenCalledWith('user_id', USER_ID)
    expect(deleteEqMock).not.toHaveBeenCalledWith('id', expect.anything())
  })

  test('does not send department column for me_product_support_history writes', async () => {
    const deleteEqMock = jest.fn().mockResolvedValue({ error: null })
    const insertMock = jest.fn().mockResolvedValue({ error: null })
    global.supa = {
      from: jest.fn(() => ({
        delete: jest.fn(() => ({ eq: deleteEqMock })),
        insert: insertMock
      }))
    }

    await meSaveProductSupportHistoryRelational(USER_ID, [
      {
        productId: 'prod-1',
        hoursPerWeek: 5,
        effectiveDate: '2025-01-01',
        endDate: '',
        changeReason: '',
        notes: '',
        department: 'PM'
      }
    ])

    const [rows] = insertMock.mock.calls[0]
    expect(rows[0]).not.toHaveProperty('department')
  })
})

// ─── Delete operations ────────────────────────────────────────

describe('meDeleteTeamRelational', () => {
  test('deletes from me_teams filtered by id', async () => {
    const { supa, eqMock } = makeDeleteSupa()
    global.supa = supa
    await meDeleteTeamRelational('team-abc')
    expect(supa.from).toHaveBeenCalledWith('me_teams')
    expect(eqMock).toHaveBeenCalledWith('id', 'team-abc')
  })
})

describe('meDeleteTaskRelational', () => {
  test('deletes from me_tasks filtered by id', async () => {
    const { supa, eqMock } = makeDeleteSupa()
    global.supa = supa
    await meDeleteTaskRelational('task-xyz')
    expect(supa.from).toHaveBeenCalledWith('me_tasks')
    expect(eqMock).toHaveBeenCalledWith('id', 'task-xyz')
  })
})

describe('meDeleteProductRelational', () => {
  test('deletes from me_products filtered by id', async () => {
    const { supa, eqMock } = makeDeleteSupa()
    global.supa = supa
    await meDeleteProductRelational('prod-xyz')
    expect(supa.from).toHaveBeenCalledWith('me_products')
    expect(eqMock).toHaveBeenCalledWith('id', 'prod-xyz')
  })
})

describe('meDeleteHolidayRelational', () => {
  test('deletes from me_holidays filtered by id', async () => {
    const { supa, eqMock } = makeDeleteSupa()
    global.supa = supa
    await meDeleteHolidayRelational('hol-xyz')
    expect(supa.from).toHaveBeenCalledWith('me_holidays')
    expect(eqMock).toHaveBeenCalledWith('id', 'hol-xyz')
  })
})

// ─── Load return shape mapping ────────────────────────────────

describe('meLoadRelationalTeams', () => {
  test('maps snake_case DB row to camelCase shape', async () => {
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({
          data: [{
            id: 'team-1',
            name: 'Alice',
            hours_per_week: 40,
            utilisation: 0.85,
            job_title: 'Senior Engineer',
            team_group: 'Mech',
            department: 'ME',
            start_date: '2025-01-01',
            end_date: '',
            created_at: '2025-01-01T00:00:00Z'
          }],
          error: null
        })
      }))
    }

    const result = await meLoadRelationalTeams(USER_ID)

    expect(result[0]).toMatchObject({
      id: 'team-1',
      hoursPerWeek: 40,
      utilisation: 0.85,
      jobTitle: 'Senior Engineer',
      group: 'Mech',
      department: 'ME'
    })
    // Verify no raw snake_case keys leak into the return value
    expect(result[0]).not.toHaveProperty('hours_per_week')
    expect(result[0]).not.toHaveProperty('job_title')
    expect(result[0]).not.toHaveProperty('team_group')
  })
})

describe('meLoadRelationalTasks', () => {
  test('maps snake_case DB row to camelCase shape', async () => {
    global.supa = {
      from: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({
          data: [{
            id: 'task-1',
            name: 'Design Review',
            category: 'Engineering',
            type: 'standard',
            assignee_id: 'person-1',
            product_id: 'prod-1',
            start_date: '2025-06-01',
            end_date: '2025-06-30',
            total_hours: 20,
            status: 'SCHEDULED',
            department: 'ME',
            created_at: '2025-01-01T00:00:00Z'
          }],
          error: null
        })
      }))
    }

    const result = await meLoadRelationalTasks(USER_ID)

    expect(result[0]).toMatchObject({
      id: 'task-1',
      assigneeId: 'person-1',
      productId: 'prod-1',
      startDate: '2025-06-01',
      endDate: '2025-06-30',
      totalHours: 20
    })
    expect(result[0]).not.toHaveProperty('assignee_id')
    expect(result[0]).not.toHaveProperty('product_id')
    expect(result[0]).not.toHaveProperty('total_hours')
  })
})
